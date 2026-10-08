# Qwen speech: language, voice and style

In 1.1, choose a ready CustomVoice speaker. Creating your own voice from a description (VoiceDesign) is planned for the next version.

For the current Unity Qwen3-TTS component, start with a **CustomVoice** talker and
leave **Style** empty. For the overall model workflow, see
[Current model usage](CurrentModelUsage.md). These settings have separate jobs:

| Setting | What it controls | Example |
|---|---|---|
| Text | Words to say | `Hello. I am ready.` |
| Language | Language of those words | Unity code `en`; runtime label `english` |
| Voice | A named preset timbre | `ryan` |
| Style | Delivery instruction, where the model supports it | `Speak calmly, at a measured pace.` |

Describe delivery in **Style**; set the language separately. A style such as
“Speak Russian” does not replace the language setting or translate the text.

## Which model accepts which input?

| Qwen3-TTS variant | Voice input | Instructions |
|---|---|---|
| 0.6B CustomVoice | Named preset speaker | Instruction control is unsupported; leave Style empty |
| 1.7B CustomVoice | Named preset speaker | Optional delivery instruction |
| 1.7B VoiceDesign | Description of a voice | A separate VoiceDesign operation |
| 0.6B / 1.7B Base | Reference audio or a prepared clone prompt | A separate cloning operation |

The bundled native transport explicitly accepts CustomVoice; Base and VoiceDesign are not configured. The optional HTTP request shape also carries a named voice, so it does not provide a VoiceDesign or reference-audio authoring flow. See the
[official model overview](https://github.com/QwenLM/Qwen3-TTS), [official Python API](https://github.com/QwenLM/Qwen3-TTS/blob/022e286b98fbec7e1e916cb940cdf532cd9f488e/qwen_tts/inference/qwen3_tts_model.py).

## In Unity

```csharp
using OfflineAINPC.Speech;

// CustomVoice, with no style dependency:
var line = new SpeechRequest("Hello. I am ready.",
    languageCode: "en", voiceId: "ryan");

// For a separately verified 1.7B CustomVoice setup:
var styledLine = new SpeechRequest("Hello. I am ready.",
    languageCode: "en", voiceId: "ryan",
    style: "Speak calmly, at a measured pace.");
```

An explicit `SpeechRequest.LanguageCode` overrides the engine language. Native codes `en`, `ru`, `es`, `zh`, `ja`, `ko`, `de`, `fr`, `pt`, `it` accept region/script suffixes and `_`; blank or unknown codes select `auto`. This is language selection, not translation. The native DLL passes text, language, speaker and optional style directly to the pinned runtime. HTTP field omission/default behavior belongs only to an explicitly configured external server. Leave both engine Style and request Style empty for 0.6B CustomVoice. A 1.7B instruction setup requires its own model and runtime check.

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no manually started HTTP server, executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).


