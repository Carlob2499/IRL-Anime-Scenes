# ⛩ Seichi Junrei — IRL Anime Scenes

**聖地巡礼** (*seichi junrei*, "sacred-site pilgrimage") — the act of visiting the
real places behind fictional frames.

An animated single-page atlas connecting iconic anime scenes to their real-life
locations. Scroll inside each pinned frame and the animation *wipes* into a
photographic treatment of the real place — from the *Your Name* stairway in
Yotsuya to the *Slam Dunk* railroad crossing in Kamakura.

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
- **Hand-drawn SVG** — every scene is original vector artwork, drawn twice by
  cloning a `<template>`: the *anime* layer stays vivid, the *real* layer gets
  a photographic grade (desaturation, sepia, vignette, film grain) plus
  real-world-only details (power lines, tourists, lamp posts) while
  anime-only elements (comets, koi, soot sprites, a crashed satellite)
  disappear.
- **Type system** — Syne (display), Space Grotesk (body), Shippori Mincho B1
  (Japanese serif), IBM Plex Mono (labels & coordinates).
- Custom cursor, film-grain overlay, and full `prefers-reduced-motion`
  support (the page renders fully revealed and static).
