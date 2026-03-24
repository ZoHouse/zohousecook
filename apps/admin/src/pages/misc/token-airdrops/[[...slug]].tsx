/* eslint-disable @next/next/no-img-element */
import { useQueryApi } from "@zo/auth";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { formatAddress } from "@zo/utils/web3";
import { Tooltip } from "antd";
import { StatusCell } from "apps/admin/src/components/ui";
import moment from "moment";
import { useMemo } from "react";

const TokenAirdrops = () => {
  const { data: grantOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_TOKEN_GRANTS",
    {
      select(data) {
        return data.data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      },
    },
    "",
    "limit=-1"
  );

    const columns: ZudColumnType[] = useMemo(
    () => [
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
        key: "status",
        title: "Status",
        dataIndex: "status",
        render: (cell) => <StatusCell status={String(cell)} />,
      },
      {
        key: "amount",
        title: "Amount",
        dataIndex: "amount",
        render: (data: any) => data.toLocaleString(),
      },
      {
        key: "allocated_at",
        title: "Allocated At",
        dataIndex: "allocated_at",
        render: (data: any) =>
          data ? (
            <Tooltip title={moment(data).format("LLLL")}>
              {moment(data).format("lll")}
            </Tooltip>
          ) : (
            "-"
          ),
      },
      {
        key: "ref_note",
        title: "Reference Note",
        dataIndex: "ref_note",
      },
    ],
    []
  );

  const formFields: FormFieldType[] = [
    {
      name: "grant",
      label: "Grant",
      type: "select",
      options: grantOptions,
    },
    {
      name: "wallet_address",
      label: "Wallet Address",
      type: "text",
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
    },
    {
      name: "ref_note",
      label: "Reference Note",
      type: "text",
    },
    {
      name: "allocated_at",
      label: "Allocated At",
      type: "date",
    },
  ];

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/token-airdrops", label: "Token Airdrops" },
  ];

  return (
    <Zud
      breadCrumbs={breadcrumbs}
      name="Token Airdrops"
      title="Token Airdrops"
      columns={columns}
      formFields={formFields}
      mutationEndpoint="CAS_TOKEN_AIRDROPS"
      queryEndpoint="CAS_TOKEN_AIRDROPS"
      customSearchQuery="ordering=-created_at"
      allowEdit={false}
    />
  );
};

export default TokenAirdrops;
