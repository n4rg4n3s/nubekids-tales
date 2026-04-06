import type { ItemInteractionMode } from '../types';

export interface ItemInteractionStepCopy {
    stepTitle: string;
    stepSubtitle: string;
    uploadLabel: string;
    uploadPrompt: string;
    descriptionLabel: string;
    noPhotoHint: string;
    emptyStateHint: string;
}

export function getItemInteractionModeInstruction(mode: ItemInteractionMode): string {
    switch (mode) {
        case 'wearable':
            return 'El objeto mágico es wearable: el protagonista lo lleva puesto o integrado en su vestimenta, y la magia debe sentirse unida a esa forma de uso.';
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
            return `${heroName} wearing a magical ${itemLabel} that glows softly and guides the action of the scene.`;
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
            return 'Ej: Una chaqueta con brillo suave, unas zapatillas con alas pequeñas o una gorra con detalles de estrellas...';
        case 'interactive':
            return 'Ej: Un cochecito con luces, un peluche aventurero o un robot con botones brillantes...';
        case 'generic':
        default:
            return 'Ej: Una mochila roja con alas de dragón, unos patines brillantes o un objeto muy especial para el protagonista...';
    }
}

export function getItemInteractionPromptLabel(mode: ItemInteractionMode): string {
    switch (mode) {
        case 'wearable':
            return 'prenda o accesorio';
        case 'interactive':
            return 'objeto de juego';
        case 'generic':
        default:
            return 'objeto especial';
    }
}

export function getItemInteractionStepCopy(mode: ItemInteractionMode): ItemInteractionStepCopy {
    switch (mode) {
        case 'wearable':
            return {
                stepTitle: 'La pieza mágica',
                stepSubtitle: 'La prenda o accesorio que el protagonista llevará puesto durante la aventura.',
                uploadLabel: 'Foto de la pieza',
                uploadPrompt: 'Sube una foto de la prenda o accesorio',
                descriptionLabel: 'Descripción de la pieza',
                noPhotoHint: 'Sin foto no pasa nada. Describe la prenda o accesorio y lo integraremos con naturalidad en el cuento.',
                emptyStateHint: 'Puedes continuar sin foto. Si lo prefieres, bastará con describir bien la pieza mágica.',
            };
        case 'interactive':
            return {
                stepTitle: 'El objeto mágico en acción',
                stepSubtitle: 'El objeto que el protagonista usará, activará o manipulará durante la historia.',
                uploadLabel: 'Foto del objeto',
                uploadPrompt: 'Sube una foto del objeto o juguete',
                descriptionLabel: 'Descripción del objeto',
                noPhotoHint: 'Sin foto no pasa nada. Describe el objeto y contaremos cómo se usa dentro de la aventura.',
                emptyStateHint: 'Puedes continuar sin foto. Con una buena descripción, el objeto mágico seguirá formando parte del cuento.',
            };
        case 'generic':
        default:
            return {
                stepTitle: 'El objeto mágico',
                stepSubtitle: 'El objeto especial que acompañará al protagonista en los momentos clave del cuento.',
                uploadLabel: 'Foto del objeto',
                uploadPrompt: 'Sube una foto del objeto',
                descriptionLabel: 'Descripción del objeto',
                noPhotoHint: 'Sin foto no pasa nada. Describe el objeto y lo incorporaremos a la aventura con coherencia.',
                emptyStateHint: 'Puedes continuar sin foto. Si lo prefieres, la historia usará solo la descripción del objeto mágico.',
            };
    }
}

export function buildItemInteractionBaseSystemPrompt(mode: ItemInteractionMode): string {
    return `
Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
Tu misión es crear cuentos infantiles donde un elemento mágico del protagonista tenga un papel central en la resolución de la aventura.
${getItemInteractionModeInstruction(mode)}
Reglas absolutas:
- Contenido 100% positivo, sin violencia, sin temas oscuros.
- El elemento mágico SIEMPRE tiene un papel activo en la resolución del problema.
- Adapta el cuento al grupo de edad indicado.
`.trim();
}

export function inferItemInteractionModeFromLegacy(
    verticalId?: string | null,
    itemLabel?: string | null
): ItemInteractionMode {
    const normalizedVertical = (verticalId || '').trim().toLowerCase();
    const normalizedLabel = (itemLabel || '').trim().toLowerCase();

    if (
        normalizedVertical.includes('shoe') ||
        normalizedVertical.includes('fashion') ||
        normalizedLabel.includes('prenda') ||
        normalizedLabel.includes('ropa') ||
        normalizedLabel.includes('zapato') ||
        normalizedLabel.includes('zapat') ||
        normalizedLabel.includes('gorra') ||
        normalizedLabel.includes('sombrero') ||
        normalizedLabel.includes('chaqueta') ||
        normalizedLabel.includes('abrigo')
    ) {
        return 'wearable';
    }

    if (
        normalizedVertical.includes('toy') ||
        normalizedVertical.includes('interactive') ||
        normalizedLabel.includes('juguet') ||
        normalizedLabel.includes('peluch') ||
        normalizedLabel.includes('muñec') ||
        normalizedLabel.includes('munec') ||
        normalizedLabel.includes('robot') ||
        normalizedLabel.includes('coche') ||
        normalizedLabel.includes('vehiculo') ||
        normalizedLabel.includes('vehículo')
    ) {
        return 'interactive';
    }

    return 'generic';
}
