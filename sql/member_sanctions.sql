-- Public badge verification sanctions table.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.member_sanctions (
  id uuid primary key default gen_random_uuid(),
  badge_id text not null,
  member_type text not null,
  sanction_type text not null,
  reason text,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_sanctions_badge_not_empty check (char_length(trim(badge_id)) > 0),
  constraint member_sanctions_member_type_check check (member_type in ('PLAYER', 'STAFF')),
  constraint member_sanctions_sanction_type_not_empty check (char_length(trim(sanction_type)) > 0),
  constraint member_sanctions_date_range check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists member_sanctions_badge_idx
  on public.member_sanctions (badge_id);

create index if not exists member_sanctions_active_idx
  on public.member_sanctions (member_type, badge_id, is_active);

create or replace function public.set_member_sanctions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_member_sanctions_updated_at on public.member_sanctions;
create trigger trg_member_sanctions_updated_at
before update on public.member_sanctions
for each row
execute function public.set_member_sanctions_updated_at();

alter table public.member_sanctions enable row level security;

revoke all on table public.member_sanctions from anon, authenticated;

drop policy if exists "member_sanctions_admin_read" on public.member_sanctions;
create policy "member_sanctions_admin_read"
on public.member_sanctions
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "member_sanctions_admin_insert" on public.member_sanctions;
create policy "member_sanctions_admin_insert"
on public.member_sanctions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "member_sanctions_admin_update" on public.member_sanctions;
create policy "member_sanctions_admin_update"
on public.member_sanctions
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "member_sanctions_admin_delete" on public.member_sanctions;
create policy "member_sanctions_admin_delete"
on public.member_sanctions
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

-- Example active sanction:
-- insert into public.member_sanctions (
--   badge_id,
--   member_type,
--   sanction_type,
--   reason,
--   starts_at,
--   ends_at,
--   is_active,
--   notes
-- ) values (
--   'PLY-2026-OPXXXX4ACF-01',
--   'PLAYER',
--   'SUSPENDED',
--   'Red card in semifinal',
--   current_date,
--   current_date + interval '7 day',
--   true,
--   'Suspended for one official fixture'
-- );
