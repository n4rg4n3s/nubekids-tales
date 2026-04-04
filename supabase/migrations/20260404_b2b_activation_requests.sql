create table if not exists public.b2b_activation_requests (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'activated', 'rejected')),
    source text not null default 'b2b_landing_form',
    contact_name text not null,
    business_name text not null,
    business_url text,
    email text not null,
    whatsapp text,
    preferred_contact text not null check (preferred_contact in ('whatsapp', 'email')),
    catalog_type text not null check (catalog_type in ('fashion', 'shoes', 'toys', 'mixed', 'other')),
    plan_interest text not null check (plan_interest in ('standard', 'premium', 'undecided')),
    monthly_orders_band text,
    notes text,
    landing_path text,
    user_agent text
);

create index if not exists idx_b2b_activation_requests_status
    on public.b2b_activation_requests (status);

create index if not exists idx_b2b_activation_requests_created_at
    on public.b2b_activation_requests (created_at desc);

alter table public.b2b_activation_requests enable row level security;

create or replace function public.set_b2b_activation_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists trg_b2b_activation_requests_updated_at
    on public.b2b_activation_requests;

create trigger trg_b2b_activation_requests_updated_at
before update on public.b2b_activation_requests
for each row
execute function public.set_b2b_activation_requests_updated_at();
