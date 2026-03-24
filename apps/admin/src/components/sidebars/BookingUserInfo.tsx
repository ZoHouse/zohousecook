import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import {
  Button,
  Divider,
  Drawer,
  Flex,
  Form,
  Image,
  Input,
  message,
  Radio,
  Tabs,
  Typography,
  Upload,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
const { Title, Text } = Typography;

interface AddBookingUserProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GeneralObject | null;
  refetchBooking: () => void;
  documents: GeneralObject | null;
}

const BookingUserInfoSidebar: React.FC<AddBookingUserProps> = ({
  isOpen,
  onClose,
  guest,
  refetchBooking,
  documents,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [selectedDocType, setSelectedDocType] = useState(
    guest?.kyc?.document_type || "passport"
  );

  const {
    getFormValue: getDocumentFormValue,
    handleChange: handleDocumentChange,
    formData: documentFormData,
    setFormData: setDocumentFormData,
    resetFormData: resetDocumentFormData,
  } = useFormData({});

  const formattedData = useMemo(() => {
    if (guest) {
      return {
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        gender: guest.gender,
      };
    }
    return {};
  }, [guest]);

  const { mutate: updateGuestDetails } = useMutationApi(
    "CAS_CUSTOMERS",
    {},
    "",
    "PUT"
  );

  const { mutate: uploadMedia } = useMutationApi(
    "CAS_CUSTOMERS_KYC",
    {},
    "",
    "POST"
  );

  const handleGuestDocuments = (id: any) => {
    const mediaData: any = new FormData();
    mediaData.append("document_front", documentFormData["document_front"]);
    mediaData.append("document_back", documentFormData["document_back"]);
    mediaData.append("document_type", selectedDocType);

    uploadMedia(
      {
        data: mediaData,
        route: id,
      },
      {
        onSuccess() {
          message.success("Documents Uploaded Successfully.");
          queryClient.invalidateQueries(["cas", "media"]);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  useEffect(() => {
    if (isValidObject(guest)) {
      setDocumentFormData({
        document_front: guest?.kyc?.document_front?.url || "",
        document_back: guest?.kyc?.document_back?.url || "",
      });
      form.setFieldsValue(formattedData);
    }
  }, [guest, form, formattedData]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      const existingDocumentFront = guest?.kyc?.document_front?.url;
      const existingDocumentBack = guest?.kyc?.document_back?.url;

      const newDocumentFront = getDocumentFormValue(
        documentFormData,
        "document_front"
      );
      const newDocumentBack = getDocumentFormValue(
        documentFormData,
        "document_back"
      );

      const isValidFile = (file: File) =>
        file instanceof File && file.type.startsWith("image/");

      const isNewDocumentFront =
        isValidFile(newDocumentFront) &&
        newDocumentFront !== existingDocumentFront;

      const isNewDocumentBack =
        isValidFile(newDocumentBack) &&
        newDocumentBack !== existingDocumentBack;

      let updatedFormData = { ...values };

      if (updatedFormData.gender === null) {
        delete updatedFormData.gender;
      }

      if (
        (isNewDocumentFront && !isNewDocumentBack) ||
        (!isNewDocumentFront && isNewDocumentBack)
      ) {
        message.error("Please select both front and back images.");
        return;
      }

      updateGuestDetails(
        {
          data: updatedFormData,
          route: `${guest?.id}/`,
        },
        {
          onSuccess(data) {
            message.success("Guest updated successfully");
            refetchBooking();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );

      if (isNewDocumentFront && isNewDocumentBack) {
        handleGuestDocuments(guest?.id);
      }

      onClose();
    });
  };

  const handleClose = () => {
    refetchBooking();
    onClose();
    resetDocumentFormData();
    form.resetFields();
  };

  const uploadButton = (label: string) => (
    <div className="flex-1 aspect-square flex items-center justify-center flex-col">
      <CloudOutlinedIcon />
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  );

  const renderDocumentUpload = (docType?: string) =>
    isValidObject(guest?.kyc) && guest?.kyc?.document_type === docType ? (
      <Flex align="start" gap="16px">
        {guest?.kyc?.document_front?.url && (
          <div className="flex-1">
            <Typography.Text>
              {guest?.kyc?.document_type === "passport" ? "Passport" : "Aadhar"}{" "}
              Front
            </Typography.Text>
            <Image className="mt-4" src={guest?.kyc?.document_front?.url} />
          </div>
        )}
        {guest?.kyc?.document_back?.url && (
          <div className="flex-1">
            <Typography.Text>
              {guest?.kyc?.document_type === "passport" ? "Passport" : "Aadhar"}{" "}
              Back
            </Typography.Text>{" "}
            <Image className="mt-4" src={guest?.kyc?.document_back?.url} />
          </div>
        )}
      </Flex>
    ) : (
      <div>
        <Flex gap="16px" className="w-full">
          <Form.Item
            className="w-1/2"
            label={`${docType === "passport" ? "Passport" : "Aadhar"} Front`}
            required
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              listType="picture-card"
              className="aspect-square w-full"
              fileList={[]}
              onChange={({ fileList }) => {
                if (fileList.length > 0) {
                  handleDocumentChange(
                    "document_front",
                    "file",
                    fileList[0].originFileObj
                  );
                }
              }}
            >
              {uploadButton("Upload Front")}
            </Upload>
          </Form.Item>

          <Form.Item
            className="w-1/2"
            label={`${
              selectedDocType === "passport" ? "Passport" : "Aadhar"
            } Back`}
            required
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              listType="picture-card"
              className="aspect-square w-full"
              fileList={[]}
              onChange={({ fileList }) => {
                if (fileList.length > 0) {
                  handleDocumentChange(
                    "document_back",
                    "file",
                    fileList[0].originFileObj
                  );
                }
              }}
            >
              {uploadButton("Upload Back")}
            </Upload>
          </Form.Item>
        </Flex>
      </div>
    );

  return (
    <Drawer
      title="Guest Information"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Form form={form} layout="vertical" initialValues={formattedData}>
        <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="first_name"
          label="First Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="last_name"
          label="Last Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="gender" label="Gender">
          <Radio.Group>
            <Radio value="Male">Male</Radio>
            <Radio value="Female">Female</Radio>
          </Radio.Group>
        </Form.Item>

        <Divider orientation="left">
          <Text strong>Government ID</Text>
        </Divider>

        <Tabs
          activeKey={selectedDocType}
          onChange={setSelectedDocType}
          items={[
            {
              key: "passport",
              label: "Passport",
              children: renderDocumentUpload("passport"),
            },
            {
              key: "aadhar",
              label: "Aadhar Card",
              children: renderDocumentUpload("aadhar"),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
};

export default BookingUserInfoSidebar;
