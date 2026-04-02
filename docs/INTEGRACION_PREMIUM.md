# Guía de Integración — NubeKids Plan Premium

> **Para:** Equipo técnico del e-Commerce
> **Versión:** 1.0 — Abril 2026
> **Tiempo estimado de integración:** 1–2 horas

---

## ¿Qué hace esta integración?

Cuando un cliente compra en tu tienda, el sistema genera automáticamente un link personalizado que incluye:
- El nombre del producto comprado
- La foto del producto
- El email del cliente

Al hacer clic, el cliente llega a NubeKids con el producto ya cargado como "objeto mágico" del cuento, sin tener que escribir ni subir nada.

---

## Los 5 parámetros del link

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `tenant` | string | ✅ Sí | Tu ID de tenant en NubeKids (te lo proporcionamos al darte de alta) |
| `item` | string | Recomendado | Nombre del producto comprado |
| `item_image` | URL | Recomendado (Plan Premium) | URL pública de la foto del producto |
| `customer_email` | string | Opcional | Email del cliente — se pre-rellena en el registro |
| `ref` | string | Opcional | Origen del click para tracking (`checkout`, `email`, `sms`) |

**Reglas importantes:**
- Todos los valores deben ir **URL-encoded** (espacios → `+` o `%20`)
- `item_image` debe ser una **URL pública accesible** (no requiere autenticación)
- La URL completa puede tener hasta 2000 caracteres sin problemas

---

## Ejemplo de link completo
```
https://nubekids-tales.vercel.app/?tenant=zapatos-lopez-001&item=Nike+Air+Max+90+Kids+Rojo&item_image=https://cdn.tutienda.com/products/nike-90.jpg&customer_email=padre%40email.com&ref=checkout
```

---

## Implementación por plataforma

### Shopify

Edita tu plantilla de email de confirmación de pedido (`.liquid`):
```liquid
{% comment %} NubeKids — Cuento mágico personalizado {% endcomment %}
{% assign nk_tenant = 'TU_TENANT_ID' %}
{% assign nk_item   = line_items.first.title | url_encode %}
{% assign nk_img    = line_items.first.image.src | url_encode %}
{% assign nk_email  = customer.email | url_encode %}
{% assign nk_url    = 'https://nubekids-tales.vercel.app/?tenant=' | append: nk_tenant
                      | append: '&item=' | append: nk_item
                      | append: '&item_image=' | append: nk_img
                      | append: '&customer_email=' | append: nk_email
                      | append: '&ref=email' %}

<div style="text-align:center; margin: 24px 0;">
  <a href="{{ nk_url }}"
     style="background:#8B5CF6; color:white; padding:14px 28px;
            border-radius:8px; font-weight:bold; text-decoration:none;
            display:inline-block;">
    🎁 Crea el cuento mágico de tu peque — ¡Es gratis!
  </a>
</div>
```

---

### WooCommerce

Añade este código en `functions.php` de tu tema hijo:
```php
add_action( 'woocommerce_email_after_order_table', 'nubekids_add_story_cta', 10, 2 );

function nubekids_add_story_cta( $order, $sent_to_admin ) {
  if ( $sent_to_admin ) return;

  $tenant    = 'TU_TENANT_ID';
  $items     = $order->get_items();
  $first_item = reset( $items );

  if ( ! $first_item ) return;

  $product   = $first_item->get_product();
  $item_name = urlencode( $first_item->get_name() );
  $img_id    = $product ? get_post_thumbnail_id( $product->get_id() ) : null;
  $img_url   = $img_id ? urlencode( wp_get_attachment_url( $img_id ) ) : '';
  $email     = urlencode( $order->get_billing_email() );

  $nk_url = "https://nubekids-tales.vercel.app/?tenant={$tenant}"
           . "&item={$item_name}"
           . ( $img_url ? "&item_image={$img_url}" : '' )
           . "&customer_email={$email}"
           . "&ref=woo-email";

  echo '
  <div style="text-align:center; margin:24px 0;">
    <a href="' . esc_url( $nk_url ) . '"
       style="background:#8B5CF6; color:white; padding:14px 28px;
              border-radius:8px; font-weight:bold; text-decoration:none;
              display:inline-block;">
      🎁 Crea el cuento mágico de tu peque — ¡Es gratis!
    </a>
  </div>';
}
```

---

### Plataforma custom / backend genérico

En el momento de generar el email de confirmación de pedido, construye la URL así (pseudocódigo):
```javascript
const NUBEKIDS_TENANT = 'TU_TENANT_ID';
const NUBEKIDS_BASE   = 'https://nubekids-tales.vercel.app/';

function buildNubeKidsUrl(order) {
  const params = new URLSearchParams({
    tenant:         NUBEKIDS_TENANT,
    item:           order.firstItem.name,
    item_image:     order.firstItem.imageUrl,
    customer_email: order.customer.email,
    ref:            'checkout',
  });
  return `${NUBEKIDS_BASE}?${params.toString()}`;
}
```

---

## ¿Qué pasa si la imagen no carga?

NubeKids gestiona automáticamente los fallos de carga de imagen con 3 niveles de fallback:

1. **Descarga directa** — funciona con la mayoría de CDNs modernos (Shopify CDN, Cloudflare, etc.)
2. **Carga alternativa** — para servidores sin headers CORS explícitos
3. **Solo descripción textual** — si la imagen no se puede procesar, el cuento usa únicamente el nombre del producto

En ningún caso el flujo se interrumpe para el cliente.

---

## Cómo probar tu integración

Usa el simulador incluido en el proyecto:
```
docs/nubekids_b2b2c_simulator.html
```

O construye manualmente una URL de prueba con tus datos reales y ábrela en el navegador. Deberías ver el wizard con el producto pre-cargado en el Step 3.

---

## Preguntas frecuentes

**¿Cuántos créditos consume cada cuento?**
1 crédito = 1 cuento. Se descuenta de tu saldo al iniciar la generación.

**¿Qué pasa si mi saldo llega a 0?**
El cliente verá una pantalla informando que la promoción no está disponible, con opción de crear su propio cuento de pago. Te recomendamos comprar créditos antes de lanzar campañas.

**¿El cliente necesita registrarse para generar el cuento?**
No. El primer cuento vía link de tenant es completamente gratuito y sin registro. El registro solo se solicita si quiere crear más cuentos por su cuenta.

**¿Puedo personalizar el texto del email?**
Sí, el snippet de código es solo orientativo. Puedes adaptar el copy y el diseño del botón a tu identidad de marca.

---

*¿Dudas sobre la integración? Contacta con el equipo de NubeKids.*