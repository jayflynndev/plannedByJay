import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLButtonElement:dom.window.HTMLButtonElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver,DOMParser:dom.window.DOMParser,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(fn:()=>void)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
dom.window.Range.prototype.getClientRects=()=>[] as unknown as DOMRectList;
dom.window.Range.prototype.getBoundingClientRect=()=>new dom.window.DOMRect();
const base='https://fixture.supabase.co';const photo=`${base}/storage/v1/object/public/editorial-images/20000000-0000-4000-8000-000000000001.webp`;

test('Markdown round-trips preserve supported headings, marks, reference links, tables, images, quotations and nested lists',async()=>{
  const {createMarkdownManager,readVisualMarkdown,writeVisualMarkdown}=await import('../src/lib/cms/rich-text');
  const manager=createMarkdownManager(base);
  for(const source of [
    '## Heading\n\nA **bold** and *italic* paragraph with [a link](https://example.com).',
    '> Quotation\n>\n> Another paragraph\n\n- Parent\n  - Child\n    1. Ordered child\n- Next item',
    '| Left | Right |\n| :--- | ---: |\n| **Bold** | `a \\| b` |\n\nAfter table.',
    `## Photograph\n\n![A coastal scene](${photo} "Caption")`,
    '[A reference link][ref]\n\n[ref]: https://example.com "Title"',
    '```js\nconst value = 1;\n```\n\n---\n\nNormal paragraph.',
  ]) {
    const parsed=readVisualMarkdown(source,manager,base);
    assert.equal(parsed.issue,null,`${source}: ${parsed.issue}`);assert.ok(parsed.document);
    const result=writeVisualMarkdown(parsed.document,manager,base);assert.equal(result.issue,null);
    assert.equal(readVisualMarkdown(result.markdown!,manager,base).issue,null);
  }
  const long='A useful paragraph with **important words**.\n\n'.repeat(1000);
  assert.equal(readVisualMarkdown(long,manager,base).issue,null);
  for(const text of ['## Literal','1. Literal','- Literal','> Literal','---','    Literal','\tLiteral','**Literal bold syntax**']) {
    const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]};
    assert.equal(writeVisualMarkdown(doc,manager,base).issue,null,`Literal plain text: ${text}`);
  }
});

test('unsupported or unsafe Markdown stays in original source; unsafe images/links and merged cells cannot silently save',async()=>{
  const {createMarkdownManager,readVisualMarkdown,writeVisualMarkdown,safeEditorLink}=await import('../src/lib/cms/rich-text');const manager=createMarkdownManager(base);
  for(const source of ['Text\n\n<!-- preserve this note -->','- [x] Checked task','Text[^1]\n\n[^1]: Footnote','![External](https://evil.example/track.png)','[Unsafe](javascript:alert%281%29)']) {
    assert.equal(readVisualMarkdown(source,manager,base).document,null);
  }
  assert.equal(safeEditorLink('javascript:alert(1)'),false);assert.equal(safeEditorLink('//evil.example'),false);assert.equal(safeEditorLink('https://example.com'),true);
  const complex={type:'doc',content:[{type:'table',content:[{type:'tableRow',content:[{type:'tableCell',attrs:{colspan:2},content:[{type:'paragraph',content:[{type:'text',text:'Keep me'}]}]}]}]}]};
  assert.ok(writeVisualMarkdown(complex,manager,base).issue);
});

test('rich ChatGPT/Word HTML is sanitised without duplicate paragraphs or unsafe resource URLs',async()=>{
  const {sanitiseRichPaste,richTextExtensions,createMarkdownManager,writeVisualMarkdown}=await import('../src/lib/cms/rich-text');
  const {generateJSON}=await import('@tiptap/core');
  const html=`<h1>Article heading</h1><p>One <span style="font-weight:700;font-style:italic;color:red">important</span> paragraph.</p><ul><li>Parent<ul><li>Child</li></ul></li></ul><table><tr><td>Name</td><td>Value</td></tr><tr><td>One</td><td>Two</td></tr></table><p><a href="https://example.com">Safe link</a> <a href="javascript:alert(1)">Unsafe link text</a></p><img src="${photo}" alt="Approved scene"><img src="https://evil.example/pixel" onerror="alert(1)"><script>alert('unsafe')</script><iframe src="https://evil.example"></iframe>`;
  const clean=sanitiseRichPaste(html,base);const fragment=new JSDOM(clean.html).window.document;
  assert.equal(fragment.querySelectorAll('h1').length,0);assert.equal(fragment.querySelectorAll('h2').length,1);
  assert.ok(fragment.querySelector('strong em,em strong'));assert.equal(fragment.querySelectorAll('script,iframe,style,[style],[onerror]').length,0);
  assert.equal(fragment.querySelectorAll('img').length,1);assert.equal(fragment.querySelector('img')?.getAttribute('alt'),'Approved scene');
  assert.equal(fragment.querySelectorAll('a').length,1);assert.ok(fragment.body.textContent?.includes('Unsafe link text'));
  assert.equal(fragment.querySelectorAll('p').length,2);assert.equal(fragment.querySelectorAll('th').length,2);
  const markdown=writeVisualMarkdown(generateJSON(clean.html,richTextExtensions(base)),createMarkdownManager(base),base);
  assert.equal(markdown.issue,null);assert.ok(markdown.markdown?.includes('Approved scene'));assert.ok(clean.warnings.length>0);
  const word=sanitiseRichPaste('<p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">1. </span>Parent</p><p style="mso-list:l0 level2 lfo1"><span style="mso-list:Ignore">• </span>Child</p><p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">2. </span>Next</p>',base);
  const wordDoc=new JSDOM(word.html).window.document;
  assert.equal(wordDoc.querySelectorAll('ol>li').length,2);assert.equal(wordDoc.querySelectorAll('ol>li>ul>li').length,1);
  assert.equal(writeVisualMarkdown(generateJSON(word.html,richTextExtensions(base)),createMarkdownManager(base),base).issue,null);
});

test('visual editing preserves untouched source, explicitly imports Markdown, pastes plain text literally and blocks editing during save',async()=>{
  const {render,cleanup,waitFor,fireEvent}=await import('@testing-library/react');const {VisualArticleEditor}=await import('../src/components/cms/VisualArticleEditor');
  const source='## Existing\n\nOriginal **words**.\n';let value=source;const guards:{blocked:boolean;dirty:boolean}[]=[];
  const props={body:source,onChange:(next:string)=>{value=next;},disabled:false,mediaBase:base,media:[],onUploaded:()=>{},onGuard:(guard:{blocked:boolean;dirty:boolean})=>guards.push(guard)};
  const view=render(<VisualArticleEditor {...props}/>);
  try {
    await waitFor(()=>assert.ok(view.getByRole('textbox',{name:'Article body (visual editor)'})));
    await waitFor(()=>assert.ok(view.getByRole('heading',{name:'Existing'})));
    assert.equal(value,source,'mount does not rewrite stored Markdown');
    const editor=view.getByRole('textbox',{name:'Article body (visual editor)'});
    fireEvent.paste(editor,{clipboardData:{getData:(type:string)=>type==='text/plain'?'## Literal Markdown':''}});
    await waitFor(()=>assert.ok(editor.textContent?.includes('## Literal Markdown')));
    assert.equal(editor.querySelectorAll('h1,h2,h3').length,1,'plain Markdown is not interpreted as a second heading');
    assert.ok(value.includes('Literal Markdown'),JSON.stringify({value,issue:view.queryByRole('alert')?.textContent,html:editor.innerHTML}));
    fireEvent.click(view.getByRole('button',{name:'Paste Markdown'}));fireEvent.change(view.getByLabelText('Paste prepared Markdown'),{target:{value:'## Imported\n\n**Formatted** text'}});
    dom.window.confirm=()=>true;fireEvent.click(view.getByRole('button',{name:'Replace body with Markdown'}));
    await waitFor(()=>assert.ok(view.getByRole('heading',{name:'Imported'})));assert.ok(value.includes('**Formatted**'));
    fireEvent.paste(editor,{clipboardData:{getData:(type:string)=>type==='text/html'?'<p>Rich <strong>clipboard words</strong>.</p><script>alert(1)</script>':'Rich clipboard words.'}});
    assert.equal((editor.textContent?.match(/clipboard words/g)||[]).length,1);assert.equal(editor.querySelector('script'),null);assert.ok(value.includes('**clipboard words**'));
    view.rerender(<VisualArticleEditor {...props} body={value} disabled={true}/>);
    await waitFor(()=>assert.equal(view.getByRole('textbox',{name:'Article body (visual editor)'}).getAttribute('contenteditable'),'false'));
    assert.equal(guards.some(guard=>guard.blocked),false);
  } finally {cleanup();}
});

test('visual media insertion requires alt text and retains the safe image in canonical Markdown',async()=>{
  const {render,cleanup,waitFor,fireEvent}=await import('@testing-library/react');const {VisualArticleEditor}=await import('../src/components/cms/VisualArticleEditor');let value='';
  const media={id:'20000000-0000-4000-8000-000000000001',storage_path:'20000000-0000-4000-8000-000000000001.webp',original_name:'Fixture photograph',width:1200,height:800,bytes:1000,sha256:'a'.repeat(64),created_at:'2026-10-22T12:00:00Z'};
  const fixtureBase='/fixture'; const fixturePhoto=photo.replace(base,fixtureBase);
  const view=render(<VisualArticleEditor body="" onChange={next=>{value=next;}} disabled={false} mediaBase={fixtureBase} media={[media]} onUploaded={()=>{}} onGuard={()=>{}}/>);
  try {
    await waitFor(()=>assert.equal((view.getByRole('button',{name:'Photograph'}) as HTMLButtonElement).disabled,false));
    fireEvent.click(view.getByRole('button',{name:'Photograph'}));fireEvent.click(view.getByRole('button',{name:'Use image'}));
    assert.equal((view.getByRole('button',{name:'Insert photograph'}) as HTMLButtonElement).disabled,true);
    fireEvent.change(view.getByLabelText('Photograph description'),{target:{value:'A safe coastal scene'}});fireEvent.click(view.getByRole('button',{name:'Insert photograph'}));
    assert.equal(view.getByAltText('A safe coastal scene').getAttribute('src'),fixturePhoto);assert.ok(value.includes(`![A safe coastal scene](${fixturePhoto})`));
  } finally {cleanup();}
});

test('table toolbar adds/removes rows and columns with a safe Markdown representation',async()=>{
  const {render,cleanup,waitFor,fireEvent}=await import('@testing-library/react');const {VisualArticleEditor}=await import('../src/components/cms/VisualArticleEditor');let value='';
  const view=render(<VisualArticleEditor body="A paragraph" onChange={next=>{value=next;}} disabled={false} mediaBase={base} media={[]} onUploaded={()=>{}} onGuard={()=>{}}/>);
  try {
    await waitFor(()=>assert.equal((view.getByRole('button',{name:'Insert table'}) as HTMLButtonElement).disabled,false));
    fireEvent.click(view.getByRole('button',{name:'Insert table'}));assert.equal(view.getAllByRole('row').length,3);
    fireEvent.click(view.getByRole('button',{name:'Add row'}));fireEvent.click(view.getByRole('button',{name:'Add column'}));
    assert.equal(view.getAllByRole('row').length,4);assert.equal(view.getAllByRole('columnheader').length,4);assert.ok(value.includes('|'));
    assert.equal(view.queryByRole('alert'),null);fireEvent.click(view.getByRole('button',{name:'Delete table'}));assert.equal(view.queryByRole('table'),null);
  } finally {cleanup();}
});
