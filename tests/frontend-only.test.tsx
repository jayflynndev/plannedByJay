import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('Holiday Brief remains a disabled three-stage presentation and cannot collect or send answers',async()=>{
 const {render,fireEvent,cleanup}=await import('@testing-library/react');const {EnquiryForm}=await import('../src/components/enquiry/EnquiryForm');
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('No network allowed');};
 try{const view=render(<EnquiryForm/>);assert.match(view.getByRole('status').textContent||'',/read-only preview/);
 for(let stage=0;stage<3;stage++){
   for(const field of view.container.querySelectorAll('input,select,textarea'))assert.ok(field.matches(':disabled'));
   if(stage<2)fireEvent.click(view.getByRole('button',{name:'View next stage'}));
 }
 assert.equal((view.getByRole('button',{name:'Enquiries unavailable'}) as HTMLButtonElement).disabled,true);
 fireEvent.submit(view.getByRole('form'));assert.equal(calls,0);assert.equal(view.queryByText(/has been received/),null);
 }finally{globalThis.fetch=original;cleanup();}
});

test('public listings have honest empty states and archived content URLs return not-found',async()=>{
 const {render,cleanup}=await import('@testing-library/react');const {default:Offers}=await import('../src/app/holiday-offers/page');
 try{const offers=render(<Offers/>);assert.ok(offers.getByRole('heading',{name:'All Holiday Offers'}));assert.ok(offers.getByText(/no current offers/i));cleanup();
 const {default:OldOffer}=await import('../src/app/holiday-offers/[slug]/page');assert.throws(()=>OldOffer(),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
 }finally{cleanup();}
});

test('no offer or enquiry backend is introduced alongside the authorised supplier directory',async()=>{
 for(const path of ['src/lib/enquiries','src/lib/offers','src/app/api/enquiries','src/app/api/cms','src/components/offers/OfferEditor.tsx'])await assert.rejects(access(path));
 const form=await readFile('src/components/enquiry/EnquiryForm.tsx','utf8');assert.doesNotMatch(form,/fetch\(|localStorage|sessionStorage/);
 const migrations=await readdir('supabase/migrations');assert.deepEqual(migrations,['20261025_articles_cms.sql','20261026_holiday_types_cms.sql','20261026_suppliers_directory.sql']);
});
