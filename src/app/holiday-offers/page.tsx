import {OffersListing} from '@/components/offers/OfferViews';
import {offersCopy} from '@/content/offers';
import {publicOrigin} from '@/lib/presentation';
export function generateMetadata(){return {title:'Holiday Offers | Planned by Jay',description:offersCopy.description,alternates:{canonical:publicOrigin()+'/holiday-offers'}};}
export default function HolidayOffers(){return <OffersListing query={{q:'',destination:'',type:'',supplier:'',departure:'',month:'',min:'',max:'',board:'',page:1}} offers={[]} total={0} suppliers={[]}/>;}
