# BUSINESS_TECH_SPEC.md — NubeKids Platform
# Especificación Técnica de Negocio: Auth, Pagos, Créditos, Integración e-Commerce

> **Versión:** 1.0
> **Fecha:** 2026-03-30
> **Estado:** Aprobado para implementación
> **Audiencia:** Desarrollador junior que implementará estas features

> **Nota 2026-04-04:** Este documento sigue siendo válido en negocio y flujos, pero el comportamiento narrativo del objeto ya no debe deducirse de `shoe-store` / `fashion-store`. La fuente de verdad actual es `itemInteractionMode`. Además, la decisión operativa vigente para B2B V1 es onboarding manual asistido, no self-serve.

---

## 0. Resumen Ejecutivo

Este documento cubre TODO lo que falta para que NubeKids sea un producto comercial:

1. **Autenticación** — Cuentas de usuario con Supabase Auth (email + Google OAuth)
2. **Roles y Permisos** — Quién puede hacer qué
3. **Sistema de Créditos** — Moneda interna para limitar y cobrar generaciones
4. **Pagos con Stripe** — Cobrar a tenants B2B y usuarios B2C
5. **Dos niveles de integración B2B** — Standard (link) vs Premium (widget con foto inyectada)
6. **Flujo e-Commerce → NubeKids → B2C** — El funnel completo de conversión
7. **API REST** — Endpoints para webhooks de e-Commerce
8. **Email transaccional** — Envío de links de sesión
9. **Landing y dominio** — Lo mínimo para salir al mercado
10. **Bug de imágenes** — Diagnóstico y fix

---

## 1. Modelo de Negocio Definitivo

### 1.1 Actores del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                    NUBEKIDS (Plataforma)                 │
│                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐  │
│  │ ADMIN       │    │ TENANT B2B  │    │ USUARIO B2C  │  │
│  │ (NubeKids)  │    │ (e-Commerce)│    │ (Padre/Madre)│  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬───────┘  │
│         │                  │                   │         │
│    Gestiona todo     Compra créditos     Compra créditos │
│    Crea tenants      Configura widget    Crea cuentos    │
│    Ve métricas       Ve dashboard        Descarga PDF    │
│    Cobra                                                 │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Flujos de Dinero

```
CANAL B2B (e-Commerce paga):
  e-Commerce compra pack créditos → NubeKids
  Cliente del e-Commerce genera cuento → gasta 1 crédito del tenant
  El cuento es GRATIS para el cliente final

CANAL B2C (Padre paga):
  Padre llega a nubekids.io (directo o redirigido desde B2B)
  Padre compra pack de créditos → NubeKids
  Padre genera cuento → gasta 1 crédito personal
```

### 1.3 Pricing B2B (Créditos Prepago para e-Commerce)

Dos niveles de servicio. La diferencia técnica es si inyectan foto del producto o solo el nombre de la tienda.

#### Plan Standard (Link-based)
El e-Commerce recibe un link personalizado. El nombre de la tienda se teje en la narrativa del cuento ("en la tienda mágica de Zapatos López..."). NO se inyecta foto del producto.

| Pack | Cuentos | Precio | Por cuento |
|------|---------|--------|------------|
| Starter | 50 | 25€ | 0.50€ |
| Growth | 200 | 79€ | 0.40€ |
| Scale | 500 | 159€ | 0.32€ |

#### Plan Premium (Widget con foto del producto)
El e-Commerce integra un snippet de código en su checkout. La foto del producto comprado se inyecta automáticamente en el wizard del cuento como "objeto mágico".

| Pack | Cuentos | Precio | Por cuento |
|------|---------|--------|------------|
| Starter | 50 | 39€ | 0.78€ |
| Growth | 200 | 129€ | 0.65€ |
| Scale | 500 | 259€ | 0.52€ |

> **Por qué Premium es más caro:** Mayor consumo de API (imagen adicional procesada por Gemini), soporte técnico para integración, y mayor valor percibido (el producto real aparece en el cuento).

### 1.4 Pricing B2C (Packs para Padres)

| Pack | Cuentos | Precio |
|------|---------|--------|
| Prueba | 1 | 2.99€ |
| Familia | 3 | 6.99€ |
| Regala Magia | 5 | 9.99€ |

> Sin suscripción en V1. Packs de un solo pago. Razón: el churn de suscripciones para este producto sería muy alto. Mejor capturar valor upfront.

---

## 2. Autenticación (Supabase Auth)

### 2.1 Decisión Técnica

Usar **Supabase Auth** (ya integrado) con:
- Email + password (todos los roles)
- Google OAuth (todos los roles)
- Magic links por email (para sesiones temporales B2B → B2C)

### 2.2 Roles del Sistema

```typescript
// src/types.ts — AÑADIR

export type UserRole = 'admin' | 'tenant_owner' | 'tenant_member' | 'b2c_user' | 'anonymous_session';

/**
 * ROLES:
 *
 * admin           → Equipo NubeKids. Acceso total. CRUD tenants, métricas globales.
 * tenant_owner    → Dueño del e-Commerce. Gestiona SU tenant: branding, créditos, métricas.
 * tenant_member   → Empleado del e-Commerce con acceso limitado al dashboard (futuro V2).
 * b2c_user        → Padre/madre registrado en nubekids.io. Compra créditos, genera cuentos.
 * anonymous_session → Usuario temporal que llega vía link del e-Commerce. Sin cuenta.
 *                    Puede generar UN cuento (gratis, crédito del tenant).
 *                    Al terminar se le invita a registrarse como b2c_user.
 */
```

### 2.3 Tablas en Supabase

```sql
-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'b2c_user',
  display_name TEXT,
  avatar_url TEXT,
  tenant_id TEXT REFERENCES public.tenants(id),  -- NULL para b2c_user y admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipo enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'tenant_owner', 'tenant_member', 'b2c_user');

-- RLS: cada usuario solo ve su propio perfil (excepto admin)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TABLA: tenants (AMPLIAR la existente)
-- ============================================================
-- Ya existe parcialmente. Añadir estos campos:
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS
  owner_id UUID REFERENCES auth.users(id),
  plan_level TEXT DEFAULT 'standard' CHECK (plan_level IN ('standard', 'premium')),
  credits_balance INTEGER DEFAULT 0,
  credits_total_purchased INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,  -- NULL si solo compra packs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW();
```

### 2.4 Trigger para Crear Perfil Automáticamente

```sql
-- Cuando un usuario se registra en Supabase Auth,
-- se crea automáticamente un perfil en public.profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'b2c_user',  -- Por defecto todos son B2C
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2.5 Componente de Auth en React

```typescript
// src/services/authService.ts — CREAR

import { createClient, User, Session } from '@supabase/supabase-js';

// IMPORTANTE: Reutilizar el mismo cliente Supabase (fix del warning "Multiple GoTrueClient")
// Crear UN solo archivo src/lib/supabase.ts que exporte el cliente singleton
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

// ── Registro con email ──
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName }
    }
  });
  if (error) throw error;
  return data;
}

// ── Login con email ──
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ── Login con Google OAuth ──
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
  return data;
}

// ── Obtener rol del usuario ──
export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return 'b2c_user';
  return data.role as UserRole;
}

// ── Logout ──
export async function signOut() {
  await supabase.auth.signOut();
}

// ── Hook de React ──
// src/hooks/useAuth.ts — CREAR
/**
 * Hook que escucha cambios de autenticación.
 * Provee: user, session, role, loading, signIn, signUp, signOut
 *
 * Uso:
 *   const { user, role, loading } = useAuth();
 *   if (loading) return <Spinner />;
 *   if (!user) return <LoginPage />;
 *   if (role === 'tenant_owner') return <TenantDashboard />;
 *   return <B2CApp />;
 */
```

### 2.6 Flujo de Google OAuth en Supabase

```
1. Ir a Supabase Dashboard > Authentication > Providers > Google
2. Habilitar Google provider
3. Ir a Google Cloud Console > APIs & Services > Credentials
4. Crear OAuth 2.0 Client ID (tipo: Web application)
5. Authorized redirect URIs: https://eyirhuxpqaneiehnmguq.supabase.co/auth/v1/callback
6. Copiar Client ID y Client Secret en Supabase
7. En el frontend, llamar a signInWithGoogle() — Supabase maneja todo el flujo OAuth
```

---

## 3. Sistema de Créditos

### 3.1 Tabla de Créditos

```sql
-- ============================================================
-- TABLA: credit_accounts (balance de créditos por entidad)
-- ============================================================
CREATE TABLE public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Polimórfico: puede pertenecer a un tenant O a un usuario B2C
  tenant_id TEXT REFERENCES public.tenants(id),  -- NULL si es B2C
  user_id UUID REFERENCES auth.users(id),         -- NULL si es tenant
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: exactamente uno de los dos debe estar presente
  CONSTRAINT credit_owner_check CHECK (
    (tenant_id IS NOT NULL AND user_id IS NULL) OR
    (tenant_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_credit_accounts_tenant ON public.credit_accounts(tenant_id);
CREATE INDEX idx_credit_accounts_user ON public.credit_accounts(user_id);

-- ============================================================
-- TABLA: credit_transactions (historial de movimientos)
-- ============================================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id UUID NOT NULL REFERENCES public.credit_accounts(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus')),
  amount INTEGER NOT NULL,  -- Positivo para purchase/bonus, negativo para consumption
  balance_after INTEGER NOT NULL,
  -- Metadata
  description TEXT,
  stripe_payment_intent_id TEXT,  -- NULL si no es compra
  story_session_id UUID,          -- NULL si no es consumo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_account ON public.credit_transactions(credit_account_id);
CREATE INDEX idx_credit_tx_stripe ON public.credit_transactions(stripe_payment_intent_id);

-- ============================================================
-- TABLA: credit_packs (catálogo de packs disponibles)
-- ============================================================
CREATE TABLE public.credit_packs (
  id TEXT PRIMARY KEY,  -- 'b2b-standard-starter', 'b2c-family', etc.
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('b2b_standard', 'b2b_premium', 'b2c')),
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,  -- En céntimos de euro (2999 = 29.99€)
  currency TEXT DEFAULT 'eur',
  stripe_price_id TEXT,  -- ID del Price en Stripe
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Insertar catálogo inicial
INSERT INTO public.credit_packs (id, name, channel, credits, price_cents, sort_order) VALUES
  -- B2B Standard
  ('b2b-std-starter', 'Starter',  'b2b_standard', 50,  2500,  1),
  ('b2b-std-growth',  'Growth',   'b2b_standard', 200, 7900,  2),
  ('b2b-std-scale',   'Scale',    'b2b_standard', 500, 15900, 3),
  -- B2B Premium
  ('b2b-prm-starter', 'Starter',  'b2b_premium',  50,  3900,  1),
  ('b2b-prm-growth',  'Growth',   'b2b_premium',  200, 12900, 2),
  ('b2b-prm-scale',   'Scale',    'b2b_premium',  500, 25900, 3),
  -- B2C
  ('b2c-trial',       'Prueba',        'b2c', 1,  299,  1),
  ('b2c-family',      'Familia',       'b2c', 3,  699,  2),
  ('b2c-gift',        'Regala Magia',  'b2c', 5,  999,  3);
```

### 3.2 Funciones RPC para Créditos

```sql
-- ============================================================
-- FUNCIÓN: consume_credit
-- Descuenta 1 crédito. Retorna TRUE si había saldo, FALSE si no.
-- Se llama ANTES de iniciar la generación del cuento.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_tenant_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_story_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_account_id UUID;
  v_balance INTEGER;
BEGIN
  -- Buscar cuenta de créditos
  IF p_tenant_id IS NOT NULL THEN
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  ELSE
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;
  END IF;

  -- Si no existe cuenta o no hay saldo
  IF v_account_id IS NULL OR v_balance < 1 THEN
    RETURN FALSE;
  END IF;

  -- Descontar
  UPDATE public.credit_accounts
  SET balance = balance - 1,
      total_consumed = total_consumed + 1,
      updated_at = NOW()
  WHERE id = v_account_id;

  -- Registrar transacción
  INSERT INTO public.credit_transactions
    (credit_account_id, type, amount, balance_after, story_session_id, description)
  VALUES
    (v_account_id, 'consumption', -1, v_balance - 1, p_story_session_id, 'Story generation');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: add_credits
-- Añade créditos tras un pago exitoso de Stripe.
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_credits(
  p_tenant_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_amount INTEGER DEFAULT 0,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Credit purchase'
)
RETURNS INTEGER AS $$
DECLARE
  v_account_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Buscar o crear cuenta
  IF p_tenant_id IS NOT NULL THEN
    SELECT id INTO v_account_id FROM public.credit_accounts WHERE tenant_id = p_tenant_id;
    IF v_account_id IS NULL THEN
      INSERT INTO public.credit_accounts (tenant_id, balance, total_purchased)
      VALUES (p_tenant_id, 0, 0)
      RETURNING id INTO v_account_id;
    END IF;
  ELSE
    SELECT id INTO v_account_id FROM public.credit_accounts WHERE user_id = p_user_id;
    IF v_account_id IS NULL THEN
      INSERT INTO public.credit_accounts (user_id, balance, total_purchased)
      VALUES (p_user_id, 0, 0)
      RETURNING id INTO v_account_id;
    END IF;
  END IF;

  -- Añadir créditos
  UPDATE public.credit_accounts
  SET balance = balance + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
  WHERE id = v_account_id
  RETURNING balance INTO v_new_balance;

  -- Registrar transacción
  INSERT INTO public.credit_transactions
    (credit_account_id, type, amount, balance_after, stripe_payment_intent_id, description)
  VALUES
    (v_account_id, 'purchase', p_amount, v_new_balance, p_stripe_payment_intent_id, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 Servicio de Créditos en Frontend

```typescript
// src/services/creditService.ts — CREAR

import { supabase } from '../lib/supabase';

/**
 * Consulta el saldo de créditos.
 * Usado en: header del wizard, dashboard de tenant, perfil B2C.
 */
export async function getBalance(
  tenantId?: string,
  userId?: string
): Promise<number> {
  let query = supabase.from('credit_accounts').select('balance');

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  } else if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();
  if (error || !data) return 0;
  return data.balance;
}

/**
 * Intenta consumir 1 crédito ANTES de generar un cuento.
 * Si retorna false, mostrar pantalla de "compra créditos".
 */
export async function consumeCredit(
  tenantId?: string,
  userId?: string,
  storySessionId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('consume_credit', {
    p_tenant_id: tenantId || null,
    p_user_id: userId || null,
    p_story_session_id: storySessionId || null
  });

  if (error) {
    console.error('Error consuming credit:', error);
    return false;
  }

  return data === true;
}

/**
 * Obtiene el catálogo de packs para un canal.
 */
export async function getCreditPacks(
  channel: 'b2b_standard' | 'b2b_premium' | 'b2c'
) {
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('channel', channel)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}
```

---

## 4. Pagos con Stripe

### 4.1 Setup Inicial de Stripe

```
PASOS EN STRIPE DASHBOARD:
1. Crear cuenta en stripe.com (ya tienes cuenta)
2. Ir a Products > crear un producto por cada credit_pack:
   - "NubeKids B2B Standard - Starter (50 cuentos)" → Price: 25.00€ one-time
   - "NubeKids B2B Standard - Growth (200 cuentos)" → Price: 79.00€ one-time
   - ... (repetir para cada pack)
3. Copiar el Price ID (price_xxxx) de cada uno
4. Actualizar la tabla credit_packs con el stripe_price_id correspondiente
5. Ir a Developers > API Keys > copiar:
   - Publishable key (pk_live_xxx o pk_test_xxx)
   - Secret key (sk_live_xxx o sk_test_xxx)
6. Ir a Developers > Webhooks > añadir endpoint:
   - URL: https://tu-dominio.com/api/stripe/webhook
   - Events: checkout.session.completed, payment_intent.succeeded
   - Copiar el Webhook Signing Secret (whsec_xxx)
```

### 4.2 Variables de Entorno para Stripe

```env
# .env.local (frontend — solo la publishable key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Backend (Vercel Edge Functions / Cloud Run — secret key)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4.3 Flujo de Pago (Stripe Checkout Session)

```
USUARIO                    FRONTEND                BACKEND (API)           STRIPE
   │                          │                        │                     │
   │  Clic "Comprar 3 cuentos"│                        │                     │
   │─────────────────────────►│                        │                     │
   │                          │  POST /api/stripe/     │                     │
   │                          │  create-checkout       │                     │
   │                          │───────────────────────►│                     │
   │                          │                        │  Crea Checkout       │
   │                          │                        │  Session             │
   │                          │                        │────────────────────►│
   │                          │                        │◄────────────────────│
   │                          │                        │  session.url         │
   │                          │◄───────────────────────│                     │
   │  Redirect a Stripe       │                        │                     │
   │◄─────────────────────────│                        │                     │
   │                          │                        │                     │
   │  Paga en Stripe          │                        │                     │
   │─────────────────────────────────────────────────────────────────────────►│
   │                          │                        │                     │
   │                          │                        │  Webhook:            │
   │                          │                        │  checkout.session    │
   │                          │                        │  .completed          │
   │                          │                        │◄────────────────────│
   │                          │                        │                     │
   │                          │                        │  add_credits()       │
   │                          │                        │  (Supabase RPC)      │
   │                          │                        │                     │
   │  Redirect a /success     │                        │                     │
   │◄─────────────────────────│                        │                     │
```

### 4.4 Pseudocódigo del Backend (API Routes)

```typescript
// api/stripe/create-checkout.ts — CREAR (Vercel Edge Function)
//
// NOTA: Este código NO va en el frontend React.
// Va en una carpeta /api/ para funciones serverless.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { packId, tenantId, userId, successUrl, cancelUrl } = await request.json();

  // 1. Buscar el pack en Supabase para obtener stripe_price_id
  // (O mantener un mapa local — más simple para V1)
  const packPriceMap: Record<string, string> = {
    'b2c-trial':       'price_xxxx',  // Rellenar con IDs reales de Stripe
    'b2c-family':      'price_yyyy',
    'b2c-gift':        'price_zzzz',
    'b2b-std-starter': 'price_aaaa',
    // ... etc
  };

  const priceId = packPriceMap[packId];
  if (!priceId) return new Response('Invalid pack', { status: 400 });

  // 2. Crear Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    success_url: successUrl || `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/credits`,
    metadata: {
      pack_id: packId,
      tenant_id: tenantId || '',
      user_id: userId || '',
    }
  });

  return Response.json({ url: session.url });
}
```

```typescript
// api/stripe/webhook.ts — CREAR (Vercel Edge Function)

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ¡Service role, no anon key!
);

// Mapa de packs a créditos (duplicar aquí o leer de Supabase)
const packCredits: Record<string, number> = {
  'b2c-trial': 1,
  'b2c-family': 3,
  'b2c-gift': 5,
  'b2b-std-starter': 50,
  'b2b-std-growth': 200,
  'b2b-std-scale': 500,
  'b2b-prm-starter': 50,
  'b2b-prm-growth': 200,
  'b2b-prm-scale': 500,
};

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { pack_id, tenant_id, user_id } = session.metadata!;
    const credits = packCredits[pack_id] || 0;

    if (credits > 0) {
      // Añadir créditos via RPC
      await supabase.rpc('add_credits', {
        p_tenant_id: tenant_id || null,
        p_user_id: user_id || null,
        p_amount: credits,
        p_stripe_payment_intent_id: session.payment_intent as string,
        p_description: `Pack ${pack_id} (${credits} credits)`
      });
    }
  }

  return new Response('OK', { status: 200 });
}
```

### 4.5 Componente de Compra en Frontend

```typescript
// src/components/BuyCredits.tsx — CREAR
//
// Muestra los packs disponibles y redirige a Stripe Checkout.
// Se usa en:
//   - Dashboard del tenant (packs B2B)
//   - Perfil del usuario B2C (packs B2C)
//   - Pantalla "sin créditos" cuando se intenta generar

/**
 * Props:
 *   channel: 'b2b_standard' | 'b2b_premium' | 'b2c'
 *   tenantId?: string  (si es B2B)
 *   userId?: string    (si es B2C)
 *
 * Flujo:
 * 1. Cargar packs con getCreditPacks(channel)
 * 2. Mostrar cards con precio, cantidad de cuentos
 * 3. Al clic: POST /api/stripe/create-checkout con el packId
 * 4. Redirigir al usuario a session.url (Stripe hosted)
 * 5. Stripe redirige de vuelta a /credits/success
 * 6. Webhook ya habrá añadido los créditos
 */
```

---

## 5. Integración e-Commerce (Dos Niveles)

### 5.1 Plan Standard — Link Personalizado

El e-Commerce recibe un link único que incluye su `tenant_id`. El nombre de la tienda se teje en la narrativa.

```
URL del link:
https://stories.nubekids.io/?tenant={tenant_id}&ref=checkout

Ejemplo:
https://stories.nubekids.io/?tenant=zapatos-lopez-001&ref=checkout
```

**Cómo lo usa el e-Commerce:**
- En su email de confirmación de pedido, añaden un banner/botón con ese link.
- En una página de "gracias por tu compra", incluyen el link.
- En redes sociales, lo comparten como promoción.

**Qué pasa cuando el usuario hace clic:**
1. NubeKids carga la config del tenant (branding, storeName, etc.)
2. El wizard se abre SIN login (sesión anónima)
3. El nombre de la tienda se inyecta en el cuento via `tenantConfig.storeName`
4. Se consume 1 crédito del balance del tenant
5. Al terminar: "¿Quieres crear otro cuento?" → Redirect a registro B2C

### 5.2 Plan Premium — Widget con Foto del Producto

El e-Commerce integra un snippet en su checkout. La foto del producto se inyecta.

#### Opción A: Redirect con Query Params (simple)

```html
<!-- En la página de confirmación del e-Commerce -->
<a href="https://stories.nubekids.io/?tenant=zapatos-lopez-001&item=Nike+Air+Max+90+Kids+Rojo&item_image=https://cdn.tienda.com/products/nike-airmax-90.jpg&customer_email=padre@email.com"
   class="nubekids-button">
  ¡Crea un cuento mágico con tus zapatos nuevos!
</a>

<!--
  Query params:
  - tenant: ID del tenant
  - item: Nombre/modelo del producto (pre-rellena el wizard)
  - item_image: URL de la foto del producto (se descarga client-side)
  - customer_email: Para enviar el PDF al terminar (opcional)
-->
```

#### Opción B: Widget Embebible (avanzado, futuro V2)

```html
<!-- Web Component embebible en el checkout -->
<script src="https://cdn.nubekids.io/widget.js"></script>
<nubekids-upsell
  tenant-id="zapatos-lopez-001"
  item-model="Nike Air Max 90 Kids Rojo Talla 32"
  item-image="https://cdn.tienda.com/products/nike-airmax-90.jpg"
  customer-email="padre@email.com"
  lang="es"
></nubekids-upsell>
```

> **PARA V1:** Implementar solo Opción A (redirect con query params). Es lo mínimo viable.
> La Opción B (widget) es Fase 9 del roadmap.

### 5.3 Manejo de item_image desde URL

```typescript
// src/utils/itemImageLoader.ts — CREAR

/**
 * Cuando un tenant Premium inyecta item_image como URL,
 * descargamos la imagen client-side y la convertimos a base64.
 *
 * IMPORTANTE: La imagen nunca pasa por nuestro backend (ADR-005).
 * Se descarga en el navegador del usuario via fetch/canvas.
 */

export async function loadItemImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    // Descargar la imagen
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Convertir a base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load item image from URL:', imageUrl, error);
    return null;
  }
}

/**
 * En App.tsx o Setup.tsx, al inicializar:
 *
 * const params = new URLSearchParams(window.location.search);
 * const itemImageUrl = params.get('item_image');
 * if (itemImageUrl) {
 *   const base64 = await loadItemImageFromUrl(itemImageUrl);
 *   if (base64) {
 *     // Pre-rellenar el step del objeto mágico con esta imagen
 *     setItemImageBase64(base64);
 *   }
 * }
 */
```

---

## 6. Flujo Completo: e-Commerce → NubeKids → B2C

### 6.1 Diagrama del Funnel

```
═══════════════════════════════════════════════════════════════
FASE 1: ENTRADA DESDE E-COMMERCE (Gratis para el usuario)
═══════════════════════════════════════════════════════════════

  [Checkout del e-Commerce]
         │
         │  "¡Compra 2 pares y regala un cuento mágico personalizado!"
         │
         ▼
  [Clic en link/botón]
         │
         │  URL: stories.nubekids.io/?tenant=xxx&item=yyy(&item_image=zzz)
         │
         ▼
  [NubeKids: Carga config del tenant]
         │
         ├── Verifica que el tenant tiene créditos (consume_credit)
         │   ├── SI → Continúa al wizard
         │   └── NO → Muestra: "Lo sentimos, esta promoción no está disponible"
         │            (Notificar al tenant por email que se quedó sin créditos)
         │
         ▼
  [Wizard de creación — 4 pasos — SIN LOGIN]
         │
         ├── Step 1: Héroe (nombre, edad, descripción)
         ├── Step 2: Pedagogía (opcional, chips)
         ├── Step 3: Objeto mágico (pre-rellenado si Premium)
         └── Step 4: Estilo visual + idioma
         │
         ▼
  [Generación del cuento (~3 min)]
         │
         ▼
  [Cuento listo — Lectura + PDF]

═══════════════════════════════════════════════════════════════
FASE 2: CONVERSIÓN A B2C (El usuario paga)
═══════════════════════════════════════════════════════════════

  [Cuento terminado]
         │
         │  "¡Tu cuento está listo! ¿Quieres crear otro?"
         │
         ├──► [Botón: "Crear otro cuento"]
         │         │
         │         ▼
         │    [Pantalla de registro / login]
         │         │
         │         │  "Crea tu cuenta NubeKids para guardar tus cuentos
         │         │   y crear nuevos desde solo 2.99€"
         │         │
         │         ├── Registro con email + password
         │         ├── Registro con Google
         │         └── (Pre-rellenar email si venía en query param)
         │         │
         │         ▼
         │    [Pantalla de compra de créditos B2C]
         │         │
         │         │  Muestra packs: Prueba(1) / Familia(3) / Regala Magia(5)
         │         │
         │         ▼
         │    [Stripe Checkout → Pago → Créditos añadidos]
         │         │
         │         ▼
         │    [Wizard de nuevo cuento (ya logueado)]
         │
         └──► [Botón: "Descargar PDF"]
                   │
                   ▼
              [Descarga PDF]
              [Fin de sesión]
```

### 6.2 Lógica de "¿Quién paga el crédito?"

```typescript
// src/services/sessionService.ts — CREAR

/**
 * Determina quién paga el crédito de esta sesión.
 *
 * REGLA:
 * - Si el usuario llegó via un tenant B2B (query param ?tenant=)
 *   Y es su primer cuento en esta sesión
 *   → El crédito se descuenta del tenant.
 *
 * - Si el usuario está logueado como B2C
 *   → El crédito se descuenta de su cuenta personal.
 *
 * - Si el usuario llegó via B2B pero ya generó su cuento gratis
 *   Y hace clic en "crear otro"
 *   → Redirigir a registro B2C + compra de créditos.
 */

interface SessionPaymentDecision {
  payer: 'tenant' | 'user' | 'needs_credits';
  tenantId?: string;
  userId?: string;
}

export function resolvePayment(context: {
  tenantId?: string;
  userId?: string;
  isFirstStoryInSession: boolean;
  userCreditBalance: number;
  tenantCreditBalance: number;
}): SessionPaymentDecision {
  const { tenantId, userId, isFirstStoryInSession, userCreditBalance, tenantCreditBalance } = context;

  // Caso 1: Viene de e-Commerce y es su primer cuento
  if (tenantId && isFirstStoryInSession) {
    if (tenantCreditBalance > 0) {
      return { payer: 'tenant', tenantId };
    }
    // Tenant sin créditos — no se puede generar
    return { payer: 'needs_credits' };
  }

  // Caso 2: Usuario B2C logueado
  if (userId) {
    if (userCreditBalance > 0) {
      return { payer: 'user', userId };
    }
    return { payer: 'needs_credits' };
  }

  // Caso 3: Ni tenant ni user — necesita registrarse y comprar
  return { payer: 'needs_credits' };
}
```

---

## 7. Sesiones de Historia (Story Sessions)

### 7.1 Tabla

```sql
-- ============================================================
-- TABLA: story_sessions (registro de cada cuento generado)
-- ============================================================
CREATE TABLE public.story_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quién generó
  tenant_id TEXT REFERENCES public.tenants(id),  -- NULL si B2C directo
  user_id UUID REFERENCES auth.users(id),         -- NULL si anónimo via B2B
  -- Datos del cuento
  hero_name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  genre TEXT,
  language TEXT,
  pedagogy_enabled BOOLEAN DEFAULT false,
  -- Estado
  status TEXT DEFAULT 'created'
    CHECK (status IN ('created', 'generating', 'completed', 'failed')),
  -- Metadata (NO almacenar fotos del niño — ADR-005)
  item_model TEXT,
  narrative_arc_summary TEXT,  -- Guardar para analytics
  pages_generated INTEGER DEFAULT 0,
  -- Tracking
  source TEXT DEFAULT 'direct'
    CHECK (source IN ('direct', 'b2b_standard', 'b2b_premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_tenant ON public.story_sessions(tenant_id);
CREATE INDEX idx_sessions_user ON public.story_sessions(user_id);
CREATE INDEX idx_sessions_status ON public.story_sessions(status);
```

---

## 8. Estructura de API REST

### 8.1 Endpoints Necesarios (V1)

```
API BASE: /api/v1/

AUTH:
  POST   /api/auth/callback          → Callback de OAuth (Supabase maneja)

STRIPE:
  POST   /api/stripe/create-checkout  → Crea sesión de pago Stripe
  POST   /api/stripe/webhook          → Recibe eventos de Stripe

CREDITS:
  GET    /api/v1/credits/balance       → Balance del usuario o tenant autenticado
  GET    /api/v1/credits/packs         → Catálogo de packs (por canal)
  GET    /api/v1/credits/transactions  → Historial de transacciones

SESSIONS:
  POST   /api/v1/sessions              → Crea sesión de historia (consume crédito)
  GET    /api/v1/sessions/:id          → Estado de una sesión
  PATCH  /api/v1/sessions/:id          → Actualiza estado (completed, failed)

TENANTS (solo admin y tenant_owner):
  GET    /api/v1/tenants/:id           → Config del tenant
  PATCH  /api/v1/tenants/:id           → Actualizar branding, prompts
  GET    /api/v1/tenants/:id/stats     → Métricas del tenant

WEBHOOK E-COMMERCE (futuro):
  POST   /api/v1/webhooks/shopify      → Recibe evento de compra
  POST   /api/v1/webhooks/woocommerce  → Recibe evento de compra
```

### 8.2 Dónde Alojar las API Routes (V1)

```
OPCIÓN RECOMENDADA: Vercel Serverless Functions

Estructura:
/api/
  ├── stripe/
  │   ├── create-checkout.ts    → POST
  │   └── webhook.ts            → POST
  ├── v1/
  │   ├── credits/
  │   │   ├── balance.ts        → GET
  │   │   └── packs.ts          → GET
  │   ├── sessions/
  │   │   └── index.ts          → POST, GET
  │   └── tenants/
  │       └── [id].ts           → GET, PATCH

Las funciones leen/escriben en Supabase usando SUPABASE_SERVICE_ROLE_KEY.
El frontend llama a /api/... en el mismo dominio (no hay CORS issues).
```

---

## 9. Email Transaccional (Futuro V2)

> **PARA V1:** No implementar email. El link se comparte manualmente por el e-Commerce.
> **PARA V2:** Integrar Resend (más simple que SendGrid, ideal para Vercel).

```
SETUP FUTURO:
1. Crear cuenta en resend.com
2. Verificar dominio (nubekids.io)
3. npm install resend
4. Crear template: "Tu cuento mágico te espera"
5. Enviar email cuando el e-Commerce crea una sesión via webhook
```

---

## 10. Dominio y Landing Page

### 10.1 Checklist Previo al Lanzamiento

```
DOMINIO:
□ Comprar dominio (nubekids.io, nubekidstales.com, o similar)
□ Configurar DNS apuntando a Vercel
□ Activar HTTPS (Vercel lo hace automático)

LANDING PAGE:
□ Crear landing page de marketing (puede ser una sola página)
□ Secciones: Hero, Cómo funciona, Demo, Pricing B2C, Pricing B2B, CTA
□ Formulario de registro para tenants B2B (leads)

LEGAL:
□ Política de privacidad (GDPR, datos de menores)
□ Términos de servicio
□ Aviso legal (empresa o autónomo)
□ Política de cookies
□ Conformidad COPPA (si tienes usuarios en EEUU)

STRIPE:
□ Crear productos y prices en Stripe
□ Configurar webhook endpoint
□ Probar flujo completo con Stripe test mode

SUPABASE:
□ Crear todas las tablas nuevas (profiles, credit_accounts, etc.)
□ Configurar Google OAuth provider
□ Configurar RLS policies
□ Crear funciones RPC (consume_credit, add_credits)
```

---

## 11. Bug de Imágenes — Diagnóstico

### 11.1 Síntoma
Desde la implementación del RAG V2 (29 marzo), las páginas del cuento se generan solo con texto. Las páginas izquierdas (que deberían contener imágenes) están vacías. Antes del RAG V2 funcionaba correctamente.

### 11.2 Causa Probable

Durante la sesión de RAG V2 se modificó `orchestratorAgent.ts` (para pasar `apiKey` a `queryRag`). Es probable que uno de estos cambios haya roto la cadena que pasa el `AgentBrief` (específicamente los `visualDirections`) al flujo de generación de imágenes en `App.tsx`.

### 11.3 Dónde Investigar (en orden)

```
1. App.tsx — Buscar la función que llama a generateImage() para cada página.
   Verificar que recibe agentBrief.visualDirections[pageIndex].
   Si visualDirections es undefined o vacío, las imágenes no se generan.

2. orchestratorAgent.ts — Verificar que el return del AgentBrief incluye
   visualDirections como array de strings (no de objetos VisualBrief).
   El cambio de ayer pudo haber alterado la estructura del return.

3. imageGenerationService.ts — Verificar que la función generateImage()
   no fue modificada (no debería haberlo sido, pero confirmar).

4. Consola del navegador — Abrir DevTools > Console y buscar errores
   durante la fase "Generating" (después de "Orchestrating").
   Posibles errores: "Cannot read property 'fullPrompt' of undefined"
   o "visualDirections is not iterable".
```

### 11.4 Fix Probable

```typescript
// En App.tsx o donde se genera cada página, buscar algo como:

// ANTES (probablemente funcionaba):
const imagePrompt = agentBrief.visualDirections[pageIndex];

// POSIBLE PROBLEMA (si orchestratorAgent cambió la estructura):
// agentBrief.visualDirections podría ser undefined o un array de objetos
// en lugar de un array de strings.

// FIX: Añadir defensive check:
const imagePrompt = agentBrief?.visualDirections?.[pageIndex] || beat.scene;
// Si no hay visual direction, usar la descripción de escena del beat como fallback.
```

---

## 12. Estructura de Archivos Objetivo (Post-Implementación)

```
D:\nubekids-tales\
├── .env.local                          # Todas las keys (Supabase, Gemini, Stripe)
├── package.json                        # + stripe, @stripe/stripe-js
│
├── api/                                # ← NUEVO: Vercel Serverless Functions
│   ├── stripe/
│   │   ├── create-checkout.ts
│   │   └── webhook.ts
│   └── v1/
│       ├── credits/
│       │   ├── balance.ts
│       │   └── packs.ts
│       └── sessions/
│           └── index.ts
│
├── scripts/
│   └── rag-ingest.mjs
│
├── sql/                                # ← NUEVO: Scripts SQL para Supabase
│   ├── 001_profiles.sql
│   ├── 002_tenants_extend.sql
│   ├── 003_credit_accounts.sql
│   ├── 004_credit_transactions.sql
│   ├── 005_credit_packs.sql
│   ├── 006_story_sessions.sql
│   ├── 007_rpc_consume_credit.sql
│   ├── 008_rpc_add_credits.sql
│   └── 009_rls_policies.sql
│
├── src/
│   ├── App.tsx
│   ├── types.ts                        # + UserRole, CreditPack, etc.
│   │
│   ├── lib/
│   │   └── supabase.ts                 # ← NUEVO: Cliente singleton (fix warning)
│   │
│   ├── components/
│   │   ├── auth/                       # ← NUEVO
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── AuthCallback.tsx        # Maneja redirect OAuth
│   │   │   └── ProtectedRoute.tsx      # Wrapper de rutas protegidas
│   │   ├── credits/                    # ← NUEVO
│   │   │   ├── BuyCredits.tsx          # Pantalla de compra
│   │   │   ├── CreditBalance.tsx       # Badge de saldo
│   │   │   └── NoCreditsBanner.tsx     # CTA cuando saldo = 0
│   │   ├── dashboard/                  # ← NUEVO (tenant dashboard)
│   │   │   ├── TenantDashboard.tsx
│   │   │   ├── BrandingEditor.tsx
│   │   │   └── UsageStats.tsx
│   │   ├── landing/                    # ← NUEVO
│   │   │   └── LandingPage.tsx
│   │   ├── Book.tsx
│   │   ├── Setup.tsx
│   │   └── wizard/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  # ← NUEVO
│   │   ├── useCredits.ts              # ← NUEVO
│   │   └── ...
│   │
│   ├── services/
│   │   ├── authService.ts             # ← NUEVO
│   │   ├── creditService.ts           # ← NUEVO
│   │   ├── stripeService.ts           # ← NUEVO (frontend: redirect a checkout)
│   │   ├── sessionService.ts          # ← NUEVO (lógica de quién paga)
│   │   ├── imageGenerationService.ts
│   │   ├── ragService.ts
│   │   └── agents/
│   │
│   └── utils/
│       ├── itemImageLoader.ts         # ← NUEVO
│       └── ...
```

---

## 13. Orden de Implementación Recomendado

```
PRIORIDAD 1 — PREREQUISITOS (antes de todo):
  1. Fix bug de imágenes (diagnosticar y arreglar)
  2. Crear src/lib/supabase.ts (cliente singleton)
  3. Fix Book container + PDF landscape
  4. Commit todo a GitHub

PRIORIDAD 2 — AUTH (sin esto no hay negocio):
  5. Crear tablas SQL en Supabase (profiles + RLS)
  6. Configurar Google OAuth en Supabase
  7. Crear authService.ts + useAuth.ts
  8. Crear LoginPage, SignUpPage, AuthCallback
  9. Proteger rutas: wizard requiere login O sesión de tenant

PRIORIDAD 3 — CRÉDITOS (sin esto no cobras):
  10. Crear tablas SQL (credit_accounts, credit_transactions, credit_packs)
  11. Crear funciones RPC (consume_credit, add_credits)
  12. Crear creditService.ts + useCredits.ts
  13. Integrar en App.tsx: consumeCredit() antes de generar

PRIORIDAD 4 — STRIPE (empezar a cobrar):
  14. Crear productos/prices en Stripe Dashboard
  15. Crear api/stripe/create-checkout.ts
  16. Crear api/stripe/webhook.ts
  17. Crear BuyCredits.tsx
  18. Probar flujo completo con Stripe test mode

PRIORIDAD 5 — FLUJO B2B → B2C:
  19. Implementar carga de item_image desde URL (itemImageLoader.ts)
  20. Implementar sessionService.ts (resolvePayment)
  21. Implementar NoCreditsBanner + redirect a registro
  22. Probar flujo completo: link B2B → cuento gratis → registro B2C → compra

PRIORIDAD 6 — DOMINIO Y DEPLOY:
  23. Comprar dominio
  24. Deploy en Vercel
  25. Configurar Stripe webhook con URL de producción
  26. Landing page mínima

PRIORIDAD 7 — DASHBOARD DE TENANT:
  27. TenantDashboard.tsx (balance, métricas, comprar más)
  28. BrandingEditor.tsx (colores, logo, prompts)
  29. Onboarding de nuevo tenant
```

---

## 14. Costes Estimados de Operación

| Concepto | Coste mensual estimado | Notas |
|----------|----------------------|-------|
| Supabase | 0€ (Free tier) → 25$/mes (Pro) | Free tier: 50k auth users, 500MB DB |
| Gemini API | ~0.15-0.30€/cuento | 4 agentes texto + 10 imágenes + 1 embedding |
| Vercel | 0€ (Hobby) → 20$/mes (Pro) | Pro necesario para timeout >10s en functions |
| Stripe | 1.4% + 0.25€/transacción | Comisión europea estándar |
| Dominio | ~15€/año | .io o .com |
| Resend (V2) | 0€ (100 emails/día gratis) | Para emails transaccionales |
| **TOTAL MVP** | **~25-50€/mes** | **Antes de ingresos** |

> Con 100 cuentos/mes a 0.25€ de coste de API = 25€ de coste variable.
> 100 cuentos × 0.50€ precio medio = 50€ de ingreso.
> Breakeven en ~200 cuentos/mes.

---

*Documento creado el 2026-03-30. Actualizar tras cada implementación.*
