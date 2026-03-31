import { useState, useEffect, useCallback } from 'react';
import { getBalance } from '../services/creditService';

interface UseCreditsReturn {
    balance: number;
    loading: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook que expone el saldo de créditos del usuario o tenant activo.
 * Se refresca automáticamente al cambiar tenantId o userId.
 */
export function useCredits(
    tenantId?: string,
    userId?: string
): UseCreditsReturn {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const refresh = useCallback(async () => {
        if (!tenantId && !userId) {
            setBalance(0);
            return;
        }
        setLoading(true);
        try {
            const b = await getBalance(tenantId, userId);
            setBalance(b);
        } catch (err) {
            console.error('useCredits: error fetching balance', err);
            setBalance(0);
        } finally {
            setLoading(false);
        }
    }, [tenantId, userId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { balance, loading, refresh };
}