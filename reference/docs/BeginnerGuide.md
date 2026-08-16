# Beginner's guide

The long way round, assuming you have never installed a Unity package with external
dependencies. It starts with an empty project and ends with a build you can hand to
somebody else. Allow an hour; most of it is downloads.

A Russian translation is kept in the project repository under `docs/ru/BeginnerGuide.md`.

---

## 0. What this is, in one paragraph

Your character talks. The language model, the speech recognition and the speech synthesis
all run **on the player's own machine** — no cloud, no API keys, no per-token bill, no
telemetry, and it works with the network cable pulled out. What you install is: a model
runner, a model file, a voice, and this plugin to hold them together.

**What you will have at the end of this page:** a scene where you type or speak a question
and a character answers you out loud, and a build of it that runs on a machine without
Unity.

---

## 1. Before you start

| | |
|---|---|
| **Unity** | 6000.5.7f1 is what this is developed and tested on. 2022.3 LTS or newer should work, but only 6000.5 is verified |
| **Render pipeline** | any — Built-in, URP, HDRP. The runtime references no rendering package |
| **Platform** | Windows, macOS or Linux **desktop**. Not mobile, not web, not console, and that is a hard limit — the model is gigabytes and the speech engines are separate processes |
| **Disk** | 10 GB free is comfortable |
| **Graphics** | runs with no GPU at all, just slower. 6 GB of VRAM fits a 4B model entirely on the card |
| **Internet** | for the downloads on this page only. Never at runtime |

If any of those are a problem, read [Is this for your game?](IsThisForYourGame.md) before
spending the hour.

---

## 2. Make a project

New project, any template. Nothing here depends on which.

Adding this to a project you already have is fine too: no step on this page edits your
Project Settings, your scenes or your existing assets.

---

## 3. Install LLM for Unity — required

This is the thing that actually runs the language model. Without it your character cannot
form a sentence.

* Package id: `ai.undream.llm`, version **3.0.3** or newer
* Free, and not bundled here — it is somebody else's package under its own licence, and
  freezing a copy inside this one would pin you to whatever version shipped that day
* Install it the way its own documentation says

**How you know it worked:** *Window ▸ Package Manager* lists **LLM for Unity**.

If Unity was already open, it may take one recompile before this plugin notices. You do not
need to restart — `Tools ▸ Offline AI NPC ▸ Re-check LLMUnity installation` forces the
check.

---

## 4. Install whisper.unity — optional

This is speech **input**: the player speaking instead of typing. Skip it and everything
else works; typed input is not a lesser path.

*Window ▸ Package Manager ▸ **+** ▸ Add package from git URL*, and paste:

```
https://github.com/Macoron/whisper.unity.git?path=/Packages/com.whisper.unity
```

**A missing dependency is never a compile error here.** Features that need one are compiled
out. If you skip this, the push-to-talk code simply is not there.

---

## 5. Import Offline AI NPC

Import the package.

On the first editor load afterwards a **Welcome** window opens by itself, with three cards
in the order the questions come up: are the dependencies installed, is there a model, is
there a scene to start from.

* It appears **once** and never again — not after a recompile, not in your next project.
* It changes nothing on its own. Everything it can do is behind a button you press.
* Want it back? `Tools ▸ Offline AI NPC ▸ Welcome`.

---

## 6. Download a model

`Tools ▸ Offline AI NPC ▸ Model Manager`.

Every row tells you its **tier**, its **languages** and its **licence** before you download
anything. The default line-up is chosen so that nothing you ship needs an attribution.

Pick the one that matches your language and your hardware tier, and download it.

Things worth knowing:

* The manager verifies the finished file against a hash. A half-finished download is caught
  **here**, not three hours later as inexplicable behaviour.
* `[Ready]` means the file is on disk *and* its header parses. `[Manual]` means you supplied
  it yourself, so the manager can only tell you what the file itself says.
* **Download one.** They are gigabytes each, and it is very easy to end up with six.

---

## 7. Add a voice

Speech **output**. The plugin ships the integration; the engine is yours to install.

1. Download [Piper](https://github.com/rhasspy/piper) and put its folder somewhere your
   project can reach.
2. Add at least one voice — **both files**: `name.onnx` **and** `name.onnx.json`.

> ### The most common setup failure in this whole package
> A voice with the `.onnx` but not the matching `.onnx.json`.
> The result is **silence, with no error message at all**. If your character never speaks
> and the console is clean, check this before anything else.

Japanese needs an engine you supply — VOICEVOX is the usual choice, and connecting it is
about eighty lines against one interface. Worked example in
[Languages](Languages.md#bring-your-own-engine).

---

## 8. Check the setup before you build anything on it

`Tools ▸ Offline AI NPC ▸ Check my setup`.

Every line is a real check against your project, and a failure tells you what to do rather
than what went wrong.

**Fix everything red now.** Each red item is something that would otherwise reappear later
as behaviour you will not connect to its cause.

---

## 9. Your first conversation

Open the `Samples/HelloNpc` sample — the smallest one that talks. Press Play, type
something, hear an answer.

A healthy start prints these lines. Learn to recognise them:

```
[OfflineAINPC] Hardware: NVIDIA GeForce RTX 3060 Laptop GPU (5996 MB VRAM, discrete), ...
[OfflineAINPC] Tier resolved: Standard — 3996 MB VRAM free after a 2000 MB game reserve
[OfflineAINPC] [TTSEngineManager] Active: PiperEngine (en)
[OfflineAINPC] Running qwen3-4b-q4km at tier Standard with 36 GPU layers
[OfflineAINPC] Startup verdict: tier Standard — ...; model qwen3-4b-q4km, 36 GPU layers
```

**The startup verdict line is the one that matters.** It means the whole chain resolved. If
it never appears, your problem is upstream of dialogue and
[Troubleshooting](Troubleshooting.md) is the next page to read.

**The first reply of a session is slower than the rest.** The prompt cache is filling. That
is expected, it is measured, and it does not mean anything is wrong.

### Normal, or broken?

The first hour with a local model is mostly learning which surprises are the technology and
which are a mistake. These are the technology:

| What you see | |
|---|---|
| The first reply takes several seconds, the rest do not | **normal** — prompt cache |
| The same question gets a different answer each time | **normal** — it is a model, not a dialogue tree |
| She will not repeat an authored line word for word | **normal** — author those lines yourself and use the model between them |
| She forgets the conversation after you stop playing | **normal** until you give memory a store |
| She forgets what you said ten minutes ago | **normal** — the window is the last ~20 turns per character |
| Her mouth does not move, she does not walk anywhere | **normal** — the plugin drives none of that |
| She says something about the room that is not there | **normal** without perception; the cure is [Perception](Perception.md), not a sterner prompt |
| The editor sits still for seconds on the first Play | **normal** — the model is loading, once |
| One turn in ten is noticeably slower than the others | **normal** — see [Limitations](Limitations.md#latency) for the distribution |

And these are not — each has a page that names the cause:

| What you see | |
|---|---|
| Subtitle appears, no sound | **broken** — usually a voice missing its `.json` partner ([Troubleshooting](Troubleshooting.md)) |
| She answers in the wrong language | **broken** — voice switched, prompt not |
| Replies run on for paragraphs | **broken configuration** — the token ceiling and sentence limit, not the wording of the prompt |
| The startup verdict line never prints | **broken** — the chain did not resolve; nothing downstream will work |
| Push-to-talk sends things you never said | **broken** — the utterance gate is not in the path |

---

## 10. What is in the plugin, and what each part is for

Everything below ships in the package. You will not need all of it on day one — most
projects start with dialogue and add the rest when they meet the problem it solves. This
section exists so that you know what is already there before you build it yourself.

### The runtime, by area

| Area | What it is for | The problem it solves |
|---|---|---|
| **Core** | languages, presets, sampling, the streaming reply parser, logging | A model answering in the wrong language, or a reply arriving as tokens when speech needs sentences |
| **Speech ▸ TTS** | the engine interface, Piper driver and process pool, voice routing, the streaming speech session | Turning a reply into audio while it is still being generated, instead of after |
| **Speech ▸ STT** | shared microphone loop, push-to-talk recorder, the utterance gate | Whisper inventing sentences out of silence — see below, it matters |
| **State** | axes, bands, traits, mood presentation, serialisation | A character whose mood and relationships change, and who reads differently because of it |
| **Actions** | the verb schema, parser, dispatcher, targets, one-shot repair | The character DOING things, not only saying them — and doing only what you allowed |
| **Perception** | points of interest, weighted queries, snapshots, phrasing | Her knowing what is actually around her, rather than being told to pretend |
| **Memory** | a small conversation window over storage you supply | Her remembering the last few turns without you inventing a format |
| **Hardware** | probe, tiers, the cascade, model catalog | Deciding at startup what this machine can carry, and picking a model to match |
| **Models** | gguf reading, asset states, storage paths | Knowing a model file is whole and usable before loading it |
| **Diagnostics** | the checks behind the setup window | Finding a broken setup at edit time rather than in a playtest |
| **Verification** | latency measurement, prompt snapshots, live checks | Proving it works, with numbers you produced yourself |
| **Integrations** | the LLMUnity grammar binding | Constraining the model's output to your action schema |

### Parts worth knowing about early

**The utterance gate** (`UtteranceGate`). Whisper hallucinates confidently on silence --
"Thank you for watching", "Subtitles by …", a lone full stop — because it was trained on
video with end cards. A push-to-talk key brushed by accident therefore looks exactly like a
player speaking. The danger is not a stray subtitle: if your game listens for a word as a
command, an invented one triggers it, and a key brushed in passing sends the player
somewhere they never asked to go. The gate judges the audio first and the text second, and
every rejection says which one it was.

**Action repair** (`ActionRepair`). When the model returns a malformed action, one retry is
allowed — and it asks for **the action alone**, never the reply again. By the time anyone
knows the action was bad the speech has already been spoken, and regenerating it would make
her say the same thing twice.

**Traits versus state** (`TraitPreset` versus `StateAxes`). Traits never move: they are why
two characters with identical axes behave differently — the shy one starts lower and warms
slowly. State moves. Mood is deliberately **not** persisted, because a feeling that outlives
the session is not a feeling, it is a trait.

**Perception weights** (`PerceptionWeights`). Serialized data, never constants. The right
balance of attention for a cluttered room is not the right balance for an open field, and
that is a designer's call rather than the plugin's.

**The language directive** (`LanguageDirective`). The plugin's own contribution to your
system prompt: answer in THIS language, and keep it about this long. Both sentences are
written **in the language they are asking for** — an instruction the model cannot read is
not an instruction.

**Preset choice** (`PresetCatalog`). Your entry outranks an official one for the same slot;
otherwise the exact tier wins, then the closest lighter tier — because running something
smaller beats running nothing.

### The editor windows

All under `Tools ▸ Offline AI NPC`.

| Window | What it answers |
|---|---|
| **Welcome** | "What do I do first?" Three cards, once, on first import |
| **Model Manager** | "Which model, and is it really here?" Tier, languages and licence per row, hash-verified downloads, and control over what enters a build |
| **Presets** | "Which model and which voice does this language and tier use?" |
| **Check my setup** | "Is anything wrong before I press Play?" Real checks, each failure saying what to do |
| **Prompt debugger** | "**Why did she say that?**" What the model was actually told. For a local product this is the only way to answer it |
| **Live verification** | "Does it actually speak?" Proves a character talks **without entering play mode** — static checks can say a configuration is valid, never that it works |

### What the plugin deliberately does not do

Knowing these saves you looking for them:

* **It saves nothing until you say so.** `NPCMemory` writes through a store you choose.
  `PlayerPrefsStore` ships with the plugin and takes one line; a file or your own save
  system is three methods. See [Dialogue ▸ Memory](Dialogue.md#memory). Nothing is written
  behind your back, because your game already owns its save format.
* **It does not move, animate or draw anything.** No subtitles, no mouth, no walking to the
  window when she says she is going to. The plugin decides *what* the character says and
  *what she decided to do*; every visible consequence is yours to wire — which is also why
  it works in any render pipeline and any art style.
* **It does not bundle the model runner.** LLM for Unity is a separate package under its own
  licence.
* **It does not bundle a speech engine.** Piper is yours to install and ship, and Japanese
  needs an engine you supply.
* **It does not touch your Project Settings, scenes or assets** unless you press a button
  that says it will.

## 11. Your own character

The plugin gives you the pieces; you write the turn. Here is the shape of it, with the four
things beginners get wrong marked.

```csharp
using System;
using System.Collections;
using UnityEngine;
using OfflineAINPC.Core;
using OfflineAINPC.Speech;

public sealed class TalkingCharacter : MonoBehaviour
{
    [SerializeField] private AudioSource _voice;
    [SerializeField] private int _speakerId;      // which voice, when the engine has several

    private StreamingReplyParser _parser;
    private StreamingSpeechSession _speech;
    private bool _busy;

    public IEnumerator Say(string playerLine)
    {
        // (1) ONE lock, released on EVERY exit path.
        if (_busy) yield break;
        _busy = true;

        try
        {
            _parser = new StreamingReplyParser();
            _speech = new StreamingSpeechSession(
                // (2) a Func, not a stored reference: the engine is replaced when the
                //     language changes, and during that switch it is null.
                engine:    () => TTSEngineManager.Instance != null ? TTSEngineManager.Instance.Active : null,
                audio:     _voice,
                speakerId: _speakerId,
                onSubtitle: (text, seconds) => ShowSubtitle(text, seconds),
                onWarning:  message => Debug.LogWarning(message));

            StartCoroutine(_speech.RunSynthesis());
            StartCoroutine(_speech.RunPlayback());

            yield return GenerateReply(playerLine, onToken: textSoFar =>
            {
                // (3) CUMULATIVE or DELTA — get this backwards and she says
                //     "MMaraMara VMara VeyMara Vey, 34." instead of "Mara Vey, 34."
                _parser.AppendCumulative(textSoFar);   // LLMUnity streams cumulative text
                // _parser.Append(delta);              // a backend streaming true deltas
                while (_parser.TryDequeueUnit(out var unit)) _speech.Enqueue(unit);
            });

            _parser.Complete();
            while (_parser.TryDequeueUnit(out var unit)) _speech.Enqueue(unit);

            // (4) without this the synthesis loop waits forever for a unit that is never
            //     coming, and she never finishes speaking.
            _speech.InputComplete();

            while (!_speech.Finished) yield return null;
        }
        finally
        {
            _busy = false;      // (1) again: this is why it is a finally
        }
    }

    private void ShowSubtitle(string text, float seconds) { /* your UI */ }

    private IEnumerator GenerateReply(string playerLine, Action<string> onToken)
    {
        // LLMUnity, your own binding, or a stub. The plugin does not care which.
        yield break;
    }
}
```

### The four, spelled out

1. **`_busy` released in a `finally`.** Every early return, every exception, every cancelled
   coroutine must clear it. The symptom when it leaks is brutal: the character stops
   answering **forever**, and the console says nothing.
2. **A null engine is normal.** It is a `Func<>` because the engine is swapped when the
   language changes. The session copes by delivering the line to the subtitle only.
3. **Cumulative versus delta.** LLMUnity's stream callback hands you the *whole reply so
   far* every time. Feed that to `AppendCumulative`. A backend that streams true deltas
   needs `Append`. The failure is silent and unmistakable once you have heard it.
4. **`InputComplete()`.** Tells synthesis no more text is coming.

Full walkthrough in [Dialogue](Dialogue.md). Memory, moods and relationships are in
[State](State.md), which opens with a ten-line version.

---

---

## 12. The names you will actually type

The section above says what each area is for. This one says what to reach for, because a
concept you cannot name is a concept you cannot look up. Only the types you touch are
listed; the rest are internals that happen to be public.

### Put on a GameObject

| Type | What it does |
|---|---|
| `NpcStateComponent` | holds one character's axes, traits and mood |
| `AIPointOfInterest` | marks a thing in the world as noticeable, with an id and a description |
| `PerceptionQuery` | the character's own view: what she can see, ranked |
| `ActionDispatcher` | receives the actions she decides on and routes them to handlers |
| `PersistentMicRecorder` | push-to-talk recording for one listener |
| `TTSEngineManager` | owns the active speech engine and switches it with the language |

### Implement in your own code

| Type | Why |
|---|---|
| `IActionHandler` | run a verb the character issued |
| `IActionTarget`, `IAimTarget` | be something an action can be aimed at |
| `IStateStore`, `IKeyValueStore` | persist state and memory in YOUR save system |
| `ITTSEngine`, `ILanguageAwareEngine` | add a speech engine the package does not ship |
| `ILlmHost` | put a different model runner underneath |
| `ILiveVerifiable` | let the live-verification window exercise your character |

### Call

| Type | Why |
|---|---|
| `NpcActions.Register` | declare a verb before anything can issue it |
| `ActionSchema` | the grammar and the prompt block, generated from the verbs |
| `NPCMemory` | append turns, read back the last N |
| `StreamingReplyParser` | tokens in, speakable units out |
| `StreamingSpeechSession` | units in, audio and subtitles out |
| `UtteranceGate` | judge a recording, and then its transcript, before spending a turn |
| `UtteranceVerdict` | what the gate decided: accepted, too quiet, or likely hallucinated |
| `LanguageRuntime` | the current language, and the directive it contributes |
| `StateSerializer` | the persisted half of a character |
| `SetupChecks` | run the same checks the window runs, from your own code |
| `LatencyMeasurement` | produce your own numbers rather than trusting ours |
| `ActionParser` | turn the model's text into an action, or say precisely why it could not |
| `PerceptionSnapshot` | the ranked result of one query, reused for the prompt and the shortlist |
| `PoiRegistry` | every noticeable thing currently registered |
| `SharedMicLoop` | one microphone, several listeners, no fighting over the device |
| `HardwareProbe`, `TierCascade` | what this machine is, and what that means for the model |
| `ModelCatalog` | the recommended line-up, per tier |
| `AiNpcDiagnostics`, `DiagnosticsReport` | the checks and their result, as data |
| `LLMUnityGrammarBinding` | hand your action grammar to LLMUnity so the model cannot leave it |
| `TextLengthRule` | how long a reply should be, as a phrase the model can read |

### Author as assets

| Type | Why |
|---|---|
| `AxisCatalogAsset` | which axes your characters have at all |
| `TraitPresetAsset` | fixed dispositions: the shy one, the blunt one |
| `PerceptionWeights` | how much each factor of attention counts, per scene |
| `SamplingProfile` | temperature, penalties, reply length |
| `PresetCatalog` | which model and voice a language and tier resolve to |
| `KeyValueStateStore` | a ready `IStateStore` over any key-value storage you already have |
| `ActionTargetBehaviour` | the component that makes a GameObject nameable as a target |
| `ActionVerb` | one declared verb: its name, its parameters, whether it needs a target |
| `ActionParams`, `NpcActionEvent` | the arguments an action carries, and the UnityEvent you wire in the inspector |

> **Coverage, honestly.** The package has 138 public types and the documentation names
> about a third of them. The rest are data holders, enums and internals that happen to be
> public — but if you meet a name here that no page explains, that is a gap in these docs
> rather than something you are expected to already know.

## 13. Making a build

The step most likely to surprise you.

**Models are excluded by default — every one of them.** That default is a feature: six
models downloaded while experimenting would otherwise silently become a twenty-gigabyte
build, discovered at upload time. Turn on the one you ship, in the Model Manager.

**An included model is staged into `Assets/StreamingAssets/OfflineAINPC` for the duration of
the build and removed afterwards.** That is the only way to get a file into a Unity build,
and it is why the plugin does not leave models sitting in `StreamingAssets` the rest of the
time.

**A build with broken model references is refused before it starts** rather than produced
dead and discovered by a player.

**Piper is yours to ship.** It and its voices are external files, not Unity assets, and they
must be where the built player expects them. A build that works in the editor and is silent
as a player is nearly always this.

### Before you send it to anyone

* run it on a machine that is **not** your dev machine, ideally without Unity installed;
* find the **startup verdict** line in the player log;
* ask one question, hear one answer.

---

## 14. When it does not work

In the order these actually happen:

| Symptom | Check first |
|---|---|
| Never speaks, console clean | the voice's `.onnx.json` — missing one is silent |
| No startup verdict line | the model file: present, whole, referenced |
| Compiles, but no dialogue features | LLM for Unity missing, or Unity has not recompiled since it appeared |
| Push-to-talk does nothing | whisper.unity not installed. Typing still works |
| Works in editor, silent in build | Piper not beside the player, or the path is wrong |
| She says "MMaraMara VMara Vey…" | cumulative fed to `Append`, or deltas to `AppendCumulative` |
| Stopped answering, nothing in console | a leaked `_busy` — check every exit path |
| Everything is very slow | which tier resolved? Below the lowest it runs on the CPU |

[Troubleshooting](Troubleshooting.md) maps real error strings to fixes.

---

## 15. Words you will meet

| | |
|---|---|
| **Model / gguf** | the language model file. Bigger is smarter and slower |
| **Tier** | what your hardware can carry. Decided at startup and printed |
| **Piper / VOICEVOX** | the programs that turn text into audio |
| **Whisper** | the program that turns the player's speech into text |
| **StreamingAssets** | the Unity folder whose contents survive into a build as real files |
| **Prompt cache** | why the first reply is slow and the rest are not |
| **Quantisation** (`Q4_K_M`) | how heavily the model was compressed to fit in memory. Smaller file, slightly worse answers. `Q4_K_M` is the usual balance |
| **Parameters** (`4B`) | the model's size in billions of weights. 4B is the sweet spot for a game; 7B needs a bigger card |
| **GPU layers** (`ngl 36`) | how much of the model sits on the graphics card. All of it is fastest; the rest runs on the CPU |
| **Context window** | how much text the model can hold at once — system prompt, memory replay and the current turn together |
| **System prompt** | the standing instructions the character never says out loud: who she is, what language to answer in, what she can see |
| **Token** | a piece of a word. Models are billed and limited in these, not in characters |
| **Streaming** | the reply arriving piece by piece, so speech can start before the sentence is finished |
| **Verb / action** | a decision the character can make, in a form your code can execute. You invent them — see [Actions](Actions.md#what-a-verb-is) |
| **Grammar** | the rule that makes an action structurally impossible to malform, because invalid words are removed from the model's choices |
| **Axis / band** | a number describing a character (`trust: 7`) and the named range it falls in (`warm`). The model is told the band, never the number |
| **Point of interest** | an object marked as noticeable, so she can mention what is actually there instead of inventing a fireplace |
| **Speaker id** | which voice inside an engine to use. One Piper voice per process; VOICEVOX numbers its characters |
| **Utterance gate** | the check that drops a silent or hallucinated recording before it costs a turn |
| **Push-to-talk** | holding a key to record. The alternative — always listening — transcribes the room |
