import {
  AccessTime,
  Chat,
  Email,
  House,
  InfoOutlined,
  PersonPinCircleOutlined,
  Wallet,
} from "@mui/icons-material";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { UserMini } from "@zo/moal";
import { combineRouteAndQueryParams } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import { Zud, ZudColumnType, ZudDetailsMiniDataType } from "@zo/zud";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AddInvitationSidebar } from "../../../components/sidebars";
import { StatusCell } from "../../../components/ui";
import { User } from "../../../config";

const Invitations: NextPage = () => {
  const router = useRouter();

  const params = useMemo(() => {
    const slug = router.query.slug;
    if (Array.isArray(slug) && slug.length > 0) {
      const [invitationId] = slug;

      return {
        invitationId: invitationId || null,
        isCreatingNewInvitation: invitationId === "new",
      };
    }
    return {
      invitationId: null,
      isCreatingNewInvitation: false,
    };
  }, [router.query]);

  const { mutate } = useMutationApi("CAS_INVITES", {}, "", "PUT");

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      render: (data, row) => <UserMini data={row as User} />,
    },
    {
      key: "valid_from",
      title: "Valid From",
      dataIndex: "valid_from",
      render: (data) => <span>{data ? moment(data).format("LLL") : "-"}</span>,
    },
    {
      key: "valid_till",
      title: "Valid Till",
      dataIndex: "valid_till",
      render: (data) => <span>{data ? moment(data).format("LLL") : "-"}</span>,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (cell) => <StatusCell status={String(cell)} />,
    },
    {
      key: "estate",
      title: "Estate",
      dataIndex: "estate",
      render: (cell) => cell.name,
    },
    {
      key: "reason",
      title: "Reason",
      dataIndex: "reason",
    },
    {
      key: "invited_by",
      title: "Invited By",
      dataIndex: "invited_by",
      render: (cell) => (
        <span>
          {cell?.first_name || cell?.nickname || cell?.twitter_handle}
        </span>
      ),
    },
  ];

  const handleUpdateStatus = async (
    id: string,
    status: "accepted" | "declined",
    onSuccess?: () => void
  ) => {
    mutate(
      {
        data: { status: status },
        route: `${id}/`,
      },
      {
        onSuccess,
      }
    );
  };

  const detailsMini: ZudDetailsMiniDataType = useMemo(
    () => ({
      title: "Invitee Info",
      footerOptions: (data: GeneralObject, refetch: () => void) =>
        data?.status === "pending"
          ? {
              actionButtons: [
                {
                  label: "Approve",
                  icon: "Tick",
                  onClick: handleUpdateStatus.bind(
                    null,
                    data?.id,
                    "accepted",
                    refetch
                  ),
                },
                {
                  label: "Decline",
                  icon: "Cross",
                  onClick: handleUpdateStatus.bind(
                    null,
                    data?.id,
                    "declined",
                    refetch
                  ),
                },
              ],
            }
          : undefined,
      dataList: [
        {
          id: "basic-info",
          dataKey: "",
          data: [
            {
              id: "name",
              dataKey: "name",
              icon: <PersonPinCircleOutlined />,
              content: (value, row) => (
                <span>{row?.name || row?.email_address || "-"}</span>
              ),
            },
            {
              id: "status",
              dataKey: "status",
              content: (item) => item,
              label: "Status",
              icon: <InfoOutlined />,
            },
            {
              id: "valid_from",
              dataKey: "valid_from",
              icon: <AccessTime />,
              label: "Valid From",
              content: (data) => (data ? moment(data).format("LLL") : "-"),
            },
            {
              id: "valid_till",
              dataKey: "valid_till",
              icon: <AccessTime />,
              content: (data) => (data ? moment(data).format("LLL") : "-"),
              label: "Valid Till",
            },
            {
              id: "reason",
              dataKey: "reason",
              icon: <Chat />,
              content: (value) => value || "-",
              label: "Reason",
            },
            {
              id: "estate",
              dataKey: "estate",
              icon: <House />,
              content: (value) => value.name || "-",
              label: "Estate",
            },
            {
              id: "invited_by",
              dataKey: "invited_by",
              icon: <PersonPinCircleOutlined />,
              content: (data) => {
                return (
                  <span>
                    {` Invited By
                    ${
                      data?.first_name ||
                      data?.nickname ||
                      data?.twitter_handle ||
                      data?.email_address ||
                      "-"
                    }`}
                  </span>
                );
              },
            },
          ],
        },
        {
          id: "personal-info",
          title: "Contact Info",
          dataKey: "",
          data: [
            {
              id: "wallet_address",
              dataKey: "wallet_address",
              icon: <Wallet />,
              content: (value) => formatAddress(value),
              isHidden: (value) => !value,
              copyText: (value) => value,
              link: (value) => `https://etherscan.io/address/${value}`,
              label: "Wallet Address",
            },
            {
              id: "email_address",
              dataKey: "email_address",
              icon: <Email />,
              isHidden: (value) => !value,
              content: (value) => value || "-",
              link: (value) => `mailto:${value}`,
            },
          ],
        },
      ],
    }),
    []
  );

  const handleAddInvitationClose = () => {
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };
  const handleAddInvitationOpene = () => {
    router.replace(combineRouteAndQueryParams("new", router.query), undefined, {
      shallow: true,
    });
  };

  return (
    <>
      <Zud
        name="invitations"
        title="Invitations"
        queryEndpoint="CAS_INVITES"
        mutationEndpoint="CAS_INVITES"
        columns={columns}
        detailsMini={detailsMini}
        onAddClick={handleAddInvitationOpene}
      />
      <AddInvitationSidebar
        isOpen={params.isCreatingNewInvitation}
        onClose={handleAddInvitationClose}
      />
    </>
  );
};

export default Invitations;
