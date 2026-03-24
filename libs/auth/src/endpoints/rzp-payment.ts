import { MutationArgs } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const rzpPaymentMutationApis = {
  PAYMENT_PROCESS_ORDER: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/rzp-payment/process-order/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  PAYMENT_PAYMENT_RESPONSE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/rzp-payment/payment-response/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
};

export const rzpPaymentQueryApis = {};

export type RZP_PAYMENT_MUTATION_ENDPOINTS =
  keyof typeof rzpPaymentMutationApis;
export type RZP_PAYMENT_QUERY_ENDPOINTS = keyof typeof rzpPaymentQueryApis;
