import {
    GENRES,
    LANGUAGES,
    type BrandColors,
    type Genre,
    type IntegrationLevel,
    type ItemInteractionMode,
    type Language,
    type TenantConfig,
} from '../types';
import {
    buildItemInteractionBaseSystemPrompt,
    getItemInteractionPromptLabel,
    inferItemInteractionModeFromLegacy,
} from '../utils/itemInteraction';

const DEFAULT_BRAND_COLORS: BrandColors = {
    primary: '#8B5CF6',
    accent: '#FBBF24',
    background: '#FDFBF7',
};

const DEFAULT_RAG_COLLECTIONS = ['child-psych', 'storytelling'];

interface TenantConfigInput {
    tenantId: string;
    tenantName: string;
    verticalId?: string;
    itemInteractionMode: ItemInteractionMode;
    integrationLevel: IntegrationLevel;
    storeName?: string;
    injectItemFromCheckout?: boolean;
    brandColors?: Partial<BrandColors> | null;
    brandLogo?: string;
    itemLabel?: string;
    allowUserEditItem?: boolean;
    activeLanguages?: Language[];
    activeGenres?: Genre[];
    pedagogyEnabled?: boolean;
    ragCollections?: string[];
}

export interface RuntimeTenantSource {
    tenantId: string;
    tenantName?: string | null;
    brandName?: string | null;
    integrationLevel?: string | null;
    verticalId?: string | null;
    itemInteractionMode?: ItemInteractionMode | null;
    itemLabel?: string | null;
    brandColors?: Partial<BrandColors> | null;
    pedagogyEnabled?: boolean | null;
}

export function createTenantConfig(input: TenantConfigInput): TenantConfig {
    return {
        tenantId: input.tenantId,
        tenantName: input.tenantName,
        verticalId: input.verticalId ?? input.tenantId,
        itemInteractionMode: input.itemInteractionMode,
        itemLabel: input.itemLabel ?? getItemInteractionPromptLabel(input.itemInteractionMode),
        allowUserEditItem: input.allowUserEditItem ?? true,
        integrationLevel: input.integrationLevel,
        storeName: input.storeName,
        injectItemFromCheckout:
            input.injectItemFromCheckout ?? input.integrationLevel === 'premium',
        baseSystemPrompt: buildItemInteractionBaseSystemPrompt(input.itemInteractionMode),
        brandColors: resolveBrandColors(input.brandColors),
        brandLogo: input.brandLogo,
        activeLanguages: input.activeLanguages ?? [...LANGUAGES],
        activeGenres: input.activeGenres ?? [...GENRES],
        pedagogyEnabled: input.pedagogyEnabled ?? true,
        ragCollections: input.ragCollections ?? [...DEFAULT_RAG_COLLECTIONS],
    };
}

export function buildTenantConfigFromRuntimeTenant(
    source: RuntimeTenantSource
): TenantConfig {
    const itemInteractionMode =
        source.itemInteractionMode ??
        inferItemInteractionModeFromLegacy(source.verticalId, source.itemLabel);
    const integrationLevel = normalizeIntegrationLevel(source.integrationLevel);
    const tenantName = source.brandName || source.tenantName || source.tenantId;

    return createTenantConfig({
        tenantId: source.tenantId,
        tenantName,
        verticalId: source.verticalId ?? source.tenantId,
        itemInteractionMode,
        integrationLevel,
        storeName: integrationLevel === 'b2c' ? undefined : tenantName,
        injectItemFromCheckout: integrationLevel === 'premium',
        brandColors: source.brandColors,
        pedagogyEnabled: source.pedagogyEnabled ?? true,
    });
}

function resolveBrandColors(colors?: Partial<BrandColors> | null): BrandColors {
    return {
        primary: colors?.primary || DEFAULT_BRAND_COLORS.primary,
        accent: colors?.accent || DEFAULT_BRAND_COLORS.accent,
        background: colors?.background || DEFAULT_BRAND_COLORS.background,
    };
}

function normalizeIntegrationLevel(level?: string | null): IntegrationLevel {
    if (level === 'premium' || level === 'standard' || level === 'b2c') {
        return level;
    }

    return 'standard';
}
