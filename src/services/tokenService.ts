// src/services/tokenService.ts
import { supabase } from '../lib/supabase';

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
  error?: string;
  token?: TokenData;
  tenant?: TenantData;
}

/**
 * Validates a token from URL and returns tenant + token data
 */
export async function validateToken(tokenCode: string): Promise<ValidateTokenResult> {
  if (!supabase) {
    return { valid: false, error: 'Servicio no disponible (Supabase no configurado)' };
  }

  try {
    const { data: tokenRow, error: tokenError } = await supabase
      .from('tokens')
      .select('id, token, tenant_id, brand_name, item_image_url, item_name, customer_email, is_used, expires_at')
      .eq('token', tokenCode)
      .single();

    if (tokenError || !tokenRow) {
      return { valid: false, error: 'Token no válido o no encontrado' };
    }

    if (tokenRow.is_used) {
      return { valid: false, error: 'Este enlace ya ha sido utilizado' };
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return { valid: false, error: 'Este enlace ha expirado' };
    }

    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tokenRow.tenant_id)
      .single();

    if (tenantError || !tenantRow) {
      return { valid: false, error: 'Tenant no encontrado' };
    }

    if (tenantRow.tokens_used >= tenantRow.tokens_total) {
      return { valid: false, error: 'El establecimiento no tiene créditos disponibles' };
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
    return { valid: false, error: 'Error de conexión' };
  }
}

/**
 * Marks a token as used (call this when story generation starts)
 */
export async function consumeToken(tokenId: string): Promise<boolean> {
  if (!supabase) {
    console.error('Cannot consume token: Supabase not configured');
    return false;
  }

  try {
    const { error: tokenError } = await supabase
      .from('tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', tokenId);

    if (tokenError) {
      console.error('Error consuming token:', tokenError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error consuming token:', error);
    return false;
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