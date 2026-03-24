import { useQueryApi } from "@zo/auth";

import { PersonOutline } from "@mui/icons-material";
import { GeneralObject } from "@zo/definitions/general";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import {
  FormFieldType,
  Zud,
  ZudColumnType,
  ZudFilterOptionType,
} from "@zo/zud";
import { Avatar, Flex } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { CommsApplication } from "../../config/typings";

const Index: NextPage = () => {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug) {
      const [threadId, mode] = router.query.slug;
      const isCreatingNewThread = threadId === "new";

      return {
        threadId: isCreatingNewThread ? null : threadId,
        mode,
        isCreatingNewThread,
      };
    }
    return {
      threadId: null,
      mode: null,
      isCreatingNewThread: false,
    };
  }, [router.query]);

  const { data: applicationOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_COMMS_APPLICATIONS",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((application: CommsApplication) => ({
          label: application.name,
          value: application.id,
        })),
    },
    "",
    "limit=50"
  );

  const { data: threadCount } = useQueryApi<number>("CAS_COMMS_THREADS", {
    select: (data) => data.data.count,
  });

  const { data: categories } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    refetchOnWindowFocus: false,
    select: (data) =>
      data.data.comms.thread.category.map((category: string) => ({
        label: formatCapitalize(category),
        value: category,
      })),
  });

  const handleRowClick = (data: GeneralObject) => {
    if (isValidString(data.id)) {
      router.push(
        combineRouteAndQueryParams(
          `/threads/recipients/${data.id}`,
          router.query
        ),
        undefined,
        { shallow: true }
      );
    }
  };

  const handleClose = () => {
    router.replace(
      combineRouteAndQueryParams("/threads", router.query),
      undefined,
      { shallow: true }
    );
  };

  const columns: ZudColumnType[] = [
    {
      key: "title",
      title: "Title",
      dataIndex: "title",
      width: "320px",
      render: (cell, row) =>
        cell ? (
          <Flex align="center" gap="small">
            <Avatar icon={<PersonOutline fontSize="small" />} src={row.icon} />
            <span>{cell}</span>
          </Flex>
        ) : (
          <span>N/A</span>
        ),
    },
    {
      key: "category",
      title: "Category",
      dataIndex: "category",
      render: (cell) => formatCapitalize(cell),
    },
    {
      key: "num_recipients",
      title: "Recipients",
      dataIndex: "num_recipients",
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render: (cell) => <span>{moment(cell).format("LLL")}</span>,
    },
    {
      key: "created_by",
      title: "Created By",
      dataIndex: "created_by",
      render: (cell) =>
        cell ? (
          <Flex align="center" gap="small">
            <Avatar
              icon={<PersonOutline fontSize="small" />}
              src={cell?.profile?.pfp || cell?.profile?.data?.avatar}
            />
            <span>{cell?.profile?.nickname || cell?.profile?.name || ""}</span>
          </Flex>
        ) : (
          <span>N/A</span>
        ),
    },
  ];

  const filterOptions: ZudFilterOptionType[] = [
    {
      type: "select",
      key: "category",
      className: "w-48",
      options: [
        { label: "All Chat", value: "null" },
        { label: "Group Chat", value: "group-chat" },
      ],
      placeholder: "Category",
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: categories,
      required: true,
    },
    {
      name: "application",
      label: "Application",
      type: "select",
      options: applicationOptions,
      required: true,
    },
    {
      name: "icon",
      label: "Icon",
      type: "mediaLinkGenerator",
      required: true,
    },
  ];

  return (
    <Zud
      breadCrumbs={[{ href: "/threads", label: "Threads" }]}
      name="threads"
      title="Threads"
      queryEndpoint="CAS_COMMS_THREADS"
      mutationEndpoint="CAS_COMMS_THREADS"
      filterOptions={filterOptions}
      columns={columns}
      formFields={formFields}
      onRowClick={handleRowClick}
      customSearchQuery="ordering=title"
      searchable
      allowEdit={false}
      stats={[{ label: "Total Threads", value: threadCount || 0 }]}
    />
  );
};

export default Index;
