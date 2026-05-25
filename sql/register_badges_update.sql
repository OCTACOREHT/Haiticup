-- Add badge + QR fields for staff and players.
-- Run this script in Supabase SQL Editor.

alter table public.registere_staff
  add column if not exists badge_id text,
  add column if not exists qr_payload jsonb,
  add column if not exists qr_code_data_url text;

alter table public.registere_players
  add column if not exists badge_id text,
  add column if not exists qr_payload jsonb,
  add column if not exists qr_code_data_url text;

-- Backfill existing rows so NOT NULL constraints can be applied safely.
update public.registere_staff
set
  badge_id = coalesce(badge_id, concat('STF-LEGACY-', lpad(id::text, 6, '0'))),
  qr_payload = coalesce(qr_payload, jsonb_build_object('legacy', true, 'member_type', 'STAFF')),
  qr_code_data_url = coalesce(qr_code_data_url, '')
where badge_id is null
   or qr_payload is null
   or qr_code_data_url is null;

update public.registere_players
set
  badge_id = coalesce(badge_id, concat('PLY-LEGACY-', lpad(id::text, 6, '0'))),
  qr_payload = coalesce(qr_payload, jsonb_build_object('legacy', true, 'member_type', 'PLAYER')),
  qr_code_data_url = coalesce(qr_code_data_url, '')
where badge_id is null
   or qr_payload is null
   or qr_code_data_url is null;

alter table public.registere_staff
  alter column badge_id set not null,
  alter column qr_payload set not null,
  alter column qr_code_data_url set not null;

alter table public.registere_players
  alter column badge_id set not null,
  alter column qr_payload set not null,
  alter column qr_code_data_url set not null;

create unique index if not exists registere_staff_badge_id_unique
  on public.registere_staff (badge_id);

create unique index if not exists registere_players_badge_id_unique
  on public.registere_players (badge_id);

alter table public.registere_staff
  drop constraint if exists registere_staff_badge_id_format;
alter table public.registere_staff
  add constraint registere_staff_badge_id_format
  check (badge_id like 'STF-%');

alter table public.registere_players
  drop constraint if exists registere_players_badge_id_format;
alter table public.registere_players
  add constraint registere_players_badge_id_format
  check (badge_id like 'PLY-%');
