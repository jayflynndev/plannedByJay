'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import type { Media } from '@/lib/cms/schema';
import { imageUrl } from '@/lib/cms/urls';
export function MediaLibrary({initialMedia,mediaBase,onSelect,onUploaded,allowDelete=false,selectedId=''}:{initialMedia:Media[];mediaBase:string;onSelect?:(media:Media)=>void;onUploaded?:(media:Media)=>void;allowDelete?:boolean;selectedId?:string}) {
  const [media,setMedia]=useState(initialMedia);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const input=useRef<HTMLInputElement>(null);
  async function upload() {
    const file=input.current?.files?.[0];if(!file)return;setBusy(true);setError('');setNotice('');
    try {const form=new FormData();form.set('file',file);const result=await fetch('/api/cms/media',{method:'POST',body:form});const data=await result.json();if(!result.ok)throw new Error(data.error);
      setMedia(list=>list.some(item=>item.id===data.media.id)?list:[data.media,...list]);onUploaded?.(data.media);setNotice(data.duplicate?'This photograph is already in your library.':'Photograph uploaded.');if(input.current)input.current.value='';
    } catch(error){setError(error instanceof Error?error.message:'The upload failed. Please try again.');}finally{setBusy(false);}
  }
  async function remove(item:Media) {
    if(!window.confirm(`Remove “${item.original_name}”? Images used in articles cannot be removed.`))return;
    setBusy(true);setError('');setNotice('');
    try {const result=await fetch('/api/cms/media',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})});const data=await result.json();if(!result.ok)throw new Error(data.error);setMedia(list=>list.filter(value=>value.id!==item.id));setNotice('Unused photograph removed.');}
    catch(error){setError(error instanceof Error?error.message:'The image could not be removed.');}finally{setBusy(false);}
  }
  return <section className="cms-media"><h2>Image library</h2><p>JPEG, PNG or WebP, up to 5 MB. Landscape photographs work well for featured images. Images are resized to at most 2,400 pixels and location metadata is removed.</p>
    <div className="cms-upload"><label>Choose a photograph<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}/></label><button type="button" className="button" onClick={upload} disabled={busy}>{busy?'Please wait…':'Upload photograph'}</button></div>
    {error&&<p role="alert" className="cms-error">{error}</p>}{notice&&<p role="status" className="cms-notice">{notice}</p>}
    <div className="cms-media-grid">{media.map(item=><div className={`cms-card ${selectedId===item.id?'cms-media-selected':''}`} key={item.id}><Image src={imageUrl(mediaBase,item.storage_path)} alt="" width={item.width} height={item.height} sizes="(max-width: 600px) 100vw, 300px"/>
      <p>{item.original_name}</p><small>{item.width} × {item.height} · {Math.round(item.bytes/1024)} KB</small><div className="cms-actions">
        {onSelect&&<button type="button" className="button button-secondary" disabled={busy} aria-pressed={selectedId===item.id} onClick={()=>onSelect(item)}>{selectedId===item.id?'Selected image':'Use image'}</button>}
        <button type="button" className="cms-text-button" onClick={async()=>{try{await navigator.clipboard.writeText(imageUrl(mediaBase,item.storage_path));setNotice('Image link copied. Paste it into Markdown with descriptive alt text.');}catch{setError('Copy is unavailable. Open the image link and copy its address.');}}}>Copy image link</button>
        <a href={imageUrl(mediaBase,item.storage_path)} target="_blank" rel="noopener noreferrer">Open image</a>{allowDelete&&<button type="button" className="cms-text-button" disabled={busy} onClick={()=>remove(item)}>Remove</button>}
      </div></div>)}</div>{!media.length&&<p>Your uploaded photographs will appear here.</p>}
  </section>;
}
