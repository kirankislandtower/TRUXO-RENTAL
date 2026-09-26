// The gtag snippet in the root layout defines a global `gtag()`. Events go
// through it; if it is missing (ad blocker, script not loaded yet) tracking
// silently does nothing rather than throwing on a customer's click.
declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: Record<string, string | number | boolean>) => void;
  }
}

export type AnalyticsParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // "beacon" lets the hit finish even when the click hands off to the phone
  // dialer, WhatsApp or the mail app and the page is backgrounded.
  window.gtag("event", name, { transport_type: "beacon", ...params });
}
