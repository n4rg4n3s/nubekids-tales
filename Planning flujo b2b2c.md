# PLANNING_FLUJO_B2B2C.md — Fase 10: Flujo B2B → B2C Completo

> **Versión:** 1.0
> **Fecha:** 2026-04-01
> **Autor:** Claude (Technical Lead) + Javier (Product Owner)
> **Estado:** BORRADOR — Pendiente de aprobación antes de implementar
> **Prerequisitos completados:** Fases 1–9 (Auth, Créditos, Stripe)

---

## 0. Objetivo de la Fase

Implementar el funnel completo que permite a un cliente de un e-Commerce (tenant B2B) generar un cuento gratuito sin registrarse, y convertirlo en usuario B2C de pago al terminar.

**Resultado esperado:** Un padre recibe un email de confirmación de pedido de una zapatería con un botón "Crea un cuento mágico". Hace clic, genera el cuento sin login, lo lee, descarga el PDF, y al querer crear otro se registra y compra créditos propios.

---

## 1. Los Dos Caminos de Entrada

### 1.1 Camino B2B (sesión anónima via tenant)

```
Email de confirmación del e-Commerce
  │
  │  Botón: "¡Crea un cuento mágico con tus zapatos nuevos!"
  │
  ▼
nubekids.io/?tenant=zapatos-lopez-001&item=Nike+Air+Max+90+Kids&item_image=https://cdn.tienda.com/foto.jpg&customer_email=padre@email.com
  │
  ▼
NubeKids detecta ?tenant= → MODO SESIÓN ANÓNIMA B2B
  │
  ├── Carga tenantConfig (branding, storeName, plan_level)
  ├── Verifica créditos del tenant (consume_credit del tenant)
  ├── Si plan_level = 'premium' y hay item_image → descarga foto
  ├── Si plan_level = 'standard' → sin foto, solo storeName en narrativa
  │
  ▼
Wizard de 4 pasos (SIN LOGIN)
  │
  ├── Step 1: Héroe (nombre, edad, descripción)
  ├── Step 2: Pedagogía (opcional)
  ├── Step 3: Objeto mágico (PRE-RELLENADO si Premium con foto)
  ├── Step 4: Estilo visual + idioma
  │
  ▼
Generación del cuento (~60 seg)
  │
  ▼
Lectura + Descarga PDF
  │
  ▼
CTA: "¿Quieres crear otro cuento?"
  │
  ├──► SI → Registro B2C (email pre-rellenado) → Compra créditos → Wizard
  └──► NO → Fin de sesión
```

### 1.2 Camino B2C directo (usuario ya registrado)

```
nubekids.io/ (sin query params)
  │
  ▼
Login/Registro normal
  │
  ▼
Compra créditos si no tiene
  │
  ▼
Wizard → Generación → Lectura
```

### 1.3 Diferencia entre Standard y Premium en V1

| Aspecto | Standard | Premium |
|---------|----------|---------|
| **URL** | `?tenant=xxx` | `?tenant=xxx&item=yyy&item_image=zzz` |
| **Foto del producto** | No. El padre la sube manualmente si quiere | Sí. Se descarga automáticamente y se pre-rellena |
| **Narrativa** | `storeName` tejido en el cuento | `storeName` + producto específico en la narrativa |
| **Integración técnica e-Commerce** | Solo compartir un link | Generar link con datos del producto (URL de foto) |
| **Snippet JS / Widget** | ❌ No en V1 | ❌ No en V1 (es Fase 13) |

**Importante:** En V1, ambos planes usan redirect con query params. No hay widget embebible. El "snippet" del Premium es simplemente un link más completo que el e-Commerce genera desde su sistema (puede ser manual o automatizado desde su backend).

---

## 2. Piezas a Construir

### Pieza 1: Parser de Query Params (`queryParamsService.ts`)

**Qué hace:** Al arrancar la app, lee los query params y determina el modo de sesión.

**Query params soportados:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tenant` | string | Para B2B | ID del tenant (ej: `zapatos-lopez-001`) |
| `item` | string | Opcional | Nombre/modelo del producto comprado |
| `item_image` | string (URL) | Opcional (Premium) | URL de la foto del producto |
| `customer_email` | string | Opcional | Email del cliente para pre-rellenar registro |
| `ref` | string | Opcional | Tracking de origen (ej: `checkout`, `email`, `social`) |

**Output:** Un objeto `B2BSessionParams` que se pasa al flujo de la app.

**Ubicación:** `src/services/queryParamsService.ts`

**Complejidad:** Baja. Es un parser de `URLSearchParams` con validación.

---

### Pieza 2: Sesión Anónima B2B (modificación de `App.tsx`)

**Qué hace:** Si hay `?tenant=` en la URL, la app entra en "modo anónimo B2B":
- NO muestra login
- Carga la config del tenant
- Verifica que el tenant tiene créditos
- Permite generar UN cuento
- Al terminar, muestra CTA de conversión a B2C

**Lógica de decisión en App.tsx:**

```
¿Hay ?tenant= en la URL?
  │
  ├── SÍ → MODO ANÓNIMO B2B
  │   │
  │   ├── Cargar tenantConfig
  │   ├── ¿Tenant tiene créditos?
  │   │   ├── SÍ → Ir al wizard (sin login)
  │   │   └── NO → Mostrar "Promoción no disponible" + opción B2C
  │   │
  │   └── Marcar isAnonymousB2B = true en estado
  │
  └── NO → MODO NORMAL
      │
      ├── ¿Usuario logueado?
      │   ├── SÍ → ¿Tiene créditos? → Wizard / BuyCredits
      │   └── NO → Login/Registro
```

**Estado nuevo en App.tsx:**

```typescript
interface B2BSession {
  tenantId: string;
  tenantConfig: TenantConfig;
  itemName?: string;
  itemImageBase64?: string;  // Descargada y convertida
  customerEmail?: string;
  ref?: string;
  storyGenerated: boolean;   // true después del primer cuento
}
```

**Complejidad:** Media. Requiere modificar el flujo de estados de App.tsx sin romper el flujo existente (B2C directo y modo mock).

---

### Pieza 3: Cargador de Imagen del Producto (`itemImageLoader.ts`)

**Qué hace:** Descarga la foto del producto desde una URL externa y la convierte a base64 para inyectarla en el wizard (Step 3: Objeto Mágico).

**Ubicación:** `src/utils/itemImageLoader.ts`

**El problema de CORS:**

Cuando un navegador intenta descargar una imagen de otro dominio (ej: `cdn.zapateria.com`) via `fetch()`, el servidor origen debe enviar headers CORS (`Access-Control-Allow-Origin`). Muchos CDN de e-commerce SÍ los envían (Shopify, WooCommerce con Cloudflare, etc.), pero no es garantía universal.

**Estrategia de carga (3 intentos):**

```
Intento 1: fetch() directo
  │
  ├── ✅ Funciona → Convertir blob a base64 → Éxito
  │
  └── ❌ CORS error →
      │
      Intento 2: Crear <img> con crossOrigin="anonymous" y pintar en <canvas>
        │
        ├── ✅ Funciona → canvas.toDataURL() → base64 → Éxito
        │
        └── ❌ Falla →
            │
            Intento 3: Mostrar la imagen como <img src="URL"> (sin base64)
              │
              ├── ✅ El navegador la muestra → El usuario la ve en el wizard
              │   pero NO se puede enviar a Gemini como base64
              │   → Fallback: usar solo la descripción textual del item
              │
              └── ❌ Todo falla →
                  │
                  Fallback final: El wizard muestra "No pudimos cargar
                  la foto. Puedes subirla manualmente."
                  → El step 3 se comporta como Standard (subida manual)
```

**Nota técnica:** El `<img> + <canvas>` trick funciona cuando el servidor envía la imagen pero no los headers CORS explícitos. Es una técnica ampliamente usada.

**Complejidad:** Media-Alta (por los edge cases de CORS y los fallbacks).

---

### Pieza 4: Pre-rellenado del Wizard

**Qué hace:** Si la sesión B2B trae datos del producto, los inyecta en los steps del wizard.

**Comportamiento por step:**

| Step | Sin B2B params | Con B2B Standard | Con B2B Premium |
|------|---------------|-----------------|-----------------|
| Step 1 (Héroe) | Normal | Normal | Normal |
| Step 2 (Pedagogía) | Normal | Normal | Normal |
| Step 3 (Objeto Mágico) | Vacío, subida manual | `itemDescription` pre-rellenado con nombre del producto | `itemDescription` pre-rellenado + `itemImage` pre-cargada |
| Step 4 (Estilo) | Normal | Normal | Normal |

**Modificaciones en `StepItem.tsx`:**
- Aceptar props opcionales: `prefilledItemName?: string`, `prefilledItemImage?: string`
- Si `prefilledItemImage` existe, mostrarla como "foto del producto" con opción de cambiarla
- Si solo hay `prefilledItemName`, usarlo como valor por defecto del campo de descripción

**Complejidad:** Baja. Es pasar props y poner valores por defecto.

---

### Pieza 5: CTA Post-Lectura y Protección del Segundo Cuento

**Qué hace:** Al terminar el cuento (estado `reading`), mostrar opciones según el tipo de sesión.

**Escenarios:**

```
SESIÓN ANÓNIMA B2B (primer cuento):
  ┌─────────────────────────────────────────────────┐
  │  🎉 ¡Tu cuento está listo!                      │
  │                                                 │
  │  [📥 Descargar PDF]                              │
  │                                                 │
  │  ¿Te ha encantado? Crea más cuentos mágicos    │
  │  para [nombre del héroe] desde solo 4,99€       │
  │                                                 │
  │  [✨ Crear otro cuento]  ← lleva a registro     │
  │                                                 │
  │  Powered by NubeKids · Creado en [storeName]    │
  └─────────────────────────────────────────────────┘

SESIÓN B2C (usuario logueado con créditos):
  ┌─────────────────────────────────────────────────┐
  │  🎉 ¡Tu cuento está listo!                      │
  │                                                 │
  │  [📥 Descargar PDF]   [✨ Crear otro cuento]     │
  │                                                 │
  │  Te quedan X créditos                           │
  └─────────────────────────────────────────────────┘
```

**Flujo del botón "Crear otro cuento" en sesión anónima B2B:**

```
Clic en "Crear otro cuento"
  │
  ▼
¿El usuario ya se ha registrado en esta sesión?
  │
  ├── NO → Pantalla de Registro B2C
  │        (email pre-rellenado si customer_email existe)
  │        Tras registro → BuyCredits → Wizard
  │
  └── SÍ → ¿Tiene créditos?
            ├── SÍ → Wizard
            └── NO → BuyCredits
```

**Componente nuevo:** `PostStoryActions.tsx`

**Ubicación:** `src/components/PostStoryActions.tsx`

**Complejidad:** Baja-Media. Es UI + lógica condicional.

---

### Pieza 6: `sessionService.ts` — Quién Paga el Crédito

**Qué hace:** Determina de quién se descuenta el crédito antes de generar.

Ya está definido en `BUSINESS_TECH_SPEC.md` § 6.2. La implementación es directa:

```typescript
function resolvePayment(context): 'tenant' | 'user' | 'needs_credits'
```

**Reglas:**
1. Sesión anónima B2B + primer cuento + tenant con saldo → `tenant`
2. Sesión anónima B2B + tenant sin saldo → `needs_credits` (mostrar "promoción no disponible")
3. Usuario B2C logueado + con saldo → `user`
4. Usuario B2C logueado + sin saldo → `needs_credits` (mostrar BuyCredits)
5. Ni tenant ni user → `needs_credits` (mostrar Login)

**Ubicación:** `src/services/sessionService.ts`

**Complejidad:** Baja. Es lógica pura, sin I/O.

---

## 3. Archivos a Crear / Modificar

### Archivos NUEVOS

| Archivo | Descripción |
|---------|-------------|
| `src/services/queryParamsService.ts` | Parser de query params B2B |
| `src/services/sessionService.ts` | Lógica de resolvePayment (quién paga) |
| `src/utils/itemImageLoader.ts` | Descarga de imagen del producto (con fallbacks CORS) |
| `src/components/PostStoryActions.tsx` | CTA post-lectura (descargar, crear otro, registrarse) |

### Archivos a MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Leer query params al inicio. Nuevo estado `b2bSession`. Lógica de flujo anónimo. Integrar `PostStoryActions`. Integrar `sessionService.resolvePayment` antes de generar |
| `src/components/wizard/StepItem.tsx` | Aceptar props de pre-rellenado (`prefilledItemName`, `prefilledItemImage`) |
| `src/components/auth/SignUpPage.tsx` | Aceptar email pre-rellenado via prop |
| `src/types.ts` | Añadir `B2BSessionParams` y `PaymentDecision` |

---

## 4. Orden de Implementación

```
PASO 1 — Tipos y servicios puros (sin UI)
  ├── types.ts: B2BSessionParams, PaymentDecision
  ├── queryParamsService.ts
  ├── sessionService.ts
  └── itemImageLoader.ts

PASO 2 — Integración en App.tsx
  ├── Leer query params al montar
  ├── Estado b2bSession
  ├── Lógica: si hay tenant → skip login → cargar tenantConfig
  ├── Verificar créditos del tenant antes de wizard
  └── Integrar resolvePayment antes de generar

PASO 3 — Pre-rellenado del Wizard
  ├── Modificar StepItem.tsx (props de pre-rellenado)
  └── Pasar datos de b2bSession al wizard

PASO 4 — CTA Post-Lectura
  ├── Crear PostStoryActions.tsx
  ├── Integrar en App.tsx (estado reading)
  └── Flujo "crear otro" → registro si anónimo

PASO 5 — Pre-rellenado de email en registro
  ├── Modificar SignUpPage.tsx
  └── Pasar customer_email como prop

PASO 6 — Testing manual end-to-end
  ├── Test Standard: /?tenant=shoe-store-default
  ├── Test Premium: /?tenant=shoe-store-default&item=Nike+Air+Max&item_image=URL
  ├── Test sin créditos: tenant con balance 0
  ├── Test segundo cuento: anónimo intenta crear otro
  ├── Test conversión: anónimo → registro → compra → wizard
  └── Test B2C directo: sin query params → login → créditos → wizard
```

---

## 5. Preocupaciones Técnicas y Mitigaciones

### 5.1 CORS en itemImageLoader

**Riesgo:** La imagen del producto no se puede descargar cross-origin.

**Mitigación:** Cadena de 3 fallbacks (fetch → img+canvas → manual upload). El caso más probable (Shopify, WooCommerce con Cloudflare/CDN) funcionará con el Intento 1. Si no funciona, el usuario puede subir la foto manualmente — la experiencia degrada gracefully.

**Futuro (V2):** Si CORS es un problema frecuente, montar un proxy de imágenes en una Cloud Function:
```
GET /api/proxy-image?url=https://cdn.tienda.com/foto.jpg
→ Server descarga la imagen y la devuelve con headers CORS correctos
```
Esto elimina el problema al 100% pero añade una dependencia de backend.

### 5.2 Estado de App.tsx

**Riesgo:** App.tsx ya es complejo con la state machine. Añadir `b2bSession` puede generar bugs.

**Mitigación:**
- `b2bSession` es un objeto separado del flujo principal (no modifica el AppState machine)
- La lógica de "quién paga" está encapsulada en `sessionService.ts`, no dispersa en App.tsx
- Los query params se leen UNA VEZ al montar (useEffect con []) y no cambian

### 5.3 Tenant sin créditos

**Riesgo:** Un padre hace clic en el link del e-Commerce y el tenant no tiene créditos. Experiencia frustrante.

**Mitigación:**
- Pantalla específica: "Esta promoción no está disponible en este momento"
- Oferta alternativa: "¿Quieres crear un cuento por tu cuenta? Desde 4,99€"
- Futuro: Notificación automática al tenant cuando su saldo baja de X créditos

### 5.4 Doble generación del mismo usuario anónimo

**Riesgo:** Un usuario abre el link dos veces en pestañas distintas e intenta generar dos cuentos gratis.

**Mitigación V1:** No lo controlamos en V1. `consume_credit` es atómico en Supabase (FOR UPDATE), así que no hay race condition en el crédito. Si el tenant tiene saldo, se consumen dos créditos — es aceptable porque el coste por cuento para el tenant es bajo (0.32-0.78€). Si no tiene saldo, el segundo intento falla naturalmente.

**Mitigación V2:** `localStorage` con flag `b2b_story_generated_{tenantId}` para bloquear en el mismo navegador. O crear `story_sessions` con IP hash.

### 5.5 URL demasiado larga con item_image

**Riesgo:** La URL con foto puede ser muy larga (algunos CDN usan URLs de 200+ caracteres).

**Mitigación:** No es un problema real — los navegadores soportan URLs de hasta 2000+ caracteres. Y `item_image` es un solo parámetro, no fragmenta nada.

---

## 6. Lo Que NO Se Construye en Fase 10

Para evitar scope creep, explícitamente fuera de alcance:

| Feature | Fase |
|---------|------|
| Widget embebible `<nubekids-upsell>` | Fase 13 |
| Webhook de Shopify/WooCommerce | Fase 13 |
| Email transaccional (envío del link al comprador) | Fase 13 |
| Proxy de imágenes para evitar CORS | V2 si es necesario |
| Tabla `story_sessions` para tracking | Fase 10+ (nice to have, no blocker) |
| Dashboard del tenant (ver cuántos cuentos se generaron) | Fase 12 |
| Limitación de cuentos por IP/navegador | V2 |
| Historial de cuentos generados por el usuario | V2 |

---

## 7. Documentación para el Tenant (Output de Fase 10)

Al completar la fase, el tenant necesita saber cómo usar el link. Esto es un documento simple:

### Plan Standard

```
Tu link personalizado:
https://nubekids.io/?tenant=TU_ID_DE_TENANT

Ejemplo:
https://nubekids.io/?tenant=zapatos-lopez-001

Dónde usarlo:
- En tu email de confirmación de pedido
- En tu página de "Gracias por tu compra"
- En tus redes sociales

Texto sugerido para el email:
"🎁 ¡Regalo especial! Crea un cuento mágico personalizado
para tu peque con su compra. ¡Es gratis!"
[Botón: Crear mi cuento]
```

### Plan Premium

```
Tu link personalizado con producto:
https://nubekids.io/?tenant=TU_ID&item=NOMBRE_PRODUCTO&item_image=URL_FOTO

Ejemplo:
https://nubekids.io/?tenant=zapatos-lopez-001&item=Nike+Air+Max+90+Kids+Rojo&item_image=https://cdn.tutienda.com/products/nike-90.jpg

Cómo generarlo automáticamente:
En tu email de confirmación, tu sistema debe construir la URL
reemplazando NOMBRE_PRODUCTO y URL_FOTO con los datos del pedido.

Parámetros opcionales:
- customer_email=email@padre.com  (pre-rellena el registro si quieren más cuentos)
- ref=checkout                    (tracking de origen)
```

---

## 8. Criterios de "Done" para Fase 10

La fase está completa cuando:

1. ✅ `/?tenant=shoe-store-default` → wizard sin login → cuento generado → PDF descargable
2. ✅ `/?tenant=shoe-store-default&item=Nike+Air+Max&item_image=URL` → foto pre-cargada en Step 3
3. ✅ Tenant sin créditos → mensaje "Promoción no disponible" + oferta B2C
4. ✅ Post-lectura anónimo → CTA "Crear otro" → registro B2C → BuyCredits
5. ✅ Email pre-rellenado en registro si `customer_email` estaba en la URL
6. ✅ Flujo B2C directo sigue funcionando igual que antes (sin regresiones)
7. ✅ Commit + push + deploy en Vercel funcional

---

## 9. Estimación de Esfuerzo

| Paso | Estimación | Complejidad |
|------|-----------|-------------|
| Paso 1: Tipos y servicios puros | 1 sesión | Baja |
| Paso 2: Integración en App.tsx | 1-2 sesiones | Media |
| Paso 3: Pre-rellenado del Wizard | 0.5 sesión | Baja |
| Paso 4: CTA Post-Lectura | 0.5 sesión | Baja |
| Paso 5: Pre-rellenado email | 0.5 sesión | Baja |
| Paso 6: Testing end-to-end | 1 sesión | Media |
| **TOTAL** | **~4-5 sesiones** | **Media** |

---

*Documento listo para revisión. Una vez aprobado por Javier, comenzamos con Paso 1.*