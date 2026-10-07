/* Chapter VIII — Causality: association is not explanation. Case file: would that elk have died anyway? */
(function () {
const { PAL, U, Theater } = window; const { lerp, clamp, ease } = U;
const COL = PAL.rose;

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
const parch = (g, x, y, w, h, a = 1) => { g.rect(x + 5, y + 7, w, h, { r: 4, fill: 'rgba(0,0,0,0.35)', alpha: a }); g.rect(x, y, w, h, { r: 4, fill: '#ECE3CC', alpha: a }); };

// A person (hunter, manager, rancher), centred on (x, y), about s px tall.
function person(g, x, y, s, col, o = {}) {
  const c = g.ctx; const a = o.alpha ?? 1; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(s / 112, s / 112); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.rifle) { c.lineWidth = 6; c.beginPath(); c.moveTo(-30, 40); c.lineTo(32, -56); c.stroke(); }
  c.beginPath(); c.arc(0, -26, 15, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(-26, 54); c.lineTo(-24, 6); c.quadraticCurveTo(-22, -8, -8, -9); c.lineTo(8, -9); c.quadraticCurveTo(22, -8, 24, 6); c.lineTo(26, 54); c.closePath(); c.fill();
  if (o.hat) { c.beginPath(); c.ellipse(0, -38, o.hat === 'wide' ? 31 : 21, 5, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(-13, -38); c.quadraticCurveTo(-12, -58, 0, -57); c.quadraticCurveTo(12, -58, 13, -38); c.fill(); }
  if (o.clip) { c.fillRect(14, 4, 20, 26); }
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
const sunGlyph = (g, x, y, s, col, a = 1) => { g.circle(x, y - s * 0.08, s * 0.2, { fill: col, alpha: a }); for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4; g.line(x + Math.cos(an) * s * 0.3, y - s * 0.08 + Math.sin(an) * s * 0.3, x + Math.cos(an) * s * 0.42, y - s * 0.08 + Math.sin(an) * s * 0.42, { color: col, w: 2.4, alpha: a }); } g.poly([[x - s * 0.45, y + s * 0.42], [x - s * 0.15, y + s * 0.36], [x - s * 0.05, y + s * 0.46], [x + s * 0.2, y + s * 0.38], [x + s * 0.45, y + s * 0.44]], { color: col, w: 2, alpha: a }); };
const waterGlyph = (g, x, y, s, col, a = 1) => { for (let k = 0; k < 3; k++) { const pts = []; for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push([x - s * 0.45 + u * s * 0.9, y - s * 0.22 + k * s * 0.22 + Math.sin(u * 9 + k) * s * 0.06]); } g.poly(pts, { color: col, w: 2.6, alpha: a }); } };
const hunterGlyph = (g, x, y, s, col, a = 1) => person(g, x, y, s * 0.95, col, { alpha: a, rifle: true, hat: 'cap' });
const managerGlyph = (g, x, y, s, col, a = 1) => person(g, x, y, s * 0.95, col, { alpha: a, hat: 'wide', clip: true });
const ranchGlyph = (g, x, y, s, col, a = 1) => person(g, x, y, s * 0.95, col, { alpha: a, hat: 'wide' });

// Node box: rounded card with an icon and a label; n = {x, y, w, h, label, sub, color, icon}.
function nodeBox(g, n, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  const w = o.w ?? n.w, h = o.h ?? n.h, x = o.x ?? n.x, y = o.y ?? n.y, col = o.color || n.color; const s = h / 56;
  if (o.hi) g.glow(x, y, w * 0.62, col, 0.32 * o.hi * a);
  g.rect(x - w / 2, y - h / 2, w, h, { r: 10 * s, fill: '#191630', alpha: a });
  g.rect(x - w / 2, y - h / 2, w, h, { r: 10 * s, fill: U.rgba(col, o.fillA ?? 0.13), stroke: col, w: o.lw ?? 2, alpha: a, dash: o.dash });
  const ix = x - w / 2 + 30 * s, iy = y + 1 * s, isz = 36 * s;
  if (n.icon) { if (typeof n.icon === 'function') n.icon(g, ix, iy, isz, col, a); else g.icon(n.icon, ix, iy, isz, col, { alpha: a }); }
  const tx = n.icon ? x - w / 2 + 58 * s : x;
  g.text(n.label, tx, y + 7 * s, { size: 21 * s, weight: 600, ls: 1.5, color: PAL.ink, alpha: a, align: n.icon ? 'left' : 'center' });
}
const rim = (n, tx, ty, pad = 6) => { const dx = tx - n.x, dy = ty - n.y; const s = Math.min((n.w / 2 + pad) / Math.max(1e-6, Math.abs(dx)), (n.h / 2 + pad) / Math.max(1e-6, Math.abs(dy))); return [n.x + dx * s, n.y + dy * s]; };
const link = (g, A, B, o = {}) => { const [x1, y1] = rim(A, B.x, B.y, o.pad0 ?? 5); const [x2, y2] = rim(B, A.x, A.y, o.pad1 ?? 7); if (o.bend) return g.carrow(x1, y1, x2, y2, o.bend, o); return g.arrow(x1, y1, x2, y2, o); };
// Circle variable node for small causal graphs.
const vnode = (g, x, y, lab, col, a = 1, o = {}) => { if (a <= 0) return; const r = o.r || 28; if (o.hi) g.glow(x, y, r * 2.4, col, 0.35 * o.hi * a); g.circle(x, y, r, { fill: '#1B1832', alpha: a }); g.circle(x, y, r, { fill: U.rgba(col, 0.16), stroke: col, w: 2.4, alpha: a }); g.math(lab, x, y + r * 0.36, { size: r * 1.05, color: PAL.ink, align: 'center', alpha: a }); };
const varr = (g, x1, y1, x2, y2, o = {}) => { const d = Math.hypot(x2 - x1, y2 - y1), r0 = o.r0 ?? 32, r1 = o.r1 ?? 34; const ux = (x2 - x1) / d, uy = (y2 - y1) / d; g.arrow(x1 + ux * r0, y1 + uy * r0, x2 - ux * r1, y2 - uy * r1, { color: PAL.ink2, w: 2.4, head: 13, ...o }); };
// A die showing face f.
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
const die = (g, x, y, s, f, rot, a = 1) => g.with(() => { const c = g.ctx; c.translate(x, y); c.rotate(rot); g.rect(-s / 2 + 4, -s / 2 + 6, s, s, { r: s * 0.18, fill: 'rgba(0,0,0,0.4)', alpha: a }); g.rect(-s / 2, -s / 2, s, s, { r: s * 0.18, fill: PAL.parchment, alpha: a }); PIPS[f].forEach(([px, py]) => g.circle(px * s * 0.27, py * s * 0.27, s * 0.085, { fill: '#2A2440', alpha: a })); });
const gridLabels = (g) => { [['no dam', 0], ['dam', 1]].forEach(([s, k]) => caps(g, s, 308 + k * 250, 330, { align: 'center' })); [['no fence', 0], ['fence', 1]].forEach(([s, k]) => g.with(() => { g.ctx.translate(170, 463 + k * 240); g.ctx.rotate(-Math.PI / 2); caps(g, s, 0, 0, { align: 'center' }); })); };
const tick = (g, x, y, s, col, a = 1) => g.poly([[x - s * 0.45, y], [x - s * 0.1, y + s * 0.35], [x + s * 0.5, y - s * 0.4]], { color: col, w: 3, alpha: a });

Theater.chapter({
  id: 'cause', roman: 'VIII', title: 'Causality', color: COL,
  question: 'What would have happened otherwise?',
  casefile: { title: 'Would that elk have died anyway?', sketch: 'elk' },
  intro: { t: 'Chapter eight. Causality: association is not explanation.' },
  scenes: [
    {
      id: 'cause-assoc', title: 'Association is not explanation', register: 'infer',
      beats: [
        { t: 'Two variables can move together for many reasons. One may cause the other; the other may cause the one; a third variable may cause both; or the association may be manufactured by how cases were selected. Confounding, reverse causation, and collider bias.',
          v: 'Three mini causal graphs, X and Y with arrows: X→Y, Y→X, Z→X and Z→Y; then a collider X→C←Y with a selection box on C.' },
        { t: 'Here is a real puzzle. Across western North America, adult female elk survived better where both pumas and wolves lived than where there was only one predator, or none. Do two predators protect elk?',
          cite: 'Brodie et al. 2013',
          v: 'Bar chart of adult female survival: none, one predator, both; the “both” bar is tallest, with a question mark.' },
        { t: 'Almost certainly not. Managers expecting heavy predation had already cut hunting quotas there, so management was a common cause of both. Across the same forty-five populations, human harvest lowered survival far more than any predator.',
          cite: 'Brodie et al. 2013',
          v: 'A hidden MANAGEMENT node appears with arrows to “predators present” and “hunting quota”; the paradox dissolves. Harvest effect bar (about ten percent) dwarfs the predator bar.' },
        { t: 'A related trap is Simpson’s paradox, where a trend that holds within every subgroup reverses once the groups are pooled. The data alone cannot tell you whether to pool or stratify. That takes a causal model.',
          v: 'Two subgroups with parallel downward trends; pooled, a single upward trend; a causal-graph card decides.' },
      ],
      init() {
        const r = U.rng(801); const pts = []; for (let k = 0; k < 46; k++) { const x = 0.08 + 0.84 * r(); pts.push([x, clamp(0.12 + 0.72 * x + 0.13 * U.gauss(r), 0.04, 0.96), r() * 6.28]); }
        const simp = []; for (let k = 0; k < 40; k++) { const grp = k % 2; const x = grp ? 0.52 + 0.36 * r() : 0.1 + 0.36 * r(); const y = (grp ? 0.74 : 0.42) - 0.55 * (x - (grp ? 0.7 : 0.28)) + 0.06 * U.gauss(r); simp.push([x, clamp(y, 0.05, 0.97), grp]); }
        return { pts, simp };
      },
      draw(g, t, S, D) {
        // ---- Beat 1: four reasons two variables move together.
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const A = g.axes({ x: 170, y: 246, w: 400, h: 196, xlab: 'X', ylab: 'Y', progress: S.p(0, 1.0), labSize: 24 });
          D.pts.forEach(([x, y, ph], k) => { const w = 0.025 * Math.sin(t * 0.9 + ph); g.dot(A.X(x + w), A.Y(y + w * 0.75), 4.5, PAL.ink2, S.p(0, 0.5, 0.3 + k * 0.02), 2); });
          g.plot(A, (x) => 0.12 + 0.72 * x, { from: 0.05, to: 0.95, color: PAL.ink, w: 2.4, dash: [8, 7], progress: S.p(0, 1, 1.4) });
          g.text('X and Y move together.', 660, 330, { size: 50, role: 'display', color: PAL.ink, alpha: S.p(0, 0.8, 0.6) });
          g.text('Why?', 660, 400, { size: 50, role: 'display', italic: true, color: COL, alpha: S.p(0, 0.8, 1.6) });
          const cards = [['One may cause', 'causation'], ['the other may cause', 'reverse causation'], ['a third variable', 'confounding'], ['or the association', 'collider bias']];
          const tNames = [cue(S, 0, 'One may cause'), cue(S, 0, 'reverse causation'), cue(S, 0, 'Confounding'), cue(S, 0, 'collider bias')];
          cards.forEach(([ph, name], k) => {
            const x = 110 + k * 306, y = 500, w = 286, h = 380, a = S.tp(cue(S, 0, ph) - 0.2, 0.7); if (a <= 0) return;
            g.withAlpha(a, () => {
              panel(g, x, y, w, h, 1); const cx = x + w / 2, gy = y + 150, X = [cx - 82, gy], Y = [cx + 82, gy];
              const pa = S.tp(cue(S, 0, ph) + 0.2, 0.7);
              if (k === 0) { vnode(g, X[0], X[1], 'X', PAL.lagoon); vnode(g, Y[0], Y[1], 'Y', PAL.lagoon); varr(g, X[0], X[1], Y[0], Y[1], { progress: pa }); }
              if (k === 1) { vnode(g, X[0], X[1], 'X', PAL.lagoon); vnode(g, Y[0], Y[1], 'Y', PAL.lagoon); varr(g, Y[0], Y[1], X[0], X[1], { progress: pa }); }
              if (k === 2) { const Z = [cx, gy - 80]; vnode(g, X[0], X[1] + 30, 'X', PAL.lagoon); vnode(g, Y[0], Y[1] + 30, 'Y', PAL.lagoon); vnode(g, Z[0], Z[1], 'Z', PAL.ochre); varr(g, Z[0], Z[1], X[0], X[1] + 30, { progress: pa }); varr(g, Z[0], Z[1], Y[0], Y[1] + 30, { progress: pa }); g.line(X[0] + 34, X[1] + 30, Y[0] - 34, Y[1] + 30, { color: COL, w: 2, dash: [5, 6], alpha: S.tp(cue(S, 0, ph) + 1.0, 0.6) }); }
              if (k === 3) { const C = [cx, gy + 60]; vnode(g, X[0], X[1] - 40, 'X', PAL.lagoon); vnode(g, Y[0], Y[1] - 40, 'Y', PAL.lagoon); vnode(g, C[0], C[1], 'C', PAL.heather); varr(g, X[0], X[1] - 40, C[0], C[1], { progress: pa }); varr(g, Y[0], Y[1] - 40, C[0], C[1], { progress: pa });
                const sa = S.tp(cue(S, 0, 'how cases were selected'), 0.6); g.rect(C[0] - 44, C[1] - 42, 88, 84, { r: 6, stroke: COL, w: 2.4, dash: [7, 5], alpha: sa }); caps(g, 'selected', C[0], C[1] + 66, { color: COL, align: 'center', alpha: sa });
                g.line(X[0] + 34, X[1] - 40, Y[0] - 34, Y[1] - 40, { color: COL, w: 2, dash: [5, 6], alpha: S.tp(cue(S, 0, 'how cases were selected') + 0.8, 0.6) }); }
              const na = k === 0 ? a : S.tp(tNames[k], 0.6);
              g.text(name, cx, y + h - 64, { size: 30, role: 'display', color: k === 0 ? PAL.ink : COL, align: 'center', alpha: na });
              caps(g, ['X causes Y', 'Y causes X', 'Z causes both', 'selection on C'][k], cx, y + h - 30, { align: 'center', alpha: na });
            });
          });
        });

        // ---- Beats 2–3: survival by predator set, then the hidden common cause.
        const aB = vis(S, 1, 3);
        if (aB > 0) g.withAlpha(aB, () => {
          const m = S.p(2, 1.1);
          const R0 = { x: 330, y: 300, w: 640, h: 440 }, R1 = { x: 160, y: 300, w: 420, h: 420 }; const R = lerpR(R0, R1, m);
          const A = g.axes({ x: R.x, y: R.y, w: R.w, h: R.h, arrows: false, progress: S.p(1, 1.0) });
          g.with(() => { g.ctx.translate(R.x - 26, R.y + R.h); g.ctx.rotate(-Math.PI / 2); g.text('Adult female elk survival', 0, 0, { size: 22, color: PAL.ink2, alpha: S.p(1, 0.8, 0.4) }); });
          caps(g, 'stylized', R.x + R.w, R.y - 14, { align: 'right', alpha: S.p(1, 0.8, 0.6) });
          caps(g, '45 populations, western North America', R.x, R.y - 14, { alpha: S.p(1, 0.8, 0.6) * (1 - S.p(2, 0.4)) });
          const tSurv = cue(S, 1, 'adult female elk'), tQ = cue(S, 1, 'Do two predators');
          const bars = [['none', 0.58, []], ['one predator', 0.58, ['wolf', 'puma']], ['both', 0.82, ['wolf', 'puma']]];
          const bw = R.w / 3 * 0.56;
          bars.forEach(([lab, hgt, ics], k) => {
            const cx = R.x + R.w * (k + 0.5) / 3; const p = ein(t, tSurv + 0.3 + k * 0.5, 1.0); const top = R.y + R.h - R.h * hgt * p;
            const col = k === 2 ? COL : PAL.sand;
            g.rect(cx - bw / 2, top, bw, R.y + R.h - top, { r: 3, fill: U.rgba(col, k === 2 ? 0.55 : 0.35), stroke: col, w: 2, alpha: p > 0 ? 1 : 0 });
            const la = S.tp(tSurv, 0.6); const ly = R.y + R.h + 44;
            g.text(lab, cx, ly + 40, { size: 22, color: PAL.ink, align: 'center', alpha: la });
            if (k === 0) g.circle(cx, ly - 4, 16, { stroke: PAL.ink3, w: 2, alpha: la });
            if (k === 1) { g.icon('wolf', cx - 44, ly - 2, 38, PAL.coral, { alpha: la }); g.text('or', cx, ly + 4, { size: 21, italic: true, color: PAL.ink3, align: 'center', alpha: la }); g.icon('puma', cx + 46, ly - 2, 38, PAL.coral, { alpha: la }); }
            if (k === 2) { g.icon('wolf', cx - 24, ly - 2, 40, PAL.coral, { alpha: la }); g.icon('puma', cx + 26, ly - 2, 40, PAL.coral, { alpha: la }); }
          });
          const bx = R.x + R.w * 2.5 / 3, by = R.y + R.h - R.h * 0.82 - 30;
          g.text('?', bx, by, { size: lerp(64, 50, m), role: 'display', italic: true, color: COL, align: 'center', alpha: S.tp(tQ, 0.6) * (1 - S.p(2, 0.6, 0.4)) });
          g.withAlpha(S.p(1, 0.8, 0.2) * (1 - S.tp(tQ - 0.4, 0.5)), () => { g.text('A real puzzle', 1030, 400, { size: 40, role: 'display', italic: true, color: PAL.ink }); caps(g, 'Brodie et al. 2013', 1032, 440); });
          g.withAlpha(S.tp(tQ, 0.8) * (1 - m), () => g.wrap('Do two predators protect elk?', 1030, 400, 290, { size: 40, role: 'display', italic: true, color: PAL.ink, lh: 1.15 }));
          // Beat 3: the hidden common cause.
          const a2 = S.p(2, 0.8);
          if (a2 > 0) {
            const tMan = cue(S, 2, 'Managers expecting'), tCut = cue(S, 2, 'cut hunting quotas'), tCC = cue(S, 2, 'common cause'), tH = cue(S, 2, 'Across the same');
            g.text('Almost certainly not.', R.x, R.y - 46, { size: 30, role: 'display', italic: true, color: PAL.ink, alpha: a2 * (1 - S.tp(tH, 0.6)) });
            const N = { man: { x: 960, y: 284, w: 250, h: 56, label: 'MANAGEMENT', color: PAL.violet, icon: managerGlyph }, pred: { x: 770, y: 450, w: 250, h: 56, label: 'PREDATORS', color: PAL.coral, icon: 'wolf' },
              quota: { x: 1160, y: 450, w: 250, h: 56, label: 'HUNTING QUOTA', color: PAL.violet, icon: hunterGlyph }, surv: { x: 960, y: 600, w: 270, h: 56, label: 'ELK SURVIVAL', color: PAL.sand, icon: 'elk' } };
            N.quota.w = 276; N.quota.x = 1160;
            const aN = S.p(2, 0.8, 1.0), aM = Math.min(aN, S.tp(tMan - 0.2, 0.8)), hiPath = S.tp(tCC, 0.8);
            link(g, N.pred, N.surv, { color: PAL.ink2, w: 2, head: 12, progress: S.p(2, 0.8, 1.3) });
            link(g, N.man, N.pred, { color: hiPath > 0 ? U.mix(PAL.ink2, COL, hiPath) : PAL.ink2, w: lerp(2, 3.4, hiPath), head: 14, progress: S.tp(tMan + 0.4, 0.8) });
            link(g, N.man, N.quota, { color: hiPath > 0 ? U.mix(PAL.ink2, COL, hiPath) : PAL.ink2, w: lerp(2, 3.4, hiPath), head: 14, progress: S.tp(tCut, 0.8) });
            link(g, N.quota, N.surv, { color: hiPath > 0 ? U.mix(PAL.ink2, COL, hiPath) : PAL.ink2, w: lerp(2, 3.4, hiPath), head: 14, progress: S.tp(tCut + 0.5, 0.8) });
            nodeBox(g, N.pred, { alpha: aN }); nodeBox(g, N.surv, { alpha: aN });
            nodeBox(g, N.man, { alpha: aM, hi: 0.6 + 0.4 * hiPath }); nodeBox(g, N.quota, { alpha: S.tp(tCut - 0.2, 0.7) });
            g.pill('cut', N.quota.x + N.quota.w / 2 - 20, N.quota.y - 38, { size: 21, color: PAL.violet, fill: '#221D3A', stroke: PAL.violet, alpha: S.tp(tCut + 0.6, 0.6) });
            caps(g, 'hidden common cause', N.man.x + N.man.w / 2 + 16, N.man.y + 6, { color: COL, alpha: S.tp(tCC, 0.8) * (1 - S.tp(tH, 0.6)) });
            // Harvest versus predators.
            const aH = S.tp(tH, 0.8);
            if (aH > 0) g.withAlpha(aH, () => {
              const x0 = 700, y0 = 708; caps(g, 'drop in adult female survival', x0, y0);
              const L = 520, ph = ein(t, tH + 0.6, 1.4);
              g.rect(x0, y0 + 24, L * ph, 40, { r: 3, fill: U.rgba(PAL.violet, 0.55), stroke: PAL.violet, w: 2 }); g.text('human harvest', x0 + 12, y0 + 52, { size: 22, weight: 600, color: PAL.ink, alpha: ph }); g.text('≈ 10%', x0 + L * ph + 12, y0 + 52, { size: 22, color: PAL.ink, alpha: ph });
              g.rect(x0, y0 + 84, L * 0.2 * ph, 40, { r: 3, fill: U.rgba(PAL.coral, 0.55), stroke: PAL.coral, w: 2 }); g.text('wolves + pumas  ≈ 2%', x0 + L * 0.2 * ph + 12, y0 + 112, { size: 22, color: PAL.ink, alpha: ph });
            });
          }
        });

        // ---- Beat 4: Simpson's paradox.
        const a3 = S.p(3, 0.8);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tW = cue(S, 3, 'within every subgroup'), tP = cue(S, 3, 'once the groups are pooled'), tD = cue(S, 3, 'The data alone'), tC = cue(S, 3, 'That takes a causal');
          const A = g.axes({ x: 170, y: 290, w: 560, h: 460, xlab: 'X', ylab: 'Y', labSize: 26, progress: S.p(3, 1.0) });
          caps(g, 'illustrative', A.x + A.w, 270, { align: 'right' });
          const pool = S.tp(tP, 1.0); const cols = [PAL.ochre, PAL.lagoon];
          D.simp.forEach(([x, y, grp], k) => g.dot(A.X(x), A.Y(y), 6, U.mix(cols[grp], PAL.ink2, pool), S.p(3, 0.5, 0.4 + k * 0.025), 2.2));
          [[0.1, 0.46, 0.42, 0.28], [0.52, 0.88, 0.74, 0.7]].forEach(([x0, x1, y0, xm], grp) => { const f = (x) => y0 - 0.55 * (x - xm); g.plot(A, f, { from: x0, to: x1, color: cols[grp], w: 4, progress: S.tp(tW + grp * 0.4, 0.9), alpha: 1 - 0.65 * pool }); });
          caps(g, 'group A', A.X(0.12), A.Y(0.62), { color: PAL.ochre, alpha: S.tp(tW, 0.6) * (1 - pool) }); caps(g, 'group B', A.X(0.74), A.Y(0.93), { color: PAL.lagoon, alpha: S.tp(tW + 0.4, 0.6) * (1 - pool) });
          g.plot(A, (x) => 0.2 + 0.62 * x, { from: 0.06, to: 0.94, color: PAL.ink, w: 3.4, dash: [10, 8], progress: S.tp(tP + 0.4, 1.2) });
          g.text('pooled', A.X(0.94), A.Y(0.2 + 0.62 * 0.94) - 18, { size: 23, weight: 600, color: PAL.ink, align: 'right', alpha: S.tp(tP + 1.2, 0.6) });
          // The causal model decides.
          g.withAlpha(S.tp(tD, 0.8), () => { g.text('Pool or stratify?', 820, 312, { size: 40, role: 'display', italic: true, color: PAL.ink }); caps(g, 'the data alone cannot say', 822, 348); });
          const card = (y, k, verdict) => { const a = S.tp(tD + 0.6 + k * 0.5, 0.7); if (a <= 0) return; g.withAlpha(a, () => { panel(g, 820, y, 480, 210, 1); const X = [870, y + 146], Y = [1030, y + 146], Z = [950, y + 62];
            vnode(g, X[0], X[1], 'X', PAL.lagoon, 1, { r: 25 }); vnode(g, Y[0], Y[1], 'Y', PAL.lagoon, 1, { r: 25 }); vnode(g, Z[0], Z[1], 'Z', k ? PAL.heather : PAL.ochre, 1, { r: 25 });
            varr(g, X[0], X[1], Y[0], Y[1], { r0: 28, r1: 30 }); if (k === 0) { varr(g, Z[0], Z[1], X[0], X[1], { r0: 28, r1: 30 }); varr(g, Z[0], Z[1], Y[0], Y[1], { r0: 28, r1: 30 }); } else { varr(g, X[0], X[1], Z[0], Z[1], { r0: 28, r1: 30 }); varr(g, Z[0], Z[1], Y[0], Y[1], { r0: 28, r1: 30 }); }
            const va = S.tp(tC + k * 0.4, 0.6); caps(g, k ? 'z lies on the path' : 'z causes both', 1088, y + 88, { color: PAL.ink2, alpha: va }); g.text(verdict, 1088, y + 134, { size: 38, role: 'display', italic: true, color: COL, alpha: va }); }); };
          card(390, 0, 'stratify'); card(626, 1, 'pool');
        });
      },
      terms: [
        { beat: 0.7, term: 'Confounding', def: 'A common cause of exposure and outcome that creates or distorts an association between them.' },
        { beat: 0.85, term: 'Collider bias', def: 'A spurious association created by conditioning or selecting on a variable caused by both exposure and outcome.' },
        { beat: 3.2, term: 'Simpson’s paradox', def: 'An association within every subgroup that reverses when the subgroups are combined.' },
      ],
    },
    {
      id: 'cause-counter', title: 'Would that elk have died anyway?', register: 'infer',
      beats: [
        { t: 'What is a cause? David Hume answered regular succession. David Lewis answered with counterfactuals: c caused e if, had c not happened, e would not have happened. James Woodward answered with intervention: c causes e if changing c, and nothing else, would change e.',
          s: 'What is a cause? David Hume answered regular succession. David Lewis answered with counterfactuals: C caused E if, had C not happened, E would not have happened. James Woodward answered with intervention: C causes E if changing C, and nothing else, would change E.',
          cite: 'Hume 1748; Lewis 1973; Woodward 2003',
          v: 'Case-file card (elk). Three labelled panels: REGULARITY (repeated c→e), COUNTERFACTUAL (two branching worlds), INTERVENTION (a hand setting c).' },
        { t: 'Statisticians formalized the counterfactual. Each unit has two potential outcomes, one with the treatment and one without. Paul Holland called the catch the fundamental problem of causal inference: for any one unit, you observe only one of them.',
          cite: 'Rubin 1974; Holland 1986',
          v: 'A table of units with Y(1) and Y(0) columns; for each row, one cell is filled and the other greyed as “never observed”.' },
        { t: 'Wildlife biologists know this problem by another name. Mortality is additive if a predator’s kills add to deaths from other causes, and compensatory if the animals killed would have died anyway. That is a counterfactual claim about animals that are already dead.',
          v: 'Two survival bars: with predation and without; ADDITIVE (bars differ) vs COMPENSATORY (bars nearly equal, causes of death reshuffle).' },
        { t: 'Evidence can still bear on it. In Yellowstone, wolf-killed cow elk were most often about sixteen years old; hunter-killed cows, about four. Old elk have little time left to live or breed, so wolf kills are more likely compensatory, and hunter kills more likely additive.',
          cite: 'MacNulty et al. 2020; Gaillard et al. 2000',
          v: 'Two age histograms of killed cow elk: wolf kills peaked near 16, hunter kills near 4; reproductive-value curve drawn behind them.' },
      ],
      init() {
        const r = U.rng(823);
        const rows = []; for (let k = 0; k < 6; k++) { const treated = [1, 0, 1, 1, 0, 0][k]; rows.push({ treated, y: [1, 0, 0, 1, 1, 0][k] }); }
        const hunter = [], wolf = []; for (let a = 1; a <= 20; a++) { const sq = (v) => v * v; hunter.push(Math.exp(-sq((a - 4) / 2.4)) + 0.18 * Math.exp(-sq((a - 9) / 3.5)) + 0.03 * r()); wolf.push(0.12 * Math.exp(-sq((a - 3) / 2)) + Math.exp(-sq((a - 16) / 2.6)) + 0.03 * r()); }
        const mh = Math.max(...hunter), mw = Math.max(...wolf);
        return { rows, hunter: hunter.map((v) => v / mh), wolf: wolf.map((v) => v / mw) };
      },
      draw(g, t, S, D) {
        const CF0 = { x: 96, y: 226, w: 270, h: 156 }, CF1 = { x: 96, y: 226, w: 240, h: 146 };
        const cf = lerpR(CF0, CF1, S.p(1, 1.0));
        g.casefile(cf.x, cf.y, cf.w, cf.h, { title: 'Would that elk have died anyway?', no: 'VIII', sketch: 'elk', color: COL, rot: -0.02, alpha: S.p(0, 0.9), titleSize: cf.w < 250 ? 18 : 19 });

        // ---- Beat 1: three answers to "what is a cause?".
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const tHu = cue(S, 0, 'David Hume'), tLe = cue(S, 0, 'David Lewis'), tWo = cue(S, 0, 'James Woodward');
          g.text('What is a cause?', 420, 318, { size: 54, role: 'display', italic: true, color: PAL.ink, alpha: S.p(0, 0.8, 0.1) });
          const P = (k, t0, head, who, body) => { const x = 110 + k * 410, y = 410, w = 390, h = 470, a = S.tp(t0 - 0.2, 0.8); if (a <= 0) return; g.withAlpha(a, () => { panel(g, x, y, w, h, 1); caps(g, head, x + 24, y + 40, { color: COL }); g.text(who, x + w - 24, y + 40, { size: 22, italic: true, color: PAL.ink2, align: 'right' }); body(x, y, w, h); }); };
          P(0, tHu, 'regularity', 'Hume', (x, y) => {
            for (let k = 0; k < 4; k++) { const yy = y + 110 + k * 72; const a = S.tp(tHu + 0.3 + k * 0.45, 0.5); g.withAlpha(a, () => { vnode(g, x + 90, yy, 'c', PAL.coral, 1, { r: 22 }); varr(g, x + 90, yy, x + 270, yy, { r0: 26, r1: 28, progress: S.tp(tHu + 0.5 + k * 0.45, 0.5) }); vnode(g, x + 270, yy, 'e', PAL.sand, 1, { r: 22 }); }); }
            g.wrap('c is followed by e, again and again', x + 24, y + 418, 340, { size: 22, color: PAL.ink, lh: 1.3, alpha: S.tp(tHu + 1.6, 0.8) });
          });
          P(1, tLe, 'counterfactual', 'Lewis', (x, y) => {
            const o = [x + 50, y + 230], up = [x + 200, y + 140], dn = [x + 200, y + 320];
            const pb = S.tp(tLe + 0.6, 1.0);
            g.dot(o[0], o[1], 7, PAL.ink, 1, 2.4);
            g.poly([o, [o[0] + 60, o[1]], up], { color: PAL.ink2, w: 2.4, progress: pb }); g.poly([o, [o[0] + 60, o[1]], dn], { color: PAL.ink3, w: 2.4, dash: [6, 6], progress: pb });
            vnode(g, up[0], up[1], 'c', PAL.coral, pb, { r: 22 }); varr(g, up[0], up[1], x + 330, up[1], { r0: 26, r1: 28, progress: S.tp(tLe + 1.2, 0.6) }); vnode(g, x + 330, up[1], 'e', PAL.sand, S.tp(tLe + 1.2, 0.6), { r: 22 });
            const cf = S.tp(cue(S, 0, 'had c not happened'), 0.7);
            vnode(g, dn[0], dn[1], '¬c', PAL.ink3, cf, { r: 22 }); varr(g, dn[0], dn[1], x + 330, dn[1], { r0: 26, r1: 28, progress: S.tp(cue(S, 0, 'e would not'), 0.6), dash: [6, 6] }); vnode(g, x + 330, dn[1], '¬e', PAL.ink3, S.tp(cue(S, 0, 'e would not'), 0.6), { r: 22 });
            caps(g, 'actual world', x + 24, up[1] - 44, { alpha: pb }); caps(g, 'nearest world without c', x + 24, dn[1] + 56, { alpha: cf });
            g.wrap('had c not happened, e would not have', x + 24, y + 418, 350, { size: 22, color: PAL.ink, lh: 1.3, alpha: S.tp(cue(S, 0, 'e would not') + 0.8, 0.8) });
          });
          P(2, tWo, 'intervention', 'Woodward', (x, y) => {
            const sw = [x + 110, y + 230], E = [x + 300, y + 230], Z = [x + 205, y + 110];
            const tCh = cue(S, 0, 'changing c'); const on = t < tCh + 0.4 ? 1 : (Math.floor((t - tCh - 0.4) / 1.6) % 2 === 0 ? 0 : 1); const sm = t < tCh + 0.4 ? 1 : (() => { const ph = ((t - tCh - 0.4) / 1.6) % 1; const lv = Math.floor((t - tCh - 0.4) / 1.6) % 2 === 0; return lv ? 1 - ease.inOut(ph * 4) : ease.inOut(ph * 4); })();
            // the switch for c, set by a hand
            g.rect(sw[0] - 22, sw[1] - 70, 44, 140, { r: 22, fill: '#1B1832', stroke: PAL.ink3, w: 2 });
            const ky = lerp(sw[1] + 40, sw[1] - 40, sm); g.circle(sw[0], ky, 20, { fill: U.mix(PAL.ink3, PAL.coral, sm), stroke: PAL.ink, w: 1.5 });
            g.math('c', sw[0] - 48, sw[1] + 10, { size: 30, color: PAL.coral, align: 'center' });
            hand(g, sw[0] + 4, ky - 18, 64, PAL.violet, { alpha: S.tp(tCh - 0.6, 0.6), rot: 0 });
            // e responds; Z held fixed
            varr(g, sw[0] + 26, sw[1], E[0], E[1], { r0: 4, r1: 30 });
            vnode(g, E[0], E[1], 'e', PAL.sand, 1, { r: 26, hi: sm });
            g.rect(E[0] - 12, E[1] + 44, 24, 90, { r: 4, stroke: PAL.ink3, w: 1.5 }); g.rect(E[0] - 12, E[1] + 134 - 84 * sm, 24, 84 * sm + 0.01, { r: 4, fill: PAL.sand, alpha: 0.85 });
            const zA = S.tp(cue(S, 0, 'nothing else'), 0.6);
            vnode(g, Z[0], Z[1], 'z', PAL.ink3, zA, { r: 22 }); g.text('held fixed', Z[0] + 34, Z[1] + 7, { size: 21, color: PAL.ink2, alpha: zA }); g.circle(Z[0] - 16, Z[1] - 18, 6, { fill: COL, alpha: zA });
            g.wrap('change c, and nothing else: does e change?', x + 24, y + 418, 340, { size: 22, color: PAL.ink, lh: 1.3, alpha: S.tp(tCh + 0.6, 0.8) });
          });
        });

        // ---- Beat 2: potential outcomes.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tTwo = cue(S, 1, 'Each unit has'), tFP = cue(S, 1, 'Paul Holland'), tOne = cue(S, 1, 'the fundamental problem');
          const tx = 470, ty = 250, cw = [190, 230, 230, 170], rh = 76; const cx = [tx]; cw.forEach((w, k) => cx.push(cx[k] + w));
          const heads = ['unit', 'Y(1)', 'Y(0)', 'effect'], subs = ['', 'with wolves', 'without wolves', 'Y(1) − Y(0)'];
          heads.forEach((h, k) => { const a = S.p(1, 0.7, 0.5 + 0.35 * k); if (k === 0) caps(g, h, cx[0] + 20, ty + 34, { alpha: a }); else if (k === 3) g.text(h, cx[k] + cw[k] / 2, ty + 38, { size: 30, role: 'display', italic: true, align: 'center', color: PAL.ink2, alpha: a }); else g.math(h, cx[k] + cw[k] / 2, ty + 38, { size: 32, align: 'center', color: PAL.ink, alpha: a }); if (subs[k]) caps(g, subs[k], cx[k] + cw[k] / 2, ty + 66, { align: 'center', alpha: a }); });
          g.line(tx, ty + 84, cx[4], ty + 84, { color: PAL.rule, w: 1.5, alpha: S.p(1, 0.7, 0.5) });
          const reveal = S.tp(tOne, 0.8);
          D.rows.forEach((rw, i) => {
            const y = ty + 92 + i * rh, a = S.tp(tTwo + 0.2 + i * 0.18, 0.5); if (a <= 0) return;
            g.withAlpha(a, () => {
              g.icon('elk', cx[0] + 46, y + 38, 44, PAL.sand); g.text('elk ' + (i + 1), cx[0] + 84, y + 46, { size: 22, color: PAL.ink });
              [1, 2].forEach((col) => { const isObs = (col === 1) === (rw.treated === 1); const x = cx[col] + 16, w = cw[col] - 32;
                const fillA = isObs ? reveal : 0; g.rect(x, y + 10, w, rh - 20, { r: 6, fill: isObs ? U.rgba(rw.y ? PAL.moss : PAL.coral, 0.25 * reveal) : U.rgba(PAL.ink3, 0.1 * reveal + 0.04), stroke: isObs ? U.mix(PAL.ink3, rw.y ? PAL.moss : PAL.coral, reveal) : PAL.ink3, w: 1.5, dash: isObs ? undefined : [5, 5] });
                if (isObs) { g.text(rw.y ? 'lives' : 'dies', x + w / 2, y + 47, { size: 22, weight: 600, color: rw.y ? PAL.moss : PAL.coral, align: 'center', alpha: fillA }); g.text('?', x + w / 2, y + 48, { size: 26, color: PAL.ink3, align: 'center', alpha: 1 - fillA }); }
                else { g.text('?', x + w / 2, y + 48, { size: 26, color: PAL.ink3, align: 'center', alpha: 1 - reveal }); caps(g, 'never observed', x + w / 2, y + 44, { align: 'center', alpha: reveal, size: 17 }); } });
              g.text('?', cx[3] + cw[3] / 2, y + 48, { size: 26, color: COL, align: 'center', alpha: S.tp(tOne + 0.8, 0.6) });
            });
          });
          caps(g, 'illustrative', cx[4], ty - 4, { align: 'right', alpha: S.tp(tTwo, 0.6) });
          g.withAlpha(S.tp(tFP, 0.8), () => { caps(g, 'Holland', 104, 440, { color: COL }); g.wrap('The fundamental problem of causal inference', 104, 484, 320, { size: 32, role: 'display', italic: true, color: PAL.ink, lh: 1.15 }); });
          g.withAlpha(S.tp(tOne + 0.4, 0.8), () => { g.wrap('For any one unit, you observe only one of its potential outcomes.', 104, 654, 320, { size: 22, color: PAL.ink2, lh: 1.35 }); });
          g.withAlpha(S.tp(tOne + 1.4, 0.8), () => g.math('τ_{i} = Y_{i}(1) − Y_{i}(0)', 104, 820, { size: 34, color: COL }));
        });

        // ---- Beat 3: additive vs compensatory.
        const a2 = vis(S, 2, 3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tAd = cue(S, 2, 'Mortality is additive'), tCo = cue(S, 2, 'and compensatory'), tCF = cue(S, 2, 'That is a counterfactual');
          const panelBars = (x0, head, t0, other0, other1, pred, verdict) => {
            const a = S.p(2, 0.8, 0.4); if (a <= 0) return; const base = 800, H = 430, bw = 120, gap = 80;
            g.withAlpha(a, () => {
              caps(g, head, x0, 300, { color: COL, alpha: lerp(0.4, 1, S.tp(t0 - 0.2, 0.6)) }); g.line(x0 - 10, base, x0 + 2 * bw + gap + 30, base, { color: PAL.ink2, w: 2 });
              const p = ein(t, t0 + 0.3, 1.2), cfA = S.tp(tCF + 0.4, 0.8);
              // without predators (counterfactual for animals already dead)
              const h0 = H * other0 * p; if (h0 > 0.5) g.rect(x0, base - h0, bw, h0, { fill: U.rgba(PAL.ink3, lerp(0.45, 0.12, cfA)), stroke: PAL.ink3, w: 2, dash: cfA > 0.3 ? [7, 6] : undefined });
              // with predators
              const h1 = H * other1 * p, h2 = H * pred * ein(t, t0 + 1.0, 1.2); const x1 = x0 + bw + gap;
              if (h1 > 0.5) g.rect(x1, base - h1, bw, h1, { fill: U.rgba(PAL.ink3, 0.45), stroke: PAL.ink3, w: 2 }); if (h2 > 0.5) g.rect(x1, base - h1 - h2, bw, h2, { fill: U.rgba(PAL.coral, 0.6), stroke: PAL.coral, w: 2 });
              g.text('without', x0 + bw / 2, base + 32, { size: 22, color: PAL.ink, align: 'center' }); g.text('with', x1 + bw / 2, base + 32, { size: 22, color: PAL.ink, align: 'center' }); caps(g, 'predators', x0 + bw + gap / 2, base + 62, { align: 'center' });
              g.text(verdict, x0 + bw + gap / 2, 352, { size: 26, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(t0 + 1.8, 0.8) });
              g.withAlpha(cfA, () => { caps(g, 'never observed', x0 + bw / 2, base - h0 - 16, { color: COL, align: 'center' }); });
            });
          };
          caps(g, 'deaths per year, by cause', 104, 430, { alpha: S.p(2, 0.8, 0.6) });
          g.withAlpha(S.p(2, 0.8, 0.6), () => { g.rect(104, 458, 22, 22, { r: 3, fill: U.rgba(PAL.ink3, 0.45), stroke: PAL.ink3, w: 1.5 }); g.text('starvation, disease, winter', 138, 477, { size: 21, color: PAL.ink2 }); g.rect(104, 498, 22, 22, { r: 3, fill: U.rgba(PAL.coral, 0.6), stroke: PAL.coral, w: 1.5 }); g.text('predation', 138, 517, { size: 21, color: PAL.ink2 }); });
          g.withAlpha(S.p(2, 0.8, 0.3) * (1 - S.tp(tAd - 0.3, 0.6)), () => { g.text('Would they have died anyway?', 910, 560, { size: 46, role: 'display', italic: true, color: PAL.ink, align: 'center' }); caps(g, 'a wildlife version of the same problem', 910, 606, { align: 'center' }); });
          panelBars(520, 'additive', tAd, 0.42, 0.42, 0.34, 'kills add to deaths');
          panelBars(930, 'compensatory', tCo, 0.62, 0.3, 0.33, 'they would have died anyway');
          caps(g, 'stylized', 1300, 270, { align: 'right', alpha: S.tp(tAd, 0.6) });
          g.withAlpha(S.tp(tCF, 0.8), () => g.wrap('A claim about animals that are already dead', 104, 640, 300, { size: 30, role: 'display', italic: true, color: PAL.ink, lh: 1.18 }));
        });

        // ---- Beat 4: ages of cow elk killed by wolves and by hunters.
        const a3 = S.p(3, 0.8);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tY = cue(S, 3, 'In Yellowstone'), tWk = cue(S, 3, 'wolf-killed'), tHk = cue(S, 3, 'hunter-killed'), tOld = cue(S, 3, 'Old elk have'), tCo = cue(S, 3, 'more likely compensatory'), tAd = cue(S, 3, 'hunter kills more likely');
          const X0 = 500, XW = 760, Xa = (a) => X0 + (a / 21) * XW;
          const rows = [{ y: 290, h: 220, data: D.hunter, col: PAL.violet, lab: 'hunter-killed cows', t0: tHk, peak: 4, verdict: 'more likely additive', tv: tAd }, { y: 570, h: 220, data: D.wolf, col: PAL.coral, lab: 'wolf-killed cows', t0: tWk, peak: 16, verdict: 'more likely compensatory', tv: tCo }];
          // reproductive value, drawn behind
          const rv = (a) => Math.pow(a, 1.5) * Math.exp(-a / 3.2) / 2.35; const ra = S.tp(tOld, 1.0);
          if (ra > 0) rows.forEach((R, ri) => { const pts = []; for (let k = 0; k <= 80; k++) { const a = 0.5 + k / 80 * 20; pts.push([Xa(a), R.y + R.h - rv(a) * (R.h - 30)]); }
            g.poly([[Xa(0.5), R.y + R.h], ...pts, [Xa(20.5), R.y + R.h]], { fill: U.rgba(PAL.moss, 0.1), color: null, w: 0, alpha: ra }); g.poly(pts, { color: PAL.moss, w: 2.4, dash: [3, 6], alpha: 0.85, progress: ra });
            if (ri === 0) g.text('reproductive value', Xa(8.6), R.y + R.h - rv(8.6) * (R.h - 30) - 12, { size: 22, color: PAL.moss, alpha: ra }); });
          rows.forEach((R, ri) => {
            const a = S.tp(R.t0 - 0.3, 0.7);
            g.line(X0, R.y + R.h, X0 + XW, R.y + R.h, { color: PAL.ink2, w: 2, alpha: S.p(3, 0.8) });
            caps(g, R.lab, X0, R.y - 8, { color: R.col, alpha: S.p(3, 0.8, 0.3) });
            R.data.forEach((v, i) => { const age = i + 1; const p = ein(t, R.t0 - 0.3 + i * 0.03, 0.9); const h = v * (R.h - 40) * p; if (h > 0.5) g.rect(Xa(age - 0.42), R.y + R.h - h, (XW / 21) * 0.84, h, { fill: U.rgba(R.col, age === R.peak ? 0.75 : 0.4), stroke: R.col, w: 1.2 }); });
            const pk = S.tp(R.t0 + 0.6, 0.6); g.text('≈ ' + R.peak + ' yr', Xa(R.peak), R.y + 24, { size: 24, weight: 600, color: PAL.ink, align: 'center', alpha: pk });
            g.withAlpha(S.tp(R.tv, 0.7), () => { caps(g, ri ? 'wolf kills' : 'hunter kills', 104, 790 - ri * 0 + (ri ? 0 : -66), { color: R.col }); g.text(R.verdict, 104, 822 + (ri ? 0 : -66), { size: 28, role: 'display', italic: true, color: R.col }); });
          });
          [0, 4, 8, 12, 16, 20].forEach((a) => g.text(String(a), Xa(a), 826, { size: 21, color: PAL.ink3, align: 'center', alpha: S.p(3, 0.8) }));
          g.text('Age at death (years)', X0 + XW, 862, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(3, 0.8) });
          caps(g, 'stylized', X0 + XW, 270, { align: 'right', alpha: S.p(3, 0.8) });
          g.withAlpha(S.tp(tY, 0.8), () => { caps(g, 'Yellowstone, cow elk', 104, 440, { color: COL }); g.wrap('Ages of the cows killed by wolves and by hunters', 104, 482, 330, { size: 22, color: PAL.ink2, lh: 1.35 }); });
          g.withAlpha(S.tp(tOld, 0.8), () => g.wrap('Old elk have little time left to live or breed.', 104, 586, 330, { size: 30, role: 'display', italic: true, color: PAL.ink, lh: 1.18 }));
        });
      },
      terms: [
        { beat: 0.55, term: 'Counterfactual', def: 'A claim about what would have happened had some condition been different; the basis of Lewis’s analysis of causation.' },
        { beat: 0.85, term: 'Interventionist causation', def: 'C causes E if an intervention changing C, holding other things fixed, would change E (Woodward).' },
        { beat: 1.55, term: 'Fundamental problem of causal inference', def: 'Each unit reveals only one of its potential outcomes, so individual causal effects are never directly observed (Holland).' },
        { beat: 2.4, term: 'Additive vs compensatory mortality', def: 'Additive deaths raise total mortality; compensatory deaths replace deaths that would have occurred from other causes.' },
      ],
    },
    {
      id: 'cause-dag', title: 'Drawing the causes', register: 'infer',
      beats: [
        { t: 'Judea Pearl gave causal reasoning a picture: the directed acyclic graph, in which arrows show which variables affect which. Wolves, pumas, bears, hunters, and drought point at elk. Elk, bison, and water point at aspen and willow. Beaver points at water.',
          cite: 'Pearl 2009',
          v: 'The Northern Range DAG assembles node by node in house colors: predators coral, elk and bison sand, plants moss, water lagoon.' },
        { t: 'The graph tells you what to adjust for. To estimate the effect of wolves on elk, block every back-door path, every route by which a common cause, such as management, links the two. Pearl ranks causal questions on a ladder: association, intervention, and counterfactuals.',
          cite: 'Pearl & Mackenzie 2018',
          v: 'A back-door path through MANAGEMENT lights, then is blocked; a three-rung ladder appears at the side.' },
        { t: 'Adam Ford and Jacob Goheen applied this logic to trophic cascades. Three links must be shown: predators suppress herbivores; herbivores suppress plants; and so predators help plants. In Yellowstone, exclosures establish the second link. The first is the least certain, and the third is mixed.',
          cite: 'Ford & Goheen 2015; Wilmers et al. 2025',
          v: 'The three links highlighted on the DAG with status badges: link 2 solid (exclosures), link 1 dashed amber (uncertain), link 3 half-lit (mixed).' },
      ],
      init() {
        const nd = (label, icon, color, x, y, w = 168) => ({ label, icon, color, x, y, w, h: 56 });
        const N = {
          hunters: nd('HUNTERS', hunterGlyph, PAL.violet, 180, 300, 184), wolves: nd('WOLVES', 'wolf', PAL.coral, 376, 300, 172), pumas: nd('PUMAS', 'puma', PAL.coral, 566, 300, 164), bears: nd('BEARS', 'bear', PAL.coral, 752, 300, 164), drought: nd('DROUGHT', sunGlyph, PAL.ochre, 946, 300, 188),
          mgmt: nd('MANAGEMENT', managerGlyph, PAL.violet, 250, 450, 240),
          elk: nd('ELK', 'elk', PAL.sand, 570, 535, 150), bison: nd('BISON', 'bison', PAL.sand, 330, 620, 156), water: nd('WATER', waterGlyph, PAL.lagoon, 900, 640, 156), beaver: nd('BEAVER', 'beaver', PAL.lagoon, 956, 470, 172),
          aspen: nd('ASPEN', 'aspen', PAL.moss, 470, 790, 156), willow: nd('WILLOW', 'willow', PAL.moss, 750, 790, 162),
        };
        return { N };
      },
      draw(g, t, S, D) {
        const N = D.N;
        const s2 = cue(S, 0, 'Wolves, pumas'), s3 = cue(S, 0, 'Elk, bison'), s4 = cue(S, 0, 'Beaver points');
        const ap = {
          elk: S.p(0, 0.8, 0.6), wolves: S.tp(s2, 0.6), pumas: S.tp(cue(S, 0, 'pumas, bears'), 0.6), bears: S.tp(cue(S, 0, 'bears, hunters'), 0.6), hunters: S.tp(cue(S, 0, 'hunters, and'), 0.6), drought: S.tp(cue(S, 0, 'drought point'), 0.6),
          bison: S.tp(cue(S, 0, 'bison, and water'), 0.6), water: S.tp(cue(S, 0, 'water point'), 0.6), aspen: S.tp(cue(S, 0, 'aspen and willow'), 0.6), willow: S.tp(cue(S, 0, 'and willow') + 0.3, 0.6), beaver: S.tp(s4, 0.6),
        };
        const tMg = cue(S, 1, 'To estimate'), tBD = cue(S, 1, 'back-door'), tMan = cue(S, 1, 'such as management'), tLinks = cue(S, 1, 'links the two');
        ap.mgmt = S.tp(tMg + 0.6, 0.7);
        const tF = S.b(2), tL1 = cue(S, 2, 'predators suppress'), tL2 = cue(S, 2, 'herbivores suppress'), tL3 = cue(S, 2, 'and so predators'), tEx = cue(S, 2, 'In Yellowstone'), tFirst = cue(S, 2, 'The first'), tThird = cue(S, 2, 'the third is mixed');
        const f2 = S.tp(tF + 0.2, 1.0); // focus on the cascade links in beat 3
        const dimOf = (k) => (['wolves', 'elk', 'aspen', 'willow'].includes(k) ? 1 : lerp(1, 0.3, f2));
        // Edges.
        const E = [['wolves', 'elk', 'p'], ['pumas', 'elk', 'p'], ['bears', 'elk', 'p'], ['hunters', 'elk', 'p'], ['drought', 'elk', 'p'], ['elk', 'aspen', 'h'], ['elk', 'willow', 'h'], ['bison', 'aspen', 'h'], ['bison', 'willow', 'h'], ['water', 'aspen', 'h'], ['water', 'willow', 'h'], ['beaver', 'water', 'h']];
        const bd = S.tp(tBD + 0.3, 0.8) * (1 - S.p(2, 0.6)), blk = S.tp(tLinks + 0.8, 0.8);
        const lnk1 = S.tp(tL1, 0.7), lnk2 = S.tp(tL2, 0.7), st2 = S.tp(tEx + 0.6, 0.7), st1 = S.tp(tFirst + 0.2, 0.7), st3 = S.tp(tThird, 0.7);
        E.forEach(([a, b]) => {
          const p = Math.min(ap[a], ap[b]); if (p <= 0) return;
          let col = U.rgba(PAL.ink2, 0.85), w = 2, dash, alpha = dimOf(a) * dimOf(b) > 0.9 ? 1 : 0.35 + 0.65 * (1 - f2);
          if (a === 'wolves' && b === 'elk') { const hiW = S.tp(cue(S, 1, 'the effect of wolves'), 0.7) * (1 - S.p(2, 0.6)); col = U.mix('#B7B3C6', '#FFFFFF', hiW); w = 2 + 2.6 * hiW;
            if (lnk1 > 0) { col = U.mix(col.startsWith('#') ? col : '#B7B3C6', PAL.ochre, lnk1); w = 3.4; if (st1 > 0.5) dash = [9, 7]; } }
          if (a === 'elk' && (b === 'aspen' || b === 'willow') && lnk2 > 0) { col = U.mix('#B7B3C6', PAL.moss, lnk2); w = lerp(2, 5, st2); }
          link(g, N[a], N[b], { color: col, w, head: 13, progress: p, dash, alpha });
        });
        // Back-door path: wolves <- management -> hunters -> elk.
        if (ap.mgmt > 0) {
          link(g, N.mgmt, N.wolves, { color: PAL.ink2, w: 2, head: 13, progress: ap.mgmt, alpha: lerp(1, 0.35, f2) });
          link(g, N.mgmt, N.hunters, { color: PAL.ink2, w: 2, head: 13, progress: ap.mgmt, alpha: lerp(1, 0.35, f2) });
          if (bd > 0) { const lit = 1 - 0.75 * blk;
            [[N.mgmt, N.wolves], [N.mgmt, N.hunters], [N.hunters, N.elk]].forEach(([A, B], i) => { const [x1, y1] = rim(A, B.x, B.y, 5), [x2, y2] = rim(B, A.x, A.y, 7); const pr = S.tp(tBD + 0.3 + i * 0.45, 0.6); g.line(x1, y1, x2, y2, { color: COL, w: 10, alpha: 0.22 * bd * lit, progress: pr }); g.line(x1, y1, x2, y2, { color: COL, w: 3, alpha: bd * lit, progress: pr }); });
            const path = [[N.wolves.x, N.wolves.y], [N.mgmt.x, N.mgmt.y], [N.hunters.x, N.hunters.y], [N.elk.x, N.elk.y]];
            const ph = ((t - tBD) * 0.4) % 1; if (blk < 0.5 && t > tBD + 1.8) { const L = path.length - 1, s2 = ph * L, i = Math.floor(s2), f = s2 - i; g.dot(lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f), 7, COL, bd * (1 - blk * 2), 3); }
            caps(g, 'back-door path', N.mgmt.x - 10, N.mgmt.y + 62, { color: COL, align: 'center', alpha: bd * (1 - blk) });
          }
          nodeBox(g, N.mgmt, { alpha: ap.mgmt * lerp(1, 0.35, f2), hi: S.tp(tMan, 0.7) * (1 - blk) * (1 - S.p(2, 0.6)) });
          if (blk > 0) { const a = blk * (1 - S.p(2, 0.6)); g.rect(N.mgmt.x - N.mgmt.w / 2 - 10, N.mgmt.y - 38, N.mgmt.w + 20, 76, { r: 12, stroke: COL, w: 3, alpha: a }); caps(g, 'adjusted for: path blocked', N.mgmt.x - N.mgmt.w / 2 - 6, N.mgmt.y + 64, { color: COL, alpha: a }); }
        }
        for (const k in N) if (k !== 'mgmt') nodeBox(g, N[k], { alpha: ap[k] * dimOf(k), hi: k === 'elk' ? 0.4 : 0 });
        // Link badges (beat 3).
        const badge = (x, y, n, col, a) => { if (a <= 0) return; g.circle(x, y, 17, { fill: '#1B1832', stroke: col, w: 2.4, alpha: a }); g.text(String(n), x, y + 7, { size: 20, weight: 700, color: col, align: 'center', alpha: a }); };
        const m1 = [(N.wolves.x + N.elk.x) / 2 - 12, (N.wolves.y + N.elk.y) / 2 - 6], m2 = [(N.elk.x + N.aspen.x) / 2 + 2, (N.elk.y + N.aspen.y) / 2 + 6];
        badge(m1[0], m1[1], 1, st1 > 0.5 ? PAL.ochre : PAL.ink, lnk1); badge(m2[0] + 66, m2[1] - 4, 2, PAL.moss, lnk2);
        const l3 = S.tp(tL3, 0.9);
        if (l3 > 0) { const a3 = l3 * lerp(1, 0.55, st3); g.carrow(N.wolves.x - 70, N.wolves.y + 30, N.aspen.x - 76, N.aspen.y - 10, 0.3, { color: PAL.moss, w: 3, head: 14, dash: [2, 7], progress: l3, alpha: a3 });
          const bx = N.wolves.x - 152, by = N.aspen.y - 220; g.circle(bx, by, 17, { fill: '#1B1832', alpha: l3 }); if (st3 > 0) g.with(() => { g.ctx.beginPath(); g.ctx.rect(bx - 20, by - 20, 20, 40); g.ctx.clip(); g.circle(bx, by, 17, { fill: U.rgba(PAL.moss, 0.55), alpha: st3 }); });
          g.circle(bx, by, 17, { stroke: PAL.moss, w: 2.4, alpha: l3 }); g.text('3', bx, by + 7, { size: 20, weight: 700, color: PAL.ink, align: 'center', alpha: l3 }); }

        // Right column: how to read a DAG / the ladder / Ford & Goheen.
        const RX = 1070;
        const aR0 = vis(S, 0, 1);
        if (aR0 > 0) g.withAlpha(aR0, () => {
          const a = S.p(0, 0.8, 0.8); caps(g, 'reading the graph', RX, 300, { color: COL, alpha: a });
          vnode(g, RX + 26, 362, 'A', PAL.ink2, a, { r: 22 }); vnode(g, RX + 150, 362, 'B', PAL.ink2, a, { r: 22 }); varr(g, RX + 26, 362, RX + 150, 362, { r0: 26, r1: 28, alpha: a });
          g.text('A affects B', RX, 424, { size: 22, color: PAL.ink, alpha: a });
          const b = S.tp(cue(S, 0, 'acyclic'), 0.8); const cx = RX + 90, cy = 530;
          [[0, -50], [48, 30], [-48, 30]].forEach(([dx, dy], k, arr) => { const [ex, ey] = arr[(k + 1) % 3]; varr(g, cx + dx, cy + dy, cx + ex, cy + ey, { r0: 18, r1: 20, alpha: b * 0.8 }); vnode(g, cx + dx, cy + dy, ['A', 'B', 'C'][k], PAL.ink3, b, { r: 15 }); });
          g.line(cx - 66, cy - 66, cx + 66, cy + 60, { color: COL, w: 3.4, alpha: b, progress: S.tp(cue(S, 0, 'acyclic') + 0.5, 0.5) }); g.line(cx + 66, cy - 66, cx - 66, cy + 60, { color: COL, w: 3.4, alpha: b, progress: S.tp(cue(S, 0, 'acyclic') + 0.8, 0.5) });
          g.text('no loops', RX, 640, { size: 22, color: PAL.ink, alpha: b });
          const c = S.tp(s2 - 0.2, 0.8); [[PAL.coral, 'predators'], [PAL.violet, 'people'], [PAL.sand, 'herbivores'], [PAL.moss, 'plants'], [PAL.lagoon, 'water']].forEach(([col, s], k) => { const y = 702 + k * 34; g.rect(RX, y - 14, 14, 14, { r: 3, fill: col, alpha: c }); g.text(s, RX + 24, y, { size: 21, color: PAL.ink2, alpha: c }); });
        });
        const aR1 = vis(S, 1, 2);
        if (aR1 > 0) g.withAlpha(aR1, () => {
          const tLad = cue(S, 1, 'Pearl ranks'); const a = S.tp(tLad, 0.8);
          caps(g, 'ladder of causation', RX, 300, { color: COL, alpha: a });
          const lx = RX + 6, top = 360, bot = 820; g.line(lx, top, lx, bot, { color: PAL.ink2, w: 3, alpha: a, progress: a }); g.line(lx + 54, top, lx + 54, bot, { color: PAL.ink2, w: 3, alpha: a, progress: a });
          [['association', 'seeing', 'association'], ['intervention', 'doing', 'intervention, and'], ['counterfactuals', 'imagining', 'counterfactuals']].forEach(([s, sub, ph], k) => { const y = bot - 70 - k * 150; const ra = S.tp(cue(S, 1, ph), 0.6); g.line(lx, y, lx + 54, y, { color: COL, w: 4, alpha: ra }); g.text(String(k + 1), lx + 27, y - 12, { size: 20, weight: 700, color: COL, align: 'center', alpha: ra }); g.text(s, lx + 74, y + 2, { size: 25, role: 'display', color: PAL.ink, alpha: ra }); caps(g, sub, lx + 74, y + 30, { alpha: ra }); });
        });
        const aR2 = S.p(2, 0.8);
        if (aR2 > 0) g.withAlpha(aR2, () => {
          caps(g, 'three links to show', RX, 300, { color: COL });
          const items = [[1, 'Predators suppress herbivores', lnk1, st1, PAL.ochre, 'uncertain'], [2, 'Herbivores suppress plants', lnk2, st2, PAL.moss, 'exclosures'], [3, 'So predators help plants', l3, st3, PAL.moss, 'mixed']];
          items.forEach(([n, s, a, st, col, status], k) => { const y = 370 + k * 160; if (a <= 0) return; g.withAlpha(a, () => {
            g.circle(RX + 16, y - 7, 16, { fill: '#1B1832', stroke: st > 0.5 ? col : PAL.ink2, w: 2.2 }); g.text(String(n), RX + 16, y, { size: 19, weight: 700, color: st > 0.5 ? col : PAL.ink, align: 'center' });
            g.wrap(s, RX + 44, y, 220, { size: 22, color: PAL.ink, lh: 1.25 });
            if (st > 0) { const pw = g.measure(status, { size: 21, weight: 500 }) + 24; g.rect(RX + 44, y + 50, pw, 32, { r: 16, fill: U.rgba(col, n === 3 ? 0.12 : 0.22), stroke: col, w: 1.8, dash: n === 1 ? [5, 4] : undefined, alpha: st }); g.text(status, RX + 56, y + 73, { size: 21, weight: 500, color: col, alpha: st });
              if (n === 3) g.with(() => { g.ctx.beginPath(); g.ctx.rect(RX + 44, y + 50, pw / 2, 32); g.ctx.clip(); g.rect(RX + 44, y + 50, pw, 32, { r: 16, fill: U.rgba(col, 0.35), alpha: st }); }); }
          }); });
        });
      },
      terms: [
        { beat: 0.6, term: 'Directed acyclic graph', def: 'A diagram of causal assumptions in which arrows point from causes to effects and no path loops back on itself.' },
        { beat: 1.4, term: 'Back-door criterion', def: 'Pearl’s rule for which variables to adjust for: block every non-causal path that enters the exposure through an arrow pointing into it.' },
        { beat: 1.8, term: 'Ladder of causation', def: 'Pearl’s three levels of causal questions: association (seeing), intervention (doing), and counterfactuals (imagining).' },
      ],
    },
    {
      id: 'cause-design', title: 'Designs that break the symmetry', register: 'observe',
      beats: [
        { t: 'Ronald Fisher’s answer was randomization: assign treatments by chance, and confounders balance out on average. Crossing two treatments in a factorial design also reveals whether they interact.',
          cite: 'Fisher 1935',
          v: 'Plots assigned by a dice roll; confounder icons scatter evenly across treatments. A two-by-two grid template appears.' },
        { t: 'On the Northern Range, researchers crossed simulated beaver dams with elk exclosures. Either one alone sped willow growth. Together, they let willows pass browse height in about five years. Untreated controls never did, even after twenty.',
          cite: 'Bilyeu et al. 2008; Hobbs et al. 2024',
          v: 'The grid fills with willow plots: control, dam only, fence only, both; height curves race toward the 200 cm line, “both” crossing first.' },
        { t: 'Paired experiments can separate top-down from bottom-up. In Idaho, removing coyotes and pumas raised mule deer fawn survival slightly but did not change population growth. In Colorado, feeding deer in winter raised population growth by thirteen percent a year.',
          cite: 'Hurley et al. 2011; Bishop et al. 2009',
          v: 'Two experiment cards side by side: REMOVE PREDATORS (small arrow) and ADD FOOD (large arrow) on a population growth gauge.' },
        { t: 'Weaker designs leak. Many predator-removal programs had no controls and relaxed hunting at the same time, confounding by design. And nature sometimes runs the experiment: when canine parvovirus collapsed Isle Royale’s wolves, moose grew faster and to higher numbers.',
          cite: 'National Research Council 1997; Wilmers et al. 2006',
          v: 'A removal design with two treatments tangled together; then an island time series where wolves crash and the moose curve steepens.' },
        { t: 'When experiments are impossible, before-after-control-impact designs and Austin Bradford Hill’s viewpoints help weigh observational evidence. Interpretive social science adds another kind of cause: the reasons that move people, such as a rancher’s choice to tolerate elk.',
          cite: 'Stewart-Oaten et al. 1986; Hill 1965',
          v: 'BACI layout: impact and control sites, before and after; Hill’s viewpoints as a checklist; lens beat with the violet lens over the people nodes of the DAG.' },
      ],
      init() {
        const r = U.rng(845);
        // 16 plots; moist ones cluster near a creek on the left. Die faces assign treatment (4–6) or control (1–3).
        const plots = []; for (let i = 0; i < 16; i++) { const c = i % 4, rr = Math.floor(i / 4); const moist = r() < [0.85, 0.6, 0.25, 0.1][c]; plots.push({ c, rr, moist, face: 1 + Math.floor(r() * 6) }); }
        let guard = 0; const tally = () => { let mt = 0, mc = 0, dt = 0, dc = 0; plots.forEach((p) => { const T = p.face >= 4; if (p.moist) T ? mt++ : mc++; else T ? dt++ : dc++; }); return { mt, mc, dt, dc }; };
        while (guard++ < 200) { const q = tally(); if (Math.abs(q.mt - q.mc) <= 1 && Math.abs(q.dt - q.dc) <= 1) break; plots.forEach((p) => { p.face = 1 + Math.floor(r() * 6); }); }
        // Isle Royale outline (elongated SW–NE), stylized.
        const isle = []; for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2; const rx = 150 * (1 + 0.08 * U.noise1(k * 0.7, 3)), ry = 30 * (1 + 0.25 * U.noise1(k * 0.9, 8)); const x = Math.cos(a) * rx, y = Math.sin(a) * ry * (0.6 + 0.4 * Math.abs(Math.cos(a))); isle.push([x * 0.94 + y * 0.34, -x * 0.34 + y * 0.94]); }
        return { plots, tally: tally(), isle };
      },
      draw(g, t, S, D) {
        const H = { both: (y) => 50 + 300 * (1 - Math.exp(-y / 6.8)), fence: (y) => 50 + 280 * (1 - Math.exp(-y / 15)), dam: (y) => 50 + 240 * (1 - Math.exp(-y / 14)), control: (y) => 50 + 90 * (1 - Math.exp(-y / 12)) };
        // ---- Beat 1: randomization, then the factorial grid.
        const tF = cue(S, 0, 'Crossing two'), tAs = cue(S, 0, 'assign treatments'), tBal = cue(S, 0, 'confounders balance');
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const mv = ein(t, tF - 0.3, 1.2); const FX = lerp(420, 740, mv), FY = 330, cw = 132, ch = 104;
          const assignStart = tAs + 0.4, per = 0.24;
          caps(g, 'field plots', FX, FY - 30, { alpha: S.p(0, 0.6, 0.2) });
          g.line(FX - 30, FY - 6, FX - 30, FY + 4 * ch + 6, { color: PAL.lagoon, w: 4, alpha: S.p(0, 0.6, 0.2) }); caps(g, 'creek', FX - 40, FY + 4 * ch + 34, { color: PAL.lagoon, alpha: S.p(0, 0.6, 0.2) });
          D.plots.forEach((p, i) => {
            const x = FX + p.c * cw, y = FY + p.rr * ch, a = S.p(0, 0.5, 0.2 + i * 0.03); const as = clamp((t - (assignStart + i * per)) / 0.25); const T = p.face >= 4;
            const col = T ? COL : PAL.ink3;
            g.rect(x + 6, y + 6, cw - 12, ch - 12, { r: 6, fill: as > 0 ? U.rgba(col, 0.22 * as) : 'rgba(23,20,42,0.6)', stroke: as > 0 ? U.mix('#7C7893', col, as) : PAL.ink3, w: 1.6, alpha: a });
            if (p.moist) { const dx = x + 34, dy = y + ch / 2; g.with(() => { const c = g.ctx; c.globalAlpha *= a; c.fillStyle = PAL.lagoon; c.beginPath(); c.moveTo(dx, dy - 18); c.quadraticCurveTo(dx + 14, dy + 2, dx, dy + 12); c.quadraticCurveTo(dx - 14, dy + 2, dx, dy - 18); c.fill(); }); }
            if (as > 0) g.text(T ? 'T' : 'C', x + cw - 34, y + ch / 2 + 10, { size: 28, weight: 700, color: col, align: 'center', alpha: as });
          });
          // the die
          const k = clamp(Math.floor((t - assignStart) / per), 0, 15); const rolling = t > tAs - 0.4 && t < assignStart + 16 * per;
          const face = rolling ? (t < assignStart ? 1 + (Math.floor(t * 12) % 6) : D.plots[k].face) : D.plots[15].face;
          die(g, FX + 2 * cw, FY - 70 + (rolling ? -6 * Math.abs(Math.sin(t * 9)) : 0), 54, face, rolling ? Math.sin(t * 7) * 0.4 : 0.06, S.tp(tAs - 0.5, 0.6));
          g.withAlpha(S.tp(tAs + 0.4, 0.6), () => { const ly = FY + 4 * ch + 54, lx = FX + 110; g.rect(lx, ly - 15, 18, 18, { r: 3, fill: U.rgba(COL, 0.4), stroke: COL }); g.text('treatment: die shows 4–6', lx + 28, ly, { size: 21, color: PAL.ink2 }); g.rect(lx, ly + 21, 18, 18, { r: 3, fill: U.rgba(PAL.ink3, 0.4), stroke: PAL.ink3 }); g.text('control: die shows 1–3', lx + 28, ly + 36, { size: 21, color: PAL.ink2 }); });
          const ba = S.tp(tBal, 0.8) * (1 - mv);
          if (ba > 0) g.withAlpha(ba, () => { const x = FX + 4 * cw + 20; caps(g, 'moist plots', x, FY + 150, { color: PAL.lagoon }); g.text(`${D.tally.mt} treatment · ${D.tally.mc} control`, x, FY + 184, { size: 22, color: PAL.ink }); caps(g, 'dry plots', x, FY + 240); g.text(`${D.tally.dt} treatment · ${D.tally.dc} control`, x, FY + 274, { size: 22, color: PAL.ink }); g.wrap('Chance balances confounders on average, known or not.', x, FY + 340, 250, { size: 21, italic: true, color: PAL.ink2, lh: 1.3 }); });
          // factorial template
          const fa = S.tp(tF, 0.8);
          if (fa > 0) g.withAlpha(fa, () => {
            caps(g, '2 × 2 factorial', 190, 288, { color: COL });
            gridLabels(g);
            for (let k = 0; k < 4; k++) g.rect(190 + (k % 2) * 250, 350 + Math.floor(k / 2) * 240, 236, 226, { r: 8, stroke: PAL.ink2, w: 1.6, dash: [8, 7], alpha: S.tp(tF + 0.2 + k * 0.2, 0.5) });
            g.text('Do they interact?', 440, 870, { size: 28, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(cue(S, 0, 'whether they interact'), 0.8) });
          });
        });

        // ---- Beat 2: willow plots race to browse height.
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const tE = cue(S, 1, 'Either one'), tT = cue(S, 1, 'Together'), tN = cue(S, 1, 'Untreated controls');
          const yr = 20 * ein(t, S.b(1) + 1.6, Math.max(6, tN + 2.6 - S.b(1) - 1.6));
          const cells = [['control', 'control', 0, 0, PAL.ink2], ['dam only', 'dam', 1, 0, PAL.lagoon], ['fence only', 'fence', 0, 1, PAL.ochre], ['both', 'both', 1, 1, COL]];
          caps(g, '2 × 2 factorial', 190, 288, { color: COL });
          gridLabels(g);
          cells.forEach(([lab, key, dam, fence, col], k) => {
            const x = 190 + dam * 250, y = 350 + fence * 240, w = 236, h = 226, a = S.p(1, 0.6, 0.2 + k * 0.15); const GY = y + h - 34;
            g.withAlpha(a, () => {
              g.rect(x, y, w, h, { r: 8, fill: 'rgba(23,20,42,0.7)', stroke: col, w: 1.8 });
              g.text(lab, x + 16, y + 32, { size: 22, weight: 600, color: col });
              g.line(x + 14, GY, x + w - 14, GY, { color: PAL.ink3, w: 2 });
              if (dam) { g.rect(x + 16, GY - 4, w - 32, 12, { r: 4, fill: U.rgba(PAL.lagoon, 0.45) }); g.rect(x + w - 40, GY - 22, 12, 30, { r: 3, fill: PAL.clay }); }
              const hh = Math.min(290, H[key](yr)); const sz = 26 + hh * 0.42; g.icon('willow', x + w / 2 - 6, GY - sz * 0.5, sz, PAL.moss, { lw: 4 });
              const bl = GY - 0.9 * (26 + 200 * 0.42); g.line(x + 12, bl, x + w - 12, bl, { color: PAL.sand, w: 1.4, dash: [5, 5], alpha: 0.7 });
              if (fence) { for (let f = 0; f < 6; f++) g.line(x + 22 + f * (w - 44) / 5, GY, x + 22 + f * (w - 44) / 5, y + 52, { color: PAL.ink2, w: 2 }); g.line(x + 22, y + 66, x + w - 22, y + 66, { color: PAL.ink2, w: 1.2 }); g.line(x + 22, y + 108, x + w - 22, y + 108, { color: PAL.ink2, w: 1.2 }); }
              if (!fence) g.icon('elk', x + w - 50, GY - 30, 50, PAL.sand, { alpha: 0.85, flip: true });
            });
          });
          // height curves
          const A = g.axes({ x: 810, y: 320, w: 470, h: 440, xmin: 0, xmax: 20, ymin: 0, ymax: 340, labSize: 22, progress: S.p(1, 1.0, 0.4), xticks: [0, 5, 10, 15, 20].map((v) => ({ v, l: String(v) })), yticks: [0, 100, 200, 300].map((v) => ({ v, l: v + ' cm' })) });
          caps(g, 'stylized', 1280, 290, { align: 'right' }); caps(g, 'willow height', A.x - 4, 290, { alpha: S.p(1, 0.8, 0.6) }); g.text('years', A.x + A.w, A.y + A.h + 72, { size: 22, color: PAL.ink2, align: 'right', alpha: S.p(1, 0.8, 0.6) });
          g.line(A.X(0), A.Y(200), A.X(20), A.Y(200), { color: PAL.sand, w: 2.2, dash: [10, 8], progress: S.p(1, 1.0, 0.8) }); g.text('browse height', A.X(20), A.Y(200) + 30, { size: 21, color: PAL.sand, align: 'right', alpha: S.p(1, 0.8, 1.0) });
          cells.forEach(([lab, key, , , col]) => { if (yr <= 0.01) return; const tip = g.plot(A, H[key], { from: 0, to: yr, color: col, w: key === 'both' ? 4.5 : 3 }); g.dot(tip[0], tip[1], 5, col, 1, 2.4); });
          // crossing markers
          const cross = (key, yc, col, t0) => { if (yr < yc) return; const a = S.tp(Math.max(t0, 0), 0.6); g.glow(A.X(yc), A.Y(200), 40, col, 0.6 * a); g.circle(A.X(yc), A.Y(200), 7, { fill: col, alpha: a }); };
          const drop = (yc, col, a) => g.line(A.X(yc), A.Y(200) + 8, A.X(yc), A.y + A.h, { color: col, w: 1.6, dash: [3, 5], alpha: 0.8 * a });
          const a5 = yr >= 4.75 ? S.tp(Math.max(tT, 0), 0.6) : 0; cross('both', 4.75, COL, tT); drop(4.75, COL, a5); g.text('≈ 5', A.X(4.75), A.y + A.h + 72, { size: 22, weight: 600, color: COL, align: 'center', alpha: a5 });
          cross('fence', 11.7, PAL.ochre, tE); cross('dam', 13.9, PAL.lagoon, tE);
          const a10 = yr > 12 ? S.tp(tE, 0.6) : 0; drop(11.7, PAL.ochre, a10); drop(13.9, PAL.lagoon, a10); g.text('10–15', A.X(12.8), A.y + A.h + 72, { size: 21, color: PAL.ink2, align: 'center', alpha: a10 });
          g.text('control: never, even after 20', A.X(20), A.Y(H.control(20)) - 16, { size: 22, color: PAL.ink2, align: 'right', alpha: S.tp(tN + 0.4, 0.8) });
          g.pill(`year ${Math.floor(yr)}`, A.X(10), 290, { size: 21, role: 'mono', color: PAL.ink, align: 'center', alpha: S.p(1, 0.6, 1.2) });
        });

        // ---- Beat 3: top-down and bottom-up experiments.
        const a2 = vis(S, 2, 3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const tI = cue(S, 2, 'In Idaho'), tC = cue(S, 2, 'In Colorado'), tSl = cue(S, 2, 'raised mule deer'), tNo = cue(S, 2, 'did not change'), t13 = cue(S, 2, 'thirteen percent');
          g.text('top-down', 400, 300, { size: 34, role: 'display', italic: true, color: PAL.coral, align: 'center', alpha: S.p(2, 0.8, 0.3) }); g.text('bottom-up', 1020, 300, { size: 34, role: 'display', italic: true, color: PAL.moss, align: 'center', alpha: S.p(2, 0.8, 0.6) });
          const gauge = (cx, cy0, ang, a, col) => { const cy = cy0 + 30; return gauge0(cx, cy, ang, a, col); }; const gauge0 = (cx, cy, ang, a, col) => { g.withAlpha(a, () => { const R = 130; for (let k = 0; k <= 40; k++) { const th = Math.PI + k / 40 * Math.PI; const th2 = Math.PI + (k + 1) / 40 * Math.PI; if (k < 40) g.line(cx + Math.cos(th) * R, cy + Math.sin(th) * R, cx + Math.cos(th2) * R, cy + Math.sin(th2) * R, { color: k < 20 ? PAL.coral : PAL.moss, w: 6, alpha: 0.35 }); }
            [-1, 0, 1].forEach((k) => { const th = -Math.PI / 2 + k * 0.9; g.line(cx + Math.cos(th) * (R - 18), cy + Math.sin(th) * (R - 18), cx + Math.cos(th) * (R + 6), cy + Math.sin(th) * (R + 6), { color: PAL.ink2, w: 2 }); });
            caps(g, 'decline', cx - R, cy + 30, { align: 'center' }); caps(g, 'growth', cx + R, cy + 30, { align: 'center' }); caps(g, 'population growth rate', cx, cy + 62, { align: 'center' });
            const th = -Math.PI / 2 + ang; g.line(cx, cy, cx + Math.cos(th) * (R - 14), cy + Math.sin(th) * (R - 14), { color: col, w: 5 }); g.circle(cx, cy, 10, { fill: col }); }); };
          // Idaho
          const aI = S.tp(tI - 0.2, 0.8), aF = S.p(2, 0.8, 0.4);
          panel(g, 110, 330, 580, 540, aF); panel(g, 730, 330, 580, 540, aF);
          g.withAlpha(aF * (1 - S.tp(tI - 0.4, 0.5)), () => { caps(g, 'remove predators', 400, 600, { color: PAL.coral, align: 'center' }); caps(g, 'add food', 1020, 600, { color: PAL.moss, align: 'center' }); });
          g.withAlpha(aI, () => { caps(g, 'Idaho · remove predators', 134, 370, { color: PAL.coral });
            g.icon('coyote', 230, 440, 70, PAL.coral); g.icon('puma', 360, 440, 74, PAL.coral); g.line(190, 470, 410, 405, { color: PAL.ink, w: 3, progress: S.tp(tI + 0.6, 0.6) });
            const sa = S.tp(tSl, 0.7); g.icon('deer', 486, 446, 64, PAL.sand, { alpha: sa }); g.text('fawn survival', 528, 432, { size: 21, color: PAL.ink2, alpha: sa }); g.arrow(536, 470, 536, 450, { color: PAL.moss, w: 3, head: 10, alpha: sa, progress: sa }); g.text('slightly up', 552, 466, { size: 21, color: PAL.moss, alpha: sa }); });
          gauge(400, 730, 0, aI, PAL.ink);
          g.text('no change in growth', 400, 572, { size: 26, weight: 600, color: PAL.ink, align: 'center', alpha: S.tp(tNo, 0.7) });
          // Colorado
          const aC = S.tp(tC - 0.2, 0.8);
          g.withAlpha(aC, () => { caps(g, 'Colorado · add winter food', 754, 370, { color: PAL.moss });
            g.icon('grass', 870, 440, 66, PAL.moss); g.icon('grass', 914, 448, 54, PAL.moss); g.icon('deer', 1010, 444, 76, PAL.sand); g.text('winter feeding', 1070, 452, { size: 21, color: PAL.ink2 }); });
          const swing = 0.62 * ein(t, t13 - 0.4, 1.4);
          gauge(1020, 730, swing, aC, PAL.moss);
          g.text('+13% per year', 1020, 572, { size: 32, weight: 600, color: PAL.moss, align: 'center', alpha: S.tp(t13, 0.7) });
        });

        // ---- Beat 4: designs that leak; a natural experiment.
        const a3 = vis(S, 3, 4);
        if (a3 > 0) g.withAlpha(a3, () => {
          const tNoC = cue(S, 3, 'no controls'), tRel = cue(S, 3, 'relaxed hunting'), tCB = cue(S, 3, 'confounding by design'), tNat = cue(S, 3, 'And nature'), tPar = cue(S, 3, 'canine parvovirus'), tMo = cue(S, 3, 'moose grew');
          g.text('Weaker designs leak.', 110, 300, { size: 38, role: 'display', italic: true, color: PAL.ink, alpha: S.p(3, 0.8, 0.2) });
          // Tangled removal design.
          const y1 = 470, y2 = 600, xs = 140, xe = 560;
          const p1 = S.p(3, 1.4, 1.0), p2 = S.tp(tRel, 1.2);
          const rope = (yA, yB, ph, col, p) => { const pts = []; for (let k = 0; k <= 60; k++) { const u = k / 60; const mix = ease.inOut(clamp((u - 0.2) / 0.6)); const yy = lerp(yA, (y1 + y2) / 2, mix) + Math.sin(u * 22 + ph) * 26 * mix * (1 - u * 0.4); pts.push([lerp(xs, xe, u), yy]); } g.poly(pts, { color: col, w: 4, progress: p }); };
          nodeBox(g, { x: 250, y: y1 - 50, w: 250, h: 50, label: 'PREDATOR REMOVAL', color: PAL.coral }, { alpha: p1 }); nodeBox(g, { x: 250, y: y2 + 50, w: 250, h: 50, label: 'HUNTING RELAXED', color: PAL.violet }, { alpha: p2 });
          rope(y1, y2, 0, PAL.coral, p1); rope(y2, y1, Math.PI, PAL.violet, p2);
          const ar = S.tp(tRel + 1.0, 0.7); g.arrow(xe, (y1 + y2) / 2, xe + 40, (y1 + y2) / 2, { color: PAL.ink, w: 3, head: 14, alpha: ar }); g.text('prey ↑', xe + 50, (y1 + y2) / 2 + 9, { size: 26, weight: 600, color: PAL.sand, alpha: ar });
          g.withAlpha(S.tp(tNoC, 0.7), () => { g.rect(140, 720, 170, 60, { r: 8, stroke: PAL.ink3, w: 2, dash: [7, 6] }); caps(g, 'control', 225, 756, { align: 'center' }); g.line(150, 775, 300, 725, { color: COL, w: 3, progress: S.tp(tNoC + 0.4, 0.5) }); g.text('none', 330, 760, { size: 22, italic: true, color: COL }); });
          g.text('confounding by design', 140, 850, { size: 28, role: 'display', italic: true, color: COL, alpha: S.tp(tCB, 0.8) });
          // Isle Royale natural experiment.
          const aN = S.tp(tNat, 0.8);
          if (aN > 0) g.withAlpha(aN, () => {
            caps(g, 'a natural experiment', 720, 300, { color: COL });
            g.with(() => { g.ctx.translate(1130, 336); g.ctx.scale(0.72, 0.72); g.poly([...D.isle, D.isle[0]], { color: PAL.ink2, w: 2.6, fill: U.rgba(PAL.moss, 0.14) }); });
            g.text('Isle Royale', 720, 344, { size: 30, role: 'display', italic: true, color: PAL.ink });
            const A = g.axes({ x: 740, y: 420, w: 540, h: 360, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlab: 'Years', labSize: 22, progress: S.tp(tNat, 1.0), arrows: true });
            caps(g, 'stylized', 722, 384);
            const xP = 0.42; const pp = S.tp(tPar - 0.4, 2.4);
            const wolf = (x) => (x < xP ? 0.55 + 0.08 * Math.sin(x * 18) : 0.12 + 0.43 * Math.exp(-(x - xP) * 30) + 0.05 * Math.sin(x * 14));
            const mooseOld = (x) => 0.22 + 0.25 * x + 0.04 * Math.sin(x * 16);
            const moose = (x) => (x < xP ? mooseOld(x) : mooseOld(xP) + 1.45 * (x - xP) - 0.25 * (x - xP) * (x - xP) * 3.2 + 0.03 * Math.sin(x * 16));
            g.line(A.X(xP), A.y, A.X(xP), A.y + A.h, { color: COL, w: 2, dash: [6, 6], alpha: S.tp(tPar, 0.6) }); g.text('canine parvovirus', A.X(xP) - 10, A.y + 18, { size: 21, color: COL, align: 'right', alpha: S.tp(tPar, 0.6) });
            g.plot(A, mooseOld, { from: xP, to: 1, color: PAL.sand, w: 2, dash: [5, 6], alpha: 0.5 * S.tp(tMo, 0.8) });
            g.plot(A, wolf, { from: 0, to: lerp(0.4, 1, pp), color: PAL.coral, w: 3.4, progress: S.tp(tNat, 1.2) });
            g.plot(A, moose, { from: 0, to: lerp(0.4, 1, S.tp(tMo - 0.6, 2.0)), color: PAL.sand, w: 3.4, progress: S.tp(tNat, 1.2) });
            g.text('wolves', A.X(0.05), A.Y(0.66), { size: 22, weight: 600, color: PAL.coral }); g.text('moose', A.X(0.05), A.Y(0.1), { size: 22, weight: 600, color: PAL.sand });
            g.text('faster, and higher', 1280, 410, { size: 23, weight: 600, color: PAL.sand, align: 'right', alpha: S.tp(tMo + 1.0, 0.8) });
          });
        });

        // ---- Beat 5: BACI and Hill; then the interpretive lens.
        const a4 = S.p(4, 0.8);
        if (a4 > 0) g.withAlpha(a4, () => {
          const tB = cue(S, 4, 'before-after'), tHi = cue(S, 4, 'Austin Bradford Hill'), tInt = cue(S, 4, 'Interpretive'), tR = cue(S, 4, 'the reasons'), tRan = cue(S, 4, 'a rancher');
          const out = 1 - S.tp(tInt - 0.3, 0.8);
          if (out > 0) g.withAlpha(out, () => {
            caps(g, 'before-after-control-impact', 110, 290, { color: COL, alpha: S.tp(tB - 0.3, 0.7) });
            const A = g.axes({ x: 150, y: 330, w: 520, h: 380, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlab: 'Time', labSize: 22, progress: S.tp(tB - 0.3, 1.0) });
            const ev = 0.5; const pr = S.tp(tB, 2.0);
            g.rect(A.X(0), A.y, A.X(ev) - A.X(0), A.h, { fill: U.rgba(PAL.ink3, 0.05), alpha: pr }); caps(g, 'before', A.X(0.25), A.y + 24, { align: 'center', alpha: pr }); caps(g, 'after', A.X(0.75), A.y + 24, { align: 'center', alpha: pr });
            g.line(A.X(ev), A.y, A.X(ev), A.y + A.h, { color: COL, w: 2, dash: [6, 6], alpha: pr }); g.text('impact begins', A.X(ev) + 8, A.y + A.h - 14, { size: 21, color: COL, alpha: pr });
            const ctrl = (x) => 0.52 + 0.04 * Math.sin(x * 20), imp = (x) => 0.66 + 0.04 * Math.sin(x * 20 + 1) - (x > ev ? 0.36 * (1 - Math.exp(-(x - ev) * 9)) : 0);
            g.plot(A, ctrl, { color: PAL.ink2, w: 3, progress: pr }); g.plot(A, imp, { color: PAL.coral, w: 3.4, progress: pr });
            g.text('control site', A.X(1), A.Y(ctrl(1)) - 14, { size: 21, color: PAL.ink2, align: 'right', alpha: pr }); g.text('impact site', A.X(0.02), A.Y(imp(0)) - 16, { size: 21, color: PAL.coral, alpha: pr });
            g.wrap('effect = change at impact minus change at control', 150, 800, 520, { size: 22, color: PAL.ink, lh: 1.3, alpha: S.tp(tB + 2.0, 0.8) });
            // Hill's viewpoints
            const hv = ['strength', 'consistency', 'specificity', 'temporality', 'biological gradient', 'plausibility', 'coherence', 'experiment', 'analogy'];
            const ha = S.tp(tHi, 0.7); caps(g, 'Hill’s viewpoints', 780, 290, { color: COL, alpha: ha });
            hv.forEach((s, k) => { const y = 340 + k * 56, a = S.tp(tHi + 0.3 + k * 0.28, 0.5); g.rect(780, y - 20, 26, 26, { r: 5, stroke: PAL.ink2, w: 1.8, alpha: a }); tick(g, 793, y - 7, 22, COL, S.tp(tHi + 0.6 + k * 0.28, 0.4)); g.text(s, 822, y, { size: 23, color: PAL.ink, alpha: a }); });
          });
          // Interpretive lens over the people nodes.
          const li = S.tp(tInt - 0.1, 0.9);
          if (li > 0) g.withAlpha(li, () => {
            const P = { ranch: { x: 330, y: 380, w: 210, h: 56, label: 'RANCHERS', color: PAL.violet, icon: ranchGlyph }, hunt: { x: 330, y: 560, w: 210, h: 56, label: 'HUNTERS', color: PAL.violet, icon: hunterGlyph }, man: { x: 330, y: 740, w: 210, h: 56, label: 'MANAGERS', color: PAL.violet, icon: managerGlyph },
              elk: { x: 820, y: 560, w: 150, h: 56, label: 'ELK', color: PAL.sand, icon: 'elk' }, wolf: { x: 820, y: 360, w: 170, h: 56, label: 'WOLVES', color: PAL.coral, icon: 'wolf' }, aspen: { x: 1130, y: 560, w: 160, h: 56, label: 'ASPEN', color: PAL.moss, icon: 'aspen' } };
            ['ranch', 'hunt', 'man', 'wolf'].forEach((k) => link(g, P[k], P.elk, { color: PAL.ink2, w: 2, head: 13 })); link(g, P.elk, P.aspen, { color: PAL.ink2, w: 2, head: 13 });
            for (const k in P) nodeBox(g, P[k]);
            const lx = lerp(-120, 330, ein(t, tInt + 0.2, 1.8)), ly = 560, LR = 250;
            g.with(() => { const c = g.ctx; c.beginPath(); c.arc(lx, ly, LR, 0, Math.PI * 2); c.clip(); g.rect(lx - LR, ly - LR, 2 * LR, 2 * LR, { fill: '#17132B' });
              const ra = S.tp(tR, 0.8);
              person(g, lx - 40, ly + 70, 150, PAL.violet, { hat: 'wide', alpha: 0.95 });
              g.icon('elk', lx + 110, ly + 100, 80, PAL.sand, { alpha: 0.9, flip: true });
              g.withAlpha(ra, () => { g.rect(lx - 150, ly - 190, 300, 120, { r: 18, fill: 'rgba(180,156,230,0.16)', stroke: PAL.heather, w: 2 }); g.circle(lx - 70, ly - 56, 9, { fill: 'rgba(180,156,230,0.3)', stroke: PAL.heather, w: 1.5 }); g.circle(lx - 56, ly - 34, 6, { fill: 'rgba(180,156,230,0.3)', stroke: PAL.heather, w: 1.5 });
                caps(g, 'reasons', lx, ly - 156, { color: PAL.heather, align: 'center' }); g.text(t > tRan + 0.3 ? 'Why tolerate elk' : 'What moves people?', lx, ly - 118, { size: 23, color: PAL.ink, align: 'center' }); g.text(t > tRan + 0.3 ? 'on my land?' : '', lx, ly - 88, { size: 23, color: PAL.ink, align: 'center' }); });
            });
            g.lens('int', lx, ly, LR, { alpha: 1, labSize: 18 });
          });
        });
      },
      terms: [
        { beat: 0.2, term: 'Randomization', def: 'Assigning treatments by chance so that confounders are balanced across groups in expectation (Fisher).' },
        { beat: 0.75, term: 'Interaction', def: 'When the effect of one factor depends on the level of another, revealed by factorial designs.' },
        { beat: 3.6, term: 'Natural experiment', def: 'A comparison created by events outside the researcher’s control that approximates random assignment.' },
        { beat: 4.25, term: 'BACI design', def: 'Before-after-control-impact: compares change at impact sites with change at control sites over the same period.' },
      ],
    },
  ],
});
})();
