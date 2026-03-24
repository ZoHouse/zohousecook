// pages/payment-details.tsx

import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import React from "react";
import { useAuth } from "../components/auth";
import { Page } from "../components/common";
import { PaymentHistory } from "../components/ui";

const PaymentDetails = () => {
  const { walletConnected } = useAuth();
  const { data: paymentHistory } = useQueryApi<any>(
    "CREAM_PAYMENTS",
    {
      enabled: walletConnected !== undefined,
      select: (data) => data.data.results,
    },
    "",
    ""
  );
  return (
    <Page>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentHistory?.map((payment: GeneralObject, index: number) => (
          <PaymentHistory key={index} payment={payment} />
        ))}
      </div>
    </Page>
  );
};

export default PaymentDetails;
