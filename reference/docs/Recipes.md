# Recipes

Five shapes this plugin is actually good at, with what each one uses and roughly what it
costs to build. Times assume you have done the [quickstart](GettingStarted.md) once and are
comfortable in Unity; they cover wiring and the small persona/configuration text described
below, not your art or broader narrative writing.

---

### Choose a speech setup for your game

Start with typed dialogue. Add Whisper when players need a microphone, then choose a ready voice:

| Your priority | Start with |
|---|---|
| A quick reply and a suitable voice for your language | Piper with that voice's `.onnx` / `.onnx.json` pair |
| One voice engine across several supported languages | Qwen3-TTS with a named CustomVoice speaker |
| No spoken replies | Keep text dialogue; speech output is optional |

The built-in Qwen speech presets use the 0.6B CustomVoice Q4 talker and Q8 codec. New Qwen engine components use the bundled CPU DLL with **External server URL** and **Style** empty, and the existing 1.5-second lead buffer. Choose one of the nine ready speakers; creating a voice from a description (VoiceDesign) is not part of this version. Delivery instructions require a separately checked 1.7B CustomVoice setup. Check the language, voice terms and response time on your players' hardware; see [Languages](Languages.md), [Hardware tiers](HardwareTiers.md) and [Licensing](Licensing.md).

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no manually started HTTP server, executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).

## 1. Replacing a dialogue tree, in an afternoon

**What it is.** One character who answers anything, instead of three canned options. The
fastest route from import to something worth showing.

**Uses.** Dialogue + memory. Nothing else.

**Configure.** A persona (who the character is, how it speaks, three or four facts), a voice, a
push-to-talk key or a text field.

**About two hours**, most of it writing the persona.

**Watch for.** Use a token ceiling to bound reply length. Cache stable persona/schema
instructions and refresh changing facts per turn.

---

## 2. A companion who reacts to the room

**What it is.** The character notices what is actually around, and mentions it unprompted.

**Uses.** Dialogue + **perception**.

**Configure.** A `PerceptionQuery` on the character, POI components on the objects worth
noticing, a description per object, occluder layers set to your walls. In your dialogue
code, `Recompute()` before the turn and `DescribeContext(languageCode)` in the user message
([Perception](Perception.md)).

**Half a day**, mostly tagging objects.

**Why it matters.** `PerceptionQuery` supplies nearby objects selected by your query.
Inspect its snapshot in your scene and give important objects clear descriptions.

**Watch for.** Objects with no renderer. Line of sight is measured to the centre of the
renderers, so a normal prop is fine wherever its pivot sits; an empty marker is aimed at its
pivot, and a pivot on the floor reads as hidden behind the floor. Give markers an Aim Point.

---

## 3. An interrogation scene

**What it is.** The player asks anything; the character has something to hide; how open it
is changes as the conversation goes.

**Uses.** Dialogue + **state** (one axis) + threshold events.

**Configure.** One axis with three bands and the game events that move it. Start from
[the short path](State.md#the-short-path-first) — ten lines, no assets.

**A day**, including the visible consequences.

**The rule that makes it work.** Let game code set the state and drive posture or lighting
from band events. State hints can affect the model's wording; visible consequences should
follow your game rules.

**Also:** put checkable facts in the character's brief and discrepancies in the player's
evidence. Validate derived quantities in game code.

---

## 4. A shopkeeper or quest-giver

**What it is.** The character does things, not only says them — points at stock, opens the ledger,
marks a quest.

**Uses.** Dialogue + **actions**.

**Configure.** Register a few verbs with their targets; wire each to a method. Grammar makes
the payload well-formed, so you parse a struct, not prose.

**Half a day.**

**Watch for.** The verbs go in the cached system prompt; the *targets* arrive per turn,
because what the character can reach changes as it moves. Baking the targets into the system prompt
means it names objects that are no longer there.

---

## 5. A roommate or life-sim character

**What it is.** Someone with moods and needs that move over hours, who is different at
midnight than at noon.

**Uses.** Dialogue + **state** (several axes, traits, persistence).

**Configure.** An axis catalog, a trait preset per character, a persistent store, and a
coarse tick.

**A day or two**, most of it tuning rates so a day of game time feels right.

**Watch for.** Two characters with the same catalog and no trait presets behave
identically, which reads as one character with two faces. Traits are what separate them.

**And:** persistence needs a store. The plugin ships `PlayerPrefsStore` for prototypes and
a `KeyValueStateStore` you point at any key-value storage; a real save system is yours.

---

## What none of these are

A crowd. Every recipe here has **one character generating at a time**. Measure latency and
load in your build before adding background conversations. See [Is this for your game?](IsThisForYourGame.md).

---

## Checks to add to your game loop

Start with one character and typed dialogue. These checks use existing APIs; they do
not require a new model or a different voice backend.

| Situation | What to wire | Check before shipping |
|---|---|---|
| A player interrupts or leaves the scene | Call `HelloNpcCharacter.CancelReply()` for interruption. Keep the next input in your UI until `!IsBusy`; `TrySayText` returns whether a text turn was submitted. | Stop during generation and repair, then ask again. Late output must not affect the retired turn. Cancellation does not undo a completed action or create an input queue. See [Dialogue](Dialogue.md). |
| A prop moves or is removed | Use `PerceptionQuery` and register the currently available targets in `ActionSchema.Targets`. Remove an unavailable target from that registry. | Move an object between asking and acting; reject an absent or forbidden target. The receiver must also check current game facts. Perception text is context, not a guarantee about every model answer. See [Perception](Perception.md) and [Actions](Actions.md). |
| A purchase or quest changes game state | Route a registered action to your game method. Validate current stock, price, funds and quest permissions there before committing the game operation. | Test a repeated block and a handler that changes state before throwing. `ActionTurn.CompleteRepair` accepts only `NeedsRepair` turns; it is not a rollback or retry mechanism for a delivered action. Your handler owns transactions. See [Actions](Actions.md). |
| A suspect reacts to evidence | Use `NpcStateModel.Modify` for authored events, and `BandOf` to choose posture, lighting or access to an authored clue. Keep evidence and arithmetic in game data. | Verify the exact consequence without asking the model to decide it. Generated speech can reflect state probabilistically. See [State](State.md#the-short-path-first). |
| Relationships survive a save/load | Assign an `IStateStore` to `NpcStateComponent.Store`: `new KeyValueStateStore(new PlayerPrefsStore())` for a prototype, or a `KeyValueStateStore` over your own key-value storage. Keep the NPC identity stable across loads. | Test separate save slots and unavailable storage. Relationship and Need can persist; Mood is transient. Read the store's failure contract before saving over old data. See [State](State.md). |
| Voice is unavailable but text should work | Submit that turn with `TrySayText`. Clear the input only when it returns `true`. Leave Engine unassigned when the scene should never start a speech engine. | Test a missing or faulty voice separately from the language model. A text-only turn skips synthesis; the component's `Start` can still inspect/start an assigned engine. No microphone is required. See [Dialogue](Dialogue.md). |

Managed checks cover parser, state and cancellation contracts. Also exercise the actual
scene, model, save backend and chosen voice on the target player before release; this
page does not certify those integrations. For several NPCs, schedule requests in your
game and preserve each agent's conversation; there is no automatic multi-NPC queue.
