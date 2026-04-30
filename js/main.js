/* ════════════════════════════════════════════════════
   JATSON — main.js  (FIXED: about cables, mobile cables)
   Dependencies: GSAP 3 + ScrollTrigger (loaded above)
   ════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────
   0. BOOT — wait for GSAP + DOM
   ────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') {
    console.warn('[JATSON] GSAP not loaded');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  Promise.all([loadHeader(), loadFooter()]).then(() => {
    initNav();
    initHero();
    initAboutCables();   /* FIX 1 — moved INSIDE the load callback so ScrollTrigger is registered */
    initFlowSection();
    initCablesSection();
    initServicesSection();
    initRevealObserver();
  });
});

/* ──────────────────────────────────────────────────
   1. HEADER / FOOTER FETCH
   ────────────────────────────────────────────────── */
function loadFooter() {
  return fetch('footer.html')
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById('footer');
      if (el) el.innerHTML = html;
    })
    .catch(err => console.warn('Footer not loaded', err));
}

function loadHeader() {
  return fetch('header.html')
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById('header');
      if (!el) return;
      el.innerHTML = html;

      const toggle   = el.querySelector('.navbar-toggler');
      const collapse = el.querySelector('.navbar-collapse');

      if (toggle && collapse) {
        toggle.addEventListener('click', () =>
          collapse.classList.toggle('show')
        );
        el.querySelectorAll('.nav-link').forEach(a =>
          a.addEventListener('click', () =>
            collapse.classList.remove('show')
          )
        );
      }
    })
    .catch(err => console.warn('Header not loaded', err));
}

/* ──────────────────────────────────────────────────
   2. NAV — scroll-to-scrolled state
   ────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  // Scroll logic
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hover Delay logic to prevent "flickering" or accidental closing
  const dropdowns = document.querySelectorAll('.nav-item.dropdown');
  dropdowns.forEach(dropdown => {
    let timeout;
    const menu = dropdown.querySelector('.dropdown-menu');

    dropdown.addEventListener('mouseenter', () => {
      clearTimeout(timeout);
      dropdown.classList.add('is-hovered'); 
    });

    dropdown.addEventListener('mouseleave', () => {
      timeout = setTimeout(() => {
        dropdown.classList.remove('is-hovered');
      }, 150); // 150ms buffer
    });
  });
}

/* ──────────────────────────────────────────────────
   3. REUSABLE TEXT REVEAL
   ────────────────────────────────────────────────── */
function initReveal(containerEl, delayOffset = 0) {
  const lines = containerEl.querySelectorAll('.reveal-line');
  lines.forEach((line, i) => {
    line.style.setProperty('--i', i + delayOffset);
  });
  return function trigger() {
    lines.forEach(line => {
      const inner = line.querySelector('.reveal-inner');
      if (inner) inner.classList.add('is-visible');
    });
  };
}

function initRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const trigger = initReveal(entry.target);
      trigger();
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('[data-reveal]').forEach(el => {
    if (el.closest('#hero')) return;
    observer.observe(el);
  });
}

/* ──────────────────────────────────────────────────
   4. HERO
   ────────────────────────────────────────────────── */
function initHero() {
  const heading = document.querySelector('#hero [data-reveal]');
  if (heading) {
    const trigger = initReveal(heading);
    setTimeout(trigger, 180);
  }

  const fadeEls = [
    { sel: '.hero-desc',  delay: 520 },
    { sel: '.hero-cta',   delay: 720 },
    { sel: '.hero-badge', delay: 900 },
  ];
  fadeEls.forEach(({ sel, delay }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    setTimeout(() => el.classList.add('is-visible'), delay);
  });
}

/* ──────────────────────────────────────────────────
   5. FLOW DIAGRAM
   ────────────────────────────────────────────────── */
function initFlowSection() {
  const outer = document.getElementById('flow-outer');
  if (!outer) return;

  const steps = [
    [0.10, 'fn-turnkey',  'node'],
    [0.30, 'fn-design',   'node'],
    [0.40, 'conn-1',      'conn'],
    [0.48, 'fn-mfg',      'node'],
    [0.58, 'conn-2',      'conn'],
    [0.66, 'fn-com',      'node'],
  ];

  const entries = steps.map(([at, id, type]) => ({
    at,
    type,
    el: document.getElementById(id),
  }));

  entries.forEach(({ el, type }) => {
    if (!el || type !== 'node') return;
    el.addEventListener('transitionend', () => {
      if (el.classList.contains('fn-visible')) {
        el.style.willChange = 'auto';
      }
    }, { once: true });
  });

  ScrollTrigger.create({
    trigger: outer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate({ progress }) {
      for (const { at, el, type } of entries) {
        if (!el) continue;
        const on = progress >= at;
        if (type === 'node') {
          el.classList.toggle('fn-visible', on);
        } else {
          el.classList.toggle('conn-visible', on);
        }
      }
    },
  });
}

/* ──────────────────────────────────────────────────
   6. ABOUT CABLES  ← FIX 1: now called from inside load callback
   ────────────────────────────────────────────────── */
function initAboutCables() {
  const container = document.querySelector('.about-right');
  if (!container) return;

  /* On mobile the about section stacks (single column), the SVG is
     hidden via CSS, so there is nothing to animate — bail early.     */
  if (window.innerWidth < 992) return;

  const CABLE_X = [85, 78, 71];
  const BEND_Y  = [98, 88, 78];
  const R       = 6;
  const TOP_Y   = -10;
  const LEFT_X  = -10;

  const progress = [0, 0, 0];
  const windows  = [
    [0.0, 0.6],
    [0.1, 0.7],
    [0.2, 0.8],
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function getPath(ix, t) {
    const x  = CABLE_X[ix];
    const by = BEND_Y[ix];
    if (t <= 0) return `M ${x} ${TOP_Y}`;

    const P1 = 0.55;
    const P2 = 0.50;

    if (t <= P1) {
      const tt = t / P1;
      return `M ${x} ${TOP_Y} L ${x} ${TOP_Y + (by - R - TOP_Y) * tt}`;
    }

    const vert        = `M ${x} ${TOP_Y} L ${x} ${by - R}`;
    const tt2         = (t - P2) / (1 - P2);
    const cornerX     = x - R;
    const horizLen    = x - R - LEFT_X;
    const cornerFrac  = R / (R + horizLen);

    if (tt2 <= cornerFrac) {
      const ct  = tt2 / cornerFrac;
      const bx  = lerp(lerp(x, x, ct), lerp(x, cornerX, ct), ct);
      const bby = lerp(lerp(by - R, by, ct), lerp(by, by, ct), ct);
      return `${vert} Q ${x} ${by} ${bx} ${bby}`;
    }

    const ht = (tt2 - cornerFrac) / (1 - cornerFrac);
    return `${vert} Q ${x} ${by} ${cornerX} ${by} L ${cornerX - horizLen * ht} ${by}`;
  }

  function update() {
    for (let i = 0; i < 3; i++) {
      const line = document.getElementById(`abt-c${i + 1}`);
      if (line) line.setAttribute('d', getPath(i, progress[i]));
    }
  }

  ScrollTrigger.create({
    trigger: '#about',
    start: 'top 90%',
    end: 'bottom 20%',
    scrub: 1.2,
    onUpdate: self => {
      const p = self.progress;
      windows.forEach(([s, e], i) => {
        progress[i] = Math.max(0, Math.min(1, (p - s) / (e - s)));
      });
      update();
    },
  });
}

/* ──────────────────────────────────────────────────
   7. THREE-PHASE CABLES  ← FIX 2: works on mobile too
   ────────────────────────────────────────────────── */

   function initCablesSection() {
  const outer = document.getElementById('cables-outer');
  if (!outer) return;

  const isMobile = window.innerWidth < 992;
  const PT = 30; // Path Top limit
  const PB = 70; // Path Bottom limit

  const PHASES = [
    { x: 20, lineIds: ['lc1','rc1'], glowIds: ['lc1g','rc1g'], labelId: 'pl-r', wordId: 'ct-r' },
    { x: 25, lineIds: ['lc2','rc2'], glowIds: ['lc2g','rc2g'], labelId: 'pl-y', wordId: 'ct-y' },
    { x: 30, lineIds: ['lc3','rc3'], glowIds: ['lc3g','rc3g'], labelId: 'pl-b', wordId: 'ct-b' },
  ];

  const progress = [0, 0, 0];
  const windows = [
    [0.04, 0.28],
    [0.28, 0.54],
    [0.54, 0.78],
  ];

  // Helper to generate the linear cable paths
  function cablePath(side, x, t) {
    const start = side === 'top' ? -5 : 105;
    const end = side === 'top' 
      ? -5 + (PT + 5) * t 
      : 105 - (105 - PB) * t;
    return `M ${x} ${start} L ${x} ${end}`;
  }

  // Updates path data and SVG glow opacity
  function updateCables(p) {
    PHASES.forEach((ph, i) => {
      const t = progress[i];
      const dT = cablePath('top', ph.x, t);
      const dB = cablePath('bottom', ph.x, t);

      // Update Phase Lines
      ph.lineIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('d', idx === 0 ? dT : dB);
      });

      // Update Phase Glows
      ph.glowIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('d', idx === 0 ? dT : dB);
        el.style.opacity = isMobile ? 0 : t * 0.8;
      });
    });
  }

  updateCables(0);

  ScrollTrigger.create({
    trigger: outer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
    onUpdate: self => {
      const p = self.progress;

      // 1. Calculate progress for each phase cable
      windows.forEach(([start, end], i) => {
        const t = Math.max(0, Math.min(1, (p - start) / (end - start)));
        progress[i] = t;

        const label = document.getElementById(PHASES[i].labelId);
        if (label) label.classList.toggle('lit', t > 0.08);

        const word = document.getElementById(PHASES[i].wordId);
        if (word) word.classList.toggle('lit', t > 0.85);
      });

      // 2. Render cable updates
      updateCables(p);

      // 3. Handle Center UI visibility
      const anyProgress = progress.some(v => v > 0.05);
      document.getElementById('cables-center')?.classList.toggle('visible', anyProgress || p > 0.10);
      document.querySelector('.phase-labels')?.classList.toggle('visible', anyProgress || p > 0.10);

      // 4. Handle Final State (Subtext and Buttons)
      const allDone = progress.every(v => v > 0.85);
      document.getElementById('cables-sub')?.classList.toggle('lit', allDone);
      document.querySelector('.cables-right .main-button')?.classList.toggle('lit', allDone);

      // 5. THE REVERSIBLE PANEL IMAGE LOGIC
      // Threshold for the "Finish" state is when cables meet (around p > 0.80)
      const isActivated = p > 0.82; 
      const panel = document.querySelector('.cables-panel');
      const imgAlt = document.getElementById('panel-img-alt');
      const panelGlow = document.getElementById('panel-glow');

      if (panel && imgAlt) {
        if (isActivated) {
          // Scrolling Down past threshold: Set Active
          imgAlt.classList.add('active');
          if (panelGlow) panelGlow.classList.add('lit');
          panel.style.transform = 'scale(1.02) translate(-15%, 5%)';
          panel.style.filter = 'brightness(1.1) contrast(1.1)';
        } else {
          // Scrolling Up past threshold: Revert to Base
          imgAlt.classList.remove('active');
          if (panelGlow) panelGlow.classList.remove('lit');
          panel.style.transform = 'scale(1) translate(-15%, 5%)';
          panel.style.filter = 'brightness(0.9) contrast(1.05)';
        }
      }
    }
  });
}
/* ──────────────────────────────────────────────────
   8. SERVICES  ← FIX 3: cable animation works on mobile
   ────────────────────────────────────────────────── */
function initServicesSection() {

  /* ── 8a. Card & stat entrance ── */
  document.querySelectorAll('.service-card').forEach((card, i) => {
    card.setAttribute('data-n', String(i + 1).padStart(2, '0'));
  });
  document.querySelectorAll('[data-animate]').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));

  /* ── 8b. Cable animation ── */
  const section = document.getElementById('services');
  if (!section) return;

  const isMobile = window.innerWidth < 992;

  /* On very small screens there is no visible real-estate for the
     side-running cables — skip the whole thing to save CPU.
     The CSS three-phase colour stripe already gives a visual cue.   */
  if (window.innerWidth < 480) return;

  const CABLE_X = [45, 50, 55];
  const BEND_Y  = [60, 52, 44];
  const R       = 5;
  const TOP_Y   = -5;
  const RIGHT_X = 105;

  const PHASES = [
    { lineId: 'srv-c1', glowId: 'srv-c1g' },
    { lineId: 'srv-c2', glowId: 'srv-c2g' },
    { lineId: 'srv-c3', glowId: 'srv-c3g' },
  ];

  const windows = [
    [0.15, 0.75],
    [0.35, 0.85],
    [0.55, 0.95],
  ];

  const progress = [0, 0, 0];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function cablePath(ix, t) {
    const x  = CABLE_X[ix];
    const by = BEND_Y[ix];

    if (t <= 0) return `M ${x} ${TOP_Y}`;

    const P1 = 0.55;
    const P2 = 0.50;

    if (t <= P1) {
      const tt   = t / P1;
      const endY = TOP_Y + (by - R - TOP_Y) * tt;
      return `M ${x} ${TOP_Y} L ${x} ${endY}`;
    }

    const vert       = `M ${x} ${TOP_Y} L ${x} ${by - R}`;
    const tt2        = (t - P2) / (1 - P2);
    const cornerX    = x + R;
    const horizLen   = RIGHT_X - cornerX;
    const cornerFrac = R / (R + horizLen);

    if (tt2 <= cornerFrac) {
      const ct  = tt2 / cornerFrac;
      const bx  = lerp(lerp(x, x, ct), lerp(x, cornerX, ct), ct);
      const bby = lerp(lerp(by - R, by, ct), lerp(by, by, ct), ct);
      return `${vert} Q ${x} ${by} ${bx} ${bby}`;
    }

    const ht = (tt2 - cornerFrac) / (1 - cornerFrac);
    const hx = cornerX + horizLen * ht;
    return `${vert} Q ${x} ${by} ${cornerX} ${by} L ${hx} ${by}`;
  }

  function updateSrvCables() {
    PHASES.forEach((ph, i) => {
      const t  = progress[i];
      const d  = cablePath(i, t);
      const gl = (!isMobile && t > 0.25) ? Math.min(1, (t - 0.25) / 0.45) : 0;

      const line = document.getElementById(ph.lineId);

      if (line) line.setAttribute('d', d);
 
    });
  }

  updateSrvCables();

  ScrollTrigger.create({
    trigger: section,
    start: 'top 80%',
    end:   'top 5%',
    scrub: 0.8,
    onUpdate: self => {
      const p = self.progress;
      windows.forEach(([start, end], i) => {
        progress[i] = Math.max(0, Math.min(1, (p - start) / (end - start)));
      });
      updateSrvCables();
    },
  });
}

/* ──────────────────────────────────────────────────
   9. SCROLL TEXT ANIMATION
   ────────────────────────────────────────────────── */
const words = gsap.utils.toArray('.w');

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#jatson-wrap',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 2,
  },
});

words.forEach((word, i) => {
  tl.to(word, {
    opacity: 1,
    y: 10,
    ease: 'power2.out',
    duration: 0.5,
  }, i * 0.14);
});

/* ──────────────────────────────────────────────────
   10. PROJECT HOVER / CLICK SWITCHER
   ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const navItems     = document.querySelectorAll('.nav-item-1');
  const projectViews = document.querySelectorAll('.project-view');

  navItems.forEach(item => {
    const switchProject = () => {
      const projectId = item.getAttribute('data-project');

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      projectViews.forEach(view => view.classList.remove('active'));
      const targetView = document.getElementById(projectId);
      if (targetView) targetView.classList.add('active');
    };

    item.addEventListener('mouseenter', switchProject);
    item.addEventListener('click', switchProject);
  });
});

/* ──────────────────────────────────────────────────
   11. HORIZONTAL SCROLL
   ────────────────────────────────────────────────── */
const hTrack = document.querySelector('.horizontal');

if (hTrack) {
  const startOffset = (window.innerWidth / 2) - (350 / 2);

  gsap.set(hTrack, { x: startOffset });

  gsap.to(hTrack, {
    x: () => -(hTrack.scrollWidth - window.innerWidth / 2 - 350 / 2),
    ease: 'none',
    scrollTrigger: {
      trigger: '#horizontal-scoll',
      start: 'top top',
      end: () => `+=${hTrack.scrollWidth + startOffset}`,
      pin: true,
      scrub: 1.8,
      invalidateOnRefresh: true,
      onRefresh: () => gsap.set(hTrack, { x: startOffset }),
    },
  });
}

/* ──────────────────────────────────────────────────
   12. CLIENTS MARQUEE
   ────────────────────────────────────────────────── */
const clients = [
  { name: 'Nexus Corp',  logo: 'css/images/clients/1.png'  },
  { name: 'Verdant Inc', logo: 'css/images/clients/2.png'  },
  { name: 'Apex Studio', logo: 'css/images/clients/3.png'  },
  { name: 'Chrono Labs', logo: 'css/images/clients/5.png'  },
  { name: 'LayerStack',  logo: 'css/images/clients/6.png'  },
  { name: 'GrowthBase',  logo: 'css/images/clients/7.png'  },
  { name: 'Pulseware',   logo: 'css/images/clients/8.png'  },
  { name: 'SolarGrid',   logo: 'css/images/clients/9.png'  },
  { name: 'DataBridge',  logo: 'css/images/clients/10.png' },
];

const SPEED = 0.6;
const track = document.getElementById('marqueeTrack');

if (track) {
  function createCard(client) {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `<img src="${client.logo}" alt="${client.name}">`;
    return card;
  }

  clients.forEach(c => track.appendChild(createCard(c)));

  function fillTrack() {
    const wrapperWidth = track.parentElement.offsetWidth;
    const original = Array.from(track.children);
    while (track.scrollWidth < wrapperWidth * 2) {
      original.forEach(card => track.appendChild(card.cloneNode(true)));
    }
  }

  fillTrack();
  window.addEventListener('resize', fillTrack);

  function getSetWidth() {
    return clients.reduce((sum, _, i) => {
      const el    = track.children[i];
      const style = getComputedStyle(el);
      return sum + el.offsetWidth
        + parseInt(style.marginLeft)
        + parseInt(style.marginRight);
    }, 0);
  }

  let offset = 0;
  let paused = false;

  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);

  function animate() {
    if (!paused) {
      offset += SPEED;
      const setWidth = getSetWidth();
      if (offset >= setWidth) offset -= setWidth;
      track.style.transform = `translateX(-${offset}px)`;
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ──────────────────────────────────────────────────
   13. PRODUCTS GALLERY
   ────────────────────────────────────────────────── */
const DATA = [
  {
    title: "Product 1",
    tag: "Electrical Panel",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
  },
  {
    title: "Product 2",
    tag: "Electrical Panel",
    body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    title: "Product 3",
    tag: "Electrical Panel",
    body: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident."
  },
  {
    title: "Product 4",
    tag: "Electrical Panel",
    body: "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est."
  },
  {
    title: "Product 5",
    tag: "Electrical Panel",
    body: "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus."
  },
];

const PALETTE = [
  "#1a2a3a","#0d2b2b","#2a1a0a","#0a2a10","#2a0a0a","#0a1a2a",
  "#1a2a0a","#0a2a2a","#2a1a1a","#0a1a0a","#1a1a2a","#0a0a1a",
];

const numList   = document.getElementById('numList');
const imgCol    = document.getElementById('imgCol');
const descTrack = document.getElementById('descTrack');

DATA.forEach((d, i) => {
  const ni = document.createElement('div');
  ni.className = 'num-item';
  ni.textContent = String(i + 1).padStart(2, '0');
  ni.dataset.i = i;
  ni.addEventListener('click', () => {
    document.querySelectorAll('.img-entry')[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  numList && numList.appendChild(ni);

  const entry = document.createElement('div');
  entry.className = 'img-entry';
  entry.dataset.i = i;

  const img = document.createElement('img');
  img.src = `css/images/img-${i}.png`;
  img.alt = d.title;

  const idx = document.createElement('div');
  idx.className = 'img-index';
  idx.textContent = String(i + 1).padStart(2, '0');

  entry.appendChild(img);
  entry.appendChild(idx);
  imgCol && imgCol.appendChild(entry);

  const slot = document.createElement('div');
  slot.className = 'desc-slot';
  slot.dataset.i = i;
  slot.innerHTML = `
    <div class="desc-num">${String(i + 1).padStart(2, '0')}</div>
    <div class="desc-eyebrow">${d.tag}</div>
    <div class="desc-title">${d.title}</div>
    <div class="desc-rule"></div>
    <div class="desc-body">${d.body}</div>
    <div><span class="desc-tag">${d.tag}</span></div>
  `;
  descTrack && descTrack.appendChild(slot);
});

const imgEntries = document.querySelectorAll('.img-entry');
const numItems   = document.querySelectorAll('.num-item');
const descSlots  = document.querySelectorAll('.desc-slot');
let activeIdx = 1;

function activate(i) {
  if (i === activeIdx && document.querySelector('.img-entry.active')) return;
  activeIdx = i;

  imgEntries.forEach((e, j) => e.classList.toggle('active', j === i));

  numItems.forEach((n, j) => {
    n.classList.remove('active', 'near');
    const dist = Math.abs(j - i);
    if (dist === 0) n.classList.add('active');
    else if (dist <= 2) n.classList.add('near');
  });

  descSlots.forEach((s, j) => s.classList.toggle('active', j === i));
  if (descTrack) descTrack.style.transform = `translateY(-${i * 100}vh)`;
}

const ioGallery = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio >= 0.5) {
      activate(parseInt(e.target.dataset.i));
    }
  });
}, { root: null, threshold: 0.5 });

imgEntries.forEach(e => ioGallery.observe(e));
activate(0);

const ctaEntry = document.createElement('div');
ctaEntry.className = 'img-entry cta-entry';
ctaEntry.style.cssText = 'display:flex;justify-content:center;align-items:center;min-height:100vh';

const viewAllBtn = document.createElement('a');
viewAllBtn.href      = '/products.html';
viewAllBtn.className = 'view-all-btn';
viewAllBtn.textContent = 'View All Products';

ctaEntry.appendChild(viewAllBtn);
imgCol && imgCol.appendChild(ctaEntry);

/* ──────────────────────────────────────────────────
   14. CONVERGENCE (currently commented out in HTML — kept for completeness)
   ────────────────────────────────────────────────── */
function initHorizontalConvergence() {
  const outer = document.getElementById('converge-outer');
  if (!outer) return;

  const LEFT_STOP  = 48;
  const RIGHT_STOP = 52;

  const PHASES = [
    { y: 46, lineIds: ['lh1','rh1'] },
    { y: 50, lineIds: ['lh2','rh2'] },
    { y: 54, lineIds: ['lh3','rh3'] },
  ];

  function cablePath(side, y, t) {
    const startX = side === 'left' ? -5 : 105;
    const endX   = side === 'left'
      ? -5  + (LEFT_STOP  + 5) * t
      : 105 - (105 - RIGHT_STOP) * t;
    return `M ${startX} ${y} L ${endX} ${y}`;
  }

  ScrollTrigger.create({
    trigger: outer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: self => {
      const p = self.progress;

      PHASES.forEach((ph, i) => {
        const start = i * 0.08;
        const end   = 0.85;
        const t     = Math.max(0, Math.min(1, (p - start) / (end - start)));

        const dL = cablePath('left',  ph.y, t);
        const dR = cablePath('right', ph.y, t);

        document.getElementById(ph.lineIds[0])?.setAttribute('d', dL);
        document.getElementById(ph.lineIds[1])?.setAttribute('d', dR);
      });

      const converged = p > 0.70;
      document.getElementById('converge-text-block')?.classList.toggle('lit', converged);
      document.getElementById('panel-glow-hit')?.classList.toggle('lit', converged);

      const img = document.getElementById('converge-img');
      if (img) {
        img.style.transform = p > 0.85 ? `scale(${1 + (p - 0.85) * 0.15})` : 'scale(1)';
      }
    },
  });
}

initHorizontalConvergence();