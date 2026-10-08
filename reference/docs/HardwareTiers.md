# Hardware tiers

These tiers are configurable rules for choosing the language model. They are not minimum requirements or speed guarantees for a complete game. Reported RAM/graphics memory and the configured reserve are planning inputs, not a live measurement of free memory. Speech recognition, speech output, rendering and other running applications need their own budget. Test the full scene on each target computer; do not add peak memory figures from different processes or moments to make a minimum specification.

The plugin probes the machine at startup, picks a tier, chooses a model for it, sizes the GPU
layer count against the real VRAM budget, and steps down if a load fails. Your game asks none
of that — it adds two components and reads one property.

## Setting it up

On the object that holds your `LLM` component (LLM for Unity), add:

1. **LLMUnity Host** — the adapter that starts, stops and measures that `LLM`. Leave the
   `LLM` component itself **disabled** in the scene: its model, context size and GPU layer
   count lock the moment its service starts, and the cascade has to choose them first.
2. **Tier Bootstrap** — the driver. Optionally assign a `ModelManifest` (which model each
   tier wants) and a `TierPolicy` (the thresholds); empty fields use the built-in defaults,
   which are Qwen3 1.7B / 4B / 8B and the numbers below.

That is the whole setup. A project with its own startup sequence, or another inference
library, implements `ILlmHost` and drives `TierCascade` itself. Implement the optional
`ILlmMeasurementLifetime` as well when your host can retire a pending measurement.

What it decides is printed once at startup:

```
Hardware: NVIDIA GeForce RTX 3060 Laptop GPU (5996 MB VRAM, discrete), 32498 MB RAM, 16 threads, backends=[Cpu,Cuda,Vulkan]
Tier resolved: Standard — 3996 MB VRAM free after a 2000 MB game reserve
Running qwen3-4b-q4km at tier Standard with 36 GPU layers (first run on this machine — starting at 36 layers)
Startup verdict: tier Standard — 3996 MB VRAM free after a 2000 MB game reserve; model qwen3-4b-q4km, 36 GPU layers
```

Stopping the language model never blocks the game: the host stops taking work while the
model unloads in the background, and nothing restarts or changes settings until that has
finished — if it takes too long, this launch uses authored lines. A load cancelled before it
finishes retires that LLM component for the launch: LLM for Unity's startup cannot be waited
on, and a late failure must not take a replacement model down with it. The memory of such a
load is released once it ends in the background. Sampling and startup measurements use only
agents connected to this host's LLM.

The startup speed is the number of tokens that arrive after the first non-empty batch of
streamed text, divided by the time from that batch to the end of the reply — not a count
from a native first-token time. When
the reply arrives in one batch, tokens cannot be counted or the interval cannot be seen, no
speed is reported rather than an estimate.

A request that timed out keeps the model reserved until its generation and tokenization
have actually finished; cancelling it does not prove they have.

---

## The tiers

Thresholds are VRAM **budgets**: the card's memory *after* a reserve for your own rendering,
2000 MB by default and 1500 MB more in VR. The card sizes below are what those budgets come
to in practice.

| Tier | Machine | Model size | What the player gets |
|---|---|---|---|
| **Premium** | budget ≥ 10 000 MB — a 12 GB card or larger | 7–8B | Larger configured model and context budget |
| **Standard** | budget ≥ 3 500 MB — a 6 GB card, with slack for how drivers report it | 3–4B | Balanced model size |
| **Light** | less GPU than that, **and** ≥ 14 GB RAM **and** ≥ 4 logical threads | 1–2B | Smallest configured model; check dialogue quality and speed for your game |
| **Fallback** | anything less | none | **No language model.** A working state, not a crash |

A 10 GB or 11 GB card is Standard, not Premium, because its budget after the reserve is
8 000–9 000 MB. A 4 GB card is not Standard. A "16 GB" laptop with integrated graphics reports
14–15.8 GB of RAM once the GPU has taken its share, which is why the Light bar is 14 000 and
not 16 000. In VR the verdict also drops one tier. All of it is editable in a `TierPolicy`
asset assigned to the bootstrap; the defaults are a starting point, not a law.

The layer count is not a guess from the card size alone. The tuner sets aside the model's
estimated working set — including the context-dependent KV cache — and offloads what its
estimate allows. The actual allocation depends on the model, cache format and backend. A load that still fails steps the count
down by a quarter of the model and tries again; a start that merely times out moves on to
the next model, because fewer layers do not make a slow disk faster. What worked is
remembered per machine, model, context size and VR state, so the second launch skips the
measurement, and a launch that died mid-benchmark comes back with fewer layers instead of
dying the same way again.

**The voice has a budget too.** The voice model and codec stay resident during the session.
The bundled Qwen DLL runs on CPU when **External server URL** is empty. An independently
configured [external GPU server](Languages.md#external-qwen-server) shares the card with
the language model, so budget for speech and rendering in your Tier Policy reserve. Its initial audio buffer reduces interruptions; if generation
cannot keep up, playback can pause until more audio arrives. Test the selected voice under game load.

---

## Fallback is a design decision, not an error

Use `Tiers.StartupState` to decide when the startup sequence has finished:

| State | Meaning |
|---|---|
| `NotStarted` | No cascade has begun. |
| `Starting` | Selection, loading or startup measurement is still running. |
| `Ready` | The cascade finished with a running model. |
| `Fallback` | The cascade finished without a model; use your authored dialogue. |
| `Cancelled` | Startup was interrupted; a later startup can retry. |

`Tiers.IsStartupComplete` is true only for `Ready` and `Fallback`.
`Tiers.OnStartupStateChanged` immediately calls a new subscriber with the current state;
unsubscribe when the listener is disabled. `Tiers.IsResolved` and `OnTierResolved`
describe the hardware verdict, which arrives before loading and may change during
downgrades. Use them for tier information, not as a signal that dialogue can start.

On a machine that cannot run any model the plugin resolves to Fallback and **your game must
still work**. Nothing throws; the character simply has no generated dialogue.

> Characters will not generate speech on this machine. Fall back to your own written lines.

Decide early what that looks like in your game — authored lines, a text-only mode, or a
message. A game that assumes the model is always there will ship broken for the low end of
its own audience.

```csharp
if (Tiers.StartupState == TierStartupState.Fallback)
    UseAuthoredDialogue();
```

**`Tiers.Current` is `HardwareTier?`, and it is null until the cascade has resolved a tier** —
which happens early in every run of the game, not once and for all. Code that needs the
hardware tier value must say so:

```csharp
if (Tiers.Current is HardwareTier tier)
    Debug.Log($"Running at {tier}");
else
    Debug.Log("The machine has not been measured yet.");
```

It is nullable on purpose. "Nobody has measured this yet" and "this machine cannot host a
model" are different facts. To be told when the hardware verdict arrives, subscribe to `Tiers.OnTierResolved`; a
subscriber that arrives after the verdict is called immediately. `Tiers.Reason` says why the
tier is what it is — including "failed to load at 36 GPU layers" after a downgrade — and is
worth a line on a settings screen.

---

## Forcing a tier while developing

You cannot test the low end on a machine that never resolves there. The **Tier Bootstrap**
has a *Force tier* field for exactly this, and a *Fail starts for testing* count that makes
the next N start attempts fail so the downgrade cascade is exercised on purpose. Both are
inspector fields; from code, `Tiers.Override(HardwareTier.Light)` before the model loads
does the same as the first.

**Test Fallback before you ship.** It is the tier most likely to reach a player and least
likely to have been run.

---

## What "degrades" actually means

A lower tier uses a smaller model. Writing quality can degrade: shorter, more literal,
more repetitive, and less consistent at holding a persona across a long conversation.
The tier alone does not predict reply latency; hardware and backend matter too.

Vary the persona, questions and conversation length on each tier you target. A shopkeeper
should keep the same stock facts; a companion should still follow events after a longer
conversation. Check factual consistency, delivery and response time separately. Keep
critical facts in your game state and author lines that must be exact.

A design that leans on the deterministic half (state, thresholds, events) degrades
gracefully, because that half is identical on every tier. A design that leans entirely on the
model's writing quality degrades badly. That is worth knowing before you build the game
around it, not after.

## Several candidates for one tier

Order custom `ModelManifest` entries best-first. At one tier the cascade considers installed
entries in that order before stepping down; a missing first entry does not hide an installed
second one. If loading the first candidate fails and the cascade can continue, it tries
the next candidate at that tier before the lower tier. The existing cancellation, teardown
and settle budgets still bound this process. This is not a promise that every load failure
can be retried safely. The public `ModelCatalog.ForTier` lookup keeps returning the first
declared entry; it is not an installed-model resolver.

`TierPolicy.maxTier` must be Fallback, Light, Standard or Premium (values 0–3). An unknown
value produces a detected Fallback verdict with a diagnostic reason. Without an explicit
tier override, the host is not configured. `Tiers.Override` retains its higher priority;
the policy asset is not rewritten. Test a custom manifest, policy and backend together
before shipping.
