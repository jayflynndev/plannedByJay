import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { editorValue } from '../src/lib/cms/editor';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver,requestAnimationFrame:(fn:()=>void)=>setTimeout(fn,0)});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
dom.window.confirm=()=>true;

test('discovery controls create/reuse tags, preserve placement on save and surface creation failures',async()=>{
  const {render,cleanup,waitFor}=await import('@testing-library/react');const userEvent=(await import('@testing-library/user-event')).default;
  const {ArticleEditor}=await import('../src/components/cms/ArticleEditor');const user=userEvent.setup({document});const originalFetch=globalThis.fetch;
  const tag={id:'30000000-0000-4000-8000-000000000001',name:'Japan'};
  let fail=true;let saved:Record<string,unknown>={};
  globalThis.fetch=async(input,init)=>{
    if(String(input)==='/api/cms/tags')return fail?Response.json({error:'Tag creation unavailable'},{status:503}):Response.json({tag});
    saved=JSON.parse(String(init?.body));return Response.json({article:{...saved,id:'10000000-0000-4000-8000-000000000003',revision:1}});
  };
  const view=render(<ArticleEditor initial={{...editorValue(null),title:'Fixture draft',slug:'fixture-draft'}} categories={[]} initialTags={[tag]} initialMedia={[]} mediaBase="/fixture" siteOrigin="http://localhost:3000"/>);
  try {
    await user.click(view.getByLabelText('Japan'));
    await user.click(view.getByLabelText('Featured on Homepage'));await user.click(view.getByLabelText('Pinned in Travel Advice'));
    await user.type(view.getByLabelText('New tag name'),'JAPAN');await user.click(view.getByRole('button',{name:'Create & select tag'}));
    await waitFor(()=>assert.ok(view.getByRole('alert').textContent?.includes('Tag creation unavailable')));
    assert.equal((view.getByLabelText('Japan') as HTMLInputElement).checked,true);
    fail=false;await user.click(view.getByRole('button',{name:'Create & select tag'}));
    await waitFor(()=>assert.ok(view.getByText(/Selected tag: Japan/)));
    assert.equal(view.getAllByLabelText('Japan').length,1,'normalised reuse does not duplicate choices');
    await user.click(view.getByRole('button',{name:'Save draft'}));await waitFor(()=>assert.ok(view.getByText(/Draft saved/)));
    assert.deepEqual(saved.tag_ids,[tag.id]);assert.equal(saved.homepage_featured,true);assert.equal(saved.advice_pinned,true);
    await user.click(view.getByLabelText('Japan'));await user.click(view.getByRole('button',{name:'Save draft'}));
    await waitFor(()=>assert.deepEqual(saved.tag_ids,[]));
  } finally {globalThis.fetch=originalFetch;cleanup();}
});

test('Markdown preserves paste formatting and blocks script/HTML, unsafe links and external image trackers',async()=>{
  const {renderToStaticMarkup}=await import('react-dom/server');const {Markdown}=await import('../src/components/cms/Markdown');
  const html=renderToStaticMarkup(<Markdown mediaBase="https://example.supabase.co" body={'# Heading\n\n**Bold** and *italic*\n\n- One\n- Two\n\n> Quote\n\n| A | B |\n| --- | --- |\n| C | D |\n\n[Bad](javascript:alert%281%29)\n\n![Tracker](https://evil.example/track.jpg)\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1) />'}/>);
  const view=new JSDOM(html).window.document;
  assert.equal(view.querySelector('h1'),null);assert.equal(view.querySelector('h2')?.textContent,'Heading');
  assert.equal(view.querySelector('strong')?.textContent,'Bold');assert.equal(view.querySelector('em')?.textContent,'italic');
  assert.equal(view.querySelectorAll('li').length,2);assert.equal(view.querySelectorAll('td').length,2);assert.ok(view.querySelector('blockquote'));
  assert.equal(view.querySelector('script'),null);assert.equal(view.querySelector('img'),null);assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('onerror'));
});
test('editor and Markdown preview hydrate without browser HTML parsing mismatches',async()=>{
  const {renderToString}=await import('react-dom/server');const {hydrateRoot}=await import('react-dom/client');const {act}=await import('@testing-library/react');
  const {ArticleEditor}=await import('../src/components/cms/ArticleEditor');const {ArticleView}=await import('../src/components/cms/ArticleView');
  const initial={...editorValue(null),title:'Prepared article',slug:'prepared-article',body:'## Heading\n\n| A | B |\n| --- | --- |\n| One | Two |',author:'Editor',excerpt:'A description'};
  for(const component of [<ArticleEditor key="editor" initial={initial} categories={[]} initialMedia={[]} mediaBase="https://example.supabase.co" siteOrigin="http://localhost:3000"/>,<ArticleView key="article" article={initial} media={null} mediaBase="https://example.supabase.co"/>]) {
    const host=document.createElement('div');host.innerHTML=renderToString(component);document.body.append(host);const errors:unknown[]=[];let root:ReturnType<typeof hydrateRoot>|undefined;
    try {await act(async()=>{root=hydrateRoot(host,component,{onRecoverableError:error=>errors.push(error)});});assert.deepEqual(errors,[]);}
    finally{await act(async()=>root?.unmount());host.remove();}
  }
});
test('editor warns about unsaved text, retains it on failure, then saves and publishes the same Markdown explicitly',async()=>{
  const {render,cleanup,waitFor}=await import('@testing-library/react');const userEvent=(await import('@testing-library/user-event')).default;
  const {ArticleEditor}=await import('../src/components/cms/ArticleEditor');const user=userEvent.setup({document});const originalFetch=globalThis.fetch;
  const initial={...editorValue(null),title:'Prepared article',slug:'prepared-article',author:'Editor',excerpt:'Description'};
  const sent:Record<string,unknown>[]=[];let fail=true;
  globalThis.fetch=async(_input,init)=>{const data=JSON.parse(String(init?.body));sent.push(data);return fail?Response.json({error:'Connection unavailable'},{status:503}):Response.json({article:{...data,id:'10000000-0000-4000-8000-000000000003',revision:1}});};
  const view=render(<ArticleEditor initial={initial} categories={[]} initialMedia={[]} mediaBase="https://example.supabase.co" siteOrigin="http://localhost:3000"/>);
  try {
    const markdown='## Heading\n\n**Pasted Markdown**\n\n- One\n- Two';await user.type(view.getByLabelText('Article body (Markdown)'),markdown);
    const event=new dom.window.Event('beforeunload',{cancelable:true});window.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
    await user.click(view.getByRole('button',{name:'Save draft'}));await waitFor(()=>assert.ok(view.getByRole('alert').textContent?.includes('Connection unavailable')));
    assert.equal((view.getByLabelText('Article body (Markdown)') as HTMLTextAreaElement).value,markdown);
    assert.equal(sent[0].status,'draft');fail=false;await user.click(view.getByRole('button',{name:'Publish article'}));
    await waitFor(()=>assert.ok(view.getByRole('status').textContent?.includes('saved and published')));assert.equal(sent[1].status,'published');assert.equal(sent[1].body,markdown);
    const clean=new dom.window.Event('beforeunload',{cancelable:true});window.dispatchEvent(clean);assert.equal(clean.defaultPrevented,false);
    await user.click(view.getByRole('button',{name:'Preview article'}));assert.ok(view.getByRole('heading',{name:'Heading'}));await user.click(view.getByRole('button',{name:/^Mobile$/}));assert.ok(document.querySelector('.cms-preview-mobile'));
  }finally{globalThis.fetch=originalFetch;cleanup();}
});
test('newly uploaded photographs survive closing the picker and pending saves cannot overwrite fresh typing',async()=>{
  const {render,cleanup,waitFor,act}=await import('@testing-library/react');const userEvent=(await import('@testing-library/user-event')).default;
  const {ArticleEditor}=await import('../src/components/cms/ArticleEditor');const user=userEvent.setup({document});const originalFetch=globalThis.fetch;
  const media={id:'20000000-0000-4000-8000-000000000001',storage_path:'20000000-0000-4000-8000-000000000001.webp',original_name:'Phone photograph',width:640,height:480,bytes:1000,sha256:'a'.repeat(64),created_at:'2026-10-13T12:00:00Z'};
  let finish:((response:Response)=>void)|undefined;let submitted:Record<string,unknown>={};
  globalThis.fetch=async(url,init)=>{
    if(String(url)==='/api/cms/media')return Response.json({media});
    submitted=JSON.parse(String(init?.body));return new Promise<Response>(resolve=>{finish=resolve;});
  };
  const view=render(<ArticleEditor initial={{...editorValue(null),title:'Mobile draft',slug:'mobile-draft'}} categories={[]} initialMedia={[]} mediaBase="/fixture" siteOrigin="http://localhost:3000"/>);
  try{
    await user.click(view.getByRole('button',{name:'Choose or upload image'}));await user.upload(view.getByLabelText('Choose a photograph'),new dom.window.File(['image bytes'],'phone.jpg',{type:'image/jpeg'}));
    await user.click(view.getByRole('button',{name:'Upload photograph'}));await waitFor(()=>assert.ok(view.getByRole('button',{name:'Use image'})));
    await user.click(view.getByRole('button',{name:'Use image'}));assert.ok(view.getByText(/Selected: Phone photograph/));
    await user.click(view.getByRole('button',{name:'Choose or upload image'}));assert.ok(view.getByRole('button',{name:'Use image'}));
    await user.click(view.getByRole('button',{name:'Save draft'}));assert.equal((document.querySelector('fieldset.cms-editor-grid') as HTMLFieldSetElement).disabled,true);
    await user.type(view.getByLabelText('Article title'),'Typing while saving');assert.equal((view.getByLabelText('Article title') as HTMLInputElement).value,'Mobile draft');
    await act(async()=>finish?.(Response.json({article:{...submitted,id:'10000000-0000-4000-8000-000000000003',revision:1}})));
    await waitFor(()=>assert.ok(view.getByRole('status').textContent?.includes('Draft saved')));assert.equal((document.querySelector('fieldset.cms-editor-grid') as HTMLFieldSetElement).disabled,false);
    assert.equal(submitted.featured_media_id,media.id);
  }finally{globalThis.fetch=originalFetch;cleanup();}
});
