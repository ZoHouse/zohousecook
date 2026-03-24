import { GeneralObject } from "@zo/definitions/general";
import { combineRouteAndQueryParams, formatCapitalize } from "@zo/utils/string";
import { Zud, ZudColumnType, ZudFilterOptionType } from "@zo/zud";
import { Tag, Tooltip } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { PoaSidebar } from "../../components/sidebars";

const Index: NextPage = () => {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug) {
      const [podId, mode] = router.query.slug;
      const isCreatingNewPoa = podId === "new";

      return {
        poaId: isCreatingNewPoa ? null : podId,
        mode,
        isCreatingNewPoa,
      };
    }
    return {
      poaId: null,
      mode: null,
      isCreatingNewPoa: false,
    };
  }, [router.query]);

  const columns: ZudColumnType[] = [
    {
      key: "title",
      title: "Title",
      dataIndex: "title",
      render: (cell) => <span>{cell}</span>,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell) => {
        return (
          <Tag
            bordered={false}
            color={
              String(cell).toLowerCase() === "active" ? "success" : "warning"
            }
          >
            {formatCapitalize(String(cell))}
          </Tag>
        );
      },
    },
    {
      key: "category",
      title: "Category",
      dataIndex: "category",
      render: (cell) =>
        String(cell) === "irl"
          ? String(cell).toUpperCase()
          : formatCapitalize(String(cell)),
    },
    {
      key: "url",
      title: "URL",
      dataIndex: "url",
      render: (cell) =>
        cell ? (
          <a
            href={cell}
            target="_blank"
            rel="noreferrer"
            className="hover:underline hover:text-zui-neon"
            onClick={(e) => e.stopPropagation()}
          >
            {cell}
          </a>
        ) : (
          <span>-</span>
        ),
    },
    {
      key: "contract",
      title: "Contract",
      dataIndex: "contract",
      render: (cell) => <span>{cell?.name || "-"}</span>,
    },
    {
      key: "started_at",
      title: "Event Start",
      dataIndex: "started_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLL")}>
          <span>{moment(cell).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
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
          value: "null",
        },
        {
          label: "Active",
          value: "active",
        },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      type: "select",
      key: "category",
      placeholder: "Category",
      className: "w-fit md:w-48",
      options: [
        { label: "All Category", value: "null" },
        { label: "Online", value: "online" },
        { label: "IRL", value: "irl" },
      ],
    },
  ];

  const handleRowClick = (data: GeneralObject) => {
    if (data.id) {
      router.push(
        combineRouteAndQueryParams(`/poa/holders/${data.id}`, router.query),
        undefined,
        { shallow: true }
      );
    }
  };

  const handleAddClick = () => {
    router.push(combineRouteAndQueryParams(`new`, router.query), undefined, {
      shallow: true,
    });
  };

  const handleClose = () => {
    router.push(combineRouteAndQueryParams("/poa", router.query), undefined, {
      shallow: true,
    });
  };

  return (
    <>
      <Zud
        name="poas"
        title="PoA"
        queryEndpoint="CAS_POAS"
        mutationEndpoint="CAS_POAS"
        columns={columns}
        filterOptions={filterOptions}
        onAddClick={handleAddClick}
        onRowClick={handleRowClick}
        breadCrumbs={[{ href: "/poa", label: "PoA" }]}
        customSearchQuery="ordering=-created_at"
      />
      <PoaSidebar
        poaId={null}
        isOpen={param.isCreatingNewPoa}
        onClose={handleClose}
      />
    </>
  );
};

export default Index;
