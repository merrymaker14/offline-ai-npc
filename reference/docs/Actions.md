# Structured actions

An NPC reply can carry two things at once: natural speech for the voice, and a
machine-reliable decision your game can execute.

```
{"verb":"look_at","target":"window"}
It stopped raining. Come and see.
```

With a grammar binding on the character (an **LLMUnity Grammar Binding** driven by
`ActionTurn`, below) the first line is generated under a **grammar**, so its shape cannot be
wrong; without one the parser still reads it and rejects what does not fit. The rest is
ordinary prose and flows through the streaming speech pipeline sentence by sentence.

Do not hope the model formats correctly — constrain it. llama.cpp masks invalid tokens at
every step, which makes a broken action block structurally impossible rather than
unlikely.

## What a verb is

**A verb is a word you invent, and the plugin ships one.** `look_at`, `emote`, `open` in
these examples are not built in — they exist because somebody wrote a `Register` line for
them, the way `"jump"` exists in your input map because you added it. The one shipped verb is
`feel`, the character moving its own mood within the allowance you set — see
[State](State.md); it is registered by the state component and absent otherwise.

Three parts, and only the first is required:

| Part | What it is | Example |
|---|---|---|
| **verb** | the name of a thing the character can decide to do | `look_at` |
| **target** | *what* the character decided to do it to, chosen from objects that exist right now | `window` |
| **parameters** | the details of the decision | `kind: "shy"` |

A verb is not behaviour. Registering `open` does not open anything and does not teach the
model what opening means; it does four things:

1. puts the word into the **grammar**, so the model may emit it and may not emit anything else;
2. shows your one-line description to the model, which is all it knows about when to choose it;
3. makes the parser accept `{"verb":"open", …}` and reject a target or parameter the verb
   never declared;
4. gives the dispatcher something to route to **your** handler.

The behaviour is the handler you write. Nothing happens until you write it — a registered
verb with no handler is a decision the character can make and the game will ignore, which
logs once per verb and costs nothing else.

Register only what your game can carry out. Every verb in the grammar is a thing the model
will eventually choose, and a character who decides to do something no code implements is
worse than one who never had the option.

## Register a verb

```csharp
using OfflineAINPC.Actions;

NpcActions.Register("look_at", "look at something you mention", TargetRequirement.Required);
NpcActions.Register("emote", "let a feeling show", TargetRequirement.None,
                    ActionParameter.Choice("kind", new[] { "happy", "shy", "sad" }));
```

Prefer `Choice` over `Text` wherever the set is knowable: a choice becomes a closed
alternation in the grammar, so the model cannot invent a value you have no code for. Free
text is still shape-safe — no quote, no backslash, no control character and no brace can
appear in it — but its *content* is your handler's problem.

Verb names, parameter names, target ids and choice values all become literals in the
grammar. Letters, digits, `_`, `-` and `.` for names and ids; anything but a quote, a
backslash or a brace for choice values. Anything else is refused at registration with an
exception, because a grammar that fails to compile at runtime would fail on the player's
machine, not yours.

Optional parameters are independent of each other: a verb with optional `a` and `b` can
arrive with neither, either, or both, in the declared order. Required parameters come
first.

## Register a target

Add an **Action Target** component to the object and give it a short id, or register one
directly:

```csharp
NpcActions.Targets.Register("window", "the tall window by the beds");
```

An Action Target with an empty id derives one from the object's name the same way every
time — "Tall Window (2)" becomes `tall_window_2` — so two objects with the same name
collide visibly in the console rather than one of them silently winning.

A disabled target leaves the grammar, so the model literally cannot refer to an object
that is not there.

**If the object already has an AI Point Of Interest, it is already a target.** Perception's
component implements the same `IActionTarget`, so adding an Action Target beside it registers
one object twice under two ids — and the model picks between them by writing an id. Choose one:
Action Target for something a verb can be aimed at, AI Point Of Interest for something the
character should also be able to *notice* — see [Perception](Perception.md#the-object).

## Receive an action

Add an **Action Dispatcher** to the character. Four ways in:

```csharp
using System.Collections.Generic;
using OfflineAINPC.Actions;
using UnityEngine;

// 1. UnityEvent — wire it in the inspector, no code; AddListener from code fires too.

// 2. Code, one verb:
dispatcher.AddHandler("look_at", a => { var at = a.Target.AimPointOf(); if (at) transform.LookAt(at); });

// 3. Code, an interface — registered with the dispatcher while enabled:
public class Doors : MonoBehaviour, IActionHandler
{
    [SerializeField] private ActionDispatcher _dispatcher;
    public IEnumerable<string> HandledVerbs => new[] { "open" };
    public void Handle(NpcAction action) => Open(action.Target);   // already resolved
    private void OnEnable()  => _dispatcher.AddHandler(this);
    private void OnDisable() => _dispatcher.RemoveHandler(this);
}

// 4. On the object itself: a point of interest raises its own OnNpcInteract event,
//    so "when a character uses this mug" is wired on the mug.
```

`NpcAction` carries the resolved target object, not just its id, and parameters already
validated against the verb. There is nothing left to re-check. Ask `action.Target.AimPointOf()`
where the target is: it answers null for a target that was destroyed between generation and
dispatch instead of throwing.

A handler that throws is contained and logged: it loses its action, never the
conversation.

## Wiring a turn

Registering verbs and handlers is half the work. The other half happens once per reply,
and every project used to assemble it by hand with three mistakes available: leaving the
grammar applied after the turn, dispatching the same block on every streaming callback,
and skipping the repair round. `ActionTurn` is that assembly:

```csharp
using OfflineAINPC.Actions;
using OfflineAINPC.Core;

var sink       = GetComponent<IGrammarSink>();        // LLMUnity Grammar Binding, or null
var dispatcher = GetComponent<ActionDispatcher>();
var parser     = new StreamingReplyParser();

using (var turn = new ActionTurn(NpcActions.Schema, dispatcher, sink, npcId, languageCode))
{
    turn.Begin();                                      // grammar on

    string reply = await agent.Chat(playerLine, textSoFar =>
    {
        parser.AppendCumulative(textSoFar);
        turn.TryDispatch(parser);                      // acts on the block at most once
        while (parser.TryDequeueUnit(out var unit)) speech.Enqueue(unit);
    });

    parser.Complete(reply);
    turn.TryDispatch(parser);

    if (turn.NeedsRepair)                              // an action was attempted and was wrong
    {
        turn.BeginRepair();                            // action-only grammar
        string fixedUp = await agent.Chat(turn.RepairPrompt, null, null, addToHistory: false);
        turn.CompleteRepair(fixedUp);                  // dispatches, or gives up
    }
}                                                       // grammar off, whatever happened
```

Fold `NpcActions.Describe(languageCode)` into the system prompt, once, when you compose it;
that is what tells the model what the verbs *mean* — the grammar only says what is
expressible. With a per-character perception schema, use that schema and
`DescribeVerbsOnly` instead, as [Perception](Perception.md) explains.

The HelloNpc sample does exactly this; copy it. The repair generation runs while the
speech is already playing, asks for the action alone, and stays out of the conversation
history.

## Guarantees

* The action block is **optional** — most replies are pure conversation, and the grammar
  never forces one.
* Speech is **never** blank and never starts with `{`, so an action can never arrive
  instead of a reply.
* A malformed block degrades into speech rather than swallowing the line; a leading block
  that names no `verb` (an emoticon in braces) is not an action and is not repaired.
* A rejected action gets **one** corrective round, then is dropped with a log line.
* The prompt frame — "Available actions", "never read the action line aloud", the repair
  prompt — is in the character's language for the five shipped codes (`ActionPhrasing`),
  and a sixth is a `Register` call.

## Backends

The core does not reference any LLM library. Grammar reaches the backend through
`IGrammarSink`; the adapter for LLMUnity ships in the optional `OfflineAINPC.LLMUnity`
assembly, which compiles only when LLMUnity is installed. Game code finds it through the
interface:

```csharp
var sink = GetComponent<IGrammarSink>();     // null when no backend is installed
```

Note for backend authors: in llama.cpp the grammar is sampler state on the client, not a
per-request argument. It persists until cleared, so whatever sets it must clear it —
which is why `ActionTurn` is disposable.
