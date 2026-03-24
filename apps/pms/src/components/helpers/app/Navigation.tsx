import Icon, { IconName } from "@zo/assets/icons";
import { useAuth, useProfile } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Avatar } from "@zo/moal";
import { cn, fontClassName } from "@zo/utils/font";
import { useOutsideClick } from "@zo/utils/hooks";
import { isClient } from "@zo/utils/next";
import { Dropdown, MenuProps, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { navigationLinks, ZO_FEATURES, isFeatureVisible } from "../../../configs";
import type { ZoFeature } from "../../../configs";
import { useAssociation } from "../../../hooks";
import { GlobalSearch } from "../../ui";

interface Navigation {}

const Navigation: React.FC<Navigation> = () => {
  const router = useRouter();
  const {
    selectedOperator,
    associatedOperators,
    setSelectedOperator,
    hasAccess,
    effectiveRole,
  } = useAssociation();
  const { logout } = useAuth();
  const { profile } = useProfile();

  const isMac = isClient
    ? navigator.userAgent.toUpperCase().indexOf("MAC") >= 0
    : false;

  const isMobile = isClient ? window?.innerWidth < 768 : false;

  const [isHamburgerMenuVisible, setHamburgerVisible] = useState<boolean>(
    isMobile ? false : true
  );
  const [isSearchVisible, setSearchVisible] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState<string>("");
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures((prev) => ({ ...prev, [featureId]: !prev[featureId] }));
  };

  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const isActiveLink = (href: string) => {
    if (href === "/" || href === "/cafe") return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  const handleOpenMenu: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setShowMenu((prev) => !prev);
  };

  const handleOperatorPress = (operator: GeneralObject) => {
    setSelectedOperator(operator);
    setPropertySearchQuery(""); // Reset search on selection
  };

  // Sort operators alphabetically by name
  const sortedOperators = [...associatedOperators].sort((a, b) => {
    const nameA = a?.name || "";
    const nameB = b?.name || "";
    return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
  });

  // Filter operators based on search query
  const filteredOperators = sortedOperators.filter((operator) => {
    if (!propertySearchQuery) return true;
    const name = (operator?.name || "").toLowerCase();
    return name.includes(propertySearchQuery.toLowerCase());
  });

  const items: MenuProps["items"] = [
    // Search input as first item
    {
      key: "search",
      label: (
        <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <Input
            placeholder="Search property..."
            value={propertySearchQuery}
            onChange={(e) => setPropertySearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="bg-transparent border-zui-light"
            prefix={<Icon name="Search" size={16} fill="#5a5a5a" />}
            allowClear
          />
        </div>
      ),
      disabled: true,
    },
    // Filtered operator items
    ...filteredOperators.map((operator: GeneralObject) => ({
      label: (
        <span className={cn(fontClassName, "text-base")}>{operator?.name}</span>
      ),
      key: operator?.id,
      icon: <Icon name="ZoHotel" fill="#5a5a5a" size={24} />,
      onClick: () => handleOperatorPress(operator),
    })),
  ];

  useOutsideClick(menuRef, () => setShowMenu(false));

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (hasAccess("property-manager")) {
          setSearchVisible(true);
        }
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasAccess, isMac]);

  useEffect(() => {
    if (effectiveRole === "none" || effectiveRole === null) return;

    type AccessRole = "activity-manager" | "property-manager" | "admin";

    // Helper: find the first accessible link
    const findFirstAccessibleLink = () => {
      for (const set of navigationLinks as GeneralObject[]) {
        for (const link of set.list as GeneralObject[]) {
          if (hasAccess(link.minAccess as string as AccessRole)) {
            return link as GeneralObject;
          }
        }
      }
      return null;
    };

    // Zo House feature routes are handled by ZoHouseGuard — skip access check
    if (router.pathname.startsWith("/cafe") || router.pathname.startsWith("/housekeeping") || router.pathname.startsWith("/iot")) {
      return;
    }

    // If on root path, redirect to first accessible link
    if (router.pathname === "/") {
      const first = findFirstAccessibleLink();
      if (first && router.pathname !== (first.link as string)) {
        router.replace(first.link as string);
      }
      return;
    }

    // Determine if the current route is accessible per navigationLinks.json
    let currentPathMinAccess: string | null = null;
    outer: for (const set of navigationLinks as GeneralObject[]) {
      for (const link of set.list as GeneralObject[]) {
        const href = link.link as string;
        const matches = router.pathname.startsWith(href);
        if (matches) {
          currentPathMinAccess = link.minAccess as string;
          break outer;
        }
      }
    }

    const isCurrentPathAccessible = currentPathMinAccess
      ? hasAccess(currentPathMinAccess as string as AccessRole)
      : true; // Routes not listed are considered accessible by default

    if (!isCurrentPathAccessible) {
      const first = findFirstAccessibleLink();
      if (first && router.pathname !== (first.link as string)) {
        router.replace(first.link as string);
      }
    }
  }, [effectiveRole, hasAccess, router, router.pathname, selectedOperator]);

  return (
    <>
      <button
        className="fixed z-20 md:hidden top-5 right-5 bg-zui-light p-2"
        onClick={setHamburgerVisible.bind(null, (prev) => !prev)}
      >
        <Icon name="Hamburger" size={24} />
      </button>
      <aside
        className={cn(
          "h-[100vh] flex-shrink-0 flex flex-col md:pl-10 bg-zui-lighter md:bg-zui-dark sticky left-0 top-0 transition-all duration-300 ease-out hide-scrollbar",
          isHamburgerMenuVisible
            ? "w-[100vw] pl-6 md:w-[300px]"
            : "w-0 md:w-[108px]"
        )}
      >
        <div className="flex items-center mt-6 md:mt-10 gap-3 pb-2">
          <div
            className="flex relative items-start gap-x-2 h-10"
            ref={headerRef}
          >
            <button
              className="hidden md:block flex-shrink-0 relative top-1"
              onClick={setHamburgerVisible.bind(null, (prev) => !prev)}
            >
              <Icon name="Hamburger" size={24} />
            </button>

            {isHamburgerMenuVisible && (
              <div className="flex-1">
                <Dropdown
                  menu={{ items }}
                  trigger={["click"]}
                  disabled={associatedOperators.length < 2}
                  onOpenChange={(open) => {
                    if (!open) {
                      setPropertySearchQuery(""); // Reset search when dropdown closes
                    }
                  }}
                >
                  <div className="flex items-start gap-2 cursor-pointer">
                    <Icon name="ZoHotel" fill="#fff" size={32} />
                    <p className="text-lg text-left overflow-ellipsis overflow-hidden w-40 flex-1 font-semibold whitespace-nowrap relative top-1">
                      {selectedOperator?.name}
                    </p>
                    {associatedOperators.length > 1 && (
                      <div className="flex-shrink-0 relative top-1.5">
                        <Icon name="ArrowUpDown" size={24} fill="#FFF" />
                      </div>
                    )}
                  </div>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
        {hasAccess("property-manager") && (
          <button
            className={cn(
              "flex items-center gap-4 h-12 mt-10 px-4 border-zui-light border transition-all ease-in-out duration-200",
              isHamburgerMenuVisible
                ? "w-full"
                : "w-12 transform -translate-x-3",
              isHamburgerMenuVisible
                ? isMobile && "w-[calc(100%-24px)]"
                : isMobile && "hidden"
            )}
            onClick={setSearchVisible.bind(null, true)}
          >
            <Icon
              name="Search"
              size={16}
              fill="#5a5a5a"
              className="flex-shrink-0"
            />
            {isHamburgerMenuVisible && (
              <span className="text-sm text-zui-silver whitespace-nowrap overflow-hidden">
                Quick Search [{isMac ? "CMD" : "CTRL"} + K]
              </span>
            )}
          </button>
        )}
        <div className="flex-grow overflow-y-auto">
          {navigationLinks?.map((set: GeneralObject) => {
            const filteredLinks = set.list.filter(
              (link: GeneralObject) =>
                hasAccess(link.minAccess) &&
                (link.requiredDataKey != null
                  ? selectedOperator?.data?.[link.requiredDataKey] != null
                  : true)
            );

            // Find where to inject Zo House features (after "activities" link)
            const activityIndex = filteredLinks.findIndex(
              (link: GeneralObject) => link.id === "activities"
            );
            const insertAfter = activityIndex >= 0 ? activityIndex : -1;

            // Get visible Zo House features for this operator
            const visibleFeatures = Object.values(ZO_FEATURES).filter(
              (feature: ZoFeature) =>
                isFeatureVisible(feature, selectedOperator?.code) &&
                hasAccess(feature.minAccess)
            );

            return (
              <ul key={set.id} className="mt-4 md:px-0">
                {set.title && isHamburgerMenuVisible && (
                  <li className="text-base font-semibold mb-2 text-zui-silver">
                    {set.title}
                  </li>
                )}
                {filteredLinks.map((link: GeneralObject, index: number) => (
                  <React.Fragment key={link.id}>
                    <li className="w-fit">
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
                    {/* Inject Zo House features after Activity Manager */}
                    {index === insertAfter &&
                      visibleFeatures.map((feature: ZoFeature) => {
                        const isAnySubLinkActive = feature.navLinks.some((nl) =>
                          isActiveLink(nl.path)
                        );
                        const isExpanded = isAnySubLinkActive || (expandedFeatures[feature.id] || false);
                        return (
                          <li key={feature.id} className="w-fit">
                            <button
                              onClick={() => toggleFeature(feature.id)}
                              className="flex items-center h-12 space-x-3 w-full"
                            >
                              <Icon
                                name={feature.icon}
                                size={24}
                                fill={isAnySubLinkActive ? "#CFFF50" : "#5A5A5A"}
                              />
                              {isHamburgerMenuVisible && (
                                <>
                                  <span
                                    className={`text-sm whitespace-nowrap flex-1 text-left ${
                                      isAnySubLinkActive
                                        ? "text-zui-neon"
                                        : "text-zui-white"
                                    }`}
                                  >
                                    {feature.label}
                                  </span>
                                  <Icon
                                    name={isExpanded ? "ArrowUp" : "ArrowDown"}
                                    size={16}
                                    fill="#5A5A5A"
                                  />
                                </>
                              )}
                            </button>
                            {isExpanded &&
                              isHamburgerMenuVisible &&
                              feature.navLinks.map((subLink) => (
                                <Link
                                  key={subLink.id}
                                  onClick={() => {
                                    if (isMobile) {
                                      setHamburgerVisible(false);
                                    }
                                  }}
                                  href={subLink.path}
                                  className="flex items-center h-10 space-x-3 pl-9"
                                >
                                  <Icon
                                    name={subLink.icon}
                                    size={18}
                                    fill={
                                      isActiveLink(subLink.path)
                                        ? "#CFFF50"
                                        : "#5A5A5A"
                                    }
                                  />
                                  <span
                                    className={`text-sm whitespace-nowrap ${
                                      isActiveLink(subLink.path)
                                        ? "text-zui-neon"
                                        : "text-zui-white"
                                    }`}
                                  >
                                    {subLink.name}
                                  </span>
                                </Link>
                              ))}
                          </li>
                        );
                      })}
                  </React.Fragment>
                ))}
              </ul>
            );
          })}
        </div>
        {isHamburgerMenuVisible && profile && (
          <div className="flex items-center justify-between my-6 flex-shrink-0 pr-6 md:px-0">
            <div
              className={cn(
                "flex flex-1 items-center gap-3 justify-between h-10"
              )}
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

              {isHamburgerMenuVisible && profile && (
                <div className={cn("flex justify-betwen relative flex-1")}>
                  <div className="flex flex-col flex-1">
                    <span className="text-base text-zui-white">
                      {profile.nickname
                        ? profile.nickname.replace(".zo", "")
                        : profile.first_name || "Zo User"}
                    </span>
                    {effectiveRole != null && (
                      <span className="text-xs text-zui-silver capitalize">
                        {effectiveRole.replace(/-/g, " ")}
                      </span>
                    )}
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
              )}
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
