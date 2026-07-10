# ⛩ Seichi Junrei — IRL Anime Scenes

**聖地巡礼** (*seichi junrei*, "sacred-site pilgrimage") — the act of visiting the
real places behind fictional frames.

An animated single-page atlas connecting iconic anime scenes to their real-life
locations. Each scene fills the screen as a split pair — the drawn frame on the
left, the photographed field on the right — with a draggable gold divider to
slide either side to full screen, and a dismissible glass overlay carrying the
scene's coordinates and field notes. The nav's 現在地 ("current location")
readout follows you from Yotsuya to Kamakura as you scroll.

## The journey (featured scenes)

| # | Film | Scene | Real location |
|---|------|-------|---------------|
| 01 | Your Name (2016) | “The stairs” | Suga Shrine stairway, Yotsuya, Shinjuku — `35.6852° N, 139.7204° E` |
| 02 | Slam Dunk (1993) | Seaside crossing | Kamakurakōkōmae Crossing №1, Kamakura — `35.3068° N, 139.5010° E` |
| 03 | The Garden of Words (2013) | Rain pavilion | Shinjuku Gyoen, Tokyo — `35.6842° N, 139.7108° E` |
| 04 | Spirited Away (2001) | The bathhouse | Dōgo Onsen Honkan, Matsuyama — `33.8521° N, 132.7864° E` |
| 05 | Steins;Gate (2011) | Radio Kaikan satellite | Akihabara, Tokyo — `35.6983° N, 139.7714° E` |
| 06 | A Silent Voice (2016) | The koi bridge | Shinbashi bridge, Ōgaki, Gifu — `35.3597° N, 136.6130° E` |

…plus a Pinterest-style masonry archive of nine more pilgrimages (Demon Slayer,
Lucky Star, K-On!, Attack on Titan’s Nördlingen, Laid-Back Camp, and more).

## Running it

```bash
npm install
npm start          # → http://localhost:3000
```

Node.js ≥ 18. GSAP and Lenis are served from `node_modules` by the Express
server — no CDN needed at runtime (web fonts load from Google Fonts with
graceful fallbacks).

## How it's built

- **Node.js + Express** — static server that also vendors client libraries
  from `node_modules` (`server.js`).
- **GSAP + ScrollTrigger** — preloader sequence, character-split headline
  reveals, scrubbed “frame → field” clip-path wipes inside pinned scenes,
  parallax, masonry card reveals, marquee.
- **Lenis** — inertial smooth scrolling feeding ScrollTrigger.
- **Real location photography** — the *field* side of every wipe (and the
  archive board) is CC-licensed photography of the actual places, fetched
  from Wikimedia Commons and attributed on-page and in
  [CREDITS.md](CREDITS.md).
- **Illustrated frames, everywhere** — the *anime* side of every featured
  scene *and* every archive card is original vector artwork interpreting the
  location (film stills are copyrighted and are never fetched or
  distributed here). Archive cards draw from a library of ~15 reusable
  “archetype” illustrations (shrine, harbor, bridge, castle, snow-village,
  neon-street…) in `public/js/illustrations.js`, auto-matched to each new
  pin by `scripts/add-pins.py`; hover a card (or tap on touch) to crossfade
  from the illustration to the real photograph. **Bring your own stills:**
  drop a screenshot at `public/img/frames/<slug>.jpg` for the six featured
  scenes — slugs are `your-name`, `slam-dunk`, `garden-of-words`,
  `spirited-away`, `steins-gate`, `silent-voice` — and the site automatically
  uses it in place of the illustration. If the photography can't load
  (offline), scenes fall back to a photo-graded copy of the SVG.
- **Type system** — Syne (display), Space Grotesk (body), Shippori Mincho B1
  (Japanese serif), IBM Plex Mono (labels & coordinates).
- Custom cursor, film-grain overlay, and full `prefers-reduced-motion`
  support (the page renders fully revealed and static).
