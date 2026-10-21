import { pageAdmin } from '@/lib/cms/client';
import { databaseError } from '@/lib/cms/data';
export default async function Dashboard() {
  const client=await pageAdmin();const today=new Date().toISOString().slice(0,10);
  const [published,drafts,review,recent]=await Promise.all([
    client.from('content_articles').select('id',{count:'exact',head:true}).eq('status','published'),
    client.from('content_articles').select('id',{count:'exact',head:true}).eq('status','draft'),
    client.from('content_articles').select('id',{count:'exact',head:true}).lte('review_date',today).neq('status','archived'),
    client.from('content_articles').select('id,title,status,updated_at,review_date').order('updated_at',{ascending:false}).limit(8),
  ]); [published,drafts,review,recent].forEach(result=>databaseError(result.error));
  return <><div className="cms-title-row"><div><p className="eyebrow">Content portal</p><h1>Your articles</h1></div><a className="button" href="/admin/articles/new">Create new article</a></div>
    <div className="cms-stats">{[['Published',published.count],['Drafts',drafts.count],['Due for review',review.count]].map(([label,count])=><div className="cms-card" key={label}><strong>{count}</strong><span>{label}</span></div>)}</div>
    <h2>Recently updated</h2>{recent.data?.length?<ul className="cms-rows">{recent.data.map(article=><li key={article.id}><a href={`/admin/articles/${article.id}/edit`}>{article.title}</a><span>{article.status} · {new Date(article.updated_at).toLocaleDateString('en-GB',{timeZone:'UTC'})}{article.review_date && article.review_date<=today?' · Review due':''}</span></li>)}</ul>:<p>No articles yet. Create your first draft to get started.</p>}
  </>;
}
