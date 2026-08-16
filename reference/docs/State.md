# Internal state

> **What this does, honestly.** State *colours* what a character says; it does not make her
> act. Measured on Qwen3-4B: asked directly how she is at `sleepiness 95/100`, she referred
> to being tired in **6 of 10** replies, against **0 of 10** with the state system switched
> off. On a relationship axis the same probe scored **6 of 10** against a control of
> **1 of 10**. It is a real, reproducible effect and a probabilistic one — expect a
> character who often mentions how she feels when the subject comes up, not one who always
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
        new AxisBand { Id = "cornered", Min = 0f,  Max = 29.99f },
        new AxisBand { Id = "guarded",  Min = 30f, Max = 64.99f },
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

**Reach for the rest of this page when you want** descriptor text reaching the model, several
characters with different dispositions, decay over real time, persistence across sessions,
or the model being allowed to move an axis itself. Each of those is a reason for one more
piece of the apparatus below. If none of them applies, you are done.

---

## The full apparatus

Four axis kinds. They are separate because they live on different timescales, and merging
any two of them breaks one of them.

| Kind | Lifetime | Persisted | Ticks |
|---|---|---|---|
| **Mood** | minutes, eases back to a baseline | no | toward baseline |
| **Relationship** | permanent, per pair | yes | never |
| **Need** | grows until satisfied | yes | away from baseline |
| **Trait** | never changes | yes | never — it modulates the rest |

Put a mood and a need in one bucket and either the mood stops decaying or the need starts.
That is not a hypothetical; it is the usual version of this bug.

## Defining an axis

Create an **Axis Catalog** asset. Each axis carries its range, baseline, rate per hour,
hysteresis, how far the model may push it, and its descriptor bands.

```
trust   0..20, baseline 0, no decay, model may move it ±0.5
  guarded  0..2.99   "is polite but a little guarded with you"   (always mentioned)
  warm     3..5.99   "is comfortable around you"
  close    6..9.99   "trusts you and lets it show"
  devoted 10..20     "trusts you completely"
```

**Never send a number to the model.** Given `trust: 7` a small model either ignores it or
plays it as a crisis. Bands exist so a designer writes the words once.

Band text is per language, through the same `LocalizedText` the perception descriptions
use. A sixth language is data.

## Reading and writing

```csharp
var state = GetComponent<NpcStateComponent>();

state.Get("trust", "player");                       // read
state.Modify("sleepiness", 5, "carried her upstairs");
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
*describes* herself differently while *behaving* exactly as before.

The threshold event never fires on load: progress made last session is not progress made
now, and replaying every milestone at every launch is how a celebration stops meaning
anything.

## Traits

A trait shifts an axis baseline, scales its rate, and scales how hard incoming changes
land. Two characters with identical axes then behave differently — without it they all
converge on the same emotional shape and the axes stop meaning anything.

```
shy:        mood baseline −2, mood rate ×0.7, trust sensitivity ×1.3, sleepiness rate ×1.3
energetic:  mood baseline +2, mood rate ×1.4, trust sensitivity ×0.7, sleepiness rate ×0.8
```

## What the model may do

Add a **Feel Action Handler** and the `feel` verb appears, with `axis` as a grammar choice
built from the axes that opened themselves to it:

```json
{"verb":"feel","params":{"axis":"mood_valence","delta":-2,"reason":"..."}}
```

Axes with `MaxModelDelta = 0` are not in that choice, so a need is **unreachable** rather
than rejected — a character cannot decide she is no longer tired. Open axes are clamped
per reply.

## Gating verbs by state

```csharp
NpcStateComponent.VerbGate.RequireBand("race", "sleepiness", maxBand: "drowsy",
                                       note: "too tired to run");
```

The verb leaves the grammar. She does not refuse it — it was never offered. Verbs are
filtered by state, targets by perception, and neither knows about the other.

`Require(..., min:, max:)` takes numbers and still works. Prefer `RequireBand`: a band
bound resolves against the catalog every time the rule is evaluated, so moving the band's
edge moves the rule with it. A numeric bound is a second tuning of the same thing, and the
two drift. Put `max: 85` on a rule while the `spent` band begins at 70, and for those
fifteen points a character is described as barely keeping her eyes open while still being
offered the chance to look around.

A band the catalog does not define is **ignored loudly**, once, in the console. Enforcing
a typo would remove a verb forever; ignoring it quietly would make the gate a check that
cannot fail.

## Saving

Persisted axes serialise as `{schemaVersion, values}` through `IStateStore`. A project
with its own save format implements the interface, or uses `Export()` / `Import()`:

```csharp
Dictionary<string, float> mine = state.Export();   // fold into your own save
state.Import(mine);                                // restore, raising no milestones
```

Mood is session-only by design.

## Pause behaviour

Ticks accumulate scaled `Time.deltaTime`, so at `timeScale = 0` nothing accumulates and
nothing ticks — she does not get sleepier while the player is in a menu, and no timer
spins. Perception freezes with it, for the same reason: both model game time.

The speech queue deliberately does the opposite and keeps running on unscaled time, because
`AudioSource` ignores `timeScale` and a line already sounding does not stop. See
[Limitations](Limitations.md#pause-what-each-part-does-at-timescale--0) for the full
per-subsystem table.
