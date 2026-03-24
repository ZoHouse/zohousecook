import * as Sentry from "@sentry/nextjs";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { countryCodes } from "@zo/zud";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { isValidPhoneNumber } from "libphonenumber-js";
import React, { useEffect } from "react";

interface RoleEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operator: GeneralObject;
  roles: GeneralObject[];
  association: GeneralObject | null;
}

interface UserAccessGroup {
  id: number;
  start_date: string | null;
  end_date: string | null;
}

type RoleEditFormValues = {
  first_name?: string;
  last_name?: string;
  gender?: string;
  mobile_country_code?: string;
  mobile_number?: string;
  slack_id?: string;
  access_group: number;
  start_date: Dayjs;
  end_date?: Dayjs;
};

type ProfileUpdateData = {
  first_name?: string;
  last_name?: string;
  gender?: number | null;
  staff_slack_user_id?: string;
  mobile_country_code?: string;
  mobile_number?: string;
};

const RoleEditSidebar: React.FC<RoleEditSidebarProps> = ({
  isOpen,
  onClose,
  onSuccess,
  operator,
  roles,
  association,
}) => {
  const [form] = Form.useForm<RoleEditFormValues>();

  const userMobile =
    association?.user?.mobile || association?.user?.mobile_number;
  const cleanMobile = userMobile
    ? String(userMobile).replace(/\D/g, "")
    : "";
  const mobileForFetch = cleanMobile;

  const { data: userDetails, isLoading: isUserLoading } =
    useQueryApi<GeneralObject>(
      "ADMIN_PM_GUEST_PROFILE",
      {
        enabled: !!mobileForFetch && isOpen,
        select: (data) => data?.data?.profile,
      },
      `${mobileForFetch}/`
    );

  const isMobileVerified = Boolean(userDetails?.mobile_verified);

  const { data: userAccessGroup } = useQueryApi<UserAccessGroup>(
    "ADMIN_USER_ACCESS_GROUP",
    {
      enabled:
        !!association?.user?.id &&
        !!association?.access_group?.id &&
        isOpen,
      select: (res) => {
        const results = res?.data?.results;
        return results && results.length > 0 ? results[0] : null;
      },
    },
    "",
    `user=${association?.user?.id}&access_group=${association?.access_group?.id}`
  );

  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useMutationApi("ADMIN_PROFILE", {}, "", "PUT");

  // Reverted to updateAccessGroup (PUT) for editing/updating the existing association
  const { mutateAsync: updateAssociation, isLoading: isUpdatingAccess } =
    useMutationApi("ADMIN_ASSOCIATION", {}, "", "PUT");

  useEffect(() => {
    if (!association || !isOpen) return;

    const user = association.user || {};

    form.setFieldsValue({
      first_name: user.first_name,
      last_name: user.last_name,
      gender:
        userDetails?.gender !== undefined &&
        userDetails?.gender !== null
          ? String(userDetails.gender)
          : user.gender !== undefined && user.gender !== null
          ? String(user.gender)
          : undefined,
      mobile_country_code: String(user.mobile_country_code || "91"),
      mobile_number: user.mobile_number || user.mobile,
      slack_id:
        userDetails?.staff_slack_user_id || user.staff_slack_user_id,
      access_group: association.access_group?.id,
      start_date: userAccessGroup?.start_date
        ? dayjs(userAccessGroup.start_date)
        : undefined,
      end_date: userAccessGroup?.end_date
        ? dayjs(userAccessGroup.end_date)
        : undefined,
    });
  }, [association, isOpen, userDetails, userAccessGroup, form]);

  const handleClose = () => {
    onClose();
    form.resetFields();
  };

  const handleSubmit = async (values: RoleEditFormValues) => {
    if (!association?.user?.id || !association?.id) {
      message.error("Unable to edit this staff member");
      return;
    }

    const userId = association.user.id;
    const associationId = association.id;

    try {
      // Update profile
      const profileData: ProfileUpdateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        gender:
          values.gender !== undefined && values.gender !== ""
            ? Number(values.gender)
            : null,
        staff_slack_user_id: values.slack_id,
      };

      if (!isMobileVerified) {
        profileData.mobile_country_code = values.mobile_country_code;
        profileData.mobile_number = values.mobile_number?.replace(
          /\D/g,
          ""
        );
      }

      await updateProfile({
        data: profileData,
        route: `${userId}/`,
      });

      // Update association
      await updateAssociation({
        route: `${associationId}/`,
        data: {
          model: "Operator",
          key: "id",
          value: String(operator.id),
          access_group: values.access_group,
          user: userId,
        },
      });

      message.success("Staff member updated successfully");
      handleClose();
      onSuccess();
    } catch (error) {
      Sentry.captureException(error);
      message.error(
        processResponseError(error) ||
          "Failed to update staff member"
      );
    }
  };

  const loading =
    isUpdatingProfile || isUpdatingAccess || isUserLoading;

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Edit Staff Member"
      width={520}
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        onFinishFailed={() => {
          message.error(
            "Please fill in all required fields correctly."
          );
        }}
      >
        <Form.Item name="first_name" label="First Name">
          <Input />
        </Form.Item>

        <Form.Item name="last_name" label="Last Name">
          <Input />
        </Form.Item>

        <Form.Item name="gender" label="Gender">
          <Radio.Group className="w-full grid grid-cols-3 gap-2">
            <Radio.Button value="0">Male</Radio.Button>
            <Radio.Button value="1">Female</Radio.Button>
            <Radio.Button value="2">Non-binary</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Mobile number" style={{ marginBottom: 0 }}>
          <div className="flex gap-2">
            <Form.Item
              name="mobile_country_code"
              style={{ marginBottom: 0 }}
            >
              <Select
                className="w-28"
                showSearch
                optionFilterProp="label"
                disabled
                options={countryCodes.map((c) => ({
                  value: c.phoneCode.replace(/\D/g, ""),
                  label: `+${c.phoneCode} ${c.country}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="mobile_number"
              style={{ marginBottom: 0, flex: 1 }}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || isMobileVerified) {
                      return Promise.resolve();
                    }
                    const full = `+${form.getFieldValue(
                      "mobile_country_code"
                    )}${value}`;

                    return isValidPhoneNumber(full)
                      ? Promise.resolve()
                      : Promise.reject(
                          "Enter a valid mobile number"
                        );
                  },
                },
              ]}
            >
              <Input
                placeholder="Enter mobile number (digits only)"
                disabled
              />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item name="slack_id" label="Slack Member ID">
          <Input />
        </Form.Item>

        <Form.Item
          name="access_group"
          label="Access Group"
          rules={[
            {
              required: true,
              message: "Please select an access group",
            },
          ]}
        >
          <Select
            options={roles.map((r) => ({
              value: r.id,
              label: r.name,
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item name="start_date" label="Start Date">
          <DatePicker className="w-full" disabled />
        </Form.Item>

        <Form.Item
          name="end_date"
          label="End Date (optional)"
        >
          <DatePicker className="w-full" disabled />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default RoleEditSidebar;
