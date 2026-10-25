-- MANUAL ONLY after 20261027_supplier_offer_disclosures.sql.
-- Lookup provenance is private and informational; it does not grant publication approval.
begin;
alter table cms_private.offer_supplier_information add column lookup_record jsonb not null default '{}'
 check(jsonb_typeof(lookup_record)='object' and length(lookup_record::text)<=20000
 and lookup_record-array['company_number','registered_address','facts']='{}'::jsonb);
alter function public.cms_save_offer_supplier(jsonb) rename to cms_save_offer_supplier_disclosures;
revoke all on function public.cms_save_offer_supplier_disclosures(jsonb) from public,anon,authenticated;
create function public.cms_save_offer_supplier(p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; sid uuid;
begin
 if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 -- The original wrapper retains revision checks, launch safeguards and snapshot locking.
 result:=public.cms_save_offer_supplier_disclosures(p_data-'lookup_record');sid:=(result->>'id')::uuid;
 if p_data ? 'lookup_record' then
   update cms_private.offer_supplier_information set lookup_record=p_data->'lookup_record' where supplier_id=sid;
 end if;
 select to_jsonb(s)||(to_jsonb(i)-'supplier_id'-'normalised_name') into result
 from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id where s.id=sid;
 return result;
end; $$;
revoke all on function public.cms_save_offer_supplier(jsonb) from public,anon,authenticated;
grant execute on function public.cms_save_offer_supplier(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
