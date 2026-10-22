import Image from 'next/image';
import Link from 'next/link';
import { cmsCopy, discoveryCopy as copy } from '@/content/cms';
import type { DiscoveryResults } from '@/lib/cms/discovery';
import { discoveryHref, type DiscoveryQuery } from '@/lib/cms/discovery-query';
export function ArticleDiscovery({query,results,error}:{query:DiscoveryQuery;results:DiscoveryResults|null;error?:string}) {
  const active=Boolean(query.q||query.type||query.category||query.tag||query.page>1);
  return <main id="main-content" tabIndex={-1} className="advice-index">
    <header><p className="eyebrow">Planned by Jay</p><h1>{cmsCopy.title}</h1><p>{cmsCopy.description}</p></header>
    <form key={discoveryHref(query)} action="/travel-advice" method="get" className="advice-search" aria-label="Find travel articles">
      <div className="advice-search-query"><label htmlFor="advice-q">{copy.search}</label><input id="advice-q" type="search" name="q" defaultValue={query.q} maxLength={120} aria-describedby="advice-search-hint"/><p id="advice-search-hint" className="cms-hint">{copy.searchHint}</p></div>
      <label htmlFor="advice-type">Content type<select id="advice-type" name="type" defaultValue={query.type}><option value="">{copy.allTypes}</option>{(results?.types||[]).map(type=><option key={type}>{type}</option>)}</select></label>
      <label htmlFor="advice-category">Category<select id="advice-category" name="category" defaultValue={query.category}><option value="">{copy.allCategories}</option>{query.category&&!results?.categories.some(category=>category.id===query.category)&&<option value={query.category}>Selected category (unavailable)</option>}{results?.categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label htmlFor="advice-tag">Tag or destination<select id="advice-tag" name="tag" defaultValue={query.tag}><option value="">{copy.allTags}</option>{query.tag&&!results?.tags.some(tag=>tag.id===query.tag)&&<option value={query.tag}>Selected tag (unavailable)</option>}{results?.tags.map(tag=><option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
      <div className="advice-search-actions"><button type="submit" className="button">{copy.apply}</button><Link href="/travel-advice">{copy.reset}</Link></div>
    </form>
    {error?<p role="alert">{error}</p>:results&&<>
      {results.total>0&&<p className="advice-result-count" role="status">{results.total} {results.total===1?'article':'articles'}{active?' found':''} · Page {query.page}</p>}
      {results.articles.length?<div className="advice-grid">{results.articles.map(article=><article className="advice-card" key={article.id}>
        {article.image&&<Image src={article.image.src} alt={article.featured_alt} width={article.image.width} height={article.image.height} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 400px"/>}
        <div>{article.advice_pinned&&<p className="advice-pinned">Pinned</p>}<p className="eyebrow">{results.categories.find(category=>category.id===article.category_id)?.name||article.content_type}</p>
          <h2><Link href={`/travel-advice/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p>
          <small>{article.published_at&&new Date(article.published_at).toLocaleDateString('en-GB',{timeZone:'UTC'})}</small>
          <p><Link href={`/travel-advice/${article.slug}`}>Read article <span aria-hidden="true">↗</span></Link></p>
        </div></article>)}</div>:<p>{active?copy.noResults:cmsCopy.empty}</p>}
      {(query.page>1||query.page*12<results.total)&&<nav className="advice-pagination" aria-label="Article results pages">
        {query.page>1&&<Link href={discoveryHref(query,query.page-1)}>Previous page</Link>}
        {query.page*12<results.total&&query.page<1000&&<Link href={discoveryHref(query,query.page+1)}>Next page</Link>}
      </nav>}
    </>}
  </main>;
}
