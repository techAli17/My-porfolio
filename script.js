(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  $('[data-year]').textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  };

  /* ---------- Theme & accent ---------- */
  const setTheme = (t) => {
    root.dataset.theme = t;
    store.set('theme', t);
    $('meta[name="theme-color"]').content = t === 'light' ? '#F6F5F1' : '#0F1114';
  };
  const toggleTheme = () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
  $('[data-theme-toggle]').addEventListener('click', toggleTheme);

  const ACCENTS = { Sky: '#8BD3FF', Amber: '#F5B26B', Lime: '#B9E769', Lilac: '#C4A7FF' };
  const setAccent = (name) => {
    root.style.setProperty('--accent', ACCENTS[name]);
    store.set('accent', ACCENTS[name]);
    toast(`Accent → ${name}`);
  };

  /* ---------- Hero headline: word-by-word reveal ---------- */
  const title = $('[data-split]');
  const splitWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part;
          w.append(inner); frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) splitWords(child);
    });
  };
  splitWords(title);
  $$('.w > span', title).forEach((s, i) => (s.style.transitionDelay = `${i * 45}ms`));
  requestAnimationFrame(() => setTimeout(() => title.classList.add('is-in'), 80));

  /* ---------- Scroll reveal + staggering ---------- */
  const groups = ['.cards', '.skills', '.metrics__grid', '.hero__copy'];
  groups.forEach((g) => $$(`${g} > .reveal`).forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`)));
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- Count-up metrics ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const dur = reduced ? 0 : 1600;
      const t0 = performance.now();
      const tick = (t) => {
        const p = dur ? Math.min(1, (t - t0) / dur) : 1;
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Scroll progress, active nav, timeline fill ---------- */
  const bar = $('.progress span');
  const timeline = $('[data-timeline]');
  const navLinks = $$('[data-nav]');
  const sections = navLinks.map((a) => $(a.getAttribute('href')));
  let ticking = false;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;

    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    timeline.style.setProperty('--tl', p);

    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === current));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Custom cursor + magnetic buttons ---------- */
  if (finePointer && !reduced) {
    const cursor = $('.cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add('is-on'); });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .card, [data-tilt]'));
    });

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });

    // 3D tilt for the phone
    const tiltWrap = $('[data-tilt]');
    const phone = $('.phone', tiltWrap);
    tiltWrap.addEventListener('mousemove', (e) => {
      const r = tiltWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
    });
    tiltWrap.addEventListener('mouseleave', () => (phone.style.transform = ''));
  }

  /* ---------- Cursor spotlight on cards ---------- */
  const spot = (el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  $$('.card, [data-spotlight]').forEach(spot);

  /* ---------- BLE pairing demo ---------- */
  const bleBtn = $('[data-ble-btn]');
  const bleLog = $('[data-ble-log]');
  const bleChip = $('[data-ble-chip]');
  const radar = $('[data-radar]');
  const log = (text, cls) => {
    const d = document.createElement('div');
    d.textContent = `> ${text}`;
    if (cls) d.className = cls;
    bleLog.append(d);
    while (bleLog.children.length > 6) bleLog.firstChild.remove();
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  let paired = false;
  bleBtn.addEventListener('click', async () => {
    if (paired) {
      paired = false;
      radar.classList.remove('is-ok');
      bleChip.className = 'chip'; bleChip.textContent = 'Idle';
      bleBtn.textContent = 'Pair device';
      log('disconnected');
      return;
    }
    bleBtn.disabled = true;
    bleChip.className = 'chip is-scan'; bleChip.textContent = 'Scanning';
    radar.classList.add('is-scan');
    log('scanning for devices…');
    await wait(900);
    log('found  BP-Monitor-0A3F');
    await wait(600);
    log('connect timeout — retry 1/3', 'warn');
    await wait(800);
    log('auto-reconnect…');
    await wait(700);
    log('bonded · services discovered', 'ok');
    radar.classList.remove('is-scan');
    radar.classList.add('is-ok');
    bleChip.className = 'chip is-ok'; bleChip.textContent = 'Connected';
    bleBtn.disabled = false;
    bleBtn.textContent = 'Disconnect';
    paired = true;
  });

  /* ---------- Project filters ---------- */
  const filters = $$('[data-filter]');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    $$('.card').forEach((card) => {
      const show = f === 'all' || card.dataset.cat.split(' ').includes(f);
      card.classList.toggle('is-hidden', !show);
    });
  }));

  /* ---------- Project modal ---------- */
  const PROJECTS = {
    sathi: {
      play: 'https://play.google.com/store/apps/details?id=com.samplify.pheblo',
      ios: 'https://apps.apple.com/in/app/samplify-phlebo/id6654902760',
      title: 'Samplify Sathi', platforms: 'iOS · Android · Gosamplify',
      desc: 'Field-force management for phlebotomy operations, used by thousands of concurrent users.',
      problem: 'Field staff had to pair BLE medical devices quickly and reliably, in real-world conditions, without the app getting in the way.',
      build: 'A reusable BLE module with auto-connect, retry and manual fallback — cutting device pairing time by 90%. Swift and Kotlin native modules handle BLE state, permissions and background tasks.',
      tags: ['React Native', 'BLE', 'Swift', 'Kotlin', 'Firebase', 'Redux Toolkit'],
    },
    sarthi: {
      play: 'https://play.google.com/store/apps/details?id=com.samplify&hl=en-IN',
      ios: 'https://apps.apple.com/in/app/sarthi-runner/id6566180771',
      title: 'Samplify Sarthi', platforms: 'iOS · Android · Gosamplify',
      desc: 'Logistics and sample-tracking platform for field operations.',
      problem: 'Samples have to be tracked end-to-end even where network coverage is patchy.',
      build: 'Real-time sync with a custom offline layer, plus a release process combining Crashlytics + Sentry monitoring and an OTA pipeline for same-day hotfixes — sustaining a 99.51% crash-free rate.',
      tags: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'CodePush'],
    },
    phelans: {
      play: 'https://play.google.com/store/apps/details?id=com.phelans&hl=en-IN',
      title: 'Phelans Pharmacy', platforms: 'Android · Appinventiv',
      desc: 'Production healthcare e-commerce app for medicine delivery.',
      problem: 'A catalog of thousands of SKUs had to stay fast across cart, profile and inventory flows.',
      build: 'Redux Toolkit state architecture for cart, profile and inventory without performance regressions, and a migration from class components to functional components and custom hooks.',
      tags: ['Redux Toolkit', 'Firestore', 'Hooks'],
    },
    lokbest: {
      play: 'https://play.google.com/store/apps/details?id=com.lokbest&hl=en-IN',
      ios: 'https://apps.apple.com/in/app/lokbest/id1571909931',
      title: 'LokBest', platforms: 'iOS · Android · Allin Info Systems',
      desc: 'Grocery commerce app.',
      problem: 'Onboarding friction and limited visibility into how users moved through the app.',
      build: 'Google and Facebook OAuth onboarding to improve login success, and Firebase Analytics instrumented with an event taxonomy designed alongside product.',
      tags: ['OAuth', 'Firebase Analytics'],
    },
    swagmee: {
      play: 'https://play.google.com/store/apps/details?id=com.swagmee&hl=en-IN',
      title: 'Swagmee Salon', platforms: 'Android · Allin Info Systems',
      desc: 'At-home salon services platform.',
      problem: 'Booking and paying for services at home needed a smooth, trustworthy checkout.',
      build: 'End-to-end Razorpay payments, Google / Facebook OAuth, and pixel-perfect UI implemented from Figma.',
      tags: ['Razorpay', 'OAuth', 'Figma → RN'],
    },
  };
  const modal = $('[data-modal]');
  const openProject = (id) => {
    const p = PROJECTS[id];
    if (!p) return;
    $('[data-m-title]', modal).textContent = p.title;
    $('[data-m-platforms]', modal).textContent = p.platforms;
    $('[data-m-desc]', modal).textContent = p.desc;
    $('[data-m-problem]', modal).textContent = p.problem;
    $('[data-m-build]', modal).textContent = p.build;
    const tags = $('[data-m-tags]', modal);
    tags.replaceChildren(...p.tags.map((t) => Object.assign(document.createElement('span'), { textContent: t })));
    const stores = $('[data-m-stores]', modal);
    const mk = (href, label) => Object.assign(document.createElement('a'), { href, textContent: label, className: 'btn btn--small', target: '_blank', rel: 'noopener' });
    stores.replaceChildren(...[p.play && mk(p.play, 'Get it on Google Play ↗'), p.ios && mk(p.ios, 'Download on the App Store ↗')].filter(Boolean));
    modal.showModal();
  };
  $$('[data-open-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.openProject)));
  $('[data-close]', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

  /* ---------- Experience accordion ---------- */
  $$('.job__head').forEach((head) => head.addEventListener('click', () => {
    const job = head.parentElement;
    const open = !job.classList.contains('is-open');
    job.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', open);
  }));

  /* ---------- Copy email ---------- */
  const copyEmail = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Email copied to clipboard'); }
    catch (e) { toast(text); }
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copyEmail(b.dataset.copy)));

  /* ---------- Command palette (⌘K / Ctrl+K) ---------- */
  const palette = $('[data-palette]');
  const input = $('[data-palette-input]');
  const list = $('[data-palette-list]');
  const go = (sel) => () => $(sel).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  const COMMANDS = [
    { label: 'Go to work', hint: 'section', run: go('#work') },
    { label: 'Go to experience', hint: 'section', run: go('#experience') },
    { label: 'Go to skills', hint: 'section', run: go('#skills') },
    { label: 'Go to contact', hint: 'section', run: go('#contact') },
    { label: 'Copy email address', hint: 'action', run: () => copyEmail('kayyoomali17@gmail.com') },
    { label: 'Send an email', hint: 'action', run: () => (location.href = 'mailto:kayyoomali17@gmail.com') },
    { label: 'Download résumé', hint: 'action', run: () => $('a[download]').click() },
    { label: 'Open LinkedIn', hint: 'link', run: () => open('https://www.linkedin.com/in/kayyoom-ali-bb989319b/', '_blank', 'noopener') },
    { label: 'Open GitHub', hint: 'link', run: () => open('https://github.com/techAli17', '_blank', 'noopener') },
    { label: 'Toggle light / dark theme', hint: 'theme', run: toggleTheme },
    ...Object.entries(ACCENTS).map(([name, hex]) => ({ label: `Accent: ${name}`, hint: 'theme', swatch: hex, run: () => setAccent(name) })),
    ...Object.entries(PROJECTS).map(([id, p]) => ({ label: `Open ${p.title}`, hint: 'project', run: () => openProject(id) })),
  ];
  let filtered = COMMANDS, sel = 0;
  const render = () => {
    list.replaceChildren(...filtered.map((c, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === sel);
      const label = document.createElement('span');
      if (c.swatch) {
        const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = c.swatch; label.append(sw);
      }
      label.append(c.label);
      const hint = document.createElement('span'); hint.className = 'hint'; hint.textContent = c.hint;
      li.append(label, hint);
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; render(); } });
      li.addEventListener('click', () => runCmd(c));
      return li;
    }));
    const active = list.children[sel];
    if (active) active.scrollIntoView({ block: 'nearest' });
  };
  const runCmd = (c) => { palette.close(); setTimeout(c.run, 50); };
  const openPalette = () => {
    if (modal.open) modal.close();
    input.value = ''; filtered = COMMANDS; sel = 0; render();
    palette.showModal(); input.focus();
  };
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.hint.includes(q));
    sel = 0; render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
    else if (e.key === 'Enter' && filtered[sel]) { e.preventDefault(); runCmd(filtered[sel]); }
  });
  palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });
  $$('[data-open-palette]').forEach((b) => b.addEventListener('click', openPalette));
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.open ? palette.close() : openPalette();
    }
  });
})();
