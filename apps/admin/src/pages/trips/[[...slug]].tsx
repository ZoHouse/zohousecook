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
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import { ZudFilterOptionType, ZudFilterOptions, ZudTable } from "@zo/zud";
import { Button, Statistic, Tag } from "antd";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddTripSideBar } from "../../components/sidebars";

const Trip: NextPage = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [trips, setTrips] = useState<GeneralObject[]>([]);
  const [isAddTripVisible, showAddTrip, hideAddTrip] = useVisibilityState();

  const { data: tripStatus } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.inventory.status.map((item: string) => ({
        label: formatCapitalize(item),
        value: item,
      })),
  });

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    GeneralObject[]
  >(
    "CAS_INVENTORY",
    {
      enabled:
        isValidString(searchQuery.trim()) && searchQuery.trim().length > 2,
      onSuccess: (data) => {
        setSearchResults(data?.data?.results || []);
      },
    },
    "",
    `search=${searchQuery}&type=trip&ordering=-status,name&fields=id,name,status,skus,operator`
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ...(tripStatus || []),
        ],
      },
    ],
    [tripStatus]
  );

  const { refetch, isLoading, count } = useInfiniteTable({
    setter: setTrips,
    queryEndpoint: "CAS_INVENTORY",
    customSearchQuery: `type=trip&ordering=-status,name&fields=id,name,status,skus,operator`,
    name: "trips",
    filterOptions: filterOptions,
  });

  const columns = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      render: (text: string) => <span>{text || "-"}</span>,
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
      key: "bookings",
      title: "Bookings",
      dataIndex: "bookings",
      render: (_: any, record: GeneralObject) => (
        <Button
          type="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/trips/${record.id}/bookings`);
          }}
        >
          View Bookings
        </Button>
      ),
    },
  ];

  const handleClose = () => {
    hideAddTrip();
    router.push(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    router.push(`/trips/${data.id}`);
  };

  const handleAddClick = () => {
    showAddTrip();
  };

  return (
    <Page>
      <PageHeader
        title="Trips"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add Trip",
            onClick: handleAddClick,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <Statistic title="Total Trips" value={count} />

        <div className="flex justify-between space-x-6 mb-6 border-t border-zui-light pt-6">
          {filterOptions && (
            <ZudFilterOptions
              name="trips"
              options={filterOptions}
              className="mb-0"
            />
          )}
          <div className="flex space-x-4">
            <CollapsibleSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <ZudTable
          data={searchQuery.trim().length > 2 ? searchResults : trips}
          isLoading={isLoading || isSearching}
          columns={columns}
          keyExtractor={(row) => row.id.toString()}
          onRowClick={handleRowClick}
        />
      </PageContent>

      <AddTripSideBar
        isOpen={isAddTripVisible}
        onClose={handleClose}
        refetch={refetch}
      />
    </Page>
  );
};

export default Trip;
