import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidUUID,
} from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { Tag } from "antd";
import { AddDiscoverCardSidebar } from "apps/admin/src/components/sidebars";
import { useRouter } from "next/router";
import { useMemo } from "react";

const DiscoverCard = () => {
  const router = useRouter();

  const params = useMemo(() => {
    const slugArray = Array.isArray(router.query.slug) ? router.query.slug : [];
    const isNewCard = slugArray[0] === "new";
    const [cardId, mode] = slugArray;
    return {
      cardId: isNewCard ? null : cardId,
      isCreatingNewCard: isNewCard,
      mode: mode,
    };
  }, [router.query]);

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "title",
        title: "Title",
        dataIndex: "title",
        width: "350px",
      },
      {
        key: "type",
        title: "Type",
        dataIndex: "type",
        render: (type: string) => formatCapitalize(type),
      },
      {
        key: "status",
        title: "Status",
        dataIndex: "status",
        render: (status: string) => (
          <Tag
            color={status === "active" ? "green" : "warning"}
            bordered={false}
          >
            {status.toUpperCase()}
          </Tag>
        ),
      },
      {
        key: "category",
        title: "Category",
        dataIndex: "category",
      },
    ],
    []
  );

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/discover-card", label: "Discover Card" },
  ];

  const resetParams = () => {
    router.push(
      combineRouteAndQueryParams("/misc/discover-card", router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleAddClick = () => {
    router.push(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  const handleRowClick = (row: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(`${row.id}/edit`, router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <>
      <Zud
        breadCrumbs={breadcrumbs}
        name="Discover Card"
        title="Discover Card"
        columns={columns}
        mutationEndpoint="CAS_DISCOVER_CARD"
        queryEndpoint="CAS_DISCOVER_CARD"
        onAddClick={handleAddClick}
        onRowClick={handleRowClick}
      />
      <AddDiscoverCardSidebar
        isOpen={
          (isValidUUID(params.cardId) && params.mode === "edit") ||
          params.isCreatingNewCard
        }
        onClose={resetParams}
        cardId={params.cardId}
      />
    </>
  );
};

export default DiscoverCard;
