import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import { Button, Drawer, message } from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import React, { useEffect } from "react";
import { CASBulletinBoardResponse } from "../../config";
import { Form, FormElement } from "../Form";

interface BulletinProps {
  isOpen: boolean;
  boardId: string | null;
  onClose: () => void;
  onSuccess: (data: GeneralObject) => void;
}

interface Option {
  label: string;
  value: string;
}

interface SeedData {
  typeOptions: Option[];
  categoryOptions: Option[];
}

const bulletinStatus = [
  { value: "unpublished", label: "Unpublished" },
  { value: "published", label: "Published" },
];

const Bulletin: React.FC<BulletinProps> = ({
  isOpen,
  onClose,
  boardId,
  onSuccess,
}) => {
  const profile = useProfile();
  const { mutate: uploadMedia } = useMutationApi("CAS_MEDIA");

  const [form] = useForm();
  const type = useWatch("type", form);

  const { data: userId } = useQueryApi<string>(
    "CAS_PROFILES",
    {
      enabled: isOpen && profile?.profile?.pid != null,
      select: (data) => data.data.user.id,
    },
    `${profile?.profile?.pid}/`
  );

  const formatCategoryOption = (category: string) => ({
    label: formatCapitalize(category),
    value: category,
  });

  const { data: seedData } = useQueryApi<SeedData>("CAS_SEED", {
    select: (data) => ({
      typeOptions: data.data.bulletin.type.map(formatCategoryOption),
      categoryOptions:
        data.data.gallery.media.category.map(formatCategoryOption),
    }),
  });

  const typeOptions = seedData?.typeOptions || [];

  const { data: bulletinBoardOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_BULLETIN_BOARDS", {
    enabled: isOpen,
    select: (data) =>
      data.data.results.map((bulletinBoard: CASBulletinBoardResponse) => ({
        label: bulletinBoard.title,
        value: bulletinBoard.id,
      })),
  });

  const { mutate: createBulletin } = useMutationApi("CAS_BULLETINS");

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleUploadMedia = (id: string) => {
    uploadMedia(
      {
        data: form.getFieldValue("file"),
        route: `bulletin_media/${id}/`,
      },
      {
        onSuccess() {
          message.success("Media Uploaded Successfully.");
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleSave = () => {
    if (!boardId) return;

    form.validateFields().then((values) => {
      const { file, category, ...otherFormData } = values;

      createBulletin(
        {
          data: {
            ...otherFormData,
            board: boardId,
            created_by: userId,
          },
        },
        {
          onSuccess(data) {
            if (values.type === "media") {
              handleUploadMedia(data.data.id);
            }
            message.success("Bulletin Created");
            onSuccess(data.data);
            handleClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const formFields: FormElement[] = [
    {
      name: "board",
      label: "Board",
      type: "select",
      required: true,
      initialValue: boardId,
      options: bulletinBoardOptions,
      disabled: true,
    },
    {
      name: "status",
      label: "Status",
      type: "radio",
      options: bulletinStatus,
    },
    {
      name: "data.tweet_url",
      type: "text",
      label: "Tweet Url",
      required: true,
      rules: [
        {
          type: "url",
          message: "Please enter a valid URL",
        },
      ],
    },
    {
      label: "Type",
      name: "type",
      type: "select",
      options: typeOptions,
    },
    {
      label: "Media",
      name: "file",
      type: "media",
      isHidden: type !== "media",
    },
  ];

  useEffect(() => {
    if (boardId && isOpen) {
      form.setFieldValue("board", boardId);
    } else {
      form.resetFields();
    }
  }, [boardId, isOpen]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add new Bulletin"
      extra={
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      }
    >
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default Bulletin;
