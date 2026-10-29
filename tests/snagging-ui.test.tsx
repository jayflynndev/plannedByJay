import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {emptyOffer,emptyOfferQuery} from '../src/lib/offers/schema';
const marker=require.resolve('server-only');require.cache[marker]={exports:{},id:marker,filename:marker,loaded:true} as NodeModule;
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver,DOMParser:dom.window.DOMParser,getComputedStyle:dom.window.getComputedStyle});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
dom.window.Range.prototype.getClientRects=()=>[] as unknown as DOMRectList;
dom.window.Range.prototype.getBoundingClientRect=()=>({top:0,bottom:0,left:0,right:0,width:0,height:0,x:0,y:0,toJSON:()=>({})});
dom.window.HTMLElement.prototype.getBoundingClientRect=()=>({top:0,bottom:0,left:0,right:0,width:0,height:0,x:0,y:0,toJSON:()=>({})});

test('published article saves changes, independently stores placement, and pastes/edits table cells safely',async()=>{
 const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');const {ArticleEditor}=await import('../src/components/articles/ArticleEditor');const {emptyArticle}=await import('../src/lib/articles/schema');
 const original=fetch,writes:Record<string,unknown>[]=[];
 let finish!:(response:Response)=>void;
 const article={...emptyArticle(),id:'20000000-0000-4000-8000-000000000001',title:'A saved guide',slug:'saved-guide',body:'<p>Existing introduction.</p>',status:'published' as const,created_at:'2026-10-25T12:00:00Z',updated_at:'2026-10-25T12:00:00Z',published_at:'2026-10-25T12:00:00Z',version:1};
 globalThis.fetch=async(_,init)=>{const data=JSON.parse(String(init?.body));writes.push(data);return new Promise<Response>(resolve=>{finish=resolve;});};
 try{
  const view=render(<ArticleEditor initial={article} initialCategories={[]}/>);await waitFor(()=>assert.ok(view.getByRole('textbox',{name:'Article body'})));
  assert.ok(view.getByText('Published'));assert.equal(view.queryByRole('button',{name:'Publish'}),null);
  fireEvent.click(view.getByLabelText('Feature on Homepage'));assert.equal((view.getByLabelText('Pin to Top of Travel Advice') as HTMLInputElement).checked,false);
  fireEvent.click(view.getByLabelText('Pin to Top of Travel Advice'));
  const body=view.getByRole('textbox',{name:'Article body'});fireEvent.focus(body);
  fireEvent.paste(body,{clipboardData:{types:['text/html','text/plain'],getData:(type:string)=>type==='text/html'?'<table><tr><th>Destination</th><th>Notes</th></tr><tr><td>Italy</td><td><strong>Original detail</strong></td></tr></table>':'Destination Notes Italy Original detail'}});
  await waitFor(()=>assert.ok(body.querySelector('table th')));assert.equal(body.querySelectorAll('td').length,2);
  const cell=body.querySelector('td p')||body.querySelector('td')!;cell.textContent='Updated cell';fireEvent.input(cell);
  const editor=(body as HTMLElement&{editor:import('@tiptap/core').Editor}).editor;
  await waitFor(()=>assert.match(editor.getHTML(),/Updated cell/));
  fireEvent.click(view.getByRole('button',{name:'Save Changes'}));await waitFor(()=>assert.equal(writes.length,1));
  assert.equal(writes[0].homepage_featured,true);assert.equal(writes[0].advice_pinned,true);assert.equal(writes[0].status,'published');assert.match(String(writes[0].body),/<table/);assert.match(String(writes[0].body),/Updated cell/);
  assert.equal(view.queryByText('Article changes saved successfully.'),null);
  assert.ok(view.getByRole('button',{name:'Save Changes'}).matches(':disabled'));
  finish(Response.json({article:{...article,...writes[0],version:2}}));
  await waitFor(()=>assert.ok(view.getByText('Article changes saved successfully.')));
  assert.equal(view.getByRole('status').parentElement,document.activeElement,'completed feedback is brought into view and focus');
  fireEvent.change(view.getByLabelText('Article title'),{target:{value:'Further changes'}});
  fireEvent.click(view.getByRole('button',{name:'Save Changes'}));
  finish(Response.json({error:'Temporary save failure. Please try again.'},{status:503}));
  await waitFor(()=>assert.match(view.getByRole('alert').textContent||'',/Temporary save failure/));
  assert.equal(view.queryByText('Article changes saved successfully.'),null);
  assert.equal((view.getByLabelText('Article title') as HTMLInputElement).value,'Further changes');
 }finally{globalThis.fetch=original;cleanup();}
});

test('edited Holiday Type sections alternate cream and sage without changing rich text or grids',async()=>{
 const {render,cleanup}=await import('@testing-library/react');
 const {HolidayTypePage}=await import('../src/components/holidays/HolidayPages');
 const {emptyHoliday}=await import('../src/lib/holiday-types/schema');
 const {readFile}=await import('node:fs/promises');
 const style=document.createElement('style');
 style.textContent=(await readFile('src/app/content.css','utf8')).replaceAll('var(--paper)','#f8f6ef').replaceAll('var(--sage)','#e8ede4');document.head.append(style);
 const body='<h2>First section</h2><p>A <strong>formatted</strong> introduction.</p><h2>Second section</h2><p>More detail.</p><h2>Planning</h2><h3>First tip</h3><p>Saved tip.</p><h2>Ideas</h2><h3>Second tip</h3><p>Saved idea.</p>';
 try{
  for(const preview of [false,true]){
   const view=render(<HolidayTypePage holiday={{...emptyHoliday(),name:'Fixture holiday',body,photoUrl:null}} preview={preview}/>);
   const sections=Array.from(view.container.querySelectorAll('.holiday-type-page > .section:not(.cta)'));
   assert.equal(sections.length,5);
   sections.forEach((section,index)=>assert.equal(window.getComputedStyle(section).backgroundColor,index%2?'rgb(232, 237, 228)':'rgb(248, 246, 239)'));
   assert.equal(Array.from(view.container.querySelectorAll('.holiday-rich-text')).map(el=>el.innerHTML).join(''),body);
   assert.equal(view.container.querySelectorAll('.holiday-planning-grid').length,1);
   assert.equal(view.container.querySelectorAll('.holiday-ideas-grid').length,1);
   cleanup();
  }
 }finally{cleanup();style.remove();}
});

test('Travel Advice main sections alternate colours and retain saved formatting',async()=>{
 const {render,cleanup}=await import('@testing-library/react');
 const {ArticleView}=await import('../src/components/articles/ArticleView');
 const {readFile}=await import('node:fs/promises');
 const style=document.createElement('style');style.textContent=(await readFile('src/app/content.css','utf8')).replaceAll('var(--paper)','#f8f6ef').replaceAll('var(--sage)','#e8ede4');document.head.append(style);
 const body='<p>A <strong>saved introduction</strong>.</p><h2>Planning</h2><p>First detail.</p><h3>Practical tip</h3><ul><li>Keep this list.</li></ul><h2>Ideas</h2><p><em>Saved ideas.</em></p>';
 try{
  const view=render(<ArticleView article={{title:'Fixture guide',excerpt:'Introduction',body,author:'',content_type:'Travel advice',featured_alt:''}} media={null}/>);
  const sections=Array.from(view.container.querySelectorAll('.article-body-section'));
  assert.equal(sections.length,3);
  sections.forEach((section,index)=>assert.equal(window.getComputedStyle(section).backgroundColor,index%2?'rgb(232, 237, 228)':'rgb(248, 246, 239)'));
  assert.equal(Array.from(view.container.querySelectorAll('.article-prose')).map(el=>el.innerHTML).join(''),body);
  assert.ok(sections[1].querySelector('h3'));
  assert.ok(view.getByRole('link',{name:/Plan My Holiday/}));
 }finally{cleanup();style.remove();}
});

test('all offer filter controls reset together and a single result has the right label',async()=>{
 const {render,fireEvent,cleanup}=await import('@testing-library/react');const {OffersListing}=await import('../src/components/offers/OfferViews');
 const type='b0000000-0000-4000-8000-000000000001';
 const offer={...emptyOffer(),id:'60000000-0000-4000-8000-000000000001',reference:'012345',title:'Fixture holiday',archived:false,created_at:'',updated_at:'',published_at:null,image:null,galleryImages:[],supplier:{id:'50000000-0000-4000-8000-000000000001',name:'Fixture',website:'',legal_name:'',business_address:'',contact_email:'',contact_url:'',booking_conditions_url:'',atol_holder:'',atol_number:''}};
 try{
 const view=render(<OffersListing query={{destination:'Spain',type,month:'2099-02',sort:'price',page:2}} offers={[offer]} total={1} holidayTypes={[{id:type,name:'Family'}]}/>);
 assert.ok(view.getByText('1 offer · Page 2'));fireEvent.change(view.getByLabelText('Destination'),{target:{value:'Edited locally'}});
 assert.equal(view.getByRole('link',{name:'Reset filters'}).getAttribute('href'),'/holiday-offers');
 view.rerender(<OffersListing query={emptyOfferQuery} offers={[offer]} total={1} holidayTypes={[{id:type,name:'Family'}]}/>);
 for(const label of ['Destination','Holiday Type','Departure month'])assert.equal((view.getByLabelText(label) as HTMLInputElement).value,'');assert.equal((view.getByLabelText('Sort by') as HTMLSelectElement).value,'departure');
 }finally{cleanup();}
});
