import {
  TeamOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Button, Col, Row, Tag, Typography } from "antd";
import moment from "moment";
import React, { useMemo } from "react";
import { TripCustomer } from "../../config";

const { Title, Text } = Typography;

interface BookedSku {
  id: number;
  customers: string[];
  status: string;
  sku: {
    id: string;
    name: string;
  };
}

interface GuestInformationProps {
  user?: {
    first_name?: string;
    last_name?: string;
    email_address?: string;
    mobile_number?: string;
  };
  customers?: TripCustomer[];
  bookedSkus?: BookedSku[];
  onGuestCancel: (customer: TripCustomer) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "error";
    case "cancelled":
      return "warning";
    default:
      return "default";
  }
};

const getPeriskopeLink = (mobile: string): string | undefined => {
  if (!mobile) return undefined;
  const formattedMobile = mobile.startsWith("+") ? mobile : `+${mobile}`;
  return `https://console.periskope.app/chats?chat_id=${encodeURIComponent(
    formattedMobile
  )}`;
};

const handlePeriskopeChat = (mobile: string | undefined) => {
  if (!mobile) return;

  const link = getPeriskopeLink(mobile);

  if (link) window.open(link, "_blank");
};

const GuestInformation: React.FC<GuestInformationProps> = ({
  user,
  customers,
  bookedSkus,
  onGuestCancel,
}) => {
  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "actions",
        title: "Actions",
        dataIndex: "actions",
        width: "120px",
        render: (_, data) => {
          const isCancelled = data?.status === "cancelled";

          if (isCancelled) {
            return (
              <Tag color="warning" className="text-xs">
                Cancelled
              </Tag>
            );
          }

          return (
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => onGuestCancel(data as TripCustomer)}
              className="text-xs"
            >
              Partial Cancel
            </Button>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (_, data) => {
          return <Tag color={getStatusColor(data?.status)}>{data?.status}</Tag>;
        },
      },
      {
        title: "Name",
        dataIndex: "fullName",
        key: "fullName",
        render: (_, data) => data?.fullName,
      },
      {
        title: "Email Address",
        dataIndex: "email",
        key: "email",
        render: (email) => <Typography.Text copyable>{email}</Typography.Text>,
        ellipsis: true,
      },
      {
        title: "Mobile",
        dataIndex: "mobile",
        key: "mobile",
        render: (_, data) => {
          return data?.mobile ? (
            <span
              onClick={() => handlePeriskopeChat(data?.mobile)}
              className="cursor-pointer"
            >
              {data?.mobile} <WhatsAppOutlined className=" ml-2" />
            </span>
          ) : (
            <span className="text-zui-silver">N/A</span>
          );
        },
      },
      {
        title: "Country",
        dataIndex: "country",
        key: "nationality",
        render: (_, data) => {
          return data?.nationality ? data?.nationality?.name : "N/A";
        },
      },
      {
        key: "gender",
        title: "Gender",
        dataIndex: "gender",
        render: (cell) =>
          cell ? (
            <Tag
              bordered={false}
              color={cell.toLowerCase() === "male" ? "blue" : "pink"}
            >
              {cell}
            </Tag>
          ) : (
            "-"
          ),
      },
      {
        title: "Age",
        dataIndex: "age",
        key: "age",
        render: (_, data) => {
          return data?.age;
        },
      },

      {
        key: "address",
        title: "Address",
        dataIndex: "address",
        width: "320px",
        render(cell) {
          return (
            <p className="max-w-[320px] whitespace-normal">
              {String(cell).substring(0, 60)}
              {String(cell).length > 60 ? "..." : ""}
            </p>
          );
        },
      },
    ],
    [onGuestCancel]
  );

  const tableData =
    customers
      ?.slice()
      .sort(
        (firstCustomer: TripCustomer, secondCustomer: TripCustomer) =>
          new Date(firstCustomer.created_at || 0).getTime() -
          new Date(secondCustomer.created_at || 0).getTime()
      )
      .map((customer: TripCustomer, index: number) => {
        const guestSku = bookedSkus?.find((sku: BookedSku) =>
          sku.customers.includes(customer.id)
        );
        return {
          ...customer,
          fullName: `${customer?.first_name || ""} ${
            customer?.middle_name || ""
          } ${customer?.last_name || ""}`.trim(),
          status: guestSku?.status,
          age: customer?.date_of_birth
            ? moment().diff(moment(customer.date_of_birth), "years")
            : null,
        };
      }) || [];

  return (
    <div className="space-y-6">
      {/* Enhanced Guest Status Dashboard */}
      <div className="bg-zui-light p-6 ">
        <div className="flex items-center mb-6">
          <div className="bg-zui-dark p-3 rounded-2xl mr-4">
            <TeamOutlined className=" text-xl" />
          </div>
          <div>
            <Title level={5} className="text-zui-white m-0">
              Guest Dashboard
            </Title>
            <Text className="text-zui-silver">
              Overview of all booking participants
            </Text>
          </div>
        </div>

        <Row gutter={[24, 16]}>
          <Col span={8}>
            <div className="bg-zui-dark p-6 relative overflow-hidden financial-card">
              <div className="relative z-10 text-center">
                <div className="text-base  text-white mb-2">
                  {bookedSkus?.length || 0}
                </div>
                <Text className="text-zui-silver text-xs  uppercase tracking-wider">
                  Total Slots
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-zui-dark p-6  relative overflow-hidden financial-card">
              <div className="relative z-10 text-center">
                <div className="text-base  text-white mb-2">
                  {customers?.length || 0}
                </div>
                <Text className="text-zui-silver text-xs  uppercase tracking-wider">
                  Added Guest
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="bg-zui-dark p-6  relative overflow-hidden financial-card">
              <div className="relative z-10 text-center">
                <div className="text-base  text-white mb-2">
                  {bookedSkus?.filter(
                    (sku: BookedSku) => sku.status === "cancelled"
                  ).length || 0}
                </div>
                <Text className="text-zui-silver text-xs  uppercase tracking-wider">
                  Cancelled
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        {/* Status Messages */}
        <div className="mt-6 space-y-3">
          {bookedSkus?.length &&
            customers?.length &&
            bookedSkus.length > customers.length && (
              <div className="p-3 bg-zui-orange bg-opacity-20 border border-zui-orange rounded-lg">
                <Text className="text-zui-orange">
                  ⚠️ {bookedSkus.length - customers.length} more guest(s) need
                  to be added
                </Text>
              </div>
            )}
        </div>
      </div>

      {/* Enhanced Booked By Section */}
      <div className="bg-zui-light p-6 ">
        <div className="flex items-center mb-6">
          <div className="bg-zui-dark p-3 rounded-2xl shadow-lg mr-4">
            <UserOutlined className="text-xl" />
          </div>
          <div>
            <Title level={5} className="text-zui-white m-0">
              Booking Owner
            </Title>
            <Text className="text-zui-silver">Primary contact</Text>
          </div>
        </div>
        <div className="bg-zui-dark p-6">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div>
                <Text className="text-zui-silver text-sm">Full Name</Text>
                <div className="text-zui-white font-medium">
                  {`${user?.first_name || "N/A"} ${
                    user?.last_name || ""
                  }`.trim()}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text className="text-zui-silver text-sm">Email</Text>
                <div className="text-zui-white font-medium">
                  {user?.email_address || "N/A"}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text className="text-zui-silver text-sm">Mobile</Text>
                <div className="flex items-center gap-2">
                  <span className="text-zui-white font-medium">
                    {user?.mobile_number || "N/A"}
                  </span>
                  {user?.mobile_number && (
                    <Button
                      type="text"
                      icon={<WhatsAppOutlined />}
                      size="small"
                      className="text-zui-green hover:text-zui-neon"
                      title="Open Periskope Chat"
                      onClick={() => handlePeriskopeChat(user?.mobile_number)}
                    />
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {customers && customers.length > 0 && (
        <div className="bg-zui-light p-6">
          <div className="flex items-center mb-6">
            <div className="bg-zui-dark p-3 rounded-2xl mr-4">
              <TeamOutlined className=" text-xl" />
            </div>
            <div>
              <Title level={5} className="text-zui-white m-0">
                Trip Participants ({customers.length})
              </Title>
              <Text className="text-zui-silver">
                Complete list of all guests joining this trip
              </Text>
            </div>
          </div>

          <ZudTable
            data={tableData}
            isLoading={false}
            columns={columns}
            keyExtractor={(row) => row.id.toString()}
          />
        </div>
      )}
    </div>
  );
};

export default GuestInformation;
