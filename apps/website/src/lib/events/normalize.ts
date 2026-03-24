import { BookingExperienceResponse, ZoActivity, UnifiedEventItem } from '../../config';
import { PROPERTY_COORDS } from './constants';

/** Get the next upcoming SKU from an activity (date >= today, sorted chronologically) */
function getNextSku(activity: ZoActivity) {
  const today = new Date().toISOString().split('T')[0];
  const futureSKUs = activity.skus
    .filter((s) => s.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  return futureSKUs[0] || null;
}

/** Normalize a BookingExperienceResponse into UnifiedEventItem */
export function normalizeEvent(event: BookingExperienceResponse): UnifiedEventItem {
  return {
    id: event.pid,
    type: 'event',
    name: event.name,
    date: event.start_at,
    category: event.category,
    subcategory: event.subcategory,
    price: event.price,
    latitude: +event.latitude,
    longitude: +event.longitude,
    location: event.location,
    distance: event.distance,
    icon: event.icon,
    coverImage: event.cover_image,
    registrationLink: event.registration_link,
    navigationLink: event.navigation_link,
    originalEvent: event,
  };
}

/** Normalize a ZoActivity into UnifiedEventItem. Returns null if no future SKUs. */
export function normalizeActivity(activity: ZoActivity): UnifiedEventItem | null {
  const sku = getNextSku(activity);
  if (!sku) return null;

  const coords = PROPERTY_COORDS[activity.operator];
  if (!coords) return null;

  return {
    id: activity.pid,
    type: 'activity',
    name: activity.name,
    date: sku.date,
    startTime: sku.start_time,
    endTime: sku.end_time,
    category: 'activity',
    subcategory: activity.subcategory || undefined,
    price: sku.price || 0,
    latitude: coords.lat,
    longitude: coords.lng,
    location: coords.name,
    operatorName: coords.name,
    navigationLink: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
  };
}

/** Merge and normalize events + activities into a unified list */
export function mergeEventsAndActivities(
  events: BookingExperienceResponse[],
  activities: ZoActivity[],
): UnifiedEventItem[] {
  const normalizedEvents = events.map(normalizeEvent);
  const normalizedActivities = activities
    .map(normalizeActivity)
    .filter((a): a is UnifiedEventItem => a !== null);

  return [...normalizedEvents, ...normalizedActivities];
}
