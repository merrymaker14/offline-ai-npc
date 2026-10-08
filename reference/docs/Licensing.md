# Licensing

Offline AI NPC's own code uses the Asset Store licence. The language model, speech models, engines and native libraries have their own licences. Keep the licence texts and required notices for the exact files you include in your game.

### The included Qwen DLL

The package delivers `Plugins/Windows/x86_64/OfflineAINPCQwenNative.dll`, identified by [its delivery manifest](../Plugins/Windows/x86_64/native-build-manifest.json). Its qwentts.cpp and ggml source is **MIT**. The static MinGW-w64 runtime includes its own copyright/licence notices, including winpthreads. The GCC runtime is **GPLv3 with GCC Runtime Library Exception 3.1**; it is not simply MIT and is distinct from Piper's eSpeak GPL distribution.

Preserve the exact five files under `Plugins/Windows/x86_64/Notices/`: `qwentts-LICENSE.txt`, `ggml-LICENSE.txt`, `MinGW-w64-runtime.txt`, `GPL-3.0.txt` and `GCC-RUNTIME-EXCEPTION.txt`. Exception 3.1 permits a qualifying Target Code combination with Independent Modules under its stated conditions; retain its full text with the GPLv3 notice. A different compiler, modified build or additional GPU library needs the terms for that exact distribution. The model weights remain a separate **Apache-2.0** download; the DLL does not bundle the talker or codec.

## Qwen text and ready voices

The catalogued Qwen3 text GGUF models and Qwen3-TTS CustomVoice talker/codec weights are published under **Apache-2.0**, which allows commercial use under its conditions. Include the full licence, copyright notices and any applicable NOTICE; document modifications when required. A Model Manager licence label does not replace those files. See [Apache-2.0 section 4](https://www.apache.org/licenses/LICENSE-2.0).

The qwentts.cpp engine and ggml CPU source use **MIT**. Preserve their copyright and licence notices. Other native dependencies keep their own terms. GPU/vendor runtime libraries require the terms for that particular build; choosing Qwen weights does not license every library in a distribution.

In 1.1, Qwen speech uses named, ready **CustomVoice** speakers. Creating a voice from a description (VoiceDesign) is planned for the next version. See [Qwen speech](QwenUsage.md) for the model-mode boundary.

## Whisper and text-model integration

Original Whisper tiny/base/small weights and whisper.unity source use **MIT**. LLMUnity's text compatibility sources use **Apache-2.0**. Preserve their licences and the third-party notices supplied with their exact native libraries. Install a compatible integration as a whole rather than mixing unrelated native builds.

## Piper and individual voices

The supported archived rhasspy Piper source uses **MIT**; its phonemizer uses **GPL-3.0 espeak-ng**. The plugin communicates with Piper through a separate process. If you distribute GPL-covered components, retain their GPL licence and notices and provide the exact Corresponding Source through a GPL-compliant distribution method. Process separation does not remove these distribution obligations.

Each Piper voice has its own model and dataset terms. Choose a voice with terms suitable for your game and keep any required attribution. A compatible voice file or an engine's MIT licence does not grant rights to every voice. The package's [voice records](../LICENSES/VOICE_LICENCES.md) identify the checked files; for GPL components see [the eSpeak boundary](../LICENSES/ESPEAK_BOUNDARY.md). These requirements do not mean that all Piper use is non-commercial.

## Files to keep with your game

Keep the applicable LICENSE, NOTICE, copyright/attribution records, modification notices and any required source offer or source distribution. Check engines, native dependencies and voices as separate components. [Third-party notices](../LICENSES/THIRD_PARTY_NOTICES.md) link the component and source records. Detailed development provenance remains in [the source inventory](../LICENSES/STACK_SOURCE_INVENTORY_2026-10-02.md).

Configured local engines process dialogue on the player's computer. Explicit downloads contact their configured hosts; a remote speech URL sends the requested text to that endpoint. The plugin has no publisher telemetry.

<a id="choosing-models-and-engines"></a>
<a id="current-configuration-and-release-choices"></a>
<a id="does-espeak-ngs-gpl-reach-the-audio-it-produces"></a>
<a id="if-you-want-many-distinct-voices"></a>
<a id="languages-qwen3-tts-does-not-speak"></a>
<a id="licensing"></a>
<a id="local-processing-and-downloads"></a>
<a id="model-weights"></a>
<a id="other-engines-and-model-families"></a>
<a id="piper-and-espeak-ng"></a>
<a id="piper-voice-models--provenance-not-just-the-licence-line"></a>
<a id="piper-voices-and-generated-audio"></a>
<a id="qwen3-language-and-speech-models"></a>
<a id="qwen3-tts-in-the-development-presets"></a>
<a id="the-distinction-in-one-pair-of-examples"></a>
<a id="the-one-that-can-bite-espeak-ng-piper-only"></a>
<a id="what-the-plugin-itself-contains"></a>
<a id="what-this-package-configures"></a>
<a id="whisper-recognition-models"></a>
