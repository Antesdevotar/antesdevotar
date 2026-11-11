// Build: data/*.json -> dist/artifact.html (single file) + dist/site/ (prerendered static site for Render)
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const rj = (p) => { try { return JSON.parse(rd(p)); } catch (e) { console.warn('WARN no se pudo leer', p, e.message); return null; } };
const SITE_URL = process.env.SITE_URL || (rj('data/meta.json') || {}).site_url;

// ---------- Data assembly ----------
const encuestas = rj('data/encuestas.json');
const meta = rj('data/meta.json') || {};
const order = encuestas.partidos.map((p) => p.id);
const m1 = rj('data/mentiras_grupo1.json') || {};
const m2 = rj('data/mentiras_grupo2.json') || {};
const mentiras = { ...m1, ...m2 };
const derecho = rj('data/criticas_derecho.json') || { partidos: {} };
const identidad = rj('data/identidad.json') || {};
const AREAS = [
  ['vivienda', 'Vivienda'], ['empleo', 'Empleo y salarios'], ['economia', 'Economía y fiscalidad'], ['pensiones', 'Pensiones'],
  ['sanidad', 'Sanidad'], ['educacion', 'Educación'], ['deuda', 'Deuda y cuentas públicas'], ['demografia', 'Familia y demografía'],
  ['energia', 'Energía y clima'], ['inmigracion', 'Inmigración'], ['instituciones', 'Justicia, instituciones y corrupción'],
  ['territorio', 'Modelo territorial'], ['igualdad', 'Igualdad y derechos sociales'], ['seguridad', 'Seguridad y defensa'],
  ['exterior', 'Europa, soberanía y exterior'], ['rural', 'Campo y mundo rural'], ['tecnologia', 'Ciencia, tecnología e innovación'], ['cultura', 'Cultura, lengua e identidad'],
];
// Nombre corto para títulos y anclas: siglas si son conocidas; si no, el nombre sin coletillas.
const SIGLAS_CONOCIDAS = { 'FE DE LAS JONS': 'Falange', PP: 'PP', PSOE: 'PSOE', VOX: 'Vox', ERC: 'ERC', 'EAJ-PNV': 'PNV', PNV: 'PNV', BNG: 'BNG', SALF: 'SALF', PACMA: 'PACMA', PCTE: 'PCTE', 'EH BILDU': 'EH Bildu', JUNTS: 'Junts', UPN: 'UPN', CC: 'CC', PODEMOS: 'Podemos' };
function nombreCorto(p) {
  if (p.nombre_corto) return p.nombre_corto;
  const s = String(p.siglas || '').trim();
  if (SIGLAS_CONOCIDAS[s.toUpperCase()]) return SIGLAS_CONOCIDAS[s.toUpperCase()];
  const n = String(p.nombre || s).split(/\s+[–—-]\s+|:\s|\s\/\s|\s\(/)[0].trim();
  return n || s || p.id;
}
// Nombre para el H1: nombre completo y, si no lo contiene, el corto entre paréntesis.
// Si el nombre completo lleva entre paréntesis la lista de partidos (coaliciones), el H1 usa el corto.
const nombreLista = (p) => /\([^)]*,[^)]*\)/.test(p.nombre || '');
const nombreH1 = (p) => (nombreLista(p) && p.corto ? p.corto : p.corto && !p.nombre.includes(p.corto) ? `${p.nombre} (${p.corto})` : p.nombre);
// Artículo: «del PP», «del PSOE», pero «de Vox», «de Junts». Lista explícita + nombres comunes (Partido…, Frente…, Bloque…).
const CON_ARTICULO = ['PP', 'PSOE', 'PNV', 'BNG', 'PACMA', 'PCTE'];
const llevaArticulo = (n) => CON_ARTICULO.includes(n) || /^(Partido|Frente|Bloque)\b/.test(n || '');
const deNombre = (n) => (llevaArticulo(n) ? 'del ' : 'de ') + n;
const aNombre = (n) => (llevaArticulo(n) ? 'al ' : 'a ') + n;
const delNombre = (p) => deNombre(p.corto);
const alNombre = (p) => aNombre(p.corto);
const SEO_P = rj('data/seo_partidos.json') || {};
const M_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fdate = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${+m[3]} de ${M_ES[+m[2] - 1]} de ${m[1]}` : String(s || ''); };
const parties = [];
const extraIds = fs.readdirSync(path.join(ROOT, 'data/parties')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
  .filter((id) => !order.includes(id))
  .map((id) => ({ id, p: rj(`data/parties/${id}.json`) }))
  .filter((x) => x.p && x.p.concurre !== false)
  .sort((a, b) => ((b.p.referencia_voto && b.p.referencia_voto.porcentaje) || 0) - ((a.p.referencia_voto && a.p.referencia_voto.porcentaje) || 0) || a.p.nombre.localeCompare(b.p.nombre, 'es'))
  .map((x) => x.id);
for (const id of [...order, ...extraIds]) {
  const p = rj(`data/parties/${id}.json`);
  if (!p || p.concurre === false) continue;
  p.tier = order.includes(id) ? 'principal' : 'otros';
  p.corto = nombreCorto(p);
  p.art = llevaArticulo(p.corto) ? 1 : 0;
  p.h1n = nombreH1(p);
  p.h1art = llevaArticulo(p.h1n) ? 1 : 0;
  p.seo = SEO_P[id] ? { resumen: SEO_P[id].resumen || '', faq: (SEO_P[id].faq || []).filter((x) => x && x.q && x.a) } : null;
  if (identidad[id]) { p.autodefinicion = identidad[id].autodefinicion || null; p.ches = identidad[id].ches || null; }
  delete p.ideologia;
  const poll = encuestas.partidos.find((x) => x.id === id);
  p.encuesta = poll;
  p.propuestas = (p.propuestas || []).filter((x) => x && x.texto);
  p.criticas = p.criticas || { economica: [], social: [], cultural: [] };
  const dz = (derecho.partidos && derecho.partidos[id]) || p.derecho;
  p.criticas.derecho = (dz && dz.criticas) || [];
  p.valoracion_derecho = (dz && dz.valoracion) || null;
  p.avales_derecho = (dz && dz.avales) || [];
  p.mentiras = [];
  parties.push(p);
}
const LANZADA = process.env.LANZAMIENTO === '1';
const VEDA = process.env.FORCE_VEDA === '1' || meta.forzar_veda === true || (Date.now() >= Date.parse('2026-11-24T00:00:00+01:00') && Date.now() < Date.parse('2026-11-29T21:00:00+01:00'));
if (VEDA) {
  parties.forEach((p) => { p.encuesta = null; });
  parties.sort((a, b) => (a.tier === 'otros') - (b.tier === 'otros') || (b.escanos_2023 || 0) - (a.escanos_2023 || 0));
}
// Candidatos (data/candidatos_*.json): el primero de cada partido es el principal (p.cand); todos van a DATA.candidatos.
// Nunca se publican los campos internos ni el valor de los inmuebles.
const OCULTOS = new Set(['notas_internas', 'nota', 'notas', 'anos_base', 'inmuebles_valor']);
const limpiar = (v) => {
  if (Array.isArray(v)) return v.map(limpiar);
  if (!v || typeof v !== 'object') return v;
  const o = {};
  for (const [k, x] of Object.entries(v)) if (!OCULTOS.has(k) && !k.startsWith('_') && !/interna/i.test(k)) o[k] = limpiar(x);
  return o;
};
const slugify = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const candidatos = [];
{
  const seen = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter((f) => /^candidatos_.*\.json$/.test(f)).sort()) {
    for (const raw of JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))) {
      const p = parties.find((x) => x.id === raw.party);
      if (!p || !raw.nombre) continue;
      const c = limpiar(raw);
      let slug = slugify(c.nombre);
      if (seen.has(slug)) slug += '-' + p.id;
      seen.add(slug);
      c.slug = slug;
      candidatos.push(c);
      (p.cands = p.cands || []).push(c);
      if (!p.cand) p.cand = c;
    }
  }
}
// Partidos que no concurren: página breve e indexable, fuera de los listados.
const noConcurren = fs.readdirSync(path.join(ROOT, 'data/parties')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
  .map((id) => ({ id, p: rj(`data/parties/${id}.json`) })).filter((x) => x.p && x.p.concurre === false)
  .map(({ id, p }) => ({ id, nombre: p.nombre, siglas: p.siglas, corto: nombreCorto(p), color: p.color, web: p.web || null, resumen: (SEO_P[id] && SEO_P[id].resumen) || p.resumen || '', candidatura_nota: p.candidatura_nota || null, estado_fuente: p.estado_fuente && p.estado_fuente.nombre ? p.estado_fuente : null, actualizado: [p.actualizado, p.estado_fuente && p.estado_fuente.fecha].filter(Boolean).sort().pop() || null }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
const DATA = {
  veda: VEDA,
  generado: new Date().toISOString().slice(0, 10),
  eleccion: { fecha: '2026-11-29T09:00:00+01:00', nombre: 'Elecciones generales 29N' },
  encuestas: VEDA ? { actualizado: null, metodo: '', fuentes: [] } : { actualizado: encuestas.actualizado, metodo: encuestas.metodo, fuentes: encuestas.fuentes },
  areas: AREAS.map(([id, nombre]) => ({ id, nombre })),
  partidos: parties,
  candidatos,
  no_concurren: noConcurren,
  deuda: rj('data/deuda.json'),
  importa: rj('data/importa.json'),
  test: rj('data/test.json'),
  preguntas_votante: rj('data/preguntas_votante.json'),
  criterios_derecho: derecho.criterios || null,
  meta: { ...meta, site_url: SITE_URL },
};


// p.cand / p.cands no se serializan (la app los reconstruye desde DATA.candidatos).
const dataJSON = () => JSON.stringify(DATA, function (k, v) { return (k === 'cand' || k === 'cands') && this && this.propuestas ? undefined : v; });

// ---------- Templates ----------
const css = rd('src/app.css');
const js = rd('src/app.js');
const shell = rd('src/shell.html');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NAME = meta.nombre || 'Antes de Votar';

// Metodología: docs/METODOLOGIA.md convertido a HTML (prerender de /metodologia/ y bloque desplegable en la app).
function mdToHtml(md) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const out = [];
  const stack = [];
  const closeTo = (d) => { while (stack.length > d) { out.push('</li></ul>'); stack.pop(); } };
  for (const raw of md.split('\n')) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(\s*)- (.*)$/);
    if (m) {
      const d = Math.floor(m[1].length / 2) + 1;
      if (stack.length < d) { out.push('<ul><li>'); stack.push(1); } else { closeTo(d); out.push('</li><li>'); }
      out.push(inline(m[2]));
      continue;
    }
    if (/^\s+\S/.test(raw) && stack.length) { closeTo(1); out.push(`<p>${inline(raw.trim())}</p>`); continue; }
    closeTo(0);
    if (raw.startsWith('## ')) out.push(`<h2>${inline(raw.slice(3))}</h2>`);
    else if (!raw.startsWith('# ')) out.push(`<p>${inline(raw)}</p>`);
  }
  closeTo(0);
  return out.join('');
}
{
  let md = '';
  try { md = rd('docs/METODOLOGIA.md'); } catch (e) { console.warn('WARN sin docs/METODOLOGIA.md'); }
  md = md.replace(/en los ficheros de `data\/`/g, 'en el fichero público de datos (data.json)')
    .replace(/\s*\(ver \[[^\]]*\]\([^)]*\)\)/g, '')
    .replace(/en este repositorio/g, 'en el repositorio del proyecto');
  DATA.metodologia_html = md ? mdToHtml(md) : '';
}

// Títulos (≤ 60 con marca si cabe) y descripciones (≤ 155, cortadas por palabra).
const clip = (s, n = 155) => {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  let c = s.slice(0, n - 1);
  const i = c.lastIndexOf(' ');
  if (i > n * 0.6) c = c.slice(0, i);
  return c.replace(/[\s,;:.·—–-]+$/, '') + '…';
};
const BRAND = ` | ${NAME}`;
const ttl = (...cands) => {
  if ((cands[0] + BRAND).length <= 60) return cands[0] + BRAND;
  for (const c of cands) if (c.length <= 60) return c;
  return cands.reduce((x, y) => (x.length <= y.length ? x : y));
};
const lcFirst = (t) => (/^(Europa|España)\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

// En modo sitio, CSS y JS van a ficheros con hash (caché inmutable); el artifact sigue siendo un único HTML.
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 10);
const ASSET_CSS = `assets/app.${hash(css)}.css`;
const ASSET_JS = `assets/app.${hash(js)}.js`;

const FONTS_SITE = '<link rel="preload" href="/fonts/bricolage-grotesque-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-display:swap;font-weight:200 800;font-stretch:75% 100%;src:url(/fonts/bricolage-grotesque-latin-opsz-normal.woff2) format("woff2-variations")}@font-face{font-family:"Instrument Sans";font-style:normal;font-display:swap;font-weight:400 700;src:url(/fonts/instrument-sans-latin-wght-normal.woff2) format("woff2-variations")}</style>';
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Instrument+Sans:wght@400..700&display=swap">';

function page({ title, description, canonical, route, seoBody, mode, jsonld, og, ogAlt, noindex }) {
  const site = mode !== 'artifact';
  const dataTag = site
    ? `<script>window.__DATA_URL__='/data.json';</script>`
    : `<script>window.__DATA__=${dataJSON().replace(/</g, '\\u003c')};</script>`;
  const ogImg = og || (route === 'deuda' && fs.existsSync(path.join(ROOT, 'src/og-deuda.png')) ? 'og-deuda.png' : 'og.png');
  const robots = noindex ? `<meta name="robots" content="${LANZADA ? 'noindex' : 'noindex,nofollow'}">` : (LANZADA ? '' : '<meta name="robots" content="noindex,nofollow">');
  const head = !site
    ? `<title>${esc(NAME)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">`
    : `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}${robots}<meta name="theme-color" content="${meta.theme_color || '#14213d'}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(NAME)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">${canonical ? `<meta property="og:url" content="${canonical}">` : ''}<meta property="og:image" content="${SITE_URL}/${ogImg}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(ogAlt || title)}">
<meta property="og:locale" content="es_ES"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${SITE_URL}/${ogImg}"><meta name="twitter:image:alt" content="${esc(ogAlt || title)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/logo.png"><link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/${ASSET_CSS}"><link rel="preload" href="/data.json" as="fetch" crossorigin>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}`;
  let body = shell
    .replace('{{FONTS}}', () => (site ? FONTS_SITE : FONTS))
    .replace('{{BRANDMARK}}', () => `<span class="brandword">${esc(NAME)}</span>`)
    .replace('{{CSS}}', () => (site ? '' : `<style>${css}</style>`))
    .replace('{{SEO}}', '')
    .replace('<p class="loading">Cargando…</p>', () => (!site || !seoBody ? '<p class="loading">Cargando…</p>' : `<div class="pre">${seoBody}</div>`))
    .replace('{{ROUTE}}', () => `<script>window.__ROUTE__=${JSON.stringify(route)};</script>`)
    .replace('{{DATA}}', () => dataTag)
    .replace('{{JS}}', () => (site ? `<script src="/${ASSET_JS}"></script>` : `<script>${js}</script>`));
  if (site) body = body.replace('class="brand" href="#inicio"', 'class="brand" href="/"');
  return site ? `${head}</head><body>${body}</body></html>` : `${head}\n${body}`;
}

DATA.quienes_html = quienesHtml(); // función declarada más abajo (hoisting)

// ---------- Artifact ----------
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/artifact.html'), page({ mode: 'artifact', route: '' }));

// ---------- Static site ----------
const SITE = path.join(ROOT, 'dist/site');
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(path.join(SITE, 'assets'), { recursive: true });
fs.writeFileSync(path.join(SITE, ASSET_CSS), css);
fs.writeFileSync(path.join(SITE, ASSET_JS), js);
fs.writeFileSync(path.join(SITE, 'data.json'), dataJSON());
const urls = [];
function emit(rel, opts) {
  const dir = path.join(SITE, rel);
  fs.mkdirSync(dir, { recursive: true });
  const canonical = SITE_URL + '/' + (rel ? rel + '/' : '');
  fs.writeFileSync(path.join(dir, 'index.html'), page({ ...opts, canonical, mode: 'site' }));
  urls.push({ loc: canonical, lastmod: opts.lastmod || DATA.generado });
}
const YEAR = '2026';
const ORG_ID = SITE_URL + '/#org';
const WEB_ID = SITE_URL + '/#website';
const orgNode = { '@type': 'Organization', '@id': ORG_ID, name: NAME, url: SITE_URL + '/', logo: { '@type': 'ImageObject', '@id': SITE_URL + '/#logo', url: SITE_URL + '/logo.png', contentUrl: SITE_URL + '/logo.png', width: 512, height: 512, caption: NAME }, publishingPrinciples: SITE_URL + '/metodologia/', correctionsPolicy: SITE_URL + '/metodologia/#contacto', subjectOf: { '@id': SITE_URL + '/quienes-somos/#webpage' } };
const siteNode = { '@type': 'WebSite', '@id': WEB_ID, name: 'Antes de Votar', alternateName: ['antesdevotar.org', 'Antes de Votar .org'], url: SITE_URL + '/', inLanguage: 'es-ES', description: 'Herramienta independiente y no partidista para comparar los programas de los partidos en las elecciones generales de 2026.', publisher: { '@id': ORG_ID } };
const crumbs = (items, id) => ({ '@type': 'BreadcrumbList', '@id': id, itemListElement: [{ name: 'Inicio', url: SITE_URL + '/' }, ...items].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })) });
const webpage = (name, url, extra = {}) => {
  const { crumbs: cr, graph = [], type = 'WebPage', dateModified = DATA.generado, ...rest } = extra;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': type, '@id': url + '#webpage', name, url, inLanguage: 'es-ES', dateModified, isPartOf: { '@id': WEB_ID }, publisher: { '@id': ORG_ID }, ...(cr ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}), ...rest },
      ...(cr ? [crumbs(cr, url + '#breadcrumb')] : []),
      ...graph,
      siteNode,
      orgNode,
    ],
  };
};
const partyItemList = (id) => ({ '@type': 'ItemList', '@id': id, name: `Partidos que se presentan a las elecciones generales de ${YEAR}`, numberOfItems: parties.length, itemListElement: parties.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/partido/${p.id}/`, name: p.nombre })) });
const maxDate = (ds) => ds.filter(Boolean).sort().pop() || DATA.generado;
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const ogFor = (name) => (fs.existsSync(path.join(ROOT, 'src/og', name)) ? 'og/' + name : null);
// Ficha de candidato (mismo texto que candCard() de la app).
const srcA = (url, text) => (url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>` : '');
const eurB = (n) => (n == null ? null : Math.round(n).toLocaleString('es-ES') + ' €');
const capB = (t) => { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); };
function inmTxtB(pt) {
  const d = pt.inmuebles_detalle || [];
  const n = pt.inmuebles_n != null ? pt.inmuebles_n : d.length;
  if (!n) return pt.inmuebles_n === 0 ? 'Ninguno declarado' : null;
  if (!d.length) return n + (n === 1 ? ' inmueble' : ' inmuebles');
  const g = {}; d.forEach((x) => { const t = (x.tipo || 'inmueble').toLowerCase(); (g[t] = g[t] || []).push(x.ubicacion); });
  const parts = Object.keys(g).map((t) => { const u = [...new Set(g[t].filter(Boolean))]; const k = g[t].length; const pl = k > 1 ? (/[aeiou]$/.test(t) ? t + 's' : t + 'es') : t; return k + ' ' + pl + (u.length === 1 ? ' en ' + u[0] : u.length ? ' (' + u.join(', ') + ')' : ''); });
  return n + (n === 1 ? ' inmueble: ' : ' inmuebles: ') + parts.join(', ');
}
function candPatB(c) {
  const pt = c.patrimonio || {};
  if (pt.estado === 'solo_intereses') return `<p class="cand-none">Escaño en el Parlamento Europeo: la Eurocámara publica sus intereses económicos, pero no su patrimonio.${pt.url ? ' ' + srcA(pt.url, 'Ver declaración') : ''}</p>`;
  if (pt.estado === 'sin_obligacion') return '<p class="cand-none">Sin obligación de publicar declaración de bienes: no ocupa un cargo que lo exija.</p>';
  if (pt.estado === 'no_localizada' || !pt.declarado) return '<p class="cand-none">No hemos localizado declaración pública.</p>';
  const rows = [];
  const it = inmTxtB(pt); if (it) rows.push(['Inmuebles', it]);
  if (pt.depositos != null) rows.push(['Dinero en cuentas', eurB(pt.depositos)]);
  if (pt.otros_bienes != null) rows.push(['Inversiones y otros bienes', eurB(pt.otros_bienes)]);
  if (pt.deudas != null) rows.push(['Deudas', eurB(pt.deudas)]);
  const soloNeto = pt.neto != null && pt.depositos == null && pt.otros_bienes == null && pt.deudas == null;
  const neto = soloNeto ? `<p class="cand-neto">Saldo declarado (cuentas, valores y otros bienes menos deudas; sin inmuebles ni vehículos): <b>${esc(eurB(pt.neto))}</b></p>` : '';
  return (rows.length ? `<dl class="cand-dl">${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>` : '') + neto + (!rows.length && !neto ? '<p class="cand-none">La declaración publicada no detalla importes.</p>' : '') +
    `<p class="fine">${esc([pt.organo, pt.fecha_declaracion ? 'declaración de ' + fdate(pt.fecha_declaracion) : ''].filter(Boolean).join(', '))}${pt.url ? ' ' + srcA(pt.url, 'Ver declaración') : ''}</p>`;
}
function candHtml(p, c) {
  const tr = (c.trayectoria || []).slice(0, 5);
  const sf = c.sentencias_firmes || [], pa = c.procedimientos_abiertos || [];
  const yrs = c.anos_en_politica == null ? null : c.anos_en_politica === 0 ? 'Sin cargos públicos' : c.anos_en_politica + (c.anos_en_politica === 1 ? ' año' : ' años') + ' en cargos públicos';
  const who = (x) => (x.persona && !/propio/.test(x.persona) ? `<b>${esc(capB(x.persona))}:</b> ` : '');
  return `<article class="cand full" style="--pc:${esc(p.color)}"><header class="cand-h"><div><h2>${esc(c.nombre)}</h2><p>${esc([c.rol, p.siglas].filter(Boolean).join(' · '))}</p></div></header>` +
    (c.cargo_actual ? `<p class="cand-now">${esc(c.cargo_actual)}</p>` : '') +
    `<h3>Formación</h3><p>${esc(c.formacion || 'Sin datos acreditados')}</p>` +
    `<h3>Trayectoria</h3>${yrs || c.experiencia_fuera ? `<p>${esc([yrs, c.experiencia_fuera ? 'Fuera de la política: ' + c.experiencia_fuera : ''].filter(Boolean).join('. '))}</p>` : ''}` +
    (tr.length ? `<ul class="cand-tr">${tr.map((t) => `<li><span>${esc(t.cargo)}</span><small>${esc([t.desde, t.hasta || (t.desde ? 'hoy' : '')].filter(Boolean).join('–'))}</small></li>`).join('')}</ul>` : (yrs || c.experiencia_fuera ? '' : '<p>Sin datos verificados</p>')) +
    `<h3>Patrimonio declarado</h3>${candPatB(c)}` +
    `<h3>Sentencias firmes</h3>${sf.length ? `<ul class="cand-j">${sf.map((x) => `<li>${who(x)}${esc(x.resumen)}${x.fecha ? ` <small>(${esc(fdate(x.fecha))})</small>` : ''}${x.url ? ' ' + srcA(x.url, 'Fuente') : ''}</li>`).join('')}</ul>` : '<p>Ninguna conocida</p>'}` +
    (pa.length ? `<h3>Procedimientos judiciales en curso</h3><ul class="cand-j">${pa.map((x) => `<li>${who(x)}${esc(x.resumen)}${x.organo_judicial ? ` (${esc(x.organo_judicial)})` : ''}. <b>Fase: ${esc(x.fase || 'en curso')}.</b> Sin sentencia.${x.fecha_ultima_actuacion ? ` <small>${esc(fdate(x.fecha_ultima_actuacion))}</small>` : ''}${x.url ? ' ' + srcA(x.url, 'Fuente') : ''}</li>`).join('')}</ul>` : '') +
    '</article>';
}
// Partido que no concurre: H1, resumen, candidatura con fecha y fuente, y salidas neutrales (sin elegir afines a mano:
// no hay un campo público y fiable de familia ideológica).
function noConcurreHtml(q) {
  const ef = q.estado_fuente;
  return `<h1>${esc(q.nombre)} no se presenta a las elecciones del 29N</h1>${upd(q.actualizado)}` +
    (q.resumen ? `<p class="phead-lead">${esc(q.resumen)}</p>` : '') +
    (q.candidatura_nota ? `<p><strong>Candidatura:</strong> ${esc(q.candidatura_nota)}</p>` : '') +
    (ef ? `<p class="fine">Fuente: ${ef.url ? srcA(ef.url, ef.nombre) : esc(ef.nombre)}${ef.fecha ? ` (${esc(fdate(ef.fecha))})` : ''}</p>` : '') +
    `<h2>Otras opciones</h2><ul><li>${a('/partidos/', `Los ${parties.length} partidos que se presentan el 29N`)}</li><li>${a('/test/', 'Test: ¿con qué partido coincides?')}</li></ul>`;
}
function quienesHtml() {
  // PENDIENTE: cuando exista un formulario o correo de correcciones, ponerlo en data/meta.json como form_url.
  const corr = meta.form_url
    ? `<p>Si ves un error o quieres pedir una rectificación, <a href="${esc(meta.form_url)}" target="_blank" rel="noopener">avísanos</a>. Los errores comprobados se corrigen y las correcciones relevantes se registran en la <a href="/metodologia/" data-nav="metodologia">metodología</a>.</p>`
    : `<p>Los errores comprobados se corrigen lo antes posible y las correcciones relevantes se registran en la <a href="/metodologia/" data-nav="metodologia">metodología</a>, donde también está la vía de contacto.</p>`;
  return `<h1>Quiénes somos</h1>` +
    `<p>${esc(NAME)} es un proyecto ciudadano, independiente y anónimo. No está afiliado a ningún partido, candidatura, administración ni medio de comunicación.</p>` +
    `<h2>Cómo se financia</h2><p>No tiene publicidad, no recibe financiación externa y no tiene ánimo de lucro.</p>` +
    `<h2>Cómo elaboramos los datos</h2><p>Resumimos las propuestas de cada partido sin interpretarlas y aplicamos los mismos criterios a todos. Los criterios están en la <a href="/metodologia/" data-nav="metodologia">metodología</a>.</p>` +
    `<h2>Fuentes</h2><p>Trabajamos con fuentes primarias: programas y documentos de los partidos, el BOE, declaraciones oficiales de bienes y datos de organismos públicos. Cuando un dato procede de prensa o de un verificador, se cita como tal. Wikipedia no se usa como fuente.</p>` +
    `<h2>Correcciones</h2>${corr}` +
    `<p class="fine">Sin relación con otras webs de nombre parecido.</p>`;
}
const pctTxt = (p) => (VEDA ? `${p.escanos_2023 ?? 0} escaños en 2023` : p.encuesta ? `${p.encuesta.voto}% en la media de encuestas` : '');
const upd = (d) => `<p class="upd">Actualizado el ${esc(fdate(d || DATA.generado))}</p>`;
const navLinks = () => `<nav><h2>Partidos</h2><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, `Programa electoral ${delNombre(p)}`)}</li>`).join('')}</ul><h2>Temas</h2><ul>${AREAS.map(([id, n]) => `<li>${a(`/tema/${id}/`, `${n}: qué propone cada partido`)}</li>`).join('')}</ul><p>${a('/test/', 'Test: ¿con qué partido coincides?')} · ${a('/candidatos/', 'Candidatos')} · ${a('/deuda/', 'La deuda pública explicada')} · ${a('/datos/', 'Datos clave')} · ${a('/metodologia/', 'Metodología')} · ${a('/quienes-somos/', 'Quiénes somos')}</p></nav>`;
const DIMS = [['economica', 'Críticas económicas'], ['social', 'Críticas sociales'], ['cultural', 'Críticas culturales'], ['derecho', 'Estado de derecho y derechos fundamentales']];
const main = parties.filter((p) => p.tier === 'principal').map((p) => p.corto);
const IM_TEMAS = ((DATA.importa && DATA.importa.temas) || []);
const datosTitle = (t) => (t.titulo.includes(':') ? `${t.titulo} · datos clave ${YEAR}` : `${t.titulo} en España: datos clave ${YEAR}`);
const datosHref = (t) => (t.enlace ? `/${t.enlace}/` : `/datos/${t.id}/`);

emit('', {
  route: 'inicio',
  title: ttl(`Elecciones generales ${YEAR}: los programas`, `Elecciones generales ${YEAR}: qué propone cada partido`),
  description: clip(`Qué propone cada partido en las elecciones generales del 29N: ${main.slice(0, 5).join(', ')} y el resto, con críticas, fuentes y un test de afinidad.`),
  jsonld: webpage(`Elecciones generales ${YEAR}: qué propone cada partido`, SITE_URL + '/', { mainEntity: { '@id': SITE_URL + '/#partidos' }, graph: [partyItemList(SITE_URL + '/#partidos')] }),
  seoBody: `<h1>Elecciones generales ${YEAR}: qué propone cada partido</h1>${upd(DATA.generado)}<p>Las elecciones generales son el 29 de noviembre de ${YEAR}. Aquí tienes las propuestas de los ${parties.length} partidos que se presentan, resumidas sin interpretar y con su fuente, las críticas que reciben, un test para ver con quién coincides y los datos que más afectan a tu vida.</p><h2>Partidos que se presentan</h2><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, nombreH1(p))}${pctTxt(p) ? ' — ' + esc(pctTxt(p)) : ''}</li>`).join('')}</ul>${navLinks()}`,
});
for (const p of parties) {
  const url = `${SITE_URL}/partido/${p.id}/`;
  const byArea = AREAS.map(([ar, n]) => {
    const items = p.propuestas.filter((x) => x.area === ar);
    return items.length ? `<h3>${esc(n)}</h3>${list(items.map((i) => i.texto))}` : '';
  }).join('');
  const crit = DIMS.map(([k, n]) => { const c = (p.criticas[k] || []); return c.length ? `<h3>${esc(n)}</h3><ul>${c.map((x) => `<li><strong>${esc(x.titulo)}</strong>. ${esc(x.texto || '')}</li>`).join('')}</ul>` : ''; }).join('');
  const areasP = AREAS.filter(([ar]) => p.propuestas.some((x) => x.area === ar));
  const temas = areasP.map(([, n]) => lcFirst(n));
  const h1 = `Programa electoral ${deNombre(p.h1n)} ${YEAR}`;
  const faq = (p.seo && p.seo.faq) || [];
  const faqHtml = faq.length ? `<section class="faq"><h2>Preguntas frecuentes sobre ${esc(p.corto)}</h2>${faq.map((x) => `<h3>${esc(x.q)}</h3><p>${esc(x.a)}</p>`).join('')}</section>` : '';
  const faqNode = faq.length ? [{ '@type': 'FAQPage', '@id': url + '#faq', name: `Preguntas frecuentes sobre ${p.corto}`, url, inLanguage: 'es-ES', isPartOf: { '@id': WEB_ID }, mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }] : [];
  const candLinks = (p.cands || []).map((c) => a(`/candidato/${c.slug}/`, c.nombre)).join(', ');
  emit(`partido/${p.id}`, {
    route: `partido-${p.id}`,
    og: ogFor(`partido-${p.id}.png`),
    ogAlt: `Programa electoral ${delNombre(p)} para las elecciones generales de ${YEAR}`,
    lastmod: p.actualizado || DATA.generado,
    title: ttl(`Programa electoral ${delNombre(p)} 29N ${YEAR}`, `Programa ${delNombre(p)} para el 29N`, `Programa ${delNombre(p)} 29N ${YEAR}`, `${p.corto}: programa 29N`),
    description: clip(`Las ${p.propuestas.length} propuestas ${delNombre(p)} para el 29N, con fuente, y las críticas que recibe: ${temas.slice(0, 4).join(', ')}…`),
    jsonld: webpage(h1, url, { dateModified: p.actualizado || DATA.generado, about: { '@type': 'PoliticalParty', '@id': url + '#party', name: p.nombre, alternateName: [...new Set([p.siglas, p.corto].filter((x) => x && x !== p.nombre))], url: p.web || undefined }, crumbs: [{ name: 'Partidos', url: SITE_URL + '/partidos/' }, { name: p.corto, url }], graph: faqNode }),
    seoBody: `<h1>${esc(h1)}</h1>${p.h1n !== p.nombre && nombreLista(p) ? `<p class="sub">${esc(p.nombre)}</p>` : ''}${upd(p.actualizado)}${p.seo && p.seo.resumen ? `<p class="phead-lead">${esc(p.seo.resumen)}</p>` : ''}${candLinks ? `<p>${(p.cands || []).length > 1 ? 'Candidatos' : 'Candidato'}: ${candLinks}.</p>` : p.candidato ? `<p>Candidato: ${esc(p.candidato)}.</p>` : ''}<p>${esc(p.resumen || '')}</p><h2>Propuestas ${esc(delNombre(p))}</h2>${byArea}${faqHtml}${crit ? `<h2>Críticas ${esc(alNombre(p))}</h2>${crit}` : ''}<h2>Qué proponen otros partidos</h2><ul>${areasP.map(([ar, n]) => `<li>${a(`/tema/${ar}/`, `Propuestas sobre ${lcFirst(n)}`)}</li>`).join('')}<li>${a('/candidatos/', 'Candidatos de todos los partidos')}</li></ul>${navLinks()}`,
  });
}
for (const [ar, n] of AREAS) {
  const url = `${SITE_URL}/tema/${ar}/`;
  const ps = parties.filter((p) => p.propuestas.some((x) => x.area === ar));
  const rel = IM_TEMAS.filter((t) => t.area === ar);
  const h1 = `${n}: qué propone cada partido`;
  emit(`tema/${ar}`, {
    route: `tema-${ar}`,
    lastmod: maxDate(ps.map((p) => p.actualizado)),
    title: ttl(`${n}: qué propone cada partido (29N)`, `${n}: propuestas de cada partido`, `${n}: qué proponen (29N)`, `${n}: propuestas 29N`),
    description: clip(`Propuestas sobre ${lcFirst(n)} de ${ps.slice(0, 5).map((p) => p.corto).join(', ')}${ps.length > 5 ? ` y ${ps.length - 5} partidos más` : ''} para las elecciones generales del 29N, lado a lado y con fuente.`),
    jsonld: webpage(h1, url, { dateModified: maxDate(ps.map((p) => p.actualizado)), crumbs: [{ name: 'Comparar', url: SITE_URL + '/comparar/' }, { name: n, url }] }),
    seoBody: `<h1>${esc(h1)}</h1>${upd(maxDate(ps.map((p) => p.actualizado)))}<p>Propuestas de ${ps.length} partidos sobre ${esc(lcFirst(n))}, resumidas sin interpretar.</p>${rel.length ? `<p>${rel.map((t) => a(datosHref(t), `Datos clave: ${t.titulo}`)).join(' · ')}</p>` : ''}${ps.map((p) => { const it = p.propuestas.filter((x) => x.area === ar); return `<h2>${a(`/partido/${p.id}/`, nombreH1(p))}</h2>${list(it.map((i) => i.texto))}<p>${a(`/partido/${p.id}/`, `Programa ${delNombre(p)}`)}</p>`; }).join('')}${navLinks()}`,
  });
}
const deudaH1 = (d) => { const t = d.titular_corto || d.titular || 'La deuda pública'; return /España/.test(t) ? t : `${t} de España`; };
{
  const d = DATA.deuda || {};
  const url = SITE_URL + '/deuda/';
  emit('deuda', {
    route: 'deuda',
    title: ttl('Deuda pública de España: cuánto debemos', `Deuda pública de España ${YEAR}`),
    description: clip('España debe 1,74 billones de euros, casi el 100% del PIB, y paga más de 40.000 millones al año en intereses. Contador en directo, simulador y propuestas.'),
    jsonld: webpage(deudaH1(d), url, { crumbs: [{ name: 'Deuda pública', url }] }),
    seoBody: `<h1>${esc(deudaH1(d))}</h1><p>${esc(d.entradilla_corta || d.entradilla || '')}</p>${(d.cifras_clave || []).length ? `<h2>Cifras clave</h2><ul>${d.cifras_clave.map((c) => `<li><strong>${esc(c.etiqueta)}:</strong> ${esc(c.valor)} ${esc(c.unidad || '')}</li>`).join('')}</ul>` : ''}${(d.te_afecta || []).length ? `<h2>En qué te afecta</h2><ul>${d.te_afecta.map((x) => `<li><strong>${esc(x.valor)} — ${esc(x.titulo)}.</strong> ${esc(x.texto)}</li>`).join('')}</ul>` : ''}${(d.mecanica && d.mecanica.pasos_cortos || []).length ? `<h2>Cómo evoluciona la deuda</h2><ol>${d.mecanica.pasos_cortos.map((x) => `<li><strong>${esc(x.titulo)}.</strong> ${esc(x.texto)}</li>`).join('')}</ol>` : ''}<p>${a('/tema/deuda/', 'Propuestas sobre deuda y cuentas públicas de cada partido')}</p>${navLinks()}`,
  });
}
{
  const im = DATA.importa || { temas: [] };
  emit('datos', {
    route: 'importa',
    title: ttl(`Datos clave de España ${YEAR}`, `Datos clave de España ${YEAR}: vivienda, salarios, sanidad`),
    description: clip('Los problemas que más afectan a la calidad de vida en España, con datos oficiales: vivienda, salarios, empleo, listas de espera, pensiones, educación, justicia y más.'),
    jsonld: webpage('Datos clave para los españoles', SITE_URL + '/datos/', { crumbs: [{ name: 'Datos clave', url: SITE_URL + '/datos/' }] }),
    seoBody: `<h1>Datos clave para los españoles</h1>${upd(DATA.generado)}<p>${esc(im.entradilla || '')}</p><ul>${im.temas.map((t) => `<li>${a(datosHref(t), t.titulo)}${t.dato_clave ? `: <strong>${esc(t.dato_clave.valor)}</strong> ${esc(t.dato_clave.etiqueta)}` : ''}</li>`).join('')}</ul>${navLinks()}`,
  });
  for (const t of im.temas.filter((x) => !x.enlace)) {
    const url = `${SITE_URL}/datos/${t.id}/`;
    const h1 = datosTitle(t);
    const ps = t.area ? parties.filter((p) => p.propuestas.some((x) => x.area === t.area)) : [];
    const an = t.area ? (AREAS.find((z) => z[0] === t.area) || [])[1] : null;
    emit(`datos/${t.id}`, {
      route: `importa-${t.id}`,
      title: ttl(h1, `${t.titulo}: datos clave ${YEAR}`, `${t.titulo}: datos ${YEAR}`),
      description: clip(`${t.titulo}${t.titulo.includes(':') ? '. ' : ' en España: '}${t.dato_clave ? `${t.dato_clave.valor} ${t.dato_clave.etiqueta}. ` : ''}${t.resumen || ''}`),
      jsonld: webpage(h1, url, { crumbs: [{ name: 'Datos clave', url: SITE_URL + '/datos/' }, { name: t.titulo, url }] }),
      seoBody: `<h1>${esc(h1)}</h1>${upd(DATA.generado)}${t.dato_clave ? `<p><strong>${esc(t.dato_clave.valor)}</strong> ${esc(t.dato_clave.etiqueta)} (${esc(t.dato_clave.fuente || '')}).</p>` : ''}<p>${esc(t.resumen || '')}</p>${(t.datos || []).length ? `<h2>Datos</h2><ul>${t.datos.map((x) => `<li><strong>${esc(x.valor)}</strong> ${esc(x.etiqueta)} (${esc(x.fuente || '')})</li>`).join('')}</ul>` : ''}${(t.causas || []).length ? `<h2>Causas que señalan los expertos</h2><ul>${t.causas.map((x) => `<li><strong>${esc(x.titulo)}.</strong> ${esc(x.texto || '')}</li>`).join('')}</ul>` : ''}${t.y_quien_lo_paga ? `<h2>¿Y quién lo paga?</h2><p>${esc(t.y_quien_lo_paga)}</p>` : ''}${(t.preguntas || []).length ? `<h2>Preguntas para hacer a los partidos</h2>${list(t.preguntas)}` : ''}${an ? `<h2>Propuestas de los partidos sobre ${esc(lcFirst(an))}</h2><p>${a(`/tema/${t.area}/`, `Propuestas sobre ${lcFirst(an)}: qué propone cada partido`)}</p><ul>${ps.map((p) => `<li>${a(`/partido/${p.id}/`, `Programa ${delNombre(p)}`)}</li>`).join('')}</ul>` : ''}${navLinks()}`,
    });
  }
}
if (DATA.test) {
  const T = DATA.test, n = T.afirmaciones.length;
  const h1 = `Test electoral ${YEAR}: ¿Con qué partido coincides?`;
  emit('test', {
    route: 'test',
    og: ogFor('test.png'),
    title: ttl(h1, `Test electoral ${YEAR}: ¿a quién votar?`),
    description: clip(`¿Dudas a quién votar el 29N? Responde a ${n} afirmaciones y compáralas con lo que cada partido ha votado, hecho o propuesto. Gratis, anónimo y con fuentes.`),
    jsonld: webpage(h1, SITE_URL + '/test/', { crumbs: [{ name: 'Test', url: SITE_URL + '/test/' }] }),
    seoBody: `<h1>${esc(h1)}</h1><p>${esc(T.intro || '')} ${esc(T.aviso || '')}</p><h2>Las ${n} afirmaciones del test</h2><ol>${T.afirmaciones.map((x) => `<li>${esc(x.texto)}</li>`).join('')}</ol><h2>Cómo se calcula</h2><p>${esc(T.metodo || '')}</p>${navLinks()}`,
  });
}
{
  const cs = parties.filter((p) => p.cand && p.concurre !== false);
  const all = cs.flatMap((p) => p.cands.map((c) => ({ p, c })));
  const url = SITE_URL + '/candidatos/';
  const h1 = `Candidatos a las elecciones generales ${YEAR}`;
  const people = { '@type': 'ItemList', '@id': url + '#lista', name: h1, numberOfItems: all.length, itemListElement: all.map(({ p, c }, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/candidato/${c.slug}/`, item: { '@type': 'Person', '@id': `${SITE_URL}/candidato/${c.slug}/#person`, name: c.nombre, url: `${SITE_URL}/candidato/${c.slug}/`, jobTitle: c.rol || c.cargo_actual || undefined, affiliation: { '@type': 'PoliticalParty', '@id': `${SITE_URL}/partido/${p.id}/#party`, name: p.nombre, url: `${SITE_URL}/partido/${p.id}/` } } })) };
  emit('candidatos', {
    route: 'candidatos',
    lastmod: maxDate(cs.map((p) => p.actualizado)),
    title: ttl(h1, `Candidatos elecciones generales ${YEAR}`),
    description: clip(`Quién encabeza cada candidatura el 29N: formación, trayectoria, patrimonio declarado y causas judiciales de ${cs.slice(0, 3).map((p) => p.cand.nombre).join(', ')} y el resto.`),
    jsonld: webpage(h1, url, { type: 'CollectionPage', mainEntity: { '@id': url + '#lista' }, graph: [people], crumbs: [{ name: 'Candidatos', url }] }),
    seoBody: `<h1>${esc(h1)}</h1>${upd(maxDate(cs.map((p) => p.actualizado)))}<ul>${all.map(({ p, c }) => `<li>${a(`/candidato/${c.slug}/`, c.nombre)} (${a(`/partido/${p.id}/`, `programa ${delNombre(p)}`)})${c.formacion ? ' — ' + esc(c.formacion) : ''}</li>`).join('')}</ul>${navLinks()}`,
  });
  for (const { p, c } of all) {
    const curl = `${SITE_URL}/candidato/${c.slug}/`;
    const ch1 = `${c.nombre}: formación, trayectoria y patrimonio`;
    emit(`candidato/${c.slug}`, {
      route: `candidato-${c.slug}`,
      og: ogFor(`partido-${p.id}.png`),
      ogAlt: `${c.nombre}, ${c.rol || 'candidato'} de ${p.corto}`,
      lastmod: p.actualizado || DATA.generado,
      title: ttl(`${c.nombre}: quién es, patrimonio y trayectoria`, `${c.nombre}: quién es y patrimonio`, `${c.nombre}: quién es`, c.nombre),
      description: clip(`${c.nombre}${c.rol ? `, ${lcFirst(c.rol)} ${delNombre(p)}` : ` (${p.corto})`} el 29N: formación, trayectoria, patrimonio declarado y causas judiciales, con fuentes oficiales.`),
      jsonld: webpage(ch1, curl, { type: 'ProfilePage', dateModified: p.actualizado || DATA.generado, mainEntity: { '@id': curl + '#person' }, crumbs: [{ name: 'Candidatos', url: SITE_URL + '/candidatos/' }, { name: c.nombre, url: curl }], graph: [{ '@type': 'Person', '@id': curl + '#person', name: c.nombre, url: curl, jobTitle: c.rol || c.cargo_actual || undefined, affiliation: { '@type': 'PoliticalParty', '@id': `${SITE_URL}/partido/${p.id}/#party`, name: p.nombre, url: `${SITE_URL}/partido/${p.id}/` } }] }),
      seoBody: `<h1>${esc(ch1)}</h1>${upd(p.actualizado)}${candHtml(p, c)}<p>${a(`/partido/${p.id}/`, `Programa electoral ${delNombre(p)}`)} · ${a('/candidatos/', 'Todos los candidatos')}</p>${navLinks()}`,
    });
  }
}
{
  const url = SITE_URL + '/partidos/';
  const h1 = `Partidos que se presentan a las elecciones generales ${YEAR}`;
  emit('partidos', {
    route: 'partidos',
    lastmod: maxDate(parties.map((p) => p.actualizado)),
    title: ttl(`Partidos de las elecciones generales ${YEAR}`, `Partidos elecciones generales ${YEAR}`),
    description: clip(`Los ${parties.length} partidos y coaliciones de las elecciones generales del 29 de noviembre de ${YEAR}, con su programa, sus propuestas y las críticas que reciben.`),
    jsonld: webpage(h1, url, { type: 'CollectionPage', mainEntity: { '@id': url + '#lista' }, graph: [partyItemList(url + '#lista')], crumbs: [{ name: 'Partidos', url }] }),
    seoBody: `<h1>${esc(h1)}</h1><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, nombreH1(p))}${p.candidato ? ' — candidato: ' + esc(p.candidato) : ''}</li>`).join('')}</ul>${navLinks()}`,
  });
}
{
  const url = SITE_URL + '/comparar/';
  const h1 = 'Comparar partidos tema a tema';
  emit('comparar', {
    route: 'comparar',
    title: ttl(`Comparar programas electorales ${YEAR}`, `Comparar programas electorales ${YEAR} tema a tema`),
    description: clip('Compara las propuestas de dos o tres partidos en vivienda, empleo, pensiones, sanidad, inmigración y cualquier otro tema, con fuentes.'),
    jsonld: webpage(h1, url, { crumbs: [{ name: 'Comparar', url }] }),
    seoBody: `<h1>${esc(h1)}</h1><p>El comparador pone frente a frente las propuestas de dos o tres partidos sobre un mismo tema, en columnas y con la fuente de cada propuesta. También puedes ver de una vez lo que proponen todos los partidos sobre cada tema. Las propuestas están resumidas sin interpretar; en caso de duda, prevalece el documento original del partido.</p><h2>Qué propone cada partido, tema a tema</h2><ul>${AREAS.map(([id, n]) => { const k = parties.filter((p) => p.propuestas.some((x) => x.area === id)).length; return `<li>${a(`/tema/${id}/`, `${n}: qué propone cada partido`)} (propuestas de ${k} partidos)</li>`; }).join('')}</ul>${navLinks()}`,
  });
}
for (const q of noConcurren) {
  const url = `${SITE_URL}/partido/${q.id}/`;
  const h1 = `${q.nombre} no se presenta a las elecciones del 29N`;
  emit(`partido/${q.id}`, {
    route: `partido-${q.id}`,
    lastmod: q.actualizado || DATA.generado,
    title: ttl(`${q.corto} no se presenta a las elecciones del 29N`, `${q.corto} no se presenta al 29N`, `${q.corto}: no concurre al 29N`),
    description: clip(`${q.nombre} no concurre a las elecciones generales del 29 de noviembre de ${YEAR}. ${q.resumen}`),
    jsonld: webpage(h1, url, { dateModified: q.actualizado || DATA.generado, about: { '@type': 'PoliticalParty', '@id': url + '#party', name: q.nombre, alternateName: [...new Set([q.siglas, q.corto].filter((x) => x && x !== q.nombre))], url: q.web || undefined }, crumbs: [{ name: 'Partidos', url: SITE_URL + '/partidos/' }, { name: q.corto, url }] }),
    seoBody: noConcurreHtml(q, true) + navLinks(),
  });
}
emit('quienes-somos', {
  route: 'quienes-somos',
  title: ttl('Quiénes somos', 'Quiénes somos y cómo trabajamos'),
  description: clip(`${NAME} es un proyecto ciudadano independiente, sin afiliación a ningún partido, sin publicidad y sin ánimo de lucro. Cómo elaboramos los datos y corregimos errores.`),
  jsonld: webpage('Quiénes somos', SITE_URL + '/quienes-somos/', { type: 'AboutPage', about: { '@id': ORG_ID }, mainEntity: { '@id': ORG_ID }, crumbs: [{ name: 'Quiénes somos', url: SITE_URL + '/quienes-somos/' }] }),
  seoBody: quienesHtml() + navLinks(),
});
emit('metodologia', {
  route: 'metodologia',
  title: ttl('Metodología y fuentes', 'Metodología, fuentes y aviso'),
  description: clip('Cómo resumimos los programas, cómo seleccionamos las críticas, de dónde salen los datos, cómo funciona el test y cómo corregimos errores.'),
  jsonld: webpage('Metodología y fuentes', SITE_URL + '/metodologia/', { crumbs: [{ name: 'Metodología', url: SITE_URL + '/metodologia/' }] }),
  seoBody: `<h1>Metodología y fuentes</h1>${DATA.metodologia_html || '<p>Neutralidad de método: los mismos criterios, públicos y explícitos, para todos los partidos. Cada dato enlaza a su fuente.</p>'}${navLinks()}`,
});

fs.writeFileSync(path.join(SITE, '404.html'), page({ mode: 'site', route: 'notfound', canonical: null, noindex: true, title: `Página no encontrada | ${NAME}`, description: 'Esta página no existe.', jsonld: null, seoBody: `<h1>Página no encontrada</h1><p>${a('/', 'Volver al inicio')}</p>${navLinks()}` }));
fs.writeFileSync(path.join(SITE, 'llms.txt'), `# ${NAME}\n\n> Herramienta independiente y no partidista para las elecciones generales de España del 29 de noviembre de ${YEAR}: propuestas de cada partido resumidas sin interpretar y con fuente, críticas con fuente, un test de afinidad basado en lo que cada partido ha votado, la deuda pública explicada y datos clave.\n\n## Partidos\n${parties.map((p) => `- [Programa electoral de ${nombreH1(p)}](${SITE_URL}/partido/${p.id}/)`).join('\n')}\n\n## Candidatos\n${candidatos.map((c) => `- [${c.nombre}: quién es, patrimonio y trayectoria](${SITE_URL}/candidato/${c.slug}/)`).join('\n')}\n\n## Temas\n${AREAS.map(([id, n]) => `- [${n}: qué propone cada partido](${SITE_URL}/tema/${id}/)`).join('\n')}\n\n## Datos clave\n${IM_TEMAS.filter((t) => !t.enlace).map((t) => `- [${datosTitle(t)}](${SITE_URL}/datos/${t.id}/)`).join('\n')}\n\n## Otras secciones\n- [Test: ¿con qué partido coincides?](${SITE_URL}/test/)\n- [Candidatos](${SITE_URL}/candidatos/)\n- [Deuda pública de España](${SITE_URL}/deuda/)\n- [Datos clave](${SITE_URL}/datos/)\n- [Metodología](${SITE_URL}/metodologia/)\n- [Quiénes somos](${SITE_URL}/quienes-somos/)\n- [Datos en JSON](${SITE_URL}/data.json)\n`);
fs.writeFileSync(path.join(SITE, '_redirects'), `/importa /datos/ 301\n/importa/ /datos/ 301\n/importa-* /datos/:splat 301\n`);
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(SITE, 'robots.txt'), LANZADA ? `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(SITE, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${LANZADA ? '' : '  X-Robots-Tag: noindex, nofollow\n'}\n/data.json\n  Cache-Control: public, max-age=300\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({ name: NAME, short_name: NAME, start_url: '/', display: 'standalone', lang: 'es', background_color: meta.bg || '#ffffff', theme_color: meta.theme_color || '#14213d', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }, ...(fs.existsSync(path.join(ROOT, 'src/logo.png')) ? [{ src: '/logo.png', sizes: '512x512', type: 'image/png' }] : [])] }));
for (const f of ['icon.svg', 'logo.png', 'og.png', 'og-deuda.png']) if (fs.existsSync(path.join(ROOT, 'src', f))) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(SITE, f));
fs.mkdirSync(path.join(SITE, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'src/fonts'))) fs.copyFileSync(path.join(ROOT, 'src/fonts', f), path.join(SITE, 'fonts', f));
if (fs.existsSync(path.join(ROOT, 'src/og'))) { fs.mkdirSync(path.join(SITE, 'og'), { recursive: true }); for (const f of fs.readdirSync(path.join(ROOT, 'src/og'))) fs.copyFileSync(path.join(ROOT, 'src/og', f), path.join(SITE, 'og', f)); }

const stats = parties.map((p) => `${p.siglas}: ${p.propuestas.length} prop · ${Object.values(p.criticas).flat().length} crít · ${p.mentiras.length} ment`).join('\n');
console.log(`OK · ${parties.length} partidos · ${urls.length} páginas\n${stats}\nartifact: ${(fs.statSync(path.join(ROOT, 'dist/artifact.html')).size / 1024).toFixed(0)} KB`);
