// Puts several screenshots side by side: node sheet.mjs out.png A B C
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const shots = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'shots');
const [out, ...names] = process.argv.slice(2);
const html = `<body style="margin:0;background:#8a8a8a;display:flex;gap:24px;align-items:flex-start;padding:12px;width:max-content">${names.map(n => `<img src="${n}.png">`).join('')}</body>`;
fs.writeFileSync(path.join(shots, '_sheet.html'), html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.goto('file://' + path.join(shots, '_sheet.html'));
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(shots, out), fullPage: true });
await b.close();
