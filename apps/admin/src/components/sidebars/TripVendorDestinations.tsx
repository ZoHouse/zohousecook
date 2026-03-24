import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, useInfiniteTable } from "@zo/moal";
import { ZudTable } from "@zo/zud";
import { Button, Drawer, Statistic, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { AddTripVendorServiceDestinationSidebar } from ".";
import { VendorServiceDestination } from "../../config/typings";

interface TripVendorDestinationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SEARCH_LENGTH = 3;

const TripVendorDestinationsSidebar: React.FC<
  TripVendorDestinationsSidebarProps
> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [tripVendors, setTripVendors] = useState<GeneralObject[]>([]);
  const [vendorServicedestinationId, setVendorServicedestinationId] =
    useState("");
  const [selectedVendorData, setSelectedVendorData] = useState<
    GeneralObject | undefined
  >();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const trimmedSearch = searchQuery.trim();
  const isSearchMode = trimmedSearch.length >= MIN_SEARCH_LENGTH;

  const shouldFetchSearch = isOpen && isSearchMode;
  const shouldFetchList = isOpen && !isSearchMode;

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    VendorServiceDestination[]
  >(
    "CAS_VENDOR_SERVICE_DESTINATIONS",
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
    queryEndpoint: "CAS_VENDOR_SERVICE_DESTINATIONS",
    name: "trip-vendor-destinations-sidebar",
    enabled: shouldFetchList,
  });

  const columns = useMemo(
    () => [
      {
        key: "vendor",
        title: "Vendor",
        dataIndex: "vendor",
        render: (vendor: GeneralObject) => vendor.name,
      },
      {
        key: "service",
        title: "Service",
        dataIndex: "service",
        render: (service: GeneralObject) => service.name,
      },
      {
        key: "destination",
        title: "Destination",
        dataIndex: "destination",
        render: (destination: GeneralObject) => destination.name,
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
    setVendorServicedestinationId(data.id);
    setSelectedVendorData(data);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-destinations/${data.id}`, undefined, {
      shallow: true,
    });
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setVendorServicedestinationId("");
    setSelectedVendorData(undefined);

    router.replace("/trip-vendors/vendor-destinations", undefined, {
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
    setVendorServicedestinationId("");
    setSelectedVendorData(undefined);
    setIsAddOpen(true);

    router.push(`/trip-vendors/vendor-destinations/new`, undefined, {
      shallow: true,
    });
  };

  const totalCount = isSearchMode ? searchResults.length : count;

  return (
    <Drawer
      title="Trip Vendor Destinations"
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

      <AddTripVendorServiceDestinationSidebar
        isOpen={isAddOpen}
        onClose={handleCloseAdd}
        refetch={refetch}
        vendorServicedestinationId={vendorServicedestinationId}
        initialValues={selectedVendorData}
      />
    </Drawer>
  );
};

export default TripVendorDestinationsSidebar;
