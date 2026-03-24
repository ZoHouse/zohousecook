import { GeneralObject } from "@zo/definitions/general";

export const objectToQueryString = (params: GeneralObject) => {
  const queryString = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");

  return queryString;
};
