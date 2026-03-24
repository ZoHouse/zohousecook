import { Person } from "@mui/icons-material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { MutationEndpoints, QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Flex,
  Form,
  List,
  Tag,
  Typography,
} from "antd";
import { Meta } from "antd/es/list/Item";
import React, { useState } from "react";
import { Artist } from "../../../config";
import { FormElement } from "../../Form";
import ShowcaseTypeSelectionSidebar from "../../sidebars/ShowcaseTypeSelectionSidebar";

const { Text } = Typography;

interface ShowCaseSelectionSidebarProps {
  type: "promotional" | "collected" | "artist" | "profile";
  value: string[];
  setValue: (value: string[]) => void;
}

const DEFAULT_IMAGE =
  "https://cdn.zo.xyz/gallery/media/images/42bd2fc9-7968-40e5-a9b9-77d33958ceae_20250116135406.svg";

const ShowCaseSelectionSidebar: React.FC<ShowCaseSelectionSidebarProps> = ({
  type,
  value,
  setValue,
}) => {
  const [isBarVisible, setBarVisible] = useState<boolean>(false);
  const [selectedEntries, setSelectedEntries] = useState<GeneralObject[]>([]);

  const { data: artists } = useQueryApi(
    "CAS_STUDIO_ARTISTS",
    {
      refetchOnWindowFocus: false,
      select: (data) => data?.data,
    },
    "",
    "limit=-1"
  );

  const openLink = (link: string) => {
    window.open(link, "_blank");
  };

  const renderPromotionalEntry = (
    data: GeneralObject,
    _: number,
    isSelected: boolean
  ) => {
    return (
      <Card
        className={`w-full h-[240px] rounded-lg overflow-hidden border border-zui-lightest max-w-[208px] ${
          isSelected && "border-zui-neon"
        }`}
        cover={
          <img
            alt="promotional cover"
            src={data?.media?.url || DEFAULT_IMAGE}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
            className="flex-1 w-full h-[150px] p-[1px] object-cover"
          />
        }
      >
        <Meta
          title={
            <Flex gap="16px">
              <span className="text-sm flex-1 truncate">{data.name}</span>
            </Flex>
          }
          description={
            <Tag
              bordered={false}
              className="h-fit mt-1"
              color={data.status === "active" ? "success" : "warning"}
            >
              {data.status}
            </Tag>
          }
        />
      </Card>
    );
  };

  const renderArtistEntry = (
    data: GeneralObject,
    _: number,
    isSelected: boolean
  ) => {
    return (
      data && (
        <Card
          className={`w-full h-[240px] rounded-lg overflow-hidden border border-zui-lightest max-w-[208px] ${
            isSelected && "border border-zui-neon"
          }`}
          cover={
            <div className="w-full h-[150px] p-[1px] object-cover relative group">
              <div className="flex justify-center items-center absolute h-full w-full bottom-0 right-0 bg-black/60 invisible group-hover:visible transition-all duration-300">
                {data?.art?.image && (
                  <Button
                    type="link"
                    onClick={() =>
                      openLink(
                        `https://opensea.io/assets/ethereum/${data?.art?.contract_ref_address}/${data?.art?.token_ref_id}`
                      )
                    }
                    icon={<OpenInNewOutlinedIcon fontSize="small" />}
                  >
                    View Art
                  </Button>
                )}
              </div>
              <img
                alt="promotional cover"
                src={data?.art?.image || DEFAULT_IMAGE}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
                className="flex-1 w-full h-[150px] p-[1px] object-cover"
              />
            </div>
          }
        >
          <Meta
            avatar={
              <Flex gap="small" align="center">
                <Avatar
                  src={data?.artist.pfp_image}
                  icon={<Person fontSize="small" />}
                />
                <Flex vertical>
                  <Text>{data?.artist.name}</Text>
                  <Text type="secondary">{data?.artist.membership}</Text>
                </Flex>
              </Flex>
            }
          />
        </Card>
      )
    );
  };

  const renderCollectedEntry = (
    data: GeneralObject,
    _: number,
    isSelected: boolean
  ) => {
    return (
      data && (
        <Card
          className={`w-full h-[240px] rounded-lg overflow-hidden border border-transparent max-w-[208px] ${
            isSelected && "border border-zui-neon"
          }`}
          cover={
            <div className="w-full h-[150px] p-[1px] object-cover relative group">
              <div className="flex justify-center items-center absolute h-full w-full bottom-0 right-0 bg-black/60 invisible group-hover:visible transition-all duration-300">
                {data?.nft?.image && (
                  <Button
                    type="link"
                    onClick={() =>
                      openLink(
                        `https://opensea.io/assets/ethereum/${data?.nft?.contract_ref_address}/${data?.nft?.token_ref_id}`
                      )
                    }
                    icon={<OpenInNewOutlinedIcon fontSize="small" />}
                  >
                    View Art
                  </Button>
                )}
              </div>
              <img
                alt="promotional cover"
                src={data?.nft?.image || DEFAULT_IMAGE}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
                className="flex-1 w-full h-[150px] p-[1px] object-cover"
              />
            </div>
          }
        >
          <Meta
            avatar={
              <Flex gap="small" align="center">
                <Avatar
                  src={data?.user.pfp_image}
                  icon={<Person fontSize="small" />}
                />
                <Flex vertical>
                  <Text>{data?.user.nickname}</Text>
                  <Text type="secondary">{data?.user.membership}</Text>
                </Flex>
              </Flex>
            }
          />
        </Card>
      )
    );
  };

  const renderProfileEntry = (
    data: GeneralObject,
    _: number,
    isSelected: boolean
  ) => {
    return (
      data && (
        <Card
          className={`w-full h-[240px] rounded-lg overflow-hidden max-w-[208px] ${
            isSelected && "border border-zui-neon"
          }`}
          cover={
            <div className="w-full h-[150px] p-[1px] object-cover relative group">
              <img
                alt="promotional cover"
                src={DEFAULT_IMAGE}
                className="flex-1 w-full h-[150px] p-[1px] object-cover"
              />
            </div>
          }
        >
          <Meta
            avatar={
              <Flex gap="small" align="center">
                <Avatar
                  src={data?.pfp_image}
                  icon={<Person fontSize="small" />}
                />
                <Flex vertical>
                  <Text>
                    {data?.name ||
                      data?.nickname ||
                      formatAddress(data.wallet_address)}
                  </Text>
                  <Text type="secondary">{data?.membership}</Text>
                </Flex>
              </Flex>
            }
          />
        </Card>
      )
    );
  };

  const handleCustomEntries = (data: GeneralObject[]) => {
    setSelectedEntries(data);
    setValue(data.map((item) => item.id));
  };

  const promotionalFormFields: FormElement[] = [
    {
      label: "Name",
      name: "name",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      mediaKey: "showcase_promotional_media",
      name: "media",
      label: "Media",
      type: "media",
    },
    {
      name: "data.url",
      label: "Webpage Link",
      type: "text",
      rules: [
        {
          type: "url",
          message: "Please enter a valid URL",
        },
      ],
    },
  ];

  const artistFormFields: FormElement[] = [
    {
      label: "Artist",
      name: "artist_id",
      alias: "artist.id",
      disabledOnEdit: true,
      type: "select",
      options: (artists?.data?.results || []).map((artist: Artist) => ({
        label: artist.name || "Artist",
        value: artist.id,
      })),
    },
    {
      name: "collection.contract_ref_address",
      label: "Collection Contract Address",
      type: "text",
      placeholder: "0x000...",
      hint: "Enter the contract address of the collection to showcase",
    },
    {
      name: "art.contract_ref_address",
      label: "Art Contract Address",
      type: "text",
      placeholder: "0x000...",
      hint: "Enter the contract address of the art to showcase",
    },
    {
      name: "art.token_ref_id",
      label: "Art Token Id",
      type: "text",
      hint: "Enter the token id of the art to showcase",
    },
  ];

  const typeProps = {
    profile: {
      name: "Profile",
      queryEndpoint: "CAS_SHOWCASE_PROFILE" as QueryEndpoints,
      mutationEndpoint: "CAS_SHOWCASE_PROFILE" as MutationEndpoints,
      renderEntry: renderProfileEntry,
      formFields: [] as FormElement[],
    },
    artist: {
      name: "Artist",
      queryEndpoint: "CAS_SHOWCASE_ARTISTS" as QueryEndpoints,
      mutationEndpoint: "CAS_SHOWCASE_ARTISTS" as MutationEndpoints,
      renderEntry: renderArtistEntry,
      formFields: artistFormFields,
    },
    collected: {
      name: "Collected",
      queryEndpoint: "CAS_SHOWCASE_USERS" as QueryEndpoints,
      mutationEndpoint: "CAS_SHOWCASE_USERS" as MutationEndpoints,
      renderEntry: renderCollectedEntry,
      formFields: [] as FormElement[],
    },
    promotional: {
      name: "Promotional",
      queryEndpoint: "CAS_SHOWCASE_PROMOTIONAL" as QueryEndpoints,
      mutationEndpoint: "CAS_SHOWCASE_PROMOTIONAL" as MutationEndpoints,
      renderEntry: renderPromotionalEntry,
      formFields: promotionalFormFields,
    },
  };

  return (
    <>
      <Form.Item label="Custom Entries">
        <Flex vertical gap="small" className="w-full mt-2">
          {!isValidString(type) && (
            <Alert
              showIcon
              message="Please select a showcase type first"
              type="warning"
            />
          )}
          <Button
            disabled={!isValidString(type) || !typeProps[type]}
            type="text"
            className="text-zui-neon"
            onClick={() => setBarVisible(true)}
          >
            {value?.length > 0 ? "View Selected / Select more" : "Select"}
          </Button>
        </Flex>
      </Form.Item>

      <Typography.Text
        type="secondary"
        style={{ textTransform: "uppercase", fontSize: "16px" }}
      >
        Selected Entries ({selectedEntries.length})
      </Typography.Text>
      <List
        dataSource={selectedEntries}
        size="small"
        split={false}
        className="mt-2"
        renderItem={(item, index) => (
          <List.Item key={item.id}>
            <Text>
              {index + 1}. {item.name}
            </Text>
          </List.Item>
        )}
      />

      {typeProps[type] ? (
        <ShowcaseTypeSelectionSidebar
          name={typeProps[type].name}
          renderEntry={typeProps[type].renderEntry}
          queryEndpoint={typeProps[type].queryEndpoint}
          preSelectedIds={value || []}
          mutationEndpoint={typeProps[type].mutationEndpoint}
          formFields={typeProps[type].formFields}
          onClose={() => setBarVisible(false)}
          onDone={handleCustomEntries}
          open={isBarVisible}
        />
      ) : (
        isValidString(type) && (
          <Alert
            showIcon
            message={`${formatCapitalize(type || "")} is not supported`}
            type="warning"
            className="mt-2"
          />
        )
      )}
    </>
  );
};

export default ShowCaseSelectionSidebar;
