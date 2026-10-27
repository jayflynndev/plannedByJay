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
 const article={...emptyArticle(),id:'20000000-0000-4000-8000-000000000001',title:'A saved guide',slug:'saved-guide',body:'<p>Existing introduction.</p>',status:'published' as const,created_at:'2026-10-25T12:00:00Z',updated_at:'2026-10-25T12:00:00Z',published_at:'2026-10-25T12:00:00Z',version:1};
 globalThis.fetch=async(_,init)=>{const data=JSON.parse(String(init?.body));writes.push(data);return Response.json({article:{...article,...data,version:2}});};
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
  await waitFor(()=>assert.ok(view.getByText('Article changes saved successfully.')));
 }finally{globalThis.fetch=original;cleanup();}
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
