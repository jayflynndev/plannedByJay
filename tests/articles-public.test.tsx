import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {holidayFixture} from './helpers/holiday-fixture';
const marker=require.resolve('server-only');require.cache[marker]={exports:{},id:marker,filename:marker,loaded:true} as NodeModule;

test('public routes, SEO, expiry, drafts, stable links, sitemap and cache freshness use anonymous reads',async()=>{
 const keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SITE_URL'];const old=keys.map(k=>process.env[k]);const original=globalThis.fetch;Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',SITE_URL:'https://plannedbyjay.com'});
 const category='a0000000-0000-4000-8000-000000000001';const base={id:randomUUID(),title:'A useful travel guide',slug:'travel-guide',body:'<h2>Advice</h2><p><strong>Useful advice</strong> for travellers.</p><script>alert(1)</script>',author:'Jay',category_id:category,status:'published',excerpt:'',expires_on:null,featured_image:null,featured_alt:'',created_at:'2026-10-25T12:00:00Z',updated_at:'2026-10-25T12:00:00Z',published_at:'2026-10-25T12:00:00Z',version:1};let articles=[base,{...base,id:randomUUID(),slug:'draft',status:'draft'},{...base,id:randomUUID(),slug:'expired',expires_on:'2000-01-01'}];const requests:{url:URL;cache:RequestCache|undefined;auth:string|null}[]=[];
 globalThis.fetch=async(input,init)=>{const url=new URL(String(input));requests.push({url,cache:init?.cache,auth:new Headers(init?.headers).get('Authorization')});if(url.pathname.endsWith('article_categories'))return Response.json([{id:category,name:'Travel advice'}]);if(url.pathname.endsWith('articles')){let rows=articles.filter(a=>a.status==='published'&&(!a.expires_on||a.expires_on>='2026-10-25'));const slug=url.searchParams.get('slug');if(slug)rows=rows.filter(a=>'eq.'+a.slug===slug);return Response.json(rows,{headers:{'Content-Range':`0-${Math.max(0,rows.length-1)}/${rows.length}`}});}return Response.json([]);};
 try{
 const {default:Listing,dynamic}=await import('../src/app/travel-advice/page');const {default:Detail,generateMetadata}=await import('../src/app/travel-advice/[slug]/page');const {default:sitemap}=await import('../src/app/sitemap');const {default:Home}=await import('../src/app/page');
 assert.equal(dynamic,'force-dynamic');const listing=await Listing();assert.deepEqual(listing.props.results?.articles.map((a:{slug:string})=>a.slug),['travel-guide']);const page=await Detail({params:Promise.resolve({slug:'travel-guide'})});assert.ok(page);const meta=await generateMetadata({params:Promise.resolve({slug:'travel-guide'})});assert.equal(meta.alternates.canonical,'https://plannedbyjay.com/travel-advice/travel-guide');assert.match(meta.description,/Useful advice/);assert.doesNotMatch(meta.description,/alert/);assert.equal(meta.openGraph.title,base.title);
 const markup=page.props.children as {props:{dangerouslySetInnerHTML?:{__html:string};article?:{body:string}}}[];assert.doesNotMatch(markup.find(c=>c.props?.article)?.props.article?.body||'',/script/);const structured=markup.find(c=>c.props?.dangerouslySetInnerHTML)?.props.dangerouslySetInnerHTML?.__html||'';assert.match(structured,/schema.org/);assert.match(structured,/travel-guide/);
 await assert.rejects(Detail({params:Promise.resolve({slug:'draft'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);await assert.rejects(Detail({params:Promise.resolve({slug:'expired'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);const map=await sitemap();assert.ok(map.some(r=>r.url.endsWith('/travel-guide')));assert.ok(!map.some(r=>r.url.endsWith('/draft')||r.url.endsWith('/expired')));
 const home=await Home();const children=home.props.children as {props:{articles?:{slug:string}[]}}[];assert.deepEqual(children.find(c=>c.props.articles)?.props.articles?.map(a=>a.slug),['travel-guide']);
 articles=[{...base,title:'Updated title',body:'<p>Updated useful article.</p>',excerpt:'A custom preview for travellers.'}];const updated=await generateMetadata({params:Promise.resolve({slug:'travel-guide'})});assert.match(updated.title,/Updated title/);assert.equal(updated.description,'A custom preview for travellers.');assert.equal(updated.openGraph.description,updated.description);const customListing=await Listing();assert.equal(customListing.props.results?.articles[0].excerpt,updated.description);const customHome=await Home();assert.equal(customHome.props.children.find((c:{props:{articles?:unknown[]}})=>c.props.articles)?.props.articles[0].excerpt,updated.description);assert.equal(updated.alternates.canonical,meta.alternates.canonical);
 articles=[];const empty=await Listing();assert.equal(empty.props.results?.articles.length,0);await assert.rejects(Detail({params:Promise.resolve({slug:'travel-guide'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);assert.ok(requests.every(r=>r.cache==='no-store'));assert.ok(requests.every(r=>!r.auth||r.auth==='Bearer sb_publishable_fixture'));
 }finally{globalThis.fetch=original;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});

test('public search uses persisted linked tags, titles, descriptions and full body before pagination under anonymous RLS',async()=>{
 const {db,run,admin}=await holidayFixture();
 const keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'],old=keys.map(key=>process.env[key]),original=globalThis.fetch;
 Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'});
 const category='a0000000-0000-4000-8000-000000000001',otherCategory=randomUUID();
 const requests:URL[]=[];
 try{
  await db.query('insert into public.article_categories(id,name) values($1,$2)',[otherCategory,'Destination guides']);
  const save=async(value:Record<string,unknown>,tags:string[])=>(await run<{article:Record<string,unknown>}>('authenticated',admin,'select public.save_article($1,$2) article',[value,tags])).rows[0].article;
  const nimes=await save({title:'Nîmes city guide',slug:'nimes-city-guide',excerpt:'Sunlit courtyards and Roman streets.',body:'<h2>Getting around</h2><p>Explore quiet <strong>railway</strong> routes.</p>',status:'published'},['France','Hidden   Gems']);
  assert.deepEqual(nimes.tags,['France','Hidden Gems'],'the real save function persists normalised multiword tag names');
  assert.equal((await db.query('select * from public.article_tag_links where article_id=$1',[nimes.id])).rows.length,2);
  const other=await save({title:'Another city guide',slug:'another-city-guide',body:'<p>Other destination details.</p>',status:'published',category_id:otherCategory},['France']);
  const draft=await save({title:'Private France guide',slug:'private-guide',body:'<p>UnpublishedSecret</p>',status:'draft'},['France','Hidden Gems','PrivateTag']);
  const expired=await save({title:'Expired France guide',slug:'expired-guide',body:'<p>ExpiredSecret</p>',status:'published',expires_on:'2000-01-01'},['France','Hidden Gems','ExpiredTag']);
  // More records than a public page AND a fetch batch; matching tags are on older records.
  await db.exec("insert into public.articles(title,slug,body,status) select case n when 1 then 'All-Inclusive holidays' when 2 then 'What actually matters on a cruise' else 'Recent guide '||n end,'recent-guide-'||n,'<p>Ordinary destination advice.</p>','published' from generate_series(1,205) n");
  globalThis.fetch=async(input,init)=>{
   const url=new URL(String(input));requests.push(url);
   assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer sb_publishable_fixture');
   assert.equal(init?.cache,'no-store');
   if(url.pathname.endsWith('/article_categories'))return Response.json((await run('anon','','select id,name from public.article_categories order by name')).rows);
   assert.ok(url.pathname.endsWith('/articles'));
   assert.equal(url.searchParams.get('status'),'eq.published');
   assert.equal(url.searchParams.get('title'),null,'search must not restrict the collection to title matches');
   const hasTags=url.searchParams.get('select')?.includes('article_tag_links(article_tags(name))');
   const args:unknown[]=[],conditions=["a.status='published'"];
   const selectedCategory=url.searchParams.get('category_id');
   if(selectedCategory){args.push(selectedCategory.slice(3));conditions.push('a.category_id=$1');}
   const where=conditions.join(' and ');
   const total=(await run<{n:number}>('anon','',`select count(*)::int n from public.articles a where ${where}`,args)).rows[0].n;
   const offset=Number(url.searchParams.get('offset')||0),limit=Math.min(50,Number(url.searchParams.get('limit')||12));
   // Simulate a lower hosted row cap too: continue until the exact count, not just a short batch.
   const tags=hasTags?",'article_tag_links',coalesce((select jsonb_agg(jsonb_build_object('article_tags',jsonb_build_object('name',t.name))) from public.article_tag_links l join public.article_tags t on t.id=l.tag_id where l.article_id=a.id),'[]'::jsonb)":'';
   const rows=(await run<{article:Record<string,unknown>}>('anon','',`select to_jsonb(a) ${hasTags?`||jsonb_build_object(${tags.slice(1)})`:''} article from public.articles a where ${where} order by a.advice_pinned desc,a.published_at desc,a.id limit ${limit} offset ${offset}`,args)).rows.map(row=>row.article);
   return Response.json(rows,{headers:{'Content-Range':`${offset}-${offset+Math.max(0,rows.length-1)}/${total}`}});
  };
  const {publicArticleList}=await import('../src/lib/articles/data');
  for(const q of ['France','france','FRANCE','  France  ']){
   const result=await publicArticleList({q});
   assert.equal(result.total,2);
   assert.deepEqual(result.articles.map(a=>a.id).sort(),[nimes.id,other.id].sort());
   assert.ok(result.articles.find(a=>a.id===nimes.id)?.tags.includes('France'));
   assert.ok(!result.articles.some(a=>a.id===draft.id||a.id===expired.id));
  }
  for(const q of ['Hidden Gems','hIdDeN gEmS',' Hidden   Gems ','NÎMES','sunlit COURTYARDS','quiet railway routes']){
   const result=await publicArticleList({q});assert.equal(result.total,1,q);assert.equal(result.articles[0].id,nimes.id,q);
  }
  assert.deepEqual((await publicArticleList({q:'All'})).articles.map(a=>a.title).sort(),['All-Inclusive holidays','What actually matters on a cruise'].sort(),'existing title substring matches still work');
  assert.deepEqual((await publicArticleList({q:'France',category})).articles.map(a=>a.id),[nimes.id]);
  assert.deepEqual((await publicArticleList({q:'France',category:otherCategory})).articles.map(a=>a.id),[other.id]);
  assert.equal((await publicArticleList({q:'Hidden Gems',category:otherCategory})).total,0);
  for(const q of ['UnpublishedSecret','PrivateTag','ExpiredSecret','ExpiredTag','%','no matching phrase'])assert.equal((await publicArticleList({q})).total,0,q);
  const first=await publicArticleList({q:'France',limit:1}),second=await publicArticleList({q:'France',limit:1,page:2});
  assert.equal(first.total,2);assert.equal(second.total,2);assert.notEqual(first.articles[0].id,second.articles[0].id);
  const cleared=await publicArticleList({q:''});assert.equal(cleared.total,207);assert.equal(cleared.articles.length,12);
  assert.equal((await publicArticleList({q:'',category:otherCategory})).total,1,'clearing search still honours a selected category');
  assert.ok(cleared.articles.every(a=>a.id!==nimes.id),'the tag match is beyond the initially loaded page');
  assert.ok(requests.some(url=>Number(url.searchParams.get('offset'))>=200),'search reaches the last fetch batch');
  const {default:Listing}=await import('../src/app/travel-advice/page');
  const page=await Listing({searchParams:Promise.resolve({q:'Hidden Gems',category})});
  assert.equal(page.props.results?.total,1);assert.equal(page.props.results?.articles[0].id,nimes.id);
 }finally{globalThis.fetch=original;keys.forEach((key,i)=>{if(old[i]===undefined)delete process.env[key];else process.env[key]=old[i];});await db.close();}
});
