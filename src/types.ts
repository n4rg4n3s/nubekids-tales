// src/types.ts
// NubeKids Platform - Data Models
// Basado en PRP v2.0

// ============================================
// CONSTANTS (PRIMERO - antes de usarlos en interfaces)
// ============================================

export const GENRES = [
  '3D Animation Magic',
  'Classic Fairytale',
  'Anime Adventure',
  'Whimsical Claymation',
  'Custom'
] as const;

export const LANGUAGES = [
  'Español',
  'English',
  'Français',
  'Português',
  'Italiano'
] as const;

export type Genre = typeof GENRES[number];
export type Language = typeof LANGUAGES[number];
export interface BrandColors {
  primary: string;
  accent: string;
  background: string;
}

// ============================================
// AGE GROUP SYSTEM
// ============================================

export type AgeGroup = 'tiny' | 'little' | 'reader';

export interface AgeGroupConfig {
  label: string;
  maxWordsPerPage: number;
  sentenceComplexity: 'simple' | 'medium' | 'rich';
  narrativeStructure: 'linear' | 'simple-arc' | 'complex-arc';
  emotionalDepth: 'basic' | 'secondary' | 'nuanced';
}

export const AGE_GROUP_CONFIGS: Record<AgeGroup, AgeGroupConfig> = {
  tiny: {
    label: "3-4 años",
    maxWordsPerPage: 20,
    sentenceComplexity: 'simple',
    narrativeStructure: 'linear',
    emotionalDepth: 'basic'
  },
  little: {
    label: "5-6 años",
    maxWordsPerPage: 50,
    sentenceComplexity: 'medium',
    narrativeStructure: 'simple-arc',
    emotionalDepth: 'secondary'
  },
  reader: {
    label: "7-10 años",
    maxWordsPerPage: 120,
    sentenceComplexity: 'rich',
    narrativeStructure: 'complex-arc',
    emotionalDepth: 'nuanced'
  },
};

// ============================================
// TENANT & VERTICAL CONFIGURATION
// ============================================

// `verticalId` se mantiene solo como metadato legacy/comercial.
// Ya no debe controlar narrativa, imagen ni copy del wizard.
export type VerticalId = string;
export type ItemInteractionMode = 'generic' | 'wearable' | 'interactive';

// Nivel de integración del tenant
export type IntegrationLevel = 'premium' | 'standard' | 'b2c';

export interface TenantConfig {
  tenantId: string;
  tenantName: string;
  verticalId: VerticalId;
  itemInteractionMode: ItemInteractionMode;

  // Etiqueta breve usada en prompts internos. No debe gobernar la UX del wizard.
  itemLabel: string;
  allowUserEditItem: boolean;

  // Integración de checkout
  integrationLevel: IntegrationLevel;
  storeName?: string;             // Para plan standard - se menciona en el cuento
  injectItemFromCheckout: boolean; // true en premium

  // Branding
  baseSystemPrompt: string;
  brandColors: BrandColors;
  brandLogo?: string;

  // Features
  activeLanguages: Language[];
  activeGenres: Genre[];
  pedagogyEnabled: boolean;
  ragCollections: string[];
}

// ============================================
// PEDAGOGY SYSTEM
// ============================================

export interface PedagogyProfile {
  enabled: boolean;
  behaviorChallenges: string[];
  skillsToReinforce: string[];
  emotionalContext: string[];
  motivations: string[];
  valuesToTransmit: string[];
  freeformContext?: string;
  // Campos "Otro" personalizados por el usuario
  customBehavior?: string;
  customSkill?: string;
  customEmotion?: string;
  customMotivation?: string;
  customValue?: string;
}

// ============================================
// STORY GENERATION
// ============================================

export interface AgentBrief {
  narrativeArc: string;
  storyBeats: Beat[];
  visualDirections: string[];
}

export interface Persona {
  name: string;
  base64: string;
  desc: string;
  itemImageBase64?: string;
  itemDescription?: string;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  visualDirection?: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other';
}

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

// ============================================
// SESSION & STATE
// ============================================

export interface SessionConfig {
  tenantConfig: TenantConfig;
  heroName: string;
  hero: Persona;
  friend?: Persona;
  itemModel: string;
  ageGroup: AgeGroup;
  language: Language;
  genre: Genre;
  pedagogyProfile: PedagogyProfile;
}

export interface StoryState {
  pages: ComicFace[];
  currentPageIndex: number;
  agentBrief?: AgentBrief;
  isGenerating: boolean;
  error?: string;
}

// ============================================
// RAG TYPES
// ============================================

export interface RagChunk {
  id: string;
  collection: string;
  tags: string[];
  summary: string;
  fullContent: string;
  source: string;
}

export interface RagQuery {
  ageGroup: AgeGroup;
  pedagogy: PedagogyProfile;
  collections: string[];
}

// ============================================
// AUTH & USER ROLES
// ============================================

/**
 * ROLES:
 * admin           → Equipo NubeKids. Acceso total.
 * tenant_owner    → Dueño del e-Commerce. Gestiona SU tenant.
 * tenant_member   → Empleado del e-Commerce (futuro V2).
 * b2c_user        → Padre/madre registrado. Compra créditos, genera cuentos.
 * anonymous_session → Usuario temporal vía link B2B. Sin cuenta.
 */
export type UserRole = 'admin' | 'tenant_owner' | 'tenant_member' | 'b2c_user' | 'anonymous_session';

export interface UserProfile {
  id: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  tenantId: string | null;
}

// ============================================
// FASE 10 — FLUJO B2B → B2C
// ============================================

/**
 * Query params B2B demo/testing.
 * El flujo real de cliente final entra por `/?token=...`.
 * Ejemplo demo: /?tenant=wearable-demo-default&demo=1&item=Chaqueta+Brillante&item_image=https://...&customer_email=padre@email.com
 */
export interface B2BSessionParams {
  tenant: string;
  item?: string;
  item_image?: string;
  customer_email?: string;
  ref?: string;
}

/**
 * Estado de sesión anónima B2B que persiste durante todo el flujo.
 * Se construye una vez al montar App.tsx y no cambia.
 */
export interface B2BSession {
  tenantId: string;
  tenantConfig: TenantConfig;
  itemName?: string;
  itemImageBase64?: string;   // Descargada y convertida — se envía a Gemini
  itemImageUrl?: string;      // URL original — fallback si no se pudo convertir a base64
  customerEmail?: string;
  ref?: string;
  storyGenerated: boolean;    // true después de generar el primer (y único) cuento
}

/**
 * Resultado de resolvePayment(): quién paga el crédito del cuento.
 * 'tenant'        → sesión anónima B2B, se consume crédito del tenant
 * 'user'          → usuario B2C logueado con saldo
 * 'needs_credits' → nadie puede pagar (tenant sin saldo, user sin saldo, o sin login)
 */
export type PaymentSource = 'tenant' | 'user' | 'needs_credits';

export interface PaymentDecision {
  source: PaymentSource;
  tenantId?: string;  // presente si source === 'tenant'
  userId?: string;    // presente si source === 'user'
}
