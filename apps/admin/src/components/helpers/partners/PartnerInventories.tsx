import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { PageContent, PageHeader } from "@zo/moal";
import { groupObjectsByKeySelector } from "@zo/utils/array";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize } from "@zo/utils/string";
import { Button, Card, Divider, Spin, Tag } from "antd";
import { Inventory, Operator } from "apps/admin/src/config";
import { useState } from "react";
import {
  PartnerAddInventory,
  PartnerInventoryDetailSidebar,
  PartnerInventoryInfoSidebar,
} from "../../sidebars";

interface InventoriesProps {
  data: Operator;
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/21b93ca1-1443-4d6c-b053-84b6fe2b1eac_20241121125632.svg";

const InventoryStats = ({ inventory }: { inventory: Inventory }) => {
  const stats = [
    { label: "Occupancy", value: inventory.occupancy, icon: "👥" },
    { label: "Units", value: inventory.units, icon: "🏠" },
    {
      label: "Rate Plans",
      value: inventory.rate_plans?.length ?? 0,
      icon: "📋",
    },
    { label: "Currency", value: inventory.currency?.code, icon: "💰" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ label, value, icon }) => (
        <div key={label}>
          <p className="text-[10px] uppercase tracking-wider text-zui-silver/70 font-semibold mb-1">
            {label}
          </p>
          <p className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="text-zui-neon text-xs">{icon}</span>
            {value ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
};

const InventoryTaxes = ({ taxes }: { taxes: string[] }) => {
  if (!taxes?.length) return null;

  const displayTaxes = taxes.slice(0, 3);
  const remainingCount = taxes.length - 3;

  return (
    <div>
      <h4 className="text-xxs uppercase text-zui-white font-semibold mb-1 tracking-wide">
        Taxes
      </h4>
      <div className="flex flex-wrap gap-2">
        {displayTaxes.map((tax) => (
          <span
            key={tax}
            className="text-xxs text-zui-silver border border-zui-silver px-2 py-1"
          >
            {tax.replace("_", " ").toUpperCase()}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-xxs text-zui-silver border border-zui-silver px-2 py-1">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
};

const InventoryCard = ({
  inventory,
  onSelect,
  onViewDetails,
}: {
  inventory: Inventory;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
}) => {
  const imageUrl = inventory.media?.[0]?.url
    ? `${inventory.media[0].url}?w=800`
    : DEFAULT_IMAGE;

  return (
    <Card
      key={inventory.id}
      hoverable
      onClick={() => onSelect(inventory.id)}
      className="group bg-zui-dark relative overflow-hidden cursor-pointer"
      actions={[
        <Button key="edit" type="link" onClick={() => onSelect(inventory.id)}>
          Edit
        </Button>,
        <Button
          key="details"
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(inventory.id);
          }}
        >
          View Details
        </Button>,
      ]}
      cover={
        <div className="relative overflow-hidden h-48">
          <img
            src={imageUrl}
            alt={inventory.name}
            className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
          />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <span className="text-xxs uppercase bg-zui-light rounded-full px-3 py-1 text-zui-white">
              {inventory.category}
            </span>
            <Tag
              className={`uppercase border-0 ${
                inventory.status === "active"
                  ? "bg-zui-neon text-zui-dark"
                  : "bg-zui-red text-zui-dark"
              }`}
            >
              {inventory.status}
            </Tag>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-base tracking-wide">{inventory.name}</p>
        <InventoryStats inventory={inventory} />
        <Divider className="border-zui-silver my-4" />
        <InventoryTaxes taxes={inventory.applicable_taxes || []} />
      </div>
    </Card>
  );
};

const PartnerInventories: React.FC<InventoriesProps> = ({ data }) => {
  const [selectedInventory, setSelectedInventory] = useState<string>("");

  const [isInventoryInfoVisible, showInventoryInfo, hideInventoryInfo] =
    useVisibilityState();
  const [isAddInventoryVisible, showAddInventory, hideAddInventory] =
    useVisibilityState();
  const [
    isInventoryDetailsVisible,
    showInventoryDetails,
    hideInventoryDetails,
  ] = useVisibilityState();

  const {
    data: inventories,
    refetch,
    isLoading,
  } = useQueryApi<GeneralObject>(
    "CAS_INVENTORY",
    {
      enabled: !!data,
      select: (res) =>
        groupObjectsByKeySelector(res.data.results, (obj) => obj.category) ||
        [],
    },
    "",
    `operator=${data?.id}&type=stay&limit=100`
  );

  const handleSelect = (id: string) => {
    setSelectedInventory(id);
    showInventoryInfo();
  };

  const handleAddClose = () => {
    hideAddInventory();
    refetch();
  };

  const handleInfoClose = () => {
    hideInventoryInfo();
    setSelectedInventory("");
  };

  const handleViewDetails = (id: string) => {
    setSelectedInventory(id);
    showInventoryDetails();
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: " Add Inventory",
            onClick: showAddInventory,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Spin spinning size="large" />
          </div>
        ) : (
          Object.keys(inventories || {}).map((type) => (
            <div key={type} className="mb-14">
              <h2 className="text-zui-silver uppercase tracking-wide font-semibold mb-6 text-lg">
                {formatCapitalize(type)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
                {inventories?.[type]?.map((inventory: Inventory) => (
                  <InventoryCard
                    key={inventory.id}
                    inventory={inventory}
                    onSelect={handleSelect}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </PageContent>

      {isValidObject(data) && (
        <PartnerAddInventory
          isOpen={isAddInventoryVisible}
          onClose={handleAddClose}
          refetch={refetch}
          operatorId={data.id}
        />
      )}

      {isValidObject(data) && inventories && (
        <PartnerInventoryInfoSidebar
          operatorId={data.id}
          inventoryId={selectedInventory}
          isOpen={isInventoryInfoVisible}
          onClose={handleInfoClose}
          refetch={refetch}
        />
      )}
      {isValidObject(data) && inventories && (
        <PartnerInventoryDetailSidebar
          operatorId={data.id}
          inventoryId={selectedInventory}
          isOpen={isInventoryDetailsVisible}
          onClose={hideInventoryDetails}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default PartnerInventories;
