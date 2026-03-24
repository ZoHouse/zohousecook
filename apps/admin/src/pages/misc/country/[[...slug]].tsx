import { useQueryApi } from "@zo/auth";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Currency } from "apps/admin/src/config";

const Country = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/country", label: "Country" },
  ];

  const { data: currencyOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_CURRENCY",
    {
      refetchOnWindowFocus: false,
      select(data) {
        return data.data.map((currency: Currency) => ({
          label: currency.name,
          value: currency.code,
        }));
      },
    },
    "",
    "limit=-1"
  );

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name ",
      dataIndex: "name",
      width: "320px",
    },
    {
      key: "code",
      title: "Code ",
      dataIndex: "code",
    },
    {
      key: "local_currency",
      title: "Local Currency ",
      dataIndex: "local_currency",
    },
    {
      key: "mobile_code",
      title: "Mobile Code ",
      dataIndex: "mobile_code",
    },
    {
      key: "flag",
      title: "flag",
      dataIndex: "flag",
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "code",
      label: "Code",
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
      name: "local_currency",
      label: "Local currency",
      type: "select",
      required: true,
      options: currencyOptions,
    },
    {
      name: "mobile_code",
      label: "Mobile Code",
      type: "text",
      required: true,
    },
    {
      name: "flag",
      label: "flag",
      type: "text",
    },
  ];

  return (
    <Zud
      title="Countries"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="country"
      mutationEndpoint="CAS_COUNTRIES"
      customSearchQuery="ordering=name"
      queryEndpoint="CAS_COUNTRIES"
    />
  );
};

export default Country;
