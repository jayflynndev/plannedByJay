import {z} from 'zod';
import {enquiryContent as content,enquiryOptions as options} from '@/content/enquiry';
import {optionLabel} from '@/lib/presentation';

const choice=(list:readonly {value:string}[])=>z.string().refine(v=>list.some(o=>o.value===v),'Choose an option.');
const whole=(min:number,max:number)=>z.string().regex(/^\d+$/,'Enter a whole number.').refine(v=>Number(v)>=min&&Number(v)<=max,`Enter a number from ${min} to ${max}.`);
const text=(max:number)=>z.string().trim().max(max,`Use no more than ${max} characters.`);
const fields=z.object({
  destinationChoice:choice(options.destination),destinationIdeas:text(500),holidayType:choice(options.holiday),
  adults:whole(1,50),children:whole(0,20),childrenAges:z.array(whole(0,17)).max(20),
  dateChoice:choice(options.dates),startDate:text(10),endDate:text(10),travelPeriod:text(200),flexibleNotes:text(300),
  duration:choice(options.duration),departurePreferences:text(300),budget:choice(options.budget),preferences:text(2000),
  requirementsDiscussion:z.boolean(),name:text(100).min(1,'Enter your name.'),email:z.email('Enter a valid email address.').max(254).transform(v=>v.toLowerCase()),
  phone:text(40),contactMethod:choice(options.contact),intention:choice(options.intention),
}).strict();
export type EnquiryDraft=z.input<typeof fields>;
export const emptyBrief=():EnquiryDraft=>({destinationChoice:'',destinationIdeas:'',holidayType:'',adults:'1',children:'0',childrenAges:[],dateChoice:'',startDate:'',endDate:'',travelPeriod:'',flexibleNotes:'',duration:'',departurePreferences:'',budget:'',preferences:'',requirementsDiscussion:false,name:'',email:'',phone:'',contactMethod:'email',intention:''});
const isDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export const briefSchema=fields.superRefine((v,ctx)=>{
  const error=(path:string,message:string)=>ctx.addIssue({code:'custom',path:[path],message});
  if(v.destinationChoice!=='open'&&!v.destinationIdeas)error('destinationIdeas','Tell Jay your destination or ideas.');
  if(v.childrenAges.length!==Number(v.children))error('childrenAges','Enter an age for each child.');
  if(v.dateChoice==='specific'){
    if(!isDate(v.startDate))error('startDate','Enter a valid departure date.');
    if(!isDate(v.endDate))error('endDate','Enter a valid return date.');
    if(isDate(v.startDate)&&isDate(v.endDate)&&v.endDate<v.startDate)error('endDate','The return date must be on or after departure.');
  }
  if(v.dateChoice==='approximate'&&!v.travelPeriod)error('travelPeriod','Enter an approximate month or period.');
  if(v.contactMethod==='telephone'&&!v.phone)error('phone','Enter a telephone number for your preferred contact method.');
}).transform(v=>({...v,destinationIdeas:v.destinationChoice==='open'?'':v.destinationIdeas,startDate:v.dateChoice==='specific'?v.startDate:'',endDate:v.dateChoice==='specific'?v.endDate:'',travelPeriod:v.dateChoice==='approximate'?v.travelPeriod:'',flexibleNotes:v.dateChoice==='flexible'?v.flexibleNotes:''}));
export const stageFields=[['destinationChoice','destinationIdeas','holidayType','adults','children','childrenAges'],['dateChoice','startDate','endDate','travelPeriod','flexibleNotes','duration','departurePreferences','budget','preferences','requirementsDiscussion'],['name','email','phone','contactMethod','intention']] as const;
export function briefErrors(value:unknown,stage?:number){
  const result=briefSchema.safeParse(value),errors:Record<string,string>={};
  if(!result.success)for(const issue of result.error.issues){
    const root=String(issue.path[0]);
    if(stage===undefined||(stageFields[stage] as readonly string[]).includes(root))errors[issue.path.join('.')]=issue.message;
  }
  return errors;
}
export const bespokeInput=z.object({request_id:z.uuid(),brief:briefSchema,website:text(200).default('')}).strict();
export const isBespokeReference=(value:unknown):value is string=>typeof value==='string'&&/^PBJ-[A-F0-9]{16}$/.test(value);
// Historical snapshots do not depend on today's option values or question labels.
export const briefSnapshotSchema=z.object({schema_version:z.literal(1),answers:z.object({name:z.string(),email:z.email(),phone:z.string()}).passthrough(),summary:z.array(z.object({label:z.string().max(300),value:z.string().max(3000)})).min(1).max(30)});
export function briefSnapshot(answers:z.output<typeof briefSchema>){
  const a=answers,label=optionLabel;
  const summary=[
    {label:content.fields.destinationChoice,value:label(options.destination,a.destinationChoice)},
    ...(a.destinationIdeas?[{label:content.fields.destinationIdeas,value:a.destinationIdeas}]:[]),
    {label:content.fields.holidayType,value:label(options.holiday,a.holidayType)},
    {label:content.fields.adults,value:a.adults},{label:content.fields.children,value:a.children},
    ...(a.childrenAges.length?[{label:content.fields.childrenAges,value:a.childrenAges.join(', ')}]:[]),
    {label:content.fields.dateChoice,value:label(options.dates,a.dateChoice)},
    ...(a.dateChoice==='specific'?[{label:content.fields.startDate,value:a.startDate},{label:content.fields.endDate,value:a.endDate}]:[]),
    ...(a.travelPeriod?[{label:content.fields.travelPeriod,value:a.travelPeriod}]:[]),
    ...(a.flexibleNotes?[{label:content.fields.flexibleNotes,value:a.flexibleNotes}]:[]),
    {label:content.fields.duration,value:label(options.duration,a.duration)},
    {label:content.fields.departurePreferences,value:a.departurePreferences||content.review.noDeparture},
    {label:content.fields.budget,value:label(options.budget,a.budget)+' (total for the whole party)'},
    {label:content.fields.preferences,value:a.preferences||'Not specified'},
    {label:content.fields.requirementsDiscussion,value:a.requirementsDiscussion?'Yes - please arrange a private discussion':'No discussion requested'},
    {label:content.fields.name,value:a.name},{label:content.fields.email,value:a.email},
    {label:content.fields.phone,value:a.phone||'Not supplied'},
    {label:content.fields.contactMethod,value:label(options.contact,a.contactMethod)},
    {label:content.fields.intention,value:label(options.intention,a.intention)},
  ];
  return {schema_version:1 as const,answers:a,summary};
}
