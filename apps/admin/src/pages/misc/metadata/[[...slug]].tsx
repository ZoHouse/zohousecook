import { OpenInNew } from "@mui/icons-material";
import { GeneralObject } from "@zo/definitions/general";
import { isImageUri } from "@zo/utils/string";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Alert } from "antd";
import React from "react";

interface MetadataProps {}

const breadcrumbs = [
  { href: "/misc", label: "Miscellaneous" },
  { href: "/misc/metadata", label: "Metadata" },
];

const Metadata: React.FC<MetadataProps> = () => {
  const formFields: FormFieldType[] = [
    {
      label: "Target URL",
      name: "url",
      type: "text",
      required: true,
    },
    {
      label: "Page Title",
      name: "title",
      type: "text",
      required: true,
    },
    {
      label: "Page Description",
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      label: "Upload Image",
      name: "image",
      type: "mediaLinkGenerator",
      required: true,
    },
  ];

  const columns: ZudColumnType[] = [
    {
      key: "url",
      title: "URL",
      dataIndex: "url",
      render(cell: string) {
        return cell ? (
          <a
            href={String(cell)}
            target="_blank"
            className="flex items-center gap-2 hover:text-zui-neon hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {String(cell)}
            <OpenInNew fontSize="small" />
          </a>
        ) : (
          "-"
        );
      },
    },
    {
      key: "title",
      title: "Title",
      dataIndex: "title",
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      render(cell: string) {
        return (
          <p className="w-[320px] whitespace-normal">
            {String(cell).substring(0, 100)}
            {String(cell).length > 100 ? "..." : ""}
          </p>
        );
      },
    },
    {
      key: "image",
      title: "Image",
      dataIndex: "image",
      render(cell: string, row: GeneralObject) {
        return isImageUri(cell) ? (
          <img
            src={`${String(cell)}?w=200`}
            className="w-20 aspect-video"
            alt={`${row?.title || ""}-meta-image`}
          />
        ) : (
          <Alert
            message="Failed to load image"
            type="error"
            style={{ width: "fit-content" }}
          />
        );
      },
    },
  ];

  return (
    <Zud
      title="Metadata"
      breadCrumbs={breadcrumbs}
      queryEndpoint="CAS_METADATA"
      mutationEndpoint="CAS_METADATA"
      columns={columns}
      name="offers"
      formFields={formFields}
    />
  );
};

export default Metadata;
