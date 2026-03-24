import { LockResetOutlined } from "@mui/icons-material";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import { Alert, App, Button, Drawer, Flex, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Coupon, Currency, Inventory } from "../../config";
import { Form, FormElement } from "../Form";

interface TripCouponSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: string | null;
  refetch: () => void;
  inventoryId: string;
  setSelectedData: any;
}

const TripCouponSidebar: React.FC<TripCouponSidebarProps> = ({
  isOpen,
  couponId,
  onClose,
  inventoryId,
  refetch,
  setSelectedData,
}) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const router = useRouter();
  const [form] = useForm();
  const couponCode = useWatch("code", form);
  const currency = useWatch("currency", form);
  const discountType = useWatch("discount_type", form);

  const [couponsWithThisCode, setCouponsWithThisCode] = useState<
    Coupon[] | null
  >(null);

  const [isDuplicateCoupon, setIsDuplicateCoupon] = useState<boolean>(false);

  const { isLoading: isCheckingCode, refetch: refetchCouponsCheck } =
    useQueryApi(
      "CAS_COUPONS",
      {
        enabled: isValidString(couponCode),
        select: (data) => data.data,
        onSuccess(data) {
          if (data && data.count > 0) {
            setCouponsWithThisCode(data.results);
          } else {
            setCouponsWithThisCode(null);
          }
        },
      },
      "",
      `code=${couponCode?.trim().toUpperCase()}`
    );

  const { mutate, isLoading: isUpdating } = useMutationApi(
    "CAS_COUPONS",
    {},
    "",
    couponId ? "PUT" : "POST"
  );

  const { data: couponDetails } = useQueryApi<Coupon>(
    "CAS_COUPONS",
    {
      enabled: isOpen && couponId != null,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${couponId}/`
  );

  const initialData = useMemo(() => {
    if (couponId && couponDetails) {
      const _data: GeneralObject = {
        ...couponDetails,
        currency: couponDetails.currency.code,
      };

      if (couponDetails.applicable_after) {
        _data["applicable_after"] = dayjs(couponDetails.applicable_after);
      }
      if (couponDetails.applicable_before) {
        _data["applicable_before"] = dayjs(couponDetails.applicable_before);
      }

      return _data;
    } else {
      return {};
    }
  }, [couponDetails && couponId]);

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const discountTypeOptions = useMemo<
    Array<{ label: string; value: string }>
  >(() => {
    if (seed) {
      return seed.coupon.discount_type.map((value: string) => ({
        value: value,
        label: formatCapitalize(value),
      }));
    } else {
      return [];
    }
  }, [seed]);

  const statusOptions = useMemo<Array<{ label: string; value: string }>>(() => {
    if (seed) {
      return seed.coupon.status.map((value: string) => ({
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

  const selectedCurrency = useMemo(() => {
    if (currencies) {
      return currencies.find((c) => c.code === "INR");
    }
  }, [currencies, currency]);

  const couponCodeUserMessage = useMemo(() => {
    if (couponId != null || !isValidString(couponCode)) return null;

    if (isCheckingCode) {
      return (
        <Alert
          type="warning"
          showIcon
          message="Checking coupon code availability..."
          className="mb-4 -mt-4"
          icon={<LockResetOutlined />}
        />
      );
    }

    const hasCoupons = couponsWithThisCode && couponsWithThisCode?.length > 0;
    const firstCouponId = couponsWithThisCode?.[0]?.id;

    if (hasCoupons) {
      return (
        <Flex vertical align="end">
          <Alert
            type="error"
            showIcon
            message="Coupon code already exists and will be disabled."
          />
          <Button
            type="link"
            onClick={(e) => {
              window.open(
                `${process.env.WEB_BASE_URL}/admin/misc/coupons/${firstCouponId}/edit`,
                "_blank"
              );
            }}
          >
            View Details
          </Button>
        </Flex>
      );
    }

    return (
      <Alert
        className="mb-4 -mt-4"
        type="success"
        showIcon
        message="Coupon code is available."
      />
    );
  }, [couponsWithThisCode, couponId, couponCode]);

  const formFields: FormElement[] = [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Coupon Name",
      disabled: couponId != null,
    },
    {
      name: "status",
      type: "select",
      options: statusOptions,
      required: true,
      label: "Coupon Status",
    },
    {
      name: "code",
      type: "text",
      required: true,
      label: "Coupon Code",
      disabled: couponId != null,
      userMessage: couponCodeUserMessage,
    },
    {
      name: "discount_type",
      type: "select",
      options: discountTypeOptions,
      required: true,
      label: "Type of Discount",
      disabled: couponId != null,
    },
    {
      name: "discount_value",
      type: "price",
      required: true,
      label: "Discount Price",
      isHidden: discountType !== "flat",
      disabled: couponId != null,
      currency: selectedCurrency,
    },
    {
      name: "discount_value",
      type: "number",
      required: true,
      label: "Discount Value %",
      disabled: couponId != null,
      isHidden: discountType !== "percentage",
      maxValue: 100,
      minValue: 0,
    },
    {
      name: "max_discount_value",
      type: "price",
      currency: selectedCurrency,
      required: false,
      label: "Maximum Discount Value",
      disabled: couponId != null || !selectedCurrency,
    },
    {
      name: "applicable_after",
      type: "datetime",
      required: false,
      label: "Coupon Applicable After Date",
      disabled: couponId != null,
    },
    {
      name: "applicable_before",
      type: "datetime",
      required: false,
      label: "Coupon Applicable Before Date",
      disabled: couponId != null,
    },

    {
      name: "min_booked_units",
      type: "number",
      required: false,
      label: "Minimum Booked Units",
      disabled: couponId != null,
      minValue: 0,
    },
    {
      name: "max_booked_units",
      type: "number",
      required: false,
      label: "Maximum Booked Units",
      disabled: couponId != null,
      minValue: 0,
    },
    {
      name: "max_usage_count",
      type: "number",
      required: true,
      label: "Maximum Usage Count",
      initialValue: 1,
      disabled: couponId != null,
      minValue: 0,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSave = async () => {
    if (couponId) {
      return mutate(
        {
          data: {
            status: form.getFieldValue("status") || "inactive",
            applicable_inventories: [inventoryId],
          },
          route: `${couponId}/`,
        },
        {
          onSuccess: (data: GeneralObject) => {
            message.success("Coupon Updated.");
            queryClient.invalidateQueries(["cas", "coupons"]);
            refetch();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    } else {
      try {
        await form.validateFields();
        const _body = form.getFieldsValue();
        const requiredFields = ["code", "discount_type", "discount_value"];
        const missingFields = requiredFields.filter((field) => !_body[field]);

        if (missingFields.length > 0) {
          throw new Error("Missing required fields");
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

        _body["applicable_inventories"] = [inventoryId];
        _body["currency"] = "INR";

        mutate(
          {
            data: _body,
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Added successfully.");
              queryClient.invalidateQueries(["cas", "coupons"]);
              refetch();
              form.resetFields();
              onClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } catch (error) {
        message.error("Please fill in all required fields correctly");
      }
    }
  };

  const handleDuplicateAndCreateNew = () => {
    mutate(
      {
        data: {
          status: "inactive",
        },
        route: `${couponId}/`,
      },
      {
        onSuccess: (data: GeneralObject) => {
          setSelectedData(undefined);
          queryClient.invalidateQueries(["cas", "coupons"]);
          setIsDuplicateCoupon(true);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  useEffect(() => {
    if ((couponId || isDuplicateCoupon) && initialData) {
      form.setFieldsValue(initialData);
      setTimeout(() => {
        refetchCouponsCheck();
      }, 1000);
    } else {
      form.resetFields();
    }
  }, [couponId, initialData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={couponId ? `Update Coupon` : `Add a New Coupon`}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Spin spinning={isUpdating}>
        {couponId != null && (
          <Flex vertical align="end" className="mb-6">
            <Alert
              message="Existing coupons can only have their status modified. To create a new coupon with the same settings, click Duplicate"
              type="info"
              className="text-sm"
            />
            <Alert
              message="This will deactivate the current coupon."
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

export default TripCouponSidebar;
