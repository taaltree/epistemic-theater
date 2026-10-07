/* Chapter XI — Replication, reproducibility, and generalization. Case file: thirty kilometers apart. */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.ochre;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken: found in the sentence that contains it (real per-sentence
// timing when available), then proportional to its position in that sentence.
const _miss = new Set();
const cue = (S, k, phrase) => {
  const tb = S.scene.timing && S.scene.timing.beats[k];
  if (tb && tb.sents) for (const s of tb.sents) { const i = s.cap.indexOf(phrase); if (i >= 0) return s.start + (s.end - s.start) * i / s.cap.length; }
  const b = S.scene.beats[k]; const i = b.t.indexOf(phrase);
  if (i < 0 && !_miss.has(phrase)) { _miss.add(phrase); console.error('cue not found: ' + phrase); }
  return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length);
};
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const lin = (S, t0, d) => clamp((S.t - t0) / d);
const win = (S, t0, t1, d0 = 0.7, d1 = 0.6) => S.tp(t0, d0) * (1 - S.tp(t1, d1));
const tick = (g, x, y, s, col, o = {}) => g.poly([[x - s * 0.45, y], [x - s * 0.12, y + s * 0.32], [x + s * 0.5, y - s * 0.38]], { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1, progress: o.progress ?? 1 });
const cross = (g, x, y, s, col, o = {}) => { const h = s / 2; g.line(x - h, y - h, x + h, y + h, { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1 }); g.line(x + h, y - h, x - h, y + h, { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1 }); };
const person = (g, x, y, s, col, a = 1) => {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.arc(x, y - s * 0.3, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.36, y + s * 0.42); c.quadraticCurveTo(x - s * 0.36, y - s * 0.04, x, y - s * 0.04); c.quadraticCurveTo(x + s * 0.36, y - s * 0.04, x + s * 0.36, y + s * 0.42); c.closePath(); c.fill();
  c.restore();
};
// Irregular closed outline around (cx, cy).
const blob = (r, cx, cy, rx, ry, n = 28, amp = 0.18) => { const ph = r() * 6.28, ph2 = r() * 6.28; const pts = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; const m = 1 + amp * Math.sin(3 * a + ph) + amp * 0.6 * Math.sin(5 * a + ph2); pts.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]); } pts.push(pts[0]); return pts; };

// rep-defs: the original study and four ways a finding can hold up.
const LANES = [
  { name: 'Original study', sub: 'one published estimate', chips: ['data', 'code', 'context'], nw: [0, 0, 0], off: 0, hw: 26, tag: 'estimate' },
  { name: 'Reproducible', sub: 're-run it', chips: ['same data', 'same code', 'same context'], nw: [0, 0, 0], off: 0, hw: 26, tag: '= same number' },
  { name: 'Replicable', sub: 'repeat it', chips: ['new data', 'same methods', 'same context'], nw: [1, 0, 0], off: 13, hw: 34, tag: '≈ consistent' },
  { name: 'Generalizable', sub: 'move it', chips: ['new data', 'same methods', 'new context'], nw: [1, 0, 1], off: -19, hw: 40, tag: '≈ extends' },
  { name: 'Robust', sub: 're-analyze it', chips: ['same data', 'new analysis', 'same context'], nw: [0, 1, 0], off: 9, hw: 30, tag: '≈ survives' },
];

Theater.chapter({
  id: 'rep', roman: 'XI', title: 'Replication', color: COL,
  question: 'Would it happen again, and elsewhere?',
  casefile: { title: 'Thirty kilometers apart', sketch: 'map' },
  intro: { t: 'Chapter eleven. Replication: would it happen again, and elsewhere?' },
  scenes: [
    {
      id: 'rep-defs', title: 'Four ways to hold up', register: 'claim',
      beats: [
        { t: 'When a finding holds up, what exactly held? The National Academies distinguish reproducibility, where the same data and code give the same result, from replicability, where a new study with new data reaches a consistent result.',
          cite: 'National Academies 2019',
          v: 'Two lanes: SAME DATA + SAME CODE → same number (reproducible); NEW DATA → consistent number (replicable).' },
        { t: 'Two more words help. Generalizability asks whether a result extends to other places, times, and populations. Robustness asks whether it survives reasonable changes of analysis. When twenty-nine teams analyzed one data set, their estimates ranged from slightly negative to strongly positive.',
          cite: 'Silberzahn et al. 2018',
          v: 'Lanes 3 and 4 open: NEW CONTEXT (generalizable), NEW ANALYSIS (robust); 29 estimate dots with intervals spread across the axis.' },
      ],
      init() {
        // 29 team estimates (positions ILLUSTRATIVE), sorted, from slightly negative to strongly positive.
        const r = U.rng(1101); const teams = [];
        for (let i = 0; i < 29; i++) { const u = i / 28; teams.push({ est: -0.12 + 1.42 * Math.pow(u, 1.3) + (i > 0 && i < 28 ? (r() - 0.5) * 0.07 : 0), half: 0.16 + 0.2 * r() + 0.1 * u }); }
        teams.sort((a, b) => a.est - b.est);
        return { teams };
      },
      draw(g, t, S, D) {
        const tR = cue(S, 0, 'reproducibility'), tP = cue(S, 0, 'replicability');
        const tG = cue(S, 1, 'Generalizability'), tB = cue(S, 1, 'Robustness'), t29 = cue(S, 1, 'When twenty-nine');
        const tNeg = cue(S, 1, 'slightly negative'), tPos = cue(S, 1, 'strongly positive');
        const q = ease.inOut(lin(S, t29 - 0.3, 1.3));
        const yB = [305, 430, 555, 680, 805], yS = [282, 338, 390, 442, 494];
        const Y = (i) => lerp(yB[i], yS[i], q);
        const starts = [S.b(0) + 0.1, tR, tP, tG, tB];
        const CX = [345, 525, 705], CW = 165, REF = 1030, GX0 = 960, GX1 = 1130, TX = 1146;
        const ch = lerp(48, 38, q);
        const hA = S.p(0, 0.8, 0.2), hy = Y(0) - 54;
        ['data', 'analysis', 'context'].forEach((s, j) => caps(g, s, CX[j] + CW / 2, hy, { align: 'center', alpha: hA }));
        caps(g, 'result', (GX0 + GX1) / 2, hy, { align: 'center', alpha: hA });
        const sepY = (Y(0) + Y(1)) / 2 + 2; g.line(100, sepY, 1310, sepY, { color: PAL.rule, w: 1, alpha: S.tp(tR - 0.4, 0.8) });
        // Reference line: the original estimate, carried down through every lane.
        let last = 0; starts.forEach((s, i) => { if (t >= s) last = i; });
        const refA = S.tp(starts[0] + 1.3, 0.8);
        g.line(REF, Y(0) - 26, REF, Y(last) + 26, { color: PAL.ink3, w: 1.5, dash: [5, 6], alpha: 0.9 * refA });
        // Ghosts of the two lanes still to come (beat 1 opens them).
        const pulse = 0.5 + 0.5 * Math.sin(t * 3);
        LANES.forEach((L, i) => {
          const t0 = starts[i], a = S.tp(t0, 0.7), y = Y(i);
          if (i >= 3) { const gA = (0.35 + 0.25 * S.p(1, 0.6) * pulse) * S.p(0, 0.8, 3.0) * (1 - a); if (gA > 0) { g.rect(100, y - ch / 2, 1210, ch, { r: ch / 2, stroke: PAL.ink3, w: 1.3, dash: [6, 8], alpha: gA }); g.text('?', 124, y + 11, { size: 32, role: 'display', color: PAL.ink3, alpha: gA }); } }
          if (a <= 0) return;
          const nxt = starts[i + 1]; const foc = i === 0 ? 0 : S.tp(t0, 0.6) * (nxt !== undefined ? 1 - S.tp(nxt, 0.6) : 1);
          if (foc > 0) g.rect(90, y - ch / 2 - 10, 1232, ch + 20, { r: 12, fill: U.rgba(COL, 0.07), stroke: U.rgba(COL, 0.25), w: 1, alpha: foc });
          const nx = 100 - (1 - a) * 24;
          g.text(L.name, nx, y + lerp(2, 9, q), { size: lerp(32, 26, q), role: 'display', color: i === 0 ? PAL.ink2 : PAL.ink, alpha: a });
          g.text(L.sub, nx, y + 30, { size: 21, italic: true, color: PAL.ink3, alpha: a * (1 - q) });
          L.chips.forEach((s, j) => {
            const ca = S.tp(t0 + 0.15 + 0.12 * j, 0.6); if (ca <= 0) return; const nw = L.nw[j]; const x = CX[j] + (1 - ca) * 16;
            g.rect(x, y - ch / 2, CW, ch, { r: ch / 2, fill: nw ? U.rgba(COL, 0.22) : 'rgba(239,232,216,0.04)', stroke: nw ? COL : 'rgba(183,179,198,0.45)', w: nw ? 2 : 1.2, alpha: ca });
            g.text(s, x + CW / 2, y + 8, { size: 22, color: nw ? PAL.ink : PAL.ink2, weight: nw ? 600 : 400, align: 'center', alpha: ca });
          });
          g.arrow(885, y, 942, y, { color: PAL.ink3, w: 2, head: 11, progress: S.tp(t0 + 0.5, 0.5) });
          const ga = S.tp(t0 + 0.6, 0.5); g.line(GX0, y, GX1, y, { color: PAL.ink3, w: 1.4, alpha: 0.7 * ga });
          const dp = S.tp(t0 + 0.9, 0.7); const col = i === 0 ? PAL.ink : COL; const x = REF + L.off;
          if (dp > 0) { g.line(x - L.hw * dp, y, x + L.hw * dp, y, { color: col, w: 3, alpha: dp }); g.dot(x, y - (1 - dp) * 28, 7, col, dp, 2.4); }
          if (i === 1) g.circle(x, y, 13, { stroke: PAL.ink, w: 1.5, alpha: S.tp(t0 + 1.4, 0.6) * 0.8 });
          caps(g, L.tag, TX, y + 6, { color: i ? COL : PAL.ink3, alpha: S.tp(t0 + 1.3, 0.6) });
        });

        // Twenty-nine teams, one data set: the robust lane's single estimate fans out into 29.
        const fA = S.tp(t29 + 0.2, 0.8);
        if (fA > 0) {
          const FX0 = 250, FX1 = 1270, FY0 = 590, FY1 = 868, v0 = -0.6, v1 = 2.0;
          const FY = (v) => FY1 - (v - v0) / (v1 - v0) * (FY1 - FY0); const TXi = (i) => FX0 + i * (FX1 - FX0) / 28;
          g.withAlpha(fA, () => {
            const w0 = caps(g, '29 teams · one data set', 120, 556, { color: PAL.ink2 });
            caps(g, 'illustrative positions', 120 + w0 + 30, 556, { size: 15 });
            g.arrow(204, FY1 + 6, 204, FY0 - 12, { color: PAL.ink3, w: 2, head: 11 });
            g.with(() => { g.ctx.translate(178, FY0 + 96); g.ctx.rotate(-Math.PI / 2); g.text('estimated effect', 0, 0, { size: 21, color: PAL.ink2, align: 'center' }); });
            g.line(204, FY(0), 1290, FY(0), { color: PAL.ink3, w: 1.5, dash: [6, 7] });
            g.text('0', 192, FY(0) + 7, { size: 21, color: PAL.ink3, align: 'right' });
            caps(g, 'no effect', 1290, FY(0) - 10, { align: 'right', size: 15 });
          });
          const rx = REF + LANES[4].off, ry = Y(4);
          D.teams.forEach((tm, i) => {
            const ts = t29 + 0.35 + i * 0.045; const f = ease.inOut(lin(S, ts, 0.85)); if (f <= 0) return;
            const x = lerp(rx, TXi(i), f), y = lerp(ry, FY(tm.est), f);
            const col = tm.est - tm.half > 0 ? COL : PAL.ink2; const ip = S.tp(ts + 0.75, 0.5);
            if (ip > 0) g.line(x, FY(tm.est - tm.half * ip), x, FY(tm.est + tm.half * ip), { color: col, w: 2.4, alpha: 0.85 });
            g.dot(x, y, 5.5, col, 1, 2.2);
          });
          const t0 = D.teams[0], tN = D.teams[28];
          g.text('slightly negative', TXi(0) + 14, FY(t0.est) + 42, { size: 22, color: PAL.ink2, alpha: S.tp(tNeg, 0.6) });
          g.text('strongly positive', TXi(28), FY(tN.est + tN.half) - 16, { size: 22, color: COL, align: 'right', alpha: S.tp(tPos, 0.6) });
        }
      },
      terms: [
        { beat: 0.55, term: 'Reproducibility', def: 'Obtaining consistent results from the same data using the same methods and code.' },
        { beat: 0.85, term: 'Replicability', def: 'Obtaining consistent results across studies that address the same question with new data.' },
        { beat: 1.2, term: 'Generalizability', def: 'The extent to which results apply in contexts, places, or populations beyond those studied.' },
        { beat: 1.45, term: 'Robustness', def: 'Whether a result survives reasonable alternative analyses of the same data.' },
      ],
    },
    {
      id: 'rep-crisis', title: 'The replication crisis', register: 'claim',
      beats: [
        { t: 'In 2005, John Ioannidis argued that most published research findings are false, given small samples, small effects, and flexible analyses. In 2015, a large collaboration repeated one hundred psychology studies. Ninety-seven percent of the originals had significant results; thirty-six percent of the replications did.',
          s: 'In 2005, John Yo-ah-nee-dees argued that most published research findings are false, given small samples, small effects, and flexible analyses. In 2015, a large collaboration repeated one hundred psychology studies. Ninety-seven percent of the originals had significant results; thirty-six percent of the replications did.',
          cite: 'Ioannidis 2005; Open Science Collaboration 2015',
          v: 'Two bars: originals 97% significant, replications 36%.' },
        { t: 'The causes are familiar: low statistical power; publication bias toward positive results; p-hacking, trying analyses until one is significant; HARKing, presenting a hypothesis formed after the results as if it came first; and the garden of forking paths, where each reasonable choice raises the chance of a false positive.',
          s: 'The causes are familiar: low statistical power; publication bias toward positive results; p hacking, trying analyses until one is significant; harking, presenting a hypothesis formed after the results as if it came first; and the garden of forking paths, where each reasonable choice raises the chance of a false positive.',
          cite: 'Kerr 1998; Gelman & Loken 2014',
          v: 'A branching path tree; at each fork the false-positive gauge ticks up.' },
        { t: 'Ecology is not exempt. Many ecologists surveyed admit to questionable research practices. And Stuart Hurlbert showed in 1984 that many field experiments were pseudoreplicated, treating repeated measurements of one unit as independent replicates.',
          cite: 'Fraser et al. 2018; Hurlbert 1984',
          v: 'One treated pond sampled ten times, drawn as if ten ponds; the ten collapse into one.' },
      ],
      init() {
        const LX = [190, 335, 480, 625, 770]; const leafY = (j) => 300 + 37 * j;
        const nodeY = (l, m) => { const span = 16 >> l; return leafY(m * span + (span - 1) / 2); };
        const edges = [];
        for (let l = 0; l < 4; l++) for (let m = 0; m < (1 << l); m++) for (const c of [2 * m, 2 * m + 1]) {
          const x0 = LX[l], y0 = nodeY(l, m), x1 = LX[l + 1], y1 = nodeY(l + 1, c); const pts = [];
          for (let k = 0; k <= 14; k++) { const u = k / 14; pts.push([lerp(x0, x1, u), lerp(y0, y1, U.smooth(u))]); }
          edges.push({ l, m, c, pts });
        }
        const pathTo = (j) => { const out = []; for (let l = 0; l < 4; l++) { const m = j >> (4 - l), c = j >> (3 - l); const e = edges.find((E) => E.l === l && E.m === m && E.c === c); out.push(...(l ? e.pts.slice(1) : e.pts)); } return out; };
        const tries = [{ j: 2, p: '.31' }, { j: 9, p: '.12' }, { j: 5, p: '.08' }, { j: 11, p: '.04' }].map((o) => ({ ...o, pts: pathTo(o.j) }));
        const r = U.rng(1102); const dataDots = Array.from({ length: 5 }, (_, k) => [Math.cos(k * 2.4 + 0.4) * 19 * Math.sqrt((k + 0.6) / 5), Math.sin(k * 2.4 + 0.4) * 19 * Math.sqrt((k + 0.6) / 5)]);
        const pondJit = Array.from({ length: 10 }, () => [(r() - 0.5) * 14, (r() - 0.5) * 8]);
        return { LX, leafY, nodeY, edges, tries, dataDots, pondJit };
      },
      draw(g, t, S, D) {
        // ---- Beat 0: Ioannidis, then the hundred replications.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const pa = S.p(0, 0.9, 0.2); const sh = lerp(300, 0, ease.inOut(lin(S, cue(S, 0, 'In 2015') - 0.7, 1.1)));
          g.with(() => {
            g.ctx.translate(320 + sh, 360); g.ctx.rotate(-0.02);
            g.rect(-212, -110, 424, 220, { r: 8, fill: 'rgba(239,232,216,0.05)', stroke: PAL.rule, w: 1.4, alpha: pa });
            caps(g, 'Ioannidis 2005', -186, -68, { color: COL, alpha: pa });
            g.wrap('Most published research findings are false', -186, -18, 380, { size: 38, role: 'display', color: PAL.ink, lh: 1.15, alpha: S.p(0, 0.9, 1.4) });
          });
          const facts = [['small samples', 'n'], ['small effects', 'e'], ['flexible analyses', 'f']];
          facts.forEach(([s, kind], k) => {
            const a = S.tp(cue(S, 0, s), 0.7); if (a <= 0) return; const y = 528 + k * 96, x = 110 + sh + (1 - a) * 20;
            g.rect(x, y - 36, 420, 72, { r: 10, fill: 'rgba(239,232,216,0.04)', stroke: PAL.rule, w: 1.2, alpha: a });
            g.withAlpha(a, () => {
              const cx = x + 46;
              if (kind === 'n') D.dataDots.slice(0, 4).forEach(([dx, dy]) => g.dot(cx + dx * 1.1, y + dy * 1.1, 4.5, PAL.ink2, 1, 2));
              if (kind === 'e') { for (const [o, c] of [[-5, PAL.ink3], [5, COL]]) { const pts = []; for (let u = -24; u <= 24; u += 2) pts.push([cx + u + o, y + 18 - 32 * Math.exp(-(u * u) / 120)]); g.poly(pts, { color: c, w: 2.4 }); } }
              if (kind === 'f') { g.line(cx - 22, y, cx - 4, y, { color: PAL.ink2, w: 2.6 }); for (const dy of [-18, 0, 18]) g.line(cx - 4, y, cx + 22, y + dy, { color: PAL.ink2, w: 2.6 }); }
              g.text(s, x + 96, y + 8, { size: 24, color: PAL.ink });
            });
          });
          // The Open Science Collaboration: 100 originals vs 100 replications, as stacked cells.
          const t15 = cue(S, 0, 'In 2015'), t97 = cue(S, 0, 'Ninety-seven'), t36 = cue(S, 0, 'thirty-six percent');
          const ra = S.tp(t15, 0.8);
          if (ra > 0) {
            caps(g, '100 psychology studies, repeated', 700, 262, { alpha: ra, color: PAL.ink2 });
            caps(g, 'share with significant results', 700, 300, { alpha: ra });
            const cols = [{ x: 720, n: 97, t: t97, lab: 'Originals' }, { x: 1040, n: 36, t: t36, lab: 'Replications' }];
            cols.forEach((c) => {
              const f = ease.inOut(lin(S, c.t + 0.2, 1.8)); const nOn = c.n * f;
              for (let n = 0; n < 100; n++) {
                const row = Math.floor(n / 5), col = n % 5; const x = c.x + col * 24, y = 816 - row * 24;
                const ca = lin(S, t15 + 0.3 + n * 0.012, 0.4); if (ca <= 0) continue;
                const on = clamp(nOn - n);
                g.rect(x, y, 20, 20, { r: 3, fill: on > 0 ? U.rgba(COL, 0.25 + 0.6 * on) : 'rgba(239,232,216,0.04)', stroke: on > 0 ? COL : 'rgba(183,179,198,0.35)', w: 1, alpha: ca });
              }
              const topY = 836 - Math.ceil(Math.max(1, nOn) / 5) * 24;
              g.text(`${Math.round(nOn)}%`, c.x + 140, topY + 52, { size: 64, role: 'display', color: COL, alpha: S.tp(c.t, 0.5) });
              g.text(c.lab, c.x + 58, 876, { size: 24, color: PAL.ink, align: 'center', alpha: ra });
            });
          }
        });

        // ---- Beat 1: the garden of forking paths, and the practices that exploit it.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tLow = cue(S, 1, 'low statistical power'), tPB = cue(S, 1, 'publication bias'), tPH = cue(S, 1, 'p-hacking');
          const tHK = cue(S, 1, 'HARKing'), tGF = cue(S, 1, 'garden of forking paths');
          const ticks = [1, 2, 3, 4].map((k) => tGF + 0.4 + k * 0.95);
          const lit = (l) => S.tp(ticks[l], 0.45);
          // Decision labels over the columns of forks.
          ['outliers?', 'covariates?', 'transform?', 'subset?'].forEach((s, l) => {
            const x = (D.LX[l] + D.LX[l + 1]) / 2; const a = S.p(1, 0.6, 0.3 + 0.25 * l);
            g.text(s, x, 262, { size: 21, italic: true, color: U.mix(PAL.ink3, COL, lit(l)), align: 'center', alpha: a });
          });
          D.edges.forEach((e) => {
            const p = S.p(1, 0.5, 0.2 + 0.25 * e.l); if (p <= 0) return; const L = lit(e.l);
            g.poly(e.pts, { color: L > 0 ? U.mix(PAL.ink3, COL, L) : PAL.ink3, w: 1.6 + 0.8 * L, alpha: 0.55 + 0.3 * L, progress: p });
          });
          for (let j = 0; j < 16; j++) g.circle(D.LX[4], D.leafY(j), 4.5, { fill: PAL.ink3, alpha: S.p(1, 0.5, 1.2) });
          // Root: a small data set.
          const rA = S.p(1, 0.6); const RX = D.LX[0], RY = D.nodeY(0, 0);
          g.circle(RX, RY, 40, { fill: PAL.bg, stroke: PAL.ink2, w: 2, alpha: rA });
          D.dataDots.forEach(([dx, dy]) => g.dot(RX + dx, RY + dy, 4, PAL.ink2, rA, 2));
          caps(g, 'data', RX, RY - 54, { align: 'center', alpha: rA });
          const lA = S.tp(tLow, 0.7);
          caps(g, 'low power', RX, RY + 74, { align: 'center', color: COL, alpha: lA });
          g.text('small n', RX, RY + 100, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: lA });
          // p-hacking: try paths until one crosses .05.
          D.tries.forEach((tr, k) => {
            const tk = tPH + 0.3 + k * 0.7; const p = ease.inOut(lin(S, tk, 0.6)); if (p <= 0) return;
            const fin = k === D.tries.length - 1; const fade = fin ? 1 : 1 - 0.7 * S.tp(tk + 0.75, 0.4);
            g.poly(tr.pts, { color: fin ? COL : PAL.ink, w: 3.4, alpha: fade, progress: p });
            const pa = S.tp(tk + 0.55, 0.3); const ly = D.leafY(tr.j);
            g.text('p = ' + tr.p, D.LX[4] + 18, ly + 7, { size: 21, role: 'mono', color: fin ? COL : PAL.ink2, alpha: pa * (fin ? 1 : 0.75) });
            if (fin) g.glow(D.LX[4], ly, 26, COL, 0.8 * pa);
          });
          // HARKing: the hypothesis written at the end moves to the front.
          const tLastTry = tPH + 0.3 + 3 * 0.7 + 0.6; const tH0 = Math.max(tHK, tLastTry);
          const hA = S.tp(tH0, 0.5), hf = ease.inOut(lin(S, tH0 + 1.0, 1.6));
          if (hA > 0) {
            const x0 = 920, y0 = D.leafY(11), x1 = RX, y1 = 470, cx = 560, cy = 250;
            const hx = (1 - hf) * (1 - hf) * x0 + 2 * (1 - hf) * hf * cx + hf * hf * x1, hy = (1 - hf) * (1 - hf) * y0 + 2 * (1 - hf) * hf * cy + hf * hf * y1;
            g.rect(hx - 30, hy - 22, 60, 44, { r: 5, fill: '#ECE3CC', alpha: hA });
            g.text('H', hx, hy + 12, { size: 32, role: 'display', italic: true, color: '#24203A', align: 'center', alpha: hA });
            caps(g, 'formed after', x0, y0 - 34, { align: 'center', color: PAL.ink2, alpha: hA * (1 - S.tp(tH0 + 1.0, 0.4)) });
            caps(g, 'presented first', x1, y1 - 36, { align: 'center', color: COL, alpha: S.tp(tH0 + 2.4, 0.6) });
          }
          // Publication bias: significant results to the journal, the rest to the file drawer.
          const pbA = S.tp(tPB, 0.6);
          if (pbA > 0) g.withAlpha(pbA, () => {
            caps(g, 'what gets published', 1140, 652, { align: 'center' });
            g.rect(1000, 700, 130, 120, { r: 6, fill: U.rgba(COL, 0.08), stroke: COL, w: 1.6 });
            g.rect(1155, 700, 130, 120, { r: 6, fill: 'rgba(0,0,0,0.25)', stroke: PAL.ink3, w: 1.6 });
            g.line(1200, 716, 1240, 716, { color: PAL.ink3, w: 3 });
            caps(g, 'journal', 1065, 850, { align: 'center', color: COL }); caps(g, 'file drawer', 1220, 850, { align: 'center' });
            const sig = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0]; let ns = 0, nn = 0;
            sig.forEach((s, k) => {
              const idx = s ? ns++ : nn++; const tk = tPB + 0.3 + k * 0.26; const f = ease.inOut(lin(S, tk, 0.6)); if (f <= 0) return;
              const dx = s ? 1030 + (idx % 3) * 34 : 1180 + (idx % 3) * 34, dy = 795 - Math.floor(idx / 3) * 26;
              const x = lerp(1142, dx, f), y = lerp(672, dy, f) - 30 * Math.sin(Math.PI * f);
              g.dot(x, y, 6, s ? COL : PAL.ink3, 1, 2);
            });
          });
          // The gauge: each fork raises the chance that some path is a false positive.
          const gA = S.tp(tGF - 0.3, 0.7);
          if (gA > 0) g.withAlpha(gA, () => {
            const GX = 1140, GY = 480, GR = 122;
            const vals = [0.05, 1 - Math.pow(0.95, 2), 1 - Math.pow(0.95, 4), 1 - Math.pow(0.95, 8), 1 - Math.pow(0.95, 16)];
            let val = vals[0]; for (let k = 0; k < 4; k++) val += (vals[k + 1] - vals[k]) * ease.outBack(lin(S, ticks[k], 0.5));
            caps(g, 'chance of a false positive', GX, GY - GR - 42, { align: 'center', color: PAL.ink2 });
            g.circle(GX, GY, GR, { stroke: 'rgba(239,232,216,0.12)', w: 16, a0: Math.PI, a1: 2 * Math.PI, cap: 'butt' });
            g.circle(GX, GY, GR, { stroke: COL, w: 16, a0: Math.PI, a1: Math.PI * (1 + clamp(val)), cap: 'butt' });
            for (const v of [0, 0.25, 0.5, 0.75, 1]) { const an = Math.PI * (1 + v); g.line(GX + Math.cos(an) * (GR + 12), GY + Math.sin(an) * (GR + 12), GX + Math.cos(an) * (GR + 20), GY + Math.sin(an) * (GR + 20), { color: PAL.ink3, w: 2 }); }
            const an = Math.PI * (1 + clamp(val, 0, 1.02)); g.line(GX, GY, GX + Math.cos(an) * (GR - 24), GY + Math.sin(an) * (GR - 24), { color: PAL.ink, w: 3.5 }); g.circle(GX, GY, 8, { fill: PAL.ink });
            g.text(`${Math.round(val * 100)}%`, GX, GY + 60, { size: 52, role: 'display', color: COL, align: 'center' });
            caps(g, 'illustrative', GX, GY + 92, { align: 'center', size: 15 });
            g.text('α = 0.05 per path; paths independent', GX, GY + 120, { size: 21, italic: true, color: PAL.ink3, align: 'center' });
          });
        });

        // ---- Beat 2: ecology is not exempt; one pond sampled ten times.
        const a2 = S.p(2, 0.8);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tSv = cue(S, 2, 'Many ecologists'), tHu = cue(S, 2, 'Stuart Hurlbert'), tPs = cue(S, 2, 'pseudoreplicated'), tCo = cue(S, 2, 'treating repeated');
          g.text('Ecology is not exempt.', 110, 300, { size: 44, role: 'display', italic: true, color: PAL.ink, alpha: S.p(2, 0.9, 0.2) });
          const sA = S.tp(tSv, 0.7);
          if (sA > 0) {
            g.rect(700, 232, 600, 196, { r: 10, fill: 'rgba(239,232,216,0.04)', stroke: PAL.rule, w: 1.2, alpha: sA });
            caps(g, 'survey of ecologists · questionable practices', 724, 266, { alpha: sA });
            ['left out a non-significant result', 'collected more data after checking p', 'presented a surprise as predicted'].forEach((s, k) => {
              const y = 312 + k * 40, ia = S.tp(tSv + 0.4 + k * 0.45, 0.5);
              g.rect(726, y - 17, 22, 22, { r: 4, stroke: PAL.ink2, w: 1.5, alpha: ia });
              tick(g, 737, y - 6, 18, PAL.violet, { progress: S.tp(tSv + 0.7 + k * 0.45, 0.4), alpha: ia, w: 3 });
              g.text(s, 764, y + 2, { size: 22, color: PAL.ink2, alpha: ia });
            });
            for (let k = 0; k < 5; k++) person(g, 140 + k * 46, 380, 40, PAL.violet, sA * 0.85);
          }
          // Ten "replicates" that are really one pond.
          const pA = S.tp(tHu, 0.7);
          if (pA > 0) {
            const col = ease.inOut(lin(S, tCo + 0.3, 1.8)); const rows = [{ y: 560, fish: true, lab: 'predator added', c: PAL.coral }, { y: 760, fish: false, lab: 'no predator', c: PAL.ink2 }];
            const CXp = 790, PX = (i) => 360 + i * 98.5;
            rows.forEach((R, ri) => {
              const ra = S.tp(tHu + 0.2 + ri * 0.4, 0.7); if (ra <= 0) return;
              caps(g, R.lab, 110, R.y - 18, { color: R.c, alpha: ra });
              const nA = 1 - S.tp(tCo + 1.4, 0.5), n1 = S.tp(tCo + 1.6, 0.6);
              g.text('n = 10', 110, R.y + 24, { size: 30, role: 'mono', color: PAL.ink, alpha: ra * nA });
              if (S.at(0) && S.t > tPs) g.text('?', 236, R.y + 24, { size: 32, role: 'display', color: COL, alpha: ra * nA * S.tp(tPs, 0.4) });
              g.text('n = 1', 110, R.y + 24, { size: 30, role: 'mono', color: COL, alpha: ra * n1 });
              // the merged pond
              if (col > 0) g.ellipse(CXp, R.y, lerp(40, 230, col), lerp(25, 66, col), { fill: U.rgba(PAL.lagoon, 0.2), stroke: PAL.lagoon, w: 2.2, alpha: ra * col });
              for (let i = 0; i < 10; i++) {
                const pa = S.tp(tHu + 0.3 + ri * 0.4 + i * 0.07, 0.5) * ra; if (pa <= 0) continue;
                const x = lerp(PX(i), CXp, col), y = R.y;
                g.ellipse(x, y, 40, 25, { fill: U.rgba(PAL.lagoon, 0.2), stroke: PAL.lagoon, w: 2, alpha: pa * (1 - col) });
                if (R.fish) g.icon('fish', lerp(x - 10, CXp - 150, col), y + 2, lerp(28, 40, col), PAL.coral, { alpha: pa * (i === 0 ? 1 : 1 - col) });
                const sx = lerp(PX(i) + 16, CXp - 60 + (i - 4.5) * 26 + D.pondJit[i][0], col), sy = lerp(y - 4, y + D.pondJit[i][1] + (i % 2 ? 14 : -14), col);
                g.dot(sx, sy, 4.5, PAL.ink, pa, 2.2);
              }
            });
            const fa = S.tp(tCo + 1.8, 0.8);
            g.text('ten samples of one pond', 1040, 572, { size: 23, color: PAL.ink, alpha: fa });
            g.text('are one replicate, not ten', 1040, 602, { size: 23, color: COL, alpha: fa });
            g.text('Repeated measurements of one unit are not independent replicates.', 705, 880, { size: 30, role: 'display', italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tCo + 2.4, 0.9) });
          }
        });
      },
      terms: [
        { beat: 1.2, term: 'Publication bias', def: 'Selective publication of positive or significant results, which inflates effects in the literature.' },
        { beat: 1.35, term: 'P-hacking', def: 'Trying analyses, subsets, or stopping rules until a result crosses a significance threshold.' },
        { beat: 1.5, term: 'HARKing', def: 'Hypothesizing after the results are known and presenting the hypothesis as if it had been made in advance (Kerr).' },
        { beat: 1.75, term: 'Garden of forking paths', def: 'Data-dependent analytic choices that inflate false positives even without deliberate fishing (Gelman and Loken).' },
        { beat: 2.6, term: 'Pseudoreplication', def: 'Treating non-independent measurements, such as repeated samples of one experimental unit, as independent replicates (Hurlbert).' },
      ],
    },
    {
      id: 'rep-30km', title: 'Case file: thirty kilometers apart', register: 'claim',
      beats: [
        { t: 'In the Madison Headwaters of central Yellowstone, wolves met a non-migratory herd of four to six hundred elk, wintering on patches kept bare by thermal features and hemmed in by deep snow. Cow survival fell by five to fifteen percent, and elk numbers fell five- to tenfold.',
          cite: 'Garrott et al. 2008',
          v: 'Case-file card (map). A valley in deep snow with steaming thermal patches; elk dots confined to them; the herd curve drops steeply.' },
        { t: 'Less than thirty kilometers away, on the Northern Range, the effect of the same wolves is still debated. And on two Alaskan islands, wolves nearly eliminated the deer. Same predator, different worlds.',
          cite: 'Klein 1995; Roffler et al. 2023',
          v: 'Pan north to the open Northern Range; then island insets in Southeast Alaska with deer counts collapsing.' },
        { t: 'Replication across many sites sharpens the pattern. Across eleven elk populations, only grizzly predation added to newborn calf mortality. Across forty-five, human harvest outweighed every predator. Across fifty-two removal experiments, killing predators rarely raised abundance.',
          cite: 'Griffin et al. 2011; Brodie et al. 2013; Clark & Hebblewhite 2021',
          v: 'Three meta-analysis tiles fill with many small site markers; each tile resolves to its one-line conclusion.' },
        { t: 'Generalizing also depends on where we look. About seventy percent of studies of carnivore interactions are in protected areas, yet only fifteen percent of large-carnivore range in North America is protected, and four percent is strictly protected from hunting.',
          cite: 'Prugh & Sivy 2020; Wilmers et al. 2025',
          v: 'Two stacked bars: where studies are (70% protected) vs where carnivores live (15% protected, 4% strictly).' },
        { t: 'The review’s answer is a set of scope conditions. Predators most often limit their prey where prey are spatially confined, where they share a predator with a more resilient prey species, or where several predators specialize on different life stages.',
          cite: 'Wilmers et al. 2025',
          v: 'Three condition icons: an island, two prey sharing a wolf (caribou and moose), and calves and adults each with their own predator.' },
      ],
      init() {
        const r = U.rng(1130); const WW = 900, WH = 1250;
        // Madison Headwaters (south): a river valley in deep snow, with thermal ground along the river.
        const river = []; for (let k = 0; k <= 90; k++) { const u = k / 90; river.push([40 + 830 * u, 760 + 400 * u + 34 * Math.sin(u * 10.5)]); }
        const riverY = (x) => { const u = clamp((x - 40) / 830) * 90; const k = Math.min(89, Math.floor(u)); return lerp(river[k][1], river[k + 1][1], u - k); };
        const patches = [0.1, 0.25, 0.4, 0.55, 0.7, 0.86].map((u, k) => { const i = Math.round(u * 90); const [x, y] = river[i]; const side = k % 2 ? 1 : -1; return { x: x + side * 8, y: y + side * 26, rx: 52 + r() * 18, ry: 30 + r() * 8, rot: 0.42 + (r() - 0.5) * 0.3, ph: r() }; });
        const inPatch = (x, y, pad = 0) => patches.some((p) => { const c = Math.cos(-p.rot), s = Math.sin(-p.rot); const dx = x - p.x, dy = y - p.y; const a = (dx * c - dy * s) / (p.rx + pad), b = (dx * s + dy * c) / (p.ry + pad); return a * a + b * b < 1; });
        const cv = Theater.makeCanvas(WW, WH); const cg = Theater.makeG(cv.getContext('2d'));
        // Northern Range (north): open, rolling, windswept.
        for (let k = 0; k < 10; k++) { const y0 = 30 + k * 46; const pts = []; for (let x = 0; x <= WW; x += 18) pts.push([x, y0 + 16 * U.noise1(x * 0.006 + k * 3.1, 11) + 9 * Math.sin(x * 0.01 + k)]); cg.poly(pts, { color: PAL.moss, w: 1.2, alpha: 0.2 }); }
        for (let k = 0; k < 900; k++) cg.circle(r() * WW, r() * 470, 1.2 + r() * 1.3, { fill: PAL.moss, alpha: 0.1 + r() * 0.16 });
        for (let k = 0; k < 260; k++) { const x = r() * WW, y = r() * 480; cg.line(x, y, x + 5, y + 2, { color: PAL.snow, w: 1.1, alpha: 0.12 }); }
        const yr = []; for (let k = 0; k <= 60; k++) { const u = k / 60; yr.push([u * WW, 340 - 130 * u + 26 * Math.sin(u * 8)]); } cg.poly(yr, { color: PAL.lagoon, w: 3.2, alpha: 0.8 });
        const lr = []; for (let k = 0; k <= 40; k++) { const u = k / 40; lr.push([900 - 330 * u, 30 + 200 * u + 14 * Math.sin(u * 9)]); } cg.poly(lr, { color: PAL.lagoon, w: 2.4, alpha: 0.7 });
        // Central plateau: conifers.
        for (let k = 0; k < 170; k++) { const x = r() * WW, y = 480 + Math.pow(r(), 0.8) * 230; cg.icon('conifer', x, y, 12 + r() * 10, PAL.moss, { alpha: 0.22 + r() * 0.3 }); }
        // Madison: ridges, deep snow, river, thermal patches.
        for (const d of [-250, -175, -105, 125, 190, 260]) { const pts = river.map(([x, y], k) => [x, y + d + 12 * U.noise1(k * 0.25 + d, 5)]); cg.poly(pts, { color: PAL.snow, w: 1.4, alpha: 0.24 }); }
        for (let k = 0; k < 3400; k++) {
          const x = r() * WW, y = 600 + r() * 650; if (inPatch(x, y, 8)) continue; const dr = Math.abs(y - riverY(x)); if (dr < 12) continue;
          const ang = 0.45 + (r() - 0.5) * 0.35, L = 4 + r() * 6; cg.line(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L, { color: PAL.snow, w: 1.3, alpha: (0.07 + 0.22 * clamp(dr / 220)) * clamp((y - 600) / 80) });
        }
        cg.poly(river, { color: PAL.lagoon, w: 3.2, alpha: 0.85 });
        for (const p of patches) {
          cg.ellipse(p.x, p.y, p.rx, p.ry, { rot: p.rot, fill: U.rgba(PAL.clay, 0.2), stroke: PAL.ochre, w: 1.6, alpha: 0.85 });
          cg.ellipse(p.x, p.y, p.rx * 0.6, p.ry * 0.55, { rot: p.rot, stroke: PAL.ochre, w: 1, alpha: 0.35 });
          cg.circle(p.x + p.rx * 0.3, p.y - p.ry * 0.1, 4.5, { fill: PAL.lagoon, alpha: 0.7 });
        }
        // Elk confined to the patches; a kill order for the decline.
        const elk = []; for (let k = 0; k < 42; k++) { const p = patches[k % 6]; const rr = Math.sqrt(r()) * 0.62, th = r() * 6.28; const lx = Math.cos(th) * rr * p.rx, ly = Math.sin(th) * rr * p.ry; elk.push({ x: p.x + lx * Math.cos(p.rot) - ly * Math.sin(p.rot), y: p.y + lx * Math.sin(p.rot) + ly * Math.cos(p.rot), s: r() * 100, rank: r() }); }
        const order = elk.map((_, i) => i).sort((a, b) => elk[a].rank - elk[b].rank); order.forEach((i, k) => { elk[i].rank = k; });
        const groups = [[150, 110], [330, 200], [520, 90], [700, 160], [240, 380], [450, 300], [640, 400], [800, 330]];
        const nrElk = []; groups.forEach(([gx, gy]) => { for (let k = 0; k < 9; k++) nrElk.push({ x: gx + U.gauss(r) * 20, y: gy + U.gauss(r) * 12, s: r() * 100 }); });
        // Two Alaskan islands (insets) and the scope-condition island.
        const isl = [blob(r, 138, 92, 88, 58), blob(r, 138, 92, 80, 62)];
        const deerPos = [[[-46, -14], [-12, -30], [24, -8], [52, 10], [-30, 16], [6, 22], [40, -32], [-58, 8]], [[-40, -20], [-6, -34], [30, -14], [50, 18], [-24, 14], [10, 20], [-56, -2], [34, 34]]];
        const isl3 = blob(r, 0, 0, 120, 72, 32, 0.15);
        // Meta-analysis markers.
        const tileMarks = [[11, 4, 3], [45, 9, 5], [52, 13, 4]].map(([n, cx, cy]) => { const cells = []; for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) cells.push([(i + 0.5) / cx, (j + 0.5) / cy]); const out = []; for (let k = 0; k < n; k++) { const c = cells.splice(Math.floor(r() * cells.length), 1)[0]; out.push([c[0] + (r() - 0.5) * 0.5 / cx, c[1] + (r() - 0.5) * 0.5 / cy]); } return out; });
        const studies = []; for (let k = 0; k < 40; k++) studies.push({ prot: k < 28, u: r(), v: r() });
        return { cv, patches, elk, nrElk, isl, deerPos, isl3, tileMarks, studies };
      },
      draw(g, t, S, D) {
        const tW = cue(S, 0, 'wolves met'), tPa = cue(S, 0, 'wintering on patches'), tSn = cue(S, 0, 'deep snow'), tCow = cue(S, 0, 'Cow survival'), tEl = cue(S, 0, 'elk numbers fell');
        const tAK = cue(S, 1, 'And on two Alaskan'), tSame = cue(S, 1, 'Same predator');
        // Case file: pinned large, then shrunk to the corner once the evidence arrives.
        const cs = ease.inOut(S.tp(S.b(2) - 0.4, 1.0));
        g.casefile(96, 226, lerp(270, 196, cs), lerp(156, 112, cs), { title: 'Thirty kilometers apart', no: 'XI', sketch: 'map', color: COL, rot: -0.02, alpha: S.p(0, 0.9), pin: cs < 0.5 });

        // ---- Beats 0–1: the map panel. Madison Headwaters, then a pan north to the Northern Range.
        const mA = vis(S, 0, 2);
        if (mA > 0) g.withAlpha(mA, () => {
          const PX = 410, PY = 226, PW = 900, PH = 594;
          const pan = ease.inOut(S.tp(S.b(1) + 0.1, 2.8)); const camY = lerp(656, 0, pan);
          const sx = (x) => PX + x, sy = (y) => PY + y - camY;
          const reveal = S.p(0, 1.4);
          g.clip(PX, PY, PW, PH, () => {
            g.ctx.globalAlpha *= reveal; g.ctx.drawImage(D.cv, PX, PY - camY);
            // steam rising from the thermal ground
            D.patches.forEach((p, i) => { for (let k = 0; k < 3; k++) { const ph = (t * 0.22 + k / 3 + p.ph) % 1; g.glow(sx(p.x + Math.sin(ph * 6 + i) * 8), sy(p.y - 6 - ph * 50), 12 + ph * 16, PAL.snow, 0.5 * (1 - ph) * S.p(0, 1, 0.6)); } });
            // elk on the patches, thinning as the herd declines
            const kept = lerp(42, 6, ease.inOut(lin(S, tEl, 3.5)));
            D.elk.forEach((e, i) => { const a = clamp(kept - e.rank) * S.tp(tPa - 1.2 + (i % 6) * 0.08, 0.8); if (a <= 0) return; g.dot(sx(e.x + 2.5 * U.noise1(t * 0.4 + e.s, 3)), sy(e.y + 2 * U.noise1(t * 0.35 + e.s, 4)), 3.6, PAL.sand, a, 2.2); });
            for (let k = 0; k < 3; k++) { const an = t * 0.05 + k * 2.1; const wx = 450 + Math.cos(an) * 330, wy = 960 + Math.sin(an) * 150; const ca = Math.cos(0.45), sa = Math.sin(0.45); const dx = wx - 450, dy = wy - 960; g.dot(sx(450 + dx * ca - dy * sa * 0.6), sy(960 + dx * sa * 0.5 + dy * ca), 4.5, PAL.coral, S.tp(tW, 0.8), 2.6); }
            // Northern Range: elk spread across open country; wolves; the effect still debated.
            D.nrElk.forEach((e) => g.dot(sx(e.x + 3 * U.noise1(t * 0.3 + e.s, 6)), sy(e.y + 2 * U.noise1(t * 0.3 + e.s, 7)), 3.4, PAL.sand, S.p(1, 0.8, 0.6), 2.1));
            for (let k = 0; k < 4; k++) { const an = -t * 0.04 + k * 1.6; g.dot(sx(450 + Math.cos(an) * 320), sy(250 + Math.sin(an) * 150), 4.5, PAL.coral, S.p(1, 0.8, 1.0), 2.6); }
            caps(g, 'Madison Headwaters', sx(30), sy(694), { color: PAL.ink2, alpha: S.p(0, 0.8, 0.4) });
            g.text('deep snow', sx(700), sy(820), { size: 22, italic: true, color: PAL.snow, alpha: S.tp(tSn, 0.7) });
            const P1 = D.patches[1]; const ta = S.tp(tPa, 0.7);
            g.line(sx(P1.x - 24), sy(P1.y + 30), sx(P1.x - 60), sy(P1.y + 84), { color: COL, w: 1.5, alpha: ta });
            g.text('thermal ground', sx(P1.x - 60), sy(P1.y + 108), { size: 22, italic: true, color: COL, align: 'right', alpha: ta });
            caps(g, 'Northern Range', sx(30), sy(36), { color: PAL.ink2 });
            g.text('central plateau', sx(30), sy(540), { size: 21, italic: true, color: PAL.ink3 });
            const sa30 = S.p(1, 0.8, 0.3);
            g.arrow(sx(860), sy(1010), sx(860), sy(170), { color: PAL.ink2, w: 2, head: 13, both: true, alpha: sa30 });
            g.pill('Madison Headwaters: less than 30 km', sx(845), sy(560), { size: 22, align: 'right', color: PAL.ink, fill: 'rgba(14,13,26,0.85)', stroke: PAL.rule, alpha: sa30 });
            g.pill('Same wolves: effect still debated', sx(470), sy(150), { size: 22, align: 'center', color: COL, fill: 'rgba(14,13,26,0.85)', stroke: COL, alpha: S.p(1, 0.8, 3.2) });
          });
          g.rect(PX, PY, PW, PH, { r: 6, stroke: PAL.rule, w: 1.5 });
          g.text('Same predator, different worlds.', PX + PW / 2, 878, { size: 40, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tSame, 0.9) });
        });

        // Left column: the Madison herd, then the two islands.
        const lA = S.p(0, 0.8, 0.6) * (1 - S.tp(tAK - 0.4, 0.6));
        if (lA > 0) g.withAlpha(lA, () => {
          caps(g, 'Madison Headwaters', 104, 426, { color: PAL.ink2 });
          g.text('400–600 elk', 104, 470, { size: 40, role: 'display', color: PAL.ink });
          g.text('non-migratory, hemmed in', 104, 500, { size: 21, color: PAL.ink2 });
          caps(g, 'herd size', 104, 548); caps(g, 'stylized', 380, 548, { align: 'right', size: 15 });
          const A = g.axes({ x: 140, y: 572, w: 228, h: 170, xmin: 0, xmax: 1, ymin: 0, ymax: 1.12, progress: S.p(0, 1, 0.8), arrows: true });
          const wx = 0.3; const dropP = ease.inOut(lin(S, tEl - 0.4, 2.6));
          const f = (x) => (x < wx ? 1 + 0.03 * Math.sin(x * 30) : 1 - 0.88 * ease.inOut((x - wx) / (1 - wx)));
          g.plot(A, f, { from: 0, to: wx, color: PAL.sand, w: 3.5, progress: S.p(0, 1.4, 1.2) });
          if (dropP > 0) g.plot(A, f, { from: wx, to: lerp(wx, 1, dropP), color: PAL.sand, w: 3.5 });
          const wa = S.tp(tW, 0.7); g.line(A.X(wx), A.Y(0), A.X(wx), A.Y(1.1), { color: PAL.coral, w: 1.6, dash: [5, 6], alpha: wa });
          g.text('wolves', A.X(wx) + 8, A.Y(1.1) + 4, { size: 21, color: PAL.coral, alpha: wa });
          g.text('time', A.X(1), A.Y(0) + 30, { size: 21, color: PAL.ink3, align: 'right', alpha: S.p(0, 0.8, 1.2) });
          const ca = S.tp(tCow, 0.7), ea = S.tp(tEl + 0.6, 0.7);
          g.text('cow survival', 104, 818, { size: 22, color: PAL.ink2, alpha: ca }); g.text('↓ 5–15%', 380, 818, { size: 24, weight: 600, color: COL, align: 'right', alpha: ca });
          g.text('elk numbers', 104, 856, { size: 22, color: PAL.ink2, alpha: ea }); g.text('↓ 5- to 10-fold', 380, 856, { size: 24, weight: 600, color: COL, align: 'right', alpha: ea });
        });
        const iA = S.tp(tAK, 0.8) * (1 - S.p(2, 0.6));
        if (iA > 0) g.withAlpha(iA, () => {
          caps(g, 'Southeast Alaska', 104, 426, { color: PAL.ink2 });
          [0, 1].forEach((k) => {
            const x = 104, y = 448 + k * 214, w = 276, h = 190; const a = S.tp(tAK + 0.2 + k * 0.4, 0.7);
            g.rect(x, y, w, h, { r: 6, fill: U.rgba(PAL.lagoon, 0.06), stroke: U.rgba(PAL.lagoon, 0.45), w: 1.3, alpha: a });
            g.clip(x, y, w, h, () => { for (let j = 0; j < 9; j++) for (let i = 0; i < 7; i++) { const hx = x + 14 + i * 40 + (j % 2) * 20, hy = y + 12 + j * 21; g.line(hx, hy, hx + 12, hy, { color: PAL.lagoon, w: 1, alpha: 0.25 * a }); } });
            g.poly(D.isl[k].map(([px, py]) => [x + px, y + py]), { fill: '#1B1930', color: PAL.moss, w: 2, alpha: a });
            const left = lerp(8, 0.7, ease.inOut(lin(S, tAK + 1.4 + k * 0.3, 2.6)));
            D.deerPos[k].forEach(([dx, dy], j) => g.icon('deer', x + 138 + dx, y + 92 + dy, 26, PAL.sand, { alpha: a * clamp(left - j) }));
            g.icon('wolf', x + 214, y + 150, 34, PAL.coral, { alpha: S.tp(tAK + 0.9 + k * 0.3, 0.6) });
            g.text(['Coronation Island', 'Pleasant Island'][k], x + 12, y + h - 12, { size: 21, italic: true, color: PAL.ink2, alpha: a }); caps(g, 'stylized', x + w - 10, y + 24, { align: 'right', size: 15, alpha: a });
          });
        });

        // ---- Beat 2: three meta-analyses.
        const TX = [110, 513, 916], TW = 384, TY = 380, TH = 500;
        const head = (str, k0, k1) => g.text(str, 322, 300, { size: 42, role: 'display', italic: true, color: PAL.ink, alpha: vis(S, k0, k1) });
        head('Replication across many sites', 2, 3); head('Where we look', 3, 4); head('Scope conditions', 4);
        caps(g, 'where predators most often limit prey', 324, 338, { alpha: S.tp(cue(S, 4, 'Predators most often'), 0.8), color: PAL.ink2 });
        const b2 = vis(S, 2, 3);
        if (b2 > 0) g.withAlpha(b2, () => {
          const tiles = [
            { n: 11, lab: 'elk populations', src: 'Griffin et al. 2011', t0: cue(S, 2, 'Across eleven'), t1: cue(S, 2, 'only grizzly'), txt: 'Only grizzly predation added to newborn calf mortality' },
            { n: 45, lab: 'elk populations', src: 'Brodie et al. 2013', t0: cue(S, 2, 'Across forty-five'), t1: cue(S, 2, 'human harvest'), txt: 'Human harvest outweighed every predator' },
            { n: 52, lab: 'removal experiments', src: 'Clark & Hebblewhite 2021', t0: cue(S, 2, 'Across fifty-two'), t1: cue(S, 2, 'killing predators'), txt: 'Killing predators rarely raised abundance' },
          ];
          tiles.forEach((T, k) => {
            const x = TX[k], fa = S.p(2, 0.7, 0.4 + k * 0.25), a = S.tp(T.t0 - 0.3, 0.7); if (fa <= 0) return;
            g.rect(x, TY + (1 - fa) * 20, TW, TH, { r: 10, fill: 'rgba(239,232,216,0.035)', stroke: PAL.rule, w: 1.3, alpha: fa });
            g.rect(x + 22, TY + 106, TW - 44, 176, { r: 6, stroke: 'rgba(239,232,216,0.1)', w: 1, alpha: fa * (1 - a) });
            g.text('?', x + 22, TY + 82, { size: 76, role: 'display', color: PAL.ink3, alpha: 0.5 * fa * (1 - a) });
            g.withAlpha(a, () => {
              const fill = ease.inOut(lin(S, T.t0, 1.8)); const res = S.tp(T.t1, 0.8);
              g.text(String(Math.round(T.n * fill)), x + 22, TY + 82, { size: 76, role: 'display', color: COL });
              caps(g, T.lab, x + 120, TY + 46, { color: PAL.ink2 }); g.text(T.src, x + 120, TY + 76, { size: 21, italic: true, color: PAL.ink3 });
              const fx = x + 22, fy = TY + 106, fw = TW - 44, fh = 176;
              g.rect(fx, fy, fw, fh, { r: 6, stroke: 'rgba(239,232,216,0.1)', w: 1 });
              D.tileMarks[k].forEach(([u, v], j) => {
                const ma = lin(S, T.t0 + j * (1.6 / T.n), 0.3); if (ma <= 0) return; const mx = fx + u * fw, my = fy + v * fh; const al = ma * (1 - 0.6 * res);
                if (k < 2) g.dot(mx, my, k ? 5 : 7, PAL.sand, al, 2.2); else g.rect(mx - 5, my - 5, 10, 10, { r: 2, fill: PAL.violet, alpha: al });
              });
              g.line(x + 22, TY + 304, x + TW - 22, TY + 304, { color: PAL.rule, w: 1, alpha: res });
              g.withAlpha(res, () => {
                const iy = TY + 360;
                if (k === 0) {
                  g.glow(x + 70, iy, 46, PAL.coral, 0.35); g.icon('bear', x + 70, iy, 66, PAL.coral); g.text('+', x + 118, iy - 18, { size: 32, weight: 600, color: PAL.coral });
                  [['wolf', 180], ['puma', 260], ['coyote', 335]].forEach(([ic, ix]) => g.icon(ic, x + ix, iy + 6, 46, PAL.ink3, { alpha: 0.6 }));
                } else if (k === 1) {
                  const rows = [['person', 266, PAL.violet], ['wolf', 150, PAL.coral], ['bear', 118, PAL.coral], ['puma', 84, PAL.coral]];
                  rows.forEach(([ic, L, c], j) => { const ry = iy - 40 + j * 27; if (ic === 'person') person(g, x + 44, ry + 2, 28, c); else g.icon(ic, x + 44, ry + 2, 30, c); g.rect(x + 74, ry - 7, L * ease.out(lin(S, T.t1 + 0.2 + j * 0.12, 0.7)), 14, { r: 3, fill: c, alpha: 0.85 }); });
                  caps(g, 'stylized', x + TW - 22, TY + 299, { align: 'right', size: 15 });
                } else {
                  g.icon('wolf', x + 90, iy, 60, PAL.coral, { alpha: 0.55 }); cross(g, x + 92, iy - 2, 44, PAL.violet, { w: 4 });
                  g.arrow(x + 150, iy, x + 232, iy, { color: PAL.ink2, w: 2.4, head: 13 });
                  g.icon('elk', x + 290, iy + 4, 62, PAL.sand); g.text('≈', x + 340, iy - 22, { size: 34, color: PAL.ink, weight: 600 });
                }
                g.wrap(T.txt, x + 22, TY + 444, TW - 44, { size: 24, color: PAL.ink, lh: 1.25 });
              });
            });
          });
        });

        // ---- Beat 3: where studies are vs where carnivores live.
        const b3 = vis(S, 3, 4);
        if (b3 > 0) g.withAlpha(b3, () => {
          const t70 = cue(S, 3, 'About seventy'), t15 = cue(S, 3, 'yet only fifteen'), t4 = cue(S, 3, 'four percent');
          const BX = 200, BW = 1080, W = (p) => BX + BW * p / 100;
          const aA = S.p(3, 0.7, 0.4), fA = ease.inOut(lin(S, t70 + 0.2, 1.4));
          caps(g, 'where studies of carnivore interactions are', BX, 452, { color: PAL.ink2, alpha: aA });
          g.rect(BX, 468, BW, 84, { r: 6, fill: 'rgba(239,232,216,0.04)', stroke: PAL.rule, w: 1.3, alpha: aA });
          g.rect(BX, 468, BW * 0.7 * fA, 84, { r: 6, fill: U.rgba(PAL.moss, 0.42), alpha: aA });
          D.studies.forEach((s, k) => { const sa = lin(S, t70 + 0.4 + k * 0.03, 0.4) * aA; const x = s.prot ? BX + 14 + s.u * (BW * 0.7 - 130) : W(70) + 14 + s.u * (BW * 0.3 - 28); g.rect(x - 5, 480 + s.v * 60 - 6, 10, 12, { r: 1.5, fill: PAL.ink2, alpha: 0.75 * sa }); });
          g.withAlpha(S.tp(t70 + 1.2, 0.6), () => { g.text('70%', W(70) - 18, 538, { size: 40, role: 'display', color: PAL.ink, align: 'right' }); caps(g, 'protected areas', BX + 16, 586, { color: PAL.moss }); caps(g, 'elsewhere', W(100), 586, { align: 'right' }); });
          const aB = S.p(3, 0.7, 0.8), fB = ease.inOut(lin(S, t15 + 0.2, 1.2)), sB = S.tp(t4, 0.7);
          caps(g, 'where large carnivores live · North America', BX, 662, { color: PAL.ink2, alpha: aB });
          g.rect(BX, 678, BW, 84, { r: 6, fill: U.rgba(PAL.violet, 0.08), stroke: PAL.rule, w: 1.3, alpha: aB });
          g.rect(BX, 678, BW * 0.15 * fB, 84, { r: 6, fill: U.rgba(PAL.moss, 0.42), alpha: aB });
          g.rect(BX, 678, BW * 0.04 * fB, 84, { r: 6, fill: PAL.moss, alpha: aB * (0.3 + 0.6 * sB) });
          ['wolf', 'bear', 'puma', 'wolf', 'bear', 'puma', 'wolf', 'bear'].forEach((ic, k) => g.icon(ic, 486 + k * 108, 722, 46, PAL.coral, { alpha: 0.8 * lin(S, t15 - 0.2 + k * 0.08, 0.5) * aB }));
          g.withAlpha(S.tp(t15 + 1.0, 0.6), () => { g.text('15%', W(15) + 12, 748, { size: 40, role: 'display', color: PAL.ink }); caps(g, 'unprotected', W(100), 796, { align: 'right' }); });
          g.withAlpha(sB, () => { g.line(W(2), 764, W(2), 800, { color: PAL.moss, w: 1.6 }); g.text('4% strictly protected from hunting', W(2) - 6, 828, { size: 24, color: PAL.moss }); });
          g.line(W(70), 470, W(70), 552, { color: PAL.ink, w: 1.5, alpha: 0.5 * aA * fA });
        });

        // ---- Beat 4: scope conditions.
        const b4 = S.p(4, 0.8);
        if (b4 > 0) g.withAlpha(b4, () => {
          const cards = [
            { t0: cue(S, 4, 'spatially confined'), title: 'Prey spatially confined', sub: 'islands; snow-bound thermal ground' },
            { t0: cue(S, 4, 'share a predator'), title: 'Prey share a predator', sub: 'with a more resilient prey species' },
            { t0: cue(S, 4, 'several predators'), title: 'Predators split life stages', sub: 'each specializes on a different stage' },
          ];
          cards.forEach((C, k) => {
            const x = TX[k], fa = S.p(4, 0.7, 0.4 + k * 0.25), a = S.tp(C.t0 - 0.2, 0.8); if (fa <= 0) return; const cx = x + TW / 2, y0 = TY + (1 - a) * 12;
            g.rect(x, TY, TW, TH, { r: 10, fill: 'rgba(239,232,216,0.035)', stroke: PAL.rule, w: 1.3, alpha: fa * (1 - a) });
            g.text(String(k + 1), cx, TY + 230, { size: 96, role: 'display', color: PAL.ink3, align: 'center', alpha: 0.35 * fa * (1 - a) });
            if (a > 0) g.rect(x, y0, TW, TH, { r: 10, fill: 'rgba(239,232,216,0.035)', stroke: U.rgba(COL, 0.5), w: 1.4, alpha: a });
            g.withAlpha(a, () => {
              const iy = y0 + 170;
              if (k === 0) {
                g.clip(x + 14, y0 + 20, TW - 28, 290, () => { for (let j = 0; j < 13; j++) for (let i = 0; i < 9; i++) { const hx = x + 20 + i * 44 + (j % 2) * 22, hy = y0 + 30 + j * 22; g.line(hx, hy, hx + 14, hy, { color: PAL.lagoon, w: 1, alpha: 0.28 }); } });
                g.poly(D.isl3.map(([px, py]) => [cx + px, iy + py]), { fill: '#1B1930', color: PAL.moss, w: 2.2 });
                [[-60, -14], [-10, 22], [38, -24]].forEach(([dx, dy]) => g.icon('deer', cx + dx, iy + dy, 40, PAL.sand));
                g.icon('wolf', cx + 64, iy + 26, 46, PAL.coral);
              } else if (k === 1) {
                g.icon('wolf', cx, iy - 70, 74, PAL.coral);
                g.icon('moose', cx - 92, iy + 84, 82, PAL.sand); g.icon('caribou', cx + 96, iy + 88, 60, PAL.sand, { alpha: 0.75 });
                g.arrow(cx - 22, iy - 34, cx - 76, iy + 30, { color: PAL.coral, w: 2, head: 11 });
                g.arrow(cx + 22, iy - 34, cx + 84, iy + 42, { color: PAL.coral, w: 4.5, head: 15 });
                g.carrow(cx - 120, iy + 36, cx - 50, iy - 76, -0.35, { color: PAL.moss, w: 2, dash: [5, 6], head: 11 });
                g.text('sustains', cx - 150, iy - 46, { size: 21, italic: true, color: PAL.moss, align: 'center' });
                g.text('declines', cx + 96, iy + 150, { size: 21, italic: true, color: PAL.sand, align: 'center' });
              } else {
                const rows = [['wolf', 'elk', 64, 'adults', -76], ['bear', 'elk', 40, 'calves', 64]];
                rows.forEach(([pr, py, ps, lab, dy]) => { const ry = iy + dy; g.icon(pr, cx - 96, ry, 66, PAL.coral); g.arrow(cx - 46, ry, cx + 40, ry, { color: PAL.coral, w: 2.6, head: 13 }); g.icon(py, cx + 96, ry + (ps < 50 ? 10 : 0), ps, PAL.sand); caps(g, lab, cx + 96, ry + 54, { color: PAL.ink2, align: 'center' }); });
              }
              g.wrap(C.title, x + 24, y0 + 372, TW - 48, { size: 32, role: 'display', color: PAL.ink, lh: 1.1 });
              g.wrap(C.sub, x + 24, y0 + 440, TW - 48, { size: 22, italic: true, color: PAL.ink2, lh: 1.3 });
            });
          });
        });
      },
      terms: [
        { beat: 3.4, term: 'External validity', def: 'Whether a result holds beyond the conditions, sites, or populations in which it was obtained.' },
        { beat: 4.3, term: 'Scope conditions', def: 'The circumstances under which a generalization is expected to hold.' },
        { beat: 4.6, term: 'Apparent competition', def: 'Two prey share a predator; one prey sustains more predators, which then depress the other (Holt).' },
      ],
    },
    {
      id: 'rep-remedies', title: 'Remedies and other standards', register: 'claim',
      beats: [
        { t: 'Remedies are spreading: preregistration and registered reports, which fix hypotheses and analyses before the data are seen; open data and code; and coordinated experiments run the same way at many sites. For predictive models, transferability must be tested, not assumed.',
          cite: 'Nosek et al. 2018; Yates et al. 2018',
          v: 'A timestamped protocol card sealed before data arrive; a map where a model trained in one region is scored in another.' },
        { t: 'Interpretive research has its own standards. Instead of validity and reliability, it asks for trustworthiness: credibility, transferability, dependability, and confirmability.',
          cite: 'Lincoln & Guba 1985',
          v: 'Lens beat: the violet lens shows the four trustworthiness criteria beside their postpositivist counterparts.' },
      ],
      init() {
        const r = U.rng(1140);
        const regA = blob(r, 0, 0, 92, 108, 30, 0.13), regB = blob(r, 0, 0, 96, 104, 30, 0.13);
        // Presence points: in A they sit on the model's hotspots; in B only some do.
        const hot = [[-22, -30, 1], [26, 40, 0.7]];
        const ptsA = [], ptsB = [];
        for (let k = 0; k < 16; k++) { const h = hot[k % 2]; ptsA.push([h[0] + U.gauss(r) * 18, h[1] + U.gauss(r) * 16]); }
        for (let k = 0; k < 14; k++) { const inside = k % 2 === 0; const h = hot[k % 4 < 2 ? 0 : 1]; ptsB.push(inside ? [h[0] + U.gauss(r) * 16, h[1] + U.gauss(r) * 14, 1] : [(r() - 0.5) * 130, (r() - 0.5) * 150, 0]); }
        ptsB.forEach((p) => { if (!p[2]) { const d0 = Math.hypot(p[0] - hot[0][0], p[1] - hot[0][1]), d1 = Math.hypot(p[0] - hot[1][0], p[1] - hot[1][1]); if (d0 < 48 || d1 < 40) { p[0] = p[0] < 0 ? -70 : 66; p[1] = p[1] < 0 ? 64 : -66; } } });
        const data = Array.from({ length: 22 }, () => [r(), r()]);
        const sites = [[0.12, 0.3], [0.3, 0.66], [0.46, 0.22], [0.62, 0.55], [0.82, 0.3], [0.88, 0.75], [0.2, 0.86], [0.56, 0.88], [0.72, 0.12]];
        return { regA, regB, hot, ptsA, ptsB, data, sites };
      },
      draw(g, t, S, D) {
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tPre = cue(S, 0, 'preregistration'), tRR = cue(S, 0, 'registered reports'), tFix = cue(S, 0, 'fix hypotheses'), tSeal = cue(S, 0, 'before the data are seen');
          const tOp = cue(S, 0, 'open data and code'), tCo = cue(S, 0, 'coordinated experiments'), tTr = cue(S, 0, 'For predictive models'), tNA = cue(S, 0, 'tested, not assumed');
          // Timeline.
          const TL = 506; g.arrow(120, TL, 1290, TL, { color: PAL.ink3, w: 2, head: 12, progress: S.p(0, 1.6, 0.2) });
          caps(g, 'time', 1290, TL + 32, { align: 'right', alpha: S.p(0, 0.8, 1.2) });
          // The protocol card.
          const ca = S.tp(tPre - 0.3, 0.8);
          if (ca > 0) {
            const x = 150, y = 238 - (1 - ca) * 16;
            g.rect(x + 4, y + 6, 330, 220, { r: 6, fill: 'rgba(0,0,0,0.35)', alpha: ca });
            g.rect(x, y, 330, 220, { r: 6, fill: '#ECE3CC', alpha: ca });
            g.text('PREREGISTERED PROTOCOL', x + 20, y + 32, { size: 15, weight: 600, ls: 2, color: '#6B5A3A', alpha: ca });
            g.line(x + 18, y + 46, x + 312, y + 46, { color: '#C76E6E', w: 1.4, alpha: 0.8 * ca });
            [['Hypotheses', 0], ['Design', 1], ['Analysis plan', 2]].forEach(([s, k]) => {
              const la = S.tp(tFix + k * 0.35, 0.5) * ca; const yy = y + 82 + k * 44;
              g.text(s, x + 20, yy, { size: 21, weight: 600, color: '#24203A', alpha: la });
              g.rect(x + 160, yy - 12, [140, 118, 84][k], 7, { r: 3, fill: '#9C927C', alpha: la }); g.rect(x + 160, yy + 1, [100, 112, 70][k], 7, { r: 3, fill: '#B9AF98', alpha: la });
            });
            // timestamp clock
            const ck = S.tp(tSeal - 0.6, 0.5) * ca; g.circle(x + 34, y + 196, 12, { stroke: '#6B5A3A', w: 2, alpha: ck }); g.line(x + 34, y + 196, x + 34, y + 188, { color: '#6B5A3A', w: 2, alpha: ck }); g.line(x + 34, y + 196, x + 40, y + 199, { color: '#6B5A3A', w: 2, alpha: ck });
            g.text('timestamped', x + 54, y + 203, { size: 21, italic: true, color: '#6B5A3A', alpha: ck });
            // the seal
            const sp = ease.outBack(lin(S, tSeal, 0.55));
            if (sp > 0) { const sx = x + 292, sy = y + 196; g.circle(sx, sy, 30 * sp, { fill: '#B5452F' }); g.circle(sx, sy, 22 * sp, { stroke: '#E9A28C', w: 1.5, alpha: 0.7 }); g.rect(sx - 9 * sp, sy - 3 * sp, 18 * sp, 14 * sp, { r: 2, fill: '#F2D3C6' }); g.circle(sx, sy - 4 * sp, 6 * sp, { stroke: '#F2D3C6', w: 2.5 }); }
            // seal time on the timeline
            const ma = S.tp(tSeal + 0.2, 0.6); g.line(x + 292, y + 228, x + 292, TL - 8, { color: COL, w: 1.6, dash: [4, 5], alpha: ma }); g.circle(x + 292, TL, 7, { fill: COL, alpha: ma });
            caps(g, 'sealed', x + 306, TL + 32, { color: COL, alpha: ma });
          }
          g.pill('Registered report: reviewed before results', 510, 268, { size: 21, color: PAL.ink, stroke: PAL.rule, fill: 'rgba(239,232,216,0.05)', alpha: S.tp(tRR, 0.7) });
          // Data arrive only after the seal.
          const tD = Math.max(tSeal + 0.9, tFix + 1.2); const da = S.tp(tD, 0.6);
          if (da > 0) {
            const bx = 840, by = 320, bw = 330, bh = 150;
            g.rect(bx, by, bw, bh, { r: 6, fill: 'rgba(239,232,216,0.03)', stroke: PAL.ink3, w: 1.3, alpha: da }); caps(g, 'data', bx + 14, by - 12, { alpha: da });
            D.data.forEach(([u, v], k) => { const f = ease.out(lin(S, tD + 0.2 + k * 0.08, 0.6)); if (f <= 0) return; g.dot(lerp(1300, bx + 20 + u * (bw - 40), f), lerp(by + bh / 2, by + 20 + v * (bh - 40), f), 4.5, PAL.ink2, f, 2); });
            const ma = S.tp(tD + 0.3, 0.6); g.line(bx + bw / 2, by + bh + 4, bx + bw / 2, TL - 8, { color: PAL.ink2, w: 1.6, dash: [4, 5], alpha: ma }); g.circle(bx + bw / 2, TL, 7, { fill: PAL.ink2, alpha: ma });
            caps(g, 'data arrive', bx + bw / 2 + 14, TL + 32, { alpha: ma });
          }
          // Bottom row: open data and code; coordinated experiments; transferability.
          const oa = S.tp(tOp, 0.7);
          if (oa > 0) g.withAlpha(oa, () => {
            caps(g, 'open data & code', 110, 590, { color: PAL.ink2 });
            g.rect(116, 628, 132, 150, { r: 4, fill: 'rgba(239,232,216,0.05)', stroke: PAL.ink2, w: 1.5 });
            for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) g.rect(128 + i * 38, 646 + j * 24, 30, 14, { r: 2, fill: PAL.ink3, alpha: 0.5 });
            g.rect(266, 628, 132, 150, { r: 4, fill: 'rgba(239,232,216,0.05)', stroke: PAL.ink2, w: 1.5 });
            g.text('{ }', 332, 716, { size: 40, role: 'mono', color: COL, align: 'center' });
            // an open padlock
            const lx = 257, ly = 830; g.rect(lx - 20, ly - 10, 40, 32, { r: 4, fill: PAL.moss }); g.ctx.save(); g.ctx.strokeStyle = PAL.moss; g.ctx.lineWidth = 4; g.ctx.beginPath(); g.ctx.arc(lx + 12, ly - 14, 12, Math.PI, 0); g.ctx.stroke(); g.ctx.restore();
            g.text('shared', 292, 846, { size: 21, italic: true, color: PAL.moss });
          });
          const sa = S.tp(tCo, 0.7);
          if (sa > 0) g.withAlpha(sa, () => {
            caps(g, 'coordinated experiments', 450, 590, { color: PAL.ink2 });
            const mx = 450, my = 620, mw = 370, mh = 250; g.rect(mx, my, mw, mh, { r: 8, stroke: 'rgba(239,232,216,0.12)', w: 1 });
            const hubX = mx + mw / 2, hubY = my + mh / 2;
            D.sites.forEach(([u, v], k) => {
              const a = lin(S, tCo + 0.2 + k * 0.12, 0.5); const px = mx + 20 + u * (mw - 40), py = my + 20 + v * (mh - 40);
              g.line(hubX, hubY, px, py, { color: COL, w: 1.2, dash: [4, 5], alpha: 0.5 * a });
              g.rect(px - 14, py - 14, 28, 28, { r: 2, stroke: PAL.ink2, w: 1.4, alpha: a }); g.rect(px - 14, py - 14, 14, 14, { fill: U.rgba(COL, 0.6), alpha: a }); g.rect(px, py, 14, 14, { fill: U.rgba(COL, 0.6), alpha: a });
            });
            g.rect(hubX - 22, hubY - 16, 44, 32, { r: 3, fill: '#ECE3CC' }); g.line(hubX - 14, hubY - 4, hubX + 14, hubY - 4, { color: '#6B5A3A', w: 2 }); g.line(hubX - 14, hubY + 6, hubX + 8, hubY + 6, { color: '#6B5A3A', w: 2 });
            g.text('same protocol, many sites', mx + mw / 2, my + mh + 30, { size: 21, italic: true, color: PAL.ink2, align: 'center' });
          });
          const ta = S.tp(tTr, 0.7);
          if (ta > 0) g.withAlpha(ta, () => {
            caps(g, 'transferability', 860, 590, { color: PAL.ink2 });
            const A = [960, 740], B = [1196, 740]; const mp = ease.inOut(lin(S, tTr + 0.8, 1.2)), sc = S.tp(tNA - 0.2, 0.6);
            g.poly(D.regA.map(([x, y]) => [A[0] + x, A[1] + y]), { fill: 'rgba(239,232,216,0.04)', color: PAL.ink3, w: 1.6 });
            g.poly(D.regB.map(([x, y]) => [B[0] + x, B[1] + y]), { fill: 'rgba(239,232,216,0.04)', color: PAL.ink3, w: 1.6 });
            const contours = (C, a, dash) => D.hot.forEach(([hx, hy, s]) => [1, 0.66, 0.36].forEach((m, j) => g.ellipse(C[0] + hx, C[1] + hy, 54 * s * m, 44 * s * m, { stroke: COL, w: 1.6, alpha: a * (0.35 + 0.25 * j), dash })));
            contours(A, S.tp(tTr + 0.3, 0.6));
            D.ptsA.forEach(([x, y]) => g.dot(A[0] + x, A[1] + y, 3.6, PAL.sand, 1, 2));
            if (mp > 0) { g.carrow(A[0] + 40, 632, B[0] - 40, 632, -0.18, { color: COL, w: 2, head: 12, progress: mp }); contours(B, mp, [5, 5]); }
            D.ptsB.forEach(([x, y, ok], k) => { const px = B[0] + x, py = B[1] + y; g.dot(px, py, 3.6, PAL.sand, S.tp(tTr + 0.4, 0.6), 2); if (sc > 0) { const ka = lin(S, tNA + k * 0.06, 0.3); if (ok) g.circle(px, py, 9, { stroke: PAL.moss, w: 2, alpha: ka }); else cross(g, px, py, 10, PAL.coral, { w: 2.4, alpha: ka }); } });
            caps(g, 'trained here', A[0], 878, { align: 'center' }); caps(g, 'scored here', B[0], 878, { align: 'center', color: sc > 0 ? COL : PAL.ink3 });
          });
        });

        // ---- Beat 1: the interpretivist lens and its own criteria.
        const a1 = S.p(1, 0.8);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tI = cue(S, 1, 'Instead of validity'), tTw = cue(S, 1, 'trustworthiness');
          const words = [['credibility', 'Internal validity', 'Credibility'], ['transferability', 'External validity', 'Transferability'], ['dependability', 'Reliability', 'Dependability'], ['confirmability', 'Objectivity', 'Confirmability']];
          const PCX = 400, ICX = 990, LY = 566, LR = 222;
          const slide = ease.inOut(lin(S, S.b(1) + 0.3, 2.0)); const icx = lerp(PCX + 40, ICX, slide);
          g.lens('pos', PCX, LY, LR, { label: 'POSTPOSITIVIST', labSize: 18, alpha: S.tp(tI - 0.6, 0.8) });
          g.lens('int', icx, LY, LR, { label: 'INTERPRETIVIST', labSize: 18 });
          caps(g, 'validity & reliability', PCX, LY - LR - 22, { align: 'center', color: g.LENS.pos.color, alpha: S.tp(tI, 0.7) });
          caps(g, 'trustworthiness', icx, LY - LR - 22, { align: 'center', color: g.LENS.int.color, alpha: S.tp(tTw, 0.7) });
          words.forEach(([ph, pw, iw], k) => {
            const y = LY - 105 + k * 70; const pa = S.tp(tI + 0.4 + k * 0.25, 0.6), ia = S.tp(cue(S, 1, ph), 0.6);
            g.text(pw, PCX, y + 12, { size: 34, role: 'display', color: PAL.ink2, align: 'center', alpha: pa });
            g.text(iw, icx, y + 12, { size: 34, role: 'display', color: PAL.ink, align: 'center', alpha: ia });
            g.arrow(636, y, 754, y, { color: PAL.ink3, w: 1.8, head: 11, both: true, alpha: ia * pa, progress: S.tp(cue(S, 1, ph) + 0.2, 0.6) });
          });
        });
      },
      terms: [
        { beat: 0.25, term: 'Preregistration', def: 'Recording hypotheses, design, and analysis plan before data are collected or examined.' },
        { beat: 1.35, term: 'Trustworthiness criteria', def: 'Lincoln and Guba’s standards for interpretive research: credibility, transferability, dependability, and confirmability.' },
      ],
    },
  ],
});
})();
