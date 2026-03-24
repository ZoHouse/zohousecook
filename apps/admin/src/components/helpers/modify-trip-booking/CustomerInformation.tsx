import { UserOutlined } from "@ant-design/icons";
import { Card, Typography } from "antd";
import { TripBooking } from "apps/admin/src/config/typings";
import moment from "moment";
import React from "react";

const { Text } = Typography;

interface CustomerInformationProps {
  bookingData: TripBooking;
}

const CustomerInformation: React.FC<CustomerInformationProps> = ({
  bookingData,
}) => {
  const lastCustomer =
    bookingData?.customers?.length > 0
      ? bookingData.customers[bookingData.customers.length - 1]
      : bookingData?.user;

  return (
    <Card
      className=""
      title={
        <div className="flex items-center gap-2">
          <UserOutlined className="text-zui-silver" />
          <span className="text-zui-silver font-medium">
            Customer Information
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Primary Information */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-base">
              {lastCustomer?.first_name} {lastCustomer?.last_name}
            </div>
            <Text className="text-sm text-zui-silver">
              {lastCustomer?.email || "N/A"}
            </Text>
          </div>
          <div className="text-right">
            <div className="text-sm  font-medium">
              {lastCustomer?.mobile || "N/A"}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-2 gap-4">
          {lastCustomer?.date_of_birth && (
            <div>
              <Text className="text-xs uppercase tracking-wide ">
                Date of Birth
              </Text>
              <div className="text-zui-silver font-medium">
                {moment(lastCustomer.date_of_birth).format("DD MMM YYYY")}
              </div>
            </div>
          )}

          {lastCustomer?.gender && (
            <div>
              <Text className="text-xs uppercase tracking-wide">Gender</Text>
              <div className="text-zui-silver font-medium capitalize">
                {lastCustomer.gender}
              </div>
            </div>
          )}

          {lastCustomer?.nationality && (
            <div>
              <Text className="text-xs uppercase tracking-wide ">
                Nationality
              </Text>
              <div className="text-zui-silver font-medium">
                {lastCustomer.nationality.name}
              </div>
            </div>
          )}
          {/* Address Information */}
          {lastCustomer?.address && (
            <div>
              <Text className="text-xs  uppercase tracking-wide ">Address</Text>
              <div className="text-zui-silver font-medium">
                {lastCustomer.address}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CustomerInformation;
