import { AxiosResponse, Method } from "axios";
import { UseMutationOptions } from "react-query";
import {
  ADMIN_MUTATION_ENDPOINTS,
  adminMutationApis,
} from "../endpoints/admin";
import { AUTH_MUTATION_ENDPOINTS, authMutationApis } from "../endpoints/auth";
import {
  AUTHORIZATION_MUTATION_ENDPOINTS,
  authorizationMutationApis,
} from "../endpoints/authorization";
import {
  BOOKINGS_MUTATION_ENDPOINTS,
  bookingsMutationApis,
} from "../endpoints/bookings";
import { CAS_MUTATION_ENDPOINTS, casMutationApis } from "../endpoints/cas";
import { CRS_MUTATION_ENDPOINTS, crsMutationApis } from "../endpoints/crs";
import {
  PROFILE_MUTATION_ENDPOINTS,
  profileMutationApis,
} from "../endpoints/profile";
import {
  RZP_PAYMENT_MUTATION_ENDPOINTS,
  rzpPaymentMutationApis,
} from "../endpoints/rzp-payment";
import {
  SOCIALS_MUTATION_ENDPOINTS,
  socialsMutationApis,
} from "../endpoints/socials";
import { STAY_MUTATION_ENDPOINTS, stayMutationApis } from "../endpoints/stay";
import {
  WEBTHREE_MUTATION_ENDPOINTS,
  webthreeMutationApis,
} from "../endpoints/webthree";
import {
  ZOWORLD_MUTATION_ENDPOINTS,
  zoworldMutationApis,
} from "../endpoints/zoworld";

import {
  PAYMENT_MUTATION_ENDPOINTS,
  paymentMutationApis,
} from "../endpoints/cream";
import {
  DISCOVER_MUTATION_ENDPOINTS,
  discoverMutationApis,
} from "../endpoints/discover";
import {
  GALLERY_MUTATION_ENDPOINTS,
  galleryMutationApis,
} from "../endpoints/gallery";
import {
  LEADS_MUTATION_ENDPOINTS,
  leadsMutationApis,
} from "../endpoints/leads";
import {
  PLACES_MUTATION_ENDPOINTS,
  placesMutationApis,
} from "../endpoints/places";
import { RWA_MUTATION_ENDPOINTS, rwaMutationApis } from "../endpoints/rwa";

export type MutationEndpoints =
  | AUTH_MUTATION_ENDPOINTS
  | BOOKINGS_MUTATION_ENDPOINTS
  | CRS_MUTATION_ENDPOINTS
  | PROFILE_MUTATION_ENDPOINTS
  | ZOWORLD_MUTATION_ENDPOINTS
  | RZP_PAYMENT_MUTATION_ENDPOINTS
  | SOCIALS_MUTATION_ENDPOINTS
  | STAY_MUTATION_ENDPOINTS
  | WEBTHREE_MUTATION_ENDPOINTS
  | CAS_MUTATION_ENDPOINTS
  | ADMIN_MUTATION_ENDPOINTS
  | LEADS_MUTATION_ENDPOINTS
  | PAYMENT_MUTATION_ENDPOINTS
  | DISCOVER_MUTATION_ENDPOINTS
  | PLACES_MUTATION_ENDPOINTS
  | GALLERY_MUTATION_ENDPOINTS
  | RWA_MUTATION_ENDPOINTS
  | AUTHORIZATION_MUTATION_ENDPOINTS;

const Apis = {
  ...authMutationApis,
  ...bookingsMutationApis,
  ...profileMutationApis,
  ...crsMutationApis,
  ...discoverMutationApis,
  ...rzpPaymentMutationApis,
  ...socialsMutationApis,
  ...casMutationApis,
  ...webthreeMutationApis,
  ...zoworldMutationApis,
  ...stayMutationApis,
  ...leadsMutationApis,
  ...adminMutationApis,
  ...rwaMutationApis,
  ...paymentMutationApis,
  ...placesMutationApis,
  ...galleryMutationApis,
  ...authorizationMutationApis,
};

const useMutationApi = (
  name: MutationEndpoints,
  config?: Omit<
    UseMutationOptions<AxiosResponse<any, any>, unknown, unknown, unknown>,
    "mutationFn"
  >,
  additionalRoute?: string,
  method?: Method
) => {
  return Apis[name](config || {}, additionalRoute || "", method || "POST");
};

export default useMutationApi;
