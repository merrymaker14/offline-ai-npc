# Limitations

Every limit here is stated with its mitigation where one exists, and stated bare where none
does. The goal is that you are never surprised — not that every sentence carries a
disclaimer.

Check the complete conversation on your target machine while the game is rendering.
**Tools ▸ Offline AI NPC ▸ Live verification** measures a character's turn to synthesized
audio; for the player's full wait, also measure recognition and the start of playback.

---

## Concurrency

**Shared-server contention.** Characters on one LLMUnity server can compete for generation.
The server's concurrency setting and the hardware determine whether requests queue and how
quickly they finish. Separate hosts have their own memory cost. Test simultaneous turns
with your actual model, voice and game workload.

**Bundled Qwen speech.** The native route allows only one initialized context per process
and synthesizes requests sequentially. Starting a second native engine is refused
while the first still owns its context. Before replacing it, await successful
completion of the first engine's `StopAsync`. Each `SpeechRequest` can select its
own language and voice.

**The mitigation.** Suspend background conversation the moment the player starts speaking,
rather than when their speech has been transcribed — the transcription itself takes seconds
you have already lost.

```csharp
// An illustration: _ambientChatter and _dialogue stand for your own components;
// Begin and End are Push To Talk's, driven from your input with Listen To Key off.
void OnTalkPressed()
{
    _ambientChatter.Suspend();            // everything else stops generating NOW
    _pushToTalk.Begin();
}
void OnTalkReleased() => _pushToTalk.End();
// ...and once the character has answered, or the press was not sent:
// _dialogue.ReplyFinished += () => _ambientChatter.Resume();
// _pushToTalk.Dropped += (_, _) => _ambientChatter.Resume();
```

Suspend on the *input* event rather than waiting for the transcript, so background work
does not keep competing throughout recognition. Resume ambient conversation when the
player's turn finishes or their input is dropped.

**Design consequence.** Concurrent turns can queue on a shared server. Prioritise the
player's turn and budget background generation; more hardware or a different model setup
needs its own measurements.

---

## Latency

Time the first turn separately from later turns, and test longer conversations as well
as an empty history. Measure from the player's input to playback, so recognition, model
generation and speech synthesis are all included.

**Mitigations.**
- First-turn delay can include loading, backend initialization and prompt evaluation.
  Optional warm-up during loading may move some work earlier; it must finish within
  the real resource and cancellation limits and does not guarantee a fast next turn.
- Give the character something to do while generating — a glance up, a breath, a posture
  change. Two seconds of a character visibly thinking reads very differently from two seconds
  of a frozen face.
- Keep the system prompt stable where possible. Cache reuse depends on the backend
  and context; changing the prefix may require more prompt evaluation. See
  [Dialogue](Dialogue.md#the-prompt-cache) and [Current model usage](CurrentModelUsage.md).

**Design consequence.** Use recorded audio for an immediate alert. Give generated
conversation a visible waiting state, and check whether its longest pauses fit your scene.

---

<a id="speech-recognition-is-a-second-wait-and-it-is-the-larger-one"></a>
## Speech recognition adds its own wait

For voice input, recognition happens before the character can answer. Choose the Whisper
model using both transcription accuracy and turnaround time on your target machine.
If recognition and generation use the same GPU, test them together. A shopkeeper waiting
for a spoken order has a different budget from an immediate combat command.

`StreamingSpeechSession.TimeToFirstAudioMs` starts at the first unit enqueued for speech.
It does not include recognition or the LLM wait before that first unit. Measure from the
player's input event through the first audible playback to report the complete path;
keep those timestamps separate from this speech-session metric.

---

## Switching language mid-session

Changing language can change the cached prompt prefix; with Piper it also stops and restarts the
engine with a different voice model, while Qwen3-TTS switches in place. Rapid switching is
coalesced — only the final selection is applied — so a settings dropdown being dragged does
not queue up five restarts.

A changed prefix can require additional prompt evaluation. Measure language switching
with your chosen backend and model; use a menu screen if avoiding new work during a
conversation matters.

---

## Desktop only

**Windows x64 CPU is the bundled Qwen target.** The bundled DLL works in Unity Editor and Windows players; its required CPU instructions are listed in the speech setup. macOS/Linux native libraries are not included. Mobile, web and consoles are not supported by this package. Linux and macOS support is planned for a later version and remains unverified.

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no manually started HTTP server, executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).

**For Qwen speech**, keep the included Windows x64 native plugin and its five licence notices in the distribution; obtain the talker/codec through the configured player model locations or selected Model Manager build copies. The DLL is a Unity native plugin, not a manually copied server executable. The interview demo, built as a Windows player from this delivery, loads the DLL and speaks through it; test your own player build as well. For an explicitly configured external server, separately supply and test that server and its dependencies.


---

## Output is probabilistic

A language model produces different text every run, occasionally something off-key, and it
will not deliver an authored line verbatim.

**Mitigations.**
- Grammar constrains the *shape* of a reply — a well-formed action payload — reliably,
  because tokens that would break the shape have no probability left. It does not bound
  how long the prose runs. See [Actions](Actions.md).
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
| A state descriptor changing how the model *speaks* | Depends on the model and prompt |

Use state values and band events to drive game behaviour. The model may reflect a state
hint in its reply, but that wording is not deterministic.

**The rule that follows: every visible consequence of state must have a deterministic
cause.** If a character's tiredness matters, show it in posture, pacing or an event — and let
the speech colouring be the extra. A design whose core loop rides on the probabilistic half
will feel unreliable exactly when someone is judging it.

---

## Perception is opt-in, and matters more than it sounds

Perception gives the model an object snapshot from your scene. It can still invent details;
inspect the snapshot and validate important game facts in code.

**Mitigation:** turn it on. See [Perception](Perception.md). The cost is a coarse-timer
recompute, not per-frame work.

---

## Voices come in pairs

Every Piper voice is two files: `name.onnx` and `name.onnx.json`. A missing config caused
silent synthesis in earlier integrations. The current Piper driver checks the paired
config before spawning a voice for synthesis, reports the problem and refuses that
request. Setup and local import checks also validate the pair. These checks do not
prove that the native executable can synthesize on the target machine.

**Mitigation:** the setup checker (`Tools ▸ Offline AI NPC ▸ Check my setup`) reports an
unpaired voice as a problem. Run it after adding any voice.

Piper 1.2.0 can also miss its output file when Unity's temporary folder path contains
letters outside plain ASCII, such as a Cyrillic user name; every line then ends in a
synthesis timeout. See [Troubleshooting](Troubleshooting.md#piper-is-silent-and-every-line-ends-in-a-synthesis-timeout).

---

## Model folders cannot be reached through a link

Model files are written, copied and deleted only along ordinary folders, so a junction or
symbolic link cannot send them somewhere else. Downloads and imports refuse a models folder
reached through a link, an import refuses a file picked through one too, and a build that
includes models refuses a project opened through one. A build that includes no model is not
affected. Choose ordinary paths, or open the project from its real folder.

---

## Pause: what each part does at `timeScale = 0`

Decided per subsystem, because the right answer differs.

| Subsystem | Clock | At `timeScale = 0` |
|---|---|---|
| State axes (decay, needs) | scaled | **Freeze.** The character does not get sleepier while the player is in a menu |
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

Generation continues during pause by policy. Cancelling discards the in-flight reply
and may require work later; it does not imply a fixed cache-miss cost on resume. If
your game wants a pause to abandon the reply, call `Cancel()` on the session yourself.

**Behavioural verification of this needs Play mode.** The decisions above are implemented
and reasoned; watching a menu open mid-reply is not something a unit test can do.

---

## Verification needs Play mode for dialogue

Live verification generates a reply before it voices it, and the language model is
constructed in `Start()` with its continuations running only inside the player loop. So
Hello NPC and most characters are checked only in Play mode. Outside it, **Advanced ▸ Speak
one line (Piper)** says a fixed sentence through Piper, with no language model.

No mitigation — it is how Unity's lifecycle works. Documented so the tooling's scope is not
mistaken for a bug.

---

## Not included

Named so you do not go looking:

- **RAG / document retrieval.** Not present.
- **Lip sync.** The plugin does not ship a solution. The Interview demo animates mouth
  frames from the audio it plays, and a rig with a jaw bone can be driven the same way from
  the playing `AudioSource`.
- **Emotion control in TTS beyond a delivery hint.** Official 1.7B CustomVoice supports
  an optional *Style* instruction; 0.6B CustomVoice has no official instruction control.
  This is separate from VoiceDesign and cloning; see [Qwen speech settings](QwenUsage.md).
  There is no per-word prosody control, and Piper voices have a fixed delivery.
- **Streaming speech recognition.** Recognition runs on a finished utterance, not
  continuously.
- **Turn history in the prompt debugger.** The debugger exists and IS broken down by
  section — a static-prefix column and a this-turn column, each section collapsible with
  its own token count. What it does not show is previous turns: you see the prompt for
  one turn, not the conversation that led to it.
