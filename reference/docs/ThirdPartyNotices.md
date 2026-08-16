# Third-party notices — Offline AI NPC

Every third-party component the plugin touches, whether it is bundled with the package,
required as a dependency the customer installs, or downloaded at runtime. Missing
third-party licences is a documented Asset Store rejection reason, so this file is
maintained from stage 0 and updated by every stage that adds a dependency.

**Status legend for "Verified"**
`yes` — licence text read from the shipped copy or the package manifest in this repo.
`TODO` — the licence is publicly stated but has not yet been read and archived here.
Everything marked TODO must be resolved before submission.

---

## Runtime dependencies the customer installs (never bundled)

Bundling either of these causes duplicate-assembly compile errors for anyone who
already has them, so the plugin declares them as dependencies and guards every
integration point with a version define (see `Core/DependencyGuard.cs`).

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| LLM for Unity (LLMUnity) | UndreamAI | Apache-2.0 | https://github.com/undreamai/LLMUnity | Dependency. C# bindings the host uses to run the local LLM. Guarded by `LLMUNITY_PRESENT`. | yes (`Assets/LLMUnity/LICENSE.md`, v3.0.3) |
| LlamaLib | UndreamAI | MIT | https://github.com/undreamai/LlamaLib | Native binaries shipped inside LLMUnity (llama.cpp server build). Not redistributed by this plugin. | TODO |
| llama.cpp | Georgi Gerganov and contributors | MIT | https://github.com/ggerganov/llama.cpp | Inference engine underneath LlamaLib. | TODO |
| whisper.unity | Macoron | MIT | https://github.com/Macoron/whisper.unity | Dependency. Unity bindings for speech-to-text. Guarded by `WHISPER_PRESENT`. | yes (package.json, v1.4.0) |
| whisper.cpp | Georgi Gerganov and contributors | MIT | https://github.com/ggerganov/whisper.cpp | Native STT engine underneath whisper.unity. | TODO |
| Newtonsoft Json for Unity | Unity Technologies / James Newton-King | MIT | `com.unity.nuget.newtonsoft-json` | Dependency (UPM). Serialises conversation memory. | TODO |

## External processes the plugin drives (not redistributed)

These are separate executables the user installs. The plugin starts, talks to, and
shuts them down; it does not ship their binaries.

> **The espeak-ng row below is the one that decides whether this package can ship at all.**
> What "external process" has to mean in practice, what a buyer owes if they redistribute
> Piper, and what this demo project itself owes, are all in
> [`docs/ESPEAK_BOUNDARY.md`](../../../docs/ESPEAK_BOUNDARY.md). `PackagingBoundaryTests`
> fails the build if any of it lands under `Assets/OfflineAINPC/`.

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| Piper | Michael Hansen (rhasspy) | MIT | https://github.com/rhasspy/piper | External process. One `piper.exe` per voice model, driven over stdin JSON. | TODO |
| piper-phonemize | Michael Hansen (rhasspy) | MIT | https://github.com/rhasspy/piper-phonemize | Ships with Piper; converts text to phonemes. | TODO |
| **espeak-ng** | Reece Dunn and contributors | **GPL-3.0** | https://github.com/espeak-ng/espeak-ng | Used *by piper-phonemize* inside the Piper process. **Copyleft — treat as a hard constraint:** it must stay an external process the user installs, never a bundled or linked component of the package. The *package* ships none of it; the *interview demo build* does, and discharges GPL-3.0 as set out below. | yes (`GPL-3.0.txt`, version 1.52.0) |
| ONNX Runtime | Microsoft | MIT | https://github.com/microsoft/onnxruntime | Ships with Piper; runs the voice models. | TODO |
| VOICEVOX ENGINE | Hiroshiba Kazuyuki and contributors | LGPL-3.0 (engine) | https://github.com/VOICEVOX/voicevox_engine | External HTTP server the plugin queries for Japanese TTS. User-installed and user-managed. | TODO |
| VOICEVOX character voices | per-character rights holders | per-character terms | https://voicevox.hiroshiba.jp/term/ | Generated audio only; each character has its own credit/usage terms the END USER accepts. The plugin must surface, not absorb, those terms. | TODO |

## GPL-3.0 compliance for the interview demo build

The package ships no speech engine. The **interview demo**, distributed as a player, does:
`piper.exe`, `piper_phonemize.dll` and `espeak-ng.dll` all sit in its `StreamingAssets`.
espeak-ng is GPL-3.0, so that build — not the package — carries the obligations.

| What GPL-3.0 asks | Where it is met |
|---|---|
| A copy of the licence, naming what it covers | `GPL-3.0.txt`, staged into the build's `StreamingAssets/LICENSES` beside this file |
| Corresponding source for the exact binary shipped | Below. A release tag, not "latest" |
| No further restrictions on that component | The demo has no EULA; nothing forbids replacing or redistributing espeak-ng |

**What is actually in the build, and where its source is:**

| Binary | Version | Source |
|---|---|---|
| `piper.exe`, `piper_phonemize.dll` | Piper 1.2.0 (release `2023.11.14-2`) | https://github.com/rhasspy/piper/releases/tag/2023.11.14-2 |
| `espeak-ng.dll`, `espeak-ng-data/` | 1.52.0, from the fork piper-phonemize builds against | https://github.com/rhasspy/espeak-ng — commit `0f65aa301e0d6bae5e172cc74197d32a6182200f` |

The binaries are redistributed **unmodified**: they are the upstream release artefacts, copied
in, never rebuilt or patched here. Anyone who receives the build may request the corresponding
source and will be pointed at the URLs above; if either upstream disappears, an archive of that
exact commit has to be hosted alongside the download instead.

Version strings were read out of the shipped binaries rather than taken from a changelog,
because the changelog describes what upstream released and this table has to describe what is
in *this* build.

## Model weights (downloaded or supplied by the user, not shipped)

Dated copies of each licence and model card the demo depends on are in
`model-cards-2026-08-16/`, taken from the repositories the weights are actually pulled from.
A quantisation repository can carry terms of its own on top of the base model, so the copy is
of the repository that serves the file rather than of the model it was made from — here both
are Qwen's own, both Apache-2.0.

| Component | Author | Licence | Source | How it is used | Verified |
|---|---|---|---|---|---|
| Qwen3-1.7B (GGUF, Q8_0) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-1.7B-GGUF | **The interview demo's default.** 1 834 426 016 bytes, fetched on first run into the player's data folder. | yes (`model-cards-2026-08-16/`) |
| Qwen3-4B (GGUF, Q4_K_M) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-4B-GGUF | The demo's opt-in upgrade, 2 497 280 256 bytes. Also what Yume no Ma itself runs. | yes (`model-cards-2026-08-16/`) |
| Qwen2.5-7B-Instruct (GGUF, Q4_K_M) | Alibaba Cloud / Qwen team | Apache-2.0 | https://huggingface.co/Qwen/Qwen2.5-7B-Instruct | Dialogue model for projects that want it. User-supplied. | TODO |
| Whisper ggml models (tiny / tiny.en / base.en / small) | OpenAI, ggml conversions by Georgi Gerganov | MIT | https://huggingface.co/ggerganov/whisper.cpp | Speech-to-text weights. User-supplied. | TODO |
| Piper voice `en_US-amy-medium` | Piper / rhasspy voice collection | per-dataset | https://huggingface.co/rhasspy/piper-voices | English voice model. User-supplied. Per-voice dataset licence must be listed individually. | TODO |
| Piper voice `en_US-hfc_female-medium` | Piper / rhasspy voice collection | per-dataset | https://huggingface.co/rhasspy/piper-voices | Second English voice. | TODO |
| Piper voice `es_ES-davefx-medium` | Piper / rhasspy voice collection | per-dataset | https://huggingface.co/rhasspy/piper-voices | Spanish voice. | TODO |
| Piper voice `ru_RU-dmitri-medium` | Piper / rhasspy voice collection | dataset CC0-1.0, **provenance disputed** | https://huggingface.co/rhasspy/piper-voices | Russian voice, used by Yume no Ma. Stage 5E recorded it as cleared for commercial redistribution on the dataset line alone; `VOICE_LICENCES.md` withdrew that on the Training line — the card says it is finetuned from lessac, whose dataset forbids commercial use. Not shipped by the plugin or the demo. | see `VOICE_LICENCES.md` |
| Piper voice `zh_CN-chaowen-medium` | Piper / rhasspy voice collection | per-dataset | https://huggingface.co/rhasspy/piper-voices | Chinese voice, present on this machine for the stage-5F phonemiser experiment. Not a configured language. | TODO |

---

### Notes for the submission pass

1. Resolve every `TODO` by reading the actual licence text and archiving a copy next to
   this file (`LICENSES/<component>.txt`).
2. espeak-ng's GPL-3.0 is the one that can sink the package. Keep Piper strictly an
   external, user-installed process; do not ship, link, or auto-download it as part of
   the package payload.
3. Piper voice models are licensed per dataset (they are not uniformly permissive).
   List each voice separately, with its own licence, or ship none and have the user
   download them.
4. VOICEVOX character terms bind the end user, not the plugin. Documentation must point
   at them rather than restate them.
