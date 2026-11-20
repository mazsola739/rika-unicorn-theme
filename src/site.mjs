// Showcase page for a portfolio: one self-contained HTML file (icons and images are inlined).
// The build writes it to: site/index.html

import { readFileSync } from 'node:fs';
import { variants, palette, buildTheme } from './themes.mjs';
import { buildIcons, fileIcons, folderStyles } from './icons.mjs';
import { windowHtml, WINDOW_CSS } from './preview.mjs';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const DESCRIPTIONS = {
  'rika-unicorn-dark': 'Midnight blue from the mane, with pink keywords and golden strings.',
  'rika-unicorn-light': 'Soft pink, like the unicorn’s blush. Darker code colors keep it readable.',
  'rika-butterfly-sky': 'Light blue from the butterfly’s wings, with pink and purple accents.',
  'rika-sweet-teal': 'The teal of the “You are sweet.” card, with the pink of its lettering.',
};

const PALETTE_GROUPS = [
  ['Mane', ['hotPink', 'pink', 'blush', 'rose', 'magenta', 'lilac', 'purple', 'plum', 'indigo', 'midnight']],
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
  const heroArt = readFileSync(new URL('images/hero.webp', root)).toString('base64');
  const fi = (id, cls = '') => `<span class="fi${cls} i-${id}" aria-hidden="true"></span>`;

  const sample = buildTheme(variants[0]);
  const stats = {
    themes: variants.length,
    icons: Object.keys(files).length,
    languages: Object.keys(iconTheme.languageIds).length,
    uiKeys: Object.keys(sample.colors).length,
    rules: sample.tokenColors.length,
    colors: Object.keys(palette).length,
  };

  // Links
  const author = typeof pkg.author === 'string' ? { name: pkg.author } : (pkg.author ?? {});
  const extId = `${pkg.publisher}.${pkg.name}`;
  const installCmd = `code --install-extension ${extId}`;
  const marketplaceUrl = `https://marketplace.visualstudio.com/items?itemName=${extId}`;
  const repoUrl = String(pkg.repository?.url ?? '').replace(/\.git$/, '');
  const releaseUrl = repoUrl ? `${repoUrl}/releases/latest` : '';
  const backLink = author.url
    ? `<nav class="topbar" aria-label="Portfolio"><a href="${author.url}">← ${author.name ? `${author.name}’s portfolio` : 'Portfolio'}</a></nav>`
    : '';

  const tabs = variants.map((v, i) =>
    `<button type="button" class="seg" id="tab-${v.id}" role="tab" aria-controls="stage" aria-selected="${i === 0}" data-theme-tab="${v.id}">
      <span class="dots" aria-hidden="true"><i style="background:${v.ui.bg}"></i><i style="background:${v.syntax.keyword}"></i><i style="background:${v.syntax.func}"></i></span>${short(v.label)}
    </button>`).join('');
  const windows = variants.map((v, i) => windowHtml(v, (id) => fi(id)).replace('<section class="theme"', `<section class="theme"${i ? ' hidden' : ''}`)).join('');
  const descs = variants.map((v, i) => `<p class="desc" data-desc="${v.id}"${i ? ' hidden' : ''}>${DESCRIPTIONS[v.id] ?? ''}</p>`).join('');

  const used = new Set(PALETTE_GROUPS.flatMap(([, keys]) => keys));
  const groups = PALETTE_GROUPS.map(([name, keys], gi) => {
    const extra = gi === PALETTE_GROUPS.length - 1 ? Object.keys(palette).filter((k) => !used.has(k)) : [];
    const chips = [...keys, ...extra].filter((k) => palette[k]).map((k) =>
      `<li><span class="sw" style="background:${palette[k]}"></span><span class="sw-name">${k}</span><code>${palette[k]}</code></li>`).join('');
    return `<div class="pgroup"><h3>${name}</h3><ul class="swatches">${chips}</ul></div>`;
  }).join('');

  const head = variants.map((v) => `<th scope="col">${short(v.label)}</th>`).join('');
  const rows = ROLES.map(([name, key, text]) => {
    const cells = variants.map((v) => {
      const col = v.syntax[key];
      const italic = key === 'comment' ? ';font-style:italic' : '';
      return `<td style="background:${v.ui.bg}"><span class="tok" style="color:${col}${italic}">${text}</span><span class="ratio" style="color:${v.ui.fgMuted}">${ratio(col, v.ui.bg).toFixed(1)}:1</span></td>`;
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

  const sectionHead = (id, title, text) =>
    `<div class="head"><h2 id="${id}">${title}</h2><p>${text}</p></div>`;

  const headHtml = `<title>Rika Unicorn Theme</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${pkg.description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;600&family=Nunito:wght@700;800&display=swap">
<style>
/* Layout: one light, pastel page in the mood of the artwork. A teal card hero (like the
   "You are sweet." card) with the unicorn, then sections with a two-column head
   (title left, one sentence right) over their content. */
:root {
  color-scheme: light;
  --paper: #FFF5F8;
  --surface: #FFFFFF;
  --tint: #FCE6EF;
  --ink: #241B47;
  --muted: #6A5E88;
  --line: #F0DCE6;
  --pink: #D2246C;
  --pink-ink: #B3165A;
  --teal-1: #93D5DD;
  --teal-2: #5FB4C2;
  --card-ink: #16304A;
  --shadow: 0 24px 50px -28px rgba(110, 40, 90, .35);
  --r: 16px;
  --f-display: 'Nunito', 'Segoe UI', system-ui, sans-serif;
  --f-body: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.6 var(--f-body); }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 0 8px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1, h2, h3 { font-family: var(--f-display); font-weight: 800; margin: 0; line-height: 1.15; text-wrap: balance; letter-spacing: -.01em; }
h2 { font-size: clamp(26px, 3.2vw, 34px); }
h3 { font-size: 16px; }
p { margin: 0; }
a { color: var(--pink-ink); text-underline-offset: 3px; }
code { font-family: var(--f-mono); }
:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }

.topbar { padding-block: 18px 0; font-size: 14px; }
.topbar a { color: var(--muted); text-decoration: none; }
.topbar a:hover { color: var(--pink-ink); }

/* Hero: the teal card */
.hero { margin-top: 24px; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); align-items: center; gap: 24px;
        border-radius: 28px; padding: clamp(28px, 5vw, 56px); padding-block-end: 0; overflow: hidden; color: var(--card-ink);
        background: radial-gradient(120% 90% at 85% 30%, rgba(255, 255, 255, .45), transparent 60%), linear-gradient(160deg, var(--teal-1), var(--teal-2)); }
.hero-text { display: grid; gap: 18px; align-content: center; padding-bottom: clamp(28px, 5vw, 56px); }
.hero h1 { font-size: clamp(38px, 5.4vw, 58px); }
.hero .sub { font-size: clamp(17px, 1.8vw, 20px); max-width: 30ch; }
.meta { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 14px; font-weight: 500; }
.meta li { background: rgba(255, 255, 255, .55); border-radius: 999px; padding: 4px 12px; }
.meta b { font-weight: 700; font-variant-numeric: tabular-nums; }
.hero-art { align-self: end; justify-self: center; display: block; width: 100%; max-width: 360px; height: auto; }

.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
.cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 22px; border-radius: 14px;
       font: 600 15px/1 var(--f-body); text-decoration: none; border: 1px solid transparent; cursor: pointer; }
.cta.primary { background: var(--pink); color: #FFFFFF; box-shadow: 0 10px 22px -12px rgba(178, 22, 90, .8); }
.cta.primary:hover { background: #BC1A5E; }
.cta.secondary { background: var(--surface); color: var(--ink); border-color: rgba(22, 48, 74, .12); }
.cta.secondary:hover { border-color: var(--pink); }

/* Sections */
section.block { padding-block: clamp(48px, 7vw, 72px) 0; display: grid; gap: 24px; }
.head { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 12px 40px; align-items: end; }
.head p { color: var(--muted); max-width: 60ch; }

/* Theme preview */
.picker { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
.segs { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
.seg { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px 0 10px; border: 0; border-radius: 10px;
       background: transparent; color: var(--muted); font: 600 14px/1 var(--f-body); cursor: pointer; }
.seg:hover { color: var(--ink); }
.seg[aria-selected="true"] { background: var(--tint); color: var(--ink); }
.dots { display: inline-flex; }
.dots i { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px var(--surface); }
.dots i + i { margin-left: -3px; }
.desc { color: var(--muted); font-size: 15px; }
.frame { background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 8px; box-shadow: var(--shadow); }
.stage { position: relative; width: 100%; aspect-ratio: 1240 / 760; overflow: hidden; border-radius: 13px; }
.stage.sized { aspect-ratio: auto; }
.stage section.theme { position: absolute; inset: 0 auto auto 0; overflow: hidden; }
.stage h2 { display: none; }
.stage .win { width: 1240px; height: 760px; transform-origin: 0 0; border-radius: 0; box-shadow: none; text-align: left; line-height: 1.4; }
.stage .editor, .stage .term { font-family: var(--f-mono); }
.hint { display: none; font-size: 13px; color: var(--muted); }
${WINDOW_CSS}
.fi { display: inline-block; width: 16px; height: 16px; flex: none; background: center / contain no-repeat; vertical-align: middle; }
.fi.lg { width: 32px; height: 32px; }

/* Palette */
.pgroups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; align-items: start; }
.pgroup { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 18px; display: grid; gap: 14px; align-content: start; }
.pgroup h3 { font: 600 14px/1.2 var(--f-body); color: var(--muted); }
.swatches { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 14px 10px; }
.swatches li { display: grid; gap: 2px; font-size: 12px; }
.sw { height: 40px; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(36, 27, 71, .1); margin-bottom: 4px; }
.sw-name { font-weight: 600; }
.swatches code { font-size: 11px; color: var(--muted); }

/* Contrast table */
.table-scroll { overflow-x: auto; border-radius: var(--r); border: 1px solid var(--line); background: var(--surface); }
table { border-collapse: collapse; width: 100%; min-width: 720px; font-size: 14px; }
th, td { padding: 12px 16px; text-align: left; }
thead th { font: 600 13px/1.2 var(--f-body); color: var(--muted); background: var(--surface); border-bottom: 1px solid var(--line); }
tbody th { font-weight: 600; background: var(--surface); white-space: nowrap; }
tbody tr + tr th { border-top: 1px solid var(--line); }
thead th:first-child, tbody th { position: sticky; left: 0; z-index: 1; box-shadow: 1px 0 0 var(--line); }
td .tok { font: 600 15px/1.2 var(--f-mono); margin-right: 10px; }
td .ratio { font: 12px/1 var(--f-mono); font-variant-numeric: tabular-nums; }

/* Icons */
.ipanels { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr)); gap: 16px; }
.ipanel { border-radius: var(--r); padding: 22px; display: grid; gap: 18px; align-content: start; }
.ipanel h3 { font: 600 14px/1.2 var(--f-body); }
.igrid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 14px 6px; font-size: 12px; text-align: center; }
.igrid.folders { grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); }
.igrid li { display: grid; justify-items: center; gap: 4px; }
.pair { display: flex; gap: 4px; }

/* How it's made */
.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 12px; counter-reset: step; }
.steps li { counter-increment: step; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 18px; display: grid; gap: 6px; align-content: start; }
.steps li::before { content: counter(step); display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--tint); color: var(--pink-ink); font: 700 13px/1 var(--f-body); }
.steps h3 { font-size: 17px; }
.steps p { color: var(--muted); font-size: 14px; }

/* Install */
.install { display: grid; gap: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: clamp(20px, 3vw, 28px); }
.install p { color: var(--muted); }
.cmd { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
.cmd pre { flex: 1 1 320px; min-width: 0; margin: 0; padding: 14px 16px; border-radius: 12px; background: var(--paper); border: 1px solid var(--line); overflow-x: auto; font: 14px/1.4 var(--f-mono); }
.install ol { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--muted); }
.install ol b { color: var(--ink); font-weight: 600; }
kbd { font: 12px/1 var(--f-mono); padding: 3px 6px; border-radius: 6px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); }

footer { margin-top: 56px; padding-block: 24px 40px; border-top: 1px solid var(--line); color: var(--muted); font-size: 14px; display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between; }
footer a { color: var(--muted); }

/* Tablet */
@media (max-width: 860px) {
  .head { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .hero { grid-template-columns: 1fr; padding-block-end: 0; }
  .hero-text { padding-bottom: 0; }
  .hero-art { max-width: 260px; }
}

/* Phone */
@media (max-width: 640px) {
  .actions .cta { flex: 1 1 100%; }
  .segs { width: 100%; }
  .seg { flex: 1 1 calc(50% - 4px); justify-content: center; }
  .stage { overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; scrollbar-width: thin; }
  .stage .win { width: 900px; grid-template-columns: minmax(0, 1fr); }
  .stage .act, .stage .side { display: none; }
  .hint { display: block; }
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
    <div class="hero-text">
      <h1>Rika Unicorn</h1>
      <p class="sub">A soft, pastel color theme and file icon set for Visual Studio Code.</p>
      <ul class="meta">
        <li><b>${stats.themes}</b> color themes</li>
        <li><b>${stats.icons}</b> icons</li>
        <li><b>${stats.languages}</b> languages</li>
        <li>Free</li>
      </ul>
      <div class="actions">
        <a class="cta primary" href="${marketplaceUrl}">Install</a>
        ${repoUrl ? `<a class="cta secondary" href="${repoUrl}">View on GitHub</a>` : ''}
      </div>
    </div>
    <img class="hero-art" src="data:image/webp;base64,${heroArt}" width="562" height="720" alt="A white unicorn with a pink and purple mane full of flowers">
  </header>

  <section class="block" aria-labelledby="themes-h">
    ${sectionHead('themes-h', 'Four themes', 'Two light and two dark, all from the same palette. Pick one to preview it.')}
    <div class="picker">
      <div class="segs" role="tablist" aria-label="Color themes">${tabs}</div>
      ${descs}
    </div>
    <div class="frame"><div class="stage" id="stage" role="tabpanel" aria-label="Preview of the selected theme">${windows}</div></div>
    <p class="hint">Swipe sideways to see the whole editor.</p>
  </section>

  <section class="block" aria-labelledby="palette-h">
    ${sectionHead('palette-h', 'Palette', `Every color comes from the artwork: the mane, the horn, the flowers, the butterfly and the card. ${stats.colors} colors in total.`)}
    <div class="pgroups">${groups}</div>
  </section>

  <section class="block" aria-labelledby="code-h">
    ${sectionHead('code-h', 'Readable code', 'Each syntax color is checked against its background: at least 4.5:1 for code and 3:1 for comments (WCAG).')}
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">Role</th>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="hint">Swipe the table to compare all ${stats.themes} themes.</p>
  </section>

  <section class="block" aria-labelledby="icons-h">
    ${sectionHead('icons-h', 'File icons', 'Each language gets a flower, tulip, butterfly or star in its usual colors. Folders get a color and a sticker.')}
    <div class="ipanels">
      ${iconPanel(variants[0], 'On a dark theme')}
      ${iconPanel(variants[1], 'On a light theme')}
    </div>
  </section>

  <section class="block" aria-labelledby="build-h">
    ${sectionHead('build-h', 'How it’s made', 'Everything is generated from code, so one change to the palette updates every theme, icon and screenshot.')}
    <ol class="steps">
      <li><h3>Sample</h3><p>Pillow pulls a ${stats.colors}-color palette out of the artwork.</p></li>
      <li><h3>Generate</h3><p>One file writes ${stats.uiKeys} UI colors and ${stats.rules} syntax rules per theme.</p></li>
      <li><h3>Draw</h3><p>Nine SVG motifs become ${stats.icons} file and folder icons.</p></li>
      <li><h3>Check</h3><p>The build flags any code color below the contrast target.</p></li>
      <li><h3>Package</h3><p>A small script zips it all into a .vsix.</p></li>
    </ol>
  </section>

  <section class="block" aria-labelledby="install-h">
    ${sectionHead('install-h', 'Install', 'Search for <b>Rika Unicorn</b> in the Extensions view (<kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>X</kbd>), or run this command.')}
    <div class="install">
      <div class="cmd"><pre id="cmd">${installCmd}</pre><button type="button" class="cta primary" id="copy">Copy</button></div>
      <ol>
        <li>Choose a theme: <kbd>Ctrl</kbd> <kbd>K</kbd> then <kbd>Ctrl</kbd> <kbd>T</kbd>, and pick <b>Rika Unicorn Dark</b>, <b>Light</b>, <b>Butterfly Sky</b> or <b>Sweet Teal</b>.</li>
        <li>Turn on the icons: <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>P</kbd>, then <b>File Icon Theme</b>, then <b>Rika Unicorn Icons</b>.</li>
      </ol>
      ${releaseUrl ? `<p>Prefer a file? <a href="${releaseUrl}">Download the .vsix from GitHub</a>.</p>` : ''}
    </div>
  </section>

  <footer>
    <span>Rika Unicorn Theme · v${pkg.version}</span>
    ${author.url ? `<span>Made by <a href="${author.url}">${author.name ?? author.url}</a></span>` : ''}
    <span><a href="${marketplaceUrl}">Marketplace</a>${repoUrl ? ` · <a href="${repoUrl}">GitHub</a>` : ''}</span>
  </footer>
</div>
<script>
(() => {
  const stage = document.getElementById('stage');
  // Scale the 1240px-wide mock editor to the stage. On phones the CSS narrows it to
  // the editor only; it keeps a readable minimum scale and scrolls sideways.
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
  const show = (id) => {
    document.querySelectorAll('[data-theme-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.themeTab === id)));
    stage.querySelectorAll('section.theme').forEach((s) => { s.hidden = s.id !== id; });
    document.querySelectorAll('[data-desc]').forEach((d) => { d.hidden = d.dataset.desc !== id; });
    stage.setAttribute('aria-labelledby', 'tab-' + id);
    fit();
  };
  document.querySelectorAll('[data-theme-tab]').forEach((t) => t.addEventListener('click', () => show(t.dataset.themeTab)));
  if (phone.addEventListener) phone.addEventListener('change', fit);
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

  // Every link opens in a new tab
  const body = bodyHtml.replace(/<a (?![^>]*target=)/g, '<a target="_blank" rel="noopener" ');
  return { head: headHtml, body };
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
