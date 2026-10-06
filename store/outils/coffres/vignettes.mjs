// Renders the pictures of the chests (mobile/assets/images/chest-<kind>.png) from the very same
// 3D model as the chests screen (src/components/chest), with a transparent background.
// They are used for the small chests (lists, rewards) and when a device cannot draw 3D.
//
//   node store/outils/coffres/vignettes.mjs          (needs Playwright, run from the repo root)
import fs from 'fs';
import http from 'http';
import { createRequire } from 'module';
import path from 'path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '../../..');
const mobile = path.join(root, 'mobile');
const require = createRequire(path.join(mobile, 'package.json'));
const ts = require('typescript');
const { chromium } = createRequire(process.env.PLAYWRIGHT_FROM ?? '/opt/node22/lib/node_modules/')('playwright');

// The chest code, turned into plain JavaScript modules for the browser.
const tmp = fs.mkdtempSync('/tmp/pca-chest-');
for (const name of ['model', 'scene']) {
  const src = fs.readFileSync(path.join(mobile, 'src/components/chest', `${name}.ts`), 'utf8');
  let js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  js = js.replace(/from '\.\/(\w+)'/g, "from './$1.js'");
  fs.writeFileSync(path.join(tmp, `${name}.js`), js);
}
fs.copyFileSync(path.join(mobile, 'node_modules/three/build/three.module.js'), path.join(tmp, 'three.module.js'));
fs.writeFileSync(
  path.join(tmp, 'index.html'),
  `<!doctype html><html><body style="margin:0;background:transparent">
<canvas id="c" width="640" height="640"></canvas>
<script type="importmap">{ "imports": { "three": "./three.module.js" } }</script>
<script type="module">
  import * as THREE from 'three';
  import { ChestScene } from './scene.js';
  const kind = location.hash.slice(1);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const s = new ChestScene(kind, { reduceMotion: true });
  for (let i = 0; i < 60; i++) s.update(1 / 30);
  // Only the chest and its shadow: no halo, no sparkles.
  s.scene.traverse((o) => { if (o.isPoints || (o.material && o.material.blending === THREE.AdditiveBlending)) o.visible = false; });
  s.camera.aspect = 1;
  s.camera.fov = 30;
  s.camera.position.set(0, 1.75, 4.5);
  s.camera.lookAt(0, 0.5, 0);
  s.camera.updateProjectionMatrix();
  s.render(renderer);
  window.done = true;
</script></body></html>`,
);

const server = http
  .createServer((req, res) => {
    const file = path.join(tmp, decodeURIComponent(req.url.split(/[?#]/)[0]) || 'index.html');
    const type = file.endsWith('.js') ? 'text/javascript' : 'text/html';
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(file).pipe(res);
  })
  .listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
page.on('pageerror', (e) => console.error(e.message));
for (const kind of ['wood', 'gold', 'legend']) {
  await page.goto(`http://localhost:${port}/index.html#${kind}`);
  await page.reload();
  await page.waitForFunction(() => window.done === true);
  const out = path.join(mobile, `assets/images/chest-${kind}.png`);
  await page.locator('#c').screenshot({ path: out, omitBackground: true });
  console.log('wrote', path.relative(root, out));
}
await browser.close();
server.close();
