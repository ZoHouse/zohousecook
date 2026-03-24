/* eslint-disable @typescript-eslint/no-explicit-any */

import { Zo } from "@zo/assets/brands";
import Icon, { IconName } from "@zo/assets/icons";
import { useZostelAuth } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { useOutsideClick } from "@zo/utils/hooks";
import { isClient } from "@zo/utils/next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import { Avatar } from "../ui";

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

  const [isHamburgerMenuVisible, setHamburgerVisible] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isMobile = isClient ? window?.innerWidth < 768 : false;

  const isActiveLink = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  const handleOpenMenu: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setShowMenu((prev) => !prev);
  };

  const handleZostelClick = () => {
    const zostelToken = localStorage.getItem("zostel-token");
    const zostelTokenExpiry = localStorage.getItem("zostel-token-expiry");
    const userRoles = user?.roles ? `[${user.roles}]` : "";

    // Determine the base URL based on the environment
    const baseUrl = process.env.ZOSTEL_ADMIN_URL;
    window.open(
      `${baseUrl}/?token=${zostelToken}&roles=${userRoles}&expiry=${zostelTokenExpiry}`,
      "_blank"
    );
  };

  useOutsideClick(menuRef, () => setShowMenu(false));

  const hasZostelToken = isClient && localStorage.getItem("zostel-token");

  return (
    <>
      <button
        className="absolute z-20 md:hidden top-6 left-6 "
        onClick={setHamburgerVisible.bind(null, (prev) => !prev)}
      >
        <Icon name="Hamburger" size={24} />
      </button>
      <aside
        className={cn(
          "h-[100vh] flex-shrink-0 flex flex-col pl-3 md:pl-10  sticky left-0 top-0 transition-all duration-300 ease-out hide-scrollbar",
          isHamburgerMenuVisible
            ? "w-[100vw] md:w-[268px]"
            : "w-0 p-0 md:w-[108px]"
        )}
      >
        <div className="flex items-center mt-10 gap-3 pb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-x-2">
              <button
                className="hidden md:block"
                onClick={setHamburgerVisible.bind(null, (prev) => !prev)}
              >
                <Icon name="Hamburger" size={24} />
              </button>
              <Zo
                className="hidden md:block w-6 h-6 flex-shrink-0"
                fill="#FFF"
              />
            </div>
            {hasZostelToken && (
              <button
                onClick={handleZostelClick}
                className="flex  items-center justify-center bg-zui-light p-2"
              >
                <p className="text-xs">Zostel Admin</p>
              </button>
            )}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {navigationLinks?.map((set: any) => (
            <ul key={set.id} className="mt-10 px-3 md:px-0">
              {set.title && isHamburgerMenuVisible && (
                <li className="text-base font-semibold mb-2 text-zui-silver">
                  {set.title}
                </li>
              )}
              {set.list.map((link: any) => (
                <li className="w-fit" key={link.id}>
                  <Link
                    onClick={() => {
                      if (isMobile) {
                        setHamburgerVisible(false);
                      }
                    }}
                    href={link.link}
                    className="flex items-center h-12 space-x-3"
                  >
                    <Icon
                      name={link.iconName as IconName}
                      size={24}
                      fill={isActiveLink(link.link) ? "#CFFF50" : "#5A5A5A"}
                    />
                    {isHamburgerMenuVisible && (
                      <span
                        className={`text-sm whitespace-nowrap ${
                          isActiveLink(link.link)
                            ? "text-zui-neon"
                            : "text-zui-white"
                        }`}
                      >
                        {link.name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
        {profile && isHamburgerMenuVisible && (
          <div className="flex items-center justify-between my-6 flex-shrink-0 px-2 md:px-0">
            <div
              className={cn("flex flex-1 items-center gap-3 justify-between")}
            >
              <Avatar
                src={profile?.pfp_image}
                alt={profile?.nickname || "Zo User"}
                size={32}
                badgeOffset={-4}
                className="flex-shrink-0"
                badgeSize={20}
                isFounder={profile?.membership === "founder"}
              />

              <div className={cn("flex justify-betwen relative flex-1")}>
                <div className="flex flex-col flex-1">
                  <span className="text-base text-zui-white">
                    {profile?.nickname || "Zo User"}
                  </span>
                  <span className="text-xs text-zui-silver">Admin</span>
                </div>
                <button onClick={handleOpenMenu}>
                  <Icon fill="#fff" name="More" size={"24"} />
                </button>
                <div
                  ref={menuRef}
                  className={cn(
                    "absolute -top-14 right-2",
                    showMenu ? "visible" : "hidden"
                  )}
                >
                  <button
                    onClick={logout}
                    className="bg-zui-light text-sm px-10 py-4 hover:text-zui-neon"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Navigation;
