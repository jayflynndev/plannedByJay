import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {randomUUID} from 'node:crypto';
import {emptyBrief,briefSchema,briefSnapshot,BESPOKE_REFERENCE_FORMAT} from '../src/lib/enquiries/schema';
const marker=require.resolve('server-only');require.cache[marker]={exports:{},id:marker,filename:marker,loaded:true} as NodeModule;
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:3000'});
Object.assign(globalThis,{window:dom.window,self:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});

test('existing three stages validate, review and edit answers, retain failures and acknowledge a pending saved brief once',async()=>{
  const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
  const {EnquiryForm}=await import('../src/components/enquiry/EnquiryForm');
  const fetch=globalThis.fetch,bodies:Record<string,unknown>[]=[];
  let resolve:((value:Response)=>void)|undefined;
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,'/api/enquiries');assert.equal(new Headers(init?.headers).get('X-Bespoke-Reference-Format'),BESPOKE_REFERENCE_FORMAT);bodies.push(JSON.parse(String(init?.body)));
    if(bodies.length===1)return Response.json({error:'Fixture storage failure; please retry.'},{status:503});
    return new Promise<Response>(r=>{resolve=r;});
  };
  try{
    const view=render(<EnquiryForm privacyHref="/privacy" enabled/>);
    const fill=(label:string,value:string)=>fireEvent.change(view.getByLabelText(label),{target:{value}});
    const next=()=>fireEvent.click(view.getByRole('button',{name:/View next stage/}));
    next();assert.ok(view.getAllByText('Choose an option.').length);
    fireEvent.click(view.getByLabelText('I know where I want to go.'));fill('Tell me your destination or ideas','Italy or Greece');
    fill('What type of holiday are you considering?','family');fill('Number of adults','2');fill('Number of children','2');
    next();assert.ok(view.getAllByText('Enter a whole number.').length);
    fill('Child 1 age at travel','0');fill('Child 2 age at travel','7');next();
    fireEvent.click(view.getByLabelText('Specific dates'));fill('Preferred departure date','2099-06-10');fill('Preferred return date','2099-06-01');
    fill('How long would you like to go for?','seven');fill('Approximate total holiday budget','guidance');
    next();assert.ok(view.getByText('The return date must be on or after departure.'));
    fireEvent.click(view.getByLabelText('Flexible dates'));
    fill('What matters most to you? (optional)','A quiet pool.\nPlease discuss practical arrangements.');
    fireEvent.click(view.getByLabelText('I have accessibility or other practical requirements I’d like to discuss.'));next();
    assert.ok(view.getByRole('link',{name:'Read the privacy policy'}));assert.ok(view.getByText(/Italy or Greece/));
    fireEvent.click(view.getByRole('button',{name:'Edit Your holiday'}));fill('Number of children','1');next();
    assert.ok((view.getByLabelText('What matters most to you? (optional)') as HTMLTextAreaElement).value.includes('quiet pool'));next();
    fill('Your name','Fixture customer');fill('Email address','customer@example.org');fireEvent.click(view.getByLabelText('Telephone'));
    fireEvent.click(view.getByLabelText('I’m exploring ideas for a future trip.'));
    fireEvent.click(view.getByRole('button',{name:/Send holiday brief/}));assert.ok(view.getByText('Enter a telephone number for your preferred contact method.'));
    fill('Telephone number','01234567890');
    fireEvent.click(view.getByRole('button',{name:/Send holiday brief/}));await waitFor(()=>assert.ok(view.getByRole('alert').textContent?.includes('Fixture storage failure')));
    assert.equal((view.getByLabelText('Your name') as HTMLInputElement).value,'Fixture customer');
    fireEvent.click(view.getByRole('button',{name:/Send holiday brief/}));fireEvent.submit(view.getByRole('form',{name:'Holiday Brief'}));
    await waitFor(()=>assert.equal(bodies.length,2));assert.equal(bodies[0].request_id,bodies[1].request_id);
    const submitted=bodies[1].brief as ReturnType<typeof emptyBrief>;assert.equal(submitted.children,'1');assert.deepEqual(submitted.childrenAges,['0']);assert.equal(submitted.requirementsDiscussion,true);assert.equal(submitted.budget,'guidance');
    resolve!(Response.json({accepted:true,reference:'000042',notification:'pending'},{status:202}));
    await waitFor(()=>assert.ok(view.getByRole('heading',{name:'Your holiday brief has been received.'})));
    assert.ok(view.getByText('000042'));assert.match(view.getByRole('status').textContent||'',/saved securely[\s\S]*pending[\s\S]*do not need to submit/);
    assert.equal(view.queryByRole('form'),null);assert.equal(bodies.length,2);
  }finally{globalThis.fetch=fetch;cleanup();}
});

test('open destination, approximate dates and email contact work without demanding undecided or optional answers',async()=>{
  const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');const {EnquiryForm}=await import('../src/components/enquiry/EnquiryForm');
  const fetch=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({accepted:true,reference:calls===1?'000007':'PBJ-FEDCBA9876543210',notification:'accepted'});};
  try{
    for(const reference of ['000007','PBJ-FEDCBA9876543210']){
    const view=render(<EnquiryForm privacyHref="/privacy" enabled/>),fill=(label:string,value:string)=>fireEvent.change(view.getByLabelText(label),{target:{value}}),next=()=>fireEvent.click(view.getByRole('button',{name:/View next stage/}));
    fireEvent.click(view.getByLabelText('I’m open to suggestions.'));fill('What type of holiday are you considering?','unsure');next();
    fireEvent.click(view.getByLabelText('An approximate month or period'));fill('Approximate month or period','Autumn 2099');fill('How long would you like to go for?','longer');fill('Approximate total holiday budget','guidance');next();
    fill('Your name','Fixture customer');fill('Email address','customer@example.org');fireEvent.click(view.getByLabelText('I’m planning a holiday for the coming months.'));
    fireEvent.click(view.getByRole('button',{name:/Send holiday brief/}));await waitFor(()=>assert.ok(view.getByText(reference)));
    assert.doesNotMatch(view.getByRole('status').textContent||'',/notification is pending/);cleanup();
    }assert.equal(calls,2);
  }finally{globalThis.fetch=fetch;cleanup();}
});

test('bespoke admin details show the saved answers and reuse protected notification retry without altering the brief',async()=>{
  const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');const {BespokeEnquiryDetails}=await import('../src/components/enquiry/BespokeEnquiryDetails');
  const {AppRouterContext}=await import('next/dist/shared/lib/app-router-context.shared-runtime');
  const fetch=globalThis.fetch,confirm=window.confirm;
  const brief=briefSnapshot(briefSchema.parse({...emptyBrief(),destinationChoice:'open',holidayType:'unsure',dateChoice:'flexible',duration:'longer',budget:'guidance',name:'Fixture customer',email:'customer@example.org',intention:'future'}));
  const enquiry={id:randomUUID(),reference:'000042',issued_reference:'PBJ-0123456789ABCDEF',name:'Fixture customer',email:'customer@example.org',phone:'',brief,created_at:'2020-01-01T12:00:00Z',notification_id:null,notified_at:null,notification_attempted_at:null,last_notification_error:'HTTP_503'};
  let calls=0,refreshes=0;const router={refresh:()=>refreshes++} as unknown as React.ContextType<typeof AppRouterContext>;
  globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'/api/enquiries/notification');assert.deepEqual(JSON.parse(String(init?.body)),{id:enquiry.id,confirmedUnsent:true});return Response.json({notification:'accepted'});};
  try{
    const view=render(<AppRouterContext.Provider value={router}><BespokeEnquiryDetails enquiry={enquiry}/></AppRouterContext.Provider>);
    assert.ok(view.getByRole('heading',{name:'Bespoke enquiry 000042'}));assert.ok(view.getByText('Original customer reference (still valid): PBJ-0123456789ABCDEF'));
    for(const row of brief.summary)assert.ok(view.getAllByText(row.value).length);assert.ok(view.getByText(/HTTP_503/));
    window.confirm=()=>false;fireEvent.click(view.getByRole('button',{name:'Retry email notification'}));assert.equal(calls,0);
    window.confirm=()=>true;fireEvent.click(view.getByRole('button',{name:'Retry email notification'}));await waitFor(()=>assert.equal(refreshes,1));assert.equal(calls,1);
    assert.ok(view.getByText('Notification accepted by Resend. Check the mailbox for arrival.'));assert.deepEqual(enquiry.brief,brief);
  }finally{globalThis.fetch=fetch;window.confirm=confirm;cleanup();}
});

test('bespoke admin routes reject cross-origin and unauthenticated retry access without sending email',async()=>{
  const {POST}=await import('../src/app/api/enquiries/notification/route');
  const fetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No email allowed');};
  try{
    const response=await POST(new Request('https://plannedbyjay.com/api/enquiries/notification',{method:'POST',headers:{Origin:'https://other.example'},body:JSON.stringify({id:randomUUID()})}));
    assert.equal(response.status,403);assert.equal(calls,0);
    // Without a Next session/cookie context, authentication cannot produce a private service client.
    const unauthenticated=await POST(new Request('https://plannedbyjay.com/api/enquiries/notification',{method:'POST',headers:{Origin:'https://plannedbyjay.com'},body:JSON.stringify({id:randomUUID()})}));
    assert.ok(unauthenticated.status>=400);assert.equal(calls,0);
  }finally{globalThis.fetch=fetch;}
});
