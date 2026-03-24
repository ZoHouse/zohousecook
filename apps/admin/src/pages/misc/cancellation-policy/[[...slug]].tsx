import {
  combineRouteAndQueryParams,
  isValidString,
  isValidUUID,
} from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { Tag } from "antd";
import { AddCancellationPolicySidebar } from "apps/admin/src/components/sidebars";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { Inventory, ZoHouse } from "../../../config";

const CancellationPolicy: NextPage = () => {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/cancellation-policy", label: "Cancellation Policy" },
  ];

  const params = useMemo(() => {
    const isNewEvent = router.query.slug == "new";
    return {
      policyId: router.query.slug?.[0] as string,
      isNewEvent: isNewEvent,
    };
  }, [router]);

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "inventory",
        title: "Inventory",
        dataIndex: "inventory",
        render: (cell: Inventory) => {
          return cell?.name;
        },
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        render: (cell: string) => {
          return (
            <Tag
              bordered={false}
              color={cell === "active" ? "success" : "error"}
            >
              {cell}
            </Tag>
          );
        },
      },

      {
        key: "operator",
        title: "Operator",
        dataIndex: "operator",
        render: (cell: ZoHouse) => {
          return cell?.name;
        },
      },
      {
        key: "cancellation_charge",
        title: "Cancellation Charge",
        dataIndex: "cancellation_charge",
      },
    ],
    []
  );

  const handleAddClick = () => {
    router.push(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  const handleRowClick = (data: any) => {
    router.push(
      combineRouteAndQueryParams(`${data.id}/edit`, router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  const resetParam = () => {
    router.push(
      combineRouteAndQueryParams("/misc/cancellation-policy", router.query),
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <Zud
        title="Cancellation Policy"
        breadCrumbs={breadcrumbs}
        columns={columns}
        name="cancellation_policy"
        onAddClick={handleAddClick}
        onRowClick={handleRowClick}
        mutationEndpoint="CAS_CANCELLATION_POLICY"
        queryEndpoint="CAS_CANCELLATION_POLICY"
      />
      <AddCancellationPolicySidebar
        cancellationPolicyId={
          isValidUUID(params.policyId) ? params.policyId : null
        }
        isOpen={isValidString(params.policyId)}
        onClose={resetParam}
      />
    </>
  );
};

export default CancellationPolicy;
