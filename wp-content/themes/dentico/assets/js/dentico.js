/* Dentico&Rehabilis - kierunek C. Vanilla JS, bez zależności. Wartości w stylach zawsze całkowite (px). */
document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- header: chowanie przy scrollu w dół ---------- */
const hdr = $('.hdr'); let lastY = scrollY;
const anyOpen = () => !!$('.mega.is-open');
addEventListener('scroll', () => {
  const y = scrollY;
  if (!anyOpen()) hdr.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
  if (y < lastY - 4) hdr.classList.remove('is-hidden');
  lastY = y;
}, { passive: true });

/* ---------- mega menu ---------- */
const scrim = $('.nav-scrim'); const btns = $$('[data-mega]'); let tOpen, tClose;
const closeMega = (focusBtn) => { btns.forEach(b => { b.setAttribute('aria-expanded', 'false'); $('#' + b.dataset.mega).classList.remove('is-open'); }); scrim.classList.remove('is-open'); if (focusBtn) focusBtn.focus(); };
const openMega = (b) => { btns.forEach(x => { if (x !== b) { x.setAttribute('aria-expanded', 'false'); $('#' + x.dataset.mega).classList.remove('is-open'); } }); b.setAttribute('aria-expanded', 'true'); $('#' + b.dataset.mega).classList.add('is-open'); scrim.classList.add('is-open'); };
btns.forEach(b => {
  const panel = $('#' + b.dataset.mega);
  b.addEventListener('click', () => b.getAttribute('aria-expanded') === 'true' ? closeMega() : openMega(b));
  b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMega(b); $('a', panel)?.focus(); } });
  if (matchMedia('(hover: hover)').matches) {
    const enter = () => { clearTimeout(tClose); clearTimeout(tOpen); tOpen = setTimeout(() => openMega(b), anyOpen() ? 0 : 120); };
    const leave = () => { clearTimeout(tOpen); tClose = setTimeout(() => closeMega(), 240); };
    b.addEventListener('pointerenter', enter); b.addEventListener('pointerleave', leave);
    panel.addEventListener('pointerenter', () => clearTimeout(tClose)); panel.addEventListener('pointerleave', leave);
  }
});
scrim.addEventListener('click', () => closeMega());
document.addEventListener('keydown', e => { if (e.key === 'Escape' && anyOpen()) closeMega($('[data-mega][aria-expanded="true"]')); });
document.addEventListener('focusin', e => { if (anyOpen() && !e.target.closest('.mega, [data-mega]')) closeMega(); });

/* ---------- szuflada (2 poziomy) ---------- */
const drawer = $('#drawer'), burger = $('.burger');
drawer.inert = true;
const setDrawer = (open) => {
  drawer.classList.toggle('is-open', open); drawer.inert = !open; burger.setAttribute('aria-expanded', String(open));
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (open) setTimeout(() => $('[data-close-drawer]', drawer).focus(), 40);
  else { drawer.classList.remove('is-sub'); $$('.drawer__panel[data-level="2"]', drawer).forEach(p => p.classList.remove('is-active')); burger.focus(); }
};
burger.addEventListener('click', () => setDrawer(true));
$('[data-close-drawer]', drawer).addEventListener('click', () => setDrawer(false));
$$('[data-sub]', drawer).forEach(b => b.addEventListener('click', () => { const p = $('#' + b.dataset.sub); p.classList.add('is-active'); drawer.classList.add('is-sub'); setTimeout(() => $('.drawer__back', p).focus(), 400); }));
$$('.drawer__back', drawer).forEach(b => b.addEventListener('click', () => { const p = b.closest('.drawer__panel'); drawer.classList.remove('is-sub'); setTimeout(() => { p.classList.remove('is-active'); $(`[data-sub="${p.id}"]`, drawer).focus(); }, 400); }));
$$('a', drawer).forEach(a => a.addEventListener('click', () => { if (!a.hasAttribute('data-book')) setDrawer(false); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false); });

/* ---------- modal „Umów wizytę” ---------- */
const modal = $('#book');
const steps = $$('.modal__steps i', modal);
const show = (step, branch) => {
  $$('.modal__step', modal).forEach(s => { s.hidden = !(s.dataset.step === String(step) && (!s.dataset.branch || s.dataset.branch === branch)); });
  steps.forEach((i, n) => i.classList.toggle('on', n < step));
  const h = $('.modal__step:not([hidden]) h2', modal); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
};

/* ---------- rejestracja na fizjoterapię: kalendarz Medfile (ten sam widżet co na obecnej stronie) ---------- */
const MEDFILE_JS = 'https://rejestracja.medfile.pl/js/register.widget.js';
const loadMedfile = () => {
  const holder = $('[data-medfile-holder]', modal);
  const own = document.getElementById('medfile-register-widget');
  if (own && !holder.contains(own)) { modal.close(); own.scrollIntoView({ behavior: 'smooth' }); return; } // strona ma własny kalendarz
  if (own) return; // już załadowany w modalu
  const w = document.createElement('div');
  w.id = 'medfile-register-widget'; w.dataset.src = holder.dataset.src; w.dataset.tracker = holder.dataset.tracker || '';
  const s = document.createElement('script');
  s.src = MEDFILE_JS; s.async = true;
  s.onload = () => { holder.replaceChildren(w); if (window.medfile20_Register) window.medfile20_Register(); };
  s.onerror = () => { $('p', holder).textContent = 'Nie udało się wczytać kalendarza. Otwórz go w nowej karcie poniżej albo zadzwoń.'; };
  document.head.appendChild(s);
};
window.addEventListener('medfile', e => { (window.dataLayer = window.dataLayer || []).push({ event: 'medfile', medfile: e.detail && e.detail.data }); });
$$('[data-book]').forEach(b => b.addEventListener('click', e => {
  e.preventDefault();
  if (drawer.classList.contains('is-open')) setDrawer(false);
  closeMega(); modal.showModal(); document.documentElement.style.overflow = 'hidden';
  const d = b.dataset.book; const ctx = b.dataset.ctx || '';
  $$('[data-ctx]', modal).forEach(p => { p.hidden = !ctx; p.textContent = ctx ? 'Twój wybór: ' + ctx : ''; });
  $$('input[name="powod"]').forEach(i => { i.value = ctx; });
  d ? show(2, d) : show(1);
  if (d === 'fizjo') loadMedfile();
}));
modal.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
$$('[data-go]', modal).forEach(b => b.addEventListener('click', () => { show(2, b.dataset.go); if (b.dataset.go === 'fizjo') loadMedfile(); }));
$$('[data-back]', modal).forEach(b => b.addEventListener('click', () => show(1)));
$$('[data-close-modal]', modal).forEach(b => b.addEventListener('click', () => modal.close()));
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

/* ---------- walidacja formularzy (modal i blok rozmowy) ---------- */
$$('form[data-validate]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault(); let first = null;
  $$('[required]', f).forEach(i => {
    const box = i.closest('.field, .check');
    const bad = i.type === 'checkbox' ? !i.checked : (i.type === 'tel' ? i.value.replace(/\D/g, '').length < 9 : !i.value.trim());
    box.classList.toggle('is-error', bad); if (bad && !first) first = i;
  });
  if (first) { first.focus(); return; }
  if (f.closest('#book')) show(3, 'done');
  else { f.hidden = true; const d = $('.contact__done'); d.hidden = false; $('.h3', d).focus(); }
}));
$$('form[data-validate] [required]').forEach(i => i.addEventListener('input', () => i.closest('.field, .check').classList.remove('is-error')));

/* ---------- pasek mobilny: po hero, znika nad stopką ---------- */
const mbar = $('.mbar');
if (mbar) {
  let past = false, foot = false; const upd = () => mbar.classList.toggle('on', past && !foot);
  const top = $('.hero, .phead, .sys');
  if (top) new IntersectionObserver(([e]) => { past = !e.isIntersecting; upd(); }).observe(top); else past = true;
  new IntersectionObserver(([e]) => { foot = e.isIntersecting; upd(); }).observe($('.ftr'));
}

/* ---------- przed/po ---------- */
$$('.ba__range').forEach(r => { const set = () => r.closest('.ba').style.setProperty('--pos', Math.round(r.value) + '%'); r.addEventListener('input', set); set(); });

/* ---------- wejścia sekcji ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const sib = $$(':scope > .rv', e.target.parentElement);
  e.target.style.transitionDelay = Math.min(sib.indexOf(e.target), 4) * 80 + 'ms';
  e.target.classList.add('in'); io.unobserve(e.target);
}), { rootMargin: '0px 0px -80px 0px' });
$$('.rv').forEach(el => io.observe(el));

/* ---------- zakładki (działy) z klawiaturą ---------- */
const tabGroup = (tabs, onSelect) => tabs.forEach((t, i) => {
  t.addEventListener('click', () => onSelect(t));
  t.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; onSelect(n); n.focus(); }
  });
});
const deptTabs = $$('.tab');
tabGroup(deptTabs, t => deptTabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }));

/* ---------- mapa ciała: punkty i chipy (mobile) sterują tym samym panelem ---------- */
const spots = $$('.spot'), condChips = $$('.map__list button');
const selectCond = id => {
  spots.forEach(s => { const on = s.getAttribute('aria-controls') === 'cond-' + id; s.setAttribute('aria-selected', on); s.tabIndex = on ? 0 : -1; });
  condChips.forEach(c => c.setAttribute('aria-selected', c.dataset.cond === id));
  $$('.cond').forEach(p => p.hidden = p.id !== 'cond-' + id);
};
tabGroup(spots, s => selectCond(s.getAttribute('aria-controls').slice(5)));
condChips.forEach(c => c.addEventListener('click', () => selectCond(c.dataset.cond)));

/* ---------- efekty: przełącznik pacjentów ---------- */
const caseBtns = $$('[data-case]');
tabGroup(caseBtns, b => caseBtns.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#case-' + x.dataset.case).hidden = !on; $('#ba-' + x.dataset.case).hidden = !on; }));

/* ---------- film: YouTube ładowany dopiero po kliknięciu ---------- */
$$('.video__play').forEach(b => b.addEventListener('click', () => {
  const v = b.closest('.video');
  v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" title="${v.dataset.title || 'Film kliniki Dentico&Rehabilis'}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}));

/* ---------- status otwarcia (godziny kliniki) ---------- */
const openEl = $('[data-open]');
if (openEl) {
  const HRS = { 1: [8, 19], 2: [8, 19], 3: [8, 19], 4: [8, 19], 5: [8, 17] };
  const DAY = ['niedzielę', 'poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę'];
  const upd = () => {
    const n = new Date(), d = n.getDay(), h = n.getHours() + n.getMinutes() / 60, t = HRS[d];
    let txt;
    if (t && h >= t[0] && h < t[1]) { txt = `Otwarte, do ${t[1]}:00`; openEl.classList.add('is-open'); }
    else {
      openEl.classList.remove('is-open');
      if (t && h < t[0]) txt = `Otwieramy dziś o ${t[0]}:00`;
      else { let k = 1; while (!HRS[(d + k) % 7]) k++; const nd = (d + k) % 7; txt = k === 1 ? `Otwieramy jutro o ${HRS[nd][0]}:00` : `Otwieramy w ${DAY[nd]} o ${HRS[nd][0]}:00`; }
    }
    $('span', openEl).textContent = txt;
  };
  upd(); setInterval(upd, 60000);
}

/* ---------- quiz „Od czego zacząć?” ---------- */
const quiz = $('[data-quiz]');
if (quiz) {
  const R = {
    zab: ['Przegląd z planem leczenia', 'Lekarz zbada ząb, w razie potrzeby zrobi zdjęcie RTG na miejscu i zaproponuje leczenie z kosztorysem.', 'lekarz dentysta', '30-60 min', '150 zł', 'stom'],
    estetyka: ['Konsultacja estetyczna', 'Omówimy, co chcesz zmienić, i pokażemy możliwości: bonding, licówki, wybielanie. Plan z ceną dostajesz na piśmie.', 'lekarz dentysta', 'ok. 45 min', 'przegląd 150 zł', 'stom'],
    brak: ['Konsultacja implantologiczna', 'Ocena kości na zdjęciach i plan uzupełnienia braku: implant, most lub proteza, z porównaniem kosztów.', 'implantolog', 'ok. 45 min', '350 zł', 'stom'],
    glowa: ['Konsultacja stawu skroniowo-żuchwowego', 'Stomatolog ocenia zgryz i staw, a w razie potrzeby od razu włącza fizjoterapeutę. To najlepszy start przy bólach głowy i szumach.', 'stomatolog i fizjoterapeuta', '45-60 min', '350-550 zł', 'help'],
    kregoslup: ['Pierwsza wizyta u fizjoterapeuty', 'Wywiad, badanie ruchu i postawy oraz pierwsza terapia na tej samej wizycie. Bez skierowania.', 'fizjoterapeuta', '45-60 min', '200-350 zł', 'fizjo'],
    dziecko: ['Wizyta dziecka: zęby i zgryz', 'Spokojna wizyta adaptacyjna albo konsultacja ortodontyczna. Sprawdzimy też oddech i postawę.', 'stomatolog dziecięcy, ortodonta', 'ok. 30 min', 'od 200 zł', 'stom']
  };
  const steps = $$('[data-q]', quiz), dots = $$('.quiz__dots li', quiz);
  const go = n => { steps.forEach(s => s.hidden = s.dataset.q !== String(n)); dots.forEach((d, i) => d.classList.toggle('on', i < n)); const f = $(`[data-q="${n}"] input, [data-q="${n}"] .h2`, quiz); f?.focus?.({ preventScroll: true }); };
  $$('input[name="q1"]', quiz).forEach(i => i.addEventListener('change', () => setTimeout(() => go(2), 200)));
  $$('input[name="q2"]', quiz).forEach(i => i.addEventListener('change', () => setTimeout(() => {
    const a = $('input[name="q1"]:checked', quiz).value, b = i.value, r = R[a];
    const set = (k, v) => { $(`[data-r="${k}"]`, quiz).textContent = v; };
    set('title', r[0]); set('desc', r[1]); set('who', r[2]); set('time', r[3]); set('price', r[4]);
    $('[data-r="urgent"]', quiz).hidden = !(b === 'teraz' && (a === 'zab' || a === 'glowa'));
    const cta = $('[data-r="cta"]', quiz); cta.dataset.book = r[5]; cta.dataset.ctx = `${r[0]} (${r[4]})`; cta.textContent = 'Umów: ' + r[0].toLowerCase();
    go(3);
  }, 200)));
  $('[data-quiz-back]', quiz).addEventListener('click', () => go(1));
  $('[data-quiz-reset]', quiz).addEventListener('click', () => { $$('input', quiz).forEach(i => i.checked = false); go(1); });
}

/* ---------- autotest objawów w mapie ---------- */
$$('[data-selfcheck]').forEach(list => {
  const cond = list.closest('.cond'), res = $('.cond__res', cond), name = $('.h3', cond).textContent;
  const btn = $('.cond__actions .btn--dark', cond); btn.dataset.ctx = name;
  list.addEventListener('change', () => {
    const n = $$('input:checked', list).length;
    cond.classList.toggle('is-match', n >= 2);
    res.hidden = n === 0;
    const all = $$('input', list).length;
    res.innerHTML = n >= 2 ? `<b>${n} z ${all} objawów.</b> To typowy obraz tej dolegliwości. Warto zacząć od konsultacji.` : 'Jeden objaw nie przesądza o niczym. Jeśli się utrzymuje, skonsultuj go.';
    btn.dataset.ctx = `${name}, zaznaczone objawy: ${n} z ${all}`;
  });
});

/* ---------- kalkulator kosztu ---------- */
const calc = $('[data-calc]');
if (calc) {
  const fmt = v => v.toLocaleString('pl-PL').replace(/ /g, ' ');
  const total = $('[data-total]', calc), rata = $('[data-rata]', calc), cta = $('.btn--dark', calc);
  const upd = () => {
    let lo = 0, hi = 0; const names = [];
    $$('.calc__list li', calc).forEach(li => {
      const c = $('input', li), q = $('.qty', li), n = q ? +$('output', q).textContent : 1;
      if (q) q.hidden = !c.checked;
      if (c.checked) { lo += +c.dataset.min * n; hi += +c.dataset.max * n; names.push($('span', li).textContent + (n > 1 ? ` x${n}` : '')); }
    });
    total.textContent = lo === hi ? `${fmt(lo)} zł` : `${fmt(lo)}-${fmt(hi)} zł`;
    rata.hidden = hi < 1000;
    cta.dataset.ctx = names.length ? `kosztorys: ${names.join(', ')} (${total.textContent})` : '';
  };
  calc.addEventListener('change', upd);
  $$('.qty button', calc).forEach(b => b.addEventListener('click', () => { const o = $('output', b.parentElement); o.textContent = Math.min(8, Math.max(1, +o.textContent + +b.dataset.step)); upd(); }));
  upd();
}

/* ---------- CF7: po wysłaniu - podziękowanie w modalu / w sekcji kontaktu ---------- */
document.addEventListener('wpcf7mailsent', e => {
  const form = e.target;
  if (form.closest('#book')) { show(3, 'done'); return; }
  const box = form.closest('.contact__form');
  if (box) { const w = form.closest('.wpcf7'); if (w) w.hidden = true; const d = $('.contact__done', box); if (d) { d.hidden = false; $('.h3', d)?.focus(); } }
});

/* ---------- podstrony: filtr zespołu ---------- */
$$('[data-filter-root]').forEach(root => {
  const btns = $$('[data-filter]', root);
  btns.forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.filter;
    btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.person', root).forEach(p => { p.hidden = !!g && p.dataset.grupa !== g; });
  }));
});

/* ---------- podstrony: cennik (zakładki, wyszukiwarka, skróty grup) ---------- */
const prices = $('[data-prices]');
if (prices) {
  const q = $('[data-price-search]', prices), empty = $('[data-price-empty]', prices);
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  const panel = () => $('[role="tabpanel"]:not([hidden])', prices);
  const filter = () => {
    const v = norm(q.value.trim()); let hits = 0;
    $$('.pgrp', panel()).forEach(g => {
      let n = 0;
      $$('.ptable li', g).forEach(li => { const ok = !v || norm(li.textContent).includes(v); li.hidden = !ok; if (ok) n++; });
      g.hidden = n === 0; if (v && n) g.open = true; hits += n;
    });
    empty.hidden = hits > 0;
  };
  const sync = () => {
    const id = panel().id.replace('ceny-', '');
    $$('[data-jump]', prices).forEach(n => { n.hidden = n.dataset.jump !== id; });
    filter();
  };
  q.addEventListener('input', filter);
  $$('.tab', prices).forEach(t => t.addEventListener('click', sync));
  $$('[data-jump] a', prices).forEach(a => a.addEventListener('click', () => { const g = $(a.getAttribute('href')); if (g) g.open = true; }));
  const want = location.hash.replace('#', '');
  const tab = want && $(`#tab-${want}`, prices);
  if (tab) tab.click();
}

/* ---------- podstrony: godziny, dziś wyróżnione ---------- */
$$('[data-hours] [data-days]').forEach(r => { const d = new Date().getDay() || 7; r.classList.toggle('is-today', r.dataset.days.split(',').includes(String(d))); });

/* ---------- podstrony: aktywny punkt spisu treści ---------- */
const tocLinks = $$('.toc a[href^="#"]');
if (tocLinks.length && 'IntersectionObserver' in window) {
  const map = new Map(tocLinks.map(a => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
  const tio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    tocLinks.forEach(a => a.classList.remove('is-on'));
    map.get(e.target.id)?.classList.add('is-on');
  }), { rootMargin: '-120px 0px -70% 0px' });
  map.forEach((a, id) => { const h = document.getElementById(id); if (h) tio.observe(h); });
}

/* ---------- galeria: spacer 360 ładowany po kliknięciu ---------- */
const pano = $('[data-pano-box]');
if (pano) {
  let cur = $('[data-pano][aria-pressed="true"]')?.dataset.pano, loaded = false;
  const load = () => { pano.innerHTML = `<iframe src="${cur}" title="Wirtualny spacer po klinice Dentico&Rehabilis" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`; loaded = true; };
  $('[data-pano-load]', pano).addEventListener('click', load);
  $$('[data-pano]').forEach(b => b.addEventListener('click', () => {
    $$('[data-pano]').forEach(x => x.setAttribute('aria-pressed', x === b));
    cur = b.dataset.pano; load();
  }));
}

/* ---------- spis treści: na telefonie i tablecie zwinięty ---------- */
if (window.innerWidth < 1200) $$('details.toc').forEach(d => { d.open = false; });


/* ---------- reCAPTCHA v3 (gdy klucze ustawione w panelu): token w ukrytym polu formularzy CF7, odświeżany ---------- */
const rcKey = document.documentElement.dataset.recaptchaKey;
if (rcKey) {
  const fill = () => window.grecaptcha && grecaptcha.ready(() => grecaptcha.execute(rcKey, { action: 'dentico_form' }).then(t => $$('input[name="g-recaptcha-response"]').forEach(i => { i.value = t; })));
  const wait = setInterval(() => { if (window.grecaptcha) { clearInterval(wait); fill(); setInterval(fill, 90000); } }, 300);
  document.addEventListener('wpcf7submit', fill);
}

/* Stopka „Ustawienia cookies": otwiera baner Complianz (jego ukryty przycisk „Zarządzaj zgodą"); bez Complianz zostaje zwykły link do polityki cookies. */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-cookie-settings]');
  const btn = a && document.querySelector('#cmplz-manage-consent .cmplz-manage-consent');
  if (!btn) return;
  e.preventDefault();
  btn.click();
});

/* Licznik w pasku zaufania (np. ocena 4,8): od zera do wartości przy wejściu w widok; bez animacji przy „ogranicz ruch”. */
(() => {
  const els = $$('[data-count]');
  if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const fmt = (v, d) => v.toFixed(d).replace('.', ',');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1400;
    const step = t => { const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * ease, d); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  els.forEach(el => io.observe(el));
})();

/* Przycisk telefonu (prawy dolny róg, desktop): pojawia się po zjechaniu z hero, otwiera panel z dwoma numerami (klik / Enter, Esc i klik obok zamykają). */
(() => {
  const fab = $('[data-fab]');
  if (!fab) return;
  const btn = $('.fab__btn', fab), panel = $('.fab__panel', fab);
  const set = open => { btn.setAttribute('aria-expanded', open); panel.hidden = !open; };
  btn.addEventListener('click', () => set(panel.hidden));
  document.addEventListener('click', e => { if (!fab.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  // chowany także przy dole strony: w stopce są te same numery, a przycisk zasłaniałby ikony social w prawym rogu
  const bar = $('.ftr__nap') || $('.ftr');
  const onScroll = () => { const on = scrollY > 480 && (!bar || bar.getBoundingClientRect().top > innerHeight - 96); fab.classList.toggle('is-on', on); if (!on) set(false); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
