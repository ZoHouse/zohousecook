import { Visibility } from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import { Page, PageHeader } from "@zo/moal";
import { isValidString, slugify } from "@zo/utils/string";
import { Tabs } from "antd";
import {
  PartnerAmenities,
  PartnerBasicInfo,
  PartnerCancellationPolicy,
  PartnerCommissions,
  PartnerFaqs,
  PartnerInventories,
  PartnerPolicy,
} from "apps/admin/src/components/helpers/partners";
import { Currency, Operator } from "apps/admin/src/config";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";

const PartnerInfoPage: React.FC = () => {
  const router = useRouter();
  const { partnerId } = router.query;

  const [activeTab, setActiveTab] = useState("basic_info");

  const { data: partner, refetch } = useQueryApi<Operator>(
    "CAS_OPERATORS",
    {
      enabled: isValidString(partnerId),
      select: (data) => data.data,
    },
    `${partnerId}/`
  );

  const handlePreviewClick = () => {
    if (
      typeof window === "undefined" ||
      !partner?.pid ||
      !partner?.destination?.name
    )
      return;
    const baseUrl = process.env.ZOSTEL_BASE_WEB_URL;
    window.open(
      `${baseUrl}/destination/${slugify(
        partner.destination.name
      )}/xostel/${slugify(partner.name)}-${partner.pid}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const tabItems = useMemo(
    () => [
      {
        key: "basic_info",
        label: "Basic Info",
        children: (
          <PartnerBasicInfo
            data={partner || ({} as Operator)}
            refetch={refetch}
          />
        ),
      },
      {
        key: "inventories",
        label: "Inventories",
        children: <PartnerInventories data={partner || ({} as Operator)} />,
      },
      {
        key: "amenities",
        label: "Amenities",
        children: <PartnerAmenities operatorId={partner?.id || ""} />,
      },
      {
        key: "faqs",
        label: "Faqs",
        children: <PartnerFaqs operatorId={partner?.id} />,
      },
      {
        key: "policy",
        label: "Policy",
        children: <PartnerPolicy operatorId={partner?.id} />,
      },
      {
        key: "cancellation-policy",
        label: "Cancellation Policy",
        children: <PartnerCancellationPolicy operatorId={partner?.id} />,
      },
      {
        key: "commissions",
        label: "Commissions",
        children: (
          <PartnerCommissions
            operatorId={partner?.id}
            currency={partner?.currency || ({} as Currency)}
          />
        ),
      },
    ],
    [partner]
  );

  const breadcrumbs = [
    { href: "/partners", label: "Partners" },
    {
      href: `/partners/${partnerId}`,
      label: partner?.name || "",
    },
  ];

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader
        title={partner?.name || ""}
        buttons={[
          {
            icon: <Visibility />,
            label: "Preview",
            onClick: handlePreviewClick,
            type: "secondary",
          },
        ]}
      />
      <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
    </Page>
  );
};

export default PartnerInfoPage;
