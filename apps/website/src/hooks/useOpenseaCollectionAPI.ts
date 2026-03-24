/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";
import { useQuery, UseQueryOptions } from "react-query";

const instance = axios.create();
instance.defaults.headers.common = {};
instance.defaults.headers.common.accept = "application/json";

const useOpenseaCollectionAPI = (
  slug: string,
  options: Omit<
    UseQueryOptions<
      AxiosResponse<any, any>,
      unknown,
      AxiosResponse<any, any>,
      string[]
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery(
    ["opensea-floor", slug],
    () =>
      instance.get(
        `https://core-api.prod.blur.io/v1/collections/${slug}/prices/`
      ),
    options
  );
};

export default useOpenseaCollectionAPI;
