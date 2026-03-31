-- ============================================================
-- FASE 8: Sistema de Créditos
-- ============================================================

CREATE TABLE public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT,                              -- Sin FK a tenants (tipos incompatibles)
  user_id UUID REFERENCES auth.users(id),
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT credit_owner_check CHECK (
    (tenant_id IS NOT NULL AND user_id IS NULL) OR
    (tenant_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_credit_accounts_tenant ON public.credit_accounts(tenant_id);
CREATE INDEX idx_credit_accounts_user ON public.credit_accounts(user_id);

ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credit account"
  ON public.credit_accounts FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id UUID NOT NULL REFERENCES public.credit_accounts(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  story_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_account ON public.credit_transactions(credit_account_id);
CREATE INDEX idx_credit_tx_stripe ON public.credit_transactions(stripe_payment_intent_id);

-- ============================================================
CREATE TABLE public.credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('b2b_standard', 'b2b_premium', 'b2c')),
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO public.credit_packs (id, name, channel, credits, price_cents, sort_order) VALUES
  ('b2b-std-starter', 'Starter',      'b2b_standard',  50,  2500, 1),
  ('b2b-std-growth',  'Growth',       'b2b_standard', 200,  7900, 2),
  ('b2b-std-scale',   'Scale',        'b2b_standard', 500, 15900, 3),
  ('b2b-prm-starter', 'Starter',      'b2b_premium',   50,  3900, 1),
  ('b2b-prm-growth',  'Growth',       'b2b_premium',  200, 12900, 2),
  ('b2b-prm-scale',   'Scale',        'b2b_premium',  500, 25900, 3),
  ('b2c-trial',       'Prueba',       'b2c',            1,   299, 1),
  ('b2c-family',      'Familia',      'b2c',            3,   699, 2),
  ('b2c-gift',        'Regala Magia', 'b2c',            5,   999, 3);

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
  IF p_tenant_id IS NOT NULL THEN
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  ELSE
    SELECT id, balance INTO v_account_id, v_balance
    FROM public.credit_accounts WHERE user_id = p_user_id FOR UPDATE;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  IF p_tenant_id IS NOT NULL THEN
    SELECT id INTO v_account_id FROM public.credit_accounts WHERE tenant_id = p_tenant_id;
    IF v_account_id IS NULL THEN
      INSERT INTO public.credit_accounts (tenant_id, balance, total_purchased)
      VALUES (p_tenant_id, 0, 0) RETURNING id INTO v_account_id;
    END IF;
  ELSE
    SELECT id INTO v_account_id FROM public.credit_accounts WHERE user_id = p_user_id;
    IF v_account_id IS NULL THEN
      INSERT INTO public.credit_accounts (user_id, balance, total_purchased)
      VALUES (p_user_id, 0, 0) RETURNING id INTO v_account_id;
    END IF;
  END IF;

  UPDATE public.credit_accounts
  SET balance = balance + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
  WHERE id = v_account_id
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions
    (credit_account_id, type, amount, balance_after, stripe_payment_intent_id, description)
  VALUES
    (v_account_id, 'purchase', p_amount, v_new_balance, p_stripe_payment_intent_id, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;