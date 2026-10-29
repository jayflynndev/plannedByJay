import { notFound } from 'next/navigation';
import { policies,isPolicyPublished,type PolicyKey } from '@/content/policies';
import { PolicyDocument } from './PolicyDocument';
import { AnalyticsPreferences } from '@/components/analytics/AnalyticsPreferences';
export function PolicyPage({policy: key}:{policy:PolicyKey}) {
  const policy=policies[key];if(!isPolicyPublished(policy))notFound();
  return <PolicyDocument policy={policy}>{key === 'cookies' && <div id="cookie-analytics-preferences"><AnalyticsPreferences/></div>}</PolicyDocument>;
}
