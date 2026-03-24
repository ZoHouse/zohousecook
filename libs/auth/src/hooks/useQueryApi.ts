/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryConfig } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { AxiosError, AxiosResponse } from "axios";
import { useQuery } from "react-query";
import { ADMIN_QUERY_ENDPOINTS, adminQueryApis } from "../endpoints/admin";
import { AUTH_QUERY_ENDPOINTS, authQueryApis } from "../endpoints/auth";
import {
  AUTHORIZATION_QUERY_ENDPOINTS,
  authorizationQueryApis,
} from "../endpoints/authorization";
import {
  BOOKINGS_QUERY_ENDPOINTS,
  bookingsQueryApis,
} from "../endpoints/bookings";
import { CAS_QUERY_ENDPOINTS, casQueryApis } from "../endpoints/cas";
import { PAYMENT_QUERY_ENDPOINTS, paymentQueryApis } from "../endpoints/cream";
import { CRS_QUERY_ENDPOINTS, crsQueryApis } from "../endpoints/crs";
import {
  DISCOVER_QUERY_ENDPOINTS,
  discoverQueryApis,
} from "../endpoints/discover";
import {
  GALLERY_QUERY_ENDPOINTS,
  galleryMutationApis,
  galleryQueryApis,
} from "../endpoints/gallery";
import { LEADS_QUERY_ENDPOINTS, leadsQueryApis } from "../endpoints/leads";
import { PLACES_QUERY_ENDPOINTS, placesQueryApis } from "../endpoints/places";
import {
  PROFILE_QUERY_ENDPOINTS,
  profileQueryApis,
} from "../endpoints/profile";
import {
  SOCIALS_QUERY_ENDPOINTS,
  socialsQueryApis,
} from "../endpoints/socials";
import { STAY_QUERY_ENDPOINTS, stayQueryApis } from "../endpoints/stay";
import {
  WEBTHREE_QUERY_ENDPOINTS,
  webthreeQueryApis,
} from "../endpoints/webthree";
import {
  ZOWORLD_QUERY_ENDPOINTS,
  zoworldQueryApis,
} from "../endpoints/zoworld";

export type QueryEndpoints =
  | AUTH_QUERY_ENDPOINTS
  | BOOKINGS_QUERY_ENDPOINTS
  | CRS_QUERY_ENDPOINTS
  | PROFILE_QUERY_ENDPOINTS
  | CAS_QUERY_ENDPOINTS
  | ADMIN_QUERY_ENDPOINTS
  | STAY_QUERY_ENDPOINTS
  | SOCIALS_QUERY_ENDPOINTS
  | WEBTHREE_QUERY_ENDPOINTS
  | DISCOVER_QUERY_ENDPOINTS
  | ZOWORLD_QUERY_ENDPOINTS
  | LEADS_QUERY_ENDPOINTS
  | PAYMENT_QUERY_ENDPOINTS
  | PLACES_QUERY_ENDPOINTS
  | GALLERY_QUERY_ENDPOINTS
  | AUTHORIZATION_QUERY_ENDPOINTS;

const Apis = {
  ...authQueryApis,
  ...bookingsQueryApis,
  ...profileQueryApis,
  ...casQueryApis,
  ...socialsQueryApis,
  ...discoverQueryApis,
  ...crsQueryApis,
  ...webthreeQueryApis,
  ...galleryMutationApis,
  ...zoworldQueryApis,
  ...stayQueryApis,
  ...leadsQueryApis,
  ...adminQueryApis,
  ...paymentQueryApis,
  ...placesQueryApis,
  ...galleryQueryApis,
  ...authorizationQueryApis,
};

const useQueryApi = <T = AxiosResponse<GeneralObject & GeneralObject[]>>(
  name: QueryEndpoints,
  config?: QueryConfig,
  additionalRoute?: string,
  search?: string
) => {
  const queryArgs = Apis[name](
    additionalRoute || "",
    search || "",
    config || {}
  );
  return useQuery<any, AxiosError, T>(
    queryArgs.queryKey,
    queryArgs.queryFn,
    config as GeneralObject
  );
};

export default useQueryApi;
