// Showcase page for a portfolio: one self-contained HTML file (icons and images are inlined).
// The build writes it to: site/index.html

import { readFileSync } from 'node:fs';
import { variants, palette, buildTheme } from './themes.mjs';
import { buildIcons, fileIcons, folderStyles } from './icons.mjs';
import { windowHtml, WINDOW_CSS } from './preview.mjs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const DESCRIPTIONS = {
  'rika-unicorn-dark': 'The midnight-blue mane. Pink keywords, golden strings, and a cursor the color of the horn.',
  'rika-unicorn-light': 'Soft pink, like the unicorn’s blush, with darker code colors that stay easy to read.',
  'rika-butterfly-sky': 'Light blue from the butterfly’s wings, with pink and purple accents.',
  'rika-sweet-teal': 'The teal of the “You are sweet.” card, with the pink of its lettering.',
};

const PALETTE_GROUPS = [
  ['The mane', ['hotPink', 'pink', 'blush', 'rose', 'magenta', 'lilac', 'purple', 'plum', 'indigo', 'midnight']],
  ['Horn & flowers', ['gold', 'yellow', 'cream', 'red', 'orange', 'peach', 'leaf', 'white']],
  ['Butterfly & card', ['sky', 'blue', 'ocean', 'flowerBlue', 'teal']],
];

const ROLES = [
  ['Keyword', 'keyword', 'return'],
  ['Function', 'func', 'bloom()'],
  ['Type', 'type', 'Meadow'],
  ['String', 'string', "'sweet'"],
  ['Number', 'number', '42'],
  ['Property', 'property', '.flowers'],
  ['Built-in', 'builtin', 'string'],
  ['Comment', 'comment', '// magic'],
];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const short = (label) => label.replace(/^Rika /, '');

export function siteParts() {
  const { files, theme: iconTheme } = buildIcons();
  const sprite = Object.entries(files)
    .map(([name, svgText]) => `.i-${name.replace('.svg', '')}{background-image:url("data:image/svg+xml,${encodeURIComponent(svgText.trim())}")}`)
    .join('\n');
  const iconPng = readFileSync(new URL('images/icon.png', root)).toString('base64');
  const fi = (id, cls = '') => `<span class="fi${cls} i-${id}" aria-hidden="true"></span>`;

  const sample = buildTheme(variants[0]);
  const stats = {
    themes: variants.length,
    icons: Object.keys(files).length,
    languages: Object.keys(iconTheme.languageIds).length,
    folders: Object.keys(iconTheme.folderNames).length,
    uiKeys: Object.keys(sample.colors).length,
    rules: sample.tokenColors.length,
    colors: Object.keys(palette).length,
  };

  const tabs = variants.map((v, i) =>
    `<button type="button" class="tab-btn" id="tab-${v.id}" role="tab" aria-controls="stage" aria-selected="${i === 0}" data-theme-tab="${v.id}">
      <span class="dots" aria-hidden="true"><i style="background:${v.ui.bg}"></i><i style="background:${v.syntax.keyword}"></i><i style="background:${v.syntax.string}"></i></span>
      ${short(v.label)}
    </button>`).join('');

  const windows = variants.map((v, i) => windowHtml(v, (id) => fi(id)).replace('<section class="theme"', `<section class="theme"${i ? ' hidden' : ''}`)).join('');
  const descs = variants.map((v, i) => `<p class="desc" data-desc="${v.id}"${i ? ' hidden' : ''}><b>${v.label}.</b> ${DESCRIPTIONS[v.id] ?? ''}</p>`).join('');

  const used = new Set(PALETTE_GROUPS.flatMap(([, keys]) => keys));
  const groups = PALETTE_GROUPS.map(([name, keys], gi) => {
    const extra = gi === PALETTE_GROUPS.length - 1 ? Object.keys(palette).filter((k) => !used.has(k)) : [];
    const chips = [...keys, ...extra].filter((k) => palette[k]).map((k) =>
      `<li class="chip"><span class="chip-color" style="background:${palette[k]}"></span><span class="chip-name">${k}</span><code>${palette[k]}</code></li>`).join('');
    return `<div class="pgroup"><h3>${name}</h3><ul class="chips">${chips}</ul></div>`;
  }).join('');

  const head = variants.map((v) => `<th scope="col">${short(v.label)}</th>`).join('');
  const rows = ROLES.map(([name, key, text]) => {
    const cells = variants.map((v) => {
      const col = v.syntax[key];
      const r = ratio(col, v.ui.bg);
      const italic = key === 'comment' ? ';font-style:italic' : '';
      return `<td style="background:${v.ui.bg}"><span class="tok" style="color:${col}${italic}">${text}</span><span class="ratio" style="color:${v.ui.fgMuted}">${r.toFixed(1)}:1</span></td>`;
    }).join('');
    return `<tr><th scope="row">${name}</th>${cells}</tr>`;
  }).join('');

  const iconPanel = (v, title) => {
    const folders = Object.keys(folderStyles).map((id) =>
      `<li><span class="pair">${fi(`folder-${id}`, ' lg')}${fi(`folder-${id}-open`, ' lg')}</span><span>${id}</span></li>`).join('');
    const fileList = Object.keys(fileIcons).map((id) => `<li>${fi(`file-${id}`, ' lg')}<span>${id}</span></li>`).join('');
    return `<div class="ipanel" style="background:${v.ui.bgSide};color:${v.ui.fgMuted}">
      <h3 style="color:${v.ui.fg}">${title}</h3>
      <ul class="igrid folders">${folders}</ul>
      <ul class="igrid">${fileList}</ul>
    </div>`;
  };

  // package.json "author": { "name", "url" } → a link back to the author's portfolio
  const author = typeof pkg.author === 'string' ? { name: pkg.author } : (pkg.author ?? {});
  const backLink = author.url
    ? `<nav class="topbar" aria-label="Portfolio"><a href="${author.url}">← ${author.name ? `${author.name}’s portfolio` : 'Portfolio'}</a></nav>`
    : '';
  const madeBy = author.url ? `<span>Made by <a href="${author.url}">${author.name ?? author.url}</a></span>` : '';
  const extId = `${pkg.publisher}.${pkg.name}`;
  const installCmd = `code --install-extension ${extId}`;
  const marketplaceUrl = `https://marketplace.visualstudio.com/items?itemName=${extId}`;
  const repoUrl = String(pkg.repository?.url ?? '').replace(/\.git$/, '');
  const releaseUrl = repoUrl ? `${repoUrl}/releases/latest` : '';
  const ctas = `<div class="ctas"><a class="btn primary" href="${marketplaceUrl}">Install from the Marketplace</a>${
    repoUrl ? `<a class="btn" href="${releaseUrl}">Download the .vsix</a><a class="btn ghost" href="${repoUrl}">Source on GitHub</a>` : ''}</div>`;

  const headHtml = `<title>Rika Unicorn Theme</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${pkg.description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Fredoka:wght@500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: one centered column. Hero (name + icon), a theme stage with a live mock editor,
   then the palette, code colors with contrast, icons, how it is built, and install. */
:root {
  --bg: #FFF7FA;
  --surface: #FFFFFF;
  --ink: #2A1E47;
  --muted: #6B5B8C;
  --line: #EFDAE7;
  --accent: #C2136A;
  --accent-soft: #FCE3EF;
  --mane-1: #F0296C;
  --mane-2: #914BB0;
  --mane-3: #36246E;
  --shadow: 0 30px 70px -30px rgba(54, 36, 110, .45);
  --f-display: 'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif;
  --f-body: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #130E24; --surface: #1C1534; --ink: #F1E9FA; --muted: #B2A3D3; --line: #2E2554;
    --accent: #FF73B0; --accent-soft: #2E1F4A; --mane-1: #FF6FAE; --mane-2: #C99BFF; --mane-3: #8FB8FF;
    --shadow: 0 30px 70px -30px rgba(0, 0, 0, .7); color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #130E24; --surface: #1C1534; --ink: #F1E9FA; --muted: #B2A3D3; --line: #2E2554;
  --accent: #FF73B0; --accent-soft: #2E1F4A; --mane-1: #FF6FAE; --mane-2: #C99BFF; --mane-3: #8FB8FF;
  --shadow: 0 30px 70px -30px rgba(0, 0, 0, .7); color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 var(--f-body); }
.wrap { max-width: 1180px; margin: 0 auto; padding-block: 0; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
section.block { padding-block: clamp(48px, 8vw, 96px) 0; display: grid; gap: 24px; }
h1, h2, h3 { font-family: var(--f-display); font-weight: 600; text-wrap: balance; margin: 0; line-height: 1.1; }
h2 { font-size: clamp(28px, 4vw, 40px); }
h3 { font-size: 18px; }
p { margin: 0; max-width: 65ch; }
.eyebrow { font: 600 12px/1 var(--f-body); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
.lede { color: var(--muted); font-size: 18px; }
code, pre { font-family: var(--f-mono); }

/* Hero */
.hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: clamp(24px, 5vw, 64px); align-items: center; padding-block: clamp(40px, 8vw, 88px) 0; }
.hero h1 { font-size: clamp(48px, 9vw, 104px); letter-spacing: -.02em; margin-block: 14px 18px; }
.hero h1 .mane { background: linear-gradient(100deg, var(--mane-1), var(--mane-2) 55%, var(--mane-3)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.facts { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 26px 0 0; padding: 0; list-style: none; color: var(--muted); font-size: 15px; }
.facts b { color: var(--ink); font-family: var(--f-display); font-size: 22px; font-weight: 600; margin-right: 4px; font-variant-numeric: tabular-nums; }
.ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 22px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font: 600 15px/1 var(--f-body); text-decoration: none; }
.btn:hover { border-color: var(--accent); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #FFFFFF; }
.btn.ghost { border-color: transparent; background: transparent; padding-inline: 10px; text-decoration: underline; text-underline-offset: 4px; }
.btn.ghost:hover { border-color: transparent; color: var(--accent); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.hero-icon { width: clamp(140px, 22vw, 240px); max-width: 100%; height: auto; display: block; filter: drop-shadow(0 24px 40px rgba(54, 36, 110, .35)); }

/* Theme stage */
.tabs-row { display: flex; flex-wrap: wrap; gap: 10px; }
.tab-btn { display: inline-flex; align-items: center; gap: 10px; padding: 9px 16px 9px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font: 500 15px/1 var(--f-body); cursor: pointer; }
.tab-btn:hover { border-color: var(--accent); }
.tab-btn[aria-selected="true"] { background: var(--accent-soft); border-color: var(--accent); color: var(--ink); }
.tab-btn:focus-visible, .copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.dots { display: inline-flex; }
.dots i { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px var(--surface); }
.dots i + i { margin-left: -4px; }
.desc { color: var(--muted); min-height: 1.6em; }
.desc b { color: var(--ink); font-weight: 700; }
.stage { position: relative; width: 100%; aspect-ratio: 1240 / 760; overflow: hidden; border-radius: 14px; box-shadow: var(--shadow); }
.stage.sized { aspect-ratio: auto; }
.stage section.theme { position: absolute; inset: 0 auto auto 0; overflow: hidden; }
.swipe-hint { display: none; margin: -8px 0 0; font-size: 13px; color: var(--muted); }
.stage h2 { display: none; }
.stage .win { width: 1240px; height: 760px; transform-origin: 0 0; border-radius: 0; box-shadow: none; text-align: left; line-height: 1.4; }
.stage .editor, .stage .term { font-family: var(--f-mono); }
${WINDOW_CSS}
.fi { display: inline-block; width: 16px; height: 16px; flex: none; background: center / contain no-repeat; vertical-align: middle; }
.fi.lg { width: 32px; height: 32px; }

/* Palette */
.pgroups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 28px; }
.pgroup { display: grid; gap: 12px; align-content: start; }
.pgroup h3 { font-size: 15px; color: var(--muted); font-family: var(--f-body); font-weight: 600; }
.chips { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 12px; }
.chip { display: grid; gap: 2px; font-size: 13px; }
.chip-color { height: 52px; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .08); margin-bottom: 4px; }
.chip-name { font-weight: 500; }
.chip code { font-size: 12px; color: var(--muted); }

/* Code colors table */
.table-scroll { overflow-x: auto; border-radius: 14px; border: 1px solid var(--line); }
table { border-collapse: collapse; width: 100%; min-width: 720px; font-size: 14px; }
th, td { padding: 12px 16px; text-align: left; }
thead th { font: 600 13px/1.2 var(--f-body); color: var(--muted); background: var(--surface); border-bottom: 1px solid var(--line); }
tbody th { font-weight: 500; background: var(--surface); white-space: nowrap; }
thead th:first-child, tbody th { position: sticky; left: 0; z-index: 1; box-shadow: 1px 0 0 var(--line); }
tbody tr + tr th { border-top: 1px solid var(--line); }
td .tok { font: 600 15px/1.2 var(--f-mono); margin-right: 10px; }
td .ratio { font: 12px/1 var(--f-mono); font-variant-numeric: tabular-nums; }
.note { color: var(--muted); font-size: 14px; }

/* Icons */
.ipanels { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr)); gap: 20px; }
.ipanel { border-radius: 14px; padding: 22px; display: grid; gap: 18px; align-content: start; }
.ipanel h3 { font-size: 16px; }
.igrid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 14px 8px; font-size: 12px; text-align: center; }
.igrid.folders { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
.igrid li { display: grid; justify-items: center; gap: 4px; }
.pair { display: flex; gap: 4px; }

/* How it's built */
.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 16px; counter-reset: step; }
.steps li { counter-increment: step; border-top: 2px solid var(--line); padding-top: 14px; display: grid; gap: 6px; align-content: start; }
.steps li::before { content: counter(step); font: 600 14px/1 var(--f-display); color: var(--accent); }
.steps h3 { font-size: 18px; }
.steps p { color: var(--muted); font-size: 15px; }

/* Install */
.install { display: grid; gap: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: clamp(20px, 4vw, 32px); }
.cmd { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
.cmd pre { flex: 1 1 320px; min-width: 0; margin: 0; padding: 14px 16px; border-radius: 10px; background: var(--bg); border: 1px solid var(--line); overflow-x: auto; font-size: 14px; }
.copy { border: 0; border-radius: 10px; padding: 0 20px; min-height: 46px; background: var(--accent); color: #FFFFFF; font: 600 15px/1 var(--f-body); cursor: pointer; }
.install ol { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--muted); }
.install ol b { color: var(--ink); font-weight: 600; }
.install p { color: var(--muted); }
.install a { color: var(--accent); }
kbd { font: 12px/1 var(--f-mono); padding: 3px 6px; border-radius: 5px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); }

.topbar { padding-block: 20px 0; font-size: 14px; }
.topbar a, footer a { color: var(--muted); text-underline-offset: 3px; }
.topbar a:hover, footer a:hover { color: var(--accent); }
.topbar + .hero { padding-block-start: clamp(24px, 6vw, 64px); }
footer { padding-block: 64px 48px; color: var(--muted); font-size: 14px; display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between; }

/* Tablet: stack the hero so the buttons get the full width */
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; }
  .hero-icon { order: -1; width: clamp(120px, 20vw, 168px); }
}

/* Phone */
@media (max-width: 640px) {
  .ctas .btn:not(.ghost) { flex: 1 1 100%; }
  .ctas .btn.ghost { margin-inline: auto; }
  /* the editor preview drops the side bar, stays readable and scrolls sideways */
  .stage { overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scrollbar-width: thin; }
  .stage .win { width: 900px; grid-template-columns: minmax(0, 1fr); }
  .stage .act, .stage .side { display: none; }
  .swipe-hint { display: block; }
  table { min-width: 600px; font-size: 13px; }
  th, td { padding: 10px 12px; }
  td .tok { font-size: 13px; margin-right: 6px; }
  .ipanel { padding: 16px; }
  .igrid { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 12px 4px; font-size: 10.5px; }
  .igrid.folders { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
  .igrid span:not(.fi):not(.pair) { overflow-wrap: anywhere; }
}
${sprite}
</style>`;

  const bodyHtml = `<div class="wrap">
  ${backLink}
  <header class="hero">
    <div>
      <span class="eyebrow">VS Code extension · color + icon theme</span>
      <h1>Rika <span class="mane">Unicorn</span></h1>
      <p class="lede">Four color themes and a set of hand-drawn file icons for Visual Studio Code. Every color was sampled from one piece of art: a unicorn with a rainbow mane, flowers, a blue butterfly and a “You are sweet.” card.</p>
      <ul class="facts">
        <li><b>${stats.themes}</b>color themes</li>
        <li><b>${stats.icons}</b>icons</li>
        <li><b>${stats.languages}</b>languages</li>
        <li><b>${stats.folders}</b>folder names</li>
      </ul>
      ${ctas}
    </div>
    <img class="hero-icon" src="data:image/png;base64,${iconPng}" width="240" height="240" alt="The Rika Unicorn Theme icon: a white unicorn with a pink and purple mane on a teal tile">
  </header>

  <section class="block" aria-labelledby="themes-h">
    <span class="eyebrow">The themes</span>
    <h2 id="themes-h">One palette, four moods</h2>
    <div class="tabs-row" role="tablist" aria-label="Color themes">${tabs}</div>
    ${descs}
    <div class="stage" id="stage" role="tabpanel" aria-label="Live preview of the selected theme">${windows}</div>
    <p class="swipe-hint">Swipe sideways to see the whole editor.</p>
  </section>

  <section class="block" aria-labelledby="palette-h">
    <span class="eyebrow">Palette</span>
    <h2 id="palette-h">Colors sampled from the artwork</h2>
    <p class="lede">I quantized the reference images to their dominant colors, then named each one after where it came from. These ${stats.colors} colors drive everything else.</p>
    <div class="pgroups">${groups}</div>
  </section>

  <section class="block" aria-labelledby="code-h">
    <span class="eyebrow">Code colors</span>
    <h2 id="code-h">Cute, but still readable</h2>
    <p class="lede">The build measures the WCAG contrast of every syntax color against its editor background. Code stays at 4.5:1 or above and comments at 3:1 or above, in all ${stats.themes} themes.</p>
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">Role</th>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="swipe-hint">Swipe the table to compare all ${stats.themes} themes.</p>
    <p class="note">Bracket pairs follow the mane: pink, gold, blue, lilac, green, orange.</p>
  </section>

  <section class="block" aria-labelledby="icons-h">
    <span class="eyebrow">Icon theme</span>
    <h2 id="icons-h">Flowers for files, stickers for folders</h2>
    <p class="lede">Each language gets a motif in its usual colors: JavaScript is a yellow flower, TypeScript a blue one, Python a blue-and-yellow butterfly. Folders get a color and a sticker, and a README gets a tiny unicorn.</p>
    <div class="ipanels">
      ${iconPanel(variants[0], 'On a dark theme')}
      ${iconPanel(variants[1], 'On a light theme')}
    </div>
  </section>

  <section class="block" aria-labelledby="build-h">
    <span class="eyebrow">How it’s built</span>
    <h2 id="build-h">Generated from code, end to end</h2>
    <ol class="steps">
      <li><h3>Sample</h3><p>Pillow quantizes the art into a ${stats.colors}-color palette.</p></li>
      <li><h3>Generate</h3><p>One palette file writes ${stats.uiKeys} workbench colors and ${stats.rules} syntax rules for each theme.</p></li>
      <li><h3>Draw</h3><p>Nine SVG motifs, written as code, become ${stats.icons} file and folder icons.</p></li>
      <li><h3>Check</h3><p>A contrast check flags any code color below the WCAG target.</p></li>
      <li><h3>Package</h3><p>A zero-dependency packer zips it all into a .vsix.</p></li>
    </ol>
  </section>

  <section class="block" aria-labelledby="install-h">
    <span class="eyebrow">Try it</span>
    <h2 id="install-h">Install</h2>
    <div class="install">
      <p>Search for <b>Rika Unicorn</b> in the VS Code Extensions view (<kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>X</kbd>), or run:</p>
      <div class="cmd"><pre id="cmd">${installCmd}</pre><button type="button" class="copy" id="copy">Copy</button></div>
      <ol>
        <li>Pick a color theme: <kbd>Ctrl</kbd> <kbd>K</kbd> then <kbd>Ctrl</kbd> <kbd>T</kbd>, then <b>Rika Unicorn Dark</b>, <b>Light</b>, <b>Butterfly Sky</b> or <b>Sweet Teal</b>.</li>
        <li>Turn on the icons: <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>P</kbd>, then <b>File Icon Theme</b>, then <b>Rika Unicorn Icons</b>.</li>
      </ol>
    </div>
  </section>

  <footer>
    <span>Rika Unicorn Theme · v${pkg.version}</span>
    ${madeBy}
    <span>Built with Node.js, SVG and Pillow</span>
  </footer>
</div>
<script>
(() => {
  const stage = document.getElementById('stage');
  // Scale the 1240px-wide mock editor to the stage. On phones the CSS narrows it to
  // the editor only, and it keeps a readable minimum scale and scrolls sideways.
  const phone = window.matchMedia('(max-width: 640px)');
  const fit = () => {
    const win = stage.querySelector('section.theme:not([hidden]) .win');
    if (!win) return;
    const w = win.offsetWidth;
    const h = win.offsetHeight;
    const k = phone.matches ? Math.max(stage.clientWidth / w, 0.66) : stage.clientWidth / w;
    stage.querySelectorAll('section.theme').forEach((s) => { s.style.width = (w * k) + 'px'; s.style.height = (h * k) + 'px'; });
    stage.querySelectorAll('.win').forEach((el) => { el.style.transform = 'scale(' + k + ')'; });
    stage.style.height = (h * k) + 'px';
    stage.classList.add('sized');
  };
  if (phone.addEventListener) phone.addEventListener('change', fit);
  const show = (id) => {
    document.querySelectorAll('[data-theme-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.themeTab === id)));
    stage.querySelectorAll('section.theme').forEach((s) => { s.hidden = s.id !== id; });
    document.querySelectorAll('[data-desc]').forEach((d) => { d.hidden = d.dataset.desc !== id; });
    stage.setAttribute('aria-labelledby', 'tab-' + id);
    fit();
  };
  document.querySelectorAll('[data-theme-tab]').forEach((t) => t.addEventListener('click', () => show(t.dataset.themeTab)));
  addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  fit();

  const copy = document.getElementById('copy');
  copy.addEventListener('click', () => {
    const text = document.getElementById('cmd').textContent;
    const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1600); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById('cmd')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected'; };
    try { navigator.clipboard.writeText(text).then(done, select); } catch { select(); }
  });
})();
</script>`;

  return { head: headHtml, body: bodyHtml };
}

/** Full standalone document, ready to drop into a portfolio site */
export function siteHtml() {
  const { head, body } = siteParts();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
<style>[hidden]{display:none!important} img{max-width:100%}</style>
</head>
<body>
${body}
</body>
</html>
`;
}
