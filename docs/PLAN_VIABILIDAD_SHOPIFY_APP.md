# Plan de Viabilidad e Integración — NubeKids como Shopify App

**Fecha:** 2026-05-06
**Autor:** Claude (análisis técnico-estratégico)
**Estado:** Propuesta para evaluación, no implementación

---

## 0. Veredicto Ejecutivo

**Sí, fuertemente recomendable.** La arquitectura actual de NubeKids B2B Premium está prácticamente diseñada para encajar como Shopify App. El flujo `tenant secret + token one-time + inyección de item + email transaccional` es exactamente lo que una app post-checkout de Shopify dispara. Migrar (mejor: **expandir**) a Shopify App resuelve el cuello de botella operativo más grande del proyecto: el onboarding manual B2B.

**Resumen en una frase:** la palanca de crecimiento más alta y de menor riesgo es publicar una app pública en Shopify App Store que **complemente** (no sustituya) el canal B2B actual.

---

## 1. Por Qué Tiene Sentido (Análisis Estratégico)

### 1.1 El producto encaja naturalmente

NubeKids genera cuentos donde el niño es protagonista y un **producto comprado** tiene poderes mágicos. El "momento" perfecto para activar esto es **inmediatamente después del pago en una tienda online de productos infantiles** (zapatos, ropa, juguetes, libros, mochilas, decoración).

Shopify domina ese segmento:
- ~4.8M tiendas activas globalmente
- Vertical "Baby & Kids" es uno de los top 5 en GMV de Shopify
- Tiendas verticales tipo "kids fashion", "shoes for children", "personalized gifts" son clientes objetivo perfectos

### 1.2 Resuelve el cuello de botella operativo

El walkthrough de producción identifica como riesgo real el **onboarding manual B2B**: cada solicitud son 30 minutos humanos para crear tenant + tenant_owner + credit_account + tenant_secret + email bienvenida. Esto **no escala** más allá de unos pocos clientes/mes.

Una Shopify App resuelve esto:
- Instalación = 1 click en App Store
- OAuth dispara auto-provisioning del tenant en NubeKids
- El comerciante configura sin intervención humana
- El secret se gestiona internamente, nunca expuesto

### 1.3 Distribución y trust signal

- Shopify App Store = canal de descubrimiento masivo
- Aparecer ahí = vetting técnico de Shopify (seguridad, performance, UX)
- Reduce fricción de venta: "está en el App Store" cierra dudas

### 1.4 Modelo de cobro nativo

Shopify Billing API permite cobrar al merchant directamente en su factura mensual de Shopify. Esto:
- Elimina (o reduce) dependencia de Stripe LIVE para el canal Shopify
- Reduce abandono en checkout (no segunda transacción)
- Permite modelos de pricing complejos: subscription + usage-based

---

## 2. Análisis Técnico de Fit

### 2.1 La arquitectura actual ya es 80% compatible

Mapeo del flujo Premium B2B existente vs lo que requiere una Shopify App:

| Componente actual | Reutilizable en Shopify App | Cambio necesario |
|-------------------|------------------------------|-------------------|
| `POST /api/b2b/create-token` | Sí, idéntico | Llamada interna desde webhook handler |
| `tenant_secret` validation | Sí | Reemplazado por Shopify session token |
| `consume_b2b_token()` RPC | Sí, idéntico | Ninguno |
| `TenantConfig` con `integrationLevel: 'premium'` | Sí | Auto-poblado en OAuth callback |
| `injectItemFromCheckout: true` | Sí | Por defecto en tenants Shopify |
| `itemImageBase64` + `itemDescription` desde producto | Sí | Mapear desde Shopify Product API |
| `Setup.tsx` Step 3 pre-rellenado | Sí | Recibe los mismos params via token |
| Email transaccional con URL `/?token=...` | Sí | Disparado desde webhook `orders/paid` |
| Multiagente + RAG + generación | Sí, totalmente | Ninguno |

### 2.2 Lo que hay que construir nuevo

```
shopify/
├── app/
│   ├── routes/
│   │   ├── auth.callback.ts           # OAuth handler
│   │   ├── webhooks.orders-paid.ts    # Trigger story generation
│   │   ├── webhooks.app-uninstalled.ts # Cleanup
│   │   └── billing.ts                  # Shopify Billing
│   ├── admin/                          # Embedded UI (React + Polaris)
│   │   ├── ConfigPage.tsx              # Configurar productos elegibles
│   │   ├── DashboardPage.tsx           # Stats: cuentos generados, conversion
│   │   └── BillingPage.tsx             # Plan + uso
│   └── lib/
│       ├── shopify-client.ts           # SDK wrapper
│       ├── product-eligibility.ts      # Reglas: qué productos disparan
│       └── tenant-provisioner.ts       # Auto-create tenant en NubeKids
└── shopify.app.toml                    # Manifiesto
```

Stack recomendado:
- **Remix** (recomendación oficial Shopify) o Next.js
- **Polaris** (sistema de diseño Shopify obligatorio para admin)
- **App Bridge React** (comunicación con Shopify Admin)
- **Shopify CLI** para dev local + deploy

### 2.3 Flujo end-to-end

```
1. Merchant instala app
   └─> Shopify OAuth
       └─> NubeKids: create tenant (integrationLevel='premium', auto-secret)
       └─> Webhook subscriptions: orders/paid, app/uninstalled

2. Merchant configura en admin embebido
   └─> Selecciona productos elegibles (todos, por colección, por tag)
   └─> Define copy del email transaccional
   └─> Selecciona plan de billing (Shopify charges)

3. Customer compra producto elegible
   └─> Shopify webhook orders/paid → NubeKids
       └─> Por cada line_item elegible:
           └─> POST /api/b2b/create-token con itemImageUrl + itemName
           └─> Shopify sendEmail con URL personalizada

4. Customer abre URL → Wizard pre-rellenado → Genera cuento
   └─> consume_b2b_token() → 1 crédito decrementado del tenant

5. Final del mes: Shopify factura al merchant según uso/plan
```

---

## 3. Modelo Económico

### 3.1 Comisión Shopify (verificar a la fecha de implementación)

A enero 2026 la política era:
- **0%** sobre los primeros **$1M anuales** por app
- **15%** por encima de $1M (antes era 20%)

**Implicación**: hasta el primer millón de revenue, el cut adicional es nulo. Esto lo hace **muy atractivo en V1**.

### 3.2 Pricing recomendado en Shopify

Modelo híbrido subscription + usage:

| Plan Shopify | Precio mensual | Cuentos/mes incluidos | Cuento extra |
|--------------|----------------|------------------------|--------------|
| Starter | $29 | 20 | $2.50 |
| Growth | $99 | 100 | $1.50 |
| Scale | $299 | 500 | $0.99 |

Equivale aproximadamente al pricing actual (97€-790€ por packs de 50/200/500), pero en formato suscripción que es lo esperado en App Store.

### 3.3 Comparativa con onboarding manual actual

| Métrica | B2B manual actual | Shopify App |
|---------|-------------------|-------------|
| Tiempo onboarding por cliente | 30 min humanos + 5-7 días | <5 min, automático |
| Coste de captación | Outreach 1-a-1 | Listing + ads en App Store |
| Capacidad de escalado | ~5-10 clientes/mes | Cientos/mes posibles |
| Friction de cobro | Stripe Checkout (segunda compra) | Shopify Billing (factura existente) |
| Churn risk | Alto (depende soporte humano) | Bajo (autoservicio) |

---

## 4. Plan de Implementación por Fases

### Fase 0 — Decisión y validación (1 semana)

- [ ] Confirmar política actual de revenue share Shopify (verificar en partners.shopify.com)
- [ ] Crear cuenta de Shopify Partner (gratis)
- [ ] Crear development store para pruebas
- [ ] Decidir: ¿Remix o Next.js? (recomendado: Remix, soporte oficial)
- [ ] Decidir: ¿deprecar B2B manual o coexistir? (recomendado: coexistir, B2B custom es valuable para clientes grandes)

### Fase 1 — MVP de la app (4 semanas)

**Semana 1: Esqueleto + OAuth**
- Bootstrap Remix app con Shopify CLI
- OAuth flow + session storage (Supabase reutilizable)
- Tenant auto-provisioner: instalación → crear tenant en NubeKids con `integrationLevel='premium'`

**Semana 2: Webhooks + generación**
- Webhook handler `orders/paid` con HMAC verification
- Lógica de elegibilidad de productos (tags, collections, all)
- Llamada a `/api/b2b/create-token` interna
- Email transaccional vía Shopify (o SendGrid si quedamos fuera de Shopify Email)

**Semana 3: Admin UI embebida**
- React + Polaris + App Bridge
- Página de configuración (elegibilidad, copy email, branding)
- Dashboard básico (cuentos generados últimos 30 días, créditos restantes)

**Semana 4: Billing + testing**
- Integración Shopify Billing API (subscription)
- Testing end-to-end en dev store
- Documentación interna

### Fase 2 — Submission y revisión (2-3 semanas)

- [ ] Listing copy (descripción, keywords, screenshots, demo video)
- [ ] Cumplir requisitos del Shopify App Review (security, performance, UX)
- [ ] Política de privacidad pública específica para Shopify App
- [ ] Submission al App Store
- [ ] Iteración con feedback del review (típicamente 1-2 rondas)

**Lead time real esperado:** 4-6 semanas desde submission hasta listing público.

### Fase 3 — Lanzamiento y crecimiento (continuo)

- [ ] Setup analytics (Shopify built-in + GA + custom NubeKids)
- [ ] Estrategia de marketing en App Store (ads, SEO, partnerships)
- [ ] Iterar en feedback merchant: features (A/B test stories, multilingüe, custom branding)
- [ ] Considerar canales paralelos: WooCommerce plugin (Fase 4), Wix App (Fase 5)

---

## 5. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Rechazo en App Review | Media | Alto (retraso 4-6 semanas) | Seguir checklist oficial, iterar rápido |
| Cambios en política Shopify (cut, requisitos) | Baja-media | Medio | Diversificar canales (B2B custom + WooCommerce eventual) |
| Performance del PDF en mobile dentro de Shopify Storefront | Media | Medio | Ya validado en Vercel; testear en Shopify storefront iframe |
| Quejas de merchants por cuentos de baja calidad | Baja | Alto | RAG + multiagente ya validados, monitorizar feedback |
| Competencia entrando | Media | Medio | First-mover en "AI children stories from product" — moat = data RAG + prompts curados |
| Lock-in en Shopify | Media | Bajo | Coexistencia con B2B custom mantiene leverage |
| Coste de mantenimiento del SDK Shopify | Baja | Bajo | Stack oficial Remix tiene mantenimiento de Shopify |

---

## 6. Coexistencia con B2B Custom Actual

**No matar** el flujo B2B actual. Razones:
1. Hay clientes grandes (chains, wholesale) que prefieren integración custom
2. Hay tiendas no-Shopify (WooCommerce, Magento, custom) que son mercado válido
3. El código ya está hecho y funcional

**Estrategia**:
- B2B custom = canal "enterprise" / contratos grandes / acuerdos directos
- Shopify App = canal self-serve / SMB / volumen
- Ambos comparten el mismo backend de generación, RAG, y créditos

**Diferenciación de tenants en código:**
```typescript
// src/types.ts (ya existe la estructura)
interface TenantConfig {
  integrationLevel: 'premium' | 'standard' | 'b2c';
  // Nuevo (propuesto):
  source: 'manual' | 'shopify' | 'woocommerce' | 'self-serve';
  shopifyDomain?: string;
  // ...
}
```

---

## 7. Decisión Recomendada y Next Steps

### Recomendación

**Proceder con Fase 0 (Decisión y validación) inmediatamente** después de cerrar el go-live actual (dominio + legales + OAuth). El timing ideal es:

1. **Mayo 2026**: Cerrar producción canal B2B custom + B2C (1-2 semanas)
2. **Junio 2026**: Fase 0 + arranque Fase 1 MVP Shopify App (4 semanas)
3. **Julio 2026**: Submission al App Store (2-3 semanas review)
4. **Agosto 2026**: Listing público + primeros installs

### Por qué este orden

- El canal B2B actual genera revenue mientras se construye Shopify App
- La validación de Premium en clientes reales (canal manual) refina los prompts/RAG antes de exponerlo a cientos de tiendas
- Reduce riesgo: si la app tiene un bug crítico, no queda como única fuente de revenue

### Inversión estimada

- **Engineering**: 6-8 semanas (1 dev full-time)
- **Diseño**: 1-2 semanas (mockups admin embebido + listing)
- **Legal**: política privacy específica Shopify (~500€)
- **Shopify Partner account**: gratis
- **Marketing inicial App Store**: presupuesto opcional, $500-2000/mes en ads recomendado

### Retorno esperado (escenario conservador)

Asumiendo:
- Listing live en agosto 2026
- 10-30 installs/mes durante primeros 6 meses
- Conversion rate install → paying = 30%
- ARPU = $99/mes (plan Growth)

→ Mes 6 post-launch: ~30-90 paying merchants × $99 = **$3K-$9K MRR**
→ Año 1 post-launch (proyección): **$50K-$200K ARR** solo del canal Shopify

Comparativa: el canal B2B manual actual está limitado por capacidad humana a ~5-10 clientes nuevos/mes en condiciones óptimas.

---

## 8. Preguntas Abiertas

1. ¿Hay claridad sobre la marca: "NubeKids" se mantiene en Shopify o se crea una sub-marca específica para el canal Shopify?
2. ¿Hay capacity para mantener dos canales (B2B custom + Shopify App) en paralelo durante el primer año?
3. ¿Hay relación con algún partner/agencia Shopify que pueda acelerar la review?
4. ¿Se quiere ofrecer multi-idioma desde el primer día o lanzar solo español/inglés y expandir?
5. ¿Modelo de cobro = solo Shopify Billing, o ofrecemos también card-on-file para cuando el merchant quiera?

---

## 9. Conclusión

La arquitectura técnica actual es **prácticamente una Shopify App esperando a ser empaquetada**. El flujo Premium B2B (token + item injection + email transaccional) es el patrón canónico de una post-purchase app de Shopify. El esfuerzo de implementación es razonable (6-8 semanas), el riesgo es bajo (coexiste con canal actual), y el upside de distribución es 10-100x superior al onboarding manual.

**Recomendación firme: hacerlo, después de cerrar el go-live actual.** No esperar 6 meses; el momento óptimo es Q3 2026.
