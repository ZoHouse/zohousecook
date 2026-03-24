import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer, zostelServer } from "../utils";

export const bookingsMutationApis = {
  BOOKINGS_STAY_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/bookings/stay/bookings/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  BOOKINGS_EXPERIENCE_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/bookings/experience/bookings/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  BOOKINGS_CUSTOMERS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/bookings/customers/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  BOOKINGS: (config: GeneralObject, additionalRoute: string, method: Method) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/bookings/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export const bookingsQueryApis = {
  BOOKINGS_STAY_AVAILABILITY: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "stay", "availability", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/stay/availability/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_STAY_PRICING: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "stay", "pricing", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/stay/pricing/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_STAY_OPERATORS: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "stay", "operators", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/stay/operators/${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,

  BOOKINGS_EXPERIENCE_AVAILABILITY: ((additionalRoute, search) => {
    return {
      queryKey: [
        "bookings",
        "experience",
        "availability",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/experience/availability/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_EXPERIENCE_PRICING: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "experience", "pricing", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/experience/pricing/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_EXPERIENCE_OPERATORS: ((additionalRoute, search) => {
    return {
      queryKey: [
        "bookings",
        "experience",
        "operators",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/experience/operators/${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_CUSTOMERS: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "cutomers", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/customers/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_STAY_BOOKINGS__GET: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "stay", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/stay/bookings${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/bookings${additionalRoute}/?${search}`),
    };
  }) as QueryObjectFunction,
  BOOKINGS_EXPERIENCE_BOOKINGS: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "experience", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/experience/bookings${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
  // /experience/all/inventory/
  BOOKINGS_EXPERIENCE_INVENTORY: ((additionalRoute, search) => {
    return {
      queryKey: [
        "bookings",
        "experience",
        "inventory",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/experience/inventory${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
  // /activity/{operatorID}/inventory/
  BOOKINGS_ACTIVITY_OPERATOR: ((additionalRoute, search) => {
    return {
      queryKey: [
        "bookings",
        "activity",
        "operator",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/activity/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_SEED: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "seed", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/seed${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
  BOOKINGS_DESTINATIONS: ((additionalRoute, search) => {
    return {
      queryKey: ["bookings", "seed", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/bookings/destinations${additionalRoute}/?${search}`
        ),
    };
  }) as QueryObjectFunction,
};

export type BOOKINGS_MUTATION_ENDPOINTS = keyof typeof bookingsMutationApis;
export type BOOKINGS_QUERY_ENDPOINTS = keyof typeof bookingsQueryApis;
