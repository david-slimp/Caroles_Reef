import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');
const metaPath = path.join(rootDir, 'meta.txt');

const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgRaw);

if (!pkg.version || typeof pkg.version !== 'string') {
  throw new Error('package.json version is missing or invalid');
}

const metaRaw = fs.readFileSync(metaPath, 'utf8');
const versionPattern = /version:\s*"[^"]*"/;

if (!versionPattern.test(metaRaw)) {
  throw new Error('meta.txt version line not found');
}

const nextMeta = metaRaw.replace(versionPattern, `version: "${pkg.version}"`);

if (nextMeta !== metaRaw) {
  fs.writeFileSync(metaPath, nextMeta);
}
