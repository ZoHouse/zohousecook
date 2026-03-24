import { MoreVert } from "@mui/icons-material";
import type { MenuProps } from "antd";
import { Button, Dropdown, Grid, Space, Typography } from "antd";
import React from "react";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  collapseButtons?: boolean;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    className?: string;
    type: "primary" | "secondary";
    icon: React.ReactNode;
  }>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  buttons = [],
  title,
  icon,
  collapseButtons = false,
}) => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const menuItems: MenuProps["items"] = buttons.map((button, index) => ({
    key: index,
    label: button.label,
    icon: button.icon,
    onClick: button.onClick,
  }));

  return (
    <div
      style={{
        padding: "16px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Space size={16}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
      </Space>

      {collapseButtons && isMobile ? (
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" icon={<MoreVert />} />
        </Dropdown>
      ) : (
        <Space size={16}>
          {buttons.map((button, index) =>
            isMobile ? (
              <Button
                key={`btn-${index}`}
                type="text"
                icon={button.icon}
                onClick={button.onClick}
              />
            ) : (
              <Button
                key={`btn-${index}`}
                type={button.type === "primary" ? "primary" : "default"}
                icon={button.icon}
                onClick={button.onClick}
                className={button.className}
                size="large"
              >
                {button.label}
              </Button>
            )
          )}
        </Space>
      )}
    </div>
  );
};

export default PageHeader;
