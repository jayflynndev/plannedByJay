-- Apply AFTER 20261014_editorial_cms.sql using the Supabase SQL editor.
-- Dedicated bucket: public editorial photographs only, never customer documents.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('editorial-images','editorial-images',true,5242880,array['image/webp'])
on conflict(id) do nothing;
create policy editorial_image_insert on storage.objects for insert to authenticated
with check(bucket_id='editorial-images' and public.cms_is_admin()
  and name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$');
create policy editorial_image_select on storage.objects for select to authenticated
using(bucket_id='editorial-images' and public.cms_is_admin());
-- No update/upsert permission: replacing a photograph creates a new safe object.
create policy editorial_image_delete on storage.objects for delete to authenticated
using(bucket_id='editorial-images' and public.cms_is_admin() and not exists(
  select 1 from public.content_media m where m.storage_path=storage.objects.name));
-- Restrictive guards prevent any older broad permissive Storage policy from
-- accidentally granting access to this NEW bucket. Other buckets are unaffected.
create policy editorial_guard_insert on storage.objects as restrictive for insert to anon, authenticated
with check(bucket_id<>'editorial-images' or (public.cms_is_admin()
  and name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$'));
create policy editorial_guard_select on storage.objects as restrictive for select to anon, authenticated
using(bucket_id<>'editorial-images' or public.cms_is_admin());
create policy editorial_guard_update on storage.objects as restrictive for update to anon, authenticated
using(bucket_id<>'editorial-images') with check(bucket_id<>'editorial-images');
create policy editorial_guard_delete on storage.objects as restrictive for delete to anon, authenticated
using(bucket_id<>'editorial-images' or (public.cms_is_admin() and not exists(
  select 1 from public.content_media m where m.storage_path=storage.objects.name)));
commit;
