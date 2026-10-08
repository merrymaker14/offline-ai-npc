# The espeak boundary

Piper is an optional external process. Its archived engine source is MIT, while its
phonemizer links GPL-3.0 espeak-ng. A top-level MIT label does not cover the whole native
distribution, its dictionaries, ONNX Runtime's notices or voice models.

## The current package boundary

The plugin invokes Piper over stdin/stdout JSON, does not load its libraries into Unity,
and can operate with another engine or typed input. Piper, espeak, their data and voice
weights are installed outside `Assets/OfflineAINPC/`. The export preflight excludes
native/model payloads and espeak data from that folder. This is a source/export rule;
review the actual release package and game distribution separately.

The [GNU aggregation FAQ](https://www.gnu.org/licenses/gpl-faq.html#MereAggregation)
considers both the communication mechanism and its semantics. Separate processes and
pipes support the documented boundary, but they are not an unconditional legal guarantee
for every future integration. Distribution location alone also does not settle whether
programs form one work. Keep the boundary and re-review changes that alter it.

## If distributing the Piper stack

| Artifact | What must be identified |
|---|---|
| Piper executable and piper-phonemize | Exact source revisions, patches, build/install scripts and dependencies. |
| espeak-ng library | GPL-covered source matching the actual binary, including the fork revision. |
| espeak-ng-data | Exact dictionary sources, generated data and build inputs; individual notices where applicable. |
| ONNX Runtime and other libraries | Actual versions, licence/copyright texts and ThirdPartyNotices. |
| Voice weights / libtashkeel model | Their independent weight, dataset and fine-tune provenance. |

GPL-covered object-code distribution requires a method allowed by
[GPL-3.0 sections 1 and 6](GPL-3.0.txt), licence/notices and no additional restrictions on
the covered components. For section 6(d), equivalent no-charge Corresponding Source access
and clear directions accompany the binary offering. Other section 6 methods have their
own conditions. A generic upstream URL or written offer is not automatic compliance.

Archived Piper's 2023.11.14-2 CMake can fetch a moving phonemizer branch. Its tag alone
therefore does not identify the entire installed stack's Corresponding Source. The
installed development binaries and 710 dictionary files are hashed in the dated audit;
their exact source/build linkage remains pending. A version string is supporting evidence,
not a substitute for that linkage.

The current process boundary is designed to keep the plugin separate. Do not infer that
every proprietary game, modified protocol or combined distribution is automatically
cleared. The actual combination and redistribution conditions need their own review.

## Voices, phoneme routes and output

Voice files are a separate question: the dataset licence, fine-tune base and independent
weight terms need review. A Chinese pinyin route or an unused espeak backend does not
remove GPL-covered files that are still present in a distributed Piper folder. This
audit did not run Piper or test language routing.

The [GNU output FAQ](https://www.gnu.org/licenses/gpl-faq.html#WhatCaseIsOutputGPL) generally
distinguishes output from copyright in program code, with exceptions where protected
content is copied. Independent recording, voice, model and other rights still apply.
The process boundary does not establish that all generated audio owes no obligations.

## When to review again

- When changing process/library integration or the communication protocol.
- When adding an engine installer, changing its destination or exporting the package.
- Before distributing an engine, native library, dictionary or model with a game.
- When selecting a different Piper fork, phonemizer, voice or preprocessing model.

Existing working Piper configurations remain supported. A new engine choice needs its
own exact inventory; this document does not grant blanket clearance to Qwen3-TTS or any
other alternative. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
