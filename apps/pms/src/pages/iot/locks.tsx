import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Card, Col, Empty, Row, Spin, Tag } from "antd";
import { NextPage } from "next";
import React, { useMemo } from "react";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import useAssociation from "../../hooks/useAssociation";

interface Lock {
  id: string;
  name: string;
  device_ref_id: string;
}

// Map operator codes to lock name prefixes
const OPERATOR_LOCK_PREFIXES: Record<string, string[]> = {
  BNGHO812: ["Zo House BLR", "BLRxZo", "BLR"],
  BNGS531: ["WTFxZo", "WTF", "Zo House WTF", "Zo House Whitefield"],
};

const LocksPage: NextPage = () => {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code as string | undefined;

  const { data, isLoading } = useQueryApi<GeneralObject>(
    "CAS_LOCKS",
    {
      refetchOnWindowFocus: false,
      select: (d: GeneralObject) => d.data,
    },
    "",
    "limit=-1"
  );

  const allLocks: Lock[] = data?.results || data || [];

  // Filter locks to current property
  const locks = useMemo(() => {
    if (!operatorCode) return allLocks;
    const prefixes = OPERATOR_LOCK_PREFIXES[operatorCode];
    if (!prefixes) return allLocks;
    return allLocks.filter((lock) =>
      prefixes.some((prefix) => lock.name.startsWith(prefix))
    );
  }, [allLocks, operatorCode]);

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Locks" icon="DoorLock" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : locks.length === 0 ? (
            <Empty description="No locks registered for this property" />
          ) : (
            <Row gutter={[12, 12]}>
              {locks.map((lock) => (
                <Col xs={12} sm={12} md={8} xl={6} key={lock.id}>
                  <Card
                    size="small"
                    title={
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{lock.name}</span>
                    }
                    style={{ height: '100%' }}
                    styles={{ header: { padding: '8px 12px', minHeight: 0 }, body: { padding: "8px 12px" } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: 'center' }}>
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>Device Ref</span>
                      <Tag style={{ margin: 0, fontSize: 11 }}>{lock.device_ref_id}</Tag>
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
