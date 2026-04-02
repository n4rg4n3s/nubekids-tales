/**
 * sessionService.ts
 *
 * Resuelve quién paga el crédito de un cuento antes de iniciar la generación.
 *
 * Reglas (en orden de prioridad):
 *   1. Sesión anónima B2B + tenant con saldo  → source: 'tenant'
 *   2. Sesión anónima B2B + tenant sin saldo  → source: 'needs_credits'
 *   3. Usuario B2C logueado + con saldo       → source: 'user'
 *   4. Usuario B2C logueado + sin saldo       → source: 'needs_credits'
 *   5. Ni tenant ni user                      → source: 'needs_credits'
 */

import { supabase } from '../lib/supabase';
import type { PaymentDecision } from '../types';

export interface ResolvePaymentInput {
    /** ID del tenant B2B (ej: 'zapatos-lopez-001'). Presente solo en sesión anónima. */
    tenantId?: string;
    /** UUID del usuario autenticado. Presente solo en sesión B2C logueada. */
    userId?: string;
    /** true si el usuario llegó via ?tenant= y no está logueado */
    isAnonymousB2B: boolean;
}

export async function resolvePayment(
    input: ResolvePaymentInput
): Promise<PaymentDecision> {
    const { tenantId, userId, isAnonymousB2B } = input;

    // ─── Caso 1 y 2: Sesión anónima B2B ───────────────────────────────────
    if (isAnonymousB2B && tenantId) {
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

        if (balance > 0) {
            return { source: 'tenant', tenantId };
        } else {
            return { source: 'needs_credits' };
        }
    }

    // ─── Caso 3 y 4: Usuario B2C logueado ────────────────────────────────
    if (userId) {
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

        if (balance > 0) {
            return { source: 'user', userId };
        } else {
            return { source: 'needs_credits' };
        }
    }

    // ─── Caso 5: Nadie puede pagar ────────────────────────────────────────
    return { source: 'needs_credits' };
}