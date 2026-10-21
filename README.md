# Antes de Votar

App electoral no partidista para las elecciones generales del 29 de noviembre de 2026: las propuestas de cada partido resumidas y sin interpretar, críticas con fuente (económicas, sociales, culturales y de Estado de derecho), un test de afinidad, la deuda pública explicada con un simulador y los problemas que más afectan a la calidad de vida, con datos.

## Estructura
- `data/` — todo el contenido en JSON (un fichero por partido, encuestas, deuda, importa, test). Reglas editoriales en `data/SCHEMA.md`.
- `src/` — la app (HTML, CSS y JS sin dependencias).
- `build/build.mjs` — genera `dist/artifact.html` (fichero único) y `dist/site/` (sitio estático con una página prerenderizada por partido y por tema, sitemap y robots).

## Construir
```
node build/build.mjs
```
Sin dependencias: solo Node 18+.

## Actualizar contenido
Edita el JSON correspondiente en `data/` y vuelve a construir. Cuando un partido publique su programa del 29N, sustituye sus propuestas con `origen: "programa-2026"` y pon `programa_2026_publicado: true`.

## Criterios
La metodología completa está en [docs/METODOLOGIA.md](docs/METODOLOGIA.md). Para avisar de errores, ver [CORRECCIONES.md](CORRECCIONES.md). Aviso legal y de independencia en [AVISO.md](AVISO.md).

## Antes de publicar cambios
```
node build/check_public.mjs
```
Comprueba que no se suben notas internas, rutas locales ni datos personales.

## Licencias
Código bajo MIT, datos y textos propios bajo CC BY 4.0 y tipografías bajo OFL. Ver [LICENSE](LICENSE).

## Despliegue
El sitio se publica en Cloudflare Pages desde la rama `main`:
- Comando de build: `node build/build.mjs`
- Directorio de salida: `dist/site`
- Variables de entorno: `SITE_URL` (dirección pública) y `LANZAMIENTO=1` cuando se abra al público. Sin `LANZAMIENTO`, el sitio no se indexa en buscadores.
