/* Chapter IX — Underdetermination. Case file: one decline, many causes. */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;
const COL = PAL.sand;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken: located in the beat's timed sentences (spoken
// text first, then caption) and interpolated by character position; falls back to the whole beat.
const missing = new Set();
const cue = (S, k, phrase) => {
  const tb = S.scene.timing && S.scene.timing.beats[k]; const b = S.scene.beats[k];
  if (tb && tb.sents) {
    const sp = b.s ? Theater.splitSentences(b.s) : null;
    for (const list of [sp && sp.length === tb.sents.length ? sp : null, tb.sents.map((s) => s.cap)]) {
      if (list) for (let j = 0; j < list.length; j++) { const i = list[j].indexOf(phrase); if (i >= 0) { const s = tb.sents[j]; return s.start + (s.end - s.start) * i / Math.max(1, list[j].length); } }
    }
  }
  const i = b.t.indexOf(phrase);
  if (i < 0 && !missing.has(phrase)) { missing.add(phrase); console.warn('cue not found: ' + phrase); }
  return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length);
};
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
// Rounded card with a caps title and wrapped body text.
const card = (g, x, y, w, h, title, body, col, a = 1, hi = 0) => {
  if (a <= 0) return;
  g.withAlpha(a, () => {
    if (hi > 0) g.glow(x + w / 2, y + h / 2, w * 0.6, col, 0.18 * hi);
    g.rect(x, y, w, h, { r: 8, fill: U.rgba(col, 0.07 + 0.08 * hi), stroke: U.rgba(col, 0.45 + 0.5 * hi), w: 1.6 + hi });
    caps(g, title, x + 20, y + 34, { color: col });
    g.wrap(body, x + 20, y + 70, w - 40, { size: 23, color: PAL.ink, lh: 1.32 });
  });
};
// Marching-squares contour of f at level L on a w×h grid (used once, offscreen).
const SEGS = { 1: [['L', 'B']], 2: [['B', 'R']], 3: [['L', 'R']], 4: [['T', 'R']], 5: [['L', 'T'], ['B', 'R']], 6: [['T', 'B']], 7: [['L', 'T']], 8: [['L', 'T']], 9: [['T', 'B']], 10: [['T', 'R'], ['L', 'B']], 11: [['T', 'R']], 12: [['L', 'R']], 13: [['B', 'R']], 14: [['L', 'B']] };
const contour = (c, f, w, h, st, L) => {
  c.beginPath();
  for (let y = 0; y < h; y += st) for (let x = 0; x < w; x += st) {
    const a = f(x, y), b = f(x + st, y), d = f(x + st, y + st), e = f(x, y + st);
    const code = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (d > L ? 2 : 0) | (e > L ? 1 : 0); if (code === 0 || code === 15) continue;
    const ip = (p, q) => (L - p) / (q - p);
    const P = { T: [x + st * ip(a, b), y], R: [x + st, y + st * ip(b, d)], B: [x + st * ip(e, d), y + st], L: [x, y + st * ip(a, e)] };
    for (const [p, q] of SEGS[code]) { c.moveTo(P[p][0], P[p][1]); c.lineTo(P[q][0], P[q][1]); }
  }
  c.stroke();
};
// A small gear (the "machines" that make a pattern).
const gear = (g, x, y, r, rot, col, a = 1) => {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot);
  c.beginPath(); const n = 8; for (let k = 0; k < 4 * n; k++) { const ang = (k + 0.5) * Math.PI / (2 * n); const rr = Math.floor(k / 2) % 2 === 0 ? r * 1.3 : r; c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
  c.closePath(); c.strokeStyle = col; c.lineWidth = 2.2; c.lineJoin = 'round'; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.38, 0, Math.PI * 2); c.stroke(); c.restore();
};
// A person glyph (hunters, management): head and shoulders.
const person = (g, x, y, s, col, a = 1) => {
  g.circle(x, y - s * 0.28, s * 0.17, { fill: col, alpha: a });
  g.with(() => { const c = g.ctx; c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x - s * 0.3, y + s * 0.42); c.quadraticCurveTo(x - s * 0.3, y - s * 0.06, x, y - s * 0.06); c.quadraticCurveTo(x + s * 0.3, y - s * 0.06, x + s * 0.3, y + s * 0.42); c.closePath(); c.fill(); });
};
// A pointing hand (fingertip at x, y; pointing left).
const hand = (g, x, y, s, a = 1) => {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s / 100, s / 100);
  c.fillStyle = PAL.parchment; c.strokeStyle = PAL.bg; c.lineWidth = 4; c.lineJoin = 'round';
  const rr = (x0, y0, w, h, r) => { c.beginPath(); c.roundRect(x0, y0, w, h, r); c.fill(); c.stroke(); };
  rr(38, -22, 58, 58, 16); rr(30, 8, 34, 15, 7.5); rr(33, 21, 31, 15, 7.5); rr(0, -9, 64, 19, 9.5); rr(50, -33, 32, 15, 7.5);
  c.fillStyle = PAL.ink3; c.fillRect(94, -25, 12, 64); c.restore();
};
// A crown (the single winner multimodel inference declines to crown).
const crown = (g, x, y, s, col, a = 1) => {
  if (a <= 0) return; g.poly([[x - s / 2, y + s * 0.3], [x - s / 2, y - s * 0.3], [x - s / 4, y], [x, y - s * 0.42], [x + s / 4, y], [x + s / 2, y - s * 0.3], [x + s / 2, y + s * 0.3]], { fill: col, color: col, w: 1.5, close: true, alpha: a });
};
// A sun glyph (drought).
const sun = (g, x, y, s, col, a = 1) => {
  g.circle(x, y, s * 0.22, { fill: col, alpha: a });
  for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4; g.line(x + Math.cos(ang) * s * 0.32, y + Math.sin(ang) * s * 0.32, x + Math.cos(ang) * s * 0.46, y + Math.sin(ang) * s * 0.46, { color: col, w: 3, alpha: a }); }
};

Theater.chapter({
  id: 'under', roman: 'IX', title: 'Underdetermination', color: COL,
  question: 'What if the evidence fits more than one theory?',
  casefile: { title: 'One decline, many causes', sketch: 'elk' },
  intro: { t: 'Chapter nine. Underdetermination: when evidence fits more than one theory.' },
  scenes: [
    {
      id: 'under-holism', title: 'One body of evidence, many theories', register: 'infer',
      beats: [
        { t: 'Any finite set of points can be threaded by infinitely many curves. Underdetermination is the general form of that fact: evidence alone may not fix which theory is true. Duhem and Quine’s holism makes it worse, because auxiliary assumptions can always be adjusted.',
          s: 'Any finite set of points can be threaded by infinitely many curves. Underdetermination is the general form of that fact: evidence alone may not fix which theory is true. Doo-em and Quine’s holism makes it worse, because auxiliary assumptions can always be adjusted.',
          v: 'Seven data points; curves of every kind thread through them, one after another.' },
        { t: 'Philosophers distinguish transient underdetermination, which better data or designs can resolve, from strong underdetermination, in which rival theories are empirically equivalent forever. Most of what ecologists face is the transient kind, though it can last a long time.',
          v: 'A new data point lands and eliminates most curves (transient); a pair of curves that coincide everywhere remains (strong).' },
        { t: 'Hydrologists call it equifinality: many parameter sets fit the same record. Ecologists know it as the pattern–process problem. As the first film showed, neutral and niche models can produce the same species-abundance distribution.',
          cite: 'Beven & Freer 2001; Levin 1992',
          v: 'A likelihood surface with a long flat ridge; then a rank-abundance curve produced by two different machines.' },
      ],
      init() {
        // Seven points on a gentle curve g0; every rival adds a term that vanishes at all seven x.
        const x0 = 0.08, dx = 0.14; const xs = []; for (let i = 0; i < 7; i++) xs.push(x0 + i * dx);
        const g0 = (x) => 0.24 + 0.52 * Math.exp(-2.1 * x) + 0.07 * Math.sin(4.2 * x + 0.6);
        const Wm = (m) => (x) => Math.sin(m * Math.PI * (x - x0) / dx);
        const pts = xs.map((x) => [x, g0(x)]);
        const sample = (f) => { const a = []; for (let k = 0; k <= 240; k++) { const x = 0.02 + 0.96 * k / 240; a.push([x, f(x)]); } return a; };
        const stair = [[0.02, pts[0][1]]]; for (let i = 0; i < 6; i++) { const xm = x0 + (i + 0.5) * dx; stair.push([xm, pts[i][1]], [xm, pts[i + 1][1]]); } stair.push([0.98, pts[6][1]]);
        const stairF = (x) => pts[Math.max(0, Math.min(6, Math.round((x - x0) / dx)))][1];
        const P1 = x0 + 3.5 * dx, P2 = x0 + 5.25 * dx;
        const defs = [
          [(x) => g0(x) + 0.075 * Wm(1)(x), PAL.heather],
          [(x) => g0(x) - 0.06 * Wm(2)(x), PAL.lagoon],
          [stairF, PAL.rose, stair],
          [g0, COL],
          [(x) => g0(x) + 0.13 * Wm(1)(x) * (0.25 + x), PAL.mint],
          [(x) => g0(x) + 0.04 * Wm(3)(x), PAL.ochre],
          [(x) => g0(x) - 0.17 * Wm(1)(x) * Math.exp(-Math.pow((x - 0.3) / 0.25, 2)), PAL.violet],
          [(x) => g0(x) + 0.1 * Wm(2)(x) * x, PAL.clay],
        ];
        const curves = defs.map(([f, col, arr], j) => ({ f, col, arr: arr || sample(f), main: f === g0, miss1: Math.abs(f(P1) - g0(P1)) > 0.012, miss2: Math.abs(f(P2) - g0(P2)) > 0.012, j }));
        const rain = [0.15, 0.29, 0.43, 0.71, 0.88, 0.97].map((x) => [x, g0(x)]);
        // Likelihood surface with a long, nearly flat ridge (pre-rendered once).
        const SW = 400, SH = 280; const surf = Theater.makeCanvas(SW, SH); const c = surf.getContext('2d');
        const ridge = (u) => 0.84 - 0.66 * u + 0.1 * Math.sin(3.4 * u);
        const Lf = (u, v) => Math.exp(-Math.pow((v - ridge(u)) / 0.075, 2) / 2) * (0.84 + 0.16 * Math.exp(-Math.pow((u - 0.52) / 0.45, 2)));
        const stops = [[0, [21, 19, 39]], [0.3, [44, 38, 76]], [0.6, [116, 100, 86]], [0.85, [205, 183, 140]], [1, [244, 232, 200]]];
        const ramp = (v) => { for (let k = 1; k < stops.length; k++) if (v <= stops[k][0]) { const [a0, c0] = stops[k - 1], [a1, c1] = stops[k]; const f = (v - a0) / (a1 - a0); return c0.map((q, i) => q + (c1[i] - q) * f); } return stops[stops.length - 1][1]; };
        const img = c.createImageData(SW, SH);
        for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const col = ramp(Lf((i + 0.5) / SW, 1 - (j + 0.5) / SH)); const o = (j * SW + i) * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
        c.putImageData(img, 0, 0);
        c.strokeStyle = 'rgba(14,13,26,0.55)'; c.lineWidth = 1.2;
        for (const L of [0.15, 0.35, 0.55, 0.75]) contour(c, (x, y) => Lf(x / SW, 1 - y / SH), SW, SH, 4, L);
        const ridgePts = [0.13, 0.32, 0.5, 0.68, 0.87].map((u) => [u, ridge(u)]);
        // A storm hydrograph: one observed record, five near-identical fits.
        const q = (s) => 0.1 + 0.78 * (s > 0.16 ? ((s - 0.16) / 0.08) * Math.exp(1 - (s - 0.16) / 0.08) : 0) + 0.3 * (s > 0.55 ? ((s - 0.55) / 0.07) * Math.exp(1 - (s - 0.55) / 0.07) : 0);
        const r = U.rng(909); const obs = []; for (let k = 0; k < 26; k++) { const s = (k + 0.5) / 26; obs.push([s, q(s) + (r() - 0.5) * 0.05]); }
        const runs = ridgePts.map((_, k) => (s) => q(s) + 0.025 * Math.sin(s * (8 + 2 * k) + k * 1.3));
        // Rank-abundance curve (log scale).
        const ra = []; for (let k = 1; k <= 19; k++) ra.push([k, Math.pow(10, 3.55 - 0.16 * (k - 1) - 0.55 * Math.log(k) / Math.log(19))]);
        return { pts, curves, P1: [P1, g0(P1)], P2: [P2, g0(P2)], rain, surf, ridgePts, obs, runs, ra, SW, SH };
      },
      draw(g, t, S, D) {
        const RUNC = [PAL.lagoon, PAL.mint, PAL.heather, PAL.rose, PAL.clay];
        // ---- Beats 1–2: seven points, many curves -----------------------------------
        const aMain = 1 - S.p(2, 0.7);
        if (aMain > 0) g.withAlpha(aMain, () => {
          caps(g, 'Seven observations', 170, 262, { alpha: S.p(0, 0.8) });
          const A = g.axes({ x: 170, y: 300, w: 700, h: 470, xlab: 'Predator density', ylab: 'Prey response', labSize: 22, progress: S.p(0, 1.0) });
          const tC0 = S.b(0) + 1.5, tE1 = cue(S, 1, 'transient underdetermination') + 1.1, tE2 = cue(S, 1, 'can resolve') + 0.7;
          const tStrong = cue(S, 1, 'from strong'), tEq = cue(S, 1, 'empirically equivalent');
          D.curves.forEach((cv) => {
            const ts = tC0 + cv.j * 0.95; const pr = S.tp(ts, 1.0); if (pr <= 0) return;
            const tOut = cv.miss1 ? tE1 + 0.6 + cv.j * 0.06 : cv.miss2 ? tE2 + 0.6 : Infinity;
            const fade = 1 - 0.9 * S.tp(tOut, 0.7);
            const col = cv.main ? COL : U.mix(cv.col, '#7C7893', S.tp(tOut, 0.7));
            g.data(A, cv.arr, { color: col, w: cv.main ? 3.6 : 2.6, alpha: 0.85 * fade, progress: pr });
          });
          // Strong underdetermination: the surviving curve is two theories drawn on top of each other.
          const aB = S.tp(tStrong, 0.9);
          const main = D.curves.find((c) => c.main);
          if (aB > 0) {
            g.data(A, main.arr, { color: COL, w: 8, alpha: 0.45 * aB });
            g.data(A, main.arr, { color: PAL.lagoon, w: 3, dash: [12, 10], alpha: aB, progress: S.tp(tStrong, 1.6) });
            const lx = A.X(0.835), ly = A.Y(main.f(0.835));
            g.line(lx, ly - 14, lx, ly - 92, { color: PAL.ink3, w: 1.5, alpha: aB, progress: S.tp(tStrong, 0.6) });
            g.text('Theory A', lx, ly - 128, { size: 23, color: COL, align: 'center', alpha: aB });
            g.text('Theory B', lx, ly - 100, { size: 23, color: PAL.lagoon, align: 'center', alpha: aB });
          }
          // Data points (drawn over curves).
          D.pts.forEach(([x, y], i) => { const p = S.p(0, 0.6, 0.3 + i * 0.12); g.dot(A.X(x), A.Y(y) - (1 - p) * 40, 7.5, PAL.ink, p, 2.4); });
          // Infinitely many.
          const tInf = cue(S, 0, 'infinitely'); const aInf = S.tp(tInf, 0.8) * (1 - S.p(1, 0.6));
          g.text('∞', 862, 360, { size: 76, role: 'display', color: COL, align: 'right', alpha: aInf });
          caps(g, 'curves through all seven', 862, 392, { align: 'right', alpha: aInf, color: PAL.ink2 });
          // New points: the first eliminates most curves; the second, the rest of the transient rivals.
          const newPt = (P, t0, lab) => {
            const p = S.tp(t0, 0.7); if (p <= 0) return; const X = A.X(P[0]), Y = A.Y(P[1]);
            g.dot(X, lerp(320, Y, ease.inOut(p)), 9, PAL.ochre, 1, 3);
            g.circle(X, Y, 18, { stroke: PAL.ochre, w: 2, alpha: S.tp(t0 + 0.6, 0.4) * (1 - 0.6 * S.tp(t0 + 2.4, 0.8)) });
            caps(g, lab, X, Y + 50, { align: 'center', color: PAL.ochre, alpha: S.tp(t0 + 0.6, 0.6) * (1 - S.tp(t0 + 3.2, 0.6)) });
          };
          // Residual flashes for the curves each new point rules out.
          D.curves.forEach((cv) => {
            for (const [P, tE, miss] of [[D.P1, tE1, cv.miss1], [D.P2, tE2, cv.miss2 && !cv.miss1]]) {
              if (!miss) continue; const a = S.tp(tE, 0.3) * (1 - S.tp(tE + 1.3, 0.6)); if (a <= 0) continue;
              g.line(A.X(P[0]), A.Y(P[1]), A.X(P[0]), A.Y(cv.f(P[0])), { color: PAL.coral, w: 3, alpha: a });
              g.circle(A.X(P[0]), A.Y(cv.f(P[0])), 4, { fill: PAL.coral, alpha: a });
            }
          });
          newPt(D.P1, tE1 - 0.7, 'new data');
          newPt(D.P2, tE2 - 0.7, 'more data');
          // Points that can never separate the two theories.
          D.rain.forEach(([x, y], i) => { const p = S.tp(tEq + 0.3 + i * 0.22, 0.6); if (p > 0) g.dot(A.X(x), lerp(320, A.Y(y), ease.inOut(p)), 6.5, PAL.ochre, p, 2.4); });
        });
        // ---- Beat 1 right column: Duhem–Quine holism -----------------------------------
        const tD = cue(S, 0, 'Duhem'), tAux = cue(S, 0, 'auxiliary assumptions');
        const aH = S.tp(tD - 0.2, 0.8) * (1 - S.p(1, 0.6));
        if (aH > 0) g.withAlpha(aH, () => {
          const X0 = 950, Wd = 330;
          caps(g, 'Duhem–Quine holism', X0, 262);
          g.rect(X0, 290, Wd, 58, { r: 8, fill: U.rgba(COL, 0.14), stroke: COL, w: 2 });
          g.text('H', X0 + 22, 329, { size: 30, role: 'math', italic: true, color: COL });
          g.text('wolves limit elk', X0 + 58, 328, { size: 25, color: PAL.ink });
          const aux = [['every elk is counted'], ['winters were average', 'that winter was severe'], ['collars don’t alter behavior']];
          const tSw = tAux + 0.8;
          aux.forEach(([s0, s1], i) => {
            const y = 386 + i * 54, a = S.tp(tD + 0.5 + i * 0.25, 0.6); if (a <= 0) return;
            const hot = s1 ? S.tp(tAux + 0.3, 0.6) : 0;
            g.withAlpha(a, () => {
              g.rect(X0, y, Wd, 44, { r: 6, fill: U.rgba(hot ? PAL.ochre : PAL.ink2, 0.06 + 0.08 * hot), stroke: U.mix(PAL.ink3, PAL.ochre, hot), w: 1.4 });
              g.math(`A_{${i + 1}}`, X0 + 16, y + 30, { size: 25, color: hot ? PAL.ochre : PAL.ink2 });
              if (!s1) g.text(s0, X0 + 62, y + 29, { size: 21, color: PAL.ink2 });
              else {
                const w0 = g.measure(s0, { size: 21 });
                g.text(s0, X0 + 62, y + 29, { size: 21, color: PAL.ink2, alpha: 1 - S.tp(tSw + 0.3, 0.4) });
                g.line(X0 + 60, y + 22, X0 + 64 + w0, y + 22, { color: PAL.coral, w: 2.4, progress: S.tp(tSw - 0.5, 0.5), alpha: 1 - S.tp(tSw + 0.3, 0.4) });
                g.text(s1, X0 + 62, y + 29, { size: 21, color: PAL.ochre, alpha: S.tp(tSw + 0.4, 0.5) });
              }
            });
          });
          g.text('+', X0 + Wd / 2, 375, { size: 26, color: PAL.ink3, align: 'center', alpha: S.tp(tD + 0.4, 0.5) });
          const aP = S.tp(tD + 1.4, 0.6);
          g.arrow(X0 + Wd / 2, 552, X0 + Wd / 2, 590, { color: PAL.ink3, w: 2, head: 12, alpha: aP });
          g.rect(X0, 598, Wd, 50, { r: 8, stroke: PAL.ink2, w: 1.5, fill: U.rgba(PAL.ink2, 0.06), alpha: aP });
          g.text('predicted elk decline', X0 + Wd / 2, 631, { size: 22, color: PAL.ink, align: 'center', alpha: aP });
          const aX = S.tp(tD + 2.2, 0.6), fit = S.tp(tSw + 0.9, 0.6);
          g.text('observed ≠ predicted', X0 + Wd / 2, 702, { size: 23, color: PAL.coral, align: 'center', alpha: aX * (1 - fit) });
          g.text('observed = predicted', X0 + Wd / 2, 702, { size: 23, color: PAL.moss, align: 'center', alpha: aX * fit });
          // The blame is shifted onto an auxiliary, and H survives.
          g.carrow(X0 + Wd + 4, 690, X0 + Wd + 4, 462, 0.32, { color: PAL.ochre, w: 2.4, head: 13, progress: S.tp(tAux, 0.9) });
          g.wrap('Adjust an auxiliary, and H survives the failed prediction.', X0, 760, Wd, { size: 21, color: PAL.ink2, lh: 1.3, alpha: S.tp(tSw + 1.2, 0.8) });
        });
        // ---- Beat 2 right column: transient vs strong ------------------------------------
        const tT = cue(S, 1, 'transient underdetermination'), tS = cue(S, 1, 'from strong'), tM = cue(S, 1, 'Most of what');
        const aCards = 1 - S.p(2, 0.6); const hiT = S.tp(tM, 0.8);
        card(g, 950, 290, 330, 170, 'Transient', 'Better data or designs can resolve it.', PAL.ochre, S.tp(tT, 0.8) * aCards, hiT);
        card(g, 950, 488, 330, 170, 'Strong', 'Rivals are empirically equivalent, forever.', PAL.lagoon, S.tp(tS, 0.8) * aCards, S.tp(tS, 0.8) * (1 - hiT));
        g.withAlpha(S.tp(tM + 0.4, 0.8) * aCards, () => {
          caps(g, 'most ecological cases', 950, 712, { color: PAL.ochre });
          g.wrap('are transient, though resolving them can take a long time.', 950, 746, 330, { size: 21, color: PAL.ink2, lh: 1.3 });
        });
        g.withAlpha(S.tp(cue(S, 1, 'empirically equivalent') + 1.0, 0.8) * aCards, () => caps(g, 'no possible data separates A and B', 520, 860, { align: 'center', color: PAL.lagoon }));

        // ---- Beat 3: equifinality and the pattern–process problem ------------------------
        const aE = S.p(2, 0.9, 0.3);
        if (aE > 0) g.withAlpha(aE, () => {
          const sx = 200, sy = 300, sw = D.SW, sh = D.SH;
          caps(g, 'Likelihood surface', sx, 262);
          g.withAlpha(S.p(2, 1.2, 0.3), () => g.ctx.drawImage(D.surf, sx, sy, sw, sh));
          g.rect(sx, sy, sw, sh, { stroke: PAL.rule, w: 1.2 });
          g.math('θ_{1}', sx + sw, sy + sh + 34, { size: 26, color: PAL.ink2, align: 'right' });
          g.math('θ_{2}', sx - 12, sy + 22, { size: 26, color: PAL.ink2, align: 'right' });
          const tPS = cue(S, 2, 'many parameter sets'), tRec = cue(S, 2, 'the same record');
          D.ridgePts.forEach(([u, v], k) => { const a = S.tp(tPS + k * 0.18, 0.5); g.circle(sx + u * sw, sy + (1 - v) * sh, 9, { fill: RUNC[k], stroke: PAL.bg, w: 2.5, alpha: a }); });
          g.withAlpha(S.tp(tPS + 0.8, 0.8), () => { g.pill('flat ridge: equally good fits', sx + sw / 2, sy + sh - 30, { size: 21, align: 'center', color: PAL.bg, fill: U.rgba(PAL.parchment, 0.85) }); });
          // One record, five fits.
          const aR = S.tp(tRec - 0.3, 0.8);
          caps(g, 'One record, five fits', sx, 650, { alpha: aR });
          const H = g.axes({ x: sx, y: 676, w: sw, h: 156, xlab: 'Time', ylab: 'Flow', labSize: 21, arrows: false, progress: aR });
          D.runs.forEach((f, k) => g.plot(H, f, { color: RUNC[k], w: 2.2, alpha: 0.85, progress: S.tp(tRec + 0.2 + k * 0.2, 1.0) }));
          D.obs.forEach(([s, v], k) => g.circle(H.X(s), H.Y(v), 3.6, { fill: PAL.ink, alpha: S.tp(tRec - 0.2 + k * 0.02, 0.3) }));
          // Two machines, one pattern.
          const tPP = cue(S, 2, 'pattern–process'), tN = cue(S, 2, 'neutral'), tNi = cue(S, 2, 'niche models'), tSAD = cue(S, 2, 'species-abundance');
          const aM = S.tp(tPP, 0.8);
          caps(g, 'Two machines, one pattern', 740, 262, { alpha: aM });
          const box = (x, title, sub, col, a, rot) => g.withAlpha(a, () => {
            g.rect(x, 290, 260, 150, { r: 10, fill: U.rgba(col, 0.08), stroke: col, w: 2 });
            g.text(title, x + 130, 328, { size: 28, role: 'display', color: col, align: 'center' });
            g.text(sub, x + 130, 424, { size: 21, color: PAL.ink2, align: 'center' });
            gear(g, x + 232, 316, 11, rot, col, 0.8); gear(g, x + 212, 336, 7, -rot * 1.55 + 0.2, col, 0.6);
          });
          box(740, 'Neutral', 'drift + dispersal', PAL.heather, aM * Math.max(0.35, S.tp(tN, 0.6)), t * 0.9);
          box(1030, 'Niche', 'partitioned resources', PAL.mint, aM * Math.max(0.35, S.tp(tNi, 0.6)), -t * 0.8);
          // Neutral glyph: a die. Niche glyph: three partitioned resource curves.
          g.withAlpha(aM * Math.max(0.35, S.tp(tN, 0.6)), () => {
            const cx = 870, cy = 377; g.rect(cx - 21, cy - 21, 42, 42, { r: 7, stroke: PAL.heather, w: 2.4 });
            for (const [ox, oy] of [[-10, -10], [10, 10], [0, 0], [10, -10], [-10, 10]]) g.circle(cx + ox, cy + oy, 3.2, { fill: PAL.heather });
          });
          g.withAlpha(aM * Math.max(0.35, S.tp(tNi, 0.6)), () => {
            const cx = 1160, cy = 392; g.line(cx - 60, cy, cx + 60, cy, { color: PAL.ink3, w: 1.6 });
            [-36, 0, 36].forEach((m, k) => { const pts = []; for (let i = 0; i <= 30; i++) { const u = -24 + 48 * i / 30; pts.push([cx + m + u, cy - 30 * Math.exp(-u * u / 120)]); } g.poly(pts, { color: [PAL.mint, PAL.moss, PAL.lagoon][k], w: 2.4 }); });
          });
          g.carrow(870, 444, 1010, 520, -0.18, { color: PAL.heather, w: 2.2, head: 12, progress: S.tp(tN + 0.3, 0.8) });
          g.carrow(1160, 444, 1050, 520, 0.18, { color: PAL.mint, w: 2.2, head: 12, progress: S.tp(tNi + 0.3, 0.8) });
          const B = g.axes({ x: 800, y: 540, w: 460, h: 280, xmin: 0, xmax: 20, ymin: 1, ymax: 10000, logy: true, xlab: 'Species rank', ylab: 'Abundance', labSize: 21, progress: S.tp(tPP + 0.5, 1.0) });
          g.data(B, D.ra, { color: PAL.heather, w: 7, alpha: 0.6, progress: S.tp(tN + 0.7, 1.4) });
          D.ra.forEach(([k, v], i) => g.circle(B.X(k), B.Y(v), 4.5, { fill: PAL.heather, alpha: S.tp(tN + 0.7 + i * 0.07, 0.3) }));
          g.data(B, D.ra, { color: PAL.mint, w: 2.6, dash: [10, 8], progress: S.tp(tNi + 0.7, 1.4) });
          g.withAlpha(S.tp(tSAD + 0.4, 0.8), () => {
            g.text('same distribution,', 1258, 588, { size: 23, color: PAL.ink, align: 'right' });
            g.text('different processes', 1258, 618, { size: 23, color: PAL.ink2, align: 'right', italic: true });
          });
        });
      },
      terms: [
        { beat: 0.55, term: 'Underdetermination', def: 'The evidence available is insufficient to determine which of several rival theories is true.' },
        { beat: 1.4, term: 'Transient vs strong underdetermination', def: 'Transient: resolvable by further evidence. Strong: rivals are empirically equivalent, so no possible evidence decides.' },
        { beat: 2.2, term: 'Equifinality', def: 'Many different model structures or parameter sets reproduce the same observations equally well (Beven).' },
        { beat: 2.45, term: 'Pattern–process problem', def: 'Different processes can generate the same pattern, so patterns alone rarely identify their cause (Levin).' },
      ],
    },
    {
      id: 'under-decline', title: 'Case file: one decline, many causes', register: 'infer',
      beats: [
        { t: 'The Northern Range elk decline fits many stories: wolves; hunters taking females that left the park; drought; pumas; grizzly and black bears; competition with a growing bison herd. A demographic analysis attributed the first decade mainly to hunting and drought. No comparable analysis has apportioned the decline since.',
          cite: 'Vucetich et al. 2005; Wilmers et al. 2025',
          v: 'Case-file card (elk). The decline curve; six causal threads braid into it; the first decade’s segment is labelled HUNTING + DROUGHT, the rest unlabelled.' },
        { t: 'Some ties have been broken. Since 2005, the share of the herd wintering outside the park rose from twenty to eighty percent. It looked like elk fleeing wolves, but it was demographic: elk outside the park survived better, rather than individuals moving.',
          cite: 'MacNulty et al. 2020; White & Garrott 2013',
          v: 'Park boundary map; the fraction outside fills from 20% to 80%. Two candidate mechanisms: arrows of individuals moving (struck through) vs survival multipliers on each side (lit).' },
        { t: 'And a design built to separate mechanisms did separate them. Linking aspen recruitment to ten measures of predation risk and to changes in elk density, Brice and colleagues found risk effects eight to twenty-eight times weaker than density effects.',
          cite: 'Brice et al. 2024',
          v: 'Two effect bars: RISK (short, ten small sub-bars) and DENSITY (long); a scale bar reads 8–28×.' },
        { t: 'For willow, the tie persists. From the same data, one group sees a stalled system, possibly an alternative stable state held by bison, incised streams, and missing beaver. Another sees willow height doubled in twenty years: a slow recovery.',
          cite: 'Hobbs et al. 2024; Ripple et al. 2025',
          v: 'One willow height series, drawn once; two interpretive overlays alternate: a flat basin (stuck) and a gently rising arrow (recovering).' },
      ],
      init() {
        // Stylized Northern Range elk decline (no numbers on screen).
        const N = (y) => 0.25 + 0.6 / (1 + Math.exp((y - 2004) / 3.2)) + 0.07 * U.smooth((y - 2011) / 9) + 0.012 * Math.sin(y * 1.9);
        const yrs = []; for (let k = 0; k <= 250; k++) yrs.push(1995 + k * 0.1);
        const causes = [
          { lab: 'Wolves', phrase: 'wolves;', col: PAL.coral, icon: 'wolf' },
          { lab: 'Hunters', sub: 'females leaving the park', phrase: 'hunters taking', col: PAL.violet, icon: 'person', hi: true },
          { lab: 'Drought', phrase: 'drought;', col: PAL.ochre, icon: 'sun', hi: true },
          { lab: 'Pumas', phrase: 'pumas', col: PAL.coral, icon: 'puma' },
          { lab: 'Grizzly & black bears', phrase: 'grizzly', col: PAL.clay, icon: 'bear' },
          { lab: 'Bison competition', phrase: 'competition with', col: PAL.sand, icon: 'bison' },
        ];
        // Map: boundary, river and two pools of elk positions (north = outside the park).
        const r = U.rng(4242);
        const MX0 = 520, MX1 = 1260, MY0 = 250, MY1 = 880;
        const by = (x) => 520 + 22 * Math.sin((x - MX0) / 120) + 10 * Math.sin((x - MX0) / 41);
        const bound = []; for (let x = MX0; x <= MX1; x += 8) bound.push([x, by(x)]);
        const river = []; for (let k = 0; k <= 80; k++) { const u = k / 80; river.push([975 - 200 * u + 40 * Math.sin(u * 7), MY1 - (MY1 - MY0) * u]); }
        const nearRiver = (x, y) => river.some(([rx, ry]) => Math.hypot(rx - x, ry - y) < 26);
        const pool = (ya, yb, n) => { const out = []; let guard = 0; while (out.length < n && guard++ < 5000) { const x = MX0 + 40 + r() * (MX1 - MX0 - 80); const y0 = ya(x), y1 = yb(x); const y = y0 + r() * (y1 - y0); if (nearRiver(x, y) || out.some((p) => Math.hypot(p[0] - x, p[1] - y) < 30)) continue; out.push([x, y]); } return out; };
        const outside = pool(() => MY0 + 70, (x) => by(x) - 46, 44), inside = pool((x) => by(x) + 40, () => MY1 - 70, 44);
        const trees = []; for (let k = 0; k < 16; k++) { const x = MX0 + 30 + r() * (MX1 - MX0 - 60), y = by(x) + 60 + r() * (MY1 - by(x) - 110); if (!nearRiver(x, y)) trees.push([x, y, 22 + r() * 14]); }
        const moves = [[3, 5], [9, 11], [15, 2], [21, 8]].map(([a, b]) => [inside[a], outside[b]]);
        // Brice et al. 2024: ten risk measures, each 8–28× weaker than density (individual ratios stylized).
        const ratios = [8, 9.5, 11, 12.5, 14.5, 16.5, 19, 21.5, 24.5, 28];
        // Willow: one height series that doubles over twenty years (stylized).
        const wil = []; for (let k = 0; k <= 20; k++) wil.push([k, (1 + k / 20) * (1 + 0.075 * Math.sin(k * 2.3 + 0.7) + 0.04 * Math.sin(k * 5.1))]);
        return { N, yrs, causes, bound, river, outside, inside, trees, moves, ratios, wil, by, M: { MX0, MX1, MY0, MY1 } };
      },
      draw(g, t, S, D) {
        // Case file: pinned large, then shrinks to the corner when the evidence begins.
        const sh = S.p(1, 1.0); const cw = lerp(270, 200, sh), chh = lerp(156, 116, sh);
        g.casefile(96, 226, cw, chh, { title: 'One decline, many causes', no: 'IX', sketch: 'elk', color: COL, rot: -0.02, alpha: S.p(0, 0.9), titleSize: lerp(22, 17, sh) });
        const glyph = (c, x, y, s, a) => {
          if (c.icon === 'person') person(g, x, y, s * 0.9, c.col, a);
          else if (c.icon === 'sun') sun(g, x, y, s, c.col, a);
          else g.icon(c.icon, x, y, s, c.col, { alpha: a });
        };

        // ---- Beat 1: the decline and its braided causes ---------------------------------
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const A = g.axes({ x: 600, y: 330, w: 1160, h: 470, xmin: 1993, xmax: 2022, ymin: 0, ymax: 1, xlab: 'Year', labSize: 22, progress: S.p(0, 1.1, 0.2), xticks: [{ v: 1995, l: '1995' }, { v: 2005, l: '2005' }, { v: 2015, l: '2015' }] });
          caps(g, 'Elk on the Northern Range', 600, 300, { alpha: S.p(0, 0.8, 0.5) });
          caps(g, 'stylized', 1760, 300, { align: 'right', alpha: S.p(0, 0.8, 0.8) });
          const P = D.yrs.map((y) => [A.X(y), A.Y(D.N(y))]);
          g.poly(P, { color: PAL.ink2, w: 2, alpha: 0.5, progress: S.p(0, 2.0, 0.6) });
          const tAtt = cue(S, 0, 'attributed the first decade'), tNo = cue(S, 0, 'No comparable');
          const hi = S.tp(tAtt + 0.4, 0.9), q = S.tp(tNo + 0.3, 0.9);
          // Strand geometry: six strands twisted around the curve.
          const nrm = P.map((p, k) => { const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; });
          const arc = [0]; for (let k = 1; k < P.length; k++) arc.push(arc[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
          const strand = (i) => P.map((p, k) => { const o = 6.5 * Math.sin(arc[k] / 46 + i * Math.PI / 3); return [p[0] + nrm[k][0] * o, p[1] + nrm[k][1] * o]; });
          const x95 = A.X(1995), y95 = A.Y(D.N(1995));
          D.causes.forEach((c, i) => {
            const tc = cue(S, 0, c.phrase); const a = S.tp(tc - 0.2, 0.6); if (a <= 0) return;
            const ry = 452 + i * 66; const dim = c.hi ? 1 : 1 - 0.6 * hi;
            g.withAlpha(a * dim, () => {
              glyph(c, 140, ry, 50, 1);
              g.text(c.lab, 186, ry + (c.sub ? 2 : 8), { size: 23, color: PAL.ink });
              if (c.sub) g.text(c.sub, 186, ry + 27, { size: 21, color: PAL.ink3, italic: true });
              g.dot(476, ry, 4, c.col, 1, 2);
            });
            // Feeder thread from the cause into the braid.
            const bz = []; for (let k = 0; k <= 40; k++) { const u = k / 40; const x = (1 - u) ** 3 * 476 + 3 * (1 - u) ** 2 * u * 540 + 3 * (1 - u) * u * u * 540 + u ** 3 * x95; const y = (1 - u) ** 3 * ry + 3 * (1 - u) ** 2 * u * ry + 3 * (1 - u) * u * u * y95 + u ** 3 * y95; bz.push([x, y]); }
            g.poly(bz, { color: c.col, w: 2.2, alpha: 0.75 * dim, progress: S.tp(tc, 0.8) });
            g.poly(strand(i), { color: c.col, w: 2.4, alpha: 0.9 * (1 - 0.55 * hi), progress: S.tp(tc + 0.6, 2.6) });
          });
          // The first decade: hunting + drought.
          if (hi > 0) {
            const xa = A.X(1995), xb = A.X(2005);
            g.rect(xa, 340, xb - xa, 460, { r: 6, fill: U.rgba(COL, 0.08), stroke: U.rgba(COL, 0.5), w: 1.5, alpha: hi });
            [1, 2].forEach((i) => g.clip(xa, 330, xb - xa, 470, () => g.poly(strand(i), { color: D.causes[i].col, w: 4.6, alpha: hi })));
            g.text('HUNTING + DROUGHT', (xa + xb) / 2, 378, { size: 23, weight: 600, ls: 2.2, color: COL, align: 'center', alpha: hi });
          }
          if (q > 0) {
            const xa = A.X(2005) + 10, xb = A.X(2020) + 12;
            g.rect(xa, 340, xb - xa, 460, { r: 6, stroke: U.rgba(PAL.ink2, 0.5), w: 1.5, dash: [8, 8], alpha: q });
            g.text('?', (xa + xb) / 2, 404, { size: 76, role: 'display', color: PAL.ink2, align: 'center', alpha: q });
          }
        });

        // ---- Beat 2: the outside-the-park fraction, and its mechanism --------------------
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const { MX0, MX1, MY0, MY1 } = D.M;
          g.rect(MX0, MY0, MX1 - MX0, MY1 - MY0, { r: 12, fill: 'rgba(21,19,39,0.55)', stroke: PAL.rule, w: 1.5 });
          g.clip(MX0, MY0, MX1 - MX0, MY1 - MY0, () => {
            D.trees.forEach(([x, y, s]) => g.icon('conifer', x, y, s, PAL.moss, { alpha: 0.28 }));
            g.poly(D.river, { color: PAL.lagoon, w: 3, alpha: 0.75, progress: S.p(1, 1.6) });
          });
          g.poly(D.bound, { color: PAL.violet, w: 3, dash: [12, 9], progress: S.p(1, 1.4, 0.2) });
          caps(g, 'park boundary', MX1 - 16, D.by(MX1 - 16) - 18, { align: 'right', color: PAL.violet, alpha: S.p(1, 0.8, 0.8) });
          caps(g, 'outside the park', MX0 + 20, MY0 + 36, { color: PAL.ink2, alpha: S.p(1, 0.8, 0.6) });
          caps(g, 'Yellowstone National Park', MX0 + 20, MY1 - 22, { color: PAL.ink2, alpha: S.p(1, 0.8, 0.6) });
          const tF = cue(S, 1, 'rose from twenty'), tLook = cue(S, 1, 'It looked like'), tWolf = cue(S, 1, 'fleeing wolves'), tDem = cue(S, 1, 'but it was demographic'), tSurv = cue(S, 1, 'elk outside the park survived');
          const f = lerp(0.2, 0.8, S.io(1, 0.01, 0) * ease.inOut(clamp((t - tF) / 5.0)));
          const NT = 45;
          const elk = (pts, n, bornCol) => pts.forEach(([x, y], j) => {
            const a = clamp(n - j); if (a <= 0) return; g.dot(x, y, 6, PAL.sand, a * S.p(1, 0.6, 0.4 + j * 0.01), 2.4);
            if (a < 1 && t > tF) g.circle(x, y, 8 + 14 * a, { stroke: bornCol, w: 2, alpha: 0.8 * (1 - a) * a * 3 });
          });
          elk(D.outside, f * NT, PAL.moss); elk(D.inside, (1 - f) * NT, PAL.coral);
          // Wolves inside the park.
          [[700, 760], [1010, 690]].forEach(([x, y], k) => g.icon('wolf', x, y, 54, PAL.coral, { alpha: S.tp(tWolf + k * 0.2, 0.6), flip: k === 1 }));
          // Hypothesis 1: individuals moving out (struck through).
          const aMv = S.tp(tLook, 0.7), strike = S.tp(tDem, 0.6);
          D.moves.forEach(([p, q2], k) => {
            const a = aMv * (1 - 0.65 * strike); if (a <= 0) return;
            g.arrow(p[0], p[1], q2[0], q2[1] + 10, { color: PAL.ink2, w: 2.2, head: 13, dash: [7, 6], alpha: a });
            const u = ((t - tLook) / 1.8 + k * 0.27) % 1; if (strike < 1) g.dot(lerp(p[0], q2[0], u), lerp(p[1], q2[1] + 10, u), 5, PAL.sand, a * (1 - strike), 2);
            const mx = lerp(p[0], q2[0], 0.38), my = lerp(p[1], q2[1] + 10, 0.38);
            g.line(mx - 14, my - 14, mx + 14, my + 14, { color: PAL.coral, w: 3.5, progress: S.tp(tDem + k * 0.12, 0.3) });
            g.line(mx + 14, my - 14, mx - 14, my + 14, { color: PAL.coral, w: 3.5, progress: S.tp(tDem + 0.15 + k * 0.12, 0.3) });
          });
          // Hypothesis 2: survival multipliers on each side (lit).
          const aSv = S.tp(tSurv, 0.7);
          g.pill('higher survival', MX1 - 20, MY0 + 32, { align: 'right', size: 22, color: PAL.moss, alpha: aSv, fill: U.rgba(PAL.moss, 0.16), stroke: PAL.moss });
          g.pill('lower survival', MX1 - 20, MY1 - 30, { align: 'right', size: 22, color: PAL.coral, alpha: aSv, fill: U.rgba(PAL.coral, 0.14), stroke: PAL.coral });
          // Meter (left column).
          g.withAlpha(S.p(1, 0.8, 0.5), () => {
            caps(g, 'share of the herd', 104, 420); caps(g, 'wintering outside the park', 104, 444);
            g.text(`${Math.round(f * 100)}%`, 100, 548, { size: 104, role: 'display', color: COL });
            g.rect(104, 580, 360, 20, { r: 10, fill: U.rgba(PAL.ink2, 0.12), stroke: PAL.rule, w: 1 });
            g.rect(104, 580, 360 * f, 20, { r: 10, fill: COL });
            g.text('since 2005', 104, 640, { size: 23, color: PAL.ink2, italic: true });
          });
          // Mechanisms (right column).
          const X1 = 1330;
          caps(g, 'Two candidate mechanisms', X1, 300, { alpha: aMv });
          g.withAlpha(aMv, () => {
            g.rect(X1, 330, 470, 150, { r: 10, fill: U.rgba(PAL.ink2, 0.06), stroke: U.rgba(PAL.ink2, 0.4), w: 1.4 });
            g.arrow(X1 + 30, 420, X1 + 92, 382, { color: PAL.ink2, w: 2.4, head: 12, dash: [6, 5] });
            g.line(X1 + 24, 404, X1 + 100, 396, { color: PAL.violet, w: 2, dash: [6, 5] });
            g.text('Individuals moved out', X1 + 124, 392, { size: 26, color: PAL.ink });
            g.text('elk fleeing wolves', X1 + 124, 428, { size: 21, color: PAL.ink3, italic: true });
            const w0 = g.measure('Individuals moved out', { size: 26 });
            g.line(X1 + 118, 383, X1 + 130 + w0, 383, { color: PAL.coral, w: 3.5, progress: S.tp(tDem, 0.6) });
          });
          const aS2 = S.tp(tDem + 0.6, 0.7);
          g.withAlpha(aS2, () => {
            g.glow(X1 + 235, 595, 260, PAL.moss, 0.12 * aSv);
            g.rect(X1, 520, 470, 150, { r: 10, fill: U.rgba(PAL.moss, 0.06 + 0.08 * aSv), stroke: U.rgba(PAL.moss, 0.4 + 0.55 * aSv), w: 1.4 + aSv });
            g.circle(X1 + 60, 596, 30, { stroke: PAL.moss, w: 2.4, fill: U.rgba(PAL.moss, 0.12) });
            g.arrow(X1 + 60, 616, X1 + 60, 574, { color: PAL.moss, w: 3.5, head: 15 });
            g.text('Survival higher outside', X1 + 124, 582, { size: 26, color: PAL.ink });
            g.text('a demographic shift', X1 + 124, 618, { size: 21, color: PAL.ink3, italic: true });
          });
          g.wrap('Same map, same numbers: the pattern looked like flight, but the mechanism was survival.', X1, 730, 460, { size: 23, color: PAL.ink2, lh: 1.32, alpha: S.tp(tSurv + 1.6, 0.8) });
        });

        // ---- Beat 3: risk vs density effects on aspen ----------------------------------
        const a2 = vis(S, 2, 3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const X0 = 560, L = 1150;
          const tTen = cue(S, 2, 'ten measures'), tDen = cue(S, 2, 'changes in elk density'), tR = cue(S, 2, 'eight to twenty-eight');
          g.icon('aspen', X0 + 14, 286, 44, PAL.moss, { alpha: S.p(2, 0.8) });
          caps(g, 'effect on aspen recruitment', X0 + 52, 300, { alpha: S.p(2, 0.8) });
          // Two separated lanes.
          g.line(104, 500, 1760, 500, { color: PAL.rule, w: 1.5, dash: [8, 8], progress: S.p(2, 1.4, 0.6) });
          g.withAlpha(S.p(2, 0.8, 0.4), () => {
            g.icon('elk', 140, 420, 62, PAL.sand);
            g.text('Elk density', 196, 430, { size: 28, color: PAL.ink });
            g.icon('wolf', 136, 576, 52, PAL.coral); g.icon('puma', 140, 640, 52, PAL.coral);
            g.text('Predation risk', 196, 588, { size: 28, color: PAL.ink });
            g.text('ten measures', 196, 622, { size: 22, color: PAL.ink2, italic: true });
          });
          // Two empty lanes: the design keeps the mechanisms apart.
          g.withAlpha(S.p(2, 0.8, 0.8), () => {
            g.rect(X0, 392, L, 60, { r: 6, fill: U.rgba(PAL.sand, 0.05), stroke: U.rgba(PAL.sand, 0.25), w: 1.2, dash: [6, 6] });
            g.rect(X0, 540, L, 242, { r: 6, fill: U.rgba(PAL.coral, 0.04), stroke: U.rgba(PAL.coral, 0.22), w: 1.2, dash: [6, 6] });
          });
          const pD = S.tp(tDen, 1.4);
          g.rect(X0, 392, L * ease.out(pD), 60, { r: 6, fill: U.rgba(PAL.sand, 0.85), alpha: pD > 0 ? 1 : 0 });
          g.text('DENSITY', X0 + 20, 431, { size: 22, weight: 700, ls: 2.4, color: PAL.bg, alpha: S.tp(tDen + 0.6, 0.6) });
          D.ratios.forEach((rr, i) => {
            const p = S.tp(tTen + i * 0.12, 0.7); if (p <= 0) return;
            g.rect(X0, 548 + i * 23, (L / rr) * ease.out(p), 15, { r: 3, fill: PAL.coral, alpha: 0.9 });
          });
          g.text('RISK', X0 + L / 8 + 18, 580, { size: 22, weight: 700, ls: 2.4, color: PAL.coral, alpha: S.tp(tTen + 1.4, 0.6) });
          caps(g, 'individual risk measures stylized', X0 + L, 780, { align: 'right', alpha: S.tp(tTen + 1.6, 0.6) });
          // The scale bar: risk effects laid end to end along the density effect.
          const pr = S.tp(tR, 0.6);
          if (pr > 0) {
            for (const [n, y, lab, k0] of [[8, 818, '× 8', 0], [28, 852, '× 28', 0.9]]) {
              const seg = L / n; const shown = clamp((t - tR - k0) / 1.4) * n;
              for (let k = 0; k < Math.ceil(shown); k++) g.rect(X0 + k * seg + 1, y, seg - 2, 16, { r: 2, fill: k % 2 ? U.rgba(PAL.coral, 0.55) : PAL.coral, alpha: clamp(shown - k) });
              g.text(lab, X0 + L + 14, y + 16, { size: 24, color: PAL.coral, alpha: S.tp(tR + k0 + 1.3, 0.5) });
            }
            g.line(X0 + L, 392, X0 + L, 870, { color: PAL.sand, w: 1.5, dash: [5, 6], alpha: pr });
            g.text('8–28×', 100, 842, { size: 78, role: 'display', color: COL, alpha: S.tp(tR + 1.6, 0.8) });
            g.text('weaker than density', 104, 882, { size: 23, color: PAL.ink2, alpha: S.tp(tR + 1.9, 0.8) });
          }
        });

        // ---- Beat 4: willow, one series, two readings ----------------------------------
        const a3 = S.p(3, 0.9);
        if (a3 > 0) g.withAlpha(a3, () => {
          const A = g.axes({ x: 600, y: 330, w: 760, h: 460, xmin: -2.5, xmax: 22.5, ymin: 0, ymax: 3.2, xlab: 'Years', ylab: 'Willow height', labSize: 22, progress: S.p(3, 1.0), xticks: [{ v: 0, l: '0' }, { v: 10, l: '10' }, { v: 20, l: '20' }] });
          g.icon('willow', 640, 285, 48, PAL.moss, { alpha: S.p(3, 0.8) });
          caps(g, 'one willow height series', 676, 300, { alpha: S.p(3, 0.8) });
          caps(g, 'stylized', 1360, 300, { align: 'right', alpha: S.p(3, 0.8) });
          const tA = cue(S, 3, 'one group sees'), tB = cue(S, 3, 'Another sees');
          const tBi = cue(S, 3, 'bison,'), tIn = cue(S, 3, 'incised'), tBv = cue(S, 3, 'missing beaver');
          const tBoth = tB + 2.6;
          const aA = S.tp(tA, 0.9) * (1 - S.tp(tB - 0.3, 0.6) + 0.6 * S.tp(tBoth, 0.8));
          const aB = S.tp(tB, 0.9);
          // Overlay A: a flat basin around the data.
          if (aA > 0) g.withAlpha(aA, () => {
            const bowl = []; for (let k = 0; k <= 240; k++) { const x = -2.4 + 24.8 * k / 240; const y = 0.42 + 2.58 * Math.pow(clamp((Math.abs(x - 10) - 8.6) / 3.8), 2); bowl.push([A.X(x), A.Y(y)]); }
            g.poly([...bowl, [bowl[bowl.length - 1][0], A.Y(3.0)], [bowl[0][0], A.Y(3.0)]], { fill: U.rgba(PAL.clay, 0.08), color: null, w: 0, close: true });
            g.poly(bowl, { color: PAL.clay, w: 4, progress: S.tp(tA, 1.4) });
            caps(g, 'stalled: held in a basin', A.X(10), A.Y(2.82), { align: 'center', color: PAL.clay });
          });
          // Overlay B: a gently rising arrow.
          if (aB > 0) g.withAlpha(aB, () => {
            g.arrow(A.X(-0.4), A.Y(0.9), A.X(21.2), A.Y(2.08), { color: PAL.mint, w: 5, head: 20, progress: S.tp(tB, 1.4) });
            g.text('height doubled in 20 years', A.X(5.5), A.Y(1.75), { size: 24, color: PAL.mint, align: 'center', alpha: S.tp(tB + 0.8, 0.7) });
          });
          // The series, drawn once.
          D.wil.forEach(([x, y], k) => g.dot(A.X(x), A.Y(y), 6.5, PAL.moss, S.p(3, 0.4, 0.6 + k * 0.08), 2.4));
          // Insets.
          const XI = 1440;
          const aIA = S.tp(tA, 0.8) * (1 - S.tp(tB - 0.3, 0.6));
          if (aIA > 0) g.withAlpha(aIA, () => {
            caps(g, 'an alternative stable state?', XI, 300, { color: PAL.clay });
            const it = [[tBi, 'bison', 'Bison'], [tIn, 'stream', 'Incised streams'], [tBv, 'beaver', 'Missing beaver']];
            it.forEach(([tc, k, lab], i) => {
              const a = S.tp(tc - 0.2, 0.6); const y = 370 + i * 74;
              if (k === 'stream') { g.poly([[XI + 8, y - 22], [XI + 30, y + 16], [XI + 52, y - 22]], { color: PAL.ink3, w: 2.5, alpha: a }); g.line(XI + 22, y + 6, XI + 38, y + 6, { color: PAL.lagoon, w: 4, alpha: a }); }
              else g.icon(k, XI + 30, y, 50, k === 'bison' ? PAL.sand : PAL.clay, { alpha: a * (k === 'beaver' ? 0.4 : 1) });
              if (k === 'beaver') g.line(XI + 4, y + 18, XI + 56, y - 18, { color: PAL.coral, w: 3, alpha: a });
              g.text(lab, XI + 76, y + 8, { size: 23, color: PAL.ink, alpha: a });
            });
            // Ball and cup: the system held in the short-willow well.
            const V = (u) => 700 + 90 * Math.exp(-Math.pow((u - 0.28) / 0.15, 2)) - 0 + 60 * Math.exp(-Math.pow((u - 0.8) / 0.12, 2)) - 70 * Math.exp(-Math.pow((u - 0.56) / 0.09, 2));
            const land = []; for (let k = 0; k <= 80; k++) { const u = k / 80; land.push([XI + u * 350, V(u)]); }
            g.poly(land, { color: PAL.clay, w: 3, progress: S.tp(tA + 0.6, 1.2) });
            g.dot(XI + 0.28 * 350, V(0.28) - 14, 12, PAL.moss, S.tp(tA + 1.4, 0.6), 2);
            caps(g, 'short willow', XI + 0.28 * 350, 830, { align: 'center', color: PAL.ink2, alpha: S.tp(tA + 1.2, 0.6) });
            caps(g, 'tall willow', XI + 0.8 * 350, 830, { align: 'center', color: PAL.ink2, alpha: S.tp(tA + 1.2, 0.6) });
          });
          const aIB = S.tp(tB, 0.8);
          if (aIB > 0) g.withAlpha(aIB, () => {
            caps(g, 'a slow recovery', XI, 300, { color: PAL.mint });
            g.line(XI, 680, XI + 350, 680, { color: PAL.ink3, w: 1.5 });
            g.icon('willow', XI + 70, 642, 76, PAL.moss);
            g.icon('willow', XI + 260, 604, 152, PAL.moss, { alpha: S.tp(tB + 0.6, 0.8) });
            g.text('×2', XI + 165, 520, { size: 64, role: 'display', color: PAL.mint, align: 'center', alpha: S.tp(tB + 0.9, 0.8) });
            caps(g, 'year 0', XI + 70, 716, { align: 'center' }); caps(g, 'year 20', XI + 260, 716, { align: 'center', alpha: S.tp(tB + 0.6, 0.8) });
          });
          // Left column: who reads it which way.
          g.withAlpha(S.tp(tA, 0.8), () => { caps(g, 'one group sees', 104, 440); g.text('a stalled system', 104, 476, { size: 28, role: 'display', color: PAL.clay }); g.rect(104, 492, 44, 4, { r: 2, fill: PAL.clay }); });
          g.withAlpha(S.tp(tB, 0.8), () => { caps(g, 'another sees', 104, 570); g.text('a slow recovery', 104, 606, { size: 28, role: 'display', color: PAL.mint }); g.rect(104, 622, 44, 4, { r: 2, fill: PAL.mint }); });
          g.text('Same data, two readings.', 980, 885, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tBoth, 0.9) });
        });
      },
    },
    {
      id: 'under-break', title: 'Breaking the tie', register: 'claim',
      beats: [
        { t: 'How do scientists choose when evidence does not? With theoretical virtues, such as simplicity, scope, and coherence with other knowledge, though choosing among the virtues is itself a judgment.',
          v: 'Rival curves get virtue badges; a hand hesitates between them.' },
        { t: 'Better, design discriminating tests, as Chamberlin and Platt urged. Or weigh many models at once. Kenneth Burnham and David Anderson’s multimodel inference ranks candidate models by information criteria such as AIC, and averages across them rather than crowning a single winner.',
          s: 'Better, design discriminating tests, as Chamberlin and Platt urged. Or weigh many models at once. Kenneth Burnham and David Anderson’s multimodel inference ranks candidate models by information criteria such as A I C, and averages across them rather than crowning a single winner.',
          cite: 'Burnham & Anderson 2002',
          v: 'A model table with ΔAIC and Akaike weights; a weighted-average prediction curve forms from the candidates.' },
        { t: 'Scale can also dissolve a contradiction. Large carnivores feed smaller carnivores through carrion nearby, and kill them across landscapes. Studies covering less than a thousand square kilometers tend to find positive associations; larger studies, negative ones. Both are right, at their own scale.',
          cite: 'Sivy et al. 2017; Prugh & Sivy 2020',
          v: 'Zoom out from a carcass with scavengers gathered (positive, local) to a landscape where mesocarnivore dots thin inside wolf territories (negative, broad).' },
      ],
      init() {
        const x0 = 0.08, dx = 0.14; const xs = []; for (let i = 0; i < 7; i++) xs.push(x0 + i * dx);
        const g0 = (x) => 0.24 + 0.52 * Math.exp(-2.1 * x) + 0.07 * Math.sin(4.2 * x + 0.6);
        const W1 = (x) => Math.sin(Math.PI * (x - x0) / dx);
        const rivals = [
          { f: g0, col: PAL.lagoon, name: 'Simplicity', desc: 'the fewest parameters', phrase: 'simplicity', bx: 0.42 },
          { f: (x) => g0(x) + 0.075 * W1(x), col: PAL.ochre, name: 'Scope', desc: 'also fits a second site', phrase: 'scope', bx: 0.75 },
          { f: (x) => g0(x) - 0.06 * W1(x) * (1.1 - x), col: PAL.heather, name: 'Coherence', desc: 'agrees with other knowledge', phrase: 'coherence', bx: 0.9 },
        ];
        const site2 = [0.15, 0.43, 0.71].map((x) => [x, rivals[1].f(x)]);
        // Candidate models (ILLUSTRATIVE ΔAIC); Akaike weights computed from them.
        const models = [
          { name: 'Density + risk', d: 0, f: (x) => 0.86 - 0.66 * x, col: PAL.lagoon },
          { name: 'Density', d: 0.9, f: (x) => 0.8 - 0.56 * x, col: PAL.mint },
          { name: 'Risk', d: 2.6, f: (x) => 0.64 - 0.3 * x, col: PAL.heather },
          { name: 'Climate', d: 4.4, f: (x) => 0.56 - 0.12 * x, col: PAL.rose },
          { name: 'Null', d: 6.9, f: () => 0.47, col: PAL.ink3 },
        ];
        const tot = models.reduce((s, m) => s + Math.exp(-m.d / 2), 0); models.forEach((m) => { m.w = Math.exp(-m.d / 2) / tot; });
        const avg = (x) => models.reduce((s, m) => s + m.w * m.f(x), 0);
        // Scale: a landscape with wolf territories and mesocarnivores (world units = panel px at full zoom).
        const r = U.rng(1701); const carc = [300, 340];
        const terr = [[300, 340, 168], [565, 150, 122], [580, 500, 128], [92, 565, 104]].map(([cx, cy, R], k) => { const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; const rr = R * (1 + 0.1 * U.noise1(i / 64 * 6 + k * 9, 33) ); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return { cx, cy, R, pts }; });
        const inTerr = (x, y) => terr.some((T) => Math.hypot(x - T.cx, y - T.cy) < T.R * 0.95);
        const meso = []; let guard = 0;
        while (meso.length < 120 && guard++ < 20000) { const x = 14 + r() * 652, y = 14 + r() * 612; if (Math.hypot(x - carc[0], y - carc[1]) < 46) continue; if (inTerr(x, y) && r() > 0.16) continue; if (meso.some((p) => Math.hypot(p[0] - x, p[1] - y) < 22)) continue; meso.push([x, y]); }
        const scav = [['coyote', -30, -4, false, true], ['coyote', 31, 12, true, true], ['fox', -6, 27, false, true], ['bird', -20, -30, false, false], ['bird', 14, -32, false, false], ['bird', 38, -16, false, false]];
        // Studies (STYLIZED): positive below ~1,000 km², negative above.
        const studies = [[25, 0.32], [60, 0.48], [110, 0.2], [180, 0.38], [300, 0.12], [520, 0.26], [800, 0.08], [1600, -0.14], [2500, -0.32], [4200, -0.22], [7000, -0.45], [12000, -0.3], [20000, -0.55], [42000, -0.4], [70000, -0.62]];
        return { pts: xs.map((x) => [x, g0(x)]), rivals, site2, models, avg, carc, terr, meso, scav, studies, xt: 0.57 };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: rival curves wear their virtues -------------------------------------
        const aR = S.p(0, 0.8) * (1 - S.tp(cue(S, 1, 'Or weigh'), 0.7));
        if (aR > 0) g.withAlpha(aR, () => {
          caps(g, 'Rivals that fit the same data', 170, 262, { alpha: S.p(0, 0.8) });
          const A = g.axes({ x: 170, y: 320, w: 620, h: 440, xlab: 'Predator density', ylab: 'Prey response', labSize: 22, progress: S.p(0, 1.0) });
          const tTest = cue(S, 1, 'discriminating'); const tLand = tTest + 1.4;
          D.rivals.forEach((R, i) => {
            const miss = i > 0 ? S.tp(tLand + 0.6, 0.7) : 0;
            g.plot(A, R.f, { from: 0.02, to: 0.98, color: R.col, w: 3, alpha: 0.9 * (1 - 0.8 * miss), progress: S.p(0, 1.2, 1.0 + i * 0.7) });
            const tc = cue(S, 0, R.phrase); const a = S.tp(tc, 0.6) * (1 - 0.6 * miss); if (a <= 0) return;
            const px = A.X(R.bx), py = A.Y(R.f(R.bx)), ly = 352 + i * 46;
            g.line(px, py - 8, px, ly + 14, { color: R.col, w: 1.5, alpha: a * 0.7, progress: S.tp(tc, 0.5) });
            g.circle(px, py, 6, { fill: R.col, alpha: a });
            g.pill(R.name.toUpperCase(), px, ly, { size: 17, align: 'center', color: R.col, alpha: a, weight: 600 });
          });
          // A second site that only the "scope" rival also explains.
          const aS2 = S.tp(cue(S, 0, 'scope'), 0.6);
          D.site2.forEach(([x, y]) => g.circle(A.X(x), A.Y(y), 6.5, { stroke: PAL.ochre, w: 2.2, alpha: aS2 * (1 - 0.7 * S.tp(tLand + 0.6, 0.7)) }));
          D.pts.forEach(([x, y], i) => g.dot(A.X(x), A.Y(y), 7.5, PAL.ink, S.p(0, 0.5, 0.2 + i * 0.1), 2.4));
          // Beat 2a: a discriminating test where the rivals disagree.
          const aT = S.tp(tTest, 0.7);
          if (aT > 0) {
            const X = A.X(D.xt); g.rect(X - 26, 330, 52, 420, { r: 6, fill: U.rgba(PAL.ink, 0.05), stroke: U.rgba(PAL.ink, 0.35), w: 1.2, dash: [6, 6], alpha: aT });
            caps(g, 'discriminating test', X, 790 + 30, { align: 'center', color: PAL.ink, alpha: aT });
            const yT = A.Y(D.rivals[0].f(D.xt)); const p = S.tp(tLand, 0.7);
            D.rivals.slice(1).forEach((R) => { const a = S.tp(tLand + 0.5, 0.3) * (1 - S.tp(tLand + 2.0, 0.5)); g.line(X, yT, X, A.Y(R.f(D.xt)), { color: PAL.coral, w: 3, alpha: a }); });
            if (p > 0) g.dot(X, lerp(330, yT, ease.inOut(p)), 9, PAL.ink, 1, 3);
          }
        });
        // Right column: virtue cards and a hesitating hand.
        const aCards = S.p(0, 0.8) * (1 - S.tp(cue(S, 1, 'Or weigh'), 0.7));
        const missC = S.tp(cue(S, 1, 'discriminating') + 2.0, 0.7);
        if (aCards > 0) g.withAlpha(aCards, () => {
          D.rivals.forEach((R, i) => {
            const a = S.tp(cue(S, 0, R.phrase), 0.7) * (i > 0 ? 1 - 0.65 * missC : 1); if (a <= 0) return; const y = 320 + i * 132;
            g.withAlpha(a, () => {
              g.rect(880, y, 360, 112, { r: 10, fill: U.rgba(R.col, 0.08), stroke: U.rgba(R.col, 0.6), w: 1.6 });
              g.rect(880, y + 16, 5, 80, { r: 2, fill: R.col });
              g.text(R.name, 906, y + 50, { size: 34, role: 'display', color: R.col });
              g.text(R.desc, 906, y + 84, { size: 22, color: PAL.ink2 });
            });
          });
          const tJ = cue(S, 0, 'though choosing'); const aJ = S.tp(tJ, 0.6);
          if (aJ > 0) g.withAlpha(1 - S.p(1, 0.6), () => {
            const seq = [1, 0, 2, 1, 0, 1, 2, 1]; const u = Math.max(0, (t - tJ) / 0.85); const k = Math.min(seq.length - 2, Math.floor(u)); const f = ease.inOut(clamp((u - k) * 1.6));
            const yc = (j) => 376 + j * 132; const y = lerp(yc(seq[k]), yc(seq[k + 1]), f);
            hand(g, 1262, y, 62, aJ);
            g.text('?', 1290, y - 40, { size: 40, role: 'display', color: PAL.ink, alpha: aJ * (0.6 + 0.4 * Math.sin(t * 3)) });
            caps(g, 'choosing is itself a judgment', 1060, 742, { align: 'center', color: PAL.ink2, alpha: S.tp(tJ + 1.0, 0.8) });
          });
        });

        // ---- Beat 2b: multimodel inference ------------------------------------------------
        const tW = cue(S, 1, 'Or weigh'), tRank = cue(S, 1, 'ranks candidate'), tAIC = cue(S, 1, 'such as AIC'), tAvg = cue(S, 1, 'averages across'), tCrown = cue(S, 1, 'crowning');
        const aM = S.tp(tW + 0.3, 0.8) * (1 - S.p(2, 0.6));
        if (aM > 0) g.withAlpha(aM, () => {
          caps(g, 'Candidate models', 110, 262);
          caps(g, 'illustrative', 640, 262, { align: 'right' });
          caps(g, 'ΔAIC', 440, 326, { align: 'right', alpha: S.tp(tAIC, 0.6) });
          caps(g, 'Akaike weight', 470, 326, { alpha: S.tp(tAIC + 0.8, 0.6) });
          g.line(110, 342, 640, 342, { color: PAL.rule, w: 1.2 });
          const scr = [3, 0, 4, 1, 2]; const sort = S.tp(tAIC + 0.2, 1.1);
          D.models.forEach((m, i) => {
            const a = S.tp(tRank - 0.6 + i * 0.25, 0.6); if (a <= 0) return;
            const y = 386 + lerp(scr[i], i, ease.inOut(sort)) * 60;
            g.withAlpha(a, () => {
              g.circle(126, y - 8, 7, { fill: m.col });
              g.text(m.name, 146, y, { size: 24, color: PAL.ink });
              g.text(m.d.toFixed(1), 440, y, { size: 24, role: 'mono', color: PAL.ink2, align: 'right', alpha: S.tp(tAIC + i * 0.12, 0.5) });
              const pw = S.tp(tAIC + 0.8 + i * 0.12, 0.7);
              g.rect(470, y - 18, 110 * m.w / 0.5 * pw, 16, { r: 3, fill: m.col, alpha: 0.85 });
              g.text(m.w.toFixed(2), 640, y, { size: 22, role: 'mono', color: PAL.ink, align: 'right', alpha: pw });
            });
            if (i === 0) {
              const ca = S.tp(tCrown - 0.3, 0.5); const cx = 146 + g.measure(m.name, { size: 24 }) + 28;
              crown(g, cx, y - 10, 30, PAL.ochre, ca);
              g.line(cx - 22, y + 6, cx + 22, y - 26, { color: PAL.coral, w: 3.5, progress: S.tp(tCrown + 0.5, 0.4) });
            }
          });
          g.math('\\bar{y} = \\sum w_{i}\\, \\hat{y}_{i}', 126, 760, { size: 46, color: COL, alpha: S.tp(tAvg, 0.8) });
          g.text('weights share the credit', 126, 806, { size: 22, color: PAL.ink2, alpha: S.tp(tAvg + 0.6, 0.8) });
          // Prediction curves and their weighted average.
          const B = g.axes({ x: 760, y: 330, w: 520, h: 420, xlab: 'Elk density', ylab: 'Aspen recruitment', labSize: 22, progress: S.tp(tW + 0.4, 1.0) });
          D.models.forEach((m, i) => g.plot(B, m.f, { color: m.col, w: 2.4, alpha: 0.35 + 0.9 * m.w, progress: S.tp(tRank - 0.4 + i * 0.25, 0.9) }));
          const pa = S.tp(tAvg, 1.4);
          if (pa > 0) {
            g.plot(B, D.avg, { color: COL, w: 9, alpha: 0.18, progress: pa });
            const tip = g.plot(B, D.avg, { color: COL, w: 4.5, progress: pa });
            if (tip) g.dot(tip[0], tip[1], 7, COL, 1, 3);
            const la = S.tp(tAvg + 1.0, 0.7);
            g.line(B.X(0.5), B.Y(D.avg(0.5)) + 10, B.X(0.5), B.Y(0.16), { color: COL, w: 1.5, alpha: la, progress: la });
            g.text('model-averaged prediction', B.X(0.5), B.Y(0.16) + 28, { size: 22, color: COL, align: 'center', alpha: la });
          }
        });

        // ---- Beat 3: scale dissolves a contradiction --------------------------------------
        const aZ = S.p(2, 0.9);
        if (aZ > 0) g.withAlpha(aZ, () => {
          const PX = 100, PY = 240, PW = 680, PH = 640;
          const tCar = cue(S, 2, 'through carrion'), tKill = cue(S, 2, 'kill them'), tLess = cue(S, 2, 'Studies covering'), tPos = cue(S, 2, 'tend to find positive'), tNeg = cue(S, 2, 'larger studies'), tBoth = cue(S, 2, 'Both are right');
          const zp = ease.inOut(clamp((t - tKill - 0.3) / 3.2)); const Z = Math.exp(lerp(Math.log(5), 0, zp));
          const cx = lerp(D.carc[0], PW / 2, zp), cy = lerp(D.carc[1], PH / 2, zp);
          const SX = (x) => PX + PW / 2 + (x - cx) * Z, SY = (y) => PY + PH / 2 + (y - cy) * Z;
          g.rect(PX, PY, PW, PH, { r: 12, fill: 'rgba(21,19,39,0.6)', stroke: PAL.rule, w: 1.5 });
          g.clip(PX, PY, PW, PH, () => {
            const both = S.tp(tBoth, 0.6) * (0.6 + 0.4 * Math.sin((t - tBoth) * 4));
            D.terr.forEach((T) => g.poly(T.pts.map(([x, y]) => [SX(x), SY(y)]), { color: PAL.coral, w: 2.2, dash: [10, 8], fill: U.rgba(PAL.coral, 0.06 + 0.08 * zp + 0.06 * both), alpha: 0.85 }));
            // The 1,000 km² threshold, shown at true scale.
            const half = 102 * Z; const qx = SX(D.carc[0]), qy = SY(D.carc[1]);
            g.rect(qx - half, qy - half, 2 * half, 2 * half, { stroke: PAL.ink2, w: 2, dash: [5, 7], alpha: 0.9 });
            caps(g, '1,000 km²', qx - half + 10, qy - half + 26, { color: PAL.ink, alpha: clamp((2.4 - Z) / 0.8) });
            D.meso.forEach(([x, y]) => g.dot(SX(x), SY(y), 5, PAL.clay, 0.9, 2.2));
            // Carcass and scavengers (icons up close, dots from afar).
            const ic = clamp((Z - 1.8) / 1.4), gather = S.tp(tCar - 0.6, 1.6);
            g.icon('elk', qx, qy + 4 * Z, 15 * Z, PAL.ink3, { rot: Math.PI, alpha: Math.max(0.5, ic) });
            D.scav.forEach(([k, ox, oy, flip, meso], j) => {
              const sp = lerp(2.3, 1, ease.out(clamp(gather * 1.3 - j * 0.06))); const x = D.carc[0] + ox * sp, y = D.carc[1] + oy * sp;
              const a = S.tp(tCar - 0.8 + j * 0.15, 0.6);
              if (ic > 0) g.icon(k, SX(x), SY(y), (k === 'bird' ? 8 : 11) * Z, meso ? PAL.clay : PAL.ink2, { alpha: a * ic, flip, flap: 0.5 + 0.5 * Math.sin(t * 6 + j) });
              if (meso && ic < 1) g.dot(SX(x), SY(y), 5, PAL.clay, a * (1 - ic), 2.2);
            });
            g.icon('wolf', SX(D.carc[0] + 54), SY(D.carc[1] - 30), 13 * Z, PAL.coral, { flip: true, alpha: S.p(2, 0.8, 0.4) * Math.max(ic, 0) });
            g.circle(qx, qy, 40 * Z + 8, { stroke: PAL.moss, w: 2.4, alpha: S.tp(tCar, 0.6) * (0.35 + 0.65 * both) });
          });
          g.withAlpha(S.tp(tCar, 0.7), () => g.pill('+ carrion feeds scavengers nearby', PX + 18, PY + 34, { size: 21, color: PAL.moss, fill: U.rgba(PAL.bg, 0.85), stroke: PAL.moss }));
          g.withAlpha(S.tp(tKill + 2.6, 0.7), () => g.pill('− fewer inside wolf territories', PX + 18, PY + PH - 34, { size: 21, color: PAL.coral, fill: U.rgba(PAL.bg, 0.85), stroke: PAL.coral }));
          // Right, first: the apparent contradiction.
          const aCon = S.p(2, 0.8, 0.4) * (1 - S.tp(tLess - 0.6, 0.6));
          if (aCon > 0) g.withAlpha(aCon, () => {
            caps(g, 'two literatures', 880, 262);
            const cardC = (y, sign, txt, col, a) => g.withAlpha(a, () => {
              g.rect(880, y, 400, 132, { r: 10, fill: U.rgba(col, 0.08), stroke: U.rgba(col, 0.6), w: 1.6 });
              g.text(sign, 914, y + 84, { size: 58, role: 'display', color: col, align: 'center' });
              g.wrap(txt, 952, y + 50, 310, { size: 23, color: PAL.ink, lh: 1.3 });
            });
            cardC(310, '+', 'More mesocarnivores where large carnivores are', PAL.moss, S.p(2, 0.7, 0.6));
            cardC(530, '−', 'Fewer mesocarnivores where large carnivores are', PAL.coral, S.p(2, 0.7, 1.2));
            g.text('a contradiction?', 1080, 494, { size: 26, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.p(2, 0.7, 1.8) });
            g.wrap('Both relationships are real: carrion feeds them up close, and large carnivores kill them across landscapes.', 880, 712, 400, { size: 21, color: PAL.ink2, lh: 1.32, alpha: S.tp(tKill + 0.4, 0.8) });
          });
          // Right: sign of association against study extent.
          const C = g.axes({ x: 900, y: 340, w: 380, h: 400, xmin: 10, xmax: 100000, logx: true, ymin: -1, ymax: 1, ylab: 'Association', labSize: 21, progress: S.tp(tLess - 0.3, 1.0), xticks: [{ v: 100, l: '100' }, { v: 1000, l: '1,000' }, { v: 10000, l: '10,000' }] });
          const aC = S.tp(tLess - 0.3, 0.8);
          if (aC > 0) {
            caps(g, 'mesocarnivores vs large carnivores', 900, 262, { alpha: aC });
            g.text('Study extent (km²)', 1280, 808, { size: 21, color: PAL.ink2, align: 'right', alpha: aC });
            caps(g, 'stylized', 1280, 300, { align: 'right', alpha: aC });
            g.line(C.X(10), C.Y(0), C.X(100000), C.Y(0), { color: PAL.ink3, w: 1.2, dash: [4, 6], alpha: aC });
            g.text('+', C.X(10) + 14, C.Y(0.82), { size: 34, color: PAL.moss, alpha: aC });
            g.text('−', C.X(10) + 14, C.Y(-0.72), { size: 34, color: PAL.coral, alpha: aC });
            const both = S.tp(tBoth, 0.7);
            g.rect(C.X(10), C.y, C.X(1000) - C.X(10), C.h, { fill: U.rgba(PAL.moss, 0.1 * both) });
            g.rect(C.X(1000), C.y, C.X(100000) - C.X(1000), C.h, { fill: U.rgba(PAL.coral, 0.1 * both) });
            g.line(C.X(1000), C.y - 6, C.X(1000), C.y + C.h, { color: COL, w: 2.4, dash: [8, 6], progress: S.tp(tLess + 0.6, 0.8) });
            g.text('1,000 km²', C.X(1000) + 8, C.y + 18, { size: 21, color: COL, alpha: S.tp(tLess + 1.0, 0.6) });
            D.studies.forEach(([x, v], k) => { const a = S.tp((v > 0 ? tPos : tNeg) + (v > 0 ? k : k - 7) * 0.12, 0.5); g.dot(C.X(x), C.Y(v), 6.5, v > 0 ? PAL.moss : PAL.coral, a, 2.4); });
            g.withAlpha(both, () => {
              g.text('local', (C.X(10) + C.X(1000)) / 2, C.y + C.h + 108, { size: 24, color: PAL.moss, align: 'center' });
              g.text('broad', (C.X(1000) + C.X(100000)) / 2, C.y + C.h + 108, { size: 24, color: PAL.coral, align: 'center' });
              g.text('Both right, at their own scale.', 1090, 880, { size: 28, role: 'display', italic: true, color: PAL.ink, align: 'center' });
            });
          }
        });
      },
      terms: [
        { beat: 0.4, term: 'Theoretical virtues', def: 'Non-empirical criteria such as simplicity, scope, fruitfulness, and coherence used to choose among theories that fit the data.' },
        { beat: 1.55, term: 'Multimodel inference', def: 'Ranking and averaging a set of candidate models by information criteria such as AIC, rather than selecting one (Burnham and Anderson).' },
        { beat: 2.55, term: 'Scale dependence', def: 'The direction or strength of an ecological relationship changes with the spatial or temporal scale of study (Wiens; Levin).' },
      ],
    },
  ],
});
})();
