import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zostelServer } from "../utils";

export const stayMutationApis = {
  STAY_CHECKIN: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/stay/checkin/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export const stayQueryApis = {
  ZOSTEL_STAY_OPERATORS: ((additionalRoute, search) => {
    return {
      queryKey: ["zostel", "stay", "operators", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/stay/operators/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  ZOSTEL_STAY_BOOKINGS: ((additionalRoute, search) => {
    return {
      queryKey: ["zostel", "stay", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/stay/bookings/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  STAY_MY_BOOKINGS_NEXT: ((additionalRoute, search) => {
    return {
      queryKey: [
        "zostel",
        "stay",
        "my",
        "bookings",
        "next",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/stay/my/bookings/next/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  STAY_MY_BOOKINGS_LIST: ((additionalRoute, search) => {
    return {
      queryKey: [
        "zostel",
        "stay",
        "my",
        "bookings",
        "list",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/stay/my/bookings/list/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
};

export type STAY_MUTATION_ENDPOINTS = keyof typeof stayMutationApis;
export type STAY_QUERY_ENDPOINTS = keyof typeof stayQueryApis;
