# Hardware tiers

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
library, implements `ILlmHost` (seven members) and drives `TierCascade` itself — the
bootstrap is forty lines and does nothing you could not.

What it decides is printed once at startup:

```
Hardware: NVIDIA GeForce RTX 3060 Laptop GPU (5996 MB VRAM, discrete), 32498 MB RAM, 16 threads, backends=[Cpu,Cuda,Vulkan]
Tier resolved: Standard — 3996 MB VRAM free after a 2000 MB game reserve
Running qwen3-4b-q4km at tier Standard with 36 GPU layers (first run on this machine — starting at 36 layers)
Benchmark at 36 GPU layers: generation 36.2 tok/s (24 tokens in 0.66s), prefill 0.41s (reported separately, not averaged in)
Startup verdict: tier Standard — 3996 MB VRAM free after a 2000 MB game reserve; model qwen3-4b-q4km, 36 GPU layers
```

---

## The tiers

Thresholds are VRAM **budgets**: the card's memory *after* a reserve for your own rendering,
2000 MB by default and 1500 MB more in VR. The card sizes below are what those budgets come
to in practice.

| Tier | Machine | Model size | What the player gets |
|---|---|---|---|
| **Premium** | budget ≥ 10 000 MB — a 12 GB card or larger | 7–8B | Best writing, full context |
| **Standard** | budget ≥ 3 500 MB — a 6 GB card, with slack for how drivers report it | 3–4B | The reference configuration below |
| **Light** | less GPU than that, **and** ≥ 14 GB RAM **and** ≥ 4 logical threads | 1–2B | Works, noticeably more stilted, slower |
| **Fallback** | anything less | none | **No language model.** A working state, not a crash |

A 10 GB or 11 GB card is Standard, not Premium, because its budget after the reserve is
8 000–9 000 MB. A 4 GB card is not Standard. A "16 GB" laptop with integrated graphics reports
14–15.8 GB of RAM once the GPU has taken its share, which is why the Light bar is 14 000 and
not 16 000. In VR the verdict also drops one tier. All of it is editable in a `TierPolicy`
asset assigned to the bootstrap; the defaults are a starting point, not a law.

**The reference machine**, which produced every latency figure in this documentation: RTX
3060 Laptop, 6 GB VRAM, 32 GB RAM, 16 threads → **Standard**, Qwen3-4B Q4_K_M, all 36 layers
on the GPU, 36 tok/s, **2.0 s median to first audio**.

The layer count is not a guess from the card size alone. The tuner sets aside the model's
working set — the KV cache grows with the context size, and a 16k context on a 4B model is
two gigabytes — and offloads what fits in the rest. A load that still fails steps the count
down by a quarter of the model and tries again; a start that merely times out moves on to
the next model, because fewer layers do not make a slow disk faster. What worked is
remembered per machine, model, context size and VR state, so the second launch skips the
measurement, and a launch that died mid-benchmark comes back with fewer layers instead of
dying the same way again.

---

## Fallback is a design decision, not an error

On a machine that cannot run any model the plugin resolves to Fallback and **your game must
still work**. Nothing throws; the character simply has no generated dialogue.

> Characters will not generate speech on this machine. Fall back to your own written lines.

Decide early what that looks like in your game — authored lines, a text-only mode, or a
message. A game that assumes the model is always there will ship broken for the low end of
its own audience.

```csharp
if (Tiers.Current == HardwareTier.Fallback)
    UseAuthoredDialogue();
```

**`Tiers.Current` is `HardwareTier?`, and it is null until the cascade has resolved a tier** —
which happens early in every run of the game, not once and for all. The comparison above is
safe (a null never equals `Fallback`), but anything that needs the value must say so:

```csharp
if (Tiers.Current is HardwareTier tier)
    Debug.Log($"Running at {tier}");
else
    Debug.Log("The machine has not been measured yet.");
```

It is nullable on purpose. "Nobody has measured this yet" and "this machine cannot host a
model" are different facts, and a property that answered `Fallback` to both would send code
written exactly like the snippet above to authored lines on hardware that runs the model
perfectly well. To be told when the answer arrives, subscribe to `Tiers.OnTierResolved`; a
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

A lower tier is a smaller model. It is not merely slower — it writes worse: shorter, more
literal, more repetitive, and worse at holding a persona across a long conversation.

**Measured on the Light tier, 2026-07-30** (Qwen3-1.7B-Q8_0, 28 GPU layers, 20 sessions of
16 turns = 320 turns, same brief and questions as the 4B run):

| | Light (1.7B) | Standard (4B) |
|---|---|---|
| Departures from stated facts | **0 of 320** | 0 of 320 |
| Median time per reply | 260 ms | 301 ms |
| p90 | 781 ms | 614 ms |
| Median reply length | 45 chars | — |

**These milliseconds are not the 2.0 s quoted above, and the two are not comparable.** This
harness measures generation alone — text out of the model, no speech synthesis, no audio
device. The 2.0 s is the whole chain a player experiences: prompt, generation, synthesis, and
the first sample reaching the speakers. A reply generated in 301 ms still takes about two
seconds to be *heard*.

The small model holds a brief exactly as reliably as the larger one. What it loses is
manner, not memory: it answers in flat, complete sentences ("I have worked at the station
for three years") where the 4B is terser and more in character.

**So a design that asks the model to REMEMBER survives this tier, and a design that asks it
to PERFORM does not.** That is the practical meaning of the advice above.

A design that leans on the deterministic half (state, thresholds, events) degrades
gracefully, because that half is identical on every tier. A design that leans entirely on the
model's writing quality degrades badly. That is worth knowing before you build the game
around it, not after.
