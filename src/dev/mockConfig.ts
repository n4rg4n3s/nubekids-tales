// src/dev/mockConfig.ts
// Configuración de modo desarrollo vs producción
// 
// USO:
//   Modo mock (desarrollo): VITE_USE_MOCK=true en .env.local (o sin variable)
//   Modo real (producción): VITE_USE_MOCK=false en .env.local
//
// Si no existe la variable, por defecto es TRUE (modo seguro/desarrollo)

// ============================================================================
// CONFIGURACIÓN PRINCIPAL
// ============================================================================

/**
 * Lee la variable de entorno VITE_USE_MOCK
 * - en desarrollo: "true" o ausente → modo mock
 * - en producción: solo "true" activa mock de forma explícita
 */
const USE_MOCK_DATA = import.meta.env.DEV
  ? import.meta.env.VITE_USE_MOCK !== 'false'
  : import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Objeto de configuración de desarrollo
 * Compatible con las importaciones existentes
 */
export const DEV_CONFIG = {
  /** Si true, usa datos mock sin llamar a Gemini */
  USE_MOCK_DATA,
  
  /** Número de páginas a generar en modo real */
  REAL_MODE_PAGES: 10,
  
  /** Delay simulado para imágenes mock (ms) */
  MOCK_IMAGE_DELAY_MS: 300,
};

/**
 * Helper para verificar si estamos en modo mock
 */
export function isDevMockMode(): boolean {
  return DEV_CONFIG.USE_MOCK_DATA;
}

/**
 * Log del modo actual al iniciar la app
 * Llamar desde App.tsx o main.tsx
 */
export function logMockStatus(): void {
  if (DEV_CONFIG.USE_MOCK_DATA) {
    console.log('🎭 MODO DESARROLLO — Datos mock activos — Sin llamadas a Gemini');
  } else {
    console.log('🚀 MODO PRODUCCIÓN — Generación real con Gemini API');
  }
}

