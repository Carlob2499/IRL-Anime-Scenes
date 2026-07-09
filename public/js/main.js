/* ==========================================================================
   SEICHI JUNREI — animation engine (GSAP + ScrollTrigger + Lenis)
   ========================================================================== */

(async () => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- utilities ---------------- */

  // split an element's text into .char spans (keeps spaces intact)
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      if (ch === ' ') {
        frag.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        frag.appendChild(span);
      }
    }
    el.appendChild(frag);
    return el.querySelectorAll('.char');
  }

  // split a paragraph into .w word spans
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.w');
  }

  document.querySelectorAll('[data-split]').forEach(splitChars);

  /* ---------------- photography credits (CC-licensed, Wikimedia Commons) - */

  let credits = {};
  try {
    credits = await fetch('img/credits.json').then((r) => r.json());
  } catch (_) { /* offline — scenes fall back to graded svg artwork */ }

  /* ---------------- scene frames ----------------
     anime layer: hand-drawn svg (or a user-supplied film still dropped into
     public/img/frames/<slug>.jpg — see README). real layer: CC-licensed
     photography of the actual location. */

  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const tpl = scene.querySelector('.scene__art-template');
    const svg = tpl.content.querySelector('svg');
    const slug = scene.dataset.slug;
    const credit = credits[slug];

    scene.querySelector('.scene__layer--anime').appendChild(svg.cloneNode(true));

    const real = scene.querySelector('.scene__layer--real');
    if (credit) {
      const img = document.createElement('img');
      img.src = `img/locations/${slug}.jpg`;
      img.alt = scene.dataset.alt || '';
      real.appendChild(img);

      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = 'Photograph';
      const dd = document.createElement('dd');
      const a = document.createElement('a');
      a.href = credit.source;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `${credit.artist} — ${credit.license}`;
      dd.appendChild(a);
      dd.appendChild(document.createTextNode(', via Wikimedia Commons'));
      row.appendChild(dt);
      row.appendChild(dd);
      scene.querySelector('.scene__data').appendChild(row);
    } else {
      real.appendChild(svg.cloneNode(true));
    }

    // if the repo owner drops a film still at /img/frames/<slug>.jpg,
    // it replaces the svg interpretation in the anime layer
    const probe = new Image();
    probe.onload = () => {
      const anime = scene.querySelector('.scene__layer--anime');
      anime.textContent = '';
      const still = document.createElement('img');
      still.src = probe.src;
      still.alt = scene.querySelector('.scene__moment')?.textContent || '';
      anime.appendChild(still);
    };
    probe.src = `img/frames/${slug}.jpg`;
  });

  /* ---------------- archive cards: photo pins ---------------- */

  document.querySelectorAll('.card[data-slug]').forEach((card) => {
    const credit = credits[card.dataset.slug];
    if (!credit) return;
    const img = document.createElement('img');
    img.className = 'card__photo';
    img.loading = 'lazy';
    img.alt = '';
    img.addEventListener('load', () => img.classList.add('is-loaded'));
    img.src = `img/cards/${card.dataset.slug}.jpg`;
    card.querySelector('.card__art').appendChild(img);

    const cred = document.createElement('p');
    cred.className = 'card__credit';
    cred.textContent = `photo: ${credit.artist} · ${credit.license} · wikimedia commons`;
    card.querySelector('.card__body').appendChild(cred);
  });

  /* ---------------- info overlay toggle (all motion modes) ---------------- */

  const toggles = document.querySelectorAll('.scene__info-toggle');
  function setOverlays(hidden) {
    document.body.classList.toggle('overlays-hidden', hidden);
    toggles.forEach((b) => {
      b.textContent = hidden ? 'show info' : 'hide info';
      b.setAttribute('aria-expanded', String(!hidden));
    });
  }
  toggles.forEach((b) => b.addEventListener('click', () =>
    setOverlays(!document.body.classList.contains('overlays-hidden'))));
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      setOverlays(!document.body.classList.contains('overlays-hidden'));
    }
  });

  /* ---------------- divider drag (all motion modes) ---------------- */

  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const frame = scene.querySelector('.scene__frame');
    const divider = scene.querySelector('.scene__divider');
    let dragging = false;
    divider.addEventListener('pointerdown', (e) => {
      dragging = true;
      divider.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    divider.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const r = frame.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
      frame.style.setProperty('--split', pct + '%');
    });
    const stop = () => { dragging = false; };
    divider.addEventListener('pointerup', stop);
    divider.addEventListener('pointercancel', stop);
  });

  /* ---------------- reduced motion: static, fully revealed page ---------- */

  if (reduced) {
    document.getElementById('preloader').remove();
    gsap.set('.manifesto__text .w', { opacity: 1 });
    return;
  }

  /* ---------------- smooth scroll ---------------- */

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links through lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    });
  });

  /* ---------------- custom cursor ---------------- */

  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor__ring-label');
  gsap.set(['.cursor__dot', '.cursor__ring'], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
  const dotX = gsap.quickTo('.cursor__dot', 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo('.cursor__dot', 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo('.cursor__ring', 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo('.cursor__ring', 'y', { duration: 0.45, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
  });

  const CURSOR_LABELS = { drag: 'drag', view: 'view it' };
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    const mode = el.dataset.cursor;
    el.addEventListener('pointerenter', () => {
      if (CURSOR_LABELS[mode]) {
        label.textContent = CURSOR_LABELS[mode];
        cursor.classList.add('cursor--label');
      } else {
        cursor.classList.add('cursor--hover');
      }
    });
    el.addEventListener('pointerleave', () => {
      cursor.classList.remove('cursor--label', 'cursor--hover');
    });
  });

  /* ---------------- preloader → hero intro ---------------- */

  lenis.stop();

  const intro = gsap.timeline({ paused: true });
  intro
    .fromTo('.hero__kicker', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .fromTo('.hero__title .char',
      { yPercent: 115, rotate: 5 },
      { yPercent: 0, rotate: 0, duration: 1.1, ease: 'power4.out', stagger: 0.022 }, '-=0.55')
    .fromTo('.hero__meta-item', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, '-=0.7')
    .fromTo('.hero__vertical', { opacity: 0 }, { opacity: 1, duration: 1 }, '-=0.6')
    .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '<');

  // comet draws itself
  const trail = document.querySelector('.hero__comet-trail');
  const trailLen = trail.getTotalLength();
  gsap.set(trail, { strokeDasharray: trailLen, strokeDashoffset: trailLen });
  intro.to(trail, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0.4);
  intro.fromTo('.hero__comet-head', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 2.2);

  const pre = gsap.timeline({
    onComplete: () => {
      document.getElementById('preloader').remove();
      lenis.start();
    },
  });
  pre
    .to('.preloader__kanji span', {
      opacity: 1, y: 0, rotate: 0, duration: 0.8, stagger: 0.14, ease: 'power3.out',
    })
    .fromTo('.preloader__label', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.5')
    .to('.preloader__bar-fill', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, '-=0.4')
    .to('.preloader__inner', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' }, '+=0.15')
    .to('#preloader', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
    .add(() => intro.play(), '-=0.75');

  /* ---------------- hero parallax ---------------- */

  gsap.to('.hero__comet', {
    yPercent: 40, opacity: 0.15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__title', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__orb--1', {
    yPercent: 30, xPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ---------------- marquee ---------------- */

  gsap.to('.marquee__track', { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });

  /* ---------------- manifesto word reveal (scrubbed) ---------------- */

  const words = splitWords(document.querySelector('[data-words]'));
  gsap.to(words, {
    opacity: 1,
    stagger: 0.06,
    ease: 'none',
    scrollTrigger: {
      trigger: '.manifesto',
      start: 'top 75%',
      end: 'top 15%',
      scrub: 0.4,
    },
  });
  gsap.to('.manifesto__badge svg', {
    rotate: 360, ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });

  /* ---------------- section titles ---------------- */

  document.querySelectorAll('.section-title').forEach((title) => {
    const chars = title.querySelectorAll('.char');
    gsap.fromTo(chars,
      { yPercent: 115 },
      {
        yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.02,
        scrollTrigger: { trigger: title, start: 'top 82%' },
      });
  });

  /* ---------------- journey scenes: full-page frame|field split ---------- */

  // the nav's 現在地 (current location) readout follows the journey
  const navJp = document.querySelector('.nav__jp');
  const NAV_HOME = navJp.textContent;
  const NAV_LOCATIONS = {
    'your-name': '現在地 — YOTSUYA, TOKYO',
    'slam-dunk': '現在地 — KAMAKURA, KANAGAWA',
    'garden-of-words': '現在地 — SHINJUKU GYOEN, TOKYO',
    'spirited-away': '現在地 — MATSUYAMA, EHIME',
    'steins-gate': '現在地 — AKIHABARA, TOKYO',
    'silent-voice': '現在地 — ŌGAKI, GIFU',
  };

  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const frame = scene.querySelector('.scene__frame');

    const loc = NAV_LOCATIONS[scene.dataset.slug];
    if (loc) {
      ScrollTrigger.create({
        trigger: scene,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => { navJp.textContent = loc; },
        onEnterBack: () => { navJp.textContent = loc; },
      });
    }

    // entrance: the drawn frame owns the screen, then reality slides in to 50/50
    gsap.fromTo(frame, { '--split': '100%' }, {
      '--split': '50%',
      duration: 1.7,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: scene, start: 'top 55%', once: true },
    });
    gsap.fromTo(scene.querySelectorAll('.scene__tag'), { opacity: 0, y: -12 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.5, ease: 'power2.out',
      scrollTrigger: { trigger: scene, start: 'top 50%' },
    });

    // overlay content cascades in as the scene arrives
    const infoBits = scene.querySelectorAll('.scene__index, .scene__film, .scene__moment, .scene__data > div');
    gsap.fromTo(infoBits,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.75, stagger: 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: scene, start: 'top 45%' },
      });
  });

  // back above the journey (or past it), the readout returns home
  ScrollTrigger.create({
    trigger: '.journey',
    start: 'top 50%',
    end: 'bottom 50%',
    onLeave: () => { navJp.textContent = NAV_HOME; },
    onLeaveBack: () => { navJp.textContent = NAV_HOME; },
  });

  /* ---------------- archive cards ---------------- */

  gsap.utils.toArray('.card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 70, rotate: i % 2 ? 1.2 : -1.2 },
      {
        opacity: 1, y: 0, rotate: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%' },
      });
  });

  /* ---------------- pilgrimage rules ---------------- */

  gsap.fromTo('.pilgrimage__rules li',
    { opacity: 0, x: -40 },
    {
      opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.pilgrimage__rules', start: 'top 85%' },
    });

  /* ---------------- footer drift ---------------- */

  gsap.fromTo('.footer__big-line:not(.footer__big-line--outline)', { xPercent: -6 }, {
    xPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });
  gsap.fromTo('.footer__big-line--outline', { xPercent: 8 }, {
    xPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });
})();
