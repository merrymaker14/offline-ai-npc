# Voice licences and provenance

Voice models have separate terms from the plugin and speech engine. Check the model
publisher's licence, required notices and model card for the version you distribute.
Training-data and fine-tune-base records provide additional context; a permissive
weight/dataset label does not describe every recording or recorded person's rights.

## Qwen3-TTS models and preset voices

The catalog uses Qwen3-TTS CustomVoice GGUF models and a shared codec. The official
checkpoints and the Serveurperso GGUF repository advertise
Apache-2.0. Nine preset timbres are embedded in the model, not separate voice downloads.
The [technical report](https://arxiv.org/html/2601.15621v1) describes training scale,
languages and stages, but not a complete recording-permission inventory for these timbres.
Keep the required redistribution notices; see [Licensing](../Documentation/Licensing.md).

## Piper: recorded dataset and fine-tune base

Archived cards are in `voice-cards-2026-07-30/` and `voice-cards-2026-09-23/`.
The ljspeech-medium, dmitri and sharvard records below also use Piper voice repository
revision c10ece1aade47bb51c153c893d14e5bf8e5b7117.

| Voice | Recorded dataset terms / training | Redistribution notes |
|---|---|---|
| en_US-ljspeech-medium / high | Public-domain [LJ Speech](https://keithito.com/LJ-Speech-Dataset/); cards record training from scratch. | Engine/runtime notices still apply. |
| en_US-libritts-high | CC BY 4.0 [LibriTTS](https://www.openslr.org/60/) train-clean-360; from scratch; 904 speakers. | Retain applicable attribution and notices. |
| en_US-libritts_r-medium | Related LibriTTS-R corpus, CC BY 4.0; card records a lessac fine-tune base. LibriTTS-R is distinct from the original LibriTTS corpus. | Check the exact voice publisher's terms and recorded fine-tune-base terms. |
| ru_RU-dmitri-medium / es_ES-davefx-medium | Cards label their datasets CC0 and identify a lessac fine-tune base. | Check the exact voice publisher's terms and recorded fine-tune-base terms. |
| es_ES-sharvard-medium | Dataset CC BY 3.0, two speakers; card identifies a lessac fine-tune base. | Check the exact voice publisher's terms and recorded fine-tune-base terms; retain applicable attribution and notices. |
| en_US-amy-medium | Dataset URL leads to a repository-wide CC BY-SA label; per-voice statement remains unresolved; lessac base recorded. | Check the per-voice publisher's terms and recorded fine-tune-base terms. |
| en_US-hfc_female-medium | NonCommercial dataset terms; lessac base recorded. | Check the stated NonCommercial scope and the exact weight publisher's terms before commercial distribution. |
| zh_CN-chaowen-medium | Card records a Xiao Ya fine-tune base; archived Xiao Ya card names NonCommercial BZNSYP. | Check the stated NonCommercial scope and the exact weight publisher's terms before commercial distribution. |

The [lessac dataset licence](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)
grants research-only use and excludes commercial use of those materials. A permissive
dataset used for fine-tuning does not establish permission to use the recorded base.
Check the exact voice publisher's terms and recorded fine-tune-base terms before
redistribution; dataset terms do not automatically determine the terms of every derived
weight file.

Dataset labels also do not establish every weight publisher's terms. Preserve the exact
card, model revision/hash and required credits. LJ Speech's public-domain recording claim
is useful evidence; it is not a waiver of Piper/espeak/ONNX notices or a statement that the
whole speech stack is obligation-free.

## Redistributing a voice

For each voice you distribute, retain its model version/hash, source URL, model card
and required notices. Check the engine/build, runtime libraries, preprocessing and
dictionaries, and any reference recordings separately. Review the terms again when
changing a model or voice.
