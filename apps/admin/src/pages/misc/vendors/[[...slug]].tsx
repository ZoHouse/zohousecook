import { useQueryApi } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { NextPage } from "next";
import { ZoHouse } from "../../../config";

const Vendor: NextPage = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/vendors", label: "Vendors" },
  ];

  const { data: operatorOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_OPERATORS",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.map((opeartor: ZoHouse) => ({
          label: opeartor.name,
          value: opeartor.id,
        })),
    },
    "",
    "limit=-1"
  );

  const columns: ZudColumnType[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: any) => (isValidString(name) ? name : "-"),
    },
    {
      title: "Phone Number",
      dataIndex: "phone",
      key: "phone",
      render: (phone: any) => (isValidString(phone) ? phone : "-"),
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
      render: (company: any) => (isValidString(company) ? company : "-"),
    },
    { title: "Address", dataIndex: "address", key: "address" },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "company",
      label: "Company",
      type: "text",
      required: true,
    },
    {
      name: "operator",
      label: "Operator",
      type: "select",
      required: true,
      options: operatorOptions,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "phone",
      required: true,
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: true,
    },
  ];

  return (
    <Zud
      breadCrumbs={breadcrumbs}
      name="Vendors"
      title="Vendors"
      columns={columns}
      formFields={formFields}
      mutationEndpoint="CAS_OPERATOR_VENDORS"
      queryEndpoint="CAS_OPERATOR_VENDORS"
    />
  );
};

export default Vendor;
