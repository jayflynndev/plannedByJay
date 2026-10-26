import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { policies } from '../src/content/policies';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('offer cards and detail show party totals, supplier terms and one sash without inferring ATOL or collecting enquiries',async()=>{
  const {render,fireEvent,cleanup}=await import('@testing-library/react');
  const {OfferGrid,OfferDetail}=await import('../src/components/offers/OfferViews');
  const {emptyOffer}=await import('../src/lib/offers/schema');
  const {readFile}=await import('node:fs/promises');
  const style=document.createElement('style');
  style.textContent=(await readFile('src/app/globals.css','utf8')).replace('@import "tailwindcss";','');
  document.head.append(style);
  const offer:import('../src/lib/offers/schema').PublicOffer={...emptyOffer(),id:'60000000-0000-4000-8000-000000000001',reference:'PBJ-FIXTURE',title:'Synthetic sunshine break',slug:'synthetic-sunshine-break',country:'Spain',resort:'Tenerife',accommodation:'Fixture hotel',departure_date:'2099-01-01',nights:7,board_basis:'Fixture board',total_price_minor:240050,price_checked_on:'2026-10-26',mandatory_charges:'Known mandatory charges included in the party total.',sash:'jays-pick',archived:false,created_at:'2026-10-26',updated_at:'2026-10-26',published_at:'2026-10-26',image:'/images/home/hero.jpg',galleryImages:[],supplier:{id:'50000000-0000-4000-8000-000000000001',name:'Jet2holidays',legal_name:'Synthetic fixture company',business_address:'Fixture public address',website:'https://example.org',contact_email:'',contact_url:'https://example.org/contact',booking_conditions_url:'https://example.org/terms',atol_holder:'Should not be inferred',atol_number:'1234'}};
  try{
    const cards=render(<OfferGrid offers={[{...offer,departure_point:'Fixture airport',why_jay:'A personal reason for this selection.'}]}/>);
    for(const text of [offer.title,offer.accommodation,'Spain · Tenerife','1 Jan 2099 · From Fixture airport · 7 nights',offer.board_basis,'Price checked: 26 Oct 2026'])assert.ok(cards.getByText(text));
    assert.ok(cards.getByText('Jet2holidays'));assert.ok(cards.getByText(/A personal reason for this selection/));
    for(const link of cards.getAllByRole('link'))assert.notEqual(window.getComputedStyle(link).height,'100%','card links must not take up the whole card and push its copy outside');
    assert.ok(cards.getByText(/£2,400.50/));assert.ok(cards.getByText(/2 priced travellers/));assert.ok(cards.getByText(offer.mandatory_charges));
    assert.equal(cards.container.querySelectorAll('.offer-sash').length,1);assert.ok(cards.getByText("Jay's Pick"));
    assert.equal(cards.getByRole('link',{name:'View Holiday Details ↗'}).getAttribute('href'),'/holiday-offers/'+offer.slug);
    assert.equal(cards.getByRole('link',{name:'Supplier booking conditions'}).getAttribute('href'),'https://example.org/terms');
    assert.doesNotMatch(cards.container.textContent||'',/1234|Should not be inferred/);cleanup();
    const body='<p>The first saved description paragraph.</p><p>The second saved description paragraph.</p>';
    const detail=render(<OfferDetail offer={{...offer,body,why_jay:'A personal reason.',inclusions:'Saved inclusions.',exclusions:'Saved conditions.'}}/>);
    assert.ok(detail.getByRole('heading',{name:offer.title}));assert.ok(detail.container.querySelector('details.offer-supplier-information[open]'));
    const description=detail.getByRole('region',{name:'About this holiday'});
    assert.equal(description.previousElementSibling?.tagName,'DL');
    assert.equal(description.querySelector('.article-prose')?.innerHTML,body,'saved paragraphs remain intact');
    assert.equal(description.querySelectorAll('p').length,2);
    assert.ok(detail.getByRole('heading',{name:'Why Jay picked it'}));assert.ok(detail.getByRole('heading',{name:"What's included"}));assert.ok(detail.getByRole('heading',{name:'Important exclusions and conditions'}));
    assert.equal(detail.container.querySelector('a[href="/plan-my-holiday"]'),null);
    assert.ok(detail.container.querySelector('#ask-jay'));
    fireEvent.click(detail.getByRole('link',{name:'Ask Jay About This Holiday'}));assert.ok(detail.container.querySelector('details#ask-jay[open]'));
    for(const input of detail.container.querySelectorAll('#ask-jay input,#ask-jay textarea'))assert.ok(input.matches(':disabled'));
    assert.doesNotMatch(detail.container.textContent||'',/1234|Should not be inferred/);
    detail.rerender(<OfferDetail offer={offer}/>);assert.equal(detail.queryByRole('region',{name:'About this holiday'}),null);
    cleanup();
    const sameDay=render(<OfferGrid offers={[{...offer,nights:0}]}/>);assert.ok(sameDay.getByText(/Same-day trip/));
  }finally{cleanup();style.remove();}
});

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
