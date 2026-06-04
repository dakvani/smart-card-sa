// Lightweight client analytics. Forwards to window.gtag / plausible / posthog if present,
// always emits a CustomEvent and console.debug so we can wire up any provider later.
export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, props: AnalyticsProps = {}) {
  try {
    const w = window as any;
    if (typeof w.gtag === "function") w.gtag("event", name, props);
    if (typeof w.plausible === "function") w.plausible(name, { props });
    if (w.posthog?.capture) w.posthog.capture(name, props);
    window.dispatchEvent(new CustomEvent("analytics:event", { detail: { name, props } }));
    // eslint-disable-next-line no-console
    console.debug("[analytics]", name, props);
  } catch {
    /* noop */
  }
}
