import { useEffect, useState } from 'react';
import { getCreditPacks } from '../../services/creditService';
import type { CreditPack } from '../../services/creditService';
import { redirectToCheckout } from '../../services/stripeService';
import type { CreditPackId } from '../../services/stripeService';

type B2BPlan = 'standard' | 'premium';

interface BuyCreditsB2BProps {
    tenantId?: string;
    defaultPlan?: B2BPlan;
    onClose?: () => void;
}

interface PlanConfig {
    id: B2BPlan;
    title: string;
    subtitle: string;
    badge: string;
    accentColor: string;
    buttonColor: string;
    note: string;
    channel: 'b2b_standard' | 'b2b_premium';
    bullets: string[];
}

const PLAN_CONFIGS: PlanConfig[] = [
    {
        id: 'standard',
        title: 'Plan Standard',
        subtitle: 'URL personalizada para tu email o página de gracias.',
        badge: 'Sin integración técnica',
        accentColor: '#38BDF8',
        buttonColor: '#1E293B',
        note: 'Ideal para lanzar rápido y validar que el incentivo aumenta tus ventas.',
        channel: 'b2b_standard',
        bullets: [
            'Tu tienda aparece integrada en la historia.',
            'Implementación por link: copiar y pegar.',
            'Mejor coste por lanzamiento inicial.',
        ],
    },
    {
        id: 'premium',
        title: 'Plan Premium',
        subtitle: 'El producto real del checkout se convierte en el objeto mágico del cuento.',
        badge: 'Más inmersivo',
        accentColor: '#8B5CF6',
        buttonColor: '#FBBF24',
        note: 'Pensado para marcas que quieren una experiencia más memorable y visual.',
        channel: 'b2b_premium',
        bullets: [
            'El producto comprado aparece en las ilustraciones.',
            'Mayor valor percibido en cada entrega.',
            'Requiere inyectar nombre e imagen del producto.',
        ],
    },
];

export default function BuyCreditsB2B({
    tenantId,
    defaultPlan = 'standard',
    onClose,
}: BuyCreditsB2BProps) {
    const [standardPacks, setStandardPacks] = useState<CreditPack[]>([]);
    const [premiumPacks, setPremiumPacks] = useState<CreditPack[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<B2BPlan>(defaultPlan);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedPlan(defaultPlan);
    }, [defaultPlan]);

    useEffect(() => {
        let mounted = true;

        async function loadPacks() {
            try {
                const [standard, premium] = await Promise.all([
                    getCreditPacks('b2b_standard'),
                    getCreditPacks('b2b_premium'),
                ]);

                if (!mounted) return;
                setStandardPacks(standard);
                setPremiumPacks(premium);
            } catch {
                if (!mounted) return;
                setError('No se pudieron cargar los packs B2B. Inténtalo de nuevo.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void loadPacks();
        return () => {
            mounted = false;
        };
    }, []);

    async function handleBuy(pack: CreditPack) {
        if (!tenantId) {
            setError('Para completar una compra B2B necesitas entrar con un tenant activo.');
            return;
        }

        setError(null);
        setPaying(pack.id);

        try {
            await redirectToCheckout({
                packId: pack.id as CreditPackId,
                tenantId,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar el pago');
            setPaying(null);
        }
    }

    function formatPrice(cents: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(cents / 100);
    }

    function pricePerStory(pack: CreditPack): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        }).format(pack.price_cents / 100 / pack.credits);
    }

    function normalizePackLabel(packId: string): string {
        if (packId.includes('starter')) return 'Starter';
        if (packId.includes('growth')) return 'Growth';
        if (packId.includes('scale')) return 'Scale';
        return 'Pack';
    }

    function renderPlan(plan: PlanConfig, packs: CreditPack[]) {
        const featuredPackId = plan.id === 'standard' ? 'b2b-std-growth' : 'b2b-prm-growth';
        const isSelected = selectedPlan === plan.id;

        return (
            <section
                key={plan.id}
                className="rounded-[28px] p-6 sm:p-8 transition-all duration-150"
                style={{
                    backgroundColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.72)',
                    border: '3px solid #1E293B',
                    boxShadow: isSelected ? '8px 8px 0px #1E293B' : '6px 6px 0px #1E293B',
                    transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                }}
            >
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <div
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs mb-3"
                            style={{
                                backgroundColor: plan.accentColor,
                                color: '#1E293B',
                                border: '2px solid #1E293B',
                                fontFamily: "'Fredoka', sans-serif",
                                letterSpacing: '0.02em',
                            }}
                        >
                            {plan.badge}
                        </div>
                        <h2
                            className="text-3xl mb-2"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: '#1E293B',
                            }}
                        >
                            {plan.title}
                        </h2>
                        <p
                            className="text-sm leading-relaxed"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                color: 'rgba(30,41,59,0.72)',
                            }}
                        >
                            {plan.subtitle}
                        </p>
                    </div>

                    <button
                        onClick={() => setSelectedPlan(plan.id)}
                        className="shrink-0 rounded-full px-3 py-2 text-xs transition-all duration-100"
                        style={{
                            fontFamily: "'Fredoka', sans-serif",
                            color: '#1E293B',
                            backgroundColor: isSelected ? plan.accentColor : '#FDFBF7',
                            border: '2px solid #1E293B',
                            boxShadow: '2px 2px 0px #1E293B',
                        }}
                    >
                        {isSelected ? 'Plan activo' : 'Ver este plan'}
                    </button>
                </div>

                <div className="grid gap-2 mb-6">
                    {plan.bullets.map((bullet) => (
                        <div
                            key={bullet}
                            className="rounded-2xl px-4 py-3 text-sm"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                backgroundColor: '#FDFBF7',
                                border: '2px solid #1E293B',
                                color: '#1E293B',
                            }}
                        >
                            {bullet}
                        </div>
                    ))}
                </div>

                <div className="grid gap-4">
                    {packs.map((pack) => {
                        const isFeaturedPack = pack.id === featuredPackId;
                        const isProcessing = paying === pack.id;

                        return (
                            <article
                                key={pack.id}
                                className="relative rounded-3xl p-5 transition-all duration-150"
                                style={{
                                    backgroundColor: isFeaturedPack ? plan.accentColor : '#ffffff',
                                    border: '3px solid #1E293B',
                                    boxShadow: '5px 5px 0px #1E293B',
                                }}
                            >
                                {isFeaturedPack && (
                                    <div
                                        className="absolute -top-4 left-6 rounded-full px-4 py-1 text-xs"
                                        style={{
                                            backgroundColor: '#FBBF24',
                                            border: '2px solid #1E293B',
                                            boxShadow: '2px 2px 0px #1E293B',
                                            fontFamily: "'Fredoka', sans-serif",
                                            color: '#1E293B',
                                        }}
                                    >
                                        ★ Recomendado
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p
                                            className="text-sm mb-1"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                color: isFeaturedPack ? 'rgba(30,41,59,0.72)' : 'rgba(30,41,59,0.55)',
                                            }}
                                        >
                                            {normalizePackLabel(pack.id)}
                                        </p>
                                        <h3
                                            className="text-3xl mb-1"
                                            style={{
                                                fontFamily: "'Fredoka', sans-serif",
                                                color: '#1E293B',
                                            }}
                                        >
                                            {pack.credits} cuentos
                                        </h3>
                                        <p
                                            className="text-sm"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                color: 'rgba(30,41,59,0.65)',
                                            }}
                                        >
                                            {pricePerStory(pack)} por cuento
                                        </p>
                                    </div>

                                    <div className="sm:text-right">
                                        <p
                                            className="text-3xl mb-1"
                                            style={{
                                                fontFamily: "'Fredoka', sans-serif",
                                                color: '#1E293B',
                                            }}
                                        >
                                            {formatPrice(pack.price_cents)}
                                        </p>
                                        <p
                                            className="text-xs mb-4"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                color: 'rgba(30,41,59,0.55)',
                                            }}
                                        >
                                            Pago único. Créditos sin caducidad.
                                        </p>

                                        <button
                                            onClick={() => handleBuy(pack)}
                                            disabled={!!paying || !tenantId}
                                            className="min-w-[188px] rounded-2xl px-5 py-3 text-sm transition-all duration-100"
                                            style={{
                                                fontFamily: "'Fredoka', sans-serif",
                                                letterSpacing: '0.02em',
                                                backgroundColor: plan.buttonColor,
                                                color: plan.buttonColor === '#FBBF24' ? '#1E293B' : '#ffffff',
                                                border: '3px solid #1E293B',
                                                boxShadow: isProcessing ? '1px 1px 0px #1E293B' : '4px 4px 0px #1E293B',
                                                transform: isProcessing ? 'translate(3px, 3px)' : 'translate(0, 0)',
                                                opacity: paying && !isProcessing ? 0.55 : (!tenantId ? 0.55 : 1),
                                                cursor: paying || !tenantId ? 'not-allowed' : 'pointer',
                                            }}
                                            onMouseEnter={e => {
                                                if (!paying && tenantId) {
                                                    e.currentTarget.style.boxShadow = '2px 2px 0px #1E293B';
                                                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!paying && tenantId) {
                                                    e.currentTarget.style.boxShadow = '4px 4px 0px #1E293B';
                                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                                }
                                            }}
                                        >
                                            {isProcessing
                                                ? 'Redirigiendo...'
                                                : tenantId
                                                    ? 'Comprar este pack'
                                                    : 'Tenant requerido'}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <p
                    className="mt-5 text-sm leading-relaxed"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'rgba(30,41,59,0.64)',
                    }}
                >
                    {plan.note}
                </p>
            </section>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FDFBF7' }}>
                <div className="text-center">
                    <div className="text-5xl mb-4" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                        ✨
                    </div>
                    <p style={{ color: '#1E293B', fontFamily: "'DM Sans', sans-serif", opacity: 0.55 }}>
                        Preparando los packs para tu tienda...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen px-4 py-10 sm:px-6"
            style={{
                background: 'linear-gradient(180deg, #FDFBF7 0%, #F7F1FF 48%, #EEF8FF 100%)',
            }}
        >
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 rounded-[32px] p-7 sm:p-10" style={{
                    backgroundColor: '#ffffff',
                    border: '3px solid #1E293B',
                    boxShadow: '8px 8px 0px #1E293B',
                }}>
                    <div className="max-w-3xl">
                        <div
                            className="inline-flex items-center rounded-full px-4 py-2 text-xs mb-4"
                            style={{
                                backgroundColor: '#FBBF24',
                                border: '2px solid #1E293B',
                                boxShadow: '2px 2px 0px #1E293B',
                                fontFamily: "'Fredoka', sans-serif",
                                color: '#1E293B',
                            }}
                        >
                            Packs B2B para e-Commerce
                        </div>

                        <h1
                            className="text-4xl sm:text-5xl mb-4"
                            style={{
                                fontFamily: "'Fredoka', sans-serif",
                                color: '#1E293B',
                                lineHeight: 1.05,
                            }}
                        >
                            Recarga los cuentos de tu tienda sin contratos ni permanencias
                        </h1>

                        <p
                            className="text-base sm:text-lg leading-relaxed"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                color: 'rgba(30,41,59,0.7)',
                            }}
                        >
                            Elige si quieres lanzar rápido con Standard o ofrecer una experiencia más inmersiva con Premium.
                            Cada crédito equivale a un cuento real entregado tras una compra.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <div
                            className="rounded-2xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: '#FDFBF7',
                                border: '2px solid #1E293B',
                                fontFamily: "'DM Sans', sans-serif",
                                color: '#1E293B',
                            }}
                        >
                            ✨ 6 packs activos sincronizados con Stripe
                        </div>
                        <div
                            className="rounded-2xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: '#FDFBF7',
                                border: '2px solid #1E293B',
                                fontFamily: "'DM Sans', sans-serif",
                                color: '#1E293B',
                            }}
                        >
                            ♾️ Créditos prepago sin caducidad
                        </div>
                        <div
                            className="rounded-2xl px-4 py-3 text-sm"
                            style={{
                                backgroundColor: '#FDFBF7',
                                border: '2px solid #1E293B',
                                fontFamily: "'DM Sans', sans-serif",
                                color: '#1E293B',
                            }}
                        >
                            🔒 Pago seguro con Stripe Checkout
                        </div>
                    </div>
                </header>

                {!tenantId && (
                    <div
                        className="mb-8 rounded-2xl px-5 py-4"
                        style={{
                            backgroundColor: '#fff8dc',
                            border: '3px solid #1E293B',
                            boxShadow: '5px 5px 0px #1E293B',
                            fontFamily: "'DM Sans', sans-serif",
                            color: '#1E293B',
                        }}
                    >
                        Esta vista muestra el catálogo B2B, pero para pagar necesitamos un `tenantId` activo.
                        Entra desde tu panel o accede con la URL asignada a tu tenant.
                    </div>
                )}

                {error && (
                    <div
                        className="mb-8 rounded-2xl px-5 py-4"
                        style={{
                            backgroundColor: '#fff0f0',
                            border: '3px solid #1E293B',
                            boxShadow: '5px 5px 0px #1E293B',
                            fontFamily: "'DM Sans', sans-serif",
                            color: '#1E293B',
                        }}
                    >
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {renderPlan(PLAN_CONFIGS[0], standardPacks)}
                    {renderPlan(PLAN_CONFIGS[1], premiumPacks)}
                </div>

                <div
                    className="mt-8 rounded-[28px] p-6 sm:p-7"
                    style={{
                        backgroundColor: '#ffffff',
                        border: '3px solid #1E293B',
                        boxShadow: '6px 6px 0px #1E293B',
                    }}
                >
                    <h3
                        className="text-2xl mb-3"
                        style={{
                            fontFamily: "'Fredoka', sans-serif",
                            color: '#1E293B',
                        }}
                    >
                        ¿Qué plan encaja mejor?
                    </h3>
                    <p
                        className="text-sm sm:text-base leading-relaxed"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: 'rgba(30,41,59,0.72)',
                        }}
                    >
                        Standard es la opción más rápida para activar el incentivo desde email o página de confirmación.
                        Premium añade el producto real a la historia y encaja mejor si ya controlas tu checkout o quieres
                        una experiencia más diferencial.
                    </p>
                </div>

                {onClose && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.95rem',
                                color: '#1E293B',
                                opacity: 0.6,
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Volver
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
