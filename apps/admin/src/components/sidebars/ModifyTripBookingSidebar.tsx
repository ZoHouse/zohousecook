import { useMutationApi } from "@zo/auth";
import {
  Button,
  Divider,
  Drawer,
  message,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useMemo, useState } from "react";
import { Currency, Inventory } from "../../config";
import { TripBooking } from "../../config/typings";

import { processResponseError } from "@zo/utils/auth";
import { formatPrice } from "../../utils/formatPrice";
import FormElement from "../Form/FormElement/FormElement";
import {
  BookedTripDetails,
  CustomerInformation,
  PaymentSummary,
  TripAddons,
  TripSelection,
  TripStats,
} from "../helpers/modify-trip-booking";

const { Title } = Typography;

interface ModifyTripBookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: TripBooking;
  refetch: () => Promise<any> | void;
}

const ModifyTripBookingSidebar: React.FC<ModifyTripBookingSidebarProps> = ({
  isOpen,
  onClose,
  bookingData,
  refetch,
}) => {
  const [tripForm] = useForm();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Trip Selection States
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null
  );
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedDatePrice, setSelectedDatePrice] = useState<number | null>(
    null
  );
  const [discount, setDiscount] = useState<number>(0);

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const [isExcessTcsApplied, setIsExcessTcsApplied] = useState(false);

  // Mutation for creating new booking
  const { mutate: addBooking, isLoading: isModifyBookingPreviewLoading } =
    useMutationApi("CAS_TRIP_BOOKINGS");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClose = useCallback(() => {
    tripForm.resetFields();
    setTotalUnits(0);
    setSelectedInventory(null);
    setSelectedBatch(null);
    setSelectedAddons([]);
    setSelectedDate(null);
    setSelectedDatePrice(null);
    setIsExcessTcsApplied(false);
    setBookingPreviewSummary(null);
    setIsPaymentModalOpen(false);
    onClose();
  }, [onClose, tripForm]);

  const [BookingPreviewSummary, setBookingPreviewSummary] =
    useState<TripBooking | null>(null);

  const selectedSku = useMemo(() => {
    const batchData = selectedInventory?.skus?.find(
      (sku) => sku.id === selectedBatch
    );
    return batchData?.pid || null;
  }, [selectedInventory, selectedBatch]);

  const handlePaymentModalOpen = useCallback(() => {
    setIsPaymentModalOpen(true);

    addBooking(
      {
        data: {
          date: selectedDate,
          sku: selectedSku,
          user_pid: bookingData?.user?.pid,
          units: totalUnits,
          addons: selectedAddons,
          tcs_declaration: isExcessTcsApplied,
          preview: true,
          offer_discount: discount,
        },
      },
      {
        onSuccess: (data) => setBookingPreviewSummary(data.data),
        onError: (error) => {
          message.error(processResponseError(error));
        },
      }
    );
  }, [
    addBooking,
    bookingData,
    isExcessTcsApplied,
    selectedAddons,
    selectedDate,
    selectedSku,
    totalUnits,
    discount,
  ]);

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full">
          <Title level={4} className="mb-0 mt-2 text-zui-silver">
            Modify Booking
          </Title>
          <Button
            type="primary"
            disabled={!selectedInventory && !selectedSku}
            onClick={handlePaymentModalOpen}
          >
            Continue to Payment
          </Button>
        </div>
      }
      open={isOpen}
      onClose={handleClose}
      width={650}
      className="modify-booking-drawer"
    >
      <div className="space-y-6">
        {/* Quick Stats Row */}
        <TripStats bookingData={bookingData} />

        {/* Current Booking Details Card */}
        <BookedTripDetails
          bookingData={bookingData}
          onCopyToClipboard={copyToClipboard}
        />

        {/* User Information Card */}
        <CustomerInformation bookingData={bookingData} />

        {/* Trip Selection */}
        <TripSelection
          tripForm={tripForm}
          selectedBatch={selectedBatch}
          selectedInventory={selectedInventory}
          setSelectedInventory={setSelectedInventory}
          setSelectedBatch={setSelectedBatch}
          setSelectedDate={setSelectedDate}
          setSelectedDatePrice={setSelectedDatePrice}
          setTotalUnits={setTotalUnits}
        />

        {/* Addon Selection */}
        <TripAddons
          selectedDate={selectedDate}
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          currency={selectedInventory?.currency as Currency}
        />

        {/* TCS Options */}
        {selectedInventory?.is_international && (
          <>
            <Divider />

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-base font-semibold">TCS Options</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p>Expenses above ₹10 Lakhs</p>
                  <Tooltip title="Higher TCS rate (20%) applicable when international expenses exceed ₹7 Lakhs in a financial year">
                    <p className="text-zui-silver block text-sm">
                      {isExcessTcsApplied
                        ? "20% TCS will be applied"
                        : "5% TCS will be applied"}
                    </p>
                  </Tooltip>
                </div>
                <Switch
                  checked={isExcessTcsApplied}
                  onChange={setIsExcessTcsApplied}
                  className={
                    isExcessTcsApplied ? "bg-zui-green" : "bg-zui-silver"
                  }
                />
              </div>
            </div>
          </>
        )}
        {selectedInventory && (
          <>
            {selectedDatePrice && selectedInventory?.currency && (
              <div className="bg-zui-lightest p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium0">
                    Max Discountable Price:
                  </span>
                  <span className="text-lg font-semibold ">
                    {formatPrice(
                      selectedDatePrice,
                      selectedInventory?.currency
                    )}
                  </span>
                </div>
              </div>
            )}
            <FormElement
              type="price"
              name="discount"
              label="Discount"
              value={discount}
              setValue={setDiscount}
              minValue={0}
              currency={selectedInventory?.currency}
              maxValue={Number(
                formatPrice(
                  selectedDatePrice || 0,
                  selectedInventory?.currency as Currency
                )
              )}
            />
          </>
        )}

        {selectedInventory && isPaymentModalOpen && (
          <PaymentSummary
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedInventory={selectedInventory}
            selectedDate={selectedDate}
            totalUnits={totalUnits}
            refetch={refetch}
            selectedSku={selectedSku}
            selectedAddons={selectedAddons}
            isExcessTcsApplied={isExcessTcsApplied}
            handleClose={handleClose}
            BookingPreviewSummary={BookingPreviewSummary}
            bookingData={bookingData}
            discount={discount}
            isModifyBookingPreviewLoading={isModifyBookingPreviewLoading}
          />
        )}
      </div>
    </Drawer>
  );
};

export default ModifyTripBookingSidebar;
