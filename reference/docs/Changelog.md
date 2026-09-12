# Changelog — Offline AI NPC

All notable changes to the plugin. The format follows Keep a Changelog.

## [Unreleased]

### Fixed — perception
- The promise "does not invent, does not deny" now holds. A snapshot that is cut to the
  token budget says how many objects were left out (`PerceptionSnapshot.Omitted`,
  `IsTruncated`) instead of silently listing fewer; the grammar is narrowed AND widened as
  objects come and go, so a name that fell out of the block is not a name the model can
  still say — and one that came back is.
- `AimPosition` is measured against every renderer, not the first, and is no longer cached
  across moves. A prop whose pivot sits on the floor is aimed at its visible centre, so it
  is no longer "hidden" by the floor it stands on; the inspector stops warning about pivots
  and says the one thing that still matters: a marker with no renderer is aimed at its pivot.
- `PoiRegistry.Raise` reached nobody. Actions are now delivered to their target through
  `IActionReceiver`: a point of interest raises `OnNpcInteract` and marks the interaction
  itself, without the game having to.
- Affordances are enforced by the parser: a target that restricts its verbs
  (`IVerbRestrictedTarget`) is not resolvable under any other verb.
- Connecting words ("and 3 more", "nothing nearby", separators) are per language through
  `PerceptionPhrasing`, overridable per project; `For()` returns a copy so one character's
  edits do not leak into the next.

### Added — actions
- **`ActionTurn`**: one reply's worth of action handling — grammar on, act on the block
  exactly once however often the stream calls back, the one repair round with the
  action-only grammar, grammar off in `Dispose`. The documentation promised this pipeline;
  the code left every project to assemble it. The HelloNpc sample now runs it.
- `StreamingReplyParser.TryTakeMetadata` hands the block over once, which makes "dispatch
  once per reply" the natural code instead of a flag.
- `ActionPhrasing`: the prompt frame ("Available actions", "never read the action line
  aloud") and the repair prompt in the character's language for the five shipped codes.
- `ActionIdentifiers.Normalize` derives an id from a display name the same way everywhere;
  an Action Target with an empty id uses it, and warns about an unusable explicit id while
  the designer is typing.

### Fixed — actions
- **Grammar holes.** Free text could contain `{` or `}` and end the block early for every
  brace-counting reader; an `Optional` target with nothing registered produced an empty
  `target ::=` rule that matched the empty string; two optional parameters were nested, so
  the second was unreachable without the first; `look_at` and `look-at` collapsed to the
  same rule name and llama.cpp silently kept one. Text excludes braces, the optional group
  is left out with no targets, optional parameters are an independent ordered subset, and
  rules are named by position.
- Speech can no longer be blank (whitespace only); a leading space is still allowed
  because tokenizers glue one onto the first word.
- `ActionSchema.IsEmpty` was always true for a per-character view. `Clear()` on a view no
  longer wipes the shared vocabulary. The prompt's example is built from a verb that is
  actually listed. `SetVerbFilter` takes a revision *function* (`() => gate.Revision`) so
  the cached grammar rebuilds exactly when the filter's answer can change; the `int`
  overload is obsolete.
- Parameter names and choice values are validated at registration — a quote in a choice
  used to produce a grammar that failed to compile on the player's machine. An axis whose
  id cannot be a grammar literal is left out of `feel` with a warning instead of throwing.
- A leading block that names no `"verb"` (an emoticon in braces) is not an attempted action
  and earns no repair round. The repair reply's block is the first JSON object, not the
  first brace, and braces inside its strings do not end it. The streaming parser applies
  the same rule to the block it holds back.
- `ActionTargetRegistry.Register` of the same object under the same id no longer bumps the
  revision (perception re-registers everything in range on every recompute), and an
  unusable id is refused with a warning once instead of silently.
- `LLMUnityGrammarBinding` deduplicates against the client's own `grammar`, so a grammar
  typed into the LLMUnity inspector is seen and cleared like any other.
- `NpcActions` resets when Play starts, like every other static. `NpcAction.TargetId`
  answers `""` for a destroyed target instead of throwing.

### Added — editor
- **`LLMUnityLiveVerificationAdapter`.** Live verification and the prompt debugger asked
  for a component the package did not ship; the only implementation lived in the demo
  project. The adapter drives an `LLMAgent`, the perception and state components beside
  it, and the active voice engine — and the empty state names it.
- `TranscriptCleaner` strips a recogniser's non-speech annotations (`(coughs)`,
  `[BLANK_AUDIO]`, `*sighs*`, notes) and says whether anything was said; the
  troubleshooting page pointed at demo code for this.
- `PluginPaths` finds the plugin's folder from its assembly definition, so the editor
  tools survive the folder being moved or renamed.

### Fixed — editor
- **"Check for preset updates" could never succeed**: its private coroutine did not wait
  for the web request. It uses the shared editor coroutine host; the update URL ships empty
  and the menu item says so, instead of fetching a page that does not exist.
- **Every external link was a 404.** Documentation and "how to supply your own voice" open
  the pages inside the package; support is the publisher's e-mail; the welcome window's
  primary button is no longer a window that needs setup first.
- **"What ships in the build" in the Presets window decided nothing.** It now shows what
  the Model Manager's ticks add up to and hands off; there is one place that decides.
- `LLMUNITY_PRESENT` is decided from the file system and the package manager, not from the
  loaded domain, so deleting LLM for Unity removes the define even while the compile is
  broken; it is set for every build target at once; the version is read from the package
  manifest or the `package.json` beside a loose install, "3.0.3 or newer" is enforced as a
  minimum rather than a list, and "found but not compiled in yet" is reported as such with
  the Re-check menu item as the fix.
- A single verification and a latency run restore the project's language afterwards; the
  latency run is tracked by the window (no second generation on the same model, Cancel
  stops it), clears the history first, and writes JSON that names the machine, model and
  tier. Outside play mode the window says that dialogue needs Play after a few seconds
  instead of waiting three minutes; "Load model" no longer reports "loaded" before loading.
- The verification and prompt-debugger windows refresh on scene changes and play-mode
  transitions instead of throwing every frame from destroyed characters; the prompt
  debugger's character list follows Refresh; a verification cell whose configuration cannot
  be read shows "unknown" rather than staying green.
- External voice processes are shut down when the editor quits. The packaging boundary test
  forbids every executable and model format unless allowed by name, and checks the
  espeak-ng note inside the package. The author's packaging menus no longer ship. "Create
  demo scene" refuses in Play mode; the welcome window is not marked seen by a batch-mode
  import; "Check my setup (log to console)" prints at any log level; the addressable-script
  check says what it does and does not check.
- The latency run's test lines, the shipped tests and the comments no longer name a
  particular game.

### Added — hardware tiers
- **`TierBootstrap` and `LLMUnityHost`.** The documentation described a plugin that probes
  the machine, picks a tier and starts the right model at startup; the code shipped the
  cascade and left the host and the driver to each project. Two components on the LLM's
  object now do it, with the force-tier and fail-starts development hooks as inspector
  fields instead of undocumented PlayerPrefs keys.
- `ModelDownloadUrl` turns a catalog's repository URL into the file URL; the shipped
  catalog carries a SHA-256 for every model.
- `Tiers.OnTierResolved` calls a late subscriber at once; `Tiers.Reason` keeps the real
  reason after a downgrade instead of "overridden".

### Fixed — hardware tiers and the Model Manager
- **No catalog download could ever finish.** The size check compared the exact byte count
  with the catalog's figure rounded to megabytes, failed for every model, and the retry
  looped through a 416 back to a fresh download. The size now allows the rounding and the
  checksum is the verdict; a finished-but-unverified `.part` is verified instead of
  discarded; plain http is refused; a locked destination no longer costs a re-download.
- **"Who uses this file" only knew about missing files.** Every installed model read as
  unused, the delete dialog said nothing referenced it, and `required-models.json` was
  written empty. The reference scan now collects present and missing alike.
- **Any string ending in `.bin` blocked the build.** `.bin` counts as a model only with
  whisper.cpp's `ggml-` prefix; the build gate checks the scenes in the build settings and
  prefabs rather than whatever is open; the block can be turned into a warning; "Include in
  build" lives in `ProjectSettings/` so a teammate's or a CI machine's build carries the
  same models; a staging folder left by a cancelled build is cleaned up.
- **Crash loops.** The in-progress marker is kept until the first generation survives, a
  measurement is recorded against the layer count it was taken at (a suggestion to try
  more travels separately and is measured before it is trusted), a cached count is capped
  by the current VRAM budget, an empty measurement is no longer cached as "0 tok/s
  completed", a start timeout moves on to the next model instead of stepping layers down
  four times, and the cache key includes VR and the context size.
- The layer tuner sets aside the model's working set (KV cache and buffers, from
  `expectedVramMB` or estimated from the context size) before dividing the rest into
  layers; a 16k context on a 6 GB card no longer loads 36 layers and dies.
- Qwen3-8B's catalog size was 4900 MB against a real 4795, so a correct download was
  "Damaged". The Light RAM bar is 14 000 MB, admitting a "16 GB" laptop with integrated
  graphics. VR is re-read on every probe rather than cached from the first frame. Newer AMD
  integrated GPUs ("Radeon(TM) Graphics", 680M/780M/880M) are recognised as integrated.
- `GgufReader` refuses arrays nested more than 16 deep instead of overflowing the stack on
  a crafted file, and reports an absurd length as damage rather than "need more data".
- The Model Manager window no longer loads every ScriptableObject in the project every two
  seconds, nor mutes the editor's logger while it does; a header that could not be read
  keeps its reason on screen.

### Fixed — core
- **One rule for the end of a sentence.** The reply limiter cut "I ran 3.5 kilometres"
  at the decimal point and "Dr. Sato" after the title; the streaming parser knew better and
  the two disagreed on the same text. Both now use `SentenceTerminators.IsSentenceEnd`:
  decimals, abbreviations (with Russian ones), capital-letter initials only, "?!" as an
  ending, an ellipsis as a pause unless a capital follows, and no split after a Japanese
  pause.
- **`LanguageRuntime.SetCurrent` reaches the voice.** The speech engines default to
  `LanguageRuntimeSource`, so the one documented call restarts the engine; a host with its
  own language store still assigns `TTSEngineManager.LanguageSource`.
- **An empty catalog update no longer erases the catalog.** `{"presets":[]}` was "usable"
  and merged over every official entry. Empty is refused; a cache that holds only user
  presets is merged over the embedded copy; the cache is written atomically and an
  unreadable one is set aside as `.corrupt-<time>.json` instead of being overwritten.
- `LanguageDefinition` can author the nearby-objects header and the target hint, so a new
  language's prompt has no English fragments left in it.
- The built-in catalog no longer names Spanish and Russian Piper voices fine-tuned from a
  research-only dataset, nor a VOICEVOX speaker; those languages ship configured and
  voiceless, Simplified Chinese joins them, every built-in language has a length sentence
  in its own words, and the engine says "no voice is configured" instead of borrowing
  English's.
- `LanguageRuntime`: installing a catalog before any language was chosen no longer chooses
  one and raises `Changed`; an empty catalog is refused; `Current` is never null; an
  unconfigured code is reported once and `TrySetCurrent` refuses it; one throwing
  subscriber no longer silences the rest. Regional codes match the same way everywhere
  (`LanguageCodes`), underscores included.
- `ExternalProcessLifecycle` tears down what the ledger still holds on play-mode entry
  instead of forgetting it, which orphaned a voice process started by an editor tool.
- JSON: a byte-order mark is skipped, non-standard numbers (`+5`, `01`, `.5`, `1.`) are
  refused, `\u` needs four hex digits, a lone surrogate is escaped rather than replaced,
  and floats are written as typed (`0.7`, not `0.699999988079071`). The action grammar's
  number rule matches.
- `LanguageMigration` no longer treats a stored word like "Japanese" as a language code;
  `Log.Handler` and `Log.MinimumLevel` reset when Play starts; `PresetCatalogJson` is
  public; the catalog's Chinese ids and display names are consistent.

### Fixed — state and memory
- **Persistence could overwrite a save.** A character that came alive before the bootstrap
  installed `NpcStateComponent.Store` started from defaults and, ten seconds later, saved
  them over the player's progress. A character now loads the moment a store appears and
  never writes before it has tried to load. Saves also flush on `OnApplicationPause`.
- `Import()` replaces the persisted slot instead of merging with the previous one; values
  for axes the catalog no longer defines are kept and saved back, with a warning naming
  them, rather than dropped on the first save.
- `NaN` and infinite values are refused by `Set`, `Modify`, `Tick` and `ImportPersisted`
  instead of being stored, where nothing behaves afterwards. `Set` from the model obeys the
  same per-reply clamp as `Modify`.
- Exceptions from a project's `IStateStore`, `IKeyValueStore`, memory compactor and event
  subscribers are contained and reported; one throwing subscriber no longer silences the
  rest, and a broken store costs the memory, never the turn.
- Every static (`Store`, `Instances`, the verb gate's rules, memory store, compactor,
  labels and phrasing registrations) is reset when Play starts, so Enter Play Mode without
  domain reload no longer doubles the gate's rules or keeps last session's store alive.
- A numeric verb-gate rule (`Require(min, max)`) is re-evaluated on every change of its
  axis, not only on a band crossing; the cached grammar rebuilds when the answer can differ.

### Changed — state and memory
- The state block's subject is neutral by default ("this character") and set per character
  on the component (**Subject in prompt**). Connecting words are per language through
  `StatePhrasing`, with built-ins for the five shipped languages.
- The memory replay is labelled per language (`MemoryLabels`: "Player: / You: / Earlier: "
  and their ru/ja/es/zh equivalents) instead of a hard-coded English "Caretaker:". Projects
  set `NPCMemory.Labels` once or pass a language code to `GetContextString`.
- `AxisKind.Trait` is obsolete. It never ticked, was never described and modulated nothing;
  a disposition is a Trait Preset. Catalogs authored with it still load, and `Validate()`
  and the inspector say so.
- `AxisDefinition.Validate()` and the catalog inspector report bands listed out of order,
  blank or duplicate band ids, a band with max below min, gaps and overlaps, and bands
  without text; the inspector's texts match what the component does (tick floor 0.1 s,
  save floor 1 s, a time scale of zero is ignored, no store in Play mode).
- `StateAxes.Mood` is `"mood"`, matching the sample catalog and `MoodPresentation`. The
  `feel` verb has Russian and Chinese texts.
- The LivingCharacter sample catalog has no gaps between bands, neutral band texts, and
  Russian and Chinese descriptions; a test keeps every shipped catalog passing its own
  inspector.
- No more deprecated `FindObjectsByType(FindObjectsSortMode)` calls: `ObjectFinder.All<T>()`
  compiles clean on 6000.0 and 6000.5.

### Added — speech contract for a streaming engine
- `IStreamingTTSEngine`, additive to `ITTSEngine`: `Synthesize(SpeechRequest, onChunk,
  CancellationToken)` delivers audio in pieces, and the session starts the speaker on the
  first chunk while the rest of the sentence is still being produced. Engines written
  against the one-buffer contract keep working unchanged.
- `SpeechRequest` carries the text, the language, a voice id, a style and the legacy speaker
  id. `StreamingSpeechSession` takes one as its voice template (the old `int speakerId`
  constructor remains); a missing language is filled from the language runtime. Piper
  honours a voice id on the request as a voice file name, which makes a language
  definition's *TTS voice id* reachable per unit.
- `SpeechSynthesis.Run` / `Collect` are the one way the plugin asks an engine to speak: the
  streaming overload when the engine has it, the one-buffer contract wrapped into a single
  final chunk when it does not. A second `onAudio` from a one-buffer engine — which used to
  overwrite the first buffer unnoticed — is logged and dropped; an engine that throws loses
  the unit, not the conversation.
- Cancellation reaches the engine: `Cancel()` on the session cancels the synthesis in
  flight, and Piper stops polling for the file and removes it. A unit that takes longer than
  `UnitSynthesisTimeoutSeconds` (60 s) is abandoned, subtitle-only; a streamed unit longer
  than `MaxUnitSeconds` (30 s) is cut.
- `ILanguageAwareEngine.RestartOnLanguageChange` (default true). An engine that serves every
  language from one process returns false; the manager then calls `SetLanguage` and neither
  restarts it nor shows the loading overlay.
- `IActiveAwareEngine` replaces the manager's private hook into `PiperEngine`: every engine
  in the binding table that implements it is told whether it is active, so a second Piper
  bound to another language gets the watchdog guard too.
- The latency runner records synthesis-to-first-chunk per turn (`firstChunkMs` in the JSON,
  a row in the report when it differs from the whole synthesis), so a streaming engine's
  gain is measured rather than assumed.

### Fixed — state and memory (continued)
- `SaveNow` no longer writes when the save could not be read. A store that threw on load
  left the character on defaults and, ten seconds later, wrote those defaults over the
  player's file; now it says so and waits for the next attempt.

### Fixed — speech
- A binding row that exists but cannot speak — no engine dragged in, or a component that
  is not an `ITTSEngine` — is named precisely, once, instead of "No engine bound for 'ja'"
  sending people to add a second row.
- A language definition's *TTS engine id* is read. Engines that implement `INamedTtsEngine`
  (Piper answers to `piper`) are reachable from a definition without a row in the manager's
  binding table, so a new Piper-voiced language really is one asset and no wiring.
- A language switch that threw no longer wedges the manager: the in-flight flag is cleared
  in a `finally`, so the next switch runs instead of queueing behind a dead coroutine.
- Piper refuses a voice whose `.onnx.json` is missing, empty or unreadable before spawning
  the process, and says which file — instead of a process that starts, reports ready and
  synthesises silence. The WAV is loaded through a proper file URI, so a `#` or `%` in a
  temp path no longer breaks the clip.
- `UtteranceGate` no longer drops one-character CJK answers («嗯», «네») under the
  two-character minimum meant for alphabets.
- A subtitle-only unit is shown for its reading length (about fourteen characters a
  second, within bounds) instead of a flat 2.5 s; `Cancel()` and the new `Dispose()`
  release the clip in the air, which a `StopCoroutine` used to leak.
- `AudioClipConversion.ToClip` drops a unit with a zero sample rate with a warning instead of
  throwing, and trims a dangling half-frame from an interleaved buffer.
- HelloNpc no longer reads a faulted task's `Result` — which rethrew, killed the coroutine
  and left the character busy forever — and the documented controller says why.
- `SpeakableText` drops what a voice must not attempt: a markdown link keeps its text and
  loses its address, a bare address is removed, a square-bracketed stage direction
  (`[laughs]`) is not spoken, a keycap's combining mark leaves nothing behind, and a letter
  outside the basic plane counts as speech. Round brackets stay.
- A log handler installed by the host that throws is removed with one console line instead
  of turning the plugin's contained failure into an uncontained one.
- Piper polls for its output on real time, so a game paused at `timeScale = 0` no longer
  freezes a unit mid-synthesis while the process finishes anyway, and the budget is seconds
  rather than iterations. The pause table in `Limitations.md` is now true for the whole queue.
- Piper requests are real JSON on one line. A reply carrying a line break, a tab or a stray
  control character used to split the request or break the parse, and the process spoke
  half a sentence or died; the request is now written by the plugin's JSON writer, with
  whitespace controls turned into spaces and the rest dropped.
- `PiperEngine.StartAsync` initialises its process pool itself, so a host that never ran
  `Awake` (an editor tool, a component added and started in the same call) no longer
  reaches a null pool.
- The microphone is opened by the first push-to-talk recorder, not at application start. A
  scene with no voice input never touches the device — no permission prompt, no busy
  microphone, no capture in a menu. `SharedMicLoop.Require()` returns the loop early.
- `UtteranceGate` tells end-card phrases ("thanks for watching") from ambiguous ones
  ("okay", "thanks", "bye"). Given the recording's energy —
  `Inspect(transcript, language, rms)` — an ambiguous phrase is dropped only when the
  recording was quiet, so a player who audibly said "okay" is heard. The overload without
  the energy keeps the old strict behaviour. `UseBuiltInPhrases` turns the shipped lists off.

### Changed — speech
- `ITTSEngine` carries its contract in the XML documentation: `onAudio` at most once and
  never on failure, `StartAsync` never throws, `StopAsync` safe twice, cancellation leaves
  the engine usable. Streaming audio inside a unit will arrive as a separate, additive
  interface rather than by changing this one.
- `PiperEngine`'s inspector fields describe voices, not characters:
  `_englishVoiceFile`, `_secondaryEnglishVoiceFile`, `_spanishVoiceFile`,
  `_secondarySpeakerId`, `_defaultVoiceFlags`, `_secondaryVoiceFlags`, `_spanishVoiceFlags`.
  Scenes saved with the old names load unchanged (`FormerlySerializedAs`).
- The TTS manager's default binding table includes `zh-Hans`, which the built-in language
  catalog already configured.

### Fixed — editor and diagnostics
- The in-game diagnostics component writes its fixes for a player. `SetupContext.Audience`
  selects the sentence after each finding: the editor keeps "Open Tools ▸ Offline AI NPC ▸
  Model Manager"; a shipped game says "Download the language model from the game's menu",
  and rows only a developer can act on (scene wiring, an unread library version, "press
  Play once") are left out. The findings themselves are the same code path.
- A voice's `.onnx.json` is read and parsed, not merely found: an empty or half-written
  config — the usual leftover of an interrupted download — now fails the setup check with
  the reason, instead of passing green and producing silence.
- Piper's paths live in one place, `PiperPaths`: `StreamingAssets/piper/` with `piper.exe`
  on Windows and `piper` elsewhere, `voices/` beneath it. The engine, the setup check and
  the "speak one line" menu all read the same answer.
- "Speak one line": the request is real JSON, the wav loads on the editor's update loop
  instead of a ten-second busy-wait, the log prefix appears once, the Russian item speaks
  the voice the language definition names, and the demo's interview line is gone.
- Window titles match their menu items and the documentation: Welcome, Model Manager,
  Check my setup.
- The verification matrix is stored per project in `UserSettings/OfflineAINPC/` (migrated
  from EditorPrefs once) with an invariant-culture timestamp, so two projects with a
  character of the same name no longer share cells.
- The speaker-audition prompt opens centred on the editor instead of at the screen's
  origin; the editor audio preview releases its held clip before a domain reload; the
  perception inspector warns when the eye transform is empty and names the head bone
  when the rig has one; a model folder under `Packages/` is refused like one under
  `Assets/`; the packaging tests locate the plugin through `PluginPaths`.

### Fixed — samples
- The HelloNpc scene can talk. It now carries a `Language Model` object — `LLM` (disabled on
  purpose), `LLMUnity Host`, `Tier Bootstrap` — and an `LLMAgent` on the character wired to
  it, so "download a model and press Play" is true. The character names the exact missing
  piece: no agent, no LLM, still starting, failed, or no model for this tier.

### Fixed — documentation and notices
- The package root README no longer claims the documentation folder may be missing, counts
  sixteen pages, lists the beginner's guide and the demo page, and gives the online
  documentation and support addresses.
- The architecture page (`Documentation/README.md`) describes the current layout — state,
  perception, actions, models, verification, integrations, samples — and the seams with
  their defaults, instead of a two-month-old plugin with a Japanese engine it never shipped.
- Piper's install path is named everywhere it was "somewhere your build can reach":
  `Assets/StreamingAssets/piper/piper.exe` and `…/piper/voices/`. `Limitations.md` says the
  shipped Piper driver is Windows as delivered.
- Where a `.gguf` goes is one answer on every page: the Model Manager's folder, then
  `persistentDataPath`, then `StreamingAssets`.
- Downloads are described as they are checked — size and GGUF header always, hash when the
  preset carries one — rather than as "hash-verified" while the shipped presets carry none.
- `BeginnerGuide.md` no longer promises the plugin "runs with no GPU at all"; it says when
  the CPU path applies and that the lowest tier has no model. Its type reference separates
  assets from things configured in the inspector or code.
- The contention figures (2.4 s → 12.7 s) are marked as measured once in the demo project;
  the shipped latency runner reproduces the 2.0 s figure, not those.
- Every documentation-versus-code row from the audit was walked: the perception page says
  how candidates are ranked, that occlusion needs the Occluders mask, that the token budget is
  the second limit, and that the interaction handler must be public; the actions page says
  the plugin ships one verb (`feel`), when the grammar applies, and how an `IActionHandler`
  registers; the state page says decay runs on game time; the speech pages say what Piper
  does with a speaker id and how to prewarm voices; the pivot advice describes the renderer
  centre the code actually aims at.
- `Perception.md` describes the truncated block, `Omitted` / `IsTruncated`, the empty-room
  sentence and `IActionReceiver`. The HelloNpc sample is named where a page said no runnable
  sample existed. Smaller: the store recipe, the demo's lip-sync note, `Samples/` not
  `Samples~`, the length instruction's languages, no katakana in the English troubleshooting
  page.
- `THIRD_PARTY_NOTICES.md` is an inventory of what the package touches — dependencies,
  external processes, the three catalog models, the three recommended voices — with the date
  each licence was read, instead of a working journal with twelve unresolved TODOs, a
  dependency that no longer exists and voices the plugin never shipped. LlamaLib is
  Apache-2.0, not MIT. The Qwen3-8B licence and card are archived beside the 1.7B and 4B ones.
- The 1.0.0 entry below reads as a release description: no development-stage numbers, no
  classes that belong to the demo project, no tools that are not in the package.

## [1.0.0] — 2026-08-17

First public release. Everything below was built before it, and is listed rather than
summarised because a first changelog is the only one a buyer can read as a description of
what they are getting.

### Added — the guide for someone who has done none of this
- **`BeginnerGuide.md`**. The existing pages assume a
  reader who has installed a Unity package with external dependencies before; this one
  assumes nothing, and every step says how to tell it worked rather than only what to do.
- It closes two gaps found by measuring rather than by reading: **the required Unity
  version appeared nowhere** in the documentation, and there was **no chapter on making a
  player build** — even though models are excluded from builds by default, an included one
  is staged into `StreamingAssets` only for the duration of the build, and a build with
  broken model references is refused rather than shipped dead.
- A map of every runtime area with the problem it solves, all six editor windows by the
  question each answers, and what the plugin deliberately does **not** do.
- An API reference organised by what you do with a type — put on a GameObject, implement,
  call, author as an asset — because a concept you cannot name is one you cannot look up.
  Public types named in the docs went from 34% to 57%; the rest are enums and internals,
  and the guide says so instead of implying completeness.

### Added — the documentation a buyer reads
- **`IsThisForYourGame.md`**, deliberately first and deliberately willing to talk a
  wrong-fit buyer out of the purchase. Names the games this is wrong for — mobile, crowds
  of talking NPCs, combat barks, tightly authored narrative, low-spec audiences — and says
  a dialogue tree and this plugin are complements rather than competitors.
- **`Limitations.md`** as its own page, not a footnote. Every limit carries its mitigation
  where one exists and says so plainly where none does.
- **`Languages.md`** answering the question in three tiers instead of one number: ready
  out of the box, works-bring-your-own-voice (roughly a hundred languages), and not
  viable. The plugin does not gate on that list and the page says so.
- **`Dialogue.md`** — the complete controller a buyer otherwise writes from scratch.
  Extracted and compiled against the public API rather than written from memory.
- **`Recipes.md`**, `GettingStarted.md`, `HardwareTiers.md`, `Licensing.md`,
  `Troubleshooting.md` (mapped from the error strings the plugin actually emits), and an
  index.
- `DocumentationSnippetTests` — the code printed in the documentation, compiled and run,
  because a snippet that does not build fails in the buyer's project rather than in ours.

### Changed — documentation
- **`State.md` now opens with the ten-line version** and reaches the full apparatus
  afterwards. Building the demo against the public API needed exactly
  "the player pressed, subtract eighteen"; it met the catalog-plus-traits-plus-persistence
  apparatus first, concluded the system was too heavy, and wrote forty lines of its own
  rules. The short path always existed and was not shown.

### Measured — can a 4B defend a brief without contradicting itself?
- 20 sessions x 16 turns = 320 turns, neutral questions only, Qwen3-4B: **zero departures
  from stated facts**. The model is a reliable witness to what it was told.
- **One derived fact was wrong in 19 sessions out of 20 — identically wrong every time.**
  A consistently wrong answer reads as a designed tell. Never ask a small model to compute.
- Uncovered questions: 65% declined honestly, 35% borrowed a nearby fact, 0% freely
  invented — after adding an explicit "say you do not remember" instruction. Cover what
  players will ask, or the gaps fill themselves.

### Measured — does the state block change what the model says?
- An earlier pass reported no effect. That was a MEASUREMENT error, not a result: it counted "did
  the reply differ" (which scores the same with the feature off) and asked indirect
  questions. Counting explicit references to the state, n = 10 per condition, with a
  control arm for every condition:
  - sleepiness at 95/100: **6/10** mentions, against **0/10** at 5/100 and **0/10** with
    the block disabled;
  - trust at 16/20: **6/10**, against **2/10** at 0/20 and **1/10** disabled.
- Tested and REVERTED: addressing the character in second person ("you are tired") — it
  collapsed the trust effect to 1/10 and made tiredness score 10/10 at BOTH ends of the
  axis. Also reverted: moving the block after the player's line, which flattened every
  condition to the control.
- Tested and NOT adopted: raising the reply limit to three sentences. It strengthened the
  relationship effect (8/10 against a 0/10 control) but lifted the sleepiness control to
  5/10, because a longer reply mentions more things by chance. Mixed, and the limit exists
  for latency, so the default stays at one sentence.
- Honest framing for the docs and the listing: state **colours** replies, it does not make
  the character act.

### Added — internal state (mood, relationships, needs, traits)
- Four axis KINDS, kept apart because they live on different timescales: a mood eases
  back to a baseline, a need grows until something satisfies it, a relationship only
  moves when something happens, and a trait never moves at all. Merging any two of them
  produces the classic bug where either the mood stops decaying or the need starts.
- `AxisDefinition` carries range, baseline, rate per hour, hysteresis, the model's write
  allowance and the descriptor bands — no threshold or rate is hardcoded in logic.
  `AxisCatalogAsset` / `TraitPresetAsset` are the authored form, with `schemaVersion` and
  a migration hook from the first version.
- Relationships are keyed by PAIR, so NPC↔NPC opinions work from day one.
- Descriptors, not numbers: each band maps to a short clause per language through
  `LocalizedText`. A small model given `trust: 7` either ignores it or over-dramatises
  it. The block states only what has actually moved, ranked by how far from baseline, and
  is capped at two clauses.
- `StateVerbGate` filters the VERB list from state the way perception filters targets: an
  exhausted character is not asked to decline to look around — the verb is absent from her
  grammar. Verbs by state, targets by perception, composing without knowing about each
  other.
- The model's own way in is the `feel` action, whose `axis` parameter is a grammar CHOICE
  built from the axes a designer opened. Needs are unreachable rather than merely
  rejected, and open axes are magnitude-clamped per reply.
- `ThresholdCrossed` fires once per band crossing, with hysteresis, and never on load —
  so a milestone is celebrated the moment it happens and not again at every launch.
- Save/load through `IStateStore` with `Export()`/`Import()` for projects that own their
  save format; mood is deliberately session-only.
- `Log`: the plugin's single logger, with `Debug` compiled out unless `AINPC_DEBUG` and a
  redirectable handler for projects with their own logging.

### Added — points of interest (perception with no wiring)
- `AIPointOfInterest`: drop it on an object and every NPC can notice it. It registers
  itself into a static `PoiRegistry` while enabled, so pooling, additive scenes and
  scene unloads are correct for free — there is no list to maintain and therefore none
  to forget. Competing products ask the developer to hand-register every object.
- `PerceptionQuery` per character: a recompute a few times a second (never per frame)
  scoring `proximity + priority + facing + recency of interaction` with serialized
  weights. Occlusion is a hard exclusion — something behind a wall is not "low scoring",
  it is not seen. Only the top N (default 6, hard cap 15) reach the prompt.
- Candidates come from the registry rather than `Physics.OverlapSphere`, because a
  sphere cast would force every point of interest to carry a collider and that would
  break the one-component promise.
- The perception result feeds TWO things from one snapshot: the "Nearby" line in the
  prompt and the target enum of the action grammar. A character is therefore unable to
  name an object it cannot see, and the description can never disagree with what is
  nameable.
- Freshness without prompt rebuilds: the persona snapshot keeps the VERBS (stable, so
  the prompt cache survives) while the object ids arrive per turn with the query and are
  never written to the transcript. An object that appeared an instant ago is nameable
  this turn; one that left is not.
- `LocalizedText`: verb, parameter, target and point-of-interest descriptions are now
  keyed by language code with fallback, so a Japanese conversation is no longer steered
  by English instruction fragments. A sixth language is data, not code.
- Each point of interest carries a `UnityEvent<NpcActionContext>`, so "when an NPC uses
  this mug, do X" is inspector wiring. The payload carries the resolved component.
- `PoiBulkAttach`: make an existing scene perceivable by layer or tag in one call.
- `PerceptionQuery.Explain` and selection gizmos for debugging by eye.

### Added — structured actions via grammar-constrained decoding
- `Actions/ActionSchema`: registered verbs, their parameters and their target
  requirements, producing BOTH a GBNF grammar (what is *expressible*) and a prompt
  description (what is *appropriate*). Neither alone is enough — a grammar is invisible
  to the model, and a prompt is not a constraint.
- Output format: an OPTIONAL leading `{"verb":…}` line, then free prose. Leading, so the
  action is known before the first word is spoken; optional, so ordinary conversation
  stays ordinary. The grammar forbids prose from starting with `{` and forbids an action
  with no speech after it — she can never act and then fall silent.
- `GbnfWriter` builds the grammar from the schema. Unregistered targets and values
  outside a `Choice` list are not merely discouraged, they are unreachable.
- `ActionParser` validates and resolves the block, and NEVER throws — she is already
  talking by the time it runs. `ActionRepair` supplies the single corrective round,
  which asks for the action alone and then gives up silently.
- `ActionDispatcher` delivers a resolved action three ways: a UnityEvent for inspector
  wiring, a C# event / `IActionHandler` for code, and per-verb subscriptions. Every
  callback is contained: a handler that throws loses its action, not the conversation.
- `IGrammarSink` is the seam. The core never references LLMUnity; the shipped adapter
  lives in `OfflineAINPC.LLMUnity`, an assembly excluded by `defineConstraints` when
  LLMUnity is absent, and is found through the core interface via `GetComponent`.
- `LLMUnityPresenceDetector` sets `LLMUNITY_PRESENT` when LLMUnity is installed as
  loose files under `Assets/` — the Asset Store case, where `versionDefines` cannot
  fire. It leaves a package installation alone.
- 57 EditMode tests, including a small GBNF matcher that checks what the grammar
  accepts and rejects without loading a model.

### Added — preset catalog
- `PresetCatalog` / `PresetCatalogJson`: a (language x tier) -> everything-needed record, read
  from JSON with an integer `schemaVersion`. An UNKNOWN FUTURE schemaVersion is a warning,
  never an error — a customer on an older plugin keeps working on the copy they have.
- Every asset in a preset carries `license`, `licenseUrl` and `attribution`. Attribution is
  a field the plugin can surface, because a preset that quietly obliges a buyer to display
  "Built with Llama" and does not say so is a licence violation waiting to happen.
- Distribution: an embedded copy ships with the plugin and works offline forever; a remote
  copy is fetched only by a MANUAL editor command, and nothing is ever uploaded. Any
  failure (offline, 404, malformed, future schema) silently keeps the last good copy.
- Merge rule: `official` entries are replaced wholesale, `user` entries are never touched,
  and on an id collision the user entry wins. An update cannot deliver `user` entries.
- Seed content: Qwen3 8B/4B/1.7B across the tiers for en, es, ja, zh-Hans, ru — all
  Apache-2.0, none gated. TTS slots are left empty with an explanation where no
  licence-clean voice could be confirmed.

### Added — hardware tiers, auto-tuning, degradation cascade
- Four tiers (`Fallback`/`Light`/`Standard`/`Premium`) resolved from a probed
  `HardwareProfile` against `TierThresholds`. Tier 0 is a working state, not an error.
- `TierPolicy` and `ModelManifest` ScriptableObjects hold the data; `TierThresholds` and
  `ModelCatalog` are their pure-C# counterparts, which is what the logic actually reads —
  so every threshold and every model rule is testable without the engine.
- Warm-up benchmark with automatic GPU-layer selection, cached per GPU + model + plugin
  version. An unfinished attempt is recorded under its own key BEFORE the attempt, so a
  launch that never came back is detected on the next one and stepped down from.
- Degradation cascade: model start failures retry with fewer layers, then a lighter tier,
  then Tier 0. `Tiers.OnTierResolved` / `OnTierDowngraded` report every step.
- Public API: `Tiers.Current`, `Tiers.Profile`, `Tiers.Reason`, `Tiers.Verdict`,
  `Tiers.ActiveModel`, `Tiers.ActiveGpuLayers`, `Tiers.MeasuredTokensPerSecond`,
  `Tiers.Override(tier?)`, and the two events.
- `schemaVersion` + `OnAfterDeserialize` migration on both config assets from their first
  version, so a customer's tuned config survives a plugin update.
- Model entries carry licence id, licence URL and a required-attribution field; the
  default catalog is Qwen3 (Apache-2.0) because it is the cleanest to redistribute.

### Added — streaming reply parser and sentence-level TTS handoff
- `Core/StreamingReplyParser` — cuts a reply into speakable units while the model is
  still writing it. Pure C#. Terminators cover `.!?`, their full-width twins, `。`, and
  the ellipsis forms; decimals, abbreviations and initials do not split; a terminator
  arriving in its own chunk is handled (that is what the real stream does); an ellipsis
  only ends a unit when a new sentence starts after it; short units merge forward; a
  leading `<...>` / `{...}` metadata block is held back rather than spoken.
- `Speech/Tts/StreamingSpeechSession` — synthesis and playback as two coroutines over a
  shared queue, so unit N is audible while unit N+1 is in the synthesizer. Ordered,
  never overlapping, cancellable mid-flight, and degrades to subtitle-only when the
  synthesizer dies rather than hanging the conversation.
- The demo's dialogue controller routes its reply through both, keeping its busy lock in
  a `finally` across the whole multi-sentence session. Push-to-talk may interrupt a
  character mid-reply.
- 34 EditMode tests for the parser, including a captured real token stream replayed
  verbatim.

### Added — package skeleton and the assembly boundary
- `Assets/OfflineAINPC/` package layout: `Runtime/` (Core, Speech/Tts, Speech/Stt,
  Memory, Hardware), `Editor/`, `Tests/Editor`, `Tests/Runtime`, `Documentation/`,
  `LICENSES/`.
- Four assembly definitions. `OfflineAINPC.Runtime` has an **empty `references` list** —
  no game assembly, no LLMUnity, no whisper.unity. It briefly also carried
  `Newtonsoft.Json.dll` as a `precompiledReference`; that dependency was removed before
  release, and `precompiledReferences` is empty too. Beyond the engine the runtime takes
  nothing, which is what makes the decoupling a compiler-enforced fact rather than a claim.
- `ILanguageSource` + `FixedLanguageSource`: the seam through which a host tells the TTS
  manager the current language.
- `MicChunk`: the recorder's own PCM carrier, replacing whisper.unity's `AudioChunk` on
  the mic event, so the STT package is no longer a compile-time dependency of the mic.
- `ExternalProcessRegistry` + `ExternalProcessLifecycle` (+ the Editor-side hooks): one
  teardown point for OS child processes, wired to `beforeAssemblyReload`,
  `ExitingPlayMode` and `Application.quitting`. Piper's process pool registers itself.
- The hardware probe: GPU, RAM and thread count, with a pure tier resolve for testing.
- `DependencyGuard`: version-define state (`LLMUNITY_PRESENT`, `WHISPER_PRESENT`) plus
  `Require*` helpers that fail with a readable message naming the package and version.
- EditMode tests for conversation memory, the hardware tier table, the mic ring-buffer
  slice arithmetic, the process registry, and the language seam. PlayMode tests for
  recorder/mic-loop lifecycle and PCM↔AudioClip round-tripping. Nothing in the suite
  needs a model, a microphone, or a network.

### Moved (behaviour unchanged)
`ITTSEngine`, `ILanguageAwareEngine`, `AudioData`, `AudioClipConversion`, `VoiceConfig` /
`IPiperVoiceRouter`, `PiperProcessPool`, `PiperEngine`,
`TTSEngineManager`, `SharedMicLoop`, `PersistentMicRecorder`, `NPCMemory`,
`IKeyValueStore`, and the `Language` enum. Namespaces became `OfflineAINPC.*`; every
file kept its `.meta`, so scene and prefab references are untouched.

### Known limitations
- `LLMUNITY_PRESENT` is resolved from the package registry, so LLM for Unity installed as
  an Asset Store folder under `Assets/` rather than as a UPM package is not seen by
  `versionDefines`; the LLMUnity integration and the HelloNpc sample then do not compile
  in. `Check my setup` detects that case and says so.
- Delivered as a `.unitypackage` folder, not a UPM package; there is no `package.json`.
