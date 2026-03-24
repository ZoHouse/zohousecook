import { useQueryApi } from "@zo/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import { Zud, ZudColumnType } from "@zo/zud";
import React, { useState } from "react";
import { FounderInfoSidebar } from "../components/sidebars";

import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { GeneralObject } from "@zo/definitions/general";
import { UserMini } from "../components/ui";
import {
  CASFounderStatsResponse,
  CASFounderTokensOwnerResponse,
} from "../config";

interface foundersProps {}

const Founders: React.FC<foundersProps> = () => {
  const [isFounderInfoVisible, showFounderInfo, hideFounderInfo] =
    useVisibilityState();

  const [selectedUser, setSelectedUser] =
    useState<CASFounderTokensOwnerResponse | null>(null);

  const { data: founderStats } = useQueryApi<CASFounderStatsResponse>(
    "CAS_FOUNDER_TOKENS_STATS",
    { select: (data) => data.data }
  );

  const { data: founderOwners } = useQueryApi<{
    count: number;
    result: CASFounderTokensOwnerResponse[];
  }>("CAS_FOUNDER_TOKENS_OWNERS", {
    select: (data) => data.data,
  });

  const columns: ZudColumnType[] = [
    {
      key: "user",
      title: "User",
      dataIndex: "user",
      render: (cell: GeneralObject, row) => <UserMini user={cell} />,
    },
    {
      key: "twitter_handle",
      title: "Twitter Handle",
      dataIndex: ["user", "twitter_handle"],
      render: (cell) => (
        <span>
          {isValidString(cell) ? (
            <a
              href={`https://twitter.com/${cell}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zui-neon hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{cell} <OpenInNewIcon fontSize="small" />
            </a>
          ) : (
            "-"
          )}
        </span>
      ),
    },
    {
      key: "wallet_address",
      title: "Wallet Address",
      dataIndex: ["user", "wallet_address"],
      render: (cell) => (
        <span className="whitespace-nowrap">
          {cell ? (
            <a
              href={`https://etherscan.io/address/${cell}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zui-neon hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {formatAddress(cell)} <OpenInNewIcon fontSize="small" />
            </a>
          ) : (
            "-"
          )}
        </span>
      ),
    },
    {
      key: "num_tokens",
      title: "#NFTs Owned",
      dataIndex: "num_tokens",
    },
    {
      key: "app_installed",
      title: "App Installed",
      dataIndex: "user",
      render: (cell) =>
        cell ? (
          <CheckOutlinedIcon fontSize="small" />
        ) : (
          <CloseOutlinedIcon fontSize="small" />
        ),
    },
  ];

  const stats: { label: string; value: number }[] = [
    { label: "Total Holders", value: founderOwners?.count || 0 },
    { label: "NFTs Minted", value: founderStats?.total_nfts_minted || 0 },
    { label: "Total App Users", value: founderStats?.total_holders || 0 },
    {
      label: "Holds more than 1 NFT",
      value: founderStats?.multiple_token_holders || 0,
    },
    {
      label: "Verified X Founders",
      value: founderStats?.verified_founder_twitter_accounts || 0,
    },
    {
      label: "Verified Telegram Founders",
      value: founderStats?.verified_founder_telegram_accounts || 0,
    },
  ];

  const handleOnRowClick = (data: any) => {
    setSelectedUser(data);
    showFounderInfo();
  };

  return (
    <>
      <Zud
        name="founders"
        title="Founders"
        queryEndpoint="CAS_FOUNDER_TOKENS_OWNERS"
        mutationEndpoint="CAS_PROFILES"
        columns={columns}
        onRowClick={handleOnRowClick}
        stats={stats}
      />
      <FounderInfoSidebar
        isOpen={isFounderInfoVisible}
        onClose={hideFounderInfo}
        data={selectedUser}
      />
    </>
  );
};

export default Founders;
