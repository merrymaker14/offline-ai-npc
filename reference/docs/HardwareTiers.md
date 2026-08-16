# Hardware tiers

The plugin probes the machine at startup, picks a tier, chooses a model for it, sizes the GPU
layer count against the real VRAM budget, and steps down if a load fails. Your game does not
have to ask any of that.

What it decides is printed once at startup:

```
Hardware: NVIDIA GeForce RTX 3060 Laptop GPU (5996 MB VRAM, discrete), 32498 MB RAM, 16 threads
Tier resolved: Standard — 3996 MB VRAM free after a 2000 MB game reserve
Startup verdict: tier Standard; model qwen3-4b-q4km, 36 GPU layers
```

---

## The tiers

| Tier | Machine | Model size | What the player gets |
|---|---|---|---|
| **Premium** | ≥ 10 GB VRAM | 7–8B | Best writing, full context |
| **Standard** | ≥ 3.5 GB VRAM | 3–4B | The reference configuration below |
| **Light** | below that, or ≥ 16 GB RAM and ≥ 4 cores with no usable GPU | 1–2B | Works, noticeably more stilted, slower |
| **Fallback** | anything less | none | **No language model.** A working state, not a crash |

Thresholds are VRAM *after* a reserve for your own rendering — 2000 MB by default, plus more
in VR. All of it is editable in a `TierPolicy` asset; the defaults are a starting point, not
a law.

**The reference machine**, which produced every latency figure in this documentation: RTX
3060 Laptop, 6 GB VRAM, 32 GB RAM, 16 threads → **Standard**, Qwen3-4B Q4_K_M, all 36 layers
on the GPU, 36 tok/s, **2.0 s median to first audio**.

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

**`Tiers.Current` is `HardwareTier?`, and it is null until a tier has actually been resolved** —
which does not happen until the first time the game runs. The comparison above is safe (a null
never equals `Fallback`), but anything that needs the value must say so:

```csharp
if (Tiers.Current is HardwareTier tier)
    Debug.Log($"Running at {tier}");
else
    Debug.Log("The machine has not been measured yet.");
```

It is nullable on purpose. "Nobody has measured this yet" and "this machine cannot host a
model" are different facts, and a property that answered `Fallback` to both would send code
written exactly like the snippet above to authored lines on hardware that runs the model
perfectly well. Null means the question is still open; ask again after the cascade has run.

---

## Forcing a tier while developing

You cannot test the low end on a machine that never resolves there. Set the PlayerPrefs key
`OfflineAINPC.ForceTier` to a tier value (`-1` disables), and
`OfflineAINPC.FailStarts` to make the next N start attempts fail so the downgrade cascade is
exercised on purpose.

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
manner, not memory: it answers in flat, complete sentences ("I have worked at Halden Station
for three years") where the 4B is terser and more in character.

**So a design that asks the model to REMEMBER survives this tier, and a design that asks it
to PERFORM does not.** That is the practical meaning of the advice above.

A design that leans on the deterministic half (state, thresholds, events) degrades
gracefully, because that half is identical on every tier. A design that leans entirely on the
model's writing quality degrades badly. That is worth knowing before you build the game
around it, not after.
