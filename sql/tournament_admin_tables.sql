-- Tournament admin tables for groups, fixtures, results, and scorers.
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.tournament_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_groups_code_not_empty check (char_length(trim(code)) > 0),
  constraint tournament_groups_name_not_empty check (char_length(trim(name)) > 0)
);

create table if not exists public.tournament_group_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.tournament_groups(id) on delete cascade,
  registere_id uuid not null references public.registere(id) on delete cascade,
  seed integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_group_entries_seed_non_negative check (seed is null or seed >= 0),
  constraint tournament_group_entries_unique_team unique (registere_id),
  constraint tournament_group_entries_unique_team_per_group unique (group_id, registere_id)
);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  group_id uuid references public.tournament_groups(id) on delete set null,
  round_label text,
  home_registere_id uuid not null references public.registere(id) on delete cascade,
  away_registere_id uuid not null references public.registere(id) on delete cascade,
  kickoff_at timestamptz,
  venue text,
  home_score integer,
  away_score integer,
  status text not null default 'SCHEDULED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_matches_stage_check check (
    stage in ('GROUP', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL')
  ),
  constraint tournament_matches_status_check check (
    status in ('SCHEDULED', 'PLAYED', 'CANCELLED')
  ),
  constraint tournament_matches_distinct_teams check (home_registere_id <> away_registere_id),
  constraint tournament_matches_scores_non_negative check (
    (home_score is null or home_score >= 0) and
    (away_score is null or away_score >= 0)
  ),
  constraint tournament_matches_group_stage_group_required check (
    (stage = 'GROUP' and group_id is not null) or (stage <> 'GROUP')
  )
);

create table if not exists public.tournament_match_goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.tournament_matches(id) on delete cascade,
  team_registere_id uuid not null references public.registere(id) on delete cascade,
  scorer_player_id uuid references public.registere_players(id) on delete set null,
  minute integer,
  is_own_goal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tournament_match_goals_minute_range check (minute is null or (minute >= 0 and minute <= 130))
);

create index if not exists tournament_group_entries_group_idx
  on public.tournament_group_entries(group_id);

create index if not exists tournament_matches_group_idx
  on public.tournament_matches(group_id);

create index if not exists tournament_matches_stage_idx
  on public.tournament_matches(stage);

create index if not exists tournament_matches_status_idx
  on public.tournament_matches(status);

create index if not exists tournament_match_goals_match_idx
  on public.tournament_match_goals(match_id);

create index if not exists tournament_match_goals_player_idx
  on public.tournament_match_goals(scorer_player_id);

create or replace function public.set_tournament_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tournament_groups_updated_at on public.tournament_groups;
create trigger trg_tournament_groups_updated_at
before update on public.tournament_groups
for each row
execute function public.set_tournament_updated_at();

drop trigger if exists trg_tournament_group_entries_updated_at on public.tournament_group_entries;
create trigger trg_tournament_group_entries_updated_at
before update on public.tournament_group_entries
for each row
execute function public.set_tournament_updated_at();

drop trigger if exists trg_tournament_matches_updated_at on public.tournament_matches;
create trigger trg_tournament_matches_updated_at
before update on public.tournament_matches
for each row
execute function public.set_tournament_updated_at();

alter table public.tournament_groups enable row level security;
alter table public.tournament_group_entries enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.tournament_match_goals enable row level security;

revoke all on table public.tournament_groups from anon, authenticated;
revoke all on table public.tournament_group_entries from anon, authenticated;
revoke all on table public.tournament_matches from anon, authenticated;
revoke all on table public.tournament_match_goals from anon, authenticated;

drop policy if exists "tournament_groups_admin_read" on public.tournament_groups;
create policy "tournament_groups_admin_read"
on public.tournament_groups
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

drop policy if exists "tournament_group_entries_admin_read" on public.tournament_group_entries;
create policy "tournament_group_entries_admin_read"
on public.tournament_group_entries
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

drop policy if exists "tournament_matches_admin_read" on public.tournament_matches;
create policy "tournament_matches_admin_read"
on public.tournament_matches
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

drop policy if exists "tournament_match_goals_admin_read" on public.tournament_match_goals;
create policy "tournament_match_goals_admin_read"
on public.tournament_match_goals
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
