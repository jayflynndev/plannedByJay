import { pageAdmin } from '@/lib/cms/client';
import { categories, databaseError } from '@/lib/cms/data';
import { articleStatuses } from '@/content/cms';
import { ArticleStatusActions } from '@/components/cms/ArticleStatusActions';
export default async function Articles({searchParams}:{searchParams:Promise<{q?:string;status?:string;category?:string;sort?:string;page?:string}>}) {
  const params=await searchParams;const client=await pageAdmin();const cats=await categories(client);
  const page=Math.max(1,Math.min(10000,Number(params.page)||1));
  let query=client.from('content_articles').select('id,title,status,slug,updated_at,category_id',{count:'exact'}).order('updated_at',{ascending:params.sort==='oldest'}).range((page-1)*30,page*30-1);
  if(params.q) query=query.ilike('title',`%${params.q.slice(0,180).replace(/[%_\\]/g,'')}%`);
  if(articleStatuses.includes(params.status as typeof articleStatuses[number])) query=query.eq('status',params.status!);
  if(cats.some(cat=>cat.id===params.category))query=query.eq('category_id',params.category!);
  const result=await query;databaseError(result.error);
  function pageLink(next:number) {const values=new URLSearchParams();for(const key of ['q','status','category','sort'] as const)if(params[key])values.set(key,params[key]!);values.set('page',String(next));return `/admin/articles?${values}`;}
  return <><div className="cms-title-row"><h1>Articles</h1><a className="button" href="/admin/articles/new">Create new article</a></div>
    <form className="cms-filter"><label>Search titles<input name="q" defaultValue={params.q} maxLength={180}/></label><label>Status<select name="status" defaultValue={params.status||''}><option value="">All statuses</option>{articleStatuses.map(status=><option key={status}>{status}</option>)}</select></label>
      <label>Category<select name="category" defaultValue={params.category||''}><option value="">All categories</option>{cats.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
      <label>Sort<select name="sort" defaultValue={params.sort||'newest'}><option value="newest">Latest updates first</option><option value="oldest">Oldest updates first</option></select></label><button className="button">Apply filters</button></form>
    {result.data?.length?<ul className="cms-rows">{result.data.map(article=><li key={article.id}><div><a href={`/admin/articles/${article.id}/edit`}>{article.title}</a><p>{article.status} · {cats.find(cat=>cat.id===article.category_id)?.name||'Uncategorised'} · {new Date(article.updated_at).toLocaleDateString('en-GB',{timeZone:'UTC'})}</p></div><div><div className="cms-actions"><a href={`/admin/articles/${article.id}/edit`}>Edit</a><a href={`/admin/articles/${article.id}/preview`}>Preview</a>{article.status==='published' && <a href={`/travel-advice/${article.slug}`}>View live</a>}</div><ArticleStatusActions id={article.id} status={article.status}/></div></li>)}</ul>:<p>No matching articles. Try another filter or create a new draft.</p>}
    <nav className="cms-actions" aria-label="Article pages">{page>1&&<a href={pageLink(page-1)}>Previous</a>}<span>Page {page} · {result.count} articles</span>{page*30<(result.count||0)&&<a href={pageLink(page+1)}>Next</a>}</nav>
  </>;
}
