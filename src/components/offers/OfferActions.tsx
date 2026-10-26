"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
export function OfferActions({offer}:{offer:{id:string;title:string;version:number;status:string;archived:boolean}}) {
  const router=useRouter(),working=useRef(false);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
  async function act(action:"unpublish"|"archive"|"restore"|"duplicate") {
    if(working.current)return;
    const prompt=action==="duplicate"?"Create a new draft copy of this offer?":action==="archive"?"Archive this offer? Public listings will hide it and saved enquiries will be retained.":action==="restore"?"Restore this offer as a draft?":"Unpublish this offer and return it to drafts?";
    if(!window.confirm(prompt))return;
    working.current=true;setBusy(true);setFailed(false);setMessage("Updating offer...");
    try {
      const r=await fetch("/api/offers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:offer.id,version:offer.version,action})});const d=await r.json();if(!r.ok)throw new Error(d.error||"The offer could not be updated.");
      setMessage(action==="duplicate"?"Draft copy created.":action==="archive"?"Offer archived.":action==="restore"?"Offer restored to drafts.":"Offer unpublished and returned to drafts.");
      if(d.offer)router.push(`/admin/holiday-offers/${d.offer.id}/edit`);router.refresh();
    }catch(e){setFailed(true);setMessage(e instanceof Error?e.message:"The request failed.");}
    finally{working.current=false;setBusy(false);}
  }
  return <><div className="article-admin-actions"><a href={`/admin/holiday-offers/${offer.id}/edit`}>Edit</a><button disabled={busy} type="button" onClick={()=>void act("duplicate")}>Duplicate offer</button>{offer.status==="published"&&!offer.archived&&<button disabled={busy} type="button" onClick={()=>void act("unpublish")}>Unpublish</button>}<button disabled={busy} type="button" onClick={()=>void act(offer.archived?"restore":"archive")}>{offer.archived?"Restore":"Archive"}</button></div><div aria-live="polite">{message&&<p role={failed?"alert":"status"}>{message}</p>}</div></>;
}
