# The espeak boundary

Offline AI NPC ships under a proprietary Asset Store licence. One of the things it talks
to — the Piper speech engine — links **espeak-ng, which is GPL-3.0**. This document says
exactly where the line is, why the package survives on the correct side of it, and what
changes the moment somebody moves a file.

It is written for the one audience that has obligations here: **a buyer shipping a game**.
Read section 3 before you ship; sections 1 and 2 are why the package itself is clean.

---

## 1. What is actually GPL, and what is not

| Component | Licence | Where it runs |
|---|---|---|
| `piper.exe` | MIT (Piper itself) | Separate OS process |
| `piper_phonemize.dll` | MIT | Loaded by `piper.exe` |
| **`espeak-ng.dll`** | **GPL-3.0** | Loaded by `piper_phonemize` inside `piper.exe` |
| `espeak-ng-data/` | GPL-3.0 (data files of the above) | Read by `espeak-ng.dll` |
| `onnxruntime.dll` | MIT | Loaded by `piper.exe` |
| Voice models (`*.onnx`) | **per dataset** — not uniformly permissive | Read by `piper.exe` |
| Offline AI NPC (`Assets/OfflineAINPC/`) | proprietary | Your Unity process |

The GPL applies to espeak-ng and to anything that forms a single work with it. Piper's own
MIT licence does not launder that: a binary distribution of `piper.exe` carries espeak-ng's
terms with it.

## 2. Why the plugin is not a derivative work

Three facts, and all three have to stay true:

1. **Separate process.** The plugin starts `piper.exe` as a child process and speaks to it
   over stdin/stdout as JSON. It does not link, `dllimport`, or load any espeak-ng or Piper
   code into the Unity process.
2. **Not distributed by the package.** Nothing under `Assets/OfflineAINPC/` is, contains, or
   downloads a copy of Piper, espeak-ng, or their data. The user installs the engine
   themselves and tells the plugin where it is.
3. **Independent function.** The plugin works with no Piper at all — another engine, a
   buyer's own, or silence. Piper is one of several things it can be pointed at, not a component
   it is built out of.

Arms-length process separation with data passed over a pipe is the standard reading of the
GPL's boundary, and it is the same shape as an editor invoking `gcc`. What breaks it is
distribution: shipping the binary alongside your proprietary package, or fetching it into
the package's own folder, makes it part of what you distribute.

**A test in the source repository enforces fact 2.** It fails if an engine binary,
an `espeak-ng-data/` directory, or a `.onnx` / `.gguf` payload ever appears under
`Assets/OfflineAINPC/`. It also fails if the boundary stops being documented — this file is
part of the contract, not commentary on it.

## 3. If you are shipping a game with this plugin

You may:

- Ship your game with Piper installed alongside it, **including `espeak-ng.dll`**, provided
  you meet GPL-3.0 for that component (see below). This is the normal case and it is fine.
- Keep your own game code proprietary. Your game is not a derivative of espeak-ng by
  launching a process any more than it is a derivative of the OS.

To distribute `espeak-ng.dll` (or the whole Piper folder) inside your build, GPL-3.0 asks
for three things:

1. **Licence text.** Ship a copy of GPL-3.0 with your game and say which component it
   covers. A `THIRD_PARTY_LICENSES` folder in the build directory is enough.
2. **Written offer of source, or the source itself.** espeak-ng's corresponding source must
   be available to anyone who received the binary — in practice, a URL to the exact upstream
   release you shipped, kept alive for the period the licence requires. Pinning a release
   tag matters: "latest master" is not corresponding source.
3. **No further restrictions.** Your EULA must not forbid what the GPL permits for that
   component (reverse engineering it, replacing it, redistributing it).

You do **not** have to open your game. The obligation attaches to espeak-ng and to anything
combined with it into one work — `piper.exe`, which is a separate program you are also
merely redistributing.

The escape hatch, if any of that is unacceptable: **do not ship Piper.** Point the plugin at
another engine, at a system TTS, or at your own, and let players who want Piper install it
themselves. Nothing in the plugin requires it.

### Voice models are a separate question

`*.onnx` voice files carry their own dataset licences, and they are *not* uniformly
permissive — some forbid commercial use. GPL compliance for espeak-ng says nothing about
them. Check each voice individually; [`VOICE_LICENCES.md`](VOICE_LICENCES.md) records what
was verified per voice, and how.

## 4. Chinese, and why it is not here

Piper's Chinese voices phonemise through `pinyin`, not espeak. That was measured, not
assumed: the same bytes through an espeak-typed voice and a pinyin-typed voice produce
different `phoneme_type` handling. It does not change anything above — the
espeak-ng binary is still inside the Piper distribution regardless of which voice you load,
so shipping Piper ships espeak-ng even for a Chinese-only game.

## 5. When to re-read this

- Before any change that puts a file under `Assets/OfflineAINPC/`
- Before adding an "install Piper for me" button anywhere in the editor tooling — a
  downloader is fine, a downloader whose destination is inside the package is not
- Before Asset Store submission, alongside `LICENSES/THIRD_PARTY_NOTICES.md`
- If Piper ever replaces espeak-ng with a permissively licensed phonemiser, at which point
  most of this document becomes history rather than constraint
