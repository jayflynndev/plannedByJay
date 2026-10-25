-- MANUAL ONLY after 20261028_supplier_lookup.sql. No tables/columns/data changed.
-- Remove implementation-only blank-field and agency-artwork requirements; retain
-- existing authentication, launch gate, supplier permission/disclosure evidence,
-- full pricing, party, actual ATOL identity/wording, images, revisions and snapshots.
-- AST1.1/1.2 agent exception: https://www.caa.co.uk/publication/download/21385
-- Optional fields remain available for all applicable source conditions.
-- This changes eligibility checks for already-published offers too: review those
-- before manual application. Nothing is applied or published by creating this file.
begin;
create or replace function public.cms_save_holiday_offer_phase8(p_data jsonb,p_private jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
  if incoming.status='published' then
    if not public.holiday_supplier_permitted(incoming.supplier_id) then raise exception 'Owner launch approval and supplier marketing permission required' using errcode='42501'; end if;
    if not coalesce(incoming.publication_approved,false) or incoming.price_minor is null or incoming.price_people is null or coalesce(cardinality(incoming.holiday_types),0)=0 or incoming.featured_media_id is null or btrim(coalesce(incoming.featured_alt,''))='' or incoming.slug is null or btrim(coalesce(incoming.title,''))='' then raise exception 'Complete and review the offer before publication' using errcode='22023'; end if;
    if exists(select 1 from unnest(array['country','summary','description','departure_date','occupancy','inclusions','unavoidable_charges']) k where btrim(coalesce(incoming.details->>k,''))='') or coalesce(jsonb_typeof(incoming.details->'nights'),'')<>'number' or incoming.details->'nights'='null'::jsonb then raise exception 'Complete the travel and total-price information' using errcode='22023'; end if;
    if coalesce(incoming.details->>'travel_type','') not in ('package','cruise-only','fly-cruise','hotel-only','tour','rail') or (incoming.details->>'travel_type'<>'hotel-only' and btrim(coalesce(incoming.details->>'departure_point',''))='') then raise exception 'Check travel arrangements' using errcode='22023'; end if;
    if (incoming.details->>'nights')::integer not between 0 and 365 or (incoming.details->>'departure_date')::date<(now() at time zone 'UTC')::date or (nullif(incoming.details->>'return_date','')::date < (incoming.details->>'departure_date')::date) or (nullif(incoming.details->>'return_date','') is not null and (incoming.details->>'return_date')::date-(incoming.details->>'departure_date')::date<>(incoming.details->>'nights')::integer) then raise exception 'Check travel dates/duration' using errcode='22023'; end if;
    if nullif(incoming.details->>'price_checked_at','')::timestamptz is null or nullif(incoming.details->>'last_verified_at','')::timestamptz is null or (incoming.details->>'price_checked_at')::timestamptz not between now()-interval '7 days' and now() or (incoming.details->>'last_verified_at')::timestamptz not between now()-interval '7 days' and now() or incoming.expires_at is null or incoming.expires_at<=now() or incoming.expires_at>(incoming.details->>'price_checked_at')::timestamptz+interval '7 days' or (nullif(incoming.details->>'promotion_expires_at','')::timestamptz<=now()) or incoming.expires_at>nullif(incoming.details->>'promotion_expires_at','')::timestamptz then raise exception 'Recheck price/availability and set a future expiry within seven days of checking' using errcode='22023'; end if;
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
create or replace function cms_private.offer_disclosures_ready(o public.holiday_offers) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare d jsonb:=o.details; s jsonb;
begin
 if not cms_private.supplier_disclosures_ready(o.supplier_id) then return false; end if;
 -- The read boundary and direct-write trigger require the complete advertised product,
 -- even when a caller does not use the normal save RPC.
 if o.price_minor is null or o.price_people is null or o.featured_media_id is null
   or not o.publication_approved or btrim(o.title)='' or o.slug is null or btrim(o.featured_alt)=''
   or cardinality(o.holiday_types)=0 then return false; end if;
 if exists(select 1 from unnest(array['country','summary','description','departure_date','occupancy','inclusions','unavoidable_charges']) k where btrim(coalesce(d->>k,''))='') then return false; end if;
 if not coalesce(d->>'travel_type' in ('package','cruise-only','fly-cruise','hotel-only','tour','rail') and jsonb_typeof(d->'nights')='number' and d->>'nights' ~ '^[0-9]{1,3}$',false) then return false; end if;
 if (d->>'nights')::integer>365 or (d->>'travel_type'<>'hotel-only' and btrim(coalesce(d->>'departure_point',''))='') then return false; end if;
 if not coalesce((d->>'departure_date')::date>=(now() at time zone 'UTC')::date
   and nullif(d->>'price_checked_at','')::timestamptz between now()-interval '7 days' and now()
   and nullif(d->>'last_verified_at','')::timestamptz between now()-interval '7 days' and now()
   and o.expires_at>now() and o.expires_at<=(d->>'price_checked_at')::timestamptz+interval '7 days',false) then return false; end if;
 if nullif(d->>'return_date','')::date<(d->>'departure_date')::date or nullif(d->>'promotion_expires_at','')::timestamptz<=now() or o.expires_at>nullif(d->>'promotion_expires_at','')::timestamptz then return false; end if;
 if nullif(d->>'return_date','') is not null and (d->>'return_date')::date-(d->>'departure_date')::date<>(d->>'nights')::integer then return false; end if;

 if not coalesce(d->>'flight_inclusive' in ('yes','no') and d->>'atol_status' in ('applicable','not-applicable')
   and btrim(d->>'classification_reason')<>'' and d->>'full_price_confirmed'='confirmed'
   and d->>'adults' ~ '^[1-9][0-9]?$' and d->>'children' ~ '^([0-9]|[1-9][0-9])$',false) then return false; end if;
 if (d->>'adults')::integer+(d->>'children')::integer is distinct from o.price_people then return false; end if;
 if d->>'travel_type'='fly-cruise' and d->>'flight_inclusive'<>'yes' then return false; end if;
 if d->>'travel_type' in ('cruise-only','hotel-only','rail') and d->>'flight_inclusive'<>'no' then return false; end if;
 if (d->>'flight_inclusive'='yes') is distinct from (d->>'atol_status'='applicable') then return false; end if;
 if d->>'atol_status'='applicable' then
   select disclosures into s from public.holiday_offer_suppliers where id=o.supplier_id;
   if exists(select 1 from unnest(array['atol_holder','atol_number','protection_information']) k where btrim(coalesce(s->>k,''))='') then return false; end if;
 end if;
 return true;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then return false;
end; $$;
revoke all on function public.cms_save_holiday_offer_phase8(jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function cms_private.offer_disclosures_ready(public.holiday_offers) from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
