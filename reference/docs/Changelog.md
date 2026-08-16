# Changelog — Offline AI NPC

All notable changes to the plugin. The format follows Keep a Changelog; versions will
start at 1.0.0 when the package is first published.

## [Unreleased]

### Added — the guide for someone who has done none of this
- **`BeginnerGuide.md`**, English and Russian in one file. The existing pages assume a
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

### Changed
- `check_mirror.py` understands pages that carry their own translation. A bilingual page
  is reported as `BILINGUAL` rather than counted as a missing translation forever, because
  a permanent false gap hides the real ones.

### Added — stage 6A1: the documentation a buyer reads
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

### Changed — stage 6A1
- **`State.md` now opens with the ten-line version** and reaches the full apparatus
  afterwards. Stage 8B built the demo game against the public API and needed exactly
  "the player pressed, subtract eighteen"; it met the catalog-plus-traits-plus-persistence
  apparatus first, concluded the system was too heavy, and wrote forty lines of its own
  rules. The short path always existed and was not shown.

### Measured — stage 8B: can a 4B defend a brief without contradicting itself?
- 20 sessions x 16 turns = 320 turns, neutral questions only, Qwen3-4B: **zero departures
  from stated facts**. The model is a reliable witness to what it was told.
- **One derived fact was wrong in 19 sessions out of 20 — identically wrong every time.**
  A consistently wrong answer reads as a designed tell. Never ask a small model to compute.
- Uncovered questions: 65% declined honestly, 35% borrowed a nearby fact, 0% freely
  invented — after adding an explicit "say you do not remember" instruction. Cover what
  players will ask, or the gaps fill themselves.

### Measured — stage 4B: does the state block change what the model says?
- Stage 4 reported no effect. That was a MEASUREMENT error, not a result: it counted "did
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

### Added — stage 4: internal state (mood, relationships, needs, traits)
- Four axis KINDS, kept apart because they live on different timescales: a mood eases
  back to a baseline, a need grows until something satisfies it, a relationship only
  moves when something happens, and a trait never moves at all. Merging any two of them
  produces the classic bug where either the mood stops decaying or the need starts.
- `AxisDefinition` carries range, baseline, rate per hour, hysteresis, the model's write
  allowance and the descriptor bands — no threshold or rate is hardcoded in logic.
  `AxisCatalogAsset` / `TraitPresetAsset` are the authored form, with `schemaVersion` and
  a migration hook from the first version.
- Relationships are keyed by PAIR, so NPC↔NPC opinions work from day one.
- Descriptors, not numbers: each band maps to a short clause per language through stage
  3's `LocalizedText`. A small model given `trust: 7` either ignores it or over-dramatises
  it. The block states only what has actually moved, ranked by how far from baseline, and
  is capped at two clauses.
- `StateVerbGate` filters the VERB list from state the way perception filters targets: an
  exhausted character is not asked to decline to look around — the verb is absent from her
  grammar. Verbs by state, targets by perception, composing without knowing about each
  other.
- The model's own way in is the `feel` action, whose `axis` parameter is a grammar CHOICE
  built from the axes a designer opened. Needs are unreachable rather than merely
  rejected, and open axes are magnitude-clamped per reply.
- `OnThresholdCrossed` fires once per band crossing, with hysteresis, and never on load —
  so a milestone is celebrated the moment it happens and not again at every launch.
- Save/load through `IStateStore` with `Export()`/`Import()` for projects that own their
  save format; mood is deliberately session-only.
- `Log`: the plugin's single logger, with `Debug` compiled out unless `AINPC_DEBUG` and a
  redirectable handler for projects with their own logging.

### Added — stage 3: points of interest (perception with no wiring)
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
  prompt and the target enum of the stage-2 grammar. A character is therefore unable to
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

### Added — stage 2: structured actions via grammar-constrained decoding
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

### Added — stage 1C: preset catalog
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
- Seed content: Qwen3 8B/4B/1.7B/0.6B across the tiers for en, es, ja, zh-Hans, ru — all
  Apache-2.0, none gated. TTS slots are left empty with an explanation where no
  licence-clean voice could be confirmed.

### Added — stage 1: hardware tiers, auto-tuning, degradation cascade
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

### Added — stage 1B: streaming reply parser and sentence-level TTS handoff
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
- `NPCDialogueController` routes its reply through both. It keeps the single voice
  ticket, the ducker and the `_isBusy`-in-`finally` discipline, now spanning the whole
  multi-sentence session. Push-to-talk may now interrupt her mid-reply.
- 34 EditMode tests for the parser, including a captured real token stream replayed
  verbatim.

### Added — stage 0: package skeleton and the assembly boundary
- `Assets/OfflineAINPC/` package layout: `Runtime/` (Core, Speech/Tts, Speech/Stt,
  Memory, Hardware), `Editor/`, `Tests/Editor`, `Tests/Runtime`, `Documentation/`,
  `LICENSES/`.
- Four assembly definitions. `OfflineAINPC.Runtime` has an **empty `references` list** —
  no game assembly, no LLMUnity, no whisper.unity — with `Newtonsoft.Json.dll` pulled in
  as an explicit `precompiledReference` (it is a plugin DLL, not an asmdef assembly, so
  naming it under `references` would silently fail to resolve). That empty list is what
  makes the decoupling a compiler-enforced fact rather than a claim.
- `ILanguageSource` + `FixedLanguageSource`: the seam that replaced `TTSEngineManager`'s
  direct read of the game's `LanguageManager`.
- `MicChunk`: the recorder's own PCM carrier, replacing whisper.unity's `AudioChunk` on
  the mic event, so the STT package is no longer a compile-time dependency of the mic.
- `ExternalProcessRegistry` + `ExternalProcessLifecycle` (+ the Editor-side hooks): one
  teardown point for OS child processes, wired to `beforeAssemblyReload`,
  `ExitingPlayMode` and `Application.quitting`. Piper's process pool registers itself.
- `HardwareTierDetector`: the GPU/RAM/thread tier probe, split out of the game's
  `HardwareDetector` MonoBehaviour with a pure `Resolve` for testing.
- `DependencyGuard`: version-define state (`LLMUNITY_PRESENT`, `WHISPER_PRESENT`) plus
  `Require*` helpers that fail with a readable message naming the package and version.
- EditMode tests for conversation memory, the hardware tier table, the mic ring-buffer
  slice arithmetic, the process registry, and the language seam. PlayMode tests for
  recorder/mic-loop lifecycle and PCM↔AudioClip round-tripping. Nothing in the suite
  needs a model, a microphone, or a network.

### Moved (behaviour unchanged)
`ITTSEngine`, `ILanguageAwareEngine`, `AudioData`, `AudioClipConversion`, `VoiceConfig` /
`IPiperVoiceRouter`, `PiperProcessPool`, `PiperEngine`, `VoicevoxEngine`,
`TTSEngineManager`, `SharedMicLoop`, `PersistentMicRecorder`, `NPCMemory`,
`IKeyValueStore`, and the `Language` enum. Namespaces became `OfflineAINPC.*`; every
file kept its `.meta`, so scene and prefab references are untouched.

### Known limitations
- `LLMUNITY_PRESENT` will not be defined while LLMUnity lives in `Assets/` rather than as
  a UPM package: Unity resolves `versionDefines` against the package registry only. The
  define starts working the moment the dependency is consumed as a package, which is how
  a customer will install it. Nothing in the plugin currently uses LLMUnity, so this is
  latent, not broken.
- No `package.json` yet — this is still a folder inside the game, by design.
