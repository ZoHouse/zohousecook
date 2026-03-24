import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Card, Col, Empty, Row, Spin, Tag } from "antd";
import { NextPage } from "next";
import React from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";

interface Lock {
  id: string;
  name: string;
  device_ref_id: string;
}

const LocksPage: NextPage = () => {
  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_LOCKS",
    {
      refetchOnWindowFocus: false,
      select: (d: GeneralObject) => d.data,
    },
    "",
    "limit=-1"
  );

  const locks: Lock[] = data?.results || data || [];

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Locks" icon="DoorLock" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : locks.length === 0 ? (
            <Empty description="No locks registered" />
          ) : (
            <Row gutter={[16, 16]}>
              {locks.map((lock) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={lock.id}>
                  <Card
                    size="small"
                    title={
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{lock.name}</span>
                    }
                    styles={{ body: { padding: "12px 16px" } }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>Device Ref</span>
                        <Tag style={{ margin: 0 }}>{lock.device_ref_id}</Tag>
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

export default LocksPage;
