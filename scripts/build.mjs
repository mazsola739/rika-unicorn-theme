// npm run build
// Generates themes/*.json, icons/*.svg, icons/rika-icon-theme.json and preview/index.html,
// then prints a contrast report (WCAG ratio against the background).

import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { variants, buildTheme } from '../src/themes.mjs';
import { buildIcons } from '../src/icons.mjs';
import { previewHtml } from '../src/preview.mjs';
import { siteHtml } from '../src/site.mjs';

const root = new URL('../', import.meta.url);
const at = (p) => new URL(p, root);
const json = (o) => JSON.stringify(o, null, 2) + '\n';

// --- Color themes ---
mkdirSync(at('themes/'), { recursive: true });
for (const v of variants) {
  writeFileSync(at(`themes/${v.id}-color-theme.json`), json(buildTheme(v)));
}

// --- Icons ---
mkdirSync(at('icons/'), { recursive: true });
for (const f of readdirSync(at('icons/'))) if (f.endsWith('.svg')) rmSync(at(`icons/${f}`));
const { files, theme } = buildIcons();
for (const [name, content] of Object.entries(files)) writeFileSync(at(`icons/${name}`), content);
writeFileSync(at('icons/rika-icon-theme.json'), json(theme));

// Does every referenced icon exist?
const refs = [theme.file, theme.folder, theme.folderExpanded, theme.rootFolder, theme.rootFolderExpanded,
  ...['folderNames', 'folderNamesExpanded', 'fileExtensions', 'fileNames', 'languageIds'].flatMap((k) => Object.values(theme[k]))];
const missing = [...new Set(refs)].filter((r) => !theme.iconDefinitions[r] || !existsSync(at(`icons/${theme.iconDefinitions[r].iconPath.slice(2)}`)));
if (missing.length) {
  console.error('Missing icons:', missing);
  process.exit(1);
}

// --- Preview + portfolio showcase page ---
mkdirSync(at('preview/'), { recursive: true });
writeFileSync(at('preview/index.html'), previewHtml());
mkdirSync(at('site/'), { recursive: true });
writeFileSync(at('site/index.html'), siteHtml());

// --- Contrast check ---
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let warnings = 0;
for (const v of variants) {
  const { ui, syntax } = v;
  const checks = [
    ...Object.entries(syntax).map(([k, col]) => [`code: ${k}`, col, ui.bg, ['comment', 'punct'].includes(k) ? 3 : 4.5]),
    ['text / side bar', ui.fg, ui.bgSide, 7],
    ['muted text / side bar', ui.fgMuted, ui.bgSide, 4.5],
    ['inactive / side bar', ui.fgDim, ui.bgSide, 2.5],
    ['status bar', ui.statusFg, ui.statusBg, 4.5],
    ['button', ui.onAccent, ui.accentBg, 4.5],
    ['badge', ui.badgeFg, ui.badgeBg, 4.5],
    ['accent / side bar', ui.accent, ui.bgSide, 4.5],
    ['line number', ui.lineNumber, ui.bg, 2],
  ];
  const bad = checks
    .map(([name, fg, bg, min]) => ({ name, r: ratio(fg, bg), min }))
    .filter((c) => c.r < c.min);
  const worst = Math.min(...Object.values(syntax).map((col) => ratio(col, ui.bg)));
  console.log(`✔ ${v.label.padEnd(20)} lowest code contrast: ${worst.toFixed(2)}:1`);
  for (const b of bad) {
    warnings++;
    console.log(`   ⚠ ${b.name}: ${b.r.toFixed(2)}:1 (min ${b.min}:1)`);
  }
}
console.log(`✔ ${Object.keys(files).length} icons, ${Object.keys(theme.languageIds).length} languages, ${Object.keys(theme.fileExtensions).length} extensions, ${Object.keys(theme.fileNames).length} file names, ${Object.keys(theme.folderNames).length} folder names`);
console.log(warnings ? `${warnings} contrast warning(s)` : '✔ all contrast checks passed');
