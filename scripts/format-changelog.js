#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  console.error('CHANGELOG.md not found.');
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, 'utf8').split('\n');
const output = [];

const isVersionHeader = line => /^## \[/.test(line);
const isSectionHeader = line => /^### (Added|Fixed|Changed|Removed)/.test(line);
const isBlank = line => line.trim() === '';

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];

  if (isVersionHeader(line)) {
    if (output.length > 0 && !isBlank(output[output.length - 1])) {
      output.push('');
    }
    output.push(line);

    if (i + 1 < lines.length && isBlank(lines[i + 1])) {
      i += 1;
    }
    continue;
  }

  if (isSectionHeader(line)) {
    while (output.length > 0 && isBlank(output[output.length - 1])) {
      output.pop();
    }
    output.push(line);

    if (i + 1 < lines.length && isBlank(lines[i + 1])) {
      i += 1;
    }
    continue;
  }

  output.push(line);
}

const finalOutput = output.join('\n');
fs.writeFileSync(changelogPath, finalOutput, 'utf8');
