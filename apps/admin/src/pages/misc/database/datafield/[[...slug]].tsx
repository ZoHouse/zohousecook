import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { dataEntityOptions, dataTypeOptions } from "apps/admin/src/utils";
import { NextPage } from "next";

const dataField: NextPage = () => {
  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "entity",
      title: "Entity",
      dataIndex: "entity",
    },
    {
      key: "data_type",
      title: "Type",
      dataIndex: "data_type",
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "data_type",
      label: "Type",
      type: "radio",
      options: dataTypeOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      required: true,
    },
    {
      name: "entity",
      label: "Entity",
      type: "radio",
      options: dataEntityOptions.map((option) => ({
        label: option.label,
        value: option.value,
      })),
      required: true,
    },
  ];

  return (
    <Zud
      breadCrumbs={[
        { href: "/misc", label: "Miscellaneous" },
        { href: "/misc/database", label: "Database" },
        { href: "/misc/database/datafield", label: "Datafield" },
      ]}
      name="datafield"
      title="Data Field"
      queryEndpoint="CAS_DATA_FIELDS"
      mutationEndpoint="CAS_DATA_FIELDS"
      columns={columns}
      formFields={formFields}
    />
  );
};

export default dataField;
