-- MANUAL Supabase SQL Editor only, AFTER 20261026_holiday_offers_cms.sql.
-- Converts the old UUID-derived label; all other offer data and enquiry snapshots are retained.
begin;
lock table public.holiday_offers in access exclusive mode;

-- A non-cycling sequence reserves numbers permanently, including after deletion/rollback.
-- Never restart/reset this sequence. Gaps are expected and are not reused.
create sequence if not exists public.holiday_offer_reference_seq
 as integer minvalue 1 maxvalue 999999 start with 1 no cycle;
revoke all on sequence public.holiday_offer_reference_seq from public,anon,authenticated,service_role;

drop trigger if exists holiday_offer_reference on public.holiday_offers;
alter table public.holiday_offers alter column reference drop expression if exists;

-- Re-running never moves the counter backwards or changes an existing six-digit reference.
do $$
declare highest integer;
begin
 select max(case when reference ~ '^[0-9]{6}$' then reference::integer end)
 into highest from public.holiday_offers;
 if highest >= (select last_value from public.holiday_offer_reference_seq) then
   perform pg_catalog.setval('public.holiday_offer_reference_seq'::regclass,highest,true);
 end if;
end;$$;

-- Backfill only the reference. Avoid changing versions, timestamps, publication dates,
-- or revalidating an older/departed published holiday during this maintenance operation.
alter table public.holiday_offers disable trigger holiday_offer_dates;
update public.holiday_offers
 set reference=pg_catalog.lpad(pg_catalog.nextval('public.holiday_offer_reference_seq'::regclass)::text,6,'0')
 where reference is null or reference !~ '^[0-9]{6}$';
alter table public.holiday_offers enable trigger holiday_offer_dates;
alter table public.holiday_offers alter column reference set not null;
alter table public.holiday_offers drop constraint if exists holiday_offers_reference_format;
alter table public.holiday_offers add constraint holiday_offers_reference_format check(reference ~ '^[0-9]{6}$');
-- The original holiday_offers_reference_key UNIQUE constraint remains in force.

create or replace function public.holiday_offer_reference() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
   new.reference:=old.reference;
 else
   -- save_holiday_offer uses an upsert. An edit must not consume another number.
   select o.reference into new.reference from public.holiday_offers o where o.id=new.id;
   if not found then
     new.reference:=pg_catalog.lpad(pg_catalog.nextval('public.holiday_offer_reference_seq'::regclass)::text,6,'0');
   end if;
 end if;
 return new;
end;$$;
revoke all on function public.holiday_offer_reference() from public,anon,authenticated,service_role;
create trigger holiday_offer_reference before insert or update on public.holiday_offers
 for each row execute function public.holiday_offer_reference();

-- Existing receive_offer_enquiry already snapshots the saved o.reference.
-- Historical snapshots are deliberately unchanged; their offer_id links to the new reference.
-- Notification retries can resolve those historical snapshots without changing them.
grant select(id,reference) on public.holiday_offers to service_role;
notify pgrst,'reload schema';
commit;
