import * as Sentry from "@sentry/nextjs";
import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { CollapsibleSearch, useInfiniteTable } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import {
  ZudColumnType,
  ZudFilterOptions,
  ZudFilterOptionType,
  ZudTable,
} from "@zo/zud";
import { notification, Tooltip } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookingInfoSidebar,
  CheckinFetchSidebar,
  CheckinQRSidebar,
  ExistingGuestFetchSidebar,
  ManualCheckinSidebar,
} from "../../components/sidebars";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";
import {
  getBookingPropertyCheckedInInfo,
  getBookingWebCheckedInInfo,
} from "../../utils";

interface StatsData {
  units: {
    total: number;
    completed_checkin: number;
  };
  bookings: {
    total: number;
    completed_checkin: number;
  };
}

const Overview: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("front-desk-manager");
  const router = useRouter();

  const [data, setData] = useState<GeneralObject[]>([]);
  const [selectedQRBooking, setSelectedQRBooking] = useState<{
    operatorCode: string;
    bookingCode?: string;
  }>({
    operatorCode: "",
  });
  const [checkinFetcher, setCheckinFetcher] = useState<GeneralObject>({});
  const [manualCheckinObject, setManualCheckinObject] = useState<{
    booking: GeneralObject;
    checkin?: GeneralObject;
  }>({
    booking: {},
  });
  const [existingGuestCheckin, setExistingGuestCheckin] =
    useState<GeneralObject>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [currentDocumentPath, setCurrentDocumentPath] = useState<string>("");
  const [documentsData, setDocumentsData] = useState<GeneralObject[]>([]);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const [failedDocuments, setFailedDocuments] = useState<Set<string>>(
    new Set()
  );

  const bookingDateRange = useMemo(() => {
    const currentHour = moment().hour();

    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    return currentHour >= 0 && currentHour < 12
      ? `start_date__gte=${yesterday}&start_date__lte=${today}`
      : `start_date=${today}`;
  }, []);

  const checkinDateRange = useMemo(() => {
    const currentHour = moment().hour();
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    return currentHour >= 0 && currentHour < 12
      ? `arrival_on__gte=${yesterday}&arrival_on__lte=${today}`
      : `arrival_on=${today}`;
  }, []);

  const existingCheckinDateRange = useMemo(() => {
    const currentHour = moment().hour();
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    return currentHour >= 0 && currentHour < 12
      ? `departure_on__gte=${yesterday}&departure_on__lte=${today}`
      : `departure_on=${today}`;
  }, []);

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    GeneralObject[]
  >(
    "ADMIN_PM_BOOKING_SEARCH",
    {
      enabled:
        isValidString(searchQuery.trim()) &&
        searchQuery.trim().length > 2 &&
        isValidObject(selectedOperator) &&
        canView,
      onSuccess: (data) => {
        setSearchResults(data.data || []);
      },
    },
    "",
    `operator=${selectedOperator?.id}&q=${searchQuery}&${bookingDateRange}`
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const { data: stats } = useQueryApi<StatsData>(
    "ADMIN_PM_REPORTS",
    {
      enabled: isValidObject(selectedOperator) && canView,
      select: (data) => data?.data,
    },
    "",
    `operator=${selectedOperator?.id}&type=1&${bookingDateRange}`
  );

  const {
    data: selectedBooking,
    refetch: refetchSelectedBooking,
    isLoading: isLoadingSelectedBooking,
    isRefetching: isRefetchingSelectedBooking,
  } = useQueryApi<GeneralObject>(
    "ADMIN_PM_BOOKINGS",
    {
      enabled: isValidString(router.query.slug?.[0]) && canView,
      select: (data) => data?.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const hideSelectedBooking = () => {
    router.push("/overview", undefined, { shallow: true });
  };

  const handleRowClick = (row: GeneralObject) => {
    router.push(`/overview/${row.code}`, undefined, { shallow: true });
  };

  const refetchAndUpdateBooking = () => {
    setTimeout(async () => {
      const { data: newSelectedBooking } = await refetchSelectedBooking();
      setData((prev) =>
        prev.map((b) =>
          b.code === selectedBooking?.code ? { ...newSelectedBooking } : b
        )
      );
      setSearchResults((prev) =>
        prev.map((b) =>
          b.code === selectedBooking?.code ? { ...newSelectedBooking } : b
        )
      );
    }, 500);
  };

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "pending_checkins",
        className: "w-fit md:w-48",
        placeholder: "Status",
        label: "Filter",
        hint: "Filter bookings by their check-in status",
        options: [
          {
            label: "All",
            value: "null",
          },
          {
            label: "Pending",
            value: "true",
          },
        ],
      },
    ],
    []
  );

  const { isLoading, reset } = useInfiniteTable({
    setter: setData,
    filterOptions: filterOptions,
    enabled: isValidObject(selectedOperator) && canView,
    queryEndpoint: "ADMIN_PM_BOOKINGS",
    customSearchQuery: `operator=${selectedOperator?.id}&${bookingDateRange}`,
    name: "arriving",
  });

  const { data: assetStatus, refetch } = useQueryApi<GeneralObject>(
    "ADMIN_PM_GUEST_PROFILE",
    {
      enabled: documentsData.length > 0 && canView,
    },
    currentDocumentPath,
    ``
  );

  useEffect(() => {
    if (isValidObject(selectedOperator)) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperator]);

  useEffect(() => {
    const handleStorageChange = () => {
      const keys = Object.keys(localStorage);
      const documentKey = keys.find((key) => key.startsWith("documents"));

      if (documentKey) {
        try {
          const data = JSON.parse(localStorage.getItem(documentKey) || "[]");
          setDocumentsData(Array.isArray(data) ? data : [data]);

          // Reset failedDocuments for new uploads
          const newFailedDocs = new Set(failedDocuments);
          data.forEach((doc: GeneralObject) => {
            if (doc.documents?.key) {
              newFailedDocs.delete(doc.documents.key);
            }
          });
          setFailedDocuments(newFailedDocs);

          // Force refetch status for new documents
          if (data.length > 0) {
            const latestDoc = data[data.length - 1];
            setCurrentDocumentPath(
              `${latestDoc.profile_code}/assets/${latestDoc.documents.key}/status/`
            );
            refetch();
          }
        } catch (error) {
          Sentry.captureException(error);
          console.error("Error parsing document data:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("documentsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("documentsUpdated", handleStorageChange);
    };
  }, [refetch, failedDocuments]);

  useEffect(() => {
    if (documentsData.length === 0 || !isValidObject(selectedOperator)) return;

    let currentDocumentIndex = 0;
    const statusCheckInterval = 8000;
    let statusCheckTimer: NodeJS.Timeout;
    const completedDocuments = new Set([...failedDocuments]);

    const scheduleNextCheck = (moveToNext = true) => {
      if (moveToNext) {
        currentDocumentIndex =
          (currentDocumentIndex + 1) % documentsData.length;
      }
      statusCheckTimer = setTimeout(checkDocumentStatus, statusCheckInterval);
    };

    const handleDocumentFailure = (document: GeneralObject) => {
      setFailedDocuments((prev) => new Set([...prev, document.documents.key]));
      completedDocuments.add(document.documents.key);
      scheduleNextCheck();
    };

    const handleDocumentValidation = (document: GeneralObject) => {
      toast.success("Document verified successfully");
      completedDocuments.add(document.documents.key);
      refetchSelectedBooking();

      // Remove the validated document from localStorage
      const documentKey = Object.keys(localStorage).find((key) =>
        key.startsWith("documents")
      );
      if (documentKey) {
        const storedDocuments = JSON.parse(
          localStorage.getItem(documentKey) || "[]"
        );
        const remainingDocuments = storedDocuments.filter(
          (doc: GeneralObject) => doc.documents?.key !== document.documents?.key
        );

        if (remainingDocuments.length === 0) {
          localStorage.removeItem(documentKey);
          setDocumentsData([]);
        } else {
          localStorage.setItem(documentKey, JSON.stringify(remainingDocuments));
          setDocumentsData(remainingDocuments);
        }
      }

      // Remove from failed documents if validated
      setFailedDocuments((prev) => {
        const updatedFailedDocs = new Set(prev);
        updatedFailedDocs.delete(document.documents.key);
        return updatedFailedDocs;
      });

      scheduleNextCheck();
    };

    const checkDocumentStatus = () => {
      // Exit if all documents have been processed
      if (completedDocuments.size >= documentsData.length) {
        clearTimeout(statusCheckTimer);
        return;
      }

      // Find the next unprocessed document
      let currentDocument: GeneralObject | undefined;
      for (let offset = 0; offset < documentsData.length; offset++) {
        const index = (currentDocumentIndex + offset) % documentsData.length;
        const document = documentsData[index];
        if (!completedDocuments.has(document.documents.key)) {
          currentDocument = document;
          currentDocumentIndex = index;
          break;
        }
      }

      // If no unprocessed document was found, exit
      if (!currentDocument) {
        clearTimeout(statusCheckTimer);
        return;
      }

      setCurrentDocumentPath(
        `${currentDocument.profile_code}/assets/${currentDocument.documents.key}/status/`
      );

      refetch()
        .then((result) => {
          const status = result?.data?.data?.status;

          if (status === "Failed") {
            handleDocumentFailure(currentDocument!);
          } else if (status === "Validated") {
            handleDocumentValidation(currentDocument!);
          } else if (status === "Processing") {
            scheduleNextCheck(false); // Keep checking the same document
          } else {
            scheduleNextCheck(); // For any other status, move to next document
          }
        })
        .catch((error) => {
          Sentry.captureException(error);
          console.log("Error checking document status:", error);
          scheduleNextCheck(); // On error, still move to next document
        });
    };

    // Start the first check immediately
    checkDocumentStatus();

    return () => {
      if (statusCheckTimer) clearTimeout(statusCheckTimer);
    };
  }, [
    documentsData,
    selectedOperator,
    refetch,
    failedDocuments,
    refetchSelectedBooking,
  ]);

  useEffect(() => {
    if (documentsData.length > 0) {
      notification.open({
        key: "document-upload-notification",
        message: (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-zui-white font-medium">
                {(() => {
                  // Count failed documents from documentsData
                  const failedCount = documentsData.length;

                  if (assetStatus?.data?.status === "Processing") {
                    return `Uploading... ${documentsData.length} ID${
                      documentsData.length !== 1 ? "s" : ""
                    }`;
                  }

                  return `${failedCount} Upload${
                    failedCount !== 1 ? "s" : ""
                  } failed`;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-zui-silver hover:text-zui-white transition-colors p-1"
                onClick={() => {
                  const keys = Object.keys(localStorage);
                  const documentKey = keys.find((key) =>
                    key.startsWith("documents")
                  );
                  if (documentKey) {
                    localStorage.removeItem(documentKey);
                  }
                  setDocumentsData([]);
                  notification.destroy("document-upload-notification");
                }}
              >
                <Icon name="Cross" size="16" fill="#ffffff" />
              </button>
              <button
                className="text-zui-silver hover:text-zui-white transition-colors p-1"
                onClick={() => setIsNotificationExpanded((prev) => !prev)}
              >
                <Icon
                  name={isNotificationExpanded ? "AngleUp" : "AngleDown"}
                  size="16"
                  fill="#ffffff"
                />
              </button>
            </div>
          </div>
        ),
        description: (
          <div
            className={`transition-all duration-300 ${
              isNotificationExpanded ? "max-h-[500px]" : "max-h-0"
            } overflow-hidden -mx-6`}
          >
            {documentsData.map((doc, index) => (
              <div
                key={doc.booking_code}
                className={`
                  py-3 px-6 my-2
                  border-t border-zui-dark
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-zui-white font-medium">
                      {doc.full_name}
                    </div>
                    {doc.documents?.key === assetStatus?.data?.key ? (
                      <div className="text-sm text-zui-silver/60">
                        {assetStatus?.data?.status === "Failed"
                          ? "Failed to read ID"
                          : assetStatus?.data?.status === "Processing"
                          ? "Analyzing..."
                          : "Blurry photo"}
                      </div>
                    ) : (
                      <div className="text-sm text-zui-silver/60">
                        Failed to read ID
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.documents?.key === assetStatus?.data?.key &&
                    assetStatus?.data?.status === "Processing" ? (
                      <div className="px-4 py-1.5 text-zui-silver text-sm">
                        <div className="animate-spin h-4 w-4 border-2 border-zui-silver border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <button
                        className="px-4 py-1.5 bg-transparent text-zui-red border border-zui-red/30 rounded hover:bg-zui-red/10 transition-colors text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/overview/${doc.booking_code}`,
                            undefined,
                            {
                              shallow: true,
                            }
                          );
                        }}
                      >
                        Reupload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
        duration: 0,
        placement: "bottomLeft",
        className: "custom-notification",
      });
    }

    return () => {
      notification.destroy("document-upload-notification");
    };
  }, [
    documentsData,
    isNotificationExpanded,
    router,
    assetStatus?.data?.key,
    assetStatus?.data?.status,
  ]);

  const showQR = (operatorCode: string, bookingCode?: string) => {
    setSelectedQRBooking({ operatorCode, bookingCode });
  };

  const showManualCheckin = (
    booking: GeneralObject,
    checkin?: GeneralObject
  ) => {
    setManualCheckinObject({ booking, checkin });
  };

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        title: "Guest Name",
        dataIndex: "first_name",
        key: "first_name",
        render: (_, data) => {
          if (data) {
            if (data.guests.length > 0) {
              const totalOccupancy = data.rooms?.reduce(
                (total: number, room: GeneralObject) =>
                  total + room.occupancy * room.units,
                0
              );
              return (
                <div className="flex flex-col w-40 gap-1">
                  <span className="whitespace-normal text-zui-white font-semibold">
                    {data.guests?.[0].first_name}{" "}
                    {data.guests?.[0].last_name || ""}
                  </span>
                  {totalOccupancy > 1 && (
                    <span className="text-sm italic text-zui-white">
                      +{totalOccupancy - 1}{" "}
                      {totalOccupancy - 1 > 1 ? "Guests" : "Guest"}
                    </span>
                  )}
                </div>
              );
            }
          }
          return <span>-</span>;
        },
      },
      {
        title: "Booking Details",
        dataIndex: "inventory_name",
        key: "inventory_name",
        render: (_, data) => {
          const rooms = data?.rooms.map((room: GeneralObject) => ({
            name: room.name,
            units: room.units,
          }));
          return (
            <div className="flex flex-col gap-1 w-56">
              <span className="whitespace-normal font-bold flex-1">
                {rooms
                  .map((r: GeneralObject) =>
                    r.units > 1 || rooms.length > 1
                      ? `${r.name} x ${r.units}`
                      : r.name
                  )
                  .join(", ")}
              </span>
              <span className="text-sm text-zui-white">
                {data?.code}
                {isValidString(data?.meta_details?.ezee_id)
                  ? ` / ${data?.meta_details.ezee_id}`
                  : ""}
              </span>
              {isValidObject(data?.source) && (
                <span className="text-sm text-zui-silver">
                  {data?.source.name}
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Check-in → Check-out",
        dataIndex: "checkins",
        key: "checkins",
        render: (_, data) => (
          <div className="w-36 flex items-center gap-2">
            <span>{moment(data?.start_date).format("DD MMM")}</span>
            <span>→</span>
            <span>{moment(data?.end_date).format("DD MMM")}</span>
          </div>
        ),
      },
      {
        title: "Web Check-in",
        dataIndex: "web_status",
        key: "web_status",
        render: (_, data: GeneralObject) => {
          const { totalOccupancy, approvedCheckinsCount } =
            getBookingWebCheckedInInfo(data || {});

          const relevantDocs = documentsData.filter(
            (doc) => doc.booking_code === data.code
          );
          const failedDocsCount = relevantDocs.filter(
            (doc) =>
              doc.documents?.key && failedDocuments.has(doc.documents.key)
          ).length;

          if (failedDocsCount > 0) {
            return (
              <Tooltip title="Document verification failed. Please reupload">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col">
                    <div className="text-zui-red">
                      {failedDocsCount}{" "}
                      {failedDocsCount === 1 ? "guest" : "guests"}
                    </div>
                    <div className="text-sm text-zui-silver/60">
                      Failed to read ID
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          }

          return totalOccupancy > 1 ? (
            <div className="flex items-center">
              <Tooltip
                title={
                  totalOccupancy - approvedCheckinsCount > 0
                    ? `${totalOccupancy - approvedCheckinsCount} ${
                        totalOccupancy - approvedCheckinsCount === 1
                          ? "guest is"
                          : "guests are"
                      } yet to finish their web check-in`
                    : "All guests have finished their web check-in"
                }
              >
                <div className="flex items-center gap-1">
                  {totalOccupancy - approvedCheckinsCount > 0 && (
                    <>
                      <span>{totalOccupancy - approvedCheckinsCount}</span>
                      <Icon name="Clock" size="16" fill="rgb(255,158,76)" />
                    </>
                  )}
                  {approvedCheckinsCount > 0 && (
                    <>
                      <span className="ml-2">{approvedCheckinsCount}</span>
                      <Icon name="Check" size="16" fill="#66DF48" />
                    </>
                  )}
                </div>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center">
              <Tooltip
                title={
                  approvedCheckinsCount === 1
                    ? "Guest has finished web check-in"
                    : "Web check-in is pending"
                }
              >
                <div className="flex items-center">
                  {approvedCheckinsCount === 1 ? (
                    <Icon name="Check" size="16" fill={"#66DF48"} />
                  ) : (
                    <Icon name={"Clock"} size="16" fill={"rgb(255,158,76)"} />
                  )}
                </div>
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: "Check-in at Property",
        dataIndex: "status",
        key: "status",
        render: (_, data: GeneralObject) => {
          const { hasPropertyCheckedin } =
            getBookingPropertyCheckedInInfo(data);
          const hasError = data?.checkins?.some(
            (checkin: GeneralObject) => checkin.status === 4
          );
          const ezeeErrors = data?.checkins
            ?.filter(
              (checkin: GeneralObject) =>
                checkin.status === 4 && Array.isArray(checkin.data.ezee_error)
            )
            .map((checkin: GeneralObject) =>
              checkin.data.ezee_error
                .map((error: GeneralObject) => error.ErrorMessage)
                .join(" ")
            );

          return (
            <div className="flex items-center">
              <Tooltip
                title={
                  hasError
                    ? ezeeErrors
                    : hasPropertyCheckedin
                    ? "All guests have checked in"
                    : "All guests are yet to check into the property"
                }
              >
                <div className="flex items-center">
                  {hasError ? (
                    <Icon name="Warning" size="16" className="text-zui-red" />
                  ) : hasPropertyCheckedin ? (
                    <Icon name="Check" size="16" fill={"#66DF48"} />
                  ) : (
                    <Icon name={"Clock"} size="16" fill={"rgb(255,158,76)"} />
                  )}
                </div>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [documentsData, failedDocuments]
  );

  const handleRowClassName = useCallback((row: GeneralObject) => {
    const { totalOccupancy, approvedCheckinsCount } =
      getBookingWebCheckedInInfo(row);

    const { approvedPropertyCheckinsCount } =
      getBookingPropertyCheckedInInfo(row);

    const hasCheckedIn =
      row?.checkins.length > 0 &&
      row?.checkins?.every((checkin: GeneralObject) => checkin.status === 1);

    return hasCheckedIn &&
      totalOccupancy === approvedCheckinsCount &&
      totalOccupancy === approvedPropertyCheckinsCount
      ? "bg-zui-green/5"
      : "";
  }, []);

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page>
      <PageHeader title={`Today - ${moment().format("dddd, MMM D")}`} />
      <PageContent>
        <div className="flex justify-between space-x-6 -mt-5 mb-6">
          <span>
            <strong>
              {stats?.bookings.completed_checkin || 0}/
              {stats?.bookings.total || 0}
            </strong>{" "}
            guests have checked in
          </span>
        </div>

        <div className="flex justify-between space-x-6 mb-6 border-t border-zui-light pt-6">
          {filterOptions && (
            <ZudFilterOptions
              name="arriving"
              options={filterOptions}
              className="mb-0"
            />
          )}
          <div className="flex space-x-4">
            <CollapsibleSearch
              value={searchQuery}
              isExpanded
              onChange={setSearchQuery}
            />
          </div>
        </div>
        <ZudTable
          data={
            searchQuery.trim().length > 2 ? searchResults || [] : data || []
          }
          isLoading={isLoading || isSearching}
          columns={columns}
          keyExtractor={(row) => row.code}
          onRowClick={handleRowClick}
          rowClassName={handleRowClassName}
        />
      </PageContent>
      <BookingInfoSidebar
        isOpen={isValidString(router.query.slug?.[0])}
        onClose={hideSelectedBooking}
        isLoadingBooking={isLoadingSelectedBooking}
        refetchBooking={refetchAndUpdateBooking}
        booking={selectedBooking || {}}
        isRefetchingBooking={isRefetchingSelectedBooking}
        showQR={showQR}
        showCheckinFetcher={setCheckinFetcher}
        showExistingGuests={setExistingGuestCheckin}
        showManualCheckin={showManualCheckin}
      />
      <CheckinQRSidebar
        isOpen={isValidString(selectedQRBooking.operatorCode)}
        onClose={setSelectedQRBooking.bind(null, { operatorCode: "" })}
        {...selectedQRBooking}
      />
      <CheckinFetchSidebar
        isOpen={isValidObject(checkinFetcher)}
        onClose={setCheckinFetcher.bind(null, {})}
        booking={checkinFetcher}
        onSuccessfulCheckin={refetchAndUpdateBooking}
        checkinDateRange={checkinDateRange}
      />
      <ExistingGuestFetchSidebar
        isOpen={isValidObject(existingGuestCheckin)}
        onClose={setExistingGuestCheckin.bind(null, {})}
        booking={existingGuestCheckin}
        onSuccessfulCheckin={refetchAndUpdateBooking}
        existingCheckinDateRange={existingCheckinDateRange}
      />
      <ManualCheckinSidebar
        isOpen={isValidObject(manualCheckinObject.booking)}
        refetchBooking={refetchAndUpdateBooking}
        onClose={setManualCheckinObject.bind(null, {
          booking: {},
        })}
        {...manualCheckinObject}
      />
    </Page>
  );
};

export default Overview;
