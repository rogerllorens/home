type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, properties?: AnalyticsProperties) => void;
    posthog?: { capture: (eventName: string, properties?: AnalyticsProperties) => void };
  }
}

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.toLowerCase();
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function trackEvent(eventName: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  const safeProperties = Object.fromEntries(Object.entries(properties).filter(([key]) => !/csv|row|email|token|secret|key|file/i.test(key)));
  if (provider === "ga" && gaId && window.gtag) window.gtag("event", eventName, safeProperties);
  if (provider === "posthog" && posthogKey && window.posthog) window.posthog.capture(eventName, safeProperties);
}
