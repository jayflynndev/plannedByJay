-- MANUAL SQL Editor only, AFTER deploying the compatible reference-handling code.
-- Run after 20261027_bespoke_enquiries.sql. Do not rerun/edit that original migration.
begin;
lock table public.bespoke_enquiries in access exclusive mode;

-- Preserve every possibly issued code, including pending/missing email receipts.
-- Original notifications and retry confirmations continue to use this permanent alias.
alter table public.bespoke_enquiries add column if not exists issued_reference text;
do $$begin
 if exists(select 1 from public.bespoke_enquiries where reference !~ '^([0-9]{6}|PBJ-[A-F0-9]{16})$'
   or (reference ~ '^PBJ-' and issued_reference is not null and issued_reference<>reference)) then
   raise exception 'Unexpected existing reference or alias; no references were changed' using errcode='22023';
 end if;
end;$$;
drop trigger if exists bespoke_enquiry_reference_stable on public.bespoke_enquiries;
alter table public.bespoke_enquiries drop constraint if exists bespoke_enquiries_reference_check;
update public.bespoke_enquiries set issued_reference=reference
 where reference ~ '^PBJ-[A-F0-9]{16}$' and issued_reference is null;
alter table public.bespoke_enquiries drop constraint if exists bespoke_enquiries_issued_reference_check;
alter table public.bespoke_enquiries add constraint bespoke_enquiries_issued_reference_check
 check(issued_reference is null or issued_reference ~ '^PBJ-[A-F0-9]{16}$');
create unique index if not exists bespoke_enquiries_issued_reference_key on public.bespoke_enquiries(issued_reference);

create or replace function public.bespoke_reference_candidate() returns text
 language plpgsql volatile set search_path='' as $$
declare sample bigint;
begin
 -- The first 32 bits of PostgreSQL's cryptographically random v4 UUID contain
 -- no UUID version/variant bits. Rejection sampling avoids modulo bias.
 for attempt in 1..16 loop
   sample:=('x'||pg_catalog.substr(pg_catalog.gen_random_uuid()::text,1,8))::bit(32)::bigint;
   if sample<4294000000 then return pg_catalog.lpad((sample%1000000)::text,6,'0');end if;
 end loop;
 raise exception 'A random enquiry reference could not be allocated; retry later' using errcode='55000';
end;$$;
revoke all on function public.bespoke_reference_candidate() from public,anon,authenticated,service_role;
alter table public.bespoke_enquiries alter column reference set default public.bespoke_reference_candidate();

-- Allocate canonical numeric references without touching IDs, answers, timestamps,
-- receipts or errors. A failed allocation rolls the entire migration back.
do $$
declare row_id uuid;candidate text;assigned boolean;conflict_name text;
begin
 for row_id in select id from public.bespoke_enquiries where reference !~ '^[0-9]{6}$' order by created_at,id loop
   assigned:=false;
   for attempt in 1..64 loop
     candidate:=public.bespoke_reference_candidate();
     begin
       update public.bespoke_enquiries set reference=candidate where id=row_id;
       assigned:=true;exit;
     exception when unique_violation then
       get stacked diagnostics conflict_name=constraint_name;
       if conflict_name<>'bespoke_enquiries_reference_key' then raise;end if;
     end;
   end loop;
   if not assigned then raise exception 'No free enquiry reference found after 64 attempts; retry later' using errcode='55000';end if;
 end loop;
end;$$;
alter table public.bespoke_enquiries add constraint bespoke_enquiries_reference_check check(reference ~ '^[0-9]{6}$');

create or replace function public.bespoke_enquiry_reference_stable() returns trigger
 language plpgsql set search_path='' as $$begin
 if new.reference is distinct from old.reference or new.issued_reference is distinct from old.issued_reference then
   raise exception 'Enquiry references are permanent' using errcode='22023';
 end if;
 return new;
end;$$;
revoke all on function public.bespoke_enquiry_reference_stable() from public,anon,authenticated,service_role;
create trigger bespoke_enquiry_reference_stable before update on public.bespoke_enquiries
 for each row execute function public.bespoke_enquiry_reference_stable();

-- Existing validation, duplicate identity, rate limits, permissions and signature
-- are retained. Only allocation changes: the UNIQUE index arbitrates concurrent
-- collisions, and each transaction makes at most 64 candidate insertion attempts.
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
 perform pg_advisory_xact_lock(261027,hashtext(p_request_id::text));
 perform pg_advisory_xact_lock(261028,hashtext(p_client_hash));
 select * into existing from public.bespoke_enquiries where request_id=p_request_id;
 if found then
   if existing.brief->'answers' is distinct from p_brief->'answers' then raise exception 'This request has different answers' using errcode='22023';end if;
   return existing.id;
 end if;
 select * into existing from public.bespoke_enquiries where client_hash=p_client_hash
   and created_at>now()-interval '10 minutes' and brief->'answers'=p_brief->'answers' order by created_at,id limit 1;
 if found then return existing.id;end if;
 if (select count(*) from public.bespoke_enquiries where client_hash=p_client_hash and created_at>now()-interval '10 minutes')>=3 then
   raise exception 'Please wait before sending another enquiry' using errcode='54000';
 end if;
 for attempt in 1..64 loop
   insert into public.bespoke_enquiries(request_id,brief,client_hash) values(p_request_id,p_brief,p_client_hash)
     on conflict(reference) do nothing returning id into enquiry_id;
   if enquiry_id is not null then return enquiry_id;end if;
 end loop;
 raise exception 'No free enquiry reference found after 64 attempts; retry later' using errcode='55000';
end;$$;
-- CREATE OR REPLACE retains the existing service-only execution grant.
-- No table grants, RLS policies, offer objects or stored notification payloads change.
notify pgrst,'reload schema';
commit;
