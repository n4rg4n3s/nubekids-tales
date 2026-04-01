/**
 * stripeService.ts
 * Gestiona la redirección al checkout de Stripe desde el frontend.
 * El backend (/api/stripe/create-checkout) crea la sesión real.
 */

export type CreditPackId =
    | 'b2c-trial'
    | 'b2c-family'
    | 'b2c-gift'
    | 'b2b-std-starter'
    | 'b2b-std-growth'
    | 'b2b-std-scale'
    | 'b2b-prm-starter'
    | 'b2b-prm-growth'
    | 'b2b-prm-scale';

interface CheckoutParams {
    packId: CreditPackId;
    tenantId?: string;
    userId?: string;
}

/**
 * Redirige al usuario a Stripe Checkout para comprar un pack de créditos.
 * Si el backend devuelve una URL, el navegador navega allí automáticamente.
 */
export async function redirectToCheckout(params: CheckoutParams): Promise<void> {
    const { packId, tenantId, userId } = params;

    const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            packId,
            tenantId: tenantId || null,
            userId: userId || null,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status} al crear sesión de pago`);
    }

    const { url } = await response.json();

    if (!url) {
        throw new Error('Stripe no devolvió una URL de checkout');
    }

    // Redirigir al hosted checkout de Stripe
    window.location.href = url;
}