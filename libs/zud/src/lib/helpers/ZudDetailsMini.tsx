/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@zo/assets/icons";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import {
  Avatar as AntAvatar,
  Button,
  Drawer,
  Empty,
  Flex,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import React, { useState } from "react";
import { ZudDataListDisplay } from "../../components/ui";

const { Title, Text } = Typography;

export type ZudDetailsMiniDataType = {
  /** Key to access user data from the API response. Used to display user avatar and name */
  userKey?: string;
  /** Title displayed at the top of the drawer */
  title?: string;
  /** Array of data sections to display in the drawer */
  dataList: {
    /** Unique identifier for the data section */
    id: string;
    /** Key to access data from the API response */
    dataKey: string;
    /** Optional title for the data section */
    title?: string;
    /** Optional function to determine if section should be hidden based on data */
    isHidden?: (item: any, data?: GeneralObject) => boolean;
    /** Array of data items to display within the section */
    data: Array<{
      /** Unique identifier for the data item */
      id: string;
      /** Key to access specific data field from API response */
      dataKey: string;
      /** Optional function to format/transform the content for display */
      content?: (item: any, data?: GeneralObject) => string | React.ReactNode;
      /** Optional icon to display next to the content */
      icon?: React.ComponentType | React.ReactNode;
      /** Optional function to generate a clickable link */
      link?: (item: any, data?: GeneralObject) => string;
      /** Optional function to provide text for copy functionality */
      copyText?: (item: any, data?: GeneralObject) => string;
      /** Optional function to determine if item should be hidden */
      isHidden?: (item: any, data?: GeneralObject) => boolean;
      /** Optional label to display for the item */
      label?: string;
    }>;
  }[];

  /** Optional function to provide extra action buttons in drawer footer */
  extra?: (
    data?: GeneralObject,
    refetch?: () => void
  ) => {
    /** Array of action buttons to display */
    actionButtons?: Array<{
      /** Button label text */
      label: string;
      /** Optional icon for the button */
      icon?: React.ComponentType | React.ReactNode;
      /** Click handler for the button */
      onClick: () => void;
      /** Optional variant for the button */
      variant?: "outlined" | "dashed" | "solid" | "filled" | "text" | "link";
      /** Optional className for the button */
      className?: string;
      /** Optional danger status for the button */
      danger?: boolean;
    }>;
  };
};

interface ZudDetailsMiniProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  queryEndpoint: QueryEndpoints;
  data: ZudDetailsMiniDataType;
  onRowUpdate: (data: GeneralObject) => void;
  showEditButton?: boolean;
  title?: string;
}

const ZudDetailsMini: React.FC<ZudDetailsMiniProps> = ({
  isOpen,
  onClose,
  onRowUpdate,
  id,
  queryEndpoint,
  data,
  showEditButton = false,
  title,
}) => {
  const {
    data: objectData,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
  } = useQueryApi<GeneralObject>(
    queryEndpoint,
    {
      enabled: id !== undefined && id !== "null",
      refetchOnWindowFocus: false,
      select: (data) => data.data,
      onSuccess: onRowUpdate,
    },
    `${id}/`,
    ""
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pfpError, setPfpError] = useState<boolean>(false);

  const isDataLoading = isLoading || isFetching || isRefetching;

  const handlePfpError: (() => boolean) | undefined = () => {
    setPfpError(true);
    return true;
  };

  const renderIcon = (icon: React.ComponentType | React.ReactNode) => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function") {
      const IconComponent = icon as React.ComponentType;
      return <IconComponent />;
    }
    return null;
  };

  const renderUserInfo = () => {
    if (!data.userKey || !objectData?.[data.userKey]) return null;
    const userData = objectData[data.userKey];
    console.log(objectData, userData);
    const displayName =
      userData.nickname || userData.name || objectData?.nickname || "Zo User";
    const initial = displayName.charAt(0).toUpperCase();
    const neonColor = "#CFFF50";

    const pfp =
      userData?.avatar?.image ||
      userData?.pfp_image ||
      userData?.pfp?.image ||
      "";

    console.log(pfp);
    return (
      <Space
        direction="vertical"
        align="center"
        style={{ width: "100%", marginBottom: 24 }}
      >
        <AntAvatar
          onError={handlePfpError}
          size={64}
          alt={
            objectData[data.userKey].nickname ||
            objectData?.nickname ||
            "Zo User"
          }
          src={pfp}
          className={cn(
            "flex items-center justify-center text-2xl font-bold text-white",
            !pfp && `bg-[${neonColor}]`
          )}
        >
          {!isValidString(pfp) && (
            <div className="text-zui-white">{initial}</div>
          )}
        </AntAvatar>

        <div className="flex items-center justify-center gap-2">
          <Title level={4} style={{ margin: 0 }} className="w-fit">
            {displayName}
          </Title>
          {(userData.membership === "founder" ||
            objectData?.membership === "founder") && (
            <Icon name="FounderBadge" className="mt-1" size={24} />
          )}
        </div>

        {(userData.membership === "founder" ||
          objectData?.membership === "founder") && (
          <Text type="secondary">Founder Member</Text>
        )}
      </Space>
    );
  };

  const renderContent = () => {
    if (!objectData || !isValidObject(objectData)) {
      return <Empty description="No data found" style={{ marginTop: "20%" }} />;
    }

    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        {renderUserInfo()}
        <ZudDataListDisplay
          data={data.dataList.map((dl) => ({
            id: dl.id,
            title: dl.title,
            isHidden: dl.isHidden
              ? dl.isHidden(objectData[dl.dataKey], objectData)
              : undefined,
            data: dl.data.map((item) => ({
              id: item.id,
              content: item.content
                ? item.content(
                    !isValidString(dl.dataKey)
                      ? objectData[item.dataKey]
                      : objectData[dl.dataKey]?.[item.dataKey],
                    objectData
                  )
                : objectData[item.dataKey],
              icon: item.icon,
              link: item.link
                ? item.link(
                    !isValidString(dl.dataKey)
                      ? objectData[item.dataKey]
                      : objectData[dl.dataKey]?.[item.dataKey],
                    objectData
                  )
                : undefined,
              copyText: item.copyText
                ? item.copyText(
                    !isValidString(dl.dataKey)
                      ? objectData[item.dataKey]
                      : objectData[dl.dataKey]?.[item.dataKey],
                    objectData
                  )
                : undefined,
              isHidden: item.isHidden
                ? item.isHidden(
                    !isValidString(dl.dataKey)
                      ? objectData[item.dataKey]
                      : objectData[dl.dataKey]?.[item.dataKey],
                    objectData
                  )
                : undefined,
              label: item.label,
            })),
          }))}
        />
      </div>
    );
  };

  const extraButtons = data
    .extra?.(objectData, refetch)
    ?.actionButtons?.map((button, index) => (
      <Tooltip title={button.label}>
        <Button
          className={cn("w-full", button.className)}
          key={index}
          onClick={button.onClick}
          type="primary"
          icon={renderIcon(button.icon)}
          variant={button.variant}
          danger={button.danger}
        />
      </Tooltip>
    ));

  return (
    <Drawer
      title={title ? `${formatCapitalize(title)} Info` : data.title}
      placement="right"
      onClose={onClose}
      open={isOpen}
      extra={
        extraButtons &&
        objectData && (
          <Flex gap={16} className="w-full">
            {extraButtons}
          </Flex>
        )
      }
    >
      <Spin wrapperClassName="" spinning={isDataLoading}>
        <div className="h-full w-full">{renderContent()}</div>
      </Spin>
    </Drawer>
  );
};

export default ZudDetailsMini;
