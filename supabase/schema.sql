create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'operator', 'viewer');
create type public.run_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type public.trigger_source as enum ('manual', 'schedule', 'webhook', 'api');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_secrets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  key_name text not null,
  encrypted_value text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, provider, key_name)
);

create table public.agent_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  version integer not null default 1,
  default_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.agent_instances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid not null references public.agent_templates(id),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  version integer not null default 1,
  definition jsonb not null,
  created_at timestamptz not null default now()
);

create table public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid not null references public.workflow_templates(id),
  name text not null,
  trigger_mode text not null,
  schedule text,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  trigger_source public.trigger_source not null,
  status public.run_status not null default 'queued',
  summary text,
  started_at timestamptz,
  finished_at timestamptz,
  cost_estimate_usd numeric(10, 4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  agent_instance_id uuid references public.agent_instances(id),
  step_key text not null,
  step_name text not null,
  status public.run_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  output jsonb not null default '{}'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  run_step_id uuid references public.run_steps(id) on delete set null,
  kind text not null,
  uri text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspace_members_user_idx on public.workspace_members (user_id);
create index agent_instances_workspace_idx on public.agent_instances (workspace_id);
create index workflow_instances_workspace_idx on public.workflow_instances (workspace_id);
create index runs_workspace_idx on public.runs (workspace_id, created_at desc);
create index runs_workflow_idx on public.runs (workflow_instance_id, created_at desc);
create index run_steps_run_idx on public.run_steps (run_id, created_at asc);
create index artifacts_workspace_idx on public.artifacts (workspace_id, created_at desc);
create index audit_logs_workspace_idx on public.audit_logs (workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role = any (allowed_roles)
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_secrets enable row level security;
alter table public.agent_instances enable row level security;
alter table public.workflow_instances enable row level security;
alter table public.runs enable row level security;
alter table public.run_steps enable row level security;
alter table public.artifacts enable row level security;
alter table public.audit_logs enable row level security;

create policy "workspace members can view their workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

create policy "workspace members can view membership"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

create policy "owners and admins manage membership"
on public.workspace_members
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.member_role[]));

create policy "workspace members can view secrets"
on public.workspace_secrets
for select
using (public.is_workspace_member(workspace_id));

create policy "operators manage secrets"
on public.workspace_secrets
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));

create policy "workspace members can view agent instances"
on public.agent_instances
for select
using (public.is_workspace_member(workspace_id));

create policy "operators manage agent instances"
on public.agent_instances
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));

create policy "workspace members can view workflow instances"
on public.workflow_instances
for select
using (public.is_workspace_member(workspace_id));

create policy "operators manage workflow instances"
on public.workflow_instances
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));

create policy "workspace members can view runs"
on public.runs
for select
using (public.is_workspace_member(workspace_id));

create policy "operators manage runs"
on public.runs
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));

create policy "workspace members can view run steps"
on public.run_steps
for select
using (
  exists (
    select 1
    from public.runs
    where public.runs.id = run_id
      and public.is_workspace_member(public.runs.workspace_id)
  )
);

create policy "operators manage run steps"
on public.run_steps
for all
using (
  exists (
    select 1
    from public.runs
    where public.runs.id = run_id
      and public.has_workspace_role(public.runs.workspace_id, array['owner', 'admin', 'operator']::public.member_role[])
  )
)
with check (
  exists (
    select 1
    from public.runs
    where public.runs.id = run_id
      and public.has_workspace_role(public.runs.workspace_id, array['owner', 'admin', 'operator']::public.member_role[])
  )
);

create policy "workspace members can view artifacts"
on public.artifacts
for select
using (public.is_workspace_member(workspace_id));

create policy "operators manage artifacts"
on public.artifacts
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));

create policy "workspace members can view audit logs"
on public.audit_logs
for select
using (public.is_workspace_member(workspace_id));

create policy "operators insert audit logs"
on public.audit_logs
for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'operator']::public.member_role[]));
