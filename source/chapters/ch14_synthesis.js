/* Chapter XIV — Synthesis: observe, infer, claim. Audit of a famous claim, a reusable audit, and exam rehearsal. */
(function () {
const { PAL, U, Theater } = window; const { clamp, lerp, ease } = U;
const COL = PAL.ink;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken: sentence timing when available, else proportional to the caption.
const cue = (S, k, phrase) => {
  const B = S.scene.timing && S.scene.timing.beats[k];
  if (B && B.sents) for (const s of B.sents) { const i = s.cap.indexOf(phrase); if (i >= 0) return s.start + (s.end - s.start) * i / s.cap.length; }
  const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length);
};
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const fitSize = (g, s, maxW, o) => { const w = g.measure(s, o); return w > maxW ? o.size * maxW / w : o.size; };
const chOf = (roman) => Theater.chapters.find((x) => x.roman === roman) || {};
const bump = (x) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
const REGC = (k) => Theater.REG[k].color;
// A band drawn in the house style of g.bands, but at any rectangle (so bands can grow, shrink and morph).
function band(g, k, r, on, a = 1, labSize = 20) {
  if (a <= 0) return; const col = REGC(k);
  g.rect(r.x, r.y, r.w, r.h, { r: Math.min(6, r.h / 4), fill: U.rgba(col, 0.06 + 0.14 * on), stroke: U.rgba(col, 0.35 + 0.6 * on), w: 1.2 + 0.8 * on, alpha: a });
  if (labSize && r.h > 24) g.text(Theater.REG[k].label, r.x + 18, r.y + r.h / 2 + labSize * 0.36, { size: labSize, weight: 600, ls: 2.4, color: U.mix(U.mix(col, PAL.bg, 0.45), col, on), alpha: a });
}
// A status badge: outlined caps label.
function badge(g, s, x, y, col, a = 1, align = 'left') {
  if (a <= 0) return; const o = { size: 17, weight: 600, ls: 1.8 }; const w = g.measure(s.toUpperCase(), o) + 24; const X = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.rect(X, y - 15, w, 30, { r: 15, fill: U.rgba(col, 0.15), stroke: col, w: 1.6, alpha: a });
  g.text(s.toUpperCase(), X + 12, y + 6, { ...o, color: col, alpha: a }); return w;
}
function person(g, x, y, s, a, col = PAL.violet) { g.circle(x, y - s * 1.55, s * 0.55, { fill: col, alpha: a }); g.ellipse(x, y - s * 0.35, s * 0.95, s * 0.7, { fill: col, alpha: a }); }
const eyeGlyph = (g, cx, cy, w, h, col, a = 1) => {
  const up = [], dn = []; for (let k = 0; k <= 24; k++) { const u = k / 24, x = cx - w / 2 + w * u, s = Math.sin(Math.PI * u); up.push([x, cy - h * s]); dn.push([x, cy + h * s]); }
  g.poly(up, { color: col, w: 2.2, alpha: a }); g.poly(dn, { color: col, w: 2.2, alpha: a }); g.circle(cx, cy, h * 0.6, { fill: col, alpha: a });
};

// ---- syn-audit: a simplified North America (lon, lat), for a stylized map --------
const NA = [[-168, 65.6], [-166, 68.9], [-163, 69.5], [-156.5, 71.3], [-152, 70.8], [-145, 70.1], [-141, 69.6], [-136, 69.2], [-131, 69.8], [-128, 70.2], [-124, 69.6], [-117, 68.9], [-112, 67.8], [-108, 68.2], [-104, 68.0], [-98, 67.8], [-95, 68.5], [-94, 71.2], [-90, 68.6], [-85.5, 68.8], [-82.3, 67.2], [-86.2, 66.4], [-87.5, 64.3], [-90.7, 63.5], [-94, 61], [-94.2, 58.8], [-92.5, 57.2], [-88.8, 56.6], [-85, 55.3], [-82.3, 55.1], [-82.2, 52.9], [-80.5, 51.3], [-79, 52], [-78.9, 53.8], [-77, 55.8], [-77.6, 58.0], [-77.5, 60.4], [-78.1, 62.4], [-74, 62.3], [-71, 61.2], [-69.5, 59.0], [-65.5, 59.8], [-64.4, 60.3], [-61.5, 56.6], [-60, 55], [-57, 52.6], [-57.2, 51.4], [-60, 50.2], [-64, 50.2], [-66.5, 50.1], [-69, 48.6], [-70.5, 47.2], [-68.5, 48.6], [-66.2, 49.2], [-64.3, 48.9], [-64.9, 47.9], [-64.6, 46.6], [-61.5, 45.7], [-60, 45.9], [-61, 45.1], [-63.5, 44.6], [-65.7, 43.6], [-66.2, 44.6], [-64.5, 45.3], [-67, 45.1], [-67.5, 44.5], [-70.2, 43.6], [-70.6, 41.7], [-73.9, 40.6], [-74.2, 39.4], [-75.9, 37.2], [-75.7, 35.2], [-77.9, 33.9], [-81, 32], [-81.5, 30.7], [-80.6, 28.6], [-80.1, 26.4], [-80.4, 25.2], [-81.7, 25.9], [-82.6, 27.7], [-82.8, 29.1], [-84.4, 29.9], [-86.4, 30.4], [-89.4, 30.3], [-89.3, 29.2], [-91.2, 29.4], [-93.9, 29.7], [-95.1, 29.2], [-97.1, 27.7], [-97.5, 25.8], [-97.8, 22.5], [-96.2, 19.3], [-94.8, 18.5], [-92.0, 18.7], [-90.5, 19.9], [-90.3, 21.1], [-87.1, 21.5], [-87.5, 19.5], [-88.2, 17.1], [-88.6, 15.8], [-85.8, 15.9], [-83.3, 15.0], [-83.6, 12.6], [-83.7, 11.0], [-82.0, 9.0], [-79.6, 9.6], [-77.4, 8.6], [-78.4, 7.3], [-80.4, 7.4], [-82.4, 8.2], [-85.6, 9.9], [-85.8, 11.2], [-87.6, 13.1], [-91.4, 13.9], [-94.0, 16.0], [-96.6, 15.7], [-99.7, 16.8], [-103.6, 18.4], [-105.5, 20.6], [-105.3, 22.6], [-106.6, 23.8], [-108.8, 25.4], [-110.6, 27.5], [-112.4, 29.5], [-114.7, 31.7], [-114.2, 30.1], [-112.8, 28.5], [-112.1, 26.8], [-110.6, 24.4], [-109.5, 23.2], [-110.3, 23.6], [-112.1, 24.8], [-112.3, 26.4], [-114.1, 27.6], [-114.5, 28.9], [-116.1, 30.6], [-117.1, 32.5], [-118.5, 34.0], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.6], [-124.3, 40.5], [-124.2, 43.0], [-123.9, 46.2], [-124.6, 48.3], [-123.0, 48.8], [-124.0, 49.6], [-126.8, 50.6], [-128.0, 51.7], [-130.1, 54.3], [-131.8, 56.4], [-134.2, 58.3], [-136.8, 58.7], [-139.8, 59.7], [-143.9, 60.0], [-146.6, 60.8], [-149.9, 59.8], [-151.8, 59.2], [-152.3, 58.0], [-156.2, 56.8], [-159.8, 55.6], [-163.0, 54.8], [-160.6, 56.0], [-158.5, 57.6], [-157.4, 58.8], [-159.8, 58.8], [-162.0, 59.8], [-165.2, 60.6], [-165.5, 62.0], [-164.2, 63.2], [-161.0, 63.5], [-161.0, 64.5], [-163.8, 64.6], [-166.2, 64.6], [-168, 65.6]];
const MAPR = 460, MAPX = 968, MAPY = 556, L0 = -100 * Math.PI / 180, P0 = 45 * Math.PI / 180;
// Lambert azimuthal equal-area, centred on (100°W, 45°N), and its inverse.
const proj = (lon, lat) => { const l = lon * Math.PI / 180 - L0, p = lat * Math.PI / 180; const k = Math.sqrt(2 / (1 + Math.sin(P0) * Math.sin(p) + Math.cos(P0) * Math.cos(p) * Math.cos(l))); return [MAPX + MAPR * k * Math.cos(p) * Math.sin(l), MAPY - MAPR * k * (Math.cos(P0) * Math.sin(p) - Math.sin(P0) * Math.cos(p) * Math.cos(l))]; };
const unproj = (X, Y) => { const x = (X - MAPX) / MAPR, y = -(Y - MAPY) / MAPR, r = Math.hypot(x, y); if (r < 1e-9) return [-100, 45]; const c = 2 * Math.asin(Math.min(1, r / 2)); const p = Math.asin(Math.cos(c) * Math.sin(P0) + y * Math.sin(c) * Math.cos(P0) / r); const l = L0 + Math.atan2(x * Math.sin(c), r * Math.cos(P0) * Math.cos(c) - y * Math.sin(P0) * Math.sin(c)); return [l * 180 / Math.PI, p * 180 / Math.PI]; };
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// Mechanism vignettes (Wilmers et al. 2025, figure 4), drawn in a circle of radius ~60 at (x, y).
function mechanism(g, k, x, y, a, t) {
  if (a <= 0) return;
  g.withAlpha(a, () => {
    g.circle(x, y, 62, { fill: 'rgba(23,21,42,0.92)', stroke: PAL.rule, w: 1.5 });
    if (k === 0) { person(g, x - 20, y + 24, 20, 1, PAL.violet); g.poly([[x + 6, y + 30], [x + 6, y + 2], [x + 24, y - 16], [x + 42, y + 2], [x + 42, y + 30], [x + 6, y + 30]], { color: PAL.violet, w: 2.4 }); g.rect(x + 19, y + 12, 10, 18, { fill: U.rgba(PAL.violet, 0.6) }); g.line(x - 44, y + 40, x + 44, y + 40, { color: PAL.ink3, w: 2 }); for (let q = 0; q < 4; q++) g.line(x - 38 + q * 22, y + 40, x - 28 + q * 22, y + 40, { color: PAL.ochre, w: 2 }); }
    else if (k === 1) { for (let q = 0; q < 3; q++) g.ellipse(x, y + 16, 50 - q * 4 + Math.sin(t * 1.2 + q) * 2, 14 - q * 2, { stroke: U.rgba(PAL.lagoon, 0.5 - q * 0.12), w: 1.4 }); g.ellipse(x, y + 12, 34, 11, { fill: U.rgba(PAL.moss, 0.35), stroke: PAL.moss, w: 1.5 }); g.icon('moose', x - 4, y - 10, 42, PAL.sand); g.icon('wolf', x + 26, y - 2, 22, PAL.coral); }
    else if (k === 2) { g.icon('wolf', x, y - 26, 34, PAL.coral); g.icon('caribou', x - 28, y + 24, 34, PAL.sand); g.icon('moose', x + 28, y + 24, 34, PAL.sand, { flip: true }); g.arrow(x - 8, y - 12, x - 22, y + 4, { color: PAL.coral, w: 1.8, head: 8 }); g.arrow(x + 8, y - 12, x + 22, y + 4, { color: PAL.coral, w: 1.8, head: 8 }); g.line(x - 12, y + 40, x + 12, y + 40, { color: PAL.ink2, w: 1.5, dash: [3, 3] }); }
    else if (k === 3) { g.icon('wolf', x - 30, y - 12, 32, PAL.coral); g.icon('puma', x + 26, y - 12, 32, PAL.coral); g.icon('bear', x - 2, y + 26, 34, PAL.coral); }
    else if (k === 4) { g.icon('wolf', x - 30, y + 6, 30, PAL.coral); for (let q = 0; q < 3; q++) g.circle(x - 30, y + 6, 18 + q * 12 + ((t * 14) % 12), { stroke: PAL.coral, w: 1.4, alpha: 0.5 - q * 0.14, a0: -0.7, a1: 0.7 }); g.icon('elk', x + 26, y + 4, 38, PAL.sand); }
    else { const pts = []; for (let q = 0; q <= 24; q++) { const u = q / 24; pts.push([x - 40 + 80 * u, y - 34 + 24 * Math.sin(Math.PI * u) - 8 * u]); } g.poly(pts, { color: PAL.moss, w: 2.4 }); g.arrowHead(pts[24][0] + 3, pts[24][1] - 3, -0.8, 11, PAL.moss); g.icon('elk', x, y + 22, 42, PAL.sand); }
  });
}
// ---- syn-seven: documents the audit applies to (study, news story, exam question) ----
function docGlyph(g, kind, cx, cy, s, a) {
  if (a <= 0) return; const w = s, h = s * 1.3, x = cx - w / 2, y = cy - h / 2, lw = Math.max(1.2, s / 40);
  g.withAlpha(a, () => {
    g.rect(x, y, w, h, { r: s * 0.05, fill: '#1D1A33', stroke: PAL.ink2, w: lw * 1.4 });
    if (kind === 0) { g.line(x + w * 0.15, y + h * 0.16, x + w * 0.7, y + h * 0.16, { color: PAL.ink, w: lw * 2 }); g.line(x + w * 0.18, y + h * 0.36, x + w * 0.18, y + h * 0.72, { color: PAL.ink3, w: lw }); g.line(x + w * 0.18, y + h * 0.72, x + w * 0.84, y + h * 0.72, { color: PAL.ink3, w: lw }); g.poly([[x + w * 0.22, y + h * 0.66], [x + w * 0.42, y + h * 0.58], [x + w * 0.6, y + h * 0.5], [x + w * 0.8, y + h * 0.4]], { color: PAL.lagoon, w: lw * 1.6 }); for (let q = 0; q < 2; q++) g.line(x + w * 0.15, y + h * (0.82 + q * 0.08), x + w * (0.85 - q * 0.2), y + h * (0.82 + q * 0.08), { color: PAL.ink3, w: lw }); }
    else if (kind === 1) { g.rect(x + w * 0.1, y + h * 0.08, w * 0.8, h * 0.14, { fill: U.rgba(PAL.ink, 0.75) }); for (let c = 0; c < 2; c++) for (let q = 0; q < 6; q++) g.line(x + w * (0.1 + c * 0.44), y + h * (0.32 + q * 0.1), x + w * (0.46 + c * 0.44), y + h * (0.32 + q * 0.1), { color: PAL.ink3, w: lw }); g.rect(x + w * 0.1, y + h * 0.3, w * 0.36, h * 0.22, { fill: U.rgba(PAL.coral, 0.45) }); }
    else { for (let q = 0; q < 4; q++) { const yy = y + h * (0.18 + q * 0.2); g.rect(x + w * 0.12, yy - w * 0.07, w * 0.14, w * 0.14, { stroke: PAL.ink2, w: lw }); g.line(x + w * 0.34, yy, x + w * 0.86 - (q % 2) * w * 0.2, yy, { color: PAL.ink3, w: lw }); if (q < 2) g.poly([[x + w * 0.14, yy], [x + w * 0.19, yy + w * 0.05], [x + w * 0.27, yy - w * 0.07]], { color: PAL.moss, w: lw * 1.4 }); } }
  });
}

// ---- syn-review: rehearsal cards and their answer sketches ----------------------
const REVIEW = [
  { ch: 'III', q: 'What separates induction from abduction, and where does strong inference fit?', cue: [0, 'What separates'], band: 'infer' },
  { ch: 'IV', q: 'Why does the Duhem–Quine thesis complicate falsification?', cue: [0, 'Why does the Duhem'], band: 'infer' },
  { ch: 'V', q: 'What did Kuhn mean by incommensurability?', cue: [0, 'What did Kuhn'], band: 'observe' },
  { ch: 'VIII', q: 'Why is compensatory mortality a counterfactual claim?', cue: [1, 'Why is compensatory'], band: 'infer' },
  { ch: 'XII', q: 'What is the argument from inductive risk?', cue: [1, 'What is the argument'], band: 'claim' },
  { ch: 'XIII', q: 'How does the answer to “what counts as science?” change with the criterion you choose?', cue: [1, 'And how does'], band: 'claim' },
];
// Answer sketches in card-local coordinates (card 540 × 300; sketch area y 178–288). p = drawing progress.
function sketch(g, i, p, t) {
  if (p <= 0) return; const lab = (s, x, y, a = 1, col = PAL.ink2) => g.text(s, x, y, { size: 21, italic: true, color: col, alpha: clamp(a) });
  if (i === 0) {
    lab('induction', 26, 200, p * 3); for (let k = 0; k < 5; k++) g.dot(36 + k * 16, 240, 4.5, PAL.sand, clamp(p * 4 - k * 0.2), 2);
    g.arrow(118, 240, 160, 240, { color: PAL.ink2, w: 2, head: 9, progress: clamp(p * 3 - 1) }); g.line(36, 268, 150, 268, { color: PAL.sand, w: 3, progress: clamp(p * 3 - 1.4) });
    lab('abduction', 196, 200, p * 3 - 0.6); g.icon('track', 214, 244, 26, PAL.snow, { alpha: clamp(p * 3 - 0.8) }); g.arrow(236, 244, 296, 244, { color: PAL.ink2, w: 2, head: 9, progress: clamp(p * 3 - 1.2) });
    g.glow(316, 244, 30, PAL.ochre, 0.5 * clamp(p * 3 - 1.6)); g.math('H', 316, 254, { size: 28, color: PAL.ochre, align: 'center', alpha: clamp(p * 3 - 1.6) });
    lab('strong inference', 360, 200, p * 3 - 1.2);
    [[214, 'f'], [244, 'm'], [274, 'f']].forEach(([y, s], k) => { const a = clamp(p * 3 - 1.6 - k * 0.2); g.line(378, 244, 456, y, { color: PAL.ink3, w: 1.8, alpha: a }); g.math('H_{' + (k + 1) + '}', 470, y + 8, { size: 22, color: s === 'm' ? PAL.moss : PAL.ink3, alpha: a });
      if (s === 'f') { const ax = clamp(p * 3 - 2.2); g.line(500, y - 8, 514, y + 6, { color: PAL.coral, w: 2.4, alpha: ax }); g.line(514, y - 8, 500, y + 6, { color: PAL.coral, w: 2.4, alpha: ax }); } });
  } else if (i === 1) {
    const ex = 'H + A_{1} + A_{2} \\to O'; const w = g.mathW(ex, 36);
    g.math(ex, 30, 246, { size: 36, alpha: clamp(p * 2) });
    g.line(30 + w + 18, 238, 30 + w + 46, 238, { color: PAL.coral, w: 3, alpha: clamp(p * 2 - 0.6) }); g.text('fails', 30 + w + 56, 246, { size: 22, color: PAL.coral, alpha: clamp(p * 2 - 0.6) });
    [0.04, 0.33, 0.62].forEach((f, k) => g.text('?', 30 + w * f + 10, 204, { size: 30, role: 'display', italic: true, color: PAL.coral, alpha: clamp(p * 2 - 1 - k * 0.15) }));
    lab('which premise is false?', 30, 284, p * 2 - 1.3);
  } else if (i === 2) {
    g.line(30, 214, 330, 214, { color: PAL.lagoon, w: 2.4, progress: clamp(p * 2) }); for (let k = 0; k <= 11; k++) g.line(30 + k * 27, 214, 30 + k * 27, 200 - (k % 2) * 6, { color: PAL.lagoon, w: 1.6, alpha: clamp(p * 2 - k * 0.06) });
    g.line(30, 262, 330, 262, { color: PAL.ochre, w: 2.4, progress: clamp(p * 2 - 0.4) }); for (let k = 0; k <= 7; k++) g.line(30 + k * 41, 262, 30 + k * 41, 248 - (k % 2) * 6, { color: PAL.ochre, w: 1.6, alpha: clamp(p * 2 - 0.4 - k * 0.06) });
    lab('paradigm A', 352, 220, p * 2 - 0.4, PAL.lagoon); lab('paradigm B', 352, 268, p * 2 - 0.8, PAL.ochre);
    g.text('NO COMMON MEASURE', 30, 290, { size: 17, weight: 600, ls: 2, color: PAL.ink3, alpha: clamp(p * 2 - 1.2) });
  } else if (i === 3) {
    const bar = (x, h, dashed, a) => { if (dashed) { g.rect(x, 282 - h, 34, h, { stroke: PAL.ink2, w: 1.6, dash: [4, 4], alpha: a }); g.text('?', x + 17, 276 - h / 2 + 10, { size: 24, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: a }); } else { g.rect(x, 282 - h, 34, h, { fill: U.rgba(PAL.sand, 0.5), alpha: a }); g.rect(x, 282 - h, 34, h * 0.4, { fill: U.rgba(PAL.coral, 0.8), alpha: a }); } };
    lab('additive', 30, 200, p * 2); bar(40, 74, false, clamp(p * 2)); bar(86, 44, true, clamp(p * 2 - 0.4));
    lab('compensatory', 190, 200, p * 2 - 0.6); bar(200, 70, false, clamp(p * 2 - 0.6)); bar(246, 70, true, clamp(p * 2 - 1.0));
    g.text('deaths with wolves', 320, 238, { size: 21, color: PAL.sand, alpha: clamp(p * 2 - 1.2) }); g.text('and without (unseen)', 320, 266, { size: 21, color: PAL.ink3, alpha: clamp(p * 2 - 1.4) }); g.line(20, 282, 300, 282, { color: PAL.ink3, w: 1.4, alpha: clamp(p * 2) });
  } else if (i === 4) {
    lab('how much evidence is enough?', 30, 200, p * 2);
    g.line(40, 252, 300, 252, { color: PAL.ink2, w: 2.4, progress: clamp(p * 2) }); const tx = 170 + 60 * Math.sin(t * 0.9);
    g.poly([[tx, 244], [tx - 10, 230], [tx + 10, 230], [tx, 244]], { fill: PAL.heather, color: null, w: 0, alpha: clamp(p * 2 - 0.6) }); g.line(tx, 244, tx, 262, { color: PAL.heather, w: 2.4, alpha: clamp(p * 2 - 0.6) });
    g.text('withhold', 40, 284, { size: 21, color: PAL.ink3, alpha: clamp(p * 2 - 0.8) }); g.text('accept', 300, 284, { size: 21, color: PAL.ink3, align: 'right', alpha: clamp(p * 2 - 0.8) });
    g.text('the cost of error', 330, 246, { size: 21, color: PAL.heather, alpha: clamp(p * 2 - 1.2) }); g.text('sets the bar', 330, 272, { size: 21, color: PAL.heather, alpha: clamp(p * 2 - 1.4) });
  } else {
    const u = U.smooth(0.5 + 0.9 * Math.sin(t * 1.1)); const lw = { size: 17, weight: 600, ls: 1.2 };
    g.text('NARROW', 30, 238, { ...lw, color: U.mix(PAL.mint, PAL.ink3, u), alpha: clamp(p * 2) });
    g.rect(124, 222, 52, 24, { r: 12, stroke: PAL.mint, w: 2, alpha: clamp(p * 2) }); g.circle(136 + 28 * u, 234, 8, { fill: PAL.mint, alpha: clamp(p * 2) });
    g.text('BROAD', 188, 238, { ...lw, color: U.mix(PAL.ink3, PAL.mint, u), alpha: clamp(p * 2) });
    for (let r = 0; r < 4; r++) for (let j = 0; j < 2; j++) { const s = j === 0 ? PAL.moss : r < 2 ? U.mix(PAL.ochre, PAL.moss, u) : PAL.moss; g.rect(340 + j * 90, 188 + r * 21, 82, 15, { r: 4, fill: U.rgba(s, 0.35), stroke: s, w: 1.2, alpha: clamp(p * 2 - 0.5 - r * 0.1) }); }
    lab('same practices, different label', 30, 284, p * 2 - 1);
  }
}

// A small channel cross-section: an incised stream.
function channelGlyph(g, x, y, a) { g.poly([[x - 46, y - 10], [x - 22, y - 10], [x - 10, y + 22], [x + 10, y + 22], [x + 22, y - 10], [x + 46, y - 10]], { color: PAL.ink2, w: 2.4, alpha: a }); g.poly([[x - 9, y + 14], [x + 9, y + 14], [x + 10, y + 22], [x - 10, y + 22]], { fill: U.rgba(PAL.lagoon, 0.7), color: PAL.lagoon, w: 1.5, alpha: a }); g.arrow(x + 32, y - 22, x + 32, y + 18, { color: PAL.lagoon, w: 1.6, head: 8, both: true, alpha: a * 0.8 }); }

Theater.chapter({
  id: 'syn', roman: 'XIV', title: 'Synthesis', color: COL,
  question: 'How do you audit a knowledge claim?',
  casefile: { title: 'Auditing “wolves restored Yellowstone”', sketch: 'wolf' },
  intro: { t: 'Chapter fourteen. Synthesis: observe, infer, claim.' },
  scenes: [
    {
      id: 'syn-audit', title: 'Auditing a famous claim', register: 'all',
      beats: [
        { t: 'Return to the claim that wolves restored Yellowstone, and audit it band by band. Observed: elk counts, from more than nineteen thousand to under four thousand, then back to seven to nine; aspen saplings escaping browse in many stands; willow taller, but mostly still below browse height; bison up fourfold; incised channels; few beaver dams.',
          cite: 'White et al. 2024; Painter et al. 2015; Hobbs et al. 2024; Wilmers et al. 2025',
          v: 'All case-file cards from the film pinned in a row; the three bands below. OBSERVE band fills with small icons for each observation, each tagged with its method.' },
        { t: 'Inferred: browsing limits aspen and willow, as exclosures show. Several predators, and people, reduced elk, in shares not yet apportioned. Density effects outweighed fear effects on aspen. Each inference rests on sampling designs and assumptions we have examined.',
          cite: 'Brice et al. 2024; Wilmers et al. 2025',
          v: 'INFER band fills with links from the DAG, each with a status badge (established, uncertain, mixed).' },
        { t: 'Claimable: large-carnivore recovery, together with hunting, drought, other predators, and bison, contributed to elk decline and to partial, local recovery of aspen. Willow recovery is constrained, perhaps in an alternative stable state. The strength of the cascade is still contested. Less lovely than the viral story, and better warranted.',
          v: 'CLAIM band writes the qualified claim; the original viral claim appears above it, struck through to its qualifiers.' },
        { t: 'Across North America, Wilmers and colleagues conclude, humans are the dominant driver of ungulate dynamics, and predator limitation is real but conditional. Can predator restoration repair disrupted ecosystems? Sometimes, partly, and slowly, which is why preventing their loss matters most.',
          cite: 'Wilmers et al. 2025',
          v: 'A continental map with human footprint shading; the six mechanism icons of the review’s figure 4 arranged around it.' },
      ],
      init() {
        // Map outline in screen space, and a stylized human-footprint dot field pre-rendered offscreen.
        const outline = NA.map(([lo, la]) => proj(lo, la));
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; outline.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
        x0 = Math.floor(x0) - 4; y0 = Math.floor(y0) - 4; const w = Math.ceil(x1 - x0) + 8, h = Math.ceil(y1 - y0) + 8;
        const cv = Theater.makeCanvas(w, h); const c = cv.getContext('2d'); const r = U.rng(1414); const vc = U.hex2rgb(PAL.violet);
        for (let y = y0 + 5, row = 0; y < y0 + h; y += 9, row++) for (let x = x0 + 5 + (row % 2) * 4.5; x < x0 + w; x += 9) {
          if (!inPoly(x, y, outline)) continue;
          const [lon, lat] = unproj(x, y);
          const south = U.smooth((57 - lat) / 14), east = U.smooth((lon + 104) / 18);
          const west = U.smooth((-114 - lon) / 6) * U.smooth((50 - lat) / 8) * U.smooth((lat - 30) / 4);
          const f = clamp(0.05 + 0.62 * south * (0.3 + 0.7 * east) + 0.45 * west + 0.24 * U.fbm2(lon * 0.15, lat * 0.15, 5, 3) + 0.1 * (r() - 0.5));
          c.fillStyle = `rgba(${vc[0]},${vc[1]},${vc[2]},${(0.16 + 0.74 * f).toFixed(3)})`; c.beginPath(); c.arc(x - x0, y - y0, 0.9 + 2.7 * f, 0, Math.PI * 2); c.fill();
        }
        const cards = Theater.chapters.filter((ch) => ch.casefile).map((ch) => ({ roman: ch.roman, title: ch.casefile.title, sketch: ch.casefile.sketch, color: ch.color || PAL.ink2 }));
        return { outline, foot: { cv, x0, y0, w, h }, cards, yell: proj(-110.6, 44.6) };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        const tBand = cue(S, 0, 'and audit it band by band'), tObs = cue(S, 0, 'Observed:');
        const mOf = (i) => ease.inOut((t - tBand + 0.3 - i * 0.035) / 1.2); const m = mOf(6); // the board of case files packs into a strip
        const out3 = 1 - S.tp(S.b(3) - 0.3, 0.9); // everything gives way to the continental map
        const N = D.cards.length, sw = 1760 / N - 10, sh = 72, sx = (i) => 80 + i * (1760 / N) + 5;
        const tRest = cue(S, 1, 'Each inference rests'); const restA = S.tp(tRest - 0.2, 0.8) * (1 - S.tp(S.b(2) - 0.2, 0.6));
        const INF = [
          { cx: 540, cue: 'browsing limits', badge: ['established', PAL.moss], label: 'browsing limits aspen and willow (exclosures)', cards: ['VI', 'VIII'] },
          { cx: 1075, cue: 'Several predators', badge: ['shares uncertain', PAL.ochre], label: 'several predators, and people, reduced elk', cards: ['IX', 'VIII'] },
          { cx: 1590, cue: 'Density effects', badge: ['mixed evidence', PAL.clay], label: 'density effects outweighed fear effects', cards: ['IV', 'VI'] },
        ];

        // ---- all the case files, pinned: a board first, then a strip along the top
        if (out3 > 0) D.cards.forEach((c, i) => {
          const bx = 80 + (i % 7) * 256, by = 286 + Math.floor(i / 7) * 168, bw = 224, bh = 140, mi = mOf(i);
          const x = lerp(bx, sx(i), mi), y = lerp(by, 214, mi), w = lerp(bw, sw, mi), h = lerp(bh, sh, mi);
          const a = S.tp(S.b(0) + 0.05 + i * 0.08, 0.5) * out3; if (a <= 0) return;
          const lit = Math.max(...INF.map((L, k) => (L.cards.includes(c.roman) ? S.tp(tRest + 0.4 + k * 0.25, 0.6) : 0))) * restA;
          const self = c.roman === 'XIV' ? 1 : 0;
          if (self || lit > 0) g.glow(x + w / 2, y + h / 2, w * 0.75, self ? PAL.rose : c.color, (self ? 0.22 * (1 - m * 0.5) : 0) + 0.45 * lit);
          g.casefile(x, y - (1 - ease.out(a)) * 18, w, h, { title: mi < 0.5 ? c.title : undefined, titleSize: 19 * w / 224, no: mi < 0.45 ? c.roman : undefined, sketch: c.sketch, color: c.color, rot: lerp(((i * 37) % 7 - 3) * 0.007, 0, mi), alpha: a, pin: mi < 0.5 });
          if (mi >= 0.5) g.circle(x + w - 11, y + 10, 5, { fill: c.color, alpha: a });
          g.text(c.roman, x + w / 2, 214 + sh + 22, { size: 17, role: 'mono', color: c.color, align: 'center', alpha: a * clamp((mi - 0.75) * 4) });
        });

        // ---- the three bands
        const bA = S.tp(tBand + 0.6, 1.0) * out3;
        const B = { claim: { x: 80, y: 330, w: 1760, h: 182 }, infer: { x: 80, y: 526, w: 1760, h: 183 }, observe: { x: 80, y: 723, w: 1760, h: 182 } };
        const act = { observe: S.tp(tObs - 0.3, 0.6) * (1 - S.tp(S.b(1) - 0.2, 0.6)), infer: S.tp(S.b(1) - 0.2, 0.6) * (1 - S.tp(S.b(2) - 0.2, 0.6)), claim: S.tp(S.b(2) - 0.2, 0.6) };
        if (bA > 0) ['claim', 'infer', 'observe'].forEach((k, i) => { const r = B[k], p = S.tp(tBand + 0.6 + i * 0.15, 1.1); band(g, k, { ...r, w: r.w * p }, act[k], bA); });

        // ---- OBSERVE: what was seen, each tagged with its method
        const OBS = [
          { w: 305, ic: 'elk', col: PAL.sand, title: 'elk counts', method: 'aerial counts', cue: 'elk counts' },
          { w: 340, ic: 'aspen', col: PAL.moss, title: 'aspen saplings', detail: 'many stands escape browse', method: 'random plots + tallest stems', cue: 'aspen saplings' },
          { w: 285, ic: 'willow', col: PAL.moss, title: 'willow', detail: 'taller, mostly below browse', method: 'height plots', cue: 'willow taller' },
          { w: 200, ic: 'bison', col: PAL.sand, title: 'bison', detail: 'up fourfold', method: 'aerial counts', cue: 'bison up fourfold' },
          { w: 235, ic: 'channel', col: PAL.lagoon, title: 'stream channels', detail: 'incised', method: 'channel surveys', cue: 'incised channels' },
          { w: 205, ic: 'beaver', col: PAL.sand, title: 'beaver dams', detail: 'few', method: 'dam surveys', cue: 'few beaver dams' },
        ];
        let ox = 250; const R0 = B.observe;
        if (out3 > 0) OBS.forEach((o) => {
          const cx = ox + o.w / 2; ox += o.w; const a = S.tp(cue(S, 0, o.cue) - 0.2, 0.6) * out3; if (a <= 0) return;
          const iy = R0.y + 52 + (1 - ease.out(a)) * 14;
          g.withAlpha(a, () => {
            if (o.ic === 'channel') channelGlyph(g, cx, iy, 1);
            else g.icon(o.ic, cx, iy, o.ic === 'willow' || o.ic === 'aspen' ? 62 : 56, o.col);
            if (o.ic === 'aspen') g.line(cx - 30, iy - 4, cx + 30, iy - 4, { color: PAL.sand, w: 1.6, dash: [4, 4] });
            if (o.ic === 'willow') g.line(cx - 30, iy - 36, cx + 30, iy - 36, { color: PAL.sand, w: 1.6, dash: [4, 4] });
            g.text(o.title, cx, R0.y + 108, { size: 22, color: PAL.ink, align: 'center' });
            if (o.detail) g.text(o.detail, cx, R0.y + 135, { size: 21, color: o.col, align: 'center' });
            caps(g, o.method, cx, R0.y + 166, { align: 'center', color: U.mix(REGC('observe'), PAL.ink3, 0.35), ls: o.method.length > 20 ? 1.2 : 2 });
          });
          if (o.ic === 'elk') { // the counts arrive as they are spoken
            const segs = [['19,000+', 'more than nineteen'], ['  →  <4,000', 'under four thousand'], ['  →  7–9,000', 'seven to nine']]; const so = { size: 21 };
            const tot = segs.reduce((s2, [x]) => s2 + g.measure(x, so), 0); let xx = cx - tot / 2;
            segs.forEach(([x, ph]) => { g.text(x, xx, R0.y + 135, { ...so, color: PAL.sand, alpha: S.tp(cue(S, 0, ph) - 0.1, 0.5) * out3 }); xx += g.measure(x, so); });
          }
        });

        // ---- INFER: links from the causal graph, each with a status badge
        const R1 = B.infer;
        if (out3 > 0) INF.forEach((L, k) => {
          const a = S.tp(cue(S, 1, L.cue) - 0.2, 0.7) * out3; if (a <= 0) return; const cx = L.cx, y = R1.y + 60, pa = S.tp(cue(S, 1, L.cue) + 0.3, 0.9);
          g.withAlpha(a, () => {
            if (k === 0) { g.icon('elk', cx - 150, y, 54, PAL.sand); g.arrow(cx - 105, y, cx + 40, y, { color: PAL.ink2, w: 2.6, head: 14, progress: pa }); g.text('browsing', cx - 32, y - 14, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: pa }); g.icon('aspen', cx + 82, y - 2, 54, PAL.moss); g.icon('willow', cx + 140, y, 52, PAL.moss); }
            else if (k === 1) { [['wolf', -220], ['puma', -168], ['bear', -116]].forEach(([ic, dx]) => g.icon(ic, cx + dx, y, 40, PAL.coral)); person(g, cx - 70, y + 16, 15, 1); g.arrow(cx - 46, y, cx + 70, y, { color: PAL.ink2, w: 2.6, head: 14, progress: pa }); g.icon('elk', cx + 122, y, 54, PAL.sand); g.text('−', cx + 160, y - 18, { size: 30, color: PAL.coral }); }
            else { for (let q = 0; q < 6; q++) g.circle(cx - 190 + (q % 3) * 14, y - 20 + Math.floor(q / 3) * 15, 5.5, { fill: PAL.sand }); g.text('density', cx - 176, y + 30, { size: 21, color: PAL.sand, align: 'center' }); eyeGlyph(g, cx - 80, y + 16, 40, 12, PAL.ink3); g.text('fear', cx - 80, y + 46, { size: 21, color: PAL.ink3, align: 'center' });
              g.arrow(cx - 152, y - 12, cx + 76, y - 12, { color: PAL.ink, w: 3.4, head: 15, progress: pa }); g.arrow(cx - 52, y + 16, cx + 76, y + 6, { color: PAL.ink3, w: 1.6, head: 10, dash: [4, 5], progress: pa }); g.icon('aspen', cx + 120, y - 2, 56, PAL.moss); }
            g.text(L.label, cx, R1.y + 124, { size: 21, color: PAL.ink2, align: 'center' });
            badge(g, L.badge[0], cx, R1.y + 157, L.badge[1], S.tp(cue(S, 1, L.cue) + 0.8, 0.5), 'center');
          });
          // each inference rests on designs and assumptions examined in earlier chapters
          if (restA > 0) L.cards.forEach((r, j) => {
            const i = D.cards.findIndex((c) => c.roman === r); if (i < 0) return; const p = S.tp(tRest + 0.2 + k * 0.25 + j * 0.15, 0.9);
            g.line(cx + (j ? 26 : -26), R1.y + 6, sx(i) + sw / 2, 214 + sh + 30, { color: D.cards[i].color, w: 1.6, dash: [5, 6], alpha: 0.75 * restA, progress: p });
          });
        });

        // ---- CLAIM: the viral claim, struck through to its qualifiers
        const R2 = B.claim; const words = ['Wolves', 'restored', 'Yellowstone.'];
        const mw = S.io(2, 1.1, 0.1); const size = lerp(lerp(64, 42, m), 42, mw);
        const tW = [cue(S, 2, 'large-carnivore recovery'), cue(S, 2, 'contributed to'), cue(S, 2, 'partial, local')];
        const tLess = cue(S, 2, 'Less lovely'); const less = S.tp(tLess, 0.8);
        const wo = { size, role: 'display', italic: true }; const sp = g.measure(' ', wo); const ws = words.map((w) => g.measure(w, wo)); const tot = ws.reduce((s, w) => s + w, 0) + 2 * sp;
        let nx = lerp(960 - tot / 2, 250, m); const ny = lerp(lerp(786, 438, m), 392, mw); const spread = [250, 870, 1180];
        const ca = S.p(0, 0.9, 0.3) * out3;
        caps(g, 'the claim under audit', 960, 700, { align: 'center', color: PAL.rose, alpha: ca * (1 - m) });
        words.forEach((w, i) => {
          const x = lerp(nx, spread[i], mw); nx += ws[i] + sp; const st = S.tp(tW[i] - 0.3, 0.5);
          g.text(w, x, ny, { ...wo, color: PAL.ink, alpha: ca * (1 - 0.55 * st) });
          if (st > 0) g.line(x - 4, ny - size * 0.3, x - 4 + (ws[i] + 8) * st, ny - size * 0.3, { color: PAL.coral, w: 3.2, alpha: ca });
        });
        badge(g, 'under audit', lerp(nx + 24, 1816, 1), 438, PAL.ink3, S.tp(tBand + 1.2, 0.6) * (1 - S.p(2, 0.5)) * out3, 'right');
        if (out3 > 0 && S.at(2)) {
          const qo = { size: 22, color: U.mix(PAL.ink2, PAL.ink, less), lh: 1.3 };
          g.withAlpha(S.tp(tW[0], 0.8) * out3, () => g.wrap('Large-carnivore recovery, with hunting, drought, other predators, and bison,', 250, 428, 580, qo));
          g.withAlpha(S.tp(tW[1], 0.8) * out3, () => g.wrap('contributed to', 870, 428, 280, qo));
          g.withAlpha(S.tp(tW[2], 0.8) * out3, () => g.wrap('elk decline, and to partial, local recovery of aspen.', 1180, 428, 620, qo));
          const p1 = S.tp(cue(S, 2, 'Willow recovery') - 0.1, 0.6) * out3, p2 = S.tp(cue(S, 2, 'The strength of the cascade') - 0.1, 0.6) * out3;
          const w1 = g.pill('Willow: constrained, perhaps an alternative stable state', 250, 487, { size: 21, color: PAL.ochre, alpha: p1 });
          g.pill('Cascade strength: still contested', 250 + w1 + 18, 487, { size: 21, color: PAL.ochre, alpha: p2 });
          g.text('better warranted', 1812, 495, { size: 32, role: 'display', italic: true, color: PAL.rose, align: 'right', alpha: less * out3 });
        }

        // ---- Across North America: humans dominant, predator limitation conditional
        const tHum = cue(S, 3, 'humans are the dominant'), tCond = cue(S, 3, 'predator limitation'), tQ = cue(S, 3, 'Can predator restoration'), tAns = cue(S, 3, 'Sometimes, partly'), tPrev = cue(S, 3, 'preventing their loss');
        const mA = S.tp(S.b(3) + 0.1, 0.8);
        if (mA > 0) g.withAlpha(mA, () => {
          caps(g, 'across North America', 960, 256, { align: 'center', color: PAL.ink2 });
          const fp = S.tp(tHum - 0.4, 1.8); const F = D.foot;
          if (fp > 0) g.clip(F.x0, F.y0, F.w * fp, F.h, () => g.withAlpha(Math.min(1, fp * 1.5), () => ctx.drawImage(F.cv, F.x0, F.y0)));
          g.poly(D.outline, { fill: 'rgba(239,232,216,0.035)', color: null, w: 0, alpha: S.tp(S.b(3) + 1.6, 0.8) });
          g.poly(D.outline, { color: PAL.ink2, w: 2, progress: S.tp(S.b(3), 2.0) });
          g.withAlpha(fp, () => { caps(g, 'human footprint', 628, 720, { color: PAL.violet }); for (let q = 0; q < 5; q++) g.circle(640 + q * 22, 744, 1.2 + q * 0.7, { fill: PAL.violet, alpha: 0.25 + q * 0.17 }); caps(g, 'stylized', 628, 780, { size: 15 }); });
          // Yellowstone, for the closing question
          const ya = S.tp(tQ - 0.2, 0.7); const [yx, yy] = D.yell;
          g.circle(yx, yy, 14 + 4 * Math.sin(t * 3), { stroke: PAL.coral, w: 2, alpha: ya }); g.dot(yx, yy, 5, PAL.coral, ya, 2.4);
          caps(g, 'Yellowstone', yx + 24, yy + 6, { color: PAL.coral, alpha: ya });
          // six mechanisms, arranged around the map
          const MECH = [['Humans', 400, 340], ['Islands', 400, 560], ['Apparent competition', 400, 780], ['Multiple predators', 1520, 340], ['Nonconsumptive effects', 1520, 560], ['Prey resilience', 1520, 780]];
          MECH.forEach(([nm, x, y], k) => {
            const a = k === 0 ? S.tp(tHum - 0.2, 0.7) : S.tp(tCond + 0.1 + (k - 1) * 0.3, 0.6); if (a <= 0) return;
            if (k === 0) g.glow(x, y, 110, PAL.violet, 0.35 * a);
            mechanism(g, k, x, y - (1 - ease.out(a)) * 12, a, t);
            if (k === 0) g.circle(x, y, 66, { stroke: PAL.violet, w: 2.4, alpha: a });
            g.text(nm, x, y + 94, { size: 22, color: k === 0 ? PAL.violet : PAL.ink, align: 'center', alpha: a });
          });
          caps(g, 'mechanisms · Wilmers et al. 2025, fig. 4', 1520, 256, { align: 'center', alpha: S.tp(tCond, 0.8) });
          // the conclusions, then the closing question and its answer
          const line = (s, y, a, o = {}) => g.text(s, 960, y, { size: 34, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: a, ...o });
          line('Humans are the dominant driver of ungulate dynamics.', 884, S.tp(tHum, 0.7) * (1 - S.tp(tCond - 0.3, 0.5)), { color: PAL.violet });
          line('Predator limitation is real, but conditional.', 884, S.tp(tCond, 0.7) * (1 - S.tp(tQ - 0.3, 0.5)));
          line('Can predator restoration repair disrupted ecosystems?', 862, S.tp(tQ, 0.7), { size: 30, color: PAL.ink2 });
          line('Sometimes, partly, and slowly.', 904, S.tp(tAns, 0.7) * (1 - S.tp(tPrev - 0.2, 0.5)), { size: 34 });
          line('So preventing their loss matters most.', 904, S.tp(tPrev, 0.7), { size: 34, color: PAL.coral });
        });
      },
    },
    {
      id: 'syn-seven', title: 'Seven questions for any claim', register: 'all',
      beats: [
        { t: 'Here is an audit you can take to any study, news story, or exam question. One: what was observed, and how? Two: what was inferred, under which assumptions? Three: which alternatives remain?',
          v: 'A numbered checklist builds beside the bands; items 1–3 attach to OBSERVE and INFER.' },
        { t: 'Four: how strong is the evidence, and what would change your mind? Five: has it been replicated, and where does it generalize? Six: which values and stakes shape the claim? Seven: what would another tradition of inquiry ask that this one did not?',
          v: 'Items 4–7 attach to INFER and CLAIM; item 7 brings the two lenses in.' },
        { t: 'No tradition owns these questions. Postpositivists and interpretivists answer them in their own ways, and each can hold the other to them.',
          v: 'The two lenses rotate slowly around the checklist.' },
      ],
      draw(g, t, S) {
        const ctx = g.ctx;
        const tAny = cue(S, 0, 'any study'), tNum = ['One:', 'Two:', 'Three:'].map((p) => cue(S, 0, p)).concat(['Four:', 'Five:', 'Six:', 'Seven:'].map((p) => cue(S, 1, p)));
        const tOwn = S.b(2), tHold = cue(S, 2, 'each can hold the other');
        const Q = ['What was observed, and how?', 'What was inferred, under which assumptions?', 'Which alternatives remain?', 'How strong is the evidence, and what would change your mind?', 'Has it been replicated, and where does it generalize?', 'Which values and stakes shape the claim?', 'What would another tradition of inquiry ask that this one did not?'];
        const BAND = ['observe', 'infer', 'infer', 'infer', 'claim', 'claim', 'claim'];
        const R = { claim: { x: 100, y: 304, w: 330, h: 168 }, infer: { x: 100, y: 496, w: 330, h: 168 }, observe: { x: 100, y: 688, w: 330, h: 168 } };
        const anchor = (i) => { const r = R[BAND[i]]; const off = BAND[i] === 'observe' ? 0 : ((i - (BAND[i] === 'infer' ? 1 : 4)) - 1) * 40; return [r.x + r.w, r.y + r.h / 2 + off]; };
        const iy = (i) => 344 + i * 78;

        // The documents an audit applies to: large at first, then tucked into the top row.
        const dm = S.io(0, 1.0, tNum[0] - S.b(0) - 0.6);
        ['study', 'news story', 'exam question'].forEach((nm, k) => {
          const a = S.tp(tAny - 0.3 + k * 0.45, 0.6); const x = lerp(700 + k * 230, 1060 + k * 92, dm), y = lerp(560, 248, dm), s = lerp(110, 32, dm);
          docGlyph(g, k, x, y, s, a * (1 - S.tp(tNum[6] + 0.4, 0.6)));
          g.text(nm, x, y + 100, { size: 22, color: PAL.ink2, align: 'center', alpha: a * (1 - dm) });
        });
        caps(g, 'claim audit · seven questions', 520, 262, { color: PAL.ink, alpha: S.tp(tNum[0] - 0.4, 0.8) });

        // The three bands, lit as questions attach to them.
        const attached = (k) => { const idx = BAND.map((b, i) => (b === k ? i : -1)).filter((i) => i >= 0); return Math.max(...idx.map((i) => S.tp(tNum[i] + 0.4, 0.6))); };
        const bA = S.p(0, 0.9, 0.3);
        ['claim', 'infer', 'observe'].forEach((k) => band(g, k, R[k], attached(k), bA, 18));

        // The checklist and its connectors (drawn by a function so the lenses can re-ink it).
        const list = (tint) => {
          Q.forEach((q, i) => {
            const a = S.tp(tNum[i] - 0.15, 0.6); if (a <= 0) return; const col = tint || REGC(BAND[i]); const y = iy(i), dx = (1 - ease.out(a)) * 30;
            g.circle(548 + dx, y - 8, 19, { stroke: col, w: 2, fill: tint ? undefined : U.rgba(col, 0.12), alpha: a });
            g.text(String(i + 1), 548 + dx, y + 1, { size: 26, role: 'display', color: col, align: 'center', alpha: a });
            g.wrap(q, 588 + dx, y, 720, { size: 23, color: tint || PAL.ink, alpha: a, lh: 1.22 });
          });
        };
        Q.forEach((_, i) => {
          const p = S.tp(tNum[i] + 0.15, 0.8); if (p <= 0) return; const [ax, ay] = anchor(i), y = iy(i) - 8; const pts = [];
          for (let q = 0; q <= 24; q++) { const u = q / 24, v = 1 - u; pts.push([v * v * v * 526 + 3 * v * v * u * 480 + 3 * v * u * u * 476 + u * u * u * ax, v * v * v * y + 3 * v * v * u * y + 3 * v * u * u * ay + u * u * u * ay]); }
          g.poly(pts, { color: REGC(BAND[i]), w: 2, alpha: 0.85, progress: p });
          g.dot(ax, ay, 4.5, REGC(BAND[i]), clamp(p * 3 - 2), 2.2);
        });
        list(null);

        // Two lenses arrive with question seven, then circle the checklist.
        const la = S.tp(tNum[6] + 0.6, 0.9); const cx = 915, cy = 575, rx = 320, ry = 238, lr = 86;
        if (la > 0) {
          const th = 2.55 + 0.2 * Math.max(0, t - tOwn - 0.4) + 0.05 * Math.max(0, t - tNum[6] - 0.6);
          const L = [['pos', th], ['int', th + Math.PI]].map(([k, a]) => ({ k, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), a, col: g.LENS[k].color }));
          const oa = S.tp(tOwn, 0.8);
          if (oa > 0) { const pts = []; for (let q = 0; q <= 72; q++) { const a = q / 72 * Math.PI * 2; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } g.poly(pts, { color: PAL.ink3, w: 1.4, dash: [4, 8], alpha: 0.6 * oa }); }
          const ha = S.tp(tHold - 0.1, 1.0);
          if (ha > 0) L.forEach((l, j) => {
            const a0 = l.a + 0.32, a1 = l.a + Math.PI - 0.32; const pts = []; for (let q = 0; q <= 40; q++) { const a = lerp(a0, a1, q / 40); pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
            const tip = g.poly(pts, { color: l.col, w: 2.6, progress: ha }); const q2 = pts[Math.max(0, Math.floor(40 * ha) - 2)];
            if (ha > 0.1) g.arrowHead(tip[0], tip[1], Math.atan2(tip[1] - q2[1], tip[0] - q2[0]), 13, l.col);
          });
          let lgx = 1312; ['int', 'pos'].forEach((k) => { const o = { size: 17, weight: 600, ls: 2.6 }; const w = g.measure(g.LENS[k].short, o); caps(g, g.LENS[k].short, lgx, 262, { align: 'right', color: g.LENS[k].color, alpha: la }); g.lens(k, lgx - w - 24, 256, 12, { label: false, w: 2, alpha: la }); lgx -= w + 70; });
          L.forEach((l) => {
            const s = lr * lerp(0.4, 1, ease.outBack(la));
            g.with(() => { ctx.beginPath(); ctx.arc(l.x, l.y, s, 0, Math.PI * 2); ctx.clip(); g.circle(l.x, l.y, s, { fill: PAL.bg, alpha: 0.88 * la }); g.withAlpha(la, () => list(l.col)); });
            g.lens(l.k, l.x, l.y, s, { label: false, alpha: la, fillA: 0.1 });
          });
        }
        g.text('No tradition owns these questions.', 915, 900, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tOwn, 0.9) });
      },
      terms: [
        { beat: 0.3, term: 'Claim audit', def: 'Seven questions: what was observed and how; what was inferred and how; alternatives; strength of evidence; replication and scope; values; other traditions.' },
      ],
    },
    {
      id: 'syn-review', title: 'Exam rehearsal', register: null,
      beats: [
        { t: 'Before you go, rehearse. What separates induction from abduction, and where does strong inference fit? Why does the Duhem–Quine thesis complicate falsification? What did Kuhn mean by incommensurability?',
          s: 'Before you go, rehearse. What separates induction from abduction, and where does strong inference fit? Why does the Doo-em Quine thesis complicate falsification? What did Kuhn mean by incommensurability?',
          v: 'Question cards deal onto the stage, each tagged with its chapter numeral.' },
        { t: 'Why is compensatory mortality a counterfactual claim? What is the argument from inductive risk? And how does the answer to “what counts as science?” change with the criterion you choose?', pause: 1.0,
          v: 'Final cards: VIII, XII, XIII.' },
        { t: 'The ecological theater was a stage for evolution. This one has been a stage for knowing. Observe carefully, infer honestly, and claim no more than your warrant allows.', pause: 2.0,
          v: 'Cards gather into the three bands; the bands fade to the title; wolf tracks cross the snow and out of frame.' },
      ],
      headerAlpha: (S) => 1 - S.tp(cue(S, 2, 'This one has been') - 0.4, 0.9),
      init() {
        const r = U.rng(1499); const snow = (x) => 842 + 6 * Math.sin(x * 0.004) + 4 * Math.sin(x * 0.011 + 1);
        const prints = []; for (let i = 0; i < 40; i++) { const x = -40 + i * 52 + (r() - 0.5) * 6; prints.push({ x, y: snow(x) + 36 + (i % 2 ? 10 : -10) + (r() - 0.5) * 4, rot: Math.PI / 2 + (r() - 0.5) * 0.16 }); }
        const glints = []; for (let i = 0; i < 46; i++) { const x = r() * 1920; glints.push({ x, y: snow(x) + 8 + r() * 62, ph: r() * 6.28, s: 0.8 + r() * 1.4 }); }
        const ground = []; for (let x = 0; x <= 1920; x += 32) ground.push([x, snow(x)]);
        return { prints, glints, ground, rot: [-1.3, 0.9, -0.6, 1.1, -0.9, 0.7].map((d) => d * Math.PI / 180) };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        const ct = REVIEW.map((c) => cue(S, c.cue[0], c.cue[1]));
        const tEco = S.b(2), tKnow = cue(S, 2, 'This one has been'), tObs = cue(S, 2, 'Observe carefully'), tInf = cue(S, 2, 'infer honestly'), tCl = cue(S, 2, 'and claim no more');
        const gather = (i) => S.io(2, 1.2, 0.15 + i * 0.09);
        const out = 1 - S.tp(tKnow - 0.4, 0.7); // the rehearsal clears for the title

        // ---- the deck
        const dealt = ct.filter((x) => t >= x - 0.1).length;
        const dk = S.p(0, 0.8, 0.2) * (1 - S.tp(ct[0] + 0.3, 0.6));
        if (dk > 0) g.withAlpha(dk, () => {
          for (let i = 0; i < 6 - dealt; i++) { const o = (5 - dealt - i) * 7; g.rect(960 - 170 + o, 470 - o, 340, 190, { fill: 'rgba(24,21,44,0.97)', stroke: 'rgba(239,232,216,0.22)', w: 1.5, r: 10 }); }
          if (dealt < 6) g.text('?', 960, 610, { size: 130, role: 'display', italic: true, color: PAL.ink3, align: 'center' });
          caps(g, 'six questions to rehearse', 960, 720, { align: 'center' });
        });

        // ---- bands that will receive the cards
        const BR = { claim: { x: 520, y: 356, w: 880, h: 118 }, infer: { x: 520, y: 492, w: 880, h: 118 }, observe: { x: 520, y: 628, w: 880, h: 118 } };
        const bandIn = S.io(2, 1.0, 0.0), mq = ease.inOut((t - tKnow + 0.3) / 1.3); // bands appear, then condense to three bars over the title
        const BAR = { claim: 386, infer: 402, observe: 418 }; // three stacked bars, like the register badge
        if (bandIn > 0) ['claim', 'infer', 'observe'].forEach((k) => {
          const r = BR[k]; const rr = { x: lerp(r.x, 860, mq), y: lerp(r.y, BAR[k], mq), w: lerp(r.w, 200, mq), h: lerp(r.h, 7, mq) };
          if (mq < 0.98) band(g, k, rr, 0.6, bandIn * (1 - mq * 0.3), mq < 0.5 ? 18 : 0); else g.rect(rr.x, rr.y, rr.w, rr.h, { r: 3, fill: REGC(k) });
        });
        g.text('The ecological theater · a stage for evolution', 960, 316, { size: 30, role: 'display', italic: true, color: PAL.moss, align: 'center', alpha: 0.85 * S.tp(tEco + 0.2, 0.9) * out });

        // ---- the cards: dealt to a grid, then gathered into their bands
        const slot = {}; REVIEW.forEach((c, i) => { const k = c.band; slot[k] = (slot[k] || 0) + 1; c._j = slot[k] - 1; });
        REVIEW.forEach((c, i) => {
          const pd = S.tp(ct[i] - 0.15, 0.75); if (pd <= 0) return; const ch = Theater.chapters.find((x) => x.roman === c.ch) || {}; const col = ch.color || PAL.ink2;
          const gx = [390, 960, 1530][i % 3], gy = [392, 732][Math.floor(i / 3)]; const cp = gather(i);
          const bx = 760 + c._j * 190, by = BR[c.band].y + BR[c.band].h / 2;
          const cx = lerp(lerp(960, gx, ease.out(pd)), bx, cp), cy = lerp(lerp(565, gy, ease.out(pd)), by, cp);
          const sc = lerp(lerp(0.6, 1, ease.outBack(pd)), 0.3, cp), rr = lerp(D.rot[i] * ease.out(pd), 0, cp);
          g.withAlpha(clamp(pd * 3) * out, () => g.with(() => {
            ctx.translate(cx, cy); ctx.rotate(rr); ctx.scale(sc, sc); ctx.translate(-270, -150);
            g.rect(4, 6, 540, 300, { r: 10, fill: 'rgba(0,0,0,0.3)' });
            g.rect(0, 0, 540, 300, { fill: 'rgba(24,21,44,0.97)', stroke: 'rgba(239,232,216,0.22)', w: 1.5, r: 10 }); g.rect(0, 0, 540, 7, { fill: col, r: 3 });
            g.withAlpha(1 - clamp(cp * 1.6), () => {
              caps(g, `${c.ch}  ·  ${ch.title || ''}`, 26, 44, { color: col });
              g.wrap(c.q, 26, 92, 490, { size: 30, role: 'display', color: PAL.ink, lh: 1.08 });
              sketch(g, i, S.tp(ct[i] + 0.7, 2.2), t);
            });
            g.text(c.ch, 270, 196, { size: 120, role: 'mono', color: col, align: 'center', alpha: clamp(cp * 2 - 0.6) });
          }));
        });

        // ---- the end: title, three imperatives, wolf tracks across the snow
        const ta = S.tp(tKnow + 0.3, 1.2);
        if (ta > 0) {
          g.text('The Epistemic Theater', 960, 540, { size: 124, role: 'display', color: PAL.ink, align: 'center', alpha: ta });
          g.text('a stage for knowing', 960, 612, { size: 42, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tKnow + 1.0, 1.0) });
          const segs = [['Observe carefully', REGC('observe'), tObs], ['  ·  ', PAL.ink3, tInf], ['infer honestly', REGC('infer'), tInf], ['  ·  ', PAL.ink3, tCl], ['claim no more than your warrant allows', REGC('claim'), tCl]];
          const so = { size: 34, role: 'display', italic: true }; const tot = segs.reduce((s2, [x]) => s2 + g.measure(x, so), 0); let xx = 960 - tot / 2;
          segs.forEach(([x, col, t0]) => { g.text(x, xx, 704, { ...so, color: col, alpha: S.tp(t0 - 0.1, 0.8) }); xx += g.measure(x, so); });
        }
        const sa = S.tp(tKnow, 1.4);
        if (sa > 0) {
          g.with(() => { const gr = ctx.createLinearGradient(0, 830, 0, 915); gr.addColorStop(0, 'rgba(220,227,236,0.07)'); gr.addColorStop(1, 'rgba(220,227,236,0)'); ctx.globalAlpha *= sa; ctx.fillStyle = gr; ctx.beginPath(); D.ground.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(1920, 915); ctx.lineTo(0, 915); ctx.closePath(); ctx.fill(); });
          g.poly(D.ground, { color: U.rgba(PAL.snow, 0.45), w: 1.6, alpha: sa, progress: sa });
          D.glints.forEach((q) => g.circle(q.x, q.y, q.s, { fill: PAL.snow, alpha: sa * (0.25 + 0.25 * Math.sin(t * 2.2 + q.ph)) }));
          const t0 = tObs - 0.8, dt = Math.max(0.08, (S.dur - 2.1 - t0) / (D.prints.length - 1));
          D.prints.forEach((q, i) => {
            const ti = t0 + i * dt; const a = S.tp(ti, 0.25) * (0.85 - 0.4 * clamp((t - ti - 2.0) / 3)); if (a <= 0) return;
            g.ellipse(q.x + 1, q.y + 2, 17, 14, { fill: 'rgba(120,130,160,0.16)', alpha: a });
            g.icon('track', q.x, q.y, 31, PAL.snow, { rot: q.rot, alpha: a });
          });
        }
      },
    },
  ],
});
})();
