import {
  AccessTimeOutlined,
  AccountBalanceWalletOutlined,
  AccountCircleOutlined,
  BadgeOutlined,
  EmailOutlined,
  LocalOfferOutlined,
  LocationOnOutlined,
  PersonOutlined,
  PhoneOutlined,
  WcOutlined,
} from "@mui/icons-material";
import Icon from "@zo/assets/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { formatCapitalize, isValidUUID } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import { Button, Drawer, Flex, Tooltip, Typography } from "antd";
import moment from "moment";
import Image from "next/image";
import React, { useMemo } from "react";
import { DataListDisplay } from "../ui2";
import { DataList } from "../ui2/DataDisplayList";

const { Title } = Typography;

interface UserInfoSIdebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  removeAccessHandler: () => void;
}

const UserInfoSIdebar: React.FC<UserInfoSIdebarProps> = ({
  isOpen,
  onClose,
  userId,
  removeAccessHandler,
}) => {
  const { data: userInfo } = useQueryApi<GeneralObject>(
    "CAS_USERS",
    {
      enabled: isValidUUID(userId),
      refetchOnWindowFocus: false,
      select(data) {
        return data.data;
      },
    },
    `${userId}/`,
    ""
  );

  const userInfoObject = useMemo<DataList[]>(
    () => [
      {
        id: "basic",
        title: "Basic Info",
        data: [
          {
            id: "nickname",
            content: userInfo?.profile.nickname,
            icon: <AccountCircleOutlined />,
            label: "Nickname",
            isHidden: !userInfo?.profile.nickname,
          },
          {
            id: "full_name",
            content: formatCapitalize(
              userInfo?.profile.full_name || "Not specified"
            ),
            icon: <PersonOutlined />,
            label: "Full Name",
            isHidden: !userInfo?.profile.full_name,
          },
          {
            id: "gender",
            content: formatCapitalize(
              userInfo?.profile.gender || "Not specified"
            ),
            icon: <WcOutlined />,
            label: "Gender",
            isHidden: !userInfo?.profile.gender,
          },
          {
            id: "pid",
            content: userInfo?.profile.pid,
            icon: <BadgeOutlined />,
            label: "Profile ID",
            copyText: userInfo?.profile.pid,
          },
          {
            id: "bio",
            content: userInfo?.profile.bio,
            icon: <PersonOutlined />,
            label: "Bio",
            isHidden: !userInfo?.profile.bio,
          },
          {
            id: "created_at",
            content: userInfo?.created_at && (
              <Tooltip title={moment(userInfo.created_at).format("LLLL")}>
                {moment(userInfo.created_at).calendar()}
              </Tooltip>
            ),
            icon: <AccessTimeOutlined />,
            label: "Created At",
          },
        ],
      },
      {
        id: "contact",
        title: "Contact Info",
        isHidden: !userInfo?.emails?.length && !userInfo?.mobiles?.length,
        data: [
          {
            id: "emails",
            isHidden: !userInfo?.emails?.length,
            content: (
              <Flex vertical gap={8}>
                {userInfo?.emails?.map((email: GeneralObject) => (
                  <Flex key={email.id}>
                    <a
                      href={`mailto:${email.email_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zui-neon hover:underline"
                    >
                      {email.email_address}
                    </a>
                  </Flex>
                ))}
              </Flex>
            ),
            icon: <EmailOutlined />,
            label: "Email",
          },
          {
            id: "mobile",
            isHidden: !userInfo?.mobiles?.length,
            content: (
              <Flex vertical gap={8}>
                {userInfo?.mobiles?.map((mobile: GeneralObject) => (
                  <Flex key={mobile.id} gap={8}>
                    <a
                      href={`https://wa.me/${mobile.mobile_country_code}${mobile.mobile_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zui-neon hover:underline"
                    >
                      {`+${mobile.mobile_country_code} ${mobile.mobile_number}`}
                    </a>
                    {mobile.has_whatsapp && " (WhatsApp)"}
                  </Flex>
                ))}
              </Flex>
            ),
            icon: <PhoneOutlined />,
            label: "Mobile",
          },
        ],
      },
      {
        id: "web3",
        title: "Web3 Info",
        isHidden: !userInfo?.web3_wallets?.length,
        data: [
          {
            id: "wallets",
            content: (
              <Flex vertical gap={8}>
                {userInfo?.web3_wallets?.map((wallet: GeneralObject) => (
                  <Flex key={wallet.id} gap={8}>
                    <a
                      href={`https://${wallet.chain_name}.etherscan.io/address/${wallet.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zui-neon hover:underline"
                    >
                      {formatAddress(wallet.wallet_address)}
                    </a>
                    {wallet.primary && " (Primary)"}
                  </Flex>
                ))}
              </Flex>
            ),
            icon: <AccountBalanceWalletOutlined />,
            label: "Wallets",
          },
        ],
      },
      {
        id: "cultures",
        dataKey: "profile",
        title: "Cultures",
        isHidden: !userInfo?.profile.cultures?.length,
        data: [
          {
            id: "cultures",
            dataKey: "cultures",
            content: userInfo?.profile.cultures?.length ? (
              <ul className="flex flex-col gap-2">
                {userInfo?.profile.cultures?.map(
                  (culture: GeneralObject, index: number) => (
                    <li
                      key={culture.id}
                      className={cn(
                        "flex flex-col items-start gap-2",
                        index !== 0 && "mt-4"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={culture.icon}
                          className="h-6 w-6 rounded-full aspect-square"
                          alt={culture.name}
                        />
                        {culture.name}
                      </div>

                      {culture.description && (
                        <span className="text-sm text-gray-500">
                          {culture.description}
                        </span>
                      )}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <span>-</span>
            ),

            icon: <LocalOfferOutlined />,
          },
        ],
      },
      {
        id: "location",
        title: "Location",
        data: [
          {
            id: "country",
            content: userInfo?.profile.country?.name || "Not specified",
            icon: <LocationOnOutlined />,
            label: "Country",
          },
        ],
      },
    ],
    [userInfo]
  );

  return (
    <Drawer
      extra={
        <Button variant="dashed" color="danger" onClick={removeAccessHandler}>
          Remove Access
        </Button>
      }
      title="User Info"
      open={isOpen}
      onClose={onClose}
    >
      <Flex justify="center" align="center" vertical gap={16}>
        <Image
          src={userInfo?.profile.avatar.image}
          alt="User"
          width={100}
          className="rounded-full h-20 w-20"
          height={100}
        />
        <Flex gap={8}>
          <Title level={5} style={{ marginBottom: 0 }}>
            {userInfo?.profile.nickname}
          </Title>
          {String(userInfo?.membership).toLowerCase() === "founder" && (
            <Icon name="FounderBadge" size={20} />
          )}
        </Flex>
      </Flex>
      <DataListDisplay className="mt-6" data={userInfoObject} />
    </Drawer>
  );
};

export default UserInfoSIdebar;
