-- Run this in the Supabase SQL editor before testing auth/logout/refresh
-- and the RBAC settings routes.

-- 1. refresh_tokens: required by /auth/login (persist), /auth/logout
--    (revoke), and /auth/refresh (validate). Does not exist in the current
--    schema (database_types.ts) at all.
create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_user_id_idx on public.refresh_tokens(user_id);

-- 2. rbac_permissions: PUT /settings/rbac upserts on (role_id, module), so
--    that pair needs a uniqueness constraint or the upsert will just insert
--    duplicate rows instead of updating.
alter table public.rbac_permissions
  add constraint rbac_permissions_role_module_unique unique (role_id, module);
