import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { App, Button, Descriptions, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { TripCustomer } from "../../config";
import { formatPrice } from "../../utils/formatPrice";
import { Form, FormElement } from "../Form";

interface TripCancellationProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
  selectedSkuId: number | null;
  refetch: () => void;
  refetchBookingInfo: () => void;
  selectedCustomer: TripCustomer | null;
}

const TripCancellation: React.FC<TripCancellationProps> = ({
  isOpen,
  onClose,
  bookingData,
  selectedSkuId,
  refetch,
  refetchBookingInfo,
  selectedCustomer,
}) => {
  const [form] = useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data: cancellationDetails, isLoading: isCancellationDetailsLoading } =
    useQueryApi<GeneralObject>(
      "CAS_TRIP_BOOKINGS",
      {
        enabled: isOpen && isValidObject(bookingData),
        select(data) {
          return data.data;
        },
        refetchOnWindowFocus: false,
      },
      `${bookingData?.id}/cancellation-details/`,
      selectedCustomer?.id && selectedSkuId != null
        ? `unit_ids=${selectedSkuId}`
        : ""
    );

  const { mutate: updateBooking, isLoading: isUpdateBookingLoading } =
    useMutationApi("CAS_TRIP_BOOKINGS", {}, "", "PUT");

  const initialValues = useMemo(() => {
    if (cancellationDetails) {
      return {
        refund_amount: cancellationDetails?.refund_amount,
      };
    } else {
      return {};
    }
  }, [cancellationDetails]);

  const formFields: FormElement[] = [
    {
      name: "cancellation_reason",
      type: "textarea",
      label: "Enter cancellation reason",
      required: true,
    },
    {
      name: "refund_type",
      type: "radio",
      label: "Refund To",
      initialValue: "refund",
      options: [
        { label: "Refund to Source", value: "refund" },
        { label: "Refund to Credits", value: "credits" },
      ],
    },
    {
      name: "refund_amount",
      type: "price",
      label: "Refund amount",
      currency: bookingData?.booked_skus?.[0]?.sku?.currency,
      placeholder: "Enter refund amount",
    },
  ];

  const handleCancelBookingClose = () => {
    form.resetFields();
    onClose();
  };

  const handleCancelBooking = () => {
    form.validateFields().then((values) => {
      updateBooking(
        {
          data: {
            reason: values.cancellation_reason,
            unit_ids: selectedSkuId ? [selectedSkuId.toString()] : undefined,
            refund_in_credits: values.refund_type === "credits",
            refund_amount: values.refund_amount,
          },
          route: `${bookingData.id}/cancel/`,
        },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              queryKey: ["cas", "trip", "bookings"],
            });
            refetch();
            refetchBookingInfo();
            message.success("Booking Cancelled");
            handleCancelBookingClose();
          },
          onError(error) {
            message.error(processResponseError(error));
            handleCancelBookingClose();
          },
        }
      );
    });
  };

  useEffect(() => {
    if (isValidObject(initialValues)) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleCancelBookingClose}
      title={selectedSkuId ? "Cancel Guest Booking" : "Cancellation Details"}
      destroyOnClose
      maskClosable={false}
      width={500}
      extra={
        <div className="flex justify-end mt-2">
          <Button
            danger
            loading={isUpdateBookingLoading}
            onClick={handleCancelBooking}
          >
            {selectedSkuId ? "Cancel Guest Booking" : "Cancel Booking"}
          </Button>
        </div>
      }
    >
      {isCancellationDetailsLoading ? (
        <div className="flex items-center justify-center">
          <Loader className="w-10 aspect-square" />
        </div>
      ) : isValidObject(cancellationDetails) ? (
        <div className="space-y-6">
          <p className="text-sm font-medium text-zui-silver">
            Are you sure you want to cancel this booking? Please note that
            cancellation policies may apply. This action is irreversible.
          </p>

          {selectedCustomer && (
            <div className="mb-6">
              <p className="text-base font-medium mb-4">Customer Information</p>
              <Descriptions bordered size="small" column={1} className="w-full">
                <Descriptions.Item
                  label={<span className="font-medium">Full Name</span>}
                >
                  {selectedCustomer.fullName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Email</span>}
                >
                  {selectedCustomer.email}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Mobile</span>}
                >
                  {selectedCustomer.mobile}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Gender</span>}
                >
                  {selectedCustomer.gender}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Age</span>}
                >
                  {selectedCustomer.age}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Nationality</span>}
                >
                  {selectedCustomer.nationality?.name}
                </Descriptions.Item>
                <Descriptions.Item
                  label={<span className="font-medium">Status</span>}
                >
                  <span className="capitalize">{selectedCustomer.status}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {cancellationDetails && isValidObject(cancellationDetails) && (
            <div>
              <p className="text-base font-medium mb-4">Cancellation Details</p>
              <Descriptions bordered size="small" column={1} className="w-full">
                {Object.keys(cancellationDetails).map((key: string) => {
                  const value = cancellationDetails[key];
                  let displayKey = key
                    .split("_")
                    .map(formatCapitalize)
                    .join(" ");
                  let displayValue = value;

                  // Special handling for refund amount
                  if (key === "refund_amount" && typeof value === "number") {
                    displayValue = formatPrice(
                      value,
                      bookingData?.booked_skus?.[0].sku.currency
                    );
                  }

                  // Special handling for hours till start
                  if (key === "hours_till_start" && typeof value === "number") {
                    const days = Math.floor(value / 24);
                    const hours = value % 24;
                    displayValue = `${days} days, ${hours} hours`;
                  }

                  return (
                    <Descriptions.Item
                      key={key}
                      label={<span className="font-medium">{displayKey}</span>}
                    >
                      {displayValue}
                    </Descriptions.Item>
                  );
                })}
              </Descriptions>
            </div>
          )}

          <Form
            formData={form}
            formFields={formFields}
            initialValues={initialValues}
          />
        </div>
      ) : (
        <div>
          <h2>Booking has already started. Cannot cancel.</h2>
        </div>
      )}
    </Drawer>
  );
};

export default TripCancellation;
