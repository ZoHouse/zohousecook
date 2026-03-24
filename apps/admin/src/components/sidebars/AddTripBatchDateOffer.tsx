import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import { Button, Drawer, Spin, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { Offer } from "../../config";
import { Form, FormElement } from "../Form";

interface OfferSidebarProps {
  isOpen: boolean;
  offerId: string | null;
  batchId: string;
  onClose: () => void;
  refetch: () => void;
}

const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const Currency = {
  code: "INR",
  id: "INR",
  name: "Indian Rupee",
  decimals: 8,
  symbol: "Rs",
};

const OfferSidebar: React.FC<OfferSidebarProps> = ({
  isOpen,
  offerId,
  batchId,
  refetch,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [form] = useForm();

  const currency = useWatch("currency", form);

  const { data: offerDetails } = useQueryApi<Offer>(
    "CAS_OFFERS",
    {
      enabled: isOpen && offerId != null,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${offerId}/`
  );

  const initialData = useMemo(() => {
    if (offerId && offerDetails) {
      const _data: GeneralObject = {
        ...offerDetails,
        currency: offerDetails.currency.code,
      };

      if (offerDetails.applicable_on_weekdays) {
        _data["applicable_on_weekdays"] =
          offerDetails.applicable_on_weekdays.map((day: number) => String(day));
      }

      Object.keys(_data).forEach((key) => {
        const value = String(_data[key]);
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
          _data[key] = dayjs(value);
        }
      });

      return _data;
    } else {
      return {};
    }
  }, [offerDetails && offerId]);

  const { mutate, isLoading: isUpdating } = useMutationApi(
    "CAS_OFFERS",
    {},
    "",
    offerId ? "PUT" : "POST"
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const discountTypeOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed.offer.discount_type.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const statusOptions = useMemo<Array<{ label: string; value: string }>>(() => {
    if (seed) {
      return seed.offer.status.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const discountType = useWatch("discount_type", form);

  const formFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Offer Name",
      disabled: offerId != null,
    },
    {
      name: "status",
      type: "radio",
      options: statusOptions,
      initialValue: "inactive",
      label: "Offer Status",
    },

    {
      name: "discount_type",
      type: "select",
      options: discountTypeOptions,
      required: true,
      label: "Type of Discount",
      disabled: offerId != null,
    },
    {
      name: "discount_value",
      type: "number",
      required: true,
      label: "Discount Value",
      disabled: offerId != null,
      maxValue: 100,
      minValue: 0,
      isHidden:
        discountType === "flat" ||
        discountType === "absolute" ||
        discountType === undefined,
    },
    {
      name: "discount_value",
      type: "price",
      required: true,
      label: "Discount Value",
      currency: Currency,
      disabled: offerId != null,
      minValue: 0,
      isHidden: discountType === "percentage",
    },
    {
      name: "max_discount_value",
      type: "price",
      currency: Currency,
      required: false,
      label: "Maximum Discount Value",
      disabled: offerId != null || !Currency,
    },

    {
      name: "applicable_after",
      type: "datetime",
      required: false,
      label: "Offer Applicable After Date",
      disabled: offerId != null,
    },
    {
      name: "applicable_before",
      type: "datetime",
      required: false,
      label: "Offer Applicable Before Date",
      disabled: offerId != null,
    },
    {
      name: "applicable_on_weekdays",
      type: "multiSelect",
      options: weekDays.map((day, index) => ({
        label: formatCapitalize(day),
        value: String(index),
      })),

      required: false,
      label: "Days of the Week Offer is Applicable",
      disabled: offerId != null,
    },
    {
      name: "min_booked_units",
      type: "number",
      required: false,
      label: "Minimum Booked Units",
      minValue: 0,
      disabled: offerId != null,
    },
    {
      name: "max_booked_units",
      type: "number",
      required: false,
      label: "Maximum Booked Units",
      minValue: 0,
      disabled: offerId != null,
    },
    {
      name: "min_booking_start_at",
      type: "datetime",
      required: false,
      label: "Minimum Booking Start Date",
      disabled: offerId != null,
    },
    {
      name: "max_booking_start_at",
      type: "datetime",
      required: false,
      label: "Maximum Booking Start Date",
      disabled: offerId != null,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (offerId) {
        return mutate(
          {
            data: {
              status: values.status || "inactive",
            },
            route: `${offerId}/`,
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Offer Updated.");
              queryClient.invalidateQueries(["cas", "offers"]);
              refetch();
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else {
        const _body = {
          applicable_skus: [batchId],
          currency: "INR",
          ...values,
        };

        if (_body["_id"]) {
          delete _body["_id"];
        }

        Object.keys(_body).forEach((key) => {
          const value = _body[key];
          if (dayjs.isDayjs(value)) {
            _body[key] = value.format("YYYY-MM-DDTHH:mm:ssZ");
          }
        });

        mutate(
          {
            data: _body,
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Added successfully.");
              queryClient.invalidateQueries(["cas", "offers"]);
              refetch();
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    });
  };

  useEffect(() => {
    if (offerId && initialData) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [offerId, initialData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={offerId ? `Update Offer` : `Add a New Offer`}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isUpdating}>
        <Form
          formData={form}
          formFields={formFields}
          initialValues={initialData}
        />
      </Spin>
    </Drawer>
  );
};

export default OfferSidebar;
