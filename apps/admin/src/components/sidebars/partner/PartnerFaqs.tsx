import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { isValidObject } from "@zo/utils/object";
import { Button, Card, Drawer, message, Space, Spin, Typography } from "antd";
import { useForm } from "antd/es/form/Form";
import { OperatorFAQ } from "apps/admin/src/config";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../../Form";

const { Text } = Typography;

interface PartnerFaqsProps {
  isOpen: boolean;
  onClose: () => void;
  operatorId?: string;
  refetch?: () => void;
  selectedFaq?: OperatorFAQ;
}

interface FaqItem {
  id: string;
  title?: string;
  description: string;
}

const PartnerFaqsSidebar: React.FC<PartnerFaqsProps> = ({
  isOpen,
  onClose,
  operatorId,
  refetch,
  selectedFaq,
}) => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  const isEditMode = isValidObject(selectedFaq);
  console.log(selectedFaq, isEditMode, "isEditMode");

  const { mutate: saveFaq, isLoading } = useMutationApi(
    "CAS_OPERATORS",
    {},
    "",
    isEditMode ? "PUT" : "POST"
  );

  const formFields: FormElement[] = [
    { name: "title", type: "text", label: "Title", required: true },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      required: true,
    },
  ];

  // Prefill form in edit mode
  const initialData = useMemo(() => {
    return selectedFaq
      ? { title: selectedFaq.title, description: selectedFaq.description }
      : {};
  }, [selectedFaq]);

  useEffect(() => {
    if (selectedFaq) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [selectedFaq, initialData, form]);

  const resetForm = useCallback(() => {
    form.resetFields();
    setFaqs([]);
    setEditingFaqId(null);
  }, [form]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const addOrEditFaqItem = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (editingFaqId) {
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === editingFaqId
              ? { ...f, title: values.title, description: values.description }
              : f
          )
        );
        setEditingFaqId(null);
      } else {
        setFaqs((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            title: values.title,
            description: values.description,
          },
        ]);
      }

      form.resetFields();
    } catch {}
  }, [form, editingFaqId]);

  const editFaqItem = useCallback(
    (id: string) => {
      const item = faqs.find((f) => f.id === id);
      if (item) {
        form.setFieldsValue({
          title: item.title,
          description: item.description,
        });
        setEditingFaqId(id);
      }
    },
    [faqs, form]
  );

  const removeFaqItem = useCallback(
    (id: string) => {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      if (editingFaqId === id) setEditingFaqId(null);
    },
    [editingFaqId]
  );

  const handleSave = useCallback(async () => {
    if (!operatorId) return;

    if (isEditMode && selectedFaq) {
      // Single FAQ update
      const values = await form.validateFields();
      saveFaq(
        { data: values, route: `${operatorId}/faqs/${selectedFaq.id}/` },
        {
          onSuccess() {
            message.success("FAQ updated successfully.");
            queryClient.invalidateQueries(["cas", "operators"]);
            handleClose();
            refetch?.();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    } else if (faqs.length > 0) {
      // Bulk create
      const payload = faqs.map(({ title, description }) => ({
        title: title || "",
        description,
      }));
      saveFaq(
        { data: payload, route: `${operatorId}/faqs/bulk-create/` },
        {
          onSuccess() {
            message.success(`${payload.length} FAQs added successfully.`);
            queryClient.invalidateQueries(["cas", "operators"]);
            handleClose();
            refetch?.();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  }, [
    faqs,
    operatorId,
    isEditMode,
    selectedFaq,
    saveFaq,
    queryClient,
    handleClose,
    refetch,
    form,
  ]);

  return (
    <Drawer
      title={isEditMode ? "Edit FAQ" : "Add FAQs"}
      open={isOpen}
      onClose={handleClose}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!isEditMode && faqs.length === 0}
        >
          {isLoading ? <Spin size="small" /> : "Save"}
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Form Section */}
        <div className="mb-4">
          <Form formData={form} formFields={formFields} />
          {!isEditMode && (
            <Button
              type="dashed"
              block
              size="large"
              className="mt-4"
              onClick={addOrEditFaqItem}
            >
              {editingFaqId ? "Update FAQ" : "Add FAQ"}
            </Button>
          )}
        </div>

        {/* List Section (only for adding multiple FAQs) */}
        {!isEditMode && (
          <div className="py-6">
            {faqs.length > 0 ? (
              <Card title="Added FAQs" className="flex flex-col">
                {faqs.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start mb-4"
                  >
                    <div className="flex-1">
                      <Text className="text-sm font-medium">{item.title}</Text>
                      <Text className="text-sm text-zui-silver block mt-1">
                        {item.description}
                      </Text>
                    </div>
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => editFaqItem(item.id)}
                        className="text-zui-secondary hover:text-zui-white"
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFaqItem(item.id)}
                        className="text-zui-red"
                      />
                    </Space>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="text-center">
                <Text type="secondary" className="text-base">
                  No FAQs added yet.
                </Text>
              </Card>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default PartnerFaqsSidebar;
