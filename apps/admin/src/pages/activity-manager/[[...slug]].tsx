import { GeneralObject } from "@zo/definitions/general";
import {
  addRouteToUrl,
  combineRouteAndQueryParams,
  isValidString,
} from "@zo/utils/string";
import { Zud, ZudColumnType, ZudFilterOptionType } from "@zo/zud";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ActivityApprovalSidebar } from "../../components/sidebars";

const ActivityManager: NextPage = () => {
  const columns: ZudColumnType[] = [
    {
      key: "operator",
      title: "Operator",
      dataIndex: "operator",
      render: (operator: GeneralObject) => operator.name,
    },
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
    },
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
    },
  ];

  const filterOptions: ZudFilterOptionType[] = [
    {
      type: "select",
      key: "status",
      placeholder: "Status",
      className: "w-fit md:w-48",
      options: [
        {
          label: "All Status",
          value: "null"
        },
        { 
          label: "active", 
          value: "active" 
        },
        { 
          label: "pending", 
          value: "pending" 
        },
      ],
    },
  ];

  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openSidebar = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.push(
        addRouteToUrl(router.pathname, `${id}/`, router.query),
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  const closeSidebar = useCallback(() => {
    setSelectedId(null);
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  }, [router]);

  useEffect(() => {
    const slug = router.query.slug?.[0];
    if (isValidString(slug)) {
      setSelectedId(String(slug));
    }
  }, [router.query]);

  return (
    <>
      <Zud
        name="activity-manager"
        title="Activity Manager"
        queryEndpoint="CAS_PM_INVENTORY"
        mutationEndpoint="CAS_PM_INVENTORY"
        columns={columns}
        filterOptions={filterOptions}
        breadCrumbs={[{ href: "/activity-manager", label: "Activity Manager" }]}
        allowEdit={false}
        customSearchQuery="type=activity&ordering=-updated_at"
        onRowClick={(row: GeneralObject) => openSidebar(row.id)}
      />
      <ActivityApprovalSidebar
        isOpen={isValidString(selectedId)}
        onClose={closeSidebar}
        id={selectedId}
      />
    </>
  );
};

export default ActivityManager;
