-- ============================================================
-- Actualización de stripe_price_id en credit_packs
-- Generado tras creación de productos en Stripe (01 Abr 2026)
-- Cuenta Stripe: acct_1CvoJ4DcvABCRuSU (Narganes / NubeKids)
-- ============================================================

UPDATE public.credit_packs SET stripe_price_id = 'price_1THOLwDcvABCRuSU3NcAhy5B' WHERE id = 'b2c-trial';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOM4DcvABCRuSUQtxVIH2B' WHERE id = 'b2c-family';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMBDcvABCRuSUtGWwVFkC' WHERE id = 'b2c-gift';

UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMJDcvABCRuSUOTLGL2Gp' WHERE id = 'b2b-std-starter';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMQDcvABCRuSUODiMlvBm' WHERE id = 'b2b-std-growth';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMYDcvABCRuSU4p2FmSDu' WHERE id = 'b2b-std-scale';

UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMgDcvABCRuSUCwzqnhLp' WHERE id = 'b2b-prm-starter';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMpDcvABCRuSUz0DcZvsf' WHERE id = 'b2b-prm-growth';
UPDATE public.credit_packs SET stripe_price_id = 'price_1THOMxDcvABCRuSUbbFEijDA' WHERE id = 'b2b-prm-scale';

-- Verificación: debe devolver 9 filas con stripe_price_id relleno
SELECT id, name, channel, credits, price_cents, stripe_price_id
FROM public.credit_packs
ORDER BY channel, sort_order;