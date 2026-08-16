
const MONO = "ui-monospace,'Roboto Mono',SFMono-Regular,Menlo,Consolas,monospace";
const SANS = "Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const C = { bg:'#08090A', panel:'#0B0D0E', b1:'#191D1F', b2:'#23282B', text:'#E6E9EA', bright:'#F2F4F5', body:'#C8CDCF', muted:'#9AA1A4', dim:'#6B7275', faint:'#4A5053', green:'#32CD32', greenB:'#1F3D22', amber:'#FF8C00' };

const PAGES = [
  { f:'IsThisForYourGame', group:'Before you buy',      nav:'Is this for your game?' },
  { f:'GettingStarted',    group:'Getting it running',  nav:'Getting started' },
  { f:'BeginnerGuide',     group:'Getting it running',  nav:"Beginner's guide" },
  { f:'HardwareTiers',     group:'Getting it running',  nav:'Hardware tiers' },
  { f:'Dialogue',          group:'Building with it',    nav:'Dialogue' },
  { f:'Actions',           group:'Building with it',    nav:'Actions' },
  { f:'Languages',         group:'Building with it',    nav:'Languages' },
  { f:'InterviewDemo',     group:'Building with it',    nav:'The interview demo' },
  { f:'Troubleshooting',   group:'When it breaks',      nav:'Troubleshooting' },
  { f:'ThirdPartyNotices', group:'Licences and history',nav:'Third-party notices' },
  { f:'VoiceLicences',     group:'Licences and history',nav:'Voice licences' },
  { f:'Changelog',         group:'Licences and history',nav:'Changelog' },
];
const KNOWN = new Set(PAGES.map(p => p.f));
const MISSING = new Map();

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const slug = s => s.toLowerCase().replace(/[\u0060*_]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

function inline(src) {
  const code = [];
  let s = src.replace(/\u0060([^\u0060]+)\u0060/g, (m, g) => { code.push(g); return '\u0000' + (code.length - 1) + '\u0000'; });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) => {
    const u = url.startsWith('images/') ? '../assets/docs/' + url.slice(7) : url;
    return '<img src="' + u + '" alt="' + alt + '" style="display:block;width:100%;height:auto;border:1px solid ' + C.b2 + ';margin:8px 0 6px" />';
  });
  const A = (href, label, blank) => '<a href="' + href + '"' + (blank ? ' target="_blank" rel="noopener"' : '') + ' style="color:' + C.green + ';border-bottom:1px solid ' + C.greenB + '" style-hover="border-bottom-color:' + C.green + '">' + label + '</a>';
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    if (/^https?:/.test(url)) return A(url, label, true);
    const mm = url.match(/([A-Za-z_]+)\.md(#[^)]*)?$/);
    if (mm) {
      const file = mm[1], anchor = mm[2] || '';
      if (KNOWN.has(file)) return A('./' + file + '.dc.html' + anchor, label, false);
      MISSING.set(file, (MISSING.get(file) || 0) + 1);
      return '<span title="Ships inside the package; not on the site yet" style="color:' + C.dim + ';border-bottom:1px dotted ' + C.b2 + '">' + label + '</span>';
    }
    return A(url, label, false);
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:' + C.bright + ';font-weight:500">$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em style="color:' + C.text + ';font-style:italic">$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code style="font-family:' + MONO + ';font-size:0.88em;background:#121517;border:1px solid ' + C.b1 + ';padding:1px 5px;color:' + C.text + '">' + esc(code[+i]) + '</code>');
  return s;
}

function renderTable(rows) {
  const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const hasHead = head.some(h => h.length);
  let out = '<div style="overflow-x:auto;margin:24px 0;border:1px solid ' + C.b1 + ';background:' + C.panel + '"><table style="border-collapse:collapse;width:100%">';
  if (hasHead) out += '<thead><tr>' + head.map(h => '<th style="text-align:left;padding:12px 15px;font-family:' + MONO + ';font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:' + C.dim + ';font-weight:500;border-bottom:1px solid ' + C.b2 + ';white-space:nowrap">' + inline(h) + '</th>').join('') + '</tr></thead>';
  out += '<tbody>' + body.map(r => '<tr>' + r.map((c, i) => '<td style="padding:13px 15px;font-size:14px;line-height:1.6;color:' + (i === 0 ? C.text : C.body) + ';border-top:1px solid ' + C.b1 + ';vertical-align:top">' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  return out;
}

function mdToHtml(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  let out = '', i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\u0060\u0060\u0060/.test(line)) {
      const buf = []; i++;
      while (i < lines.length && !/^\u0060\u0060\u0060/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out += '<pre style="margin:24px 0;padding:18px 20px;background:' + C.panel + ';border:1px solid ' + C.b1 + ';border-left:2px solid ' + C.b2 + ';overflow-x:auto;font-family:' + MONO + ';font-size:13px;line-height:1.7;color:' + C.body + ';white-space:pre">' + esc(buf.join('\n')) + '</pre>';
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (!(j < lines.length && /^##\s/.test(lines[j]))) out += '<hr style="border:0;border-top:1px solid ' + C.b1 + ';margin:44px 0" />';
      i++; continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length, txt = h[2].trim(), id = slug(txt);
      if (lvl === 1) out += '<h1 style="margin:0 0 20px;font-family:' + MONO + ';font-weight:500;font-size:clamp(23px,3.2vw,34px);line-height:1.2;letter-spacing:-0.01em;color:' + C.bright + ';text-wrap:pretty">' + inline(txt) + '</h1>';
      else if (lvl === 2) out += '<h2 id="' + id + '" style="margin:52px 0 18px;padding-top:22px;border-top:1px solid ' + C.b1 + ';font-family:' + MONO + ';font-weight:500;font-size:clamp(17px,2vw,20px);line-height:1.35;color:' + C.bright + ';text-wrap:pretty">' + inline(txt) + '</h2>';
      else out += '<h' + lvl + ' id="' + id + '" style="margin:34px 0 14px;font-family:' + MONO + ';font-weight:500;font-size:15px;line-height:1.45;letter-spacing:0.04em;color:' + C.text + ';text-wrap:pretty">' + inline(txt) + '</h' + lvl + '>';
      i++; continue;
    }
    if (/^\s*\|/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { buf.push(lines[i].trim()); i++; }
      if (buf.length > 2) out += renderTable(buf);
      continue;
    }
    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      out += '<blockquote style="margin:26px 0;padding:18px 20px;background:rgba(50,205,50,0.04);border:1px solid ' + C.greenB + ';border-left:2px solid ' + C.green + '">' + mdToHtml(buf.join('\n')) + '</blockquote>';
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')));
        else items[items.length - 1] += ' ' + inline(lines[i].trim());
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out += '<' + tag + ' style="margin:18px 0;padding-left:22px;color:' + C.body + ';font-size:15px;line-height:1.75">' + items.map(it => '<li style="margin:0 0 10px">' + it + '</li>').join('') + '</' + tag + '>';
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\u0060\u0060\u0060|>|\s*\||\s*([-*]|\d+\.)\s|---+\s*$)/.test(lines[i])) { buf.push(lines[i].trim()); i++; }
    const para = buf.join(' ');
    if (/^!\[/.test(para)) out += '<figure style="margin:28px 0">' + inline(para) + '</figure>';
    else out += '<p style="margin:0 0 18px;font-size:15px;line-height:1.78;color:' + C.body + ';text-wrap:pretty">' + inline(para) + '</p>';
  }
  return out;
}

const sources = {}, meta = {};
for (const p of PAGES) {
  const md = await readFile('docs/' + p.f + '.md');
  sources[p.f] = md;
  const title = (md.match(/^#\s+(.+)$/m) || [, p.f])[1].trim();
  const after = md.split(/^#\s+.+$/m)[1] || '';
  const firstPara = after.split(/\n\s*\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#') && !s.startsWith('!') && !s.startsWith('|') && !s.startsWith('>'))[0] || '';
  meta[p.f] = { title, nav: p.nav, blurb: firstPara.replace(/\n/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*\u0060]/g, '').slice(0, 160) };
}

const groups = [];
for (const p of PAGES) {
  let g = groups.find(x => x.name === p.group);
  if (!g) { g = { name: p.group, items: [] }; groups.push(g); }
  g.items.push(p);
}

const nav = current => groups.map(g =>
  '        <div style="display:flex;flex-direction:column;gap:9px">\n' +
  '          <div style="font-family:' + MONO + ';font-size:10px;letter-spacing:0.18em;color:' + C.faint + '">' + g.name.toUpperCase() + '</div>\n' +
  g.items.map(it => '          <a href="./' + it.f + '.dc.html" style="font-family:' + MONO + ';font-size:12px;line-height:1.45;color:' + (it.f === current ? C.green : C.muted) + ';border-left:2px solid ' + (it.f === current ? C.green : 'transparent') + ';padding:2px 0 2px 10px;margin-left:-12px" style-hover="color:' + C.text + '">' + meta[it.f].nav + '</a>').join('\n') +
  '\n        </div>').join('\n');

const HEAD = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<script src="../support.js"><\/script>\n</head>\n<body>\n<x-dc>\n<helmet>\n<style>\n' +
'  * { box-sizing: border-box; }\n' +
'  html, body { margin: 0; padding: 0; background: ' + C.bg + '; }\n' +
'  html { scroll-behavior: smooth; }\n' +
'  body { color: ' + C.text + '; font-family: ' + SANS + '; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }\n' +
'  a { color: ' + C.green + '; text-decoration: none; }\n' +
'  a:hover { color: ' + C.text + '; }\n' +
'  ::selection { background: ' + C.green + '; color: ' + C.bg + '; }\n' +
'  body ::-webkit-scrollbar { height: 9px; width: 9px; }\n' +
'  body ::-webkit-scrollbar-track { background: ' + C.panel + '; }\n' +
'  body ::-webkit-scrollbar-thumb { background: ' + C.b2 + '; }\n' +
'  body ::-webkit-scrollbar-thumb:hover { background: ' + C.green + '; }\n' +
'</style>\n</helmet>';
const TAIL = '</x-dc>\n<script type="text/x-dc" data-dc-script>\nclass Component extends DCLogic {\n  renderVals() { return {}; }\n}\n<\/script>\n</body>\n</html>\n';

function chrome(inner, current) {
  const idx = PAGES.findIndex(p => p.f === current);
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx >= 0 && idx < PAGES.length - 1 ? PAGES[idx + 1] : null;
  const card = (p, isNext) => '<a href="./' + p.f + '.dc.html" style="flex:1 1 200px;background:' + C.panel + ';padding:18px 20px;display:flex;flex-direction:column;gap:7px' + (isNext ? ';text-align:right;align-items:flex-end' : '') + '" style-hover="background:#101314"><span style="font-family:' + MONO + ';font-size:10px;letter-spacing:0.18em;color:' + C.faint + '">' + (isNext ? 'NEXT &rarr;' : '&larr; PREVIOUS') + '</span><span style="font-family:' + MONO + ';font-size:13px;color:' + C.text + '">' + meta[p.f].nav + '</span></a>';
  const foot = (prev || next) ? '\n      <div style="display:flex;flex-wrap:wrap;gap:1px;background:' + C.b1 + ';border:1px solid ' + C.b1 + ';margin-top:64px">' + (prev ? card(prev, false) : '') + (next ? card(next, true) : '') + '</div>' : '';
  return HEAD + '\n<div style="background:' + C.bg + ';min-height:100vh">\n' +
'  <header style="position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding:14px clamp(16px,4vw,44px);border-bottom:1px solid ' + C.b1 + ';background:rgba(8,9,10,0.94)">\n' +
'    <div style="display:flex;align-items:baseline;gap:10px;font-family:' + MONO + ';min-width:0">\n' +
'      <a href="../Offline AI NPC - Landing.dc.html" style="font-size:13px;font-weight:700;letter-spacing:0.16em;color:' + C.text + ';white-space:nowrap" style-hover="color:' + C.green + '">OFFLINE&#8202;AI&#8202;NPC</a>\n' +
'      <a href="./Documentation.dc.html" style="font-size:11px;letter-spacing:0.14em;color:' + C.dim + '" style-hover="color:' + C.text + '">/ DOCS</a>\n' +
'    </div>\n' +
'    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:clamp(12px,2.4vw,24px);font-family:' + MONO + ';font-size:11px;letter-spacing:0.14em">\n' +
'      <a href="../assets/plugin-docs.pdf" style="color:' + C.muted + '" style-hover="color:' + C.text + '">PDF</a>\n' +
'      <a href="https://merrymaker14.itch.io/the-interview" target="_blank" rel="noopener" style="color:' + C.muted + '" style-hover="color:' + C.text + '">DEMO</a>\n' +
'      <a href="../Offline AI NPC - Landing.dc.html#get" style="display:inline-block;padding:7px 13px;border:1px solid ' + C.green + ';color:' + C.green + ';letter-spacing:0.16em;white-space:nowrap" style-hover="background:' + C.green + ';color:' + C.bg + '">BUY &mdash; $89</a>\n' +
'    </div>\n  </header>\n\n' +
'  <div style="max-width:1240px;margin:0 auto;padding:clamp(28px,5vw,56px) clamp(16px,4vw,44px) 96px;display:flex;flex-wrap:wrap;align-items:flex-start;gap:clamp(28px,5vw,64px)">\n' +
'    <aside style="flex:0 0 210px;min-width:0;position:sticky;top:76px;display:flex;flex-direction:column;gap:26px;padding-left:12px">\n' + nav(current) + '\n    </aside>\n' +
'    <article style="flex:1 1 min(100%,400px);min-width:0;max-width:78ch">\n' + inner + foot + '\n    </article>\n  </div>\n</div>\n' + TAIL;
}

for (const p of PAGES) await saveFile('docs/' + p.f + '.dc.html', chrome(mdToHtml(sources[p.f]), p.f));

const indexInner = '      <h1 style="margin:0 0 16px;font-family:' + MONO + ';font-weight:500;font-size:clamp(24px,3.4vw,36px);letter-spacing:-0.01em;color:' + C.bright + '">Documentation</h1>\n' +
'      <p style="margin:0;font-size:15px;line-height:1.78;color:' + C.body + ';max-width:64ch;text-wrap:pretty">The same pages that ship inside the package, rendered from the same files. Every latency figure comes from one stated machine and is reproducible with the tools in the download.</p>\n' +
'      <div style="display:flex;flex-direction:column;gap:40px;margin-top:48px">\n' +
groups.map(g => '        <div style="display:flex;flex-direction:column;gap:10px">\n' +
'          <span style="font-family:' + MONO + ';font-size:10px;letter-spacing:0.2em;color:' + C.green + '">' + g.name.toUpperCase() + '</span>\n' +
'          <div style="display:flex;flex-direction:column;gap:1px;background:' + C.b1 + ';border:1px solid ' + C.b1 + '">\n' +
g.items.map(it => '            <a href="./' + it.f + '.dc.html" style="background:' + C.panel + ';padding:22px 24px;display:flex;flex-direction:column;gap:9px" style-hover="background:#101314"><span style="font-family:' + MONO + ';font-size:15px;font-weight:500;letter-spacing:0.03em;color:' + C.bright + '">' + meta[it.f].title + '</span><span style="font-size:14px;line-height:1.65;color:' + C.muted + ';text-wrap:pretty">' + inline(meta[it.f].blurb) + '&hellip;</span></a>').join('\n') +
'\n          </div>\n        </div>').join('\n') +
'\n      </div>\n' +
'      <div style="margin-top:56px;border:1px dashed ' + C.b2 + ';padding:20px 22px;display:flex;flex-direction:column;gap:10px">\n' +
'        <span style="font-family:' + MONO + ';font-size:10px;letter-spacing:0.18em;color:' + C.amber + '">NOT ON THE SITE YET</span>\n' +
'        <p style="margin:0;font-size:14px;line-height:1.7;color:' + C.muted + ';max-width:66ch;text-wrap:pretty">' + [...MISSING.keys()].sort().join(', ') + ' &mdash; referenced by the pages above and shipped inside the package, but not on the site yet. Links to them read as plain text rather than breaking.</p>\n' +
'      </div>';
await saveFile('docs/Documentation.dc.html', chrome(indexInner, null));

log('pages: ' + PAGES.length + ' + index');
log('missing: ' + [...MISSING.entries()].map(e => e[0] + '(' + e[1] + ')').join(', '));
