# Internal state

> **What this does, honestly.** State *colours* what a character says; it does not make the
> character act. Measured on Qwen3-4B: asked directly how it was at `sleepiness 95/100`, the
> character referred to being tired in **6 of 10** replies, against **0 of 10** with the state
> system switched off. On a relationship axis the same probe scored **6 of 10** against a
> control of **1 of 10**. It is a real, reproducible effect and a probabilistic one — expect
> a character who often mentions how it feels when the subject comes up, not one who always
> does, and not one who volunteers it unprompted in a one-sentence reply.
>
> The deterministic half is not probabilistic at all: threshold events, trait numbers,
> save/load, and the model being structurally unable to change a need all behave exactly
> as specified, every time.


---

## The short path first

Most projects need one axis that a few game events move, with a visible consequence they
control themselves. That does not need an asset, a trait preset, persistence or a tick.
**It needs this:**

```csharp
using OfflineAINPC.State;

// One axis, in code. No asset, no inspector.
var composure = new AxisDefinition
{
    Id = "composure", Kind = AxisKind.Mood,
    Min = 0f, Max = 100f, Baseline = 70f,
    Bands =
    {
        new AxisBand { Id = "cornered", Min = 0f,  Max = 30f },
        new AxisBand { Id = "guarded",  Min = 30f, Max = 65f },
        new AxisBand { Id = "settled",  Min = 65f, Max = 100f },
    },
};

var state = new NpcStateModel("suspect", new AxisCatalog(new[] { composure }));

// A game event moves it. Deterministic, exact, every time.
state.Modify("composure", -18f, reason: "pressed on a contradiction");

// And you read the band to decide what the player SEES.
string band = state.BandOf("composure")?.Id;      // "guarded"
```

That is the whole system for that case. `NpcStateModel` is plain C# — no `MonoBehaviour`, no
scene, no Unity — so it can be unit-tested directly.

Adjacent bands **share their edge** (`30` ends one and begins the next). Do not leave a gap
of `0.01` between them: a value that lands in the gap has no band, no words, and no answer
to `AtLeastBand`. Hysteresis, not a gap, is what stops a value flapping at the edge.

**Reach for the rest of this page when you want** descriptor text reaching the model, several
characters with different dispositions, decay over game time, persistence across sessions,
or the model being allowed to move an axis itself. Each of those is a reason for one more
piece of the apparatus below. If none of them applies, you are done.

---

## The full apparatus

Three axis kinds. They are separate because they live on different timescales, and merging
any two of them breaks one of them.

| Kind | Lifetime | Persisted | Ticks |
|---|---|---|---|
| **Mood** | minutes, eases back to a baseline | no | toward baseline |
| **Relationship** | permanent, per pair | yes | never |
| **Need** | grows until satisfied | yes | away from baseline |

Put a mood and a need in one bucket and either the mood stops decaying or the need starts.
That is not a hypothetical; it is the usual version of this bug.

A fourth kind, `Trait`, exists so that catalogs authored with it still load. It is retired:
a trait axis never ticked, was never described and modulated nothing. A character's
disposition is a **Trait Preset** (below), which bends the three kinds above. The inspector
and `Validate()` say so when they meet one.

## Defining an axis

Create an **Axis Catalog** asset. Each axis carries its range, baseline, rate per hour,
hysteresis, how far the model may push it, and its descriptor bands.

```
trust   0..20, baseline 0, no decay, model may move it ±0.5
  guarded  0..3    "is polite but keeps a little distance from you"   (always mentioned)
  warm     3..6    "is comfortable around you"
  close    6..10   "trusts you and lets it show"
  devoted 10..20   "trusts you completely"
```

(The sample catalog stops at `close`; `devoted` is the illustration's fourth band.)

Bands are listed **in ascending order**, and the order is meaning: `AtLeastBand`,
`RequireBand` and the direction of a threshold event all compare positions in the list.
The catalog inspector reports a list that is out of order, a band without an id or with a
repeated one, a band whose max is below its min, a gap or overlap between neighbours, and
a band with no text in any language — the last is the quiet one, because an axis whose band
has no words still moves and never reaches the prompt.

**Never send a number to the model.** Given `trust: 7` a small model either ignores it or
plays it as a crisis. Bands exist so a designer writes the words once.

Band text is per language, through the same `LocalizedText` the perception descriptions
use. A sixth language is data.

## Reading and writing

```csharp
var state = GetComponent<NpcStateComponent>();

state.Get("trust", "player");                       // read
state.Modify("sleepiness", 5, "walked home in the rain");
state.Modify("trust", 1, "brought tea", "player");  // relationships are per pair

state.ThresholdCrossed += c =>                      // once per crossing, with hysteresis
    Debug.Log($"{c.AxisId}: {c.FromBandId} -> {c.ToBandId}");
```

Ask in **bands** rather than in numbers wherever gameplay is deciding something:

```csharp
if (state.AtLeastBand("trust", "warm", "player") ?? false) OfferTheHug();
```

`AtLeastBand` returns `bool?`, and the third answer is the point. Null means the question
could not be answered — no such axis, no such band, or a value the bands do not cover —
and it is deliberately not `false`. A caller that cannot tell "I do not know" from "no"
gates content on a typo and never finds out.

The reason to prefer it: a literal `trust >= 3` in your code is a copy of a number in the
asset, and the copy does not move when you retune. Retune the asset and the character
*describes* itself differently while *behaving* exactly as before.

The threshold event never fires on load: progress made last session is not progress made
now, and replaying every milestone at every launch is how a celebration stops meaning
anything.

## What the model is told

`DescribeState(languageCode)` on the component renders the block that goes into the prompt:

```
Right now: this character is getting sleepy, and is comfortable around you.
```

Only bands worth saying are said — an axis resting at its baseline is silent unless the
band is marked **Always mention** — the most notable few first, inside a token budget, in
the character's language.

The subject is **"this character"** by default, because the plugin does not know who it is
describing and a default pronoun is a default gender. Give each character its own on the
component's **Subject in prompt** field — a name, or the pronoun its band texts were
written for — and the block reads `Right now: Mara is getting sleepy…`. Japanese and
Chinese drop the subject entirely; that is the built-in phrasing for those codes. A project
that words the block itself registers a `StatePhrasing` per language, or passes one to the
`DescribeState(languageCode, phrasing)` overload.

## Traits

A trait shifts an axis baseline, scales its rate, and scales how hard incoming changes
land. Two characters with identical axes then behave differently — without it they all
converge on the same emotional shape and the axes stop meaning anything.

```
shy:        mood baseline −2, mood rate ×0.7, trust sensitivity ×1.3, sleepiness rate ×1.3
energetic:  mood baseline +2, mood rate ×1.4, trust sensitivity ×0.7, sleepiness rate ×0.8
```

"At rest" is judged against the character's own baseline, trait included: a shy character
sitting at −2 is not out of sorts, it is home.

## What the model may do

Add a **Feel Action Handler** and the `feel` verb appears, with `axis` as a grammar choice
built from the axes that opened themselves to it:

```json
{"verb":"feel","params":{"axis":"mood","delta":-2,"reason":"..."}}
```

Axes with `MaxModelDelta = 0` are not in that choice, so a need is **unreachable** rather
than rejected — a character cannot decide it is no longer tired. Open axes are clamped
per reply, whether the model nudges them or tries to set them outright.

## Gating verbs by state

```csharp
NpcStateComponent.VerbGate.RequireBand("race", "sleepiness", maxBand: "drowsy",
                                       note: "too tired to run");
```

The verb leaves the grammar. The character does not refuse it — it was never offered.
Verbs are filtered by state, targets by perception, and neither knows about the other.

`Require(..., min:, max:)` takes numbers and still works; a numeric rule is re-checked on
every change of its axis, not only on a band crossing. Prefer `RequireBand` all the same:
a band bound resolves against the catalog every time the rule is evaluated, so moving the
band's edge moves the rule with it. A numeric bound is a second tuning of the same thing,
and the two drift. Put `max: 85` on a rule while the `spent` band begins at 70, and for
those fifteen points a character is described as barely able to stay awake while still
being offered the chance to look around.

A band the catalog does not define is **ignored loudly**, in the console, rather than
enforced. Enforcing a typo would remove a verb forever; ignoring it quietly would make the
gate a check that cannot fail.

## Saving

Persistence is **opt-in**. Nothing is written anywhere until a project installs a store,
usually from a bootstrap:

```csharp
using OfflineAINPC.Memory;
using OfflineAINPC.State;

NpcStateComponent.Store = new KeyValueStateStore(new PlayerPrefsStore());
```

Order does not matter: a character that was already running loads its save the moment a
store appears, and never writes before it has tried to load — so a late bootstrap cannot
overwrite last week's trust with this session's defaults. Without a store, relationships
and needs reset when the game restarts; the component's inspector says so in Play mode,
because "trust does not save" a week later looks like a bug and is a missing line.

`KeyValueStateStore` wraps any `IKeyValueStore` — the same three-method interface
[memory](Dialogue.md#memory) uses, so one `FileStore` per save slot serves both. Persisted
axes serialise as `{schemaVersion, values}`. A project with its own save format implements
`IStateStore` directly, or folds the values into its own file:

```csharp
Dictionary<string, float> mine = state.Export();   // fold into your own save
state.Import(mine);                                // restore, raising no milestones
state.Restored += RefreshPose;                     // values changed with no single event
```

`Import` means "load this slot": it replaces the persisted state wholesale, so anything
earned since the last save and absent from the incoming data is gone, which is what
loading a slot means. Values for axes the current catalog no longer defines are **kept and
saved back** rather than dropped, with a warning naming them — a catalog edit is not a
reason to lose a save, and a renamed axis is yours to migrate.

Saves are debounced (never more often than once a second, ten by default) and flushed on
disable, on quit, and when the application pauses on mobile. Mood is session-only by
design.

## Pause behaviour

Ticks accumulate scaled `Time.deltaTime`, so at `timeScale = 0` nothing accumulates and
nothing ticks — a character does not get sleepier while the player is in a menu, and no
timer spins. Perception freezes with it, for the same reason: both model game time.

The speech queue deliberately does the opposite and keeps running on unscaled time, because
`AudioSource` ignores `timeScale` and a line already sounding does not stop. See
[Limitations](Limitations.md#pause-what-each-part-does-at-timescale--0) for the full
per-subsystem table.
