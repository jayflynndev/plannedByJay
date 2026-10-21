import { Hero } from '@/components/home/Hero';
import { HolidayPaths } from '@/components/home/HolidayPaths';
import { WhyJay } from '@/components/home/WhyJay';
import { HolidayExperiences } from '@/components/home/HolidayExperiences';
import { TravelInspiration } from '@/components/home/TravelInspiration';
import { HomeCTA } from '@/components/home/HomeCTA';
import { homepageArticlePreviews } from '@/lib/cms/data';
import { publicOrigin } from '@/lib/cms/config';
import { site } from '@/content/site';
export function generateMetadata(){return {title:site.title,description:site.description,alternates:{canonical:publicOrigin()},openGraph:{title:site.title,description:site.description,type:'website' as const,url:publicOrigin()}};}
// Fetch published content per request; publishing/unpublishing never needs a redeploy.
export const dynamic='force-dynamic';
export default async function Home() {const articles=await homepageArticlePreviews();return <main id="main-content" tabIndex={-1}><Hero/><HolidayPaths/><WhyJay/><HolidayExperiences/><TravelInspiration articles={articles}/><HomeCTA/></main>; }
