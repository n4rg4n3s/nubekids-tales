import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Mapa de pack IDs → Stripe Price IDs activos
// Actualizado el 03/04/2026 — cuenta acct_1CvoJ4DcvABCRuSU
const PACK_PRICE_MAP: Record<string, string> = {
    'b2c-trial': 'price_1THqytDcvABCRuSUPk916Hmh',
    'b2c-family': 'price_1THr0aDcvABCRuSUGGveajZp',
    'b2c-gift': 'price_1THr0dDcvABCRuSUYFWdpMUw',
    'b2b-std-starter': 'price_1THr0gDcvABCRuSUDbG88ec5',
    'b2b-std-growth': 'price_1THr0jDcvABCRuSUUDmhC5Yk',
    'b2b-std-scale': 'price_1THr0nDcvABCRuSUvow235eV',
    'b2b-prm-starter': 'price_1THr0tDcvABCRuSUOhOTtFp7',
    'b2b-prm-growth': 'price_1THr0wDcvABCRuSU7AS3UV7s',
    'b2b-prm-scale': 'price_1THr0zDcvABCRuSUXNcyPt12',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { packId, tenantId, userId, successUrl, cancelUrl } = req.body;

        // Validar packId
        const priceId = PACK_PRICE_MAP[packId];
        if (!priceId) {
            return res.status(400).json({ error: `Pack desconocido: ${packId}` });
        }

        // Al menos uno de los dos debe estar presente
        if (!tenantId && !userId) {
            return res.status(400).json({ error: 'Se requiere tenantId o userId' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Crear Checkout Session en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'payment',
            success_url: successUrl || `${frontendUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${frontendUrl}/credits`,
            locale: 'es',
            metadata: {
                pack_id: packId,
                tenant_id: tenantId || '',
                user_id: userId || '',
            },
        });

        return res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('[create-checkout] Error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Error interno del servidor',
        });
    }
}
