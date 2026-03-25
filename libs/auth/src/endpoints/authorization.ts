import { QueryObjectFunction } from "@zo/definitions/auth";
import { zostelServer } from "../utils";

export const authorizationMutationApis = {};

export const authorizationQueryApis = {
  AUTHORIZATION_MY_ASSOCIATION: ((additionalRoute, search, config) => {
    return {
      queryKey: ["authorization", "my", "association", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/authorization/my/association/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  AUTHORIZATION_SCOPE_ME: ((additionalRoute, search) => {
    return {
      queryKey: ["authorization", "scope", "me", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/authorization/scope/me/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
};

export type AUTHORIZATION_MUTATION_ENDPOINTS =
  keyof typeof authorizationMutationApis;
export type AUTHORIZATION_QUERY_ENDPOINTS = keyof typeof authorizationQueryApis;
