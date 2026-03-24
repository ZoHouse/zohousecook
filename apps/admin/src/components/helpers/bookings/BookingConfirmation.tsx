import { CheckCircleFilled } from "@ant-design/icons";
import { Loader } from "@zo/assets/lotties";
import { Card, Result, Space, Typography } from "antd";
import { motion } from "framer-motion";
import React from "react";

const { Text, Title } = Typography;

interface BookingConfirmationProps {
  bookingId: string | null;
  email?: string;
  secondsLeft: number;
  onViewBooking: () => void;
  onCreateAnotherBooking: () => void;
  isLoading?: boolean;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingId,
  email,
  secondsLeft,
  onViewBooking,
  onCreateAnotherBooking,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full"
      >
        <Space direction="vertical" align="center">
          <Loader />
          <Text className="text-lg animate-pulse">
            Creating your booking...
          </Text>
        </Space>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-full flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Result
        icon={
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CheckCircleFilled style={{ fontSize: 72, color: "#52c41a" }} />
          </motion.div>
        }
        status="success"
        title={
          <Title level={3} className="!my-4">
            Zo Zo Zo! Booking Confirmed
          </Title>
        }
        subTitle={
          <Space direction="vertical" align="center" size="large">
            {bookingId && (
              <Card className="bg-zui-lighter border-none">
                <Text className="text-base">
                  Booking ID: <span className="font-mono">{bookingId}</span>
                </Text>
              </Card>
            )}
            {email && (
              <Text type="secondary" className="text-base">
                Booking details have been sent to{" "}
                <span className="text-zui-silver">{email}</span>
              </Text>
            )}
            {secondsLeft >= 0 && (
              <Text type="success" className="text-base">
                Closing in {secondsLeft} seconds...
              </Text>
            )}
          </Space>
        }
        // extra={
        //   <Space size="middle">
        //     <Button
        //       key="view-booking"
        //       type="primary"
        //       size="large"
        //       onClick={onViewBooking}
        //       className="min-w-[200px] hover:scale-105 transition-transform"
        //     >
        //       View Booking
        //     </Button>
        //     <Button
        //       key="book-another"
        //       size="large"
        //       className="min-w-[200px] hover:scale-105 transition-transform"
        //       onClick={onCreateAnotherBooking}
        //     >
        //       Book Another
        //     </Button>
        //   </Space>
        // }
        className="px-8 py-12"
      />
    </motion.div>
  );
};

export default BookingConfirmation;
