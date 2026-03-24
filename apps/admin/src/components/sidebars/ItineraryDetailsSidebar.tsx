import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import {
  Button,
  Card,
  Drawer,
  List,
  message,
  Space,
  Tag,
  Typography,
} from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Form, FormElement } from "../Form";

const { Text } = Typography;

interface AddItineraryDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItinerary: string;
  section: any;
  baseRoute: any;
  refetch?: () => void;
}

interface ListItem {
  id: string;
  type: "selected" | "custom";
  emoji: string;
  description: string;
  title?: string;
}

// Enhanced List Item Component
const ListItemComponent: React.FC<{
  item: ListItem;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  showEdit?: boolean;
  isFaq?: boolean;
}> = ({ item, onEdit, onDelete, showEdit = false, isFaq = false }) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-start gap-3 flex-1">
        {!isFaq && (
          <div className="text-xl leading-tight min-w-6 text-center">
            {item.emoji}
          </div>
        )}
        <div className="flex-1">
          {isFaq ? (
            <div>
              <Text className="text-sm font-medium"> {item.title}</Text>
              <Text className="text-sm text-zui-silver block mt-1">
                {item.description}
              </Text>
            </div>
          ) : (
            <Text className="text-sm">{item.description}</Text>
          )}
        </div>
      </div>
      <Space>
        {showEdit && onEdit && (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(item.id)}
            className="text-zui-secondary hover:text-zui-white"
          />
        )}
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(item.id)}
          className="text-zui-red"
        />
      </Space>
    </div>
  );
};

// Main component
const AddItineraryDetails: React.FC<AddItineraryDetailsProps> = ({
  isOpen,
  selectedItinerary,
  onClose,
  section,
  baseRoute,
  refetch,
}) => {
  const queryClient = useQueryClient();
  const [form] = useForm();
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<
    { id: string; emoji: string; description: string; title?: string }[]
  >([]);

  const { mutate: addDetails } = useMutationApi(
    "CAS_INVENTORY_ITINERARIES",
    {},
    "",
    "POST"
  );

  const { mutate: addEssentials } = useMutationApi(
    "CAS_ESSENTIALS_INVENTORY_ITINERARIES",
    {},
    "",
    "POST"
  );

  const {
    data: tripInfoOptions,
    isLoading,
    error,
  } = useQueryApi<GeneralObject[]>(
    baseRoute === "required-essentials" ? "CAS_ESSENTIALS" : "CAS_INFO",
    {
      enabled: isOpen,
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    baseRoute === "required-essentials" ? "" : baseRoute + "/",
    `limit=-1`
  );

  const formFields: FormElement[] = [
    {
      name: "select_info",
      type: "multiSelect",
      label: "Select Info",
      placeholder: "Select Info",
      required: false,
      options: tripInfoOptions?.map((item) => ({
        label: baseRoute === "faqs" ? item.title : item.description,
        value: item.id,
      })),
    },
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      isHidden: baseRoute !== "faqs",
    },
    {
      name: "emoji",
      type: "emojiPicker",
      label: "Emoji",
      required: true,
      isHidden: baseRoute === "faqs",
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      required: true,
    },
  ];

  const handleClose = useCallback(() => {
    form.resetFields();
    setCustomItems([]);
    setSelectedTrips([]);
    onClose();
  }, [form, onClose]);

  const addCustomItem = useCallback(() => {
    form.validateFields().then((values) => {
      const formValues = form.getFieldsValue();
      const isValidForFaq =
        baseRoute === "faqs" && formValues.title && formValues.description;
      const isValidForOthers =
        baseRoute !== "faqs" && formValues.emoji && formValues.description;

      if (isValidForFaq || isValidForOthers) {
        const newItem = {
          id: Date.now().toString(),
          emoji: formValues.emoji || "📝",
          description: formValues.description,
          ...(baseRoute === "faqs" && { title: formValues.title }),
        };
        setCustomItems((prev) => [...prev, newItem]);
        form.setFieldsValue({
          emoji: "",
          description: "",
          ...(baseRoute === "faqs" && { title: "" }),
        });
      }
    });
  }, [form, baseRoute]);

  const removeCustomItem = useCallback((id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const editCustomItem = useCallback(
    (id: string) => {
      const itemToEdit = customItems.find((item) => item.id === id);
      if (itemToEdit) {
        form.setFieldsValue({
          emoji: itemToEdit.emoji,
          description: itemToEdit.description,
          ...(baseRoute === "faqs" && { title: itemToEdit.title }),
        });
        removeCustomItem(id);
      }
    },
    [customItems, form, removeCustomItem, section]
  );

  const removeSelectedItem = useCallback((id: string) => {
    setSelectedTrips((prev) => prev.filter((tripId) => tripId !== id));
  }, []);

  // Create combined list items
  const listItems: ListItem[] = [
    ...selectedTrips.map((id) => {
      const selectedInfo = tripInfoOptions?.find((info) => info.id === id);
      return {
        id,
        type: "selected" as const,
        emoji: selectedInfo?.icon || "📝",
        description: selectedInfo?.description || id,
        ...(baseRoute === "faqs" && { title: selectedInfo?.title || id }),
      };
    }),
    ...customItems.map((item) => ({
      id: item.id,
      type: "custom" as const,
      emoji: item.emoji,
      description: item.description,
      ...(baseRoute === "faqs" && { title: item.title }),
    })),
  ];

  const handleSave = useCallback(() => {
    // Create array of objects for bulk create
    const bulkPayload: Array<{
      description: string;
      icon: string;
      title?: string;
      name?: string;
    }> = [];

    // Add selected items from multi-select
    selectedTrips.forEach((tripId) => {
      const selectedInfo = tripInfoOptions?.find((info) => info.id === tripId);
      if (selectedInfo) {
        bulkPayload.push({
          description: selectedInfo.description,
          icon: selectedInfo.icon,
          ...(baseRoute === "faqs" && { title: selectedInfo.title }),
          ...(baseRoute === "required-essentials" && {
            name: selectedInfo.description,
          }),
        });
      }
    });

    // Add custom items from the list
    customItems.forEach((item) => {
      bulkPayload.push({
        description: item.description,
        icon: item.emoji,
        ...(baseRoute === "faqs" && { title: item.title }),
        ...(baseRoute === "required-essentials" && {
          name: item.description,
        }),
      });
    });

    // Check if there are items to save
    if (bulkPayload.length === 0) {
      message.warning("Please add at least one item to save.");
      return;
    }

    if (baseRoute === "required-essentials") {
      // For required-essentials, create items in a loop since no bulk-create API
      const route = `/${selectedItinerary}/${baseRoute}/new/`;
      let successCount = 0;
      let errorCount = 0;

      const createItem = (index: number) => {
        if (index >= bulkPayload.length) {
          // All items processed
          if (successCount > 0) {
            message.success(
              `${successCount} itinerary detail(s) added successfully.`
            );
            queryClient.invalidateQueries([
              "cas",
              "essentials",
              "inventory-itineraries",
            ]);
            handleClose();
          }
          if (errorCount > 0) {
            message.error(`${errorCount} item(s) failed to create.`);
          }
          return;
        }

        addEssentials(
          {
            data: bulkPayload[index],
            route: route,
          },
          {
            onSuccess() {
              successCount++;
              createItem(index + 1);
            },
            onError(error) {
              errorCount++;
              console.error(`Error creating item ${index + 1}:`, error);
              createItem(index + 1);
            },
          }
        );
      };

      createItem(0);
    } else {
      // For other routes, use bulk-create API
      const route = `${selectedItinerary}/${baseRoute}/bulk-create/`;

      addDetails(
        {
          data: bulkPayload,
          route: route,
        },
        {
          onSuccess() {
            message.success(
              `${bulkPayload.length} itinerary detail(s) added successfully.`
            );
            queryClient.invalidateQueries(["cas", "sku"]);
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
    selectedTrips,
    customItems,
    tripInfoOptions,
    baseRoute,
    selectedItinerary,
    addEssentials,
    addDetails,
    queryClient,
    handleClose,
  ]);

  return (
    <Drawer
      title={`Add Itinerary ${section}`}
      placement="right"
      open={isOpen}
      width={450}
      onClose={handleClose}
      extra={
        <Button
          onClick={handleSave}
          type="primary"
          disabled={listItems.length === 0}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        <div className="mb-4">
          {/* Form Section */}
          <Form
            formData={form}
            formFields={formFields}
            onValueChange={(changedValues: any) => {
              if (changedValues.select_info) {
                setSelectedTrips(changedValues.select_info);
              }
            }}
          />

          <Button
            onClick={addCustomItem}
            type="dashed"
            block
            size="large"
            className="mt-4"
          >
            Add Custom Item
          </Button>
        </div>

        {/* List Section */}
        <div className="py-6">
          {listItems.length > 0 && (
            <Card title="Added  Info" className="flex flex-col">
              <div>
                {listItems.map((item) => (
                  <ListItemComponent
                    key={item.id}
                    item={item}
                    onEdit={item.type === "custom" ? editCustomItem : undefined}
                    onDelete={
                      item.type === "custom"
                        ? removeCustomItem
                        : removeSelectedItem
                    }
                    showEdit={item.type === "custom"}
                    isFaq={baseRoute === "faqs"}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>

        {listItems.length === 0 && (
          <Card className="text-center">
            <Text type="secondary" className="text-base">
              No items selected yet.
            </Text>
          </Card>
        )}
      </div>
    </Drawer>
  );
};

export default AddItineraryDetails;
