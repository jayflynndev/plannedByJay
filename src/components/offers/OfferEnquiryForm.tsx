"use client";
import { useRef, useState } from "react";
export function AskJayLink() {
  return <a className="button" href="#ask-jay" onClick={()=>{
    const form=document.getElementById("ask-jay") as HTMLDetailsElement|null;
    if(form?.tagName==="DETAILS"){form.open=true;form.querySelector("summary")?.focus();}
  }}>Ask Jay About This Holiday</a>;
}
export function OfferEnquiryForm({offerId,enabled=false,privacyHref=null}:{offerId:string;enabled?:boolean;privacyHref?:string|null}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
  const [received,setReceived]=useState(false);
  const working=useRef(false),requestId=useRef("");
  const available=enabled && !!privacyHref;
  return <details className="offer-enquiry" id="ask-jay"><summary className="button">Ask Jay About This Holiday</summary>
    <h2>Ask Jay about this holiday</h2>
    {!available && <p role="status">Offer enquiries are not available yet. No details are collected by this form.</p>}
    <form aria-label="Offer-specific enquiry" onSubmit={async e=>{
      e.preventDefault();if(!available || received || working.current)return;
      working.current=true;setBusy(true);setMessage("");setFailed(false);
      try {
        const data=new FormData(e.currentTarget);requestId.current ||= crypto.randomUUID();
        const r=await fetch("/api/offer-enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({request_id:requestId.current,offer_id:offerId,name:data.get("name"),email:data.get("email"),phone:data.get("phone"),message:data.get("message"),website:data.get("website")})});
        const result=await r.json();if(!r.ok || !result.reference)throw new Error(result.error || "Your enquiry could not be received.");
        setMessage("Your enquiry has been received. Reference: "+result.reference);
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
        <p>Your contact details and question will be used to respond about this holiday. Please do not include passport, payment or medical information. {privacyHref?<a href={privacyHref}>Privacy information</a>:"Privacy information will be available before enquiries open."}</p>
        <button className="button" type="submit">{!available?"Enquiries unavailable":received?"Enquiry received":busy?"Sending...":"Send enquiry"}</button>
      </fieldset>
      <div aria-live="polite">{message&&<p role={failed?"alert":"status"}>{message}</p>}</div>
    </form>
  </details>;
}
