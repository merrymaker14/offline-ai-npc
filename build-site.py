# -*- coding: utf-8 -*-
"""Turn the design reference into a static site GitHub Pages can serve.

The handoff says it plainly: `reference/*.dc.html` are design files, they render through
`support.js` — a runtime belonging to the design tool — and they must not be deployed. What
Pages serves is whatever is pushed, so the deliverable is plain HTML and CSS with no runtime,
no build step at the far end, and no framework.

Four things have to be undone, and none of them are cosmetic:

  1. `support.js` and the `<script type="text/x-dc">` logic block go. Ship them and every page
     depends on a file that does not belong to us.
  2. `<x-dc>` and `<helmet>` are the tool's wrappers. The style block inside helmet belongs in
     `<head>`; a browser tolerates it in the body, but only by accident.
  3. `style-hover="..."` is a design-tool attribute and does nothing in a browser. Every hover
     state on the site lives in these — links, buttons, cards. Dropped silently, the site
     still looks right in a screenshot and feels dead under the cursor.
  4. `<sc-if value="{{ showStatusBar }}">` has a documented default of true, so the content
     stays and the wrapper goes.

Output goes to `site/`, which is what gets pushed.
"""
import io, os, re, shutil, html

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference")
OUT = os.path.join(HERE, "site")

# The page a reader lands on. Its file is named for the design tool, not for a web server.
LANDING_SRC = "Landing.dc.html"

TITLES = {
    "index": "Offline AI NPC — conversational NPCs that run locally",
    "Documentation": "Documentation — Offline AI NPC",
    "IsThisForYourGame": "Is this for your game? — Offline AI NPC",
    "GettingStarted": "Getting started — Offline AI NPC",
    "BeginnerGuide": "Beginner's guide — Offline AI NPC",
    "HardwareTiers": "Hardware tiers — Offline AI NPC",
    "Dialogue": "Dialogue — Offline AI NPC",
    "Actions": "Actions — Offline AI NPC",
    "Languages": "Languages — Offline AI NPC",
    "InterviewDemo": "The interview demo — Offline AI NPC",
    "Troubleshooting": "Troubleshooting — Offline AI NPC",
    "ThirdPartyNotices": "Third-party notices — Offline AI NPC",
    "VoiceLicences": "Voice licences — Offline AI NPC",
    "Changelog": "Changelog — Offline AI NPC",
}


def up_for(depth):
    """`../` for each level below the site root, so a link works from any page."""
    return "../" * depth


def hover_to_css(markup, prefix):
    """Lift every `style-hover` into a real stylesheet, one class per distinct declaration."""
    rules, seen = [], {}

    def swap(match):
        decls = html.unescape(match.group(1)).strip().rstrip(";")
        if not decls:
            return ""
        if decls not in seen:
            name = "%s%d" % (prefix, len(seen) + 1)
            seen[decls] = name
            rules.append(".%s:hover{%s}" % (name, decls))
        return '\x00CLASS:%s\x00' % seen[decls]

    markup = re.sub(r'\s*style-hover="([^"]*)"', swap, markup)

    # Attach each marker to its own tag's class attribute.
    def attach(match):
        tag = match.group(0)
        names = re.findall(r"\x00CLASS:([A-Za-z0-9_-]+)\x00", tag)
        if not names:
            return tag
        tag = re.sub(r"\x00CLASS:[A-Za-z0-9_-]+\x00", "", tag)
        existing = re.search(r'\sclass="([^"]*)"', tag)
        if existing:
            tag = tag.replace(existing.group(0), ' class="%s %s"' % (existing.group(1), " ".join(names)))
        else:
            tag = tag[:-1].rstrip() + ' class="%s">' % " ".join(names)
        return tag

    markup = re.sub(r"<[a-zA-Z][^>]*>", attach, markup)
    return markup, rules


def convert(path, depth):
    src = io.open(path, encoding="utf-8").read()

    src = re.sub(r'\s*<script src="[^"]*support\.js"></script>', "", src)
    src = re.sub(r'<script type="text/x-dc".*?</script>', "", src, flags=re.S)
    src = re.sub(r"</?x-dc>", "", src)
    src = re.sub(r"<sc-if[^>]*>", "", src)
    src = re.sub(r"</sc-if>", "", src)

    helmet = re.search(r"<helmet>(.*?)</helmet>", src, re.S)
    head_extra = helmet.group(1).strip() if helmet else ""
    src = re.sub(r"<helmet>.*?</helmet>", "", src, flags=re.S)

    stem = os.path.splitext(os.path.splitext(os.path.basename(path))[0])[0]
    key = "index" if path.endswith(LANDING_SRC) else stem
    body, rules = hover_to_css(src, "h")

    # DESIGN FILENAMES ARE NOT WEB FILENAMES, and the landing has two of them: the file on
    # disk is `Landing.dc.html`, while every documentation page links to it as
    # `../Offline AI NPC - Landing.dc.html` — the name it carries inside the design tool.
    # Matching only the first one produced thirteen links to a file called
    # "Offline AI NPC - index.html", which is worse than leaving them alone: they look
    # converted. Rewrite anything ending in `Landing.dc.html`, whatever precedes it.
    body = re.sub(r'href="[^"]*?Landing\.dc\.html', lambda m: 'href="%sindex.html' % up_for(depth), body)
    body = re.sub(r'(href="[^"]*?)\.dc\.html', r"\1.html", body)

    inner = re.search(r"<body>(.*)</body>", body, re.S)
    inner = inner.group(1).strip() if inner else body

    up = "../" * depth
    title = TITLES.get(key) or (key + " — Offline AI NPC")
    hover_css = "\n".join(rules)

    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
<meta name="description" content="A local language model, local speech recognition and local speech synthesis for Unity characters. No cloud, no API keys, no telemetry.">
<link rel="icon" href="%sassets/favicon.svg" type="image/svg+xml">
%s
<style>
%s
</style>
</head>
<body>
%s
</body>
</html>
""" % (html.escape(title), up, head_extra, hover_css, inner)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "docs"))

    io.open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="\n").write(
        convert(os.path.join(REF, LANDING_SRC), depth=0))
    pages = 1

    for name in sorted(os.listdir(os.path.join(REF, "docs"))):
        if not name.endswith(".dc.html"):
            continue
        out_name = name.replace(".dc.html", ".html")
        io.open(os.path.join(OUT, "docs", out_name), "w", encoding="utf-8", newline="\n").write(
            convert(os.path.join(REF, "docs", name), depth=1))
        pages += 1

    shutil.copytree(os.path.join(HERE, "assets"), os.path.join(OUT, "assets"))

    # A terminal-green square. Inline SVG so the site still loads nothing from anywhere.
    io.open(os.path.join(OUT, "assets", "favicon.svg"), "w", encoding="utf-8", newline="\n").write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        '<rect width="16" height="16" fill="#08090A"/>'
        '<rect x="3" y="3" width="10" height="10" fill="none" stroke="#32CD32" stroke-width="1.5"/>'
        '</svg>\n')

    # Pages runs Jekyll unless told not to, and Jekyll skips files it does not understand.
    io.open(os.path.join(OUT, ".nojekyll"), "w", encoding="utf-8", newline="\n").write("")

    print("%d pages -> %s" % (pages, OUT))


if __name__ == "__main__":
    main()
