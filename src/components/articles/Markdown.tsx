import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import Image from 'next/image';
import { safeImageUrl } from '@/lib/presentation';
export function Markdown({body}:{body:string}) {
  return <div className="article-prose"><ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}
    urlTransform={(url,key)=>key==='src'?(safeImageUrl(url)?url:''):defaultUrlTransform(url)}
    components={{
      h1:({children})=><h2>{children}</h2>,
      img:({src,alt})=>typeof src==='string' && safeImageUrl(src)?<Image className="article-inline-image" src={src} alt={alt||''} width={1200} height={800} sizes="(max-width: 800px) 100vw, 800px"/>:null,
      table:({children})=><div className="article-table-scroll" role="region" aria-label="Article table" tabIndex={0}><table>{children}</table></div>,
      a:({href,children})=><a href={href} rel="noopener noreferrer">{children}</a>,
    }}>{body}</ReactMarkdown></div>;
}
