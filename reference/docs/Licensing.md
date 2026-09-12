# Licensing

What you may ship, and what shipping it obliges. Read this before release, not after.

**None of it applies to the plugin itself** — `Assets/OfflineAINPC/` is proprietary and yours
to use under the Asset Store licence. Everything below is about the things the plugin *talks
to*, which you install and may choose to redistribute.

---

## The one that can bite: espeak-ng

Piper's phonemiser links **espeak-ng, which is GPL-3.0**. Piper's own MIT licence does not
change that: a binary distribution of `piper.exe` carries espeak-ng's terms with it.

**The plugin is not affected.** It starts Piper as a separate process and talks to it over a
pipe; it does not link, load or contain any espeak-ng or Piper code, and nothing under
`Assets/OfflineAINPC/` is a copy of either. A build check fails if that ever changes.

**Your game may be affected**, if you ship Piper inside your build. That is allowed and
normal. It obliges three things:

1. **Ship the licence text**, naming espeak-ng as the component it covers.
2. **Offer the corresponding source** — a URL to the exact upstream release you shipped, kept
   available for the period the licence requires. Pin a release tag; "latest master" is not
   corresponding source.
3. **Add no further restrictions.** Your EULA must not forbid, for that component, what the
   GPL permits.

**Your own game stays proprietary.** Launching a process does not make your code a derivative
work any more than calling a compiler does.

**The escape hatch:** do not ship Piper. Point the plugin at VOICEVOX, at a system voice, or
at your own engine, and let players who want Piper install it themselves. Nothing in the
plugin requires it.

---

## Voice models — provenance, not just the licence line

**A voice's dataset licence is not the whole answer. Read its Training line too.**

Most Piper voices are fine-tuned from the `lessac` voice, and the lessac dataset licence
(Blizzard 2013, CSTR Edinburgh) excludes commercial speech-synthesis products from its
permitted "Research Purposes". A permissive dataset does not clear that: the licence covers
the recordings the voice was fine-tuned ON, not the voice it was fine-tuned FROM.

### The distinction, in one pair of examples

These two are the same corpus under the same licence, and only one is usable:

| Voice | Dataset | Licence | **Training line** | Verdict |
|---|---|---|---|---|
| `en_US-libritts-high` | LibriTTS train-clean-360 | CC BY 4.0 | **"Trained from scratch on train-clean-360"** | usable |
| `en_US-libritts_r-medium` | LibriTTS-R | CC BY 4.0 | **"Fine-tuned from English lessac medium"** | tainted |

Identical dataset name, identical licence, opposite answers. **The Training line decides.**
Apply that test to any voice you are evaluating.

### What this package ships with

| Voice | Licence | Provenance | Where |
|---|---|---|---|
| `en_US-ljspeech-medium` | **public domain** (LJ Speech) | "Trained from scratch for 1000 epochs" | en standard, en light |
| `en_US-ljspeech-high` | **public domain** | same, higher quality | en premium |

**The default line-up owes no attribution at all**, which is deliberate — a requirement
nobody notices is how a game ships in breach of a licence it meant to honour.

### If you want many distinct voices

`en_US-libritts-high` carries **904 speakers** selected by id, trained from scratch on
LibriTTS, **CC BY 4.0**. It is not in the default presets because CC BY requires attribution
and the defaults are deliberately obligation-free. Use it deliberately, and display:

> Speech synthesis by Piper (MIT). Multi-speaker English voice "libritts" trained from
> scratch on LibriTTS train-clean-360 by Heiga Zen et al., licensed CC BY 4.0
> (https://creativecommons.org/licenses/by/4.0/).

Audition speakers with `Tools ▸ Offline AI NPC ▸ Speak one line ▸ Audition a LibriTTS
speaker...`.

### Every other language

The slots are empty, and the reason is precise: **no voice with a traceable commercial
provenance was found** — the available Piper voices for those languages are fine-tuned from
the research-only base. That is a supply problem, not a plugin limitation. Supply your own
voice or commission one; see [Languages](Languages.md#adding-a-language-start-to-finish).

Dated copies of every card read, with the full reasoning:
[`LICENSES/VOICE_LICENCES.md`](../LICENSES/VOICE_LICENCES.md).

**VOICEVOX character voices** carry per-character terms that bind the **end user**, not you.
Surface those terms rather than absorb them — a link in your credits, not a line in your EULA.

---

## Does espeak-ng's GPL reach the audio it produces?

No, and this is worth stating plainly because buyers ask.

The FSF's position is that a program's **output is not covered by the copyright on the
program's code**. Synthesised speech is output; it is not a derivative work of espeak-ng, and
you owe nothing on the audio your game plays.

What the GPL does reach is **distribution of the binary**. That is the boundary this plugin
is built around, and running Piper as a separate process — which it already does — is the
recognised way to keep copyleft away from your own code. The obligations in the section above
apply to shipping `espeak-ng.dll`, never to the wav files it helped make.

---

## Model weights

The default catalog is **Apache-2.0** (the Qwen3 family), chosen because it is the cleanest
licence to redistribute under and needs no visible attribution.

Some other families do require attribution — Llama's "Built with Llama" is the usual one. The
manifest has a field for it and the inspector surfaces it as a finding, because a required
attribution nobody notices is how a game ships in breach of a licence it fully intended to
honour. **A line in your documentation does not satisfy it; it has to be visible in the
product.**

Weights are never bundled with this package. It describes a download; it is not one.

---

## What the plugin itself contains

No DRM, no licence check, no phone-home, no registration, no time limit, no watermark, and
**no telemetry of any kind — not even anonymous**. "No data ever leaves the machine" is the
product's core promise, and a usage counter would make it a lie.

One practical consequence, stated plainly: nothing reports back, so nobody can tell how the
plugin is being used. That is the intended trade.

Full third-party inventory: `LICENSES/THIRD_PARTY_NOTICES.md`.
