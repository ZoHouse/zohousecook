import { Card, Col, Empty, Row, Segmented, Spin, Tag } from "antd";
import { NextPage } from "next";
import React, { useState } from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import useAssociation from "../../hooks/useAssociation";

const OPERATOR_TO_ESTATE: Record<string, { label: string; code: string }> = {
  BNGHO812: { label: "BLRxZo", code: "01" },
  BNGS531: { label: "WTFxZo", code: "08" },
};

// Camera registry — add cameras here as they're installed
const CAMERAS: Array<{
  id: string;
  name: string;
  location: string;
  floor: string;
  estate: string;
  stream_url?: string;
  type: "indoor" | "outdoor" | "entrance";
  status: "online" | "offline";
}> = [
  // BLRxZo cameras
  { id: "blr-cam-01", name: "Main Entrance", location: "Entrance", floor: "12th", estate: "01", type: "entrance", status: "offline" },
  { id: "blr-cam-02", name: "Kitchen", location: "Kitchen", floor: "12th", estate: "01", type: "indoor", status: "offline" },
  { id: "blr-cam-03", name: "Warp Zone", location: "Warp Zone", floor: "12th", estate: "01", type: "indoor", status: "offline" },
  // WTFxZo cameras
  { id: "wtf-cam-01", name: "Main Gate", location: "Entrance", floor: "Ground", estate: "08", type: "entrance", status: "offline" },
  { id: "wtf-cam-02", name: "Dining Area", location: "Dining Area", floor: "Ground", estate: "08", type: "indoor", status: "offline" },
  { id: "wtf-cam-03", name: "Stage", location: "Stage", floor: "Ground", estate: "08", type: "outdoor", status: "offline" },
  { id: "wtf-cam-04", name: "Liquidity Pool", location: "Liquidity Pool", floor: "Ground", estate: "08", type: "outdoor", status: "offline" },
];

const TYPE_COLORS: Record<string, string> = {
  indoor: "blue",
  outdoor: "green",
  entrance: "gold",
};

const CamerasPage: NextPage = () => {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code as string | undefined;
  const estate = operatorCode ? OPERATOR_TO_ESTATE[operatorCode] : undefined;

  const cameras = estate ? CAMERAS.filter((c) => c.estate === estate.code) : [];

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Cameras" icon="Cctv" />
        <PageContent>
          {cameras.length === 0 ? (
            <Empty description="No cameras configured for this property" />
          ) : (
            <Row gutter={[16, 16]}>
              {cameras.map((cam) => (
                <Col xs={24} sm={12} lg={8} key={cam.id}>
                  <Card
                    size="small"
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: cam.status === "online" ? "#52c41a" : "#ff4d4f", fontSize: 10 }}>
                          {cam.status === "online" ? "●" : "○"}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{cam.name}</span>
                      </div>
                    }
                    extra={
                      <Tag color={TYPE_COLORS[cam.type] || "default"} style={{ margin: 0 }}>
                        {cam.type}
                      </Tag>
                    }
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* Feed placeholder */}
                    <div
                      style={{
                        height: 180,
                        background: "#141414",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 12,
                      }}
                    >
                      {cam.status === "online" ? "Live feed" : "Camera offline"}
                    </div>
                    <div style={{ padding: "8px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Location</span>
                        <span style={{ fontWeight: 500 }}>{cam.location}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Floor</span>
                        <span style={{ fontWeight: 500 }}>{cam.floor}</span>
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

export default CamerasPage;
