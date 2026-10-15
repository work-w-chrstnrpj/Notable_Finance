// Verify electron-builder's generated update manifests before GitHub upload.
// Restrict artifact names to URL-safe characters so upload cannot rename them.
import { readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const [platform, directory = 'dist'] = process.argv.slice(2);
const manifest = { win: 'latest.yml', mac: 'latest-mac.yml', linux: 'latest-linux.yml' }[platform];
if (!manifest) throw new Error('Usage: node scripts/verify-update-artifacts.mjs <win|mac|linux> [directory]');
const text = readFileSync(resolve(directory, manifest), 'utf8');
// Only read filename scalars from electron-builder's generated format (not general YAML).
const names = [...text.matchAll(/^\s*(?:-\s*)?(?:url|path):\s*(.+?)\s*$/gm)]
  .map(match => match[1].replace(/^(['"])(.*)\1$/, '$2'));
if (!names.length) throw new Error(`${manifest} has no artifact references`);
for (const name of new Set(names)) {
  if (basename(name) !== name || !/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error(`Artifact name must be URL-safe without spaces: ${name}`);
  }
  const file = resolve(directory, name);
  if (!statSync(file).isFile()) throw new Error(`Missing updater artifact: ${name}`);
}
console.log(`${manifest}: every referenced artifact exists with an upload-safe filename`);
