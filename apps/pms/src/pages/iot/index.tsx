import { Spin } from 'antd';
import useAssociation from '../../hooks/useAssociation';
import { useIoTDevices, useIoTCameras, useIoTChat } from '../../hooks/iot';
import { PulseLine } from '../../components/iot/PulseLine';
import { FeaturedCamera } from '../../components/iot/FeaturedCamera';
import { ChatBar } from '../../components/iot/ChatBar';
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard';
import { Page, PageContent, PageHeader } from '../../components/ui';
import type { HouseStatus } from '../../types/iot';

function CommandCenter() {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code;

  const { devices, isLoading: devicesLoading } = useIoTDevices(operatorCode);
  const { cameras, featured } = useIoTCameras(operatorCode);
  const { messages, isLoading: chatLoading, sendMessage, clearChat } = useIoTChat(operatorCode);

  const byCategory = (cat: string) => devices.filter((d) => d.category === cat);

  const houseStatus: HouseStatus | null = devicesLoading ? null : {
    online: devices.some((d) => d.status === 'online'),
    cameras: { total: byCategory('camera').length, online: byCategory('camera').filter((d) => d.status === 'online').length },
    screens: { total: byCategory('screen').length, online: byCategory('screen').filter((d) => d.status === 'online').length },
    lights: { total: byCategory('light').length, online: byCategory('light').filter((d) => d.status === 'online').length },
    locks: { total: byCategory('lock').length, locked: byCategory('lock').filter((d) => d.lock_state === 'locked').length },
    wifi: { total: byCategory('wifi').length, online: byCategory('wifi').filter((d) => d.status === 'online').length },
    power: { total: byCategory('power').length, online: byCategory('power').filter((d) => d.status === 'online').length },
  };

  const propertyName = operatorCode === 'BNGHO812' ? 'BLRxZo' : 'WTFxZo';

  return (
    <Page>
      <PageHeader title="Command Center" icon="Monitor" />
      <PageContent>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
          <PulseLine
            status={houseStatus}
            isLoading={devicesLoading}
            propertyName={propertyName}
          />

          {devicesLoading ? (
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
