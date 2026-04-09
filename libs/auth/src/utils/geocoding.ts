export interface GeocodeResult {
  place_name: string;
  place_id: string;
}

const RESULT_TYPE_FALLBACKS = [
  "locality",
  "administrative_area_level_2",
  "administrative_area_level_1",
];

export async function reverseGeocode(
  lat: number,
  long: number
): Promise<GeocodeResult | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    console.error(
      "reverseGeocode: NEXT_PUBLIC_GOOGLE_MAPS_KEY not set — cannot reverse-geocode"
    );
    return null;
  }

  for (const resultType of RESULT_TYPE_FALLBACKS) {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${long}` +
      `&key=${key}` +
      `&result_type=${resultType}`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.status !== "OK" || !data.results?.length) continue;

      const top = data.results[0];
      const component = top.address_components?.find((c: any) =>
        c.types?.includes(resultType)
      );
      const place_name = component?.long_name || top.formatted_address;
      return {
        place_name,
        place_id: top.place_id,
      };
    } catch (err) {
      console.error(`reverseGeocode: ${resultType} failed`, err);
      continue;
    }
  }

  return null;
}
