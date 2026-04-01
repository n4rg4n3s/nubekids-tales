/**
 * BuyCredits.tsx
 * Pantalla de compra de créditos — diseño NubeKids Design System.
 *
 * Uso en B2C:  <BuyCredits channel="b2c" userId={user.id} />
 * Uso en B2B:  <BuyCredits channel="b2b_standard" tenantId={tenantId} />
 *              <BuyCredits channel="b2b_premium"  tenantId={tenantId} />
 */

import { useState, useEffect } from 'react';
import { getCreditPacks } from '../../services/creditService';
import { redirectToCheckout } from '../../services/stripeService';
import type { CreditPackId } from '../../services/stripeService';

interface CreditPack {
    id: string;
    name: string;
    description: string | null;
    channel: string;
    credits: number;
    price_cents: number;
    stripe_price_id: string;
}

interface BuyCreditsProps {
    channel: 'b2c' | 'b2b_standard' | 'b2b_premium';
    userId?: string;
    tenantId?: string;
    onClose?: () => void;
}

export default function BuyCredits({ channel, userId, tenantId, onClose }: BuyCreditsProps) {
    const [packs, setPacks] = useState<CreditPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getCreditPacks(channel)
            .then(data => setPacks(data as CreditPack[]))
            .catch(() => setError('No se pudieron cargar los packs. Inténtalo de nuevo.'))
            .finally(() => setLoading(false));
    }, [channel]);

    async function handleBuy(pack: CreditPack) {
        setError(null);
        setPaying(pack.id);
        try {
            await redirectToCheckout({
                packId: pack.id as CreditPackId,
                userId: userId,
                tenantId: tenantId,
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

    const featuredIndex = Math.floor(packs.length / 2);

    // ── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: '#FDFBF7' }}
            >
                <div className="text-center">
                    <div
                        className="text-5xl mb-4"
                        style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                    >
                        ✨
                    </div>
                    <p style={{ color: '#1E293B', fontFamily: 'Nunito, sans-serif', opacity: 0.5 }}>
                        Preparando la magia...
                    </p>
                </div>
            </div>
        );
    }

    // ── Main ─────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen py-12 px-4"
            style={{ backgroundColor: '#FDFBF7' }}
        >
            <div className="max-w-3xl mx-auto">

                {/* ── Cabecera ── */}
                <div className="text-center mb-10">
                    <h1
                        className="text-4xl mb-3"
                        style={{
                            fontFamily: 'Fredoka One, cursive',
                            color: '#1E293B',
                            letterSpacing: '0.01em',
                        }}
                    >
                        {channel === 'b2c'
                            ? '✨ La historia que tu hijo necesita'
                            : '✨ Recarga tus cuentos NubeKids'}
                    </h1>
                    <p
                        style={{
                            fontFamily: 'Nunito, sans-serif',
                            color: '#1E293B',
                            opacity: 0.55,
                            fontSize: '1rem',
                        }}
                    >
                        {channel === 'b2c'
                            ? 'Diseñada para lo que está viviendo ahora mismo. Con él como protagonista.'
                            : 'Créditos prepago sin caducidad. Úsalos a tu ritmo.'}
                    </p>
                </div>

                {/* ── Error global ── */}
                {error && (
                    <div
                        className="mb-8 p-4 rounded-xl text-center text-sm"
                        style={{
                            border: '2px solid #1E293B',
                            backgroundColor: '#fff0f0',
                            fontFamily: 'Nunito, sans-serif',
                            color: '#1E293B',
                            boxShadow: '3px 3px 0px #1E293B',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* ── Cards de packs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {packs.map((pack, idx) => {
                        const isFeatured = idx === featuredIndex;
                        const isProcessing = paying === pack.id;

                        return (
                            <div
                                key={pack.id}
                                className="flex flex-col rounded-2xl p-6 transition-all duration-150"
                                style={{
                                    backgroundColor: isFeatured ? '#8B5CF6' : '#ffffff',
                                    border: `3px solid #1E293B`,
                                    boxShadow: '5px 5px 0px #1E293B',
                                    transform: isFeatured ? 'scale(1.04)' : 'scale(1)',
                                    position: 'relative',
                                }}
                            >
                                {/* Badge "Más popular" */}
                                {isFeatured && (
                                    <div
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                        style={{
                                            backgroundColor: '#FBBF24',
                                            border: '2px solid #1E293B',
                                            boxShadow: '2px 2px 0px #1E293B',
                                            fontFamily: 'Fredoka One, cursive',
                                            color: '#1E293B',
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        ★ MÁS POPULAR
                                    </div>
                                )}

                                {/* Nombre del pack */}
                                <h3
                                    className="text-xl mb-1"
                                    style={{
                                        fontFamily: 'Fredoka One, cursive',
                                        color: isFeatured ? '#ffffff' : '#1E293B',
                                    }}
                                >
                                    {pack.name}
                                </h3>

                                {/* Cantidad de cuentos */}
                                <div className="mb-1">
                                    <span
                                        className="text-4xl font-extrabold"
                                        style={{
                                            fontFamily: 'Fredoka One, cursive',
                                            color: isFeatured ? '#FBBF24' : '#8B5CF6',
                                        }}
                                    >
                                        {pack.credits}
                                    </span>
                                    <span
                                        className="ml-1 text-base"
                                        style={{
                                            fontFamily: 'Nunito, sans-serif',
                                            color: isFeatured ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.5)',
                                        }}
                                    >
                                        {pack.credits === 1 ? 'cuento' : 'cuentos'}
                                    </span>
                                </div>

                                {/* Precio por cuento */}
                                <p
                                    className="text-xs mb-4"
                                    style={{
                                        fontFamily: 'Nunito, sans-serif',
                                        color: isFeatured ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.4)',
                                    }}
                                >
                                    {pricePerStory(pack)} por cuento
                                </p>

                                {/* Descripción */}
                                {pack.description && (
                                    <p
                                        className="text-xs mb-6 flex-grow leading-relaxed"
                                        style={{
                                            fontFamily: 'Nunito, sans-serif',
                                            color: isFeatured ? 'rgba(255,255,255,0.75)' : 'rgba(30,41,59,0.55)',
                                        }}
                                    >
                                        {pack.description}
                                    </p>
                                )}

                                {/* Precio total */}
                                <p
                                    className="text-2xl font-bold mb-4"
                                    style={{
                                        fontFamily: 'Fredoka One, cursive',
                                        color: isFeatured ? '#ffffff' : '#1E293B',
                                    }}
                                >
                                    {formatPrice(pack.price_cents)}
                                </p>

                                {/* Botón comprar — estilo táctil del design system */}
                                <button
                                    onClick={() => handleBuy(pack)}
                                    disabled={!!paying}
                                    className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-100"
                                    style={{
                                        fontFamily: 'Fredoka One, cursive',
                                        fontSize: '1rem',
                                        letterSpacing: '0.03em',
                                        backgroundColor: isFeatured ? '#FBBF24' : '#1E293B',
                                        color: isFeatured ? '#1E293B' : '#ffffff',
                                        border: '3px solid #1E293B',
                                        boxShadow: isProcessing ? '1px 1px 0px #1E293B' : '4px 4px 0px #1E293B',
                                        transform: isProcessing ? 'translate(3px, 3px)' : 'translate(0,0)',
                                        cursor: paying ? 'not-allowed' : 'pointer',
                                        opacity: paying && !isProcessing ? 0.5 : 1,
                                    }}
                                    onMouseEnter={e => {
                                        if (!paying) {
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0px #1E293B';
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!paying) {
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0px #1E293B';
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0,0)';
                                        }
                                    }}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                                    stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Redirigiendo...
                                        </span>
                                    ) : (
                                        'COMPRAR AHORA'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* ── Garantías ── */}
                <div
                    className="mt-10 flex flex-wrap justify-center gap-6 text-xs"
                    style={{
                        fontFamily: 'Nunito, sans-serif',
                        color: '#1E293B',
                        opacity: 0.4,
                    }}
                >
                    <span>🔒 Pago seguro con Stripe</span>
                    <span>♾️ Créditos sin caducidad</span>
                    <span>📄 Factura disponible</span>
                </div>

                {/* ── Volver ── */}
                {onClose && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={onClose}
                            style={{
                                fontFamily: 'Nunito, sans-serif',
                                fontSize: '0.85rem',
                                color: '#1E293B',
                                opacity: 0.4,
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Volver sin comprar
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}