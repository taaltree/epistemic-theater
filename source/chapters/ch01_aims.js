/* Chapter I — The aims of science. Case file: the Northern Range elk. */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;
const COL = PAL.sand;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the caption).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const lin = (t, t0, d) => clamp((t - t0) / d);
const REG = Theater.REG;

// A minimal standing person (people and management are violet).
function person(g, x, y, s, col, a = 1) {
  g.circle(x, y - s * 0.78, s * 0.15, { fill: col, alpha: a });
  g.with(() => { const c = g.ctx; c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x - s * 0.22, y); c.lineTo(x - s * 0.2, y - s * 0.42); c.quadraticCurveTo(x - s * 0.2, y - s * 0.6, x, y - s * 0.6); c.quadraticCurveTo(x + s * 0.2, y - s * 0.6, x + s * 0.2, y - s * 0.42); c.lineTo(x + s * 0.22, y); c.closePath(); c.fill(); });
}
// An open hand, palm down (management reaching in).
function hand(g, x, y, s, col, a = 1) {
  g.withAlpha(a, () => {
    g.rect(x - s * 0.32, y - s * 0.2, s * 0.64, s * 0.42, { r: s * 0.14, fill: col });
    [-0.24, -0.08, 0.08, 0.24].forEach((dx, i) => g.rect(x + dx * s - s * 0.065, y + s * 0.12, s * 0.13, s * (0.34 + (i === 1 || i === 2 ? 0.08 : 0)), { r: s * 0.065, fill: col }));
    g.with(() => { const c = g.ctx; c.translate(x - s * 0.3, y + s * 0.02); c.rotate(0.7); g.rect(-s * 0.065, 0, s * 0.13, s * 0.3, { r: s * 0.065, fill: col }); });
    g.rect(x - s * 0.18, y - s * 0.5, s * 0.36, s * 0.34, { r: s * 0.06, fill: col });
  });
}
// A spider: two body segments and eight bent legs.
function spider(g, x, y, s, col, a = 1) {
  g.withAlpha(a, () => {
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const ay = y - s * 0.08 + k * s * 0.07; const kx = x + sd * s * (0.26 + 0.04 * k), ky = ay - s * (0.16 - k * 0.06); g.poly([[x + sd * s * 0.06, ay], [kx, ky], [x + sd * s * (0.42 + 0.03 * k), ay + s * (0.1 + k * 0.05)]], { color: col, w: Math.max(1.6, s * 0.035) }); }
    g.ellipse(x, y + s * 0.1, s * 0.16, s * 0.2, { fill: col }); g.circle(x, y - s * 0.14, s * 0.1, { fill: col });
  });
}
// Rounded slot with a caps title and body text, used by the Toulmin diagram.
function slot(g, x, y, w, h, col, title, body, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  g.withAlpha(a, () => {
    g.rect(x, y, w, h, { r: 8, fill: U.rgba(col, o.fillA ?? 0.1), stroke: col, w: o.sw || 1.8 });
    caps(g, title, x + 16, y + 30, { color: col });
    if (body) g.wrap(body, x + 16, y + 64, w - 32, { size: o.size || 25, role: 'display', italic: !!o.italic, color: o.bodyColor || PAL.ink, lh: 1.2, alpha: o.bodyA ?? 1 });
  });
}

// The Northern Range elk count, stylized between the counts stated in the narration.
const X0 = 1994.6;
const elkAt = (yr) => yr <= 2013 ? 3915 + (19200 - 3915) * (0.5 + 0.5 * Math.cos(Math.PI * clamp((yr - X0) / (2013 - X0)))) : 3915 + (8000 - 3915) * U.smooth((yr - 2013) / 11);

Theater.chapter({
  id: 'aims', roman: 'I', title: 'Aims of Science', color: COL,
  question: 'Explain, predict, understand, or intervene?',
  casefile: { title: 'The Northern Range elk', sketch: 'elk' },
  intro: { t: 'Chapter one. The aims of science: what all this effort is for.' },
  scenes: [
    {
      id: 'aims-elk', title: 'Case file: the Northern Range elk', register: 'observe',
      beats: [
        { t: 'Begin with one herd. Just before wolves returned, the elk wintering on Yellowstone’s Northern Range numbered more than nineteen thousand. By 2013 the count had fallen to 3,915. Today it is roughly seven to nine thousand.',
          s: 'Begin with one herd. Just before wolves returned, the elk wintering on Yellowstone’s Northern Range numbered more than nineteen thousand. By 2013 the count had fallen to three thousand, nine hundred and fifteen. Today it is roughly seven to nine thousand.',
          cite: 'White et al. 2024; Wilmers et al. 2025',
          v: 'Case-file card pins in (elk sketch). Count series draws as a line, 1995 peak to 2013 low to today; wolf release marked on the axis.' },
        { t: 'Numbers like these invite different aims. Explain: why did the herd decline? Predict: will willows along the streams recover? Intervene: would killing predators bring the elk back?',
          v: 'Three tabs branch from the curve: EXPLAIN (a question mark over the decline), PREDICT (a dashed willow forecast), INTERVENE (a hand over the predator icons).' },
        { t: 'The aims can come apart. Predators kill many young ungulates, yet across fifty-two predator-removal experiments, removal often raised juvenile survival but rarely raised adult survival or abundance. A true causal fact does not guarantee the outcome of an intervention.',
          cite: 'Clark & Hebblewhite 2021',
          v: 'Grid of 52 small experiment tiles; most light up for juvenile survival, few for abundance.' },
        { t: 'Description, explanation, prediction, understanding, and control are all aims of science. Traditions rank them differently, and much confusion about what science is begins with confusion about what it is for.',
          v: 'A dial of five aims; the needle swings between them.' },
      ],
      init() {
        const r = U.rng(1013);
        const juv = new Set(), ab = new Set(); const idx = [...Array(52).keys()];
        const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
        shuffle(idx).slice(0, 36).forEach((i) => juv.add(i)); shuffle(idx).slice(0, 7).forEach((i) => ab.add(i));
        return { juv, ab };
      },
      draw(g, t, S, D) {
        g.casefile(96, 226, 270, 156, { title: 'The Northern Range elk', no: 'I', sketch: 'elk', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });
        const tHerd = S.b(0) + 0.3, tPre = cue(S, 0, 'Just before'), t19 = cue(S, 0, 'numbered more'), t13 = cue(S, 0, 'By 2013'), tNow = cue(S, 0, 'Today it is');
        // progress of the drawn series, in years
        const yrA = lerp(X0, 2013, ease.inOut(lin(t, t13 - 0.3, 2.6))), yr = t < tNow - 0.2 ? yrA : lerp(2013, 2024, ease.inOut(lin(t, tNow - 0.2, 2.2)));
        const plotA = vis(S, 0, 2, 0.9);
        const A = { x: 572, y: 296, w: 690, h: 450 };
        let Ax = null;
        if (plotA > 0) g.withAlpha(plotA, () => {
          caps(g, 'Elk counted, Northern Range winter range', A.x - 4, 262, { alpha: S.tp(tPre - 0.4, 0.8) });
          Ax = g.axes({ ...A, xmin: 1990, xmax: 2027, ymin: 0, ymax: 24000, progress: S.tp(tPre - 0.6, 1.2), labSize: 22, tickSize: 19,
            xticks: [{ v: 1995, l: '1995' }, { v: 2005, l: '2005' }, { v: 2013, l: '2013' }, { v: 2024, l: 'today' }],
            yticks: [5000, 10000, 15000, 20000].map((v) => ({ v, l: v.toLocaleString('en-US') })), grid: true });
          // wolves released
          const wa = S.tp(tPre, 0.8);
          g.line(Ax.X(1995.5), Ax.Y(0) - 2, Ax.X(1995.5), Ax.Y(elkAt(1995.5)) + 14, { color: PAL.coral, w: 1.6, dash: [5, 6], alpha: 0.8 * wa, progress: wa });
          g.icon('wolf', Ax.X(1995.5) - 6, Ax.Y(0) + 70, 40, PAL.coral, { alpha: wa });
          caps(g, 'wolves released 1995–96', Ax.X(1995.5) + 22, Ax.Y(0) + 78, { color: PAL.coral, alpha: wa });
          // the series
          const a19 = S.tp(t19, 0.7);
          if (a19 > 0) {
            if (yr > X0 + 0.01) g.plot(Ax, elkAt, { from: X0, to: yr, color: COL, w: 4 });
            g.dot(Ax.X(X0), Ax.Y(19200), 8, COL, a19, 3);
            g.text('more than 19,000', Ax.X(X0) + 22, Ax.Y(19200) - 44, { size: 24, color: PAL.ink, alpha: a19 });
            g.text('just before wolves returned', Ax.X(X0) + 22, Ax.Y(19200) - 17, { size: 21, italic: true, color: PAL.ink2, alpha: a19 });
            if (yr < 2024 && yr > X0 + 0.1) g.dot(Ax.X(yr), Ax.Y(elkAt(yr)), 6, COL, 1, 3);
          }
          const a13 = S.tp(t13 + 2.2, 0.7);
          g.dot(Ax.X(2013), Ax.Y(3915), 8, COL, a13, 3);
          g.text('3,915 in 2013', Ax.X(2013), Ax.Y(3915) + 46, { size: 24, color: PAL.ink, align: 'center', alpha: a13 });
          const aN = S.tp(tNow + 1.8, 0.7);
          g.rect(Ax.X(2024) - 9, Ax.Y(9000), 18, Ax.Y(7000) - Ax.Y(9000), { r: 6, fill: U.rgba(COL, 0.35), stroke: COL, w: 2, alpha: aN });
          g.text('7,000–9,000', Ax.X(2024) - 22, Ax.Y(9000) - 34, { size: 24, color: PAL.ink, align: 'center', alpha: aN });
          g.text('today', Ax.X(2024) - 22, Ax.Y(9000) - 10, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: aN });
          caps(g, 'stylized between reported counts', A.x + A.w, A.y + 8, { align: 'right', size: 15, alpha: a13 });
        });

        // The herd, one icon per thousand elk (beat 1).
        const hA = S.tp(tHerd, 0.9) * (1 - S.tp(cue(S, 1, 'Explain:') - 0.7, 0.6));
        if (hA > 0) g.withAlpha(hA, () => {
          const val = t < t19 ? 0 : t < tNow + 1.6 ? elkAt(Math.max(X0, yr)) : 7000;
          const n = val / 1000;
          for (let i = 0; i < 20; i++) {
            const cx = 132 + (i % 5) * 70, cy = 468 + Math.floor(i / 5) * 86; const f = clamp(n - i);
            g.icon('elk', cx, cy, 52, PAL.ink3, { alpha: 0.22 });
            if (f >= 0.999) g.icon('elk', cx, cy, 52, COL);
            else if (f > 0) g.clip(cx - 24, cy - 40, 50 * f, 70, () => g.icon('elk', cx, cy, 52, COL));
            else if (t > tNow + 1.6 && (i === 7 || i === 8)) g.icon('elk', cx, cy, 52, COL, { alpha: 0.42 * S.tp(tNow + 1.6, 0.6) });
          }
          if (t > t19 && t < t13 + 0.2) g.text('+', 132 + 4 * 70 + 34, 468 + 3 * 86 + 8, { size: 34, color: COL, alpha: S.tp(t19, 0.6) });
          caps(g, 'each = 1,000 elk', 110, 838, { alpha: S.tp(t19, 0.8) });
        });

        // Beat 2: three aims branch from the curve.
        const tE = cue(S, 1, 'Explain:'), tP = cue(S, 1, 'Predict:'), tI = cue(S, 1, 'Intervene:');
        const tabA = vis(S, 1, 2, 0.8);
        if (tabA > 0 && Ax) g.withAlpha(tabA, () => {
          const tabs = [
            { t0: tE, y: 418, lab: 'Explain', q: 'Why did the herd decline?', anchor: [2004, elkAt(2004)] },
            { t0: tP, y: 568, lab: 'Predict', q: 'Will streamside willow recover?', anchor: [2024, 8000] },
            { t0: tI, y: 718, lab: 'Intervene', q: 'Would killing predators bring the elk back?', anchor: [2024, 7000] },
          ];
          tabs.forEach((T, i) => {
            const a = S.tp(T.t0 - 0.2, 0.7); if (a <= 0) return; const dy = (1 - a) * 18;
            const ax = Ax.X(T.anchor[0]), ay = Ax.Y(T.anchor[1]);
            g.poly([[ax, ay], [470, T.y + 62]], { color: COL, w: 1.6, alpha: 0.6 * a, progress: S.tp(T.t0 - 0.2, 1.0), dash: [5, 5] });
            g.dot(ax, ay, 6, COL, a, 3);
            g.rect(96, T.y + dy, 374, 128, { r: 8, fill: U.rgba(COL, 0.08), stroke: U.rgba(COL, 0.7), w: 1.6, alpha: a });
            caps(g, T.lab, 116, T.y + 34 + dy, { color: COL, alpha: a });
            g.wrap(T.q, 116, T.y + 72 + dy, 236, { size: 25, role: 'display', italic: true, color: PAL.ink, lh: 1.18, alpha: a });
            const mx = 412, my = T.y + 70 + dy;
            if (i === 0) g.text('?', mx, my + 22, { size: 64, role: 'display', color: COL, align: 'center', alpha: a });
            if (i === 1) g.withAlpha(a, () => { g.icon('willow', mx - 22, my + 14, 40, PAL.moss); [[-24, 0.9], [-10, 0.6], [6, 0.3]].forEach(([d, k]) => g.line(mx - 2, my + 6, mx + 40, my + d, { color: PAL.moss, w: 2, dash: [4, 5], alpha: k })); });
            if (i === 2) g.withAlpha(a, () => { [['wolf', -36], ['puma', 2], ['bear', 40]].forEach(([k, dx]) => g.icon(k, mx + dx - 10, my + 26, 30, PAL.coral)); hand(g, mx - 10, my - 26 + 3 * Math.sin(t * 2), 38, PAL.violet); });
          });
          // the question mark hovers over the decline; the intervention asks for an upward arrow
          const qa = S.tp(tE + 0.6, 0.8);
          g.text('?', Ax.X(2004) + 40, Ax.Y(elkAt(2004)) - 40 + 4 * Math.sin(t * 1.5), { size: 96, role: 'display', italic: true, color: COL, alpha: qa });
          const ia = S.tp(tI + 0.8, 0.8);
          g.arrow(Ax.X(2024) + 24, Ax.Y(9000) - 52, Ax.X(2024) + 24, Ax.Y(17000), { color: PAL.violet, w: 2.6, dash: [7, 6], head: 14, alpha: ia, progress: S.tp(tI + 0.8, 1.2) });
          g.text('?', Ax.X(2024) + 52, Ax.Y(15500), { size: 40, role: 'display', italic: true, color: PAL.violet, alpha: ia });
        });

        // Beat 3: fifty-two experiments.
        const eA = vis(S, 2, 3, 0.9);
        if (eA > 0) g.withAlpha(eA, () => {
          const t52 = cue(S, 2, 'fifty-two'), tJ = cue(S, 2, 'often raised'), tR = cue(S, 2, 'rarely raised'), tK = cue(S, 2, 'Predators kill'), tT = cue(S, 2, 'A true causal');
          // predators kill many young
          const ka = S.tp(tK - 0.2, 0.8);
          g.withAlpha(ka, () => {
            caps(g, 'True: predators kill many young', 110, 446, { color: PAL.coral });
            g.icon('wolf', 160, 520, 78, PAL.coral);
            for (let i = 0; i < 5; i++) { const dead = i % 2 === 0; g.icon('elk', 240 + i * 46, 528, 34, dead ? PAL.ink3 : PAL.sand, { alpha: dead ? 0.55 : 1 }); if (dead) g.line(226 + i * 46, 512, 254 + i * 46, 540, { color: PAL.coral, w: 2.2 }); }
          });
          g.withAlpha(S.tp(tT, 1.0), () => g.wrap('A true causal fact does not guarantee the outcome of an intervention.', 110, 640, 380, { size: 34, role: 'display', italic: true, color: PAL.ink, lh: 1.2 }));
          caps(g, 'Fifty-two predator-removal experiments', 572, 262, { color: PAL.ink2, alpha: S.tp(t52, 0.8) });
          const grid = (gy, set, tOn, col, lab) => {
            caps(g, lab, 572, gy - 20, { color: col, alpha: S.tp(tOn - 0.6, 0.8) });
            for (let i = 0; i < 52; i++) {
              const x = 572 + (i % 13) * 53, y = gy + Math.floor(i / 13) * 53; const a = Math.max(0.35 * S.p(2, 0.8, 0.3 + (i % 13) * 0.03), S.tp(t52 + 0.2 + i * 0.022 + (gy > 500 ? 0.4 : 0), 0.4)); if (a <= 0) continue;
              const on = set.has(i) ? S.tp(tOn + (i % 13) * 0.03, 0.5) : 0;
              g.rect(x, y + (1 - a) * 10, 44, 44, { r: 6, fill: on > 0 ? U.rgba(col, 0.15 + 0.6 * on) : U.rgba(PAL.ink3, 0.08), stroke: on > 0.5 ? col : U.rgba(PAL.ink3, 0.55), w: 1.4, alpha: a });
              if (on > 0) g.text('↑', x + 22, y + 32, { size: 24, weight: 600, color: PAL.bg, align: 'center', alpha: on });
            }
            // Qualitative words from the narration, not counts: the meta-analysis numbers are not shown.
            g.text(gy > 500 ? 'rarely' : 'often', 1261, gy - 16, { size: 32, role: 'display', italic: true, color: col, align: 'right', alpha: S.tp(tOn, 0.8) });
          };
          grid(318, D.juv, tJ, PAL.moss, 'Juvenile survival rose');
          grid(628, D.ab, tR, COL, 'Adult survival or abundance rose');
          caps(g, 'illustrative pattern, not study counts', 1268, 878, { align: 'right', size: 15, alpha: S.tp(tJ, 0.8) });
        });

        // Beat 4: a dial of five aims.
        const dA = S.p(3, 0.9);
        if (dA > 0) g.withAlpha(dA, () => {
          const cx = 760, cy = 812, R = 360; const aims = ['description', 'explanation', 'prediction', 'understanding', 'control'];
          const phis = aims.map((_, i) => Math.PI * (0.9 - i * 0.2));
          const tn = aims.map((w, i) => cue(S, 3, i === 0 ? 'Description' : w));
          for (let k = 0; k <= 50; k++) { const p = Math.PI * k / 50; const r0 = k % 5 === 0 ? R - 92 : R - 84; g.line(cx + r0 * Math.cos(p), cy - r0 * Math.sin(p), cx + (R - 78) * Math.cos(p), cy - (R - 78) * Math.sin(p), { color: PAL.ink3, w: 1, alpha: 0.6 }); }
          // needle: points at each aim as it is named, then swings between them
          const tRank = cue(S, 3, 'Traditions'), tConf = cue(S, 3, 'much confusion');
          let ang = Math.PI * 0.5;
          for (let i = 0; i < 5; i++) { const p = ease.outBack(lin(t, tn[i] - 0.1, 0.7)); if (p > 0) ang = lerp(i === 0 ? Math.PI * 0.5 : phis[i - 1], phis[i], p); }
          const sw = lin(t, tRank, 0.8); if (sw > 0) ang = lerp(ang, Math.PI * 0.5 + 0.62 * Math.sin((t - tRank) * 1.6), ease.inOut(sw));
          const wob = lin(t, tConf, 1.0); if (wob > 0) ang += 0.12 * wob * Math.sin((t - tConf) * 7);
          // the two research traditions favor different aims
          const la = S.tp(tRank + 0.4, 0.8);
          [[g.LENS.pos.color, phis[2] + 0.1, 'Positivist'], [g.LENS.int.color, phis[3] - 0.05, 'Interpretivist']].forEach(([c, p, lab], j) => {
            g.line(cx, cy, cx + (R - 110) * Math.cos(p), cy - (R - 110) * Math.sin(p), { color: c, w: 2.2, dash: [6, 6], alpha: 0.85 * la });
            g.circle(cx + (R - 110) * Math.cos(p), cy - (R - 110) * Math.sin(p), 7, { fill: c, alpha: la });
            g.line(110, 812 + j * 34, 140, 812 + j * 34, { color: c, w: 2.2, dash: [6, 6], alpha: la }); caps(g, lab, 152, 818 + j * 34, { color: c, alpha: la });
          });
          caps(g, 'traditions rank', 110, 754, { alpha: la }); caps(g, 'them differently', 110, 778, { alpha: la });
          const near = phis.map((p) => clamp(1 - Math.abs(ang - p) / (Math.PI * 0.1)));
          // sectors
          aims.forEach((w, i) => {
            const p0 = phis[i] + Math.PI * 0.1, p1 = phis[i] - Math.PI * 0.1; const hi = S.tp(tn[i] - 0.1, 0.5);
            g.with(() => { const c = g.ctx; c.beginPath(); c.arc(cx, cy, R, -p0, -p1); c.arc(cx, cy, R - 74, -p1, -p0, true); c.closePath(); c.fillStyle = U.rgba(COL, 0.03 + 0.06 * hi + 0.3 * near[i]); c.globalAlpha *= S.p(3, 0.8); c.fill(); c.strokeStyle = U.rgba(COL, 0.5); c.lineWidth = 1.4; c.stroke(); });
            const lx = cx + (R + 34) * Math.cos(phis[i]), ly = cy - (R + 34) * Math.sin(phis[i]);
            const al = Math.cos(phis[i]) < -0.3 ? 'right' : Math.cos(phis[i]) > 0.3 ? 'left' : 'center';
            g.text(w, lx, ly + 10, { size: 34, role: 'display', italic: true, color: hi > 0.5 ? PAL.ink : PAL.ink2, align: al, alpha: 0.35 + 0.65 * hi });
          });
          g.arrow(cx, cy, cx + (R - 96) * Math.cos(ang), cy - (R - 96) * Math.sin(ang), { color: COL, w: 4, head: 20 });
          g.circle(cx, cy, 16, { fill: COL }); g.circle(cx, cy, 6, { fill: PAL.bg });
          g.text('What is science for?', cx, 892, { size: 40, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tConf + 1.2, 1.0) });
        });
      },
      terms: [
        { beat: 3.2, term: 'Aims of science', def: 'Goals that inquiry pursues: description, explanation, prediction, understanding, and intervention. They can conflict.' },
      ],
    },
    {
      id: 'aims-explain', title: 'What is an explanation?', register: 'infer',
      beats: [
        { t: 'In 1948, Carl Hempel and Paul Oppenheim proposed that to explain an event is to deduce it from general laws and initial conditions. On their deductive-nomological model, explanation and prediction are the same argument, made at different times.',
          cite: 'Hempel & Oppenheim 1948',
          v: 'Argument stack: LAWS + CONDITIONS, a rule, then EVENT; an arrow labelled “explain (after)” and “predict (before)”.' },
        { t: 'The symmetry breaks. A flagpole’s shadow and the sun’s angle let you deduce the pole’s height, but the shadow does not explain it. A correlative distribution model can predict where a species lives without saying why, and a mechanistic model can explain a process yet predict it poorly.',
          cite: 'Bromberger 1966',
          v: 'Flagpole, sun, and shadow triangle; deduction arrow runs both ways, explanation arrow only one. Then an occupancy map beside a mechanism diagram.' },
        { t: 'Wesley Salmon answered that explanation shows the causes and mechanisms that produced an event. Philip Kitcher answered that it unifies many phenomena under a few patterns of argument. Trophic cascade theory aspires to both: one mechanism linking otters and kelp, wolves and aspen, spiders and grass.',
          cite: 'Salmon 1984; Kitcher 1989; Estes et al. 1998; Schmitz et al. 1997',
          v: 'Left: a gear train (mechanism). Right: three food chains (otter–urchin–kelp, wolf–elk–aspen, spider–grasshopper–grass) collapse onto one template.' },
      ],
      init() {
        // Correlative occupancy map: a smooth suitability surface on a grid, with presence records.
        const cols = 26, rows = 19, cs = 21; const img = Theater.makeCanvas(cols * cs, rows * cs); const c = img.getContext('2d');
        const r = U.rng(48); const pres = [];
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const v = clamp(0.5 + 0.9 * U.fbm2(i * 0.11, j * 0.11, 21, 3) + 0.25 * Math.sin(i * 0.25) * Math.cos(j * 0.3));
          c.fillStyle = U.rgba(PAL.moss, 0.06 + 0.7 * v * v); c.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2);
          if (r() < v * v * 0.28) pres.push([i * cs + cs / 2, j * cs + cs / 2]);
        }
        return { img, pres, cols, rows, cs };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: the deductive-nomological argument
        const tEv = cue(S, 0, 'explain an event'), tDed = cue(S, 0, 'deduce'), tLaw = cue(S, 0, 'general laws'), tCon = cue(S, 0, 'initial conditions'), tSym = cue(S, 0, 'explanation and prediction');
        const dnA = vis(S, 0, 1, 0.9);
        if (dnA > 0) g.withAlpha(dnA, () => {
          const cx = 705; const x0 = 330, x1 = 1080;
          g.rect(x0, 236, x1 - x0, 392, { r: 10, fill: 'rgba(22,19,40,0.55)', stroke: PAL.rule, w: 1.4, alpha: S.p(0, 0.8) });
          caps(g, 'Deductive-nomological model', x0 + 26, 272, { color: COL, alpha: S.p(0, 0.8) });
          const row = (ty, expr, lab, t0, col) => { const a = S.tp(t0, 0.7); g.math(expr, x0 + 60 + (1 - a) * 12, ty, { size: 50, color: col || PAL.ink, alpha: a }); g.text(lab, x1 - 40, ty - 6, { size: 26, italic: true, color: PAL.ink2, align: 'right', alpha: a }); };
          [[352, tLaw], [432, tCon], [572, tEv]].forEach(([y, t0]) => g.line(x0 + 60, y + 8, x0 + 360, y + 8, { color: PAL.ink3, w: 1.4, dash: [6, 8], alpha: 0.6 * S.p(0, 0.8, 0.4) * (1 - S.tp(t0, 0.5)) }));
          row(352, 'L_{1}, L_{2}, …, L_{n}', 'general laws', tLaw);
          row(432, 'C_{1}, C_{2}, …, C_{k}', 'initial conditions', tCon);
          g.line(x0 + 50, 470, x1 - 40, 470, { color: PAL.ink, w: 2.4, progress: S.tp(tDed, 0.9) });
          caps(g, 'deduction', x1 - 40, 494, { align: 'right', alpha: S.tp(tDed, 0.8) });
          row(572, 'E', 'the event, explained', tEv, COL);
          g.text('∴', x0 + 22, 572, { size: 44, color: PAL.ink2, alpha: S.tp(tDed, 0.8) });
          // explanation and prediction: the same argument at different times
          const sa = S.tp(tSym, 0.9);
          const ty = 790; g.arrow(200, ty, 1240, ty, { color: PAL.ink2, w: 2, head: 14, alpha: sa, progress: S.tp(tSym, 1.2) });
          caps(g, 'time', 1240, ty + 34, { align: 'right', alpha: sa });
          g.circle(cx, ty, 11, { fill: COL, alpha: sa }); g.glow(cx, ty, 40, COL, 0.4 * sa); g.math('E', cx, ty - 26, { size: 34, color: COL, align: 'center', alpha: sa });
          const mini = (mx, a) => g.withAlpha(a, () => { g.rect(mx - 70, ty - 128, 140, 90, { r: 6, stroke: PAL.ink2, w: 1.4, fill: 'rgba(22,19,40,0.6)' }); for (let k = 0; k < 2; k++) g.line(mx - 50, ty - 106 + k * 18, mx + 50, ty - 106 + k * 18, { color: PAL.ink2, w: 2 }); g.line(mx - 56, ty - 66, mx + 56, ty - 66, { color: PAL.ink, w: 2 }); g.math('E', mx, ty - 46, { size: 22, color: COL, align: 'center' }); });
          const pa = S.tp(tSym + 0.8, 0.8), ea = S.tp(tSym + 2.0, 0.8);
          mini(420, pa); g.carrow(490, ty - 70, cx - 18, ty - 8, -0.2, { color: PAL.lagoon, w: 2.4, head: 13, alpha: pa, progress: S.tp(tSym + 0.9, 0.9) });
          g.text('predict', 420, ty + 46, { size: 30, role: 'display', italic: true, color: PAL.lagoon, align: 'center', alpha: pa }); caps(g, 'before the event', 420, ty + 74, { align: 'center', alpha: pa });
          mini(990, ea); g.carrow(920, ty - 70, cx + 18, ty - 8, 0.2, { color: COL, w: 2.4, head: 13, alpha: ea, progress: S.tp(tSym + 2.1, 0.9) });
          g.text('explain', 990, ty + 46, { size: 30, role: 'display', italic: true, color: COL, align: 'center', alpha: ea }); caps(g, 'after the event', 990, ty + 74, { align: 'center', alpha: ea });
          g.text('=', cx, ty - 76, { size: 44, color: PAL.ink2, align: 'center', alpha: S.tp(tSym + 2.6, 0.8) });
        });

        // ---- Beat 2a: the flagpole
        const tMap = cue(S, 1, 'A correlative');
        const fA = S.p(1, 0.9) * (1 - S.tp(tMap + 0.4, 0.7));
        if (fA > 0) g.withAlpha(fA, () => {
          const gy = 800, px = 560, top = 440, sx = 250; const sp = S.p(1, 1.2, 0.4);
          g.line(120, gy, 720, gy, { color: PAL.ink2, w: 2 });
          for (let k = 0; k < 18; k++) g.line(130 + k * 34, gy + 4, 116 + k * 34, gy + 18, { color: PAL.ink3, w: 1, alpha: 0.6 });
          // sun and ray
          const sunx = px + (px - sx) * 0.42, suny = top - (gy - top) * 0.42;
          g.glow(sunx, suny, 80, PAL.ochre, 0.5 * sp); g.circle(sunx, suny, 22, { fill: PAL.ochre, alpha: sp });
          for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + t * 0.1; g.line(sunx + 30 * Math.cos(a), suny + 30 * Math.sin(a), sunx + 42 * Math.cos(a), suny + 42 * Math.sin(a), { color: PAL.ochre, w: 2, alpha: sp }); }
          g.line(sunx, suny, sx, gy, { color: PAL.ochre, w: 1.4, dash: [6, 6], alpha: 0.7 * sp, progress: S.p(1, 1.4, 0.8) });
          // pole, flag, shadow
          g.line(px, gy, px, top, { color: PAL.ink, w: 5, progress: sp });
          g.poly([[px, top], [px - 70, top + 20], [px, top + 40]], { fill: U.rgba(COL, 0.9), color: null, alpha: sp });
          g.line(px, gy - 3, sx, gy - 3, { color: PAL.ink3, w: 7, alpha: 0.75 * S.p(1, 0.8, 1.0), progress: S.p(1, 1.0, 1.0) });
          caps(g, 'shadow', (px + sx) / 2, gy - 16, { align: 'center', size: 14, alpha: S.p(1, 0.8, 1.2) });
          g.math('h', px + 18, (gy + top) / 2, { size: 40, alpha: S.p(1, 0.8, 1.4) });
          g.math('s', (px + sx) / 2, gy + 50, { size: 40, align: 'center', alpha: S.p(1, 0.8, 1.6) });
          g.circle(sx, gy, 46, { stroke: PAL.ochre, w: 1.6, a0: -Math.atan2(gy - top, px - sx), a1: 0, alpha: S.p(1, 0.8, 1.8) });
          g.math('θ', sx + 62, gy - 14, { size: 32, color: PAL.ochre, alpha: S.p(1, 0.8, 1.8) });
          g.math('h = s \\cdot \\tan θ', 140, 300, { size: 46, alpha: S.p(1, 0.8, 2.0) });
          caps(g, 'Bromberger’s flagpole', 140, 252, { color: COL, alpha: S.p(1, 0.8) });
          // deduction runs both ways; explanation only one
          const tDd = cue(S, 1, 'let you deduce'), tNo = cue(S, 1, 'does not explain');
          const nx0 = 850, nx1 = 1190, ny = 480;
          const node = (x, lab, sub) => { g.rect(x - 105, ny - 44, 210, 88, { r: 8, fill: 'rgba(22,19,40,0.7)', stroke: PAL.ink2, w: 1.4 }); g.text(lab, x, ny - 4, { size: 27, role: 'display', color: PAL.ink, align: 'center' }); g.math(sub, x, ny + 30, { size: 26, color: PAL.ink2, align: 'center' }); };
          g.withAlpha(S.tp(tDd - 0.3, 0.8), () => { node(nx0, 'pole height', 'h'); node(nx1, 'shadow length', 's'); });
          const da = S.tp(tDd + 0.4, 0.8);
          g.arrow(nx0 + 112, ny - 70, nx1 - 112, ny - 70, { color: PAL.ink, w: 2.4, head: 13, both: true, alpha: da, progress: S.tp(tDd + 0.4, 0.9) });
          g.text('deduction runs both ways', (nx0 + nx1) / 2, ny - 92, { size: 23, color: PAL.ink, align: 'center', alpha: da });
          const ea = S.tp(tNo - 0.2, 0.8);
          g.arrow(nx0 + 112, ny + 84, nx1 - 112, ny + 84, { color: COL, w: 3, head: 15, alpha: ea, progress: S.tp(tNo - 0.2, 0.9) });
          g.text('explanation runs one way', (nx0 + nx1) / 2, ny + 122, { size: 23, color: COL, align: 'center', alpha: ea });
          const xa = S.tp(tNo + 0.8, 0.8);
          g.arrow(nx1 - 112, ny + 168, nx0 + 112, ny + 168, { color: PAL.ink3, w: 2, head: 12, dash: [6, 6], alpha: xa });
          g.line((nx0 + nx1) / 2 - 18, ny + 150, (nx0 + nx1) / 2 + 18, ny + 186, { color: PAL.coral, w: 3.5, alpha: xa }); g.line((nx0 + nx1) / 2 + 18, ny + 150, (nx0 + nx1) / 2 - 18, ny + 186, { color: PAL.coral, w: 3.5, alpha: xa });
          g.text('the shadow does not explain the height', (nx0 + nx1) / 2, ny + 224, { size: 23, italic: true, color: PAL.ink2, align: 'center', alpha: xa });
        });
        // ---- Beat 2b: a correlative map beside a mechanism
        const mA = S.tp(tMap + 0.6, 0.8) * (1 - S.p(2, 0.6));
        if (mA > 0) g.withAlpha(mA, () => {
          const tMech = cue(S, 1, 'a mechanistic model');
          const mx = 120, my = 290, W = D.cols * D.cs, H = D.rows * D.cs;
          caps(g, 'Correlative distribution model', mx, 258, { color: PAL.moss });
          g.withAlpha(S.tp(tMap, 1.0), () => g.ctx.drawImage(D.img, mx, my));
          g.rect(mx, my, W, H, { stroke: PAL.rule, w: 1.4 });
          D.pres.forEach(([x, y], k) => g.dot(mx + x, my + y, 3.5, PAL.ink, S.tp(tMap + 0.4 + k * 0.02, 0.4), 2));
          caps(g, 'shading: predicted occupancy  ·  dots: detections', mx, my + H + 30, { size: 15, alpha: S.tp(tMap + 0.8, 0.8) });
          const pa = S.tp(tMap + 1.4, 0.8);
          g.text('predicts where', mx, my + H + 82, { size: 28, role: 'display', italic: true, color: PAL.moss, alpha: pa }); g.text('✓', mx + 186, my + H + 82, { size: 28, color: PAL.moss, alpha: pa });
          g.text('says why', mx + 250, my + H + 82, { size: 28, role: 'display', italic: true, color: PAL.ink3, alpha: S.tp(tMap + 2.2, 0.8) }); g.text('✗', mx + 362, my + H + 82, { size: 28, color: PAL.coral, alpha: S.tp(tMap + 2.2, 0.8) });
          // mechanism diagram
          const ma = S.tp(tMech - 0.3, 0.8); const bx = 730;
          g.withAlpha(ma, () => {
            caps(g, 'Mechanistic model', bx, 258, { color: COL });
            const B = [['snow depth', 820, 340], ['forage access', 1050, 340], ['body condition', 1206, 470], ['predation risk', 820, 600], ['vigilance', 1050, 600], ['survival', 1206, 690]];
            const box = (lab, x, y) => { g.rect(x - 90, y - 32, 180, 64, { r: 8, fill: 'rgba(22,19,40,0.7)', stroke: COL, w: 1.6 }); g.text(lab, x, y + 8, { size: 23, color: PAL.ink, align: 'center' }); };
            const ar = (a, b, k) => { const [, x0, y0] = B[a], [, x1, y1] = B[b]; const d = Math.hypot(x1 - x0, y1 - y0); const ux = (x1 - x0) / d, uy = (y1 - y0) / d; const pad = Math.min(90 / Math.max(1e-3, Math.abs(ux)), 32 / Math.max(1e-3, Math.abs(uy))) + 8; g.arrow(x0 + ux * pad, y0 + uy * pad, x1 - ux * pad, y1 - uy * pad, { color: PAL.ink2, w: 2, head: 11, progress: S.tp(tMech + 0.2 + k * 0.25, 0.6) }); };
            ar(0, 1, 0); ar(1, 2, 1); ar(3, 4, 2); ar(4, 1, 3); ar(2, 5, 4); ar(3, 5, 5);
            B.forEach(([lab, x, y], k) => g.withAlpha(S.tp(tMech + k * 0.18, 0.5), () => box(lab, x, y)));
            const ea = S.tp(tMech + 1.8, 0.8);
            g.text('explains how', bx, my + H + 82, { size: 28, role: 'display', italic: true, color: COL, alpha: ea }); g.text('✓', bx + 170, my + H + 82, { size: 28, color: COL, alpha: ea });
            g.text('predicts well', bx + 236, my + H + 82, { size: 28, role: 'display', italic: true, color: PAL.ink3, alpha: S.tp(tMech + 2.8, 0.8) }); g.text('✗', bx + 400, my + H + 82, { size: 28, color: PAL.coral, alpha: S.tp(tMech + 2.8, 0.8) });
          });
        });

        // ---- Beat 3: mechanism and unification
        const uA = S.p(2, 0.9);
        if (uA > 0) g.withAlpha(uA, () => {
          const tSal = S.b(2), tKit = cue(S, 2, 'Philip Kitcher'), tFew = cue(S, 2, 'few patterns'), tBoth = cue(S, 2, 'aspires to both'), tPairs = [cue(S, 2, 'otters and kelp'), cue(S, 2, 'wolves and aspen'), cue(S, 2, 'spiders and grass')];
          // Salmon: gears of a causal mechanism
          const ga = S.p(2, 0.9, 0.3);
          g.withAlpha(ga, () => {
            caps(g, 'Salmon: causes and mechanisms', 110, 262, { color: COL });
            const gear = (x, y, R, n, rot, col, lab, side) => {
              const c = g.ctx; c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
              for (let k = 0; k < n * 4; k++) { const a = k / (n * 4) * Math.PI * 2; const rr = (k % 4 === 1 || k % 4 === 2) ? R + 12 : R; if (k === 0) c.moveTo(rr * Math.cos(a), rr * Math.sin(a)); else c.lineTo(rr * Math.cos(a), rr * Math.sin(a)); }
              c.closePath(); c.fillStyle = U.rgba(col, 0.14); c.fill(); c.strokeStyle = col; c.lineWidth = 2.4; c.stroke();
              c.beginPath(); c.arc(0, 0, R * 0.3, 0, Math.PI * 2); c.stroke(); c.restore();
              if (side) g.text(lab, x + R + 22, y + 8, { size: 26, role: 'display', italic: true, color: col }); else g.text(lab, x, y + R + 46, { size: 26, role: 'display', italic: true, color: col, align: 'center' });
            };
            const w = (t - tSal) * 0.6;
            gear(220, 440, 78, 12, w, PAL.coral, 'predator');
            gear(341, 525, 58, 9, -w * 78 / 58 + 0.2, PAL.sand, 'herbivore');
            gear(415, 436, 42, 7, w * 78 / 42 + 0.1, PAL.moss, 'plant', true);
            g.wrap('An explanation traces the causal process that produced the event.', 110, 700, 430, { size: 25, color: PAL.ink2, lh: 1.35, alpha: S.p(2, 0.8, 2.0) });
          });
          // Kitcher: three chains collapse onto one pattern
          const chains = [[['otter', PAL.coral], ['urchin', PAL.sand], ['kelp', PAL.moss]], [['wolf', PAL.coral], ['elk', PAL.sand], ['aspen', PAL.moss]], [['spider', PAL.coral], ['bug', PAL.sand], ['grass', PAL.moss]]];
          const ka = S.tp(tKit, 0.8), col = ease.inOut(lin(t, tFew - 0.2, 1.6));
          g.withAlpha(ka, () => {
            caps(g, 'Kitcher: unification', 650, 262, { color: COL });
            const rowsY = [350, 520, 690], names = ['Predator', 'Herbivore', 'Plant'];
            // template boxes
            g.withAlpha(col, () => {
              rowsY.forEach((y, j) => { g.rect(660, y - 62, 640, 124, { r: 10, fill: U.rgba(COL, 0.06), stroke: U.rgba(COL, 0.6), w: 1.6 }); g.text(names[j], 684, y + 10, { size: 32, role: 'display', color: PAL.ink }); });
              for (let j = 0; j < 2; j++) { g.arrow(1250, rowsY[j] + 64, 1250, rowsY[j + 1] - 64, { color: PAL.ink2, w: 2.2, head: 12 }); g.text('−', 1268, (rowsY[j] + rowsY[j + 1]) / 2 + 8, { size: 28, color: PAL.ink2 }); }
              g.carrow(660, rowsY[0] + 20, 660, rowsY[2] - 20, 0.28, { color: PAL.moss, w: 2.2, dash: [7, 6], head: 12, alpha: 0.9 });
              g.text('+', 604, (rowsY[0] + rowsY[2]) / 2 + 8, { size: 30, color: PAL.moss, align: 'center' });
            });
            chains.forEach((ch, i) => ch.forEach(([k, c], j) => {
              const x0 = 760 + i * 220, y0 = rowsY[j];
              const x1 = 930 + i * 110, y1 = rowsY[j];
              const x = lerp(x0, x1, col), y = y0; const sz = lerp(86, 62, col);
              const hi = tPairs.length ? S.tp(tPairs[i], 0.4) * (i < 2 ? 1 - S.tp(tPairs[i + 1], 0.4) : 1 - S.tp(tPairs[i] + 1.6, 0.6)) : 0;
              if (hi > 0) g.glow(x, y, sz * 1.1, c, 0.35 * hi);
              if (k === 'spider') spider(g, x, y, sz, c); else g.icon(k, x, y, sz, c);
              if (j < 2) g.arrow(x0, y0 + 50, x0, rowsY[j + 1] - 50, { color: PAL.ink3, w: 1.8, head: 10, alpha: 1 - col });
            }));
            g.withAlpha(1 - col, () => ['sea otter · urchin · kelp', 'wolf · elk · aspen', 'spider · grasshopper · grass'].forEach((lab, i) => caps(g, lab, 760 + i * 220, 800, { align: 'center', size: 15 })));
            g.text('one pattern, many cases', 980, 806, { size: 30, role: 'display', italic: true, color: COL, align: 'center', alpha: col });
          });
          // trophic cascade theory aspires to both
          const ba = S.tp(tBoth, 0.9);
          g.withAlpha(ba, () => {
            g.line(110, 852, 1300, 852, { color: COL, w: 1.6, progress: S.tp(tBoth, 1.0) });
            g.line(110, 852, 110, 836, { color: COL, w: 1.6 }); g.line(1300, 852, 1300, 836, { color: COL, w: 1.6, alpha: S.tp(tBoth + 0.8, 0.4) });
            g.text('Trophic cascade theory aspires to both', 705, 896, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center' });
          });
        });
      },
      terms: [
        { beat: 0.5, term: 'Deductive-nomological model', def: 'Hempel and Oppenheim’s account: an explanation is a valid deduction of the event from laws of nature plus initial conditions.' },
        { beat: 2.2, term: 'Causal-mechanical explanation', def: 'Salmon’s account: to explain is to describe the causal processes and mechanisms that produced the phenomenon.' },
        { beat: 2.55, term: 'Unification', def: 'Kitcher’s account: explanation fits many phenomena under a small number of argument patterns.' },
      ],
    },
    {
      id: 'aims-real', title: 'True, or merely useful?', register: 'claim',
      beats: [
        { t: 'When a theory works, is it true? Scientific realists say yes, approximately. Hilary Putnam argued that realism is the only view that does not make the success of science a miracle.',
          cite: 'Putnam 1975',
          v: 'A ladder of positions, top rung FULL REALISM lit; a successful prediction glows beside it.' },
        { t: 'Larry Laudan replied with history: the ether, caloric, and phlogiston all succeeded, and all were false. If success did not guarantee truth then, why now? This is the pessimistic meta-induction.',
          cite: 'Laudan 1981',
          v: 'Tombstones of past theories, each with a check mark for “successful”.' },
        { t: 'Antirealists offer humbler aims. Instrumentalists treat theories as tools. Bas van Fraassen asks only that a theory be empirically adequate, true about what is observable. Structural realists keep the mathematical structure that survives theory change.',
          cite: 'van Fraassen 1980; Worrall 1989',
          v: 'Ladder rungs fill downward: STRUCTURAL REALISM, CONSTRUCTIVE EMPIRICISM, INSTRUMENTALISM.' },
        { t: 'Ecology is full of things no one observes directly: niches, carrying capacity, predation risk, a landscape of fear. Real features of the world, or useful summaries? Your answer shapes what you think a study has shown.',
          v: 'Four unobservables float as ghosted labels over the elk landscape; a slider moves between “real” and “summary”.' },
      ],
      init() {
        // A fine-line Northern Range for the closing beat.
        const img = Theater.makeCanvas(1920, 1080); const c = img.getContext('2d'); c.lineCap = 'round';
        const r = U.rng(75);
        const layers = [[430, 46, 150, 0.8], [520, 34, 230, 0], [620, 22, 330, 0]].map(([base, amp, sc, pk], i) => {
          const y = (x) => { const u = x / sc; let v = 0.6 * U.noise1(u + i * 3.1, 70 + i) + 0.3 * U.noise1(u * 2.6, 80 + i) + 0.1 * U.noise1(u * 7, 90 + i); if (pk) { const n = U.noise1(u * 1.7, 99); v += pk * Math.pow(Math.max(0, 1 - n * n * 2.2), 3); } return base - amp * v; };
          const pts = []; for (let x = 100; x <= 1312; x += 6) pts.push([x, y(x)]); return { y, pts };
        });
        layers.forEach((L, i) => {
          if (i > 0) { const gr = c.createLinearGradient(0, 380, 0, 900); gr.addColorStop(0, 'rgba(14,13,26,0.4)'); gr.addColorStop(1, 'rgba(14,13,26,0)'); c.beginPath(); c.moveTo(100, 900); L.pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1312, 900); c.closePath(); c.fillStyle = gr; c.fill(); }
          c.strokeStyle = U.rgba(PAL.ink2, 0.22); c.lineWidth = 1; c.beginPath();
          for (let x = 104; x < 1308; x += 5) { const sl = (L.y(x + 3) - L.y(x - 3)) / 6; if (sl < 0.05) continue; const len = Math.min(50, 6 + 70 * sl); c.moveTo(x, L.y(x) + 3); c.lineTo(x + len * 0.22, L.y(x) + 3 + len); }
          c.stroke();
          c.strokeStyle = U.rgba(i ? PAL.snow : PAL.ink2, 0.55 + i * 0.1); c.lineWidth = 1.3 + i * 0.3; c.beginPath(); L.pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        });
        for (let k = 0; k < 9; k++) { const x = 130 + r() * 220; Theater.drawIcon(c, 'aspen', x, layers[2].y(x) + 40 + r() * 30, 30 + r() * 16, U.rgba(PAL.moss, 0.8)); }
        c.strokeStyle = U.rgba(PAL.ink3, 0.3); c.lineWidth = 1; c.beginPath();
        for (let k = 0; k < 90; k++) { const x = 110 + r() * 1190, y = layers[2].y(x) + 16 + r() * 200; if (y > 830) continue; for (let j = -1; j <= 1; j++) { c.moveTo(x + j * 2, y); c.lineTo(x + j * 3, y - 6); } }
        c.stroke();
        return { img, near: layers[2] };
      },
      draw(g, t, S, D) {
        const ladA = 1 - S.p(3, 0.8);
        const rungY = [318, 464, 610, 756], RX0 = 128, RX1 = 196;
        const tTomb = S.b(1), tLau = cue(S, 1, 'Larry Laudan');
        const tRungs = [S.tp(cue(S, 0, 'Scientific realists') - 0.2, 0.7), S.tp(cue(S, 2, 'Structural realists'), 0.7), S.tp(cue(S, 2, 'Bas van Fraassen'), 0.7), S.tp(cue(S, 2, 'Instrumentalists'), 0.7)];
        const names = ['Scientific realism', 'Structural realism', 'Constructive empiricism', 'Instrumentalism'];
        const gloss = ['Successful theories are approximately true', 'The mathematical structure is what is true', 'True about what is observable', 'Theories are tools; judge them by use'];
        if (ladA > 0) g.withAlpha(ladA, () => {
          const lp = S.p(0, 1.2);
          g.line(RX0, 240, RX0, 820, { color: PAL.ink2, w: 3, progress: lp }); g.line(RX1, 240, RX1, 820, { color: PAL.ink2, w: 3, progress: lp });
          caps(g, 'claims more', RX0, 226, { alpha: lp }); caps(g, 'claims less', RX0, 856, { alpha: lp });
          rungY.forEach((y, i) => {
            const on = tRungs[i]; const col = i === 0 ? COL : REG.claim.color;
            g.line(RX0, y, RX1, y, { color: on > 0 ? U.mix(PAL.ink3, col, on) : PAL.ink3, w: 4 + 2 * on, progress: lp });
            if (on > 0) g.glow((RX0 + RX1) / 2, y, 50, col, 0.35 * on * (i === 0 ? 1 - 0.6 * S.tp(tLau, 0.8) : 1));
            g.text(names[i], 226 + (1 - on) * 12, y + 4, { size: 33, role: 'display', color: PAL.ink, alpha: on });
            g.text(gloss[i], 226, y + 36, { size: 22, italic: true, color: PAL.ink2, alpha: on });
          });
          // Laudan cracks the top rung
          const cr = S.tp(tLau + 0.6, 1.0);
          if (cr > 0) { const cx = (RX0 + RX1) / 2 + 4, y = rungY[0]; g.line(cx - 5, y, cx + 7, y, { color: PAL.bg, w: 8, alpha: cr }); g.poly([[cx - 2, y - 20], [cx + 6, y - 9], [cx - 3, y - 2], [cx + 7, y + 6], [cx - 1, y + 20]], { color: PAL.coral, w: 2.4, progress: cr }); }
        });

        // ---- Beat 1: a successful prediction glows beside the top rung
        const prA = vis(S, 0, 1, 0.9);
        if (prA > 0) g.withAlpha(prA, () => {
          const tPut = cue(S, 0, 'Hilary Putnam');
          const A = g.axes({ x: 760, y: 300, w: 480, h: 330, xmin: 0, xmax: 10, ymin: 0, ymax: 10, progress: S.p(0, 1.0, 0.6), xlab: 'time', ylab: 'outcome', labSize: 22 });
          caps(g, 'A successful prediction', 760, 262, { color: COL, alpha: S.p(0, 0.8, 0.6) });
          const f = (x) => 2 + 6 / (1 + Math.exp(-(x - 5) * 0.9));
          g.plot(A, f, { color: COL, w: 3, dash: [9, 8], progress: S.p(0, 1.6, 1.2) });
          const obs = [[1.5, 2.3], [3, 3.4], [4.5, 4.6], [6, 6.6], [7.5, 7.7], [9, 7.9]];
          obs.forEach(([x, y], k) => { const a = S.p(0, 0.5, 2.4 + k * 0.35); g.dot(A.X(x), A.Y(y) - (1 - a) * 30, 6, PAL.ink, a, 2.4); });
          const ok = S.p(0, 0.8, 4.6); g.glow(A.X(7.5), A.Y(7.7), 90, COL, 0.4 * ok); g.circle(A.X(7.5), A.Y(7.7), 22, { stroke: COL, w: 2.4, alpha: ok });
          caps(g, 'stylized', 1240, 286, { align: 'right', size: 15 });
          g.withAlpha(S.tp(tPut, 1.0), () => { caps(g, 'Putnam’s no-miracles argument', 760, 730, { color: COL }); g.text('If our theories were not approximately true,', 760, 776, { size: 32, role: 'display', italic: true, color: PAL.ink }); g.text('their success would be a miracle.', 760, 818, { size: 32, role: 'display', italic: true, color: PAL.ink }); });
        });

        // ---- Beat 2: tombstones of successful, false theories
        const tbA = vis(S, 1, 2, 0.9);
        if (tbA > 0) g.withAlpha(tbA, () => {
          const tE = cue(S, 1, 'the ether'), tWhy = cue(S, 1, 'why now'), tPMI = cue(S, 1, 'This is the');
          const stones = [['Ether', 800, tE], ['Caloric', 990, cue(S, 1, 'caloric')], ['Phlogiston', 1180, cue(S, 1, 'phlogiston')]];
          const gy = 700; g.line(700, gy, 1300, gy, { color: PAL.ink2, w: 2, alpha: S.p(1, 0.8) });
          caps(g, 'Successful', 700, 300, { color: PAL.moss, alpha: S.tp(cue(S, 1, 'all succeeded'), 0.8) }); caps(g, 'and false', 870, 300, { color: PAL.coral, alpha: S.tp(cue(S, 1, 'all were false'), 0.8) }); g.text('✓', 846, 301, { size: 22, color: PAL.moss, alpha: S.tp(cue(S, 1, 'all succeeded'), 0.8) }); g.text('✗', 990, 301, { size: 22, color: PAL.coral, alpha: S.tp(cue(S, 1, 'all were false'), 0.8) });
          stones.forEach(([nm, x, t0], i) => {
            const a = S.tp(t0 - 0.2, 0.8); if (a <= 0) return; const rise = (1 - a) * 40;
            g.clip(700, 300, 620, gy - 300, () => g.with(() => { const c = g.ctx; c.beginPath(); c.moveTo(x - 72, gy + rise); c.lineTo(x - 72, gy - 210 + rise); c.arc(x, gy - 210 + rise, 72, Math.PI, 0); c.lineTo(x + 72, gy + rise); c.closePath(); c.fillStyle = 'rgba(40,36,62,0.95)'; c.fill(); c.strokeStyle = PAL.ink2; c.lineWidth = 2; c.stroke(); }));
            g.text(nm, x, gy - 196 + rise, { size: 28, role: 'display', color: PAL.ink, align: 'center', alpha: a });
            const ca = S.tp(cue(S, 1, 'all succeeded') + i * 0.2, 0.6), fa = S.tp(cue(S, 1, 'all were false') + i * 0.2, 0.6);
            g.text('✓', x - 24, gy - 110, { size: 38, weight: 600, color: PAL.moss, align: 'center', alpha: ca });
            g.text('✗', x + 26, gy - 110, { size: 38, weight: 600, color: PAL.coral, align: 'center', alpha: fa });
          });
          // and today's theory?
          const wa = S.tp(tWhy - 0.2, 0.8);
          g.withAlpha(wa, () => { const x = 1000, y = 800; g.rect(x - 160, y - 44, 320, 88, { r: 10, stroke: PAL.ink2, w: 1.6, dash: [7, 7] }); g.text('today’s theory?', x, y + 10, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center' }); g.text('✓', x - 196, y + 12, { size: 30, color: PAL.moss, alpha: 0.9 }); });
          g.text('Pessimistic meta-induction', 1000, 900, { size: 30, role: 'display', color: COL, align: 'center', alpha: S.tp(tPMI, 0.8) });
        });

        // ---- Beat 3: humbler aims, rung by rung
        const hA = vis(S, 2, 3, 0.9);
        if (hA > 0) g.withAlpha(hA, () => {
          const [aS, aC, aI] = [tRungs[1], tRungs[2], tRungs[3]];
          caps(g, 'Antirealist and middle positions', 760, 262, { color: REG.claim.color, alpha: S.p(2, 0.8) });
          // instrumentalism: a wrench
          g.withAlpha(aI, () => {
            const x = 900, y = rungY[3] - 6; g.with(() => { const c = g.ctx; c.translate(x, y); c.rotate(-0.6); g.rect(-8, -6, 120, 16, { r: 6, fill: PAL.ink2 }); g.circle(0, 2, 26, { fill: PAL.ink2 }); g.rect(-30, -6, 30, 16, { fill: PAL.bg }); });
            g.text('a model is good if it works', 1000, y + 10, { size: 26, role: 'display', italic: true, color: PAL.ink });
          });
          // constructive empiricism: the observable part of a picture is believed
          g.withAlpha(aC, () => {
            const x = 900, y = rungY[2] - 6;
            g.ellipse(x, y, 40, 22, { stroke: PAL.ink, w: 2.4 }); g.circle(x, y, 11, { fill: PAL.ink }); g.circle(x, y, 4, { fill: PAL.bg });
            g.icon('elk', 1000, y - 26, 44, PAL.sand); g.text('observable: believe it', 1040, y - 16, { size: 22, color: PAL.ink });
            g.circle(1000, y + 30, 16, { stroke: PAL.ink3, w: 1.6, dash: [4, 4] }); g.text('?', 1000, y + 38, { size: 21, color: PAL.ink3, align: 'center' });
            g.text('unobservable: suspend judgment', 1040, y + 38, { size: 22, italic: true, color: PAL.ink3 });
          });
          // structural realism: the equation survives the change of theory
          g.withAlpha(aS, () => {
            const y = rungY[1] - 6;
            g.rect(850, y - 46, 150, 92, { r: 8, stroke: PAL.ink3, w: 1.4, dash: [5, 5] }); caps(g, 'old theory', 925, y - 54, { size: 13, align: 'center' });
            g.rect(1130, y - 46, 150, 92, { r: 8, stroke: REG.claim.color, w: 1.6 }); caps(g, 'new theory', 1205, y - 54, { size: 13, align: 'center', color: REG.claim.color });
            const mv = ease.inOut(lin(t, cue(S, 2, 'Structural realists') + 0.4, 1.6));
            const lattice = (cx, a) => { const P = [[-40, -18], [0, -26], [40, -14], [-22, 20], [24, 22]]; [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4]].forEach(([i, j]) => g.line(cx + P[i][0], y + P[i][1], cx + P[j][0], y + P[j][1], { color: PAL.ink, w: 1.8, alpha: a })); P.forEach(([dx, dy]) => g.circle(cx + dx, y + dy, 5, { fill: PAL.ink, alpha: a })); };
            lattice(925, 0.35); lattice(lerp(925, 1205, mv), 1);
            g.arrow(1010, y, 1120, y, { color: REG.claim.color, w: 2, head: 11, alpha: 0.7 });
            caps(g, 'the structure survives', 1205, y + 72, { size: 13, align: 'center', color: REG.claim.color, alpha: mv });
          });
        });

        // ---- Beat 4: unobservables over the elk landscape, and a slider
        const lA = S.p(3, 0.9);
        if (lA > 0) g.withAlpha(lA, () => {
          g.ctx.drawImage(D.img, 0, 0);
          [[450, 700, 52], [520, 716, 44], [580, 694, 48], [650, 708, 42], [720, 700, 50]].forEach(([x, y, s], j) => g.icon('elk', x, y - 3 * Math.abs(Math.sin(t * 0.8 + j)), s, PAL.sand, { flip: j % 2 === 1 }));
          g.icon('wolf', 1120, 664, 48, PAL.coral);
          const tSl = cue(S, 3, 'Real features'), tAns = cue(S, 3, 'Your answer');
          // slider position: 0 real, 1 useful summary
          const sp = t < tSl ? 0.5 : 0.5 + 0.42 * Math.sin((t - tSl) * 1.2) * clamp((t - tSl) / 0.8);
          const solid = 1 - sp;
          const lab = (txt, x, y, t0, extra) => {
            const a = S.tp(t0, 0.9); if (a <= 0) return; const fl = 4 * Math.sin(t * 0.9 + x * 0.01);
            g.withAlpha(a * (0.35 + 0.65 * solid) * (0.85 + 0.15 * Math.sin(t * 1.6 + x)), () => { if (extra) extra(); g.text(txt, x, y + fl, { size: 38, role: 'display', italic: true, color: PAL.ink, align: 'center' }); });
          };
          const tN = cue(S, 3, 'niches'), tK = cue(S, 3, 'carrying capacity'), tR = cue(S, 3, 'predation risk'), tL = cue(S, 3, 'a landscape of fear');
          lab('niche', 580, 604, tN, () => g.ellipse(575, 694, 200, 62, { stroke: PAL.ink2, w: 1.8, dash: [6, 7] }));
          lab('carrying capacity, K', 420, 330, tK, () => g.line(130, 360, 1290, 360, { color: PAL.ink2, w: 1.6, dash: [10, 9] }));
          lab('predation risk', 1120, 574, tR, () => g.glow(1120, 660, 140, PAL.coral, 0.3));
          lab('a landscape of fear', 1040, 786, tL, () => { for (let k = 1; k <= 4; k++) g.ellipse(1120, 672, 46 * k, 18 * k, { stroke: PAL.coral, w: 1.4, dash: [5, 7], alpha: 0.7 - k * 0.12 }); });
          // slider
          const sa = S.tp(tSl - 0.3, 0.8); const sx0 = 420, sx1 = 990, sy = 862;
          g.withAlpha(sa, () => {
            g.line(sx0, sy, sx1, sy, { color: PAL.ink2, w: 3 });
            g.text('real', sx0 - 22, sy + 10, { size: 30, role: 'display', italic: true, color: solid > 0.5 ? COL : PAL.ink2, align: 'right' });
            g.text('useful summary', sx1 + 22, sy + 10, { size: 30, role: 'display', italic: true, color: solid < 0.5 ? COL : PAL.ink2 });
            const kx = lerp(sx0, sx1, sp); g.circle(kx, sy, 14, { fill: COL }); g.glow(kx, sy, 40, COL, 0.4);
          });
          g.text('Your answer shapes what you think a study has shown.', 705, 262, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tAns, 1.0) });
        });
      },
      terms: [
        { beat: 0.4, term: 'Scientific realism', def: 'The view that successful theories are approximately true, including their claims about unobservable entities.' },
        { beat: 0.75, term: 'No-miracles argument', def: 'Realism best explains the predictive success of science; otherwise that success would be a miracle (Putnam).' },
        { beat: 1.6, term: 'Pessimistic meta-induction', def: 'Many successful past theories were false, so success is weak evidence of truth for current ones (Laudan).' },
        { beat: 2.45, term: 'Constructive empiricism', def: 'Van Fraassen’s view that science aims only at empirical adequacy: truth about observables.' },
      ],
    },
    {
      id: 'aims-bands', title: 'Observe, infer, claim', register: 'all',
      beats: [
        { t: 'This film sorts every idea into three bands. Observation: records made by senses and instruments. Inference: reasoning from records through models and assumptions. Claim: a statement of knowledge, with its scope and confidence, offered for scrutiny.',
          v: 'The three bands build from the bottom: OBSERVE (green), INFER (amber), CLAIM (rose).' },
        { t: 'The bands follow Stephen Toulmin’s model of an argument. Data support a claim through a warrant, a general rule that licenses the step, which rests on backing. A qualifier says how strongly the claim holds; a rebuttal says when it would not.',
          cite: 'Toulmin 1958',
          v: 'Toulmin diagram docks to the right of the bands: data → claim, warrant beneath the arrow, backing below that, qualifier and rebuttal hanging from the claim.' },
        { t: 'Try it on the herd. Data: elk counts fell after 1995. Warrant: predators can reduce prey. Claim: wolves caused the decline. Qualifier: in part. Rebuttal: unless hunting and drought did most of the work, which, for the first decade, a demographic analysis found they did.',
          cite: 'Vucetich et al. 2005',
          v: 'Each Toulmin slot fills with the elk example; the rebuttal slot turns red and expands.' },
        { t: 'Each band adds assumptions, and each fails in its own way: observations can be biased, inferences confounded, and claims can outrun their warrant.',
          v: 'A crack appears in each band with its failure mode labelled.' },
      ],
      init() {
        const r = U.rng(2005); const cracks = {};
        ['observe', 'infer', 'claim'].forEach((k) => { const pts = []; const n = 13; let x = 0; for (let j = 0; j <= n; j++) { x = clamp(x + (r() - 0.5) * 26, -18, 18); pts.push([x, j / n]); } const bj = 4 + Math.floor(r() * 5); const br = [pts[bj], [pts[bj][0] + 22 + r() * 10, pts[bj][1] + 0.12], [pts[bj][0] + 34 + r() * 12, pts[bj][1] + 0.2]]; cracks[k] = { pts, br }; });
        return { cracks };
      },
      draw(g, t, S, D) {
        const ks = ['claim', 'infer', 'observe'];
        // Band geometry, full width or docked left.
        const dock = ease.inOut(S.lin(1, 1.4)) * (1 - ease.inOut(S.lin(3, 1.4)));
        const BX = 100, BY = 236, BH = 650, BW = lerp(1210, 300, dock), gap = BH * 0.06, bh = (BH - 2 * gap) / 3;
        const top = (k) => BY + ks.indexOf(k) * (bh + gap);
        // Beat 1: build from the bottom.
        const tO = cue(S, 0, 'Observation:'), tI = cue(S, 0, 'Inference:'), tC = cue(S, 0, 'Claim:');
        const rev = t < tI ? ease.out(lin(t, tO - 0.4, 0.9)) : t < tC ? 1 + ease.out(lin(t, tI - 0.4, 0.9)) : 2 + ease.out(lin(t, tC - 0.4, 0.9));
        const cutY = BY + BH - rev / 3 * (BH + 4);
        const named = [['observe', tO], ['infer', tI], ['claim', tC]];
        const cur = named.filter(([, c0]) => t >= c0 - 0.4).map(([k]) => k);
        const active = S.at(1) ? 'all' : cur.slice(-1);
        // ghost frames rise first, bottom to top, then fill as each band is named
        const ghA = 1 - S.p(1, 0.6);
        if (ghA > 0) ks.slice().reverse().forEach((k, i) => { const a = S.p(0, 0.8, 0.2 + i * 0.35) * ghA; g.rect(BX, top(k) + (1 - a) * 24, BW, bh, { r: 6, stroke: REG[k].color, w: 1.2, dash: [8, 8], alpha: 0.45 * a }); });
        const cy0 = S.at(1) ? BY - 10 : cutY; g.clip(BX - 10, cy0, BW + 20, BY + BH + 10 - cy0, () => g.bands(BX, BY, BW, BH, { active, labSize: 22, labPad: 24 }));
        // docked: a word or two per band
        if (dock > 0.05) [['observe', 'records'], ['infer', 'models + assumptions'], ['claim', 'scope + confidence']].forEach(([k, w]) => g.text(w, BX + 24, top(k) + bh / 2 + 44, { size: 24, role: 'display', italic: true, color: PAL.ink2, alpha: ease.inOut(clamp(dock * 1.4 - 0.4)) }));
        // definitions (beat 1) and their icons
        const defA = 1 - S.p(1, 0.6);
        if (defA > 0) {
          const D0 = { observe: 'Records made by senses and instruments', infer: 'Reasoning from records through models and assumptions', claim: 'A statement of knowledge, with scope and confidence, offered for scrutiny' };
          named.forEach(([k, c0]) => {
            const a = defA * S.tp(c0 + 0.3, 0.8); if (a <= 0) return; const y = top(k) + bh / 2;
            const lines = g.lines(D0[k], 560, { role: 'display', size: 36, italic: true });
            lines.forEach((ln, j) => g.text(ln, 300, y + 12 - (lines.length - 1) * 22 + j * 44, { size: 36, role: 'display', italic: true, color: PAL.ink, alpha: a }));
            g.withAlpha(a, () => {
              const ix = 1040;
              if (k === 'observe') { g.icon('collar', ix - 70, y, 66, PAL.ink2); g.ellipse(ix + 40, y, 46, 26, { stroke: PAL.ink, w: 2.4 }); g.circle(ix + 40, y, 12, { fill: PAL.ink }); g.icon('track', ix + 150, y + 4, 40, PAL.coral, { rot: 0.3 }); }
              if (k === 'infer') { g.line(ix - 110, y + 50, ix + 110, y + 50, { color: PAL.ink2, w: 2 }); g.line(ix - 110, y + 50, ix - 110, y - 55, { color: PAL.ink2, w: 2 }); const pts = []; for (let j = 0; j <= 30; j++) { const u = j / 30; pts.push([ix - 104 + 208 * u, y + 40 - 80 * (0.15 + 0.8 * u * u * (3 - 2 * u))]); } g.poly(pts, { color: REG.infer.color, w: 3 }); [0.1, 0.3, 0.5, 0.7, 0.9].forEach((u, j) => g.dot(ix - 104 + 208 * u, y + 40 - 80 * (0.15 + 0.8 * u * u * (3 - 2 * u)) + [10, -12, 8, -9, 6][j], 4.5, PAL.ink2, 1, 1.8)); g.pill('assumes', ix + 140, y - 40, { size: 18, color: REG.infer.color }); }
              if (k === 'claim') { g.with(() => { const c = g.ctx; c.translate(ix - 40, y); c.rotate(-0.04); g.rect(-46, -62, 92, 124, { r: 3, fill: '#E9E1CB' }); g.rect(-34, -48, 52, 8, { fill: '#3A3350' }); for (let j = 0; j < 6; j++) g.line(-34, -24 + j * 12, 34 - (j === 5 ? 26 : 0), -24 + j * 12, { color: '#8C8399', w: 1.4 }); }); g.pill('scope', ix + 70, y - 24, { size: 18, color: REG.claim.color }); g.pill('± confidence', ix + 70, y + 26, { size: 18, color: REG.claim.color }); }
            });
          });
        }

        // Beats 2–3: the Toulmin diagram, docked to the right of the bands.
        const tmA = vis(S, 1, 3, 0.9);
        if (tmA > 0) g.withAlpha(tmA, () => {
          const tD = cue(S, 1, 'Data support'), tW = cue(S, 1, 'through a warrant'), tB = cue(S, 1, 'backing'), tQ = cue(S, 1, 'A qualifier'), tR = cue(S, 1, 'a rebuttal');
          const eD = cue(S, 2, 'Data:'), eW = cue(S, 2, 'Warrant:'), eC = cue(S, 2, 'Claim:'), eQ = cue(S, 2, 'Qualifier:'), eR = cue(S, 2, 'Rebuttal:'), eF = cue(S, 2, 'which, for the first');
          const sw = (t0) => S.tp(t0, 0.7);
          const OC = REG.observe.color, IC = REG.infer.color, CC = REG.claim.color, RED = '#E8604E';
          const body = (gen, ex, t0) => { const p = sw(t0); return { txt: p < 0.5 ? gen : ex, a: Math.abs(1 - 2 * p) }; };
          const SL = (x, y, w, h, col, title, gen, ex, tIn, tEx, o = {}) => { const b = body(gen, ex, tEx); slot(g, x, y, w, h, col, title, b.txt, { alpha: S.tp(tIn - 0.2, 0.7), bodyA: b.a, italic: true, size: 25, bodyColor: S.at(2) && t > tEx ? PAL.ink : PAL.ink2, ...o }); };
          // the empty layout first, then each slot fills as it is named
          const gh = S.p(1, 0.9, 1.0) * (1 - S.tp(tR, 0.6));
          [[520, 290, 236, 110], [1010, 290, 290, 110], [610, 470, 330, 110], [610, 640, 330, 100], [1010, 470, 290, 130]].forEach(([x, y, w, h]) => g.rect(x, y, w, h, { r: 8, stroke: PAL.ink3, w: 1.2, dash: [6, 7], alpha: 0.55 * gh }));
          g.text('Toulmin’s model of an argument', 775, 826, { size: 30, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.p(1, 0.9, 0.6) * (1 - S.p(2, 0.6)) });
          // docking connectors from the bands
          const ca = S.tp(tD + 0.4, 0.8) * 0.5;
          const ex = BX + BW + 6;
          g.poly([[ex, top('observe') + bh / 2], [468, top('observe') + bh / 2], [468, 345], [512, 345]], { color: REG.observe.color, w: 1.3, dash: [4, 6], alpha: ca });
          g.poly([[ex, top('infer') + bh / 2], [560, top('infer') + bh / 2], [560, 525], [602, 525]], { color: REG.infer.color, w: 1.3, dash: [4, 6], alpha: ca });
          g.poly([[ex, top('claim') + 26], [1155, top('claim') + 26], [1155, 282]], { color: REG.claim.color, w: 1.3, dash: [4, 6], alpha: ca });
          // arrow data → claim with the qualifier riding on it
          g.arrow(756, 345, 1006, 345, { color: PAL.ink, w: 2.6, head: 15, alpha: S.tp(tD + 0.3, 0.6), progress: S.tp(tD + 0.3, 0.9) });
          SL(520, 290, 236, 110, OC, 'Data', 'what was observed', 'Elk counts fell after 1995', tD, eD);
          SL(1010, 290, 290, 110, CC, 'Claim', 'what we conclude', 'Wolves caused the decline', tD + 0.4, eC);
          const qa = S.tp(tQ - 0.2, 0.7);
          g.withAlpha(qa, () => { g.rect(820, 316, 130, 58, { r: 29, fill: 'rgba(22,19,40,0.95)', stroke: CC, w: 1.6 }); const b = body('how strongly', 'in part', eQ); g.text(b.txt, 885, 352, { size: 23, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: b.a }); caps(g, 'qualifier', 885, 300, { color: CC, align: 'center', size: 14 }); });
          // warrant and backing beneath the arrow
          const wa = S.tp(tW - 0.2, 0.7);
          g.line(770, 345, 770, 470, { color: IC, w: 1.8, alpha: wa, progress: wa });
          caps(g, 'since', 784, 420, { color: IC, size: 14, alpha: wa });
          SL(610, 470, 330, 110, IC, 'Warrant', 'a general rule that licenses the step', 'Predators can reduce prey', tW, eW);
          const ba = S.tp(tB - 0.2, 0.7);
          g.line(775, 580, 775, 640, { color: IC, w: 1.8, alpha: ba, progress: ba });
          caps(g, 'on account of', 790, 618, { color: IC, size: 14, alpha: ba });
          SL(610, 640, 330, 100, IC, 'Backing', 'support for the warrant', 'support for the warrant', tB, 1e9, { fillA: 0.05 });
          // rebuttal hangs from the claim; in the elk case it turns red and expands
          const ra = S.tp(tR - 0.2, 0.7), red = S.tp(eR, 0.8), grow = ease.inOut(lin(t, eF - 0.3, 1.2));
          g.line(1155, 400, 1155, 470, { color: CC, w: 1.8, alpha: ra, progress: ra });
          caps(g, 'unless', 1170, 446, { color: CC, size: 14, alpha: ra });
          const rh = lerp(130, 438, grow), rcol = U.mix(CC, RED, red);
          g.withAlpha(ra, () => {
            g.rect(1010, 470, 290, rh, { r: 8, fill: U.rgba(rcol, 0.1 + 0.12 * red), stroke: rcol, w: 1.8 + red });
            caps(g, 'Rebuttal', 1026, 500, { color: rcol });
            const b = body('when the claim would not hold', 'unless hunting and drought did most of the work', eR);
            g.wrap(b.txt, 1026, 534, 258, { size: 25, role: 'display', italic: true, color: PAL.ink, lh: 1.2, alpha: b.a });
            g.withAlpha(grow, () => {
              person(g, 1060, 720, 62, PAL.violet); g.line(1076, 690, 1112, 664, { color: PAL.violet, w: 3 });
              g.glow(1200, 668, 50, PAL.ochre, 0.5); g.circle(1200, 668, 18, { fill: PAL.ochre }); for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4; g.line(1200 + 24 * Math.cos(an), 668 + 24 * Math.sin(an), 1200 + 34 * Math.cos(an), 668 + 34 * Math.sin(an), { color: PAL.ochre, w: 2 }); }
              g.poly([[1160, 724], [1176, 716], [1190, 726], [1206, 714], [1224, 724], [1244, 716]], { color: PAL.clay, w: 2 });
              caps(g, 'hunting', 1072, 756, { color: PAL.violet, align: 'center' }); caps(g, 'drought', 1204, 756, { color: PAL.ochre, align: 'center' });
              g.wrap('First decade: a demographic analysis found they did most of the work', 1026, 804, 262, { size: 21, color: PAL.ink, lh: 1.28 });
            });
          });
        });

        // Beat 4: every band can fail.
        const fA = S.p(3, 0.9);
        if (fA > 0) g.withAlpha(fA, () => {
          const tAs = cue(S, 3, 'adds assumptions');
          const fails = [['observe', cue(S, 3, 'biased'), 'biased'], ['infer', cue(S, 3, 'confounded'), 'confounded'], ['claim', cue(S, 3, 'outrun'), 'outruns its warrant']];
          // assumptions accumulate up the stack
          ks.slice().reverse().forEach((k, i) => { for (let j = 0; j <= i; j++) { const a = S.tp(tAs + 0.3 + i * 0.35 + j * 0.12, 0.5); g.pill('+ assumption', 1290 - j * 150, top(k) + 34, { size: 16, color: REG[k].color, align: 'right', alpha: a }); } });
          fails.forEach(([k, t0, lab]) => {
            const p = S.tp(t0 - 0.2, 0.9); if (p <= 0) return; const cx = { observe: 520, infer: 640, claim: 760 }[k], y0 = top(k) - 2, h = bh + 4;
            const P = (q) => q.map(([dx, f]) => [cx + dx, y0 + f * h]); const pts = P(D.cracks[k].pts), br = P(D.cracks[k].br);
            g.poly(pts, { color: '#0A0914', w: 5, progress: p }); g.poly(pts, { color: REG[k].color, w: 1.4, progress: p });
            g.poly(br, { color: '#0A0914', w: 3.5, progress: clamp(p * 2 - 1) }); g.poly(br, { color: REG[k].color, w: 1.1, progress: clamp(p * 2 - 1) });
            g.text(lab, cx + 70, top(k) + bh / 2 + 14, { size: 40, role: 'display', italic: true, color: REG[k].color, alpha: S.tp(t0 + 0.2, 0.7) });
          });
        });
      },
      terms: [
        { beat: 0.35, term: 'Observation', def: 'A record produced by senses or instruments; the data a claim rests on. Never wholly free of theory (Chapter VI).' },
        { beat: 0.6, term: 'Inference', def: 'Reasoning from observations to conclusions through models and assumptions.' },
        { beat: 0.85, term: 'Knowledge claim', def: 'A statement offered as knowledge, with explicit scope and confidence, open to scrutiny.' },
        { beat: 1.3, term: 'Warrant (Toulmin)', def: 'The general rule licensing the step from data to claim, supported by backing and limited by qualifiers and rebuttals.' },
      ],
    },
  ],
});
})();
