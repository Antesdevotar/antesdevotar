// Build: data/*.json -> dist/artifact.html (single file) + dist/site/ (prerendered static site for Render)
import fs from 'node:fs';
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
const VEDA = process.env.FORCE_VEDA === '1' || (Date.now() >= Date.parse('2026-11-24T00:00:00+01:00') && Date.now() < Date.parse('2026-11-29T21:00:00+01:00'));
if (VEDA) {
  parties.forEach((p) => { p.encuesta = null; });
  parties.sort((a, b) => (a.tier === 'otros') - (b.tier === 'otros') || (b.escanos_2023 || 0) - (a.escanos_2023 || 0));
}
const DATA = {
  veda: VEDA,
  generado: new Date().toISOString().slice(0, 10),
  eleccion: { fecha: '2026-11-29T09:00:00+01:00', nombre: 'Elecciones generales 29N' },
  encuestas: VEDA ? { actualizado: null, metodo: '', fuentes: [] } : { actualizado: encuestas.actualizado, metodo: encuestas.metodo, fuentes: encuestas.fuentes },
  areas: AREAS.map(([id, nombre]) => ({ id, nombre })),
  partidos: parties,
  deuda: rj('data/deuda.json'),
  importa: rj('data/importa.json'),
  test: rj('data/test.json'),
  preguntas_votante: rj('data/preguntas_votante.json'),
  criterios_derecho: derecho.criterios || null,
  meta: { ...meta, site_url: SITE_URL },
};

// ---------- Templates ----------
const css = rd('src/app.css');
const js = rd('src/app.js');
const shell = rd('src/shell.html');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NAME = meta.nombre || 'Antes de Votar';
const FONTS_SITE = '<link rel="preload" href="/fonts/bricolage-grotesque-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-display:swap;font-weight:200 800;font-stretch:75% 100%;src:url(/fonts/bricolage-grotesque-latin-opsz-normal.woff2) format("woff2-variations")}@font-face{font-family:"Instrument Sans";font-style:normal;font-display:swap;font-weight:400 700;src:url(/fonts/instrument-sans-latin-wght-normal.woff2) format("woff2-variations")}</style>';
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Instrument+Sans:wght@400..700&display=swap">';

function page({ title, description, canonical, route, seoBody, mode, jsonld }) {
  const dataTag = mode === 'artifact'
    ? `<script>window.__DATA__=${JSON.stringify(DATA).replace(/</g, '\\u003c')};</script>`
    : `<script>window.__DATA_URL__='/data.json';</script>`;
  const head = mode === 'artifact'
    ? `<title>${esc(NAME)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">`
    : `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">${LANZADA ? '' : '<meta name="robots" content="noindex,nofollow">'}<meta name="theme-color" content="${meta.theme_color || '#14213d'}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(NAME)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${SITE_URL}/${route === 'deuda' && fs.existsSync(path.join(ROOT, 'src/og-deuda.png')) ? 'og-deuda.png' : 'og.png'}">
<meta property="og:locale" content="es_ES"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;
  const body = shell
    .replace('{{FONTS}}', () => (mode === 'artifact' ? FONTS : FONTS_SITE))
    .replace('{{BRANDMARK}}', () => `<span class="brandword">${esc(NAME)}</span>`)
    .replace('{{CSS}}', () => `<style>${css}</style>`)
    .replace('{{SEO}}', () => `<noscript><div class="seo">${seoBody}</div></noscript><div class="seo-hidden" aria-hidden="true">${mode === 'artifact' ? '' : seoBody}</div>`)
    .replace('{{ROUTE}}', () => `<script>window.__ROUTE__=${JSON.stringify(route)};</script>`)
    .replace('{{DATA}}', () => dataTag)
    .replace('{{JS}}', () => `<script>${js}</script>`);
  return mode === 'artifact' ? `${head}\n${body}` : `${head}</head><body>${body}</body></html>`;
}

// ---------- Artifact ----------
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/artifact.html'), page({ mode: 'artifact', route: '' }));

// ---------- Static site ----------
const SITE = path.join(ROOT, 'dist/site');
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'data.json'), JSON.stringify(DATA));
const urls = [];
function emit(rel, opts) {
  const dir = path.join(SITE, rel);
  fs.mkdirSync(dir, { recursive: true });
  const canonical = SITE_URL + '/' + (rel ? rel + '/' : '');
  fs.writeFileSync(path.join(dir, 'index.html'), page({ ...opts, canonical, mode: 'site' }));
  urls.push(canonical);
}
const orgLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE_URL, inLanguage: 'es-ES' };
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

emit('', {
  route: 'inicio',
  title: `${NAME} · Programas y críticas de los partidos para el 29N`,
  description: 'Compara las propuestas de todos los partidos de las elecciones generales del 29 de noviembre de 2026: programas resumidos sin interpretar y sus críticas, con fuentes.',
  jsonld: orgLd,
  seoBody: `<h1>Elecciones generales 29N 2026: todos los partidos</h1>${list(parties.map((p) => `${p.nombre} (${p.siglas}) — ${VEDA ? (p.escanos_2023 ?? 0) + ' escaños en 2023' : (p.encuesta?.voto ?? '') + '% en la media de encuestas'}`))}`,
});
for (const p of parties) {
  const byArea = AREAS.map(([a, n]) => {
    const items = p.propuestas.filter((x) => x.area === a);
    return items.length ? `<h3>${esc(n)}</h3>${list(items.map((i) => i.texto))}` : '';
  }).join('');
  emit(`partido/${p.id}`, {
    route: `partido-${p.id}`,
    title: `Programa electoral de ${p.siglas} para el 29N: propuestas y críticas | ${NAME}`,
    description: `Todas las propuestas de ${p.nombre} resumidas y sin interpretar, ordenadas por temas (vivienda, empleo, pensiones, sanidad…), sus críticas económicas, sociales y culturales `,
    jsonld: { '@context': 'https://schema.org', '@type': 'PoliticalParty', name: p.nombre, alternateName: p.siglas, url: p.web },
    seoBody: `<h1>Programa electoral de ${esc(p.nombre)} (${esc(p.siglas)})</h1><p>${esc(p.resumen)}</p>${byArea}`,
  });
}
for (const [a, n] of AREAS) {
  emit(`tema/${a}`, {
    route: `tema-${a}`,
    title: `${n}: qué propone cada partido el 29N | ${NAME}`,
    description: `Compara qué proponen PP, PSOE, Vox, Sumar y el resto de partidos sobre ${n.toLowerCase()} en las elecciones generales del 29 de noviembre de 2026.`,
    jsonld: orgLd,
    seoBody: `<h1>${esc(n)}: propuestas de los partidos</h1>${parties.map((p) => { const it = p.propuestas.filter((x) => x.area === a); return it.length ? `<h2>${esc(p.siglas)}</h2>${list(it.map((i) => i.texto))}` : ''; }).join('')}`,
  });
}
emit('deuda', {
  route: 'deuda',
  title: `La deuda pública de España explicada | ${NAME}`,
  description: 'Cuánto debe España, cuánto pagamos en intereses, qué haría falta para reducir la deuda y qué propone cada partido. Con simulador.',
  jsonld: orgLd,
  seoBody: `<h1>${esc(DATA.deuda?.titular_corto || 'La deuda pública')}</h1><p>${esc(DATA.deuda?.entradilla_corta || DATA.deuda?.entradilla || '')}</p>`,
});
emit('importa', {
  route: 'importa',
  title: `Lo que de verdad importa en las elecciones del 29N | ${NAME}`,
  description: 'Vivienda, salarios, pensiones, sanidad, deuda: los datos que marcan tu calidad de vida frente al ruido político.',
  jsonld: orgLd,
  seoBody: `<h1>${esc(DATA.importa?.titular || 'Lo que importa')}</h1><p>${esc(DATA.importa?.manifiesto || '')}</p>`,
});
if (DATA.test) emit('test', { route: 'test', title: `¿Con qué partido coincides? Test electoral 29N | ${NAME}`, description: 'Responde a 27 afirmaciones y descubre en qué coincides con cada partido, según lo que ha votado, hecho o propuesto, con fuente.', jsonld: orgLd, seoBody: '<h1>¿Con qué partido coincides?</h1>' });
emit('partidos', { route: 'partidos', title: `Todos los partidos del 29N | ${NAME}`, description: 'Los partidos que se presentan a las elecciones generales del 29 de noviembre de 2026, ordenados por intención de voto.', jsonld: orgLd, seoBody: `<h1>Partidos</h1>${list(parties.map((p) => p.nombre))}` });
emit('comparar', { route: 'comparar', title: `Comparar partidos tema a tema | ${NAME}`, description: 'Compara las propuestas de dos partidos en vivienda, empleo, pensiones y cualquier otro tema.', jsonld: orgLd, seoBody: '<h1>Comparar partidos</h1>' });
emit('metodologia', { route: 'metodologia', title: `Metodología y fuentes | ${NAME}`, description: 'Cómo resumimos los programas y cómo seleccionamos las críticas.', jsonld: orgLd, seoBody: '<h1>Metodología</h1>' });

fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc><lastmod>${DATA.generado}</lastmod><changefreq>daily</changefreq></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(SITE, 'robots.txt'), LANZADA ? `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(SITE, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${LANZADA ? '' : '  X-Robots-Tag: noindex, nofollow\n'}\n/data.json\n  Cache-Control: public, max-age=300\n\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({ name: NAME, short_name: NAME, start_url: '/', display: 'standalone', lang: 'es', background_color: meta.bg || '#ffffff', theme_color: meta.theme_color || '#14213d', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] }));
if (fs.existsSync(path.join(ROOT, 'src/icon.svg'))) fs.copyFileSync(path.join(ROOT, 'src/icon.svg'), path.join(SITE, 'icon.svg'));
fs.mkdirSync(path.join(SITE, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'src/fonts'))) fs.copyFileSync(path.join(ROOT, 'src/fonts', f), path.join(SITE, 'fonts', f));
if (fs.existsSync(path.join(ROOT, 'src/og-deuda.png'))) fs.copyFileSync(path.join(ROOT, 'src/og-deuda.png'), path.join(SITE, 'og-deuda.png'));
if (fs.existsSync(path.join(ROOT, 'src/og.png'))) fs.copyFileSync(path.join(ROOT, 'src/og.png'), path.join(SITE, 'og.png'));

const stats = parties.map((p) => `${p.siglas}: ${p.propuestas.length} prop · ${Object.values(p.criticas).flat().length} crít · ${p.mentiras.length} ment`).join('\n');
console.log(`OK · ${parties.length} partidos · ${urls.length} páginas\n${stats}\nartifact: ${(fs.statSync(path.join(ROOT, 'dist/artifact.html')).size / 1024).toFixed(0)} KB`);
