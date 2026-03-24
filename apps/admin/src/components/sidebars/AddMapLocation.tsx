import { useMutationApi, useQueryApi } from "@zo/auth";
import { Form, FormElementType, SidebarMini } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { App } from "antd";
import { Feature } from "geojson";
import React from "react";
import { areRequiredFieldsPresent } from "../../utils";

interface AddMapLocation {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  data: Feature | null;
}

const AddMapLocation: React.FC<AddMapLocation> = ({
  isOpen,
  onClose,
  refetch,
  data,
}) => {
  const { message } = App.useApp();
  const { formData, getFormValue, handleChange, resetFormData } = useFormData(
    {}
  );

  const { mutate: createLocations } = useMutationApi(
    "CAS_LOCATIONS",
    {},
    "",
    "POST"
  );

  const { data: locationOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.locations["location-types"].map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const formFields: FormElementType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "location_type",
      label: "Location Type",
      type: "select",
      options: locationOptions,
      required: true,
    },
  ];

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  const handleCreateLocation = () => {
    createLocations(
      {
        data: {
          name: formData.name,
          location_type: formData.location_type,
          geometry: data?.geometry,
        },
      },
      {
        onSuccess() {
          message.success(`${formData.location_type} added successfully`);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <SidebarMini
      isOpen={isOpen}
      disableOutsideTapClose
      onClose={handleClose}
      headerOptions={{ title: "Add Location ", hasCloseButton: true }}
      footerOptions={{
        actionButtons: [
          {
            label: "Create Location",
            onClick: handleCreateLocation,
            type: "primary",
            disabled: !areRequiredFieldsPresent(formFields, formData),
          },
        ],
      }}
    >
      <div className="py-4">
        <Form
          formData={formData}
          formFields={formFields}
          handleChange={handleChange}
          getFormValue={getFormValue}
        />
      </div>
    </SidebarMini>
  );
};

export default AddMapLocation;
