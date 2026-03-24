import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { cn } from "@zo/utils/font";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import {
  Button,
  List,
  Space,
  Tooltip,
  Typography,
  message,
  Skeleton,
} from "antd";
import React, { useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const { Text, Title } = Typography;

export type DataList = {
  id: string;
  title?: string;
  data: Array<{
    id: string;
    content: string | undefined;
    icon: React.ComponentType | React.ReactNode;
    link?: string;
    copyText?: string;
    isHidden?: boolean;
    onClick?: () => void;
    label?: string; 
  }>;
  isHidden?: boolean;
};

interface ZudDataListDisplayProps {
  className?: string;
  data: DataList[];
  isLoading?: boolean;
}

const ZudDataListDisplay: React.FC<ZudDataListDisplayProps> = ({
  className,
  data,
  isLoading,
}) => {
  const [copied, setCopied] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();

  const copy = (copyText: string) => {
    copyTextToClipboard(copyText);
    setCopied(copyText);
    messageApi.success("Copied to clipboard");
    setTimeout(() => setCopied(""), 2000);
  };

  const renderIcon = (
    icon: React.ComponentType<{ sx?: object }> | React.ReactNode
  ) => {
    if (React.isValidElement(icon)) {
      // @ts-expect-error - sx prop may not exist on all icon types
      return React.cloneElement(icon, { sx: { fontSize: "20px" } });
    }
    if (typeof icon === "function") {
      const IconComponent = icon;
      return <IconComponent sx={{ fontSize: "20px" }} />;
    }
    return icon;
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-2">
            <Skeleton.Input
              style={{ width: 150, marginBottom: 24, height: 20 }}
              active
            />
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center space-x-3 mb-4">
                <Skeleton.Avatar active size="small" />
                <Skeleton.Input
                  size="small"
                  active
                  style={{ height: 16, width: 200 }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className={cn("w-full", className)}>
        <List
          dataSource={data.filter((list) => !list.isHidden)}
          split={false}
          renderItem={(list) => (
            <List.Item key={list.id} className="flex flex-col items-start py-6">
              {isValidString(list.title) && (
                <Title
                color=""
                  level={5}
                  className="text-zui-silver uppercase self-start mb-6 "
                >
                  <span className="text-zui-silver">{list.title}</span>
                </Title>
              )}

              <List
                dataSource={list.data.filter(
                  (item) => !item.isHidden && item.content != null
                )}
                className="w-full"
                split={false}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <Space align="start" size={12} className="w-full">
                      <div className="h-6 w-6 flex-shrink-0">
                        {renderIcon(item.icon)}
                      </div>

                      {isValidString(item.label) && (
                        <Text className="text-zui-white whitespace-nowrap">
                          {item.label}:
                        </Text>
                      )}

                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zui-neon transition-colors duration-200 hover:underline"
                        >
                          <Space>
                            <Text className="text-zui-neon" color="#CFFF50">
                              <span className="text-zui-neon">
                                {item.content}
                              </span>
                            </Text>
                            <OpenInNewIcon
                              className="text-zui-neon w-4 h-4"
                              fontSize="small"
                            />
                          </Space>
                        </a>
                      ) : (
                        <div className="text-white">{item.content}</div>
                      )}

                      {item.onClick && (
                        <Button
                          type="link"
                          onClick={item.onClick}
                          className="text-zui-neon hover:text-zui-neon/80 ml-auto"
                        >
                          Add
                        </Button>
                      )}

                      {isValidString(item.copyText) && (
                        <Tooltip
                          title={copied === item.copyText ? "Copied!" : "Copy"}
                          placement="top"
                        >
                          <Button
                            size="small"
                            type="text"
                            className="hover:opacity-80 transition-opacity"
                            icon={
                              copied === item.copyText ? (
                                <CheckIcon
                                  fontSize="small"
                                  className="text-white w-4 h-4"
                                />
                              ) : (
                                <ContentCopyIcon
                                  fontSize="small"
                                  className="text-white w-4 h-4"
                                />
                              )
                            }
                            onClick={() => copy(String(item.copyText))}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

export default ZudDataListDisplay;
