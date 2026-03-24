import { LoadingOutlined } from "@ant-design/icons";
import {
  AccountBalanceWallet,
  CurrencyRupee,
  Email,
  Link as LinkIcon,
  Twitter,
} from "@mui/icons-material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useMemo } from "react";
import { useQueryClient } from "react-query";
import { CASBookingResponse, EventGuest, Profile, Social } from "../../config";
import { QuestionnaireAnswers } from "../ui";
const { Title, Text } = Typography;

interface GuestInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeGuest: EventGuest;
}

const DEFAULT_CURRENCY = {
  code: "INR",
  id: "INR",
  name: "Indian Rupee",
  decimals: 8,
  symbol: "₹",
};

const GuestInfoSidebar: React.FC<GuestInfoSidebarProps> = ({
  isOpen,
  onClose,
  activeGuest,
}) => {
  const queryClient = useQueryClient();
  const {
    data: userData,
    isLoading,
    isFetching,
    isRefetching,
  } = useQueryApi<Profile>(
    "CAS_PROFILES",
    {
      enabled: isOpen && activeGuest?.user.pid != undefined,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${activeGuest?.user.pid}/`
  );

  const { mutate: updateGuest } = useMutationApi(
    "CAS_EXPERIENCE_BOOKINGS",
    {},
    ``,
    "PUT"
  );

  const { data: bookingDetails } = useQueryApi<CASBookingResponse>(
    "CAS_EXPERIENCE_BOOKINGS",
    {
      enabled: isOpen && isValidString(activeGuest.id),
      select: (data) => data.data,
    },
    `${activeGuest.id}/`
  );

  const handleUpdateStatus = (status: string) => {
    updateGuest(
      {
        data: {},
        route: `${activeGuest.id}/${status}/`,
      },
      {
        onSuccess() {
          queryClient.invalidateQueries([
            "cas",
            "experience",
            "bookings",
            "sku",
          ]);
          onClose();
        },
      }
    );
  };

  const renderPersonalInfo = (userData: Profile) => {
    const twitterSocial = userData.socials?.find(
      (social: Social) => social.category === "twitter"
    );

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Title level={5}>Personal Info</Title>

        {twitterSocial && (
          <Space>
            <Twitter />
            <a
              href={`https://twitter.com/${twitterSocial.data.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{twitterSocial.data.username}
            </a>
          </Space>
        )}

        {userData.user?.email_address && (
          <Space>
            <Email />
            <a href={`mailto:${userData.user.email_address}`}>
              {formatAddress(userData.user.email_address)}
            </a>
          </Space>
        )}

        {userData.user?.wallet_address && (
          <Space>
            <AccountBalanceWallet />
            <a
              href={`https://etherscan.io/address/${userData.user.wallet_address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatAddress(userData.user.wallet_address)}
            </a>
          </Space>
        )}
      </Space>
    );
  };

  const currency = useMemo(() => {
    return bookingDetails?.booked_skus && bookingDetails?.booked_skus.length > 0
      ? bookingDetails?.booked_skus[0].sku?.currency
      : DEFAULT_CURRENCY;
  }, [bookingDetails]);

  return (
    <Drawer
      title="Guest Information"
      placement="right"
      onClose={onClose}
      open={isOpen}
      extra={
        ["requested"].includes(activeGuest.status) && (
          <Space>
            <Tooltip title="Approve">
              <Button
                type="text"
                onClick={handleUpdateStatus.bind(null, "approve")}
                style={{ color: "#66DF48" }}
                icon={<DoneOutlinedIcon />}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                type="text"
                style={{ color: "#FF4545" }}
                onClick={handleUpdateStatus.bind(null, "cancel")}
                icon={<CloseOutlinedIcon />}
              />
            </Tooltip>
          </Space>
        )
      }
    >
      {isLoading || isFetching || isRefetching ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      ) : userData ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space direction="vertical" align="center" style={{ width: "100%" }}>
            <Avatar
              size={64}
              src={userData.pfp?.image}
              style={
                userData.user?.membership === "founder"
                  ? { border: "2px solid gold" }
                  : undefined
              }
            >
              {!userData.pfp?.image && (userData.nickname?.[0] || "Z")}
            </Avatar>

            <Title level={4} style={{ margin: 0 }}>
              {userData.nickname || "No Nickname"}
            </Title>

            <Tag>{activeGuest.status.toUpperCase()}</Tag>
          </Space>

          <Divider />

          {renderPersonalInfo(userData)}
        </Space>
      ) : (
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Avatar size={64}>Z</Avatar>
          <Text type="secondary">No Nickname</Text>
          <Text type="secondary">No data found</Text>
        </Space>
      )}

      {bookingDetails && (
        <>
          <Divider />
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Title level={5}>Booking Details</Title>

            <Space>
              <LinkIcon />
              <Text>Source: {formatCapitalize(bookingDetails.source)}</Text>
            </Space>

            <Space>
              <CurrencyRupee />
              <Text>
                Paid Amount:{" "}
                {(
                  bookingDetails.paid_amount * Math.pow(10, -currency?.decimals)
                ).toLocaleString(undefined, {
                  style: "currency",
                  currency: currency.code,
                })}
              </Text>
            </Space>
          </Space>
        </>
      )}

      {bookingDetails && bookingDetails?.questionnaire_answers?.length > 0 && (
        <>
          <Divider />
          <QuestionnaireAnswers
            questions={bookingDetails?.questionnaire_answers}
          />
        </>
      )}
    </Drawer>
  );
};

export default GuestInfoSidebar;
