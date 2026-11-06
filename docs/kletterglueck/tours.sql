-- Apply once on the intended private Supabase project before enabling the app.
begin;

create table public.kletterglueck_tours (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  difficulty text check (length(difficulty) <= 30),
  duration_minutes integer check (duration_minutes between 1 and 10080),
  osm_ref text check (osm_ref ~ '^(way|relation)/[1-9][0-9]{0,17}$'),
  source text not null check (length(source) between 1 and 500),
  attribution text check (length(attribution) <= 500),
  rights_confirmed_at timestamptz not null,
  track jsonb not null check (jsonb_typeof(track) = 'array'),
  track_hash text not null unique check (track_hash ~ '^[0-9a-f]{64}$'),
  length_m integer not null check (length_m > 0),
  west double precision not null check (west between -180 and 180),
  south double precision not null check (south between -90 and 90),
  east double precision not null check (east between -180 and 180),
  north double precision not null check (north between -90 and 90),
  check (east between west and west + 8 and north between south and south + 8)
);

create index kletterglueck_tours_west_east on public.kletterglueck_tours (west, east);
create index kletterglueck_tours_south_north on public.kletterglueck_tours (south, north);

alter table public.kletterglueck_tours enable row level security;
revoke all on public.kletterglueck_tours from public, anon, authenticated, service_role;
grant select, insert, update on public.kletterglueck_tours to service_role;

commit;
