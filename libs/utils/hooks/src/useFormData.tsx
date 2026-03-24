/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import isEqual from "lodash.isequal";
import moment from "moment";
import { useEffect, useState } from "react";

const useFormData = (initialFieldData: GeneralObject) => {
  const [formData, setFormData] = useState<GeneralObject>({});
  const [isFormDataChanged, setIsFormDataChanged] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (name: string, type: string, value: any) => {
    if (type === "date") {
      value = moment(value).format("YYYY-MM-DD");
    } else if (type === "datetime") {
      value = moment(value).toISOString();
    }
    if (name.includes(".")) {
      const [firstKey, secondKey] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [firstKey]: { ...prev[firstKey], [secondKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (["text", "number", "email"].includes(type) && !value) {
      setFormData((prev) => {
        const _formData = { ...prev };
        delete _formData[name];
        return _formData;
      });
    }
  };

  const getFormValue = (
    formData: GeneralObject,
    key: string,
    alias?: string
  ) => {
    let _key: string = key;
    if (isValidString(alias) && alias) {
      _key = alias;
    }
    if (_key.includes(".")) {
      const [firstKey, secondKey] = _key.split(".");
      return formData[firstKey] ? formData[firstKey][secondKey] : null;
    } else {
      return formData[_key];
    }
  };

  const resetFormData = () => {
    setFormData({});
  };

  useEffect(() => {
    if (initialFieldData) {
      Object.keys(initialFieldData).forEach((key) => {
        if (key.includes(".")) {
          const [key1, key2] = key.split(".");
          setFormData((prev) => ({
            ...prev,
            [key1]: { ...prev[key1], [key2]: initialFieldData[key] },
          }));
        } else {
          setFormData((prev) => ({ ...prev, [key]: initialFieldData[key] }));
        }
      });
    }
  }, [initialFieldData]);

  useEffect(() => {
    if (Object.keys(formData).length !== Object.keys(initialFieldData).length) {
      setIsFormDataChanged(true);
    } else {
      if (!isEqual(formData, initialFieldData)) {
        setIsFormDataChanged(true);
      } else {
        setIsFormDataChanged(false);
      }
    }
  }, [formData, initialFieldData]);

  return {
    formData,
    handleChange,
    isFormDataChanged,
    resetFormData,
    getFormValue,
    setFormData,
  };
};

export default useFormData;
