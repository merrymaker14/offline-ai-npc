# Release history

A short record of what each release includes. For individual fixes and API details,
read the [technical changelog](../CHANGELOG.md).

<a id="unreleased--next-release"></a>
## 1.1

Changes in version 1.1 compared with the published 1.0 package.

- **A clearer start.** Welcome opens the wired Hello NPC sample directly. The guides
  reach a typed answer before optional voice output and microphone input. The sample
  keeps your question when the model is starting or another reply is running.
- **Qwen3-TTS speech.** The built-in language definitions use Qwen3-TTS and Serena
  (`serena`) across supported languages. The package includes the Windows x64 CPU
  native DLL; download the talker and codec in Model Manager. An external HTTP server is
  optional. Existing Piper setups can stay.
- **Voice input.** Push To Talk with Whisper Speech Recognition: hold a key, speak and
  release, and the line reaches the character as if typed. It needs whisper.unity and a
  Whisper model; a press that produced nothing says why.
- **Microphone selection.** Custom game settings can select a named input and display
  its signal level. An unavailable input reports an error without switching devices.
- **Safer character saves.** Failed saves remain pending for retry, small persisted
  changes are tracked, and stale reads cannot replace a newer restored state.
- **Safer conversation history.** Memory storage errors are contained without
  overwriting unread history; nested requests to add or clear messages keep their order.
- **Builds on Windows.** The Windows Editor releases native file handles between
  build operations under Mono. Build journal updates retry transient access conflicts
  and preserve changed files.
- **Model-file tools.** Local imports run in the background with progress and
  cancellation. File reports distinguish missing files, established defects and checks
  that could not be completed; finding a file does not prove the engine will start.
- **Editor and guide languages.** Every window and inspector of the plugin, including the
  built-in setup reports, supports English, Russian, Spanish and Simplified Chinese, and the
  guides open in the chosen editor language. This setting does not change the NPC's
  language.
- **Optional editor MCP tools.** A coding agent can inspect the project and an exact
  character reference, and get a plan for the first typed conversation. Overview tools
  read passive information by default; runtime probes and file checks require an
  explicit request. Supported POI and State changes can be previewed, explicitly applied
  and checked on the same component. This does not promise an atomic transaction or a
  durable save. The MCP server stays disabled until you enable it.

Before updating a working 1.0 project, follow [Upgrading from 1.0](UpgradingFrom1.md).
Keep your working Piper setup while checking the update. See [Agent tools](AgentTools.md)
for MCP setup and its inspection and change limits.

## Released — 1.0

The first release included:

- Local dialogue through the external **LLM for Unity** dependency, with **Qwen3**
  language-model presets. Models are downloaded separately.
- Optional voice input through **whisper.unity** and speech output through **Piper**.
  These dependencies, engines and model files are installed separately.
- Character state, traits and relationships; bounded conversation memory using storage
  you supply; perception of marked scene objects; and structured actions sent to game
  handlers you implement.
- **Hello NPC**, **Living Character** and **World Aware** examples, plus model management,
  setup diagnostics and buyer documentation.

Start with [Getting started](GettingStarted.md), or return to the
[documentation index](Index.md). For the complete change record, use the
[technical changelog](../CHANGELOG.md).
