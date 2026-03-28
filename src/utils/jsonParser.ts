/**
 * jsonParser.ts
 * Parsing robusto de JSON desde respuestas de Gemini.
 * Gemini NUNCA devuelve JSON limpio - siempre hay markdown, espacios, etc.
 */

/**
 * Parsea JSON de forma segura desde respuestas de Gemini.
 * Maneja markdown fences, espacios extra, y extrae JSON embebido.
 */
export function parseJsonSafely<T>(response: string): T {
    // 1. Strip markdown fences
    let clean = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // 2. Intentar parse directo
    try {
        return JSON.parse(clean);
    } catch {
        // 3. Intentar extraer objeto JSON con regex
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                // Continuar al siguiente intento
            }
        }

        // 4. Intentar extraer array JSON
        const arrayMatch = clean.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            } catch {
                // Continuar
            }
        }

        // 5. Log y throw
        console.error('[jsonParser] Parse failed. Original response:', response);
        console.error('[jsonParser] Cleaned response:', clean);
        throw new Error('No valid JSON found in response');
    }
}

/**
 * Valida que un objeto tenga las propiedades requeridas.
 * Lanza error si falta alguna propiedad.
 */
export function validateRequired<T extends object>(
    obj: T,
    requiredKeys: (keyof T)[]
): void {
    for (const key of requiredKeys) {
        if (obj[key] === undefined || obj[key] === null) {
            throw new Error(`Missing required field: ${String(key)}`);
        }
    }
}

/**
 * Intenta parsear JSON, retorna null si falla (no lanza error).
 * Útil para casos donde el JSON es opcional.
 */
export function tryParseJson<T>(response: string): T | null {
    try {
        return parseJsonSafely<T>(response);
    } catch {
        return null;
    }
}
