import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  HomeOutlined,
  MinusOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Form, FormElementType, UserMini } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormData } from "@zo/utils/hooks";
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  List,
  Result,
  Row,
  Steps,
  Typography,
} from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Currency, User } from "../../config";

interface AddBatchBookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  data: GeneralObject;
  batchAvailability: GeneralObject;
}

const formatPrice = (price: number, currency: Currency) => {
  return `${currency.symbol} ${(
    price * Math.pow(10, -currency.decimals || -8)
  ).toLocaleString()}`;
};

const GuestCounter: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-4">
      <Button
        icon={<MinusOutlined />}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
      />
      <span className="text-lg font-medium w-8 text-center">{value}</span>
      <Button
        icon={<PlusOutlined />}
        onClick={() => onChange(Math.min(10, value + 1))}
        disabled={value === 10}
      />
    </div>
  );
};

const AddBatchBooking: React.FC<AddBatchBookingSidebarProps> = ({
  isOpen,
  onClose,
  refetch,
  data,
  batchAvailability,
}) => {
  const { formData, handleChange, resetFormData, getFormValue } = useFormData(
    {}
  );

  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [discount, setDiscount] = useState<number>(0);
  const [screen, setScreen] = useState<number>(1);
  const [countdown, setCountdown] = useState(3);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: skuPricingList } = useQueryApi<GeneralObject>(
    "CAS_TRIP_DISCOVER_PRICING",
    {
      enabled: data !== undefined && formData?.user?.pid !== undefined,
      select: (data) => data.data.results,
    },
    ``,
    `sku=${data?.skus?.[0]?.pid}&user_pid=${
      formData?.user?.pid
    }&start_date=${moment().format("YYYY-MM-DD")}&end_date=${moment()
      .add(3, "months")
      .format("YYYY-MM-DD")}&type=trip&limit=20`
  );

  useEffect(() => {
    if (screen === 4) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (formData.batch_date) {
      setSelectedDate(formData.batch_date);
    }
  }, [formData.batch_date]);

  const { mutate: updateBooking } = useMutationApi("CAS_TRIP_BOOKINGS");

  const handleClose = () => {
    setScreen(1);
    resetFormData();
    onClose();
  };

  const bookRoom = async () => {
    const selectedBatch = batchAvailability.find(
      (batch: any) => batch.date === selectedDate
    );

    if (!selectedBatch) {
      message.error("Invalid batch selection");
      return;
    }

    if (selectedBatch.units === 0) {
      message.error("No spots available for this batch");
      return;
    }

    updateBooking(
      {
        data: {
          date: selectedDate,
          sku: data?.skus?.[0]?.pid,
          user_pid: formData.user?.pid,
          offer_discount: discount,
          guest_count: formData.guest_count || 0,
        },
      },
      {
        onError(error) {
          message.error(processResponseError(error));
          queryClient.invalidateQueries({
            queryKey: ["cas", "trip", "bookings"],
          });
          refetch();
          handleClose();
        },
        onSuccess(data) {
          setScreen((prev) => prev + 1);
          queryClient.invalidateQueries({
            queryKey: ["cas", "trip", "bookings"],
          });
          refetch();
          setTimeout(handleClose, 3000);
        },
      }
    );
  };

  const nextScreenHandler = () => {
    if (screen === 1) {
      if (!formData.user) {
        message.warning("Please Select User");
        return;
      }
      if (!selectedDate) {
        message.warning("Please Select Batch Date");
        return;
      }
      return bookRoom();
    }
    handleClose();
  };

  const previousScreenHandler = () => {
    if (screen <= 1) {
      return;
    }
    setScreen((prev) => prev - 1);
  };

  const footerButtons = (
    <div className="flex justify-end gap-4">
      {screen !== 4 && screen !== 1 && (
        <Button onClick={previousScreenHandler} icon={<ArrowLeftOutlined />}>
          Back
        </Button>
      )}
      {screen !== 4 && (
        <Button
          type="primary"
          onClick={nextScreenHandler}
          icon={<ArrowRightOutlined />}
        >
          {screen < 3 ? "Next" : screen === 3 ? "Confirm Booking" : "Next"}
        </Button>
      )}
    </div>
  );

  const formFields: FormElementType[] = [
    {
      name: "user",
      label: "User",
      type: "searchselect",
      searchQueryApi: "CAS_PROFILES",
      selectedValueSelector(data) {
        return data?.first_name || data?.nickname;
      },
      searchQueryResultRenderer: (result) => <UserMini data={result as User} />,
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
    },
    {
      name: "batch_date",
      label: "Batch Date",
      type: "select",
      options:
        batchAvailability?.map((batch: any) => ({
          label: `${moment(batch.date).format("DD MMM YYYY")} (${
            batch.units
          } spots available)`,
          value: batch.date,
          disabled: batch.units === 0,
        })) || [],
    },
  ];

  const steps = [
    { title: "Guest Details & Review", icon: <UserOutlined /> },
    { title: "Confirmation", icon: <CheckSquareOutlined /> },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center justify-between">
          <span>{screen === 1 ? "Guest Details & Review" : ""}</span>
          {screen !== 3 && (
            <Steps
              size="small"
              current={screen - 1}
              items={steps}
              className="max-w-[400px]"
            />
          )}
        </div>
      }
      width={"80%"}
      footer={footerButtons}
      destroyOnClose
    >
      {screen === 1 && (
        <div className="p-8">
          <Row gutter={[32, 32]} className="max-w-7xl mx-auto">
            <Col span={12}>
              <Card
                title={
                  <div className="flex items-center py-2">
                    <UserOutlined className=" text-xl mr-3" />
                    <span className="text-lg font-semibold">
                      Guest Information
                    </span>
                  </div>
                }
                bordered={false}
              >
                <Form
                  getFormValue={getFormValue}
                  formFields={formFields}
                  handleChange={handleChange}
                  formData={formData}
                />

                <div className="mt-8 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Typography.Text strong className="text-lg">
                        Additional Guests
                      </Typography.Text>
                      <Typography.Text className="block text-zui-silver mt-1">
                        Add more guests to your booking
                      </Typography.Text>
                    </div>
                    <GuestCounter
                      value={formData.guest_count || 0}
                      onChange={(value) =>
                        handleChange("guest_count", "number", value)
                      }
                    />
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column */}
            <Col span={12}>
              <Card bordered={false}>
                <div className="relative h-56 overflow-hidden mb-6">
                  <img
                    src={
                      data && data?.media?.length > 0 ? data?.media[0].url : ""
                    }
                    className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500"
                    alt="Trip Package"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zui-dark to-transparent p-4">
                    <Typography.Title level={4} className=" m-0">
                      {data?.name || "Trip Package"}
                    </Typography.Title>
                  </div>
                </div>

                <List
                  itemLayout="horizontal"
                  className="booking-summary"
                  dataSource={[
                    {
                      icon: <UserOutlined />,
                      title: "Booking for",
                      value: formData.user?.nickname || "-",
                    },
                    {
                      icon: <UserOutlined />,
                      title: "Additional Guests",
                      value: formData.guest_count || 0,
                    },
                    {
                      icon: <HomeOutlined />,
                      title: "Trip Package",
                      value: data?.name || "-",
                    },
                    {
                      icon: <CalendarOutlined />,
                      title: "Batch Date",
                      value: selectedDate
                        ? moment(selectedDate).format("DD MMM YYYY")
                        : "-",
                    },
                    {
                      icon: <DollarOutlined />,
                      title: "Amount to Pay",
                      value:
                        skuPricingList?.[0]?.price &&
                        skuPricingList?.[0]?.currency
                          ? formatPrice(
                              skuPricingList?.[0]?.price,
                              skuPricingList?.[0]?.currency
                            )
                          : "-",
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item className="py-4  ">
                      <List.Item.Meta
                        avatar={
                          <span className="flex items-center justify-center w-10 h-10 ">
                            {item.icon}
                          </span>
                        }
                        title={<span>{item.title}</span>}
                        description={
                          <Typography.Text
                            strong
                            className="text-lg text-zui-silver"
                          >
                            {item.value}
                          </Typography.Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Success Screen (now screen 2) */}
      {screen === 2 && (
        <div className="h-full flex items-center justify-center">
          <Result
            status="success"
            icon={
              <CheckCircleOutlined style={{ fontSize: 56, color: "#52c41a" }} />
            }
            title="Zo Zo Zo! Trip Booking Confirmed"
            subTitle={`Closing in ${countdown} seconds...`}
            extra={[
              <Button
                block
                size="large"
                onClick={handleClose}
                className="font-semibold"
              >
                Close
              </Button>,
            ]}
          />
        </div>
      )}
    </Drawer>
  );
};

export default AddBatchBooking;
