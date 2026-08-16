# Handoff: Offline AI NPC — marketing site + documentation

## Overview

A one-page landing for the Offline AI NPC plugin (89 USD) plus 13 documentation pages,
deployed as a static site to GitHub Pages from a git push.

The audience is game developers: technical, sceptical, and inclined to trust a measured
number over an adjective. The visual register is terminal, dark, hard-edged — a tool, not
a brochure. The product's promise is that nothing leaves the player's machine, so the site
must not load trackers, analytics, or third-party embeds. That is a design requirement,
not a preference.

## About the design files

Everything in `reference/` is a **design reference**, not production code.

The files are `.dc.html` — they render through a runtime (`support.js`) that is part of
the design tool, not part of the shipping site. **Do not deploy them.** They are there so
you can open them in a browser, read exact markup, and copy exact values.

**Your task:** produce plain, static HTML and CSS — no build step, no framework, no
runtime — that reproduces these pages. That is the deployment constraint from the brief
and it is not negotiable: GitHub Pages serves what you push.

Two practical notes about the reference markup:

- All styling is inline `style="..."` attributes, because the design tool requires it.
  **In the real site, lift these into one stylesheet.** The values are correct; the
  delivery mechanism is not.
- `style-hover="..."` is a design-tool attribute. It means "these declarations on
  `:hover`". Translate to real CSS.

## Fidelity

**High-fidelity.** Colours, type, spacing and copy are final. Reproduce them exactly.

The two exceptions, both deliberate placeholders:

- The two video frames in section 03 (perception off / on) are empty 16:9 boxes reading
  `[ CLIP PENDING ]`. The clips do not exist yet. Keep the frame, keep the captions.
- The hero image (`assets/hero-key.jpg`) is a placeholder for a final key image.

---

## The rule that matters most: one source, not two

From the brief, and the reason this repo is shaped the way it is:

> The site's pages render from the same markdown that ships in the package. The moment
> two copies of one paragraph exist, they will drift, and a buyer will find the one that
> lies.

This already happened once during design. The landing had hand-typed latency figures from
an August 1 benchmark run; the documentation had figures from August 16. Both were
"correct" when written, and one click apart they contradicted each other by 2.7×. The
landing was rewritten to the documentation's numbers.

**What holds the property, concretely:**

1. **`docs/*.md` is the only copy of documentation prose.** These are the files that ship
   inside the plugin package. The site does not keep an edited copy of them.

2. **`build-docs.js` renders them.** It is the generator used to produce every page in
   `reference/docs/`. Port it to whatever runs in CI (Node with no dependencies is
   enough) and run it on push. Its behaviour:
   - one output page per markdown file, each with its own URL and `<title>`;
   - `[label](Foo.md#anchor)` becomes `Foo.html#anchor`; headings get GitHub-compatible
     slug ids so those anchors land;
   - a link to a `.md` file that has no page yet renders as **plain grey text with a
     tooltip**, never a broken link. The index page lists which ones those are.
   - `images/x.png` in markdown resolves to the site's copy of that screenshot.

3. **Documentation content is never edited to make the site read better.** If a page
   reads badly on the site, that is a finding about the source file. Fix it in the source
   or leave it; do not fix it in the renderer.

4. **The landing's numbers are the open hole.** Section 01 currently hard-codes
   2.0 s / 2.4 s / 12.7 s / 2.1 s / 0 of 320 / 6 in 10. These are a second copy of figures
   that also live in `HardwareTiers.md` and `IsThisForYourGame.md`. A measurements file
   (JSON, or the benchmark's own output) is coming from the author; when it lands, the
   landing must read from it at build time the same way the doc pages read from markdown.
   Until then, **any change to a latency figure is a change in two places**, and that is
   a known defect, not a design choice.

Recommended repo layout:

```
/                      GitHub Pages root
  index.html           built from the landing template
  docs/*.html          built from Documentation~/*.md
  assets/
  Documentation~/*.md  the package's own docs — the single source
  build/               the generator
```

If `Documentation~/` is inside the private plugin repo and the site repo is public, a
git submodule or a copy step in CI is fine — as long as the copy is **generated on every
build and never hand-edited**.

---

## Pages

### 1. Landing — `Landing.dc.html`

One long dark page, max content width 1240px, horizontal padding
`clamp(16px, 4vw, 44px)`. Sections are numbered `[ 01 ]`–`[ 05 ]` in green mono.

| Section | id | Content |
|---|---|---|
| Header | — | Wordmark + `/ PLUGIN FOR YOUR ENGINE`, nav: MEASURED, LIMITS, DOCS, BUY — $89 |
| Hero | — | Headline, sub, paragraph, two buttons, key image at right; stat strip below |
| 01 Measured, not claimed | `measured` | 2.0 s headline, three-bar contention chart, three stat cards, "exact, every time" strip |
| 02 Three things that are different | — | Offline / multilingual / shipped in a VR game |
| 03 Perception, off and on | — | Two 16:9 clip placeholders side by side |
| 04 What it does not do | `limits` | Three limitation rows |
| 05 Get it | `get` | Price block + link list (demo, docs, manual PDF) |
| Footer | — | Author, support, licence page links, "this page" note |
| Status bar | — | Fixed bottom strip, 38px |

**Hero.** Two columns, `display:flex; flex-wrap:wrap; gap:clamp(26px,5vw,60px)`. Text
column `flex:1 1 min(100%,380px)`; image column `flex:0 1 min(100%,404px)` holding a 2:3
portrait image on the page background (no frame, no border). They stack on narrow screens.

- Eyebrow: 7px green square (`opacity` breathe animation, 2.4s) + `RUNS ON THE PLAYER'S MACHINE`, mono 11px, `letter-spacing:0.2em`, `#6B7275`.
- H1: mono 500, `clamp(27px,4.6vw,54px)`, `line-height:1.1`, `letter-spacing:-0.015em`, `#F2F4F5`, `max-width:17ch`. Text: "NPCs that hear you, answer, and remember."
- Sub: mono, `clamp(13px,1.5vw,17px)`, `#32CD32`, `max-width:34ch`. "On the player's machine. Nowhere else."
- Body: sans, `clamp(14px,1.35vw,16px)`, `line-height:1.65`, `#9AA1A4`, `max-width:56ch`.
- Buttons: 15px 22px padding, mono 12px, `letter-spacing:0.16em`. Primary is solid `#32CD32` on `#08090A` text and **inverts on hover**; secondary is a `#2C3234` outline that brightens to `#E6E9EA`.

**Stat strip.** Four cells, `grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))`, 1px gaps over a `#191D1F` background so the gaps read as hairlines. Cells: median 2.0 s / reference machine / model / network calls `0` (green).

**Section 01 contention chart.** Three rows, each: label (`flex:0 1 clamp(150px,25%,240px)`, mono 11px) + track (`height:14px`, `#0F1213` on a `#191D1F` border) + value (`flex:0 0 78px`, right-aligned, mono 15px). Fill widths are proportional to 12.7 s: **15.7% / 18.9% / 100%**. First two fills green (`rgba(50,205,50,0.18)` with a 2px `#32CD32` right edge); the third amber (`rgba(255,140,0,0.20)` / `#FF8C00`).

**Limitation rows (04).** `display:flex; flex-wrap:wrap; align-items:baseline`. Title block `flex:0 1 clamp(170px,22%,250px)` with a 3px × 16px red bar; body `flex:1 1 min(100%,420px)`.

### 2. Documentation — `docs/*.dc.html`

Generated. Do not hand-write these; run the generator.

Layout: sticky header (same wordmark, `/ DOCS`, PDF / DEMO / BUY), then
`display:flex; flex-wrap:wrap; gap:clamp(28px,5vw,64px)` with a `flex:0 0 210px` sticky
sidebar (`top:76px`) and an `flex:1 1 min(100%,400px); max-width:78ch` article. Body copy
15px / 1.78 in `#C8CDCF`; headings mono.

Nav groups, in order: **Before you buy** (Is this for your game?) · **Getting it running**
(Getting started, Beginner's guide, Hardware tiers) · **Building with it** (Dialogue,
Actions, Languages, The interview demo) · **When it breaks** (Troubleshooting) ·
**Licences and history** (Third-party notices, Voice licences, Changelog).

`docs/Documentation.dc.html` is the index: intro paragraph, the same groups as cards with
a one-line blurb pulled from each file's first paragraph, and a dashed "not on the site
yet" box listing unrendered targets.

Element treatments the generator produces, worth preserving:

- **Tables** wrap in `overflow-x:auto` so they scroll inside themselves on a phone instead of widening the page. Header cells mono 10px uppercase `letter-spacing:0.16em` `#6B7275`; first column `#E6E9EA`, the rest `#C8CDCF`.
- **Code blocks** `#0B0D0E`, 1px `#191D1F` border with a 2px `#23282B` left edge, mono 13px / 1.7, `overflow-x:auto`, `white-space:pre`.
- **Inline code** `#121517` on a `#191D1F` border, `0.88em`.
- **Blockquotes** `rgba(50,205,50,0.04)` with a 2px `#32CD32` left border — used for the callouts the source marks with `>`.
- **H2** carries a `border-top:1px solid #191D1F` and 22px top padding. A markdown `---` immediately before an H2 is dropped, so the rule does not double.
- **Scrollbars** are restyled dark (`::-webkit-scrollbar` 9px, thumb `#23282B`, green on hover) — the only place a non-inline rule is needed besides resets.

---

## Design tokens

| Token | Value | Used for |
|---|---|---|
| Background | `#08090A` | page |
| Panel | `#0B0D0E` | cards, code blocks, table bodies |
| Panel hover | `#101314` | index cards, prev/next |
| Hairline | `#191D1F` | borders, grid gaps |
| Border, stronger | `#23282B` | image borders, table header rule |
| Text bright | `#F2F4F5` | headings, big numbers |
| Text | `#E6E9EA` | default |
| Body | `#C8CDCF` | doc prose |
| Muted | `#9AA1A4` | landing prose |
| Dim | `#6B7275` | labels |
| Faint | `#4A5053` | nav group labels, inline dividers |
| Green | `#32CD32` | accent, links, "local" |
| Green border | `#1F3D22` | link underlines, green-tinted panels |
| Amber | `#FF8C00` | costs, caveats |
| Red | `#FF3B2F` | limitations |

Type: **mono** `ui-monospace, 'Roboto Mono', SFMono-Regular, Menlo, Consolas, monospace`
for headings, labels, numbers, nav, buttons. **Sans** `Roboto, -apple-system,
BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` for prose.

**No webfont is loaded, on purpose.** Roboto is used when the machine has it and the
stack falls back cleanly when it does not. Do not add a Google Fonts link: a page that
promises nothing leaves your machine should not open a connection to fetch a typeface. If
the fallback is unacceptable, self-host the woff2 from the same origin.

Spacing: section padding `clamp(56px,9vw,110px)`; card padding `clamp(18px,2.4vw,26px)`
to `clamp(24px,3.4vw,38px)`; grid gaps are 1px over a hairline background. Border radius
is **0 everywhere**. No shadows.

Animation: `breathe` (opacity 1 → 0.35 → 1, 2.4s ease-in-out infinite) on the two green
status squares. Hover transitions are instant. Nothing else moves.

---

## Interactions

- Anchor nav (`#measured`, `#limits`, `#get`) with `scroll-behavior:smooth` on docs pages.
- Hover: links go green or brighten; the primary button inverts; doc index and prev/next cards lift to `#101314`.
- External links (itch.io demo) open in a new tab with `rel="noopener"`.
- No JavaScript is required by the design. If you ship any, it must be same-origin and it must not phone home.
- Responsive: every multi-column block is `flex-wrap` or `auto-fit` grid and collapses to one column. Verified down to 390px. Tables and code blocks scroll inside their own containers.

## Assets

| File | Where it goes |
|---|---|
| `assets/hero-key.jpg` | hero, right column, 2:3 — placeholder for the final key image |
| `assets/docs/*.png` | 10 editor screenshots; markdown references 5 of them today |
| `assets/plugin-docs.pdf` | "Download the manual" link and the docs header `PDF` |

Screenshots came from the plugin's own editor windows. They are referenced from markdown
as `images/<name>.png` and the generator rewrites the path.

## Links to wire

- Buy — not yet pointed anywhere. Four `#get` anchors on the landing are waiting for the marketplace URL.
- Demo — `https://merrymaker14.itch.io/the-interview` (live).
- Docs — `docs/Documentation.html`.
- Manual — `assets/plugin-docs.pdf`.
- Footer email — `mailto:tmusharapov@bk.ru`.

## Deployment notes from the brief

- **Separate public repository.** The plugin source is private; Pages needs public. Name the repo after the plugin, **not after an engine** — the landing deliberately says "for your engine" because it ships on a second marketplace later.
- **No analytics, no tracking, no third-party embeds.** See above; this is the product's argument, given away for free if the site leaks.
- **Dark only.** There is no light theme and no toggle.
- **The Russian mirror does not go on the site.** `docs/ru/` stays in the package repo.
- **Disclose at submission that the site was made with AI assistance.**

## Files in this bundle

```
README.md              this file
build-docs.js          the documentation generator (design-tool flavoured; port it)
assets/                images and the manual PDF
reference/
  Landing.dc.html      landing design reference
  docs/*.md            THE SOURCE — 12 documentation files
  docs/*.dc.html       13 rendered pages (12 + index) for visual reference
  support.js           design-tool runtime — NOT part of the site
  image-slot.js        design-tool image placeholder — NOT part of the site
```
