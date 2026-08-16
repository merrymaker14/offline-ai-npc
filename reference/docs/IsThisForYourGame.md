# Is this for your game?

Read this before you buy. It is written to talk the wrong buyer out of the purchase, because
a refund and a one-star review cost more than one sale is worth — and because the shape of
this plugin genuinely suits some games and genuinely ruins others.

Every number below was measured on real hardware and is reproducible with the tools in the
package. Where something is unmeasured, it says so.

---

## The one thing to understand first

**All characters share one local model server, and requests through it are serialised.**

Everything on this page follows from that sentence. A local language model is a single
process holding several gigabytes of weights; you cannot run four of them, and requests to
the one you have queue behind each other.

Measured on an RTX 3060 Laptop (6 GB) with Qwen3-4B, median time to the player hearing the
first word:

| Situation | Median |
|---|---|
| One character, shipping path, nothing else generating | **2.0 s** |
| One character, nothing else generating, waiting for the *whole* reply | 2.4 s |
| Waiting for the whole reply **while other characters generate in the background** | **12.7 s** |

The two lower rows are the honest comparison — same measurement mode, so the difference is
contention and nothing else: **background conversation costs roughly 5×**. The 2.0 s figure
is the path a shipping game uses, where speech begins at the first finished sentence instead
of at the end of the reply.

No amount of tuning removes the 5×; it is the queue. The mitigation is in
[Limitations](Limitations.md#concurrency): throttle background conversation while the player
is speaking. The pattern is a few lines and it works, but you have to write it.

---

## Fits well

**A small cast.** One to a handful of characters. A companion, a shopkeeper, a suspect, a
roommate. One conversation at a time is the design centre.

**Player-initiated, turn-shaped conversation.** The player speaks or types, the character
answers. This is a dialogue system, not a barking system.

**Genres built around talking.** Visual novels. Life and social sims. Interrogation and
detective scenes. Companion characters. VR social experiences. Immersive sims with a few
deep NPCs rather than many shallow ones.

**Games that already gate on hardware.** VR titles, mid-to-high spec desktop. Your audience
has already accepted a GPU requirement, so the model's is not a new barrier.

**Offline and privacy as requirements.** No API keys, no per-call billing, no rate limits,
no network at all. Nothing leaves the machine, and there is no telemetry in this package —
not even anonymous. If your game must work on a plane, in a school, or under a privacy
policy that forbids sending player speech to a third party, that is the case this was
built for.

---

## Does not fit

Plainly, so nobody is surprised after paying.

**Mobile, web, or console.** Desktop only: Windows, macOS, Linux. This is not a roadmap
item — it is a consequence of shipping a multi-gigabyte model and external speech processes.

**Crowds of talking NPCs.** Several simultaneous conversations push a player's own reply
from 2.0 s to a measured 12.7 s. A tavern of twenty characters chatting in the background
is not something this can do, and throttling them means they are not really talking.

**Real-time combat barks.** The latency budget for "enemy spots you and shouts" is a few
hundred milliseconds. The median here is 2.0 s to first audio and the first line of a
session takes about 2.1 s. Use audio clips for barks; they are better at it.

**Tightly authored narrative.** The grammar constrains the *shape* of a reply — that it is
one sentence, that an action payload is well-formed — never its content. If a line must be
delivered word for word because the plot turns on it, a dialogue tree is the right tool.
**A dialogue system and this plugin are complements, not competitors:** author the beats
that matter, and use this for the space between them.

**Low-spec target audiences.** See [Hardware tiers](HardwareTiers.md). Below the lowest
tier the plugin degrades to no language model at all, which is a working state but not the
product you are buying.

**Anything needing guaranteed output.** A language model produces a different reply every
time, occasionally a bad one. There is a resilience layer so the game never crashes, but if
your design cannot tolerate an off-key line, this is the wrong tool.

---

## Fits with care

**Many characters where only one is active at a time.** A dormitory of six where you talk to
one is fine. Six talking at once is not. The distinction is whether they generate
simultaneously, not how many exist.

**Games leaning on the deterministic half.** State axes, thresholds and events are exact
every time and cost nothing; the language model is the expensive, probabilistic part. A
design that drives most of its behaviour from state and reaches for the model sparingly gets
the best of both. See [State](State.md).

**A first project.** It works, but you will be integrating an LLM, a speech recogniser and a
speech synthesiser, each with its own failure modes. Budget time for that rather than
expecting a drop-in NPC.

---

## What you also need

Two external dependencies, neither bundled, both free:

- **LLM for Unity** (LLMUnity), for the language model.
- **whisper.unity**, for speech recognition. Optional if you only want typed input.

And a model file — 1 to 5 GB depending on tier, which you or your player downloads. The
package ships a catalogue of licence-checked options and a download manager, but not the
weights themselves.

Speech synthesis is an external process you install (Piper, or VOICEVOX for Japanese). If
you redistribute Piper with your game, note that it links espeak-ng under GPL-3.0 — see
[Licensing](Licensing.md), which explains exactly what that obliges and how to avoid it.

---

## Still unsure?

Install a sample, press Play, and read your own numbers: `Tools ▸ Offline AI NPC ▸ Live
verification` times a real turn on *your* machine — first audio, tier, layers on the GPU.
"Will this run acceptably here" is the one question no cloud-based competitor can answer
for you, and the only honest way to answer it is on your hardware.
