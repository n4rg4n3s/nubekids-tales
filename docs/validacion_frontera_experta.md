# Validacion local de la frontera experta

> Estado 2026-04-09: protocolo ya ejecutado y validado manualmente con los casos `Leo`, `Sara`, `Mateo` y `Oscar`.
> Uso recomendado a partir de ahora: regresion guiada cada vez que se toque `ragService`, `narrativeAgent`, `storytellingAgent`, `visualBriefAgent` o la maquetacion del texto final.

## Objetivo

Validar que el soporte experto de la app es real y llega hasta el cuento final.

La cadena que queremos comprobar es esta:

`Step 2 del usuario -> RAG recuperado -> ExpertNarrativeBrief -> storyBeats -> texto final`

No basta con que el brief "suene bien". El objetivo pedagogico, la calibracion por edad y la intencion emocional deben verse en el texto final y en las ilustraciones propuestas.

---

## Preparacion

1. Ejecutar en local con modo real:
   - `VITE_USE_MOCK=false`
   - `VITE_GEMINI_API_KEY` valido
   - Supabase operativo si se quiere validar RAG V2 real
2. Generar cada cuento desde el wizard normal.
3. Al terminar cada generacion, abrir DevTools y consultar una de estas rutas:
   - `window.__NUBEKIDS_EXPERT_TRACE__`
   - `window.__NUBEKIDS_EXPERT_TRACE_HISTORY__`
   - `JSON.parse(localStorage.getItem('nubekids:expert-trace:latest') ?? 'null')`

La traza guarda:
- sesion e inputs relevantes
- colecciones y chunks RAG usados
- `expertBrief`
- `storyBeats`
- `visualBriefs`
- paginas finales con caption/dialogue

---

## Criterios de aprobacion

Un caso solo se considera valido si se cumplen las 4 capas:

1. RAG
- Los chunks recuperados son pertinentes al reto, a la edad y al tono buscado.
- No hay ruido dominante ni chunks claramente fuera de foco.

2. ExpertNarrativeBrief
- El `pedagogicalObjective` y el `emotionalObjective` reflejan el input real del usuario.
- `ageRationale`, `languageGuidance` y `narrativeGuidance` son accionables, no genericidades.
- `avoidPatterns` protege contra justo los errores esperables del caso.

3. Story beats
- La progresion narrativa aplica el brief en paginas concretas.
- La edad se nota en longitud, sintaxis, ritmo y densidad de inferencia.
- El objeto magico resuelve de forma organica, no decorativa.

4. Texto final
- El mensaje pedagogico se percibe sin moralina explicita.
- El tono y la dificultad de lectura corresponden al `ageGroup`.
- No se "pierde" la personalizacion de Step 2 al bajar a pagina.

---

## Caso 1: Baby sin pedagogia explicita

### Input sugerido
- Nombre: Leo
- Edad: `0-3`
- Modo heroe: foto o descripcion simple
- Step 2: desactivado
- Objeto magico: mantita azul
- Genero: `Classic Fairytale`

### Lo que deberia pasar
- RAG: deben aparecer chunks de lenguaje sensorial, calma, repeticion o lectura compartida.
- Brief: debe priorizar calma, celebracion, previsibilidad y co-regulacion.
- Beats: texto minimo, casi todo en `caption`, una sola idea clara por pagina.
- Final: el cuento debe sentirse mas cerca de un board book ritmico que de una historia con conflicto clasico.

### Señales de fallo
- Demasiado texto por pagina.
- Dialogos innecesarios.
- Problema narrativo "grande" o tension convencional.
- Brief correcto pero texto final demasiado literario o abstracto.

---

## Caso 2: Tiny con reto conductual concreto

### Input sugerido
- Nombre: Sara
- Edad: `3-4`
- Step 2 activado
- Retos: `frustracion`, `esperar turnos`
- Habilidades: `pedir ayuda`
- Contexto emocional: `se enfada cuando algo no sale`
- Motivaciones: `pompas`, `colores`
- Valor: `paciencia`
- Objeto magico: varita de burbujas
- Genero: `3D Animation Magic`

### Lo que deberia pasar
- RAG: deben verse chunks relacionados con regulacion emocional temprana, lenguaje claro y retos pequenos.
- Brief: debe traducir la frustracion a un reto pequeno, seguro y repetible, no a una leccion abstracta sobre "portarse bien".
- Beats: repeticion con variacion, frases cortas, resolucion previsible y segura.
- Final: el cuento debe modelar espera, ayuda y exito gradual sin sermonear.

### Señales de fallo
- El cuento habla de "paciencia" de forma declarativa, pero no la dramatiza.
- El reto del cuento no se parece al input del usuario.
- El lenguaje es demasiado denso para `3-4`.
- Las paginas 7-10 olvidan el foco conductual inicial.

---

## Caso 3: Reader con foco emocional y agencia

### Input sugerido
- Nombre: Mateo
- Edad: `5-7`
- Step 2 activado
- Retos: `miedo a equivocarse`
- Habilidades: `resolver problemas`, `tomar decisiones`
- Contexto emocional: `se bloquea cuando cree que no le saldra bien`
- Motivaciones: `inventos`, `mapas`
- Valor: `valentia`
- Contexto libre: `quiere hacer cosas solo pero a veces se rinde muy rapido`
- Objeto magico: mochila-cartografo
- Genero: `Anime Adventure`

### Lo que deberia pasar
- RAG: deben entrar chunks de agencia, causa-efecto, error como parte del aprendizaje o lector emergente.
- Brief: debe preservar matiz; no reducir todo a "ser valiente".
- Beats: debe haber decision real, consecuencia emocional comprensible y cierre con agencia del protagonista.
- Final: el cuento debe mostrar iniciativa propia y algo de inferencia moderada.

### Señales de fallo
- Resolucion por rescate externo.
- Lenguaje plano, igual al de `tiny/little`.
- El error aparece, pero no afecta a la estructura del cuento.
- El texto final borra la complejidad emocional que si estaba en el brief.

---

## Caso 4: Little con separacion suave y autonomia

### Input sugerido
- Nombre: Oscar
- Edad: `4-5`
- Step 2 activado
- Retos: `ansiedad por separacion`
- Habilidades: `autonomia`
- Contexto emocional: `separacion de los padres`
- Motivaciones: `animales`
- Valor: `valentia`
- Contexto libre:
- Objeto magico: su perro border collie negro y blanco
- Genero: `Anime Adventure`

### Lo que deberia pasar
- RAG: deben entrar chunks de apego seguro, juego simbolico, separacion suave y autonomia emocional.
- Brief: debe tratar la separacion con sutileza, sin convertirla en conflicto directo ni en explicacion doctrinal.
- Beats: el perro debe funcionar como ancla emocional y motor activo del cambio, no como mero acompañante decorativo.
- Final: el cuento debe dejar sensacion de seguridad y calma, no moraleja explicita.

### Señales de fallo
- Sobre-dramatizar la separacion o mencionar el conflicto parental de forma frontal.
- Convertir al perro en simple mascota estetica sin impacto narrativo.
- Cerrar con una leccion explicada del tipo `aprendio que...`.
- Usar lenguaje demasiado abstracto o demasiado plano para `little`.

---

## Metodo de revision por caso

Para cada cuento, revisar la traza en este orden:

1. `session`
- Confirmar edad, item, motivaciones y retos.

2. `ragChunks`
- Revisar `collection`, `source` y `summary`.
- Pregunta clave: "¿estos chunks justifican el tipo de cuento que luego se escribio?"

3. `expertBrief`
- Revisar `pedagogicalObjective`
- Revisar `emotionalObjective`
- Revisar `ageRationale`
- Revisar `languageGuidance`
- Revisar `narrativeGuidance`
- Revisar `avoidPatterns`

4. `storyBeats`
- Comprobar paginas 2-3, 6 y 9-10.
- Son las paginas donde mas claro debe verse el paso de brief a texto.

5. `finalPages`
- Verificar que `caption` y `dialogue` finales siguen sosteniendo el objetivo del caso.

---

## Decision final

Resultado de ejecucion 2026-04-09:

- `Leo` valida `baby` con tono sensorial y texto minimo
- `Sara` valida `tiny` tras corregir fuga de opciones y moralizacion residual
- `Mateo` valida `reader` con agencia y complejidad emocional suficientes
- `Oscar` valida `little` con separacion tratada con sutileza y buena funcion del objeto magico

Veredicto:

- la realineacion experta queda validada para esta iteracion
- la siguiente sesion no debe repetir esta validacion salvo regresion real
- el siguiente foco operativo pasa a ser Fase 11: revalidacion movil final de `Book`/PDF y checklist de go-live
