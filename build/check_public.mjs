// Revisión previa a publicar el repositorio: busca material interno o personal
// en los ficheros que se van a subir (todo lo que no está en .gitignore).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const ignored = (rel) => ignore.some((g) => {
  const p = g.replace(/\/$/, '');
  if (p.includes('*')) return new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '[^/]*') + '$').test(rel);
  return rel === p || rel.startsWith(p + '/');
});
const PATTERNS = [
  [/promotora/i, 'referencia interna a la promotora'],
  [/\/home\/|\/tmp\/|scratchpad/i, 'ruta local'],
  [/subagent|\bagente (de|del) (IA|claude)|claude/i, 'referencia a herramientas internas'],
  [/[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.[a-z]+/i, 'email personal'],
  [/opini[oó]n personal|me parece|creo que|yo (creo|pienso)/i, 'opinión en primera persona'],
  [/\b(TODO|FIXME|XXX)\b/, 'nota pendiente'],
];
const hits = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name), rel = path.relative(ROOT, abs);
    if (e.name === '.git' || ignored(rel)) continue;
    if (e.isDirectory()) { walk(abs); continue; }
    if (!/\.(js|mjs|json|md|html|css|ya?ml|txt)$/.test(e.name) || rel === 'build/check_public.mjs') continue;
    fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
      for (const [re, why] of PATTERNS) if (re.test(line) && !/claude:viewport-fit-sides/.test(line)) hits.push(`${rel}:${i + 1} [${why}] ${line.trim().slice(0, 120)}`);
    });
  }
})(ROOT);
if (hits.length) { console.log(hits.join('\n')); console.log(`\n${hits.length} avisos. Revísalos antes de publicar.`); process.exit(1); }
console.log('Sin avisos: listo para publicar.');
