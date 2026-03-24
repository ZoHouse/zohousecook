import { GeneralObject } from "@zo/definitions/general";
import { combineRouteAndQueryParams } from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { OfferSidebar } from "apps/admin/src/components/sidebars";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { StatusCell } from "../../../components/ui";

const Offers = () => {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/offers", label: "Offers" },
  ];

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [offerId, mode] = slug;

      return {
        offerId: offerId !== "new" ? offerId : null,
        isCreatingNewOffer: offerId === "new",
        mode,
      };
    }
    return {
      offerId: null,
      isCreatingNewOffer: false,
      mode: null,
    };
  }, [router.query]);

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (v) => <StatusCell status={String(v)} />,
    },
    {
      key: "discount_type",
      title: "Discount Type",
      dataIndex: "discount_type",
    },
    {
      key: "discount_value",
      title: "Discount Value",
      dataIndex: "discount_value",
    },
    {
      key: "max_discount_value",
      title: "Max Discount Value",
      dataIndex: "max_discount_value",
      render(cell, row, index) {
        return cell
          ? cell *
              Math.pow(
                10,
                row?.currency.decimals ? row.currency.decimals * -1 : 0
              )
          : "-";
      },
    },
    {
      key: "currency",
      title: "Currency",
      dataIndex: "currency",
      render(cell, row, index) {
        return cell ? cell.name : "-";
      },
    },
  ];

  const handleShowAddOffer = () => {
    router.push(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  const resetParams = () => {
    router.push(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    if (data.id) {
      router.push(
        combineRouteAndQueryParams(`${data.id}/edit`, router.query),
        undefined,
        { shallow: true }
      );
    }
  };

  return (
    <>
      <Zud
        title="Offers"
        breadCrumbs={breadcrumbs}
        queryEndpoint="CAS_OFFERS"
        mutationEndpoint="CAS_OFFERS"
        columns={columns}
        name="offers"
        onAddClick={handleShowAddOffer}
        onRowClick={handleRowClick}
      />
      <OfferSidebar
        isOpen={
          (params.offerId && params.mode === "edit") ||
          params.isCreatingNewOffer
        }
        onClose={resetParams}
        offerId={params.offerId}
      />
    </>
  );
};

export default Offers;
