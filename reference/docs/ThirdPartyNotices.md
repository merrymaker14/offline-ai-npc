# Third-party notices — Offline AI NPC

This is a scoped inventory, not a licence grant or clearance of an entire native/model
stack. The plugin export contains its own code, configuration and documentation, plus text
compatibility sources with their original licences and modification notices. External
packages, model weights, Piper and espeak data are installed separately. The exact Windows x64 CPU Qwen native DLL is included as described below.
An actual game distribution can include components that the Asset Store package excludes.

The dated source revisions and the model files' expected checksums are in
[`STACK_SOURCE_INVENTORY_2026-10-02.md`](STACK_SOURCE_INVENTORY_2026-10-02.md).
An observed source tag, expected weight hash and installed binary hash are different pins.
Retain the notices of the exact artifacts you redistribute.

## Bundled compatibility source text

`Editor/Dependencies/CompatibilityData/ai.undream.llm/` retains the LLMUnity 3.0.3
Apache-2.0 licence, original third-party notices, source revision, exact before/after
hashes and modified source text. `Editor/Dependencies/CompatibilityData/com.whisper.unity/`
retains the whisper.unity 529a MIT copyright/permission notice, source revision, exact
before/after hashes and two modified managed source files. Payloads are data files;
they do not compile a second SDK when this plugin is imported. Both directories include
modification notices. These compatibility-source changes include no model files or SDK native binaries. The separately described Qwen DLL delivery is included in the package.
The optional compatibility window applies them only after Preview and an explicit Apply.

## External Unity dependencies

| Component | Source licence | Evidence and distribution boundary |
|---|---|---|
| LLM for Unity v3.0.3, UndreamAI | Apache-2.0 | [Source](https://github.com/undreamai/LLMUnity/tree/9931a9ea46906b1f43adaf9498c05ccf227b5d0b). External dependency; its Editor setup can download LlamaLib v2.0.5. |
| LlamaLib v2.0.5, UndreamAI | Apache-2.0 | [Source](https://github.com/undreamai/LlamaLib/tree/21d3b9dcd1c05ad13f94f198e59462960019a057). Native distribution includes patched llama.cpp and other libraries. |
| llama.cpp, ggml authors | MIT | LlamaLib pins 872646b30c342c5fa98efec002f94fdb4f1f1ea5 and applies patches; that source pin is not proof of every installed build. |
| FeatureDetector | CC0-1.0 | LlamaLib submodule 077393260d5e0e19938582a33b9dd0e74baa8ff2. |
| USearch C# bindings and six native artifacts | Apache-2.0 source text | Included by LLMUnity, outside this plugin. Local bytes match its v3.0.3 tree; the revision of the original NuGet/native build is not stated by the package. Retain its actual copyright/NOTICE material. |
| whisper.unity v1.4.0, Macoron | MIT | [Integrator](https://github.com/Macoron/whisper.unity/tree/529a628a915a97799e89e061af9cb7c71407124d). Optional recognition bindings and native libraries; typed input works without it. |
| whisper.cpp and its ggml libraries | MIT source | The integrator workflow defaults to v1.7.5 but permits a different build ref, so the integrator's native libraries do not name their exact source revision. |
| Newtonsoft.Json / Unity package 3.2.2 | MIT notices | LLMUnity's dependency. The plugin uses its own JSON reader and does not itself require Newtonsoft.Json. |

OpenSSL, cpp-httplib, nlohmann/json, OpenMP/compiler runtimes and backend libraries belong
in the inventory of the native build you ship. Source licences do not identify the versions
or notices of every installed runtime. A LlamaLib installation can contain NVIDIA
CUDA/cuBLAS and Vulkan loader DLLs; the NVIDIA EULA and each runtime's own redistribution
conditions apply to them.

## Included Qwen native speech library

`Plugins/Windows/x86_64/OfflineAINPCQwenNative.dll` is the ordinary empty-URL Qwen route.
Its [delivery manifest](../Plugins/Windows/x86_64/native-build-manifest.json) identifies
5366978 bytes, SHA256 `4de29ccecbb2962452c2c9f2a1a4dbcc49f1c56e50f5aad74cb25a1739d0d9f3`,
qwentts.cpp `6fae92914045cd83364d2845ceaa0f7969727319` and ggml
`40e16e4a814f7fe851a0c486fb9e8c722e957830`. This is Windows x64 CPU, eight threads,
static ggml, flash attention off and max batch one. It loads and speaks in the Unity Editor
and in a built Windows player; no Linux/macOS binary is included.

qwentts.cpp and ggml are MIT. The static MinGW-w64 runtime has its own notices,
including winpthreads; GCC runtime code is GPLv3 with Runtime Library Exception 3.1.
Preserve all five exact files in `Plugins/Windows/x86_64/Notices/`: `qwentts-LICENSE.txt`,
`ggml-LICENSE.txt`, `MinGW-w64-runtime.txt`, `GPL-3.0.txt` and `GCC-RUNTIME-EXCEPTION.txt`.
The exception applies under its stated Eligible Compilation Process / Independent Module
conditions; it is not a blanket MIT label or the Piper/eSpeak GPL distribution boundary.
The talker and codec are separate Apache-2.0 weight downloads, not bytes in this DLL.

## External speech engines

| Component | Source licence | Current scope |
|---|---|---|
| qwentts.cpp, omnivoice.cpp authors | MIT | [Original source pin](https://github.com/ServeurpersoCom/qwentts.cpp/tree/71ad93d591a2811f35db77e27c02acba091c9e9b), ggml 77cdef82aad64f141164fac02076e36d5848474c; cpp-httplib and yyjson are MIT. A server executable you install yourself is a separate build with its own source and notices. |
| Archived Piper, Michael Hansen | MIT source | [2023.11.14-2](https://github.com/rhasspy/piper/tree/38917ffd8c0e219c6581d73e07b30ef1d572fce1). Supported separate process; preserve working user configurations. The newer OHF GPL project is a different distribution. |
| Archived piper-phonemize | MIT source | Piper's phonemizer. The archived master snapshot does not identify the build inside a 2023 Piper release. |
| espeak-ng fork and dictionaries | GPL-3.0 source/data terms | Linked within Piper. Exact fork, generated dictionary inputs/build and Corresponding Source must match the distributed artifacts. See [boundary](ESPEAK_BOUNDARY.md). |
| ONNX Runtime | MIT + third-party notices | Existing Piper DLL resource metadata is consistent with a 1.14-era build; this does not replace a complete binary/source match or its ThirdPartyNotices. |
| fmt / spdlog | MIT | Archived Piper CMake requests fmt 10.0.0 and spdlog 1.12.0. Verify actual build inputs. |
| libtashkeel_model.ort | UNKNOWN weight/data provenance | Phonemizer distribution includes this Arabic preprocessing model. Code MIT does not establish its weight/data licence. |
| VOICEVOX ENGINE / character voices | Software and per-character terms | Documentation-only extension example; not shipped, integrated or cleared as a profile here. Review the exact software edition and each voice's terms. |

Built-in presets use Qwen3-TTS CustomVoice. Preserve existing Piper selections and
review the exact licence boundary of any engine or voice you add.

## Model and voice files

| Files | Declared terms and provenance boundary |
|---|---|
| Qwen3-1.7B Q8_0; Qwen3-4B / 8B Q4_K_M GGUF | Qwen repositories advertise Apache-2.0; full archived licence texts exist. |
| Qwen3-TTS 0.6B / 1.7B CustomVoice talkers and 12Hz tokenizer GGUF | Official base/codec and Serveurperso conversion repositories advertise Apache-2.0. Preserve the notices of both. |
| Whisper tiny.en, base.en, base, small ggml | MIT original models and separate conversion provenance. Their expected checksums are in the preset catalog and in the dated inventory. |
| Piper ljspeech medium/high | Card records public-domain LJ Speech and training from scratch. It does not waive engine/model distribution notices. |
| Piper libritts-high, 904 speakers | Card records CC BY 4.0 LibriTTS train-clean-360 and training from scratch. Preserve applicable dataset/model attribution. |
| Piper dmitri, sharvard and other lessac fine-tunes | Dataset label and fine-tune base are separate. The plugin recommends no profile built on a base its publisher restricts; existing user configurations are kept. |
| NonCommercial voices and voices of unknown terms | Not recommended and not supported by the plugin. |

Weights are never bundled in this plugin. Model Manager downloads require an explicit
user action; LLMUnity's Editor library bootstrap is a separate dependency action. The
catalog's repository URLs may resolve a mutable `main`; configured SHA256 pins expected
bytes where present, not the repository's complete licensing or training history.

## Before you redistribute

Before redistributing a chosen stack, record exact binary and model hashes, source/build
revisions and patches, licence/copyright/NOTICE copies, and dictionary and preprocessing
data. GPL-covered components additionally need a compliant Corresponding Source distribution
method.

Of native code this package contains only the named Qwen DLL; it contains no model weights
and no espeak data. Keep the DLL's five notices with it in your game's distribution.
