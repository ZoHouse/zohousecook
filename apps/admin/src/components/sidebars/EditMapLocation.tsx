import { useMutationApi, useQueryApi } from "@zo/auth";
import { Form, FormElementType, SidebarMini } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { App } from "antd";
import React, { useMemo } from "react";
import { areRequiredFieldsPresent } from "../../utils";

interface EditMapLocation {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  data: any;
}

const EditMapLocation: React.FC<EditMapLocation> = ({
  isOpen,
  onClose,
  refetch,
  data,
}) => {
  const { message } = App.useApp();
  const formattedData = useMemo(() => {
    if (data) {
      return {
        name: data?.features?.[0]?.properties?.name,
        location_type: data?.features?.[0]?.properties?.location_name,
      };
    } else {
      return {};
    }
  }, [data]);

  const { formData, getFormValue, handleChange, resetFormData } =
    useFormData(formattedData);

  const { mutate: updateLocations } = useMutationApi(
    "CAS_LOCATIONS",
    {},
    `${data?.features?.[0]?.id}/`,
    "PUT"
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
    updateLocations(
      {
        data: {
          name: formData.name,
          location_type: formData.location_type,
          geometry: data?.features[0]?.geometry,
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

export default EditMapLocation;
