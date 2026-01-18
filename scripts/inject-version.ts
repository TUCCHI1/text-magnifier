import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = join(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const manifestPath = join(rootDir, 'src', 'public', 'manifest.json');
const distManifestPath = join(rootDir, 'dist', 'manifest.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
manifest.version = packageJson.version;

writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Injected version ${packageJson.version} into manifest.json`);
