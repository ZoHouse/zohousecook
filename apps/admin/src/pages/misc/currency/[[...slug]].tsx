import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { useMemo } from "react";

const Weights = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/currency", label: "Currency" },
  ];

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name ",
        dataIndex: "name",
      },
      {
        key: "code",
        title: "Code",
        dataIndex: "code",
      },
      {
        key: "symbol",
        title: "Symbol",
        dataIndex: "symbol",
      },

      {
        key: "decimals",
        title: "Decimals ",
        dataIndex: "decimals",
      },
    ],
    []
  );

  const formFields: FormFieldType[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
      },
      {
        name: "code",
        label: "Code",
        type: "text",
        required: true,
      },
      {
        name: "symbol",
        label: "Symbol",
        type: "text",
        required: true,
      },
      {
        name: "decimals",
        label: "Decimals",
        type: "number",
        required: true,
      },
    ],
    []
  );

  return (
    <Zud
      title="Currency"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="currency"
      mutationEndpoint="CAS_CURRENCY"
      queryEndpoint="CAS_CURRENCY"
    />
  );
};

export default Weights;
