import { zoServer } from "../utils";

export interface WhereaboutsRecord {
  place_name: string;
  place_ref_id: string;
  location: { lat: number; long: number }; // NOTE: 'long', NOT 'lng'
  created_at?: string;
  updated_at?: string;
}

export interface WhereaboutsPayload {
  place_name: string;
  place_ref_id: string;
  location: { lat: number; long: number }; // NOTE: 'long', NOT 'lng'
}

export async function fetchWhereabouts(): Promise<WhereaboutsRecord | null> {
  try {
    const response = await zoServer.get("/api/v2/places/whereabouts/");
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function postWhereabouts(
  payload: WhereaboutsPayload
): Promise<WhereaboutsRecord> {
  const response = await zoServer.post("/api/v2/places/whereabouts/", payload);
  return response.data;
}
