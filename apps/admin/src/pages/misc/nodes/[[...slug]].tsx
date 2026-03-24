import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import React from "react";

interface NodesProps {}

const Nodes: React.FC<NodesProps> = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/nodes", label: "Nodes" },
  ];

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "destination",
      title: "Destination",
      dataIndex: ["destination", "name"],
      render(cell) {
        return cell || "-";
      },
    },
    {
      key: "coordinates",
      title: "Coordinates",
      dataIndex: "coordinates",
      width: "240px",
      render(cell) {
        return cell?.coordinates ? (
          <span>{`[${cell.coordinates[0]},${cell.coordinates[1]}]`}</span>
        ) : (
          "-"
        );
      },
    },
    {
      key: "address",
      title: "Address",
      dataIndex: "address",
      width: "320px",
      render(cell) {
        return (
          <p className="max-w-[320px] whitespace-normal">
            {String(cell).substring(0, 60)}
            {String(cell).length > 60 ? "..." : ""}
          </p>
        );
      },
    },

    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      width: "240px",
      render(cell) {
        return (
          <p className="max-w-[320px] whitespace-normal">
            {String(cell).substring(0, 60)}
            {String(cell).length > 60 ? "..." : ""}
          </p>
        );
      },
    },
  ];

  const formFields: FormFieldType[] = [
    {
      label: "Name",
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "destination",
      label: "City",
      type: "searchselect",
      searchQueryApi: "CAS_DESTINATIONS",
      required: true,
      responseFields: ["name","id"],
      optionValueAndLabelSelector(data) {
        return {
          value: data.id,
          label: data.name,
        };
      },
    },
    {
      label: "Address",
      name: "address",
      type: "textarea",
      required: true,
    },
    {
      label: "Description",
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "coordinates",
      label: "Coordinates",
      type: "coordinates",
      required: true,
    },
  ];

  return (
    <Zud
      title="Nodes"
      breadCrumbs={breadcrumbs}
      queryEndpoint="CAS_NODES"
      mutationEndpoint="CAS_NODES"
      columns={columns}
      name="nodes"
      formFields={formFields}
    />
  );
};

export default Nodes;
