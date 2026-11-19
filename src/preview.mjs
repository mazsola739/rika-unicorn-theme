// Preview: a VS Code-like window for each theme + an icon gallery.
// The build writes it to: preview/index.html

import { variants, buildTheme, rainbow, palette } from './themes.mjs';
import { fileIcons, folderStyles } from './icons.mjs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// «role:text» markup → colored span. Unmarked text = variable color.
const SAMPLE = [
  "«kw:import» «pun:{» useState «pun:}» «kw:from» «str:'react'»«pun:;»",
  "«kw:import» «kw:type» «pun:{» «ty:Unicorn» «pun:}» «kw:from» «str:'./types'»«pun:;»",
  '',
  '«com:// A little magic every day ✨»',
  "«kw:const» «con:COLORS» «op:=» «pun:[»«str:'pink'»«pun:,» «str:'lilac'»«pun:,» «str:'gold'»«pun:]» «kw:as» «kw:const»«pun:;»",
  '',
  '«dec:@sparkle»«pun:()»',
  '«kw:export» «kw:class» «ty+sel:Meadow»«pun:<»«ty:T» «kw:extends» «ty:Unicorn»«pun:>» «pun:{»',
  '  «kw:private» «prop:flowers» «op:=» «num:42»«pun:;»',
  '',
  '  «kw:constructor»«pun:(»«kw:public» «kw:readonly» «par:name»«pun::» «bi:string»«pun:)» «pun:{}»',
  '',
  '  «fn:bloom»«pun:(»«par:count»«pun::» «bi:number» «op:=» «num:3»«pun:)»«pun::» «bi:string» «pun:{»',
  '    «kw:const» petals «op:=» «self:this»«pun:.»«prop:flowers» «op:*» «par:count»«pun:;»',
  '    «kw:return» «str:`🌸 »«kw:${»«self:this»«pun:.»«prop:name»«kw:}»«str: has »«kw:${»petals«kw:}»«str: petals!»«esc:\\n»«str:`»«pun:;»',
  '  «pun:}»',
  '«pun:}»',
  '',
  '«kw:export» «kw:function» «fn:App»«pun:({» «par:title» «pun:}»«pun::» «pun:{» «prop:title»«pun::» «bi:string» «pun:})» «pun:{»',
  '  «kw:const» «pun:[»happy«pun:,» setHappy«pun:]» «op:=» «fn:useState»«pun:(»«con:true»«pun:)»«pun:;»',
  '  «kw:if» «pun:(»«op:!»happy«pun:)» «kw:return» «con:null»«pun:;»',
  '  «kw:return» «tp:<»«tag:div» «attr:className»«op:=»«str:"sweet"» «attr:onClick»«op:=»«pun:{()» «kw:=>» «fn:setHappy»«pun:(»«con:false»«pun:)}»«tp:>»«pun:{»title«pun:}»«tp:</»«tag:div»«tp:>»«pun:;»',
  '«pun:}»',
];
const CURRENT_LINE = 14;

const TERMINAL = [
  '«green:➜» «cyan:rika-project» «magenta:git:(»«red:main»«magenta:)» npm run build',
  '«brightBlack:> rika-unicorn-theme build»',
  `«green:✔» ${variants.length} color themes ready`,
  '«green:✔» all icons in bloom',
  '«yellow:⚠» 1 butterfly flew away',
  '«blue:ℹ» rainbow: «magenta:♥» «yellow:♥» «blue:♥» «cyan:♥» «green:♥» «red:♥»',
];

const ROLE = {
  kw: ['keyword'], op: ['operator'], fn: ['func'], ty: ['type'], bi: ['builtin'], str: ['string'],
  num: ['number'], con: ['constant'], self: ['self', 'italic'], prop: ['property'], par: ['param', 'italic'],
  tag: ['tag'], attr: ['attr', 'italic'], dec: ['decorator'], esc: ['escape'], com: ['comment', 'italic'],
  pun: ['punct'], tp: ['punct'],
};

function renderCode(v) {
  const s = v.syntax;
  const rb = rainbow(s);
  let depth = 0;
  const span = (text, color, italic, sel) =>
    `<span style="color:${color}${italic ? ';font-style:italic' : ''}${sel ? `;background:${v.ui.selection}` : ''}">${esc(text)}</span>`;

  return SAMPLE.map((line, i) => {
    let html = '';
    let last = 0;
    for (const m of line.matchAll(/«([\w+]+):(.*?)»/g)) {
      if (m.index > last) html += span(line.slice(last, m.index), s.variable);
      const [role, sel] = m[1].split('+');
      const [key, style] = ROLE[role];
      if (role === 'pun') {
        for (const ch of m[2]) {
          if ('([{'.includes(ch)) html += span(ch, rb[depth++ % 6]);
          else if (')]}'.includes(ch)) html += span(ch, rb[--depth % 6]);
          else html += span(ch, s[key]);
        }
      } else {
        html += span(m[2], s[key], style === 'italic', sel);
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) html += span(line.slice(last), s.variable);
    const n = i + 1;
    const cur = n === CURRENT_LINE;
    const cursor = cur ? `<span class="cursor" style="background:${v.ui.cursor}"></span>` : '';
    return `<div class="line${cur ? ' cur' : ''}"><span class="ln">${n}</span><span class="code">${html}${cursor}</span></div>`;
  }).join('');
}

function renderTerminal(v) {
  return TERMINAL.map((line) => {
    let html = '';
    let last = 0;
    for (const m of line.matchAll(/«(\w+):(.*?)»/g)) {
      if (m.index > last) html += esc(line.slice(last, m.index));
      html += `<span style="color:${v.ansi[m[1]]}">${esc(m[2])}</span>`;
      last = m.index + m[0].length;
    }
    html += esc(line.slice(last));
    return `<div>${html}</div>`;
  }).join('') + `<div><span style="color:${v.ansi.green}">➜</span> <span style="color:${v.ansi.cyan}">rika-project</span> <span class="tcursor" style="background:${v.ui.cursor}"></span></div>`;
}

const TREE = [
  { d: 0, name: 'src', folder: 'src', open: true },
  { d: 1, name: 'components', folder: 'components' },
  { d: 1, name: 'styles', folder: 'styles' },
  { d: 1, name: 'App.tsx', icon: 'tsx', active: true, git: 'M' },
  { d: 1, name: 'App.test.tsx', icon: 'test' },
  { d: 1, name: 'index.ts', icon: 'typescript' },
  { d: 1, name: 'main.js', icon: 'javascript' },
  { d: 1, name: 'theme.scss', icon: 'scss', git: 'U' },
  { d: 0, name: 'assets', folder: 'assets' },
  { d: 0, name: 'docs', folder: 'docs' },
  { d: 0, name: 'tests', folder: 'test' },
  { d: 0, name: '.vscode', folder: 'config' },
  { d: 0, name: '.github', folder: 'git' },
  { d: 0, name: 'dist', folder: 'dist', git: 'I' },
  { d: 0, name: 'node_modules', folder: 'modules', git: 'I' },
  { d: 0, name: 'notes', folder: 'default' },
  { d: 0, name: '.gitignore', icon: 'git' },
  { d: 0, name: 'app.py', icon: 'python' },
  { d: 0, name: 'data.json', icon: 'json' },
  { d: 0, name: 'index.html', icon: 'html' },
  { d: 0, name: 'LICENSE', icon: 'license' },
  { d: 0, name: 'package.json', icon: 'npm' },
  { d: 0, name: 'README.md', icon: 'readme', git: 'M' },
  { d: 0, name: 'unicorn.png', icon: 'image', git: 'A' },
];

const GIT = { M: 'gitDecoration.modifiedResourceForeground', U: 'gitDecoration.untrackedResourceForeground', A: 'gitDecoration.addedResourceForeground', I: 'gitDecoration.ignoredResourceForeground' };

const ACT_ICONS = [
  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>',
  '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-6 3-11 8"/>',
  '<path d="M7 4.5v15l12-7.5z"/>',
  '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1" transform="rotate(15 16.5 7.5)"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
];

/** One mock VS Code window. `icon(id)` renders a 16px icon (an <img> here, a CSS sprite on the showcase site). */
export function windowHtml(v, icon = (id) => `<img class="fi" src="../icons/${id}.svg" alt="">`) {
  const th = buildTheme(v);
  const c = th.colors;
  const rows = TREE.map((r) => {
    const img = r.folder ? icon(`folder-${r.folder}${r.open ? '-open' : ''}`) : icon(`file-${r.icon}`);
    const chev = r.folder ? `<span class="chev">${r.open ? '⌄' : '›'}</span>` : '<span class="chev"></span>';
    const color = r.git ? c[GIT[r.git]] : null;
    const badge = r.git && r.git !== 'I' ? `<span class="g" style="color:${color}">${r.git}</span>` : '';
    const style = [
      r.active && `background:${c['list.activeSelectionBackground']};outline:1px solid ${c['list.focusAndSelectionOutline']};outline-offset:-1px`,
      color && `color:${color}`,
    ].filter(Boolean).join(';');
    return `<div class="row" style="padding-left:${10 + r.d * 14}px;${style}">${chev}${img}<span>${r.name}</span>${badge}</div>`;
  }).join('');

  const act = ACT_ICONS.map((p, i) =>
    `<div class="ic" style="color:${i === 0 ? c['activityBar.foreground'] : c['activityBar.inactiveForeground']};${i === 0 ? `box-shadow:inset 2px 0 0 ${c['activityBar.activeBorder']}` : ''}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${p}</svg>${i === 2 ? `<b class="abadge" style="background:${c['activityBarBadge.background']};color:${c['activityBarBadge.foreground']}">3</b>` : ''}</div>`).join('');

  const tab = (id, name, on, dirty) =>
    `<div class="tab" style="background:${on ? c['tab.activeBackground'] : c['tab.inactiveBackground']};color:${on ? c['tab.activeForeground'] : c['tab.inactiveForeground']};border-right:1px solid ${c['tab.border']};${on ? `box-shadow:inset 0 2px 0 ${c['tab.activeBorderTop']}` : `border-bottom:1px solid ${c['editorGroupHeader.tabsBorder']}`}">${icon(`file-${id}`)}<span>${name}</span><span class="x">${dirty ? '●' : on ? '×' : ''}</span></div>`;

  return `
<section class="theme" id="${v.id}">
  <h2>${v.label} <small>${v.type === 'light' ? 'light' : 'dark'}</small></h2>
  <div class="win" style="color:${c.foreground}">
    <div class="title" style="background:${c['titleBar.activeBackground']};color:${c['titleBar.activeForeground']};border-bottom:1px solid ${c['titleBar.border']}">
      <span class="logo">${icon('file-readme')}</span>
      <span class="menu" style="color:${c['titleBar.inactiveForeground']}">File&nbsp;&nbsp;Edit&nbsp;&nbsp;Selection&nbsp;&nbsp;View&nbsp;&nbsp;Go&nbsp;&nbsp;Run&nbsp;&nbsp;…</span>
      <span class="cc" style="background:${c['commandCenter.background']};border:1px solid ${c['commandCenter.border']};color:${c['commandCenter.foreground']}">⌕&nbsp; rika-project</span>
      <span class="wc">—&nbsp;&nbsp;&nbsp;▢&nbsp;&nbsp;&nbsp;✕</span>
    </div>
    <div class="act" style="background:${c['activityBar.background']};border-right:1px solid ${c['activityBar.border']}">${act}</div>
    <div class="side" style="background:${c['sideBar.background']};color:${c['sideBar.foreground']};border-right:1px solid ${c['sideBar.border']}">
      <div class="stitle" style="color:${c['sideBarTitle.foreground']}">EXPLORER</div>
      <div class="shead" style="color:${c['sideBarSectionHeader.foreground']}">⌄ RIKA-PROJECT</div>
      ${rows}
    </div>
    <div class="main">
      <div class="tabs" style="background:${c['editorGroupHeader.tabsBackground']}">${tab('tsx', 'App.tsx', true)}${tab('scss', 'theme.scss', false, true)}${tab('readme', 'README.md', false)}<div class="tabfill" style="border-bottom:1px solid ${c['editorGroupHeader.tabsBorder']}"></div></div>
      <div class="crumbs" style="background:${c['editor.background']};color:${c['breadcrumb.foreground']}">src › ${icon('file-tsx')} App.tsx › <span style="color:${v.syntax.type}">Meadow</span> › <span style="color:${c['breadcrumb.focusForeground']}">bloom</span></div>
      <div class="editor" style="background:${c['editor.background']};--lh:${c['editor.lineHighlightBackground']};--ln:${c['editorLineNumber.foreground']};--lna:${c['editorLineNumber.activeForeground']}">${renderCode(v)}</div>
      <div class="panel" style="background:${c['panel.background']};border-top:1px solid ${c['panel.border']}">
        <div class="ptabs" style="color:${c['panelTitle.inactiveForeground']}">
          <span>PROBLEMS <b class="pbadge" style="background:${c['badge.background']};color:${c['badge.foreground']}">1</b></span><span>OUTPUT</span>
          <span class="on" style="color:${c['panelTitle.activeForeground']};border-bottom:1px solid ${c['panelTitle.activeBorder']}">TERMINAL</span>
          <span class="btn" style="background:${c['button.background']};color:${c['button.foreground']}">Button</span>
          <span class="btn" style="background:${c['button.secondaryBackground']};color:${c['button.secondaryForeground']}">Secondary</span>
        </div>
        <div class="term" style="color:${c['terminal.foreground']};background:${c['terminal.background']}">${renderTerminal(v)}</div>
      </div>
    </div>
    <div class="status" style="background:${c['statusBar.background']};color:${c['statusBar.foreground']}">
      <span class="remote" style="background:${c['statusBarItem.remoteBackground']};color:${c['statusBarItem.remoteForeground']}">&gt;&lt;</span>
      <span>⎇ main*</span><span>⊗ 0&nbsp; ⚠ 1</span>
      <span class="right"><span>Ln 14, Col 52</span><span>Spaces: 2</span><span>UTF-8</span><span>{ } TypeScript JSX</span></span>
    </div>
  </div>
</section>`;
}

function gallery(bg, fg, title) {
  const fileCards = Object.keys(fileIcons).map((id) =>
    `<figure><div><img src="../icons/file-${id}.svg" width="32" height="32" alt=""><img src="../icons/file-${id}.svg" width="16" height="16" alt=""></div><figcaption>${id}</figcaption></figure>`).join('');
  const folderCards = Object.keys(folderStyles).map((id) =>
    `<figure><div><img src="../icons/folder-${id}.svg" width="32" height="32" alt=""><img src="../icons/folder-${id}-open.svg" width="32" height="32" alt=""><img src="../icons/folder-${id}.svg" width="16" height="16" alt=""></div><figcaption>${id}</figcaption></figure>`).join('');
  return `<div class="gal" style="background:${bg};color:${fg}"><h3>${title} – folders</h3><div class="grid">${folderCards}</div><h3>${title} – files</h3><div class="grid">${fileCards}</div></div>`;
}

/** CSS for windowHtml(), shared by the preview and the showcase site */
export const WINDOW_CSS = `
  .win { display: grid; grid-template-columns: 48px 250px minmax(0, 1fr); grid-template-rows: 34px 1fr 22px; height: 760px;
         border-radius: 12px; overflow: hidden; font-size: 13px; box-shadow: 0 24px 60px -20px #36246E66, 0 0 0 1px #36246E1F; }
  .title { grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; padding: 0 12px; font-size: 12.5px; }
  .title .logo .fi { width: 18px; height: 18px; display: block; }
  .title .cc { margin: 0 auto; width: 38%; text-align: center; border-radius: 6px; padding: 2px 0; font-size: 12px; }
  .title .wc { opacity: .8; letter-spacing: 1px; }
  .act { display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
  .act .ic { width: 48px; height: 46px; display: grid; place-items: center; position: relative; }
  .abadge { position: absolute; right: 7px; bottom: 7px; font-size: 9px; min-width: 15px; height: 15px; border-radius: 8px; display: grid; place-items: center; }
  .side { overflow: hidden; }
  .stitle { font-size: 11px; letter-spacing: .5px; padding: 10px 20px 8px; }
  .shead { font-size: 11px; font-weight: 700; padding: 2px 8px 4px; }
  .row { height: 22px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .row .fi { width: 16px; height: 16px; flex: none; }
  .row .chev { width: 10px; text-align: center; opacity: .8; flex: none; }
  .row .g { margin-left: auto; padding-right: 14px; font-size: 11px; }
  .main { display: grid; grid-template-rows: 35px 22px minmax(0, 1fr) 190px; min-width: 0; }
  .tabs { display: flex; min-width: 0; }
  .tab { display: flex; align-items: center; gap: 6px; padding: 0 10px 0 12px; white-space: nowrap; }
  .tab .fi { width: 16px; height: 16px; } .tab .x { width: 16px; text-align: center; }
  .tabfill { flex: 1; }
  .crumbs { display: flex; align-items: center; gap: 5px; padding-left: 16px; font-size: 12px; }
  .crumbs .fi { width: 14px; height: 14px; }
  .editor { font: 13.5px/20px 'Cascadia Code', 'Cascadia Mono', Consolas, monospace; overflow: hidden; padding-top: 4px; }
  .line { display: flex; height: 20px; }
  .line.cur { background: var(--lh); }
  .ln { width: 58px; flex: none; text-align: right; padding-right: 24px; color: var(--ln); }
  .line.cur .ln { color: var(--lna); }
  .code { white-space: pre; }
  .cursor { display: inline-block; width: 2px; height: 18px; vertical-align: -4px; }
  .panel { display: grid; grid-template-rows: 34px 1fr; min-height: 0; }
  .ptabs { display: flex; align-items: center; gap: 20px; padding: 0 16px; font-size: 11px; letter-spacing: .3px; }
  .ptabs .on { padding: 7px 0 6px; }
  .pbadge { font-size: 10px; border-radius: 9px; padding: 1px 6px; margin-left: 4px; }
  .ptabs .btn { margin-left: 0; padding: 3px 12px; border-radius: 4px; font-size: 12px; letter-spacing: 0; }
  .ptabs .btn:first-of-type { margin-left: auto; }
  .term { font: 13px/19px 'Cascadia Code', 'Cascadia Mono', Consolas, monospace; padding: 4px 16px; white-space: pre; overflow: hidden; }
  .tcursor { display: inline-block; width: 8px; height: 15px; vertical-align: -2px; }
  .status { grid-column: 1 / -1; display: flex; align-items: center; gap: 16px; font-size: 12px; padding-right: 12px; }
  .status .remote { height: 100%; display: flex; align-items: center; padding: 0 10px; font-weight: 700; }
  .status .right { margin-left: auto; display: flex; gap: 16px; }
`;

export function previewHtml() {
  const swatches = Object.entries(palette).map(([k, hex]) =>
    `<span class="sw"><i style="background:${hex}"></i>${k}<br><code>${hex}</code></span>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rika Unicorn Preview</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 32px 60px; font: 14px/1.5 'Segoe UI', system-ui, sans-serif; color: #3B2A5E;
         background: linear-gradient(160deg, #FFF5FA 0%, #F6ECFB 55%, #EAF6F7 100%); min-height: 100vh; }
  h1 { margin: 0 0 4px; font-size: 30px; letter-spacing: -.5px; }
  h1 span { background: linear-gradient(90deg, #F0296C, #914BB0 55%, #36246E); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .lead { margin: 0 0 18px; color: #6E5A8F; }
  .pal { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px; }
  .sw { font-size: 11px; color: #6E5A8F; width: 74px; line-height: 1.3; }
  .sw i { display: block; height: 30px; border-radius: 8px; margin-bottom: 4px; box-shadow: inset 0 0 0 1px #0000001A; }
  .sw code { font-size: 10px; }
  h2 { font-size: 18px; margin: 34px 0 10px; } h2 small { font-weight: 400; color: #8C79A8; font-size: 13px; }
${WINDOW_CSS}  .gals { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
  .gal { border-radius: 12px; padding: 4px 18px 18px; box-shadow: 0 0 0 1px #36246E1F; }
  .gal h3 { font-size: 13px; font-weight: 600; margin: 14px 0 10px; opacity: .85; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px 8px; }
  figure { margin: 0; text-align: center; }
  figure div { display: flex; gap: 6px; justify-content: center; align-items: center; height: 36px; }
  figcaption { font-size: 11px; opacity: .75; }
  @media (max-width: 1100px) { .gals { grid-template-columns: 1fr; } }
  body.only { padding: 12px; min-height: 0; }
  body.only .gals { margin-top: 0; }
  body.only h2 { display: none; }
</style>
</head>
<body>
  <h1><span>Rika Unicorn</span> 🦄</h1>
  <p class="lead">Color themes + an icon theme for VS Code, in the colors of the mane, the flowers, the butterflies and the “You are sweet.” card.</p>
  <div class="pal">${swatches}</div>
  ${variants.map((v) => windowHtml(v)).join('\n')}
  <h2>Icons <small>at 32 px and at the real 16 px size</small></h2>
  <div class="gals" id="icons">
    ${gallery(variants[0].ui.bgSide, variants[0].ui.fg, 'On dark')}
    ${gallery(variants[1].ui.bgSide, variants[1].ui.fg, 'On light')}
  </div>
<script>
  // ?only=<section id> shows a single window (used for screenshots)
  const only = new URLSearchParams(location.search).get('only');
  if (only) {
    document.body.classList.add('only');
    for (const el of document.body.children) if (el.id !== only && el.tagName !== 'SCRIPT') {
      const inner = el.querySelector('#' + only);
      if (inner) { for (const c of el.children) if (c !== inner) c.style.display = 'none'; el.style.margin = '0'; }
      else el.style.display = 'none';
    }
  }
</script>
</body>
</html>
`;
}
