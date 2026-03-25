// apps/pms/src/components/iot/CameraExpandModal.tsx
import { useState, useEffect, useRef } from 'react';
import { Modal, Tag, Typography } from 'antd';
import type { IoTCamera } from '../../types/iot';
import { buildSnapshotUrl } from '../../types/iot';

const { Text } = Typography;

interface CameraExpandModalProps {
  camera: IoTCamera | null;
  onClose: () => void;
}

export function CameraExpandModal({ camera, onClose }: CameraExpandModalProps) {
  const [imgKey, setImgKey] = useState(0);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snapshotUrl = camera?.relay_url && camera?.go2rtc_name && camera.status === 'online'
    ? buildSnapshotUrl(camera.relay_url, camera.go2rtc_name, imgKey)
    : null;

  // Fast refresh for expanded view (every 2 seconds)
  useEffect(() => {
    if (snapshotUrl && camera) {
      intervalRef.current = setInterval(() => {
        setImgKey((k) => k + 1);
        setImgError(false);
      }, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [snapshotUrl, camera]);

  // Reset state when camera changes
  useEffect(() => {
    setImgKey(0);
    setImgError(false);
  }, [camera?.id]);

  return (
    <Modal
      open={!!camera}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{ content: { padding: 16 } }}
      title={
        camera && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: camera.status === 'online' ? '#52c41a' : '#ff4d4f',
            }} />
            <span>{camera.name}</span>
            <Tag color={camera.status === 'online' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
              {camera.status === 'online' ? 'LIVE' : 'OFFLINE'}
            </Tag>
          </div>
        )
      }
    >
      {camera && (
        <div>
          {/* Feed */}
          <div style={{
            background: '#141414',
            borderRadius: 8,
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            {snapshotUrl && !imgError ? (
              <img
                key={imgKey}
                src={snapshotUrl}
                alt={camera.name}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.25)' }}>
                {camera.status === 'offline' ? 'Camera offline' : 'Awaiting go2rtc setup'}
              </Text>
            )}
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            <span>Location: <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{camera.location || '—'}</span></span>
            <span>Floor: <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{camera.floor || '—'}</span></span>
            <span>Provider: <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{camera.provider}</span></span>
            {camera.last_seen_at && (
              <span>Last seen: <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                {new Date(camera.last_seen_at).toLocaleString('en-IN')}
              </span></span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
