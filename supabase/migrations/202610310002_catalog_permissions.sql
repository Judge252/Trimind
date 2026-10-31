-- Supabase default public-schema grants must not make the canonical catalog writable.
alter table public.catalog_courses enable row level security;
alter table public.catalog_courses force row level security;
alter table public.catalog_lessons enable row level security;
alter table public.catalog_lessons force row level security;
revoke all on public.catalog_courses, public.catalog_lessons from public, anon, authenticated;
grant select on public.catalog_courses, public.catalog_lessons to anon, authenticated, trimind_api;
create policy catalog_read on public.catalog_courses for select to anon, authenticated, trimind_api using (true);
create policy catalog_read on public.catalog_lessons for select to anon, authenticated, trimind_api using (true);
-- Migration metadata is operational state, not a browser API.
alter table public.trimind_migrations enable row level security;
alter table public.trimind_migrations force row level security;
revoke all on public.trimind_migrations from public, anon, authenticated, trimind_api;
