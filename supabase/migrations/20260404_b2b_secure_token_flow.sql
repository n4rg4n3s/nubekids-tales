alter table public.tenants
    add column if not exists integration_secret_hash text;

alter table public.tokens
    add column if not exists used_at timestamptz;

alter table public.tokens
    add column if not exists created_at timestamptz default timezone('utc', now());

create unique index if not exists idx_tokens_token_unique
    on public.tokens (token);

create or replace function public.consume_b2b_token(
    p_token text,
    p_story_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_token record;
    v_tenant record;
    v_account_id uuid;
    v_balance integer;
begin
    select *
    into v_token
    from public.tokens
    where token = p_token
    for update;

    if not found then
        return jsonb_build_object(
            'success', false,
            'code', 'not_found',
            'error', 'Token no válido o no encontrado'
        );
    end if;

    if coalesce(v_token.is_used, false) then
        return jsonb_build_object(
            'success', false,
            'code', 'already_used',
            'error', 'Este enlace ya ha sido utilizado'
        );
    end if;

    if v_token.expires_at is not null and v_token.expires_at < timezone('utc', now()) then
        return jsonb_build_object(
            'success', false,
            'code', 'expired',
            'error', 'Este enlace ha expirado'
        );
    end if;

    select id, tenant_id, brand_name
    into v_tenant
    from public.tenants
    where id = v_token.tenant_id;

    if not found then
        return jsonb_build_object(
            'success', false,
            'code', 'tenant_not_found',
            'error', 'Tenant no encontrado'
        );
    end if;

    select id, balance
    into v_account_id, v_balance
    from public.credit_accounts
    where tenant_id = v_tenant.tenant_id
    for update;

    if v_account_id is null or coalesce(v_balance, 0) < 1 then
        return jsonb_build_object(
            'success', false,
            'code', 'no_credits',
            'error', 'El establecimiento no tiene créditos disponibles'
        );
    end if;

    update public.credit_accounts
    set balance = balance - 1,
        total_consumed = total_consumed + 1,
        updated_at = timezone('utc', now())
    where id = v_account_id;

    insert into public.credit_transactions (
        credit_account_id,
        type,
        amount,
        balance_after,
        story_session_id,
        description
    )
    values (
        v_account_id,
        'consumption',
        -1,
        v_balance - 1,
        p_story_session_id,
        'Story generation via one-time B2B token'
    );

    update public.tokens
    set is_used = true,
        used_at = timezone('utc', now())
    where id = v_token.id;

    return jsonb_build_object(
        'success', true,
        'code', 'consumed'
    );
end;
$$;
