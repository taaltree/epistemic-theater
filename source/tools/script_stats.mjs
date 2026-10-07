// Script statistics: narration characters (speech text, which is what ElevenLabs bills), terms, estimated duration.
import { loadTheater } from './load.mjs';
const Th = loadTheater({ withTiming: false });
const mm = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`;
let total = 0, totalCap = 0; const rows = [];
for (const ch of Th.chapters) {
  const sc = Th.scenes.filter((s) => s.chapter === ch);
  const chars = sc.reduce((a, s) => a + (s.beats || []).reduce((b, x) => b + (x.s || x.t).length, 0), 0);
  const cap = sc.reduce((a, s) => a + (s.beats || []).reduce((b, x) => b + x.t.length, 0), 0);
  const dur = sc.reduce((a, s) => a + s.dur, 0); const terms = sc.reduce((a, s) => a + (s.terms || []).filter((t) => !t.demo).length, 0);
  total += chars; totalCap += cap;
  rows.push(`${(ch.roman || '·').padEnd(5)} ${ch.title.padEnd(20)} scenes ${String(sc.filter((s) => s.kind !== 'card').length).padStart(2)}  terms ${String(terms).padStart(2)}  chars ${String(chars).padStart(6)}  est ${mm(dur)}`);
}
console.log(rows.join('\n'));
console.log(`TOTAL speech chars ${total} (caption chars ${totalCap}); terms ${Th.termIndex.length}; scenes ${Th.scenes.length}; est. duration ${mm(Th.duration)}`);
if (process.argv.includes('--long')) for (const s of Th.scenes) for (const [k, b] of (s.beats || []).entries()) if ((b.s || b.t).length > 330) console.log('long beat', s.id, k, (b.s || b.t).length);
