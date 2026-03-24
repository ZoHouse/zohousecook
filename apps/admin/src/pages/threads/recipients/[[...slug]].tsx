import { useMutationApi, useQueryApi } from "@zo/auth";

import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import { ZudColumnType, ZudTable } from "@zo/zud";

import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
  removeQueryParams,
} from "@zo/utils/string";
import {
  AddThreadRecipientsSidebar,
  ThreadsSidebar,
} from "apps/admin/src/components/sidebars";

import {
  DeleteOutlined,
  EditOutlined,
  PersonOutline,
} from "@mui/icons-material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { processResponseError } from "@zo/utils/auth";
import { Avatar, Button, Flex, message, Tag, Tooltip } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { CommsThread } from "../../../config/typings";

interface RecipientsProps {}

const Recipients: React.FC<RecipientsProps> = () => {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug && Array.isArray(router.query.slug)) {
      const [thread, mode] = router.query.slug;
      return {
        thread,
        mode,
      };
    }
    return {
      thread: null,
      mode: null,
    };
  }, [router.query]);

  const [data, setData] = useState<GeneralObject[]>([]);

  const { data: threadsData } = useQueryApi<CommsThread>(
    "CAS_COMMS_THREADS",
    {
      enabled: isValidString(router.query.slug?.[0]),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${router.query.slug?.[0]}/`
  );

  const { mutate: deleteRecipients } = useMutationApi(
    "CAS_COMMS_THREADS",
    {},
    "",
    "DELETE"
  );

  const route = useMemo(() => {
    if (param.thread) {
      return `${param.thread}/recipients/`;
    } else {
      return "";
    }
  }, [param]);

  const { isLoading } = useInfiniteTable({
    name: "threads-recipients",
    queryEndpoint: "CAS_COMMS_THREADS",
    additionalRoute: route,
    setter: setData,
    enabled: isValidString(route),
    customSearchQuery: "ordering=-created_at",
  });

  const handleDelete = (id: string) => {
    if (param.thread) {
      deleteRecipients(
        {
          data: {},
          route: `${param.thread}/recipients/${id}/`,
        },
        {
          onSuccess: () => {
            message.success("Recipient Deleted.");
            const _data = data.filter((item) => item.id !== id);
            setData(_data);
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    } else {
      message.error("An Error Occured.");
    }
  };

  const handleAddClick = () => {
    router.push(
      combineRouteAndQueryParams(
        `${removeQueryParams(router.asPath)}/new`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  const handleEditClick = () => {
    router.push(
      combineRouteAndQueryParams(
        `${removeQueryParams(router.asPath)}/edit`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  const handleClose = () => {
    router.push(
      combineRouteAndQueryParams(
        `/threads/recipients/${param.thread}`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  const handleSuccess = (user: GeneralObject) => {
    setData([user, ...data]);
  };

  const columns: ZudColumnType[] = [
    {
      key: "account",
      title: "User",
      dataIndex: "account",
      width: "240px",
      render: (cell) =>
        cell ? (
          <Flex align="center" gap="small">
            <Avatar
              icon={<PersonOutline fontSize="small" />}
              src={cell?.profile?.pfp || cell?.profile?.data?.avatar}
            />
            <span>
              {cell?.profile?.nickname || cell?.profile?.name || "Zo User"}
            </span>
          </Flex>
        ) : (
          <span>N/A</span>
        ),
    },
    {
      key: "status",
      title: "Status",
      dataIndex: ["account", "status"],
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
      key: "application",
      title: "Application",
      dataIndex: "application",
      render: (cell, row) => row?.account?.application?.name || "-",
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (cell) => (
        <Tooltip title={moment(cell).format("LLLL")}>
          {moment(cell).format("LL")}
        </Tooltip>
      ),
    },
    {
      key: "delete",
      title: "Action",
      dataIndex: "id",
      render: (cell) => (
        <Button
          type="text"
          onClick={() => handleDelete(cell)}
          icon={<DeleteOutlined />}
        />
      ),
    },
  ];

  return (
    <Page
      breadCrumbs={[
        { href: "/threads", label: "Threads" },
        {
          href: `${router.asPath}`,
          label: threadsData?.title || "Recipients",
        },
      ]}
    >
      <PageHeader
        title="Recipients"
        buttons={[
          {
            label: "Edit Thread",
            onClick: handleEditClick,
            type: "secondary",
            icon: <EditOutlined />,
          },
          {
            label: "Add Recipients",
            onClick: handleAddClick,
            type: "secondary",
            icon: <AddOutlinedIcon />,
          },
        ]}
      />
      <div className="py-10">
        <ZudTable isLoading={isLoading} data={data} columns={columns} />
      </div>
      <AddThreadRecipientsSidebar
        isOpen={param.mode === "new"}
        onClose={handleClose}
        threadId={param.thread}
        onSuccess={handleSuccess}
      />
      <ThreadsSidebar
        isOpen={param.mode === "edit"}
        onClose={handleClose}
        threadId={param.thread}
      />
    </Page>
  );
};

export default Recipients;
