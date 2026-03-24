import { GeneralObject } from "@zo/definitions/general";
import moment from "moment";
import React from "react";
import { useAccount } from "wagmi";
import { humanizeValue } from "../../config/utils-number";

interface PaymentDetailsProps {
  paymentData: {
    from_address: string;
    to_address: string;
    amount: string;
    status: string;
    token: GeneralObject;
    created_at: "string";
  };
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentData }) => {
  const { address } = useAccount();
  return (
    <>
      <p>
        <strong>From:</strong>{" "}
        <span className="text-zui-silver">
          {paymentData.from_address || address}
        </span>
      </p>
      <p>
        <strong>To:</strong>{" "}
        <span className="text-zui-silver">{paymentData.to_address}</span>
      </p>
      <p>
        <strong>Date:</strong>{" "}
        <span className="text-zui-silver">
          {moment(paymentData.created_at).format("DD-MM-YYYY HH:mm:ss")}
        </span>
      </p>
      <p>
        <strong>Chain:</strong>{" "}
        <span className="text-zui-silver">{paymentData.token.chain.name}</span>
      </p>
      <p>
        <strong>Amount:</strong>{" "}
        <span className="text-zui-silver">
          {humanizeValue(paymentData.amount)} {paymentData?.token?.symbol}
        </span>
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span className="text-zui-neon">{paymentData.status}</span>
      </p>
    </>
  );
};

export default PaymentDetails;
