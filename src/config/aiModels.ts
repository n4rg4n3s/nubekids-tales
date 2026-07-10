// src/config/aiModels.ts
// FUENTE ÚNICA DE VERDAD para los IDs de modelo de Gemini.
//
// Los modelos cambian de nombre y de precio con frecuencia: NUNCA hardcodear
// un ID en agentes/servicios. Se puede sobrescribir por entorno en Vercel
// (VITE_GEMINI_TEXT_MODEL / VITE_GEMINI_IMAGE_MODEL) sin tocar código.

// Texto (pipeline multiagente): el más barato de la familia 2.5
const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash-lite';

// Imagen: "Nano Banana Lite" — el modelo de imagen más coste-eficiente
const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';

// import.meta.env solo existe bajo Vite; en node (tests) se cae al default.
const env = import.meta.env as Record<string, string | undefined> | undefined;

export const GEMINI_TEXT_MODEL = env?.VITE_GEMINI_TEXT_MODEL || DEFAULT_TEXT_MODEL;
export const GEMINI_IMAGE_MODEL = env?.VITE_GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
