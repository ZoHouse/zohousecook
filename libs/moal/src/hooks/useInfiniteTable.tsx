/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { ZudFilterOptionType } from "@zo/zud";

import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useInfiniteScroll } from "./useInfiniteScroll";

type Fetcher = {
  offset: number;
  reset?: boolean;
  extras?: string;
  customSearchQuery?: string;
};

const OFFSET = 20;

interface InfiniteProps {
  name: string;
  queryEndpoint: QueryEndpoints;
  filterOptions?: ZudFilterOptionType[];
  customSearchQuery?: string | undefined;
  setter: Dispatch<SetStateAction<GeneralObject[]>>;
  scrollingWindowRef?: React.RefObject<HTMLElement>;
  additionalRoute?: string;
  enabled?: boolean;
}

const getFilterQuery = (fetcher: Fetcher) => {
  return `limit=${OFFSET}&offset=${fetcher.offset}${
    fetcher.extras ? `&${fetcher.extras}` : ""
  }${fetcher.customSearchQuery ? `&${fetcher.customSearchQuery}` : ""}`;
};

const useInfiniteTable = ({
  customSearchQuery = "",
  name,
  setter,
  queryEndpoint,
  filterOptions,
  scrollingWindowRef,
  additionalRoute = "",
  enabled = true,
}: InfiniteProps) => {
  const router = useRouter();
  const { endReached, resetEnd } = useInfiniteScroll(scrollingWindowRef);

  // Initialize fetchData based on enabled state
  const [fetchData, setFetchData] = useState<Fetcher>({
    offset: 0,
    reset: true,
    customSearchQuery: enabled ? customSearchQuery : "",
    extras: "",
  });

  const [count, setCount] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only pass query parameters when enabled
  const queryParams = enabled && isInitialized ? getFilterQuery(fetchData) : "";

  const { data, isLoading, isFetching, isRefetching, refetch } = useQueryApi(
    queryEndpoint,
    {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: enabled && isInitialized,
      onSuccess: (data) => {
        if (data.data?.count) {
          setCount(data.data.count);
        }
        if (fetchData.reset) {
          console.log("Resetting data");
          setter(data.data.results || []);
        } else {
          console.log("Adding data");
          setter((prev) => [...prev, ...(data.data.results || [])]);
        }
        // Always reset endReached after successful data fetch
        resetEnd();
      },
    },
    additionalRoute,
    queryParams
  );

  // Initialize when enabled becomes true
  useEffect(() => {
    if (enabled && !isInitialized) {
      setIsInitialized(true);
      // Set initial fetch data when enabling
      setFetchData({
        offset: 0,
        reset: true,
        customSearchQuery: customSearchQuery,
        extras: "",
      });
    } else if (!enabled && isInitialized) {
      // Reset initialization when disabled
      setIsInitialized(false);
      setter([]);
      setCount(0);
    }
  }, [enabled, isInitialized, customSearchQuery, setter]);

  // Handle custom search query changes
  useEffect(() => {
    if (customSearchQuery && enabled && isInitialized) {
      setter([]);
      setFetchData({
        offset: 0,
        reset: true,
        customSearchQuery,
        extras: fetchData.extras || "",
      });
    }
  }, [customSearchQuery, enabled, isInitialized]);

  const hasMore = useMemo(() => {
    return data?.data.next != null;
  }, [data?.data]);

  // Handle filter options and router query changes
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    if (filterOptions || router.query) {
      const query = router.query;
      const newOptionValues: [string, string][] = [];

      if (filterOptions) {
        filterOptions.forEach((option) => {
          const key = `${name}-${option.key}`;
          if (option.type === "date_range") {
            const startKey = `${name}-${option.startKey}`;
            const endKey = `${name}-${option.endKey}`;
            if (query[startKey]) {
              newOptionValues.push([
                option.startKey as string,
                query[startKey] as string,
              ]);
            }
            if (query[endKey]) {
              newOptionValues.push([
                option.endKey as string,
                query[endKey] as string,
              ]);
            }
          } else if (option.type === "ordering") {
            if (query[key]) {
              newOptionValues.push([option.key, query[key] as string]);
            } else if (option.defaultSortKey) {
              newOptionValues.push([option.key, option.defaultSortKey]);
            }
          } else {
            const key = `${name}-${option.key}`;
            if (query[key]) {
              newOptionValues.push([option.key, query[key] as string]);
            }
          }
        });
      }

      // Handle search regardless of whether filterOptions is present
      const searchKey = Object.keys(query).find((key) =>
        key.includes("search")
      );
      if (searchKey && isValidString(searchKey)) {
        const searchValue = query[searchKey];
        if (searchValue && isValidString(searchValue)) {
          newOptionValues.push(["search", String(searchValue)]);
        }
      }

      if (newOptionValues.length) {
        const params = new URLSearchParams(customSearchQuery);

        newOptionValues.forEach(([key]) => {
          if (params.has(key)) {
            params.delete(key);
          }
        });

        const updatedCustomSearchQuery = params.toString();
        setFetchData({
          offset: 0,
          extras: newOptionValues.map((c) => c.join("=")).join("&"),
          reset: true,
          customSearchQuery: updatedCustomSearchQuery,
        });
      } else {
        if (fetchData.extras) {
          setFetchData({
            offset: 0,
            extras: "",
            reset: true,
            customSearchQuery,
          });
          setter([]);
        }
      }
    }
  }, [
    router.query,
    filterOptions,
    name,
    customSearchQuery,
    fetchData.extras,
    enabled,
    isInitialized,
  ]);

  const isLoadingData = useMemo(
    () => isLoading || isFetching || isRefetching,
    [isLoading, isFetching, isRefetching]
  );

  const reset = () => {
    resetEnd();
    if (enabled && isInitialized) {
      setFetchData({
        offset: 0,
        reset: true,
        customSearchQuery,
        extras: fetchData.extras || "",
      });
    }
    setter([]);
  };

  // Handle infinite scroll
  useEffect(() => {
    if (endReached && enabled && isInitialized) {
      if (hasMore) {
        if (!isLoadingData) {
          setFetchData((f) => {
            return {
              ...f,
              reset: false,
              offset: f.offset + OFFSET,
            };
          });
        } else {
          console.log("Already loading.");
        }
      } else {
        console.log("Fetched all");
      }
    }
  }, [endReached, enabled, isInitialized, hasMore, isLoadingData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetEnd();
      setter([]);
    };
  }, []);

  return {
    isLoading: isLoadingData,
    count: count,
    refetch,
    reset,
  };
};

export default useInfiniteTable;
