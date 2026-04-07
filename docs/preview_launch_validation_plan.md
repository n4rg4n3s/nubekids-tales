# Preview Launch Validation Plan

> Fecha: 2026-04-06
> Rama de trabajo: `preview/fase11-launch-readiness`
> Objetivo: validar el cierre real de Fase 10 y preparar Fase 11 sin tocar `main`

---

## 1. Principio de trabajo

No usar `main` para validación. El flujo recomendado es:

1. Trabajar y desplegar en `preview/fase11-launch-readiness`
2. Validar allí los flujos críticos con entorno lo más parecido posible a producción
3. Cerrar gaps operativos/comerciales detectados
4. Hacer merge a `main` solo cuando la checklist de salida esté en verde
5. Ejecutar después el cutover real de dominio / DNS / OAuth / webhook definitivo

---

## 2. Qué entra en esta rama preview

### Sí entra

- Sincronización de precios B2B (`landing` + `Stripe` + `Supabase` + UI)
- Validación manual end-to-end de flujos B2C, B2B token y B2B2C
- Verificación real de `/api/b2b/create-token`
- Preparación de tenant demo estable para demos comerciales
- Snippet o colección Postman para demos B2B
- Publicación y enlace de páginas legales si ya están listas
- Ajustes de bugs o regresiones que aparezcan durante la validación

### No entra como requisito previo al merge

- Compra de dominio
- Configuración DNS definitiva
- Webhook Stripe con URL de dominio final
- Google OAuth definitivo con dominio propio

Esos cuatro puntos son de cutover, no de hardening previo.

---

## 3. Orden de ejecución recomendado

### Bloque A — Hardening comercial y coherencia

1. Sincronizar precios B2B en todos los puntos de verdad.
2. Confirmar qué pricing queda como definitivo.
3. Revisar la landing B2B, `credit_packs`, `BuyCredits` y documentación para que no haya divergencias.

### Bloque B — Validación preview end-to-end

1. Desplegar la rama preview.
2. Validar flujo B2C completo.
3. Validar flujo B2B real por `?token=...`.
4. Validar flujo B2B demo `?tenant=...&demo=1`.
5. Validar flujo B2B → B2C (`post-story`, registro, recompra).
6. Verificar generación real con Gemini.
7. Verificar compra de créditos y pantallas de éxito.

### Bloque C — Operativa B2B real

1. Probar `POST /api/b2b/create-token` con el secreto del tenant de test.
2. Verificar consumo one-time: `tokens.is_used = true` y decremento de `credit_accounts.balance`.
3. Dejar tenant demo estable con saldo controlado y runbook comercial.
4. Preparar snippet o Postman collection para demos técnicas a tiendas.

### Bloque D — Cierre de lanzamiento

1. Publicar/enlazar legal si los textos quedan aprobados.
2. Revisar `b2b_activation_requests` y confirmar el circuito manual operativo.
3. Decidir si la rama está lista para merge a `main`.
4. Después del merge, ejecutar dominio + DNS + webhook final + OAuth final.

---

## 4. Checklist de validación en preview

### A. Plataforma

- `npm run lint` verde
- `npm run build` verde
- Preview deployment accesible
- Variables de entorno correctas en preview

### B. Flujo B2C

- Usuario nuevo puede registrarse
- Usuario autenticado completa wizard
- Se genera cuento completo
- Se visualiza `Book`
- Export PDF funciona
- Compra B2C inicia checkout correctamente

### C. Flujo B2B real

- Se emite token con `/api/b2b/create-token`
- La URL `/?token=...` abre la experiencia correcta
- El token solo funciona una vez
- Tras el uso, `tokens.is_used = true`
- El saldo del tenant baja exactamente en 1
- Si el tenant no tiene saldo, aparece `promo-unavailable`

### D. Flujo B2B demo / comercial

- `?tenant=...&demo=1` sigue funcionando solo como demo
- `item`, `item_image` y `customer_email` se pre-rellenan correctamente
- Fallback de imagen externa no rompe el flujo
- `post-story` muestra CTA correcto
- Registro B2C desde `post-story` funciona

### E. UX / regresión

- Wizard correcto en desktop
- Wizard correcto en móvil
- Sin rastros semánticos de `shoe-store` / `fashion-store` en el copy
- `itemInteractionMode` gobierna el comportamiento esperado
- Book y lectura sin regresiones visuales

### F. Operativa / negocio

- Precios B2B sincronizados en todos los puntos
- Tenant demo estable disponible
- Runbook de demo B2B usable por negocio
- Snippet/Postman listo para enseñar a e-Commerce

---

## 5. Criterio de salida hacia `main`

La rama preview se considera lista para merge cuando:

1. No hay divergencias de precio entre landing, Stripe, `credit_packs` y UI.
2. Los flujos B2C, B2B real y B2B2C están validados en preview.
3. `/api/b2b/create-token` está probado end-to-end.
4. Existe un tenant demo estable para validación comercial.
5. La operativa manual de activación B2B está documentada y comprobada.
6. No quedan regresiones funcionales abiertas de severidad alta.

---

## 5.1 Estado tras validación real (06 Abril 2026)

Resultado actual:

- Preview deployment validado en Vercel sobre `preview/fase11-launch-readiness`
- Flujos B2C, B2B real por `?token=...` y B2B2C revisados con éxito
- `/api/b2b/create-token` validado end-to-end
- Permisos GitHub/Vercel corregidos tras migrar el repo a `n4rg4n3s/nubekids-tales`

Cambios añadidos tras esa validación:

- `Book` móvil reforzado: en `portrait` muestra aviso `Gira el móvil` y en `landscape` entra en modo de lectura inmersivo sin barra inferior
- Export PDF móvil rehecha: el visor genera `Blob` y ofrece flujo `Guardar o compartir` / `Abrir PDF` / `Descargar archivo`

Conclusión:

- la preview queda validada funcionalmente
- la rama no debe considerarse lista para merge a `main` hasta revalidar manualmente estos cambios en iPhone/Android y cerrar dominio/legal

---

## 6. Riesgos a vigilar durante la preview

- Usar datos o créditos reales de tenants que no sean de test
- Ejecutar compras reales innecesarias con Stripe LIVE
- Confundir links demo `?tenant=` con links comerciales `?token=...`
- Validar solo el frontend sin comprobar el estado final en Supabase

---

## 7. Siguiente foco recomendado

El siguiente trabajo a ejecutar en esta rama debe ser:

1. Revalidar en iPhone/Android el nuevo flujo móvil de `Book`
2. Revalidar en iPhone/Android el nuevo flujo de export PDF
3. Solo después, decidir merge a `main` y rematar dominio/legal

Ese orden cierra la última incertidumbre funcional relevante antes del merge.
