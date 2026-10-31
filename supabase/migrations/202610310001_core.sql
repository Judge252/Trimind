-- Requires Supabase's auth.users/auth.uid and auth roles. No credentials belong here.
create role trimind_api nologin nobypassrls;
grant trimind_api to postgres;
grant usage on schema public, auth to trimind_api;
grant execute on function auth.uid() to trimind_api;
create table public.catalog_courses(id text primary key, track text not null check(track in ('builder','founder','investor')), version text not null);
create table public.catalog_lessons(course_id text references public.catalog_courses(id),id text not null,primary key(course_id,id));
insert into public.catalog_courses values ('build-your-first-mvp','builder','catalog-1'),('validate-a-small-business','founder','catalog-1'),('money-and-risk','investor','catalog-1');
insert into public.catalog_lessons values ('build-your-first-mvp','requirements'),('build-your-first-mvp','scope'),('build-your-first-mvp','test'),('validate-a-small-business','discovery'),('validate-a-small-business','economics'),('validate-a-small-business','validation'),('money-and-risk','budget'),('money-and-risk','diversify'),('money-and-risk','decisions');
create table public.learner_preferences(user_id uuid primary key references auth.users(id) on delete cascade,data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<4096));
create table public.assessment_drafts(user_id uuid references auth.users(id) on delete cascade,id uuid not null,revision int not null check(revision>=0),active boolean not null default true,data jsonb not null check(octet_length(data::text)<32768),primary key(user_id,id));
create unique index one_active_draft on public.assessment_drafts(user_id) where active;
create table public.assessment_submissions(user_id uuid not null,id uuid not null,draft_id uuid not null,data jsonb not null check(octet_length(data::text)<32768),primary key(user_id,id),foreign key(user_id,draft_id) references public.assessment_drafts(user_id,id) on delete cascade);
create table public.ai_generations(user_id uuid not null,id uuid not null,assessment_id uuid not null,draft_id uuid not null,draft_revision int not null,status text not null check(status in ('pending','complete','failed','interrupted')),created_at timestamptz not null default now(),finished_at timestamptz,model text,prompt_tokens int,completion_tokens int,cost numeric,error_code text,primary key(user_id,id),foreign key(user_id,assessment_id) references public.assessment_submissions(user_id,id) on delete cascade);
create unique index one_pending_revision on public.ai_generations(user_id,draft_id,draft_revision) where status='pending';
create index generation_rate_window on public.ai_generations(user_id,created_at);
create table public.learning_plans(user_id uuid not null,id uuid not null,assessment_id uuid not null,generation_id uuid not null,version int not null check(version>0),data jsonb not null check(data->'learningPlan'->>'source'='server' and octet_length(data::text)<131072),primary key(user_id,id),unique(user_id,version),unique(user_id,generation_id),foreign key(user_id,assessment_id) references public.assessment_submissions(user_id,id) on delete cascade,foreign key(user_id,generation_id) references public.ai_generations(user_id,id) on delete cascade);
create table public.active_plans(user_id uuid primary key references auth.users(id) on delete cascade,plan_id uuid not null,foreign key(user_id,plan_id) references public.learning_plans(user_id,id) on delete cascade);
create table public.lesson_completions(user_id uuid references auth.users(id) on delete cascade,course_id text not null,lesson_id text not null,completed_at timestamptz not null default now(),primary key(user_id,course_id,lesson_id),foreign key(course_id,lesson_id) references public.catalog_lessons(course_id,id));
create table public.quiz_attempts(user_id uuid references auth.users(id) on delete cascade,id uuid not null,course_id text not null references public.catalog_courses(id),score int not null check(score between 0 and 5),data jsonb not null check(octet_length(data::text)<4096),primary key(user_id,id));
create table public.simulation_sessions(user_id uuid references auth.users(id) on delete cascade,id uuid not null,track text not null check(track in ('builder','founder','investor')),revision int not null check(revision>=0),active boolean not null default true,rule_version text not null default 'simulation-1',data jsonb not null check(octet_length(data::text)<131072),primary key(user_id,id));
create unique index one_active_simulation on public.simulation_sessions(user_id,track) where active;
create table public.simulation_decisions(user_id uuid not null,session_id uuid not null,revision int not null,request_id uuid not null,action jsonb not null check(octet_length(action::text)<4096),primary key(user_id,session_id,revision),unique(user_id,request_id),foreign key(user_id,session_id) references public.simulation_sessions(user_id,id) on delete cascade);
create table public.simulation_results(user_id uuid not null,id uuid not null,data jsonb not null check(octet_length(data::text)<4096),primary key(user_id,id),foreign key(user_id,id) references public.simulation_sessions(user_id,id) on delete cascade);
create table public.projects(user_id uuid references auth.users(id) on delete cascade,id uuid not null,updated_at timestamptz not null default now(),data jsonb not null check(octet_length(data::text)<32768),primary key(user_id,id));
create index project_updated on public.projects(user_id,updated_at desc);
create table public.mutation_receipts(user_id uuid references auth.users(id) on delete cascade,id uuid not null,body_hash text not null,created_at timestamptz not null default now(),primary key(user_id,id));
create table public.guest_imports(user_id uuid references auth.users(id) on delete cascade,id uuid not null,body_hash text not null,report jsonb not null,created_at timestamptz not null default now(),primary key(user_id,id),unique(user_id,body_hash));
do $$ declare t text;begin
 foreach t in array array['learner_preferences','assessment_drafts','assessment_submissions','ai_generations','learning_plans','active_plans','lesson_completions','quiz_attempts','simulation_sessions','simulation_decisions','simulation_results','projects','mutation_receipts','guest_imports'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('create policy own_read on public.%I for select to authenticated using(user_id=auth.uid())',t);
 execute format('create policy api_owned on public.%I to trimind_api using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to trimind_api',t);
 end loop;
end $$;
-- Immutable submissions and receipts cannot be edited, including by the API role.
revoke update on public.assessment_submissions,public.mutation_receipts,public.simulation_decisions,public.simulation_results from trimind_api;
grant select on public.catalog_courses,public.catalog_lessons to anon,authenticated,trimind_api;
