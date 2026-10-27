"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";

export function RetryOfferNotification({id,needsReview}:{id:string;needsReview:boolean}) {
  const router=useRouter(),working=useRef(false);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
  return <div className="offer-notification-retry">
    {needsReview&&<p>This is an older pending notification. Check Resend and the mailbox before retrying to avoid a duplicate. The internal enquiry ID above identifies the message in Resend.</p>}
    <button className="button button-secondary" type="button" disabled={busy} onClick={async()=>{
      if(working.current)return;
      if(needsReview&&!window.confirm("Have you checked Resend and the mailbox and confirmed that this notification has not already been accepted? If it was accepted, record its existing receipt instead of sending it again."))return;
      working.current=true;setBusy(true);setMessage("");setFailed(false);
      try{
        const response=await fetch("/api/offer-enquiries/notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,confirmedUnsent:needsReview})});
        const result=await response.json();if(!response.ok||result.notification!=="accepted")throw new Error(result.error||"The notification remains pending. The enquiry is safely retained.");
        setMessage("Notification accepted by Resend. Check the mailbox for arrival.");router.refresh();
      }catch(error){setFailed(true);setMessage(error instanceof Error?error.message:"The notification remains pending. The enquiry is safely retained.");}
      finally{working.current=false;setBusy(false);}
    }}>{busy?"Retrying notification…":"Retry email notification"}</button>
    <div aria-live="polite">{message&&<p role={failed?"alert":"status"}>{message}</p>}</div>
  </div>;
}
