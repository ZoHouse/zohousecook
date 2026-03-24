import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation } from "@zo/utils/hooks";
import { getChangedFields } from "@zo/utils/object";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { Form, FormElement } from "../../Form";

interface PartnerRatePlanEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ratePlan: GeneralObject | null;
  refetch: () => void;
}

const PartnerRatePlanEditSidebar: React.FC<PartnerRatePlanEditSidebarProps> = ({
  isOpen,
  onClose,
  ratePlan,
  refetch,
}) => {
  const [form] = useForm();
  const { message } = App.useApp();

  const { mutate: updateRatePlan, isLoading } = useMutationApi(
    "CAS_INVENTORY_RATE_PLANS",
    {},
    "",
    "PUT"
  );

  const formattedData = useMemo(() => {
    if (ratePlan) {
      return {
        status: ratePlan.status,
      };
    }
    return {};
  }, [ratePlan]);

  const formFields: FormElement[] = [
    {
      name: "status",
      label: "Status",
      type: "radio",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  useEffect(() => {
    if (formattedData && isOpen) {
      form.setFieldsValue(formattedData);
    }
  }, [formattedData, isOpen, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    if (!ratePlan?.id) return;

    updateRatePlan(
      {
        data: getChangedFields(formattedData, form.getFieldsValue()),
        route: `${ratePlan.id}/`,
      },
      {
        onSuccess() {
          message.success("Rate plan status has been updated");
          refetch();
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const { hasFormDataChanged } = useFormValidation(
    form,
    formFields as FormElementType[],
    formattedData
  );

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={`Edit Rate Plan: ${ratePlan?.label_public || ""}`}
      extra={
        <Button
          onClick={handleSave}
          type="primary"
          disabled={!hasFormDataChanged}
          loading={isLoading}
        >
          Save
        </Button>
      }
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default PartnerRatePlanEditSidebar;
