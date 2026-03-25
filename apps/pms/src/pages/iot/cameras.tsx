// apps/pms/src/pages/iot/cameras.tsx
import { useState } from 'react';
import { Col, Row, Empty, Spin } from 'antd';
import { useAssociation } from '../../hooks';
import { useIoTCameras } from '../../hooks/iot';
import { CameraCard } from '../../components/iot/CameraCard';
import { CameraExpandModal } from '../../components/iot/CameraExpandModal';
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard';
import type { IoTCamera } from '../../types/iot';

function CamerasPage() {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code;
  const { cameras, isLoading, error } = useIoTCameras(operatorCode);
  const [expandedCamera, setExpandedCamera] = useState<IoTCamera | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description={`Error loading cameras: ${error}`} />
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="No cameras configured for this property" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {cameras.map((camera) => (
          <Col key={camera.id} xs={24} sm={12} md={8} lg={6}>
            <CameraCard camera={camera} onClick={setExpandedCamera} />
          </Col>
        ))}
      </Row>

      <CameraExpandModal
        camera={expandedCamera}
        onClose={() => setExpandedCamera(null)}
      />
    </div>
  );
}

export default function IoTCameras() {
  return (
    <ZoHouseGuard>
      <CamerasPage />
    </ZoHouseGuard>
  );
}
