import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Mapa de pack IDs → Stripe Price IDs
// Generados el 01/04/2026 — cuenta acct_1CvoJ4DcvABCRuSU
const PACK_PRICE_MAP: Record<string, string> = {
    'b2c-trial': 'price_1THOLwDcvABCRuSU3NcAhy5B',
    'b2c-family': 'price_1THOM4DcvABCRuSUQtxVIH2B',
    'b2c-gift': 'price_1THOMBDcvABCRuSUtGWwVFkC',
    'b2b-std-starter': 'price_1THOMJDcvABCRuSUOTLGL2Gp',
    'b2b-std-growth': 'price_1THOMQDcvABCRuSUODiMlvBm',
    'b2b-std-scale': 'price_1THOMYDcvABCRuSU4p2FmSDu',
    'b2b-prm-starter': 'price_1THOMgDcvABCRuSUCwzqnhLp',
    'b2b-prm-growth': 'price_1THOMpDcvABCRuSUz0DcZvsf',
    'b2b-prm-scale': 'price_1THOMxDcvABCRuSUbbFEijDA',
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