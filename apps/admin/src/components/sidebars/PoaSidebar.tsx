import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import { areObjectsEqual, separateFileKeys } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { POA } from "../../config/typings";
import { Alert, Button, Drawer, message, Spin } from "antd";
import { useForm } from "antd/es/form/Form";
import { Form, FormElement } from "../Form";
import dayjs from "dayjs";

interface POAInfoProps {
  isOpen: boolean;
  poaId: string | null;
  onClose: () => void;
}

const POAInfo: React.FC<POAInfoProps> = ({ poaId, onClose, isOpen }) => {
  const queryClient = useQueryClient();

  const [form] = useForm();

  const { mutate, isLoading } = useMutationApi(
    "CAS_POAS",
    {},
    "",
    poaId ? "PUT" : "POST"
  );
  const { mutateAsync: uploadMedia, isLoading: isUploading } =
    useMutationApi("CAS_MEDIA");

  const { data: poaData } = useQueryApi<POA>(
    "CAS_POAS",
    {
      enabled: isOpen && poaId != null,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${poaId}/`
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    enabled: isOpen,
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const statusOptions = useMemo(() => {
    if (seed) {
      return seed.poa.status.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const categoryOptions = useMemo(() => {
    if (seed) {
      return seed.poa.category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const initialData = useMemo(() => {
    if (poaData) {
      const _data: GeneralObject = {
        ...poaData,
      };

      Object.keys(_data).forEach((key) => {
        const value = String(_data[key]);
        if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
          _data[key] = dayjs(value);
        }
      });

      delete _data.contract;
      delete _data.id;
      delete _data.created_at;
      delete _data.updated_at;

      return _data;
    } else {
      return {};
    }
  }, [poaData && poaId]);

  const formFields: FormElement[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: statusOptions,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "radio",
      required: true,
      options: categoryOptions,
    },
    {
      name: "url",
      label: "URL",
      type: "text",
      rules: [
        {
          type: "url",
          message: "Please enter a valid URL",
        },
      ],
    },
    {
      name: "started_at",
      label: "Event Start",
      required: true,
      type: "datetime",
      initialValue: new Date(),
    },
    {
      name: "ended_at",
      label: "Event End",
      type: "datetime",
      required: true,
    },
    {
      name: "attendees_count",
      label: "No of Attendees",
      type: "number",
      minValue: 0,
    },
    {
      name: "claim_start",
      required: true,
      label: "Claim Starts At",
      type: "datetime",
      initialValue: new Date(),
    },
    {
      name: "claim_end",
      label: "Claim Ends At",
      type: "datetime",
      required: true,
    },
    {
      name: "max_supply",
      label: "Max Supply",
      type: "number",
      required: true,
      minValue: 0,
    },
    {
      name: "video",
      label: "Video",
      type: "media",
      allowedFileTypes: ["video"],
    },
    {
      name: "image",
      label: "image",
      type: "media",
      allowedFileTypes: ["image"],
      required: true,
    },
  ];

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      const { fileObj, restObj } = separateFileKeys(values, true);

      if (poaId) {
        const updateActions = [];

        if (!areObjectsEqual(initialData, restObj)) {
          updateActions.push(
            mutate({
              data: restObj,
              route: `${poaId}/`,
            })
          );
        }

        if (Object.keys(fileObj).length > 0) {
          Object.keys(fileObj).map((key: string) => {
            fileObj[key] &&
              fileObj[key] instanceof FormData &&
              uploadMedia(
                {
                  data: fileObj[key],
                  route: `poa/${poaId}/`,
                },
                {
                  onSuccess() {
                    message.success("Media Uploaded");
                    queryClient.invalidateQueries(["cas", "poa"]);
                    handleClose();
                  },
                  onError(error) {
                    message.error(processResponseError(error));
                  },
                }
              );
          });
        }

        await Promise.all(updateActions);

        message.success("Updated successfully.");
      } else {
        const contract = process.env.POA_CONTRACT_ID;
        mutate(
          {
            data: {
              ...values,
              contract,
            },
          },
          {
            onSuccess: (data: GeneralObject) => {
              message.success("Poa Created Successfully");
              Object.keys(fileObj).map((key: string) => {
                fileObj[key] &&
                  uploadMedia(
                    {
                      data: fileObj[key],
                      route: `poa/${data.data.id}/`,
                    },
                    {
                      onSuccess() {
                        message.success("Media Uploaded");
                        handleClose();
                      },
                      onError(error) {
                        message.error(processResponseError(error));
                      },
                    }
                  );
              });
              queryClient.invalidateQueries(["cas", "poa"]);
            },
          }
        );
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  useEffect(() => {
    if (poaId && initialData && isOpen) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [poaData, isOpen]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={poaId ? "Update PoA" : "Add a New PoA"}
      extra={
        <Button type="primary" onClick={handleSubmit}>
          Submit
        </Button>
      }
    >
      <Spin spinning={isLoading || isUploading}>
        <Form formData={form} formFields={formFields} />
        <Alert
          message={
            <span>
              <strong>Note: </strong>If both an image and a video are added, the
              image acts as the thumbnail.
            </span>
          }
          type="info"
          showIcon
          className="my-5"
        />
      </Spin>
    </Drawer>
  );
};

export default POAInfo;
