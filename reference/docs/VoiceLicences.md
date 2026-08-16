# Voice licences — read, not summarised

Every card below was opened and read on **2026-07-30**, and a dated copy saved in
`voice-cards-2026-07-30/`. Cards change; this folder is the record of what was relied on.

**Read the finding at the bottom before using any of these.**

---

## What each card says

| Voice | Dataset licence, as written on the card | Card URL |
|---|---|---|
| `en_US-amy-medium` | "License: See URL" → [mimic3-voices](https://github.com/MycroftAI/mimic3-voices), repo licence CC-BY-SA-4.0; **no per-voice statement** | [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/amy/medium/MODEL_CARD) |
| `en_US-hfc_female-medium` | **CC BY-NC-SA 4.0** — NonCommercial | [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/hfc_female/medium/MODEL_CARD) |
| `en_US-lessac-medium` | Blizzard 2013 licence — **research only, commercial use expressly forbidden** | [card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD) |
| `es_ES-davefx-medium` | **CC0** | [card](https://huggingface.co/rhasspy/piper-voices/blob/main/es/es_ES/davefx/medium/MODEL_CARD) |
| `ru_RU-dmitri-medium` | **CC0** | [card](https://huggingface.co/rhasspy/piper-voices/blob/main/ru/ru_RU/dmitri/medium/MODEL_CARD) |

Required attribution strings: none stated on any card. CC-BY-SA and CC-BY-NC-SA both require
attribution by their terms, but neither card supplies the string to use.

---

## Two findings, in order of severity

### 1. `hfc_female` is NonCommercial and must not be recommended

`en_US-hfc_female-medium` is **CC BY-NC-SA 4.0**. A buyer shipping a commercial game with it
is in breach. It was listed as "ready out of the box" in this package's own documentation
until this was read — that listing was wrong and has been corrected.

It is also the voice this demo project uses for one character. That is a problem for the
game, separately from the plugin.

### 2. Every one of these voices is finetuned from `lessac`, whose dataset forbids commercial use

The cards for amy, hfc_female, davefx **and dmitri** all say, verbatim:

> Finetuned from U.S. English lessac voice (medium quality).

And the lessac dataset licence (Blizzard Challenge 2013, University of Edinburgh CSTR) says
"Research Purposes" excludes

> …developing, adapting, amending or otherwise using the Materials for any commercial
> purpose, including the development, marketing, commercialisation, sale or licencing of
> voice synthesis or speech recognition products or services…

**This is not a conclusion, it is a flag.** Whether a finetuned model's weights are a
derivative work of the training corpus is a legal question with no settled answer, and it is
not one a developer should answer for a shipping product. What is established:

- the dataset those weights were finetuned from prohibits commercial voice-synthesis products;
- a CC0 *dataset* (davefx, dmitri) does not clear the lessac provenance, because the CC0
  applies to the recordings that were finetuned ON, not to the voice that was finetuned FROM.

**Consequence for stage 5E's conclusion:** it recorded `ru_RU-dmitri` as "a voice with a
licence fit for commercial redistribution". That was based on the dataset line alone and did
not account for the provenance line on the same card. The dataset is still CC0; the claim
that the voice is commercially clear is no longer supportable without legal advice.

---

## What this package does about it

The shipped preset catalog already leaves every Piper voice slot **empty**, with
`unavailableReason` explaining that the per-voice licence must be established before
shipping. That was the right call and it stays: nothing here promotes any voice into a
preset.

The documentation has been corrected — see `Documentation/Licensing.md` and
`Documentation/Languages.md`. Neither now presents a Piper voice as cleared.

**For the buyer, the honest position is:** Piper is a fine engine, the voices are a supply
problem, and clearing one for a commercial product is work only they can do for their own
jurisdiction and risk appetite. The plugin points at the cards; it does not vouch for them.

---

## Resolved 2026-07-30 (stage 5L): two voices with a clean provenance

The problem above has an answer. Two Piper voices are **trained from scratch**, and their
cards were read before anything was built on them:

| Voice | Speakers | Dataset licence | Training line, verbatim |
|---|---|---|---|
| `en_US-ljspeech-medium` | 1 | public domain | "Trained from scratch for 1000 epochs on medium quality settings using the LJ Speech dataset" |
| `en_US-ljspeech-high` | 1 | public domain | same dataset and card, trained at high quality settings |
| `en_US-libritts-high` | **904** | CC BY 4.0 | "Trained from scratch on train-clean-360" |

**And the near-miss, which is the more useful record.** `en_US-libritts_r-medium` is the same
corpus under the same CC BY 4.0 licence, and its card says:

> Fine-tuned from English lessac medium on train-clean-360.

Same dataset name, opposite answer. **The Training line decides, not the dataset name.** Its
card is saved here too, deliberately, as the counter-example.

### What shipped

The default presets use `ljspeech` throughout, because it is public domain and therefore owes
**no attribution at all** — the defaults are deliberately obligation-free. `libritts` is
documented as an opt-in for projects that want 904 distinct voices and will display the CC BY
attribution.

Every other language keeps an empty slot with the precise reason: no voice with a traceable
commercial provenance was found for it.

### Measured cost of the swap

Synthesis is slower than the tainted voices were. Same phrase, same machine:

| Voice | Real-time factor |
|---|---|
| `en_US-amy-medium` (tainted, the old default) | 0.17 |
| `en_US-ljspeech-medium` (**new default**) | 0.37 |
| `en_US-ljspeech-high` | 0.92 |
| `en_US-libritts-high` | 1.05 |

The new default is roughly twice the synthesis cost of the old one and still comfortably
faster than real time. The `high` voices are at or past real time, which matters for the
latency budget: they are appropriate for the premium tier and for opt-in use, not for a
machine that is already struggling.
