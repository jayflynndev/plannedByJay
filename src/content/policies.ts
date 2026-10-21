export type PolicyKey = 'privacy' | 'cookies' | 'booking-information';
type Policy = {title:string;approved:boolean;updatedAt:string|null;sections:{heading:string;paragraphs:string[]}[]};
// Owner/legal approval boundary: unapproved routes return 404 and never enter links/sitemap.
// Add factually confirmed text here, then set approved only after explicit approval.
export const policies:Record<PolicyKey,Policy> = {
  privacy: {title:'Privacy policy',approved:false,updatedAt:null,sections:[]},
  cookies: {title:'Cookies',approved:false,updatedAt:null,sections:[]},
  'booking-information': {title:'Booking information',approved:false,updatedAt:null,sections:[]},
};
export function approvedPolicies() {return Object.entries(policies).filter(([,policy])=>policy.approved&&policy.sections.length>0).map(([key,policy])=>({href:`/${key}`,label:policy.title}));}
