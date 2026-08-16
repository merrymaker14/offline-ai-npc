# The interview demo

A five-minute scene where you question a woman across a desk and decide whether to clear
her. She is not on rails: every answer comes from a language model running on your machine,
she hears you through your microphone, and she speaks with a voice synthesised locally.

![The interview demo running](images/interview-demo.png)

> **Play it first, if you would rather see than read:** https://merrymaker14.itch.io/the-interview — a free
> Windows build, about 788 MB, which fetches its language model on the first launch.
>
> **Where it lives.** The scene is `Assets/Demo/Scenes/InterviewDemo.unity` in the project
> repository. It is not packaged into `Samples~` yet — the three samples that ship are
> HelloNpc, LivingCharacter and WorldAware. This page describes it because it is the fullest
> answer to "what does a finished thing built on this look like".

---

## What it is for

Three questions get asked about a local-model plugin, and a demo is the only honest way to
answer any of them:

| The question | What the demo shows |
|---|---|
| *Does it actually work?* | A whole conversation, spoken aloud, with nothing authored in advance |
| *Will it run on my machine?* | The equipment panel prints your tier, your model, your tokens per second and your time to first audio, live |
| *What do I have to write myself?* | Every piece the demo uses is public API — the interview logic is ordinary C# on top of it |

It is deliberately not a technology showcase with buttons labelled "test perception". It is a
small game, because a plugin that only demos well is a plugin nobody finishes shipping with.

---

## The premise

You are a clearance officer on a night shift. Your supervisor, Verey, has left you a candidate
and a file about her. Your job is to work through the form, decide whether the file and the
woman agree, and sign.

There is a catch, and it is the point: **the evidence cannot tell you what she is.** She is a
human or an android on a coin flip, and the contradictions in her file are seeded
independently of that. Clearing an android is not a loss. Detaining a human is not a loss
either. There is no score, because a score would turn it into "guess whether it is an AI",
which is a worse game and a dishonest one.

What you get at the end is the truth beside your own marks: what she actually was, which of
her claims really did disagree with the file, and where your reading matched.

---

## What you do

**Ask her things.** Type into the box and press Enter, or hold **V** and speak. Speech is
transcribed locally by Whisper and sent as a question the moment it is recognised — no second
keystroke, because having said something out loud and then being asked to press a key breaks
the one illusion the demo exists to sell.

**Three ways to ask**, and they cost different amounts:

| | What it does | Composure |
|---|---|---|
| **ASK** | a plain question | **+6** — neutral ground lets her settle |
| **PRESS** | lean on an answer that disagrees with the file | **−18** |
| **ACCUSE** | say out loud that she is a machine | **−22** |

Composure starts at **70** and is visible in the status line as a band: `Settled`, `Guarded`,
`Cornered`. It is not decoration — below **8** she stops cooperating and the interview ends
whether you were finished or not. About five hard presses gets there, so pressure is a
resource you spend rather than a button you hold.

Repeating a question she has already answered costs 7. Long silences cost 4: she notices.

**Mark the form.** Eight items, each with the file's version of it. Confirm the ones she
backs up, contradict the ones she does not. The first item is already filled in — that is
Verey's, and the form says so; override it if you disagree.

**Sign.** `CLEAR` or `DETAIN`, at any point. You have eighteen questions; signing early is
allowed and sometimes the right call.

---

## What to watch while you play

The green panel, top right, is the plugin talking about itself:

```
tier: Standard
model: qwen3-4b-q4km
tok/s: 20.9
to first audio: 2532 ms
```

- **tier** — what the hardware probe decided your machine can carry ([Hardware tiers](HardwareTiers.md))
- **model** — which model that tier chose from the catalog
- **tok/s** — generation speed on your GPU, measured, not claimed
- **to first audio** — from your question to her first spoken syllable

That last number is the one that matters, and it is measured the honest way: not "the model
finished" but "sound came out of the speakers". The first turn of a session is slower than the
rest — the prompt cache is filling — and [Limitations](Limitations.md#latency) gives the
distribution across twenty-one measured turns.

Watch her, too. She breathes, shifts her weight, and turns her head — body first, then eyes —
toward things you mention that are actually in the room. The tape recorder is a real
[point of interest](Perception.md); she looks at it when it comes up, and she does not
invent objects that are not there.

---

## What is plugin and what is demo

Worth knowing if you are reading the code to copy from it.

| Comes from the plugin | Written for the demo |
|---|---|
| `StreamingReplyParser` — tokens in, speakable sentences out | `InterviewSession` — turns, composure, endings |
| `StreamingSpeechSession` — synthesis and playback in order | `CandidateFactory` — the woman, her file, the seeded contradictions |
| `PersistentMicRecorder`, `UtteranceGate` — push-to-talk and the silence filter | `InterviewHud` — the desk, built in code |
| `TTSEngineManager`, `PiperEngine` — the voice | `CandidateGaze`, `SeatedIdle` — where she looks and how she sits |
| `AIPointOfInterest`, `PerceptionQuery` — what she can see | `FaceAnimator` — blinking and mouth frames |
| `TierCascade`, `ModelCatalog` — what runs here | `InterviewRoom` — the glue between them |

The demo assembly references the plugin and nothing of the game around it. That is the
interesting property: it was written against the public API by someone with the source open,
which is how several of the documentation pages you are reading got corrected.

---

## Running it

1. Open `Assets/Demo/Scenes/InterviewDemo.unity`.
2. Press Play. The first start loads the model — several seconds during which the equipment
   panel is still filling in.
3. Ask her something.

It needs the same three things the rest of the plugin needs: a model in `StreamingAssets`,
Piper with a paired voice, and — for speech input only — a Whisper model. `Tools ▸ Offline AI
NPC ▸ Check my setup` names whichever is missing.

**English only, and the settings screen says so rather than pretending.** The demo ships one
voice, and her persona, the file and the epilogues are written in English. The language row
lists all four the plugin has configured and greys out the three this download cannot voice —
they need a voice file the demo does not carry. Dialogue and recognition would work in any of
them; the pipeline underneath is the same one that speaks Japanese and Spanish
([Languages](Languages.md)).

Ask her in another language and she declines rather than answering: an English synthesiser
handed Russian produces phonetic noise, and a player hearing that concludes the speech is
broken rather than the language unsupported.

**Desktop only, in this version.** The scene switches XR off on purpose and runs on mouse and
keyboard. PC VR is planned — the mode detection is one line, but the HUD is a screen-space
canvas that does not exist inside a headset, so a VR build needs it in world space with
ray-based input first. Standalone Quest is not a target and will not become one: the model is
gigabytes and the speech engines are separate desktop processes.

---

## The endings

Four, from what she was crossed with what you signed, and none of them is a verdict on you:

| | You cleared her | You detained her |
|---|---|---|
| **She was human** | she goes back to her shift | her sister keeps writing to the station |
| **She was an android** | it holds, for now | the file that came down afterwards said she was human |

The reason to play it twice is that the other assignment reads completely differently against
the same evidence.
