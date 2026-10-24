import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ['index.html', 'style.css', 'app.js']) {
  await cp(path.join(root, file), path.join(dist, file));
}

await writeFile(
  path.join(dist, 'robots.txt'),
  'User-agent: *\nAllow: /\n',
  'utf8'
);

await writeFile(
  path.join(dist, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Cache-Control: public, max-age=3600
`,
  'utf8'
);

console.log('Deployment bundle ready in dist/ (index.html, style.css, app.js)');
