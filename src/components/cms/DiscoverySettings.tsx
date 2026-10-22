'use client';
import { useState } from 'react';
import type { Tag } from '@/lib/cms/schema';
import { discoveryCopy as copy } from '@/content/cms';
type Props={initialTags:Tag[];selected:string[];featured:boolean;pinned:boolean;
  onTags:(ids:string[])=>void;onFeatured:(value:boolean)=>void;onPinned:(value:boolean)=>void;onBusy:(value:boolean)=>void};
export function DiscoverySettings({initialTags,selected,featured,pinned,onTags,onFeatured,onPinned,onBusy}:Props) {
  const [tags,setTags]=useState(initialTags);const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  async function create() {
    setBusy(true);onBusy(true);setError('');setNotice('');
    try {
      const response=await fetch('/api/cms/tags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'The tag could not be created. Please try again.');
      const tag=data.tag as Tag;
      setTags(previous=>previous.some(item=>item.id===tag.id)?previous:[...previous,tag].sort((a,b)=>a.name.localeCompare(b.name,'en-GB')));
      if(!selected.includes(tag.id))onTags([...selected,tag.id]);
      setName('');setNotice(`Selected tag: ${tag.name}. Save the article to apply it.`);
    } catch(error) {setError(error instanceof Error?error.message:'The tag could not be created. Please try again.');}
    finally{setBusy(false);onBusy(false);}
  }
  return <details open><summary>{copy.heading}</summary>
    <fieldset id="cms-tag_ids" tabIndex={-1} className="cms-discovery-fields" disabled={busy}><legend>{copy.tags}</legend><p className="cms-hint" id="cms-tags-hint">{copy.tagHint}</p>
      <div className="cms-tag-choices" role="group" aria-describedby="cms-tags-hint">
        {tags.map(tag=><label className="cms-check" key={tag.id}><input type="checkbox" checked={selected.includes(tag.id)} disabled={selected.length>=8&&!selected.includes(tag.id)} onChange={event=>onTags(event.target.checked?[...selected,tag.id]:selected.filter(id=>id!==tag.id))}/>{tag.name}</label>)}
      </div>
      <div className="cms-field"><label htmlFor="cms-new-tag">{copy.newTag}</label><input id="cms-new-tag" value={name} onChange={event=>setName(event.target.value)} maxLength={40} aria-describedby="cms-tags-create-hint"/><p className="cms-hint" id="cms-tags-create-hint">Reuse existing tags where possible. Up to 100 reusable tags; names differing only by case or spacing use the same tag.</p></div>
      <button type="button" className="button button-secondary" onClick={()=>void create()} disabled={!name.trim()||selected.length>=8}>{busy?'Creating…':copy.createTag}</button>
      {error&&<p role="alert" className="cms-field-error">{error}</p>}{notice&&<p role="status" className="cms-hint">{notice}</p>}
      <div className="cms-placement"><label className="cms-check"><input type="checkbox" checked={featured} onChange={event=>onFeatured(event.target.checked)}/>{copy.featured}</label><p className="cms-hint">{copy.featuredHint}</p>
        <label className="cms-check"><input type="checkbox" checked={pinned} onChange={event=>onPinned(event.target.checked)}/>{copy.pinned}</label><p className="cms-hint">{copy.pinnedHint}</p>
      </div>
    </fieldset>
  </details>;
}
