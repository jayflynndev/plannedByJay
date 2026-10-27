'use client';
import Image, {type ImageProps} from 'next/image';
import { useState } from 'react';
import {imageDescription} from '@/content/image-descriptions';
/** Keep layout stable when an owner replaces/misses an asset. No substitute photograph. */
export function SiteImage({src,alt,fallback=null,...props}:Omit<ImageProps,'src'|'onError'> & {src:string|null;fallback?:React.ReactNode}) {
  const [failedSource,setFailedSource]=useState<string|null>(null);
  if(!src||failedSource===src)return <>{fallback}</>;
  return <Image {...props} src={src} alt={imageDescription(src,alt)} onError={()=>setFailedSource(src)}/>;
}
