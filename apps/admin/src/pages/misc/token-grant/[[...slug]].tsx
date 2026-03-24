import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { formatAddress } from "@zo/utils/web3";
import { Tooltip } from "antd";
import { CopyToClipboardField } from "apps/admin/src/components/ui";
import moment from "moment";

const TokenGrant = () => {
  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "allowance",
      title: "Allowance",
      dataIndex: "allowance",
    },
    {
      key: "wallet_address",
      title: "Wallet Address",
      dataIndex: "wallet_address",
      render: (data: any) =>
        data ? (
          <a
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            className="hover:underline hover:text-zui-neon"
            href={`https://etherscan.io/address/${data}`}
          >
            {formatAddress(data)}
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "contract",
      title: "Contract",
      dataIndex: "contract",
      render: (data: any) =>
        data ? <CopyToClipboardField text={data} /> : "-",
    },
    {
      key: "start_date",
      title: "Start At",
      dataIndex: "start_date",
      render: (data: any) =>
        data ? (
          <Tooltip title={moment(data).format("LLLL")}>
            {moment(data).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      key: "end_date",
      title: "End At",
      dataIndex: "end_date",
      render: (data: any) =>
        data ? (
          <Tooltip title={moment(data).format("LLLL")}>
            {moment(data).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (data: any) =>
        data ? (
          <Tooltip title={moment(data).format("LLLL")}>
            {moment(data).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      key: "updated_at",
      title: "Updated At",
      dataIndex: "updated_at",
      render: (data: any) =>
        data ? (
          <Tooltip title={moment(data).format("LLLL")}>
            {moment(data).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
    },
    {
      name: "allowance",
      label: "Allowance",
      type: "number",
    },
    {
      name: "wallet_address",
      label: "Wallet Address",
      type: "text",
    },
    {
      name: "start_at",
      label: "Start Date",
      type: "datetime",
    },
    {
      name: "end_date",
      label: "End Date",
      type: "datetime",
    },
    {
      name: "contract",
      label: "Contract",
      type: "text",
    },
  ];

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/token-grant", label: "Token Grant" },
  ];

  return (
    <Zud
      breadCrumbs={breadcrumbs}
      name="Token Grant"
      title="Token Grant"
      columns={columns}
      formFields={formFields}
      mutationEndpoint="CAS_TOKEN_GRANTS"
      queryEndpoint="CAS_TOKEN_GRANTS"
    />
  );
};

export default TokenGrant;
