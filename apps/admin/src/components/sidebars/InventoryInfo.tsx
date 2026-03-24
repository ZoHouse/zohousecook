import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormElementType } from "@zo/moal";
import { processResponseError } from "@zo/utils/auth";
import { useFormValidation, useVisibilityState } from "@zo/utils/hooks";
import { getChangedFields } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { Currency, Inventory, Policy, Sku } from "../../config";

import { App, Button, Drawer } from "antd";
import { useForm } from "antd/es/form/Form";
import { ImageUploaderSidebar } from ".";
import { Form, FormElement } from "../Form";
import SkuAccordion, { SkuAccordionType } from "../helpers/houses/SkuAccordion";
import InventoryAmenitiesSidebar from "./InventoryAmenitiesSidebar";
import MediaGallerySidebar from "./MediaGallerySidebar";
import PolicySidebar from "./PolicySidebar";
import SkuSidebar from "./SkuSidebar";

interface RoomInfoProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
  operatorId: string | undefined;
  inventoryId: string;
  currency: Currency;
  refetch: () => void;
}

const RoomInfo: React.FC<RoomInfoProps> = ({
  estateId,
  isOpen,
  onClose,
  inventoryId,
  currency,
  refetch,
}) => {
  const queryClient = useQueryClient();

  const { message } = App.useApp();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);

  const [isImagePickerVisible, showImagePicker, hideImagePicker] =
    useVisibilityState(false);
  const [isSkuSidebarVisible, showSkuSidebar, hideSkuSidebar] =
    useVisibilityState(false);
  const [isPolicySidebarVisible, showPolicySidebar, hidePolicySidebar] =
    useVisibilityState(false);
  const [
    isMediaGallerySidebarVisible,
    showMediaGallerySidebar,
    hideMediaGallerySidebar,
  ] = useVisibilityState(false);
  const [
    isAmenitiesSidebarVisible,
    showAmenitiesSidebar,
    hideAmenitiesSidebar,
  ] = useVisibilityState(false);

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

  const { data: InventoryDetails, refetch: refetchInventoryDetails } =
    useQueryApi<Inventory>(
      "CAS_INVENTORY",
      {
        enabled: isOpen && inventoryId != undefined,
        select: (data) => data.data,
      },
      `${inventoryId}/`
    );

  const { data: InventoryPolicies, refetch: refetchInventoryPolicies } =
    useQueryApi<Policy[]>(
      "CAS_INVENTORY",
      {
        enabled: isOpen && inventoryId != undefined,
        select: (data) => data.data,
      },
      `${inventoryId}/policies/`,
      "limit=-1"
    );

  useEffect(() => {
    if (InventoryPolicies) {
      setPolicies(InventoryPolicies);
    }
  }, [InventoryPolicies]);

  const { data: skus, refetch: refetchSkus } = useQueryApi<SkuAccordionType[]>(
    "CAS_SKU",
    {
      enabled: isValidString(inventoryId),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    `inventory=${inventoryId}&limit=-1`
  );

  const formattedData = useMemo(() => {
    if (InventoryDetails) {
      return {
        name: InventoryDetails.name,
        occupancy: InventoryDetails.occupancy || 0,
        status: InventoryDetails.status,
        applicable_taxes: InventoryDetails.applicable_taxes,
        category: InventoryDetails.category,
        description: InventoryDetails.description,
        tax_category: InventoryDetails.tax_category,
        type: InventoryDetails.type,
      };
    } else {
      return {};
    }
  }, [InventoryDetails]);

  const { mutate: updateInventory } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );

  const { mutate: deleteSku } = useMutationApi("CAS_SKU", {}, "", "DELETE");
  const { mutate: createSku } = useMutationApi("CAS_SKU");
  const { mutate: updateSku } = useMutationApi("CAS_SKU", {}, "", "PUT");

  const { mutate: uploadMedia } = useMutationApi("CAS_MEDIA");

  const [form] = useForm();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSavePolicy = (policies: Policy[]) => {
    const allPolicies = policies
      .filter((policy) => isValidString(policy.description))
      .map(({ title, icon, description, id, sort_index }) => ({
        title,
        icon,
        description,
        sort_index,
        id,
      }));

    if (inventoryId) {
      updateInventory(
        {
          data: allPolicies,
          route: `${inventoryId}/policies/replace-all/`,
        },
        {
          onSuccess() {
            refetchInventoryPolicies();
            message.success("Policies have been updated");
            hidePolicySidebar();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    }
  };

  const handleSave = async () => {
    updateInventory(
      {
        data: getChangedFields(formattedData, form.getFieldsValue()),
        route: `${inventoryId}/`,
      },
      {
        onSuccess() {
          message.success("Inventory details have been updated");
          queryClient.invalidateQueries({
            queryKey: ["cas", "inventory"],
          });
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleSkuSave = (data: GeneralObject, callback?: () => void) => {
    createSku(
      {
        data: { ...data, inventory: inventoryId },
      },
      {
        onSuccess() {
          message.success("Sku Created.");
          refetchSkus();
          if (callback) {
            callback();
          }
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleSkuUpdate = (data: GeneralObject, skuId: string) => {
    updateSku(
      {
        data: { ...data, inventory: inventoryId },
        route: `${skuId}/`,
      },
      {
        onSuccess() {
          message.success("Sku Updated.");
          refetchSkus();
          hideSkuSidebar();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleSkuDelete = (skuId: string) => {
    deleteSku(
      { data: {}, route: `${skuId}/` },
      {
        onSuccess() {
          message.success("Sku has been Deleted.");
          refetchSkus();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };
  const handleSkuEdit = (sku: GeneralObject) => {
    setSelectedSku(sku as Sku);
    showSkuSidebar();
  };

  const handleSkuSidebarClose = () => {
    setSelectedSku(null);
    hideSkuSidebar();
  };

  const uploadImageHandler = async (imageData: GeneralObject) => {
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

    await uploadMedia(
      {
        data: formData,
        route: `inventory/${inventoryId}/`,
      },
      {
        onSuccess: () => {
          message.success("Image Uploaded");
          refetchInventoryDetails();
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
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

  useEffect(() => {
    if (formattedData) {
      form.setFieldsValue(formattedData);
    }
  }, [formattedData]);

  const { hasFormDataChanged } = useFormValidation(
    form,
    formFields as FormElementType[],
    formattedData
  );

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Inventory Info"
      extra={
        <Button
          onClick={handleSave}
          type="primary"
          disabled={!hasFormDataChanged}
        >
          Save
        </Button>
      }
    >
      <div className="pb-10">
        <h2 className="text-zui-silver mb-6">Basic Info</h2>
        <Form formData={form} formFields={formFields} />

        {/* skus */}
        <SkuAccordion
          skus={skus || []}
          onAddClick={showSkuSidebar}
          onClick={handleSkuEdit}
          onDelete={handleSkuDelete}
          inventoryType={InventoryDetails?.type as "stay" | "utility"}
        />

        <h2 className="text-zui-silver mt-8 mb-3">Photos</h2>
        <Button
          className="w-full"
          type="default"
          size="large"
          onClick={showMediaGallerySidebar}
        >
          Manage Photos
        </Button>

        <h2 className="text-zui-silver mt-8 mb-3">Policy</h2>
        <Button
          className="w-full"
          type="default"
          size="large"
          onClick={showPolicySidebar}
        >
          Manage Policy
        </Button>
        <h2 className="text-zui-silver mt-8 mb-3">Amenities</h2>
        <Button
          className="w-full"
          type="default"
          size="large"
          onClick={showAmenitiesSidebar}
        >
          Manage Amenities
        </Button>
      </div>

      <ImageUploaderSidebar
        isOpen={isImagePickerVisible}
        onClose={hideImagePicker}
        onSave={uploadImageHandler}
      />
      <SkuSidebar
        currency={currency}
        estateId={estateId}
        inventoryCategory={InventoryDetails?.category || ""}
        isOpen={isSkuSidebarVisible}
        onClose={handleSkuSidebarClose}
        onSave={handleSkuSave}
        onUpdate={handleSkuUpdate}
        sku={selectedSku}
      />
      <PolicySidebar
        isOpen={isPolicySidebarVisible}
        onClose={hidePolicySidebar}
        policies={policies}
        setPolicies={setPolicies}
        onSave={handleSavePolicy}
      />
      <InventoryAmenitiesSidebar
        isOpen={isAmenitiesSidebarVisible}
        onClose={hideAmenitiesSidebar}
        inventoryId={inventoryId}
        inventoryTitle={InventoryDetails?.name || ""}
      />
      <MediaGallerySidebar
        isOpen={isMediaGallerySidebarVisible}
        onClose={hideMediaGallerySidebar}
        relationTypeId={inventoryId}
        relationType="inventory"
        queryApi="CAS_INVENTORY"
      />
    </Drawer>
  );
};

export default RoomInfo;
