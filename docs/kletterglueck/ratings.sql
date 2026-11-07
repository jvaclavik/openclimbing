begin;
create table public.kletterglueck_tour_ratings (
  tour_id uuid not null references public.kletterglueck_tours(id) on delete cascade,
  profile text not null check (profile in ('Simon', 'Mama')),
  stars integer check (stars between 1 and 5),
  visited boolean not null default false,
  visited_at date,
  note text not null default '' check (length(note) <= 2000),
  primary key (tour_id, profile),
  check (visited or visited_at is null)
);
alter table public.kletterglueck_tour_ratings enable row level security;
revoke all on public.kletterglueck_tour_ratings from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.kletterglueck_tour_ratings to service_role;
commit;
