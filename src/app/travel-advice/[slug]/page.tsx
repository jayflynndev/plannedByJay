import {notFound} from 'next/navigation';
// No current articles exist. Reject unknown slugs before a loading boundary streams 200.
export const dynamicParams=false;
export function generateStaticParams(){return [];}
// Archived content is not a current public article or offer.
export default function UnavailableContent(){notFound();}
