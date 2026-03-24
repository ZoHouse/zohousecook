import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { combineRouteAndQueryParams, formatCapitalize } from "@zo/utils/string";
import { Alert, Button, Drawer, Flex, Spin, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Currency, Inventory, Offer } from "../../config";
import { durationToHours } from "../../utils";
import { Form, FormElement } from "../Form";

interface OfferSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string | null;
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

const OfferSidebar: React.FC<OfferSidebarProps> = ({
  isOpen,
  offerId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [form] = useForm();

  const deltaFormat = useWatch("delta_format", form);
  const currency = useWatch("currency", form);

  const [isDuplicateOffer, setIsDuplicateOffer] = useState<boolean>(false);

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
        delta_format: "days",
      };

      if (offerDetails.max_booked_on_delta) {
        const maxDeltaDurationInHours = durationToHours(
          String(offerDetails.max_booked_on_delta)
        );

        _data["max_booked_on_delta"] = maxDeltaDurationInHours;

        if (maxDeltaDurationInHours > 24) {
          _data["delta_format"] = "days";
          _data["max_booked_on_delta"] = maxDeltaDurationInHours / 24;
        } else {
          _data["delta_format"] = "hours";
        }
      }

      if (offerDetails.applicable_inventories) {
        _data["applicable_inventories"] =
          offerDetails.applicable_inventories.map(
            (inventory: Inventory) => inventory.id
          );
      }

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

  const contractOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed.offer.contract_standard.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const { data: currencies } = useQueryApi<Array<Currency>>(
    "CAS_CURRENCY",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    "",
    "limit=-1"
  );

  const currencyOptions = useMemo(() => {
    if (currencies) {
      return currencies.map((currency: Currency) => ({
        label: currency.name,
        value: currency.id,
      }));
    } else {
      return [];
    }
  }, [currencies]);

  const deltaFormatOptions = useMemo(
    () =>
      ["days", "hours"].map((format: string) => ({
        label: formatCapitalize(format),
        value: format,
      })),
    []
  );

  const selectedCurrency = useMemo(() => {
    if (currencies) {
      return currencies.find((c) => c.code === currency);
    }
  }, [currencies, currency]);

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
      name: "currency",
      type: "select",
      options: currencyOptions,
      required: true,
      label: "Currency for Offer",
      disabled: offerId != null,
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
    },
    {
      name: "max_discount_value",
      type: "price",
      currency: selectedCurrency,
      required: false,
      label: "Maximum Discount Value",
      disabled: offerId != null || !selectedCurrency,
    },
    {
      name: "applicable_inventories",
      type: "searchMultiSelect",
      required: false,
      label: `Applicable on Inventories`,
      disabled: offerId != null,
      searchQueryApi: "CAS_INVENTORY",
      initialValue: [],
      options: offerDetails?.applicable_inventories
        ? offerDetails?.applicable_inventories.map((inventory: Inventory) => ({
            value: inventory.id,
            label: inventory.name,
          }))
        : [],
      optionValueAndLabelSelector(data) {
        return {
          value: data.id,
          label: data.name,
        };
      },
    },
    {
      name: "contract_standard",
      type: "select",
      required: true,
      label: "Contract Standard",
      options: contractOptions,
      disabled: offerId != null,
    },
    {
      name: "contract_address",
      type: "text",
      required: true,
      label: "Contract Address",
      disabled: offerId != null,
    },
    {
      name: "min_nfts_owned",
      type: "number",
      required: true,
      label: "Minimum NFTs Owned",
      minValue: 0,
      disabled: offerId != null,
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
      name: "max_booking_end_at",
      type: "datetime",
      required: false,
      label: "Maximum Booking End Date",
      disabled: offerId != null,
    },
    {
      name: "delta_format",
      type: "select",
      required: false,
      label: "Delta Format",
      options: deltaFormatOptions,
      initialValue: "days",
      disabled: offerId != null,
    },
    {
      name: "max_booked_on_delta",
      type: "number",
      required: false,
      label: `Maximum Booked on Delta (${formatCapitalize(
        deltaFormat || "days"
      )})`,
      minValue: 0,
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
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else {
        const _body = { status: "active", ...values };

        if (_body["max_booked_on_delta"]) {
          const maxBookValue = _body["max_booked_on_delta"];
          _body["max_booked_on_delta"] = `${
            _body["delta_format"] === "hours" ? maxBookValue : maxBookValue * 24
          }:00:00`;
          delete _body["delta_format"];
        }

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

  const handleDuplicateAndCreateNew = () => {
    mutate(
      {
        data: {
          status: "inactive",
        },
        route: `${offerId}/`,
      },
      {
        onSuccess: (data: GeneralObject) => {
          resetURLParam();
          queryClient.invalidateQueries(["cas", "offers"]);
          setIsDuplicateOffer(true);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const resetURLParam = () => {
    router.push(
      combineRouteAndQueryParams(`/misc/offers/new`, {}, true),
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    if ((offerId || isDuplicateOffer) && initialData) {
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
        {offerId != null && (
          <Flex vertical align="end" className="mb-6">
            <Alert
              message="Existing offers can only have their status modified. To create a new offer with the same settings, click Duplicate"
              type="info"
              className="text-sm"
            />
            <Alert
              message="This will deactivate the current offer."
              type="warning"
              showIcon
              className="text-sm mt-2 w-full"
            />
            <Button
              type="link"
              className="mt-2"
              onClick={handleDuplicateAndCreateNew}
            >
              Duplicate
            </Button>
          </Flex>
        )}
        <Form formData={form} formFields={formFields} />
      </Spin>
    </Drawer>
  );
};

export default OfferSidebar;
