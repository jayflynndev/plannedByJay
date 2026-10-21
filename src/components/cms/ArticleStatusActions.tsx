'use client';
import { useState } from 'react';
export function ArticleStatusActions({id,status}:{id:string;status:string}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function change(next:string) {
    if(!window.confirm(next==='published'?'Publish this saved article?':next==='draft'?'Unpublish this article and keep it as a private draft?':'Archive this article privately?'))return;
    setBusy(true);setError('');try{const result=await fetch('/api/cms/articles/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:next})});const data=await result.json();if(!result.ok)throw new Error(data.error);window.location.reload();}
    catch(error){setError(error instanceof Error?error.message:'The status could not be changed.');setBusy(false);}
  }
  return <div><div className="cms-actions">{status!=='published'&&<button type="button" className="cms-text-button" disabled={busy} onClick={()=>change('published')}>Publish</button>}{status==='published'&&<button type="button" className="cms-text-button" disabled={busy} onClick={()=>change('draft')}>Unpublish</button>}{status!=='archived'&&<button type="button" className="cms-text-button" disabled={busy} onClick={()=>change('archived')}>Archive</button>}</div>{error&&<p className="cms-field-error" role="alert">{error}</p>}</div>;
}
