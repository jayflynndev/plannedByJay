-- MANUAL ONLY after curated offers + enquiry/reference/erasure migrations.
-- Existing records and immutable notification snapshots are not rewritten.
begin;
alter table public.holiday_enquiries add column offer_context jsonb;
create function public.protect_enquiry_offer_context() returns trigger language plpgsql set search_path='' as $$
begin
  if old.offer_context is not null and new.offer_context is distinct from old.offer_context then raise exception 'Offer enquiry snapshots are immutable'; end if;
  return new;
end; $$;
create trigger protect_enquiry_offer_context before update of offer_context on public.holiday_enquiries for each row execute function public.protect_enquiry_offer_context();
create function public.receive_holiday_offer_enquiry(
  p_id uuid,p_reference text,p_received_at timestamptz,p_brief jsonb,p_email jsonb,
  p_fingerprint text,p_session_hash text,p_email_hash text,p_offer_reference text,p_offer_version timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.holiday_offers; supplier text; snapshot jsonb; result jsonb; note text; safe_note text;
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
  select display_name into supplier from public.holiday_offer_suppliers where id=o.supplier_id for share;
  snapshot:=jsonb_build_object('reference',o.reference,'title',o.title,'supplier',supplier,'price_minor',o.price_minor,'currency',o.currency,'price_basis',o.price_basis,'price_people',o.price_people,'details',o.details,'expires_at',o.expires_at,'captured_at',now());
  note:=format(E'Holiday offer: %s (%s)\nSupplier/operator: %s\nAdvertised price: %s %s (%s; based on %s people)\nPrice checked: %s\nTravel: %s; %s nights; %s\nOccupancy: %s\nInclusions: %s\nExclusions: %s\nIncluded taxes/charges: %s\nPrice and availability require reconfirmation; this is not a booking.',o.title,o.reference,supplier,o.currency,to_char(o.price_minor/100.0,'FM9999999990.00'),o.price_basis,o.price_people,o.details->>'price_checked_at',o.details->>'departure_date',o.details->>'nights',o.details->>'departure_point',o.details->>'occupancy',o.details->>'inclusions',o.details->>'exclusions',o.details->>'unavoidable_charges');
  safe_note:=replace(replace(replace(note,'&','&amp;'),'<','&lt;'),'>','&gt;');
  p_email:=jsonb_set(p_email,'{text}',to_jsonb(coalesce(p_email->>'text','')||E'\n\n'||note));
  p_email:=jsonb_set(p_email,'{html}',to_jsonb(replace(coalesce(p_email->>'html','</body>'),'</body>','<h2>Holiday offer requested</h2><pre style="white-space:pre-wrap">'||safe_note||'</pre></body>')));
  result:=public.receive_holiday_enquiry_v2(p_id,p_reference,p_received_at,p_brief,p_email,p_fingerprint,p_session_hash,p_email_hash);
  if result->>'outcome'='received' then update public.holiday_enquiries set offer_context=snapshot where id=p_id; end if;
  return result;
end; $$;
revoke all on function public.protect_enquiry_offer_context(),public.receive_holiday_offer_enquiry(uuid,text,timestamptz,jsonb,jsonb,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.receive_holiday_offer_enquiry(uuid,text,timestamptz,jsonb,jsonb,text,text,text,text,timestamptz) to service_role;
notify pgrst,'reload schema';
commit;
