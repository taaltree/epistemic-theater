# The Epistemic Theater — engine guide for chapter authors

An animated, narrated 1920×1080 lecture on the philosophy of science for graduate students in ecology
and wildlife science. The running theme is **predation and its impacts**, anchored on Wilmers et al.
(2025), *Annual Review of Ecology, Evolution, and Systematics* 56: 337–363. Every frame is a **pure
function of time**, rendered on a canvas by `engine.js`. Narration audio is generated from each
scene's `beats`, and `timing.js` holds the real start and end time of every beat. Your job is to write
the `draw()` (and optional `init()`) functions so the visuals teach the idea and stay in sync with the
narration.

The film is the sequel to *The Ecological Theater* and shares its engine, typography, lexicon rail,
captions and chapter cards. It differs in three ways: an ink-violet palette, a **register badge** that
marks whether an idea concerns observation, inference or claim, and two **lenses** for research
traditions (postpositivist and interpretivist). Philosophy is abstract, so every scene should pair its idea with a concrete ecological
picture: animals, plants, maps, curves, field gear.

## Files

- `engine.js`: the engine (read the `makeG` section for the drawing API). **Do not edit.**
- `chapters/chNN_*.js`: one file per chapter. Narration, terms, sources and storyboard notes are
  already written.
- `tools/stills.mjs`: preview renderer (see "Checking your work").

## Hard rules

1. **Do not change** any beat text (`t`, `s`), `cite`, the number of beats, `pause` values, scene `id`s,
   or chapter metadata. The audio was synthesized from them. You may tune the `beat` value of a term
   (when its lexicon card appears).
2. **Deterministic.** Never use `Math.random()` or `Date`. Use `U.rng(seed)` inside `init()` and store
   results. `draw(g, t, S, D)` must depend only on its arguments, because frames are rendered out of
   order in parallel.
3. **Performance.** Keep a frame under ~25 ms (stills.mjs prints the average). Precompute in `init()`.
   Pre-render heavy static imagery once to an offscreen canvas (`Theater.makeCanvas(w, h)`) and
   `drawImage` it. Avoid `shadowBlur`, `getImageData`, and thousands of path calls per frame.
4. **Edit only your chapter file(s).** Keep helpers local to the file (each file is an IIFE).
5. **Follow the storyboard note** (`v`) of each beat unless a better picture serves the narration more
   clearly; never contradict the narration. Illustrative numbers must be labelled ILLUSTRATIVE on screen.

## Script fields (read-only)

Each scene: `{ id, title, register, beats: [{ t, s?, cite?, v?, pause?, reg? }], terms: [{ beat, term, def }] }`.
- `t` is the caption text; `s` (if present) is the spoken text with pronunciation respellings.
- `cite` is shown automatically by the engine in the header while that beat plays. Do not draw it.
- `v` is the storyboard note: what the picture should show during that beat.
- `register` ('observe' | 'infer' | 'claim' | 'all' | null) drives the corner badge; a beat's `reg` overrides it.
- The chapter's `casefile` ({ title, sketch }) is drawn on the chapter card automatically. Scenes titled
  "Case file: …" should open by pinning that card on stage with `g.casefile(...)` (see below).

## Frame layout (1920×1080)

| Region | Bounds | Notes |
|---|---|---|
| Header | y < 195 | Engine draws chapter eyebrow, scene title, chapter ticks, register badge (top right, y 104–150), the source line (right, y≈174) and the rule at y=186. Never draw here. |
| Stage (scene has terms) | x 80–1330, y 215–915 | The lexicon rail occupies x 1392–1840 automatically. |
| Stage (no terms) | x 80–1840, y 215–915 | |
| Caption band | y > 925 | Must stay empty: captions overlay here. |

Use the space generously. Figures should fill the stage, not huddle at the top. Typical two-panel
layout: panel labels at y≈262; left plot area x 150–640, right plot area x 780–1290; plot areas
y≈300–840. A full-width single figure: x 150–1290. Small-caps panel labels: 17px, `ls` 2.6, `PAL.ink3`.
Minimum text sizes: annotations 21px, axis words 22px, equations 40–56px. Leave clear gaps between
labels and curves; nothing may overlap the rail or caption band.

## Timing API (`S`, bound to the scene-local time `t` in seconds)

- `S.b(k)` start of beat k (fractional k interpolates within beat k: `S.b(2.5)` is mid-beat 2)
- `S.e(k)` end of beat k · `S.dur` scene length · `S.n` beat count
- `S.p(k, d=0.9, delay=0)` eased 0→1 progress starting at beat k (+delay s) over d s
- `S.io(k, d, delay)` ease-in-out version · `S.lin(k, d, delay)` linear version
- `S.ph(k)` linear progress through beat k · `S.span(k0, k1)` progress from start of k0 to start of k1
- `S.at(k)` has beat k started · `S.since(k)` seconds since beat k started · `S.end(d)` fade near scene end
- `S.tp(s0, d)` eased progress from absolute local time s0

Sync visuals to narration: a beat's speech runs at roughly **2.6 words per second**, so if a term is
mentioned ~20 words into beat 2, reveal it with `S.p(2, 0.8, 7.5)`. To key on a phrase, a local helper
like `const cue = (S, k, phrase) => { const b = S.scene.beats[k]; const txt = b.s || b.t; const i = txt.indexOf(phrase); return S.b(k) + (i < 0 ? 0 : (S.e(k) - S.b(k)) * i / txt.length); };`
gives the local time a phrase is spoken (use with `S.tp(cue(...), 0.8)`). **Every beat must visibly
change the picture**, and the element being described should appear when it is spoken. Use a
crossfade helper like `const vis = (S, k0, k1, d = 0.8) => S.p(k0, d) * (k1 === undefined ? 1 : 1 - S.p(k1, 0.6));`
to swap panel states. The engine adds a short dip-to-background transition between scenes.

## Drawing API (`g`)

Text and math
- `g.text(str, x, y, {size, role:'sans'|'display'|'math'|'mono', color, align, alpha, weight, italic, ls, maxW})` → width
- `g.wrap(str, x, y, width, {...text opts, lh})` → height · `g.lines(str, width, opts)` → array · `g.measure(str, opts)`
- `g.math(expr, x, y, {size, color, align, alpha})`: TeX-like. Supports `x_{i}`, `x^{2}`, `\frac{a}{b}`,
  `\hat{S}`, `\bar{x}`, `\text{...}`, `\mathbf{n}`, `\ln`, `\sum`, `\prod`, `\cdot`, `\times`, `\approx`,
  `\ge`, `\le`, `\to`, `\,` `\;` `\quad`, and Greek as Unicode. No `\left(`; plain parentheses and `|`.

Shapes
- `g.line(x1,y1,x2,y2,{color,w,alpha,dash,progress})` · `g.arrow(...,{head,both,progress})` · `g.carrow(x1,y1,x2,y2,bend,{...})` curved arrow
- `g.poly(pts,{color,w,alpha,progress,fill,close,dash})` partial-draw by arc length · `g.circle(x,y,r,{fill,stroke,w,alpha})` · `g.ellipse(x,y,rx,ry,{rot,...})` · `g.rect(x,y,w,h,{fill,stroke,r,alpha})`
- `g.glow(x,y,r,color,alpha)` additive halo · `g.dot(x,y,r,color,alpha,halo)` luminous dot (the house style for individuals)
- `g.pill(text,x,y,{color,size,align,alpha})` · `g.icon(kind,x,y,size,color,{alpha,flip,rot,flap,sway,flower,bg})`
  kinds: wolf, coyote, fox, puma, bear, elk, deer, moose, caribou, bison, beaver, otter, aspen, willow,
  tree, conifer, plant, grass, kelp, urchin, seastar, swan, songbird, bird, fish, bug, butterfly, hare,
  lynx, collar, vial, track, boxes, map, seed, cell. All face right; use `flip` to face left.
- `g.withAlpha(a, fn)` · `g.with(fn)` save/restore · `g.clip(x,y,w,h,fn)` · `g.ctx` raw 2D context

Series devices (new in this film)
- `g.bands(x, y, w, h, {active, alpha, progress, labels, labSize, gap})` draws the three stacked bands
  (Observe at the bottom, Claim at the top). `active`: 'observe' | 'infer' | 'claim' | 'all' | array.
  Returns `{observe, infer, claim}` rectangles so you can place content inside each band.
- `g.lens(kind, x, y, r, {alpha, label, labSize, fillA})` draws a research-tradition lens: kind 'pos'
  (positivist/postpositivist, lagoon blue) or 'int' (interpretivist, heather). This film uses only these
  two; do not use 'ind'. For "lens" beats, slide a lens over a scene and change what is drawn inside it
  (clip with `g.ctx` arc + clip).
- `g.casefile(x, y, w, h, {title, no, sketch, color, rot, alpha, pin, titleSize})` draws a case-file
  index card (parchment, ruled, with a pin and an icon sketch). Typical: 360×200 at top-left of stage.
- `Theater.REG[k].color`, `Theater.LENS[k].color` give the band and lens colors (also on `g.REG`, `g.LENS`).

Plots
- `A = g.axes({x,y,w,h,xmin,xmax,ymin,ymax,xlab,ylab,progress,logx,logy,xticks,yticks,grid,arrows,labSize})`
  → `A.X(v)`, `A.Y(v)` map data to screen. (x,y) is the top-left of the plotting area. Short labels
  (≤3 chars or containing `_ ^ \`) render as math. Ticks: `[{v, l}]`.
- `g.plot(A, fn, {from,to,color,w,progress,dash,alpha,fillTo,fillColor})` → screen point of the tip
- `g.data(A, [[x,y],...], {color,w,progress,...})`

Palette (`PAL`): `bg ink ink2 ink3 rule faint panel moss ochre coral lagoon heather rose sand mint violet parchment clay snow`.
Utilities (`U`): `clamp lerp inv smooth ease.{out,in,inOut,outBack} rng(seed) gauss(r) noise1 noise2 fbm2 rgba(hex,a) mix(h1,h2,t) hsl fmt`.

## Style

Ink-violet night with parchment ink, a topographic contour background (engine), serif display titles
(Instrument Serif), IBM Plex Sans labels, STIX math. Teach with diagrams an examiner would accept on a
whiteboard (argument maps, causal graphs, likelihood curves, sampling designs, matrices), and make them
**move**: arrows that draw, nodes that light, curves that reshape as evidence arrives, animals that walk
across a landscape. Semantic color, used consistently across the film:
- predators coral (`PAL.coral`); prey and other herbivores sand; plants moss; water and hydrology lagoon;
  humans and management violet; evidence and data ink2.
- bands: Observe green, Infer amber, Claim rose (`g.REG`); lenses as above (`g.LENS`).
- the chapter accent (`COL`) for highlights and the current focus.
Keep it beautiful and uncluttered: one idea per beat. Ecological landscapes (the Northern Range, snow,
streams, aspen stands) are drawn in fine line work, never filled photographs. Case-file scenes open by
pinning the chapter's case-file card at the top left of the stage, then shrinking it to a corner once
the narration moves into the evidence.

No chapter `motif` in this film: the case file occupies the top right of the chapter card.

## Checking your work

```
cd source && node tools/stills.mjs <scene-id>            # contact sheet: one frame per beat + end
node tools/stills.mjs <scene-id> --t 4,12.5,30 --cols 3  # specific local times (seconds)
node tools/stills.mjs <scene-id> --t 20 --full           # also writes a full-size 1920×1080 PNG
node tools/stills.mjs <chapter-id>                        # every scene in the chapter (e.g. "obs")
```

It prints the sheet path, the beat-aligned times, the average ms/frame, and any render errors (non-zero
exit). **Open the image with the Read tool and look at it critically**: check overlap, clipping, empty
regions, legibility, sync with what each beat says, and that nothing enters the header, rail or caption
band. Iterate until every scene is polished. Also run `node --check chapters/<file>.js`.
