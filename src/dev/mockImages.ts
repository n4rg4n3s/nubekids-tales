// src/dev/mockImages.ts
// Imágenes placeholder para modo desarrollo

/**
 * URLs de imágenes placeholder de alta calidad.
 * Usamos Unsplash/Picsum para imágenes gratuitas que simulan ilustraciones.
 */
export const MOCK_IMAGE_URLS: string[] = [
    'https://picsum.photos/seed/page1/800/600',
    'https://picsum.photos/seed/page2/800/600',
    'https://picsum.photos/seed/page3/800/600',
    'https://picsum.photos/seed/page4/800/600',
    'https://picsum.photos/seed/page5/800/600',
    'https://picsum.photos/seed/page6/800/600',
    'https://picsum.photos/seed/page7/800/600',
    'https://picsum.photos/seed/page8/800/600',
    'https://picsum.photos/seed/page9/800/600',
    'https://picsum.photos/seed/page10/800/600',
];

/**
 * Genera un color de fondo degradado como placeholder si las URLs no cargan.
 */
export function getPlaceholderGradient(pageIndex: number): string {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
        'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)',
    ];
    return gradients[pageIndex % gradients.length];
}

/**
 * Simula la generación de imágenes con delay.
 */
export async function getMockImages(
    count: number,
    delayMs: number = 300,
    onProgress?: (current: number, total: number) => void
): Promise<string[]> {
    const images: string[] = [];

    for (let i = 0; i < count; i++) {
        onProgress?.(i + 1, count);

        // Simular delay de generación
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Usar URL de placeholder
        images.push(MOCK_IMAGE_URLS[i % MOCK_IMAGE_URLS.length]);
    }

    return images;
}