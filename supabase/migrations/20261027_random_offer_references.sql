-- MANUAL SQL Editor after 20261026_holiday_offer_references.sql, before deploying snagging changes.
-- No customer enquiry or notification snapshot is updated. Bespoke references are independent.
begin;
lock table public.holiday_offers in access exclusive mode;
create table if not exists public.holiday_offer_reference_reservations(
 reference text primary key check(reference ~ '^[0-9]{6}$')
);
alter table public.holiday_offer_reference_reservations enable row level security;
revoke all on public.holiday_offer_reference_reservations from public,anon,authenticated,service_role;

-- The old sequence also consumed numbers on deleted/rolled-back inserts. Reserve
-- that whole range permanently, as well as current and historical snapshot codes.
insert into public.holiday_offer_reference_reservations
 select pg_catalog.lpad(n::text,6,'0') from public.holiday_offer_reference_seq s,
 lateral pg_catalog.generate_series(1,case when s.is_called then s.last_value::integer else 0 end) n on conflict do nothing;
insert into public.holiday_offer_reference_reservations select reference from public.holiday_offers where reference ~ '^[0-9]{6}$' on conflict do nothing;
insert into public.holiday_offer_reference_reservations select offer_snapshot->>'reference' from public.offer_enquiries where offer_snapshot->>'reference' ~ '^[0-9]{6}$' on conflict do nothing;

create or replace function public.holiday_offer_reference_candidate() returns text language plpgsql volatile set search_path='' as $$
declare sample bigint;
begin
 for attempt in 1..16 loop
   sample:=('x'||pg_catalog.substr(pg_catalog.gen_random_uuid()::text,1,8))::bit(32)::bigint;
   if sample<4294000000 then return pg_catalog.lpad((sample%1000000)::text,6,'0');end if;
 end loop;
 raise exception 'A random offer reference is unavailable; retry later' using errcode='55000';
end;$$;
create or replace function public.reserve_holiday_offer_reference() returns text language plpgsql set search_path='' as $$
declare reserved text;
begin
 for attempt in 1..64 loop
   insert into public.holiday_offer_reference_reservations(reference) values(public.holiday_offer_reference_candidate())
    on conflict do nothing returning reference into reserved;
   if reserved is not null then return reserved;end if;
 end loop;
 raise exception 'No free offer reference found after 64 attempts; retry later' using errcode='55000';
end;$$;
revoke all on function public.holiday_offer_reference_candidate(),public.reserve_holiday_offer_reference() from public,anon,authenticated,service_role;

alter table public.holiday_offers add column if not exists previous_reference text check(previous_reference is null or previous_reference ~ '^[0-9]{6}$');
create unique index if not exists holiday_offers_previous_reference_key on public.holiday_offers(previous_reference);
drop trigger if exists holiday_offer_reference on public.holiday_offers;
-- Reconcile the original displayed 000001 once. Keep it as a permanent alias, and
-- retain old enquiry snapshots/notifications verbatim. IDs, URLs, dates and versions stay unchanged.
alter table public.holiday_offers disable trigger holiday_offer_dates;
-- Very old snapshots with no numeric code resolve through the existing offer
-- reference. Retain that primary value rather than changing any retry payload.
do $$begin
 if exists(select 1 from public.holiday_offers o join public.offer_enquiries e on e.offer_id=o.id
  where o.reference='000001' and coalesce(e.offer_snapshot->>'reference','') !~ '^[0-9]{6}$') then
  raise notice '000001 retained: an earlier enquiry relies on its reference fallback. Future offers still receive random codes.';
 end if;
end;$$;
update public.holiday_offers o set previous_reference=reference,reference=public.reserve_holiday_offer_reference()
 where reference='000001' and previous_reference is null
 and not exists(select 1 from public.offer_enquiries e where e.offer_id=o.id and coalesce(e.offer_snapshot->>'reference','') !~ '^[0-9]{6}$');
alter table public.holiday_offers enable trigger holiday_offer_dates;

create or replace function public.holiday_offer_reference() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='UPDATE' then new.reference:=old.reference;new.previous_reference:=old.previous_reference;
 else
   select o.reference,o.previous_reference into new.reference,new.previous_reference from public.holiday_offers o where o.id=new.id;
   if not found then new.reference:=public.reserve_holiday_offer_reference();new.previous_reference:=null;end if;
 end if;
 return new;
end;$$;
revoke all on function public.holiday_offer_reference() from public,anon,authenticated,service_role;
create trigger holiday_offer_reference before insert or update on public.holiday_offers for each row execute function public.holiday_offer_reference();
-- Never reset the old sequence, delete reservations, or rerun the old reference migration.
notify pgrst,'reload schema';
commit;
