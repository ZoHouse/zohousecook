import { useMutationApi, useQueryApi } from "@zo/auth";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation } from "@zo/utils/hooks";
import { isValidPhoneNumber } from "@zo/utils/number";
import {
  isValidEmail,
  isValidString,
  isValidTelegramUsername,
  isValidTwitterUsername,
} from "@zo/utils/string";
import { isValidAddress } from "@zo/utils/web3";
import { Alert, App, Button, Drawer, Space, Spin } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Estate, Space as SpaceType } from "../../config";
import { Form, FormElement } from "../Form";

interface AddVisitorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const visitPurposeOptions = [
  { value: "stay", label: "Stay" },
  { value: "event", label: "Event" },
  { value: "zoStudio", label: "Zo Studio" },
  { value: "work", label: "Work" },
  { value: "food", label: "Food" },
  { value: "chill", label: "Chill" },
  { value: "workshop", label: "Workshop" },
];

const CreateUserButton: React.FC<{
  onClickHandler: (value: boolean) => void;
}> = ({ onClickHandler }) => {
  return (
    <Button block onClick={() => onClickHandler(true)}>
      Create a New User
    </Button>
  );
};

const AddVisitorSidebar: React.FC<AddVisitorSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { mutate: createVisitor, isLoading: isCreating } =
    useMutationApi("CAS_VISITS");
  const [showUnverifiedUserFormFields, setShowUnverifiedUserFormFields] =
    useState<boolean>(false);
  const [formData] = useForm();

  const { data: estateOptions, isLoading: isLoadingEstates } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_ESTATES",
    {
      enabled: isOpen,
      select: (data) =>
        data.data.results.map((estate: Estate) => ({
          value: estate.id,
          label: estate.name,
        })),
    },
    "",
    "limit=100"
  );

  const selectedEstate = useWatch("estate", formData);
  const { data: spaceOptions, isLoading: isLoadingSpaces } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      enabled: isValidString(selectedEstate) && isOpen,
      select: (data) =>
        data.data.results.map((space: SpaceType) => ({
          value: space.id,
          label: space.name,
        })),
    },
    "",
    `floor__estate=${selectedEstate}&limit=100`
  );

  const handleClose = () => {
    formData.resetFields();
    setShowUnverifiedUserFormFields(false);
    onClose();
  };

  const validateForm = () => {
    if (
      !showUnverifiedUserFormFields &&
      !isValidString(formData.getFieldValue("visitor"))
    ) {
      return { isValid: false, message: "Please select a user" };
    }

    if (showUnverifiedUserFormFields) {
      const fields = [
        "name",
        "email_address",
        "wallet_address",
        "mobile_number",
        "twitter_username",
        "telegram_username",
      ];
      const hasAnyField = fields.some((field) =>
        isValidString(formData.getFieldValue(field))
      );
      if (!hasAnyField) {
        return {
          isValid: false,
          message: "Please fill at least one user detail",
        };
      }

      // Validate individual fields if they are filled
      const emailValue = formData.getFieldValue("email_address");
      if (isValidString(emailValue) && !isValidEmail(emailValue)) {
        return { isValid: false, message: "Invalid email address" };
      }

      const twitterValue = formData.getFieldValue("twitter_username");
      if (
        isValidString(twitterValue) &&
        !isValidTwitterUsername(twitterValue)
      ) {
        return { isValid: false, message: "Invalid Twitter handle" };
      }

      const walletValue = formData.getFieldValue("wallet_address");
      if (isValidString(walletValue) && !isValidAddress(walletValue)) {
        return { isValid: false, message: "Invalid wallet address" };
      }

      const phoneValue = formData.getFieldValue("mobile_number");
      if (isValidString(phoneValue) && !isValidPhoneNumber(phoneValue)) {
        return { isValid: false, message: "Invalid phone number" };
      }

      const telegramValue = formData.getFieldValue("telegram_username");
      if (
        isValidString(telegramValue) &&
        !isValidTelegramUsername(telegramValue)
      ) {
        return { isValid: false, message: "Invalid Telegram username" };
      }
    }

    return { isValid: true };
  };

  const handleSave = () => {
    const validation = validateForm();
    if (!validation.isValid) {
      message.error(validation.message || "Please check form fields");
      return;
    }

    const checkinTime = formData.getFieldValue("checkin_time")
      ? formData.getFieldValue("checkin_time")
      : moment(new Date()).toISOString();

    const formValues = formData.getFieldsValue();

    createVisitor(
      {
        data: {
          ...formValues,
          checkin_time: checkinTime,
        },
      },
      {
        onSuccess: () => {
          message.success("Visitor added successfully");
          queryClient.invalidateQueries(["cas", "visits"]);
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const formFields: FormElement[] = useMemo(() => {
    return [
      {
        name: "visitor",
        label: "User",
        type: "searchselect",
        searchQueryApi: "CAS_PROFILES",
        submitKeySelector: (data) => data.user.id,
        notFoundContent: (
          <CreateUserButton onClickHandler={setShowUnverifiedUserFormFields} />
        ),
        isHidden: showUnverifiedUserFormFields,
        responseFields: [
          "id",
          "user",
          "nickname",
          "selected_nickname",
          "pfp",
          "pid",
          "first_name",
          "last_name",
          "email_address",
          "wallet_address",
          "avatar",
        ],
        optionValueAndLabelSelector: (data) => ({
          value: data.user.id,
          label: data.nickname || data.first_name,
        }),
      },
      {
        name: "name",
        label: "Name",
        type: "text",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "email_address",
        label: "Email",
        type: "email",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "wallet_address",
        label: "Wallet",
        type: "text",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "mobile_number",
        label: "Phone Number",
        type: "phone",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "twitter_username",
        label: "Twitter Username",
        type: "text",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "telegram_username",
        label: "Telegram Username",
        type: "text",
        isHidden: !showUnverifiedUserFormFields,
      },
      {
        name: "estate",
        label: "Estate",
        type: "select",
        options: estateOptions,
        required: true,
      },
      {
        name: "space",
        label: "Space",
        type: "select",
        options: spaceOptions || [],
      },
      {
        name: "checkin_time",
        label: "Check In",
        type: "datetime",
        required: true,
        initialValue: new Date(),
      },
      {
        name: "checkout_time",
        label: "Check Out",
        type: "datetime",
      },
      {
        name: "purpose",
        label: "Purpose",
        type: "select",
        options: visitPurposeOptions,
        required: true,
      },
    ];
  }, [showUnverifiedUserFormFields, estateOptions, spaceOptions]);

  const { areAllRequiredFieldsPresent } = useFormValidation(
    formData,
    formFields as FormElementType[]
  );

  return (
    <Drawer
      title={"Add a New Visitor"}
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={[
        <Button
          disabled={!areAllRequiredFieldsPresent}
          type="primary"
          onClick={handleSave}
          loading={isCreating}
        >
          Create
        </Button>,
      ]}
    >
      <Spin spinning={isCreating} wrapperClassName="h-screen">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {(isLoadingEstates || isLoadingSpaces) && (
            <Alert message="Loading data..." type="info" showIcon />
          )}

          <Button
            type="link"
            onClick={() =>
              setShowUnverifiedUserFormFields(!showUnverifiedUserFormFields)
            }
            style={{ padding: 0 }}
          >
            {showUnverifiedUserFormFields
              ? "Switch to Registered User"
              : "Switch to Unregistered User"}
          </Button>

          <form className="flex flex-1 flex-col space-y-0.5 w-full h-full">
            <Form formData={formData} formFields={formFields} />
          </form>
        </Space>
      </Spin>
    </Drawer>
  );
};

export default AddVisitorSidebar;
