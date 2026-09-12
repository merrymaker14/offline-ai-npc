# Recipes

Five shapes this plugin is actually good at, with what each one uses and roughly what it
costs to build. Times assume you have done the [quickstart](GettingStarted.md) once and are
comfortable in Unity; they are for the wiring, not for your art or your writing.

---

## 1. Replacing a dialogue tree, in an afternoon

**What it is.** One character who answers anything, instead of three canned options. The
fastest route from import to something worth showing.

**Uses.** Dialogue + memory. Nothing else.

**Configure.** A persona (who she is, how she speaks, three or four facts), a voice, a
push-to-talk key or a text field.

**About two hours**, most of it writing the persona.

**Watch for.** Worded length limits do not work on small models — set the token ceiling. And
build the system prompt once, not per turn, or every reply pays the 2.1 s cold cost.

---

## 2. A companion who reacts to the room

**What it is.** She notices what is actually around her, and mentions it unprompted.

**Uses.** Dialogue + **perception**.

**Configure.** A `PerceptionQuery` on the character, POI components on the objects worth
noticing, a description per object, occluder layers set to your walls.

**Half a day**, mostly tagging objects.

**Why it matters, measured.** Same scene, same model. *Perception off:* she mentioned a
fireplace, a window seat and a cat — none existed. *Perception on:* she spoke only about real
objects. This is the single highest-value system in the package for making a character feel
present.

**Watch for.** Objects with no renderer. Line of sight is measured to the centre of the
renderers, so a normal prop is fine wherever its pivot sits; an empty marker is aimed at its
pivot, and a pivot on the floor reads as hidden behind the floor. Give markers an Aim Point.

---

## 3. An interrogation scene

**What it is.** The player asks anything; the character has something to hide; how open she
is changes as the conversation goes.

**Uses.** Dialogue + **state** (one axis) + threshold events.

**Configure.** One axis with three bands and the game events that move it. Start from
[the short path](State.md#the-short-path-first) — ten lines, no assets.

**A day**, including the visible consequences.

**The rule that makes it work.** Deterministic causes, deterministic consequences. The player
presses, the axis drops, and *you* change posture or lighting on the band change. State
colours her speech about six times in ten; the posture is exact every time. Build the loop on
the exact half.

**Also:** put the checkable facts in the character's brief and the discrepancies in the
player's evidence — not in the model's reliability. Measured over 320 turns, a 4B held its
brief with zero unforced departures; it is a reliable witness to what you told it, and an
unreliable arithmetician (a derived figure came out wrong in 19 sessions of 20, the same way
every time). Never make the player check the model's arithmetic.

---

## 4. A shopkeeper or quest-giver

**What it is.** She does things, not only says them — points at stock, opens the ledger,
marks a quest.

**Uses.** Dialogue + **actions**.

**Configure.** Register a few verbs with their targets; wire each to a method. Grammar makes
the payload well-formed, so you parse a struct, not prose.

**Half a day.**

**Watch for.** The verbs go in the cached system prompt; the *targets* arrive per turn,
because what she can reach changes as she moves. Baking the targets into the system prompt
means she names objects that are no longer there.

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

A crowd. Every recipe here has **one character generating at a time**. Two at once costs
about 5× on the player's own reply. See [Is this for your game?](IsThisForYourGame.md).
