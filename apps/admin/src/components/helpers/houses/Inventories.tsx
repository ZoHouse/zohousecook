import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { groupObjectsByKeySelector } from "@zo/utils/array";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Alert, Button, Card, Skeleton } from "antd";
import Meta from "antd/es/card/Meta";
import { Inventory, ZoHouse } from "apps/admin/src/config";
import { useState } from "react";
import { AddInventory, InventoryInfo } from "../../sidebars";
import AddIcon from '@mui/icons-material/Add';

interface InventoriesProps {
  data: ZoHouse;
  type: "stay" | "utility";
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/21b93ca1-1443-4d6c-b053-84b6fe2b1eac_20241121125632.svg";

const Inventories: React.FC<InventoriesProps> = ({ data, type }) => {
  const [isRoomInfoVisible, showRoomInfo, hideRoomInfo] = useVisibilityState();
  const [isAddRoomVisible, showAddRoom, hideAddRoom] = useVisibilityState();

  const [selectedInventory, setSelectedInventory] = useState<string>("");

  const {
    data: inventories,
    refetch: refetchAllInventoryData,
    isLoading: loadingInventories,
  } = useQueryApi<GeneralObject>(
    "CAS_INVENTORY",
    {
      enabled: data !== null,
      select: (data) =>
        groupObjectsByKeySelector(data.data.results, (obj) => obj.category) ||
        [],
    },
    "",
    `operator=${data?.id}&type=${type}`
  );

  const { data: spaceCount, isLoading: loadingSpacesCount } =
    useQueryApi<number>(
      "CAS_SPACES",
      {
        enabled: isValidString(data?.estate?.id),
        select: (data) => data.data.length,
      },
      "",
      `floor__estate=${data?.estate?.id}&limit=-1`
    );

  const handleRoomSelect = (inventoryId: string) => {
    setSelectedInventory(inventoryId);
    showRoomInfo();
  };

  const handleAddRoomClose = () => {
    hideAddRoom();
    refetchAllInventoryData();
  };

  const handleRoomInfoClose = () => {
    hideRoomInfo();
    setSelectedInventory("");
  };

  if (loadingInventories || loadingSpacesCount) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pt-6 pb-1">
          <Skeleton.Input
            style={{ width: 200 }}
            active
            size="large"
            className="mb-4"
          />
          <Skeleton.Button active className="mb-6" />
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-grow h-full overflow-y-auto pb-10 p-2">
        {loadingInventories || loadingSpacesCount ? (
          <Skeleton active />
        ) : (
          <div className="self-start my-6">
            {spaceCount === 0 ? (
              <Alert
                message={
                  <span>
                    <strong>Space Required</strong> <br />
                    You Need to Create Space before you can create Inventory.
                    Goto Estate Tab.
                  </span>
                }
                type="error"
                className="mt-4"
                showIcon
              />
            ) : (
              <>
                <Button
                  disabled={spaceCount === 0}
                  onClick={showAddRoom}
                  icon={<AddIcon style={{ fontSize: 16 }} />}
                  type="default"
                >
                  Add Inventory
                </Button>
                <Alert
                  message={
                    <span className="text-sm">
                      Inventory will not be visible in the app without an SKU.
                      If an inventory is missing, please ensure it has at least
                      one SKU assigned.
                    </span>
                  }
                  type="info"
                  className="mt-4"
                  showIcon
                />
              </>
            )}
          </div>
        )}

        {loadingInventories || loadingSpacesCount ? (
          <Skeleton active />
        ) : (
          Object.keys(inventories || {}).map((inventoryType: string) => (
            <div className="mt-6" key={inventoryType}>
              <h2 className="text-zui-silver uppercase font-semibold mb-4">
                {formatCapitalize(inventoryType)}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {inventories &&
                  inventories[inventoryType]?.map((inventory: Inventory) => {
                    const imageUrl =
                      inventory.media?.length > 0
                        ? `${inventory.media[0]?.url}?w=200`
                        : DEFAULT_IMAGE;

                    return (
                      <Card
                        key={inventory.id}
                        hoverable
                        onClick={handleRoomSelect.bind(null, inventory.id)}
                        className="w-full bg-zui-light aspect-square"
                        cover={
                          <div className="bg-zui-lighter border-t hover:border-none border-zui-stroke border-x h-36">
                            <img
                              alt="house Image"
                              src={imageUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        }
                      >
                        <Meta
                          title={inventory.name || "Room"}
                          description={
                            <p className="flex items-center gap-3">
                              {inventory.category}
                              <span
                                className={
                                  inventory.status === "active"
                                    ? "text-zui-green"
                                    : "text-zui-red"
                                }
                              >
                                {inventory.status}
                              </span>
                            </p>
                          }
                        />
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>

      {isValidObject(data) && (
        <AddInventory
          type={type}
          isOpen={isAddRoomVisible}
          onClose={handleAddRoomClose}
          estateId={data?.estate?.id}
          currency={data.currency}
          operatorId={data.id}
        />
      )}

      {isValidObject(data) && inventories && isValidObject(inventories) && (
        <InventoryInfo
          currency={data.currency}
          operatorId={data.id}
          estateId={data.estate?.id}
          inventoryId={selectedInventory}
          isOpen={isRoomInfoVisible}
          onClose={handleRoomInfoClose}
          refetch={refetchAllInventoryData}
        />
      )}
    </>
  );
};

export default Inventories;
