import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer, zostelServer } from "../utils";

export const authMutationApis = {
  AUTH_REQUEST_OTP_ZOSTEL: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/request-otp/zostel/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  AUTH_ACTIVATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/auth/activate/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_WEB3: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/web3/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_EMAIL: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/email/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_MOBILE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/mobile/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_MOBILE_OTP: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/mobile/otp/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_USER_WEB3_WALLETS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/user/web3-wallets/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  AUTH_USER_EMAILS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/user/emails/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_USER_EMAIL_CREATE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/user/email/create/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  AUTH_USER_MOBILES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/user/mobiles/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_AUTHORIZE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/authorize/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_REQUEST_OTP_EMAIL: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/request-otp/email/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  AUTH_REQUEST_OTP_MOBILE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/request-otp/mobile/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  AUTH_LOGIN_EMAIL_OTP: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/login/email/otp/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  AUTH_USER_MERGE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/auth/user/merge/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export const authQueryApis = {
  AUTHORIZATION_MY_ASSOCIATION: ((additionalRoute, search, config) => {
    return {
      queryKey: ["authorization", "my", "association", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/authorization/my/association/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  AUTH_USER_WEB3_WALLETS: ((additionalRoute, search) => {
    return {
      queryKey: ["auth", "user", "web3-wallets", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/auth/user/web3-wallets/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  AUTH_LOGIN_CROSS_LOGIN_REQUEST: ((additionalRoute, search) => {
    return {
      queryKey: [
        "auth",
        "login",
        "cross-login",
        "request",
        additionalRoute,
        search,
      ],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/auth/login/cross-login/request/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  AUTH_USER_EMAILS: ((additionalRoute, search) => {
    return {
      queryKey: ["auth", "user", "emails", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/auth/user/emails/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  AUTH_USER_MOBILES: ((additionalRoute, search) => {
    return {
      queryKey: ["auth", "user", "mobiles", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/auth/user/mobiles/${additionalRoute}?${search}`
        ),
    };
  }) as QueryObjectFunction,
  AUTH_SCOPE: ((additionalRoute, search) => {
    return {
      queryKey: ["auth", "scope", additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(`/api/v1/auth/scope/${additionalRoute}?${search}`),
    };
  }) as QueryObjectFunction,
};

export type AUTH_MUTATION_ENDPOINTS = keyof typeof authMutationApis;
export type AUTH_QUERY_ENDPOINTS = keyof typeof authQueryApis;
