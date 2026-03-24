import { GeneralObject } from "@zo/definitions/general";
import moment from "moment";
import React from "react";
import { humanizeValue } from "../../config/utils-number";
import TransactionHashDisplay from "./TransactionHashDisplay";

interface PaymentHistoryItemProps {
  payment: GeneralObject;
}

const PaymentHistory: React.FC<PaymentHistoryItemProps> = ({ payment }) => {
  const openTransaction = () => {
    window.open(
      `${payment?.token?.chain?.block_explorer_url}/tx/${payment?.transaction?.transaction_hash}`,
      "_blank"
    );
  };

  return (
    <div className="p-4 bg-gradient-to-r from-zui-light to-zui-dark text-zui-white shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Transaction Details</h2>
        <TransactionHashDisplay hash={payment?.transaction?.transaction_hash} />
        <p>
          <strong>From:</strong>{" "}
          <span className="text-zui-silver break-all">
            {payment.from_address}
          </span>
        </p>
        <p>
          <strong>To:</strong>{" "}
          <span className="text-zui-silver break-all">
            {payment.to_address}
          </span>
        </p>
        <p>
          <strong>Date:</strong>{" "}
          <span className="text-zui-silver">
            {moment(payment.created_at).format("DD-MM-YYYY HH:mm:ss")}
          </span>
        </p>

        <p>
          <strong>Chain:</strong>{" "}
          <span className="text-zui-silver">{payment.token.chain.name}</span>
        </p>
        <p>
          <strong>Amount:</strong>{" "}
          <span className="text-zui-silver break-all">
            {humanizeValue(payment.amount)} {payment?.token?.symbol}
          </span>
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="text-zui-green break-all">{payment.status}</span>
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={openTransaction}
          className="px-4 py-2 bg-zui-white text-zui-dark shadow-lg"
        >
          Show Details
        </button>
      </div>
    </div>
  );
};

export default PaymentHistory;
