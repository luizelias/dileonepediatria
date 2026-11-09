import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs');
const port = Number(process.env.PORT || 4173);
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
function rebuild() {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Falha ao gerar o site');
}
rebuild();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && !pathname.startsWith(`${base}/`)) { res.writeHead(302, { Location: `${base}/` }); res.end(); return; }
    pathname = pathname.slice(base.length);
    let file = path.resolve(output, `.${pathname}`);
    if (file !== output && !file.startsWith(output + path.sep)) { res.writeHead(403); res.end(); return; }
    try {
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(301, { Location: `${base}${pathname}/` }); res.end(); return; }
        file = path.join(file, 'index.html');
      }
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(output, '404.html')));
    }
  } catch { res.writeHead(400); res.end('Requisição inválida'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}${base}/`));
let timer;
const watchers = ['assets', 'content', 'scripts'].map(folder => watch(path.join(root, folder), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { try { rebuild(); } catch (error) { console.error(error.message); } }, 200);
}));
function stop() { watchers.forEach(w => w.close()); clearTimeout(timer); server.close(() => process.exit()); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
