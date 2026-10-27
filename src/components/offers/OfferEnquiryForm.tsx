"use client";
import { useRef, useState } from "react";
import { money,isOfferReference } from "@/lib/offers/schema";
export type OfferEnquirySummary={reference:string;title:string;supplier:string;departure_date:string;total_price_minor:number|null;currency:string;adults:number;children:number;child_ages:number[]};
export function AskJayLink() {
  return <a className="button" href="#ask-jay" onClick={()=>{
    const form=document.getElementById("ask-jay") as HTMLDetailsElement|null;
    if(form?.tagName==="DETAILS"){form.open=true;form.querySelector("summary")?.focus();}
  }}>Ask Jay about this holiday</a>;
}
export function OfferEnquiryForm({offerId,summary,enabled=false,privacyHref=null}:{offerId:string;summary?:OfferEnquirySummary;enabled?:boolean;privacyHref?:string|null}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
  const [received,setReceived]=useState(false);
  const working=useRef(false),requestId=useRef("");
  const available=enabled && !!privacyHref;
  return <details className="offer-enquiry" id="ask-jay"><summary className="button">Ask Jay about this holiday</summary>
    <h2>Ask Jay about this holiday</h2>
    {summary&&<div className="offer-enquiry-context" aria-label="Holiday for this enquiry"><p><strong>{summary.title}</strong></p><p>{isOfferReference(summary.reference)&&<>Offer reference: {summary.reference} · </>}{summary.supplier}</p>{summary.departure_date&&<p>Departure: {new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(summary.departure_date+"T00:00:00Z"))}</p>}<p>{summary.total_price_minor?money(summary.total_price_minor,summary.currency)+" total":"Price not entered"} · {summary.adults} {summary.adults===1?"adult":"adults"}{summary.children?` + ${summary.children} ${summary.children===1?"child":"children"}${summary.child_ages.length?` (ages ${summary.child_ages.join(", ")})`:""}`:""}</p></div>}
    {!available && <p role="status">Offer enquiries are not available yet. No details are collected by this form.</p>}
    <form aria-label="Offer-specific enquiry" onSubmit={async e=>{
      e.preventDefault();if(!available || received || working.current)return;
      working.current=true;setBusy(true);setMessage("");setFailed(false);
      try {
        const data=new FormData(e.currentTarget);requestId.current ||= crypto.randomUUID();
        const r=await fetch("/api/offer-enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:requestId.current,offer_id:offerId,name:data.get("name"),email:data.get("email"),phone:data.get("phone"),message:data.get("message"),website:data.get("website")})});
        const result=await r.json();if(!r.ok || result.accepted!==true || typeof result.reference!=="string" || !/^[0-9]{6}$/.test(result.reference) || !["accepted","pending"].includes(result.notification))throw new Error(result.error || "Your enquiry could not be received.");
        setMessage(result.notification==="pending"?"Your enquiry has been saved securely. Jay's email notification is pending, so you do not need to submit it again. Offer reference: "+result.reference:"Your enquiry has been received. Offer reference: "+result.reference);
        setReceived(true);
      }catch(error){setFailed(true);setMessage(error instanceof Error?error.message:"Your enquiry could not be received.");}
      finally{working.current=false;setBusy(false);}
    }}>
      <fieldset disabled={!available || busy || received}>
        <label>Your name<input name="name" required maxLength={120} autoComplete="name"/></label>
        <label>Email address<input name="email" type="email" required maxLength={320} autoComplete="email"/></label>
        <label>Phone number (optional)<input name="phone" type="tel" maxLength={50} autoComplete="tel"/></label>
        <label>Message or question (optional)<textarea name="message" rows={3} maxLength={3000}/></label>
        <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue=""/></label></div>
        <p>Your details and this holiday&apos;s information will be saved and used to respond to your enquiry, with an email notification to Jay. Please do not include passport, payment or medical information. {privacyHref?<a href={privacyHref}>Privacy information</a>:"Privacy information will be available before enquiries open."}</p>
        <button className="button" type="submit">{!available?"Enquiries unavailable":received?"Enquiry received":busy?"Sending...":"Send enquiry"}</button>
      </fieldset>
      <div aria-live="polite">{message&&<p role={failed?"alert":"status"}>{message}</p>}</div>
    </form>
  </details>;
}
