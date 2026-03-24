import { CreditCardOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Card, Divider, message, Modal } from "antd";
import {
  formatCurrencyPrice,
  formatPrice,
} from "apps/admin/src/utils/formatPrice";
import React, { useEffect, useState } from "react";

interface UpgradePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradePreviewData: GeneralObject | null;
  bookingData: any;
}

const UpgradePreviewModal: React.FC<UpgradePreviewModalProps> = ({
  isOpen,
  onClose,
  upgradePreviewData,
  bookingData,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"regular" | "credits">(
    "regular"
  );

  // API for user credits
  const { data: creditsData, isLoading } = useQueryApi<any>(
    "CAS_CREDITS",
    {
      enabled: !!(isOpen && bookingData?.user?.id),
      select: (data) => data.data,
    },
    `${bookingData?.user?.id}/`,
    ""
  );

  const { mutate: upgradeTrip, isLoading: isUpgradingTrip } = useMutationApi(
    "CAS_TRIP_BOOKINGS",
    {},
    "",
    "POST"
  );

  const currency = bookingData?.booked_skus?.[0]?.sku?.currency;
  const latestUpgrade = upgradePreviewData?.booking?.upgrades?.[0];
  const upgradePrice = latestUpgrade?.price || 0;
  const upgradeTax = latestUpgrade?.tax_details?.tax_amount || 0;
  const upgradeTcs = latestUpgrade?.tax_details?.tcs || 0;
  const totalUpgradeAmount = upgradePrice + upgradeTax + upgradeTcs;

  const creditsToSpend =
    paymentMethod === "credits" && creditsData
      ? Math.min(totalUpgradeAmount, creditsData.balance)
      : 0;

  const finalAmount = totalUpgradeAmount - creditsToSpend;

  const handleUpgradeConfirm = () => {
    upgradeTrip(
      {
        data: {
          name: latestUpgrade?.name,
          price: latestUpgrade?.price,
          credits_to_spend: creditsToSpend,
          description: "",
        },
        route: `${bookingData?.id}/upgrade/`,
      },
      {
        onSuccess(data) {
          message.success("Upgrade Added Successfully");
          onClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="Upgrade Preview"
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isUpgradingTrip}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleUpgradeConfirm}
          loading={isUpgradingTrip}
        >
          Confirm Upgrade
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Credit Balance Information */}
        {creditsData && creditsData?.balance > 0 && (
          <>
            <div className="bg-zui-light border border-zui-silver p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Available Credits:</span>
                <span className="text-lg font-semibold text-zui-green">
                  {formatPrice(creditsData?.balance, creditsData?.currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={paymentMethod === "credits"}
                  onChange={(e) =>
                    setPaymentMethod(e.target.checked ? "credits" : "regular")
                  }
                  disabled={isLoading}
                />
                <label className="cursor-pointer">Pay with Credits</label>
              </div>
            </div>
            <Divider />
          </>
        )}
        <Card
          title={
            <div className="flex items-center gap-2">
              <CreditCardOutlined />
              <span>Upgrade Details</span>
            </div>
          }
          className="mb-4"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Upgrade Name:</span>
              <span>{latestUpgrade?.name}</span>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between items-center">
              <span>Upgrade Price</span>
              {formatCurrencyPrice(upgradePrice, currency)}
            </div>

            {upgradeTax > 0 && (
              <div className="flex justify-between items-center">
                <span>Tax (GST)</span>
                {formatCurrencyPrice(upgradeTax, currency)}
              </div>
            )}

            {upgradeTcs > 0 && (
              <div className="flex justify-between items-center">
                <span>
                  TCS ({latestUpgrade?.tax_details?.tcs_percentage || 0}%)
                </span>
                {formatCurrencyPrice(upgradeTcs, currency)}
              </div>
            )}

            <Divider className="my-2" />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Upgrade Amount</span>
              {formatCurrencyPrice(totalUpgradeAmount, currency)}
            </div>

            {paymentMethod === "credits" && creditsToSpend > 0 && (
              <>
                <div className="flex justify-between items-center text-zui-green">
                  <span>Credits Applied</span>
                  <span>-{formatCurrencyPrice(creditsToSpend, currency)}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Amount to Pay</span>
                  {formatCurrencyPrice(finalAmount, currency)}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default UpgradePreviewModal;
