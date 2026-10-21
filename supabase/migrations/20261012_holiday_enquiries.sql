-- Run once in a Supabase project's SQL editor. No browser/user access is granted.
-- SECURITY INVOKER functions are callable only by service_role; RLS blocks anon/authenticated.
begin;
create table public.holiday_enquiries (
  id uuid primary key,
  reference text not null unique,
  received_at timestamptz not null default now(),
  brief jsonb not null,
  notification_email jsonb not null,
  fingerprint text not null,
  session_hash text not null,
  email_hash text not null,
  notification_status text not null default 'pending' check (notification_status in ('pending','sending','accepted','failed','manual_review')),
  notification_attempts integer not null default 0,
  notification_first_attempt_at timestamptz,
  notification_accepted_at timestamptz,
  notification_provider_id text,
  notification_last_error text,
  notification_next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz
);
create index holiday_notification_due on public.holiday_enquiries(notification_next_attempt_at) where notification_status in ('pending','failed','sending');
create index holiday_enquiry_dedup on public.holiday_enquiries(email_hash, fingerprint, received_at);
create table public.holiday_enquiry_limits (
  actor_hash text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (actor_hash, window_start)
);
alter table public.holiday_enquiries enable row level security;
alter table public.holiday_enquiry_limits enable row level security;
revoke all on public.holiday_enquiries, public.holiday_enquiry_limits from public, anon, authenticated;
grant select, insert, update, delete on public.holiday_enquiries, public.holiday_enquiry_limits to service_role;

create function public.receive_holiday_enquiry(
  p_id uuid, p_reference text, p_received_at timestamptz, p_brief jsonb, p_email jsonb,
  p_fingerprint text, p_session_hash text, p_email_hash text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  existing public.holiday_enquiries%rowtype;
  bucket timestamptz := date_trunc('hour', now());
  session_count integer;
  email_count integer;
begin
  -- A short transaction-wide lock makes deduplication and both rate counters atomic across
  -- serverless instances. Small-business traffic; no network work happens inside this lock.
  perform pg_advisory_xact_lock(734021901);
  select * into existing from public.holiday_enquiries where id = p_id;
  if found then
    if existing.fingerprint <> p_fingerprint or existing.session_hash <> p_session_hash then
      return jsonb_build_object('outcome','conflict');
    end if;
    return jsonb_build_object('outcome','duplicate','id',existing.id,'reference',existing.reference);
  end if;
  select * into existing from public.holiday_enquiries
    where email_hash = p_email_hash and fingerprint = p_fingerprint and received_at > now() - interval '24 hours'
    order by received_at desc limit 1;
  if found then
    return jsonb_build_object('outcome','duplicate','id',existing.id,'reference',existing.reference);
  end if;
  select count into session_count from public.holiday_enquiry_limits where actor_hash = p_session_hash and window_start = bucket;
  select count into email_count from public.holiday_enquiry_limits where actor_hash = p_email_hash and window_start = bucket;
  if coalesce(session_count,0) >= 5 or coalesce(email_count,0) >= 3 then
    return jsonb_build_object('outcome','rate_limited');
  end if;
  insert into public.holiday_enquiry_limits(actor_hash,window_start,count) values (p_session_hash,bucket,1),(p_email_hash,bucket,1)
    on conflict (actor_hash,window_start) do update set count = public.holiday_enquiry_limits.count + 1;
  delete from public.holiday_enquiry_limits where window_start < now() - interval '2 days';
  insert into public.holiday_enquiries(id,reference,received_at,brief,notification_email,fingerprint,session_hash,email_hash)
    values(p_id,p_reference,p_received_at,p_brief,p_email,p_fingerprint,p_session_hash,p_email_hash);
  return jsonb_build_object('outcome','received','id',p_id,'reference',p_reference);
end;
$$;

create function public.claim_holiday_notification(p_id uuid default null)
returns setof public.holiday_enquiries language plpgsql security invoker set search_path = '' as $$
declare selected_id uuid;
begin
  -- Resend retains idempotency keys for 24 hours. After 23h, stop automatic sending;
  -- operator reconciliation prevents sending twice after an ambiguous provider timeout.
  update public.holiday_enquiries set notification_status = 'manual_review',
    notification_last_error = 'retry_window_or_attempt_limit', lease_token = null, lease_until = null
    where notification_status in ('pending','failed','sending')
      and (lease_until is null or lease_until < now())
      and (notification_attempts >= 6 or notification_first_attempt_at < now() - interval '23 hours')
      and (p_id is null or id = p_id);
  select id into selected_id from public.holiday_enquiries
    where (p_id is null or id = p_id)
      and ((notification_status in ('pending','failed') and notification_next_attempt_at <= now())
        or (notification_status = 'sending' and lease_until < now()))
    order by notification_next_attempt_at, received_at
    for update skip locked limit 1;
  if selected_id is null then return; end if;
  return query update public.holiday_enquiries set
    notification_status = 'sending', notification_attempts = notification_attempts + 1,
    notification_first_attempt_at = coalesce(notification_first_attempt_at, now()),
    lease_token = gen_random_uuid(), lease_until = now() + interval '90 seconds'
    where id = selected_id returning *;
end;
$$;

create function public.finish_holiday_notification(p_id uuid, p_lease uuid, p_accepted boolean, p_provider_id text, p_error_code text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  if p_accepted and (p_provider_id is null or length(p_provider_id) > 200) then return false; end if;
  update public.holiday_enquiries set
    notification_status = case when p_accepted then 'accepted' when notification_attempts >= 6 then 'manual_review' else 'failed' end,
    notification_provider_id = case when p_accepted then p_provider_id else notification_provider_id end,
    notification_accepted_at = case when p_accepted then now() else notification_accepted_at end,
    notification_last_error = case when p_accepted then null else left(p_error_code,100) end,
    notification_next_attempt_at = now() + make_interval(secs => least(3600, (60 * power(2,notification_attempts - 1))::integer)),
    lease_token = null, lease_until = null
    where id = p_id and lease_token = p_lease and notification_status = 'sending';
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.receive_holiday_enquiry(uuid,text,timestamptz,jsonb,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.claim_holiday_notification(uuid) from public, anon, authenticated;
revoke all on function public.finish_holiday_notification(uuid,uuid,boolean,text,text) from public, anon, authenticated;
grant execute on function public.receive_holiday_enquiry(uuid,text,timestamptz,jsonb,jsonb,text,text,text) to service_role;
grant execute on function public.claim_holiday_notification(uuid) to service_role;
grant execute on function public.finish_holiday_notification(uuid,uuid,boolean,text,text) to service_role;
commit;
