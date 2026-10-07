/* Chapter II — How can we know anything about nature? Epistemology and three research traditions.
 */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;
const COL = PAL.heather;
const LP = Theater.LENS.pos.color, LI = Theater.LENS.int.color;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the spoken text).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; let txt = b.s || b.t, i = txt.indexOf(phrase); if (i < 0) { txt = b.t; i = txt.indexOf(phrase); } return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / txt.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const yOn = (pts, x) => { for (let k = 1; k < pts.length; k++) if (x <= pts[k][0]) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts[pts.length - 1][1]; };
const TAU = Math.PI * 2;
const PANEL = '#17142A';
const inCircle = (g, x, y, r, fn) => g.with(() => { g.ctx.beginPath(); g.ctx.arc(x, y, r, 0, TAU); g.ctx.clip(); fn(); });
const check = (g, x, y, s, col, a = 1, p = 1) => g.poly([[x - s * 0.5, y], [x - s * 0.14, y + s * 0.36], [x + s * 0.52, y - s * 0.42]], { color: col, w: Math.max(3, s * 0.15), alpha: a, progress: p });
const cross = (g, x, y, s, col, a = 1) => { const w = Math.max(3, s * 0.15); g.line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { color: col, w, alpha: a }); g.line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, { color: col, w, alpha: a }); };

// A standing person in silhouette; (x, y) = feet, h = height.
// o.hat: 'cowboy' | 'cap' | 'brim'; o.prop: 'binoculars' | 'camera' | 'rifle' | 'notebook'; o.flip faces left.
function person(g, x, y, h, col, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return; const c = g.ctx;
  c.save(); c.globalAlpha *= a; c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(h / 100, h / 100);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = 7.5; c.beginPath(); c.moveTo(-5, -40); c.lineTo(-7, -3); c.moveTo(5, -40); c.lineTo(7, -3); c.stroke();
  c.beginPath(); c.moveTo(-13, -71); c.quadraticCurveTo(0, -76, 13, -71); c.lineTo(10, -36); c.lineTo(-10, -36); c.closePath(); c.fill();
  c.beginPath(); c.arc(0, -86, 10, 0, TAU); c.fill();
  const p = o.prop; c.lineWidth = 5.5; c.beginPath();
  if (p === 'binoculars' || p === 'camera') { c.moveTo(-11, -68); c.lineTo(-2, -57); c.lineTo(10, -84); c.moveTo(11, -68); c.lineTo(18, -62); c.lineTo(15, -84); }
  else if (p === 'notebook') { c.moveTo(-12, -68); c.lineTo(-16, -40); c.moveTo(12, -68); c.lineTo(19, -52); c.lineTo(9, -50); }
  else { c.moveTo(-12, -68); c.lineTo(-16, -40); c.moveTo(12, -68); c.lineTo(16, -40); }
  c.stroke();
  if (p === 'binoculars') { c.beginPath(); c.roundRect(10, -93, 13, 6.5, 2); c.roundRect(10, -85, 13, 6.5, 2); c.fill(); }
  if (p === 'camera') { c.beginPath(); c.roundRect(8, -94, 17, 13, 2); c.fill(); c.fillStyle = o.bg || PAL.bg; c.beginPath(); c.arc(19, -87.5, 3.4, 0, TAU); c.fill(); c.fillStyle = col; }
  if (p === 'notebook') { c.beginPath(); c.roundRect(5, -63, 15, 19, 2); c.fill(); }
  if (p === 'rifle') { c.lineWidth = 3.2; c.beginPath(); c.moveTo(-16, -42); c.lineTo(8, -114); c.stroke(); }
  const hat = o.hat;
  if (hat === 'cowboy') { c.beginPath(); c.ellipse(0, -94, 19, 3.8, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-9, -94); c.lineTo(-7, -106); c.quadraticCurveTo(0, -110, 7, -106); c.lineTo(9, -94); c.closePath(); c.fill(); }
  if (hat === 'cap') { c.beginPath(); c.arc(0, -89, 11, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(11, -90, 9, 2.8, 0, 0, TAU); c.fill(); }
  if (hat === 'brim') { c.beginPath(); c.ellipse(0, -94, 17, 3.2, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, -94, 9.5, Math.PI, 0); c.fill(); }
  c.restore();
}
function eye(g, x, y, s, col, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s / 100, s / 100);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 6; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-48, 0); c.quadraticCurveTo(0, -46, 48, 0); c.quadraticCurveTo(0, 46, -48, 0); c.closePath(); c.stroke();
  c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); c.restore();
}
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.4); c.bezierCurveTo(x - s * 1.2, y - s * 0.3, x - s * 0.5, y - s * 1.05, x, y - s * 0.42); c.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.2, y - s * 0.3, x, y + s * 0.4); c.fill(); }
// A balance: tilt > 0 lowers the right pan; hc puts a heart (a value) on that pan.
function balance(g, x, y, s, col, a = 1, tilt = 0, hc = null) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s / 100, s / 100);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 46); c.lineTo(0, -30); c.moveTo(-22, 46); c.lineTo(22, 46); c.stroke();
  c.beginPath(); c.arc(0, -33, 5.5, 0, TAU); c.fill();
  const dx = Math.cos(tilt) * 46, dy = Math.sin(tilt) * 46;
  c.beginPath(); c.moveTo(-dx, -30 - dy); c.lineTo(dx, -30 + dy); c.stroke();
  for (const sg of [-1, 1]) {
    const px = sg * dx, py = -30 + sg * dy;
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 15, py + 28); c.moveTo(px, py); c.lineTo(px + 15, py + 28); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(px - 19, py + 28); c.quadraticCurveTo(px, py + 40, px + 19, py + 28); c.stroke();
    if (hc && sg === 1) { c.fillStyle = hc; heartPath(c, px, py + 20, 13); c.fillStyle = col; }
  }
  c.restore();
}
function star(g, x, y, r, col, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath();
  for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
  c.closePath(); c.fill(); c.restore();
}
// Speech bubble (x, y, w, h) with a tail pointing at (tx, ty).
function bubble(g, x, y, w, h, tx, ty, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return; const c = g.ctx; const col = o.color || PAL.ink2; const fill = o.fill || PANEL;
  c.save(); c.globalAlpha *= a; c.lineWidth = o.w || 2; c.strokeStyle = col; c.fillStyle = fill; c.lineJoin = 'round';
  let p1, p2;
  if (ty > y + h) { const bx = clamp(tx, x + 22, x + w - 22); p1 = [bx - 11, y + h]; p2 = [bx + 11, y + h]; }
  else if (ty < y) { const bx = clamp(tx, x + 22, x + w - 22); p1 = [bx + 11, y]; p2 = [bx - 11, y]; }
  else if (tx < x) { const by = clamp(ty, y + 14, y + h - 14); p1 = [x, by + 9]; p2 = [x, by - 9]; }
  else { const by = clamp(ty, y + 14, y + h - 14); p1 = [x + w, by - 9]; p2 = [x + w, by + 9]; }
  c.beginPath(); c.roundRect(x, y, w, h, o.r ?? 12); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(tx, ty); c.lineTo(p2[0], p2[1]); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.strokeStyle = fill; c.lineWidth = (o.w || 2) + 2; c.stroke();
  c.restore();
}
function pie(g, x, y, r, parts, p = 1, a = 1) {
  if (a <= 0 || p <= 0) return; const c = g.ctx; const end = -Math.PI / 2 + p * TAU; let a0 = -Math.PI / 2;
  for (const pt of parts) {
    const a1 = Math.min(end, a0 + pt.v * TAU); if (a1 <= a0) break; const pop = pt.pop || 0; const mid = (a0 + a1) / 2;
    c.save(); c.globalAlpha *= a; c.translate(Math.cos(mid) * pop, Math.sin(mid) * pop);
    c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, a0, a1); c.closePath(); c.fillStyle = pt.col; c.fill(); c.strokeStyle = PAL.bg; c.lineWidth = 2.5; c.stroke(); c.restore();
    a0 += pt.v * TAU;
  }
}

// The paradigm table (shared by know-four, know-pos and know-interp) --------------
const TB = { x: 100, lw: 320, cw: 430, gap: 16, hy: 236, hh: 54, y0: 306, rh: 138, rg: 8 };
const ROWS = [
  { name: 'Ontology', q: 'What exists to be known?', icon: 'elk' },
  { name: 'Epistemology', q: 'How can we know it?', icon: 'eye' },
  { name: 'Methodology', q: 'How do we go about finding out?', icon: 'collar' },
  { name: 'Axiology', q: 'What do we value, and what do we owe?', icon: 'scale' },
];
const POS0 = [['observable regularities', 'law'], ['verification', 'verify']];
const POS1 = [['real, imperfectly known', 'fog'], ['fallible, probabilistic', 'bell'], ['designs, statistics, replication', 'plots'], ['aim at value neutrality', 'level']];
const INT = [['socially constructed, multiple', 'map'], ['understanding meanings', 'meaning'], ['interviews, texts, observation', 'interview'], ['values explicit', 'tilt']];
const cX = (c) => TB.x + TB.lw + TB.gap + c * (TB.cw + TB.gap);
const rY = (i) => TB.y0 + i * (TB.rh + TB.rg);
const colCol = (c) => (c ? LI : LP);
const TABLE_R = cX(1) + TB.cw;

function rowLabel(g, i, a, hi = 0, dx = 0) {
  if (a <= 0) return; const R = ROWS[i], x = TB.x + dx, y = rY(i);
  g.rect(x, y, TB.lw, TB.rh, { r: 6, fill: U.rgba(PAL.ink, 0.035 + 0.05 * hi), stroke: hi > 0.05 ? U.rgba(COL, 0.25 + 0.5 * hi) : PAL.rule, w: 1.2, alpha: a });
  g.rect(x, y + 16, 4, TB.rh - 32, { r: 2, fill: COL, alpha: a * (0.4 + 0.6 * hi) });
  g.text(R.name, x + 24, y + 48, { size: 36, role: 'display', color: PAL.ink, alpha: a });
  g.wrap(R.q, x + 24, y + 84, 250, { size: 21, italic: true, color: PAL.ink2, lh: 1.2, alpha: a });
  const ic = U.mix(PAL.ink3, COL, hi), ix = x + TB.lw - 38, iy = y + 38;
  if (R.icon === 'eye') eye(g, ix, iy, 40, ic, a); else if (R.icon === 'scale') balance(g, ix, iy, 42, ic, a); else g.icon(R.icon, ix, iy + 3, 44, ic, { alpha: a });
}
// Column header: labels is a string or [[str, alpha], ...] for crossfades.
function colHead(g, c, labels, a, glow = 0, dy = 0) {
  if (a <= 0) return; const x = cX(c), y = TB.hy + dy, w = TB.cw, h = TB.hh; const col = colCol(c);
  if (glow > 0) g.glow(x + 30, y + h / 2, 70, col, 0.6 * glow * a);
  g.rect(x, y, w, h, { r: 8, fill: U.rgba(col, 0.13 + 0.12 * glow), stroke: col, w: 2, alpha: a });
  g.circle(x + 30, y + h / 2, 12, { stroke: col, w: 2.5, fill: U.rgba(col, 0.25), alpha: a });
  for (const [str, la] of (typeof labels === 'string' ? [[labels, 1]] : labels)) {
    if (la <= 0) continue; let size = 20; const tw = g.measure(str, { size, weight: 600, ls: 2.4 }); if (tw > w - 76) size = Math.max(16, size * (w - 76) / tw);
    g.text(str, x + 54, y + h / 2 + size * 0.37, { size, weight: 600, ls: 2.4, color: col, alpha: a * la });
  }
}
function cellBox(g, c, i, a, filled = 0, hi = 0) {
  if (a <= 0) return; const col = colCol(c);
  g.rect(cX(c), rY(i), TB.cw, TB.rh, { r: 6, fill: U.rgba(col, 0.025 + 0.05 * filled + 0.06 * hi), stroke: U.rgba(col, 0.22 + 0.33 * filled + 0.3 * hi), w: 1.4, dash: filled > 0.5 ? null : [6, 6], alpha: a });
}
function cell(g, c, i, txt, kind, a, o = {}) {
  if (a <= 0 || !txt) return; const x = cX(c) + (o.dx || 0), y = rY(i);
  g.wrap(txt, x + 22, y + 50, TB.cw - 160, { size: 26, color: o.color || PAL.ink, lh: 1.22, alpha: a });
  glyph(g, kind, cX(c) + TB.cw - 76, y + TB.rh / 2 + 2, colCol(c), a * (o.ga ?? 1), o.t || 0, o.p ?? 1);
}
// Small pictograms for the table cells (about 120 × 100 px).
function glyph(g, kind, x, y, col, a, t = 0, p = 1) {
  if (a <= 0) return;
  switch (kind) {
    case 'law': { const jit = [3, -4, 2, -3, 4, -2]; g.line(x - 52, y + 36, x + 52, y - 34, { color: col, w: 2.5, alpha: a, progress: p }); for (let k = 0; k < 6; k++) g.circle(x - 43 + k * 17.5, y + 30 - k * 11.8 + jit[k], 5, { fill: PAL.ink2, alpha: a }); break; }
    case 'verify': { g.circle(x, y, 36, { stroke: col, w: 3, alpha: a }); check(g, x + 2, y + 2, 40, col, a, p); break; }
    case 'fog': {
      g.clip(x - 64, y - 60, 70, 120, () => g.icon('elk', x, y + 6, 96, PAL.sand, { alpha: a }));
      g.clip(x + 6, y - 60, 64, 120, () => g.icon('elk', x, y + 6, 96, PAL.sand, { alpha: a * 0.2 }));
      for (let k = 0; k < 9; k++) g.circle(x + 14 + ((k * 23) % 44), y - 34 + k * 8.5, 2.3, { fill: PAL.ink2, alpha: a * 0.55 });
      g.line(x + 6, y - 50, x + 6, y + 52, { color: col, w: 1.5, dash: [4, 5], alpha: a * 0.8 }); break;
    }
    case 'bell': {
      const pts = [], fill = []; for (let k = 0; k <= 40; k++) { const u = -1 + k / 20, px = x + u * 54, py = y + 32 - 64 * Math.exp(-u * u / (2 * 0.32 * 0.32)); pts.push([px, py]); if (Math.abs(u) <= 0.63) fill.push([px, py]); }
      g.poly([[fill[0][0], y + 32], ...fill, [fill[fill.length - 1][0], y + 32]], { fill: U.rgba(col, 0.25), color: null, w: 0, alpha: a * p });
      g.poly(pts, { color: col, w: 2.5, alpha: a, progress: p }); g.line(x - 58, y + 32, x + 58, y + 32, { color: PAL.ink3, w: 1.5, alpha: a });
      g.line(x, y + 32, x, y - 40, { color: PAL.ink, w: 1.5, dash: [4, 4], alpha: a * p }); break;
    }
    case 'plots': { for (let k = 0; k < 6; k++) { const px = x - 48 + (k % 3) * 34, py = y - 32 + Math.floor(k / 3) * 34; const on = (k + Math.floor(k / 3)) % 2 === 0; g.rect(px, py, 27, 27, { r: 3, fill: on ? U.rgba(PAL.moss, 0.45) : null, stroke: on ? PAL.moss : PAL.ink3, w: 1.6, alpha: a * clamp(p * 6 - k) }); } g.line(x - 50, y + 46, x + 52, y + 46, { color: PAL.ink3, w: 1.2, alpha: a }); break; }
    case 'level': balance(g, x, y, 90, col, a, 0); break;
    case 'tilt': balance(g, x, y, 90, col, a, 0.26, PAL.rose); break;
    case 'map': {
      const L = x - 62, T = y - 48, W = 124, H = 96;
      g.rect(L, T, W, H, { r: 3, fill: U.rgba(PAL.ink, 0.05), stroke: PAL.ink3, w: 1.5, alpha: a });
      const pl = clamp(p * 2); for (const [k, fx] of [0.3, 0.55, 0.8].entries()) g.line(L + W * fx, T, L + W * fx + 5, T + H, { color: PAL.ink2, w: 1, alpha: a * 0.6, progress: clamp(pl * 3 - k) });
      for (const [k, fy] of [0.36, 0.7].entries()) g.line(L, T + H * fy, L + W, T + H * fy - 4, { color: PAL.ink2, w: 1, alpha: a * 0.6, progress: clamp(pl * 2 - k) });
      g.poly(Array.from({ length: 25 }, (_, k) => [L + 3 + k * (W - 6) / 24, T + H * (0.86 - 0.016 * k) + 6 * Math.sin(k * 0.55)]), { color: PAL.lagoon, w: 2, alpha: a });
      const pb = clamp(p * 2 - 1); const B = [[L + 9, T + 9], [L + W * 0.64, T + 9], [L + W * 0.64, T + H * 0.52], [L + W * 0.32, T + H * 0.6], [L + 9, T + H * 0.6], [L + 9, T + 9]];
      if (pb >= 1) g.poly(B, { fill: U.rgba(PAL.violet, 0.2), color: null, w: 0, alpha: a });
      g.poly(B, { color: PAL.violet, w: 2.6, dash: [6, 4], alpha: a, progress: pb }); break;
    }
    case 'meaning': {
      g.ellipse(x, y - 18, 50, 30, { stroke: col, w: 1.3, dash: [3, 4], alpha: a * 0.6 });
      person(g, x, y + 44, 66, PAL.violet, { alpha: a });
      const cs = [PAL.ochre, PAL.moss, PAL.rose, PAL.lagoon, PAL.sand, PAL.heather];
      for (let k = 0; k < 6; k++) { const an = t * 0.45 + k * Math.PI / 3; g.circle(x + Math.cos(an) * 50, y - 18 + Math.sin(an) * 30, 5.5, { fill: cs[k], alpha: a }); } break;
    }
    case 'interview': {
      bubble(g, x - 64, y - 46, 62, 36, x - 52, y - 4, { color: col, alpha: a, r: 8 });
      for (let k = 0; k < 2; k++) g.line(x - 55, y - 35 + k * 12, x - 14 - k * 14, y - 35 + k * 12, { color: PAL.ink2, w: 2, alpha: a });
      g.rect(x + 6, y - 40, 52, 70, { r: 3, stroke: PAL.ink2, w: 2, alpha: a }); for (let k = 0; k < 5; k++) g.line(x + 14, y - 27 + k * 12, x + 50 - (k === 4 ? 16 : 0), y - 27 + k * 12, { color: PAL.ink3, w: 1.6, alpha: a });
      eye(g, x - 34, y + 26, 38, col, a); break;
    }
  }
}

Theater.chapter({
  id: 'know', roman: 'II', title: 'Knowing Nature', color: COL,
  question: 'What is knowledge, and how do we seek it?',
  casefile: { title: 'One elk herd, two lenses', sketch: 'elk' },
  intro: { t: 'Chapter two. Knowing nature: what knowledge is, and the traditions that seek it.' },
  scenes: [
    {
      id: 'know-jtb', title: 'Knowledge and justification', register: 'claim',
      beats: [
        { t: 'Epistemology is the study of knowledge: what it is, and how we get it. A classic answer says knowledge is justified true belief. You believe it, it is true, and you have good reason to believe it.',
          v: 'Three overlapping circles: BELIEF, TRUTH, JUSTIFICATION; the triple overlap glows “knowledge?”.' },
        { t: 'In 1963, Edmund Gettier showed that is not enough. A biologist glimpses a coyote, takes it for a wolf, and concludes a wolf is in the valley. One is, out of sight behind a ridge. The belief is justified and true, but it is luck, not knowledge.',
          cite: 'Gettier 1963',
          v: 'Valley scene: observer, a coyote in view, a wolf hidden behind a ridge; the belief bubble “wolf in valley” checks TRUE, then a LUCK stamp.' },
        { t: 'Where does justification come from? Empiricists answer experience; rationalists, reason. Foundationalists rest knowledge on basic beliefs; coherentists, on how beliefs support one another. And David Hume warned that no amount of past experience logically guarantees the future.',
          cite: 'Hume 1748',
          v: 'A pyramid on a foundation (foundationalism) morphs into a web of mutually supporting nodes (coherentism).' },
        { t: 'Most scientists today are fallibilists, after Charles Sanders Peirce: any belief might be wrong, so inquiry must stay open to correction. Willard Quine went further and treated epistemology itself as part of science, the study of how real knowers learn.',
          s: 'Most scientists today are fallibilists, after Charles Sanders Purse: any belief might be wrong, so inquiry must stay open to correction. Willard Quine went further and treated epistemology itself as part of science, the study of how real knowers learn.',
          cite: 'Peirce 1877; Quine 1969',
          v: 'The web stays, with one node flickering “revisable”.' },
      ],
      init() {
        // Valley for the Gettier case (side view): a hill for the observer, a valley floor, a ridge.
        const ground = [[100, 652], [180, 644], [290, 650], [360, 688], [430, 764], [520, 792], [640, 800], [740, 792], [820, 722], [890, 632], [960, 574], [1030, 598], [1100, 670], [1170, 742], [1240, 782], [1310, 792]];
        const far = []; for (let k = 0; k <= 60; k++) { const x = 100 + k * 1210 / 60; far.push([x, 528 - 58 * Math.abs(Math.sin(k * 0.19 + 0.7)) - 22 * U.noise1(k * 0.33, 7)]); }
        const r = U.rng(212); const tufts = []; for (let k = 0; k < 44; k++) { const x = 115 + r() * 1185; tufts.push({ x, y: yOn(ground, x), h: 6 + r() * 9, l: (r() - 0.5) * 6 }); }
        const hatch = []; for (let k = 0; k < 17; k++) { const x = 846 + k * 22; const y = yOn(ground, x); hatch.push([x, y + 9, x - 9, y + 30 + r() * 22]); }
        // Pyramid of beliefs (foundationalism) and the web it becomes (coherentism).
        const icons = [['track', 'collar', 'vial', 'grass'], ['wolf', 'elk', 'aspen'], ['boxes', 'map'], ['star']];
        const blocks = []; [4, 3, 2, 1].forEach((n, row) => { for (let k = 0; k < n; k++) blocks.push({ row, icon: icons[row][k], x: 840 + (k - (n - 1) / 2) * 166, y: 760 - row * 90 }); });
        const web = [[580, 700], [720, 812], [950, 812], [1110, 690], [690, 480], [905, 412], [1075, 480], [830, 615], [540, 562], [995, 622]];
        const edges = [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 8], [8, 0], [7, 0], [7, 1], [7, 2], [7, 4], [7, 5], [7, 9], [9, 3], [9, 6], [9, 2]];
        return { ground, far, tufts, hatch, blocks, web, edges };
      },
      draw(g, t, S, D) {
        const ICOL = { track: PAL.ink2, collar: PAL.ink2, vial: PAL.ink2, grass: PAL.moss, wolf: PAL.coral, elk: PAL.sand, aspen: PAL.moss, boxes: PAL.ink2, map: PAL.ink2, coyote: PAL.coral };
        // ---- Beat 0: knowledge as justified true belief (left text column).
        g.withAlpha(vis(S, 0, 1), () => {
          caps(g, 'epistemology', 110, 300, { color: COL, alpha: S.p(0, 0.8) });
          g.wrap('What is knowledge, and how do we get it?', 110, 354, 330, { size: 40, role: 'display', italic: true, color: PAL.ink, lh: 1.15, alpha: S.p(0, 1.0, 0.7) });
          const tC = cue(S, 0, 'A classic answer');
          caps(g, 'a classic answer', 110, 590, { alpha: S.tp(tC, 0.8) });
          g.wrap('Knowledge is justified true belief.', 110, 636, 290, { size: 36, role: 'display', color: COL, lh: 1.15, alpha: S.tp(tC + 0.9, 0.8) });
        });

        // ---- The Venn diagram: full size in beat 0, shrinks to a scoreboard for the Gettier case.
        const VC = { B: [-115, -65, PAL.heather, 'Belief', 'you believe it', -205, -118], T: [115, -65, PAL.mint, 'Truth', 'it is true', 205, -118], J: [0, 130, PAL.ochre, 'Justification', 'good reason to believe it', 0, 232] };
        const m = S.io(1, 1.5), vx = lerp(835, 1200, m), vy = lerp(535, 334, m), sc = lerp(1, 0.3, m), aV = S.p(0, 0.8) * (1 - S.p(2, 0.6));
        const on = { B: S.tp(cue(S, 0, 'You believe it'), 0.8), T: S.tp(cue(S, 0, 'it is true'), 0.8), J: S.tp(cue(S, 0, 'good reason'), 0.8) };
        const tJT = cue(S, 1, 'The belief is justified'), tLuck = cue(S, 1, 'but it is luck');
        const lit = { B: S.tp(tJT - 0.3, 0.5), J: S.tp(tJT + 0.5, 0.5), T: S.tp(tJT + 1.2, 0.5) };
        const luck = S.tp(tLuck, 0.5);
        if (aV > 0) g.withAlpha(aV, () => {
          for (const k of ['B', 'T', 'J']) {
            const [ox, oy, col] = VC[k]; const x = vx + ox * sc, y = vy + oy * sc, r = 195 * sc;
            g.circle(x, y, r, { stroke: PAL.ink3, w: 1.5, dash: [6, 8], alpha: 0.7 * S.p(0, 1.0, 0.3) * (1 - on[k]) });
            g.with(() => { g.ctx.globalCompositeOperation = 'lighter'; g.circle(x, y, r, { fill: U.rgba(col, 0.12 + 0.16 * lit[k]), alpha: on[k] }); });
            g.circle(x, y, r, { stroke: col, w: 2.5 + 1.5 * lit[k], alpha: on[k] });
            g.withAlpha(on[k] * (1 - m), () => {
              g.text(VC[k][3], vx + VC[k][5], vy + VC[k][6], { size: 38, role: 'display', color: col, align: 'center' });
              g.text(VC[k][4], vx + VC[k][5], vy + VC[k][6] + 32, { size: 21, italic: true, color: PAL.ink2, align: 'center' });
            });
            g.text(k, vx + VC[k][5] * sc, vy + VC[k][6] * sc + 8, { size: 23, weight: 600, color: col, align: 'center', alpha: on[k] * clamp(m * 2 - 1) });
          }
          const kA = S.tp(cue(S, 0, 'good reason') + 1.0, 0.9);
          g.glow(vx, vy + 8 * sc, 110 * sc, luck > 0 ? PAL.rose : COL, 0.5 * kA * (0.85 + 0.15 * Math.sin(t * 2.2)));
          g.text('knowledge?', vx, vy + 18, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: kA * (1 - m) });
          g.text('?', vx, vy + 14, { size: 26, role: 'display', color: PAL.ink, align: 'center', alpha: kA * clamp(m * 2 - 1) * (1 - luck) });
          cross(g, vx, vy + 6, 16, PAL.rose, luck);
        });

        // ---- Beat 1: the Gettier valley.
        const aG = vis(S, 1, 2);
        if (aG > 0) g.withAlpha(aG, () => {
          const pL = S.p(1, 1.8, 0.5);
          g.poly(D.far, { color: PAL.ink3, w: 1.4, alpha: 0.55, progress: pL });
          g.poly(D.ground, { color: PAL.ink2, w: 2.6, progress: pL });
          D.hatch.forEach(([x1, y1, x2, y2], k) => g.line(x1, y1, x2, y2, { color: PAL.ink3, w: 1.2, alpha: 0.7 * S.p(1, 0.6, 1.4 + k * 0.03) }));
          D.tufts.forEach((u, k) => { const a = S.p(1, 0.5, 0.8 + k * 0.02); g.line(u.x, u.y - 1, u.x + u.l, u.y - u.h, { color: PAL.moss, w: 1.6, alpha: 0.6 * a }); g.line(u.x + 4, u.y - 1, u.x + 4 + u.l * 0.5, u.y - u.h * 0.7, { color: PAL.moss, w: 1.4, alpha: 0.5 * a }); });
          caps(g, 'ridge', 960, 548, { align: 'center', alpha: S.p(1, 0.8, 1.8) });
          const tGl = cue(S, 1, 'A biologist glimpses'), tTake = cue(S, 1, 'takes it for a wolf'), tConc = cue(S, 1, 'and concludes'), tOne = cue(S, 1, 'One is, out of sight');
          // Observer on the hill.
          const aP = S.tp(tGl - 0.6, 0.8);
          person(g, 212, 647, 118, PAL.violet, { alpha: aP, hat: 'brim', prop: 'binoculars' });
          caps(g, 'biologist', 212, 690, { align: 'center', alpha: aP });
          // The coyote, in view on the valley floor.
          const aC = S.tp(tGl + 0.3, 0.8), cxo = 610 - 14 * S.tp(tGl, 6);
          g.icon('coyote', cxo, 766, 76, PAL.coral, { alpha: aC, flip: true });
          caps(g, 'coyote, in view', 610, 846, { align: 'center', color: PAL.coral, alpha: aC });
          g.line(240, 540, cxo - 22, 748, { color: PAL.ink2, w: 2, dash: [7, 7], alpha: 0.8 * aC, progress: S.tp(tGl + 0.6, 1.0) });
          // Thought bubble: the coyote is taken for a wolf.
          const aB = S.tp(tTake - 0.4, 0.7), sw = S.tp(tTake + 0.4, 0.9);
          if (aB > 0) {
            g.withAlpha(aB, () => {
              g.rect(120, 272, 430, 112, { r: 40, fill: PANEL, stroke: PAL.ink2, w: 2 });
              [[214, 404, 10], [212, 436, 7], [211, 462, 4.5]].forEach(([x, y, r]) => g.circle(x, y, r, { fill: PANEL, stroke: PAL.ink2, w: 1.8 }));
            });
            g.icon('coyote', 192, 330, 72, PAL.coral, { alpha: aB * (1 - sw) });
            g.icon('wolf', 192, 330, 76, PAL.coral, { alpha: aB * sw });
            g.text('“A wolf is in', 252, 322, { size: 28, role: 'display', italic: true, color: PAL.ink, alpha: S.tp(tConc, 0.8) });
            g.text('the valley.”', 252, 356, { size: 28, role: 'display', italic: true, color: PAL.ink, alpha: S.tp(tConc + 0.3, 0.8) });
          }
          // The wolf, out of sight behind the ridge.
          const aW = S.tp(tOne, 0.9);
          g.circle(1205, 724, 64, { stroke: PAL.coral, w: 1.8, dash: [5, 6], alpha: 0.8 * aW });
          g.icon('wolf', 1205, 726, 82, PAL.coral, { alpha: 0.75 * aW });
          caps(g, 'wolf, out of sight', 1205, 834, { align: 'center', color: PAL.coral, alpha: aW });
          const pS = S.tp(tOne + 0.4, 1.0); g.line(240, 540, lerp(240, 864, pS), lerp(540, 660, pS), { color: PAL.ink3, w: 1.8, dash: [3, 7], alpha: aW });
          cross(g, 866, 661, 16, PAL.ink2, S.tp(tOne + 1.3, 0.5));
          // The scoreboard: justified, true, believed... and lucky.
          const rowsC = [['believed', PAL.heather, lit.B], ['justified', PAL.ochre, lit.J], ['true', PAL.mint, lit.T]];
          rowsC.forEach(([w, col, a], k) => { const y = 300 + k * 44; g.text(w, 630, y, { size: 27, color: col, alpha: a }); check(g, 790, y - 9, 24, col, a, a); });
          if (luck > 0) {
            const s = lerp(1.5, 1, ease.outBack(luck));
            g.with(() => {
              g.ctx.translate(965, 346); g.ctx.rotate(-0.13); g.ctx.scale(s, s);
              g.rect(-118, -44, 236, 88, { r: 8, stroke: PAL.rose, w: 4.5, alpha: luck });
              g.rect(-108, -34, 216, 68, { r: 5, stroke: PAL.rose, w: 1.5, alpha: 0.7 * luck });
              g.text('LUCK', 0, 19, { size: 54, weight: 700, ls: 9, color: PAL.rose, align: 'center', alpha: luck });
            });
            g.text('not knowledge', 965, 452, { size: 32, role: 'display', italic: true, color: PAL.rose, align: 'center', alpha: S.tp(tLuck + 0.7, 0.8) });
          }
        });

        // ---- Beats 2–3: sources of justification; pyramid → web; Hume; fallibilism.
        const aS = S.p(2, 0.9, 0.3);
        if (aS <= 0) return;
        const tEmp = cue(S, 2, 'Empiricists'), tRat = cue(S, 2, 'rationalists, reason'), tFnd = cue(S, 2, 'Foundationalists'), tCoh = cue(S, 2, 'coherentists'), tHume = cue(S, 2, 'And David Hume');
        const out3 = 1 - S.p(3, 0.6);
        g.text('Where does justification come from?', 840, 312, { size: 40, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: aS * out3 });
        g.withAlpha(aS * out3, () => {
          const a1 = S.tp(tEmp, 0.8), a2 = S.tp(tRat, 0.8);
          eye(g, 140, 292, 52, PAL.ink2, a1);
          g.text('Experience', 184, 304, { size: 34, role: 'display', color: PAL.ink, alpha: a1 });
          caps(g, 'empiricists', 186, 332, { alpha: a1 });
          [[-13, 11], [13, 11], [0, -12]].forEach(([dx, dy]) => g.circle(140 + dx, 404 + dy, 6, { fill: PAL.ink2, alpha: a2 }));
          g.text('Reason', 184, 414, { size: 34, role: 'display', color: PAL.ink, alpha: a2 });
          caps(g, 'rationalists', 186, 442, { alpha: a2 });
        });
        const mo = ease.inOut(S.tp(tCoh - 0.1, 2.2));
        g.withAlpha(aS * out3, () => {
          const aF = S.tp(tFnd, 0.8);
          g.withAlpha(aF * (1 - mo), () => { caps(g, 'foundationalism', 110, 540, { color: COL }); g.wrap('Knowledge rests on basic beliefs.', 110, 578, 290, { size: 26, role: 'display', color: PAL.ink, lh: 1.2 }); });
          g.withAlpha(mo, () => { caps(g, 'coherentism', 110, 540, { color: COL }); g.wrap('Beliefs support one another.', 110, 578, 290, { size: 26, role: 'display', color: PAL.ink, lh: 1.2 }); });
          const aH = S.tp(tHume, 0.8);
          g.withAlpha(aH, () => {
            caps(g, 'hume’s warning', 110, 708, { color: PAL.ochre });
            for (let k = 0; k < 7; k++) {
              const x = 128 + k * 40, y = 772, last = k === 6, a = S.tp(tHume + 0.3 + k * 0.18, 0.4);
              g.line(x - 15, y, x + 15, y, { color: PAL.ink3, w: 1.5, alpha: a });
              if (last) { g.circle(x, y, 11, { a0: Math.PI, a1: TAU, stroke: PAL.ochre, w: 1.6, dash: [3, 3], alpha: a }); g.text('?', x, y - 20, { size: 22, weight: 600, color: PAL.ochre, align: 'center', alpha: a }); }
              else { g.circle(x, y, 10, { a0: Math.PI, a1: TAU, fill: PAL.ochre, alpha: a * 0.85 }); check(g, x, y - 26, 12, PAL.mint, a * 0.8); }
            }
            g.wrap('No amount of past experience logically guarantees the future.', 110, 818, 300, { size: 21, color: PAL.ink2, lh: 1.25 });
          });
        });
        // Foundation slab and support arrows (fade as the pyramid becomes a web).
        const aPy = S.p(2, 0.8, 0.6);
        g.withAlpha(aS * (1 - mo), () => {
          g.rect(500, 808, 680, 22, { r: 4, fill: U.rgba(PAL.ink, 0.1), stroke: PAL.ink3, w: 1.5, alpha: aPy });
          caps(g, 'foundation: basic beliefs', 840, 864, { align: 'center', color: S.tp(tFnd, 0.6) > 0 ? U.mix(PAL.ink3, COL, S.tp(tFnd, 0.6)) : PAL.ink3, alpha: aPy });
          g.glow(840, 819, 260, COL, 0.18 * S.tp(tFnd, 0.8) * aPy);
        });
        // Web edges with pulses of mutual support.
        const aE = mo * aS;
        if (aE > 0) D.edges.forEach(([i, j], e) => {
          const [x1, y1] = D.web[i], [x2, y2] = D.web[j]; g.line(x1, y1, x2, y2, { color: COL, w: 1.8, alpha: 0.55 * aE });
          const u = (t * 0.32 + e * 0.37) % 1, f = e % 2 ? u : 1 - u; g.dot(lerp(x1, x2, f), lerp(y1, y2, f), 3.2, COL, aE * 0.9, 2.4);
        });
        // Beat 3: fallibilism (a node flickers and is corrected) and Quine's naturalized epistemology.
        const tWrong = cue(S, 3, 'any belief might be wrong'), tCorr = cue(S, 3, 'open to correction'), tQuine = cue(S, 3, 'Willard Quine'), tPart = cue(S, 3, 'part of science'), tReal = cue(S, 3, 'the study of how real');
        const fl = S.tp(tWrong, 0.3) * (1 - S.tp(tCorr + 1.0, 0.4)), swap = S.tp(tCorr + 0.2, 0.9);
        const aSci = S.tp(tQuine, 1.0), eN = S.tp(tPart, 1.2);
        if (aSci > 0) {
          g.ellipse(830, 600, 360, 300, { stroke: PAL.lagoon, w: 2, dash: [9, 8], alpha: 0.8 * aSci });
          caps(g, 'science', 835, 876, { align: 'center', color: PAL.lagoon, alpha: aSci });
        }
        if (eN > 0) {
          const ex = lerp(330, 790, ease.inOut(eN)), ey = lerp(700, 348, ease.inOut(eN));
          [4, 5, 7].forEach((j, k) => g.line(ex, ey, D.web[j][0], D.web[j][1], { color: PAL.lagoon, w: 1.8, alpha: 0.7 * S.tp(tReal - 0.4 + k * 0.25, 0.6), progress: S.tp(tReal - 0.4 + k * 0.25, 0.8) }));
          g.circle(ex, ey, 34, { fill: '#1B2236', stroke: PAL.lagoon, w: 2.4, alpha: eN });
          eye(g, ex, ey, 40, PAL.lagoon, eN);
          caps(g, 'epistemology', ex - 48, ey + 6, { align: 'right', color: PAL.lagoon, alpha: eN });
        }
        D.blocks.forEach((b, i) => {
          const a0 = S.p(2, 0.6, 0.6 + b.row * 0.5 + i * 0.06) * aS; if (a0 <= 0) return;
          const drop = (1 - a0) * -26;
          const x = lerp(b.x, D.web[i][0], mo), y = lerp(b.y, D.web[i][1], mo) + drop;
          const w = lerp(150, 70, mo), h = lerp(80, 70, mo), rr = lerp(7, 35, mo), is = lerp(52, 42, mo);
          const base = b.row === 0; const sCol = base ? PAL.ink2 : COL;
          const hiF = base ? S.tp(tFnd, 0.6) * (1 - mo) : 0;
          let a = a0; if (i === 4 && fl > 0) a *= 1 - 0.65 * fl * (0.5 + 0.5 * Math.sin(t * 15));
          if (hiF > 0) g.glow(x, y, 95, COL, 0.5 * hiF);
          g.rect(x - w / 2, y - h / 2, w, h, { r: rr, fill: '#1D1934', stroke: i === 4 && fl > 0 ? U.mix(sCol, PAL.rose, fl) : hiF > 0 ? U.mix(sCol, COL, hiF) : sCol, w: 2 + hiF, alpha: a });
          if (b.icon === 'star') star(g, x, y, is * 0.45, COL, a);
          else if (i === 4) { g.icon('wolf', x, y + 2, is, ICOL.wolf, { alpha: a * (1 - swap) }); g.icon('coyote', x, y + 2, is, ICOL.coyote, { alpha: a * swap }); }
          else g.icon(b.icon, x, y + 2, is, ICOL[b.icon], { alpha: a });
        });
        // Tag on the revisable node.
        const tagA = S.tp(tWrong, 0.5);
        if (tagA > 0) { const [x, y] = D.web[4]; g.pill('revisable', x - 46, y, { align: 'right', size: 21, color: PAL.rose, alpha: tagA * (1 - swap) }); g.pill('revised', x - 46, y, { align: 'right', size: 21, color: PAL.mint, alpha: tagA * swap }); }
        // Left column for beat 3.
        const a3 = S.p(3, 0.8, 0.4);
        g.withAlpha(a3, () => {
          caps(g, 'fallibilism', 110, 300, { color: COL });
          g.wrap('Any belief might be wrong, so inquiry stays open to correction.', 110, 344, 290, { size: 30, role: 'display', color: PAL.ink, lh: 1.18 });
          g.text('after Charles Sanders Peirce', 110, 510, { size: 21, italic: true, color: PAL.ink3 });
          g.withAlpha(S.tp(tQuine, 0.8), () => {
            caps(g, 'naturalized epistemology', 110, 610, { color: PAL.lagoon });
            g.wrap('Epistemology as part of science: how real knowers learn.', 110, 654, 290, { size: 30, role: 'display', color: PAL.ink, lh: 1.18 });
            g.text('after Willard Quine', 110, 820, { size: 21, italic: true, color: PAL.ink3 });
          });
        });
      },
      terms: [
        { beat: 0.1, term: 'Epistemology', def: 'The study of knowledge: its nature, sources, justification, and limits.' },
        { beat: 0.55, term: 'Justified true belief', def: 'The classical analysis of knowledge: a belief that is true and held for good reasons.' },
        { beat: 1.2, term: 'Gettier problem', def: 'Cases of justified true belief that are true by luck, showing the classical analysis is incomplete.' },
        { beat: 2.45, term: 'Foundationalism vs coherentism', def: 'Justification rests on basic, self-justifying beliefs, or on the mutual support of a whole system of beliefs.' },
        { beat: 3.1, term: 'Fallibilism', def: 'Any belief, however well supported, might be mistaken and remains open to revision (Peirce).' },
      ],
    },
    {
      id: 'know-four', title: 'Four questions', register: null,
      beats: [
        { t: 'Research traditions differ in how they answer four questions. Ontology: what exists to be known? Epistemology: how can we know it? Methodology: how do we go about finding out? Axiology: what do we value in research, and what do we owe?',
          v: 'A four-row table frame appears: ONTOLOGY, EPISTEMOLOGY, METHODOLOGY, AXIOLOGY.' },
        { t: 'Egon Guba and Yvonna Lincoln compared research paradigms by the first three, and later added the fourth. A warning about the word: paradigm here means a broad research tradition, not quite Thomas Kuhn’s sense, which we meet in chapter five.',
          cite: 'Guba & Lincoln 1994, 2005',
          v: 'Column headers slot in: POSITIVIST / POSTPOSITIVIST and INTERPRETIVIST. A small note card: “paradigm ≠ Kuhn’s paradigm”.' },
        { t: 'We will follow two broad traditions: positivism and its successor, postpositivism; and interpretivism. Each is internally diverse, none is a single view, and neither belongs to a single discipline.',
          v: 'Each column header fractures briefly into many small tiles, then reassembles.' },
      ],
      init() {
        // Tiles for the header fracture (10 × 2 per column header).
        const r = U.rng(404); const tiles = [];
        for (let c = 0; c < 2; c++) for (let j = 0; j < 2; j++) for (let i = 0; i < 10; i++) {
          const w = TB.cw / 10, h = TB.hh / 2, an = r() * TAU;
          tiles.push({ c, x: cX(c) + i * w, y: TB.hy + j * h, w, h, dx: Math.cos(an) * (24 + r() * 60), dy: Math.sin(an) * (10 + r() * 20) + 10, rot: (r() - 0.5) * 1.3, d: r() * 0.3 });
        }
        return { tiles };
      },
      draw(g, t, S, D) {
        // Beat 0: four rows, one per question, as each is asked.
        const tR = [cue(S, 0, 'Ontology:'), cue(S, 0, 'Epistemology:'), cue(S, 0, 'Methodology:'), cue(S, 0, 'Axiology:')];
        caps(g, 'four questions', TB.x + 4, TB.hy + 34, { color: COL, alpha: S.p(0, 1.0) });
        const tGL = cue(S, 1, 'compared research paradigms'), tFirst = cue(S, 1, 'by the first three'), tFourth = cue(S, 1, 'later added the fourth');
        const hP = S.tp(tGL, 0.9), hI = S.tp(tGL + 0.5, 0.9), cellsA = S.tp(tGL + 0.8, 0.9);
        for (let i = 0; i < 4; i++) g.rect(TB.x, rY(i), TABLE_R - TB.x, TB.rh, { r: 6, stroke: PAL.rule, w: 1.2, dash: [4, 8], alpha: S.p(0, 0.8, 0.3 + i * 0.15) * (1 - cellsA) });
        for (let i = 0; i < 4; i++) {
          const a = S.tp(tR[i] - 0.15, 0.8); const nxt = i < 3 ? tR[i + 1] : S.e(0) + 0.4;
          const hiQ = S.tp(tR[i], 0.5) * (1 - S.tp(nxt, 0.5));
          const hiG = i < 3 ? S.tp(tFirst + i * 0.25, 0.5) * (1 - S.tp(tFourth, 0.5)) : S.tp(tFourth, 0.5) * (1 - S.tp(tFourth + 2.2, 0.6));
          g.text('?', TB.x + 46, rY(i) + 90, { size: 64, role: 'display', italic: true, color: PAL.ink3, align: 'center', alpha: 0.55 * S.p(0, 0.8, 0.5 + i * 0.25) * (1 - a) });
          rowLabel(g, i, a, Math.max(hiQ, hiG), (1 - a) * -30);
          caps(g, i < 3 ? '1994' : '2005', TB.x + TB.lw - 16, rY(i) + TB.rh - 14, { align: 'right', color: COL, alpha: S.tp(i < 3 ? tFirst + i * 0.25 : tFourth, 0.6) * (1 - S.p(2, 0.6)) });
        }
        // Beat 1: two column headers slot in; empty cells.
        for (let c = 0; c < 2; c++) for (let i = 0; i < 4; i++) cellBox(g, c, i, cellsA * S.tp(tGL + 0.8 + c * 0.4 + i * 0.12, 0.6));
        const tTwo = cue(S, 2, 'positivism and its successor'), tIntp = cue(S, 2, 'and interpretivism'), tDiv = cue(S, 2, 'Each is internally diverse'), tSingle = cue(S, 2, 'none is a single view'), tDisc = cue(S, 2, 'neither belongs');
        const glowP = S.tp(tTwo, 0.5) * (1 - S.tp(tIntp, 0.6)), glowI = S.tp(tIntp, 0.5) * (1 - S.tp(tDiv, 0.6));
        // Beat 2: each header fractures into tiles, then reassembles.
        const burst = ease.inOut(S.tp(tDiv, 1.0)) * (1 - ease.inOut(S.tp(tDisc - 0.2, 1.4)));
        const labs = ['POSITIVIST / POSTPOSITIVIST', 'INTERPRETIVIST'];
        [hP, hI].forEach((a, c) => {
          if (a <= 0) return;
          if (burst <= 0.002) { colHead(g, c, labs[c], a, c ? glowI : glowP, (1 - a) * -44); return; }
          D.tiles.forEach((tl) => {
            if (tl.c !== c) return; const e = ease.inOut(clamp(burst * 1.3 - tl.d)); const cx = tl.x + tl.w / 2, cy = tl.y + tl.h / 2;
            g.with(() => { g.ctx.translate(cx + tl.dx * e, cy + tl.dy * e); g.ctx.rotate(tl.rot * e); g.ctx.translate(-cx, -cy); g.clip(tl.x - 0.5, tl.y - 0.5, tl.w + 1, tl.h + 1, () => colHead(g, c, labs[c], a, 0)); });
          });
        });
        const VAR = [['logical positivism', 'critical rationalism', 'critical realism'], ['hermeneutics', 'phenomenology', 'symbolic interactionism']];
        const DISC = ['ecology', 'sociology', 'geography', 'anthropology'];
        for (let c = 0; c < 2; c++) {
          const x = cX(c), col = colCol(c);
          caps(g, 'not a single view', x + 22, rY(0) + 34, { color: col, alpha: S.tp(tSingle - 0.8, 0.8) });
          VAR[c].forEach((v, k) => g.pill(v, x + 22 + [0, 56, 18][k], [rY(0) + 74, rY(0) + 118, rY(1) + 52][k], { size: 21, color: PAL.ink, fill: U.rgba(col, 0.14), stroke: U.rgba(col, 0.55), alpha: S.tp(tSingle - 0.8 + k * 0.35 + c * 0.2, 0.6) }));
          caps(g, 'nor a single discipline', x + 22, rY(2) + 34, { color: col, alpha: S.tp(tDisc, 0.8) });
          DISC.forEach((d, k) => g.pill(d, x + 22 + (k % 2) * 170, k < 2 ? rY(2) + 76 : rY(3) + 46, { size: 21, color: PAL.ink2, alpha: S.tp(tDisc + 0.3 + k * 0.22 + c * 0.12, 0.6) }));
        }
        // Beat 1: a note card on the word "paradigm".
        const tW = cue(S, 1, 'A warning about the word'), tK = cue(S, 1, 'not quite Thomas Kuhn'), tC5 = cue(S, 1, 'chapter five');
        const aN = S.tp(tW, 0.8) * (1 - S.p(2, 0.7));
        if (aN > 0) g.with(() => {
          const w = 404, h = 236, rise = (1 - S.tp(tW, 0.9)) * 30; g.ctx.translate(1097, 748 + rise); g.ctx.rotate(0.03);
          g.rect(-w / 2 + 5, -h / 2 + 7, w, h, { r: 4, fill: 'rgba(0,0,0,0.38)', alpha: aN });
          g.rect(-w / 2, -h / 2, w, h, { r: 4, fill: '#ECE3CC', alpha: aN });
          g.circle(0, -h / 2 + 10, 7, { fill: COL, alpha: aN }); g.circle(-2, -h / 2 + 8, 2.2, { fill: '#FFFFFF', alpha: 0.6 * aN });
          g.text('A NOTE ON THE WORD', -w / 2 + 24, -h / 2 + 46, { size: 17, weight: 600, ls: 2.4, color: '#6B5A3A', alpha: aN });
          g.text('“Paradigm” here means', -w / 2 + 24, -h / 2 + 88, { size: 28, role: 'display', italic: true, color: '#24203A', alpha: aN });
          g.text('a broad research tradition.', -w / 2 + 24, -h / 2 + 122, { size: 28, role: 'display', color: '#24203A', alpha: aN });
          const aK = S.tp(tK, 0.7) * aN;
          g.text('≠  Kuhn’s paradigm', -w / 2 + 24, -h / 2 + 172, { size: 30, role: 'display', color: '#8A3E5E', alpha: aK });
          g.text('we meet it in chapter V', -w / 2 + 24, -h / 2 + 208, { size: 21, italic: true, color: '#6B5A3A', alpha: S.tp(tC5, 0.7) * aN });
        });
      },
      terms: [
        { beat: 0.3, term: 'Ontology', def: 'Assumptions about what exists and what kind of reality is being studied.' },
        { beat: 0.6, term: 'Methodology', def: 'The logic of how inquiry should proceed, as distinct from particular methods or techniques.' },
        { beat: 0.8, term: 'Axiology', def: 'The values and ethical commitments of a research tradition, including what researchers owe to others.' },
        { beat: 1.2, term: 'Research paradigm', def: 'A tradition’s combined answers to questions of ontology, epistemology, methodology, and axiology (Guba and Lincoln).' },
      ],
    },
    {
      id: 'know-pos', title: 'Positivism and postpositivism', register: 'observe',
      beats: [
        { t: 'Auguste Comte coined positivism in the 1830s: knowledge comes from observation and the laws that summarize it, not from metaphysics. In the 1920s the Vienna Circle sharpened it into logical positivism, and A. J. Ayer carried its verification principle into English philosophy.',
          s: 'Auguste Kont coined positivism in the 1830s: knowledge comes from observation and the laws that summarize it, not from metaphysics. In the 1920s the Vienna Circle sharpened it into logical positivism, and A. J. Air carried its verification principle into English philosophy.',
          cite: 'Comte 1830–42; Ayer 1936',
          v: 'The positivist column fills: ontology “observable regularities”, epistemology “verification”. A timeline: Comte, Vienna Circle, Ayer.' },
        { t: 'A statement is meaningful, the principle said, only if observation could verify it or it is true by definition. The principle failed by its own test: it is neither. And it would have ruled out much of physics, whose theoretical terms are never observed directly.',
          v: 'The principle written on a card; the card is checked against itself and cracks.' },
        { t: 'What most ecologists practice today is postpositivism. A real world exists but is imperfectly known; every observation is fallible; so we use design, statistics, and replication to approach the truth, and hold conclusions provisionally. Critical realism gives this stance its philosophy.',
          cite: 'Bhaskar 1975',
          v: 'The column updates to POSTPOSITIVIST: ontology “real, imperfectly known”, epistemology “fallible, probabilistic”, methodology “designs, statistics, replication”, axiology “aim at value neutrality”.' },
      ],
      init() {
        const crack = [[0.57, -0.02], [0.52, 0.14], [0.6, 0.3], [0.5, 0.46], [0.58, 0.62], [0.47, 0.8], [0.54, 1.02]];
        return { crack };
      },
      draw(g, t, S, D) {
        const a0 = S.p(0, 0.7, -0.6);
        const tObs = cue(S, 0, 'knowledge comes from observation'), tVer = cue(S, 0, 'verification principle');
        const tComte = cue(S, 0, 'coined positivism'), tVC = cue(S, 0, 'In the 1920s'), tAyer = cue(S, 0, 'A. J.');
        const tOwn = cue(S, 1, 'The principle failed'), tNei = cue(S, 1, 'it is neither'), tPhys = cue(S, 1, 'it would have ruled out');
        const tPost = S.b(2) + 0.2, tReal = cue(S, 2, 'A real world exists'), tFall = cue(S, 2, 'every observation is fallible'), tDes = cue(S, 2, 'so we use design'), tProv = cue(S, 2, 'hold conclusions provisionally'), tCR = cue(S, 2, 'Critical realism');
        const win = (t0, t1) => S.tp(t0, 0.5) * (1 - S.tp(t1, 0.5));
        const hi = [Math.max(win(tObs, tObs + 3.5), win(tReal, tFall)), Math.max(win(tVer, tVer + 3), win(tNei, tNei + 2.5), win(tFall, tDes)), win(tDes, tProv), win(tProv, tCR)];
        caps(g, 'four questions', TB.x + 4, TB.hy + 34, { color: COL, alpha: a0 });
        for (let i = 0; i < 4; i++) rowLabel(g, i, a0, hi[i]);
        // The positivist column: the header narrows to POSITIVIST, then updates to POSTPOSITIVIST.
        const sw = S.tp(tPost, 0.9), n0 = S.tp(0.8, 0.8);
        colHead(g, 0, [['POSITIVIST / POSTPOSITIVIST', 1 - n0], ['POSITIVIST', n0 * (1 - sw)], ['POSTPOSITIVIST', sw]], a0, 0.5 * win(tPost, tPost + 2.5));
        const fill = [Math.max(S.tp(tObs, 0.6), S.tp(tReal, 0.6)), Math.max(S.tp(tVer, 0.6), S.tp(tFall, 0.6)), S.tp(tDes, 0.6), S.tp(tProv + 0.8, 0.6)];
        for (let i = 0; i < 4; i++) cellBox(g, 0, i, a0, fill[i], hi[i]);
        const o0 = S.tp(tObs, 0.8) * (1 - S.tp(tReal - 0.4, 0.5)), o1 = S.tp(tReal, 0.8);
        cell(g, 0, 0, POS0[0][0], POS0[0][1], o0 * a0, { dx: (1 - S.tp(tObs, 0.8)) * 16, p: S.tp(tObs + 0.3, 1.0) });
        cell(g, 0, 0, POS1[0][0], POS1[0][1], o1 * a0, { dx: (1 - o1) * 16 });
        const crack = S.tp(tNei, 0.6), v0 = S.tp(tVer, 0.8) * (1 - S.tp(tFall - 0.4, 0.5));
        cell(g, 0, 1, POS0[1][0], POS0[1][1], v0 * a0 * (1 - 0.45 * crack), { dx: (1 - S.tp(tVer, 0.8)) * 16, p: S.tp(tVer + 0.3, 0.8) });
        g.line(cX(0) + 16, rY(1) + 41, cX(0) + 16 + 150 * crack, rY(1) + 41, { color: PAL.coral, w: 3, alpha: v0 * a0 });
        const o2 = S.tp(tFall, 0.8), o3 = S.tp(tDes, 0.8), o4 = S.tp(tProv + 0.8, 0.8);
        cell(g, 0, 1, POS1[1][0], POS1[1][1], o2 * a0, { dx: (1 - o2) * 16, p: S.tp(tFall + 0.2, 1.2) });
        cell(g, 0, 2, POS1[2][0], POS1[2][1], o3 * a0, { dx: (1 - o3) * 16, p: S.tp(tDes + 0.2, 1.2) });
        cell(g, 0, 3, POS1[3][0], POS1[3][1], o4 * a0, { dx: (1 - o4) * 16 });
        g.pill('critical realism', cX(0) + 20, rY(0) + 113, { size: 21, color: LP, stroke: U.rgba(LP, 0.6), alpha: S.tp(tCR, 0.7) * a0 });
        // The interpretivist column steps aside for the side panel, and returns (empty) in beat 2.
        const aI = (S.at(2) ? S.p(2, 0.9, 0.5) : 1 - S.tp(0.6, 0.8)) * a0;
        colHead(g, 1, 'INTERPRETIVIST', aI); for (let i = 0; i < 4; i++) cellBox(g, 1, i, aI);

        // Beat 0: a short history.
        const aT = S.tp(tComte - 0.6, 0.8) * (1 - S.p(1, 0.6));
        if (aT > 0) g.withAlpha(aT, () => {
          caps(g, 'a short history', 890, TB.hy + 34, { color: LP });
          const ent = [[tComte, '1830s', 'Auguste Comte', 'coins “positivism”: knowledge from observation and its laws, not metaphysics'], [tVC, '1920s', 'The Vienna Circle', 'sharpens it into logical positivism'], [tAyer, '1936', 'A. J. Ayer', 'carries the verification principle into English philosophy']];
          const ys = [338, 548, 728]; let last = 0;
          ent.forEach(([tt, yr, who, what], k) => {
            const a = S.tp(tt, 0.8); if (a <= 0) return; last = k; const y = ys[k], dx = (1 - a) * 20;
            g.dot(912, y, 7, LP, a, 2.4);
            g.text(yr, 940 + dx, y + 13, { size: 42, role: 'display', color: LP, alpha: a });
            g.text(who, 940 + dx, y + 50, { size: 25, color: PAL.ink, alpha: a });
            g.wrap(what, 940 + dx, y + 82, 360, { size: 21, color: PAL.ink2, lh: 1.25, alpha: a });
          });
          const lp = S.tp(tComte, 0.8) > 0 ? lerp(ys[0], ys[last], last ? S.tp([tComte, tVC, tAyer][last] - 0.2, 0.8) : 0) : ys[0];
          g.line(912, ys[0], 912, lp, { color: LP, w: 2, alpha: 0.6 });
        });

        // Beat 1: the verification principle fails its own test.
        const aC = vis(S, 1, 2);
        if (aC > 0) g.withAlpha(aC, () => {
          const X = 890, Y = 296, W = 376, H = 200;
          const split = ease.inOut(S.tp(tNei + 0.55, 0.9)), cp = S.tp(tNei, 0.55);
          const card = () => {
            g.rect(X, Y, W, H, { r: 8, fill: '#18203A', stroke: LP, w: 2 });
            caps(g, 'the verification principle', X + 22, Y + 40, { color: LP });
            g.wrap('A statement is meaningful only if observation could verify it, or it is true by definition.', X + 22, Y + 86, W - 44, { size: 29, role: 'display', color: PAL.ink, lh: 1.18 });
          };
          const pts = D.crack.map(([fx, fy]) => [X + fx * W, Y + fy * H]);
          if (split <= 0) card();
          else for (const side of [-1, 1]) g.with(() => {
            const c = g.ctx, ox = X + W * (side < 0 ? 0.28 : 0.78), oy = Y + H / 2; c.translate(ox + side * 12 * split, oy + (side > 0 ? 8 : 2) * split); c.rotate(side * 0.035 * split); c.translate(-ox, -oy);
            c.beginPath(); const ex = side < 0 ? X - 20 : X + W + 20; c.moveTo(ex, Y - 20); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(ex, Y + H + 20); c.closePath(); c.clip(); card();
          });
          if (split < 1) g.poly(pts, { color: PAL.coral, w: 3, progress: cp, alpha: 1 - split });
          // Applied to itself.
          const aS = S.tp(tOwn, 0.8);
          g.carrow(X + W + 2, Y + 70, X + W + 2, Y + 176, -0.34, { color: PAL.ink2, w: 2, head: 11, progress: S.tp(tOwn, 1.0), alpha: aS });
          caps(g, 'applied to itself', X, Y + H + 46, { alpha: aS });
          [['Verifiable by observation?', 0.5], ['True by definition?', 1.0]].forEach(([q, d], k) => {
            const a = S.tp(tOwn + d, 0.6), y = Y + H + 90 + k * 42; g.text(q, X, y, { size: 24, color: PAL.ink, alpha: a });
            cross(g, X + W - 14, y - 8, 18, PAL.coral, S.tp(tNei - 0.4 + k * 0.3, 0.4));
          });
          const aP = S.tp(tPhys, 0.8);
          caps(g, 'it would also rule out', X, Y + H + 208, { alpha: aP });
          ['electrons', 'fields', 'quarks'].forEach((w, k) => {
            const a = S.tp(tPhys + 0.6 + k * 0.3, 0.5); const x = X + [0, 136, 246][k], y = Y + H + 246;
            const pw = g.pill(w, x, y, { size: 22, color: PAL.ink2, alpha: a }); g.line(x + 8, y, x + 8 + (pw - 16) * S.tp(tPhys + 1.2 + k * 0.3, 0.5), y, { color: PAL.coral, w: 2.5, alpha: a });
          });
          g.text('theoretical terms, never observed directly', X, Y + H + 300, { size: 21, italic: true, color: PAL.ink3, alpha: S.tp(tPhys + 2.2, 0.8) });
        });
      },
      terms: [
        { beat: 0.2, term: 'Positivism', def: 'Comte’s doctrine that genuine knowledge comes from observation and the laws summarizing it, not metaphysics.' },
        { beat: 0.85, term: 'Verification principle', def: 'Logical positivism’s criterion: a statement is meaningful only if empirically verifiable or true by definition.' },
        { beat: 2.15, term: 'Postpositivism', def: 'The fallibilist successor to positivism: a real world, known imperfectly, approached through design, statistics, and replication.' },
        { beat: 2.8, term: 'Critical realism', def: 'The view that a mind-independent reality exists and can be known, though only partially and through fallible theory.' },
      ],
    },
    {
      id: 'know-interp', title: 'Interpretivism', register: 'infer',
      beats: [
        { t: 'In the late nineteenth century, Wilhelm Dilthey argued that the human sciences need their own method. Nature we explain, from outside, by causes: Erklären. Human life we understand, from inside, through meanings: Verstehen.',
          s: 'In the late nineteenth century, Wilhelm Dill-tie argued that the human sciences need their own method. Nature we explain, from outside, by causes: air-klair-en. Human life we understand, from inside, through meanings: fair-shtay-en.',
          cite: 'Dilthey 1883',
          v: 'Two windows: a causal diagram labelled ERKLÄREN; a figure seen from inside a circle of meanings labelled VERSTEHEN.' },
        { t: 'Max Weber built Verstehen into sociology, and Charles Taylor argued that the social sciences are irreducibly interpretive. Peter Berger and Thomas Luckmann showed how much of social reality, from property lines to protected-area boundaries, is constructed and sustained by people.',
          s: 'Max Vayber built fair-shtay-en into sociology, and Charles Taylor argued that the social sciences are irreducibly interpretive. Peter Berger and Thomas Luckmann showed how much of social reality, from property lines to protected-area boundaries, is constructed and sustained by people.',
          cite: 'Weber 1922; Taylor 1971; Berger & Luckmann 1966',
          v: 'The interpretivist column fills: ontology “socially constructed, multiple”, epistemology “understanding meanings”, methodology “interviews, texts, observation”, axiology “values explicit”. A park boundary drawn on a map.' },
        { t: 'Wildlife science meets interpretivism wherever people are part of the system. Whether a wolf is a symbol of wilderness, a threat to a ranch, or a rival for the hunter’s elk depends on who is asked. Ecologists call the number of carnivores people will tolerate the social carrying capacity.',
          cite: 'Wilmers et al. 2025',
          v: 'One wolf icon with three speech-bubble framings around it; a carrying-capacity line splits into ecological K and a lower social K.' },
      ],
      draw(g, t, S, D) {
        // ---- Beat 0: Dilthey's two windows.
        const aW = vis(S, 0, 1);
        if (aW > 0) g.withAlpha(aW, () => {
          const tHum = cue(S, 0, 'the human sciences need'), tExp = cue(S, 0, 'Nature we explain'), tErk = cue(S, 0, 'by causes: Erklären'), tUnd = cue(S, 0, 'Human life we understand'), tVer = cue(S, 0, 'through meanings: Verstehen');
          const L = { x: 214, y: 262, w: 466, h: 590 }, R = { x: 730, y: 262, w: 580, h: 590 };
          const fA = S.p(0, 1.0, 0.2);
          for (const [W, lab, col, tt] of [[L, 'the natural sciences', LP, tHum], [R, 'the human sciences', LI, tHum + 0.6]]) {
            g.rect(W.x, W.y, W.w, W.h, { r: 10, fill: U.rgba(col, 0.045), stroke: U.rgba(col, 0.6), w: 2, alpha: fA });
            g.line(W.x, W.y + 52, W.x + W.w, W.y + 52, { color: U.rgba(col, 0.45), w: 1.5, alpha: fA });
            for (let k = 0; k < 3; k++) g.circle(W.x + W.w - 26 - k * 20, W.y + 26, 5, { stroke: U.rgba(col, 0.7), w: 1.5, alpha: fA });
            caps(g, lab, W.x + 22, W.y + 33, { color: col, alpha: S.tp(tt, 0.8) });
          }
          // Erklären: a causal chain, seen from outside the window.
          const aE = S.tp(tExp, 0.8);
          person(g, 142, 700, 128, PAL.ink2, { alpha: aE, prop: 'notebook' });
          const nodes = [['wolf', 300, PAL.coral], ['elk', 446, PAL.sand], ['aspen', 594, PAL.moss]];
          nodes.forEach(([k, x, col], i) => { const a = S.tp(tExp + 0.3 + i * 0.35, 0.6); g.icon(k, x, 500, 96, col, { alpha: a }); g.line(156, 588, x - 20, 526, { color: PAL.ink3, w: 1.4, dash: [3, 7], alpha: 0.7 * a }); });
          [[346, 396], [494, 548]].forEach(([x1, x2], i) => { const p = S.tp(tExp + 0.8 + i * 0.4, 0.7); g.arrow(x1 + 4, 494, x2 - 2, 494, { color: PAL.ink, w: 2.6, head: 13, progress: p }); g.text('−', (x1 + x2) / 2, 476, { size: 30, weight: 600, color: PAL.coral, align: 'center', alpha: p }); });
          caps(g, 'cause  →  effect', L.x + L.w / 2, 624, { align: 'center', alpha: S.tp(tExp + 1.6, 0.8) });
          g.text('Erklären', L.x + L.w / 2, 772, { size: 60, role: 'display', italic: true, color: LP, align: 'center', alpha: S.tp(tErk, 0.8) });
          caps(g, 'explain · from outside · by causes', L.x + L.w / 2, 816, { align: 'center', color: PAL.ink2, alpha: S.tp(tErk + 0.3, 0.8) });
          // Verstehen: a person inside a circle of meanings.
          const aU = S.tp(tUnd, 0.8), cx = R.x + R.w / 2, hy = 494;
          g.ellipse(cx, hy, 214, 112, { stroke: LI, w: 1.5, dash: [4, 7], alpha: 0.6 * aU });
          const words = [['home', 198], ['livelihood', 236], ['heritage', 272], ['wildness', 306], ['threat', 342], ['freedom', 168], ['loss', 12]];
          words.forEach(([w, deg], k) => {
            const a = S.tp(tUnd + 0.4 + k * 0.22, 0.6), an = deg * Math.PI / 180, x = cx + Math.cos(an) * 214, y = hy + Math.sin(an) * 112 + Math.sin(t * 0.9 + k) * 3;
            g.line(cx, hy + 26, lerp(cx, x, 0.78), lerp(hy + 26, y, 0.78), { color: LI, w: 1.2, dash: [2, 6], alpha: 0.6 * a });
            g.text(w, x, y + 8, { size: 24, italic: true, role: 'display', color: PAL.ink, align: 'center', alpha: a });
          });
          person(g, cx, 612, 128, PAL.violet, { alpha: aU });
          g.glow(cx, 506, 40, LI, 0.5 * aU);
          g.text('Verstehen', cx, 772, { size: 60, role: 'display', italic: true, color: LI, align: 'center', alpha: S.tp(tVer, 0.8) });
          caps(g, 'understand · from inside · through meanings', cx, 816, { align: 'center', color: PAL.ink2, alpha: S.tp(tVer + 0.3, 0.8) });
        });

        // ---- Beat 1: the interpretivist column fills.
        const aT = vis(S, 1, 2);
        if (aT > 0) g.withAlpha(aT, () => {
          const tWeb = cue(S, 1, 'built'), tTay = cue(S, 1, 'Charles Taylor'), tIrr = cue(S, 1, 'irreducibly interpretive'), tBL = cue(S, 1, 'Peter Berger'), tShow = cue(S, 1, 'showed how much'), tProp = cue(S, 1, 'from property lines'), tPA = cue(S, 1, 'protected-area boundaries');
          const win = (t0, t1) => S.tp(t0, 0.5) * (1 - S.tp(t1, 0.5));
          const fills = [S.tp(tShow, 0.8), S.tp(tWeb, 0.8), S.tp(tIrr, 0.8), S.tp(tIrr + 1.4, 0.8)];
          const hi = [win(tShow, S.e(1) + 0.4), win(tWeb, tTay), win(tIrr, tIrr + 1.4), win(tIrr + 1.4, tBL)];
          caps(g, 'four questions', TB.x + 4, TB.hy + 34, { color: COL });
          for (let i = 0; i < 4; i++) rowLabel(g, i, 1, hi[i]);
          colHead(g, 0, 'POSTPOSITIVIST', 0.75);
          const dimM = 1 - 0.65 * S.tp(cue(S, 1, 'from property lines') - 0.5, 1.0);
          for (let i = 0; i < 4; i++) { cellBox(g, 0, i, 0.75 * (i ? dimM : 1), 1); cell(g, 0, i, POS1[i][0], POS1[i][1], 0.55 * (i ? dimM : 1)); }
          g.pill('critical realism', cX(0) + 20, rY(0) + 113, { size: 21, color: LP, stroke: U.rgba(LP, 0.6), alpha: 0.55 });
          colHead(g, 1, 'INTERPRETIVIST', 1, 0.6 * win(S.b(1), tWeb + 1.5));
          const mapP = 0.5 * S.tp(tProp, 1.4) + 0.5 * S.tp(tPA, 1.4);
          for (let i = 0; i < 4; i++) {
            cellBox(g, 1, i, 1, fills[i], hi[i]);
            if (i === 0 && mapP > 0) g.glow(cX(1) + TB.cw - 76, rY(0) + 71, 90, PAL.violet, 0.35 * mapP);
            cell(g, 1, i, INT[i][0], INT[i][1], fills[i], { dx: (1 - fills[i]) * 16, t, p: i === 0 ? mapP : S.tp([tShow, tWeb, tIrr, tIrr + 1.4][i] + 0.2, 1.2) });
          }
          // The map grows out of its cell: property lines, then a protected-area boundary.
          const aM = S.tp(tProp - 0.5, 1.0);
          if (aM > 0) {
            const e = ease.inOut(aM), gx = cX(1) + TB.cw - 76, gy = rY(0) + 73;
            g.line(gx - 40, gy + 40, lerp(gx, 760, e), lerp(gy, 520, e), { color: PAL.violet, w: 1.4, dash: [3, 5], alpha: 0.7 * e });
            g.with(() => {
              const c = g.ctx; c.translate(lerp(gx, 650, e), lerp(gy, 662, e)); const sc = lerp(0.31, 1, e); c.scale(sc, sc);
              g.rect(-205, -148, 410, 296, { r: 8, fill: PANEL, stroke: U.rgba(PAL.violet, 0.7), w: 2 });
              g.clip(-203, -146, 406, 292, () => {
                for (let k = 0; k < 5; k++) g.poly([[-205, -100 + k * 52], [-80, -114 + k * 52], [60, -90 + k * 52], [205, -108 + k * 52]], { color: PAL.faint, w: 1.2 });
                g.poly(Array.from({ length: 41 }, (_, k) => [-205 + k * 10.25, 92 - k * 2.2 + 16 * Math.sin(k * 0.33)]), { color: PAL.lagoon, w: 3 });
                const pl = S.tp(tProp, 1.6);
                [[56, -136, 60, 136], [122, -136, 128, 136], [178, -136, 170, 136], [56, -40, 205, -46], [56, 50, 205, 42]].forEach(([x1, y1, x2, y2], k) => g.line(x1, y1, x2, y2, { color: PAL.ink2, w: 1.6, alpha: 0.75, progress: clamp(pl * 5 - k) }));
                const pb = S.tp(tPA, 1.6), B = [[-188, -120], [34, -120], [34, 14], [-46, 66], [-188, 66], [-188, -120]];
                if (pb >= 1) g.poly(B, { fill: U.rgba(PAL.violet, 0.16), color: null, w: 0 });
                g.poly(B, { color: PAL.violet, w: 3, dash: [9, 6], progress: pb });
                [[-96, -4], [16, 44], [150, -88]].forEach(([x, y], k) => g.icon('elk', x, y, 34, PAL.sand, { alpha: 0.9, flip: k === 1 }));
              });
              caps(g, 'protected area', -172, -88, { color: PAL.violet, alpha: S.tp(tPA + 0.8, 0.6) });
              caps(g, 'property lines', 196, 116, { align: 'right', color: PAL.ink2, alpha: S.tp(tProp + 0.8, 0.6) });
            });
          }
        });

        // ---- Beat 2: one wolf, three framings; ecological K and social K.
        const aK = S.p(2, 0.9, 0.3);
        if (aK > 0) g.withAlpha(aK, () => {
          const tSym = cue(S, 2, 'a symbol of wilderness'), tThr = cue(S, 2, 'a threat to a ranch'), tRiv = cue(S, 2, 'a rival for the hunter'), tWho = cue(S, 2, 'depends on who is asked'), tSoc = cue(S, 2, 'Ecologists call'), tSK = cue(S, 2, 'social carrying capacity');
          const aWolf = S.p(2, 0.8, 0.3);
          g.glow(410, 480, 150, PAL.coral, 0.22 * aWolf);
          g.icon('wolf', 410, 486, 184, PAL.coral, { alpha: aWolf });
          caps(g, 'depends on who is asked', 410, 352, { align: 'center', color: COL, alpha: S.tp(tWho, 0.8) });
          const P = [[196, 'visitor', { hat: 'brim', prop: 'camera' }, 'a symbol of wilderness', tSym], [418, 'rancher', { hat: 'cowboy' }, 'a threat to a ranch', tThr], [640, 'hunter', { hat: 'cap', prop: 'rifle', flip: true }, 'a rival for the hunter’s elk', tRiv]];
          P.forEach(([x, who, o, say, tt], k) => {
            const aP = S.p(2, 0.7, 0.9 + k * 0.3);
            person(g, x, 862, 112, PAL.violet, { ...o, alpha: aP });
            caps(g, who, x, 898, { align: 'center', color: PAL.violet, alpha: aP });
            const aB = S.tp(tt, 0.7);
            g.line(x, 638, lerp(410, x, 0.35), 572, { color: PAL.coral, w: 1.6, dash: [4, 6], alpha: 0.75 * aB, progress: S.tp(tt + 0.2, 0.7) });
            bubble(g, x - 108, 636, 216, 84, x, 742, { alpha: aB, color: U.rgba(PAL.violet, 0.9) });
            g.withAlpha(aB, () => { const ls = g.lines(say, 194, { size: 25, italic: true, role: 'display' }); ls.forEach((ln, j) => g.text(ln, x, 686 + j * 28 - (ls.length - 1) * 14, { size: 25, role: 'display', italic: true, color: PAL.ink, align: 'center' })); });
          });
          // Carrying capacity: ecological K, and the lower social K.
          const A = g.axes({ x: 878, y: 350, w: 404, h: 392, xlab: 'Time', ylab: 'Wolves', labSize: 22, progress: S.p(2, 1.2, 0.6) });
          caps(g, 'stylized', A.x + A.w, 332, { align: 'right', size: 15, alpha: S.p(2, 0.8, 1.2) });
          const pC = S.p(2, 2.6, 1.2), split = ease.inOut(S.tp(tSoc + 0.6, 1.6)), aS = S.tp(tSoc, 0.8);
          const eco = (x) => 0.85 / (1 + 20.25 * Math.exp(-9 * x)), soc = (x) => 0.5 / (1 + 11.5 * Math.exp(-9 * x));
          g.line(A.X(0), A.Y(0.85), A.X(1), A.Y(0.85), { color: PAL.ink2, w: 2, dash: [9, 7], progress: S.p(2, 1.0, 1.0) });
          g.text('ecological K', A.X(0.03), A.Y(0.85) - 12, { size: 22, color: PAL.ink2, alpha: S.p(2, 0.8, 1.4) });
          g.plot(A, eco, { color: PAL.coral, w: 4, progress: pC, alpha: 1 - 0.65 * split, dash: split > 0.5 ? [6, 7] : null });
          const yK = lerp(0.85, 0.5, split);
          if (aS > 0) {
            g.line(A.X(0), A.Y(yK), A.X(1), A.Y(yK), { color: PAL.violet, w: 3, dash: [12, 6], alpha: aS });
            g.text('social K', A.X(0.03), A.Y(yK) - 12, { size: 24, weight: 600, color: PAL.violet, alpha: S.tp(tSK, 0.8) });
            g.plot(A, soc, { color: PAL.coral, w: 4.5, progress: S.tp(tSoc + 1.6, 2.0) });
            g.text('wolves people will tolerate', A.X(1), A.Y(0.5) - 14, { size: 21, italic: true, color: PAL.ink2, align: 'right', alpha: S.tp(tSK + 0.6, 0.8) });
          }
        });
      },
      terms: [
        { beat: 0.35, term: 'Interpretivism', def: 'The tradition holding that social life must be understood through the meanings people give it, not only explained by causes.' },
        { beat: 0.8, term: 'Verstehen', def: 'Interpretive understanding of action from the actor’s point of view (Dilthey, Weber); contrasted with causal explanation, Erklären.' },
        { beat: 1.6, term: 'Social construction', def: 'The process by which categories and institutions are created and sustained by people (Berger and Luckmann).' },
        { beat: 2.7, term: 'Social carrying capacity', def: 'The population size of a species that people will tolerate, often below ecological carrying capacity.' },
      ],
    },
    {
      id: 'know-lenses', title: 'One herd, two lenses', register: null,
      beats: [
        { t: 'Look at the Northern Range elk through each lens. A postpositivist counts animals, estimates survival, and models the causes of decline. The question is what happened, and how much each factor contributed.',
          v: 'Case-file card (elk). The herd landscape; the blue lens slides over it and overlays survival curves and a pie of mortality causes.' },
        { t: 'An interpretivist asks what the herd means to ranchers, hunters, outfitters, and visitors, and how those meanings shape management, from hunting quotas to tolerance of elk on irrigated fields outside the park. One herd, two kinds of question; each lens shows something the other misses.',
          cite: 'Haggerty & Travis 2006',
          v: 'The violet lens slides in; the overlay becomes people around the herd with quotes and a ranch fence line. Both lenses overlap; each reveals a different layer.' },
      ],
      init() {
        const r = U.rng(2025);
        const far = [], near = [], river = [];
        for (let k = 0; k <= 96; k++) { const x = 420 + k * 1420 / 96; far.push([x, 336 - 54 * Math.abs(Math.sin(k * 0.16 + 0.4)) - 20 * U.noise1(k * 0.35, 5)]); near.push([x, 414 - 26 * Math.abs(Math.sin(k * 0.1 + 1.3)) - 14 * U.noise1(k * 0.5, 9)]); }
        for (let k = 0; k <= 120; k++) { const u = k / 120; river.push([100 + 1740 * u, 846 + 22 * Math.sin(u * 9) - 76 * u]); }
        // The herd, in the park, and a few elk on an irrigated field outside it.
        const herd = []; for (let i = 0; i < 22; i++) { const rr = Math.sqrt((i + 0.5) / 22), th = i * 2.39996; herd.push({ x: 872 + rr * 84 * Math.cos(th) + (r() - 0.5) * 8, y: 618 + rr * 66 * Math.sin(th) + (r() - 0.5) * 6, flip: r() < 0.4, s: 24 + r() * 5, ph: r() * 6.28 }); }
        herd.sort((a, b) => a.y - b.y);
        const field = { x: 1352, y: 690, r: 84 };
        const fieldElk = [[1322, 676], [1356, 700], [1384, 672], [1340, 720]].map(([x, y], k) => ({ x, y, flip: k % 2 === 1 }));
        const stands = [[1640, 566], [1000, 452], [1150, 470], [1560, 446], [1720, 470], [700, 790]].map(([x, y]) => [0, 1, 2].map((k) => [x + (k - 1) * 20 + (r() - 0.5) * 6, y + (r() - 0.5) * 8 + (k === 1 ? -6 : 0)]));
        const tufts = []; for (let k = 0; k < 70; k++) tufts.push([440 + r() * 1380, 480 + r() * 260, 5 + r() * 7]);
        const fence = []; for (let y = 286; y <= 900; y += 6) fence.push([1250 + 12 * Math.sin(y / 70), y]);
        return { far, near, river, herd, field, fieldElk, stands, tufts, fence };
      },
      draw(g, t, S, D) {
        const PX = 660, IX = 1080, LY = 560, R = 290;
        const tLook = S.b(0), tPos = cue(S, 0, 'A postpositivist'), tCount = cue(S, 0, 'counts animals'), tSurv = cue(S, 0, 'estimates survival'), tCause = cue(S, 0, 'models the causes'), tQ = cue(S, 0, 'The question is');
        const tInt = cue(S, 1, 'An interpretivist asks'), tRan = cue(S, 1, 'ranchers'), tHun = cue(S, 1, 'hunters, outfitters'), tOut = cue(S, 1, 'outfitters, and visitors'), tVis = cue(S, 1, 'and visitors'), tMan = cue(S, 1, 'shape management'), tQuo = cue(S, 1, 'hunting quotas'), tIrr = cue(S, 1, 'irrigated fields'), tOne = cue(S, 1, 'One herd, two kinds'), tMiss = cue(S, 1, 'each lens shows');
        const slideI = ease.inOut(S.tp(tInt - 0.6, 1.6)), px = lerp(-420, PX + 60, ease.inOut(S.tp(tPos - 0.3, 1.6))) - 60 * slideI, ix = lerp(2340, IX, slideI);
        const aL = S.p(0, 1.2);
        const land = (a, bright) => {
          g.poly(D.far, { color: PAL.ink3, w: 1.4, alpha: a * 0.7 }); g.poly(D.near, { color: PAL.ink2, w: 1.8, alpha: a * 0.8 });
          g.poly(D.river, { color: PAL.lagoon, w: 3, alpha: a });
          for (const [x, y, h] of D.tufts) g.line(x, y, x + 2, y - h, { color: PAL.moss, w: 1.4, alpha: a * 0.45 });
          for (const st of D.stands) for (const [x, y] of st) g.icon('aspen', x, y, 34, PAL.moss, { alpha: a * 0.85 });
          g.circle(D.field.x, D.field.y, D.field.r, { fill: U.rgba(PAL.moss, bright ? 0.16 : 0.08), stroke: PAL.moss, w: 1.6, alpha: a * 0.7 });
          g.line(D.field.x, D.field.y, D.field.x + D.field.r * Math.cos(0.3), D.field.y + D.field.r * Math.sin(0.3), { color: PAL.moss, w: 2, alpha: a * 0.6 });
          for (const e of D.fieldElk) g.icon('elk', e.x, e.y, 24, PAL.sand, { alpha: a, flip: e.flip });
          for (const e of D.herd) g.icon('elk', e.x, e.y + Math.sin(t * 0.8 + e.ph) * 0.8, e.s, PAL.sand, { alpha: a, flip: e.flip });
        };
        g.withAlpha(aL, () => land(0.44, false));
        // "Through each lens": both lenses are foreshadowed as faint outlines.
        g.circle(PX + 60, LY, R, { stroke: LP, w: 1.5, dash: [6, 9], alpha: 0.45 * S.p(0, 1.0, 1.2) * (1 - S.tp(tPos - 0.3, 0.6)) });
        g.circle(IX, LY, R, { stroke: LI, w: 1.5, dash: [6, 9], alpha: 0.45 * S.p(0, 1.0, 1.6) * (1 - S.tp(tInt - 0.6, 0.6)) });
        // "Look at the Northern Range elk": the herd lights up.
        const aHerd = S.p(0, 0.9, 0.6) * (1 - S.p(1, 0.6));
        g.glow(870, 616, 150, PAL.sand, 0.22 * aHerd);
        caps(g, 'northern range elk', 870, 536, { align: 'center', color: PAL.sand, alpha: aHerd * (1 - S.tp(tSurv, 0.6)) });

        // ---- The postpositivist lens.
        const aP = S.tp(tPos - 0.3, 0.6);
        if (aP > 0) {
          inCircle(g, px, LY, R, () => {
            land(1, true);
            D.herd.forEach((e, k) => { const a = S.tp(tCount + 0.2 + k * 0.06, 0.4); if (a > 0) g.circle(e.x + 2, e.y - 3, 14, { stroke: LP, w: 1.6, alpha: a * 0.85 }); });
          });
          g.lens('pos', px, LY, R, { alpha: aP, label: 'POSTPOSITIVIST LENS', labSize: 18 });
          // Survival curves (stylized) and causes of death (illustrative).
          const aSv = S.tp(tSurv, 0.8);
          if (aSv > 0) g.withAlpha(aSv, () => {
            g.rect(px - 226, LY - 212, 292, 204, { r: 8, fill: 'rgba(14,13,26,0.92)', stroke: U.rgba(LP, 0.4), w: 1.2 });
            caps(g, 'survival', px - 208, LY - 182, { color: LP });
            caps(g, 'illustrative', px + 50, LY - 182, { align: 'right', size: 15 });
            const A = g.axes({ x: px - 200, y: LY - 160, w: 196, h: 108, xmin: 0, xmax: 12, ymin: 0, ymax: 1, progress: S.tp(tSurv, 0.8), arrows: false });
            const adults = [[0, 1], [2, 1], [2, 0.95], [5, 0.95], [5, 0.9], [9, 0.9], [9, 0.86], [12, 0.86]];
            const calves = [[0, 1], [0.7, 1], [0.7, 0.8], [1.6, 0.8], [1.6, 0.64], [3, 0.64], [3, 0.52], [6, 0.52], [6, 0.45], [12, 0.45]];
            g.data(A, adults, { color: PAL.sand, w: 3, progress: S.tp(tSurv + 0.3, 1.4) });
            g.data(A, calves, { color: PAL.sand, w: 3, dash: [6, 5], progress: S.tp(tSurv + 0.6, 1.4) });
            g.text('adults', A.X(12) + 6, A.Y(0.86) + 7, { size: 21, color: PAL.sand, alpha: S.tp(tSurv + 1.6, 0.6) });
            g.text('calves', A.X(12) + 6, A.Y(0.45) + 7, { size: 21, color: PAL.sand, alpha: S.tp(tSurv + 1.9, 0.6) });
            g.text('months', A.X(12), A.Y(0) + 26, { size: 21, color: PAL.ink3, align: 'right' });
          });
          const aPie = S.tp(tCause, 0.8);
          if (aPie > 0) {
            const qp = S.tp(tQ + 0.4, 0.8), pulse = qp * (0.5 + 0.5 * Math.sin(t * 2.4));
            const parts = [{ v: 0.34, col: PAL.coral, l: 'wolves' }, { v: 0.14, col: PAL.clay, l: 'pumas' }, { v: 0.12, col: U.mix(PAL.coral, PAL.bg, 0.45), l: 'bears' }, { v: 0.26, col: PAL.violet, l: 'hunters' }, { v: 0.14, col: PAL.snow, l: 'winter' }];
            parts.forEach((pt, k) => { pt.pop = k === 0 ? 7 * pulse : 0; });
            g.circle(px - 100, LY + 132, 80, { fill: 'rgba(14,13,26,0.7)', alpha: aPie });
            pie(g, px - 100, LY + 132, 72, parts, S.tp(tCause + 0.2, 1.4), aPie);
            g.withAlpha(aPie, () => {
              caps(g, 'causes of death', 120, 600, { color: LP });
              parts.forEach((pt, k) => { const a = S.tp(tCause + 0.4 + k * 0.2, 0.5); g.rect(122, 626 + k * 34, 16, 16, { r: 3, fill: pt.col, alpha: a }); g.text(pt.l, 150, 641 + k * 34, { size: 22, color: PAL.ink, alpha: a }); });
              caps(g, 'illustrative', 120, 820, { size: 15 });
            });
          }
          g.text('What happened, and how much?', px, 252, { size: 30, role: 'display', italic: true, color: LP, align: 'center', alpha: S.tp(tQ, 0.9) });
        }

        // ---- The interpretivist lens.
        const aI = S.tp(tInt - 0.6, 0.6);
        if (aI > 0) {
          inCircle(g, ix, LY, R, () => {
            land(1, true);
            g.poly(D.fence, { color: PAL.violet, w: 2, alpha: S.tp(tInt + 0.8, 0.8), progress: S.tp(tInt + 0.8, 1.6) });
            D.fence.forEach(([x, y], k) => { if (k % 6) return; const a = S.tp(tInt + 0.8 + k * 0.004, 0.5); g.line(x, y - 9, x, y + 9, { color: PAL.violet, w: 3, alpha: a }); });
            caps(g, 'park', 1228, 520, { align: 'right', color: PAL.violet, alpha: S.tp(tInt + 1.6, 0.6) });
            caps(g, 'ranch', 1276, 520, { color: PAL.violet, alpha: S.tp(tInt + 1.6, 0.6) });
            const aF = S.tp(tIrr, 0.8); g.glow(D.field.x, D.field.y, 120, PAL.moss, 0.4 * aF);
          });
          g.lens('int', ix, LY, R, { alpha: aI, label: 'INTERPRETIVIST LENS', labSize: 18 });
          // People around the herd, and what the herd means to each (illustrative framings).
          const P = [
            [1010, 404, 'visitors', { prop: 'camera' }, tVis, 'Something wild to watch', 300],
            [1176, 432, 'outfitters', { hat: 'brim' }, tOut, 'Our clients’ hunt, our living', 420],
            [1284, 628, 'ranchers', { hat: 'cowboy', flip: true }, tRan, 'Elk eat the hay we grow', 640],
            [1110, 800, 'hunters', { hat: 'cap', prop: 'rifle' }, tHun, 'Meat, and a tradition', 770],
          ];
          P.forEach(([x, y, who, o, tt, quote, by], k) => {
            const a = S.tp(tt, 0.7); if (a <= 0) return;
            person(g, x, y, 88, PAL.violet, { ...o, alpha: a });
            const bx = 1478, bw = 350, bh = 70, aq = S.tp(tt + 0.5, 0.7);
            g.line(x + 16, y - 56, bx, by + bh / 2, { color: PAL.violet, w: 1.2, dash: [3, 5], alpha: 0.7 * aq });
            g.withAlpha(aq, () => {
              g.rect(bx, by, bw, bh, { r: 12, fill: PANEL, stroke: U.rgba(PAL.violet, 0.85), w: 2 });
              caps(g, who, bx + 18, by + 27, { color: PAL.violet });
              g.text('“' + quote + '”', bx + 18, by + 56, { size: 23, role: 'display', italic: true, color: PAL.ink });
            });
          });
          // Management: quotas, and tolerance of elk on irrigated fields.
          g.pill('→ hunting quotas', 1478, 872, { size: 21, color: PAL.violet, stroke: U.rgba(PAL.violet, 0.6), alpha: S.tp(tQuo, 0.7) });
          g.pill('→ tolerance on irrigated fields', 1478, 724, { size: 21, color: PAL.moss, stroke: U.rgba(PAL.moss, 0.6), alpha: S.tp(tIrr, 0.7) });
          caps(g, 'illustrative framings', 1830, 274, { align: 'right', size: 15, alpha: S.tp(tVis + 0.5, 0.6) });
          g.text('What does it mean, and to whom?', ix, 252, { size: 30, role: 'display', italic: true, color: LI, align: 'center', alpha: S.tp(tOne, 0.9) });
          // Each lens shows something the other misses: both rims brighten, the shared herd glows.
          const aM = S.tp(tMiss, 0.8), pl = aM * (0.6 + 0.4 * Math.sin(t * 2.2));
          g.circle(px, LY, R, { stroke: LP, w: 4, alpha: 0.6 * pl }); g.circle(ix, LY, R, { stroke: LI, w: 4, alpha: 0.6 * pl });
          g.glow(870, 616, 120, PAL.sand, 0.25 * aM);
        }
        g.casefile(96, 226, 290, 166, { title: 'One elk herd, two lenses', no: 'II', sketch: 'elk', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });
      },
    },
  ],
});
})();
