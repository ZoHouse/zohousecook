import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const rwaQueryApis = {};

export const rwaMutationApis = {
  RWA_INFO_REQUEST: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/rwa/info-request/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type RWA_QUERY_ENDPOINTS = keyof typeof rwaQueryApis;
export type RWA_MUTATION_ENDPOINTS = keyof typeof rwaMutationApis;
