# Getting started

From import to the first typed answer; add voice and microphone input afterwards. Read
[Is this for your game?](IsThisForYourGame.md) first if you have not — it takes two minutes
and it is the page most likely to save you a refund.

**Required path:** install compatible LLM for Unity → obtain and configure one suitable language model
→ open Hello NPC → type a question and read its answer. Speech output and microphone input
are optional steps after that first answer.

---

### Choose a speech setup for your game

Start with typed dialogue. Add Whisper when players need a microphone, then choose a ready voice:

| Your priority | Start with |
|---|---|
| A quick reply and a suitable voice for your language | Piper with that voice's `.onnx` / `.onnx.json` pair |
| One voice engine across several supported languages | Qwen3-TTS with a named CustomVoice speaker |
| No spoken replies | Keep text dialogue; speech output is optional |

The built-in Qwen speech presets use the 0.6B CustomVoice Q4 talker and Q8 codec. New Qwen engine components use the bundled CPU DLL with **External server URL** and **Style** empty, and the existing 1.5-second lead buffer. Serena (`serena`) is the default for every built-in Qwen language and preset. You can choose another of the nine ready speakers; creating a voice from a description (VoiceDesign) is planned for the next version. Instructions for delivery style require a separately checked 1.7B CustomVoice setup. Check the language, voice terms and response time on your players' hardware; see [Languages](Languages.md), [Hardware tiers](HardwareTiers.md) and [Licensing](Licensing.md).

Model Manager downloads the speech model files. The package includes a **Windows x64 CPU Qwen native DLL**; leave **External server URL** empty to use it. The ordinary Qwen route needs no separately started HTTP server, Python environment, speech executable or compiler setup. Keep an existing working Piper route. See [the native speech setup](Languages.md#bundled-qwen-native) and [Licensing](Licensing.md).

## 0. The window that opens by itself

The first editor load after import opens **Welcome** — `Tools ▸ Offline AI NPC ▸ Welcome`
if you want it back. It runs the checks on this page for you and links to the two windows
below.

![The welcome window](images/welcome.png)

It shows **once** on a machine, on the first load, and once more after an update to a new
release such as 1.1 — not after a recompile, not in the next project. It changes nothing
in your project on its own: no Project Settings, no scene edits, no files. Everything it
can do is behind a button you press.

The cards follow the order of this page: dependencies, the language model, a character
that answers in text, **What works now** — typed replies, voice and voice input, each
ready, below the intended quality, blocked or not measured yet — then the optional voice
setup, **Hear a character speak**, and documentation and support. **Open Hello NPC
sample** opens the already-wired example directly, asking you to save your current scene
first; without LLM for Unity the card names the version to install, and **How to install
LLM for Unity** takes the button's place. Download missing files in the Model Manager, then use **Check again** to refresh
the status. Start with typed dialogue; microphone input and speech output can be
configured afterwards. **Create demo scene** is the alternative for wiring your own
character from perception and state; it makes a new, unsaved scene. Updating an existing
project? Open the [migration guide](UpgradingFrom1.md) from this window too. You can close Welcome and work
from the pages; nothing later depends on having used it.

---

## 1. Dependencies

Two external, free packages. Install them separately; this plugin includes optional
text source fixes with their original licences and modification notices.

| | Package id | Needed for |
|---|---|---|
| **LLM for Unity** | `ai.undream.llm` | the language model. Required; API minimum 3.0.3 |
| **whisper.unity** | `com.whisper.unity` | speech input. Optional — typed input works without it |

The bundled compatibility fixes target **LLM for Unity 3.0.3** and **whisper.unity 1.4.0**
at the revisions below. For that route, use Package Manager → **Add package from git URL**:

```text
https://github.com/undreamai/LLMUnity.git#9931a9ea46906b1f43adaf9498c05ccf227b5d0b
```

For optional microphone input:

```text
https://github.com/Macoron/whisper.unity.git?path=/Packages/com.whisper.unity#529a628a915a97799e89e061af9cb7c71407124d
```

After installation, the optional **Tools ▸ Offline AI NPC ▸ Advanced ▸ Compatibility fixes**
window offers **Preview compatibility changes** → **Apply compatibility changes**.
Preview shows the files to change and keeps existing project tuning in other source files.
Apply keeps script GUIDs and the installed native libraries. For a package installation,
it selects a local copy in `OfflineAINPCDependencies` inside this project; retain that
folder with the project. For an Assets or embedded package installation, it updates only
the listed files and saves the previous bytes. **Undo compatibility changes** restores the
recorded dependency. An unknown version or an edited patch target is preserved; use the
installation guide before choosing a different dependency. A working installation does
not need to be reinstalled. No manual changes in `Library` are needed.

The plugin compiles without either dependency: their features stay switched off.
`Check my setup` identifies a missing dependency or an LLM for Unity older than 3.0.3.
The plugin reads its own JSON (`OfflineAINPC.Core.Serialization`); its core does not require
Newtonsoft.Json. LLM for Unity declares Newtonsoft for package installs; for an Asset Store
folder, add `com.unity.nuget.newtonsoft-json` through Package Manager.

Both upstream packages use **Unity UI** (`com.unity.ugui`) without declaring it.
If your project template omitted it, add *Unity UI* in Package Manager to resolve their
`UnityEngine.UI` and `EventSystems` compile errors.

## 2. A model

`Tools ▸ Offline AI NPC ▸ Model Manager`.

![The Model Manager](images/model-manager.png)

Each **catalog** entry states its tier, its languages and its licence before you download
anything. **Ready** means the file is present and no size or known checksum mismatch was
found. A periodic scan does not hash the whole file or prove that its model will start.
Expand **Model details** to inspect a GGUF header; use **Re-verify** to check a catalog
checksum when one is available.

A file you dropped in yourself shows as **File found (yours)**. Its tier, languages and
licence are unknown unless it belongs to the catalog. Being found does not make it the
active model or prove that it works with Hello NPC. The Welcome window counts these files
separately. Choose the optional direct-assignment route below or configure a matching
manifest/host, then check your setup.

Welcome refreshes after a Model Manager operation succeeds, and when you come back to it
after its model files changed. If files changed outside the Editor, use **Refresh status**
on Welcome's Model card or **Rescan** in the Model Manager. A failed refresh keeps the last results; refreshing
never runs a model or starts a download.

For tier startup, choose a preset for your language and tier and download one compatible
language model. A preset recommends files; it does not rewrite the scene manifest or
select an active LLM host model.
Leave voice and speech-model downloads for the optional speech step. The manager checks the
declared size and verifies the hash when the preset carries one, so an incomplete file
is caught before publication; the Console says "downloaded and verified" only when a
SHA-256 was checked. A download that stalls for 60 seconds or loses its connection, or
that the server answers with 408, 429 or a 5xx error, is retried automatically up to three
times — after 2, 4 and 8 seconds, or after the server's `Retry-After` up to two minutes —
and continues the partial file; after that, **Resume** continues it. Presets carry their licence, and the
default line-up is chosen without a separate visible model-credit requirement. Keep the
licence texts and applicable notices when redistributing the files; see
[Licensing](Licensing.md).

Cancelling during checksum verification keeps the partial and leaves the installed
file unchanged. A late verification cannot install a cancelled attempt. Verified bytes
replace an existing file atomically; if replacement is unsupported or blocked, the old
file and partial are kept. **Re-verify** hashes on a worker and can be cancelled; closing
the window cancels that verification too. No new model is downloaded by Re-verify.

For the matching manifest/host route, use **Import file…** in Model Manager to copy an
existing `.gguf` into the right subfolder. To copy it manually, place it at
`<models root>/llm/<filename>`; the window shows the models root. Use the exact filename
the manifest expects. The locator searches that path, then
`<persistentDataPath>/llm/<filename>`, then `StreamingAssets` (including its subfolders). Configure
the matching manifest/host before relying on this search; finding a file does not bind it
to Hello NPC. The optional direct-assignment route below uses an absolute LLM path instead.

For that locator route, Play Mode includes the machine-local folder selected in Model Manager. The
`OFFLINE_AI_NPC_MODELS` environment variable still takes priority. Your editor preference
is not embedded in a player build; players use their environment/default root and the
two game locations above. Catalog download links accept Hugging Face file pages as well
as repository pages, and preserve URL query parameters when resolving a direct file.

<a id="own-gguf-with-hello-npc"></a>
### Optional: use your own GGUF with Hello NPC

Use this route for a local `.gguf` you want to assign directly to an existing Hello
NPC. Finding or importing a file does not select an active model. Work outside Play
mode, with compatible LLM for Unity installed and the character's Agent and local
LLM already assigned.

1. In Model Manager, use **Select for Hello NPC** on the found-file row. For a file
   elsewhere, use **Import file…**, wait for completion, then **Select imported GGUF
   for Hello NPC**. Import copies the file; it preserves the original and refuses
   an existing destination. Selection alone leaves scene bindings unchanged.
2. Choose the existing Hello NPC in the open scene. This route requires a dedicated
   Agent/LLM binding. Shared references, ambiguous bindings and unsupported startup
   owners are refused; it does not create another Agent or host for you.
3. Press **Preview application** and read the current file and proposed changes.
   Preview reads the configuration only: it does not start or download a model,
   change voice/STT settings or edit the scene.
4. Press **Apply to this Hello NPC** only when that preview is the change you want.
   Apply writes the absolute file path to `LLM._model`, enables that LLM, and disables
   only its scoped linked `TierBootstrap` for manual startup. Other settings and
   references, presets, catalogs, manifests, defaults and voice/STT stay as configured.
   Save the scene when ready. Unity **Undo** restores the previous scene configuration.

A preview is used once. Relevant file or scene changes, rebinding, Undo or closing
the window can invalidate it; create a fresh preview after resolving the reported
problem. The file check uses a bounded GGUF prefix and file identity, length and
timestamps. It is not a whole-file checksum or proof that the backend can load the
tensors. Changes that retain the same identity, length and timestamps may escape
that version check. Preview and Apply do not prove native compatibility or startup;
check the actual LLM startup and a typed reply in Play mode.

The applied absolute path is **machine-local**. Configure the model path for your
player and build inclusion separately, then check both in the built player on another
machine. **Include in build** copies the file; it does not rewrite `LLM._model` to a
player path. The matching manifest/host route above remains an alternative when you
want the plugin's tier selection and model-location search.

### Including models in a build

Model Manager's inclusion list stages required files into
`Assets/StreamingAssets/OfflineAINPC` only for the build. A Piper `.onnx` voice includes
its adjacent `.onnx.json`; both must exist. The size preview counts this same file set.
For Piper, this copy alone does not configure its fixed runtime voice path: provide
the pair in `Assets/StreamingAssets/piper/voices/` for the built-in driver. Files placed
there ship with Unity's StreamingAssets independently of this inclusion list.
A journal in `Library/OfflineAINPC` identifies unchanged copies that cleanup may remove.
Existing or modified files and metadata are preserved, including manually placed models;
conflicting destinations fail with a reason instead of being overwritten. After a failed
or cancelled build, the next build recovers only confirmed owned copies. Do not delete
the whole staging folder to recover: it may also contain your files. Inspect the named
conflict or changed copy before retrying.

<a id="4-check"></a>
## 3. Check the text setup

In **Welcome**, press **Open Hello NPC sample** and save your current scene if prompted.
This opens the already-wired `Samples/HelloNpc/HelloNpc.unity`; you do not need to create
a controller or wire a microphone.

`Tools ▸ Offline AI NPC ▸ Check my setup`.

Open the sample before this check so the scene report includes its actual connections.
Use **Check again** after opening it. Hello NPC requires **Agent** and the agent's **LLM**.
Missing **Audio** or **Engine** connections appear in **Optional scene wiring** as warnings;
complete them when you want speech output. A connection check does not confirm native generation.

![The setup check](images/setup-check.png)

The report checks dependencies, models and optional speech features separately. For the
first typed answer, fix the red items that affect the language model: the compatible
LLM for Unity dependency, the selected model and its references. Read each row's reason
and suggested action.

A red speech output, voice or codec row is a real error for speech output. It does not
prevent a configured language model from answering in text. Fix those rows before testing
audio; a missing or invalid Piper `.onnx.json` is reported and that voice request is refused.

<a id="7-run-it"></a>
## 4. Your first typed answer

Press Play, type a question into the sample's text box and press Enter. The first success
is an answer in the subtitle. With no ready speech engine, the character still answers
in text. A voice warning tells you what to fix if you want audio next.

The first model load and reply can be slower than later turns. If no text answer arrives,
check the Console and the LLM/model rows in the setup report, then see
[Troubleshooting](Troubleshooting.md). Continue to the optional steps after this works.

<a id="3-a-voice"></a>
## 5. Optional: speech output

The package includes the Windows x64 CPU Qwen speech library. Its target CPU must support **AVX2, BMI2, FMA, F16C and SSE4.2**. macOS and Linux libraries are not included.

1. In **Tools → Offline AI NPC → Model Manager**, download the **0.6B CustomVoice Q4 talker** and **Q8 codec** under *Voices and speech models* (about 0.9 GB together).
2. Use the scene's **Qwen3-TTS Engine** through **TTS Engine Manager** and its language binding. The sample supplies this wiring; a custom character must select that engine.
3. Leave **External server URL** and **Style** empty. Use `serena` in **Default voice** to keep the same voice across languages. A character's `SpeechRequest` or **Speaker voices** entry can override it. Set the language separately; choosing a voice does not translate the text.
4. In Play, type a short prompt and check the reply's subtitle and speech in the chosen language. Repeat this check in your built Windows player with the model files available.

For a Windows x64 build, the plugin stages `native-build-manifest.json` and five licence notices in `OfflineAINPCQwenNative-Licenses` beside the Qwen DLL. Keep that folder with your player distribution. This step does not include model weights; configure model inclusion separately. A build whose output is not a Player `.exe` — **Create Visual Studio Solution**, for one — is not staged this way: the Console says which files to copy next to the DLL by hand.

The default route loads the DLL in Unity and streams PCM to the existing speech session. It does not start `tts-server.exe`. The native profile is CPU-only with eight threads. **StopAsync** waits for native generation and worker settlement before releasing the context. Cancellation requests cooperative cancellation; it is not an instant-stop guarantee.

A separately launched server and **External server URL** / `AttachTo(url)` are [optional advanced alternatives](Languages.md#external-qwen-server). Keep that server's own model, backend, version and distribution requirements separate.

For a new Piper setup, install Windows `piper.exe` and its required companion files
manually in `Assets/StreamingAssets/piper/`. Keep an existing working setup and custom
paths. The following window does not download or install Piper.

<a id="connect-selected-piper-voice"></a>
### Optional: connect a local Piper voice

Use this Windows Editor route outside Play mode to make a local voice available to one
existing scene engine. It does not connect a character or prove that speech works.

1. In Model Manager, use an existing ONNX voice row; import your local pair first if
   needed. Press **Connect selected Piper voice**. **Choose voice file (.onnx)** can choose
   another `.onnx`; its matching `.onnx.json` must be beside it. Import alone copies
   the pair into `ModelsRoot`, without selecting the runtime voice.
2. Under **Existing scene Piper engine**, select an existing ordinary scene `PiperEngine`
   that has not started. Leave working, shared or prefab engines as configured.
3. Press **Preview**. Read both source → destination paths and the proposed
   engine field. Copy puts a permanent pair in `Assets/StreamingAssets/piper/voices/`;
   matching files already there are reused without ownership or deletion. These files
   enter builds independently of **Include in build**; selecting both routes can
   duplicate the pair. Preview does not copy files, change the scene or start Piper.
4. Press **Apply to this engine** only for the preview you want. Apply changes only the
   eligible English/Spanish fallback field; it does not rewire the character, change
   its language or rewrite catalog, router, flags or secondary-cast settings. Save the
   scene deliberately. **Undo** restores engine fields, not the permanent voice copy.

**If setup refuses:** use the reported reason. This route is for an unused, non-prefab
scene engine with at most one loaded component reference. A custom router/path,
initialized pool or catalog selecting another voice is preserved. New fallback
assignments require the cached engine language to be English or Spanish; an existing
catalog selecting this exact file can use it without changing a field. Other cases
remain on the manual route. Changed files or settings require another preview.
**Cancel** requests cancellation; wait for IO/cleanup to settle before retrying.
Changed files or files whose ownership cannot be confirmed are preserved.

**Manual route and verification:** you can still place `name.onnx` and `name.onnx.json`
in `Assets/StreamingAssets/piper/voices/`, configure `piper` and the voice file in the
language definition, and assign `PiperEngine` to Hello NPC's **Engine** field yourself.
Keep custom routing and paths if they already work. See [Languages](Languages.md#adding-a-language-start-to-finish)
for the pair rule and [your own engine](Languages.md#bring-your-own-engine). License,
provenance and voice language remain **Unknown** in this window: review the exact
voice's evidence separately. Successful Apply and file checks do not prove character
binding, native startup or audio; other platforms remain unverified.

Run **Check my setup** again, fix the speech rows, then ask another typed question and
verify audio as well as the subtitle. File checks do not prove that a native engine will start.


<a id="6-speech-recognition"></a>
## 6. Optional: speech recognition

Only add microphone input after the typed path works. The package ships push-to-talk and
a Whisper recognizer; a recognized line goes to the character the way a typed one does.

1. Install **whisper.unity**: *Window ▸ Package Manager ▸ **+** ▸ Install package from git
   URL*, then paste
   `https://github.com/Macoron/whisper.unity.git?path=/Packages/com.whisper.unity`.
   See [Dependencies](#1-dependencies).
2. In Model Manager, open **Speech recognition** and download the model your preset names:
   for English `ggml-tiny.en.bin` (Light) or `ggml-base.en.bin` (Standard); for English
   Premium and every other language the multilingual `ggml-base.bin` or `ggml-small.bin`.
   An `.en` model recognizes English only.
3. Select the Hello NPC character — the object with *Hello Npc Character* — and add
   **Add Component ▸ Offline AI NPC ▸ Push To Talk** and
   **Add Component ▸ Offline AI NPC ▸ Whisper Speech Recognition**. Push To Talk adds its
   own microphone recorder and uses the recognizer on the same object. Whisper Speech
   Recognition loads the file the preset names for the current language and tier, or the
   one you type into *Model File Name*. With a Tier Bootstrap in the scene it waits until
   the tier is settled; a press made before that is not sent, and the screen says why.
   For runtime English/Russian switching, download a multilingual model such as `ggml-small.bin`
   and set **Model File Name** to it before entering Play. The loaded model stays in use for the
   session; a Language Definition's **STT model id** does not replace it.
4. Press Play, click outside the text box, hold **V**, speak and release. The screen shows
   that it is listening, then recognizing, then what it heard — sent as if typed — or why
   that press was not sent.

The key is ignored while an IMGUI text field has keyboard focus. For a TextMeshPro or
uGUI input field, connect its focus state: `talk.IsInputBlocked = () => inputField.isFocused;`.
For a controller button, untick *Listen To Key* and call `Begin()` and `End()` from your own input. In your own
controller, subscribe to `PushToTalk.Heard` — or wire the *On Heard* event — and pass the
line to the method a typed line goes to; `Dropped` reports why a press produced no line
(`VoiceInputDrop`). Another recognizer plugs in as a component implementing `ISttEngine`
next to Push To Talk.

The recorder uses the system microphone by default. For a microphone selector in your
game, list inputs with `SharedMicLoop.GetAvailableDevices()` and assign an exact name to
`talk.Recorder.SelectedMicDevice`; an empty name restores the system default. If a named
input is unavailable, capture reports an error instead of silently using another device.
Changing the input discards an unfinished take. For an input meter, use
`talk.Recorder.TryGetInputLevel(out float rms)`; `CaptureProblem` explains capture failures.

You can also configure an existing component in code:

```csharp
talk.Key = KeyCode.V;
talk.LanguageCodeOverride = "en";
talk.Heard += SubmitQuestion;
```

An empty `LanguageCodeOverride` follows the game's language. An override changes the
recognition request for this control; it does not change the game's language, download
weights or turn an English-only model into a multilingual one. `Recognizer`, `Recorder`,
`ListensToKey` and `MinimumHoldSeconds` are also configurable in code. Call `Discard()`
when opening a pause menu to cancel this control's recording or recognition. The
`RecordingStarted` and `RecordingEnded` events drive recording indicators; the latter
reports `Released` or `Discarded`, before recognition finishes. Unsubscribe your handlers
when their owner is disabled. `IsInputBlocked` applies to the automatic key shortcut;
your button handler must check its own eligibility before calling `Begin()`.

For player-facing feedback, `VoiceInputFeedback.GetMessage(drop, languageCode)` supplies
short messages in English, Russian, Spanish and Simplified Chinese, with English as the
fallback. `NoSignal` means the captured samples were all zero; the message suggests
checking the selected microphone, mute and access settings without claiming a specific
cause. Quiet audio is reported separately as `TooQuiet`.

Two things that are not obvious and will cost you an evening each:

**Silence is transcribed as words.** Whisper hallucinates on an empty recording — "Thank you
for watching" and similar. Without a gate, a stray key press starts a conversation. Push To
Talk runs two: `UtteranceGate` checks the recording's energy before recognition is paid for
and the transcript against the known phrases after it (with the recording's RMS, an audible
"okay" gets through); `TranscriptCleaner` strips the bracketed sound-words recognition adds.
Both are pure C#, for your own input path too — see [Troubleshooting](Troubleshooting.md).

**Any word can be a trigger.** If you route on keywords, match whole words. In a script
without spaces — Japanese, Chinese — a `\b` boundary does not exist, so compare against the
exact token the recogniser returned rather than a substring.

<a id="5-a-character"></a>
## 7. Your own character

After the sample answers, use `Samples/HelloNpc/HelloNpcCharacter.cs` as the canonical
controller to customize. Preserve the way it refuses a turn while another runs, its
callback ownership and its cleanup on disable.
[Dialogue](Dialogue.md#the-whole-controller) explains the guarded wiring; its
backend and UI methods are explicit integration placeholders.

An `AudioSource` is for optional audio. Add `NpcStateComponent` and `PerceptionQuery`
when you need state or perception, rather than to obtain the first answer.

Give the character a persona: who it is, how it speaks, a handful of facts. Keep it short.
Everything in the system prompt is re-read on every turn, and a small model does better
with five clear facts than with two paragraphs.

---

## Adding your own assembly

If your game code lives in its own assembly definition, reference `OfflineAINPC.Runtime`:

```json
{
    "name": "MyGame.Characters",
    "references": [ "OfflineAINPC.Runtime" ],
    "autoReferenced": true
}
```

For a test assembly alongside it:

```json
{
    "name": "MyGame.Characters.Tests",
    "references": [ "MyGame.Characters", "OfflineAINPC.Runtime",
                    "UnityEngine.TestRunner", "UnityEditor.TestRunner" ],
    "includePlatforms": [ "Editor" ],
    "overrideReferences": true,
    "precompiledReferences": [ "nunit.framework.dll" ],
    "defineConstraints": [ "UNITY_INCLUDE_TESTS" ],
    "autoReferenced": false
}
```

`OfflineAINPC.Runtime` references **nothing but the engine** — not your game, not LLMUnity,
not whisper.unity, and no third-party library. That is what makes it portable between
projects, and it is why an import cannot fail on something you have not installed.

---

## Where to go next

| You want | Page |
|---|---|
| A character who notices the room | [Perception](Perception.md) |
| Moods, needs, relationships | [State](State.md) — start at the short path |
| A character who *does* things | [Actions](Actions.md) |
| Another language | [Languages](Languages.md) |
| To know what will bite you | [Limitations](Limitations.md) |
| An AI coding agent testing the character with you | [Agent tools (MCP)](AgentTools.md) |
