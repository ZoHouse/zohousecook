import { GeneralObject } from "@zo/definitions/general";
import { Tabs } from "antd";
import React, { useMemo, useState } from "react";
import TripBasicInfo from "./TripBasicInfo";
import TripDestinations from "./TripDestinations";

interface TripInfoProps {
  data: GeneralObject;
  refetch: () => void;
}

const TripInfo: React.FC<TripInfoProps> = ({ data, refetch }) => {
  const [activeTab, setActiveTab] = useState("basic-info");

  const tabItems = useMemo(
    () => [
      {
        key: "basic-info",
        label: "Basic Info",
        children: <TripBasicInfo data={data} refetch={refetch} />,
      },
      {
        key: "destinations",
        label: "Destinations",
        children: (
          <TripDestinations
            destinations={data?.destinations || []}
            tripId={data?.id}
            refetch={refetch}
          />
        ),
      },
    ],
    [data]
  );

  return (
    <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
  );
};

export default TripInfo;
