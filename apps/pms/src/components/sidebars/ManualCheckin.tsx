/* eslint-disable @next/next/no-img-element */
import {
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  InboxOutlined,
  LoadingOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import * as Sentry from "@sentry/nextjs";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { MobileInput } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { useFormData, useResponseFlash } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidEmail, isValidString } from "@zo/utils/string";
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Radio,
  Select,
  Space,
  Upload,
} from "antd";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAssociation } from "../../hooks";
import { getAssetUrlByType } from "../../utils";
const { Dragger } = Upload;

interface ManualCheckinSidebarProps {
  isOpen: boolean;
  refetchBooking: () => void;
  onClose: () => void;
  booking: GeneralObject;
  checkin?: GeneralObject;
}

const ManualCheckinSidebar: React.FC<ManualCheckinSidebarProps> = ({
  isOpen,
  onClose,
  refetchBooking,
  checkin,
  booking,
}) => {
  const [mobile, setMobile] = useState<string>("");
  const [mobileInputKey, setMobileInputKey] = useState<number>(0);
  const [selectedGuestMobile, setSelectedGuestMobile] = useState<string>("");
  const shouldPrefillGuestRef = useRef<boolean>(false);
  const autoFetchOnSelectRef = useRef<boolean>(false);
  const {
    handleChange: handlePersonalChange,
    formData: personalFormData,
    setFormData: setPersonalFormData,
  } = useFormData({});
  const {
    handleChange: handleIdChange,
    formData: idFormData,
    setFormData: setIdFormData,
  } = useFormData({});

  const [error, setError] = useResponseFlash();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [documentType, setDocumentType] = useState<string>("");

  const { selectedOperator } = useAssociation();

  const documentTypeOptions = useMemo(
    () =>
      selectedOperator?.kyc_documents?.map((doc: GeneralObject) => ({
        label: doc.name,
        value: doc.id,
      })),
    [selectedOperator]
  );

  const guestMobileOptions = useMemo(() => {
    if (!booking?.guests || booking.guests.length === 0) return [];

    const uniqueMobiles = new Map<string, GeneralObject>();

    booking.guests.forEach((guest: GeneralObject) => {
      if (guest.mobile && !uniqueMobiles.has(guest.mobile)) {
        uniqueMobiles.set(guest.mobile, guest);
      }
    });

    return Array.from(uniqueMobiles.entries()).map(([mobile, guest]) => {
      // Remove all non-digit characters first
      let formattedMobile = mobile.replace(/[^\d]/g, "");

      if (formattedMobile.length === 10) {
        formattedMobile = "91" + formattedMobile;
      } else if (formattedMobile.length >= 12) {
        const last10Digits = formattedMobile.slice(-10);
        formattedMobile = "91" + last10Digits;
      }

      let displayMobile = `+${formattedMobile}`;

      try {
        if (isValidPhoneNumber(`+${formattedMobile}`)) {
          const parsed = parsePhoneNumber(`+${formattedMobile}`);
          displayMobile = parsed.formatInternational();
        }
      } catch (error) {
        // Silently fall back to displayMobile format
        // parsePhoneNumber() can throw for invalid/malformed numbers
        console.warn(`Failed to parse guest phone: ${formattedMobile}`, error);
      }

      return {
        label: `${guest.first_name || ""} ${
          guest.last_name || ""
        } - ${displayMobile}`.trim(),
        value: formattedMobile,
        guestData: guest,
      };
    });
  }, [booking]);

  const phoneContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: userProfile,
    refetch,
    remove,
  } = useQueryApi<GeneralObject>(
    "ADMIN_PM_GUEST_PROFILE",
    {
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      select: (data) => data.data.profile,
    },
    `${mobile}/`
  );

  const { data: profileResults, isLoading: isLoadingProfileResults } =
    useQueryApi<GeneralObject>(
      "ADMIN_PROFILE_SEARCH",
      {
        enabled: isValidPhoneNumber(`+${mobile}`),
        select: (data) => data.data?.profiles?.[0],
      },
      "",
      isValidPhoneNumber(`+${mobile}`)
        ? `q=${parsePhoneNumber(`+${mobile}`).nationalNumber}`
        : ""
    );

  const { data: countryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "PROFILE_LOCATIONS_COUNTRY",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((country: GeneralObject) => ({
          label: country.name,
          value: country.id,
        })),
    },
    "",
    "limit=300"
  );

  const { mutateAsync: uploadID } = useMutationApi("ADMIN_PROFILE");
  const { mutateAsync: updateProfile } = useMutationApi(
    "ADMIN_PROFILE",
    {},
    "",
    "PUT"
  );
  const { mutateAsync: createCheckin } = useMutationApi("ADMIN_PM_CHECKIN");
  const { mutateAsync: updateCheckin } = useMutationApi(
    "ADMIN_PM_CHECKIN",
    {},
    "",
    "PUT"
  );

  const [documentNumber, setDocumentNumber] = useState<string>("");

  const assignUser = () => {
    if (selectedGuestMobile && !profileResults) {
      shouldPrefillGuestRef.current = true;
    }
    autoFetchOnSelectRef.current = false;
    refetch();
  };

  const removeUser = () => {
    remove();
    setMobile("");
    setSelectedGuestMobile("");
    shouldPrefillGuestRef.current = false;
    setLoading(false);
    setDocumentNumber("");
    setDocumentType("");
    setFormErrors({});
    setPersonalFormData({
      first_name: "",
      last_name: "",
      email: "",
      gender: undefined,
      address: "",
      country_citizen: null,
      coming_from: "",
      next_destination: "",
    });
    setIdFormData({
      116: null,
      117: null,
    });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!isValidObject(userProfile)) {
      errors.mobile = "Please enter a valid mobile number";
      return errors;
    }

    const requiredFields = {
      first_name: "First Name",
      last_name: "Last Name",
      email: "Email",
      gender: "Gender",
      address: "Address",
      country_citizen: "Home Country",
      coming_from: "Coming From",
      next_destination: "Going to",
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!personalFormData[field]) {
        errors[field] = `${label} is required`;
      }
    });

    if (!idFormData["116"]) {
      errors.front_id = "Front ID is required";
    }

    if (!idFormData["117"]) {
      errors.back_id = "Back ID is required";
    }

    // Email validation
    if (personalFormData.email && !isValidEmail(personalFormData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!documentNumber) {
      errors.document_number = "Document Number is required";
    }

    if (!documentType) {
      errors.document_type = "Document Type is required";
    }

    setFormErrors(errors);
    return errors;
  };

  const addUserToCheckin = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      const userData: GeneralObject = {
        ...personalFormData,
        gender: Number(personalFormData.gender),
      };
      const checkinData = {
        coming_from: personalFormData.coming_from,
        next_destination: personalFormData.next_destination,
        booking_code: booking.code,
        operator: booking.operator.code,
        arrival_on: booking.start_date,
        departure_on: booking.end_date,
        user: userProfile?.code,
      };
      delete userData.coming_from;
      delete userData.next_destination;

      if (
        Object.values(userData).some(
          (value) => !(isValidString(value) || !isNaN(value))
        ) ||
        Object.values(checkinData).some(
          (value) => !(isValidString(value) || !isNaN(value))
        )
      ) {
        setError("Please complete the personal info");
        setLoading(false);
        return;
      }
      if (!(idFormData["116"] && idFormData["117"])) {
        setError("Please upload Documents");
        setLoading(false);
        return;
      } else {
        if (idFormData["116"] && idFormData["117"]) {
          if (typeof idFormData["116"] !== "string") {
            const idFront = new FormData();
            idFront.append("file", idFormData["116"]);
            if (documentNumber) {
              idFront.append("identifier", documentNumber);
              idFront.append("document_type", documentType);
            }
            const response = await uploadID({
              data: idFront,
              route: `${userProfile?.code}/assets/116/upload/`,
            });

            // Get existing documents from localStorage
            const existingDocs = JSON.parse(
              localStorage.getItem("documents") || "[]"
            );

            const newDocument = {
              documents: {
                ...response.data,
              },
              booking_code: booking.code,
              profile_code: userProfile?.code,
              full_name: `${userProfile?.first_name} ${
                userProfile?.last_name || ""
              }`.trim(),
              identifier: documentNumber || response.data.identifier,
              document_type: documentType,
            };

            // Check if document for this profile already exists
            const docIndex = existingDocs.findIndex(
              (doc: GeneralObject) => doc.profile_code === userProfile?.code
            );

            if (docIndex !== -1) {
              existingDocs[docIndex] = newDocument;
            } else {
              existingDocs.push(newDocument);
            }

            // Save to localStorage and dispatch update event
            localStorage.setItem("documents", JSON.stringify(existingDocs));
            window.dispatchEvent(
              new CustomEvent("documentsUpdated", {
                detail: existingDocs,
              })
            );
          }

          if (typeof idFormData["117"] !== "string") {
            const idBack = new FormData();
            idBack.append("file", idFormData["117"]);
            if (documentNumber) {
              idBack.append("identifier", documentNumber);
              idBack.append("document_type", documentType);
            }
            await uploadID({
              data: idBack,
              route: `${userProfile?.code}/assets/117/upload/`,
            });
          }
        }
      }

      await updateProfile({
        data: userData,
        route: `${userProfile?.id}/`,
      });

      if (!isValidObject(checkin)) {
        await createCheckin({
          data: checkinData,
        });
      } else {
        const _checkinData = {
          coming_from: checkinData.coming_from,
          next_destination: checkinData.next_destination,
        };
        await updateCheckin({
          data: _checkinData,
          route: `${checkin?.id}/`,
        });
      }

      setLoading(false);
      refetchBooking();
      removeUser();
      setFormErrors({});
      onClose();
    } catch (error) {
      Sentry.captureException(error);
      message.error(processResponseError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMobileInputKey((prev) => prev + 1);
      phoneContainerRef.current?.querySelector("input")?.focus();
    } else {
      removeUser();
      setFormErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isValidObject(userProfile)) {
      const guestOption = selectedGuestMobile
        ? guestMobileOptions.find(
            (option) => option.value === selectedGuestMobile
          )
        : null;

      let _personalData: GeneralObject = {};

      const isEmptyProfile =
        (!userProfile?.first_name || userProfile?.first_name === "") &&
        (!userProfile?.last_name || userProfile?.last_name === "");

      const shouldUseGuestData =
        (shouldPrefillGuestRef.current || isEmptyProfile) &&
        guestOption?.guestData &&
        selectedGuestMobile;

      if (shouldUseGuestData) {
        const guest = guestOption.guestData;

        let genderValue = undefined;
        if (guest.gender !== undefined && guest.gender !== null) {
          const genderStr = String(guest.gender).toLowerCase();
          if (genderStr === "m" || genderStr === "0") genderValue = "0";
          else if (genderStr === "f" || genderStr === "1") genderValue = "1";
          else if (genderStr === "o" || genderStr === "2") genderValue = "2";
        }

        _personalData = {
          first_name: guest.first_name || "",
          last_name: guest.last_name || "",
          email: guest.email || "",
          gender: genderValue,
          address: guest.address || "",
          country_citizen: userProfile?.country_citizen || null,
        };

        shouldPrefillGuestRef.current = false;
      } else {
        _personalData = {
          first_name: userProfile?.first_name || "",
          last_name: userProfile?.last_name || "",
          email: userProfile?.email || "",
          gender:
            userProfile?.gender !== undefined
              ? String(userProfile?.gender)
              : undefined,
          address: userProfile?.address || "",
          country_citizen: userProfile?.country_citizen || null,
        };
      }

      const checkinData = isValidObject(checkin)
        ? {
            coming_from: checkin?.coming_from,
            next_destination: checkin?.next_destination,
          }
        : {};
      setPersonalFormData({
        ..._personalData,
        ...checkinData,
      });
      setIdFormData({
        116: getAssetUrlByType(userProfile?.assets || [], 116),
        117: getAssetUrlByType(userProfile?.assets || [], 117),
      });

      const _documentType = userProfile?.assets?.find(
        (asset: GeneralObject) => asset.type === 116
      )?.document_type;
      if (_documentType) {
        setDocumentType(_documentType?.id);
      }

      // Set document number if available in assets
      const frontAsset = userProfile?.assets?.find(
        (asset: GeneralObject) => asset.type === 116
      );
      if (frontAsset?.identifier) {
        setDocumentNumber(frontAsset.identifier);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userProfile,
    selectedGuestMobile,
    guestMobileOptions,
  ]);

  useEffect(() => {
    if (isValidObject(checkin)) {
      setMobile(checkin?.profile.mobile);
      setTimeout(() => {
        refetch();
      }, 200);
    }
  }, [checkin, refetch]);

  useEffect(() => {
    if (!autoFetchOnSelectRef.current) return;
    if (isLoadingProfileResults) return;
    assignUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileResults, isLoadingProfileResults]);

  return (
    <Drawer
      title="Add Check-in to the booking"
      onClose={onClose}
      placement="right"
      open={isOpen}
      size="large"
      footer={
        <Space className="w-full justify-end">
          {isValidString(error) && (
            <Alert type="error" message={error} showIcon className="flex-1" />
          )}
          {isValidObject(userProfile) ? (
            <Button
              type="primary"
              size="large"
              loading={isLoading}
              disabled={isLoading}
              onClick={addUserToCheckin}
              icon={isLoading ? <LoadingOutlined /> : <CheckCircleOutlined />}
              className="min-w-[200px]"
            >
              Add to check-in
            </Button>
          ) : (
            <Button
              type="default"
              size="large"
              disabled
              icon={<PhoneOutlined />}
              className="min-w-[200px]"
            >
              Enter Mobile Number to proceed
            </Button>
          )}
        </Space>
      }
    >
      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-1">
          <p className="flex items-center gap-3  text-base font-semibold text-zui-silver uppercase">
            <UserOutlined />
            Personal Info
          </p>

          <Form layout="vertical" className="w-full mt-6">
            {guestMobileOptions.length > 0 && !isValidObject(userProfile) && (
              <Form.Item label="Select from Booking Guests" className="mb-4">
                <Select
                  placeholder="Select a guest mobile number"
                  value={selectedGuestMobile || undefined}
                  onChange={(value) => {
                    setSelectedGuestMobile(value);
                    setMobile(value);
                    autoFetchOnSelectRef.current = true;
                  }}
                  options={guestMobileOptions}
                  allowClear
                  onClear={() => {
                    setSelectedGuestMobile("");
                    setMobile("");
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="bg-zui-lighter border-zui-silver"
                />
              </Form.Item>
            )}

            <div className="relative" ref={phoneContainerRef}>
              <MobileInput
                key={mobileInputKey}
                setter={(value: string) => {
                  setMobile(value);
                  if (value !== selectedGuestMobile) {
                    setSelectedGuestMobile("");
                  }
                }}
                value={mobile}
                disabled={isValidObject(userProfile)}
                className="bg-zui-lighter mb-10"
              />
              {formErrors.mobile && (
                <div className="text-zui-red text-sm mt-1 flex items-center gap-1">
                  <ExclamationCircleOutlined />
                  {formErrors.mobile}
                </div>
              )}
              {!isValidObject(userProfile) ? (
                isValidPhoneNumber(`+${mobile}`) ? (
                  !isLoadingProfileResults ? (
                    profileResults ? (
                      <Button
                        type="text"
                        className="absolute bg-zui-light border border-zui-white w-full text-left p-4 top-[58px] z-10 left-0 right-0"
                        onClick={assignUser}
                        icon={<UserOutlined />}
                      >
                        {profileResults.first_name}{" "}
                        {profileResults.last_name || ""}
                      </Button>
                    ) : (
                      <Button
                        type="text"
                        onClick={assignUser}
                        className="absolute bg-zui-light border border-zui-white w-full text-left p-4 top-[58px] z-10 left-0 right-0 text-zui-neon"
                        icon={<PlusOutlined />}
                      >
                        Create new user
                      </Button>
                    )
                  ) : null
                ) : null
              ) : (
                !isValidObject(checkin) && (
                  <Button
                    type="text"
                    className="absolute z-10 right-4 top-4"
                    onClick={removeUser}
                    icon={<CloseOutlined />}
                  />
                )
              )}
            </div>
            <div
              className={
                isValidObject(userProfile) ? "opacity-100" : "opacity-20"
              }
            >
              <Form.Item
                label="First Name"
                required
                validateStatus={formErrors.first_name ? "error" : ""}
                help={formErrors.first_name}
              >
                <Input
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.first_name}
                  onChange={(e) => {
                    handlePersonalChange("first_name", "text", e.target.value);
                    setFormErrors((prev) => ({ ...prev, first_name: "" }));
                  }}
                  placeholder="Enter first name"
                  className="border-zui-silver"
                />
              </Form.Item>

              <Form.Item
                label="Last Name"
                required
                validateStatus={formErrors.last_name ? "error" : ""}
                help={formErrors.last_name}
              >
                <Input
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.last_name}
                  onChange={(e) => {
                    handlePersonalChange("last_name", "text", e.target.value);
                    setFormErrors((prev) => ({ ...prev, last_name: "" }));
                  }}
                  placeholder="Enter last name"
                  className=" border-zui-silver"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                required
                validateStatus={formErrors.email ? "error" : ""}
                help={formErrors.email}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-500" />}
                  type="email"
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.email}
                  onChange={(e) => {
                    handlePersonalChange("email", "email", e.target.value);
                    setFormErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="Enter email address"
                  className=" border-zui-silver "
                />
              </Form.Item>

              <Form.Item
                label="Gender"
                required
                validateStatus={formErrors.gender ? "error" : ""}
                help={formErrors.gender}
              >
                <Radio.Group
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.gender}
                  onChange={(e) => {
                    handlePersonalChange("gender", "radio", e.target.value);
                    setFormErrors((prev) => ({ ...prev, gender: "" }));
                  }}
                  className="w-full grid grid-cols-2 gap-2"
                >
                  <Radio.Button
                    value="0"
                    className="text-center flex items-center justify-center  border-zui-silver hover:border-zui-neon"
                  >
                    Male
                  </Radio.Button>
                  <Radio.Button
                    value="1"
                    className="text-center flex items-center justify-center  border-zui-silver hover:border-zui-neon"
                  >
                    Female
                  </Radio.Button>
                  <Radio.Button
                    value="2"
                    className="text-center flex items-center justify-center  border-zui-silver hover:border-zui-neon"
                  >
                    Non-binary
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Address"
                required
                validateStatus={formErrors.address ? "error" : ""}
                help={formErrors.address}
              >
                <Input.TextArea
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.address}
                  onChange={(e) => {
                    handlePersonalChange("address", "textarea", e.target.value);
                    setFormErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="Enter full address"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  className=" border-zui-silver"
                />
              </Form.Item>

              <Form.Item
                label="Home Country"
                required
                validateStatus={formErrors.country_citizen ? "error" : ""}
                help={formErrors.country_citizen}
                className="custom-form-item"
              >
                <Select
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.country_citizen}
                  onChange={(value) => {
                    handlePersonalChange("country_citizen", "select", value);
                    setFormErrors((prev) => ({ ...prev, country_citizen: "" }));
                  }}
                  options={countryOptions}
                  placeholder="Select home country"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="bg-zui-lighter border-zui-silver"
                />
              </Form.Item>
            </div>
          </Form>
        </div>

        <div className="w-px bg-zui-silver" />

        <div className="flex-1">
          <div className="mb-10">
            <p className="flex items-center gap-3  text-base font-semibold text-zui-silver uppercase">
              <GlobalOutlined />
              Travel Info
            </p>
            <Form
              layout="vertical"
              className={cn(
                "space-y-4 w-full mt-6",
                isValidObject(userProfile) ? "opacity-100" : "opacity-20"
              )}
            >
              <Form.Item
                label="Coming From"
                required
                validateStatus={formErrors.coming_from ? "error" : ""}
                help={formErrors.coming_from}
              >
                <Input
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.coming_from}
                  onChange={(e) => {
                    handlePersonalChange("coming_from", "text", e.target.value);
                    setFormErrors((prev) => ({ ...prev, coming_from: "" }));
                  }}
                  placeholder="Enter departure location"
                  className=" border-zui-silver"
                />
              </Form.Item>

              <Form.Item
                label="Going to"
                required
                validateStatus={formErrors.next_destination ? "error" : ""}
                help={formErrors.next_destination}
              >
                <Input
                  disabled={!isValidObject(userProfile)}
                  value={personalFormData.next_destination}
                  onChange={(e) => {
                    handlePersonalChange(
                      "next_destination",
                      "text",
                      e.target.value
                    );
                    setFormErrors((prev) => ({
                      ...prev,
                      next_destination: "",
                    }));
                  }}
                  placeholder="Enter destination"
                  className=" border-zui-silver"
                />
              </Form.Item>
            </Form>
          </div>
          <div className="flex flex-col w-[316px]">
            <div className="flex flex-col">
              <p className="text-base font-semibold text-zui-silver uppercase">
                Government ID
              </p>
              <div
                className={cn(
                  "flex flex-col",
                  isValidObject(userProfile) ? "opacity-100" : "opacity-20"
                )}
              >
                <div className="flex flex-col gap-4">
                  <Form.Item
                    required
                    validateStatus={formErrors.document_number ? "error" : ""}
                    label="Document Number"
                  >
                    <Input
                      value={documentNumber}
                      onChange={(e) => {
                        setDocumentNumber(e.target.value);
                      }}
                      placeholder="Enter document number"
                      className="border-zui-silver"
                    />
                  </Form.Item>
                  <Form.Item
                    required
                    validateStatus={formErrors.document_type ? "error" : ""}
                    className="-mt-4"
                    label="Document Type"
                  >
                    <Select
                      value={documentType}
                      onChange={setDocumentType}
                      options={documentTypeOptions}
                      placeholder="Select document type"
                      className="bg-zui-lighter border-zui-silver"
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  required
                  validateStatus={formErrors.front_id ? "error" : ""}
                  help={formErrors.front_id}
                >
                  {!idFormData["116"] ? (
                    <Dragger
                      name="front_id"
                      accept="image/*"
                      multiple={false}
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleIdChange("116", "file", file);
                        return false;
                      }}
                      className="bg-zui-lighter"
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Click or drag front ID image
                      </p>
                      <p className="ant-upload-hint">
                        Support for single image upload
                      </p>
                    </Dragger>
                  ) : (
                    <div className="relative">
                      <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={
                            idFormData["116"] instanceof File
                              ? URL.createObjectURL(idFormData["116"])
                              : idFormData["116"]
                          }
                          alt="Preview with watermark"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Popconfirm
                        title="Remove Front Id"
                        description="Are you sure you want to remove this image?"
                        onConfirm={() => handleIdChange("116", "file", null)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          className="absolute top-2 right-2"
                          icon={<CloseOutlined />}
                        />
                      </Popconfirm>
                    </div>
                  )}
                </Form.Item>
                <Form.Item
                  required
                  validateStatus={formErrors.back_id ? "error" : ""}
                  help={formErrors.back_id}
                >
                  {!idFormData["117"] ? (
                    <Dragger
                      name="back_id"
                      accept="image/*"
                      multiple={false}
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleIdChange("117", "file", file);
                        return false;
                      }}
                      className="bg-zui-lighter"
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        Click or drag back ID image
                      </p>
                      <p className="ant-upload-hint">
                        Support for single image upload
                      </p>
                    </Dragger>
                  ) : (
                    <div className="relative">
                      <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={
                            idFormData["117"] instanceof File
                              ? URL.createObjectURL(idFormData["117"])
                              : idFormData["117"]
                          }
                          alt="Preview with watermark"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Popconfirm
                        title="Remove Back ID"
                        description="Are you sure you want to remove this image?"
                        onConfirm={() => handleIdChange("117", "file", null)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          className="absolute top-2 right-2"
                          icon={<CloseOutlined />}
                        />
                      </Popconfirm>
                    </div>
                  )}
                </Form.Item>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default ManualCheckinSidebar;
