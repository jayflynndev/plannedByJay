// One browser preference, without identifiers or cookies. Fail closed if it cannot be saved.
export const ANALYTICS_PREFERENCE_KEY = 'pbj.analytics';
export type AnalyticsPreference = 'loading' | 'unset' | 'on' | 'off' | 'blocked';
let preference: AnalyticsPreference = 'loading';
const listeners = new Set<() => void>();

function update(value: AnalyticsPreference) {
  preference = value;
  listeners.forEach(listener => listener());
}
function storedPreference(): AnalyticsPreference {
  const value = window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY);
  return value === 'on' || value === 'off' ? value : value === null ? 'unset' : 'off';
}
function initialise() {
  try {
    // Check that an objection can actually be persisted before permitting analytics.
    // Reuse the same key; leave no entry for someone who has not made a choice.
    const previous = window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY);
    window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY, 'checking');
    if (window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) !== 'checking') throw new Error('Preference not saved');
    if (previous === null) window.localStorage.removeItem(ANALYTICS_PREFERENCE_KEY);
    else window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY, previous);
    update(storedPreference());
  } catch {
    update('blocked');
  }
}
export function subscribeAnalyticsPreference(listener: () => void) {
  listeners.add(listener);
  initialise();
  const changed = (event: StorageEvent) => {
    if (event.key !== null && event.key !== ANALYTICS_PREFERENCE_KEY) return;
    if (preference === 'blocked') return;
    try { update(storedPreference()); } catch { update('blocked'); }
  };
  window.addEventListener('storage', changed);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', changed);
    if (listeners.size === 0) preference = 'loading';
  };
}
export const analyticsPreferenceSnapshot = () => preference;
export const serverAnalyticsPreferenceSnapshot = (): AnalyticsPreference => 'loading';

export function saveAnalyticsPreference(enabled: boolean) {
  // Stop the already-loaded script synchronously, before React rerenders/unmounts it.
  if (!enabled) update('off');
  try {
    const value = enabled ? 'on' : 'off';
    window.localStorage.setItem(ANALYTICS_PREFERENCE_KEY, value);
    if (window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) !== value) throw new Error('Preference not saved');
    update(value);
  } catch {
    update('blocked');
  }
}

export function maySendAnalytics(defaultEnabled: boolean) {
  if (preference === 'loading' || preference === 'off' || preference === 'blocked') return false;
  try {
    // Re-read at send time: an objection in another tab wins before its storage event runs.
    const stored = storedPreference();
    return stored === 'on' || (stored === 'unset' && defaultEnabled);
  } catch {
    return false;
  }
}
