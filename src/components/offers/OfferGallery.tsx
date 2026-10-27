"use client";
import { useEffect,useRef,useState } from "react";
import { SiteImage } from "@/components/ui/SiteImage";

type Photograph={src:string;alt:string};
export function OfferGallery({photos,sash=""}:{photos:Photograph[];sash?:string}) {
  const [active,setActive]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{
    if(active===null||!photos.length)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[active,photos.length]);
  if(!photos.length)return null;
  const current=active===null?null:photos[active];
  function move(step:number) {setActive(index=>index===null?null:(index+step+photos.length)%photos.length);}
  return <section className="offer-photos" aria-label="Holiday photographs">
    <div className={`offer-photos-grid${photos.length>1?" offer-photos-multiple":""}${photos.length===2?" offer-photos-pair":""}`}>
      {photos.slice(0,3).map((photo,index)=><button key={photo.src} type="button" className={index===0?"offer-photo-main":"offer-photo-thumb"} aria-label={`Enlarge photograph ${index+1}: ${photo.alt||"holiday photograph"}`} aria-haspopup="dialog" onClick={event=>{
        trigger.current=event.currentTarget;setActive(index);dialog.current?.showModal();
      }}>
        <SiteImage src={photo.src} alt={photo.alt} fill sizes={index===0?"(max-width:767px) 100vw,800px":"(max-width:767px) 50vw,400px"}/>
        {index===0&&sash&&<span className="offer-sash">{sash}</span>}
        {(index===0||index===2&&photos.length>3)&&<span className="offer-photo-label">{index===2?`View all ${photos.length} photographs`:"Enlarge photograph"}</span>}
      </button>)}
    </div>
    <dialog ref={dialog} className="offer-photo-dialog" aria-label="Enlarged holiday photographs" onClose={()=>{setActive(null);trigger.current?.focus();}} onKeyDown={event=>{
      if(photos.length>1&&(event.key==="ArrowLeft"||event.key==="ArrowRight")){event.preventDefault();move(event.key==="ArrowLeft"?-1:1);}
    }}>
      <button className="button button-secondary offer-photo-close" type="button" onClick={()=>dialog.current?.close()}>Close photographs</button>
      {current&&<figure><div className="offer-photo-enlarged"><SiteImage src={current.src} alt={current.alt} fill sizes="95vw" style={{objectFit:"contain"}}/></div><figcaption aria-live="polite">Photograph {(active??0)+1} of {photos.length}{current.alt?` · ${current.alt}`:""}</figcaption></figure>}
      {photos.length>1&&<div className="offer-photo-controls"><button className="button button-secondary" type="button" onClick={()=>move(-1)}>Previous photograph</button><button className="button button-secondary" type="button" onClick={()=>move(1)}>Next photograph</button></div>}
    </dialog>
  </section>;
}
