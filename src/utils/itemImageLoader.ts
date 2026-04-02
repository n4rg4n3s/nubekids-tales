/**
 * itemImageLoader.ts
 *
 * Descarga la foto del producto desde una URL externa y la convierte a base64
 * para inyectarla en el wizard (Step 3: Objeto Mágico) y enviarla a Gemini.
 *
 * Estrategia de 3 intentos para manejar CORS:
 *   1. fetch() directo          → la mayoría de CDNs modernos (Shopify, Cloudflare)
 *   2. <img> + <canvas>         → servidores sin headers CORS explícitos
 *   3. URL directa sin base64   → la imagen se muestra pero NO se envía a Gemini
 *      → fallback: el wizard trata el item como Standard (solo descripción textual)
 */

export type ImageLoadMethod = 'fetch' | 'canvas' | 'url-only' | 'failed';

export interface ItemImageResult {
    /** Base64 puro (sin el prefijo data:...). Null si no se pudo convertir. */
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
            const base64 = await blobToBase64(blob);
            console.log('[itemImageLoader] ✅ Cargada via fetch directo');
            return { base64, url, loadMethod: 'fetch' };
        }
    } catch (_e) {
        console.warn('[itemImageLoader] fetch directo falló (posible CORS), intentando canvas...');
    }

    // ─── Intento 2: <img> + <canvas> ─────────────────────────────────────
    try {
        const base64 = await loadViaCanvas(url);
        console.log('[itemImageLoader] ✅ Cargada via canvas');
        return { base64, url, loadMethod: 'canvas' };
    } catch (_e) {
        console.warn('[itemImageLoader] canvas falló, usando URL directa como fallback...');
    }

    // ─── Intento 3: URL directa (sin base64) ─────────────────────────────
    // La imagen se puede mostrar en el wizard pero no se envía a Gemini.
    // El cuento usa solo la descripción textual del item (como plan Standard).
    console.warn('[itemImageLoader] ⚠️ Solo URL disponible — imagen no enviable a Gemini');
    return { base64: null, url, loadMethod: 'url-only' };
}

// ─── Helpers privados ────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Extraer solo la parte base64, sin el prefijo "data:image/jpeg;base64,"
            const base64 = result.split(',')[1];
            if (!base64) {
                reject(new Error('No se pudo extraer base64 del blob'));
                return;
            }
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
    });
}

function loadViaCanvas(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timeout = setTimeout(() => {
            reject(new Error('Timeout cargando imagen en canvas'));
        }, 8000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || 512;
                canvas.height = img.naturalHeight || 512;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener contexto 2D del canvas'));
                    return;
                }

                ctx.drawImage(img, 0, 0);
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
            reject(new Error('Error al cargar imagen en elemento <img>'));
        };

        img.src = url;
    });
}