(function () {
  'use strict';
  var MODE = window.__DATA_URL__ ? 'site' : 'artifact';
  var D = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n, d) { if (n == null || isNaN(n)) return '–'; return Number(n).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 1 : d }); };
  var store = {
    get: function (k, def) { try { var v = localStorage.getItem('vc:' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem('vc:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Icons ----------
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    parties: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    compare: '<path d="M8 3v18M16 3v18M3 8h5M16 16h5"/>',
    debt: '<path d="M3 17c3-1 4-6 7-6s3 4 6 4 4-7 5-10"/><path d="M17 5h4v4"/>',
    matter: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    share: '<path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    prev: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    test: '<path d="M9 11l2.5 2.5L16 9"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
  };
  function icon(n, s) { return '<svg class="ic" viewBox="0 0 24 24" width="' + (s || 22) + '" height="' + (s || 22) + '" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + I[n] + '</svg>'; }

  var TABS = [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'comparar', label: 'Comparar', icon: 'compare' },
    { id: 'test', label: '¿Con quién coincides?', short: 'Test', icon: 'test' },
    { id: 'deuda', label: 'Deuda', icon: 'debt' },
    { id: 'importa', label: 'Lo que importa', short: 'Importa', icon: 'matter' }
  ];

  // ---------- Helpers ----------
  function P(id) { for (var i = 0; i < D.partidos.length; i++) if (D.partidos[i].id === id) return D.partidos[i]; return null; }
  function areaName(id) { for (var i = 0; i < D.areas.length; i++) if (D.areas[i].id === id) return D.areas[i].nombre; return id; }
  function siteUrl() { return (D.meta && D.meta.site_url) || location.origin; }
  function routeUrl(r) {
    if (!r || r === 'inicio') return siteUrl() + '/';
    var m;
    if ((m = r.match(/^partido-([a-z0-9]+)/))) return siteUrl() + '/partido/' + m[1] + '/';
    if ((m = r.match(/^tema-([a-z]+)/))) return siteUrl() + '/tema/' + m[1] + '/';
    return siteUrl() + '/' + r + '/';
  }
  function partyPath(r) {
    if (MODE !== 'site') return '#' + r;
    return routeUrl(r).replace(siteUrl(), '');
  }
  function daysLeft() {
    var t = new Date(D.eleccion.fecha).getTime() - Date.now();
    return Math.max(0, Math.ceil(t / 86400000));
  }
  function hasFigure(t) { return /\d/.test(t || ''); }
  function contrast(hex) {
    var h = String(hex || '#777').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    var Lf = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    var Y = 0.2126 * Lf(r) + 0.7152 * Lf(g) + 0.0722 * Lf(b);
    return (Y + 0.05) / 0.0607 > 1.05 / (Y + 0.05) ? '#14161c' : '#ffffff';
  }
  function src(f, label) {
    if (!f) return '';
    var name = typeof f === 'string' ? f : (f.nombre || f.verificador || 'Fuente');
    var url = typeof f === 'string' ? null : f.url;
    return url ? '<a class="src" href="' + esc(url) + '" target="_blank" rel="noopener">' + icon('link', 14) + '<span>' + esc(label || name) + '</span></a>' : '<span class="src">' + esc(label || name) + '</span>';
  }
  function partyDot(p, size) { return '<span class="pdot" style="--pc:' + esc(p.color || '#888') + ';width:' + (size || 10) + 'px;height:' + (size || 10) + 'px"></span>'; }
  function avatar(p, cls) { return '<span class="pav ' + (cls || '') + '" style="--pc:' + esc(p.color || '#888') + ';color:' + contrast(p.color) + '">' + esc((p.siglas || p.id).replace(/\s.*/, '').slice(0, 5)) + '</span>'; }
  var ORIGEN = { 'programa-2026': 'Programa 29N', 'programa-2023': 'Programa 2023', 'declaracion': 'Declaración', 'accion': 'Actuación' };

  // ---------- Toast / sheet / share ----------
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.hidden = true; }, 250); }, 2200); }
  var sheetReturn = null;
  function openSheet(html, cls) {
    sheetReturn = document.activeElement;
    var s = $('#sheet'); $('#sheetBody').innerHTML = html; s.className = 'sheet ' + (cls || '');
    s.hidden = false; $('#scrim').hidden = false;
    requestAnimationFrame(function () { s.classList.add('on'); $('#scrim').classList.add('on'); });
    var f = s.querySelector('button, a, input'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }
  function closeSheet() {
    var s = $('#sheet'); s.classList.remove('on'); $('#scrim').classList.remove('on');
    setTimeout(function () { s.hidden = true; $('#scrim').hidden = true; }, 260);
    if (sheetReturn && sheetReturn.focus) { try { sheetReturn.focus({ preventScroll: true }); } catch (e) {} }
  }
  function copy(text, done) {
    var ok = function () { toast(done || 'Enlace copiado'); };
    try { navigator.clipboard.writeText(text).then(ok, function () { fallback(); }); } catch (e) { fallback(); }
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Mantén pulsado para copiar'); } ta.remove(); }
  }
  function share(text, url, card, opts) {
    opts = opts || {};
    if (typeof text === 'function') text = text();
    var full = text + ' ' + url;
    var canNative = MODE === 'site' && navigator.share;
    var html = '<h3 class="sheet-title">Compartir</h3>' +
      (card ? '<div class="sharecard-wrap">' + card + '</div>' : '<p class="sheet-quote">' + esc(text) + '</p>') +
      '<div class="share-grid">' +
      '<a class="share-btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(full) + '"><b>WhatsApp</b></a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text) + '"><b>Telegram</b></a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) + '"><b>X</b></a>' +
      '<a class="share-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '"><b>Facebook</b></a>' +
      '</div>' + (canNative || (MODE === 'site' && opts.image) ? '<div class="share-more">' + (canNative ? '<button type="button" class="btn ghost" id="nativeShare">Más opciones</button>' : '') + (MODE === 'site' && opts.image ? '<button type="button" class="btn ghost" id="imgShare">Compartir imagen</button>' : '') + '</div>' : '') +
      '<div class="copyrow"><input id="shareUrl" readonly value="' + esc(url) + '" aria-label="Enlace"><button class="btn" type="button" data-copy="' + esc(full) + '">Copiar</button></div>';
    shareCtx = { text: text, url: url, image: opts.image || null };
    openSheet(html, 'share');
    if (opts.live) opts.live();
  }
  var shareCtx = null;
  function stamp() { return '<div class="scard-stamp">' + esc(siteUrl().replace(/^https?:\/\//, '')) + ' · ' + esc(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })) + '</div>'; }
  function debtNow() { var a = findInterest(D.deuda) || 0; return a / (365 * 86400) * (Date.now() - debtT0) / 1000; }
  var debtT0 = Date.now();
  function debtShareText() {
    var perSec = (findInterest(D.deuda) || 0) / (365 * 86400);
    var cc = (D.deuda.cifras_clave || []).filter(function (x) { return /habitante/i.test(x.etiqueta || ''); })[0];
    return 'España paga ' + fmt(perSec, 0) + ' € de intereses de la deuda cada segundo' + (cc ? ' y debe ' + cc.valor + ' € por habitante' : '') + '. Míralo en directo:';
  }
  function debtCard() {
    var d = D.deuda, cc = (d.cifras_clave || []).filter(function (x) { return /habitante/i.test(x.etiqueta || ''); })[0];
    return '<div class="scard debt"><p class="scard-k">La deuda pública</p><p class="sd-big">1,74 billones €</p><p class="sd-sub">' + esc(d.entradilla_corta || '') + '</p>' +
      '<div class="sd-tick"><span>Intereses pagados desde que abriste esto</span><b id="shareTicker">0 €</b></div>' +
      (cc ? '<div class="sd-cap"><span>Por persona</span><b>' + esc(cc.valor) + ' €</b></div>' : '') +
      '<div class="scard-foot"><span>En directo en la web</span><b>Antes de Votar</b></div>' + stamp() + '</div>';
  }
  var shareTickT;
  function liveShareTicker() {
    clearInterval(shareTickT);
    shareTickT = setInterval(function () { var el = $('#shareTicker'); if (!el || $('#sheet').hidden) { clearInterval(shareTickT); return; } el.textContent = fmt(debtNow(), 0) + ' €'; }, 100);
  }
  function drawDebtImage() {
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1350; var x = c.getContext('2d');
    var cc = (D.deuda.cifras_clave || []).filter(function (k) { return /habitante/i.test(k.etiqueta || ''); })[0];
    var perSec = (findInterest(D.deuda) || 0) / (365 * 86400);
    var F = '"Bricolage Grotesque","Instrument Sans",system-ui,sans-serif';
    x.fillStyle = '#3E4C59'; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '600 40px ' + F; x.fillText('La deuda pública de España', 80, 140);
    x.fillStyle = '#fff'; x.font = '800 130px ' + F; x.fillText('1,74 billones €', 80, 300);
    x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '500 40px ' + F; x.fillText('El 99,9% de todo lo que produce en un año', 80, 370);
    x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.roundRect ? x.roundRect(80, 440, 920, 300, 32) : x.rect(80, 440, 920, 300); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 38px ' + F; x.fillText('Intereses que paga España cada segundo', 120, 520);
    x.fillStyle = '#FFE14D'; x.font = '800 150px ' + F; x.fillText(fmt(perSec, 0) + ' €', 120, 680);
    x.fillStyle = '#FFE14D'; x.beginPath(); x.roundRect ? x.roundRect(80, 790, 920, 260, 32) : x.rect(80, 790, 920, 260); x.fill();
    x.fillStyle = '#191C22'; x.font = '600 38px ' + F; x.fillText('A cada persona le corresponden', 120, 870);
    x.font = '800 140px ' + F; x.fillText((cc ? cc.valor : '') + ' €', 120, 1010);
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '500 32px ' + F; x.fillText('Fuente: Banco de España e IGAE. Míralo en directo:', 80, 1160);
    x.fillStyle = '#fff'; x.font = '700 40px ' + F; x.fillText(siteUrl().replace('https://', '') + '/deuda', 80, 1220);
    return c;
  }

  // ---------- Router ----------
  var current = '';
  var stack = [];
  var navigatedInApp = false;
  function parse(r) {
    r = (r || '').replace(/^#/, '') || 'inicio';
    var m;
    if ((m = r.match(/^partido-([a-z0-9]+)(?:-(propuestas|criticas))?$/))) return { view: 'partido', id: m[1], tab: m[2] || null, depth: 1, tabId: 'inicio' };
    if ((m = r.match(/^tema-([a-z]+)$/))) return { view: 'tema', id: m[1], depth: 0, tabId: 'comparar' };
    if (r === 'metodologia') return { view: 'metodologia', depth: 1, tabId: null };
    if (r === 'partidos') return { view: 'partidos', depth: 1, tabId: 'inicio' };
    if ((m = r.match(/^importa-([a-z0-9-]+)$/))) return { view: 'importaTema', id: m[1], depth: 1, tabId: 'importa' };
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === r) return { view: r, depth: 0, tabId: r };
    return { view: 'inicio', depth: 0, tabId: 'inicio' };
  }
  function routeFromLocation() {
    if (MODE === 'site') {
      var p = location.pathname.replace(/\/+$/, '');
      var m;
      if (!p) return 'inicio';
      if ((m = p.match(/^\/partido\/([a-z0-9]+)$/))) return 'partido-' + m[1];
      if ((m = p.match(/^\/tema\/([a-z]+)$/))) return 'tema-' + m[1];
      return p.replace(/^\//, '');
    }
    return (location.hash || '').replace(/^#/, '') || (window.__ROUTE__ || 'inicio');
  }
  function go(r, opts) {
    opts = opts || {};
    if (r === current && !opts.force) { $('#view').scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    var prev = parse(current), next = parse(r);
    var dir = next.depth > prev.depth ? 'push' : next.depth < prev.depth ? 'pop' : 'fade';
    if (opts.dir) dir = opts.dir;
    if (!opts.fromHistory) {
      if (dir === 'push') stack.push(current); else if (next.depth === 0) stack = [];
      navigatedInApp = true;
      if (MODE === 'site') { try { history.pushState({ r: r }, '', partyPath(r)); } catch (e) {} }
      else { try { history.pushState({ r: r }, '', '#' + r); } catch (e) { location.hash = r; } }
    }
    current = r;
    render(next, dir);
  }
  window.addEventListener('popstate', function (e) {
    var r = (e.state && e.state.r) || routeFromLocation();
    var dir = parse(r).depth < parse(current).depth ? 'pop' : 'fade';
    if (stack.length) stack.pop();
    go(r, { fromHistory: true, dir: dir, force: true });
  });
  function back() {
    var cur = parse(current);
    if (stack.length && navigatedInApp) { history.back(); return; }
    var target = stack.length ? stack[stack.length - 1] : (cur.tabId || 'inicio');
    stack.pop();
    go(target, { dir: 'pop', fromHistory: false });
  }

  // ---------- Chrome ----------
  function renderChrome(rt) {
    var tabs = TABS.filter(function (t) { return t.id !== 'test' || (D.test && D.test.afirmaciones); }).map(function (t) {
      return '<a href="' + partyPath(t.id) + '" data-nav="' + t.id + '" class="tab' + (rt.tabId === t.id ? ' on' : '') + '"' + (rt.tabId === t.id ? ' aria-current="page"' : '') + '>' + icon(t.icon, 23) + '<span>' + esc(t.short || t.label) + '</span></a>';
    }).join('');
    $('#tabbar').innerHTML = tabs;
    $('#railNav').innerHTML = TABS.filter(function (t) { return t.id !== 'test' || (D.test && D.test.afirmaciones); }).map(function (t) {
      return '<a href="' + partyPath(t.id) + '" data-nav="' + t.id + '" class="rail-link' + (rt.tabId === t.id ? ' on' : '') + '">' + icon(t.icon, 20) + '<span>' + esc(t.label) + '</span></a>';
    }).join('') + '<a href="' + partyPath('partidos') + '" data-nav="partidos" class="rail-link sub' + (rt.view === 'partidos' || rt.view === 'partido' ? ' on' : '') + '">' + icon('parties', 20) + '<span>Todos los partidos</span></a><a href="' + partyPath('metodologia') + '" data-nav="metodologia" class="rail-link' + (rt.view === 'metodologia' ? ' on' : '') + '">' + icon('info', 20) + '<span>Metodología y contacto</span></a>';
    $('#railFoot').innerHTML = '<div class="countdown-mini"><b>' + daysLeft() + '</b><span>días para votar<br>29 de noviembre</span></div>';
    $('#backBtn').hidden = rt.depth === 0;
  }

  function render(rt, dir) {
    renderChrome(rt);
    var v = $('#view');
    var html = '', title = '';
    try {
      switch (rt.view) {
        case 'partido': { var p = P(rt.id); if (!p) { html = empty('No encontramos ese partido.'); break; } title = p.siglas; html = viewPartido(p, rt.tab); break; }
        case 'tema': title = 'Comparar'; html = viewTema(rt.id); break;
        case 'partidos': title = 'Partidos'; html = viewPartidos(); break;
        case 'comparar': title = 'Comparar'; html = viewComparar(); break;
        case 'test': title = '¿Con quién coincides?'; html = viewTest(); break;
        case 'deuda': title = 'Deuda pública'; html = viewDeuda(); break;
        case 'importa': title = 'Lo que importa'; html = viewImporta(); break;
        case 'importaTema': { var tt = temaById(rt.id); title = tt ? tt.titulo : 'Lo que importa'; html = viewImportaTema(rt.id); break; }
        case 'metodologia': title = 'Metodología'; html = viewMetodologia(); break;
        default: title = ''; html = viewInicio();
      }
    } catch (e) { console.error(e); html = empty('Algo ha fallado al cargar esta pantalla. Vuelve al inicio e inténtalo de nuevo.'); }
    $('#topTitle').innerHTML = title ? esc(title) : brandWord();
    document.title = (title ? title + ' · ' : '') + ((D.meta && D.meta.nombre) || 'Antes de Votar');
    v.classList.remove('push', 'pop', 'fade');
    void v.offsetWidth;
    v.innerHTML = html;
    v.scrollTop = 0;
    if (!reduced) v.classList.add(dir || 'fade');
    afterRender(rt);
  }
  function brandWord() { return '<span class="brandword">' + esc((D.meta && D.meta.nombre) || 'Antes de Votar') + '</span>'; }
  function empty(msg) { return '<div class="empty"><p>' + esc(msg) + '</p><a class="btn" href="' + partyPath('inicio') + '" data-nav="inicio">Ir al inicio</a></div>'; }

  // ---------- Hemicycle ----------
  var IDEO = ['podemos', 'sumar', 'bildu', 'bng', 'aa', 'erc', 'psoe', 'pnv', 'junts', 'cc', 'upn', 'pp', 'vox', 'salf', 'aliancacat'];
  function hemicycle() {
    var seats = [];
    var total = 0;
    IDEO.forEach(function (id) { var p = P(id); var n = p && p.encuesta ? (p.encuesta.escanos || 0) : 0; total += n; for (var i = 0; i < n; i++) seats.push(p); });
    var others = Math.max(0, 350 - total);
    var mid = seats.length; // put others at the end
    for (var j = 0; j < others; j++) seats.push(null);
    var rows = 10, r0 = 46, r1 = 100, pts = [];
    var radii = []; for (var r = 0; r < rows; r++) radii.push(r0 + (r1 - r0) * r / (rows - 1));
    var sum = radii.reduce(function (a, b) { return a + b; }, 0);
    var counts = radii.map(function (rr) { return Math.round(350 * rr / sum); });
    var diff = 350 - counts.reduce(function (a, b) { return a + b; }, 0); counts[rows - 1] += diff;
    radii.forEach(function (rr, ri) {
      var n = counts[ri];
      for (var k = 0; k < n; k++) { var a = Math.PI - (Math.PI * (k + 0.5) / n); pts.push({ a: a, x: 110 + rr * Math.cos(a), y: 108 - rr * Math.sin(a) }); }
    });
    pts.sort(function (A, B) { return B.a - A.a; });
    var circles = pts.map(function (pt, i) {
      var p = seats[i];
      return '<circle cx="' + pt.x.toFixed(2) + '" cy="' + pt.y.toFixed(2) + '" r="3.05" style="fill:' + (p ? esc(p.color) : 'var(--line)') + '"><title>' + (p ? esc(p.siglas) : 'Otros / sin asignar') + '</title></circle>';
    }).join('');
    return '<svg class="hemi" viewBox="0 0 220 116" role="img" aria-label="Reparto estimado de los 350 escaños del Congreso según la media de encuestas">' + circles +
      '<line x1="110" y1="2" x2="110" y2="62" class="hemi-mid"/><text x="110" y="100" text-anchor="middle" class="hemi-num">350</text><text x="110" y="112" text-anchor="middle" class="hemi-lab">mayoría: 176</text></svg>';
  }

  // ---------- Views ----------
  function partyRow(p, i) {
    if (p.tier === 'otros') return otherRow(p);
    var max = D.partidos[0].encuesta ? D.partidos[0].encuesta.voto : 35;
    var v = p.encuesta ? p.encuesta.voto : 0;
    return '<a class="prow" href="' + partyPath('partido-' + p.id) + '" data-nav="partido-' + p.id + '" style="--pc:' + esc(p.color) + '">' +
      '<span class="prow-rank">' + (D.partidos.indexOf(p) + 1) + '</span>' + avatar(p) +
      '<span class="prow-main"><span class="prow-name">' + esc(p.nombre) + '</span><span class="prow-sub">' + esc(p.candidato || p.ambito || '') + '</span>' +
      (D.veda ? '' : '<span class="prow-bar"><i style="width:' + Math.max(2, v / max * 100).toFixed(1) + '%"></i></span>') + '</span>' +
      (D.veda ? '<span class="prow-pct"><b class="small">' + (p.escanos_2023 != null ? p.escanos_2023 : '–') + '</b><small>escaños en 2023</small></span>' : '<span class="prow-pct"><b>' + fmt(v, 1) + '%</b><small>' + (p.encuesta && p.encuesta.escanos != null ? p.encuesta.escanos + ' esc.' : '') + '</small></span>') + icon('chev', 18) + '</a>';
  }
  function otherRow(p) {
    var rv = p.referencia_voto;
    var where = (p.circunscripciones || []).join(', ');
    return '<a class="prow other" href="' + partyPath('partido-' + p.id) + '" data-nav="partido-' + p.id + '" style="--pc:' + esc(p.color) + '">' +
      '<span class="prow-rank"></span>' + avatar(p) +
      '<span class="prow-main"><span class="prow-name">' + esc(p.nombre) + '</span><span class="prow-sub">' + esc([p.candidato, where && where !== 'Por confirmar' ? where : p.ambito].filter(Boolean).join(' · ')) + '</span></span>' +
      '<span class="prow-pct">' + (rv && rv.porcentaje != null ? '<b class="small">' + fmt(rv.porcentaje, rv.porcentaje < 1 ? 2 : 1) + '%</b><small>' + esc(rv.eleccion) + (rv.ambito && rv.ambito !== 'España' ? ' · ' + esc(rv.ambito) : '') + '</small>' : '<small>' + esc(p.estado_candidatura || 'Nuevo') + '</small>') + '</span>' + icon('chev', 18) + '</a>';
  }
  function partyLists(list, q) {
    var main = list.filter(function (p) { return p.tier !== 'otros'; }), oth = list.filter(function (p) { return p.tier === 'otros'; });
    var html = main.length ? '<div class="plist">' + main.map(partyRow).join('') + '</div>' : '';
    var isNat = function (p) { return (p.referencia_voto && p.referencia_voto.ambito === 'España') || (p.circunscripciones || []).indexOf('Todas') >= 0 || (!p.referencia_voto && /estatal|espa/i.test(p.ambito || '')); };
    var byPct = function (a, b) { return ((b.referencia_voto && b.referencia_voto.porcentaje) || 0) - ((a.referencia_voto && a.referencia_voto.porcentaje) || 0); };
    var nat = oth.filter(isNat).sort(byPct), terr = oth.filter(function (p) { return !isNat(p); }).sort(byPct);
    if (oth.length) html += '<div class="block-head sub"><h3>Otros partidos que se presentan</h3><span class="cnt">' + oth.length + '</span></div><p class="fine" style="margin:0 0 10px">Sin datos en las encuestas nacionales. Ordenados por su último resultado. La lista oficial de candidaturas se publica en el BOE el 28 de octubre.</p>' +
      (nat.length ? '<p class="tier-lab">De ámbito estatal</p><div class="plist">' + nat.map(partyRow).join('') + '</div>' : '') +
      (terr.length ? '<p class="tier-lab">Solo en algunas provincias</p><div class="plist">' + terr.map(partyRow).join('') + '</div>' : '');
    return html || '<div class="empty"><p>Ningún partido coincide con «' + esc(q || '') + '».</p></div>';
  }
  function searchBox(id, ph) { return '<label class="search" for="' + id + '">' + icon('search', 19) + '<input id="' + id + '" type="search" autocomplete="off" placeholder="' + esc(ph) + '"></label>'; }

  function viewInicio() {
    var d = daysLeft();
    var top = D.partidos;
    var dz = D.deuda && D.deuda.cifras_clave && D.deuda.cifras_clave[0];
    var nProp = D.partidos.reduce(function (a, p) { return a + p.propuestas.length; }, 0);
    return '<section class="hero">' +
      '<div class="hero-copy"><p class="kicker">Elecciones generales · 29 de noviembre de 2026</p>' +
      '<h1 class="display">' + esc((D.meta && D.meta.hero) || 'Lee lo que proponen. Decide tú.') + '</h1>' +
      '<p class="lede">' + esc((D.meta && D.meta.lede) || 'Todas las propuestas de cada partido, resumidas y sin interpretar. Con las críticas que reciben, siempre con fuente.') + '</p>' +
      '<div class="hero-stats"><div><b>' + d + '</b><span>días para votar</span></div><div><b>' + D.partidos.length + '</b><span>partidos</span></div><div><b>' + fmt(nProp, 0) + '</b><span>propuestas</span></div></div></div>' +
      (D.veda ? '<div class="veda"><b>Veda de encuestas</b><p>La ley electoral prohíbe publicar sondeos entre el 24 y el 29 de noviembre (art. 69.7 de la LOREG). Hasta el cierre de los colegios, los partidos aparecen ordenados por los escaños que obtuvieron en 2023.</p></div>' : '<figure class="hero-hemi">' + hemicycle() + '<figcaption>Escaños estimados según la media de encuestas del ' + esc(fdate(D.encuestas.actualizado)) + '</figcaption></figure>') + '</section>' +
      '<section class="block"><div class="block-head"><h2>' + (D.veda ? 'Partidos' : 'Partidos por intención de voto') + '</h2><a class="more" href="' + partyPath('test') + '" data-nav="test">¿Con quién coincides?</a></div>' + searchBox('qParty', 'Busca un partido, candidato o comunidad') +
      '<div id="partyList">' + partyLists(top) + '</div>' +
      '<p class="fine">Media de encuestas publicadas. ' + (D.encuestas.fuentes || []).map(function (f) { return src(f); }).join(' ') + '</p></section>' +
      '<section class="block feature-grid">' +
      '<a class="feature f-debt" href="' + partyPath('deuda') + '" data-nav="deuda"><span class="f-eyebrow">La trampa de la deuda</span><b class="f-big">' + esc(dz ? dz.valor + (dz.unidad ? ' ' + dz.unidad : '') : 'Deuda') + '</b><span>' + esc(dz ? dz.etiqueta : 'Por qué crece sola y por qué nadie quiere frenarla') + '</span><span class="f-cta">Ver cómo funciona ' + icon('next', 16) + '</span></a>' +
      '<a class="feature f-matter" href="' + partyPath('importa') + '" data-nav="importa"><span class="f-eyebrow">Lo que de verdad importa</span><b class="f-big">' + esc(firstImporta()) + '</b><span>Los datos que marcan tu vida frente al ruido del día</span><span class="f-cta">Ver los datos ' + icon('next', 16) + '</span></a>' +
      '<a class="feature f-compare" href="' + partyPath('comparar') + '" data-nav="comparar"><span class="f-eyebrow">Comparador</span><b class="f-big">Tema a tema</b><span>Pon dos partidos frente a frente en vivienda, empleo o pensiones</span><span class="f-cta">Comparar ' + icon('next', 16) + '</span></a>' +
      '</section>' +
      '<section class="block"><div class="block-head"><h2>Explorar por tema</h2></div><div class="chips wrap">' + D.areas.map(function (a) { return '<a class="chip" href="' + partyPath('tema-' + a.id) + '" data-nav="tema-' + a.id + '">' + esc(a.nombre) + '</a>'; }).join('') + '</div></section>' +
      footer();
  }
  function firstImporta() { var t = D.importa && D.importa.temas && D.importa.temas[0]; return t && t.dato_clave ? t.dato_clave.valor : 'Calidad de vida'; }
  function fdate(s) {
    if (!s) return ''; s = String(s);
    var M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var m = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
    if (!m) return s;
    if (!m[2]) return m[1];
    if (!m[3]) return M[+m[2] - 1] + ' de ' + m[1];
    return (+m[3]) + ' de ' + M[+m[2] - 1] + ' de ' + m[1];
  }
  function footer() {
    return '<footer class="foot"><p>' + esc((D.meta && D.meta.nombre) || 'Antes de Votar') + ' es una herramienta independiente y no partidista. Aplicamos los mismos criterios a todos los partidos y enlazamos cada dato a su fuente.</p>' +
      '<a href="' + partyPath('metodologia') + '" data-nav="metodologia">Metodología, aviso y contacto</a><span>Actualizado el ' + esc(fdate(D.generado)) + '</span></footer>';
  }

  function viewPartidos() {
    return '<section class="block first">' + searchBox('qParty', 'Busca un partido, candidato o comunidad') +
      '<div id="partyList">' + partyLists(D.partidos) + '</div>' +
      '<p class="fine">' + (D.veda ? 'Ordenados por escaños obtenidos en 2023 (veda de encuestas del 24 al 29 de noviembre).' : 'Ordenados por la media de encuestas del ' + esc(fdate(D.encuestas.actualizado)) + '.') + ' Los partidos que solo se presentan en una comunidad tienen menos voto nacional, aunque pueden ser decisivos.</p></section>' + footer();
  }

  // ----- Party -----
  function partyStats(p) {
    var n = p.propuestas.length;
    var fig = p.propuestas.filter(function (x) { return hasFigure(x.texto); }).length;
    var hi = highImpactAreas();
    var nh = p.propuestas.filter(function (x) { return hi.indexOf(x.area) >= 0; }).length;
    return { n: n, fig: n ? Math.round(fig / n * 100) : 0, hi: n ? Math.round(nh / n * 100) : 0 };
  }
  function highImpactAreas() {
    var t = (D.importa && D.importa.temas) || [];
    var a = t.map(function (x) { return x.area; }).filter(Boolean);
    return a.length ? a : ['vivienda', 'empleo', 'pensiones', 'sanidad', 'educacion', 'deuda', 'demografia', 'economia'];
  }
  var partyState = { area: 'todas', crit: 'economica', q: '' };
  var lastParty = null;
  function viewPartido(p, tab) {
    if (lastParty !== p.id) { partyState = { area: 'todas', crit: 'economica', q: '' }; lastParty = p.id; }
    tab = tab || 'propuestas';
    var st = partyStats(p);
    var crits = p.criticas || {}; var nc = (crits.economica || []).length + (crits.social || []).length + (crits.cultural || []).length + (crits.derecho || []).length;
    var head = '<section class="phead" style="--pc:' + esc(p.color) + ';--pcfg:' + contrast(p.color) + '">' +
      '<div class="phead-top">' + avatar(p, 'lg') + '<div class="phead-id"><h1>' + esc(p.nombre) + '</h1><p>' + esc([p.candidato].filter(Boolean).join(' · ')) + '</p></div></div>' +
      (p.resumen ? '<p class="phead-sum">' + esc(p.resumen) + '</p>' : '') +
      (p.autodefinicion && p.autodefinicion.texto ? '<p class="selfdef"><span>Se define como</span> «' + esc(p.autodefinicion.texto) + '» ' + src(p.autodefinicion.fuente, 'Fuente') + '</p>' : '') +
      (p.ches && p.ches.lrgen != null ? '<div class="ches"><span class="ches-l">Izquierda</span><span class="ches-t"><i style="left:' + (p.ches.lrgen * 10).toFixed(1) + '%"></i></span><span class="ches-l">Derecha</span><small>Posición según expertos: ' + fmt(p.ches.lrgen, 1) + ' sobre 10 · ' + src(p.ches.fuente, 'Chapel Hill Expert Survey ' + (p.ches.anio || '')) + '</small></div>' : '') +
      '<div class="pkpis">' +
      (p.tier === 'otros' ? kpi(p.referencia_voto && p.referencia_voto.porcentaje != null ? fmt(p.referencia_voto.porcentaje, 2) + '%' : '–', p.referencia_voto ? 'en ' + p.referencia_voto.eleccion + (p.referencia_voto.ambito && p.referencia_voto.ambito !== 'España' ? ' (' + p.referencia_voto.ambito + ')' : '') : 'primera vez') +
        kpi(p.estado_candidatura || '–', (p.circunscripciones || []).join(', ') || 'candidatura') :
      (D.veda ? kpi(p.escanos_2023 != null ? String(p.escanos_2023) : '–', 'escaños en 2023') + kpi('–', 'sin encuestas (veda)') :
      kpi(fmt(p.encuesta && p.encuesta.voto, 1) + '%', p.encuesta && p.encuesta.fuente ? 'en ' + p.encuesta.fuente : 'en la media de encuestas') +
      kpi((p.encuesta && p.encuesta.escanos != null ? p.encuesta.escanos : '–') + '', 'escaños est.' + (p.escanos_2023 != null ? ' (hoy ' + p.escanos_2023 + ')' : '')))) +
      kpi(String(st.n), 'propuestas') +
      kpi(baseLabel(p)[0], baseLabel(p)[1]) +
      '</div>' + (p.concurre === false ? '<p class="warn">Este partido no concurre a estas elecciones con candidatura propia.</p>' : '') + '</section>';
    var seg = '<div class="seg sticky" role="tablist">' +
      segBtn('propuestas', 'Propuestas', st.n, tab) + segBtn('criticas', 'Críticas', nc, tab) + '</div>';
    var body = tab === 'criticas' ? partyCriticas(p) : partyPropuestas(p);
    return head + seg + '<div class="ptab" id="ptab" data-party="' + p.id + '">' + body + '</div>' + footer();
  }
  function baseLabel(p) {
    var c = {}; p.propuestas.forEach(function (x) { c[x.origen] = (c[x.origen] || 0) + 1; });
    if (p.programa_2026_publicado || (c['programa-2026'] || 0) > p.propuestas.length / 2) return ['Programa 29N', 'fuente principal'];
    if ((c['programa-2023'] || 0) > p.propuestas.length / 2) return ['Programa 2023', 'hasta que publique el del 29N'];
    return ['Declaraciones', 'y documentos recientes; sin programa del 29N'];
  }
  function kpi(v, l, tip) { return '<div class="kpi"' + (tip ? ' title="' + esc(tip) + '"' : '') + '><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; }
  function segBtn(id, label, n, cur) { return '<button type="button" role="tab" class="seg-btn' + (cur === id ? ' on' : '') + '" aria-selected="' + (cur === id) + '" data-ptab="' + id + '">' + esc(label) + '<span class="cnt">' + n + '</span></button>'; }

  function propItem(x, p, showParty) {
    var o = ORIGEN[x.origen] || x.origen || '';
    return '<li class="prop' + (x.destacada ? ' key' : '') + '" id="' + esc(x.id || '') + '">' +
      (showParty ? '<span class="prop-party">' + partyDot(p) + esc(p.siglas) + '</span>' : '') +
      '<p>' + esc(x.texto) + '</p><div class="prop-meta">' + (o ? '<span class="tag t-' + esc(x.origen) + '">' + esc(o) + '</span>' : '') +
      (x.fuente ? src(x.fuente, (x.fuente.nombre || 'Fuente') + (x.fuente.fecha ? ' · ' + x.fuente.fecha : '')) : '') +
      '<button type="button" class="mini share-prop" data-share-prop="' + esc(p.id) + '|' + esc(x.id || '') + '" aria-label="Compartir esta propuesta">' + icon('share', 15) + '</button></div></li>';
  }
  function partyPropuestas(p) {
    var areas = D.areas.filter(function (a) { return p.propuestas.some(function (x) { return x.area === a.id; }); });
    var cur = partyState.area;
    if (cur !== 'todas' && cur !== 'clave' && !areas.some(function (a) { return a.id === cur; })) cur = partyState.area = 'todas';
    var keys = p.propuestas.filter(function (x) { return x.destacada; });
    var chips = '<div class="chips scroll" role="tablist" aria-label="Filtrar por tema">' +
      chip('todas', 'Todas', p.propuestas.length, cur) + (keys.length ? chip('clave', 'Lo esencial', keys.length, cur) : '') +
      areas.map(function (a) { return chip(a.id, a.nombre, p.propuestas.filter(function (x) { return x.area === a.id; }).length, cur); }).join('') + '</div>';
    if (!p.propuestas.length) return '<div class="empty"><p>Aún no hemos cargado propuestas de este partido.</p></div>';
    return '<div class="tools">' + searchBox('qProp', 'Busca en sus propuestas') + chips + '</div><div id="propList">' + propList(p, cur, partyState.q) + '</div>' +
      '<p class="fine">Resumimos cada propuesta sin interpretarla. Pulsa la fuente para leer el original.</p>';
  }
  function chip(id, label, n, cur) { return '<button type="button" class="chip' + (cur === id ? ' on' : '') + '" data-area="' + id + '">' + esc(label) + (n != null ? ' <span class="cnt">' + n + '</span>' : '') + '</button>'; }
  function propList(p, area, q) {
    var items = p.propuestas.filter(function (x) {
      if (area === 'clave' && !x.destacada) return false;
      if (area !== 'todas' && area !== 'clave' && x.area !== area) return false;
      if (q && norm(x.texto).indexOf(norm(q)) < 0) return false;
      return true;
    });
    if (!items.length) return '<div class="empty"><p>Ninguna propuesta coincide con «' + esc(q) + '». Prueba con otra palabra o quita el filtro de tema.</p></div>';
    var groups = D.areas.map(function (a) { return { a: a, it: items.filter(function (x) { return x.area === a.id; }) }; }).filter(function (g) { return g.it.length; });
    return groups.map(function (g) { return '<section class="pgroup"><h3>' + esc(g.a.nombre) + '<span>' + g.it.length + '</span></h3><ul class="props">' + g.it.map(function (x) { return propItem(x, p); }).join('') + '</ul></section>'; }).join('');
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function partyCriticas(p) {
    var c = p.criticas || {};
    var dims = [['economica', 'Económicas'], ['social', 'Sociales'], ['cultural', 'Culturales'], ['derecho', 'Estado de derecho']];
    var cur = partyState.crit;
    var chips = '<div class="chips scroll">' + dims.map(function (d) { return '<button type="button" class="chip' + (cur === d[0] ? ' on' : '') + '" data-crit="' + d[0] + '">' + d[1] + ' <span class="cnt">' + (c[d[0]] || []).length + '</span></button>'; }).join('') + '</div>';
    var list = (c[cur] || []);
    var idx = {}; p.propuestas.forEach(function (x) { idx[x.id] = x; });
    var cards = list.length ? list.map(function (k) {
      var rel = (k.sobre || []).map(function (id) { return idx[id]; }).filter(Boolean);
      return '<article class="crit' + (k.gravedad ? ' g-' + esc(k.gravedad) : '') + '">' + (k.gravedad ? '<span class="grav">Gravedad ' + esc(k.gravedad) + '</span>' : '') + '<h3>' + esc(k.titulo) + '</h3><p>' + esc(k.texto) + '</p>' + (k.criterio ? '<p class="crit-ref">Criterio: ' + esc(k.criterio) + '</p>' : '') +
        (rel.length ? '<details class="rel"><summary>Sobre ' + rel.length + (rel.length > 1 ? ' propuestas' : ' propuesta') + '</summary><ul>' + rel.map(function (x) { return '<li>' + esc(x.texto) + '</li>'; }).join('') + '</ul></details>' : '') +
        '<div class="prop-meta">' + src(k.fuente) + '</div></article>';
    }).join('') : '<div class="empty"><p>' + (cur === 'derecho' ? 'Sin hallazgos relevantes con nuestros criterios.' : 'No hay críticas registradas en esta dimensión.') + '</p></div>';
    if (cur === 'derecho') cards = (p.valoracion_derecho ? '<div class="valor"><b>Valoración</b><p>' + esc(p.valoracion_derecho) + '</p></div>' : '') + cards +
      ((p.avales_derecho || []).length ? '<div class="avales"><h3>Lo que la doctrina respalda</h3>' + p.avales_derecho.map(function (k) { return '<article class="aval"><b>' + esc(k.titulo) + '</b><p>' + esc(k.texto) + '</p>' + (k.criterio ? '<p class="crit-ref">Criterio: ' + esc(k.criterio) + '</p>' : '') + src(k.fuente) + '</article>'; }).join('') + '</div>' : '') + (D.criterios_derecho ? '<p class="fine">' + esc(D.criterios_derecho) + '</p>' : '');
    var note = cur === 'derecho' ? 'Choques de sus propuestas o actuaciones con los derechos fundamentales y el Estado de derecho, según la Constitución, el Tribunal Constitucional, el TEDH y la Comisión de Venecia. La gravedad se mide con la misma escala para todos.' : null;
    if (note) return '<div class="tools">' + chips + '</div><p class="intro-note">' + note + '</p><div class="crits">' + cards + '</div>';
    return '<div class="tools">' + chips + '</div><p class="intro-note">Los contras que expertos e instituciones señalan sobre sus propuestas. Aplicamos el mismo criterio a todos: la dureza depende de la evidencia, no de equilibrar.</p><div class="crits">' + cards + '</div>';
  }
  function partyMentiras(p) {
    var m = p.mentiras || [];
    if (!m.length) return '<div class="empty"><p>No hemos encontrado declaraciones de este partido verificadas como falsas o engañosas en el periodo revisado. Que no aparezcan aquí no significa que no existan.</p></div>';
    return '<p class="intro-note">Afirmaciones públicas verificadas por medios de verificación reconocidos o contrastadas con datos oficiales. Cada una enlaza a su verificación.</p><div class="lies">' + m.map(function (x) {
      var v = norm(x.veredicto).replace(/\s+/g, '-');
      return '<article class="lie"><div class="lie-top"><span class="verdict v-' + esc(v) + '">' + esc(x.veredicto) + '</span><span class="lie-date">' + esc(fdate(x.fecha)) + '</span></div>' +
        '<blockquote>' + esc(x.afirmacion) + '</blockquote><p class="lie-who">' + esc(x.autor) + (x.contexto && !/recogida por|figuran en la verificación/i.test(x.contexto) ? ' · ' + esc(x.contexto) : '') + '</p>' +
        '<div class="lie-real"><b>Lo que dicen los datos</b><p>' + esc(x.realidad) + '</p></div>' +
        (x.nivel === 'titular' ? '<p class="lie-note">Resumen a partir del titular de la verificación. Lee el análisis completo en la fuente.</p>' : '') + '<div class="prop-meta">' + src({ nombre: x.verificador, url: x.url }, (x.tipo === 'dato-oficial' ? 'Dato oficial: ' : 'Verificado por ') + (x.verificador || 'fuente')) + '</div></article>';
    }).join('') + '</div>';
  }

  // ----- Comparar (frente a frente + todos los partidos) -----
  var cmp = { sel: null, area: 'vivienda' };
  function cmpMax() { return window.innerWidth >= 960 ? 3 : 2; }
  function cmpInit() {
    var s = store.get('cmp2', null); if (s && !cmp.sel) { cmp.sel = s.sel; cmp.area = s.area || cmp.area; }
    if (!cmp.sel || !cmp.sel.length) cmp.sel = [D.partidos[0].id, (D.partidos[1] || D.partidos[0]).id];
    cmp.sel = cmp.sel.filter(function (id) { return P(id); }).slice(0, cmpMax());
    if (!cmp.sel.length) cmp.sel = [D.partidos[0].id];
  }
  function cmpSave() { store.set('cmp2', { sel: cmp.sel, area: cmp.area }); }
  function cmpHead(mode) {
    return '<section class="block first"><h1 class="h1">Comparar</h1>' +
      '<div class="seg cmp-mode" role="tablist">' +
      '<a role="tab" class="seg-btn' + (mode === 'cmp' ? ' on' : '') + '" href="' + partyPath('comparar') + '" data-nav="comparar">Frente a frente</a>' +
      '<a role="tab" class="seg-btn' + (mode === 'todos' ? ' on' : '') + '" href="' + partyPath('tema-' + cmp.area) + '" data-nav="tema-' + cmp.area + '">Todos los partidos</a></div>' +
      '<div class="chips scroll cmp-areas">' + D.areas.map(function (x) {
        return mode === 'todos'
          ? '<a class="chip' + (x.id === cmp.area ? ' on' : '') + '" href="' + partyPath('tema-' + x.id) + '" data-nav="tema-' + x.id + '">' + esc(x.nombre) + '</a>'
          : '<button type="button" class="chip' + (x.id === cmp.area ? ' on' : '') + '" data-cmp-area="' + x.id + '">' + esc(x.nombre) + '</button>';
      }).join('') + '</div>';
  }
  function viewComparar() {
    cmpInit();
    return cmpHead('cmp') + '<div id="cmpOut">' + cmpOut() + '</div></section>' + footer();
  }
  function viewTema(a) {
    cmpInit(); cmp.area = a; cmpSave();
    var ps = D.partidos.filter(function (p) { return p.propuestas.some(function (x) { return x.area === a; }); });
    return cmpHead('todos') + temaHook(a) +
      '<p class="fine" style="margin:4px 0 6px">' + ps.length + ' partidos con propuestas sobre ' + esc(areaName(a).toLowerCase()) + '. Toca uno para desplegarlo.</p>' +
      ps.map(function (p, i) {
        var it = p.propuestas.filter(function (x) { return x.area === a; });
        return '<details class="tparty"' + (i < 2 ? ' open' : '') + ' style="--pc:' + esc(p.color) + '"><summary>' + avatar(p) + '<span class="tp-name">' + esc(p.nombre) + '</span><span class="cnt">' + it.length + '</span></summary><ul class="props">' + it.map(function (x) { return propItem(x, p); }).join('') + '</ul></details>';
      }).join('') + (ps.length ? '' : '<div class="empty"><p>Ningún partido tiene propuestas cargadas en este tema todavía.</p></div>') + '</section>' + footer();
  }
  function temaHook(a) {
    var t = ((D.importa && D.importa.temas) || []).filter(function (x) { return x.area === a; })[0];
    if (!t || !t.dato_clave) return '';
    return '<a class="hook" href="' + partyPath('importa') + '" data-nav="importa"><b>' + esc(t.dato_clave.valor) + '</b><span>' + esc(t.dato_clave.etiqueta) + '</span></a>';
  }
  function partyOptions(sel, exclude) {
    return D.partidos.filter(function (p) { return p.id === sel || exclude.indexOf(p.id) < 0; }).map(function (p) { return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.siglas + ' · ' + p.nombre) + '</option>'; }).join('');
  }
  function cmpOut() {
    var n = cmp.sel.length;
    var picks = '<div class="cmp-picks n' + n + '">' + cmp.sel.map(function (id, i) {
      var p = P(id);
      return '<div class="cmp-pick1" style="--pc:' + esc(p.color) + '">' + avatar(p) + '<label class="sel" for="cmpSel' + i + '"><span class="sr">Partido</span><select id="cmpSel' + i + '" data-cmp-idx="' + i + '">' + partyOptions(id, cmp.sel) + '</select></label>' +
        (n > 1 ? '<button type="button" class="xbtn" data-cmp-del="' + i + '" aria-label="Quitar ' + esc(p.siglas) + ' de la comparación">✕</button>' : '') + '</div>';
    }).join('') + (n < cmpMax() ? '<button type="button" class="cmp-add" id="cmpAdd">+ Añadir partido</button>' : '') + '</div>';
    var col = function (p) {
      var it = p.propuestas.filter(function (x) { return x.area === cmp.area; });
      return '<div class="cmp-col" style="--pc:' + esc(p.color) + '"><div class="cmp-h">' + avatar(p) + '<b>' + esc(p.siglas) + '</b><span class="cnt">' + it.length + '</span></div>' +
        (it.length ? '<ul class="props">' + it.map(function (x) { return propItem(x, p); }).join('') + '</ul>' : '<div class="empty small"><p>Sin propuestas sobre ' + esc(areaName(cmp.area).toLowerCase()) + '.</p></div>') + '</div>';
    };
    return picks + '<div class="cmp-grid n' + n + '">' + cmp.sel.map(function (id) { return col(P(id)); }).join('') + '</div>' +
      '<div class="cmp-actions"><button class="btn" type="button" id="cmpShare">' + icon('share', 17) + (n > 1 ? ' Compartir comparación' : ' Compartir') + '</button></div>';
  }

  // ----- Test -----
  var T = { i: 0, ans: null, w: null, done: false };
  function tload() { if (T.ans) return; T.ans = store.get('tans', {}); T.w = store.get('tw2', null); if (!T.w) { var old = store.get('tw', {}); T.w = {}; Object.keys(old).forEach(function (k) { T.w[k] = 'mucho'; }); } var q = D.test.afirmaciones; T.i = 0; while (T.i < q.length && T.ans[q[T.i].id] !== undefined) T.i++; T.done = T.i >= q.length; }
  function tsave() { store.set('tans', T.ans); store.set('tw2', T.w); }
  function viewTest() {
    if (!D.test || !D.test.afirmaciones || !D.test.afirmaciones.length) return empty('El test se está preparando.');
    tload();
    return '<section class="block first test">' + (T.done ? testResult() : testQ()) + '</section>' + footer();
  }
  var T_PESO = { poco: 0.5, mucho: 2 };
  function impRow(a) {
    var cur = T.w[a.id] || '';
    return '<div class="timp" role="radiogroup" aria-label="Cuánto te importa este tema"><span class="timp-l">¿Cuánto te importa?</span><div class="timp-seg">' +
      [['poco', 'Poco'], ['', 'Normal'], ['mucho', 'Mucho']].map(function (o) {
        return '<button type="button" role="radio" aria-checked="' + (cur === o[0]) + '" class="timp-b' + (cur === o[0] ? ' on' : '') + '" data-imp="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div></div>';
  }
  function testQ() {
    var q = D.test.afirmaciones, a = q[T.i], n = q.length;
    var answered = Object.keys(T.ans).length;
    return '<div class="tq-top"><div class="tq-bar"><i style="width:' + (T.i / n * 100).toFixed(1) + '%"></i></div><span>' + (T.i + 1) + ' de ' + n + '</span></div>' +
      (T.i === 0 && !answered ? '<p class="tq-intro">' + esc(D.test.intro) + ' <b>' + esc(D.test.aviso) + '</b></p>' : '') +
      '<article class="tq" id="tq"><span class="tq-area">' + esc(areaName(a.area)) + '</span><h1 class="tq-text">' + esc(a.texto) + '</h1>' + (a.contexto ? '<p class="tq-ctx">' + esc(a.contexto) + '</p>' : '') + '</article>' +
      impRow(a) +
      '<div class="tq-actions">' +
      '<button type="button" class="tbtn yes" data-ans="1">De acuerdo</button>' +
      '<button type="button" class="tbtn mid" data-ans="0">A medias</button>' +
      '<button type="button" class="tbtn no" data-ans="-1">En desacuerdo</button>' +
      '<button type="button" class="tbtn skip" data-ans="skip">No lo sé / sin opinión<small>No cuenta para ningún partido</small></button>' +
      '<div class="tq-sub"><button type="button" class="linkbtn" data-tprev' + (T.i === 0 ? ' disabled' : '') + '>' + icon('prev', 16) + ' Anterior</button>' +
      '</div></div>' +
      (answered ? '<p class="fine">Tus respuestas se guardan solo en este dispositivo. <button type="button" class="linkbtn inline" data-trestart>Borrar mis respuestas</button></p>' : '<p class="fine">Tus respuestas se quedan en este dispositivo y no se envían a ningún servidor.</p>');
  }
  var T_MIN = 15, T_EMPATE = 5;
  function tcov(pid) { return D.test.afirmaciones.filter(function (a) { var x = (a.posiciones || {})[pid]; return x && x.valor != null; }).length; }
  function scores() {
    var q = D.test.afirmaciones, res = {};
    D.partidos.forEach(function (p) { res[p.id] = { p: p, s: 0, m: 0, n: 0, cov: tcov(p.id) }; });
    q.forEach(function (a) {
      var u = T.ans[a.id]; if (u === undefined || u === 'skip') return;
      var w = T_PESO[T.w[a.id]] || 1;
      Object.keys(res).forEach(function (pid) {
        var pos = (a.posiciones || {})[pid], r = res[pid];
        r.m += w;
        if (!pos || pos.valor == null) { r.s += w * 0.5; return; }
        r.s += w * (1 - Math.abs(u - pos.valor) / 2); r.n++;
      });
    });
    return Object.keys(res).map(function (k) { var r = res[k]; r.ok = r.cov >= T_MIN; r.pct = r.m ? Math.round(r.s / r.m * 100) : null; return r; })
      .sort(function (A, B) { if (A.ok !== B.ok) return A.ok ? -1 : 1; if (!A.ok) return B.cov - A.cov; return (B.pct == null ? -1 : B.pct) - (A.pct == null ? -1 : A.pct); });
  }
  function testResult() {
    var sc = scores(), q = D.test.afirmaciones;
    var nAns = q.filter(function (a) { var u = T.ans[a.id]; return u !== undefined && u !== 'skip'; }).length;
    if (!nAns) return '<div class="empty"><p>No has dado tu opinión en ninguna afirmación. Responde al menos una para ver tus coincidencias.</p><button class="btn" type="button" data-trestart>Empezar de nuevo</button></div>';
    var ok = sc.filter(function (r) { return r.ok; }), low = sc.filter(function (r) { return !r.ok; });
    var top = ok.length ? ok[0].pct : 0;
    var tied = ok.filter(function (r) { return top - r.pct <= T_EMPATE; });
    var lead = tied.length > 1
      ? '<p class="tres-lead"><b>Empate entre ' + tied.map(function (r) { return esc(r.p.siglas); }).join(', ') + '.</b> Están a ' + T_EMPATE + ' puntos o menos: con estas respuestas el test no puede separarlos.</p>'
      : (ok.length ? '<p class="tres-lead">El más cercano es <b>' + esc(ok[0].p.siglas) + '</b>' + (ok[1] ? ', con ' + (top - ok[1].pct) + ' puntos de ventaja sobre el siguiente' : '') + '.</p>' : '');
    var row = function (r, k) {
      var p = r.p, tie = r.ok && top - r.pct <= T_EMPATE && tied.length > 1;
      return '<details class="tr' + (r.ok && k < 3 ? ' top' : '') + '" style="--pc:' + esc(p.color) + '"><summary>' + avatar(p) + '<span class="tr-main"><b>' + esc(p.nombre) + (tie ? ' <span class="tag">Empate</span>' : '') + '</b>' +
        (r.ok ? '<span class="prow-bar"><i style="width:' + (r.pct || 0) + '%"></i></span><small>Posición documentada en ' + r.n + ' de tus ' + nAns + ' respuestas</small>' : '<small>Posición documentada en ' + r.cov + ' de ' + q.length + ' afirmaciones</small>') +
        '</span><span class="tr-pct">' + (r.ok ? r.pct + '%' : '') + '</span></summary>' + trDetail(p) + '</details>';
    };
    return '<h1 class="h1">Tus coincidencias</h1><p class="lede small">' + esc(D.test.aviso) + ' Has respondido ' + nAns + ' de ' + q.length + '.</p>' + lead +
      '<div class="tres">' + ok.map(row).join('') + '</div>' +
      (low.length ? '<details class="tres-low"><summary>Partidos con datos insuficientes (' + low.length + ')</summary><p class="fine">Tienen posición verificable en menos de ' + T_MIN + ' afirmaciones, así que no entran en la clasificación: un porcentaje calculado con tan pocos datos engañaría. Puedes ver en qué coincides en las que sí tienen.</p><div class="tres">' + low.map(row).join('') + '</div></details>' : '') +
      '<div class="tres-actions"><button class="btn" type="button" id="testShare">' + icon('share', 17) + ' Compartir resultado</button><button class="btn ghost" type="button" data-trestart>Borrar mis respuestas y repetir</button></div>' +
      '<p class="fine">Tus respuestas se guardan solo en este dispositivo, no se envían a ningún servidor y nadie más puede verlas. Puedes borrarlas cuando quieras.</p>' +
      '<p class="fine">' + esc(D.test.metodo || '') + '</p>';
  }
  function trDetail(p) {
    var idx = {}; p.propuestas.forEach(function (x) { idx[x.id] = x; });
    var lab = { '1': 'De acuerdo', '0': 'A medias', '-1': 'En desacuerdo' };
    return '<ul class="trd">' + D.test.afirmaciones.map(function (a) {
      var u = T.ans[a.id], pos = (a.posiciones || {})[p.id];
      if (u === undefined || u === 'skip') return '';
      if (!pos || pos.valor == null) return '<li class="nd"><p>' + esc(a.texto) + '</p><span>Sin posición documentada</span></li>';
      var match = u === pos.valor ? 'ok' : Math.abs(u - pos.valor) === 2 ? 'ko' : 'half';
      var refs = (pos.ref || []).map(function (id) { return idx[id]; }).filter(Boolean);
      return '<li class="' + match + '"><p>' + esc(a.texto) + '</p><span>Tú: ' + lab[String(u)] + (T.w[a.id] ? ' (te importa ' + T.w[a.id] + ')' : '') + ' · ' + esc(p.siglas) + ': ' + lab[String(pos.valor)] + '</span>' + (pos.nota ? '<em>' + esc(pos.nota) + '</em>' : '') + (pos.contradiccion ? '<em><b>Dice y vota distinto:</b> ' + esc(pos.contradiccion) + '</em>' : '') + (pos.fuente && pos.fuente.url ? src(pos.fuente) : '') + refs.map(function (x) { return x.fuente ? src(x.fuente) : ''; }).join('') + '</li>';
    }).join('') + '</ul>';
  }
  function tanswer(v) {
    var q = D.test.afirmaciones, a = q[T.i];
    T.ans[a.id] = v === 'skip' ? 'skip' : +v;
    tsave();
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    T.i++; if (T.i >= q.length) T.done = true;
    var box = $('.block.test'); box.innerHTML = T.done ? testResult() : testQ();
    if (!reduced) { box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap'); }
    $('#view').scrollTop = 0;
  }

  // ----- Deuda -----
  function viewDeuda() {
    var d = D.deuda;
    if (!d) return empty('La sección de deuda se está preparando.');
    var sp = (d.mecanica && d.mecanica.parametros_simulador) || {};
    var interesAnual = findInterest(d);
    var html = '<section class="dhero"><h1 class="display">' + esc(d.titular_corto || d.titular) + '</h1><p class="lede">' + esc(d.entradilla_corta || d.entradilla) + '</p>' +
      (interesAnual ? '<div class="ticker"><span>Intereses pagados desde que abriste esta página</span><b id="ticker">0 €</b><small>Unos ' + fmt(interesAnual / (365 * 86400), 0) + ' euros por segundo, ' + fmt(interesAnual / 1e9, 1) + ' mil millones al año (IGAE, 2025).</small></div>' : '') + perCapita(d) + '</section>';
    if (d.te_afecta) html += '<section class="block"><div class="block-head"><h2>En qué te afecta</h2></div><div class="afecta">' + d.te_afecta.map(function (x) {
      return '<article class="af"><b>' + esc(x.valor) + '</b><h3>' + esc(x.titulo) + '</h3><p>' + esc(x.texto) + '</p>' + (x.url ? src({ nombre: x.fuente, url: x.url }) : '') + '</article>';
    }).join('') + '</div></section>';
    html += '<section class="block trap"><div class="block-head"><h2>Cómo funciona la trampa</h2></div>' +
      '<div class="trap-stage"><svg id="trapSvg" viewBox="0 0 360 220" role="img" aria-label="Animación: cómo crece la deuda"></svg>' +
      '<div class="trap-text" aria-live="polite"><span class="trap-step" id="trapN"></span><h3 id="trapT"></h3><p id="trapP"></p></div>' +
      '<div class="trap-ctl"><button class="iconbtn" type="button" id="trapPrev" aria-label="Paso anterior">' + icon('prev', 20) + '</button><div class="dots" id="trapDots"></div><button class="btn" type="button" id="trapNext">Siguiente ' + icon('next', 16) + '</button></div></div></section>';
    if (d.por_que_nadie_la_baja) html += '<section class="block"><div class="block-head"><h2>Por qué casi nadie la baja</h2></div><ul class="whyl">' + d.por_que_nadie_la_baja.map(li).join('') + '</ul></section>';
    html += '<section class="block sim"><div class="block-head"><h2>Pruébalo tú</h2>' + infoBtn('sim') + '</div>' +
      '<div class="sim-grid"><div class="sim-out">' +
      '<div class="sim-kpis"><div><span>Deuda en <b id="kYear">2056</b></span><b id="kDebt" class="sim-k">–</b></div><div><span id="kDefL">Déficit en 2056</span><b id="kDef" class="sim-k">–</b></div></div>' +
      '<div class="sim-chart"><span class="sim-lab">Deuda, % del PIB</span><svg id="simSvg" viewBox="0 0 340 170" role="img" aria-label="Evolución de la deuda"></svg></div>' +
      '<div class="sim-chart"><span class="sim-lab">Déficit (rojo) o superávit (verde), % del PIB</span><svg id="defSvg" viewBox="0 0 340 90" role="img" aria-label="Déficit o superávit cada año"></svg></div>' +
      '</div><div class="sim-ctl">' +
      slider('sG', 'Crecimiento de la economía', '%', SIM.g, 0, 7, 0.1, null, 'crec') +
      slider('sR', 'Interés de la deuda', '%', SIM.r, 0.5, 8, 0.1, null, 'interes') +
      slider('sS', 'Gasto público', 'p.', 0, -5, 5, 0.1, null, 'gasto') +
      slider('sT', 'Impuestos', 'p.', 0, -5, 5, 0.1, null, 'impuestos') +
      '<div class="presets"><button type="button" class="chip on" data-preset="hoy">Previsión actual</button><button type="button" class="chip" data-preset="tipos">Suben los tipos</button><button type="button" class="chip" data-preset="crisis">Crecimiento bajo</button></div>' +
      '<div class="sim-need" id="simNeed"></div></div></div></section>';
    html += '<section class="block"><details class="dparties"><summary><h2>Qué proponen los partidos</h2><span class="cnt">' + D.partidos.filter(function (p) { return p.tier !== 'otros'; }).length + '</span></summary><p class="intro-note">Sus propuestas sobre deuda y déficit, tal cual. Si un partido no tiene ninguna, también se indica.</p><div class="plist">' + D.partidos.filter(function (p) { return p.tier !== 'otros'; }).map(function (p) {
      var it = p.propuestas.filter(function (x) { return x.area === 'deuda'; });
      return '<div class="pos" style="--pc:' + esc(p.color) + '">' + avatar(p) + '<div><b>' + esc(p.nombre) + '</b>' + (it.length ? '<ul class="pos-list">' + it.slice(0, 3).map(function (x) { return '<li>' + esc(x.texto) + '</li>'; }).join('') + '</ul>' : '<p>Sin propuestas sobre deuda o déficit.</p>') + '</div></div>';
    }).join('') + '</div></details>';
    html += '<button class="btn wide" type="button" id="shareDebt">' + icon('share', 17) + ' Compartir</button>' + sources(d.fuentes) + '</section>' + footer();
    return html;
  }
  function perCapita(d) {
    var c = (d.cifras_clave || []).filter(function (x) { return /habitante/i.test(x.etiqueta || ''); })[0];
    if (!c) return '';
    return '<button type="button" class="percap" id="shareCap"><span>A cada persona en España le corresponden</span><b>' + esc(c.valor) + ' €</b><small>de deuda pública · Compártelo</small></button>';
  }
  function li(t) { return '<li>' + esc(typeof t === 'string' ? t : (t.texto || t.titulo || '')) + '</li>'; }
  function sources(f) { if (!f || !f.length) return ''; return '<details class="srcs"><summary>Fuentes (' + f.length + ')</summary><ul>' + f.map(function (x) { return '<li>' + src(x) + '</li>'; }).join('') + '</ul></details>'; }
  function slider(id, label, unit, val, min, max, step, note, info) {
    var pos = ((val - min) / (max - min) * 100).toFixed(2);
    return '<div class="slider"><label for="' + id + '"><span>' + esc(label) + (info ? infoBtn(info) : '') + '</span><output id="' + id + 'o">' + fmt(val, 1) + ' ' + esc(unit) + '</output></label>' +
      '<div class="sl-track"><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-unit="' + esc(unit) + '" data-hoy="' + val + '"><i class="sl-hoy" style="left:calc(' + pos + '% + ' + (8 - 16 * pos / 100).toFixed(1) + 'px)" aria-hidden="true"></i></div>' +
      '</div>';
  }
  function findInterest(d) {
    var c = (d.cifras_clave || []).filter(function (x) { return /inter[eé]s/i.test(x.etiqueta || ''); })[0];
    if (!c) return null;
    var v = parseFloat(String(c.valor).replace(/\./g, '').replace(',', '.'));
    var u = (c.unidad || '') + ' ' + (c.valor || '');
    if (isNaN(v)) return null;
    if (/mil millones|bn|millardos/i.test(u)) return v * 1e9;
    if (/millones/i.test(u)) return v * 1e6;
    if (v > 1e8) return v;
    return null;
  }
  function countryBars(list) {
    var arr = list.slice().sort(function (a, b) { return b.deuda_pib - a.deuda_pib; });
    var max = Math.max.apply(null, arr.map(function (x) { return x.deuda_pib || 0; }));
    return '<div class="cbars">' + arr.map(function (c) {
      var es = /espa/i.test(c.pais);
      return '<div class="cbar' + (es ? ' es' : '') + '"><span class="cb-n">' + esc(c.pais) + '</span><span class="cb-t"><i style="width:' + (c.deuda_pib / max * 100).toFixed(1) + '%"></i><b>' + fmt(c.deuda_pib, 0) + '%</b></span></div>';
    }).join('') + '<div class="cb-ref"><span>Línea del 60% del PIB, límite del Tratado de Maastricht</span></div></div><p class="fine">Deuda pública en % del PIB. ' + esc((arr[0] && arr[0].fuente) || '') + (arr[0] && arr[0].anio ? ', ' + arr[0].anio : '') + '.</p>';
  }

  // Trap animation: debt bars split in principal vs interest-on-interest
  var trap = { i: 0 };
  var TRAP_DEFAULT = [
    { titulo: 'Debes 100', texto: 'Imagina que el Estado debe 100. Cada año paga intereses por esa deuda, igual que una hipoteca.' },
    { titulo: 'Los intereses se pagan con más deuda', texto: 'Si gasta más de lo que ingresa, no le llega para los intereses: pide prestado otra vez para pagarlos.' },
    { titulo: 'Intereses sobre intereses', texto: 'Al año siguiente paga intereses también por lo que pidió para pagar intereses. La parte clara de cada barra crece sola.' },
    { titulo: 'El crecimiento puede salvarte… o no', texto: 'Si la economía crece más rápido que el tipo de interés, la deuda pesa menos con el tiempo. Si crece menos, la bola se acelera.' },
    { titulo: 'Cada vez cuesta más salir', texto: 'Cuanto más tarde se corrige, mayor es el ajuste necesario. Por eso esperar sale caro: es una trampa que se hace grande sola.' }
  ];
  function trapSteps() { var m = D.deuda && D.deuda.mecanica; var p = m && (m.pasos_cortos || m.pasos); return p && p.length >= 3 ? p : TRAP_DEFAULT; }
  function drawTrap() {
    var svg = $('#trapSvg'); if (!svg) return;
    var steps = trapSteps(), n = steps.length, i = trap.i;
    var W = 360, H = 220, L = 30, R = 10, T = 26, B = 24;
    var scene = steps[i].escena != null ? steps[i].escena : (n === 7 ? i : Math.round(i / Math.max(1, n - 1) * 6));
    var out = '';
    function lineChart(series, ymax, xlab) {
      var len = series[0].pts.length;
      var X = function (k) { return L + (W - L - R) * k / (len - 1); }, Y = function (v) { return T + (H - T - B) * (1 - v / ymax); };
      var g = '';
      for (var v = 0; v <= ymax; v += ymax > 150 ? 50 : 25) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/><text x="' + (L - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" class="axl">' + v + '%</text>';
      (xlab || []).forEach(function (xl) { g += '<text x="' + X(xl[0]) + '" y="' + (H - 7) + '" text-anchor="middle" class="axl">' + xl[1] + '</text>'; });
      series.forEach(function (s) {
        var d = s.pts.map(function (p, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(p).toFixed(1); }).join(' ');
        var last = s.pts[len - 1];
        g += '<path d="' + d + '" class="tline ' + s.cls + '" pathLength="1"/><circle cx="' + X(len - 1) + '" cy="' + Y(last) + '" r="3.5" class="tdot ' + s.cls + '"/>' +
          '<text x="' + (X(len - 1) - 6) + '" y="' + (last < s.pts[0] ? Y(last) + 17 : Y(last) - 9) + '" text-anchor="end" class="tl halo ' + s.cls + '">' + esc(s.label) + '</text>';
      });
      return g;
    }
    function bars(items, unit) {
      var max = Math.max.apply(null, items.map(function (x) { return x.v; }));
      var bw = (W - L - R) / items.length * 0.62, gap = (W - L - R) / items.length;
      var g = '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" class="ax"/>';
      items.forEach(function (x, k) {
        var h = x.v / max * (H - T - B - 14), xx = L + k * gap + (gap - bw) / 2;
        g += '<rect class="tb ' + (x.cls || 'base') + '" x="' + xx.toFixed(1) + '" y="' + (H - B - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" style="--d:' + (k * 90) + 'ms"/>' +
          '<text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (H - B - h - 5).toFixed(1) + '" text-anchor="middle" class="tl">' + esc(x.t) + '</text>' +
          '<text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="axl">' + esc(x.l) + '</text>';
      });
      return g;
    }
    function path(d0, r, g, pb, yrs, feedback) {
      var p = [d0], d = d0;
      for (var y = 0; y < yrs; y++) { var rr = feedback ? r + Math.max(0, (d - 100) * 0.06) : r; d = d * (1 + rr / 100) / (1 + g / 100) - pb; p.push(Math.max(0, d)); }
      return p;
    }
    var serie = (D.deuda && D.deuda.serie_espana) || [];
    var ints = findInterest(D.deuda) || 40.3e9;
    if (scene === 0) {
      out = bars([{ l: 'Ingresa', v: 100, t: '100', cls: 'base' }, { l: 'Gasta', v: 106, t: '106', cls: 'extra' }]) +
        '<text x="' + (W / 2) + '" y="16" text-anchor="middle" class="tl">Por cada 100 € que ingresa, gasta unos 106</text>';
    } else if (scene === 1 && serie.length > 5) {
      var pts = serie.map(function (x) { return x.deuda_pib; });
      out = lineChart([{ pts: pts, cls: 'debt', label: fmt(pts[pts.length - 1], 0) + '%' }], 140, [[0, serie[0].anio], [Math.round((pts.length - 1) / 2), serie[Math.round((pts.length - 1) / 2)].anio], [pts.length - 1, serie[pts.length - 1].anio]]) +
        '<text x="' + L + '" y="14" class="tl">Deuda pública de España, % del PIB</text>';
    } else if (scene === 2) {
      var bn = ints / 1e9;
      out = bars([{ l: 'Intereses', v: bn, t: fmt(bn, 0), cls: 'extra' }, { l: 'Defensa', v: 14.2, t: '14', cls: 'base' }, { l: 'Educación', v: bn / 0.61, t: fmt(bn / 0.61, 0), cls: 'base' }, { l: 'Sanidad', v: bn / 0.39, t: fmt(bn / 0.39, 0), cls: 'base' }]) +
        '<text x="' + L + '" y="14" class="tl">Miles de millones de euros al año (aprox.)</text>';
    } else if (scene === 3) {
      out = lineChart([{ pts: path(100, 2.4, 4.8, 0, 20), cls: 'good', label: 'crece más que el interés' }, { pts: path(100, 4, 2, 0, 20), cls: 'bad', label: 'interés mayor que crecimiento' }], 160, [[0, 'hoy'], [10, '+10 años'], [20, '+20']]) +
        '<text x="' + L + '" y="14" class="tl">Misma deuda inicial, sin déficit primario</text>';
    } else if (scene === 4) {
      out = lineChart([{ pts: path(100, 3, 2.5, -2, 20, true), cls: 'bad', label: 'la prima de riesgo se dispara' }, { pts: path(100, 3, 2.5, -2, 20, false), cls: 'debt', label: 'sin pánico' }], 260, [[0, 'hoy'], [10, '+10 años'], [20, '+20']]) +
        '<text x="' + L + '" y="14" class="tl">Si suben los intereses al subir la deuda</text>';
    } else if (scene === 5) {
      var r5 = 4, g5 = 3, q = (1 + r5 / 100) / (1 + g5 / 100), S = 0;
      for (var k5 = 0; k5 < 15; k5++) S += Math.pow(q, k5);
      var need = [0, 5, 10].map(function (delay) {
        var dd = 100; for (var y5 = 0; y5 < delay; y5++) dd = dd * q + 1;
        return { delay: delay, d: dd, pb: (dd * Math.pow(q, 15) - 80) / S };
      });
      out = bars(need.map(function (x, k) { return { l: x.delay ? 'Empezar en ' + x.delay + ' años' : 'Empezar hoy', v: x.pb, t: fmt(x.pb, 1) + '% PIB', cls: k ? 'extra' : 'base' }; })) +
        '<text x="' + L + '" y="14" class="tl">Superávit primario necesario cada año para bajar al 80%</text>';    } else {
      out = lineChart([{ pts: [99.3, 123, 181], cls: 'bad', label: '181% en 2070' }], 200, [[0, '2026'], [1, '2050 · 123%'], [2, '2070']]) +
        '<text x="' + L + '" y="14" class="tl">Proyección AIReF sin cambios de política</text>';
    }
    svg.innerHTML = out;
    var s = steps[i];
    $('#trapN').textContent = 'Paso ' + (i + 1) + ' de ' + n;
    $('#trapT').textContent = String(s.titulo).replace(/^\d+\.\s*/, ''); $('#trapP').textContent = s.texto;
    $('#trapDots').innerHTML = steps.map(function (_, j) { return '<i class="' + (j === i ? 'on' : '') + '"></i>'; }).join('');
    $('#trapPrev').disabled = i === 0;
    $('#trapNext').innerHTML = i === n - 1 ? 'Volver a empezar' : 'Siguiente ' + icon('next', 16);
  }
  // Modelo: deuda(t+1) = deuda(t)·(1+i)/(1+g) − saldo primario. El interés converge desde el 2,4% actual en 8 años;
  // el crecimiento parte del 4,8% previsto y converge en 3 años; el envejecimiento resta 2 puntos de saldo primario hasta 2050
  // (calibrado para reproducir la proyección de la AIReF: 123% del PIB en 2050).
  var SIM = { d0: 99.9, r0: 2.4, g0: 4.8, r: 3.5, g: 3.3, envejecimiento: 2.0, anio0: 2026, PIB: 1744e9 / 0.999 };
  var INFO = {
    sim: ['Cómo funciona', 'La línea de partida es la previsión de la AIReF: la deuda baja un poco hasta 2030 y vuelve a subir por el envejecimiento hasta el 123% del PIB en 2050. Mueve los controles para ver qué pasaría en 30 años. El déficit es la diferencia entre lo que el Estado gasta (incluidos los intereses) y lo que ingresa. Es un modelo simplificado: no incluye el efecto que un recorte o una subida de impuestos tendría sobre el crecimiento.'],
    crec: ['Crecimiento de la economía', 'Cuánto crece cada año el PIB en euros (crecimiento real más inflación). Cuanto más crece la economía, menos pesa la deuda. Previsión: 4,8% este año (AIReF) y un 3,3% a largo plazo (1,3% real más 2% de inflación).'],
    interes: ['Interés de la deuda', 'Interés medio que paga el Estado por toda su deuda. Hoy es del 2,4%, pero sube poco a poco porque la deuda antigua y barata se renueva a los tipos actuales: el bono a 10 años está en torno al 3,5%. En el modelo el cambio se nota de forma gradual en 8 años.'],
    gasto: ['Gasto público', 'Cambio permanente en el gasto público, en puntos del PIB. Un punto son unos 17.500 millones de euros al año. Negativo es recortar; positivo es gastar más. No incluye el gasto en intereses, que depende de la deuda.'],
    impuestos: ['Impuestos', 'Cambio permanente en lo que se recauda, en puntos del PIB. Un punto son unos 17.500 millones de euros al año. Positivo es subir impuestos; negativo es bajarlos.'],
    need: ['Qué haría falta', 'Calcula el ajuste anual (menos gasto, más impuestos o una combinación) necesario para cada objetivo, con el crecimiento y el interés que hayas elegido.']
  };
  function infoBtn(k) { return '<button type="button" class="ibtn" data-info="' + k + '" aria-label="Más información">i</button>'; }
  function simPath(r, g, aj, years) {
    var d = SIM.d0, out = [d], def = [];
    for (var t = 1; t <= (years || 30); t++) {
      var rt = SIM.r0 + (r - SIM.r0) * Math.min(1, t / 8), gt = SIM.g0 + (g - SIM.g0) * Math.min(1, (t - 1) / 3);
      var pb = -SIM.envejecimiento * Math.min(1, t / 24) + aj;
      var interes = d * rt / 100 / (1 + gt / 100);
      def.push(interes - pb);
      d = d * (1 + rt / 100) / (1 + gt / 100) - pb; if (d < 0) d = 0; if (d > 400) d = 400; out.push(d);
    }
    out.def = def;
    return out;
  }
  function solveAj(r, g, test) { var lo = -3, hi = 10; for (var k = 0; k < 40; k++) { var m = (lo + hi) / 2; if (test(simPath(r, g, m))) hi = m; else lo = m; } return hi; }
  function simulate() {
    var gv = function (id) { var el = $('#' + id); return el ? parseFloat(el.value) : 0; };
    var r = gv('sR'), g = gv('sG'), aj = gv('sT') - gv('sS');
    var pts = simPath(r, g, aj), base = simPath(SIM.r, SIM.g, 0);
    var same = Math.abs(r - SIM.r) < 1e-9 && Math.abs(g - SIM.g) < 1e-9 && Math.abs(aj) < 1e-9;
    var svg = $('#simSvg'); if (!svg) return;
    var W = 340, H = 170, L = 34, B = 20, T = 10, R = 10;
    var ymax = Math.max(160, Math.ceil(Math.max.apply(null, pts.concat(base)) / 20) * 20);
    var X = function (i) { return L + (W - L - R) * i / 30; }, Y = function (v) { return T + (H - T - B) * (1 - Math.min(v, ymax) / ymax); };
    var grid = '';
    for (var v = 0; v <= ymax; v += ymax > 200 ? 100 : 40) grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/><text x="' + (L - 5) + '" y="' + (Y(v) + 3) + '" text-anchor="end" class="axl">' + v + '%</text>';
    [0, 10, 20, 30].forEach(function (yy) { grid += '<text x="' + X(yy) + '" y="' + (H - 5) + '" text-anchor="' + (yy === 30 ? 'end' : yy === 0 ? 'start' : 'middle') + '" class="axl">' + (SIM.anio0 + yy) + '</text>'; });
    var mk = function (arr) { return arr.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p).toFixed(1); }).join(' '); };
    var end = pts[30], cls = end > SIM.d0 + 5 ? 'up' : end < SIM.d0 - 5 ? 'down' : 'flat';
    var bline = same ? '' : '<path d="' + mk(base) + '" class="sim-base"/>';
    svg.innerHTML = grid + bline + '<path d="' + mk(pts) + '" class="sim-line ' + cls + '"/><circle cx="' + X(30) + '" cy="' + Y(end) + '" r="4" class="sim-dot ' + cls + '"/>';
    // déficit
    var dsvg = $('#defSvg'), DH = 90, dmax = Math.max(4, Math.ceil(Math.max.apply(null, pts.def.map(Math.abs))));
    var DY = function (v) { return DH / 2 - (v / dmax) * (DH / 2 - 8); }, bw = (W - L - R) / 30 * 0.7;
    var bars = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + DY(0) + '" y2="' + DY(0) + '" class="ax0"/><text x="' + (L - 5) + '" y="' + (DY(dmax) + 6) + '" text-anchor="end" class="axl">' + dmax + '%</text><text x="' + (L - 5) + '" y="' + (DY(0) + 3) + '" text-anchor="end" class="axl">0</text>';
    pts.def.forEach(function (v, i) { var x = X(i + 0.5) - bw / 2, y = DY(Math.max(v, 0)), h = Math.abs(DY(v) - DY(0)); bars += '<rect x="' + x.toFixed(1) + '" y="' + (v > 0 ? DY(v) : DY(0)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0.5, h).toFixed(1) + '" class="' + (v > 0 ? 'bdef' : 'bsup') + '"/>'; });
    dsvg.innerHTML = bars;
    var lastDef = pts.def[29];
    $('#kDebt').textContent = fmt(end, 0) + '%';
    $('#kDebt').className = 'sim-k ' + cls;
    $('#kDefL').textContent = (lastDef >= 0 ? 'Déficit' : 'Superávit') + ' en ' + (SIM.anio0 + 30);
    $('#kDef').textContent = fmt(Math.abs(lastDef), 1) + '%';
    $('#kDef').className = 'sim-k ' + (lastDef > 0.05 ? 'up' : 'down');
    var eur = function (pp) { return fmt(Math.abs(pp) / 100 * SIM.PIB / 1e9, 0) + ' mil M€/año'; };
    var needs = [
      { t: 'Para que la deuda no suba', aj: solveAj(r, g, function (p) { return Math.max.apply(null, p.slice(1)) <= SIM.d0; }) },
      { t: 'Para bajarla al 60% en 20 años', aj: solveAj(r, g, function (p) { return p[20] <= 60; }) }
    ];
    $('#simNeed').innerHTML = '<div class="need-h"><h3>Qué haría falta</h3>' + infoBtn('need') + '</div>' + needs.map(function (n) {
      var gap = n.aj - aj, cut = gap > 0.05;
      return '<div class="need ' + (cut ? 'cut' : 'ok') + '"><span>' + esc(n.t) + '</span><b>' + (cut ? 'Ajuste de ' + fmt(gap, 1) + ' puntos más · ' + eur(gap) : 'Se cumple') + '</b></div>';
    }).join('');
    $$('.slider input').forEach(function (el) {
      var o = $('#' + el.id + 'o'); if (!o) return; var val = parseFloat(el.value);
      if (el.id === 'sS' || el.id === 'sT') o.textContent = (val > 0 ? '+' : val < 0 ? '−' : '') + fmt(Math.abs(val), 1) + ' p. (' + fmt(Math.abs(val) / 100 * SIM.PIB / 1e9, 0) + ' mil M€)';
      else o.textContent = fmt(val, 1) + ' %';
    });
  }
  var tickerT;
  function startTicker() {
    clearInterval(tickerT);
    var el = $('#ticker'); if (!el) return;
    var perSec = findInterest(D.deuda) / (365 * 86400), t0 = Date.now(); debtT0 = t0;
    tickerT = setInterval(function () { if (!document.body.contains(el)) { clearInterval(tickerT); return; } el.textContent = fmt(perSec * (Date.now() - t0) / 1000, 0) + ' €'; }, 100);
  }

  // ----- Importa -----
  var CIS_MAP = [[/vivienda/i, 'vivienda'], [/paro|empleo/i, 'empleo'], [/econ[oó]mic/i, 'salarios-productividad'], [/sanidad/i, 'sanidad'], [/educaci/i, 'educacion'], [/pensi/i, 'pensiones'], [/corrupci|pol[ií]tic|gobierno|extremism/i, 'instituciones'], [/inmigraci/i, 'inmigracion'], [/juventud/i, 'vivienda']];
  function temaById(id) { var t = (D.importa && D.importa.temas) || []; for (var i = 0; i < t.length; i++) if (t[i].id === id) return t[i]; return null; }
  function cisTarget(problema) {
    var temas = (D.importa && D.importa.temas) || [];
    for (var i = 0; i < temas.length; i++) if ((temas[i].cis || []).indexOf(problema) >= 0) return 'importa-' + temas[i].id;
    for (var j = 0; j < CIS_MAP.length; j++) if (CIS_MAP[j][0].test(problema)) { var id = CIS_MAP[j][1]; if (temaById(id)) return 'importa-' + id; if (D.areas.some(function (a) { return a.id === id; })) return 'tema-' + id; }
    return null;
  }
  function viewImporta() {
    var d = D.importa; if (!d) return empty('Esta sección se está preparando.');
    var html = '<section class="block first"><h1 class="h1">Lo que importa</h1><p class="lede small">' + esc(d.entradilla || 'Los problemas con más impacto en la vida diaria, con datos y fuentes.') + '</p>';
    html += '<div class="mgrid">' + (d.temas || []).map(function (t) {
      var target = t.enlace === 'deuda' || t.id === 'deuda' ? 'deuda' : 'importa-' + t.id;
      return '<a class="mcard" href="' + partyPath(target) + '" data-nav="' + target + '"><span class="m-t">' + esc(t.titulo) + '</span><b class="m-v">' + esc(t.dato_clave && t.dato_clave.valor) + '</b><span class="m-l">' + esc(t.dato_clave && t.dato_clave.etiqueta) + '</span></a>';
    }).join('') + '</div></section>';
    var cis = d.preocupaciones_cis;
    if (cis && cis.top && cis.top.length) {
      var max = Math.max.apply(null, cis.top.map(function (x) { return x.porcentaje || 0; }));
      html += '<section class="block"><div class="block-head"><h2>Lo que preocupa a los españoles</h2></div><div class="cbars cis">' + cis.top.slice(0, 10).map(function (x) {
        var tg = cisTarget(x.problema);
        var inner = '<span class="cb-n">' + esc(x.problema) + '</span><span class="cb-t"><i style="width:' + (x.porcentaje / max * 100).toFixed(1) + '%"></i><b>' + fmt(x.porcentaje, 1) + '%</b></span>' + (tg ? icon('chev', 16) : '<span></span>');
        return tg ? '<a class="cbar link" href="' + partyPath(tg) + '" data-nav="' + tg + '">' + inner + '</a>' : '<div class="cbar">' + inner + '</div>';
      }).join('') + '</div><p class="fine">' + src({ nombre: cis.fuente, url: cis.url }, (cis.fuente || 'CIS') + (cis.fecha ? ' · ' + cis.fecha : '')) + ' Porcentaje que lo cita entre los principales problemas de España.</p></section>';
    }
    var qs = d.test_del_votante || (D.preguntas_votante && D.preguntas_votante.preguntas);
    if (qs && qs.length) html += '<section class="block"><div class="block-head"><h2>Preguntas para hacerte al escuchar a un candidato</h2></div><ol class="qlist check">' + qs.map(li).join('') + '</ol></section>';
    html += '<section class="block">' + sources(d.fuentes) + '</section>' + footer();
    return html;
  }
  function longText(txt) {
    txt = String(txt || '');
    if (txt.length < 380) return '<p class="tema-res">' + esc(txt) + '</p>';
    var parts = txt.match(/[^.]+\.(\s|$)/g) || [txt], head = '', i = 0;
    while (i < parts.length && (head + parts[i]).length < 300) { head += parts[i]; i++; }
    if (!head) { head = parts[0]; i = 1; }
    return '<p class="tema-res">' + esc(head.trim()) + '</p><details class="more-txt"><summary>Leer más</summary><p class="tema-res">' + esc(parts.slice(i).join('').trim()) + '</p></details>';
  }
  function viewImportaTema(id) {
    var t = temaById(id); if (!t) return empty('No encontramos ese tema.');
    var dc = t.dato_clave || {};
    var html = '<section class="block first"><h1 class="h1">' + esc(t.titulo) + '</h1>' +
      '<div class="sheet-big"><b>' + esc(dc.valor) + '</b><span>' + esc(dc.etiqueta) + '</span>' + src({ nombre: dc.fuente, url: dc.url }, (dc.fuente || '') + (dc.fecha ? ' · ' + dc.fecha : '')) + '</div>' +
      ((t.resumen || t.por_que_importa) ? '<p class="tema-res">' + esc(t.resumen || t.por_que_importa) + '</p>' : '') + '</section>';
    if ((t.datos || []).length) html += '<section class="block"><div class="block-head"><h2>Datos</h2></div><ul class="dlist">' + t.datos.map(function (x) { return '<li><b>' + esc(x.valor) + '</b><span>' + esc(x.etiqueta) + '</span>' + src({ nombre: x.fuente, url: x.url }, (x.fuente || 'Fuente') + (x.fecha ? ' · ' + x.fecha : '')) + '</li>'; }).join('') + '</ul></section>';
    if ((t.causas || []).length) html += '<section class="block"><div class="block-head"><h2>Causas</h2></div><div class="cards2">' + t.causas.map(function (x) { return '<article class="icard"><h3>' + esc(x.titulo) + '</h3><p>' + esc(x.texto) + '</p></article>'; }).join('') + '</div></section>';
    (t.subtemas || []).forEach(function (s) {
      html += '<section class="block"><div class="block-head"><h2>' + esc(s.titulo) + '</h2></div>' + longText(s.texto) + ((s.datos || []).length ? '<ul class="dlist">' + s.datos.map(function (x) { return '<li><b>' + esc(x.valor) + '</b><span>' + esc(x.etiqueta) + '</span>' + src({ nombre: x.fuente, url: x.url }) + '</li>'; }).join('') + '</ul>' : '') + '</section>';
    });
    if (t.y_quien_lo_paga) html += '<section class="block"><div class="paga"><b>¿Y quién lo paga?</b><p>' + esc(t.y_quien_lo_paga) + '</p><a href="' + partyPath('deuda') + '" data-nav="deuda">Ver la deuda pública</a></div></section>';
    if ((t.preguntas || []).length) html += '<section class="block"><div class="block-head"><h2>Preguntas para los candidatos</h2></div><ul class="qs">' + t.preguntas.map(li).join('') + '</ul></section>';
    if (t.area) html += '<section class="block"><a class="btn wide" href="' + partyPath('tema-' + t.area) + '" data-nav="tema-' + t.area + '">Ver qué proponen los partidos</a></section>';
    return html + footer();
  }

  function viewMetodologia() {
    var m = (D.meta && D.meta.metodologia) || [
      ['Propuestas', 'Resumimos cada propuesta en una frase y quitamos la paja, pero no la interpretamos ni la valoramos. Usamos el programa para el 29N cuando el partido lo ha publicado; si no, el de las generales de 2023 junto con declaraciones y actuaciones públicas recientes, siempre con fecha y fuente. Cuando se publiquen los nuevos programas, se actualizarán.'],
      ['Críticas', 'Recogemos los contras económicos, sociales y culturales que señalan instituciones y expertos de distinto signo (AIReF, Banco de España, Fedea, Funcas, OCDE, FMI, Comisión Europea, académicos). Buscamos la mejor versión de cada crítica y aplicamos el mismo criterio a todos los partidos.'],
      ['Neutralidad no es punto medio', 'Nuestra neutralidad es de método: los mismos criterios, públicos y explícitos, para todos. No igualamos resultados. Si una propuesta choca con los derechos fundamentales, con el Estado de derecho o con la evidencia disponible, lo decimos con claridad, sea del partido que sea. Repartir las culpas a partes iguales cuando la realidad no es igual también sería un sesgo. Nuestras referencias son la Constitución y el Tribunal Constitucional, el Convenio Europeo de Derechos Humanos, la Comisión de Venecia, los indicadores de calidad democrática y el consenso de las instituciones económicas.'],
      ['Orden de los partidos y encuestas', 'Los ordenamos por la media de las últimas encuestas publicadas, cuyas fuentes y fichas técnicas se enlazan abajo. Los escaños son una estimación. Del 24 al 29 de noviembre, por la veda de encuestas (art. 69.7 LOREG), se retiran los sondeos y los partidos se ordenan por los escaños obtenidos en 2023.'],
      ['Privacidad', 'No usamos cookies. Las respuestas del test se calculan y se guardan solo en tu navegador; no se envían a ningún servidor y puedes borrarlas en cualquier momento. La analítica de visitas es anónima y no usa cookies.'],
      ['Independencia', 'Esta herramienta no está vinculada a ningún partido. Si detectas un error o un sesgo, avísanos: corregimos y lo indicamos.']
    ];
    return '<section class="block first"><h1 class="h1">Metodología y fuentes</h1>' + m.map(function (x) { return '<article class="meth"><h2>' + esc(x[0]) + '</h2><p>' + esc(x[1]) + '</p></article>'; }).join('') +
      '<article class="meth"><h2>Aviso</h2><p>Antes de Votar es un proyecto independiente. No está vinculado a ningún partido, candidatura, administración ni medio de comunicación, y no recibe financiación de ninguno de ellos. Su contenido es informativo y no es una recomendación de voto. Las propuestas son resúmenes: en caso de duda, prevalece el documento original del partido, enlazado en cada una. Las críticas recogen análisis publicados por terceros, con su fuente. Los nombres, siglas y colores de los partidos pertenecen a sus titulares y se usan solo para identificarlos. Puede haber errores: si encuentras uno, avísanos.</p></article>' +
      '<article class="meth" id="contacto"><h2>Contacto y correcciones</h2><p>Si ves un error, una fuente que no respalda lo que se dice o quieres pedir una rectificación, escríbenos. Revisamos todos los avisos y corregimos lo antes posible.</p>' + (D.meta && D.meta.form_url ? '<a class="btn" href="' + esc(D.meta.form_url) + '" target="_blank" rel="noopener">Avisar de un error</a>' : '<p class="fine">El formulario de contacto estará disponible próximamente.</p>') + '</article>' +
      '<article class="meth"><h2>Encuestas</h2><p>' + esc(D.encuestas.metodo) + '</p>' + (D.encuestas.fuentes || []).map(function (f) { return src(f); }).join(' ') + '</article></section>' + footer();
  }

  // ---------- After render: bind ----------
  function afterRender(rt) {
    if (rt.view === 'deuda') { trap.i = 0; drawTrap(); simulate(); startTicker(); }
    var qp = $('#qParty');
    if (qp) qp.addEventListener('input', function () {
      var q = norm(qp.value);
      $('#partyList').innerHTML = partyLists(D.partidos.filter(function (p) { return !q || norm([p.nombre, p.siglas, p.candidato, p.ambito, (p.circunscripciones || []).join(' ')].join(' ')).indexOf(q) >= 0; }), qp.value);
    });
    var qprop = $('#qProp');
    if (qprop) { qprop.value = partyState.q; qprop.addEventListener('input', function () { partyState.q = qprop.value; var p = P($('#ptab').getAttribute('data-party')); $('#propList').innerHTML = propList(p, partyState.area, partyState.q); }); }
    var co = $('#cmpOut'); if (co && !co._b) { co._b = 1; co.addEventListener('change', function (ev) { var s = ev.target.closest('[data-cmp-idx]'); if (!s) return; cmp.sel[+s.getAttribute('data-cmp-idx')] = s.value; cmpSave(); co.innerHTML = cmpOut(); }); }
    $$('.slider input').forEach(function (el) { el.addEventListener('input', simulate); });
    var top = $('#view'); top.focus({ preventScroll: true });
  }

  // ---------- Global click delegation ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-nav]');
    if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); closeSheetIfOpen(); go(a.getAttribute('data-nav')); return; }
    var t;
    if ((t = e.target.closest('[data-ptab]'))) {
      var pid = $('#ptab').getAttribute('data-party'), tab = t.getAttribute('data-ptab'); store.set('ptab', tab);
      $$('.seg-btn').forEach(function (b) { b.classList.toggle('on', b === t); b.setAttribute('aria-selected', b === t); });
      var p = P(pid); var box = $('#ptab');
      box.innerHTML = tab === 'criticas' ? partyCriticas(p) : partyPropuestas(p);
      if (!reduced) { box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap'); }
      afterRender({ view: 'partido-tab' });
      var seg = $('.seg'); if (seg && seg.getBoundingClientRect().top < 0) seg.scrollIntoView({ block: 'start' });
      return;
    }
    if ((t = e.target.closest('[data-area]'))) {
      partyState.area = t.getAttribute('data-area');
      $$('[data-area]').forEach(function (b) { b.classList.toggle('on', b === t); });
      var p2 = P($('#ptab').getAttribute('data-party'));
      $('#propList').innerHTML = propList(p2, partyState.area, partyState.q);
      t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    if ((t = e.target.closest('[data-crit]'))) { partyState.crit = t.getAttribute('data-crit'); var p3 = P($('#ptab').getAttribute('data-party')); $('#ptab').innerHTML = partyCriticas(p3); return; }
    if ((t = e.target.closest('[data-cmp-del]'))) { cmp.sel.splice(+t.getAttribute('data-cmp-del'), 1); cmpSave(); $('#cmpOut').innerHTML = cmpOut(); return; }
    if ((t = e.target.closest('#cmpAdd'))) { var nx = D.partidos.filter(function (p) { return cmp.sel.indexOf(p.id) < 0; })[0]; if (nx) { cmp.sel.push(nx.id); cmpSave(); $('#cmpOut').innerHTML = cmpOut(); var ls = $$('[data-cmp-idx]'); if (ls.length) ls[ls.length - 1].focus(); } return; }
    if ((t = e.target.closest('[data-cmp-area]'))) { cmp.area = t.getAttribute('data-cmp-area'); cmpSave(); $$('[data-cmp-area]').forEach(function (b) { b.classList.toggle('on', b === t); }); $('#cmpOut').innerHTML = cmpOut(); t.scrollIntoView({ inline: 'center', block: 'nearest' }); return; }
    if ((t = e.target.closest('[data-imp]'))) { var qa = D.test.afirmaciones[T.i], v = t.getAttribute('data-imp'); if (v) T.w[qa.id] = v; else delete T.w[qa.id]; tsave(); Array.prototype.forEach.call(document.querySelectorAll('.timp-b'), function (b) { var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); return; }
    if ((t = e.target.closest('[data-ans]'))) { tanswer(t.getAttribute('data-ans')); return; }
    if ((t = e.target.closest('[data-tprev]'))) { if (T.i > 0) { T.i--; $('.block.test').innerHTML = testQ(); } return; }
    if ((t = e.target.closest('[data-trestart]'))) { T.ans = {}; T.w = {}; T.i = 0; T.done = false; tsave(); $('.block.test').innerHTML = testQ(); return; }
    if ((t = e.target.closest('#testShare'))) { var sc = scores().filter(function (r) { return r.ok; }).slice(0, 3); share('Mis coincidencias con los partidos para el 29N: ' + sc.map(function (r) { return r.p.siglas + ' ' + r.pct + '%'; }).join(', ') + '. ¿Y tú?', siteUrl() + '/test/', '<div class="scard"><p class="scard-k" style="font:800 22px var(--f-display)">¿Con quién coincido?</p>' + sc.map(function (r) { return '<div class="scard-row" style="--pc:' + esc(r.p.color) + '">' + avatar(r.p) + '<span class="prow-bar"><i style="width:' + r.pct + '%"></i></span><b>' + r.pct + '%</b></div>'; }).join('') + '<div class="scard-foot"><span>Hazlo tú antes del 29N</span><b>Antes de Votar</b></div>' + stamp() + '</div>'); return; }
    if ((t = e.target.closest('#cmpShare'))) { var ps = cmp.sel.map(P); share(ps.map(function (p) { return p.siglas; }).join(' vs ') + ' en ' + areaName(cmp.area).toLowerCase() + ': ' + (ps.length > 1 ? 'compara sus propuestas' : 'mira sus propuestas') + ' antes del 29N', siteUrl() + '/tema/' + cmp.area + '/', cmpCard(ps)); return; }
    if ((t = e.target.closest('[data-share-prop]'))) {
      var parts = t.getAttribute('data-share-prop').split('|'), pp = P(parts[0]), x = pp.propuestas.filter(function (y) { return y.id === parts[1]; })[0];
      share('Propuesta de ' + pp.siglas + ': «' + x.texto + '»', siteUrl() + '/partido/' + pp.id + '/', propCard(pp, x)); return;
    }
    if ((t = e.target.closest('#shareTop'))) { if (parse(current).view === 'deuda') { share(debtShareText(), siteUrl() + '/deuda/', debtCard(), { live: liveShareTicker, image: drawDebtImage }); return; } share(shareText(), routeUrl(current)); return; }
    if ((t = e.target.closest('#shareCap'))) { share(debtShareText(), siteUrl() + '/deuda/', debtCard(), { live: liveShareTicker, image: drawDebtImage }); return; }
    if ((t = e.target.closest('#shareCapOld'))) { var cc = D.deuda.cifras_clave.filter(function (x) { return /habitante/i.test(x.etiqueta); })[0]; share('A cada persona en España le tocan ' + cc.valor + ' € de deuda pública. Así funciona la trampa:', siteUrl() + '/deuda/', '<div class="scard"><p class="scard-k" style="font:700 15px var(--f-body)">Te tocan</p><p class="scard-q" style="font-size:56px;line-height:1">' + esc(cc.valor) + ' €</p><p>de deuda pública por habitante. ' + esc(cc.fuente || '') + '</p><div class="scard-foot"><span>La trampa de la deuda, explicada</span><b>Antes de Votar</b></div></div>'); return; }
    if ((t = e.target.closest('#shareDebt'))) { share(debtShareText(), siteUrl() + '/deuda/', debtCard(), { live: liveShareTicker, image: drawDebtImage }); return; }
    if ((t = e.target.closest('#nativeShare'))) { try { navigator.share({ title: 'Antes de Votar', text: shareCtx.text, url: shareCtx.url }).catch(function () {}); } catch (err) {} return; }
    if ((t = e.target.closest('#imgShare'))) {
      var cv = shareCtx.image(); cv.toBlob(function (blob) {
        var file = new File([blob], 'deuda-espana.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: shareCtx.text + ' ' + shareCtx.url }).catch(function () {}); }
        else { var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'deuda-espana.png'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); toast('Imagen descargada'); }
      }, 'image/png'); return;
    }
    if ((t = e.target.closest('[data-copy]'))) { copy(t.getAttribute('data-copy')); return; }
    if ((t = e.target.closest('#backBtn'))) { back(); return; }
    if ((t = e.target.closest('#scrim'))) { closeSheet(); return; }
    if ((t = e.target.closest('#trapNext'))) { var n = trapSteps().length; trap.i = trap.i >= n - 1 ? 0 : trap.i + 1; drawTrap(); return; }
    if ((t = e.target.closest('#trapPrev'))) { trap.i = Math.max(0, trap.i - 1); drawTrap(); return; }
    if ((t = e.target.closest('[data-info]'))) { var inf = INFO[t.getAttribute('data-info')]; if (inf) openSheet('<h3 class="sheet-title">' + esc(inf[0]) + '</h3><p class="tema-res" style="margin:0">' + esc(inf[1]) + '</p>'); return; }
    if ((t = e.target.closest('[data-preset]'))) {
      var sp = (D.deuda.mecanica && D.deuda.mecanica.parametros_simulador) || {};
      var base = { sR: SIM.r, sG: SIM.g, sS: 0, sT: 0 };
      var pr = t.getAttribute('data-preset');
      var v = { hoy: base, tipos: Object.assign({}, base, { sR: 5.0 }), crisis: Object.assign({}, base, { sG: 2.0 }) }[pr];
      Object.keys(v).forEach(function (k) { $('#' + k).value = v[k]; });
      $$('[data-preset]').forEach(function (b) { b.classList.toggle('on', b === t); });
      simulate(); return;
    }
  });
  document.addEventListener('keydown', function (e) {
    var s = $('#sheet'); if (s.hidden) return;
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key === 'Tab') {
      var f = $$('a[href], button:not([disabled]), input, select, summary', s); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function closeSheetIfOpen() { if (!$('#sheet').hidden) closeSheet(); }
  function shareText() {
    var rt = parse(current);
    if (rt.view === 'partido') { var p = P(rt.id); return 'Todas las propuestas de ' + p.siglas + ' para el 29N, con sus críticas y fuentes:'; }
    if (rt.view === 'tema') return 'Qué propone cada partido sobre ' + areaName(rt.id).toLowerCase() + ' para el 29N:';
    if (rt.view === 'deuda') return 'La trampa de la deuda pública, explicada para todos:';
    if (rt.view === 'importa') return 'Lo que de verdad importa en estas elecciones, con datos:';
    if (rt.view === 'test') return '¿Con qué partido coincides más? Test con las propuestas reales de cada uno, con fuente:';
    return 'Antes de votar el 29N, lee lo que proponen todos los partidos. Sin interpretar y con fuentes:';
  }
  function propCard(p, x) {
    return '<div class="scard" style="--pc:' + esc(p.color) + '"><div class="scard-top">' + avatar(p) + '<span>' + esc(p.nombre) + '</span></div><p class="scard-q">' + esc(x.texto) + '</p><div class="scard-foot"><span>' + esc(areaName(x.area)) + '</span><b>' + esc((D.meta && D.meta.nombre) || 'Antes de Votar') + '</b></div>' + stamp() + '</div>';
  }
  function cmpCard(ps) {
    var n = function (p) { return p.propuestas.filter(function (x) { return x.area === cmp.area; }).length; };
    return '<div class="scard vs"><p class="scard-k">' + esc(areaName(cmp.area)) + '</p><div class="scard-vs n' + ps.length + '">' + ps.map(function (p) { return '<div style="--pc:' + esc(p.color) + '">' + avatar(p, 'lg') + '<b>' + n(p) + '</b><span>propuestas</span></div>'; }).join('<i>vs</i>') + '</div><div class="scard-foot"><span>Compáralas antes del 29N</span><b>' + esc((D.meta && D.meta.nombre) || 'Antes de Votar') + '</b></div>' + stamp() + '</div>';
  }

  // Swipe-down to close sheet (mobile)
  (function () {
    var sy = null, sheet = null;
    document.addEventListener('touchstart', function (e) { sheet = e.target.closest('.sheet'); if (sheet && ($('#sheetBody').scrollTop <= 0)) sy = e.touches[0].clientY; else sy = null; }, { passive: true });
    document.addEventListener('touchmove', function (e) { if (sy == null) return; var dy = e.touches[0].clientY - sy; if (dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    document.addEventListener('touchend', function (e) { if (sy == null) return; var dy = e.changedTouches[0].clientY - sy; sheet.style.transform = ''; if (dy > 90) closeSheet(); sy = null; });
  })();

  // ---------- Boot ----------
  var VEDA_INI = Date.parse('2026-11-24T00:00:00+01:00'), VEDA_FIN = Date.parse('2026-11-29T21:00:00+01:00');
  function enVeda() { return !!(D && D.veda) || (Date.now() >= VEDA_INI && Date.now() < VEDA_FIN); }
  function boot(data) {
    D = data;
    if (enVeda()) { D.veda = true; D.partidos.forEach(function (p) { p.encuesta = null; }); D.encuestas = { actualizado: null, metodo: '', fuentes: [] }; }
    D.partidos.forEach(function (p, i) { p._o = i; });
    D.partidos.sort(function (a, b) { var ta = a.tier === 'otros' ? 1 : 0, tb = b.tier === 'otros' ? 1 : 0; if (ta !== tb) return ta - tb; if (ta) return a._o - b._o; if (D.veda) return ((b.escanos_2023 || 0) - (a.escanos_2023 || 0)) || a.nombre.localeCompare(b.nombre, 'es'); return ((b.encuesta && b.encuesta.voto) || 0) - ((a.encuesta && a.encuesta.voto) || 0); });
    current = routeFromLocation();
    try { history.replaceState({ r: current }, '', MODE === 'site' ? location.pathname : (location.hash ? location.hash : location.pathname + location.search)); } catch (e) {}
    var rt = parse(current);
    if (rt.depth > 0) stack = [rt.tabId || 'inicio'];
    render(rt, 'fade');
    document.documentElement.classList.add('ready');
  }
  if (window.__DATA__) boot(window.__DATA__);
  else fetch(window.__DATA_URL__).then(function (r) { return r.json(); }).then(boot).catch(function () { $('#view').innerHTML = '<div class="empty"><p>No se han podido cargar los datos. Comprueba tu conexión y recarga la página.</p></div>'; });
})();
