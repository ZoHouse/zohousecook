import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const leadsQueryApis = {
  LEADS_INQUIRIES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["leads", "inquiries", additionalRoute],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/leads/inquiries/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const leadsMutationApis = {
  LEADS_INQUIRIES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/leads/inquiries/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type LEADS_QUERY_ENDPOINTS = keyof typeof leadsQueryApis;
export type LEADS_MUTATION_ENDPOINTS = keyof typeof leadsMutationApis;
