import { QueryObjectFunction } from "@zo/definitions/auth";
import { zostelServer } from "../utils";

export const crsQueryApis = {
  CRS_OPERATORS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["crs", "operators", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/crs/operators/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CRS_BOOKINGS_SUMMARY: ((additionalRoute, search, config) => {
    return {
      queryKey: ["crs", "bookings", "summary", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/crs/reports/bookings/summary/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CRS_USER_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["crs", "user", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/crs/user/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CRS_REPORTS_USERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["crs", "reports", "users", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/crs/reports/users/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  CRS_ICON: ((additionalRoute, search, config) => {
    return {
      queryKey: ["crs", "icons", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/crs/icons/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const crsMutationApis = {};

export type CRS_QUERY_ENDPOINTS = keyof typeof crsQueryApis;
export type CRS_MUTATION_ENDPOINTS = keyof typeof crsMutationApis;
