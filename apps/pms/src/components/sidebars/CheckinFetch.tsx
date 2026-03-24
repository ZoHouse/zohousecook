import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { CollapsibleSearch, SidebarMini, useInfiniteTable } from "@zo/moal";
import { GeneralObject } from "@zo/definitions/general";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { parsePhoneNumber } from "libphonenumber-js";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";

interface CheckinFetchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  booking: GeneralObject;
  onSuccessfulCheckin: (booking: GeneralObject) => void;
  checkinDateRange: string;
}

const CheckinFetchSidebar: React.FC<CheckinFetchSidebarProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccessfulCheckin,
  checkinDateRange,
}) => {
  const [data, setData] = useState<GeneralObject[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneralObject[]>([]);
  const [selectedCheckins, setSelectedCheckins] = useState<(string | number)[]>(
    []
  );

  const { mutateAsync: updateCheckin } = useMutationApi(
    "ADMIN_PM_CHECKIN",
    {},
    "",
    "PUT"
  );

  const handleSubmit = () => {
    setLoading(true);
    selectedCheckins.forEach(async (id) => {
      await updateCheckin({
        data: { booking_code: booking.code },
        route: `${id}/`,
      });
    });
    setLoading(false);
    onSuccessfulCheckin(booking);
    onClose();
  };

  const availableCheckins = useMemo(() => {
    const totalOccupancy = booking?.rooms?.reduce(
      (total: number, room: GeneralObject) =>
        total + room.occupancy * room.units,
      0
    );
    const occupied = booking?.checkins?.length || 0;
    return totalOccupancy - occupied;
  }, [booking]);

  const handleSelect = (id: string | number) => {
    if (selectedCheckins.includes(id)) {
      setSelectedCheckins((prev) => prev.filter((i) => i !== id));
    } else if (selectedCheckins.length < availableCheckins) {
      setSelectedCheckins((prev) => [...prev, id]);
    }
  };

  const { isLoading: isSearching, remove: removeSearchResults } = useQueryApi<
    GeneralObject[]
  >(
    "ADMIN_PM_CHECKIN_SEARCH",
    {
      enabled:
        isValidString(searchQuery.trim()) &&
        searchQuery.trim().length > 2 &&
        isOpen &&
        isValidObject(booking),
      onSuccess: (data) => {
        setSearchResults(data.data || []);
      },
    },
    "",
    `&q=${searchQuery}&${checkinDateRange}&null_bookings=1&operator=${booking?.operator?.code}`
  );

  const { isLoading: isFetching, refetch } = useInfiniteTable({
    setter: setData,
    enabled: isOpen && isValidObject(booking),
    queryEndpoint: "ADMIN_PM_CHECKIN",
    customSearchQuery: `&${checkinDateRange}&null_bookings=1&operator=${booking?.operator?.code}`,
    name: "arriving",
  });

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      removeSearchResults();
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      refetch();
    } else {
      setSelectedCheckins([]);
    }
  }, [isOpen, refetch]);

  return (
    <SidebarMini
      headerOptions={{
        title: "Select guests to add to check-ins",
        hasCloseButton: true,
        subtitle: `Can select max ${availableCheckins}`,
      }}
      footerOptions={
        selectedCheckins.length > 0
          ? {
              actionButtons: [
                {
                  label: "Add to booking",
                  onClick: handleSubmit,
                  disabled: isLoading,
                },
              ],
            }
          : undefined
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex justify-end mb-6">
        <CollapsibleSearch
          isExpanded={true}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      {isSearching || isFetching ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-10 h-10" />
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-1 mb-[120px]">
          {(searchQuery.trim().length > 2 ? searchResults : data).length > 0 ? (
            (searchQuery.trim().length > 2 ? searchResults : data).map(
              (checkin) => (
                <button
                  key={checkin.id}
                  onClick={handleSelect.bind(null, checkin.id)}
                  className="flex items-start gap-3 p-4 bg-zui-light"
                >
                  <div className="flex flex-col items-start flex-1 gap-1">
                    <span>
                      {checkin.profile.first_name}{" "}
                      {checkin.profile.last_name || ""}
                    </span>
                    <span className="text-sm text-zui-silver">
                      {parsePhoneNumber(
                        `+${checkin.profile.mobile}`
                      ).formatInternational()}
                    </span>
                    <span className="text-xs text-zui-silver">
                      {moment(checkin.arrival_on).format("DD MMM")} →{" "}
                      {moment(checkin.departure_on).format("DD MMM")}
                    </span>
                  </div>
                  <div className="p-2">
                    {selectedCheckins.includes(checkin.id) ? (
                      <Icon name="CheckboxChecked" size={24} fill="#CFFF50" />
                    ) : (
                      <Icon name="CheckBox" size={24} fill="#FFF" />
                    )}
                  </div>
                </button>
              )
            )
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-zui-silver">No result found</p>
            </div>
          )}
        </div>
      )}
    </SidebarMini>
  );
};

export default CheckinFetchSidebar;
