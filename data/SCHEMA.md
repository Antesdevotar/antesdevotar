# Esquema de datos — App electoral (Generales 29N 2026)

Todo el contenido en español. JSON válido, UTF-8, sin comentarios.
Contexto: Pedro Sánchez convocó elecciones generales para el **29 de noviembre de 2026**. La izquierda negocia un posible "Frente Amplio" (Sumar + otros, quizá Podemos).

## Reglas editoriales (innegociables)
1. **Propuestas**: resumidas y sin paja, pero SIN interpretar ni valorar. Lo que el partido propone, tal cual, en una frase clara (máx. ~220 caracteres). Nada de adjetivos propios. Cubrir el máximo posible del programa: objetivo 50–90 propuestas para partidos grandes, 25–50 para medianos/regionales. Priorizar el programa 2026 si ya está publicado; si no, programa de generales 2023 + declaraciones y actuaciones públicas recientes (2025–2026) con fecha y fuente.
2. **Críticas**: los contras de sus propuestas desde tres ángulos — económico, social y cultural. Cada crítica debe ser sustantiva (la mejor versión de la crítica, no un insulto), referida a propuestas concretas y atribuida a una fuente seria cuando sea posible (AIReF, Banco de España, Fedea, BBVA Research, Funcas, OCDE, FMI, Comisión Europea, CES, académicos, think tanks de distinto signo). **Mismo criterio para todos, no mismo resultado**: neutralidad no es punto medio. La dureza de cada crítica debe ser proporcional a la evidencia y a la gravedad (derechos fundamentales, Estado de derecho, consenso empírico). Si un partido propone algo más grave o peor fundamentado, debe quedar peor. Orientativo: 3–5 críticas por dimensión en partidos grandes y 2–3 en medianos o regionales, sin forzar ni recortar para igualar.
3. **(Retirado de la app el 21-10-2026) Mentiras** — solo se usan como crítica: si una propuesta se apoya en un dato falso verificado, se añade como crítica de esa propuesta con su fuente. Criterio antiguo: solo afirmaciones públicas verificables y verificadas. Dos tipos de fuente: (a) verificación de fact-checker reconocido (Maldita.es, Newtral, EFE Verifica, Verificat, RTVE Verifica, AFP Factual) con veredicto falso/engañoso; (b) contraste propio contra dato oficial (INE, Eurostat, Banco de España, AIReF, BOE, Ministerio de Hacienda, SEPE...) — en ese caso indicar el dato y su fuente. SIEMPRE con URL. Preferir 2024–2026. Nunca inventar ni deducir: si no hay verificación localizable, no entra. Mismo criterio de búsqueda para todos.
4. Neutralidad de método, no de resultados: criterios explícitos y públicos aplicados por igual a todos. Ningún partido sale mejor ni peor por cómo se redacta; sí puede salir peor por lo que propone o por lo que ha dicho. Forzar un equilibrio que la evidencia no respalda también es un sesgo.
5. Copyright: no copiar párrafos de prensa; parafrasear siempre. Las propuestas de programas sí pueden resumirse fielmente.

## Áreas temáticas (usar exactamente estos `area` ids)
economia (Economía y fiscalidad) · empleo (Empleo y salarios) · vivienda · pensiones · sanidad · educacion · deuda (Deuda y cuentas públicas) · inmigracion · energia (Energía y clima) · territorio (Modelo territorial) · instituciones (Justicia, instituciones y corrupción) · igualdad (Igualdad y derechos sociales) · seguridad (Seguridad y defensa) · exterior (Europa y exterior) · rural (Campo y mundo rural) · cultura (Cultura, lengua e identidad) · tecnologia (Ciencia, tecnología e innovación) · demografia (Familia y demografía)

## Fichero por partido: `data/parties/<id>.json`
```json
{
  "id": "pp",
  "nombre": "Partido Popular",
  "siglas": "PP",
  "candidato": "Nombre del candidato a la presidencia o cabeza de lista al Congreso (29N)",
  "ideologia": "Etiqueta neutra y breve (ej. 'Centroderecha liberal-conservador')",
  "ambito": "Estatal | Cataluña | País Vasco | ...",
  "color": "#hex de su color corporativo oficial",
  "web": "https://...",
  "escanos_2023": 137,
  "resumen": "2 frases neutras: quiénes son y qué priorizan según su propio programa",
  "fuentes_programa": [
    {"titulo": "Programa electoral Generales 2023", "url": "https://...", "fecha": "2023-07"}
  ],
  "programa_2026_publicado": false,
  "propuestas": [
    {
      "id": "pp-viv-01",
      "area": "vivienda",
      "texto": "Avalar la entrada de la primera vivienda a jóvenes hasta el ...",
      "origen": "programa-2023 | programa-2026 | declaracion | accion",
      "fuente": {"nombre": "Programa 2023, p. 45", "url": "https://...", "fecha": "2023-07"},
      "destacada": true
    }
  ],
  "criticas": {
    "economica": [
      {"titulo": "Frase corta", "texto": "2-3 frases con el argumento", "sobre": ["pp-viv-01"], "fuente": {"nombre": "AIReF, Informe X", "url": "https://..."}}
    ],
    "social": [],
    "cultural": []
  },
  "mentiras": [
    {
      "id": "pp-m-01",
      "afirmacion": "Paráfrasis fiel de lo que se dijo",
      "autor": "Nombre (cargo)",
      "fecha": "2025-05-12",
      "contexto": "Dónde lo dijo (mitin, entrevista, Congreso, X)",
      "veredicto": "Falso | Engañoso | Exagerado | Sin pruebas",
      "realidad": "Qué dicen los datos, en 1-2 frases",
      "tipo": "fact-checker | dato-oficial",
      "verificador": "Maldita.es / Newtral / ... o la fuente oficial",
      "url": "https://..."
    }
  ],
  "actualizado": "2026-10-21"
}
```
`destacada: true` para las ~8 propuestas más centrales del partido (las que más repite en campaña).
