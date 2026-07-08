const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Vendored client libraries, served straight out of node_modules so the
// site runs fully offline — no CDN required.
app.use('/vendor/gsap', express.static(path.join(__dirname, 'node_modules/gsap/dist')));
app.use('/vendor/lenis', express.static(path.join(__dirname, 'node_modules/lenis/dist')));

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⛩  Seichi Junrei is live → http://localhost:${PORT}`);
});
