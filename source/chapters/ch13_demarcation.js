/* Chapter XIII — What counts as science? The demarcation problem. Case file: the Kaibab story, revisited. */
(function () {
const { PAL, U, Theater } = window; const { clamp, lerp, ease } = U;
const COL = PAL.mint;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken: sentence timing when available, else proportional to the caption.
const cue = (S, k, phrase) => {
  const B = S.scene.timing && S.scene.timing.beats[k];
  if (B && B.sents) for (const s of B.sents) { const i = s.cap.indexOf(phrase); if (i >= 0) return s.start + (s.end - s.start) * i / s.cap.length; }
  const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length);
};
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
// Shrink a font size so the string fits maxW.
const fitSize = (g, s, maxW, o) => { const w = g.measure(s, o); return w > maxW ? o.size * maxW / w : o.size; };
const chCol = (roman) => { const c = Theater.chapters.find((x) => x.roman === roman); return (c && c.color) || PAL.ink2; };
const bump = (x) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
const RED = '#E0524A'; // the red pencil

// The demarcation matrix, shared by the criteria, matrix and Kaibab scenes.
const ROWS = [
  { k: 'Verifiability', who: 'logical positivists', ch: 'II' },
  { k: 'Falsifiability', who: 'Popper', ch: 'IV' },
  { k: 'Puzzle-solving', who: 'Kuhn', ch: 'V' },
  { k: 'Progressive program', who: 'Lakatos', ch: 'IV' },
  { k: 'Methodological naturalism', who: 'the courts', ch: 'XIII' },
  { k: 'Institutional norms', who: 'Merton · Longino', ch: 'XII' },
  { k: 'Cluster', who: 'Pigliucci', ch: 'XIII' },
  { k: 'Systematicity', who: 'Hoyningen-Huene', ch: 'XIII' },
  { k: 'Wissenschaft', who: 'German usage', ch: 'XIII' },
];
// Cell status for [postpositivist natural science, interpretive social research, astrology].
const CELLS = [['x', 'x', 'x'], ['m', 'p', 'm'], ['m', 'p', 'f'], ['m', 'm', 'f'], ['m', 'm', 'f'], ['m', 'm', 'f'], ['m', 'm', 'f'], ['m', 'm', 'f'], ['m', 'm', 'f']];
const ST = { m: { c: PAL.moss, l: 'meets' }, p: { c: PAL.ochre, l: 'partly' }, f: { c: PAL.coral, l: 'fails' }, x: { c: PAL.ink3, l: 'misfits' } };
const MX = { numX: 158, labX: 176, whoX: 604, y0: 350, dy: 54, x1: 820 };
const rowY = (i) => MX.y0 + i * MX.dy;

// Status glyph: check, half disc, cross, or a wavy misfit line, inside a ring.
function glyph(g, s, x, y, r, a = 1) {
  if (a <= 0) return; const c = ST[s].c;
  g.circle(x, y, r, { fill: U.rgba(c, 0.2), stroke: c, w: 2, alpha: a });
  if (s === 'm') g.poly([[x - r * 0.46, y + r * 0.02], [x - r * 0.12, y + r * 0.36], [x + r * 0.5, y - r * 0.36]], { color: c, w: 3, alpha: a });
  else if (s === 'p') g.circle(x, y, r * 0.56, { fill: c, a0: -Math.PI / 2, a1: Math.PI / 2, alpha: a });
  else if (s === 'f') { g.line(x - r * 0.38, y - r * 0.38, x + r * 0.38, y + r * 0.38, { color: c, w: 3, alpha: a }); g.line(x + r * 0.38, y - r * 0.38, x - r * 0.38, y + r * 0.38, { color: c, w: 3, alpha: a }); }
  else g.poly(Array.from({ length: 13 }, (_, k) => [x - r * 0.5 + k * r / 12, y + Math.sin(k / 12 * Math.PI * 2) * r * 0.2]), { color: c, w: 2.6, alpha: a });
}
// One matrix cell. p: reveal progress; dim: 0..1 de-emphasis (rows outside the current definition).
function cell(g, x, y, w, h, s, p, note, dim = 0, noteA = 1) {
  if (p <= 0) return; const c = U.mix(ST[s].c, '#5E5A74', dim * 0.75); const a = p * (1 - 0.6 * dim);
  const ww = w * ease.out(Math.min(1, p * 1.4));
  g.rect(x, y, ww, h, { r: 6, fill: U.rgba(c, 0.17), stroke: U.rgba(c, 0.75), w: 1.5, alpha: a });
  glyph(g, s, x + 25, y + h / 2, Math.min(14, h * 0.32), a * clamp(p * 2 - 0.6));
  if (note) { const o = { size: 21, color: dim > 0.5 ? PAL.ink3 : PAL.ink }; g.text(note, x + 48, y + h / 2 + 7.5, { ...o, size: fitSize(g, note, w - 58, o), alpha: a * noteA * clamp(p * 2 - 1) }); }
}
// A matrix row label: chapter numeral, criterion, proponents.
function rowLabel(g, i, a, o = {}) {
  if (a <= 0) return; const R = ROWS[i]; const y = rowY(i) + (o.dy || 0); const dim = o.dim || 0;
  g.text(R.ch, MX.numX, y + 7, { size: 19, role: 'mono', color: chCol(R.ch), align: 'right', alpha: a * (1 - 0.6 * dim) });
  const lo = { size: 21, weight: 600, ls: 1.4 }; const s = R.k.toUpperCase();
  g.text(s, MX.labX + (o.dx || 0), y + 7.5, { ...lo, size: fitSize(g, s, MX.whoX - MX.labX - 22, lo), color: dim > 0 ? U.mix(PAL.ink, PAL.ink3, dim) : (o.col || PAL.ink), alpha: a });
  if (o.who !== false) g.text(o.whoText || R.who, MX.whoX, y + 7.5, { size: 21, italic: true, color: PAL.ink2, alpha: a * (o.whoA ?? 1) * (1 - 0.6 * dim) });
}
// A five-pointed star (astrology).
function star(g, x, y, r, o) { const pts = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } g.poly(pts, o); }
// Small person silhouette (people are violet in this film).
function person(g, x, y, s, a, col = PAL.violet) { g.circle(x, y - s * 1.55, s * 0.55, { fill: col, alpha: a }); g.ellipse(x, y - s * 0.35, s * 0.95, s * 0.7, { fill: col, alpha: a }); }

// ---- demarc-criteria: right-panel emblems (centre x 1085, panel x 860–1310) ----
const PXC = 1085;
const eyeGlyph = (g, cx, cy, w, h, col, open = 1) => {
  const up = [], dn = []; for (let k = 0; k <= 32; k++) { const u = k / 32, x = cx - w / 2 + w * u, s = Math.sin(Math.PI * u); up.push([x, cy - h * s * open]); dn.push([x, cy + h * s]); }
  g.poly(up, { color: col, w: 2.6 }); g.poly(dn, { color: col, w: 2.6 });
  if (open > 0.3) { g.circle(cx, cy, h * 0.62, { stroke: col, w: 2.4 }); g.circle(cx, cy, h * 0.26, { fill: col }); }
  else for (let k = -2; k <= 2; k++) g.line(cx + k * w * 0.16, cy + h * 0.15, cx + k * w * 0.2, cy + h * 0.5, { color: col, w: 2 });
};
function emVerify(g, a, p) {
  g.withAlpha(a, () => {
    caps(g, 'verification principle', PXC, 300, { align: 'center', color: chCol('II') });
    eyeGlyph(g, PXC, 470, 250, 70, PAL.ink2);
    g.circle(PXC + 120, 400, 26, { fill: U.rgba(PAL.moss, 0.2), stroke: PAL.moss, w: 2, alpha: p });
    g.poly([[PXC + 108, 400], [PXC + 117, 410], [PXC + 133, 390]], { color: PAL.moss, w: 3, progress: p });
    g.wrap('A statement is meaningful only if observation could verify it', PXC, 610, 400, { size: 24, role: 'display', italic: true, color: PAL.ink, align: 'center', lh: 1.25 });
  });
}
function emSwans(g, a, ps, pb, pk) {
  g.withAlpha(a, () => {
    caps(g, 'falsification', PXC, 300, { align: 'center', color: chCol('IV') });
    const w = g.text('“All swans are white”', PXC, 380, { size: 34, role: 'display', italic: true, color: PAL.ink, align: 'center' });
    g.line(PXC - w / 2 - 6, 368, PXC - w / 2 - 6 + (w + 12) * pk, 368, { color: PAL.coral, w: 3, alpha: pk > 0 ? 1 : 0 });
    for (let k = 0; k < 5; k++) {
      const x = 915 + k * 85, black = k === 3, ak = black ? pb : clamp(ps * 5 - k * 0.8); if (ak <= 0) continue;
      if (black) { g.glow(x, 498, 64, PAL.coral, 0.4 * ak); g.icon('swan', x, 500 - (1 - ak) * 20, 74, '#07060D', { alpha: ak }); }
      else g.icon('swan', x, 500, 66, PAL.snow, { alpha: ak * 0.9 });
    }
    caps(g, 'one black swan refutes it', PXC, 610, { align: 'center', color: PAL.coral, alpha: pk });
  });
}
function emPuzzle(g, a, p) {
  g.withAlpha(a, () => {
    const col = chCol('V'); caps(g, 'normal science', PXC, 300, { align: 'center', color: col });
    const s = 92, x0 = PXC - 1.5 * s, y0 = 360;
    for (let k = 0; k < 6; k++) {
      const i = k % 3, j = Math.floor(k / 3); const last = k === 5; const off = last ? (1 - ease.out(p)) * 150 : 0; const al = last ? clamp(p * 3) : 1;
      const x = x0 + i * s + off, y = y0 + j * s;
      g.rect(x + 3, y + 3, s - 6, s - 6, { r: 6, fill: U.rgba(col, last ? 0.32 : 0.14), stroke: col, w: 2, alpha: al });
      if (i < 2) g.circle(x + s - 3, y + s / 2, 12, { fill: U.rgba(col, 0.5), alpha: al });
      if (j < 1) g.circle(x + s / 2, y + s - 3, 12, { fill: U.rgba(col, 0.5), alpha: al });
    }
    g.wrap('Research as puzzle-solving within a shared paradigm', PXC, 610, 400, { size: 24, role: 'display', italic: true, color: PAL.ink, align: 'center', lh: 1.25 });
  });
}
function emRings(g, a, p) {
  g.withAlpha(a, () => {
    const col = chCol('IV'); caps(g, 'research program', PXC, 300, { align: 'center', color: col });
    const cx = PXC - 40, cy = 470;
    g.circle(cx, cy, 120, { fill: U.rgba(PAL.ochre, 0.08), stroke: PAL.ochre, w: 2 });
    g.circle(cx, cy, 52, { fill: U.rgba(col, 0.3), stroke: col, w: 2.4 });
    caps(g, 'hard core', cx, cy + 6, { align: 'center', color: PAL.ink, size: 17, ls: 1.6 });
    caps(g, 'protective belt', cx, cy - 78, { align: 'center', color: PAL.ochre, size: 17, ls: 1.6 });
    const ex = cx + 168, ey = 372; g.arrow(cx + 92, cy - 50, ex - 22, ey + 16, { color: PAL.moss, w: 2.6, head: 13, progress: p });
    star(g, ex, ey, 18, { fill: PAL.moss, color: PAL.moss, w: 1, alpha: clamp(p * 2 - 1) });
    g.text('novel prediction', ex + 4, ey - 30, { size: 21, color: PAL.moss, align: 'center', alpha: clamp(p * 2 - 1) });
    g.wrap('Progressive if its adjustments predict new facts', PXC, 650, 400, { size: 24, role: 'display', italic: true, color: PAL.ink, align: 'center', lh: 1.25 });
  });
}
function emThagard(g, a, p, pi) {
  g.withAlpha(a, () => {
    caps(g, 'Thagard 1978', PXC, 300, { align: 'center', color: COL });
    caps(g, 'stylized', 1310, 300, { align: 'right', size: 15 });
    const A = g.axes({ x: 930, y: 360, w: 350, h: 250, xlab: 'Time', ylab: 'Progress', labSize: 22, progress: clamp(p * 2) });
    g.plot(A, (x) => 0.26 + 0.68 * Math.pow(x, 1.4), { color: PAL.moss, w: 3.5, progress: clamp(p * 1.6 - 0.3) });
    g.plot(A, (x) => 0.26 + 0.025 * Math.sin(x * 9), { color: PAL.coral, w: 3.5, progress: clamp(p * 1.6 - 0.5) });
    g.text('rivals progress', A.X(0.9), A.Y(0.9) - 4, { size: 21, color: PAL.moss, align: 'right', alpha: clamp(p * 2 - 1) });
    g.text('pseudoscience stagnates', A.X(0.98), A.Y(0.26) + 36, { size: 21, color: PAL.coral, align: 'right', alpha: clamp(p * 2 - 1) });
    g.withAlpha(pi, () => { eyeGlyph(g, 1000, 700, 70, 16, PAL.coral, 0); g.text('and its practitioners ignore it', 1050, 707, { size: 21, italic: true, color: PAL.coral }); });
  });
}
function emNatural(g, a, p, pb) {
  g.withAlpha(a, () => {
    caps(g, 'methodological naturalism', PXC, 300, { align: 'center', color: COL });
    const cx = PXC, cy = 500; g.circle(cx, cy, 168, { stroke: COL, w: 2.2, dash: [8, 8], fill: U.rgba(COL, 0.05) });
    caps(g, 'natural causes', cx, cy - 120, { align: 'center', color: COL });
    const ic = [['wolf', PAL.coral, cx - 106], ['elk', PAL.sand, cx], ['aspen', PAL.moss, cx + 106]];
    ic.forEach(([k, c, x], i) => { g.icon(k, x, cy + 4, 62, c, { alpha: clamp(p * 3 - i * 0.6) }); if (i < 2) g.arrow(x + 34, cy + 4, x + 70, cy + 4, { color: PAL.ink2, w: 2.2, head: 11, progress: clamp(p * 3 - i * 0.6 - 0.6) }); });
    g.text('natural phenomena, natural causes', cx, cy + 82, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: clamp(p * 2 - 1) });
    g.text('whatever one believes beyond them', cx, 720, { size: 22, italic: true, color: PAL.ink3, align: 'center', alpha: pb });
    for (const [x, y] of [[915, 345], [1262, 360], [905, 660], [1270, 650]]) g.text('?', x, y, { size: 30, role: 'display', italic: true, color: PAL.ink3, align: 'center', alpha: 0.6 * pb });
  });
}
function emInstitutions(g, a, p, pp) {
  g.withAlpha(a, () => {
    caps(g, 'Merton · Longino', PXC, 300, { align: 'center', color: chCol('XII') });
    const cx = PXC, cy = 460;
    for (let k = 0; k < 6; k++) {
      const an = -Math.PI / 2 + k * Math.PI / 3, x = cx + Math.cos(an) * 140, y = cy + Math.sin(an) * 112, ak = clamp(p * 4 - k * 0.4);
      g.arrow(x - Math.cos(an) * 26, y - Math.sin(an) * 22, cx + Math.cos(an) * 56, cy + Math.sin(an) * 62, { color: PAL.ink3, w: 1.8, head: 10, alpha: ak });
      person(g, x, y + 16, 15, ak, U.rgba(PAL.violet, 0.9));
    }
    g.rect(cx - 38, cy - 50, 76, 100, { r: 4, fill: '#1D1A33', stroke: PAL.ink2, w: 2 });
    for (let k = 0; k < 4; k++) g.line(cx - 24, cy - 28 + k * 18, cx + 22 - (k % 2) * 16, cy - 28 + k * 18, { color: PAL.ink3, w: 2.2 });
    ['open criticism', 'peer review', 'shared standards'].forEach((s, k) => g.pill(s, cx, 650 + k * 52, { size: 22, color: chCol('XII'), align: 'center', alpha: pp[k] }));
  });
}
function emLaudan(g, a, p) {
  g.withAlpha(a, () => {
    caps(g, 'Laudan 1983', PXC, 300, { align: 'center', color: COL });
    const cx = PXC, top = 350, w = 250, h = 300; const pts = [];
    for (let k = 0; k <= 24; k++) { const an = Math.PI + Math.PI * k / 24; pts.push([cx + Math.cos(an) * w / 2, top + w / 2 + Math.sin(an) * w / 2]); }
    const stone = [[cx - w / 2, top + h], ...pts, [cx + w / 2, top + h]];
    g.poly(stone, { color: PAL.ink2, w: 2.4, progress: p, fill: p >= 1 ? 'rgba(30,27,52,0.9)' : undefined });
    g.line(cx - 190, top + h, cx + 190, top + h, { color: PAL.ink3, w: 2, progress: p });
    g.withAlpha(clamp(p * 2 - 1), () => {
      caps(g, 'here lies', cx, top + 92, { align: 'center' });
      g.text('the demarcation', cx, top + 146, { size: 32, role: 'display', color: PAL.ink, align: 'center' });
      g.text('problem', cx, top + 184, { size: 32, role: 'display', color: PAL.ink, align: 'center' });
      g.text('declared dead, 1983', cx, top + 238, { size: 21, italic: true, color: PAL.ink2, align: 'center' });
    });
    for (const dx of [-160, -120, 140, 172]) g.icon('grass', cx + dx, top + h - 12, 26, PAL.moss, { alpha: 0.6 * p });
  });
}
function emCounter(g, a, p1, p2) {
  g.withAlpha(a, () => {
    const note = (y, p, title, line, tag, col, draw) => g.withAlpha(p, () => {
      g.rect(866, y, 444, 160, { r: 8, fill: 'rgba(24,21,44,0.95)', stroke: U.rgba(col, 0.6), w: 1.5 });
      draw(918, y + 80);
      g.text(title, 972, y + 52, { size: 32, role: 'display', color: PAL.ink });
      g.text(line, 972, y + 86, { size: 21, color: PAL.ink2 });
      caps(g, tag, 972, y + 126, { color: col, size: 17, ls: 1.6 });
      g.arrow(866, y + 80, 826, rowY(1) + (y < 400 ? -4 : 12), { color: U.rgba(col, 0.8), w: 2, head: 11, progress: clamp(p * 1.5 - 0.3) });
    });
    note(330, p1, 'Astrology', 'testable claims, failed tests', 'falsifiable, so it qualifies', PAL.coral, (x, y) => { star(g, x, y - 6, 28, { color: PAL.ochre, w: 2.4 }); star(g, x - 26, y + 34, 9, { fill: PAL.ochre, color: null, w: 0 }); star(g, x + 26, y + 30, 7, { fill: PAL.ochre, color: null, w: 0 }); });
    note(530, p2, 'Good science', 'often hard to falsify', 'unfalsifiable, so it fails', PAL.ochre, (x, y) => { g.icon('wolf', x - 8, y - 18, 40, PAL.coral); g.icon('elk', x + 8, y + 26, 40, PAL.sand); g.text('?', x + 34, y - 14, { size: 30, role: 'display', italic: true, color: PAL.ink2 }); });
  });
}
// Radar for the cluster idea (ILLUSTRATIVE values).
const RADAR = { ax: ['peer-criticized', 'testable', 'measured', 'systematic', 'interpretive', 'progressive'], sys: 3, f: [
  { nm: 'physics', c: PAL.lagoon, v: [0.85, 0.95, 0.95, 0.9, 0.15, 0.85] },
  { nm: 'ecology', c: PAL.moss, v: [0.85, 0.7, 0.85, 0.78, 0.35, 0.65] },
  { nm: 'history', c: PAL.clay, v: [0.85, 0.3, 0.35, 0.82, 0.95, 0.55] },
], every: [0.15, 0.35, 0.2, 0.22, 0.5, 0.25] };
function emRadar(g, a, pf, pp, ps, pw, t) {
  g.withAlpha(a, () => {
    caps(g, 'cluster concept', 870, 290, { color: COL }); caps(g, 'illustrative', 1310, 290, { align: 'right', size: 15 });
    const cx = 1085, cy = 505, R = 128; const ang = (k) => -Math.PI / 2 + k * Math.PI / 3;
    const P = (k, v) => [cx + Math.cos(ang(k)) * R * v, cy + Math.sin(ang(k)) * R * v];
    for (const v of [0.33, 0.66, 1]) g.poly([0, 1, 2, 3, 4, 5, 0].map((k) => P(k, v)), { color: PAL.rule, w: 1, progress: pf });
    RADAR.ax.forEach((nm, k) => {
      const [x, y] = P(k, 1); g.line(cx, cy, x, y, { color: PAL.rule, w: 1, alpha: pf });
      const c = Math.cos(ang(k)), s = Math.sin(ang(k)); const al = Math.abs(c) < 0.2 ? 'center' : c > 0 ? 'left' : 'right';
      const hi = k === RADAR.sys ? ps : 0;
      g.text(nm, cx + c * (R + 16), cy + s * (R + 16) + 7 + (Math.abs(c) < 0.2 ? s * 10 : 0), { size: 21, color: U.mix(PAL.ink2, COL, hi), weight: hi > 0.5 ? 600 : 400, align: al, alpha: pf });
    });
    if (ps > 0) { const [x, y] = P(RADAR.sys, 1.0); g.glow(x, y, 46, COL, 0.5 * ps); }
    RADAR.f.forEach((f, i) => {
      const q = clamp(pp * 3 - i); if (q <= 0) return;
      const pts = [0, 1, 2, 3, 4, 5, 0].map((k) => P(k, f.v[k] * ease.out(q)));
      g.poly(pts, { fill: U.rgba(f.c, 0.14), color: f.c, w: 2.4 });
      g.circle(905, 702 + i * 34, 7, { fill: f.c, alpha: q }); g.text(f.nm, 922, 709 + i * 34, { size: 21, color: f.c, alpha: q });
    });
    if (ps > 0) { g.poly([0, 1, 2, 3, 4, 5, 0].map((k) => P(k, RADAR.every[k] * ease.out(ps))), { color: PAL.ink2, w: 2, dash: [6, 6], alpha: ps }); g.circle(1085, 702, 7, { stroke: PAL.ink2, w: 2, alpha: ps }); g.text('everyday knowledge', 1102, 709, { size: 21, color: PAL.ink2, alpha: ps }); }
    if (pw > 0) {
      const env = [0, 1, 2, 3, 4, 5, 0].map((k) => P(k, Math.min(1.06, Math.max(...RADAR.f.map((f) => f.v[k])) + 0.07)));
      g.poly(env, { color: COL, w: 2.4, dash: [10, 7], progress: pw });
      g.text('Wissenschaft', 1085, 805, { size: 30, role: 'display', italic: true, color: COL, align: 'center', alpha: pw });
      g.text('systematic knowledge, from physics to history', 1085, 838, { size: 21, color: PAL.ink2, align: 'center', alpha: pw });
    }
  });
}

// ---- demarc-kaibab drawings ---------------------------------------------------
// Luggage tag: shows face A (failure) then flips about its horizontal axis to face B (correction).
function luggageTag(g, x, y, w, h, A, B, flip, a, rot) {
  if (a <= 0) return; const ctx = g.ctx; const sy = Math.abs(Math.cos(Math.PI * flip)); const face = flip < 0.5 ? A : B; const col = flip < 0.5 ? PAL.coral : PAL.moss;
  g.with(() => {
    ctx.translate(x, y + h / 2); ctx.rotate(rot); ctx.scale(1, Math.max(0.02, sy)); ctx.translate(-x, -(y + h / 2));
    g.withAlpha(a, () => {
      const pts = [[x + 20, y], [x + w, y], [x + w, y + h], [x + 20, y + h], [x, y + h - 20], [x, y + 20], [x + 20, y]];
      g.poly(pts, { fill: '#221E3A', color: col, w: 2 });
      g.circle(x + 17, y + h / 2, 5.5, { fill: PAL.bg, stroke: col, w: 1.5 });
      const o = { size: 19, weight: 600, ls: 1.4 }; const s = face.toUpperCase();
      g.text(s, x + 38, y + h / 2 + 7, { ...o, size: fitSize(g, s, w - 52, o), color: col });
    });
  });
}
// Stylized textbook curve: deer irrupt after predators are removed, then crash.
const kaibabCurve = (x) => (x < 0.64 ? 0.15 + 0.8 * U.smooth((x - 0.27) / 0.37) : 0.95 - 0.73 * U.smooth((x - 0.64) / 0.16));
const RECORDS = [[0.1, 0.05, 0.08], [0.2, -0.07, 0.1], [0.33, 0.16, 0.14], [0.42, -0.22, 0.18], [0.5, 0.12, 0.2], [0.58, -0.32, 0.22], [0.67, 0.06, 0.24], [0.74, 0.2, 0.18], [0.84, -0.04, 0.12], [0.93, 0.1, 0.1]];
function redPencil(g, x, y, ang, a) {
  if (a <= 0) return; const ctx = g.ctx;
  g.withAlpha(a, () => g.with(() => {
    ctx.translate(x, y); ctx.rotate(ang);
    g.poly([[0, 0], [16, -6], [16, 6], [0, 0]], { fill: '#E9C99A', color: null, w: 0 }); g.poly([[0, 0], [6, -2.3], [6, 2.3], [0, 0]], { fill: RED, color: null, w: 0 });
    g.rect(16, -6, 74, 12, { fill: RED }); g.rect(16, -6, 74, 4, { fill: 'rgba(255,255,255,0.18)' }); g.rect(86, -6, 8, 12, { fill: '#B8B0A0' });
  }));
}

// ---- demarc-stakes drawings ---------------------------------------------------
// Courtroom elevation in a 560×440 local box. The bar's top rail (local y 372) is drawn by the caller as the line.
function courtroom(g, x0, y0, s, P, lift) {
  const ctx = g.ctx, ink = PAL.ink2; const W = (w) => w * (0.62 + 0.38 * s) / s; const ppl = U.rgba(PAL.violet, 0.85);
  g.with(() => {
    ctx.translate(x0, y0); ctx.scale(s, s);
    // seal with the scales of justice
    g.circle(280, 34, 28, { stroke: ink, w: W(2), alpha: P.seal });
    g.withAlpha(P.seal, () => {
      g.line(280, 16, 280, 52, { color: ink, w: W(1.6) }); g.line(260, 24, 300, 24, { color: ink, w: W(1.6) });
      for (const px of [262, 298]) { g.line(px, 24, px, 32, { color: ink, w: W(1.2) }); g.circle(px, 33, 7, { stroke: ink, w: W(1.4), a0: 0, a1: Math.PI }); }
    });
    // judge and witness (people), then the bench in front of the judge
    g.withAlpha(P.judge, () => { person(g, 280, 140, 26, 1, ppl); person(g, 506, 176, 15, 1, ppl); });
    g.rect(116, 132, 328, 108, { fill: PAL.bg, alpha: P.bench });
    g.poly(rectPts(116, 132, 328, 108), { color: ink, w: W(2.2), progress: P.bench });
    for (let i = 0; i < 3; i++) g.poly(rectPts(132 + i * 104, 148, 88, 76), { color: ink, w: W(1.2), alpha: 0.5, progress: P.bench });
    g.line(96, 132, 464, 132, { color: PAL.ink, w: W(3), progress: P.bench });
    g.rect(474, 176, 64, 64, { fill: PAL.bg, alpha: P.bench }); g.poly(rectPts(474, 176, 64, 64), { color: ink, w: W(1.8), progress: P.bench });
    // gavel (pivots at the handle end; lift raises the head)
    g.withAlpha(P.bench, () => g.with(() => { ctx.translate(446, 126); ctx.rotate(0.55 * lift); g.line(0, 0, -34, 0, { color: PAL.clay, w: W(3) }); g.rect(-46, -10, 16, 20, { fill: PAL.clay, r: 3 }); }));
    g.line(0, 240, 560, 240, { color: PAL.ink3, w: W(1.4), progress: P.floor });
    // counsel tables with two people each
    for (const tx of [36, 334]) {
      g.withAlpha(P.tables, () => { person(g, tx + 58, 290, 13, 1, ppl); person(g, tx + 132, 290, 13, 1, ppl); });
      g.line(tx, 292, tx + 190, 292, { color: ink, w: W(2.6), progress: P.tables });
      g.line(tx + 12, 292, tx + 12, 338, { color: ink, w: W(1.6), alpha: P.tables }); g.line(tx + 178, 292, tx + 178, 338, { color: ink, w: W(1.6), alpha: P.tables });
    }
    // the bar: balusters below the rail, a gate in the middle
    for (let i = 0; i < 31; i++) { const bx = 9 + i * 18; if (bx > 254 && bx < 306) continue; g.line(bx, 375, bx, 420, { color: ink, w: W(1.5), alpha: 0.75, progress: clamp(P.bar * 1.7 - i / 31 * 0.7) }); }
    g.line(0, 420, 560, 420, { color: ink, w: W(2), progress: P.bar });
    g.withAlpha(P.bar, () => { g.line(262, 384, 298, 384, { color: ink, w: W(1.6) }); g.line(262, 408, 298, 408, { color: ink, w: W(1.6) }); g.line(262, 384, 298, 408, { color: ink, w: W(1.2), alpha: 0.6 }); });
  });
}
// A court ruling card (local 270×300).
function rulingCard(g, x, y, c, a, pS, rot) {
  if (a <= 0) return; const ctx = g.ctx;
  g.withAlpha(a, () => g.with(() => {
    ctx.translate(x + 135, y + 150); ctx.rotate(rot); ctx.translate(-135, -150);
    g.rect(4, 6, 270, 320, { r: 8, fill: 'rgba(0,0,0,0.35)' });
    g.rect(0, 0, 270, 320, { r: 8, fill: 'rgba(24,21,44,0.97)', stroke: 'rgba(239,232,216,0.24)', w: 1.5 });
    g.rect(0, 0, 270, 6, { r: 3, fill: COL });
    const to = { size: 17, weight: 600, ls: 1.1 }; caps(g, c.tag, 20, 40, { ...to, size: fitSize(g, c.tag.toUpperCase(), 232, to), color: COL });
    g.text(c.year, 18, 118, { size: 76, role: 'display', color: PAL.ink });
    g.text(c.subj, 20, 164, { size: 32, role: 'display', italic: true, color: PAL.ink });
    g.wrap(c.gloss, 20, 200, 232, { size: 21, color: PAL.ink2, lh: 1.25 });
    if (pS > 0) g.with(() => {
      const sc = lerp(1.7, 1, ease.out(pS)); ctx.translate(135, 278); ctx.rotate(-0.13); ctx.scale(sc, sc);
      g.withAlpha(clamp(pS * 1.6), () => {
        g.rect(-104, -24, 208, 48, { r: 5, stroke: PAL.coral, w: 3 }); g.rect(-98, -18, 196, 36, { r: 3, stroke: PAL.coral, w: 1.2 });
        g.text('NOT SCIENCE', 0, 9, { size: 25, weight: 700, ls: 2.4, color: PAL.coral, align: 'center' });
      });
    });
  }));
}
// Other places where the line is drawn: a funding panel, a journal, an assessment report. (cx, by) = bottom centre.
function fundingPanel(g, cx, by, a) {
  if (a <= 0) return; const ppl = U.rgba(PAL.violet, 0.85);
  g.withAlpha(a, () => {
    for (const dx of [-62, 0, 62]) person(g, cx + dx, by - 74, 18, 1, ppl);
    g.line(cx - 104, by - 72, cx + 104, by - 72, { color: PAL.ink2, w: 3 });
    g.line(cx - 92, by - 72, cx - 92, by, { color: PAL.ink2, w: 2 }); g.line(cx + 92, by - 72, cx + 92, by, { color: PAL.ink2, w: 2 });
    g.rect(cx - 70, by - 64, 140, 38, { r: 3, fill: 'rgba(24,21,44,0.9)', stroke: PAL.rule, w: 1.2 });
    for (let k = 0; k < 3; k++) g.line(cx - 58, by - 54 + k * 9, cx + 30 - k * 14, by - 54 + k * 9, { color: PAL.ink3, w: 2 });
    g.circle(cx, by - 158, 25, { stroke: PAL.ochre, w: 2.4, fill: U.rgba(PAL.ochre, 0.12) });
    g.text('$', cx, by - 147, { size: 30, role: 'display', color: PAL.ochre, align: 'center' });
  });
}
function journal(g, cx, by, a) {
  if (a <= 0) return;
  g.withAlpha(a, () => {
    g.rect(cx - 56, by - 186, 124, 178, { r: 4, fill: 'rgba(24,21,44,0.9)', stroke: PAL.rule, w: 1.2 });
    g.rect(cx - 66, by - 196, 124, 178, { r: 4, fill: '#1D1A33', stroke: PAL.ink2, w: 2 });
    g.rect(cx - 66, by - 196, 124, 40, { r: 4, fill: U.rgba(PAL.lagoon, 0.3) });
    for (let k = 0; k < 4; k++) g.line(cx - 50, by - 132 + k * 18, cx + 40 - (k % 2) * 30, by - 132 + k * 18, { color: PAL.ink3, w: 2.4 });
    g.circle(cx + 30, by - 46, 17, { stroke: PAL.moss, w: 2.2 }); g.poly([[cx + 22, by - 46], [cx + 28, by - 40], [cx + 39, by - 53]], { color: PAL.moss, w: 2.6 });
  });
}
function report(g, cx, by, a) {
  if (a <= 0) return;
  g.withAlpha(a, () => {
    const x = cx - 84, y = by - 200, w = 168, h = 192;
    g.poly([[x, y], [x + w - 30, y], [x + w, y + 30], [x + w, y + h], [x, y + h], [x, y]], { fill: '#1D1A33', color: PAL.ink2, w: 2 });
    g.poly([[x + w - 30, y], [x + w - 30, y + 30], [x + w, y + 30]], { color: PAL.ink2, w: 1.5 });
    g.line(x + 16, y + 24, x + 110, y + 24, { color: PAL.ink, w: 3 }); g.line(x + 16, y + 40, x + 90, y + 40, { color: PAL.ink3, w: 2 });
    g.rect(x + 16, y + 56, 80, 64, { r: 3, stroke: PAL.rule, w: 1.2 });
    for (let k = 0; k < 3; k++) g.ellipse(x + 56, y + 88, 30 - k * 9, 22 - k * 7, { stroke: PAL.lagoon, w: 1.5, alpha: 0.8 });
    [[0.6, PAL.moss], [0.9, PAL.ochre], [0.45, PAL.coral]].forEach(([v, c], k) => g.rect(x + 110 + k * 16, y + 120 - 60 * v, 11, 60 * v, { fill: c, alpha: 0.85 }));
    for (let k = 0; k < 3; k++) g.line(x + 16, y + 142 + k * 15, x + w - 20 - (k % 2) * 30, y + 142 + k * 15, { color: PAL.ink3, w: 2 });
  });
}

Theater.chapter({
  id: 'demarc', roman: 'XIII', title: 'Demarcation', color: COL,
  question: 'What counts as science, and who decides?',
  casefile: { title: 'The Kaibab story, revisited', sketch: 'deer' },
  intro: { t: 'Chapter thirteen. Demarcation: what counts as science, and who decides.' },
  scenes: [
    {
      id: 'demarc-stakes', title: 'Why the line matters', register: 'claim',
      beats: [
        { t: 'What counts as science? The demarcation problem sounds academic until a court must decide. In 1982, a federal judge struck down an Arkansas law requiring that creation science be taught alongside evolution, ruling that it was not science. In 2005, another court ruled the same of intelligent design.',
          cite: 'McLean v. Arkansas 1982; Kitzmiller v. Dover 2005',
          v: 'A courtroom drawn as a simple line diagram; two case cards with years.' },
        { t: 'In 1993, the Supreme Court’s Daubert decision asked judges to screen expert testimony by testability, peer review, error rates, standards, and general acceptance. Funders, journals, and environmental assessments draw similar lines, and those lines decide whose knowledge shapes decisions.',
          s: 'In 1993, the Supreme Court’s Daw-bert decision asked judges to screen expert testimony by testability, peer review, error rates, standards, and general acceptance. Funders, journals, and environmental assessments draw similar lines, and those lines decide whose knowledge shapes decisions.',
          cite: 'Daubert v. Merrell Dow 1993',
          v: 'Five Daubert factors as a checklist; then the line extends from the courtroom to a funding panel and an assessment report.' },
      ],
      init() {
        // Knowledge tokens rising toward the line at each station; some pass, some are held back.
        const r = U.rng(1301); const tokens = [];
        for (let i = 0; i < 30; i++) tokens.push({ st: i % 4, dx: (r() - 0.5) * 34, y0: 790 + r() * 90, d: i * 0.11 + r() * 0.2, pass: r() < 0.55 });
        return { tokens };
      },
      draw(g, t, S, D) {
        const LY = 700, X0 = 110, X1 = 1300;
        const tProb = cue(S, 0, 'The demarcation problem'), tCourt = cue(S, 0, 'until a court'), t82 = cue(S, 0, 'In 1982'), tR1 = cue(S, 0, 'ruling that it was'), t05 = cue(S, 0, 'In 2005'), tR2 = cue(S, 0, 'ruled the same');
        const tJudge = cue(S, 1, 'asked judges'), tFac = ['testability', 'peer review', 'error rates', 'standards', 'general acceptance'].map((w) => cue(S, 1, w));
        const tFund = cue(S, 1, 'Funders'), tJour = cue(S, 1, 'journals'), tEnv = cue(S, 1, 'environmental assessments'), tDec = cue(S, 1, 'those lines decide'), tWho = cue(S, 1, 'whose knowledge');
        const z = ease.inOut((t - tFund + 0.6) / 1.4); // pull back: the courtroom becomes one station on a longer line

        // The opening question.
        const qa = S.p(0, 0.9, 0.1) * (1 - S.tp(tCourt - 0.4, 0.7));
        g.text('What counts as science?', 705, 500, { size: 66, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: qa });
        // The line, and the two sides it makes.
        g.line(X0, LY, X1, LY, { color: COL, w: 3.2, progress: S.p(0, 1.8, 0.7) });
        const za = S.tp(tProb, 0.8) * (1 - z);
        caps(g, 'science', X1, LY - 16, { align: 'right', color: COL, alpha: za });
        caps(g, 'not science', X1, LY + 34, { align: 'right', alpha: za });
        g.withAlpha(S.tp(tProb + 0.4, 0.8) * (1 - S.tp(tCourt + 1.5, 0.8)), () => g.text('the demarcation problem', 705, 590, { size: 30, role: 'display', italic: true, color: COL, align: 'center' }));

        // The courtroom, built around the line.
        const s = lerp(1, 0.5, z), cy0 = LY - 372 * s;
        const P = { bench: S.tp(tCourt, 1.2), floor: S.tp(tCourt + 0.2, 1.0), bar: S.tp(tCourt + 0.3, 1.5), judge: S.tp(tCourt + 0.7, 0.8), seal: S.tp(tCourt + 1.0, 0.8), tables: S.tp(tCourt + 0.9, 1.0) };
        const lift = Math.max(...[tR1, tR1 + 0.4, tR2 + 0.3, tR2 + 0.7, tJudge, tJudge + 0.4].map((x) => bump((t - x) / 0.3)));
        const st = [{ x: X0 + 280 * s, nm: 'courts', t0: tFund - 0.6 }, { x: 580, nm: 'funders', t0: tFund }, { x: 868, nm: 'journals', t0: tJour }, { x: 1150, nm: 'assessments', t0: tEnv }];
        // Knowledge tokens rise to each line; those that pass go through the institution toward decisions (drawn first, so the stations occlude them).
        if (z > 0) {
          D.tokens.forEach((k) => {
            const t0 = tWho - 0.4 + k.d, u = t - t0; if (u <= 0) return;
            const x = st[k.st].x + k.dx * 0.6; let y, a = clamp(u * 3), col = PAL.ink2;
            if (u < 0.9) y = lerp(k.y0, LY + 10, ease.inOut(u / 0.9));
            else if (k.pass) { const v = ease.inOut((u - 0.9) / 1.4); y = lerp(LY + 10, 300, v); col = U.mix(PAL.ink2, PAL.violet, clamp(v * 3)); a *= 1 - clamp((v - 0.85) / 0.15); }
            else { const v = clamp((u - 0.9) / 0.9); y = LY + 10 + 26 * ease.out(v); col = PAL.ink3; a *= 1 - v; }
            g.dot(x, y, 5, col, a, 2.2);
          });
        }
        courtroom(g, X0, cy0, s, P, lift);

        // Beat 0: two rulings.
        const cards = [
          { tag: 'McLean v. Arkansas', year: '1982', subj: 'Creation science', gloss: 'a state law: teach it alongside evolution', chip: 'creation science', t0: t82, tS: tR1 + 0.3, x: 735, rot: -0.02 },
          { tag: 'Kitzmiller v. Dover', year: '2005', subj: 'Intelligent design', gloss: 'another court, the same ruling', chip: 'intelligent design', t0: t05, tS: tR2 + 0.4, x: 1035, rot: 0.018 },
        ];
        cards.forEach((c, k) => {
          const pin = S.tp(c.t0 - 0.2, 0.9); if (pin <= 0) return;
          const out = S.p(1, 0.7);
          rulingCard(g, c.x, 316 - (1 - ease.out(pin)) * 40 + out * 30, c, pin * (1 - out), S.tp(c.tS, 0.45), c.rot);
          // the subject drops below the line when the ruling lands
          const pd = S.tp(c.tS + 0.5, 0.9); if (pd <= 0) return;
          const cx = c.x + 135, y = lerp(640, LY + 70 + k * 46, ease.inOut(pd));
          if (pd < 1) g.glow(cx, LY, 40, PAL.coral, 0.5 * bump(pd * 1.2));
          g.pill(c.chip, cx, y, { color: PAL.coral, size: 21, align: 'center', alpha: clamp(pd * 3) * (1 - z) });
        });

        // Beat 1, first: the Daubert factors as a checklist.
        const da = S.p(1, 0.8, 0.4) * (1 - z);
        if (da > 0) g.withAlpha(da, () => {
          caps(g, 'Daubert v. Merrell Dow · 1993', 740, 262, { color: COL });
          g.text('Screening expert testimony', 740, 312, { size: 38, role: 'display', color: PAL.ink, alpha: S.tp(tJudge - 0.3, 0.8) });
          const facts = [['testability', 'can it be tested, and has it been?'], ['peer review', 'published and peer reviewed?'], ['error rates', 'a known or potential error rate?'], ['standards', 'standards controlling the technique?'], ['general acceptance', 'accepted in the relevant community?']];
          facts.forEach(([nm, gl], i) => {
            const y = 376 + i * 60, a = S.tp(tFac[i] - 0.2, 0.6); if (a <= 0) return;
            g.rect(740, y - 23, 26, 26, { r: 4, stroke: PAL.ink2, w: 2, alpha: a });
            g.poly([[745, y - 10], [752, y - 2], [764, y - 20]], { color: COL, w: 3.4, progress: S.tp(tFac[i] + 0.25, 0.4) });
            g.text(nm, 786, y, { size: 30, role: 'display', color: PAL.ink, alpha: a });
            g.text(gl, 786, y + 25, { size: 21, color: PAL.ink3, alpha: a });
          });
        });

        // Beat 1, then: the same line runs through funders, journals and assessments.
        if (z > 0) {
          const big = (x, fn) => g.with(() => { g.ctx.translate(x, LY - 4); g.ctx.scale(1.3, 1.3); g.ctx.translate(-x, -(LY - 4)); fn(); });
          caps(g, 'Daubert · five factors', st[0].x, cy0 - 26, { align: 'center', color: COL, alpha: z });
          big(st[1].x, () => fundingPanel(g, st[1].x, LY - 4, S.tp(st[1].t0 - 0.2, 0.8)));
          big(st[2].x, () => journal(g, st[2].x, LY - 4, S.tp(st[2].t0 - 0.2, 0.8)));
          big(st[3].x, () => report(g, st[3].x, LY - 4, S.tp(st[3].t0 - 0.2, 0.8)));
          st.forEach((q, k) => {
            const a = k === 0 ? z : S.tp(q.t0 - 0.2, 0.8);
            caps(g, q.nm, q.x, LY + 44, { align: 'center', color: PAL.ink2, alpha: a });
            g.line(q.x - 18, LY - 9, q.x - 18, LY + 9, { color: COL, w: 2.4, alpha: a }); g.line(q.x + 18, LY - 9, q.x + 18, LY + 9, { color: COL, w: 2.4, alpha: a });
          });
          // Decisions, fed by whatever passes each line.
          const dA = S.tp(tDec - 0.4, 0.8);
          if (dA > 0) {
            g.rect(X0, 228, X1 - X0, 60, { r: 8, fill: U.rgba(PAL.violet, 0.12), stroke: U.rgba(PAL.violet, 0.75), w: 1.6, alpha: dA });
            caps(g, 'decisions', X0 + 22, 264, { color: PAL.violet, alpha: dA });
            g.text('management · policy · law · funding', X0 + 170, 265, { size: 22, italic: true, color: PAL.ink2, alpha: dA });
            st.forEach((q, k) => { const top = k === 0 ? cy0 - 52 : LY - 278; g.arrow(q.x, top, q.x, 296, { color: U.rgba(PAL.violet, 0.7), w: 1.8, head: 11, dash: [5, 6], progress: S.tp(tDec + k * 0.12, 0.9) }); });
          }
          caps(g, 'whose knowledge gets through?', X1, 890, { align: 'right', color: PAL.violet, alpha: S.tp(tWho + 0.6, 0.8) });
        }
      },
      terms: [
        { beat: 0.3, term: 'Demarcation problem', def: 'The problem of distinguishing science from non-science and pseudoscience, and of saying on what grounds.' },
        { beat: 1.3, term: 'Daubert standard', def: 'The US test for admitting expert scientific testimony: testability, peer review, error rate, standards, and general acceptance.' },
      ],
    },
    {
      id: 'demarc-criteria', title: 'A century of criteria', register: 'claim',
      beats: [
        { t: 'Each philosophy we have met offered a criterion. The logical positivists: verifiability. Popper: falsifiability. Kuhn: a tradition of puzzle-solving. Lakatos: a progressive research program. And Paul Thagard: a pseudoscience is a field that stagnates while its rivals progress, and whose practitioners ignore that fact.',
          s: 'Each philosophy we have met offered a criterion. The logical positivists: verifiability. Popper: falsifiability. Kuhn: a tradition of puzzle-solving. Lak-a-tosh: a progressive research program. And Paul Thagard: a pseudoscience is a field that stagnates while its rivals progress, and whose practitioners ignore that fact.',
          cite: 'Thagard 1978',
          v: 'The matrix frame appears: criteria as rows, filled in one by one from earlier chapters with their chapter numbers.' },
        { t: 'The courts leaned on methodological naturalism: science explains natural phenomena by natural causes, whatever one believes beyond them. Merton and Longino point instead to institutions: open criticism, peer review, and shared standards.',
          v: 'Rows added: METHODOLOGICAL NATURALISM, INSTITUTIONAL NORMS.' },
        { t: 'In 1983, Larry Laudan declared the problem dead. No set of necessary and sufficient conditions had survived counterexamples. Astrology makes testable claims and fails them; much good science is hard to falsify.',
          cite: 'Laudan 1983',
          v: 'Each row gets a counterexample sticker; a stamp: “no necessary and sufficient conditions”.' },
        { t: 'Others revived it in looser form. Massimo Pigliucci treats science as a cluster concept, a family resemblance with no single essence. Paul Hoyningen-Huene argues that science differs from everyday knowledge by being more systematic. And the German word Wissenschaft names all systematic knowledge, from physics to history.',
          s: 'Others revived it in looser form. Massimo Pee-loo-chee treats science as a cluster concept, a family resemblance with no single essence. Paul Hoy-ning-en Hew-neh argues that science differs from everyday knowledge by being more systematic. And the German word Viss-en-shaft names all systematic knowledge, from physics to history.',
          cite: 'Pigliucci & Boudry 2013; Hoyningen-Huene 2013',
          v: 'Final rows: CLUSTER, SYSTEMATICITY, WISSENSCHAFT; a radar plot of overlapping dimensions illustrates the cluster idea.' },
      ],
      draw(g, t, S) {
        const tR = [cue(S, 0, 'The logical positivists'), cue(S, 0, 'Popper:'), cue(S, 0, 'Kuhn:'), cue(S, 0, 'Lakatos:'), cue(S, 1, 'methodological naturalism'), cue(S, 1, 'Merton and Longino'), cue(S, 3, 'Massimo Pigliucci'), cue(S, 3, 'Paul Hoyningen-Huene'), cue(S, 3, 'And the German word')];
        const tThag = cue(S, 0, 'And Paul Thagard'), tStag = cue(S, 0, 'stagnates'), tIgn = cue(S, 0, 'ignore that fact');
        const tBeyond = cue(S, 1, 'whatever one believes'), tInst = [cue(S, 1, 'open criticism'), cue(S, 1, 'peer review'), cue(S, 1, 'shared standards')];
        const tNo = cue(S, 2, 'No set of'), tCx = cue(S, 2, 'had survived counterexamples'), tAst = cue(S, 2, 'Astrology makes'), tHard = cue(S, 2, 'much good science');
        const tLoose = S.b(3), tFam = cue(S, 3, 'a family resemblance'), tSys = cue(S, 3, 'more systematic'), tWiss = cue(S, 3, 'names all systematic');

        // The matrix frame: criteria as rows, filled one by one with their chapter numerals.
        const fa = S.p(0, 1.0, 0.2);
        caps(g, 'ch.', MX.numX, 298, { align: 'right', alpha: fa }); caps(g, 'criterion', MX.labX, 298, { alpha: fa }); caps(g, 'proposed by', MX.whoX, 298, { alpha: fa });
        g.line(100, 314, MX.x1, 314, { color: PAL.ink3, w: 1.5, progress: fa });
        const focusEnd = [tR[1], tR[2], tR[3], S.b(1), tR[5], S.b(2), tR[7], tR[8], S.dur + 9];
        ROWS.forEach((R, i) => {
          const y = rowY(i), ra = S.tp(tR[i] - 0.15, 0.7);
          g.line(100, y + 27, MX.x1, y + 27, { color: PAL.faint, w: 1, progress: S.p(0, 1.2, 0.3 + i * 0.06) });
          g.rect(MX.labX - 10, y - 18, MX.x1 - MX.labX, 36, { r: 6, stroke: PAL.rule, w: 1, dash: [4, 7], alpha: fa * 0.7 * (1 - ra) });
          if (ra <= 0) return;
          const hf = S.tp(tR[i] - 0.2, 0.5) * (1 - S.tp(focusEnd[i] - 0.25, 0.5)) + (i === 1 ? S.tp(tAst - 0.2, 0.5) * (1 - S.tp(tLoose, 0.5)) : 0);
          if (hf > 0) { g.rect(96, y - 26, MX.x1 - 92, 52, { r: 6, fill: 'rgba(239,232,216,0.05)', stroke: U.rgba(COL, 0.4), w: 1.2, alpha: hf }); g.glow(MX.numX - 14, y, 30, chCol(R.ch), 0.35 * hf); }
          rowLabel(g, i, ra, { dx: (1 - ease.out(ra)) * 26 });
          if (i === 3) g.text(' · Thagard', MX.whoX + g.measure('Lakatos', { size: 21, italic: true }), y + 7.5, { size: 21, italic: true, color: COL, alpha: S.tp(tThag, 0.7) });
        });

        // Laudan: a counterexample sticker on every row so far, then the stamp.
        const stOut = 1 - S.tp(tLoose + 0.1, 0.8);
        for (let i = 0; i < 6; i++) {
          const ps = S.tp(tNo + 0.5 + i * 0.36, 0.35); if (ps <= 0 || stOut <= 0) continue;
          g.with(() => {
            const ctx = g.ctx; ctx.translate(722, rowY(i) + 2); ctx.rotate([-0.05, 0.04, -0.03, 0.05, -0.04, 0.03][i]); const sc = lerp(1.35, 1, ease.out(ps)); ctx.scale(sc, sc);
            g.withAlpha(clamp(ps * 2) * stOut, () => {
              g.rect(-94, -15, 192, 36, { r: 3, fill: 'rgba(0,0,0,0.35)' });
              g.rect(-96, -18, 192, 36, { r: 3, fill: i === 1 && t > tAst ? '#F0CF78' : '#E3BE62' });
              g.text('COUNTEREXAMPLE', 0, 7, { size: 17, weight: 700, ls: 1.4, color: '#2B2414', align: 'center' });
            });
          });
        }
        const pSt = S.tp(tCx + 1.0, 0.45) * stOut;
        if (pSt > 0) g.with(() => {
          const ctx = g.ctx; ctx.translate(452, 486); ctx.rotate(-0.09); const sc = lerp(1.8, 1, ease.out(pSt)); ctx.scale(sc, sc);
          g.withAlpha(clamp(pSt * 1.6), () => {
            g.rect(-320, -74, 640, 148, { r: 8, fill: 'rgba(16,14,30,0.94)', stroke: PAL.coral, w: 4 });
            g.rect(-307, -61, 614, 122, { r: 5, stroke: PAL.coral, w: 1.4 });
            g.text('NO NECESSARY AND', 0, -6, { size: 30, weight: 700, ls: 3, color: PAL.coral, align: 'center' });
            g.text('SUFFICIENT CONDITIONS', 0, 36, { size: 30, weight: 700, ls: 3, color: PAL.coral, align: 'center' });
          });
        });

        // Right panel: one emblem per criterion, keyed to when it is named.
        const win = (a0, a1) => S.tp(a0 - 0.1, 0.7) * (1 - S.tp(a1 - 0.3, 0.5));
        const low = (fn) => g.with(() => { g.ctx.translate(0, 48); fn(); });
        low(() => emVerify(g, win(tR[0], tR[1]), S.tp(tR[0] + 1.0, 0.6)));
        low(() => emSwans(g, win(tR[1], tR[2]), S.tp(tR[1], 0.9), S.tp(tR[1] + 0.9, 0.6), S.tp(tR[1] + 1.3, 0.5)));
        low(() => emPuzzle(g, win(tR[2], tR[3]), S.tp(tR[2] + 0.7, 0.8)));
        low(() => emRings(g, win(tR[3], tThag), S.tp(tR[3] + 1.0, 0.8)));
        low(() => emThagard(g, win(tThag, S.b(1)), S.tp(tStag - 0.8, 2.2), S.tp(tIgn, 0.7)));
        low(() => emNatural(g, win(S.b(1), tR[5]), S.tp(S.b(1) + 1.2, 1.6), S.tp(tBeyond, 0.8)));
        low(() => emInstitutions(g, win(tR[5], S.b(2)), S.tp(tR[5] + 0.3, 1.2), tInst.map((x) => S.tp(x - 0.1, 0.6))));
        low(() => emLaudan(g, win(S.b(2), tAst), S.tp(S.b(2) + 0.4, 1.4)));
        emCounter(g, win(tAst, tLoose + 0.3), S.tp(tAst - 0.1, 0.7), S.tp(tHard - 0.1, 0.7));
        emRadar(g, S.tp(tLoose + 0.4, 0.8), S.tp(tLoose + 0.4, 1.4), S.tp(tFam - 0.6, 1.8), S.tp(tSys + 0.3, 0.8), S.tp(tWiss + 0.4, 1.4), t);
      },
      terms: [
        { beat: 0.8, term: 'Pseudoscience', def: 'A practice presented as science that fails its standards, for example by stagnating while ignoring progressive rivals (Thagard).' },
        { beat: 1.3, term: 'Methodological naturalism', def: 'The working rule that scientific explanations appeal only to natural causes, whatever one believes beyond them.' },
        { beat: 3.3, term: 'Cluster concept', def: 'A concept defined by a family of overlapping features, none necessary or sufficient on its own (Pigliucci).' },
        { beat: 3.55, term: 'Systematicity', def: 'Hoyningen-Huene’s thesis that scientific knowledge differs from everyday knowledge chiefly by being more systematic.' },
        { beat: 3.8, term: 'Wissenschaft', def: 'German for organized, systematic knowledge of any kind, including the humanities; broader than English “science”.' },
      ],
    },
    {
      id: 'demarc-matrix', title: 'The answer depends on the criterion', register: 'claim',
      beats: [
        { t: 'Now apply the criteria to our two research traditions, with astrology as a contrast. Under verifiability, none fits cleanly; even physics strained it. Under falsifiability, postpositivist natural science fits by design, interpretive research fits in part, and astrology, awkwardly, fits too: its predictions can be tested, and they fail.',
          v: 'Three columns join the matrix: POSTPOSITIVIST NATURAL SCIENCE, INTERPRETIVE SOCIAL RESEARCH, ASTROLOGY (contrast). The first two rows color cell by cell.' },
        { t: 'Under institutional norms and Thagard’s test of progress, interpretive social research qualifies and astrology does not: no community criticizes and revises its claims, and it has stood still for centuries while its rivals advanced.',
          v: 'Rows for naturalism, institutions, and progress color in; the astrology column turns red down those rows.' },
        { t: 'Under cluster or systematicity accounts, or Wissenschaft, interpretive research qualifies easily; in German it has always been science. Whether English calls it science depends on the definition. The underlying practices do not change. Only the label does.',
          s: 'Under cluster or systematicity accounts, or Viss-en-shaft, interpretive research qualifies easily; in German it has always been science. Whether English calls it science depends on the definition. The underlying practices do not change. Only the label does.',
          v: 'Bottom rows fill green for both traditions; the whole matrix re-colors as the definition toggles from NARROW to BROAD.' },
      ],
      draw(g, t, S) {
        const CX = (j) => 860 + j * 330, CW = 316, CH = 44;
        const tCols = cue(S, 0, 'two research traditions'), tAstro = cue(S, 0, 'with astrology');
        const tV = cue(S, 0, 'Under verifiability'), tNone = cue(S, 0, 'none fits cleanly'), tPhys = cue(S, 0, 'even physics');
        const tF = cue(S, 0, 'Under falsifiability'), tDes = cue(S, 0, 'fits by design'), tPart = cue(S, 0, 'fits in part'), tToo = cue(S, 0, 'awkwardly, fits too'), tTest = cue(S, 0, 'its predictions can be tested');
        const tInst = cue(S, 1, 'Under institutional norms'), tQual = cue(S, 1, 'interpretive social research qualifies'), tNot = cue(S, 1, 'astrology does not'), tComm = cue(S, 1, 'no community'), tStill = cue(S, 1, 'stood still');
        const tEasy = cue(S, 2, 'qualifies easily'), tGer = cue(S, 2, 'in German'), tEng = cue(S, 2, 'Whether English'), tDef = cue(S, 2, 'depends on the definition'), tPrac = cue(S, 2, 'The underlying practices'), tLab = cue(S, 2, 'Only the label');
        // When each cell colors in, and the few spoken notes.
        const cT = (i, j) => {
          if (i === 0) return tNone + j * 0.3;
          if (i === 1) return [tDes, tPart, tToo][j];
          if (i <= 5) return [tInst + 0.5 + (i - 2) * 0.15, tQual + (i - 2) * 0.18, tNot + (i - 2) * 0.22][j];
          return [tEasy - 0.7 + (i - 6) * 0.15, tEasy + (i - 6) * 0.2, tEasy + 0.9 + (i - 6) * 0.2][j];
        };
        const NOTE = { '0,0': ['even physics strained it', tPhys], '0,1': ['no clean fit', tNone + 0.3], '0,2': ['no clean fit', tNone + 0.6], '1,0': ['fits by design', tDes], '1,1': ['fits in part', tPart], '1,2': ['testable, and fails', tTest], '3,2': ['stood still for centuries', tStill], '5,2': ['no community of critics', tComm], '5,1': ['qualifies', tQual], '8,1': ['always science, in German', tGer] };
        // The NARROW ↔ BROAD toggle: 0 = narrow, 1 = broad.
        const tA = S.tp(tEng - 0.2, 0.7); const flip = (x) => ease.inOut((t - x) / 0.6);
        const u = clamp(flip(tDef + 0.5) - flip(tPrac + 0.9) + flip(tLab - 0.1));
        const dimOf = (i) => tA * (i < 5 ? u : i > 5 ? 1 - u : 0);

        // Column bodies and headers.
        const cols = [{ l1: 'Postpositivist', l2: 'natural science', lens: 'pos', t0: tCols }, { l1: 'Interpretive', l2: 'social research', lens: 'int', t0: tCols + 0.5 }, { l1: 'Astrology', l2: '(contrast)', lens: null, t0: tAstro }];
        cols.forEach((c, j) => {
          const a = S.tp(c.t0 - 0.1, 0.8); if (a <= 0) return; const col = c.lens ? g.LENS[c.lens].color : PAL.ink2; const x = CX(j), dy = (1 - ease.out(a)) * -20;
          g.rect(x - 6, 318, CW + 12, rowY(9) + 28 - 318, { r: 8, fill: U.rgba(col, 0.035), alpha: a });
          if (c.lens) g.lens(c.lens, x + 22, 268 + dy, 15, { label: false, w: 2.2, alpha: a }); else star(g, x + 22, 268 + dy, 16, { color: PAL.ochre, w: 2.2, alpha: a });
          caps(g, c.l1, x + 50, 264 + dy, { color: col, alpha: a, ls: 2 }); caps(g, c.l2, x + 50, 289 + dy, { color: col, alpha: a, ls: 2 });
          g.line(x, 308, x + CW, 308, { color: col, w: 2, alpha: 0.7 * a, progress: a });
        });

        // Row labels (carried over from the criteria scene), focus bands, and cells.
        const rA = S.p(0, 0.6);
        caps(g, 'ch.', MX.numX, 298, { align: 'right', alpha: rA }); caps(g, 'criterion', MX.labX, 298, { alpha: rA }); caps(g, 'proposed by', MX.whoX, 298, { alpha: rA * 0.7 });
        const foc = (i) => { const w = (a0, a1) => S.tp(a0 - 0.2, 0.5) * (1 - S.tp(a1 - 0.3, 0.5)); if (i === 0) return w(tV, tF); if (i === 1) return w(tF, S.b(1)); if (i <= 5) return w(S.b(1), S.b(2)) * (i === 3 || i === 5 ? 1 : 0.55); return w(S.b(2), tEng); };
        ROWS.forEach((R, i) => {
          const y = rowY(i), dim = dimOf(i), hf = foc(i);
          g.line(100, y + 27, 1836, y + 27, { color: PAL.faint, w: 1, alpha: rA });
          if (hf > 0) g.rect(96, y - 26, 1744, 52, { r: 6, fill: 'rgba(239,232,216,0.05)', stroke: U.rgba(COL, 0.38), w: 1.2, alpha: hf });
          rowLabel(g, i, rA, { dim, whoA: 0.75, whoText: i === 3 ? 'Lakatos · Thagard' : undefined });
          for (let j = 0; j < 3; j++) {
            const s = CELLS[i][j], at = cT(i, j), p = S.tp(at - 0.1, 0.6); if (p <= 0) continue;
            const n = NOTE[i + ',' + j]; cell(g, CX(j), y - CH / 2, CW, CH, s, p, n ? n[0] : ST[s].l, dim, n ? S.tp(n[1], 0.6) : 0.7);
            if (p < 1) g.glow(CX(j) + 25, y, 40, ST[s].c, 0.6 * bump(p));
          }
        });

        // The definition: a bracket on the rows it uses, a toggle, and the verdict it produces.
        if (tA > 0) {
          const lo = lerp(0, 5, u), hi = lerp(5, 8, u), y0 = rowY(lo) - 24, y1 = rowY(hi) + 24;
          g.withAlpha(tA, () => { g.line(90, y0, 90, y1, { color: COL, w: 3 }); g.line(90, y0, 100, y0, { color: COL, w: 3 }); g.line(90, y1, 100, y1, { color: COL, w: 3 }); });
          const vy = rowY(9) + 4; g.line(100, vy - 30, 1836, vy - 30, { color: PAL.ink3, w: 1.5, alpha: tA });
          caps(g, 'science?', MX.labX, vy + 6, { color: PAL.ink, alpha: tA });
          const tx = 420; const lw = { size: 21, weight: 600, ls: 1.2 };
          g.text('NARROW', tx - 14, vy + 7, { ...lw, color: U.mix(COL, PAL.ink3, u), align: 'right', alpha: tA });
          g.rect(tx, vy - 15, 66, 30, { r: 15, fill: U.rgba(COL, 0.15), stroke: COL, w: 2, alpha: tA });
          g.circle(tx + 15 + 36 * u, vy, 10, { fill: COL, alpha: tA }); g.glow(tx + 15 + 36 * u, vy, 26, COL, 0.4 * tA);
          g.text('BROAD', tx + 80, vy + 7, { ...lw, color: U.mix(PAL.ink3, COL, u), alpha: tA });
          const ver = [[['central case', PAL.moss], ['science', PAL.moss]], [['institutional sense', PAL.ochre], ['science', PAL.moss]], [['not science', PAL.coral], ['not science', PAL.coral]]];
          const pulse = 1 + 0.08 * bump((t - tLab) / 0.7);
          ver.forEach(([n, b], j) => {
            const cx = CX(j) + CW / 2;
            if (j === 2) { g.pill(n[0], cx, vy, { size: 22 * (j === 2 ? 1 : pulse), color: n[1], align: 'center', alpha: tA }); return; }
            g.pill(n[0], cx, vy, { size: 22 * pulse, color: n[1], align: 'center', alpha: tA * (1 - u) });
            g.pill(b[0], cx, vy, { size: 22 * pulse, color: b[1], align: 'center', alpha: tA * u });
          });
          g.text('Same cells under either definition: only the label changes.', 110, 896, { size: 22, italic: true, color: PAL.ink2, alpha: S.tp(tPrac, 0.8) });
        }
        // Legend.
        const la = S.tp(tV, 0.8);
        ['m', 'p', 'f', 'x'].forEach((s, k) => { const x = 1192 + k * 168; glyph(g, s, x, 889, 12, la); g.text(ST[s].l, x + 22, 896, { size: 21, color: PAL.ink2, alpha: la }); });
      },
    },
    {
      id: 'demarc-kaibab', title: 'Case file: the Kaibab story, revisited', register: 'claim',
      beats: [
        { t: 'Demarcation is usually aimed at fields outside science. The Kaibab story points inward. For decades, a weakly tested account of deer and predators lived in textbooks, retold by scientists and conservationists alike, until Caughley went back to the records.',
          s: 'Demarcation is usually aimed at fields outside science. The Kaibab story points inward. For decades, a weakly tested account of deer and predators lived in textbooks, retold by scientists and conservationists alike, until Cawley went back to the records.',
          cite: 'Leopold 1949; Caughley 1970',
          v: 'Case-file card (deer) returns from Chapter III, pinned beside a stack of textbook spines.' },
        { t: 'Nothing about its subject was unscientific. What failed was practice: one poorly measured case, an untested rival, and too little criticism. What corrected it was practice too.',
          v: 'Three failure tags attach to the card; then a red pencil mark (Caughley) and the tags flip to corrections.' },
        { t: 'So demarcation concerns how claims are tested, criticized, and corrected, more than the prestige of a label. Under a narrow definition, postpositivist natural science is the central case and interpretive research is science in an institutional sense. Under a broad one, both qualify. The choice has consequences. Make it knowingly.', pause: 0.8,
          v: 'The matrix returns in miniature with the NARROW / BROAD toggle; the two columns rest side by side.' },
      ],
      draw(g, t, S) {
        const ctx = g.ctx;
        const tIn = cue(S, 0, 'The Kaibab story points inward'), tDec = cue(S, 0, 'For decades'), tBooks = cue(S, 0, 'lived in textbooks'), tRetold = cue(S, 0, 'retold by'), tCaug = cue(S, 0, 'until Caughley');
        const tSubj = S.b(1), tTag = [cue(S, 1, 'one poorly measured case'), cue(S, 1, 'an untested rival'), cue(S, 1, 'too little criticism')], tFix = cue(S, 1, 'What corrected it');
        const tTest = cue(S, 2, 'tested,'), tCrit = cue(S, 2, 'criticized,'), tCorr = cue(S, 2, 'and corrected'), tLabel = cue(S, 2, 'the prestige of a label');
        const tNar = cue(S, 2, 'Under a narrow definition'), tCen = cue(S, 2, 'central case'), tInstS = cue(S, 2, 'science in an institutional sense'), tBroad = cue(S, 2, 'Under a broad one'), tCons = cue(S, 2, 'The choice has consequences'), tKnow = cue(S, 2, 'Make it knowingly');
        const b2 = S.p(2, 0.9); // beat 2 clears the evidence for the lesson

        // The case file, pinned top left (smaller once the lesson begins).
        const cw = lerp(380, 270, b2), chh = lerp(214, 152, b2);
        g.casefile(100, 232, cw, chh, { title: 'The Kaibab story, revisited', no: 'XIII', sketch: 'deer', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });

        // Beat 0 opening: the line usually points outward; this story points inward.
        const oA = S.p(0, 0.9, 0.2) * (1 - S.tp(tDec + 0.2, 0.8));
        if (oA > 0) g.withAlpha(oA, () => {
          const cx = 1380, cy = 575, R = 230; const inw = S.tp(tIn - 0.1, 0.9);
          g.circle(cx, cy, R, { stroke: COL, w: 3, fill: U.rgba(COL, 0.05) });
          caps(g, 'science', cx, cy - R + 46, { align: 'center', color: COL });
          [['astrology', 1010, 330], ['creation science', 1720, 316], ['intelligent design', 1700, 850]].forEach(([nm, x, y], k) => {
            const a = S.p(0, 0.6, 0.8 + k * 0.4) * (1 - 0.65 * inw); const an = Math.atan2(y - cy, x - cx);
            g.arrow(cx + Math.cos(an) * (R - 12), cy + Math.sin(an) * (R - 12), x - Math.cos(an) * 70, y - Math.sin(an) * 30, { color: COL, w: 2.4, head: 13, alpha: a * (1 - inw), progress: S.p(0, 0.8, 1.0 + k * 0.4) });
            g.pill(nm, x, y, { size: 22, color: PAL.ink2, align: 'center', alpha: a });
          });
          g.carrow(cx - R + 30, cy - 70, cx - 72, cy + 6, 0.25, { color: PAL.sand, w: 3, head: 15, progress: inw });
          g.icon('deer', cx + 6, cy + 18, 92, PAL.sand, { alpha: inw }); g.glow(cx + 6, cy + 10, 80, PAL.sand, 0.25 * inw);
          caps(g, 'Kaibab Plateau', cx + 6, cy + 108, { align: 'center', color: PAL.sand, alpha: inw });
        });

        // The textbook story (stylized), then the records behind it.
        const pA = S.tp(tDec, 0.9) * (1 - b2);
        const A = { x: 1080, y: 330, w: 680, h: 360 }; const AX = (v) => A.x + v * A.w, AY = (v) => A.y + A.h - v * A.h;
        const poor = S.tp(tTag[0] - 0.2, 0.9), fix = S.tp(tFix + 0.2, 1.6);
        if (pA > 0) g.withAlpha(pA, () => {
          caps(g, 'the textbook story', A.x - 20, 274, { color: PAL.sand }); caps(g, 'stylized', A.x + A.w + 20, 274, { align: 'right', size: 15 });
          g.axes({ x: A.x, y: A.y, w: A.w, h: A.h, xlab: 'Years', ylab: 'Deer', labSize: 22, progress: S.tp(tDec, 1.0) });
          const pm = S.tp(tDec + 0.8, 0.8);
          g.line(AX(0.22), AY(0), AX(0.22), AY(1.0), { color: PAL.coral, w: 1.8, dash: [6, 6], alpha: pm });
          g.icon('wolf', AX(0.22) - 34, AY(0.93), 44, PAL.coral, { alpha: pm * 0.9 }); g.icon('puma', AX(0.22) + 30, AY(0.93), 44, PAL.coral, { alpha: pm * 0.9 });
          g.text('predators removed', AX(0.22) - 8, AY(1.0) - 4, { size: 21, color: PAL.coral, align: 'center', alpha: pm });
          g.plot({ X: AX, Y: AY, xmin: 0, xmax: 1 }, kaibabCurve, { color: PAL.sand, w: 4.5, progress: S.tp(tDec + 1.0, 2.6), alpha: 1 - 0.65 * poor, dash: poor > 0.5 ? [10, 8] : undefined });
          g.text('irruption', AX(0.6), AY(1.0) + 2, { size: 22, italic: true, color: PAL.sand, align: 'center', alpha: S.tp(tDec + 2.6, 0.8) * (1 - poor) });
          g.text('crash', AX(0.8) + 10, AY(0.5), { size: 22, italic: true, color: PAL.sand, alpha: S.tp(tDec + 3.2, 0.8) * (1 - poor) });
          // the records: sparse, inconsistent estimates
          RECORDS.forEach(([x, dy, e], k) => {
            const a = S.tp(tCaug + 0.4 + k * 0.12, 0.5); if (a <= 0) return; const y = clamp(kaibabCurve(x) + dy * (0.4 + 0.6 * poor), 0.04, 0.98);
            g.line(AX(x), AY(clamp(y - e)), AX(x), AY(clamp(y + e)), { color: PAL.ink2, w: 1.6, alpha: a * 0.8 });
            g.dot(AX(x), AY(y), 5.5, PAL.ink, a, 2.2);
          });
          caps(g, 'the records', AX(1.0), AY(0.95), { align: 'right', color: PAL.ink2, alpha: S.tp(tCaug + 1.0, 0.8) });
          // an untested rival on the same timeline
          const pr = S.tp(tTag[1] - 0.2, 0.8);
          g.line(AX(0.3), AY(0) + 14, AX(0.3), AY(0.78), { color: PAL.ink2, w: 1.8, dash: [3, 6], alpha: pr });
          g.text('cattle removed?', AX(0.3) - 6, AY(0) + 36, { size: 21, italic: true, color: PAL.ink2, alpha: pr });
          caps(g, 'rival, untested', AX(0.3) - 6, AY(0) + 62, { color: PAL.ink3, alpha: pr * (1 - fix) });
          caps(g, 'rival, put forward', AX(0.3) - 6, AY(0) + 62, { color: PAL.moss, alpha: pr * fix });
          // Caughley's red pencil
          const pp = S.tp(tFix - 0.2, 1.6); const loop = [];
          for (let k = 0; k <= 60; k++) { const an = -2.4 + k / 60 * Math.PI * 2.15; loop.push([AX(0.6) + Math.cos(an) * 128, AY(0.74) + Math.sin(an) * 84]); }
          if (pp > 0) {
            const tip = g.poly(loop, { color: RED, w: 3.4, progress: pp });
            g.text('unreliable,', AX(0.6) + 146, AY(0.74) + 30, { size: 26, italic: true, color: RED, alpha: S.tp(tFix + 1.0, 0.7) });
            g.text('inconsistent', AX(0.6) + 146, AY(0.74) + 62, { size: 26, italic: true, color: RED, alpha: S.tp(tFix + 1.2, 0.7) });
            caps(g, 'Caughley 1970', AX(0.6) + 146, AY(0.74) + 92, { color: RED, alpha: S.tp(tFix + 1.4, 0.7) });
            redPencil(g, tip[0], tip[1], -0.7, clamp(pp * 4) * (1 - S.tp(tFix + 1.9, 0.5)));
          }
        });

        // A stack of textbook spines, each carrying the story.
        const titles = ['Ecology', 'Wildlife biology', 'Conservation', 'General biology', 'Population ecology', 'Natural history'];
        const crit = S.tp(tTag[2], 0.8);
        titles.forEach((nm, k) => {
          const a = S.tp(tBooks - 0.4 + k * 0.32, 0.5) * (1 - b2); if (a <= 0) return;
          const w = [360, 330, 348, 318, 352, 326][k], x = 560 + [0, 18, 4, 26, 8, 20][k], y = 836 - k * 50 - (1 - ease.out(a)) * 30;
          const tint = [PAL.clay, PAL.lagoon, PAL.moss, PAL.heather, PAL.sand, PAL.ochre][k];
          g.rect(x, y, w, 44, { r: 3, fill: U.mix('#1D1A33', tint, 0.22), stroke: U.rgba(tint, 0.7), w: 1.5, alpha: a });
          g.rect(x + 14, y + 6, 6, 32, { fill: U.rgba(tint, 0.6), alpha: a });
          caps(g, nm, x + 34, y + 29, { color: PAL.ink2, alpha: a, ls: 1.6 });
          g.rect(x + w - 96, y - 6, 9, 20, { fill: PAL.sand, alpha: a * S.tp(tRetold, 0.6) }); // bookmark at the Kaibab page
          if (crit > 0) g.poly(Array.from({ length: 21 }, (_, q) => [x + w - 62 + q * 2.0, y + 36 - 26 * kaibabCurve(q / 20)]), { color: PAL.sand, w: 1.8, alpha: a * crit });
        });
        caps(g, 'retold for decades', 740, 512, { align: 'center', color: PAL.sand, alpha: S.tp(tRetold + 0.3, 0.8) * (1 - b2) });
        g.text('copied, rarely checked', 740, 544, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: crit * (1 - b2) });

        // Beat 1: the subject is fine; the practice failed, then was corrected.
        const sA = S.tp(tSubj, 0.8) * (1 - b2);
        if (sA > 0) g.withAlpha(sA, () => {
          g.icon('deer', 168, 486, 46, PAL.sand); g.icon('wolf', 232, 488, 46, PAL.coral);
          g.text('the subject', 278, 496, { size: 22, color: PAL.ink }); glyph(g, 'm', 412, 489, 13, S.tp(tSubj + 0.8, 0.5));
        });
        const fl = [0, 1, 2].map((k) => S.io(1, 0.7, (tFix - S.b(1)) + 0.7 + k * 0.35));
        const tags = [['one poorly measured case', 'records re-examined'], ['an untested rival', 'rival put forward'], ['too little criticism', 'critique published']];
        const tagA = (k) => S.tp(tTag[k] - 0.15, 0.6) * (1 - b2);
        if (tagA(0) > 0) g.poly([[126, 446], [126, 588 + 88 * (tagA(2) > 0 ? 2 : tagA(1) > 0 ? 1 : 0)]], { color: PAL.ink3, w: 1.5, alpha: tagA(0) });
        tags.forEach(([a1, b1], k) => luggageTag(g, 108, 556 + k * 88, 380, 64, a1, b1, fl[k], tagA(k), [-0.02, 0.015, -0.01][k]));

        // Beat 2: practice (tested, criticized, corrected) over the prestige of a label.
        const cA = S.p(2, 0.8, 0.3);
        if (cA > 0) g.withAlpha(cA, () => {
          const cx = 450, cy = 665, R = 178; const nodes = [[-Math.PI / 2, 'tested', tTest], [Math.PI / 6, 'criticized', tCrit], [5 * Math.PI / 6, 'corrected', tCorr]];
          nodes.forEach(([an, nm, t0], k) => {
            const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R * 0.92, on = S.tp(t0 - 0.1, 0.6);
            const an2 = nodes[(k + 1) % 3][0]; const x2 = cx + Math.cos(an2) * R, y2 = cy + Math.sin(an2) * R * 0.92;
            g.carrow(x + (x2 - x) * 0.14, y + (y2 - y) * 0.14, x + (x2 - x) * 0.86, y + (y2 - y) * 0.86, -0.22, { color: U.rgba(COL, 0.8), w: 2.4, head: 13, progress: S.tp(t0 + 0.2, 0.7) });
            g.dot(x, y, 10, COL, 0.35 + 0.65 * on, 2.6);
            const lx = k === 0 ? x : k === 1 ? x + 24 : x - 24, ly = k === 0 ? y - 26 : y + 10;
            g.text(nm, lx, ly, { size: 36, role: 'display', color: U.mix(PAL.ink3, PAL.ink, on), align: k === 0 ? 'center' : k === 1 ? 'left' : 'right' });
          });
          g.text('practice', cx, cy + 22, { size: 30, role: 'display', italic: true, color: COL, alpha: S.tp(tCorr + 0.4, 0.8) });
          // the label: a rosette that greys as the narration moves past it
          const la = S.tp(tLabel - 0.2, 0.7), grey = S.tp(tLabel + 1.2, 1.0); const bx = 690, by = 330; const lc = U.mix(PAL.ochre, PAL.ink3, grey);
          g.withAlpha(la * (1 - 0.45 * grey), () => {
            g.poly([[bx - 22, by + 26], [bx - 42, by + 102], [bx - 20, by + 88], [bx - 5, by + 108], [bx - 2, by + 32]], { fill: U.rgba(lc, 0.6), color: null, w: 0 });
            g.poly([[bx + 22, by + 26], [bx + 42, by + 102], [bx + 20, by + 88], [bx + 5, by + 108], [bx + 2, by + 32]], { fill: U.rgba(lc, 0.6), color: null, w: 0 });
            g.circle(bx, by, 58, { fill: 'rgba(30,26,50,0.95)' }); g.circle(bx, by, 58, { fill: U.rgba(lc, 0.2), stroke: lc, w: 2.4 }); g.circle(bx, by, 48, { stroke: lc, w: 1.2 });
            g.text('SCIENCE', bx, by + 6, { size: 17, weight: 700, ls: 0.6, color: lc, align: 'center' });
            caps(g, 'the prestige of a label', bx + 76, by + 6, { color: lc });
          });
        });

        // Beat 2: the matrix in miniature, two traditions side by side, with the definition toggle.
        const mA = S.tp(S.b(2) + 1.4, 1.0) * (0.45 + 0.55 * S.tp(tNar - 0.4, 0.8));
        if (mA > 0) g.withAlpha(mA, () => {
          const lx = 990, c0 = 1330, cwid = 220, gap = 20, y0 = 382, dy = 35;
          const u = clamp(ease.inOut((t - tBroad) / 0.7));
          const tg = 1550; const lw = { size: 21, weight: 600, ls: 1.2 };
          g.text('NARROW', tg - 14, 268, { ...lw, color: U.mix(COL, PAL.ink3, u), align: 'right' });
          g.rect(tg, 253, 66, 30, { r: 15, fill: U.rgba(COL, 0.15), stroke: COL, w: 2 }); g.circle(tg + 15 + 36 * u, 268, 10, { fill: COL }); g.glow(tg + 15 + 36 * u, 268, 26, COL, 0.4);
          g.text('BROAD', tg + 80, 268, { ...lw, color: U.mix(PAL.ink3, COL, u) });
          [['pos', 'Postpositivist'], ['int', 'Interpretive']].forEach(([k, nm], j) => {
            const x = c0 + j * (cwid + gap); g.lens(k, x + 18, 330, 13, { label: false, w: 2 }); caps(g, nm, x + 40, 337, { color: g.LENS[k].color, ls: 1.8 });
          });
          ROWS.forEach((R, i) => {
            const y = y0 + i * dy; const dim = i < 5 ? u : i > 5 ? 1 - u : 0;
            g.text(R.k.toUpperCase(), lx, y + 6, { size: 17, weight: 600, ls: 1.6, color: U.mix(PAL.ink2, PAL.ink3, dim) });
            for (let j = 0; j < 2; j++) { const s = CELLS[i][j]; const c = U.mix(ST[s].c, '#5E5A74', dim * 0.75); g.rect(c0 + j * (cwid + gap), y - 13, cwid, 26, { r: 5, fill: U.rgba(c, 0.18), stroke: U.rgba(c, 0.7), w: 1.2, alpha: 1 - 0.55 * dim }); glyph(g, s, c0 + j * (cwid + gap) + 18, y, 9, 1 - 0.55 * dim); }
          });
          const lo = lerp(0, 5, u), hi = lerp(5, 8, u); g.line(975, y0 + lo * dy - 15, 975, y0 + hi * dy + 15, { color: COL, w: 3 });
          const vy = y0 + 9 * dy + 18; g.line(lx, vy - 26, c0 + 2 * cwid + gap, vy - 26, { color: PAL.ink3, w: 1.2 });
          caps(g, 'science?', lx, vy + 6, { color: PAL.ink });
          const vA = [S.tp(tCen - 0.3, 0.6), S.tp(tInstS - 0.2, 0.6)];
          g.pill('central case', c0 + cwid / 2, vy, { size: 22, color: PAL.moss, align: 'center', alpha: vA[0] * (1 - u) });
          g.pill('institutional sense', c0 + cwid + gap + cwid / 2, vy, { size: 22, color: PAL.ochre, align: 'center', alpha: vA[1] * (1 - u) });
          for (let j = 0; j < 2; j++) g.pill('science', c0 + j * (cwid + gap) + cwid / 2, vy, { size: 22, color: PAL.moss, align: 'center', alpha: u });
          // consequences of the choice
          const qa = S.tp(tCons - 0.1, 0.7);
          ['funding', 'testimony', 'assessments'].forEach((nm, k) => {
            const x = 1090 + k * 250; g.pill(nm, x, 818, { size: 21, color: PAL.violet, align: 'center', alpha: S.tp(tCons + k * 0.25, 0.6) });
          });
          caps(g, 'what the choice decides', lx, 780, { color: PAL.violet, alpha: qa });
          g.text('Make it knowingly.', 1400, 892, { size: 44, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tKnow - 0.1, 0.9) });
        });
      },
    },
  ],
});
})();
