// src/dev/mockConfig.ts
// Configuración del modo desarrollo

export const DEV_CONFIG = {
    /**
     * Si true, usa datos mock en lugar de llamar a Gemini.
     * Cambia a false para probar el flujo real.
     */
    USE_MOCK_DATA: true,

    /**
     * Delay simulado para cargar imágenes mock (ms).
     * Útil para probar estados de loading.
     */
    MOCK_IMAGE_DELAY_MS: 300,

    /**
     * Delay simulado para el orchestrator mock (ms).
     */
    MOCK_ORCHESTRATOR_DELAY_MS: 1500,

    /**
     * Número de páginas cuando USE_MOCK_DATA = false.
     * Reducir para pruebas rápidas del flujo real.
     */
    REAL_MODE_PAGES: 3, // Cambiar a 10 para producción
};

/**
 * Helper para verificar si estamos en modo mock.
 */
export function isDevMockMode(): boolean {
    return import.meta.env.DEV && DEV_CONFIG.USE_MOCK_DATA;
}