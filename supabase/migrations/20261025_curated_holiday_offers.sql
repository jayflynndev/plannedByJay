-- MANUAL ONLY after editorial CMS/storage, discovery and inline classification.
-- No existing article/enquiry rows, approvals or provider settings are changed.
begin;
create table cms_private.offer_launch (
  singleton boolean primary key default true check(singleton), enabled boolean not null default false,
  approved_by text, approved_at timestamptz,
  check(not enabled or (coalesce(length(btrim(approved_by)),0)>0 and approved_at is not null))
);
insert into cms_private.offer_launch(singleton) values(true);
revoke all on cms_private.offer_launch from public,anon,authenticated,service_role;
create table public.holiday_offer_suppliers (
  id uuid primary key default gen_random_uuid(),display_name text not null check(length(display_name) between 1 and 80),
  logo_id uuid references public.content_media(id) on delete restrict,logo_alt text not null default '',specialism text not null default ''
);
create table cms_private.offer_supplier_information (
  supplier_id uuid primary key references public.holiday_offer_suppliers(id) on delete restrict,
  name text not null check(length(name) between 1 and 80),
  normalised_name text generated always as(lower(btrim(regexp_replace(name,'\s+',' ','g')))) stored unique,
  website text not null default '',agent_url text not null default '',contact text not null default '',notes text not null default '',
  active boolean not null default true,permission text not null default 'pending' check(permission in ('pending','approved','declined')),
  permission_date date,usage_notes text not null default '',revision integer not null default 1,
  check(permission<>'approved' or (permission_date is not null and length(btrim(usage_notes))>0))
);
create table public.holiday_offers (
  id uuid primary key default gen_random_uuid(),reference text not null unique default ('PBJO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  title text not null default '' check(length(title)<=180),slug text unique check(slug is null or (length(slug)<=140 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')),
  supplier_id uuid references public.holiday_offer_suppliers(id) on delete restrict,
  status text not null default 'draft' check(status in ('draft','published','paused','expired','archived')),
  holiday_types text[] not null default '{}' check(holiday_types <@ array['family','cruises','couples','city-breaks','something-different','accessible']::text[] and cardinality(holiday_types)<=6),
  details jsonb not null default '{}' check(jsonb_typeof(details)='object' and length(details::text)<=35000 and details-array['country','region','accommodation','summary','description','departure_point','departure_date','return_date','nights','travel_type','board_basis','room_type','occupancy','inclusions','exclusions','accessibility','unavoidable_charges','optional_extras','price_checked_at','last_verified_at','promotion_expires_at']='{}'::jsonb),
  price_minor bigint check(price_minor between 1 and 100000000),currency text not null default 'GBP' check(currency in ('GBP','EUR','USD')),
  price_basis text not null default 'per-person' check(price_basis in ('per-person','total-party')),price_people integer check(price_people between 1 and 99),
  featured_media_id uuid references public.content_media(id) on delete restrict,featured_alt text not null default '' check(length(featured_alt)<=300),
  gallery jsonb not null default '[]' check(jsonb_typeof(gallery)='array' and jsonb_array_length(gallery)<=8),
  featured boolean not null default false,publication_approved boolean not null default false,expires_at timestamptz,
  revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table cms_private.offer_information (
  offer_id uuid primary key references public.holiday_offers(id) on delete restrict,
  data jsonb not null default '{}' check(jsonb_typeof(data)='object' and length(data::text)<=35000)
);
create table public.holiday_offer_media (
  offer_id uuid not null references public.holiday_offers(id) on delete cascade,
  media_id uuid not null references public.content_media(id) on delete restrict,primary key(offer_id,media_id)
);
create table public.holiday_offer_tags (
  offer_id uuid not null references public.holiday_offers(id) on delete cascade,
  tag_id uuid not null references public.content_tags(id) on delete restrict,primary key(offer_id,tag_id)
);
create table cms_private.offer_slugs(slug text primary key,offer_id uuid not null references public.holiday_offers(id) on delete restrict);
alter table cms_private.offer_launch enable row level security;
alter table cms_private.offer_supplier_information enable row level security;
alter table cms_private.offer_information enable row level security;
alter table cms_private.offer_slugs enable row level security;
alter table public.holiday_offer_suppliers enable row level security;
alter table public.holiday_offers enable row level security;
alter table public.holiday_offer_media enable row level security;
alter table public.holiday_offer_tags enable row level security;
revoke all on public.holiday_offer_suppliers,public.holiday_offers,public.holiday_offer_media,public.holiday_offer_tags from public,anon,authenticated;
revoke all on cms_private.offer_supplier_information,cms_private.offer_information,cms_private.offer_slugs from public,anon,authenticated;
grant select on public.holiday_offer_suppliers,public.holiday_offers,public.holiday_offer_media,public.holiday_offer_tags to anon,authenticated;

create function public.holiday_supplier_permitted(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from cms_private.offer_launch l,cms_private.offer_supplier_information s where l.enabled and s.supplier_id=p_id and s.active and s.permission='approved' and s.permission_date<=current_date and s.usage_notes<>'');
$$;
create function public.holiday_offers_enabled() returns boolean language sql stable security definer set search_path='' as $$select coalesce((select enabled from cms_private.offer_launch where singleton),false);$$;
create function public.holiday_offer_current(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.holiday_offers o where o.id=p_id and o.status='published' and o.publication_approved
    and public.holiday_supplier_permitted(o.supplier_id) and o.expires_at>now()
    and nullif(o.details->>'departure_date','')::date>=(now() at time zone 'UTC')::date
    and nullif(o.details->>'price_checked_at','')::timestamptz between now()-interval '7 days' and now()
    and nullif(o.details->>'last_verified_at','')::timestamptz between now()-interval '7 days' and now()
    and (coalesce(o.details->>'promotion_expires_at','')='' or (o.details->>'promotion_expires_at')::timestamptz>now()));
$$;
create policy holiday_offers_read on public.holiday_offers for select using(public.cms_is_admin() or public.holiday_offer_current(id));
create policy holiday_suppliers_read on public.holiday_offer_suppliers for select using(public.cms_is_admin() or public.holiday_supplier_permitted(id));
create policy holiday_media_links_read on public.holiday_offer_media for select using(public.cms_is_admin() or public.holiday_offer_current(offer_id));
create policy holiday_tags_read on public.holiday_offer_tags for select using(public.cms_is_admin() or public.holiday_offer_current(offer_id));
create policy holiday_media_read on public.content_media for select using(exists(select 1 from public.holiday_offer_media u where u.media_id=content_media.id and public.holiday_offer_current(u.offer_id)) or exists(select 1 from public.holiday_offer_suppliers s where s.logo_id=content_media.id and public.holiday_supplier_permitted(s.id)));

create function public.cms_offer_suppliers() returns setof jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  return query select to_jsonb(s)|| (to_jsonb(i)-'supplier_id'-'normalised_name') from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id order by s.display_name limit 1000;
end; $$;
create function public.cms_save_offer_supplier(p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid; expected integer; result jsonb;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if length(p_data::text)>20000 or length(btrim(coalesce(p_data->>'name',''))) not between 1 and 80 or length(btrim(coalesce(p_data->>'display_name',''))) not between 1 and 80 then raise exception 'Check supplier details' using errcode='22023'; end if;
  if p_data->>'permission'='approved' and (nullif(p_data->>'permission_date','')::date>current_date or nullif(p_data->>'permission_date','') is null or btrim(coalesce(p_data->>'usage_notes',''))='') then raise exception 'Record confirmed permission and usage' using errcode='22023'; end if;
  if nullif(p_data->>'logo_id','') is not null and btrim(coalesce(p_data->>'logo_alt',''))='' then raise exception 'Describe the approved logo' using errcode='22023'; end if;
  sid:=nullif(p_data->>'id','')::uuid;
  if sid is null then
    insert into public.holiday_offer_suppliers(display_name) values(p_data->>'display_name') returning id into sid;
    insert into cms_private.offer_supplier_information(supplier_id,name) values(sid,btrim(regexp_replace(p_data->>'name','\s+',' ','g')));
  else
    select revision into expected from cms_private.offer_supplier_information where supplier_id=sid for update;
    if expected is null or expected<>(p_data->>'revision')::integer then raise exception 'Supplier changed elsewhere; reload after copying your work' using errcode='40001'; end if;
  end if;
  update public.holiday_offer_suppliers set display_name=p_data->>'display_name',logo_id=nullif(p_data->>'logo_id','')::uuid,logo_alt=coalesce(p_data->>'logo_alt',''),specialism=coalesce(p_data->>'specialism','') where id=sid;
  update cms_private.offer_supplier_information set name=btrim(regexp_replace(p_data->>'name','\s+',' ','g')),website=coalesce(p_data->>'website',''),agent_url=coalesce(p_data->>'agent_url',''),contact=coalesce(p_data->>'contact',''),notes=coalesce(p_data->>'notes',''),active=coalesce((p_data->>'active')::boolean,true),permission=coalesce(p_data->>'permission','pending'),permission_date=nullif(p_data->>'permission_date','')::date,usage_notes=coalesce(p_data->>'usage_notes',''),revision=revision+1 where supplier_id=sid;
  select to_jsonb(s)||(to_jsonb(i)-'supplier_id'-'normalised_name') into result from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id where s.id=sid;
  return result;
end; $$;

create function public.cms_save_holiday_offer(p_data jsonb,p_private jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
    if exists(select 1 from unnest(array['country','summary','description','departure_date','board_basis','occupancy','inclusions','exclusions','unavoidable_charges']) k where btrim(coalesce(incoming.details->>k,''))='') or coalesce(jsonb_typeof(incoming.details->'nights'),'')<>'number' or incoming.details->'nights'='null'::jsonb then raise exception 'Complete the travel and total-price information' using errcode='22023'; end if;
    if coalesce(incoming.details->>'travel_type','') not in ('package','cruise-only','fly-cruise','hotel-only','tour','rail') or (incoming.details->>'travel_type'<>'hotel-only' and btrim(coalesce(incoming.details->>'departure_point',''))='') then raise exception 'Check travel arrangements' using errcode='22023'; end if;
    if (incoming.details->>'nights')::integer not between 0 and 365 or (incoming.details->>'departure_date')::date<(now() at time zone 'UTC')::date or (nullif(incoming.details->>'return_date','')::date < (incoming.details->>'departure_date')::date) then raise exception 'Check travel dates/duration' using errcode='22023'; end if;
    if nullif(incoming.details->>'price_checked_at','')::timestamptz is null or nullif(incoming.details->>'last_verified_at','')::timestamptz is null or (incoming.details->>'price_checked_at')::timestamptz not between now()-interval '7 days' and now() or (incoming.details->>'last_verified_at')::timestamptz not between now()-interval '7 days' and now() or incoming.expires_at is null or incoming.expires_at<=now() or incoming.expires_at>(incoming.details->>'price_checked_at')::timestamptz+interval '7 days' or (nullif(incoming.details->>'promotion_expires_at','')::timestamptz<=now()) then raise exception 'Recheck price/availability and set a future expiry within seven days of checking' using errcode='22023'; end if;
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
create function public.cms_get_holiday_offer(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  select to_jsonb(o)||jsonb_build_object('private',i.data,'tag_ids',coalesce((select jsonb_agg(tag_id) from public.holiday_offer_tags where offer_id=o.id),'[]'::jsonb)) into result from public.holiday_offers o join cms_private.offer_information i on i.offer_id=o.id where o.id=p_id;
  return result;
end; $$;
create function public.cms_holiday_offer_counts() returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  return (select jsonb_build_object('draft',count(*) filter(where status='draft'),'published',count(*) filter(where public.holiday_offer_current(id)),'expiring',count(*) filter(where public.holiday_offer_current(id) and expires_at<=now()+interval '3 days'),'expired',count(*) filter(where status='expired' or (status='published' and (expires_at<=now() or nullif(details->>'promotion_expires_at','')::timestamptz<=now() or nullif(details->>'departure_date','')::date<current_date))),'verification',count(*) filter(where status not in ('archived','expired') and (coalesce(details->>'last_verified_at','')='' or nullif(details->>'last_verified_at','')::timestamptz<now()-interval '7 days'))) from public.holiday_offers);
end; $$;
create index holiday_offers_listing on public.holiday_offers(status,expires_at,featured,updated_at desc);
create index holiday_offers_types on public.holiday_offers using gin(holiday_types);
create index holiday_offers_supplier on public.holiday_offers(supplier_id);
revoke all on function public.holiday_offers_enabled(),public.holiday_supplier_permitted(uuid),public.holiday_offer_current(uuid),public.cms_offer_suppliers(),public.cms_save_offer_supplier(jsonb),public.cms_save_holiday_offer(jsonb,jsonb),public.cms_get_holiday_offer(uuid),public.cms_holiday_offer_counts() from public,anon,authenticated;
grant execute on function public.holiday_offers_enabled() to anon,authenticated,service_role;
grant execute on function public.holiday_supplier_permitted(uuid),public.holiday_offer_current(uuid) to anon,authenticated,service_role;
grant execute on function public.cms_offer_suppliers(),public.cms_save_offer_supplier(jsonb),public.cms_save_holiday_offer(jsonb,jsonb),public.cms_get_holiday_offer(uuid),public.cms_holiday_offer_counts() to authenticated;
notify pgrst,'reload schema';
commit;
