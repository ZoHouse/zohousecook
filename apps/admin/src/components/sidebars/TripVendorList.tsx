import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, useInfiniteTable } from "@zo/moal";
import { ZudTable } from "@zo/zud";
import { Button, Drawer, Statistic, Tag, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { AddTripVendorSidebar } from ".";
import { Vendor } from "../../config/typings";

interface TripVendorsListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SEARCH_LENGTH = 3;

const TripVendorsListSidebar: React.FC<TripVendorsListSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [tripVendors, setTripVendors] = useState<GeneralObject[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [selectedVendorData, setSelectedVendorData] = useState<
    GeneralObject | undefined
  >();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const trimmedSearch = searchQuery.trim();
  const isSearchMode = trimmedSearch.length >= MIN_SEARCH_LENGTH;

  const shouldFetchSearch = isOpen && isSearchMode;
  const shouldFetchList = isOpen && !isSearchMode;

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    Vendor[]
  >(
    "CAS_VENDORS",
    {
      enabled: shouldFetchSearch,
      onSuccess: (data) => {
        setSearchResults(data?.data?.results || []);
      },
    },
    "",
    `search=${trimmedSearch}`
  );

  useEffect(() => {
    if (!shouldFetchSearch) {
      removeSearchResults();
      setSearchResults([]);
    }
  }, [shouldFetchSearch, removeSearchResults]);

  const { isLoading, count, refetch } = useInfiniteTable({
    setter: setTripVendors,
    queryEndpoint: "CAS_VENDORS",
    name: "trip-vendors-list-sidebar",
    enabled: shouldFetchList,
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        title: "name",
        dataIndex: "name",
      },
      {
        key: "mobile",
        title: "Mobile Number",
        dataIndex: "mobile",
      },
      {
        key: "email",
        title: "Email",
        dataIndex: "email",
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
            {" "}
            {status === "active" ? "Active" : "Inactive"}{" "}
          </Tag>
        ),
      },
      {
        title: "Created",
        dataIndex: "created_at",
        key: "created_at",
        width: 120,
        render: (date: string) => (
          <Tooltip title={moment(date).format("MMMM Do YYYY, h:mm:ss a")}>
            {moment(date).calendar()}
          </Tooltip>
        ),
      },
    ],
    []
  );

  const handleRowClick = (data: GeneralObject) => {
    setVendorId(data.id);
    setSelectedVendorData(data);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-list/${data.id}`, undefined, {
      shallow: true,
    });
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setVendorId("");
    setSelectedVendorData(undefined);

    router.replace("/trip-vendors/vendor-list", undefined, {
      shallow: true,
    });
  };

  const handleCloseDrawer = () => {
    onClose();
    router.replace("/trip-vendors", undefined, {
      shallow: true,
    });
  };

  const handleAddClick = () => {
    setVendorId("");
    setSelectedVendorData(undefined);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-list/new`, undefined, {
      shallow: true,
    });
  };

  return (
    <Drawer
      title="Trip Vendors List"
      placement="right"
      width={1080}
      open={isOpen}
      onClose={handleCloseDrawer}
      extra={
        <Button type="primary" onClick={handleAddClick}>
          Add
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        <Statistic title="Total" value={count} className="mb-4" />

        <div className="flex justify-end mb-6">
          <CollapsibleSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex-1 min-h-0">
          <ZudTable
            data={isSearchMode ? searchResults : tripVendors}
            isLoading={isLoading || isSearching}
            columns={columns}
            keyExtractor={(row) => String(row.id)}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <AddTripVendorSidebar
        isOpen={isAddOpen}
        onClose={handleCloseAdd}
        refetch={refetch}
        vendorId={vendorId}
        initialValues={selectedVendorData}
      />
    </Drawer>
  );
};

export default TripVendorsListSidebar;
