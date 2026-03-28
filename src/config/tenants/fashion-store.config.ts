// src/config/tenants/fashion-store.config.ts
import type { TenantConfig } from '../../types';

export const fashionStoreConfig: TenantConfig = {
  tenantId: 'fashion-store-default',
  tenantName: 'Magic Wardrobe',
  verticalId: 'fashion-store',
  
  // Configuración del objeto mágico
  itemLabel: 'prenda',
  itemLabelSingular: 'La Prenda Mágica',
  itemPlaceholderText: 'Ej: Abrigo azul marino con capucha de estrellitas',
  allowUserEditItem: true,
  
  // Integración de checkout
  integrationLevel: 'standard',  // Puede ser 'premium' si el tenant tiene integración técnica
  storeName: 'Magic Wardrobe',   // Se menciona en el cuento
  injectItemFromCheckout: false, // true en plan premium
  
  // Branding
  baseSystemPrompt: `
    Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
    Tu misión es crear cuentos infantiles donde una PRENDA DE ROPA del protagonista tiene poderes mágicos.
    La prenda es el elemento central de resolución de conflictos en cada aventura.
    Reglas absolutas:
    - Contenido 100% positivo, sin violencia, sin temas oscuros.
    - La prenda SIEMPRE tiene un papel activo en la resolución del problema.
    - Adapta al grupo de edad indicado.
  `,
  brandColors: {
    primary: '#EC4899',
    accent: '#F59E0B',
    background: '#FFF9F9'
  },
  brandLogo: undefined,
  
  // Features
  activeLanguages: ['Español', 'English', 'Français', 'Português', 'Italiano'],
  activeGenres: ['3D Animation Magic', 'Classic Fairytale', 'Anime Adventure', 'Whimsical Claymation', 'Custom'],
  pedagogyEnabled: true,
  ragCollections: ['neuro-dev', 'child-psych', 'storytelling'],
};
