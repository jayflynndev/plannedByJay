import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { policies } from '../src/content/policies';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('holiday landing, six shared pages and homepage cards render meaningful routes with accessible headings and real related reading only',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {HolidayLanding,HolidayTypePage}=await import('../src/components/holidays/HolidayPages');
  const {HolidayExperiences}=await import('../src/components/home/HolidayExperiences');
  const {default:originals}=await import('./helpers/holiday-originals.json');
  const {holidayInput}=await import('../src/lib/holiday-types/schema');
  const holidayTypes=originals.map(h=>({...holidayInput.parse({name:h.name,slug:h.slug,heading:h.heading,introduction:h.introduction,image:h.image,image_alt:h.image_alt,body:'<h2>Introduction</h2><p>Useful detail.</p><h2>Things worth thinking through</h2><h3>Practical details</h3><p>Planning advice.</p><h2>Styles to explore</h2><h3>An idea</h3><p>More advice.</p>'}),photoUrl:h.image}));
  try {
    const landing=render(<HolidayLanding holidays={holidayTypes}/>);assert.equal(landing.getAllByRole('heading',{level:1}).length,1);
    assert.equal(landing.getByRole('link',{name:'View All Holiday Offers'}).getAttribute('href'),'/holiday-offers');for(const item of holidayTypes)assert.ok(landing.container.querySelector(`a[href="/holidays/${item.slug}"]`));cleanup();
    const home=render(<HolidayExperiences holidays={holidayTypes}/>);assert.equal(home.container.querySelectorAll('a[href^="/holidays/"]').length,6);assert.equal(home.container.querySelector('a[href="/plan-my-holiday"]'),null);cleanup();
    for(const item of holidayTypes){
      const page=render(<HolidayTypePage holiday={item}/>);
      assert.equal(page.getAllByRole('heading',{level:1}).length,1);assert.ok(page.getByRole('heading',{level:1,name:item.heading}));
      assert.ok(page.getAllByRole('link',{name:'Plan My Holiday'}).every(a=>a.getAttribute('href')==='/plan-my-holiday'));
      assert.equal(page.queryByText('Useful reading for this kind of holiday'),null);
      assert.equal(page.container.querySelectorAll('details summary').length,0);assert.equal(page.queryByText(/common questions/i),null);assert.ok(page.container.querySelector('.holiday-planning-grid'));assert.ok(page.container.querySelector('.holiday-ideas-grid'));cleanup();
    }
    const related=render(<HolidayTypePage holiday={holidayTypes[0]} articles={[{id:'fixture',title:'A real published guide',slug:'published-guide',excerpt:'Useful advice',content_type:'Travel advice',image:null}]}/>);
    assert.ok(related.getByRole('link',{name:/A real published guide/}));assert.ok(related.getByRole('heading',{name:'Useful reading for this kind of holiday'}));
  } finally{cleanup();}
});

test('public discovery has labelled GET filters, shared pagination, reset, empty and unavailable states',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {ArticleDiscovery}=await import('../src/components/articles/ArticleDiscovery');

  const {discoveryCopy}=await import('../src/content/articles');
  const tag={id:'30000000-0000-4000-8000-000000000001',name:'Japan'};
  const query={q:'Japan',tag:tag.id,type:'',category:'',page:1};
  const empty={total:0,articles:[],categories:[],tags:[tag],types:['Travel advice','Rail itinerary']};
  try {
    const view=render(<ArticleDiscovery query={query} results={empty}/>);
    assert.equal(view.getByRole('form',{name:'Find travel articles'}).getAttribute('method'),'get');
    assert.equal((view.getByLabelText('Search articles') as HTMLInputElement).value,'Japan');

    assert.equal(view.getByRole('link',{name:'Reset filters'}).getAttribute('href'),'/travel-advice');
    assert.ok(view.getByText(discoveryCopy.noResults));

    view.rerender(<ArticleDiscovery query={query} results={{...empty,total:25}}/>);
    const href=view.getByRole('link',{name:'Next page'}).getAttribute('href')||'';
    assert.ok(href.includes('q=Japan')&&href.includes('tag=')&&href.includes('page=2'));
    view.rerender(<ArticleDiscovery query={query} results={null} error={discoveryCopy.unavailable}/>);
    assert.ok(view.getByRole('alert').textContent?.includes('temporarily unavailable'));
    assert.equal(view.queryByText(discoveryCopy.noResults),null,'failure is not an empty result');
    view.rerender(<ArticleDiscovery query={{q:'',tag:'',type:'',category:'',page:1}} results={empty}/>);
    assert.equal((view.getByLabelText('Search articles') as HTMLInputElement).value,'','reset navigation remounts uncontrolled fields');

  } finally {cleanup();}
});

test('policy layouts retain semantic headings, real links and reviewed dates without obsolete cookie claims',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {PolicyDocument}=await import('../src/components/layout/PolicyDocument');
  try {
    for(const policy of Object.values(policies)) {
      const view=render(<PolicyDocument policy={policy}/>);
      assert.equal(view.getAllByRole('heading',{level:1}).length,1);
      assert.equal(view.queryAllByRole('heading',{level:2}).length,policy.sections.length);
      assert.equal(view.container.querySelector('time')?.getAttribute('dateTime')||null,policy.updatedAt);
      if(policy.updatedAt)assert.ok(view.getByText('22 October 2026'));
      assert.ok(view.queryAllByRole('link').every(link=>/^(https:\/\/|mailto:)/.test(link.getAttribute('href')||'')));
      for(const issue of policy.reviewRequired)assert.equal(view.queryByText(issue),null);
      assert.doesNotMatch(view.container.textContent || '', /before (?:this (?:notice|policy) can be|publication)|must (?:be )?(?:confirmed|checked).*publish|proposed basis|criteria to finalise|TODO/i);

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
      policies[key]={...policies[key],reviewRequired:[],updatedAt:'2026-10-25',sections:policies[key].sections.length?policies[key].sections:[{heading:'Reviewed test policy',paragraphs:['Synthetic reviewed policy text for this test only.']}]};
      const view=render(PolicyPage({policy:key}));
      assert.ok(view.getByRole('heading',{level:1,name:policies[key].title}));
      cleanup();
    }
  }finally{Object.assign(policies,originals);cleanup();}
});
