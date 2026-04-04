# Guia Operativa B2B: Activacion de Tenant y Test de Tokens One-Time

> Uso: onboarding asistido, QA y demos comerciales
> Fecha: 2026-04-04

---

## Objetivo

Esta guia cubre el circuito operativo completo de V1:

1. dar de alta un tenant B2B
2. activar la cuenta `tenant_owner`
3. cargar saldo de prueba
4. emitir tokens nuevos de test
5. demostrar a la tienda que cada enlace es de un solo uso

---

## Parte 1: Activar un tenant B2B de prueba

### 1. Crear el usuario en Supabase Auth

En `Authentication > Users`, crear:

- `tenant.owner.test@nubekids.local`

Esto creara automaticamente su fila en `public.profiles`.

---

### 2. Crear el tenant en `public.tenants`

Ejemplo de tenant de test ya usado:

- `tenant_id`: `tenant-b2b-test`
- `brand_name`: `PequeModa Test`
- `integration_level`: `premium`

El tenant necesita:

- `tenant_id` publico
- branding
- `integration_secret_hash`

---

### 3. Calcular el SHA-256 del secreto de integracion

En PowerShell:

```powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes("nk_test_secret_2026")
$sha = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha.ComputeHash($bytes)
-join ($hash | ForEach-Object { $_.ToString("x2") })
```

Secreto plano de ejemplo:

```txt
nk_test_secret_2026
```

Ese secreto en claro se guarda fuera de la base de datos. En `tenants.integration_secret_hash` solo va el hash.

---

### 4. Asociar el usuario como `tenant_owner`

Ejemplo ya validado:

```sql
update public.profiles
set
  role = 'tenant_owner',
  tenant_id = 'tenant-b2b-test',
  display_name = 'Tenant Owner Test'
where id = 'UUID_DEL_USUARIO_TENANT_OWNER';
```

---

### 5. Crear saldo inicial para el tenant

```sql
insert into public.credit_accounts (
  tenant_id,
  balance,
  total_purchased,
  total_consumed
)
values (
  'tenant-b2b-test',
  10,
  10,
  0
);
```

---

### 6. Verificacion minima del alta

```sql
select id, role, display_name, tenant_id
from public.profiles
where id = 'UUID_DEL_USUARIO_TENANT_OWNER';

select tenant_id, balance, total_purchased, total_consumed
from public.credit_accounts
where tenant_id = 'tenant-b2b-test';
```

Resultado esperado:

- `role = tenant_owner`
- `tenant_id = tenant-b2b-test`
- `balance >= 1`

---

## Parte 2: Activar un usuario B2C de prueba

Crear en `Authentication > Users`:

- `b2c.user.test@nubekids.local`

Luego:

```sql
update public.profiles
set
  role = 'b2c_user',
  tenant_id = null,
  display_name = 'B2C User Test'
where id = 'UUID_DEL_USUARIO_B2C';

insert into public.credit_accounts (
  user_id,
  balance,
  total_purchased,
  total_consumed
)
values (
  'UUID_DEL_USUARIO_B2C',
  10,
  10,
  0
);
```

Esto sirve para validar que el flujo B2C no ha quedado roto tras cambios B2B.

---

## Parte 3: Regla principal de los tests B2B

Cada prueba necesita un token nuevo.

No reutilizar:

- tokens ya consumidos
- tokens con `is_used = true`

Convencion recomendada:

- `nkt_manual_test_001`
- `nkt_manual_test_002`
- `nkt_manual_test_003`

---

## Parte 4: Metodo rapido de test por SQL

### 1. Insertar un token nuevo

Ejemplo:

```sql
insert into public.tokens (
  token,
  tenant_id,
  brand_name,
  item_name,
  item_image_url,
  customer_email,
  is_used,
  expires_at
)
values (
  'nkt_manual_test_002',
  '0d263ca1-dba7-43af-ad56-fa10e74ce567',
  'PequeModa Test',
  'Zapatillas Test 002',
  'https://via.placeholder.com/800x1000.png?text=Producto+Test+002',
  'cliente.test.002@ejemplo.com',
  false,
  timezone('utc', now()) + interval '7 days'
);
```

### 2. Abrir la URL

```txt
https://TU_DOMINIO/?token=nkt_manual_test_002
```

### 3. Generar un cuento completo

### 4. Verificar resultado

```sql
select token, is_used, used_at
from public.tokens
where token = 'nkt_manual_test_002';

select tenant_id, balance, total_purchased, total_consumed
from public.credit_accounts
where tenant_id = 'tenant-b2b-test';
```

Resultado esperado:

- `is_used = true`
- `used_at` con timestamp
- `balance` disminuye en 1
- `total_consumed` aumenta en 1

### 5. Verificar reutilizacion bloqueada

Volver a abrir:

```txt
https://TU_DOMINIO/?token=nkt_manual_test_002
```

Ya no debe permitir una segunda generacion valida.

---

## Parte 5: Metodo realista de test por API

Este es el metodo que mejor demuestra a un tenant tecnico como funcionara la integracion real.

### 1. Llamar a `/api/b2b/create-token`

```http
POST /api/b2b/create-token
Content-Type: application/json
x-nubekids-tenant-secret: nk_test_secret_2026
```

Body:

```json
{
  "tenantId": "tenant-b2b-test",
  "itemName": "Zapatillas Test API",
  "itemImageUrl": "https://via.placeholder.com/800x1000.png?text=Producto+API",
  "customerEmail": "cliente.api.test@ejemplo.com",
  "expiresInHours": 24
}
```

### 2. Abrir la URL devuelta

La respuesta devuelve:

- `token`
- `url`
- `expiresAt`

Abrir `url` y generar el cuento.

### 3. Verificar en SQL

```sql
select token, is_used, used_at, expires_at
from public.tokens
order by created_at desc
limit 5;

select tenant_id, balance, total_purchased, total_consumed
from public.credit_accounts
where tenant_id = 'tenant-b2b-test';
```

---

## Parte 6: Checklist de demo comercial

Cuando una tienda quiera comprobar el sistema, enseñar siempre estas pruebas:

1. primer acceso con token nuevo: el cuento se genera correctamente
2. mismo enlace reutilizado: ya no sirve
3. el saldo del tenant baja exactamente en 1
4. el cuento final muestra la experiencia real del usuario
5. el tenant puede repetir la prueba con un token distinto

---

## Siguientes mejoras recomendadas

1. Preparar una coleccion Postman para `/api/b2b/create-token`
2. Crear un tenant demo mas neutro para presentaciones comerciales
3. Añadir un mini backoffice para emitir tokens de prueba sin SQL manual
