# Which languages does this support?

There is no single honest number, so this page does not print one. A language needs three
things to work — a model that speaks it, recognition that hears it, and a voice that says it
— and they do not all cover the same set.

**The short version: your characters can hold a conversation in roughly a hundred languages.
Voices are bundled for a few. For the rest, you supply a voice file, and doing that takes one
asset and no code.**

---

## Tier 1 — ready out of the box

| Language | Voice | Licence | Provenance |
|---|---|---|---|
| **English** | `en_US-ljspeech-medium` / `-high` | **public domain** | trained from scratch on LJ Speech |

English is genuinely ready: a voice, no attribution owed, nothing to clear. If you want many
distinct English voices, `en_US-libritts-high` carries 904 of them under CC BY 4.0 — see
[Licensing](Licensing.md#if-you-want-many-distinct-voices) for the attribution string and the
auditioning tool.

**Japanese** works, and **you supply the engine**. The package ships one speech engine, Piper,
and Piper has no Japanese voice with clearable provenance. The usual answer for Japanese is
VOICEVOX — a separate application with an HTTP server — and connecting it is about eighty lines
against one interface. [The complete file is printed below](#the-whole-engine-copy-this-file):
a working `ITTSEngine`, not a sketch. The samples in this package speak English through Piper;
Japanese is the case you add.

Each VOICEVOX character voice carries usage terms binding the *end user*, not you, and they are
**per character** — see [Bring your own engine](#bring-your-own-engine) for what to check.

**Spanish, Russian, Chinese and everything else are Tier 2 below** — not because the model or
the recognition fall short, but because no voice with a traceable commercial provenance was
found for them. Most published Piper voices are fine-tuned from a research-only base;
[Licensing](Licensing.md#voice-models--provenance-not-just-the-licence-line) explains the test
to apply, and it is a test you can apply yourself to any candidate.

---

## Tier 2 — works, bring your own voice

**This is the large and interesting tier, and it is where most projects will land.**

The language model handles well over a hundred languages and speech recognition covers
around a hundred. What is missing for these is only a bundled voice — and pointing the plugin
at a voice you supply is a single asset with no code.

Quality across that tail varies a great deal. Korean, German, French, Portuguese, Italian,
Chinese, Polish, Dutch and Turkish are all well covered by both model and recognition; a
language with little presence in the training data will be understood but spoken awkwardly.
Test yours before committing to it: `Tools > Offline AI NPC > Live verification` will
speak a line and run a turn in the language you are considering.

### Adding a language, start to finish

1. **Get a voice.** Piper publishes voices for around fifty languages at
   `huggingface.co/rhasspy/piper-voices`. **Download both files** — `name.onnx` and
   `name.onnx.json`. A missing `.json` produces silence with no error.
2. **Put them** in your Piper `voices/` folder.
3. **Create the language asset**: `Create ▸ Offline AI NPC ▸ Language Definition`. Fill in:

   Every field on the asset, in the order the inspector shows them. Nothing here is
   hidden and nothing is optional-but-secretly-required:

   | Field | Example | Why |
   |---|---|---|
   | **Identity** | | |
   | Code | `ko` | The identity. Keep it stable — everything keys on it |
   | Display name | `한국어` | Shown in your language picker |
   | **Speech** | | |
   | TTS engine id | `piper` | Which engine speaks this language. `piper` unless you added one |
   | TTS voice id | `ko_KR-example-medium.onnx` | The file from step 1. For VOICEVOX, a speaker number |
   | STT model id | `ggml-small.bin` | The recognition model, when it differs per language. Blank = the project default |
   | STT language code | `ko` | Handed to recognition. Usually `Code` without the region part |
   | **Prompting** | | |
   | Persona header | `한국어로만 대답하세요.` | How the persona block is introduced — *in that language* |
   | State header | `지금:` | How world state (time, weather) is introduced. Also in that language |
   | **Reply length** | | |
   | Length instruction | `한 문장으로 짧게 대답하세요.` | The rule the model reads. Leave empty and one is generated (English or Japanese only) |
   | Length unit | `Characters` | **Words are meaningless without word spacing** |
   | Length target | `30` | Characters for CJK, ~12 words otherwise |
   | **Max tokens** | `48` | The hard stop. This is what actually bounds the reply — the instruction is a request, this is a limit |
   | **Max sentences** | `1` | Where the reply is cut if the model runs past its instruction anyway |

   The last two are in bold because [Limitations](Limitations.md) and
   [Troubleshooting](Troubleshooting.md) both name them as the only thing that genuinely
   controls reply length. A prompt asking for brevity is not a limit; these two are.

   A filled-in asset — German, a language this plugin ships no voice for, which is exactly
   the case the asset exists to cover:

   ![A Language Definition asset with every field filled in](images/language-definition.png)

   The voice in that screenshot, `de_DE-thorsten-medium`, is an illustration and **not a
   recommendation**: apply the provenance test in [Licensing](Licensing.md) to any voice
   before you ship it, including that one. The plugin cannot know what game you are
   making.

4. **Add it to your Language Set** and assign that set at startup:

   ```csharp
   LanguageRuntime.Catalog = myLanguageSet.ToCatalog();
   ```

5. **Bind the voice engine** for the code in `TTSEngineManager`'s binding table. Piper serves
   any number of languages; only Japanese needs a different engine here.

That is the whole process. There is no list of approved languages in the code, and **the
plugin does not gate on this page** — if you have a good Korean voice and a model that
handles Korean, add it and it works.

### Two things that will bite you

**Write the instructions in the target language.** An instruction the model cannot read is
not an instruction. This was measured: with a Russian directive that only said "no English
words", Qwen3-4B still reached for another script in 3 replies out of 12 — `corridors`,
`thanks`, once a Chinese word for "tonight". Naming the *script* explicitly — "write only in
Cyrillic" —
took that to 0 out of 8. Say which alphabet, not just which language.

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

This restarts the speech engine with the new voice and invalidates the prompt cache, so the
next reply pays the cold cost (~2.1 s on the reference machine). Rapid changes are coalesced,
so dragging a settings dropdown does not queue five restarts. **Switch on a menu screen, not
mid-conversation.**

To ask what is configured rather than assuming:

```csharp
if (!LanguageRuntime.IsConfigured("ko"))
    // ... offer the download, or fall back
```

`IsConfigured` answers about the actual catalogue. Do not use `Find`/`FindOrDefault` for this
question: they fall back to the default language, so an unconfigured code comes back looking
supported. That exact conflation once made a verification matrix report Russian as verified
after hearing an English voice say an English sentence.

---

## Per-character voices in one language

A language's voice is the default. A character can override it — that is how two English
speakers in the same scene sound different. See [Dialogue](Dialogue.md#voices).

---

## Bring your own engine

The package ships Piper because it is offline, permissively licensed and has a voice whose
provenance clears. It is not the only engine you can use, and the seam for adding another is
deliberately small.

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
public interface ILanguageAwareEngine { void SetLanguage(string languageCode); }
```

Four members. `Synthesize` is a coroutine rather than a `Task` on purpose — engines poll, and
the queue that owns the voice runs on scaled time, so a wall-clock `Task` would keep speaking
through a pause.

`AudioData` is raw samples plus a rate; `AudioClipConversion` turns it into an `AudioClip`.
Nothing in the interface mentions Unity, so the engine itself stays testable.

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
   exists on the interface at all. Piper ignores it (one voice per process); VOICEVOX needs it.
4. **`SetLanguage`** is where a multi-language engine switches; VOICEVOX is Japanese only, so
   this example does not implement `ILanguageAwareEngine`.

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
    /// VOICEVOX as an ITTSEngine: an external HTTP server, four members, no plugin changes.
    /// Drop this component in the scene and bind it to "ja" (see Bind a voice, above).
    /// </summary>
    public class VoicevoxEngine : MonoBehaviour, ITTSEngine
    {
        [SerializeField] private string _baseUrl = "http://localhost:50021";
        [SerializeField] private float _healthCheckTimeout = 2f;
        [SerializeField] private float _healthRetryInterval = 3f;  // re-check cadence while Active + not yet ready

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
                StartHealthRetry();   // server may still be opening port 50021
            }
        }

        public Task StopAsync()
        {
            // VOICEVOX is user-managed (external process). We don't kill it on language switch.
            IsReady = false;
            if (_healthRetry != null) { StopCoroutine(_healthRetry); _healthRetry = null; }
            return Task.CompletedTask;
        }

        private void StartHealthRetry()
        {
            if (_healthRetry != null) return;
            _healthRetry = StartCoroutine(HealthRetryLoop());
        }

        // VOICEVOX.exe may still be opening port 50021 when we boot in JP. Instead of
        // muting Japanese TTS for the whole session, re-poll /version until it answers
        // (or until StopAsync stops us on a switch away). Mirrors the Piper watchdog:
        // IsReady ends up meaning the same thing in both ITTSEngine implementations.
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

            AudioClip clip = DownloadHandlerAudioClip.GetContent(synth);
            var audio = AudioClipConversion.FromClip(clip);
            if (clip != null) UnityEngine.Object.Destroy(clip);
            onAudio?.Invoke(audio);
        }
    }
}
```

`AudioClipConversion` and `AudioData` come from `OfflineAINPC.Speech`; nothing else here is
plugin-specific. Bind it to Japanese and the rest of the pipeline — queue, ducking, lip
sync, subtitles — does not know the difference.

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
