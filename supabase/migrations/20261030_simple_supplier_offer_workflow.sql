-- MANUAL ONLY: consolidated simple supplier/offer workflow, after 20261028.
-- Works whether 20261029 was applied or not. Do not rerun old migrations.
-- No supplier/offer/enquiry record is deleted; no reference, snapshot or status is rewritten.
-- Old private research and permission evidence remain stored. No launch gate is enabled.
begin;
select pg_advisory_xact_lock(734021901);
-- Preserve invisibility: new eligibility rules must not automatically republish
-- an existing offer that the old rules currently hide (including a closed gate).
create temporary table pbj_hidden_offers on commit drop as
 select id from public.holiday_offers where status='published' and not coalesce(public.holiday_offer_current(id),false);
alter table cms_private.offer_supplier_information
 add column archived boolean not null default false,
 add column atol_verified boolean not null default false;
alter table cms_private.offer_information add column republish_required boolean not null default false;
update cms_private.offer_information set republish_required=true where offer_id in(select id from pbj_hidden_offers);
-- Imported name/research drafts are not intentionally archived. Retain other
-- recorded inactive suppliers as archived; known declined restrictions also survive.
update cms_private.offer_supplier_information set archived=true
 where not active and not (permission='pending' and network_confirmed and permission_basis='new-travel-network'
 and (notes like 'Preferred workbook %' or notes like 'Name from New Travel preferred supplier list:%'));
-- Preserve existing ATOL numbers and evidence, but do not infer an actual ATOL
-- check from an older general disclosure-review date. The new explicit flag
-- starts false; only suppliers used for flight-inclusive advertising need it.
alter table public.holiday_offer_suppliers drop constraint supplier_public_disclosures;
alter table public.holiday_offer_suppliers add constraint supplier_public_disclosures check (
 jsonb_typeof(disclosures)='object' and length(disclosures::text)<=8000
 and disclosures-array['legal_name','business_address','service_address','public_contact','official_website','atol_holder','atol_number','protection_information','atol_artwork','booking_conditions_url']='{}'::jsonb
 and jsonb_path_query_array(disclosures,'$.*.type()') <@ '["string"]'::jsonb
 and coalesce(disclosures->>'official_website','') ~ '^(https://[^[:space:]]+)?$'
 and coalesce(disclosures->>'booking_conditions_url','') ~ '^(https://[^[:space:]]+)?$'
 and coalesce(disclosures->>'atol_number','') ~ '^(T?[0-9]{4,5})?$'
 and coalesce(disclosures->>'atol_artwork','') ~ '^(/images/[a-zA-Z0-9/_.-]+)?$');
create or replace function cms_private.supplier_disclosures_ready(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.holiday_offer_suppliers s where s.id=p_id
 and btrim(coalesce(s.disclosures->>'legal_name',''))<>'' and btrim(coalesce(s.disclosures->>'business_address',''))<>''
 and btrim(coalesce(s.disclosures->>'public_contact',''))<>'');
$$;
create or replace function public.holiday_supplier_permitted(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from cms_private.offer_launch l,cms_private.offer_supplier_information i
 where l.enabled and i.supplier_id=p_id and not i.archived and i.permission<>'declined' and cms_private.supplier_disclosures_ready(p_id));
$$;
create or replace function public.cms_offer_suppliers() returns setof jsonb
language plpgsql security definer set search_path='' as $$begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return query select jsonb_build_object('id',s.id,'revision',i.revision,'name',i.name,'display_name',s.display_name,
 'website',coalesce(nullif(s.disclosures->>'official_website',''),i.website,''),'specialism',s.specialism,'disclosures',s.disclosures,
 'archived',i.archived,'restricted',i.permission='declined','atol_verified',i.atol_verified,'notes',i.notes,'private_reference',left(concat_ws(E'\n',nullif(i.usage_notes,''),nullif(i.contact,''),nullif(i.account_reference,''),nullif(i.agent_url,''),nullif(i.disclosure_evidence,'')),15000))
 from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id order by s.display_name limit 1000;
end; $$;
create or replace function public.cms_save_offer_supplier(p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid; old cms_private.offer_supplier_information; result jsonb; clean text; pubname text;
begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(734021901);
 clean:=btrim(regexp_replace(coalesce(p_data->>'name',''),'\s+',' ','g'));pubname:=coalesce(nullif(btrim(p_data->>'display_name'),''),clean);
 if length(p_data::text)>60000 or length(clean) not between 1 and 80 or length(pubname) not between 1 and 80 then raise exception 'Check supplier name' using errcode='22023'; end if;
 sid:=nullif(p_data->>'id','')::uuid;
 if sid is null then
   insert into public.holiday_offer_suppliers(display_name) values(pubname) returning id into sid;
   insert into cms_private.offer_supplier_information(supplier_id,name) values(sid,clean);
 else
   select * into old from cms_private.offer_supplier_information where supplier_id=sid for update;
   if not found or old.revision<>(p_data->>'revision')::integer then raise exception 'Supplier changed elsewhere; reload after copying your work' using errcode='40001'; end if;
 end if;
 if coalesce((p_data->>'atol_verified')::boolean,false) and
   (btrim(coalesce(p_data#>>'{disclosures,atol_holder}',''))='' or btrim(coalesce(p_data#>>'{disclosures,atol_number}',''))='') then raise exception 'Enter checked ATOL holder and number' using errcode='22023'; end if;
 update public.holiday_offer_suppliers set display_name=pubname,specialism=coalesce(p_data->>'specialism',specialism),
   disclosures=disclosures||coalesce(p_data->'disclosures','{}') where id=sid;
 -- Deliberately do not overwrite legacy account, source/lookup, permission-date,
 -- evidence, duplicated service address, artwork or verification-date columns.
 update cms_private.offer_supplier_information set name=clean,website=coalesce(p_data->>'website',website),notes=coalesce(p_data->>'notes',notes),
   archived=coalesce((p_data->>'archived')::boolean,archived),atol_verified=coalesce((p_data->>'atol_verified')::boolean,atol_verified),
   permission=case when coalesce((p_data->>'restricted')::boolean,false) then 'declined' when permission='declined' then 'pending' else permission end,
   revision=revision+1 where supplier_id=sid;
 update public.holiday_offers set updated_at=clock_timestamp(),revision=revision+1 where supplier_id=sid;
 select x into result from public.cms_offer_suppliers() x where x->>'id'=sid::text;
 return result;
end; $$;
create or replace function cms_private.offer_disclosures_ready(o public.holiday_offers) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare d jsonb:=o.details; s jsonb;
begin
 if not cms_private.supplier_disclosures_ready(o.supplier_id) then return false; end if;
 if o.price_minor is null or o.price_people is null or o.featured_media_id is null or btrim(o.title)='' or o.slug is null
 or btrim(o.featured_alt)='' or cardinality(o.holiday_types)=0 then return false; end if;
 if exists(select 1 from unnest(array['country','description','departure_date','occupancy','inclusions']) k where btrim(coalesce(d->>k,''))='') then return false; end if;
 if not coalesce(d->>'travel_type' in ('package','cruise-only','fly-cruise','hotel-only','tour','rail')
 and jsonb_typeof(d->'nights')='number' and d->>'nights' ~ '^[0-9]{1,3}$',false) then return false; end if;
 if (d->>'nights')::integer>365 or (d->>'travel_type'<>'hotel-only' and btrim(coalesce(d->>'departure_point',''))='') then return false; end if;
 if not coalesce((d->>'departure_date')::date>=(now() at time zone 'Europe/London')::date
 and nullif(d->>'price_checked_at','')::timestamptz is not null
 and (d->>'price_checked_at')::timestamptz::date <= (now() at time zone 'Europe/London')::date,false) then return false; end if;
 if nullif(d->>'promotion_expires_at','')::timestamptz<=now() then return false; end if;
 if nullif(d->>'return_date','') is not null and (d->>'return_date')::date-(d->>'departure_date')::date<>(d->>'nights')::integer then return false; end if;
 if not coalesce(d->>'flight_inclusive' in ('yes','no') and d->>'adults' ~ '^[1-9][0-9]?$' and d->>'children' ~ '^([0-9]|[1-9][0-9])$',false) then return false; end if;
 if (d->>'adults')::integer+(d->>'children')::integer is distinct from o.price_people then return false; end if;
 if d->>'travel_type'='fly-cruise' and d->>'flight_inclusive'<>'yes' then return false; end if;
 if d->>'travel_type' in ('cruise-only','hotel-only','rail') and d->>'flight_inclusive'<>'no' then return false; end if;
 if (d->>'flight_inclusive'='yes') is distinct from (d->>'atol_status'='applicable') then return false; end if;
 if d->>'flight_inclusive'='yes' then
   if not exists(select 1 from cms_private.offer_supplier_information i where i.supplier_id=o.supplier_id and i.atol_verified) then return false; end if;
   select disclosures into s from public.holiday_offer_suppliers where id=o.supplier_id;
   if exists(select 1 from unnest(array['atol_holder','atol_number','protection_information']) k where btrim(coalesce(s->>k,''))='') then return false; end if;
 end if;
 return true;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then return false;
end; $$;
create or replace function public.holiday_offer_current(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.holiday_offers o where o.id=p_id and o.status='published'
 and public.holiday_supplier_permitted(o.supplier_id) and cms_private.offer_disclosures_ready(o)
 and not exists(select 1 from cms_private.offer_information i where i.offer_id=o.id and i.republish_required));
$$;
create or replace function cms_private.enforce_offer_disclosures() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if new.status='published' and (not public.holiday_supplier_permitted(new.supplier_id) or not cms_private.offer_disclosures_ready(new)) then
 raise exception 'Complete price, travel, public supplier information and applicable checked ATOL details' using errcode='22023'; end if;return new;
end; $$;
alter function public.cms_save_holiday_offer_phase8(jsonb,jsonb) rename to cms_save_holiday_offer_record;
create or replace function public.cms_save_holiday_offer_record(p_data jsonb,p_private jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare incoming public.holiday_offers; old public.holiday_offers; saved public.holiday_offers; ids uuid[]; tags uuid[]; x jsonb;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if length(p_data::text)>65000 or length(p_private::text)>35000 then raise exception 'Offer too long' using errcode='22023'; end if;
  incoming:=jsonb_populate_record(null::public.holiday_offers,p_data||jsonb_build_object('slug',nullif(p_data->>'slug',''),'expires_at',nullif(p_data->>'expires_at','')));
  if exists(select 1 from jsonb_each(coalesce(incoming.details,'{}')) e where (e.key<>'nights' and jsonb_typeof(e.value)<>'string') or (e.key='nights' and jsonb_typeof(e.value) not in ('number','null'))) then raise exception 'Invalid offer field types' using errcode='22023'; end if;
  perform nullif(incoming.details->>'departure_date','')::date,nullif(incoming.details->>'return_date','')::date,nullif(incoming.details->>'price_checked_at','')::timestamptz,nullif(incoming.details->>'last_verified_at','')::timestamptz,nullif(incoming.details->>'promotion_expires_at','')::timestamptz;
  if incoming.details->'nights' is not null and incoming.details->'nights'<>'null'::jsonb and (incoming.details->>'nights')::numeric not between 0 and 365 then raise exception 'Invalid duration' using errcode='22023'; end if;
  if incoming.id is not null then
    select * into old from public.holiday_offers where id=incoming.id for update;
    if not found or old.revision<>incoming.revision then raise exception 'Offer changed elsewhere; copy your work then reload' using errcode='40001'; end if;
  end if;
  incoming.details:=jsonb_set(coalesce(incoming.details,'{}'),'{atol_status}',to_jsonb(case incoming.details->>'flight_inclusive' when 'yes' then 'applicable' when 'no' then 'not-applicable' else 'pending' end));
  if incoming.status='published' then
    if not public.holiday_supplier_permitted(incoming.supplier_id) then raise exception 'Publication unavailable: launch gate, archived/restricted supplier or missing public supplier details' using errcode='42501'; end if;
    if incoming.price_minor is null or incoming.price_people is null or coalesce(cardinality(incoming.holiday_types),0)=0 or incoming.featured_media_id is null or btrim(coalesce(incoming.featured_alt,''))='' or incoming.slug is null or btrim(coalesce(incoming.title,''))='' then raise exception 'Complete and review the offer before publication' using errcode='22023'; end if;
    if exists(select 1 from unnest(array['country','description','departure_date','occupancy','inclusions']) k where btrim(coalesce(incoming.details->>k,''))='') or coalesce(jsonb_typeof(incoming.details->'nights'),'')<>'number' or incoming.details->'nights'='null'::jsonb then raise exception 'Complete the travel and total-price information' using errcode='22023'; end if;
    if coalesce(incoming.details->>'travel_type','') not in ('package','cruise-only','fly-cruise','hotel-only','tour','rail') or (incoming.details->>'travel_type'<>'hotel-only' and btrim(coalesce(incoming.details->>'departure_point',''))='') then raise exception 'Check travel arrangements' using errcode='22023'; end if;
    if (incoming.details->>'nights')::integer not between 0 and 365 or (incoming.details->>'departure_date')::date<(now() at time zone 'UTC')::date or (nullif(incoming.details->>'return_date','')::date < (incoming.details->>'departure_date')::date) or (nullif(incoming.details->>'return_date','') is not null and (incoming.details->>'return_date')::date-(incoming.details->>'departure_date')::date<>(incoming.details->>'nights')::integer) then raise exception 'Check travel dates/duration' using errcode='22023'; end if;
    if not cms_private.offer_disclosures_ready(incoming) then raise exception 'Complete price, travel, public supplier information and applicable checked ATOL details' using errcode='22023'; end if;
  end if;
  for x in select value from jsonb_array_elements(coalesce(incoming.gallery,'[]')) loop
    if x-array['media_id','alt']<>'{}'::jsonb or btrim(coalesce(x->>'alt',''))='' or length(x->>'alt')>300 then raise exception 'Describe every gallery image' using errcode='22023'; end if;
  end loop;
  ids:=array(select distinct (value->>'media_id')::uuid from jsonb_array_elements(coalesce(incoming.gallery,'[]')) union select incoming.featured_media_id where incoming.featured_media_id is not null);
  perform 1 from public.content_media where id=any(ids) for key share;
  if (select count(*) from public.content_media where id=any(ids))<>cardinality(ids) then raise exception 'Image unavailable' using errcode='23503'; end if;
  tags:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_data->'tag_ids','[]')));
  if cardinality(tags)>8 or cardinality(tags)<>(select count(distinct t) from unnest(tags) t) then raise exception 'Choose up to eight distinct tags' using errcode='22023'; end if;
  insert into public.holiday_offers(id,title,slug,supplier_id,status,holiday_types,details,price_minor,currency,price_basis,price_people,featured_media_id,featured_alt,gallery,featured,publication_approved,expires_at,revision)
    values(coalesce(incoming.id,gen_random_uuid()),coalesce(incoming.title,''),incoming.slug,incoming.supplier_id,coalesce(incoming.status,'draft'),coalesce(incoming.holiday_types,'{}'),coalesce(incoming.details,'{}'),incoming.price_minor,coalesce(incoming.currency,'GBP'),coalesce(incoming.price_basis,'per-person'),incoming.price_people,incoming.featured_media_id,coalesce(incoming.featured_alt,''),coalesce(incoming.gallery,'[]'),coalesce(incoming.featured,false),coalesce(incoming.publication_approved,false),incoming.expires_at,coalesce(old.revision,0)+1)
    on conflict(id) do update set title=excluded.title,slug=excluded.slug,supplier_id=excluded.supplier_id,status=excluded.status,holiday_types=excluded.holiday_types,details=excluded.details,price_minor=excluded.price_minor,currency=excluded.currency,price_basis=excluded.price_basis,price_people=excluded.price_people,featured_media_id=excluded.featured_media_id,featured_alt=excluded.featured_alt,gallery=excluded.gallery,featured=excluded.featured,publication_approved=excluded.publication_approved,expires_at=excluded.expires_at,revision=excluded.revision,updated_at=now() returning * into saved;
  if saved.slug is not null then
    if exists(select 1 from cms_private.offer_slugs where slug=saved.slug and offer_id<>saved.id) then raise exception 'Offer URL already reserved' using errcode='23505'; end if;
    insert into cms_private.offer_slugs values(saved.slug,saved.id) on conflict do nothing;
  end if;
  insert into cms_private.offer_information values(saved.id,coalesce(p_private,'{}')) on conflict(offer_id) do update set data=excluded.data;
  delete from public.holiday_offer_media where offer_id=saved.id;
  insert into public.holiday_offer_media select saved.id,u from unnest(ids) u;
  delete from public.holiday_offer_tags where offer_id=saved.id;
  insert into public.holiday_offer_tags select saved.id,t from unnest(tags) t;
  return to_jsonb(saved)||jsonb_build_object('tag_ids',to_jsonb(tags),'private',p_private);
end; $$;
create or replace function public.cms_save_holiday_offer(p_data jsonb,p_private jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(734021901);
 if p_data->>'status'='published' and nullif(p_data->>'id','') is not null then
   perform 1 from public.holiday_offers where id=(p_data->>'id')::uuid and revision=(p_data->>'revision')::integer for update;
   if not found then raise exception 'Offer changed elsewhere; reload after copying work' using errcode='40001'; end if;
   update cms_private.offer_information set republish_required=false where offer_id=(p_data->>'id')::uuid;
 end if;
 return public.cms_save_holiday_offer_record(p_data,p_private);
end; $$;
create or replace function public.cms_holiday_offer_counts() returns jsonb
language plpgsql security definer set search_path='' as $$begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return (select jsonb_build_object('draft',count(*) filter(where status='draft'),'published',count(*) filter(where public.holiday_offer_current(id)),
 'archived',count(*) filter(where status='archived'),'review',count(*) filter(where status in ('draft','published') and coalesce(details->>'price_checked_at','')<(now() at time zone 'Europe/London')::date::text)) from public.holiday_offers);
end; $$;
-- Retire unreachable wrapper/old eligibility code. Historical migrations/data stay.
drop function public.holiday_offer_current_phase8(uuid);
drop function public.cms_save_offer_supplier_disclosures(jsonb);
drop function public.cms_save_offer_supplier_phase8(jsonb);
revoke all on function public.cms_save_holiday_offer_record(jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function cms_private.supplier_disclosures_ready(uuid),cms_private.offer_disclosures_ready(public.holiday_offers),cms_private.enforce_offer_disclosures() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
