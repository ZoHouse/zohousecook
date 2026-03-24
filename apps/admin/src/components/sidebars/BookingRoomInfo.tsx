import { MailOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import {
  Avatar,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Image,
  Space,
  Typography,
} from "antd";
import React, { useMemo } from "react";

interface BookingRoomInfoProps {
  isOpen: boolean;
  onClose: () => void;
  room: GeneralObject | null;
  booking: GeneralObject;
}

interface GuestInfoType {
  name: string;
  email: string;
  gender: string;
}

const BookingRoomInfo: React.FC<BookingRoomInfoProps> = ({
  isOpen,
  onClose,
  room,
  booking,
}) => {
  const roomCustomerDetails = room?.customers?.map((customerId: string) =>
    booking?.customers?.find(
      (customer: GeneralObject) => customer.id === customerId
    )
  );

  const guestInfo = useMemo(() => {
    if (!isValidObject(roomCustomerDetails)) return [];

    return roomCustomerDetails.map(
      (guest: GeneralObject | undefined): GuestInfoType => ({
        name: `${guest?.first_name || ""} ${guest?.last_name || ""}`,
        email: guest?.email || "No Email",
        gender: guest?.gender || "Not specified",
      })
    );
  }, [roomCustomerDetails]);

  return (
    <Drawer
      title={
        <Typography.Title level={4} style={{ margin: 0, color: "#fff" }}>
          {`${room?.sku?.name} and Guest Details`}
        </Typography.Title>
      }
      open={isOpen}
      onClose={onClose}
      placement="right"
    >
      <div className="flex flex-col flex-1 gap-4">
        {isValidObject(room) ? (
          <>
            <Typography.Title level={5} className="text-white mb-4">
              Room Information
            </Typography.Title>
            {room?.sku?.inventory?.media?.length > 0 &&
            room?.sku?.inventory?.media[0]?.url ? (
              <Image
                className="w-full object-cover mb-4"
                src={room?.sku?.inventory.media[0].url}
                alt="Room"
                preview={false}
              />
            ) : (
              <Empty description="No Image Available" className="my-4" />
            )}

            <Descriptions column={1} className="text-white">
              <Descriptions.Item
                label={<span className="text-white">Room Name</span>}
              >
                <span className="text-white">{room?.sku?.name}</span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="text-white">Occupancy</span>}
              >
                <span className="text-white">
                  {room?.sku?.inventory?.occupancy}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="text-white">Category</span>}
              >
                <span className="text-white">
                  {room?.sku?.inventory?.category}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="text-white">Coupon Discount</span>}
              >
                <span className="text-white">
                  {room?.coupon_discount || "No Discount"}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider className="bg-gray-700" />

            <Typography.Title level={5} className="text-white mb-4">
              Guest Information
            </Typography.Title>
            {guestInfo.length > 0 ? (
              guestInfo.map((guest: GuestInfoType, index: number) => (
                <Card
                  key={index}
                  className="mb-6 bg-transparent border-gray-700"
                >
                  <Typography.Title level={5} className="text-white mb-3">
                    Guest {index + 1}
                  </Typography.Title>
                  <Space direction="vertical" size="middle" className="w-full">
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <Typography.Text className="text-white">
                        {guest.name || "No Name"}
                      </Typography.Text>
                    </Space>
                    <Space>
                      <Avatar icon={<MailOutlined />} />
                      <Typography.Link
                        href={`mailto:${guest.email}`}
                        className="text-white hover:text-blue-400"
                      >
                        {guest.email}
                      </Typography.Link>
                    </Space>
                    <Space>
                      <Avatar icon={<TeamOutlined />} />
                      <Typography.Text className="text-white capitalize">
                        {guest.gender?.toLowerCase() || "Not Specified"}
                      </Typography.Text>
                    </Space>
                  </Space>
                </Card>
              ))
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text className="text-white">
                    No guests assigned
                  </Typography.Text>
                }
              />
            )}
          </>
        ) : (
          <Empty
            description={
              <span className="text-white">No room information found</span>
            }
          />
        )}
      </div>
    </Drawer>
  );
};

export default BookingRoomInfo;
