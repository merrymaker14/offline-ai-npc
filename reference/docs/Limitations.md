# Limitations

Every limit here is stated with its mitigation where one exists, and stated bare where none
does. The goal is that you are never surprised — not that every sentence carries a
disclaimer.

All figures come from measurements on an **RTX 3060 Laptop (6 GB VRAM), 32 GB RAM, Qwen3-4B
Q4_K_M with all 36 layers on the GPU**. Your numbers will differ; the tooling that produced
these is in the package (`Tools ▸ Offline AI NPC ▸ Live verification`) so you can produce
your own.

---

## Concurrency

**The limit.** All characters share one model server and requests serialise. Measured, same
mode both rows:

| | Median to first audio |
|---|---|
| One character generating | 2.4 s |
| Player's turn while background characters generate | **12.7 s** |

Roughly 5×. The worst single turn in that contended run took 125 s.

**The mitigation.** Suspend background conversation the moment the player starts speaking,
rather than when their speech has been transcribed — the transcription itself takes seconds
you have already lost.

```csharp
// The player pressed push-to-talk. Everything else stops generating NOW.
_pushToTalk.RecordingStarted += () => _ambientChatter.Suspend();
_dialogue.ReplyFinished     += () => _ambientChatter.Resume();
```

Suspend on the *input* event, not on the transcript — that single change is the difference
between the two rows above. Waiting for the transcript costs you the whole recognition pass
before the characters stop talking.

**What has no mitigation.** Two characters genuinely talking to each other while the player
also talks. One of the three waits. Design around it.

---

## Latency

Measured over 21 warm turns, one character, nothing contending, through the shipping path
(speech starts at the first finished sentence):

| | |
|---|---|
| Median to first audio | **2019 ms** |
| p10–p90 | 1545–2761 ms |
| Range | 1232–3013 ms |
| First turn of a session (cold) | **2.1 s** |

Measured 2026-08-16, 21 warm turns, English, the streamed path, on a **cleared history** —
the run is kept as `docs/measurements/latency_clean-history_streamed_4B_2026-08-16.txt`, and its
header records the history it started from.

**The slowest warm turn in twenty-one took 3013 ms**, and the spread is narrow — but design
for the tail rather than the median: a design that cannot absorb an occasional three-second
pause will feel broken on those turns.

**Mitigations.**
- The cold first turn is prompt-cache warm-up. Fire one throwaway generation during a loading
  screen or a scene fade and the player never meets it.
- Give the character something to do while generating — a glance up, a breath, a posture
  change. Two seconds of a character visibly thinking reads very differently from two seconds
  of a frozen face.
- Keep the system prompt stable. It is cached; changing it mid-session pays the cold cost
  again. See [Dialogue](Dialogue.md#the-prompt-cache).

**What has no mitigation.** The floor is the floor. If you need sub-second responses, this is
the wrong technology, not the wrong configuration.

---

## Speech recognition is a second wait, and it is the larger one

Every latency figure above is measured **from the moment text is submitted**. If your player
speaks rather than types — the configuration this plugin exists for — transcription happens
first, and it is not free.

| | |
|---|---|
| Whisper-small, one short spoken phrase | **7908 ms and 8004 ms** |
| Measured | in the interview demo, 2026-08-16, while the language model held the same GPU |
| What the player experiences | that, and then the figures above |

Two things follow, and neither is a defect in the plugin:

- **The model size is your decision, and it is a real trade.** `tiny` and `base` transcribe
  several times faster and get more words wrong; `small` is what these numbers came from.
  Wrong words are worse than they sound here, because the transcript is what the character
  answers — a misheard question produces a confident answer to something nobody asked.
- **It shares the GPU with the language model.** These numbers were taken with both resident,
  which is the shipping configuration; recognition alone on an idle machine is faster.

The plugin reports the generation half through `StreamingSpeechSession.TimeToFirstAudioMs`,
measured from the first unit enqueued. Recognition happens before that and belongs to your
code, so time it there if you want to show the whole trip.

---

## Switching language mid-session

Changing language stops and restarts the speech engine with a different voice model, and
invalidates the prompt cache. Rapid switching is coalesced — only the final selection is
applied — so a settings dropdown being dragged does not queue up five restarts.

**How much the prompt-cache half costs was measured, and the honest answer is "it depends on
your prompt, and often it is lost in the noise".** Six passes, 4B, short system prompts: the
first turn after a switch came out anywhere from 1080 ms FASTER to 2550 ms slower than the
warm average, because reply-length variance is larger than the effect. With this project's
full system prompt — persona, memory replay, action verbs — the first turn of a session
costs about 2.1 s, and a language switch pays that again.

The rule to take away is not a number: **the bigger your system prompt, the more a language
switch costs, so switch on a menu screen rather than mid-conversation.**

---

## Desktop only

Windows, macOS and Linux. Not mobile, not web, not console. The model file is gigabytes and
the speech engines are external processes; neither survives those platforms.

No mitigation. It is not on a roadmap.

---

## Output is probabilistic

A language model produces different text every run, occasionally something off-key, and it
will not deliver an authored line verbatim.

**Mitigations.**
- Grammar constrains the *shape* of a reply — one sentence, a well-formed action payload —
  reliably, because tokens that would break the shape have no probability left. See
  [Actions](Actions.md).
- The token ceiling and sentence limit are what actually keep replies short. **Small models
  ignore worded length instructions**: "reply in one short sentence" in a persona is a
  suggestion, the ceiling is not. Tune the ceiling, not the wording.
- For lines that must be exact, author them and use the model for the space between.

**What has no mitigation.** You cannot guarantee any particular sentence. Plan for it.

---

## State affects speech only sometimes

This one is easy to overstate in either direction, so precisely:

| | Reliability |
|---|---|
| A state value, its band, and its threshold event | **Exact, every time** |
| A state descriptor changing how the model *speaks* | **~6 times in 10** (0 with the system off) |

Measured by asking the character directly about her state. The deterministic half is a
mechanism you can build on; the speech colouring is a bonus that does not always arrive.

**The rule that follows: every visible consequence of state must have a deterministic
cause.** If a character's tiredness matters, show it in posture, pacing or an event — and let
the speech colouring be the extra. A design whose core loop rides on the probabilistic half
will feel unreliable exactly when someone is judging it.

---

## Perception is opt-in, and matters more than it sounds

Without it, characters invent surroundings. Measured, same scene, same model:

- **Perception off:** the character mentioned a fireplace, a window seat and a cat. None
  existed.
- **Perception on:** she spoke only about objects that were actually in the room.

**Mitigation:** turn it on. See [Perception](Perception.md). The cost is a coarse-timer
recompute, not per-frame work.

---

## Voices come in pairs, and a missing partner is silent

Every Piper voice is two files: `name.onnx` and `name.onnx.json`. **If the `.json` is
missing, synthesis produces silence and no error** — the engine starts, reports ready, and
says nothing.

**Mitigation:** the setup checker (`Tools ▸ Offline AI NPC ▸ Check my setup`) reports an
unpaired voice as a problem. Run it after adding any voice.

---

## Pause: what each part does at `timeScale = 0`

Decided per subsystem, because the right answer differs.

| Subsystem | Clock | At `timeScale = 0` |
|---|---|---|
| State axes (decay, needs) | scaled | **Freeze.** She does not get sleepier while the player is in a menu |
| Perception | scaled | **Freezes**, consistently with state |
| Speech queue | **unscaled** | **Keeps running** — see below |
| Speech-process watchdog | unscaled | **Keeps running.** An external process lives on wall clock |
| Generation already in flight | off the game loop | **Continues**, deliberately |

**The speech queue is the non-obvious one.** `AudioSource.Play` does not obey `timeScale`:
a line already sounding keeps sounding through a pause. Every timer around playback is
therefore unscaled, so the bookkeeping stays beside the sound that is actually playing.

Scale those timers instead and the failure is quiet: audio runs while the code waiting for
it stands still, the subtitle hangs on screen, the queue never advances and the session
never ends. Worth knowing if you write your own queue.

Generation is not cancelled on pause because it has already been paid for, and cancelling
would cost a cold prompt cache (~2.1 s) on resume for no benefit. If your game wants a
pause to abandon the reply, call `Cancel()` on the session yourself.

**Behavioural verification of this needs Play mode.** The decisions above are implemented
and reasoned; watching a menu open mid-reply is not something a unit test can do.

---

## Verification needs Play mode for dialogue

Voices can be auditioned from the editor without entering Play mode. **Dialogue cannot.** The
language model is constructed in `Start()` and its continuations only run inside the player
loop, so a live dialogue check requires Play mode.

No mitigation — it is how Unity's lifecycle works. Documented so the tooling's scope is not
mistaken for a bug.

---

## Not included

Named so you do not go looking:

- **RAG / document retrieval.** Not present.
- **Lip sync.** The demo project drives a jaw bone itself; the plugin does not ship a
  solution.
- **Emotion or voice-style control in TTS.** Piper voices have a fixed delivery.
- **Streaming speech recognition.** Recognition runs on a finished utterance, not
  continuously.
- **Turn history in the prompt debugger.** The debugger exists and IS broken down by
  section — a static-prefix column and a this-turn column, each section collapsible with
  its own token count. What it does not show is previous turns: you see the prompt for
  one turn, not the conversation that led to it.
