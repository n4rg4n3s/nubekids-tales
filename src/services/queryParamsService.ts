/**
 * queryParamsService.ts
 *
 * Lee los query params de la URL al arrancar la app y determina
 * si estamos en modo sesión anónima B2B de DEMO.
 *
 * IMPORTANTE:
 * - El flujo real B2B para usuarios finales debe entrar por `?token=...`
 * - `?tenant=...` queda reservado a demo/testing y requiere `&demo=1`
 *
 * URL de ejemplo (Plan Standard demo):
 *   /?tenant=wearable-demo-default&demo=1
 *
 * URL de ejemplo (Plan Premium demo):
 *   /?tenant=wearable-demo-default&demo=1&item=Chaqueta+Brillante&item_image=https://cdn.tienda.com/foto.jpg&customer_email=padre@email.com
 */

import type { B2BSessionParams } from '../types';

/**
 * Lee window.location.search y extrae los parámetros B2B.
 * Devuelve null si no hay ?tenant= o si no es un enlace demo (`demo=1`).
 */
export function parseB2BParams(): B2BSessionParams | null {
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');
    const isDemo = params.get('demo') === '1';

    if (!tenant || tenant.trim() === '' || !isDemo) {
        return null;
    }

    const result: B2BSessionParams = {
        tenant: tenant.trim(),
    };

    const item = params.get('item');
    if (item) result.item = decodeURIComponent(item.trim());

    const itemImage = params.get('item_image');
    if (itemImage) result.item_image = decodeURIComponent(itemImage.trim());

    const customerEmail = params.get('customer_email');
    if (customerEmail) result.customer_email = decodeURIComponent(customerEmail.trim());

    const ref = params.get('ref');
    if (ref) result.ref = ref.trim();

    return result;
}

/**
 * Limpia los query params de la URL sin recargar la página.
 * Se llama después de parsear los params, para que la URL quede limpia.
 */
export function clearQueryParams(): void {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
}
