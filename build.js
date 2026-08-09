const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'styles.css',
  'v10.css',
  'v11-cannes.css',
  'v12-crowd.css',
  'v13-clarity.css',
  'app-v10.js',
  'v11-cannes.js',
  'v12-crowd.js',
  'v13-clarity.js',
  'v14-cannes-only.js',
  'manifest.webmanifest',
  'icon.svg',
  'sw.js'
];

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  const src = path.join(__dirname, file);
  if (!fs.existsSync(src)) throw new Error(`Missing required frontend file: ${file}`);
  fs.copyFileSync(src, path.join(out, file));
}

console.log(`La plage youpiii: copied ${files.length} frontend files to dist/`);
