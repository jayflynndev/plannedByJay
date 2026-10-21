-- Manual application only. This migration does not touch holiday enquiries.
begin;
create schema if not exists cms_private;
revoke all on schema cms_private from public, anon, authenticated;
create table cms_private.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table cms_private.administrators enable row level security;
create function public.cms_is_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(select 1 from cms_private.administrators where user_id = auth.uid());
$$;
revoke all on function public.cms_is_admin() from public, anon, authenticated;
grant execute on function public.cms_is_admin() to anon, authenticated;

create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 80)
);
insert into public.content_categories(name) values ('Travel advice'), ('Destinations'), ('Inspiration');
create table public.content_media (
  id uuid primary key,
  storage_path text not null unique check(storage_path = id::text || '.webp'),
  original_name text not null check(length(original_name) <= 180),
  sha256 text not null unique check(sha256 ~ '^[a-f0-9]{64}$'),
  width integer not null check(width > 0), height integer not null check(height > 0),
  bytes integer not null check(bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);
create table public.content_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(title) between 1 and 180),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 140),
  excerpt text not null default '' check(length(excerpt) <= 500),
  body text not null default '' check(length(body) <= 200000),
  content_type text not null check(content_type in ('Travel advice','Destination guide','Holiday comparison','Blog','Wish You Were Here','Inspiration')),
  category_id uuid references public.content_categories(id) on delete restrict,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  featured_media_id uuid references public.content_media(id) on delete restrict,
  featured_alt text not null default '' check(length(featured_alt) <= 300),
  seo_title text not null default '' check(length(seo_title) <= 180),
  seo_description text not null default '' check(length(seo_description) <= 500),
  canonical_url text not null default '' check(canonical_url = '' or canonical_url ~ '^https://'),
  author text not null default '' check(length(author) <= 120),
  research_date date, fact_checked_date date, review_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  published_at timestamptz, scheduled_at timestamptz,
  revision integer not null default 1,
  check(status <> 'published' or (length(trim(body)) > 0 and length(trim(excerpt)) > 0
    and length(trim(author)) > 0 and (featured_media_id is null or length(trim(featured_alt)) > 0)))
);
create index content_articles_public on public.content_articles(status, published_at desc);
create index content_articles_review on public.content_articles(review_date);
create table public.content_editorial (
  article_id uuid primary key references public.content_articles(id) on delete cascade,
  sources text not null default '' check(length(sources) <= 30000),
  notes text not null default '' check(length(notes) <= 30000)
);
-- Every slug is reserved permanently. Previous URLs cannot be reassigned to another article.
create table public.content_slugs (
  slug text primary key,
  article_id uuid not null references public.content_articles(id) on delete restrict,
  was_published boolean not null default false
);
create table public.content_media_usage (
  article_id uuid not null references public.content_articles(id) on delete cascade,
  media_id uuid not null references public.content_media(id) on delete restrict,
  primary key(article_id, media_id)
);
alter table public.content_categories enable row level security;
alter table public.content_media enable row level security;
alter table public.content_articles enable row level security;
alter table public.content_editorial enable row level security;
alter table public.content_slugs enable row level security;
alter table public.content_media_usage enable row level security;
revoke all on public.content_categories, public.content_media, public.content_articles,
  public.content_editorial, public.content_slugs, public.content_media_usage from public, anon, authenticated;
grant select on public.content_categories, public.content_media, public.content_articles, public.content_slugs to anon, authenticated;
grant select on public.content_editorial, public.content_media_usage to authenticated;
grant insert, update, delete on public.content_categories to authenticated;
-- Article/media writes go through guarded transactions, never unrestricted table writes.
create policy categories_read on public.content_categories for select using(true);
create policy categories_admin on public.content_categories for all to authenticated using(public.cms_is_admin()) with check(public.cms_is_admin());
create policy articles_read on public.content_articles for select using(status = 'published' or public.cms_is_admin());
create policy media_read on public.content_media for select using(public.cms_is_admin() or exists(
  select 1 from public.content_media_usage u join public.content_articles a on a.id = u.article_id
  where u.media_id = content_media.id and a.status = 'published'));
create policy editorial_admin on public.content_editorial for select to authenticated using(public.cms_is_admin());
create policy usage_read on public.content_media_usage for select using(public.cms_is_admin() or exists(
  select 1 from public.content_articles a where a.id = article_id and a.status = 'published'));
grant select on public.content_media_usage to anon;
create policy slugs_read on public.content_slugs for select using(public.cms_is_admin() or (was_published and exists(
  select 1 from public.content_articles a where a.id = article_id and a.status = 'published')));

create function public.cms_save_article(p_article jsonb, p_sources text, p_notes text, p_media_ids uuid[], p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.content_articles; old public.content_articles; incoming public.content_articles; sid uuid;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  incoming := jsonb_populate_record(null::public.content_articles, p_article);
  -- Derive usage in the database as well: callers cannot omit inline images to
  -- bypass the deletion guard. The renderer permits only registry UUID.webp URLs.
  p_media_ids := array(select distinct x from (
    select (r[1])::uuid x from regexp_matches(coalesce(incoming.body,''), '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.webp', 'g') r
    union select incoming.featured_media_id where incoming.featured_media_id is not null
  ) images);
  if incoming.id is null then incoming.id := gen_random_uuid(); end if;
  select * into old from public.content_articles where id = incoming.id for update;
  if (old.id is not null and old.revision <> p_revision) or (old.id is null and p_revision <> 0) then
    raise exception 'This article changed elsewhere. Reload before saving.' using errcode = '40001';
  end if;
  -- Lock images against concurrent deletion, including inline Markdown images.
  perform 1 from public.content_media where id = any(p_media_ids) for key share;
  if (select count(*) from public.content_media where id = any(p_media_ids)) <> cardinality(p_media_ids) then
    raise exception 'An image is no longer available' using errcode = '23503';
  end if;
  select article_id into sid from public.content_slugs where slug = incoming.slug;
  if sid is not null and sid <> incoming.id then raise exception 'This URL slug is already reserved' using errcode = '23505'; end if;
  insert into public.content_articles(id,title,slug,excerpt,body,content_type,category_id,status,featured_media_id,featured_alt,
    seo_title,seo_description,canonical_url,author,research_date,fact_checked_date,review_date,published_at,revision)
  values(incoming.id,incoming.title,incoming.slug,incoming.excerpt,incoming.body,incoming.content_type,incoming.category_id,incoming.status,
    incoming.featured_media_id,incoming.featured_alt,incoming.seo_title,incoming.seo_description,incoming.canonical_url,incoming.author,
    incoming.research_date,incoming.fact_checked_date,incoming.review_date,
    case when incoming.status = 'published' then coalesce(old.published_at,now()) else old.published_at end, coalesce(old.revision,0)+1)
  on conflict(id) do update set title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,body=excluded.body,
    content_type=excluded.content_type,category_id=excluded.category_id,status=excluded.status,featured_media_id=excluded.featured_media_id,
    featured_alt=excluded.featured_alt,seo_title=excluded.seo_title,seo_description=excluded.seo_description,canonical_url=excluded.canonical_url,
    author=excluded.author,research_date=excluded.research_date,fact_checked_date=excluded.fact_checked_date,review_date=excluded.review_date,
    updated_at=now(),published_at=excluded.published_at,revision=excluded.revision returning * into a;
  insert into public.content_slugs(slug,article_id,was_published) values(a.slug,a.id,a.status='published')
    on conflict(slug) do update set was_published=content_slugs.was_published or excluded.was_published
    where content_slugs.article_id=excluded.article_id;
  if not found then raise exception 'This URL slug is already reserved' using errcode='23505'; end if;
  insert into public.content_editorial(article_id,sources,notes) values(a.id,p_sources,p_notes)
    on conflict(article_id) do update set sources=excluded.sources,notes=excluded.notes;
  delete from public.content_media_usage where article_id=a.id;
  insert into public.content_media_usage(article_id,media_id)
    select a.id, x from unnest(p_media_ids || case when a.featured_media_id is null then '{}'::uuid[] else array[a.featured_media_id] end) x
    on conflict do nothing;
  return to_jsonb(a);
end; $$;
create function public.cms_register_media(p_media jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.content_media; result public.content_media;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  m := jsonb_populate_record(null::public.content_media,p_media);
  insert into public.content_media(id,storage_path,original_name,sha256,width,height,bytes)
    values(m.id,m.storage_path,m.original_name,m.sha256,m.width,m.height,m.bytes)
    on conflict(sha256) do update set sha256=excluded.sha256 returning * into result;
  return to_jsonb(result);
end; $$;
-- Delete registry first: foreign keys lock out concurrent usage and prevent deleting
-- in-use images. Storage then permits object removal only when no registry row exists.
create function public.cms_delete_media(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  delete from public.content_media where id=p_id;
end; $$;
revoke all on function public.cms_save_article(jsonb,text,text,uuid[],integer), public.cms_register_media(jsonb), public.cms_delete_media(uuid) from public, anon, authenticated;
grant execute on function public.cms_save_article(jsonb,text,text,uuid[],integer), public.cms_register_media(jsonb), public.cms_delete_media(uuid) to authenticated;
commit;
