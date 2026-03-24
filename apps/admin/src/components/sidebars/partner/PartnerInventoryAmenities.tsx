import { useMutationApi, useQueryApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { useRouter } from "next/router";
import React, { useCallback } from "react";
import { Form, FormElement } from "../../Form";

interface PartnerInventoryAmenitiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  containerId: string;
  refetch: () => void;
  containerType: string;
}

const PartnerInventoryAmenitiesSidebar: React.FC<
  PartnerInventoryAmenitiesSidebarProps
> = ({ isOpen, onClose, containerId, refetch, containerType }) => {
  const router = useRouter();
  const [form] = useForm();

  const { mutate: createAmenity, isLoading } = useMutationApi("CAS_FEATURES");

  const formFields: FormElement[] = [
    {
      name: "feature",
      type: "searchMultiSelect",
      label: "Select Amenity",
      required: true,
      searchQueryApi: "CAS_FEATURES",
      optionRender: (data: any) => <span>{data.label}</span>,
      optionValueAndLabelSelector(data) {
        return {
          value: data.id,
          label: data.name,
        };
      },
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    form.validateFields().then(async (values) => {
      const featureIds: string[] = values.feature || [];

      for (const featureId of featureIds) {
        await new Promise<void>((resolve) => {
          createAmenity(
            {
              data: { feature: featureId },
              route: `${containerType}/${containerId}/relations/`,
            },
            {
              onSuccess: () => {
                resolve();
              },
              onError(error) {
                message.error(processResponseError(error));
                resolve();
              },
            }
          );
        });
      }

      message.success("Amenity Added Successfully");
      refetch();
      handleClose();
    });
  };

  const handleAddFeature = useCallback(() => {
    router.push("/misc/features");
  }, [router]);

  return (
    <Drawer
      title="Add Amenity"
      onClose={handleClose}
      open={isOpen}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={handleAddFeature} type="primary">
            Add Feature
          </Button>
        </div>
      }
      extra={
        <div style={{ textAlign: "right" }}>
          <Button onClick={handleSave} type="primary">
            Save
          </Button>
        </div>
      }
    >
      <Spin spinning={isLoading}>
        <Form className="w-full" formFields={formFields} formData={form} />
      </Spin>
    </Drawer>
  );
};

export default PartnerInventoryAmenitiesSidebar;
