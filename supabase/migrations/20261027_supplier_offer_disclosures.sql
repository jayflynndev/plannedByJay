-- MANUAL ONLY after 20261025 and 20261026 (already applied).
-- Additive: no existing supplier, offer, reference, enquiry or notification is rewritten.
-- Existing incomplete published offers are hidden until reviewed; launch state is unchanged.
begin;
alter table public.holiday_offer_suppliers add column disclosures jsonb not null default '{}';
alter table public.holiday_offer_suppliers add constraint supplier_public_disclosures check (
  jsonb_typeof(disclosures)='object' and length(disclosures::text)<=8000
  and disclosures-array['legal_name','business_address','service_address','public_contact','official_website','atol_holder','atol_number','protection_information','atol_artwork']='{}'::jsonb
  and jsonb_path_query_array(disclosures,'$.*.type()') <@ '["string"]'::jsonb
  and coalesce(disclosures->>'official_website','') ~ '^(https://[^[:space:]]+)?$'
  and coalesce(disclosures->>'atol_number','') ~ '^(T?[0-9]{4,5})?$'
  and coalesce(disclosures->>'atol_artwork','') ~ '^(/images/[a-zA-Z0-9/_.-]+)?$');
alter table cms_private.offer_supplier_information
  add column network_confirmed boolean not null default false,
  add column permission_basis text not null default 'pending' check(permission_basis in ('pending','new-travel-network')),
  add column disclosures_verified_at date,
  add column disclosure_evidence text not null default '' check(length(disclosure_evidence)<=5000),
  add column account_reference text not null default '' check(length(account_reference)<=200);
alter table public.holiday_offers drop constraint holiday_offers_details_check;
alter table public.holiday_offers add constraint holiday_offers_details_check check(jsonb_typeof(details)='object' and length(details::text)<=35000 and details-array['flight_inclusive','atol_status','classification_reason','nonflight_protection','adults','children','full_price_confirmed','uncalculable_charges','promotion_conditions','booking_conditions','country','region','accommodation','summary','description','departure_point','departure_date','return_date','nights','travel_type','board_basis','room_type','occupancy','inclusions','exclusions','accessibility','unavoidable_charges','optional_extras','price_checked_at','last_verified_at','promotion_expires_at']='{}'::jsonb);

create function cms_private.supplier_disclosures_ready(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id
 where s.id=p_id and i.network_confirmed and i.permission_basis='new-travel-network'
 and i.disclosures_verified_at<=current_date and btrim(i.disclosure_evidence)<>''
 and btrim(coalesce(s.disclosures->>'legal_name',''))<>'' and btrim(coalesce(s.disclosures->>'business_address',''))<>''
 and btrim(coalesce(s.disclosures->>'public_contact',''))<>'');
$$;
create or replace function public.holiday_supplier_permitted(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from cms_private.offer_launch l,cms_private.offer_supplier_information s
 where l.enabled and s.supplier_id=p_id and s.active and s.permission='approved' and s.permission_date<=current_date
 and btrim(s.usage_notes)<>'' and cms_private.supplier_disclosures_ready(p_id));
$$;
create function cms_private.offer_disclosures_ready(o public.holiday_offers) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare d jsonb:=o.details; s jsonb;
begin
 if not cms_private.supplier_disclosures_ready(o.supplier_id) then return false; end if;
 -- The read boundary and direct-write trigger require the complete advertised product,
 -- even when a caller does not use the normal save RPC.
 if o.price_minor is null or o.price_people is null or o.featured_media_id is null
   or not o.publication_approved or btrim(o.title)='' or o.slug is null or btrim(o.featured_alt)=''
   or cardinality(o.holiday_types)=0 then return false; end if;
 if exists(select 1 from unnest(array['country','summary','description','departure_date','board_basis','occupancy','inclusions','exclusions','unavoidable_charges']) k where btrim(coalesce(d->>k,''))='') then return false; end if;
 if not coalesce(d->>'travel_type' in ('package','cruise-only','fly-cruise','hotel-only','tour','rail') and jsonb_typeof(d->'nights')='number' and d->>'nights' ~ '^[0-9]{1,3}$',false) then return false; end if;
 if (d->>'nights')::integer>365 or (d->>'travel_type'<>'hotel-only' and btrim(coalesce(d->>'departure_point',''))='') then return false; end if;
 if not coalesce((d->>'departure_date')::date>=(now() at time zone 'UTC')::date
   and nullif(d->>'price_checked_at','')::timestamptz between now()-interval '7 days' and now()
   and nullif(d->>'last_verified_at','')::timestamptz between now()-interval '7 days' and now()
   and o.expires_at>now() and o.expires_at<=(d->>'price_checked_at')::timestamptz+interval '7 days',false) then return false; end if;
 if nullif(d->>'return_date','')::date<(d->>'departure_date')::date or nullif(d->>'promotion_expires_at','')::timestamptz<=now() then return false; end if;

 if not coalesce(d->>'flight_inclusive' in ('yes','no') and d->>'atol_status' in ('applicable','not-applicable')
   and btrim(d->>'classification_reason')<>'' and d->>'full_price_confirmed'='confirmed'
   and d->>'adults' ~ '^[1-9][0-9]?$' and d->>'children' ~ '^([0-9]|[1-9][0-9])$'
   and btrim(d->>'promotion_conditions')<>'' and btrim(d->>'booking_conditions')<>'',false) then return false; end if;
 if (d->>'adults')::integer+(d->>'children')::integer is distinct from o.price_people then return false; end if;
 if d->>'travel_type'='fly-cruise' and d->>'flight_inclusive'<>'yes' then return false; end if;
 if d->>'travel_type' in ('cruise-only','hotel-only','rail') and d->>'flight_inclusive'<>'no' then return false; end if;
 if (d->>'flight_inclusive'='yes') is distinct from (d->>'atol_status'='applicable') then return false; end if;
 if d->>'atol_status'='applicable' then
   select disclosures into s from public.holiday_offer_suppliers where id=o.supplier_id;
   if exists(select 1 from unnest(array['atol_holder','atol_number','protection_information','atol_artwork']) k where btrim(coalesce(s->>k,''))='') then return false; end if;
 end if;
 return true;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then return false;
end; $$;
-- Read guards also cover legacy offers without mutating their stored content/status.
alter function public.holiday_offer_current(uuid) rename to holiday_offer_current_phase8;
revoke all on function public.holiday_offer_current_phase8(uuid) from public,anon,authenticated,service_role;
create function public.holiday_offer_current(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.holiday_offer_current_phase8(p_id) and exists(select 1 from public.holiday_offers o where o.id=p_id and cms_private.offer_disclosures_ready(o));
$$;
grant execute on function public.holiday_offer_current(uuid) to anon,authenticated,service_role;
-- Policies bind function OIDs: recreate references so they use the new guard.
alter policy holiday_offers_read on public.holiday_offers using(public.cms_is_admin() or public.holiday_offer_current(id));
alter policy holiday_media_links_read on public.holiday_offer_media using(public.cms_is_admin() or public.holiday_offer_current(offer_id));
alter policy holiday_tags_read on public.holiday_offer_tags using(public.cms_is_admin() or public.holiday_offer_current(offer_id));
alter policy holiday_media_read on public.content_media using(exists(select 1 from public.holiday_offer_media u where u.media_id=content_media.id and public.holiday_offer_current(u.offer_id)) or exists(select 1 from public.holiday_offer_suppliers s where s.logo_id=content_media.id and public.holiday_supplier_permitted(s.id)));

-- Preserve the original revision/media/slug transaction; new fields are not sent to an obsolete client.
alter function public.cms_save_offer_supplier(jsonb) rename to cms_save_offer_supplier_phase8;
revoke all on function public.cms_save_offer_supplier_phase8(jsonb) from public,anon,authenticated;
create function public.cms_save_offer_supplier(p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; sid uuid;
begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 -- Same lock order as enquiry receipt: prevents supplier changes racing snapshot capture.
 perform pg_advisory_xact_lock(734021901);
 result:=public.cms_save_offer_supplier_phase8(p_data); sid:=(result->>'id')::uuid;
 update cms_private.offer_supplier_information set network_confirmed=coalesce((p_data->>'network_confirmed')::boolean,network_confirmed),
 permission_basis=coalesce(p_data->>'permission_basis',permission_basis),
 disclosures_verified_at=case when p_data ? 'disclosures_verified_at' then nullif(p_data->>'disclosures_verified_at','')::date else disclosures_verified_at end,
 disclosure_evidence=coalesce(p_data->>'disclosure_evidence',disclosure_evidence),account_reference=coalesce(p_data->>'account_reference',account_reference)
 where supplier_id=sid;
 update public.holiday_offer_suppliers set disclosures=coalesce(p_data->'disclosures',disclosures) where id=sid;
 -- A previously viewed offer must be reloaded after ANY supplier edit. Snapshots remain immutable.
 update public.holiday_offers set updated_at=clock_timestamp(),revision=revision+1 where supplier_id=sid;
 select to_jsonb(s)||(to_jsonb(i)-'supplier_id'-'normalised_name') into result from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id where s.id=sid;
 return result;
end; $$;
grant execute on function public.cms_save_offer_supplier(jsonb) to authenticated;

create function cms_private.enforce_offer_disclosures() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status='published' and (not public.holiday_supplier_permitted(new.supplier_id) or not cms_private.offer_disclosures_ready(new)) then
   raise exception 'Complete verified supplier identity/contact/network approval, ATOL classification, party numbers, full pricing and conditions before publication' using errcode='22023';
 end if;
 return new;
end; $$;
-- Covers direct writes by privileged maintenance code as well as the authorised API.
create trigger enforce_offer_disclosures before insert or update of details,supplier_id,status,price_people,price_minor,publication_approved,title,slug,featured_alt,featured_media_id,holiday_types on public.holiday_offers
 for each row execute function cms_private.enforce_offer_disclosures();
-- Serialise authorised offer writes with supplier changes and enquiry capture.
alter function public.cms_save_holiday_offer(jsonb,jsonb) rename to cms_save_holiday_offer_phase8;
revoke all on function public.cms_save_holiday_offer_phase8(jsonb,jsonb) from public,anon,authenticated;
create function public.cms_save_holiday_offer(p_data jsonb,p_private jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(734021901);
 return public.cms_save_holiday_offer_phase8(p_data,p_private);
end; $$;
grant execute on function public.cms_save_holiday_offer(jsonb,jsonb) to authenticated;
create or replace function public.receive_holiday_offer_enquiry(
  p_id uuid,p_reference text,p_received_at timestamptz,p_brief jsonb,p_email jsonb,
  p_fingerprint text,p_session_hash text,p_email_hash text,p_offer_reference text,p_offer_version timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.holiday_offers; supplier text; disclosures jsonb; snapshot jsonb; result jsonb; note text; safe_note text;
begin
  -- Same transaction lock preserves the existing deduplication and quota contract.
  -- Old receipts remain valid even after the referenced offer expires.
  perform pg_advisory_xact_lock(734021901);
  if exists(select 1 from public.holiday_enquiries where id=p_id or (email_hash=p_email_hash and fingerprint=p_fingerprint and received_at>now()-interval '24 hours')) then
    return public.receive_holiday_enquiry_v2(p_id,p_reference,p_received_at,p_brief,p_email,p_fingerprint,p_session_hash,p_email_hash);
  end if;
  if p_offer_reference !~ '^PBJO-[A-F0-9]{8}$' then return jsonb_build_object('outcome','offer_unavailable'); end if;
  select * into o from public.holiday_offers where reference=p_offer_reference for share;
  if not found then return jsonb_build_object('outcome','offer_unavailable'); end if;
  perform 1 from cms_private.offer_launch where singleton for share;
  perform 1 from cms_private.offer_supplier_information where supplier_id=o.supplier_id for share;
  if not public.holiday_offer_current(o.id) or p_offer_version is null or o.updated_at<>p_offer_version then return jsonb_build_object('outcome','offer_unavailable'); end if;
  select display_name,s.disclosures into supplier,disclosures from public.holiday_offer_suppliers s where id=o.supplier_id for share;
  snapshot:=jsonb_build_object('reference',o.reference,'title',o.title,'supplier',supplier,'supplier_disclosures',disclosures,'price_minor',o.price_minor,'currency',o.currency,'price_basis',o.price_basis,'price_people',o.price_people,'details',o.details,'expires_at',o.expires_at,'captured_at',now());
  note:=format(E'Holiday offer: %s (%s)\nSupplier/operator: %s\nAdvertised price: %s %s (%s; based on %s people)\nPrice checked: %s\nTravel: %s; %s nights; %s\nOccupancy: %s\nInclusions: %s\nExclusions: %s\nIncluded taxes/charges: %s\nPrice and availability require reconfirmation; this is not a booking.',o.title,o.reference,supplier,o.currency,to_char(o.price_minor/100.0,'FM9999999990.00'),o.price_basis,o.price_people,o.details->>'price_checked_at',o.details->>'departure_date',o.details->>'nights',o.details->>'departure_point',o.details->>'occupancy',o.details->>'inclusions',o.details->>'exclusions',o.details->>'unavoidable_charges');
  note:=note||format(E'\nSupplier legal/trading name: %s\nBusiness address: %s\nAddress for service (if different): %s\nPublic contact: %s\nOfficial website: %s\nATOL classification: %s\nATOL holder/number (only where applicable): %s %s\nProtection information: %s\nPriced party: %s adults, %s children\nMandatory charges not calculable: %s\nPromotion conditions: %s\nBooking/cancellation conditions: %s',disclosures->>'legal_name',disclosures->>'business_address',disclosures->>'service_address',disclosures->>'public_contact',disclosures->>'official_website',o.details->>'atol_status',case when o.details->>'atol_status'='applicable' then disclosures->>'atol_holder' else '' end,case when o.details->>'atol_status'='applicable' then disclosures->>'atol_number' else '' end,case when o.details->>'atol_status'='applicable' then disclosures->>'protection_information' else 'ATOL does not apply to these verified non-flight arrangements. '||coalesce(o.details->>'nonflight_protection','') end,o.details->>'adults',o.details->>'children',o.details->>'uncalculable_charges',o.details->>'promotion_conditions',o.details->>'booking_conditions');
  safe_note:=replace(replace(replace(note,'&','&amp;'),'<','&lt;'),'>','&gt;');
  p_email:=jsonb_set(p_email,'{text}',to_jsonb(coalesce(p_email->>'text','')||E'\n\n'||note));
  p_email:=jsonb_set(p_email,'{html}',to_jsonb(replace(coalesce(p_email->>'html','</body>'),'</body>','<h2>Holiday offer requested</h2><pre style="white-space:pre-wrap">'||safe_note||'</pre></body>')));
  result:=public.receive_holiday_enquiry_v2(p_id,p_reference,p_received_at,p_brief,p_email,p_fingerprint,p_session_hash,p_email_hash);
  if result->>'outcome'='received' then update public.holiday_enquiries set offer_context=snapshot where id=p_id; end if;
  return result;
end; $$;

revoke all on function cms_private.supplier_disclosures_ready(uuid),cms_private.offer_disclosures_ready(public.holiday_offers),cms_private.enforce_offer_disclosures() from public,anon,authenticated,service_role;
revoke all on function public.cms_save_offer_supplier(jsonb),public.cms_save_holiday_offer(jsonb,jsonb),public.holiday_offer_current(uuid) from public;
notify pgrst,'reload schema';
commit;
