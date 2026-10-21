'use client';
import { useEffect, useRef, useState } from 'react';
import type { ArticleInput, Category, Media } from '@/lib/cms/schema';
import { slugify } from '@/lib/cms/schema';
import { contentTypes } from '@/content/cms';
import { ArticleView } from './ArticleView';
import { MediaLibrary } from './MediaLibrary';
type Errors=Record<string,string[]>;
export function ArticleEditor({initial,categories,initialMedia,mediaBase,siteOrigin}:{initial:ArticleInput;categories:Category[];initialMedia:Media[];mediaBase:string;siteOrigin:string}) {
  const [value,setValue]=useState(initial);const [saved,setSaved]=useState(JSON.stringify(initial));
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [errors,setErrors]=useState<Errors>({});
  const [failed,setFailed]=useState(false);const [mode,setMode]=useState<'edit'|'preview'>('edit');const [width,setWidth]=useState<'desktop'|'mobile'>('desktop');
  const [selected,setSelected]=useState(initialMedia.find(image=>image.id===initial.featured_media_id)||null);
  const [availableMedia,setAvailableMedia]=useState(initialMedia);
  const [library,setLibrary]=useState(false);const [slugTouched,setSlugTouched]=useState(Boolean(initial.id));
  const dirty=JSON.stringify(value)!==saved;const summary=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    // Portal navigation uses ordinary anchors, so browser navigation/closing tabs
    // shares the native unsaved-work warning rather than bypassing it through an SPA.
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  function change<K extends keyof ArticleInput>(key:K,next:ArticleInput[K]) {
    setValue(previous=>({...previous,[key]:next,...(key==='title'&&!slugTouched?{slug:slugify(String(next))}:{})}));
    setErrors(previous=>{const nextErrors={...previous};delete nextErrors[key];return nextErrors;});setMessage('');
  }
  async function save(status:ArticleInput['status']) {
    if(status==='published' && value.status!=='published' && !window.confirm('Publish this article on the public website?'))return;
    setBusy(true);setMessage('');setErrors({});
    try {
      const result=await fetch('/api/cms/articles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...value,status})});
      const data=await result.json();if(!result.ok){setErrors(data.fields||{});throw new Error(data.error);}
      const next={...value,...data.article,research_date:data.article.research_date||'',fact_checked_date:data.article.fact_checked_date||'',review_date:data.article.review_date||''};
      // Keep only canonical editor fields: server timestamps are not writable input.
      const updated={...value};for(const key of Object.keys(value) as (keyof ArticleInput)[])Object.assign(updated,{[key]:next[key]});
      setValue(updated);setSaved(JSON.stringify(updated));setFailed(false);setSlugTouched(true);
      window.history.replaceState(null,'',`/admin/articles/${updated.id}/edit`);
      setMessage(status==='published'?'Article saved and published.':status==='archived'?'Article archived privately.':'Draft saved. This article is not public.');
    } catch(error) {setFailed(true);setMessage(error instanceof Error?error.message:'The article could not be saved. Please try again.');requestAnimationFrame(()=>summary.current?.focus());}
    finally {setBusy(false);}
  }
  function field<K extends keyof ArticleInput>(key:K,label:string,options:{area?:boolean;type?:string;hint?:string;max?:number}={}) {
    const common={id:`cms-${key}`,value:String(value[key]??''),onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{if(key==='slug')setSlugTouched(true);change(key,event.target.value as ArticleInput[K]);},'aria-invalid':Boolean(errors[key]),'aria-describedby':`${errors[key]?`cms-error-${key} `:''}${options.hint?`cms-hint-${key}`:''}`.trim()||undefined,maxLength:options.max};
    return <div className="cms-field"><label htmlFor={`cms-${key}`}>{label}</label>{options.area?<textarea {...common} rows={key==='body'?20:4}/>:<input {...common} type={options.type||'text'}/>}
      {options.hint&&<p className="cms-hint" id={`cms-hint-${key}`}>{options.hint}</p>}{errors[key]&&<p className="cms-field-error" id={`cms-error-${key}`}>{errors[key].join(' ')}</p>}
    </div>;
  }
  return <><div className="cms-title-row"><div><p className="eyebrow">{value.status} · {dirty?'Unsaved changes':'Saved'}</p><h1>{value.id?'Edit article':'Create an article'}</h1></div><a href="/admin/articles">All articles</a></div>
    <div className="cms-actions cms-editor-tabs"><button type="button" className="button button-secondary" aria-pressed={mode==='edit'} onClick={()=>setMode('edit')}>Edit Markdown</button><button type="button" className="button button-secondary" aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}>Preview article</button></div>
    {message&&<div ref={summary} tabIndex={-1} role={failed?'alert':'status'} className={failed?'cms-error':'cms-notice'}><p>{message}</p>{Object.keys(errors).length>0&&<ul>{Object.entries(errors).map(([key,messages])=><li key={key}><button type="button" className="cms-text-button" onClick={()=>{setMode('edit');requestAnimationFrame(()=>document.getElementById(`cms-${key}`)?.focus());}}>{key.replaceAll('_',' ')}: {messages.join(' ')}</button></li>)}</ul>}</div>}
    <fieldset disabled={busy} hidden={mode!=='edit'} className="cms-editor-grid" aria-label="Article editor"><section className="cms-stack" aria-label="Article content">
      {field('title','Article title',{max:180})}{field('slug','URL slug',{max:140,hint:`Public address: ${siteOrigin}/travel-advice/${value.slug||'your-article'}`})}
      <div className="cms-two-columns"><label>Content type<select id="cms-content_type" value={value.content_type} onChange={event=>change('content_type',event.target.value as ArticleInput['content_type'])}>{contentTypes.map(type=><option key={type}>{type}</option>)}</select></label><label>Category<select id="cms-category_id" value={value.category_id||''} onChange={event=>change('category_id',event.target.value||null)}><option value="">Uncategorised</option>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label></div>
      {field('excerpt','Short description',{area:true,max:500})}
      {field('body','Article body (Markdown)',{area:true,max:200000,hint:'Paste your prepared Markdown here. Formatting is preserved. Use Preview article to see the result.'})}
      <details><summary>Markdown formatting guide</summary><p># Heading · **bold** · *italic* · - list item · 1. numbered item · &gt; quotation</p><p>Links: [link text](https://example.com). Images: ![describe the photograph](image link copied from the image library). Tables use | columns | and a | --- | separator row.</p><p>HTML and scripts are ignored. Only images uploaded to this editorial image library are displayed.</p></details>
      <details open><summary>Featured photograph</summary>{selected&&<p>Selected: {selected.original_name} ({selected.width} × {selected.height})</p>}
        <div className="cms-actions"><button type="button" className="button button-secondary" onClick={()=>setLibrary(!library)}>{library?'Close image library':'Choose or upload image'}</button>{selected&&<button type="button" className="cms-text-button" onClick={()=>{setSelected(null);change('featured_media_id',null);}}>Remove featured image</button>}</div>
        {field('featured_alt','Describe the featured photograph',{max:300,hint:'Describe the visible scene for readers who cannot see the image. This description is specific to this article.'})}
        {library&&<MediaLibrary initialMedia={availableMedia} mediaBase={mediaBase} onUploaded={media=>setAvailableMedia(list=>list.some(item=>item.id===media.id)?list:[media,...list])} onSelect={media=>{setSelected(media);change('featured_media_id',media.id);setLibrary(false);}}/>}
      </details>
    </section><section className="cms-stack" aria-label="Article details">
      <details open><summary>Search & sharing</summary>{field('seo_title','SEO page title',{max:180,hint:'Leave blank to use the article title.'})}{field('seo_description','Meta description',{area:true,max:500,hint:'Leave blank to use the short description.'})}
        {field('canonical_url','Canonical URL (optional)',{type:'url',hint:'Usually leave blank. Use only for a genuine original article published elsewhere; HTTPS required.'})}
        <div className="cms-search-preview"><small>{siteOrigin}/travel-advice/{value.slug}</small><h3>{value.seo_title||value.title||'Article title'}</h3><p>{value.seo_description||value.excerpt}</p></div>
      </details>
      <details open><summary>Editorial information</summary>{field('author','Author display name',{max:120})}{field('research_date','Research date',{type:'date'})}{field('fact_checked_date','Last fact-check date',{type:'date'})}{field('review_date','Next recommended review',{type:'date'})}
        {field('sources','Research sources (private)',{area:true,max:30000})}{field('notes','Editorial notes (private)',{area:true,max:30000})}<p className="cms-hint">Sources and notes are saved privately and never included in public article data.</p>
      </details>
      <section className="cms-card"><h2>Publication</h2><p>Current status: <strong>{value.status}</strong></p><p>Save draft removes an article from the public website. Publish is always an explicit choice.</p>
        <div className="cms-stack"><button type="button" className="button button-secondary" disabled={busy} onClick={()=>save('draft')}>{busy?'Saving…':value.status==='published'?'Unpublish & save draft':'Save draft'}</button>
          <button type="button" className="button" disabled={busy} onClick={()=>save('published')}>{value.status==='published'?'Save published changes':'Publish article'}</button>
          <button type="button" className="cms-text-button" disabled={busy} onClick={()=>{if(window.confirm('Archive this article privately and remove it from the public website?'))void save('archived');}}>Archive article</button>
        </div>{value.id&&<p><a href={`/admin/articles/${value.id}/preview`}>Open saved preview</a> (save changes first)</p>}{value.status==='published'&&<p><a href={`/travel-advice/${value.slug}`}>View live article</a></p>}
      </section>
    </section></fieldset>
    {mode==='preview'&&<section aria-label="Live article preview"><div className="cms-actions"><button type="button" className="button button-secondary" aria-pressed={width==='desktop'} onClick={()=>setWidth('desktop')}>Desktop</button><button type="button" className="button button-secondary" aria-pressed={width==='mobile'} onClick={()=>setWidth('mobile')}>Mobile</button><button type="button" className="button" disabled={busy} onClick={()=>save(value.status==='published'?'published':'draft')}>Save {value.status==='published'?'published changes':'draft'}</button></div>
      <p className="cms-hint">Live preview includes unsaved changes. This preview is private.</p><div className={`cms-preview ${width==='mobile'?'cms-preview-mobile':''}`}><ArticleView article={value} media={selected} mediaBase={mediaBase} category={categories.find(cat=>cat.id===value.category_id)?.name}/></div>
    </section>}
  </>;
}
