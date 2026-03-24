/* eslint-disable @typescript-eslint/no-explicit-any */

import { DownOutlined } from "@ant-design/icons";
import * as MuiIcons from "@mui/icons-material";
import Icon from "@zo/assets/icons";
import { useZostelAuth } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Avatar } from "@zo/moal";
import { cn } from "@zo/utils/font";
import { isClient } from "@zo/utils/next";
import type { MenuProps } from "antd";
import { Flex, Menu, Tooltip, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import GlobalSearch from "./GlobalSearch";
interface Navigation {
  navigationLinks: GeneralObject;
  profile?: GeneralObject;
  logout?: () => void;
}

const Navigation: React.FC<Navigation> = ({
  navigationLinks,
  profile,
  logout,
}) => {
  const router = useRouter();
  const { user } = useZostelAuth();
  const isMobile = isClient ? window?.innerWidth < 768 : false;

  const [isHamburgerMenuVisible, setHamburgerVisible] = useState<boolean>(
    !isMobile
  );

  const [isSearchVisible, setSearchVisible] = useState<boolean>(false);
  const isMac = isClient
    ? navigator.platform.toUpperCase().indexOf("MAC") >= 0
    : false;

  const isActiveLink = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  const handleZostelAdmin = () => {
    const zostelToken = localStorage.getItem("zostel-token");
    const zostelTokenExpiry = localStorage.getItem("zostel-token-expiry");
    const userRoles = user?.roles ? `[${user.roles}]` : "";

    const baseUrl = process.env.ZOSTEL_ADMIN_URL;
    window.open(
      `${baseUrl}/?token=${zostelToken}&roles=${userRoles}&expiry=${zostelTokenExpiry}`,
      "_blank"
    );
  };

  const hasZostelToken = isClient && localStorage.getItem("zostel-token");

  const getMenuItems = (): MenuProps["items"] => {
    return navigationLinks?.map((set: any) => ({
      key: set.id,
      label: <span className="text-base truncate mt-4">{set.title}</span>,
      children: set.list.map((link: any) => {
        const IconComponent = link.iconName;
        return {
          key: link.id,
          label: (
            <Link
              href={link.link}
              onClick={() => {
                if (isMobile) {
                  setHamburgerVisible(false);
                }
              }}
              className="flex items-center space-x-3"
            >
              <IconComponent
                sx={{
                  fontSize: 24,
                  color: isActiveLink(link.link) ? "#CFFF50" : "#5A5A5A",
                }}
              />
              {isHamburgerMenuVisible && (
                <span
                  className={`text-sm whitespace-nowrap ${
                    isActiveLink(link.link) ? "text-zui-neon" : "text-zui-white"
                  }`}
                >
                  {link.name}
                </span>
              )}
            </Link>
          ),
        };
      }),
    }));
  };

  const gotoProfile = () => {
    router.push("/profile");
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchVisible(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMac]);

  return (
    <>
      <button
        className="absolute z-20 md:hidden top-6 left-6"
        onClick={setHamburgerVisible.bind(null, (prev) => !prev)}
      >
        <MuiIcons.Menu sx={{ fontSize: 24 }} />
      </button>
      <aside
        className={cn(
          "h-[100vh] flex-shrink-0 flex flex-col pl-3 md:pl-10 sticky left-0 top-0 transition-all duration-300 ease-out hide-scrollbar",
          isHamburgerMenuVisible
            ? "w-[100vw] md:w-[268px]"
            : "w-0 p-0 md:w-[268px]"
        )}
      >
        {hasZostelToken && isHamburgerMenuVisible && (
          <button
            className="flex items-center  gap-1 px-4 md:px-0 mt-16 md:mt-10 text-base text-zui-white"
            onClick={handleZostelAdmin}
            aria-label="Open Zostel Admin in new tab"
          >
            <span className="underline">Zostel Admin</span>
            <Icon name="NewTab" fill="#fff" className="w-3 h-3" />
          </button>
        )}

        <div
          role="button"
          onClick={setSearchVisible.bind(null, true)}
          id="search-button"
          className="hidden md:flex items-center gap-2 cursor-pointer w-fit pr-4 mt-6 hover:bg-zui-light/30 group py-2"
        >
          <MuiIcons.SearchOutlined />
          {isHamburgerMenuVisible && (
            <Flex vertical>
              <Typography.Text className="group-hover:text-zui-neon text-zui-white">
                Quick Search
              </Typography.Text>
              <Typography.Text type="secondary">
                {isMac ? "⌘ + K" : "Ctrl + K"}
              </Typography.Text>
            </Flex>
          )}
        </div>

        <div className="flex-grow overflow-y-auto mt-6">
          <Menu
            mode="inline"
            items={getMenuItems()}
            className="bg-transparent border-none navigation-menu"
            theme="dark"
            expandIcon={isHamburgerMenuVisible ? <DownOutlined /> : null}
            defaultOpenKeys={navigationLinks?.map((set: any) => set.id)}
          />
        </div>

        {profile && isHamburgerMenuVisible && (
          <div className="flex items-center my-6 flex-shrink-0 px-2 md:px-0">
            <div className="flex items-center gap-3 w-full">
              <Avatar
                src={profile?.pfp_image}
                alt={profile?.nickname || "Zo User"}
                size={32}
                badgeOffset={-4}
                className="flex-shrink-0"
                badgeSize={20}
                isFounder={profile?.membership === "founder"}
              />

              <div
                role="button"
                onClick={gotoProfile}
                className="flex flex-col flex-1"
              >
                <span className="text-base text-zui-white cursor-pointer hover:underline hover:text-zui-neon transition-all duration-200">
                  {profile?.nickname || "Zo User"}
                </span>
                <span className="text-xs text-zui-silver">Admin</span>
              </div>

              <Tooltip title="Logout" placement="top">
                <button
                  onClick={logout}
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-red-500/10 group transition-all duration-200"
                >
                  <MuiIcons.LogoutOutlined
                    sx={{
                      fontSize: 20,
                      color: "#ff4545",
                      transition: "color 0.2s ease"
                    }}
                    className="group-hover:text-red-400"
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </aside>
      <GlobalSearch
        isOpen={isSearchVisible}
        onClose={setSearchVisible.bind(null, false)}
      />
    </>
  );
};

export default Navigation;
