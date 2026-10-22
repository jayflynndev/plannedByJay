import { mergeAttributes, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Markdown, MarkdownManager } from '@tiptap/markdown';
import createDOMPurify from 'dompurify';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { safeImageUrl } from './urls';

export const maximumArticleLength=200000;
export function safeEditorLink(url:string) {
  return !/[\u0000-\u0020\u007f]/.test(url) && (/^(https?:\/\/|mailto:|tel:)/i.test(url)||/^\/(?!\/)/.test(url)||url.startsWith('#'));
}
export function richTextExtensions(mediaBase:string) {
  const SafeParagraph=Paragraph.extend({renderMarkdown:(node,helpers,context)=>{
    const value=Paragraph.config.renderMarkdown?.call({name:Paragraph.name,options:Paragraph.options,storage:Paragraph.storage,parent:undefined},node,helpers,context)||'';
    // The upstream serializer escapes inline syntax, but not literal block starters.
    return value.replace(/^(\s*)(#{1,6}|>|[-+])(?=\s|$)/gm,'$1\\$2')
      .replace(/^(\s*\d+)([.)])(?=\s|$)/gm,'$1\\$2')
      .replace(/^([ \t]*)(-{3,}|=+)([ \t]*)$/gm,(_all,space,marker,end)=>`${space}\\${marker}${end}`)
      .replace(/^(?: {4,}|[ \t]*\t[ \t]*)/gm,space=>space.replace(/ /g,'&#32;').replace(/\t/g,'&#9;'));
  }});
  const SafeImage=Image.extend({
    parseHTML(){return [{tag:'img[src]',getAttrs:element=>safeImageUrl((element as HTMLElement).getAttribute('src')||'',mediaBase)?null:false}];},
    renderHTML({HTMLAttributes}){
      return safeImageUrl(String(HTMLAttributes.src||''),mediaBase)
        ? ['img',mergeAttributes(this.options.HTMLAttributes,HTMLAttributes)]
        : ['span',{},'Image unavailable'];
    },
    renderMarkdown:node=>{
      const escape=(value:string)=>value.replace(/[\\[\]"]/g,'\\$&');
      return `![${escape(String(node.attrs?.alt||''))}](${node.attrs?.src}${node.attrs?.title?` "${escape(String(node.attrs.title))}"`:''})`;
    },
  }).configure({allowBase64:false,resize:false});
  return [StarterKit.configure({paragraph:false,underline:false,trailingNode:false,link:{openOnClick:false,autolink:false,linkOnPaste:false,isAllowedUri:safeEditorLink}}),SafeParagraph,
    SafeImage,Table.configure({resizable:false}),TableRow,TableHeader,TableCell,Markdown];
}
export function createMarkdownManager(base:string) {return new MarkdownManager({extensions:richTextExtensions(base)});}
const parser=unified().use(remarkParse).use(remarkGfm);
type Ast={type:string;children?:Ast[];[key:string]:unknown};
function meaning(markdown:string) {
  const root=parser.parse(markdown) as unknown as Ast;
  const definitions=new Map<string,Ast>();
  const collect=(node:Ast)=>{if(node.type==='definition')definitions.set(String(node.identifier),node);node.children?.forEach(collect);};collect(root);
  const normalise=(node:Ast):unknown=>{
    if(node.type==='definition')return undefined;
    if(node.type==='linkReference'||node.type==='imageReference') {
      const definition=definitions.get(String(node.identifier));
      if(definition)return normalise({...node,type:node.type==='linkReference'?'link':'image',url:definition.url,title:definition.title});
    }
    return Object.fromEntries(Object.entries(node).filter(([key,value])=>!['position','spread','identifier','label','referenceType'].includes(key)&&value!==null&&value!==undefined).sort(([a],[b])=>a.localeCompare(b))
      .map(([key,value])=>[key,key==='children'?node.children!.map(normalise).filter(value=>value!==undefined):key==='value'&&node.type==='text'?String(value).replace(/\s+/g,' '):value]));
  };
  return JSON.stringify(normalise(root));
}
function inspectDocument(doc:JSONContent,base:string,inTable=false):string|null {
  if(inTable&&doc.type==='hardBreak')return 'Use separate table rows rather than line breaks inside a cell, so the published Markdown keeps the same meaning.';
  if(doc.type==='image'&&!safeImageUrl(String(doc.attrs?.src||''),base))return 'An image is outside the approved media library. Keep it in source mode or choose a library photograph.';
  if(doc.marks?.some(mark=>mark.type==='link'&&!safeEditorLink(String(mark.attrs?.href||''))))return 'A link uses an unsupported address. Correct it in source mode before visual editing.';
  if((doc.type==='tableCell'||doc.type==='tableHeader')&&((doc.attrs?.colspan||1)!==1||(doc.attrs?.rowspan||1)!==1||(doc.content?.length||0)>1))return 'Merged cells or multiple paragraphs in one cell cannot be represented reliably in Markdown.';
  for(const child of doc.content||[]){const issue=inspectDocument(child,base,inTable||doc.type==='table');if(issue)return issue;}
  return null;
}
/** Only compare semantic document data: ignore DOM-only link/window and image size defaults. */
function documentMeaning(doc:JSONContent):unknown {
  const attrs=Object.fromEntries(Object.entries(doc.attrs||{}).filter(([key,value])=>!['target','rel','class','width','height','colwidth'].includes(key)&&value!==null&&value!==undefined&&!(['colspan','rowspan','start'].includes(key)&&value===1)));
  let content=doc.content||[];
  if(doc.type==='doc')content=content.filter(node=>node.type!=='paragraph'||node.content?.length);
  return {type:doc.type,...(doc.text!==undefined?{text:doc.text}:{}),...(Object.keys(attrs).length?{attrs}:{}),
    ...(doc.marks?.length?{marks:doc.marks.map(mark=>documentMeaning(mark)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))}:{}),
    ...(content.length?{content:content.map(documentMeaning)}:{})};
}
export function writeVisualMarkdown(doc:JSONContent,manager:MarkdownManager,base:string) {
  const issue=inspectDocument(doc,base);if(issue)return {markdown:null,issue};
  const markdown=manager.serialize(doc);
  if(markdown.length>maximumArticleLength)return {markdown:null,issue:'This article exceeds the 200,000-character limit. Shorten it before saving.'};
  if(JSON.stringify(documentMeaning(doc))!==JSON.stringify(documentMeaning(manager.parse(markdown))))return {markdown:null,issue:'This formatting cannot safely round-trip to Markdown. Undo the last change or review the conversion before using it.'};
  return {markdown,issue:null};
}
/** Never overwrite original source merely by opening or previewing an article. */
export function readVisualMarkdown(markdown:string,manager:MarkdownManager,base:string) {
  if(markdown.length>maximumArticleLength)return {document:null,issue:'This article exceeds the editor limit. Use source mode to shorten it.'};
  const ast=parser.parse(markdown) as unknown as Ast;
  const unsupported=(node:Ast):boolean=>node.type==='html'||node.type.startsWith('footnote')||typeof node.checked==='boolean'||Boolean(node.children?.some(unsupported));
  if(unsupported(ast))return {document:null,issue:'This source contains HTML, comments, footnotes or task lists that visual editing cannot safely preserve. Your complete source is retained below.'};
  const doc=manager.parse(markdown);
  const result=writeVisualMarkdown(doc,manager,base);
  if(result.issue)return {document:null,issue:result.issue};
  if(meaning(markdown)!==meaning(result.markdown!))return {document:null,issue:'This article uses Markdown that cannot safely round-trip in the visual editor. Its complete original source is retained below.'};
  return {document:doc,issue:null};
}

/** Inert DOMPurify fragments only: never insert clipboard HTML into the live document. */
export function sanitiseRichPaste(html:string,base:string) {
  const purifier=createDOMPurify(window);
  const tags=['p','div','span','h1','h2','h3','h4','h5','h6','strong','b','em','i','s','del','code','pre','ul','ol','li','blockquote','br','hr','table','thead','tbody','tfoot','tr','th','td','a','img'];
  const attrs=['href','src','alt','title','start','align','colspan','rowspan','style'];
  const fragment=purifier.sanitize(html,{ALLOWED_TAGS:tags,ALLOWED_ATTR:attrs,RETURN_DOM_FRAGMENT:true});
  const warnings:string[]=[];
  if(purifier.removed.length)warnings.push('Unsupported markup was removed.');
  // Word may put list markers in mso-list paragraphs rather than real ul/ol nodes.
  const stack:{list:HTMLElement;ordered:boolean}[]=[];
  for(const paragraph of [...fragment.querySelectorAll<HTMLElement>('p[style]')]) {
    const rawStyle=paragraph.getAttribute('style')||'';if(!/mso-list\s*:/i.test(rawStyle))continue;
    const marker=[...paragraph.querySelectorAll<HTMLElement>('span[style]')].find(span=>/mso-list\s*:\s*Ignore/i.test(span.getAttribute('style')||''));
    const prefix=(marker?.textContent||paragraph.textContent||'').match(/^\s*(\d+[.)]|[•·●○\-])\s*/);
    if(!prefix){warnings.push('A Word list could not be identified; its text was kept. Check its formatting.');continue;}
    const ordered=/^\d/.test(prefix[1]);const requested=Number(/level(\d+)/i.exec(rawStyle)?.[1]||1);
    if(!stack.length||paragraph.previousElementSibling!==stack[0].list)stack.length=0;
    const level=Math.max(1,Math.min(8,requested,stack.length+1));
    while(stack.length>level)stack.pop();
    if(stack.length<level||stack[level-1]?.ordered!==ordered){
      stack.length=level-1;const list=document.createElement(ordered?'ol':'ul');
      if(ordered&&Number.parseInt(prefix[1],10)!==1)list.setAttribute('start',String(Number.parseInt(prefix[1],10)));
      const parent=stack[level-2]?.list.lastElementChild;
      if(parent)parent.append(list);else paragraph.before(list);
      stack.push({list,ordered});
    }
    if(marker&&/^\s*(?:\d+[.)]|[•·●○\-])\s*$/.test(marker.textContent||''))marker.remove();
    else {
      const walker=document.createTreeWalker(paragraph,4);let first=walker.nextNode();while(first&&!first.textContent?.trim())first=walker.nextNode();
      if(first)first.textContent=(first.textContent||'').replace(/^\s*(?:\d+[.)]|[•·●○\-])\s*/,'');
    }
    const item=document.createElement('li');item.append(paragraph);stack[level-1].list.append(item);
    warnings.push('Word list formatting was converted; check numbering and indentation.');
  }
  // Word commonly expresses emphasis as styled spans rather than semantic tags.
  for(const element of [...fragment.querySelectorAll<HTMLElement>('[style]')]) {
    const style=element.style;
    if(style.fontWeight==='bold'||Number(style.fontWeight)>=600){const strong=document.createElement('strong');strong.append(...element.childNodes);element.append(strong);}
    if(style.fontStyle==='italic'){const em=document.createElement('em');em.append(...element.childNodes);element.append(em);}
    if(['TD','TH'].includes(element.tagName)&&['left','right','center'].includes(style.textAlign))element.setAttribute('align',style.textAlign);
    element.removeAttribute('style');
  }
  for(const image of fragment.querySelectorAll('img'))if(!safeImageUrl(image.getAttribute('src')||'',base)){image.remove();warnings.push('An external or embedded image was removed. Insert photographs from the media library.');}
  for(const link of fragment.querySelectorAll('a'))if(!safeEditorLink(link.getAttribute('href')||'')){link.replaceWith(...link.childNodes);warnings.push('An unsafe link was removed; its text was kept.');}
  for(const heading of fragment.querySelectorAll('h1')){const h2=document.createElement('h2');h2.append(...heading.childNodes);heading.replaceWith(h2);warnings.push('Pasted H1 headings were changed to H2; the article title stays separate.');}
  for(const table of fragment.querySelectorAll('table'))for(const cell of table.rows[0]?.cells||[])if(cell.tagName==='TD'){
    const header=document.createElement('th');header.append(...cell.childNodes);for(const attribute of [...cell.attributes])header.setAttribute(attribute.name,attribute.value);cell.replaceWith(header);
    warnings.push('The first table row is used as column headings.');
  }
  const clean=purifier.sanitize(fragment,{ALLOWED_TAGS:tags,ALLOWED_ATTR:attrs.filter(attr=>attr!=='style'),RETURN_DOM_FRAGMENT:true});
  const holder=document.createElement('div');holder.append(clean);
  const plain=(node:Node):string=>node.nodeType===3?node.textContent||'':[...node.childNodes].map(plain).join('')+
    (node.nodeType===1?(['TD','TH'].includes((node as Element).tagName)?'\t':['P','DIV','LI','TR','H1','H2','H3','H4','H5','H6','BR'].includes((node as Element).tagName)?'\n':''):'');
  return {html:holder.innerHTML,text:plain(holder).replace(/\n{3,}/g,'\n\n'),warnings:[...new Set(warnings)]};
}
