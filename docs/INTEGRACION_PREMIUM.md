# Guia de Integracion B2B Segura - NubeKids

> Para: equipo tecnico del e-Commerce
> Version: 2.0 - Abril 2026
> Cambio critico: los enlaces reales de cliente final ya no usan `?tenant=...`

---

## Regla principal

El flujo correcto para clientes finales es:

1. Tu backend llama a `POST /api/b2b/create-token`
2. NubeKids responde con una URL one-time `/?token=...`
3. Esa URL se entrega al comprador
4. Al generar el cuento se consumen de forma atomica:
   - 1 token
   - 1 credito del tenant

`?tenant=...` queda reservado a demo/testing interno y requiere `&demo=1`.

---

## Que resuelve este cambio

Evita que un enlace compartido pueda agotar todos los creditos de un tenant.

Con el modelo actual:
- 1 compra = 1 token
- 1 token = 1 cuento
- un token usado no puede reutilizarse

---

## Endpoint de emision

`POST /api/b2b/create-token`

Headers:

```http
Content-Type: application/json
x-nubekids-tenant-secret: TU_SECRETO_DE_INTEGRACION
```

Body JSON:

```json
{
  "tenantId": "zapatos-lopez-001",
  "itemName": "Nike Air Max 90 Kids Rojo",
  "itemImageUrl": "https://cdn.tutienda.com/products/nike-90.jpg",
  "customerEmail": "padre@email.com",
  "expiresInHours": 720
}
```

Respuesta:

```json
{
  "ok": true,
  "token": "nkt_...",
  "url": "https://nubekids-tales.vercel.app/?token=nkt_...",
  "expiresAt": "2026-05-04T12:00:00.000Z"
}
```

---

## Campos por plan

### Standard

Puedes emitir el token solo con:

```json
{
  "tenantId": "zapatos-lopez-001",
  "customerEmail": "padre@email.com"
}
```

Resultado:
- el cliente entra con enlace one-time seguro
- el cuento puede mencionar la tienda
- no hace falta foto de producto

### Premium

Añade:
- `itemName`
- `itemImageUrl`
- `customerEmail`

Resultado:
- Step 3 llega pre-rellenado
- si la imagen se puede procesar, el producto entra tambien como referencia visual

---

## Modelo actual del producto en NubeKids

Desde el refactor de abril de 2026:

- el comportamiento narrativo y visual del producto ya no depende de ids demo legacy como `shoe-store` o `fashion-store`
- la fuente de verdad es `item_interaction_mode` del tenant (`generic`, `wearable`, `interactive`)
- ese modo se configura una vez durante la activacion del tenant; no hace falta enviarlo en cada pedido

Consecuencia practica:
- tu integracion solo debe emitir el token y enviar `itemName` + `itemImageUrl` cuando aplique
- NubeKids decide despues si ese producto se viste, se sostiene o se usa de otra forma dentro del cuento segun la configuracion del tenant

---

## Ejemplo backend generico

```ts
const response = await fetch('https://nubekids-tales.vercel.app/api/b2b/create-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nubekids-tenant-secret': process.env.NUBEKIDS_TENANT_SECRET!,
  },
  body: JSON.stringify({
    tenantId: 'zapatos-lopez-001',
    itemName: order.firstItem.name,
    itemImageUrl: order.firstItem.imageUrl,
    customerEmail: order.customer.email,
    expiresInHours: 24 * 30,
  }),
});

const data = await response.json();

if (!response.ok || !data.ok) {
  throw new Error(data.error || 'No se pudo emitir el token de NubeKids');
}

const storyUrl = data.url;
```

---

## Shopify

Recomendacion:
- no construir el link final en Liquid
- llamar a `create-token` desde tu backend/app privada cuando el pedido quede confirmado
- guardar la URL recibida y usarla despues en email, pagina de gracias o cuenta de cliente

---

## WooCommerce

Recomendacion:
- emitir el token desde backend PHP cuando el pedido pase a `processing` o `completed`
- incluir la URL one-time recibida en el email transaccional

---

## Reglas operativas

- `itemImageUrl` debe ser publica
- todos los tokens deben generarse server-side
- no exponer nunca `x-nubekids-tenant-secret` en frontend
- no construir enlaces finales `?tenant=...` para compradores reales
- si un token expira o ya fue usado, hay que emitir uno nuevo

---

## Demo y testing interno

Para pruebas manuales del equipo, sigue existiendo el modo demo:

```txt
/?tenant=wearable-demo-default&demo=1
/?tenant=wearable-demo-default&demo=1&item=Chaqueta+Brillante&item_image=https://...&customer_email=test@email.com
/?tenant=interactive-demo-default&demo=1&item=Robot+Explorador&item_image=https://...&customer_email=test@email.com
```

Eso no debe usarse en produccion con compradores reales.

---

## FAQ

### Cuantos creditos consume cada cuento?

1 token valido + 1 credito del tenant.

### Que pasa si el tenant no tiene saldo?

El usuario ve una pantalla de promocion no disponible. El token no debe reutilizarse como sustituto de saldo.

### El cliente necesita registrarse?

No para el primer cuento. El registro solo aparece si quiere crear otro por su cuenta.

### Hace falta WhatsApp Business?

No para esta integracion tecnica. Eso afecta solo al flujo comercial de activacion del tenant.

---

## Resumen

- Real: `/?token=...`
- Demo: `/?tenant=...&demo=1`
- 1 compra = 1 token = 1 cuento

