'use client';
import { useState } from 'react';
import type { Category } from '@/lib/cms/schema';
export function CategoryManager({initial}:{initial:Category[]}) {
  const [cats,setCats]=useState(initial);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>,id?:string) {
    event.preventDefault();const form=event.currentTarget;setBusy(true);setMessage('');
    try{const result=await fetch('/api/cms/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:new FormData(form).get('name')})});const data=await result.json();if(!result.ok)throw new Error(data.error);setCats(values=>id?values.map(value=>value.id===id?data.category:value):[...values,data.category]);setFailed(false);setMessage('Category saved.');if(!id)form.reset();}
    catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Category could not be saved.');}finally{setBusy(false);}
  }
  return <><p>Categories group related articles. Rename a category here; articles keep their category. Content types are configured separately in src/content/cms.ts.</p>
    {message&&<p role={failed?'alert':'status'} className={failed?'cms-error':'cms-notice'}>{message}</p>}
    <form className="cms-upload" onSubmit={event=>submit(event)}><label>New category<input name="name" required maxLength={80}/></label><button className="button" disabled={busy}>Add category</button></form>
    {cats.map(cat=><form className="cms-upload" key={cat.id} onSubmit={event=>submit(event,cat.id)}><label>Category name<input name="name" required defaultValue={cat.name} maxLength={80}/></label><button className="button button-secondary" disabled={busy}>Rename</button></form>)}
  </>;
}
