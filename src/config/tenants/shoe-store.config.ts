// src/config/tenants/shoe-store.config.ts
import type { TenantConfig } from '../../types';

export const shoeStoreConfig: TenantConfig = {
  tenantId: 'shoe-store-default',
  tenantName: 'Magic Sneakers',
  verticalId: 'shoe-store',
  
  // Configuración del objeto mágico
  itemLabel: 'zapatos',
  itemLabelSingular: 'Los Sneakers Mágicos',
  itemPlaceholderText: 'Ej: Nike Air Max 90 Kids, color rojo con rayas blancas',
  allowUserEditItem: true,
  
  // Integración de checkout
  integrationLevel: 'standard',  // Puede ser 'premium' si el tenant tiene integración técnica
  storeName: 'Magic Sneakers',   // Se menciona en el cuento
  injectItemFromCheckout: false, // true en plan premium
  
  // Branding
  baseSystemPrompt: `
    Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
    Tu misión es crear cuentos infantiles donde los ZAPATOS del protagonista tienen poderes mágicos.
    Los zapatos son el elemento central de resolución de conflictos en cada aventura.
    Reglas absolutas:
    - Contenido 100% positivo, sin violencia, sin temas oscuros.
    - Los zapatos SIEMPRE tienen un papel activo en la resolución del problema.
    - Adapta al grupo de edad indicado.
  `,
  brandColors: {
    primary: '#8B5CF6',
    accent: '#FBBF24',
    background: '#FDFBF7'
  },
  brandLogo: undefined,
  
  // Features
  activeLanguages: ['Español', 'English', 'Français', 'Português', 'Italiano'],
  activeGenres: ['3D Animation Magic', 'Classic Fairytale', 'Anime Adventure', 'Whimsical Claymation', 'Custom'],
  pedagogyEnabled: true,
  ragCollections: ['neuro-dev', 'child-psych', 'storytelling'],
};
