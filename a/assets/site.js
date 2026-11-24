// Visit Plzeňský kraj, proposal A. Small, dependency-free behaviours.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const BASE = document.documentElement.dataset.base || '/';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // toast
  const toast = $('#toast');
  let tt;
  window.vpkToast = msg => { if (!toast) return; toast.textContent = msg; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 3200); };

  // drawer
  const drawer = $('#drawer');
  $$('[data-open-drawer]').forEach(b => b.addEventListener('click', () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; }));
  $$('[data-close-drawer]').forEach(b => b.addEventListener('click', () => { drawer.classList.remove('open'); document.body.style.overflow = ''; }));

  // saved ("Moje inspirace")
  const saved = new Set(store.get('vpk-saved', []));
  const paint = () => {
    $$('.save').forEach(b => { const on = saved.has(b.dataset.id); b.setAttribute('aria-pressed', on); const i = b.querySelector('i'); i.className = (on ? 'ph-fill' : 'ph') + ' ph-heart'; });
    $$('[data-saved-count]').forEach(c => c.textContent = saved.size || '');
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.save'); if (!b) return;
    e.preventDefault();
    const id = b.dataset.id;
    if (saved.has(id)) { saved.delete(id); vpkToast('Odebráno z Moje inspirace'); } else { saved.add(id); vpkToast('Uloženo do Moje inspirace'); }
    store.set('vpk-saved', [...saved]); paint();
  });
  paint();

  // reveal on view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  // filters on listings (chips with data-filter, cards with data-tags)
  $$('[data-filter-group]').forEach(group => {
    const target = $(group.dataset.filterGroup);
    const empty = $(group.dataset.empty || '#none');
    group.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      $$('[data-filter]', group).forEach(x => x.setAttribute('aria-pressed', x === b));
      const f = b.dataset.filter; let n = 0;
      $$('[data-tags]', target).forEach(c => { const ok = f === '*' || c.dataset.tags.split(' ').includes(f); c.hidden = !ok; if (ok) n++; });
      if (empty) empty.classList.toggle('show', n === 0);
      const cnt = $('[data-shown]'); if (cnt) cnt.textContent = n;
    });
  });

  // stories hover (home)
  const stage = $('.stories .stage');
  if (stage) $$('.story').forEach((s, i) => {
    const on = () => { $$('img', stage).forEach((im, j) => im.classList.toggle('on', i === j)); $$('.story').forEach(x => x.classList.toggle('on', x === s)); };
    s.addEventListener('mouseenter', on); s.addEventListener('focus', on);
  });

  // read more
  $$('[data-clamp]').forEach(p => {
    if (p.scrollHeight < 420) return;
    p.classList.add('clamped');
    const b = document.createElement('button'); b.className = 'more-btn'; b.type = 'button';
    b.innerHTML = 'Číst celý text <i class="ph ph-caret-down"></i>';
    b.onclick = () => { p.classList.remove('clamped'); b.remove(); };
    p.after(b);
  });

  // lightbox
  const lb = $('#lb');
  if (lb) {
    const items = $$('[data-lb]');
    let idx = 0;
    const img = $('img', lb), cap = $('figcaption', lb);
    const show = i => { idx = (i + items.length) % items.length; const it = items[idx]; img.src = it.dataset.lb; img.alt = it.dataset.alt || ''; cap.textContent = `${idx + 1} / ${items.length}${it.dataset.cap ? '   ' + it.dataset.cap : ''}`; };
    const open = i => { show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.x', lb).focus(); };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    items.forEach((it, i) => it.addEventListener('click', () => open(Number(it.dataset.i ?? i))));
    $('.x', lb).onclick = close; $('.pv', lb).onclick = () => show(idx - 1); $('.nx', lb).onclick = () => show(idx + 1);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    let sx = null; lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  }

  // share
  $$('[data-share]').forEach(b => b.addEventListener('click', async () => {
    try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); vpkToast('Odkaz zkopírován'); } } catch {}
  }));

  // inquiry dialog (demo: does not send)
  const dlg = $('#inquiry');
  if (dlg) {
    $$('[data-inquiry]').forEach(b => b.addEventListener('click', () => { const v = b.dataset.inquiry; const f = $('[name=venue]', dlg); if (f) f.value = v || ''; dlg.showModal(); }));
    $('.x', dlg)?.addEventListener('click', () => dlg.close());
    $('form', dlg).addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target; let ok = true;
      $$('[required]', f).forEach(inp => { const bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value)); inp.setAttribute('aria-invalid', bad); const er = inp.parentElement.querySelector('.err'); if (er) er.hidden = !bad; if (bad) ok = false; });
      if (!ok) return;
      dlg.close(); f.reset(); vpkToast('Návrh: poptávka se v ukázce neodesílá. Na webu půjde rovnou do Convention Bureau.');
    });
  }
  $$('form[data-demo]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); vpkToast(f.dataset.demo); f.reset(); }));

  // venue finder
  const vf = $('#venue-finder');
  if (vf) {
    const state = { area: '*', cap: 0, beds: false, type: '*', q: '' };
    const cards = $$('.vcard', $('#venues'));
    const apply = () => {
      let n = 0;
      cards.forEach(c => {
        const d = c.dataset;
        const ok = (state.area === '*' || d.area === state.area) && Number(d.cap) >= state.cap && (!state.beds || Number(d.beds) > 0)
          && (state.type === '*' || d.types.split('|').includes(state.type)) && (!state.q || d.search.includes(state.q));
        c.hidden = !ok; if (ok) n++;
      });
      $('#vcount').textContent = n; $('#vempty').classList.toggle('show', n === 0);
    };
    $('#f-area').addEventListener('change', e => { state.area = e.target.value; apply(); });
    $('#f-type').addEventListener('change', e => { state.type = e.target.value; apply(); });
    $('#f-beds').addEventListener('change', e => { state.beds = e.target.checked; apply(); });
    $('#f-q').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''); apply(); });
    $$('#f-cap button').forEach(b => b.addEventListener('click', () => { $$('#f-cap button').forEach(x => x.setAttribute('aria-pressed', x === b)); state.cap = Number(b.dataset.cap); apply(); }));
    $('#f-reset').addEventListener('click', () => { Object.assign(state, { area: '*', cap: 0, beds: false, type: '*', q: '' }); $('#f-area').value = '*'; $('#f-type').value = '*'; $('#f-beds').checked = false; $('#f-q').value = ''; $$('#f-cap button').forEach((x, i) => x.setAttribute('aria-pressed', i === 0)); apply(); });
    $('#vsort').addEventListener('change', e => {
      const k = e.target.value, wrap = $('#venues');
      cards.sort((a, b) => k === 'name' ? a.dataset.name.localeCompare(b.dataset.name, 'cs') : Number(b.dataset[k]) - Number(a.dataset[k])).forEach(c => wrap.appendChild(c));
    });
    const qs = new URLSearchParams(location.search);
    if (qs.get('typ')) { $('#f-type').value = qs.get('typ'); state.type = qs.get('typ'); apply(); }
  }

  // search overlay
  const so = $('#search');
  if (so) {
    let index = null;
    const input = $('input', so), list = $('ul', so), hint = $('.hint', so);
    const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const open = q => { so.classList.add('open'); document.body.style.overflow = 'hidden'; input.value = q || ''; input.focus(); load().then(run); };
    const close = () => { so.classList.remove('open'); document.body.style.overflow = ''; };
    const load = async () => { if (!index) { try { index = await (await fetch(BASE + 'search.json')).json(); } catch { index = []; } } return index; };
    const run = () => {
      if (!index) { load().then(run); return; }
      const q = norm(input.value.trim());
      if (!q) { list.innerHTML = ''; hint.textContent = 'Zkuste třeba: hrad, pivovar, jezero, děti, konference'; hint.hidden = false; return; }
      const terms = q.split(/\s+/);
      const res = index.filter(it => terms.every(t => it.s.includes(t))).slice(0, 12);
      hint.hidden = res.length > 0; hint.textContent = 'Nic jsme nenašli. Zkuste jiné slovo nebo projděte Tipy na zážitky.';
      list.innerHTML = res.map(r => `<li><a href="${BASE}${r.u}"><img src="${BASE}${r.i}" alt="" loading="lazy"><span><b>${r.t}</b><small>${r.c}</small></span></a></li>`).join('');
    };
    input.addEventListener('input', run);
    $$('[data-open-search]').forEach(b => b.addEventListener('click', () => open()));
    $$('form[data-search]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); open($('input', f).value); }));
    so.addEventListener('click', e => { if (e.target === so) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && so.classList.contains('open')) close();
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
  }
})();
