import { GeneralObject } from "@zo/definitions/general";

// retuns object with keys given in the keysArray
function filterObjectByKeys<T extends GeneralObject>(
  keysArray: (keyof T)[],
  obj: T
): Partial<T> {
  return keysArray.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Partial<T>);
}

export { filterObjectByKeys };

