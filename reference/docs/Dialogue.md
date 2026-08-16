# Dialogue: wiring a talking character

This is the page that turns the parts into a character: the fifty lines that sit between a
microphone and a voice, and what each of them is for.

Everything below is the working controller, not a sketch. Where a line has a trap in it,
the trap is marked at the line.

---

## The shape

```
player speaks ──▶ speech-to-text ──▶ your LLM call (streamed)
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

**The reply is split into sentences and spoken as they arrive.** Waiting for the whole reply
costs 2.4 s to first audio on the reference machine; speaking from the first finished
sentence costs 2.0 s. That is the difference between the two figures quoted everywhere in
this documentation, and it is why the parser exists.

**The voice and the subtitle get different text.** An emoji is fine to read and impossible to
speak. `SpeakableText.Sanitize` strips what a synthesiser cannot say — emoji, markdown marks,
control characters — and leaves every language's punctuation alone. The subtitle gets the
original.

---

## The whole controller

Minus your project's specifics. It compiles against the public API and nothing else.

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

    private StreamingReplyParser _parser;
    private StreamingSpeechSession _speech;
    private bool _busy;

    /// <summary>One turn: the player said something, the character answers.</summary>
    public IEnumerator Say(string playerLine)
    {
        // ONE lock, released on every exit path. Getting this wrong is how push-to-talk
        // stops working forever; a `finally` is not optional here.
        if (_busy) yield break;
        _busy = true;

        try
        {
            _parser = new StreamingReplyParser();
            _speech = new StreamingSpeechSession(
                engine:    () => TTSEngineManager.Instance != null ? TTSEngineManager.Instance.Active : null,
                audio:     _voice,
                speakerId: _speakerId,
                onSubtitle: (text, seconds) => ShowSubtitle(text, seconds),
                onWarning:  message => Debug.LogWarning(message));

            StartCoroutine(_speech.RunSynthesis());
            StartCoroutine(_speech.RunPlayback());

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
                _parser.AppendCumulative(textSoFar);       // LLMUnity: cumulative
                // _parser.Append(delta);                  // a backend that streams deltas
                while (_parser.TryDequeueUnit(out var unit)) _speech.Enqueue(unit);
            });

            _parser.Complete();
            while (_parser.TryDequeueUnit(out var unit)) _speech.Enqueue(unit);
            _speech.InputComplete();

            while (!_speech.Finished) yield return null;
        }
        finally
        {
            _busy = false;
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

### The parts you must not skip

**`_busy` released in a `finally`.** Every early return, every exception, every cancelled
coroutine has to clear it. This project has broken push-to-talk this way more than once: the
symptom is that the character simply stops responding, with nothing in the console.

**`InputComplete()`.** Without it the synthesis loop waits forever for a unit that is
never coming, and the character never finishes speaking.

**A null engine is normal.** The engine reference is a `Func<>` and not a stored reference
because the engine is replaced when the language changes. During that switch it is null; the
session handles it by delivering the line to the subtitle only. Do not assume it is there.

---

## The prompt cache

The system prompt is cached by the inference engine. A stable prompt means fast replies; a
prompt that changes every turn pays the cold cost — about 2.1 s here — every time.

**So: build the prompt once, at `Start`, and re-build it only when something real changed** —
the language, the character's persona, a new ambient fact. Never per turn.

That is also why per-turn context (what the character can currently see, who is nearby) is
appended to the *user* message rather than folded into the system prompt: it changes
constantly, and putting it in the cached half would throw the cache away every turn.

---

## Memory

`NPCMemory` keeps a rolling window of the conversation, keyed per character, over a store
you choose — so it survives scene loads and restarts once you give it one that persists.

**The whole of it is three calls.** Pick a store on the first line, and never think about
persistence again:

```csharp
using OfflineAINPC.Memory;

NPCMemory.Store = new PlayerPrefsStore();        // ships with the plugin; one line, done

NPCMemory.Append(npcId, NPCMemory.RoleUser, playerLine);
NPCMemory.Append(npcId, NPCMemory.RoleNpc,  reply);

string replay = NPCMemory.GetContextString(npcId, lastN: 10);
```

Fold `replay` into the system prompt when you build it. The window is deliberately small:
every remembered turn is prompt tokens on every subsequent turn, and a 4B model's attention
does not reward a long transcript.

Do that assignment once, at startup, before anything talks. Without a store `NPCMemory`
still works and simply forgets on quit — check `NPCMemory.HasStore` if you want to be sure
which of the two you have.

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

    // Keys arrive as "memory_<npcId>", so they are already safe file names — but a game
    // that invents its own ids should still sanitise, not trust.
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
// In tests: no files, no PlayerPrefs, nothing left behind.
public sealed class MemoryStore : IKeyValueStore
{
    private readonly Dictionary<string, string> _map = new Dictionary<string, string>();
    public string Get(string key) => _map.TryGetValue(key, out var v) ? v : "";
    public void Set(string key, string value) => _map[key] = value;
    public void Delete(string key) => _map.Remove(key);
}
```

The store is asked for a value once per character per turn, not per frame, so a store that
touches disk is not a performance decision.

### What it keeps, and what it costs

| | |
|---|---|
| `Append(npcId, role, text)` | adds one line; roles are `RoleUser`, `RoleNpc`, `RoleOther`, `RoleSummary` |
| `GetContextString(npcId, lastN)` | the last `lastN` **exchanges**, formatted for a prompt |
| `Clear(npcId)` | forgets that character, store included |
| `MaxEntries` | 40 lines per character — older lines fall off the end |
| `Compactor` | optional: your own summariser, called when the window overflows |

Two lines per exchange, forty entries: about twenty turns per character before the oldest
starts dropping. Raise it and every turn costs more prompt tokens; that is the whole
trade-off, and it is why the default is a number rather than "everything".

---

## Voices

The language decides the default voice ([Languages](Languages.md)). A character overrides it
by speaker id — that is how two English speakers in one scene sound different. With Piper,
each voice is a separate process, spawned lazily; with VOICEVOX, a speaker id on one server.

Spawn the voices you will need up front rather than on the first line. A Piper process takes
about 1.3 s to come up, and paying that mid-scene is an audible silence.

---

## What this page does not cover

- **Speech recognition** — see [GettingStarted](GettingStarted.md#6-speech-recognition).
- **Actions** (the character doing rather than saying) — see [Actions](Actions.md).
- **Perception** (the character knowing what is around her) — see [Perception](Perception.md).
- **Lip sync.** Not included; the demo project drives a jaw bone itself.
