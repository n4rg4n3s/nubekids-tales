-- ════════════════════════════════════════════════════════════════
-- SECURITY HARDENING — 2026-07-10
-- Ref: docs/auditoria_y_propuesta_2026-07.md §2
-- Aplicada en producción el 2026-07-10 vía MCP (migration:
-- security_hardening_credits_tokens_tenants). Este archivo la
-- versiona en el repo.
--
-- 1) add_credits / increment_tenant_tokens / handle_new_user: solo service_role
-- 2) consume_credit: valida identidad del llamante (auth.uid())
-- 3) tokens: sin lectura pública; validación vía RPC validate_b2b_token
-- 4) tenants: columnas sensibles (api_secret, integration_secret_hash,
--    webhook_url) fuera del alcance de anon/authenticated
-- 5) search_path fijo en funciones SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════

-- ─── 1. RPCs privilegiadas: solo service_role ───────────────────
REVOKE EXECUTE ON FUNCTION public.add_credits(text, uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(text, uuid, integer, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_tenant_tokens(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tenant_tokens(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ─── 2. consume_credit: validación de identidad ─────────────────
-- · Usuario B2C: solo puede consumir SU propio saldo (auth.uid()).
-- · Tenant: el consumo real va por consume_b2b_token (exige poseer el
--   token). Esta vía queda restringida a tenants de demo ('%demo%').
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
  IF p_tenant_id IS NOT NULL THEN
    IF p_tenant_id NOT ILIKE '%demo%' THEN
      RETURN FALSE;
    END IF;
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  ELSIF p_user_id IS NOT NULL THEN
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
      RETURN FALSE;
    END IF;
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;
  ELSE
    RETURN FALSE;
  END IF;

  IF v_account_id IS NULL OR v_balance < 1 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credit_accounts
     SET balance = balance - 1,
         total_consumed = total_consumed + 1,
         updated_at = NOW()
   WHERE id = v_account_id;

  INSERT INTO public.credit_transactions
    (credit_account_id, type, amount, balance_after, story_session_id, description)
  VALUES
    (v_account_id, 'consumption', -1, v_balance - 1, p_story_session_id, 'Story generation');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── 3. tokens: eliminar lectura pública ────────────────────────
DROP POLICY IF EXISTS "Allow token validation" ON public.tokens;
REVOKE SELECT ON public.tokens FROM anon, authenticated;

-- Validación one-shot: exige conocer el token exacto (alta entropía).
CREATE OR REPLACE FUNCTION public.validate_b2b_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT t.id, t.token, t.tenant_id, t.brand_name, t.item_image_url,
         t.item_name, t.customer_email, t.is_used, t.expires_at
    INTO v_row
    FROM public.tokens t
   WHERE t.token = p_token;

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'code', 'not_found');
  END IF;

  IF v_row.is_used THEN
    RETURN jsonb_build_object('valid', false, 'code', 'already_used');
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'code', 'expired');
  END IF;

  RETURN jsonb_build_object('valid', true, 'token', to_jsonb(v_row));
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_b2b_token(text) TO anon, authenticated;

-- ─── 4. tenants: columnas sensibles fuera del alcance público ───
-- La política "Allow tenant read" (USING true) se mantiene para
-- visibilidad de filas; el recorte se hace a nivel de columna.
REVOKE SELECT ON public.tenants FROM anon, authenticated;
GRANT SELECT (
  id, tenant_id, name, brand_name, integration_level, vertical_id,
  item_label, brand_colors, pedagogy_enabled, tokens_total, tokens_used,
  item_interaction_mode, is_active
) ON public.tenants TO anon, authenticated;

-- ─── 5. search_path fijo en funciones flaggeadas por el linter ──
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN (
         'handle_new_user', 'match_rag_chunks', 'match_rag_chunks_hybrid',
         'consume_credit', 'add_credits',
         'set_b2b_activation_requests_updated_at',
         'increment_tenant_tokens', 'consume_b2b_token', 'validate_b2b_token'
       )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.fn);
  END LOOP;
END $$;
