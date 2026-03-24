import * as Sentry from "@sentry/nextjs";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { countryCodes } from "@zo/zud";
import {
  AutoComplete,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { isValidPhoneNumber } from "libphonenumber-js";
import React, { useMemo, useState } from "react";

interface RoleAddSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operator: GeneralObject;
  roles: GeneralObject[];
}

type RoleFormValues = {
  user: number;
  operator: string;
  access_group: number;
  start_date: Dayjs;
  end_date?: Dayjs;
  // create-new-user fields
  new_first_name?: string;
  new_last_name?: string;
  new_gender?: string;
  new_mobile_country_code?: string;
  new_mobile_number?: string;
  slack_id?: string;
};

const RoleAddSidebar: React.FC<RoleAddSidebarProps> = ({
  isOpen,
  onClose,
  onSuccess,
  operator,
  roles,
}) => {
  const [form] = Form.useForm<RoleFormValues>();
  // deprecated after changing to mobile-only search
  // const [searchValue, setSearchValue] = useState<string>("");
  const [isCreatingNewUser, setIsCreatingNewUser] = useState<boolean>(false);
  const [isUserLocked, setIsUserLocked] = useState<boolean>(false);
  const [newMobileCombined, setNewMobileCombined] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<GeneralObject | null>(null);
  const [mobileSearch, setMobileSearch] = useState<string>("");
  const [mobileValue, setMobileValue] = useState<string>("");
  const [mobileError, setMobileError] = useState<string>("");
  const [isMobileValid, setIsMobileValid] = useState<boolean>(false);

  const { data: profileResults } = useQueryApi<GeneralObject>(
    "ADMIN_PROFILE_SEARCH",
    {
      enabled: mobileSearch.length >= 4,
      keepPreviousData: true,
      select: (data) => data.data, // expects { profiles: [...] }
    },
    "",
    mobileSearch ? `q=${encodeURIComponent(mobileSearch)}` : ""
  );

  const profileMap = useMemo(() => {
    const map: Record<string, GeneralObject> = {};
    (profileResults?.profiles || []).forEach((p: GeneralObject) => {
      map[String(p.id)] = p;
    });
    return map;
  }, [profileResults]);

  type MobileOption = { key: string; value: string; label: string };

  const mobileOptions = useMemo<MobileOption[]>(() => {
    if (!isMobileValid) return [];
    const profiles: GeneralObject[] = profileResults?.profiles || [];
    const identified = profiles.filter(
      (p) =>
        Boolean(p.first_name) || Boolean(p.last_name) || p.gender !== undefined
    );

    const existingOptions: MobileOption[] = identified.map((p) => {
      const numberDigits = String(p.mobile_number || p.mobile || "").replace(
        /\D/g,
        ""
      );
      const displayPhone = `+${
        p.mobile_country_code || ""
      } ${numberDigits}`.trim();
      const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      return {
        key: `existing:${p.id}`,
        value: numberDigits,
        label: `${displayPhone} — ${name}`,
      };
    });

    const code = form.getFieldValue("new_mobile_country_code");
    const number = form.getFieldValue("new_mobile_number");
    const newOption: MobileOption | null =
      isMobileValid && (number || "").length >= 4
        ? {
            key: `new:${code || ""}:${number}`,
            value: String(number),
            label: "Add New User",
          }
        : null;

    // Only one type shown: existing if present, else new option
    if (existingOptions.length > 0) return existingOptions;
    return newOption ? [newOption] : [];
  }, [form, profileResults, isMobileValid]);

  const { mutateAsync: createUserAccess, isLoading: isCreatingUserAccess } =
    useMutationApi("ADMIN_USER_ACCESS_GROUP");
  const { mutateAsync: createAssociation, isLoading: isCreatingAssociation } =
    useMutationApi("ADMIN_ASSOCIATION");
  const { mutateAsync: updateProfile } = useMutationApi(
    "ADMIN_PROFILE",
    {},
    "",
    "PUT"
  );

  const { refetch: refetchCreateGuest } = useQueryApi<GeneralObject>(
    "ADMIN_PM_GUEST_PROFILE",
    {
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      select: (data) => data.data.profile,
    },
    `${newMobileCombined}/`
  );

  const handleClose = () => {
    form.resetFields();
    // setSearchValue("");
    setIsCreatingNewUser(false);
    setIsUserLocked(false);
    setNewMobileCombined("");
    setSelectedUser(null);
    setMobileSearch("");
    onClose();
  };

  const handleSubmit = async (values: RoleFormValues) => {
    try {
      let userId = selectedUser?.id as number | undefined;

      if (!userId && newMobileCombined) {
        // 1. Create user through GET guest-profile (creates if not exists)
        const created = await refetchCreateGuest();
        const profile = created?.data as GeneralObject;
        if (!profile?.id) {
          message.error("Failed to create user");
          return;
        }
        userId = profile.id;

        // 2. Update profile data
        await updateProfile({
          data: {
            first_name: values.new_first_name,
            last_name: values.new_last_name,
            gender: Number(values.new_gender),
            mobile_country_code: values.new_mobile_country_code,
            mobile_number: values.new_mobile_number,
          },
          route: `${profile.id}/`,
        });

        // Reset create-new-user flow and set selected user
        form.setFieldsValue({
          user: userId as number,
          new_first_name: undefined,
          new_last_name: undefined,
          new_gender: undefined,
          new_mobile_country_code: undefined,
          new_mobile_number: undefined,
        });
        setIsCreatingNewUser(false);
        setIsUserLocked(true);
        setNewMobileCombined("");
        setSelectedUser(profile);
      }

      if (
        values.slack_id &&
        values.slack_id !== selectedUser?.staff_slack_user_id
      ) {
        await updateProfile({
          data: {
            staff_slack_user_id: values.slack_id,
          },
          route: `${userId}/`,
        });
        form.setFieldsValue({
          slack_id: undefined,
        });
      }

      // 3. Create user access group
      await createUserAccess({
        data: {
          access_group: values.access_group,
          user: userId,
          start_date: values.start_date.format("YYYY-MM-DD"),
          end_date: values.end_date
            ? values.end_date.format("YYYY-MM-DD")
            : null,
        },
      });

      // 4. Create association
      await createAssociation({
        data: {
          model: "Operator",
          value: String(operator.id),
          access_group: values.access_group,
          user: userId,
          key: "id",
        },
      });

      message.success("Role added successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      Sentry.captureException(error);
      message.error(processResponseError(error));
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add Role"
      width={520}
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isCreatingUserAccess || isCreatingAssociation}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Spin spinning={isCreatingUserAccess || isCreatingAssociation}>
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            operator: String(operator?.id),
            start_date: dayjs(),
          }}
          onFinish={handleSubmit}
        >
          <Form.Item label="Mobile number">
            <div className="flex items-center gap-2">
              <Form.Item
                name="new_mobile_country_code"
                initialValue="91"
                style={{ marginBottom: 0 }}
              >
                <Select
                  className="w-28"
                  disabled={isUserLocked}
                  showSearch
                  optionFilterProp="label"
                  onChange={(code) => {
                    const mobileNumber =
                      form.getFieldValue("new_mobile_number");
                    setNewMobileCombined(`${code || ""}${mobileNumber || ""}`);
                  }}
                  options={countryCodes.map((c) => ({
                    value: c.phoneCode.replace(/\D/g, ""),
                    label: `+${c.phoneCode} ${c.country}`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="new_mobile_number"
                rules={[{ required: true, message: "Please enter mobile" }]}
                style={{ marginBottom: 0 }}
                className="flex-1"
                validateStatus={mobileError ? "error" : ""}
                help={mobileError}
              >
                <div className="flex items-center gap-2">
                  <AutoComplete
                    className="flex-1"
                    disabled={isUserLocked}
                    options={mobileOptions}
                    value={mobileValue}
                    open={isMobileValid && mobileOptions.length > 0}
                    onSearch={(val) => {
                      const digits = String(val).replace(/\D/g, "");
                      setMobileValue(digits);
                      const code = form.getFieldValue(
                        "new_mobile_country_code"
                      );
                      const combined = `${code || ""}${digits || ""}`;
                      setNewMobileCombined(combined);
                      const valid =
                        !!digits && isValidPhoneNumber(`+${combined}`);
                      setIsMobileValid(valid);
                      setMobileError(
                        valid || digits.length === 0
                          ? ""
                          : "Enter a valid number"
                      );
                      setMobileSearch(valid ? digits : "");
                    }}
                    onSelect={(val, option: unknown) => {
                      const opt = option as MobileOption;
                      const key = opt?.key as string | undefined;
                      const digits = String(val).replace(/\D/g, "");
                      form.setFieldsValue({ new_mobile_number: digits });
                      setMobileValue(digits);
                      const hasName =
                        !!form.getFieldValue("new_first_name") ||
                        !!form.getFieldValue("new_last_name") ||
                        !!form.getFieldValue("new_gender");
                      if (key?.startsWith("existing:")) {
                        const id = key.split(":")[1];
                        const user = profileMap[id];
                        setSelectedUser(user);
                        form.setFieldsValue({
                          new_first_name: user?.first_name,
                          new_last_name: user?.last_name,
                          new_gender: String(user?.gender ?? ""),
                          slack_id: user?.staff_slack_user_id,
                        });
                        setIsCreatingNewUser(false);
                        setIsUserLocked(true);
                      } else if (key?.startsWith("new:") || !hasName) {
                        setSelectedUser(null);
                        setIsCreatingNewUser(true);
                        setIsUserLocked(true);
                      }
                    }}
                    onChange={(val) => {
                      // Keep only digits in the form value
                      const digits = String(val).replace(/\D/g, "");
                      form.setFieldValue("new_mobile_number", digits);
                      setMobileValue(digits);
                      const code = form.getFieldValue(
                        "new_mobile_country_code"
                      );
                      const combined = `${code || ""}${digits || ""}`;
                      const valid =
                        !!digits && isValidPhoneNumber(`+${combined}`);
                      setIsMobileValid(valid);
                      setMobileError(
                        valid || digits.length === 0
                          ? ""
                          : "Enter a valid number"
                      );
                      setMobileSearch(valid ? digits : "");
                    }}
                  >
                    <Input placeholder="Enter mobile number" />
                  </AutoComplete>
                  {isUserLocked && (
                    <Button
                      onClick={() => {
                        setIsUserLocked(false);
                        setIsCreatingNewUser(false);
                        setSelectedUser(null);
                        setMobileSearch("");
                        form.setFieldsValue({
                          new_first_name: undefined,
                          new_last_name: undefined,
                          new_gender: undefined,
                          new_mobile_country_code: "91",
                          new_mobile_number: undefined,
                        });
                        setNewMobileCombined("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            name="new_first_name"
            label="First Name"
            rules={[
              {
                required: isCreatingNewUser,
                message: "Please enter first name",
              },
            ]}
          >
            <Input placeholder="Enter first name" disabled={!!selectedUser} />
          </Form.Item>

          <Form.Item
            name="new_last_name"
            label="Last Name"
            rules={[
              {
                required: isCreatingNewUser,
                message: "Please enter last name",
              },
            ]}
          >
            <Input placeholder="Enter last name" disabled={!!selectedUser} />
          </Form.Item>

          <Form.Item
            name="new_gender"
            label="Gender"
            rules={[
              {
                required: isCreatingNewUser,
                message: "Please select gender",
              },
            ]}
          >
            <Radio.Group
              className="w-full grid grid-cols-3 gap-2"
              disabled={!!selectedUser}
            >
              <Radio.Button value="0">Male</Radio.Button>
              <Radio.Button value="1">Female</Radio.Button>
              <Radio.Button value="2">Non-binary</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="slack_id" label="Slack Member ID">
            <Input placeholder="Enter Slack Member ID" />
          </Form.Item>

          <Form.Item name="operator" label="Operator">
            <Select
              disabled
              options={[
                {
                  value: String(operator?.id),
                  label: operator?.name,
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="access_group"
            label="Access Group"
            rules={[
              { required: true, message: "Please select an access group" },
            ]}
          >
            <Select
              placeholder="Select access group"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="start_date"
            label="Start Date"
            tooltip="Starting date of the person's access"
            rules={[{ required: true, message: "Please select a start date" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date (optional)"
            tooltip="Ending date of the person's access. Post this, the access will be removed."
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default RoleAddSidebar;
