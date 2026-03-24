import { MutationArgs, QueryObjectFunction } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Method } from "axios";
import { useMutation } from "react-query";
import { zoServer } from "../utils";

export const galleryQueryApis = {
  GALLERY_MEDIA: ((additionalRoute, search, config) => {
    return {
      queryKey: ["gallery", "media", , additionalRoute, search],
      queryFn: async () =>
        await zoServer.get(
          `/api/v1/gallery/media/${additionalRoute}?${search}`
        ),

      config,
    };
  }) as QueryObjectFunction,
};

export const galleryMutationApis = {
  GALLERY_MEDIA: (
    config: GeneralObject,
    additionalRoute: string,
    method: Method
  ) =>
    useMutation(
      async (data: MutationArgs) =>
        await zoServer({
          method: method,
          url: `/api/v1/gallery/media/${data.route || additionalRoute}`,
          data: data.data,
        }),
      config
    ),
};

export type GALLERY_QUERY_ENDPOINTS = keyof typeof galleryQueryApis;
export type GALLERY_MUTATION_ENDPOINTS = keyof typeof galleryMutationApis;
