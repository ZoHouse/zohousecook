// apps/pms/src/components/iot/FeaturedCamera.tsx
import { useState, useEffect, useRef } from 'react';
import { Select, Tag } from 'antd';
import type { IoTCamera } from '../../types/iot';
import { buildSnapshotUrl } from '../../types/iot';

interface FeaturedCameraProps {
  cameras: IoTCamera[];
  featured: IoTCamera | null;
}

export function FeaturedCamera({ cameras, featured }: FeaturedCameraProps) {
  const [selected, setSelected] = useState<IoTCamera | null>(featured);
  const [imgKey, setImgKey] = useState(0);
  const [imgError, setImgError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync when featured changes (initial load)
  useEffect(() => {
    if (featured && !selected) setSelected(featured);
  }, [featured, selected]);

  // Auto-refresh snapshot every 5 seconds
  useEffect(() => {
    if (selected?.relay_url && selected.status === 'online') {
      intervalRef.current = setInterval(() => {
        setImgKey((k) => k + 1);
        setImgError(false);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selected]);

  const snapshotUrl = selected?.relay_url && selected?.go2rtc_name
    ? buildSnapshotUrl(selected.relay_url, selected.go2rtc_name, imgKey)
    : null;

  const cameraOptions = cameras.map((c) => ({
    value: c.id,
    label: `${c.name}${c.status === 'offline' ? ' (offline)' : ''}`,
  }));

  const handleSelect = (id: string) => {
    const cam = cameras.find((c) => c.id === id);
    if (cam) {
      setSelected(cam);
      setImgError(false);
      setImgKey(0);
    }
  };

  return (
    <div style={{
      flex: 1,
      background: '#141414',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: 280,
      overflow: 'hidden',
    }}>
      {/* Camera feed or placeholder */}
      {snapshotUrl && !imgError ? (
        <img
          key={imgKey}
          src={snapshotUrl}
          alt={selected?.name || 'Camera feed'}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 4 }}>
            {selected?.name || 'No camera selected'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
            {selected?.status === 'offline' ? 'Camera offline' : 'Awaiting go2rtc setup'}
          </div>
        </div>
      )}

      {/* Overlay: status badges */}
      {selected && (
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          {selected.status === 'online' ? (
            <Tag color="green" style={{ fontSize: 10, border: 'none' }}>
              LIVE
            </Tag>
          ) : (
            <Tag color="red" style={{ fontSize: 10, border: 'none' }}>
              OFFLINE
            </Tag>
          )}
          <Tag style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.45)', fontSize: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            {selected.location || selected.floor || '—'}
          </Tag>
        </div>
      )}

      {/* Overlay: camera selector */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <Select
          value={selected?.id}
          onChange={handleSelect}
          options={cameraOptions}
          size="small"
          style={{ minWidth: 140 }}
          popupMatchSelectWidth={false}
          variant="borderless"
          dropdownStyle={{ background: '#1f1f1f' }}
        />
      </div>
    </div>
  );
}
