import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { useMemo } from "react";

const Locks = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/locks", label: "Locks" },
  ];

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "name",
        title: "Name ",
        dataIndex: "name",
      },
      {
        key: "device_ref_id",
        title: "Device Ref Id ",
        dataIndex: "device_ref_id",
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
        name: "device_ref_id",
        label: "Device Ref Id",
        type: "text",
        required: true,
      },
    ],
    []
  );

  return (
    <Zud
      title="Locks"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="locks"
      mutationEndpoint="CAS_LOCKS"
      queryEndpoint="CAS_LOCKS"
    />
  );
};

export default Locks;
