// src/config/pedagogyCatalog.ts
// Catálogo pedagógico — FUENTE ÚNICA DE VERDAD para:
//   · Chips del Paso 2 "El Viaje Interior" (modelo Ancla + Foco)
//   · Rasgos de personalidad del Paso 1 (El Protagonista)
//   · Frases operativas inyectadas en los prompts de los agentes
//   · Query semántica del RAG
//
// Regla de oro: los agentes NUNCA reciben IDs crudos ("tantrums"),
// siempre la frase operativa en español de este catálogo.

import type { FocusCategory, PedagogyAnchor, PedagogyFocus } from '../types';

export interface CatalogOption {
  id: string;
  label: string;
  icon: string;
  /** Frase operativa que se inyecta en los prompts en lugar del id crudo */
  promptPhrase: string;
}

export interface FocusCategoryDef {
  id: FocusCategory;
  label: string;
  icon: string;
  subtitle: string;
  /** Cómo se presenta la categoría dentro del prompt */
  promptLabel: string;
  options: CatalogOption[];
}

// ============================================
// ANCLA — La gran pasión o sueño (el mundo del cuento)
// ============================================

export const PASSION_OPTIONS: CatalogOption[] = [
  { id: 'football', label: 'Fútbol', icon: '⚽', promptPhrase: 'el fútbol: balones, porterías, entrenamientos y partidos emocionantes' },
  { id: 'dance', label: 'Baile', icon: '💃', promptPhrase: 'el baile: música, coreografías, escenarios y moverse con libertad' },
  { id: 'science', label: 'Espacio y ciencia', icon: '🚀', promptPhrase: 'el espacio y la ciencia: cohetes, planetas, experimentos y descubrimientos' },
  { id: 'art', label: 'Arte y pintar', icon: '🖌️', promptPhrase: 'el arte: pinceles, colores, dibujos que cobran vida' },
  { id: 'animals', label: 'Animales', icon: '🦁', promptPhrase: 'los animales: criaturas grandes y pequeñas, cuidarlas y entenderlas' },
  { id: 'music', label: 'Música', icon: '🎵', promptPhrase: 'la música: instrumentos, canciones, ritmos y melodías mágicas' },
  { id: 'cooking', label: 'Cocina', icon: '👨‍🍳', promptPhrase: 'la cocina: recetas, ingredientes, aromas y platos sorprendentes' },
  { id: 'sports', label: 'Deportes', icon: '🏃', promptPhrase: 'el deporte: correr, saltar, superarse y jugar en equipo' },
  { id: 'dinosaurs', label: 'Dinosaurios', icon: '🦕', promptPhrase: 'los dinosaurios: criaturas prehistóricas gigantes y fascinantes' },
  { id: 'fantasy', label: 'Hadas y magia', icon: '🧚', promptPhrase: 'la fantasía: hadas, magia, castillos y mundos encantados' },
  { id: 'superheroes', label: 'Superhéroes', icon: '🦸', promptPhrase: 'los superhéroes: poderes especiales, capas y misiones para ayudar' },
  { id: 'sea', label: 'Mar y piratas', icon: '🌊', promptPhrase: 'el mar: barcos, piratas, islas del tesoro y criaturas marinas' },
  { id: 'vehicles', label: 'Vehículos y máquinas', icon: '🚒', promptPhrase: 'los vehículos y las máquinas: coches, camiones, trenes y cosas que ruedan y vuelan' },
  { id: 'nature', label: 'Naturaleza y explorar', icon: '🌳', promptPhrase: 'la naturaleza: bosques, montañas, ríos y expediciones de exploración' },
  { id: 'stories', label: 'Cuentos e historias', icon: '📚', promptPhrase: 'los cuentos: libros, bibliotecas y mundos que viven en las historias' },
];

// ============================================
// FOCO — Una sola cosa a trabajar (elige categoría → sub-opción)
// ============================================

export const FOCUS_CATEGORIES: FocusCategoryDef[] = [
  {
    id: 'emotion-behavior',
    label: 'Emociones y conducta',
    icon: '🌋',
    subtitle: 'Algo que le cuesta y queréis trabajar',
    promptLabel: 'reto de emoción/conducta',
    options: [
      { id: 'frustration', label: 'Rabietas y frustración', icon: '🌋', promptPhrase: 'tolerar la frustración y aprender a calmarse y pedir ayuda antes de explotar' },
      { id: 'night-fears', label: 'Miedos nocturnos', icon: '🌙', promptPhrase: 'transformar el miedo a la oscuridad y a la noche en sensación de seguridad y calma' },
      { id: 'shyness', label: 'Timidez', icon: '🙈', promptPhrase: 'atreverse a participar, saludar y hablar sin dejar de ser uno mismo' },
      { id: 'sibling-rivalry', label: 'Celos de hermanos', icon: '👶', promptPhrase: 'encontrar su lugar especial y sentirse querido cuando hay que compartir el cariño' },
      { id: 'separation', label: 'Ansiedad de separación', icon: '💛', promptPhrase: 'despedirse con confianza sabiendo que mamá y papá siempre vuelven' },
      { id: 'sharing', label: 'Compartir y turnos', icon: '🤝', promptPhrase: 'descubrir que compartir y esperar el turno multiplica el juego y los amigos' },
      { id: 'eating', label: 'Comer mejor', icon: '🥦', promptPhrase: 'acercarse a la comida con curiosidad y valentía para probar alimentos nuevos' },
      { id: 'sleep-alone', label: 'Dormir solo', icon: '🛏️', promptPhrase: 'convertir su cama y su habitación en su refugio propio de valientes' },
      { id: 'pacifier-diaper', label: 'Dejar chupete / pañal', icon: '🍼', promptPhrase: 'despedirse de una etapa (chupete, pañal) sintiéndose orgulloso de hacerse mayor' },
      { id: 'screens', label: 'Menos pantallas', icon: '📱', promptPhrase: 'redescubrir lo divertido del juego real más allá de las pantallas' },
      { id: 'listening', label: 'Escuchar y respetar límites', icon: '👂', promptPhrase: 'entender que las normas y los límites existen para cuidarnos' },
      { id: 'perfectionism', label: 'Miedo a equivocarse', icon: '🎯', promptPhrase: 'aceptar que equivocarse es parte natural de aprender y de jugar' },
      { id: 'goodbyes', label: 'Las despedidas', icon: '👋', promptPhrase: 'aprender a decir adiós sin pena, confiando en que lo bueno vuelve' },
    ],
  },
  {
    id: 'life-situation',
    label: 'Una situación que vive',
    icon: '🌈',
    subtitle: 'El cuento le ayudará a procesarla',
    promptLabel: 'situación vital a procesar',
    options: [
      { id: 'new-sibling', label: 'Nuevo hermano', icon: '👶', promptPhrase: 'la llegada de un nuevo hermano: hacer sitio al bebé sin perder su lugar especial' },
      { id: 'moving', label: 'Mudanza', icon: '📦', promptPhrase: 'una mudanza: despedirse de un lugar querido y descubrir la ilusión del nuevo hogar' },
      { id: 'new-school', label: 'Cambio de cole / adaptación', icon: '🏫', promptPhrase: 'la adaptación a un colegio nuevo: nuevos amigos, nuevas rutinas, nuevas aventuras' },
      { id: 'loss', label: 'Pérdida de un ser querido', icon: '🌈', promptPhrase: 'la pérdida de un ser querido: el recuerdo cariñoso como forma de seguir queriendo' },
      { id: 'pet-loss', label: 'Pérdida de una mascota', icon: '🐾', promptPhrase: 'la despedida de una mascota querida: gratitud por lo compartido' },
      { id: 'parents-divorce', label: 'Separación de los padres', icon: '💛', promptPhrase: 'la separación de los padres: dos casas, el mismo amor incondicional' },
      { id: 'illness', label: 'Enfermedad u hospital', icon: '🏥', promptPhrase: 'una enfermedad o visita al hospital: valentía serena y confianza en quienes cuidan' },
      { id: 'family-illness', label: 'Enfermedad de un familiar', icon: '❤️‍🩹', promptPhrase: 'la enfermedad de un ser querido: acompañar con cariño y entender los cambios en casa' },
      { id: 'new-pet', label: 'Nueva mascota', icon: '🐕', promptPhrase: 'la llegada de una nueva mascota: responsabilidad, paciencia y un nuevo amigo' },
      { id: 'new-family-member', label: 'Nueva figura en la familia', icon: '👨‍👩‍👧', promptPhrase: 'una nueva figura en la familia: dar tiempo y espacio a un cariño que crece' },
      { id: 'far-family', label: 'Familia lejos / nuevo país', icon: '✈️', promptPhrase: 'vivir lejos de parte de la familia o llegar a un lugar nuevo: los vínculos viajan con nosotros' },
      { id: 'teasing', label: 'Burlas en el cole', icon: '😢', promptPhrase: 'las burlas de otros niños: pedir ayuda, rodearse de buenos amigos y quererse tal como es' },
    ],
  },
  {
    id: 'skill',
    label: 'Una habilidad a potenciar',
    icon: '⭐',
    subtitle: 'El cuento la reforzará en acción',
    promptLabel: 'habilidad a desarrollar',
    options: [
      { id: 'reading', label: 'Amor por la lectura', icon: '📚', promptPhrase: 'el amor por la lectura: los libros como puertas a mundos increíbles' },
      { id: 'autonomy', label: 'Autonomía ("yo solo")', icon: '⭐', promptPhrase: 'la autonomía: atreverse a hacer cosas por sí mismo y disfrutar del logro propio' },
      { id: 'creativity', label: 'Creatividad', icon: '🎨', promptPhrase: 'la creatividad: imaginar soluciones nuevas y expresarse sin miedo' },
      { id: 'problem-solving', label: 'Resolver problemas', icon: '🧩', promptPhrase: 'la resolución de problemas: observar, probar, equivocarse y volver a intentar' },
      { id: 'focus', label: 'Concentración', icon: '🎯', promptPhrase: 'la concentración: sumergirse en una tarea y disfrutar de terminarla' },
      { id: 'patience', label: 'Paciencia y esperar', icon: '🐢', promptPhrase: 'la paciencia: descubrir que algunas cosas maravillosas necesitan su tiempo' },
      { id: 'expressing', label: 'Expresar lo que siente', icon: '🗣️', promptPhrase: 'poner nombre y palabras a lo que siente para que los demás puedan entenderle' },
      { id: 'asking-help', label: 'Pedir ayuda', icon: '🤲', promptPhrase: 'pedir ayuda cuando algo se hace grande: los valientes también piden ayuda' },
      { id: 'teamplay', label: 'Jugar en equipo', icon: '👫', promptPhrase: 'jugar y colaborar en equipo: juntos se llega más lejos' },
      { id: 'curiosity', label: 'Curiosidad científica', icon: '🔬', promptPhrase: 'la curiosidad: hacerse preguntas y explorar cómo funcionan las cosas' },
      { id: 'routines', label: 'Orden y rutinas', icon: '📋', promptPhrase: 'el orden y las rutinas: pequeños hábitos que hacen los días más fáciles' },
      { id: 'body-confidence', label: 'Confianza en su cuerpo', icon: '💪', promptPhrase: 'la confianza en su propio cuerpo: moverse, trepar y saltar con seguridad' },
    ],
  },
  {
    id: 'value',
    label: 'Un valor para toda la vida',
    icon: '💎',
    subtitle: 'El mensaje central del cuento',
    promptLabel: 'valor a transmitir',
    options: [
      { id: 'empathy', label: 'Empatía', icon: '❤️', promptPhrase: 'la empatía: ponerse en el lugar del otro y actuar con cariño' },
      { id: 'perseverance', label: 'Perseverancia', icon: '💪', promptPhrase: 'la perseverancia: volver a intentarlo aunque cueste' },
      { id: 'honesty', label: 'Honestidad', icon: '✨', promptPhrase: 'la honestidad: decir la verdad aunque sea difícil, y sentirse ligero al hacerlo' },
      { id: 'respect', label: 'Respeto y diversidad', icon: '🌍', promptPhrase: 'el respeto: cada persona es distinta y eso hace el mundo más rico' },
      { id: 'courage', label: 'Valentía', icon: '🦁', promptPhrase: 'la valentía: actuar a pesar del miedo, paso a paso' },
      { id: 'gratitude', label: 'Gratitud', icon: '🙏', promptPhrase: 'la gratitud: darse cuenta de lo bueno y saber decir gracias' },
      { id: 'teamwork', label: 'Trabajo en equipo', icon: '🤜🤛', promptPhrase: 'el trabajo en equipo: sumar manos y talentos para lograr lo imposible' },
      { id: 'self-love', label: 'Amor propio', icon: '💖', promptPhrase: 'el amor propio: gustarse y cuidarse tal y como uno es' },
      { id: 'generosity', label: 'Generosidad', icon: '🎁', promptPhrase: 'la generosidad: la alegría de dar y de compartir lo que uno tiene' },
      { id: 'eco-care', label: 'Cuidar la naturaleza', icon: '🌱', promptPhrase: 'el cuidado de la naturaleza: proteger plantas, animales y el planeta' },
      { id: 'friendship', label: 'Amistad', icon: '🤗', promptPhrase: 'la amistad: cuidar a los amigos y estar ahí cuando importa' },
      { id: 'responsibility', label: 'Responsabilidad', icon: '🔑', promptPhrase: 'la responsabilidad: cumplir lo prometido y cuidar lo que se nos confía' },
    ],
  },
];

// ============================================
// MODULADOR — Personalidad del protagonista (Paso 1)
// ============================================

export const PERSONALITY_TRAITS: CatalogOption[] = [
  { id: 'sensitive', label: 'Sensible', icon: '🌸', promptPhrase: 'sensible: siente las emociones con intensidad y se conmueve con facilidad' },
  { id: 'energetic', label: 'Movido y enérgico', icon: '⚡', promptPhrase: 'enérgico: siempre en movimiento, le cuesta parar quieto' },
  { id: 'cautious', label: 'Cauto y prudente', icon: '🐢', promptPhrase: 'cauto: observa antes de actuar y necesita su tiempo para lanzarse' },
  { id: 'dreamer', label: 'Soñador', icon: '☁️', promptPhrase: 'soñador: se pierde en su imaginación y en sus mundos inventados' },
  { id: 'chatty', label: 'Charlatán', icon: '🗣️', promptPhrase: 'charlatán: habla sin parar y pregunta por todo' },
  { id: 'observer', label: 'Observador', icon: '🔍', promptPhrase: 'observador: se fija en los detalles que otros no ven' },
  { id: 'leader', label: 'Le gusta liderar', icon: '👑', promptPhrase: 'con iniciativa: le gusta proponer los juegos y guiar al grupo' },
  { id: 'shy-starter', label: 'Tímido al principio', icon: '🐭', promptPhrase: 'tímido al principio: necesita calentar motores antes de soltarse' },
  { id: 'joker', label: 'Payasete de la casa', icon: '😂', promptPhrase: 'divertido: le encanta hacer reír a los demás' },
];

export const MAX_PERSONALITY_TRAITS = 2;

// ============================================
// HELPERS — resolución id → frase operativa
// ============================================

export const CUSTOM_OPTION_ID = 'custom';

export function getFocusCategory(categoryId: FocusCategory): FocusCategoryDef | undefined {
  return FOCUS_CATEGORIES.find((category) => category.id === categoryId);
}

export function getFocusOption(
  categoryId: FocusCategory,
  optionId: string
): CatalogOption | undefined {
  return getFocusCategory(categoryId)?.options.find((option) => option.id === optionId);
}

export function getPassionOption(optionId: string): CatalogOption | undefined {
  return PASSION_OPTIONS.find((option) => option.id === optionId);
}

export function getValueOption(optionId: string): CatalogOption | undefined {
  return getFocusOption('value', optionId);
}

/** Frase operativa del ancla (pasión). Custom del usuario tiene prioridad. */
export function resolveAnchorPhrase(anchor: PedagogyAnchor | null | undefined): string | null {
  if (!anchor) return null;
  if (anchor.id === CUSTOM_OPTION_ID) return anchor.custom?.trim() || null;
  return getPassionOption(anchor.id)?.promptPhrase ?? anchor.id;
}

/** Label visible del ancla, para resúmenes de UI. */
export function resolveAnchorLabel(anchor: PedagogyAnchor | null | undefined): string | null {
  if (!anchor) return null;
  if (anchor.id === CUSTOM_OPTION_ID) return anchor.custom?.trim() || null;
  return getPassionOption(anchor.id)?.label ?? anchor.id;
}

export interface ResolvedFocus {
  categoryLabel: string;
  promptLabel: string;
  phrase: string;
  nuance?: string;
}

/** Frase operativa del foco. Custom del usuario tiene prioridad. */
export function resolveFocus(focus: PedagogyFocus | null | undefined): ResolvedFocus | null {
  if (!focus) return null;

  const category = getFocusCategory(focus.category);
  if (!category) return null;

  const phrase = focus.id === CUSTOM_OPTION_ID
    ? focus.custom?.trim() || ''
    : getFocusOption(focus.category, focus.id)?.promptPhrase ?? focus.id;

  if (!phrase) return null;

  return {
    categoryLabel: category.label,
    promptLabel: category.promptLabel,
    phrase,
    nuance: focus.nuance?.trim() || undefined,
  };
}

/** Label visible del foco, para resúmenes de UI. */
export function resolveFocusLabel(focus: PedagogyFocus | null | undefined): string | null {
  if (!focus) return null;
  if (focus.id === CUSTOM_OPTION_ID) return focus.custom?.trim() || null;
  return getFocusOption(focus.category, focus.id)?.label ?? null;
}

/** Frase operativa del valor de refuerzo. */
export function resolveReinforcementPhrase(valueId: string | null | undefined): string | null {
  if (!valueId?.trim()) return null;
  return getValueOption(valueId)?.promptPhrase ?? valueId.trim();
}

/** Label visible del valor de refuerzo, para resúmenes de UI. */
export function resolveReinforcementLabel(valueId: string | null | undefined): string | null {
  if (!valueId?.trim()) return null;
  return getValueOption(valueId)?.label ?? valueId.trim();
}

/** Frases operativas de los rasgos de personalidad seleccionados. */
export function resolvePersonalityPhrases(traitIds: string[] | null | undefined): string[] {
  if (!traitIds?.length) return [];
  return traitIds
    .map((id) => PERSONALITY_TRAITS.find((trait) => trait.id === id)?.promptPhrase ?? id)
    .filter(Boolean);
}
