import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { PageContent, PageHeader } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useSortableList, useVisibilityState } from "@zo/utils/hooks";
import { isValidUUID } from "@zo/utils/string";
import { Button, Empty, message, Spin } from "antd";
import { OperatorFAQ } from "apps/admin/src/config";
import React, { useState } from "react";
import { PartnerFaqsSidebar } from "../../sidebars";

interface PartnerFaqsProps {
  operatorId?: string;
}

interface SortableFaqItemProps {
  faq: OperatorFAQ;
  onEdit?: (faq: OperatorFAQ) => void;
  onDelete?: (faq: OperatorFAQ) => void;
}

const SortableFaqItem: React.FC<SortableFaqItemProps> = ({
  faq,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zui-light p-4 mb-2"
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          className="cursor-move flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors pt-1"
        >
          <HolderOutlined className="text-lg" />
        </div>
        <div className="flex-grow">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {faq.title || "Untitled"}
              </h3>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit?.(faq)}
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete?.(faq)}
                />
              </div>
            </div>
            <div className="text-zui-white leading-relaxed">
              {faq.description || "No description"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PartnerFaqs: React.FC<PartnerFaqsProps> = ({ operatorId }) => {
  const [selectedFaq, setSelectedFaq] = useState<OperatorFAQ>(
    {} as OperatorFAQ
  );

  const [isAddFaqVisible, showAddFaq, hideAddFaq] = useVisibilityState();

  const { data, refetch, isLoading } = useQueryApi<OperatorFAQ[]>(
    "CAS_OPERATORS",
    { enabled: isValidUUID(operatorId), select: (res) => res.data },
    `${operatorId}/faqs/`,
    "limit=-1"
  );

  const { mutate: updateFaq } = useMutationApi("CAS_OPERATORS", {}, "", "PUT");
  const { mutate: deleteFaq } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    "DELETE"
  );

  const {
    sortedItems,
    handleDelete: handleDeleteFaq,
    dndContextProps,
    sortableContextProps,
    DndContext,
    SortableContext,
  } = useSortableList({
    items: data || [],
    apiConfig: { routeBuilder: (item) => `${operatorId}/faqs/${item.id}/` },
    updateMutation: updateFaq,
    deleteMutation: deleteFaq,
    onUpdateSuccess: () => {
      message.success("FAQ updated successfully");
      refetch?.();
    },
    onUpdateError: (err) =>
      message.error(processResponseError(err) || "Failed to reorder FAQ"),
    onDeleteSuccess: () => {
      message.success("FAQ deleted successfully");
      refetch?.();
    },
    onDeleteError: (err) =>
      message.error(processResponseError(err) || "Failed to delete FAQ"),
  });

  const handleEditFaq = (faq: OperatorFAQ) => {
    setSelectedFaq(faq);
    showAddFaq();
  };

  const handleClose = () => {
    setSelectedFaq({} as OperatorFAQ);
    hideAddFaq();
  };

  return (
    <>
      <PageHeader
        title="Partner FAQs"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add FAQ",
            onClick: showAddFaq,
            type: "secondary",
          },
        ]}
      />
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Empty
              description="No FAQs added yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <DndContext {...dndContextProps}>
            <SortableContext {...sortableContextProps}>
              {sortedItems.map((faq) => (
                <SortableFaqItem
                  key={faq.id}
                  faq={faq as OperatorFAQ}
                  onEdit={handleEditFaq}
                  onDelete={handleDeleteFaq}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </PageContent>

      <PartnerFaqsSidebar
        isOpen={isAddFaqVisible}
        onClose={handleClose}
        operatorId={operatorId}
        refetch={refetch}
        selectedFaq={selectedFaq}
      />
    </>
  );
};

export default PartnerFaqs;
