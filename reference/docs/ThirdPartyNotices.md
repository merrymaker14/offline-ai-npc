# Third-party notices — Offline AI NPC

Every third-party component the plugin touches: the dependencies you install, the external
processes it drives, and the model and voice files it downloads or lets you point it at.
Nothing third-party is bundled in the package itself — `Assets/OfflineAINPC/` contains only
the plugin's own code, documentation and these notices. Missing notices are a documented
Asset Store rejection reason, so this file is kept current with every dependency change.

**"Verified" column:** the date the licence text was read at the source linked in the row.
Where a dated copy is archived next to this file, the row says so.

---

## Dependencies you install (never bundled)

Bundling either would give anyone who already has them duplicate-assembly compile errors,
so the plugin declares them and compiles the code that touches them only when they are
present (`versionDefines` on the package ids).

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| LLM for Unity (LLMUnity) | UndreamAI | Apache-2.0 | https://github.com/undreamai/LLMUnity | The language model host. `OfflineAINPC.LLMUnity` and the HelloNpc sample compile only when `ai.undream.llm` is installed. | 2026-08 (`LICENSE.md`, v3.0.3) |
| LlamaLib | UndreamAI | Apache-2.0 | https://github.com/undreamai/LlamaLib | Native llama.cpp build shipped inside LLM for Unity. Not redistributed by this plugin. | 2026-09-12 (upstream `LICENSE`) |
| llama.cpp | The ggml authors | MIT | https://github.com/ggml-org/llama.cpp | Inference engine underneath LlamaLib. | 2026-09-12 (upstream `LICENSE`) |
| whisper.unity | Macoron | MIT | https://github.com/Macoron/whisper.unity | Speech recognition bindings. Optional; typed input works without it. | 2026-08 (`package.json`, v1.4.0) |
| whisper.cpp | The ggml authors | MIT | https://github.com/ggml-org/whisper.cpp | Native recogniser underneath whisper.unity. | 2026-09-12 (upstream `LICENSE`) |

The plugin has **no** package dependency of its own beyond the Unity engine: it reads its
own JSON (`Core/Serialization`) and does not require Newtonsoft.Json. LLM for Unity declares
Newtonsoft for itself.

## External processes the plugin drives (not redistributed)

Separate executables you install. The plugin starts, talks to, and shuts them down; it does
not ship their binaries, and the export excludes anything that looks like one.

> **The espeak-ng row decides whether a *game* built with this can ship Piper.** What
> "external process" has to mean in practice and what a buyer owes if they redistribute Piper
> are in [`ESPEAK_BOUNDARY.md`](ESPEAK_BOUNDARY.md). The package itself contains none of it.

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| Piper | Michael Hansen (rhasspy) | MIT | https://github.com/rhasspy/piper | External process, one `piper.exe` per voice, driven over stdin JSON. | 2026-09-12 (upstream `LICENSE.md`) |
| piper-phonemize | Michael Hansen (rhasspy) | MIT | https://github.com/rhasspy/piper-phonemize | Ships with Piper; text to phonemes. | 2026-09-12 (upstream `LICENSE.md`) |
| **espeak-ng** | Reece Dunn and contributors | **GPL-3.0** | https://github.com/espeak-ng/espeak-ng | Used *by piper-phonemize* inside the Piper process. **Copyleft — a hard constraint:** it stays an external process you install, never a bundled or linked component of the package. | 2026-08 (`GPL-3.0.txt` archived here, espeak-ng 1.52.0) |
| ONNX Runtime | Microsoft | MIT | https://github.com/microsoft/onnxruntime | Ships with Piper; runs the voice models. | 2026-09-12 (upstream `LICENSE`) |
| VOICEVOX ENGINE | Hiroshiba Kazuyuki and contributors | LGPL-3.0, with a separate commercial licence offered upstream | https://github.com/VOICEVOX/voicevox_engine | Not shipped and not integrated. Named in the documentation as the usual Japanese engine a project connects through `ITTSEngine`; you install and manage it. | 2026-09-12 (upstream `LICENSE`) |
| VOICEVOX character voices | per-character rights holders | per-character terms | https://voicevox.hiroshiba.jp/term/ | If you connect VOICEVOX: each character's terms bind the END USER. Surface them in your credits; the plugin does not absorb them. | terms page read 2026-08 |

## Model weights (downloaded by the Model Manager or supplied by you, not shipped)

Dated copies of each licence and model card are in `model-cards-2026-08-16/` (the 8B copies
were added 2026-09-12), taken from the repositories the weights are pulled from. A
quantisation repository can carry terms of its own on top of the base model, so the copy is
of the repository that serves the file — here all three are Qwen's own, all Apache-2.0.

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| Qwen3-1.7B (GGUF, Q8_0) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-1.7B-GGUF | The Light tier's model in the default catalog. | 2026-08-16 (archived) |
| Qwen3-4B (GGUF, Q4_K_M) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-4B-GGUF | The Standard tier's model; the one the documented figures were measured on. | 2026-08-16 (archived) |
| Qwen3-8B (GGUF, Q4_K_M) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-8B-GGUF | The Premium tier's model. | 2026-09-12 (archived) |
| Whisper ggml models (`tiny.en`, `base.en`, `base`, `small`) | OpenAI; ggml conversions by the ggml authors | MIT | https://huggingface.co/ggerganov/whisper.cpp | Speech-recognition weights the presets point at. Downloaded on request, never bundled. | 2026-09-12 (repository `LICENSE`) |

## Voice models (downloaded by the Presets window or supplied by you, not shipped)

Piper voices are licensed **per dataset**, and the training line on the card matters as
much as the licence line. The full reading, with the near-misses, is
[`VOICE_LICENCES.md`](VOICE_LICENCES.md); dated copies of the cards are in
`voice-cards-2026-07-30/`.

| Voice | Speakers | Dataset licence | Training | Where it is used | Attribution owed |
|---|---|---|---|---|---|
| `en_US-ljspeech-medium` | 1 | public domain (LJ Speech) | trained from scratch | the English default in the presets and in `PiperEngine` | none |
| `en_US-ljspeech-high` | 1 | public domain (LJ Speech) | trained from scratch | the English Premium preset and the secondary English voice | none |
| `en_US-libritts-high` | 904 | CC BY 4.0 (LibriTTS) | trained from scratch | documented opt-in for projects wanting many distinct voices | **yes** — credit LibriTTS / the CC BY notice in your game |

Every other language's voice slot in the shipped presets is **empty**, with the reason in
the preset itself: no voice with a traceable commercial provenance was found for it. Voices
you add are yours to clear; `VOICE_LICENCES.md` shows the test to apply.

---

## What the package export contains

`Tools ▸ Offline AI NPC ▸ Export .unitypackage…` takes everything under `Assets/OfflineAINPC/`
except `Tests/` and the packaging tools. A test in the source repository fails if an engine
binary, an `espeak-ng-data/` folder, or a `.onnx` / `.gguf` file ever appears under the
package folder, so none of the components above can travel by accident.
