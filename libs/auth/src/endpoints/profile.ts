import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer, zostelServer } from "../utils";

export const profileQueryApis = {
  PROFILE_ME: ((additionalRoute, search, config) => {
    return {
      queryKey: ["profile", "me"],
      queryFn: async () =>
        await zoServer.get(`/api/v1/profile/me/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_ME_ZOSTEL: ((additionalRoute, search, config) => {
    return {
      queryKey: ["zostel", "profile", "me"],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/profile/me/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_LOCATIONS_COUNTRY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["profile", "locations", "country", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/profile/locations/country/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_ME_NFTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["profile", "me", "nfts"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/profile/me/nfts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_ME_PFP: ((additionalRoute, search, config) => {
    return {
      queryKey: ["profile", "me", "pfp"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/profile/me/pfp/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_ME_ENS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["profile", "me", "ens"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/profile/me/ens/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  PROFILE_CUSTOM_NICKNAME_AVAILABLE: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "profile",
        "custom-nickname",
        "available",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/profile/custom-nickname/available/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const profileMutationApis = {
  PROFILE_ME: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/profile/me/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  PROFILE_ME_PFP: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/profile/me/pfp/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  PROFILE_ME_ENS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/profile/me/ens/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  PROFILE_NEWSLETTER_SUBSCRIBE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/profile/newsletter/subscribe/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
};

export type PROFILE_QUERY_ENDPOINTS = keyof typeof profileQueryApis;
export type PROFILE_MUTATION_ENDPOINTS = keyof typeof profileMutationApis;
