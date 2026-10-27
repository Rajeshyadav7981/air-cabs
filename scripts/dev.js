// Zero-dependency local server that mimics Vercel: serves /public and routes
// /api/<name> to the exported GET/POST handlers in /api/<name>.js.
// Run: npm run dev   (or use `npx vercel dev` for the real thing)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
      const mod = await import(pathToFileURL(join(root, "api", `${name}.js`)).href);
      const handler = mod[req.method];
      if (!handler) return res.writeHead(405).end("Method not allowed");
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
      const response = await handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/")) path += "index.html";
    const file = join(root, "public", path);
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch (err) {
    if (err.code === "ENOENT" || err.code === "ERR_MODULE_NOT_FOUND") return res.writeHead(404).end("Not found");
    console.error(err);
    res.writeHead(500).end("Server error");
  }
}).listen(PORT, () => console.log(`AirRide Cabs running → http://localhost:${PORT}`));
