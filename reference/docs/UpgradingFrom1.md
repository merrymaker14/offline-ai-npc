# Upgrading from Offline AI NPC 1.0

**Upgrade guide for version 1.1.** This page describes updating the published 1.0 package to 1.1. Read the [changelog](../CHANGELOG.md) for the version you install and keep a backup of your customized project.

### Defaults and your existing project

New speech presets use the same 0.6B CustomVoice Q4 talker and Q8 codec at every LLM tier. Leave **External server URL** empty to use the bundled Qwen CPU DLL. Larger talkers and external HTTP/GPU setups are advanced alternatives to check on your target hardware. All built-in Qwen TTS presets use `serena`, so switching the dialogue language keeps the same speaker.

The default non-thinking reply profile allows up to 128 generated tokens and carries a one-sentence limit. The limit does not require a 128-token reply. The token ceiling is written to every agent of the LLM when the model starts. The sentence limit is applied by the code that delivers a reply: a **Hello NPC Character** applies it when its **Reply Limits** is **Reply Profile** or **Current Language**, and as shipped speaks every sentence within the token ceiling. Custom presets remain yours. Sampling values typed on an `LLMAgent` take effect in Play only with **Override agent sampling** turned off on the LLM host; it is on by default.

Whisper supplies the optional microphone path in 1.1. Use a multilingual Whisper model when dialogue switches between languages. VoiceDesign is planned for the next version.

## The short path

1. Save your project and make a version-control commit or a complete backup. Keep copies
   of your own scenes, prefabs, language definitions, axis catalogs and action handlers,
   especially anything you edited inside the package folder. Preserve existing player
   memory/state data and NPC ids so you can check them after the upgrade.
2. Import the update into a copy of your working project first. Review which package
   assets will be replaced. Keep your working speech engine and voice files for this pass.
3. Use **LLM for Unity 3.0.3 or newer**. This was the documented minimum in 1.0; the newer
   integration now enforces it for recognized installations. Versions 3.0.1 and 3.0.2 are
   below that floor too. An unrecognized version is not proof of compatibility.
4. Open your own character scene and run **Tools ▸ Offline AI NPC ▸ Check my setup**.
   Fix the language-model items required for typed dialogue, then test a typed reply.
   Microphone input and voice output are optional for this first check. Keep speech
   errors visible and resolve them before testing speech; preserve a working Piper setup.
5. Check an ordinary reply, an interrupted reply, each language you use, and a restart
   with existing memory/state. Then make and test a player build with your model inclusion
   settings and the speech executable/libraries you plan to distribute.

Welcome reports files from its last scan, not proof of active selection or native
startup. Found files, missing files, incomplete downloads, established defects and
unavailable verification are separate states. The language-model recovery buttons
open the LLM tab and clear its unused-file filter; they do not choose a model or
start a download. Refresh the status after changing files.

## One reply without speech

Use `HelloNpcCharacter.SayText(string)` for a text-only turn, or
`TrySayText(string)` to keep input when submission is rejected. For an assigned `hello`:

```csharp
if (hello.TrySayText(playerLine))
    playerLine = "";
```

`true` means submitted, not completed. Blank input, required model setup, an inactive
character or a busy/still-settling turn can reject it. Subtitles, actions, `Finished`
and ordinary UI conversation history use the existing pipeline. This turn does not
check speech readiness, create a speech session/clip or request synthesis.
Existing `Say(string)`/`TrySay(string)` and UnityEvent bindings remain supported.
The component's `Start` can still inspect/start an assigned engine: leave Engine empty
if the scene should have no assigned speech engine. A typed or spoken turn and an MCP
`say` take turns on the same character — while one runs, the others are refused — and a
cancelled reply keeps the character busy until the model's running task has actually
finished.

## Stop buttons and pending generation

`HelloNpcCharacter.CancelReply()` and `StopSpeaking()` are additive; `Say(string)`,
`TrySay(string)` and existing event signatures remain supported. Both Stop methods
cancel the whole reply while keeping the component enabled and the borrowed engine
running. Wait for `!IsBusy` before retrying a kept question: a cancelled generation or
repair keeps the character busy until its task has actually finished. Cancellation does
not roll back actions that already ran. Optional speech readiness and listener failures are
contained; a missing AudioSource stays subtitle-only without a clip or audio-onset
claim, while the existing synthesis iterator is still driven.


<a id="optional-own-gguf-assignment"></a>
## Optional: assign your own GGUF to Hello NPC

This is an optional editor route, not a required scene migration. Updating the package,
finding/importing a GGUF, selecting it or previewing it does not automatically rebind
an existing scene. Keep a working setup until you explicitly choose another one.

In Model Manager, select the found or imported file for an existing Hello NPC, use
**Preview application**, then explicitly **Apply to this Hello NPC**. Apply sets
`LLM._model` to an absolute file path, enables that LLM and disables only its scoped
linked `TierBootstrap` for manual startup. Other settings and references, presets,
catalogs, manifests, defaults and voice/STT are preserved. Preview does not edit the
scene, start/download a model or change voice. Save the scene deliberately; Unity
**Undo** restores its previous configuration. Shared/ambiguous bindings and stale
previews are refused.

The prefix and file-version checks are not a whole-file checksum or proof of native
tensor compatibility. The applied path is machine-local: configure the player model
path and build inclusion separately. Including the file does not rewrite `LLM._model`.
Check real startup and a typed reply in Play and in the built player. Follow
[the own-GGUF steps](GettingStarted.md#own-gguf-with-hello-npc) for requirements and
refusals. An explicit matching manifest/host remains the alternative for tier startup.

## New MCP entry points

Start a new agent session with `project_overview`, select one exact character and use
`inspect_character` for its configuration and declared bindings. `setup_plan` explains
the first typed dialogue without starting Play or a model. Default reads do not probe
model/voice readiness or scan files. Request `probe_runtime` or `check_files` explicitly
when you want those checks; runtime getters may initialize a manager or restore flags.
Projected/filtered snapshots report exclusions and unknown evidence, and continuation
keeps the captured snapshot. Existing tools, unique selectors and custom character
interfaces remain supported; implementing the passive inspection source is optional.

Hello NPC now implements `ILiveVerifiable` directly. Its screen and MCP use the same
assigned Agent, take turns on the character, and run the same actions and presentation.
`say` with `speak:false` does not create a speech session or read voice readiness.
Cancelling an MCP operation cannot cancel a later reply from the screen; the character
stays busy until the model's running task has actually finished. Verification
history/reset is in memory; saved history files are preserved.
Language sweeps are refused because this sample has no persona/voice switch. Dispatcher
calls are observed; durable world mutation is not. Native startup and actual replies
still require verification.
Voice and microphone are optional for the first typed check; keep working Piper files.

## Reviewed MCP changes

The four additive tools `preview_poi_change`, `preview_state_change`, `apply_change` and
`verify_change` provide a reviewable one-target path. Existing `set_state` and
`mark_point_of_interest` remain immediate calls; their `dry_run` option is still unsupported.
Select an existing exact ref, review a complete preview and apply its `plan_id` once.
State preview is passive and refuses an uninitialized model instead of loading its store.
Delta keeps Game trait sensitivity; an absolute value does not scale with sensitivity.

Apply reports the value it wrote separately from the state seen after callbacks ran.
Retrying a token that was already applied returns the first receipt and never writes
again. If an exception escapes the apply, whether the write happened is unknown — there is
no receipt and nothing is rolled back. Call `verify_change` with the same `plan_id` and read
`get_state` before deciding on another delta: repeating a delta after an unknown outcome can
apply it twice.
Relevant changes, scene/model replacement, reset and expiry can invalidate plans.
POI uses Unity Undo outside Play and does not save a scene; State is model-only without
Unity Undo. A State Store can flush persisted values outside Play too. Neither apply nor
verify proves durable saving, and neither calls `SaveNow`. Read [Agent tools](AgentTools.md)
for limits and recovery. 

## Reply analysis context

`check_reply` adds `analysis_context` while preserving existing arguments and result
fields. It checks the schema at analysis time, not the original generation prompt or
grammar. A perceiver uses its current cached targets without refreshing the world.
An earlier reply may fail after a quest stage, permission or target changes. Equal
target-registry counters still mean `unknown`; `changed` only reports that counter's
change during this call. Filters and permissions are not snapshotted. Accept the new
JSON object and keep gameplay checks in your action handler. See [Agent tools](AgentTools.md).


<a id="qwen-windows-build-check"></a>

### Qwen's local route changes in 1.1

An empty **External server URL** now selects the included Windows x64 CPU native DLL. You no longer need to build or copy a Qwen `tts-server.exe` for this ordinary route. Download the talker and codec in Model Manager as before. A nonempty URL and `AttachTo(url)` retain the advanced HTTP route and the separately launched server's ownership.

Existing `Say` / `TrySay`, serialized engine references and public `StartAsync` remain. **An existing Piper scene keeps Piper**: updating does not replace its executable, voice pair, casting or binding. New components use the bundled CPU DLL with External server URL and Style empty; existing serialized settings are preserved. Cancellation awaits actual native work before context free. Test this DLL, model pair, language and Unity backend in Editor and your built Player before shipping your game.

<a id="optional-piper-voice-connection"></a>
## Optional: connect a selected Piper voice

This is an optional Windows Editor route, not a required migration. Updating the
plugin or importing a pair leaves a working voice and its scene references in place.
In Model Manager, use **Connect selected Piper voice**, select an unused ordinary
scene engine, then **Preview** and explicitly **Apply to this engine**.
The window can copy the local pair permanently to `StreamingAssets/piper/voices` or
reuse a matching pair there, and configure only that engine's default voice. It does
not wire Hello NPC, change the character's language, install Piper or prove readiness.

**Undo** restores engine fields, not the permanent file copy. **Include in build** is
a separate staging choice and can add a duplicate pair. Shared/prefab engines, custom
routers/paths and overriding catalogs stay on their existing manual route; new fallback
assignments are limited to the cached English/Spanish language. An exact catalog voice
may need no field change. Keep working settings and resolve the reason for a refusal.
Follow [the four connection steps](GettingStarted.md#connect-selected-piper-voice) for
manual installation, cancellation and file-preservation limits, then check actual
character wiring and speech separately. License, provenance and voice language remain
Unknown; names or valid files do not establish distribution permission.

## Keep Piper, or configure Qwen3-TTS deliberately

Piper remains a supported engine. Updating the plugin does not require converting a
working Piper integration to Qwen3-TTS. Keep both the `.onnx` voice and its `.onnx.json`,
check that the language definition still selects `piper`, and verify the engine binding in
your scene. The built-in language definitions now select Qwen3-TTS; in 1.0 they selected
Piper, and VOICEVOX for Japanese. A Language Set of your own keeps the engines it names. A
1.0 scene keeps its speech manager's binding rows; without rows, every language Piper has a
voice for still goes to its Piper field, and the Console says which. The development
samples use Qwen3-TTS; they are examples, not replacements for your own character scene.

For a local voice, **Model Manager ▸ Import file** copies the `.onnx` and its adjacent
`.onnx.json` together. Keep both originals in the same source folder. The import checks
both before copying and refuses existing destination files; it does not replace a
working voice or attach another voice's config. Read the error if an import fails:
changed files or files whose ownership cannot be verified are preserved for inspection.
Copying and verification run in the background; watch the inline progress or use **Cancel
import**. Cancellation waits for ownership-safe cleanup. Closing the window requests
cancellation too; a normally completed cleanup can report preserved paths in the Console.
Wait for an operation to settle before retrying a conflicting download, import or deletion.
On Windows, choose an ordinary drive or UNC path for these operations. Device/extended
namespace paths and components ending in a dot or space are refused as ambiguous aliases.

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no separately started HTTP server, Python environment, speech executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).

An existing custom `IPiperVoiceRouter` continues to own casting. The legacy manager
retains its published English, Spanish and Russian Piper routes even with empty voice
fields. Configure an explicit binding or Piper voice for additional languages; the
router interface has no query that proves support for every language. Voice readiness
and its actual files still need checking before speech.

The Qwen client sends the requested language separately from its speaker. If you use
the optional external HTTP route, the server build must support per-request `language`;
older servers ignore it and keep their process-wide setting. Check short replies and
a language switch with that server. Updating this Unity package does not rebuild or
replace a manually installed speech server.

## If the project has compile errors after importing

Errors about `LLMAgent` or `LLMClient` in `OfflineAINPC.LLMUnity` can mean an old loose-folder
LLM for Unity install is still paired with the `LLMUNITY_PRESENT` scripting define set by
1.0. With compilation already broken, Unity may not load the updated detector that would
remove it.

Update LLM for Unity to 3.0.3 or newer. If you are recovering before that update, remove
only `LLMUNITY_PRESENT` from **Project Settings ▸ Player ▸ Other Settings ▸ Scripting Define
Symbols** for the affected target and let Unity compile. Keep your other symbols. The
optional integration stays unavailable until the dependency is compatible. Restore the
dependency and verify references on the character before continuing.

## Custom speech and subtitle code

| Your integration | What to check |
|---|---|
| `ITTSEngine.Synthesize(string, int, Action<AudioData>)` | The original one-buffer contract still works. Streaming is an additional interface, not a required rewrite. |
| Existing `StreamingSpeechSession` constructor | The original signatures remain available. Your call can stay as it is. |
| Subtitle callback also appends a transcript or counts lines | It can now receive the same text to extend its deadline. Use the new overload's `onSubtitleExtended(seconds)` callback for deadline-only updates. Durations start at the callback and use unscaled seconds. |
| Interruption checks only `AudioSource.isPlaying` | Use `session.IsSpeaking` as well: a paused streaming reply is still interruptible. Call `Cancel()` to stop the whole reply. |
| You stop the hosting coroutines yourself | Dispose the session too, so its current clip and pending work are released. |
| A custom streaming engine | Deliver ordered chunks with one sample rate/channel count per request and honor cancellation. Test pauses, partial failures and scene changes. |

See [Dialogue](Dialogue.md) for wiring and lifetime details. Recheck code that assumes
every subtitle callback is a new sentence, even if it previously worked with a one-buffer
engine.

## Existing saves and model inclusion settings

Keep the same NPC ids, state keys and `memory_` keys. This update does not require
converting the existing state or conversation-memory JSON formats. A custom state store
can keep its `IStateStore` implementation. Nested `SaveNow()` calls made by its callback
are coalesced; changes made during that write remain pending for the next debounce or
pause/disable/quit flush. A nested request gets one deferred flush after the current
read/write returns, even if its callback disabled the character. Continuing callback
mutations remain pending without an endless synchronous loop. Changes smaller than the presentation-event threshold count
as pending saves too. A callback cannot write over an unfinished read, and a superseded
read cannot replace a newer store selection or explicit `Import`.

If your synchronous memory compactor or key-value store callback appends or clears the
same character's memory, the requests now run in order after the current mutation.
Queued appends keep the rolling cap without calling the compactor again in that batch.
Inside such a callback, a queued request has not reached the store yet; inspect the final
memory after the outer operation returns. Keep summarization cheap and synchronous.

Custom callbacks must not create unbounded memory changes. While one outer call runs, the
callbacks it triggers can append or clear memory up to 128 times in all, across every store
and character, with at most 64 different character memories nested at once. Further
requests are refused with one warning; requests for the same character still run in order.
The next ordinary call starts with a fresh budget. Existing memory keys and JSON are unchanged.

Older per-user `OfflineAINPC.IncludeInBuild.<assetId>` choices migrate to
`ProjectSettings/OfflineAINPCModels.asset`. Commit that project-settings file once you
have verified the intended inclusion choices. If saving it throws, the old key and
previous in-memory value remain available for retry; fix the write problem and select
the setting again. Check the resulting file and model inclusion in a player build.
Silent native storage failures still need validation in the actual Unity editor.

Regenerating `required-models.json` now refuses an unreadable file or a schema from a
newer plugin instead of replacing its metadata. Preserve the file and use a compatible
plugin, or deliberately recover it from your backup before regeneration. The original
unversioned manifest and understood versions remain accepted. Native import and the
resulting player build still need checking after the file has been saved.

`required-models.json` is now saved to `ProjectSettings/OfflineAINPC/`, next to the other
model choices; inside the plugin folder, a remove-and-reimport of the plugin deleted it. A
1.0 manifest at the old place is still read until a new one is saved; after that the old
copy is no longer read and can be deleted. Commit the new file.

## Speech callbacks and the starter sample

Existing speech constructor signatures and callback types remain unchanged. Subtitle
and subtitle-extension callbacks that throw are reported without ending the voice
session. Call `Cancel()` or `Dispose()` explicitly when you want to interrupt a reply.
Cancelling from `OnFirstAudio` no longer shows that reply's stale subtitle. Disposing
an unfinished playback iterator cancels its pending synthesis before `OnFinished`.
A completed session's later disposal cannot stop the next reply on the same source.

Hello NPC can answer in text when its Engine field is empty. Assign a speech engine
to add voice; an absent speech engine no longer blocks a ready language model.
Setup check offers direct buttons to the relevant model window or setup guide beside
supported problems. Opening these helpers does not change settings or start downloads.

`HelloNpcCharacter.Say(string)` keeps its void signature, including assignments to
`Action<string>`. The optional `TrySay(string)` reports whether input was accepted;
the sample HUD keeps a rejected question while the model starts or another reply runs.
Acceptance is not completion: use the existing reply events for the eventual result.

A timed-out startup measurement is retired and its token-limit override restored once,
but the agent remains reserved until the original generation and tokenization settle.
Hello NPC and the supplied live adapter refuse generation while that reservation is
pending. Cancellation alone cannot prove native completion. Custom `ILlmHost` code
keeps its existing interface; implementing the additional `ILlmMeasurementLifetime`
allows the cascade to retire a pending task. Code of your own that calls `LLMAgent.Chat`
directly must refuse too while `LlmMeasurementAdmission.IsPending(agent)` is true.
Native teardown waits for the host
measurement to settle; an indefinitely pending backend is not declared ready.

TTS switch observers are contained per listener. A nested `SwitchForHost` request joins
the switch already running instead of starting another engine; its own iterator does not
wait for that switch. Check the final engine and language readiness when a custom observer
queues a change, and dispose an abandoned host switch iterator so it releases the switch and
its paired notification.

A running switch carries out at most 128 further switches that observers ask for; an
endless chain is refused with one warning. A burst of pending requests still ends at the
latest choice, and the next switch from outside starts afresh. Old cached benchmark speeds
and layer-growth suggestions are ignored when their measurement is out of date; layer counts
known to work and markers of unfinished attempts are kept.

The startup speed is now the number of tokens that arrive after the first non-empty batch
of streamed text, divided by the time from that batch to the end of the reply. When the reply arrives in one batch,
tokens cannot be counted or the interval cannot be seen, no speed is reported rather than an
estimate. Speeds recorded before this change are not directly comparable.

## Custom verification adapters

Existing verification rows retain their JSON-array format. A real legacy measurement
without a configuration fingerprint remains stale. A read failure is shown as unknown
and retried; it is not an empty history that a new result may overwrite. Unsupported or
unreadable whole files are preserved. If saving or forgetting results fails, resolve the
reported file access problem and retry. A reply may have played even when its result was
not saved; live verification reports that distinction. None of these checks substitutes
for listening to your actual character after the upgrade.

`ILiveVerifiable` remains compatible with existing adapters. A warm latency run needs a
conversation of its own: implement `IConversationIsolation.TryIsolateConversation(out
IIsolatedConversation conversation, out string problem)`. Set the agent's history, any
rolling summary and its save setting aside, start an empty conversation that is never
saved, generate the run's turns through `conversation.GenerateAsync`, and refuse every other
generation until the originals are back. Put them back only after every turn the run started
has finished, including after a cancelled run. A turn of the run may add only the player's
line and one reply; anything else — a reply generated on the agent directly, during a turn
or between them — was written by someone else, so leave the history as it is, report the
conflict and refuse the run's later turns. Start a run only while the character is idle.
For an `LLMAgent`, `AgentConversationIsolation.TryBegin(agent, generate, out problem)` sets
the conversation aside, keeps the run unsaved, detects the conflict and puts the originals
back; it needs Play mode. It does not refuse other generations itself: while its `Active`
is true, your character refuses them, as the supplied adapters do. Without isolation the
runner reports an inconclusive run before generation and does not touch the conversation.
The runner no longer calls `ResetConversation` or `IConversationResetVerifier`.

`SetLanguage(code, onProblem)` should apply the selected language setting before its
first yield, then wait for the voice. The supplied adapters already follow this order.
On cancellation, verification can restore the setting immediately and hand the remaining
voice switch to a surviving cleanup host. One probe owns the project language until that
rollback completes. Cleanup is bounded to 45 seconds and reports failures; an editor
reload or quit defers voice startup to the next session. A custom adapter that delays its
setting change until after a yield cannot guarantee synchronous rollback during reload;
check its ordering and handle the reported restoration failure.

## Editor language and diagnostic reports

Choose English, Russian, Simplified Chinese or Spanish in **Welcome** or **Check my
setup**. This is an editor preference: it does not change an NPC's language, presets,
model selection or a working Piper setup. Available translated guides open in the same
language; pages without a translation fall back to English.

Built-in setup results can be displayed in the selected editor language. Existing
`CheckResult` fields, check ids, severity and the copied plain-text report remain in
their original English format. Custom messages without translation data are displayed
as written. Existing code that consumes the report needs no change for this feature.

`CheckResult.Presentation` is optional read-only view data. Unity's public-field JSON
shape is unchanged. If your serializer also includes public properties, exclude this
property when you need to preserve the old five-field JSON contract.

Model Manager can show `VerificationUnavailable` when a previously checked file's
current version cannot be read, for example while another program locks it. The file is
preserved; resolve the access problem and re-verify. It is not treated as a usable model
or as proven corruption. Existing `ModelAssetState` values 0–6 keep their numbers; custom
state switches should also handle this new value 7.

For LLM `.gguf` files, the scan also checks up to 64 KiB of the structural header,
including files named in your own catalog. Empty files and proven truncated or
invalid headers are excluded as damaged. Unsupported versions or byte order, unreadable
files and files changed during checking are unavailable for verification, not proof of
corruption. Vocabulary-only containers without LLM tensors are also excluded without
being declared damaged. The check supports little-endian GGUF v2/v3, retains stable results for the
editor session and does not repeatedly hash the whole file. A passing prefix is not a
checksum or proof that the native backend can load all tensors; test actual loading
before shipping. Finding a manual file still does not select it for your character.

When the tensor directory fits inside the read budget, the check accounts for
`general.alignment` (32 when omitted), rejects padding without weight data and checks
tensor offsets against the aligned data area. Ambiguous or unsupported alignment is
unavailable for verification, not proof of corruption. The prefix is read through one
held file handle. On Windows, sharing rules block concurrent writes or replacement
while that handle is open, including when a rescan reuses a cached prefix result.
This does not protect against later edits, including edits to the same file that
restore its original length and timestamps.

Diagnostic ids and severities remain stable, but human-readable repair wording can be
corrected. Use the id for programmatic routing rather than matching a full repair sentence.

Model lookup rechecks a cached path and periodically refreshes missing nested
StreamingAssets files, so moving or adding a file need not require a Play restart.
Lookup is not a native loading check. Build-scene validation scans enabled build
scenes even when other disabled, unlisted or unsaved scenes are open; the explicit
open-scene check remains available for those scenes. Prefab and asset checks retain
their existing scope.

## Service menu items moved under Advanced

**Tools ▸ Offline AI NPC** keeps the windows at the top: Welcome, Model Manager, Presets,
Check my setup, Live verification, Prompt debugger and Agent tools (MCP) with its start and
stop items. Everything else is one level down, under **Advanced**: Check my setup (log to
console), Live verification — verify everything (console), Validate model references,
Check for unaddressable scripts, Re-check LLMUnity installation, Reset to the embedded
catalog, Show welcome again after the next reload, Logging and Speak one line (Piper). A
script that runs one of them by its menu path needs the new path, and a shortcut bound to
one of them in the Shortcuts window needs binding again.

## Optional features and platform checks

The new [MCP tools](AgentTools.md) run in the Unity editor and start disabled. Enable them
only if you want an MCP client to work with the plugin; upgrading a game does not require
configuring them.

MCP write calls reject ambiguous NPC selectors and unsupported arguments such as `dry_run`.
`set_state` distinguishes refusal from a valid unchanged or clamped value. Keep existing
NPC ids/save keys and resolve scene ambiguity before retrying; see [Agent tools](AgentTools.md).

MCP scene references are optional additive selectors: `character_ref` for
`inspect_prompt`/`say`, `state_ref` for `get_state`/`set_state`, `perceiver_ref` for
`perception`/`check_reply` and `poi_ref` for editing an existing POI. Obtain them from
`list_characters` or `list_points_of_interest` and pass a reference instead of the
corresponding legacy selector, never both (including explicit nulls). Old unique
selectors still work. References are temporary exact-component handles, not save keys;
relist after removal/replacement, scene changes or editor/server reset. Historical
inspection continuation does not renew them. Memory `npc_id` and `check_reply.character`
retain their store-key and speaker meanings. Existing ids and saved data stay unchanged.

MCP consumers must handle unknown readiness explicitly: a failing getter returns `null`
instead of a guessed `false`. Read the accompanying status and `readiness_diagnostics`.
Known values retain their booleans; an absent voice stays distinct from an unreadable
binding. `say` reports model readiness failure promptly and preserves text when only
the requested voice cannot be checked. This does not change the public runtime interfaces.

MCP consumers must also follow bounded inspection pages. For `list_characters` and
`inspect_prompt`, check `page.complete`; while false, call the same tool with only
`cursor=page.next_cursor`. Reassemble marked fragments before treating long values as
complete. Continuations describe one captured snapshot, not the current scene. An expired
or unavailable cursor requires a fresh first call; it never silently refreshes the data.
`max_bytes` defaults to 65536 (8192–262144) for the encoded result including text and
structured copies, excluding the protocol envelope. Small results keep their old fields;
text keeps the captured summary before a blank line and page JSON, and that summary
also counts toward the budget. Continuations repeat it without rereading providers;
older clients must learn pagination for large results. Other/custom tool outputs and
runtime/save interfaces are unchanged. See [Agent tools](AgentTools.md).

macOS has not yet been verified for the complete upgraded plugin by the publisher. Test
the actual native engine build, Unity backend and player on the target platform before
promising support for your game. A compiling C# assembly alone is not that validation.

## Before replacing your working copy

Confirm that your customized assets, NPC ids and saved memory/state survive; your languages
select the intended engines and voices; interruption does not resume stale speech; and
the built player locates its included or downloaded models. Keep the backup until these
checks pass in your own project. No universal save-data conversion has been verified yet.

## Published utility APIs

`ActionParams.TryGetNumber(name, out var value)` still infers a double, and `out _` remains
valid. For a float, use `TryGetFloat(name, out float value)` or `GetNumber(name)`.
Only code written against the unpublished float overload needs that accessor renamed;
published 1.0 handlers require no such change.
The one-argument state/perception `EstimateTokens` and two-argument `HardwareProfile.CacheKey`
signatures remain present, so old method-group assignments to delegates compile too.

`ActionIdentifiers.ToRuleFragment(string)` keeps its 1.0 mapping and signature.
`LatencyMeasurement.Turns` keeps its `string[]` type, including `.Length` and array
assignment. Existing integrations using these members do not need a source change.

`ActionTurn` now coordinates grammar ownership for turns using the same `IGrammarSink`
instance. Keep that instance shared for one backend grammar slot, and always end or
dispose a turn. An old turn cannot clear a newer owner after a reentrant callback.
Separate wrappers around the same native slot are not automatically identified.
Recursive schema filters and stale state notifications are contained; reset and
restore do not emit an obsolete change after a callback replaces the value.
The JSON writer refuses cyclic or excessively nested values with an
`InvalidOperationException`; overflowing JSON numbers are refused during parsing.

<a id="types-that-are-no-longer-public"></a>
## Compatibility of 1.0 editor helpers

These deprecated entry points keep existing source compiling:

- `OfflineAINPC.Core.ExternalProcessLifecycle.Install()` still installs the quit hook.
  Hooks are automatic; remove the call when convenient. Calling it again does not stop registered hosts.
- `OfflineAINPC.EditorTools.AddressableScriptCheck.RunFromMenu()`, `Scan(string root)` and
  its public `Problem` fields and `Describe()` remain available, backed by the current scanner.
  The menu is **Tools ▸ Offline AI NPC ▸ Advanced ▸ Check for unaddressable scripts**.
- `OfflineAINPC.Editor.Packaging.DocumentationAssets.Folder` and `.Images` remain constant
  strings with their original 1.0 values. The script keeps its path and GUID, so importing 1.1 replaces it.
  For a relocated package, resolve paths relative to its actual folder.

The public publisher operations shipped in 1.0 are removed from the buyer package:
`PackageExport.Export()`, `CollectShippingPaths()` and `IsExcluded(string path)`, and
`DocumentationAssets.ApplyImageSettings()`, `FloatDocWindows()` and `Count()`. If your build
pipeline called them, select your own game assets explicitly and use
`UnityEditor.AssetDatabase.ExportPackage(paths, destination, options)`; filter and count that same
path list. Configure your screenshots through `TextureImporter`, and open your own editor windows
with `EditorWindow.GetWindow<T>(utility: true)`. Publisher menus stay in the development repository.

Importing 1.1 over 1.0 does not remove files absent from the new package. The old publisher
helper `Assets/OfflineAINPC/Editor/Packaging/PackageExport.cs` can therefore keep its
**Tools ▸ Offline AI NPC ▸ Export .unitypackage…** menu. If you no longer need the original
1.0 helper, remove that old file. Keep the imported `DocumentationAssets.cs` compatibility
constants and your own editor wrappers.

## Custom preset catalog and downgrade

**Tools ▸ Offline AI NPC ▸ Advanced ▸ Reset to the embedded catalog** now replaces
official entries and retains your understood user entries. Keep the preset cache in your
backup alongside customized assets. If a newer plugin has written a schema this version
cannot understand, cache writes, update and reset are refused with the file path; keep
that file and use a compatible plugin rather than deleting it. A malformed cache may be
set aside under a unique recovery name. The public `ClearCache()` API still explicitly
deletes the whole cache, including user presets; use `TryResetToEmbedded` when you want
the preserving reset behavior.

To use the new Serena defaults for all built-in Qwen presets with a saved official catalog, choose **Reset to the embedded catalog**. This retains your user entries. Voice choices in your own Language Set or character requests remain your overrides.

A superseded model is still usable when its file is present. A Piper voice needs its
nonempty `.onnx` and readable `.onnx.json`; a green file status does not validate native
startup, the scene, redistribution rights or a target player.

## Build selections and dependency discovery

An explicit **Include in build** choice is retained when its model becomes missing,
corrupted, incomplete or temporarily unverifiable. The build now stops with the selected
file and its reason instead of silently omitting it. This also applies to a deleted manual
model or a removed catalog entry whose id is still selected in project settings. Restore
the model, finish its download/verification, or deliberately remove the choice in Model
Manager. An unavailable selected row can be unchecked; a disappeared row has a **Remove
from build** action below the list. The broken-reference warning switch does not permit
omitting an explicitly selected model. Files that are not selected do not block this
inclusion check. The preview uses the same selection rules as build preparation.

No selection means that you must supply models separately for your game's runtime.
The plugin does not automatically add a first-run downloader to your game.

Loose LLM for Unity discovery still has a disk fallback when Unity's asset index cannot
be read. An unrelated project's `package.json` or `VERSION` is no longer evidence of the
dependency's version. A recognized incompatible dependency is still refused; an unknown
loose version is still unknown, not a claim that it meets the documented minimum.
No automatic dependency installation or model replacement is part of this recovery.

## Microphone recordings and stop listeners

`PersistentMicRecorder.StartRecord()` starts a logical take; `IsRecording` is not proof
that a microphone is available. The next explicit `StopRecord()` still completes once
with a non-null, possibly empty PCM array when capture is unavailable. A capture restart,
device loss or component disable invalidates that take instead of mixing positions from
different microphone buffers. Disabling/destroying the component does not emit a stop
event by itself. If you start a new take after re-enabling, the invalid old take is replaced.
Treat an empty chunk as no speech; do not leave your dialogue locked waiting for PCM.
Each stop listener is isolated so one throwing listener cannot suppress later listeners.
Public recording methods and the `MicChunk` event payload remain compatible.

## Prompt inspection, object identity and custom model inputs

**Prompt debugger** now uses the same English, Russian, Simplified Chinese and Spanish
editor preference as Welcome. Changing that preference redisplays the captured prompt;
it does not call your prompt provider again or change the NPC language, the test line,
model, voice or generation settings. Section names, prompt text and custom error details
remain exactly as supplied. Token totals are estimates, not backend measurements.

The character picker selects an instance, even when several characters have the same id.
Refreshing retains that instance after a rename or list reorder while it still exists.
A failing id getter no longer hides the other characters. An unavailable or failed
inspection clears the previous totals. The public `ILiveVerifiable` / `InspectPrompt`
contract is unchanged: return null if inspection is unavailable, or a `PromptSnapshot`
with a non-null `Sections` list. An empty list is valid. A null optional exclusions list
is displayed as empty; it does not require a migration change.

`PerceivedPoi.Id` is captured when that item is created. Renaming a live point of interest
does not rewrite an older `PerceptionSnapshot`; the next recompute notices the changed id.
`PerceptionSnapshot.Items` remains `IReadOnlyList<PerceivedPoi>` and protects its item list
from later array edits. Use the declared read-only interface instead of casting it to a
mutable array. The referenced `Poi` remains a live object, not a frozen copy of the scene.
Nested registry callbacks keep the newest initialization or enable/disable intent.

A custom manifest can list several models for one tier. Installed candidates are tried
in manifest order before moving to a lower tier; `ModelCatalog.ForTier` still returns the
first declared entry. An unknown `TierPolicy.maxTier` produces a detected Fallback
verdict with a reason; without an explicit tier override, the host is not configured.
The existing explicit override priority and supported tier values 0–3 are unchanged.

Custom catalog JSON must use a supported whole-number `schemaVersion`. A fractional version
is not silently truncated. Sampling numbers that overflow their destination numeric type
are rejected rather than becoming Infinity. Missing fields retain their existing defaults.
The cache recovery and preservation rules above still apply; keep your cache backup.

## Check custom state and trait numbers

Existing state and memory saves need no format conversion. Keep the same NPC ids and
relationship keys. Check your custom axis catalogs and trait presets for `NaN` or infinity
after upgrading, including definitions that your code changes at runtime.

The catalog inspector and validation identify nonfinite axis fields. Trait asset
validation reports affected fields in the Console. Fix them at the source. Runtime
fallbacks keep state finite: an invalid baseline becomes clamped zero, an invalid trait
shift becomes zero and a nonfinite trait multiplier becomes one. Nonfinite axis rates
disable ticking; nonfinite model delta limits disable model writes. Nonfinite hysteresis
uses `0.08`, and bands with nonfinite boundaries are unavailable.

For a broken axis range, new game/model/tick writes are refused. Loading a finite saved
relationship or need preserves its number without applying that broken clamp and without
replaying change or threshold events. With a repaired valid range, later ordinary writes
use the normal clamp; editing the definition alone does not reclamp loaded values. Finite
tuning values keep their existing policy. Arithmetic overflow is refused before storing
a nonfinite result. See [State](State.md) for the recovery details. Test a restart with
your existing player data after repairing the settings.

The NPC State component inspector also checks its assigned catalog and trait preset.
Select a single character or the referenced asset when the selection contains different
assets and the result is undetermined.

## Language of the sample screens

Hello NPC, Living Character and World Aware now have their own four-language
selector for screen labels: English, Russian, Spanish and Simplified Chinese.
The serialized `_uiLanguage` field defaults to `en`; the toolbar changes only this
sample component. It does not use the editor language preference or change the
NPC's dialogue language, persona, language catalog or voice. Your existing
`Say`/`TrySay` calls and event bindings need no migration for this addition.

Entered questions, subtitles, provider errors, authored grammar and object IDs
remain as supplied. Context previews still use the samples' existing English
context calls. World Aware's last-action message and Living Character's stored
log lines keep the language used when they were created; switching the selector
does not retranslate that history. If you copied a sample script into your own
project, merge the optional display changes deliberately. Check fonts, layout,
input focus and serialized values in your own scene before shipping.

<a id="check-local-qwen-tts-in-a-windows-build"></a>
