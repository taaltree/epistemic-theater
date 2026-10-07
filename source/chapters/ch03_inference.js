/* Chapter III — Induction, deduction, abduction. Case file: the Kaibab deer. */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.ochre;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the spoken text).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; let txt = b.s || b.t, i = txt.indexOf(phrase); if (i < 0) { txt = b.t; i = txt.indexOf(phrase); } return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / txt.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const ramp = (t, t0, d) => clamp((t - t0) / Math.max(0.001, d));
// A toothed gear (filled body, hub, spokes). ang in radians.
const gear = (g, x, y, r, n, ang, o = {}) => {
  const a = o.alpha ?? 1; if (a <= 0) return; const c = g.ctx; const col = o.color || PAL.ink2; const ri = r * 0.8, pitch = Math.PI * 2 / n;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(ang); c.beginPath();
  for (let k = 0; k < n; k++) {
    const a0 = k * pitch; const pts = [[ri, a0 - pitch * 0.3], [r, a0 - pitch * 0.17], [r, a0 + pitch * 0.17], [ri, a0 + pitch * 0.3]];
    pts.forEach(([rr, aa], j) => { const px = rr * Math.cos(aa), py = rr * Math.sin(aa); if (k === 0 && j === 0) c.moveTo(px, py); else c.lineTo(px, py); });
    c.arc(0, 0, ri, a0 + pitch * 0.3, a0 + pitch * 0.7);
  }
  c.closePath(); c.moveTo(r * 0.3, 0); c.arc(0, 0, r * 0.3, 0, Math.PI * 2, true);
  c.fillStyle = U.rgba(col, o.fillA ?? 0.2); c.fill('evenodd'); c.strokeStyle = col; c.lineWidth = o.w ?? 2.4; c.lineJoin = 'round'; c.stroke();
  c.beginPath(); for (let k = 0; k < 3; k++) { const aa = k * Math.PI * 2 / 3; c.moveTo(r * 0.3 * Math.cos(aa), r * 0.3 * Math.sin(aa)); c.lineTo(ri * 0.82 * Math.cos(aa), ri * 0.82 * Math.sin(aa)); } c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.12, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  c.restore();
};
// Rubber stamp that thumps down (p: 0→1).
const stamp = (g, str, x, y, col, p, rot = -0.1, size = 26) => {
  if (p <= 0) return; const s = lerp(1.7, 1, ease.out(p)), a = clamp(p * 1.8);
  g.with(() => { g.ctx.translate(x, y); g.ctx.rotate(rot); g.ctx.scale(s, s); const w = g.measure(str, { size, weight: 700, ls: 4 }) + 30;
    g.rect(-w / 2, -size * 0.95, w, size * 1.9, { r: 6, stroke: col, w: 3, alpha: a }); g.rect(-w / 2 + 5, -size * 0.95 + 5, w - 10, size * 1.9 - 10, { r: 4, stroke: col, w: 1.2, alpha: 0.7 * a });
    g.text(str, 2, size * 0.36, { size, weight: 700, ls: 4, color: col, align: 'center', alpha: a }); });
};
const check = (g, x, y, s, col, p = 1) => { if (p <= 0) return; g.poly([[x - s * 0.5, y], [x - s * 0.12, y + s * 0.4], [x + s * 0.55, y - s * 0.45]], { color: col, w: Math.max(3, s * 0.16), progress: p }); };
// Flat-headed suppression arrow (A ⊣ B).
const inhib = (g, x1, y1, x2, y2, o = {}) => {
  const p = o.progress ?? 1; if (p <= 0) return; g.line(x1, y1, x2, y2, { ...o, progress: p });
  if (p > 0.97) { const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, h = o.bar ?? 16; g.line(x2 - Math.cos(a) * h, y2 - Math.sin(a) * h, x2 + Math.cos(a) * h, y2 + Math.sin(a) * h, { ...o, progress: 1, w: (o.w ?? 3) + 1 }); }
};
// Domestic cattle (not in the engine icon set): a 100-unit box like the engine icons.
const cow = (g, x, y, s, color, o = {}) => {
  const a = o.alpha ?? 1; if (a <= 0) return; const c = g.ctx; c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(s / 100, s / 100); c.globalAlpha *= a;
  c.fillStyle = color; c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-42, -16, 72, 36, 13); c.fill();
  c.fillRect(-38, 12, 9, 32); c.fillRect(-24, 14, 9, 30); c.fillRect(12, 14, 9, 30); c.fillRect(22, 12, 9, 32);
  c.beginPath(); c.moveTo(20, -12); c.lineTo(42, -22); c.lineTo(58, -10); c.lineTo(56, 6); c.lineTo(44, 8); c.lineTo(24, 4); c.closePath(); c.fill();
  c.lineWidth = 4.5; c.beginPath(); c.moveTo(44, -20); c.quadraticCurveTo(40, -32, 48, -36); c.moveTo(38, -18); c.lineTo(30, -26); c.stroke();
  c.lineWidth = 3.5; c.beginPath(); c.moveTo(-42, -10); c.quadraticCurveTo(-52, 2, -48, 22); c.stroke();
  c.fillStyle = o.bg || PAL.bg; c.globalAlpha *= 0.55; c.beginPath(); c.ellipse(-20, -2, 10, 8, 0.3, 0, Math.PI * 2); c.ellipse(4, 6, 8, 6, -0.2, 0, Math.PI * 2); c.fill();
  c.restore();
};
// Black swan: dark body with a pale rim and a red bill.
const blackSwan = (g, x, y, s, a = 1) => {
  if (a <= 0) return; g.icon('swan', x, y, s * 1.07, PAL.ink2, { alpha: a }); g.icon('swan', x, y, s, '#121020', { alpha: a });
  g.with(() => { g.ctx.translate(x, y); g.ctx.scale(s / 100, s / 100); g.ctx.globalAlpha *= a; g.ctx.fillStyle = PAL.coral; g.ctx.beginPath(); g.ctx.moveTo(34, -44); g.ctx.lineTo(46, -39); g.ctx.lineTo(34, -37); g.ctx.fill(); });
};

Theater.chapter({
  id: 'infer', roman: 'III', title: 'Inference', color: COL,
  question: 'Which inferences preserve truth, and which expand knowledge?',
  casefile: { title: 'The Kaibab deer', sketch: 'deer' },
  intro: { t: 'Chapter three. Inference: deduction, induction, and abduction.' },
  scenes: [
    {
      id: 'infer-kaibab', title: 'Case file: the Kaibab deer', register: 'infer',
      beats: [
        { t: 'Aldo Leopold supported killing predators in the 1910s and 1920s, then changed his mind. On Arizona’s Kaibab Plateau, he wrote, deer had irrupted after wolves and pumas were removed, then stripped the range of browse and starved.',
          cite: 'Leopold 1949; Wilmers et al. 2025',
          v: 'Case-file card (deer). A stylized deer curve rising steeply after predator icons fade out, then crashing; aspen and shrubs thinning beneath.' },
        { t: 'Rachel Carson retold the story in Silent Spring. It became a founding example for the green world hypothesis: the world is green because predators keep herbivores in check.',
          cite: 'Carson 1962; Hairston, Smith & Slobodkin 1960',
          v: 'Three-level chain drawn vertically: predator, herbivore, green plants; “the world is green” glows.' },
        { t: 'In 1970, Graeme Caughley examined the Kaibab records and called them unreliable and inconsistent. He suggested the deer increase may have followed the removal of cattle, a rival explanation no one had ruled out. A general rule had been built on one poorly measured case.',
          s: 'In 1970, Graeme Cawley examined the Kaibab records and called them unreliable and inconsistent. He suggested the deer increase may have followed the removal of cattle, a rival explanation no one had ruled out. A general rule had been built on one poorly measured case.',
          cite: 'Caughley 1970',
          v: 'The deer curve breaks into scattered, inconsistent estimates; a cattle icon fades out on the same timeline as the predators.' },
      ],
      init() {
        const r = U.rng(303); const sig = (z) => 1 / (1 + Math.exp(-z));
        // Stylized Kaibab deer curve: low, a steep irruption to the mid-1920s, then a crash.
        const deer = (x) => 0.08 + 0.8 * sig((x - 1917.5) / 1.9) * (x < 1924 ? 1 : 0.16 + 0.84 * Math.exp(-Math.pow((x - 1924) / 3.3, 2)));
        const press = (yr) => { let P = 0; for (let u = 1900; u < yr; u += 0.25) P += Math.max(0, deer(u) - 0.42) * 0.25; return P; };
        const Pmax = press(1931);
        const plants = []; for (let k = 0; k < 30; k++) { const yr = 1901 + k * 1.45 + (r() - 0.5) * 0.5; plants.push({ yr, h: 1 - 0.86 * Math.min(1, press(yr) / Pmax), kind: k % 3 === 1 ? 'willow' : 'aspen', s: 0.85 + r() * 0.3 }); }
        const preds = [1902, 1906, 1910, 1914, 1918].map((yr, k) => ({ yr, kind: k % 2 ? 'puma' : 'wolf' }));
        const cattle = [1902, 1906, 1910, 1914, 1918];
        // Inconsistent records: three sets of estimates that disagree (stylized).
        const est = []; const mult = [0.55, 1.0, 1.32];
        for (let s = 0; s < 3; s++) for (let yr = 1905.5 + s * 0.7; yr < 1941; yr += 2.1) { if (r() < 0.3) continue; est.push({ yr, v: clamp(deer(yr) * mult[s] + U.gauss(r) * 0.07, 0.04, 1.12), m: s, e: r() < 0.45 ? 0.05 + r() * 0.09 : 0, d: r() }); }
        const meadow = []; for (let k = 0; k < 13; k++) meadow.push({ x: 640 + k * 45 + (r() - 0.5) * 12, s: 62 + r() * 34, kind: ['aspen', 'willow', 'grass', 'aspen'][k % 4] });
        return { deer, plants, preds, cattle, est, meadow };
      },
      draw(g, t, S, D) {
        const lane1 = 268, lane2 = 322, GY = 884;
        const tLeo = cue(S, 0, 'supported killing'), tMind = cue(S, 0, 'then changed'), tKai = cue(S, 0, 'On Arizona'), tIr = cue(S, 0, 'deer had irrupted'), tStr = cue(S, 0, 'then stripped'), tStv = cue(S, 0, 'and starved');
        g.casefile(96, 226, 270, 156, { title: 'The Kaibab deer', no: 'III', sketch: 'deer', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });
        // Time cursor sweeping the record: to the peak while the deer irrupt, then through the crash.
        const dA = Math.max(1.5, tStr - tIr + 0.3), tPk = tIr - 0.3 + dA;
        const yr = t < tPk ? 1900 + 24 * ease.inOut(ramp(t, tIr - 0.3, dA)) : 1924 + 21 * ease.inOut(ramp(t, tPk, Math.max(1.5, S.e(0) + 0.8 - tPk)));
        const aCh = clamp(1 - S.p(1, 0.6) + S.p(2, 0.9));

        // ---- Left column: Leopold (beat 1), Carson (beat 2), Caughley (beat 3)
        g.withAlpha(1 - S.p(1, 0.5), () => {
          caps(g, 'Aldo Leopold', 110, 446, { color: COL, alpha: S.p(0, 0.8, 0.4) });
          g.withAlpha(S.tp(tLeo - 0.3, 0.8), () => g.wrap('Supported killing predators in the 1910s and 1920s', 110, 482, 280, { size: 22, color: PAL.ink2, lh: 1.3 }));
          g.withAlpha(S.tp(tMind - 0.2, 0.8), () => {
            g.text('then changed his mind', 110, 592, { size: 30, role: 'display', italic: true, color: PAL.ink });
            g.text('A Sand County Almanac, 1949', 110, 626, { size: 19, italic: true, color: PAL.ink3 });
          });
        });
        g.withAlpha(vis(S, 1, 2), () => {
          caps(g, 'Rachel Carson', 110, 446, { color: COL });
          g.text('Silent Spring, 1962', 110, 480, { size: 23, italic: true, color: PAL.ink2 });
          const tGW = cue(S, 1, 'green world hypothesis');
          g.withAlpha(S.tp(tGW - 0.4, 0.8), () => { caps(g, 'Green world hypothesis', 110, 566, { color: PAL.moss }); g.wrap('Hairston, Smith & Slobodkin, 1960', 110, 600, 280, { size: 21, italic: true, color: PAL.ink3, lh: 1.3 }); });
        });
        const tU = cue(S, 2, 'unreliable'), tCat = cue(S, 2, 'removal of cattle'), tRiv = cue(S, 2, 'a rival explanation'), tG = cue(S, 2, 'A general rule');
        g.withAlpha(S.p(2, 0.8), () => {
          caps(g, 'Graeme Caughley, 1970', 110, 446, { color: COL });
          g.withAlpha(S.tp(tU - 0.5, 0.8), () => g.wrap('Kaibab records: unreliable and inconsistent', 110, 482, 280, { size: 22, color: PAL.ink2, lh: 1.3 }));
          g.withAlpha(S.tp(tCat - 0.3, 0.8), () => { caps(g, 'Rival explanation', 110, 572, { color: PAL.violet }); g.wrap('Deer may have increased after cattle were removed', 110, 606, 280, { size: 22, color: PAL.ink2, lh: 1.3 }); });
          g.withAlpha(S.tp(tRiv + 0.6, 0.8), () => g.text('never ruled out', 110, 690, { size: 22, italic: true, color: PAL.coral }));
          // One general rule teetering on a single, poorly measured case.
          const aG = S.tp(tG - 0.2, 0.9);
          if (aG > 0) g.withAlpha(aG, () => {
            const cx = 236, tipY = 800, wob = 0.07 * Math.sin(t * 2.2) * (0.4 + 0.6 * aG);
            g.poly([[cx, tipY], [cx - 13, 838], [cx + 13, 838]], { fill: U.rgba(PAL.sand, 0.5), color: PAL.sand, w: 1.6, close: true });
            g.dot(cx, 846, 6, PAL.sand, 1, 2.4);
            g.with(() => { g.ctx.translate(cx, tipY); g.ctx.rotate(wob); g.rect(-140, -38, 280, 36, { r: 5, fill: U.rgba(COL, 0.2), stroke: COL, w: 2 }); caps(g, 'General rule', 0, -14, { color: PAL.ink, align: 'center' }); });
            g.text('one poorly measured case', cx, 884, { size: 21, color: PAL.ink2, align: 'center' });
          });
        });

        // ---- The record: lanes of predators (and later cattle) over a stylized deer curve
        if (aCh > 0) g.withAlpha(aCh, () => {
          const A = g.axes({ x: 520, y: 360, w: 740, h: 360, xmin: 1900, xmax: 1945, ymin: 0, ymax: 1.2, xlab: 'Year', ylab: 'Deer', labSize: 22, progress: S.p(0, 1.2, 0.6), xticks: [1900, 1910, 1920, 1930, 1940].map((v) => ({ v, l: String(v) })) });
          caps(g, 'stylized', A.x + A.w, A.y - 4, { align: 'right', size: 15 });
          caps(g, 'Kaibab Plateau, Arizona', A.x + 22, A.y + 18, { color: COL, alpha: S.tp(tKai, 0.8) });
          // Same-years band (beat 3)
          const aB = S.tp(tRiv - 0.2, 0.9);
          if (aB > 0) { g.rect(A.X(1900.4), 238, A.X(1921.2) - A.X(1900.4), A.y + A.h - 238, { r: 8, fill: U.rgba(PAL.ink, 0.05), stroke: U.rgba(PAL.ink, 0.35), w: 1.4, dash: [6, 6], alpha: aB }); caps(g, 'overlapping changes · stylized', (A.X(1900.4) + A.X(1921.2)) / 2, 230, { color: PAL.ink, align: 'center', alpha: aB }); }
          // Predators, removed as the cursor passes
          const LX = A.X(1922.4), cw = g.measure('WOLVES & PUMAS', { size: 17, weight: 600, ls: 2.6 });
          caps(g, 'wolves & pumas', LX, lane1 + 6, { color: PAL.coral, alpha: S.p(0, 0.8, 0.8) });
          if (yr > 1900.6) g.line(A.X(1900.6), lane1, A.X(Math.min(yr, 1921.2)), lane1, { color: PAL.coral, w: 2, alpha: 0.55 });
          D.preds.forEach((p, k) => { const gone = ease.inOut(clamp((yr - p.yr) / 2.6)); g.icon(p.kind, A.X(p.yr), lane1 + gone * 5, 50, U.mix(PAL.coral, PAL.ink3, gone), { alpha: S.p(0, 0.6, 1.0 + k * 0.15) * (1 - 0.8 * gone) }); });
          g.text('removed', LX + cw + 10, lane1 + 6, { size: 21, italic: true, color: PAL.coral, alpha: S.tp(tIr + 0.8, 0.8) });
          // Cattle (beat 3), removed on the same timeline
          const yc = 1900 + 23 * ease.inOut(ramp(t, tCat - 0.1, 2.6));
          const aC = S.tp(tCat - 0.6, 0.8);
          if (aC > 0) {
            caps(g, 'cattle', LX, lane2 + 6, { color: PAL.violet, alpha: aC });
            g.text('removed', LX + g.measure('CATTLE', { size: 17, weight: 600, ls: 2.6 }) + 10, lane2 + 6, { size: 21, italic: true, color: PAL.violet, alpha: S.tp(tCat + 2.2, 0.8) });
            if (yc > 1900.6) g.line(A.X(1900.6), lane2, A.X(Math.min(yc, 1921.2)), lane2, { color: PAL.violet, w: 2, alpha: 0.6 * aC });
            D.cattle.forEach((c, k) => { const gone = ease.inOut(clamp((yc - c) / 2.6)); cow(g, A.X(c), lane2 + gone * 5, 50, U.mix(PAL.violet, PAL.ink3, gone), { alpha: aC * S.tp(tCat - 0.6 + k * 0.1, 0.5) * (1 - 0.8 * gone) }); });
          }
          // Deer curve; in beat 3 it breaks into scattered, inconsistent estimates
          const brk = S.tp(tU - 0.2, 1.4);
          const tip = yr > 1900.05 ? g.plot(A, D.deer, { from: 1900, to: yr, color: PAL.sand, w: 4.5, alpha: 1 - 0.85 * brk }) : null;
          if (brk > 0) g.plot(A, D.deer, { color: PAL.sand, w: 2, dash: [3, 9], alpha: 0.45 * brk });
          if (tip && yr < 1944.9) g.dot(tip[0], tip[1], 7, PAL.sand, 1, 3);
          g.text('irruption', A.X(1916.6), A.Y(0.66), { size: 23, italic: true, color: PAL.sand, align: 'right', alpha: S.tp(tIr + 1.2, 0.8) * (1 - brk) });
          g.text('starvation', A.X(1929.4), A.Y(0.5), { size: 23, italic: true, color: PAL.sand, alpha: S.tp(tStv, 0.8) * (1 - brk) });
          D.est.forEach((e) => {
            const p = S.tp(tU + 0.1 + e.d * 1.4, 0.9); if (p <= 0) return; const x = A.X(e.yr), y = A.Y(lerp(D.deer(e.yr), e.v, p));
            if (e.e) g.line(x, y - e.e * A.h / 1.2 * p, x, y + e.e * A.h / 1.2 * p, { color: PAL.sand, w: 1.6, alpha: 0.6 * p });
            if (e.m === 0) g.circle(x, y, 6.5, { stroke: PAL.sand, w: 2.2, alpha: p });
            else if (e.m === 1) g.rect(x - 6, y - 6, 12, 12, { stroke: PAL.sand, w: 2.2, alpha: p });
            else g.poly([[x, y - 8], [x + 7.5, y + 5.5], [x - 7.5, y + 5.5]], { color: PAL.sand, w: 2.2, close: true, alpha: p });
          });
          caps(g, 'estimates disagree', A.x + A.w, A.y + 18, { align: 'right', color: PAL.sand, alpha: S.tp(tU + 1.2, 0.8) });
          // The range beneath: aspen and shrubs, stripped as the irruption passes
          caps(g, 'aspen & shrubs', A.x, GY - 96, { color: PAL.moss, alpha: S.p(0, 0.8, 1.4) });
          g.line(A.x, GY, A.x + A.w, GY, { color: PAL.ink3, w: 1.5, progress: S.p(0, 1.2, 1.2) });
          D.plants.forEach((pl, k) => {
            const past = clamp((yr - pl.yr) / 1.5); const h = lerp(1, pl.h, past); const sz = lerp(17, 56, h) * pl.s;
            g.icon(pl.kind, A.X(pl.yr), GY - 0.5 * sz, sz, U.mix(PAL.ink3, PAL.moss, h), { alpha: S.p(0, 0.6, 1.3 + k * 0.03) * (0.5 + 0.5 * past) });
          });
          caps(g, 'browse stripped', A.X(1933), GY - 74, { align: 'center', color: PAL.ink2, alpha: S.tp(tStr + 0.6, 0.8) * (1 - S.p(1, 0.5)) });
        });

        // ---- Beat 2: the green-world chain, drawn vertically
        const aW = vis(S, 1, 2);
        if (aW > 0) g.withAlpha(aW, () => {
          const tGr = cue(S, 1, 'the world is green'), tChk = cue(S, 1, 'predators keep');
          const T3 = 330, T2 = 560;
          caps(g, 'predators', 470, T3 + 6, { color: PAL.coral, alpha: S.p(1, 0.7, 0.3) });
          caps(g, 'herbivores', 470, T2 + 6, { color: PAL.sand, alpha: S.p(1, 0.7, 0.7) });
          caps(g, 'green plants', 470, 806, { color: PAL.moss, alpha: S.p(1, 0.7, 1.1) });
          g.icon('wolf', 820, T3, 96, PAL.coral, { alpha: S.p(1, 0.7, 0.3) }); g.icon('puma', 980, T3 + 4, 96, PAL.coral, { alpha: S.p(1, 0.7, 0.45) });
          [760, 890, 1020].forEach((x, k) => g.icon('deer', x, T2, 78, PAL.sand, { alpha: S.p(1, 0.7, 0.7 + k * 0.12), flip: k === 1 }));
          const glowA = S.tp(tGr, 1.0);
          D.meadow.forEach((m, k) => { const a = S.p(1, 0.6, 1.1 + k * 0.05); if (glowA > 0) g.glow(m.x, 846 - 0.5 * m.s, m.s * 0.9, PAL.moss, 0.22 * glowA * a); g.icon(m.kind, m.x, 846 - 0.5 * m.s, m.s, PAL.moss, { alpha: a }); });
          g.line(600, 848, 1240, 848, { color: PAL.ink3, w: 1.5, alpha: S.p(1, 0.8, 1.1) });
          const hk = S.tp(tChk - 0.2, 0.7);
          if (hk > 0) g.line(670, 372, 670, 512, { color: PAL.coral, w: 12, alpha: 0.18 * hk });
          inhib(g, 670, 372, 670, 512, { color: PAL.coral, w: 3 + 1.5 * hk, progress: S.p(1, 0.9, 1.3) });
          inhib(g, 670, 604, 670, 730, { color: PAL.sand, w: 3, progress: S.p(1, 0.9, 1.7) });
          g.text('keep in check', 690, 450, { size: 21 + 3 * hk, italic: true, color: PAL.coral, alpha: S.p(1, 0.8, 1.6) });
          g.text('eat', 690, 676, { size: 21, italic: true, color: PAL.sand, alpha: S.p(1, 0.8, 2.0) });
          g.carrow(1130, 352, 1200, 744, -0.3, { color: PAL.moss, w: 2.6, dash: [8, 8], head: 14, progress: S.tp(tGr - 0.3, 1.2) });
          g.text('+', 1236, 560, { size: 44, color: PAL.moss, align: 'center', alpha: S.tp(tGr + 0.4, 0.8) });
          g.text('The world is green.', 900, 902, { size: 44, role: 'display', italic: true, color: PAL.moss, align: 'center', alpha: glowA });
        });
      },
      terms: [
        { beat: 1.4, term: 'Green world hypothesis', def: 'Hairston, Smith and Slobodkin (1960): the world is green because predators hold herbivores below levels that would strip vegetation.' },
        { beat: 1.7, term: 'Trophic cascade', def: 'Indirect effects of predators that propagate down a food chain, for example to plants by suppressing herbivores.' },
      ],
    },
    {
      id: 'infer-three', title: 'Three kinds of inference', register: 'infer',
      beats: [
        { t: 'Deduction moves from premises to what must follow. If all elk are ungulates, and this is an elk, it is an ungulate. A valid deduction cannot have true premises and a false conclusion; a sound one is valid with true premises. But deduction never says more than its premises contain.',
          v: 'Three gears. Gear 1, DEDUCTION, turns general → particular; a syllogism builds; VALID and SOUND stamps.' },
        { t: 'Induction generalizes from cases: every swan seen so far is white, so all swans are white. It is ampliative, adding content, and fallible. David Hume showed it cannot be justified without assuming the future will resemble the past. Europeans learned this in Australia, from black swans.',
          cite: 'Hume 1748',
          v: 'Gear 2, INDUCTION, turns particular → general; a tally of white swans grows, then a single black swan glides in and the generalization cracks.' },
        { t: 'Abduction, Charles Sanders Peirce’s term, reasons from a surprising fact to the hypothesis that would explain it. Peter Lipton calls this inference to the best explanation, and warns that the loveliest explanation, the one that would explain the most, is not always the likeliest.',
          s: 'Abduction, Charles Sanders Purse’s term, reasons from a surprising fact to the hypothesis that would explain it. Peter Lipton calls this inference to the best explanation, and warns that the loveliest explanation, the one that would explain the most, is not always the likeliest.',
          cite: 'Peirce 1878; Lipton 2004',
          v: 'Gear 3, ABDUCTION, from effect back to cause; candidate explanations ranked on two bars: LOVELINESS and LIKELINESS.' },
        { t: 'The Kaibab story was an induction from one case, joined to an abduction whose loveliness hid an untested rival.',
          v: 'The Kaibab card returns between the gears; the cattle rival flagged “untested”.' },
      ],
      init() {
        const r = U.rng(311);
        const tally = []; for (let k = 0; k < 28; k++) { const c = k % 7, rw = Math.floor(k / 7); tally.push({ x: 166 + c * 82 + (r() - 0.5) * 12, y: 500 + rw * 92 + (r() - 0.5) * 8, flip: r() < 0.35 }); }
        const crack = []; let cx = 1022, cy = 410; crack.push([cx, cy]); for (let k = 0; k < 8; k++) { cx += (k % 2 ? 1 : -0.5) * (6 + r() * 14); cy += 13; crack.push([cx, cy]); }
        return { tally, crack };
      },
      draw(g, t, S, D) {
        // ---- The three gears: a row across the top; each turns while its inference is narrated.
        const m3 = S.io(3, 1.3, 0.6);
        const NAMES = [['Deduction', 'general → particular'], ['Induction', 'particular → general'], ['Abduction', 'effect → cause']];
        NAMES.forEach(([nm, sub], k) => {
          const on = Math.max(vis(S, k, k + 1, 0.6), k > 0 ? S.p(3, 0.8) : 0); const mv = k > 0 ? m3 : 0;
          const x = lerp(150 + k * 410, k === 1 ? 450 : 1130, mv), y = lerp(298, 604, mv), rr = lerp(42, 66, mv);
          const spin = 0.9 * (clamp(t - S.b(k), 0, S.b(k + 1) - S.b(k)) + (k > 0 ? Math.max(0, t - S.b(3)) : 0)) * (k === 1 ? -1 : 1);
          const a = S.p(0, 0.8, 0.2 + k * 0.25) * (k === 0 ? 1 - 0.55 * S.p(3, 0.8) : 1);
          if (on > 0) g.glow(x, y, rr * 2.3, COL, 0.22 * on * a);
          gear(g, x, y, rr, 11, spin + k * 0.3, { color: U.mix(PAL.ink3, COL, on), alpha: a, fillA: 0.1 + 0.2 * on });
          g.withAlpha(S.p(0, 0.8, 0.4 + k * 0.25) * (1 - mv), () => {
            g.text(nm, x + 64, y + 4, { size: 32, role: 'display', color: U.mix(PAL.ink3, PAL.ink, Math.max(on, 0.3)) });
            caps(g, sub, x + 64, y + 32, { color: U.mix(PAL.ink3, COL, on) });
          });
        });

        // ---- Beat 1: deduction. A syllogism beside an Euler diagram.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tP1 = cue(S, 0, 'If all elk'), tP2 = cue(S, 0, 'and this is an elk'), tC = cue(S, 0, 'it is an ungulate'), tV = cue(S, 0, 'A valid deduction'), tS = cue(S, 0, 'a sound one'), tN = cue(S, 0, 'But deduction never');
          [['All elk are ungulates.', 490, tP1], ['This is an elk.', 560, tP2]].forEach(([s, y, tt], j) => {
            const a = S.tp(tt - 0.2, 0.8); g.text(s, 120 + (1 - a) * 20, y, { size: 42, role: 'display', color: PAL.ink, alpha: a });
            check(g, 120 + g.measure(s, { size: 42, role: 'display' }) + 30, y - 14, 24, PAL.moss, S.tp(tS + 0.6 + j * 0.3, 0.6));
          });
          g.line(120, 592, 560, 592, { color: PAL.ink2, w: 2, progress: S.tp(tC - 0.5, 0.7) });
          const aC = S.tp(tC - 0.1, 0.8);
          g.text('∴', 120, 654, { size: 42, role: 'math', color: COL, alpha: aC });
          g.text('It is an ungulate.', 164, 654, { size: 42, role: 'display', color: COL, alpha: aC });
          stamp(g, 'VALID', 212, 740, COL, S.tp(tV, 0.5), -0.12);
          stamp(g, 'SOUND', 452, 746, PAL.moss, S.tp(tS + 0.2, 0.5), 0.06);
          g.withAlpha(S.tp(tV + 0.5, 0.8), () => g.wrap('True premises cannot give a false conclusion', 120, 816, 236, { size: 21, color: PAL.ink2, lh: 1.3 }));
          g.withAlpha(S.tp(tS + 0.7, 0.8), () => g.wrap('Valid, and the premises are true', 384, 816, 210, { size: 21, color: PAL.ink2, lh: 1.3 }));
          // Euler diagram: elk inside ungulates; this elk inside elk.
          const ox = 1010, oy = 622, R = 212, ix = 1062, iy = 690, ir = 108;
          const pO = S.tp(tP1, 1.2), pI = S.tp(tP1 + 0.9, 1.0), pE = S.tp(tP2, 0.8), pC = S.tp(tC, 0.8);
          g.circle(ox, oy, R, { fill: U.rgba(PAL.sand, 0.05), alpha: pO });
          if (pO > 0) g.circle(ox, oy, R, { stroke: U.mix(PAL.sand, COL, pC), w: 2.4 + 1.4 * pC, a0: -Math.PI / 2, a1: -Math.PI / 2 + Math.PI * 2 * pO });
          caps(g, 'ungulates', ox, oy - R + 44, { color: PAL.sand, align: 'center', alpha: pO });
          [['bison', 872, 566, 64], ['moose', 884, 734, 62], ['deer', 1128, 508, 54]].forEach(([k, x, y, s], j) => g.icon(k, x, y, s, PAL.sand, { alpha: 0.5 * S.tp(tP1 + 0.4 + j * 0.2, 0.7) }));
          g.circle(ix, iy, ir, { fill: U.rgba(PAL.ink, 0.05), alpha: pI });
          if (pI > 0) g.circle(ix, iy, ir, { stroke: PAL.ink2, w: 2.2, a0: -Math.PI / 2, a1: -Math.PI / 2 + Math.PI * 2 * pI });
          caps(g, 'elk', ix, iy - ir + 34, { color: PAL.ink2, align: 'center', alpha: pI });
          if (pC > 0) g.glow(ix, iy + 14, 70, COL, 0.4 * pC);
          g.icon('elk', ix, iy + 18, 84 * lerp(0.5, 1, ease.outBack(pE)), U.mix(PAL.sand, COL, pC), { alpha: pE });
          g.text('this elk', ix, iy + 84, { size: 21, italic: true, color: COL, align: 'center', alpha: pC });
          g.text('The conclusion was already inside the premises.', ox, 890, { size: 23, italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tN + 0.6, 0.9) });
        });

        // ---- Beat 2: induction. A tally of white swans, a generalization, one black swan.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tSeen = cue(S, 1, 'every swan seen'), tAll = cue(S, 1, 'so all swans'), tAmp = cue(S, 1, 'ampliative'), tFal = cue(S, 1, 'and fallible'), tHu = cue(S, 1, 'David Hume'), tEu = cue(S, 1, 'Europeans learned'), tBS = cue(S, 1, 'from black swans');
          const step = 3.6 / 28; let n = 0;
          D.tally.forEach((sw, k) => { const tk = tSeen - 0.2 + k * step; if (t < tk) return; n++; const p = S.tp(tk, 0.45); g.icon('swan', sw.x, sw.y + (1 - p) * 10, 64 * lerp(0.6, 1, ease.outBack(p)), PAL.snow, { alpha: p, flip: sw.flip }); });
          caps(g, 'white swans seen', 130, 424, { alpha: S.tp(tSeen - 0.4, 0.6) });
          g.text(String(n), 700, 430, { size: 44, role: 'display', color: PAL.ink, align: 'right', alpha: S.tp(tSeen - 0.4, 0.6) });
          const tCr = Math.min(tBS + 0.2, tEu + 1.7), cr = S.tp(tCr, 0.6);
          const aAll = S.tp(tAll - 0.2, 0.8);
          g.carrow(700, 612, 784, 474, -0.35, { color: COL, w: 2.6, dash: [7, 7], head: 14, progress: S.tp(tAll - 0.4, 0.9) });
          g.rect(790, 410, 490, 104, { r: 8, fill: U.rgba(PAL.ink, 0.05), stroke: U.mix(PAL.ink2, PAL.coral, cr), w: 2, alpha: aAll });
          g.text('All swans are white.', 1035, 476, { size: 44, role: 'display', color: U.mix(PAL.ink, PAL.coral, cr), align: 'center', alpha: aAll });
          g.poly(D.crack, { color: PAL.coral, w: 3, progress: cr });
          g.line(856, 466, 1214, 466, { color: PAL.coral, w: 3, progress: S.tp(tCr + 0.35, 0.5) });
          g.withAlpha(S.tp(tAmp, 0.7), () => { caps(g, 'ampliative', 800, 556, { color: COL }); g.text('adds content', 800, 586, { size: 21, color: PAL.ink2 }); });
          g.withAlpha(S.tp(tFal, 0.7), () => { caps(g, 'fallible', 1030, 556, { color: PAL.coral }); g.text('can be wrong', 1030, 586, { size: 21, color: PAL.ink2 }); });
          g.withAlpha(S.tp(tHu - 0.2, 0.8), () => {
            caps(g, 'David Hume, 1748', 800, 654, { color: COL });
            g.wrap('Induction cannot be justified without assuming the future will resemble the past.', 800, 688, 380, { size: 21, color: PAL.ink2, lh: 1.3 });
            const lx = 1238, ly = 700, lr = 24; g.with(() => { const c = g.ctx; c.beginPath(); c.arc(lx, ly, lr, 0.5, Math.PI * 2 - 0.2); c.strokeStyle = COL; c.lineWidth = 2.6; c.stroke(); });
            g.arrowHead(lx + lr * Math.cos(-0.2), ly + lr * Math.sin(-0.2), -0.2 + Math.PI / 2, 12, COL);
            caps(g, 'circular', lx, ly + 52, { color: COL, align: 'center', size: 15 });
          });
          // Water and the black swan gliding in.
          const aW = S.tp(tEu - 0.4, 0.8);
          g.line(940, 856, 1290, 856, { color: PAL.lagoon, w: 2, alpha: 0.6 * aW });
          for (let k = 0; k < 4; k++) g.line(970 + k * 80, 872, 1010 + k * 80, 872, { color: PAL.lagoon, w: 1.4, alpha: 0.3 * aW });
          const sx = lerp(1270, 1050, ease.out(ramp(t, tEu - 0.6, 2.2)));
          blackSwan(g, sx, 818 + 3 * Math.sin(t * 2.1), 96, S.tp(tEu - 0.6, 0.7));
          g.withAlpha(S.tp(tEu + 1.0, 0.8), () => { g.text('one black swan', 900, 818, { size: 22, italic: true, color: PAL.ink, align: 'right' }); caps(g, 'Australia', 900, 846, { color: PAL.ink2, align: 'right' }); });
        });

        // ---- Beat 3: abduction. From a surprising fact back to candidate causes, ranked two ways.
        const a2 = S.p(2, 0.8) * (1 - S.p(3, 0.6, 0.6));
        if (a2 > 0) g.withAlpha(a2, () => {
          const tPe = cue(S, 2, 'Charles Sanders'), tSur = cue(S, 2, 'from a surprising fact'), tHyp = cue(S, 2, 'to the hypothesis'), tLip = cue(S, 2, 'Peter Lipton'), tWarn = cue(S, 2, 'and warns'), tLov = cue(S, 2, 'the loveliest'), tMost = cue(S, 2, 'the one that would'), tLik = cue(S, 2, 'is not always');
          caps(g, 'Charles S. Peirce', 110, 430, { color: COL, alpha: S.tp(tPe, 0.8) });
          g.text('named it abduction', 110, 464, { size: 22, italic: true, color: PAL.ink2, alpha: S.tp(tPe + 0.4, 0.8) });
          caps(g, 'Peter Lipton', 110, 556, { color: COL, alpha: S.tp(tLip, 0.8) });
          g.withAlpha(S.tp(tLip + 0.3, 0.8), () => g.wrap('Inference to the best explanation', 110, 596, 300, { size: 32, role: 'display', color: PAL.ink, lh: 1.15 }));
          const aF = S.tp(tSur - 0.3, 0.8);
          g.rect(520, 392, 640, 96, { r: 10, fill: U.rgba(COL, 0.08), stroke: COL, w: 2, alpha: aF });
          caps(g, 'surprising fact', 546, 426, { color: COL, alpha: aF });
          g.text('The Kaibab deer irrupted.', 546, 468, { size: 30, color: PAL.ink, alpha: aF });
          const mini = []; for (let k = 0; k <= 30; k++) { const u = k / 30; mini.push([1036 + u * 100, 470 - 52 * Math.exp(-Math.pow((u - 0.55) / 0.18, 2)) * (u < 0.55 ? 1 : 1)]); }
          g.poly(mini, { color: PAL.sand, w: 3, alpha: aF, progress: S.tp(tSur, 1.0) });
          const H = [{ cx: 690, nm: 'Predators removed', lov: 0.92, ic: 'wolf' }, { cx: 1100, nm: 'Cattle removed', lov: 0.42, ic: 'cow' }];
          H.forEach((h, j) => {
            const aH = S.tp(tHyp + j * 0.5, 0.8);
            g.arrow(j ? 900 : 780, 494, j ? 1060 : 720, 560, { color: COL, w: 2.4, head: 13, progress: aH });
            const w = g.measure(h.nm, { size: 27 });
            g.text(h.nm, h.cx + 24, 604, { size: 27, color: PAL.ink, align: 'center', alpha: aH });
            if (h.ic === 'wolf') g.icon('wolf', h.cx - w / 2 - 14, 594, 44, PAL.coral, { alpha: aH }); else cow(g, h.cx - w / 2 - 14, 594, 44, PAL.violet, { alpha: aH });
            const x0 = h.cx - 180, pT = S.tp(tWarn - 0.3 + j * 0.2, 0.8), pL = S.tp(tLov + j * 0.4, 1.2), pK = S.tp(tLik - 0.2 + j * 0.3, 0.8);
            caps(g, 'loveliness', x0, 652, { color: COL, alpha: pT });
            g.rect(x0, 664, 360, 20, { r: 10, stroke: PAL.ink3, w: 1.4, alpha: pT });
            if (pL > 0) g.rect(x0, 664, Math.max(20, 360 * h.lov * pL), 20, { r: 10, fill: COL, alpha: 0.85 * pL });
            g.text(j ? 'explains less' : 'would explain the most', x0, 716, { size: 21, italic: true, color: j ? PAL.ink3 : COL, alpha: S.tp(tMost + j * 0.4, 0.8) });
            caps(g, 'likeliness', x0, 764, { color: PAL.lagoon, alpha: pT });
            g.rect(x0, 776, 360, 20, { r: 10, stroke: PAL.ink3, w: 1.4, fill: U.rgba(PAL.lagoon, 0.1 * pK), alpha: pT });
            if (pK > 0) g.clip(x0, 776, 360, 20, () => { for (let k = -2; k < 26; k++) g.line(x0 + k * 16, 798, x0 + k * 16 + 18, 774, { color: PAL.lagoon, w: 1.6, alpha: 0.45 * pK }); });
            g.text('?', x0 + 380, 796, { size: 30, role: 'display', color: PAL.lagoon, alpha: pK });
          });
          caps(g, 'illustrative', 1280, 652, { align: 'right', size: 15, alpha: S.tp(tWarn, 0.8) });
          g.text('The loveliest is not always the likeliest.', 895, 880, { size: 38, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tLik + 0.2, 0.9) });
        });

        // ---- Beat 4: the Kaibab card between induction and abduction; the cattle rival untested.
        const a3 = S.p(3, 0.9, 1.0);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tOne = cue(S, 3, 'an induction from one case'), tAb = cue(S, 3, 'joined to an abduction'), tU = cue(S, 3, 'an untested rival');
          g.casefile(632, 470, 330, 196, { title: 'The Kaibab deer', no: 'III', sketch: 'deer', color: COL, rot: 0.02 });
          g.line(520, 604, 628, 574, { color: COL, w: 2, dash: [5, 6], alpha: 0.7 * m3 });
          g.line(968, 574, 1062, 604, { color: COL, w: 2, dash: [5, 6], alpha: 0.7 * m3 });
          g.withAlpha(S.tp(tOne - 0.4, 0.8), () => { g.text('Induction', 450, 716, { size: 32, role: 'display', color: PAL.ink, align: 'center' }); g.text('from one case', 450, 750, { size: 22, color: PAL.ink2, align: 'center' }); g.math('n = 1', 450, 806, { size: 40, color: COL, align: 'center' }); });
          g.withAlpha(S.tp(tAb - 0.2, 0.8), () => { g.text('Abduction', 1130, 716, { size: 32, role: 'display', color: PAL.ink, align: 'center' }); g.text('lovely, but its rival', 1130, 750, { size: 22, color: PAL.ink2, align: 'center' }); g.text('was never tested', 1130, 780, { size: 22, color: PAL.ink2, align: 'center' }); });
          cow(g, 752, 782, 76, PAL.violet, { alpha: S.tp(tU - 0.8, 0.8) });
          caps(g, 'cattle removed', 752, 846, { color: PAL.violet, align: 'center', alpha: S.tp(tU - 0.6, 0.8) });
          stamp(g, 'UNTESTED', 896, 786, PAL.coral, S.tp(tU + 0.2, 0.5), -0.1, 24);
        });
      },
      terms: [
        { beat: 0.5, term: 'Deduction', def: 'Inference in which true premises guarantee a true conclusion; truth-preserving but not ampliative.' },
        { beat: 0.7, term: 'Validity and soundness', def: 'An argument is valid if its conclusion must follow from its premises, and sound if it is valid and its premises are true.' },
        { beat: 1.35, term: 'Induction', def: 'Ampliative inference from observed cases to general conclusions or unobserved cases; fallible.' },
        { beat: 1.7, term: 'Problem of induction', def: 'Hume’s argument that induction cannot be justified without circularly assuming that nature is uniform.' },
        { beat: 2.45, term: 'Abduction', def: 'Inference from a surprising observation to the hypothesis that would best explain it (Peirce); inference to the best explanation (Lipton).' },
      ],
    },
    {
      id: 'infer-strong', title: 'Strong inference', register: 'infer',
      beats: [
        { t: 'Science runs the three together. The hypothetico-deductive method takes a hypothesis, deduces what should be observed if it is true, and checks. In Yellowstone, aspen grew taller after wolves returned. The abduction: wolves did it.',
          v: 'Cycle diagram: HYPOTHESIS → deduce PREDICTION → OBSERVE → evaluate → back. Aspen stems rising at the OBSERVE node.' },
        { t: 'But how? If fear kept elk away from risky places, browsing should drop most where wolves hunt. If wolves simply reduced elk numbers, recovery should track elk density everywhere. Two mechanisms, two different predictions, testable in the field.',
          v: 'Split map: left, browsing low only in “risky” patches near wolf icons; right, browsing falling everywhere as elk dots thin.' },
        { t: 'In 1890, Thomas Chamberlin urged scientists to hold multiple working hypotheses, so they would not fall in love with one. In 1964, John Platt called the method strong inference: devise rival hypotheses, design experiments that exclude some, and repeat. In 2015, Adam Ford and Jacob Goheen asked trophic-cascade research to do exactly that.',
          cite: 'Chamberlin 1890; Platt 1964; Ford & Goheen 2015',
          v: 'A branching tree of hypotheses; each test prunes branches until one stands.' },
      ],
      init() {
        const r = U.rng(323); const NX = 9, NY = 7, CS = 60;
        // Split map: two wolf-hunting hotspots on the same landscape.
        const hot = [[2.2, 1.8], [6.4, 4.6]];
        const cells = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) cells.push({ i, j, risk: Math.max(...hot.map(([hx, hy]) => Math.exp(-((i - hx) ** 2 + (j - hy) ** 2) / (2 * 1.2 ** 2)))), n: (r() - 0.5) * 0.12, leaf: r() * 6.28 });
        const safe = cells.filter((c) => c.risk < 0.1);
        const elk = []; for (let k = 0; k < 22; k++) { const c0 = cells[Math.floor(r() * cells.length)], c1 = safe[Math.floor(r() * safe.length)]; elk.push({ x0: (c0.i + 0.2 + r() * 0.6) * CS, y0: (c0.j + 0.2 + r() * 0.6) * CS, x1: (c1.i + 0.2 + r() * 0.6) * CS, y1: (c1.j + 0.2 + r() * 0.6) * CS, th: k < 15 ? 0.05 + r() * 0.8 : 9, ph: r() * 20 }); }
        const stems = []; for (let k = 0; k < 6; k++) stems.push({ x: 628 + k * 21 + (r() - 0.5) * 6, h0: 26 + r() * 16, g: 44 + r() * 46, leaf: r() * 6.28 });
        // Hypothesis tree: cut = test that excludes the node (0 = survives).
        const N = {
          R: { x: 492, y: 585 },
          A: { x: 640, y: 330, p: 'R', cut: 1, lab: 'A' }, B: { x: 640, y: 500, p: 'R', cut: 2, lab: 'B' }, C: { x: 640, y: 670, p: 'R', cut: 0, lab: 'C' }, D: { x: 640, y: 840, p: 'R', cut: 1, lab: 'D' },
          B1: { x: 840, y: 420, p: 'B', cut: 2, lab: 'B1' }, B2: { x: 840, y: 535, p: 'B', cut: 2, lab: 'B2' }, C1: { x: 840, y: 640, p: 'C', cut: 0, lab: 'C1' }, C2: { x: 840, y: 770, p: 'C', cut: 2, lab: 'C2' },
          C1a: { x: 1040, y: 580, p: 'C1', cut: 0, lab: 'C1a' }, C1b: { x: 1040, y: 700, p: 'C1', cut: 3, lab: 'C1b' },
          F: { x: 1222, y: 580, p: 'C1a', cut: 0 },
        };
        for (const k in N) { const n = N[k]; if (!n.p) continue; const q = N[n.p]; n.pts = []; for (let s = 0; s <= 24; s++) { const u = s / 24, v = u * u * (3 - 2 * u); n.pts.push([lerp(q.x, n.x, u), lerp(q.y, n.y, v)]); } n.lvl = k.length === 1 ? (k === 'F' ? 4 : 1) : k.length === 2 ? 2 : 3; }
        return { cells, elk, hot, stems, NX, NY, CS, N };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: the hypothetico-deductive cycle, with the three gears turning together at its centre.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tHD = cue(S, 0, 'hypothetico-deductive'), tH = cue(S, 0, 'takes a hypothesis'), tP = cue(S, 0, 'deduces what'), tO = cue(S, 0, 'and checks'), tY = cue(S, 0, 'In Yellowstone'), tW = cue(S, 0, 'after wolves returned'), tAb = cue(S, 0, 'The abduction');
          caps(g, 'Hypothetico-deductive method', 110, 262, { color: COL, alpha: S.tp(tHD - 0.3, 0.8) });
          const node = (lab, x, y, a, col = PAL.ink2) => { if (a <= 0) return; g.rect(x - 118, y - 29, 236, 58, { r: 29, fill: U.rgba(col, 0.1), stroke: col, w: 2, alpha: a }); caps(g, lab, x, y + 7, { size: 19, color: PAL.ink, align: 'center', alpha: a }); };
          const ab = S.tp(tAb, 0.8);
          node('Hypothesis', 660, 330, S.tp(tH - 0.2, 0.7), U.mix(PAL.ink2, COL, ab));
          node('Prediction', 960, 585, S.tp(tP + 0.6, 0.7));
          node('Observation', 660, 840, S.tp(tO + 0.4, 0.7), PAL.moss);
          node('Evaluation', 360, 585, S.tp(tO + 1.4, 0.7));
          const E = [[790, 338, 960, 548, tP, 'deduction', 932, 418, 'left'], [960, 622, 790, 832, tO, 'test', 932, 774, 'left'], [530, 832, 360, 622, tO + 0.9, 'induction', 388, 774, 'right'], [360, 548, 530, 338, tO + 1.9, 'abduction', 388, 418, 'right']];
          E.forEach(([x1, y1, x2, y2, tt, lab, lx, ly, al], k) => {
            const hi = k === 3 ? ab : 0;
            if (hi > 0) g.carrow(x1, y1, x2, y2, -0.28, { color: COL, w: 9, alpha: 0.18 * hi, head: 0 });
            g.carrow(x1, y1, x2, y2, -0.28, { color: U.mix(PAL.ink2, COL, hi), w: 2.6 + 1.6 * hi, head: 14, progress: S.tp(tt, 0.9) });
            g.text(lab, lx, ly, { size: 23, italic: true, color: k === 1 ? PAL.ink2 : COL, align: al, alpha: S.tp(tt + 0.5, 0.7) });
          });
          // Three meshed gears: deduction, induction, abduction run together.
          const ga = S.p(0, 0.9, 0.4); const sp = t * 0.8;
          [595, 660, 725].forEach((x, k) => gear(g, x, 585, 34, 10, (k % 2 ? -sp + Math.PI / 10 : sp), { color: COL, alpha: ga, fillA: 0.16 }));
          caps(g, 'run together', 660, 650, { color: COL, align: 'center', alpha: ga });
          // Aspen rising at the observation node, after wolves returned.
          const gr = ease.inOut(ramp(t, tY, 3.2));
          D.stems.forEach((st) => {
            const a = S.tp(tY - 0.3, 0.6); if (a <= 0) return; const h = st.h0 + st.g * gr, top = 806 - h;
            g.line(st.x, 806, st.x, top, { color: PAL.snow, w: 2.4, alpha: 0.75 * a });
            for (let k = 0; k < 3; k++) { const q = st.leaf + k * 2.1; g.ellipse(st.x + Math.cos(q) * 6, top + Math.sin(q) * 4 - 2, 5.2, 3.6, { rot: q, fill: PAL.moss, alpha: 0.85 * a }); }
            if (gr > 0.6) g.glow(st.x, top, 18, PAL.moss, 0.4 * (gr - 0.6));
          });
          g.icon('wolf', 588, 788, 44, PAL.coral, { alpha: S.tp(tW, 0.8) });
          // The abduction: wolves did it.
          g.withAlpha(ab, () => { g.icon('wolf', 832, 324, 58, PAL.coral); g.text('Wolves did it.', 872, 340, { size: 36, role: 'display', italic: true, color: PAL.ink }); });
        });

        // ---- Beat 2: two mechanisms, two predictions on the same landscape.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tF = cue(S, 1, 'If fear kept'), tD = cue(S, 1, 'If wolves simply'), tTwo = cue(S, 1, 'two different predictions'), tTest = cue(S, 1, 'testable');
          const pL = ease.inOut(ramp(t, tF + 0.6, 3.2)), pR = ease.inOut(ramp(t, tD + 0.4, 3.4)), CS = D.CS, OY = 300;
          [[110, 'If fear drives it', PAL.coral, tF], [750, 'If fewer elk drive it', PAL.sand, tD]].forEach(([ox, lab, col, tt], m) => {
            const aM = S.p(1, 0.8, 0.2 + m * 0.3);
            caps(g, lab, ox, 272, { color: col, alpha: S.tp(tt - 0.3, 0.7) });
            g.rect(ox - 4, OY - 4, D.NX * CS + 8, D.NY * CS + 8, { r: 8, stroke: PAL.rule, w: 1.4, alpha: aM });
            D.cells.forEach((c) => {
              const rec = clamp((m ? 0.08 + 0.5 * pR : 0.08 + 0.86 * c.risk * pL) + c.n, 0, 1); const x = ox + c.i * CS, y = OY + c.j * CS;
              g.rect(x + 3, y + 3, CS - 6, CS - 6, { r: 6, fill: U.rgba(U.mix(PAL.clay, PAL.moss, rec), 0.1 + 0.26 * rec), alpha: aM });
              const h = lerp(10, 38, rec), sx = x + CS / 2, sy = y + CS - 9; const col = U.mix(PAL.ink3, PAL.moss, rec);
              g.line(sx, sy, sx, sy - h, { color: col, w: 2.2, alpha: aM });
              for (let k = 0; k < 3; k++) { const q = c.leaf + k * 2.1; g.ellipse(sx + Math.cos(q) * 5, sy - h + Math.sin(q) * 3.5 - 1, 4.4, 3, { rot: q, fill: col, alpha: aM * (0.4 + 0.6 * rec) }); }
            });
            D.hot.forEach(([hx, hy]) => { const wx = ox + (hx + 0.5) * CS, wy = OY + (hy + 0.5) * CS; g.glow(wx, wy, 70, PAL.coral, (m ? 0.1 : 0.22) * aM); g.icon('wolf', wx, wy - 4, 46, PAL.coral, { alpha: aM }); });
            D.elk.forEach((e) => {
              const w1 = U.noise1(t * 0.35 + e.ph, 7) * 7, w2 = U.noise1(t * 0.35 + e.ph, 9) * 7;
              const x = ox + (m ? e.x0 : lerp(e.x0, e.x1, pL)) + w1, y = OY + (m ? e.y0 : lerp(e.y0, e.y1, pL)) + w2;
              const a = m ? 1 - clamp((pR - e.th) / 0.12) : 1; g.dot(x, y, 5.5, PAL.sand, aM * a, 2.2);
            });
          });
          g.text('Browsing drops most where wolves hunt', 380, 778, { size: 22, color: PAL.ink, align: 'center', alpha: S.tp(tF + 2.6, 0.8) });
          g.text('Browsing falls everywhere, with elk density', 1020, 778, { size: 22, color: PAL.ink, align: 'center', alpha: S.tp(tD + 2.6, 0.8) });
          g.text('≠', 700, 540, { size: 72, role: 'display', color: COL, align: 'center', alpha: S.tp(tTwo, 0.8) });
          const aLg = S.p(1, 0.8, 1.0);
          g.rect(470, 834, 18, 18, { r: 4, fill: U.rgba(PAL.clay, 0.45), alpha: aLg }); g.text('heavy browsing', 498, 850, { size: 21, color: PAL.ink2, alpha: aLg });
          g.rect(690, 834, 18, 18, { r: 4, fill: U.rgba(PAL.moss, 0.6), alpha: aLg }); g.text('light browsing', 718, 850, { size: 21, color: PAL.ink2, alpha: aLg });
          g.dot(905, 843, 5.5, PAL.sand, aLg, 2.2); g.text('elk', 920, 850, { size: 21, color: PAL.ink2, alpha: aLg });
          caps(g, 'testable in the field', 700, 898, { color: COL, align: 'center', alpha: S.tp(tTest - 0.2, 0.8) });
        });

        // ---- Beat 3: multiple working hypotheses, pruned by strong inference.
        const a2 = S.p(2, 0.9, 0.2);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tCh = cue(S, 2, 'Thomas Chamberlin'), tMW = cue(S, 2, 'multiple working'), tLove = cue(S, 2, 'fall in love'), tPl = cue(S, 2, 'John Platt'), tDev = cue(S, 2, 'devise rival'), tExc = cue(S, 2, 'design experiments'), tRep = cue(S, 2, 'and repeat'), tFG = cue(S, 2, 'Adam Ford'), tEx = cue(S, 2, 'exactly that');
          // Left column
          g.withAlpha(S.tp(tCh - 0.3, 0.8), () => { caps(g, 'Chamberlin, 1890', 110, 300, { color: COL }); g.wrap('Hold multiple working hypotheses', 110, 336, 300, { size: 24, color: PAL.ink, lh: 1.25 }); });
          g.text('so as not to fall in love with one', 110, 410, { size: 21, italic: true, color: PAL.ink3, alpha: S.tp(tLove, 0.8) });
          g.withAlpha(S.tp(tPl - 0.3, 0.8), () => { caps(g, 'Platt, 1964', 110, 488, { color: COL }); g.text('Strong inference', 110, 528, { size: 34, role: 'display', color: PAL.ink }); });
          [['devise rivals', tDev], ['exclude some', tExc], ['repeat', tRep]].forEach(([s, tt], k) => { const a = S.tp(tt - 0.2, 0.7); g.text(String(k + 1), 116, 574 + k * 36, { size: 21, role: 'mono', color: COL, alpha: a }); g.text(s, 146, 574 + k * 36, { size: 23, color: PAL.ink, alpha: a }); });
          g.withAlpha(S.tp(tFG - 0.3, 0.8), () => {
            caps(g, 'Ford & Goheen, 2015', 110, 720, { color: COL }); g.text('urged it for trophic cascades', 110, 754, { size: 22, color: PAL.ink2 });
            g.icon('wolf', 140, 816, 46, PAL.coral); g.arrow(172, 816, 208, 816, { color: PAL.ink3, w: 2, head: 9 }); g.icon('elk', 244, 816, 46, PAL.sand); g.arrow(276, 816, 312, 816, { color: PAL.ink3, w: 2, head: 9 }); g.icon('aspen', 340, 816, 46, PAL.moss);
          });
          // Tree timing
          const grow = { 1: tMW + 0.3, 2: Math.max(tExc + 1.6, tRep - 0.4), 3: tRep + 1.5, 4: tRep + 3.0 };
          const cutT = { 1: tExc + 0.9, 2: tRep + 1.1, 3: tRep + 2.6 };
          const gateT = { 1: tExc + 0.2, 2: tRep + 0.5, 3: tRep + 2.0 };
          [[1, 740], [2, 940], [3, 1136]].forEach(([k, x]) => {
            const p = S.tp(gateT[k], 0.7); if (p <= 0) return; const fl = S.tp(cutT[k], 0.3) * (1 - S.tp(cutT[k] + 0.4, 0.8));
            g.line(x, 290, x, lerp(290, 880, p), { color: U.mix(PAL.ink2, PAL.coral, fl), w: 2 + 2 * fl, dash: [8, 8], alpha: 0.8 });
            caps(g, 'test ' + k, x, 272, { color: COL, align: 'center', alpha: p });
          });
          const N = D.N; const cutA = (n) => (n.cut ? S.tp(cutT[n.cut], 0.6) : 0);
          for (const k in N) {
            const n = N[k]; if (!n.p) continue; const pg = S.tp(grow[n.lvl] + (n.y - 300) / 1800, 0.9); if (pg <= 0) continue; const cu = cutA(n);
            g.poly(n.pts, { color: U.mix(n.lvl === 4 ? COL : PAL.ink2, PAL.ink3, cu), w: n.lvl === 4 ? 3.4 : 2.4, progress: pg, alpha: 1 - 0.65 * cu, dash: cu > 0.5 ? [5, 7] : null });
          }
          const pR = Math.max(S.p(2, 0.8, 0.6), S.tp(tMW - 0.3, 0.8));
          g.circle(N.R.x, N.R.y, 34, { fill: U.rgba(PAL.moss, 0.15), stroke: PAL.moss, w: 2, alpha: pR }); g.icon('aspen', N.R.x, N.R.y + 2, 46, PAL.moss, { alpha: pR });
          caps(g, 'aspen taller', N.R.x, N.R.y + 62, { color: PAL.moss, align: 'center', alpha: pR });
          for (const k in N) {
            const n = N[k]; if (!n.lab) continue; const pa = S.tp(grow[n.lvl] + (n.y - 300) / 1800 + 0.6, 0.5); if (pa <= 0) continue; const cu = cutA(n);
            const col = U.mix(PAL.ink, PAL.ink3, cu);
            g.circle(n.x, n.y, 25, { fill: PAL.bg, alpha: pa }); g.circle(n.x, n.y, 25, { fill: U.rgba(COL, 0.12 * (1 - cu)), stroke: U.mix(COL, PAL.ink3, cu), w: 2, alpha: pa * (1 - 0.5 * cu) });
            g.text(n.lab, n.x, n.y + 7, { size: n.lab.length > 2 ? 17 : 20, weight: 600, color: col, align: 'center', alpha: pa * (1 - 0.5 * cu) });
            if (cu > 0) { const s = 11 * cu; g.line(n.x - s + 26, n.y - s - 18, n.x + s + 26, n.y + s - 18, { color: PAL.coral, w: 3 }); g.line(n.x + s + 26, n.y - s - 18, n.x - s + 26, n.y + s - 18, { color: PAL.coral, w: 3 }); }
          }
          // Heart: do not fall in love with one hypothesis.
          const hA = S.tp(tLove - 0.2, 0.6); if (hA > 0) g.withAlpha(hA, () => { g.with(() => { const c = g.ctx; c.translate(N.C.x + 44, N.C.y - 24); c.scale(0.9, 0.9); c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-16, -4, -10, -18, 0, -10); c.bezierCurveTo(10, -18, 16, -4, 0, 8); c.fillStyle = PAL.rose; c.fill(); }); g.line(N.C.x + 30, N.C.y - 10, N.C.x + 58, N.C.y - 38, { color: PAL.ink, w: 2.4, progress: S.tp(tLove + 0.9, 0.4) }); });
          // The survivor stands (for now).
          const fA = S.tp(grow[4] + 0.4, 0.8);
          if (fA > 0) { g.glow(N.F.x, N.F.y, 64, COL, 0.55 * fA * (0.85 + 0.15 * Math.sin(t * 3))); g.dot(N.F.x, N.F.y, 13, COL, fA, 2.4); caps(g, 'stands, for now', N.F.x - 6, N.F.y + 52, { color: COL, align: 'center', alpha: fA }); }
          g.text('…and repeat', 1222, 852, { size: 22, italic: true, color: PAL.ink2, align: 'right', alpha: S.tp(tEx, 0.8) });
        });
      },
      terms: [
        { beat: 0.35, term: 'Hypothetico-deductive method', def: 'Propose a hypothesis, deduce observable consequences, and test them; failure counts against the hypothesis.' },
        { beat: 2.2, term: 'Multiple working hypotheses', def: 'Chamberlin’s method of holding several rival explanations at once to avoid premature attachment to one.' },
        { beat: 2.55, term: 'Strong inference', def: 'Platt’s procedure: devise alternative hypotheses, design crucial experiments that exclude some, and iterate.' },
      ],
    },
  ],
});
})();
