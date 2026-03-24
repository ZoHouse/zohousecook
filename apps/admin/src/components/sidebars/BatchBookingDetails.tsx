import {
  CalendarOutlined,
  CheckOutlined,
  CopyOutlined,
  CreditCardOutlined,
  DollarOutlined,
  EditOutlined,
  PlusCircleFilled,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { App, Button, Col, Drawer, Row, Tabs, Tag, Typography } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { TripCancellationSidebar, UpgradeTripSidebar } from ".";
import { TripCustomer } from "../../config";
import { formatPrice } from "../../utils/formatPrice";
import { TripServices } from "../helpers/trips";
import GuestInformation from "./GuestInformation";
import ModifyTripBookingSidebar from "./ModifyTripBookingSidebar";
import PaymentInformation from "./PaymentInformation";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface BatchBookingDetailsProps {
  isOpen: boolean;
  onClose: (batchId?: string, startDate?: string) => void;
  refetch: () => void;
  bookingId?: string;
}

interface BookedSku {
  id: number;
  customers: string[];
  status: string;
  sku: {
    id: string;
    name: string;
  };
}

const BatchBookingDetails: React.FC<BatchBookingDetailsProps> = ({
  isOpen,
  onClose,
  refetch,
  bookingId,
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [
    isCancellationDetailsVisible,
    showCancellationDetails,
    hideCancellationDetails,
  ] = useVisibilityState();
  const [isisUpgradeTripVisible, showUpgradeTrip, hideUpgradeTrip] =
    useVisibilityState();
  const [isModifyBookingVisible, showModifyBooking, hideModifyBooking] =
    useVisibilityState();

  const [selectedSkuId, setSelectedSkuId] = useState<number | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<TripCustomer | null>(
    null
  );
  const { data, refetch: refetchBookingInfo } = useQueryApi<any>(
    "CAS_TRIP_BOOKINGS",
    {
      enabled: isOpen && isValidString(router.query.slug?.[1] || bookingId),
      select: (data) => data.data,
    },
    `${router.query.slug?.[1] || bookingId}/`,
    ""
  );

  const { mutate: updateBooking, isLoading: isUpdateBookingLoading } =
    useMutationApi("CAS_TRIP_BOOKINGS", {}, "", "PUT");

  const handleGuestCancel = (customer: TripCustomer) => {
    const bookedSku = data?.booked_skus?.find((sku: BookedSku) =>
      sku.customers.includes(customer.id)
    );

    if (bookedSku) {
      setSelectedSkuId(bookedSku.id);
      setSelectedCustomer(customer);
      showCancellationDetails();
    }
  };

  const handleUpgradeTrip = () => {
    showUpgradeTrip();
  };

  const handleModifyBooking = () => {
    showModifyBooking();
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format("DD MMM YYYY, hh:mm A");
  };

  const handleUpdateStatus = async (
    id: string,
    status: "approve" | "cancel" | "checkout"
  ) => {
    setLoadingAction(status);
    updateBooking(
      {
        data: {},
        route: `${id}/${status}/`,
      },
      {
        onSuccess() {
          message.success(`Booking has been ${formatCapitalize(status)}`);
          queryClient.invalidateQueries({
            queryKey: ["cas", "trip", "bookings"],
          });
          refetch();
          refetchBookingInfo;
          onClose(
            data?.booked_skus?.[0]?.sku?.id,
            router.query["bookings-start_at__date"] as string
          );
          hideCancellationDetails();
          setLoadingAction(null);
        },
        onError() {
          setLoadingAction(null);
        },
      }
    );
  };

  const bookingAction = {
    actionButtons: [
      {
        label: "Approve",
        type: "primary",
        icon: <CheckOutlined />,
        danger: false,
        onClick: () => handleUpdateStatus(data?.id, "approve"),
        loading: loadingAction === "approve",
      },
      {
        label: "Cancel Trip",
        type: "default",
        icon: <StopOutlined />,
        danger: true,
        onClick: showCancellationDetails,
        loading: loadingAction === "cancel",
      },
    ],
  };

  const handleCancelBookingClose = () => {
    hideCancellationDetails();
    setSelectedSkuId(null);
  };

  const getStatusConfig = (status: string, cancellationReason?: string) => {
    if (!status) {
      return { color: "#5A5A5A", label: "UNKNOWN" };
    }
    if (status === "cancelled") {
      return cancellationReason === "auto-cancelled"
        ? { color: "#FF9E4C", label: "UNFINISHED" }
        : { color: "#FF4545", label: "CANCELLED" };
    }
    return { color: "#66DF48", label: status.toUpperCase() };
  };

  const statusConfig = getStatusConfig(data?.status, data?.cancellation_reason);

  return (
    <Drawer
      open={isOpen}
      onClose={() =>
        onClose(
          data?.booked_skus?.[0]?.sku?.id,
          router.query["bookings-start_at__date"] as string
        )
      }
      title={
        <div className="flex items-center space-x-3">
          <UserOutlined className="text-zui-white" />
          <div>
            <div className="text-zui-white font-medium">
              {data?.user?.nickname ||
                `${data?.user?.first_name} ${data?.user?.last_name}`}
            </div>
            <div className="text-zui-silver text-sm">
              Booking ID: {data?.pid}
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                className="ml-2 text-zui-silver"
                onClick={() => {
                  navigator.clipboard.writeText(data?.pid);
                  message.success("Booking ID copied to clipboard");
                }}
              />
            </div>
          </div>
        </div>
      }
      width="75vw"
      extra={
        <div className="flex items-center space-x-3">
          <Tag
            className="text-xs font-bold rounded-2xl px-3 py-2"
            style={{
              backgroundColor: statusConfig.color + "20",
              borderColor: statusConfig.color,
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </Tag>
          {data?.status !== "cancelled" &&
            data?.status !== "pending" &&
            bookingAction.actionButtons
              .filter(
                (button) =>
                  button.label !== "Approve" || data?.status !== "confirmed"
              )
              .map((button, index) => (
                <Button
                  key={index}
                  type={button.type as any}
                  icon={button.icon}
                  onClick={button.onClick}
                  loading={button.loading}
                  danger={button.danger}
                >
                  {button.label}
                </Button>
              ))}
        </div>
      }
    >
      <div className="min-h-full">
        {/* Enhanced Info & Actions Bar */}
        <div className="bg-zui-light border-b border-zui-silver p-6">
          <div className="flex items-center justify-between">
            {/* Key Booking Info Cards */}
            <div className="flex items-center space-x-6">
              <div className="bg-zui-dark p-4">
                <div className="flex items-center space-x-3">
                  <CalendarOutlined className="text-white text-lg" />
                  <div>
                    <Text className="text-white text-xs">BOOKED ON</Text>
                    <div className="text-zui-silver  text-sm">
                      {moment(data?.created_at).format("DD MMM")}
                    </div>
                    <div className="text-zui-silver text-xs">
                      {moment(data?.created_at).format("hh:mm A")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zui-dark p-4">
                <div className="flex items-center space-x-3">
                  <TeamOutlined className="text-white text-lg" />
                  <div>
                    <Text className="text-white text-xs">GUESTS</Text>
                    <div className="text-zui-silver text-sm">
                      {data?.customers?.length || 0} /{" "}
                      {data?.booked_skus?.length || 0}
                    </div>
                    <div className="text-zui-silver text-xs">Added / Total</div>
                  </div>
                </div>
              </div>

              <div className="bg-zui-dark p-4">
                <div className="flex items-center space-x-3">
                  <DollarOutlined className="text-white text-lg" />
                  <div>
                    <Text className="text-white text-xs">TRIP DURATION</Text>
                    <div className="text-zui-silver  text-sm">
                      {moment(data?.end_at).diff(
                        moment(data?.start_at),
                        "days"
                      )}{" "}
                      Days
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            {(data?.status === "requested" || data?.status === "confirmed") && (
              <div className="flex space-x-4">
                <Button
                  type="primary"
                  icon={<PlusCircleFilled />}
                  onClick={handleUpgradeTrip}
                  size="large"
                  className="text-white px-6 py-2"
                >
                  Upgrade Trip
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleModifyBooking}
                  size="large"
                  className="text-white px-6 py-2"
                >
                  Modify Booking
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="py-6">
          <Row gutter={[24, 24]}>
            {/* Left Column - Enhanced Financial Dashboard */}
            <Col span={6}>
              <div className="bg-zui-dark p-6 mb-6">
                <div className="flex items-center mb-6">
                  <div className="bg-zui-light p-3 rounded-lg">
                    <DollarOutlined className="text-white text-xl" />
                  </div>
                  <Title level={5} className="text-zui-white ml-4 mb-0">
                    Financial Details
                  </Title>
                </div>

                <div className="space-y-2">
                  {/* Total Amount Card */}
                  <div className="bg-zui-light py-3 px-4 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-white text-xs uppercase tracking-wider">
                            Total Amount
                          </Text>
                          <div className="text-sm text-zui-silver mt-2">
                            {formatPrice(
                              data?.total_amount || 0,
                              data?.booked_skus?.[0]?.sku?.currency ||
                                ({} as Currency)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paid Amount Card */}
                  <div className="bg-zui-light py-3 px-4  relative overflow-hidden financial-card">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-white text-xs uppercase tracking-wider opacity-90">
                            Paid Amount
                          </Text>
                          <div className="text-sm text-zui-silver mt-2">
                            {formatPrice(
                              data?.paid_amount || 0,
                              data?.booked_skus?.[0]?.sku?.currency ||
                                ({} as Currency)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Refund Amount Card */}
                  <div className="bg-zui-light py-3 px-4  relative overflow-hidden financial-card">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-white text-xs uppercase tracking-wider opacity-90">
                            Refund Amount
                          </Text>
                          <div className="text-sm text-zui-silver mt-2">
                            {formatPrice(
                              data?.refund_amount || 0,
                              data?.booked_skus?.[0]?.sku?.currency ||
                                ({} as Currency)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Card */}
                  <div className="bg-zui-light py-3 px-4  relative overflow-hidden financial-card">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-white text-xs uppercase tracking-wider opacity-90">
                            Revenue
                          </Text>
                          <div className="text-sm text-zui-silver mt-2">
                            {formatPrice(
                              data?.paid_amount || 0 - data?.refund_amount || 0,
                              data?.booked_skus?.[0]?.sku?.currency ||
                                ({} as Currency)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Source Card */}
                  <div className="bg-zui-light py-3 px-4 relative overflow-hidden financial-card">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-white text-xs  uppercase tracking-wider opacity-90">
                            Booking Source
                          </Text>
                          <div className="text-sm text-zui-silver mt-2">
                            {data?.source?.toUpperCase() || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Due Card (if applicable) */}
                  {data?.total_amount &&
                    data?.paid_amount !== undefined &&
                    data.total_amount > data.paid_amount && (
                      <div className="bg-zui-orange bg-opacity-20 border border-zui-orange px-4 py-2  relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="text-zui-orange text-xs  uppercase tracking-wider mb-2 block">
                                Balance Due
                              </Text>
                              <div className="text-xl  text-zui-orange">
                                {formatPrice(
                                  data.total_amount - data.paid_amount,
                                  data?.booked_skus?.[0]?.sku?.currency ||
                                    ({} as Currency)
                                )}
                              </div>
                            </div>
                            <div className="bg-zui-orange bg-opacity-20 p-3 rounded-full">
                              <DollarOutlined className="text-zui-orange text-xl" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </Col>

            {/* Right Column - Enhanced Information Hub */}
            <Col span={18}>
              <div className="bg-zui-dark h-full overflow-hidden">
                <Tabs
                  defaultActiveKey="1"
                  className="px-6 pb-6 h-full"
                  size="large"
                >
                  <TabPane
                    tab={
                      <span className="flex items-center text-zui-white">
                        <CalendarOutlined className="mr-2" />
                        Trip Details
                      </span>
                    }
                    key="1"
                  >
                    <div className="space-y-6">
                      {/* Trip Header Card */}
                      <div className="bg-zui-light p-6 financial-card">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-zui-dark p-4 rounded-2xl">
                              <CalendarOutlined className="text-white text-2xl" />
                            </div>
                            <div>
                              <Title
                                level={5}
                                className="text-zui-white m-0 mb-1"
                              >
                                {data?.booked_skus?.[0]?.sku?.inventory?.name ||
                                  "Trip Details"}
                              </Title>
                              <div className="text-xs">
                                {data?.booked_skus?.[0]?.sku?.itinerary?.title}
                              </div>
                              <div className=" text-xs">
                                Group:{" "}
                                <span className="text-zui-neon">
                                  {data?.booked_skus?.[0]?.sku?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            onClick={() =>
                              window.open(
                                `/admin/trips/${data?.booked_skus?.[0]?.sku?.inventory?.id}`,
                                "_blank"
                              )
                            }
                            icon={<CalendarOutlined />}
                            size="large"
                          >
                            View Full Trip
                          </Button>
                        </div>

                        {/* Enhanced Date Cards */}
                        <Row gutter={[24, 24]}>
                          <Col span={12}>
                            <div className="bg-zui-dark  border border-zui-silver  py-3 px-6 relative overflow-hidden timeline-card">
                              <div className="relative z-10">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <div className=" mr-3">
                                        <CalendarOutlined className="text-white text-sm" />
                                      </div>
                                      <Text className="text-white text-sm uppercase tracking-wider">
                                        Trip Start
                                      </Text>
                                    </div>
                                    <div className="text-xs text-zui-silver mb-1">
                                      {moment(data?.start_at).format(
                                        "DD MMM YYYY"
                                      )}
                                    </div>
                                    <div className="text-zui-silver text-xs">
                                      {moment(data?.start_at).format(
                                        "dddd, hh:mm A"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div className="bg-zui-red bg-opacity-10 border border-zui-red py-3 px-6 relative overflow-hidden timeline-card">
                              <div className="relative z-10">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center mb-3">
                                      <div className="mr-3">
                                        <CalendarOutlined className="text-white text-sm" />
                                      </div>
                                      <Text className="text-white text-sm uppercase tracking-wider">
                                        Trip End
                                      </Text>
                                    </div>
                                    <div className="text-xs text-white mb-1">
                                      {moment(data?.end_at).format(
                                        "DD MMM YYYY"
                                      )}
                                    </div>
                                    <div className="text-white text-xs">
                                      {moment(data?.end_at).format(
                                        "dddd, hh:mm A"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                      {(data?.cancelled_at || data?.cancellation_reason) && (
                        <div className="bg-zui-red bg-opacity-10 border border-zui-red p-6">
                          <Title level={5} className="text-zui-red mb-6">
                            Cancellation Details
                          </Title>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <Text className="text-zui-silver">
                                Refund Amount:
                              </Text>
                              <Text className="text-zui-white">
                                {data?.refund_amount
                                  ? formatPrice(
                                      data.refund_amount,
                                      data?.booked_skus?.[0]?.sku?.currency ||
                                        ({} as Currency)
                                    )
                                  : "N/A"}
                              </Text>
                            </div>
                            {data.cancelled_at && (
                              <div className="flex justify-between">
                                <Text className="text-zui-silver">
                                  Cancelled On:
                                </Text>
                                <Text className="text-zui-white">
                                  {formatDate(data.cancelled_at)}
                                </Text>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <Text className="text-zui-silver">Reason:</Text>
                              <Text className="text-zui-white">
                                {data.cancellation_reason || "N/A"}
                              </Text>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Booked Addons */}
                      <Title level={5} className="text-zui-white m-0">
                        Trip Add-ons
                      </Title>
                      <TripServices
                        services={data?.booked_skus[0]?.booked_addons}
                        label="Add-on Name"
                        emptyMessage="No Add-ons Added"
                      />
                      <Title level={5} className="text-zui-white m-0">
                        Trip Upgrades
                      </Title>
                      <TripServices
                        services={data?.upgrades}
                        label="Upgrade Name"
                        emptyMessage="No Upgrades Added"
                      />
                    </div>
                  </TabPane>

                  <TabPane
                    tab={
                      <span className="flex items-center text-zui-white">
                        <TeamOutlined className="mr-2" />
                        Guest Info
                      </span>
                    }
                    key="2"
                  >
                    <GuestInformation
                      user={data?.user}
                      customers={data?.customers}
                      bookedSkus={data?.booked_skus}
                      onGuestCancel={handleGuestCancel}
                    />
                  </TabPane>

                  <TabPane
                    tab={
                      <span className="flex items-center text-zui-white">
                        <CreditCardOutlined className="mr-2" />
                        Payment Info
                      </span>
                    }
                    key="3"
                  >
                    <PaymentInformation
                      payments={data?.payments}
                      currency={data?.booked_skus?.[0]?.sku?.currency}
                    />
                  </TabPane>
                </Tabs>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <TripCancellationSidebar
        isOpen={isCancellationDetailsVisible}
        onClose={handleCancelBookingClose}
        bookingData={data}
        selectedSkuId={selectedSkuId}
        refetch={refetch}
        refetchBookingInfo={refetchBookingInfo}
        selectedCustomer={selectedCustomer}
      />

      <UpgradeTripSidebar
        isOpen={isisUpgradeTripVisible}
        onClose={hideUpgradeTrip}
        bookingData={data}
        refetch={refetchBookingInfo}
      />

      <ModifyTripBookingSidebar
        isOpen={isModifyBookingVisible}
        onClose={hideModifyBooking}
        refetch={() => {
          refetchBookingInfo();
          refetch();
        }}
        bookingData={data}
      />
    </Drawer>
  );
};

export default BatchBookingDetails;
