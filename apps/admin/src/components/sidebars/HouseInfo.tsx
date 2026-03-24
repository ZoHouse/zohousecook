import { useQueryApi } from "@zo/auth";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer } from "antd";
import Tabs, { TabsProps } from "antd/es/tabs";
import React, { useMemo, useRef } from "react";
import { Estate, ZoHouse } from "../../config";
import {
  EstateInfo,
  HouseBasicInfo,
  HouseCancellationPolicy,
  HouseImages,
  HousePolicy,
  InventoryWrapper,
} from "../helpers/houses";

import HousePerks from "../helpers/houses/HousePerks";

interface HouseInfoProps {
  isOpen: boolean;
  onClose: () => void;
  opeartorId: string | null;
}

const HouseInfo: React.FC<HouseInfoProps> = ({
  isOpen,
  onClose,
  opeartorId,
}) => {
  const saveButtonRef = useRef<() => void>(() => {});

  const {
    data,
    refetch: refetchOperator,
    isLoading: isLoadingOperator,
  } = useQueryApi<ZoHouse>(
    "CAS_OPERATORS",
    {
      enabled: isValidString(opeartorId) && isOpen,
      select: (data) => data.data,
    },
    `${opeartorId}/`
  );

  const {
    data: estateData,
    refetch: refetchEstate,
    isLoading: isLoadingEstate,
  } = useQueryApi<Estate>(
    "CAS_ESTATES",
    {
      enabled: isValidString(data?.estate?.id),
      select: (data) => data.data,
    },
    `${data?.estate?.id}/`
  );

  const refetch = () => {
    refetchOperator();
    refetchEstate();
  };

  const items: TabsProps["items"] = useMemo(
    () =>
      data
        ? [
            {
              key: "basic-info",
              label: "Basic Info",
              className: "flex flex-col overflow-y-auto",
              children: (
                <HouseBasicInfo
                  estateData={estateData}
                  data={data}
                  refetch={refetch}
                  saveButtonRef={saveButtonRef}
                />
              ),
            },
            {
              key: "photos",
              label: "Photos",
              children: <HouseImages data={data} refetch={refetch} />,
            },
            {
              key: "inventories",
              label: "Inventories",
              children: <InventoryWrapper data={data} />,
            },
            {
              key: "estate",
              label: "Estate",
              children: <EstateInfo estateId={data?.estate?.id} />,
            },
            {
              key: "amenities",
              label: "Amenities",
              children: <HousePerks operatorId={data?.id} />,
            },
            {
              key: "policy",
              label: "Policy",
              children: <HousePolicy operatorId={data.id} refetch={refetch} />,
            },
            {
              key: "cancellation-policy",
              label: "Cancellation Policy",
              children: (
                <HouseCancellationPolicy
                  operatorId={data.id}
                  refetch={refetch}
                />
              ),
            },
          ]
        : [],
    [data, estateData, refetch]
  );

  return (
    <Drawer
      title={`${data?.name}`}
      placement="right"
      size="large"
      onClose={onClose}
      open={isOpen}
      loading={isLoadingOperator || isLoadingEstate}
      extra={
        <Button type="primary" onClick={() => saveButtonRef.current()}>
          Save
        </Button>
      }
    >
      <Tabs animated items={items} />
    </Drawer>
  );
};

export default HouseInfo;
