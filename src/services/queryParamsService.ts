/**
 * queryParamsService.ts
 *
 * Lee los query params de la URL al arrancar la app y determina
 * si estamos en modo sesión anónima B2B.
 *
 * URL de ejemplo (Plan Standard):
 *   /?tenant=zapatos-lopez-001
 *
 * URL de ejemplo (Plan Premium):
 *   /?tenant=zapatos-lopez-001&item=Nike+Air+Max+90+Kids&item_image=https://cdn.tienda.com/foto.jpg&customer_email=padre@email.com
 */

import type { B2BSessionParams } from '../types';

/**
 * Lee window.location.search y extrae los parámetros B2B.
 * Devuelve null si no hay ?tenant= en la URL (flujo B2C directo).
 */
export function parseB2BParams(): B2BSessionParams | null {
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');

    if (!tenant || tenant.trim() === '') {
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