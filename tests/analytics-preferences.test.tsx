import test from 'node:test';
import assert from 'node:assert/strict';
import {useEffect} from 'react';
import {JSDOM} from 'jsdom';
import type {BeforeSend, BeforeSendEvent} from '@vercel/analytics/next';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://plannedbyjay.com'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const marker=require.resolve('server-only');require.cache[marker]={id:marker,filename:marker,loaded:true,exports:{}} as NodeModule;
// Retain the SDK's installed event filter when its component unmounts, like the real script.
let filter:BeforeSend|undefined,mounts=0;
function installedFilter(): BeforeSend {assert.ok(filter, 'The SDK installed its event filter');return filter;}
function RetainedAnalytics({beforeSend}:{beforeSend:BeforeSend}){useEffect(()=>{filter=beforeSend;mounts++;},[beforeSend]);return null;}
const sdk=require.resolve('@vercel/analytics/next');require.cache[sdk]={id:sdk,filename:sdk,loaded:true,exports:{Analytics:RetainedAnalytics}} as NodeModule;
const pageview:BeforeSendEvent={type:'pageview',url:'https://plannedbyjay.com/holiday-offers'};

test('analytics objection stops an already-loaded script immediately and survives navigation, remount, reload state and other tabs',async()=>{
 const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
 const {AnalyticsPreferencesProvider,AnalyticsPreferences}=await import('../src/components/analytics/AnalyticsPreferences');
 const {ANALYTICS_PREFERENCE_KEY}=await import('../src/lib/analytics-preference');
 window.localStorage.clear();mounts=0;filter=undefined;
 const content=(page:string)=><AnalyticsPreferencesProvider defaultEnabled><p>{page}</p><AnalyticsPreferences/><AnalyticsPreferences/></AnalyticsPreferencesProvider>;
 try{
  const view=render(content('First page'));
  await waitFor(()=>assert.equal(view.getAllByRole('checkbox').every(input=>(input as HTMLInputElement).checked),true));
  assert.equal(window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY),null,'capability check leaves no preference for an undecided visitor');
  await waitFor(()=>assert.equal(mounts,1));assert.deepEqual(installedFilter()(pageview),pageview);
  const retained=installedFilter();fireEvent.click(view.getAllByRole('checkbox')[0]);
  assert.equal(retained(pageview),null,'the old script is blocked before another navigation');
  assert.equal(window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY),'off');
  assert.equal(view.getAllByRole('checkbox').every(input=>!(input as HTMLInputElement).checked),true);
  view.rerender(content('Next page'));assert.equal(retained({...pageview,url:'https://plannedbyjay.com/privacy'}),null);assert.equal(mounts,1);
  cleanup();
  const reload=render(content('Reloaded page'));await waitFor(()=>assert.match(reload.getAllByRole('status')[0].textContent||'',/Analytics is off/));assert.equal(mounts,1,'stored objection never mounts Analytics');
  fireEvent.click(reload.getAllByRole('checkbox')[1]);await waitFor(()=>assert.equal(mounts,2));assert.equal(window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY),'on');assert.deepEqual(installedFilter()(pageview),pageview);
  window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY,'off');assert.equal(installedFilter()(pageview),null,'cross-tab objection wins even before the storage event is delivered');
  fireEvent(window,new dom.window.StorageEvent('storage',{key:ANALYTICS_PREFERENCE_KEY,newValue:'off'}));
  assert.equal(reload.getAllByRole('checkbox').every(input=>!(input as HTMLInputElement).checked),true);
 }finally{cleanup();window.localStorage.clear();}
});

test('without published-policy default permission, analytics stays off until explicitly enabled',async()=>{
 const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
 const {AnalyticsPreferencesProvider,AnalyticsPreferences}=await import('../src/components/analytics/AnalyticsPreferences');
 window.localStorage.clear();mounts=0;
 try{
  const view=render(<AnalyticsPreferencesProvider defaultEnabled={false}><AnalyticsPreferences/></AnalyticsPreferencesProvider>);
  await waitFor(()=>assert.match(view.getByRole('status').textContent||'',/Analytics is off/));assert.equal(mounts,0);
  fireEvent.click(view.getByRole('checkbox'));await waitFor(()=>assert.equal(mounts,1));assert.deepEqual(installedFilter()(pageview),pageview);
 }finally{cleanup();window.localStorage.clear();}
});

test('blocked or silently read-only storage fails closed, including a previously enabled preference',async()=>{
 const {render,waitFor,cleanup}=await import('@testing-library/react');
 const {AnalyticsPreferencesProvider,AnalyticsPreferences}=await import('../src/components/analytics/AnalyticsPreferences');
 const {ANALYTICS_PREFERENCE_KEY}=await import('../src/lib/analytics-preference');
 const prototype=dom.window.Storage.prototype,setItem=prototype.setItem;
 window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY,'on');
 try{
  for(const silent of [false,true]){
   prototype.setItem=function(){if(!silent)throw new dom.window.DOMException('Storage blocked','SecurityError');};mounts=0;
   const view=render(<AnalyticsPreferencesProvider defaultEnabled><AnalyticsPreferences/></AnalyticsPreferencesProvider>);
   await waitFor(()=>assert.match(view.getByRole('status').textContent||'',/cannot save/));assert.equal((view.getByRole('checkbox') as HTMLInputElement).disabled,true);assert.equal(mounts,0);
   assert.equal(installedFilter()(pageview),null);cleanup();
  }
 }finally{prototype.setItem=setItem;cleanup();window.localStorage.clear();}
});

test('published Cookies Policy and footer display working synchronised controls while unapproved wording stays private',async()=>{
 const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
 const {AnalyticsPreferencesProvider}=await import('../src/components/analytics/AnalyticsPreferences');
 const {PolicyPage}=await import('../src/components/layout/PolicyPage');
  const {Footer}=await import('../src/components/layout/Footer');
 const {policies}=await import('../src/content/policies');const original=policies.cookies;
 try{
  policies.cookies={...original,approved:false};assert.throws(()=>PolicyPage({policy:'cookies'}),/404/);
  policies.cookies=original;
  window.localStorage.clear();const view=render(<AnalyticsPreferencesProvider defaultEnabled>{PolicyPage({policy:'cookies'})}<Footer/></AnalyticsPreferencesProvider>);
  assert.ok(view.getByRole('heading',{level:1,name:'Cookies Policy'}));
  assert.equal(view.container.querySelector('time')?.dateTime,'2026-10-29');
  assert.ok(view.getByRole('link',{name:'Cookies Policy'}).getAttribute('href')==='/cookies');
  assert.match(view.container.textContent||'',/400 days/);
  assert.match(view.container.textContent||'',/pbj\.analytics/);
  assert.match(view.container.textContent||'',/Cookieless website analytics/);
  assert.ok(view.container.querySelector('#cookie-analytics-preferences'));
  await waitFor(()=>assert.equal(view.getAllByRole('checkbox').every(input=>(input as HTMLInputElement).checked),true));
  fireEvent.click(view.getAllByRole('checkbox')[0]);assert.equal(installedFilter()(pageview),null);
  assert.equal(view.getAllByRole('checkbox').every(input=>!(input as HTMLInputElement).checked),true);
  fireEvent.click(view.getAllByRole('checkbox')[1]);assert.deepEqual(installedFilter()(pageview),pageview);
 }finally{policies.cookies=original;cleanup();window.localStorage.clear();}
});
