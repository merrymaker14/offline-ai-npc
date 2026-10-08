# Using the current local models

Choose a catalog text model in the first-dialogue setup. Download missing files in [Model Manager](GettingStarted.md). Start with a typed reply, then add Qwen speech or a Whisper microphone.

| Route | Current boundary |
|---|---|
| Qwen3-TTS | Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no separately started HTTP server, Python environment, speech executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md). |
| Qwen text GGUF | LLMUnity 3.0.3 declares LlamaLib v2.0.5. Its published source pins llama.cpp b8209. Current Qwen3 text models use this integration; an unrelated llama-cli command is a different launch profile. |
| Piper (archived rhasspy release) | Unity's `PiperEngine` drives the archived rhasspy Piper — release `2023.11.14-2` (Piper 1.2.0), `piper_windows_amd64.zip` on Windows — through its JSON-lines input. Preserve an existing working executable, voice/config pair and binding. |
| OHF Piper 1.8.0 | **Does not work with `PiperEngine`.** The newer OHF-Voice Piper reads plain text lines and has no JSON-lines input, so do not install it in place of the release above. |
| Whisper (whisper.unity) | `com.whisper.unity` resolves to Git `529a628a915a97799e89e061af9cb7c71407124d`, package 1.4.0, and the plugin is built against it. Do not swap its native library for a newer whisper.cpp build on its own; update whisper.unity as a whole. |

The runtime mapping is supported by [LlamaLib v2.0.5 source](https://github.com/undreamai/LlamaLib/tree/21d3b9dcd1c05ad13f94f198e59462960019a057)
and the [whisper.unity source](https://github.com/Macoron/whisper.unity/tree/529a628a915a97799e89e061af9cb7c71407124d).
Declared source versions do not establish the build provenance of every local binary.

### Defaults and your existing project

New speech presets use the same 0.6B CustomVoice Q4 talker and Q8 codec at every LLM tier. Leave **External server URL** empty to use the bundled Qwen CPU DLL. Larger talkers and external HTTP/GPU setups are advanced alternatives to check on your target hardware. All built-in Qwen TTS presets use `serena`, so switching the dialogue language keeps the same speaker.

The default non-thinking reply profile allows up to 128 generated tokens and carries a one-sentence limit. The limit does not require a 128-token reply. The token ceiling is written to every agent of the LLM when the model starts. The sentence limit is applied by the code that delivers a reply: a **Hello NPC Character** applies it when its **Reply Limits** is **Reply Profile** or **Current Language**, and as shipped speaks every sentence within the token ceiling. Custom presets remain yours. Sampling values typed on an `LLMAgent` take effect in Play only with **Override agent sampling** turned off on the LLM host; it is on by default.

Whisper supplies the optional microphone path in 1.1. Use a multilingual Whisper model when dialogue switches between languages. VoiceDesign is not part of this version.

**Windows x64 CPU is the bundled Qwen target.** The required CPU instructions are listed in the speech setup. macOS/Linux native libraries are not included. Mobile, web and consoles are not supported by this package. Linux and macOS are not verified.

## Qwen: template, response budget and memory

Keep role messages in the integration's chat path and use the selected model's chat
template. Qwen3's official template has a thinking switch. LLMUnity exposes `LLM.reasoning`;
the current host disables it when applying its sampling profile. The pinned LlamaLib
service forwards that setting to `chat_params.enable_thinking`. Check the actual prompt
and output when changing the model or backend. A textual `/no_think` instruction and
discarding visible reasoning after generation are different operations. The official
non-thinking reference is temperature 0.7, top-p 0.8, top-k 20 and min-p 0.
[Qwen3 model guidance](https://huggingface.co/Qwen/Qwen3-4B),
[pinned service implementation](https://github.com/undreamai/LlamaLib/blob/21d3b9dcd1c05ad13f94f198e59462960019a057/src/LLM_service.cpp#L262).

`LLMClient.numPredict` is forwarded as `n_predict`: it limits newly generated tokens.
The plugin's base `QwenNonThinking` profile allows 128 tokens and carries a one-sentence
limit. Assign `Tiers.Sampling` before the model starts to replace it, or turn **Override
agent sampling** off on the LLM host to keep the values typed on each agent; a tier does
not change it. A token limit can truncate speech or an action block. `MaxSentences`
filters the delivered text where the delivering code applies it — Hello NPC's **Reply
Limits**, or `LimitSentences` in your own code; it does not reduce the native token
budget. Keep enough room for the final action structure and any permitted repair.

`LLM.contextSize` is the context budget, configured before model startup. Account for
the template, system prompt, replayed memory, retained chat history, per-turn perception
and generated output together. On the tier route — Hello NPC's — the host sets it from the
chosen model's entry: 4096 tokens for the built-in Light and Standard models, 16384 for
Premium, and 8192 for a Model Manifest entry that names none. An `LLM` component started
without that route keeps its own field, which defaults to 8192. Qwen3's published
long-context and long-output examples are model/framework guidance, not the NPC sample's
settings or a RAM/VRAM guarantee. Increasing context also increases the working set.
Enable extended-context settings only in a separately verified runtime profile. [Qwen context guidance](https://qwen.readthedocs.io/en/latest/run_locally/llama.cpp.html).

Prompt caching can reuse an unchanged prefix while the corresponding context remains
available. `cachePrompt` is configurable. Keep stable persona text stable and put changing
perception in the user turn. Changed system text, a new context or history management
can require additional prompt processing; measure latency with your model and backend.
A documented warmup is an actual model operation; record its settings and do not add its
throwaway output to game memory.

`NPCMemory` is local transcript storage, not model training or unlimited recall. Install
an `IKeyValueStore` before use; without one it records and replays nothing. The window
holds 40 entries per character. `lastN` selects up to `2 * lastN` trailing lines, with
an available summary prepended. `LLMAgent` history and its optional `save` file are
separate. Choose how replay and history combine so the same dialogue is not counted
twice. Changed replay text consumes context and can change the reusable prefix.
See [Dialogue](Dialogue.md).

The action grammar limits structure and registered values. Parser, dispatch and handler
checks still decide whether an action is valid in the current world. Act on the accepted
completed reply once; streaming prefixes and truncated or cancelled blocks are not
completed actions. See [Actions](Actions.md).

## Piper: match the protocol and the voice

`PiperEngine` starts one process per voice with `--json-input`, writes UTF-8 JSON lines
without a BOM, each with the `text` and an output WAV path, and waits for that file to
appear. Its speaker selector chooses a voice file; it is not a promise that a nonzero
native `speaker_id` works in that executable. Keep the `.onnx` and matching `.onnx.json`
together, and use the voice's output sample rate. A language catalogue entry alone does
not add a trained voice.
[Archived protocol](https://github.com/rhasspy/piper/blob/38917ffd8c0e219c6581d73e07b30ef1d572fce1/README.md#json-input).

OHF Piper 1.8.0 is a different program: it reads ordinary text lines and writes the WAV
named with `-f`. Given the old `--json-input` flag, it can speak the unknown arguments as
text. So `PiperEngine` cannot drive it; keep the archived release.
[OHF CLI source](https://github.com/OHF-Voice/piper1-gpl/blob/v1.8.0/src/piper/__main__.py),
[CLI guide](https://github.com/OHF-Voice/piper1-gpl/blob/v1.8.0/docs/CLI.md).

Runtime code, native dependencies, eSpeak/data and individual voices have separate
provenance and licence records. Archived Piper source is MIT; OHF 1.8.0 is GPL-3.0-or-later.
Several Piper voices were fine-tuned from the lessac voice, whose dataset terms restrict
commercial use — their model cards say so; [VOICE_LICENCES](../LICENSES/VOICE_LICENCES.md)
lists them. Process separation and a public-domain dataset statement do not establish
clearance for the whole distribution.
[OHF licence](https://github.com/OHF-Voice/piper1-gpl/blob/v1.8.0/COPYING).

## Whisper: audio, language and completion

Pass decoded PCM floats with the actual sample rate and channel count, rather than WAV
bytes or unscaled PCM16 integers. whisper.unity averages interleaved channels and
resamples to 16000 Hz mono using linear interpolation; it does not normalize amplitude
or validate every malformed buffer. Supply finite normalized samples, normally in
[-1, 1]; PCM16 conversion divides by 32768. Specify valid positive rates/channels and
complete interleaved frames. [Official audio loader](https://github.com/openai/whisper/blob/main/whisper/audio.py#L26).

`Language` identifies the speech language; `auto`/empty requests detection. With
`Translate=false`, use transcription in that language. `Translate=true` requests English
translation using a suitable multilingual model. Setting another language is not arbitrary
target-language translation. `.en` models are English-only, and changing a UI language
does not expand the selected model's language coverage.
[Official task guidance](https://github.com/openai/whisper#command-line-usage).

Segment times refer to positions in the input audio. whisper.unity converts native
10-ms units to `TimeSpan`. Token times require both token output and timestamp
settings and remain experimental estimates. Progress callbacks report processing
progress, not audio playback time or transcript accuracy.

whisper.unity's streaming repeatedly transcribes overlapping windows and updates
provisional text; it is not token-by-token recognition. `StopStream()` waits for current
work, processes the remaining audio and raises `OnStreamFinished`. Its public API does not
expose cancellation or deterministic disposal. Cancelling a caller, hiding a
subtitle or hitting a timeout does not prove native work stopped. Let the owned work
settle before releasing its context or changing the runtime.

Do not drop a whisper.cpp 1.9.x native library into whisper.unity 1.4.0. Its structures
changed, so the old C# bindings would read them wrongly even though everything compiles
and the exported names match. Update whisper.unity as a whole, then check the loaded
library, the model file and a real recognition again. Recognition latency and quality
depend on that combination and the input; measure it with your model and recordings.

Push To Talk with Whisper Speech Recognition (see
[Getting started](GettingStarted.md#6-speech-recognition)) records one press, recognizes it
whole with `GetTextAsync` and drops the result of a press that a newer one replaced; it
does not stream.
