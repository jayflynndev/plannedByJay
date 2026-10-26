-- MANUAL Supabase SQL Editor application only. Requires the existing Articles admin function.
-- No supplier imports, public supplier pages, offers or changes to existing CMS data.
begin;
create table if not exists public.suppliers (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(btrim(name)) between 1 and 120),
 normalised_name text generated always as (lower(btrim(regexp_replace(name,'\s+',' ','g')))) stored unique,
 website text not null default '' check(length(website)<=2000),
 legal_name text not null default '' check(length(legal_name)<=200),
 business_address text not null default '' check(length(business_address)<=1000),
 contact_email text not null default '' check(length(contact_email)<=320),
 contact_url text not null default '' check(length(contact_url)<=2000),
 atol_holder text not null default '' check(length(atol_holder)<=200),
 atol_number text not null default '' check(atol_number ~ '^[0-9]{0,10}$'),
 booking_conditions_url text not null default '' check(length(booking_conditions_url)<=2000),
 specialism text not null default '' check(length(specialism)<=80),
 status text not null default 'draft' check(status in ('draft','approved')),
 sources jsonb not null default '{}' check(jsonb_typeof(sources)='object' and octet_length(sources::text)<=30000),
 archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1
);
create or replace function public.supplier_dates() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='UPDATE' then new.id:=old.id;new.created_at:=old.created_at;new.version:=old.version+1;
 else new.created_at:=now();new.version:=1;end if;
 new.updated_at:=now();return new;
end;$$;
drop trigger if exists supplier_dates on public.suppliers;
create trigger supplier_dates before insert or update on public.suppliers for each row execute function public.supplier_dates();
revoke all on function public.supplier_dates() from public,anon,authenticated;
alter table public.suppliers enable row level security;
revoke all on public.suppliers from public,anon,authenticated;
-- Archive/restore retains stable IDs and future references. No destructive delete privilege.
grant select,insert,update on public.suppliers to authenticated;
drop policy if exists suppliers_admin on public.suppliers;
create policy suppliers_admin on public.suppliers for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
notify pgrst,'reload schema';
commit;
