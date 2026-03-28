// src/config/tenants/direct-b2c.config.ts
import type { TenantConfig } from '../../types';

export const directB2cConfig: TenantConfig = {
  tenantId: 'direct-b2c',
  tenantName: 'NubeKids Stories',
  verticalId: 'direct-b2c',
  
  // Configuración del objeto mágico
  itemLabel: 'objeto',
  itemLabelSingular: 'El Objeto Mágico',
  itemPlaceholderText: 'Ej: Una mochila roja con alas de dragón, unos patines brillantes...',
  allowUserEditItem: true,
  
  // Integración de checkout - B2C no tiene integración de tienda
  integrationLevel: 'b2c',
  storeName: undefined,          // No hay tienda
  injectItemFromCheckout: false,
  
  // Branding
  baseSystemPrompt: `
    Eres un equipo de expertos en neuroeducación, psicología infantil y escritura creativa.
    Tu misión es crear cuentos infantiles donde un OBJETO ESPECIAL del protagonista tiene poderes mágicos.
    El objeto es el elemento central de resolución de conflictos en cada aventura.
    Reglas absolutas:
    - Contenido 100% positivo, sin violencia, sin temas oscuros.
    - El objeto SIEMPRE tiene un papel activo en la resolución del problema.
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
