import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { policies } from '../src/content/policies';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('policy documents render semantic headings, real links, cookie inventory and a stable review date',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {PolicyDocument}=await import('../src/components/layout/PolicyDocument');
  try {
    for(const policy of Object.values(policies)) {
      const view=render(<PolicyDocument policy={policy}/>);
      assert.equal(view.getAllByRole('heading',{level:1}).length,1);
      assert.equal(view.getAllByRole('heading',{level:2}).length,policy.sections.length);
      assert.equal(view.container.querySelector('time')?.getAttribute('dateTime'),'2026-10-22');
      assert.ok(view.getByText('22 October 2026'));
      assert.ok(view.getAllByRole('link').every(link=>/^(https:\/\/|mailto:)/.test(link.getAttribute('href')||'')));
      for(const issue of policy.reviewRequired)assert.equal(view.queryByText(issue),null);
      assert.doesNotMatch(view.container.textContent || '', /before (?:this (?:notice|policy) can be|publication)|must (?:be )?(?:confirmed|checked).*publish|proposed basis|criteria to finalise|TODO/i);
      if(policy===policies.cookies){assert.ok(view.getByRole('heading',{name:'pbj-enquiry-session'}));assert.equal(view.container.querySelectorAll('dl').length,3);}
      cleanup();
    }
  }finally{cleanup();}
});
test('homepage previews render genuine article links, useful missing-image fallback and no sample empty state',async()=>{
  const {render,cleanup}=await import('@testing-library/react');const {TravelInspiration}=await import('../src/components/home/TravelInspiration');
  const articles=[{id:'one',title:'Saved CMS title',slug:'saved-cms-title',excerpt:'Saved CMS excerpt',content_type:'Travel advice',image:null}];
  const view=render(<TravelInspiration articles={articles}/>);
  try{assert.equal(view.getByRole('link',{name:/Saved CMS title/}).getAttribute('href'),'/travel-advice/saved-cms-title');assert.ok(view.getByText('Saved CMS excerpt'));
    assert.equal(document.querySelector('img'),null);assert.equal(view.queryByText(/Sample preview/),null);
    view.rerender(<TravelInspiration articles={[]}/>);assert.equal(view.container.innerHTML,'');
  }finally{cleanup();}
});
test('missing or replaced site images recover without inventing a photograph; the portrait has no public setup message',async()=>{
  const {render,cleanup,fireEvent}=await import('@testing-library/react');const {SiteImage}=await import('../src/components/ui/SiteImage');const {WhyJay}=await import('../src/components/home/WhyJay');
  const view=render(<SiteImage src="/images/jay/missing.jpg" alt="Portrait" width={400} height={500} fallback={<span>Brand panel</span>}/>);
  try{fireEvent.error(view.getByRole('img'));assert.ok(view.getByText('Brand panel'));
    view.rerender(<SiteImage src="/images/jay/replacement.jpg" alt="Portrait" width={400} height={500}/>);assert.ok(view.getByRole('img'));
    view.rerender(<WhyJay/>);assert.equal(view.queryByText(/Your photograph here|Development placeholder/),null);assert.equal(view.getByRole('link',{name:/Why book with Jay/}).getAttribute('href'),'/why-jay');
  }finally{cleanup();}
});


test('policy routes return not-found for unapproved or unresolved drafts and render after completed approval', async()=>{
  const {PolicyPage}=await import('../src/components/layout/PolicyPage');
  const {render,cleanup}=await import('@testing-library/react');
  const originals={...policies};
  try {
    for(const key of Object.keys(policies) as (keyof typeof policies)[]) {
      if(key==='booking-information')assert.doesNotThrow(()=>PolicyPage({policy:key}));
      policies[key]={...policies[key],approved:false};
      assert.throws(()=>PolicyPage({policy:key}),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
      policies[key]={...policies[key],approved:true};
      if(policies[key].reviewRequired.length)assert.throws(()=>PolicyPage({policy:key}),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
      policies[key]={...policies[key],reviewRequired:[]};
      const view=render(PolicyPage({policy:key}));
      assert.ok(view.getByRole('heading',{level:1,name:policies[key].title}));
      cleanup();
    }
  }finally{Object.assign(policies,originals);cleanup();}
});
