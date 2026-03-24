import { EditOutlined } from "@mui/icons-material";
import { useProfile } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader } from "@zo/moal";
import { Avatar, Button, Divider, Flex, Spin, Typography } from "antd";
import { NextPage } from "next";
import { DataListDisplay } from "../components/ui2";

import {
  AccountBalanceWallet,
  AccountCircle,
  Badge,
  CalendarToday,
  Description,
  Email,
  FitnessCenter,
  Favorite as HeartIcon,
  Info,
  LocalOffer,
  LocationCity,
  LocationOn,
  OpenInNew,
  Person,
  Phone,
  WcOutlined,
} from "@mui/icons-material";
import { useVisibilityState } from "@zo/utils/hooks";
import { formatCapitalize } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import moment from "moment";
import { useMemo } from "react";
import { UpdateProfileSidebar } from "../components/sidebars";
import { DataList } from "../components/ui2/DataDisplayList";

const { Title, Text } = Typography;

const Index: NextPage = () => {
  const { isLoading, profile, refetchProfile, updateProfile } = useProfile();
  const [
    isUpdateProfileSidebarVisible,
    showUpdateProfileSidebar,
    hideUpdateProfileSidebar,
  ] = useVisibilityState(false);

  const getUsername = (profile: GeneralObject) => {
    const name = [];

    if (profile?.first_name) name.push(profile?.first_name);
    if (profile?.middle_name) name.push(profile?.middle_name);
    if (profile?.last_name) name.push(profile?.last_name);

    return name.join(" ");
  };

  const data = [
    {
      label: "Email",
      value: profile?.email,
    },
  ];

  const details: DataList[] = useMemo(
    () => [
      {
        id: "basic",
        title: "Basic Info",
        isHidden: false,
        data: [
          {
            id: "nickname",
            content: profile?.nickname,
            icon: <AccountCircle />,
            isHidden: !profile?.nickname,
            label: "Nickname",
          },
          {
            id: "name",
            content: getUsername(profile),
            icon: <Person />,
            isHidden: !profile?.first_name && !profile?.last_name,
            label: "Name",
          },
          {
            id: "pid",
            content: profile?.pid,
            icon: <Badge />,
            isHidden: !profile?.pid,
            label: "Profile ID",
          },
          {
            id: "gender",
            content: profile?.gender && formatCapitalize(profile.gender),
            icon: <WcOutlined />,
            isHidden: !profile?.gender,
            label: "Gender",
          },
          {
            id: "body_type",
            content: profile?.body_type,
            icon: <FitnessCenter />,
            isHidden: !profile?.body_type,
            label: "Body Type",
          },
          {
            id: "bio",
            content: profile?.bio,
            icon: <Info />,
            isHidden: !profile?.bio,
            label: "Bio",
          },
          {
            id: "dob",
            content: profile?.date_of_birth
              ? moment(profile.date_of_birth).format("LL")
              : null,
            icon: <CalendarToday />,
            isHidden: !profile?.date_of_birth,
            label: "Date of Birth",
          },
          {
            id: "relationship",
            content:
              profile?.relationship_status &&
              formatCapitalize(profile.relationship_status),
            icon: <HeartIcon />,
            isHidden: !profile?.relationship_status,
            label: "Relationship Status",
          },
        ],
      },
      {
        id: "contact",
        title: "Contact Info",
        isHidden: false,
        data: [
          {
            id: "email",
            content: profile?.email_address,
            icon: <Email />,
            isHidden: !profile?.email_address,
            link: `mailto:${profile?.email_address}`,
            label: "Email",
          },
          {
            id: "phone",
            content: profile?.mobile_number,
            icon: <Phone />,
            isHidden: !profile?.mobile_number,
            link: `tel:${profile?.mobile_number}`,
            label: "Phone",
          },
          {
            id: "wallet",
            content: formatAddress(profile?.wallet_address),
            link: `https://etherscan.io/address/${profile?.wallet_address}`,
            icon: <AccountBalanceWallet />,
            isHidden: !profile?.wallet_address,
            label: "Wallet Address",
          },
        ],
      },
      {
        id: "location",
        title: "Location",
        isHidden: false,
        data: [
          {
            id: "address",
            content: profile?.address,
            icon: <LocationOn />,
            isHidden: !profile?.address,
            label: "Address",
          },
          {
            id: "country",
            content: profile?.country?.name,
            icon: <LocationCity />,
            isHidden: !profile?.country?.name,
            label: "Country",
          },
          {
            id: "pincode",
            content: profile?.pincode,
            icon: <Description />,
            isHidden: !profile?.pincode,
            label: "Pincode",
          },
          {
            id: "home_location",
            content: profile?.home_location?.lat && profile?.home_location?.lng
              ? `${profile?.home_location?.lat}, ${profile?.home_location?.lng}`
              : null,
            icon: <LocationOn />,
            isHidden: !profile?.home_location?.lat && !profile?.home_location?.lng,
            label: "Home Location",
          },
          {
            id: "place",
            content: profile?.place_name,
            icon: <LocationCity />,
            isHidden: !profile?.place_name,
            label: "Place",
          },
        ],
      },
      {
        id: "cultures",
        title: "Cultures",
        isHidden: false,
        data: [
          {
            id: "cultures-list",
            content: (
              <ul className="flex flex-col gap-2">
                {profile?.cultures?.map((culture: any) => (
                  <li key={culture.key} className="flex items-center gap-2">
                    <img
                      src={`${culture.icon}?w=50`}
                      className="h-6 w-6 rounded-full"
                      alt={culture.name}
                    />
                    <span>{culture.name}</span>
                  </li>
                ))}
              </ul>
            ),
            icon: <LocalOffer />,
            isHidden: !profile?.cultures?.length,
          },
        ],
      },
      {
        id: "membership",
        title: "Membership",
        isHidden: false,
        data: [
          {
            id: "membership-type",
            content:
              profile?.membership && formatCapitalize(profile.membership),
            icon: <Badge />,
            isHidden: !profile?.membership,
            label: "Membership Type",
          },
          {
            id: "founder-tokens",
            content: profile?.founder_tokens?.join(", "),
            icon: <Badge />,
            isHidden: !profile?.founder_tokens?.length,
            label: "Founder Tokens",
          },
        ],
      },
    ],
    [profile]
  );

  const openDashboard = () => {
    window.open(`${process.env.WEB_BASE_URL}/dashboard/`, "_blank");
  };

  return (
    <Page>
      <Spin spinning={isLoading}>
        <PageHeader
          title="Profile"
          buttons={
            [
              // {
              //   icon: <EditOutlined />,
              //   label: "Edit",
              //   onClick: showUpdateProfileSidebar,
              //   type: "secondary",
              // },
            ]
          }
        />
        <Flex align="center" gap={16}>
          <Avatar
            size={108}
            src={profile?.avatar?.image || profile?.pfp_image}
          />

          <Flex vertical>
            <Title level={3}>{getUsername(profile)}</Title>
            <Text>{profile?.nickname}</Text>
          </Flex>
        </Flex>
        <Divider />

        <Flex className="h-full min-h-[400px]" gap={16}>
          <Flex flex={1}>
            <DataListDisplay data={details} isLoading={isLoading} />
          </Flex>
          <Divider type="vertical" className="h-auto" />
          <Flex flex={1} vertical align="start" justify="start">
            <Title level={3}>Action</Title>
            <Text>To Connect Twitter, Wallet or Phone Number</Text>
            <Button
              type="link"
              onClick={openDashboard}
              className="px-0 mt-2 flex items-center gap-2"
            >
              Open Dashboard
              <OpenInNew fontSize="small" />
            </Button>
          </Flex>
        </Flex>
      </Spin>

      <UpdateProfileSidebar
        open={isUpdateProfileSidebarVisible}
        onClose={hideUpdateProfileSidebar}
      />
    </Page>
  );
};

export default Index;
