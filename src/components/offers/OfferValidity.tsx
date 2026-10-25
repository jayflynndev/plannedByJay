'use client';
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
/** Server starts with the same markup as hydration. Recheck on elapsed time and
 * restored tabs so an already-open page does not keep showing an expired price. */
export function OfferValidity({until,children,detail=false}:{until:number;children:ReactNode;detail?:boolean}){
  const [current,setCurrent]=useState(true);
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>;function check(){const remaining=until-Date.now();setCurrent(remaining>0);clearTimeout(timer);if(remaining>0)timer=setTimeout(check,Math.min(remaining+10,2147483647));}check();window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);return()=>{clearTimeout(timer);window.removeEventListener('pageshow',check);document.removeEventListener('visibilitychange',check);};},[until]);
  return current?children:detail?<p role="status">This advertised offer has ended. <Link href="/holidays">Explore holiday ideas</Link> or ask Jay to research options.</p>:null;
}
