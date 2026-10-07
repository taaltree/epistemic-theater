/* Chapter VII — Models are not reality. Case file: the three-box cascade. */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.moss;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken: located inside its sentence's timing when
// possible, otherwise proportional to its position in the beat's caption.
const cue = (S, k, phrase) => {
  const tb = S.scene.timing.beats[k];
  if (tb && tb.sents) for (const s of tb.sents) { const i = s.cap.indexOf(phrase); if (i >= 0) return s.start + (s.end - s.start) * i / s.cap.length; }
  const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length);
};
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const ein = (t, t0, d) => ease.inOut((t - t0) / d);
const lerpR = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
const panel = (g, x, y, w, h, a = 1, o = {}) => g.rect(x, y, w, h, { r: 8, fill: o.fill || 'rgba(23,20,42,0.78)', stroke: o.stroke || PAL.rule, w: o.lw || 1.4, alpha: a });

// A person (hunter, manager, rancher), centred on (x, y), about s px tall.
function person(g, x, y, s, col, o = {}) {
  const c = g.ctx; const a = o.alpha ?? 1; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(s / 112, s / 112); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.rifle) { c.lineWidth = 6; c.beginPath(); c.moveTo(-30, 40); c.lineTo(32, -56); c.stroke(); }
  c.beginPath(); c.arc(0, -26, 15, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(-26, 54); c.lineTo(-24, 6); c.quadraticCurveTo(-22, -8, -8, -9); c.lineTo(8, -9); c.quadraticCurveTo(22, -8, 24, 6); c.lineTo(26, 54); c.closePath(); c.fill();
  if (o.hat) { c.beginPath(); c.ellipse(0, -38, o.hat === 'wide' ? 30 : 21, 5, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(-13, -38); c.quadraticCurveTo(-12, -58, 0, -57); c.quadraticCurveTo(12, -58, 13, -38); c.fill(); }
  c.restore();
}
// A hand reaching down; (x, y) = fingertips.
function hand(g, x, y, s, col, o = {}) {
  const c = g.ctx; const a = o.alpha ?? 1; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(o.rot || 0); c.scale(s / 100, s / 100); c.fillStyle = col;
  c.globalAlpha *= 0.3; c.beginPath(); c.roundRect(-19, -140, 38, 56, 6); c.fill(); c.globalAlpha /= 0.3;
  c.beginPath(); c.roundRect(-25, -88, 50, 52, 15); c.fill();
  [[-20, 34], [-7.5, 40], [5, 38], [17.5, 30]].forEach(([fx, L]) => { c.beginPath(); c.roundRect(fx - 5.5, -48, 11, L + 10, 5.5); c.fill(); });
  c.save(); c.translate(-23, -70); c.rotate(0.75); c.beginPath(); c.roundRect(-6, 0, 12, 38, 6); c.fill(); c.restore();
  c.restore();
}
// Glyphs for non-animal nodes.
const sunGlyph = (g, x, y, s, col, a = 1) => { g.circle(x, y - s * 0.08, s * 0.2, { fill: col, alpha: a }); for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4; g.line(x + Math.cos(an) * s * 0.3, y - s * 0.08 + Math.sin(an) * s * 0.3, x + Math.cos(an) * s * 0.42, y - s * 0.08 + Math.sin(an) * s * 0.42, { color: col, w: 2.4, alpha: a }); } g.poly([[x - s * 0.45, y + s * 0.42], [x - s * 0.15, y + s * 0.36], [x - s * 0.05, y + s * 0.46], [x + s * 0.2, y + s * 0.38], [x + s * 0.45, y + s * 0.44]], { color: col, w: 2, alpha: a }); };
const channelGlyph = (g, x, y, s, col, a = 1) => { g.poly([[x - s * 0.48, y - s * 0.3], [x - s * 0.2, y - s * 0.28], [x - s * 0.1, y + s * 0.32], [x + s * 0.1, y + s * 0.32], [x + s * 0.2, y - s * 0.28], [x + s * 0.48, y - s * 0.3]], { color: col, w: 2.6, alpha: a }); g.line(x - s * 0.08, y + s * 0.22, x + s * 0.08, y + s * 0.22, { color: col, w: 4, alpha: a }); g.line(x - s * 0.48, y - s * 0.42, x + s * 0.48, y - s * 0.42, { color: col, w: 1.4, dash: [4, 4], alpha: 0.6 * a }); };
const hunterGlyph = (g, x, y, s, col, a = 1) => person(g, x, y, s * 0.95, col, { alpha: a, rifle: true, hat: 'cap' });

// Node box: rounded card with an icon and a label; n = {x, y, w, h, label, sub, color, icon}.
function nodeBox(g, n, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  const w = o.w ?? n.w, h = o.h ?? n.h, x = o.x ?? n.x, y = o.y ?? n.y, col = n.color; const s = h / 64;
  if (o.hi) g.glow(x, y, w * 0.62, col, 0.3 * o.hi * a);
  g.rect(x - w / 2, y - h / 2, w, h, { r: 10 * s, fill: '#191630', alpha: a });
  g.rect(x - w / 2, y - h / 2, w, h, { r: 10 * s, fill: U.rgba(col, 0.13), stroke: col, w: o.lw ?? 2, alpha: a });
  const ix = x - w / 2 + 36 * s, iy = y + 1 * s, isz = 42 * s;
  if (typeof n.icon === 'function') n.icon(g, ix, iy, isz, col, a); else g.icon(n.icon, ix, iy, isz, col, { alpha: a });
  const tx = x - w / 2 + 68 * s;
  g.text(n.label, tx, y + (n.sub ? -3 : 8) * s, { size: 22 * s, weight: 600, ls: 1.8, color: PAL.ink, alpha: a });
  if (n.sub) caps(g, n.sub, tx, y + 19 * s, { size: 17 * Math.max(1, s * 0.9), ls: 1.6, color: PAL.ink2, alpha: a });
}
// Boundary point of a node box in the direction of (tx, ty).
const rim = (n, tx, ty, pad = 6) => { const dx = tx - n.x, dy = ty - n.y; const s = Math.min((n.w / 2 + pad) / Math.max(1e-6, Math.abs(dx)), (n.h / 2 + pad) / Math.max(1e-6, Math.abs(dy))); return [n.x + dx * s, n.y + dy * s]; };
const link = (g, A, B, o = {}) => { const [x1, y1] = rim(A, B.x, B.y, o.pad0 ?? 5); const [x2, y2] = rim(B, A.x, A.y, o.pad1 ?? 7); if (o.bend) return g.carrow(x1, y1, x2, y2, o.bend, o); return g.arrow(x1, y1, x2, y2, o); };
const stamp = (g, str, x, y, col, rot, p) => {
  if (p <= 0) return; const sc = lerp(1.35, 1, ease.outBack(p));
  g.with(() => { const c = g.ctx; c.translate(x, y); c.rotate(rot); c.scale(sc, sc); const w = g.measure(str, { size: 34, weight: 700, ls: 3 }) + 56;
    g.rect(-w / 2, -36, w, 66, { r: 8, fill: 'rgba(14,13,26,0.86)', stroke: col, w: 3.5, alpha: p }); g.rect(-w / 2 + 6, -30, w - 12, 54, { r: 5, stroke: col, w: 1.2, alpha: 0.7 * p });
    g.text(str, 0, 10, { size: 34, weight: 700, ls: 3, color: col, align: 'center', alpha: p }); });
};
const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// The territory and its maps (pre-rendered once) --------------------------------
const TW = 1190, TH = 640;
function buildLand(r) {
  const ring = (cx, cy, rad, k, seed) => { const pts = []; for (let j = 0; j <= 80; j++) { const a = j / 80 * Math.PI * 2; const f = 1 + 0.17 * U.noise2(Math.cos(a) * 1.3 + k * 0.23, Math.sin(a) * 1.3, seed); pts.push([cx + Math.cos(a) * rad * f, cy + Math.sin(a) * rad * f * 0.78]); } return pts; };
  const hills = [[250, 170, 175, 3], [975, 470, 200, 7], [700, 40, 130, 11]];
  const contours = []; hills.forEach(([x, y, R0, s]) => { for (let k = 1; k <= 7; k++) contours.push({ pts: ring(x, y, R0 * k / 7.2, k, s), k }); });
  const river = []; for (let k = 0; k <= 140; k++) { const u = k / 140; river.push([u * TW, 292 + 200 * u + 50 * Math.sin(u * 8 + 0.6) + 12 * U.noise1(u * 9, 3)]); }
  const [jx, jy] = river[66]; const trib = []; for (let k = 0; k <= 40; k++) { const u = k / 40; trib.push([lerp(470, jx, u) + 24 * Math.sin(u * 5.5), lerp(TH + 4, jy, u)]); }
  const trail = []; for (let k = 0; k <= 60; k++) { const u = k / 60; trail.push([lerp(40, 1160, u), lerp(610, 150, u) + 40 * Math.sin(u * 5)]); }
  const aspens = []; [[430, 215, 13], [690, 575, 11], [1090, 215, 12]].forEach(([cx, cy, n]) => { for (let k = 0; k < n; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 62; aspens.push([cx + Math.cos(a) * d * 1.35, cy + Math.sin(a) * d * 0.75, 17 + r() * 8]); } });
  aspens.sort((p, q) => p[1] - q[1]);
  const conifers = []; for (let k = 0; k < 36; k++) { const h = hills[k % 3]; const a = r() * 6.28, d = h[2] * (0.2 + 0.55 * r()); const y = h[1] + Math.sin(a) * d * 0.78; if (y < 20 || y > TH - 20) continue; conifers.push([h[0] + Math.cos(a) * d, y, 17 + r() * 7]); }
  conifers.sort((p, q) => p[1] - q[1]);
  const willows = []; for (let k = 4; k < 140; k += 8) { const [x, y] = river[k]; const sd = (k / 8) % 2 < 1 ? 1 : -1; willows.push([x + 3, y + sd * 15 - 6, 20]); }
  const grass = []; for (let k = 0; k < 40; k++) grass.push([r() * TW, r() * TH, 10 + r() * 6]);
  const elk = []; for (let k = 0; k < 11; k++) elk.push([270 + r() * 220, 440 + r() * 100, r() * 6.28, r() < 0.4]);
  elk.sort((p, q) => p[1] - q[1]);
  return { hills, contours, river, trib, trail, aspens, conifers, willows, grass, elk };
}
function renderLand(L, style) {
  const cv = Theater.makeCanvas(TW, TH); const c = cv.getContext('2d'); const g = Theater.makeG(c);
  const map = style !== 'land'; const simple = style === 'simple';
  const C = map ? { con: '#9C8763', river: '#3E86A2', asp: '#6A8E4C', conif: '#45603F', wil: '#6A8E4C', trail: '#6B5A3A', elk: '#7A5530', grass: '#A8956E' }
    : { con: PAL.ink3, river: PAL.lagoon, asp: PAL.moss, conif: '#6F9470', wil: PAL.moss, trail: PAL.ink3, elk: PAL.sand, grass: PAL.ink3 };
  if (map) { c.fillStyle = '#E9DDBF'; c.fillRect(0, 0, TW, TH); }
  if (simple) {
    L.contours.filter((q) => q.k === 2 || q.k === 5).forEach((q) => g.poly(q.pts, { color: C.con, w: 7, alpha: 0.8 }));
    L.hills.forEach(([x, y]) => { if (y < 60) return; g.poly([[x - 26, y + 18], [x, y - 24], [x + 26, y + 18]], { fill: '#6B5A3A', color: null, w: 0, close: true }); });
    [[430, 215, 130, 70], [690, 575, 110, 58], [1090, 215, 120, 66]].forEach(([x, y, rx, ry]) => g.ellipse(x, y, rx, ry, { fill: 'rgba(94,127,69,0.5)' }));
    g.poly(L.river.filter((_, k) => k % 7 === 0 || k === 140), { color: C.river, w: 16 }); g.poly(L.trib.filter((_, k) => k % 8 === 0 || k === 40), { color: C.river, w: 10 });
    g.poly(L.trail, { color: C.trail, w: 7, dash: [26, 20] });
    g.line(TW - 70, 120, TW - 70, 40, { color: '#4A3E2A', w: 8 }); g.poly([[TW - 92, 70], [TW - 70, 30], [TW - 48, 70]], { fill: '#4A3E2A', color: null, w: 0, close: true });
    for (let k = 0; k < 4; k++) g.rect(50 + k * 70, TH - 60, 70, 18, { fill: k % 2 ? '#E9DDBF' : '#4A3E2A', stroke: '#4A3E2A', w: 3 });
    g.rect(8, 8, TW - 16, TH - 16, { stroke: '#4A3E2A', w: 12 });
    return cv;
  }
  L.grass.forEach(([x, y, s]) => g.icon('grass', x, y, s, C.grass, { alpha: 0.35 }));
  L.contours.forEach((q) => g.poly(q.pts, { color: C.con, w: q.k === 7 ? 1.6 : 1.2, alpha: map ? 0.8 : 0.45 }));
  g.poly(L.trail, { color: C.trail, w: 1.6, dash: [8, 8], alpha: map ? 0.9 : 0.6 });
  g.poly(L.trib, { color: C.river, w: 2.6, alpha: 0.85 }); g.poly(L.river, { color: C.river, w: 4.2 });
  L.willows.forEach(([x, y, s]) => g.icon('willow', x, y, s, C.wil, { alpha: 0.85, lw: 4 }));
  L.conifers.forEach(([x, y, s]) => g.icon('conifer', x, y, s, C.conif, { alpha: 0.9 }));
  L.aspens.forEach(([x, y, s]) => g.icon('aspen', x, y, s, C.asp, { alpha: 0.95, bg: map ? '#E9DDBF' : PAL.bg }));
  if (map) { L.elk.forEach(([x, y]) => g.icon('elk', x, y, 30, C.elk, { alpha: 0.9 })); g.rect(1, 1, TW - 2, TH - 2, { stroke: '#4A3E2A', w: 3 }); }
  return cv;
}

// Willow allometry (models-boxes) and potential landscapes (models-pit).
const allo = (u) => 0.12 + 0.8 * Math.pow(u, 1.25);
const gw = (u, m, s) => Math.exp(-((u - m) / s) * ((u - m) / s));
const V0 = (u) => 5 * Math.pow(u - 0.5, 4) - 1.0 * gw(u, 0.24, 0.1) - 1.25 * gw(u, 0.74, 0.12);
const Vk = (u, tau) => V0(u) + tau * 1.06 * gw(u, 0.24, 0.1) - tau * 0.14 * u;
const V1 = (u) => 2.7 * (u - 0.36) * (u - 0.36) - 1.12 + 2 * Math.pow(u - 0.5, 4);
const argminV = (f, a, b) => { let bu = a, bv = 1e9; for (let k = 0; k <= 120; k++) { const u = lerp(a, b, k / 120); const v = f(u); if (v < bv) { bv = v; bu = u; } } return bu; };

Theater.chapter({
  id: 'models', roman: 'VII', title: 'Models', color: COL,
  question: 'How can a false model teach us something true?',
  casefile: { title: 'The three-box cascade', sketch: 'boxes' },
  intro: { t: 'Chapter seven. Models, and why none of them is reality.' },
  scenes: [
    {
      id: 'models-map', title: 'The map and the territory', register: 'infer',
      beats: [
        { t: 'A map at a scale of one to one would be perfectly accurate and perfectly useless. Models are valuable because they leave things out. The statistician George Box put it bluntly: all models are wrong.',
          cite: 'Box 1976',
          v: 'A map zooms toward 1:1 until it covers the territory exactly and becomes useless.' },
        { t: 'Michael Weisberg distinguishes three kinds of idealization: simplifying for tractability, keeping only the factors that make a difference, and building several incompatible models on purpose. Mary Morgan and Margaret Morrison describe models as mediators, partly independent of both theory and world.',
          cite: 'Weisberg 2007; Morgan & Morrison 1999',
          v: 'Three labelled sketches of the same predator–prey system; a model card sits between THEORY and WORLD with arrows to both.' },
        { t: 'Richard Levins, whom you met in the first film, argued that no model can maximize generality, realism, and precision at once. His remedy was robustness analysis: if several different models agree, the result is probably not an artifact of any one. “Our truth,” he wrote, “is the intersection of independent lies.”',
          cite: 'Levins 1966',
          v: 'The Levins triangle; three models occupy different corners; their shared prediction is lit at the overlap.' },
      ],
      init() {
        const r = U.rng(701); const L = buildLand(r);
        return { L, land: renderLand(L, 'land'), mapF: renderLand(L, 'full'), mapS: renderLand(L, 'simple') };
      },
      draw(g, t, S, D) {
        const c = g.ctx;
        // ---- Beat 1: the map zooms to 1:1 over the territory, then shrinks back.
        const aT = vis(S, 0, 1);
        if (aT > 0) g.withAlpha(aT, () => {
          const T = { x: 110, y: 240, w: TW, h: TH };
          const M0 = { x: T.x + 26, y: T.y + T.h - 26 - 150, w: 279, h: 150 }, MU = { x: T.x + 30, y: T.y + T.h - 30 - 268, w: 498, h: 268 };
          const t1 = cue(S, 0, 'one to one'), tA = cue(S, 0, 'perfectly accurate'), tUs = cue(S, 0, 'perfectly useless'), tL = cue(S, 0, 'Models are valuable'), tB = cue(S, 0, 'The statistician'); void tB;
          const zi = ein(t, t1 - 0.5, Math.max(1.4, tA - t1 + 0.6)), zo = ein(t, tL - 0.1, 1.6);
          const dim = 1 - 0.5 * ein(t, tL + 0.5, 1.2);
          g.withAlpha(S.p(0, 1.4) * dim, () => c.drawImage(D.land, T.x, T.y));
          D.L.elk.forEach(([x, y, ph, fl], k) => g.icon('elk', T.x + x + 9 * Math.sin(0.3 * t + ph), T.y + y + 2 * Math.sin(0.5 * t + k), 30, PAL.sand, { alpha: S.p(0, 1, 0.3) * dim, flip: fl }));
          g.icon('wolf', T.x + 70 + 7 * t, T.y + 600, 36, PAL.coral, { alpha: S.p(0, 1, 0.6) * dim });
          const M = lerpR(lerpR(M0, T, zi), MU, zo); const det = clamp((zi - 0.3) / 0.6) * (1 - zo);
          const aM = S.p(0, 0.8, 0.4);
          g.rect(M.x + 6, M.y + 8, M.w, M.h, { fill: 'rgba(0,0,0,0.45)', alpha: aM * (1 - zi * (1 - zo)) });
          g.withAlpha(aM, () => c.drawImage(D.mapS, M.x, M.y, M.w, M.h));
          g.withAlpha(aM * det, () => c.drawImage(D.mapF, M.x, M.y, M.w, M.h));
          const zEff = clamp((M.w - M0.w) / (T.w - M0.w)); let N = Math.pow(250000, 1 - zEff); N = N < 1.5 ? 1 : Number(N.toPrecision(2));
          g.pill('1 : ' + fmtN(N), M.x + 12, M.y + 28, { size: 22, role: 'mono', color: PAL.ink, fill: 'rgba(14,13,26,0.88)', alpha: aM });
          // Stamps at 1:1.
          const aSt = 1 - ein(t, tL - 0.2, 0.6);
          stamp(g, 'PERFECTLY ACCURATE', T.x + T.w / 2, T.y + 250, '#8FD49A', -0.05, S.tp(tA, 0.5) * aSt);
          stamp(g, 'PERFECTLY USELESS', T.x + T.w / 2, T.y + 380, PAL.coral, 0.04, S.tp(tUs, 0.5) * aSt);
          // What the useful map leaves out.
          const aO = S.tp(tL + 0.9, 0.8);
          if (aO > 0) { panel(g, 690, 618, 610, 252, aO); caps(g, 'left out of the map', 720, 662, { color: COL, alpha: aO });
            [['every tree and sapling', PAL.moss], ['every elk', PAL.sand], ['most of the relief', PAL.ink2]].forEach(([s, col], k) => { const a = S.tp(tL + 1.2 + k * 0.45, 0.6); const y = 716 + k * 52; const w = g.text(s, 760, y, { size: 26, color: col, alpha: a * aO }); g.circle(735, y - 9, 6, { fill: col, alpha: a * aO }); g.line(752, y - 9, 768 + w, y - 9, { color: PAL.ink, w: 2, alpha: 0.75 * aO, progress: S.tp(tL + 1.5 + k * 0.45, 0.6) }); }); }
          // Box.
          const aQ = S.tp(cue(S, 0, 'George Box') - 0.2, 0.8);
          if (aQ > 0) { panel(g, 690, 262, 610, 168, aQ); g.text('All models are wrong.', 995, 352, { size: 60, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(cue(S, 0, 'bluntly'), 0.8) }); caps(g, 'George Box', 995, 398, { align: 'center', alpha: aQ }); }
        });

        // ---- Beat 2: Weisberg's three idealizations; models as mediators.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tG = cue(S, 1, 'simplifying'), tM = cue(S, 1, 'keeping only'), tP = cue(S, 1, 'building several'), tMM = cue(S, 1, 'Mary Morgan'), tPI = cue(S, 1, 'partly independent');
          const dimTop = 1 - 0.45 * S.tp(tMM, 0.8);
          const card = (k, t0, head, desc, body) => { const x = 110 + k * 412, y = 236, aF = S.p(1, 0.8, 0.2 + k * 0.25), a = S.tp(t0 - 0.2, 0.8); if (aF <= 0) return;
            g.withAlpha(aF * dimTop, () => { panel(g, x, y, 386, 352, 1); g.text(String(k + 1), x + 24, y + 44, { size: 30, role: 'display', italic: true, color: COL }); caps(g, head, x + 52, y + 40, { color: COL, alpha: lerp(0.35, 1, a) }); g.withAlpha(a, () => { body(x, y); g.text(desc, x + 24, y + 330, { size: 23, color: PAL.ink }); }); }); };
          card(0, tG, 'Galilean', 'simplify for tractability', (x, y) => {
            g.math('\\frac{dN}{dt} = rN − aNP', x + 24, y + 100, { size: 28, color: PAL.ink2 });
            const A = g.axes({ x: x + 70, y: y + 132, w: 280, h: 142, labSize: 21, xlab: 'prey', ylab: 'predators', progress: S.tp(tG, 1) });
            const orb = []; for (let j = 0; j <= 90; j++) { const th = j / 90 * Math.PI * 2; orb.push([A.X(0.46 + 0.3 * Math.cos(th) + 0.06 * Math.cos(2 * th)), A.Y(0.44 + 0.3 * Math.sin(th) - 0.07 * Math.cos(th))]); }
            g.poly(orb, { color: COL, w: 3, progress: S.tp(tG + 0.3, 1.4) });
            const th = 0.8 * (t - tG); if (t > tG + 1.5) g.dot(A.X(0.46 + 0.3 * Math.cos(th) + 0.06 * Math.cos(2 * th)), A.Y(0.44 + 0.3 * Math.sin(th) - 0.07 * Math.cos(th)), 6, PAL.ink, 1, 2.6);
          });
          card(1, tM, 'Minimalist', 'keep only the difference-makers', (x, y) => {
            const fade = 1 - 0.85 * S.tp(cue(S, 1, 'make a difference') + 0.4, 1.0); const E = [x + 280, y + 186];
            [['puma', x + 72, y + 92, PAL.coral], ['bear', x + 290, y + 82, PAL.coral], ['bison', x + 80, y + 276, PAL.sand], ['beaver', x + 300, y + 282, PAL.lagoon], ['moose', x + 190, y + 290, PAL.sand]].forEach(([ic, ix, iy, col], k) => {
              const a = S.tp(tM + 0.1 + k * 0.12, 0.6); g.icon(ic, ix, iy, 46, col, { alpha: a * lerp(0.25, 0.9, fade) }); if (Math.hypot(ix - E[0], iy - E[1]) > 60) g.arrow(ix + (E[0] - ix) * 0.3, iy + (E[1] - iy) * 0.3, ix + (E[0] - ix) * 0.72, iy + (E[1] - iy) * 0.72, { color: PAL.ink3, w: 1.6, head: 9, dash: [4, 5], alpha: a * fade }); });
            g.icon('wolf', x + 100, y + 186, 74, PAL.coral, { alpha: S.tp(tM, 0.6) }); g.icon('elk', E[0], E[1], 74, PAL.sand, { alpha: S.tp(tM, 0.6) });
            g.arrow(x + 148, y + 186, x + 228, y + 186, { color: PAL.ink, w: 4, head: 16, progress: S.tp(tM + 0.4, 0.8) });
          });
          card(2, tP, 'Multiple models', 'incompatible models, on purpose', (x, y) => {
            const A = g.axes({ x: x + 70, y: y + 104, w: 280, h: 164, labSize: 21, xlab: 'prey density', ylab: 'kill rate', progress: S.tp(tP, 1) });
            [[(u) => Math.min(0.92, 1.05 * u), PAL.lagoon, 'I'], [(u) => 1.05 * u / (0.22 + u), PAL.ochre, 'II'], [(u) => 0.95 * u * u / (0.09 + u * u), PAL.heather, 'III']].forEach(([f, col, lab], k) => {
              g.plot(A, f, { color: col, w: 3.2, progress: S.tp(tP + 0.4 + k * 0.5, 1.1) });
              const a = S.tp(tP + 0.4 + k * 0.5, 0.6), lx = x + 96 + k * 62; g.line(lx, y + 84, lx + 18, y + 84, { color: col, w: 3.2, alpha: a }); g.text(lab, lx + 23, y + 91, { size: 21, role: 'math', color: col, alpha: a }); });
          });
          g.text('Three kinds of idealization', 705, 740, { size: 46, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.p(1, 0.9, 0.6) * (1 - S.tp(tMM - 0.6, 0.6)) });
          caps(g, 'Weisberg', 705, 784, { align: 'center', alpha: S.p(1, 0.9, 1.0) * (1 - S.tp(tMM - 0.6, 0.6)) });
          // Models as mediators.
          const aMM = S.tp(tMM, 0.9);
          if (aMM > 0) {
            const yc = 742;
            g.withAlpha(S.tp(tMM + 0.5, 0.8), () => { panel(g, 110, 662, 330, 160, 1); g.text('Theory', 134, 716, { size: 40, role: 'display', color: PAL.ink }); g.math('\\frac{dN}{dt} = f(N, P)', 134, 790, { size: 30, color: PAL.ink2 }); });
            g.withAlpha(S.tp(tMM + 0.9, 0.8), () => { panel(g, 960, 662, 340, 160, 1); g.text('World', 984, 716, { size: 40, role: 'display', color: PAL.ink }); g.icon('aspen', 1010, 776, 54, PAL.moss); g.icon('elk', 1100, 784, 60, PAL.sand); g.icon('wolf', 1210, 788, 56, PAL.coral, { flip: true }); g.line(984, 806, 1280, 806, { color: PAL.lagoon, w: 2.4 }); });
            g.withAlpha(aMM, () => { g.glow(700, yc, 200, COL, 0.18); panel(g, 540, 650, 320, 184, 1, { fill: 'rgba(36,48,34,0.92)', stroke: COL, lw: 2.4 }); g.text('Model', 570, 712, { size: 46, role: 'display', color: PAL.ink }); g.icon('boxes', 800, 742, 92, COL); caps(g, 'mediator', 570, 760, { color: COL }); });
            g.arrow(536, yc, 446, yc, { color: PAL.ink2, w: 3, head: 15, both: true, progress: S.tp(tMM + 1.3, 0.7) });
            g.arrow(864, yc, 954, yc, { color: PAL.ink2, w: 3, head: 15, both: true, progress: S.tp(tMM + 1.6, 0.7) });
            g.text('partly independent of both', 700, 878, { size: 25, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tPI, 0.8) });
          }
        });

        // ---- Beat 3: the Levins triangle and robustness.
        const a2 = S.p(2, 0.8);
        if (a2 > 0) g.withAlpha(a2, () => {
          const G = [500, 282], Rr = [190, 780], P = [810, 780], C0 = [500, (282 + 780 * 2) / 3];
          const tNo = cue(S, 2, 'no model'), tGe = cue(S, 2, 'generality'), tRe = cue(S, 2, 'realism'), tPr = cue(S, 2, 'precision'), tOnce = cue(S, 2, 'at once'), tRob = cue(S, 2, 'robustness'), tAg = cue(S, 2, 'if several'), tArt = cue(S, 2, 'not an artifact'), tQ = cue(S, 2, 'Our truth');
          g.poly([G, Rr, P, G], { color: PAL.ink2, w: 2.4, progress: S.p(2, 2.2, 0.4) });
          g.text('Generality', G[0], G[1] - 22, { size: 32, role: 'display', color: PAL.ink, align: 'center', alpha: S.tp(tGe, 0.6) });
          g.text('Realism', Rr[0], Rr[1] + 46, { size: 32, role: 'display', color: PAL.ink, align: 'center', alpha: S.tp(tRe, 0.6) });
          g.text('Precision', P[0], P[1] + 46, { size: 32, role: 'display', color: PAL.ink, align: 'center', alpha: S.tp(tPr, 0.6) });
          [G, Rr, P].forEach((v, k) => g.dot(v[0], v[1], 6, PAL.ink, S.tp([tGe, tRe, tPr][k], 0.5), 2.4));
          const mids = [[(G[0] + P[0]) / 2, (G[1] + P[1]) / 2], [(G[0] + Rr[0]) / 2, (G[1] + Rr[1]) / 2], [(Rr[0] + P[0]) / 2, Rr[1]]];
          const MC = mids.map(([mx, my]) => [lerp(C0[0], mx, 0.56), lerp(C0[1], my, 0.56)]);
          const cols = [PAL.lagoon, PAL.ochre, PAL.heather], RAD = 136 * S.tp(tRob + 0.3, 1.6);
          const labs = [['model 1', 'general + precise', 732, 448, 'left'], ['model 2', 'general + realistic', 268, 448, 'right'], ['model 3', 'realistic + precise', 500, 862, 'center']];
          MC.forEach(([x, y], k) => {
            const a = S.tp(tOnce + 0.2 + k * 0.4, 0.7);
            if (RAD > 0) { g.circle(x, y, RAD, { fill: U.rgba(cols[k], 0.1), alpha: a }); g.circle(x, y, RAD, { stroke: cols[k], w: 2, alpha: 0.85 * a }); }
            g.dot(x, y, 9, cols[k], a, 2.8);
            const [l1, l2, lx, ly, al] = labs[k]; caps(g, l1, lx, ly, { color: cols[k], align: al, alpha: a }); g.text(l2, lx, ly + 30, { size: 23, color: PAL.ink, align: al, alpha: a });
          });
          // The triple overlap.
          const aO = S.tp(tAg + 1.0, 1.0);
          if (aO > 0 && RAD > 0) { g.with(() => { for (const [x, y] of MC) { c.beginPath(); c.arc(x, y, RAD, 0, Math.PI * 2); c.clip(); } g.rect(150, 280, 720, 560, { fill: COL, alpha: 0.6 * aO }); }); g.glow(C0[0], C0[1] + 6, 120, COL, 0.6 * aO * (0.85 + 0.15 * Math.sin(t * 2.2))); }
          const aRR = S.tp(tArt, 0.8); g.line(C0[0] + 12, C0[1] + 10, 626, 738, { color: COL, w: 1.6, alpha: aRR, progress: aRR }); g.dot(C0[0] + 8, C0[1] + 6, 4, PAL.ink, aRR); g.text('robust result', 636, 746, { size: 23, weight: 600, color: COL, alpha: aRR });
          // Right column.
          g.withAlpha(S.tp(tRob, 0.8), () => { caps(g, 'robustness analysis', 960, 312, { color: COL }); g.wrap('Different assumptions, same answer: the result is probably not an artifact of any one model.', 960, 352, 350, { size: 23, color: PAL.ink2, lh: 1.35 }); });
          g.withAlpha(S.tp(tQ, 1.0), () => { g.line(960, 540, 1060, 540, { color: COL, w: 2 }); const h = g.wrap('“Our truth is the intersection of independent lies.”', 960, 596, 360, { size: 42, role: 'display', italic: true, color: PAL.ink, lh: 1.18 }); caps(g, 'Richard Levins, 1966', 960, 596 + h + 4); });
        });
      },
      terms: [
        { beat: 1.3, term: 'Idealization', def: 'Deliberate distortion or omission in a model to make it tractable or to isolate the factors that matter (Weisberg).' },
        { beat: 1.75, term: 'Models as mediators', def: 'Models are partly independent of both theory and data, so they can be used to learn about each (Morgan and Morrison).' },
        { beat: 2.35, term: 'Generality–realism–precision', def: 'Levins’s tradeoff: a model can maximize at most two of generality, realism, and precision.' },
        { beat: 2.6, term: 'Robustness analysis', def: 'Checking whether a result holds across models with different simplifying assumptions.' },
      ],
    },
    {
      id: 'models-boxes', title: 'Case file: the three-box cascade', register: 'infer',
      beats: [
        { t: 'Wolf, elk, aspen: three boxes and two arrows. The model is clear, memorable, and wrong in ways that matter.',
          v: 'Case-file card (three boxes). The canonical three-box diagram draws itself.' },
        { t: 'The system it stands for has pumas, which killed a larger share of Northern Range elk than wolves did in most years from 1998 to 2004; grizzly and black bears, the main predators of elk calves; human hunters; a bison herd that grew fourfold; and beaver, drought, and incised streams.',
          cite: 'Metz et al. 2020; Barber-Meyer et al. 2008; White et al. 2015; Wilmers et al. 2025',
          v: 'New boxes crowd in around the three, each with arrows; the tidy chain becomes a web.' },
        { t: 'Models also travel beyond the conditions that built them. One analysis estimated a fifteen-hundred-percent increase in willow crown volume. Critics argue that the volume equation, calibrated on lightly browsed plants, was applied to heavily browsed ones. An estimate is only as good as the model linking it to the quantity you care about.',
          cite: 'Ripple et al. 2025; Wilmers et al. 2025',
          v: 'A willow allometry curve fitted on bushy plants; heavily browsed stems fall outside the calibration range; the extrapolated estimate balloons.' },
      ],
      init() {
        const W = 196, H = 62;
        const nd = (label, icon, color, x, y, o = {}) => ({ label, icon, color, x, y, w: o.w || W, h: H, sub: o.sub, ph: o.ph });
        const N = {
          wolf: nd('WOLF', 'wolf', PAL.coral, 865, 290), elk: nd('ELK', 'elk', PAL.sand, 865, 515), aspen: nd('ASPEN', 'aspen', PAL.moss, 865, 790),
          puma: nd('PUMAS', 'puma', PAL.coral, 605, 290, { ph: 'pumas' }), bears: nd('BEARS', 'bear', PAL.coral, 1140, 290, { sub: 'grizzly · black', ph: 'grizzly', w: 236 }),
          hunters: nd('HUNTERS', hunterGlyph, PAL.violet, 1130, 470, { ph: 'human hunters' }), bison: nd('BISON', 'bison', PAL.sand, 605, 470, { ph: 'a bison herd' }),
          beaver: nd('BEAVER', 'beaver', PAL.lagoon, 605, 640, { ph: 'beaver' }), drought: nd('DROUGHT', sunGlyph, PAL.ochre, 1130, 660, { ph: 'drought' }),
          streams: nd('STREAMS', channelGlyph, PAL.lagoon, 605, 808, { sub: 'incised', ph: 'incised streams' }),
        };
        const links = [['puma', 'elk'], ['bears', 'elk', { sub: 'calves' }], ['hunters', 'elk'], ['bison', 'aspen'], ['bison', 'elk', { both: true, dash: [7, 7] }], ['beaver', 'streams'], ['streams', 'aspen'], ['drought', 'aspen'], ['drought', 'elk'], ['puma', 'wolf', { both: true, dash: [7, 7] }]];
        const r = U.rng(712); const cal = []; for (let k = 0; k < 22; k++) { const u = 0.48 + 0.5 * (k + r()) / 22; cal.push([u, allo(u) * (1 + 0.13 * U.gauss(r))]); }
        const brw = [0.08, 0.135, 0.19, 0.245, 0.3, 0.355].map((u) => [u, allo(u) * (0.22 + 0.1 * r())]);
        return { N, links, cal, brw };
      },
      draw(g, t, S, D) {
        const N = D.N; const CF0 = { x: 96, y: 226, w: 270, h: 156 }, CF1 = { x: 96, y: 226, w: 240, h: 146 };
        const cf = lerpR(CF0, CF1, S.p(2, 1.0));
        g.casefile(cf.x, cf.y, cf.w, cf.h, { title: 'The three-box cascade', no: 'VII', sketch: 'boxes', color: COL, rot: -0.02, alpha: S.p(0, 0.9), titleSize: cf.w < 250 ? 18 : undefined });

        // ---- Beats 1–2: the three boxes, then the web.
        const aW = 1 - S.p(2, 0.8);
        if (aW > 0) g.withAlpha(aW, () => {
          const tW = cue(S, 0, 'Wolf'), tE = cue(S, 0, 'elk'), tAs = cue(S, 0, 'aspen'), tArr = cue(S, 0, 'two arrows');
          const m = S.p(1, 1.1); const hero = (n, y) => ({ ...n, y: lerp(y, n.y, m), w: lerp(290, n.w, m), h: lerp(92, n.h, m) });
          const W = hero(N.wolf, 320), E = hero(N.elk, 555), A = hero(N.aspen, 790);
          const tF = cue(S, 1, 'The system');
          // New nodes and their links.
          const nodeA = {}; for (const k of ['puma', 'bears', 'hunters', 'bison', 'beaver', 'drought', 'streams']) nodeA[k] = S.tp(cue(S, 1, N[k].ph) - 0.1, 0.7);
          const lk = { wolf: W, elk: E, aspen: A, ...N };
          D.links.forEach(([a, b, o = {}]) => { const t0 = Math.max(a in nodeA ? cue(S, 1, N[a].ph) : 0, b in nodeA ? cue(S, 1, N[b].ph) : 0) + 0.4; const p = S.tp(t0, 0.8); if (p <= 0) return;
            link(g, lk[a], lk[b], { color: U.rgba(PAL.ink2, 0.9), w: 2, head: 12, progress: p, dash: o.dash, both: o.both });
            if (o.sub) { const B = lk[a], C2 = lk[b]; caps(g, o.sub, lerp(B.x, C2.x, 0.5) + 14, lerp(B.y, C2.y, 0.5) + 2, { color: PAL.coral, alpha: S.tp(t0 + 0.5, 0.6) }); } });
          for (const k in nodeA) nodeBox(g, N[k], { alpha: nodeA[k] });
          if (nodeA.bison > 0) g.pill('×4', N.bison.x + N.bison.w / 2 - 6, N.bison.y - N.bison.h / 2 - 4, { size: 21, color: PAL.sand, fill: '#2A2536', stroke: PAL.sand, alpha: S.tp(cue(S, 1, 'grew fourfold'), 0.6) });
          // The canonical chain on top.
          const hi = 1 - 0.6 * m;
          link(g, W, E, { color: COL, w: lerp(5, 3, m), head: lerp(22, 15, m), progress: S.tp(tArr, 0.7) });
          link(g, E, A, { color: COL, w: lerp(5, 3, m), head: lerp(22, 15, m), progress: S.tp(tArr + 0.5, 0.7) });
          nodeBox(g, W, { alpha: S.tp(tW, 0.6), hi, lw: lerp(3, 2.4, m) }); nodeBox(g, E, { alpha: S.tp(tE, 0.6), hi, lw: lerp(3, 2.4, m) }); nodeBox(g, A, { alpha: S.tp(tAs, 0.6), hi, lw: lerp(3, 2.4, m) });
          // Left column: verdict on the canonical model, then the legend of what it leaves out.
          g.withAlpha(vis(S, 0, 1), () => {
            caps(g, 'the canonical model', 104, 452, { alpha: S.tp(tArr, 0.7) });
            [['clear', PAL.ink, 'clear'], ['memorable', PAL.ink, 'memorable'], ['wrong in ways', PAL.coral, 'wrong in ways that matter']].forEach(([ph, col, s], k) => g.text(s, 104, 508 + k * 50, { size: 34, role: 'display', italic: true, color: col, alpha: S.tp(cue(S, 0, ph), 0.6) }));
          });
          g.text('a chain becomes a web', 1140, 812, { size: 30, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(cue(S, 1, 'incised streams') + 1.4, 1.0) });
          g.withAlpha(S.p(1, 0.6), () => {
            caps(g, 'the system it stands for', 104, 446, { alpha: S.tp(tF, 0.7) });
            const items = [['puma', 'Pumas', 'a larger share of elk kills than wolves, most years 1998–2004'], ['bears', 'Grizzly and black bears', 'main predators of elk calves'], ['hunters', 'Human hunters'], ['bison', 'Bison', 'herd grew fourfold'], ['beaver', 'Beaver, drought, incised streams']];
            let y = 490; items.forEach(([k, ttl, fact]) => { const a = nodeA[k]; g.rect(104, y - 15, 14, 14, { r: 3, fill: N[k].color, alpha: a }); y += g.wrap(ttl, 130, y, 300, { size: 22, weight: 600, color: PAL.ink, alpha: a, lh: 1.3 }) + 1; if (fact) { const h = g.wrap(fact, 130, y, 300, { size: 21, color: PAL.ink2, lh: 1.3, alpha: a }); y += h; } y += 12; });
          });
        });

        // ---- Beat 3: a willow volume equation carried beyond its calibration.
        const aP = S.p(2, 0.9);
        if (aP > 0) g.withAlpha(aP, () => {
          const t1 = cue(S, 2, 'One analysis'), tC = cue(S, 2, 'calibrated on'), tH = cue(S, 2, 'heavily browsed'), tE = cue(S, 2, 'An estimate is only');
          const A = g.axes({ x: 590, y: 286, w: 690, h: 420, xlab: 'Measured plant size', ylab: 'Crown volume', labSize: 22, progress: S.p(2, 1.0, 0.2) });
          caps(g, 'stylized', 1280, 272, { align: 'right' });
          // Calibration range and its bushy plants.
          const aC = S.p(2, 0.8, 0.8);
          g.rect(A.X(0.46), A.y, A.X(1) - A.X(0.46), A.h, { fill: U.rgba(COL, 0.08 + 0.06 * S.tp(tC, 0.8)), alpha: aC });
          g.line(A.X(0.46), A.y, A.X(0.46), A.y + A.h, { color: COL, w: 1.6, dash: [6, 6], alpha: aC });
          caps(g, 'calibration range', A.X(0.73), A.y + 30, { color: COL, align: 'center', alpha: aC });
          g.text('lightly browsed plants', A.X(0.73), A.y + 60, { size: 21, color: COL, align: 'center', alpha: S.tp(tC, 0.8) });
          D.cal.forEach(([u, v], k) => g.dot(A.X(u), A.Y(v), 5.5, COL, S.p(2, 0.5, 1.0 + k * 0.05), 2.2));
          g.plot(A, allo, { from: 0.46, to: 1, color: COL, w: 4, progress: S.p(2, 1.2, 2.0) });
          g.icon('willow', A.X(0.55), A.Y(0.79), 92, COL, { alpha: S.p(2, 0.8, 1.4) });
          // Heavily browsed stems, outside the range; the equation's prediction balloons above them.
          const aH = S.tp(tH, 0.8); const bal = ein(t, tH + 1.0, 2.2);
          g.plot(A, allo, { from: 0.46, to: 0.04, color: PAL.ochre, w: 3, dash: [9, 8], progress: S.tp(tH + 0.4, 1.0) });
          D.brw.forEach(([u, v], k) => { const a = S.tp(tH + 0.15 * k, 0.5); const b = clamp(bal * 1.25 - k * 0.05); const x = A.X(u), y0 = A.Y(v), y1 = A.Y(allo(u)); const yb = lerp(y0, y1, b), rb = lerp(5, 8 + 22 * allo(u), b);
            if (b > 0) { g.line(x, y0 - 7, x, yb + rb, { color: PAL.ochre, w: 1.4, alpha: a * 0.85 }); g.circle(x, yb, rb, { fill: U.rgba(PAL.ochre, 0.3), stroke: PAL.ochre, w: 2, alpha: a }); g.circle(x - rb * 0.35, yb - rb * 0.35, rb * 0.22, { fill: '#FFFFFF', alpha: 0.35 * a * b }); }
            g.circle(x, y0, 6.5, { stroke: PAL.sand, w: 2.4, fill: PAL.bg, alpha: a }); });
          g.withAlpha(aH, () => { g.with(() => { g.ctx.beginPath(); g.ctx.rect(A.X(0.2) - 40, A.Y(0.68) - 10, 80, 40); g.ctx.clip(); g.icon('willow', A.X(0.2), A.Y(0.68) - 14, 72, PAL.sand); }); g.line(A.X(0.2) - 34, A.Y(0.68) - 9, A.X(0.2) + 34, A.Y(0.68) - 9, { color: PAL.sand, w: 1.6, alpha: 0.7 }); g.text('heavily browsed', A.X(0.2), A.Y(0.68) + 58, { size: 21, color: PAL.sand, align: 'center' }); });
          const aLg = S.tp(tH + 1.8, 0.8); g.circle(A.X(0.04), A.Y(0.95), 6.5, { stroke: PAL.sand, w: 2.4, alpha: aH }); g.text('measured volume', A.X(0.04) + 18, A.Y(0.95) + 7, { size: 21, color: PAL.sand, alpha: aH });
          g.circle(A.X(0.04), A.Y(0.88), 9, { fill: U.rgba(PAL.ochre, 0.3), stroke: PAL.ochre, w: 2, alpha: aLg }); g.text('model’s estimate', A.X(0.04) + 18, A.Y(0.88) + 7, { size: 21, color: PAL.ochre, alpha: aLg });
          // Left column: the estimate.
          const aN = S.tp(t1, 0.8); const nTick = Math.round(1500 * ein(t, t1 + 0.6, 2.0));
          caps(g, 'one analysis', 104, 420, { alpha: aN });
          g.text(`+${fmtN(nTick)}%`, 100, 498, { size: 76, role: 'display', color: PAL.ochre, alpha: aN });
          g.wrap('estimated increase in willow crown volume', 104, 540, 330, { size: 22, color: PAL.ink2, lh: 1.3, alpha: aN });
          g.withAlpha(S.tp(tC, 0.8), () => { caps(g, 'the critique', 104, 640, { color: PAL.coral }); g.wrap('an equation calibrated on lightly browsed plants, applied to heavily browsed ones', 104, 676, 330, { size: 22, color: PAL.ink, lh: 1.3 }); });
          g.withAlpha(S.tp(tH + 2.6, 0.8), () => g.wrap('overestimated by an unknown amount', 104, 800, 330, { size: 22, italic: true, color: PAL.ochre, lh: 1.3 }));
          // The estimand chain.
          const aE = S.tp(tE, 0.8);
          if (aE > 0) { const y = 840; const bx = [[650, 'DATA', PAL.ink2], [850, 'MODEL', COL], [1050, 'ESTIMATE', PAL.ochre], [1232, 'ESTIMAND', PAL.ink]];
            bx.forEach(([x, s, col], k) => { const a = S.tp(tE + k * 0.35, 0.6); const w = k === 3 ? 150 : 138; g.rect(x - w / 2, y - 26, w, 52, { r: 8, fill: U.rgba(col, k === 1 ? 0.22 : 0.1), stroke: col, w: k === 1 ? 2.6 : 1.6, alpha: a }); caps(g, s, x, y + 6, { color: col === PAL.ink2 ? PAL.ink : col, align: 'center', alpha: a, ls: 2 }); });
            g.arrow(721, y, 779, y, { color: PAL.ink2, w: 2, head: 11, progress: S.tp(tE + 0.3, 0.5) }); g.arrow(921, y, 979, y, { color: PAL.ink2, w: 2, head: 11, progress: S.tp(tE + 0.65, 0.5) });
            g.arrow(1121, y, 1155, y, { color: PAL.ink3, w: 2, head: 11, dash: [5, 5], progress: S.tp(tE + 1.0, 0.5) });
            g.glow(850, y, 90, COL, 0.35 * S.tp(cue(S, 2, 'the model linking'), 0.8));
          }
        });
      },
      terms: [
        { beat: 2.4, term: 'Extrapolation', def: 'Applying a model outside the range of conditions used to build or calibrate it.' },
        { beat: 2.65, term: 'Estimand vs estimate', def: 'The estimand is the quantity a study aims to know; the estimate is what a model and data produce. The link between them is an assumption.' },
      ],
    },
    {
      id: 'models-pit', title: 'Models that act', register: 'claim',
      beats: [
        { t: 'Models also act in the world. Early wolf-removal programs assumed moose were caught in a predator pit, a low-density state held by predators, with a high-density state waiting above. Kill enough wolves, the model said, and moose would climb out to a new equilibrium.',
          cite: 'Wilmers et al. 2025',
          v: 'A potential-landscape curve with two wells; a ball (moose density) stuck in the low well; a hand removing wolves tilts the curve.' },
        { t: 'François Messier found instead that wolf predation tends to hold moose at a single equilibrium, and a National Research Council review found little support for alternative stable states in wolf–moose systems. A model of two states had helped justify real killing.',
          s: 'François Mess-yay found instead that wolf predation tends to hold moose at a single equilibrium, and a National Research Council review found little support for alternative stable states in wolf–moose systems. A model of two states had helped justify real killing.',
          cite: 'Messier 1994; National Research Council 1997',
          v: 'The two-well curve flattens into one well; the ball settles; wolf icons fade in the margin.' },
        { t: 'Not every model is mathematical: a range map in a field guide and a hunting regulation are models too. And a species distribution model estimates the realized niche, never the fundamental one.',
          v: 'A field-guide range map and a regulation card; beside them, a fundamental niche ellipse with the realized niche inside.' },
      ],
      init() {
        const r = U.rng(733);
        // Field-guide range map: a landmass, a smooth range polygon, and patchy occurrences.
        const land = []; for (let k = 0; k < 90; k++) { const a = k / 90 * Math.PI * 2; const f = 1 + 0.2 * U.noise2(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 5) + 0.06 * Math.sin(a * 7); land.push([280 + Math.cos(a) * 140 * f, 540 + Math.sin(a) * 150 * f]); }
        const range = []; for (let k = 0; k < 70; k++) { const a = k / 70 * Math.PI * 2; const f = 1 + 0.12 * U.noise2(Math.cos(a) * 1.2 + 4, Math.sin(a) * 1.2, 9); range.push([270 + Math.cos(a) * 112 * f, 475 + Math.sin(a) * 78 * f]); }
        const occ = []; for (let k = 0; k < 46; k++) { const x = 160 + r() * 240, y = 400 + r() * 170; const n = U.noise2(x / 50, y / 50, 21); if (n > -0.05) occ.push([x, y]); }
        const nicheOcc = []; for (let k = 0; k < 26; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.9; nicheOcc.push([Math.cos(a) * d, Math.sin(a) * d]); }
        return { land, range, occ, nicheOcc };
      },
      draw(g, t, S, D) {
        const X = (u) => 360 + u * 900, Y = (v) => 762 - (v + 1.4) * 228;
        const WX = 196, WY = [374, 468, 562, 656, 750];
        const tKill = cue(S, 0, 'Kill enough'), dK = 3.4, tau = clamp((t - (tKill - 0.2)) / dK), tRoll = tKill - 0.2 + dK * 0.86;
        const roll = ein(t, tRoll, 1.7);
        const tSingle = cue(S, 1, 'single equilibrium'), m = ein(t, tSingle - 0.8, 2.4);
        const aPlot = 1 - S.p(2, 0.7);
        if (aPlot > 0) g.withAlpha(aPlot, () => {
          const tPit = cue(S, 0, 'predator pit'), tLow = cue(S, 0, 'a low-density'), tHigh = cue(S, 0, 'a high-density'), tClimb = cue(S, 0, 'climb out');
          // Axis and landscape.
          g.arrow(X(0), 812, X(1) + 20, 812, { color: PAL.ink2, w: 2.2, head: 13, progress: S.p(0, 1.0) });
          g.text('Moose density', X(1) + 16, 794, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(0, 0.8, 0.4) });
          const Vnow = (u) => lerp(Vk(u, tau), V1(u), m);
          const pts = []; for (let k = 0; k <= 150; k++) { const u = k / 150; pts.push([X(u), Y(Vnow(u))]); }
          if (m > 0) { const gp = []; for (let k = 0; k <= 150; k++) { const u = k / 150; gp.push([X(u), Y(V0(u))]); } g.poly(gp, { color: PAL.ink3, w: 2, dash: [8, 8], alpha: 0.8 * m }); }
          g.poly([[X(0), 812], ...pts, [X(1), 812]], { fill: U.rgba(m > 0.5 ? COL : PAL.sand, 0.06), color: null, w: 0, alpha: S.p(0, 1, 0.3) });
          g.poly(pts, { color: m > 0 ? U.mix(PAL.ink, COL, m) : PAL.ink, w: 4, progress: S.p(0, 1.6, 0.2) });
          caps(g, 'the model: two stable states', X(0), 270, { color: PAL.ink2, alpha: S.p(0, 0.8, 0.8) * (1 - m) });
          // Ball.
          const uL = argminV((u) => Vk(u, Math.min(tau, 0.8)), 0.08, 0.45), uR = argminV((u) => Vk(u, tau), 0.55, 0.95);
          let ub = lerp(uL, uR, roll); ub = lerp(ub, argminV(V1, 0.2, 0.6), ein(t, tSingle - 0.4, 2.6));
          const bx = X(ub), by = Y(Vnow(ub)) - 19; const aB = S.p(0, 0.8, 1.2);
          g.glow(bx, by, 52, PAL.sand, 0.5 * aB); g.circle(bx, by, 18, { fill: PAL.sand, alpha: aB }); g.circle(bx - 5, by - 6, 5, { fill: '#FFFFFF', alpha: 0.5 * aB });
          caps(g, 'moose', bx, by - 34, { color: PAL.sand, align: 'center', alpha: aB });
          // Well labels.
          g.withAlpha(S.tp(tLow, 0.8) * (1 - m), () => g.text('low-density state', X(0.24), 852, { size: 22, color: PAL.ink, align: 'center' }));
          g.withAlpha(S.tp(tLow + 1.0, 0.8) * (1 - m), () => caps(g, 'held by predators', X(0.24), 882, { color: PAL.coral, align: 'center' }));
          g.withAlpha(S.tp(tHigh, 0.8) * (1 - m), () => g.text('high-density state', X(0.74), 852, { size: 22, color: PAL.ink, align: 'center' }));
          g.withAlpha(S.tp(tPit, 0.8) * clamp(1 - tau * 2.5), () => { const y = Y(V0(0.24)) - 96; g.text('Predator pit', X(0.24), y, { size: 34, role: 'display', italic: true, color: PAL.coral, align: 'center' }); });
          g.withAlpha(S.tp(Math.max(tClimb, tRoll + 1.4), 0.8) * (1 - m), () => { g.text('a new equilibrium?', X(uR), Y(Vk(uR, 1)) - 104, { size: 30, role: 'display', italic: true, color: PAL.sand, align: 'center' }); });
          // Messier and the NRC review.
          g.withAlpha(m, () => { g.text('one equilibrium', X(0.36), Y(V1(0.36)) + 66, { size: 26, role: 'display', italic: true, color: COL, align: 'center' }); caps(g, 'Messier 1994', X(0.36), Y(V1(0.36)) + 96, { color: COL, align: 'center' }); caps(g, 'the model', X(0.74), Y(V0(0.74)) + 44, { align: 'center' }); });
          const tN = cue(S, 1, 'National Research'); const aN = S.tp(tN, 0.8);
          if (aN > 0) { panel(g, 900, 234, 400, 116, aN); caps(g, 'National Research Council', 924, 268, { color: COL, alpha: aN }); g.wrap('little support for alternative stable states in wolf–moose systems', 924, 302, 360, { size: 21, color: PAL.ink, lh: 1.3, alpha: aN }); }
        });
        // Wolves in the margin: removed one by one, then remembered.
        const tReal = cue(S, 1, 'A model of two'); const aWol = S.p(0, 0.8, 0.6) * (1 - S.p(2, 0.6));
        if (aWol > 0) g.withAlpha(aWol, () => {
          caps(g, 'wolves', WX, 316, { color: PAL.coral, align: 'center' });
          WY.forEach((y, k) => { const rem = clamp((tau - k / 5) * 5); const ghost = 1 - 0.75 * rem; g.icon('wolf', WX, y, 70, PAL.coral, { alpha: ghost * (1 - 0.6 * ein(t, tReal + 2.2, 2.0)) }); if (rem > 0) g.line(WX - 40, y + 22, WX + 40, y - 22, { color: PAL.ink, w: 2.2, alpha: 0.7, progress: rem }); });
          if (tau > 0 && tau < 1) { const k = Math.min(4, Math.floor(tau * 5)), f = tau * 5 - k; hand(g, WX + 30, WY[k] - 22 - 60 * Math.sin(f * Math.PI), 60, PAL.violet, { alpha: 0.95 * Math.min(1, (1 - tau) * 8, tau * 10) }); }
          g.withAlpha(S.tp(tReal + 0.8, 0.8) * (1 - ein(t, tReal + 3.4, 1.4)), () => { caps(g, 'the killing', WX, 820, { color: PAL.coral, align: 'center' }); caps(g, 'was real', WX, 846, { color: PAL.coral, align: 'center' }); });
        });
        // ---- Beat 3: models that are not mathematical.
        const a3 = S.p(2, 0.8);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tR = cue(S, 2, 'a range map'), tH = cue(S, 2, 'a hunting regulation'), tSD = cue(S, 2, 'a species distribution'), tRe = cue(S, 2, 'realized niche'), tF = cue(S, 2, 'never the fundamental');
          const ink = '#2A2440', ink2 = '#6B5A3A';
          // Field guide page.
          g.withAlpha(S.p(2, 0.8, 0.3), () => {
            caps(g, 'a range map', 110, 262, { color: COL });
            g.rect(116, 292, 360, 520, { r: 4, fill: 'rgba(0,0,0,0.35)' }); g.rect(110, 284, 360, 520, { r: 4, fill: '#ECE3CC' });
            g.text('Moose', 134, 338, { size: 36, role: 'display', color: ink }); g.text('Alces alces', 134, 368, { size: 21, italic: true, color: ink2 });
            g.with(() => { const c = g.ctx; c.beginPath(); D.land.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = '#D9CCA8'; c.fill(); c.clip();
              c.beginPath(); D.range.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = 'rgba(110,145,80,0.55)'; c.fill(); c.strokeStyle = '#4F6B3A'; c.lineWidth = 2; c.stroke(); });
            g.poly([...D.land, D.land[0]], { color: '#7C6A48', w: 1.6 });
            const aO = S.tp(tR + 1.6, 0.8); D.occ.forEach(([x, y], k) => g.circle(x, y, 3.2, { fill: '#3A2E20', alpha: aO * S.tp(tR + 1.6 + k * 0.02, 0.3) }));
            g.rect(134, 744, 26, 16, { fill: 'rgba(110,145,80,0.55)', stroke: '#4F6B3A', w: 1.5 }); g.text('range', 170, 759, { size: 21, color: ink });
            g.circle(270, 752, 3.2, { fill: '#3A2E20', alpha: aO }); g.text('sightings', 282, 759, { size: 21, color: ink, alpha: aO });
            g.wrap('a hard edge drawn around patchy sightings', 110, 852, 360, { size: 21, color: PAL.ink2, lh: 1.3, alpha: aO });
          });
          // Hunting regulation card.
          g.withAlpha(S.tp(tH - 0.3, 0.8), () => {
            caps(g, 'a hunting regulation', 520, 262, { color: COL });
            g.rect(526, 292, 360, 520, { r: 4, fill: 'rgba(0,0,0,0.35)' }); g.rect(520, 284, 360, 520, { r: 4, fill: '#ECE3CC' });
            g.rect(520, 284, 360, 64, { r: 4, fill: '#4A3E5C' }); g.text('HUNTING REGULATIONS', 700, 326, { size: 21, weight: 700, ls: 2.4, color: '#ECE3CC', align: 'center' });
            g.text('Elk, antlerless', 544, 398, { size: 32, role: 'display', color: ink });
            [['Season', 0.62], ['Permits', 0.4], ['Legal area', 0.7], ['Bag limit', 0.3]].forEach(([s, f], k) => { const y = 460 + k * 66; g.line(544, y + 14, 856, y + 14, { color: '#9FB6C9', w: 1, alpha: 0.7 }); g.text(s, 544, y, { size: 21, color: ink2 }); g.rect(690, y - 18, 166 * f, 20, { r: 3, fill: '#2A2440', alpha: 0.75 }); });
            g.wrap('Permits set from a model of how the herd responds to harvest', 544, 742, 320, { size: 21, italic: true, color: ink, lh: 1.3 });
            g.wrap('a regulation encodes assumptions about the population', 520, 852, 360, { size: 21, color: PAL.ink2, lh: 1.3, alpha: S.tp(tH + 1.4, 0.8) });
          });
          // Niche ellipses.
          g.withAlpha(S.tp(tSD - 0.3, 0.8), () => {
            caps(g, 'species distribution model', 930, 262, { color: COL });
            const A = g.axes({ x: 968, y: 300, w: 330, h: 430, xlab: 'Temperature', ylab: 'Moisture', labSize: 22, progress: S.tp(tSD - 0.3, 1) });
            const F = [1130, 520, 140, 170], Rz = [1080, 592, 80, 88];
            g.ellipse(F[0], F[1], F[2], F[3], { stroke: PAL.ink2, w: 2.2, dash: [9, 7], fill: U.rgba(PAL.ink2, 0.05), alpha: S.tp(tSD + 0.4, 0.8) });
            g.text('fundamental', F[0], F[1] - F[3] - 12, { size: 22, color: PAL.ink2, align: 'center', alpha: S.tp(tSD + 0.6, 0.8) });
            const aR = S.tp(tRe - 0.4, 0.8);
            g.ellipse(Rz[0], Rz[1], Rz[2], Rz[3], { fill: U.rgba(COL, 0.24), stroke: COL, w: 2.6, alpha: aR });
            D.nicheOcc.forEach(([u, v], k) => g.circle(Rz[0] + u * Rz[2] * 0.85, Rz[1] + v * Rz[3] * 0.85, 4, { fill: PAL.sand, alpha: aR * S.tp(tRe + k * 0.03, 0.4) }));
            g.text('realized', Rz[0], Rz[1] + Rz[3] + 30, { size: 22, weight: 600, color: COL, align: 'center', alpha: aR });
            g.icon('wolf', 1160, 430, 52, PAL.coral, { alpha: aR * 0.95 }); caps(g, 'predators', 1160, 478, { color: PAL.coral, align: 'center', alpha: aR });
            g.wrap('An SDM fits occurrences: it estimates the realized niche.', 930, 800, 370, { size: 21, color: PAL.ink, lh: 1.3, alpha: S.tp(tRe, 0.8) });
            g.wrap('The fundamental niche is never observed directly.', 930, 860, 370, { size: 21, italic: true, color: PAL.ink2, lh: 1.3, alpha: S.tp(tF, 0.8) });
          });
        });
      },
      terms: [
        { beat: 0.6, term: 'Predator pit', def: 'A hypothesized low-density prey equilibrium maintained by predation, separated from a high-density equilibrium.' },
        { beat: 1.55, term: 'Alternative stable states', def: 'Different self-reinforcing states a system can occupy under the same conditions; shifting between them requires a large perturbation.' },
      ],
    },
  ],
});
})();
