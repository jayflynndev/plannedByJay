-- MANUAL Supabase SQL Editor only, AFTER Articles, Holiday Types and Suppliers migrations.
-- No existing records are changed and no offers/customer data are seeded.
begin;
create table if not exists public.holiday_offers(
 id uuid primary key default gen_random_uuid(),
 reference text generated always as ('PBJ-'||upper(substr(replace(id::text,'-',''),1,12))) stored unique,
 supplier_id uuid references public.suppliers(id) on delete restrict,
 title text not null default '' check(length(title)<=180),
 slug text not null unique check(length(slug) between 1 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 country text not null default '' check(length(country)<=100),
 resort text not null default '' check(length(resort)<=160),
 accommodation text not null default '' check(length(accommodation)<=200),
 summary text not null default '' check(length(summary)<=500),
 body text not null default '' check(length(body)<=150000),
 why_jay text not null default '' check(length(why_jay)<=500),
 travel_type text not null default 'package' check(travel_type in ('package','fly-cruise','cruise-only','hotel-only','tour','rail','other')),
 flights_included boolean not null default false,
 departure_point text not null default '' check(length(departure_point)<=160),
 departure_date date,
 return_date date,
 nights integer check(nights between 0 and 730),
 board_basis text not null default '' check(length(board_basis)<=120),
 room_type text not null default '' check(length(room_type)<=160),
 adults integer not null default 2 check(adults between 0 and 50),
 children integer not null default 0 check(children between 0 and 20),
 child_ages integer[] not null default '{}' check(0<=all(child_ages) and 17>=all(child_ages) and cardinality(child_ages)<=20),
 inclusions text not null default '' check(length(inclusions)<=5000),
 exclusions text not null default '' check(length(exclusions)<=5000),
 total_price_minor bigint check(total_price_minor between 1 and 1000000000),
 currency text not null default 'GBP' check(currency in ('GBP','EUR','USD')),
 show_per_person boolean not null default false,
 price_checked_on date,
 booking_deadline date,
 mandatory_charges text not null default '' check(length(mandatory_charges)<=2000),
 featured_image text not null default '' check(featured_image='' or featured_image ~ '^[a-f0-9-]{36}-[a-z0-9-]{1,80}\.webp$'),
 featured_alt text not null default '' check(length(featured_alt)<=300),
 gallery jsonb not null default '[]' check(jsonb_typeof(gallery)='array' and jsonb_array_length(gallery)<=8 and octet_length(gallery::text)<=10000),
 sash text not null default '' check(sash in ('','jays-pick','leaving-soon','deal-of-month','family-favourite','adults-only','something-different')),
 adults_only_confirmed boolean not null default false,
 featured boolean not null default false,
 protection text not null default '' check(protection in ('','supplier-atol','other')),
 protection_note text not null default '' check(length(protection_note)<=2000),
 status text not null default 'draft' check(status in ('draft','published')),
 archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),published_at timestamptz,version integer not null default 1,
 check(return_date is null or departure_date is null or return_date>=departure_date)
);
create table if not exists public.offer_holiday_types(offer_id uuid not null references public.holiday_offers(id) on delete cascade,holiday_type_id uuid not null references public.holiday_types(id) on delete restrict,primary key(offer_id,holiday_type_id));
create index if not exists holiday_offers_public_order on public.holiday_offers(departure_date,id) where status='published' and not archived;
create index if not exists offer_holiday_types_reverse on public.offer_holiday_types(holiday_type_id,offer_id);
create or replace function public.holiday_offer_is_public(o public.holiday_offers) returns boolean language sql stable security definer set search_path='' as $$
 select o.status='published' and not o.archived and o.departure_date>=(now() at time zone 'Europe/London')::date
 and (o.booking_deadline is null or o.booking_deadline>=(now() at time zone 'Europe/London')::date)
 and exists(select 1 from public.suppliers s where s.id=o.supplier_id and s.status='approved' and not s.archived and btrim(s.legal_name)<>'' and btrim(s.business_address)<>'' and (btrim(s.contact_email)<>'' or btrim(s.contact_url)<>'') and btrim(s.booking_conditions_url)<>'' and (o.protection<>'supplier-atol' or (btrim(s.atol_holder)<>'' and btrim(s.atol_number)<>'')));
$$;
revoke all on function public.holiday_offer_is_public(public.holiday_offers) from public;
grant execute on function public.holiday_offer_is_public(public.holiday_offers) to anon,authenticated;
create or replace function public.holiday_offer_dates() returns trigger language plpgsql set search_path='' as $$
declare s public.suppliers;today date:=(now() at time zone 'Europe/London')::date;
begin
 if tg_op='UPDATE' then
   if old.published_at is not null and new.slug<>old.slug then raise exception 'Published URLs are permanent' using errcode='22023';end if;
   new.id:=old.id;new.created_at:=old.created_at;new.published_at:=old.published_at;new.version:=old.version+1;
 else new.created_at:=now();new.published_at:=null;new.version:=1;end if;
 if new.return_date is not null and new.departure_date is not null then new.nights:=new.return_date-new.departure_date;end if;
 if new.status='published' and not new.archived then
   if btrim(new.title)='' or btrim(new.country)='' or btrim(new.summary)='' or new.departure_date is null or new.departure_date<today or (new.nights is null or new.nights<0) or new.adults<1 or (cardinality(new.child_ages)>0 and new.children<>cardinality(new.child_ages)) or new.total_price_minor is null or new.price_checked_on is null or new.price_checked_on>today or (new.flights_included and btrim(new.departure_point)='') or btrim(new.inclusions)='' or (new.booking_deadline is not null and new.booking_deadline<today) then raise exception 'Complete the essential holiday, dates, party and checked price before publishing' using errcode='22023';end if;
   select * into s from public.suppliers where id=new.supplier_id;
   if not found or s.status<>'approved' or s.archived or btrim(s.legal_name)='' or btrim(s.business_address)='' or (btrim(s.contact_email)='' and btrim(s.contact_url)='') or btrim(s.booking_conditions_url)='' then raise exception 'Complete the selected active Approved supplier record first' using errcode='22023';end if;
   if new.protection='supplier-atol' and (not new.flights_included or btrim(s.atol_holder)='' or btrim(s.atol_number)='') then raise exception 'Confirm offer-specific flight/ATOL arrangements and supplier holder details' using errcode='22023';end if;
   if new.protection='other' and btrim(new.protection_note)='' then raise exception 'Describe the confirmed protection arrangements' using errcode='22023';end if;
   if new.sash='adults-only' and (not new.adults_only_confirmed or new.children>0) then raise exception 'Adults Only requires confirmed arrangements and no children in the priced party' using errcode='22023';end if;
   if new.published_at is null then new.published_at:=now();end if;
 end if;
 new.updated_at:=now();return new;
end;$$;
drop trigger if exists holiday_offer_dates on public.holiday_offers;
create trigger holiday_offer_dates before insert or update on public.holiday_offers for each row execute function public.holiday_offer_dates();
revoke all on function public.holiday_offer_dates() from public,anon,authenticated;
alter table public.holiday_offers enable row level security;
alter table public.offer_holiday_types enable row level security;
revoke all on public.holiday_offers,public.offer_holiday_types from public,anon,authenticated;
grant select on public.holiday_offers,public.offer_holiday_types to anon,authenticated;
grant insert,update on public.holiday_offers to authenticated;
grant insert,update,delete on public.offer_holiday_types to authenticated;
drop policy if exists holiday_offers_read on public.holiday_offers;
create policy holiday_offers_read on public.holiday_offers for select using(public.articles_is_admin() or public.holiday_offer_is_public(holiday_offers));
drop policy if exists holiday_offers_write on public.holiday_offers;
create policy holiday_offers_write on public.holiday_offers for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
drop policy if exists offer_types_read on public.offer_holiday_types;
create policy offer_types_read on public.offer_holiday_types for select using(public.articles_is_admin() or exists(select 1 from public.holiday_offers o where o.id=offer_id));
drop policy if exists offer_types_write on public.offer_holiday_types;
create policy offer_types_write on public.offer_holiday_types for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
create or replace function public.save_holiday_offer(p_offer jsonb,p_types uuid[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.holiday_offers;incoming public.holiday_offers;saved public.holiday_offers;
begin
 if not public.articles_is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 if cardinality(p_types)>30 then raise exception 'Choose at most thirty Holiday Types' using errcode='22023';end if;
 if nullif(p_offer->>'id','') is not null then
   select * into prior from public.holiday_offers where id=(p_offer->>'id')::uuid for update;
   if not found or prior.version is distinct from (p_offer->>'version')::integer then raise exception 'Offer changed elsewhere' using errcode='40001';end if;
 end if;
 if exists(select 1 from unnest(coalesce(p_types,'{}')) t where not exists(select 1 from public.holiday_types h where h.id=t and h.status='published')) then raise exception 'Choose published Holiday Types, or remove unavailable selections' using errcode='22023';end if;
 incoming:=jsonb_populate_record(null::public.holiday_offers,p_offer);
 insert into public.holiday_offers(id,supplier_id,title,slug,country,resort,accommodation,summary,body,why_jay,travel_type,flights_included,departure_point,departure_date,return_date,nights,board_basis,room_type,adults,children,child_ages,inclusions,exclusions,total_price_minor,currency,show_per_person,price_checked_on,booking_deadline,mandatory_charges,featured_image,featured_alt,gallery,sash,adults_only_confirmed,featured,protection,protection_note,status)
 values(coalesce(prior.id,gen_random_uuid()),incoming.supplier_id,incoming.title,incoming.slug,incoming.country,incoming.resort,incoming.accommodation,incoming.summary,incoming.body,incoming.why_jay,incoming.travel_type,incoming.flights_included,incoming.departure_point,incoming.departure_date,incoming.return_date,incoming.nights,incoming.board_basis,incoming.room_type,incoming.adults,incoming.children,incoming.child_ages,incoming.inclusions,incoming.exclusions,incoming.total_price_minor,incoming.currency,incoming.show_per_person,incoming.price_checked_on,incoming.booking_deadline,incoming.mandatory_charges,incoming.featured_image,incoming.featured_alt,incoming.gallery,incoming.sash,incoming.adults_only_confirmed,incoming.featured,incoming.protection,incoming.protection_note,incoming.status)
 on conflict(id) do update set supplier_id=excluded.supplier_id,title=excluded.title,slug=excluded.slug,country=excluded.country,resort=excluded.resort,accommodation=excluded.accommodation,summary=excluded.summary,body=excluded.body,why_jay=excluded.why_jay,travel_type=excluded.travel_type,flights_included=excluded.flights_included,departure_point=excluded.departure_point,departure_date=excluded.departure_date,return_date=excluded.return_date,nights=excluded.nights,board_basis=excluded.board_basis,room_type=excluded.room_type,adults=excluded.adults,children=excluded.children,child_ages=excluded.child_ages,inclusions=excluded.inclusions,exclusions=excluded.exclusions,total_price_minor=excluded.total_price_minor,currency=excluded.currency,show_per_person=excluded.show_per_person,price_checked_on=excluded.price_checked_on,booking_deadline=excluded.booking_deadline,mandatory_charges=excluded.mandatory_charges,featured_image=excluded.featured_image,featured_alt=excluded.featured_alt,gallery=excluded.gallery,sash=excluded.sash,adults_only_confirmed=excluded.adults_only_confirmed,featured=excluded.featured,protection=excluded.protection,protection_note=excluded.protection_note,status=excluded.status returning * into saved;
 delete from public.offer_holiday_types where offer_id=saved.id;
 insert into public.offer_holiday_types select distinct saved.id,x from unnest(coalesce(p_types,'{}')) x;
 return to_jsonb(saved)||jsonb_build_object('holiday_type_ids',coalesce(to_jsonb(p_types),'[]'::jsonb));
end;$$;
revoke all on function public.save_holiday_offer(jsonb,uuid[]) from public,anon,authenticated;
grant execute on function public.save_holiday_offer(jsonb,uuid[]) to authenticated;
-- This RPC exposes only eligible offers and the public identity/contact fields of their supplier.
-- The supplier table itself remains entirely private.
create or replace function public.public_holiday_offers(p_destination text default '',p_type uuid default null,p_month date default null,p_sort text default 'departure',p_featured boolean default false,p_slug text default null,p_offset integer default 0,p_limit integer default 12) returns jsonb language sql stable security definer set search_path='' as $$
 with eligible as (
 select o.*,row_number() over(order by case when p_sort='price' then o.currency end,case when p_sort='price' then o.total_price_minor end,o.departure_date,o.id) as position
 from public.holiday_offers o where public.holiday_offer_is_public(o)
 and (not p_featured or o.featured) and (p_slug is null or o.slug=p_slug)
 and (coalesce(p_destination,'')='' or position(lower(left(p_destination,100)) in lower(o.country||' '||o.resort))>0)
 and (p_month is null or (o.departure_date>=p_month and o.departure_date<(p_month+interval '1 month')))
 and (p_type is null or exists(select 1 from public.offer_holiday_types l join public.holiday_types h on h.id=l.holiday_type_id where l.offer_id=o.id and h.id=p_type and h.status='published'))
 ), selected as (select * from eligible order by position offset greatest(0,least(p_offset,100000)) limit greatest(1,least(p_limit,100)))
 select jsonb_build_object('total',(select count(*) from eligible),'offers',coalesce((select jsonb_agg((to_jsonb(o)-'position')||jsonb_build_object('holiday_type_ids',coalesce((select jsonb_agg(l.holiday_type_id) from public.offer_holiday_types l join public.holiday_types h on h.id=l.holiday_type_id where l.offer_id=o.id and h.status='published'),'[]'::jsonb),'supplier',(select jsonb_build_object('id',s.id,'name',s.name,'website',s.website,'legal_name',s.legal_name,'business_address',s.business_address,'contact_email',s.contact_email,'contact_url',s.contact_url,'booking_conditions_url',s.booking_conditions_url,'atol_holder',case when o.protection='supplier-atol' then s.atol_holder else '' end,'atol_number',case when o.protection='supplier-atol' then s.atol_number else '' end) from public.suppliers s where s.id=o.supplier_id)) order by o.position) from selected o),'[]'::jsonb));
$$;
revoke all on function public.public_holiday_offers(text,uuid,date,text,boolean,text,integer,integer) from public;
grant execute on function public.public_holiday_offers(text,uuid,date,text,boolean,text,integer,integer) to anon,authenticated;
-- Prepared private storage only. No anonymous RPC grant can bypass the disabled application form.
create table if not exists public.offer_enquiries(
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique,
 offer_id uuid not null references public.holiday_offers(id) on delete restrict,
 name text not null check(length(btrim(name)) between 1 and 120),email text not null check(length(email) between 3 and 320),phone text not null default '' check(length(phone)<=50),message text not null default '' check(length(message)<=3000),
 offer_snapshot jsonb not null,notification_id text,notified_at timestamptz,client_hash text not null check(client_hash ~ '^[a-f0-9]{64}$'),created_at timestamptz not null default now()
);
create index if not exists offer_enquiries_rate on public.offer_enquiries(client_hash,created_at);
alter table public.offer_enquiries enable row level security;
revoke all on public.offer_enquiries from public,anon,authenticated;
grant select on public.offer_enquiries to authenticated;
grant select,update on public.offer_enquiries to service_role;
drop policy if exists offer_enquiries_admin on public.offer_enquiries;
create policy offer_enquiries_admin on public.offer_enquiries for select to authenticated using(public.articles_is_admin());
create or replace function public.receive_offer_enquiry(p_request_id uuid,p_offer_id uuid,p_name text,p_email text,p_phone text,p_message text,p_client_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare existing uuid;o public.holiday_offers;snapshot jsonb;enquiry_id uuid;
begin
 perform pg_advisory_xact_lock(hashtext(p_client_hash));
 select id into existing from public.offer_enquiries where request_id=p_request_id;
 if existing is not null then return existing;end if;
 if (select count(*) from public.offer_enquiries where client_hash=p_client_hash and created_at>now()-interval '10 minutes')>=3 then raise exception 'Please wait before sending another enquiry' using errcode='54000';end if;
 select * into o from public.holiday_offers where id=p_offer_id for share;
 if not found or not public.holiday_offer_is_public(o) then raise exception 'This holiday is no longer available to enquire about' using errcode='22023';end if;
 if length(btrim(p_name)) not between 1 and 120 or length(p_email)>320 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Check name and email' using errcode='22023';end if;
 snapshot:=jsonb_build_object('reference',o.reference,'title',o.title,'supplier_id',o.supplier_id,'supplier',(select jsonb_build_object('name',s.name,'legal_name',s.legal_name) from public.suppliers s where s.id=o.supplier_id),'country',o.country,'resort',o.resort,'accommodation',o.accommodation,'travel_type',o.travel_type,'departure_point',o.departure_point,'departure_date',o.departure_date,'return_date',o.return_date,'nights',o.nights,'total_price_minor',o.total_price_minor,'currency',o.currency,'price_checked_on',o.price_checked_on,'adults',o.adults,'children',o.children,'child_ages',o.child_ages,'room_type',o.room_type,'board_basis',o.board_basis,'mandatory_charges',o.mandatory_charges);
 insert into public.offer_enquiries(request_id,offer_id,name,email,phone,message,offer_snapshot,client_hash) values(p_request_id,o.id,btrim(p_name),lower(btrim(p_email)),coalesce(p_phone,''),coalesce(p_message,''),snapshot,p_client_hash) returning id into enquiry_id;
 return enquiry_id;
end;$$;
revoke all on function public.receive_offer_enquiry(uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.receive_offer_enquiry(uuid,uuid,text,text,text,text,text) to service_role;
notify pgrst,'reload schema';
commit;
