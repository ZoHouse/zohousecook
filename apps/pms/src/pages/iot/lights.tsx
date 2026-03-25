import { Empty } from "antd";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";

function LightsPage() {
  return (
    <Page>
      <PageHeader title="Lights" />
      <PageContent>
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <Empty description="WLED integration coming soon — control lights via the Command Center chat for now" />
        </div>
      </PageContent>
    </Page>
  );
}

export default function IoTLights() {
  return (
    <ZoHouseGuard>
      <LightsPage />
    </ZoHouseGuard>
  );
}
