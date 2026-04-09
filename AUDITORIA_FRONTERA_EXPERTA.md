# AUDITORIA_FRONTERA_EXPERTA.md

> Fecha: 2026-04-08
> Estado: auditoria arquitectonica
> Objetivo: definir la frontera correcta entre conocimiento experto, guardrails de producto y creatividad generativa para que el "alma" experta de NubeKids sea real y verificable.

---

## 1. Tesis

La promesa de NubeKids no puede apoyarse solo en copy como "motor calibrado por edad" o "sistema experto".

Para que esa promesa sea verdad:

1. El conocimiento experto debe entrar en el pipeline como fuente de verdad operativa.
2. Ese conocimiento debe sobrevivir hasta la capa donde se escribe el texto final.
3. Las reglas fijas en codigo deben actuar como guardrails de formato y seguridad, no como sustituto del criterio experto.

Diagnostico actual:

- El sistema multiagente existe.
- El RAG existe.
- La arquitectura documental promete un core experto multidisciplinar real.
- Pero hoy ese core experto gobierna con fuerza solo `narrativeAgent`.
- `storytellingAgent` y `visualBriefAgent` siguen demasiado desacoplados del conocimiento recuperado.

Conclusión:

El alma experta es parcialmente real, pero todavia no gobierna de forma end-to-end la escritura final del cuento.

---

## 2. Decision Base Para Esta Auditoria

Se asume como decision ya tomada:

- Las colecciones canonicas de RAG seran solo `child-psych` y `storytelling`.
- `neuro-dev` deja de existir como coleccion separada porque su contenido se considera diluido y mezclado de forma natural dentro de `child-psych`.
- Debe eliminarse de codigo, configuracion y flujo toda mencion futura a `neuro-dev`.

Implicacion:

- El sistema seguira siendo multidisciplinar, pero esa multidisciplina se expresara a traves de dos grandes colecciones:
  - `child-psych`: desarrollo, neuroeducacion aplicada, psicologia infantil, apego, emocion, conducta.
  - `storytelling`: estructura, ritmo, tecnica narrativa, escritura infantil, construccion de escenas.

---

## 3. Vision Correcta Del Producto

La app no debe funcionar como:

- un prompt bonito con tono experto
- una capa de marketing sobre un generador generalista
- una suma de "reglas por edad" escritas a mano

La app debe funcionar como:

- un sistema de generacion guiado por conocimiento experto recuperado
- una capa editorial que da forma y seguridad a ese conocimiento
- un motor creativo que rellena huecos, pero no inventa la doctrina pedagogica central

Formula corta:

`conocimiento experto recuperado + verdad del usuario + guardrails minimos + creatividad controlada`

---

## 4. Pipeline Actual Audit ado

Pipeline real hoy:

`RAG -> Narrative -> Storytelling -> Visual Brief`

Archivos relevantes:

- `src/services/agents/orchestratorAgent.ts`
- `src/services/agents/narrativeAgent.ts`
- `src/services/agents/storytellingAgent.ts`
- `src/services/agents/visualBriefAgent.ts`
- `src/services/ragService.ts`

### 4.1 RAG

Hoy el RAG:

- construye una query semantica a partir de `ageGroup` y `pedagogyProfile`
- consulta colecciones asignadas al tenant
- devuelve `ragChunks`

Rol correcto:

- fuente de verdad experta recuperada para la sesion concreta

Problema actual:

- el RAG no se propaga con suficiente fuerza mas alla del primer agente experto

### 4.2 narrativeAgent

Es hoy el agente mas alineado con la vision original.

Consume:

- `ragChunks`
- `pedagogyProfile`
- `ageGroup`
- `baseSystemPrompt`

Su funcion hoy:

- sintetizar objetivo pedagogico
- definir viaje emocional
- construir un arco narrativo base

Valor:

- aqui si existe una interseccion real entre input del usuario y conocimiento experto recuperado

### 4.3 storytellingAgent

Es hoy el punto mas debil de la arquitectura experta.

Consume:

- `narrativeArcSummary`
- `ageGroup`
- `language`
- `genre`
- datos basicos del heroe y objeto

No consume directamente:

- `ragChunks`
- `pedagogyProfile`
- evidencia experta estructurada

Problema:

- la intencion experta puede quedar comprimida en exceso al pasar solo por un resumen del arco
- justo en la capa donde se decide el texto final pagina a pagina, el agente no tiene acceso directo ni al contexto cientifico ni al detalle pedagogico introducido por el usuario

### 4.4 visualBriefAgent

Consume:

- `storyBeats`
- `ageGroup`
- `genre`
- datos de personaje y objeto

No consume:

- `ragChunks`
- `pedagogyProfile`
- una sintesis experta visualmente util

Diagnostico:

- su desacople es menos grave que el de `storytellingAgent`
- pero hoy su "expertise por edad" descansa demasiado en heuristicas fijas

---

## 5. Frontera Correcta

La frontera correcta debe separar cuatro capas:

### 5.1 Verdad del usuario

Es informacion que llega desde la sesion y debe preservarse.

Incluye:

- nombre del protagonista
- descripcion o foto
- edad / rango
- intereses
- retos
- habilidades a reforzar
- contexto emocional
- valores a transmitir

Regla:

Si el usuario rellena Step 2, eso no es decoracion. Es materia prima prioritaria.

### 5.2 Verdad experta

Es informacion derivada de:

- `docs/rag-sources/child-psych`
- `docs/rag-sources/storytelling`
- `rag_chunks` recuperados en runtime

Incluye:

- criterios reales de adecuacion por edad
- principios sobre lenguaje, emocion, ritmo y estructura
- estrategias narrativas para trabajar contextos concretos

Regla:

La verdad experta no debe vivir principalmente como texto literal en codigo.

### 5.3 Guardrails de producto

Son reglas fijas y legitimas en codigo.

Incluyen:

- formato JSON esperado
- numero de paginas
- limites maximos de palabras
- seguridad infantil
- ausencia de violencia y temas oscuros
- restricciones tecnicas de layout
- decisiones de UX y flujo

Regla:

Los guardrails si pueden vivir en codigo.
Pero deben ser minimos, estables y no pretender reemplazar la fuente experta.

### 5.4 Identidad editorial / tenant

Incluye:

- branding
- tono comercial
- semantica del objeto magico
- restricciones de genero e idioma

Regla:

El tenant no debe redefinir doctrina pedagogica.
Debe modular la presentacion y el tono, no la verdad experta.

---

## 6. Orden De Precedencia Correcto

Cuando haya tension entre capas, la precedencia deberia ser:

1. Seguridad y restricciones duras del producto
2. Verdad factual del usuario
3. Verdad experta recuperada
4. Identidad editorial del tenant
5. Creatividad libre del modelo

Esto corrige dos errores frecuentes:

- que el branding mande sobre la adecuacion pedagogica
- que un prompt fijo mande sobre la evidencia recuperada

---

## 7. Que Debe Vivir En RAG Y Que No

### Debe vivir en RAG

- principios de desarrollo cognitivo y emocional por edad
- tecnicas narrativas por tramo evolutivo
- formas adecuadas de trabajar retos reales del nino
- criterios sobre ritmo, repeticion, inferencia, complejidad y resolucion
- conocimiento experto que puede evolucionar, refinarse o ampliarse con nuevas fuentes

### Debe vivir en codigo

- validaciones tecnicas
- limites cuantitativos
- contratos de tipos
- formato de salida
- pasos del pipeline
- reglas de seguridad no negociables

### Debe vivir en un modulo editorial ligero

- versiones resumidas de guardrails por edad
- solo como empujon inicial y nunca como doctrina completa
- con trazabilidad explicita a fuente documental

---

## 8. Significado Correcto De "Hardcodeado"

En esta auditoria, "hardcodeado" significa:

- definido como literal fija dentro del codigo fuente
- aplicado siempre aunque el RAG recupere matices distintos
- no versionado como conocimiento experto con referencia explicita a fuente

Ejemplos actuales:

- `AGE_SYSTEM_INSTRUCTIONS`
- `NARRATIVE_AGE_INSTRUCTIONS`
- `VISUAL_AGE_INSTRUCTIONS`

Problema:

si una regla sustantiva sobre infancia o tecnica narrativa vive solo ahi, entonces la app depende mas de lo que escribio el desarrollador que del sistema experto prometido.

---

## 9. Diagnostico De Las Instrucciones Por Edad

Las instrucciones por edad no son un error en si mismas.

Pueden ser utiles como:

- resumen operativo
- recordatorio de guardrails
- ayuda para que el modelo arranque con el tono correcto

Se vuelven problematicas cuando:

- contienen doctrina pedagogica demasiado rica
- sustituyen a la consulta experta
- gobiernan la salida aunque el usuario haya dado contexto real
- no dejan claro de donde sale cada regla

Regla objetivo:

Las instrucciones por edad deben actuar como `guardrails editoriales`, no como "fuente cientifica principal".

---

## 10. Objetivo Arquitectonico

La arquitectura correcta no es que los tres agentes consulten el RAG bruto de forma redundante.

La arquitectura correcta es esta:

### Paso A. Recuperacion experta

`queryRag()` recupera chunks relevantes para la sesion.

### Paso B. Destilacion experta

`narrativeAgent` no deberia devolver solo `narrativeArcSummary`.
Deberia devolver un artefacto mas rico, por ejemplo `ExpertNarrativeBrief`, con:

- objetivo pedagogico
- objetivo emocional
- riesgos a evitar
- complejidad linguistica recomendada
- estructura narrativa recomendada
- foco del cuento para esta sesion
- justificacion resumida derivada del contexto experto

### Paso C. Escritura guiada por brief experto

`storytellingAgent` debe recibir:

- `ExpertNarrativeBrief`
- `pedagogyProfile`
- los constraints tecnicos

No necesita todo el RAG bruto si eso complica tokens.
Pero si necesita una destilacion experta que no pierda la intencion de la sesion.

### Paso D. Visualizacion guiada

`visualBriefAgent` debe recibir:

- beats
- `ExpertNarrativeBrief` resumido para visual
- reglas de legibilidad por edad

Asi la imagen apoya la intencion del cuento, no solo la describe.

---

## 11. Contrato Objetivo Entre Agentes

### Contrato recomendado nuevo

```ts
interface ExpertNarrativeBrief {
  pedagogicalObjective: string;
  emotionalObjective: string;
  ageRationale: string;
  languageGuidance: string[];
  narrativeGuidance: string[];
  avoidPatterns: string[];
  visualGuidance: string[];
  storyArcSummary: string;
}
```

Uso:

- `narrativeAgent` lo genera
- `storytellingAgent` lo consume entero
- `visualBriefAgent` consume al menos `visualGuidance`, `ageRationale` y `storyArcSummary`

Ventaja:

- la frontera entre conocimiento experto y texto final deja de depender de un resumen demasiado pobre

---

## 12. Test De Verdad Del Alma Experta

Una app con alma experta real debe pasar estos tests:

### Test 1. Sensibilidad al Step 2

Si cambian los retos o valores en Step 2 y todo lo demas se mantiene igual:

- el arco cambia
- los beats cambian
- el texto cambia
- la resolucion cambia

Si solo cambia el arco y el texto final casi no cambia, la frontera esta mal.

### Test 2. Persistencia de la intencion

El objetivo pedagogico definido por `narrativeAgent` debe poder reconocerse en paginas concretas del cuento final.

### Test 3. Diferenciacion por edad con fundamento

Las diferencias por edad no deben ser solo:

- menos palabras
- mas letra grande

Deben cambiar tambien:

- ritmo
- estructura
- tipo de conflicto
- forma de resolucion
- carga inferencial entre texto e imagen

### Test 4. Auditabilidad

Debe ser posible responder:

- que parte vino del usuario
- que parte vino del RAG
- que parte fue guardrail fijo

Si no se puede responder eso, el sistema no es plenamente auditable.

---

## 13. Cambios Recomendados

### Prioridad alta

1. Eliminar `neuro-dev` de codigo, configuracion y flujo.
2. Introducir `ExpertNarrativeBrief` como contrato real entre `narrativeAgent` y `storytellingAgent`.
3. Pasar `pedagogyProfile` tambien a `storytellingAgent`.
4. Rebajar `AGE_SYSTEM_INSTRUCTIONS`, `NARRATIVE_AGE_INSTRUCTIONS` y `VISUAL_AGE_INSTRUCTIONS` a guardrails breves.

### Prioridad media

5. Crear un modulo tipo `src/config/expertPolicy.ts` o `src/config/editorialGuardrails.ts`.
6. En ese modulo, cada guardrail debe declarar:
   - id
   - texto
   - tipo (`guardrail`)
   - docs fuente
   - colecciones relacionadas
7. Hacer que `visualBriefAgent` reciba una sintesis experta visual minima.

### Prioridad baja

8. Añadir observabilidad interna para debugging:
   - que chunks se recuperaron
   - que brief experto se destilo
   - que instrucciones finales recibio cada agente

---

## 14. Posicion Final

La frontera correcta para que el alma experta sea verdad es esta:

- el RAG debe ser la fuente de verdad experta
- el usuario debe ser la fuente de verdad contextual
- el codigo debe imponer solo guardrails de seguridad, formato y producto
- la creatividad del modelo debe operar dentro de ese marco, no por encima de el

Por tanto:

- mantener instrucciones fijas si
- pero solo como empujon y guardrail
- nunca como sustituto del conocimiento experto recuperado

La cuestion no es "usar o no usar prompts fijos".
La cuestion es quien manda cuando el cuento se decide de verdad.

La respuesta correcta para NubeKids debe ser:

`mandan la verdad del usuario + la verdad experta recuperada; el codigo solo encauza`

---

## 15. Siguiente Paso Recomendado

Abrir una mini-fase de realineacion arquitectonica con este orden:

1. limpiar `neuro-dev`
2. definir `ExpertNarrativeBrief`
3. conectar ese brief a `storytellingAgent`
4. reducir las instrucciones por edad a guardrails auditables
5. verificar con casos reales de Step 2 que la intencion experta llega hasta el texto final

Si esta fase no se hace, la app seguira teniendo apariencia experta fuerte, pero no garantia suficiente de que esa expertise gobierna el output final.
