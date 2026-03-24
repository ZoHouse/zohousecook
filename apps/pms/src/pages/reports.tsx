import React from "react";
import { Page } from "../components/ui";
import NoAccess from "../components/ui/NoAccess";
import { useAssociation } from "../hooks";

interface ReportsProps {}

const Reports: React.FC<ReportsProps> = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("front-desk-manager");

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page>
      {selectedOperator?.name && (
        <iframe
          //src={`https://zo-ops.vercel.app/reviews/${encodeURIComponent(
          src={`https://zo.xyz/ops/reviews/${encodeURIComponent(
            selectedOperator?.name
          )}?view=shared`}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </Page>
  );
};

export default Reports;
