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
    const clean = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    const candidates = buildJsonCandidates(clean);

    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate) as T;
        } catch {
            // Intentar reparar respuestas "casi JSON"
            const repaired = repairCommonJsonIssues(candidate);
            try {
                return JSON.parse(repaired) as T;
            } catch {
                // Continuar con el siguiente candidato
            }
        }
    }

    console.error('[jsonParser] Parse failed. Original response:', response);
    console.error('[jsonParser] Cleaned response:', clean);
    throw new Error('No valid JSON found in response');
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

function buildJsonCandidates(clean: string): string[] {
    const candidates = new Set<string>();

    if (clean) {
        candidates.add(clean);
    }

    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        candidates.add(objectMatch[0]);
    }

    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        candidates.add(arrayMatch[0]);
    }

    return Array.from(candidates);
}

function repairCommonJsonIssues(input: string): string {
    let repaired = input
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

    repaired = repairPseudoObjectArrays(repaired);
    repaired = escapeInnerQuotes(repaired);

    return repaired;
}

function repairPseudoObjectArrays(input: string): string {
    let repaired = input;

    const fieldNames = ['keyMoments'];

    for (const fieldName of fieldNames) {
        const pattern = new RegExp(`("${fieldName}"\\s*:\\s*)\\[([\\s\\S]*?)\\]`, 'g');

        repaired = repaired.replace(pattern, (match, prefix, body) => {
            const trimmedBody = String(body).trim();

            if (!looksLikePseudoObjectBody(trimmedBody)) {
                return match;
            }

            return `${prefix}{${trimmedBody}}`;
        });
    }

    return repaired;
}

function looksLikePseudoObjectBody(body: string): boolean {
    if (!body) {
        return false;
    }

    return /^"(?:\\.|[^"\\])+"\s*:/.test(body);
}

function escapeInnerQuotes(input: string): string {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (!inString) {
            if (char === '"') {
                inString = true;
            }
            result += char;
            continue;
        }

        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            result += char;
            escaped = true;
            continue;
        }

        if (char === '"') {
            const nextMeaningful = findNextMeaningfulChar(input, i + 1);
            const isClosingQuote =
                nextMeaningful === null ||
                nextMeaningful === ',' ||
                nextMeaningful === '}' ||
                nextMeaningful === ']' ||
                nextMeaningful === ':';

            if (isClosingQuote) {
                inString = false;
                result += char;
            } else {
                result += '\\"';
            }

            continue;
        }

        result += char;
    }

    return result;
}

function findNextMeaningfulChar(input: string, startIndex: number): string | null {
    for (let i = startIndex; i < input.length; i++) {
        const char = input[i];
        if (!/\s/.test(char)) {
            return char;
        }
    }

    return null;
}
