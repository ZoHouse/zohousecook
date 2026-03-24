import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, Divider, Drawer, message, Switch, Tooltip } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useMemo, useState } from "react";
import { Inventory, TripGuest } from "../../config";
import { Currency, TripBooking } from "../../config/typings";
import { formatPrice } from "../../utils/formatPrice";
import FormElement from "../Form/FormElement/FormElement";
import {
  PaymentSummary,
  TripAddons,
  TripGuests,
  TripSelection,
} from "../helpers/trips-booking";

interface AddTripBookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddTripBookingSidebar: React.FC<AddTripBookingSidebarProps> = ({
  isOpen,
  onClose,
  refetch,
}) => {
  const [tripForm] = useForm();

  const [guests, setGuests] = useState<TripGuest[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null
  );
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDatePrice, setSelectedDatePrice] = useState<number | null>(
    null
  );
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  const [BookingPreviewSummary, setBookingPreviewSummary] =
    useState<TripBooking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isExcessTcsApplied, setIsExcessTcsApplied] = useState(false);

  const { mutate: addBooking, isLoading: addBookingLoading } =
    useMutationApi("CAS_TRIP_BOOKINGS");

  const selectedSku = useMemo(() => {
    const batchData = selectedInventory?.skus?.find(
      (sku) => sku.id === selectedBatch
    );
    return batchData?.pid || null;
  }, [selectedInventory, selectedBatch]);

  const handleClose = useCallback(() => {
    tripForm.resetFields();
    setTotalUnits(0);
    setSelectedInventory(null);
    setSelectedBatch(null);
    setSelectedAddons([]);
    setSelectedDate(null);
    setSelectedDatePrice(null);
    setIsExcessTcsApplied(false);
    setGuests([]);
    setBookingPreviewSummary(null);
    setIsPaymentModalOpen(false);
    onClose();
  }, [onClose, tripForm]);

  const handlePaymentModalOpen = useCallback(() => {
    if (!guests.length) return;

    setIsPaymentModalOpen(true);

    addBooking(
      {
        data: {
          date: selectedDate,
          sku: selectedSku,
          user_pid: guests[0]?.pid,
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
    guests,
    isExcessTcsApplied,
    selectedAddons,
    selectedDate,
    selectedSku,
    totalUnits,
    discount,
    selectedDatePrice,
    selectedInventory,
  ]);

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={handleClose}
        title="Trip Booking"
        extra={
          <Button
            type="primary"
            onClick={handlePaymentModalOpen}
            disabled={!guests.length}
          >
            Continue to Payment
          </Button>
        }
      >
        <div className="flex flex-col">
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
          {totalUnits > 0 && (
            <>
              <Divider />
              <TripGuests
                guests={guests}
                totalUnits={totalUnits}
                setGuests={setGuests}
              />
            </>
          )}

          {guests.length > 0 && (
            <TripAddons
              selectedDate={selectedDate}
              selectedAddons={selectedAddons}
              setSelectedAddons={setSelectedAddons}
              currency={selectedInventory?.currency as Currency}
            />
          )}

          {selectedInventory?.is_international && guests.length > 0 && (
            <>
              <Divider />

              <div>
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

          {selectedInventory && guests.length > 0 && selectedDatePrice && (
            <>
              <Divider />
              <div className="bg-zui-lightest p-3 mb-4 rounded-lg">
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

          <PaymentSummary
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedInventory={selectedInventory}
            selectedDate={selectedDate}
            totalUnits={totalUnits}
            refetch={refetch}
            selectedSku={selectedSku}
            guests={guests}
            selectedAddons={selectedAddons}
            isExcessTcsApplied={isExcessTcsApplied}
            handleClose={handleClose}
            BookingPreviewSummary={BookingPreviewSummary}
            discount={discount}
            addBookingLoading={addBookingLoading}
          />
        </div>
      </Drawer>
    </>
  );
};

export default AddTripBookingSidebar;
