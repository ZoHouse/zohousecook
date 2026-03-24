import { Loader } from "@zo/assets/lotties";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Page, PageContent, PageHeader } from "../components/ui";
import NoAccess from "../components/ui/NoAccess";
import { useAssociation } from "../hooks";

const DemandDashboard: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("owner_partner") || hasAccess("property-manager");
  const router = useRouter();

  const shouldRedirect = canView && !selectedOperator?.data?.demand_dashboard_url;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/overview");
    }
  }, [shouldRedirect, router]);

  if (!canView) {
    return <NoAccess />;
  }

  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader className="w-10 h-10" />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader title="Demand Dashboard" />
      <PageContent>
        {selectedOperator?.data?.demand_dashboard_url && (
          <iframe
            src={selectedOperator?.data?.demand_dashboard_url}
            style={{
              width: "100%",
              height: "calc(100vh - 200px)",
              border: "none",
            }}
            title="Demand Dashboard"
            allowFullScreen
          />
        )}
      </PageContent>
    </Page>
  );
};

export default DemandDashboard;
