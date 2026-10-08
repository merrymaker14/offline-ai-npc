# Dialogue: wiring a talking character

For the first answer, install compatible LLM for Unity, download one suitable language
model and use **Welcome ▸ Open Hello NPC sample**. Press Play, type a question and press
Enter; read the answer in the subtitle. Microphone input and speech output are optional
steps after that works; [Getting started](GettingStarted.md#4-your-first-typed-answer)
separates text setup from voice errors.

For your own character, start with the canonical `Samples/HelloNpc/HelloNpcCharacter.cs`.
This page explains its parts and shows guarded integration wiring. The backend and UI
methods below are explicit placeholders, not a second runnable backend.

---

## One reply without speech

Use `HelloNpcCharacter.SayText(string)` for a text-only turn, or
`TrySayText(string)` to keep input when submission is rejected. For an assigned `hello`:

```csharp
if (hello.TrySayText(playerLine))
    playerLine = "";
```

`true` means submitted, not completed. Blank input, required model setup, an inactive
character or a busy/still-settling turn can reject it. Subtitles, actions, `Finished`
and ordinary UI conversation history use the existing pipeline. This turn does not
check speech readiness, create a speech session/clip or request synthesis.
Existing `Say(string)`/`TrySay(string)` and UnityEvent bindings remain supported.
The component's `Start` can still inspect/start an assigned engine: leave Engine empty
if the scene should have no assigned speech engine. A typed or spoken turn and an MCP
`say` take turns on the same character — while one runs, the others are refused — and a
cancelled reply keeps the character busy until the model's running task has actually
finished.

## Stopping the Hello NPC sample

For the supplied starter component, call `HelloNpcCharacter.CancelReply()` from a
Stop button or a player interruption. `StopSpeaking()` is a UnityEvent-friendly alias
that stops the whole reply. The component stays enabled and its borrowed TTS engine
stays running. Cancellation suppresses late tokens, actions, subtitles and `Finished`;
it does not undo actions that already ran.

If the backend generation or repair Task is still pending, `IsBusy` remains true.
Keep the next question and retry `TrySay` after `!IsBusy`; requesting cancellation
alone does not prove that the backend finished. There is no automatic input queue.
An absent AudioSource produces subtitles without creating a clip or reporting audio
onset. It still drives the existing synthesis iterator; do not treat this as a mode
that skips synthesis. A failed optional readiness getter or event listener does not
block an otherwise available text reply.


## History in your own LLMUnity controller

Hello NPC already manages its turns. A custom controller can reuse
`OfflineAINPC.Integrations.LLMUnityBackend.AgentConversationHistory` for opening examples
and clean conversation history. Create it once for the assigned `LLMAgent`; call
`SetOpening(...)` or `AppendOpeningTurn(...)` to queue your initial messages. At your
controller's ready point, call `TryApplyOpening(out problem)` before the first generation.
This avoids editing the copy returned by `agent.chat` or applying examples before the
backend has loaded its history.

For each turn, call `BeginTurn(out problem)`, generate with `Chat(addToHistory: false)`,
then call the returned writer's `TryCommit(playerLine, cleanedProse, out problem)` only
if that generation succeeds and still belongs to your controller. Pass the player's
actual question, without the repeated scene description used in the inference prompt.
The writer refuses a changed caller or conflicting history. Discard the writer on
cancellation; `Invalidate()` also discards a queued opening and invalidates old writers.

The helper neither starts a model nor saves history automatically. It records completed
generated prose, which may precede audio playback. Your controller still owns readiness,
one turn at a time, cancellation, and any history saving. See Hello NPC and The Interview
for the complete integration.

## The shape

```
typed text / optional speech-to-text ──▶ your LLM call (streamed)
                                          │
                                          ▼
                              StreamingReplyParser
                              splits into speakable units
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
                 SpeakableText.Sanitize              subtitle (verbatim)
                        │
                        ▼
                StreamingSpeechSession ──▶ AudioSource
```

Two things about this diagram matter more than they look.

**The reply is split into sentences and spoken as they arrive.** The first complete sentence
can be voiced while the model writes the rest. Test the resulting input-to-playback time
with your own model, voice and game workload.

For a long reply without punctuation, the parser prefers commas and spaces. If the text
has neither, a text-element boundary lets speech start before generation ends,
without detaching a combining mark or a surrogate pair. The trailing element stays
buffered until the next token or completion, so split tokens can extend it safely. An unfinished leading `<think>` block is excluded
from both speech and `ProseText`, including when generation ends inside that block.

**The voice and the subtitle get different text.** An emoji is fine to read and impossible to
speak. `SpeakableText.Sanitize` strips what a synthesiser cannot say — emoji, markdown marks,
control characters — and leaves every language's punctuation alone. The subtitle gets the
original.

---

## Streaming subtitles and interruptions

Subtitle durations use unscaled seconds. While audio is still being produced or playback
is paused, the session renews the current line's deadline. The existing `onSubtitle(text,
seconds)` callback can therefore receive the same text again; update its expiry time rather
than adding a new transcript entry. A display with a fade-in or a line counter can use the
new constructor overload's `onSubtitleExtended(seconds)` callback to renew only the current
line. That duration is measured from the callback, not from the line's original start.

Use `StreamingSpeechSession.IsSpeaking` to interrupt a reply that has started. It stays true
while the audio source is paused for an underrun or `AudioListener.pause`, and between units,
until the reply finishes or is cancelled. `AudioSource.isPlaying` alone misses those pauses
and lets the old reply resume after the player has started talking. `IsSpeaking` is false
while only generating the first unit; it does not promise audible sound on every frame.

---

## The whole controller

This example uses the public API and guards callbacks and turn ownership. It is not a
standalone demo: `GenerateReply`, `CancelGeneration` and `ShowSubtitle` are deliberately
empty integration methods. The empty `GenerateReply` does not call an LLM. Use
`HelloNpcCharacter` for the actual LLMUnity call, the checks that refuse a turn while
another runs, and optional actions,
and preserve its cancellation and cleanup when customizing it.

```csharp
using System;
using System.Collections;
using UnityEngine;
using OfflineAINPC.Core;
using OfflineAINPC.Speech;

public sealed class TalkingCharacter : MonoBehaviour
{
    [SerializeField] private AudioSource _voice;
    [SerializeField] private int _speakerId;          // which voice, when the engine has several

    private StreamingSpeechSession _speech;
    private bool _busy;
    private int _generation;

    /// <summary>One turn: the player said something, the character answers.</summary>
    public IEnumerator Say(string playerLine)
    {
        // ONE lock, released on every exit path. Getting this wrong is how push-to-talk
        // stops working forever; a `finally` is not optional here.
        if (!isActiveAndEnabled || _busy) yield break;
        int generation = ++_generation;
        _busy = true;
        var parser = new StreamingReplyParser();
        StreamingSpeechSession speech = null;
        bool Current() => this != null && isActiveAndEnabled && generation == _generation;

        try
        {
            speech = new StreamingSpeechSession(
                engine:    () => TTSEngineManager.Instance != null ? TTSEngineManager.Instance.Active : null,
                audio:     _voice,
                speakerId: _speakerId,
                onSubtitle: (text, seconds) => { if (Current()) ShowSubtitle(text, seconds); },
                onWarning:  message => { if (Current()) Debug.LogWarning(message); });
            _speech = speech;

            StartCoroutine(speech.RunSynthesis());
            StartCoroutine(speech.RunPlayback());

            // YOUR llm call goes here. Feed what the callback gives you to the parser and
            // hand every finished unit to the speech session.
            //
            // MIND WHICH ONE YOUR BACKEND GIVES YOU. LLMUnity's stream callback is
            // CUMULATIVE — every invocation carries the whole reply so far — so it needs
            // AppendCumulative. A backend that streams true deltas needs Append. Getting
            // this backwards is silent and unmistakable: the character says
            // "MMaraMara VMara VeyMara Vey, 34." instead of "Mara Vey, 34."
            yield return GenerateReply(playerLine, onToken: textSoFar =>
            {
                if (!Current()) return;
                parser.AppendCumulative(textSoFar);        // LLMUnity: cumulative
                // parser.Append(delta);                   // a backend that streams deltas
                while (Current() && parser.TryDequeueUnit(out var unit)) speech.Enqueue(unit);
            });

            if (!Current()) yield break;
            parser.Complete();
            while (parser.TryDequeueUnit(out var unit)) speech.Enqueue(unit);
            speech.InputComplete();

            while (!speech.Finished && Current()) yield return null;
        }
        finally
        {
            speech?.Dispose();
            if (this != null && generation == _generation)
            {
                _speech = null;
                _busy = false;
            }
        }
    }

    private void OnDisable()
    {
        _generation++;
        try { CancelGeneration(); }
        finally
        {
            _speech?.Dispose();
            _speech = null;
            _busy = false;
        }
    }

    private void CancelGeneration() { /* cancel requests in your backend */ }
    private void ShowSubtitle(string text, float seconds) { /* your UI */ }

    private IEnumerator GenerateReply(string playerLine, Action<string> onToken)
    {
        // LLMUnity, your own binding, or a stub. The plugin does not care which.
        yield break;
    }
}
```

### The parts you must not skip

**`_busy` released by its owner.** Each turn releases its lock in `finally` only while
it is current. Disable invalidates callbacks, cancels the backend and disposes speech
explicitly, since Unity can stop coroutines without running their cleanup. An old
continuation must not unlock a newer reply. This project has broken push-to-talk this way more than once: the
symptom is that the character simply stops responding, with nothing in the console.

**Local parser and speech captures.** Never feed tokens through mutable fields that a
new turn replaces. The Hello NPC sample guards callbacks and repair completion,
ends the action grammar on disable, and releases speech before raising `Finished`.
Copy these lifecycle checks along with the basic wiring when customizing the sample.

**`InputComplete()`.** Without it the synthesis loop waits forever for a unit that is
never coming, and the character never finishes speaking.

**A failed generation must still end the session.** Never read a faulted task's `Result`
inside the coroutine: it rethrows and may end the coroutine before the owner has
explicitly retired generation and speech. Do not rely on coroutine cleanup alone. Poll the task,
check `IsFaulted`, and on failure call `_speech.Cancel()` and release the lock yourself
before returning; `HelloNpcCharacter` shows the shape. If you stop the coroutines with
`StopCoroutine` instead of letting them drain, call `_speech.Dispose()` so the clip in the
air is released.

**A missing engine is normal.** The engine reference is a `Func<>` and not a stored reference
because the engine is replaced when the language changes. During that switch it is null or
reports not ready; the session handles both by delivering the line to the subtitle only. Do
not assume it is there.

---

## The prompt cache

An inference backend may reuse an unchanged prompt prefix when its cache and context
permit it. Changing the prefix can require additional processing. Measure reply latency
with your chosen model and backend.

**Build stable persona and language rules once, and update them when they change.**
Keep the prefix stable where possible; backend settings, history and context lifetime
still affect whether work can be reused.

Per-turn context (what the character can see, who is nearby) goes in the *user* message
to keep the stable prefix separate. This does not guarantee that the next turn is
cached or fast. See [Current model usage](CurrentModelUsage.md) for current setup.

---

## Memory

`NPCMemory` keeps a rolling window of the conversation, keyed per character, over a store
you choose — so it survives scene loads and restarts once you give it one that persists.

**Set the store at startup, then append and replay turns:**

```csharp
using OfflineAINPC.Memory;

NPCMemory.Store = new PlayerPrefsStore();        // ships with the plugin; one line, done

NPCMemory.Append(npcId, NPCMemory.RoleUser, playerLine);
NPCMemory.Append(npcId, NPCMemory.RoleNpc,  reply);

string replay = NPCMemory.GetContextString(npcId, lastN: 10);
```

The replay is labelled `Player:`, `You:` and `Earlier:` — in English. Pass the language
code and the labels follow it: `GetContextString(npcId, 10, "ru")` writes `Игрок:` and
`Ты:`. A project whose player is a detective, not a "Player", sets `NPCMemory.Labels`
once at startup, or `MemoryLabels.Register("en", ...)` per language; the labels go into
the prompt, so they should be in the character's language and name the roles the way your
game does.

Fold `replay` into the system prompt when you build it. The window is deliberately small:
every remembered turn is prompt tokens on every subsequent turn, and a 4B model's attention
does not reward a long transcript.

Assign `NPCMemory.Store` once at startup, before the first turn. Without a store,
`NPCMemory` is disabled: `Append` records no transcript, `Load` returns no entries and
`GetContextString` returns an empty string, including during the current session.
Check `NPCMemory.HasStore` to confirm that a store is configured.

`LLMAgent` chat history is a separate mechanism managed by the model integration.
It can keep context for an ongoing conversation, but does not enable `NPCMemory` or
replace the store used for replay across scenes or restarts. Hello NPC writes that history
itself: after a remembered turn completes, it adds the player's line and the reply as the
player heard it — the action block and reasoning left out — and saves the history to the
agent's `save` file when one is set. A cancelled or failed turn adds nothing. When the
agent drops its oldest messages to fit the context during a turn, that still counts as the
turn's own history; any other change made meanwhile means someone else wrote to it, and
the turn is not recorded.
`TurnHistory.Continues(before, after, added)` is that test, for a controller of your own
that records its turns the same way.

If a read fails, the current turn proceeds without memory context and `Append` skips
the write, preserving the existing transcript. The next successful append resumes from
that transcript; skipped lines are not queued for retry. JSON output keeps valid Unicode
pairs literal and escapes lone surrogate halves so UTF-8 persistence does not alter them.

If what is stored cannot be read — damaged, or not memory at all — the character starts
with an empty memory, and the next `Append` first keeps the original under separate
internal recovery keys. When that copy cannot be written and read back, nothing
replaces the original. `NPCMemory.Check(npcId)` says which
case a character is in without writing anything — `Missing`, `Loaded`, `Damaged` or
`StoreFailed` — so a game can say "this character's memory was damaged" instead of letting
it start over unexplained; `NPCMemory.SetAsideKeys(npcId)` lists the kept copies, and
`Clear` removes the memory and its current recovery copies. Older recovery keys are
left for manual review because they may also belong to another character.

### Choosing a store

`PlayerPrefsStore` is the right first choice and the wrong last one. It is a small global
blob with no save slots and no encryption, which is fine for a demo and wrong for a game
that already knows how to save.

Anything else is three methods — `Get`, `Set`, `Delete` — against `IKeyValueStore`. Here is
a complete one that writes JSON files under `Application.persistentDataPath`, per save slot:

```csharp
using System.IO;
using OfflineAINPC.Memory;
using UnityEngine;

public sealed class FileStore : IKeyValueStore
{
    private readonly string _dir;

    public FileStore(string slot = "slot0")
    {
        _dir = Path.Combine(Application.persistentDataPath, "npc-memory", slot);
        Directory.CreateDirectory(_dir);
    }

    // Keys include "memory_<npcId>" and internal recovery keys.
    // Use NPC ids that can safely be used as file names.
    private string PathOf(string key) => Path.Combine(_dir, key + ".json");

    public string Get(string key)
    {
        string path = PathOf(key);
        return File.Exists(path) ? File.ReadAllText(path) : "";
    }

    public void Set(string key, string value) => File.WriteAllText(PathOf(key), value);

    public void Delete(string key)
    {
        string path = PathOf(key);
        if (File.Exists(path)) File.Delete(path);
    }
}
```

`NPCMemory.Store = new FileStore(currentSlot);` and memory follows the save slot. The same
three methods reach a database, a cloud save, or the dictionary a test uses:

```csharp
using System.Collections.Generic;
using OfflineAINPC.Memory;

// In tests: no files, no PlayerPrefs, nothing left behind.
public sealed class MemoryStore : IKeyValueStore
{
    private readonly Dictionary<string, string> _map = new Dictionary<string, string>();
    public string Get(string key) => _map.TryGetValue(key, out var v) ? v : "";
    public void Set(string key, string value) => _map[key] = value;
    public void Delete(string key) => _map.Remove(key);
}
```

The store is read when a prompt is built, and read and written once for each remembered
line — a few times per turn, never per frame — so a store that touches disk is not a
performance decision.

### What it keeps, and what it costs

| | |
|---|---|
| `Append(npcId, role, text)` | adds one line; roles are `RoleUser`, `RoleNpc`, `RoleOther`, `RoleSummary` |
| `GetContextString(npcId, lastN)` | the last `lastN` **exchanges**, formatted for a prompt |
| `GetContextString(npcId, lastN, languageCode)` | the same, labelled in that language |
| `Labels` | the labels used when no language is given — `Player:`, `You:`, `Earlier:` by default |
| `Clear(npcId)` | forgets that character, store included, with any copies of an unreadable memory |
| `Check(npcId)`, `SetAsideKeys(npcId)` | what is stored — `Missing`, `Loaded`, `Damaged`, `StoreFailed` — and the kept copies of a damaged one |
| `MaxEntries` | 40 lines per character — older lines fall off the end |
| `Compactor` | optional: your own summariser, called when the window overflows |

Two lines per exchange, forty entries: about twenty turns per character before the oldest
starts dropping. Raise it and every turn costs more prompt tokens; that is the whole
trade-off, and it is why the default is a number rather than "everything".

---

## Voices

The language decides the default voice ([Languages](Languages.md)). With Qwen3-TTS a voice is
a speaker name — `serena`, `ryan`, `ono_anna` and six more, all in one process — so two
characters in one scene sound different by naming different speakers, and nothing is spawned
per voice; a character that still casts by integer speaker id is served by the engine's
*Speaker voices* table. With Piper each voice uses a separate process, started when needed.
After the engine reports ready, `PiperEngine.PrewarmVoices()` starts the default and configured
secondary voice. Startup time depends on the voice, installed executable and hardware.

A character can also name its voice outright. The session's second constructor takes a
`SpeechRequest` as the voice template — `new SpeechRequest("", speakerId, languageCode,
voiceId, style)` — and stamps each unit's text onto it, so the language, the voice and a
delivery hint travel with every unit to an engine that understands them. With Piper the
voice id is a voice file name; the speaker id keeps working as before. See
[Languages](Languages.md#a-streaming-engine).

---

## What this page does not cover

- **Speech recognition** — see [GettingStarted](GettingStarted.md#6-optional-speech-recognition).
- **Actions** (the character doing rather than saying) — see [Actions](Actions.md).
- **Perception** (the character knowing what is around it) — see [Perception](Perception.md).
- **Lip sync.** Not included; The Interview demo animates mouth frames from the playing audio.
