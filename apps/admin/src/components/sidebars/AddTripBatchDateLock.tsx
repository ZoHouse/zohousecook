import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { Button, Drawer, message } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { FormElement } from "../Form";
import Form from "../Form/Form";

interface AddTripBatchDateLockSidebarProps {
  selectedLockUnit: GeneralObject;
  selectedBatch: GeneralObject;
  selectedDate: string;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddTripBatchDateLockSidebar: React.FC<
  AddTripBatchDateLockSidebarProps
> = ({
  selectedLockUnit,
  selectedBatch,
  selectedDate,
  isOpen,
  onClose,
  refetch,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();

  const [currentReleaseType, setCurrentReleaseType] = useState<string>("");

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    select: (data) => data.data,
    refetchOnWindowFocus: false,
  });

  const { mutate: handleLocking, isLoading } = useMutationApi(
    "CAS_SKU",
    {},
    "",
    isValidObject(selectedLockUnit) ? "PUT" : "POST"
  );

  const initialValues = useMemo(() => {
    if (selectedLockUnit) {
      return {
        release: selectedLockUnit?.release,
        reason: selectedLockUnit?.reason,
        units: selectedLockUnit?.units,
      };
    } else {
      return {};
    }
  }, [selectedLockUnit]);

  useEffect(() => {
    if (isValidObject(initialValues)) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        date: selectedDate,
      };

      handleLocking(
        {
          data: payload,
          route: isValidObject(selectedLockUnit)
            ? `${selectedBatch?.id}/locking/${selectedLockUnit.id}/`
            : `${selectedBatch?.id}/locking/`,
        },
        {
          onSuccess() {
            message.success("Unit Lock updated successfully");
            queryClient.invalidateQueries(["cas", "sku"]);
            refetch();
            form.resetFields();
            onClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const handleClose = () => {
    onClose();
    form.resetFields();
    setCurrentReleaseType("");
  };

  useEffect(() => {
    if (initialValues?.release) {
      setCurrentReleaseType(initialValues.release);
    }
  }, [initialValues]);

  const handleFormChange = (changedValues?: any) => {
    if (changedValues?.release) {
      setCurrentReleaseType(changedValues.release);
    }
  };

  const isOnDemandSelected =
    currentReleaseType === "on-demand" &&
    selectedLockUnit?.release === "on-demand";

  const formFields: FormElement[] = [
    {
      name: "release",
      type: "radio",
      label: "Release Type",
      required: true,
      options: [
        { label: "Auto Unlocking", value: "on-demand" },
        { label: "Manual Unlocking", value: "manual" },
      ],
    },
    {
      name: "reason",
      type: "select",
      label: "Reason",
      required: true,
      disabled: isOnDemandSelected,
      options:
        seed?.sku_locking?.reason?.map((r: string) => ({
          label: r,
          value: r,
        })) || [],
    },
    {
      name: "units",
      type: "number",
      label: "Units",
      required: true,
      disabled: isOnDemandSelected,
    },
  ];

  return (
    <Drawer
      title={
        <>
          {selectedLockUnit ? "Update" : "Add"} Date {selectedBatch?.name}{" "}
          <span className="text-zui-silver">
            ({selectedBatch?.itinerary?.title})
          </span>
        </>
      }
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button onClick={handleSave} loading={isLoading} type="primary">
          Save
        </Button>
      }
    >
      <Form
        formData={form}
        formFields={formFields}
        initialValues={initialValues}
        onValueChange={handleFormChange}
      />
    </Drawer>
  );
};

export default AddTripBatchDateLockSidebar;
