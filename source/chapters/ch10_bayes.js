/* Chapter X — Bayesian epistemology: evidence changes belief. Case file: updating on the cascade.
 * Illustrative numbers (camera-trap base rates; flat-prior reading of the −0.18 interval) are labelled as such on screen. */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease, clamp } = U;
const COL = PAL.lagoon;

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
// Beta density on a grid, normalized to unit area: [[θ, density], ...].
const betaPts = (a, b, N = 160) => {
  const out = []; let mx = -Infinity;
  for (let k = 0; k <= N; k++) { const x = Math.min(0.999, Math.max(0.001, k / N)); const l = (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x); out.push([k / N, l]); if (l > mx) mx = l; }
  let s = 0; for (const p of out) { p[1] = Math.exp(p[1] - mx); s += p[1]; } s /= N;
  for (const p of out) p[1] /= s; return out;
};
const lerpPts = (A, B, f) => A.map((p, k) => [p[0], lerp(p[1], B[k][1], f)]);
const peak = (P) => P.reduce((m, p) => Math.max(m, p[1]), 0);
const massAbove = (P, x0) => { let s = 0, t = 0; for (const [x, y] of P) { t += y; if (x > x0) s += y; } return s / t; };
const npdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const ncdf = (z) => { const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2); return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y); };
// Filled area under a curve (screen points) down to baseline y0, optionally clipped to x range.
const area = (g, pts, y0, col, a = 1) => { if (a <= 0 || pts.length < 2) return; g.poly([[pts[0][0], y0], ...pts, [pts[pts.length - 1][0], y0]], { fill: col, color: null, w: 0, close: true, alpha: a }); };
// Equation built from colored pieces; returns the x-center of each piece.
const eqn = (g, pieces, cx, y, size, gap) => {
  const ws = pieces.map((p) => g.mathW(p.s, size)); const tot = ws.reduce((s, w) => s + w, 0) + gap * (pieces.length - 1);
  let x = cx - tot / 2; const centers = [];
  pieces.forEach((p, k) => { g.math(p.s, x, y, { size, color: p.col, alpha: p.a ?? 1 }); centers.push(x + ws[k] / 2); x += ws[k] + gap; });
  return centers;
};

Theater.chapter({
  id: 'bayes', roman: 'X', title: 'Bayesian Evidence', color: COL,
  question: 'How much should evidence change belief?',
  casefile: { title: 'Updating on the cascade', sketch: 'aspen' },
  intro: { t: 'Chapter ten. Bayesian epistemology: how evidence should change belief.' },
  scenes: [
    {
      id: 'bayes-credence', title: 'Degrees of belief', register: 'claim',
      beats: [
        { t: 'Bayesian epistemology treats belief as a matter of degree. A credence is a probability, from zero to one, that a hypothesis is true. Frank Ramsey argued that credences should obey the laws of probability: if they do not, a clever bookie could sell you a set of bets that loses whatever happens, a Dutch book.',
          cite: 'Ramsey 1926',
          v: 'A credence meter from 0 to 1; a bookie’s ledger of bets that sums to a guaranteed loss for incoherent credences.' },
        { t: 'Bayes’ theorem says how evidence should change a credence. The posterior probability of a hypothesis, given the evidence, is proportional to its prior probability times the likelihood: how probable the evidence would be if the hypothesis were true.',
          v: 'Equation builds: P(H | E) = P(E | H) · P(H) / P(E); prior curve × likelihood curve → posterior curve.' },
        { t: 'Updating this way is called conditionalization. Evidence confirms a hypothesis when it raises its probability, and disconfirms it when it lowers it. On this view, confirmation comes in degrees.',
          v: 'The posterior becomes the next prior; a stream of data points reshapes it step by step.' },
      ],
      init() {
        // θ = share of young aspen stems browsed. Prior Beta(3,3); 7 of 10 browsed; posterior Beta(10,6).
        const prior = betaPts(3, 3), post = betaPts(10, 6);
        const lik = betaPts(8, 4); // shape of θ^7(1−θ)^3, normalized
        // Then a stream of stems (1 = browsed, 0 = not): each updates the posterior.
        const seq = [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0];
        const steps = [{ a: 10, b: 6 }]; seq.forEach((d) => { const s = steps[steps.length - 1]; steps.push({ a: s.a + d, b: s.b + 1 - d }); });
        steps.forEach((s) => { s.P = betaPts(s.a, s.b); s.pH = massAbove(s.P, 0.5); });
        return { prior, post, lik, seq, steps };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: credences and the Dutch book -----------------------------------------
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tZ = cue(S, 0, 'from zero to one'), tR = cue(S, 0, 'Frank Ramsey'), tLaw = cue(S, 0, 'laws of probability');
          const tBook = cue(S, 0, 'a clever bookie'), tSet = cue(S, 0, 'a set of bets'), tLose = cue(S, 0, 'loses whatever'), tDB = cue(S, 0, 'a Dutch book');
          caps(g, 'Credence', 110, 262, { alpha: S.p(0, 0.8) });
          const meter = (x, y, w, ls, lab, v, a, col, big) => g.withAlpha(a, () => {
            g.text(lab, x, y - 62, { size: ls, color: PAL.ink });
            g.rect(x, y - 7, w, 14, { r: 7, fill: U.rgba(PAL.ink2, 0.14) });
            g.rect(x, y - 7, w * v, 14, { r: 7, fill: col });
            for (const [tv, tl] of [[0, '0'], [0.5, '0.5'], [1, '1']]) { g.line(x + w * tv, y + 11, x + w * tv, y + 19, { color: PAL.ink3, w: 1.5 }); g.text(tl, x + w * tv, y + 46, { size: 21, role: 'mono', color: PAL.ink3, align: 'center' }); }
            const px = x + w * v; g.poly([[px, y - 13], [px - 11, y - 31], [px + 11, y - 31]], { fill: PAL.ink, color: null, w: 0, close: true });
            g.text(v.toFixed(2), x + w + 26, y + 9, { size: 26, role: 'mono', color: PAL.ink });
            if (big > 0) { caps(g, 'certainly false', x, y + 82, { alpha: big }); caps(g, 'certainly true', x + w, y + 82, { align: 'right', alpha: big }); }
          });
          // The pointer drifts (belief comes in degrees), sweeps the scale, then settles.
          const wob = (tt) => 0.5 + 0.17 * Math.sin((tt - S.b(0)) * 1.4);
          const u = t - tZ, v0 = wob(tZ); let v = wob(t);
          if (u > 0) v = u < 0.7 ? lerp(v0, 0, ease.inOut(u / 0.7)) : u < 2.0 ? lerp(0, 1, ease.inOut((u - 0.7) / 1.3)) : lerp(1, 0.6, ease.inOut((u - 2.0) / 0.9));
          const sh = ease.inOut(clamp((t - tR + 0.2) / 1.2));
          meter(lerp(250, 140, sh), lerp(560, 400, sh), lerp(840, 380, sh), lerp(34, 25, sh), 'H: this track is a wolf’s', v, S.p(0, 0.8, 0.3), COL, 1 - sh);
          g.withAlpha(S.p(0, 0.8, 0.6) * (1 - sh), () => { g.icon('track', 1210, 420, 120, PAL.coral, { rot: -0.2 }); caps(g, 'whose track?', 1210, 520, { align: 'center' }); });
          meter(140, 580, 380, 25, 'not-H: it is not a wolf’s', 0.6, S.tp(tR + 0.8, 0.7), PAL.heather, 0);
          g.withAlpha(S.tp(tLaw + 0.6, 0.8), () => {
            g.text('0.60 + 0.60 = 1.20', 110, 680, { size: 30, role: 'mono', color: PAL.coral });
            caps(g, 'the laws of probability say 1.00', 110, 716, { color: PAL.ink2 });
            g.text('incoherent', 110, 768, { size: 34, role: 'display', italic: true, color: PAL.coral, alpha: S.tp(tLaw + 1.6, 0.8) });
          });
          // The bookie's ledger.
          const LX = 650, LW = 640;
          const aL = S.tp(tBook, 0.8);
          if (aL > 0) g.withAlpha(aL, () => {
            g.rect(LX, 250, LW, 640, { r: 10, fill: 'rgba(28,24,48,0.92)', stroke: PAL.rule, w: 1.4 });
            for (let y = 352; y < 870; y += 46) g.line(LX + 20, y, LX + LW - 20, y, { color: PAL.faint, w: 1 });
            caps(g, 'The bookie’s ledger', LX + 28, 292, { color: PAL.parchment });
            caps(g, 'illustrative', LX + LW - 28, 292, { align: 'right' });
            caps(g, 'bet', LX + 28, 336); caps(g, 'pays', LX + 250, 336); caps(g, 'you pay', LX + LW - 28, 336, { align: 'right' });
            const rows = [['on H', '$1 if wolf', '$0.60'], ['on not-H', '$1 if not', '$0.60']];
            rows.forEach(([a, b, c], i) => {
              const y = 386 + i * 46, ra = S.tp(tSet + i * 0.5, 0.6);
              g.text(a, LX + 28, y, { size: 24, color: PAL.ink, alpha: ra }); g.text(b, LX + 250, y, { size: 24, color: PAL.ink2, alpha: ra });
              g.text(c, LX + LW - 28, y, { size: 24, role: 'mono', color: i ? PAL.heather : COL, align: 'right', alpha: ra });
            });
            const aT = S.tp(tSet + 1.2, 0.6);
            g.line(LX + 28, 454, LX + LW - 28, 454, { color: PAL.ink2, w: 1.5, alpha: aT });
            g.text('total', LX + 28, 488, { size: 24, color: PAL.ink, alpha: aT }); g.text('$1.20', LX + LW - 28, 488, { size: 26, role: 'mono', color: PAL.ink, align: 'right', alpha: aT });
            g.text('A fair price for a $1 bet equals your credence.', LX + 28, 540, { size: 21, color: PAL.ink3, italic: true, alpha: S.tp(tSet + 1.6, 0.6) });
            // Outcomes.
            const outc = [['if it is a wolf', 0], ['if it is not', 1]];
            outc.forEach(([lab], i) => {
              const x = LX + 28 + i * 300, oa = S.tp(tLose + i * 0.4, 0.6);
              g.withAlpha(oa, () => {
                g.rect(x, 576, 284, 168, { r: 8, fill: U.rgba(PAL.coral, 0.07), stroke: U.rgba(PAL.coral, 0.45), w: 1.2 });
                caps(g, lab, x + 18, 610, { color: PAL.ink2 });
                g.text('win $1.00 − $1.20', x + 18, 652, { size: 24, color: PAL.ink2 });
                g.text('−$0.20', x + 18, 718, { size: 44, weight: 300, color: PAL.coral });
              });
            });
            // Stamp.
            const sa = S.tp(tDB, 0.5);
            if (sa > 0) g.with(() => {
              const c = g.ctx; c.translate(LX + LW / 2, 810); c.rotate(-0.06); const sc = lerp(1.4, 1, ease.out(sa)); c.scale(sc, sc);
              g.rect(-190, -38, 380, 70, { r: 6, stroke: PAL.coral, w: 3.5, alpha: sa });
              g.text('DUTCH BOOK', 0, 13, { size: 36, weight: 700, ls: 6, color: PAL.coral, align: 'center', alpha: sa });
            });
          });
          // Prices are credences: link meters to the ledger.
          const ka = S.tp(tSet + 0.4, 0.8) * (1 - S.p(1, 0.5));
          g.carrow(600, 392, LX + LW - 110, 376, -0.12, { color: COL, w: 1.6, head: 10, dash: [5, 6], progress: ka, alpha: 0.7 });
          g.carrow(600, 572, LX + LW - 110, 424, 0.12, { color: PAL.heather, w: 1.6, head: 10, dash: [5, 6], progress: ka, alpha: 0.7 });
        });

        // ---- Beat 2: Bayes' theorem -------------------------------------------------------
        const tPost = cue(S, 1, 'The posterior probability'), tProp = cue(S, 1, 'proportional'), tPri = cue(S, 1, 'prior probability'), tLik = cue(S, 1, 'times the likelihood'), tHow = cue(S, 1, 'how probable');
        const a1 = vis(S, 1, 2);
        const PCOL = PAL.heather, LCOL = PAL.ochre;
        if (a1 > 0) g.withAlpha(a1, () => {
          const hi = (t0) => S.tp(t0, 0.5) * (1 - 0.5 * S.tp(t0 + 2.4, 0.8));
          const pieces = [
            { s: 'P(H\\,|\\,E)', col: COL }, { s: '=', col: PAL.ink2 }, { s: 'P(E\\,|\\,H)', col: LCOL }, { s: '\\cdot', col: PAL.ink2 },
            { s: 'P(H)', col: PCOL }, { s: '/', col: PAL.ink2 }, { s: 'P(E)', col: PAL.ink2 },
          ];
          pieces.forEach((p, k) => { p.a = S.p(1, 0.6, 0.4 + k * 0.28); });
          const cx = eqn(g, pieces, 705, 340, 60, 16);
          const tag = (k, lab, col, t0) => { const a = S.p(1, 0.6, 0.6 + k * 0.28); caps(g, lab, cx[k], 392, { align: 'center', color: col, alpha: a }); g.glow(cx[k], 322, 90, col, 0.22 * hi(t0)); };
          tag(0, 'posterior', COL, tPost); tag(2, 'likelihood', LCOL, tLik); tag(4, 'prior', PCOL, tPri); tag(6, 'evidence', PAL.ink3, 1e9);
          g.text('the posterior is proportional to likelihood × prior', 705, 462, { size: 32, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tProp, 0.8) });
          // Three panels: prior × likelihood → posterior.
          const panel = (x, P, col, lab, a, prog) => {
            if (a <= 0) return null;
            return g.withAlpha(a, () => {
              caps(g, lab, x, 542, { color: col });
              const A = g.axes({ x, y: 560, w: 300, h: 220, xmin: 0, xmax: 1, ymin: 0, ymax: 3.6, arrows: false, xticks: [{ v: 0, l: '0' }, { v: 1, l: '1' }] });
              const pts = P.map(([x0, y0]) => [A.X(x0), A.Y(y0)]);
              if (prog >= 1) area(g, pts, A.Y(0), U.rgba(col, 0.16));
              g.poly(pts, { color: col, w: 3.5, progress: prog });
            });
          };
          panel(110, D.prior, PCOL, 'prior', S.tp(tPri, 0.7), S.tp(tPri + 0.2, 1.0));
          panel(510, D.lik, LCOL, 'likelihood', S.tp(tLik, 0.7), S.tp(tLik + 0.2, 1.0));
          g.text('×', 460, 690, { size: 50, role: 'display', color: PAL.ink2, align: 'center', alpha: S.tp(tLik, 0.6) });
          g.arrow(838, 680, 892, 680, { color: PAL.ink2, w: 2.4, head: 13, alpha: S.tp(tLik + 1.0, 0.6) });
          const aPo = S.tp(tPost + 0.4, 0.7);
          g.rect(906, 520, 330, 300, { r: 8, stroke: U.rgba(COL, 0.5), w: 1.4, dash: [6, 6], alpha: aPo * (1 - S.tp(tLik + 1.2, 0.5)) });
          g.text('?', 1071, 700, { size: 64, role: 'display', color: COL, align: 'center', alpha: aPo * (1 - S.tp(tLik + 1.2, 0.5)) });
          panel(920, D.post, COL, 'posterior', S.tp(tLik + 1.1, 0.7), S.tp(tLik + 1.3, 1.2));
          g.withAlpha(S.tp(tHow, 0.8), () => g.text('7 of 10 browsed', 520, 596, { size: 21, color: LCOL }));
          caps(g, 'θ = share of young aspen stems browsed', 705, 880, { align: 'center', alpha: S.tp(tPri, 0.8) });
          caps(g, 'illustrative', 1236, 542, { align: 'right', alpha: S.tp(tPri, 0.8) });
        });

        // ---- Beat 3: conditionalization, step by step -------------------------------------
        const a2 = S.p(2, 0.9);
        if (a2 > 0) {
          const tS = cue(S, 2, 'Evidence confirms') - 0.6, dt = 0.62;
          const tC = cue(S, 2, 'confirms a hypothesis'), tDc = cue(S, 2, 'disconfirms'), tDeg = cue(S, 2, 'comes in degrees');
          const nD = D.seq.length; const kf = clamp((t - tS) / dt, 0, nD);
          const k = Math.floor(kf), f = ease.inOut(clamp((kf - k) * 1.6));
          const cur = k >= nD ? D.steps[nD].P : lerpPts(D.steps[k].P, D.steps[k + 1].P, f);
          // The posterior panel grows into the big plot: yesterday's posterior is today's prior.
          const gp = ease.inOut(S.lin(2, 1.2));
          const R = { x: lerp(920, 140, gp), y: lerp(560, 340, gp), w: lerp(300, 640, gp), h: lerp(220, 400, gp) };
          g.withAlpha(a2, () => {
            caps(g, gp < 1 ? 'posterior' : 'prior → posterior → prior …', R.x, R.y - 18, { color: COL, alpha: 1 });
            const A = g.axes({ x: R.x, y: R.y, w: R.w, h: R.h, xmin: 0, xmax: 1, ymin: 0, ymax: 5, arrows: false, xticks: [{ v: 0, l: '0' }, { v: 0.5, l: '0.5' }, { v: 1, l: '1' }] });
            g.text('θ  share of stems browsed', A.x + A.w / 2, A.y + A.h + 64, { size: 22, color: PAL.ink2, align: 'center', alpha: gp });
            const pts = cur.map(([x0, y0]) => [A.X(x0), A.Y(y0)]);
            area(g, pts.filter(([x]) => x >= A.X(0.5)), A.Y(0), U.rgba(COL, 0.22), S.p(2, 0.8, 1.0));
            g.line(A.X(0.5), A.Y(0), A.X(0.5), A.y + 10, { color: PAL.ink3, w: 1.4, dash: [5, 6], alpha: S.p(2, 0.8, 1.0) });
            g.poly(pts, { color: COL, w: 4 });
            g.text('H: most stems are browsed', A.X(0.53), A.y + 22, { size: 22, color: COL, alpha: S.p(2, 0.8, 1.2) });
            // The data stream: stems arrive one by one.
            for (let i = 0; i < nD; i++) {
              const ti = tS + i * dt; const p = S.tp(ti - 0.3, 0.45); if (p <= 0) continue;
              const x = 160 + i * 52, y = 866 - (1 - p) * 40; const br = D.seq[i] === 1;
              g.icon('aspen', x, y - (br ? 6 : 14), br ? 30 : 46, br ? PAL.sand : PAL.moss, { alpha: p });
              if (br) g.line(x - 8, y - 22, x + 8, y - 30, { color: PAL.coral, w: 2.5, alpha: p });
            }
            
            // P(H) trace with confirm / disconfirm marks.
            const B = g.axes({ x: 900, y: 360, w: 380, h: 330, xmin: 0, xmax: nD, ymin: 0, ymax: 1, labSize: 22, arrows: false, progress: S.p(2, 0.8, 0.6), yticks: [{ v: 0, l: '0' }, { v: 0.5, l: '0.5' }, { v: 1, l: '1' }] });
            caps(g, 'credence in H after each stem', 900, 322, { alpha: S.p(2, 0.8, 0.6) });
            caps(g, 'illustrative', 780, 322, { align: 'right', alpha: S.p(2, 0.8, 1.0) });
            const kk = Math.min(nD, Math.floor(kf + 0.2));
            const tr = []; for (let i = 0; i <= kk; i++) { tr.push([B.X(i), B.Y(D.steps[i].pH)]); if (i < kk) tr.push([B.X(i + 1), B.Y(D.steps[i].pH)]); }
            g.poly(tr, { color: PAL.ink2, w: 2.2, alpha: S.p(2, 0.8, 0.6) });
            for (let i = 1; i <= kk; i++) {
              const up = D.steps[i].pH > D.steps[i - 1].pH; const x = B.X(i), y = B.Y(D.steps[i].pH); const c = up ? PAL.moss : PAL.coral;
              g.poly(up ? [[x, y - 12], [x - 7, y - 1], [x + 7, y - 1]] : [[x, y + 12], [x - 7, y + 1], [x + 7, y + 1]], { fill: c, color: null, w: 0, close: true });
            }
            g.dot(B.X(0), B.Y(D.steps[0].pH), 5, PAL.ink, S.p(2, 0.8, 0.6), 2);
            g.withAlpha(S.tp(tC, 0.7), () => { g.poly([[910, 744], [903, 756], [917, 756]], { fill: PAL.moss, color: null, w: 0, close: true }); g.text('confirms: raises P(H)', 928, 756, { size: 22, color: PAL.moss }); });
            g.withAlpha(S.tp(tDc, 0.7), () => { g.poly([[910, 798], [903, 786], [917, 786]], { fill: PAL.coral, color: null, w: 0, close: true }); g.text('disconfirms: lowers it', 928, 798, { size: 22, color: PAL.coral }); });
            g.text('Confirmation comes in degrees.', 1090, 860, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tDeg, 0.9) });
          });
        }
      },
      terms: [
        { beat: 0.35, term: 'Credence', def: 'A degree of belief, represented as a probability between zero and one.' },
        { beat: 0.8, term: 'Dutch book argument', def: 'Credences that violate the probability axioms expose you to a set of bets that loses in every outcome (Ramsey).' },
        { beat: 1.4, term: 'Bayes’ theorem', def: 'P(H | E) = P(E | H) P(H) / P(E): the posterior is proportional to the prior times the likelihood.' },
        { beat: 2.3, term: 'Conditionalization', def: 'Updating by adopting, as the new credence in H, the old conditional probability of H given the evidence.' },
      ],
    },
    {
      id: 'bayes-lr', title: 'The strength of evidence', register: 'infer',
      beats: [
        { t: 'How strongly does evidence favor one hypothesis over another? The likelihood ratio answers: how much more probable the evidence is under one than under the other. It is the factor by which the evidence should multiply your odds.',
          v: 'Two likelihood curves; at the observed value, their heights form a ratio; prior odds × LR = posterior odds.' },
        { t: 'Ignore the prior and you commit the base-rate fallacy. Suppose a camera-trap classifier labels ninety-five percent of wolf photos correctly and mislabels one percent of coyote photos as wolves, in a region where one canid photo in a thousand is a wolf. About nine in ten photos flagged as wolves are coyotes.',
          v: 'Frequency tree, labelled ILLUSTRATIVE: 100,000 photos → 100 wolves (95 flagged) and 99,900 coyotes (999 flagged); 95 of 1,094 flags are wolves.' },
        { t: 'Richard Royall separated three questions: what does the evidence say; what should I believe; and what should I do? They map onto our bands. The likelihood ratio answers the first, the posterior the second, and a decision, with its costs, the third.',
          cite: 'Royall 1997',
          v: 'Royall’s three questions slide onto the three bands: EVIDENCE → OBSERVE/INFER, BELIEF → INFER/CLAIM, ACTION → CLAIM.' },
      ],
      init() {
        // Track width under two hypotheses (ILLUSTRATIVE). Observed value chosen where LR = 6.
        const W = { m: 10.5, s: 1.6 }, C = { m: 7.5, s: 1.3 };
        let lo = 8, hi = 12; for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (npdf(mid, W.m, W.s) / npdf(mid, C.m, C.s) < 6) lo = mid; else hi = mid; }
        // 1,094 flags: 95 wolves scattered among 999 coyotes.
        const r = U.rng(1094); const idx = Array.from({ length: 1094 }, (_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
        const wolfSet = new Set(idx.slice(0, 95));
        return { W, C, xo: lo, wolfSet };
      },
      draw(g, t, S, D) {
        const WC = PAL.coral, CC = PAL.ochre;
        // ---- Beat 1: the likelihood ratio and the odds -----------------------------------
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tLR = cue(S, 0, 'The likelihood ratio'), tMore = cue(S, 0, 'how much more'), tOdds = cue(S, 0, 'It is the factor');
          caps(g, 'Two hypotheses, one observation', 150, 262, { alpha: S.p(0, 0.8) });
          caps(g, 'illustrative', 790, 262, { align: 'right', alpha: S.p(0, 0.8) });
          const A = g.axes({ x: 150, y: 320, w: 640, h: 440, xmin: 3, xmax: 15, ymin: 0, ymax: 0.36, xlab: 'Track width', labSize: 22, progress: S.p(0, 1.0) });
          const fw = (x) => npdf(x, D.W.m, D.W.s), fc = (x) => npdf(x, D.C.m, D.C.s);
          g.plot(A, fc, { color: CC, w: 3.5, progress: S.p(0, 1.4, 0.8), fillTo: 0, fillColor: U.rgba(CC, 0.1) });
          g.plot(A, fw, { color: WC, w: 3.5, progress: S.p(0, 1.4, 1.4), fillTo: 0, fillColor: U.rgba(WC, 0.1) });
          g.withAlpha(S.p(0, 0.7, 1.8), () => {
            const cx = A.X(4.7), cy = A.Y(0.24); g.icon('coyote', cx, cy, 56, CC); g.math('H_{2}', cx - 52, cy - 52, { size: 30, color: CC }); g.text('coyote', cx - 4, cy - 52, { size: 22, color: CC });
            const wx = A.X(13.4), wy = A.Y(0.2); g.icon('wolf', wx, wy, 60, WC); g.math('H_{1}', wx - 46, wy - 56, { size: 30, color: WC }); g.text('wolf', wx + 2, wy - 56, { size: 22, color: WC });
          });
          // The observed track and the two heights.
          const xo = D.xo, X = A.X(xo), aO = S.tp(tMore, 0.7);
          g.line(X, A.Y(0), X, A.y - 6, { color: PAL.ink, w: 1.6, dash: [6, 6], alpha: aO, progress: aO });
          g.icon('track', X, A.Y(0) + 64, 34, PAL.ink, { alpha: aO });
          caps(g, 'observed', X + 26, A.Y(0) + 70, { color: PAL.ink, alpha: aO });
          const hp = S.tp(tMore + 0.8, 1.0);
          g.line(X - 7, A.Y(0), X - 7, lerp(A.Y(0), A.Y(fw(xo)), hp), { color: WC, w: 6 });
          g.line(X + 7, A.Y(0), X + 7, lerp(A.Y(0), A.Y(fc(xo)), hp), { color: CC, w: 6 });
          if (hp > 0.9) { g.dot(X - 7, A.Y(fw(xo)), 6, WC, 1, 2.4); g.dot(X + 7, A.Y(fc(xo)), 6, CC, 1, 2.4); }
          // Right column: the ratio, then the odds.
          const RX = 870;
          g.withAlpha(S.tp(tLR, 0.8), () => {
            caps(g, 'likelihood ratio', RX, 330);
            g.math('\\frac{P(E\\,|\\,H_{1})}{P(E\\,|\\,H_{2})}', RX, 420, { size: 44, color: PAL.ink });
            g.text('= 6', RX + 200, 432, { size: 56, role: 'display', color: COL, alpha: S.tp(tMore + 1.8, 0.7) });
            g.text('the evidence is 6× more probable if it is a wolf', RX, 498, { size: 21, color: PAL.ink2, alpha: S.tp(tMore + 2.2, 0.7) });
          });
          const aOd = S.tp(tOdds, 0.7);
          if (aOd > 0) g.withAlpha(aOd, () => {
            caps(g, 'odds, wolf : coyote', RX, 560);
            const bar = (y, wv, cv, lab, a) => g.withAlpha(a, () => {
              const tot = wv + cv, BW = 300; g.rect(RX, y, BW * wv / tot, 34, { r: 4, fill: WC }); g.rect(RX + BW * wv / tot + 3, y, BW * cv / tot - 3, 34, { r: 4, fill: CC });
              g.text(lab, RX + BW + 18, y + 27, { size: 28, role: 'mono', color: PAL.ink });
            });
            const gr = S.tp(tOdds + 1.0, 1.0);
            bar(586, 1, 3, '1 : 3', 1); caps(g, 'prior', RX, 640, { color: PAL.ink2 });
            g.text('× 6', RX, 694, { size: 30, role: 'display', color: COL, alpha: S.tp(tOdds + 0.6, 0.6) });
            bar(716, lerp(1, 6, gr), 3, gr > 0.95 ? '2 : 1' : '', S.tp(tOdds + 0.8, 0.6)); caps(g, 'posterior', RX, 770, { color: PAL.ink2, alpha: S.tp(tOdds + 0.8, 0.6) });
          });
        });

        // ---- Beat 2: the base-rate fallacy, as a frequency tree --------------------------
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tSup = cue(S, 1, 'Suppose a camera-trap'), t95 = cue(S, 1, 'labels ninety-five'), t1 = cue(S, 1, 'mislabels one percent'), tBase = cue(S, 1, 'in a region where'), tNine = cue(S, 1, 'About nine in ten');
          caps(g, 'A camera-trap classifier', 110, 262, { alpha: S.p(1, 0.8) });
          caps(g, 'illustrative', 840, 262, { align: 'right', alpha: S.p(1, 0.8) });
          const sk = 0.25 * S.p(1, 0.8, 0.3);
          const node = (x, y, w, num, lab, col, a, aNum) => {
            g.rect(x, y - 44, w, 88, { r: 10, fill: U.rgba(col, 0.1), stroke: U.rgba(col, 0.7), w: 1.6, alpha: Math.max(sk, a) });
            g.withAlpha(a, () => { g.text(num, x + w / 2, y + 8, { size: 36, role: 'display', color: col, align: 'center', alpha: aNum }); caps(g, lab, x + w / 2, y + 32, { align: 'center', color: PAL.ink2 }); });
          };
          const edge = (x1, y1, x2, y2, lab, col, a, lx, ly, al = 'center') => {
            g.line(x1, y1, x2, y2, { color: col, w: 2.2, alpha: sk * 0.8 });
            g.line(x1, y1, x2, y2, { color: col, w: 2.2, alpha: a * 0.8, progress: a });
            g.text(lab, lx, ly, { size: 22, color: col, align: al, alpha: a });
          };
          const aW = S.tp(t95 - 0.3, 0.7), aC = S.tp(t1 - 0.3, 0.7), aB = S.tp(tBase, 0.7), aN = S.tp(tBase + 1.0, 0.7), aF = S.tp(tBase + 2.0, 0.7);
          node(110, 580, 190, '100,000', 'photos', PAL.ink, aB, 1);
          node(400, 380, 200, '100', 'wolf photos', WC, aW, aN);
          node(400, 780, 200, '99,900', 'coyote photos', CC, aC, aN);
          node(680, 380, 160, '95', 'flagged wolf', WC, aW, aF);
          node(680, 780, 160, '999', 'flagged wolf', CC, aC, aF);
          edge(300, 560, 400, 400, '1 in 1,000', WC, aB, 336, 474, 'right');
          edge(300, 600, 400, 760, '999 in 1,000', CC, aB, 336, 702, 'right');
          edge(600, 380, 680, 380, '95%', WC, S.tp(t95 + 0.3, 0.7), 640, 364);
          edge(600, 780, 680, 780, '1%', CC, S.tp(t1 + 0.3, 0.7), 640, 764);
          g.withAlpha(S.tp(t95 + 0.6, 0.7), () => caps(g, 'labelled correctly', 640, 450, { align: 'center', color: PAL.ink3 }));
          g.withAlpha(S.tp(t1 + 0.6, 0.7), () => caps(g, 'mislabelled', 640, 850, { align: 'center', color: PAL.ink3 }));
          // The naive reading, and the flag bin.
          const BX = 910;
          const naive = S.p(1, 0.8, 0.4), strike = S.tp(tNine + 1.6, 0.6);
          g.withAlpha(naive, () => {
            g.text('“A flag means a wolf”?', BX, 320, { size: 30, role: 'display', italic: true, color: PAL.ink2 });
            g.line(BX - 4, 310, BX + g.measure('“A flag means a wolf”?', { size: 30, role: 'display', italic: true }) + 4, 310, { color: PAL.coral, w: 3, progress: strike });
          });
          const aBin = S.tp(tNine - 0.4, 0.7);
          if (aBin > 0) {
            caps(g, 'all 1,094 wolf flags', BX, 372, { alpha: aBin });
            const fill = clamp((t - tNine + 0.2) / 1.6) * 1094; const cols = 38, sp = 10.2;
            const c = g.ctx; c.save(); c.globalAlpha *= aBin;
            for (const [want, col] of [[false, CC], [true, WC]]) {
              c.fillStyle = col; c.beginPath();
              for (let i = 0; i < Math.min(1094, fill); i++) { if (D.wolfSet.has(i) !== want) continue; const x = BX + 6 + (i % cols) * sp, y = 396 + Math.floor(i / cols) * sp; c.rect(x - 3.6, y - 3.6, want ? 8 : 7.2, want ? 8 : 7.2); }
              c.fill();
            }
            c.restore();
            g.withAlpha(S.tp(tNine + 1.4, 0.8), () => {
              g.text('95 of 1,094 are wolves', BX, 740, { size: 30, color: WC });
              g.text('About 9 in 10 flags are coyotes.', BX, 790, { size: 28, role: 'display', italic: true, color: PAL.ink });
            });
          }
        });

        // ---- Beat 3: Royall's three questions on the three bands --------------------------
        const a2 = S.p(2, 0.9);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tQ = [cue(S, 2, 'what does the evidence'), cue(S, 2, 'what should I believe'), cue(S, 2, 'what should I do')];
          const tMap = cue(S, 2, 'They map onto'), tA = [cue(S, 2, 'The likelihood ratio answers'), cue(S, 2, 'the posterior the second'), cue(S, 2, 'and a decision')];
          caps(g, 'Royall’s three questions', 110, 262, { alpha: S.p(2, 0.8) });
          const Q = [['What does the evidence say?', 'evidence'], ['What should I believe?', 'belief'], ['What should I do?', 'action']];
          const B = g.bands(720, 300, 570, 560, { active: t > tMap ? 'all' : [], alpha: 0.4 + 0.6 * S.tp(tMap - 0.4, 0.8), progress: S.p(2, 1.2, 0.3), labSize: 18 });
          const by = (r, f) => r.y + r.h * f; const ob = B.observe, ib = B.infer, cb = B.claim;
          const tgt = [(by(ib, 1) + ob.y) / 2, (by(cb, 1) + ib.y) / 2, by(cb, 0.5)];
          const ans = [['likelihood ratio', PAL.ink], ['posterior', COL], ['decision + its costs', PAL.rose]];
          Q.forEach(([q, k], i) => {
            const a = S.tp(tQ[i] - 0.1, 0.7); if (a <= 0) return; const y = 330 + i * 150;
            g.withAlpha(a, () => {
              g.rect(110, y, 500, 118, { r: 10, fill: U.rgba(PAL.ink2, 0.06), stroke: U.rgba(PAL.ink2, 0.4), w: 1.4 });
              g.text(String(i + 1), 140, y + 74, { size: 44, role: 'display', color: COL });
              g.text(q, 186, y + 66, { size: 30, role: 'display', color: PAL.ink });
            });
            // A chip slides from the question onto its band.
            const m = ease.inOut(clamp((t - tMap - 0.3 - i * 0.35) / 1.1));
            const cx = lerp(470, 850, m), cy = lerp(y + 96, tgt[i], m);
            g.withAlpha(a, () => {
              g.rect(cx, cy - 20, 150, 40, { r: 20, fill: PAL.bg, stroke: PAL.ink, w: 1.6 });
              g.text(k.toUpperCase(), cx + 75, cy + 7, { size: 17, weight: 600, ls: 2.4, color: PAL.ink, align: 'center' });
              if (m > 0.05 && m < 1) g.line(610, y + 59, cx, cy, { color: PAL.ink3, w: 1.2, dash: [4, 6], alpha: 1 - m });
            });
            const aa = S.tp(tA[i], 0.7);
            if (aa > 0) { g.line(1000, tgt[i], 1024, tgt[i], { color: ans[i][1], w: 2, alpha: aa }); g.pill(ans[i][0], 1030, tgt[i], { size: 21, color: ans[i][1], alpha: aa, fill: U.rgba(PAL.bg, 0.85), stroke: ans[i][1] }); }
          });
        });
      },
      terms: [
        { beat: 0.4, term: 'Likelihood ratio', def: 'P(E | H1) / P(E | H2): how much more probable the evidence is under one hypothesis than another; the measure of evidential strength.' },
        { beat: 1.25, term: 'Base-rate fallacy', def: 'Judging a hypothesis by the accuracy of a test while ignoring how rare the condition is to begin with.' },
      ],
    },
    {
      id: 'bayes-case', title: 'Case file: updating on the cascade', register: 'claim',
      beats: [
        { t: 'Read the Yellowstone debate as a sequence of updates. The prior came from Isle Royale, where tree rings tracked the rise and fall of wolves and moose, and from Leopold’s story. Early aspen studies raised belief in a strong cascade, driven by fear.',
          cite: 'McLaren & Peterson 1994; Ripple et al. 2001',
          v: 'Case-file card (aspen). A belief curve over “cascade strength” starts broad, shifted right; a tree-ring disk appears as the prior’s source.' },
        { t: 'Then a landscape test found no fear effect, random sampling found a weaker signal, density outweighed risk, and willow lagged. Belief in some cascade on aspen survived; belief that fear drives it fell; uncertainty about its strength remains wide.',
          cite: 'Kauffman et al. 2010; Painter et al. 2015; Brice et al. 2022, 2024; Hobbs et al. 2024',
          v: 'Each study arrives as a likelihood curve that reshapes the belief curve; a second panel tracks credence in “fear-driven” falling.' },
        { t: 'Bayesian reading also guards against a common error. Across sixteen pairs of large carnivores and mesocarnivores, the average abundance correlation was −0.18, with a 95 percent confidence interval from −0.41 to 0.05: not significant, at p = 0.11.',
          s: 'Bayesian reading also guards against a common error. Across sixteen pairs of large carnivores and mesocarnivores, the average abundance correlation was minus zero point one eight, with a ninety-five percent confidence interval from minus zero point four one to plus zero point zero five: not significant, at a p value of zero point one one.',
          cite: 'Wilmers et al. 2025',
          v: 'A forest plot of 16 pairs with the grand-mean diamond at −0.18 and its interval just crossing zero.' },
        { t: 'Not significant is not the same as no effect. Read with a flat prior, that interval puts the probability that the average effect is negative near ninety-four percent. The evidence leans toward suppression, but the data are mostly correlative.',
          v: 'The interval becomes a posterior curve; the area below zero shades to 94% (label: ILLUSTRATIVE, NORMAL APPROXIMATION).' },
      ],
      init() {
        // Belief over cascade strength (STYLIZED): normal prior, each study a normal likelihood.
        const studies = [
          { lab: 'Isle Royale and Leopold', k: 0, phrase: 'The prior came from', col: PAL.heather },
          { lab: 'Early aspen studies', k: 0, phrase: 'Early aspen studies', col: PAL.moss, L: [0.85, 0.3] },
          { lab: 'Landscape test: no fear effect', k: 1, phrase: 'a landscape test', col: PAL.ochre, L: [0.35, 0.45] },
          { lab: 'Random sampling: weaker signal', k: 1, phrase: 'random sampling', col: PAL.clay, L: [0.25, 0.3] },
          { lab: 'Density outweighed risk', k: 1, phrase: 'density outweighed', col: PAL.rose, L: [0.4, 0.4] },
          { lab: 'Willow lagged', k: 1, phrase: 'willow lagged', col: PAL.mint, L: [0.3, 0.4] },
        ];
        let m = 0.62, sd = 0.2; studies[0].m = m; studies[0].s = sd;
        for (let i = 1; i < studies.length; i++) { const [lm, ls] = studies[i].L; const p0 = 1 / (sd * sd), p1 = 1 / (ls * ls); m = (m * p0 + lm * p1) / (p0 + p1); sd = Math.sqrt(1 / (p0 + p1)); studies[i].m = m; studies[i].s = sd; }
        const fear = [0.5, 0.8, 0.35, 0.3, 0.12, 0.12];
        // Sixteen pairs (STYLIZED values), shifted so their mean is the reported −0.18.
        const r = U.rng(2025); const pairs = [];
        for (let i = 0; i < 16; i++) pairs.push({ v: -0.18 + 0.32 * U.gauss(r), h: 0.16 + 0.32 * r() });
        const mean = pairs.reduce((s, p) => s + p.v, 0) / 16; pairs.forEach((p) => { p.v = Math.max(-0.85, Math.min(0.7, p.v - mean - 0.18)); });
        // Tree-ring disk (pre-rendered).
        const disk = Theater.makeCanvas(200, 200); const c = disk.getContext('2d'); let rad = 6;
        c.translate(100, 100); c.lineCap = 'round';
        while (rad < 88) { const w = 2 + 5 * (0.5 + 0.5 * Math.sin(rad * 0.21)) * (0.6 + 0.8 * r()); rad += w; c.beginPath(); for (let a = 0; a <= 64; a++) { const th = a / 64 * Math.PI * 2; const rr = rad * (1 + 0.04 * Math.sin(th * 3 + rad * 0.1)); a ? c.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * 0.96) : c.moveTo(Math.cos(th) * rr, Math.sin(th) * rr * 0.96); } c.strokeStyle = 'rgba(216,196,155,0.75)'; c.lineWidth = 1.4; c.stroke(); }
        c.beginPath(); c.ellipse(0, 0, rad + 4, (rad + 4) * 0.96, 0, 0, Math.PI * 2); c.strokeStyle = '#B98A5E'; c.lineWidth = 6; c.stroke();
        return { studies, fear, pairs, disk };
      },
      draw(g, t, S, D) {
        const sh = S.p(2, 1.0); const cw = lerp(270, 200, sh), chh = lerp(156, 116, sh);
        g.casefile(96, 226, cw, chh, { title: 'Updating on the cascade', no: 'X', sketch: 'aspen', color: COL, rot: -0.02, alpha: S.p(0, 0.9), titleSize: lerp(22, 17, sh) });
        const ST = D.studies; const tS = ST.map((s) => cue(S, s.k, s.phrase));

        // ---- Beats 1–2: a sequence of updates ---------------------------------------------
        const a01 = vis(S, 0, 2);
        if (a01 > 0) g.withAlpha(a01, () => {
          // Update log.
          caps(g, 'a sequence of updates', 104, 430, { alpha: S.p(0, 0.8, 0.3) });
          ST.forEach((s, i) => {
            const y = 476 + i * 62, a = S.p(0, 0.6, 0.6 + i * 0.12), on = S.tp(tS[i], 0.6);
            g.circle(122, y - 8, 15, { stroke: on ? s.col : PAL.ink3, w: 1.8, fill: U.rgba(s.col, 0.2 * on), alpha: a });
            g.text(String(i), 122, y, { size: 21, role: 'mono', color: on > 0.5 ? s.col : PAL.ink3, align: 'center', alpha: a });
            g.text(i === 0 ? 'Prior: ' + s.lab : s.lab, 150, y, { size: 22, color: PAL.ink, alpha: on });
          });
          // Belief over cascade strength.
          const A = g.axes({ x: 600, y: 330, w: 660, h: 440, xmin: 0, xmax: 1, ymin: 0, ymax: 3.6, labSize: 22, arrows: false, progress: S.p(0, 1.0, 0.3), xticks: [{ v: 0, l: 'none' }, { v: 1, l: 'strong' }] });
          g.text('Cascade strength', 930, 836, { size: 22, color: PAL.ink2, align: 'center', alpha: S.p(0, 0.8, 0.6) });
          caps(g, 'belief', 600, 300, { alpha: S.p(0, 0.8, 0.5) }); caps(g, 'stylized', 1260, 300, { align: 'right', alpha: S.p(0, 0.8, 0.5) });
          let k = -1; for (let i = 0; i < ST.length; i++) if (t >= tS[i]) k = i;
          if (k >= 0) {
            let m = ST[k].m, sd = ST[k].s;
            if (k > 0) { const f = ease.inOut(clamp((t - tS[k] - 0.5) / 0.9)); m = lerp(ST[k - 1].m, ST[k].m, f); sd = lerp(ST[k - 1].s, ST[k].s, f); }
            // The incoming study's likelihood, dashed.
            if (k > 0) { const L = ST[k].L, la = S.tp(tS[k], 0.4) * (1 - S.tp(tS[k] + 1.7, 0.5)); const sc = 0.55 * 3.6 * L[1] * Math.sqrt(2 * Math.PI); g.plot(A, (x) => sc * npdf(x, L[0], L[1]), { color: ST[k].col, w: 2.6, dash: [9, 7], alpha: la }); }
            const pts = []; for (let i = 0; i <= 160; i++) { const x = i / 160; pts.push([A.X(x), A.Y(npdf(x, m, sd))]); }
            area(g, pts, A.Y(0), U.rgba(COL, 0.16));
            g.poly(pts, { color: COL, w: 4, progress: k === 0 ? S.tp(tS[0], 1.4) : 1 });
            // Beat 2 coda: what survived, what fell, what stays wide.
            const tSurv = cue(S, 1, 'Belief in some cascade'), tWide = cue(S, 1, 'uncertainty about');
            const aS = S.tp(tSurv, 0.8);
            if (aS > 0) { g.line(A.X(0.08), A.Y(0) - 12, A.X(0.08), A.y + 40, { color: PAL.ink3, w: 1.4, dash: [5, 6], alpha: aS }); g.text('some cascade survives →', A.X(0.1), A.y + 36, { size: 22, color: COL, alpha: aS }); }
            const aW = S.tp(tWide, 0.8);
            if (aW > 0) { const y = A.Y(npdf(m + 1.4 * sd, m, sd)); g.arrow(A.X(m - 1.96 * sd), y, A.X(m + 1.96 * sd), y, { color: PAL.ink, w: 2, head: 11, both: true, alpha: aW, progress: aW }); g.text('still wide', A.X(m + 1.96 * sd) + 12, y + 8, { size: 22, color: PAL.ink, alpha: aW }); }
          }
          // Right panel: where the prior came from (beat 1), then credence that fear drives it.
          const RX = 1380;
          const aSrc = S.tp(tS[0], 0.8) * (1 - S.p(1, 0.7));
          if (aSrc > 0) g.withAlpha(aSrc, () => {
            caps(g, 'where the prior came from', RX, 300);
            const tTR = cue(S, 0, 'tree rings'), tRF = cue(S, 0, 'rise and fall'), tL = cue(S, 0, 'Leopold');
            g.withAlpha(S.tp(tTR - 0.2, 0.8), () => { g.ctx.drawImage(D.disk, RX, 330, 150, 150); caps(g, 'tree rings', RX + 75, 510, { align: 'center' }); });
            g.withAlpha(S.tp(tRF - 0.2, 0.8), () => {
              const wolfP = [], mooseP = []; for (let i = 0; i <= 60; i++) { const u = i / 60, x = RX + 180 + u * 230; mooseP.push([x, 440 - 50 * (0.5 + 0.5 * Math.sin(u * 9))]); wolfP.push([x, 440 - 50 * (0.5 + 0.5 * Math.sin(u * 9 - 1.3))]); }
              g.poly(mooseP, { color: PAL.sand, w: 2.6, progress: S.tp(tRF, 1.6) }); g.poly(wolfP, { color: PAL.coral, w: 2.6, progress: S.tp(tRF + 0.3, 1.6) });
              g.icon('moose', RX + 210, 352, 40, PAL.sand); g.icon('wolf', RX + 290, 352, 36, PAL.coral);
              caps(g, 'Isle Royale', RX + 295, 510, { align: 'center' });
            });
            g.withAlpha(S.tp(tL - 0.2, 0.8), () => {
              g.rect(RX, 560, 420, 64, { r: 8, fill: U.rgba(PAL.parchment, 0.08), stroke: U.rgba(PAL.parchment, 0.4), w: 1.2 });
              g.poly([[RX + 24, 578], [RX + 48, 584], [RX + 72, 578], [RX + 72, 606], [RX + 48, 612], [RX + 24, 606]], { color: PAL.parchment, w: 2, close: true }); g.line(RX + 48, 584, RX + 48, 612, { color: PAL.parchment, w: 2 });
              g.text('Leopold’s story', RX + 96, 601, { size: 26, role: 'display', color: PAL.parchment });
            });
          });
          // Credence that fear drives the cascade.
          const tF = cue(S, 0, 'driven by fear'); const aF = S.tp(tF - 0.3, 0.8);
          if (aF > 0) g.withAlpha(aF, () => {
            const mv = ease.inOut(S.lin(1, 1.0, 0.2)); const py = lerp(690, 340, mv), ph = lerp(150, 380, mv);
            caps(g, 'credence: fear drives it', RX, py - 26, { color: PAL.coral });
            caps(g, 'stylized', RX + 410, py - 26, { align: 'right' });
            const F = g.axes({ x: RX + 30, y: py, w: 380, h: ph, xmin: 0, xmax: 5, ymin: 0, ymax: 1, arrows: false, yticks: [{ v: 0, l: '0' }, { v: 1, l: '1' }], xticks: [0, 1, 2, 3, 4, 5].map((v) => ({ v, l: String(v) })) });
            caps(g, 'update', RX + 410, py + ph + 62, { align: 'right', alpha: mv });
            let kk = 0; for (let i = 1; i < ST.length; i++) if (t >= tS[i] + 0.5) kk = i;
            const pts = []; for (let i = 0; i <= kk; i++) pts.push([F.X(i), F.Y(D.fear[i])]);
            g.poly(pts, { color: PAL.coral, w: 3 });
            pts.forEach(([x, y], i) => g.dot(x, y, 6, i ? ST[i].col : PAL.heather, 1, 2.2));
            const [lx, ly] = pts[pts.length - 1];
            g.text(D.fear[kk].toFixed(2), lx + 14, ly - 12, { size: 22, role: 'mono', color: PAL.ink });
            const tFell = cue(S, 1, 'belief that fear'); g.text('fell', F.X(4.6), F.Y(0.45), { size: 30, role: 'display', italic: true, color: PAL.coral, align: 'center', alpha: S.tp(tFell, 0.7) });
          });
        });

        // ---- Beats 3–4: the forest plot, then a posterior reading --------------------------
        const a23 = S.p(2, 0.9);
        if (a23 > 0) g.withAlpha(a23, () => {
          const X = (v) => 1200 + v * 500; const rowY = (i) => 300 + i * 27; const DY = 760, BASE = 800;
          const tPairs = cue(S, 2, 'Across sixteen'), tM = cue(S, 2, 'minus zero point one eight'), tCI = cue(S, 2, 'ninety-five percent confidence'), tLo = cue(S, 2, 'minus zero point four one'), tHi = cue(S, 2, 'plus zero point zero five'), tNS = cue(S, 2, 'not significant');
          const tFlat = cue(S, 3, 'Read with a flat prior'), t94 = cue(S, 3, 'near ninety-four'), tLean = cue(S, 3, 'leans toward'), tCorr = cue(S, 3, 'mostly correlative');
          const b3 = S.p(3, 0.8);
          // Axis.
          g.line(X(-1), BASE, X(1), BASE, { color: PAL.ink2, w: 2, progress: S.p(2, 1.0) });
          for (const v of [-1, -0.5, 0, 0.5, 1]) { g.line(X(v), BASE, X(v), BASE + 8, { color: PAL.ink2, w: 1.6, alpha: S.p(2, 0.8, 0.4) }); g.text(v === 0 ? '0' : (v < 0 ? '−' : '') + Math.abs(v), X(v), BASE + 34, { size: 21, color: PAL.ink3, align: 'center', alpha: S.p(2, 0.8, 0.4) }); }
          g.text('Abundance correlation, large carnivore vs mesocarnivore', X(1), BASE + 72, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(2, 0.8, 0.5) });
          g.line(X(0), 284, X(0), BASE, { color: PAL.ink3, w: 1.5, dash: [6, 6], alpha: S.p(2, 0.8, 0.4) });
          caps(g, '16 pairs', X(-1), 270, { alpha: S.p(2, 0.8, 0.5) * (1 - b3) });
          caps(g, 'individual pairs stylized', X(1), 270, { align: 'right', alpha: S.p(2, 0.8, 0.5) * (1 - b3) });
          // Rows.
          const fadeRows = S.tp(tFlat, 0.8);
          g.withAlpha(1 - 0.92 * fadeRows, () => D.pairs.forEach((p, i) => {
            const a = S.tp(tPairs + 0.1 + i * 0.14, 0.5); if (a <= 0) return; const y = rowY(i);
            g.line(X(p.v - p.h), y, X(p.v + p.h), y, { color: PAL.ink2, w: 2, alpha: a });
            const sz = 6 + 8 * (0.16 / p.h); g.rect(X(p.v) - sz / 2, y - sz / 2, sz, sz, { fill: PAL.sand, alpha: a });
          }));
          // The grand mean and its interval.
          const aD = S.tp(tM - 0.2, 0.7), ci = S.tp(tCI + 0.3, 1.0), dia = 1 - S.tp(tFlat + 1.0, 0.8);
          if (aD > 0) g.withAlpha(dia, () => {
            const lo = lerp(-0.18, -0.41, ci), hi = lerp(-0.18, 0.05, ci);
            g.line(X(-1), DY - 26, X(1), DY - 26, { color: PAL.rule, w: 1, alpha: aD });
            g.poly([[X(lo), DY], [X(-0.18), DY - 15], [X(hi), DY], [X(-0.18), DY + 15]], { fill: COL, color: COL, w: 1.5, close: true, alpha: aD });
            g.text('−0.41', X(-0.41) - 10, DY + 8, { size: 21, role: 'mono', color: PAL.ink, align: 'right', alpha: S.tp(tLo, 0.6) });
            g.text('0.05', X(0.05) + 10, DY + 8, { size: 21, role: 'mono', color: PAL.ink, alpha: S.tp(tHi, 0.6) });
            const zc = S.tp(tHi + 0.4, 0.6); if (zc > 0) g.glow(X(0), DY, 34, PAL.coral, 0.6 * zc * (0.7 + 0.3 * Math.sin(t * 5)));
          });
          // The common error, stated before it is answered.
          g.withAlpha(S.p(2, 0.8, 0.3) * (1 - S.tp(tPairs + 0.6, 0.6)), () => { caps(g, 'a common error', 104, 440); g.text('“Not significant,', 104, 500, { size: 40, role: 'display', italic: true, color: PAL.ink2 }); g.text('so no effect.”', 104, 548, { size: 40, role: 'display', italic: true, color: PAL.ink2 }); });
          // Left column readouts (beat 3).
          g.withAlpha(1 - b3, () => {
            caps(g, 'average correlation, 16 pairs', 104, 440, { alpha: aD });
            g.text('−0.18', 100, 530, { size: 88, role: 'display', color: COL, alpha: aD });
            caps(g, '95% confidence interval', 104, 600, { alpha: S.tp(tCI, 0.6) });
            g.text('−0.41 to 0.05', 104, 656, { size: 44, role: 'display', color: PAL.ink, alpha: S.tp(tLo, 0.6) });
            g.text('p = 0.11', 104, 748, { size: 44, role: 'display', color: PAL.ink, alpha: S.tp(tNS, 0.6) });
            caps(g, 'not significant: the interval crosses 0', 104, 786, { color: PAL.coral, alpha: S.tp(tNS + 0.3, 0.6) });
          });
          // Beat 4: the interval read as a posterior.
          if (b3 > 0) {
            const m = -0.18, sd = 0.46 / 3.92, k = 420 / npdf(m, m, sd); const grow = S.tp(tFlat, 1.4);
            const pts = []; for (let i = 0; i <= 200; i++) { const v = -1 + 2 * i / 200; pts.push([X(v), DY - k * npdf(v, m, sd) * grow]); }
            const sw = lerp(-1, 0, ease.inOut(clamp((t - tFlat - 1.2) / Math.max(1.5, t94 + 0.6 - tFlat - 1.2))));
            const shaded = pts.filter(([x]) => x <= X(sw));
            if (shaded.length > 1) area(g, [...shaded, [X(sw), DY - k * npdf(sw, m, sd) * grow]], DY, U.rgba(COL, 0.35));
            g.poly(pts, { color: COL, w: 4, alpha: grow > 0 ? 1 : 0 });
            g.line(X(-1), DY, X(1), DY, { color: PAL.ink3, w: 1.2, alpha: grow });
            const P = ncdf((sw - m) / sd);
            g.withAlpha(b3, () => {
              g.text('Not significant', 104, 440, { size: 36, role: 'display', italic: true, color: PAL.ink }); g.text('is not the same as no effect.', 104, 482, { size: 36, role: 'display', italic: true, color: PAL.ink });
              caps(g, 'probability the average effect is negative', 104, 566, { alpha: S.tp(tFlat, 0.6) });
              g.text(`≈ ${Math.round(P * 100)}%`, 100, 650, { size: 80, role: 'display', color: COL, alpha: S.tp(tFlat + 1.1, 0.5) });
              caps(g, 'illustrative · flat prior,', 104, 696, { alpha: S.tp(tFlat, 0.6) }); caps(g, 'normal approximation', 104, 720, { alpha: S.tp(tFlat, 0.6) });
              g.text('Leans toward suppression,', 104, 800, { size: 26, color: PAL.coral, alpha: S.tp(tLean, 0.7) });
              g.text('but the data are mostly correlative.', 104, 836, { size: 23, color: PAL.ink2, alpha: S.tp(tCorr - 0.4, 0.7) });
            });
            g.withAlpha(S.tp(tLean, 0.8), () => { g.arrow(X(0) - 16, 300, X(-0.62), 300, { color: PAL.coral, w: 2.6, head: 14, progress: S.tp(tLean, 1.0) }); g.text('suppression', X(-0.32), 286, { size: 22, color: PAL.coral, align: 'center' }); });
          }
        });
      },
    },
    {
      id: 'bayes-priors', title: 'Priors and their critics', register: 'claim',
      beats: [
        { t: 'Where do priors come from? Critics call them subjective. Bayesians reply that with enough shared evidence, different priors converge, because the data wash them out, and that writing priors down exposes assumptions other methods leave hidden.',
          v: 'Three very different prior curves; the same data stream drives all three posteriors together.' },
        { t: 'Deborah Mayo offers the main rival. On her error-statistical view, evidence supports a claim when the claim has passed a severe test, one it would probably have failed if it were false. The question is not how much to believe, but how well the claim has been probed.',
          cite: 'Mayo 2018',
          v: 'A probe passing through a sieve of possible errors; a claim marked “severely tested”.' },
      ],
      init() {
        // Three priors over θ (share of stems browsed); one shared data stream (true θ = 0.35).
        const priors = [
          { name: 'Low prior', a: 2, b: 9, col: PAL.heather },
          { name: 'High prior', a: 9, b: 2, col: PAL.ochre },
          { name: 'Flat prior', a: 1, b: 1, col: PAL.mint },
        ];
        const r = U.rng(3535); const data = []; for (let i = 0; i < 120; i++) data.push(r() < 0.35 ? 1 : 0);
        const cum = [0]; data.forEach((d) => cum.push(cum[cum.length - 1] + d));
        // Sieve meshes (hole patterns) for the severe-testing beat.
        const errs = ['sampling bias', 'confounding', 'detection error', 'chance'];
        return { priors, data, cum, errs };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: priors wash out ------------------------------------------------------
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tSub = cue(S, 0, 'Critics call'), tData = cue(S, 0, 'with enough shared'), tWash = cue(S, 0, 'wash them out'), tWrite = cue(S, 0, 'writing priors down');
          const n = Math.round(120 * ease.inOut(clamp((t - tData - 0.3) / Math.max(2, tWash + 1.2 - tData))));
          const k = D.cum[n];
          const curves = D.priors.map((p) => betaPts(p.a + k, p.b + n - k, 200));
          const ymax = Math.max(4, ...curves.map(peak)) * 1.12;
          caps(g, 'three priors, one stream of data', 150, 262, { alpha: S.p(0, 0.8) });
          caps(g, 'illustrative', 850, 262, { align: 'right', alpha: S.p(0, 0.8) });
          const A = g.axes({ x: 150, y: 310, w: 700, h: 430, xmin: 0, xmax: 1, ymin: 0, ymax, arrows: false, progress: S.p(0, 1.0), xticks: [{ v: 0, l: '0' }, { v: 0.5, l: '0.5' }, { v: 1, l: '1' }] });
          g.text('θ  share of stems browsed', 500, 812, { size: 22, color: PAL.ink2, align: 'center', alpha: S.p(0, 0.8, 0.4) });
          curves.forEach((P, i) => {
            const a = S.p(0, 0.8, 0.4 + i * 0.35); const pts = P.map(([x, y]) => [A.X(x), A.Y(y)]);
            if (n > 100) area(g, pts, A.Y(0), U.rgba(D.priors[i].col, 0.06));
            g.poly(pts, { color: D.priors[i].col, w: 3.4, alpha: a, progress: S.p(0, 1.2, 0.4 + i * 0.35) });
          });
          // The data stream: one square per stem, filling a strip under the plot.
          const c = g.ctx; c.save();
          for (const [want, col] of [[1, PAL.sand], [0, PAL.moss]]) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < n; i++) { if (D.data[i] !== want) continue; c.rect(150 + (i % 60) * 11.6, 846 + Math.floor(i / 60) * 13, 8.5, 8.5); } c.fill(); }
          c.restore();
          g.text(`n = ${n}`, 860, 866, { size: 24, role: 'mono', color: PAL.ink, alpha: S.tp(tData, 0.6) });
          g.withAlpha(S.tp(tWash + 0.6, 0.8), () => { g.text('posteriors converge', A.X(0.58), A.y + 120, { size: 24, color: PAL.ink }); g.line(A.X(0.575), A.y + 112, A.X(0.47), A.y + 150, { color: PAL.ink3, w: 1.5 }); });
          // Prior cards: written down, open to inspection.
          const hiW = S.tp(tWrite, 0.8);
          D.priors.forEach((p, i) => {
            const a = S.p(0, 0.7, 0.4 + i * 0.35); const y = 310 + i * 128;
            g.withAlpha(a, () => {
              g.rect(910, y, 380, 108, { r: 10, fill: U.rgba(p.col, 0.07 + 0.08 * hiW), stroke: U.rgba(p.col, 0.5 + 0.45 * hiW), w: 1.5 + hiW });
              g.rect(910, y + 18, 5, 72, { r: 2, fill: p.col });
              g.text(p.name, 936, y + 46, { size: 30, role: 'display', color: p.col });
              g.math(`\\text{Beta}(${p.a},\\, ${p.b})`, 936, y + 88, { size: 28, color: PAL.ink });
            });
          });
          g.withAlpha(S.tp(tSub, 0.6) * (1 - hiW), () => g.with(() => { g.ctx.translate(1196, 470); g.ctx.rotate(-0.1); g.rect(-96, -26, 192, 48, { r: 6, fill: U.rgba(PAL.bg, 0.7), stroke: PAL.rose, w: 3 }); g.text('SUBJECTIVE?', 0, 8, { size: 21, weight: 700, ls: 2.6, color: PAL.rose, align: 'center' }); }));
          g.withAlpha(hiW, () => { caps(g, 'written down:', 910, 712, { color: PAL.ink }); g.text('assumptions open to critique', 910, 746, { size: 23, color: PAL.ink2 }); });
        });

        // ---- Beat 2: severe testing --------------------------------------------------------
        const a1 = S.p(1, 0.9);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tSev = cue(S, 1, 'passed a severe test'), tFalse = cue(S, 1, 'it would probably'), tQ = cue(S, 1, 'The question is not');
          caps(g, 'Severe testing · Mayo', 110, 262);
          const SX = [380, 560, 740, 920], Y0 = 330, Y1 = 690, PY = 470, FY = 600;
          // The sieve: one mesh per possible error.
          SX.forEach((x, i) => {
            const a = S.p(1, 0.6, 0.6 + i * 0.25); const passed = S.tp(tSev + 0.6 + i * 0.6, 0.3);
            g.withAlpha(a, () => {
              g.rect(x - 14, Y0, 28, Y1 - Y0, { r: 6, fill: U.rgba(PAL.ink2, 0.06), stroke: U.mix(PAL.ink3, PAL.moss, passed), w: 1.8 + passed });
              for (let y = Y0 + 18; y < Y1; y += 18) g.line(x - 14, y, x + 14, y, { color: PAL.ink3, w: 1, alpha: 0.6 });
              g.line(x, Y0, x, Y1, { color: PAL.ink3, w: 1, alpha: 0.6 });
              g.wrap(D.errs[i], x, Y1 + 40, 150, { size: 21, color: PAL.ink2, align: 'center', lh: 1.25 });
              if (passed > 0) g.glow(x, PY, 50, PAL.moss, 0.35 * passed * (1 - S.tp(tSev + 1.4 + i * 0.6, 0.8)));
            });
          });
          // The claim, and the probe that tests it.
          g.withAlpha(S.p(1, 0.7, 0.3), () => { g.rect(110, PY - 56, 170, 112, { r: 10, fill: U.rgba(PAL.ink, 0.06), stroke: PAL.ink2, w: 1.6 }); g.text('H', 195, PY + 14, { size: 54, role: 'math', italic: true, color: PAL.ink, align: 'center' }); caps(g, 'claim', 195, PY + 44, { align: 'center' }); });
          const pp = ease.inOut(clamp((t - tSev) / 2.8)); const px = lerp(290, 1090, pp);
          if (pp > 0) { g.line(290, PY, px, PY, { color: PAL.moss, w: 2.5, alpha: 0.6 }); g.dot(px, PY, 9, PAL.moss, 1, 3.2); }
          // Counterfactual: had H been false, the test would probably have caught it.
          const fp = ease.inOut(clamp((t - tFalse) / 1.4)); const fx = lerp(290, SX[1] - 20, fp);
          if (fp > 0) {
            g.line(290, FY, fx, FY, { color: PAL.coral, w: 2.2, dash: [8, 7], alpha: 0.8 });
            g.dot(fx, FY, 8, PAL.coral, 1, 2.6);
            const caught = S.tp(tFalse + 1.4, 0.5);
            g.text('×', SX[1] - 20, FY - 22, { size: 40, color: PAL.coral, align: 'center', alpha: caught });
            g.text('if H were false: caught', 110, FY + 48, { size: 22, color: PAL.coral, alpha: S.tp(tFalse + 0.2, 0.6) });
          }
          // Passed: severely tested.
          const st = S.tp(tSev + 2.9, 0.6);
          g.withAlpha(st, () => {
            g.rect(1090, PY - 56, 190, 112, { r: 10, fill: U.rgba(PAL.moss, 0.12), stroke: PAL.moss, w: 2 });
            g.text('H', 1185, PY + 14, { size: 54, role: 'math', italic: true, color: PAL.moss, align: 'center' });
            g.with(() => { g.ctx.translate(1185, PY + 92); g.ctx.rotate(-0.06); const sc = lerp(1.3, 1, st); g.ctx.scale(sc, sc); g.rect(-124, -25, 248, 46, { r: 5, stroke: PAL.moss, w: 3 }); g.text('SEVERELY TESTED', 0, 8, { size: 21, weight: 700, ls: 2.6, color: PAL.moss, align: 'center' }); });
          });
          // Not how much to believe, but how well probed.
          g.withAlpha(S.tp(tQ, 0.8), () => {
            g.text('Not “how much should I believe H?”', 110, 860, { size: 28, role: 'display', italic: true, color: PAL.ink2 });
            g.text('but “how well has H been probed?”', 640, 860, { size: 28, role: 'display', italic: true, color: PAL.moss, alpha: S.tp(tQ + 1.4, 0.8) });
          });
        });
      },
      terms: [
        { beat: 0.55, term: 'Washing out of priors', def: 'With enough shared evidence, posteriors from different reasonable priors converge.' },
        { beat: 1.4, term: 'Severe testing', def: 'Mayo’s error-statistical criterion: data support a claim only if the claim passed a test it would probably have failed were it false.' },
      ],
    },
  ],
});
})();
