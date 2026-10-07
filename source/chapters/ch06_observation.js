/* Chapter VI — The theory-ladenness of observation. Case file: the five tallest stems. */
(function () {
const { PAL, U, Theater } = window; const { lerp, ease } = U;
const COL = PAL.mint;

// Local helpers ----------------------------------------------------------------
const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));
// Local time at which a phrase in beat k is spoken (proportional to its position in the caption).
const cue = (S, k, phrase) => { const b = S.scene.beats[k]; const i = b.t.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / b.t.length); };
const caps = (g, s, x, y, o = {}) => g.text(s.toUpperCase(), x, y, { size: 17, weight: 600, ls: 2.6, color: PAL.ink3, ...o });
const { clamp } = U; const TAU = Math.PI * 2;
// Ease-in-out progress from absolute local time s0 over d seconds.
const io = (S, s0, d = 1) => ease.inOut((S.t - s0) / d);
// A standing figure in a long coat (people are violet); (x, y) are the feet, s the height.
function figure(g, x, y, s, col = PAL.violet, a = 1) {
  if (a <= 0) return; const c = g.ctx; const k = s / 74; c.save(); c.globalAlpha *= a; c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y - 64 * k, 9 * k, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - 9 * k, y - 53 * k); c.lineTo(x + 9 * k, y - 53 * k); c.lineTo(x + 16 * k, y - 12 * k); c.lineTo(x - 16 * k, y - 12 * k); c.closePath(); c.fill();
  c.lineWidth = 4 * k; c.beginPath(); c.moveTo(x - 6 * k, y - 13 * k); c.lineTo(x - 7 * k, y); c.moveTo(x + 6 * k, y - 13 * k); c.lineTo(x + 7 * k, y); c.stroke(); c.restore();
}
// Pre-render a terrain tile: open country (sand) and forest (moss conifers), with a stream. forest(x, y) -> bool.
function terrain(r, W, H, forest, o = {}) {
  const cv = Theater.makeCanvas(W, H); const c = cv.getContext('2d'); const tg = Theater.makeG(c);
  c.fillStyle = 'rgba(18,16,36,0.95)'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { c.fillStyle = forest(x + 2, y + 2) ? 'rgba(156,199,126,0.11)' : 'rgba(216,196,155,0.07)'; c.fillRect(x, y, 4, 4); }
  const n = o.trees ?? Math.round(W * H / 2000);
  for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) { const x = r() * W, y = r() * H; if (!forest(x, y)) continue; tg.icon('conifer', x, y, (o.tree || 16) + r() * 7, PAL.moss, { alpha: 0.55 + r() * 0.3 }); k++; }
  c.strokeStyle = 'rgba(216,196,155,0.35)'; c.lineWidth = 1.2; c.beginPath();
  for (let k = 0, tries = 0; k < n * 1.4 && tries < n * 8; tries++) { const x = r() * W, y = r() * H; if (forest(x, y)) continue; c.moveTo(x, y); c.lineTo(x + 2, y - 6); c.moveTo(x + 4, y); c.lineTo(x + 5, y - 5); k++; }
  c.stroke();
  if (o.stream) tg.poly(o.stream, { color: PAL.lagoon, w: o.sw || 3, alpha: 0.8 });
  return cv;
}
// Elk daytime-in-forest weight for hour h (0..24): 0 at night (open country), 1 by day (forest).
const dayness = (h) => ease.inOut(clamp((h - 5.5) / 2.5)) * ease.inOut(clamp((19.5 - h) / 2.5));
// A random walk of n steps that stays where ok(x, y) holds, inside a W×H box.
function walk(r, n, x0, y0, step, W, H, ok) {
  const pts = [[x0, y0]]; let x = x0, y = y0, a = r() * TAU;
  for (let k = 1; k < n; k++) { for (let q = 0; q < 16; q++) { const na = a + (r() - 0.5) * (q < 6 ? 1.1 : 4); const nx = x + Math.cos(na) * step, ny = y + Math.sin(na) * step; if (nx > 18 && nx < W - 18 && ny > 18 && ny < H - 18 && ok(nx, ny)) { x = nx; y = ny; a = na; break; } } pts.push([x, y]); }
  return pts;
}
// Hanson's dawn, inside a rounded panel. o.sun: sun height above the level horizon (px);
// o.tilt: rotation of the ground about the observer's feet (rad, + turns the eastern horizon down).
function dawn(g, x, y, w, h, o) {
  const ctx = g.ctx; const hy = y + h * 0.7; const fx = x + w * (o.who === 'both' ? 0.3 : 0.24), fy = hy - 48;
  const sx = x + w * 0.8, sy = hy - o.sun, tilt = o.tilt || 0, light = o.light ?? 1; const eh = 66;
  const ex = fx + Math.sin(tilt) * eh, ey = fy - Math.cos(tilt) * eh;
  g.with(() => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, hy + 40); sky.addColorStop(0, 'rgba(16,14,34,0.92)'); sky.addColorStop(0.68, 'rgba(58,42,85,0.62)'); sky.addColorStop(1, U.rgba(PAL.ochre, 0.34 * light)); ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    g.glow(sx, sy, 300, PAL.ochre, 0.5 * light); g.glow(sx, sy, 110, '#FFE6A8', 0.45 * light);
    g.circle(sx, sy, 30, { fill: '#F7DC92', alpha: 0.4 + 0.6 * light });
    if (o.ray > 0) for (const d of [-7, 0, 7]) g.line(sx, sy + d, ex, ey + d * 0.3, { color: '#F7DC92', w: d ? 1.2 : 2.4, alpha: (d ? 0.4 : 0.85) * o.ray, progress: o.ray });
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(tilt); ctx.translate(-fx, -fy);
    ctx.beginPath(); ctx.moveTo(x - 700, hy); ctx.lineTo(fx - 230, hy); ctx.bezierCurveTo(fx - 120, hy, fx - 90, fy, fx, fy); ctx.bezierCurveTo(fx + 90, fy, fx + 120, hy, fx + 230, hy);
    ctx.lineTo(x + w + 700, hy); ctx.lineTo(x + w + 700, hy + 1400); ctx.lineTo(x - 700, hy + 1400); ctx.closePath();
    ctx.fillStyle = '#131126'; ctx.fill(); ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = U.rgba(PAL.ink3, 0.5); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let k = 0; k < 26; k++) { const gx = x - 200 + k * (w + 400) / 26, gy = hy + 26 + (k * 37 % 5) * 14; ctx.moveTo(gx, gy); ctx.lineTo(gx + 22, gy); } ctx.stroke();
    if (o.who === 'both') { figure(g, fx - 22, fy, 76, PAL.violet, o.figA ?? 1); figure(g, fx + 22, fy, 76, PAL.violet, o.figA ?? 1); }
    else figure(g, fx, fy, 78, PAL.violet, 1);
    ctx.restore();
  });
  g.rect(x, y, w, h, { r: 12, stroke: PAL.rule, w: 1.5 });
  return { fx, fy, hy, sx, sy, ex, ey };
}

Theater.chapter({
  id: 'obs', roman: 'VI', title: 'Observation', color: COL,
  question: 'Is there such a thing as a pure observation?',
  casefile: { title: 'The five tallest stems', sketch: 'aspen' },
  intro: { t: 'Chapter six. Observation, and the theory it carries.' },
  scenes: [
    {
      id: 'obs-seeing', title: 'Seeing as', register: 'observe',
      beats: [
        { t: 'Is there such a thing as a pure observation? Norwood Russell Hanson asked us to imagine Tycho Brahe and Johannes Kepler on a hill at dawn. Tycho, who believed the earth stood still, sees the sun rise. Kepler sees the horizon turn away. The same light, seen differently.',
          s: 'Is there such a thing as a pure observation? Norwood Russell Hanson asked us to imagine Tycho Bra-hee and Johannes Kepler on a hill at dawn. Tycho, who believed the earth stood still, sees the sun rise. Kepler sees the horizon turn away. The same light, seen differently.',
          cite: 'Hanson 1958',
          v: 'Two silhouettes on a hill; the same sunrise drawn twice, once with the sun moving up, once with the horizon rotating down.' },
        { t: 'Observation is theory-laden: what we notice, how we describe it, and what we record depend on the concepts we bring. James Bogen and James Woodward add a distinction. Data are the records we collect. Phenomena are the stable features of the world we infer from them, and theories explain phenomena, not data.',
          cite: 'Bogen & Woodward 1988',
          v: 'Noisy data points (OBSERVE band) condense into a smooth phenomenon curve (INFER band); a theory card points at the curve, not the points.' },
      ],
      init() {
        const r = U.rng(6101);
        const pts = []; for (let k = 0; k < 64; k++) { const x = (k + 0.2 + r() * 0.6) / 64; pts.push([x, 0.5 + 0.3 * Math.sin(TAU * (x - 0.28)) + U.gauss(r) * 0.12]); }
        const stems = []; for (let k = 0; k < 8; k++) { const browsed = [1, 4, 6].includes(k); stems.push({ x: 470 + k * 108 + (r() - 0.5) * 18, h: (190 + r() * 110) * (browsed ? 0.55 : 1), browsed, leaf: r() * 6.28 }); }
        return { pts, stems };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        // ---- Beat 0: Tycho and Kepler on a hill at dawn.
        const tHa = cue(S, 0, 'Norwood Russell'), tTK = cue(S, 0, 'Tycho Brahe and'), tDawn = cue(S, 0, 'on a hill at dawn'), tTy = cue(S, 0, 'Tycho, who believed'), tSR = cue(S, 0, 'sees the sun rise'), tKe = cue(S, 0, 'Kepler sees the horizon'), tSame = cue(S, 0, 'The same light');
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          caps(g, 'Hanson’s thought experiment', 100, 262, { color: COL, alpha: S.tp(tHa, 0.8) });
          const light = 0.3 + 0.7 * S.tp(tDawn, 2.2); const split = io(S, tTy - 0.3, 1.1);
          if (split < 1) g.withAlpha((1 - split) * S.p(0, 1.2, 0.2), () => {
            const P = dawn(g, 100, 290, 1230, 520, { who: 'both', sun: -30, light, figA: S.tp(tTK, 0.8) });
            g.withAlpha(S.tp(tTK + 0.4, 0.8), () => { caps(g, 'Tycho', P.fx - 30, P.fy - 100, { align: 'right', color: PAL.violet }); caps(g, 'Kepler', P.fx + 30, P.fy - 100, { color: PAL.violet }); });
          });
          if (split > 0) g.withAlpha(split, () => {
            const kT = ease.inOut(clamp((t - tSR + 0.2) / 2.6)), kK = ease.inOut(clamp((t - tKe + 0.1) / 2.6)); const same = S.tp(tSame, 1.0);
            const A = dawn(g, 100, 290, 600, 520, { who: 'tycho', sun: lerp(-30, 56, kT), light, ray: same });
            const B = dawn(g, 730, 290, 600, 520, { who: 'kepler', sun: -30, tilt: 0.262 * kK, light, ray: same });
            caps(g, 'Tycho Brahe', 124, 334, { color: PAL.violet }); g.text('the earth stands still', 124, 366, { size: 22, italic: true, color: PAL.ink2 });
            caps(g, 'Johannes Kepler', 754, 334, { color: PAL.violet }); g.text('the earth turns', 754, 366, { size: 22, italic: true, color: PAL.ink2, alpha: S.tp(tKe - 1.0, 0.8) });
            // motion marks: the sun climbs; the horizon turns down
            const mT = S.tp(tSR - 0.2, 0.6) * (1 - S.tp(tSame + 0.5, 0.8)), mK = S.tp(tKe - 0.1, 0.6) * (1 - S.tp(tSame + 0.5, 0.8));
            g.arrow(A.sx + 56, A.hy + 22, A.sx + 56, A.hy - 70, { color: PAL.ochre, w: 2.6, head: 13, alpha: mT, progress: S.tp(tSR - 0.2, 1.2) });
            const R = 396, arc = []; for (let k = 0; k <= 30; k++) { const an = -0.06 + 0.32 * k / 30; arc.push([B.fx + R * Math.cos(an), B.fy + R * Math.sin(an)]); }
            const tip = g.poly(arc, { color: PAL.ink, w: 2.6, alpha: mK, progress: S.tp(tKe, 1.2) }); if (tip && mK > 0) g.withAlpha(mK, () => g.arrowHead(tip[0], tip[1], 0.26 + Math.PI / 2, 13, PAL.ink));
            g.text('sees the sun rise', 400, 776, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tSR, 0.8) });
            g.text('sees the horizon turn away', 1030, 776, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tKe, 0.8) });
            g.text('the same light, seen differently', 715, 870, { size: 34, role: 'display', italic: true, color: '#F7DC92', align: 'center', alpha: S.tp(tSame + 0.3, 0.9) });
          });
        });

        // ---- Beat 1a: what we notice, describe, and record depends on our concepts.
        const tNo = cue(S, 1, 'what we notice'), tDe = cue(S, 1, 'how we describe'), tRe = cue(S, 1, 'what we record'), tCo = cue(S, 1, 'the concepts we bring'), tBW = cue(S, 1, 'James Bogen');
        const aV = S.p(1, 0.8) * (1 - S.tp(tBW - 0.2, 0.7));
        if (aV > 0) g.withAlpha(aV, () => {
          const GY = 700, OX = 210, EX = 238, EY = 566; const co = S.tp(tCo, 0.8);
          g.line(120, GY, 1290, GY, { color: PAL.ink3, w: 2 });
          g.poly([[EX, EY], [1290, 400], [1290, GY]], { fill: U.rgba(COL, 0.04 + 0.06 * co), color: null, w: 0, close: true });
          figure(g, OX, GY, 150, PAL.violet);
          g.circle(EX, EY, 20, { stroke: COL, w: 3 }); g.glow(EX, EY, 50 + 30 * co, COL, 0.3 + 0.5 * co);
          caps(g, 'concepts', EX, EY - 46, { align: 'center', color: COL }); if (co > 0) caps(g, 'the concepts we bring', 120, GY + 44, { color: COL, alpha: co });
          D.stems.forEach((st, k) => {
            const top = GY - st.h; g.line(st.x, GY, st.x, top, { color: PAL.snow, w: 3, alpha: 0.75 });
            if (st.browsed) { g.line(st.x - 9, top, st.x + 9, top, { color: PAL.sand, w: 3 }); g.line(st.x, top + 26, st.x - 14, top + 12, { color: PAL.snow, w: 2, alpha: 0.6 }); g.line(st.x, top + 34, st.x + 15, top + 22, { color: PAL.snow, w: 2, alpha: 0.6 }); }
            const nl = st.browsed ? 2 : 5; for (let q = 0; q < nl; q++) { const a = st.leaf + q * 1.3; g.ellipse(st.x + Math.cos(a) * 9, top + 4 + Math.sin(a) * 7, 8, 5, { rot: a, fill: PAL.moss, alpha: 0.85 }); }
            if (!st.browsed) return; const n = [1, 4, 6].indexOf(k);
            g.circle(st.x, top + 10, 30, { stroke: COL, w: 2.4, alpha: S.tp(tNo + n * 0.25, 0.5) });
            g.pill('browsed', st.x, top - 44, { size: 21, color: PAL.sand, align: 'center', alpha: S.tp(tDe + n * 0.25, 0.5) });
          });
          g.withAlpha(S.tp(tRe - 0.1, 0.6), () => {
            g.rect(880, 732, 380, 150, { r: 4, fill: '#ECE3CC', alpha: 0.95 }); g.line(900, 772, 1240, 772, { color: '#C76E6E', w: 1.2 });
            g.text('FIELD NOTES', 900, 760, { size: 17, weight: 600, ls: 2.4, color: '#6B5A3A' });
            [2, 5, 7].forEach((n, q) => g.text(`stem ${n} · browsed`, 900, 806 + q * 30, { size: 21, role: 'mono', color: '#24203A', alpha: S.tp(tRe + 0.2 + q * 0.3, 0.4) }));
          });
        });

        // ---- Beat 1b: data (observe) condense into a phenomenon (infer); theory explains the phenomenon.
        const tDa = cue(S, 1, 'Data are the records'), tPh = cue(S, 1, 'Phenomena are'), tTh = cue(S, 1, 'theories explain'), tND = cue(S, 1, 'not data');
        const aB = S.tp(tBW, 0.8);
        if (aB > 0) {
          const act = []; if (t > tDa) act.push('observe'); if (t > tPh) act.push('infer'); if (t > tTh) act.push('claim');
          const R = g.bands(150, 262, 1150, 616, { active: act, alpha: aB, labSize: 20 });
          const X = (u) => 400 + u * 860; const Yb = (b, v) => b.y + b.h - 24 - clamp(v) * (b.h - 48); const f = (x) => 0.5 + 0.3 * Math.sin(TAU * (x - 0.28));
          g.withAlpha(aB, () => {
            const ob = R.observe, inf = R.infer, cl = R.claim;
            g.withAlpha(S.tp(tDa, 0.7), () => { g.wrap('data: the records we collect', 168, ob.y + ob.h / 2 + 34, 200, { size: 21, italic: true, color: PAL.ink2, lh: 1.25 }); });
            D.pts.forEach(([x, v], k) => g.dot(X(x), Yb(ob, v), 4.5, PAL.ink2, S.tp(tDa + x * 1.2, 0.4), 2.2));
            caps(g, 'elk counted per day, one year', X(0), ob.y + 28, { alpha: S.tp(tDa + 0.4, 0.6) });
            g.withAlpha(S.tp(tPh, 0.7), () => { g.wrap('phenomenon: a stable pattern', 168, inf.y + inf.h / 2 + 34, 200, { size: 21, italic: true, color: PAL.ink2, lh: 1.25 }); caps(g, 'stylized', X(1), inf.y + 26, { align: 'right', size: 15 }); });
            D.pts.forEach(([x, v]) => { const q = clamp((t - tPh - 0.2 - x * 1.6) / 1.0); if (q <= 0 || q >= 1) return; const e = ease.inOut(q); g.dot(X(x), lerp(Yb(ob, v), Yb(inf, f(x)), e), 3.5, COL, Math.min(1, q * 4) * (1 - q), 2); });
            const pts = []; for (let k = 0; k <= 120; k++) { const x = k / 120; pts.push([X(x), Yb(inf, f(x))]); }
            g.poly(pts, { color: g.REG.infer.color, w: 4.5, progress: S.tp(tPh + 0.6, 2.4) });
            // the theory card points at the phenomenon, not the data
            const ta = S.tp(tTh - 0.3, 0.8); const cx = 720, cw = 300, cy0 = cl.y + 30, chh = cl.h - 60;
            g.withAlpha(ta, () => { g.rect(cx - cw / 2, cy0, cw, chh, { r: 6, fill: PAL.panel, stroke: g.REG.claim.color, w: 2 }); g.text('Theory', cx, cy0 + 48, { size: 36, role: 'display', color: PAL.ink, align: 'center' }); g.text('explains the phenomenon', cx, cy0 + 84, { size: 21, color: PAL.ink2, align: 'center' }); });
            const px = X(0.53), py = Yb(inf, f(0.53)) - 10;
            g.arrow(cx, cy0 + chh + 4, px, py, { color: g.REG.claim.color, w: 3, head: 15, progress: S.tp(tTh + 0.2, 0.9) });
            const nd = S.tp(tND - 1.0, 0.7); const qx = X(0.83), qy = Yb(ob, D.pts[53][1]) - 12, sx0 = cx + cw / 2 - 20, sy0 = cy0 + chh + 4;
            g.arrow(sx0, sy0, qx, qy, { color: PAL.ink3, w: 2, head: 12, dash: [6, 7], progress: nd, alpha: 0.9 });
            const fm = (inf.y + inf.h + ob.y) / 2, fq = (fm - sy0) / (qy - sy0), mx = lerp(sx0, qx, fq), my = fm;
            g.withAlpha(S.tp(tND - 0.15, 0.4), () => { g.line(mx - 13, my - 13, mx + 13, my + 13, { color: PAL.coral, w: 4 }); g.line(mx - 13, my + 13, mx + 13, my - 13, { color: PAL.coral, w: 4 }); g.text('not data', mx + 24, my + 8, { size: 22, color: PAL.coral }); });
          });
        }
      },
      terms: [
        { beat: 1.1, term: 'Theory-ladenness', def: 'The dependence of what is observed, described, and recorded on the observer’s concepts, expectations, and instruments (Hanson).' },
        { beat: 1.6, term: 'Data vs phenomena', def: 'Data are particular records; phenomena are stable features inferred from them. Theories explain phenomena (Bogen and Woodward).' },
      ],
    },
    {
      id: 'obs-stems', title: 'Case file: the five tallest stems', register: 'observe',
      beats: [
        { t: 'How do you see whether aspen are recovering? William Ripple and Robert Beschta measured the five tallest young aspen in each stand, reasoning that recovery would show first among the leaders. Matthew Kauffman and colleagues measured every young aspen in random plots, and found no difference with predation risk.',
          s: 'How do you see whether aspen are recovering? William Ripple and Robert Besh-ta measured the five tallest young aspen in each stand, reasoning that recovery would show first among the leaders. Matthew Kauffman and colleagues measured every young aspen in random plots, and found no difference with predation risk.',
          cite: 'Ripple & Beschta 2007; Kauffman et al. 2010',
          v: 'Case-file card (aspen). One stand drawn as many stems of varied height; the five tallest highlight in one color; random plot frames drop in another.' },
        { t: 'Revisiting the stands in 2012, Luke Painter and colleagues used both designs, random plots and the tallest stems, and drew their main range-wide conclusion largely from the random samples. Up to sixty-five percent of stands had at least one sapling taller than two hundred centimeters, the height at which aspen escape browsing elk.',
          cite: 'Painter et al. 2015',
          v: 'Both designs stay highlighted; a 200 cm browse line across the stand; leaders poke above it; a stand counter climbs to 65%; a note that the main inference rested largely on the random plots.' },
        { t: 'Then Elaine Brice and colleagues compared the two designs. Both detected a cascade, but random sampling showed a much weaker signal. The tallest stems can show whether a cascade is happening; only a random sample can show how strong it is.',
          cite: 'Brice et al. 2022, 2024',
          v: 'Two response curves side by side from the same stands: tallest-stem curve steep, random-sample curve shallow.' },
        { t: 'Willow told a similar story: studies concentrated at well-watered sites overstated its recovery. Neither design was dishonest. Each embodied a different question, and the question shaped what was seen.',
          cite: 'Hobbs et al. 2024',
          v: 'A creek map with sampled sites clustered on the wet reaches; the landscape-wide picture greyer.' },
      ],
      init() {
        const r = U.rng(606); const stems = []; const N = 64;
        for (let i = 0; i < N; i++) stems.push({ x: 480 + (i + 0.5) / N * 790 + (r() - 0.5) * 9, h0: 45 + Math.pow(r(), 1.7) * 118, lean: (r() - 0.5) * 0.07, grow: Math.pow(r(), 3) * 40, leaf: r() * 6.28 });
        const order = stems.map((_, i) => i).sort((a, b) => stems[b].h0 - stems[a].h0);
        order.slice(0, 5).forEach((i, k) => { stems[i].grow = [96, 74, 58, 26, 14][k]; });
        const tall = new Set(order.slice(0, 5));
        const plots = [[5, 11], [21, 27], [37, 43], [52, 58]].map(([a, b]) => ({ a, b, x0: stems[a].x - 9, x1: stems[b].x + 9 }));
        // Creek for the willow beat: a meander with two well-watered reaches.
        const creek = []; for (let k = 0; k <= 120; k++) { const u = k / 120; creek.push([470 + 820 * u, 330 + 440 * u + 62 * Math.sin(u * 9.5)]); }
        const wet = (u) => (u > 0.08 && u < 0.3) || (u > 0.56 && u < 0.74);
        const willows = []; for (let k = 0; k < 34; k++) { const u = 0.03 + 0.94 * (k + r() * 0.6) / 34; const i = Math.round(u * 120); const side = k % 2 ? 1 : -1; const [cx, cy] = creek[i]; willows.push({ x: cx + side * (26 + r() * 22), y: cy + side * (10 + r() * 8), wet: wet(u), u }); }
        const sites = willows.filter((w) => w.wet).filter((_, k) => k % 2 === 0).slice(0, 8);
        return { stems, tall, plots, creek, willows, sites, tallest: order[0] };
      },
      draw(g, t, S, D) {
        const GY = 830; const Y = (h) => GY - h * 1.75;
        const tA = cue(S, 0, 'five tallest'), tB = cue(S, 0, 'measured every'), tN = cue(S, 0, 'found no difference');
        g.casefile(96, 226, 270, 156, { title: 'The five tallest stems', no: 'VI', sketch: 'aspen', color: COL, rot: -0.02, alpha: S.p(0, 0.9) });
        // Legend: the two sampling designs (kept through the comparison beat).
        const aA = S.tp(tA, 0.8) * (1 - S.p(3, 0.6)), aB = S.tp(tB, 0.8) * (1 - S.p(3, 0.6));
        g.rect(104, 428, 18, 18, { r: 3, fill: PAL.ochre, alpha: aA });
        g.text('Five tallest stems', 134, 444, { size: 23, color: PAL.ink, alpha: aA });
        g.text('Ripple & Beschta', 134, 471, { size: 19, italic: true, color: PAL.ink3, alpha: aA });
        g.rect(104, 506, 18, 18, { r: 3, fill: PAL.lagoon, alpha: aB });
        g.text('All stems, random plots', 134, 522, { size: 23, color: PAL.ink, alpha: aB });
        g.text('Kauffman et al.', 134, 549, { size: 19, italic: true, color: PAL.ink3, alpha: aB });
        g.withAlpha(S.tp(tN, 0.8) * (1 - S.p(1, 0.6)), () => g.wrap('Random plots: no difference in height with predation risk', 104, 616, 290, { size: 21, color: PAL.lagoon, lh: 1.3 }));

        // The stand (beats 1–2), growing through beat 2.
        const aStand = 1 - S.p(2, 0.8);
        if (aStand > 0) g.withAlpha(aStand, () => {
          g.line(450, GY, 1300, GY, { color: PAL.ink3, w: 2, progress: S.p(0, 1.2) });
          const grow = ease.inOut(S.span(1, 2));
          D.stems.forEach((st, i) => {
            const h = st.h0 + st.grow * grow, top = Y(h), xt = st.x + st.lean * (GY - top);
            const hiA = D.tall.has(i) ? S.tp(tA + 0.5, 0.8) : 0; const hiB = D.plots.some((p) => i >= p.a && i <= p.b) ? S.tp(tB + 0.8, 0.8) : 0;
            const col = hiA > 0 ? U.mix(PAL.snow, PAL.ochre, hiA) : hiB > 0 ? U.mix(PAL.snow, PAL.lagoon, hiB) : PAL.snow;
            const sp = S.p(0, 1.1, 0.3 + i * 0.012); if (sp <= 0) return;
            const tx = lerp(st.x, xt, sp), ty = lerp(GY, top, sp);
            g.line(st.x, GY, tx, ty, { color: col, w: D.tall.has(i) ? 3.4 : 2.4, alpha: 0.5 + 0.5 * Math.max(hiA, hiB) });
            for (let k = 0; k < 3; k++) { const a = st.leaf + k * 2.1; g.ellipse(tx + Math.cos(a) * 6, ty + Math.sin(a) * 4 - 2, 5.2, 3.6, { rot: a, fill: PAL.moss, alpha: 0.8 * sp }); }
            if (hiA > 0) g.glow(tx, ty, 20, PAL.ochre, 0.45 * hiA);
            if (h > 200 && grow > 0) g.glow(tx, ty, 26, PAL.moss, 0.6 * S.p(1, 0.6) * Math.min(1, (h - 200) / 15));
          });
          const T0 = D.stems[D.tallest]; caps(g, 'five tallest', T0.x, Y(T0.h0 + T0.grow * grow) - 34, { color: PAL.ochre, align: 'center', alpha: S.tp(tA + 0.8, 0.8) * (1 - S.p(1, 0.6)) });
          D.plots.forEach((p, j) => { const a = S.tp(tB + 0.3 + j * 0.18, 0.6); g.rect(p.x0, GY + 10 - (1 - a) * 46, p.x1 - p.x0, 14, { r: 3, stroke: PAL.lagoon, w: 2, fill: U.rgba(PAL.lagoon, 0.18), alpha: a }); });
          caps(g, 'random plots', (D.plots[1].x0 + D.plots[2].x1) / 2, GY + 56, { color: PAL.lagoon, align: 'center', alpha: S.tp(tB + 1.2, 0.8) * (1 - S.p(1, 0.6)) });
          // Beat 2: the browse line and the stand survey.
          const tL = cue(S, 1, 'taller than two hundred'); const lA = S.tp(tL - 0.6, 0.8);
          g.line(452, Y(200), 1300, Y(200), { color: PAL.sand, w: 2, dash: [10, 8], alpha: lA, progress: S.tp(tL - 0.6, 1.4) });
          g.text('200 cm', 440, Y(200) + 7, { size: 21, color: PAL.sand, align: 'right', alpha: lA });
          g.withAlpha(lA * (1 - S.p(2, 0.6)), () => { caps(g, 'browse line', 104, 616, { color: PAL.sand }); g.wrap('Saplings above 200 cm are out of reach of browsing elk', 104, 650, 290, { size: 21, color: PAL.ink2, lh: 1.3 }); });
          const sA = S.p(1, 0.8); const tP = cue(S, 1, 'Up to sixty-five'); const tR = cue(S, 1, 'used both designs'); const frac = ease.inOut(S.tp(tP - 1.5, 3.2) * 1);
          caps(g, 'stands with a sapling above 200 cm  ·  random plots + tallest stems', 480, 250, { alpha: sA });
          g.withAlpha(S.tp(tR, 0.8) * (1 - S.p(2, 0.6)), () => { caps(g, 'painter et al. 2015', 104, 742, { color: PAL.ink2 }); g.wrap('Both designs; the range-wide conclusion rested largely on the random plots', 104, 776, 290, { size: 21, color: PAL.lagoon, lh: 1.3 }); });
          for (let k = 0; k < 20; k++) { const on = k < Math.round(13 * frac); const x = 492 + k * 34, y = 284; g.circle(x, y, 11, { stroke: on ? PAL.moss : PAL.ink3, w: 1.6, alpha: sA }); if (on) { g.circle(x, y, 11, { fill: U.rgba(PAL.moss, 0.35), alpha: sA }); g.icon('aspen', x, y + 1, 18, PAL.moss, { alpha: sA }); } }
          g.text(`${Math.round(65 * frac)}%`, 1300, 300, { size: 54, role: 'display', color: PAL.moss, align: 'right', alpha: sA });
        });

        // Beat 3: one stand, two designs, two curves.
        const pA = vis(S, 2, 3);
        if (pA > 0) g.withAlpha(pA, () => {
          const A = g.axes({ x: 520, y: 300, w: 740, h: 450, xlab: 'Years since wolves returned', ylab: 'Height of young aspen', progress: S.p(2, 1.0), labSize: 22 });
          const ex = (x) => Math.pow(x, 1.25);
          const tip1 = g.plot(A, (x) => 0.1 + 0.78 * ex(x), { color: PAL.ochre, w: 4.5, progress: S.p(2, 1.8, 1.0) });
          const tip2 = g.plot(A, (x) => 0.1 + 0.2 * ex(x), { color: PAL.lagoon, w: 4.5, progress: S.p(2, 1.8, 2.2) });
          g.text('Five tallest stems', A.X(0.96), A.Y(0.9), { size: 22, color: PAL.ochre, align: 'right', alpha: S.p(2, 0.8, 2.6) });
          g.text('Random sample', A.X(0.96), A.Y(0.36), { size: 22, color: PAL.lagoon, align: 'right', alpha: S.p(2, 0.8, 3.4) });
          caps(g, 'stylized', A.X(1), 286, { align: 'right', size: 15 });
          const tW = cue(S, 2, 'The tallest stems can show'), tH = cue(S, 2, 'only a random sample');
          g.withAlpha(S.tp(tW, 0.8), () => { caps(g, 'whether it happens', 104, 640, { color: PAL.ink2 }); g.text('both designs detect it', 104, 672, { size: 23, color: PAL.ink }); });
          g.withAlpha(S.tp(tH, 0.8), () => { caps(g, 'how strong it is', 104, 736, { color: PAL.ink2 }); g.text('only a random sample', 104, 768, { size: 23, color: PAL.lagoon }); });
        });

        // Beat 4: willow along a creek; samples gathered on the wet reaches.
        const wA = S.p(3, 0.9);
        if (wA > 0) g.withAlpha(wA, () => {
          const C = D.creek; const wetSeg = (u0, u1) => C.slice(Math.round(u0 * 120), Math.round(u1 * 120) + 1);
          for (const seg of [wetSeg(0.08, 0.3), wetSeg(0.56, 0.74)]) g.poly(seg, { color: U.rgba(PAL.lagoon, 0.22), w: 46, progress: S.p(3, 1.2, 0.4) });
          g.poly(C, { color: PAL.lagoon, w: 3.5, progress: S.p(3, 1.4) });
          D.willows.forEach((w, k) => { const a = S.p(3, 0.6, 0.6 + k * 0.03); g.icon('willow', w.x, w.y - (w.wet ? 26 : 12), w.wet ? 58 : 30, w.wet ? PAL.moss : PAL.ink3, { alpha: a * (w.wet ? 0.95 : 0.7) }); });
          const tS = cue(S, 3, 'studies concentrated');
          D.sites.forEach((w, k) => { const a = S.tp(tS + k * 0.2, 0.5); g.circle(w.x, w.y - 26, 30, { stroke: PAL.ochre, w: 2.4, alpha: a }); });
          g.withAlpha(S.tp(tS + 1.4, 0.8), () => { caps(g, 'sampled sites', 104, 470, { color: PAL.ochre }); g.wrap('clustered on well-watered reaches, where willow grows tallest', 104, 504, 300, { size: 21, color: PAL.ink2, lh: 1.3 }); });
          g.withAlpha(S.tp(tS + 2.6, 0.8), () => { caps(g, 'the wider landscape', 104, 640, { color: PAL.ink2 }); g.wrap('drier reaches, shorter willow', 104, 674, 300, { size: 21, color: PAL.ink2, lh: 1.3 }); });
          const tQ = cue(S, 3, 'Each embodied'); g.text('Each design embodied a different question.', 705, 890, { size: 32, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: S.tp(tQ, 1.0) });
        });
      },
      terms: [
        { beat: 2.6, term: 'Sampling design', def: 'The rule for choosing which units to measure. It determines which population, and which question, the data can answer.' },
        { beat: 3.25, term: 'Sampling bias', def: 'Systematic difference between the sampled units and the population of interest, which distorts estimates.' },
      ],
    },
    {
      id: 'obs-instr', title: 'Instruments and definitions', register: 'observe',
      beats: [
        { t: 'Instruments are theory made physical. Early studies tracked elk with VHF radio collars, located a few times a month, and could only map predation risk as fixed in space. GPS collars on elk, wolves, and pumas, located many times a day, revealed something new.',
          cite: 'Kohl et al. 2018',
          v: 'Sparse VHF fixes give a static heat map; dense GPS tracks animate over the same terrain.' },
        { t: 'Elk moved into open country at night and into forest by day, avoiding the peak hours of both predators: wolves hunting open terrain, pumas hunting rough forest. This dynamic landscape of fear, invisible to the earlier instrument, left elk ample time to browse.',
          cite: 'Kohl et al. 2018, 2019',
          v: 'A 24-hour clock drives the map: elk dots shift between open and forest as wolf and puma activity rings rise and fall.' },
        { t: 'Before risk could be observed at all, it had to be defined: the core or edge of a wolf territory, the presence of downed logs, the width of a viewshed, or the locations of kills. Each operational definition carried a theory of what elk fear.',
          cite: 'Ripple et al. 2001; Ripple & Beschta 2006; Kauffman et al. 2007',
          v: 'Four small maps of “risk” computed four ways, each a different pattern on the same landscape.' },
        { t: 'Your own data are no different. A lidar canopy height model is an inference from laser returns, classification thresholds, and a ground model. An animal count is abundance multiplied by detection probability, and not detecting a species is not proof of its absence.',
          cite: 'MacKenzie et al. 2002',
          v: 'A point cloud resolves into a canopy height model through labelled steps; then N × p = C with a hidden animal behind a tree.' },
      ],
      init() {
        const r = U.rng(6202);
        // ---- beat 0: one terrain seen through two instruments
        const PW = 560, PH = 470;
        const f0 = (x, y) => U.fbm2(x * 0.006, y * 0.006, 31) * 0.9 + (x / PW - 0.52) * 1.3 > 0;
        const s0 = []; for (let k = 0; k <= 50; k++) { const u = k / 50; s0.push([PW * (0.47 + 0.07 * Math.sin(u * 5.5)), u * PH]); }
        const T0 = terrain(r, PW, PH, f0, { stream: s0, tree: 14 });
        const vhf = []; while (vhf.length < 14) { const x = 40 + r() * (PW - 80), y = 40 + r() * (PH - 80); if (vhf.every(([a, b]) => Math.hypot(a - x, b - y) > 60)) vhf.push([x, y]); }
        const elk = []; for (let k = 0; k < 240; k++) { const h = (6 + k / 240 * 72) % 24, fz = dayness(h); elk.push([lerp(PW * 0.2, PW * 0.78, fz) + 46 * U.noise1(k * 0.13, 3), PH * 0.5 + 120 * U.noise1(k * 0.05, 7) + 30 * U.noise1(k * 0.3, 9)]); }
        const wolf = walk(r, 240, PW * 0.18, PH * 0.3, 9, PW, PH, (x, y) => !f0(x, y));
        const puma = walk(r, 240, PW * 0.82, PH * 0.65, 6, PW, PH, (x, y) => f0(x, y));
        // ---- beat 1: open country on the left, forest on the right
        const MW = 740, MH = 560; const bx = (y) => MW * 0.5 + 46 * Math.sin(y * 0.013) + 22 * Math.sin(y * 0.037 + 1);
        const f1 = (x, y) => x > bx(y);
        const T1 = terrain(r, MW, MH, f1, { tree: 17 });
        const edge = []; for (let k = 0; k <= 56; k++) { const y = k / 56 * MH; edge.push([bx(y), y]); }
        const mask = (pts, col) => { const cv = Theater.makeCanvas(MW, MH); const c = cv.getContext('2d'); c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); return cv; };
        const openM = mask([[0, 0], ...edge, [0, MH]], PAL.coral), forM = mask([[MW, 0], ...edge, [MW, MH]], PAL.clay);
        const herd = []; for (let k = 0; k < 12; k++) { const oy = MH * (0.14 + 0.72 * (k + r() * 0.7) / 12); herd.push({ o: [MW * (0.08 + r() * 0.28), oy], f: [Math.max(bx(oy) + 40, MW * (0.64 + r() * 0.28)), MH * (0.12 + r() * 0.76)], lag: (r() - 0.5) * 1.6 }); }
        // ---- beat 2: four operational definitions of risk on one landscape
        const W2 = 560, H2 = 250; const f2 = (x, y) => U.fbm2(x * 0.009, y * 0.012, 57) + (x / W2 - 0.55) * 0.7 > 0.04;
        const s2 = []; for (let k = 0; k <= 60; k++) { const u = k / 60; s2.push([u * W2, H2 * 0.56 + 34 * Math.sin(u * 7 + 0.5)]); }
        const maps = [0, 1, 2, 3].map((m) => {
          const cv = Theater.makeCanvas(W2, H2); const c = cv.getContext('2d'); const mg = Theater.makeG(c);
          const blob = (x, y, rad, a) => { const gr = c.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, U.rgba(PAL.coral, a)); gr.addColorStop(1, U.rgba(PAL.coral, 0)); c.fillStyle = gr; c.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); };
          if (m === 0) [[W2 * 0.3, H2 * 0.48, 128, 92, 3], [W2 * 0.76, H2 * 0.46, 112, 84, 9]].forEach(([x, y, rx, ry, sd]) => {
            const pts = []; for (let k = 0; k < 40; k++) { const an = k / 40 * TAU, q = 1 + 0.16 * U.noise1(k * 0.5, sd); pts.push([x + Math.cos(an) * rx * q, y + Math.sin(an) * ry * q]); }
            c.save(); c.beginPath(); pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.clip(); const gr = c.createRadialGradient(x, y, 0, x, y, rx * 1.1); gr.addColorStop(0, U.rgba(PAL.coral, 0.62)); gr.addColorStop(1, U.rgba(PAL.coral, 0.04)); c.fillStyle = gr; c.fillRect(0, 0, W2, H2); c.restore();
            mg.poly([...pts, pts[0]], { color: PAL.coral, w: 1.6, dash: [6, 5], alpha: 0.9 });
          });
          if (m === 1) { const logs = []; for (let k = 0; k < 26; k++) { const i = Math.floor(r() * 61), side = r() < 0.5 ? -1 : 1; logs.push([s2[Math.min(60, i)][0], s2[Math.min(60, i)][1] + side * (12 + r() * 34), r() * Math.PI]); } c.globalCompositeOperation = 'lighter'; logs.forEach(([x, y]) => blob(x, y, 30, 0.32)); c.globalCompositeOperation = 'source-over'; logs.forEach(([x, y, an]) => mg.line(x - Math.cos(an) * 10, y - Math.sin(an) * 10, x + Math.cos(an) * 10, y + Math.sin(an) * 10, { color: PAL.clay, w: 4.5 })); }
          if (m === 2) { const wall = (sd) => s2.map(([x, y], k) => [x, y + sd * (16 + 34 * (0.5 + 0.5 * Math.sin(k / 60 * 17 + 1)))]); const up = wall(-1), dn = wall(1);
            for (let k = 0; k < 60; k++) { const wd = dn[k][1] - up[k][1]; const nar = clamp(1 - (wd - 32) / 60); if (nar <= 0.05) continue; c.fillStyle = c.strokeStyle = U.rgba(PAL.coral, 0.55 * nar); c.lineWidth = 1.2; c.beginPath(); c.moveTo(...up[k]); c.lineTo(...up[k + 1]); c.lineTo(...dn[k + 1]); c.lineTo(...dn[k]); c.closePath(); c.fill(); c.stroke(); }
            mg.poly(up, { color: PAL.ink2, w: 1.6, alpha: 0.8 }); mg.poly(dn, { color: PAL.ink2, w: 1.6, alpha: 0.8 }); }
          if (m === 3) { const kills = []; [[0.24, 0.62], [0.47, 0.4], [0.78, 0.66]].forEach(([u, v]) => { for (let k = 0; k < 6; k++) kills.push([W2 * u + U.gauss(r) * 26, H2 * v + U.gauss(r) * 18]); }); c.globalCompositeOperation = 'lighter'; kills.forEach(([x, y]) => blob(x, y, 52, 0.2)); c.globalCompositeOperation = 'source-over'; kills.forEach(([x, y]) => { mg.line(x - 5, y - 5, x + 5, y + 5, { color: PAL.coral, w: 2.4 }); mg.line(x - 5, y + 5, x + 5, y - 5, { color: PAL.coral, w: 2.4 }); }); }
          return cv;
        });
        const base2 = terrain(U.rng(77), W2, H2, f2, { stream: s2, tree: 11, sw: 2.6 });
        // ---- beat 3: a lidar profile and a count
        const LX0 = 150, LX1 = 1290, GB = 606; const zg = (x) => GB - 34 - 24 * Math.sin((x - LX0) / 240) - 10 * Math.sin((x - LX0) / 80 + 1);
        const trees = []; for (let k = 0; k < 10; k++) { const h = 95 + r() * 95, con = r() < 0.55; trees.push({ x: LX0 + 70 + k * 112 + (r() - 0.5) * 36, h, con, w: con ? 30 + h * 0.2 : 46 + h * 0.25 }); }
        const lp = [];
        for (let k = 0; k <= 130; k++) { const x = LX0 + k / 130 * (LX1 - LX0) + (r() - 0.5) * 5; lp.push({ x, y: zg(x) + (r() - 0.5) * 3, v: 0 }); }
        trees.forEach((tr) => { const g0 = zg(tr.x);
          for (let k = 0; k < 48; k++) { const u = r(), d = Math.pow(r(), 1.5); let x, y;
            if (tr.con) { const yy = d * tr.h * 0.75; x = tr.x + (u - 0.5) * 2 * (yy / (tr.h * 0.75)) * tr.w / 2 + (r() - 0.5) * 6; y = g0 - tr.h + yy; }
            else { const an = Math.PI + u * Math.PI, rr = 1 - d * 0.8; x = tr.x + Math.cos(an) * tr.w / 2 * rr; y = g0 - tr.h * 0.62 + Math.sin(an) * tr.h * 0.38 * rr; }
            lp.push({ x, y, v: 1 }); }
          for (let k = 0; k < 3; k++) lp.push({ x: tr.x + (r() - 0.5) * 3, y: g0 - tr.h * (0.1 + k * 0.12), v: 1 }); });
        const cells = []; for (let x = LX0; x < LX1; x += 20) { let m = 0; lp.forEach((q) => { if (q.v && q.x >= x && q.x < x + 20) m = Math.max(m, zg(q.x) - q.y); }); cells.push([x, m]); }
        return { PW, PH, T0, f0, vhf, elk, wolf, puma, MW, MH, T1, openM, forM, herd, maps, base2, W2, H2, lp, zg, cells, trees, LX0, LX1 };
      },
      draw(g, t, S, D) {
        const ctx = g.ctx;
        // ---- Beat 0: VHF fixes and a static risk map versus dense GPS tracks.
        const tV = cue(S, 0, 'Early studies'), tFew = cue(S, 0, 'a few times a month'), tFix = cue(S, 0, 'fixed in space'), tG = cue(S, 0, 'GPS collars'), tNew = cue(S, 0, 'revealed something new');
        const a0 = vis(S, 0, 1);
        if (a0 > 0) g.withAlpha(a0, () => {
          const L = [110, 300], R = [740, 300], { PW, PH } = D;
          // left: VHF
          g.withAlpha(S.p(0, 0.8, 0.3), () => {
            g.icon('collar', L[0] + 16, 270, 30, PAL.ink2); caps(g, 'VHF collars  ·  a few fixes a month', L[0] + 44, 278, { color: PAL.ink2 });
            ctx.drawImage(D.T0, L[0], L[1]); g.rect(L[0], L[1], PW, PH, { r: 6, stroke: PAL.rule, w: 1.5 });
            const st = [[L[0] + 22, L[1] + PH - 22], [L[0] + PW - 22, L[1] + PH - 22]]; st.forEach(([x, y]) => g.poly([[x, y - 12], [x - 9, y + 6], [x + 9, y + 6]], { fill: PAL.violet, color: null, w: 0, close: true }));
            D.vhf.forEach(([x, y], k) => { const tk = tFew - 0.4 + k * 0.32; const a = S.tp(tk, 0.3); if (a <= 0) return; const fade = 1 - S.tp(tk + 0.6, 0.6);
              st.forEach(([sx, sy]) => g.line(sx, sy, L[0] + x, L[1] + y, { color: PAL.violet, w: 1.2, alpha: 0.7 * fade, progress: a }));
              g.dot(L[0] + x, L[1] + y, 5, PAL.sand, S.tp(tk + 0.25, 0.3), 2.4); });
            const rk = S.tp(tFix - 0.2, 1.0);
            if (rk > 0) { [[0.24, 0.32, 110], [0.3, 0.72, 95], [0.66, 0.5, 80]].forEach(([u, v, rad]) => { g.glow(L[0] + u * PW, L[1] + v * PH, rad * 1.5, PAL.coral, 0.55 * rk); g.circle(L[0] + u * PW, L[1] + v * PH, rad * 0.7, { stroke: PAL.coral, w: 1.6, dash: [5, 5], alpha: 0.8 * rk }); });
              caps(g, 'risk: fixed in space', L[0], L[1] + PH + 36, { color: PAL.coral, alpha: rk }); }
          });
          // right: GPS, over the same terrain
          g.withAlpha(S.p(0, 0.8, 0.3) * (0.35 + 0.65 * S.tp(tG - 0.4, 0.8)), () => { ctx.drawImage(D.T0, R[0], R[1]); g.rect(R[0], R[1], PW, PH, { r: 6, stroke: PAL.rule, w: 1.5 }); });
          g.withAlpha(S.p(0, 0.8, 0.6) * (1 - S.tp(tG - 0.6, 0.5)), () => g.text('the same terrain', R[0] + PW / 2, R[1] + PH / 2 + 10, { size: 30, role: 'display', italic: true, color: PAL.ink2, align: 'center' }));
          g.withAlpha(S.tp(tG - 0.4, 0.8), () => {
            g.icon('collar', R[0] + 16, 270, 30, COL); caps(g, 'GPS collars  ·  many fixes a day', R[0] + 44, 278, { color: COL });
            g.clip(R[0], R[1], PW, PH, () => {
              [[D.elk, PAL.sand, 'on elk'], [D.wolf, PAL.coral, 'wolves'], [D.puma, PAL.clay, 'pumas']].forEach(([tr, col, ph]) => {
                const t0 = cue(S, 0, ph), q = clamp((t - t0) / Math.max(4, S.e(0) - t0 + 1.5)); const n = Math.max(2, Math.floor(q * tr.length)); if (q <= 0) return;
                const pts = tr.slice(0, n).map(([x, y]) => [R[0] + x, R[1] + y]); g.poly(pts, { color: col, w: 1.6, alpha: 0.55 });
                ctx.save(); ctx.fillStyle = col; ctx.globalAlpha *= 0.9; ctx.beginPath(); pts.forEach(([x, y]) => { ctx.moveTo(x + 2.2, y); ctx.arc(x, y, 2.2, 0, TAU); }); ctx.fill(); ctx.restore();
                const [hx, hy] = pts[pts.length - 1]; g.dot(hx, hy, 6, col, 1, 2.6);
                if (col !== PAL.sand) g.glow(hx, hy, 90, col, 0.45 * S.tp(tNew, 0.8));
              });
            });
            [['on elk', PAL.sand, 'Elk'], ['wolves', PAL.coral, 'Wolves'], ['pumas', PAL.clay, 'Pumas']].forEach(([ph, col, lab], k) => { const a = S.tp(cue(S, 0, ph), 0.5); g.circle(R[0] + 8 + k * 150, R[1] + PH + 30, 7, { fill: col, alpha: a }); g.text(lab, R[0] + 24 + k * 150, R[1] + PH + 38, { size: 22, color: PAL.ink, alpha: a }); });
            g.withAlpha(S.tp(tNew, 0.8), () => caps(g, 'risk moves with the predators', R[0], R[1] + PH + 86, { color: PAL.coral }));
          });
        });

        // ---- Beat 1: a 24-hour clock drives the landscape of fear.
        const tON = cue(S, 1, 'open country at night'), tWo = cue(S, 1, 'wolves hunting'), tPu = cue(S, 1, 'pumas hunting'), tLF = cue(S, 1, 'dynamic landscape'), tInv = cue(S, 1, 'invisible to the earlier'), tBr = cue(S, 1, 'ample time to browse');
        const a1 = vis(S, 1, 2);
        if (a1 > 0) g.withAlpha(a1, () => {
          const h = (6 + 24 * Math.max(0, t - S.b(1) - 0.6) / 5.4) % 24; const fz = dayness(h);
          const wA = (hh) => Math.max(Math.exp(-(((hh - 7) / 1.5) ** 2)), Math.exp(-(((hh - 17.5) / 1.5) ** 2))) * 0.9 + 0.1;
          const cd = (hh, c) => { const d = Math.abs(hh - c) % 24; return Math.min(d, 24 - d); };
          const pA = (hh) => Math.exp(-((cd(hh, 0.5) / 4.2) ** 2)) * 0.9 + 0.1;
          const wn = wA(h), pn = pA(h);
          // clock
          const CX = 300, CY = 580, CR = 150; const ang = (hh) => -Math.PI / 2 + (hh - 12) / 24 * TAU;
          caps(g, '24-hour clock', CX, 262, { align: 'center', color: PAL.ink2 });
          g.withAlpha(S.p(1, 0.8), () => {
            ctx.save(); ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, CR, ang(18.5), ang(29.5)); ctx.closePath(); ctx.fillStyle = 'rgba(10,9,24,0.6)'; ctx.fill(); ctx.restore();
            ctx.save(); ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, CR, ang(5.5), ang(18.5)); ctx.closePath(); ctx.fillStyle = U.rgba(PAL.ochre, 0.07); ctx.fill(); ctx.restore();
            g.circle(CX, CY, CR, { stroke: PAL.ink3, w: 2 });
            for (let k = 0; k < 24; k++) { const an = ang(k), l = k % 6 ? 8 : 16; g.line(CX + Math.cos(an) * (CR - l), CY + Math.sin(an) * (CR - l), CX + Math.cos(an) * CR, CY + Math.sin(an) * CR, { color: PAL.ink3, w: k % 6 ? 1.2 : 2 }); }
            [[12, 'noon'], [18, 'dusk'], [0, 'midnight'], [6, 'dawn']].forEach(([hh, lab]) => { const an = ang(hh); g.text(lab, CX + Math.cos(an) * (CR - 40), CY + Math.sin(an) * (CR - 40) + 7, { size: 21, color: PAL.ink2, align: 'center' }); });
            const curve = (fn, col, a) => { if (a <= 0) return; const pts = []; for (let k = 0; k <= 96; k++) { const hh = k / 4, an = ang(hh), rr = CR + 10 + 52 * fn(hh); pts.push([CX + Math.cos(an) * rr, CY + Math.sin(an) * rr]); } g.poly(pts, { color: col, w: 2.6, alpha: a, fill: U.rgba(col, 0.12), close: true }); };
            curve(wA, PAL.coral, S.tp(tWo, 0.8)); curve(pA, PAL.clay, S.tp(tPu, 0.8));
            const lw = S.tp(tWo, 0.8), lpu = S.tp(tPu, 0.8);
            g.line(CX - 170, CY + CR + 92, CX - 140, CY + CR + 92, { color: PAL.coral, w: 3, alpha: lw }); g.text('wolf activity', CX - 130, CY + CR + 99, { size: 21, color: PAL.coral, alpha: lw });
            g.line(CX - 170, CY + CR + 126, CX - 140, CY + CR + 126, { color: PAL.clay, w: 3, alpha: lpu }); g.text('puma activity', CX - 130, CY + CR + 133, { size: 21, color: PAL.clay, alpha: lpu });
            caps(g, 'stylized', CX + 170, CY + CR + 99, { align: 'right', size: 15, alpha: lw });
            const ha = ang(h); g.line(CX, CY, CX + Math.cos(ha) * (CR - 22), CY + Math.sin(ha) * (CR - 22), { color: PAL.ink, w: 3.5 }); g.circle(CX, CY, 6, { fill: PAL.ink });
            g.dot(CX + Math.cos(ha) * (CR - 22), CY + Math.sin(ha) * (CR - 22), 5, fz > 0.5 ? PAL.ochre : PAL.snow, 1, 3);
          });
          // the map
          const MX = 560, MY = 290, { MW, MH } = D;
          g.withAlpha(S.p(1, 0.9, 0.2), () => {
            caps(g, 'open country', MX, 278, { color: PAL.sand }); caps(g, 'forest', MX + MW, 278, { align: 'right', color: PAL.moss });
            ctx.drawImage(D.T1, MX, MY);
            const lf = S.tp(tLF - 0.3, 0.8);
            ctx.save(); ctx.globalAlpha *= (0.06 + 0.16 * lf) * S.tp(tWo, 0.8) * wn; ctx.drawImage(D.openM, MX, MY); ctx.restore();
            ctx.save(); ctx.globalAlpha *= (0.06 + 0.16 * lf) * S.tp(tPu, 0.8) * pn; ctx.drawImage(D.forM, MX, MY); ctx.restore();
            g.rect(MX, MY, MW, MH, { r: 6, stroke: PAL.rule, w: 1.5 });
            // predators and their activity rings
            [[0.22, 0.3, 0], [0.16, 0.74, 2]].forEach(([u, v, ph]) => { const x = MX + MW * u + 26 * Math.cos(t * 0.5 + ph), y = MY + MH * v + 18 * Math.sin(t * 0.4 + ph); g.circle(x, y, 22 + 34 * wn, { stroke: PAL.coral, w: 2.4, alpha: S.tp(tWo, 0.6) * (0.25 + 0.75 * wn) }); g.icon('wolf', x, y, 46, PAL.coral, { alpha: S.tp(tWo, 0.6) }); });
            [[0.82, 0.32, 1], [0.74, 0.76, 3]].forEach(([u, v, ph]) => { const x = MX + MW * u + 18 * Math.cos(t * 0.35 + ph), y = MY + MH * v + 14 * Math.sin(t * 0.3 + ph); g.circle(x, y, 22 + 34 * pn, { stroke: PAL.clay, w: 2.4, alpha: S.tp(tPu, 0.6) * (0.25 + 0.75 * pn) }); g.icon('puma', x, y, 46, PAL.clay, { alpha: S.tp(tPu, 0.6) }); });
            // elk follow the clock
            const ea = S.tp(S.b(1) + 0.3, 0.8);
            D.herd.forEach((e, k) => { const z = dayness((h + e.lag + 24) % 24); const x = MX + lerp(e.o[0], e.f[0], z), y = MY + lerp(e.o[1], e.f[1], z); const dz = dayness((h + e.lag + 24.2) % 24) - z;
              g.icon('elk', x, y, 30, PAL.sand, { alpha: ea, flip: dz < 0 });
              if (t > tBr) for (let q = 0; q < 3; q++) g.circle(x + 18 + q * 6, y + 16 - (q % 2) * 5, 2.4, { fill: PAL.moss, alpha: S.tp(tBr + k * 0.05, 0.6) * (0.5 + 0.5 * Math.sin(t * 3 + k + q)) }); });
            g.withAlpha(S.tp(tON - 0.2, 0.7), () => { g.pill(fz > 0.5 ? 'day: elk in forest' : 'night: elk in the open', MX + MW / 2, MY + MH + 36, { size: 22, color: fz > 0.5 ? PAL.moss : PAL.sand, align: 'center' }); });
            // what the earlier instrument showed
            const iv = S.tp(tInv, 0.8) * (1 - S.tp(tBr + 1.5, 0.8));
            if (iv > 0) { g.circle(MX + MW * 0.25, MY + MH * 0.45, 120, { stroke: PAL.ink2, w: 2, dash: [8, 7], alpha: iv }); g.rect(MX + 8, MY + 10, 330, 32, { r: 4, fill: 'rgba(14,13,26,0.8)', alpha: iv }); caps(g, 'VHF view: one fixed risk map', MX + 20, MY + 32, { color: PAL.ink, alpha: iv }); }
            g.withAlpha(S.tp(tBr, 0.8), () => caps(g, 'ample time to browse', MX + MW, MY + MH + 42, { align: 'right', color: PAL.moss }));
          });
        });

        // ---- Beat 2: four operational definitions of risk.
        const a2 = vis(S, 2, 3);
        if (a2 > 0) g.withAlpha(a2, () => {
          const pos = [[120, 300], [740, 300], [120, 612], [740, 612]];
          const labs = [['core or edge of a wolf territory', 'the core or edge'], ['downed logs', 'downed logs'], ['width of a viewshed', 'width of a viewshed'], ['locations of kills', 'locations of kills']];
          const theory = ['elk fear where wolves spend time', 'elk fear obstacles to escape', 'elk fear what they cannot see', 'elk fear where wolves have killed'];
          const tTh = cue(S, 2, 'Each operational');
          pos.forEach(([x, y], k) => {
            const b = S.p(2, 0.8, 0.2 + k * 0.15), a = S.tp(cue(S, 2, labs[k][1]) - 0.3, 0.7);
            g.withAlpha(b, () => { ctx.drawImage(D.base2, x, y); g.rect(x, y, D.W2, D.H2, { r: 5, stroke: PAL.rule, w: 1.4 }); g.text('risk = ?', x + D.W2 / 2, y + D.H2 / 2 + 12, { size: 34, role: 'display', italic: true, color: PAL.ink, align: 'center', alpha: 1 - a }); });
            if (a <= 0) return;
            g.withAlpha(a, () => {
              caps(g, `${k + 1}  ·  ${labs[k][0]}`, x, y - 14, { color: PAL.ink });
              ctx.drawImage(D.maps[k], x, y);
              const ta = S.tp(tTh + k * 0.35, 0.6); if (ta > 0) { g.rect(x + 1, y + D.H2 - 40, D.W2 - 2, 39, { fill: 'rgba(14,13,26,0.82)', alpha: ta }); g.text(theory[k], x + 16, y + D.H2 - 13, { size: 22, italic: true, color: PAL.coral, alpha: ta }); }
            });
          });
        });

        // ---- Beat 3: a lidar canopy height model, and a count.
        const tCHM = cue(S, 3, 'A lidar canopy'), tLR = cue(S, 3, 'laser returns'), tCT = cue(S, 3, 'classification thresholds'), tGM = cue(S, 3, 'a ground model'), tAC = cue(S, 3, 'An animal count'), tDP = cue(S, 3, 'detection probability'), tNd = cue(S, 3, 'not detecting');
        const a3 = S.p(3, 0.8);
        if (a3 > 0) g.withAlpha(a3, () => {
          const { LX0, LX1, zg } = D;
          // the pipeline as labelled steps
          const steps = [['laser returns', tLR], ['classification', tCT], ['ground model', tGM], ['canopy height model', tCHM]];
          let sx = LX0; steps.forEach(([lab, ts], k) => { const w = g.measure(lab, { size: 21, weight: 500 }) + 25; const on = S.tp(ts - 0.2, 0.5); const col = k === 3 ? COL : PAL.ink;
            g.pill(lab, sx, 262, { size: 21, color: col, alpha: 0.35 + 0.65 * on, stroke: on > 0.5 ? U.rgba(col, 0.6) : null });
            if (k < 3) g.arrowHead(sx + w + 26, 262, 0, 13, U.rgba(PAL.ink, 0.6)); sx += w + 46; });
          // the forest itself, before any laser return
          const gh = S.p(3, 0.8, 0.3) * (1 - S.tp(tLR + 1.6, 1.2));
          if (gh > 0) g.withAlpha(gh * 0.55, () => { const pts = []; for (let x = LX0; x <= LX1; x += 10) pts.push([x, zg(x)]); g.poly(pts, { color: PAL.ink3, w: 1.6 });
            D.trees.forEach((tr) => { const g0 = zg(tr.x); if (tr.con) g.poly([[tr.x, g0 - tr.h], [tr.x - tr.w / 2, g0 - tr.h * 0.25], [tr.x + tr.w / 2, g0 - tr.h * 0.25]], { color: PAL.ink3, w: 1.4, close: true }); else g.ellipse(tr.x, g0 - tr.h * 0.62, tr.w / 2, tr.h * 0.38, { stroke: PAL.ink3, w: 1.4 }); g.line(tr.x, g0, tr.x, g0 - tr.h * 0.3, { color: PAL.ink3, w: 1.4 }); }); });
          // scanning aircraft
          const scan = clamp((t - tLR + 0.6) / 2.4); const scx = lerp(LX0 - 20, LX1 + 20, scan);
          if (scan > 0 && scan < 1) { g.withAlpha(Math.min(1, scan * 8, (1 - scan) * 8), () => { g.poly([[scx - 22, 312], [scx + 22, 312], [scx + 10, 304], [scx - 10, 304]], { fill: PAL.ink2, color: null, w: 0, close: true }); for (let q = -2; q <= 2; q++) g.line(scx, 316, scx + q * 26, zg(scx + q * 26), { color: COL, w: 1, alpha: 0.5 }); }); }
          const cls = S.tp(tCT, 0.8), gm = S.tp(tGM, 1.0), flat = io(S, tGM + 0.6, 1.3), FL = 590;
          const yOf = (q) => lerp(q.y, FL - (zg(q.x) - q.y), flat);
          // threshold line
          const thA = cls * (1 - S.tp(tGM + 0.8, 0.6));
          if (thA > 0) { const pts = []; for (let x = LX0; x <= LX1; x += 10) pts.push([x, zg(x) - 12]); g.poly(pts, { color: PAL.ochre, w: 1.6, dash: [6, 6], alpha: thA }); caps(g, 'threshold', LX1, zg(LX1) + 32, { align: 'right', color: PAL.ochre, alpha: thA }); }
          // points (batched by class)
          [[0, U.mix(PAL.ink2, PAL.sand, cls)], [1, U.mix(PAL.ink2, PAL.moss, cls)]].forEach(([v, col]) => { ctx.save(); ctx.fillStyle = col; ctx.beginPath(); for (const q of D.lp) { if (q.v !== v || q.x > scx) continue; const y = yOf(q); ctx.moveTo(q.x + 2.6, y); ctx.arc(q.x, y, 2.6, 0, TAU); } ctx.fill(); ctx.restore(); });
          // ground model
          if (gm > 0) { const pts = []; for (let x = LX0; x <= LX1; x += 8) pts.push([x, lerp(zg(x), FL, flat)]); g.poly(pts, { color: PAL.sand, w: 2.6, progress: gm }); }
          // the canopy height model
          const ch = S.tp(tGM + 1.7, 0.9);
          if (ch > 0) { D.cells.forEach(([x, m], k) => g.rect(x + 1, FL + 16, 18, 24, { fill: U.mix('#1E2A2A', '#4E8A42', clamp(m / 190)), alpha: ch * S.tp(tGM + 1.7 + k * 0.012, 0.3) })); caps(g, 'canopy height model: height above the ground model', LX0, FL + 64, { color: COL, alpha: ch }); }
          // the count: N × p = C
          const cA = S.tp(tAC - 0.2, 0.8);
          if (cA > 0) g.withAlpha(cA, () => {
            g.math('N \\times p = C', 150, 738, { size: 54, color: PAL.ink });
            g.withAlpha(S.tp(tDP, 0.8), () => { g.math('5 \\times 0.6 = 3', 150, 800, { size: 40, color: PAL.ink2 }); g.text('abundance × detection = count', 150, 842, { size: 21, color: PAL.ink2 }); caps(g, 'illustrative', 150, 876, { size: 15 }); });
            const GY = 884, trees = [650, 760, 870, 980];
            const deer = [[590, false], [760, true], [815, false], [980, true], [1036, false]];
            deer.forEach(([x, hid], k) => { if (!hid) return; g.icon('deer', x, GY - 30, 56, PAL.sand, { alpha: 0.9 }); });
            trees.forEach((x) => g.icon('conifer', x, GY - 52, 104, PAL.moss, { alpha: 0.95 }));
            deer.forEach(([x, hid], k) => { const a = S.tp(tDP + 0.3 + k * 0.2, 0.5); if (!hid) { g.icon('deer', x, GY - 30, 56, PAL.sand); g.circle(x, GY - 34, 38, { stroke: COL, w: 2.6, alpha: a }); } else g.circle(x, GY - 34, 38, { stroke: PAL.ink3, w: 2, dash: [5, 5], alpha: a }); });
            g.withAlpha(S.tp(tDP + 1.4, 0.6), () => { caps(g, 'counted', 560, 756, { color: COL }); caps(g, 'missed', 700, 756, { color: PAL.ink3 }); });
          });
          const nA = S.tp(tNd - 0.2, 0.8);
          if (nA > 0) g.withAlpha(nA, () => {
            const x = 1186, GY = 884; g.icon('puma', x + 24, GY - 24, 60, PAL.clay, { alpha: 0.35 }); g.icon('conifer', x, GY - 64, 128, PAL.moss);
            g.circle(x + 28, GY - 26, 42, { stroke: PAL.ink3, w: 2, dash: [5, 5] });
            g.math('C = 0', x, 704, { size: 40, color: PAL.ink, align: 'center' });
            g.text('not detected ≠ absent', x, 742, { size: 22, color: PAL.coral, align: 'center' });
          });
        });
      },
      terms: [
        { beat: 1.6, term: 'Landscape of fear', def: 'The spatial and temporal pattern of predation risk perceived by prey, which can shape where and when they forage.' },
        { beat: 2.6, term: 'Operational definition', def: 'A definition of a concept in terms of the procedure used to measure it, such as “risk” as distance to a kill site.' },
        { beat: 3.6, term: 'Imperfect detection', def: 'Animals present may go unrecorded, so counts confound abundance with detection probability (MacKenzie et al.).' },
      ],
    },
    {
      id: 'obs-limits', title: 'Laden, not determined', register: 'observe',
      beats: [
        { t: 'Theory-ladenness does not mean anything goes. The aspen stems were measured; they either grew past browse height or did not. Ian Hacking argued that when independent methods, built on different theories, converge on the same result, we have good reason to believe it.',
          cite: 'Hacking 1983',
          v: 'Three independent instrument beams converge on one stem; the point of convergence glows.' },
        { t: 'Interpretivists meet the same problem with reflexivity: declaring the researcher’s position, because it shapes what is noticed and what is recorded.',
          v: 'Lens beat: the violet lens shows the researcher drawn into the scene, with their vantage point marked.' },
      ],
      draw(g, t, S, D) {
        const ctx = g.ctx; const GY = 800, SX = 760, PX = 700; const Y = (cm) => GY - cm * 1.2;
        const tAG = cue(S, 0, 'anything goes'), tMe = cue(S, 0, 'stems were measured'), tGr = cue(S, 0, 'they either grew'), tHa = cue(S, 0, 'Ian Hacking'), tIM = cue(S, 0, 'independent methods'), tDT = cue(S, 0, 'built on different'), tCv = cue(S, 0, 'converge on'), tGR = cue(S, 0, 'good reason');
        const h = lerp(150, 290, io(S, tGr, 2.4)), top = Y(h), past = clamp((h - 200) / 12);
        // ---- left column: not "anything goes"; a fact of the matter; triangulation
        g.withAlpha(S.p(0, 0.8, 0.2), () => { g.text('“anything goes”', 104, 310, { size: 38, role: 'display', italic: true, color: PAL.ink2 }); g.line(98, 298, 98 + 262 * S.tp(tAG + 0.5, 0.6), 298, { color: PAL.coral, w: 3.5, alpha: S.tp(tAG + 0.5, 0.2) }); });
        g.withAlpha(S.tp(tGr - 0.2, 0.7), () => {
          caps(g, 'a fact of the matter', 104, 410, { color: PAL.ink2 });
          g.pill('grew past browse height', 104, 452, { size: 21, color: past > 0.5 ? PAL.moss : PAL.ink3, alpha: 0.45 + 0.55 * past });
          g.pill('did not', 104, 500, { size: 21, color: PAL.ink3, alpha: 0.45 + 0.4 * (1 - past) });
        });
        g.withAlpha(S.tp(tHa, 0.8), () => { caps(g, 'Hacking: triangulation', 104, 610, { color: COL }); g.wrap('independent methods, different theories, one result', 104, 644, 290, { size: 21, color: PAL.ink2, lh: 1.3, alpha: S.tp(tCv, 0.8) }); });
        // ---- the stand floor, one stem, the browse line
        g.line(470, GY, 1290, GY, { color: PAL.ink3, w: 2, progress: S.p(0, 1.2) });
        g.withAlpha(S.p(0, 0.8, 0.4), () => {
          g.line(SX, GY, SX + 2, top, { color: PAL.snow, w: 4 });
          for (let k = 0; k < 6; k++) { const a = 0.6 + k * 1.05; g.ellipse(SX + 2 + Math.cos(a) * 11, top + 4 + Math.sin(a) * 8, 10, 6, { rot: a, fill: PAL.moss, alpha: 0.9 }); }
          if (past > 0) g.glow(SX + 2, top, 34, PAL.moss, 0.5 * past);
        });
        const bl = S.tp(tGr - 0.3, 0.8);
        g.line(PX + 12, Y(200), 1010, Y(200), { color: PAL.sand, w: 2, dash: [10, 8], alpha: bl, progress: bl });
        g.text('browse height', 1020, Y(200) + 7, { size: 21, color: PAL.sand, alpha: bl });
        // ---- instrument 1: a graduated pole (field tape)
        const m1 = S.tp(tMe - 0.3, 0.8);
        g.withAlpha(m1, () => {
          g.line(PX, GY, PX, Y(300), { color: PAL.ink2, w: 4 });
          for (let c = 0; c <= 300; c += 50) { g.line(PX - (c % 100 ? 6 : 11), Y(c), PX + (c % 100 ? 6 : 11), Y(c), { color: PAL.ink2, w: 2 }); if (c && c % 100 === 0) g.text(`${c}`, PX - 18, Y(c) + 7, { size: 21, role: 'mono', color: PAL.ink3, align: 'right' }); }
          g.text('cm', PX - 18, Y(300) - 22, { size: 19, color: PAL.ink3, align: 'right' });
        });
        // ---- beams from three independent instruments converge on the stem top
        const b1 = S.tp(tIM - 0.2, 0.9), b2 = S.tp(tIM + 0.4, 0.9), b3 = S.tp(tIM + 1.0, 0.9), cv = S.tp(tCv, 0.8), gr = S.tp(tGR, 1.0);
        const AX = 1130, AY = 304, CX = 1150, CY = 700;
        g.line(PX, top, SX - 4, top, { color: COL, w: 2.4, dash: [6, 5], alpha: b1 * m1, progress: b1 });
        g.withAlpha(b2, () => { g.ellipse(AX, AY, 34, 7, { fill: PAL.ink2 }); g.poly([[AX - 4, AY], [AX + 10, AY], [AX - 12, AY - 24], [AX - 22, AY - 24]], { fill: PAL.ink2, color: null, w: 0, close: true }); g.poly([[AX - 4, AY], [AX + 10, AY], [AX - 12, AY + 24], [AX - 22, AY + 24]], { fill: PAL.ink2, color: null, w: 0, close: true }); g.poly([[AX - 28, AY], [AX - 34, AY - 14], [AX - 26, AY - 14], [AX - 20, AY]], { fill: PAL.ink2, color: null, w: 0, close: true }); });
        g.line(AX - 6, AY + 8, SX + 4, top - 4, { color: COL, w: 2.4, alpha: 0.9 * b2, progress: b2 });
        g.withAlpha(b3, () => { g.line(CX, CY + 20, CX - 30, GY, { color: PAL.ink2, w: 2.4 }); g.line(CX, CY + 20, CX + 30, GY, { color: PAL.ink2, w: 2.4 }); g.line(CX, CY + 20, CX, GY, { color: PAL.ink2, w: 2 }); g.rect(CX - 24, CY - 10, 48, 32, { r: 4, fill: PAL.ink2 }); g.circle(CX - 24, CY + 6, 10, { fill: PAL.bg, stroke: PAL.ink2, w: 3 }); });
        g.line(CX - 34, CY + 6, SX + 4, top + 2, { color: COL, w: 2.4, alpha: 0.9 * b3, progress: b3 });
        // labels: different theories behind each method
        const dt = S.tp(tDT, 0.8);
        g.withAlpha(b1 * m1, () => { g.text('Field tape', PX, 864, { size: 23, color: PAL.ink, align: 'center' }); g.text('measuring by hand', PX, 893, { size: 21, italic: true, color: COL, align: 'center', alpha: dt }); });
        g.withAlpha(b2, () => { g.text('Airborne lidar', 1290, 362, { size: 23, color: PAL.ink, align: 'right' }); g.text('laser ranging', 1290, 392, { size: 21, italic: true, color: COL, align: 'right', alpha: dt }); });
        g.withAlpha(b3, () => { g.text('Repeat photographs', CX, 864, { size: 23, color: PAL.ink, align: 'center' }); g.text('optics', CX, 893, { size: 21, italic: true, color: COL, align: 'center', alpha: dt }); });
        if (cv > 0) { const pu = 0.8 + 0.2 * Math.sin((t - tCv) * 3); g.glow(SX + 2, top, 70 + 30 * gr, COL, (0.5 + 0.4 * gr) * cv * pu); g.circle(SX + 2, top, 22, { stroke: COL, w: 2.4, alpha: cv }); caps(g, 'one result', SX + 2, top - 46, { align: 'center', color: COL, alpha: cv * (1 - S.p(1, 0.6)) }); }
        // ---- Beat 1: the interpretivist lens draws the researcher into the scene
        const tDe = cue(S, 1, 'declaring'), tNo = cue(S, 1, 'what is noticed'), tRe = cue(S, 1, 'what is recorded');
        const la = S.p(1, 0.9); if (la <= 0) return;
        const lx = lerp(1040, 680, io(S, S.b(1), 1.3)), ly = 590, lr = 240;
                g.lens('int', lx, ly, lr, { alpha: la, label: false, fillA: 0.07 });
        caps(g, 'interpretivist lens', lx, ly - lr - 16, { align: 'center', color: g.LENS.int.color, alpha: la });
        g.withAlpha(S.tp(cue(S, 1, 'reflexivity') - 0.2, 0.8), () => { caps(g, 'reflexivity', 104, 770, { color: g.LENS.int.color }); g.wrap('declare the researcher’s position: it shapes what is noticed and recorded', 104, 804, 300, { size: 21, color: PAL.ink2, lh: 1.3 }); });
        g.with(() => {
          ctx.beginPath(); ctx.arc(lx, ly, lr - 3, 0, TAU); ctx.clip(); const H = g.LENS.int.color;
          const RX = 584, ra = S.tp(tDe - 0.3, 0.8), EYX = RX + 2, EYY = GY - 108;
          figure(g, RX, GY, 120, PAL.violet, ra);
          g.withAlpha(ra, () => { g.line(RX + 10, GY - 72, PX - 2, GY - 86, { color: PAL.violet, w: 4 }); });
          const va = S.tp(tDe + 0.6, 0.8);
          g.withAlpha(va, () => {
            g.poly([[EYX, EYY], [SX + 40, top - 40], [SX + 40, top + 70]], { fill: U.rgba(H, 0.12), color: null, w: 0, close: true });
            g.line(EYX, EYY, SX + 40, top - 40, { color: H, w: 1.6, dash: [5, 6] }); g.line(EYX, EYY, SX + 40, top + 70, { color: H, w: 1.6, dash: [5, 6] });
            g.circle(EYX, EYY, 15, { stroke: H, w: 2.6 }); g.circle(EYX, EYY, 4, { fill: H });
            caps(g, 'vantage point', EYX, EYY - 40, { align: 'center', color: H });
          });
          g.withAlpha(S.tp(tNo, 0.6), () => { g.circle(SX + 2, top, 30, { stroke: H, w: 2.6 }); caps(g, 'noticed', SX + 2, top - 46, { align: 'center', color: H }); });
          g.withAlpha(S.tp(tRe, 0.6), () => { g.rect(RX - 70, GY - 82, 40, 50, { r: 3, fill: '#ECE3CC' }); for (let q = 0; q < 3; q++) g.line(RX - 64, GY - 70 + q * 12, RX - 36, GY - 70 + q * 12, { color: '#6B5A3A', w: 1.4 }); });
        });
        caps(g, 'recorded', 500, GY - 42, { align: 'right', color: g.LENS.int.color, alpha: la * S.tp(tRe, 0.6) });
      },
      terms: [
        { beat: 0.65, term: 'Triangulation', def: 'Agreement among independent methods with different assumptions, which reduces the chance a result is an artifact (Hacking).' },
        { beat: 1.4, term: 'Reflexivity', def: 'Critical attention to how the researcher’s position, values, and presence shape the research.' },
      ],
    },
  ],
});
})();
