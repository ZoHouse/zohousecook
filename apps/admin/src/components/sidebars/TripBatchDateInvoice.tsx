import {
  DeleteOutlined,
  FileOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useInfiniteTable } from "@zo/moal";
import { isValidUUID } from "@zo/utils/string";
import { Button, Card, Drawer, message } from "antd";
import React, { useMemo, useState } from "react";
import TripBatchDocumentUpload from "./TripBatchDocumentUploadSidebar";

interface Document {
  url: string;
  name?: string;
}

interface TripBatchDateInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: GeneralObject;
  batchId: string;
}

const TripBatchDateInvoice: React.FC<TripBatchDateInvoiceProps> = ({
  isOpen,
  onClose,
  selectedDate,
  batchId,
}) => {
  // States
  const [isDocumentUploadVisible, setIsDocumentUploadVisible] = useState(false);
  const [tripAvailabilityData, setTripAvailabilityData] = useState<
    GeneralObject[]
  >([]);

  // API
  const { refetch: refreshTripAvailability } = useInfiniteTable({
    setter: setTripAvailabilityData,
    queryEndpoint: "CAS_SKU",
    customSearchQuery: "type=trip",
    enabled: isOpen && isValidUUID(batchId),
    name: "trips",
    additionalRoute: `${batchId}/availability/`,
  });

  const { mutate: updateTripDocuments } = useMutationApi(
    "CAS_SKU",
    {},
    "",
    "PUT"
  );

  // current date data
  const selectedDateAvailability = useMemo(
    () =>
      tripAvailabilityData.find((entry) => entry.date === selectedDate?.date),
    [tripAvailabilityData, selectedDate?.date]
  );

  // Handlers
  const handleDocumentDelete = async (documentUrl: string) => {
    if (!selectedDateAvailability?.data?.documents) {
      message.error("No documents found for this date");
      return;
    }

    try {
      const remainingDocuments = selectedDateAvailability.data.documents.filter(
        (doc: Document) => doc.url !== documentUrl
      );

      await updateTripDocuments(
        {
          data: {
            data: {
              documents: remainingDocuments,
            },
            slot: null,
          },
          route: `${batchId}/availability/${selectedDate?.id}/`,
        },
        {
          onSuccess: () => {
            message.success("Document deleted successfully");
            refreshTripAvailability();
          },
          onError: () => {
            message.error("Failed to delete document");
          },
        }
      );
    } catch {
      message.error("Failed to delete document");
    }
  };

  // Document card component
  const DocumentCard = ({ document }: { document: Document }) => {
    return (
      <Card
        key={document.url}
        size="small"
        className="shadow-sm hover:shadow-md transition-shadow"
        actions={[
          <Button
            key="view"
            type="link"
            onClick={() => window.open(document.url, "_blank")}
          >
            View File
          </Button>,
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDocumentDelete(document.url)}
          />,
        ]}
      >
        <div className="flex items-center gap-3 p-2">
          <FileOutlined className="text-2xl text-zui-silver" />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{document.name}</div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <Drawer
        title="Trip Documents"
        open={isOpen}
        onClose={onClose}
        width={720}
        extra={
          <Button
            type="primary"
            onClick={() => setIsDocumentUploadVisible(true)}
            icon={<UploadOutlined />}
          >
            Upload Documents
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedDateAvailability?.data?.documents?.map(
            (document: Document) => (
              <DocumentCard key={document.url} document={document} />
            )
          )}

          {!selectedDateAvailability?.data?.documents?.length && (
            <div className="col-span-2 text-center py-8 text-zui-silver">
              No documents uploaded yet
            </div>
          )}
        </div>
      </Drawer>

      <TripBatchDocumentUpload
        isOpen={isDocumentUploadVisible}
        onClose={() => setIsDocumentUploadVisible(false)}
        selectedDate={selectedDate}
        batchId={batchId}
        onSuccess={refreshTripAvailability}
        documents={selectedDateAvailability?.data || {}}
      />
    </>
  );
};

export default TripBatchDateInvoice;
