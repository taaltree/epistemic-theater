/* Chapter XII — Objectivity, values, and scientific judgment. Case files: whose costs? whose baseline? */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.heather;

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
const tick = (g, x, y, s, col, o = {}) => g.poly([[x - s * 0.45, y], [x - s * 0.12, y + s * 0.32], [x + s * 0.5, y - s * 0.38]], { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1, progress: o.progress ?? 1 });
const cross = (g, x, y, s, col, o = {}) => { const h = s / 2; g.line(x - h, y - h, x + h, y + h, { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1 }); g.line(x + h, y - h, x - h, y + h, { color: col, w: o.w || 3.5, alpha: o.alpha ?? 1 }); };
const person = (g, x, y, s, col, a = 1) => {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.arc(x, y - s * 0.3, s * 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x - s * 0.36, y + s * 0.42); c.quadraticCurveTo(x - s * 0.36, y - s * 0.04, x, y - s * 0.04); c.quadraticCurveTo(x + s * 0.36, y - s * 0.04, x + s * 0.36, y + s * 0.42); c.closePath(); c.fill();
  c.restore();
};
// A value token: a small faceted gem.
const gem = (g, x, y, s, col, a = 1) => {
  if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col;
  c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.78, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.78, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.78, y); c.lineTo(x, y - s * 0.2); c.closePath(); c.fill(); c.restore();
};
// Small flame (Indigenous burning) and arrow (hunting) marks.
const flame = (g, x, y, s, col, a = 1) => { if (a <= 0) return; const c = g.ctx; c.save(); c.globalAlpha *= a; c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s); c.bezierCurveTo(x + s * 0.7, y - s * 0.3, x + s * 0.55, y + s * 0.5, x, y + s * 0.55); c.bezierCurveTo(x - s * 0.55, y + s * 0.5, x - s * 0.7, y - s * 0.1, x - s * 0.15, y - s * 0.45); c.quadraticCurveTo(x - s * 0.05, y - s * 0.1, x, y - s); c.fill(); c.restore(); };
const dart = (g, x, y, s, col, a = 1) => g.withAlpha(a, () => { g.line(x - s, y + s * 0.5, x + s * 0.7, y - s * 0.35, { color: col, w: 2.4 }); g.arrowHead(x + s, y - s * 0.5, Math.atan2(-0.85, 1.7), s * 0.55, col); g.line(x - s, y + s * 0.5, x - s * 0.75, y + s * 0.1, { color: col, w: 2 }); });

Theater.chapter({
  id: 'values', roman: 'XII', title: 'Values', color: COL,
  question: 'Can science be value-free, and should it be?',
  casefile: { title: 'Whose costs? Whose baseline?', sketch: 'caribou' },
  intro: { t: 'Chapter twelve. Values, objectivity, and judgment.' },
  scenes: [
    {
      id: 'values-risk', title: 'The argument from inductive risk', register: 'claim',
      beats: [
        { t: 'Should science be value-free? The traditional ideal says values may guide which questions we ask and how we use the answers, but not how we judge evidence. Hans Reichenbach separated the context of discovery from the context of justification.',
          s: 'Should science be value-free? The traditional ideal says values may guide which questions we ask and how we use the answers, but not how we judge evidence. Hans Rike-en-bahk separated the context of discovery from the context of justification.',
          cite: 'Reichenbach 1938',
          v: 'A research pipeline: QUESTION → EVIDENCE → USE; values allowed at the ends, a glass wall around EVIDENCE.' },
        { t: 'In 1953, Richard Rudner objected. Evidence never makes a hypothesis certain, so accepting one means judging the evidence strong enough, and how strong is enough depends on the cost of being wrong. Heather Douglas calls this the argument from inductive risk.',
          cite: 'Rudner 1953; Douglas 2000, 2009',
          v: 'The glass wall cracks; an evidence threshold slider moves with the weights of two error costs.' },
        { t: 'Epistemic values, such as accuracy and simplicity, bear on truth. Non-epistemic values, such as safety, livelihoods, or the survival of a species, bear on consequences. Douglas argues that the second kind may legitimately set evidential thresholds, but must never stand in for evidence.',
          cite: 'Douglas 2009',
          v: 'Two columns of value tokens; non-epistemic tokens may sit on the threshold slider but are barred from the evidence pan.' },
      ],
      init() {
        // Cracks radiating from an impact point on the glass wall (unit coordinates of the wall).
        const r = U.rng(1201); const cracks = []; const ix = 0.2, iy = 0.24;
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + r() * 0.5; const pts = [[ix, iy]]; let x = ix, y = iy; const n = 4 + Math.floor(r() * 4); for (let j = 0; j < n; j++) { const L = 0.05 + r() * 0.09, aa = a + (r() - 0.5) * 0.8; x += Math.cos(aa) * L; y += Math.sin(aa) * L * 1.3; pts.push([x, y]); } cracks.push(pts); }
        const scat = Array.from({ length: 14 }, (_, k) => { const u = (k + 0.5) / 14; return [u, clamp(0.2 + 0.6 * u + (r() - 0.5) * 0.25, 0.05, 0.95)]; });
        return { cracks, scat };
      },
      draw(g, t, S, D) {
        const tQ = cue(S, 0, 'which questions we ask'), tU = cue(S, 0, 'how we use the answers'), tJ = cue(S, 0, 'but not how we judge'), tDi = cue(S, 0, 'context of discovery'), tJu = cue(S, 0, 'context of justification');
        const tRu = cue(S, 1, 'Richard Rudner'), tEv = cue(S, 1, 'Evidence never'), tEn = cue(S, 1, 'judging the evidence strong enough'), tC = cue(S, 1, 'depends on the cost'), tIR = cue(S, 1, 'inductive risk');
        const tStrip = tEv - 0.2;
        const CX = [105, 545, 985], CW = 320, CH = 290, CY = 290; const WX = 545 - 22, WY = CY - 22, WW = CW + 44, WH = CH + 44;
        const crack = ease.out(lin(S, tRu + 0.6, 0.9));
        // ---- The pipeline (beat 0 and the start of beat 1).
        const pA = S.p(0, 0.8) * (1 - S.tp(tStrip, 0.7));
        if (pA > 0) g.withAlpha(pA, () => {
          const labs = ['question', 'evidence', 'use'];
          CX.forEach((x, k) => {
            const a = S.p(0, 0.7, 0.3 + k * 0.35); if (a <= 0) return; const y0 = CY + (1 - a) * 16;
            g.rect(x, y0, CW, CH, { r: 10, fill: 'rgba(239,232,216,0.04)', stroke: PAL.rule, w: 1.4, alpha: a });
            g.withAlpha(a, () => {
              caps(g, labs[k], x + 22, y0 + 38, { color: PAL.ink2 });
              if (k === 0) { g.icon('wolf', x + 82, y0 + 150, 92, PAL.coral); g.text('?', x + 162, y0 + 168, { size: 64, role: 'display', color: PAL.ink, align: 'center' }); g.icon('elk', x + 242, y0 + 148, 88, PAL.sand); g.text('Do wolves limit elk?', x + 22, y0 + 262, { size: 24, color: PAL.ink }); }
              if (k === 1) { const ax = x + 36, ay = y0 + 72, aw = 248, ah = 136; g.line(ax, ay + ah, ax + aw, ay + ah, { color: PAL.ink3, w: 1.5 }); g.line(ax, ay, ax, ay + ah, { color: PAL.ink3, w: 1.5 }); D.scat.forEach(([u, v]) => g.dot(ax + u * aw, ay + ah - v * ah, 4, PAL.ink2, 1, 2)); g.line(ax, ay + ah - 0.2 * ah, ax + aw, ay + ah - 0.8 * ah, { color: PAL.ink, w: 2.2 }); g.text('data, models, tests', x + 22, y0 + 262, { size: 24, color: PAL.ink }); }
              if (k === 2) { g.rect(x + 30, y0 + 78, 170, 132, { r: 4, stroke: PAL.violet, w: 2, dash: [7, 6] }); g.icon('conifer', x + 76, y0 + 140, 48, PAL.moss, { alpha: 0.75 }); g.icon('elk', x + 148, y0 + 150, 56, PAL.sand, { alpha: 0.85 }); person(g, x + 258, y0 + 146, 84, PAL.violet); g.text('quotas, protection', x + 22, y0 + 262, { size: 24, color: PAL.ink }); }
            });
          });
          g.arrow(430, CY + CH / 2, 538, CY + CH / 2, { color: PAL.ink3, w: 2.2, head: 13, progress: S.p(0, 0.8, 1.0) });
          g.arrow(870, CY + CH / 2, 978, CY + CH / 2, { color: PAL.ink3, w: 2.2, head: 13, progress: S.p(0, 0.8, 1.3) });
          // Values may enter at the ends.
          const drop = (tt, x0, k) => { const f = ease.inOut(lin(S, tt + k * 0.25, 0.9)); if (f <= 0) return; const y = lerp(234, CY + 30 + (k % 2) * 6, f); gem(g, x0 + k * 30, y, 11, COL, 1); if (f >= 1) g.glow(x0 + k * 30, y, 18, COL, 0.3); };
          for (let k = 0; k < 3; k++) { drop(tQ, CX[0] + CW - 110, k); drop(tU, CX[2] + CW - 110, k); }
          g.withAlpha(S.tp(tQ + 0.6, 0.6), () => tick(g, CX[0] + CW - 26, CY - 24, 22, PAL.moss));
          g.withAlpha(S.tp(tU + 0.6, 0.6), () => tick(g, CX[2] + CW - 26, CY - 24, 22, PAL.moss));
          // The glass wall around evidence, and the value it turns away.
          const wA = S.tp(tJ, 0.8);
          if (wA > 0) {
            g.rect(WX, WY, WW, WH, { r: 14, fill: 'rgba(220,227,236,0.05)', stroke: PAL.snow, w: 2, alpha: 0.75 * wA });
            for (const [u, l] of [[0.74, 0.1], [0.8, 0.06]]) g.line(WX + u * WW, WY + WH - 10, WX + (u + l) * WW, WY + WH - 10 - l * WH, { color: PAL.snow, w: 1.6, alpha: 0.22 * wA });
            const bf = lin(S, tJ + 0.3, 1.6); const by = bf < 0.45 ? lerp(234, WY - 10, ease.in(bf / 0.45)) : lerp(WY - 10, 240, ease.out((bf - 0.45) / 0.55)); const bx = lerp(705, 640, bf);
            if (bf > 0 && bf < 1) gem(g, bx, by, 11, COL, 1);
            if (bf > 0.4) cross(g, 705, WY - 30, 22, PAL.coral, { alpha: S.tp(tJ + 1.0, 0.4) });
          }
          if (crack > 0) { g.with(() => { const c = g.ctx; c.beginPath(); c.roundRect(WX, WY, WW, WH, 14); c.clip(); D.cracks.forEach((cr) => g.poly(cr.map(([u, v]) => [WX + u * WW, WY + v * WH]), { color: PAL.snow, w: 1.8, alpha: 0.85, progress: crack })); }); g.glow(WX + 0.2 * WW, WY + 0.24 * WH, 40, PAL.snow, 0.5 * (1 - crack * 0.6)); }
          // Discovery and justification.
          const bra = (x0, x1, y, lab, tt) => { const a = S.tp(tt, 0.7); g.poly([[x0, y - 10], [x0, y], [x1, y], [x1, y - 10]], { color: COL, w: 2, alpha: a }); g.text(lab, (x0 + x1) / 2, y + 44, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: a }); };
          bra(CX[0], CX[0] + CW, 650, 'context of discovery', tDi); bra(CX[1], CX[1] + CW, 650, 'context of justification', tJu);
          g.text('how hypotheses arise', CX[0] + CW / 2, 732, { size: 22, color: PAL.ink3, align: 'center', alpha: S.tp(tDi + 0.6, 0.7) });
          g.text('how they are judged', CX[1] + CW / 2, 732, { size: 22, color: PAL.ink3, align: 'center', alpha: S.tp(tJu + 0.6, 0.7) });
          g.withAlpha(S.tp(tJ + 1.2, 0.8), () => {
            const y = 838; g.text('The value-free ideal:', 705, y - 40, { size: 26, role: 'display', italic: true, color: PAL.ink2, align: 'center' });
            [['questions', 1, 400], ['judging evidence', 0, 705], ['use', 1, 1010]].forEach(([s, ok, x]) => { if (ok) tick(g, x - 70, y - 8, 20, PAL.moss); else cross(g, x - 104, y - 8, 18, PAL.coral); caps(g, s, x - (ok ? 46 : 80), y, { color: ok ? PAL.moss : PAL.coral }); });
          });
        });
        // ---- The compact pipeline that stays as a reminder (beat 1).
        const sA = S.tp(tStrip, 0.7) * (1 - S.p(2, 0.6));
        if (sA > 0) g.withAlpha(sA, () => {
          const xs = [325, 705, 1085];
          ['Question', 'Evidence', 'Use'].forEach((s, k) => g.pill(s, xs[k], 262, { size: 22, align: 'center', color: k === 1 ? PAL.ink : PAL.ink2, stroke: PAL.rule, fill: 'rgba(239,232,216,0.05)' }));
          g.arrow(400, 262, 616, 262, { color: PAL.ink3, w: 1.8, head: 11 }); g.arrow(794, 262, 1010, 262, { color: PAL.ink3, w: 1.8, head: 11 });
          g.rect(620, 234, 170, 56, { r: 10, stroke: PAL.snow, w: 1.6, alpha: 0.6 });
          g.clip(620, 234, 170, 56, () => D.cracks.forEach((c) => g.poly(c.map(([u, v]) => [620 + u * 170, 234 + v * 56]), { color: PAL.snow, w: 1.3, alpha: 0.7 })));
        });

        // ---- Beats 1–2: the evidence scale, the threshold, and the two error costs.
        const TX0 = 330, TX1 = 1090, TY = 422, PV = [710, 640], BL = 270;
        const cm = 1 + 1.0 * S.tp(tC + 0.9, 1.0) - 0.8 * S.tp(tC + 3.4, 1.0) + 0.5 * S.p(2, 1.0);
        const cf = 1 + 1.4 * S.tp(tC + 3.4, 1.0) - 1.0 * S.p(2, 1.0);
        const sw = S.tp(tC, 0.8); const th = 0.5 * (cm - cf) / (cm + cf) * sw;
        const ends = [[PV[0] - BL * Math.cos(th), PV[1] - BL * Math.sin(th), cf], [PV[0] + BL * Math.cos(th), PV[1] + BL * Math.sin(th), cm]];
        const blockH = (c) => 24 + 26 * c; const panY = (E) => E[1] + 108;
        const aA = S.tp(tEv, 0.7);
        if (aA > 0) g.withAlpha(aA, () => {
          const evP = ease.inOut(lin(S, tEv + 0.2, 2.2)); const ev = 0.68 * evP;
          const thr = 0.74 - th; const tA = S.tp(tEn, 0.7);
          caps(g, 'evidence for hypothesis H', TX0, TY - 40, { color: PAL.ink2 });
          g.rect(TX0, TY - 13, TX1 - TX0, 26, { r: 13, fill: 'rgba(239,232,216,0.05)', stroke: PAL.rule, w: 1.3 });
          g.clip(TX1 - 0.07 * (TX1 - TX0), TY - 13, 0.07 * (TX1 - TX0), 26, () => { for (let k = 0; k < 8; k++) { const x = TX1 - 60 + k * 9; g.line(x, TY + 14, x + 12, TY - 14, { color: PAL.ink3, w: 1.2, alpha: 0.6 }); } });
          g.rect(TX0, TY - 13, (TX1 - TX0) * ev, 26, { r: 13, fill: U.rgba(PAL.ink2, 0.55) });
          g.text('weak', TX0, TY + 44, { size: 21, color: PAL.ink3 });
          g.text('certain', TX1, TY + 44, { size: 21, color: PAL.ink3, align: 'right' });
          g.text('never reached', TX1 - 84, TY + 44, { size: 21, italic: true, color: PAL.ink3, align: 'right', alpha: S.tp(tEv + 1.6, 0.7) * (1 - S.p(2, 0.6)) });
          if (tA > 0) {
            const kx = TX0 + (TX1 - TX0) * thr;
            g.line(kx, TY - 30, kx, TY + 24, { color: COL, w: 3, alpha: tA }); g.circle(kx, TY - 30, 10, { fill: COL, alpha: tA });
            caps(g, 'enough?', kx, TY - 50, { color: COL, align: 'center', alpha: tA });
            const acc = U.smooth((ev - thr) / 0.03 + 0.5);
            g.pill('Accept H', TX1 + 110, TY, { size: 21, align: 'center', color: PAL.moss, stroke: PAL.moss, alpha: tA * acc });
            g.pill('Not yet', TX1 + 110, TY, { size: 21, align: 'center', color: PAL.ink2, stroke: PAL.rule, alpha: tA * (1 - acc) });
          }
          if (sw > 0) g.withAlpha(sw, () => {
            g.poly([[PV[0], PV[1]], [PV[0] - 26, PV[1] + 48], [PV[0] + 26, PV[1] + 48]], { fill: PAL.ink3, close: true, color: null, w: 0 });
            g.line(ends[0][0], ends[0][1], ends[1][0], ends[1][1], { color: PAL.ink2, w: 5 });
            ends.forEach((E) => {
              const py = panY(E); g.line(E[0], E[1], E[0] - 70, py, { color: PAL.ink3, w: 1.2 }); g.line(E[0], E[1], E[0] + 70, py, { color: PAL.ink3, w: 1.2 }); g.line(E[0] - 78, py, E[0] + 78, py, { color: PAL.ink2, w: 3 });
              const w = 50 + 34 * E[2], h = blockH(E[2]); g.rect(E[0] - w / 2, py - h - 2, w, h, { r: 5, fill: '#3B3363', stroke: COL, w: 1.8 });
            });
            caps(g, 'cost of a false alarm', PV[0] - BL, 830, { align: 'center', color: PAL.ink2 }); g.text('accepting H wrongly', PV[0] - BL, 860, { size: 21, italic: true, color: PAL.ink3, align: 'center' });
            caps(g, 'cost of a miss', PV[0] + BL, 830, { align: 'center', color: PAL.ink2 }); g.text('rejecting H wrongly', PV[0] + BL, 860, { size: 21, italic: true, color: PAL.ink3, align: 'center' });
            const ir = S.tp(tIR, 0.8) * (1 - S.p(2, 0.6));
            g.glow(PV[0], PV[1] - 30, 70, COL, 0.25 * ir); caps(g, 'inductive risk', PV[0], PV[1] - 40, { align: 'center', color: COL, alpha: ir });
            g.text('how strong is enough depends on the cost of being wrong', PV[0], 560, { size: 22, italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tC + 0.4, 0.8) * (1 - S.p(2, 0.6)) });
          });
        });

        // ---- Beat 2: two kinds of value, and where each may act.
        const b2 = S.p(2, 0.8);
        if (b2 > 0) g.withAlpha(b2, () => {
          const tEp = cue(S, 2, 'Epistemic values'), tNE = cue(S, 2, 'Non-epistemic values'), tSet = cue(S, 2, 'may legitimately set'), tNev = cue(S, 2, 'must never stand in');
          caps(g, 'epistemic values', 100, 566, { color: PAL.lagoon, alpha: S.tp(tEp, 0.7) });
          g.text('bear on truth', 100, 596, { size: 21, italic: true, color: PAL.ink2, alpha: S.tp(tEp + 0.4, 0.7) });
          [['accuracy', 646], ['simplicity', 692]].forEach(([s, y]) => { const tt = cue(S, 2, s), a = S.tp(tt, 0.6); gem(g, 112, y - 7, 10, PAL.lagoon, a); g.text(s, 132, y, { size: 22, color: PAL.ink, alpha: a }); g.line(250, y - 8, TX0 - 6, TY + 8, { color: PAL.lagoon, w: 1.3, dash: [4, 5], alpha: 0.6 * S.tp(tt + 0.4, 0.6), progress: S.tp(tt + 0.4, 0.8) }); });
          caps(g, 'non-epistemic', 1112, 566, { color: COL, alpha: S.tp(tNE, 0.7) });
          g.text('bear on consequences', 1112, 596, { size: 21, italic: true, color: PAL.ink2, alpha: S.tp(tNE + 0.4, 0.7) });
          const ne = [['safety', 'safety', 646, -1], ['livelihoods', 'livelihoods', 692, 0], ['survival of a species', 'species survival', 738, 1]];
          ne.forEach(([ph, s, y, side]) => {
            const a = S.tp(cue(S, 2, ph), 0.6); let gx = 1124, gy = y - 7;
            if (side >= 0) { const E = ends[side]; const f = ease.inOut(lin(S, tSet + 0.3 + side * 0.4, 1.2)); const ty = panY(E) - blockH(E[2]) - 14; gx = lerp(gx, E[0] + (side ? 0 : 0), f); gy = lerp(gy, ty, f) - 80 * Math.sin(Math.PI * f); }
            else { const f = lin(S, tNev + 0.2, 1.6); if (f > 0) { const hit = 0.45; const u = f < hit ? ease.in(f / hit) : 1 - ease.out((f - hit) / (1 - hit)); gx = lerp(1124, 900, u); gy = lerp(y - 7, TY + 34, u); } }
            gem(g, gx, gy, 11, COL, a); g.text(s, 1144, y, { size: 22, color: PAL.ink, alpha: a * (side >= 0 ? 1 - 0.5 * S.tp(tSet + 0.3, 0.6) : 1) });
          });
          const okA = S.tp(tSet + 1.4, 0.7);
          tick(g, PV[0] - 150, 888, 20, PAL.moss, { alpha: okA }); caps(g, 'may set the threshold', PV[0] - 126, 896, { color: PAL.moss, alpha: okA });
          const nA = S.tp(tNev + 0.85, 0.5);
          g.rect(TX0 - 8, TY - 21, TX1 - TX0 + 16, 42, { r: 21, stroke: PAL.coral, w: 2, dash: [6, 6], alpha: nA });
          cross(g, 900, TY + 34, 20, PAL.coral, { alpha: nA });
          caps(g, 'never a substitute for evidence', 924, TY + 92, { color: PAL.coral, alpha: S.tp(tNev + 1.0, 0.6) });
        });
      },
      terms: [
        { beat: 0.3, term: 'Value-free ideal', def: 'The view that non-epistemic values should play no role in the internal reasoning of science, only in choosing problems and applying results.' },
        { beat: 0.8, term: 'Discovery vs justification', def: 'Reichenbach’s distinction between how hypotheses arise and how they are evaluated against evidence.' },
        { beat: 1.6, term: 'Inductive risk', def: 'The chance of error in accepting or rejecting a hypothesis; weighing its consequences requires values (Rudner, Douglas).' },
        { beat: 2.3, term: 'Epistemic vs non-epistemic values', def: 'Values bearing on truth, such as accuracy and simplicity, versus values bearing on consequences, such as safety or livelihoods.' },
      ],
    },
    {
      id: 'values-caribou', title: 'Case file: whose costs?', register: 'claim',
      beats: [
        { t: 'Mountain caribou declined by fifty-one percent between 1991 and 2023, and fifteen of forty-one subpopulations are now functionally extirpated. Logging opened forests to moose and deer, which supported more wolves, which killed more caribou: apparent competition.',
          cite: 'Lamb et al. 2024; Serrouya et al. 2021; Wilmers et al. 2025',
          v: 'Case-file card (caribou). A cleared forest feeds moose and deer icons, which feed a larger wolf icon, which points at a shrinking caribou herd; subpopulation map greys out 15 of 41.' },
        { t: 'Recovery actions have included killing wolves. Conclude that wolves are not limiting caribou when they are, and a population disappears. Conclude that they are when they are not, and wolves die for nothing. Which error is worse is not a question the data can answer alone.',
          v: 'A two-by-two error table: decision (cull / don’t cull) by truth (limiting / not limiting); the two error cells glow with their costs.' },
        { t: 'Values also shape which impacts get counted. Where wolves recolonized Wisconsin, deer–vehicle collisions fell by about a quarter, with benefits estimated at sixty-three times the losses of livestock. Puma recovery in the eastern United States was projected to prevent one hundred fifty-five human deaths over thirty years.',
          cite: 'Raynor et al. 2021; Gilbert et al. 2017',
          v: 'A ledger with columns COSTS and BENEFITS; collisions avoided, lives, livestock losses; the bar lengths compared.' },
      ],
      init() {
        const r = U.rng(1202);
        // 41 subpopulations along a stylized mountain chain; the 15 extirpated lean to the south.
        const subs = []; for (let k = 0; k < 41; k++) { const u = k / 40; const cx = 168 + 120 * u + 46 * Math.sin(u * 5.5), cy = 566 + 292 * u; const j = (r() - 0.5) * 70; subs.push({ x: cx + j * 0.9, y: cy + (r() - 0.5) * 10, key: u + r() * 0.55 }); }
        [...subs].sort((a, b) => b.key - a.key).slice(0, 15).forEach((s, i) => { s.gone = true; s.ord = i; });
        const herd = []; for (let k = 0; k < 10; k++) herd.push({ x: 560 + (k % 5) * 52 + (r() - 0.5) * 14 - 80, y: 662 + Math.floor(k / 5) * 52 + (r() - 0.5) * 10, lose: [1, 3, 4, 6, 8].includes(k) });
        const stumps = [[-70, 20], [-30, 34], [10, 14], [50, 30], [-50, -10], [30, -12]];
        return { subs, herd, stumps };
      },
      draw(g, t, S, D) {
        const cs = ease.inOut(S.tp(S.b(1) - 0.3, 1.0));
        g.casefile(96, 226, lerp(270, 196, cs), lerp(156, 112, cs), { title: 'Whose costs? Whose baseline?', no: 'XII', sketch: 'caribou', color: COL, rot: -0.02, alpha: S.p(0, 0.9), pin: cs < 0.5 });
        // ---- Beat 0: decline, extirpation, apparent competition.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const t51 = cue(S, 0, 'declined by fifty-one'), t15 = cue(S, 0, 'fifteen of forty-one'), tLo = cue(S, 0, 'Logging opened'), tMD = cue(S, 0, 'moose and deer'), tW = cue(S, 0, 'supported more wolves'), tK = cue(S, 0, 'killed more caribou'), tAC = cue(S, 0, 'apparent competition');
          const la = S.p(0, 0.8, 0.4); const mv = ease.inOut(lin(S, tLo - 0.6, 1.2));
          caps(g, 'mountain caribou', 104, 424, { color: PAL.ink2, alpha: la });
          const d51 = ease.inOut(lin(S, t51, 1.6));
          g.text(`−${Math.round(51 * d51)}%`, 104, 494, { size: 72, role: 'display', color: PAL.sand, alpha: S.tp(t51 - 0.2, 0.6) }); g.text('1991–2023', 246, 492, { size: 22, color: PAL.ink2, alpha: S.tp(t51 + 0.4, 0.6) });
          caps(g, 'subpopulations', 104, 548, { color: PAL.ink2, alpha: la }); caps(g, 'stylized', 380, 600, { align: 'right', size: 15, alpha: la });
          D.subs.forEach((s, k) => {
            const a = lin(S, S.b(0) + 0.6 + k * 0.03, 0.4) * la; if (a <= 0) return;
            const off = s.gone ? S.tp(t15 + 0.3 + s.ord * 0.08, 0.5) : 0;
            if (off < 1) g.dot(s.x, s.y, 6.5, PAL.sand, a * (1 - off), 2.2);
            if (off > 0) g.circle(s.x, s.y, 6.5, { stroke: PAL.ink3, w: 1.6, alpha: a * off });
          });
          g.text('15 of 41 functionally extirpated', 104, 892, { size: 21, color: PAL.ink2, alpha: S.tp(t15 + 1.2, 0.7) });
          // the chain
          const A = [600, 370], B = [1090, 370], C = [1090, 700], Dd = [600, 700];
          const aF = S.tp(tLo - 0.2, 0.7);
          g.withAlpha(aF, () => {
            caps(g, 'logging', A[0], A[1] - 96, { align: 'center', color: PAL.ink2 });
            g.rect(A[0] - 110, A[1] - 60, 220, 120, { r: 6, stroke: PAL.clay, w: 1.5, dash: [7, 6], alpha: 0.7 });
            D.stumps.forEach(([dx, dy]) => { g.rect(A[0] + dx - 6, A[1] + dy - 4, 12, 12, { fill: PAL.clay, alpha: 0.85 }); g.ellipse(A[0] + dx, A[1] + dy - 4, 6, 2.6, { fill: '#F0C9A8' }); });
            [[-140, -10], [-128, 30], [136, -20], [146, 24]].forEach(([dx, dy]) => g.icon('conifer', A[0] + dx, A[1] + dy, 44, PAL.moss, { alpha: 0.8 }));
            g.icon('grass', A[0] - 8, A[1] - 26, 26, PAL.moss, { alpha: 0.7 }); g.icon('plant', A[0] + 34, A[1] - 30, 26, PAL.moss, { alpha: 0.7 });
          });
          const aB = S.tp(tMD - 0.2, 0.7);
          g.withAlpha(aB, () => { caps(g, 'more moose & deer', B[0], B[1] - 96, { align: 'center', color: PAL.ink2 }); g.icon('moose', B[0] - 50, B[1] + 6, 96, PAL.sand); g.icon('deer', B[0] + 70, B[1] + 14, 66, PAL.sand); });
          g.arrow(A[0] + 150, A[1], B[0] - 120, B[1], { color: PAL.ink2, w: 2.4, head: 14, progress: S.tp(tMD - 0.2, 0.8) });
          g.text('opens forest to', (A[0] + B[0]) / 2 + 10, A[1] - 16, { size: 21, italic: true, color: PAL.ink3, align: 'center', alpha: S.tp(tMD, 0.7) });
          const aW = S.tp(tW - 0.2, 0.7), grow = ease.outBack(lin(S, tW, 1.0));
          g.withAlpha(aW, () => { g.glow(C[0], C[1], 90, PAL.coral, 0.2 * grow); g.icon('wolf', C[0], C[1], lerp(60, 112, grow), PAL.coral); caps(g, 'more wolves', C[0], C[1] + 92, { align: 'center', color: PAL.ink2 }); });
          g.arrow(B[0], B[1] + 70, C[0], C[1] - 70, { color: PAL.ink2, w: 2.4, head: 14, progress: S.tp(tW - 0.2, 0.8) });
          g.text('supports', B[0] + 18, (B[1] + C[1]) / 2 + 6, { size: 21, italic: true, color: PAL.ink3, alpha: S.tp(tW, 0.7) });
          g.arrow(C[0] - 90, C[1], Dd[0] + 170, Dd[1], { color: PAL.coral, w: 3.2, head: 16, progress: S.tp(tK - 0.2, 0.8) });
          g.text('kill', (C[0] + Dd[0]) / 2 + 40, C[1] - 18, { size: 21, italic: true, color: PAL.coral, align: 'center', alpha: S.tp(tK, 0.7) });
          // the caribou herd, shrinking by half
          const ha = S.p(0, 0.8, 0.6);
          caps(g, 'fewer caribou', Dd[0], Dd[1] + 92, { align: 'center', color: PAL.ink2, alpha: ha * mv }); caps(g, 'mountain caribou herd', 850, 740, { align: 'center', color: PAL.ink2, alpha: ha * (1 - mv) }); caps(g, 'stylized', 850, 768, { align: 'center', size: 15, alpha: ha * (1 - mv) });
          const hc = [lerp(850, 585, mv), lerp(590, 688, mv)], hs = lerp(1.9, 1, mv);
          D.herd.forEach((h, k) => { const lose = h.lose ? S.tp(t51 + 0.4 + k * 0.1, 0.8) : 0; g.icon('caribou', hc[0] + (h.x - 585) * hs, hc[1] + (h.y - 688) * hs, 46 * hs, PAL.sand, { alpha: ha * (1 - 0.85 * lose) }); });
          g.text('apparent competition', 845, 548, { size: 42, role: 'display', italic: true, color: COL, align: 'center', alpha: S.tp(tAC, 0.9) });
        });

        // ---- Beat 1: two ways to be wrong.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tA = cue(S, 1, 'Conclude that wolves are not'), tB = cue(S, 1, 'Conclude that they are'), tWo = cue(S, 1, 'Which error is worse');
          g.text('Cull wolves to save caribou?', 330, 300, { size: 42, role: 'display', italic: true, color: PAL.ink, alpha: S.p(1, 0.8, 0.2) });
          const X0 = 440, Y0 = 410, CWd = 420, CHt = 200, GAP = 12; const cx = (j) => X0 + j * (CWd + GAP), cy = (i) => Y0 + i * (CHt + GAP);
          const ta = S.p(1, 0.8, 1.0);
          g.withAlpha(ta, () => {
            caps(g, 'what is true', X0 + CWd + GAP / 2, 360, { align: 'center' });
            g.text('wolves ARE limiting', cx(0) + CWd / 2, 394, { size: 23, color: PAL.ink, align: 'center' });
            g.text('wolves are NOT limiting', cx(1) + CWd / 2, 394, { size: 23, color: PAL.ink, align: 'center' });
            caps(g, 'what we conclude', 110, 384);
            g.wrap('Conclude limiting: cull', 110, cy(0) + 92, 300, { size: 27, role: 'display', color: PAL.ink, lh: 1.15 });
            g.wrap('Conclude not limiting: no cull', 110, cy(1) + 92, 300, { size: 27, role: 'display', color: PAL.ink, lh: 1.15 });
          });
          const cell = (i, j, err) => { const x = cx(j), y = cy(i); g.rect(x, y, CWd, CHt, { r: 8, fill: err ? 'rgba(232,115,90,0.06)' : 'rgba(239,232,216,0.035)', stroke: PAL.rule, w: 1.2, alpha: ta }); };
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cell(i, j, i !== j);
          // correct cells
          [[0, 0], [1, 1]].forEach(([i, j], k) => { const a = S.p(1, 0.6, 1.6 + k * 0.3); tick(g, cx(j) + 54, cy(i) + 100, 32, PAL.moss, { alpha: a }); g.text('correct', cx(j) + 92, cy(i) + 110, { size: 24, color: PAL.ink2, alpha: a }); });
          // the miss: a population disappears
          const mA = S.tp(tA, 0.7), mG = S.tp(tA + 1.2, 1.0);
          if (mA > 0) { const x = cx(0), y = cy(1); g.rect(x, y, CWd, CHt, { r: 8, stroke: PAL.sand, w: 2.4, fill: U.rgba(PAL.sand, 0.08), alpha: mA }); g.glow(x + CWd / 2, y + CHt / 2, 190, PAL.sand, 0.18 * mA);
            for (let k = 0; k < 5; k++) g.icon('caribou', x + 70 + k * 64, y + 104, 50, PAL.sand, { alpha: mA * (1 - mG * clamp(1.6 - k * 0.25)) });
            g.text('a population disappears', x + 26, y + 170, { size: 24, color: PAL.ink, alpha: S.tp(tA + 1.5, 0.6) }); caps(g, 'type II · miss', x + 26, y + 36, { color: PAL.sand, alpha: mA }); }
          // the false alarm: wolves die for nothing
          const fA = S.tp(tB, 0.7), fG = S.tp(tB + 1.2, 1.0);
          if (fA > 0) { const x = cx(1), y = cy(0); g.rect(x, y, CWd, CHt, { r: 8, stroke: PAL.coral, w: 2.4, fill: U.rgba(PAL.coral, 0.08), alpha: fA }); g.glow(x + CWd / 2, y + CHt / 2, 190, PAL.coral, 0.18 * fA);
            for (let k = 0; k < 4; k++) { g.icon('wolf', x + 80 + k * 84, y + 104, 56, PAL.coral, { alpha: fA * (1 - 0.75 * fG) }); }
            g.text('wolves die for nothing', x + CWd - 26, y + 170, { size: 24, color: PAL.ink, align: 'right', alpha: S.tp(tB + 1.5, 0.6) }); caps(g, 'type I · false alarm', x + CWd - 26, y + 36, { align: 'right', color: PAL.coral, alpha: fA }); }
          // which is worse?
          const wA = S.tp(tWo, 0.7);
          if (wA > 0) { const jx = cx(1) - GAP / 2, jy = cy(1) - GAP / 2; const p1 = [jx - 56, jy + 56], p2 = [jx + 56, jy - 56]; g.arrow(p1[0], p1[1], p2[0], p2[1], { color: COL, w: 2.6, head: 14, both: true, alpha: wA, progress: S.tp(tWo, 0.8) }); g.pill('values', (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, { size: 22, align: 'center', color: COL, stroke: COL, fill: 'rgba(14,13,26,0.92)', alpha: S.tp(tWo + 0.6, 0.6) });
            g.text('Which error is worse? The data alone cannot say.', X0 + CWd + GAP / 2, 878, { size: 30, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tWo + 0.8, 0.8) }); }
        });

        // ---- Beat 2: which impacts get counted.
        const a2 = S.p(2, 0.8);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tWi = cue(S, 2, 'Where wolves recolonized'), tCo = cue(S, 2, 'collisions fell'), t63 = cue(S, 2, 'sixty-three times'), tPu = cue(S, 2, 'Puma recovery'), t155 = cue(S, 2, 'one hundred fifty-five');
          g.text('Which impacts get counted?', 330, 300, { size: 42, role: 'display', italic: true, color: PAL.ink, alpha: S.p(2, 0.8, 0.2) });
          const SP = 520; const ha = S.p(2, 0.8, 0.8);
          caps(g, 'costs', SP - 24, 384, { align: 'right', color: PAL.coral, alpha: ha }); caps(g, 'benefits', SP + 24, 384, { color: PAL.moss, alpha: ha });
          g.line(110, 400, 1300, 400, { color: PAL.rule, w: 1.2, alpha: ha }); g.line(SP, 400, SP, 900, { color: PAL.ink3, w: 1.5, alpha: ha });
          // Wisconsin: collisions
          const wa = S.tp(tWi, 0.7); caps(g, 'Wisconsin · wolves return', 110, 446, { color: PAL.ink2, alpha: S.p(2, 0.7, 1.2) });
          g.withAlpha(wa, () => {
            
            g.icon('deer', 300, 490, 44, PAL.sand); g.icon('wolf', 380, 494, 44, PAL.coral);
            const L = 640, f = ease.inOut(lin(S, tCo + 0.3, 1.4));
            g.rect(SP + 20, 470, L, 36, { r: 5, stroke: PAL.ink3, w: 1.3 });
            g.rect(SP + 20, 470, L * (1 - 0.24 * f), 36, { r: 5, fill: U.rgba(PAL.ink2, 0.3) });
            g.rect(SP + 20 + L * 0.76, 470, L * 0.24 * f, 36, { r: 5, fill: U.rgba(PAL.moss, 0.7) });
            g.text('deer–vehicle collisions', SP + 34, 495, { size: 21, color: PAL.ink });
            g.text('−24%', SP + 20 + L + 16, 498, { size: 30, role: 'display', color: PAL.moss, alpha: S.tp(tCo + 1.2, 0.6) });
          });
          // Wisconsin: benefits vs livestock losses
          const ba = S.tp(t63 - 0.6, 0.7);
          g.withAlpha(ba, () => {
            const u = 12, f = ease.inOut(lin(S, t63, 2.0));
            g.rect(SP - u, 560, u, 40, { r: 2, fill: PAL.coral });
            g.text('livestock losses', SP - u - 14, 588, { size: 21, color: PAL.coral, align: 'right' });
            g.rect(SP, 560, 63 * u * f, 40, { r: 3, fill: U.rgba(PAL.moss, 0.75) });
            g.text('benefits of fewer collisions', SP + 14, 587, { size: 21, color: '#14121F', weight: 600, alpha: S.tp(t63 + 0.4, 0.6) });
            g.text(`≈ ${Math.max(1, Math.round(63 * f))}×`, SP + 63 * u - 12, 588, { size: 26, weight: 600, color: '#14121F', align: 'right', alpha: S.tp(t63 + 1.2, 0.6) });
          });
          // Eastern US pumas: deaths prevented (projected)
          const pa = S.tp(tPu, 0.7); caps(g, 'Eastern U.S. · puma recovery', 110, 686, { color: PAL.ink2, alpha: S.p(2, 0.7, 1.5) });
          g.withAlpha(pa, () => {
            g.line(110, 640, 1300, 640, { color: PAL.rule, w: 1 });
            caps(g, 'projected', 110, 714, { size: 15 });
            g.icon('puma', 360, 770, 92, PAL.coral);
            const n = Math.round(155 * ease.inOut(lin(S, t155 - 0.2, 2.0)));
            for (let k = 0; k < n; k++) { const col = Math.floor(k / 5), row = k % 5; g.circle(SP + 30 + col * 24, 690 + row * 24, 7.5, { fill: PAL.moss, alpha: 0.85 }); }
            g.text(String(n), SP + 30, 860, { size: 44, role: 'display', color: PAL.moss, alpha: S.tp(t155 - 0.2, 0.6) });
            g.text('human deaths prevented over 30 years', SP + 112, 856, { size: 23, color: PAL.ink, alpha: S.tp(t155 + 0.6, 0.6) });
          });
        });
      },
      terms: [
        { beat: 1.6, term: 'Type I and Type II errors', def: 'Rejecting a true null (a false alarm) versus failing to reject a false one (a miss); in management, each carries different costs.' },
      ],
    },
    {
      id: 'values-baseline', title: 'Whose baseline?', register: 'claim',
      beats: [
        { t: 'What counts as recovery? Much of the disagreement over Yellowstone’s willow and aspen, Wilmers and colleagues conclude, stems from definitions and from uncertain baselines. Should recovery be measured against the landscape before European colonization, already shaped by Indigenous peoples, or against a landscape without people at all?',
          cite: 'Wilmers et al. 2025',
          v: 'Three baseline lines across a vegetation time series: TODAY, PRE-EUROPEAN (with Indigenous fire and hunting marks), and an imagined NO PEOPLE line.' },
        { t: 'Michael Soulé called conservation biology a crisis discipline: it must act before the evidence is complete, and its goals, such as keeping species and processes, are values. Deciding how many carnivores a landscape should hold is an ecological question and a political one.',
          s: 'Michael Soo-lay called conservation biology a crisis discipline: it must act before the evidence is complete, and its goals, such as keeping species and processes, are values. Deciding how many carnivores a landscape should hold is an ecological question and a political one.',
          cite: 'Soulé 1985',
          v: 'Social and ecological carrying-capacity lines return from Chapter II; the gap between them is labelled “politics”.' },
      ],
      draw(g, t, S) {
        // ---- Beat 0: a vegetation series and three candidate baselines.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tDef = cue(S, 0, 'stems from definitions'), tUn = cue(S, 0, 'uncertain baselines'), tPE = cue(S, 0, 'before European colonization'), tIn = cue(S, 0, 'already shaped by Indigenous'), tNP = cue(S, 0, 'without people at all');
          const A = g.axes({ x: 210, y: 300, w: 930, h: 470, xmin: 0, xmax: 1, ymin: 0, ymax: 1, progress: S.p(0, 1.0, 0.2) });
          caps(g, 'stylized', A.X(1), 290, { align: 'right', size: 15, alpha: S.p(0, 0.8, 0.6) });
          // the y-axis label cycles through definitions of "recovery"
          const defs = ['willow & aspen height', 'canopy cover', 'saplings escaping browse']; const dk = S.t < tDef ? 0 : Math.floor((S.t - tDef) / 1.3) % 3; const dA = S.t < tDef ? 1 : 0.6 + 0.4 * Math.cos(((S.t - tDef) / 1.3 % 1) * Math.PI * 2);
          g.with(() => { g.ctx.translate(176, 535); g.ctx.rotate(-Math.PI / 2); g.text(defs[dk], 0, 0, { size: 22, color: S.t > tDef ? COL : PAL.ink2, align: 'center', alpha: S.p(0, 0.8, 0.6) * (S.t > tDef + 6 ? 1 : dA) }); });
          if (S.t > tDef) caps(g, 'which measure?', 176, 278, { color: COL, align: 'center', alpha: S.tp(tDef, 0.6) * (1 - S.tp(tPE, 0.6)) });
          const xr = 0.36, xw = 0.56, xb = 0.84;
          const base = (x) => x < xr ? 0.66 : x < xw ? 0.66 - 0.06 * ease.inOut((x - xr) / (xw - xr)) : x < xb ? 0.6 - 0.36 * ease.inOut((x - xw) / (xb - xw)) : 0.24 + 0.09 * ease.out((x - xb) / (1 - xb));
          const V = (x) => base(x) + lerp(1, 0.35, x) * (0.03 * Math.sin(x * 46) + 0.012 * Math.sin(x * 17));
          // eras
          const ea = S.p(0, 0.8, 1.0);
          g.rect(A.X(0), A.Y(1), A.X(xr) - A.X(0), A.h, { fill: U.rgba(PAL.violet, 0.07), alpha: ea });
          g.text('before colonization', (A.X(0) + A.X(xr)) / 2, A.Y(0) + 34, { size: 21, color: PAL.ink3, align: 'center', alpha: ea });
          for (const [x, lab] of [[xw, 'wolves removed'], [xb, 'wolves return']]) { g.line(A.X(x), A.Y(0), A.X(x), A.Y(0.98), { color: PAL.coral, w: 1.4, dash: [5, 6], alpha: 0.7 * ea }); g.text(lab, A.X(x), A.Y(0) + 34, { size: 21, color: PAL.coral, align: 'center', alpha: ea }); }
          g.text('today', A.X(1), A.Y(0) + 34, { size: 21, color: PAL.ink3, align: 'right', alpha: ea });
          const tip = g.plot(A, V, { color: PAL.moss, w: 4, progress: ease.inOut(lin(S, S.b(0) + 0.6, 3.2)) });
          if (tip && S.t > S.b(0) + 3.8) g.dot(tip[0], tip[1], 7, PAL.moss, 1, 3);
          // uncertain baselines: faint candidates
          const ua = S.tp(tUn, 0.8) * (1 - S.tp(tPE, 0.8));
          [0.45, 0.58, 0.72, 0.84].forEach((v, k) => g.line(A.X(0), A.Y(v), A.X(1), A.Y(v), { color: PAL.ink3, w: 1.2, dash: [3, 9], alpha: ua * 0.7, progress: lin(S, tUn + k * 0.2, 0.9) }));
          g.text('?', A.X(1) + 26, A.Y(0.66) + 18, { size: 54, role: 'display', color: PAL.ink3, alpha: ua });
          // TODAY
          const todayA = S.tp(tUn - 0.4, 0.7); const vT = V(1);
          g.line(A.X(0), A.Y(vT), A.X(1), A.Y(vT), { color: PAL.ink, w: 2, dash: [10, 7], alpha: 0.8 * todayA, progress: S.tp(tUn - 0.4, 1.2) });
          caps(g, 'today', A.X(0.02), A.Y(vT) - 12, { color: PAL.ink, alpha: todayA });
          // PRE-EUROPEAN, already shaped by Indigenous peoples
          const pa = S.tp(tPE + 0.4, 0.8);
          g.line(A.X(0), A.Y(0.66), A.X(1), A.Y(0.66), { color: PAL.violet, w: 2.6, dash: [12, 7], alpha: pa, progress: S.tp(tPE + 0.4, 1.4) });
          caps(g, 'pre-European', A.X(0.98), A.Y(0.66) - 14, { align: 'right', color: PAL.violet, alpha: pa });
          const ia = S.tp(tIn, 0.6);
          for (let k = 0; k < 7; k++) { const x = A.X(0.03 + k * 0.046), a = ia * lin(S, tIn + k * 0.12, 0.4); if (k % 2) dart(g, x, A.Y(0.12), 12, PAL.violet, a); else flame(g, x, A.Y(0.12), 14, PAL.ochre, a); }
          g.text('Indigenous fire and hunting', (A.X(0) + A.X(xr)) / 2, A.Y(0.2) - 6, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tIn + 0.8, 0.6) });
          // NO PEOPLE: imagined, uncertain
          const na = S.tp(tNP, 0.8);
          g.rect(A.X(0), A.Y(0.58), A.w, A.Y(0.38) - A.Y(0.58), { fill: U.rgba(PAL.snow, 0.06), alpha: na });
          g.line(A.X(0), A.Y(0.48), A.X(1), A.Y(0.48), { color: PAL.snow, w: 2, dash: [2, 7], alpha: na, progress: S.tp(tNP, 1.4) });
          caps(g, 'no people · imagined', A.X(0.98), A.Y(0.48) - 14, { align: 'right', color: PAL.snow, alpha: na });
          // how far from "recovered" depends on the baseline
                    const g1 = S.tp(tPE + 1.2, 0.9), g2 = S.tp(tNP + 0.6, 0.9); const x1 = A.X(1) + 34, x2 = A.X(1) + 78;
          g.arrow(x1, A.Y(vT), x1, A.Y(0.66), { color: PAL.violet, w: 2.4, head: 12, alpha: g1, progress: g1 }); g.arrow(x2, A.Y(vT), x2, A.Y(0.48), { color: PAL.snow, w: 2.4, head: 12, alpha: g2, progress: g2 });
          g.text('how far', (x1 + x2) / 2, A.Y(vT) + 36, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: g1 }); g.text('to go?', (x1 + x2) / 2, A.Y(vT) + 62, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: g1 });
        });

        // ---- Beat 1: a crisis discipline, and how many carnivores a landscape should hold.
        const a1 = S.p(1, 0.8);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tAct = cue(S, 1, 'act before the evidence'), tGo = cue(S, 1, 'its goals'), tDe = cue(S, 1, 'Deciding how many'), tEc = cue(S, 1, 'ecological question'), tPo = cue(S, 1, 'political one');
          const sw = ease.inOut(S.tp(tDe - 0.4, 1.2));
          // crisis panel (wide, then shrinks left)
          const cA = 1 - 0.0 * sw; const px = 210, pw = lerp(980, 420, sw), py = lerp(310, 330, sw), ph = lerp(440, 380, sw);
          g.withAlpha(cA, () => {
            caps(g, 'a crisis discipline', 110, 262, { color: PAL.ink2 });
            const A = g.axes({ x: px, y: py, w: pw, h: ph, xmin: 0, xmax: 1, ymin: 0, ymax: 1.08, progress: S.p(1, 1.0, 0.2), xlab: 'time', labSize: 22 });
            const ev = (x) => 0.04 + 0.92 / (1 + Math.exp(-9 * (x - 0.62))); const pop = (x) => 0.88 - 0.62 * ease.inOut(clamp(x / 0.9));
            const pr = ease.inOut(lin(S, S.b(1) + 0.6, 3.0));
            g.line(A.X(0), A.Y(1), A.X(1), A.Y(1), { color: PAL.ink3, w: 1.2, dash: [5, 6], alpha: S.p(1, 0.8, 0.6) });
            g.text('evidence complete', A.X(1), A.Y(1) - 10, { size: 21, color: PAL.ink3, align: 'right', alpha: S.p(1, 0.8, 0.6) * (1 - sw) });
            g.plot(A, pop, { color: PAL.sand, w: 3.5, progress: pr }); g.plot(A, ev, { color: PAL.ink2, w: 3, progress: pr, dash: [1, 0] });
            g.text('a species declining', A.X(0.03), A.Y(pop(0.03)) - 14, { size: 21, color: PAL.sand, alpha: S.p(1, 0.8, 1.6) * (1 - sw) });
            g.text('evidence accumulating', A.X(0.98), A.Y(ev(0.98)) + 32, { size: 21, color: PAL.ink2, align: 'right', alpha: S.p(1, 0.8, 2.4) * (1 - sw) });
            const xa = 0.42, aa = S.tp(tAct, 0.7);
            g.line(A.X(xa), A.Y(0), A.X(xa), A.Y(1.04), { color: COL, w: 2.6, alpha: aa, progress: aa });
            g.pill('act now', A.X(xa), A.Y(1.04) - 4, { size: 21, align: 'center', color: COL, stroke: COL, fill: 'rgba(14,13,26,0.9)', alpha: aa });
            g.withAlpha(sw, () => { g.line(A.x, 770, A.x + 30, 770, { color: PAL.sand, w: 3.5 }); g.text('species', A.x + 40, 777, { size: 21, color: PAL.sand }); g.line(A.x + 160, 770, A.x + 190, 770, { color: PAL.ink2, w: 3 }); g.text('evidence', A.x + 200, 777, { size: 21, color: PAL.ink2 }); });
            g.dot(A.X(xa), A.Y(ev(xa)), 6, PAL.ink2, aa, 2.4); g.text('evidence incomplete', A.X(xa) + 14, A.Y(ev(xa)) + 26, { size: 21, italic: true, color: PAL.ink2, alpha: S.tp(tAct + 0.8, 0.6) * (1 - sw) });
            // goals are values
            const ga = S.tp(tGo, 0.7);
            g.withAlpha(ga, () => {
              const gx = lerp(820, 140, sw), gy = lerp(380, 832, sw);
              caps(g, 'its goals are values', gx, gy, { color: COL });
              [['keep species', 0], ['keep processes', 1]].forEach(([s, k]) => { const x = gx + (sw > 0.5 ? k * 210 : 0), y = gy + (sw > 0.5 ? 44 : 44 + k * 50); gem(g, x + 10, y - 7, 10, COL, S.tp(tGo + 0.4 + k * 0.4, 0.5)); g.text(s, x + 30, y, { size: 22, color: PAL.ink, alpha: S.tp(tGo + 0.4 + k * 0.4, 0.5) }); });
            });
          });
          // How many carnivores? Ecological and social carrying capacity.
          if (sw > 0) g.withAlpha(sw, () => {
            caps(g, 'how many carnivores?', 720, 262, { color: PAL.ink2 });
            const B = g.axes({ x: 740, y: 330, w: 520, h: 380, xmin: 0, xmax: 1, ymin: 0, ymax: 1.1, xlab: 'time', ylab: 'wolves', labSize: 22, progress: S.tp(tDe, 1.0) });
            const kE = 0.88, kS = 0.5; const ea = S.tp(tEc, 0.7), sa = S.tp(tPo, 0.7);
            const wolves = (x) => { const lg = kE / (1 + Math.exp(-11 * (x - 0.3))); return lerp(lg, Math.min(lg, kS + 0.015 * Math.sin(x * 30)), sa); };
            const tip = g.plot(B, wolves, { color: PAL.coral, w: 3.5, progress: ease.inOut(lin(S, tDe, 2.0)) });
            if (tip) g.icon('wolf', tip[0] - 4, tip[1] - 26, 40, PAL.coral, { alpha: S.tp(tDe + 1.6, 0.5) });
            g.line(B.X(0), B.Y(kE), B.X(1), B.Y(kE), { color: PAL.moss, w: 2.4, dash: [10, 7], alpha: ea, progress: ea });
            g.text('ecological carrying capacity', B.X(1), B.Y(kE) - 12, { size: 21, color: PAL.moss, align: 'right', alpha: ea });
            g.line(B.X(0), B.Y(kS), B.X(1), B.Y(kS), { color: PAL.violet, w: 2.4, dash: [10, 7], alpha: sa, progress: sa });
            g.text('social carrying capacity', B.X(1), B.Y(kS) + 30, { size: 21, color: PAL.violet, align: 'right', alpha: sa });
            const pa = S.tp(tPo + 0.6, 0.8);
            g.rect(B.X(0.5), B.Y(kE) + 4, B.X(1) - B.X(0.5), B.Y(kS) - B.Y(kE) - 8, { fill: U.rgba(COL, 0.14), alpha: pa });
            g.arrow(B.X(0.62), B.Y(kE) + 6, B.X(0.62), B.Y(kS) - 6, { color: COL, w: 2, head: 11, both: true, alpha: pa });
            g.text('politics', B.X(0.66), (B.Y(kE) + B.Y(kS)) / 2 + 14, { size: 44, role: 'display', italic: true, color: COL, alpha: pa });
          });
        });
      },
      terms: [
        { beat: 0.6, term: 'Ecological baseline', def: 'The reference condition against which change or recovery is measured; choosing one is partly a value judgment.' },
        { beat: 1.2, term: 'Crisis discipline', def: 'Soulé’s description of conservation biology: a value-driven science that must act before evidence is complete.' },
      ],
    },
    {
      id: 'values-social', title: 'Objectivity as a social achievement', register: 'claim',
      beats: [
        { t: 'If individual scientists carry values, where does objectivity come from? Robert Merton described the norms of science: communalism, universalism, disinterestedness, and organized skepticism. Helen Longino located objectivity in communities that expose claims to criticism and respond to it.',
          cite: 'Merton 1942; Longino 1990',
          v: 'A network of reviewers around a claim; criticism flows in, revisions flow out; Merton’s four norms as small plaques.' },
        { t: 'Sandra Harding argued for strong objectivity: starting research from the standpoints of marginalized groups reveals assumptions a dominant view cannot see. Heather Douglas notes that objectivity is not one thing but several, from fair procedures to reliable results.',
          cite: 'Harding 1991; Douglas 2004',
          v: 'The network gains new nodes at its edge; previously invisible assumptions light up.' },
        { t: 'The Yellowstone debate shows criticism at work. Comments and replies sharpened sampling designs, separated fear from density, and produced shared standards for demonstrating a cascade.',
          cite: 'Ford & Goheen 2015; Wilmers et al. 2025',
          v: 'Timeline of the debate as call-and-response arcs between papers, converging on a shared standards card.' },
        { t: 'The two traditions differ here too. Postpositivism aims at value neutrality while studying how values intrude. Interpretivism makes values explicit through reflexivity, treating the researcher’s commitments as part of the evidence.',
          v: 'Two lenses over the review network, each revealing a different layer.' },
      ],
      init() {
        const NC = [830, 560]; const nodes = [];
        for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k + 0.5) / 9 * Math.PI * 2; nodes.push({ x: NC[0] + Math.cos(a) * 330, y: NC[1] + Math.sin(a) * 240, ph: k * 0.37 }); }
        const edge = [[200, 'whose baseline?', 690, 440], [340, 'whose costs?', 970, 440], [160, 'whose land?', 660, 680], [20, 'whose knowledge?', 1000, 680]].map(([deg, lab, tx, ty]) => { const a = deg * Math.PI / 180; return { x: NC[0] + Math.cos(a) * 430, y: NC[1] + Math.sin(a) * 300, lab, tx, ty }; });
        const papers = [150, 245, 330, 430, 520, 615, 705, 800, 900];
        const arcs = [[1, 0], [2, 1], [3, 0], [4, 3], [5, 2], [6, 5], [7, 3], [8, 7]];
        const commits = ['funding', 'training', 'place', 'aims', 'training', 'funding', 'place', 'aims', 'aims'];
        return { NC, nodes, edge, papers, arcs, commits };
      },
      draw(g, t, S, D) {
        const NC = D.NC;
        const tCr = cue(S, 0, 'expose claims to criticism'), tRe = cue(S, 0, 'respond to it'), tLo = cue(S, 0, 'Helen Longino');
        const tHa = cue(S, 1, 'standpoints of marginalized'), tRv = cue(S, 1, 'reveals assumptions'), tDo = cue(S, 1, 'Heather Douglas');
        // Network, shown in beats 0–1 and again (under the lenses) in beat 3.
        const netA = vis(S, 0, 2) + S.p(3, 0.8);
        const drawNet = (mode, a) => {
          if (a <= 0) return;
          g.withAlpha(a, () => {
            D.nodes.forEach((n, k) => {
              const na = S.at(3) ? 1 : S.p(0, 0.6, 0.2 + k * 0.12);
              g.line(n.x, n.y, NC[0], NC[1], { color: PAL.rule, w: 1.3, alpha: na });
              // criticism in, revisions out
              if (mode !== 'pos' && mode !== 'int') {
                const ci = S.tp(tCr, 0.8), ro = S.tp(tRe, 0.8);
                for (let j = 0; j < 2; j++) {
                  if (ci > 0) { const f = (t * 0.45 + j / 2 + n.ph) % 1; g.dot(lerp(n.x, NC[0], f), lerp(n.y, NC[1], f), 3.6, PAL.ochre, ci * (1 - f * 0.3), 2.2); }
                  if (ro > 0) { const f = (t * 0.45 + j / 2 + n.ph + 0.25) % 1; g.dot(lerp(NC[0], n.x, f), lerp(NC[1], n.y, f), 3.6, COL, ro * (1 - f * 0.3), 2.2); }
                }
              }
              const col = mode === 'pos' ? PAL.ink2 : PAL.violet;
              person(g, n.x, n.y, 44, col, na);
              const va = mode === 'pos' ? 0.35 : S.at(3) ? 1 : S.p(0, 0.6, 0.6 + k * 0.12);
              gem(g, n.x + 20, n.y - 22, 7, COL, va * na);
              if (mode === 'int') { if (n.x > NC[0] + 100) g.text(D.commits[k], n.x - 28, n.y - 30, { size: 21, italic: true, color: COL, align: 'right' }); else g.text(D.commits[k], n.x + 32, n.y - 14, { size: 21, italic: true, color: COL }); }
              if (mode === 'pos') { g.line(n.x + 20, n.y - 22, lerp(n.x, NC[0], 0.45), lerp(n.y, NC[1], 0.45), { color: PAL.lagoon, w: 1.6, dash: [3, 5] }); g.circle(lerp(n.x, NC[0], 0.45), lerp(n.y, NC[1], 0.45), 7, { stroke: PAL.lagoon, w: 1.6 }); }
            });
            // the claim
            const ver = S.at(3) ? 3 : 1 + Math.min(2, Math.floor(Math.max(0, S.t - tRe - 0.8) / 2.2));
            g.rect(NC[0] - 130, NC[1] - 52, 260, 104, { r: 8, fill: '#1A1730', stroke: COL, w: 2 });
            if (S.tp(tRe, 0.8) > 0 && !S.at(2)) g.glow(NC[0], NC[1], 120, COL, 0.12 + 0.08 * Math.sin(t * 2));
            caps(g, 'claim', NC[0] - 110, NC[1] - 18, { color: COL });
            g.text('v' + ver, NC[0] + 110, NC[1] - 18, { size: 21, role: 'mono', color: PAL.ink3, align: 'right' });
            g.text('Wolves → taller aspen', NC[0], NC[1] + 30, { size: 28, role: 'display', color: PAL.ink, align: 'center' });
          });
        };
        if (!S.at(3)) drawNet('base', clamp(netA));
        // Merton's norms.
        const plA = vis(S, 0, 2);
        if (plA > 0) g.withAlpha(plA, () => {
          caps(g, 'Merton’s norms', 100, 262, { color: PAL.ink2, alpha: S.tp(cue(S, 0, 'Robert Merton'), 0.7) });
          ['communalism', 'universalism', 'disinterestedness', 'organized skepticism'].forEach((w, k) => {
            const a = S.tp(cue(S, 0, w), 0.6); const y = 284 + k * 84;
            g.rect(100 + (1 - a) * -16, y, 266, 68, { r: 6, fill: U.rgba(COL, 0.08), stroke: U.rgba(COL, 0.55), w: 1.4, alpha: a });
            g.text(w.charAt(0).toUpperCase() + w.slice(1), 120 + (1 - a) * -16, y + 44, { size: 27, role: 'display', color: PAL.ink, alpha: a });
          });
          caps(g, 'Longino: criticism and response', 100, 652, { color: PAL.ink2, alpha: S.tp(tLo, 0.7) * (1 - S.p(1, 0.6)) });
          g.withAlpha(S.tp(tCr, 0.7) * (1 - S.p(1, 0.6)), () => { g.dot(112, 690, 5, PAL.ochre, 1, 2.2); g.text('criticism flows in', 130, 697, { size: 22, color: PAL.ink2 }); });
          g.withAlpha(S.tp(tRe, 0.7) * (1 - S.p(1, 0.6)), () => { g.dot(112, 730, 5, COL, 1, 2.2); g.text('revisions flow out', 130, 737, { size: 22, color: PAL.ink2 }); });
        });
        // ---- Beat 1: new standpoints at the edge light up hidden assumptions; objectivity in several senses.
        const b1 = vis(S, 1, 2);
        if (b1 > 0) g.withAlpha(b1, () => {
          D.edge.forEach((e, k) => {
            const na = S.tp(tHa + k * 0.3, 0.7); const la = S.tp(tRv + 0.2 + k * 0.35, 0.6);
            const ta = 0.14 + 0.86 * la;
            const hw = g.measure(e.lab, { size: 22, italic: true }) / 2 + 14;
            g.rect(e.tx - hw, e.ty - 22, 2 * hw, 40, { r: 6, fill: 'rgba(14,13,26,0.92)', stroke: la > 0 ? PAL.ochre : PAL.ink3, w: 1.4, dash: la > 0.5 ? undefined : [4, 5], alpha: ta * S.p(1, 0.6) });
            g.text(e.lab, e.tx, e.ty + 7, { size: 22, italic: true, color: la > 0.5 ? PAL.ink : PAL.ink3, align: 'center', alpha: ta * S.p(1, 0.6) });
            if (na > 0) { g.glow(e.x, e.y, 46, PAL.ochre, 0.3 * na); person(g, e.x, e.y, 46, PAL.violet, na); g.circle(e.x, e.y - 4, 30, { stroke: PAL.ochre, w: 2, alpha: na }); }
            g.line(e.x, e.y, e.tx + (e.x < e.tx ? -hw : hw), e.ty, { color: PAL.ochre, w: 2, alpha: 0.8 * la, progress: la });
            if (la > 0) g.glow(e.tx, e.ty, 70, PAL.ochre, 0.22 * la);
          });
          caps(g, 'new standpoints', 1270, 862, { align: 'right', color: PAL.ochre, alpha: S.tp(tHa + 0.6, 0.6) });
          const da = S.tp(tDo, 0.7);
          g.withAlpha(da, () => {
            caps(g, 'kinds of objectivity', 100, 652, { color: PAL.ink2 });
            g.pill('fair procedures', 100, 700, { size: 22, color: PAL.ink, stroke: PAL.rule, alpha: S.tp(cue(S, 1, 'fair procedures'), 0.6) });
            g.line(122, 724, 122, 816, { color: PAL.ink3, w: 1.5, dash: [3, 6], alpha: S.tp(cue(S, 1, 'fair procedures') + 0.3, 0.6) });
            g.circle(122, 755, 4, { fill: PAL.ink3, alpha: S.tp(cue(S, 1, 'fair procedures') + 0.3, 0.6) }); g.circle(122, 785, 4, { fill: PAL.ink3, alpha: S.tp(cue(S, 1, 'fair procedures') + 0.3, 0.6) });
            g.pill('reliable results', 100, 840, { size: 22, color: PAL.ink, stroke: PAL.rule, alpha: S.tp(cue(S, 1, 'reliable results'), 0.6) });
          });
        });
        // ---- Beat 2: the Yellowstone debate as call and response.
        const b2 = vis(S, 2, 3);
        if (b2 > 0) g.withAlpha(b2, () => {
          const tSa = cue(S, 2, 'sharpened sampling'), tFe = cue(S, 2, 'separated fear'), tSt = cue(S, 2, 'produced shared standards');
          caps(g, 'the Yellowstone debate', 110, 262, { color: PAL.ink2 });
          g.text('Criticism at work', 110, 318, { size: 44, role: 'display', italic: true, color: PAL.ink, alpha: S.p(2, 0.8, 0.3) });
          const BY = 790; g.line(120, BY, 960, BY, { color: PAL.ink3, w: 2, progress: S.p(2, 1.2, 0.2) });
          g.arrow(960, BY, 990, BY, { color: PAL.ink3, w: 2, head: 11, alpha: S.p(2, 0.6, 1.2) }); g.text('time', 990, BY + 34, { size: 21, color: PAL.ink3, align: 'right', alpha: S.p(2, 0.6, 1.2) });
          const span = Math.max(2.5, tSt - S.b(2) - 0.4);
          D.papers.forEach((x, k) => { const a = S.p(2, 0.5, 0.4 + k * span / 9); g.rect(x - 12, BY - 34, 24, 30, { r: 2, fill: '#ECE3CC', alpha: a }); for (let j = 0; j < 3; j++) g.line(x - 7, BY - 26 + j * 7, x + 7, BY - 26 + j * 7, { color: '#9C927C', w: 1.4, alpha: a }); });
          D.arcs.forEach(([i, j], k) => { const tk = S.b(2) + 0.8 + (k + 1) * span / 9; const p = S.tp(tk, 0.8); if (p <= 0) return; g.carrow(D.papers[i], BY - 38, D.papers[j], BY - 38, 1.05, { color: k % 2 ? COL : PAL.ochre, w: 2.2, head: 11, progress: p, alpha: 0.9 }); });
          caps(g, 'comment', (D.papers[0] + D.papers[1]) / 2, BY - 100, { align: 'center', color: PAL.ochre, alpha: S.p(2, 0.6, 1.4) });
          caps(g, 'reply', (D.papers[1] + D.papers[2]) / 2 + 10, BY - 100, { align: 'center', color: COL, alpha: S.p(2, 0.6, 2.0) });
          caps(g, 'claim', D.papers[0], BY + 34, { align: 'center', color: PAL.ink2, alpha: S.p(2, 0.6, 0.8) });
          // converging on shared standards
          const cx = 1030, cyy = 330, cw = 270, ch = 330; const ca = S.tp(tSa - 0.4, 0.7);
          [6, 7, 8].forEach((pi, k) => g.carrow(D.papers[pi], BY - 40, cx - 6, cyy + 120 + k * 70, -0.25, { color: COL, w: 1.8, head: 11, progress: S.tp(tSt + k * 0.2, 0.9), alpha: 0.75 }));
          g.rect(cx, cyy, cw, ch, { r: 8, fill: '#ECE3CC', alpha: ca });
          g.text('SHARED STANDARDS', cx + 22, cyy + 36, { size: 15, weight: 600, ls: 2, color: '#6B5A3A', alpha: ca });
          g.line(cx + 18, cyy + 50, cx + cw - 18, cyy + 50, { color: '#C76E6E', w: 1.4, alpha: 0.8 * ca });
          [['sampling designs, sharpened', tSa], ['fear separated from density', tFe], ['standards for showing a cascade', tSt]].forEach(([s, tt], k) => { const a = S.tp(tt, 0.6) * ca; const y = cyy + 100 + k * 80; tick(g, cx + 34, y - 6, 22, '#3D7A3A', { alpha: a, progress: S.tp(tt + 0.2, 0.4) }); g.wrap(s, cx + 60, y, cw - 80, { size: 22, color: '#24203A', lh: 1.2, alpha: a }); });
        });
        // ---- Beat 3: two lenses over the review network.
        const b3 = S.p(3, 0.8);
        if (b3 > 0) {
          const tPo = cue(S, 3, 'Postpositivism aims'), tIn = cue(S, 3, 'Interpretivism makes');
          drawNet('base', 0.45 * b3);
          const lens = (kind, x, r, tt, mode, title, sub) => {
            const a = S.tp(tt - 0.3, 0.8); if (a <= 0) return; const xx = lerp(x + (kind === 'pos' ? -60 : 60), x, a);
            g.with(() => { const c = g.ctx; c.beginPath(); c.arc(xx, NC[1], r, 0, Math.PI * 2); c.clip(); g.rect(xx - r, NC[1] - r, 2 * r, 2 * r, { fill: PAL.bg, alpha: 0.9 * a }); drawNet(mode, a); });
            g.lens(kind, xx, NC[1], r, { alpha: a, labSize: 18, label: kind === 'pos' ? 'POSTPOSITIVIST' : 'INTERPRETIVIST' });
            const ty = kind === 'pos' ? 330 : 610; const ta = S.tp(tt + 0.6, 0.7);
            caps(g, title, 100, ty, { color: g.LENS[kind].color, alpha: ta });
            g.wrap(sub, 100, ty + 38, 290, { size: 23, color: PAL.ink, lh: 1.3, alpha: S.tp(tt + 1.0, 0.7) });
          };
          lens('pos', 625, 205, tPo, 'pos', 'postpositivism', 'aims at value neutrality, while studying how values intrude');
          lens('int', 1035, 205, tIn, 'int', 'interpretivism', 'makes values explicit through reflexivity: commitments become evidence');
          g.withAlpha(b3, () => { g.rect(NC[0] - 130, NC[1] - 52, 260, 104, { r: 8, fill: '#1A1730', stroke: COL, w: 2 }); caps(g, 'claim', NC[0] - 110, NC[1] - 18, { color: COL }); g.text('v3', NC[0] + 110, NC[1] - 18, { size: 21, role: 'mono', color: PAL.ink3, align: 'right' }); g.text('Wolves → taller aspen', NC[0], NC[1] + 30, { size: 28, role: 'display', color: PAL.ink, align: 'center' }); });
        }
      },
      terms: [
        { beat: 0.55, term: 'CUDOS norms', def: 'Merton’s norms of science: communalism, universalism, disinterestedness, and organized skepticism.' },
        { beat: 0.85, term: 'Transformative criticism', def: 'Longino’s account of objectivity as a property of communities with venues for criticism, uptake, shared standards, and equality of authority.' },
        { beat: 1.3, term: 'Strong objectivity', def: 'Harding’s view that starting inquiry from marginalized standpoints exposes assumptions and so increases objectivity.' },
      ],
    },
  ],
});
})();
