'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AuthForm({mode='login'}:{mode?:'login'|'password'}) {
  const router=useRouter();
  const [recover,setRecover]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage('');setFailed(false);
    const form=new FormData(event.currentTarget);
    try {
      const result=await fetch('/api/cms/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode==='password'?'password':recover?'recover':'login',email:mode==='login'?form.get('email'):undefined,password:!recover?form.get('password'):undefined})});
      const data=await result.json(); if(!result.ok) throw new Error(data.error);
      if(recover) setMessage(data.message); else {router.replace('/admin');router.refresh();}
    } catch(error) {setFailed(true);setMessage(error instanceof Error?error.message:'Please try again.');} finally {setBusy(false);}
  }
  return <form onSubmit={submit} className="cms-stack">
    {mode==='login' && <label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254}/></label>}
    {!recover && <label>{mode==='password'?'New password':'Password'}<input name="password" type="password" autoComplete={mode==='password'?'new-password':'current-password'} required minLength={mode==='password'?12:1} maxLength={128}/></label>}
    {message && <p role={failed?'alert':'status'} className={failed?'cms-error':'cms-notice'}>{message}</p>}
    <button className="button" disabled={busy}>{busy?'Please wait…':mode==='password'?'Set password':recover?'Send recovery email':'Sign in'}</button>
    {mode==='login' && <button type="button" className="cms-text-button" onClick={()=>{setRecover(!recover);setMessage('');}}>{recover?'Back to sign in':'Forgot your password?'}</button>}
  </form>;
}
export function SignOut() {
  const router=useRouter();
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  return <><button type="button" className="cms-text-button" disabled={busy} onClick={async()=>{
    setBusy(true);try {const result=await fetch('/api/cms/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});
      if(!result.ok) throw new Error('Sign-out failed. Please try again.'); router.replace('/admin/login');router.refresh();
    } catch(error) {setMessage(error instanceof Error?error.message:'Please try again.');setBusy(false);}
  }}>{busy?'Signing out…':'Sign out'}</button>{message && <p role="alert">{message}</p>}</>;
}
