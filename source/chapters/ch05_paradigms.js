/* Chapter V — Kuhn: paradigms and scientific revolutions. Case file: from vermin to keystone. */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;
const COL = PAL.lagoon;
const TAU = Math.PI * 2;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the caption).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
// Ease-in-out progress from absolute local time s0 over d seconds.
const io = (S, s0, d = 1) => ease.inOut((S.t - s0) / d);

// A person as a simple bust (people are violet). (x, y) is the base of the shoulders; s is the height.
function bust(g, x, y, s, col = PAL.violet, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.arc(x, y - s * 0.66, s * 0.21, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.36, y); c.bezierCurveTo(x - s * 0.36, y - s * 0.3, x - s * 0.22, y - s * 0.41, x, y - s * 0.41); c.bezierCurveTo(x + s * 0.22, y - s * 0.41, x + s * 0.36, y - s * 0.3, x + s * 0.36, y); c.closePath(); c.fill();
  c.restore();
}
// Small trend triangle (up or down).
function trend(g, x, y, up, col, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath();
  if (up) { c.moveTo(x, y - 11); c.lineTo(x + 11, y + 8); c.lineTo(x - 11, y + 8); } else { c.moveTo(x, y + 11); c.lineTo(x + 11, y - 8); c.lineTo(x - 11, y - 8); }
  c.closePath(); c.fill(); c.restore();
}
// Upright text set along a circle, centred on angle a (canvas radians). Bottom-half labels read left to right.
function arcText(g, str, cx, cy, r, a, o = {}) {
  const ctx = g.ctx, size = o.size || 17, ls = o.ls ?? 2; const al = o.alpha ?? 1; if (al <= 0) return;
  ctx.save(); ctx.font = g.font('sans', size, o.weight || 600); ctx.fillStyle = o.color || PAL.ink; ctx.globalAlpha *= al;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ch = [...str]; const ws = ch.map((c) => ctx.measureText(c).width); const tot = ws.reduce((s, w) => s + w, 0) + ls * (ch.length - 1);
  const dir = Math.sin(a) > 0.2 ? -1 : 1; let ang = a - dir * tot / (2 * r);
  for (let i = 0; i < ch.length; i++) {
    const mid = ang + dir * ws[i] / (2 * r);
    ctx.save(); ctx.translate(cx + Math.cos(mid) * r, cy + Math.sin(mid) * r); ctx.rotate(mid + dir * Math.PI / 2); ctx.fillText(ch[i], 0, 0); ctx.restore();
    ang += dir * (ws[i] + ls) / r;
  }
  ctx.restore();
}

// The Kuhn wheel -----------------------------------------------------------------
const STAGES = ['NORMAL SCIENCE', 'ANOMALY', 'CRISIS', 'REVOLUTION', 'NEW NORMAL'];
const STAGE_COL = [PAL.lagoon, PAL.ochre, PAL.coral, PAL.rose, PAL.mint];
const WR1 = 205, WR0 = 145;
// pos: continuous stage index under the top pointer. The ring of ticks turns slowly with time.
function drawWheel(g, cx, cy, o = {}) {
  const ctx = g.ctx, seg = TAU / 5, gap = 0.032, a = o.alpha ?? 1, prog = o.prog ?? 1, pos = o.pos || 0, t = o.t || 0;
  if (a <= 0 || prog <= 0) return;
  g.withAlpha(a, () => {
    const spin = -t * 0.05 - pos * seg;
    ctx.save(); ctx.strokeStyle = PAL.ink3; ctx.lineWidth = 1.4; ctx.globalAlpha *= 0.6 * prog; ctx.beginPath();
    for (let k = 0; k < 90; k++) { const an = spin + k * TAU / 90; const r2 = WR1 + (k % 6 ? 11 : 18); ctx.moveTo(cx + Math.cos(an) * (WR1 + 5), cy + Math.sin(an) * (WR1 + 5)); ctx.lineTo(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2); }
    ctx.stroke(); ctx.restore();
    g.circle(cx, cy, WR0 - 9, { stroke: PAL.rule, w: 1.2, alpha: prog });
    const base = -Math.PI / 2 - pos * seg;
    for (let i = 0; i < 5; i++) {
      const p = clamp(prog * 5 - i); if (p <= 0) continue;
      const mid = base + i * seg, a0 = mid - seg / 2 + gap, a1 = a0 + (seg - 2 * gap) * p;
      const d = ((i - pos) % 5 + 7.5) % 5 - 2.5; const f = clamp(1 - Math.abs(d)) * (o.focus ?? 1); const col = STAGE_COL[i];
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, WR1, a0, a1); ctx.arc(cx, cy, WR0, a1, a0, true); ctx.closePath();
      ctx.fillStyle = U.rgba(col, 0.07 + 0.25 * f); ctx.fill(); ctx.strokeStyle = U.rgba(col, 0.4 + 0.6 * f); ctx.lineWidth = 1.5 + 1.2 * f; ctx.stroke(); ctx.restore();
      if (f > 0.01) g.glow(cx + Math.cos(mid) * 175, cy + Math.sin(mid) * 175, 130, col, 0.2 * f);
      if (p >= 1) { const ae = mid + seg / 2; g.arrowHead(cx + Math.cos(ae) * 175, cy + Math.sin(ae) * 175, ae + Math.PI / 2, 14, U.rgba(PAL.ink, 0.55)); }
      arcText(g, STAGES[i], cx, cy, 175, mid, { size: 17, ls: 2, color: f > 0.5 ? PAL.ink : PAL.ink2, alpha: clamp(p * 2 - 1) * (0.65 + 0.35 * f) });
    }
    const py = cy - WR1 - 24; ctx.save(); ctx.globalAlpha *= prog; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(cx, py + 14); ctx.lineTo(cx - 11, py - 6); ctx.lineTo(cx + 11, py - 6); ctx.closePath(); ctx.fill(); ctx.restore();
  });
}
// A hairline crack: a jagged polyline plus short branches. Returns an array of polylines (main first).
function crack(r, x0, y0, ang, len, branches = 2) {
  const pts = [[x0, y0]]; let x = x0, y = y0, a = ang; const n = 10;
  for (let k = 0; k < n; k++) { a += (r() - 0.5) * 0.85; const s = len / n * (0.6 + r() * 0.8); x += Math.cos(a) * s; y += Math.sin(a) * s; pts.push([x, y]); }
  const out = [pts];
  for (let b = 0; b < branches; b++) { const j = 2 + Math.floor(r() * (n - 4)); out.push(crack(r, pts[j][0], pts[j][1], ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6), len * 0.32, 0)[0]); }
  return out;
}
function drawCrack(g, c, p, col, w = 1.7) {
  if (p <= 0) return; g.poly(c[0], { color: col, w, progress: p });
  for (let b = 1; b < c.length; b++) g.poly(c[b], { color: col, w: w * 0.75, progress: clamp(p * 2 - 1) });
}
// Jigsaw piece outline. tabs = [top, right, bottom, left]: +1 knob out, -1 knob in, 0 flat.
function pieceEdge(ctx, x0, y0, x1, y1, tab) {
  if (!tab) { ctx.lineTo(x1, y1); return; }
  const dx = x1 - x0, dy = y1 - y0, nx = dy * tab, ny = -dx * tab; const P = (u, v) => [x0 + dx * u + nx * v, y0 + dy * u + ny * v];
  ctx.lineTo(...P(0.37, 0));
  ctx.bezierCurveTo(...P(0.41, 0), ...P(0.45, 0.08), ...P(0.39, 0.14));
  ctx.bezierCurveTo(...P(0.31, 0.25), ...P(0.69, 0.25), ...P(0.61, 0.14));
  ctx.bezierCurveTo(...P(0.55, 0.08), ...P(0.59, 0), ...P(0.63, 0));
  ctx.lineTo(x1, y1);
}
function piecePath(ctx, x, y, w, h, tabs) {
  ctx.beginPath(); ctx.moveTo(x, y);
  pieceEdge(ctx, x, y, x + w, y, tabs[0]); pieceEdge(ctx, x + w, y, x + w, y + h, tabs[1]);
  pieceEdge(ctx, x + w, y + h, x, y + h, tabs[2]); pieceEdge(ctx, x, y + h, x, y, tabs[3]); ctx.closePath();
}
// Jastrow's duck–rabbit in line work, centred on (x, y). o.duck / o.rabbit (0..1) tint the shared lobes.
function duckRabbit(g, x, y, sc, o = {}) {
  const ctx = g.ctx, p = o.progress ?? 1, a = o.alpha ?? 1; if (a <= 0 || p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(27, -14); ctx.globalAlpha *= a;
  const upper = new Path2D(); upper.moveTo(-22, -36); upper.bezierCurveTo(-50, -48, -88, -50, -104, -37); upper.bezierCurveTo(-112, -29, -106, -20, -94, -20); upper.bezierCurveTo(-72, -20, -44, -19, -27, -20);
  const lower = new Path2D(); lower.moveTo(-28, -11); lower.bezierCurveTo(-50, -14, -80, -14, -96, -5); lower.bezierCurveTo(-106, 1, -100, 11, -88, 11); lower.bezierCurveTo(-66, 11, -40, 9, -24, 5);
  const head = new Path2D(); head.moveTo(-22, -36); head.bezierCurveTo(-10, -50, 6, -53, 20, -51); head.bezierCurveTo(38, -48, 50, -34, 49, -15); head.bezierCurveTo(48, -3, 47, 5, 44, 10);
  head.quadraticCurveTo(40, 14, 36, 13); head.quadraticCurveTo(38, 17, 42, 20); head.bezierCurveTo(44, 32, 37, 44, 30, 54); head.lineTo(26, 80);
  const neck = new Path2D(); neck.moveTo(-24, 5); neck.bezierCurveTo(-18, 18, -13, 30, -14, 44); neck.lineTo(-18, 80);
  const mouth = new Path2D(); mouth.moveTo(-27, -20); mouth.quadraticCurveTo(-30, -16, -28, -11);
  const fill = (path, col, al) => { if (al <= 0) return; ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = col; ctx.fill(path); ctx.restore(); };
  const da = (o.duck || 0) * clamp(p * 2 - 1), ra = (o.rabbit || 0) * clamp(p * 2 - 1);
  fill(upper, PAL.ochre, 0.42 * da); fill(lower, PAL.ochre, 0.42 * da); fill(upper, PAL.rose, 0.38 * ra); fill(lower, PAL.rose, 0.38 * ra);
  // context: ripples for the duck, grass for the rabbit
  ctx.lineCap = 'round';
  if (da > 0) { ctx.save(); ctx.globalAlpha *= da * 0.8; ctx.strokeStyle = PAL.lagoon; ctx.lineWidth = 2.4 / sc * 1.4; for (const [x0, w0, yy] of [[-70, 60, 86], [-4, 80, 86], [-44, 50, 98], [16, 44, 98]]) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(x0 + w0 / 4, yy - 5, x0 + w0 / 2, yy); ctx.quadraticCurveTo(x0 + w0 * 0.75, yy + 5, x0 + w0, yy); ctx.stroke(); } ctx.restore(); }
  if (ra > 0) { ctx.save(); ctx.globalAlpha *= ra * 0.8; ctx.strokeStyle = PAL.moss; ctx.lineWidth = 2.4 / sc * 1.4; for (let k = 0; k < 11; k++) { const bx = -78 + k * 14; ctx.beginPath(); ctx.moveTo(bx, 92); ctx.quadraticCurveTo(bx + 2, 84, bx + (k % 2 ? 6 : -4), 74 + (k % 3) * 4); ctx.stroke(); } ctx.restore(); }
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3.4 / Math.sqrt(sc); ctx.lineJoin = 'round';
  const L = 330; ctx.setLineDash([L * p, 2000]);
  for (const path of [upper, lower, head, neck, mouth]) ctx.stroke(path);
  ctx.setLineDash([]);
  ctx.globalAlpha *= clamp(p * 3 - 2); ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(4, -22, 5.2, 0, TAU); ctx.fill();
  ctx.restore();
}
// A killer whale in silhouette, facing right, centred on (x, y); s ≈ length.
function orca(g, x, y, s, col, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.moveTo(50, 2); c.bezierCurveTo(50, -14, 30, -18, 4, -16); c.bezierCurveTo(-22, -14, -40, -6, -48, -1); c.lineTo(-48, 4); c.bezierCurveTo(-34, 10, -10, 15, 12, 15); c.bezierCurveTo(36, 15, 50, 12, 50, 2); c.fill();
  c.beginPath(); c.moveTo(-46, -1); c.quadraticCurveTo(-58, -12, -66, -8); c.quadraticCurveTo(-58, 0, -66, 9); c.quadraticCurveTo(-58, 10, -46, 4); c.fill();
  c.beginPath(); c.moveTo(-8, -14); c.lineTo(-2, -48); c.quadraticCurveTo(4, -30, 14, -15); c.fill();
  c.beginPath(); c.moveTo(14, 12); c.quadraticCurveTo(10, 24, 0, 28); c.quadraticCurveTo(6, 18, 4, 12); c.fill();
  c.fillStyle = PAL.ink; c.globalAlpha *= 0.9; c.beginPath(); c.ellipse(30, -6, 8, 3.4, -0.15, 0, TAU); c.fill(); c.beginPath(); c.ellipse(18, 9, 22, 4.5, 0.03, 0, TAU); c.fill();
  c.restore();
}
// A domestic cat in silhouette, facing right.
function cat(g, x, y, s, col, a = 1) {
  if (a <= 0) return; const c = g.ctx; c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.globalAlpha *= a; c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.ellipse(-4, 10, 30, 14, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(30, -6, 13, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(22, -14); c.lineTo(24, -30); c.lineTo(31, -17); c.fill(); c.beginPath(); c.moveTo(33, -17); c.lineTo(40, -29); c.lineTo(42, -12); c.fill();
  c.fillRect(-28, 14, 7, 28); c.fillRect(-14, 16, 7, 26); c.fillRect(10, 16, 7, 26); c.fillRect(20, 14, 7, 28);
  c.lineWidth = 6; c.beginPath(); c.moveTo(-32, 6); c.bezierCurveTo(-52, 0, -50, -26, -38, -34); c.stroke();
  c.fillStyle = PAL.bg; c.beginPath(); c.arc(35, -8, 2.4, 0, TAU); c.fill(); c.restore();
}

// US map (case file) ---------------------------------------------------------------
const D2R = Math.PI / 180;
const AL = (() => { const p1 = 29.5 * D2R, p2 = 45.5 * D2R, p0 = 23 * D2R; const n = (Math.sin(p1) + Math.sin(p2)) / 2, C = Math.cos(p1) ** 2 + 2 * n * Math.sin(p1); return { n, C, r0: Math.sqrt(C - 2 * n * Math.sin(p0)) / n, l0: -96 * D2R }; })();
const albers = (lon, lat) => { const r = Math.sqrt(AL.C - 2 * AL.n * Math.sin(lat * D2R)) / AL.n, th = AL.n * (lon * D2R - AL.l0); return [r * Math.sin(th), -(AL.r0 - r * Math.cos(th))]; };
const albersInv = (x, y) => { const yy = AL.r0 + y; const r = Math.hypot(x, yy), th = Math.atan2(x, yy); return [(AL.l0 + th / AL.n) / D2R, Math.asin((AL.C - r * r * AL.n * AL.n) / (2 * AL.n)) / D2R]; };
// Conterminous US outline (lon, lat), simplified; the border runs through the Great Lakes.
const US = [[-124.7, 48.4], [-123.2, 48.2], [-122.8, 48.9], [-122.75, 49.0], [-117, 49], [-110, 49], [-104, 49], [-97.2, 49], [-95.15, 49], [-95.15, 49.38], [-94.8, 49.3], [-94.6, 48.7], [-93.8, 48.5], [-93, 48.6], [-92, 48.35], [-91, 48.2], [-90, 48.1], [-89.6, 47.95],
  [-88.4, 48.3], [-86, 47.5], [-84.9, 46.9], [-84.5, 46.5], [-84.1, 46.2], [-83.5, 46], [-82.5, 45.3], [-82.2, 44], [-82.45, 43], [-82.5, 42.6], [-83.1, 42.3], [-83.1, 42], [-82.7, 41.7], [-81, 42.25], [-79.8, 42.5], [-78.9, 42.9], [-79.05, 43.25], [-78.5, 43.6], [-77, 43.7], [-76.4, 44.1], [-75.8, 44.4], [-74.7, 45], [-71.5, 45],
  [-71.1, 45.3], [-70.7, 45.4], [-70.3, 45.9], [-70, 46.7], [-69.2, 47.45], [-68.3, 47.35], [-67.8, 47.07], [-67.8, 45.7], [-67.2, 45.2], [-67, 44.8], [-68, 44.4], [-69, 44], [-70.2, 43.6], [-70.6, 43], [-70.8, 42.7], [-70.6, 42.3], [-70, 42.05], [-69.95, 41.7], [-70.6, 41.5], [-71.4, 41.45], [-72.5, 41.25], [-73.7, 40.9], [-74, 40.6],
  [-74, 40], [-74.4, 39.4], [-74.9, 38.95], [-75.05, 38.5], [-75.4, 37.9], [-75.9, 37.15], [-76, 36.9], [-75.7, 36.2], [-75.5, 35.25], [-76.2, 34.9], [-77, 34.6], [-77.9, 33.9], [-78.6, 33.85], [-79.2, 33.2], [-80, 32.6], [-80.9, 32.05], [-81.3, 31.3], [-81.45, 30.7], [-81.3, 29.9], [-80.9, 29], [-80.55, 28.45], [-80.1, 27],
  [-80.05, 26.5], [-80.2, 25.75], [-80.45, 25.2], [-81.1, 25.15], [-81.7, 25.9], [-81.9, 26.6], [-82.6, 27.5], [-82.7, 28.2], [-82.75, 29], [-83.4, 29.7], [-83.7, 30.05], [-84.3, 30.05], [-85, 29.65], [-85.4, 29.7], [-86, 30.3], [-86.5, 30.4], [-87.5, 30.3], [-88, 30.4], [-88.5, 30.35], [-89.4, 30.3], [-89.6, 30.15], [-89.4, 29.9],
  [-89.2, 29.2], [-89.4, 28.95], [-89.9, 29.3], [-90.5, 29.05], [-91.3, 29.25], [-92, 29.6], [-93, 29.75], [-93.85, 29.7], [-94.7, 29.35], [-95.6, 28.75], [-96.6, 28.1], [-97.2, 27.6], [-97.4, 26.9], [-97.15, 25.95], [-97.6, 26], [-98.2, 26.1], [-99.1, 26.45], [-99.5, 27.5], [-100.3, 28.3], [-100.65, 29.1], [-101.4, 29.77],
  [-102.3, 29.88], [-102.7, 29.4], [-103.1, 28.98], [-103.6, 29.2], [-104.4, 29.6], [-104.9, 30.4], [-105.6, 31.1], [-106.5, 31.78], [-108.2, 31.78], [-108.2, 31.33], [-111.07, 31.33], [-114.8, 32.49], [-114.72, 32.72], [-117.12, 32.53], [-117.25, 32.9], [-117.4, 33.25], [-118, 33.7], [-118.4, 33.75], [-118.5, 34.03],
  [-119.2, 34.15], [-119.7, 34.4], [-120.45, 34.45], [-120.65, 34.9], [-120.9, 35.45], [-121.3, 35.7], [-121.9, 36.3], [-121.9, 36.6], [-122.4, 37.2], [-122.5, 37.8], [-123, 38], [-123.1, 38.4], [-123.7, 38.95], [-123.8, 39.8], [-124.4, 40.4], [-124.1, 41], [-124.2, 41.75], [-124.4, 42.4], [-124.55, 42.85], [-124.1, 43.7],
  [-124, 44.6], [-123.95, 45.5], [-124, 46.25], [-124.1, 46.9], [-124.6, 47.9]];
const LAKES = [
  [[-92.1, 46.75], [-91, 46.9], [-90.4, 46.6], [-89.4, 46.85], [-88.4, 47.3], [-87.8, 47.45], [-87.4, 46.9], [-86.5, 46.45], [-85.5, 46.7], [-84.8, 46.6], [-84.6, 46.95], [-85, 47.6], [-86.2, 48.6], [-87.5, 48.8], [-88.6, 48.6], [-89.4, 48.05], [-90.6, 47.6], [-91.6, 47.1]],
  [[-87.55, 41.7], [-86.8, 41.75], [-86.25, 42.4], [-86.4, 43.4], [-86.25, 44.3], [-85.6, 45.2], [-84.9, 45.75], [-85.6, 46.05], [-86.6, 45.9], [-87.1, 45.4], [-87.6, 44.7], [-87.75, 43.7], [-87.9, 42.6]],
  [[-84.6, 45.85], [-83.5, 45.95], [-82.1, 45.95], [-81.4, 45.3], [-80.5, 45.6], [-80, 44.6], [-81.3, 44.9], [-81.7, 44], [-82.4, 43.05], [-82.6, 43.7], [-83.4, 43.95], [-83.9, 43.85], [-83.35, 44.6], [-83.4, 45.1], [-84.1, 45.6]],
  [[-83.45, 41.7], [-82.4, 41.45], [-81.3, 41.7], [-80.2, 42.1], [-79, 42.7], [-79.3, 42.85], [-80.4, 42.6], [-81.6, 42.55], [-82.5, 42.05], [-83.15, 41.98]],
  [[-79.8, 43.3], [-79, 43.25], [-77.6, 43.25], [-76.3, 43.5], [-76.2, 44.1], [-77.2, 43.95], [-78.5, 43.9], [-79.4, 43.65]],
];
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

Theater.chapter({
  id: 'kuhn', roman: 'V', title: 'Paradigms', color: COL,
  question: 'How does science change its mind?',
  casefile: { title: 'From vermin to keystone', sketch: 'wolf' },
  intro: { t: 'Chapter five. Paradigms, and how science changes its mind.' },
  scenes: [
    {
      id: 'kuhn-cycle', title: 'Normal science and revolution', register: 'claim',
      beats: [
        { t: 'In 1962, Thomas Kuhn described science not as a steady march of conjectures and refutations, but as long periods of normal science punctuated by revolutions.',
          cite: 'Kuhn 1962',
          v: 'A slowly turning wheel: NORMAL SCIENCE → ANOMALY → CRISIS → REVOLUTION → NEW NORMAL.' },
        { t: 'In normal science a community shares a paradigm: a disciplinary matrix of theories, methods, and values, anchored by exemplars, model solutions that students learn to imitate. Research is puzzle-solving within it. Anomalies are set aside, until they accumulate into a crisis.',
          cite: 'Kuhn 1970',
          v: 'Inside the NORMAL SCIENCE segment, puzzle pieces click into a frame; anomalies appear as hairline cracks, multiplying.' },
        { t: 'A revolution replaces the paradigm. Kuhn compared it to a gestalt switch: the same figure seen first as a duck, then as a rabbit. Rival paradigms can be incommensurable, disagreeing about which problems matter and what would count as a solution, so no neutral test decides between them.',
          v: 'The duck–rabbit figure flips; two frames side by side with mismatched rulers.' },
      ],
      terms: [
        { beat: 1.3, term: 'Paradigm (Kuhn)', def: 'A community’s shared disciplinary matrix of theory, methods, and values, anchored by exemplary problem solutions.' },
        { beat: 1.45, term: 'Exemplar', def: 'A concrete, model problem solution that students learn to imitate and that defines a paradigm in practice.' },
        { beat: 1.7, term: 'Normal science', def: 'Puzzle-solving research within an accepted paradigm, which sets aside anomalies rather than testing the paradigm itself.' },
        { beat: 2.3, term: 'Gestalt switch', def: 'Kuhn’s image for a paradigm change: the same data seen as a different whole, like the duck–rabbit figure.' },
        { beat: 2.6, term: 'Incommensurability', def: 'Rival paradigms lack a common measure: they differ in problems, standards, and meanings, so no neutral test decides.' },
      ],
      init() {
        const r = U.rng(501); const FX = 660, FY = 330, C = 130, NC = 5, NR = 3, PW = NC * C, PH = NR * C;
        const hT = [], vT = [];
        for (let j = 0; j < NR - 1; j++) hT.push(Array.from({ length: NC }, () => (r() < 0.5 ? 1 : -1)));
        for (let j = 0; j < NR; j++) vT.push(Array.from({ length: NC - 1 }, () => (r() < 0.5 ? 1 : -1)));
        const pieces = [];
        for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) pieces.push({ i, j, x: FX + i * C, y: FY + j * C, tabs: [j > 0 ? -hT[j - 1][i] : 0, i < NC - 1 ? vT[j][i] : 0, j < NR - 1 ? hT[j][i] : 0, i > 0 ? -vT[j][i - 1] : 0], spin: (r() - 0.5) * 1.6, vx: (r() - 0.5) * 220, lag: r() });
        const at = (i, j) => j * NC + i;
        const ex = [at(0, 0), at(3, 2)], im = [[0, at(1, 0)], [0, at(0, 1)], [1, at(2, 2)], [1, at(4, 2)]];
        const used = new Set([...ex, ...im.map((m) => m[1])]); const rest = pieces.map((_, k) => k).filter((k) => !used.has(k));
        for (let k = rest.length - 1; k > 0; k--) { const q = Math.floor(r() * (k + 1)); [rest[k], rest[q]] = [rest[q], rest[k]]; }
        // The paradigm's picture: what the completed puzzle is expected to show.
        const pic = Theater.makeCanvas(PW, PH); const pc = pic.getContext('2d'); const pg = Theater.makeG(pc);
        const sky = pc.createLinearGradient(0, 0, 0, PH); sky.addColorStop(0, '#1A2A48'); sky.addColorStop(0.62, '#223A55'); sky.addColorStop(1, '#14243A'); pc.fillStyle = sky; pc.fillRect(0, 0, PW, PH);
        pg.glow(PW * 0.74, PH * 0.27, 170, PAL.ochre, 0.5); pg.circle(PW * 0.74, PH * 0.27, 26, { fill: PAL.parchment, alpha: 0.95 });
        const ridge = (y0, amp, f, seed) => { const pts = []; for (let k = 0; k <= 80; k++) pts.push([k / 80 * PW, y0 - amp * (0.5 + 0.5 * U.noise1(k * f, seed))]); return pts; };
        const r1 = ridge(PH * 0.58, 120, 0.11, 4), r2 = ridge(PH * 0.8, 70, 0.19, 11);
        pg.poly([...r1, [PW, PH], [0, PH]], { fill: 'rgba(95,192,210,0.13)', color: null, w: 0, close: true }); pg.poly(r1, { color: PAL.lagoon, w: 2.6, alpha: 0.85 });
        pg.poly([...r2, [PW, PH], [0, PH]], { fill: 'rgba(156,199,126,0.14)', color: null, w: 0, close: true }); pg.poly(r2, { color: PAL.moss, w: 2.4, alpha: 0.8 });
        const riv = []; for (let k = 0; k <= 60; k++) { const u = k / 60; riv.push([PW * (0.04 + 0.92 * u), PH * (0.97 - 0.1 * u) + 12 * Math.sin(u * 10)]); }
        pg.poly(riv, { color: PAL.lagoon, w: 4.5, alpha: 0.85 });
        for (let k = 0; k < 16; k++) { const x = 24 + (k + r() * 0.8) / 16 * (PW - 48); const y0 = r2[Math.round(x / PW * 80)][1]; pg.icon('conifer', x, y0 + 10 + r() * 30, 26 + r() * 16, PAL.moss, { alpha: 0.85 }); }
        for (let k = 0; k < 5; k++) pg.icon('elk', PW * (0.2 + k * 0.07), PH * 0.86 + (k % 2) * 6, 22, PAL.sand, { alpha: 0.9, flip: k % 2 === 1 });
        const cracks = []; for (let k = 0; k < 10; k++) cracks.push(crack(r, FX + 60 + r() * (PW - 120), FY + 40 + r() * (PH - 80), r() * TAU, 160 + r() * 150, 2));
        // Beat 0: punctuated history (stylized): plateaus of normal science, abrupt revolutions.
        const stair = []; const plat = (x0, x1, y) => { for (let k = 0; k <= 20; k++) { const x = lerp(x0, x1, k / 20); stair.push([x, y + 0.007 * Math.sin(x * 48)]); } };
        plat(0, 0.31, 0.08); plat(0.335, 0.645, 0.45); plat(0.67, 1, 0.85);
        return { FX, FY, C, NC, NR, PW, PH, pieces, ex, im, rest, pic, cracks, stair };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx; const WX = 330, WY = 592; const { FX, FY, C, PW, PH } = D;
        const tMarch = cue(S, 0, 'not as a steady march'), tNS = cue(S, 0, 'long periods of normal'), tPun = cue(S, 0, 'punctuated by');
        const tCom = cue(S, 1, 'a community shares'), tMat = cue(S, 1, 'disciplinary matrix'), tEx = cue(S, 1, 'anchored by exemplars'), tIm = cue(S, 1, 'students learn to imitate'), tPz = cue(S, 1, 'Research is puzzle'), tAn = cue(S, 1, 'Anomalies are set aside'), tCr = cue(S, 1, 'until they accumulate');
        const tRev = S.b(2), tGe = cue(S, 2, 'gestalt switch'), tDuck = cue(S, 2, 'first as a duck'), tRab = cue(S, 2, 'then as a rabbit'), tRiv = cue(S, 2, 'Rival paradigms'), tPr = cue(S, 2, 'which problems matter'), tSol = cue(S, 2, 'what would count'), tNeu = cue(S, 2, 'no neutral test');
        const crackT = (k) => tAn + 0.5 + k * Math.max(0.25, (S.e(1) + 1.1 - tAn) / D.cracks.length);

        // ---- The wheel: a slow turn in beat 0, then one stage at a time.
        const pos = -1.4 * (1 - ease.inOut(S.span(0, 1))) + io(S, tAn + 0.4, 1.5) + io(S, tCr + 0.8, 1.5) + io(S, tRev + 0.1, 1.5) + io(S, tRab + 0.5, 1.5);
        drawWheel(g, WX, WY, { pos, t, prog: S.p(0, 2.4, 0.2) });
        // hub, beat 0
        g.withAlpha(S.p(0, 0.9, 0.7) * (1 - S.p(1, 0.6)), () => { caps(g, 'Thomas Kuhn', WX, WY - 30, { align: 'center', color: PAL.ink2 }); g.text('1962', WX, WY + 36, { size: 66, role: 'display', color: COL, align: 'center' }); });
        // hub, beat 1: the community, then the anomaly count
        const comA = S.tp(tCom, 0.8) * (1 - S.tp(tAn + 0.1, 0.5));
        g.withAlpha(comA, () => { [[-58, 0], [0, -12], [58, 0], [-30, 50], [30, 50]].forEach(([dx, dy], k) => bust(g, WX + dx, WY + dy + 10, 62, PAL.violet, 0.85 * S.tp(tCom + k * 0.12, 0.5))); caps(g, 'a community', WX, WY + 98, { align: 'center', color: PAL.violet }); });
        const nCr = D.cracks.reduce((n, _, k) => n + (t > crackT(k) ? 1 : 0), 0);
        g.withAlpha(S.tp(tAn + 0.3, 0.6) * (1 - S.tp(tRev, 0.5)), () => { g.text(String(nCr), WX, WY + 26, { size: 88, role: 'display', color: U.mix(PAL.ochre, PAL.coral, S.tp(tCr, 1.5)), align: 'center' }); caps(g, nCr === 1 ? 'anomaly' : 'anomalies', WX, WY + 70, { align: 'center', color: PAL.ink2 }); });

        // ---- Beat 0: a steady march versus long plateaus punctuated by revolutions.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const A = g.axes({ x: 700, y: 310, w: 580, h: 450, xlab: 'time', ylab: 'how the field sees the world', labSize: 22, progress: S.p(0, 1.0, 0.6) });
          caps(g, 'stylized', A.X(1), 286, { align: 'right', size: 15 });
          g.plot(A, (x) => 0.2 + 0.5 * x, { color: PAL.ink3, w: 2.6, dash: [9, 9], progress: S.tp(tMarch, 2.0) });
          g.text('a steady march', A.X(1), A.Y(0.5), { size: 22, italic: true, color: PAL.ink2, align: 'right', alpha: S.tp(tMarch + 1.0, 0.8) });
          const sp = clamp((t - tNS + 0.3) / 2.8);
          g.data(A, D.stair, { color: COL, w: 4.5, progress: sp });
          [[0.15, 0.08, 0.15], [0.45, 0.45, 0.5], [0.84, 0.85, 0.85]].forEach(([x, y, at]) => g.text('normal science', A.X(x), A.Y(y) - 20, { size: 21, color: COL, align: 'center', alpha: clamp((sp - at) * 5) }));
          [[0.32, 0.27, 0.36], [0.66, 0.66, 0.7]].forEach(([x, y, at], k) => {
            const on = clamp((sp - at) * 6); const fl = S.tp(tPun + 0.3 + k * 0.7, 0.8);
            g.glow(A.X(x), A.Y(y + 0.1), 60, PAL.rose, 0.5 * on * (0.4 + 0.6 * fl));
            g.text('revolution', A.X(x) + 18, A.Y(y), { size: 22, color: PAL.rose, alpha: on * fl });
          });
        });

        // ---- Beat 1: the paradigm as a puzzle frame; exemplars, imitation, puzzle-solving, anomalies.
        const pA = S.p(1, 0.8) * (1 - io(S, tRev + 1.6, 0.8));
        const crisis = S.tp(tCr, 1.6); const fall = (pc) => Math.max(0, t - (tRev + 0.3 + pc.lag * 0.7));
        if (pA > 0) g.withAlpha(pA, () => g.clip(80, 205, 1250, 710, () => {
          // callout from the segment under the pointer
          const e1 = -Math.PI / 2 + TAU / 10; const fo = 1 - S.tp(tRev, 0.6);
          g.line(WX + Math.cos(e1) * WR1, WY + Math.sin(e1) * WR1, FX - 12, FY - 12, { color: PAL.ink3, w: 1.2, dash: [4, 7], alpha: 0.8 * fo });
          g.line(WX + Math.cos(e1) * WR0, WY + Math.sin(e1) * WR0, FX - 12, FY + PH + 12, { color: PAL.ink3, w: 1.2, dash: [4, 7], alpha: 0.8 * fo });
          caps(g, 'the paradigm  ·  a disciplinary matrix', FX, 262, { color: COL, alpha: S.tp(tCom, 0.8) });
          [['theories', 'theories'], ['methods', 'methods'], ['values', 'values']].forEach(([w, ph], k) => g.pill(w, FX + k * 132, 298, { size: 21, color: PAL.ink, alpha: S.tp(cue(S, 1, ph) - 0.1, 0.5) * fo }));
          const frameCol = U.mix(COL, PAL.coral, crisis);
          g.rect(FX - 12, FY - 12, PW + 24, PH + 24, { r: 6, stroke: frameCol, w: 2.5, alpha: S.p(1, 0.8) * fo });
          g.rect(FX - 12, FY - 12, PW + 24, PH + 24, { r: 6, fill: U.rgba(frameCol, 0.05), alpha: S.p(1, 0.8) * fo });
          // the picture the paradigm expects, faintly, before any piece is placed
          g.withAlpha(0.14 * S.p(1, 1.2, 0.4) * fo, () => ctx.drawImage(D.pic, FX, FY));
          // empty slots
          ctx.save(); ctx.globalAlpha *= 0.3 * fo; ctx.strokeStyle = PAL.ink3; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]);
          for (const pc of D.pieces) { piecePath(ctx, pc.x, pc.y, C, C, pc.tabs); ctx.stroke(); } ctx.restore();
          // pieces: exemplars, then imitations, then the rest
          const t0 = new Array(D.pieces.length).fill(Infinity);
          D.ex.forEach((k, n) => { t0[k] = tEx + 0.2 + n * 0.45; });
          D.im.forEach(([, k], n) => { t0[k] = tIm + 0.7 + n * 0.4; });
          D.rest.forEach((k, n) => { t0[k] = tPz + 0.1 + n * 0.3; });
          D.pieces.forEach((pc, k) => {
            const u = (t - t0[k]) / 0.45; if (u <= 0) return;
            const drop = (1 - ease.outBack(u)) * -70; const fa = fall(pc); const dy = drop + 520 * fa * fa, dx = pc.vx * fa, rot = pc.spin * fa;
            const al = clamp(u * 3) * (1 - clamp(fa / 1.5)); if (al <= 0) return;
            const cx = pc.x + C / 2, cy = pc.y + C / 2; const isEx = D.ex.includes(k);
            ctx.save(); ctx.globalAlpha *= al; ctx.translate(cx + dx, cy + dy); ctx.rotate(rot); ctx.translate(-cx, -cy);
            piecePath(ctx, pc.x, pc.y, C, C, pc.tabs); ctx.save(); ctx.clip(); ctx.drawImage(D.pic, FX, FY); ctx.restore();
            ctx.strokeStyle = isEx ? COL : U.rgba(PAL.ink, 0.55); ctx.lineWidth = isEx ? 3.4 : 1.4; ctx.stroke();
            if (isEx) { g.glow(pc.x + 24, pc.y + 24, 30, PAL.parchment, 0.6); g.text('★', pc.x + 24, pc.y + 32, { size: 24, color: PAL.parchment, align: 'center', alpha: clamp(u) }); }
            ctx.restore();
            const land = clamp(1 - Math.abs(u - 1.1) / 0.6); if (land > 0 && fa === 0) g.glow(cx, cy, 70, COL, 0.35 * land);
          });
          // imitation arrows
          D.im.forEach(([e, k], n) => { const a = D.pieces[D.ex[e]], b = D.pieces[k]; g.carrow(a.x + C / 2, a.y + C / 2, b.x + C / 2, b.y + C / 2, 0.35, { color: PAL.parchment, w: 2, dash: [5, 5], head: 12, progress: S.tp(tIm + n * 0.4, 0.7), alpha: 0.9 * (1 - S.tp(tPz + 1.2, 0.8)) }); });
          g.withAlpha(S.tp(tEx + 0.4, 0.8) * (1 - S.tp(tAn - 0.3, 0.5)), () => { caps(g, '★ exemplars', FX, FY + PH + 62, { color: PAL.parchment }); g.text('model solutions, imitated', FX, FY + PH + 94, { size: 22, color: PAL.ink2, alpha: S.tp(tIm, 0.8) }); });
          // anomalies: misfit pieces are set aside
          const TX = 1080, TY = 772; const trayA = S.tp(tAn, 0.6) * (1 - S.tp(tRev, 0.6));
          g.rect(TX, TY, 200, 116, { r: 8, stroke: PAL.ink3, w: 1.5, dash: [6, 6], alpha: trayA }); caps(g, 'set aside', TX + 100, TY - 12, { align: 'center', color: PAL.ochre, alpha: trayA });
          for (let k = 0; k < 3; k++) {
            const ta = tAn + 0.15 + k * 0.5; const u = (t - ta) / 0.5; if (u <= 0) continue;
            const mv = io(S, ta + 0.9, 0.8); const hx = 800 + k * 125, hy = FY + PH + 88; const sx = TX + 50 + k * 50, sy = TY + 60;
            const s = lerp(0.72, 0.42, mv), x = lerp(hx, sx, mv), y = lerp(hy, sy, mv) + (1 - ease.out(u)) * 40, rot = (1 - mv) * 0.12 * Math.sin((t - ta) * 14) + mv * (k - 1) * 0.2;
            const w = C * s; ctx.save(); ctx.globalAlpha *= clamp(u * 2) * trayA; ctx.translate(x, y); ctx.rotate(rot);
            piecePath(ctx, -w / 2, -w / 2, w, w, [1, 1, -1, 1]); ctx.fillStyle = U.rgba(PAL.ochre, 0.28); ctx.fill(); ctx.strokeStyle = PAL.ochre; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
          }
          // cracks multiply
          const cCol = U.mix(PAL.snow, PAL.coral, crisis); const cA = 1 - S.tp(tRev + 0.1, 0.4);
          if (cA > 0) g.withAlpha(cA, () => g.clip(FX, FY, PW, PH, () => D.cracks.forEach((c, k) => drawCrack(g, c, clamp((t - crackT(k)) / 0.8), cCol))));
          if (crisis > 0) g.glow(FX + PW / 2, FY + PH / 2, 360, PAL.coral, 0.12 * crisis * cA);
        }));

        // ---- Beat 2: the gestalt switch, then incommensurable frames.
        const flip = (() => { if (t < tRab) return 0; const k = t - tRab; if (k < 3) return ease.inOut(k / 0.5); const ph = (k - 3) / 2.3, n = Math.floor(ph), f = ease.inOut(clamp((ph - n) / 0.22)); return n % 2 === 0 ? 1 - f : f; })();
        const drA = S.tp(tGe - 0.5, 0.5);
        if (drA > 0) {
          const mv = io(S, tRiv - 0.1, 1.4); const fx = lerp(960, WX, mv), fy = lerp(560, WY, mv), fs = lerp(2.55, 1.0, mv);
          const duck = S.tp(tDuck, 0.5) * (1 - flip), rab = flip;
          duckRabbit(g, fx, fy, fs, { progress: S.tp(tGe - 0.5, 1.6), duck, rabbit: rab, alpha: drA });
          const ly = fy + 110 * fs; const ls = lerp(44, 28, mv);
          g.text('duck', fx, ly, { size: ls, role: 'display', italic: true, color: PAL.ochre, align: 'center', alpha: duck });
          g.text('rabbit', fx, ly, { size: ls, role: 'display', italic: true, color: PAL.rose, align: 'center', alpha: rab });
          g.withAlpha(drA * (1 - mv), () => caps(g, 'one figure, two ways of seeing', 960, 262, { align: 'center', color: PAL.ink2 }));
        }
        const iA = S.tp(tRiv + 0.7, 0.9);
        if (iA > 0) g.withAlpha(iA, () => {
          const F = [{ x: 660, col: COL, name: 'old paradigm', hi: [0, 4, 7], ok: [0, 7], log: false }, { x: 1000, col: PAL.mint, name: 'new paradigm', hi: [2, 3, 8], ok: [2, 8], log: true }];
          const fyy = 330, fw = 260, fh = 240, cw = fw / 3, chh = fh / 3;
          const st = io(S, tNeu - 0.3, 1.3);
          F.forEach((f, fi) => {
            caps(g, f.name, f.x, 312, { color: f.col });
            g.rect(f.x, fyy, fw, fh, { r: 5, stroke: f.col, w: 2.4, fill: U.rgba(f.col, 0.05) });
            for (let k = 1; k < 3; k++) { g.line(f.x + k * cw, fyy + 8, f.x + k * cw, fyy + fh - 8, { color: PAL.rule, w: 1 }); g.line(f.x + 8, fyy + k * chh, f.x + fw - 8, fyy + k * chh, { color: PAL.rule, w: 1 }); }
            f.hi.forEach((c, n) => { const a = S.tp(tPr + 0.2 + n * 0.25 + fi * 0.12, 0.5); const cx = f.x + (c % 3) * cw, cy = fyy + Math.floor(c / 3) * chh; g.rect(cx + 7, cy + 7, cw - 14, chh - 14, { r: 4, fill: U.rgba(f.col, 0.32), alpha: a }); });
            f.ok.forEach((c, n) => { const a = S.tp(tSol + 0.2 + n * 0.3 + fi * 0.15, 0.6); const cx = f.x + (c % 3 + 0.5) * cw, cy = fyy + (Math.floor(c / 3) + 0.5) * chh; g.poly([[cx - 16, cy + 1], [cx - 4, cy + 13], [cx + 18, cy - 14]], { color: PAL.ink, w: 4.5, progress: a }); });
            // each frame's own ruler; at "no neutral test" they slide together and fail to line up
            const rx = lerp(f.x, 760, st), ry = lerp(fyy + fh + 40, 724 + fi * 64, st), rw = lerp(fw, 400, st);
            g.line(rx, ry, rx + rw, ry, { color: f.col, w: 2.2 });
            const ticks = f.log ? [1, 2, 3, 5, 10, 20, 30, 50, 100].map((v) => [Math.log10(v) / 2, [1, 10, 100].includes(v) ? String(v) : '']) : Array.from({ length: 11 }, (_, k) => [k / 10, k % 5 === 0 ? String(k) : '']);
            ticks.forEach(([u, lab]) => { const x = rx + u * rw; g.line(x, ry, x, ry - (lab ? 14 : 8), { color: f.col, w: 1.8 }); if (lab) g.text(lab, x, ry + 24, { size: 19, role: 'mono', color: f.col, align: 'center' }); });
          });
          g.text('≠', 960, 470, { size: 66, role: 'display', color: PAL.ink2, align: 'center', alpha: S.tp(tRiv + 1.2, 0.8) });
          g.withAlpha(S.tp(tPr, 0.6) * (1 - st), () => { g.rect(660, 652, 18, 18, { r: 3, fill: U.rgba(PAL.ink, 0.35) }); g.text('problems that matter', 690, 668, { size: 21, color: PAL.ink2 }); });
          g.withAlpha(S.tp(tSol, 0.6) * (1 - st), () => { g.poly([[1000, 662], [1007, 670], [1020, 655]], { color: PAL.ink, w: 3 }); g.text('counts as a solution', 1030, 668, { size: 21, color: PAL.ink2 }); });
          if (st > 0) {
            const u = 0.5 + 0.36 * Math.sin((t - tNeu) * 1.1); const px = 760 + u * 400;
            g.line(px, 690, px, 830, { color: PAL.ink, w: 1.6, dash: [5, 5], alpha: st });
            g.text((u * 10).toFixed(1), px + 10, 702, { size: 21, role: 'mono', color: COL, alpha: st });
            g.text(Math.pow(10, 2 * u).toFixed(0), px + 10, 850, { size: 21, role: 'mono', color: PAL.mint, alpha: st });
            g.text('?', 1215, 800, { size: 72, role: 'display', color: PAL.ink, align: 'center', alpha: S.tp(tNeu + 0.8, 0.8) });
            g.text('no neutral test', 960, 898, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tNeu + 0.5, 0.9) });
          }
        });
      },
    },
    {
      id: 'kuhn-vermin', title: 'Case file: from vermin to keystone', register: 'claim',
      beats: [
        { t: 'For the first half of the twentieth century, killing predators was normal practice, carried out by government hunters across the American West. By 1994, wolves in the lower forty-eight states survived only around the northern Great Lakes and near Glacier National Park.',
          cite: 'Wilmers et al. 2025',
          v: 'Case-file card (wolf). A map of the conterminous US whose wolf range contracts to a few fragments.' },
        { t: 'Leopold’s own reversal reads like a gestalt switch. In “Thinking Like a Mountain,” he describes watching a fierce green fire die in the eyes of a wolf he had shot, and realizing that the mountain saw the wolf differently than he did.',
          cite: 'Leopold 1949',
          v: 'Line drawing of a mountain slope; a faint green glow fades; the view rotates to the mountain’s perspective.' },
        { t: 'A new program grew around top-down control, with its own exemplars: killer whales, sea otters, urchins, and kelp; ecological meltdown on predator-free islands in a Venezuelan reservoir; songbirds lost to mesopredators once coyotes disappeared. Yellowstone became the textbook case.',
          cite: 'Estes et al. 1998; Terborgh et al. 2001; Crooks & Soulé 1999',
          v: 'Exemplar gallery as framed plates: otter–urchin–kelp, island canopy collapse, coyote–cat–songbird; Yellowstone plate framed in gold.' },
        { t: 'Normal science followed, extending the pattern to willow, cottonwood, and other parks. So did anomalies, which we meet in the chapters ahead. Did ecology then undergo a revolution, or absorb its anomalies as context? Kuhn gives you the tools to decide.',
          cite: 'Ripple & Beschta 2003, 2006, 2012; Peterson et al. 2014',
          v: 'Kuhn wheel returns with the cascade paradigm in NORMAL SCIENCE; cracks labelled with chapter numbers where each anomaly will appear.' },
      ],
      terms: [
        { beat: 2.6, term: 'Mesopredator release', def: 'An increase in mid-sized predators after apex predators decline, through reduced predation or competition.' },
      ],
      init() {
        const r = U.rng(5150);
        // --- map: Albers projection fitted to the box
        const P = US.map(([lo, la]) => albers(lo, la)); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; P.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        const BX = 440, BY = 272, BW = 860, BH = 570; const sc = Math.min(BW / (x1 - x0), BH / (y1 - y0)); const ox = BX + (BW - (x1 - x0) * sc) / 2 - x0 * sc, oy = BY + (BH - (y1 - y0) * sc) / 2 - y0 * sc;
        const toS = ([x, y]) => [ox + x * sc, oy + y * sc]; const ll2s = (lo, la) => toS(albers(lo, la)); const s2ll = (x, y) => albersInv((x - ox) / sc, (y - oy) / sc);
        const outline = P.map(toS); const lakes = LAKES.map((L) => L.map(([lo, la]) => ll2s(lo, la)));
        const frags = [[-93.2, 47.7, 2.5, 1.15, 0], [-89.3, 46.3, 1.4, 0.5, 0], [-113.9, 48.55, 0.8, 0.45, 1]];
        const dots = []; const sp = 15; let row = 0;
        for (let y = BY; y < BY + BH; y += sp * 0.866, row++) for (let x = BX + (row % 2) * sp / 2; x < BX + BW; x += sp) {
          if (!inPoly(x, y, outline) || lakes.some((L) => inPoly(x, y, L))) continue;
          const [lo, la] = s2ll(x, y); const fr = frags.findIndex(([fl, fa, rl, ra]) => ((lo - fl) / rl) ** 2 + ((la - fa) / ra) ** 2 < 1);
          dots.push({ x, y, lo, la, keep: fr >= 0 ? frags[fr][4] + 1 : 0, n: r(), wn: U.noise2(x * 0.011, y * 0.011, 7) });
        }
        // make sure the Glacier holdout shows at least two dots
        const gc = ll2s(-113.9, 48.55); if (dots.filter((d) => d.keep === 2).length < 2) dots.slice().sort((a, b) => Math.hypot(a.x - gc[0], a.y - gc[1]) - Math.hypot(b.x - gc[0], b.y - gc[1])).slice(0, 2).forEach((d) => { d.keep = 2; });
        // government hunters across the West (farthest-point spread)
        const west = dots.filter((d) => d.lo < -103 && d.lo > -121 && d.la > 33 && d.la < 47.5 && !d.keep); const hunters = [west[Math.floor(r() * west.length)]];
        while (hunters.length < 9) { let best = null, bd = -1; for (const d of west) { const m = Math.min(...hunters.map((h) => Math.hypot(h.x - d.x, h.y - d.y))); if (m > bd) { bd = m; best = d; } } hunters.push(best); }
        dots.forEach((d) => { if (d.lo > -97) { d.east = true; d.u = clamp((-67 - d.lo) / 30); } else { let bk = 0, bdd = 1e9; hunters.forEach((h, k) => { const dd = Math.hypot(h.x - d.x, h.y - d.y); if (dd < bdd) { bdd = dd; bk = k; } }); d.hk = bk; d.hd = bdd; } });
        const hmax = hunters.map((_, k) => Math.max(1, ...dots.filter((d) => d.hk === k).map((d) => d.hd)));
        // former range: faint rings, pre-rendered
        const ghost = Theater.makeCanvas(1920, 1080 - 0); const gx = ghost.getContext('2d'); gx.strokeStyle = 'rgba(124,120,147,0.55)'; gx.lineWidth = 1; gx.beginPath(); dots.forEach((d) => { gx.moveTo(d.x + 3, d.y); gx.arc(d.x, d.y, 3, 0, TAU); }); gx.stroke();
        // --- Leopold's mountain (line work)
        const ridgeY = (x) => (x < 1110 ? 790 - (x - 440) / 670 * 470 : 320 + (x - 1110) / 180 * 110);
        const ridge = []; for (let k = 0; k <= 120; k++) { const x = 440 + k / 120 * 850; ridge.push([x, ridgeY(x) + 16 * U.noise1(k * 0.3, 21) + (Math.abs(x - 610) < 26 ? -6 : 0)]); }
        const far = []; for (let k = 0; k <= 60; k++) { const u = k / 60, x = 440 + u * 470; far.push([x, 612 - 190 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.62) + 40 * Math.max(0, u - 0.8) / 0.2 + 12 * U.noise1(k * 0.3, 5)]); }
        const hatch = []; for (let k = 0; k < 90; k++) { const x = 470 + r() * 800; const yt = ridgeY(x) + 30 + r() * (840 - ridgeY(x) - 40); if (yt > 830) continue; const L = 14 + r() * 22; hatch.push([x, yt, x - L * 0.8, yt + L * 0.45]); }
        const river = []; for (let k = 0; k <= 60; k++) { const u = k / 60; river.push([440 + u * 850, 868 - 30 * u + 9 * Math.sin(u * 11)]); }
        // --- exemplar gallery: herbivore dots on the island plate, cats on the coyote plate
        const islandBugs = Array.from({ length: 12 }, () => [r(), r()]);
        // --- the returning wheel's cracks, one per chapter where an anomaly appears
        const tags = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI'], angs = [-168, -140, -112, -68, -40, -12].map((a) => a * D2R);
        const wcr = angs.map((a) => crack(r, Math.cos(a) * (WR1 - 2), Math.sin(a) * (WR1 - 2), a + Math.PI + (r() - 0.5) * 0.3, 120, 1));
        return { outline, lakes, dots, hunters, hmax, ghost, gc, mn: ll2s(-92.6, 47.6), wi: ll2s(-89.3, 46.3), ridge, far, hatch, river, islandBugs, tags, angs, wcr };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        g.casefile(96, 226, 270, 156, { title: 'From vermin to keystone', no: 'V', sketch: 'wolf', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });

        // ---- Beat 0: the wolf range contracts.
        const tK = cue(S, 0, 'killing predators'), tH = cue(S, 0, 'government hunters'), tB = cue(S, 0, 'By 1994'), tSv = cue(S, 0, 'survived only'), tGL = cue(S, 0, 'northern Great Lakes'), tGN = cue(S, 0, 'Glacier National');
        const mA = vis(S, 0, 1);
        if (mA > 0) g.withAlpha(mA, () => {
          g.poly(D.outline, { color: PAL.ink3, w: 1.6, fill: U.rgba(PAL.ink, 0.035), close: true, progress: S.p(0, 1.6, 0.1) });
          D.lakes.forEach((L) => g.poly(L, { fill: U.rgba(PAL.lagoon, 0.3), color: PAL.lagoon, w: 1, close: true, alpha: S.p(0, 1, 1.0) }));
          const dead0 = S.tp(tK, 1.0); if (dead0 > 0) g.withAlpha(dead0, () => ctx.drawImage(D.ghost, 0, 0));
          const hT = (k) => tH + 0.15 + k * Math.max(0.2, (tB + 0.8 - tH) / 9);
          const B = [[], [], [], [], []];
          for (const d of D.dots) {
            const app = clamp((t - S.b(0) - 0.4 - (d.x - 440) / 850 * 1.0) / 0.6); if (app <= 0) continue;
            let die = Infinity;
            if (!d.keep) {
              die = tK + 0.3 + Math.pow(clamp((-67 - d.lo) / 58 + 0.1 * d.wn), 0.85) * Math.max(1, tSv - tK - 0.8) + 0.35 * d.n;
              if (!d.east && d.hd < 120) die = Math.min(die, hT(d.hk) + 0.15 + d.hd / 120 * 1.3 + 0.2 * d.n);
            }
            const al = app * (1 - clamp((t - die) / 0.6)); if (al <= 0.02) continue;
            B[Math.min(4, Math.floor((1 - al) * 5))].push(d);
          }
          B.forEach((list, bi) => { if (!list.length) return; ctx.save(); ctx.globalAlpha *= 1 - bi * 0.2; ctx.fillStyle = PAL.coral; ctx.beginPath(); for (const d of list) { const rr = d.keep && t > tSv ? 4.6 : 4.1; ctx.moveTo(d.x + rr, d.y); ctx.arc(d.x, d.y, rr, 0, TAU); } ctx.fill(); ctx.restore(); });
          D.hunters.forEach((h, k) => { const a = S.tp(hT(k), 0.4) * (1 - S.tp(tSv + 0.5, 0.8)); if (a <= 0) return; g.circle(h.x, h.y, 10, { stroke: PAL.violet, w: 2.2, alpha: a }); g.line(h.x - 15, h.y, h.x + 15, h.y, { color: PAL.violet, w: 2, alpha: a }); g.line(h.x, h.y - 15, h.x, h.y + 15, { color: PAL.violet, w: 2, alpha: a }); });
          // holdouts
          const gl = S.tp(tGL - 0.3, 0.8), gn = S.tp(tGN - 0.3, 0.8);
          g.glow(D.mn[0], D.mn[1], 90, PAL.coral, 0.45 * gl); g.glow(D.gc[0], D.gc[1], 50, PAL.coral, 0.6 * gn);
          g.line(D.mn[0] + 30, D.mn[1] - 26, D.mn[0] + 70, D.mn[1] - 64, { color: PAL.coral, w: 1.6, alpha: gl });
          g.text('northern Great Lakes', D.mn[0] + 76, D.mn[1] - 68, { size: 22, color: PAL.ink, alpha: gl });
          g.line(D.gc[0], D.gc[1] - 12, D.gc[0] + 30, D.gc[1] - 60, { color: PAL.coral, w: 1.6, alpha: gn });
          g.text('near Glacier National Park', D.gc[0] + 6, D.gc[1] - 68, { size: 22, color: PAL.ink, alpha: gn });
          caps(g, 'stylized', 1290, 830, { align: 'right', size: 15, alpha: S.p(0, 1, 1.5) });
          // legend, left column
          g.withAlpha(S.p(0, 0.8, 1.2), () => { g.circle(112, 446, 7, { fill: PAL.coral }); g.text('Wolf range', 132, 454, { size: 23, color: PAL.ink }); });
          g.withAlpha(S.tp(tK + 0.5, 0.8), () => { g.circle(112, 484, 5, { stroke: PAL.ink3, w: 1.5 }); g.text('Former range', 132, 492, { size: 23, color: PAL.ink2 }); });
          g.withAlpha(S.tp(tK - 0.6, 0.8), () => { caps(g, 'normal practice', 104, 566, { color: COL }); g.text('predators as vermin', 104, 598, { size: 23, color: PAL.ink }); });
          g.withAlpha(S.tp(tH, 0.8), () => { g.circle(113, 642, 8, { stroke: PAL.violet, w: 2 }); g.line(101, 642, 125, 642, { color: PAL.violet, w: 1.8 }); g.line(113, 630, 113, 654, { color: PAL.violet, w: 1.8 }); g.text('Government hunters', 136, 650, { size: 23, color: PAL.ink }); });
          g.withAlpha(S.tp(tB, 0.8), () => { g.text('1994', 104, 770, { size: 76, role: 'display', color: PAL.coral }); g.wrap('wolves hold on in two places', 104, 808, 280, { size: 22, color: PAL.ink2, lh: 1.3, alpha: S.tp(tSv, 0.8) }); });
        });

        // ---- Beat 1: Leopold's mountain.
        const tTL = cue(S, 1, 'In “Thinking'), tGF = cue(S, 1, 'fierce green fire'), tDie = cue(S, 1, 'die in the eyes'), tMt = cue(S, 1, 'realizing that the mountain');
        const lA = vis(S, 1, 2);
        if (lA > 0) g.withAlpha(lA, () => {
          g.withAlpha(S.tp(tTL, 0.9), () => { g.wrap('“Thinking Like a Mountain”', 104, 452, 270, { size: 34, role: 'display', italic: true, color: PAL.ink, lh: 1.15 }); });
          g.withAlpha(S.p(1, 0.9, 0.3), () => { caps(g, 'a gestalt switch', 104, 580, { color: COL }); g.wrap('the same wolf, seen from a new vantage', 104, 614, 270, { size: 22, color: PAL.ink2, lh: 1.3 }); });
          g.withAlpha(S.p(1, 0.8, 1.8), () => { g.line(104, 724, 150, 724, { color: PAL.violet, w: 2, dash: [6, 6] }); g.text('the hunter’s view', 164, 732, { size: 22, color: PAL.violet }); });
          g.withAlpha(S.tp(tMt + 0.6, 1.0), () => { g.poly([[127, 768], [104, 808], [150, 808]], { fill: U.rgba(PAL.moss, 0.3), color: PAL.moss, w: 1.4, close: true }); g.text('the mountain’s view', 164, 798, { size: 22, color: PAL.moss }); });
          const rot = io(S, tMt, 2.2); const PX = 860, PY = 560;
          g.clip(400, 215, 930, 700, () => g.with(() => {
            ctx.translate(PX, PY); ctx.rotate(-0.06 * rot); ctx.scale(1 + 0.03 * rot, 1 + 0.03 * rot); ctx.translate(-PX, -PY);
            g.poly(D.far, { color: PAL.ink3, w: 1.4, alpha: 0.5, progress: S.p(1, 2.0, 0.1) });
            g.poly(D.ridge, { color: PAL.ink2, w: 2.4, progress: S.p(1, 2.0) });
            D.hatch.forEach(([xa, ya, xb, yb], k) => g.line(xa, ya, xb, yb, { color: PAL.ink3, w: 1.2, alpha: 0.4 * S.p(1, 0.6, 0.8 + k * 0.012) }));
            g.poly(D.river, { color: PAL.lagoon, w: 3, alpha: 0.75, progress: S.p(1, 1.6, 0.6) });
            // Leopold on the rimrock
            const LX = 610, LY = D.ridge[Math.round((LX - 440) / 850 * 120)][1] - 4; const la = S.p(1, 0.7, 1.0);
            g.withAlpha(la, () => { g.circle(LX, LY - 50, 7, { fill: PAL.violet }); g.line(LX, LY - 42, LX, LY - 16, { color: PAL.violet, w: 4 }); g.line(LX, LY - 16, LX - 7, LY, { color: PAL.violet, w: 3.5 }); g.line(LX, LY - 16, LX + 7, LY, { color: PAL.violet, w: 3.5 }); g.line(LX, LY - 34, LX + 26, LY - 22, { color: PAL.violet, w: 2.5 }); caps(g, 'Leopold', LX, LY - 72, { align: 'center', color: PAL.violet }); });
            const WX2 = 935, WY2 = 792; const shot = S.tp(tDie + 0.6, 1.6);
            g.icon('wolf', WX2, WY2 + 4 * shot, 84, U.mix(PAL.coral, PAL.ink3, shot * 0.7), { flip: true, alpha: S.tp(tGF - 0.6, 0.8) * (1 - 0.35 * shot) });
            const fire = S.tp(tGF, 0.6) * (1 - S.tp(tDie + 0.3, 2.4)); const ex = WX2 - 42, ey = WY2 - 14;
            g.glow(ex, ey, 46, '#7CF29A', 0.9 * fire); g.glow(ex, ey, 14, '#C8FFD2', fire); g.glow(ex, ey, 110, '#7CF29A', 0.25 * fire);
            // the hunter's line of sight
            const hv = S.p(1, 0.8, 1.6) * (1 - 0.6 * rot);
            g.line(LX + 8, LY - 50, ex, ey, { color: PAL.violet, w: 1.8, dash: [6, 7], alpha: 0.85 * hv, progress: S.p(1, 1.2, 1.6) });
            // the mountain's view: the whole slope, the wolf within it
            const mv = S.tp(tMt + 0.6, 1.4); const SX = 1110, SY = D.ridge[Math.round((1110 - 440) / 850 * 120)][1];
            if (mv > 0) {
              const gr = ctx.createLinearGradient(0, SY, 0, 900); gr.addColorStop(0, U.rgba(PAL.moss, 0.16 * mv)); gr.addColorStop(1, U.rgba(PAL.moss, 0)); g.poly([[SX, SY + 10], [470, 900], [1290, 900]], { fill: gr, color: null, w: 0, close: true });
              g.line(SX, SY + 10, 470, 880, { color: PAL.moss, w: 1.4, dash: [4, 8], alpha: 0.7 * mv }); g.line(SX, SY + 10, 1290, 880, { color: PAL.moss, w: 1.4, dash: [4, 8], alpha: 0.7 * mv });
              g.ellipse(SX, SY + 26, 26, 11, { stroke: PAL.moss, w: 2.4, alpha: mv }); g.circle(SX, SY + 26, 6, { fill: PAL.moss, alpha: mv }); g.glow(SX, SY + 26, 60, PAL.moss, 0.4 * mv);
            }
          }));
        });

        // ---- Beat 2: the exemplar gallery.
        const tNP = S.b(2), tEx = cue(S, 2, 'its own exemplars'), tKW = cue(S, 2, 'killer whales'), tIs = cue(S, 2, 'ecological meltdown'), tSB = cue(S, 2, 'songbirds lost'), tYS = cue(S, 2, 'Yellowstone became');
        const gA = vis(S, 2, 3);
        if (gA > 0) g.withAlpha(gA, () => {
          g.withAlpha(S.tp(tNP + 0.2, 0.8), () => {
            caps(g, 'a new program', 104, 446, { color: COL }); g.text('Top-down control', 104, 488, { size: 34, role: 'display', color: PAL.ink });
            [['wolf', PAL.coral, 'predators'], ['elk', PAL.sand, 'herbivores'], ['aspen', PAL.moss, 'plants']].forEach(([ic, col, lab], k) => {
              const y = 560 + k * 100, a = S.tp(tNP + 0.6 + k * 0.35, 0.6); g.icon(ic, 140, y, 58, col, { alpha: a }); g.text(lab, 196, y + 8, { size: 22, color: PAL.ink2, alpha: a });
              if (k < 2) g.arrow(140, y + 34, 140, y + 68, { color: PAL.ink3, w: 2, head: 11, alpha: a });
            });
          });
          caps(g, 'exemplars', 440, 262, { color: PAL.ink2, alpha: S.tp(tEx, 0.8) });
          const plate = (x, y, w, h, t0, gold, title, chain, bg) => {
            const a = S.tp(t0 - 0.2, 0.7); if (a <= 0) return; const lift = (1 - ease.out(clamp((t - t0 + 0.2) / 0.7))) * 24;
            g.withAlpha(a, () => g.with(() => {
              ctx.translate(0, lift);
              if (gold) { const gl = S.tp(t0 + 0.4, 1.2); g.glow(x + w / 2, y + h / 2, 300, PAL.ochre, 0.18 * gl); }
              g.rect(x, y, w, h, { r: 4, fill: 'rgba(22,19,40,0.82)', stroke: gold ? PAL.ochre : PAL.ink3, w: gold ? 3 : 1.5 });
              g.rect(x + 9, y + 9, w - 18, h - 18, { r: 2, stroke: gold ? U.rgba(PAL.ochre, 0.7) : PAL.rule, w: gold ? 1.6 : 1 });
              if (bg) bg(x, y, w, h);
              const n = chain.length; const cy = y + 128;
              chain.forEach(([kind, col, up, gone], k) => {
                const cx = x + w * (n === 4 ? 0.15 + k * 0.233 : 0.2 + k * 0.3); const ak = S.tp(t0 + 0.2 + k * 0.25, 0.5), tr = S.tp(t0 + 1.0 + k * 0.35, 0.5);
                if (k < n - 1) { const nx = x + w * (n === 4 ? 0.15 + (k + 1) * 0.233 : 0.2 + (k + 1) * 0.3); g.withAlpha(S.tp(t0 + 0.4 + k * 0.25, 0.5), () => g.arrowHead((cx + nx) / 2 + 7, cy, 0, 14, PAL.ink2)); }
                const icA = ak * (gone ? 1 - 0.55 * tr : 1); const sz = { orca: 70, otter: 54, urchin: 40, kelp: 58, bug: 42, cat: 60 }[kind] || 60;
                if (kind === 'orca') orca(g, cx, cy, sz, col, icA); else if (kind === 'cat') cat(g, cx, cy, sz, col, icA); else g.icon(kind, cx, cy, sz, col, { alpha: icA, sway: Math.sin(t * 1.3 + k) * 0.4 });
                if (gone) g.line(cx - 30, cy + 26, cx + 30, cy - 26, { color: PAL.coral, w: 3, alpha: tr });
                trend(g, cx, cy + 62, up, up ? col : PAL.ink3, tr);
              });
              g.text(title, x + w / 2, y + h - 30, { size: 22, color: gold ? PAL.ochre : PAL.ink, align: 'center', weight: gold ? 600 : 400 });
            }));
          };
          const water = (x, y, w, h) => { g.rect(x + 10, y + 64, w - 20, h - 140, { fill: U.rgba(PAL.lagoon, 0.08) }); const pts = []; for (let k = 0; k <= 40; k++) pts.push([x + 10 + k / 40 * (w - 20), y + 64 + 3 * Math.sin(k * 0.9 + t * 1.5)]); g.poly(pts, { color: PAL.lagoon, w: 1.6, alpha: 0.7 }); };
          const island = (x, y, w, h) => { g.ellipse(x + w / 2, y + 150, w * 0.44, 74, { fill: U.rgba(PAL.lagoon, 0.08), stroke: U.rgba(PAL.lagoon, 0.6), w: 1.4 }); g.ellipse(x + w / 2, y + 152, w * 0.36, 52, { fill: U.rgba(PAL.moss, 0.05), stroke: U.rgba(PAL.moss, 0.35), w: 1 });
            const a = S.tp(tIs + 1.2, 1.2); D.islandBugs.forEach(([u, v], k) => { if (k / 12 < a) g.circle(x + w * (0.28 + 0.44 * u), y + 108 + 70 * v, 3.5, { fill: PAL.sand, alpha: 0.8 }); }); };
          const scrub = (x, y, w, h) => { [[0.3, 0.42, 0.24, 0.2], [0.72, 0.46, 0.22, 0.17]].forEach(([u, v, rx, ry]) => g.ellipse(x + w * u, y + h * v, w * rx, h * ry, { fill: U.rgba(PAL.moss, 0.05), stroke: U.rgba(PAL.moss, 0.3), w: 1.2, dash: [5, 6] })); };
          const peaks = (x, y, w, h) => { const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; pts.push([x + 14 + u * (w - 28), y + 70 - 38 * Math.abs(Math.sin(u * Math.PI * 2.2)) * (0.6 + 0.4 * Math.sin(u * 7))]); } g.poly(pts, { color: U.rgba(PAL.ochre, 0.45), w: 1.4 }); };
          [[440, 285, tKW], [880, 285, tIs], [440, 600, tSB], [880, 600, tYS]].forEach(([x, y, t0], k) => g.rect(x, y, 410, 290, { r: 4, stroke: PAL.ink3, w: 1.3, dash: [7, 7], alpha: 0.7 * S.p(2, 0.8, 0.8 + k * 0.2) * (1 - S.tp(t0 - 0.2, 0.5)) }));
          plate(440, 285, 410, 290, tKW, false, 'Orcas, otters, urchins, kelp', [['orca', PAL.coral, true], ['otter', PAL.clay, false], ['urchin', PAL.sand, true], ['kelp', PAL.moss, false]], water);
          plate(880, 285, 410, 290, tIs, false, 'Predator-free islands, Venezuela', [['puma', PAL.coral, false, true], ['bug', PAL.sand, true], ['tree', PAL.moss, false]], island);
          plate(440, 600, 410, 290, tSB, false, 'Coyotes, cats, songbirds', [['coyote', PAL.coral, false, true], ['cat', PAL.clay, true], ['songbird', PAL.sand, false]], scrub);
          plate(880, 600, 410, 290, tYS, true, 'Yellowstone: the textbook case', [['wolf', PAL.coral, true], ['elk', PAL.sand, false], ['aspen', PAL.moss, true]], peaks);
          caps(g, 'mesopredator release', 645, 640 + (1 - S.tp(tSB + 1.6, 0.6)) * 0, { align: 'center', color: PAL.clay, alpha: S.tp(tSB + 1.6, 0.8) });
        });

        // ---- Beat 3: the wheel returns, cracked where each anomaly will appear.
        const tExt = cue(S, 3, 'extending the pattern'), tAnm = cue(S, 3, 'So did anomalies'), tQ = cue(S, 3, 'Did ecology'), tAb = cue(S, 3, 'or absorb'), tKu = cue(S, 3, 'Kuhn gives you');
        const wA = S.p(3, 0.9);
        if (wA > 0) g.withAlpha(wA, () => {
          const WX = 600, WY = 598;
          const wob = S.tp(tQ, 0.8) * (1 - S.tp(tKu + 0.8, 1.0)) * 0.22 * Math.sin((t - tQ) * 2.6);
          drawWheel(g, WX, WY, { pos: wob, t, prog: S.p(3, 1.6) });
          // hub: the cascade paradigm
          g.withAlpha(S.p(3, 0.8, 0.8), () => {
            [['wolf', PAL.coral], ['elk', PAL.sand], ['aspen', PAL.moss]].forEach(([ic, col], k) => { const y = WY - 80 + k * 56; g.icon(ic, WX, y, ic === 'aspen' ? 46 : 52, col); if (k < 2) g.arrow(WX + 40, y + 6, WX + 40, y + 44, { color: PAL.ink3, w: 1.6, head: 9 }); });
            caps(g, 'trophic cascade', WX, WY + 92, { align: 'center', ls: 1.6, color: PAL.ink2 });
          });
          // cracks with chapter tags
          D.wcr.forEach((c, k) => {
            const tk = tAnm + 0.4 + k * 0.42; const p = clamp((t - tk) / 0.7); if (p <= 0) return;
            g.with(() => { ctx.translate(WX, WY); drawCrack(g, c, p, PAL.coral, 2); });
            const a = D.angs[k]; const tx = WX + Math.cos(a) * (WR1 + 46), ty = WY + Math.sin(a) * (WR1 + 46);
            g.pill(D.tags[k], tx, ty, { size: 18, color: PAL.coral, align: 'center', alpha: S.tp(tk + 0.3, 0.5), role: 'mono' });
          });
          // right panel: normal science extends the pattern, then anomalies ahead
          const RX = 900;
          g.withAlpha(S.tp(tExt - 0.4, 0.8), () => caps(g, 'normal science follows', RX, 262, { color: COL }));
          [['willow', PAL.moss, 'Willow', 'willow'], ['tree', PAL.moss, 'Cottonwood', 'cottonwood'], ['map', PAL.ink2, 'Other parks', 'other parks']].forEach(([ic, col, lab, ph], k) => {
            const a = S.tp(cue(S, 3, ph) - 0.1, 0.6); const y = 318 + k * 62; g.icon(ic, RX + 22, y, 44, col, { alpha: a }); g.text(lab, RX + 62, y + 8, { size: 24, color: PAL.ink, alpha: a });
          });
          g.withAlpha(S.tp(tAnm, 0.8), () => caps(g, 'anomalies ahead', RX, 528, { color: PAL.coral }));
          ['Observation', 'Models', 'Causality', 'Underdetermination', 'Bayesian evidence', 'Replication'].forEach((nm, k) => {
            const a = S.tp(tAnm + 0.7 + k * 0.42, 0.5); const y = 570 + k * 40; g.text(D.tags[k], RX + 34, y, { size: 21, role: 'mono', color: PAL.coral, align: 'right', alpha: a }); g.text(nm, RX + 52, y, { size: 22, color: PAL.ink2, alpha: a });
          });
          // the open question
          const q1 = S.tp(tQ, 0.7), q2 = S.tp(tAb, 0.7), kq = S.tp(tKu, 1.0);
          g.pill('revolution?', WX - 18, 878, { size: 22, color: PAL.rose, align: 'right', alpha: q1 });
          g.pill('anomalies absorbed as context?', WX + 18, 878, { size: 22, color: COL, align: 'left', alpha: q2 });
          if (kq > 0) g.glow(WX, WY, 330, COL, 0.12 * kq * (0.75 + 0.25 * Math.sin((t - tKu) * 2)));
        });
      },
    },
    {
      id: 'kuhn-choice', title: 'Choosing between theories', register: 'claim',
      beats: [
        { t: 'If there is no neutral test, is theory choice irrational? Kuhn said no. Scientists share values: accuracy, consistency, scope, simplicity, and fruitfulness. But they weigh them differently, so the values guide judgment without dictating it.',
          cite: 'Kuhn 1977',
          v: 'Five sliders labelled with the values; two scientists set them differently and reach different choices.' },
        { t: 'Critics pushed both ways. Lakatos thought programs could be ranked objectively by their progress. Paul Feyerabend argued that every rule of method has been broken by some great scientist, so the only universal rule is “anything goes.” Larry Laudan judged traditions by their success at solving problems.',
          s: 'Critics pushed both ways. Lak-a-tosh thought programs could be ranked objectively by their progress. Paul Fire-ah-bent argued that every rule of method has been broken by some great scientist, so the only universal rule is “anything goes.” Larry Laudan judged traditions by their success at solving problems.',
          cite: 'Lakatos 1970; Feyerabend 1975; Laudan 1977',
          v: 'Three portraits as labelled silhouettes, each with a one-line badge.' },
        { t: 'Ecology has its own candidate revolution, from the balance of nature to non-equilibrium and patch dynamics.',
          cite: 'Wu & Loucks 1995',
          v: 'A balanced scale morphs into a shifting patch mosaic; two labelled cards: PARADIGM (KUHN) and PARADIGM (RESEARCH TRADITION).' },
      ],
      terms: [
        { beat: 0.5, term: 'Theory-choice values', def: 'Kuhn’s shared criteria of accuracy, consistency, scope, simplicity, and fruitfulness, weighed differently by different scientists.' },
        { beat: 1.45, term: 'Epistemological anarchism', def: 'Feyerabend’s thesis that no fixed methodological rule holds across the history of science: “anything goes.”' },
      ],
      init() {
        const r = U.rng(5303);
        // patch mosaic: a jittered grid of quadrilaterals, each with its own successional clock
        const NX = 9, NY = 7, X0 = 790, Y0 = 330, W = 500, H = 450; const V = [];
        for (let j = 0; j <= NY; j++) { V.push([]); for (let i = 0; i <= NX; i++) { const edge = i === 0 || j === 0 || i === NX || j === NY; V[j].push([X0 + i / NX * W + (edge && (i === 0 || i === NX) ? 0 : (r() - 0.5) * 34), Y0 + j / NY * H + (edge && (j === 0 || j === NY) ? 0 : (r() - 0.5) * 34)]); } }
        const patches = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) patches.push({ pts: [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]], ph: r(), rate: 0.07 + r() * 0.08, cx: X0 + (i + 0.5) / NX * W, cy: Y0 + (j + 0.5) / NY * H });
        return { patches };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        const VALS = ['Accuracy', 'Consistency', 'Scope', 'Simplicity', 'Fruitfulness'];
        const PH = ['accuracy', 'consistency', 'scope', 'simplicity', 'fruitfulness'];
        const KA = [0.88, 0.5, 0.22, 0.84, 0.3], KB = [0.3, 0.56, 0.88, 0.24, 0.86], FAV = ['T1', '=', 'T2', 'T1', 'T2'];
        const tIr = cue(S, 0, 'is theory choice'), tSh = cue(S, 0, 'Scientists share values'), tWe = cue(S, 0, 'But they weigh'), tGu = cue(S, 0, 'so the values guide'), tDi = cue(S, 0, 'without dictating');
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          // two theories, no neutral test between them
          const cards = [[430, 'Theory 1', PAL.ochre], [770, 'Theory 2', COL]];
          const ch = S.tp(tGu + 0.4, 0.9); const cy = lerp(520, 772, io(S, tSh - 0.3, 1.1));
          cards.forEach(([x, nm, col], k) => { const a = S.tp(tIr - 0.3 + k * 0.25, 0.7); g.rect(x, cy, 220, 84, { r: 6, fill: U.rgba(PAL.ink, 0.06), stroke: U.mix(PAL.ink3, col, ch), w: 1.6 + 1.4 * ch, alpha: a }); g.text(nm, x + 110, cy + 54, { size: 34, role: 'display', color: PAL.ink, align: 'center', alpha: a }); if (ch > 0) g.glow(x + 110, cy + 42, 120, col, 0.18 * ch); });
          g.text('?', 710, cy + 60, { size: 60, role: 'display', color: PAL.ink2, align: 'center', alpha: S.tp(tIr + 0.6, 0.6) * (1 - ch) });
          caps(g, 'no neutral test', 710, cy - 40, { align: 'center', color: PAL.ink2, alpha: S.tp(S.b(0) + 0.3, 0.8) * (1 - S.tp(tSh - 0.4, 0.5)) });
          // the shared values
          caps(g, 'shared values', 330, 296, { alpha: S.tp(tSh, 0.6) }); caps(g, 'illustrative', 1010, 296, { align: 'right', size: 15, alpha: S.tp(tWe, 0.6) });
          const slide = io(S, tWe + 0.6, 1.4);
          VALS.forEach((v, k) => {
            const y = 352 + k * 78, a = S.tp(cue(S, 0, PH[k]) - 0.15, 0.5); if (a <= 0) return;
            g.text(v, 520, y + 9, { size: 27, color: PAL.ink, align: 'right', alpha: a });
            g.line(550, y, 910, y, { color: PAL.ink3, w: 2.2, alpha: a, progress: a }); for (let q = 0; q <= 4; q++) g.line(550 + q * 90, y - 6, 550 + q * 90, y + 6, { color: PAL.ink3, w: 1.4, alpha: 0.6 * a });
            const xa = 550 + 360 * lerp(0.5, KA[k], slide), xb = 550 + 360 * lerp(0.5, KB[k], slide);
            g.circle(xa, y - 10, 12, { fill: PAL.ochre, alpha: a }); g.circle(xb, y + 10, 12, { fill: COL, alpha: a });
            const fa = S.tp(tWe + 0.2 + k * 0.18, 0.5); const fc = FAV[k] === 'T1' ? PAL.ochre : FAV[k] === 'T2' ? COL : PAL.ink3;
            g.pill(FAV[k] === '=' ? 'tie' : 'favours ' + FAV[k], 940, y, { size: 19, color: fc, alpha: fa * a });
          });
          // two scientists
          [[175, 'Scientist A', PAL.ochre], [1220, 'Scientist B', COL]].forEach(([x, nm, col], k) => {
            const a = S.tp(tSh + 0.3 + k * 0.3, 0.7); bust(g, x, 560, 130, PAL.violet, a); g.circle(x, 560 - 86, 34, { stroke: col, w: 3, alpha: a });
            g.text(nm, x, 600, { size: 23, color: col, align: 'center', alpha: a, weight: 600 });
          });
          g.carrow(190, 636, 422, 812, 0.32, { color: PAL.ochre, w: 3, head: 14, progress: ch });
          g.carrow(1205, 636, 998, 812, -0.32, { color: COL, w: 3, head: 14, progress: S.tp(tGu + 0.7, 0.9) });
          g.withAlpha(S.tp(tDi, 0.8), () => caps(g, 'same values, different choices', 710, 742, { align: 'center', color: PAL.ink2 }));
        });

        // ---- Beat 1: three critics.
        const tPu = S.b(1), tLk = cue(S, 1, 'Lakatos thought'), tFy = cue(S, 1, 'Paul Feyerabend'), tBr = cue(S, 1, 'has been broken'), tAG = cue(S, 1, 'anything goes'), tLd = cue(S, 1, 'Larry Laudan'), tSo = cue(S, 1, 'success at solving');
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const SY = 832, SX0 = 170, SX1 = 1250; const sx = (u) => lerp(SX0, SX1, u);
          const sa = S.p(1, 0.8);
          g.line(SX0, SY, SX1, SY, { color: PAL.ink3, w: 2, alpha: sa });
          g.circle(sx(0.5), SY, 9, { fill: COL, alpha: sa }); g.text('Kuhn', sx(0.5), SY + 34, { size: 22, color: COL, align: 'center', alpha: sa, weight: 600 });
          const pb = S.p(1, 1.0, 0.8);
          g.arrow(sx(0.47), SY - 18, sx(0.08), SY - 18, { color: PAL.ink2, w: 2.2, head: 13, progress: pb }); g.arrow(sx(0.53), SY - 18, sx(0.92), SY - 18, { color: PAL.ink2, w: 2.2, head: 13, progress: pb });
          caps(g, 'rules that rank theories', SX0, SY - 34, { alpha: pb }); caps(g, 'no fixed rules', SX1, SY - 34, { align: 'right', alpha: pb });
          const people = [
            { x: 300, t0: tLk, name: 'Imre Lakatos', badge: 'rank programs by progress', u: 0.1, col: PAL.ochre, emb: 'bars' },
            { x: 710, t0: tFy, name: 'Paul Feyerabend', badge: '“anything goes”', u: 0.92, col: PAL.rose, emb: 'ruler', tb: tAG },
            { x: 1120, t0: tLd, name: 'Larry Laudan', badge: 'success at solving problems', u: 0.27, col: PAL.mint, emb: 'checks', tb: tSo },
          ];
          people.forEach((p, k) => {
            const a = S.tp(p.t0 - 0.2, 0.8); if (a <= 0) return; const cy = 420, R = 104;
            g.withAlpha(a, () => {
              g.circle(p.x, cy, R, { fill: U.rgba(PAL.violet, 0.1), stroke: PAL.violet, w: 2.4 });
              g.with(() => { ctx.beginPath(); ctx.arc(p.x, cy, R - 3, 0, TAU); ctx.clip();
                bust(g, p.x - 4, cy + R + 4, 176, U.rgba(PAL.violet, 0.75));
                if (k === 0) { g.circle(p.x - 17, cy - 38, 9, { stroke: PAL.bg, w: 2.5 }); g.circle(p.x + 9, cy - 38, 9, { stroke: PAL.bg, w: 2.5 }); }
              });
              // emblem
              const ex = p.x + 76, ey = cy + 72; g.circle(ex, ey, 34, { fill: PAL.panel, stroke: p.col, w: 2.4 });
              if (p.emb === 'bars') [0, 1, 2].forEach((q) => g.rect(ex - 18 + q * 13, ey + 16 - (10 + q * 10) * S.tp(p.t0 + 0.6 + q * 0.2, 0.5), 9, (10 + q * 10) * S.tp(p.t0 + 0.6 + q * 0.2, 0.5), { fill: p.col }));
              if (p.emb === 'ruler') { const br = S.tp(tBr, 0.6); [-1, 1].forEach((sd) => g.with(() => { ctx.translate(ex + sd * (3 + 5 * br), ey); ctx.rotate(sd * 0.35 * br); g.rect(sd < 0 ? -22 : 0, -6, 22, 12, { stroke: p.col, w: 2 }); for (let q = 1; q < 4; q++) g.line((sd < 0 ? -22 : 0) + q * 5.5, -6, (sd < 0 ? -22 : 0) + q * 5.5, -1, { color: p.col, w: 1.4 }); })); }
              if (p.emb === 'checks') [0, 1, 2].forEach((q) => g.poly([[ex - 20 + q * 14, ey], [ex - 15 + q * 14, ey + 7], [ex - 7 + q * 14, ey - 9]], { color: p.col, w: 2.6, progress: S.tp(p.t0 + 0.8 + q * 0.25, 0.4) }));
              g.text(p.name, p.x, cy + R + 64, { size: 36, role: 'display', color: PAL.ink, align: 'center' });
            });
            g.pill(p.badge, p.x, cy + R + 108, { size: 22, color: p.col, align: 'center', alpha: S.tp((p.tb || p.t0 + 1.2) - 0.1, 0.7) });
            const ma = S.tp(p.t0 + 0.5, 0.7); g.circle(sx(p.u), SY, 8, { fill: p.col, alpha: ma }); g.text(p.name.split(' ')[1], sx(p.u), SY + 34, { size: 21, color: p.col, align: 'center', alpha: ma });
          });
        });

        // ---- Beat 2: balance of nature → patch dynamics.
        const tBal = cue(S, 2, 'from the balance'), tNon = cue(S, 2, 'to non-equilibrium');
        const a2 = S.p(2, 0.8);
        if (a2 > 0) g.withAlpha(a2, () => {
          caps(g, 'a candidate revolution', 705, 262, { align: 'center', color: COL });
          // the balance
          const bA = S.p(2, 0.9, 0.3); const BX = 400, BY = 520; const tilt = 0.16 * Math.sin((t - tNon) * 2.2) * S.tp(tNon, 0.8) * (1 - 0.3 * S.tp(tNon + 2, 1));
          g.withAlpha(bA * (1 - 0.55 * S.tp(tNon + 0.6, 1.0)), () => {
            caps(g, 'balance of nature', BX, 410, { align: 'center', color: PAL.ink2, alpha: 0.5 + 0.5 * S.tp(tBal - 0.2, 0.6) });
            g.poly([[BX, BY], [BX - 46, 780], [BX + 46, 780]], { color: PAL.ink2, w: 2.4, fill: U.rgba(PAL.ink, 0.05), close: true }); g.line(BX - 120, 780, BX + 120, 780, { color: PAL.ink3, w: 2 });
            const c = Math.cos(tilt), s = Math.sin(tilt);
            [[-1, 'wolf', PAL.coral], [1, 'elk', PAL.sand]].forEach(([sd, ic, col]) => {
              const ex = BX + sd * 210 * c, ey = BY + sd * 210 * s; g.line(ex, ey, ex - 54, ey + 120, { color: PAL.ink3, w: 1.4 }); g.line(ex, ey, ex + 54, ey + 120, { color: PAL.ink3, w: 1.4 });
              g.poly([[ex - 70, ey + 120], [ex + 70, ey + 120], [ex + 50, ey + 138], [ex - 50, ey + 138]], { color: PAL.ink2, w: 2, close: true, fill: U.rgba(PAL.ink, 0.05) });
              g.icon(ic, ex, ey + 92, 62, col, { flip: sd > 0 });
            });
            g.line(BX - 210 * c, BY - 210 * s, BX + 210 * c, BY + 210 * s, { color: PAL.ink, w: 4 }); g.circle(BX, BY, 7, { fill: PAL.ink });
          });
          g.arrow(650, 560, 760, 560, { color: COL, w: 3, head: 16, progress: S.tp(tNon - 0.2, 0.8) });
          // the patch mosaic: disturbance resets patches, succession regrows them
          const mA = S.tp(tNon, 0.6);
          if (mA > 0) {
            caps(g, 'non-equilibrium  ·  patch dynamics', 1040, 300, { align: 'center', color: PAL.ink2, alpha: mA });
            const stages = [PAL.sand, '#C9C98A', PAL.moss, '#6E9E5B'];
            D.patches.forEach((p) => {
              const ap = S.tp(tNon + (p.cx - 790) / 500 * 0.9, 0.5); if (ap <= 0) return;
              const s = ((p.ph + (t - tNon) * p.rate) % 1 + 1) % 1; const k = Math.floor(s * 4); const col = U.mix(stages[k], stages[Math.min(3, k + 1)], (s * 4 - k));
              g.poly(p.pts, { fill: U.rgba(col, 0.55), color: PAL.bg, w: 2, close: true, alpha: ap * mA });
              if (s > 0.97 || s < 0.04) g.glow(p.cx, p.cy, 50, PAL.ochre, 0.5 * mA);
            });
          }
        });
      },
    },
  ],
});
})();
