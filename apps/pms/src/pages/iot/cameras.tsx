import { useState } from 'react';
import { Col, Row, Empty, Spin } from 'antd';
import useAssociation from '../../hooks/useAssociation';
import { useIoTCameras } from '../../hooks/iot';
import { CameraCard } from '../../components/iot/CameraCard';
import { CameraExpandModal } from '../../components/iot/CameraExpandModal';
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard';
import { Page, PageContent, PageHeader } from '../../components/ui';
import type { IoTCamera } from '../../types/iot';

function CamerasPage() {
  const { selectedOperator } = useAssociation();
  const operatorCode = selectedOperator?.code;
  const { cameras, isLoading, error } = useIoTCameras(operatorCode);
  const [expandedCamera, setExpandedCamera] = useState<IoTCamera | null>(null);

  return (
    <Page>
      <PageHeader title="Cameras" icon="Cctv" />
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : error ? (
          <Empty description={`Error loading cameras: ${error}`} />
        ) : cameras.length === 0 ? (
          <Empty description="No cameras configured for this property" />
        ) : (
          <Row gutter={[12, 12]}>
            {cameras.map((camera) => (
              <Col key={camera.id} xs={24} sm={12} md={8} lg={6}>
                <CameraCard camera={camera} onClick={setExpandedCamera} />
              </Col>
            ))}
          </Row>
        )}

        <CameraExpandModal
          camera={expandedCamera}
          onClose={() => setExpandedCamera(null)}
        />
      </PageContent>
    </Page>
  );
}

export default function IoTCameras() {
  return (
    <ZoHouseGuard>
      <CamerasPage />
    </ZoHouseGuard>
  );
}
