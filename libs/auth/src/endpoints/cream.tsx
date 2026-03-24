import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const paymentQueryApis = {
  CREAM_PAYMENTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["cream", "payments", "search", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/cream/payments/${additionalRoute}?${search}`
        ),

      config,
    };
  }) as QueryObjectFunction,
};

export const paymentMutationApis = {
  CREAM_PAYMENTS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/cream/payments/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type PAYMENT_QUERY_ENDPOINTS = keyof typeof paymentQueryApis;
export type PAYMENT_MUTATION_ENDPOINTS = keyof typeof paymentMutationApis;
