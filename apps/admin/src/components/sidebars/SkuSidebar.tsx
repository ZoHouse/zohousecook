import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { Currency } from "@zo/definitions/admin";
import { GeneralObject } from "@zo/definitions/general";
import { getChangedFields, isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Button, Collapse, Drawer, message, Typography } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useMemo, useState } from "react";
import { CASSpaceByFloorResponse, Sku } from "../../config";
import { Form, FormElement } from "../Form";
const { Panel } = Collapse;

interface SkuSidebarProps {
  estateId: string;
  inventoryCategory: string;
  currency: Currency;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GeneralObject, callback?: () => void) => void;
  onUpdate?: (data: GeneralObject, skuId: string) => void;
  sku: Sku | null;
}

interface PriceSlabsPanelProps {
  form: any;
  currency: Currency;
  setSlabs: (slabs: [number, number][]) => void;
  slabs: [number, number][];
}

interface PriceSlab {
  minDays: number;
  price: number;
}

const SkuSidebar: React.FC<SkuSidebarProps> = ({
  estateId,
  currency,
  inventoryCategory,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  sku,
}) => {
  const [form] = useForm();
  const [slabs, setSlabs] = useState<[number, number][]>([]);

  const initialData = useMemo(() => {
    if (sku && isValidObject(sku)) {
      const transformedSlabs = sku.slabs?.map((slabArray) => ({
        slabDays: slabArray[0],
        slabPrice: slabArray[1],
      })) || [{ slabDays: null, slabPrice: null }];

      return {
        name: sku.name,
        space: sku.space?.id,
        price: sku.price,
        sellable: sku.sellable,
        slabs: transformedSlabs,
      };
    }
    return {};
  }, [sku]);

  const { data: spacesOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      enabled: isValidString(estateId),
      select: (data) =>
        data.data.results.map((space: CASSpaceByFloorResponse) => {
          return {
            value: space.id,
            label: space.name,
          };
        }),
    },
    "",
    `floor__estate=${estateId}&limit=100`
  );

  const handleClose = () => {
    form.resetFields();
    setSlabs([]);
    onClose();
  };

  const handleSave = () => {
    form
      .validateFields()
      .then((rawFormData) => {
        const data = {
          ...rawFormData,
          slabs,
        };

        if (sku?.id && onUpdate) {
          return onUpdate(getChangedFields(initialData, data), sku.id);
        } else {
          return onSave(data, handleClose);
        }
      })
      .then(() => {
        handleClose();
      })
      .catch((error) => {
        message.error(`Failed to save SKU`);
      });
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "space",
      label: "Space",
      type: "select",
      options: spacesOptions,
      required: true,
    },
    {
      name: "price",
      label: "Price",
      type: "price",
      currency: currency,
      required: true,
    },
    {
      name: "sellable",
      label: "Sellable",
      type: "toggleSelector",
      initialValue: true,
    },
  ];

  useEffect(() => {
    if (initialData && isValidObject(initialData)) {
      form.setFieldsValue(initialData);
    }
  }, [initialData]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={isValidObject(sku) ? "Update SKU" : "Create SKU"}
      extra={<Button onClick={handleSave}>Save</Button>}
    >
      <Form formData={form} formFields={formFields} />
      <PriceSlabsPanel
        form={form}
        currency={currency}
        setSlabs={setSlabs}
        slabs={slabs}
      />
    </Drawer>
  );
};

export default SkuSidebar;

const PriceSlabsPanel: React.FC<PriceSlabsPanelProps> = ({
  form,
  currency,
  setSlabs,
  slabs,
}) => {
  const [slabList, setSlabList] = useState<[number, number][]>(slabs);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setSlabList(slabs);
    if (slabs.length === 0) {
      form.resetFields(["slabPrice", "slabDays"]);
      setEditingIndex(null);
    }
  }, [slabs]);

  const handleSaveSlab = () => {
    const price = form.getFieldValue("slabPrice");
    const days = form.getFieldValue("slabDays");

    if (price && days) {
      const newSlab: [number, number] = [Number(days), Number(price)];

      if (editingIndex !== null) {
        const newSlabs = [...slabList];
        newSlabs[editingIndex] = newSlab;
        setSlabList(newSlabs);
        setSlabs(newSlabs);
      } else {
        const newSlabs = [...slabList, newSlab];
        setSlabList(newSlabs);
        setSlabs(newSlabs);
      }

      form.resetFields(["slabPrice", "slabDays"]);
      setEditingIndex(null);
    }
  };

  const handleEdit = (index: number) => {
    const [days, price] = slabList[index];
    form.setFieldsValue({
      slabPrice: price,
      slabDays: days,
    });
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const newSlabs = slabList.filter((_, i) => i !== index);
    setSlabList(newSlabs);
    setSlabs(newSlabs);

    if (editingIndex === index) {
      form.resetFields(["slabPrice", "slabDays"]);
      setEditingIndex(null);
    }
  };

  const formatPrice = (price: number) => {
    return (
      price * Math.pow(10, currency.decimals ? -currency.decimals : -8)
    ).toFixed(2);
  };

  return (
    <Collapse defaultActiveKey={["1"]}>
      <Panel
        header={
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <Typography.Text className="text-base font-medium">
                Price Slabs
              </Typography.Text>
              {slabList.length > 0 && (
                <Typography.Text type="secondary" className="text-sm">
                  ({slabList.length})
                </Typography.Text>
              )}
            </div>
          </div>
        }
        key="1"
      >
        <div className="space-y-3">
          <div className="bg-zui-light p-4 ">
            <div className="mb-3">
              <Form
                formFields={[
                  {
                    name: "slabPrice",
                    label: "Price",
                    type: "price",
                    currency: currency,
                  },
                ]}
                formData={form}
              />
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Form
                  formFields={[
                    {
                      name: "slabDays",
                      label: "Min. Days",
                      type: "number",
                      minValue: 1,
                      placeholder: "Days",
                    },
                  ]}
                  formData={form}
                />
              </div>

              <Button
                type="primary"
                onClick={handleSaveSlab}
                icon={
                  editingIndex !== null ? <EditOutlined /> : <PlusOutlined />
                }
                className="mt-7 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingIndex !== null ? "Update" : "Add"} Slab
              </Button>
            </div>
          </div>

          {/* Slabs List */}
          {slabList.length > 0 && (
            <div className="space-y-2">
              {slabList.map(([days, price], index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-zui-light "
                >
                  <div className="flex items-center gap-3">
                    <CalendarOutlined className="text-primary" />
                    <span className="font-medium">
                      {formatPrice(price)} {currency.symbol || currency.code}
                    </span>
                    <span className="text-gray-500">({days} days)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(index)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {slabList.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No price slabs added yet
            </div>
          )}
        </div>
      </Panel>
    </Collapse>
  );
};
