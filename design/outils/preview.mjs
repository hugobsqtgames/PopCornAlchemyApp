// Local preview of .dc.html artboards: flattens each file to static HTML and screenshots it.
// Usage: node preview.mjs [Name ...]   (default: every board in project/canvas.json)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'project');
const out = path.resolve(dir, '..', 'shots');
fs.mkdirSync(out, { recursive: true });

function render(file, passed = {}, helmets = []) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8');
  const helmet = (src.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
  helmets.push(helmet);
  let body = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const propsAttr = (src.match(/data-props='([^']*)'/) || [, '{}'])[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  const decl = JSON.parse(propsAttr);
  const props = {};
  for (const [k, v] of Object.entries(decl)) if (k !== '$preview' && v && 'default' in v) props[k] = v.default;
  Object.assign(props, passed);
  const code = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  class DCLogic { constructor(p) { this.props = p; this.state = {}; } setState() {} }
  const Component = new Function('DCLogic', code + '\nreturn Component;')(DCLogic);
  const vals = new Component(props).renderVals();
  body = body.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, k) => {
    const v = k.split('.').reduce((o, p) => (o == null ? o : o[p]), vals);
    return v == null ? '' : String(v);
  });
  body = body.replace(/<sc-if value="([^"]*)"[^>]*>([\s\S]*?)<\/sc-if>/g, (_, v, inner) => (v === 'true' ? inner : ''));
  body = body.replace(/<dc-import\s+name="([^"]+)"([^>]*)><\/dc-import>/g, (_, name, attrs) => {
    const p = {};
    for (const m of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) {
      if (m[1].startsWith('hint')) continue;
      const key = m[1].replace(/-(\w)/g, (_, c) => c.toUpperCase());
      p[key] = /^-?\d+(\.\d+)?$/.test(m[2]) ? Number(m[2]) : m[2];
    }
    return render(name + '.dc.html', p, helmets).body;
  });
  return { body, helmets, preview: decl.$preview };
}

const canvas = JSON.parse(fs.readFileSync(path.join(dir, 'canvas.json'), 'utf8'));
const names = process.argv.slice(2).length ? process.argv.slice(2).map(n => n.endsWith('.dc.html') ? n : n + '.dc.html') : canvas.order;
const browser = await chromium.launch();
for (const f of names) {
  const b = canvas.boards[f];
  const r = render(f);
  const heads = [...new Set(r.helmets)].join('\n').replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '<link rel="stylesheet" href="../fonts/g.css">');
  const html = `<!doctype html><html><head><meta charset="utf-8">${heads}</head><body>${r.body}</body></html>`;
  const htmlPath = path.join(out, f.replace('.dc.html', '.html'));
  fs.writeFileSync(htmlPath, html);
  const page = await browser.newPage({ viewport: { width: b.w, height: b.h }, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath);
  await page.waitForTimeout(700);
  // report elements that overflow the artboard or clip their text
  const issues = await page.evaluate(({ W, H }) => {
    const res = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right > W + 1 || r.bottom > H + 1) res.push(`outside: <${el.tagName.toLowerCase()} class="${el.className.baseVal ?? el.className}"> ${Math.round(r.right)}x${Math.round(r.bottom)} "${(el.textContent || '').trim().slice(0, 30)}"`);
      if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') res.push(`clipped text: "${el.textContent.trim().slice(0, 30)}"`);
    }
    return res.slice(0, 12);
  }, { W: b.w, H: b.h });
  await page.screenshot({ path: path.join(out, f.replace('.dc.html', '.png')) });
  console.log(f, issues.length ? '\n  ' + issues.join('\n  ') : 'OK');
  await page.close();
}
await browser.close();
