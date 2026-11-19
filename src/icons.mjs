// Rika Unicorn icons – every icon is a 32×32 SVG built from these motifs:
// flower, daisy, tulip, butterfly, star, sparkle, heart, leaf, unicorn.
// Run:  npm run build   → icons/*.svg + icons/rika-icon-theme.json

const f = (n) => +n.toFixed(2);
const OUTLINE = '#DCC6E6'; // soft outline for white parts (so they stay visible on light themes)
const INK = '#3A2257';

export const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;

const sparklePath = (cx, cy, R) => {
  const a = 0.09 * R;
  const b = 0.32 * R;
  return `M${f(cx)} ${f(cy - R)}C${f(cx + a)} ${f(cy - b)} ${f(cx + b)} ${f(cy - a)} ${f(cx + R)} ${f(cy)}` +
    `C${f(cx + b)} ${f(cy + a)} ${f(cx + a)} ${f(cy + b)} ${f(cx)} ${f(cy + R)}` +
    `C${f(cx - a)} ${f(cy + b)} ${f(cx - b)} ${f(cy + a)} ${f(cx - R)} ${f(cy)}` +
    `C${f(cx - b)} ${f(cy - a)} ${f(cx - a)} ${f(cy - b)} ${f(cx)} ${f(cy - R)}Z`;
};

const starPoints = (cx, cy, R, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const ang = ((-90 + 36 * i) * Math.PI) / 180;
    const rad = i % 2 ? r : R;
    return `${f(cx + rad * Math.cos(ang))},${f(cy + rad * Math.sin(ang))}`;
  }).join(' ');

/** Motifs – each returns the inner markup of a 32×32 drawing */
export const motifs = {
  /** Round five-petal flower (like the yellow / red / blue / orange flowers) */
  flower({ petal, center = '#FFFFFF', edge }) {
    const petals = [0, 1, 2, 3, 4]
      .map((k) => {
        const a = ((-90 + 72 * k) * Math.PI) / 180;
        return `<circle cx="${f(16 + 7.3 * Math.cos(a))}" cy="${f(16.6 + 7.3 * Math.sin(a))}" r="6.3"/>`;
      })
      .join('');
    const outline = edge ? `<g fill="${edge}" stroke="${edge}" stroke-width="1.6">${petals}</g>` : '';
    const cEdge = center.toUpperCase() === '#FFFFFF' ? ` stroke="${OUTLINE}" stroke-width=".6"` : '';
    return `${outline}<g fill="${petal}">${petals}</g>` +
      `<circle cx="16" cy="16.6" r="4.3" fill="${center}"${cEdge}/>` +
      `<circle cx="14.7" cy="15.2" r="1.3" fill="#FFFFFF" opacity=".55"/>`;
  },

  /** Daisy – white petals, yellow center */
  daisy({ center = '#FCC012', petal = '#FFFFFF', edge = OUTLINE }) {
    const ps = Array.from({ length: 8 }, (_, k) =>
      `<ellipse cx="16" cy="8.3" rx="3.4" ry="5.9" transform="rotate(${k * 45} 16 16)"/>`).join('');
    return `<g fill="${edge}" stroke="${edge}" stroke-width="1.5">${ps}</g><g fill="${petal}">${ps}</g>` +
      `<circle cx="16" cy="16" r="4.6" fill="${center}"/><circle cx="14.8" cy="14.7" r="1.3" fill="#FFFFFF" opacity=".5"/>`;
  },

  /** Tulip with stem and leaf */
  tulip({ outer, inner, stem = '#7FB155', leaf = '#93C35A' }) {
    return `<path d="M16 21v8.2" stroke="${stem}" stroke-width="2.4" stroke-linecap="round" fill="none"/>` +
      `<path d="M16 27.6c1-3.6 4.6-5.6 8.6-5.2-1 3.8-4.6 5.6-8.6 5.2z" fill="${leaf}"/>` +
      `<path d="M8.6 13.6C8.6 8 11.6 4.4 16 2.8c4.4 1.6 7.4 5.2 7.4 10.8z" fill="${inner}"/>` +
      `<path d="M4.8 7.8c4.4 1.2 8.2 3.8 11.2 8.2 3-4.4 6.8-7 11.2-8.2 1 8.6-3 14.4-11.2 14.4S3.8 16.4 4.8 7.8z" fill="${outer}"/>` +
      `<path d="M8 12.2c1.6 2.8 3.4 4.6 5.6 5.8" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
  },

  /** Butterfly – separate colors for the upper and lower wings */
  butterfly({ top, bottom, topInner, bottomInner, spot = '#FFFFFF', body = '#4A2C6E', tip = '#F0296C' }) {
    return `<path d="M15.1 7.4C14.4 5 13 3.6 10.9 3.2M16.9 7.4c.7-2.4 2.1-3.8 4.2-4.2" stroke="${body}" stroke-width="1.3" stroke-linecap="round" fill="none"/>` +
      `<circle cx="10.6" cy="3.2" r="1.6" fill="${tip}"/><circle cx="21.4" cy="3.2" r="1.6" fill="${tip}"/>` +
      `<ellipse cx="9.3" cy="12.6" rx="7" ry="6.1" transform="rotate(-28 9.3 12.6)" fill="${top}"/>` +
      `<ellipse cx="22.7" cy="12.6" rx="7" ry="6.1" transform="rotate(28 22.7 12.6)" fill="${top}"/>` +
      `<ellipse cx="10.9" cy="22.5" rx="5.3" ry="5" transform="rotate(20 10.9 22.5)" fill="${bottom}"/>` +
      `<ellipse cx="21.1" cy="22.5" rx="5.3" ry="5" transform="rotate(-20 21.1 22.5)" fill="${bottom}"/>` +
      (topInner ? `<ellipse cx="10.2" cy="13" rx="4.2" ry="3.5" transform="rotate(-28 10.2 13)" fill="${topInner}"/><ellipse cx="21.8" cy="13" rx="4.2" ry="3.5" transform="rotate(28 21.8 13)" fill="${topInner}"/>` : '') +
      (bottomInner ? `<ellipse cx="11.3" cy="22.4" rx="3" ry="2.8" fill="${bottomInner}"/><ellipse cx="20.7" cy="22.4" rx="3" ry="2.8" fill="${bottomInner}"/>` : '') +
      `<circle cx="8.4" cy="11.6" r="1.7" fill="${spot}"/><circle cx="23.6" cy="11.6" r="1.7" fill="${spot}"/>` +
      `<circle cx="11.1" cy="23" r="1.3" fill="${spot}"/><circle cx="20.9" cy="23" r="1.3" fill="${spot}"/>` +
      `<rect x="14.5" y="9.6" width="3" height="15.6" rx="1.5" fill="${body}"/>` +
      `<circle cx="16" cy="8.8" r="2.5" fill="${body}"/>`;
  },

  /** Rounded five-point star */
  star({ fill, edge }) {
    return `<polygon points="${starPoints(16, 17.2, 12.2, 5.4)}" fill="${fill}" stroke="${edge || fill}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<ellipse cx="12.6" cy="13.6" rx="2" ry="1.2" transform="rotate(-35 12.6 13.6)" fill="#FFFFFF" opacity=".5"/>`;
  },

  /** Four-point sparkle + a smaller companion */
  sparkle({ fill, small }) {
    return `<path d="${sparklePath(13.5, 17.5, 11.5)}" fill="${fill}"/>` +
      `<path d="${sparklePath(25, 7, 5)}" fill="${small || fill}"/>` +
      `<circle cx="26" cy="25" r="1.8" fill="${small || fill}"/>`;
  },

  /** Heart */
  heart({ fill }) {
    return `<path d="M16 28C6.6 21.4 3 15.6 3 10.8 3 6.8 6 4 9.6 4c2.7 0 5 1.5 6.4 3.9C17.4 5.5 19.7 4 22.4 4 26 4 29 6.8 29 10.8c0 4.8-3.6 10.6-13 17.2z" fill="${fill}"/>` +
      `<ellipse cx="9.4" cy="10" rx="2.6" ry="1.6" transform="rotate(-40 9.4 10)" fill="#FFFFFF" opacity=".45"/>`;
  },

  /** Leaf with a vein */
  leaf({ fill, vein = '#FFFFFF' }) {
    return `<path d="M5 27.2C4.6 15.6 12 5.6 27.4 4.6c.6 15-9 23-22.4 22.6z" fill="${fill}"/>` +
      `<path d="M5.6 26.6C10.2 20 15.2 14.6 21.6 10.2" stroke="${vein}" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
  },

  /** Small unicorn head (for README files) */
  unicorn() {
    return `<path d="M15.6 6.2C22 4.4 27.6 8.4 28 14.6c.3 5.2 2.4 9.6-.8 15.2h-9.4c1.8-5.6 1.6-11.4-1-17.2z" fill="url(#rikaMane)"/>` +
      `<path d="M19.3 9.2c-4.4-1.8-9.3.2-11.6 3.8l-3.6 5.4c-1 1.5-.3 3.4 1.5 3.7 2 .3 4-.7 6-1.1 1.2 2.4 1.8 5.4 1.8 8.8h7.8c0-6.4 1.8-12.4-1.9-20.6z" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width=".9"/>` +
      `<path d="M17.4 10.4l2.6-7 1.4 7.6z" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width=".8" stroke-linejoin="round"/>` +
      `<path d="M18.6 9.6l1.3-3.6.7 3.9z" fill="#FB85AA"/>` +
      `<path d="M12.2 9.6L8.4 1.8l6.6 6.6z" fill="#FDC56B" stroke="#E9A23B" stroke-width=".6" stroke-linejoin="round"/>` +
      `<path d="M10.2 5.4l2.2-.8M11.4 7.6l2.4-.9" stroke="#FFFFFF" stroke-width=".9" stroke-linecap="round"/>` +
      `<path d="M13.4 8.4c1.6-1.8 3.8-2 5.2-.6-1.4.2-2.4 1-3 2.2z" fill="#F0296C"/>` +
      `<path d="M10.6 14.4c.9 1 2.1 1 3 0" stroke="${INK}" stroke-width=".9" stroke-linecap="round" fill="none"/>` +
      `<circle cx="14" cy="17.4" r="1.7" fill="#FB85AA" opacity=".6"/>` +
      `<circle cx="6.3" cy="19.4" r=".6" fill="${INK}"/>`;
  },

  /** Default file: a page with a pink folded corner and a sparkle */
  page({ accent = '#F0296C', paper = '#FFF7FB', edge = '#E7A6C7' }) {
    return `<path d="M8 2.5h11l7.5 7.5v17a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 27V5A2.5 2.5 0 0 1 8 2.5z" fill="${paper}" stroke="${edge}" stroke-width="1.2"/>` +
      `<path d="M19 2.5V8a2 2 0 0 0 2 2h5.5z" fill="#F7C6DA" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="${sparklePath(15.5, 19.5, 6)}" fill="${accent}"/>`;
  },
};

const MANE_GRADIENT = `<linearGradient id="rikaMane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0296C"/><stop offset=".5" stop-color="#914BB0"/><stop offset="1" stop-color="#36246E"/></linearGradient>`;

const draw = ([motif, opts = {}]) => motifs[motif](opts);
const needsDefs = ([motif]) => (motif === 'unicorn' ? MANE_GRADIENT : '');

/** Folder (closed / open) with a small sticker in the middle */
function folder({ main, shade, emblem, open }) {
  const emb = emblem
    ? `<g transform="translate(${open ? '9.6 13.4' : '8.3 11.5'}) scale(${open ? 0.46 : 0.48})">${draw(emblem)}</g>`
    : '';
  if (!open) {
    return `<path d="M2.5 8A2.5 2.5 0 0 1 5 5.5h6.6c.7 0 1.3.3 1.8.8L15.6 9H27a2.5 2.5 0 0 1 2.5 2.5V25a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 25z" fill="${shade}"/>` +
      `<path d="M2.5 12.5A1.5 1.5 0 0 1 4 11h24a1.5 1.5 0 0 1 1.5 1.5V25a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 25z" fill="${main}"/>` +
      emb;
  }
  return `<path d="M2.5 8A2.5 2.5 0 0 1 5 5.5h6.6c.7 0 1.3.3 1.8.8L15.6 9H25a2.5 2.5 0 0 1 2.5 2.5V13H9.4c-1.1 0-2.1.7-2.4 1.8L2.5 25z" fill="${shade}"/>` +
    `<path d="M7.6 14.8c.3-1.1 1.3-1.8 2.4-1.8h18.9c1.3 0 2.3 1.3 1.9 2.6l-2.7 10.1c-.3 1.1-1.3 1.8-2.4 1.8H4.5c-1.3 0-2.3-1.3-1.9-2.6z" fill="${main}"/>` +
    emb;
}

// ---------------------------------------------------------------------------
// File icons: id → [motif, options]
// ---------------------------------------------------------------------------
export const fileIcons = {
  file: ['page', {}],
  javascript: ['flower', { petal: '#FCC012', center: '#EE2440' }],
  typescript: ['flower', { petal: '#2F6FB8', center: '#FB85AA' }],
  jsx: ['butterfly', { top: '#FCC012', bottom: '#F0296C', topInner: '#FCE08B', bottomInner: '#FB85AA', tip: '#F0296C' }],
  tsx: ['butterfly', { top: '#3D96DE', bottom: '#914BB0', topInner: '#8BD7F9', bottomInner: '#C48BE0', tip: '#FCC012' }],
  json: ['star', { fill: '#FCC012' }],
  markdown: ['tulip', { outer: '#F0296C', inner: '#FB85AA' }],
  readme: ['unicorn'],
  html: ['flower', { petal: '#FF7A1C', center: '#FFF1E0' }],
  css: ['tulip', { outer: '#357FC6', inner: '#8BD7F9' }],
  scss: ['tulip', { outer: '#D63384', inner: '#F7A8CD' }],
  less: ['tulip', { outer: '#5A4C9E', inner: '#A99BE0' }],
  python: ['butterfly', { top: '#3A7BD5', bottom: '#FCC012', topInner: '#7FB5F0', bottomInner: '#FCE08B', tip: '#FCC012' }],
  java: ['tulip', { outer: '#EE2440', inner: '#FF9A9A' }],
  csharp: ['flower', { petal: '#914BB0', center: '#FFFFFF' }],
  cpp: ['flower', { petal: '#4B99A7', center: '#FFFFFF' }],
  c: ['flower', { petal: '#7FA6D9', center: '#FFFFFF' }],
  go: ['flower', { petal: '#5ED8D8', center: '#FFFFFF' }],
  rust: ['flower', { petal: '#F68258', center: '#7A2E12' }],
  php: ['flower', { petal: '#AC6ECB', center: '#FCC012' }],
  ruby: ['flower', { petal: '#EE2440', center: '#FFFFFF' }],
  kotlin: ['butterfly', { top: '#914BB0', bottom: '#FF7A1C', tip: '#FF7A1C' }],
  swift: ['tulip', { outer: '#FF7A1C', inner: '#FFC48A' }],
  dart: ['butterfly', { top: '#4BAFEA', bottom: '#5ED8D8', tip: '#4BAFEA' }],
  vue: ['tulip', { outer: '#41B883', inner: '#A8E6C9' }],
  svelte: ['tulip', { outer: '#FF5A1F', inner: '#FFB08A' }],
  shell: ['sparkle', { fill: '#7FB155', small: '#FCC012' }],
  powershell: ['sparkle', { fill: '#4BAFEA', small: '#FB85AA' }],
  bat: ['sparkle', { fill: '#AC6ECB', small: '#FCC012' }],
  yaml: ['leaf', { fill: '#F0296C' }],
  toml: ['leaf', { fill: '#FF9A3C' }],
  config: ['sparkle', { fill: '#FCC012', small: '#AC6ECB' }],
  env: ['leaf', { fill: '#FCC012' }],
  xml: ['tulip', { outer: '#FF9A3C', inner: '#FFD7A8' }],
  sql: ['star', { fill: '#4BAFEA' }],
  docker: ['butterfly', { top: '#4BAFEA', bottom: '#8BD7F9', tip: '#4BAFEA' }],
  text: ['daisy', { center: '#FCC012' }],
  log: ['daisy', { center: '#A99BBE' }],
  csv: ['leaf', { fill: '#7FB155' }],
  image: ['sparkle', { fill: '#F0296C', small: '#FCC012' }],
  font: ['star', { fill: '#AC6ECB' }],
  archive: ['star', { fill: '#A99BBE' }],
  git: ['leaf', { fill: '#F05033' }],
  npm: ['flower', { petal: '#7FB155', center: '#FFFFFF' }],
  lock: ['heart', { fill: '#A99BBE' }],
  license: ['heart', { fill: '#EE2440' }],
  test: ['heart', { fill: '#F0296C' }],
};

// ---------------------------------------------------------------------------
// Folders: id → colors + sticker
// ---------------------------------------------------------------------------
export const folderStyles = {
  default: { main: '#F48FB8', shade: '#D7528C', emblem: ['daisy', { center: '#FCC012' }] },
  src: { main: '#B98BE3', shade: '#8558C2', emblem: ['flower', { petal: '#FCC012', center: '#EE2440' }] },
  components: { main: '#7CC8F2', shade: '#3A8FD0', emblem: ['butterfly', { top: '#FCC012', bottom: '#F0296C', tip: '#F0296C' }] },
  assets: { main: '#FCCB4E', shade: '#E39F0C', emblem: ['star', { fill: '#F0296C' }] },
  test: { main: '#FF8C96', shade: '#E5484D', emblem: ['heart', { fill: '#FFFFFF' }] },
  docs: { main: '#6CC3CF', shade: '#3B97A6', emblem: ['daisy', { center: '#FCC012' }] },
  modules: { main: '#B4A8C8', shade: '#857899', emblem: ['sparkle', { fill: '#FFFFFF', small: '#FFFFFF' }] },
  git: { main: '#FFA066', shade: '#E8641B', emblem: ['tulip', { outer: '#FFFFFF', inner: '#FFE1C7' }] },
  config: { main: '#A6D16B', shade: '#6E9E36', emblem: ['sparkle', { fill: '#FFF3B0', small: '#FFFFFF' }] },
  dist: { main: '#7A68C8', shade: '#4A3A99', emblem: ['star', { fill: '#FDC56B' }] },
  styles: { main: '#F7B2CB', shade: '#D96A9A', emblem: ['butterfly', { top: '#914BB0', bottom: '#4BAFEA', tip: '#914BB0' }] },
  root: { main: '#C9A2EE', shade: '#8558C2', emblem: ['unicorn'] },
};

const folderNames = {
  src: ['src', 'source', 'lib', 'app', 'core'],
  components: ['components', 'component', 'ui', 'widgets', 'views', 'pages', 'layouts', 'screens'],
  assets: ['assets', 'images', 'img', 'icons', 'media', 'static', 'public', 'fonts', 'resources', 'res', 'pics'],
  test: ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', '__mocks__', 'cypress', 'playwright'],
  docs: ['docs', 'doc', 'documentation', 'wiki'],
  modules: ['node_modules', 'vendor', 'packages', 'bower_components', '.pnpm', '.venv', 'venv', '__pycache__'],
  git: ['.git', '.github', '.gitlab', '.husky', '.circleci'],
  config: ['.vscode', '.idea', '.config', 'config', 'configs', 'settings', '.devcontainer', '.claude'],
  dist: ['dist', 'build', 'out', 'bin', 'release', 'target', '.next', '.nuxt', 'coverage', 'obj'],
  styles: ['styles', 'style', 'css', 'scss', 'sass', 'theme', 'themes'],
};

const languageIds = {
  javascript: 'javascript', typescript: 'typescript', javascriptreact: 'jsx', typescriptreact: 'tsx',
  json: 'json', jsonc: 'json', jsonl: 'json', markdown: 'markdown', html: 'html',
  css: 'css', scss: 'scss', sass: 'scss', less: 'less', python: 'python', java: 'java',
  csharp: 'csharp', cpp: 'cpp', 'cuda-cpp': 'cpp', c: 'c', go: 'go', rust: 'rust', php: 'php',
  ruby: 'ruby', kotlin: 'kotlin', swift: 'swift', dart: 'dart', vue: 'vue', svelte: 'svelte',
  shellscript: 'shell', powershell: 'powershell', bat: 'bat', yaml: 'yaml', toml: 'toml',
  ini: 'config', properties: 'config', xml: 'xml', xsl: 'xml', sql: 'sql', dockerfile: 'docker',
  dockercompose: 'docker', plaintext: 'text', ignore: 'git', log: 'log', csv: 'csv',
};

const fileExtensions = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', ico: 'image', bmp: 'image', avif: 'image',
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font', eot: 'font',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', vsix: 'archive',
  lock: 'lock', env: 'env', csv: 'csv', tsv: 'csv', toml: 'toml', log: 'log',
  'test.ts': 'test', 'test.js': 'test', 'test.tsx': 'test', 'test.jsx': 'test',
  'spec.ts': 'test', 'spec.js': 'test', 'spec.tsx': 'test', 'spec.jsx': 'test',
  mjs: 'javascript', cjs: 'javascript', mts: 'typescript', cts: 'typescript',
};

const fileNames = {
  'readme.md': 'readme', readme: 'readme', 'readme.txt': 'readme',
  license: 'license', 'license.md': 'license', 'license.txt': 'license',
  'package.json': 'npm',
  'package-lock.json': 'lock', 'yarn.lock': 'lock', 'pnpm-lock.yaml': 'lock', 'bun.lockb': 'lock',
  '.gitignore': 'git', '.gitattributes': 'git', '.gitmodules': 'git', '.gitkeep': 'git',
  '.env': 'env', '.env.local': 'env', '.env.example': 'env', '.env.development': 'env', '.env.production': 'env',
  dockerfile: 'docker', 'docker-compose.yml': 'docker', 'docker-compose.yaml': 'docker', 'compose.yaml': 'docker',
  '.editorconfig': 'config', '.prettierrc': 'config', '.eslintrc': 'config', '.eslintrc.json': 'config',
  'tsconfig.json': 'config', 'jsconfig.json': 'config', '.npmrc': 'config', '.nvmrc': 'config',
};

/**
 * Every icon SVG + the icon theme JSON.
 * @returns {{ files: Record<string,string>, theme: object }}
 */
export function buildIcons() {
  const files = {};
  const defs = {};
  const add = (id, body, extraDefs = '') => {
    files[`${id}.svg`] = svg(body, extraDefs);
    defs[`_${id}`] = { iconPath: `./${id}.svg` };
  };

  for (const [id, spec] of Object.entries(fileIcons)) add(`file-${id}`, draw(spec), needsDefs(spec));
  for (const [id, st] of Object.entries(folderStyles)) {
    const extra = st.emblem ? needsDefs(st.emblem) : '';
    add(`folder-${id}`, folder({ ...st, open: false }), extra);
    add(`folder-${id}-open`, folder({ ...st, open: true }), extra);
  }

  const mapNames = (open) => {
    const out = {};
    for (const [style, names] of Object.entries(folderNames)) {
      for (const n of names) out[n] = `_folder-${style}${open ? '-open' : ''}`;
    }
    return out;
  };
  const mapTo = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, `_file-${v}`]));

  const theme = {
    iconDefinitions: defs,
    file: '_file-file',
    folder: '_folder-default',
    folderExpanded: '_folder-default-open',
    rootFolder: '_folder-root',
    rootFolderExpanded: '_folder-root-open',
    folderNames: mapNames(false),
    folderNamesExpanded: mapNames(true),
    fileExtensions: mapTo(fileExtensions),
    fileNames: mapTo(fileNames),
    languageIds: mapTo(languageIds),
    hidesExplorerArrows: false,
  };
  return { files, theme };
}
