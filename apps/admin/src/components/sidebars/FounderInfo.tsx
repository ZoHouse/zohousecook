import { useQueriesApi, useQueryApi } from "@zo/auth";
import { formatCapitalize } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import {
  Avatar as AntAvatar,
  Divider,
  Drawer,
  Empty,
  List,
  Space,
  Spin,
  Typography,
} from "antd";
import React, { useMemo, useEffect, useState, useRef } from "react";
import {
  CASFounderTokensOwnerResponse,
  FounderToken,
  Profile,
  Social,
} from "../../config";
import { NftCard } from "../ui";

import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Cake as CakeIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Favorite as FavoriteIcon,
  Home as HomeIcon,
  OpenInNew as OpenInNewIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Twitter as TwitterIcon,
} from "@mui/icons-material";

const { Title, Text } = Typography;

interface UserInfoProps {
  isOpen: boolean;
  data: CASFounderTokensOwnerResponse | null;
  onClose: () => void;
}

interface ListItem {
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ITEMS_PER_PAGE = 6;

const UserInfo: React.FC<UserInfoProps> = ({ isOpen, onClose, data }) => {
  const [visibleTokens, setVisibleTokens] = useState<number>(ITEMS_PER_PAGE);
  const drawerRef = useRef<HTMLDivElement>(null);

  const {
    data: userData,
    isLoading,
    isFetching,
    isRefetching,
  } = useQueryApi<Profile>(
    "CAS_PROFILES",
    {
      enabled: isOpen && data?.user != null,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${data?.user?.pid}/`
  );

  const queries = useMemo(() => {
    if (data && data.tokens) {
      return Object.keys(data.tokens).map((address: string) => [
        `${address}/tokens/`,
        ``,
      ]);
    } else {
      return [];
    }
  }, [data]);

  const founderTokensData = useQueriesApi(
    "CAS_FOUNDER_TOKENS",
    {
      enabled: queries.length > 0,
      select: (data) => data.map((response: any) => response.data.data),
    },
    queries as [string, string][]
  );

  const founderTokens = useMemo(() => {
    if (founderTokensData && founderTokensData?.length > 0) {
      return founderTokensData
        .map((resp: any) => resp.data?.data?.results)
        .flat();
    } else {
      return [];
    }
  }, [founderTokensData]);

  const [pfp, displayName, initial] = useMemo(() => {
    const pfp =
      userData?.pfp?.image ||
      userData?.avatar?.image ||
      userData?.pfp_image ||
      "";
    const displayName = userData?.nickname || userData?.nickname || "Zo User";
    const initial = displayName.charAt(0).toUpperCase();
    return [pfp, displayName, initial];
  }, [userData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && visibleTokens < founderTokens.length) {
          setVisibleTokens((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, founderTokens.length)
          );
        }
      },
      { threshold: 0.5 }
    );

    const currentDrawerRef = drawerRef.current;
    if (currentDrawerRef) {
      observer.observe(currentDrawerRef);
    }

    return () => {
      if (currentDrawerRef) {
        observer.unobserve(currentDrawerRef);
      }
    };
  }, [visibleTokens, founderTokens.length]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      closeIcon={<CloseIcon />}
      title={"Founder Info"}
    >
      {isLoading || isFetching || isRefetching ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : userData != null ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space direction="vertical" align="center" style={{ width: "100%" }}>
            <AntAvatar
              size={64}
              src={pfp}
              style={{
                border:
                  userData.user?.membership === "founder"
                    ? "2px solid #FFD700"
                    : "none",
              }}
            >
              {initial}
            </AntAvatar>
            <Title level={3} style={{ margin: 0 }}>
              {displayName}
            </Title>
          </Space>

          <Space direction="vertical" style={{ width: "100%" }}>
            <List
              itemLayout="horizontal"
              split={false}
              dataSource={
                [
                  userData.socials?.find(
                    (social: Social) => social.category === "twitter"
                  ) && {
                    icon: <TwitterIcon fontSize="small" />,
                    content: (
                      <a
                        href={`https://twitter.com/${
                          userData.socials?.find(
                            (social: Social) => social.category === "twitter"
                          )?.data.username
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @
                        {
                          userData.socials?.find(
                            (social: Social) => social.category === "twitter"
                          )?.data.username
                        }
                      </a>
                    ),
                  },
                  userData.user.email_address && {
                    icon: <EmailIcon />,
                    content: (
                      <a href={`mailto:${userData.user.email_address}`}>
                        {formatAddress(userData.user.email_address)}
                      </a>
                    ),
                  },
                  userData.user.wallet_address && {
                    icon: <AccountBalanceWalletIcon />,
                    content: (
                      <>
                        <Text>Wallet Address:</Text>
                        <a
                          href={`https://etherscan.io/address/${userData.user.wallet_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {formatAddress(userData.user.wallet_address)}
                          <OpenInNewIcon />
                        </a>
                      </>
                    ),
                  },
                  userData.gender && {
                    icon: <PersonIcon />,
                    content: (
                      <Text>Gender: {formatCapitalize(userData.gender)}</Text>
                    ),
                  },
                  userData.date_of_birth && {
                    icon: <CakeIcon />,
                    content: (
                      <Text>
                        Date of Birth:{" "}
                        {new Date(userData.date_of_birth).toLocaleDateString()}
                      </Text>
                    ),
                  },
                  userData.relationship_status && {
                    icon: <FavoriteIcon />,
                    content: <Text>{userData.relationship_status}</Text>,
                  },
                  userData.bio && {
                    icon: <DescriptionIcon />,
                    content: <Text>Bio: {userData.bio}</Text>,
                  },
                  userData.address && {
                    icon: <HomeIcon />,
                    content: <Text>Address: {userData.address}</Text>,
                  },
                  userData.country?.name && {
                    icon: <PublicIcon />,
                    content: <Text>Country: {userData.country.name}</Text>,
                  },
                ].filter(Boolean) as ListItem[]
              }
              renderItem={(item: ListItem) => (
                <List.Item>
                  <Space>
                    {item.icon}
                    {item.content}
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No user data found"
        />
      )}

      <Divider />

      <Spin spinning={founderTokensData.some((resp: any) => resp.isLoading)}>
        <Title level={5} style={{ color: "#8C8C8C" }}>
          OWNS {data?.num_tokens} NFTs
        </Title>

        <div className="grid grid-cols-2 items-start justify-between gap-4 mt-4">
          {founderTokens
            ?.slice(0, visibleTokens)
            .map((token: FounderToken, index) => (
              <NftCard
                key={index}
                collection={token?.collection}
                link={token?.metadata.static_image_url}
                tokenId={token?.token_ref_id}
                image={token?.metadata.static_image_url}
                animation={token?.metadata.animation_url}
              />
            ))}
          {visibleTokens < founderTokens?.length && (
            <div ref={drawerRef} style={{ height: "20px", width: "100%" }} />
          )}
        </div>
      </Spin>
    </Drawer>
  );
};

export default UserInfo;
