-- MANUAL Supabase SQL Editor only, after the existing Articles and offer-enquiry setup.
-- Adds bespoke enquiry storage only. Existing offers, enquiries and authentication are retained.
begin;
create table if not exists public.bespoke_enquiries (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique default ('PBJ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))) check(reference ~ '^PBJ-[A-F0-9]{16}$'),
 request_id uuid not null unique,
 created_at timestamptz not null default now(),
 brief jsonb not null check(jsonb_typeof(brief)='object' and octet_length(brief::text)<=60000),
 name text generated always as (brief->'answers'->>'name') stored not null check(length(name) between 1 and 100),
 email text generated always as (brief->'answers'->>'email') stored not null check(length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text generated always as (brief->'answers'->>'phone') stored not null check(length(phone)<=40),
 client_hash text not null check(client_hash ~ '^[a-f0-9]{64}$'),
 notification_id text check(length(notification_id) between 1 and 200),notified_at timestamptz,
 notification_attempted_at timestamptz,last_notification_error text check(last_notification_error ~ '^[A-Z0-9_]{1,80}$')
);
create index if not exists bespoke_enquiries_received on public.bespoke_enquiries(created_at desc,id);
create index if not exists bespoke_enquiries_rate on public.bespoke_enquiries(client_hash,created_at desc);
alter table public.bespoke_enquiries enable row level security;
revoke all on public.bespoke_enquiries from public,anon,authenticated,service_role;
grant select on public.bespoke_enquiries to authenticated,service_role;
-- Submitted answers, reference, request identity and dates cannot be edited by the mail service.
grant update(notification_id,notified_at,notification_attempted_at,last_notification_error) on public.bespoke_enquiries to service_role;
drop policy if exists bespoke_enquiries_admin on public.bespoke_enquiries;
create policy bespoke_enquiries_admin on public.bespoke_enquiries for select to authenticated using(public.articles_is_admin());
create or replace function public.receive_bespoke_enquiry(p_request_id uuid,p_brief jsonb,p_client_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.bespoke_enquiries;enquiry_id uuid;
begin
 if p_request_id is null or p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$'
   or p_brief is null or octet_length(p_brief::text)>60000
   or jsonb_typeof(p_brief) is distinct from 'object' or p_brief->>'schema_version' is distinct from '1'
   or jsonb_typeof(p_brief->'answers') is distinct from 'object'
   or jsonb_typeof(p_brief->'summary') is distinct from 'array' then
   raise exception 'Check your holiday brief' using errcode='22023';
 end if;
 if jsonb_array_length(p_brief->'summary') not between 1 and 30 then raise exception 'Check your holiday brief' using errcode='22023';end if;
 -- Separate lock namespaces protect retry identity and per-client rate checks concurrently.
 perform pg_advisory_xact_lock(261027,hashtext(p_request_id::text));
 perform pg_advisory_xact_lock(261028,hashtext(p_client_hash));
 select * into existing from public.bespoke_enquiries where request_id=p_request_id;
 if found then
   if existing.brief->'answers' is distinct from p_brief->'answers' then raise exception 'This request has different answers' using errcode='22023';end if;
   return existing.id;
 end if;
 -- A reload may generate a new request UUID. An identical brief from the same client
 -- within the rate window still returns the original record, without browser answer storage.
 select * into existing from public.bespoke_enquiries where client_hash=p_client_hash
   and created_at>now()-interval '10 minutes' and brief->'answers'=p_brief->'answers' order by created_at,id limit 1;
 if found then return existing.id;end if;
 if (select count(*) from public.bespoke_enquiries where client_hash=p_client_hash and created_at>now()-interval '10 minutes')>=3 then
   raise exception 'Please wait before sending another enquiry' using errcode='54000';
 end if;
 insert into public.bespoke_enquiries(request_id,brief,client_hash) values(p_request_id,p_brief,p_client_hash) returning id into enquiry_id;
 return enquiry_id;
end;$$;
revoke all on function public.receive_bespoke_enquiry(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.receive_bespoke_enquiry(uuid,jsonb,text) to service_role;
notify pgrst,'reload schema';
commit;
