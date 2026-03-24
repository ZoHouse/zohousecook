import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { useMemo } from "react";

const Cultures = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/cultures", label: "Cultures" },
  ];

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name ",
        dataIndex: "name",
      },
      {
        key: "key",
        title: "Key ",
        dataIndex: "key",
      },
      {
        key: "description",
        title: "Description ",
        dataIndex: "description",
      },
    ],
    []
  );

  const formFields: FormFieldType[] = useMemo(
    () => [
      {
        name: "key",
        label: "Key",
        type: "text",
        required: true,
      },
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
    ],
    []
  );

  return (
    <Zud
      title="Cultures"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="cultures"
      mutationEndpoint="CAS_CULTURES"
      queryEndpoint="CAS_CULTURES"
    />
  );
};

export default Cultures;
