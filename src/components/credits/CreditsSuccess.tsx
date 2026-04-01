/**
 * CreditsSuccess.tsx
 * Pantalla de confirmación post-pago.
 * Stripe redirige aquí tras un pago exitoso con:
 * ?session_id={CHECKOUT_SESSION_ID}
 *
 * No necesitamos verificar el session_id en el frontend —
 * el webhook ya habrá añadido los créditos antes de que
 * el usuario llegue aquí.
 */

import { useEffect, useState } from 'react';

interface CreditsSuccessProps {
    onContinue: () => void; // Volver al wizard
}

export default function CreditsSuccess({ onContinue }: CreditsSuccessProps) {
    const [visible, setVisible] = useState(false);

    // Pequeño delay para que la animación de entrada se note
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundColor: '#FDFBF7' }}
        >
            <div
                className="max-w-md w-full text-center"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
            >

                {/* Icono principal */}
                <div
                    className="text-7xl mb-6"
                    style={{
                        animation: visible ? 'bounce 0.6s ease 0.3s both' : 'none',
                    }}
                >
                    ✨
                </div>

                {/* Tarjeta central */}
                <div
                    className="rounded-2xl p-8 mb-6"
                    style={{
                        backgroundColor: '#ffffff',
                        border: '3px solid #1E293B',
                        boxShadow: '6px 6px 0px #1E293B',
                    }}
                >
                    <h1
                        className="text-3xl mb-3"
                        style={{
                            fontFamily: 'Fredoka, sans-serif',
                            color: '#1E293B',
                            lineHeight: 1.2,
                        }}
                    >
                        ¡Magia cargada!
                    </h1>

                    <p
                        className="text-base mb-6 leading-relaxed"
                        style={{
                            fontFamily: 'Nunito, sans-serif',
                            color: '#1E293B',
                            opacity: 0.65,
                        }}
                    >
                        Tus cuentos ya están disponibles.<br />
                        Es hora de crear la historia que tu hijo necesita escuchar.
                    </p>

                    {/* Separador decorativo */}
                    <div
                        className="flex items-center gap-3 mb-6"
                        style={{ opacity: 0.2 }}
                    >
                        <div className="flex-1 h-px" style={{ backgroundColor: '#1E293B' }} />
                        <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.2rem' }}>★</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: '#1E293B' }} />
                    </div>

                    {/* Botón principal — estilo táctil del design system */}
                    <button
                        onClick={onContinue}
                        className="w-full py-4 rounded-xl transition-all duration-100"
                        style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: '1.1rem',
                            letterSpacing: '0.03em',
                            backgroundColor: '#FBBF24',
                            color: '#1E293B',
                            border: '3px solid #1E293B',
                            boxShadow: '4px 4px 0px #1E293B',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0px #1E293B';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0px #1E293B';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translate(0, 0)';
                        }}
                    >
                        CREAR MI CUENTO AHORA
                    </button>
                </div>

                {/* Garantías */}
                <div
                    className="flex flex-wrap justify-center gap-5 text-xs"
                    style={{
                        fontFamily: 'Nunito, sans-serif',
                        color: '#1E293B',
                        opacity: 0.35,
                    }}
                >
                    <span>🔒 Pago verificado</span>
                    <span>♾️ Créditos sin caducidad</span>
                    <span>📄 Recibirás tu factura por email</span>
                </div>

            </div>
        </div>
    );
}