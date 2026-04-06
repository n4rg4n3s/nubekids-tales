/**
 * imageGenerationService.ts
 * Servicio de generación de imágenes con Gemini 3.1 Flash Image Preview
 * 
 * Usa imágenes de referencia (hero, item) para mantener consistencia visual.
 */

import type { GenerateContentResponse, Part } from '@google/genai';
import type { AgentDependencies } from './dependencies';

// ============================================
// TYPES
// ============================================

export interface ImageGenerationInput {
    /** Prompt visual del Visual Brief Agent */
    visualPrompt: string;
    /** Foto del protagonista en base64 (opcional) */
    heroPhoto?: string | null;
    /** Foto del objeto mágico en base64 (opcional) */
    itemImage?: string | null;
    /** Descripción del héroe para el prompt */
    heroDescription?: string;
    /** Índice de página (para logging) */
    pageIndex: number;
}

export interface ImageGenerationResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
    durationMs: number;
}

// ============================================
// CONSTANTS
// ============================================

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const IMAGE_ASPECT_RATIO = '4:5';

// Prefijo para mejorar la calidad de generación
const STYLE_PREFIX = `Children's book illustration, high quality, vibrant colors, safe for children, no text or letters in the image. `;

type GenerateImageResponse = GenerateContentResponse & {
    parts?: Part[];
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Genera una imagen para una página del cuento.
 * Usa referencias de imagen (hero, item) si están disponibles.
 */
export async function generateStoryImage(
    input: ImageGenerationInput,
    deps: AgentDependencies
): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    console.log(`🎨 [ImageGen] Generando imagen para página ${input.pageIndex + 1}...`);

    try {
        // Construir el contenido multimodal
        const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        // 1. Añadir el prompt de texto
        const fullPrompt = buildImagePrompt(input);
        contents.push({ text: fullPrompt });

        // 2. Añadir imagen de referencia del héroe si existe
        if (input.heroPhoto) {
            console.log(`   → Usando foto del héroe como referencia`);
            contents.push({
                inlineData: {
                    mimeType: detectMimeType(input.heroPhoto),
                    data: cleanBase64(input.heroPhoto),
                },
            });
        }

        // 3. Añadir imagen de referencia del objeto mágico si existe
        if (input.itemImage) {
            console.log(`   → Usando foto del objeto mágico como referencia`);
            contents.push({
                inlineData: {
                    mimeType: detectMimeType(input.itemImage),
                    data: cleanBase64(input.itemImage),
                },
            });
        }

        // Llamar al modelo
        const response = await deps.geminiClient.models.generateContent({
            model: IMAGE_MODEL,
            contents: contents,
            config: {
                imageConfig: {
                    aspectRatio: IMAGE_ASPECT_RATIO,
                },
            },
        });

        // Extraer la imagen de la respuesta
        const imageBase64 = extractImageFromResponse(response);

        if (!imageBase64) {
            throw new Error('No se recibió imagen en la respuesta');
        }

        const durationMs = Date.now() - startTime;
        console.log(`   ✅ Imagen generada (${durationMs}ms)`);

        return {
            success: true,
            imageBase64,
            durationMs,
        };

    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`   ❌ Error generando imagen: ${errorMessage}`);

        return {
            success: false,
            error: errorMessage,
            durationMs,
        };
    }
}

/**
 * Genera todas las imágenes del cuento secuencialmente.
 * Retorna un array con los resultados (puede incluir errores).
 */
export async function generateAllImages(
    visualPrompts: string[],
    heroPhoto: string | null,
    itemImage: string | null,
    heroDescription: string | undefined,
    deps: AgentDependencies,
    onProgress?: (pageIndex: number, total: number) => void
): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = [];
    const total = visualPrompts.length;

    console.log(`🎨 [ImageGen] Iniciando generación de ${total} imágenes...`);

    for (let i = 0; i < visualPrompts.length; i++) {
        // Notificar progreso
        onProgress?.(i, total);

        const result = await generateStoryImage(
            {
                visualPrompt: visualPrompts[i],
                heroPhoto,
                itemImage,
                heroDescription,
                pageIndex: i,
            },
            deps
        );

        results.push(result);

        // Pequeña pausa entre generaciones para no saturar la API
        if (i < visualPrompts.length - 1) {
            await sleep(500);
        }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎨 [ImageGen] Generación completada: ${successCount}/${total} exitosas`);

    return results;
}

// ============================================
// HELPERS
// ============================================

/**
 * Construye el prompt final para la generación de imagen.
 */
function buildImagePrompt(input: ImageGenerationInput): string {
    let prompt = `${STYLE_PREFIX}${input.visualPrompt} Compose the illustration in a portrait 4:5 format suitable for a children's book page.`;

    // Si hay referencias, indicar que las use
    if (input.heroPhoto) {
        prompt += ` Use the provided reference image to accurately depict the main character's face and features.`;
    }

    if (input.itemImage) {
        prompt += ` Use the provided reference image of the magical item to accurately depict it in the scene.`;
    }

    return prompt;
}

/**
 * Extrae la imagen base64 de la respuesta de Gemini.
 */
function extractImageFromResponse(response: GenerateImageResponse): string | null {
    try {
        // La respuesta puede tener múltiples partes
        const parts = response.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.data) {
                return part.inlineData.data;
            }
        }

        // Intentar con response.parts directamente (formato alternativo)
        if (response.parts) {
            for (const part of response.parts) {
                if (part.inlineData?.data) {
                    return part.inlineData.data;
                }
            }
        }

        return null;
    } catch (e) {
        console.error('[ImageGen] Error extrayendo imagen:', e);
        return null;
    }
}

/**
 * Detecta el tipo MIME de una imagen base64.
 */
function detectMimeType(base64: string): string {
    if (base64.startsWith('data:')) {
        const match = base64.match(/data:([^;]+);/);
        if (match) return match[1];
    }

    // Detectar por magic bytes
    const clean = cleanBase64(base64);
    if (clean.startsWith('/9j/')) return 'image/jpeg';
    if (clean.startsWith('iVBOR')) return 'image/png';
    if (clean.startsWith('R0lGOD')) return 'image/gif';
    if (clean.startsWith('UklGR')) return 'image/webp';

    // Default a PNG
    return 'image/png';
}

/**
 * Limpia el prefijo data:image/xxx;base64, si existe.
 */
function cleanBase64(base64: string): string {
    if (base64.startsWith('data:')) {
        const commaIndex = base64.indexOf(',');
        if (commaIndex !== -1) {
            return base64.substring(commaIndex + 1);
        }
    }
    return base64;
}

/**
 * Utilidad para pausar entre llamadas.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
