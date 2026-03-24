import { Currency } from "@zo/definitions/admin";
import { Divider, Flex, Modal } from "antd";
import { formatCurrencyPrice } from "apps/admin/src/utils/formatPrice";

interface TaxBreakdownProps {
  taxBreakdown: any[];
  totalTax: number;
  currency: Currency;
  isOpen: boolean;
  handleClose: () => void;
}

const TaxBreakdown: React.FC<TaxBreakdownProps> = ({
  taxBreakdown,
  totalTax,
  currency,
  isOpen,
  handleClose,
}) => {
  return (
    <Modal
      title="Tax Breakup"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      maskClosable={true}
      closeIcon={true}
      destroyOnClose={true}
    >
      <div className="">
        <div className="space-y-4">
          {taxBreakdown.map((item, index) => (
            <div key={index}>
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
        </div>
        <Divider className="my-4" />
        <div className="">
          <div className="flex justify-between text-lg font-medium">
            <span>Total Tax</span>
            <span>{formatCurrencyPrice(totalTax, currency)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaxBreakdown;
