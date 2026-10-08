# Agent tools (MCP)

The package includes an MCP server that runs inside the Unity editor. With it switched on, an AI
coding agent — Claude Code, Cursor, Codex, or any other client of the Model Context Protocol —
can see the characters in your open scenes and test them: read everything a character's model
is told, run a real turn and read the reply, look at state, memory and perception, and mark
objects so characters notice them.

It is an editor tool. It lives in the editor assembly, is off until you switch it on, and nothing
of it reaches a build.

---

## What it is for, and what it is not

**For iterating on a character with an agent in the loop.** "Why does the guard never mention
the door?" is a question with half a dozen possible answers — too far, out of sight, outranked,
never described, not in the prompt at all. An agent with these tools can ask the character
directly (`say`), read what the model was told (`inspect_prompt`), read why the door is or is
not in context (`perception`), change the thing that is wrong (`mark_point_of_interest`,
`set_state`) and ask again — without you clicking through four windows between attempts.

**For auditing a scene.** `setup_check`, `models`, `list_points_of_interest` and `list_actions`
answer "what is missing" and "what can these characters actually name and do" in one pass.

**Not a general remote control for the editor.** Creating objects, editing scripts, building
and importing are outside it. The agent's own file tools, or a general-purpose Unity MCP server,
do that; this server does the part only this plugin knows.

**Not a way for the agent to hear.** `say` with `speak: true` plays the voice in the editor for
whoever sits at the computer and reports how long synthesis took and how long the audio is. A
wrong voice is still a person's call.

---

## Turn it on

`Tools ▸ Offline AI NPC ▸ Agent tools (MCP)`, then tick **Run the MCP server while this project
is open**.

Use **Editor UI language** in the window to choose English, Russian, Spanish or
Simplified Chinese. It changes the window's labels and redisplays configuration notices;
it keeps the port draft and server settings and does not configure the NPC's language.
Tool identifiers, client commands and client-facing descriptions retain their original
language, as indicated above the tool list.

The window shows the address — `http://127.0.0.1:47371/mcp` unless you change the port — and
what the server has answered since the scripts last loaded. The setting is stored per project in
the project's user settings, which are not committed, so turning it on for yourself does not turn
it on for your team.

The server stops before every script reload and starts again after it. The menu also has
**— start the server** and **— stop the server** items, for a script or a keyboard shortcut.

---

## Connect a client

**Claude Code**, once, in a terminal:

```
claude mcp add --transport http offline-ai-npc http://127.0.0.1:47371/mcp
```

Or press **Add to this project's .mcp.json** in the window. That writes the server into
`.mcp.json` at the project root and leaves every other server in the file as it was; Claude Code
asks once before it connects to a server named there. A `.mcp.json` that is not valid JSON is not
overwritten — the window says what is wrong with it instead.

**Any other client** that speaks the Streamable HTTP transport: give it the address above. A
client that can only start servers as local processes (stdio) needs a stdio-to-HTTP bridge in
front of the address.

The server speaks both eras of the protocol on the same address: revision **2026-07-28**, where
every request carries its own version and capabilities, and **2025-11-25, 2025-06-18 and
2025-03-26**, which open with an `initialize` handshake. It offers tools only — no resources,
prompts or subscriptions.

---

## The tools

| Tool | What it does | Changes anything |
|---|---|---|
| `project_overview` | **Start here.** A passive snapshot of loaded scenes, exact component references, compiled capabilities and next calls; optional scene/name/active filters and section selection | no |
| `inspect_character` | Passive configuration and actual bindings for one selected NPC; optional explicit runtime readiness and voice probes | possible getter effects with `probe_runtime: true` |
| `setup_plan` | Steps for the first typed dialogue, with separate optional voice and microphone branches; file inventory checks only when requested | no |
| `list_characters` | Characters that can be talked to, with their ids, readiness, language and voice; NPC State components; Perception Queries; counts of points of interest and verbs; whether memory and state stores are installed; the project's languages; whether the editor is playing | no |
| `setup_check` | The *Check my setup* report: every check with its severity (`Ok`, `Degraded`, `Blocking`, `Unknown`), the capability it gates (`text`, `voice`, `input`), detail and fix; `readiness` per capability (`Unknown` when nothing measured is wrong but a row was not measured); `can_answer_in_text` — `true`, `false`, or `null` while a text row is unmeasured; `can_run_at_all` | no |
| `inspect_prompt` | Everything the model is told for one player line, section by section, each marked cached or rebuilt per turn, with token counts and why nearby objects are left out | no |
| `say` | One character turn: reply, raw output, action evidence and timings; optionally voice | history if `remember`; character-owned pipelines may dispatch game actions |
| `preview_poi_change` | Preview an edit to one existing point of interest, with a bounded one-use plan | no |
| `preview_state_change` | Preview one initialized state axis using the game's delta/clamping rules, without loading a store or changing state | no |
| `apply_change` | Consume a preview plan once and report the write's result separately from read-back | yes |
| `verify_change` | Read the same target after a completed plan; never repeat its write | no |
| `get_state` | Every axis with value, baseline, range and band, and the state block as the model reads it | no |
| `set_state` | Set an axis, or move it by a delta, and report the new band | yes |
| `get_memory` | The stored conversation and the memory block as the prompt receives it | no |
| `clear_memory` | Forget a character's conversations | **deletes** |
| `perception` | Recompute what a character notices: the context block, the ranked objects, and one line per nearby object on why it is in or out | no |
| `list_points_of_interest` | Every point of interest: id, description, priority, accepted verbs, position, duplicates | no |
| `mark_point_of_interest` | Add or edit a point of interest on an object — id, description in a language, priority, accepted verbs. Edit mode, undoable. `save_scene: true` saves only a scene that has a file and had no unsaved changes before the call; otherwise `scene_saved` is `false` and `scene_not_saved_reason` says why | yes |
| `list_actions` | The registered verbs with their parameters and descriptions; optionally the grammar | no |
| `check_reply` | A model reply through the plugin's reply handling without a model: the action block, the spoken units, the parse outcome and the repair prompt a failure would get | no |
| `models` | Model files and their state, this computer's hardware and the tier | no |
| `play_mode` | Report, enter or leave Play mode | yes |
| `recent_logs` | The console's recent lines, filtered by level, text or the plugin's own | no |

Each tool's description, which the agent reads, says the same in more detail, including what each
argument means. Tools that change things are marked in their annotations, which clients use to
decide what to confirm.

Numeric arguments must be finite: `NaN`, infinity and overflowing numeric strings are
reported as argument errors. `set_state` also rejects values that overflow the state's
single-precision representation. Valid values still follow the axis's normal clamping.
A custom tool's timeout must be finite and fit the host timer; an invalid timeout is
rejected before the call is queued, so the editor cannot execute it after returning an error.


### Overview, a selected NPC and the first conversation

Use `project_overview` before a detailed capture. Its default does not build a prompt,
read model or voice readiness, scan model files, initialize a speech manager or prepare a
character. Compile capability and scene wiring are evidence about configuration, not proof
that native generation works. Custom passive inspection providers must follow the same contract.

```json
{"sections":["characters","capabilities","next_calls"],"include_inactive":true}
```

`scene_path` selects a captured scene path; `name_contains` matches a display name/id,
and `include_inactive` controls inactive components. Selection counts distinguish captured
items, selected items, filter exclusions, projection omissions and unknown matches. These
counts are separate from the page's row counts. Identity, status and diagnostic evidence
remain available when a section is omitted; projection is explicit, not silent truncation.
Unknown section names and malformed options are refused before provider work.

Select an exact character reference from that overview, then request its card:

```json
{"character_ref":"<ref from characters>","sections":["configuration","bindings","next_calls"]}
```

`inspect_character` uses an optional passive inspection source. The LLMUnity adapter
reports allowlisted current component configuration with its actual component/member
source. This is neither an unchanged asset preset nor proof of a loaded native prompt.
State and perception bindings come from actual links; matching names or NPC ids do not
establish a link. Memory ids remain store keys. A custom character without this optional
source remains usable through the existing runtime API; its card reports configuration
as not observable instead of calling its active prompt inspection as a fallback.

By default `probe_runtime` is false. Set it to true deliberately to read the current
model and speech readiness. Provider getters can initialize a speech manager or restore
persistence flags; requested/performed probes and possible effects are disclosed. For
that reason this tool's static annotations are conservatively not read-only or idempotent.
A failed getter produces unknown evidence, not a guessed missing model or voice.
Neither mode prepares or generates a turn.

```json
{"check_files":false,"include_optional":true}
```

`setup_plan` describes Welcome → language-model dependency → one model → Hello NPC → a
typed UI reply. It applies no actions. With `check_files: false`, file availability is
not checked; true explicitly reads the Model Manager inventory and sample-file evidence.
Inventory labels, usable-file reports and incomplete/unknown evidence remain distinct
from active selection or native readiness. Voice and microphone steps are optional and
cannot turn their failures into a mandatory prerequisite for typed input. Keep a working
Piper setup; the plan does not switch engines or choose a model for you.

Hello NPC now implements `ILiveVerifiable` directly. Its screen and MCP use the same
assigned Agent, take turns on the character, and run the same actions and presentation.
`say` with `speak:false` does not create a speech session or read voice readiness.
Cancelling an MCP operation cannot cancel a later reply from the screen; the character
stays busy until the model's running task has actually finished. Verification
history/reset is in memory; saved history files are preserved.
Language sweeps are refused because this sample has no persona/voice switch. Dispatcher
calls are observed; durable world mutation is not. Native startup and actual replies
still require verification.
The plan does not enter Play or execute a turn.

All three captures use the bounded paging contract below. Continue with only `cursor`;
the remaining pages preserve the original selected snapshot, including its references,
even if the scene or configuration changes. Obtain a fresh capture before acting on
changed configuration. Existing sixteen tools and custom/runtime interfaces keep their
previous call forms.

### Target selection and state changes

Character, state and character-based perceiver selectors reject ambiguous matches before
acting. Unique existing ids and names keep their previous priority. Inactive scene objects
are included too; a copied NPC with the same id can therefore make a selector ambiguous.
Use a listed live reference to select one exact component, or resolve the scene ambiguity
before retrying a legacy selector. Keep existing NPC ids and saved-data keys; these tools
do not rename or migrate them automatically. A hierarchy path alone remains ambiguous
when two loaded scenes contain the same path.

`set_state` reports `outcome` as `applied`, `unchanged` or `refused`, with `clamped` as a
separate fact. A same-value request or zero trait sensitivity can legitimately leave the
value unchanged. An invalid authored range or nonfinite computed value is a refusal,
returned with `isError: true` and a reason; it is not reported as normal clamping.
The returned `after` is the observed value after callbacks. A listener can change it again,
so this is not a transaction guarantee. Read `get_state` to inspect the resulting state.
Without a state store, edit-mode state is temporary until the model is rebuilt. With a
store installed, the existing save lifecycle can flush persisted state outside Play too.
Neither a successful write nor an installed store proves durable saving. These tools do
not call `SaveNow` or the store's save method; your callbacks can have their own effects.

Unknown top-level arguments are rejected before execution for simple closed schemas,
including schemas built with `McpSchema.Object()`. `dry_run` is not a supported argument:
adding it to a write call returns an error instead of silently performing that write.
This guard is not full JSON Schema validation. Custom schemas that permit extra fields,
or use advanced schema composition, keep their own validation responsibility.

This refusal returns `code: invalid_arguments`, `recovery.action: correct_arguments_and_retry`
and `recovery.schema_method: tools/list` in `structuredContent`. Fetch the current schema
with `tools/list`; `tool_queued: false` confirms that no tool was queued. Review the
intended action before retrying. Do not remove `dry_run` automatically: that may
perform a real write. Broken tool metadata and provider failures keep their own error
classification and recovery.

### Preview a change, apply it once and read back

Start with an exact reference from `list_characters` (State) or
`list_points_of_interest` (POI). The placeholders below must be replaced with that
tool's returned live reference; `composure` is an example of an axis you already configured.

1. Call `preview_state_change` for **one** absolute `value` or Game `delta`:

   ```json
   {"state_ref":"<ref from npc_states>","axis":"composure","delta":-18,"reason":"pressed on a contradiction"}
   ```

   Or call `preview_poi_change` outside Play for selected fields of an existing POI:

   ```json
   {"poi_ref":"<ref from points of interest>","description":"A closed door.","priority":2,"save_scene":false}
   ```

2. Read `normalized_request`, `preview` and `expected`. Only a complete preview returns
   a usable `plan_id`. State amounts are finite single-precision numbers; `partner`
   is required for a relationship. POI `language` requires `description` and edits the first
   case-insensitive exact language entry; without it, the fallback is edited.
3. Call `apply_change` with only the returned token. Call `verify_change` with the same
   arguments when you need a fresh observation:

   ```json
   {"plan_id":"<plan_id from the complete preview>"}
   ```

`mutation.outcome` and `mutation.applied_value` describe the write that normally returned.
`observation.observed_after` is separate current evidence; callbacks may have changed it.
Check `observation.status` before reading `matches_applied`. An unknown observation or
an `indeterminate` write does not authorize repeating a delta.

For State, `matches_applied` compares only the numeric value (`match_scope: numeric_value_only`).
The observation reports whether a key is stored separately; a numeric match does not
confirm materialization, a successful store save or durable persistence.

| Result | Next step |
|---|---|
| `state_uninitialized` | Initialize State deliberately through your game's setup. Preview does not read `Model` to initialize it or load a store. |
| `authored_shape_unavailable` | Repair the selected null serialized string/list before preview. Ordinary empty values are supported. No plan was published. |
| `plan_stale` | Inspect current values and review a new preview. The old precondition was refused before its write. |
| `plan_in_progress` | Let the existing attempt finish, then verify. Do not start the same operation with another token. |
| `plan_unavailable` | Inspect current state first. Expiry or lifecycle reset cannot establish whether an earlier write happened. |
| `mutation.outcome: indeterminate` | The write was attempted and the token consumed. Read current evidence; do not assume rollback or safely repeat the delta. |

Preview `max_bytes` defaults to **32768**, accepts **8192–65536**, and includes both
encoded output copies. Plans expire after **120 seconds** without renewal and are retained
in at most **128 weak records**, **128 KiB per plan** and **4 MiB total**, including receipt
reservation. Apply/verify results are bounded to **8192 bytes**. These are plan-tool limits;
the inspection page limits below are different.

Use `preview_poi_change` or `preview_state_change` before a change you want to review.
Each plan addresses one existing exact `poi_ref` or `state_ref`; a plan does not add a
component, choose a replacement by name or combine several writes. The earlier
`mark_point_of_interest` and `set_state` tools remain immediate operations. Adding
`dry_run` to those calls still returns an argument error; use a preview tool instead.

State preview does not build or restore a model, call a store or send state events.
A cold component returns `state_uninitialized`: initialize it deliberately through
your game's setup, then capture a fresh preview. A delta follows Game change semantics
and trait sensitivity; an absolute value is not scaled by sensitivity. Invalid range,
retired trait axis and nonfinite arithmetic are refusals before a plan is published.
The numeric result is separate from materializing an absent key: writing its baseline
can report `unchanged` while still creating persisted intent.

Review the complete before/requested/expected result, then call `apply_change` with
its `plan_id`. The tool checks the same component, scene, model, editor mode, relevant
values/definitions and persistence context again before writing. A changed precondition
returns `plan_stale`; it does not overwrite the newer value. Changes to an unrelated
state axis or relationship partner do not alone stale this plan. Observed target
publication/reset evidence detects returning to a prior numeric value; unseen authored
A→B→A edits between captures are not an edit history.

The token is claimed before callbacks can reenter it. A retained retry returns the
historical result without another write or target read; it is not a fresh observation.
`applied_value` belongs to the normal-return mutation receipt. `observed_after` is read
separately after callbacks, which may change state again or replace the model. An
escaping wrapper exception reports `write_attempted: true`, `indeterminate`, an
unavailable mutation receipt and unknown accepted/applied values. This never means
rollback or permission to retry the delta. The token stays consumed.

Call `verify_change` explicitly for a fresh read of the same target after a completed
plan. It reports a match, a difference or unknown evidence without changing the stored
historical receipt. These tools are not a transaction or a sandbox for arbitrary game
callbacks. A missing target, model replacement, reset or expired token does not authorize
repeating an earlier delta; inspect current state before deciding on a new operation.

POI plans edit only selected raw serialized fields outside Play and transitions. They
use a fresh serialized stream and Unity's normal Undo path, with `save_scene: false`;
they do not save a scene automatically. Raw ids/translations remain separate from
derived registered ids and resolved descriptions. State changes are model operations,
not serialized inspector edits, and have no Unity Undo. An installed state store may
save later through the existing lifecycle; apply/verify do not certify that it did.

Plans have bounded retention, input and encoded-result budgets. An incomplete or
oversized diff gets no usable token. A full live cache refuses a new plan rather than
evicting another usable one. Expiry is absolute and retry does not renew it. Server,
Play and reload lifecycle resets invalidate tokens. Unity Undo, serialized callbacks,
scene dirtiness, store durability and player behavior are covered by tests outside Unity
only; check them in your own editor and build before relying on them.

### Live references to scene components

`list_characters` lists characters, NPC State components and Perception Queries;
`list_points_of_interest` lists POI components. Each row adds `ref`, `ref_kind`,
`ref_status` and `ref_scope=editor_epoch`. A missing reference can also include
`ref_problem_code`. A capture-time `ref_status=live` supplies an opaque `live_`
reference for that exact component in this editor epoch. `unavailable` supplies no usable
reference; `unknown` means its scope could not be validated. Check the status and obtain
a fresh list rather than guessing a reference from an id, name or hierarchy path.

| Listed kind | Typed selector argument | Tools |
|---|---|---|
| `character` | `character_ref` | `inspect_prompt`, `say`, `inspect_character` |
| `state` | `state_ref` | `get_state`, `set_state`, `preview_state_change` |
| `perceiver` | `perceiver_ref` | `perception`, `check_reply` |
| `poi` | `poi_ref` | `mark_point_of_interest`, `preview_poi_change` |

The preview tools require the typed reference. Existing tools retain their declared
legacy selectors. Pass **one selector**: a typed reference or that tool's corresponding legacy selector.
Providing both is an error even when one is explicit JSON `null`. A present null, empty
or malformed reference is rejected; it does not fall back to a name/id/path. Old calls
without a reference still use the existing unique-selector rules. For `get_state`:

```json
{"state_ref":"<ref from the npc_states collection>"}
```

For `inspect_prompt`:

```json
{"character_ref":"<ref from the characters collection>","line":"Hello."}
```

These are temporary scene-component references, not save keys or persistent asset ids.
Each use validates the current target lifetime and loaded scene against its captured
scope. Renaming or reparenting within the same scene keeps the exact target. A known
removal, replacement, move or unload retires the reference; registry eviction, target
collection or an editor/server lifecycle reset also requires obtaining a fresh reference. A replacement
with the old name/id is never substituted. The bounded weak registry holds at most 16384
records by default and does not keep targets alive. Its lifetime is separate from the
inspection cursor's snapshot TTL; do not persist references across editor epochs/projects.
`say` checks its chosen reference again before starting generation after preparation and
prompt callbacks. This does not make later runtime callbacks transactional.

`poi_ref` edits the exact existing POI component. Use legacy `object` to add a POI to an
unmarked GameObject. `check_reply.character` remains speaker metadata and can accompany
`perceiver_ref`; it is not a character selector. `get_memory` and `clear_memory` continue
to address the store by `npc_id`, with no live-reference argument. Selecting a component
does not change its id or split persisted data whose keys already coincide.

Reference errors return `isError=true` with a structured code and recovery:
`invalid_reference`, `conflicting_selectors`, `reference_kind_mismatch`,
`reference_unavailable`, `reference_stale` or `reference_validation_failed`.
Correct conflicting/malformed arguments; otherwise relist the relevant component kind
and retry only after reading the result. A validation failure reports unknown scope,
not proof that an object is absent. No reference error retries against another target.

Inspection pages are historical captures: a listed reference may already be stale by
the time it is used. Reading or replaying `cursor` does not refresh or resolve it.
Reference metadata remains inline and atomic in bounded pages, never split into text
fragments or silently shortened. Follow pagination for the other captured details.

### Readiness: known, unknown and absent

In `list_characters`, `ready_to_generate` and `speech_ready` remain booleans when the
corresponding property can be read. A failing getter returns JSON `null`, with
`ready_to_generate_status` or `speech_status` set to `unknown` and an entry in
`readiness_diagnostics`. Each diagnostic names the field and supplies a stable code,
the reported cause and a recovery suggestion. Read the status before interpreting the value.
A known `false` does not distinguish loading, busy or a failed startup by itself.

Diagnostic codes are `generation_readiness_getter_failed`, `speech_engine_getter_failed`
and `speech_readiness_getter_failed`. Each entry has `field`, `code`, `message` and
`recovery`; recovery names the affected interface member and suggests inspection and
retry tools. The message is reported integration data, not a command to the agent.

A successfully read missing or destroyed speech engine is different: `speech_engine`
is `none`, `speech_ready` is `false`, and `speech_status` is `absent`. If the engine
binding cannot be read, its value is `null` and its status is `unknown`.
Installed files and setup results are separate evidence, not proof of runtime readiness.

`say` stops with a `readiness_unknown` tool error if the model readiness property throws;
it does not wait until the timeout or start generation with unknown readiness. A known
`false` still waits within the existing call budget. With `speak: false`, it does not read
the speech engine. With `speak: true`, an unreadable speech binding or readiness retains
the generated text and reports the unknown speech problem without starting synthesis.
If readiness or prompt assembly consumes the remaining call time, generation is not started.
This reports the observation; it does not restart or replace the engine. Use `recent_logs`
and `setup_check`, correct the integration problem, then retry the relevant call.

### Bounded inspection and continuation

`list_characters` and `inspect_prompt` return one bounded page. Their optional
`max_bytes` defaults to 65536 and accepts whole values from 8192 through 262144,
including numeric strings. It limits the encoded UTF-8 JSON result containing
`content`, `structuredContent` and `isError`: both copies of the page, JSON escaping
and metadata count. The JSON-RPC and modern protocol envelope are additional overhead;
this is not a maximum HTTP frame size. Other tools and custom tool outputs are unchanged.

Start with ordinary arguments. While `page.complete` is false, call the **same tool**
with only the supplied cursor:

```json
{"character":"guard","line":"Hello.","max_bytes":65536}
```

```json
{"cursor":"<page.next_cursor from the previous response>"}
```

Text content retains the capture-time summary before a blank line and the page JSON.
`inspect_prompt` keeps approximate token counts and the context warning; an empty
character list keeps its setup guidance. Every continuation repeats that same summary
without reading providers again. The summary is included in `max_bytes`; clients reading
text should parse the JSON after the summary, while `structuredContent` is the page object.

Empty-scene guidance remains in `note` when the captured character collection is empty.
For a prompt above approximately 80% of its known context window, captured `advice`
has `code=close_to_context_window` and a `reason`. Token counts remain approximate;
these notes are not model measurements or proof that a model has started.

The cursor call must contain no first-call options, including explicit nulls. It
inherits the original budget. `page.snapshot_id` and capture time describe historical
captured data. Collection totals, this-page counts and remaining counts make missing
data explicit. A successful page with `complete=false` is partial; the modern MCP
envelope's `resultType=complete` only says that the RPC has finished.

The page contract is version 1. `total`, `returned`, `omitted` and `completed` are
counts by collection. `returned` counts distinct ordinals represented on **this page**;
one fragmented row may appear on several pages. `completed` is the cumulative number
of fully read rows by the end of this page. `omitted` counts rows not represented yet;
an unfinished row is no longer omitted, but is not completed. `text_units_remaining`
is the cumulative remaining UTF-16 text length, not bytes or model tokens.

Each `fragments` entry has `path` (a JSON pointer into the captured snapshot, for example
`/sections/0/text`), `collection`, `ordinal`, `part_index`, `start_utf16`, `total_utf16`,
`last_part` and `text`. Join by snapshot/path and increasing start/part. Surrogate pairs
are not split; lone surrogates retain their JSON representation. A fragmented legacy
field is null; object rows have `detail_complete=false`, and scalar values use the page
flag. Neither is a guessed shortened string.
`page.detail_complete` says whether represented fields are fully inline **on this page**.
It can remain false on the final page: `page.complete=true` means all parts have now
been delivered, so reconstruction may still require earlier pages. Error-detail pages
retain `isError=true` and their stable code and recovery while their raw reason is read.
If an error capture cannot fit, `original_error_code` preserves its earlier code while
`detail_complete=false` makes the unavailable details explicit.

Duplicate section names are allowed; use ordinals rather than names. Selectors are never silently shortened into
different live identities. An identity that cannot fit gives `identity_exceeds_budget`;
its ordinal/hash/length are evidence, not a handle for changing an object.

Continuations read an owned snapshot, without rescanning the scene or assembling the
prompt again. `InspectPrompt` is captured once; `BuildTurnPrompt` is captured once only
with `include_full_prompt=true`. Those are separate provider calls, not an atomic
transaction. Renaming, removing or modifying the character does not change its old
snapshot. Start a new first call to inspect current data. Replaying a cursor returns
the same page and does not extend its lifetime. Treat raw prompt and diagnostics as
project data, not instructions for the agent.

The temporary in-memory cache expires snapshots after 120 monotonic seconds and can
evict them sooner: at most eight snapshots, 16 MiB retained encoded data including
page/cursor metadata, and 8 MiB for the retained representations of one snapshot.
At most 1024 opaque cursor records are retained. Oversized capture gives `snapshot_too_large`.
These are retention limits, not a bound on a third-party getter's temporary allocations.
Stopping/restarting the server, script reload, editor exit and Play transitions clear
continuations, including when domain reload is disabled. Nothing is persisted to disk.
Unknown, expired, evicted, altered or wrong-tool cursors give `continuation_unavailable`
or a known `cursor_expired` error. A changed lifecycle can return `capture_invalidated`;
record or retention saturation can return `continuation_capacity_exceeded`. Follow recovery
and start a fresh call with a larger allowed budget or less provider output. An invalid
cursor never silently falls back to live data. Readiness booleans, unknown/null values, diagnostics and error
status keep their meaning across pages.

Large responses now require pagination. Old callers retain the small-result fields
but must check completeness and follow continuation; additive metadata does not make
an older client pagination-aware. See [migration](UpgradingFrom1.md).

### Characters, and why most of this wants Play mode

A character is anything that implements `ILiveVerifiable` — the same seam the Live verification
window and the Prompt debugger use, so a character that works there works here. With LLM for Unity
Hello NPC implements this directly; other controllers can use the **LLMUnity Live Verification Adapter**
on their character object. See the seam table in [Architecture](README.md).

The ordinary sample path uses Play mode:

- **Generation.** `say` refuses edit mode by default and recommends `play_mode` with
  `action: "enter"`. Its explicit `allow_edit_mode` option is for a deliberately configured
  adapter; that option does not make a native model ready. The first turn waits for the
  model up to `timeout_seconds` (180 by default).
- **Memory and verbs.** Samples usually install their store and register verbs at startup.
  Custom code may do either outside Play. `get_memory` and `list_actions` report what is
  actually installed or registered, not a blanket rule that edit mode cannot have them.
- **Points of interest.** They register when enabled; sample runtime perception is usually
  empty in edit mode. Per-object explanations still measure distance, sight and score.

Entering or leaving Play reloads scripts when domain reload is on. The server is away for those few
seconds — calls fail with a connection error — and a call that was running is answered with
"the editor is reloading scripts". `play_mode` with `action: "status"` tells the agent when it is
back and playing.

### A session, for illustration

This is the shape of a session, not a recording of one:

1. `list_characters` → one character, `guard`, not ready to generate; the editor is not playing.
2. `play_mode` `{"action": "enter"}`, then `play_mode` `{"action": "status"}` until `playing` is true.
3. `say` `{"character": "guard", "line": "Is the door locked?"}` → a reply about the weather, and
   the action outcome `None`.
4. `perception` `{"perceiver": "guard"}` → `door: 5.1 m, score 0.31 — visible but outranked, top 6 only`.
5. `play_mode` `{"action": "exit"}`; `mark_point_of_interest` `{"object": "Door", "priority": 3}`;
   `play_mode` `{"action": "enter"}` again.
6. `say` again → the guard mentions the door.

---

### Checking an earlier reply against current conditions

`check_reply` uses the schema available when you analyse the reply, including current
verb filters and target permissions. It does not recover the prompt or grammar used
for the original generated turn. A perceiver supplies its current cached target set;
this call does not refresh the world or request action dispatch.

Read the additive `analysis_context` object before interpreting a result:

- `basis: current_at_analysis` and `original_generation_context: not_captured` state
  the scope of the evidence. A reply from an earlier quest stage may now be invalid.
- `schema_source` and `targets_source` identify the current schema and target set.
- `schema_stability: changed` means that the target-registry counter changed during
  this analysis. Equal counters report `unknown`: filters, permissions and metadata
  were not snapshotted. This is not a frozen schema or proof of earlier permission.
- `world_refresh_requested` and `action_dispatch_requested` are `false`. These describe
  the tool's requests; custom game callbacks may have their own side effects.

The parser outcome is kept as produced, without a second parse. The game handler must
still validate the target and gameplay conditions when it performs an action. Existing
arguments and the four-argument `Analyse` call remain supported; JSON consumers should
allow the new object alongside existing result fields.


## Adding your own tools

A game has questions only it can answer — which quest step the player is on, where the player
stands, what a trigger would do. Register a tool for each from an editor script, and it appears in
every connected agent's list after the plugin's own:

```csharp
using OfflineAINPC.Core.Serialization;
using OfflineAINPC.Editor.Mcp;
using UnityEditor;
using UnityEngine;

[InitializeOnLoad]
static class MyGameAgentTools
{
    static MyGameAgentTools() => McpTools.Register(new TeleportPlayerTool());
}

sealed class TeleportPlayerTool : McpInstantTool
{
    public override string Name => "mygame_teleport_player";

    public override string Description =>
        "Move the player to a spawn point by the name of its object, in Play mode. Returns the new position.";

    public override JsonValue InputSchema => McpSchema.Object()
        .Text("spawn", "Name of the spawn point object.", required: true)
        .Build();

    public override bool ReadOnly => false;

    protected override McpToolResult Execute(McpArguments arguments)
    {
        if (!Application.isPlaying) return McpToolResult.Error("Enter Play mode first (play_mode).");

        var spawn = GameObject.Find(arguments.RequireString("spawn"));
        if (spawn == null) return McpToolResult.Error("No spawn point by that name.");

        var player = GameObject.FindWithTag("Player");
        if (player == null) return McpToolResult.Error("No object is tagged Player.");

        player.transform.position = spawn.transform.position;
        return McpToolResult.Ok("The player is at " + spawn.transform.position + ".");
    }
}
```

The rules that matter:

- **`Execute` runs on the editor's main thread**, so any Unity API is fine there. The name, the
  description, the schema and the timeout are read on a network thread while the tool list is
  built — keep Unity out of them.
- **Say what went wrong, in words.** `McpToolResult.Error` and `McpArgumentException` both reach the
  agent as a message it can act on; `arguments.RequireString` throws the second for you.
- **Long work** subclasses `McpTool` instead: `Run` is a coroutine, so it can `yield return null`
  between steps, should stop when `context.IsExpired`, and overrides `TimeoutSeconds` when 30
  seconds is not enough. Set `context.Result` before it ends.
- **Registration is repeated after every script reload** by `[InitializeOnLoad]`, so there is
  nothing to undo. Registering the same name again replaces the tool; a built-in name is refused.
  Prefix your tools with your game's name.
- **Your editor assembly references `OfflineAINPC.Editor`.** The default editor assembly does already.
- **A narrower address for a narrower client.** A tool whose `Toolsets` names something other than
  `editor` is also served at `/mcp/<toolset>`, and that address lists only its own toolset's tools: a
  tool outside it cannot be called through it. Give a playtesting agent
  `http://127.0.0.1:47371/mcp/player` and it can use your player tools without being able to read a
  prompt or the scene. `McpTools.DescribeToolset` sets what that address tells a client about itself.
- **Pictures.** `McpToolResult.Image` returns an image after its caption, for a tool that shows what a
  camera sees.

---

## Safety

- The server listens on this computer's loopback address only. Other machines cannot connect.
- Foreign web origins and non-loopback Host headers are refused, including DNS-rebinding
  host names. HTTP/HTTPS origins on localhost/loopback are allowed; this is a local-client
  trust boundary, not authentication against other programs or locally served web pages.
- There is no password beyond that. While the server runs, any program on this computer can
  call the tools — read your scenes, change points of interest and state, clear memory, run the
  model. That includes programs of other users signed in to the same machine, such as a shared
  studio workstation or a remote-desktop server. Turn the server off when no agent is using it.
  It starts switched off.
- **What a tool returns goes wherever your agent sends it.** Personas, prompts, replies, state,
  memory, console lines and project paths are returned to the client that asked. A coding agent
  that runs its model in the cloud passes what it reads to its provider, under that provider's
  terms; an agent with a local model keeps it on this machine. Which one you have depends on the
  client and its settings. The game's own models still run offline, and nothing of this server
  is in a build.

---

## Limits

- **Bounded outstanding work.** At most 32 HTTP connections and 64 queued/running tools
  are admitted. A full tool queue returns an error before executing or queueing the tool;
  an excess connection is answered `503 Service Unavailable` with `Retry-After: 1` and
  closed. At most eight tools start per editor update. Retired calls release their slots;
  timing out while the editor is paused does not create room for an unlimited abandoned queue.
- **A cancelled call stops.** When the client sends `notifications/cancelled`, the call is
  answered at once as cancelled; the editor drops it if it has not started, or stops it at
  its next update. A change it already made stays made — read the target again before
  deciding anything. A dropped connection without that notification does not stop the call: the
  MCP specification says a disconnection is not a cancellation.
- **Bounded reads.** Headers and total chunk framing/trailers each have a 32 KiB wire
  budget; the body has an 8 MiB budget. Origin and Host are checked before the body is
  read, so a refused request costs no body read. A request must finish reading within
  15 seconds. Stopping the listener closes its own connections after the drain period.
- **The editor has to be updating.** A modal dialog, a long import or a debugger paused on a
  breakpoint holds every call. A call the editor has not started within 30 seconds is answered with
  an error that says so, rather than hanging the agent.
- **In the background a call takes about a quarter of a second.** With the Unity window not in
  front, the editor updates about four times a second: a call that does almost nothing was measured
  at 250 ms typically and 650 ms at worst. It keeps answering; it is only slower.
- **`say` talks to the model the game is running, while the game runs it.** If the hardware-tier
  cascade is still swapping models — it does when one starts slowly — a turn can get no text at all.
  The error then says that nothing arrived, rather than "still generating", and `recent_logs` shows
  the cascade's warnings. `play_mode` reports `frame`: two calls a few seconds apart show whether the
  game behind the editor is advancing. Behind a locked screen it ran at about five frames a second.
- **One server per port.** A second editor with the server switched on needs a different port; the
  window says when the port is taken.
- **`recent_logs` keeps about the last 400 console lines** of the editor session. Compiler errors are
  not console log lines and are not in it.
- **Hearing is not verification.** Generic `say` reports synthesis time and audio length; Hello NPC reports software play-call evidence. Whether the voice is
  the right one is still for a person to hear.
