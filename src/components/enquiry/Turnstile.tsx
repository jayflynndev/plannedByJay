'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { enquiryContent } from '@/content/enquiry';
declare global {
  interface Window {
    turnstile?: {
      render(element: HTMLElement, options: Record<string, unknown>): string;
      remove(id: string): void;
    };
  }
}
/** Optional: no third-party script is loaded unless both server-side Turnstile settings exist. */
export function Turnstile({
  siteKey,
  resetKey,
  onToken,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string) => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready || !window.turnstile || !target.current) return;
    const api = window.turnstile;
    const id = api.render(target.current, {
      sitekey: siteKey,
      action: 'holiday-enquiry',
      theme: 'light',
      callback: (token: string) => {
        setFailed(false);
        onToken(token);
      },
      'expired-callback': () => onToken(''),
      'error-callback': () => {
        onToken('');
        setFailed(true);
      },
    });
    return () => {
      api.remove(id);
      onToken('');
    };
  }, [ready, siteKey, resetKey, onToken]);
  return (
    <div className="turnstile">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={target} />
      {failed && (
        <p role="alert" className="field-error">
          {enquiryContent.messages.challengeFailure}
        </p>
      )}
    </div>
  );
}
