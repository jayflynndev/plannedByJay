'use client';
import {createContext, useCallback, useContext, useId, useSyncExternalStore} from 'react';
import {Analytics, type BeforeSend} from '@vercel/analytics/next';
import {analyticsPreferenceSnapshot, serverAnalyticsPreferenceSnapshot, subscribeAnalyticsPreference, saveAnalyticsPreference, maySendAnalytics, type AnalyticsPreference} from '@/lib/analytics-preference';

const PreferenceContext = createContext<{preference: AnalyticsPreference; enabled: boolean} | null>(null);

export function AnalyticsPreferencesProvider({children, defaultEnabled}: {children: React.ReactNode; defaultEnabled: boolean}) {
  const preference = useSyncExternalStore(subscribeAnalyticsPreference, analyticsPreferenceSnapshot, serverAnalyticsPreferenceSnapshot);
  const enabled = preference === 'on' || (preference === 'unset' && defaultEnabled);
  const beforeSend: BeforeSend = useCallback(event => maySendAnalytics(defaultEnabled) ? event : null, [defaultEnabled]);
  return <PreferenceContext.Provider value={{preference, enabled}}>
    {children}
    {enabled && <Analytics beforeSend={beforeSend}/>}
  </PreferenceContext.Provider>;
}

export function AnalyticsPreferences() {
  const context = useContext(PreferenceContext);
  const heading = useId(), description = useId(), status = useId();
  const preference = context?.preference ?? 'loading';
  const enabled = context?.enabled ?? false;
  return <section className="analytics-preferences" aria-labelledby={heading}>
    <h2 id={heading}>Website analytics</h2>
    <p id={description}>Optional page-view statistics help improve this website. Enquiry answers are not sent to Analytics. You can change this choice at any time.</p>
    <label><input type="checkbox" checked={enabled} disabled={preference === 'loading' || preference === 'blocked'} aria-describedby={`${description} ${status}`} onChange={event => saveAnalyticsPreference(event.target.checked)}/>Allow website analytics</label>
    <p id={status} role="status">{preference === 'loading' ? 'Loading your preference…' : preference === 'blocked' ? 'Analytics is off because this browser cannot save your preference.' : `Analytics is ${enabled ? 'on' : 'off'} on this browser. Your choice is remembered here until you change it or clear this website’s browser storage.`}</p>
  </section>;
}
