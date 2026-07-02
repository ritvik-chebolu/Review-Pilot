import { exec, execSync, spawn } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("[Static Build] Starting static build process...");

  // 1. Build the production application
  console.log("[Static Build] Running npm run build...");
  execSync("npm run build", { cwd: __dirname, stdio: "inherit" });

  // 2. Spawn the SSR server on temporary port 3005
  console.log("[Static Build] Spawning production server temporarily...");
  
  // We can write a tiny script to import and serve on port 3005 without Bun
  const tempServerScript = `
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
  `;

  writeFileSync(join(__dirname, "temp-server.js"), tempServerScript);

  const serverProcess = spawn("node", ["temp-server.js"], {
    cwd: __dirname,
    stdio: "inherit",
  });

  // Wait 3 seconds for server to boot
  await new Promise((r) => setTimeout(r, 3000));

  const routes = [
    { path: "/", file: "index.html" },
    { path: "/login", file: "login.html" },
    { path: "/signup", file: "signup.html" },
    { path: "/dashboard", file: "dashboard.html" },
    { path: "/dashboard/reviews", file: "dashboard/reviews.html" },
    { path: "/dashboard/settings", file: "dashboard/settings.html" },
  ];

  const staticDir = join(__dirname, "dist/static");
  if (!existsSync(staticDir)) {
    mkdirSync(staticDir, { recursive: true });
  }

  // 3. Crawl routes and save HTML
  console.log("[Static Build] Crawling SSR pages...");
  for (const r of routes) {
    try {
      console.log(`[Static Build] Crawling ${r.path} -> dist/static/${r.file}`);
      const res = await fetch(`http://127.0.0.1:3005${r.path}?static=true`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let html = await res.text();

      // Ensure directory exists
      const targetPath = join(staticDir, r.file);
      const targetDir = dirname(targetPath);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      writeFileSync(targetPath, html);
    } catch (err) {
      console.error(`[Static Build] Failed to crawl route ${r.path}:`, err.message);
    }
  }

  // Create a 404.html to redirect all SPA requests back to index.html on GitHub Pages
  try {
    const indexHtml = await (await fetch("http://127.0.0.1:3005/?static=true")).text();
    writeFileSync(join(staticDir, "404.html"), indexHtml);
    console.log("[Static Build] Created 404.html for SPA routing fallback");
  } catch (err) {
    console.error("[Static Build] Failed to create 404.html", err.message);
  }

  // 4. Copy static assets
  console.log("[Static Build] Copying assets to dist/static/assets...");
  const clientAssets = join(__dirname, "dist/client/assets");
  const staticAssets = join(staticDir, "assets");
  if (existsSync(clientAssets)) {
    cpSync(clientAssets, staticAssets, { recursive: true });
  }

  // 5. Cleanup temp server
  console.log("[Static Build] Shutting down temp server...");
  serverProcess.kill("SIGTERM");

  console.log("[Static Build] Static build successfully completed! Files in site/dist/static");
}

main().catch(console.error);
