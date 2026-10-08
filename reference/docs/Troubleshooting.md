# Troubleshooting

Ordered by how often it happens. Every message below is a string the plugin actually emits —
search for it here before searching the internet.

**First, always: `Tools ▸ Offline AI NPC ▸ Check my setup`.** It reports what is missing and
what to do about it, and it distinguishes "this is broken" from "this could not be
determined" rather than guessing.

---


![A failing check](images/setup-check.png)

This is what a failure looks like: the check that failed is red, and the line under it is
the fix rather than a restatement of the problem. Match your window to this one before
reading further — most of what follows is the long form of a line in that list.

Four markers, and the fourth is the one worth knowing:

| | Means |
|---|---|
| ✓ green | checked, and fine |
| ! amber | works, below the intended quality or speed |
| ✕ red | cannot work until you fix it |
| **? grey** | **nobody has measured this yet** — not a pass |

The grey ones are questions the editor cannot answer: your hardware tier before the game
has ever run, the speech processes before one is up. Press Play once and check again. Grey
is deliberately not green — "not measured" and "all good" must not look identical.

## Bundled Qwen native speech

For the included Qwen route, check the native library, supported CPU and talker/codec model files. Read the engine's LastProblem/Console diagnostic. A successful file scan does not prove native generation or sound. For an explicitly configured HTTP URL, check that server and its model separately.

**Windows x64 CPU is the bundled Qwen target.** The bundled DLL works in Unity Editor and Windows players; its required CPU instructions are listed in the speech setup. macOS/Linux native libraries are not included. Mobile, web and consoles are not supported by this package. Linux and macOS are not verified.

## The character speaks in the subtitle but there is no sound

For the included Qwen route, check the native library, supported CPU and talker/codec model files. Read the engine's LastProblem/Console diagnostic. A successful file scan does not prove native generation or sound. For an explicitly configured HTTP URL, check that server and its model separately.

If you deliberately use an external HTTP URL, inspect that server’s own startup, model and backend diagnostics. See [optional server configuration](Languages.md#external-qwen-server). These server installation errors do not apply to the ordinary DLL route.

**For Piper, first check that both voice files are present:**

> A Piper voice is a pair of files. Download both; the model alone loads and then says
> nothing.

A Piper voice is `name.onnx` **and** `name.onnx.json`. With the `.json` missing the engine
used to start, report itself ready, and synthesise silence; it now refuses the voice and
names the file, and the setup check flags an unpaired or half-written config.

**Fix:** download both files into `Assets/StreamingAssets/piper/voices/`.

---

## Piper is silent and every line ends in a synthesis timeout

> `[PiperEngine] Synthesis timeout/failure after 45s ('…', first line on this voice), file '….wav' never completed`

If every line ends this way, look at Unity's temporary folder path: on Windows it contains
your user name and the project's company and product names. Piper 1.2.0 takes the output
path it is given as text in the system's legacy code page, so a path with letters outside
plain ASCII — a Cyrillic or Chinese user name, say — can send the file elsewhere, and the
file the engine waits for never appears. This was found by reading the code and has not
been reproduced on a test machine.

**Ways out:** Qwen3-TTS, whose bundled native route writes no per-request WAV; Windows' *Use
Unicode UTF-8 for worldwide language support* (Settings ▸ Time & language ▸ Language &
region ▸ Administrative language settings); or company and product names in plain ASCII,
which helps only when the user name is ASCII too.

---

## Local Piper import is refused

**Import file** requires a nonempty `.onnx` and its readable, valid adjacent `.onnx.json`.
Keep both originals in the same source folder. If either destination already exists,
choose a different filename or inspect the existing pair before trying again; the import
does not overwrite it. Symbolic links and reparse points are refused by this operation.

If the error says `Left ... untouched`, inspect the named path. Its contents changed or
ownership could not be proved, so cleanup preserved it. Do not delete the named file
without checking it. The original source files remain in place.

**Cancel import** stops copying or verification cooperatively. The window stays available
while cleanup checks ownership before removing copies. A conflict message means another
operation still owns this path; cancellation does not release a worker's files before it
has actually finished. Wait for completion and retry. A download refuses a destination
whose presence, file identity, size or recorded timestamps changed after its replacement
intent was recorded; inspect the preserved destination and partial file before starting
a new attempt. A successful import reports its original destination even if the configured
models folder changed while the copy was running. On Windows, use ordinary drive or UNC
paths without a device/extended-namespace prefix or components ending in a dot or space;
these ambiguous path forms are refused.

---

## The first sentence starts late, or a sentence has gaps

Qwen speech may produce audio slower than playback. **Lead seconds** controls the initial buffer; raising it can smooth a line but adds delay and does not increase generation speed. Keep replies short and reduce competing CPU work. The included DLL has a fixed CPU profile. GPU speech requires an optional external setup verified separately.

---

## A sentence is cut off, or never spoken: "did not finish the line within 60 s"

If the line exceeds **Request Timeout Seconds**, inspect the engine diagnostic, shorten the reply and reduce CPU contention. The included DLL uses CPU; a longer timeout adds waiting, not speed. Stop or cancellation requests cooperative cancellation and still awaits the actual native worker before context free. A server GPU configuration is an optional, separately verified HTTP route.


---

## No model weights found

> `[OfflineAINPC] No model weights found. Expected one of: …`

The tier system resolved a tier, asked the catalog for that tier's model, and the file is
not on disk.

**Fix:** open `Tools ▸ Offline AI NPC ▸ Model Manager` and download the preset for your
language and tier, or place the `.gguf` under the exact file name the message lists in one
of the places the plugin looks — the Model Manager's folder, `persistentDataPath`, or
`StreamingAssets`, in that order. A renamed file is not found — the name in the manifest
is the name on disk.

---

## A model download stops, or fails after retries

> `no data arrived for 60 s after 3 automatic retries. The partial file was kept; Resume continues from it.`

A stalled transfer, a dropped connection and a busy or failing server (408, 429 or 5xx) are
retried by themselves three times, after 2, 4 and 8 seconds or after the server's
`Retry-After`, up to two minutes. After that the Model Manager shows the reason, and
**Resume** continues the partial file. A missing file or a refusal is not retried: the link
or the server is wrong. The Console says "downloaded and verified" only when a SHA-256 was
checked. Without a checksum it says only the size was checked, and "not verified" when the
catalog has no size either.

---

## A download, import or build says a folder "is a link"

> `'…' is a link (a junction or symbolic link). Model files are written, moved and deleted only along ordinary folders, …`

Model files are written, copied and deleted only along ordinary folders, so a junction or
symbolic link cannot send them somewhere else. Downloads and imports refuse a models folder
reached through one, and an import refuses a file picked through one too; a build that
includes models refuses a project opened through one. A build that includes no model is
not affected.

**Fix:** choose a models folder on an ordinary path in the Model Manager, pick a file to
import at its real location, and open the project from its real folder rather than through
the link — or leave the models out of that build.

---

## The character never says anything, and push-to-talk stops working

Almost always the busy lock. If your controller sets a `_busy` flag and an early return, an
exception or a cancelled coroutine skips clearing it, the character is locked out for the
rest of the session, silently.

**Fix:** release it in a `finally`, on every path. See
[Dialogue](Dialogue.md#the-parts-you-must-not-skip). This is the single most common
integration bug in this codebase's own history.

---

## Holding the push-to-talk key does nothing, or the screen says "Not sent: …"

**Nothing at all:** is Push To Talk on the character, with *Listen To Key* ticked? The key
is ignored while a text field has keyboard focus — click outside the text box first. If you
drive it from your own input, call `Begin()` and `End()`.

**"Not sent: …"** gives the reason, also in `PushToTalk.LastDrop` and the `Dropped` event:

| The screen says | Do |
|---|---|
| the press was too short | hold the key while you speak; a press under *Minimum Hold Seconds* (0.3) is discarded |
| nothing loud enough was heard | check the microphone, its level, and that Windows lets desktop apps use it (Settings ▸ Privacy & security ▸ Microphone) |
| no speech recognition component is on the character | install whisper.unity and add Whisper Speech Recognition, or your own `ISttEngine` |
| speech recognition is not ready: … | the detail names the model; download it in Model Manager ▸ **Speech recognition**, or set *Model File Name*. Just after entering Play it can say the tier is not settled yet: wait for the *Startup verdict* line in the Console |
| no words were recognized / only noise was recognized | speak closer to the microphone |
| "…" is what recognition invents from near-silence | the gate caught a typical Whisper hallucination; speak again |
| recognition failed: … | the detail is the recognizer's error, also in the Console. "English-only" there means an `.en` model with another language: download a multilingual one such as `ggml-base.bin` |

---

## Replies are much slower than the documented figures

Check, in this order:

1. **Is something else generating?** Background conversation costs about 5× — see
   [Limitations](Limitations.md#concurrency).
2. **Is this the first turn?** The first reply of a session can take longer than later ones;
   in the recorded development session it took about 2.1 s
   ([Limitations](Limitations.md#latency)). A warm-up turn during a loading screen moves that
   work out of play.
3. **Is the prompt changing every turn?** A changed system prompt can need processing again
   instead of reusing the cached prefix. Build the stable part once and put changing facts in
   the turn.
4. **Which tier resolved?** The startup log says so:
   `Startup verdict: tier Standard — …; model qwen3-4b-q4km, 36 GPU layers`. A machine that fell
   to a lower tier is running a smaller model on fewer GPU layers, and will be slower per
   token than the reference figures.

---

## The engine is not ready, or the process died

> A speech process died or failed to start. The plugin restarts one automatically within its
> budget; if this keeps happening, check the executable path…

Piper remains an external process: a dead voice is restarted on its next request and the default voice watchdog has a budget of three restarts per minute. The bundled Qwen DLL is an in-process context, not a watchdog child. Inspect LastProblem, model files and CPU support; await StopAsync before replacing its owner. If native cleanup cannot be confirmed, keep that owner and its diagnostic rather than treating the context as released. A server attached by URL is externally owned and is not restarted or stopped by this component.

**What you lose:** the reply in flight, not the session.

**If it happens constantly:** the voice file is likely corrupt or truncated. Re-download it
and check the file size against the model card.

---

## An engine you wrote against an external server says it is not ready

The `VoicevoxEngine` example on the Languages page talks to a separate application with an
HTTP server, and such a server takes time to boot. The example retries a health check and
flips to ready when the server answers; an engine of your own should do the same.

**Fix:** start the server before entering Play mode, or wait — the example connects on its own.

---

## A dependency is missing

**After an upgrade, errors about `LLMAgent` or `LLMClient`:** update LLM for Unity to
3.0.3 or newer. If 1.0 set `LLMUNITY_PRESENT` for an older loose-folder install, that
symbol can survive a broken compile: Unity cannot load the new detector yet. Remove only
`LLMUNITY_PRESENT` from Player > Other Settings > Scripting Define Symbols for the affected
target to recover compilation until you install the supported dependency. Details:
[Upgrading from 1.0](UpgradingFrom1.md).

> Install LLM for Unity (package id `ai.undream.llm`). Without it there is no model to talk to.

> Install whisper.unity (`com.whisper.unity`) to accept voice input. Typed input works
> without it.

Both are external and free. The plugin compiles without either — the features that need them
are compiled out, so a missing dependency is a missing feature and never a compile error. For
a package that is the assembly's version defines; for LLM for Unity installed as a folder
under `Assets`, it is the `LLMUNITY_PRESENT` symbol the plugin's detector sets.

> (newer than the tested versions; expected to work)

You are on a version this plugin has not been tested against. Usually fine.

---

## The character talks about furniture that is not there

Perception is off. Measured in the same scene: with it off the character mentioned a
fireplace, a window seat and a cat, none of which existed; with it on the character spoke only about
real objects.

**Fix:** see [Perception](Perception.md). Line of sight is measured to the centre of the
object's renderers, not to its pivot, so a floor-level pivot under a metre-high body no
longer hides it. A marker with no renderer is aimed at its pivot — give it an Aim Point at
the height a person would look at. `PerceptionQuery.Explain(poi)` says exactly why an
object is or is not in context.

---

## The character ignores "reply in one short sentence"

Expected. **Small models do not honour worded length limits.** The token ceiling and the
sentence limit are what actually keep replies short.

**Fix:** lower the ceiling, not the wording in the persona. The default is the reply
profile's 128 tokens. A language definition's **Max tokens** and **Max sentences** take
effect on a Hello NPC Character whose **Reply Limits** is **Current Language**, and in your
own dialogue code once it applies the language's length rule — see the *Reply length* rows
in [Languages](Languages.md).

---

## A language switch produces the wrong voice, or an English reply

Two different causes:

- **Wrong voice, right language:** the language has no voice bound for its code in the
  engine binding table. The manager logs which codes it has: `No engine bound for 'ko'.
  Bound languages: ja, en, es, ru, zh-Hans`.
- **Right voice, wrong language of reply:** the voice was switched but the prompt was not.
  Switch through your language manager so the system prompt is rebuilt, not through the TTS
  manager alone. This one hides well — the voice is correct both times, so the switch looks
  like it worked and only the words are wrong.

---

## The transcript comes back in a script nobody spoke, or as bracketed sound words

> the player said "do you hear me" and the box filled with the same katakana sound-word
> four times over

Two separate faults, and they arrive together often enough to look like one.

- **Wrong script:** recognition was told to expect a language the player is not speaking.
  Whisper Speech Recognition sets it from the project's current language on every press;
  with a `WhisperManager` of your own, check its `language` field. Recognition does not
  refuse a mismatch — it transcribes what it heard using the language it was told to
  expect, so English audio under a Japanese setting comes back as Japanese sound-words. Set
  the language to what your players speak; if you copied your speech setup from another
  scene, check this field first, because everything else in that setup copies correctly and
  only this one is scene-specific.
- **Bracketed sound words:** recognition annotates non-speech — `(coughs)`, `[BLANK_AUDIO]`,
  `*sighs*`, `♪` — and a run of those is not short, not silent, and not a known
  hallucination, so `UtteranceGate` passes it. **The gate does not strip annotations, by
  design:** it judges whether somebody spoke, and someone who coughs before a real question
  did speak. Deciding what to do with the annotation is the caller's, because a game that
  shows a transcript and a game that feeds one to a model want opposite things.

**Fix for the second:** Push To Talk already does this. On your own input path, strip
annotations before you call `Inspect(text, language)`, and treat a line that is *only*
annotation as nothing said. Removing the brackets rather than
rejecting the line matters — `(coughs) where were you on the fourteenth` is a real question
with a cough in front of it. `TranscriptCleaner.Clean(raw, out cleaned)` in the plugin does
exactly this: it strips `(...)`, `[...]`, `*...*` and note-marked runs, and returns
`OnlyNoise` when nothing is left.

---

## Verification says a language is not configured

> the live-verification window refuses a language code and lists the ones the catalog has

Correct and deliberate. Ask `LanguageRuntime.IsConfigured(code)`, which answers about the
catalog. Do not use `Find`/`FindOrDefault` for that question — they fall back to the default
language, so an unconfigured code comes back looking supported.

---

## Live verification cannot check a character outside Play

Every check generates a reply before it voices it, and the language model's agent finishes
starting inside the player loop, which does not run in edit mode. So Hello NPC and most
characters can be checked only in Play. Outside it, Hello NPC refuses at once and says so;
another character gets a few seconds, then the window says why, rather than waiting for a
load that cannot complete.

**Not a bug.** Enter Play mode; the same window works there.

When a custom probe calls your normal dialogue controller, direct its conversation
memory writes to a temporary `ConversationMemorySandbox(originalStore)` and restore the
original adapter only after cancelled generation has settled. This keeps probe questions
out of persistent memory without confusing an absent key with a saved empty value. Do
not restore history while a native generation can still append to it.

---

## Live verification played the line but did not mark the language verified

Expected. The window can tell that audio played, not which language it was in. After
**Speak** it asks whether the reply was spoken in the selected language, and only
**Yes, record it** marks the cell. **Advanced ▸ Live verification — verify everything
(console)** prints `PLAYED` and records nothing. A language without a built-in test line
gets an empty one for you to fill in, and the console sweep skips it.

---

## An agent's tool call fails

> Port 47371 is already in use — another program, or another Unity editor running this server, holds it. Choose another port.

Two editors have the server switched on, or another program owns the port. Pick another port in
`Tools ▸ Offline AI NPC ▸ Agent tools (MCP)` and give the client the new address.

> The editor did not start 'say' within 30 s. It is not updating: a modal dialog is open, it is importing or compiling, or a debugger has paused it.

Look at the Unity window. A dialog waiting for an answer holds every call; answer it and call again.

> The editor is not in Play mode, and 'guard' most likely generates only in Play.

Expected with LLM for Unity, for the reason in [Live verification cannot check a character
outside Play](#live-verification-cannot-check-a-character-outside-play). Have the agent
call `play_mode` with `action: "enter"` and wait until it reports `playing`.

A refused connection for a few seconds after entering or leaving Play is the script reload
restarting the server. The call works again once it is back.

---

## Removing the package

Delete `Assets/OfflineAINPC` from Unity's Project window: the plugin then removes the
`LLMUNITY_PRESENT` symbol it set for LLM for Unity installed as a folder. If you delete the
folder outside Unity, remove `LLMUNITY_PRESENT` yourself in Project Settings ▸ Player ▸ Other
Settings ▸ Scripting Define Symbols, for every platform you build; left behind, it breaks
the next install of the plugin into a project without LLM for Unity. Remove `AINPC_DEBUG`
there too if you turned on verbose logging — deleting the package leaves it either way.

Deleting the folder leaves everything the plugin keeps outside it; remove what you no longer
need:

- the models folder chosen in the Model Manager — on Windows `%LOCALAPPDATA%\OfflineAINPC\Models`
  unless you picked another;
- `ProjectSettings/OfflineAINPC/` and `ProjectSettings/OfflineAINPCModels.asset` — the
  required-models list and the build choices;
- `UserSettings/OfflineAINPC/verification.json` — Live verification results;
- the speech programs and voices you put in `StreamingAssets` (`qwen3-tts/`, `piper/`);
- the plugin's editor preferences, keys starting with `OfflineAINPC.`.

---

## Still stuck

`Tools ▸ Offline AI NPC ▸ Check my setup` ▸ **Copy as text** puts a report on the clipboard
you can paste into a support request: hardware, tier, model, dependency versions, what is
installed and what is missing. It is not sent anywhere — the plugin has no telemetry of any
kind — but file paths in it can contain your user name; look it over before you send it.
For a fuller log, turn on **Advanced ▸ Logging ▸ Verbose logging (AINPC_DEBUG)** and choose
**Advanced ▸ Logging ▸ Minimum level ▸ Debug**, reproduce the problem, and attach the
Console; set both back afterwards.

## A custom speech engine stalls or throws inside a nested coroutine

The speech driver owns nested iterators, including legacy one-buffer engines. Exceptions
in their factory, iterator or cleanup are reported and the unit can continue as subtitles.
Cancelling stops the nested work and ignores audio that arrives afterwards.

In Play mode the session's synthesis deadline runs in real time: a `WaitForSeconds` inside
your engine keeps its scaled duration, so a paused game still reaches the deadline. Code
after a fixed-update or end-of-frame wait stays in that Unity phase. Outside Play mode,
drive an engine that yields Unity wait instructions through the editor driver; a
standalone session does not guess how long they take.

If you drive `SpeechSynthesis.Run` yourself, stop its hosting coroutine and dispose its
returned enumerator when abandoning a wait. If you own a `StreamingSpeechSession`, call
`Cancel()`/`Dispose()` as part of your component's disable or interruption path.

## Scene wiring in the setup report

Check my setup inspects the Hello NPC sample's required Agent and LLM references.
Audio and Engine are optional connections for speech output; their absence does not
block a configured language model from answering in text. The check also inspects the
live-verification adapter's Agent/LLM wiring. It does not start a model,
add components or change the scene. A custom character can opt in by implementing
`OfflineAINPC.Diagnostics.ISetupDiagnosticSource` and reporting its required components
and references through `SetupWiringIssues`. Keep that collector read-only. An exception
is reported as an inspection failure and does not hide the other characters' findings.
No scene row means no declared issue was found; it is not proof of native or player readiness.
