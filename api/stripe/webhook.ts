import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

// Cliente Supabase con service role (tiene permisos para saltarse RLS)
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cuántos créditos da cada pack
const PACK_CREDITS: Record<string, number> = {
    'b2c-trial': 1,
    'b2c-family': 3,
    'b2c-gift': 5,
    'b2b-std-starter': 50,
    'b2b-std-growth': 200,
    'b2b-std-scale': 500,
    'b2b-prm-starter': 50,
    'b2b-prm-growth': 200,
    'b2b-prm-scale': 500,
};

// IMPORTANTE: Vercel necesita el body como raw buffer para verificar la firma de Stripe
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper: leer el body como buffer crudo
async function getRawBody(req: VercelRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    if (!sig) {
        return res.status(400).json({ error: 'Falta stripe-signature header' });
    }

    // Leer body crudo para verificar firma
    let rawBody: Buffer;
    try {
        rawBody = await getRawBody(req);
    } catch {
        return res.status(400).json({ error: 'Error leyendo body' });
    }

    // Verificar firma del webhook
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('[webhook] Firma inválida:', err);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Procesar solo el evento que nos interesa
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const packId = session.metadata?.pack_id || '';
        const tenantId = session.metadata?.tenant_id || null;
        const userId = session.metadata?.user_id || null;
        const paymentIntentId = session.payment_intent as string;

        const credits = PACK_CREDITS[packId];

        if (!credits) {
            console.error(`[webhook] Pack desconocido en metadata: ${packId}`);
            // Devolvemos 200 para que Stripe no reintente — es un error nuestro, no de Stripe
            return res.status(200).json({ received: true, warning: 'Pack desconocido' });
        }

        try {
            const { data, error } = await supabase.rpc('add_credits', {
                p_tenant_id: tenantId || null,
                p_user_id: userId || null,
                p_amount: credits,
                p_stripe_payment_intent_id: paymentIntentId,
                p_description: `Pack ${packId} — ${credits} créditos`,
            });

            if (error) {
                console.error('[webhook] Error en add_credits RPC:', error);
                // Devolvemos 500 para que Stripe reintente el webhook
                return res.status(500).json({ error: 'Error añadiendo créditos' });
            }

            console.log(
                `[webhook] ✅ ${credits} créditos añadidos | pack: ${packId} | tenant: ${tenantId} | user: ${userId} | nuevo balance: ${data}`
            );

        } catch (err) {
            console.error('[webhook] Error inesperado:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
    }

    // Para cualquier otro evento, confirmamos recepción sin hacer nada
    return res.status(200).json({ received: true });
}