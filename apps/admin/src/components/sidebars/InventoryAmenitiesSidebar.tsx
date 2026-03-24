import { PlusOutlined } from "@ant-design/icons";
import Icon from "@zo/assets/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidString } from "@zo/utils/string";
import { App, Button, Drawer } from "antd";
import React, { MouseEventHandler, useState } from "react";
import { FeaturesSidebar } from ".";
import { CASFeaturesResponse } from "../../config";

interface InventoryAmenitiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  inventoryTitle: string;
}

const InventoryAmenitiesSidebar: React.FC<InventoryAmenitiesSidebarProps> = ({
  inventoryId,
  isOpen,
  onClose,
  inventoryTitle,
}) => {
  const { message } = App.useApp();

  const [isFeaturesSidebarVisible, showFeaturesSidebar, hideFeaturesSidebar] =
    useVisibilityState();

  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const { data: allFeatures, refetch } = useQueryApi<CASFeaturesResponse[]>(
    "CAS_INVENTORY",
    {
      refetchOnWindowFocus: false,
      enabled: isValidString(inventoryId),
      select: (data) => data.data.results,
    },
    `${inventoryId}/features/`
  );

  const { mutate: createFeature } = useMutationApi("CAS_INVENTORY");
  const { mutate: updateFeature } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "PUT"
  );
  const { mutate: deleteFeature } = useMutationApi(
    "CAS_INVENTORY",
    {},
    "",
    "DELETE"
  );

  const saveFeatureHandler = (data: GeneralObject) => {
    createFeature(
      {
        data: data,
        route: `${inventoryId}/features/`,
      },
      {
        onSuccess: () => {
          message.success("Amenity Added");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleDeleteFeature: MouseEventHandler<HTMLButtonElement> = (e) => {
    const id = e.currentTarget.dataset.id;
    e.stopPropagation();
    deleteFeature(
      {
        data: {},
        route: `${inventoryId}/features/${id}/`,
      },
      {
        onSuccess: () => {
          message.success("Amenity Deleted");
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleFeatureClick = (id: string) => {
    setSelectedFeature(id);
    showFeaturesSidebar();
  };

  const handleUpdateFeature = (id: string, data: GeneralObject) => {
    updateFeature(
      {
        data: data,
        route: `${inventoryId}/features/${id}/`,
      },
      {
        onSuccess: () => {
          message.success("Perk Updated");
          refetch();
          hideFeaturesSidebar();
          setSelectedFeature(null);
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Drawer
      title={`${inventoryTitle} Amenities`}
      placement="right"
      closable
      onClose={onClose}
      open={isOpen}
    >
      <div className="border-t border-zui-light">
        <h2 className="font-semibold text-zui-silver uppercase mt-6 mb-3">
          Amenities
        </h2>
        <Button
          icon={<PlusOutlined />}
          onClick={showFeaturesSidebar}
          type="default"
        >
          Add Amenity
        </Button>
        {allFeatures && (
          <div className="flex-grow my-6 ">
            <div className="flex flex-wrap gap-4">
              {allFeatures?.map((perk, index) => (
                <div
                  className="flex flex-row items-center justify-center border border-zui-stroke p-4 relative w-36 h-36 group shadow-1-down hover:bg-zui-light/90 cursor-pointer"
                  key={index}
                  onClick={handleFeatureClick.bind(null, perk.id)}
                >
                  <div className="flex flex-col gap-4 items-center text-center">
                    <span className="text-2xl">{perk.icon}</span>
                    <h4 className="font-medium w-32">
                      {perk.name.substring(0, 30)}
                    </h4>
                  </div>

                  <button
                    data-id={perk.id}
                    onClick={handleDeleteFeature}
                    className="absolute top-2 right-2 flex-shrink-0 group-hover:visible invisible bg-zui-light p-2 "
                  >
                    <Icon name="Delete" size={20} fill="#fff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FeaturesSidebar
        isOpen={isFeaturesSidebarVisible}
        onClose={hideFeaturesSidebar}
        onSave={saveFeatureHandler}
        onUpdate={handleUpdateFeature}
        selectedFeature={selectedFeature}
        containerId={inventoryId}
        endpoint="CAS_INVENTORY"
      />
    </Drawer>
  );
};

export default InventoryAmenitiesSidebar;
