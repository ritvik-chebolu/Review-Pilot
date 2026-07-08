import handler from './dist/server/server.js';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const CLIENT_DIR = './dist/client';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Intercept webhook review polling trigger
  if (pathname === '/api/poll' && req.method === 'POST') {
    const POLL_SECRET = process.env.POLL_SECRET || 'reviewpilot-dev-poll-secret';
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      let body = {};
      try {
        body = JSON.parse(rawBody || '{}');
      } catch {
        // Fallback for form-urlencoded or similar
      }

      if ((body as any).secret !== POLL_SECRET) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
        return;
      }

      console.log('[API Poll] Running poll active accounts cycle...');
      const { pollActiveAccounts } = await import('../polling-service/index.js');
      const result = await pollActiveAccounts();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        ok: true,
        polled: result?.polled ?? 0,
        newReviews: result?.newReviews ?? 0,
        timestamp: new Date().toISOString(),
      }));
      return;
    } catch (err) {
      console.error('[API Poll] Error:', (err as Error).message);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
      return;
    }
  }

  // 1. Try to serve static client asset first
  const staticPath = join(CLIENT_DIR, pathname === '/' ? 'index.html' : pathname);
  if (existsSync(staticPath) && statSync(staticPath).isFile()) {
    const ext = pathname.substring(pathname.lastIndexOf('.')).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.end(readFileSync(staticPath));
    return;
  }

  // 2. Fallback to SSR handler (React start)
  try {
    // Read raw body stream for POST/PUT requests
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val !== undefined) {
        if (Array.isArray(val)) {
          val.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, val);
        }
      }
    }

    const fetchReq = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: headers,
      body: body,
      duplex: 'half', // Required for sending node request body in Web fetch
    });

    const webRes = await handler.fetch(fetchReq);
    
    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => {
      // Avoid duplicate chunked encoding headers
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, val);
      }
    });

    // Stream response body back to Node.js http response
    if (webRes.body) {
      const reader = webRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error("[NodeServer] SSR request failed:", err);
    res.statusCode = 500;
    res.end('Server Error: ' + (err as Error).message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[ReviewPilot] Production Node SSR server listening on http://${HOST}:${PORT}`);
});
