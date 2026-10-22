-- MANUAL approval/application only, after 20261014_editorial_cms.sql (and storage).
-- Adds discovery metadata; no enquiry, category, media, editorial or slug records removed.
begin;
alter table public.content_articles
  add column homepage_featured boolean not null default false,
  add column advice_pinned boolean not null default false,
  add column search_document tsvector not null default ''::tsvector;
create table public.content_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 1 and 40),
  normalised_name text generated always as
    (lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))) stored unique
);
create table public.content_article_tags (
  article_id uuid not null references public.content_articles(id) on delete cascade,
  tag_id uuid not null references public.content_tags(id) on delete restrict,
  primary key(article_id,tag_id)
);
create index content_article_tags_tag on public.content_article_tags(tag_id,article_id);
alter table public.content_tags enable row level security;
alter table public.content_article_tags enable row level security;
revoke all on public.content_tags, public.content_article_tags from public, anon, authenticated;
grant select on public.content_tags, public.content_article_tags to anon, authenticated;
create policy article_tags_read on public.content_article_tags for select using (
  public.cms_is_admin() or exists(select 1 from public.content_articles a where a.id=article_id and a.status='published')
);
create policy tags_read on public.content_tags for select using (
  public.cms_is_admin() or exists(select 1 from public.content_article_tags l
    join public.content_articles a on a.id=l.article_id where l.tag_id=content_tags.id and a.status='published')
);

create function public.cms_create_tag(p_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cleaned text; result public.content_tags;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  cleaned:=btrim(regexp_replace(coalesce(p_name,''),'\s+',' ','g'));
  if length(cleaned) not between 1 and 40 then raise exception 'Use 1 to 40 characters' using errcode='22023'; end if;
  -- Serialises registry-size checks and case-insensitive reuse across administrators.
  perform pg_advisory_xact_lock(734021906);
  select * into result from public.content_tags where normalised_name=lower(cleaned);
  if found then return to_jsonb(result)-'normalised_name'; end if;
  if (select count(*) from public.content_tags)>=100 then raise exception 'Use an existing tag: the 100-tag limit has been reached' using errcode='22023'; end if;
  insert into public.content_tags(name) values(cleaned) returning * into result;
  return to_jsonb(result)-'normalised_name';
end; $$;

create function public.cms_article_search_vector(p_id uuid,p_title text,p_excerpt text,p_body text)
returns tsvector language sql stable security definer set search_path='' as $$
  select setweight(to_tsvector('english',coalesce(p_title,'')),'A')
    || setweight(to_tsvector('english',coalesce(p_excerpt,'')),'B')
    || setweight(to_tsvector('english',coalesce(p_body,'')),'D')
    || setweight(to_tsvector('english',coalesce((select string_agg(t.name,' ' order by t.id)
      from public.content_tags t join public.content_article_tags l on l.tag_id=t.id where l.article_id=p_id),'')),'A');
$$;
create function public.cms_refresh_article_search() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  new.search_document:=public.cms_article_search_vector(new.id,new.title,new.excerpt,new.body);
  return new;
end; $$;
create trigger refresh_article_search before insert or update of title,excerpt,body
  on public.content_articles for each row execute function public.cms_refresh_article_search();
create function public.cms_refresh_tag_search() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  target:=case when tg_op='DELETE' then old.article_id else new.article_id end;
  update public.content_articles a set search_document=public.cms_article_search_vector(a.id,a.title,a.excerpt,a.body) where a.id=target;
  return null;
end; $$;
create trigger refresh_tag_search after insert or delete on public.content_article_tags
  for each row execute function public.cms_refresh_tag_search();
update public.content_articles a set search_document=public.cms_article_search_vector(a.id,a.title,a.excerpt,a.body);
create index content_articles_search on public.content_articles using gin(search_document) where status='published';
create index content_articles_placement on public.content_articles(advice_pinned desc,published_at desc,id) where status='published';
create index content_articles_discovery_filters on public.content_articles(category_id,content_type,published_at desc) where status='published';
create index content_articles_featured on public.content_articles(homepage_featured desc,published_at desc,updated_at desc,id) where status='published';

-- Keep the original guarded transaction for revision checks, media and slug history.
-- The wrapper applies tag/placement changes in that SAME transaction; no partial save.
alter function public.cms_save_article(jsonb,text,text,uuid[],integer) rename to cms_save_article_core;
revoke all on function public.cms_save_article_core(jsonb,text,text,uuid[],integer) from public,anon,authenticated;
create function public.cms_save_article(p_article jsonb,p_sources text,p_notes text,p_media_ids uuid[],p_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare saved jsonb; ids uuid[]; aid uuid;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if p_article ? 'tag_ids' and jsonb_typeof(p_article->'tag_ids') <> 'array' then raise exception 'Invalid tags' using errcode='22023'; end if;
  ids:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_article->'tag_ids','[]'::jsonb)));
  if cardinality(ids)>8 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then
    raise exception 'Choose at most eight distinct tags' using errcode='22023'; end if;
  perform 1 from public.content_tags where id=any(ids) for key share;
  if (select count(*) from public.content_tags where id=any(ids))<>cardinality(ids) then raise exception 'Tag unavailable' using errcode='23503'; end if;
  saved:=public.cms_save_article_core(p_article,p_sources,p_notes,p_media_ids,p_revision);
  aid:=(saved->>'id')::uuid;
  update public.content_articles set
    homepage_featured=coalesce((p_article->>'homepage_featured')::boolean,homepage_featured),
    advice_pinned=coalesce((p_article->>'advice_pinned')::boolean,advice_pinned)
    where id=aid;
  -- Omitted tag_ids from an older authorised tool preserve existing associations.
  if p_article ? 'tag_ids' then
    delete from public.content_article_tags where article_id=aid and not(tag_id=any(ids));
    insert into public.content_article_tags select aid,x from unnest(ids) x on conflict do nothing;
  end if;
  select to_jsonb(a)-'search_document' into saved from public.content_articles a where id=aid;
  return saved || jsonb_build_object('tag_ids',coalesce((select jsonb_agg(tag_id order by tag_id)
    from public.content_article_tags where article_id=aid),'[]'::jsonb));
end; $$;

create function public.search_content_articles(p_query text default '',p_type text default '',p_category uuid default null,p_tag uuid default null,p_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare query tsquery; result jsonb;
begin
  if p_query is null or length(p_query)>120 or p_page is null or p_page not between 1 and 1000 then
    raise exception 'Invalid discovery query' using errcode='22023'; end if;
  query:=websearch_to_tsquery('english',p_query);
  with matches as (
    select a.id,a.title,a.slug,a.excerpt,a.content_type,a.category_id,a.featured_media_id,a.featured_alt,a.published_at,a.advice_pinned,
      case when p_query='' then 0 else ts_rank(a.search_document,query) end as relevance
    from public.content_articles a where a.status='published'
      and (p_query='' or a.search_document @@ query)
      and (p_type='' or a.content_type=p_type) and (p_category is null or a.category_id=p_category)
      and (p_tag is null or exists(select 1 from public.content_article_tags l where l.article_id=a.id and l.tag_id=p_tag))
  ), page_rows as (
    select * from matches order by advice_pinned desc,relevance desc,published_at desc nulls last,id
    limit 12 offset (p_page-1)*12
  ) select jsonb_build_object('total',(select count(*) from matches),'articles',coalesce((select jsonb_agg(to_jsonb(r)-'relevance'
      order by r.advice_pinned desc,r.relevance desc,r.published_at desc nulls last,r.id) from page_rows r),'[]'::jsonb)) into result;
  return result;
end; $$;
-- Public filter options cannot reveal tags used only by drafts, even for an admin caller.
create function public.public_article_tags() returns setof public.content_tags
language sql stable security invoker set search_path='' as $$
  select t.* from public.content_tags t where exists(select 1 from public.content_article_tags l
    join public.content_articles a on a.id=l.article_id where l.tag_id=t.id and a.status='published')
    order by t.normalised_name,t.id limit 100;
$$;
revoke all on function public.cms_create_tag(text),public.cms_article_search_vector(uuid,text,text,text),
  public.cms_refresh_article_search(),public.cms_refresh_tag_search(),public.cms_save_article(jsonb,text,text,uuid[],integer),
  public.search_content_articles(text,text,uuid,uuid,integer),public.public_article_tags() from public,anon,authenticated;
grant execute on function public.cms_create_tag(text),public.cms_save_article(jsonb,text,text,uuid[],integer) to authenticated;
grant execute on function public.search_content_articles(text,text,uuid,uuid,integer),public.public_article_tags() to anon,authenticated;
commit;
