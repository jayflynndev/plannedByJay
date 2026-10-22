-- MANUAL application after 20261023_article_discovery.sql. No article rewrites.
begin;
create table public.content_types (
  name text primary key check(length(name) between 1 and 80),
  normalised_name text generated always as (lower(btrim(regexp_replace(name,'\s+',' ','g')))) stored unique
);
insert into public.content_types(name) values ('Travel advice'),('Destination guide'),('Holiday comparison'),('Blog'),('Wish You Were Here'),('Inspiration');
alter table public.content_types enable row level security;
revoke all on public.content_types from public,anon,authenticated;
grant select on public.content_types to anon,authenticated;
create policy content_types_read on public.content_types for select using (true);
alter table public.content_articles drop constraint content_articles_content_type_check;
alter table public.content_articles add constraint content_articles_content_type_fkey foreign key(content_type) references public.content_types(name) on delete restrict on update restrict;

-- Also protects the existing category maintenance page. Existing duplicate rows
-- remain intact; future inserts/renames cannot introduce another equivalent name.
create function public.cms_category_name_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(734021907);
  new.name:=btrim(regexp_replace(new.name,'\s+',' ','g'));
  if exists(select 1 from public.content_categories c where c.id<>new.id and lower(btrim(regexp_replace(c.name,'\s+',' ','g')))=lower(new.name)) then
    raise exception 'A category with this name already exists' using errcode='23505';
  end if;
  return new;
end; $$;
create trigger category_name_guard before insert or update of name on public.content_categories for each row execute function public.cms_category_name_guard();
create function public.cms_create_classification(p_kind text,p_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cleaned text; result jsonb;
begin
  if not public.cms_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  cleaned:=btrim(regexp_replace(coalesce(p_name,''),'\s+',' ','g'));
  if length(cleaned) not between 1 and 80 then raise exception 'Use 1 to 80 characters' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(734021907);
  if p_kind='category' then
    select jsonb_build_object('id',id,'name',name) into result from public.content_categories where lower(btrim(regexp_replace(name,'\s+',' ','g')))=lower(cleaned) order by id limit 1;
    if result is null then insert into public.content_categories(name) values(cleaned) returning jsonb_build_object('id',id,'name',name) into result; end if;
  elsif p_kind='content-type' then
    select jsonb_build_object('name',name) into result from public.content_types where normalised_name=lower(cleaned);
    if result is null then
      if (select count(*) from public.content_types)>=100 then raise exception 'Use an existing content type: the 100-type limit has been reached' using errcode='22023'; end if;
      insert into public.content_types(name) values(cleaned) returning jsonb_build_object('name',name) into result;
    end if;
  else raise exception 'Invalid classification' using errcode='22023'; end if;
  return result;
end; $$;
revoke all on function public.cms_category_name_guard(),public.cms_create_classification(text,text) from public,anon,authenticated;
grant execute on function public.cms_create_classification(text,text) to authenticated;
commit;
