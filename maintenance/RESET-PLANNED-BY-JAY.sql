-- MANUAL, DESTRUCTIVE, NOT A MIGRATION. Jay authorises disposal of abandoned application data.
-- Intended project: Planned by Jay / watlnbiurgavvlalqwqz.
-- Verify the REF in the Supabase dashboard. SQL Editor cannot independently prove project identity.
-- SQL EDITOR: paste the WHOLE file into one query. In $manual_authorisation$ below,
-- replace the project placeholder with the REF you verified in the dashboard and
-- change authorise_application_reset from false to true. Then run the WHOLE query once.
-- Do not run a selected fragment or rely on SET statements from another editor run.
-- Preserve existing archives. Remove ONLY editorial-images through the Storage dashboard/API.
-- Do not delete Supabase storage metadata with SQL.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
-- MANUAL AUTHORISATION: these are the ONLY TWO values to edit before running.
-- The expected project in $guard$ is intentionally fixed; do not change it.
do $manual_authorisation$
declare
 verified_project_ref text := 'REPLACE_WITH_VERIFIED_PROJECT_REF';
 authorise_application_reset boolean := false;
begin
 if verified_project_ref is distinct from 'watlnbiurgavvlalqwqz' then
   raise exception 'Project not confirmed: verify Planned by Jay dashboard REF watlnbiurgavvlalqwqz and enter it in verified_project_ref';
 end if;
 if authorise_application_reset is distinct from true then
   raise exception 'Manual authorisation required: set authorise_application_reset to true to dispose of the abandoned application data';
 end if;
 -- Transaction-local settings are supplied in this SAME execution and expire at commit/rollback.
 perform set_config('pbj_reset.confirmed_project_ref',verified_project_ref,true);
 perform set_config('pbj_reset.disposal_authorised','true',true);
end; $manual_authorisation$;
do $guard$
begin
 if current_setting('pbj_reset.confirmed_project_ref',true) is distinct from 'watlnbiurgavvlalqwqz'
 or current_setting('pbj_reset.disposal_authorised',true) is distinct from 'true' then
 raise exception 'STOP: verify project identity and explicit disposal authorisation first';end if;
 if exists(select 1 from storage.buckets where id='editorial-images') then
 raise exception 'STOP: remove only editorial-images using the Storage dashboard/API first';end if;
 if to_regclass('public.holiday_enquiries') is null or to_regclass('public.content_articles') is null then
 raise exception 'STOP: expected Planned by Jay schema not found';end if;
end; $guard$;
do $scope$
declare owned text[]:=array['cms_private.administrators','cms_private.offer_information','cms_private.offer_launch','cms_private.offer_slugs','cms_private.offer_supplier_information','public.content_article_tags','public.content_articles','public.content_categories','public.content_editorial','public.content_media','public.content_media_usage','public.content_slugs','public.content_tags','public.content_types','public.holiday_enquiries','public.holiday_enquiry_limits','public.holiday_enquiry_reference_reservations','public.holiday_notification_erasure_blockers','public.holiday_offer_media','public.holiday_offer_suppliers','public.holiday_offer_tags','public.holiday_offers']::text[];
begin
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='cms_private' and c.relkind in ('r','p','v','m','f') and not(n.nspname||'.'||c.relname=any(owned))) then raise exception 'STOP: unknown relation in cms_private';end if;
 if exists(select 1 from pg_constraint c where c.contype='f' and c.confrelid in(select to_regclass(x) from unnest(owned) x) and c.conrelid not in(select to_regclass(x) from unnest(owned) x)) then raise exception 'STOP: an outside table references application data';end if;
 if exists(select 1 from pg_depend d join pg_rewrite r on r.oid=d.objid join pg_class v on v.oid=r.ev_class where d.refobjid in(select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname||'.'||c.relname=any(owned)) and v.relkind in ('v','m') and v.oid not in(select to_regclass(x) from unnest(owned) x)) then raise exception 'STOP: an outside view references application data';end if;
end; $scope$;
drop policy if exists editorial_guard_delete on storage.objects;
drop policy if exists editorial_guard_insert on storage.objects;
drop policy if exists editorial_guard_select on storage.objects;
drop policy if exists editorial_guard_update on storage.objects;
drop policy if exists editorial_image_delete on storage.objects;
drop policy if exists editorial_image_insert on storage.objects;
drop policy if exists editorial_image_select on storage.objects;
-- Exact application function names, including historical renamed versions.
do $functions$
declare f record;
begin
 for f in select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array['claim_holiday_notification','cms_article_search_vector','cms_category_name_guard','cms_create_classification','cms_create_tag','cms_delete_media','cms_get_holiday_offer','cms_holiday_offer_counts','cms_is_admin','cms_offer_suppliers','cms_refresh_article_search','cms_refresh_tag_search','cms_register_media','cms_save_article','cms_save_article_core','cms_save_holiday_offer','cms_save_holiday_offer_phase8','cms_save_holiday_offer_record','cms_save_offer_supplier','cms_save_offer_supplier_disclosures','cms_save_offer_supplier_phase8','erase_holiday_enquiry','finish_holiday_notification','holiday_offer_current','holiday_offer_current_phase8','holiday_offers_enabled','holiday_supplier_permitted','preserve_holiday_enquiry_reference','protect_enquiry_offer_context','protect_holiday_reference_reservations','public_article_tags','receive_holiday_enquiry','receive_holiday_enquiry_v2','receive_holiday_offer_enquiry','reserve_holiday_enquiry_reference','search_content_articles','track_holiday_notification_attempt']::text[]) loop
 execute format('drop function if exists %I.%I(%s) cascade',f.nspname,f.proname,f.args);
 end loop;
end; $functions$;
drop table if exists public.content_article_tags cascade;
drop table if exists public.content_articles cascade;
drop table if exists public.content_categories cascade;
drop table if exists public.content_editorial cascade;
drop table if exists public.content_media cascade;
drop table if exists public.content_media_usage cascade;
drop table if exists public.content_slugs cascade;
drop table if exists public.content_tags cascade;
drop table if exists public.content_types cascade;
drop table if exists public.holiday_enquiries cascade;
drop table if exists public.holiday_enquiry_limits cascade;
drop table if exists public.holiday_enquiry_reference_reservations cascade;
drop table if exists public.holiday_notification_erasure_blockers cascade;
drop table if exists public.holiday_offer_media cascade;
drop table if exists public.holiday_offer_suppliers cascade;
drop table if exists public.holiday_offer_tags cascade;
drop table if exists public.holiday_offers cascade;
drop schema if exists cms_private cascade;
-- Preserve shared infrastructure: public schema itself, auth, storage, extensions,
-- provider roles, realtime, vault, supabase_migrations and provider-owned objects.
notify pgrst,'reload schema';
commit;

-- Verification: each query below must return zero rows.
select object_name as remaining_application_table from unnest(array['cms_private.administrators','cms_private.offer_information','cms_private.offer_launch','cms_private.offer_slugs','cms_private.offer_supplier_information','public.content_article_tags','public.content_articles','public.content_categories','public.content_editorial','public.content_media','public.content_media_usage','public.content_slugs','public.content_tags','public.content_types','public.holiday_enquiries','public.holiday_enquiry_limits','public.holiday_enquiry_reference_reservations','public.holiday_notification_erasure_blockers','public.holiday_offer_media','public.holiday_offer_suppliers','public.holiday_offer_tags','public.holiday_offers']::text[]) object_name where to_regclass(object_name) is not null;
select n.nspname,p.proname as remaining_application_function from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname=any(array['claim_holiday_notification','cms_article_search_vector','cms_category_name_guard','cms_create_classification','cms_create_tag','cms_delete_media','cms_get_holiday_offer','cms_holiday_offer_counts','cms_is_admin','cms_offer_suppliers','cms_refresh_article_search','cms_refresh_tag_search','cms_register_media','cms_save_article','cms_save_article_core','cms_save_holiday_offer','cms_save_holiday_offer_phase8','cms_save_holiday_offer_record','cms_save_offer_supplier','cms_save_offer_supplier_disclosures','cms_save_offer_supplier_phase8','erase_holiday_enquiry','finish_holiday_notification','holiday_offer_current','holiday_offer_current_phase8','holiday_offers_enabled','holiday_supplier_permitted','preserve_holiday_enquiry_reference','protect_enquiry_offer_context','protect_holiday_reference_reservations','public_article_tags','receive_holiday_enquiry','receive_holiday_enquiry_v2','receive_holiday_offer_enquiry','reserve_holiday_enquiry_reference','search_content_articles','track_holiday_notification_attempt']::text[])) or n.nspname='cms_private';
select nspname as remaining_private_schema from pg_namespace where nspname='cms_private';
select id as remaining_application_bucket from storage.buckets where id='editorial-images';
select polname as remaining_application_storage_policy from pg_policy where polrelid='storage.objects'::regclass and polname=any(array['editorial_guard_delete','editorial_guard_insert','editorial_guard_select','editorial_guard_update','editorial_image_delete','editorial_image_insert','editorial_image_select']::text[]);
