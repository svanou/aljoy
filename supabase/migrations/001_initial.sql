-- Run once in a new Supabase project as the database owner.
create type public.request_status as enum ('queued','in_progress','completed');
create table public.profiles(id uuid primary key references auth.users on delete cascade,first_name text not null default '',role text not null default 'client' check(role in ('client','admin')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.workspaces(id uuid primary key default gen_random_uuid(),owner_id uuid not null unique references public.profiles on delete cascade,name text not null default 'My workspace',auto_advance boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(),workspace_id uuid not null unique references public.workspaces on delete cascade,stripe_customer_id text unique,stripe_subscription_id text unique,plan text not null default 'standard_monthly' check(plan in ('standard_monthly','double_monthly')),status text not null default 'inactive',current_period_end timestamptz,cancel_at_period_end boolean not null default false,max_active_requests integer not null default 1 check(max_active_requests in (1,2)),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.requests(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces on delete cascade,title text not null check(length(title) between 1 and 160),description text not null default '' check(length(description)<=20000),category text not null,priority text not null default 'Normal' check(priority in ('Low','Normal','High')),status public.request_status not null default 'queued',position bigint not null default 0,success text not null default '',links text not null default '',complexity text not null default 'Small' check(complexity in ('Small','Medium','Large')),tags text[] not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.request_comments(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.requests on delete cascade,author_id uuid not null references public.profiles,body text not null check(length(body) between 1 and 10000),created_at timestamptz not null default now());
create table public.request_files(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.requests on delete cascade,uploaded_by uuid not null references public.profiles,name text not null,path text not null unique,created_at timestamptz not null default now());
create table public.deliverables(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.requests on delete cascade,uploaded_by uuid not null references public.profiles,title text not null,url text,path text,approved_at timestamptz,created_at timestamptz not null default now(),check(url is not null or path is not null));
create table public.request_events(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.requests on delete cascade,actor_id uuid references public.profiles,body text not null,created_at timestamptz not null default now());
create table public.stripe_events(id text primary key,created_at timestamptz not null default now());
create index requests_queue on public.requests(workspace_id,status,position);
create index comments_request on public.request_comments(request_id,created_at);
create index files_request on public.request_files(request_id);
create index deliverables_request on public.deliverables(request_id);
create index events_request on public.request_events(request_id,created_at);
create index requests_completed on public.requests(status,updated_at);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create or replace function public.owns_workspace(w uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from workspaces where id=w and owner_id=auth.uid())$$;
create or replace function public.can_read_request(r uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from requests where id=r and (owns_workspace(workspace_id) or is_admin()))$$;
create or replace function public.has_subscription(w uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from subscriptions where workspace_id=w and status in ('active','trialing') and current_period_end>now())$$;
create function public.on_signup() returns trigger language plpgsql security definer set search_path=public as $$declare w uuid;begin insert into profiles(id,first_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'first_name',''),80));insert into workspaces(owner_id) values(new.id) returning id into w;insert into subscriptions(workspace_id) values(w);return new;end$$;
create trigger create_profile after insert on auth.users for each row execute function public.on_signup();
create function public.touch() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
create trigger touch_requests before update on public.requests for each row execute function public.touch();
create trigger touch_subscriptions before update on public.subscriptions for each row execute function public.touch();
create trigger touch_workspaces before update on public.workspaces for each row execute function public.touch();
create trigger touch_profiles before update on public.profiles for each row execute function public.touch();
-- All queue writes use locked RPCs. Clients cannot update protected columns directly.
create function public.add_request(w uuid,t text,d text,c text,p text,s text,l text) returns uuid language plpgsql security definer set search_path=public as $$declare r uuid;begin
if not owns_workspace(w) then raise exception 'Unauthorized';end if;
perform 1 from workspaces where id=w for update;
if not has_subscription(w) then raise exception 'An active subscription is required';end if;
insert into requests(workspace_id,title,description,category,priority,success,links,position) values(w,t,d,c,p,s,l,(select coalesce(max(position),0)+1 from requests where workspace_id=w)) returning id into r;
insert into request_events(request_id,actor_id,body) values(r,auth.uid(),'Added to queue');return r;end$$;
create function public.advance_workspace(w uuid) returns void language plpgsql security definer set search_path=public as $$declare cap integer;n integer;r uuid;begin
if not is_admin() then raise exception 'Admin only';end if;
perform 1 from workspaces where id=w for update;
if not has_subscription(w) then return;end if;
select max_active_requests into cap from subscriptions where workspace_id=w;
select count(*) into n from requests where workspace_id=w and status='in_progress';
for r in select id from requests where workspace_id=w and status='queued' order by position,created_at limit greatest(cap-n,0) for update loop
update requests set status='in_progress' where id=r;insert into request_events(request_id,actor_id,body) values(r,auth.uid(),'Started');end loop;end$$;
create function public.set_request_status(r uuid,s public.request_status) returns void language plpgsql security definer set search_path=public as $$declare w uuid;cap integer;old_status public.request_status;begin
if not is_admin() then raise exception 'Admin only';end if;
select workspace_id into w from requests where id=r;if w is null then raise exception 'Request not found';end if;
perform 1 from workspaces where id=w for update;
select status into old_status from requests where id=r;
if s='in_progress' and old_status<>'in_progress' then
if not has_subscription(w) then raise exception 'Subscription inactive';end if;
select max_active_requests into cap from subscriptions where workspace_id=w;
if (select count(*) from requests where workspace_id=w and status='in_progress')>=cap then raise exception 'Active request limit reached';end if;end if;
update requests set status=s where id=r;
insert into request_events(request_id,actor_id,body) values(r,auth.uid(),'Status changed to '||s::text);
if s='completed' and old_status<>'completed' and (select auto_advance from workspaces where id=w) then perform advance_workspace(w);end if;end$$;
create function public.reorder_queue(w uuid,ids uuid[]) returns void language plpgsql security definer set search_path=public as $$declare n integer;begin
if not (owns_workspace(w) or is_admin()) then raise exception 'Unauthorized';end if;
perform 1 from workspaces where id=w for update;
select count(*) into n from requests where workspace_id=w and status='queued';
if cardinality(ids)<>n or (select count(distinct id) from unnest(ids) id)<>n or exists(select 1 from unnest(ids) as x(id) where not exists(select 1 from requests where requests.id=x.id and workspace_id=w and status='queued')) then raise exception 'Queue changed. Refresh and retry';end if;
update requests set position=x.ordinality from unnest(ids) with ordinality as x(id,ordinality) where requests.id=x.id;end$$;
create function public.edit_queued(r uuid,t text,d text,c text,p text,s text,l text) returns void language plpgsql security definer set search_path=public as $$declare w uuid;begin select workspace_id into w from requests where id=r;if not owns_workspace(w) then raise exception 'Unauthorized';end if;perform 1 from workspaces where id=w for update;if not exists(select 1 from requests where id=r and status='queued') then raise exception 'Only queued requests can be edited';end if;update requests set title=t,description=d,category=c,priority=p,success=s,links=l where id=r;end$$;
create function public.delete_queued(r uuid) returns void language plpgsql security definer set search_path=public as $$declare w uuid;begin select workspace_id into w from requests where id=r;if not owns_workspace(w) then raise exception 'Unauthorized';end if;perform 1 from workspaces where id=w for update;if not exists(select 1 from requests where id=r and status='queued') then raise exception 'Only queued requests can be deleted';end if;delete from requests where id=r;end$$;
create function public.request_revision(r uuid,note text) returns void language plpgsql security definer set search_path=public as $$declare w uuid;begin
select workspace_id into w from requests where id=r;if not owns_workspace(w) or not has_subscription(w) then raise exception 'Active subscription required';end if;
perform 1 from workspaces where id=w for update;
if not exists(select 1 from requests where id=r and status='completed') then raise exception 'Only completed requests can be revised';end if;
if length(trim(note))=0 or length(note)>10000 then raise exception 'Describe the revision';end if;
update requests set status='queued',position=(select coalesce(min(position),0)-1 from requests where workspace_id=w and status='queued') where id=r;
update deliverables set approved_at=null where request_id=r;
insert into request_comments(request_id,author_id,body) values(r,auth.uid(),'Revision requested: '||note);
insert into request_events(request_id,actor_id,body) values(r,auth.uid(),'Revision requested; moved to front of queue');end$$;
create function public.approve_deliverable(d uuid) returns void language plpgsql security definer set search_path=public as $$begin if not exists(select 1 from deliverables join requests on requests.id=deliverables.request_id where deliverables.id=d and owns_workspace(requests.workspace_id)) then raise exception 'Unauthorized';end if;update deliverables set approved_at=now() where id=d;end$$;
-- RLS: no client-supplied workspace, author or role can bypass ownership.
alter table profiles enable row level security;alter table workspaces enable row level security;alter table subscriptions enable row level security;alter table requests enable row level security;alter table request_comments enable row level security;alter table request_files enable row level security;alter table deliverables enable row level security;alter table request_events enable row level security;alter table stripe_events enable row level security;
create policy profiles_read on profiles for select to authenticated using(id=auth.uid() or is_admin());
create policy workspace_read on workspaces for select to authenticated using(owns_workspace(id) or is_admin());
create policy workspace_admin on workspaces for update to authenticated using(is_admin()) with check(is_admin());
create policy subscription_read on subscriptions for select to authenticated using(owns_workspace(workspace_id) or is_admin());
create policy requests_read on requests for select to authenticated using(owns_workspace(workspace_id) or is_admin());
create policy requests_admin on requests for update to authenticated using(is_admin()) with check(is_admin());
create policy comments_read on request_comments for select to authenticated using(can_read_request(request_id));
create policy comments_insert on request_comments for insert to authenticated with check(can_read_request(request_id) and author_id=auth.uid());
create policy files_read on request_files for select to authenticated using(can_read_request(request_id));
create policy files_insert on request_files for insert to authenticated with check(can_read_request(request_id) and uploaded_by=auth.uid() and path like request_id::text||'/%');
create policy deliverables_read on deliverables for select to authenticated using(can_read_request(request_id));
create policy deliverables_admin on deliverables for insert to authenticated with check(is_admin() and uploaded_by=auth.uid());
create policy events_read on request_events for select to authenticated using(can_read_request(request_id));
-- Revoke default function access; expose only authenticated RPCs.
revoke all on all functions in schema public from public,anon;
grant execute on function is_admin(),owns_workspace(uuid),can_read_request(uuid),has_subscription(uuid),add_request(uuid,text,text,text,text,text,text),advance_workspace(uuid),set_request_status(uuid,request_status),reorder_queue(uuid,uuid[]),edit_queued(uuid,text,text,text,text,text,text),delete_queued(uuid),request_revision(uuid,text),approve_deliverable(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('request-files','request-files',false,10485760);
create policy private_files_read on storage.objects for select to authenticated using(bucket_id='request-files' and exists(select 1 from requests where id::text=split_part(name,'/',1) and (owns_workspace(workspace_id) or is_admin())));
create policy private_files_insert on storage.objects for insert to authenticated with check(bucket_id='request-files' and exists(select 1 from requests where id::text=split_part(name,'/',1) and (owns_workspace(workspace_id) or is_admin())));

revoke create on schema public from public,anon,authenticated;
