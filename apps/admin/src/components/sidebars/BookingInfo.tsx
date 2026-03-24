import {
  AccessAlarm as AccessAlarmIcon,
  AddOutlined as AddOutlinedIcon,
  Assignment as AssignmentIcon,
  AutoModeOutlined as AutoModeOutlinedIcon,
  Badge as BadgeIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  LocalOffer as LocalOfferIcon,
  Note as NoteIcon,
  Paid as PaidIcon,
  Person as PersonIcon,
  Source as SourceIcon,
  StickyNote2 as StickyNote2Icon,
} from "@mui/icons-material";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import {
  formatCapitalize,
  isValidString,
  shortenString,
} from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Flex,
  Input,
  Modal,
  Progress,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { Booking, Inventory } from "../../config";
import { GuestInfoSection, PaymentInfoSection } from "../helpers/bookings";
import DataListDisplay, { DataList } from "../ui2/DataDisplayList";
import AddBookingUserSidebar from "./AddBookingUser";

interface BookingInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  type?: "stay" | "utility";
}

type ButtonType = "link" | "primary" | "default" | "text" | "dashed";

const getBookingTagStatus = (
  status: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "requested":
    case "pending":
      return "warning";
    case "confirmed":
    case "checkin":
    case "checkout":
      return "success";
    case "cancelled":
      return "error";
    case "noshow":
    default:
      return "default";
  }
};

interface ActionButton {
  label: string;
  type?: ButtonType;
  onClick?: () => void;
  buttonProps?: {
    type: ButtonType;
    danger?: boolean;
  };
}

const BookingInfoSidebar: React.FC<BookingInfoSidebarProps> = ({
  isOpen,
  onClose,
  type = "stay",
  bookingId,
}) => {
  const { message } = App.useApp();

  const {
    data: booking,
    isLoading: isLoadingBooking,
    refetch: refetchBooking,
  } = useQueryApi<Booking>(
    type === "stay" ? "CAS_STAY_BOOKINGS" : "CAS_UTILITY_BOOKINGS",
    {
      enabled: isValidString(bookingId),
      select: (data) => data?.data,
      refetchOnWindowFocus: false,
    },
    `${bookingId}/`
  );

  const [cancellationReason, setCancellationReason] = useState<string>("");

  const [isAddGuestVisible, showAddGuest, hideAddGuest] = useVisibilityState();

  const [
    isCancellationDetailsVisible,
    showCancellationDetails,
    hideCancellationDetails,
  ] = useVisibilityState();

  const { data: cancellationDetails, isLoading: isCancellationDetailsLoading } =
    useQueryApi<GeneralObject>(
      type === "stay" ? "CAS_STAY_BOOKINGS" : "CAS_UTILITY_BOOKINGS",
      {
        enabled: isCancellationDetailsVisible && isValidString(booking?.id),
        select(data) {
          return data.data;
        },
        refetchOnWindowFocus: false,
      },
      `${booking?.id}/cancellation-details/`
    );

  const { mutate: updateBooking, isLoading: isUpdateBookingLoading } =
    useMutationApi(
      type === "stay" ? "CAS_STAY_BOOKINGS" : "CAS_UTILITY_BOOKINGS",
      {},
      "",
      "PUT"
    );

  const bookingInfo: DataList[] = useMemo(
    () =>
      isValidObject(booking)
        ? [
            {
              id: "booking-info",
              title: "",
              data: [
                {
                  id: "user",
                  label: "Owner",
                  content:
                    booking?.user?.nickname ||
                    booking?.user?.email_address ||
                    booking?.user?.first_name ||
                    (booking?.user?.wallet_address
                      ? formatAddress(booking.user.wallet_address)
                      : ""),
                  icon: <BadgeIcon />,
                  link: `${process.env.WEB_BASE_URL}/admin/users/${booking?.user?.pid}`,
                },
                {
                  id: "status",
                  label: "Status",
                  content: (
                    <Tag
                      bordered={false}
                      color={getBookingTagStatus(booking?.status || "")}
                    >
                      {booking?.status === "pending"
                        ? `PAYMENT ${booking?.status?.toUpperCase()}`
                        : booking?.status?.toUpperCase()}
                    </Tag>
                  ),
                  icon: <AutoModeOutlinedIcon />,
                },
                {
                  id: "code",
                  content: `Booking Id: ${shortenString(
                    String(booking?.id),
                    8
                  )}`,
                  icon: <BadgeIcon />,
                  copyText: booking?.id,
                },
                {
                  id: "start_at",
                  label: "Checkin",
                  content: (
                    <Tooltip
                      title={dayjs(booking?.start_at).format(
                        "MMMM D, YYYY h:mm A"
                      )}
                    >
                      {dayjs(booking?.start_at).format("DD MMM YYYY")}
                    </Tooltip>
                  ),
                  icon: <AccessAlarmIcon />,
                },
                {
                  id: "end_at",
                  label: "Checkout  ",
                  content: (
                    <Tooltip
                      title={dayjs(booking?.end_at).format(
                        "MMMM D, YYYY h:mm A"
                      )}
                    >
                      {dayjs(booking?.end_at).format("DD MMM YYYY")}
                    </Tooltip>
                  ),
                  icon: <AccessAlarmIcon />,
                },
                {
                  id: "reserved_by",
                  label: "Reserved By",
                  content:
                    booking?.reserved_by?.nickname ||
                    booking?.reserved_by?.email_address ||
                    booking?.reserved_by?.first_name ||
                    (booking?.reserved_by?.wallet_address
                      ? formatAddress(booking?.reserved_by?.wallet_address)
                      : "N/A"),
                  icon: <BadgeIcon />,
                  link: `${process.env.WEB_BASE_URL}/admin/users/${booking?.reserved_by?.pid}`,
                  isHidden: !isValidObject(booking?.reserved_by),
                },
                {
                  id: "created_at",
                  label: "Booked On",
                  content: (
                    <Tooltip title={moment(booking?.created_at).format("LLL")}>
                      {moment(booking?.created_at).format("MMM D, YYYY")}
                    </Tooltip>
                  ),
                  icon: <AccessAlarmIcon />,
                },
                {
                  id: "cancellation_reason",
                  content: `Cancellation Reason: ${
                    booking?.cancellation_reason || "N/A"
                  }`,
                  icon: <CancelIcon />,
                  isHidden:
                    booking?.status !== "cancelled" &&
                    !isValidString(booking?.cancellation_reason),
                },
                {
                  id: "cancelled_at",
                  label: "Cancelled At",
                  content: booking?.cancelled_at
                    ? moment(booking.cancelled_at).format("MMM D, YYYY")
                    : "N/A",
                  icon: <EventBusyIcon />,
                  isHidden:
                    !booking?.cancelled_at &&
                    !isValidString(booking?.cancellation_reason),
                },
                {
                  id: "source",
                  label: "Source",
                  content: formatCapitalize(booking?.source || "N/A"),
                  icon: <SourceIcon />,
                },
                {
                  id: "customer_notes",
                  label: "Customer Notes",
                  content: booking?.customer_notes || "N/A",
                  icon: <NoteIcon />,
                  isHidden: !isValidString(booking?.customer_notes),
                },
                {
                  id: "guest_notes",
                  label: "Guest Notes",
                  content: booking?.guest_notes || "N/A",
                  icon: <StickyNote2Icon />,
                  isHidden: !isValidString(booking?.guest_notes),
                },
                {
                  id: "internal_notes",
                  label: "Internal Notes",
                  content: booking?.internal_notes || "N/A",
                  icon: <AssignmentIcon />,
                  isHidden: !isValidString(booking?.internal_notes),
                },
                {
                  id: "client",
                  label: "Client ID",
                  content: shortenString(booking?.client || "", 8),
                  icon: <PersonIcon />,
                  copyText: booking?.client,
                  isHidden: !isValidString(booking?.client),
                },
                {
                  id: "currency",
                  label: "Currency",
                  content: booking?.currency || "N/A",
                  icon: <PaidIcon />,
                  isHidden: !isValidString(booking?.currency),
                },
                {
                  id: "coupon",
                  label: "Coupon",
                  content: booking?.coupon || "N/A",
                  icon: <LocalOfferIcon />,
                  isHidden: !isValidString(booking?.coupon),
                  link: `${process.env.WEB_BASE_URL}/admin/misc/coupons/${booking?.coupon}`,
                },
              ],
            },
          ]
        : [],
    [booking]
  );

  const totalOccupancy: number = [
    ...new Set((booking?.booked_skus || []).map((item) => item.sku.pid)),
  ].length;

  const addedGuests = booking?.customers?.length || 0;

  const isButtonDisabled = totalOccupancy === addedGuests;

  const handleCancelBooking = (id: string, reason: string) => {
    updateBooking(
      {
        data: { reason },
        route: `${id}/cancel/`,
      },
      {
        onSuccess() {
          message.success("Booking has been Cancelled");
          refetchBooking();
          hideCancellationDetails();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleUpdateStatus = async (
    id: string,
    status: "approve" | "cancel" | "checkout",
    onSuccess?: () => void
  ) => {
    updateBooking(
      {
        data: {},
        route: `${id}/${status}/`,
      },
      {
        onSuccess,
      }
    );
  };

  const bookedInventory: Inventory | undefined = useMemo(
    () => booking?.booked_skus[0]?.sku?.inventory,
    [booking?.booked_skus]
  );

  const bookingAction: { actionButtons: ActionButton[] } = {
    actionButtons:
      booking?.status === "requested"
        ? [
            {
              label: "Approve",
              onClick: handleUpdateStatus.bind(
                null,
                booking?.id,
                "approve",
                refetchBooking
              ),
              buttonProps: {
                type: "primary",
              },
            },
            {
              label: "Reject",
              onClick: handleUpdateStatus.bind(
                null,
                booking?.id,
                "cancel",
                refetchBooking
              ),
              buttonProps: {
                type: "primary",
                danger: true,
              },
            },
          ]
        : booking && ["pending", "confirmed"].includes(booking?.status)
        ? [
            {
              label: "Cancel",
              type: "link",
              onClick: showCancellationDetails,
              buttonProps: {
                type: "link",
                danger: true,
              },
            },
          ]
        : booking?.status === "checkin"
        ? [
            {
              label: "Checkout Guest",
              type: "primary",
              onClick: handleUpdateStatus.bind(
                null,
                booking?.id,
                "checkout",
                refetchBooking
              ),
              buttonProps: {
                type: "primary",
              },
            },
          ]
        : [],
  };

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        loading={isLoadingBooking}
        className="flex flex-col !px-0 overflow-hidden"
        size="large"
        title={
          isValidString(
            booking?.user?.first_name ||
              booking?.user?.nickname ||
              booking?.user?.email_address
          ) ? (
            <Flex align="center" gap="16px">
              <Avatar
                src={booking?.user?.avatar?.image}
                size={32}
                style={{ backgroundColor: "#f56a00" }}
              >
                {booking?.user?.nickname?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <Flex vertical>
                <Typography.Text
                  strong
                  style={{
                    margin: 0,
                  }}
                >
                  {booking?.user?.nickname || "No Nickname"}
                </Typography.Text>
                {booking?.user?.membership === "founder" && (
                  <Typography.Text
                    type="secondary"
                    style={{
                      margin: 0,
                    }}
                  >
                    Founder Member
                  </Typography.Text>
                )}
              </Flex>
            </Flex>
          ) : (
            <span className="text-zui-silver">Guest</span>
          )
        }
        extra={
          <div className="flex items-center gap-6">
            {bookingAction.actionButtons.map((button, index) => (
              <Button
                type={button.buttonProps?.type}
                key={index}
                onClick={button.onClick}
                danger={button.buttonProps?.danger}
              >
                {button.label}
              </Button>
            ))}
          </div>
        }
      >
        <Flex justify="space-between" gap="16px">
          <Flex vertical className="flex-1">
            <Typography.Text
              strong
              type="secondary"
              style={{ textTransform: "uppercase", fontSize: "16px" }}
            >
              Booking Info
            </Typography.Text>

            <DataListDisplay data={bookingInfo} />

            <Divider className="my-3" />
            {booking && (
              <PaymentInfoSection booking={booking} className="py-6" />
            )}
          </Flex>

          <div className="min-h-full border-r border-zui-light" />
          <div className="flex flex-col flex-1">
            <Card className="mb-4 bg-[#141414] border-[#303030]" size="small">
              <div className="flex justify-between mb-2">
                <Typography.Text strong>Guest Progress</Typography.Text>
                <Typography.Text type="secondary">
                  {addedGuests}/{totalOccupancy} Guests Added
                </Typography.Text>
              </div>
              <div className="flex items-center gap-4">
                <Progress
                  type="circle"
                  size={80}
                  percent={Math.round((addedGuests / totalOccupancy) * 100)}
                  status={addedGuests === totalOccupancy ? "success" : "active"}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="text-center">
                    <Typography.Text type="secondary" className="text-xs">
                      Booked Space
                    </Typography.Text>
                    <Typography.Title level={5} className="!m-0">
                      {totalOccupancy}
                    </Typography.Title>
                  </div>
                  <div className="text-center">
                    <Typography.Text type="secondary" className="text-xs">
                      Guest Added
                    </Typography.Text>
                    <Typography.Title level={5} className="!m-0">
                      {addedGuests}
                    </Typography.Title>
                  </div>
                </div>
              </div>
            </Card>

            <Flex
              justify="space-between"
              align="center"
              className="w-full mt-6"
            >
              <Typography.Text
                strong
                type="secondary"
                style={{ textTransform: "uppercase", fontSize: "16px" }}
              >
                Guests Info
              </Typography.Text>
              <Button
                type="primary"
                shape="default"
                size="small"
                icon={<AddOutlinedIcon />}
                onClick={showAddGuest}
                disabled={isButtonDisabled}
              />
            </Flex>

            <GuestInfoSection
              guests={booking?.customers || []}
              type={type}
              bookingId={booking?.id || ""}
              bookedInventory={bookedInventory}
              start_at={booking?.start_at || ""}
              end_at={booking?.end_at || ""}
              refetchBooking={refetchBooking}
              bookedSkus={booking?.booked_skus || []}
              kycDocuments={booking?.kyc_documents || []}
            />
          </div>
        </Flex>
        {booking && (
          <AddBookingUserSidebar
            isOpen={isAddGuestVisible}
            onClose={hideAddGuest}
            booking={booking}
            refetchBooking={refetchBooking}
          />
        )}
      </Drawer>

      <Modal
        open={isCancellationDetailsVisible}
        onCancel={hideCancellationDetails}
        title={
          <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
            Cancel Booking
          </Typography.Title>
        }
        centered
        maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        className="dark-theme-modal"
        footer={
          booking && isValidObject(cancellationDetails) ? (
            <Button
              type="primary"
              danger
              loading={isUpdateBookingLoading}
              onClick={handleCancelBooking.bind(
                null,
                booking?.id,
                cancellationReason
              )}
              className="whitespace-nowrap"
            >
              Cancel Booking
            </Button>
          ) : null
        }
      >
        <Spin spinning={isCancellationDetailsLoading}>
          {isValidObject(cancellationDetails) ? (
            <div className="space-y-6">
              <Alert
                message="Warning"
                description="Are you sure you want to cancel this booking? Please note that cancellation policies may apply. This action is irreversible."
                type="warning"
                showIcon
                className="mb-4"
              />

              <Typography.Paragraph>
                If you have any questions or need assistance, please contact our
                support team.
              </Typography.Paragraph>

              {cancellationDetails && isValidObject(cancellationDetails) && (
                <div className="bg-[#141414] p-4 rounded-lg">
                  <Typography.Text className="text-white text-sm mb-2 block">
                    Please review the cancellation details below:
                  </Typography.Text>

                  <div className="bg-[#1f1f1f] p-3 rounded border border-[#303030]">
                    {Object.keys(cancellationDetails).map((key: string) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-1.5 border-b border-[#303030] last:border-0"
                      >
                        <span className="text-[#8c8c8c] text-sm">
                          {formatCapitalize(key)}
                        </span>
                        <span className="text-white text-sm">
                          {cancellationDetails[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Typography.Text className="block mb-2">
                  Reason for cancellation
                </Typography.Text>
                <Input.TextArea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                  className="bg-[#1f1f1f] border-[#303030] text-white hover:border-[#434343] focus:border-[#434343]"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <Alert
              message="Cannot Cancel Booking"
              description="This booking has already started and cannot be cancelled."
              type="error"
              showIcon
            />
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default BookingInfoSidebar;
