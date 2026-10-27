import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { policies } from '../src/content/policies';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('compact offer cards show party totals and references while full disclosures remain on the detail page',async()=>{
  const {render,fireEvent,cleanup}=await import('@testing-library/react');
  const {OfferGrid,OfferDetail}=await import('../src/components/offers/OfferViews');
  const {emptyOffer}=await import('../src/lib/offers/schema');
  const {readFile}=await import('node:fs/promises');
  const style=document.createElement('style');
  style.textContent=(await readFile('src/app/globals.css','utf8')).replace('@import "tailwindcss";','');
  document.head.append(style);
  const offer:import('../src/lib/offers/schema').PublicOffer={...emptyOffer(),id:'60000000-0000-4000-8000-000000000001',reference:'000042',title:'Synthetic sunshine break',slug:'synthetic-sunshine-break',country:'Spain',resort:'Tenerife',accommodation:'Fixture hotel',departure_date:'2099-01-01',nights:7,board_basis:'Fixture board',total_price_minor:240050,price_checked_on:'2026-10-26',mandatory_charges:'Known mandatory charges included in the party total.',sash:'jays-pick',archived:false,created_at:'2026-10-26',updated_at:'2026-10-26',published_at:'2026-10-26',image:'/images/home/hero.jpg',galleryImages:[],supplier:{id:'50000000-0000-4000-8000-000000000001',name:'Jet2holidays',legal_name:'Synthetic fixture company',business_address:'Fixture public address',website:'https://example.org',contact_email:'',contact_url:'https://example.org/contact',booking_conditions_url:'https://example.org/terms',atol_holder:'Should not be inferred',atol_number:'1234'}};
  try{
    const cards=render(<OfferGrid offers={[{...offer,departure_point:'Fixture airport',why_jay:'A personal reason for this selection.'}]}/>);
    for(const text of [offer.title,offer.accommodation,'Spain · Tenerife','1 Jan 2099','From Fixture airport','7 nights',offer.board_basis,'Price checked 26 Oct 2026','Offer reference: 000042'])assert.ok(cards.getByText(text));
    assert.ok(cards.getByText('Jet2holidays'));assert.ok(cards.getByText(/A personal reason for this selection/));
    for(const link of cards.getAllByRole('link'))assert.notEqual(window.getComputedStyle(link).height,'100%','card links must not take up the whole card and push its copy outside');
    assert.ok(cards.getByText(/£2,400.50/));assert.ok(cards.getByText('total'));assert.ok(cards.getByText('2 adults'));assert.ok(cards.getByText(offer.mandatory_charges));
    assert.equal(cards.container.querySelectorAll('.offer-sash').length,1);assert.ok(cards.getByText("Jay's Pick"));
    assert.equal(cards.getByRole('link',{name:'View Holiday'}).getAttribute('href'),'/holiday-offers/'+offer.slug);
    assert.equal(cards.queryByRole('link',{name:'Supplier booking conditions'}),null);
    assert.equal(cards.queryByRole('link',{name:'Supplier contact page'}),null);
    for(const text of [offer.supplier.legal_name,offer.supplier.business_address])assert.equal(cards.queryByText(text),null);
    const fullReason='These are the saved editorial words. '.repeat(12);
    cards.rerender(<OfferGrid offers={[{...offer,children:1,inclusions:'Free Child Place, Baggage included.',why_jay:fullReason}]}/>);
    assert.ok(cards.getByText('Free Child Place'));assert.ok(cards.getByText('2 adults + 1 child'));
    assert.ok((cards.container.querySelector('.offer-card-why')?.textContent||'').length<150);
    assert.doesNotMatch(cards.container.textContent||'',new RegExp(fullReason));
    assert.doesNotMatch(cards.container.textContent||'',/1234|Should not be inferred/);cleanup();
    const body='<p>The first saved description paragraph.</p><p>The second saved description paragraph.</p>';
    const detail=render(<OfferDetail offer={{...offer,body,why_jay:'A personal reason.',inclusions:'Saved inclusions.',exclusions:'Saved conditions.'}}/>);
    assert.ok(detail.getByRole('heading',{name:offer.title}));assert.equal(detail.container.querySelector('details.offer-supplier-information[open]'),null);
    fireEvent.click(detail.getByText('Supplier details and booking conditions'));
    assert.ok(detail.getByText('Offer reference: 000042'));assert.ok(detail.getAllByText(offer.supplier.business_address).length);
    assert.equal(detail.getAllByRole('link',{name:'Supplier booking conditions'}).length,1);
    assert.ok(detail.getAllByRole('link',{name:'Supplier booking conditions'}).every(a=>a.getAttribute('href')==='https://example.org/terms'));
    const description=detail.getByRole('region',{name:'About this holiday'});
    assert.ok(detail.getByRole('region',{name:'Holiday summary and price'}).compareDocumentPosition(description)&Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(description.querySelector('.article-prose')?.innerHTML,body,'saved paragraphs remain intact');
    assert.equal(description.querySelectorAll('p').length,2);
    assert.ok(detail.getByRole('heading',{name:'Why Jay picked it'}));assert.ok(detail.getByRole('heading',{name:"What's included"}));assert.ok(detail.getByRole('heading',{name:'Important conditions and exclusions'}));
    assert.equal(detail.container.querySelector('a[href="/plan-my-holiday"]'),null);
    assert.ok(detail.container.querySelector('#ask-jay'));
    fireEvent.click(detail.getByRole('link',{name:'Ask Jay about this holiday'}));assert.ok(detail.container.querySelector('details#ask-jay[open]'));
    for(const input of detail.container.querySelectorAll('#ask-jay input,#ask-jay textarea'))assert.ok(input.matches(':disabled'));
    assert.doesNotMatch(detail.container.textContent||'',/1234|Should not be inferred/);
    detail.rerender(<OfferDetail offer={offer}/>);assert.equal(detail.queryByRole('region',{name:'About this holiday'}),null);
    cleanup();
    const sameDay=render(<OfferGrid offers={[{...offer,nights:0}]}/>);assert.ok(sameDay.getByText(/Same-day trip/));
  }finally{cleanup();style.remove();}
});

test('holiday detail organises saved content once, formats clear inclusions, and omits empty optional sections',async()=>{
  const {render,cleanup}=await import('@testing-library/react');
  const {OfferDetail}=await import('../src/components/offers/OfferViews');
  const {emptyOffer}=await import('../src/lib/offers/schema');
  const offer:import('../src/lib/offers/schema').PublicOffer={...emptyOffer(),id:'60000000-0000-4000-8000-000000000001',reference:'000042',title:'Saved holiday',accommodation:'Saved accommodation',country:'Saved destination',total_price_minor:240600,adults:2,children:1,price_checked_on:'2026-10-26',inclusions:'Free Child Place, 22kg Baggage per person, Coach transfers to and from the hotel.',why_jay:'The full saved editorial text.',body:'<p>The saved first paragraph.</p><p>The saved second paragraph.</p>',exclusions:'Saved conditions.',protection:'supplier-atol',archived:false,created_at:'',updated_at:'',published_at:null,image:'/images/home/hero.jpg',galleryImages:[],supplier:{id:'50000000-0000-4000-8000-000000000001',name:'Saved supplier',legal_name:'Saved legal company',business_address:'Saved public address',website:'https://example.org',contact_email:'',contact_url:'https://example.org/contact',booking_conditions_url:'https://example.org/terms',atol_holder:'Saved holder',atol_number:'1234'}};
  try{
    const view=render(<OfferDetail offer={offer}/>);
    assert.deepEqual(Array.from(view.container.querySelectorAll('h2')).filter(h=>!h.closest('#ask-jay')).map(h=>h.textContent),['Price for your party','Your holiday at a glance','About this holiday',"What's included",'Why Jay picked it','Important conditions and exclusions','Supplier and price information']);
    assert.deepEqual(Array.from(view.getByRole('region',{name:"What's included"}).querySelectorAll('li')).map(li=>li.textContent),['Free Child Place','22kg Baggage per person','Coach transfers to and from the hotel.']);
    assert.equal(view.getAllByText(offer.why_jay).length,1);assert.equal(view.getAllByText(offer.supplier.business_address).length,1);
    assert.equal(view.getAllByText(/ATOL holder for this advertised arrangement/).length,1);
    assert.ok(view.getByText('2 adults + 1 child'));assert.match(view.container.querySelector('.offer-price-panel')?.textContent||'',/£2,406.00/);assert.ok(view.getByText('Offer reference: 000042'));
    assert.ok(view.container.querySelector('.offer-price-panel a[href="#ask-jay"]'));assert.ok(view.container.querySelector('#ask-jay > summary'));
    const paragraph='Meals, including breakfast, are served at the hotel. Please confirm dietary requirements.';
    view.rerender(<OfferDetail offer={{...offer,inclusions:paragraph}}/>);
    const inclusions=view.getByRole('region',{name:"What's included"});assert.equal(inclusions.querySelector('ul'),null);assert.equal(inclusions.querySelector('p')?.textContent,paragraph);
    view.rerender(<OfferDetail offer={{...offer,body:'<p>&nbsp;<br /></p>',inclusions:' ',why_jay:'',exclusions:'',image:null,galleryImages:[]}}/>);
    for(const name of ['About this holiday',"What's included",'Why Jay picked it','Important conditions and exclusions'])assert.equal(view.queryByRole('region',{name}),null);
    assert.equal(view.queryByRole('region',{name:'Holiday photographs'}),null);
  }finally{cleanup();}
});

test('holiday photographs enlarge, navigate saved images, and restore focus and scrolling on close',async()=>{
  const {render,fireEvent,cleanup}=await import('@testing-library/react');
  const {OfferGallery}=await import('../src/components/offers/OfferGallery');
  const prototype=dom.window.HTMLDialogElement.prototype,originalShow=prototype.showModal,originalClose=prototype.close;
  prototype.showModal=function(){this.open=true;this.querySelector<HTMLButtonElement>('button')?.focus();};
  prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'));};
  const photos=[1,2,3,4].map(i=>({src:`/images/holiday-${i}.jpg`,alt:`Saved photograph ${i}`}));
  try{
    const view=render(<OfferGallery photos={photos} sash="Jay's Pick"/>);
    assert.equal(view.container.querySelectorAll('.offer-photos-grid button').length,3);assert.ok(view.getByText('View all 4 photographs'));
    const first=view.getByRole('button',{name:'Enlarge photograph 1: Saved photograph 1'});first.focus();fireEvent.click(first);
    const dialog=view.getByRole('dialog',{name:'Enlarged holiday photographs'});
    assert.ok(view.getByText('Photograph 1 of 4 · Saved photograph 1'));assert.equal(document.body.style.overflow,'hidden');
    fireEvent.click(view.getByRole('button',{name:'Previous photograph'}));assert.ok(view.getByText('Photograph 4 of 4 · Saved photograph 4'));
    fireEvent.keyDown(dialog,{key:'ArrowRight'});assert.ok(view.getByText('Photograph 1 of 4 · Saved photograph 1'));
    fireEvent.click(view.getByRole('button',{name:'Close photographs'}));assert.equal(view.queryByRole('dialog'),null);assert.equal(document.activeElement,first);assert.equal(document.body.style.overflow,'');
    view.rerender(<OfferGallery photos={[photos[0]]}/>);assert.equal(view.container.querySelectorAll('.offer-photos-grid button').length,1);assert.equal(view.queryByText(/View all/),null);
    fireEvent.click(view.getByRole('button',{name:'Enlarge photograph 1: Saved photograph 1'}));assert.equal(document.body.style.overflow,'hidden');
    view.rerender(<OfferGallery photos={[]}/>);assert.equal(view.container.innerHTML,'');
    assert.equal(document.body.style.overflow,'','removing the photographs also releases the page scroll lock');
  }finally{cleanup();prototype.showModal=originalShow;prototype.close=originalClose;}
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

test('the privacy draft stays private and one approved policy links both disabled enquiry journeys',async()=>{
  const marker=require.resolve('server-only'),cached=require.cache[marker];
  require.cache[marker]={exports:{},id:marker,filename:marker,loaded:true} as NodeModule;
  const original=policies.privacy;
  const {render,fireEvent,cleanup}=await import('@testing-library/react');
  try{
    const {approvedPolicyHref}=await import('../src/content/policies');
    const {PolicyPage}=await import('../src/components/layout/PolicyPage');
    const {PolicyDocument}=await import('../src/components/layout/PolicyDocument');
    const {Footer}=await import('../src/components/layout/Footer');
    const {OfferEnquiryForm}=await import('../src/components/offers/OfferEnquiryForm');
    const {EnquiryForm}=await import('../src/components/enquiry/EnquiryForm');
    const {offerEnquiryAvailability}=await import('../src/lib/offers/enquiries');
    assert.equal(original.approved,false);assert.equal(original.updatedAt,null);
    assert.equal(approvedPolicyHref('privacy'),null);
    assert.throws(()=>PolicyPage({policy:'privacy'}),{digest:'NEXT_HTTP_ERROR_FALLBACK;404'});
    const footer=render(<Footer/>);assert.equal(footer.container.querySelector('a[href="/privacy"]'),null);cleanup();
    const preview=render(<PolicyDocument policy={original}/>);
    for(const text of ['Supabase','Resend','Microsoft 365','12 calendar months','read-only preview','legitimate interests'])assert.ok(preview.container.textContent?.includes(text));
    assert.doesNotMatch(preview.container.textContent||'',/pbj-enquiry-session|Turnstile|VHUB|erase_holiday_enquiry/);
    for(const issue of original.reviewRequired)assert.equal(preview.queryByText(issue),null);
    cleanup();
    // Approval is simulated only in this test; it must not open either submission gate.
    policies.privacy={...original,approved:true,reviewRequired:[],updatedAt:'2026-10-27'};
    const href=approvedPolicyHref('privacy');assert.equal(href,'/privacy');
    const page=render(PolicyPage({policy:'privacy'}));assert.ok(page.getByRole('heading',{name:'Privacy Policy',level:1}));cleanup();
    const publishedFooter=render(<Footer/>);assert.ok(publishedFooter.container.querySelector('a[href="/privacy"]'));cleanup();
    const offer=render(<OfferEnquiryForm offerId="60000000-0000-4000-8000-000000000001" privacyHref={href}/>);
    fireEvent.click(offer.container.querySelector('summary')!);
    assert.ok(offer.container.querySelector('a[href="/privacy"]'));
    for(const field of offer.container.querySelectorAll('input,textarea'))assert.ok(field.matches(':disabled'));
    assert.equal(offer.container.querySelector('input[type="checkbox"]'),null);cleanup();
    const brief=render(<EnquiryForm privacyHref={href}/>);
    for(let stage=0;stage<2;stage++)fireEvent.click(brief.getByRole('button',{name:/View next stage/}));
    assert.ok(brief.container.querySelector('a[href="/privacy"]'));
    for(const field of brief.container.querySelectorAll('input,textarea,select'))assert.ok(field.matches(':disabled'));
    assert.ok(brief.getByRole('button',{name:/Enquiries unavailable/}).matches(':disabled'));
    assert.equal(offerEnquiryAvailability().enabled,false);
  }finally{
    policies.privacy=original;cleanup();
    if(cached)require.cache[marker]=cached;else delete require.cache[marker];
  }
});
