import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { policies } from '../src/content/policies';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('public discovery has labelled GET filters, shared pagination, reset, empty and unavailable states',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {ArticleDiscovery}=await import('../src/components/cms/ArticleDiscovery');
  const {parseDiscoveryQuery}=await import('../src/lib/cms/discovery-query');
  const {discoveryCopy}=await import('../src/content/cms');
  const tag={id:'30000000-0000-4000-8000-000000000001',name:'Japan'};
  const {query}=parseDiscoveryQuery({q:'Japan',tag:tag.id});
  const empty={total:0,articles:[],categories:[],tags:[tag],types:['Travel advice','Rail itinerary']};
  try {
    const view=render(<ArticleDiscovery query={query} results={empty}/>);
    assert.equal(view.getByRole('form',{name:'Find travel articles'}).getAttribute('method'),'get');
    assert.equal((view.getByLabelText('Search articles') as HTMLInputElement).value,'Japan');
    assert.equal((view.getByLabelText('Tag or destination') as HTMLSelectElement).value,tag.id);
    assert.equal(view.getByRole('link',{name:'Reset filters'}).getAttribute('href'),'/travel-advice');
    assert.ok(view.getByText(discoveryCopy.noResults));
    assert.ok(view.getByRole('option',{name:'Rail itinerary'}),'public filter recognises registry additions');
    view.rerender(<ArticleDiscovery query={query} results={{...empty,total:25}}/>);
    const href=view.getByRole('link',{name:'Next page'}).getAttribute('href')||'';
    assert.ok(href.includes('q=Japan')&&href.includes('tag=')&&href.includes('page=2'));
    view.rerender(<ArticleDiscovery query={query} results={null} error={discoveryCopy.unavailable}/>);
    assert.ok(view.getByRole('alert').textContent?.includes('temporarily unavailable'));
    assert.equal(view.queryByText(discoveryCopy.noResults),null,'failure is not an empty result');
    view.rerender(<ArticleDiscovery query={parseDiscoveryQuery({}).query} results={empty}/>);
    assert.equal((view.getByLabelText('Search articles') as HTMLInputElement).value,'','reset navigation remounts uncontrolled fields');
    assert.equal((view.getByLabelText('Tag or destination') as HTMLSelectElement).value,'');
  } finally {cleanup();}
});

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
