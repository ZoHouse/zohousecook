import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Tag, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import {
  AddPoaHoldersSidebar,
  PoaHoldersBulkUpload,
  PoaSidebar,
} from "../../../components/sidebars";
import { POA } from "../../../config";

interface PoaHoldersProps {}

const PoaHolders: React.FC<PoaHoldersProps> = () => {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug && Array.isArray(router.query.slug)) {
      const [poa, uploadType] = router.query.slug;
      return {
        poa,
        uploadType,
      };
    }
    return {
      poa: null,
      uploadType: null,
    };
  }, [router.query]);

  const [data, setData] = useState<GeneralObject[]>([]);

  const route = useMemo(() => {
    if (isValidString(router.query.slug?.[0])) {
      return `${router.query.slug?.[0]}/holders/`;
    } else {
      return "";
    }
  }, [router.query.slug]);

  const { isLoading } = useInfiniteTable({
    name: "poa-holders",
    queryEndpoint: "CAS_POAS",
    additionalRoute: route,
    setter: setData,
    enabled: isValidString(route),
  });

  const { data: poaDetails } = useQueryApi<POA>(
    "CAS_POAS",
    {
      enabled: isValidString(router.query.slug?.[0]),
      refetchOnWindowFocus: false,
      select(data) {
        return data.data;
      },
    },
    `${router.query.slug?.[0]}/`
  );

  const columns: ZudColumnType[] = [
    {
      key: "wallet_address",
      title: "Wallet",
      dataIndex: "wallet_address",
      render: (cell) => <span>{formatAddress(String(cell))}</span>,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell) => (
        <Tag
          bordered={false}
          color={
            String(cell).toLowerCase() === "active" ? "success" : "warning"
          }
        >
          {formatCapitalize(String(cell))}
        </Tag>
      ),
    },

    {
      key: "transaction_hash",
      title: "Transaction Hash",
      dataIndex: "transaction_hash",
      render: (cell) => (
        <a
          href={`https://etherscan.io/tx/${cell}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline hover:text-zui-neon"
          onClick={(e) => e.stopPropagation()}
        >
          {formatAddress(String(cell))}
        </a>
      ),
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLL")}>
          <span>{moment(cell).format("DD/MM/YYYY")}</span>
        </Tooltip>
      ),
    },
  ];

  const handleAddClick = (type: "bulkupload" | "new" | "edit") => {
    router.push(
      combineRouteAndQueryParams(`${router.asPath}/${type}`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleCloseSidebar = () => {
    router.push(
      combineRouteAndQueryParams(`/poa/holders/${param.poa}`, router.query),
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      <Page
        breadCrumbs={[
          { href: "/poa", label: "PoA" },
          {
            href: `${router.asPath}`,
            label: poaDetails?.title || "Holders",
          },
        ]}
      >
        <PageHeader
          title="PoA Holders"
          buttons={[
            {
              icon: <EditOutlinedIcon />,
              label: "Edit Poa",
              onClick: handleAddClick.bind(null, "edit"),
              type: "secondary",
            },
            {
              icon: <FileUploadOutlinedIcon />,
              label: "Bulk Upload",
              onClick: handleAddClick.bind(null, "bulkupload"),
              type: "secondary",
            },
            {
              icon: <AddOutlinedIcon />,
              label: "New Holder",
              onClick: handleAddClick.bind(null, "new"),
              type: "secondary",
            },
          ]}
        />

        <div className="py-10">
          <ZudTable isLoading={isLoading} data={data} columns={columns} />
        </div>
      </Page>

      <AddPoaHoldersSidebar
        isOpen={param.uploadType === "new"}
        onClose={handleCloseSidebar}
        poaId={param.poa}
      />
      <PoaHoldersBulkUpload
        isOpen={param.uploadType === "bulkupload"}
        onClose={handleCloseSidebar}
        poaId={param.poa}
      />
      {param.poa && (
        <PoaSidebar
          poaId={param.poa}
          isOpen={param.uploadType === "edit"}
          onClose={handleCloseSidebar}
        />
      )}
    </>
  );
};

export default PoaHolders;
