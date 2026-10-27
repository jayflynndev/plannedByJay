// Presentation only: saved article bodies are never rewritten to remove a title.
function headingText(html:string){
  const entities:Record<string,string>={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};
  return html.replace(/<[^>]*>/g,'').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(_,value:string)=>{
    if(value.startsWith('#')){const n=value[1].toLowerCase()==='x'?parseInt(value.slice(2),16):Number(value.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
    return entities[value.toLowerCase()];
  }).normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('en-GB');
}
export function articleBodyForDisplay(html:string,title:string){
  const leading=/^(\s*(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)*)<h([23])\b[^>]*>([\s\S]*?)<\/h\2>\s*/i;
  const match=html.match(leading);
  const body=match&&headingText(match[3])===headingText(title)?match[1]+html.slice(match[0].length):html;
  return body.replace(/<table\b/gi,'<div class="article-table-scroll" role="region" aria-label="Article table" tabindex="0"><table').replace(/<\/table>/gi,'</table></div>');
}
