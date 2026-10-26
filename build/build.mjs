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

function page({ title, description, canonical, route, seoBody, mode, jsonld, og }) {
  const dataTag = mode === 'artifact'
    ? `<script>window.__DATA__=${JSON.stringify(DATA).replace(/</g, '\\u003c')};</script>`
    : `<script>window.__DATA_URL__='/data.json';</script>`;
  const head = mode === 'artifact'
    ? `<title>${esc(NAME)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">`
    : `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">${LANZADA ? '' : '<meta name="robots" content="noindex,nofollow">'}<meta name="theme-color" content="${meta.theme_color || '#14213d'}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(NAME)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${SITE_URL}/${og || (route === 'deuda' && fs.existsSync(path.join(ROOT, 'src/og-deuda.png')) ? 'og-deuda.png' : 'og.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="es_ES"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`;
  const body = shell
    .replace('{{FONTS}}', () => (mode === 'artifact' ? FONTS : FONTS_SITE))
    .replace('{{BRANDMARK}}', () => `<span class="brandword">${esc(NAME)}</span>`)
    .replace('{{CSS}}', () => `<style>${css}</style>`)
    .replace('{{SEO}}', '')
    .replace('<p class="loading">Cargando…</p>', () => (mode === 'artifact' || !seoBody ? '<p class="loading">Cargando…</p>' : `<div class="pre">${seoBody}</div>`))
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
const YEAR = '2026';
const orgLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE_URL + '/', inLanguage: 'es-ES', description: 'Herramienta independiente y no partidista para comparar los programas de los partidos en las elecciones generales de 2026.' };
const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Inicio', url: SITE_URL + '/' }, ...items].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })) });
const webpage = (name, url, extra = {}) => ({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name, url, inLanguage: 'es-ES', dateModified: DATA.generado, isPartOf: { '@type': 'WebSite', name: NAME, url: SITE_URL + '/' }, ...extra }, ...(extra.crumbs ? [crumbs(extra.crumbs)] : [])] });
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const ogFor = (name) => (fs.existsSync(path.join(ROOT, 'src/og', name)) ? 'og/' + name : null);
const pctTxt = (p) => (VEDA ? `${p.escanos_2023 ?? 0} escaños en 2023` : p.encuesta ? `${p.encuesta.voto}% en la media de encuestas` : '');
const navLinks = () => `<nav><h2>Partidos</h2><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, `Programa de ${p.siglas}`)}</li>`).join('')}</ul><h2>Temas</h2><ul>${AREAS.map(([id, n]) => `<li>${a(`/tema/${id}/`, `${n}: qué propone cada partido`)}</li>`).join('')}</ul><p>${a('/test/', 'Test: ¿con qué partido coincides?')} · ${a('/deuda/', 'La deuda pública explicada')} · ${a('/datos/', 'Datos clave')} · ${a('/metodologia/', 'Metodología')}</p></nav>`;
const DIMS = [['economica', 'Críticas económicas'], ['social', 'Críticas sociales'], ['cultural', 'Críticas culturales'], ['derecho', 'Estado de derecho y derechos fundamentales']];
const main = parties.filter((p) => p.tier === 'principal').map((p) => p.siglas);

emit('', {
  route: 'inicio',
  title: `Elecciones generales ${YEAR}: compara los programas de todos los partidos | ${NAME}`,
  description: `Qué propone cada partido en las elecciones generales del 29 de noviembre de ${YEAR}: ${main.slice(0, 5).join(', ')} y el resto, con críticas, fuentes y un test para ver con quién coincides.`,
  jsonld: { '@context': 'https://schema.org', '@graph': [{ ...orgLd, '@context': undefined }, { '@type': 'Organization', name: NAME, url: SITE_URL + '/', logo: SITE_URL + '/icon.svg' }] },
  seoBody: `<h1>Elecciones generales ${YEAR}: qué propone cada partido</h1><p>Las elecciones generales son el 29 de noviembre de ${YEAR}. Aquí tienes las propuestas de los ${parties.length} partidos que se presentan, resumidas sin interpretar y con su fuente, las críticas que reciben, un test para ver con quién coincides y los datos que más afectan a tu vida.</p><h2>Partidos que se presentan</h2><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, `${p.nombre} (${p.siglas})`)}${pctTxt(p) ? ' — ' + esc(pctTxt(p)) : ''}</li>`).join('')}</ul>${navLinks()}`,
});
for (const p of parties) {
  const url = `${SITE_URL}/partido/${p.id}/`;
  const byArea = AREAS.map(([ar, n]) => {
    const items = p.propuestas.filter((x) => x.area === ar);
    return items.length ? `<h3>${esc(n)}</h3>${list(items.map((i) => i.texto))}` : '';
  }).join('');
  const crit = DIMS.map(([k, n]) => { const c = (p.criticas[k] || []); return c.length ? `<h3>${esc(n)}</h3><ul>${c.map((x) => `<li><strong>${esc(x.titulo)}</strong>. ${esc(x.texto || '')}</li>`).join('')}</ul>` : ''; }).join('');
  const temas = [...new Set(p.propuestas.map((x) => x.area))].map((ar) => (AREAS.find((z) => z[0] === ar) || [])[1]).filter(Boolean);
  emit(`partido/${p.id}`, {
    route: `partido-${p.id}`,
    og: ogFor(`partido-${p.id}.png`),
    title: `Programa electoral de ${p.siglas} ${YEAR}: propuestas y críticas | ${NAME}`,
    description: `Las ${p.propuestas.length} propuestas de ${p.nombre} para las elecciones generales de ${YEAR}, resumidas y con fuente: ${temas.slice(0, 4).join(', ').toLowerCase()}… Y las críticas que recibe.`,
    jsonld: webpage(`Programa electoral de ${p.nombre} ${YEAR}`, url, { about: { '@type': 'PoliticalParty', name: p.nombre, alternateName: p.siglas, url: p.web || undefined }, crumbs: [{ name: 'Partidos', url: SITE_URL + '/partidos/' }, { name: p.siglas, url }] }),
    seoBody: `<h1>Programa electoral de ${esc(p.nombre)} (${esc(p.siglas)}) para las elecciones generales de ${YEAR}</h1>${p.candidato ? `<p>Candidato: ${esc(p.candidato)}.</p>` : ''}<p>${esc(p.resumen || '')}</p><h2>Propuestas de ${esc(p.siglas)}</h2>${byArea}${crit ? `<h2>Críticas a ${esc(p.siglas)}</h2>${crit}` : ''}${navLinks()}`,
  });
}
for (const [ar, n] of AREAS) {
  const url = `${SITE_URL}/tema/${ar}/`;
  const ps = parties.filter((p) => p.propuestas.some((x) => x.area === ar));
  emit(`tema/${ar}`, {
    route: `tema-${ar}`,
    title: `${n}: qué propone cada partido en las elecciones de ${YEAR} | ${NAME}`,
    description: `Propuestas de ${ps.slice(0, 5).map((p) => p.siglas).join(', ')} y ${Math.max(0, ps.length - 5)} partidos más sobre ${n.toLowerCase()} para las elecciones generales del 29 de noviembre de ${YEAR}, lado a lado y con fuente.`,
    jsonld: webpage(`${n}: propuestas de los partidos ${YEAR}`, url, { crumbs: [{ name: 'Comparar', url: SITE_URL + '/comparar/' }, { name: n, url }] }),
    seoBody: `<h1>${esc(n)}: qué propone cada partido en ${YEAR}</h1><p>Propuestas de ${ps.length} partidos sobre ${esc(n.toLowerCase())}, resumidas sin interpretar.</p>${ps.map((p) => { const it = p.propuestas.filter((x) => x.area === ar); return `<h2>${a(`/partido/${p.id}/`, `${p.nombre} (${p.siglas})`)}</h2>${list(it.map((i) => i.texto))}`; }).join('')}${navLinks()}`,
  });
}
{
  const d = DATA.deuda || {};
  const url = SITE_URL + '/deuda/';
  emit('deuda', {
    route: 'deuda',
    title: `Deuda pública de España en ${YEAR}: cuánto debemos y cuánto pagamos en intereses | ${NAME}`,
    description: 'España debe 1,74 billones de euros, casi el 100% del PIB, y paga más de 40.000 millones al año en intereses. Contador en directo, cómo evoluciona la deuda, simulador y qué propone cada partido.',
    jsonld: webpage('La deuda pública de España explicada', url, { crumbs: [{ name: 'Deuda pública', url }] }),
    seoBody: `<h1>La deuda pública de España</h1><p>${esc(d.entradilla_corta || d.entradilla || '')}</p>${(d.cifras_clave || []).length ? `<h2>Cifras clave</h2><ul>${d.cifras_clave.map((c) => `<li><strong>${esc(c.etiqueta)}:</strong> ${esc(c.valor)} ${esc(c.unidad || '')}</li>`).join('')}</ul>` : ''}${(d.te_afecta || []).length ? `<h2>En qué te afecta</h2><ul>${d.te_afecta.map((x) => `<li><strong>${esc(x.valor)} — ${esc(x.titulo)}.</strong> ${esc(x.texto)}</li>`).join('')}</ul>` : ''}${(d.mecanica && d.mecanica.pasos_cortos || []).length ? `<h2>Cómo evoluciona la deuda</h2><ol>${d.mecanica.pasos_cortos.map((x) => `<li><strong>${esc(x.titulo)}.</strong> ${esc(x.texto)}</li>`).join('')}</ol>` : ''}${navLinks()}`,
  });
}
{
  const im = DATA.importa || { temas: [] };
  emit('datos', {
    route: 'importa',
    title: `Datos clave de España en ${YEAR}: vivienda, salarios, sanidad, pensiones | ${NAME}`,
    description: 'Los problemas que más afectan a la calidad de vida en España, con datos oficiales: vivienda, salarios, empleo, listas de espera, pensiones, educación, justicia y más.',
    jsonld: webpage('Datos clave para los españoles', SITE_URL + '/datos/', { crumbs: [{ name: 'Datos clave', url: SITE_URL + '/datos/' }] }),
    seoBody: `<h1>Datos clave para los españoles</h1><p>${esc(im.entradilla || '')}</p><ul>${im.temas.map((t) => `<li>${a(t.enlace ? `/${t.enlace}/` : `/datos/${t.id}/`, t.titulo)}${t.dato_clave ? `: <strong>${esc(t.dato_clave.valor)}</strong> ${esc(t.dato_clave.etiqueta)}` : ''}</li>`).join('')}</ul>${navLinks()}`,
  });
  for (const t of im.temas.filter((x) => !x.enlace)) {
    const url = `${SITE_URL}/datos/${t.id}/`;
    emit(`datos/${t.id}`, {
      route: `importa-${t.id}`,
      title: `${t.titulo} en España: datos ${YEAR} y qué proponen los partidos | ${NAME}`,
      description: `${t.dato_clave ? t.dato_clave.valor + ' — ' + t.dato_clave.etiqueta + '. ' : ''}${t.resumen || ''}`.slice(0, 158),
      jsonld: webpage(`${t.titulo}: datos clave`, url, { crumbs: [{ name: 'Datos clave', url: SITE_URL + '/datos/' }, { name: t.titulo, url }] }),
      seoBody: `<h1>${esc(t.titulo)} en España: los datos</h1>${t.dato_clave ? `<p><strong>${esc(t.dato_clave.valor)}</strong> ${esc(t.dato_clave.etiqueta)} (${esc(t.dato_clave.fuente || '')}).</p>` : ''}<p>${esc(t.resumen || '')}</p>${(t.datos || []).length ? `<h2>Datos</h2><ul>${t.datos.map((x) => `<li><strong>${esc(x.valor)}</strong> ${esc(x.etiqueta)} (${esc(x.fuente || '')})</li>`).join('')}</ul>` : ''}${(t.causas || []).length ? `<h2>Causas que señalan los expertos</h2><ul>${t.causas.map((x) => `<li><strong>${esc(x.titulo)}.</strong> ${esc(x.texto || '')}</li>`).join('')}</ul>` : ''}${t.y_quien_lo_paga ? `<h2>¿Y quién lo paga?</h2><p>${esc(t.y_quien_lo_paga)}</p>` : ''}${(t.preguntas || []).length ? `<h2>Preguntas para hacer a los partidos</h2>${list(t.preguntas)}` : ''}${t.area ? `<p>${a(`/tema/${t.area}/`, 'Qué propone cada partido sobre este tema')}</p>` : ''}${navLinks()}`,
    });
  }
}
if (DATA.test) {
  const T = DATA.test, n = T.afirmaciones.length;
  emit('test', {
    route: 'test',
    og: ogFor('test.png'),
    title: `Test electoral ${YEAR}: ¿con qué partido coincides? | ${NAME}`,
    description: `¿Dudas a quién votar el 29N? Responde a ${n} afirmaciones y compara tus respuestas con lo que cada partido ha votado, hecho o propuesto. Gratis, anónimo y con fuentes.`,
    jsonld: webpage(`Test electoral ${YEAR}: ¿con qué partido coincides?`, SITE_URL + '/test/', { crumbs: [{ name: 'Test', url: SITE_URL + '/test/' }] }),
    seoBody: `<h1>Test electoral ${YEAR}: ¿con qué partido coincides?</h1><p>${esc(T.intro || '')} ${esc(T.aviso || '')}</p><h2>Las ${n} afirmaciones del test</h2><ol>${T.afirmaciones.map((x) => `<li>${esc(x.texto)}</li>`).join('')}</ol><h2>Cómo se calcula</h2><p>${esc(T.metodo || '')}</p>${navLinks()}`,
  });
}
emit('partidos', { route: 'partidos', title: `Partidos que se presentan a las elecciones generales de ${YEAR} | ${NAME}`, description: `Los ${parties.length} partidos y coaliciones de las elecciones generales del 29 de noviembre de ${YEAR}, con su programa, sus propuestas y las críticas que reciben.`, jsonld: webpage('Partidos', SITE_URL + '/partidos/', { crumbs: [{ name: 'Partidos', url: SITE_URL + '/partidos/' }] }), seoBody: `<h1>Partidos que se presentan a las elecciones generales de ${YEAR}</h1><ul>${parties.map((p) => `<li>${a(`/partido/${p.id}/`, `${p.nombre} (${p.siglas})`)}${p.candidato ? ' — candidato: ' + esc(p.candidato) : ''}</li>`).join('')}</ul>${navLinks()}` });
emit('comparar', { route: 'comparar', title: `Comparar programas electorales ${YEAR} tema a tema | ${NAME}`, description: 'Compara las propuestas de dos o tres partidos en vivienda, empleo, pensiones, sanidad, inmigración y cualquier otro tema, con fuentes.', jsonld: webpage('Comparar partidos', SITE_URL + '/comparar/'), seoBody: `<h1>Comparar programas electorales ${YEAR}</h1><p>Elige un tema y compara lo que proponen los partidos.</p>${navLinks()}` });
emit('metodologia', { route: 'metodologia', title: `Metodología, fuentes y aviso | ${NAME}`, description: 'Cómo resumimos los programas, cómo seleccionamos las críticas, de dónde salen los datos y cómo funciona el test.', jsonld: webpage('Metodología', SITE_URL + '/metodologia/'), seoBody: `<h1>Metodología</h1><p>Neutralidad de método: los mismos criterios, públicos y explícitos, para todos los partidos. Cada dato enlaza a su fuente.</p>${navLinks()}` });

fs.writeFileSync(path.join(SITE, '404.html'), page({ mode: 'site', route: 'inicio', canonical: SITE_URL + '/', title: `Página no encontrada | ${NAME}`, description: 'Esta página no existe.', jsonld: orgLd, seoBody: `<h1>Esta página no existe</h1><p>${a('/', 'Volver al inicio')}</p>${navLinks()}` }).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="canonical"'));
fs.writeFileSync(path.join(SITE, 'llms.txt'), `# ${NAME}\n\n> Herramienta independiente y no partidista para las elecciones generales de España del 29 de noviembre de ${YEAR}: propuestas de cada partido resumidas sin interpretar y con fuente, críticas con fuente, un test de afinidad basado en lo que cada partido ha votado, la deuda pública explicada y datos clave.\n\n## Partidos\n${parties.map((p) => `- [Programa electoral de ${p.nombre} (${p.siglas})](${SITE_URL}/partido/${p.id}/)`).join('\n')}\n\n## Temas\n${AREAS.map(([id, n]) => `- [${n}: qué propone cada partido](${SITE_URL}/tema/${id}/)`).join('\n')}\n\n## Otras secciones\n- [Test: ¿con qué partido coincides?](${SITE_URL}/test/)\n- [Deuda pública de España](${SITE_URL}/deuda/)\n- [Datos clave](${SITE_URL}/datos/)\n- [Metodología](${SITE_URL}/metodologia/)\n- [Datos en JSON](${SITE_URL}/data.json)\n`);
fs.writeFileSync(path.join(SITE, '_redirects'), `/importa /datos/ 301\n/importa/ /datos/ 301\n/importa-* /datos/:splat 301\n`);
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc><lastmod>${DATA.generado}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(SITE, 'robots.txt'), LANZADA ? `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(SITE, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${LANZADA ? '' : '  X-Robots-Tag: noindex, nofollow\n'}\n/data.json\n  Cache-Control: public, max-age=300\n\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({ name: NAME, short_name: NAME, start_url: '/', display: 'standalone', lang: 'es', background_color: meta.bg || '#ffffff', theme_color: meta.theme_color || '#14213d', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] }));
if (fs.existsSync(path.join(ROOT, 'src/icon.svg'))) fs.copyFileSync(path.join(ROOT, 'src/icon.svg'), path.join(SITE, 'icon.svg'));
fs.mkdirSync(path.join(SITE, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'src/fonts'))) fs.copyFileSync(path.join(ROOT, 'src/fonts', f), path.join(SITE, 'fonts', f));
if (fs.existsSync(path.join(ROOT, 'src/og-deuda.png'))) fs.copyFileSync(path.join(ROOT, 'src/og-deuda.png'), path.join(SITE, 'og-deuda.png'));
if (fs.existsSync(path.join(ROOT, 'src/og.png'))) fs.copyFileSync(path.join(ROOT, 'src/og.png'), path.join(SITE, 'og.png'));
if (fs.existsSync(path.join(ROOT, 'src/og'))) { fs.mkdirSync(path.join(SITE, 'og'), { recursive: true }); for (const f of fs.readdirSync(path.join(ROOT, 'src/og'))) fs.copyFileSync(path.join(ROOT, 'src/og', f), path.join(SITE, 'og', f)); }

const stats = parties.map((p) => `${p.siglas}: ${p.propuestas.length} prop · ${Object.values(p.criticas).flat().length} crít · ${p.mentiras.length} ment`).join('\n');
console.log(`OK · ${parties.length} partidos · ${urls.length} páginas\n${stats}\nartifact: ${(fs.statSync(path.join(ROOT, 'dist/artifact.html')).size / 1024).toFixed(0)} KB`);
