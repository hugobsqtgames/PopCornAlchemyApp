// Static server for the web build with single-page fallback (so deep links work).
import fs from 'fs';
import http from 'http';
import path from 'path';

// WEB=web-money PORT=8767 serves the build made with the money switch on.
const root = new URL(`./${process.env.WEB ?? 'web'}/`, import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.json': 'application/json', '.ico': 'image/x-icon' };
http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PORT ?? 8766));
