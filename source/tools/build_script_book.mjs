// Script book for review: narration, storyboard notes, sources, lexicon, fact-check table, references.
// Writes ../script/The_Epistemic_Theater_Script_Draft<N>.{html,pdf,docx}. Usage: node tools/build_script_book.mjs [--draft 1] [--no-pdf]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadTheater, OUT } from './load.mjs';
import { launch } from './cdp.mjs';
import { REFS, citeKeys } from './refs.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DRAFT = arg('--draft', '1'); const FINAL = process.argv.includes('--final');
const DIR = path.join(OUT, 'script'); fs.mkdirSync(DIR, { recursive: true });
const BASE = FINAL ? 'The_Epistemic_Theater_Script_Final' : `The_Epistemic_Theater_Script_Draft${DRAFT}`;
const Th = loadTheater({ withTiming: false });
const CAL = 0.96; // estimated → real duration ratio measured on the first film
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mm = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`;
const speech = (b) => b.s || b.t;
const totalChars = Th.scenes.reduce((a, s) => a + (s.beats || []).reduce((b, x) => b + speech(x).length, 0), 0);
const content = Th.scenes.filter((s) => s.kind !== 'card');
const REG = { observe: ['Observe', 'obs'], infer: ['Infer', 'inf'], claim: ['Claim', 'clm'], all: ['All three bands', 'all'] };
const termNo = new Map(Th.termIndex.map((t) => [t.scene + '|' + t.term, t.no]));
// Word-level diff of caption vs speech text, so the book lists only the respelled words.
function respellings(t, s) {
  const a = t.split(/\s+/), b = s.split(/\s+/), n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0, da = [], db = [];
  const flush = () => { if (da.length || db.length) out.push(`${da.join(' ') || '∅'} → ${db.join(' ') || '∅'}`); da = []; db = []; };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { flush(); i++; j++; }
    else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) db.push(b[j++]);
    else da.push(a[i++]);
  }
  flush();
  return out.map((x) => x.replace(/[.,;:]+(?= →|$)/g, ''));
}

// Fact-check status. Specific notes first, then rules by source kind.
const NOTES = {
  'aims-elk.0': 'Counts from the review (record high >19,000 just before 1995; 3,915 in 2013; 7,000–9,000 now).',
  'know-four.1': 'Confirm that axiology entered the Guba and Lincoln framework in the 2000/2005 Handbook chapters.',
  'obs-stems.1': 'Painter et al. 2015 used both random sampling and the five-tallest method; their principal range-wide inference rested largely on the random samples. Wilmers et al. 2025 implies tallest stems only; corrected here at the producer’s direction.',
  'fals-fear.1': 'The review attributes the encounter-rate finding to Middleton et al. 2013 but lists the Ecology paper; the finding is from the Ecology Letters paper, which the film cites.',
  'kuhn-vermin.1': 'Leopold’s phrase “fierce green fire” (three words) is quoted; the rest is paraphrase.',
  'models-boxes.2': 'The critique is a manuscript under review, as reported in Wilmers et al. 2025; on screen it is attributed to “critics” and to the review.',
  'bayes-lr.1': 'Illustrative numbers, labelled on screen: 95 of 1,094 flagged photos are wolves (8.7%).',
  'bayes-case.3': 'Illustrative calculation, labelled on screen: normal approximation, SE = (0.05 + 0.41) / 3.92 = 0.117; P(effect < 0) = Φ(0.18 / 0.117) ≈ 0.94.',
  'values-caribou.1': 'Recovery actions included wolf reduction (Lamb et al. 2024 evaluates them); confirm wording.',
  'values-caribou.2': 'Gilbert et al. 2017: 155 deaths averted over 30 years (confirmed from the abstract); the review’s “annually” is a slip.',
  'values-social.2': 'Producer disclosure in narration: decision for the producer (see Open items).',
  'demarc-wolves.0': 'Confirmed: 1995 legislature barred IDFG; Nez Perce Tribe led on-the-ground recovery under a 1995 USFWS cooperative agreement (Tribe Wildlife Program; Idaho Capital Sun 2025). Tribal review of wording still recommended.',
};
function status(sc, k, b) {
  const id = `${sc.id}.${k}`; if (NOTES[id]) return NOTES[id];
  const { keys } = citeKeys(b.cite); const kinds = new Set(keys.map((x) => REFS[x][0]));
  if (kinds.size === 1 && kinds.has('pred')) return 'Matches Wilmers et al. 2025; spot-check against the primary source.';
  if (kinds.has('pred')) return 'Predation facts match Wilmers et al. 2025; attribution of ideas is standard.';
  if (kinds.has('law')) return 'Case citation standard; confirm holding as paraphrased.';
  return 'Standard attribution; confirm paraphrase against the source.';
}

const used = new Set(); const unknownCites = new Set();
for (const s of Th.scenes) for (const b of (s.beats || [])) if (b.cite) { const { keys, unknown } = citeKeys(b.cite); keys.forEach((k) => used.add(k)); unknown.forEach((u) => unknownCites.add(u)); }

let toc = '', body = '', fact = '';
const chapters = Th.chapters;
chapters.forEach((ch) => {
  const scs = Th.scenes.filter((s) => s.chapter === ch);
  const dur = scs.reduce((a, s) => a + s.dur, 0) * CAL; const chars = scs.reduce((a, s) => a + (s.beats || []).reduce((b, x) => b + speech(x).length, 0), 0);
  const label = ch.roman ? `${ch.roman} · ${ch.title}` : ch.title;
  toc += `<tr><td class="num">${ch.roman || '·'}</td><td><a href="#${ch.id}">${esc(ch.title)}</a></td><td>${esc(ch.casefile ? ch.casefile.title : '—')}</td><td class="num">${scs.filter((s) => s.kind !== 'card').length}</td><td class="num">${chars.toLocaleString('en-US')}</td><td class="num">${mm(dur)}</td></tr>`;
  body += `<section class="chapter" id="${ch.id}"><h2>${esc(label)}</h2>`;
  if (ch.question) body += `<p class="q">${esc(ch.question)}</p>`;
  if (ch.casefile) body += `<p class="case"><span class="kicker">Case file</span> ${esc(ch.casefile.title)}</p>`;
  for (const sc of scs) {
    if (sc.kind === 'card') { if (sc.beats.length) body += `<p class="card"><span class="kicker">Chapter card</span> ${esc(sc.beats[0].t)}</p>`; continue; }
    const reg = REG[sc.register]; const scChars = sc.beats.reduce((a, x) => a + speech(x).length, 0);
    body += `<div class="scene"><h3>${esc(sc.title)}</h3><p class="smeta"><span class="mono">${sc.id}</span>${reg ? ` · <span class="chip ${reg[1]}">${reg[0]}</span>` : ''} · ${sc.beats.length} beats · ${scChars.toLocaleString('en-US')} characters · ≈ ${mm(sc.dur * CAL)}</p>`;
    body += `<table class="beats"><thead><tr><th class="bn">#</th><th class="nar">Narration</th><th class="vis">On screen (provisional)</th><th class="src">Source</th></tr></thead><tbody>`;
    sc.beats.forEach((b, k) => {
      const spoken = b.s && b.s !== b.t ? `<div class="spoken"><b>Spoken as:</b> ${respellings(b.t, b.s).map(esc).join(' · ')}</div>` : '';
      const pause = b.pause ? `<div class="spoken">pause ${b.pause} s</div>` : '';
      body += `<tr><td class="bn">${k + 1}</td><td class="nar">${esc(b.t)}${spoken}${pause}</td><td class="vis">${esc(b.v || '')}</td><td class="src">${esc(b.cite || '')}</td></tr>`;
      if (b.cite) fact += `<tr><td class="mono">${sc.id}.${k + 1}</td><td>${esc(b.t)}</td><td>${esc(b.cite)}</td><td>${esc(status(sc, k, b))}</td></tr>`;
    });
    body += `</tbody></table>`;
    const terms = (sc.terms || []).filter((t) => !t.demo);
    if (terms.length) body += `<dl class="terms">${terms.map((t) => `<dt><span class="no">No. ${String(termNo.get(sc.id + '|' + t.term)).padStart(3, '0')}</span> ${esc(t.term)}</dt><dd>${esc(t.def)}</dd>`).join('')}</dl>`;
    body += `</div>`;
  }
  body += `</section>`;
});

const GROUPS = [['pred', 'Predation casebook'], ['phil', 'Philosophy, methods, and statistics'], ['ind', 'Indigenous scholarship and knowledge systems'], ['law', 'Legal cases']];
const sortKey = (k) => REFS[k][1].replace(/<[^>]+>/g, '').toLowerCase();
const refsHtml = GROUPS.map(([g, title]) => {
  const ks = [...used].filter((k) => REFS[k][0] === g).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  if (g === 'pred') { ks.splice(ks.indexOf('Wilmers et al. 2025'), 1); ks.unshift('Wilmers et al. 2025'); }
  return `<h3>${title}</h3><ul class="refs">${ks.map((k) => `<li${k === 'Wilmers et al. 2025' ? ' class="anchor"' : ''}>${REFS[k][1]}</li>`).join('')}</ul>`;
}).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Epistemic Theater Script</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap">
<style>
/* Review layout: one reading column; beat tables carry narration, storyboard, and source side by side. */
:root { --paper:#F4F5F7; --ink:#18192A; --ink2:#464A5E; --ink3:#767A8E; --rule:#D6D8E0; --panel:#E9EBF1; --accent:#5B4FA8; --accent2:#A0612B;
  --obs:#DDEBDD; --obs-ink:#2E5B31; --inf:#F1E6CF; --inf-ink:#7A5512; --clm:#F2DDE2; --clm-ink:#8A2E46;
  --display:"Instrument Serif","Iowan Old Style",Palatino,Georgia,serif; --sans:"IBM Plex Sans","Avenir Next","Helvetica Neue",Arial,sans-serif; --mono:"IBM Plex Mono",Menlo,Consolas,monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper:#101222; --ink:#ECEAF4; --ink2:#B9B8CC; --ink3:#8A8AA2; --rule:#2A2D44; --panel:#181B30; --accent:#A99CF0; --accent2:#E0A266;
  --obs:#1D3324; --obs-ink:#A7D7A9; --inf:#3A2F18; --inf-ink:#E8C27A; --clm:#3A1D27; --clm-ink:#F0A3B6; color-scheme: dark; } }
:root[data-theme="dark"] { --paper:#101222; --ink:#ECEAF4; --ink2:#B9B8CC; --ink3:#8A8AA2; --rule:#2A2D44; --panel:#181B30; --accent:#A99CF0; --accent2:#E0A266;
  --obs:#1D3324; --obs-ink:#A7D7A9; --inf:#3A2F18; --inf-ink:#E8C27A; --clm:#3A1D27; --clm-ink:#F0A3B6; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.55 var(--sans); }
main { max-width:1100px; margin:0 auto; padding:40px 20px 90px; }
h1,h2,h3 { font-family:var(--display); font-weight:400; margin:0; text-wrap:balance; }
h1 { font-size:56px; line-height:1.02; margin:8px 0 10px; }
h2 { font-size:38px; margin:50px 0 6px; padding-top:14px; border-top:2px solid var(--accent); }
h3 { font-size:25px; margin:26px 0 2px; }
p, li { max-width:78ch; }
a { color:var(--accent); }
.eyebrow { font:600 12px var(--sans); letter-spacing:2.4px; text-transform:uppercase; color:var(--ink3); }
.lede { font:italic 21px/1.45 var(--display); color:var(--ink2); max-width:60ch; }
.meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:22px 0 8px; }
.meta div { border-top:1px solid var(--rule); padding-top:8px; } .meta b { display:block; font:26px/1.1 var(--display); } .meta span { font-size:12.5px; color:var(--ink3); }
.note { border-left:3px solid var(--accent2); padding:4px 0 4px 14px; color:var(--ink2); margin:14px 0; }
.kicker { font:600 11px var(--sans); letter-spacing:1.8px; text-transform:uppercase; color:var(--accent); margin-right:8px; }
.q { font:italic 21px var(--display); color:var(--ink2); margin:0 0 6px; }
.case, .card { margin:4px 0; color:var(--ink2); }
.smeta { font-size:12.5px; color:var(--ink3); margin:0 0 6px; }
.mono { font-family:var(--mono); font-size:12px; }
.chip { display:inline-block; font:600 10.5px var(--sans); letter-spacing:.8px; text-transform:uppercase; padding:1px 7px; border-radius:3px; }
.chip.obs { background:var(--obs); color:var(--obs-ink); } .chip.inf { background:var(--inf); color:var(--inf-ink); } .chip.clm { background:var(--clm); color:var(--clm-ink); } .chip.all { background:var(--panel); color:var(--ink2); }
.tablewrap { overflow-x:auto; }
table { border-collapse:collapse; width:100%; font-size:13.5px; }
th { text-align:left; font:600 10.5px var(--sans); letter-spacing:1.3px; text-transform:uppercase; color:var(--ink3); padding:6px 8px; border-bottom:1px solid var(--rule); vertical-align:bottom; }
td { padding:8px; border-bottom:1px solid var(--rule); vertical-align:top; }
td.num { font-family:var(--mono); font-variant-numeric:tabular-nums; white-space:nowrap; }
table.beats td.nar { font:17px/1.5 var(--display); color:var(--ink); width:46%; }
table.beats td.vis { color:var(--ink2); font-size:12.5px; width:30%; }
table.beats td.src { color:var(--ink3); font-size:12px; width:18%; }
table.beats .bn { width:28px; font-family:var(--mono); color:var(--ink3); }
.spoken { font:12px/1.45 var(--sans); color:var(--accent2); margin-top:6px; }
dl.terms { display:grid; grid-template-columns:minmax(180px,260px) 1fr; gap:4px 14px; margin:10px 0 4px; padding:10px 12px; background:var(--panel); border-radius:4px; font-size:13.5px; }
dl.terms dt { font-weight:600; } dl.terms dd { margin:0; color:var(--ink2); } .no { font:11px var(--mono); color:var(--accent); margin-right:4px; }
table.fact td { font-size:12.5px; } table.fact td:nth-child(2) { width:48%; }
ul.refs { list-style:none; padding:0; font-size:13.4px; color:var(--ink2); } ul.refs li { padding-left:22px; text-indent:-22px; margin:4px 0; max-width:none; } ul.refs li.anchor { color:var(--ink); font-weight:600; }
ol.items li { margin:6px 0; }
footer { margin-top:50px; padding-top:12px; border-top:1px solid var(--rule); color:var(--ink3); font-size:12.5px; }
@media (max-width:700px) { h1 { font-size:40px; } table.beats, table.beats tbody, table.beats tr, table.beats td { display:block; width:auto !important; } table.beats thead { display:none; } table.beats td.bn { border:0; padding-bottom:0; } dl.terms { grid-template-columns:1fr; } }
@page { size:Letter; margin:0.55in 0.5in 0.65in; }
@media print { :root { --paper:#FFFFFF; } body { font-size:9.5pt; } main { max-width:none; padding:0; } .meta { grid-template-columns:repeat(5,1fr); } h2 { break-before:page; margin-top:0; } h3 { break-after:avoid; } .scene { break-inside:auto; } tr, dl.terms { break-inside:avoid; } a { color:inherit; text-decoration:none; } .front h2 { break-before:auto; } }
</style></head><body><main>
<div class="eyebrow">${FINAL ? 'Final narration script · as recorded' : `Script draft ${DRAFT} · for review · no narration credits spent`}</div>
<h1>The Epistemic Theater</h1>
<p class="lede">Narration script, storyboard notes, lexicon, sources, and fact-check table. The running theme is predation and its impacts, anchored on Wilmers et al. (2025).</p>
<div class="meta">
  <div><b>14 + prologue</b><span>chapters</span></div>
  <div><b>${content.length}</b><span>scenes, plus ${Th.scenes.length - content.length} chapter cards</span></div>
  <div><b>${Th.termIndex.length}</b><span>numbered lexicon terms</span></div>
  <div><b>${totalChars.toLocaleString('en-US')}</b><span>narration characters (≈ credits)</span></div>
  <div><b>≈ ${Math.round(Th.duration * CAL / 60)} min</b><span>running time, calibrated on film 1</span></div>
</div>
<section class="front">
${FINAL ? `<h2>About this script</h2>
<p>This is the narration as recorded with the ElevenLabs voice “Megan” (Multilingual v2). The producer’s decisions after draft 1 are reflected here:</p>
<ul>
<li><b>Length</b> trimmed to about 50 minutes of narration.</li>
<li><b>Two research traditions</b>, postpositivism and interpretivism, are followed through the film. The Indigenous knowledge systems material in draft 1 was set aside for now, to be developed later with Indigenous scholars.</li>
<li><b>Chapter XIII</b> now applies the demarcation criteria to the two traditions with astrology as a contrast, and its case file is the Kaibab story, revisited. The Nez Perce case was removed.</li>
<li><b>No producer disclosure</b> in the narration.</li>
<li><b>Three corrections to the anchor review.</b> Painter et al. (2015) used both random sampling and the five-tallest method, and their principal range-wide inference rested largely on the random samples; the review implies the tallest stems alone. Gilbert et al. (2017) projected 155 human deaths averted over 30 years, not annually. The encounter-rate finding attributed to Middleton et al. (2013) comes from their <i>Ecology Letters</i> paper, which the film cites.</li>
</ul>` : `<h2>How to review</h2>
<ul>
<li><b>Narration</b> is the column that will be voiced. Edit it freely: in the DOCX with tracked changes, or as comments on the PDF. Wording is free to change until the voice is recorded.</li>
<li><b>Spoken as</b> lines show respellings used only for pronunciation. Captions use the narration text.</li>
<li><b>On screen</b> notes are provisional storyboard intentions for the animatic; comment on them only if a visual idea seems wrong.</li>
<li><b>Source</b> is shown on screen in small type as each beat plays. Full references are at the end, and every sourced beat appears in the fact-check table with its status.</li>
<li>The register chip on each scene (Observe, Infer, Claim) drives the corner badge in the film.</li>
</ul>
<h2>Open items for you</h2>
<ol class="items">
<li><b>Length.</b> ${totalChars.toLocaleString('en-US')} characters is about ${Math.round(Th.duration * CAL / 60)} minutes, against the plan’s 45–50. Easy cuts of about 5,000 characters (to roughly 50 minutes) are: fold “Four questions” into “Knowledge and justification” (II); drop the realism coda (I, “True, or merely useful?”, beat 4); drop the BACI and Hill beat (VIII); drop “Remedies and other standards” except its lens beat (XI); and shorten the matrix walkthrough (XIII). I would rather cut than speed up the voice.</li>
<li><b>Disclosure.</b> Chapter XII says in narration that the anchor review’s co-author is the film’s producer. Keep it there (it makes the point about objectivity concrete), move it to the end credits only, or drop it?</li>
<li><b>Nez Perce case (XIII).</b> The Tribe’s role in monitoring Idaho wolves after 1995 needs confirmation from Tribal and Fish and Wildlife Service sources, and ideally the Tribe’s review of the wording. If that isn’t practical, I can replace it with a general co-management example.</li>
<li><b>Gilbert et al. (2017).</b> The review says puma recovery “could prevent 155 human fatalities … annually”; I believe the original is a 30-year projection. The narration currently gives no time unit.</li>
<li><b>A citation note on the review.</b> The review credits the finding that wolf encounters were too rare to disrupt elk foraging to Middleton et al. (2013) and lists their <i>Ecology</i> paper, but the finding comes from their <i>Ecology Letters</i> paper (“Linking anti-predator behaviour to prey demography…”), which the film cites.</li>
<li><b>Indigenous review.</b> As planned, Chapters II and XIII, plus the lens beats in VI, X, XI, and XII, should go to Indigenous colleagues before the voice is recorded.</li>
<li><b>Pronunciations to confirm:</b> Gettier, Caughley (“Cawley”), Cajete (“Kah-heh-tay”), Tewa (“Tay-wah”), Mi’kmaw (“Meeg-maw”), Tengö, El-Hani, Pigliucci, Hoyningen-Huene, Messier, Beschta, Ioannidis, Dilthey, <i>Verstehen</i>, <i>Erklären</i>, <i>Wissenschaft</i>, Reichenbach, Duhem, Lakatos, Feyerabend, Comte, Ayer, Soulé, Daubert, Cobern, Corsiglia. <i>Etuaptmumk</i> appears on screen only.</li>
<li><b>Illustrative numbers</b> (the camera-trap base rates in X, and the flat-prior 94% reading of the mesocarnivore interval) are labelled as illustrative on screen.</li>
</ol>
`}
<h2>Contents</h2>
<div class="tablewrap"><table><thead><tr><th>#</th><th>Chapter</th><th>Case file</th><th>Scenes</th><th>Chars</th><th>≈ Time</th></tr></thead><tbody>${toc}</tbody></table></div>
</section>
${body}
<section><h2>Fact-check table</h2>
<p class="note">Every beat that carries an on-screen source is listed here with its status. Predation facts were checked against the text of Wilmers et al. (2025); philosophy attributions are standard but each paraphrase should be read against its source before the voice is recorded. Beats without a source state general background, such as Neptune and Vulcan or Simpson’s paradox.</p>
<div class="tablewrap"><table class="fact"><thead><tr><th>Beat</th><th>Claim (narration)</th><th>Source</th><th>Status</th></tr></thead><tbody>${fact}</tbody></table></div></section>
<section><h2>References</h2>${refsHtml}</section>
<footer>Script draft ${DRAFT} for <i>The Epistemic Theater</i>, the second film in the series that began with <i>The Ecological Theater</i> (https://taaltree.github.io/ecological-theater/). Generated from the chapter source files; no narration credits spent.</footer>
</main></body></html>`;

const htmlPath = path.join(DIR, BASE + '.html'); fs.writeFileSync(htmlPath, html);
console.log('wrote', htmlPath, unknownCites.size ? 'UNKNOWN CITES: ' + [...unknownCites].join(' | ') : '(all cites resolved)');
if (!process.argv.includes('--no-pdf')) {
  const c = await launch();
  try {
    const p = await c.open('file://' + htmlPath);
    await p.evaluate('Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 8000))]).then(() => true)');
    const { data } = await p.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: `<div style="font:8px Helvetica,Arial,sans-serif;color:#8a8ea0;width:100%;text-align:center;">The Epistemic Theater · ${FINAL ? 'Final script' : 'Script draft ' + DRAFT} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
    fs.writeFileSync(path.join(DIR, BASE + '.pdf'), Buffer.from(data, 'base64'));
  } finally { c.close(); }
  try { execFileSync('soffice', ['--headless', '--convert-to', 'docx:MS Word 2007 XML', '--outdir', DIR, htmlPath], { stdio: 'ignore', timeout: 180000 }); } catch (e) { console.log('docx conversion failed:', e.message); }
  console.log('wrote', BASE + '.pdf', fs.existsSync(path.join(DIR, BASE + '.docx')) ? 'and .docx' : '(no docx)');
}
