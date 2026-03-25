import { Spin } from 'antd';
import useAssociation from '../../hooks/useAssociation';
import { useIoTCameras, useIoTChat } from '../../hooks/iot';
import { PulseLine } from '../../components/iot/PulseLine';
import { FeaturedCamera } from '../../components/iot/FeaturedCamera';
import { ChatBar } from '../../components/iot/ChatBar';
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard';
import { Page, PageContent, PageHeader } from '../../components/ui';
import type { HouseStatus } from '../../types/iot';

function CommandCenter() {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code;

  const { cameras, featured, isLoading: camerasLoading } = useIoTCameras(operatorCode);
  const { messages, isLoading: chatLoading, sendMessage, clearChat } = useIoTChat(operatorCode);

  // V1: derive house status from camera data only
  const houseStatus: HouseStatus | null = camerasLoading ? null : {
    online: cameras.some((c) => c.status === 'online'),
    cameras: {
      total: cameras.length,
      online: cameras.filter((c) => c.status === 'online').length,
    },
    // Hardcoded counts for V1 — will come from APIs in V2
    screens: { total: 8, online: 0 },
    lights: { total: 6, online: 0 },
    locks: { total: 4, locked: 0 },
  };

  const propertyName = operatorCode === 'BNGHO812' ? 'BLRxZo' : 'WTFxZo';

  return (
    <Page>
      <PageHeader title="Command Center" icon="Monitor" />
      <PageContent>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
          <PulseLine
            status={houseStatus}
            isLoading={camerasLoading}
            propertyName={propertyName}
          />

          {camerasLoading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : (
            <FeaturedCamera cameras={cameras} featured={featured} />
          )}

          <ChatBar
            messages={messages}
            isLoading={chatLoading}
            onSend={sendMessage}
            onClear={clearChat}
          />
        </div>
      </PageContent>
    </Page>
  );
}

export default function IoTCommandCenter() {
  return (
    <ZoHouseGuard>
      <CommandCenter />
    </ZoHouseGuard>
  );
}
