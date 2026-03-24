/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import isEqual from "lodash.isequal";

const isValidObject = (data: any) =>
  data != null && typeof data === "object" && Object.keys(data).length > 0;

const makeValidObjectIfNot = (data: any) => {
  if (data != null && typeof data === "object") {
    return data;
  } else {
    data = {};
    return data;
  }
};

const createObject = (data: any[]) => {
  const obj: GeneralObject = {};
  data.forEach((d) => {
    obj[d.id] = d.name;
  });
  return obj;
};

const filterOptions = (input: any, option: any) => {
  return (
    String(option.label).toLowerCase().indexOf(String(input).toLowerCase()) >= 0
  );
};

const flattenObject = (inputObj: Record<string, any>): GeneralObject => {
  const result: GeneralObject = {};

  function recurse(current: Record<string, any>, flattenedKey: string): void {
    for (const key in current) {
      const value = current[key];
      const newKey = flattenedKey ? `${flattenedKey}.${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        recurse(value, newKey);
      } else {
        if (key === 'id') {
          result[flattenedKey] = value;
        } else {
          result[newKey] = value;
        }
      }
    }
  }
  recurse(inputObj, '');
  return result;
}


function filterObjectByArrayKeys(obj: GeneralObject, keysArray: string[]): GeneralObject {
  const filteredObj: GeneralObject = {};
  for (const key of keysArray) {
    if (obj[key]) {
      filteredObj[key] = obj[key];
    }
  }
  return filteredObj;
}


const separateFileKeys = (obj: GeneralObject, includeFormDatainFile: boolean = false) => {
  const fileKeys = Object.keys(obj).filter(
    (key) =>
      obj[key] instanceof File ||
      obj[key] instanceof FormData ||
      (typeof obj[key]?.url === "string" && typeof obj[key]?.id === "string") ||
      key === "image" || 
      key === "video"
  );

  const restKeys = Object.keys(obj).filter(
    (key) =>
      !(
        obj[key] instanceof File ||
        obj[key] instanceof FormData ||
        (typeof obj[key]?.url === "string" && typeof obj[key]?.id === "string") ||
        key === "image" ||
        key === "video"
      )
  );

  const fileObj: GeneralObject = {};
  fileKeys.forEach((key) => {
    if (includeFormDatainFile || !(obj[key] instanceof FormData)) {
      fileObj[key] = obj[key];
    }
  });

  const restObj: GeneralObject = {};
  restKeys.forEach((key) => {
    restObj[key] = obj[key];
  });

  return { fileObj, restObj };
};


const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  return isEqual(obj1, obj2)
}

const getChangedFields = (data: GeneralObject, formData: GeneralObject) => {
  const changedData: GeneralObject = {};
  Object.keys(formData).forEach((key) => {
    if (typeof data[key] === "object" && typeof formData[key] === "string") {
      if (!isEqual(data[key]?.id, formData[key])) {
        changedData[key] = formData[key];
      }
    } else {
      if (!isEqual(data[key], formData[key])) {
        changedData[key] = formData[key];
      }
    }
  });
  return changedData;
};

function removeUndefinedKeys(obj: GeneralObject): GeneralObject {
  return Object.keys(obj).reduce((acc, key) => {
    const typedKey = key as keyof typeof obj;
    const value = obj[typedKey];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[typedKey] = removeUndefinedKeys(value);
    }

    else if (value !== undefined) {
      acc[typedKey] = value;
    }

    return acc;
  }, {} as GeneralObject);
}
export { areObjectsEqual, createObject, filterObjectByArrayKeys, filterOptions, flattenObject, getChangedFields, isValidObject, makeValidObjectIfNot, removeUndefinedKeys, separateFileKeys };

