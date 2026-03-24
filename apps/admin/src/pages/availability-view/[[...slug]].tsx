import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import { useQueriesApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { isValidString, isValidUUID } from "@zo/utils/string";
import { Button, DatePicker, Select, Spin } from "antd";
import dayjs from "dayjs";
import moment, { Moment } from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookingCell,
  BookingContextMenu,
  LockingCell,
} from "../../components/helpers/availability-view";
import {
  AddBookingSidebar,
  AddLockingSidebar,
  BookingInfoSidebar,
} from "../../components/sidebars";
import { Page, PageContent, PageHeader } from "../../components/ui2";
import { Locking } from "../../config";

const today = moment();
const fixedColumnWidth = 144;
const variableColumnWidth = 96;
const contextMenuWidth = 224;
const contextMenuHeight = 160;

const sampleBooking = {
  id: "f11dcfd2-ce4a-4ed9-b366-9a2cef788a63",
  pid: "35996QR4",
  user: {
    id: "b48210a2-3cdd-494d-83fa-bf61daf465d0",
    pid: "JFM9PH8X",
    first_name: "",
    last_name: "",
    email_address: "Kay.kartikeysharma@gmail.com",
    wallet_address: "0xAb597368C8B379EDf28E73338C48564DdAE85560",
    mobile_number: "",
    nickname: "Kartikeygraffiti.zo",
    membership: "none",
    pfp_image: "",
    twitter_handle: "",
    cultures: [],
    avatar: {
      ref_id: 105051,
      image:
        "https://proxy.cdn.zo.xyz/citizenship/images/eae5d528-0b53-4ecc-9595-d521344f53f6.svg",
      metadata:
        "https://api.io.zo.xyz/api/v1/profile/citizen/eae5d528-0b53-4ecc-9595-d521344f53f6/metadata/",
    },
  },
  status: "confirmed",
  booked_skus: [
    {
      id: 8439,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-06-01",
    },
    {
      id: 8438,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-06-01",
    },
    {
      id: 8437,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-31",
    },
    {
      id: 8436,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-31",
    },
    {
      id: 8435,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-30",
    },
    {
      id: 8434,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-30",
    },
    {
      id: 8433,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-29",
    },
    {
      id: 8432,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-29",
    },
    {
      id: 8431,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-28",
    },
    {
      id: 8430,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-28",
    },
    {
      id: 8429,
      sku: {
        id: "d98992db-ca47-44fe-b421-6f94a93563dc",
        pid: "ST-MP5Q8HX5-0001",
        name: "Punk 1",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-27",
    },
    {
      id: 8428,
      sku: {
        id: "7f8b2ad9-ba6c-4e29-ba71-93effe3a08b6",
        pid: "ST-MP5Q8HX5-0002",
        name: "Punk 2",
        inventory: {
          id: "80d671ba-a1bd-4af7-b46f-e218b5fb93b3",
          pid: "ST-MP5Q8HX5",
          name: "Punk Rooms",
          category: "room",
          type: "stay",
        },
      },
      status: "confirmed",
      date: "2025-05-27",
    },
  ],
  currency: {
    code: "USD",
    id: "USD",
    created_at: "2024-04-11T11:22:26.282130Z",
    updated_at: "2024-04-11T11:22:26.282157Z",
    name: "United States Dollar",
    decimals: 8,
    symbol: "$",
  },
  total_amount: 72000000000,
  final_amount: 72000000000,
  paid_amount: 0,
  due_amount: 72000000000,
  start_at: "2025-05-27T19:00:00Z",
  end_at: "2025-06-02T19:00:00Z",
  customers: [],
  created_at: "2025-05-20T15:48:12.116470Z",
  updated_at: "2025-05-20T15:48:12.708485Z",
};

export type LockingWithColumnIndex = Locking & {
  columnIndex: number;
  columnSpan: number;
  isOlder: boolean;
  isLaterEnding?: boolean;
  isContinuing?: boolean;
  id: number;
};

const AvailabilityViewPage: NextPage = () => {
  const router = useRouter();

  const [numColumns, setNumColumns] = useState<number>(0);
  const [tableHeight, setTableHeight] = useState<number>(0);
  const [extraWidth, setExtraWidth] = useState<number>(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isDatePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [contextMenuData, setContextMenuData] = useState<{
    x: number;
    y: number;
    verticalPosition: "top" | "bottom";
    horizontalPosition: "left" | "right";
    inventory: GeneralObject;
    skuId: string;
    hasBooking: boolean;
    date: Moment;
  } | null>(null);

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [operator_id] = slug;

      return {
        operator_id: operator_id || null,
        type: isValidString(router.query.booking_id)
          ? "booking"
          : isValidString(router.query.locking_id)
          ? "locking"
          : null,
        type_id: router.query.booking_id || router.query.locking_id || null,
        date: String(router.query.date) || null,
      };
    }
    return {
      operator_id: null,
      type: null,
      type_id: null,
      date: moment().format("YYYY-MM-DD"),
    };
  }, [router.query]);

  const { data: operators } = useQueryApi<{ value: string; label: string }[]>(
    "CAS_OPERATORS",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      select: (data) =>
        data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        })),
    },
    "",
    "ordering=-created_at&limit=-1"
  );

  const {
    data: allInventories,
    isSuccess: areInventoryIdsLoaded,
    isLoading: isLoadingInventoryIds,
  } = useQueryApi<string[]>(
    "CAS_INVENTORY",
    {
      enabled: params.operator_id != null,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      select: (data) => data.data.map((item: any) => item.id),
    },
    "",
    `operator=${params.operator_id}&type=stay&limit=-1`
  );

  const inventoryQueries = useMemo(
    () =>
      areInventoryIdsLoaded
        ? (allInventories || [])?.map((inventory: string): [string, string] => [
            `${inventory}/`,
            "",
          ]) || []
        : [],
    [allInventories]
  );

  const allInventoryDetail = useQueriesApi(
    "CAS_INVENTORY",
    {
      enabled: inventoryQueries.length > 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
    },
    inventoryQueries
  );

  const dates = useMemo(
    () =>
      Array.from({ length: numColumns }).map((_, index) =>
        moment(params.date).add(index - 1, "days")
      ),
    [numColumns, params.date]
  );

  const isLoadingPropertyData = useMemo(
    () => isLoadingInventoryIds && allInventoryDetail.map((x) => x.isLoading),
    [isLoadingInventoryIds, allInventoryDetail]
  );

  const inventories = useMemo(() => {
    if (
      allInventoryDetail?.length > 0 &&
      allInventoryDetail.every((c) => c.isSuccess)
    ) {
      const allSku = allInventoryDetail.map((inventoryResponse) => ({
        id: inventoryResponse.data?.data.id,
        name: inventoryResponse.data?.data.name,
        skus: (inventoryResponse.data?.data.skus || []).map((sku: any) => ({
          id: sku.id,
          name: sku.name,
        })),
      }));
      return allSku;
    } else {
      return [];
    }
  }, [allInventoryDetail]);

  const allSkus = useMemo(() => {
    if (
      allInventoryDetail?.length > 0 &&
      allInventoryDetail.every((c) => c.isSuccess)
    ) {
      const allSku = allInventoryDetail.map((inventoryResponse) => ({
        skus: (inventoryResponse.data?.data.skus || []).map((sku: any) => ({
          id: sku.id,
          name: sku.name,
          pid: sku.pid,
        })),
      }));
      return allSku.flatMap((sku) => sku.skus);
    } else {
      return [];
    }
  }, [allInventoryDetail]);

  const { data: allLockings, refetch: refetchLockings } = useQueryApi<
    LockingWithColumnIndex[]
  >(
    "CAS_LOCKING",
    {
      enabled: isValidUUID(params.operator_id),
      select(data) {
        const _lockings = data.data.results.filter(
          (lockin: Locking) =>
            lockin.date &&
            moment(lockin.date).isValid() &&
            moment(lockin.date).isBetween(
              dates[0],
              dates[dates.length - 1],
              "day",
              "[]"
            )
        );

        // Sort lockings by date, sku, reason and note to ensure proper grouping
        _lockings.sort((a: any, b: any) => {
          if (a.sku !== b.sku) return a.sku.localeCompare(b.sku);
          if (a.reason !== b.reason) return a.reason.localeCompare(b.reason);
          if (a.note !== b.note)
            return (a.note || "").localeCompare(b.note || "");
          if (a.units !== b.units) return a.units - b.units;
          return moment(a.date).diff(moment(b.date));
        });

        // Group continuous lockings with same properties
        const groupedLockings: any[] = [];

        for (let i = 0; i < _lockings.length; i++) {
          const currentLocking = _lockings[i];

          // Try to add to an existing group
          let addedToExisting = false;

          for (let j = 0; j < groupedLockings.length; j++) {
            const group = groupedLockings[j];

            const isContinuous =
              moment(currentLocking.date).diff(
                moment(group.endDate),
                "days"
              ) === 1;
            const hasSameProperties =
              currentLocking.sku === group.sku &&
              currentLocking.reason === group.reason &&
              currentLocking.note === group.note &&
              currentLocking.units === group.units;

            if (isContinuous && hasSameProperties) {
              group.endDate = currentLocking.date;
              addedToExisting = true;
              break;
            }
          }

          // If couldn't add to existing group, create new group
          if (!addedToExisting) {
            groupedLockings.push({
              ...currentLocking,
              startDate: currentLocking.date,
              endDate: currentLocking.date,
            });
          }
        }

        return groupedLockings.map((lockin: any) => {
          const columnIndex = moment(
            lockin.startDate,
            "YYYY-MM-DD"
          ).isSameOrAfter(moment(dates[0]).format("YYYY-MM-DD"), "date")
            ? dates.findIndex((date) =>
                moment(lockin.startDate).isSame(date, "date")
              )
            : 5;

          const isOlder = moment(lockin.startDate).isBefore(dates[0], "date");
          const columnSpan =
            moment(lockin.endDate).diff(moment(lockin.startDate), "days") + 1;
          const isLaterEnding = moment(lockin.endDate).isAfter(
            dates[dates.length - 1],
            "date"
          );

          return {
            ...lockin,
            columnIndex,
            columnSpan,
            isOlder,
            isLaterEnding,
            date: lockin.startDate, // Use startDate as the reference date
          };
        });
      },
    },
    "",
    `sku__inventory__operator=${
      params.operator_id
    }&date__gte=${dates[0]?.format("YYYY-MM-DD")}&date__lte=${dates[
      dates.length - 1
    ]?.format("YYYY-MM-DD")}   `
  );

  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isFetching: isFetchingBookings,
    refetch: refetchBookings,
  } = useQueryApi<GeneralObject[]>(
    "CAS_STAY_BOOKINGS",
    {
      enabled: inventories.length > 0 && dates.length > 0,
      select: (data) => {
        const _bookings = data.data.filter(
          (f: GeneralObject) =>
            f.status !== "pending" &&
            f.status !== "cancelled" &&
            f.status !== "requested"
        );
        const _skuBookings: GeneralObject[] = [];
        _bookings.forEach((booking: any) => {
          const days = moment(booking.end_at).diff(
            moment(booking.start_at),
            "days"
          );

          if (!booking.booked_skus || booking.booked_skus.length === 0) {
            // No SKUs to process for this booking
            return;
          }

          const uniqueSkuIdsInBooking = new Set(
            booking.booked_skus.map((bs: any) => bs.sku.id)
          );

          // A booking is considered "simple" if it has exactly one type of SKU
          // and the number of booked_sku entries matches the number of days in the booking.
          if (
            uniqueSkuIdsInBooking.size === 1 &&
            days === booking.booked_skus.length
          ) {
            _skuBookings.push(booking);
          } else {
            // Complex booking: multiple SKUs, or multiple SKUs per day, or other irregularities.
            // Group booked_skus by SKU ID.
            const skusGroupedById = booking.booked_skus.reduce(
              (acc: GeneralObject, dailySkuEntry: any) => {
                const skuId = dailySkuEntry.sku.id;
                if (!acc[skuId]) {
                  acc[skuId] = [];
                }
                acc[skuId].push(dailySkuEntry);
                return acc;
              },
              {}
            );

            for (const skuId in skusGroupedById) {
              if (
                Object.prototype.hasOwnProperty.call(skusGroupedById, skuId)
              ) {
                const dailyEntriesForThisSku = skusGroupedById[skuId];
                // Sort these daily entries by date
                dailyEntriesForThisSku.sort((a: any, b: any) =>
                  moment(a.date).diff(moment(b.date))
                );

                if (dailyEntriesForThisSku.length === 0) continue;

                let segmentStartDateMoment = moment(
                  dailyEntriesForThisSku[0].date
                );
                let lastDateInSegmentMoment = moment(
                  dailyEntriesForThisSku[0].date
                );

                for (let i = 1; i < dailyEntriesForThisSku.length; i++) {
                  const currentEntryDateMoment = moment(
                    dailyEntriesForThisSku[i].date
                  );
                  if (
                    currentEntryDateMoment.diff(
                      lastDateInSegmentMoment,
                      "days"
                    ) === 1
                  ) {
                    // This day is consecutive to the last one in the current segment for this SKU
                    lastDateInSegmentMoment = currentEntryDateMoment;
                  } else {
                    // Discontinuity found, or end of list for this SKU's continuous block.
                    // Finalize and push the previous segment.
                    _skuBookings.push({
                      ...booking, // Spread original booking properties
                      id: `${booking.id}-sku-${skuId}-segment-${_skuBookings.length}`, // More specific unique ID
                      start_at: segmentStartDateMoment.format("YYYY-MM-DD"),
                      end_at: lastDateInSegmentMoment
                        .add(1, "day")
                        .format("YYYY-MM-DD"), // end_at is exclusive
                      booked_skus: [
                        {
                          sku: { id: skuId },
                          date: segmentStartDateMoment.format("YYYY-MM-DD"),
                        },
                      ], // Representative for rendering
                      original_booking_id: booking.id, // Keep a reference if needed
                    });
                    // Start a new segment for this SKU
                    segmentStartDateMoment = currentEntryDateMoment;
                    lastDateInSegmentMoment = currentEntryDateMoment;
                  }
                }
                // Add the last processed segment for this SKU
                _skuBookings.push({
                  ...booking,
                  id: `${booking.id}-sku-${skuId}-segment-${_skuBookings.length}`,
                  start_at: segmentStartDateMoment.format("YYYY-MM-DD"),
                  end_at: lastDateInSegmentMoment
                    .add(1, "day")
                    .format("YYYY-MM-DD"),
                  booked_skus: [
                    {
                      sku: { id: skuId },
                      date: segmentStartDateMoment.format("YYYY-MM-DD"),
                    },
                  ],
                  original_booking_id: booking.id,
                });
              }
            }
          }
        });

        return _skuBookings.map((bookingToMap: any) => {
          const columnIndex = moment(bookingToMap.start_at).isSameOrAfter(
            dates[0],
            "date"
          )
            ? dates.findIndex((date) =>
                moment(bookingToMap.start_at).isSame(date, "date")
              )
            : 0;

          const endColumnIndex = moment(bookingToMap.end_at).isSameOrBefore(
            dates[dates.length - 1],
            "date"
          )
            ? dates.findIndex((date) =>
                moment(bookingToMap.end_at).isSame(date, "date")
              )
            : dates.length - 1;

          const columnSpan = endColumnIndex - columnIndex + 1; // +1 to ensure it spans the correct number of columns

          const isOlder = moment(bookingToMap.start_at).isBefore(
            dates[0],
            "date"
          );
          const isLaterEnding = moment(bookingToMap.end_at).isAfter(
            dates[dates.length - 1],
            "date"
          );

          return {
            ...bookingToMap,
            columnIndex,
            columnSpan: isOlder ? columnSpan : columnSpan - 1,
            isOlder,
            isLaterEnding,
          };
        });
      },
    },
    "",
    `operator=${params.operator_id}&start_at__lte=${dates[
      dates.length - 1
    ]?.format("YYYY-MM-DD")}&end_at__gte=${dates[0]?.format(
      "YYYY-MM-DD"
    )}&limit=-1`
  );

  const {
    data: selectedBooking,
    isLoading: isLoadingSelectedBooking,
    refetch: refetchSelectedBooking,
  } = useQueryApi<GeneralObject>(
    "CAS_STAY_BOOKINGS",
    {
      enabled:
        params.type === "booking" &&
        isValidString(params.type_id) &&
        params.type_id !== "new",
      select: (data) => data?.data,
      refetchOnWindowFocus: false,
    },
    `${params.type_id}/`
  );

  const totalSkus: number = useMemo(() => {
    return inventories.reduce((acc, inventory) => {
      return acc + inventory.skus.length;
    }, 0);
  }, [inventories]);

  const resetRange = () => {
    const { slug, ...restQuery } = router.query;
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          ...restQuery,
          date: moment().format("YYYY-MM-DD"),
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  const handleContextMenu = (
    inventory: GeneralObject,
    skuId: string,
    date: Moment,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    let verticalPosition: "top" | "bottom" = "top";
    let horizontalPosition: "left" | "right" = "left";
    let hasBooking: boolean = false;
    if (clientX + contextMenuWidth > window.innerWidth) {
      horizontalPosition = "right";
    } else {
      horizontalPosition = "left";
    }
    if (clientY + contextMenuHeight > window.innerHeight) {
      verticalPosition = "bottom";
    } else {
      verticalPosition = "top";
    }
    if (
      bookings?.find(
        (b) =>
          b.booked_skus[0].sku.id === skuId &&
          moment(date).isBetween(
            moment(b.start_at),
            moment(b.end_at),
            "day",
            "[)"
          )
      )
    ) {
      hasBooking = true;
    }
    setContextMenuData({
      x: clientX,
      y: clientY,
      verticalPosition,
      horizontalPosition,
      hasBooking,
      skuId,
      inventory,
      date,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    const { slug, ...restQuery } = router.query;
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          ...restQuery,
          date: dayjs(date).format("YYYY-MM-DD"),
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
    setDatePickerOpen(false);
  };

  const dayWiseTotalGuestsAndOccupancy = useMemo(() => {
    if (!bookings || !totalSkus || !dates) {
      return [];
    }

    return dates.map((date) => {
      const totalGuests = bookings.reduce((acc, booking) => {
        const bookingStartDate = moment(booking.start_at);
        const bookingEndDate = moment(booking.end_at);

        // Check if the current date falls within the stay period, excluding the checkout day
        if (
          bookingStartDate.isSameOrBefore(date, "day") &&
          bookingEndDate.isAfter(date, "day")
        ) {
          return acc + (booking.user ? 1 : 0);
        }

        return acc;
      }, 0);

      const occupancy = Math.round((totalGuests / totalSkus) * 100);

      return {
        totalGuests,
        occupancy,
      };
    });
  }, [bookings, totalSkus, dates]);

  const incrementOffset = () => {
    const { slug, ...restQuery } = router.query;
    router.push({
      pathname: `/availability-view/${params.operator_id}/`,
      query: {
        ...restQuery,
        date: moment(params.date).add(numColumns, "days").format("YYYY-MM-DD"),
      },
    });
  };

  const incrementSingleOffset = () => {
    const { slug, ...restQuery } = router.query;
    router.push({
      pathname: `/availability-view/${params.operator_id}/`,
      query: {
        ...restQuery,
        date: moment(params.date).add(1, "days").format("YYYY-MM-DD"),
      },
    });
  };

  const decrementOffset = () => {
    const { slug, ...restQuery } = router.query;
    router.push({
      pathname: `/availability-view/${params.operator_id}/`,
      query: {
        ...restQuery,
        date: moment(params.date)
          .subtract(numColumns, "days")
          .format("YYYY-MM-DD"),
      },
    });
  };

  const decrementSingleOffset = () => {
    const { slug, ...restQuery } = router.query;
    router.push({
      pathname: `/availability-view/${params.operator_id}/`,
      query: {
        ...restQuery,
        date: moment(params.date).subtract(1, "days").format("YYYY-MM-DD"),
      },
    });
  };

  const hideSelectedBooking = () => {
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          date: params.date,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const showSelectedBooking = (id: string) => {
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          date: params.date,
          booking_id: id,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const showSelectedLockin = (id: string) => {
    refetchLockings();
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          date: params.date,
          locking_id: id,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const createNewBooking = () => {
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          date: params.date,
          booking_id: "new",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const createNewLocking = () => {
    router.push(
      {
        pathname: `/availability-view/${params.operator_id}/`,
        query: {
          date: params.date,
          locking_id: "new",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleOperatorChange = (value: string) => {
    router.push(
      {
        pathname: `/availability-view/${value}/`,
        query: {
          date: moment().format("YYYY-MM-DD"),
        },
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  useEffect(() => {
    const calculateColumns = () => {
      if (tableRef.current) {
        const tableWidth = tableRef.current.offsetWidth;

        const availableWidth = tableWidth - fixedColumnWidth;
        const columns = Math.floor(availableWidth / variableColumnWidth);
        setNumColumns(columns);
        setExtraWidth(
          tableWidth - columns * variableColumnWidth - fixedColumnWidth
        );
      }
    };

    const calculateHeight = () => {
      if (tableRef.current) {
        const tableHeight = tableRef.current.offsetHeight;
        const fixedHeaderHeight = 56;
        setTableHeight(tableHeight - fixedHeaderHeight);
      }
    };

    calculateHeight();
    const resizeObserver = new ResizeObserver(() => {
      calculateColumns();
    });
    window.addEventListener("resize", calculateHeight);

    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      window.removeEventListener("resize", calculateHeight);
      if (tableRef.current) {
        resizeObserver.unobserve(tableRef.current);
      }
    };
  }, []);

  return (
    <Page>
      <PageHeader
        title="Availability View"
        breadcrumbs={[
          {
            id: "1",
            name: "Availability View",
            url: "/",
          },
        ]}
        rightOptions={
          <div className="">
            <Select
              value={params.operator_id || undefined}
              onChange={handleOperatorChange}
              options={operators || []}
              placeholder="Select Operator"
              size="large"
              className="w-48"
            />
          </div>
        }
      />
      <PageContent className="pt-4">
        <div ref={tableRef} className="flex flex-col h-full gap-y-6 w-full">
          {!isLoadingPropertyData ? (
            inventories.length > 0 ? (
              <table className="flex flex-col text-xs flex-1 border-collapse table-fixed">
                <tbody>
                  <tr className="border border-zui-light bg-zui-lighter border-collapse">
                    <td className="p-0">
                      <div className="h-12 flex items-center justify-between gap-6 px-6">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4">
                            <button onClick={decrementOffset}>
                              <KeyboardDoubleArrowLeft
                                sx={{ color: "#FFF", fontSize: 20 }}
                              />
                            </button>
                            <button onClick={decrementSingleOffset}>
                              <KeyboardArrowLeft
                                sx={{ color: "#FFF", fontSize: 20 }}
                              />
                            </button>
                            <button onClick={incrementSingleOffset}>
                              <KeyboardArrowRight
                                sx={{ color: "#FFF", fontSize: 20 }}
                              />
                            </button>
                            <button onClick={incrementOffset}>
                              <KeyboardDoubleArrowRight
                                sx={{ color: "#FFF", fontSize: 20 }}
                              />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {(isLoadingBookings || isFetchingBookings) && (
                            <Spin spinning />
                          )}
                          <DatePicker
                            // @ts-ignore
                            value={params.date ? dayjs(params.date) : dayjs()}
                            allowClear={false}
                            onChange={handleDateChange}
                          />

                          {!moment(params.date).isSame(moment(), "date") && (
                            <Button type="link" onClick={resetRange}>
                              <span className="font-semibold text-zui-neon">
                                Reset
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border border-zui-light">
                    <td className="p-0">
                      <div
                        className="overflow-y-auto h-auto overflow-x-hidden hide-scrollbar"
                        style={{ maxHeight: tableHeight }}
                      >
                        <table className="w-full h-full bg-zui-lighter border-collapse table-fixed">
                          <tbody>
                            <tr>
                              <td
                                className="p-0"
                                style={{
                                  width: fixedColumnWidth + extraWidth,
                                }}
                              >
                                <table className="w-full h-full border-collapse table-fixed">
                                  <thead>
                                    <tr className="h-12 border border-l-0 border-t-0 border-b-0 border-zui-light">
                                      <th className="w-full sticky top-0 bg-zui-lighter">
                                        <div className="border-b h-12 relative top-0 border-zui-light" />
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inventories.length > 0 ? (
                                      inventories.map((inventory, index) =>
                                        inventory.skus.length <= 1 ? (
                                          <tr
                                            key={inventory.id}
                                            className={cn(
                                              "h-14 border border-zui-light border-l-0",
                                              index === 0 && "border-t-0",
                                              index ===
                                                inventories.length - 1 &&
                                                "border-b-0"
                                            )}
                                          >
                                            <td className="px-6">
                                              {inventory.name}
                                            </td>
                                          </tr>
                                        ) : (
                                          <tr
                                            key={inventory.id}
                                            className={cn(
                                              "border border-zui-light border-l-0",
                                              index === 0 && "border-t-0",
                                              index ===
                                                inventories.length - 1 &&
                                                "border-b-0"
                                            )}
                                          >
                                            <td className="px-6 align-middle">
                                              <div className="flex flex-col mb-1 pt-4">
                                                {inventory.name}
                                              </div>
                                              {inventory.skus.map(
                                                (sku: any) => (
                                                  <div
                                                    key={sku.id}
                                                    className="flex flex-col h-14 items-start justify-center text-zui-silver"
                                                  >
                                                    <span className="font-normal">
                                                      {sku.name}
                                                    </span>
                                                  </div>
                                                )
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      )
                                    ) : (
                                      <></>
                                    )}
                                    {inventories.length > 0 && (
                                      <tr className="h-12 border-t-0 p-0 border border-l-0 border-b-0 border-zui-light">
                                        <th className="w-full sticky bottom-0 bg-zui-lighter">
                                          <div className="h-12 relative border-t border-zui-light top-0 flex items-center justify-center flex-col text-zui-silver px-4">
                                            <span className="font-normal">
                                              Total Guests
                                            </span>
                                            <span className="font-normal">
                                              Occupancy
                                            </span>
                                          </div>
                                        </th>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </td>
                              <td className="p-0">
                                <table className="h-full border-collapse w-full table-fixed">
                                  <thead>
                                    <tr className="h-12 border relative z-[5] border-l-0 border-t-0 border-b-0 border-zui-light">
                                      {dates.map((date, index) => (
                                        <th
                                          className={cn(
                                            "h-12 w-24 p-0 sticky top-0 bg-zui-lighter border-dashed border-zui-light border-r",
                                            index === dates.length - 1 &&
                                              "border-r-0"
                                          )}
                                          key={index}
                                        >
                                          <div
                                            className={cn(
                                              "flex flex-col items-center justify-center w-full border-b border-zui-light h-12",
                                              date.isSame(today, "date")
                                                ? "text-zui-white"
                                                : "text-zui-silver"
                                            )}
                                          >
                                            <span className="font-normal">
                                              {date.format("ddd")}
                                            </span>
                                            <span className="font-normal">
                                              {date.format("DD MMM")}
                                            </span>
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody
                                    className={cn(
                                      isLoadingBookings || isFetchingBookings
                                        ? "opacity-5"
                                        : "opacity-100"
                                    )}
                                  >
                                    {inventories.length > 0 ? (
                                      inventories.map((inventory, index) =>
                                        inventory.skus.length <= 1 ? (
                                          <tr
                                            key={inventory.id}
                                            className={cn(
                                              "h-14 border border-zui-light border-l-0",
                                              index === 0 && "border-t-0",
                                              index ===
                                                inventories.length - 1 &&
                                                "border-b-0"
                                            )}
                                          >
                                            {dates.map((_, columnIndex) => {
                                              const booking = bookings?.filter(
                                                (booking) =>
                                                  booking.columnIndex ===
                                                    columnIndex &&
                                                  booking?.booked_skus?.[0].sku
                                                    .id ===
                                                    inventory.skus?.[0]?.id
                                              );

                                              const lockings =
                                                allLockings?.filter(
                                                  (lockin) =>
                                                    lockin.columnIndex ===
                                                      columnIndex &&
                                                    lockin.sku ===
                                                      inventory.skus?.[0]?.id
                                                );

                                              return (
                                                <td
                                                  key={columnIndex}
                                                  onContextMenuCapture={handleContextMenu.bind(
                                                    null,
                                                    inventory,
                                                    inventory.skus?.[0]?.id,
                                                    dates[columnIndex]
                                                  )}
                                                  className={cn(
                                                    "h-14 w-24 p-0 border-dashed relative border-zui-light border-r",
                                                    columnIndex ===
                                                      dates.length - 1 &&
                                                      "border-r-0",
                                                    contextMenuData != null &&
                                                      contextMenuData.skuId ===
                                                        inventory.skus?.[0]
                                                          ?.id &&
                                                      contextMenuData.date.isSame(
                                                        dates[columnIndex],
                                                        "date"
                                                      ) &&
                                                      "bg-zui-neon/10"
                                                  )}
                                                >
                                                  {booking
                                                    ? booking.map((b) => (
                                                        <BookingCell
                                                          key={b.id}
                                                          booking={b}
                                                          onClick={showSelectedBooking.bind(
                                                            null,
                                                            b.id
                                                          )}
                                                        />
                                                      ))
                                                    : null}

                                                  {lockings &&
                                                    lockings.map((locking) => (
                                                      <LockingCell
                                                        key={locking.id}
                                                        locking={locking}
                                                        refetch={
                                                          refetchLockings
                                                        }
                                                      />
                                                    ))}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ) : (
                                          <tr
                                            key={inventory.id}
                                            className={cn(
                                              "border border-zui-light border-l-0",
                                              index === 0 && "border-t-0",
                                              index ===
                                                inventories.length - 1 &&
                                                "border-b-0"
                                            )}
                                          >
                                            {dates.map((_, columnIndex) => (
                                              <td
                                                key={columnIndex}
                                                className={cn(
                                                  "w-24 p-0 border-dashed border-zui-light border-r",
                                                  columnIndex ===
                                                    dates.length - 1 &&
                                                    "border-r-0"
                                                )}
                                              >
                                                {inventory.skus.map(
                                                  (
                                                    sku: any,
                                                    skuIndex: number
                                                  ) => {
                                                    const booking =
                                                      bookings?.filter(
                                                        (booking) =>
                                                          booking.columnIndex ===
                                                            columnIndex &&
                                                          booking.booked_skus[0]
                                                            .sku.id === sku.id
                                                      );

                                                    const lockings =
                                                      allLockings?.filter(
                                                        (lockin) => {
                                                          return (
                                                            lockin.columnIndex ===
                                                              columnIndex &&
                                                            lockin.sku ===
                                                              sku.id
                                                          );
                                                        }
                                                      );

                                                    return (
                                                      <div
                                                        key={sku.id}
                                                        className={cn(
                                                          "relative w-full",
                                                          skuIndex === 0
                                                            ? "h-24"
                                                            : "h-14",
                                                          skuIndex !==
                                                            inventory.skus
                                                              .length -
                                                              1 &&
                                                            "border-b border-dashed border-zui-light",
                                                          contextMenuData !=
                                                            null &&
                                                            contextMenuData.skuId ===
                                                              sku.id &&
                                                            contextMenuData.date.isSame(
                                                              dates[
                                                                columnIndex
                                                              ],
                                                              "date"
                                                            ) &&
                                                            "bg-zui-neon/10"
                                                        )}
                                                        onContextMenuCapture={handleContextMenu.bind(
                                                          null,
                                                          inventory,
                                                          sku.id,
                                                          dates[columnIndex]
                                                        )}
                                                      >
                                                        {booking
                                                          ? booking.map((b) => (
                                                              <BookingCell
                                                                onClick={showSelectedBooking.bind(
                                                                  null,
                                                                  b.id
                                                                )}
                                                                key={b.id}
                                                                booking={b}
                                                              />
                                                            ))
                                                          : null}

                                                        {lockings &&
                                                          lockings.map(
                                                            (locking) => (
                                                              <LockingCell
                                                                key={locking.id}
                                                                locking={
                                                                  locking
                                                                }
                                                                refetch={
                                                                  refetchLockings
                                                                }
                                                              />
                                                            )
                                                          )}
                                                      </div>
                                                    );
                                                  }
                                                )}
                                              </td>
                                            ))}
                                          </tr>
                                        )
                                      )
                                    ) : (
                                      <></>
                                    )}
                                    {inventories.length > 0 && (
                                      <tr className="h-12 relative z-[5] border border-t-0 p-0 border-l-0 border-b-0 border-zui-light">
                                        {dates.map((date, index) => (
                                          <th
                                            className={cn(
                                              "h-12 w-24 sticky bottom-0 bg-zui-lighter border-dashed border-zui-light border-r",
                                              index === dates.length - 1 &&
                                                "border-r-0"
                                            )}
                                            key={index}
                                          >
                                            <div className="w-full flex flex-col items-center border-t border-zui-light justify-center h-12 text-zui-silver">
                                              <span className="font-normal">
                                                {
                                                  dayWiseTotalGuestsAndOccupancy[
                                                    index
                                                  ]?.totalGuests
                                                }
                                              </span>
                                              <span className="font-normal">
                                                {
                                                  dayWiseTotalGuestsAndOccupancy[
                                                    index
                                                  ]?.occupancy
                                                }
                                                %
                                              </span>
                                            </div>
                                          </th>
                                        ))}
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : params.operator_id == null ? (
              <div className="flex items-center justify-center bg-zui-lighter py-12 space-x-2 text-zui-silver w-full">
                Select Operator
              </div>
            ) : (
              <div className="flex items-center justify-center bg-zui-lighter py-12 text-zui-silver w-full">
                No Bookable Inventories
              </div>
            )
          ) : (
            <div className="flex items-center justify-center bg-zui-lighter py-12 text-zui-silver w-full">
              <Spin spinning />
            </div>
          )}
        </div>
        <AddBookingSidebar
          isOpen={params.type === "booking" && params.type_id === "new"}
          onClose={hideSelectedBooking}
          onBookingCreation={showSelectedBooking}
          initialDateRange={
            contextMenuData != null
              ? [
                  dayjs(moment(contextMenuData?.date).toDate()),
                  dayjs(moment(contextMenuData?.date).add(1, "day").toDate()),
                ]
              : undefined
          }
          initialOperator={params.operator_id || undefined}
          initialSkus={contextMenuData != null ? [contextMenuData.skuId] : []}
          refetchStay={refetchBookings}
        />
        <AddLockingSidebar
          isOpen={params.type === "locking" && params.type_id === "new"}
          onClose={hideSelectedBooking}
          onLockinCreation={showSelectedLockin}
          refetch={refetchLockings}
          initialDateRange={
            contextMenuData != null
              ? [
                  dayjs(moment(contextMenuData?.date).toDate()),
                  dayjs(moment(contextMenuData?.date).add(1, "day").toDate()),
                ]
              : undefined
          }
          initialOperator={params.operator_id || undefined}
          initialSkus={contextMenuData != null ? [contextMenuData.skuId] : []}
          allSkus={allSkus}
        />
        <BookingInfoSidebar
          isOpen={
            params.type === "booking" &&
            isValidString(params.type_id) &&
            params.type_id !== "new"
          }
          onClose={hideSelectedBooking}
          bookingId={selectedBooking?.id || null}
        />
        {contextMenuData != null && (
          <BookingContextMenu
            {...contextMenuData}
            width={contextMenuWidth}
            height={contextMenuHeight}
            onNewBooking={createNewBooking}
            onNewLocking={createNewLocking}
            onClose={setContextMenuData.bind(null, null)}
          />
        )}
      </PageContent>
    </Page>
  );
};

export default AvailabilityViewPage;
