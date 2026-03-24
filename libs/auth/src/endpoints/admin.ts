import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zostelServer } from "../utils";

export const adminQueryApis = {
  ADMIN_PROFILE_SEARCH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "profile", "search", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/profile/search/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_CHECKIN: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "checkins", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/checkins/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_CHECKIN_SEARCH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "checkin", "search", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/checkin/search/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_BOOKINGS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "bookings", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/bookings/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_BOOKING_SEARCH: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "booking", "search", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/booking/search/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_REPORTS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "reports", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/reports/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_GUEST_PROFILE: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "guest-profile", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/guest-profile/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_PM_USER_NOTES: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "pm", "user-notes", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/pm/user-notes/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_USERS: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "users", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/users/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_ASSOCIATION: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "association", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/association/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_ACCESS_GROUP: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "access-group", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/access-group/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
  ADMIN_USER_ACCESS_GROUP: ((additionalRoute, search, config) => {
    return {
      queryKey: ["admin", "user-access-group", additionalRoute, search],
      queryFn: async () =>
        await zostelServer.get(
          `/api/v1/admin/user-access-group/${additionalRoute}?${search}`
        ),
      config,
    };
  }) as QueryObjectFunction,
};

export const adminMutationApis = {
  ADMIN_PM_GUEST_PROFILE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/pm/guest-profile/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
  ADMIN_PROFILE: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/profile/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  ADMIN_PM_CHECKIN: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/pm/checkins/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  ADMIN_PM_USER_NOTES: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/pm/user-notes${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),

  ADMIN_PM_BOOKINGS: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/pm/bookings${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  ADMIN_ASSOCIATION: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/association/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
  ADMIN_USER_ACCESS_GROUP: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zostelServer({
          method: method,
          url: `/api/v1/admin/user-access-group/${
            data.route || additionalRoute
          }`,
          data: data.data,
        }),
      config
    ),
};

export type ADMIN_QUERY_ENDPOINTS = keyof typeof adminQueryApis;
export type ADMIN_MUTATION_ENDPOINTS = keyof typeof adminMutationApis;
