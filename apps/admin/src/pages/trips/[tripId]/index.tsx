import { EyeOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { Page, PageContent, PageHeader } from "@zo/moal";
import { isValidString, slugify } from "@zo/utils/string";
import { Tabs } from "antd";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import {
  TripAddOn,
  TripBatches,
  TripCancellationPolicy,
  TripCoupon,
  TripInfo,
  TripItineraries,
} from "../../../components/helpers/trips";

const TripInfoPage: React.FC = () => {
  const router = useRouter();
  const { tripId } = router.query;
  const [activeTab, setActiveTab] = useState("trip_info");

  const { data, refetch: refetchTrip } = useQueryApi<any>(
    "CAS_INVENTORY",
    {
      enabled: isValidString(tripId as string),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${tripId}/`,
    ""
  );

  const tabItems = useMemo(
    () => [
      {
        key: "trip_info",
        label: "Trip Info",
        children: <TripInfo data={data} refetch={refetchTrip} />,
      },
      {
        key: "Itineraries",
        label: "Itinerary Tabs",
        children: <TripItineraries data={data} />,
      },
      {
        key: "batches",
        label: "Batches",
        children: <TripBatches data={data} />,
      },
      {
        key: "cancellation-policy",
        label: "Cancellation Policy",
        children: <TripCancellationPolicy data={data} refetch={refetchTrip} />,
      },
      {
        key: "add-ons",
        label: "Add-Ons",
        children: <TripAddOn data={data} />,
      },

      {
        key: "coupons",
        label: "Coupons",
        children: <TripCoupon data={data} />,
      },
    ],
    [data, refetchTrip]
  );

  const handlePreviewClick = () => {
    if (data) {
      window.open(
        `${process.env.ZOSTEL_BASE_WEB_URL}/zo-trip/${slugify(data?.name)}-${
          data.pid
        }`,
        "_blank"
      );
    }
  };

  const breadcrumbs = [
    { href: "/trips", label: "Trips" },
    {
      href: `/trips/${data?.id}`,
      label: data?.name,
    },
  ];

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader
        title={data?.name}
        buttons={[
          {
            icon: <EyeOutlined />,
            label: "Preview Trip",
            onClick: handlePreviewClick,
            type: "secondary",
          },
        ]}
      />

      <PageContent>
        <div className="flex flex-col ">
          <Tabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </PageContent>
    </Page>
  );
};

export default TripInfoPage;
