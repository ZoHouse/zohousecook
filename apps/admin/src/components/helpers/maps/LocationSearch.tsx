import Icon from "@zo/assets/icons";
import { useAuth, useQueryApi } from "@zo/auth";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { CSSTransition } from "react-transition-group";

type SearchItem = {
  name: string;
  location_type: string;
  slug: string;
};

interface LocationSearchProps {
  onClick?: (result: SearchItem) => void;
  className?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onClick,
  className,
}) => {
  const router = useRouter();
  const map = useMap();
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchFocussed, setSearchFocussed] = useState(false);

  const dropdownRef = useRef<HTMLElement>(null);

  const { data: zoLocations, isLoading } = useQueryApi<SearchItem[]>(
    "PLACES_LOCATIONS",
    {
      cacheTime: 0,
      keepPreviousData: false,
      enabled: false,
      select: (data) => data.data.results,
    },
    "",
    `search=${query}&fields=name,location_type,slug`
  );

  useEffect(() => {
    if (zoLocations) {
      setSearchResults(zoLocations);
    }
  }, [zoLocations]);

  const handleOnClick = (res: SearchItem) => {
    setQuery("");
    setSearchResults([]);
    if (onClick) {
      onClick(res);
    } else {
      router.push(
        `/${
          ["airport", "station", "subdistrict"].includes(res.location_type)
            ? `locations/${res.slug}/`
            : `maps/${res.slug}`
        }`
      );
    }
  };

  const handleFocus = () => {
    setSearchFocussed(true);
    map.scrollWheelZoom.disable();
  };

  const handleBlur = () => {
    setSearchFocussed(false);
    map.scrollWheelZoom.enable();
  };

  return (
    <div className="flex flex-col justify-center items-start relative mb-4">
      <section
        className={`flex flex-col w-full ${
          searchFocussed ? " shadow-md" : ""
        } `}
      >
        <div
          className={`bg-zui-light w-full flex items-center relative ${
            searchFocussed ? "border-zui-light" : ""
          } ${className}`}
        >
          <Icon
            className="flex-shrink-0 flex-grow-0 text-text text-2xl ml-4"
            name="Search"
            fill="#fff"
            size={24}
          />
          <input
            className="flex-grow p-4 focus:outline-none rounded-b-none text-zui-white bg-transparent text-text  font-medium"
            type="text"
            placeholder={"Search locations."}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value || "")}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </section>

      <CSSTransition
        in={searchFocussed}
        mountOnEnter
        unmountOnExit
        classNames="fade-dropdown"
        timeout={300}
        nodeRef={dropdownRef}
      >
        <section
          className="flex flex-col w-full absolute top-full overflow-auto bg-zui-dark z-50 shadow-md"
          style={{ maxHeight: "60vh" }}
          ref={dropdownRef}
        >
          <ul>
            {!isLoading ? (
              searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <li
                    key={result.slug}
                    onMouseDown={() => {
                      handleOnClick(result);
                    }}
                    className="flex flex-col justify-between text-text p-2 m-2 hover:bg-zui-silver font-medium cursor-pointer bg-zui-dark"
                  >
                    <span className="text-zui-silver text-md font-semibold break-words">
                      {result.name}
                    </span>
                    <span className="flex justify-between items-baseline text-subtitle">
                      <span className="capitalize font-bold">
                        {result.location_type}
                      </span>
                      <span>
                        Open in{" "}
                        {["airport", "station", "subdistrict"].includes(
                          result.location_type
                        )
                          ? "database"
                          : "map"}
                        .
                      </span>
                    </span>
                  </li>
                ))
              ) : (
                query.length > 0 && (
                  <li className="p-4 font-medium text-sm text-zui-white">
                    No Results.
                  </li>
                )
              )
            ) : (
              <li className="p-4 font-medium text-sm text-zui-white">
                Fetching ...
              </li>
            )}
          </ul>
        </section>
      </CSSTransition>
    </div>
  );
};

export default LocationSearch;
