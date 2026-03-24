import { QueryObjectFunction } from "@zo/definitions/auth";
import { zoServer, zostelServer } from "../utils";

export const discoverQueryApis = {
  DISCOVER_SEARCH_PLACES: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "zostel",
        "discover",
        "search",
        "places",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/discover/search/places/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  DISCOVER_SPOTLIGHT_TRIPS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["discover", "spotlight", "trips", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/discover/spotlight/trips/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const discoverMutationApis = {};

export type DISCOVER_QUERY_ENDPOINTS = keyof typeof discoverQueryApis;
export type DISCOVER_MUTATION_ENDPOINTS = keyof typeof discoverMutationApis;
