
    import handler from './dist/server/server.js';
    import { createServer } from 'node:http';
    import { readFileSync, existsSync } from 'node:fs';
    import { join } from 'node:path';

    const server = createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3005');
      const pathname = url.pathname;

      // Serve static assets first
      if (pathname.startsWith('/assets/')) {
        const filePath = join('./dist/client', pathname);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath);
          if (pathname.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
          if (pathname.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
          res.end(content);
          return;
        }
      }

      // Fallback to SSR handler
      try {
        const fetchReq = new Request('http://localhost:3005' + req.url, {
          method: req.method,
          headers: req.headers,
        });
        const webRes = await handler.fetch(fetchReq);
        
        res.statusCode = webRes.status;
        webRes.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });
        const body = await webRes.text();
        res.end(body);
      } catch (err) {
        res.statusCode = 500;
        res.end('Server Error: ' + err.message);
      }
    });

    server.listen(3005, '127.0.0.1', () => {
      console.log('Temp SSR server listening on port 3005');
    });
  