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
 const {render,cleanup}=await import('@testing-library/react');const {default:Advice}=await import('../src/app/travel-advice/page');const {default:Offers}=await import('../src/app/holiday-offers/page');
 try{const advice=render(<Advice/>);assert.ok(advice.getByRole('heading',{level:1}));assert.ok(advice.getByText('New travel articles will appear here when they are published.'));cleanup();const offers=render(<Offers/>);assert.ok(offers.getByRole('heading',{name:'All Holiday Offers'}));assert.ok(offers.getByText(/no current offers/i));cleanup();
 const {default:OldArticle}=await import('../src/app/travel-advice/[slug]/page');const {default:OldOffer}=await import('../src/app/holiday-offers/[slug]/page');assert.throws(()=>OldArticle(),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});assert.throws(()=>OldOffer(),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
 }finally{cleanup();}
});

test('backend routes, services and dependencies are absent from the working application',async()=>{
 for(const path of ['src/app/admin','src/app/api','src/proxy.ts','src/lib/cms','src/lib/enquiries','src/lib/offers','supabase/migrations'])await assert.rejects(access(path));
 async function inspect(dir:string):Promise<void>{for(const item of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+item.name;if(item.isDirectory())await inspect(path);else if(/\.[jt]sx?$/.test(path)){const text=await readFile(path,'utf8');assert.doesNotMatch(text,/@supabase|@tiptap|fetch\(|localStorage|sessionStorage|SUPABASE_|RESEND_|ENQUIRIES_ENABLED|CMS_ENABLED/,path);}}}
 await inspect('src');const pkg=JSON.parse(await readFile('package.json','utf8'));assert.ok(!Object.keys({...pkg.dependencies,...pkg.devDependencies}).some(k=>/^@supabase|^@tiptap|pglite|dompurify|^zod$/.test(k)));
});
