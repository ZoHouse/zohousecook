import { PersonOutlined } from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidUUID,
} from "@zo/utils/string";
import { Zud, ZudColumnType, ZudFilterOptionType } from "@zo/zud";
import { Avatar, Flex } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { Leads as LeadSidebar } from "../../../components/sidebars";
import { ContactCell, StageIndicatorCell } from "../../../components/ui";

const Leads: NextPage = () => {
  const router = useRouter();

  const params = useMemo(() => {
    if (router.query.slug?.[0] && Array.isArray(router.query.slug)) {
      const [leadId] = router.query.slug;
      return {
        leadId: String(leadId),
      };
    } else {
      return { leadId: null };
    }
  }, [router.query.slug]);

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    select: (data) => data.data,
    refetchOnWindowFocus: false,
  });

  const stages = useMemo(() => {
    if (isValidObject(seed)) {
      return seed?.lead?.stage?.map((stage: string, index: number) => ({
        label: stage,
        value: index,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const statusOptions = useMemo(() => {
    if (isValidObject(seed)) {
      return seed?.lead?.status?.map((status: string) => ({
        label: formatCapitalize(status),
        value: status,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const categoryOptions = useMemo(() => {
    if (isValidObject(seed)) {
      return seed?.lead?.category?.map((category: string) => ({
        label: formatCapitalize(category),
        value: category,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      width: 240,
      render: (cell, row) => (
        <Flex align="center" gap={8}>
          <Avatar icon={<PersonOutlined fontSize="small" />} />
          {cell?.name || row?.email_address || row?.mobile_number}
        </Flex>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      dataIndex: "contact",
      render: (cell, row) => (
        <ContactCell
          phone_number={`+${row?.mobile_country_code}${row?.mobile_number}`}
          whatsApp_number={`+${row?.mobile_country_code}${row?.mobile_number}`}
          email={row?.email_address}
        />
      ),
    },
    {
      key: "destination",
      title: "Destination",
      dataIndex: "destination",
      width: 240,
      render: (cell, row) => (
        <span className="flex max-w-[200px] truncate">
          {row?.data.lead?.title || "-"}
        </span>
      ),
    },
    {
      key: "category",
      title: "Category",
      dataIndex: "category",
    },
    {
      key: "stage",
      title: "Stage",
      dataIndex: "stage",
      render: (cell) => (
        <StageIndicatorCell currentStage={String(cell)} stages={stages} />
      ),
    },
    {
      key: "updated_at",
      title: "Last Activity",
      dataIndex: "updated_at",
      render: (cell) => (
        <div title={moment(String(cell)).format("LLL")}>
          <h6>{moment(String(cell)).fromNow()}</h6>
          <span className="text-xs text-zui-silver">
            {moment(String(cell)).format("LT")}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (cell) => (
        <span title={moment(String(cell)).format("LLL")}>
          {moment(String(cell)).fromNow()}
        </span>
      ),
    },
  ];

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "status",
        className: "w-48",
        placeholder: "All Leads",
        options: [
          {
            label: "All Leads",
            value: "null",
          },
          ...(statusOptions || []),
        ],
      },
      {
        type: "select",
        key: "category",
        className: "w-48",
        placeholder: "All Categories",
        options: [
          {
            label: "All Categories",
            value: "null",
          },
          ...(categoryOptions || []),
        ],
      },
    ],
    [statusOptions, categoryOptions]
  );

  const handleRowClick = (data: GeneralObject) => {
    router.push(combineRouteAndQueryParams(data.id, router.query), undefined, {
      shallow: true,
    });
  };

  const resetParams = () => {
    router.push(
      combineRouteAndQueryParams("/misc/leads", router.query),
      undefined,
      {
        shallow: true,
      }
    );
  };

  return (
    <>
      <Zud
        onRowClick={handleRowClick}
        columns={columns}
        queryEndpoint="CAS_LEADS"
        mutationEndpoint="CAS_LEADS"
        name="leads"
        title="Leads"
        filterOptions={filterOptions}
        customSearchQuery="ordering=-created_at"
      />
      <LeadSidebar
        selectedLead={params.leadId}
        isOpen={isValidUUID(params.leadId)}
        onClose={resetParams}
      />
    </>
  );
};

export default Leads;
