import { Person } from "@mui/icons-material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageContent, PageHeader, useInfiniteTable } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString, shortenString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Avatar, Flex } from "antd";
import { AirdropInfoSidebar } from "apps/admin/src/components/sidebars";
import { NextPage } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

const Airdrop: NextPage = () => {
  const [data, setData] = useState<GeneralObject[]>([]);

  const { data: seedData } = useQueryApi<GeneralObject>("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });

  const selectedAirdropSlug = seedData?.["zo-points"];

  const breadCrumbs = useMemo(
    () => [
      { href: "/misc", label: "Miscellaneous" },
      { href: "/misc/zo-points", label: "Zo Points" },
    ],
    []
  );

  const {
    data: selectedAirdrop,
    isLoading: isLoadingSelectedAirdrop,
    isRefetching: isRefetchingSelectedAirdrop,
  } = useQueryApi<GeneralObject>(
    "CAS_NFTAIRDROPCOLLECTIONS",
    {
      enabled: isValidString(selectedAirdropSlug),
      select: (response) => response?.data,
    },
    `${selectedAirdropSlug}/`
  );

  const [isAddAirDropVisible, showAddAirdrop, hideAddAirdrop] =
    useVisibilityState(false);

  const { isLoading } = useInfiniteTable({
    setter: setData,
    queryEndpoint: "CAS_NFTAIRDROPS",
    name: "airdrop",
    customSearchQuery: `collection=${selectedAirdropSlug}`,
  });

  const getUserName = (user: GeneralObject) => {
    return (
      user.nickname ||
      user.email ||
      user.full_name ||
      user.email_address ||
      user.mobile_numbers ||
      user.first_name
    );
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "drop_function_inputs",
        title: "value",
        dataIndex: "drop_function_inputs",
        render: (cell, row) => {
          const dividedValue =
            row?.drop_function_inputs.value / Math.pow(10, 8);
          const formattedValue = dividedValue.toFixed(2);
          return <span>{formattedValue}</span>;
        },
      },
      {
        key: "transacted_from",
        title: "Transacted From",
        dataIndex: "transacted_from",
        render: (cell) => {
          const cityWallet = seedData?.["city-wallets"]?.find(
            (city: GeneralObject) =>
              city.address.toLowerCase() === cell?.toLowerCase()
          );
          return (
            <p>
              {cityWallet ? cityWallet.name : shortenString(cell, 10) || "-"}
            </p>
          );
        },
      },
      {
        key: "user",
        title: "Transferred To",
        dataIndex: "user",
        render: (cell, row) => (
          <Flex align="center" gap={8}>
            <Avatar icon={<Person />} src={cell?.avatar.image} />
            {getUserName(cell)}
          </Flex>
        ),
      },
      {
        key: "transaction_hash",
        title: "Transaction Hash",
        dataIndex: "transaction_hash",
        render: (cell, row) => (
          <Link
            className="flex gap-4"
            href={` ${row?.collection?.contract?.chain?.block_explorer_url}tx/${cell}`}
          >
            <span>View Transaction</span>
            <Icon name="NewTab" size={24} fill="#fff" />
          </Link>
        ),
      },
    ],
    [seedData]
  );

  return (
    <Page breadCrumbs={breadCrumbs}>
      <PageHeader
        title="Zo Points"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Zo Points",
            onClick: showAddAirdrop,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <ZudTable
          isLoading={isLoading}
          data={data || []}
          columns={columns}
          keyExtractor={(row) => row.id}
        />
      </PageContent>
      <AirdropInfoSidebar
        isOpen={isAddAirDropVisible}
        isLoadingAirdrop={isLoadingSelectedAirdrop}
        isRefetchingAirdrop={isRefetchingSelectedAirdrop}
        airdropDetails={selectedAirdrop || {}}
        onClose={hideAddAirdrop}
        seedData={seedData || []}
      />
    </Page>
  );
};

export default Airdrop;
