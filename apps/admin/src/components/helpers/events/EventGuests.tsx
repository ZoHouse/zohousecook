import { Tabs, Typography } from "antd";
import { useVisibilityState } from "@zo/utils/hooks";
import { EventGuest, Inventory } from "apps/admin/src/config";
import React, { useMemo, useState } from "react";
import { GuestInfoSidebar } from "../../sidebars";
import GuestListBySku from "./GuestListBySku";
import { formatCapitalize } from "@zo/utils/string";
import { Empty } from "antd";

interface EventGuestsProps {
  event: Inventory;
}

const EventGuests: React.FC<EventGuestsProps> = ({ event }) => {
  const [isGuestInfoVisible, showGuestInfo, hideGuestInfo] =
    useVisibilityState();
  const [activeGuest, setActiveGuest] = useState<EventGuest | null>(null);

  const handleGuestClick = (data: any) => {
    setActiveGuest(data as EventGuest);
    showGuestInfo();
  };

  const tabItems = useMemo(
    () =>
      event.skus?.map((sku) => ({
        key: sku.id,
        label: formatCapitalize(sku.name),
        children: (
          <GuestListBySku onRowClick={handleGuestClick} skuPid={sku.id} />
        ),
      })),
    [event]
  );

  return (
    <>
      {tabItems && tabItems.length > 0 ? (
        <Tabs items={tabItems} animated={true} />
      ) : (
        <Empty
          description={
            <Typography.Text type="secondary">No Data Found</Typography.Text>
          }
          className="mt-8"
        />
      )}

      {activeGuest && (
        <GuestInfoSidebar
          isOpen={isGuestInfoVisible}
          onClose={hideGuestInfo}
          activeGuest={activeGuest}
        />
      )}
    </>
  );
};

export default EventGuests;
