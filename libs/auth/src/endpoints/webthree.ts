import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const webthreeQueryApis = {
  WEBTHREE_ENS_REVERSE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "ens", "reverse", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/ens/reverse/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_NFT_OWNED: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "nft", "owned", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/nft/owned/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_ENS_OWNED: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "ens", "owned", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/ens/owned/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_FOUNDER_ALLOWLIST: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "founder", "allowlist", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/founder/allowlist/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_FOUNDER_MARKETPLACE_LISTINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: [
        "webthree",
        "founder",
        "marketplace",
        "listings",
        additionalRoute,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/founder/marketplace/listings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_FOUNDER_JOIN_AL: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "founder", "join", "al", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/founder/join/al/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_NFT_AIRDROP_COLLECTIONS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "nft-airdrops", "collections", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/nft-airdrops/collections/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_POA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "poa", additionalRoute],
      queryFn: async () =>
        await zoServer.get(`/api/v1/webthree/poa/${additionalRoute}?${search}`),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_PUBLIC_POA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "public", "poa", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/public/poa/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_POA_METADATA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "public", "poa", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/poa/metadata/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_FOUNDER_NFTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "founder", "nfts", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/founder/nfts/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_FOUNDER_MEMBERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "founder", "members", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/founder/members/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  WEBTHREE_LEDGER_BALANCE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["webthree", "ledger", "balance"],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/webthree/ledger/balance/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const webthreeMutationApis = {
  WEBTHREE_FOUNDER_ALLOWLIST: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/webthree/founder/allowlist/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  WEBTHREE_NFT_AIRDROP_COLLECTION: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/webthree/nft-airdrops/collections/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  WEBTHREE_POA: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/webthree/poa/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  WEBTHREE_PUBLIC_POA: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/webthree/public/poa/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type WEBTHREE_QUERY_ENDPOINTS = keyof typeof webthreeQueryApis;
export type WEBTHREE_MUTATION_ENDPOINTS = keyof typeof webthreeMutationApis;
