-- Admin access control for /admin and /badges
-- Run this in Supabase SQL Editor.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_users_updated_at on public.admin_users;

create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_admin_users_updated_at();

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id and is_active = true);

-- Grant admin access to this existing auth user email.
insert into public.admin_users (user_id, full_name, is_active)
select id, 'Kensly Eugene', true
from auth.users
where lower(email) = lower('kenslyeugene@gmail.com')
on conflict (user_id)
do update set
  full_name = excluded.full_name,
  is_active = true,
  updated_at = now();
