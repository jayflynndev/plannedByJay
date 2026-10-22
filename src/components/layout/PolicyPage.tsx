import { notFound } from 'next/navigation';
import { policies,isPolicyPublished,type PolicyKey } from '@/content/policies';
import { PolicyDocument } from './PolicyDocument';
export function PolicyPage({policy: key}:{policy:PolicyKey}) {
  const policy=policies[key];if(!isPolicyPublished(policy))notFound();
  return <PolicyDocument policy={policy}/>;
}
