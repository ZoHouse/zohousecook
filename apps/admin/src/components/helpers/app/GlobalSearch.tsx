import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import EventNoteOutlined from "@mui/icons-material/EventNoteOutlined";
import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlined from "@mui/icons-material/KeyboardArrowUpOutlined";
import KeyboardReturnOutlined from "@mui/icons-material/KeyboardReturnOutlined";
import KeyboardTabOutlined from "@mui/icons-material/KeyboardTabOutlined";
import MapOutlined from "@mui/icons-material/MapOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import BookOutlined from "@mui/icons-material/BookOutlined";
import { useQueryApi, QueryEndpoints } from "@zo/auth";
import { isValidEmail, isValidString } from "@zo/utils/string";
import {
  Empty,
  Flex,
  Input,
  InputRef,
  Modal,
  Spin,
  Tabs,
  Typography,
  App,
  Select,
  Tag,
  Button,
  Tooltip,
} from "antd";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { navigationLinks, CASUserResponse } from "../../../config";
import { debounce } from "lodash";
import moment from "moment";

const { Option } = Select;
interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  name: string;
  link: string;
  iconName: any;
  category?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: "operator" | "activity" | "navigation" | "trip" | "user" | "bookings";
  link?: string;
  category?: string;
  iconName?: any;
  status?: string;
}

type TabType =
  | "operators"
  | "trip"
  | "activity"
  | "navigation"
  | "users"
  | "bookings";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

const tabs = [
  { value: "navigation" as TabType, label: "Navigation", icon: <ExploreOutlined /> },
  { value: "operators" as TabType, label: "Stay", icon: <BusinessOutlined /> },
  { value: "trip" as TabType, label: "Trips", icon: <MapOutlined /> },
  { value: "activity" as TabType, label: "Events", icon: <EventNoteOutlined /> },
  { value: "users" as TabType, label: "Users", icon: <PersonOutlined /> },
  { value: "bookings" as TabType, label: "Bookings", icon: <BookOutlined /> },
];

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const message = App.useApp().message;

  const [selectedTab, setSelectedTab] = useState<TabType>("navigation");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedBookingType, setSelectedBookingType] =
    useState<string>("stay");

  const searchInputRef = useRef<InputRef>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search term updates to prevent excessive API calls
  const debouncedSetSearchTerm = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
      setIsSearching(!!term);
    }, 300),
    []
  );

  // Update debounced search term when searchTerm changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
    return () => debouncedSetSearchTerm.cancel();
  }, [searchTerm, debouncedSetSearchTerm]);

  const { data: inventories, isLoading: isLoadingInventories } = useQueryApi<
    Array<{ id: string; name: string }>
  >(
    "CAS_INVENTORY",
    {
      enabled:
        isValidString(debouncedSearchTerm) &&
        (selectedTab === "trip" || selectedTab === "activity"),
      select(data) {
        return data?.data?.results || [];
      },
      refetchOnWindowFocus: false,
      onError: () => {
        message.error(`Failed to fetch ${selectedTab} data`);
      },
      retry: 1,
    },
    "",
    `search=${debouncedSearchTerm}&type=${selectedTab}&fields=id,name`
  );

  const { data: operators, isLoading: isLoadingOperators } = useQueryApi<
    Array<{ id: string; name: string }>
  >(
    "CAS_OPERATORS",
    {
      enabled:
        isValidString(debouncedSearchTerm) && selectedTab === "operators",
      select(data) {
        return data?.data?.results || [];
      },
      refetchOnWindowFocus: false,
      onError: () => {
        message.error("Failed to fetch operators data");
      },
      retry: 1,
    },
    "",
    `search=${debouncedSearchTerm}&fields=id,name`
  );

  const { data: users, isLoading: isLoadingUsers } = useQueryApi<
    Array<{ id: string; name: string }>
  >(
    "CAS_USERS",
    {
      enabled: isValidString(debouncedSearchTerm) && selectedTab === "users",
      select(data) {
        return (
          data?.data?.results?.map((user: CASUserResponse) => {
            const nickname = user.profile.nickname || null;
            const email =
              user.emails?.filter((email) =>
                isValidEmail(email.email_address)
              )?.[0]?.email_address || null;
            const mobile =
              user.mobiles?.filter((mobile) =>
                isValidString(mobile.mobile_number)
              )?.[0]?.mobile_number || null;
            return {
              id: user.id,
              name: nickname || email || mobile || "Zo User",
            };
          }) || []
        );
      },
      refetchOnWindowFocus: false,
      onError: () => {
        message.error("Failed to fetch users data");
      },
      retry: 1,
    },
    "",
    `search=${debouncedSearchTerm}&fields=id,profile,emails,mobiles`
  );

  const getBookingEndPoint = useCallback(
    (bookingType: string): QueryEndpoints => {
      switch (bookingType) {
        case "stay":
          return "CAS_STAY_BOOKINGS";
        case "trip":
          return "CAS_TRIP_BOOKINGS";
        case "utility":
          return "CAS_UTILITY_BOOKINGS";
        default:
          return "CAS_STAY_BOOKINGS";
      }
    },
    []
  );

  const { data: bookings, isLoading: isLoadingBookings } = useQueryApi<
    Array<{ id: string; name: string; status: string; inventory: string }>
  >(
    getBookingEndPoint(selectedBookingType),
    {
      enabled: isValidString(debouncedSearchTerm) && selectedTab === "bookings",
      select(data) {
        return (
          data?.data?.results?.map((booking: any) => {
            const name = `${
              booking.user.nickname ||
              booking.user.first_name ||
              booking.user.email_address ||
              booking.user.mobile_number ||
              booking.user.twitter_handle ||
              "Zo User"
            } (${moment(booking.start_at).format("MMM Do YY")} to ${moment(
              booking.end_at
            ).format("MMM Do YY")})`;
            const inventory = booking.booked_skus?.[0]?.sku.inventory.id || "";
            return {
              id: booking.id,
              name: name,
              inventory: inventory,
              status: booking.status,
            };
          }) || []
        );
      },
      refetchOnWindowFocus: false,
      onError: () => {
        message.error("Failed to fetch operators data");
      },
      retry: 1,
    },
    "",
    `search=${debouncedSearchTerm}`
  );

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (savedSearches) {
          const parsed = JSON.parse(savedSearches);
          // Validate the structure of saved searches
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed);
          } else {
            throw new Error("Invalid format for recent searches");
          }
        }
      } catch (error) {
        console.error("Failed to load recent searches", error);
        // Reset corrupted storage
        localStorage.removeItem(RECENT_SEARCHES_KEY);
        setRecentSearches([]);
      }
    }
  }, [isOpen]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback(
    (result: SearchResult) => {
      if (!result.id || !result.name || !result.type) return;

      try {
        const updatedSearches = [
          result,
          ...recentSearches.filter(
            (item) => !(item.id === result.id && item.type === result.type)
          ),
        ].slice(0, MAX_RECENT_SEARCHES);

        setRecentSearches(updatedSearches);
        localStorage.setItem(
          RECENT_SEARCHES_KEY,
          JSON.stringify(updatedSearches)
        );
      } catch (error) {
        console.error("Failed to save recent search", error);
      }
    },
    [recentSearches]
  );

  // Process navigation items
  const filteredNavItems = useMemo(() => {
    if (!isValidString(debouncedSearchTerm) || selectedTab !== "navigation")
      return [];

    if (!navigationLinks || !Array.isArray(navigationLinks)) {
      return [];
    }

    return navigationLinks
      ?.flatMap((set: any) => {
        if (!set?.list || !Array.isArray(set.list)) return [];

        return set.list
          .filter(
            (item: any) =>
              item?.name
                ?.toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase()) &&
              item?.link !== router.pathname
          )
          .map((item: NavItem) => ({
            ...item,
            category: set.title,
          }));
      })
      .reduce((unique: NavItem[], item: NavItem) => {
        if (!item?.link) return unique;

        const exists = unique.find((u) => u.link === item.link);
        if (!exists) {
          unique.push(item);
        }
        return unique;
      }, []);
  }, [debouncedSearchTerm, selectedTab, router.pathname]);

  const getBookingInfoUrl = useCallback(
    (bookingType: string, bookingId: string, inventoryId: string) => {
      switch (bookingType) {
        case "stay":
          return `/bookings/stay/${bookingId}`;
        case "trip":
          return `/trips/${inventoryId}/bookings/${bookingId}?tripId=${inventoryId}&openBookingDetails=true`;
        case "utility":
          return `/bookings/utility/${bookingId}`;
        default:
          return `/bookings/stay/${bookingId}`;
      }
    },
    []
  );

  // Update results when data changes
  useEffect(() => {
    let newResults: SearchResult[] = [];

    if (selectedTab === "navigation") {
      newResults = filteredNavItems.map((item: NavItem) => ({
        id: item.id,
        name: item.name,
        type: "navigation",
        link: item.link,
        category: item.category,
        iconName: item.iconName,
      }));
    } else if (selectedTab === "operators" && operators) {
      newResults = operators.map((op) => ({
        id: op.id,
        name: op.name,
        type: "operator",
        link: `/houses/${op.id}/edit`,
      }));
    } else if (selectedTab === "trip" && inventories) {
      newResults = inventories.map((op) => ({
        id: op.id,
        name: op.name,
        type: "trip",
        link: `/trips/${op.id}`,
      }));
    } else if (selectedTab === "activity" && inventories) {
      newResults = inventories.map((op) => ({
        id: op.id,
        name: op.name,
        type: "activity",
        link: `/events/${op.id}/edit`,
      }));
    } else if (selectedTab === "users" && users) {
      newResults = users.map((user) => ({
        id: user.id,
        name: user.name,
        type: "user",
        link: `/users/${user.id}`,
      }));
    } else if (selectedTab === "bookings" && bookings) {
      newResults = bookings.map((booking) => ({
        id: booking.id,
        name: booking.name,
        type: "bookings",
        link: getBookingInfoUrl(
          selectedBookingType,
          booking.id,
          booking.inventory
        ),
        status: booking.status,
      }));
    }

    setResults(newResults);
    setSelectedIndex(newResults.length > 0 ? 0 : -1);
    setIsSearching(false);
  }, [filteredNavItems, operators, inventories, users, selectedTab, bookings]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setSearchTerm("");
          setSelectedIndex(-1);
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts globally when modal is open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedIndex(-1);
    setIsSearching(false);
    onClose();
  };

  const handleItemClick = useCallback(
    (result: SearchResult) => {
      if (!result.link) {
        message.error("Invalid link for this item");
        return;
      }

      saveRecentSearch(result);
      router.push(result.link);
      handleClose();
    },
    [router, saveRecentSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const itemsToNavigate =
        results.length > 0
          ? results
          : !isValidString(searchTerm) && recentSearches.length > 0
          ? recentSearches
          : [];

      if (!itemsToNavigate.length && e.key !== "Tab" && e.key !== "Escape")
        return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < itemsToNavigate.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : itemsToNavigate.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && itemsToNavigate[selectedIndex]) {
            handleItemClick(itemsToNavigate[selectedIndex]);
          }
          break;
        case "Tab":
          e.preventDefault();
          const currentTabIndex = tabs.findIndex(
            (tab) => tab.value === selectedTab
          );
          const nextTabIndex = e.shiftKey
            ? (currentTabIndex - 1 + tabs.length) % tabs.length
            : (currentTabIndex + 1) % tabs.length;
          setSelectedTab(tabs[nextTabIndex].value);
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    },
    [
      results,
      searchTerm,
      recentSearches,
      selectedTab,
      selectedIndex,
      handleItemClick,
    ]
  );

  const getIconForType = useCallback((type: string, iconName?: any) => {
    if (type === "navigation" && iconName) {
      try {
        // Make sure iconName is a valid component before trying to create an element
        if (typeof iconName === "function" || typeof iconName === "string") {
          return React.createElement(iconName, {
            style: { fontSize: 20 },
          });
        }
      } catch (error) {
        console.error("Error rendering icon:", error);
      }
      // Fallback if iconName is not a valid component
      return <SearchOutlined style={{ fontSize: 20 }} />;
    }

    switch (type) {
      case "operator":
        return <BusinessOutlined style={{ fontSize: 20 }} />;
      case "trip":
        return <MapOutlined style={{ fontSize: 20 }} />;
      case "activity":
        return <EventNoteOutlined style={{ fontSize: 20 }} />;
      case "user":
        return <PersonOutlined style={{ fontSize: 20 }} />;
      default:
        return <SearchOutlined style={{ fontSize: 20 }} />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    status = status.toLowerCase();
    switch (status) {
      case "pending":
        return "blue";
      case "confirmed":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  }, []);

  const renderResultItem = useCallback(
    (result: SearchResult, index: number) => {
      const isSelected = index === selectedIndex;

      return (
        <div
          key={`${result.type}-${result.id}`}
          onClick={() => handleItemClick(result)}
          className={`p-3 hover:bg-zui-lighter cursor-pointer rounded-md transition-all duration-150 ${
            isSelected ? "bg-zui-lighter shadow-sm" : ""
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleItemClick(result);
            }
          }}
          aria-selected={isSelected}
        >
          <Flex vertical gap="small">
            <Flex align="center" gap="small">
              {getIconForType(result.type, result.iconName)}
              <span className="font-medium">{result.name}</span>
              {result.status && (
                <Tag color={getStatusColor(result.status)}>{result.status}</Tag>
              )}
            </Flex>
            <Typography.Text type="secondary" className="text-xs ml-7">
              {result.category ||
                result.type.charAt(0).toUpperCase() + result.type.slice(1)}{" "}
              • {result.link}
            </Typography.Text>
          </Flex>
        </div>
      );
    },
    [selectedIndex, handleItemClick, getIconForType]
  );

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const isLoading =
    isLoadingOperators ||
    isLoadingInventories ||
    isLoadingUsers ||
    isLoadingBookings ||
    isSearching;

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <Spin size="large" />
          <div className="mt-2 text-zui-silver">Searching...</div>
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div
          className="max-h-[400px] overflow-y-auto space-y-1 p-1"
          ref={resultsContainerRef}
          role="listbox"
        >
          {results.map((result, index) => renderResultItem(result, index))}
        </div>
      );
    }

    if (isValidString(searchTerm)) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-zui-silver">
              No results found for "{searchTerm}" in {selectedTab}
            </span>
          }
          className="py-8"
        />
      );
    }

    if (recentSearches.length > 0) {
      return (
        <div>
          <Flex
            justify="space-between"
            align="center"
            className="text-sm text-zui-silver mb-2 font-medium"
          >
            <span>Recent searches</span>
            <Tooltip title="Clear recent searches">
              <Button type="link" onClick={handleClearRecentSearches}>
                Clear
              </Button>
            </Tooltip>
          </Flex>
          <div
            className="max-h-[400px] overflow-y-auto space-y-1 p-1"
            ref={resultsContainerRef}
            role="listbox"
          >
            {recentSearches.map((result, index) =>
              renderResultItem(result, index)
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-zui-silver">
        Start typing to search {selectedTab}
      </div>
    );
  }, [
    isLoading,
    results,
    searchTerm,
    recentSearches,
    selectedTab,
    renderResultItem,
  ]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small">
          <SearchOutlined style={{ fontSize: 20 }} />
          <span>Quick Search</span>
        </Flex>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      className="search-modal"
      width={720}
      maskClosable={true}
      closeIcon={true}
      zIndex={1200}
      destroyOnClose={true}
    >
      <Flex vertical gap="middle">
        <Input
          placeholder={`Search ${selectedTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          prefix={<SearchOutlined />}
          ref={searchInputRef}
          size="large"
          className="mt-2"
          autoFocus
          allowClear
          aria-label={`Search ${selectedTab}`}
          addonAfter={
            selectedTab === "bookings" && (
              <Select
                defaultValue="stay"
                onChange={(value) => setSelectedBookingType(value)}
                className="w-36"
              >
                <Option value="stay">Stay</Option>
                <Option value="trip">Trips</Option>
                <Option value="utility">Utility</Option>
              </Select>
            )
          }
        />

        <Tabs
          activeKey={selectedTab}
          onChange={(key) => {
            setSelectedTab(key as TabType);
            setSelectedIndex(-1);
            setResults([]);
          }}
          items={tabs.map((tab) => ({
            key: tab.value,
            label: (
              <Flex align="center" gap="small">
                {tab.icon}
                <span>{tab.label}</span>
              </Flex>
            ),
          }))}
        />

        {renderContent()}

        <div className="text-xs text-zui-silver mt-2 p-2 pb-0 flex justify-between">
          <div>
            <span className="mr-4 inline-flex items-center">
              <KeyboardArrowUpOutlined fontSize="small" className="mr-1" />
              <KeyboardArrowDownOutlined fontSize="small" className="mr-1" />
              Navigate
            </span>
            <span className="mr-4 inline-flex items-center">
              <KeyboardReturnOutlined fontSize="small" className="mr-1" />
              Select
            </span>
          </div>
          <div>
            <span className="inline-flex items-center">
              <KeyboardTabOutlined fontSize="small" className="mr-1" />
              Switch tabs
            </span>
          </div>
        </div>
      </Flex>
    </Modal>
  );
};

export default GlobalSearch;
