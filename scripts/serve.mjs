// Petit serveur statique sans dépendance.
// `npm start` : rechargement automatique de la page à chaque modification (--watch)
// `npm test`  : utilisé par Playwright, sans rechargement
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8080);
const WATCH = process.argv.includes('--watch');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Script ajouté aux pages HTML en mode --watch pour les recharger après une modification
const RELOAD_SCRIPT = "<script>new EventSource('/__reload').onmessage = () => location.reload();</script>";
const clients = new Set();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (WATCH && url.pathname === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': ok\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let file = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (WATCH && type.startsWith('text/html')) {
      data = Buffer.from(String(data).replace('</body>', `${RELOAD_SCRIPT}</body>`));
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

if (WATCH) {
  let timer = null;
  fs.watch(ROOT, { recursive: true }, (event, name) => {
    if (!name || /^(node_modules|\.git|test-results|playwright-report)[\\/]/.test(name)) return;
    clearTimeout(timer);
    timer = setTimeout(() => clients.forEach((client) => client.write('data: reload\n\n')), 100);
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Portfolio : http://127.0.0.1:${PORT}/${WATCH ? ' (rechargement automatique)' : ''}`);
});
