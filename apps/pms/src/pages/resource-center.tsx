import React from "react";
import { Page } from "../components/ui";
import NoAccess from "../components/ui/NoAccess";
import { useAssociation } from "../hooks";

interface ResourceCenterProps {}

const ResourceCenter: React.FC<ResourceCenterProps> = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("property-manager");

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <Page>
      {selectedOperator?.data.resource_center_url && (
        <iframe
          src={selectedOperator?.data.resource_center_url}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </Page>
  );
};

export default ResourceCenter;
