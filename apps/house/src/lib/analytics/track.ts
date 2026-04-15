import type { EventName, EventProps, TrackArg } from "../../types/analytics";

export interface Destinations {
  ga4: (event: string, props: Record<string, unknown>) => void;
  posthog: (event: string, props: Record<string, unknown>) => void;
  moengage: (event: string, props: Record<string, unknown>) => void;
  metaPixel: (event: string, props: Record<string, unknown>) => void;
}

let destinations: Destinations = {
  ga4: () => {},
  posthog: () => {},
  moengage: () => {},
  metaPixel: () => {},
};

export function _setDestinationsForTest(d: Destinations): void {
  destinations = d;
}

export function setDestinations(d: Destinations): void {
  destinations = d;
}

function safeCall(name: keyof Destinations, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    // Per spec §13.3: one tool failing must not break others.
    // eslint-disable-next-line no-console
    console.warn(`[analytics] ${name} failed:`, err);
  }
}

export function track<E extends EventName>(...args: TrackArg<E>): void {
  const event = args[0] as E;
  const props = (args[1] ?? {}) as EventProps[E];
  const propsRecord = props as unknown as Record<string, unknown>;

  safeCall("ga4", () => destinations.ga4(event, propsRecord));
  safeCall("posthog", () => destinations.posthog(event, propsRecord));
  safeCall("moengage", () => destinations.moengage(event, propsRecord));
  safeCall("metaPixel", () => destinations.metaPixel(event, propsRecord));
}
