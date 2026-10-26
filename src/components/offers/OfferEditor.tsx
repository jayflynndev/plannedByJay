"use client";
import Image from "next/image";
import { useEffect,useRef,useState } from "react";
import { VisualEditor } from "@/components/articles/VisualEditor";
import { ImageSelector } from "@/components/articles/ImageSelector";
import { OfferDetail } from "./OfferViews";
import { emptyOffer,offerInput,offerSlug,duration,ukToday,money,averagePrice,travelLabels,sashLabels,type Offer,type OfferInput,type PublicOffer,type PublicSupplier } from "@/lib/offers/schema";
export function OfferEditor({initial,suppliers,holidayTypes,initialImageUrl="",galleryUrls={},publicBaseUrl}:{initial?:Offer;suppliers:(PublicSupplier&{status:string;archived:boolean})[];holidayTypes:{id:string;name:string}[];initialImageUrl?:string;galleryUrls?:Record<string,string>;publicBaseUrl:string}) {
  const [value,setValue]=useState<OfferInput>(()=>initial?{...offerInput.parse(Object.fromEntries(Object.keys(emptyOffer()).map(k=>[k,initial[k as keyof OfferInput]]))),status:initial.archived?"draft":initial.status}:emptyOffer());
  const [saved,setSaved]=useState(initial),[baseline,setBaseline]=useState(()=>JSON.stringify(value));
  const [price,setPrice]=useState(()=>value.total_price_minor===null?"":(value.total_price_minor/100).toFixed(2));
  const [ages,setAges]=useState(()=>value.child_ages.join(", "));
  const [busy,setBusy]=useState(""),[message,setMessage]=useState(""),[failed,setFailed]=useState(false),[publicLink,setPublicLink]=useState("");
  const [photos,setPhotos]=useState<""|"featured"|"gallery">(""),[photoUrl,setPhotoUrl]=useState(initialImageUrl),[photoUrls,setPhotoUrls]=useState(galleryUrls);
  const [preview,setPreview]=useState<PublicOffer|null>(null);
  const working=useRef(false),slugEdited=useRef(!!initial?.slug),dirty=JSON.stringify(value)!==baseline;
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  function change<K extends keyof OfferInput>(key:K,next:OfferInput[K]) {
    setValue(v=>({...v,[key]:next,...(key==="title"&&!saved?.published_at&&!slugEdited.current?{slug:offerSlug(String(next))}:{})}));setMessage("");setPublicLink("");
  }
  function dateChange(key:"departure_date"|"return_date",date:string) {
    setValue(v=>{const next={...v,[key]:date};if(next.departure_date&&next.return_date)next.nights=duration(next.departure_date,next.return_date);return next;});setMessage("");
  }
  async function save(status:OfferInput["status"],isPreview=false) {
    if(working.current)return;
    if(!isPreview&&status==="draft"&&saved?.status==="published"&&!window.confirm("Unpublish this offer and return it to drafts?"))return;
    working.current=true;setBusy(isPreview?"Preparing private preview...":"Saving offer...");setMessage("");setFailed(false);setPublicLink("");
    try {
      if(price&&!/^\d+(?:\.\d{1,2})?$/.test(price))throw new Error("Enter the total party price with at most two decimal places.");
      if(ages.trim()&&ages.split(",").some(a=>!/^\d{1,2}$/.test(a.trim())))throw new Error("Enter child ages as whole numbers separated by commas, or leave blank if they do not affect this price.");
      const minor=price?Math.round(Number(price)*100):null;
      const childAges=ages.trim()?ages.split(",").map(a=>Number(a.trim())):[];
      const payload={...value,total_price_minor:minor,child_ages:childAges,status:isPreview?"draft":status};
      const r=await fetch(isPreview?"/api/offers/preview":"/api/offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await r.json();if(!r.ok)throw new Error(data.error||"The request failed. Your edits are retained.");
      if(isPreview){setPreview(data.offer);setMessage("Private preview ready. Nothing was saved or published.");}
      else {
        const next=offerInput.parse(Object.fromEntries(Object.keys(emptyOffer()).map(k=>[k,data.offer[k]])));
        setValue(next);setSaved(data.offer);setBaseline(JSON.stringify(next));setPrice(next.total_price_minor===null?"":(next.total_price_minor/100).toFixed(2));setAges(next.child_ages.join(", "));slugEdited.current=true;
        window.history.replaceState(null,"",`/admin/holiday-offers/${next.id}/edit`);
        setMessage(status==="published"?(saved?.status==="published"?"Offer changes saved successfully.":"Offer published successfully."):(saved?.status==="published"?"Offer unpublished and returned to drafts.":"Offer draft saved successfully."));
        if(status==="published")setPublicLink(new URL("/holiday-offers/"+next.slug,publicBaseUrl).href);
      }
    }catch(e){setFailed(true);setMessage(e instanceof Error?e.message:"The request failed. Your edits are retained.");}
    finally{working.current=false;setBusy("");}
  }
  const input=(label:string,key:"title"|"country"|"resort"|"accommodation"|"departure_point"|"board_basis"|"room_type"|"featured_alt",max:number)=><label>{label}<input value={value[key]} maxLength={max} onChange={e=>change(key,e.target.value)}/></label>;
  const text=(label:string,key:"summary"|"why_jay"|"inclusions"|"exclusions"|"mandatory_charges"|"protection_note",max:number)=><label>{label}<textarea rows={3} value={value[key]} maxLength={max} onChange={e=>change(key,e.target.value)}/></label>;
  const supplier=suppliers.find(s=>s.id===value.supplier_id);
  return <>
    <div className="article-admin-heading"><h1>{value.id?"Edit Holiday Offer":"Add Holiday Offer"}</h1><a href="/admin/holiday-offers">All Holiday Offers</a></div>
    <p>{dirty?"Unsaved changes":saved?"Saved":"Not saved yet"}{saved?" · "+saved.reference:""}</p>
    {saved?.archived&&<p>Archived. Restore this offer from All Holiday Offers before publishing.</p>}
    <fieldset disabled={!!busy} className="article-admin-form">
      <section className="offer-editor-section"><h2>A. Holiday</h2>
        <label>Supplier<select value={value.supplier_id||""} onChange={e=>change("supplier_id",e.target.value||null)}><option value="">Choose an Approved supplier</option>{suppliers.map(s=><option key={s.id} value={s.id} disabled={s.status!=="approved"||s.archived}>{s.name}{s.status!=="approved"||s.archived?" (unavailable)":""}</option>)}</select></label>
        <p>{supplier?<a href={`/admin/suppliers/${supplier.id}/edit`}>Edit supplier details</a>:<a href="/admin/suppliers">Open Suppliers</a>} · Supplier identity, contacts and booking conditions are reused automatically.</p>
        {input("Holiday title","title",180)}{input("Destination country","country",100)}{input("Resort / area","resort",160)}{input("Hotel, resort or cruise ship","accommodation",200)}
        {text("Short description","summary",500)}{text("Why Jay picked it (optional)","why_jay",500)}
        <details><summary>Offer URL</summary><label>URL slug<input value={value.slug} maxLength={60} readOnly={!!saved?.published_at} onChange={e=>{slugEdited.current=true;change("slug",e.target.value);}}/></label><p>{saved?.published_at?"This published URL is permanent, including after unpublishing.":"A short URL is suggested from the title. Change it before first publication if needed."}</p></details>
        <h3>Holiday description / highlights (optional)</h3><VisualEditor value={value.body} label="Holiday description" disabled={!!busy} onChange={body=>change("body",body)}/>
      </section>
      <section className="offer-editor-section"><h2>B. Travel details</h2>
        <label>Travel arrangement<select value={value.travel_type} onChange={e=>{change("travel_type",e.target.value as OfferInput["travel_type"]);if(e.target.value==="hotel-only"){change("departure_point","");change("flights_included",false);change("protection","");}}}>{Object.entries(travelLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        {value.travel_type!=="hotel-only"&&<>{input("Departure airport, port or station","departure_point",160)}<label className="offer-editor-check"><input type="checkbox" checked={value.flights_included} onChange={e=>change("flights_included",e.target.checked)}/>Flights included</label></>}
        <label>Departure date<input type="date" value={value.departure_date} onChange={e=>dateChange("departure_date",e.target.value)}/></label><label>Return date (optional)<input type="date" value={value.return_date} onChange={e=>dateChange("return_date",e.target.value)}/></label>
        <label>Number of nights<input type="number" min={0} max={730} readOnly={!!(value.departure_date&&value.return_date)} value={value.nights??""} onChange={e=>change("nights",e.target.value===""?null:Number(e.target.value))}/></label><p>Nights are calculated automatically when both dates are entered.</p>
        {input("Board basis / cruise fare","board_basis",120)}{input("Room / cabin type (optional)","room_type",160)}
        <label>Adults<input type="number" min={0} max={50} value={value.adults} onChange={e=>change("adults",Number(e.target.value))}/></label><label>Children<input type="number" min={0} max={20} value={value.children} onChange={e=>{change("children",Number(e.target.value));if(!Number(e.target.value)){setAges("");change("child_ages",[]);}}}/></label>
        {value.children>0&&<label>Child ages where required for this price (comma-separated)<input value={ages} onChange={e=>{setAges(e.target.value);change("child_ages",e.target.value.trim()?e.target.value.split(",").map(Number):[]);}}/></label>}
        {text("What's included","inclusions",5000)}{text("Important exclusions / conditions (optional)","exclusions",5000)}
      </section>
      <section className="offer-editor-section"><h2>C. Price</h2>
        <label>Total advertised price for the stated party<input inputMode="decimal" value={price} onChange={e=>{setPrice(e.target.value);change("total_price_minor",e.target.value&&/^\d+(?:\.\d{0,2})?$/.test(e.target.value)?Math.round(Number(e.target.value)*100):null);}}/></label>
        <label>Currency<select value={value.currency} onChange={e=>change("currency",e.target.value as OfferInput["currency"])}>{["GBP","EUR","USD"].map(c=><option key={c}>{c}</option>)}</select></label>
        <label className="offer-editor-check"><input type="checkbox" checked={value.show_per_person} disabled={value.children>0} onChange={e=>change("show_per_person",e.target.checked)}/>Show average per adult, when the party has no children and divides evenly</label>{averagePrice(value)&&<p>{money(averagePrice(value),value.currency)} average per adult</p>}
        <label>Price-check date<input type="date" value={value.price_checked_on} max={ukToday()} onChange={e=>change("price_checked_on",e.target.value)}/></label><button type="button" onClick={()=>change("price_checked_on",ukToday())}>Confirm price checked today</button>
        <label>Supplier booking deadline / promotion expiry (optional)<input type="date" value={value.booking_deadline} onChange={e=>change("booking_deadline",e.target.value)}/></label>
        {text("Mandatory charges / local taxes (if any)","mandatory_charges",2000)}<p>Include all known mandatory charges in the total. Explain any charge that cannot reasonably be calculated, how it is calculated and when it is payable. This text appears beside the price. Prices are shown with the check date and reconfirmed when customers enquire.</p>
        <label>Financial protection for this offer<select value={value.protection} onChange={e=>change("protection",e.target.value as OfferInput["protection"])}><option value="">No protection claim</option>{value.flights_included&&<option value="supplier-atol">Supplier ATOL applies to these arrangements (confirmed)</option>}<option value="other">Other confirmed arrangements</option></select></label>
        {value.protection&&text("Confirmed protection details for this offer","protection_note",2000)}
      </section>
      <section className="offer-editor-section"><h2>D. Presentation</h2>
        {photoUrl&&<Image src={photoUrl} alt={value.featured_alt} width={320} height={220}/>}
        <div className="article-admin-actions"><button type="button" onClick={()=>setPhotos("featured")}>Choose or upload featured photograph</button>{value.featured_image&&<button type="button" onClick={()=>{change("featured_image","");setPhotoUrl("");}}>Remove featured photograph</button>}</div>
        {input("Featured image description","featured_alt",300)}
        {value.gallery.map((i,index)=><div key={i.path} className="offer-gallery-choice">{photoUrls[i.path]&&<Image src={photoUrls[i.path]} alt={i.alt} width={160} height={100}/>}<label>Additional photograph description {index+1}<input value={i.alt} maxLength={300} onChange={e=>change("gallery",value.gallery.map((g,n)=>n===index?{...g,alt:e.target.value}:g))}/></label><button type="button" onClick={()=>change("gallery",value.gallery.filter(g=>g.path!==i.path))}>Remove additional photograph {index+1}</button></div>)}
        <button type="button" disabled={value.gallery.length>=8} onClick={()=>setPhotos("gallery")}>Add additional photograph</button>
        {photos&&<ImageSelector onClose={()=>setPhotos("")} onSelect={i=>{if(photos==="featured"){change("featured_image",i.path);change("featured_alt",i.alt||value.title);setPhotoUrl(i.url);}else if(!value.gallery.some(g=>g.path===i.path)){change("gallery",[...value.gallery,{path:i.path,alt:i.alt}]);setPhotoUrls(v=>({...v,[i.path]:i.url}));}setPhotos("");}}/>}
        <fieldset><legend>Holiday Types</legend>{holidayTypes.map(t=><label className="offer-editor-check" key={t.id}><input type="checkbox" checked={value.holiday_type_ids.includes(t.id)} onChange={e=>change("holiday_type_ids",e.target.checked?[...value.holiday_type_ids,t.id]:value.holiday_type_ids.filter(id=>id!==t.id))}/>{t.name}</label>)}
          {value.holiday_type_ids.some(id=>!holidayTypes.some(t=>t.id===id))&&<p>An associated type is no longer published. <button type="button" onClick={()=>change("holiday_type_ids",value.holiday_type_ids.filter(id=>holidayTypes.some(t=>t.id===id)))}>Remove unavailable selections</button></p>}
        </fieldset>
        <label>Promotional sash<select value={value.sash} onChange={e=>change("sash",e.target.value as OfferInput["sash"])}>{Object.entries(sashLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><p>Leaving Soon displays only within 30 days of departure.</p>
        {value.sash==="adults-only"&&<label className="offer-editor-check"><input type="checkbox" checked={value.adults_only_confirmed} onChange={e=>change("adults_only_confirmed",e.target.checked)}/>Adults-only arrangements confirmed</label>}
        <label className="offer-editor-check"><input type="checkbox" checked={value.featured} onChange={e=>change("featured",e.target.checked)}/>Featured on Homepage</label>
      </section>
      <section className="offer-editor-section"><h2>E. Publishing</h2><div className="article-admin-actions">
        {value.status==="draft"&&<button type="button" className="button button-secondary" onClick={()=>void save("draft")}>Save Draft</button>}
        <button type="button" className="button button-secondary" onClick={()=>void save(value.status,true)}>Preview</button><button type="button" className="button" disabled={saved?.archived} onClick={()=>void save("published")}>{value.status==="published"?"Save Changes":"Publish"}</button>
        {value.status==="published"&&<button type="button" className="button button-secondary" onClick={()=>void save("draft")}>Unpublish</button>}
      </div><div aria-live={failed?"assertive":"polite"} aria-atomic="true">{(busy||message)&&<p role={failed?"alert":"status"} className={failed?"article-admin-error":"article-admin-notice"}>{busy||message}</p>}{publicLink&&<a href={publicLink}>View Holiday</a>}</div><p>Save regularly; no background autosave. Preview does not publish. Expired promotions and departed offers are hidden automatically.</p></section>
    </fieldset>
    {preview&&<section className="article-private-preview" aria-label="Private holiday offer preview"><button type="button" onClick={()=>setPreview(null)}>Close preview</button><p>Private preview. Nothing was published.</p><OfferDetail offer={preview} preview/></section>}
  </>;
}
