import { PolicyPage } from '@/components/layout/PolicyPage';
import {publicOrigin} from '@/lib/presentation';
export function generateMetadata(){return {title:'Booking information | Planned by Jay',alternates:{canonical:publicOrigin()+'/booking-information'}};}
export default function BookingInformation(){return <PolicyPage policy="booking-information"/>;}
