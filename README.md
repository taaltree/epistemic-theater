# The Epistemic Theater

An animated, narrated guide to the philosophy of science for graduate students in ecology and wildlife science, told through the ecology of predation (48:59, 134 numbered lexicon terms).

**Watch:** https://taaltree.github.io/epistemic-theater/
**Download the video:** [Releases](https://github.com/taaltree/epistemic-theater/releases/latest)
**Study guide:** [HTML](https://taaltree.github.io/epistemic-theater/The_Epistemic_Theater_Study_Guide.html) · [PDF](https://taaltree.github.io/epistemic-theater/The_Epistemic_Theater_Study_Guide.pdf)
**Series:** Part 2. Part 1 is [The Ecological Theater](https://taaltree.github.io/ecological-theater/), a review of core ecological theory.

| | Chapter | Starts | Scenes |
|---|---|---|---|
| I | [Aims of Science](https://taaltree.github.io/epistemic-theater/#ch1) | 1:37 | Case file: the Northern Range elk · What is an explanation? · True, or merely useful? · Observe, infer, claim |
| II | [Knowing Nature](https://taaltree.github.io/epistemic-theater/#ch2) | 5:37 | Knowledge and justification · Four questions · Positivism and postpositivism · Interpretivism · One herd, two lenses |
| III | [Inference](https://taaltree.github.io/epistemic-theater/#ch3) | 9:55 | Case file: the Kaibab deer · Three kinds of inference · Strong inference |
| IV | [Falsification](https://taaltree.github.io/epistemic-theater/#ch4) | 12:44 | Popper’s asymmetry · Case file: does fear lower pregnancy? · Duhem, Quine, and the protective belt |
| V | [Paradigms](https://taaltree.github.io/epistemic-theater/#ch5) | 15:45 | Normal science and revolution · Case file: from vermin to keystone · Choosing between theories |
| VI | [Observation](https://taaltree.github.io/epistemic-theater/#ch6) | 18:27 | Seeing as · Case file: the five tallest stems · Instruments and definitions · Laden, not determined |
| VII | [Models](https://taaltree.github.io/epistemic-theater/#ch7) | 21:48 | The map and the territory · Case file: the three-box cascade · Models that act |
| VIII | [Causality](https://taaltree.github.io/epistemic-theater/#ch8) | 24:25 | Association is not explanation · Would that elk have died anyway? · Drawing the causes · Designs that break the symmetry |
| IX | [Underdetermination](https://taaltree.github.io/epistemic-theater/#ch9) | 28:55 | One body of evidence, many theories · Case file: one decline, many causes · Breaking the tie |
| X | [Bayesian Evidence](https://taaltree.github.io/epistemic-theater/#ch10) | 31:49 | Degrees of belief · The strength of evidence · Case file: updating on the cascade · Priors and their critics |
| XI | [Replication](https://taaltree.github.io/epistemic-theater/#ch11) | 35:15 | Four ways to hold up · The replication crisis · Case file: thirty kilometers apart · Remedies and other standards |
| XII | [Values](https://taaltree.github.io/epistemic-theater/#ch12) | 38:47 | The argument from inductive risk · Case file: whose costs? · Whose baseline? · Objectivity as a social achievement |
| XIII | [Demarcation](https://taaltree.github.io/epistemic-theater/#ch13) | 42:18 | Why the line matters · A century of criteria · The answer depends on the criterion · Case file: the Kaibab story, revisited |
| XIV | [Synthesis](https://taaltree.github.io/epistemic-theater/#ch14) | 46:05 | Auditing a famous claim · Seven questions for any claim · Exam rehearsal |

## What is here

- `index.html`: the interactive player (chapters, captions, playback speed, searchable lexicon). Keyboard: space to play, ←/→ to skip 5 s, [ and ] to change chapter, c for captions.
- `soundtrack.m4a`: narration (synthesized voice) mixed with a generated ambient score.
- `The_Epistemic_Theater_Study_Guide.*`: equations, landmark studies, lexicon with timestamps, exam prompts, references.
- `The_Epistemic_Theater_captions.*`: WebVTT and SRT captions.
- `source/`: the deterministic canvas engine, chapter scripts, and build tools.

## Rebuilding

Requires Node 22+, ffmpeg, and Google Chrome. Narration comes from ElevenLabs (one take per scene); a free fallback uses macOS `say`.

```bash
cd source
node tools/el_script.mjs        # per-scene narration texts → build/el/requests.json; synthesize each, save as build/el/<scene>.mp3
node tools/build_audio_el.mjs   # align sentences, lay out timing, narration track + captions
# (fallback) node tools/build_audio.mjs --voice Samantha --rate 165
node tools/build_music.mjs                               # score mixed under narration
node tools/stills.mjs <scene-id>                         # preview frames of any scene
node tools/render_video.mjs                              # 1080p MP4 (add --captions for burned-in captions)
node tools/assemble.mjs && node tools/build_site.mjs     # player, study guide, this site
```

Figures marked "stylized" or "illustrative" show qualitative patterns, not reproduced data.
