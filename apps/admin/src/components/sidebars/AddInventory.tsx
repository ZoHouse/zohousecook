import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { cn } from "@zo/utils/font";
import { useFormValidation, useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import { ImageUploaderFile } from "libs/moal/src/ui/ImageUploader";
import React, { useEffect, useState } from "react";
import { ImageUploaderSidebar, PolicySidebar } from ".";
import { Currency, Inventory, Policy, Sku } from "../../config";
import { Form, FormElement } from "../Form";
import { SkuAccordion } from "../helpers/houses";
import { SkuAccordionType } from "../helpers/houses/SkuAccordion";
import SkuSidebar from "./SkuSidebar";

interface AddInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
  currency: Currency;
  operatorId?: string | null;
  type: "stay" | "utility";
}

const AddInventory: React.FC<AddInventoryProps> = ({
  isOpen,
  onClose,
  currency,
  estateId,
  operatorId,
  type,
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);

  const [isImagePickerVisible, showImagePicker, hideImagePicker] =
    useVisibilityState(false);
  const [isSkuSidebarVisible, showSkuSidebar, hideSkuSidebar] =
    useVisibilityState(false);
  const [isPolicySidebarVisible, showPolicySidebar, hidePolicySidebar] =
    useVisibilityState(false);

  const [uploadedImages, setUploadedImages] = useState<ImageUploaderFile[]>([]);
  const [skus, setSkus] = useState<SkuAccordionType[]>([]);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);

  const [form] = useForm();
  const { message } = App.useApp();

  const { data: inventoryCategoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.inventory.category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: taxCategoryOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.taxation.tax_category.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: applicabletaxOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.taxation.applicable_taxes.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { mutate: createInventory } = useMutationApi("CAS_INVENTORY");
  const { mutateAsync: createSku } = useMutationApi("CAS_SKU");
  const { mutateAsync: uploadMedia } = useMutationApi("CAS_MEDIA");

  const handleClose = () => {
    form.resetFields();
    setSkus([]);
    setUploadedImages([]);
    onClose();
  };

  const updateMedia = async (route: string, imageData: ImageUploaderFile) => {
    if (imageData) {
      const formData = new FormData();
      formData.append("file", imageData.image);
      formData.append("category", "image");
      formData.append(
        "metadata",
        JSON.stringify({
          alt: imageData.alt,
          title: imageData.title,
          description: imageData.description,
        })
      );
      await uploadMedia({
        data: formData,
        route: route,
      });
    }
  };

  const { mutate: createPolicies } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );

  const handleSave = async () => {
    if (operatorId) {
      let updatedSkus: SkuAccordionType[] = skus;

      if (updatedSkus.length === 0) {
        message.error("Please add at least one SKU.");
        return;
      }

      if (form.getFieldValue("category") === "room" && skus.length === 0) {
        updatedSkus = [
          {
            name: form.getFieldValue("name"),
            price: 0,
            sellable: true,
            space: "",
            units: 1,
            slabs: [],
          },
        ];
      }

      createInventory(
        {
          data: {
            ...form.getFieldsValue(),
            operator: operatorId,
            price: form.getFieldValue("price") || 0,
            occupancy: form.getFieldValue("occupancy") || 1,
            type: form.getFieldValue("type"),
          },
        },
        {
          onSuccess: (data) => {
            const inventoryDetails: Inventory = data.data;
            updatedSkus.forEach((sku) =>
              createSku({
                data: { ...sku, inventory: inventoryDetails.id },
              })
            );
            if (uploadedImages.length > 0) {
              const updateMediaPromises = uploadedImages.map((media) =>
                updateMedia(`inventory/${inventoryDetails.id}/`, media)
              );
              Promise.all(updateMediaPromises)
                .then(() => {
                  message.success("Room Created.");
                  handleClose();
                })
                .catch((error) => {
                  console.error("Error updating media:", error);
                });
            } else {
              message.success("Room Created.");
              handleClose();
            }

            const filteredPolicies = policies
              .filter((policy) => isValidString(policy.description))
              .map(({ title, icon, description, id, sort_index }) => ({
                title,
                icon,
                description,
                id,
                sort_index,
              }));

            createPolicies(
              {
                data: filteredPolicies,
                route: `${inventoryDetails.id}/policies/replace-all/`,
              },
              {
                onSuccess() {},
                onError(error) {
                  message.error(processResponseError(error));
                },
              }
            );
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  const handleImageSelect = (image: ImageUploaderFile) => {
    setUploadedImages((prev) => [...prev, image]);
  };

  const handleSkuDelete = (skuId: string) => {
    setSkus(skus.filter((element) => element.id !== skuId));
  };

  const handleSkuSave = (sku: GeneralObject, callback?: () => void) => {
    const uuid = crypto.randomUUID();
    setSkus((prev) => [...prev, { ...(sku as SkuAccordionType), id: uuid }]);
    if (callback) {
      callback();
    }
  };

  const handleSkuSidebarClose = () => {
    setSelectedSku(null);
    hideSkuSidebar();
  };

  const formFields: FormElement[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "type",
      label: "Type",
      type: "radio",
      required: true,
      options: [
        { label: "Stay", value: "stay" },
        { label: "Utility", value: "utility" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "radio",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "category",
      label: "Room Category",
      type: "select",
      required: true,
      options: inventoryCategoryOptions,
    },
    {
      name: "description",
      label: "Description",
      required: true,
      type: "textarea",
    },
    {
      name: "occupancy",
      label: "Max Cccupancy",
      required: true,
      type: "spinner",
      minValue: 0,
    },

    {
      label: "Tax Category",
      name: "tax_category",
      type: "select",
      required: true,
      options: taxCategoryOptions,
    },
    {
      name: "applicable_taxes",
      label: "Applicable Taxes",
      type: "multiSelect",
      required: true,
      options: applicabletaxOptions,
    },
  ];

  const { areAllRequiredFieldsPresent } = useFormValidation(
    form,
    formFields as FormElementType[]
  );

  useEffect(() => {
    form.setFieldValue("type", type);
  }, [type]);

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      maskClosable={false}
      title="Add Inventory"
      extra={
        <Button
          disabled={!areAllRequiredFieldsPresent}
          type="primary"
          onClick={handleSave}
        >
          Save
        </Button>
      }
    >
      <div className="pb-10">
        <h2 className="text-zui-silver mb-6">Basic Info</h2>
        <Form formData={form} formFields={formFields} />

        <SkuAccordion
          skus={skus || []}
          onAddClick={showSkuSidebar}
          onDelete={handleSkuDelete}
          currency={currency}
          inventoryType={type}
        />

        <h2 className="text-zui-silver mt-8 mb-3">Photos</h2>
        <div className="grid grid-cols-2 gap-2 mb-8">
          {uploadedImages.map((image, i) => {
            if (i === 0) {
              return (
                <div className="h-[180px] relative col-span-2 overflow-hidden">
                  <span className="absolute top-2 left-2 bg-white text-black z-10 text-sm px-3 py-0.5 font-semibold">
                    Cover Image
                  </span>

                  <img
                    className="object-cover w-full h-full"
                    src={URL.createObjectURL(image.image)}
                    alt={image.alt}
                  />
                </div>
              );
            } else {
              return (
                <div className="h-[120px] overflow-hidden">
                  <img
                    src={URL.createObjectURL(image.image)}
                    className="object-cover w-full h-full"
                    alt={image.alt}
                  />
                </div>
              );
            }
          })}
          <div
            className={cn(
              "w-full object-cover border border-gray-800 cursor-pointer flex items-center justify-center ",
              uploadedImages.length < 1
                ? "col-span-2 h-[180px]"
                : "col-span-1 h-[120px]"
            )}
            onClick={showImagePicker}
          >
            <div className="flex flex-col items-center justify-center p-4">
              <Icon name="Plus" size={24} />
              <span className="text-sm text-zui-silver">Add Photo</span>
            </div>
          </div>
        </div>
        <h2 className="text-zui-silver mt-8 mb-3">Policy</h2>
        <Button
          className="w-full"
          onClick={showPolicySidebar}
          size="large"
          type="default"
        >
          Manage Policy
        </Button>
        <h2 className="text-zui-silver mt-8 mb-3">Amenities</h2>
        <div className="w-full p-4 text-sm text-zui-silver text-left bg-zui-dark">
          Amenites can be after the inventory has been created.
        </div>
      </div>
      <ImageUploaderSidebar
        isOpen={isImagePickerVisible}
        onClose={hideImagePicker}
        onSelect={handleImageSelect}
      />
      <SkuSidebar
        currency={currency}
        estateId={estateId}
        inventoryCategory={form.getFieldValue("category")}
        isOpen={isSkuSidebarVisible}
        onClose={handleSkuSidebarClose}
        onSave={handleSkuSave}
        sku={selectedSku}
      />
      <PolicySidebar
        isOpen={isPolicySidebarVisible}
        onClose={hidePolicySidebar}
        onSave={hidePolicySidebar}
        policies={policies}
        setPolicies={setPolicies}
      />
    </Drawer>
  );
};

export default AddInventory;
