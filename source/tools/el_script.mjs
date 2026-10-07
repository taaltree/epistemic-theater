// Build per-scene ElevenLabs narration texts from the chapter beats.
// Writes BUILD/el/requests.json: [{ scene, text, chars, hash, sentences: [{beat, text}] }].
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadTheater, BUILD } from './load.mjs';

// Respellings live in each beat's speech text (beat.s) and serve both voices; only symbols are read out here.
const REVERSE = [];
const FORWARD = [
  [/–/g, '-'], [/—/g, ', '], [/−/g, 'minus '], [/Type II\b/g, 'Type two'], [/Type I\b/g, 'Type one'],
];
export function elText(s) {
  let x = s;
  for (const [a, b] of REVERSE) x = x.split(a).join(b);
  for (const [re, rep] of FORWARD) x = x.replace(re, rep);
  return x.replace(/\s+/g, ' ').trim();
}

export function buildRequests() {
  const Th = loadTheater({ withTiming: false });
  return Th.scenes.map((sc) => {
    const groups = Th.sentencesOf(sc);
    const sentences = groups.flatMap((g, beat) => g.map((s) => ({ beat, text: elText(s.say) })));
    // Beats separated by a paragraph break (a longer natural pause); sentences by spaces.
    const text = groups.map((g, beat) => sentences.filter((s) => s.beat === beat).map((s) => s.text).join(' ')).join('\n\n');
    const hash = crypto.createHash('sha1').update('el|' + text).digest('hex').slice(0, 12);
    return { scene: sc.id, text, chars: text.length, hash, sentences };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const req = buildRequests(); const dir = path.join(BUILD, 'el'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'requests.json'), JSON.stringify(req, null, 1));
  const total = req.reduce((a, r) => a + r.chars, 0);
  console.log(`${req.length} scenes · ${req.reduce((a, r) => a + r.sentences.length, 0)} sentences · ${total} characters · longest scene ${Math.max(...req.map((r) => r.chars))} chars`);
}
