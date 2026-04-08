-- ============================================================
-- Hardening: enable RLS on public tables flagged by Supabase
-- ============================================================

-- credit_packs is queried directly from the frontend to render
-- available plans, so it must remain readable by anon/authenticated
-- clients but should not allow writes from the public API.
alter table public.credit_packs enable row level security;

drop policy if exists "Public can read active credit packs" on public.credit_packs;
create policy "Public can read active credit packs"
    on public.credit_packs
    for select
    to anon, authenticated
    using (is_active = true);

-- credit_transactions should never be publicly accessible.
-- Allow authenticated B2C users to read only their own transaction
-- history through the linked credit account. Writes continue to happen
-- through SECURITY DEFINER functions and the service role.
alter table public.credit_transactions enable row level security;

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
    on public.credit_transactions
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.credit_accounts
            where public.credit_accounts.id = public.credit_transactions.credit_account_id
              and public.credit_accounts.user_id = auth.uid()
        )
    );

-- rag_chunks currently powers semantic search from the client via RPC.
-- Enable RLS immediately to remove public write/delete exposure while
-- preserving read access for the current anonymous flow.
--
-- Follow-up hardening:
--   1. version control match_rag_chunks
--   2. make it SECURITY DEFINER (or move it server-side)
--   3. remove this public SELECT policy if direct table reads are no longer needed
do $$
begin
    if exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'rag_chunks'
    ) then
        execute 'alter table public.rag_chunks enable row level security';
        execute 'drop policy if exists "Public can read rag chunks" on public.rag_chunks';
        execute $policy$
            create policy "Public can read rag chunks"
                on public.rag_chunks
                for select
                to anon, authenticated
                using (true)
        $policy$;
    end if;
end
$$;
