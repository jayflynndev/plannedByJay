import { PolicyPage } from '@/components/layout/PolicyPage';
import {publicOrigin} from '@/lib/presentation';
export function generateMetadata(){return {title:'Cookies Policy | Planned by Jay',alternates:{canonical:publicOrigin()+'/cookies'}};}
export default function Cookies(){return <PolicyPage policy="cookies"/>;}
