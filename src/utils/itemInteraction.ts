import type { ItemInteractionMode } from '../types';

export function getItemInteractionModeInstruction(mode: ItemInteractionMode): string {
    switch (mode) {
        case 'wearable':
            return 'El objeto mágico es wearable: el protagonista lo lleva puesto y la magia debe integrarse en esa forma de uso.';
        case 'interactive':
            return 'El objeto mágico no se lleva puesto: el protagonista lo sostiene, activa, manipula o usa de forma visible durante la historia.';
        case 'generic':
        default:
            return 'El objeto mágico puede acompañar al protagonista, ir en sus manos o aparecer junto a él; no asumas automáticamente que se lleva puesto.';
    }
}

export function getItemInteractionVisualGuidance(
    mode: ItemInteractionMode,
    itemLabel: string
): string {
    switch (mode) {
        case 'wearable':
            return `${itemLabel} debe verse puesto o integrado en la vestimenta del protagonista cuando sea relevante.`;
        case 'interactive':
            return `${itemLabel} debe verse en uso activo, en las manos o muy cerca del protagonista, nunca como una prenda.`;
        case 'generic':
        default:
            return `No asumas que ${itemLabel} se lleva puesto; muéstralo junto al protagonista de la forma más natural para la escena.`;
    }
}

export function getItemInteractionPromptExample(
    mode: ItemInteractionMode,
    heroName: string,
    itemLabel: string
): string {
    switch (mode) {
        case 'wearable':
            return `${heroName} wearing magical ${itemLabel} that glow softly and guide the action of the scene.`;
        case 'interactive':
            return `${heroName} holding and actively using a magical ${itemLabel} that sparks with visible energy.`;
        case 'generic':
        default:
            return `${heroName} beside a magical ${itemLabel} that feels clearly connected to the action of the scene.`;
    }
}

export function getItemDescriptionFallbackPlaceholder(mode: ItemInteractionMode): string {
    switch (mode) {
        case 'wearable':
            return 'Ej: Una prenda o accesorio suave, de colores brillantes, con detalles especiales que el niño lleva puesto...';
        case 'interactive':
            return 'Ej: Un juguete con ruedas, botones luminosos o piezas curiosas con las que el niño juega...';
        case 'generic':
        default:
            return 'Ej: Una mochila roja con alas de dragón, unos patines brillantes o un objeto muy especial para el protagonista...';
    }
}
