-- MANUAL approval only, after the 20261012 and 20261013 enquiry migrations.
-- No enquiry or snapshot is changed/deleted by applying this migration.
begin;
lock table public.holiday_enquiries in share row exclusive mode;
create table public.holiday_notification_erasure_blockers (
  enquiry_id uuid not null references public.holiday_enquiries(id) on delete restrict,
  attempt_token uuid not null,
  kind text not null check (kind in ('legacy_review','attempt')),
  primary key (enquiry_id, attempt_token)
);
alter table public.holiday_notification_erasure_blockers enable row level security;
revoke all on public.holiday_notification_erasure_blockers from public, anon, authenticated;
grant select, insert, delete on public.holiday_notification_erasure_blockers to service_role;
-- Existing records may have workers from before tracking was introduced. Fail closed.
insert into public.holiday_notification_erasure_blockers
  select id, '00000000-0000-0000-0000-000000000000'::uuid, 'legacy_review'
  from public.holiday_enquiries;

create function public.track_holiday_notification_attempt()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.lease_token is not null and (tg_op = 'INSERT' or new.lease_token is distinct from old.lease_token) then
    insert into public.holiday_notification_erasure_blockers values(new.id,new.lease_token,'attempt');
  end if;
  return new;
end;
$$;
create trigger track_holiday_notification_attempt after insert or update of lease_token
  on public.holiday_enquiries for each row execute function public.track_holiday_notification_attempt();

-- Preserve the existing completion contract/backoff/idempotency. A stale worker can
-- release only its own blocker after its send has ended, never another worker's.
create or replace function public.finish_holiday_notification(p_id uuid, p_lease uuid, p_accepted boolean, p_provider_id text, p_error_code text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  perform 1 from public.holiday_enquiries where id=p_id for update;
  if p_accepted and (p_provider_id is null or length(p_provider_id)>200) then return false; end if;
  update public.holiday_enquiries set
    notification_status = case when p_accepted then 'accepted' when notification_attempts >= 6 then 'manual_review' else 'failed' end,
    notification_provider_id = case when p_accepted then p_provider_id else notification_provider_id end,
    notification_accepted_at = case when p_accepted then now() else notification_accepted_at end,
    notification_last_error = case when p_accepted then null else left(p_error_code,100) end,
    notification_next_attempt_at = now() + make_interval(secs => least(3600,(60*power(2,notification_attempts-1))::integer)),
    lease_token=null, lease_until=null
    where id=p_id and lease_token=p_lease and notification_status='sending';
  get diagnostics changed = row_count;
  delete from public.holiday_notification_erasure_blockers
    where enquiry_id=p_id and attempt_token=p_lease and kind='attempt';
  return changed=1;
end;
$$;

-- SQL-editor/server-service operation only; not a public HTTP endpoint.
-- SECURITY DEFINER permits narrowly checked deletion after direct service DELETE is revoked.
create function public.erase_holiday_enquiry(p_id uuid, p_reference text, p_authorised boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare target public.holiday_enquiries%rowtype;
begin
  if p_authorised is distinct from true then return 'authorisation_required'; end if;
  select * into target from public.holiday_enquiries where id=p_id for update;
  if not found then return 'not_found'; end if;
  if target.reference is distinct from p_reference then return 'reference_mismatch'; end if;
  if exists(select 1 from public.holiday_notification_erasure_blockers where enquiry_id=p_id)
    or target.lease_token is not null or target.lease_until is not null then return 'notification_unresolved'; end if;
  -- Failed, manual-review and expired sending states are NOT proof of no outstanding send.
  if not ((target.notification_status='pending' and target.notification_attempts=0 and target.notification_first_attempt_at is null)
    or (target.notification_status='accepted' and target.notification_provider_id is not null)) then
    return 'notification_unresolved';
  end if;
  delete from public.holiday_enquiries where id=p_id;
  return 'erased';
end;
$$;
revoke all on function public.track_holiday_notification_attempt() from public, anon, authenticated;
revoke all on function public.erase_holiday_enquiry(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.erase_holiday_enquiry(uuid,text,boolean) to service_role;
revoke delete on public.holiday_enquiries from service_role;
commit;
