import { useCredits } from '../../hooks/useCredits';

interface CreditBalanceProps {
    tenantId?: string;
    userId?: string;
}

/**
 * Badge que muestra el saldo de créditos en el header.
 * Se oculta si no hay tenantId ni userId (usuario anónimo B2B).
 */
export function CreditBalance({ tenantId, userId }: CreditBalanceProps) {
    const { balance, loading } = useCredits(tenantId, userId);

    // No mostrar para sesiones anónimas (flujo B2B sin cuenta)
    if (!tenantId && !userId) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-lg leading-none">✨</span>
            {loading ? (
                <span className="text-sm font-bold text-gray-400">...</span>
            ) : (
                <span className="text-sm font-bold text-black">
                    {balance} {balance === 1 ? 'cuento' : 'cuentos'}
                </span>
            )}
        </div>
    );
}