import { supabase } from '../lib/supabase';

export interface CreditPack {
    id: string;
    name: string;
    description: string | null;
    channel: 'b2b_standard' | 'b2b_premium' | 'b2c';
    credits: number;
    price_cents: number;
    currency: string;
    stripe_price_id: string | null;
    is_active: boolean;
    sort_order: number;
}

/**
 * Consulta el saldo de créditos de un tenant o usuario B2C.
 */
export async function getBalance(
    tenantId?: string,
    userId?: string
): Promise<number> {
    if (!supabase) return 0;

    let query = supabase.from('credit_accounts').select('balance');

    if (tenantId) {
        query = query.eq('tenant_id', tenantId);
    } else if (userId) {
        query = query.eq('user_id', userId);
    } else {
        return 0;
    }

    const { data, error } = await query.maybeSingle();
    console.log('🔍 credit_accounts query → data:', data, 'error:', error);
    if (!data) return 0;
    return data.balance;
}

/**
 * Intenta consumir 1 crédito ANTES de generar un cuento.
 * Retorna true si había saldo y se descontó, false si no hay créditos.
 */
export async function consumeCredit(
    tenantId?: string,
    userId?: string,
    storySessionId?: string
): Promise<boolean> {
    if (!supabase) {
        console.warn('creditService: supabase no disponible, saltando consumo de crédito');
        return true; // En dev sin Supabase, dejamos pasar
    }

    const { data, error } = await supabase.rpc('consume_credit', {
        p_tenant_id: tenantId ?? null,
        p_user_id: userId ?? null,
        p_story_session_id: storySessionId ?? null,
    });

    if (error) {
        console.error('Error consuming credit:', error);
        return false;
    }

    return data === true;
}

/**
 * Obtiene el catálogo de packs disponibles para un canal.
 */
export async function getCreditPacks(
    channel: 'b2b_standard' | 'b2b_premium' | 'b2c'
): Promise<CreditPack[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('credit_packs')
        .select('*')
        .eq('channel', channel)
        .eq('is_active', true)
        .order('sort_order');

    if (error) {
        console.error('Error fetching credit packs:', error);
        return [];
    }

    return data as CreditPack[];
}