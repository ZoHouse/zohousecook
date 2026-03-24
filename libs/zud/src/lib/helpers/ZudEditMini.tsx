// eslint-disable-next-line @nx/enforce-module-boundaries
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { simpleSingularize } from "@zo/utils/string";
import { Button, Drawer, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Form } from "../../components/form";
import { FormFieldType } from "../../components/form/definitions";

interface ZudEditMiniProps {
  isOpen: boolean;
  data?: GeneralObject;
  queryEndpoint: QueryEndpoints;
  formFields: FormFieldType[];
  tableName?: string;
  conditionalFormRenders?: {
    [key: string]: (data: GeneralObject) => boolean;
  };
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (
    id: string | number,
    data: GeneralObject,
    onSuccessCallback?: () => void
  ) => void;
  onAdd: (data: GeneralObject, onSuccessCallback?: () => void) => void;
  isLoading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const areRequiredFieldsPresent = (
  formFields: FormFieldType[],
  formData: GeneralObject
): boolean => {
  const requiredKeys = formFields
    .filter((key) => key.required)
    .map((key) => key.name);
  return requiredKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(formData, key)
  );
};

const getSelectedFormFields = (
  formData: GeneralObject = {},
  formFields: FormFieldType[]
) => {
  const selectedFormFields: GeneralObject = {};
  for (const field in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, field)) {
      const fieldValue = formData[field];
      const fieldInfo = formFields.find((f) => f.name === field);

      if (fieldInfo && fieldInfo.submitKeySelector) {
        const submitKey = fieldInfo.submitKeySelector(fieldValue);
        selectedFormFields[field] = submitKey;
      } else {
        if (fieldInfo && fieldInfo.type === "datetime") {
          selectedFormFields[field] = dayjs(formData[field]).toISOString();
        } else {
          selectedFormFields[field] = formData[field];
        }
      }
    } else {
      selectedFormFields[field] = formData[field];
    }
  }
  return selectedFormFields;
};

const ZudEditMini: React.FC<ZudEditMiniProps> = ({
  isOpen,
  data,
  formFields,
  tableName,
  conditionalFormRenders,
  onClose,
  onUpdate,
  onAdd,
  queryEndpoint,
  isLoading,
}) => {
  const { data: rowDetails } = useQueryApi<GeneralObject>(
    queryEndpoint,
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      enabled: isOpen && data?.id != null,
    },
    `${data?.id}/`
  );

  const [formData] = useForm();
  const [renderedFormFields, setRenderedFormFields] =
    useState<FormFieldType[]>(formFields);

  const handleClick = () => {
    formData
      .validateFields()
      .then((values) => {
        if (!data || data.id == null) {
          onAdd(
            getSelectedFormFields(formData.getFieldsValue(), formFields),
            formData.resetFields
          );
        } else {
          onUpdate(
            data.id,
            getSelectedFormFields(formData.getFieldsValue(), formFields),
            formData.resetFields
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (data?.id != null) {
      const dataPool =
        Object.keys(data).length > 1 ? { ...data } : { ...rowDetails };
      const finalData: GeneralObject = {};

      formFields.forEach((dr) => {
        finalData[dr.name] = dataPool[dr.name];

        if (dr.dataSelector) {
          finalData[dr.name] = dr.dataSelector(dataPool[dr.name], dataPool);
        }
        if (dr.type === "datetime" || dr.type === "date") {
          finalData[dr.name] = dayjs(dataPool[dr.name]);
        }
        if (typeof dataPool[dr.name] === "object" && dataPool[dr.name]?.id) {
          finalData[dr.name] = dataPool[dr.name].id;
        }
      });

      const _renderedFormFields = formFields.map((field) => {
        if (
          field.type === "searchselect" ||
          field.type === "searchMultiSelect"
        ) {
          if (dataPool[field.name]) {
            const _data = dataPool[field.name];
            if (Array.isArray(_data)) {
              return {
                ...field,
                options: _data.map((item) => ({
                  label: item.name || item.nickname || item.title,
                  value: item.id,
                })),
              };
            }

            if (typeof _data === "object") {
              return {
                ...field,
                options: [
                  {
                    label: _data.name || _data.nickname || _data.title,
                    value: _data.id,
                  },
                ],
              };
            }
          }
        }
        return field;
      });

      setRenderedFormFields(_renderedFormFields);
      formData.setFieldsValue(finalData);
    }
  }, [data, rowDetails, formFields, formData]);

  const handleClose = () => {
    formData.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={`${data?.id == null ? "Add" : "Edit"} ${
        tableName ? simpleSingularize(tableName) : "Entry"
      }`}
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={[
        <Button type="primary" onClick={handleClick}>
          {data?.id == null ? "Add" : "Save"}
        </Button>,
      ]}
    >
      <Spin spinning={isLoading}>
        <Form isEditing={data?.id != null} formData={formData} formFields={renderedFormFields} />
      </Spin>
    </Drawer>
  );
};

export default ZudEditMini;
