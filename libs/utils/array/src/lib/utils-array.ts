import { ArrayObject, GeneralObject } from "@zo/definitions/general";

const groupBy = (array: GeneralObject[], key: string) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    );
    return result;
  }, {});
};

const groupObjectsByKeySelector = (
  data: GeneralObject[],
  selector: (data: GeneralObject) => string
) => {
  return data.reduce((acc: ArrayObject, curr: GeneralObject) => {
    const key = selector(curr);
    if (acc[key]) {
      acc[key].push(curr);
    } else {
      acc[key] = [curr];
    }
    return acc;
  }, {});
};

const areStringArraysEqual = (arr1: string[], arr2: string[]) =>
  arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i])

const isValidArray = (input: unknown): boolean => {
  if (!Array.isArray(input)) {
    return false;
  }
  if (input.length === 0) {
    return false;
  }

  return true;
}

export { areStringArraysEqual, groupBy, groupObjectsByKeySelector, isValidArray };

