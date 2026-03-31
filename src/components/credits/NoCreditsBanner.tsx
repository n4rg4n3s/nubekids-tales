interface NoCreditsBannerProps {
    onBuyCredits: () => void;
    isTenant?: boolean;
}

/**
 * Pantalla que se muestra cuando el usuario intenta generar
 * un cuento pero no tiene créditos disponibles.
 */
export function NoCreditsBanner({ onBuyCredits, isTenant = false }: NoCreditsBannerProps) {
    return (
        <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">

                <div className="text-6xl mb-4">📚</div>

                <h2 className="text-2xl font-black text-black mb-2">
                    ¡Se acabaron los cuentos!
                </h2>

                <p className="text-gray-600 mb-6">
                    {isTenant
                        ? 'Tu tienda no tiene créditos disponibles. Recarga para seguir ofreciendo cuentos mágicos a tus clientes.'
                        : 'No te quedan cuentos disponibles. Consigue más para seguir creando historias mágicas.'}
                </p>

                <button
                    onClick={onBuyCredits}
                    className="w-full py-4 px-6 bg-yellow-400 border-3 border-black rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                    ✨ Conseguir más cuentos
                </button>

                <p className="text-xs text-gray-400 mt-4">
                    Los créditos no caducan. Úsalos cuando quieras.
                </p>

            </div>
        </div>
    );
}