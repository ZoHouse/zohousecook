import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  useMutationApi,
  useProfile,
  useQueriesApi,
  useQueryApi,
} from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useWindowSize } from "@zo/utils/hooks";
import { isValidObject, removeUndefinedKeys } from "@zo/utils/object";
import { isValidEmail, isValidString } from "@zo/utils/string";
import {
  App,
  Button,
  Drawer,
  Empty,
  Input,
  Spin,
  Steps,
  Tabs,
  TabsProps,
  Typography,
} from "antd";
import { useForm, useWatch } from "antd/es/form/Form";
import { addDays } from "date-fns";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Inventory, Price, Sku, ZoHouse } from "../../config";
import { SkuAvailability } from "../../config/typings";
import { Form, FormElement as FormElementType } from "../Form";
import {
  BookingConfirmation,
  OperatorCard,
  PriceBreakDownCard,
} from "../helpers/bookings";
import RoomSelectionComponent from "../helpers/bookings/RoomSelectionComponent";
import SlotPicker from "../helpers/bookings/SlotPicker";

const { Text } = Typography;

interface AddBookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateRange?: [Dayjs, Dayjs];
  initialOperator?: string;
  onBookingCreation?: (bookingId: string) => void;
  initialSkus?: string[];
  refetchStay?: () => void;
  refetchSpace?: () => void;
}

export interface SkuDetailType {
  skus: Sku[];
  name: string;
}

const AddBookingSidebar: React.FC<AddBookingSidebarProps> = ({
  isOpen,
  onClose,
  initialDateRange,
  initialOperator,
  onBookingCreation,
  initialSkus,
  refetchStay,
  refetchSpace,
}) => {
  const { isMobile } = useWindowSize();
  const router = useRouter();
  const { message } = App.useApp();

  const profile = useProfile();

  const [form] = useForm();

  const slotValue = useWatch("slot", form);
  const membersValue = useWatch("members", form);
  const timeValue = useWatch("time", form);
  const user = useWatch("user", form);

  const values = useWatch([], form);

  const [selectedOperator, setSelectedOperator] = useState<string | null>();

  const [activeTab, setActiveTab] = useState<"stay" | "utility">("stay");
  const [utilityBookingDate, setUtilityBookingDate] = useState<Dayjs>(dayjs());

  const [selectedRooms, setSelectedRooms] = useState<Sku[]>([]);

  const [secondsLeft, setSecondsLeft] = useState<number>(3);
  const [opeartorSearchTerm, setOperatorSearchTerm] = useState<string>("");

  const [bookingDateRange, setBookingDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs(new Date()),
    dayjs(addDays(new Date(), 2)),
  ]);

  const [showUnverifiedUserField, setShowUnverifiedUserField] =
    useState<boolean>(false);

  const [screen, setScreen] = useState<number>(1);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const selectedRoomsPids = useMemo(
    () => selectedRooms.map((room) => room.pid).join(","),
    [selectedRooms]
  );
  const selectedSkusPids = useMemo(
    () => selectedRooms.map((room) => room.pid),
    [selectedRooms]
  );
  const userPidParam = useMemo(() => (user ? `&user_pid=${user}` : ""), [user]);

  // Query APIs
  const { data: operators, isLoading: isOperatorLoading } = useQueryApi<
    ZoHouse[]
  >(
    "CAS_OPERATORS",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data.results,
    },
    "",
    isValidString(opeartorSearchTerm)
      ? `limit=10&search=${opeartorSearchTerm}`
      : "limit=50"
  );

  const { data: allInventoryList, isLoading: isInventoryLoading } = useQueryApi<
    string[]
  >(
    "CAS_INVENTORY",
    {
      enabled: isOpen && isValidString(selectedOperator) && screen === 2,
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((inventory: Inventory) => inventory.id),
    },
    "",
    `operator=${selectedOperator}&type=${activeTab}&limit=100`
  );
  const { data: pricingData, isLoading: isFinalPriceLoading } = useQueryApi<
    Array<Price>
  >(
    "CAS_STAY_DISCOVER_PRICING",
    {
      enabled: isOpen && isValidObject(selectedRooms),
      select: (data) => data.data.results,
    },
    "",
    `skus=${selectedRoomsPids}&start_date=${bookingDateRange?.[0]?.format(
      "YYYY-MM-DD"
    )}&end_date=${bookingDateRange?.[1]?.format("YYYY-MM-DD")}${userPidParam}`
  );

  const { data: utilityPricingData, isLoading: isUtilityPriceLoading } =
    useQueryApi<Array<Price>>(
      "CAS_UTILITY_DISCOVER_PRICING",
      {
        enabled: isOpen && selectedRooms.length > 0,
        select: (data) => data.data.results,
      },
      "",
      `skus=${selectedRoomsPids}&start_date=${utilityBookingDate.format(
        "YYYY-MM-DD"
      )}&end_date=${utilityBookingDate
        .add(1, "day")
        .format("YYYY-MM-DD")}${userPidParam}${
        slotValue ? `&num_slots=${slotValue}` : ""
      }`
    );

  const inventoryQueries = useMemo(
    () =>
      allInventoryList?.map((inventoryId: string): [string, string] => [
        `${inventoryId}/`,
        "",
      ]) || [],
    [allInventoryList]
  );

  const allInventoryDetail = useQueriesApi(
    "CAS_INVENTORY",
    {
      enabled: isOpen && inventoryQueries.length > 0 && screen === 2,
      refetchOnWindowFocus: false,
    },
    inventoryQueries
  );

  // Mutation Api
  const { mutate: updateBooking, isLoading: isUpdateBookingLoading } =
    useMutationApi("CAS_STAY_BOOKINGS");
  const { mutate: utilityBooking, isLoading: isUtilityBookingLoading } =
    useMutationApi("CAS_UTILITY_BOOKINGS");

  const { mutate: createGuest, isLoading: isCreateGuestLoading } =
    useMutationApi("CAS_USERS", {}, ``, "POST");

  const { mutate: deleteMedia } = useMutationApi("CAS_MEDIA", {}, "", "DELETE");

  const skuDetails: SkuDetailType = useMemo(() => {
    if (allInventoryDetail?.length > 0) {
      const allSku = allInventoryDetail.map((inventoryResponse) => {
        const inventory: Inventory = inventoryResponse?.data?.data;
        return (
          inventory?.skus.map((sku: Sku) => {
            return {
              ...sku,
              media: inventory.media,
              name: `${inventory.name} • ${sku.name}`,
              operator: inventoryResponse?.data?.data.operator,
              occupancy:
                (inventory?.occupancy || 1) / (inventory.skus.length || 1),
            };
          }) || []
        );
      });

      return {
        skus: allSku.flat(),
        name: allInventoryDetail[0]?.data?.data.name,
      };
    } else {
      return {
        skus: [],
        name: "",
      };
    }
  }, [allInventoryDetail]);

  const renderAllSkusQueryParam = useMemo(() => {
    if (skuDetails.skus.length > 0) {
      const dateRange =
        activeTab === "stay"
          ? { start: bookingDateRange?.[0], end: bookingDateRange?.[1] }
          : {
              start: utilityBookingDate,
              end: dayjs(utilityBookingDate).add(1, "day"),
            };

      return "skus="
        .concat(skuDetails.skus.map((sku: Sku) => sku.pid).join(","))
        .concat(
          `&start_date=${dayjs(dateRange.start).format(
            "YYYY-MM-DD"
          )}&end_date=${dayjs(dateRange.end).format("YYYY-MM-DD")}&user_pid=${
            profile.profile.pid
          }`
        );
    } else {
      return "";
    }
  }, [skuDetails, activeTab, bookingDateRange, utilityBookingDate]);

  const {
    data: allUtilitySkuPricingList,
    isLoading: isUtilitySkuPriceLoading,
  } = useQueryApi<Price[]>(
    "CAS_UTILITY_DISCOVER_PRICING",
    {
      enabled:
        isOpen &&
        isValidObject(profile) &&
        isValidString(selectedOperator) &&
        isValidString(renderAllSkusQueryParam) &&
        screen === 2 &&
        activeTab === "utility",
      select: (data) => data.data.results,
    },
    "",
    renderAllSkusQueryParam
  );

  const { data: allStaySkuPricingList, isLoading: isStaySkuPriceLoading } =
    useQueryApi<Price[]>(
      "CAS_STAY_DISCOVER_PRICING",
      {
        enabled:
          isOpen &&
          isValidObject(profile) &&
          isValidString(selectedOperator) &&
          isValidString(renderAllSkusQueryParam) &&
          screen === 2 &&
          activeTab === "stay",
        select: (data) => data.data.results,
      },
      "",
      renderAllSkusQueryParam
    );

  const {
    data: allSkuAvailabilityList,
    isLoading: isStaySkuAvailabilityLoading,
  } = useQueryApi<SkuAvailability[]>(
    "CAS_STAY_DISCOVER_AVAILABILITY",
    {
      enabled:
        isOpen &&
        isValidObject(profile) &&
        isValidString(selectedOperator) &&
        isValidString(renderAllSkusQueryParam) &&
        screen === 2 &&
        activeTab === "stay",
      select: (data) => data.data.results,
    },
    "",
    renderAllSkusQueryParam
  );

  const {
    data: allUtilitySkuAvailabilityList,
    isLoading: isUtilitySkuAvailabilityLoading,
  } = useQueryApi<SkuAvailability[]>(
    "CAS_UTILITY_DISCOVER_AVAILABILITY",
    {
      enabled:
        isOpen &&
        isValidObject(profile) &&
        isValidString(selectedOperator) &&
        isValidString(renderAllSkusQueryParam) &&
        screen === 2 &&
        activeTab === "utility",
      select: (data) => data.data.results,
    },
    "",
    renderAllSkusQueryParam
  );

  const finalPriceData = useMemo(() => {
    if (selectedRooms && pricingData && pricingData?.length > 0) {
      const discounts: GeneralObject = {};

      const currency = pricingData?.[0].currency;

      const roomPrices = selectedRooms.map((room) => {
        const roomPricing = pricingData.filter((item) => item.pid === room.pid);
        const roomBasePrice = roomPricing.reduce(
          (total: number, item: Price) => {
            return total + item.strike_price;
          },
          0
        );

        return {
          roomName: room.name,
          basePrice: roomBasePrice * Math.pow(10, -currency.decimals),
        };
      });

      const price = pricingData?.reduce((total: number, item: Price) => {
        return total + item.price;
      }, 0);

      const taxedPrice = pricingData?.reduce((total: number, item: Price) => {
        return total + item.price_taxed;
      }, 0);

      pricingData.forEach((item) => {
        item.labels.forEach((label) => {
          if (!discounts[label.name]) {
            discounts[label.name] = 0;
          }
          discounts[label.name] +=
            label.discount * Math.pow(10, -currency.decimals);
        });
      });

      const totalDiscount = pricingData
        .flatMap((item) => item.labels)
        .reduce((sum, label) => sum + label.discount, 0);

      return {
        roomPrices,
        tax: (taxedPrice - price) * Math.pow(10, -currency.decimals),
        discounts: discounts,
        symbol: pricingData?.[0].currency.symbol,
        totalDiscount:
          totalDiscount > 0
            ? totalDiscount * Math.pow(10, -currency.decimals)
            : 0,
      };
    } else {
      return {
        roomPrices: [],
        tax: 0,
        totalDiscount: 0,
        discounts: {},
        symbol: "₹",
      };
    }
  }, [pricingData]);

  const finalUtilityPriceData = useMemo(() => {
    if (
      !selectedRooms ||
      !utilityPricingData ||
      utilityPricingData.length === 0
    ) {
      return {
        roomPrices: [],
        tax: 0,
        totalDiscount: 0,
        discounts: {},
        symbol: "₹",
      };
    }

    const roomPrices = selectedRooms.map((room) => {
      const roomPricing = utilityPricingData.find(
        (item: GeneralObject) =>
          item.pid === room.pid && item.slot === Number(timeValue)
      );

      const pricing: GeneralObject = roomPricing || {};
      const currency = pricing.currency || { decimals: 0, symbol: "₹" };
      const decimalFactor = Math.pow(10, -currency.decimals);

      const basePrice =
        (pricing.strike_price || 0) * decimalFactor * membersValue;
      const price = (pricing.price || 0) * decimalFactor * membersValue;
      const taxedPrice =
        (pricing.price_taxed || 0) * decimalFactor * membersValue;

      const discounts: GeneralObject = {};
      pricing.labels?.forEach(({ name, discount }: GeneralObject) => {
        const discountValue = (discount || 0) * decimalFactor * membersValue;
        discounts[name] = (discounts[name] || 0) + discountValue;
      });

      const totalDiscount = Object.values(discounts).reduce(
        (sum, discount) => sum + discount,
        0
      );

      return {
        roomName: room.name,
        basePrice,
        taxedPrice,
        price,
        totalDiscount,
        symbol: currency.symbol,
        discounts,
      };
    });

    const totalTax = roomPrices.reduce(
      (sum, room) => sum + (room.taxedPrice - room.price),
      0
    );

    const totalDiscount = roomPrices.reduce(
      (sum, room) => sum + room.totalDiscount,
      0
    );

    const discounts = roomPrices.reduce((acc: GeneralObject, room) => {
      Object.entries(room.discounts).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    }, {});

    const symbol = roomPrices[0]?.symbol || "₹";

    return {
      roomPrices,
      tax: totalTax,
      discounts,
      symbol,
      totalDiscount: totalDiscount > 0 ? totalDiscount : 0,
    };
  }, [selectedRooms, utilityPricingData, timeValue, membersValue]);

  const selectedRoomsOccupancy = useMemo(() => {
    return selectedRooms.reduce((acc, room) => acc + (room?.occupancy || 0), 0);
  }, [selectedRooms]);

  const nextButtonLabel = useMemo(() => {
    if (screen === 1) {
      return "Next";
    } else if (screen === 2) {
      return "Add Guest Details";
    } else {
      return "Create Booking";
    }
  }, [screen]);

  const isNextButtonDisabled = useMemo(() => {
    if (screen === 1) {
      return !isValidString(selectedOperator);
    }

    if (screen === 2) {
      return selectedRooms.length === 0;
    }

    if (screen === 3) {
      return (
        !isValidEmail(values.email) &&
        !isValidString(user) &&
        !isValidString(values.phone) &&
        !isValidString(values.name)
      );
    }

    return false;
  }, [screen, selectedOperator, selectedRooms, values]);

  // Handler Functions
  const bookRoom = async (userId: string) => {
    const fromDate =
      activeTab === "stay"
        ? dayjs(bookingDateRange?.[0]).format("YYYY-MM-DD")
        : dayjs(utilityBookingDate).format("YYYY-MM-DD");

    const toDate =
      activeTab === "stay"
        ? dayjs(bookingDateRange?.[1]).format("YYYY-MM-DD")
        : dayjs(utilityBookingDate).add(1, "day").format("YYYY-MM-DD");

    const startingTime = Number(timeValue);
    const slotCount = slotValue;

    const slots =
      activeTab === "utility" && slotCount
        ? Array.from(
            { length: slotCount },
            (_, index) => (startingTime + index) % 24
          )
        : [startingTime];

    if (activeTab === "stay") {
      updateBooking(
        {
          data: {
            start_date: fromDate,
            end_date: toDate,
            sku_pids: selectedSkusPids,
            user_pid: userId,
          },
        },
        {
          onError(error) {
            message.error(processResponseError(error));
          },
          onSuccess: (data) => {
            const bookingData: GeneralObject = data.data;
            refetchStay?.();
            setBookingId(bookingData?.id);
            setScreen((prev) => prev + 1);
          },
        }
      );
    } else {
      utilityBooking(
        {
          data: {
            start_date: fromDate,
            end_date: toDate,
            sku_pids: selectedSkusPids,
            user_pid: userId,
            slots: slots,
          },
        },
        {
          onError(error) {
            message.error(processResponseError(error));
          },
          onSuccess: (data) => {
            const bookingData: GeneralObject = data.data;
            refetchSpace?.();
            setBookingId(bookingData?.id);
            setScreen((prev) => prev + 1);
          },
        }
      );
    }
  };

  const resetForm = () => {
    setScreen(1);
    setSelectedOperator(null);
    setSelectedRooms([]);
    setOperatorSearchTerm("");
    setActiveTab("stay");
    setUtilityBookingDate(dayjs());
    setBookingDateRange([dayjs(new Date()), dayjs(addDays(new Date(), 2))]);
    setShowUnverifiedUserField(false);
    setBookingId(null);
    setSecondsLeft(3);
    form.resetFields();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nextScreenHandler = () => {
    if (screen === 3) {
      if (isValidString(user)) {
        return bookRoom(user);
      } else {
        const _data = form.getFieldsValue();

        createGuest(
          {
            data: removeUndefinedKeys(_data),
          },
          {
            onSuccess(data) {
              message.success("Booking Created Successfully");
              bookRoom(data?.data?.profile?.pid);
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      }
    } else {
      setScreen((prev) => prev + 1);
    }
  };

  const previousScreenHandler = () => {
    if (screen === 3) {
      form.resetFields();
      setShowUnverifiedUserField(false);
    }
    if (screen < 1) {
      return;
    }
    setScreen((prev) => prev - 1);
  };

  const handleViewBooking = () => {
    if (onBookingCreation) {
      onBookingCreation(bookingId || "");
    } else {
      router.push(`/bookings/${activeTab}/${bookingId}`, undefined, {
        shallow: true,
      });
    }
    handleClose();
  };

  const handleRoomSelect = useCallback((room: Sku) => {
    setSelectedRooms((prev) => {
      const previousOperator = prev.length > 0 ? prev[0].operator : null;

      if (previousOperator && previousOperator !== room.operator) {
        return [room];
      }

      return prev.some(({ id }) => id === room.id)
        ? prev.filter(({ id }) => id !== room.id)
        : [...prev, room];
    });
  }, []);

  const selectedRoomIds = useMemo(
    () => new Set(selectedRooms.map(({ id }) => id)),
    [selectedRooms]
  );

  useEffect(() => {
    if (bookingId) {
      const timer = setTimeout(() => {
        handleViewBooking();
      }, 3000);

      const countdownInterval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [bookingId]);

  const groupedSkus: GeneralObject = skuDetails?.skus?.reduce(
    (acc: GeneralObject, sku: Sku) => {
      const category = sku.inventory.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(sku);
      return acc;
    },
    {}
  );

  useEffect(() => {
    if (initialSkus && skuDetails.skus.length > 0) {
      const selectedSkus = skuDetails.skus.filter((sku) =>
        initialSkus.includes(sku.id)
      );
      setSelectedRooms(selectedSkus);
    }
  }, [initialSkus]);

  useEffect(() => {
    if (initialOperator) {
      setSelectedOperator(initialOperator);
    }
  }, [initialOperator]);

  useEffect(() => {
    if (initialDateRange) {
      setBookingDateRange(initialDateRange);
    }
  }, [initialDateRange]);

  const handleTabChange = (newTabId: string) => {
    if (["stay", "utility"].includes(newTabId)) {
      setActiveTab(newTabId as "stay" | "utility");
    }
    setSelectedRooms([]);
  };

  const handleOperatorSelect = (operatorId: string | null) => {
    setSelectedOperator(operatorId);
    nextScreenHandler();
  };

  const renderOperatorSelector = () => {
    return (
      <div className="flex flex-col gap-4">
        <Input.Search
          placeholder="Search operators..."
          value={opeartorSearchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOperatorSearchTerm(e.target.value)
          }
          allowClear
          className=" md:w-1/2"
          size="large"
        />

        <div className="flex items-center justify-center h-full mt-10">
          {isOperatorLoading ? (
            <div className="flex justify-center py-4">
              <Spin />
            </div>
          ) : operators && operators.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {operators.map((operator: ZoHouse) => (
                <OperatorCard
                  key={operator.id}
                  data={operator}
                  onClick={handleOperatorSelect}
                  active={selectedOperator === operator.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Empty description="No operators found" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRoomSelectionComponent = () => {
    const tabItems: TabsProps["items"] = [
      {
        key: "stay",
        label: "Stay",
        children: (
          <>
            <RoomSelectionComponent
              groupedSkus={groupedSkus}
              activeTab={activeTab}
              handleRoomSelect={handleRoomSelect}
              selectedRoomIds={selectedRoomIds}
              pricingList={allStaySkuPricingList || []}
              availabilityList={allSkuAvailabilityList || []}
              loading={
                isStaySkuPriceLoading ||
                isStaySkuAvailabilityLoading ||
                isInventoryLoading
              }
              date={bookingDateRange}
              setDate={setBookingDateRange}
              selectedItems={selectedRooms}
            />
          </>
        ),
      },
      {
        key: "utility",
        label: "Spaces",
        children: (
          <>
            <RoomSelectionComponent
              groupedSkus={groupedSkus}
              activeTab={activeTab}
              loading={
                isUtilitySkuPriceLoading ||
                isUtilitySkuAvailabilityLoading ||
                isInventoryLoading
              }
              handleRoomSelect={handleRoomSelect}
              selectedRoomIds={selectedRoomIds}
              pricingList={allUtilitySkuPricingList || []}
              availabilityList={allUtilitySkuAvailabilityList || []}
              date={utilityBookingDate}
              setDate={setUtilityBookingDate}
              selectedItems={selectedRooms}
            />
          </>
        ),
      },
    ];

    return (
      <div className="flex flex-col h-fit flex-1 w-full">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </div>
    );
  };

  const formFields: FormElementType[] = [
    {
      name: "user",
      label: "User",
      type: "searchselect",
      searchQueryApi: "CAS_PROFILES",
      required: true,
      responseFields: [
        "id",
        "user",
        "nickname",
        "selected_nickname",
        "pfp",
        "pid",
        "first_name",
        "last_name",
        "email_address",
        "wallet_address",
        "avatar",
      ],
      isHidden: showUnverifiedUserField,
      optionValueAndLabelSelector: (data) => ({
        value: data.pid,
        label: data.nickname || data.first_name,
      }),
      notFoundContent: (
        <CreateUserButton onClickHandler={setShowUnverifiedUserField} />
      ),
    },
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
      isHidden: !showUnverifiedUserField,
    },
    {
      name: "phone",
      type: "phone",
      label: "Phone",
      required: true,
      isHidden: !showUnverifiedUserField,
    },
    {
      name: "email_address",
      type: "email",
      label: "Email",
      required: true,
      isHidden: !showUnverifiedUserField,
    },
  ];

  const handleShowUnverifiedUserField = () => {
    setShowUnverifiedUserField(!showUnverifiedUserField);
    // remove user from form
    form.setFieldValue("user", undefined);
  };

  return (
    <Drawer
      size="large"
      open={isOpen}
      onClose={handleClose}
      title={
        !isMobile ? (
          <div className="flex items-center gap-4">
            {screen !== 1 && screen !== 4 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={previousScreenHandler}
                disabled={screen === 1}
                type="text"
              />
            )}
            <span>Create a New Booking</span>
          </div>
        ) : undefined
      }
      closable={!isMobile}
      maskClosable={false}
      extra={
        <Button
          type="primary"
          onClick={nextScreenHandler}
          disabled={isNextButtonDisabled}
        >
          {nextButtonLabel}
        </Button>
      }
    >
      {screen < 4 && (
        <Steps
          current={screen - 1}
          items={[
            {
              title: "Select Operator",
            },
            {
              title: "Select Room",
            },
            {
              title: "Guest Details",
            },
          ]}
          className="mb-8"
        />
      )}

      {screen === 1 && renderOperatorSelector()}

      {screen === 2 && renderRoomSelectionComponent()}

      {screen === 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <Form formData={form} formFields={formFields} />

            <Button type="default" onClick={handleShowUnverifiedUserField}>
              {showUnverifiedUserField
                ? "Registered User"
                : "Registering a Guest?"}
            </Button>

            {activeTab === "utility" && (
              <SlotPicker
                title="Select Slot"
                subtitle=" For workstation"
                form={form}
                activeTab={activeTab}
                maxOccupancy={selectedRoomsOccupancy}
              />
            )}
          </div>
          <div className="flex-1 w-full">
            {!isValidString(user) && !showUnverifiedUserField ? (
              <div className="flex items-center justify-center p-4 border border-zui-light mt-2">
                <Text type="secondary">Please select a user first</Text>
              </div>
            ) : activeTab === "utility" && !timeValue ? (
              <div className="flex items-center justify-center p-4 border border-zui-light mt-2">
                <Text type="secondary">Please select a starting time</Text>
              </div>
            ) : (
              <PriceBreakDownCard
                loading={isFinalPriceLoading || isUtilityPriceLoading}
                data={
                  activeTab === "utility"
                    ? finalUtilityPriceData
                    : finalPriceData
                }
              />
            )}
          </div>
        </div>
      ) : null}
      {screen === 4 && (
        <BookingConfirmation
          bookingId={bookingId}
          email={form.getFieldValue("email")}
          secondsLeft={secondsLeft}
          onViewBooking={handleViewBooking}
          onCreateAnotherBooking={resetForm}
          isLoading={
            isUpdateBookingLoading ||
            isUtilityBookingLoading ||
            isCreateGuestLoading
          }
        />
      )}
    </Drawer>
  );
};

export default AddBookingSidebar;

const CreateUserButton: React.FC<{
  onClickHandler: (value: boolean) => void;
}> = ({ onClickHandler }) => {
  return (
    <Button
      block
      type="default"
      onClick={() => onClickHandler(true)}
      className="text-subtitle bg-zui-lighter"
    >
      Create a New User
    </Button>
  );
};
