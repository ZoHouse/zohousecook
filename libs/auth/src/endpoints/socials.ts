import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const socialsQueryApis = {
  SOCIALS_SHOWCASE_NFT: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "showcase", "nft", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/showcase/nft/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  SOCIALS_SHOWCASE_USER: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "showcase", "user", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/showcase/user/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  SOCIALS_SHOWCASE_NFT_ME: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "showcase", "nft", "me", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/showcase/nft/me/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  SOCIALS_SHOWCASE_COLLECTIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "showcase", "collections", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/showcase/collections/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  SOCIALS_TWITTER_OAUTH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "twitter", "oauth", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/twitter/oauth/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  SOCIALS_DISCORD_OAUTH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["socials", "discord", "oauth", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/socials/discord/oauth/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const socialsMutationApis = {
  SOCIALS_SHOWCASE_NFT_ME: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/socials/showcase/nft/me/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  SOCIALS_TWITTER_OAUTH_CALLBACK: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/socials/twitter/oauth/callback/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  SOCIALS_DISCORD_OAUTH_CALLBACK: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/socials/discord/oauth/callback/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),

  SOCIALS_TELEGRAM_OAUTH_CALLBACK: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/socials/telegram/oauth/callback/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
};

export type SOCIALS_QUERY_ENDPOINTS = keyof typeof socialsQueryApis;
export type SOCIALS_MUTATION_ENDPOINTS = keyof typeof socialsMutationApis;
