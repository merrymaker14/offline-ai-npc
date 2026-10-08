# Which languages does this support?

Choose the character's reply language, microphone recognition language and voice language together. A text-only character needs a suitable language model; microphone input and speech output are optional.

Built-in language definitions cover English, Spanish, Japanese, Russian and Simplified Chinese. Qwen3-TTS CustomVoice offers nine ready speakers across ten supported languages. Piper uses a separately chosen voice for each language. Pick the exact voice and check its terms; see [Licensing](Licensing.md).

---

<a id="tier-1--ready-out-of-the-box"></a>
In 1.1, choose a ready CustomVoice speaker. Creating your own voice from a description (VoiceDesign) is not part of this version.

## Tier 1 — ten languages from one installed engine

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no manually started HTTP server, executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).


| Language | Speaker (default) | Configured by the plugin |
|---|---|---|
| **English** | `serena` | yes |
| **Japanese** | `serena` | yes |
| **Spanish** | `serena` | yes |
| **Russian** | `serena` | yes |
| **Chinese (Simplified)** | `serena` | yes |
| French, German, Italian, Portuguese, Korean | `serena`, or another ready speaker | add a Language Definition — the voice already works |

All nine preset speakers can speak the model's supported languages. The table below
gives their native language as listed in the model card:

| Speaker | Voice | Native language (model card) |
|---|---|---|
| `serena` | warm, gentle young female | Chinese |
| `vivian` | bright young female | Chinese |
| `ono_anna` | playful female | Japanese |
| `sohee` | warm female | Korean |
| `ryan` | dynamic male with rhythm | English |
| `aiden` | sunny American male | English |
| `uncle_fu` | seasoned male, mellow timbre | Chinese |
| `dylan` | youthful male, Beijing dialect | Chinese (Beijing) |
| `eric` | lively male, Chengdu dialect | Chinese (Sichuan) |

Four female voices and five male. The upstream model card recommends each speaker's native
language for best quality. Pick per character with *TTS voice id* on the language
definition, per character in code through `SpeechRequest`, per legacy speaker id
with the engine's *Speaker voices* table — or name none. All built-in Qwen language definitions and presets use `serena`; the engine also falls back to `serena` for every supported language. Voice precedence is request → *Speaker voices* row → engine *Default voice* → language definition → fallback. Set *Default voice* to `serena` and keep any request or speaker-row overrides consistent if a character should keep that voice when changing languages. Existing saved catalogs and explicit character choices are preserved on upgrade; changing the built-in defaults does not reset them. A *Style* on the engine, or `SpeechRequest.Style`,
is sent as a delivery instruction ("whispering", "cheerful, quick") and honoured by the
instruct-capable model variants — officially the separately configured 1.7B CustomVoice talker;
the Qwen team lists no instruction control for the 0.6B.

The bundled native route sends language per request to its pinned qwentts.cpp implementation. A region/script suffix is accepted; blank or unknown native codes select `auto`. An explicitly configured HTTP server may instead omit an unknown code and retain its own default. Check that server separately.

**Piper is still supported**, as the second engine — the package includes its driver, and
Piper itself is a program you install: a project that wants its public-domain
English voice, or a Piper voice for a language Qwen3-TTS lacks, sets engine `piper` and a
voice file on its language definition. Everything Piper-specific — the paired `.onnx.json`,
espeak-ng's licence when you redistribute it — applies only then; see
[Licensing](Licensing.md).

<a id="bundled-qwen-native"></a>
### Bundled Qwen native CPU

The package includes the Windows x64 CPU Qwen speech library. Its target CPU must support **AVX2, BMI2, FMA, F16C and SSE4.2**. macOS and Linux libraries are not included.

1. In **Tools → Offline AI NPC → Model Manager**, download the **0.6B CustomVoice Q4 talker** and **Q8 codec** under *Voices and speech models* (about 0.9 GB together).
2. Use the scene's **Qwen3-TTS Engine** through **TTS Engine Manager** and its language binding. The sample supplies this wiring; a custom character must select that engine.
3. Leave **External server URL** and **Style** empty. Use `serena` in **Default voice** to keep the same voice across languages. A character's `SpeechRequest` or **Speaker voices** entry can override it. Set the language separately; choosing a voice does not translate the text.
4. In Play, type a short prompt and check the reply's subtitle and speech in the chosen language. Repeat this check in your built Windows player with the model files available.

The default route loads the DLL in Unity and streams PCM to the existing speech session. It does not start `tts-server.exe`. The native profile is CPU-only with eight threads. **StopAsync** waits for native generation and worker settlement before releasing the context. Cancellation requests cooperative cancellation; it is not an instant-stop guarantee.

A separately launched server and **External server URL** / `AttachTo(url)` are [optional advanced alternatives](#external-qwen-server). Keep that server's own model, backend, version and distribution requirements separate.

Voice precedence stays: request → Speaker voices entry → Default voice → language definition → built-in fallback. The model reports nine ready speakers; names are checked without case sensitivity. Streaming retains the existing lead buffer and playback rules. Same-engine language changes do not load another Qwen context; requests use the selected language and speaker.

The bundled native route allows only one initialized context per process and serializes synthesis
requests; see [Concurrency](Limitations.md#concurrency).

<a id="external-qwen-server"></a>
<a id="building-tts-server"></a>
<a id="windows-cuda-build-composition"></a>
### Optional advanced: a server you own

The bundled DLL is the normal Qwen route. Use **External server URL** or `AttachTo(url)` only when deliberately connecting a separately launched compatible HTTP server, for example an independently checked GPU setup. A nonempty URL keeps the HTTP transport; the component does not own or stop that server. A remote URL sends dialogue off the player's machine. Preserve a working local configuration unless you intend to change that boundary.

The pinned source reference is qwentts.cpp `6fae92914045cd83364d2845ceaa0f7969727319`. Build and distribute your chosen server separately under its exact licences. The bundled DLL remains CPU-only and Windows x64; an external server has its own platform and GPU requirements.

---

## Tier 2 — works, bring your own voice

A language outside the ten Qwen3-TTS languages needs another voice engine or a licensed Piper voice. Check that your chosen language model and multilingual Whisper model support the language; their wider language lists do not guarantee useful accuracy in your game. Configure its prompt, recognition code and voice in a Language Definition, then add that definition to your Language Set.

Test representative questions and replies in Play and in your target Player. `Tools ▸ Offline AI NPC ▸ Live verification` can run a whole turn; supply a test line when there is no built-in one. A voice check is marked verified only after you confirm what you heard.

The plugin's built-in catalog configures five languages. [The Interview](InterviewDemo.md) configures all ten listed above, including its interface and case text. A model's language capability and a game's translated UI are separate requirements.

### Adding a language, start to finish

1. **Get a voice.** If Qwen3-TTS speaks the language (see Tier 1), you already have one:
   pick a speaker name. Otherwise Piper publishes voices for around fifty languages at
   `huggingface.co/rhasspy/piper-voices` — **download both files**, `name.onnx` and
   `name.onnx.json`. The current Piper driver refuses an absent or invalid paired config
   and names the problem; setup checks flag it before you try a reply.
2. **Put a Piper voice** in `StreamingAssets/piper/voices/`. A Qwen3-TTS speaker needs no file.
3. **Create the language asset**: `Create ▸ Offline AI NPC ▸ Language Definition`. Fill in:

   Every field on the asset, in the order the inspector shows them. Nothing here is
   hidden and nothing is optional-but-secretly-required:

   | Field | Example | Why |
   |---|---|---|
   | **Identity** | | |
   | Code | `ko` | The identity. Keep it stable — everything keys on it |
   | Display name | `한국어` | Shown in your language picker |
   | **Speech** | | |
   | TTS engine id | `qwen3-tts` | Which engine speaks this language: `qwen3-tts`, `piper`, or the id of your own |
   | TTS voice id | `serena` | A Qwen3-TTS speaker name; for Piper, the file from step 1; for your own engine, whatever it understands |
   | STT model id | `ggml-small.bin` | Metadata for recognizers that use this field. Built-in Whisper chooses Model File Name or the current preset at startup |
   | STT language code | `ko` | Handed to recognition. Usually `Code` without the region part |
   | **Prompting** | | |
   | Persona header | `한국어로만 대답하세요.` | How the persona block is introduced — *in that language* |
   | State header | `지금:` | Header of the character's internal-state block ("Right now"). Also in that language |
   | Nearby header | `주변:` | Header of the nearby-objects block |
   | Target hint | `대상은 위 목록의 id 중 하나입니다.` | The sentence that says an action's target is one of those ids |
   | **Reply length** | | |
   | Length instruction | `한 문장으로 짧게 대답하세요.` | The rule the model reads, written in that language. Leave it empty and the language directive carries no length sentence |
   | Length unit | `Characters` | **Words are meaningless without word spacing** |
   | Length target | `30` | Characters for CJK, ~12 words otherwise |
   | **Max tokens** | `48` | The hard stop. This is what actually bounds the reply — the instruction is a request, this is a limit |
   | **Max sentences** | `1` | Where the reply is cut if the model runs past its instruction anyway |

   The last two are in bold because [Limitations](Limitations.md) and
   [Troubleshooting](Troubleshooting.md) both name them as the only thing that genuinely
   controls reply length. A prompt asking for brevity is not a limit; these two are.

   They are data until dialogue code applies them. On a **Hello NPC Character**, set
   **Reply Limits** to **Current Language**: this language's **Max tokens** becomes the
   token ceiling of each reply, and its **Max sentences** ends what is spoken, shown and
   remembered. Your own dialogue code does the same in a few lines:

   ```csharp
   var spec = LanguageRuntime.Current;
   var profile = spec.LengthRule.ApplyTo(Tiers.Sampling);
   host.ApplySampling(profile);                            // Max tokens reaches the model
   reply = profile.LimitSentences(reply);                  // Max sentences ends the reply
   systemPrompt += "\n\n" + LanguageDirective.For(spec);   // persona header + length instruction
   ```

   The persona header and the length instruction reach the model only through that last
   line. Hello NPC speaks the language of its own system prompt and does not add them.

   A filled-in asset using a separately supplied German Piper voice. Qwen3-TTS also
   supports German; this screenshot illustrates choosing another engine and voice:

   ![A Language Definition asset with every field filled in](images/language-definition.png)

   The voice in that screenshot, `de_DE-thorsten-medium`, is an illustration and **not a
   recommendation**: apply the provenance test in [Licensing](Licensing.md) to any voice
   before you ship it, including that one. The plugin cannot know what game you are
   making.

4. **Add it to your Language Set** and assign that set at startup:

   ```csharp
   LanguageRuntime.Catalog = myLanguageSet.ToCatalog();
   ```

5. **Nothing to bind.** The TTS manager routes the code to the engine its definition names
   (`INamedTtsEngine`); a row in the binding table is needed only to override that.

That is the whole process. There is no list of approved languages in the code, and **the
plugin does not gate on this page** — if you have a good Korean voice and a model that
handles Korean, add it and it works.

The definition also carries the prompt's connecting words for that language — the header
of the state block, the header of the nearby-objects list, the sentence that says an action
target is one of those ids. Leave them empty for the five shipped codes; fill them for a new
language, or the model reads English fragments inside a Korean prompt.

### Two things that will bite you

**Write the instructions in the target language.** If a specific script is required,
name it explicitly and check the model's replies.

**Count characters, not words, for CJK.** "Twelve words or fewer" cannot be evaluated in a
language without spaces between words. The length unit exists for this.

---

## Tier 3 — not viable

Languages outside what the model or recognition can do: very low-resource languages, most
constructed languages, historical languages, and anything with no meaningful presence in
training data. The model will produce something; it will not be good, and no configuration
fixes that.

If a language matters to your game and you are unsure which tier it is in, test it before
committing. Twenty minutes with the verification window is cheaper than finding out after
release.

---

## Switching at runtime

```csharp
LanguageRuntime.SetCurrent("ko");
```

The TTS engine follows the runtime by default. Whisper receives the selected recognition
language but keeps its loaded model; use a multilingual model when players can switch languages. A
project that keeps the current language somewhere of its own wraps it in an `ILanguageSource`
and assigns `TTSEngineManager.LanguageSource` instead; `LanguageRuntime.TrySetCurrent`
refuses a code the catalog does not configure, where `SetCurrent` accepts it and warns once.

Changing language can require additional prompt processing. See
[Limitations](Limitations.md#switching-language-mid-session) for switching behavior.
In the DLL route, Qwen3-TTS switches in place — one native context serves every supported language; Piper
stops and restarts with the new voice file. Rapid changes are coalesced, so dragging a
settings dropdown does not queue five restarts. If a language has no usable engine,
`TTSEngineManager.Active` becomes null and the previous engine stops; the manager does
not keep speaking with the previous language's voice. Fix the binding and select the
language again to recover. **Switch on a menu screen, not
mid-conversation.**

To ask what is configured rather than assuming:

```csharp
if (!LanguageRuntime.IsConfigured("ko"))
    // ... offer the download, or fall back
```

`IsConfigured` checks the configured catalog. `LanguageCatalog.Find` returns null
when no matching language is configured. `FindOrDefault` falls back to the default
language, so do not use it to check whether a language is configured.

---

## Per-character voices in one language

A language's voice is the default. A character can override it — that is how two English
speakers in the same scene sound different. See [Dialogue](Dialogue.md#voices).

---

## Bring your own engine

The package supports two engines — Qwen3-TTS, which the built-in definitions select, and
Piper — and neither is the only one you can use. The seam for adding another is deliberately small.

### The contract

```csharp
public interface ITTSEngine
{
    bool IsReady { get; }
    Task StartAsync();
    Task StopAsync();
    IEnumerator Synthesize(string text, int speakerId, Action<AudioData> onAudio);
}

// Optional, when one engine serves several languages:
public interface ILanguageAwareEngine
{
    void SetLanguage(string languageCode);
    bool RestartOnLanguageChange => true;   // false: told the language, keeps running
}

// Optional, when the engine can hand audio back in pieces:
public interface IStreamingTTSEngine : ITTSEngine
{
    IEnumerator Synthesize(SpeechRequest request, Action<AudioChunk> onChunk, CancellationToken cancellation);
}
```

Four members for the simplest engine. `Synthesize` is a coroutine rather than a `Task` on
purpose: the session drives it frame by frame, can abandon it on a deadline, and it pauses
with the game loop, where a wall-clock `Task` would run on and hand audio back from another
thread. The rules every implementation is held to — `onAudio` at most once and never on
failure, `StartAsync` never throws, `StopAsync` safe twice — are in the interface's own
documentation, and the plugin's session, latency runner and verification window all rely on
them.

`AudioData` is raw samples plus a rate; `AudioClipConversion` turns it into an `AudioClip`.
Nothing in the interface mentions Unity, so the engine itself stays testable.

### A streaming engine

An engine that produces audio faster than it plays but not all at once — a neural
synthesiser answering over HTTP with PCM as it is generated — implements
`IStreamingTTSEngine` as well. The session then starts the speaker on the **first chunk**,
while the rest of the sentence is still being produced; that is where the time to first
audio goes down. Everything in the plugin calls `SpeechSynthesis.Run`, which uses the
streaming overload when an engine has it and wraps the one-buffer contract into a single
final chunk when it does not, so both kinds of engine are complete on their own.

What travels with a request, all optional except the text:

| `SpeechRequest` | Meaning |
|---|---|
| `Text` | the unit to say, already sanitised |
| `LanguageCode` | the language it is in — filled from the language runtime when the caller did not say |
| `VoiceId` | the voice as the engine names it: the language definition's *TTS voice id*, a speaker name, a preset. Piper takes a voice file name here |
| `Style` | a delivery hint for engines that accept one; ignored otherwise |
| `SpeakerId` | the integer selector of the original contract, still honoured |

The rules for chunks: in order, one sample rate and channel count per request, the last one
marked `IsLast`; on failure log once and finish, do not invent a chunk; honour the
`CancellationToken` at the next opportunity, because `Cancel()` on the session is a player
who wants silence now; and stay ahead of real time — a chunk that arrives after the play
head has passed its position is heard as a gap. A unit longer than the session's
`MaxUnitSeconds` (30 s) is cut, and a unit that takes longer than its
`UnitSynthesisTimeoutSeconds` (60 s) is abandoned, subtitle-only.

An engine that serves every language from one running process returns `false` from
`RestartOnLanguageChange`. The manager then calls `SetLanguage` on a language change and
nothing else: no stop, no start, no loading overlay. Piper keeps the default, because a
Piper process is one voice.

Give the engine an id. `INamedTtsEngine` is one property — `EngineId => "voicevox"` — and
it is what the language definition's *TTS engine id* refers to: a language whose definition
names an engine reaches it **without a row in the TTS manager's binding table**. Piper's id
is `piper`, which is why a new Piper-voiced language needs its definition and no binding row.
A row, when present, still wins.

Two more things the plugin does for you here. A crash watchdog that must not resurrect a
process while another engine is speaking implements `IActiveAwareEngine` and is handed the
question "am I active?" by the manager. And `StreamingSpeechSession` takes a `SpeechRequest`
as its voice template — `new SpeechRequest("", speakerId, languageCode, voiceId, style)` —
so a character's language, voice and style ride with every unit.

### The worked example: VOICEVOX

VOICEVOX is the awkward shape on purpose — an **external application**, started outside Unity,
answering over HTTP, with its own idea of when it is ready. If the seam survives that, it
survives a DLL or a cloud call.

What the implementation does, before the code itself:

1. **`StartAsync`** does not start VOICEVOX; the player does. It polls `/version` until the
   server answers, then flips `IsReady`. A health-retry loop rather than a single probe,
   because the server takes several seconds to boot and a one-shot check would declare it
   absent forever.
2. **`Synthesize`** is two calls: `POST /audio_query` for the prosody object, then
   `POST /synthesis` for the WAV. It yields between them, so the frame is never blocked.
3. **`speakerId`** maps straight onto VOICEVOX's speaker numbers — which is why the parameter
   exists on the interface at all. Piper uses it only to choose between its default and its
   secondary English voice (one process per voice file); VOICEVOX needs it on every request.
4. **`SetLanguage`** is where a multi-language engine switches; VOICEVOX is Japanese only, so
   this example does not implement `ILanguageAwareEngine`.
5. **`EngineId`** names it `voicevox` (`INamedTtsEngine`), so the Japanese definition's *TTS
   engine id* reaches it without a row in the TTS manager's binding table.

The one thing worth copying verbatim is the readiness handling. An engine that reports ready
before it is produces silence with no error, which is the hardest speech failure to diagnose.

### The whole engine, copy this file

```csharp
using System;
using System.Collections;
using System.Threading.Tasks;
using OfflineAINPC.Speech;
using UnityEngine;
using UnityEngine.Networking;

namespace YourGame.Speech
{
    /// <summary>
    /// VOICEVOX as an ITTSEngine: an external HTTP server, no plugin changes.
    /// Drop this component in the scene, add it to the TTS Engine Manager's Engines, and set
    /// the Japanese language definition's TTS engine id to "voicevox" — the EngineId below.
    /// </summary>
    public class VoicevoxEngine : MonoBehaviour, ITTSEngine, INamedTtsEngine
    {
        [SerializeField] private string _baseUrl = "http://localhost:50021";
        [SerializeField] private float _healthCheckTimeout = 2f;
        [SerializeField] private float _healthRetryInterval = 3f;  // re-check cadence while not yet ready

        public string EngineId => "voicevox";
        public bool IsReady { get; private set; }

        private Coroutine _healthRetry;

        public async Task StartAsync()
        {
            using var req = UnityWebRequest.Get($"{_baseUrl}/version");
            req.timeout = (int)_healthCheckTimeout;
            var op = req.SendWebRequest();
            while (!op.isDone) await Task.Yield();
            IsReady = req.result == UnityWebRequest.Result.Success;
            if (IsReady)
            {
                string version = req.downloadHandler.text.Replace("\"", "");
                Debug.Log($"[VoicevoxEngine] Ready (version: {version})");
            }
            else
            {
                Debug.LogWarning($"[VoicevoxEngine] VOICEVOX server not reachable at {_baseUrl}: {req.error} — retrying");
                StartHealthRetry();   // the server may still be opening its port
            }
        }

        public Task StopAsync()
        {
            // VOICEVOX is the player's own process: stopping the engine does not close it.
            IsReady = false;
            if (_healthRetry != null) { StopCoroutine(_healthRetry); _healthRetry = null; }
            return Task.CompletedTask;
        }

        private void StartHealthRetry()
        {
            if (_healthRetry != null) return;
            _healthRetry = StartCoroutine(HealthRetryLoop());
        }

        // VOICEVOX may still be opening port 50021 when the game starts. Rather than mute the
        // language for the whole session, poll /version until it answers, or until StopAsync
        // stops the loop on a switch away.
        private IEnumerator HealthRetryLoop()
        {
            while (!IsReady)
            {
                yield return new WaitForSeconds(_healthRetryInterval);
                using var req = UnityWebRequest.Get($"{_baseUrl}/version");
                req.timeout = (int)_healthCheckTimeout;
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    IsReady = true;
                    Debug.Log($"[VoicevoxEngine] Ready after retry (version: {req.downloadHandler.text.Replace("\"", "")})");
                }
            }
            _healthRetry = null;
        }

        public IEnumerator Synthesize(string text, int speakerId, Action<AudioData> onAudio)
        {
            string queryUrl = $"{_baseUrl}/audio_query?text={UnityWebRequest.EscapeURL(text)}&speaker={speakerId}";
            using var query = UnityWebRequest.PostWwwForm(queryUrl, "");
            yield return query.SendWebRequest();

            if (query.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[VoicevoxEngine] query failed: {query.error}");
                yield break;
            }

            string synthUrl = $"{_baseUrl}/synthesis?speaker={speakerId}";
            byte[] body = System.Text.Encoding.UTF8.GetBytes(query.downloadHandler.text);
            using var synth = new UnityWebRequest(synthUrl, "POST");
            synth.uploadHandler = new UploadHandlerRaw(body);
            synth.downloadHandler = new DownloadHandlerAudioClip(synthUrl, AudioType.WAV);
            synth.SetRequestHeader("Content-Type", "application/json");
            yield return synth.SendWebRequest();

            if (synth.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[VoicevoxEngine] synth failed: {synth.error}");
                yield break;
            }

            // The contract: onAudio at most once, and never on failure.
            AudioClip clip = DownloadHandlerAudioClip.GetContent(synth);
            if (clip == null)
            {
                Debug.LogError("[VoicevoxEngine] the WAV could not be decoded");
                yield break;
            }
            var audio = AudioClipConversion.FromClip(clip);
            UnityEngine.Object.Destroy(clip);
            onAudio?.Invoke(audio);
        }
    }
}
```

`ITTSEngine`, `INamedTtsEngine`, `AudioClipConversion` and `AudioData` come from
`OfflineAINPC.Speech`; nothing else here is plugin-specific. Point the Japanese definition at
it and the rest of the pipeline — the speech queue and the subtitles — does not know the
difference.

### Licensing: apply the test, do not take a list

**This page will not tell you which VOICEVOX voices are safe for your game, and you should
distrust any page that does.** Terms are per character, live on the rights holders' own pages,
change, and several restrict the *kind of content* rather than only commercial use. The plugin
cannot know what game you are making.

What travels between projects is the test, and by now you have seen two shapes of it:

| Engine | Where the answer lives | What caught people out |
|---|---|---|
| Piper | the **Training line** of the model card | `libritts` and `libritts_r` are one letter apart, same corpus, opposite conclusion |
| VOICEVOX | the **character's own terms page** | attribution is mandatory and names the character; some characters require an application for commercial or corporate use; some restrict content |

Both are the same question asked twice: *what is this made of, and who could object?* See
[Licensing](Licensing.md) for the long form.

<a id="installing-the-speech-engine"></a>
