// npm run package  →  rika-unicorn-theme-<version>.vsix
// Dependency-free VSIX packager (a .vsix is a zip: an extension/ folder + a manifest).
// To publish to the Marketplace, use the official tool instead: npx @vscode/vsce package

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// VS Code and the Marketplace only show README images from https URLs, so relative
// image links are pointed at the GitHub repository from package.json "repository".
const repoMatch = String(pkg.repository?.url ?? pkg.repository ?? '').match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
const rawBase = repoMatch ? `https://raw.githubusercontent.com/${repoMatch[1]}/${repoMatch[2]}/HEAD/` : null;
const absolutizeImages = (md) => (rawBase
  ? md.replace(/(!\[[^\]]*\]\()(?!https?:|data:)(?:\.\/)?([^)\s]+)\)/g, (_, open, path) => `${open}${rawBase}${path})`)
  : md);
if (!rawBase) console.warn('⚠ No GitHub "repository" in package.json: README images will not show inside VS Code.');

// What goes into the package
const INCLUDE = ['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE', 'themes', 'icons', 'images'];

const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p]);
const files = INCLUDE.flatMap((p) => {
  try { return walk(join(root, p)); } catch { return []; }
}).map((abs) => {
  const rel = relative(root, abs).split(sep).join('/');
  return { name: 'extension/' + rel, data: rel === 'README.md' ? Buffer.from(absolutizeImages(readFileSync(abs, 'utf8'))) : readFileSync(abs) };
});

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = (n) => files.some((f) => f.name === `extension/${n}`);

const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${xmlEsc(pkg.name)}" Version="${xmlEsc(pkg.version)}" Publisher="${xmlEsc(pkg.publisher)}" />
    <DisplayName>${xmlEsc(pkg.displayName)}</DisplayName>
    <Description xml:space="preserve">${xmlEsc(pkg.description)}</Description>
    <Tags>${xmlEsc((pkg.keywords || []).join(','))}</Tags>
    <Categories>${xmlEsc((pkg.categories || []).join(','))}</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${xmlEsc(pkg.engines.vscode)}" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui,workspace" />
      <Property Id="Microsoft.VisualStudio.Services.Branding.Color" Value="${xmlEsc(pkg.galleryBanner?.color ?? '#1F1838')}" />
      <Property Id="Microsoft.VisualStudio.Services.Branding.Theme" Value="${xmlEsc(pkg.galleryBanner?.theme ?? 'dark')}" />
      <Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="true" />
    </Properties>
    ${pkg.icon ? `<Icon>extension/${xmlEsc(pkg.icon)}</Icon>` : ''}
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    ${has('README.md') ? '<Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />' : ''}
    ${has('CHANGELOG.md') ? '<Asset Type="Microsoft.VisualStudio.Services.Content.Changelog" Path="extension/CHANGELOG.md" Addressable="true" />' : ''}
    ${has('LICENSE') ? '<Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE" Addressable="true" />' : ''}
    ${pkg.icon ? `<Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/${xmlEsc(pkg.icon)}" Addressable="true" />` : ''}
  </Assets>
</PackageManifest>
`;

const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json" />
  <Default Extension=".md" ContentType="text/markdown" />
  <Default Extension=".png" ContentType="image/png" />
  <Default Extension=".svg" ContentType="image/svg+xml" />
  <Default Extension=".vsixmanifest" ContentType="text/xml" />
  <Default Extension="" ContentType="application/octet-stream" />
</Types>
`;

const entries = [
  { name: '[Content_Types].xml', data: Buffer.from(contentTypes) },
  { name: 'extension.vsixmanifest', data: Buffer.from(manifest) },
  ...files,
];

// --- Minimal zip writer (deflate, UTF-8 names) ---
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zip(list) {
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of list) {
    const nameBuf = Buffer.from(name, 'utf8');
    const deflated = deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += 30 + nameBuf.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(list.length, 8);
  end.writeUInt16LE(list.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const outName = `${pkg.name}-${pkg.version}.vsix`;
const buf = zip(entries);
writeFileSync(join(root, outName), buf);
console.log(`✔ ${outName} (${files.length} files, ${(buf.length / 1024).toFixed(0)} KB)`);
console.log(`  Install:  code --install-extension ${outName}`);
