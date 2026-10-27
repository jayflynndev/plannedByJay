-- MANUAL SQL Editor, before deploying the article placement controls.
-- Adds only two independent flags. Existing copy, dates, versions, publication and RLS remain unchanged.
begin;
alter table public.articles add column if not exists homepage_featured boolean not null default false;
alter table public.articles add column if not exists advice_pinned boolean not null default false;
create index if not exists articles_advice_order on public.articles(advice_pinned desc,published_at desc,id) where status='published';
create or replace function public.save_article(p_article jsonb,p_tags text[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.articles;previous public.articles;tid uuid;ids uuid[]:='{}';tag text;
begin
 if not public.articles_is_admin() then raise exception 'Administrator required' using errcode='42501';end if;
 if cardinality(p_tags)>20 then raise exception 'Use at most twenty tags' using errcode='22023';end if;
 if nullif(p_article->>'id','') is not null then
   select * into previous from public.articles where id=(p_article->>'id')::uuid for update;
   if not found or previous.version<>(p_article->>'version')::integer then raise exception 'Article changed elsewhere' using errcode='40001';end if;
 end if;
 insert into public.articles(id,title,slug,body,excerpt,author,category_id,status,expires_on,featured_image,featured_alt,homepage_featured,advice_pinned)
 values(coalesce(previous.id,gen_random_uuid()),coalesce(p_article->>'title',''),p_article->>'slug',coalesce(p_article->>'body',''),coalesce(p_article->>'excerpt',''),coalesce(p_article->>'author','Jay'),coalesce(nullif(p_article->>'category_id','')::uuid,'a0000000-0000-4000-8000-000000000001'),coalesce(p_article->>'status','draft'),nullif(p_article->>'expires_on','')::date,nullif(p_article->>'featured_image',''),coalesce(p_article->>'featured_alt',''),coalesce((p_article->>'homepage_featured')::boolean,previous.homepage_featured,false),coalesce((p_article->>'advice_pinned')::boolean,previous.advice_pinned,false))
 on conflict(id) do update set title=excluded.title,slug=excluded.slug,body=excluded.body,excerpt=excluded.excerpt,author=excluded.author,category_id=excluded.category_id,status=excluded.status,expires_on=excluded.expires_on,featured_image=excluded.featured_image,featured_alt=excluded.featured_alt,homepage_featured=excluded.homepage_featured,advice_pinned=excluded.advice_pinned returning * into saved;
 foreach tag in array coalesce(p_tags,'{}') loop
   tag:=btrim(regexp_replace(tag,'\s+',' ','g'));if length(tag) not between 1 and 50 then raise exception 'Tag must have 1 to 50 characters' using errcode='22023';end if;
   insert into public.article_tags(name) values(tag) on conflict(normalised_name) do update set name=article_tags.name returning id into tid;
   ids:=array_append(ids,tid);
 end loop;
 delete from public.article_tag_links where article_id=saved.id;
 insert into public.article_tag_links select saved.id,x from unnest(ids) x on conflict do nothing;
 return to_jsonb(saved)||jsonb_build_object('tags',coalesce((select jsonb_agg(t.name order by t.name) from public.article_tags t join public.article_tag_links l on l.tag_id=t.id where l.article_id=saved.id),'[]'::jsonb));
end;$$;
-- CREATE OR REPLACE preserves the existing authenticated-only execute grant and invoker/RLS behaviour.
notify pgrst,'reload schema';
commit;
