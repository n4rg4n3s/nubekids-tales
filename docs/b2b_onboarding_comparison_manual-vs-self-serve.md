# B2B Onboarding Comparison: Alta Manual Asistida vs Self-Serve

> Fecha: 2026-04-04
> Contexto: NubeKids MVP comercial
> Objetivo: comparar de forma concreta las dos opciones de onboarding B2B para este código base actual.

---

## 1. Estado actual del código

Hoy el SaaS permite:

- B2C: registro/login, compra de créditos y generación de cuentos
- B2B cliente final: acceso anónimo vía `?token=...`, consumo one-time de crédito del tenant y conversión posterior a B2C

Hoy el SaaS no permite todavía:

- alta pública de `tenant_owner`
- creación autónoma de `tenant`
- compra B2B desde cero por parte de una tienda no provisionada

### Restricciones reales del código actual

- [SignUpPage.tsx](/d:/nubekids-tales/src/components/auth/SignUpPage.tsx) no diferencia tipo de cuenta
- [LoginPage.tsx](/d:/nubekids-tales/src/components/auth/LoginPage.tsx) no diferencia flujo B2B/B2C
- [authService.ts](/d:/nubekids-tales/src/services/authService.ts) registra solo email, password y `displayName`
- [001_profiles_and_trigger.sql](/d:/nubekids-tales/supabase/migrations/001_profiles_and_trigger.sql) crea perfiles con `role = 'b2c_user'` por defecto
- [create-checkout.ts](/d:/nubekids-tales/api/stripe/create-checkout.ts) necesita `tenantId` o `userId`
- [BuyCreditsB2B.tsx](/d:/nubekids-tales/src/components/credits/BuyCreditsB2B.tsx) muestra catálogo B2B, pero solo compra si ya existe contexto de tenant

Conclusión:

- el problema no es de pricing ni de catálogo
- el problema pendiente es provisioning / onboarding B2B

---

## 2. Opción A: Alta Manual Asistida

### Qué significa

Flujo:

1. La tienda llega a la landing B2B
2. Hace clic en CTA tipo "Quiero activar mi tienda"
3. Deja sus datos o contacta
4. NubeKids crea manualmente:
   - `tenant`
   - `tenant_owner`
   - asociación `tenant_id`
5. La tienda ya puede entrar, comprar packs B2B y operar con su contexto correcto

### Lo que habría que implementar

Mínimo:

- CTA B2B claro en `public/b2b.html`
- canal de captación: email, formulario simple o lead form
- procedimiento interno de alta manual
- opcional: documentación interna de provisioning

### Lo que NO hace falta tocar todavía

- selector B2B/B2C en auth
- creación pública de tenants
- flujo self-serve de ownership
- RLS nuevas para provisioning público
- validación automática de negocio

### Coste estimado para este código base

Ingeniería:

- bajo
- estimación: 0.5 a 1.5 días

Operación:

- media a nivel humano
- cada nueva tienda requiere intervención manual

### Riesgo técnico

- bajo

Porque:

- no toca la base de auth de forma estructural
- no cambia la lógica de roles por defecto
- no expone endpoints nuevos de provisioning
- no añade estados intermedios de onboarding incompleto

### Riesgo de producto

- bajo a medio

Porque:

- genera fricción para la tienda
- pero esa fricción es asumible si el volumen B2B todavía es bajo

### Ventajas

- salida al mercado rápida
- máxima claridad operativa
- menos superficie de bugs en pagos y permisos
- permite aprender del onboarding real antes de automatizarlo

### Inconvenientes

- no escala bien si entran muchas tiendas
- depende de intervención manual
- experiencia menos “producto SaaS puro”

---

## 3. Opción B: Self-Serve B2B

### Qué significa

Flujo:

1. La tienda llega a la landing B2B
2. Selecciona “Crear cuenta de tienda”
3. Elige tipo de cuenta B2B o B2C
4. Introduce datos de negocio
5. El sistema crea:
   - cuenta auth
   - `profile.role = tenant_owner`
   - `tenant`
   - vínculo `tenant_id`
6. La tienda entra directamente a comprar packs B2B

### Lo que habría que implementar

Auth / UI:

- selector de tipo de cuenta en signup o bifurcación de pantallas
- formulario B2B con datos de negocio
- copy y validaciones específicas

Base de datos / lógica:

- creación segura de `tenant`
- asignación de `tenant_owner`
- posible revisión de policies / RLS
- control de ownership y duplicados
- handling de errores de provisioning parcial

Compra / producto:

- ruta clara post-registro B2B
- compra B2B conectada a tenant recién creado
- estados de “tenant creado pero no activado” si aplica

### Coste estimado para este código base

Ingeniería:

- alto respecto al estado actual
- estimación: 4 a 8 días de trabajo real

Ese rango depende de si se incluye:

- validación seria de negocio
- recuperación de errores
- UX pulida
- pruebas de onboarding completas

### Riesgo técnico

- medio a alto

Porque:

- toca auth
- toca roles
- toca provisioning
- toca compra B2B
- introduce más combinaciones de estados y permisos

### Riesgo de producto

- medio

Porque:

- parece más escalable
- pero puede consumir tiempo antes de validar si realmente hace falta

### Ventajas

- experiencia SaaS más autónoma
- menor dependencia operativa a futuro
- onboarding más escalable si el volumen crece

### Inconvenientes

- mucha más complejidad ahora mismo
- más puntos de fallo
- más tiempo antes de tener una solución estable
- alta probabilidad de sobreconstrucción para el momento actual del proyecto

---

## 4. Comparación Directa

| Criterio | Alta manual asistida | Self-serve B2B |
|---|---|---|
| Tiempo de implementación | 0.5 a 1.5 días | 4 a 8 días |
| Riesgo técnico | Bajo | Medio/alto |
| Cambios en auth | Casi ninguno | Importantes |
| Cambios en DB / roles | Mínimos o nulos | Importantes |
| Escalabilidad operativa | Baja | Alta |
| Encaje con el estado actual del repo | Muy alto | Medio |
| Adecuado si no hay volumen de leads | Sí | Normalmente no |
| Adecuado si el cuello de botella ya es operativo | No | Sí |

---

## 5. Recomendación para NubeKids hoy

Dado que la respuesta actual es:

- no hay todavía volumen de leads B2B suficiente como para que el cuello de botella sea el alta manual

la recomendación para este código base es:

### Recomendación

- elegir **Alta Manual Asistida** como V1 B2B real
- posponer **Self-Serve B2B** para una fase posterior

### Por qué

- es la decisión más rápida
- es la decisión menos frágil
- protege auth, roles, RLS y pagos de una complejidad prematura
- permite aprender del onboarding comercial real antes de automatizarlo

---

## 6. Implementación recomendada si se elige Alta Manual Asistida

### Fase mínima

1. Landing B2B con CTA explícito:
   - “Quiero activar mi tienda”
2. Canal de entrada:
   - email o formulario simple
3. Procedimiento interno:
   - crear tenant
   - crear/ajustar `tenant_owner`
   - enviar acceso
4. Compra B2B:
   - solo para usuarios ya provisionados

### Beneficio

Esto resuelve el problema comercial real sin abrir todavía un frente técnico grande.

---

## 7. Cuándo tendría sentido pasar a Self-Serve

Se justificaría cuando ocurra al menos una de estas:

- entran suficientes leads como para que el alta manual ralentice ventas
- el equipo ya haya validado el onboarding B2B ideal con varios casos reales
- exista ya un dashboard tenant más sólido
- se quiera escalar captación sin intervención comercial directa

---

## 8. Conclusión

Para el NubeKids actual:

- **Alta manual asistida** es la mejor decisión de MVP
- **Self-serve B2B** es una mejora futura, no una urgencia actual

No porque self-serve sea mala idea, sino porque hoy sería una inversión técnica demasiado grande para el estado real del producto y del pipeline comercial.
