/* Local development server for the Psychology SL study platform + Lin.
   Usage:  1) copy .env.example to .env and paste your key into GEMINI_API_KEY (or ANTHROPIC_API_KEY)
           2) npm start   (or: node server.js)
           3) open http://localhost:3000
   No dependencies: serves the static site and the /api/lin endpoint with Node's built-in http module. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

// Minimal .env loader (does not override variables already set in the environment).
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
const { respond, handleLinRequest } = require('./server/lin-core');

const ROOT = __dirname;
const PUBLIC = new Set(['index.html', 'styles.css', 'script.js', 'content.js', 'lin.css', 'lin.js']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/lin') {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 200000) req.destroy(); });
    req.on('end', async () => {
      const { status, json } = await respond(req, raw);
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(json));
    });
    return;
  }
  // Only whitelisted front-end files are served, so .env and server code can never be downloaded.
  const name = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  if (!PUBLIC.has(name)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  fs.readFile(path.join(ROOT, name), (err, data) => {
    if (err) { res.writeHead(500); return res.end('Error'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream' });
    res.end(data);
  });
});

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`Psychology SL study platform → http://localhost:${PORT}`);
  handleLinRequest({ action: 'status' }).then(s => console.log(s.configured
    ? `Lin is ready (provider: ${s.provider}, model: ${s.model}).`
    : 'Lin is NOT configured: copy .env.example to .env and set GEMINI_API_KEY (or ANTHROPIC_API_KEY), then restart.'));
});
