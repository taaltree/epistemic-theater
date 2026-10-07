// Save word timestamps from transcription run-status JSON files to BUILD/el/words/<scene>.json.
// Usage: node tools/el_words.mjs <status.json> [...]   (sessions mapped via BUILD/el/trans_sessions.tsv)
import fs from 'node:fs';
import path from 'node:path';
import { BUILD } from './load.mjs';
const DIR = path.join(BUILD, 'el'), OUTD = path.join(DIR, 'words'); fs.mkdirSync(OUTD, { recursive: true });
const bySession = Object.fromEntries(fs.readFileSync(path.join(DIR, 'trans_sessions.tsv'), 'utf8').trim().split('\n').map((l) => l.split('\t').reverse()));
for (const f of process.argv.slice(2)) {
  const st = JSON.parse(fs.readFileSync(f, 'utf8'));
  const sessOf = Object.fromEntries(st.generations.map((g) => [g.id, (g.content_url || '').match(/content_generation\/([^/]+)\//)?.[1]]));
  for (const t of st.transcripts || []) {
    const scene = bySession[sessOf[t.generation_id]]; if (!scene) { console.log('unmapped', t.generation_id); continue; }
    fs.writeFileSync(path.join(OUTD, `${scene}.json`), JSON.stringify(t.words.filter((w) => w.type === 'word').map((w) => [w.text, w.start, w.end])));
  }
}
console.log(fs.readdirSync(OUTD).length, 'word files');
