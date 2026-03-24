import {
  BadgeOutlined,
  EmailOutlined,
  PersonOutlineOutlined,
  PhoneOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import {
  Avatar,
  Button,
  Collapse,
  Flex,
  List,
  message,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Booking,
  Inventory,
  SkuAvailability,
} from "apps/admin/src/config/typings";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { BookingUserInfoSidebar } from "../../sidebars";

const { Text } = Typography;

const IconText = ({
  icon,
  text,
  link,
}: {
  icon: React.ReactNode;
  text: string | null;
  link?: string;
}) => (
  <Space>
    {icon}
    <Text
      onClick={() => link && window.open(link, "_blank")}
      className={`${
        link && "cursor-pointer hover:text-zui-neon hover:underline"
      } `}
    >
      {text || "N/A"}
    </Text>
  </Space>
);

interface GuestInfoSectionProps {
  guests: Booking["customers"];
  type: "stay" | "utility";
  bookingId: string;
  bookedInventory: Inventory | undefined;
  start_at: string;
  end_at: string;
  refetchBooking: () => void;
  bookedSkus: Booking["booked_skus"];
  kycDocuments: Booking["kyc_documents"];
}

const GuestInfoSection: React.FC<GuestInfoSectionProps> = ({
  guests,
  type,
  bookingId,
  bookedInventory,
  start_at,
  end_at,
  refetchBooking,
  bookedSkus,
  kycDocuments,
}) => {
  const profile = useProfile();
  const [selectedGuest, setSelectedGuest] = useState<
    Booking["customers"][0] | null
  >(null);

  const [isGuestInfoVisible, showAddGuestInfo, hideAddGuestInfo] =
    useVisibilityState();

  const { mutate: assignSKU, isLoading: isAssignSKULoading } = useMutationApi(
    type === "utility" ? "CAS_UTILITY_BOOKINGS" : "CAS_STAY_BOOKINGS",
    {},
    `${bookingId}/assign-skus/`,
    "POST"
  );

  const { mutate: removeCustomer, isLoading: isDeleteCustomerLoading } =
    useMutationApi("CAS_CUSTOMERS", {}, "", "DELETE");

  const bookedSkusIds = [
    ...new Set(bookedSkus.map((item: GeneralObject) => item.sku.pid)),
  ];

  const skusAvailabilityQueryParam = useMemo(() => {
    if (bookedSkusIds && bookedSkusIds.length > 0) {
      const dateRange = {
        start: start_at,
        end: end_at,
      };

      return "skus="
        .concat(bookedSkusIds.join(","))
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
  }, [type, start_at, end_at, profile]);

  const skuOptions = useMemo(() => {
    const uniqueOptions = new Map();
    const availableSkus = bookedSkus?.filter(
      (item) => item.customers.length === 0
    );

    availableSkus.forEach((item) => {
      if (!uniqueOptions.has(item.sku.pid)) {
        uniqueOptions.set(item.sku.pid, {
          label: `${item.sku.inventory.name} - (${item.sku.name})`,
          value: item.sku.pid,
          // disabled: hasNoAvailability, // Disable if any date has 0 units
        });
      }
    });

    return Array.from(uniqueOptions.values());
  }, [bookedSkus]);

  const handleRemoveGuest = (customerId: string) => {
    removeCustomer(
      {
        data: {},
        route: `${customerId}/`,
      },
      {
        onSuccess: () => {
          refetchBooking();
        },
      }
    );
  };

  const handleAssignSKU = (skuId: string, customerId: string) => {
    assignSKU(
      {
        data: {
          assignments: [
            {
              sku: skuId,
              customers: [customerId],
            },
          ],
        },
      },
      {
        onSuccess() {
          message.success("SKU Assigned!");
          refetchBooking();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
    refetchBooking();
  };

  const handleShowGuestInfo = (guest: Booking["customers"][0]) => {
    setSelectedGuest(guest);
    showAddGuestInfo();
  };

  const items = guests.map((guest) => {
    const isValidGuest = !!guest.user && isValidObject(guest.kyc);
    const assignedSku =
      bookedSkus.filter((item: GeneralObject) =>
        item.customers.includes(guest.id)
      )[0]?.sku.pid || null;

    return {
      key: guest.id,
      className: "border border-zui-light py-2 px-4 mb-2 rounded-md",
      label: (
        <div>
          <Space size="large">
            <Avatar
              size={36}
              icon={<PersonOutlineOutlined />}
              src={guest.user?.pfp_image || guest.user?.avatar?.image}
            />
            <Flex vertical>
              <Text ellipsis={true} strong className="whitespace-nowrap">
                {`${guest.first_name} ${guest.middle_name || ""} ${
                  guest.last_name
                }`.trim()}
                {guest.gender && (
                  <Tag
                    color={guest.gender === "Male" ? "blue" : "pink"}
                    className="ml-2"
                  >
                    {guest.gender}
                  </Tag>
                )}

                {isValidGuest && (
                  <Tooltip title="Verified User">
                    <VerifiedOutlined fontSize="small" color="success" />
                  </Tooltip>
                )}
              </Text>
              <Typography.Text type="secondary">
                {guest.user?.nickname}
              </Typography.Text>
            </Flex>
          </Space>
        </div>
      ),
      children: (
        <div className="ml-2">
          <Space direction="vertical" size="small" className="w-full">
            <List
              size="small"
              split={false}
              className="px-0"
              dataSource={[
                {
                  icon: <BadgeOutlined fontSize="small" />,
                  text: guest.user?.nickname || "",
                  show: !!guest.user?.nickname,
                  link: `${process.env.WEB_BASE_URL}/admin/users/${guest?.user?.pid}`,
                },
                {
                  icon: <EmailOutlined fontSize="small" />,
                  text: guest.email || "",
                  show: !!guest.email,
                  link: `mailto:${guest.email}`,
                },
                {
                  icon: <PhoneOutlined fontSize="small" />,
                  text: guest.mobile || guest.user?.mobile_number || "",
                  show: !!(guest.mobile || guest.user?.mobile_number),
                  link: `tel:${guest.mobile || guest.user?.mobile_number}`,
                },
                {
                  icon: <AlternateEmailOutlinedIcon fontSize="small" />,
                  text: guest.user?.twitter_handle || "",
                  show: !!guest.user?.twitter_handle,
                  link: `https://twitter.com/${guest.user?.twitter_handle}`,
                },
              ].filter((item) => item.show)}
              renderItem={(item: { icon: any; text: string; link: string }) => (
                <List.Item style={{ paddingLeft: "0", paddingRight: "0" }}>
                  <IconText
                    icon={item.icon}
                    text={item.text}
                    link={item.link}
                  />
                </List.Item>
              )}
            />

            <Flex
              vertical
              justify="space-between"
              align="start"
              className="w-full mt-6"
            >
              Assigned Room <br />
              <Select
                placeholder="None"
                disabled={!isValidString(bookedInventory?.id)}
                options={skuOptions}
                popupMatchSelectWidth={false}
                onSelect={(value) => handleAssignSKU(value, guest.id)}
                value={assignedSku}
                className="w-full mt-2"
              />
            </Flex>

            <Flex
              className="w-full mt-4 px-3 py-2 bg-zui-lighter rounded-md border border-zui-light"
              justify="space-evenly"
              align="center"
              gap="small"
            >
              <Button
                type="text"
                icon={<EditOutlinedIcon />}
                onClick={handleShowGuestInfo.bind(null, guest)}
                size="small"
                className="hover:bg-zui-light"
              >
                Edit
              </Button>

              <Button
                type="text"
                danger
                icon={<DeleteOutlineOutlinedIcon />}
                onClick={handleRemoveGuest.bind(null, guest.id)}
                size="small"
                className="hover:bg-red-50"
              >
                Delete
              </Button>
            </Flex>
          </Space>
        </div>
      ),
    };
  });

  return (
    <>
      {" "}
      <Spin spinning={isAssignSKULoading || isDeleteCustomerLoading}>
        <Collapse
          items={items}
          className="mt-6 bg-zui-lighter border border-zui-lighter payment-info-collapse"
          expandIconPosition="end"
        />
      </Spin>
      {bookingId && (
        <BookingUserInfoSidebar
          isOpen={isGuestInfoVisible}
          onClose={hideAddGuestInfo}
          guest={selectedGuest}
          documents={kycDocuments}
          refetchBooking={refetchBooking}
        />
      )}
    </>
  );
};

export default GuestInfoSection;
