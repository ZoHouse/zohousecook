import { Tabs } from "antd";
import { ZoHouse } from "apps/admin/src/config";
import Inventories from "./Inventories";

interface InventoryWrapperProps {
  data: ZoHouse;
}

const InventoryWrapper: React.FC<InventoryWrapperProps> = ({ data }) => {
  const items = [
    {
      key: "stay-inventories",
      label: "Stay",
      children: <Inventories data={data} type="stay" />,
    },
    {
      key: "utility-inventories",
      label: "Utility",
      children: <Inventories data={data} type="utility" />,
    },
  ];

  return (
    <Tabs
      className="mt-6"
      items={items}
      defaultActiveKey="stay-inventories"
      animated
    />
  );
};

export default InventoryWrapper;
