# Metodología

Este documento explica cómo se construye cada sección de la aplicación y con qué criterios. Los criterios son públicos y se aplican igual a todos los partidos. Cualquier persona puede comprobar los datos en los ficheros de `data/` y avisar de un error (ver [CORRECCIONES.md](../CORRECCIONES.md)).

## 1. Principio general: neutralidad de método

La neutralidad que aplicamos es de **método**, no de resultados. Usamos los mismos criterios, las mismas fuentes de referencia y el mismo nivel de exigencia con todos los partidos. No igualamos los resultados de forma artificial. Si una propuesta tiene más problemas que otra según la evidencia disponible, eso se refleja.

Para que este criterio no dependa de opiniones, las valoraciones se apoyan siempre en referencias externas identificables:

- normas y jurisprudencia: Constitución Española, Tribunal Constitucional, Tribunal Supremo, Tribunal Europeo de Derechos Humanos, Tribunal de Justicia de la UE;
- órganos de referencia: Comisión de Venecia, GRECO, Comisión Europea, órganos de Naciones Unidas;
- análisis económicos de instituciones y centros de estudios de distinto signo: AIReF, Banco de España, OCDE, FMI, Funcas, Fedea, BBVA Research, universidades.

## 2. Partidos y orden

- Se incluyen los partidos y coaliciones que concurren a las elecciones generales. La lista se contrasta con las candidaturas publicadas en el BOE.
- Los partidos con datos en las encuestas nacionales se ordenan por la media de los últimos sondeos publicados. Las fuentes de esa media se indican en la aplicación.
- Los demás partidos se agrupan aparte: primero los de ámbito estatal y después los que solo se presentan en algunas provincias. Dentro de cada grupo se ordenan por su último resultado electoral comparable, indicando la elección y el territorio.
- **Veda de encuestas.** El artículo 69.7 de la Ley Orgánica del Régimen Electoral General prohíbe publicar sondeos en los cinco días anteriores a la votación. Del 24 de noviembre a las 00:00 al cierre de los colegios del 29 de noviembre, la aplicación retira la media de encuestas, los escaños estimados y los datos de encuestas de sus ficheros. Durante ese periodo los partidos se ordenan por los escaños obtenidos en las elecciones de 2023.
- Las etiquetas ideológicas siguen las familias políticas habituales en ciencia política (Chapel Hill Expert Survey y PopuList) y se aplican con el mismo criterio a todos.

## 3. Propuestas

- Cada propuesta se resume en una frase, sin interpretarla ni valorarla.
- Si el partido usa un término propio con carga valorativa, se reproduce entre comillas o se le atribuye.
- Cada propuesta indica su origen y enlaza a su fuente:
  - **Programa 29N:** el programa del partido para estas elecciones.
  - **Programa 2023:** el programa de las anteriores elecciones generales, mientras no se publique el nuevo.
  - **Declaración:** compromisos públicos del partido o de sus dirigentes, con fecha.
  - **Hecho de gobierno:** medidas aprobadas por partidos que han gobernado.
- Las fuentes se priorizan en este orden: documento oficial del partido, boletines y documentos oficiales (BOE, Congreso, Gobierno) y, en último lugar, prensa.
- Cuando un partido publica su programa del 29N, sus propuestas se actualizan y el cambio se registra.
- Las propuestas *destacadas* son las que el propio partido presenta como centrales.

## 4. Críticas

Cada partido tiene críticas en cuatro dimensiones: **económica**, **social**, **cultural** y **Estado de derecho y derechos fundamentales**.

- Cada crítica se refiere a propuestas o actuaciones concretas y recoge la mejor versión del argumento, con su fuente.
- La dureza de una crítica depende de la evidencia y de la gravedad, no del partido.
- **Estado de derecho.** Se comprueba si lo que un partido propone, o lo que ha hecho en el gobierno o en el parlamento, choca con las normas y la jurisprudencia citadas en el apartado 1. Cada crítica indica la norma o resolución concreta y una gravedad con la misma escala para todos:
  - **Alta:** vulneraría derechos fundamentales o el núcleo del orden constitucional o europeo según doctrina consolidada.
  - **Media:** riesgo serio señalado por órganos de referencia, o tensión con doctrina reiterada.
  - **Baja:** dudas jurídicas razonables o problemas de calidad institucional.

  Si un partido no tiene hallazgos, se indica. Si la doctrina respalda una propuesta, se recoge como *aval*.
- **Conductas.** Solo se recogen conductas con sentencia firme o resolución de un tribunal. Las investigaciones abiertas no se valoran.

## 5. Test «¿Con quién coincides?»

- **Selección.** Los temas salen de cruzar lo que más preocupa a los españoles según el CIS con las grandes líneas de división del sistema de partidos (económica, valores, territorial, soberanía e integración europea, inmigración, instituciones, exterior y defensa). Aproximadamente la mitad de las afirmaciones están redactadas de modo que «de acuerdo» es la respuesta típica de la izquierda y la otra mitad de la derecha. Se descartan las afirmaciones con posición documentada de menos de 5 partidos.
- **Posiciones.** Se asignan por este orden: lo votado en el Congreso o el Parlamento Europeo o lo hecho gobernando; después el programa; después las declaraciones. Si lo que dice y lo que vota no coinciden, cuenta lo votado y se muestra la contradicción. Cada posición enlaza a su fuente.
- **Respuestas.** De acuerdo, a medias (postura intermedia) o en desacuerdo. «No lo sé / sin opinión» deja fuera la afirmación para todos los partidos por igual.
- **Cálculo.** Coincidir suma 1 punto, estar a un paso suma 0,5 y la posición opuesta suma 0. Si un partido no tiene posición verificable en una afirmación, cuenta 0,5 (desconocida), para que tener pocos datos no dé ventaja. Para cada afirmación el usuario puede indicar, de forma opcional, cuánto le importa el tema: poco (cuenta la mitad), normal (cuenta 1) o mucho (cuenta doble).
- **Clasificación.** Solo entran los partidos con posición en al menos 15 afirmaciones; los demás aparecen aparte, sin porcentaje. Si varios partidos quedan a 5 puntos o menos del primero, se muestran como empate.
- **Validación.** Antes de publicar se comprueba con votantes simulados que el test devuelve el partido correcto entre los más cercanos, y con personas reales que saben a quién votan.
- **Privacidad:** las respuestas se calculan en el navegador del usuario y no se envían a ningún servidor.

## 6. Deuda pública

- Las cifras proceden del Banco de España, la IGAE, Eurostat, la AIReF y el Tesoro. Cada una enlaza a su fuente.
- **Contador de intereses:** reparte el gasto anual en intereses (IGAE, último año cerrado) entre los segundos del año.
- **Simulador:** aplica la ecuación estándar de la dinámica de la deuda: `deuda(t+1) = deuda(t) × (1 + interés) / (1 + crecimiento nominal) − saldo primario`, con todo expresado en porcentaje del PIB. La deuda de partida es el último dato oficial y no se puede modificar. El interés medio converge en 8 años desde el que paga hoy el Estado hasta el elegido; el crecimiento parte del previsto para este año y converge en 3. El aumento del gasto por envejecimiento resta 2 puntos de PIB al saldo primario de forma progresiva hasta 2050, calibrado para reproducir la proyección de la AIReF (123% del PIB en 2050). El usuario puede añadir un ajuste anual (recorte de gasto o subida de impuestos).
  - Parte de los últimos datos oficiales disponibles.
  - Calcula el saldo primario necesario para estabilizar la deuda, y para reducirla al 60% del PIB en 20 años.
  - Es un cálculo simplificado y no incluye el efecto de un ajuste fiscal sobre el crecimiento.

## 7. Datos clave

Recoge los problemas con más impacto en la calidad de vida según datos oficiales: INE, Eurostat, CIS, CGPJ, Ministerio de Sanidad, OCDE y otros.

Cada tema incluye un dato principal, datos de contexto, las causas que señalan los expertos y, cuando las soluciones habituales implican más gasto público, una nota sobre cómo se financiaría.

## 8. Correcciones y actualizaciones

- Los errores se corrigen lo antes posible y las correcciones relevantes se registran públicamente.
- Las fuentes, las fechas de actualización y el historial de cambios están en este repositorio.
