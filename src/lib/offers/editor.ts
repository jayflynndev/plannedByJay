const day=86400000;
export function durationBetween(start:string,end:string):number|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))return null;
  const n=(Date.parse(end)-Date.parse(start))/day;
  return Number.isInteger(n)&&n>=0&&n<=365?n:null;
}
export function localDateTime(iso:string){
  const d=new Date(iso);return Number.isNaN(d.getTime())?'':new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
export function localInstant(value:string){
  if(!value)return '';
  const d=new Date(value);
  // Reject the browser's silent rollover through a non-existent spring clock-change time.
  return Number.isNaN(d.getTime())||localDateTime(d.toISOString())!==value?'':d.toISOString();
}
export function priceDay(timestamp:string){return timestamp.slice(0,10);}
export function todayUK(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
