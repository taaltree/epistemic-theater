// Build the companion study guide (HTML + PDF) from chapter data and guide_content.mjs.
// Usage: node tools/build_guide.mjs [--no-pdf]
import fs from 'node:fs';
import path from 'node:path';
import { loadTheater, OUT } from './load.mjs';
import { CHAPTERS } from '../guide_content.mjs';
import { REFS, citeKeys } from './refs.mjs';
import { printPDF } from './cdp.mjs';

const Th = loadTheater();
const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Print-safe accents (darker variants of the video palette) keyed by chapter id.
const INK = { open: '#6B5A2E', aims: '#7A6631', know: '#6447A8', infer: '#94650A', fals: '#B0412A', kuhn: '#1C7A8C', obs: '#2C8463', models: '#4C7A30', cause: '#A23F69', under: '#7A6631', bayes: '#1C7A8C', rep: '#94650A', values: '#6447A8', demarc: '#2C8463', syn: '#22202F' };
const chapters = Th.chapters.filter((c) => c.roman).map((ch) => {
  const scenes = Th.scenes.filter((s) => s.chapter === ch);
  return { ch, start: scenes[0].start, end: scenes[scenes.length - 1].end, scenes: scenes.filter((s) => s.kind !== 'card'), terms: Th.termIndex.filter((t) => t.chapter === ch.title) };
});
const total = Th.duration;
// References: every source cited on screen, grouped as in the script book.
const used = new Set(); for (const sc of Th.scenes) for (const b of (sc.beats || [])) if (b.cite) citeKeys(b.cite).keys.forEach((k) => used.add(k));
const GROUPS = [['pred', 'Predation casebook'], ['phil', 'Philosophy, methods, and statistics'], ['ind', 'Further reading on knowledge systems'], ['law', 'Legal cases']];
const sortKey = (k) => REFS[k][1].replace(/<[^>]+>/g, '').toLowerCase();
const refGroups = GROUPS.map(([g, title]) => [title, [...used].filter((k) => REFS[k][0] === g).sort((a, b) => sortKey(a).localeCompare(sortKey(b)))]).filter(([, ks]) => ks.length);
const REFERENCES = refGroups.flatMap(([, ks]) => ks);

const css = `
/* Layout: a single readable column with a printed-handout rhythm; chapter accents carried from the video. */
:root { --paper: #F4F5F7; --ink: #18192A; --ink2: #464A5E; --ink3: #767A8E; --rule: #D6D8E0; --panel: #E9EBF1; --c: #18192A;
  --display: "Instrument Serif", "Iowan Old Style", Palatino, Georgia, serif; --sans: "IBM Plex Sans", "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  --math: "STIX Two Text", "Times New Roman", Times, serif; --mono: "IBM Plex Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #0E0D1A; --ink: #EFE8D8; --ink2: #B7B3C6; --ink3: #8A87A0; --rule: #2A2740; --panel: #17152A; color-scheme: dark; } }
:root[data-theme="dark"] { --paper: #0E0D1A; --ink: #EFE8D8; --ink2: #B7B3C6; --ink3: #8A87A0; --rule: #2A2740; --panel: #17152A; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 15.5px/1.55 var(--sans); }
main { max-width: 860px; margin: 0 auto; padding-inline: 20px; padding-block: 48px 80px; }
h1, h2, h3 { font-family: var(--display); font-weight: 400; text-wrap: balance; margin: 0; }
.cover { padding-block: 10px 30px; border-bottom: 1px solid var(--rule); }
.eyebrow { font: 600 12px var(--sans); letter-spacing: 2.4px; text-transform: uppercase; color: var(--ink3); }
.cover h1 { font-size: 64px; line-height: 1.02; margin: 10px 0 8px; }
.cover .lede { font: italic 22px/1.4 var(--display); color: var(--ink2); max-width: 46ch; }
.meta { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 18px; color: var(--ink3); font-size: 13.5px; }
.meta b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.toc { margin: 28px 0 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 4px 28px; }
.toc a { display: flex; gap: 10px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--rule); color: var(--ink); text-decoration: none; }
.toc .rn { font: italic 20px var(--display); color: var(--c); min-width: 34px; }
.toc .tt { font: 19px var(--display); }
.toc .ts { margin-left: auto; font: 12px var(--mono); color: var(--ink3); }
.howto { margin-top: 26px; color: var(--ink2); font-size: 14.5px; max-width: 70ch; }
section.ch { padding-top: 44px; }
.chhead { display: flex; align-items: baseline; gap: 18px; border-bottom: 2px solid var(--c); padding-bottom: 10px; }
.chhead .rn { font: italic 64px/0.9 var(--display); color: var(--c); }
.chhead h2 { font-size: 40px; line-height: 1.05; }
.chhead .q { font: italic 18px var(--display); color: var(--ink2); margin-top: 4px; }
.chhead .ts { margin-left: auto; font: 12.5px var(--mono); color: var(--ink3); white-space: nowrap; }
h3 { font-size: 24px; margin: 26px 0 10px; display: flex; align-items: baseline; gap: 10px; }
h3 small { font: 600 11px var(--sans); letter-spacing: 2px; text-transform: uppercase; color: var(--c); }
.scenes { color: var(--ink3); font-size: 13.5px; margin-top: 10px; }
.scenes span { white-space: nowrap; }
.eqs { display: grid; gap: 8px; }
.eq { background: var(--panel); border-radius: 4px; padding: 10px 14px; display: grid; grid-template-columns: 190px 1fr; gap: 14px; break-inside: avoid; }
.eq .nm { font-size: 13px; font-weight: 600; color: var(--ink2); }
.eq .ex { font: 17px/1.5 var(--math); min-width: 0; overflow-wrap: anywhere; }
.eq .ex i { font-style: italic; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; font: 600 11px var(--sans); letter-spacing: 1.6px; text-transform: uppercase; color: var(--ink3); padding: 6px 8px; border-bottom: 1px solid var(--rule); }
td { padding: 7px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
td:first-child { font-weight: 600; white-space: nowrap; }
td:nth-child(2) { color: var(--ink2); }
.tablewrap { overflow-x: auto; }
.lex { display: grid; grid-template-columns: 1fr 1fr; gap: 0 26px; }
.term { padding: 9px 0; border-bottom: 1px solid var(--rule); break-inside: avoid; }
.term .no { font: 11.5px var(--mono); color: var(--c); letter-spacing: 0.6px; display: flex; justify-content: space-between; }
.term .nm { font: 20px/1.2 var(--display); margin: 2px 0; }
.term .df { color: var(--ink2); font-size: 14px; line-height: 1.45; }
ol.prompts { margin: 0; padding-left: 22px; } ol.prompts li { margin: 6px 0; }
.ans { padding: 10px 0; border-bottom: 1px solid var(--rule); break-inside: avoid; } .ans b { display: block; font: 19px var(--display); font-weight: 400; margin-bottom: 2px; }
.ans p { margin: 0; color: var(--ink2); }
.refs { font-size: 13.2px; color: var(--ink2); padding-left: 0; list-style: none; } .refs li { margin: 5px 0; padding-left: 22px; text-indent: -22px; }
footer { margin-top: 50px; color: var(--ink3); font-size: 12.5px; border-top: 1px solid var(--rule); padding-top: 14px; }
@media (max-width: 640px) { .cover h1 { font-size: 44px; } .eq { grid-template-columns: 1fr; gap: 2px; } .lex { grid-template-columns: 1fr; } .chhead { flex-wrap: wrap; } .chhead .rn { font-size: 48px; } .chhead h2 { font-size: 32px; } td:first-child { white-space: normal; } }
@page { size: Letter; margin: 0.6in 0.6in 0.7in; }
@media print {
  :root { --paper: #FFFFFF; --panel: #EFF0F5; }
  body { font-size: 10.5pt; } main { max-width: none; padding: 0; }
  section.ch { break-before: page; padding-top: 0; } .cover h1 { font-size: 46pt; }
  .eq .ex { font-size: 12pt; } .term .nm { font-size: 14pt; } .term .df { font-size: 9.6pt; }
  h3 { break-after: avoid; } a { color: inherit; text-decoration: none; }
}`;

const chapterHTML = chapters.map(({ ch, start, end, scenes, terms }) => {
  const G = CHAPTERS[ch.id] || {};
  const style = `--c:${INK[ch.id]}`;
  let h = `<section class="ch" id="ch${ch.index}" style="${style}"><div class="chhead"><span class="rn">${ch.roman}</span><div><h2>${esc(ch.title)}</h2><div class="q">${esc(ch.question || '')}</div></div><span class="ts">video ${fmt(start)}–${fmt(end)}</span></div>`;
  h += `<div class="scenes">${scenes.map((s) => `<span>${fmt(s.start)} ${esc(s.title)}</span>`).join(' · ')}</div>`;
  if (G.ideas) h += `<h3><small>Key positions</small></h3><div class="tablewrap"><table><thead><tr><th>Idea</th><th>Who</th><th>In one line</th></tr></thead><tbody>${G.ideas.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
  if (G.equations) h += `<h3><small>Formulas</small></h3><div class="eqs">${G.equations.map(([n, e]) => `<div class="eq"><div class="nm">${n}</div><div class="ex">${e}</div></div>`).join('')}</div>`;
  if (G.vellend) h += `<h3><small>Four processes</small></h3><div class="tablewrap"><table><thead><tr><th>Process</th><th>Population-genetics analogue</th><th>Where it appears</th></tr></thead><tbody>${G.vellend.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>`;
  if (G.cases) h += `<h3><small>Predation case files</small></h3><div class="tablewrap"><table><thead><tr><th>Study</th><th>System</th><th>What it shows</th></tr></thead><tbody>${G.cases.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
  if (G.audit) h += `<h3><small>Seven-question claim audit</small></h3><ol class="prompts">${G.audit.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`;
  if (G.studies) h += `<h3><small>Landmark studies</small></h3><div class="tablewrap"><table><thead><tr><th>Study</th><th>System</th><th>Key finding</th></tr></thead><tbody>${G.studies.map((r) => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
  if (terms.length) h += `<h3><small>Lexicon</small></h3><div class="lex">${terms.map((t) => `<div class="term"><div class="no"><span>No. ${String(t.no).padStart(3, '0')}</span><span>${fmt(t.time)}</span></div><div class="nm">${esc(t.term)}</div><div class="df">${esc(t.def)}</div></div>`).join('')}</div>`;
  if (G.prompts) h += `<h3><small>Exam prompts</small></h3><ol class="prompts">${G.prompts.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`;
  if (G.answers) h += `<h3><small>Rehearsal answers</small></h3>${G.answers.map(([q, a]) => `<div class="ans"><b>${esc(q)}</b><p>${a}</p></div>`).join('')}`;
  return h + '</section>';
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Epistemic Theater Study Guide</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=Instrument+Serif:ital@0;1&family=STIX+Two+Text:ital,wght@0,400;0,700;1,400&display=swap">
<style>${css}</style>
</head>
<body>
<main>
<div class="cover">
  <div class="eyebrow">Study guide &amp; lexicon</div>
  <h1>The Epistemic Theater</h1>
  <div class="lede">How science knows what it knows, and what counts as science: a companion to the narrated program.</div>
  <div class="meta"><span><b>${fmt(total)}</b> running time</span><span><b>${chapters.length}</b> chapters</span><span><b>${Th.termIndex.length}</b> lexicon terms</span><span><b>${REFERENCES.length}</b> references</span></div>
  <nav class="toc">${chapters.map(({ ch, start }) => `<a href="#ch${ch.index}" style="--c:${INK[ch.id]}"><span class="rn">${ch.roman}</span><span class="tt">${esc(ch.title)}</span><span class="ts">${fmt(start)}</span></a>`).join('')}</nav>
  <p class="howto">Each chapter lists the key positions and who holds them, the predation case files the chapter uses (anchored on Wilmers et al. 2025), formulas where they matter, every numbered lexicon term from the video with the time it appears, and practice prompts. For each prompt, separate what was observed, what was inferred, and what can be claimed. Timestamps match the video and the interactive player.</p>
</div>
${chapterHTML}
<section class="ch" id="refs" style="--c:${INK.syn}"><div class="chhead"><h2>References</h2></div>${refGroups.map(([title, ks]) => `<h3><small>${title}</small></h3><ul class="refs">${ks.map((k) => `<li>${REFS[k][1]}</li>`).join('')}</ul>`).join('')}
<footer>Generated from the same source as the video, so term numbers and timestamps stay in sync. Narration: ElevenLabs voice “Megan” (Multilingual v2). Figures in the video marked “stylized” or “illustrative” show qualitative patterns or invented example numbers, not reproduced data. Running theme: the ecological impacts of large-carnivore recovery (Wilmers et al. 2025).</footer></section>
</main>
</body>
</html>`;

const htmlOut = path.join(OUT, 'The_Epistemic_Theater_Study_Guide.html');
fs.writeFileSync(htmlOut, html);
console.log('wrote', htmlOut);
if (!process.argv.includes('--no-pdf')) {
  const pdfOut = path.join(OUT, 'The_Epistemic_Theater_Study_Guide.pdf');
  await printPDF('file://' + htmlOut, pdfOut);
  console.log('wrote', pdfOut, `(${(fs.statSync(pdfOut).size / 1024).toFixed(0)} KB)`);
}
