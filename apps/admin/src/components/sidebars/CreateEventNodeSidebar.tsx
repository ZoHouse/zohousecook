import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Form, FormElementType, SidebarMini } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { isValidObject, removeUndefinedKeys } from "@zo/utils/object";
import { App } from "antd";
import React from "react";
import { areRequiredFieldsPresent } from "../../utils";

interface CreateEventNodeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: GeneralObject) => void;
}

const CreateEventNodeSidebar: React.FC<CreateEventNodeSidebarProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { mutate, isLoading } = useMutationApi("CAS_NODES");
  const { message } = App.useApp();

  const { formData, getFormValue, handleChange } = useFormData({});

  const formFields: FormElementType[] = [
    {
      label: "Name",
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "destination",
      label: "City",
      type: "searchselect",
      searchQueryApi: "CAS_DESTINATIONS",
      required: true,
      selectedValueSelector(data) {
        return data?.name;
      },
      submitKeySelector(value) {
        return value.id;
      },
    },
    {
      label: "Address",
      name: "address",
      type: "textarea",
      required: true,
    },
    {
      label: "Description",
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "coordinates",
      label: "Coordinates",
      type: "coordinates",
    },
  ];

  const handleCreateNewNode = () => {
    mutate(
      {
        data: removeUndefinedKeys({
          ...formData,
          destination: formData.destination?.id,
        }),
      },
      {
        onError(error) {
          message.error(processResponseError(error));
        },
        onSuccess(data) {
          message.success("Node Created Succesfully.");
          if (data.data && isValidObject(data.data)) {
            onSuccess(data.data);
          }
          onClose();
        },
      }
    );
  };

  return (
    <SidebarMini
      disableOutsideTapClose={true}
      headerOptions={{ title: "Create a new Node", hasCloseButton: true }}
      footerOptions={{
        actionButtons: [
          {
            label: "Create Node",
            type: "primary",
            onClick: handleCreateNewNode,
            disabled: !areRequiredFieldsPresent(formFields, formData),
            isLoading: isLoading,
          },
        ],
      }}
      isOpen={isOpen}
      onClose={onClose}
    >
      <Form
        handleChange={handleChange}
        formData={formData}
        formFields={formFields}
        getFormValue={getFormValue}
      />
    </SidebarMini>
  );
};

export default CreateEventNodeSidebar;
