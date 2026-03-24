import { QueryObjectFunction } from "@zo/definitions/auth";

import { zoServer } from "../utils";

export const placesQueryApis = {
  PLACES_LOCATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["places", "locations", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/places/locations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const placesMutationApis = {};

export type PLACES_QUERY_ENDPOINTS = keyof typeof placesQueryApis;
export type PLACES_MUTATION_ENDPOINTS = keyof typeof placesMutationApis;
