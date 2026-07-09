// Assembles a fully static bundle in dist/ for GitHub Pages:
// public/ plus the client libraries Express normally serves from node_modules.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });

for (const [pkg, files] of Object.entries({
  gsap: ['gsap.min.js', 'ScrollTrigger.min.js'],
  lenis: ['lenis.min.js'],
})) {
  const out = path.join(dist, 'vendor', pkg);
  fs.mkdirSync(out, { recursive: true });
  for (const f of files) {
    fs.copyFileSync(path.join(root, 'node_modules', pkg, 'dist', f), path.join(out, f));
  }
}

// Pages serves 404s for missing files; .nojekyll skips Jekyll processing.
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('static bundle ready in dist/');
