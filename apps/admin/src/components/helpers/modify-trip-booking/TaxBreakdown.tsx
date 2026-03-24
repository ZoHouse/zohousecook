import { Currency } from "@zo/definitions/admin";
import { Divider, Modal, Tabs } from "antd";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";

interface TaxDetails {
  countryTax: number;
  countryTaxPercent: number;
  stateTax: number;
  stateTaxPercent: number;
}

interface TaxBreakdownItem {
  name: string;
  amount: number;
  details: TaxDetails;
}

interface BookingTaxBreakdown {
  taxBreakdown: TaxBreakdownItem[];
  totalTax: number;
}

interface TaxBreakdownProps {
  existingBookingTax?: BookingTaxBreakdown;
  modifiedBookingTax?: BookingTaxBreakdown;
  currency: Currency;
  isOpen: boolean;
  handleClose: () => void;
}

const TaxBreakdownContent: React.FC<{
  taxBreakdown: TaxBreakdownItem[];
  totalTax: number;
  currency: Currency;
}> = ({ taxBreakdown, totalTax, currency }) => (
  <div className="space-y-4">
    {taxBreakdown.map((item, index) => (
      <div key={index} className="tax-breakdown-item">
        <div className="flex justify-between mb-2 text-base">
          <span className="font-body">{item.name}</span>
          <span>{formatCurrencyPrice(item.amount, currency)}</span>
        </div>
        {item.details && (
          <div className="ml-4 space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <div className="flex justify-between">
              <span>CGST ({item.details.countryTaxPercent}%)</span>
              <span>
                {formatCurrencyPrice(item.details.countryTax, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({item.details.stateTaxPercent}%)</span>
              <span>
                {formatCurrencyPrice(item.details.stateTax, currency)}
              </span>
            </div>
          </div>
        )}
        {index < taxBreakdown.length - 1 && <Divider className="my-3" />}
      </div>
    ))}
    <Divider className="my-4" />
    <div className="flex justify-between text-lg font-medium">
      <span>Total Tax</span>
      <span>{formatCurrencyPrice(totalTax, currency)}</span>
    </div>
  </div>
);

const TaxBreakdown: React.FC<TaxBreakdownProps> = ({
  existingBookingTax,
  modifiedBookingTax,
  currency,
  isOpen,
  handleClose,
}) => {
  const showTabs = existingBookingTax && modifiedBookingTax;

  return (
    <Modal
      title="Tax Breakdown"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      maskClosable={true}
      closeIcon={true}
      destroyOnClose={true}
      width={600}
    >
      {showTabs ? (
        <Tabs
          items={[
            {
              key: "existing",
              label: "Existing Booking",
              children: (
                <TaxBreakdownContent
                  taxBreakdown={existingBookingTax.taxBreakdown}
                  totalTax={existingBookingTax.totalTax}
                  currency={currency}
                />
              ),
            },
            {
              key: "modified",
              label: "Modified Booking",
              children: (
                <TaxBreakdownContent
                  taxBreakdown={modifiedBookingTax.taxBreakdown}
                  totalTax={modifiedBookingTax.totalTax}
                  currency={currency}
                />
              ),
            },
          ]}
        />
      ) : (
        <TaxBreakdownContent
          taxBreakdown={
            (existingBookingTax || modifiedBookingTax)?.taxBreakdown || []
          }
          totalTax={(existingBookingTax || modifiedBookingTax)?.totalTax || 0}
          currency={currency}
        />
      )}
    </Modal>
  );
};

export default TaxBreakdown;
