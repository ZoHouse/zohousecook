import { CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { MobileInput } from "@zo/moal";
import { isValidEmail } from "@zo/utils/string";
import { Form as AntForm, Button, Drawer, message, Spin } from "antd";
import { TripGuest } from "apps/admin/src/config";
import dayjs from "dayjs";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatName, splitFullName, validateFullName } from "../../utils";
import { Form, FormElement } from "../Form";

interface AddTripGuestSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: TripGuest;
  onSave: (guest: TripGuest) => void;
}

const AddTripGuestSidebar: React.FC<AddTripGuestSidebarProps> = ({
  isOpen,
  onClose,
  guest,
  onSave,
}) => {
  const [form] = AntForm.useForm();
  const [mobile, setMobile] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isValidMobile, setIsValidMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countryId, setCountryId] = useState<string | number | null>(null);

  useEffect(() => {
    if (guest) {
      const fullName = formatName(
        [guest.first_name, guest.middle_name, guest.last_name]
          .filter(Boolean)
          .join(" ")
      );

      form.setFieldsValue({ ...guest, full_name: fullName });
      setMobile(guest.mobile);
      setIsValidMobile(true);
      setUserProfile(guest);
      setCountryId(guest.country || null);
      setIsLoading(false);
    } else {
      form.resetFields();
      setMobile("");
      setUserProfile(null);
      setCountryId(null);
    }
  }, [guest, form, isOpen]);

  /** -------- Handle mobile number validation -------- */
  useEffect(() => {
    const valid = isValidPhoneNumber(`+${mobile}`);
    setIsValidMobile(valid);

    if (!mobile || (!valid && isOpen)) {
      if (!guest) {
        form.resetFields();
        setUserProfile(null);
        setCountryId(null);
      }
      setIsLoading(false);
    }

    if (mobile.length >= 10 && !guest && valid) {
      setIsLoading(true);
    }
  }, [mobile, guest, form, isOpen]);

  /** -------- Generate search query -------- */
  const getSearchQuery = useCallback(() => {
    if (!isValidMobile || !mobile) return "";
    try {
      const parsedNumber = parsePhoneNumber(`+${mobile}`);
      return `search=${parsedNumber.nationalNumber}`;
    } catch (error) {
      console.error("Error parsing phone number:", error);
      return "";
    }
  }, [mobile, isValidMobile]);

  /** -------- Fetch user profile -------- */
  useQueryApi(
    "CAS_PROFILES",
    {
      enabled: isValidMobile && !guest,
      onSuccess: (data) => {
        const result = data?.data?.results?.[0];
        if (result) {
          setUserProfile(result);
          setCountryId(result?.country?.id);

          const fullName = formatName(
            [result.first_name, result.middle_name, result.last_name]
              .filter(Boolean)
              .join(" ")
          );

          form.setFieldsValue({
            full_name: fullName,
            email: result.user?.email_address,
            address: result.address,
            gender: result.gender,
            country: result.country?.name,
            date_of_birth:
              result.date_of_birth && dayjs(result.date_of_birth).isValid()
                ? dayjs(result.date_of_birth)
                : undefined,
          });
        } else {
          resetForm();
        }
      },
      onSettled: () => setIsLoading(false),
    },
    "",
    getSearchQuery()
  );

  /** -------- Reset form helper -------- */
  const resetForm = useCallback(() => {
    setUserProfile(null);
    setCountryId(null);
    form.resetFields();
  }, [form]);

  /** -------- Handle Submit -------- */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.email || !isValidEmail(values.email)) {
        return message.error("Please enter a valid email address");
      }

      const { firstName, middleName, lastName } = splitFullName(
        values.full_name
      );

      const formattedValues: Partial<TripGuest> = {
        ...values,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        gender: values.gender
          ? values.gender.charAt(0).toUpperCase() +
            values.gender.slice(1).toLowerCase()
          : values.gender,
        country: countryId,
        mobile,
        pid: userProfile?.pid,
        user: userProfile?.user,
      };

      onSave(formattedValues as TripGuest);
      resetForm();
      setMobile("");
      setIsValidMobile(false);
      setCountryId(null);
      onClose();
    } catch (err) {
      console.error("Form validation failed:", err);
    }
  };

  /** -------- Form Fields -------- */
  const formFields: FormElement[] = useMemo(
    () => [
      {
        name: "full_name",
        type: "text",
        label: "Full Name",
        required: true,
        disabled: !isValidMobile,
        rules: [
          {
            validator: (_: any, value: string) => {
              const validation = validateFullName(value);
              return validation.isValid
                ? Promise.resolve()
                : Promise.reject(validation.error);
            },
          },
        ],
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
        disabled: !isValidMobile,
      },
      {
        name: "date_of_birth",
        type: "date",
        label: "Date of Birth",
        disabled: !isValidMobile,
      },
      {
        name: "gender",
        type: "radio",
        label: "Gender",
        required: true,
        disabled: !isValidMobile,
        options: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
      },
      {
        name: "country",
        type: "searchselect",
        label: "Country",
        required: true,
        searchQueryApi: "CAS_COUNTRIES",
        disabled: !isValidMobile,
      },
      {
        name: "address",
        type: "textarea",
        label: "Address",
        disabled: !isValidMobile,
      },
    ],
    [isValidMobile]
  );

  return (
    <Drawer
      title={guest ? "Edit Guest" : "Add Guest"}
      open={isOpen}
      onClose={onClose}
      extra={[
        <Button
          key="submit"
          type="primary"
          disabled={!isValidMobile}
          onClick={handleSubmit}
        >
          {guest ? "Update" : "Add"}
        </Button>,
      ]}
    >
      <div className="relative">
        <MobileInput
          setter={setMobile}
          value={mobile}
          className="bg-zui-lighter mb-10"
        />

        {isLoading && (
          <div className="absolute right-4 top-4">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />}
            />
          </div>
        )}

        {userProfile && !isLoading && isValidMobile && (
          <div className="absolute right-2 top-2 text-green-500">
            <CheckCircleOutlined />
          </div>
        )}
      </div>

      <Form
        className={!isLoading && isValidMobile ? "opacity-100" : "opacity-20"}
        formData={form}
        formFields={formFields}
      />
    </Drawer>
  );
};

export default AddTripGuestSidebar;
