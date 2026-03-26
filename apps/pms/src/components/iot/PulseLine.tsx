// apps/pms/src/components/iot/PulseLine.tsx
import { Typography } from 'antd';
import type { HouseStatus } from '../../types/iot';

const { Text } = Typography;

interface PulseLineProps {
  status: HouseStatus | null;
  isLoading: boolean;
  propertyName: string;
}

export function PulseLine({ status, isLoading, propertyName }: PulseLineProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#888',
        }} />
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          Checking {propertyName}...
        </Text>
      </div>
    );
  }

  const online = status?.online ?? false;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: online ? '#52c41a' : '#ff4d4f',
        }} />
        <Text style={{ fontSize: 14 }}>
          {propertyName} is <span style={{ color: online ? '#52c41a' : '#ff4d4f' }}>
            {online ? 'alive' : 'offline'}
          </span>
        </Text>
      </div>
      {status && (
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          {status.cameras.online}/{status.cameras.total} cams
          {' · '}
          {status.screens.online}/{status.screens.total} screens
          {' · '}
          {status.lights.online}/{status.lights.total} lights
          {' · '}
          {status.locks.locked}/{status.locks.total} locked
          {' · '}
          {status.wifi.online}/{status.wifi.total} wifi
          {' · '}
          {status.power.online}/{status.power.total} power
        </Text>
      )}
    </div>
  );
}
