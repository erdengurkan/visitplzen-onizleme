// Maps (Leaflet + markercluster). Loaded only on pages that contain [data-map].
(() => {
  const els = document.querySelectorAll('[data-map]');
  if (!els.length || !window.L) return;
  const BASE = document.documentElement.dataset.base || '/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let dataP;
  const data = () => dataP || (dataP = fetch(BASE + 'places.json').then(r => r.json()));
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1d6a44';
  const base = el => {
    const m = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on('focus', () => m.scrollWheelZoom.enable());
    m.on('blur', () => m.scrollWheelZoom.disable());
    return m;
  };
  const region = (m, d) => L.polygon(d.region, { color: accent(), weight: 2, fillOpacity: 0.035, interactive: false }).addTo(m);
  const icon = (p, kind = '') => L.divIcon({ className: 'mk ' + kind, iconSize: null, html: `<span class="mk-in"><img src="${BASE + p.i}" alt=""><b>${esc(p.t.split(',')[0])}</b></span>` });
  const vIcon = () => L.divIcon({ className: 'mk-v', iconSize: [30, 30], html: '<i class="ph ph-buildings"></i>' });
  const popup = p => `<a class="pop" href="${BASE + p.u}"><img src="${BASE + p.i}" alt=""><span><small>${esc(p.c)}</small><b>${esc(p.t)}</b><em>${p.d != null ? `${p.d} km, ` : ''}detail <i class="ph ph-arrow-right"></i></em></span></a>`;
  const cluster = () => L.markerClusterGroup({
    showCoverageOnHover: false, maxClusterRadius: 44, spiderfyDistanceMultiplier: 1.7,
    iconCreateFunction: c => L.divIcon({ className: 'mk-c', iconSize: [44, 44], html: `<span>${c.getChildCount()}</span>` }),
  });
  const fit = (m, pts, pad, maxZoom) => { if (pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [pad, pad], maxZoom, animate: !reduce }); };

  els.forEach(async el => {
    const d = await data();
    const m = base(el);
    el.classList.add('ready');
    region(m, d);
    if (el.dataset.map === 'home') {
      const layer = cluster().addTo(m);
      const tabs = document.querySelectorAll('[data-map-tab]');
      const list = document.querySelector('[data-map-list]');
      const show = cat => {
        layer.clearLayers();
        const pts = d.tips.filter(p => cat === '*' ? p.top : p.cat === cat);
        pts.forEach(p => L.marker([p.lat, p.lon], { icon: icon(p), title: p.t, riseOnHover: true }).bindPopup(popup(p), { maxWidth: 260 }).addTo(layer));
        tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.mapTab === cat));
        if (cat === '*') m.fitBounds(L.polygon(d.region).getBounds(), { padding: [10, 10], animate: !reduce });
        else fit(m, pts.map(p => [p.lat, p.lon]), 60, 12);
        if (list) list.innerHTML = pts.slice(0, 6).map(p => `<a class="chip" href="${BASE + p.u}"><i class="ph ph-map-pin"></i>${esc(p.t.split(',')[0])}</a>`).join('')
          + (cat !== '*' ? `<a class="chip chip-accent" href="${BASE}tipy-na-zazitky/${cat}/">Vše v kategorii <i class="ph ph-arrow-right"></i></a>` : '');
      };
      tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.mapTab)));
      show('*');
    } else {
      const me = el.dataset.place ? JSON.parse(el.dataset.place) : null;
      const near = JSON.parse(el.dataset.near || '[]');
      const layer = cluster().addTo(m);
      near.forEach(p => L.marker([p.lat, p.lon], { icon: p.v ? vIcon() : icon(p, 'sm'), title: p.t }).bindPopup(popup(p), { maxWidth: 260 }).addTo(layer));
      if (me) {
        L.marker([me.lat, me.lon], { icon: icon(me, 'me'), zIndexOffset: 1000, title: me.t }).addTo(m);
        fit(m, [[me.lat, me.lon], ...near.filter(p => !p.v).slice(0, 4).map(p => [p.lat, p.lon])], el.clientWidth < 600 ? 70 : 50, 13);
      } else fit(m, near.map(p => [p.lat, p.lon]), 40, 12);
    }
  });
})();
