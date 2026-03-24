import { Zud, ZudColumnType, FormFieldType } from "@zo/zud";
import { useMemo } from "react";

const Weights = () => {
  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name",
        dataIndex: "name",
      },
      {
        key: "contract_ref_address",
        title: "Contract Ref Address",
        dataIndex: "contract_ref_address",
      },
      {
        key: "weight",
        title: "Weight",
        dataIndex: "weight",
      },
    ],
    []
  );

  const formFields: FormFieldType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
    },
    {
      name: "contract_ref_address",
      label: "Contract Ref Address",
      type: "text",
    },
    {
      name: "weight",
      label: "Weight",
      type: "number",
    },
  ];

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/weights", label: "Weights" },
  ];

  return (
    <Zud
      breadCrumbs={breadcrumbs}
      name="Collection Weights"
      title="Weights"
      columns={columns}
      formFields={formFields}
      mutationEndpoint="CAS_SHOWCASE_WEIGHTS"
      queryEndpoint="CAS_SHOWCASE_WEIGHTS"
    />
  );
};

export default Weights;
