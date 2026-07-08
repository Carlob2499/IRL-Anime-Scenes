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
    credits = await fetch('/img/credits.json').then((r) => r.json());
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
      img.src = `/img/locations/${slug}.jpg`;
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
    probe.src = `/img/frames/${slug}.jpg`;
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
    img.src = `/img/cards/${card.dataset.slug}.jpg`;
    card.querySelector('.card__art').appendChild(img);

    const cred = document.createElement('p');
    cred.className = 'card__credit';
    cred.textContent = `photo: ${credit.artist} · ${credit.license} · wikimedia commons`;
    card.querySelector('.card__body').appendChild(cred);
  });

  /* ---------------- reduced motion: static, fully revealed page ---------- */

  if (reduced) {
    document.getElementById('preloader').remove();
    gsap.set('.manifesto__text .w', { opacity: 1 });
    document.querySelectorAll('[data-scene]').forEach((scene) => {
      scene.style.height = 'auto';
      scene.querySelector('.scene__layer--real').style.clipPath = 'inset(0 0 50% 0)';
      scene.querySelector('.scene__divider').style.top = '50%';
    });
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

  const CURSOR_LABELS = { drag: 'scroll', view: 'view it' };
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

  /* ---------------- journey scenes: anime → reality wipe ---------------- */

  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const real = scene.querySelector('.scene__layer--real');
    const divider = scene.querySelector('.scene__divider');
    const tagAnime = scene.querySelector('.scene__tag--anime');
    const tagReal = scene.querySelector('.scene__tag--real');

    // the wipe: scrolling within the pinned scene pulls reality up over the frame
    const wipe = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
      },
    });
    wipe
      .fromTo(real, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0)
      .fromTo(divider, { top: '100%' }, { top: '0%', duration: 1 }, 0)
      .fromTo(tagReal, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.08)
      .to(tagAnime, { opacity: 0.25, duration: 0.3 }, 0.6);

    // info column reveals as the scene arrives
    const infoBits = scene.querySelectorAll('.scene__index, .scene__film, .scene__moment, .scene__data > div');
    gsap.fromTo(infoBits,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0, duration: 0.85, stagger: 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: scene, start: 'top 62%' },
      });

    // frame drifts up slightly for depth
    gsap.fromTo(scene.querySelector('.scene__frame'),
      { y: 60, opacity: 0.4 },
      {
        y: 0, opacity: 1, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: scene, start: 'top 78%', end: 'top 30%', scrub: 0.5 },
      });
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
