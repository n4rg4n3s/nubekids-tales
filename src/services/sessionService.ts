/**
 * sessionService.ts
 *
 * Resuelve quién paga el crédito de un cuento antes de iniciar la generación.
 */

import { supabase } from '../lib/supabase';
import type { PaymentDecision } from '../types';

export interface ResolvePaymentInput {
    tenantId?: string;
    userId?: string;
    isAnonymousB2B: boolean;
}

export async function resolvePayment(
    input: ResolvePaymentInput
): Promise<PaymentDecision> {
    const { tenantId, userId, isAnonymousB2B } = input;

    // ─── Caso 1 y 2: Sesión anónima B2B ───────────────────────────────────
    if (isAnonymousB2B && tenantId) {
        if (!supabase) return { source: 'needs_credits' };

        const { data, error } = await supabase
            .from('credit_accounts')
            .select('balance')
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) {
            console.error('[sessionService] Error consultando créditos del tenant:', error);
            return { source: 'needs_credits' };
        }

        const balance = data?.balance ?? 0;
        return balance > 0
            ? { source: 'tenant', tenantId }
            : { source: 'needs_credits' };
    }

    // ─── Caso 3 y 4: Usuario B2C logueado ────────────────────────────────
    if (userId) {
        if (!supabase) return { source: 'needs_credits' };

        const { data, error } = await supabase
            .from('credit_accounts')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[sessionService] Error consultando créditos del usuario:', error);
            return { source: 'needs_credits' };
        }

        const balance = data?.balance ?? 0;
        return balance > 0
            ? { source: 'user', userId }
            : { source: 'needs_credits' };
    }

    // ─── Caso 5: Nadie puede pagar ────────────────────────────────────────
    return { source: 'needs_credits' };
}