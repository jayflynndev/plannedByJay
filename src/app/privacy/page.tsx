import { PolicyPage } from '@/components/layout/PolicyPage';
import {publicOrigin} from '@/lib/presentation';
export function generateMetadata(){return {title:'Privacy policy | Planned by Jay',alternates:{canonical:publicOrigin()+'/privacy'}};}
export default function Privacy(){return <PolicyPage policy="privacy"/>;}
