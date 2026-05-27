-- Automatic draw for 8 teams:
-- - Creates/uses Group A and Group B
-- - Assigns 4 teams per group
-- - Generates all group matches automatically (6 per group)
--
-- Prerequisite: run sql/tournament_admin_tables.sql first.
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.tournament_draws (
  id uuid primary key default gen_random_uuid(),
  draw_name text not null,
  requested_team_count integer not null default 8,
  pool_count integer not null default 2,
  status text not null default 'COMPLETED',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_draws_draw_name_not_empty check (char_length(trim(draw_name)) > 0),
  constraint tournament_draws_requested_team_count_check check (requested_team_count = 8),
  constraint tournament_draws_pool_count_check check (pool_count = 2),
  constraint tournament_draws_status_check check (status in ('COMPLETED'))
);

create table if not exists public.tournament_draw_teams (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.tournament_draws(id) on delete cascade,
  registere_id uuid not null references public.registere(id) on delete cascade,
  draw_order integer not null,
  group_code text not null,
  seed integer not null,
  created_at timestamptz not null default now(),
  constraint tournament_draw_teams_draw_order_positive check (draw_order >= 1),
  constraint tournament_draw_teams_seed_range check (seed >= 1 and seed <= 4),
  constraint tournament_draw_teams_group_code_check check (group_code in ('A', 'B')),
  constraint tournament_draw_teams_unique_team_per_draw unique (draw_id, registere_id),
  constraint tournament_draw_teams_unique_draw_order unique (draw_id, draw_order)
);

create index if not exists tournament_draws_created_at_idx
  on public.tournament_draws(created_at desc);

create index if not exists tournament_draw_teams_draw_idx
  on public.tournament_draw_teams(draw_id);

create index if not exists tournament_draw_teams_registere_idx
  on public.tournament_draw_teams(registere_id);

create or replace function public.set_tournament_draws_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tournament_draws_updated_at on public.tournament_draws;
create trigger trg_tournament_draws_updated_at
before update on public.tournament_draws
for each row
execute function public.set_tournament_draws_updated_at();

alter table public.tournament_draws enable row level security;
alter table public.tournament_draw_teams enable row level security;

revoke all on table public.tournament_draws from anon, authenticated;
revoke all on table public.tournament_draw_teams from anon, authenticated;

drop policy if exists "tournament_draws_admin_read" on public.tournament_draws;
create policy "tournament_draws_admin_read"
on public.tournament_draws
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

drop policy if exists "tournament_draw_teams_admin_read" on public.tournament_draw_teams;
create policy "tournament_draw_teams_admin_read"
on public.tournament_draw_teams
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

create or replace function public.run_tournament_draw_8(
  p_team_ids uuid[],
  p_created_by uuid default null,
  p_clear_existing boolean default true
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_draw_id uuid;
  v_unique_team_ids uuid[];
  v_group_a uuid;
  v_group_b uuid;
  v_group_team_ids uuid[];
  v_team_count integer;
  v_slot record;
begin
  v_unique_team_ids := array(
    select distinct team_id
    from unnest(coalesce(p_team_ids, '{}'::uuid[])) as u(team_id)
    where team_id is not null
  );

  if coalesce(array_length(v_unique_team_ids, 1), 0) <> 8 then
    raise exception 'Exactly 8 unique team IDs are required.';
  end if;

  select count(*)
  into v_team_count
  from public.registere r
  where r.id = any(v_unique_team_ids);

  if v_team_count <> 8 then
    raise exception 'One or more team IDs do not exist in registere.';
  end if;

  insert into public.tournament_draws (
    draw_name,
    requested_team_count,
    pool_count,
    status,
    created_by
  )
  values (
    'AUTO DRAW 8 TEAMS',
    8,
    2,
    'COMPLETED',
    p_created_by
  )
  returning id into v_draw_id;

  select id
  into v_group_a
  from public.tournament_groups
  where code = 'A'
  order by order_index asc, created_at asc
  limit 1;

  if v_group_a is null then
    insert into public.tournament_groups (code, name, order_index)
    values ('A', 'Poule A', 1)
    returning id into v_group_a;
  end if;

  select id
  into v_group_b
  from public.tournament_groups
  where code = 'B'
  order by order_index asc, created_at asc
  limit 1;

  if v_group_b is null then
    insert into public.tournament_groups (code, name, order_index)
    values ('B', 'Poule B', 2)
    returning id into v_group_b;
  end if;

  if p_clear_existing then
    delete from public.tournament_matches
    where stage = 'GROUP'
      and group_id in (v_group_a, v_group_b);

    delete from public.tournament_group_entries
    where group_id in (v_group_a, v_group_b);
  end if;

  delete from public.tournament_group_entries
  where registere_id = any(v_unique_team_ids);

  with randomized as (
    select
      team_id,
      row_number() over (order by random()) as draw_order
    from unnest(v_unique_team_ids) as t(team_id)
  ),
  assigned as (
    select
      team_id as registere_id,
      draw_order,
      case when draw_order <= 4 then 'A' else 'B' end as group_code,
      case when draw_order <= 4 then draw_order else draw_order - 4 end as seed
    from randomized
  )
  insert into public.tournament_draw_teams (draw_id, registere_id, draw_order, group_code, seed)
  select
    v_draw_id,
    assigned.registere_id,
    assigned.draw_order,
    assigned.group_code,
    assigned.seed
  from assigned
  order by assigned.draw_order;

  insert into public.tournament_group_entries (group_id, registere_id, seed)
  select
    case
      when dt.group_code = 'A' then v_group_a
      else v_group_b
    end as group_id,
    dt.registere_id,
    dt.seed
  from public.tournament_draw_teams dt
  where dt.draw_id = v_draw_id
  order by dt.draw_order;

  for v_slot in (
    select 'A'::text as group_code, v_group_a as group_id
    union all
    select 'B'::text as group_code, v_group_b as group_id
  )
  loop
    select array_agg(e.registere_id order by e.seed asc, e.created_at asc, e.id asc)
    into v_group_team_ids
    from public.tournament_group_entries e
    where e.group_id = v_slot.group_id;

    if coalesce(array_length(v_group_team_ids, 1), 0) <> 4 then
      raise exception 'Group % does not contain exactly 4 teams.', v_slot.group_code;
    end if;

    insert into public.tournament_matches (
      stage,
      group_id,
      round_label,
      home_registere_id,
      away_registere_id,
      status
    )
    values
      ('GROUP', v_slot.group_id, format('GROUP %s - MD1', v_slot.group_code), v_group_team_ids[1], v_group_team_ids[2], 'SCHEDULED'),
      ('GROUP', v_slot.group_id, format('GROUP %s - MD1', v_slot.group_code), v_group_team_ids[3], v_group_team_ids[4], 'SCHEDULED'),
      ('GROUP', v_slot.group_id, format('GROUP %s - MD2', v_slot.group_code), v_group_team_ids[1], v_group_team_ids[3], 'SCHEDULED'),
      ('GROUP', v_slot.group_id, format('GROUP %s - MD2', v_slot.group_code), v_group_team_ids[2], v_group_team_ids[4], 'SCHEDULED'),
      ('GROUP', v_slot.group_id, format('GROUP %s - MD3', v_slot.group_code), v_group_team_ids[1], v_group_team_ids[4], 'SCHEDULED'),
      ('GROUP', v_slot.group_id, format('GROUP %s - MD3', v_slot.group_code), v_group_team_ids[2], v_group_team_ids[3], 'SCHEDULED');
  end loop;

  return v_draw_id;
end;
$$;

