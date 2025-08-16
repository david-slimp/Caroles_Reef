// Script to fix common linting issues in the codebase
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files to fix with their specific fixes
const filesToFix = {
  // Fix unused variables by prefixing with _
  'src/engine/spatial/quadtree.ts': content =>
    content.replace(/(_p|_x|_y|_r)([^a-zA-Z0-9_])/g, '_$1$2'),

  // Fix unused variables in UI components
  'src/ui/controls.ts': content => content.replace(/(_s|_b)([^a-zA-Z0-9_])/g, '_$1$2'),

  'src/ui/hotkeys.ts': content => content.replace(/(_s|_b)([^a-zA-Z0-9_])/g, '_$1$2'),

  'src/ui/toast.ts': content => content.replace(/_m([^a-zA-Z0-9_])/g, '_m$1'),

  // Fix unused variables in other files
  'src/render/draw.ts': content => content.replace(/_bus([^a-zA-Z0-9_])/g, '_bus$1'),

  'src/systems/update.ts': content => content.replace(/_bus([^a-zA-Z0-9_])/g, '_bus$1'),

  'src/main.ts': content => content.replace(/audio =/g, '_audio ='), // Mark audio as unused
};

// Process each file
Object.entries(filesToFix).forEach(([filePath, fixFn]) => {
  const fullPath = join(__dirname, '..', filePath);
  if (existsSync(fullPath)) {
    let content = readFileSync(fullPath, 'utf8');
    const newContent = fixFn(content);
    if (newContent !== content) {
      writeFileSync(fullPath, newContent, 'utf8');
      console.log(`Fixed lint issues in ${filePath}`);
    }
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log('Lint fixes applied successfully!');
