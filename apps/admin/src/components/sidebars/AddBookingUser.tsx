import {
  Button,
  Drawer,
  message,
  Space,
  Typography,
  Upload,
  UploadFile,
} from "antd";

import PersonAddIcon from "@mui/icons-material/PersonAdd";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";

import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import {
  formatCapitalize,
  isValidEmail,
  isValidString,
} from "@zo/utils/string";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Profile } from "../../config";
import { Form, FormElement } from "../Form";

interface AddBookingUserProps {
  isOpen: boolean;
  onClose: () => void;
  booking: GeneralObject;
  refetchBooking: () => void;
}

const { Title, Text } = Typography;

const AddBookingUserSidebar: React.FC<AddBookingUserProps> = ({
  isOpen,
  onClose,
  booking,
  refetchBooking,
}) => {
  const [form] = useForm();

  const userPid = useWatch("booking", form);

  const queryClient = useQueryClient();
  const [showUnverifiedUserField, setShowUnverifiedUserField] =
    useState<boolean>(false);
  const [selectedGuest, setSelectedGuest] = useState<GeneralObject>({});
  const [fileList, setFileList] = useState<{
    aadharFront: UploadFile<any>[];
    aadharBack: UploadFile<any>[];
    passportFront: UploadFile<any>[];
    passportBack: UploadFile<any>[];
  }>({
    aadharFront: [],
    aadharBack: [],
    passportFront: [],
    passportBack: [],
  });

  const formattedData = useMemo(() => {
    if (selectedGuest) {
      return {
        first_name: selectedGuest.first_name,
        last_name: selectedGuest.last_name,
        email: selectedGuest?.user?.email_address,
        gender: selectedGuest?.gender,
      };
    }
    return {};
  }, [selectedGuest]);

  const { mutate: addGuestDetails } = useMutationApi(
    "CAS_CUSTOMERS",
    {},
    "",
    "POST"
  );

  const { data: userData } = useQueryApi<Profile>(
    "CAS_PROFILES",
    {
      enabled: isValidString(userPid),
      select: (data: GeneralObject) => data.data,
      refetchOnWindowFocus: false,
    },
    `${userPid}/`
  );

  const { mutate: uploadMedia } = useMutationApi("CAS_CUSTOMERS_KYC");

  const handleGuestDocuments = (id: string) => {
    const uploadDoc = (type: string, front: any, back: any) => {
      const formData = new FormData();
      if (front?.[0]?.originFileObj)
        formData.append("document_front", front[0].originFileObj);
      if (back?.[0]?.originFileObj)
        formData.append("document_back", back[0].originFileObj);
      formData.append("document_type", type);

      uploadMedia(
        {
          data: formData,
          route: id,
        },
        {
          onSuccess() {
            message.success(`${type} Documents Uploaded Successfully`);
            queryClient.invalidateQueries(["cas", "media"]);
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    };

    if (fileList.aadharFront.length || fileList.aadharBack.length) {
      uploadDoc("aadhar", fileList.aadharFront, fileList.aadharBack);
    }

    if (fileList.passportFront.length || fileList.passportBack.length) {
      uploadDoc("passport", fileList.passportFront, fileList.passportBack);
    }
  };

  const formFields: FormElement[] = useMemo(() => {
    return [
      {
        name: "booking",
        label: "User",
        type: "searchselect",
        searchQueryApi: "CAS_PROFILES",
        submitKeySelector: (data) => data.user.id,
        notFoundContent: (
          <CreateUserButton
            onClickHandler={setShowUnverifiedUserField.bind(this, true)}
          />
        ),
        isHidden: showUnverifiedUserField,
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
          value: data.id,
          label: data.nickname || data.first_name,
        }),
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
      },
      {
        name: "first_name",
        label: "First Name",
        type: "text",
      },
      {
        name: "last_name",
        label: "Last Name",
        type: "text",
      },
      {
        name: "gender",
        label: "Gender",
        type: "radio",
        options: [
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ],
      },
    ];
  }, [showUnverifiedUserField]);

  const handleSubmit = () => {
    const values = form.getFieldsValue();

    if (!isValidEmail(values.email)) {
      message.error("Valid Email is Required");
      return;
    }

    const guestData = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      booking: booking?.id,
      gender: values.gender,
    };

    addGuestDetails(
      {
        data: guestData,
      },
      {
        onSuccess(data) {
          queryClient.invalidateQueries(["cas", "customers"]);
          queryClient.invalidateQueries(["cas", "stay", "bookings"]);
          handleGuestDocuments(data?.data?.id);
          refetchBooking();
          handleClose();
          message.success("Guest added successfully");
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedGuest({});
    setFileList({
      aadharFront: [],
      aadharBack: [],
      passportFront: [],
      passportBack: [],
    });
    onClose();
    refetchBooking();
  };

  useEffect(() => {
    if (userData) {
      form.setFieldsValue({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.user.email_address,
        gender: userData.gender ? formatCapitalize(userData.gender) : "",
      });
    }
  }, [userData]);

  const uploadButton = (label: string) => (
    <div>
      <CloudOutlinedIcon />
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  );

  return (
    <Drawer
      title="Add Guest"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button type="primary" onClick={handleSubmit}>
          Save
        </Button>
      }
    >
      <div className="flex justify-end">
        <Button
          type="link"
          onClick={setShowUnverifiedUserField.bind(
            this,
            !showUnverifiedUserField
          )}
        >
          {showUnverifiedUserField ? "Registered User?" : "Unregistered User?"}
        </Button>
      </div>
      <Form formData={form} formFields={formFields} />

      <Title level={5} style={{ marginTop: 24 }}>
        Government ID
      </Title>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {booking?.kyc_documents?.map((doc: GeneralObject) => {
          if (doc.slug === "aadhar") {
            return (
              <Space
                key={doc.id}
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space>
                  <BadgeOutlinedIcon />
                  <Text>{doc.name}</Text>
                </Space>

                <Upload
                  maxCount={1}
                  listType="picture-card"
                  fileList={fileList.aadharFront}
                  onChange={({ fileList }) =>
                    setFileList((prev) => ({
                      ...prev,
                      aadharFront: fileList,
                    }))
                  }
                >
                  {fileList.aadharFront.length < 1 &&
                    uploadButton("Aadhar Front")}
                </Upload>

                <Upload
                  maxCount={1}
                  listType="picture-card"
                  fileList={fileList.aadharBack}
                  onChange={({ fileList }) =>
                    setFileList((prev) => ({ ...prev, aadharBack: fileList }))
                  }
                >
                  {fileList.aadharBack.length < 1 &&
                    uploadButton("Aadhar Back")}
                </Upload>
              </Space>
            );
          }

          if (doc.slug === "passport") {
            return (
              <Space
                key={doc.id}
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space>
                  <BadgeOutlinedIcon />
                  <Text>{doc.name}</Text>
                </Space>

                <Upload
                  maxCount={1}
                  listType="picture-card"
                  fileList={fileList.passportFront}
                  onChange={({ fileList }) =>
                    setFileList((prev) => ({
                      ...prev,
                      passportFront: fileList,
                    }))
                  }
                >
                  {fileList.passportFront.length < 1 &&
                    uploadButton("Passport Front")}
                </Upload>

                <Upload
                  maxCount={1}
                  listType="picture-card"
                  fileList={fileList.passportBack}
                  onChange={({ fileList }) =>
                    setFileList((prev) => ({
                      ...prev,
                      passportBack: fileList,
                    }))
                  }
                >
                  {fileList.passportBack.length < 1 &&
                    uploadButton("Passport Back")}
                </Upload>
              </Space>
            );
          }
          return null;
        })}
      </Space>
    </Drawer>
  );
};

export default AddBookingUserSidebar;

const CreateUserButton: React.FC<{
  onClickHandler: (value: boolean) => void;
}> = ({ onClickHandler }) => {
  return (
    <Button
      type="text"
      block
      icon={<PersonAddIcon />}
      onClick={() => onClickHandler(true)}
    >
      Create a New User
    </Button>
  );
};
