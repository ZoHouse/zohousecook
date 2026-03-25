// apps/pms/src/components/iot/CameraCard.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, Tag } from 'antd';
import type { IoTCamera } from '../../types/iot';
import { buildSnapshotUrl } from '../../types/iot';

interface CameraCardProps {
  camera: IoTCamera;
  onClick: (camera: IoTCamera) => void;
}

const TYPE_COLORS: Record<string, string> = {
  entrance: 'red',
  indoor: 'blue',
  outdoor: 'green',
};

export function CameraCard({ camera, onClick }: CameraCardProps) {
  const [imgKey, setImgKey] = useState(0);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasStream = !!(camera.relay_url && camera.go2rtc_name && camera.status === 'online');
  const snapshotUrl = hasStream
    ? buildSnapshotUrl(camera.relay_url!, camera.go2rtc_name!, imgKey)
    : null;

  // Auto-refresh snapshot every 10 seconds — depend on stable hasStream, not snapshotUrl
  useEffect(() => {
    if (hasStream) {
      intervalRef.current = setInterval(() => {
        setImgKey((k) => k + 1);
        setImgError(false);
      }, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasStream]);

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: camera.status === 'online' ? '#52c41a' : '#ff4d4f',
          }} />
          <span>{camera.name}</span>
        </div>
      }
      extra={<Tag color={TYPE_COLORS[camera.type] || 'default'}>{camera.type}</Tag>}
      hoverable
      onClick={() => onClick(camera)}
      style={{ cursor: 'pointer' }}
      styles={{ header: { padding: '8px 12px', minHeight: 0 }, body: { padding: '8px 12px' } }}
    >
      {/* Feed area */}
      <div style={{
        background: '#141414',
        borderRadius: 4,
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        {snapshotUrl && !imgError ? (
          <img
            key={imgKey}
            src={snapshotUrl}
            alt={camera.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            {camera.status === 'offline' ? 'Camera offline' : 'Awaiting setup'}
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Location</span>
        <span style={{ fontWeight: 500 }}>{camera.location || '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Floor</span>
        <span style={{ fontWeight: 500 }}>{camera.floor || '—'}</span>
      </div>
      {camera.last_seen_at && camera.status === 'offline' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>Last seen</span>
          <span style={{ color: '#ff4d4f' }}>
            {new Date(camera.last_seen_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </Card>
  );
}
