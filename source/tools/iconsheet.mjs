// Dev check: render every icon kind on one sheet. Usage: node tools/iconsheet.mjs out.png
import fs from 'node:fs';
import path from 'node:path';
import { launch, dataUrlToBuffer } from './cdp.mjs';
import { SRC, BUILD } from './load.mjs';
const out = process.argv[2] || path.join(BUILD, 'iconsheet.png');
const page = path.join(BUILD, 'iconsheet.html'); fs.mkdirSync(BUILD, { recursive: true });
fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><canvas id="c" width="1920" height="1080"></canvas><script>${fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8')}</script>`);
const kinds = ['wolf', 'coyote', 'fox', 'puma', 'bear', 'elk', 'deer', 'moose', 'caribou', 'bison', 'beaver', 'otter', 'aspen', 'willow', 'tree', 'conifer', 'swan', 'songbird', 'collar', 'vial', 'track', 'boxes', 'map', 'urchin', 'kelp'];
const c = await launch();
try {
  const p = await c.open('file://' + page);
  const url = await p.evaluate(`(() => { const cv = document.getElementById('c'); const ctx = cv.getContext('2d'); const g = Theater.makeG(ctx); const { PAL } = Theater;
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 1920, 1080); const K = ${JSON.stringify(kinds)};
    K.forEach((k, i) => { const x = 140 + (i % 7) * 260, y = 150 + Math.floor(i / 7) * 250; g.rect(x - 110, y - 100, 220, 220, { stroke: PAL.rule, w: 1 }); g.icon(k, x, y, 150, PAL.parchment); g.text(k, x, y + 108, { size: 20, color: PAL.ink3, align: 'center' }); });
    g.casefile(1380, 820, 360, 200, { title: 'The five tallest stems', no: 'VI', sketch: 'aspen', rot: 0.035 });
    g.bands(1000, 860, 300, 150, { active: 'infer' }); g.lens('ind', 880, 930, 70);
    return cv.toDataURL('image/png'); })()`);
  fs.writeFileSync(out, dataUrlToBuffer(url)); console.log(out);
} finally { c.close(); }
