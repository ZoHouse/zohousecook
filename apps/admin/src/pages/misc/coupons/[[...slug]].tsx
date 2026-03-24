import { GeneralObject } from "@zo/definitions/general";
import { combineRouteAndQueryParams, isValidUUID } from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { Tag } from "antd";
import { CouponSidebar } from "apps/admin/src/components/sidebars";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { CopyToClipboardField } from "../../../components/ui";

const Coupons = () => {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/coupons", label: "Coupons" },
  ];

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [couponId, mode] = slug;

      return {
        couponId: couponId !== "new" ? couponId : null,
        isCreatingNewCoupon: couponId === "new",
        mode,
      };
    }
    return {
      couponId: null,
      isCreatingNewCoupon: false,
      mode: null,
    };
  }, [router.query]);

  const getStatusColor = (status: string) => {
    if (status === "active") return "success";
    if (status === "inactive") return "error";
    if (status === "unpublished") return "warning";
    return "default";
  };

  const formatCurrency = (value: number, decimals: number, symbol: string) => {
    return value
      ? `${symbol}${(value * Math.pow(10, decimals * -1)).toLocaleString()}`
      : "-";
  };

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
      render: (v) => (
        <Tag className="capitalize" bordered={false} color={getStatusColor(v)}>
          {String(v)}
        </Tag>
      ),
    },
    {
      key: "code",
      title: "Code",
      dataIndex: "code",
      render: (cell) => <CopyToClipboardField text={cell} />,
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
      render: (cell, row) =>
        formatCurrency(cell, row.currency.decimals, row.currency.symbol),
    },
    {
      key: "max_discount_value",
      title: "Max Discount Value",
      dataIndex: "max_discount_value",
      render: (cell, row) =>
        formatCurrency(cell, row.currency.decimals, row.currency.symbol),
    },
  ];

  const handleShowAddCoupon = () => {
    router.push(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  const resetURL = () => {
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(`${data.id}/edit`, router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <>
      <Zud
        title="Coupons"
        breadCrumbs={breadcrumbs}
        queryEndpoint="CAS_COUPONS"
        mutationEndpoint="CAS_COUPONS"
        columns={columns}
        name="coupons"
        onAddClick={handleShowAddCoupon}
        onRowClick={handleRowClick}
      />
      <CouponSidebar
        isOpen={
          (params.couponId && params.mode === "edit") ||
          params.isCreatingNewCoupon
        }
        onClose={resetURL}
        couponId={params.couponId}
      />
    </>
  );
};

export default Coupons;
