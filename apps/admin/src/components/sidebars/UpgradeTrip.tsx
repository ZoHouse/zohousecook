import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useState } from "react";
import { Form, FormElement } from "../Form";
import { UpgradePreviewModal } from "../helpers/trips-booking";

interface UpgradeTripProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
  refetch: () => void;
}

const UpgradeTrip: React.FC<UpgradeTripProps> = ({
  isOpen,
  onClose,
  bookingData,
  refetch,
}) => {
  const [upgradeForm] = useForm();
  const { message } = App.useApp();
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [upgradePreviewData, setUpgradePreviewData] =
    useState<GeneralObject | null>(null);

  const { mutate: upgradeTrip, isLoading: isUpgradingTrip } = useMutationApi(
    "CAS_TRIP_BOOKINGS",
    {},
    "",
    "POST"
  );

  const handleUpgradeConfirm = () => {
    upgradeForm.validateFields().then((values) => {
      upgradeTrip(
        {
          data: {
            name: values.name,
            price: values.price,
            description: "",
            preview: true,
          },
          route: `${bookingData?.id}/upgrade/`,
        },
        {
          onSuccess(data) {
            setUpgradePreviewData(data.data);
            setIsPreviewModalOpen(true);
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const handleClose = () => {
    refetch();
    setIsPreviewModalOpen(false);
    upgradeForm.resetFields();
    setUpgradePreviewData(null);
    onClose();
  };

  const upgradeFormFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      label: "Upgrade Name",
      required: true,
      placeholder: "Enter upgrade name",
    },
    {
      name: "price",
      type: "price",
      label: "Upgrade Price",
      required: true,
      currency: bookingData?.booked_skus?.[0]?.sku?.currency,
      placeholder: "Enter upgrade price",
    },
  ];

  return (
    <Drawer
      title="Upgrade Trip"
      open={isOpen}
      onClose={handleClose}
      width={500}
      extra={
        <Button
          type="primary"
          onClick={handleUpgradeConfirm}
          loading={isUpgradingTrip}
        >
          Confirm Upgrade
        </Button>
      }
    >
      <Form formData={upgradeForm} formFields={upgradeFormFields} />

      {!isUpgradingTrip && (
        <UpgradePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClose}
          upgradePreviewData={upgradePreviewData}
          bookingData={bookingData}
        />
      )}
    </Drawer>
  );
};

export default UpgradeTrip;
