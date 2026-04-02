// src/components/PostStoryActions.tsx
// Fase 10: CTA post-lectura para usuarios B2B anónimos.
// Aparece cuando el usuario termina su cuento gratuito y quiere crear otro.

import { motion } from 'framer-motion';
import type { TenantConfig } from '../types';

interface PostStoryActionsProps {
    heroName: string;
    tenantConfig: TenantConfig;
    /** Email pre-rellenado del query param customer_email */
    customerEmail?: string;
    onCreateAnother: () => void;
    onBackToStory: () => void;
}

const INK_BLACK = '#1E293B';

export default function PostStoryActions({
    heroName,
    tenantConfig,
    customerEmail,
    onCreateAnother,
    onBackToStory,
}: PostStoryActionsProps) {
    const { brandColors } = tenantConfig;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: brandColors.background }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <div
                    className="bg-white rounded-2xl p-8 text-center"
                    style={{
                        border: `4px solid ${INK_BLACK}`,
                        boxShadow: `8px 8px 0px ${INK_BLACK}`,
                    }}
                >
                    {/* Celebración */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className="text-6xl mb-4"
                    >
                        🎉
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-black mb-2"
                        style={{
                            fontFamily: "'Fredoka', sans-serif",
                            color: brandColors.primary,
                        }}
                    >
                        ¡El cuento de {heroName} está listo!
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm mb-8"
                        style={{ color: `${INK_BLACK}99` }}
                    >
                        Has usado tu cuento gratuito. ¿Quieres crear más aventuras
                        mágicas para {heroName} u otros peques?
                    </motion.p>

                    {/* Packs de créditos — ancla de valor */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6 p-4 rounded-xl"
                        style={{
                            background: `linear-gradient(135deg, ${brandColors.primary}15, ${brandColors.accent}15)`,
                            border: `2px solid ${brandColors.primary}30`,
                        }}
                    >
                        <p className="text-xs font-bold uppercase tracking-wide mb-3"
                            style={{ color: `${INK_BLACK}60` }}>
                            Tus próximos cuentos
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                { count: 1, price: '4,99€', label: 'Prueba' },
                                { count: 3, price: '12,99€', label: 'Familia', highlight: true },
                                { count: 5, price: '19,99€', label: 'Regalo' },
                            ].map((pack) => (
                                <div
                                    key={pack.count}
                                    className="rounded-lg py-2 px-1"
                                    style={{
                                        background: pack.highlight ? brandColors.primary : 'white',
                                        border: `2px solid ${pack.highlight ? brandColors.primary : `${INK_BLACK}20`}`,
                                        boxShadow: pack.highlight ? `3px 3px 0px ${INK_BLACK}` : 'none',
                                    }}
                                >
                                    <p
                                        className="text-lg font-black"
                                        style={{ color: pack.highlight ? 'white' : brandColors.primary }}
                                    >
                                        {pack.count}
                                    </p>
                                    <p
                                        className="text-xs font-bold"
                                        style={{ color: pack.highlight ? 'white' : INK_BLACK }}
                                    >
                                        {pack.price}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: pack.highlight ? 'rgba(255,255,255,0.8)' : `${INK_BLACK}60` }}
                                    >
                                        {pack.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA principal: registrarse */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                    >
                        <button
                            onClick={onCreateAnother}
                            className="w-full px-5 py-4 rounded-xl font-bold text-lg text-white transition-all"
                            style={{
                                backgroundColor: brandColors.primary,
                                border: `3px solid ${INK_BLACK}`,
                                boxShadow: `4px 4px 0px ${INK_BLACK}`,
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translate(2px, 2px)';
                                e.currentTarget.style.boxShadow = `2px 2px 0px ${INK_BLACK}`;
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = `4px 4px 0px ${INK_BLACK}`;
                            }}
                        >
                            ✨ Crear otro cuento
                        </button>

                        {customerEmail && (
                            <p className="text-xs" style={{ color: `${INK_BLACK}50` }}>
                                Usaremos <strong>{customerEmail}</strong> para registrarte más rápido
                            </p>
                        )}

                        <button
                            onClick={onBackToStory}
                            className="w-full px-5 py-3 rounded-xl font-bold text-base transition-all"
                            style={{
                                backgroundColor: 'transparent',
                                border: `2px solid ${INK_BLACK}30`,
                                color: `${INK_BLACK}70`,
                            }}
                        >
                            📖 Volver al cuento
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}