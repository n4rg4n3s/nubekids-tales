// src/services/tokenService.ts
import type {
  BrandColors,
  IntegrationLevel,
  ItemInteractionMode,
  TenantConfig,
} from '../types';
import { buildTenantConfigFromRuntimeTenant } from '../config/tenantConfigFactory';
import { inferItemInteractionModeFromLegacy } from '../utils/itemInteraction';

async function getSupabaseClient() {
  const { supabase } = await import('../lib/supabase');
  return supabase;
}

export type TokenErrorCode =
  | 'not_found'
  | 'already_used'
  | 'expired'
  | 'tenant_not_found'
  | 'no_credits'
  | 'service_unavailable'
  | 'connection_error';

export interface TokenData {
  id: string;
  token: string;
  tenantId: string;
  brandName: string;
  itemImageUrl?: string;
  itemName?: string;
  customerEmail?: string;
  isUsed: boolean;
  expiresAt?: string;
}

export interface TenantData {
  id: string;
  tenantId: string;
  name: string;
  brandName: string;
  integrationLevel: IntegrationLevel;
  verticalId: string | null;
  itemInteractionMode: ItemInteractionMode;
  itemLabel: string | null;
  brandColors: BrandColors;
  pedagogyEnabled: boolean;
  tokensTotal: number;
  tokensUsed: number;
}

export interface ValidateTokenResult {
  valid: boolean;
  code?: TokenErrorCode;
  error?: string;
  token?: TokenData;
  tenant?: TenantData;
  tenantConfig?: TenantConfig;
}

export interface ConsumeB2BTokenResult {
  success: boolean;
  code?: TokenErrorCode | 'consumed';
  error?: string;
}

/**
 * Validates a token from URL and returns tenant + token data
 */
export async function validateToken(tokenCode: string): Promise<ValidateTokenResult> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return {
      valid: false,
      code: 'service_unavailable',
      error: 'Servicio no disponible (Supabase no configurado)',
    };
  }

  try {
    // La tabla tokens ya no es legible desde el cliente (seguridad).
    // La validación exige conocer el token exacto vía RPC SECURITY DEFINER.
    const { data: validation, error: tokenError } = await supabase
      .rpc('validate_b2b_token', { p_token: tokenCode });

    if (tokenError || !validation) {
      console.error('Error validating token via RPC:', tokenError);
      return { valid: false, code: 'connection_error', error: 'Error de conexión' };
    }

    if (validation.valid !== true) {
      const code = (validation.code as TokenErrorCode) || 'not_found';
      const errorMessages: Partial<Record<TokenErrorCode, string>> = {
        not_found: 'Token no válido o no encontrado',
        already_used: 'Este enlace ya ha sido utilizado',
        expired: 'Este enlace ha expirado',
      };
      return { valid: false, code, error: errorMessages[code] || 'Token no válido' };
    }

    const tokenRow = validation.token as {
      id: string;
      token: string;
      tenant_id: string;
      brand_name: string | null;
      item_image_url: string | null;
      item_name: string | null;
      customer_email: string | null;
      is_used: boolean;
      expires_at: string | null;
    };

    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select(
        'id, tenant_id, name, brand_name, integration_level, vertical_id, item_label, brand_colors, pedagogy_enabled, tokens_total, tokens_used, item_interaction_mode'
      )
      .eq('id', tokenRow.tenant_id)
      .single();

    if (tenantError || !tenantRow) {
      return { valid: false, code: 'tenant_not_found', error: 'Tenant no encontrado' };
    }

    const { data: creditAccount, error: creditError } = await supabase
      .from('credit_accounts')
      .select('balance')
      .eq('tenant_id', tenantRow.tenant_id)
      .maybeSingle();

    if (creditError) {
      console.error('Error checking tenant credit balance:', creditError);
      return { valid: false, code: 'connection_error', error: 'Error de conexión' };
    }

    if ((creditAccount?.balance ?? 0) < 1) {
      return {
        valid: false,
        code: 'no_credits',
        error: 'El establecimiento no tiene créditos disponibles',
      };
    }

    const tenantData: TenantData = {
      id: tenantRow.id,
      tenantId: tenantRow.tenant_id,
      name: tenantRow.name,
      brandName: tenantRow.brand_name,
      integrationLevel: normalizeIntegrationLevel(tenantRow.integration_level),
      verticalId: tenantRow.vertical_id ?? null,
      itemInteractionMode:
        normalizeRuntimeMode(tenantRow.item_interaction_mode) ??
        inferItemInteractionModeFromLegacy(tenantRow.vertical_id, tenantRow.item_label),
      itemLabel: tenantRow.item_label ?? null,
      brandColors: normalizeBrandColors(tenantRow.brand_colors),
      pedagogyEnabled: tenantRow.pedagogy_enabled ?? true,
      tokensTotal: tenantRow.tokens_total,
      tokensUsed: tenantRow.tokens_used,
    };

    return {
      valid: true,
      token: {
        id: tokenRow.id,
        token: tokenRow.token,
        tenantId: tokenRow.tenant_id,
        brandName: tokenRow.brand_name || tenantRow.brand_name,
        itemImageUrl: tokenRow.item_image_url ?? undefined,
        itemName: tokenRow.item_name ?? undefined,
        customerEmail: tokenRow.customer_email ?? undefined,
        isUsed: tokenRow.is_used,
        expiresAt: tokenRow.expires_at ?? undefined,
      },
      tenant: tenantData,
      tenantConfig: buildTenantConfigFromRuntimeTenant(tenantData),
    };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, code: 'connection_error', error: 'Error de conexión' };
  }
}

/**
 * Consume de forma atómica 1 token B2B one-time + 1 crédito del tenant.
 */
export async function consumeB2BToken(
  tokenCode: string,
  storySessionId?: string
): Promise<ConsumeB2BTokenResult> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      code: 'service_unavailable',
      error: 'Servicio no disponible (Supabase no configurado)',
    };
  }

  try {
    const { data, error } = await supabase.rpc('consume_b2b_token', {
      p_token: tokenCode,
      p_story_session_id: storySessionId ?? null,
    });

    if (error) {
      console.error('Error consuming B2B token:', error);
      return {
        success: false,
        code: 'connection_error',
        error: 'Error de conexión al consumir el token',
      };
    }

    return {
      success: data?.success === true,
      code: data?.code,
      error: data?.error,
    };
  } catch (error) {
    console.error('Error consuming B2B token:', error);
    return {
      success: false,
      code: 'connection_error',
      error: 'Error de conexión al consumir el token',
    };
  }
}

/**
 * Get token code from URL
 */
export function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

function normalizeIntegrationLevel(level: unknown): IntegrationLevel {
  if (level === 'premium' || level === 'standard' || level === 'b2c') {
    return level;
  }

  return 'standard';
}

function normalizeRuntimeMode(value: unknown): ItemInteractionMode | null {
  if (value === 'generic' || value === 'wearable' || value === 'interactive') {
    return value;
  }

  return null;
}

function normalizeBrandColors(value: unknown): BrandColors {
  const colors = value as Partial<BrandColors> | null | undefined;

  return {
    primary: colors?.primary || '#8B5CF6',
    accent: colors?.accent || '#FBBF24',
    background: colors?.background || '#FDFBF7',
  };
}
