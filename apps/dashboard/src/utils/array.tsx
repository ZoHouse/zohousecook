import { GeneralObject } from "@zo/definitions/general";

export const primarySorter = (a: GeneralObject, b: GeneralObject) => {
  if (a.primary && !b.primary) {
    return -1;
  }
  if (!a.primary && b.primary) {
    return 1;
  }
  return 0;
};