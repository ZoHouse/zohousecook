import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  CollapsibleSearch,
  Page,
  PageContent,
  PageHeader,
  useInfiniteTable,
} from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { ZudFilterOptions, ZudFilterOptionType, ZudTable } from "@zo/zud";
import { Statistic, Tag } from "antd";
import dayjs from "dayjs";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { AddPartnerSidebar } from "../../components/sidebars";
import { Channel, Operator } from "../../config/typings";

const Index: NextPage = () => {
  const router = useRouter();

  const [partners, setPartners] = useState<GeneralObject[]>([]);
  const [searchResults, setSearchResults] = useState<Operator[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddPartnerVisible, showAddPartner, hideAddPartner] =
    useVisibilityState();

  const { data: partnerStatus } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.operator.status.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: channels } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_CHANNELS", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.results.map((item: Channel) => ({
        label: formatCapitalize(item.name),
        value: item.id,
      }));
    },
  });

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    Operator[]
  >(
    "CAS_OPERATORS",
    {
      enabled:
        isValidString(searchQuery.trim()) && searchQuery.trim().length > 2,
      onSuccess: (data) => {
        setSearchResults(data?.data?.results || []);
      },
    },
    "",
    `search=${searchQuery}&ordering=-created_at`
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
  }, [searchQuery]);

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "status",
        className: "w-fit md:w-48",
        placeholder: "Status",
        options: [
          {
            label: "All Status",
            value: "null",
          },
          ...(partnerStatus || []),
        ],
      },
      {
        type: "select",
        key: "channel",
        className: "w-fit md:w-48",
        placeholder: "Channel",
        options: [
          {
            label: "All Channels",
            value: "null",
          },
          ...(channels || []),
        ],
      },
    ],
    [partnerStatus, channels]
  );

  const { isLoading, count, refetch } = useInfiniteTable({
    name: "partners",
    queryEndpoint: "CAS_OPERATORS",
    setter: setPartners,
    customSearchQuery: "ordering=-created_at",
    filterOptions: filterOptions,
  });

  const columns = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      render: (text: string) => <span>{text || "N/A"}</span>,
    },

    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag
          bordered={false}
          color={status === "active" ? "success" : "warning"}
        >
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      key: "destination",
      title: "Destination",
      dataIndex: "destination",
      render: (destination: GeneralObject) => (
        <span>{destination.name || "N/A"}</span>
      ),
    },

    {
      key: "phone",
      title: "Phone",
      dataIndex: "phone",
      render: (phone: string) => <span>{phone || "N/A"}</span>,
    },
    {
      key: "email",
      title: "Email",
      dataIndex: "email",
      render: (email: string) => <span>{email || "N/A"}</span>,
    },

    {
      key: "address",
      title: "Address",
      dataIndex: "address",
      width: 300,
      render: (address: string) => <span>{address || "N/A"}</span>,
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (created_at: string) => (
        <span>{dayjs(created_at).format("DD/MM/YYYY HH:mm")}</span>
      ),
    },
    {
      key: "updated_at",
      title: "Updated At",
      dataIndex: "updated_at",
      render: (updated_at: string) => (
        <span>{dayjs(updated_at).format("DD/MM/YYYY HH:mm")}</span>
      ),
    },
  ];

  const handleRowClick = (data: GeneralObject) => {
    router.push(`/partners/${data.id}`);
  };

  return (
    <Page>
      <PageHeader
        title="Partners"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Partner",
            onClick: showAddPartner,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        <Statistic title="Total Partners" value={count} />

        <div className="flex justify-between space-x-6 mb-6 border-t border-zui-light pt-6">
          {filterOptions && (
            <ZudFilterOptions
              name="partners"
              options={filterOptions}
              className="mb-0"
            />
          )}
          <div className="flex space-x-4">
            <CollapsibleSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <ZudTable
          data={searchQuery.trim().length > 2 ? searchResults : partners}
          isLoading={isLoading || isSearching}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={handleRowClick}
        />
      </PageContent>
      <AddPartnerSidebar
        isOpen={isAddPartnerVisible}
        onClose={hideAddPartner}
        refetch={refetch}
      />
    </Page>
  );
};

export default Index;
