# Structured actions

An NPC reply can carry two things at once: natural speech for the voice, and a
machine-reliable decision your game can execute.

```
{"verb":"look_at","target":"window"}
It stopped raining. Come and see.
```

The first line is generated under a **grammar**, so it cannot be malformed. The rest is
ordinary prose and flows through the streaming speech pipeline sentence by sentence.

Do not hope the model formats correctly — constrain it. llama.cpp masks invalid tokens at
every step, which makes a broken action block structurally impossible rather than
unlikely.

## What a verb is

**A verb is a word you invent, and the plugin ships none of them.** `look_at`, `emote`,
`open` in these examples are not built in — they exist because somebody wrote a `Register`
line for them, the way `"jump"` exists in your input map because you added it.

Three parts, and only the first is required:

| Part | What it is | Example |
|---|---|---|
| **verb** | the name of a thing the character can decide to do | `look_at` |
| **target** | *what* she decided to do it to, chosen from objects that exist right now | `window` |
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
logs and costs nothing else.

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
alternation in the grammar, so the model cannot invent a value you have no code for.

## Register a target

Add an **Action Target** component to the object and give it a short id, or register one
directly:

```csharp
NpcActions.Targets.Register("window", "the tall window by the beds");
```

A disabled target leaves the grammar, so the model literally cannot refer to an object
that is not there.

**If the object already has an AI Point Of Interest, it is already a target.** Perception's
component implements the same `IActionTarget`, so adding an Action Target beside it registers
one object twice under two ids — and the model picks between them by writing an id. Choose one:
Action Target for something a verb can be aimed at, AI Point Of Interest for something the
character should also be able to *notice* — see [Perception](Perception.md#the-object).

**If the object already has an AI Point Of Interest, it is already a target.** Perception's
component implements the same `IActionTarget`, so adding an Action Target beside it registers
one object twice under two ids — and the model picks between them by writing an id. Choose one:
Action Target for something a verb can be aimed at, AI Point Of Interest for something the
character should also be able to *notice* — see [Perception](Perception.md#the-object).

## Receive an action

Add an **Action Dispatcher** to the character. Three ways in:

```csharp
// 1. UnityEvent — wire it in the inspector, no code.

// 2. Code, one verb:
dispatcher.AddHandler("look_at", a => { var at = a.Target.AimPointOf(); if (at) transform.LookAt(at); });

// 3. Code, an interface:
public class Doors : MonoBehaviour, IActionHandler
{
    public IEnumerable<string> HandledVerbs => new[] { "open" };
    public void Handle(NpcAction action) => Open(action.Target);   // already resolved
}
```

`NpcAction` carries the resolved target object, not just its id, and parameters already
validated against the verb. There is nothing left to re-check.

A handler that throws is contained and logged: it loses its action, never the
conversation.

## Guarantees

* The action block is **optional** — most replies are pure conversation, and the grammar
  never forces one.
* Speech is **never** empty and never starts with `{`, so an action can never arrive
  instead of a reply.
* A malformed block degrades into speech rather than swallowing the line.
* A rejected action gets **one** corrective round, then is dropped silently.

## Backends

The core does not reference any LLM library. Grammar reaches the backend through
`IGrammarSink`; the adapter for LLMUnity ships in the optional `OfflineAINPC.LLMUnity`
assembly, which compiles only when LLMUnity is installed. Game code finds it through the
interface:

```csharp
var sink = GetComponent<IGrammarSink>();     // null when no backend is installed
```

Note for backend authors: in llama.cpp the grammar is sampler state on the client, not a
per-request argument. It persists until cleared, so whatever sets it must clear it.
