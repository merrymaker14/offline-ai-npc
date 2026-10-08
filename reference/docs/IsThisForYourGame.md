# Is this for your game?

Read this before you buy. It is written to talk the wrong buyer out of the purchase, because
a refund and a one-star review cost more than one sale is worth — and because the shape of
this plugin genuinely suits some games and genuinely ruins others.



---

## The one thing to understand first

**Budget generation alongside the rest of your game.** Characters can share an LLMUnity server or use separate hosts.
Concurrent requests on a shared server can queue; the server configuration and available hardware determine concurrency.

Give the player's conversation priority. In a tavern, generate replies for the selected or nearby NPCs,
and use recorded chatter for the room. For a companion, generate comments between encounters and use
authored audio for an immediate combat alert. Test your chosen model and voice while the game is rendering.

---

## Fits well

**A small cast.** One to a handful of characters. A companion, a shopkeeper, a suspect, a
roommate. One conversation at a time is the design centre.

**Player-initiated, turn-shaped conversation.** The player speaks or types, the character
answers. This is a dialogue system, not a barking system.

**Genres built around talking.** Visual novels. Life and social sims. Interrogation and
detective scenes. Companion characters. VR social experiences. Immersive sims with a few
deep NPCs rather than many shallow ones.

**Games with a defined hardware budget.** Plan memory and generation time alongside rendering.
A small model can run on CPU; GPU use depends on your chosen setup. See [Hardware tiers](HardwareTiers.md).

**Teams who work with an AI coding agent.** A character who answers differently every time is
tiring to test by hand: press Play, walk over, talk, read, stop, change a number, repeat. The
package ships an MCP server for the editor, off until you switch it on, through which Claude
Code, Cursor or Codex can ask the character something, read exactly what the model was told,
see why the door is or is not in its context, change it and ask again — see
[Agent tools](AgentTools.md).

**Offline and privacy as requirements.** With local engines: no API keys, no per-call
billing, no rate limits, no network at all. Nothing of the player's leaves the machine, and
there is no telemetry in this package — not even anonymous. If your game must work on a
plane, in a school, or under a privacy policy that forbids sending player speech to a third
party, that is the case this was built for. In the editor, the optional MCP server is the one
exception, and yours to choose: it hands project data to the coding agent you connect, and
an agent that runs its model in the cloud sends it on to its provider — see
[Agent tools](AgentTools.md#safety).

---

## Does not fit

Plainly, so nobody is surprised after paying.

**Mobile, web, or console.** This package targets desktop games. Windows has been exercised;
the complete macOS/Linux path is not verified with matching native engines and
a built player. Do not infer verified support from a dependency's platform list.
Mobile, web and consoles are not currently supported.

**Unbounded background generation.** Keep ambient requests within a budget and pause them for the player.
A populated tavern can combine generated conversations with recorded room chatter; measure how many
active conversations your setup can sustain.

**Immediate combat barks.** Use authored audio for an alert that must play as soon as an enemy spots the player.
Generated speech can supply a companion's remarks between fights; measure its complete input-to-playback path.

**Tightly authored narrative.** The grammar constrains the *shape* of a reply — that an
action payload is well-formed — never its content. If a line must be
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

**Many characters.** Six residents do not require six simultaneous requests. Activate the conversation
the player is having and schedule the others. If your design needs simultaneous generation, test it
with the actual server configuration, model, voice and game workload.

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
package ships a catalog of licence-checked options and a download manager, but not the
weights themselves.

Speech synthesis for the built-in language definitions is Qwen3-TTS (Apache-2.0 weights,
MIT engine, ten languages, nothing copyleft): its Windows x64 CPU library comes with the
package, and you download its two model files in Model Manager. Piper is a second engine, an
external program you install. Only Windows has been exercised for either. If you choose Piper and redistribute
it, note that it links espeak-ng under GPL-3.0 — see [Licensing](Licensing.md), which
explains exactly what that obliges and how to avoid it.

---

## Still unsure?

Open the Hello NPC sample from Welcome, press Play, and read your own numbers:
`Tools ▸ Offline AI NPC ▸ Live verification` times real turns on *your* machine — to
synthesized audio, with the tier and the layers on the GPU. It needs Play mode; outside it,
**Advanced ▸ Speak one line (Piper)** plays a fixed Piper sentence with no model.
"Will this run acceptably here" is the one question no cloud-based competitor can answer
for you, and the only honest way to answer it is on your hardware.
