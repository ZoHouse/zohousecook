import { useMutationApi, useQueryApi } from "@zo/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import moment from "moment";
import { NextPage } from "next";
import { useEffect, useMemo } from "react";
import { AddVisitorSidebar } from "../../components/sidebars";
import { StatusCell } from "../../components/ui";

import {
  AccessTime as AccessTimeIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  Twitter as TwitterIcon,
} from "@mui/icons-material";

import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import {
  Zud,
  ZudColumnType,
  ZudDetailsMiniDataType,
  ZudFilterOptionType,
} from "@zo/zud";
import { useRouter } from "next/router";
import { UserMini } from "../../components/ui";
import { Estate } from "../../config";
import { shortenEthereumAddress } from "../../utils";

const Index: NextPage = () => {
  const router = useRouter();

  const [isAddVisitorsVisible, showAddVisitors, hideAddVisitors] =
    useVisibilityState();

  const { data: visitorsCount } = useQueryApi<number>("CAS_VISITS", {
    select: (data) => data.data.count,
  });

  const { data: visitorStatus } = useQueryApi<
    Array<{ label: string; value: string }>
  >("CAS_SEED", {
    enabled: true,
    refetchOnWindowFocus: false,
    select: (data) => {
      return data.data.visits.status.map((item: any) => ({
        label: formatCapitalize(item),
        value: item,
      }));
    },
  });

  const { data: estateOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_ESTATES",
    {
      select: (data) =>
        data.data.map((estate: Estate) => ({
          value: estate.id,
          label: estate.name,
        })),
    },
    "",
    "limit=-1"
  );

  const { mutate: updateVisitor } = useMutationApi("CAS_VISITS", {}, "", "PUT");

  const detailsMini: ZudDetailsMiniDataType = useMemo(
    () => ({
      userKey: "visitor",
      extra: (data?: GeneralObject, refetch?: () => void) => ({
        actionButtons: !data?.checkout_time
          ? [
              {
                label: "Checkout",
                onClick: () => handleCheckout(data?.id, refetch),
              },
            ]
          : undefined,
      }),
      dataList: [
        {
          id: "visit-info",
          dataKey: "",
          title: "VISIT INFO",
          data: [
            {
              id: "name",
              dataKey: "name",
              content: (item: any) => `Name: ${formatCapitalize(String(item))}`,
              icon: <PersonIcon fontSize="small" />,
              isHidden(item: any) {
                return !isValidString(item);
              },
            },
            {
              id: "check-in",
              dataKey: "checkin_time",
              label: "Check In",
              content: (item: any) => (item ? moment(item).format("LLL") : "-"),
              icon: <AccessTimeIcon fontSize="small" />,
            },
            {
              id: "check-out",
              dataKey: "checkout_time",
              label: "Check Out",
              content: (item: any) => (item ? moment(item).format("LLL") : "-"),
              icon: <AccessTimeIcon fontSize="small" />,
            },
            {
              id: "purpose",
              dataKey: "purpose",
              label: "Purpose",
              icon: <MessageIcon fontSize="small" />,
              content: (item: any) => item || "-",
              isHidden: (item: any) => !isValidString(item),
            },
            {
              id: "status",
              dataKey: "status",
              label: "Status",
              icon: <InfoIcon fontSize="small" />,
              content: (item: any) => item || "-",
              isHidden: (item: any) => !isValidString(item),
            },
            {
              id: "estate",
              dataKey: "estate",
              label: "Estate",
              icon: <HomeIcon fontSize="small" />,
              content: (item: any) => item?.name || "-",
              isHidden: (item: any) => !isValidObject(item),
            },
            {
              id: "space",
              dataKey: "space",
              label: "Room",
              icon: <AccountBalanceIcon fontSize="small" />,
              content: (item: any) => item?.name || "-",
              isHidden: (item: any) => !isValidObject(item),
            },
          ],
        },
        {
          id: "visitor",
          dataKey: "visitor",
          title: "Personal Info",
          isHidden: (item: any, data?: GeneralObject) =>
            !isValidString(item?.email_address) &&
            !isValidString(item?.wallet_address) &&
            !isValidString(item?.mobile_number) &&
            !isValidString(item?.twitter_handle) &&
            !isValidString(data?.mobile_number) &&
            !isValidString(data?.wallet_address) &&
            !isValidString(data?.email_address),
          data: [
            {
              id: "email",
              dataKey: "email_address",
              content: (item: any, data?: GeneralObject) =>
                item || data?.email_address,
              isHidden: (item: any, data?: GeneralObject) =>
                !isValidString(item) && !isValidString(data?.email_address),
              link(item: any, data?: GeneralObject) {
                return `mailto:${item || data?.email_address}`;
              },
              icon: <EmailIcon fontSize="small" />,
            },
            {
              id: "wallet_address",
              dataKey: "wallet_address",
              label: "Wallet",
              content: (item: any, data?: GeneralObject) =>
                shortenEthereumAddress(item || data?.wallet_address),
              isHidden: (item: any, data?: GeneralObject) =>
                !(item || data?.wallet_address),
              icon: <AccountBalanceWalletIcon fontSize="small" />,
              copyText(item: any, data?: GeneralObject) {
                return item || data?.wallet_address;
              },
            },
            {
              id: "mobile_number",
              dataKey: "mobile_number",
              label: "Phone",
              content: (item: any, data?: GeneralObject) =>
                `Phone: ${item || data?.mobile_number}`,
              isHidden: (item: any, data?: GeneralObject) => !item,
              icon: <PhoneIcon fontSize="small" />,
            },
            {
              id: "twitter_username",
              dataKey: "twitter_handle",
              content: (item: any, data?: GeneralObject) =>
                item || data?.twitter_username,
              isHidden: (item: any, data?: GeneralObject) =>
                !isValidString(item) && !isValidString(data?.twitter_username),
              link: (item: any, data?: GeneralObject) =>
                `https://x.com/${item || data?.twitter_username}`,
              icon: <TwitterIcon fontSize="small" />,
            },
            {
              id: "telegram_username",
              dataKey: "telegram_username",
              content: (_: any, data?: GeneralObject) =>
                String(data?.telegram_username),
              isHidden: (_: any, data?: GeneralObject) =>
                !isValidString(data?.telegram_username),
              link: (_: any, data?: GeneralObject) =>
                `https://t.me/${data?.telegram_username}`,
              icon: <SendIcon fontSize="small" />,
            },
          ],
        },
      ],
    }),
    []
  );

  const stats: { label: string; value: number }[] = [
    { label: "Total Users", value: visitorsCount || 0 },
  ];

  const filterOptions: ZudFilterOptionType[] = useMemo(
    () => [
      {
        type: "select",
        key: "estate",
        className: "w-fit md:w-48",
        placeholder: "Estate",
        options: [
          {
            label: "All Estate",
            value: "null",
          },
          ...(estateOptions || []),
        ],
      },
      {
        type: "select",
        key: "status",
        className: "w-fit md:w-48",
        placeholder: "Status",
        options: [
          {
            label: "All Status",
            value: "null",
          },
          ...(visitorStatus || []),
        ],
      },
    ],
    [estateOptions, visitorStatus]
  );

  const columns: ZudColumnType[] = [
    {
      title: "Name",
      dataIndex: "visitor",
      key: "visitor",
      render: (cell, data) => {
        const user = {
          ...cell,
          email_address: data?.email_address,
          mobile_number: data?.mobile_number,
          wallet_address: data?.wallet_address,
          name: data?.name,
        };
        return <UserMini user={user} />;
      },
    },
    {
      title: "Room",
      dataIndex: "space",
      key: "space",
      render: (cell: any) => cell?.name || "-",
    },
    {
      title: "Estate",
      dataIndex: "estate",
      key: "estate",
      render: (cell: any) => cell?.name || "-",
      filters: [
        {
          text: "All Estate",
          value: "null",
        },
        ...(estateOptions || []).map((opt) => ({
          text: opt.label,
          value: opt.value,
        })),
      ],
      onFilter: (value, record) => {
        if (value === "null") return true;
        return record.estate?.id === value;
      },
    },
    {
      title: "Check In",
      dataIndex: "checkin_time",
      key: "checkin_time",
      render: (cell: any) => <span>{moment(cell).format("LLL")}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (cell: any) => <StatusCell status={String(cell)} />,
    },
  ];

  const handleOnClose = () => {
    hideAddVisitors();
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleCheckout = (id?: any, onSuccess?: () => void) => {
    updateVisitor(
      {
        data: { checkout_time: moment(new Date()).toISOString() },
        route: `${id}/`,
      },
      {
        onSuccess,
      }
    );
  };

  useEffect(() => {
    if (router.query.slug == "new") {
      showAddVisitors();
    }
  }, [router.query]);

  return (
    <>
      <Zud
        name="visit"
        title="Visitors"
        queryEndpoint="CAS_VISITS"
        mutationEndpoint="CAS_VISITS"
        detailsMini={detailsMini}
        columns={columns}
        stats={stats}
        onAddClick={showAddVisitors}
        filterOptions={filterOptions}
        customSearchQuery="ordering=-created_at"
      />
      <AddVisitorSidebar
        isOpen={isAddVisitorsVisible}
        onClose={handleOnClose}
      />
    </>
  );
};

export default Index;
