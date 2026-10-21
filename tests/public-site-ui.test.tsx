import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
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
