/** Zo House property coordinates for activity map markers */
export const PROPERTY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  BNGHO812: { lat: 12.9352, lng: 77.6245, name: 'Zo House Bangalore (Koramangala)' },
  BNGS531:  { lat: 12.9698, lng: 77.7500, name: 'WTFxZo (Whitefield)' },
};

/** Operator IDs to fetch activities from */
export const ACTIVITY_OPERATOR_IDS = Object.keys(PROPERTY_COORDS);

/** Content type filter options */
export const CONTENT_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Events', value: 'events' },
  { label: 'Activities', value: 'activities' },
];
