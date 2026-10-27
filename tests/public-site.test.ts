import test from 'node:test';
import assert from 'node:assert/strict';
import { approvedPolicies,approvedPolicyHref,policies } from '../src/content/policies';
import { navigation } from '../src/content/navigation';
import { site } from '../src/content/site';
test('policy links require explicit approval, resolved review, date and actual text; trading details do not assert independent protection',()=>{
  const booking=[{href:'/booking-information',label:'Booking Information'}];
  assert.deepEqual(approvedPolicies(),[{href:'/privacy',label:'Privacy Policy'},...booking]);const original=policies.privacy;
  try{policies.privacy={...original,approved:false};assert.deepEqual(approvedPolicies(),booking);
    assert.equal(approvedPolicyHref('privacy'),null);
    policies.privacy={...original,reviewRequired:['Synthetic unresolved review']};assert.deepEqual(approvedPolicies(),booking);
    policies.privacy={...original,approved:true,reviewRequired:[],sections:[]};assert.deepEqual(approvedPolicies(),booking);
    policies.privacy={...original,approved:true,reviewRequired:[],updatedAt:null};assert.deepEqual(approvedPolicies(),booking);
    policies.privacy={...original,approved:true,reviewRequired:[],updatedAt:'2026-10-25',sections:[{heading:'Test policy',paragraphs:['Approved test text']} ]};assert.deepEqual(approvedPolicies(),[{href:'/privacy',label:'Privacy Policy'},...booking]);
    assert.equal(approvedPolicyHref('privacy'),'/privacy');
  }finally{policies.privacy=original;}
  assert.equal(site.contact.email,'jay@plannedbyjay.com');assert.equal(site.business.companyNumber,'16135195');assert.equal(site.business.vatNumber,'482 4625 76');
  assert.equal(site.business.legalEntityName,'New Travel Holidays Limited');
  assert.ok(site.business.tradingStatement.includes('on behalf of New Travel Holidays'));assert.ok(!site.business.headOffice.includes('registered office'));
  assert.ok(site.logos.every(logo=>!logo.src&&!logo.approvedForDisplay));
  assert.equal(navigation.find(item=>item.label==='Why Book With Jay?')?.href,'/why-jay');
});
