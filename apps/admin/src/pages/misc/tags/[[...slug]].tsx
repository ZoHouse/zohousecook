/* eslint-disable @next/next/no-img-element */
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Button, message, Tooltip } from "antd";
import { MouseEventHandler } from "react";
import { useQueryClient } from "react-query";

interface TagsProps {}

const Tags: React.FC<TagsProps> = () => {
  const queryClient = useQueryClient();

  const { mutate: deleteTag } = useMutationApi(
    "CAS_TAGS",
    undefined,
    "",
    "DELETE"
  );

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.stopPropagation();
    const id = e.currentTarget.getAttribute("data-id");
    if (!id) return;
    deleteTag(
      { data: {}, route: `${id}/` },
      {
        onSuccess() {
          message.success("Tag Deleted!");
          queryClient.invalidateQueries(["cas", "tags"]);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
    // Call delete mutation here
  };

  const columns: ZudColumnType[] = [
    {
      key: "slug",
      title: "Slug",
      dataIndex: "slug",
    },
    {
      key: "label",
      title: "Label",
      dataIndex: "label",
    },
    {
      key: "emoji",
      title: "Emoji",
      dataIndex: "emoji",
    },
    {
      key: "#",
      title: "#",
      width: "100px",
      dataIndex: "id",
      render: (cell: any) => {
        return (
          <Tooltip
            title={
              <div className="flex gap-2">
                <span>Are you sure?</span>
                <Button
                  type="primary"
                  danger
                  data-id={cell}
                  onClick={handleDelete}
                  size="small"
                >
                  Delete
                </Button>
              </div>
            }
            trigger="click"
          >
            <button
              onClick={(e) => e.stopPropagation()}
              className="hover:text-zui-neon"
            >
              Delete
            </button>
          </Tooltip>
        );
      },
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "slug",
      label: "Slug",
      type: "text",
      submitKeySelector: (value: any) => value?.toLowerCase(),
    },
    {
      name: "label",
      label: "Label",
      type: "text",
    },
    {
      name: "emoji",
      label: "Emoji",
      type: "emojiPicker",
    },
  ];

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/tags", label: "Tags" },
  ];

  return (
    <Zud
      breadCrumbs={breadcrumbs}
      name="Tags"
      title="Tags"
      columns={columns}
      formFields={formFields}
      mutationEndpoint="CAS_TAGS"
      queryEndpoint="CAS_TAGS"
      customSearchQuery="ordering=-created_at"
    />
  );
};

export default Tags;
