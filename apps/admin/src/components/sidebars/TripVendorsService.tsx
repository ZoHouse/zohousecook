import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, useInfiniteTable } from "@zo/moal";
import { ZudTable } from "@zo/zud";
import { Button, Drawer, Statistic, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { AddTripVendorServiceSidebar } from ".";
import { VendorService } from "../../config/typings";

interface TripVendorsServiceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SEARCH_LENGTH = 3;

const TripVendorsServiceSidebar: React.FC<TripVendorsServiceSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [tripVendors, setTripVendors] = useState<GeneralObject[]>([]);
  const [vendorServiceId, setVendorServiceId] = useState("");
  const [selectedVendorData, setSelectedVendorData] = useState<
    GeneralObject | undefined
  >();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const trimmedSearch = searchQuery.trim();
  const isSearchMode = trimmedSearch.length >= MIN_SEARCH_LENGTH;

  const shouldFetchSearch = isOpen && isSearchMode;
  const shouldFetchList = isOpen && !isSearchMode;

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    VendorService[]
  >(
    "CAS_VENDOR_SERVICES",
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
    queryEndpoint: "CAS_VENDOR_SERVICES",
    name: "trip-vendors-service-sidebar",
    enabled: shouldFetchList,
  });

  const columns = useMemo(
    () => [
      {
        key: "category",
        title: "Category",
        dataIndex: "category",
      },
      {
        key: "name",
        title: "Sub-Category",
        dataIndex: "name",
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
    setVendorServiceId(data.id);
    setSelectedVendorData(data);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-service/${data.id}`, undefined, {
      shallow: true,
    });
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setVendorServiceId("");
    setSelectedVendorData(undefined);

    router.replace("/trip-vendors/vendor-service", undefined, {
      shallow: true,
    });
  };

  const handleCloseDrawer = () => {
    setSearchQuery("");
    setSearchResults([]);
    removeSearchResults();
    onClose();
    router.replace("/trip-vendors", undefined, {
      shallow: true,
    });
  };

  const handleAddClick = () => {
    setVendorServiceId("");
    setSelectedVendorData(undefined);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-service/new`, undefined, {
      shallow: true,
    });
  };

  const totalCount = isSearchMode ? searchResults.length : count;

  return (
    <Drawer
      title="Trip Vendors Services"
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
        <Statistic title="Total" value={totalCount} className="mb-4" />

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

      <AddTripVendorServiceSidebar
        isOpen={isAddOpen}
        onClose={handleCloseAdd}
        refetch={refetch}
        vendorServiceId={vendorServiceId}
        initialValues={selectedVendorData}
      />
    </Drawer>
  );
};

export default TripVendorsServiceSidebar;
