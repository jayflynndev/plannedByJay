-- MANUAL SQL Editor application only. Fresh Articles CMS; no old backend objects restored.
begin;
create function public.articles_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and lower(email)='jay@plannedbyjay.com' and email_confirmed_at is not null and (banned_until is null or banned_until<=now()));
$$;
revoke all on function public.articles_is_admin() from public;
grant execute on function public.articles_is_admin() to anon,authenticated;
create table public.article_categories(id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 1 and 80),normalised_name text generated always as(lower(btrim(regexp_replace(name,'\s+',' ','g')))) stored unique);
insert into public.article_categories(id,name) values('a0000000-0000-4000-8000-000000000001','Travel advice');
create table public.article_tags(id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 1 and 50),normalised_name text generated always as(lower(btrim(regexp_replace(name,'\s+',' ','g')))) stored unique);
create table public.articles(
 id uuid primary key default gen_random_uuid(),title text not null default '' check(length(title)<=180),
 slug text not null unique check(length(slug) between 1 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 body text not null default '' check(length(body)<=150000),excerpt text not null default '' check(length(excerpt)<=200),author text not null default 'Jay' check(length(author)<=120),
 category_id uuid not null default 'a0000000-0000-4000-8000-000000000001' references public.article_categories(id) on delete restrict,
 status text not null default 'draft' check(status in ('draft','published')),
 expires_on date,featured_image text check(featured_image is null or featured_image ~ '^[a-f0-9-]{36}-[a-z0-9-]{1,80}\.webp$'),featured_alt text not null default '' check(length(featured_alt)<=300),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),published_at timestamptz,version integer not null default 1,
 check(status<>'published' or (btrim(title)<>'' and btrim(regexp_replace(body,'<[^>]*>','','g'))<>''))
);
create table public.article_tag_links(article_id uuid not null references public.articles(id) on delete cascade,tag_id uuid not null references public.article_tags(id) on delete cascade,primary key(article_id,tag_id));
create index articles_public_order on public.articles(published_at desc,id) where status='published';
create function public.article_dates() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='UPDATE' then
   if old.published_at is not null and new.slug<>old.slug then raise exception 'Published URLs are permanent' using errcode='22023';end if;
   new.id:=old.id;new.created_at:=old.created_at;new.published_at:=old.published_at;new.version:=old.version+1;
 else new.created_at:=now();new.published_at:=null;new.version:=1;end if;
 if new.status='published' and new.published_at is null then new.published_at:=now();end if;
 new.updated_at:=now();return new;
end;$$;
create trigger article_dates before insert or update on public.articles for each row execute function public.article_dates();
alter table public.articles enable row level security;
alter table public.article_categories enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_tag_links enable row level security;
revoke all on public.articles,public.article_categories,public.article_tags,public.article_tag_links from public,anon,authenticated;
grant select on public.articles,public.article_categories,public.article_tags,public.article_tag_links to anon,authenticated;
grant insert,update,delete on public.articles,public.article_categories,public.article_tags,public.article_tag_links to authenticated;
create policy articles_read on public.articles for select using(public.articles_is_admin() or (status='published' and (expires_on is null or expires_on>=(now() at time zone 'Europe/London')::date)));
create policy articles_write on public.articles for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
create policy categories_read on public.article_categories for select using(public.articles_is_admin() or exists(select 1 from public.articles a where a.category_id=article_categories.id and a.status='published' and (a.expires_on is null or a.expires_on>=(now() at time zone 'Europe/London')::date)));
create policy categories_write on public.article_categories for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
create policy tags_read on public.article_tags for select using(public.articles_is_admin() or exists(select 1 from public.article_tag_links l join public.articles a on a.id=l.article_id where l.tag_id=article_tags.id and a.status='published' and (a.expires_on is null or a.expires_on>=(now() at time zone 'Europe/London')::date)));
create policy tags_write on public.article_tags for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
create policy links_read on public.article_tag_links for select using(public.articles_is_admin() or exists(select 1 from public.articles a where a.id=article_id and a.status='published' and (a.expires_on is null or a.expires_on>=(now() at time zone 'Europe/London')::date)));
create policy links_write on public.article_tag_links for all to authenticated using(public.articles_is_admin()) with check(public.articles_is_admin());
-- One atomic article/tag save. Invoker privileges retain RLS; version avoids overwriting another tab.
create function public.save_article(p_article jsonb,p_tags text[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.articles;previous public.articles;tid uuid;ids uuid[]:='{}';tag text;
begin
 if not public.articles_is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 if cardinality(p_tags)>20 then raise exception 'Use at most twenty tags' using errcode='22023';end if;
 if nullif(p_article->>'id','') is not null then
   select * into previous from public.articles where id=(p_article->>'id')::uuid for update;
   if not found or previous.version<>(p_article->>'version')::integer then raise exception 'Article changed elsewhere' using errcode='40001';end if;
 end if;
 insert into public.articles(id,title,slug,body,excerpt,author,category_id,status,expires_on,featured_image,featured_alt)
 values(coalesce(previous.id,gen_random_uuid()),coalesce(p_article->>'title',''),p_article->>'slug',coalesce(p_article->>'body',''),coalesce(p_article->>'excerpt',''),coalesce(p_article->>'author','Jay'),coalesce(nullif(p_article->>'category_id','')::uuid,'a0000000-0000-4000-8000-000000000001'),coalesce(p_article->>'status','draft'),nullif(p_article->>'expires_on','')::date,nullif(p_article->>'featured_image',''),coalesce(p_article->>'featured_alt',''))
 on conflict(id) do update set title=excluded.title,slug=excluded.slug,body=excluded.body,excerpt=excluded.excerpt,author=excluded.author,category_id=excluded.category_id,status=excluded.status,expires_on=excluded.expires_on,featured_image=excluded.featured_image,featured_alt=excluded.featured_alt returning * into saved;
 foreach tag in array coalesce(p_tags,'{}') loop
   tag:=btrim(regexp_replace(tag,'\s+',' ','g'));if length(tag) not between 1 and 50 then raise exception 'Tag must have 1 to 50 characters' using errcode='22023';end if;
   insert into public.article_tags(name) values(tag) on conflict(normalised_name) do update set name=article_tags.name returning id into tid;
   ids:=array_append(ids,tid);
 end loop;
 delete from public.article_tag_links where article_id=saved.id;
 insert into public.article_tag_links select saved.id,x from unnest(ids) x on conflict do nothing;
 return to_jsonb(saved)||jsonb_build_object('tags',coalesce((select jsonb_agg(t.name order by t.name) from public.article_tags t join public.article_tag_links l on l.tag_id=t.id where l.article_id=saved.id),'[]'::jsonb));
end;$$;
revoke all on function public.save_article(jsonb,text[]),public.article_dates() from public,anon,authenticated;
grant execute on function public.save_article(jsonb,text[]) to authenticated;
-- Only public photographs belong here. No documents or customer information.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('article-images','article-images',true,4194304,array['image/webp']);
create policy article_images_list on storage.objects for select to authenticated using(bucket_id='article-images' and public.articles_is_admin());
create policy article_images_upload on storage.objects for insert to authenticated with check(bucket_id='article-images' and public.articles_is_admin() and name ~ '^[a-f0-9-]{36}-[a-z0-9-]{1,80}\.webp$');
-- Media replacement selects/uploads a new file; shared originals are retained.
notify pgrst,'reload schema';
commit;
