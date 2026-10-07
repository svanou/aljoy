-- Integration checks. Run with psql against a disposable migrated Supabase DB.
-- Everything rolls back. Do not run concurrently with unrelated test fixtures.
begin;
insert into auth.users(id,email,raw_user_meta_data) values('11111111-1111-4111-8111-111111111111','client-a@test.invalid','{"first_name":"A"}'),('22222222-2222-4222-8222-222222222222','client-b@test.invalid','{"first_name":"B"}'),('33333333-3333-4333-8333-333333333333','admin@test.invalid','{}');
update profiles set role='admin' where id='33333333-3333-4333-8333-333333333333';
update subscriptions set status='active',current_period_end=now()+interval '1 month';
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select add_request((select id from workspaces),'B private request','Private','Automation','Normal','Working','');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$begin
if exists(select 1 from requests where title='B private request') then raise exception 'FAIL: cross-client read';end if;
if exists(select 1 from profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'FAIL: cross-client profile read';end if;
begin update profiles set role='admin' where id=auth.uid();if found then raise exception 'FAIL: client escalated role';end if;exception when insufficient_privilege then null;end;
end$$;
select add_request((select id from workspaces),'First','A','Automation','Normal','Working','');
select add_request((select id from workspaces),'Second','B','Automation','Normal','Working','');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select advance_workspace((select id from workspaces where owner_id='11111111-1111-4111-8111-111111111111'));
select set_request_status((select id from requests where title='First'),'completed');
do $$begin if not exists(select 1 from requests where title='Second' and status='in_progress') then raise exception 'FAIL: queue did not advance';end if;end$$;
reset role;
update subscriptions set current_period_end=now()-interval '1 second' where workspace_id=(select id from workspaces where owner_id='11111111-1111-4111-8111-111111111111');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$begin
begin perform add_request((select id from workspaces),'Expired','X','Automation','Normal','Working','');raise exception 'FAIL: expired subscriber created request';exception when raise_exception then if sqlerrm like 'FAIL:%' then raise;end if;end;
if not exists(select 1 from requests where title='First') then raise exception 'FAIL: historical work inaccessible';end if;
end$$;
rollback;
