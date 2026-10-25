import { Hero } from '@/components/home/Hero';
import { HolidayPaths } from '@/components/home/HolidayPaths';
import { WhyJay } from '@/components/home/WhyJay';
import { HolidayExperiences } from '@/components/home/HolidayExperiences';
import { TravelInspiration } from '@/components/home/TravelInspiration';
import { HomeCTA } from '@/components/home/HomeCTA';
import { publicOrigin } from '@/lib/presentation';
import { site } from '@/content/site';
import {OfferSection} from '@/components/offers/OfferViews';
import {offersCopy} from '@/content/offers';
export function generateMetadata(){return {title:site.title,description:site.description,alternates:{canonical:publicOrigin()},openGraph:{title:site.title,description:site.description,type:'website' as const,url:publicOrigin()}};}
// Listings remain empty until separately authorised replacement content exists.
export default function Home() {return <main id="main-content" tabIndex={-1}><Hero/><HolidayPaths/><WhyJay/><HolidayExperiences/><OfferSection offers={[]} title={offersCopy.featuredTitle}/><TravelInspiration articles={[]}/><HomeCTA/></main>; }
