// src/services/tokenService.ts
import { supabase } from '../lib/supabase';

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
  integrationLevel: 'premium' | 'standard' | 'b2c';
  verticalId: string;
  itemLabel: string;
  brandColors: {
    primary: string;
    accent: string;
    background: string;
  };
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
  if (!supabase) {
    return {
      valid: false,
      code: 'service_unavailable',
      error: 'Servicio no disponible (Supabase no configurado)',
    };
  }

  try {
    const { data: tokenRow, error: tokenError } = await supabase
      .from('tokens')
      .select('id, token, tenant_id, brand_name, item_image_url, item_name, customer_email, is_used, expires_at')
      .eq('token', tokenCode)
      .single();

    if (tokenError || !tokenRow) {
      return { valid: false, code: 'not_found', error: 'Token no válido o no encontrado' };
    }

    if (tokenRow.is_used) {
      return { valid: false, code: 'already_used', error: 'Este enlace ya ha sido utilizado' };
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return { valid: false, code: 'expired', error: 'Este enlace ha expirado' };
    }

    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
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

    return {
      valid: true,
      token: {
        id: tokenRow.id,
        token: tokenRow.token,
        tenantId: tokenRow.tenant_id,
        brandName: tokenRow.brand_name || tenantRow.brand_name,
        itemImageUrl: tokenRow.item_image_url,
        itemName: tokenRow.item_name,
        customerEmail: tokenRow.customer_email,
        isUsed: tokenRow.is_used,
        expiresAt: tokenRow.expires_at,
      },
      tenant: {
        id: tenantRow.id,
        tenantId: tenantRow.tenant_id,
        name: tenantRow.name,
        brandName: tenantRow.brand_name,
        integrationLevel: tenantRow.integration_level,
        verticalId: tenantRow.vertical_id,
        itemLabel: tenantRow.item_label,
        brandColors: tenantRow.brand_colors,
        pedagogyEnabled: tenantRow.pedagogy_enabled,
        tokensTotal: tenantRow.tokens_total,
        tokensUsed: tenantRow.tokens_used,
      },
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
