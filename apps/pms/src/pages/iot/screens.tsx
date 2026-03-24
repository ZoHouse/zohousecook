import { Card, Col, Empty, Row, Tag } from "antd";
import { NextPage } from "next";
import React from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import useAssociation from "../../hooks/useAssociation";

const OPERATOR_TO_ESTATE: Record<string, { label: string; code: string }> = {
  BNGHO812: { label: "BLRxZo", code: "01" },
  BNGS531: { label: "WTFxZo", code: "08" },
};

// Screen registry — add screens here as they're installed
const SCREENS: Array<{
  id: string;
  name: string;
  location: string;
  floor: string;
  estate: string;
  type: "signage" | "menu_board" | "dashboard" | "welcome";
  resolution: string;
  status: "online" | "offline";
  content?: string;
}> = [
  // BLRxZo screens
  { id: "blr-scr-01", name: "Entrance Display", location: "Entrance", floor: "12th", estate: "01", type: "welcome", resolution: "1920x1080", status: "offline" },
  { id: "blr-scr-02", name: "Kitchen Menu", location: "Kitchen", floor: "12th", estate: "01", type: "menu_board", resolution: "1920x1080", status: "offline" },
  // WTFxZo screens
  { id: "wtf-scr-01", name: "Lobby Welcome", location: "Studio Foyer", floor: "Ground", estate: "08", type: "welcome", resolution: "1920x1080", status: "offline" },
  { id: "wtf-scr-02", name: "Cafe Menu Board", location: "Dining Area", floor: "Ground", estate: "08", type: "menu_board", resolution: "1920x1080", status: "offline" },
  { id: "wtf-scr-03", name: "Event Stage", location: "Stage", floor: "Ground", estate: "08", type: "signage", resolution: "3840x2160", status: "offline" },
];

const TYPE_COLORS: Record<string, string> = {
  signage: "purple",
  menu_board: "orange",
  dashboard: "blue",
  welcome: "green",
};

const ScreensPage: NextPage = () => {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code as string | undefined;
  const estate = operatorCode ? OPERATOR_TO_ESTATE[operatorCode] : undefined;

  const screens = estate ? SCREENS.filter((s) => s.estate === estate.code) : [];

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Screens" icon="Projector" />
        <PageContent>
          {screens.length === 0 ? (
            <Empty description="No screens configured for this property" />
          ) : (
            <Row gutter={[16, 16]}>
              {screens.map((screen) => (
                <Col xs={24} sm={12} lg={8} key={screen.id}>
                  <Card
                    size="small"
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: screen.status === "online" ? "#52c41a" : "#ff4d4f", fontSize: 10 }}>
                          {screen.status === "online" ? "●" : "○"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{screen.name}</span>
                      </div>
                    }
                    extra={
                      <Tag color={TYPE_COLORS[screen.type] || "default"} style={{ margin: 0 }}>
                        {screen.type.replace(/_/g, " ")}
                      </Tag>
                    }
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* Screen preview placeholder */}
                    <div
                      style={{
                        height: 140,
                        background: "#141414",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 12,
                      }}
                    >
                      {screen.status === "online" ? screen.content || "Displaying content" : "Screen offline"}
                    </div>
                    <div style={{ padding: "8px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Location</span>
                        <span style={{ fontWeight: 500 }}>{screen.location}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Resolution</span>
                        <span style={{ fontWeight: 500 }}>{screen.resolution}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Floor</span>
                        <span style={{ fontWeight: 500 }}>{screen.floor}</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default ScreensPage;
