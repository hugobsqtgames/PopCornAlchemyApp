// Serves the web build of the app for capture.mjs: node serve.mjs /tmp/pca-web (port 8768).
import fs from 'fs';
import http from 'http';
import path from 'path';

const root = path.resolve(process.argv[2] ?? '/tmp/pca-web');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.json': 'application/json', '.ico': 'image/x-icon' };
http
  .createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    // Single-page app: every unknown path is the app itself.
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PORT ?? 8768));
