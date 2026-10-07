/* Chapter IV — Popper, falsification, and its limits. Case file: does fear lower elk pregnancy? */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.coral;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the spoken text).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; let txt = b.s || b.t, i = txt.indexOf(phrase); if (i < 0) { txt = b.t; i = txt.indexOf(phrase); } return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / txt.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const ramp = (t, t0, d) => clamp((t - t0) / Math.max(0.001, d));
const check = (g, x, y, s, col, p = 1) => { if (p <= 0) return; g.poly([[x - s * 0.5, y], [x - s * 0.12, y + s * 0.4], [x + s * 0.55, y - s * 0.45]], { color: col, w: Math.max(3, s * 0.16), progress: p }); };
const cross = (g, x, y, s, col, p = 1) => { if (p <= 0) return; g.line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { color: col, w: Math.max(3, s * 0.14), progress: clamp(p * 2) }); g.line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, { color: col, w: Math.max(3, s * 0.14), progress: clamp(p * 2 - 1) }); };
// Rubber stamp that thumps down (p: 0→1).
const stamp = (g, str, x, y, col, p, rot = -0.1, size = 26) => {
  if (p <= 0) return; const s = lerp(1.7, 1, ease.out(p)), a = clamp(p * 1.8);
  g.with(() => { g.ctx.translate(x, y); g.ctx.rotate(rot); g.ctx.scale(s, s); const w = g.measure(str, { size, weight: 700, ls: 4 }) + 30;
    g.rect(-w / 2, -size * 0.95, w, size * 1.9, { r: 6, stroke: col, w: 3, alpha: a }); g.rect(-w / 2 + 5, -size * 0.95 + 5, w - 10, size * 1.9 - 10, { r: 4, stroke: col, w: 1.2, alpha: 0.7 * a });
    g.text(str, 2, size * 0.36, { size, weight: 700, ls: 4, color: col, align: 'center', alpha: a }); });
};
// Black swan: dark body with a pale rim and a red bill.
const blackSwan = (g, x, y, s, a = 1, flip = false) => {
  if (a <= 0) return; g.icon('swan', x, y, s * 1.07, PAL.ink2, { alpha: a, flip }); g.icon('swan', x, y, s, '#121020', { alpha: a, flip });
  g.with(() => { g.ctx.translate(x, y); if (flip) g.ctx.scale(-1, 1); g.ctx.scale(s / 100, s / 100); g.ctx.globalAlpha *= a; g.ctx.fillStyle = PAL.coral; g.ctx.beginPath(); g.ctx.moveTo(34, -44); g.ctx.lineTo(46, -39); g.ctx.lineTo(34, -37); g.ctx.fill(); });
};
// Five-pointed star.
const star = (g, x, y, r, o = {}) => { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } g.poly(pts, { close: true, ...o }); };
// A labelled node pill; returns its half-width.
const pill = (g, str, x, y, o = {}) => {
  const size = o.size || 22, a = o.alpha ?? 1; if (a <= 0) return 0; const w = (o.w || g.measure(str, { size }) + 44), h = o.h || size * 2.3; const col = o.color || PAL.ink2;
  if (o.opaque) g.rect(x - w / 2, y - h / 2, w, h, { r: h / 2, fill: '#16142A', alpha: a });
  g.rect(x - w / 2, y - h / 2, w, h, { r: h / 2, fill: o.fill || U.rgba(col, 0.1), stroke: col, w: o.lw ?? 2, alpha: a });
  if (o.lab) { caps(g, o.lab, x, y - 4, { color: col, align: 'center', size: 15, alpha: a }); g.text(str, x, y + size * 0.9, { size, color: o.tc || PAL.ink, align: 'center', alpha: a }); }
  else g.text(str, x, y + size * 0.36, { size, color: o.tc || PAL.ink, align: 'center', alpha: a });
  return w / 2;
};
// A glowing "blame light" that wanders between points without settling (u: time).
const blame = (g, pts, u, a) => {
  if (a <= 0) return; const n = pts.length, k = Math.floor(u) % n, f = ease.inOut(clamp((u % 1) * 1.6 - 0.3)); const p = pts[k], q = pts[(k + 1) % n];
  const x = lerp(p[0], q[0], f), y = lerp(p[1], q[1], f) - 34 * Math.sin(Math.PI * f);
  g.glow(x, y, 46, PAL.ochre, 0.7 * a); g.dot(x, y, 8, '#FFF2C8', a, 2.6); return [x, y];
};

Theater.chapter({
  id: 'fals', roman: 'IV', title: 'Falsification', color: COL,
  question: 'Can a single failed prediction refute a theory?',
  casefile: { title: 'Does fear lower elk pregnancy?', sketch: 'vial' },
  intro: { t: 'Chapter four. Falsification, and why it is not enough.' },
  scenes: [
    {
      id: 'fals-asym', title: 'Popper’s asymmetry', register: 'infer',
      beats: [
        { t: 'Karl Popper turned Hume’s problem around. No number of white swans proves that all swans are white, but one black swan proves they are not. Verification and falsification are logically asymmetric.',
          cite: 'Popper 1959',
          v: 'A balance: a growing pile of white swans on one pan cannot lift the claim; one black swan on the other tips it.' },
        { t: 'So science, Popper argued, advances by bold conjectures that risk refutation. A theory that survives a severe test is corroborated, never proven. In 1919, Einstein’s theory predicted how far starlight would bend around the sun. It could have failed. It did not.',
          cite: 'Popper 1963',
          v: 'Eclipse diagram: sun disk, a star’s apparent position shifted; predicted and measured deflection marks coincide.' },
        { t: 'Falsifiability became Popper’s criterion for separating science from pseudoscience. A theory that could explain any outcome, whatever happened, explained nothing.',
          v: 'Two theories as nets: one with a single, risky opening; the other catching every possible outcome, labelled “explains everything”.' },
      ],
      init() {
        const r = U.rng(404);
        const pile = []; [5, 4, 3, 2, 1].forEach((n, j) => { for (let i = 0; i < n; i++) pile.push({ dx: (i - (n - 1) / 2) * 42 + (r() - 0.5) * 6, dy: -j * 29, flip: r() < 0.4 }); });
        const slots = []; for (let k = 0; k < 15; k++) slots.push((k - 7) * 33);
        const rain = []; for (let k = 0; k < 40; k++) rain.push({ s: Math.floor(r() * 15), t0: k * 0.32 + r() * 0.2, jx: (r() - 0.5) * 10, rest: r() });
        return { pile, slots, rain };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: the balance of swans.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tPop = cue(S, 0, 'Karl Popper'), tNo = cue(S, 0, 'No number of white'), tBlk = cue(S, 0, 'but one black swan'), tAs = cue(S, 0, 'logically asymmetric');
          g.withAlpha(S.tp(tPop, 0.8), () => { caps(g, 'Karl Popper', 110, 262, { color: COL }); g.text('turned Hume’s problem around', 110, 296, { size: 22, italic: true, color: PAL.ink2 }); });
          const PX = 700, PY = 430, L = 320, HANG = 180;
          const wf = ease.out(ramp(t, tNo - 0.2, 3.6)), tLand = tBlk + 1.3, tip = ease.outBack(ramp(t, tLand, 1.1));
          const th = lerp(-0.07 * wf, 0.3, tip);
          const lx = PX - L * Math.cos(th), ly = PY - L * Math.sin(th), rx = PX + L * Math.cos(th), ry = PY + L * Math.sin(th);
          const lp = ly + HANG, rp = ry + HANG; const aB = S.p(0, 0.9, 0.3);
          // Reference levels: PROVEN (never reached) and REFUTED.
          const aPv = S.tp(tNo + 1.0, 0.8);
          g.line(870, 474, 1180, 474, { color: PAL.moss, w: 1.8, dash: [8, 8], alpha: 0.8 * aPv });
          caps(g, 'proven', 1186, 480, { color: PAL.moss, alpha: aPv });
          g.text('never reached', 1186, 506, { size: 21, italic: true, color: PAL.ink2, alpha: S.tp(tNo + 3.2, 0.8) });
          const aRf = S.tp(tLand + 0.6, 0.8);
          g.line(870, 764, 1180, 764, { color: COL, w: 1.8, dash: [8, 8], alpha: 0.8 * aRf });
          caps(g, 'refuted', 1186, 770, { color: COL, alpha: aRf });
          // Stand, beam and pans.
          g.withAlpha(aB, () => {
            g.line(PX, PY, PX, 866, { color: PAL.ink2, w: 4 });
            g.poly([[PX - 70, 880], [PX + 70, 880], [PX + 40, 862], [PX - 40, 862]], { fill: U.rgba(PAL.ink2, 0.35), color: PAL.ink2, w: 2, close: true });
            g.poly([[PX, PY - 4], [PX - 16, PY + 26], [PX + 16, PY + 26]], { fill: PAL.ink2, color: null, w: 0, close: true });
            g.line(lx, ly, rx, ry, { color: PAL.ink, w: 5 });
            g.circle(PX, PY, 7, { fill: PAL.ink }); g.circle(lx, ly, 5, { fill: PAL.ink }); g.circle(rx, ry, 5, { fill: PAL.ink });
            for (const [ex, ey, py] of [[lx, ly, lp], [rx, ry, rp]]) {
              g.line(ex, ey, ex - 108, py, { color: PAL.ink3, w: 1.6 }); g.line(ex, ey, ex + 108, py, { color: PAL.ink3, w: 1.6 });
              const bowl = []; for (let k = 0; k <= 24; k++) { const u = k / 24; bowl.push([ex - 120 + 240 * u, py + 24 * Math.sin(Math.PI * u)]); }
              g.poly(bowl, { color: PAL.ink, w: 3.2, fill: U.rgba(PAL.ink, 0.06) });
            }
          });
          // The claim, on the right pan.
          const cr = S.tp(tLand + 0.2, 0.6);
          g.withAlpha(S.p(0, 0.8, 0.8), () => {
            g.rect(rx - 116, rp - 58, 232, 54, { r: 5, fill: U.mix('#ECE3CC', '#E8A08E', cr) });
            g.text('All swans are white', rx, rp - 24, { size: 23, role: 'display', color: '#24203A', align: 'center' });
            if (cr > 0) g.poly([[rx - 30, rp - 58], [rx - 16, rp - 40], [rx - 26, rp - 28], [rx - 8, rp - 4]], { color: '#7A2E22', w: 2.6, progress: cr });
          });
          // White swans pile up on the left pan; they cannot lift the claim to proof.
          D.pile.forEach((sw, k) => { const tk = tNo - 0.2 + k * 0.24; if (t < tk) return; const p = S.tp(tk, 0.4); g.icon('swan', lx + sw.dx, lp - 20 + sw.dy - (1 - p) * 30, 44 * lerp(0.5, 1, p), PAL.snow, { alpha: clamp(p * 4), flip: sw.flip }); });
          g.math('n \\to ∞', lx, lp + 76, { size: 34, color: PAL.ink2, align: 'center', alpha: S.tp(tNo + 2.6, 0.8) * (1 - tip * 0.0) });
          // One black swan flies in and tips the balance.
          const q = ease.inOut(ramp(t, tBlk - 0.2, 1.5));
          if (q > 0) { const landY = rp - 88; const bx = lerp(1250, rx + 10, q), by = lerp(250, landY, q) - 70 * Math.sin(Math.PI * q); blackSwan(g, bx, by, 64, clamp(q * 3), true); }
          g.withAlpha(S.tp(tNo + 0.4, 0.8), () => { caps(g, 'verification', 385, 902, { color: PAL.ink2, align: 'center' }); });
          g.withAlpha(S.tp(tBlk + 0.6, 0.8), () => { caps(g, 'falsification', 1015, 902, { color: COL, align: 'center' }); });
          g.withAlpha(S.tp(tAs - 0.2, 0.8), () => { g.text('≠', PX, 312, { size: 64, role: 'display', color: COL, align: 'center' }); caps(g, 'logically asymmetric', PX, 346, { color: COL, align: 'center' }); });
        });

        // ---- Beat 2: bold conjectures; the 1919 eclipse test.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tBold = cue(S, 1, 'bold conjectures'), tSev = cue(S, 1, 'survives a severe test'), tCor = cue(S, 1, 'is corroborated'), tNev = cue(S, 1, 'never proven'), t19 = cue(S, 1, 'In 1919'), tPred = cue(S, 1, 'predicted how far'), tFail = cue(S, 1, 'It could have failed'), tNot = cue(S, 1, 'It did not');
          // Popper's ladder.
          [['Bold conjecture', 312, tBold, COL], ['Severe test', 432, tSev, PAL.ink2], ['Corroborated', 552, tCor, PAL.moss]].forEach(([s, y, tt, col], k) => {
            const a = S.tp(tt - 0.2, 0.7); pill(g, s, 250, y, { w: 290, h: 60, size: 25, color: col, alpha: a });
            if (k) g.arrow(250, y - 86, 250, y - 36, { color: PAL.ink3, w: 2, head: 11, alpha: a });
          });
          const aN = S.tp(tNev - 0.2, 0.7);
          g.text('Proven', 250, 640, { size: 25, color: PAL.ink3, align: 'center', alpha: aN }); g.line(196, 632, 304, 632, { color: COL, w: 3, progress: S.tp(tNev + 0.2, 0.5) });
          g.text('never', 250, 676, { size: 21, italic: true, color: COL, align: 'center', alpha: aN });
          // Eclipse geometry (not to scale).
          const E = [536, 676], C = [900, 676], RS = 62, B = [900, 594], TS = [1250, 570];
          const aSet = 0.35 + 0.65 * S.tp(t19 - 0.3, 0.8), aG = S.p(1, 0.9, 0.4) * aSet;
          caps(g, '1919 eclipse  ·  not to scale', 470, 262, { color: PAL.ink2, alpha: S.tp(t19 - 0.3, 0.8) });
          g.withAlpha(aG, () => {
            g.glow(C[0], C[1], RS * 2.6, PAL.ochre, 0.5); g.glow(C[0], C[1], RS * 1.6, PAL.snow, 0.35);
            g.circle(C[0], C[1], RS, { fill: '#0B0A14' }); g.circle(C[0], C[1], RS, { stroke: U.rgba(PAL.snow, 0.7), w: 1.6 });
            caps(g, 'sun, eclipsed', C[0], C[1] + RS + 44, { color: PAL.ochre, align: 'center' });
            g.circle(E[0], E[1], 22, { fill: U.rgba(PAL.lagoon, 0.35), stroke: PAL.lagoon, w: 2 }); caps(g, 'earth', E[0], E[1] + 54, { color: PAL.lagoon, align: 'center' });
            star(g, TS[0], TS[1], 11, { fill: PAL.snow, color: null, w: 0 }); g.glow(TS[0], TS[1], 30, PAL.snow, 0.5);
          });
          // The bent ray, and where the star appears.
          const pr = S.tp(tPred - 0.2, 1.6);
          const ray = []; for (let k = 0; k <= 40; k++) { const u = k / 40; const a = u < 0.5 ? [lerp(TS[0], B[0], u * 2), lerp(TS[1], B[1], u * 2)] : [lerp(B[0], E[0], u * 2 - 1), lerp(B[1], E[1], u * 2 - 1)]; ray.push(a); }
          for (let k = 18; k <= 22; k++) { const u = (k - 18) / 4; ray[k] = [lerp(ray[17][0], ray[23][0], u), lerp(ray[17][1], ray[23][1], u) - 6 * Math.sin(Math.PI * u)]; }
          g.poly(ray, { color: PAL.snow, w: 2.4, alpha: 0.85, progress: pr });
          const AP = [1250, E[1] + (B[1] - E[1]) * (1250 - E[0]) / (B[0] - E[0])];
          const pa = S.tp(tPred + 1.6, 0.9);
          g.line(B[0], B[1], AP[0], AP[1], { color: COL, w: 2, dash: [6, 7], alpha: 0.9, progress: pa });
          if (pa > 0) { star(g, AP[0], AP[1], 11, { color: COL, w: 2, alpha: pa }); caps(g, 'apparent', 1290, AP[1] - 24, { color: COL, align: 'right', alpha: pa }); }
          caps(g, 'true position', 1290, TS[1] + 40, { color: PAL.ink2, align: 'right', alpha: S.tp(tPred + 0.4, 0.8) });
          if (pa > 0) g.arrow(AP[0] - 26, TS[1] - 6, AP[0] - 26, AP[1] + 8, { color: COL, w: 2, head: 9, alpha: pa });
          // The risky test: a predicted deflection; anything else would refute.
          const RX0 = 820, RX1 = 1270, RY = 360, PRx = 1150, aR = S.tp(tPred + 1.0, 0.8);
          g.withAlpha(aR, () => {
            caps(g, 'deflection of starlight', RX0, 304, { color: PAL.ink2 });
            g.line(RX0, RY, RX1, RY, { color: PAL.ink2, w: 2 });
            g.line(RX0, RY - 8, RX0, RY + 8, { color: PAL.ink2, w: 2 }); g.text('none', RX0, RY + 32, { size: 19, color: PAL.ink3, align: 'center' });
            g.rect(PRx - 18, RY - 14, 36, 28, { r: 4, fill: U.rgba(PAL.moss, 0.25), stroke: PAL.moss, w: 1.6 });
            g.text('predicted', PRx, RY + 38, { size: 21, color: PAL.moss, align: 'center' });
          });
          const fz = S.tp(tFail - 0.1, 0.8);
          if (fz > 0) { g.rect(RX0 + 2, RY - 7, (PRx - 20 - RX0 - 2) * fz, 14, { fill: U.rgba(COL, 0.4) }); g.rect(PRx + 20, RY - 7, (RX1 - PRx - 20) * fz, 14, { fill: U.rgba(COL, 0.4) }); caps(g, 'would refute', (RX0 + PRx) / 2 + 20, RY + 34, { color: COL, align: 'center', alpha: fz }); }
          const mz = ease.out(ramp(t, tNot - 0.6, 1.2));
          if (mz > 0) { const mx = lerp(RX0 + 30, PRx + 2, mz); g.line(mx, RY - 18, mx, RY + 16, { color: PAL.ink, w: 2 }); g.dot(mx, RY, 7, PAL.ink, 1, 2.6); caps(g, 'measured', mx, RY - 34, { color: PAL.ink, align: 'center', alpha: S.tp(tNot + 0.4, 0.6) }); check(g, PRx + 46, RY + 2, 22, PAL.moss, S.tp(tNot + 0.6, 0.5)); }
        });

        // ---- Beat 3: falsifiability. Two theories as nets over the possible outcomes.
        const a2 = S.p(2, 0.9, 0.2);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tCrit = cue(S, 2, 'separating science'), tAny = cue(S, 2, 'could explain any outcome'), tNoth = cue(S, 2, 'explained nothing');
          const TOP = 340, NETY = 590;
          [[390, 'Falsifiable', COL], [1010, 'Unfalsifiable', PAL.violet]].forEach(([cx, lab, col], m) => {
            const aP = S.p(2, 0.8, 0.3 + m * 0.5);
            caps(g, lab, cx, 272, { color: col, align: 'center', alpha: aP });
            caps(g, 'possible outcomes', cx - 260, TOP - 30, { size: 15, alpha: aP });
            D.slots.forEach((dx) => g.circle(cx + dx, TOP, 8, { stroke: PAL.ink3, w: 1.6, alpha: aP }));
          });
          // Left: a net that forbids almost everything, with one risky opening.
          const cx = 390, gap0 = 2 * 33 - 16, gap1 = 3 * 33 + 16, pN = S.p(2, 1.2, 0.8);
          g.withAlpha(pN, () => {
            for (const [x0, x1] of [[cx - 262, cx + gap0], [cx + gap1, cx + 262]]) {
              g.rect(x0, NETY - 13, x1 - x0, 26, { fill: U.rgba(COL, 0.12), stroke: COL, w: 1.6 });
              g.clip(x0, NETY - 13, x1 - x0, 26, () => { for (let x = x0 - 26; x < x1 + 26; x += 13) { g.line(x, NETY - 13, x + 26, NETY + 13, { color: COL, w: 1, alpha: 0.6 }); g.line(x + 26, NETY - 13, x, NETY + 13, { color: COL, w: 1, alpha: 0.6 }); } });
            }
            D.slots.forEach((dx, k) => { const ok = k === 9 || k === 10; g.line(cx + dx, TOP + 12, cx + dx, NETY - 18, { color: ok ? PAL.moss : U.rgba(COL, 0.5), w: ok ? 2 : 1.2, dash: ok ? null : [3, 6] }); });
            caps(g, 'forbidden', cx - 262, NETY + 46, { color: COL }); g.text('outcomes here would refute', cx - 262, NETY + 76, { size: 21, color: PAL.ink2 });
            caps(g, 'one opening', cx + 82, NETY + 46, { color: PAL.moss, align: 'center' });
          });
          // An outcome that passes through the opening: the theory survives.
          const tD = S.b(2) + 2.2, fd = ease.in(ramp(t, tD, 1.3));
          if (t > tD) { const x = cx + D.slots[9], y = lerp(TOP, 760, fd); g.dot(x, y, 8, PAL.ink, 1, 2.4); if (fd >= 1) { check(g, x + 32, 760, 22, PAL.moss, S.tp(tD + 1.3, 0.5)); g.text('survived a risky test', x, 812, { size: 21, color: PAL.moss, align: 'center', alpha: S.tp(tD + 1.5, 0.6) }); } }
          // Right: a bag that catches every outcome.
          const cx2 = 1010, bag = (x) => 470 + 300 * Math.sqrt(Math.max(0, 1 - Math.pow((x - cx2) / 270, 2)));
          const pB = S.p(2, 1.2, 1.3);
          g.withAlpha(pB, () => {
            const pts = []; for (let k = 0; k <= 40; k++) { const x = cx2 - 270 + 540 * k / 40; pts.push([x, bag(x)]); }
            g.poly(pts, { color: PAL.violet, w: 2.4, fill: U.rgba(PAL.violet, 0.08) });
            for (let k = 1; k < 10; k++) { const x = cx2 - 270 + 54 * k; g.line(x, 470, x, bag(x), { color: PAL.violet, w: 1, alpha: 0.4 }); }
            for (let y = 520; y < 770; y += 50) { const hw = 270 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 470) / 300, 2))); g.line(cx2 - hw, y, cx2 + hw, y, { color: PAL.violet, w: 1, alpha: 0.4 }); }
            g.line(cx2 - 270, 470, cx2 + 270, 470, { color: PAL.violet, w: 2.4 });
          });
          const tR = Math.min(tAny - 0.8, S.b(2) + 3.2);
          D.rain.forEach((d) => {
            const t0 = tR + d.t0; if (t < t0) return; const x = cx2 + D.slots[d.s] + d.jx, yEnd = bag(x) - 10 - d.rest * 50; const y = Math.min(yEnd, TOP + (t - t0) * 520);
            g.dot(x, y, 6, PAL.ink2, 0.9, 2);
          });
          const tX = tAny + 0.6, xa = S.tp(tX, 0.8), xn = S.tp(tNoth, 0.8);
          g.text('explains everything', cx2, 842, { size: 30, role: 'display', italic: true, color: U.mix(PAL.ink, PAL.ink3, xn), align: 'center', alpha: xa });
          if (xn > 0) { g.line(cx2 - 128, 832, cx2 - 128 + 256 * S.tp(tNoth, 0.5), 832, { color: COL, w: 3 }); g.text('…and so explains nothing', cx2, 884, { size: 30, role: 'display', italic: true, color: COL, align: 'center', alpha: xn }); }
          // Demarcation line.
          const dm = S.tp(tCrit - 0.2, 1.0);
          g.line(700, 250, 700, lerp(250, 900, dm), { color: PAL.ink3, w: 1.6, dash: [6, 8] });
          g.withAlpha(S.tp(tCrit + 0.6, 0.8), () => { caps(g, 'science', 682, 238, { color: PAL.ink, align: 'right' }); caps(g, 'pseudoscience', 718, 238, { color: PAL.ink }); });
        });
      },
      terms: [
        { beat: 0.85, term: 'Logical asymmetry', def: 'No finite set of confirming instances proves a universal claim, but one genuine counterinstance refutes it.' },
        { beat: 1.4, term: 'Corroboration', def: 'Popper’s term for a theory’s record of surviving severe attempts at refutation; not proof or probability.' },
        { beat: 2.3, term: 'Falsifiability', def: 'The property of a theory that some possible observation would contradict it; Popper’s mark of science.' },
      ],
    },
    {
      id: 'fals-fear', title: 'Case file: does fear lower pregnancy?', register: 'observe',
      beats: [
        { t: 'Here is a bold conjecture. Wolves reduce elk numbers not only by killing them but by frightening them: vigilant, stressed elk eat less and conceive less. In 2007, Scott Creel and colleagues reported that elk progesterone fell as wolves became more numerous relative to elk.',
          cite: 'Creel et al. 2007',
          v: 'Case-file card (blood vial). Scatterplot: elk-to-wolf ratio on x, progesterone on y, a positive trend.' },
        { t: 'Later studies measured pregnancy directly, from hunter-killed cows and from blood samples of live elk. Pregnancy rates were uniformly high, whatever the wolf risk. And collared elk met wolves too rarely for fear to disrupt their foraging.',
          cite: 'White et al. 2011; Proffitt et al. 2014; Middleton et al. 2013',
          v: 'A second panel: direct pregnancy rates as a flat, high band across low to high risk; encounter clock showing rare meetings.' },
        { t: 'Is the fear hypothesis falsified? Not quite. The first test assumed that progesterone indexes pregnancy, and that the elk-to-wolf ratio measures risk. If either auxiliary was wrong, the hypothesis survives. Fear effects are well documented in behavior, but not yet shown to change elk demography.',
          cite: 'Wilmers et al. 2025',
          v: 'The hypothesis node with two auxiliary nodes wired to it; the refuting arrow hits the bundle, and the blame light hovers between nodes.' },
      ],
      init() {
        const r = U.rng(414);
        const pts = []; for (let k = 0; k < 34; k++) { const x = 0.05 + 0.9 * r(); pts.push({ x, y: clamp(0.22 + 0.55 * x + U.gauss(r) * 0.075, 0.04, 0.96), d: r() }); }
        const preg = []; for (let k = 0; k < 28; k++) preg.push({ x: 0.04 + 0.92 * r(), y: clamp(0.87 + U.gauss(r) * 0.03, 0.76, 0.97), m: k % 2, d: r() });
        return { pts, preg, enc: [0.27, 0.74] };
      },
      draw(g, t, S, D) {
        g.casefile(96, 226, 270, 156, { title: 'Does fear lower elk pregnancy?', no: 'IV', sketch: 'vial', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });
        // ---- Beat 1: the conjecture (left) and the progesterone index (right).
        const tBold = cue(S, 0, 'bold conjecture'), tFr = cue(S, 0, 'frightening them'), tVig = cue(S, 0, 'vigilant'), tEat = cue(S, 0, 'eat less'), tCon = cue(S, 0, 'conceive less'), tCr = cue(S, 0, 'In 2007'), tFell = cue(S, 0, 'progesterone fell'), tMore = cue(S, 0, 'more numerous');
        g.withAlpha(1 - S.p(1, 0.6), () => {
          caps(g, 'A bold conjecture', 110, 438, { color: COL, alpha: S.tp(tBold - 0.2, 0.7) });
          const rows = [['wolf', PAL.coral, 'Wolves frighten elk', tFr], ['elk', PAL.sand, 'Vigilant, stressed elk', tVig], ['grass', PAL.moss, 'eat less', tEat], ['vial', PAL.sand, 'and conceive less', tCon]];
          rows.forEach(([ic, col, s, tt], k) => {
            const y = 500 + k * 98, a = S.tp(tt - 0.3, 0.7);
            g.icon(ic, 142, y, ic === 'vial' ? 44 : 52, col, { alpha: a, bg: PAL.bg });
            g.text(s, 192, y + 8, { size: 23, color: PAL.ink, alpha: a });
            if (k) g.arrow(142, y - 70, 142, y - 34, { color: PAL.ink3, w: 2, head: 10, alpha: a });
          });
        });
        // Progesterone chart; it shrinks to a thumbnail in the left column when direct measures arrive.
        const m = S.io(1, 1.3), aCh = S.p(0, 0.9, 0.4) * (1 - S.p(2, 0.6));
        if (aCh > 0) g.withAlpha(aCh, () => {
          const bx = lerp(570, 140, m), by = lerp(300, 476, m), bw = lerp(690, 240, m), bh = lerp(450, 150, m);
          const A = g.axes({ x: bx, y: by, w: bw, h: bh, progress: S.p(0, 1.2, 0.6), arrows: m < 0.5 });
          g.withAlpha(1 - S.p(1, 0.45), () => {
            g.text('Elk : wolf ratio', bx + bw, by + bh + 40, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(0, 0.8, 1.0) });
            g.with(() => { g.ctx.translate(bx - 26, by); g.ctx.rotate(-Math.PI / 2); g.text('Progesterone', 0, 0, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(0, 0.8, 1.0) }); });
            g.text('← more wolves per elk', bx, by + bh + 40, { size: 21, color: PAL.coral, alpha: S.tp(tMore - 0.3, 0.8) });
            caps(g, 'stylized', bx + bw, by - 4, { align: 'right', size: 15 });
          });
          caps(g, 'progesterone index', 110, 452, { color: PAL.ink2, alpha: m });
          D.pts.forEach((p) => { const a = S.tp(tCr + 0.2 + p.d * 2.2, 0.5); if (a > 0) g.dot(A.X(p.x), A.Y(p.y), lerp(6, 3.4, m), PAL.sand, a, 2.2); });
          g.plot(A, (x) => 0.22 + 0.55 * x, { from: 0.04, to: 0.96, color: PAL.ink, w: lerp(3.4, 2, m), progress: S.tp(tFell - 0.4, 1.2) });
          g.withAlpha(S.tp(tFell + 0.6, 0.8) * (1 - S.p(1, 0.45)), () => {
            g.arrow(A.X(0.78), A.Y(0.43) + 30, A.X(0.22), A.Y(0.13) + 30, { color: COL, w: 2.6, head: 13 });
            g.text('progesterone fell', A.X(0.5) + 26, A.Y(0.28) + 62, { size: 23, italic: true, color: COL });
          });
        });

        // ---- Beat 2: direct measures. A flat, high pregnancy band; rare encounters.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tDir = cue(S, 1, 'measured pregnancy directly'), tHK = cue(S, 1, 'hunter-killed'), tBl = cue(S, 1, 'blood samples'), tUni = cue(S, 1, 'uniformly high'), tWh = cue(S, 1, 'whatever the wolf risk'), tEnc = cue(S, 1, 'collared elk');
          const sq = S.tp(tEnc - 0.8, 1.2), aP = S.p(1, 0.9, 1.4);
          const A = g.axes({ x: 490, y: 330, w: lerp(770, 400, sq), h: 390, progress: S.p(1, 1.2, 1.2), xticks: [{ v: 0.06, l: 'low' }, { v: 0.94, l: 'high' }], tickSize: 21 });
          g.withAlpha(aP, () => {
            g.text('Wolf risk', A.x + A.w, A.y + A.h + 64, { size: 22, color: PAL.ink2, align: 'right' });
            g.with(() => { g.ctx.translate(A.x - 26, A.y); g.ctx.rotate(-Math.PI / 2); g.text('Pregnancy rate', 0, 0, { size: 22, color: PAL.ink2, align: 'right' }); });
            caps(g, 'direct measures  ·  stylized', A.x, A.y - 22, { color: PAL.ink2, alpha: S.tp(tDir - 0.4, 0.8) });
          });
          const aU = S.tp(tUni - 0.3, 0.8);
          g.rect(A.X(0), A.Y(0.95), A.X(1) - A.X(0), A.Y(0.79) - A.Y(0.95), { r: 6, fill: U.rgba(PAL.sand, 0.14), stroke: U.rgba(PAL.sand, 0.6), w: 1.4, dash: [6, 6], alpha: aU });
          g.text('uniformly high', A.X(0.5), A.Y(0.62), { size: 26, role: 'display', italic: true, color: PAL.sand, align: 'center', alpha: aU });
          g.arrow(A.X(0.08), A.Y(0.71), A.X(0.92), A.Y(0.71), { color: PAL.ink3, w: 2, head: 12, both: true, alpha: S.tp(tWh, 0.8), progress: S.tp(tWh, 1.0) });
          D.preg.forEach((p) => {
            const a = S.tp((p.m ? tBl : tHK) + p.d * 1.6, 0.5); if (a <= 0) return; const x = A.X(p.x), y = A.Y(p.y);
            if (p.m) g.circle(x, y, 6.5, { fill: U.rgba(PAL.sand, 0.35), stroke: PAL.sand, w: 2, alpha: a }); else g.rect(x - 6, y - 6, 12, 12, { fill: U.rgba(PAL.sand, 0.35), stroke: PAL.sand, w: 2, alpha: a });
          });
          const aL1 = S.tp(tHK - 0.2, 0.7), aL2 = S.tp(tBl - 0.2, 0.7);
          g.rect(490, 816, 13, 13, { fill: U.rgba(PAL.sand, 0.35), stroke: PAL.sand, w: 2, alpha: aL1 }); g.text('hunter-killed cows', 514, 829, { size: 21, color: PAL.ink2, alpha: aL1 });
          g.circle(496, 860, 7, { fill: U.rgba(PAL.sand, 0.35), stroke: PAL.sand, w: 2, alpha: aL2 }); g.text('blood samples, live elk', 514, 867, { size: 21, color: PAL.ink2, alpha: aL2 });
          // Encounter dial: collared elk rarely meet wolves.
          if (sq > 0) g.withAlpha(sq, () => {
            const cx = 1110, cy = 560, R = 140, sw = ease.inOut(ramp(t, tEnc + 0.2, 4.5));
            caps(g, 'collared elk meeting wolves', cx, 372, { color: PAL.ink2, align: 'center' });
            g.circle(cx, cy, R, { fill: U.rgba(PAL.ink, 0.03), stroke: PAL.ink3, w: 2 });
            for (let k = 0; k < 30; k++) { const a = -Math.PI / 2 + k / 30 * Math.PI * 2; g.line(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10), cx + Math.cos(a) * R, cy + Math.sin(a) * R, { color: PAL.ink3, w: 1.6 }); }
            if (sw > 0) g.with(() => { const c = g.ctx; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R - 14, -Math.PI / 2, -Math.PI / 2 + sw * Math.PI * 2); c.closePath(); c.fillStyle = U.rgba(PAL.sand, 0.08); c.fill(); });
            const ha = -Math.PI / 2 + sw * Math.PI * 2; g.line(cx, cy, cx + Math.cos(ha) * (R - 16), cy + Math.sin(ha) * (R - 16), { color: PAL.ink, w: 2.4 });
            D.enc.forEach((f) => { if (sw < f) return; const a = -Math.PI / 2 + f * Math.PI * 2, x = cx + Math.cos(a) * (R + 2), y = cy + Math.sin(a) * (R + 2); g.dot(x, y, 8, PAL.coral, S.tp(tEnc + 0.2 + f * 4.5, 0.3), 3); });
            g.icon('elk', cx, cy + 10, 76, PAL.sand);
            caps(g, 'stylized', cx, cy + R + 34, { size: 15, align: 'center' });
            g.text('Encounters were rare', cx, cy + R + 76, { size: 26, role: 'display', italic: true, color: PAL.coral, align: 'center', alpha: S.tp(tEnc + 2.5, 0.8) });
          });
        });

        // ---- Beat 3: the hypothesis wired to two auxiliaries; the refutation hits the bundle.
        const a2 = S.p(2, 0.9, 0.3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tQ = cue(S, 2, 'Is the fear'), tNQ = cue(S, 2, 'Not quite'), tA1 = cue(S, 2, 'progesterone indexes'), tA2 = cue(S, 2, 'elk-to-wolf ratio measures'), tEi = cue(S, 2, 'If either auxiliary'), tSv = cue(S, 2, 'the hypothesis survives'), tBh = cue(S, 2, 'Fear effects are well'), tDm = cue(S, 2, 'not yet shown');
          g.wrap('Is the fear hypothesis falsified?', 110, 452, 290, { size: 32, role: 'display', color: PAL.ink, lh: 1.2, alpha: S.tp(tQ, 0.8) });
          g.text('Not quite.', 110, 560, { size: 42, role: 'display', italic: true, color: COL, alpha: S.tp(tNQ, 0.8) });
          const aEv = S.tp(tQ + 0.4, 0.8);
          g.rect(100, 632, 300, 98, { r: 8, fill: U.rgba(COL, 0.08), stroke: COL, w: 1.6, alpha: aEv });
          caps(g, 'later, direct measures', 118, 664, { color: COL, alpha: aEv });
          g.text('pregnancy uniformly high', 118, 702, { size: 22, color: PAL.ink, alpha: aEv });
          // Nodes and wires.
          const sv = S.tp(tSv, 0.8);
          const aH = S.tp(tQ - 0.2, 0.8); if (sv > 0) g.glow(870, 392, 150, PAL.moss, 0.25 * sv);
          pill(g, 'Fear lowers elk pregnancy', 870, 392, { w: 430, h: 78, size: 25, lab: 'hypothesis', color: U.mix(PAL.ink2, PAL.moss, sv), alpha: aH });
          const aA1 = S.tp(tA1 - 0.3, 0.8), aA2 = S.tp(tA2 - 0.3, 0.8);
          g.line(800, 432, 690, 570, { color: PAL.ink2, w: 2, progress: aA1 }); g.line(940, 432, 1050, 570, { color: PAL.ink2, w: 2, progress: aA2 });
          pill(g, 'Progesterone indexes pregnancy', 662, 610, { w: 376, h: 76, size: 22, lab: 'auxiliary 1', alpha: aA1 });
          pill(g, 'Elk : wolf ratio measures risk', 1084, 610, { w: 376, h: 76, size: 22, lab: 'auxiliary 2', alpha: aA2 });
          // The bundle, and the refutation hitting it.
          const aBd = S.tp(tA2 + 0.6, 0.9);
          g.rect(454, 320, 834, 352, { r: 16, stroke: PAL.ink2, w: 1.6, dash: [8, 8], fill: U.rgba(PAL.ink, 0.025), alpha: aBd });
          caps(g, 'tested together', 476, 350, { color: PAL.ink2, alpha: aBd });
          const hit = S.tp(tEi - 0.6, 0.6);
          g.arrow(402, 682, 452, 640, { color: COL, w: 3.4, head: 15, progress: hit });
          if (hit >= 1) { const sp = ramp(t, tEi, 1.2); g.circle(454, 640, 10 + 70 * sp, { stroke: COL, w: 2.4, alpha: 1 - sp }); g.rect(454, 320, 834, 352, { r: 16, fill: U.rgba(COL, 0.08 * (1 - sp)) }); }
          blame(g, [[870, 334], [662, 552], [1084, 552]], ramp(t, tEi + 0.4, 99) * 0.85, S.tp(tEi + 0.4, 0.8) * (1 - 0.6 * S.tp(tBh, 0.8)));
          caps(g, 'survives', 1102, 398, { color: PAL.moss, alpha: sv });
          // Verdict
          const aB = S.tp(tBh - 0.2, 0.8), aD = S.tp(tDm - 0.3, 0.8);
          g.rect(454, 742, 406, 112, { r: 10, fill: U.rgba(PAL.moss, 0.08), stroke: PAL.moss, w: 1.6, alpha: aB });
          caps(g, 'behavior', 478, 776, { color: PAL.moss, alpha: aB }); g.text('fear effects well documented', 478, 816, { size: 22, color: PAL.ink, alpha: aB }); check(g, 826, 778, 22, PAL.moss, S.tp(tBh + 0.4, 0.5));
          g.rect(882, 742, 406, 112, { r: 10, fill: U.rgba(PAL.ink, 0.04), stroke: PAL.ink3, w: 1.6, dash: [6, 6], alpha: aD });
          caps(g, 'demography', 906, 776, { color: PAL.ink2, alpha: aD }); g.text('not yet shown to change', 906, 816, { size: 22, color: PAL.ink, alpha: aD });
          g.text('?', 1258, 790, { size: 38, role: 'display', color: PAL.ink2, align: 'center', alpha: aD });
        });
      },
      terms: [
        { beat: 0.6, term: 'Nonconsumptive effects', def: 'Effects of predators on prey through fear: changes in behavior or physiology that may reduce fitness without killing.' },
        { beat: 2.3, term: 'Auxiliary hypothesis', def: 'An assumption, such as how an instrument or index works, needed alongside the main hypothesis to derive a prediction.' },
      ],
    },
    {
      id: 'fals-dq', title: 'Duhem, Quine, and the protective belt', register: 'infer',
      beats: [
        { t: 'Pierre Duhem saw the problem in 1906. A prediction follows from a hypothesis plus auxiliary assumptions, so a failed prediction refutes only the bundle. Willard Quine generalized the point. Logic alone never says which part to blame.',
          s: 'Pierre Doo-em saw the problem in 1906. A prediction follows from a hypothesis plus auxiliary assumptions, so a failed prediction refutes only the bundle. Willard Quine generalized the point. Logic alone never says which part to blame.',
          cite: 'Duhem 1906; Quine 1951',
          v: 'The bundle diagram generalizes: hypothesis plus many auxiliaries; the refutation arrow splashes across all of them.' },
        { t: 'Sometimes blaming an auxiliary is brilliant. When Uranus strayed from its predicted orbit, astronomers proposed an unseen planet and found Neptune. When Mercury strayed, the same move predicted a planet, Vulcan, that does not exist. The fault lay in Newton’s theory.',
          v: 'Orbits: Uranus perturbed, Neptune appears; Mercury’s precessing ellipse, a dashed Vulcan that fades away.' },
        { t: 'Imre Lakatos made the choice principled. A research program has a hard core, protected by a belt of auxiliary hypotheses. Adjusting the belt is progressive if it predicts new facts, and degenerating if it only patches failures. All theories, he noted, are born refuted.',
          s: 'Imre Lak-a-tosh made the choice principled. A research program has a hard core, protected by a belt of auxiliary hypotheses. Adjusting the belt is progressive if it predicts new facts, and degenerating if it only patches failures. All theories, he noted, are born refuted.',
          cite: 'Lakatos 1970',
          v: 'Concentric rings: HARD CORE, PROTECTIVE BELT; an anomaly arrow is absorbed by the belt; the belt either grows a new prediction (green) or a patch (grey).' },
        { t: 'In Yellowstone, after a landscape test found no effect of predation risk on aspen browsing, proponents argued that elk sense risk where they first meet wolves, not where wolves kill them, nearly a kilometer away on average. Lakatos asks: did the adjustment predict anything new?',
          cite: 'Kauffman et al. 2010; Beschta & Ripple 2013',
          v: 'Map: kill sites as dots; encounter sites offset about a kilometer; the belt ring on the right glows amber, undecided.' },
        { t: 'Two cautions. Probabilistic hypotheses cannot be strictly falsified by any single result. And a null hypothesis significance test is not Popperian falsification: rejecting a null of no effect at all is not a risky test of a research hypothesis.',
          cite: 'Johnson 1999; Anderson, Burnham & Thompson 2000',
          v: 'A null distribution with a rejection region; beside it, a bold research prediction as a narrow target. The two are not the same.' },
      ],
      init() {
        const r = U.rng(424);
        // Beat 1: hypothesis + auxiliaries; Quine's wider web of belief around them.
        const WC = [600, 600];
        const aux = ['instruments work', 'index is valid', 'sample is fair', 'model form', 'no confounders', 'background theory'].map((lab, k) => { const a = -Math.PI / 2 + k * Math.PI / 3; return { lab, x: WC[0] + 250 * Math.cos(a), y: WC[1] + 168 * Math.sin(a) }; });
        const web = []; let tries = 0;
        while (web.length < 34 && tries++ < 4000) {
          const x = 120 + r() * 1160, y = 360 + r() * 520; const ex = (x - WC[0]) / 390, ey = (y - WC[1]) / 248;
          if (ex * ex + ey * ey < 1.12) continue; if (x > 1040 && y > 520 && y < 690) continue; if (x > 220 && x < 420 && y < 410) continue; if (web.some((w) => Math.hypot(w.x - x, w.y - y) < 92)) continue;
          web.push({ x, y, d: r() });
        }
        const links = []; web.forEach((w, i) => { const near = web.map((v, j) => [Math.hypot(v.x - w.x, v.y - w.y), j]).filter(([d, j]) => j > i && d < 170).sort((a, b) => a[0] - b[0]).slice(0, 2); near.forEach(([, j]) => links.push([i, j])); });
        // Beat 4: a Yellowstone-like map. Contours, aspen stands, kill sites and encounter sites ~1 km away.
        const MX = 110, MY = 290, MW = 760, MH = 590, KM = 112;
        const hills = [[330, 470, 150], [690, 690, 190], [560, 380, 90]];
        const contours = []; hills.forEach(([hx, hy, hr], h) => { for (let k = 1; k <= 4; k++) { const pts = []; for (let s = 0; s <= 64; s++) { const a = s / 64 * Math.PI * 2, rr = hr * k / 4 * (1 + 0.16 * U.noise1(a * 2 + h * 5 + k, 31)); pts.push([hx + rr * Math.cos(a), hy + rr * 0.7 * Math.sin(a)]); } contours.push(pts); } });
        const stands = []; for (let k = 0; k < 12; k++) stands.push({ x: MX + 60 + r() * (MW - 120), y: MY + 60 + r() * (MH - 140), s: 26 + r() * 10 });
        const kills = []; for (let k = 0; k < 9; k++) { const x = MX + 120 + r() * (MW - 240), y = MY + 110 + r() * (MH - 230); const a = r() * Math.PI * 2, d = KM * (0.8 + 0.4 * r()); kills.push({ x, y, ex: clamp(x + d * Math.cos(a), MX + 30, MX + MW - 30), ey: clamp(y + d * Math.sin(a), MY + 30, MY + MH - 60), d: r() }); }
        const ins = []; for (let k = 0; k < 16; k++) ins.push([0.05 + 0.9 * r(), clamp(0.5 + U.gauss(r) * 0.12, 0.1, 0.9)]);
        return { WC, aux, web, links, MX, MY, MW, MH, KM, contours, stands, kills, ins };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: Duhem. A failed prediction refutes only the bundle.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tPr = cue(S, 0, 'A prediction follows'), tAx = cue(S, 0, 'plus auxiliary'), tFl = cue(S, 0, 'so a failed prediction'), tOnly = cue(S, 0, 'refutes only the bundle'), tQ = cue(S, 0, 'Willard Quine'), tLog = cue(S, 0, 'Logic alone');
          const [cx, cy] = D.WC;
          caps(g, 'Pierre Duhem, 1906', 110, 262, { color: COL, alpha: S.p(0, 0.8, 0.3) });
          caps(g, 'W. V. O. Quine, 1951', 110, 292, { color: COL, alpha: S.tp(tQ - 0.2, 0.8) });
          // Formula.
          const f1 = S.tp(tPr - 0.3, 0.8), f2 = S.tp(tOnly - 0.2, 0.8);
          g.math('H \\; ∧ \\; A_{1} \\; ∧ \\; A_{2} \\; ∧ \\; … \\; ∧ \\; A_{n} \\;\\; \\to \\;\\; P', 700, 282, { size: 38, color: PAL.ink, align: 'center', alpha: f1 * (1 - f2) });
          g.math('¬P \\quad ⇒ \\quad ¬(H \\; ∧ \\; A_{1} \\; ∧ \\; … \\; ∧ \\; A_{n})', 700, 282, { size: 38, color: COL, align: 'center', alpha: f2 });
          // Quine's web of belief.
          const wq = S.tp(tQ - 0.2, 1.2);
          if (wq > 0) {
            D.links.forEach(([i, j]) => { const a = D.web[i], b = D.web[j]; g.line(a.x, a.y, b.x, b.y, { color: PAL.ink3, w: 1, alpha: 0.5 * wq }); });
            D.web.forEach((w) => { const tint = S.tp(tQ + 0.6 + w.d * 1.4, 0.6); g.dot(w.x, w.y, 4.5, U.mix(PAL.ink2, COL, tint * 0.8), wq, 2); });
            caps(g, 'web of belief', 130, 900, { color: PAL.ink2, alpha: wq });
          }
          // Bundle outline.
          const aBd = S.tp(tAx + 0.8, 0.9);
          g.ellipse(cx, cy, 384, 244, { stroke: PAL.ink2, w: 1.6, dash: [8, 8], alpha: aBd });
          caps(g, 'the bundle', cx - 350, cy - 214, { color: PAL.ink2, alpha: aBd });
          // Splash: a coral wave from the failed prediction across every node.
          const tS = tOnly + 0.2; const wave = (x, y) => S.tp(tS + Math.hypot(x - 1000, y - cy) / 700, 0.5);
          const aH = S.p(0, 0.9, 0.8);
          D.aux.forEach((a, k) => { const p = S.tp(tAx + k * 0.18, 0.6); g.line(cx, cy, a.x, a.y, { color: PAL.ink3, w: 1.4, progress: p }); });
          const hw = wave(cx, cy);
          g.circle(cx, cy, 56, { fill: U.rgba(U.mix(PAL.ochre, COL, hw), 0.2), stroke: U.mix(PAL.ochre, COL, hw), w: 2.6, alpha: aH });
          g.math('H', cx, cy + 15, { size: 44, color: PAL.ink, align: 'center', alpha: aH });
          caps(g, 'hypothesis', cx, cy + 84, { color: PAL.ink2, align: 'center', size: 15, alpha: aH });
          D.aux.forEach((a, k) => { const p = S.tp(tAx + k * 0.18, 0.6); const wv = wave(a.x, a.y); pill(g, a.lab, a.x, a.y, { opaque: true, w: 208, h: 46, size: 21, color: U.mix(PAL.ink2, COL, wv), fill: U.rgba(U.mix(PAL.ink2, COL, wv), 0.1 + 0.12 * wv), alpha: p }); });
          // The prediction, which fails.
          const aP = S.tp(tPr + 0.4, 0.8), fl = S.tp(tFl, 0.6);
          g.arrow(988, cy, 1066, cy, { color: PAL.ink2, w: 2.4, head: 13, progress: aP });
          pill(g, 'prediction', 1170, cy, { w: 200, h: 58, size: 23, color: U.mix(PAL.ink2, COL, fl), alpha: aP });
          cross(g, 1170, cy - 64, 28, COL, S.tp(tFl + 0.2, 0.5));
          g.text('fails', 1170, cy + 66, { size: 22, italic: true, color: COL, align: 'center', alpha: fl });
          if (t > tS - 0.6) g.carrow(1090, cy + 34, 990, cy + 30, -0.4, { color: COL, w: 3, head: 13, progress: S.tp(tS - 0.6, 0.6) });
          // Which part to blame? Logic does not say.
          blame(g, [[cx, cy - 64], ...D.aux.map((a) => [a.x, a.y - 30])].filter((_, k) => k % 2 === 0 || k === 1), ramp(t, tLog, 99) * 1.1, S.tp(tLog, 0.8));
          g.text('?', cx + 70, cy - 40, { size: 44, role: 'display', color: PAL.ochre, alpha: S.tp(tLog + 0.6, 0.8) });
        });

        // ---- Beat 2: Uranus and Neptune; Mercury and Vulcan.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tU = cue(S, 1, 'When Uranus'), tUn = cue(S, 1, 'proposed an unseen'), tNep = cue(S, 1, 'found Neptune'), tMe = cue(S, 1, 'When Mercury'), tVu = cue(S, 1, 'Vulcan'), tNo = cue(S, 1, 'does not exist'), tNw = cue(S, 1, 'The fault lay');
          const t1 = t - S.b(1); const aL = S.p(1, 0.9, 0.2), aR = S.tp(tMe - 0.6, 0.9);
          caps(g, 'not to scale', 1290, 262, { size: 15, align: 'right', alpha: aL });
          g.line(700, 300, 700, 890, { color: PAL.rule, w: 1, dash: [4, 8], alpha: aL });
          // Left: Uranus strays; an unseen planet is proposed, and found.
          const [ux, uy] = [380, 590];
          g.withAlpha(aL, () => {
            caps(g, 'blame an auxiliary', 120, 272, { color: PAL.ink2 });
            g.glow(ux, uy, 60, PAL.ochre, 0.6); g.dot(ux, uy, 13, PAL.ochre, 1, 2.2);
            g.circle(ux, uy, 150, { stroke: PAL.ink3, w: 1.6 });
          });
          const st = S.tp(tU, 1.4), th = 0.1 + 0.012 * t1;
          const pth = th - 0.3 * st, px = ux + 150 * Math.cos(pth), py = uy + 150 * Math.sin(pth);
          const ax = ux + (150 + 10 * st) * Math.cos(th), ay = uy + (150 + 10 * st) * Math.sin(th);
          g.withAlpha(aL, () => {
            if (st > 0) { g.circle(px, py, 11, { stroke: PAL.ink2, w: 1.8, dash: [3, 4], alpha: st }); g.text('predicted', px - 20, py - 4, { size: 21, italic: true, color: PAL.ink2, align: 'right', alpha: st }); g.carrow(px + 4, py + 16, ax - 6, ay - 12, 0.2, { color: COL, w: 2, head: 9, alpha: st, progress: S.tp(tU + 0.6, 0.8) }); }
            g.dot(ax, ay, 11, PAL.lagoon, 1, 2.2); g.text('Uranus', ax - 20, ay + 40, { size: 23, color: PAL.lagoon, align: 'right' });
          });
          const pU = S.tp(tUn, 1.0), pN = S.tp(tNep, 0.8); const nth = th - 0.62, nx = ux + 246 * Math.cos(nth), ny = uy + 246 * Math.sin(nth);
          g.circle(ux, uy, 246, { stroke: U.mix(PAL.ink2, PAL.violet, pN), w: 1.6, dash: pN > 0.5 ? null : [6, 8], alpha: pU * aL });
          if (pU > 0) { g.circle(nx, ny, 14, { stroke: PAL.violet, w: 2, dash: [4, 4], alpha: pU * (1 - pN) * aL }); g.text('?', nx, ny + 8, { size: 22, color: PAL.violet, align: 'center', alpha: pU * (1 - pN) * aL }); }
          if (pN > 0) { g.dot(nx, ny, 14, PAL.violet, pN * aL, 2.4); g.text('Neptune', nx - 24, ny - 14, { size: 23, color: PAL.violet, align: 'right', alpha: pN * aL }); check(g, ux, 884, 26, PAL.moss, S.tp(tNep + 0.4, 0.5)); g.text('found', ux + 30, 892, { size: 22, color: PAL.moss, alpha: S.tp(tNep + 0.5, 0.6) * aL }); }
          // Right: Mercury's orbit precesses; Vulcan is proposed, and does not exist.
          const [mx, my] = [1040, 590], aE = 165, e = 0.5, bE = aE * Math.sqrt(1 - e * e), cF = aE * e;
          const orbit = (phi) => { const pts = []; for (let k = 0; k <= 72; k++) { const a = k / 72 * Math.PI * 2, x0 = aE * Math.cos(a) - cF, y0 = bE * Math.sin(a); pts.push([mx + x0 * Math.cos(phi) - y0 * Math.sin(phi), my + x0 * Math.sin(phi) + y0 * Math.cos(phi)]); } return pts; };
          if (aR > 0) g.withAlpha(aR, () => {
            caps(g, 'the same move', 730, 272, { color: PAL.ink2 });
            g.glow(mx, my, 60, PAL.ochre, 0.6); g.dot(mx, my, 13, PAL.ochre, 1, 2.2);
            const pre = 0.5 * ease.inOut(ramp(t, tMe, 4.5));
            for (let k = 0; k < 5; k++) g.poly(orbit(pre * k / 4), { color: PAL.ink3, w: 1.2, alpha: 0.25 + 0.15 * k, close: true });
            g.poly(orbit(0), { color: PAL.ink2, w: 1.4, dash: [5, 7], close: true, alpha: 0.6 });
            const cur = orbit(pre), q = cur[Math.floor((t1 * 6) % 72)];
            g.poly(cur, { color: PAL.lagoon, w: 2, close: true });
            g.dot(q[0], q[1], 8, PAL.lagoon, 1, 2.2);
            const pp = cur[54]; g.text('Mercury', pp[0], pp[1] - 18, { size: 23, color: PAL.lagoon, align: 'center' });
            const pv = S.tp(tVu - 0.3, 0.8), nv = S.tp(tNo, 1.0);
            g.circle(mx, my, 62, { stroke: PAL.ink2, w: 1.6, dash: [5, 6], alpha: pv * (1 - nv) });
            const vx = mx + 62 * Math.cos(t1 * 1.4), vy = my + 62 * Math.sin(t1 * 1.4);
            g.circle(vx, vy, 9, { stroke: PAL.ink, w: 2, dash: [3, 3], alpha: pv * (1 - nv) });
            g.text('Vulcan?', mx, my - 76, { size: 23, italic: true, color: PAL.ink, align: 'center', alpha: pv * (1 - 0.6 * nv) });
            if (nv > 0) { cross(g, mx + 66, my - 84, 20, COL, nv); g.text('no such planet', mx, 886, { size: 22, color: COL, align: 'center', alpha: nv }); }
          });
          const aNw = S.tp(tNw - 0.2, 0.8);
          if (aNw > 0) { g.rect(900, 786, 280, 50, { r: 8, fill: U.rgba(COL, 0.12), stroke: COL, w: 2, alpha: aNw }); g.text('Newton’s theory at fault', 1040, 819, { size: 23, color: PAL.ink, align: 'center', alpha: aNw }); g.poly([[1150, 786], [1160, 798], [1152, 806], [1166, 822]], { color: COL, w: 2.4, progress: S.tp(tNw + 0.5, 0.5) }); }
        });

        // ---- Beat 3: Lakatos. Hard core, protective belt, anomalies absorbed.
        const ring = (cx, cy, s, o = {}) => {
          const a = o.alpha ?? 1; if (a <= 0) return; const r0 = 104 * s, r1 = 222 * s, n = 12;
          for (let k = 0; k < n; k++) {
            const a0 = k / n * Math.PI * 2 + 0.03, a1 = (k + 1) / n * Math.PI * 2 - 0.03; const pts = [];
            for (let q = 0; q <= 8; q++) { const u = lerp(a0, a1, q / 8); pts.push([cx + r1 * Math.cos(u), cy + r1 * Math.sin(u)]); }
            for (let q = 8; q >= 0; q--) { const u = lerp(a0, a1, q / 8); pts.push([cx + r0 * Math.cos(u), cy + r0 * Math.sin(u)]); }
            const tc = o.tile && o.tile[k]; const col = tc ? tc[0] : PAL.ink2, fa = tc ? tc[1] : 0;
            g.poly(pts, { close: true, fill: U.rgba(col, 0.07 + 0.3 * fa), color: U.mix(PAL.ink3, col, fa), w: 1.4, alpha: a * (o.tiles ? clamp(o.tiles * n - k) : 1) });
          }
          g.circle(cx, cy, 92 * s, { fill: U.rgba(COL, 0.28), stroke: COL, w: 2.4, alpha: a * (o.core ?? 1) });
        };
        const a2 = vis(S, 2, 3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tCo = cue(S, 2, 'hard core'), tBe = cue(S, 2, 'protected by a belt'), tAd = cue(S, 2, 'Adjusting the belt'), tPg = cue(S, 2, 'is progressive'), tDg = cue(S, 2, 'degenerating'), tBr = cue(S, 2, 'All theories');
          const cx = 560, cy = 600;
          caps(g, 'Imre Lakatos, 1970', 110, 262, { color: COL, alpha: S.p(2, 0.8, 0.3) });
          const g1 = S.tp(tAd + 0.4, 0.6), pg = S.tp(tPg, 0.8), dg = S.tp(tDg + 0.2, 0.6);
          const tile = {}; tile[10] = [PAL.moss, pg + 0.6 * g1 * (1 - pg)]; tile[5] = [PAL.ink3, dg];
          ring(cx, cy, 1, { alpha: Math.max(0.22 * S.p(2, 1.0, 0.5), S.tp(tCo - 0.4, 0.8)), core: 1, tiles: Math.max(S.p(2, 1.6, 0.5), S.tp(tBe - 0.2, 1.4)), tile });
          caps(g, 'hard core', cx, cy + 6, { color: PAL.ink, align: 'center', alpha: S.tp(tCo - 0.2, 0.8) });
          caps(g, 'protective belt', cx, cy - 240, { color: PAL.ink2, align: 'center', alpha: S.tp(tBe, 0.8) });
          g.text('auxiliary hypotheses', cx, cy + 302, { size: 21, italic: true, color: PAL.ink2, align: 'center', alpha: S.tp(tBe + 0.6, 0.8) });
          // Anomaly 1 → a progressive adjustment that predicts a new fact.
          const ang1 = 10.5 / 12 * Math.PI * 2, hx = cx + 222 * Math.cos(ang1), hy = cy + 222 * Math.sin(ang1);
          g.arrow(hx + 190, hy - 150, hx + 6, hy - 4, { color: COL, w: 3, head: 15, progress: S.tp(tAd - 0.2, 0.7) });
          caps(g, 'anomaly', hx + 200, hy - 160, { color: COL, alpha: S.tp(tAd - 0.2, 0.7) });
          const sx = 1110, sy = 440;
          if (pg > 0) { g.arrow(hx + 20, hy + 26, sx - 30, sy + 8, { color: PAL.moss, w: 3, head: 15, progress: pg }); star(g, sx, sy, 20, { fill: PAL.moss, color: null, w: 0, alpha: S.tp(tPg + 0.7, 0.5) }); g.glow(sx, sy, 50, PAL.moss, 0.5 * S.tp(tPg + 0.7, 0.5)); }
          g.withAlpha(S.tp(tPg + 0.4, 0.8), () => { caps(g, 'progressive', sx - 40, sy + 64, { color: PAL.moss }); g.text('predicts new facts', sx - 40, sy + 96, { size: 22, color: PAL.ink }); });
          // Anomaly 2 → a degenerating patch.
          const ang2 = 5.5 / 12 * Math.PI * 2, dx = cx + 166 * Math.cos(ang2), dy = cy + 166 * Math.sin(ang2);
          g.arrow(dx - 200, dy + 120, dx - 60, dy + 30, { color: COL, w: 3, head: 15, progress: S.tp(tDg - 0.5, 0.6) });
          if (dg > 0) g.with(() => { g.ctx.translate(dx, dy); g.ctx.rotate(ang2 + 0.4); g.rect(-44 * dg, -18, 88 * dg, 36, { r: 4, fill: '#8C8A9E', alpha: 0.9 }); for (const ox of [-26, 0, 26]) g.circle(ox * dg, 0, 2.5, { fill: PAL.bg, alpha: 0.7 * dg }); });
          g.withAlpha(S.tp(tDg + 0.4, 0.8), () => { caps(g, 'degenerating', 120, 852, { color: PAL.ink2 }); g.text('only patches failures', 120, 884, { size: 22, color: PAL.ink }); });
          // Born refuted: anomalies everywhere from the start.
          const br = S.tp(tBr - 0.2, 0.8);
          if (br > 0) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + 0.2, r0 = 236 + 46 * (1 - br); g.line(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a), cx + (r0 + 30) * Math.cos(a), cy + (r0 + 30) * Math.sin(a), { color: COL, w: 2.4, alpha: br * 0.85 }); }
          g.text('All theories are born refuted.', 1080, 760, { size: 34, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: br });
        });

        // ---- Beat 4: Yellowstone. Kill sites vs encounter sites; did the adjustment predict anything new?
        const a3 = vis(S, 3, 4);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tLt = cue(S, 3, 'a landscape test'), tNE = cue(S, 3, 'no effect'), tEn = cue(S, 3, 'where they first meet'), tKl = cue(S, 3, 'not where wolves kill'), tKm = cue(S, 3, 'nearly a kilometer'), tLk = cue(S, 3, 'Lakatos asks');
          const { MX, MY, MW, MH, KM } = D; const aM = S.p(3, 0.9, 0.2);
          g.withAlpha(aM, () => {
            g.rect(MX, MY, MW, MH, { r: 10, stroke: PAL.rule, w: 1.4, fill: U.rgba(PAL.ink, 0.02) });
            g.clip(MX, MY, MW, MH, () => D.contours.forEach((c) => g.poly(c, { color: PAL.ink3, w: 1, alpha: 0.4 })));
            D.stands.forEach((s) => g.icon('aspen', s.x, s.y, s.s, PAL.moss, { alpha: 0.85 }));
            caps(g, 'Yellowstone, stylized', MX + 18, MY + 30, { color: PAL.ink2 });
          });
          const pk = S.tp(tLt - 0.2, 0.8), pe = S.tp(tEn - 0.2, 1.0), shift = ease.inOut(ramp(t, tKl, 1.6));
          D.kills.forEach((k, i) => {
            const rx = lerp(k.x, k.ex, shift), ry = lerp(k.y, k.ey, shift);
            g.glow(rx, ry, 64, PAL.coral, 0.32 * pk);
            if (pe > 0) { g.line(k.x, k.y, k.ex, k.ey, { color: PAL.ink2, w: 1.6, dash: [4, 6], alpha: pe, progress: S.tp(tEn + i * 0.1, 0.6) }); g.circle(k.ex, k.ey, 9, { stroke: PAL.snow, w: 2.2, alpha: S.tp(tEn + 0.3 + i * 0.1, 0.5) }); }
            cross(g, k.x, k.y, 16, PAL.coral, pk);
          });
          // Legend + scale.
          const lgY = MY + MH + 34;
          g.withAlpha(pk, () => { cross(g, MX + 10, lgY - 7, 14, PAL.coral); g.text('kill sites', MX + 28, lgY, { size: 21, color: PAL.ink2 }); });
          g.withAlpha(pe, () => { g.circle(MX + 160, lgY - 7, 8, { stroke: PAL.snow, w: 2 }); g.text('first encounters', MX + 178, lgY, { size: 21, color: PAL.ink2 }); });
          const sk = S.tp(tKm - 0.3, 0.8);
          g.withAlpha(sk, () => { const x0 = MX + MW - 30 - KM; g.line(x0, lgY - 6, x0 + KM, lgY - 6, { color: PAL.ink, w: 3 }); g.line(x0, lgY - 14, x0, lgY + 2, { color: PAL.ink, w: 2 }); g.line(x0 + KM, lgY - 14, x0 + KM, lgY + 2, { color: PAL.ink, w: 2 }); g.text('≈ 1 km', x0 - 12, lgY, { size: 21, color: PAL.ink, align: 'right' }); });
          // Inset: the landscape test found no effect of risk on browsing.
          const aI = S.tp(tLt + 0.4, 0.8);
          if (aI > 0) g.withAlpha(aI, () => {
            caps(g, 'browsing vs risk', 940, 304, { color: PAL.ink2 });
            const A = g.axes({ x: 960, y: 330, w: 300, h: 170, arrows: false });
            g.text('risk', 1260, 530, { size: 21, color: PAL.ink2, align: 'right' }); g.with(() => { g.ctx.translate(944, 330); g.ctx.rotate(-Math.PI / 2); g.text('browsing', 0, 0, { size: 21, color: PAL.ink2, align: 'right' }); });
            D.ins.forEach(([x, y]) => g.dot(A.X(x), A.Y(y), 4, PAL.sand, 1, 2));
            g.plot(A, () => 0.5, { color: PAL.ink, w: 2.4, progress: S.tp(tNE - 0.2, 0.8) });
            g.text('no effect', A.X(0.5), A.Y(1) + 4, { size: 22, italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tNE, 0.8) });
            caps(g, 'stylized', 1260, 304, { size: 15, align: 'right' });
          });
          // Mini research programme: the adjusted belt tile glows amber, undecided.
          const aR = S.tp(tLk - 0.3, 0.8);
          if (aR > 0) {
            const til = {}; til[10] = [PAL.ochre, 0.6 + 0.4 * Math.sin(t * 3) * 0.5];
            g.glow(1110, 724, 120, PAL.ochre, 0.25 * aR);
            ring(1110, 724, 0.5, { alpha: aR, tile: til });
            g.text('?', 1214, 664, { size: 46, role: 'display', color: PAL.ochre, alpha: aR });
            g.text('new prediction?', 1110, 868, { size: 24, italic: true, color: PAL.ochre, align: 'center', alpha: S.tp(tLk + 0.6, 0.8) });
          }
        });

        // ---- Beat 5: a null distribution vs a narrow research prediction.
        const a4 = S.p(4, 0.9, 0.2);
        if (a4 > 0) g.withAlpha(a4, () => {
          const tPb = cue(S, 4, 'Probabilistic'), tNH = cue(S, 4, 'null hypothesis significance'), tRj = cue(S, 4, 'rejecting a null'), tRk = cue(S, 4, 'risky test');
          const nd = (x) => Math.exp(-x * x / 2);
          caps(g, 'null hypothesis test', 130, 300, { color: PAL.ink2 });
          const A = g.axes({ x: 140, y: 420, w: 480, h: 340, xmin: -4, xmax: 4, ymin: 0, ymax: 1.15, progress: S.p(4, 1.0, 0.3) });
          g.plot(A, nd, { color: PAL.ink2, w: 3, progress: S.p(4, 1.2, 0.6) });
          g.math('H_{0}', A.X(0), A.Y(1.04), { size: 30, color: PAL.ink, align: 'center', alpha: S.p(4, 0.8, 1.2) });
          g.text('no effect', A.X(0), A.Y(0) + 32, { size: 21, color: PAL.ink2, align: 'center', alpha: S.p(4, 0.8, 1.2) });
          const rj = S.tp(tNH, 0.8);
          if (rj > 0) for (const [a, b] of [[-4, -2], [2, 4]]) { const pts = [[A.X(a), A.Y(0)]]; for (let k = 0; k <= 20; k++) { const x = lerp(a, b, k / 20); pts.push([A.X(x), A.Y(nd(x))]); } pts.push([A.X(b), A.Y(0)]); g.poly(pts, { fill: U.rgba(COL, 0.45), color: null, w: 0, alpha: rj }); }
          caps(g, 'rejection', A.X(2.2), A.Y(0.38), { color: COL, alpha: rj }); caps(g, 'region', A.X(2.2), A.Y(0.38) + 24, { color: COL, alpha: rj });
          const ob = S.tp(tPb + 0.8, 0.6), ox = A.X(3.0), oy = A.Y(0) - 8;
          if (ob > 0) { g.dot(ox, oy - (1 - ob) * 120, 8, PAL.ink, ob, 2.6); g.withAlpha(S.tp(tPb + 1.4, 0.8) * (1 - S.tp(tNH - 0.4, 0.5)), () => { g.text('improbable,', A.X(4), A.Y(0.42), { size: 21, italic: true, color: PAL.ink, align: 'right' }); g.text('not impossible', A.X(4), A.Y(0.42) + 26, { size: 21, italic: true, color: PAL.ink, align: 'right' }); g.line(ox + 20, A.Y(0.42) + 36, ox + 4, oy - 12, { color: PAL.ink2, w: 1.4 }); }); }
          g.withAlpha(S.tp(tRj, 0.8), () => { g.text('reject H₀: some effect, of any size', A.X(0), 850, { size: 23, color: COL, align: 'center' }); });
          // Right: a bold research prediction is a narrow target.
          const aT = S.tp(tRk - 1.2, 0.9), NL = 690, zx = 790, px0 = 1132;
          g.text('≠', 690, 610, { size: 72, role: 'display', color: COL, align: 'center', alpha: S.tp(tRk - 0.4, 0.8) });
          if (aT > 0) g.withAlpha(aT, () => {
            caps(g, 'a risky research prediction', 760, 300, { color: PAL.ink2 });
            g.line(760, NL, 1280, NL, { color: PAL.ink2, w: 2 }); g.line(zx, NL - 10, zx, NL + 10, { color: PAL.ink2, w: 2 }); g.text('0', zx, NL + 34, { size: 21, color: PAL.ink2, align: 'center' });
            g.text('effect size', 1280, NL + 34, { size: 21, color: PAL.ink2, align: 'right' });
            [64, 44, 24].forEach((rr, k) => g.circle(px0, 500, rr, { stroke: k === 2 ? PAL.moss : PAL.ink2, w: 2, fill: k === 2 ? U.rgba(PAL.moss, 0.25) : null }));
            g.dot(px0, 500, 6, PAL.moss, 1, 2.4);
            g.line(px0, 570, px0, NL - 12, { color: PAL.moss, w: 2, dash: [5, 6] });
            g.rect(px0 - 16, NL - 8, 32, 16, { r: 4, fill: U.rgba(PAL.moss, 0.6) });
            g.text('predicted effect', px0, 418, { size: 21, color: PAL.moss, align: 'center' });
            caps(g, 'illustrative', 1280, 300, { size: 15, align: 'right' });
            const br = S.tp(tRk - 0.2, 0.8);
            g.line(zx + 14, NL + 66, zx + 14 + (1270 - zx - 14) * br, NL + 66, { color: COL, w: 2.4 }); g.line(zx + 14, NL + 56, zx + 14, NL + 76, { color: COL, w: 2.4, alpha: br });
            g.text('what rejecting H₀ allows: anything but 0', zx + 14, NL + 104, { size: 21, color: COL, alpha: br });
            g.text('what a bold hypothesis risks: one narrow value', zx + 14, NL + 140, { size: 21, color: PAL.moss, alpha: S.tp(tRk + 0.4, 0.8) });
          });
        });
      },
      terms: [
        { beat: 0.4, term: 'Duhem–Quine thesis', def: 'Hypotheses are tested only in conjunction with auxiliary assumptions, so a failed prediction cannot by itself identify what is false.' },
        { beat: 2.35, term: 'Research program', def: 'Lakatos: a hard core of central commitments, shielded by a protective belt of revisable auxiliary hypotheses.' },
        { beat: 2.65, term: 'Progressive vs degenerating', def: 'A program is progressive when its adjustments predict novel facts that are confirmed, degenerating when they only accommodate failures.' },
        { beat: 4.45, term: 'Null hypothesis significance testing', def: 'Testing whether data are improbable under a null model, usually of no effect; rejecting it does not test a substantive hypothesis severely.' },
      ],
    },
  ],
});
})();
