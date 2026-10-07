/* Prologue: the viral wolf story, and the three bands that sort it out.
 * Script fields: beats[].t caption text, .s speech override, .cite on-screen source, .v storyboard note.
 * Scene .register: 'observe' | 'infer' | 'claim' | 'all' | null (badge state). */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the caption).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const lin = (t, t0, d) => clamp((t - t0) / d);
const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const REGC = Theater.REG;

// Fine-line ridgelines: crest polylines (drawn live) plus engraved hatching and soft
// occlusion pre-rendered once to an offscreen canvas.
function buildRidges(spec, x0, x1, seed, o = {}) {
  const yMax = o.yMax ?? 1080;
  const layers = spec.map((L, i) => {
    const s = seed + i * 13;
    const y = (x) => {
      const u = x / L.scale;
      let v = 0.6 * U.noise1(u + i * 4.3, s) + 0.28 * U.noise1(u * 2.7 + 1.7, s + 5) + 0.12 * U.noise1(u * 7.9 + 3.1, s + 9);
      if (L.peaks) { const n = U.noise1(u * 1.7 + 0.4, s + 17); v += L.peaks * Math.pow(Math.max(0, 1 - n * n * 2.2), 3); }
      return L.base - L.amp * v;
    };
    const pts = []; for (let x = x0; x <= x1 + 0.1; x += 5) pts.push([x, y(x)]);
    return { ...L, pts, y };
  });
  const c = o.canvas || Theater.makeCanvas(1920, 1080); const ctx = c.getContext('2d'); ctx.lineCap = 'round';
  const r = U.rng(seed + 7);
  layers.forEach((L, i) => {
    if (i > 0) {
      const top = L.base - L.amp * 1.2, oc = L.occ ?? 0.42; const gr = ctx.createLinearGradient(0, top, 0, yMax);
      gr.addColorStop(0, `rgba(14,13,26,${oc})`); gr.addColorStop(0.6, `rgba(14,13,26,${oc})`); gr.addColorStop(1, 'rgba(14,13,26,0)');
      ctx.beginPath(); ctx.moveTo(x0, yMax); L.pts.forEach(([x, yy]) => ctx.lineTo(x, yy)); ctx.lineTo(x1, yMax); ctx.closePath(); ctx.fillStyle = gr; ctx.fill();
    }
    ctx.strokeStyle = U.rgba(L.hatch || PAL.ink2, L.ha ?? 0.26); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = x0 + 3; x < x1 - 3; x += L.hstep || 5) {
      const slope = (L.y(x + 3) - L.y(x - 3)) / 6; if (slope < 0.05) continue;
      const len = Math.min(L.hmax || 60, 6 + 80 * slope) * (0.75 + 0.5 * r()); const yc = L.y(x);
      ctx.moveTo(x, yc + 3); ctx.lineTo(x + len * 0.22, Math.min(yMax, yc + 3 + len));
    }
    ctx.stroke();
    // A few dark conifers on the mid slopes.
    if (L.trees) for (let k = 0; k < L.trees; k++) { const x = x0 + r() * (x1 - x0); const yy = L.y(x) + 6 + r() * 26; Theater.drawIcon(ctx, 'conifer', x, yy, 12 + r() * 9, U.rgba(PAL.ink3, 0.55)); }
  });
  return { layers, img: c };
}
function drawRidges(g, R, p, a = 1) {
  if (a <= 0 || p <= 0) return;
  g.withAlpha(a, () => {
    g.withAlpha(ease.inOut(p * 1.15 - 0.15), () => g.ctx.drawImage(R.img, 0, 0));
    R.layers.forEach((L, i) => g.poly(L.pts, { color: L.color, w: L.w, alpha: L.a, progress: clamp(p * 1.25 - i * 0.08) }));
  });
}

// A trail of paw prints along a path, resampled at a fixed stride (perspective scale by y).
function makeTrail(pts, stride, sc) {
  const dense = []; for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 12; j++) { const f = j / 12; dense.push([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]); }
  dense.push(pts[pts.length - 1]);
  const cum = [0]; for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1] + Math.hypot(dense[k][0] - dense[k - 1][0], dense[k][1] - dense[k - 1][1]));
  const L = cum[cum.length - 1];
  const at = (d) => { d = clamp(d, 0, L); let k = 1; while (k < cum.length - 1 && cum[k] < d) k++; const f = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]); const [ax, ay] = dense[k - 1], [bx, by] = dense[k]; return { x: lerp(ax, bx, f), y: lerp(ay, by, f), ang: Math.atan2(by - ay, bx - ax) }; };
  const prints = []; for (let d = stride * 0.5, i = 0; d < L; d += stride, i++) { const q = at(d); const s = sc(q.y); const side = i % 2 ? 1 : -1; prints.push({ d, s, ang: q.ang, x: q.x - Math.sin(q.ang) * side * 7 * s, y: q.y + Math.cos(q.ang) * side * 7 * s }); }
  return { prints, L, at };
}
function drawTrail(g, T, head, col, o = {}) {
  const size = o.size || 19, a = o.alpha ?? 1; if (a <= 0) return;
  for (const p of T.prints) {
    if (p.d > head - (o.lag ?? 10)) break;
    const age = clamp((head - p.d) / (o.fade || 700));
    g.icon('track', p.x, p.y, size * p.s, col, { rot: p.ang + Math.PI / 2, alpha: a * (0.85 - 0.45 * age) });
  }
}

// A minimal standing person (people and management are violet).
function person(g, x, y, s, col, a = 1) {
  g.circle(x, y - s * 0.78, s * 0.15, { fill: col, alpha: a });
  g.with(() => { const c = g.ctx; c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x - s * 0.22, y); c.lineTo(x - s * 0.2, y - s * 0.42); c.quadraticCurveTo(x - s * 0.2, y - s * 0.6, x, y - s * 0.6); c.quadraticCurveTo(x + s * 0.2, y - s * 0.6, x + s * 0.2, y - s * 0.42); c.lineTo(x + s * 0.22, y); c.closePath(); c.fill(); });
}

// The viral story as four luminous medallions: wolf, fleeing elk, rising aspen and willow, a bending river.
const VIG = [
  { c: PAL.coral, lab: 'Wolves return' },
  { c: PAL.sand, lab: 'Elk take fright' },
  { c: PAL.moss, lab: 'Willow and aspen regrow' },
  { c: PAL.lagoon, lab: 'Rivers change course' },
];
function vignette(g, k, cx, cy, r, a, p, t) {
  if (a <= 0) return; const col = VIG[k].c; const ctx = g.ctx; const s = r / 130; const gy = cy + 0.44 * r; const P = ease.inOut(p);
  g.withAlpha(a, () => {
    g.glow(cx, cy, r * 1.7, col, 0.2);
    g.circle(cx, cy, r, { fill: 'rgba(16,14,30,0.78)' });
    g.circle(cx, cy, r, { fill: U.rgba(col, 0.08) });
    g.with(() => {
      ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.clip();
      const hill = []; for (let j = 0; j <= 24; j++) { const u = j / 24; hill.push([cx - r + 2 * r * u, cy + 0.08 * r - 0.16 * r * Math.sin(u * 3.1 + k) * Math.sin(u * 1.7 + 0.6)]); }
      if (k !== 3) { g.poly(hill, { color: PAL.ink3, w: 1.2, alpha: 0.55 }); g.line(cx - r, gy, cx + r, gy, { color: PAL.ink2, w: 1.6, alpha: 0.6 }); }
      if (k === 0) {
        const sz = 0.9 * r, x = cx - 0.04 * r + 0.06 * r * Math.sin(t * 0.9), bob = 2.5 * s * Math.abs(Math.sin(t * 5.5));
        for (let j = 0; j < 4; j++) g.icon('track', x - 0.42 * r - j * 0.2 * r, gy + 0.12 * r + (j % 2 ? 4 : -4) * s, 13 * s, col, { rot: Math.PI / 2, alpha: 0.55 - j * 0.1 });
        g.glow(x + 0.2 * sz, gy - 0.4 * sz, 0.7 * sz, col, 0.25);
        g.icon('wolf', x, gy - 0.46 * sz - bob, sz, col);
      } else if (k === 1) {
        const run = (ex, ey, sz, ph) => {
          const bob = 4 * s * Math.abs(Math.sin(t * 7.5 + ph));
          for (let j = 0; j < 3; j++) g.line(ex - 0.55 * sz - j * 0.04 * sz, ey - 0.12 * sz + j * 0.12 * sz, ex - (0.9 + 0.12 * j) * sz, ey - 0.12 * sz + j * 0.12 * sz, { color: PAL.ink2, w: 1.6, alpha: 0.5 });
          for (let j = 0; j < 4; j++) g.circle(ex - 0.45 * sz - j * 9 * s, ey + 0.4 * sz - Math.abs(Math.sin(t * 3 + j)) * 10 * s, 2.2 * s, { fill: PAL.snow, alpha: 0.4 });
          g.icon('elk', ex, ey - bob, sz, col, { rot: -0.05 });
        };
        run(cx - 0.42 * r + 0.12 * r * P, gy - 0.4 * 0.5 * r - 0.1 * r, 0.5 * r, 1.3);
        run(cx + 0.08 * r + 0.16 * r * P, gy - 0.46 * 0.8 * r, 0.8 * r, 0);
      } else if (k === 2) {
        const gr = (d) => lerp(0.15, 1, ease.out(clamp(p * 1.3 - d)));
        [[-0.5, 0.62, 0], [-0.08, 0.86, 0.12], [0.36, 0.7, 0.22]].forEach(([dx, h, d]) => { const sz = h * r * gr(d); g.icon('aspen', cx + dx * r, gy - 0.52 * sz, sz, col); });
        [[-0.3, 0.42, 0.3], [0.14, 0.48, 0.38], [0.62, 0.4, 0.45]].forEach(([dx, h, d]) => { const sz = h * r * gr(d); g.icon('willow', cx + dx * r, gy - 0.5 * sz, sz, PAL.mint, { alpha: 0.9 }); });
        g.glow(cx, gy - 0.5 * r, 0.8 * r, col, 0.18 * P);
      } else {
        const amp = lerp(0.03, 0.3, P) * r; const pts = [];
        for (let j = 0; j <= 60; j++) { const u = j / 60; pts.push([cx - r + 2 * r * u, cy + 0.05 * r + amp * Math.sin(u * Math.PI * 2.2 + 0.4)]); }
        g.line(cx - r, cy + 0.05 * r, cx + r, cy + 0.05 * r, { color: PAL.ink3, w: 1.4, dash: [6, 7], alpha: 0.6 * P });
        g.poly(pts, { color: U.rgba(col, 0.22), w: 26 * s });
        g.poly(pts, { color: col, w: 3.5 * s });
        for (let j = 0; j < 5; j++) { const u = ((t * 0.08 + j / 5) % 1); const q = pts[Math.floor(u * 60)]; g.dot(q[0], q[1], 2.6 * s, PAL.snow, 0.6, 2.2); }
        for (const [u, sd] of [[0.18, -1], [0.52, 1], [0.84, -1]]) { const q = pts[Math.round(u * 60)]; g.icon('willow', q[0], q[1] + sd * 0.2 * r - 0.1 * r, 0.26 * r, PAL.mint, { alpha: 0.75 * P }); }
      }
    });
    g.circle(cx, cy, r, { stroke: col, w: 2.4 });
    g.circle(cx, cy, r + 7, { stroke: col, w: 1, alpha: 0.32 });
  });
}

Theater.chapter({
  id: 'open', title: 'Prologue', color: PAL.sand, card: false,
  scenes: [
    {
      id: 'open-wolves', title: 'The Epistemic Theater', header: false, lead: 2.2, register: null,
      beats: [
        { t: 'In 1995 and 1996, sixty-six gray wolves were released into central Idaho and Yellowstone National Park, about seventy years after the last of Yellowstone’s wolves were killed. Their descendants now number at least twenty-eight hundred, across six states.',
          cite: 'Boyd et al. 2023; Wilmers et al. 2025',
          v: 'Title card fades up over a drawn Northern Range ridgeline; a line of wolf tracks crosses the snow; counter 66 → 2,800.' },
        { t: 'Within twenty years a story had traveled around the world. The wolves had frightened the elk, the willows and aspen had grown back, and even the rivers had changed their course.',
          v: 'The story as a chain of glowing vignettes: wolf, fleeing elk, aspen and willow rising, a river bending.' },
        { t: 'It is a beautiful story. Is it true?', pause: 1.0,
          v: 'Vignettes hold; the question sits alone, centered.' },
      ],
      init() {
        const R = buildRidges([
          { base: 566, amp: 58, scale: 170, peaks: 1.05, color: PAL.ink2, a: 0.55, w: 1.3, ha: 0.22, hmax: 60 },
          { base: 628, amp: 50, scale: 240, color: PAL.snow, a: 0.55, w: 1.5, trees: 30, occ: 0.3 },
          { base: 682, amp: 36, scale: 310, color: PAL.snow, a: 0.65, w: 1.7, trees: 16, occ: 0.3 },
          { base: 732, amp: 20, scale: 430, color: PAL.snow, a: 0.8, w: 2, ha: 0.18, hmax: 30, occ: 0.3 },
        ], -20, 1940, 1995, { yMax: 925 });
        // Snowfield: a faint cold sheen and sparse sage strokes below the nearest crest.
        const ctx = R.img.getContext('2d'); const r = U.rng(66); const near = R.layers[3];
        { const gr = ctx.createLinearGradient(0, 700, 0, 930); gr.addColorStop(0, U.rgba(PAL.snow, 0.07)); gr.addColorStop(1, U.rgba(PAL.snow, 0)); ctx.beginPath(); ctx.moveTo(-20, 940); near.pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(1940, 940); ctx.closePath(); ctx.fillStyle = gr; ctx.fill(); }
        ctx.strokeStyle = U.rgba(PAL.ink3, 0.32); ctx.lineWidth = 1.1; ctx.beginPath();
        for (let k = 0; k < 150; k++) { const x = r() * 1920; const y = near.y(x) + 14 + Math.pow(r(), 0.8) * 190; if (y > 905) continue; const h = 4 + (y - 700) * 0.04; for (let j = -1; j <= 1; j++) { ctx.moveTo(x + j * 2, y); ctx.lineTo(x + j * 3.5, y - h * (1 - 0.25 * Math.abs(j))); } }
        ctx.stroke();
        const sc = (y) => clamp(0.55 + (y - 700) / 260, 0.5, 1.05);
        const mainPts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; mainPts.push([lerp(500, 1990, u), 870 - 96 * u + 14 * Math.sin(u * 6.2) - 8 * Math.sin(u * 15)]); }
        const main = makeTrail(mainPts, 30, sc);
        // Descendants: five more lines branch from the first and fan toward the hills.
        const branches = [[0.1, 250], [0.25, 300], [0.42, 280], [0.6, 300], [0.78, 240]].map(([u, dx], j) => {
          const s0 = main.at(u * main.L); const ex = s0.x + dx, ey = near.y(ex) + 20; const pts = [];
          for (let k = 0; k <= 16; k++) { const f = k / 16; const bend = 34 * Math.sin(f * Math.PI) * (j % 2 ? 1 : -1); pts.push([lerp(s0.x, ex, f) + bend * 0.4, lerp(s0.y, ey, f) - bend * 0.3]); }
          return makeTrail(pts, 27, sc);
        });
        return { R, main, branches };
      },
      draw(g, t, S, D) {
        const b1 = S.p(1, 1.0), b2 = S.p(2, 0.9);
        // Landscape: the ridgeline draws in under the title, then recedes behind the story.
        drawRidges(g, D.R, ease.inOut((t - 0.1) / 3.4), 1 - 0.68 * b1 - 0.17 * b2);

        // Title.
        const tp = ease.out((t - 0.7) / 1.8), tOut = 1 - S.p(1, 0.8);
        g.text('The Epistemic Theater', 960, 268 + (1 - tp) * 18, { size: 150, role: 'display', color: PAL.ink, align: 'center', alpha: tp * tOut });
        caps(g, 'Philosophy of science for the comprehensive exam  ·  ecology & wildlife science', 960, 334, { size: 19, ls: 3.6, color: PAL.sand, align: 'center', alpha: ease.out((t - 1.5) / 1.6) * tOut });
        g.text('How we know what predators do', 960, 388, { size: 32, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: ease.out((t - 2.3) / 1.6) * tOut });

        // Release sites, pinned on the ridges as they are named.
        const tI = cue(S, 0, 'central Idaho'), tY = cue(S, 0, 'Yellowstone National');
        [[420, tI, 'Central Idaho'], [1400, tY, 'Yellowstone']].forEach(([x, t0, lab]) => {
          const a = S.tp(t0, 0.7) * tOut; if (a <= 0) return; const y = D.R.layers[1].y(x);
          g.line(x, y - 4, x, y - 40, { color: PAL.coral, w: 1.4, alpha: 0.7 * a });
          g.dot(x, y - 2, 4.5, PAL.coral, a, 3);
          caps(g, lab, x, y - 50, { color: PAL.coral, align: 'center', alpha: a });
        });

        // Wolf tracks crossing the snow, led by a walking wolf.
        const trA = 1 - 0.75 * b1;
        const tTr = cue(S, 0, 'released'); const mp = ease.inOut(lin(t, tTr - 0.6, 10.5)); const head = mp * D.main.L;
        if (mp > 0) {
          drawTrail(g, D.main, head, PAL.coral, { alpha: trA, size: 25 });
          const q = D.main.at(head); const sz = 66 * clamp(0.55 + (q.y - 700) / 260, 0.5, 1.05); const bob = 2.2 * Math.abs(Math.sin(t * 6));
          const wa = S.tp(tTr - 0.6, 0.6) * trA * (mp < 1 ? 1 : 0);
          g.glow(q.x, q.y - sz * 0.4, sz * 1.1, PAL.coral, 0.22 * wa);
          g.icon('wolf', q.x, q.y - 0.46 * sz - bob, sz, PAL.coral, { rot: q.ang * 0.7, alpha: wa });
        }
        const tD = cue(S, 0, 'Their descendants'), tN = cue(S, 0, 'twenty-eight hundred');
        D.branches.forEach((B, j) => { const bp = ease.inOut(lin(t, tD + 0.3 + j * 0.45, 3.2)); if (bp <= 0) return; const h = bp * B.L; drawTrail(g, B, h, PAL.coral, { alpha: trA * 0.8, size: 20, fade: 360 }); const q = B.at(h); g.dot(q.x, q.y, 3.4, PAL.coral, trA * (1 - 0.6 * ease.inOut(lin(t, tD + 3.5 + j * 0.45, 1.2))), 3.4); });

        // Counter: 66 released, at least 2,800 descendants.
        const tR = cue(S, 0, 'sixty-six'), t70 = cue(S, 0, 'about seventy'), tSix = cue(S, 0, 'across six');
        const cA = S.tp(tR - 0.2, 0.8) * (1 - S.p(1, 0.7));
        const xph = S.tp(tD, 0.8); const roll = ease.inOut(lin(t, tN - 0.6, 2.6));
        const n = 66 * Math.pow(2800 / 66, roll);
        caps(g, 'Gray wolves released  ·  1995–96', 120, 756, { color: PAL.coral, alpha: cA * (1 - xph) });
        caps(g, 'Their descendants today, at least', 120, 756, { color: PAL.coral, alpha: cA * xph });
        g.text(commas(roll >= 1 ? 2800 : roll <= 0 ? 66 : Math.round(n / 10) * 10 || 66), 114, 862, { size: 124, role: 'display', color: PAL.ink, alpha: cA });
        g.text('about 70 years after the last Yellowstone wolves were killed', 122, 902, { size: 22, italic: true, color: PAL.ink2, alpha: cA * S.tp(t70, 0.8) * (1 - xph) });
        g.text('across six states', 122, 902, { size: 22, italic: true, color: PAL.ink2, alpha: cA * S.tp(tSix, 0.8) });

        // Beat 2 → 3: the story as a chain of glowing vignettes.
        const tW = cue(S, 1, 'a story'), cues = [cue(S, 1, 'The wolves had'), cue(S, 1, 'frightened the elk'), cue(S, 1, 'the willows'), cue(S, 1, 'even the rivers')];
        const gA = S.tp(tW - 0.3, 0.9) * (1 - b2);
        if (gA > 0) g.withAlpha(gA, () => {
          const gx = 960, gy = 292, gr = 64; const ph = t * 0.35;
          g.glow(gx, gy, gr * 2.2, PAL.sand, 0.18);
          g.circle(gx, gy, gr, { stroke: PAL.sand, w: 2 });
          for (let m = 0; m < 4; m++) { const c = Math.cos(ph + m * Math.PI / 4); g.ellipse(gx, gy, Math.abs(c) * gr, gr, { stroke: PAL.sand, w: 1, alpha: 0.45 }); }
          for (const yy of [-0.5, 0, 0.5]) { const w = gr * Math.sqrt(1 - yy * yy); g.line(gx - w, gy + yy * gr, gx + w, gy + yy * gr, { color: PAL.sand, w: 1, alpha: 0.4 }); }
          const oa = t * 0.9; g.dot(gx + Math.cos(oa) * gr * 1.35, gy + Math.sin(oa) * gr * 0.42, 4, PAL.ochre, 1, 3);
          for (let j = 0; j < 4; j++) { const ph = ((t - tW) * 0.32 + j / 4) % 1; if (t < tW + j * 0.8) continue; g.ellipse(gx, gy, gr + ph * 380, (gr + ph * 380) * 0.42, { stroke: PAL.sand, w: 1.4, alpha: 0.38 * (1 - ph) }); }
          caps(g, 'Within twenty years, a story traveled the world', 960, 404, { size: 19, ls: 3.2, color: PAL.sand, align: 'center' });
        });
        const k2 = ease.inOut(S.lin(2, 1.4));
        const R0 = lerp(128, 84, k2), cy = lerp(588, 336, k2);
        const xs = [0, 1, 2, 3].map((i) => 960 + (i - 1.5) * lerp(424, 290, k2));
        for (let i = 0; i < 3; i++) {
          const a = S.tp(cues[i + 1], 0.8) * (1 - 0.45 * b2);
          g.arrow(xs[i] + R0 + 16, cy, xs[i + 1] - R0 - 16, cy, { color: PAL.ink2, w: 2, head: 12, alpha: a, progress: S.tp(cues[i + 1] - 0.2, 0.8) });
        }
        const pulse = ((t - cues[3]) / 2.6) % 1; if (t > cues[3] + 0.8 && b2 < 1) { const seg = Math.floor(pulse * 3), f = (pulse * 3) % 1; const x = lerp(xs[seg] + R0 + 16, xs[seg + 1] - R0 - 16, f); g.dot(x, cy, 4, PAL.sand, (1 - b2) * Math.sin(f * Math.PI), 3.5); }
        cues.forEach((c0, i) => {
          const a = S.tp(c0, 0.9) * (1 - 0.5 * b2); if (a <= 0) return;
          vignette(g, i, xs[i], cy + (1 - S.tp(c0, 0.9)) * 18, R0, a, lin(t, c0, 4.5), t);
          g.text(VIG[i].lab, xs[i], cy + R0 + 54, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: a * (1 - k2) });
        });

        // The question, alone.
        const tQ = cue(S, 2, 'Is it true');
        g.text('It is a beautiful story.', 960, 570, { size: 46, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.p(2, 0.9, 0.2) * (1 - S.tp(tQ + 0.4, 1.0)) });
        const qa = S.tp(tQ, 1.1);
        g.glow(960, 640, 300, PAL.sand, 0.1 * qa);
        g.text('Is it true?', 960, 690 + (1 - qa) * 16, { size: 136, role: 'display', color: PAL.ink, align: 'center', alpha: qa });
      },
    },
    {
      id: 'open-bands', title: 'Observe, infer, claim', register: 'all',
      beats: [
        { t: 'To answer, we have to pull apart three things that are easy to blur. What did anyone actually observe? What was inferred from those observations, and under which assumptions? And what are we entitled to claim we know?',
          v: 'The story chain splits into three stacked bands, Observe, Infer, Claim, each lit as it is named.' },
        { t: 'Ecologists have argued over those answers for a quarter of a century, counting elk, measuring aspen, and collaring predators. The argument is one of the best lessons there is in how science works.',
          v: 'Field-notebook icons drop into the bands: tally marks, a measuring pole, a GPS collar, an exclosure fence, journal pages.' },
        { t: 'So this film follows predators, and what they do and do not do to the world around them, through the philosophy of science: what science is trying to do, how we can know anything about nature, induction and falsification, paradigms and models, causes and confounders, Bayesian belief, and replication.',
          v: 'Chapter names unfold along a trail of tracks, one per stride.' },
        { t: 'And we will ask a harder question: what counts as science, and who gets to decide?', pause: 0.8,
          v: 'Two tinted lenses slide across the landscape and overlap; a dividing line is drawn and redrawn between them.' },
        { t: 'Two guides will help. The badge in the corner shows whether an idea concerns observation, inference, or claim. The lexicon on the right collects the terms an examiner may ask you to define.', pause: 1.2,
          v: 'Register badge appears top right and cycles through its three bands; the demo lexicon card slides in.' },
      ],
      terms: [{ beat: 4.55, demo: true, term: 'Lexicon', def: 'Key terms appear here as they are introduced. All of them are collected, with sources, in the companion study guide.' }],
      init() {
        // The Northern Range panel for the film's itinerary (beats 3–4).
        const PX = 110, PY = 292, PW = 660, PH = 560;
        const c = Theater.makeCanvas(1920, 1080);
        const R = buildRidges([
          { base: 392, amp: 36, scale: 120, peaks: 0.8, color: PAL.ink2, a: 0.5, w: 1.2, ha: 0.2, hmax: 40 },
          { base: 452, amp: 26, scale: 170, color: PAL.snow, a: 0.55, w: 1.4, trees: 10 },
          { base: 512, amp: 18, scale: 240, color: PAL.snow, a: 0.7, w: 1.6, trees: 5, hmax: 30 },
        ], PX, PX + PW, 1872, { canvas: c, yMax: PY + PH });
        const ctx = c.getContext('2d'); const r = U.rng(31); const near = R.layers[2];
        const rv = (u) => PY + 480 - 150 * u + 34 * Math.sin(u * 8.5);
        const river = []; for (let k = 0; k <= 80; k++) { const u = k / 80; river.push([PX + PW * u, rv(u)]); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = U.rgba(PAL.lagoon, 0.2); ctx.lineWidth = 18; ctx.beginPath(); river.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.strokeStyle = U.rgba(PAL.lagoon, 0.85); ctx.lineWidth = 2.6; ctx.stroke();
        for (let k = 0; k < 18; k++) { const u = 0.04 + 0.92 * (k + r() * 0.5) / 18; const x = PX + PW * u; const sd = k % 2 ? 1 : -1; Theater.drawIcon(ctx, 'willow', x, rv(u) + sd * 16 - 12, 22 + r() * 10, U.rgba(PAL.mint, 0.75)); }
        for (let k = 0; k < 10; k++) { const x = PX + 450 + r() * 190; const y = near.y(x) + 34 + r() * 26; Theater.drawIcon(ctx, 'aspen', x, y, 30 + r() * 16, U.rgba(PAL.moss, 0.85)); }
        ctx.strokeStyle = U.rgba(PAL.ink3, 0.3); ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < 80; k++) { const x = PX + 10 + r() * (PW - 20); const y = near.y(x) + 20 + r() * (PY + PH - near.y(x) - 30); for (let j = -1; j <= 1; j++) { ctx.moveTo(x + j * 2, y); ctx.lineTo(x + j * 3, y - 6); } }
        ctx.stroke();
        const wolfPts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; wolfPts.push([PX + 20 + 410 * u, PY + 326 + 16 * Math.sin(u * 4)]); }
        const wolf = makeTrail(wolfPts, 21, () => 0.78);
        // The chapter trail, two prints per chapter, walking down beside the chapter list.
        const tp = []; for (let k = 0; k <= 28; k++) { tp.push([852 + 9 * Math.sin(k * 0.45), 240 + k * 23]); }
        const trail = makeTrail(tp, 23, () => 1);
        const person = [PX + 492, near.y(PX + 492) + 2];
        return { R, PX, PY, PW, PH, wolf, trail, person };
      },
      draw(g, t, S, D) {
        const REG = g.REG;
        // Band geometry (matches g.bands).
        const BX = 100, BY = 236, BW = 1210, BH = 650, gap = BH * 0.06, bh = (BH - 2 * gap) / 3;
        const band = { claim: BY + bh / 2, infer: BY + bh + gap + bh / 2, observe: BY + 2 * (bh + gap) + bh / 2 };
        const top = (k) => band[k] - bh / 2;
        const out2 = 1 - S.p(2, 0.8);

        // Beat 1: the story chain, then the split into three strands and bands.
        const tSplit = cue(S, 0, 'pull apart');
        const chainA = S.p(0, 0.6) * (1 - ease.inOut(lin(t, tSplit, 1.1)));
        if (chainA > 0) {
          const xs = [0, 1, 2, 3].map((i) => 705 + (i - 1.5) * 290);
          for (let i = 0; i < 3; i++) g.arrow(xs[i] + 78, 561, xs[i + 1] - 78, 561, { color: PAL.ink2, w: 2, head: 11, alpha: chainA });
          xs.forEach((x, i) => vignette(g, i, x, 561, 64, chainA, 1, t));
          g.text('the story, all of a piece', 705, 700, { size: 30, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: chainA });
        }
        const sp = ease.inOut(lin(t, tSplit + 0.2, 1.6)); const bA = ease.out(lin(t, tSplit + 1.3, 0.9));
        if (sp > 0 && bA < 1) ['claim', 'infer', 'observe'].forEach((k) => { const y = lerp(561, band[k], sp); g.line(lerp(705, BX, sp), y, lerp(705, BX + BW, sp), y, { color: REG[k].color, w: 3, alpha: 1 - bA }); });
        const named = [['observe', cue(S, 0, 'actually observe')], ['infer', cue(S, 0, 'was inferred')], ['claim', cue(S, 0, 'entitled to claim')]];
        const active = named.filter(([, c0]) => t >= c0 - 0.2).map(([k]) => k);
        const bandsA = bA * out2;
        if (bandsA > 0) {
          g.bands(BX, BY, BW, BH, { active, alpha: bandsA, labSize: 22, labPad: 24 });
          named.forEach(([k, c0]) => { const f = lin(t, c0 - 0.2, 1.6); if (f > 0 && f < 1) g.rect(BX - 4, top(k) - 4, BW + 8, bh + 8, { r: 8, stroke: REG[k].color, w: 2, alpha: bandsA * (1 - f) * 0.9 }); });
          const Q = { observe: 'What did anyone actually observe?', infer: 'What was inferred, and under which assumptions?', claim: 'What are we entitled to claim we know?' };
          named.forEach(([k, c0]) => {
            const a = bandsA * S.tp(c0, 0.8); if (a <= 0) return;
            const lines = g.lines(Q[k], 500, { role: 'display', size: 36, italic: true }); const y0 = band[k] - (lines.length - 1) * 22 + 12;
            lines.forEach((ln, j) => g.text(ln, 300, y0 + j * 44, { size: 36, role: 'display', italic: true, color: PAL.ink, alpha: a }));
          });
        }

        // Beat 2: field-notebook icons drop into the bands.
        const drop = (t0) => { const p = lin(t, t0, 0.9); return { a: ease.out(p * 1.6) * out2, dy: -(1 - ease.outBack(p)) * 70 }; };
        const tE = cue(S, 1, 'counting elk'), tA = cue(S, 1, 'measuring aspen'), tC = cue(S, 1, 'collaring'), tL = cue(S, 1, 'The argument');
        { // tally marks while counting elk
          const { a, dy } = drop(tE); if (a > 0) g.withAlpha(a, () => {
            const x0 = 846, y0 = top('observe') + 52 + dy; g.icon('elk', x0 + 52, y0 + 4, 54, PAL.sand);
            const n = Math.min(14, Math.floor(lin(t, tE + 0.4, 3.2) * 14));
            for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), j = i % 5; const gx = x0 + grp * 46; if (j < 4) g.line(gx + j * 8, y0 + 50, gx + j * 8 - 2, y0 + 92, { color: PAL.ink, w: 2.4 }); else g.line(gx - 6, y0 + 86, gx + 30, y0 + 58, { color: PAL.ink, w: 2.4 }); }
            caps(g, 'elk counts', x0 + 52, top('observe') + bh - 14, { align: 'center' });
          });
        }
        { // measuring pole beside an aspen
          const { a, dy } = drop(tA); if (a > 0) g.withAlpha(a, () => {
            const x0 = 1056, yb = top('observe') + bh - 36 + dy;
            g.icon('aspen', x0 - 30, yb - 0.52 * 108, 108, PAL.moss);
            for (let i = 0; i < 6; i++) g.rect(x0 + 12, yb - (i + 1) * 21, 10, 21, { fill: i % 2 ? PAL.ink : PAL.ochre });
            for (let i = 0; i <= 6; i++) g.line(x0 + 24, yb - i * 21, x0 + 32, yb - i * 21, { color: PAL.ink2, w: 1.4 });
            caps(g, 'aspen heights', x0 - 6, top('observe') + bh - 14, { align: 'center' });
          });
        }
        { // GPS collar on a predator
          const { a, dy } = drop(tC); if (a > 0) g.withAlpha(a, () => {
            const x0 = 1218, y0 = top('observe') + 86 + dy;
            g.icon('wolf', x0, y0, 92, PAL.coral);
            g.with(() => { const c = g.ctx; c.translate(x0 + 31, y0 - 4); c.rotate(-1.0); g.rect(-4, -12, 8, 24, { r: 3, fill: PAL.violet }); g.rect(-5, 9, 10, 8, { r: 2, fill: PAL.ink }); });
            for (let j = 0; j < 3; j++) { const ph = ((t * 0.9 + j / 3) % 1); g.circle(x0 + 30, y0 - 24, 10 + ph * 34, { stroke: PAL.violet, w: 1.8, alpha: (1 - ph) * 0.8, a0: -2.4, a1: -0.7 }); }
            caps(g, 'collars', x0 + 6, top('observe') + bh - 14, { align: 'center' });
          });
        }
        { // exclosure fence: willow tall inside, browsed outside
          const { a, dy } = drop(tL - 0.2); if (a > 0) g.withAlpha(a, () => {
            const x0 = 1040, yb = top('infer') + bh - 40 + dy; const fw = 150, fd = 46;
            g.icon('willow', x0 - fw / 2 - 50, yb - 0.5 * 34, 34, PAL.mint, { alpha: 0.7 });
            g.icon('willow', x0 + fw / 2 + 56, yb - 0.5 * 30, 30, PAL.mint, { alpha: 0.7 });
            g.icon('willow', x0, yb - 0.5 * 96 - 6, 96, PAL.mint);
            const P = [[x0 - fw / 2, yb], [x0 + fw / 2, yb], [x0 + fw / 2 + fd * 0.5, yb - fd * 0.45], [x0 - fw / 2 + fd * 0.5, yb - fd * 0.45]];
            const H = 74;
            [[0, 1], [1, 2], [3, 0]].forEach(([i, j]) => { for (const hh of [0.35, 0.7, 1]) g.line(P[i][0], P[i][1] - H * hh, P[j][0], P[j][1] - H * hh, { color: PAL.ink2, w: 1.3, alpha: 0.8 }); });
            P.forEach(([x, y]) => g.line(x, y, x, y - H, { color: PAL.ink, w: 2.6 }));
            caps(g, 'exclosure experiment', x0, top('infer') + bh - 12, { align: 'center' });
          });
        }
        { // journal pages, arguing
          const { a, dy } = drop(tL + 0.6); if (a > 0) g.withAlpha(a, () => {
            const x0 = 1060, y0 = top('claim') + 20 + dy;
            const page = (x, y, rot) => g.with(() => { const c = g.ctx; c.translate(x, y); c.rotate(rot); g.rect(-40, 0, 80, 104, { r: 3, fill: '#E9E1CB' }); g.rect(-29, 12, 46, 7, { fill: '#3A3350' }); for (let j = 0; j < 6; j++) g.line(-29, 30 + j * 11, 29 - (j === 5 ? 22 : 0), 30 + j * 11, { color: '#8C8399', w: 1.4 }); });
            page(x0 - 150, y0 + 6, -0.1); page(x0 + 150, y0 + 4, 0.08); page(x0, y0 - 2, 0.0);
            g.arrow(x0 - 96, y0 + 58, x0 - 52, y0 + 58, { color: PAL.rose, w: 2, head: 10, both: true });
            g.arrow(x0 + 52, y0 + 58, x0 + 96, y0 + 58, { color: PAL.rose, w: 2, head: 10, both: true });
            caps(g, 'a quarter century of argument', x0, top('claim') + bh - 14, { color: PAL.rose, align: 'center' });
          });
        }

        // Beats 3–4: the Northern Range, then two lenses and a line that will not stay put.
        const pA = vis(S, 2, 4, 1.0);
        const tP = cue(S, 2, 'follows predators');
        if (pA > 0) g.withAlpha(pA, () => {
          const { PX, PY, PW, PH } = D;
          caps(g, 'The Northern Range', PX, PY - 18);
          g.rect(PX, PY, PW, PH, { r: 6, stroke: PAL.rule, w: 1.4 });
          const lp = ease.inOut(S.lin(3, 2.2)), lA = S.p(3, 0.8);
          const cy = PY + 268, lr = 170, xP = lerp(PX - 60, PX + 250, lp), xI = lerp(PX + PW + 60, PX + 410, lp);
          g.clip(PX, PY, PW, PH, () => {
            g.ctx.drawImage(D.R.img, 0, 0);
            D.R.layers.forEach((L) => g.poly(L.pts, { color: L.color, w: L.w, alpha: L.a }));
            // a wolf crosses; the elk shift away
            const wp = ease.inOut(lin(t, tP, 6.5)); const head = wp * D.wolf.L; const q = D.wolf.at(head);
            [[300, 455, 46], [352, 466, 40], [404, 450, 44]].forEach(([x, y, sz], j) => { const flee = clamp((q.x - PX - x + 140) / 160); g.icon('elk', PX + x + flee * 40, PY + y - 5 * Math.abs(Math.sin(t * 6 + j)) * flee * (1 - flee), sz, PAL.sand); });
            drawTrail(g, D.wolf, head, PAL.coral, { size: 17, alpha: 0.9 });
            g.glow(q.x, q.y - 20, 50, PAL.coral, 0.2 * S.tp(tP, 0.6));
            g.icon('wolf', q.x, q.y - 0.46 * 52 - 2 * Math.abs(Math.sin(t * 6)) * (wp < 1 ? 1 : 0), 52, PAL.coral, { alpha: S.tp(tP, 0.6) });
            // what they do, and do not do
            const tDo = cue(S, 2, 'what they do'); const d1 = S.tp(tDo, 0.8), d2 = S.tp(tDo + 1.3, 0.8);
            g.carrow(PX + 420, PY + 352, PX + 392, PY + 418, -0.3, { color: PAL.coral, w: 2, dash: [6, 6], head: 11, alpha: 0.9 * d1, progress: S.tp(tDo, 1.1) });
            g.text('?', PX + 438, PY + 404, { size: 36, role: 'display', italic: true, color: PAL.coral, alpha: d1 });
            g.carrow(PX + 280, PY + 446, PX + 176, PY + 452, 0.3, { color: PAL.sand, w: 2, dash: [6, 6], head: 11, alpha: 0.9 * d2, progress: S.tp(tDo + 1.3, 1.1) });
            g.text('?', PX + 226, PY + 504, { size: 36, role: 'display', italic: true, color: PAL.sand, alpha: d2 });
            // Beat 4: two lenses slide in and overlap.
            if (lA > 0) {
              const LP = g.LENS.pos.color, LI = g.LENS.int.color;
              g.with(() => { const c = g.ctx; c.beginPath(); c.arc(xP, cy, lr, 0, Math.PI * 2); c.clip(); for (let k = -6; k <= 6; k++) { g.line(xP + k * 28, cy - lr, xP + k * 28, cy + lr, { color: LP, w: 1, alpha: 0.26 * lA }); g.line(xP - lr, cy + k * 28, xP + lr, cy + k * 28, { color: LP, w: 1, alpha: 0.26 * lA }); } });
              g.with(() => { const c = g.ctx; c.beginPath(); c.arc(xI, cy, lr, 0, Math.PI * 2); c.clip(); const [px, py] = [D.person[0] + (xI - (PX + 410)), D.person[1]]; person(g, px, py, 54, PAL.violet, lA); g.line(px - 4, py - 44, PX + 360, PY + 430, { color: LI, w: 1.6, dash: [4, 6], alpha: 0.8 * lA }); });
              g.lens('pos', xP, cy, lr, { alpha: lA, label: false });
              g.lens('int', xI, cy, lr, { alpha: lA, label: false });
            }
          });
          // lens names, and the line of demarcation drawn and redrawn
          const la = lA * (1 - S.p(4, 0.6));
          if (la > 0) {
            g.dot(PX + 8, PY + PH + 30, 5, g.LENS.pos.color, la, 2);
            caps(g, g.LENS.pos.short, PX + 24, PY + PH + 36, { color: g.LENS.pos.color, alpha: la });
            g.dot(PX + PW - 8, PY + PH + 30, 5, g.LENS.int.color, la, 2);
            caps(g, g.LENS.int.short, PX + PW - 24, PY + PH + 36, { color: g.LENS.int.color, align: 'right', alpha: la });
            const t1 = cue(S, 3, 'what counts'), t2 = cue(S, 3, 'who gets'), t3 = S.e(3) + 0.35; const mx = (xP + xI) / 2;
            const L = [[[mx, PY + 64], [mx, PY + 486], t1], [[mx - 40, PY + 70], [mx + 44, PY + 480], t2], [[mx + 38, PY + 66], [mx - 34, PY + 484], t3]];
            L.forEach(([p0, p1, t0], j) => {
              const nxt = L[j + 1]; const a = la * (nxt ? 1 - S.tp(nxt[2] - 0.1, 0.45) : 1); if (a <= 0) return;
              g.line(p0[0], p0[1], p1[0], p1[1], { color: PAL.ink, w: 2.6, dash: [12, 8], alpha: a, progress: S.tp(t0, 0.9) });
            });
            g.text('science?', mx, PY + 48, { size: 28, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: la * S.tp(t1, 0.8) });
            g.text('who decides?', mx, PY + 530, { size: 28, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: la * S.tp(t2, 0.8) });
          }
        });
        // Until the itinerary begins: the subject of the film, in a line.
        { const tS = cue(S, 2, 'through the philosophy'); const qa = S.tp(tP + 0.4, 1.0) * (1 - S.tp(tS + 0.6, 0.8));
          if (qa > 0) g.withAlpha(qa, () => { caps(g, 'This film follows', 880, 452, { color: PAL.coral }); g.wrap('predators, and what they do, and do not do, to the world around them', 880, 506, 420, { size: 40, role: 'display', italic: true, color: PAL.ink, lh: 1.22 }); }); }
        // The itinerary: chapter names unfold along a trail of tracks, one per stride.
        const trA = vis(S, 2, 4, 1.0);
        if (trA > 0) {
          const chs = Theater.chapters.filter((c) => c.roman);
          const C = (p) => cue(S, 2, p);
          const tPar = C('paradigms'), tMod = C('models'), tCau = C('causes'), tBay = C('Bayesian');
          const at = [C('what science is trying'), C('how we can know'), C('induction'), C('falsification'), tPar, (tPar + tMod) / 2, tMod, tCau, (tCau + tBay) / 2, tBay, C('replication'), cue(S, 3, 'harder question'), cue(S, 3, 'what counts'), S.e(3) + 0.2];
          const tStart = C('through the philosophy');
          const printT = (i) => { const j = Math.floor(i / 2); const prev = j === 0 ? tStart : at[j - 1]; return i % 2 ? at[j] - 0.15 : lerp(prev, at[j], 0.55) - 0.15; };
          g.withAlpha(trA, () => {
            D.trail.prints.forEach((p, i) => { if (i >= 28) return; const a = lin(t, printT(i), 0.35); if (a <= 0) return; g.icon('track', p.x, p.y, 22, PAL.coral, { rot: p.ang + Math.PI / 2, alpha: a * 0.85 }); });
            chs.forEach((ch, j) => {
              if (j >= at.length) return; const a = S.tp(at[j], 0.7); if (a <= 0) return; const y = 261 + j * 46;
              g.text(ch.roman, 948, y, { size: 27, role: 'display', italic: true, color: ch.color, align: 'right', alpha: a });
              g.text(ch.title, 966 + (1 - a) * 14, y, { size: 32, role: 'display', color: PAL.ink, alpha: a });
            });
          });
        }

        // Beat 5: the two guides — the register badge (left) and the lexicon (right).
        const gA = S.p(4, 0.9);
        if (gA > 0) g.withAlpha(gA, () => {
          const tB = cue(S, 4, 'The badge'), tLx = cue(S, 4, 'The lexicon');
          const cyc = [['observe', cue(S, 4, 'observation')], ['infer', cue(S, 4, 'inference')], ['claim', cue(S, 4, 'or claim')]];
          const tAll = cyc[2][1] + 1.4;
          const litOf = (k) => { const i = cyc.findIndex((q) => q[0] === k); const on = S.tp(cyc[i][1], 0.5); const off = i < 2 ? S.tp(cyc[i + 1][1], 0.5) : 0; return Math.max(on * (1 - off), S.tp(tAll, 0.8)); };
          caps(g, 'Two guides', 120, 258, { color: PAL.sand });
          g.withAlpha(S.tp(tB - 0.4, 0.8), () => { g.text('1', 120, 316, { size: 30, weight: 600, color: PAL.sand }); g.text('The register badge', 150, 318, { size: 40, role: 'display', color: PAL.ink }); });
          // a large replica of the corner badge, lit as each band is named
          ['claim', 'infer', 'observe'].forEach((k, i) => {
            const y = 372 + i * 58, col = REG[k].color, a = S.tp(tB - 0.2 + i * 0.12, 0.7), lit = litOf(k), heard = S.tp(cyc.find((q) => q[0] === k)[1], 0.6);
            g.rect(330, y, 390, 28, { r: 7, fill: U.mix(PAL.ink3, col, lit), alpha: a * (0.32 + 0.63 * Math.max(lit, heard * 0.4)) });
            g.text(REG[k].label, 310, y + 22, { size: 24, weight: 600, ls: 2.6, color: lit > 0.3 ? col : PAL.ink3, align: 'right', alpha: a });
            g.text({ observe: 'observation', infer: 'inference', claim: 'claim' }[k], 744, y + 24, { size: 34, role: 'display', italic: true, color: col, alpha: a * heard * (0.45 + 0.55 * lit) });
          });
          // what each band holds
          const tile = (k, x, draw, lab) => {
            const col = REG[k].color, lit = litOf(k), a = S.tp(cyc.find((q) => q[0] === k)[1] - 0.1, 0.7); if (a <= 0) return;
            g.withAlpha(a * (0.4 + 0.6 * lit), () => {
              g.rect(x, 600, 196, 232, { r: 8, fill: U.rgba(col, 0.07 + 0.1 * lit), stroke: col, w: 1.6 + lit });
              draw(x + 98, 700, col);
              caps(g, lab, x + 98, 808, { color: col, align: 'center' });
            });
          };
          tile('observe', 120, (cx, cy, col) => { g.icon('elk', cx, cy - 26, 64, PAL.sand); for (let i = 0; i < 9; i++) { const grp = Math.floor(i / 5), j = i % 5; const gx = cx - 50 + grp * 52; if (j < 4) g.line(gx + j * 9, cy + 26, gx + j * 9 - 2, cy + 64, { color: PAL.ink, w: 2.4 }); else g.line(gx - 6, cy + 58, gx + 34, cy + 32, { color: PAL.ink, w: 2.4 }); } }, 'records');
          tile('infer', 336, (cx, cy, col) => { g.line(cx - 70, cy + 60, cx + 70, cy + 60, { color: PAL.ink2, w: 2 }); g.line(cx - 70, cy + 60, cx - 70, cy - 60, { color: PAL.ink2, w: 2 }); const pts = []; for (let j = 0; j <= 30; j++) { const u = j / 30; pts.push([cx - 66 + 132 * u, cy + 50 - 100 * (0.15 + 0.8 * u * u * (3 - 2 * u))]); } [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].forEach((u, j) => g.dot(cx - 66 + 132 * u, cy + 50 - 100 * (0.15 + 0.8 * u * u * (3 - 2 * u)) + [8, -10, 12, -6, 9, -8][j], 4, PAL.ink2, 1, 1.8)); g.poly(pts, { color: col, w: 3 }); }, 'models');
          tile('claim', 552, (cx, cy, col) => { g.with(() => { const c = g.ctx; c.translate(cx, cy); c.rotate(-0.05); g.rect(-50, -66, 100, 132, { r: 3, fill: '#E9E1CB' }); g.rect(-38, -52, 60, 8, { fill: '#3A3350' }); for (let j = 0; j < 6; j++) g.line(-38, -28 + j * 13, 38 - (j === 5 ? 30 : 0), -28 + j * 13, { color: '#8C8399', w: 1.4 }); }); g.circle(cx + 40, cy + 50, 20, { fill: col }); g.text('✓', cx + 40, cy + 58, { size: 24, weight: 700, color: '#24203A', align: 'center' }); }, 'conclusions');
          // pointer to the live badge in the top-right corner
          const pa = S.tp(tB + 0.4, 0.9) * (1 - 0.7 * S.tp(tLx, 0.8));
          g.carrow(760, 300, 1318, 214, -0.12, { color: PAL.ink2, w: 2, dash: [7, 7], head: 13, alpha: pa, progress: S.tp(tB + 0.4, 1.3) });
          caps(g, 'top right of every scene', 1040, 300, { color: PAL.ink2, alpha: pa });
          // the lexicon
          const la = S.tp(tLx - 0.2, 0.9);
          g.withAlpha(la, () => { g.text('2', 870, 618, { size: 30, weight: 600, color: PAL.sand }); g.text('The lexicon', 902, 620, { size: 40, role: 'display', color: PAL.ink }); });
          g.wrap('Terms an examiner may ask you to define, collected as they are introduced. The study guide holds them all, with sources.', 870, 676, 430, { size: 25, color: PAL.ink2, lh: 1.4, alpha: S.tp(tLx + 0.4, 0.9) });
          g.carrow(1130, 572, 1318, 430, -0.2, { color: PAL.sand, w: 2.4, head: 15, alpha: la, progress: S.tp(tLx + 0.3, 1.1) });
        });
      },
    },
  ],
});
})();
