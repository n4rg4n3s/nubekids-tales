/**
 * itemImageLoader.ts
 *
 * Descarga la foto del producto desde una URL externa y la convierte a base64
 * normalizado a JPEG para inyectarla en el wizard (Step 3: Objeto Mágico)
 * y enviarla a Gemini.
 *
 * Estrategia de 3 intentos para manejar CORS:
 *   1. fetch() directo          → la mayoría de CDNs modernos (Shopify, Cloudflare)
 *   2. <img> + <canvas>         → servidores sin headers CORS explícitos
 *   3. URL directa sin base64   → la imagen se muestra pero NO se envía a Gemini
 *      → fallback: el wizard trata el item como Standard (solo descripción textual)
 */

export type ImageLoadMethod = 'fetch' | 'canvas' | 'url-only' | 'failed';

export interface ItemImageResult {
    /** Base64 puro JPEG (sin el prefijo data:...). Null si no se pudo convertir. */
    base64: string | null;
    /** URL original del producto. Siempre presente. */
    url: string;
    /** Método con el que se cargó la imagen. */
    loadMethod: ImageLoadMethod;
    /** Mensaje de error si loadMethod === 'failed'. */
    error?: string;
}

/**
 * Intenta cargar una imagen desde URL externa y convertirla a base64.
 * Nunca lanza excepción — siempre devuelve un ItemImageResult.
 */
export async function loadItemImage(url: string): Promise<ItemImageResult> {
    if (!url || url.trim() === '') {
        return { base64: null, url: '', loadMethod: 'failed', error: 'URL vacía' };
    }

    // ─── Intento 1: fetch() directo ──────────────────────────────────────
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
            const blob = await response.blob();
            const base64 = await blobToJpegBase64(blob);
            console.log('[itemImageLoader] ✅ Cargada via fetch directo');
            return { base64, url, loadMethod: 'fetch' };
        }
    } catch {
        console.warn('[itemImageLoader] fetch directo falló (posible CORS), intentando canvas...');
    }

    // ─── Intento 2: <img> + <canvas> ─────────────────────────────────────
    try {
        const base64 = await loadViaCanvas(url);
        console.log('[itemImageLoader] ✅ Cargada via canvas');
        return { base64, url, loadMethod: 'canvas' };
    } catch {
        console.warn('[itemImageLoader] canvas falló, usando URL directa como fallback...');
    }

    // ─── Intento 3: URL directa (sin base64) ─────────────────────────────
    // La imagen se puede mostrar en el wizard pero no se envía a Gemini.
    // El cuento usa solo la descripción textual del item (como plan Standard).
    console.warn('[itemImageLoader] ⚠️ Solo URL disponible — imagen no enviable a Gemini');
    return { base64: null, url, loadMethod: 'url-only' };
}

// ─── Helpers privados ────────────────────────────────────────────────────

function blobToJpegBase64(blob: Blob): Promise<string> {
    const objectUrl = URL.createObjectURL(blob);

    return loadImageSourceAsJpegBase64(objectUrl, false)
        .finally(() => URL.revokeObjectURL(objectUrl));
}

function loadImageSourceAsJpegBase64(src: string, allowCrossOrigin: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        if (allowCrossOrigin) {
            img.crossOrigin = 'anonymous';
        }

        const timeout = setTimeout(() => {
            reject(new Error('Timeout normalizando imagen'));
        }, 8000);

        img.onload = () => {
            clearTimeout(timeout);

            try {
                const { width, height } = constrainDimensions(
                    img.naturalWidth || 1024,
                    img.naturalHeight || 1024,
                    1024
                );

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener contexto 2D del canvas'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64 = dataUrl.split(',')[1];

                if (!base64) {
                    reject(new Error('Canvas.toDataURL devolvió vacío'));
                    return;
                }

                resolve(base64);
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Error al normalizar imagen'));
        };

        img.src = src;
    });
}

function loadViaCanvas(url: string): Promise<string> {
    return loadImageSourceAsJpegBase64(url, true);
}

function constrainDimensions(
    width: number,
    height: number,
    maxDimension: number
): { width: number; height: number } {
    if (width <= maxDimension && height <= maxDimension) {
        return { width, height };
    }

    const scale = Math.min(maxDimension / width, maxDimension / height);

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}
