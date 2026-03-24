import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const zoworldQueryApis = {
  ZOWORLD_STUDIO_ARTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "studio", "arts"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/studio/arts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_STUDIO_ARTISTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "studio", "artists"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/studio/artists/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_EVENTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "events", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/events/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_COUNTRIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "countries", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/countries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_BULLETIN_SOCIALS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "bulletin", "socials", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/bulletin/socials/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,

  ZOWORLD_PUBLIC_BULLETINS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "bulletin", "socials", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/public/bulletins/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_DESTINATIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "bulletin", "socials", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/destinations/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ZOWORLD_METADATA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zoworld", "metadata", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/zoworld/metadata/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const zoworldMutationApis = {
  ZOWORLD_PARTNERSHIPS_APPLICATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/zoworld/partnerships/applications/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  ZOWORLD_MEMBERSHIP_APPLICATIONS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/zoworld/membership/applications/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  ZOWORLD_EVENTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/zoworld/events/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type ZOWORLD_QUERY_ENDPOINTS = keyof typeof zoworldQueryApis;
export type ZOWORLD_MUTATION_ENDPOINTS = keyof typeof zoworldMutationApis;
