import * as turf from "@turf/turf";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { GeneralObject } from "@zo/definitions/general";
import { FormElement } from "@zo/moal";
import { useLocationCache } from "@zo/utils/hooks";
import { humanizeNumbers } from "@zo/utils/number";
import { isValidString } from "@zo/utils/string";
import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { Feature, FeatureCollection } from "geojson";
import L, {
  LatLngBoundsExpression,
  Layer,
  Icon as LeafletIcon,
  Map,
} from "leaflet";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { useQueryApi } from "@zo/auth";
import CustomControl from "./CustomControl";

interface MapProps {}

interface PropertyMarker {
  id: string;
  type: "zostel" | "zostelPlus" | "zostelHomes" | "zoHouse" | "zoTrips";
  position: [number, number];
  name: string;
}

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const DUMMY_PROPERTIES: PropertyMarker[] = [
  // Zostel properties
  {
    id: "z1",
    type: "zostel",
    position: [28.6139, 77.209],
    name: "Zostel Delhi",
  },
  {
    id: "z2",
    type: "zostel",
    position: [19.076, 72.8777],
    name: "Zostel Mumbai",
  },
  {
    id: "z3",
    type: "zostel",
    position: [12.9716, 77.5946],
    name: "Zostel Bangalore",
  },

  // Zostel Plus properties
  {
    id: "zp1",
    type: "zostelPlus",
    position: [26.9124, 75.7873],
    name: "Zostel Plus Jaipur",
  },
  {
    id: "zp2",
    type: "zostelPlus",
    position: [15.4989, 73.8278],
    name: "Zostel Plus Goa",
  },

  // Zostel Homes properties
  {
    id: "zh1",
    type: "zostelHomes",
    position: [32.2396, 77.1887],
    name: "Zostel Homes Manali",
  },
  {
    id: "zh2",
    type: "zostelHomes",
    position: [30.7333, 79.0667],
    name: "Zostel Homes Rishikesh",
  },

  // Zo House Trip properties
  {
    id: "zht1",
    type: "zoHouse",
    position: [34.1526, 77.5771],
    name: "Zo House Trip Leh",
  },
  {
    id: "zht2",
    type: "zoHouse",
    position: [27.1767, 78.0081],
    name: "Zo House Trip Agra",
  },
];

const ZoMap: React.FC<MapProps> = () => {
  const router = useRouter();
  const mapRef = useRef<Map>(null);

  const { locationFromCache, loading, clearCache } = useLocationCache();
  const [country, setCountry] = useState<string>("");
  const [isLowResolution, setIsLowResolution] = useState(true);

  const [locationHierarchy, setLocationHierarchy] =
    useState<GeneralObject | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string>("LL");
  const [locationType, setLocationType] = useState<string>("");

  const [editMapRegion, setEditMapRegion] = useState<Feature | null>(null);

  const [data, setData] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  const urlParams = useMemo(() => {
    if (!router.isReady) return [];
    return router.asPath.split("/").slice(1);
  }, [router.isReady, router.asPath]);

  const lastParam = useMemo(() => {
    if (urlParams.length === 0) return "";
    return urlParams[urlParams.length - 1];
  }, [urlParams]);

  const {
    data: zoLocations,
    isLoading,
    refetch,
    isRefetching,
  } = useQueryApi<FeatureCollection>(
    "CAS_LOCATIONS",
    {
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
      enabled: false,
      select: (data) => data.data,
    },
    `${locationType ? "" : `${country}/`}`,
    locationType
  );

  const {
    data: countries,
    isLoading: isLoadingCountries,
    refetch: refetchCountries,
    isRefetching: isRefetchingCountries,
  } = useQueryApi<FeatureCollection>(
    "CAS_LOCATIONS",
    {
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
      select: (data) =>
        data?.data?.map((d: any) => ({ id: d.id, name: d.name })),
    },
    "",
    "limit=-1&&location_type=LL&field=name,id"
  );

  const { data: zoLocationsId, isLoading: isLoadingId } =
    useQueryApi<GeneralObject>(
      "CAS_LOCATIONS",
      {
        refetchOnWindowFocus: false,
        enabled: isValidString(lastParam) && urlParams.length >= 2,
        select: (data) => data.data,
      },

      `${lastParam.split("_")[1]}/`,
      ``
    );

  const countryOptions = useMemo(() => {
    if (countries && Array.isArray(countries)) {
      return countries.map((country: { id: string; name: string }) => ({
        label: country.name,
        value: country.id,
      }));
    }
    return [];
  }, [countries]);

  const bounds = useMemo(() => {
    const allFeatures = [...data.features];
    if (allFeatures.length > 0) {
      const combinedData: FeatureCollection = {
        type: "FeatureCollection",
        features: allFeatures,
      };
      const _bbox = turf.bbox(combinedData);

      return [
        [_bbox[1], _bbox[0]],
        [_bbox[3], _bbox[2]],
      ];
    }
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      if (lastParam === "home" && lastParam !== undefined) {
        const locationData = locationFromCache("LL");
        if (locationData !== undefined) {
          setCurrentLevel(locationData.level);
          setData(locationData.data);
        } else {
          if (!country) {
            try {
              setLocationType("location_type=LL&limit=-1");
            } catch (error) {
              console.error("Error setting location type:", error);
            }
          } else {
            try {
              setLocationType("");
            } catch (error) {
              console.error("Error setting country:", error);
            }
          }
          setTimeout(async () => {
            try {
              const res = await refetch();
              locationFromCache("LL", res.data, "LL", isLowResolution);
            } catch (error) {
              console.error("Error refetching data:", error);
            }
          }, 1000);
        }
      }
    };

    fetchData();
  }, [refetch, lastParam, locationFromCache, country]);

  useEffect(() => {
    if (zoLocationsId && lastParam.length > 0 && lastParam !== undefined) {
      setCurrentLevel(zoLocationsId.location_type);
      if (zoLocationsId.location_type === "LL") {
        setLocationHierarchy(zoLocationsId.data?.hierarchy);
      }
    }
  }, [zoLocationsId, lastParam]);

  useEffect(() => {
    const fetchData = async () => {
      if (
        currentLevel !== "L1" &&
        currentLevel !== null &&
        lastParam !== undefined &&
        lastParam.length > 0
      ) {
        const locationData = locationFromCache(lastParam.split("_")[1]);
        if (locationData !== undefined) {
          setCurrentLevel(locationData.level);
          setData(locationData.data);
        } else {
          if (locationHierarchy) {
            const keys = Object.keys(locationHierarchy);
            const sortedKeys = keys.sort((a, b) => {
              const getLevelNumber = (level: string) =>
                parseInt(level.replace(/\D/g, ""), 10);
              return getLevelNumber(b) - getLevelNumber(a);
            });

            const currentIndex = sortedKeys.indexOf(currentLevel);
            let nextLevel: string | number = -1;

            if (currentLevel === "LL") {
              nextLevel = sortedKeys[0] || -1;
            } else if (
              currentIndex !== -1 &&
              currentIndex + 1 < sortedKeys.length
            ) {
              nextLevel = sortedKeys[currentIndex + 1];
            }

            if (nextLevel !== -1 && typeof nextLevel === "string") {
              setLocationType(
                `location_type=${nextLevel}&limit=-1&levels__${currentLevel}=${
                  lastParam.split("_")[1]
                }`
              );
              setTimeout(async () => {
                try {
                  const res = await refetch();
                  locationFromCache(
                    `${lastParam.split("_")[1]}`,
                    res.data,
                    `${nextLevel}`,
                    isLowResolution
                  );
                } catch (error) {
                  console.error("Error refetching data:", error);
                }
              }, 1000);
            } else {
              console.warn("No next level available.");
            }
          }
        }
      }
    };

    fetchData();
  }, [
    refetch,
    locationFromCache,
    locationHierarchy,
    currentLevel,
    lastParam,
    editMapRegion,
    urlParams,
    isLowResolution,
  ]);

  useEffect(() => {
    if (bounds && mapRef.current) {
      const map: Map = mapRef.current;
      if (lastParam !== "home") {
        map.fitBounds(bounds as LatLngBoundsExpression);
      }
    }
  }, [bounds]);

  const onEachData = (locationData: Feature, layer: Layer) => {
    layer.bindTooltip(
      renderToString(
        <div className=" flex flex-col p-1">
          <span>{locationData.properties?.name}</span>
          <span>
            {humanizeNumbers(
              turf.area(locationData) / 1000000,
              false,
              false,
              2
            )}{" "}
            sq km
          </span>
        </div>
      )
    );
    layer.on({
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.75 }),
      mouseout: (e) => e.target.setStyle({ fillOpacity: 0.15 }),
      click: () => {
        setEditMapRegion(locationData);
        setLocationHierarchy(
          JSON.stringify(locationHierarchy) === "{}" ||
            locationData.properties?.location_name === "country"
            ? locationData.properties?.location_hierarchy
            : locationHierarchy
        );
        currentLevel !== "L1" &&
          lastParam !== locationData.properties?.slug &&
          router.push(`${router.asPath}/${locationData.properties?.slug}`);
      },
    });
  };

  const dKey = useMemo(
    () =>
      data?.features?.length !== 0
        ? data?.features?.reduce((a, c) => a + c.id + lastParam, "")
        : "",
    [data, lastParam]
  );

  const handleCountryChange = (newCountryId: string) => {
    clearCache();
    setCountry(newCountryId);
    setCurrentLevel("LL");
    setLocationType("");
    router.push(`/maps/`);
  };

  const [selectedProperties, setSelectedProperties] = useState({
    zostel: false,
    zostelPlus: false,
    zostelHomes: false,
    zoHouse: false,
    zoTrips: false,
  });

  const getMarkerIcon = (type: string) => {
    let iconElement;

    switch (type) {
      case "zostelHomes":
        iconElement = <Icon name="ZostelHome" size={24} fill="#00BEA9" />;
        break;
      case "zostelPlus":
        iconElement = <Icon name="Zostel" size={24} fill="#121212" />;
        break;
      case "zoHouse":
        iconElement = <Icon name="ZoTrip" size={24} fill="#fff" />;
        break;
      case "zostel":
      default:
        iconElement = <Icon name="Zostel" size={24} fill="#F1563F" />;
        break;
    }

    return new LeafletIcon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(
        renderToString(iconElement)
      )}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Define the menu items with proper typing
  const supplyMenu: MenuProps = {
    items: [
      {
        key: "zostel",
        label: (
          <div
            onClick={() => {
              setSelectedProperties((prev) => ({
                ...prev,
                zostel: !prev.zostel,
              }));
            }}
            className="flex items-center gap-3"
          >
            <Icon name="Zostel" size={24} fill="#F1563F" />
            <span className="text-sm">Zostel</span>
            {selectedProperties.zostel && (
              <Icon name="Check" size={24} fill="#cfff50" />
            )}
          </div>
        ),
      },
      {
        key: "zostelPlus",
        label: (
          <div
            onClick={() => {
              setSelectedProperties((prev) => ({
                ...prev,
                zostelPlus: !prev.zostelPlus,
              }));
            }}
            className="flex items-center gap-3"
          >
            <Icon name="Zostel" size={24} fill="#fff" />
            <span className="text-sm">Zostel Plus</span>
            {selectedProperties.zostelPlus && (
              <Icon name="Check" size={20} fill="#cfff50" />
            )}
          </div>
        ),
      },
      {
        key: "zostelHomes",
        label: (
          <div
            onClick={() => {
              setSelectedProperties((prev) => ({
                ...prev,
                zostelHomes: !prev.zostelHomes,
              }));
            }}
            className="flex items-center gap-3"
          >
            <Icon name="ZostelHome" size={24} fill="#00BEA9" />
            <span className="text-sm">Zostel Homes</span>

            {selectedProperties.zostelHomes && (
              <Icon name="Check" size={20} fill="#cfff50" />
            )}
          </div>
        ),
      },
      {
        key: "zoHouse",
        label: (
          <div
            onClick={() => {
              setSelectedProperties((prev) => ({
                ...prev,
                zoHouse: !prev.zoHouse,
              }));
            }}
            className="flex items-center gap-3"
          >
            <Icon name="ZoHouse" size={24} fill="#fff" />
            <span className="text-sm">Zo House</span>

            {selectedProperties.zoHouse && (
              <Icon name="Check" size={20} fill="#cfff50" />
            )}
          </div>
        ),
      },
      {
        key: "zoTrips",
        label: (
          <div
            onClick={() => {
              setSelectedProperties((prev) => ({
                ...prev,
                zoTrips: !prev.zoTrips,
              }));
            }}
            className="flex items-center gap-3"
          >
            <Icon name="ZoTrip" size={24} fill="#fff" />
            <span className="text-sm">Zo Trips</span>
            {selectedProperties.zoHouse && (
              <Icon name="Check" size={20} fill="#cfff50" />
            )}
          </div>
        ),
      },
    ],
  };

  const demandMenu: MenuProps = {
    items: [
      {
        key: "bookings",
        label: (
          <div className="flex items-center gap-3 p-2 hover:bg-black/20 rounded-lg">
            <Icon name="Calendar" size={24} fill="#fff" />
            <span>Current Bookings</span>
          </div>
        ),
      },
    ],
  };

  const operationsMenu: MenuProps = {
    items: [
      {
        key: "maintenance",
        label: (
          <div className="flex items-center gap-3 p-2 hover:bg-black/20 rounded-lg">
            <Icon name="Calendar" size={24} fill="#fff" />
            <span>Maintenance Schedule</span>
          </div>
        ),
      },
    ],
  };

  const citizensMenu: MenuProps = {
    items: [
      {
        key: "active",
        label: (
          <div className="flex items-center gap-3 p-2 hover:bg-black/20 rounded-lg">
            <Icon name="Calendar" size={24} fill="#fff" />
            <span>Active Travelers</span>
          </div>
        ),
      },
    ],
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      metric: "11,242",
      label: "ADR",
      timestamp: new Date(),
    },
    {
      id: 2,
      metric: "62%",
      label: "Occupancy",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        metric: Math.floor(Math.random() * 10000).toLocaleString(),
        label: [
          "ADR",
          "Occupancy",
          "Nights booked",
          "Night Cancelled",
          "OTA Channel",
        ][Math.floor(Math.random() * 5)],
        timestamp: new Date(),
      };

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [notifications]);

  return (
    <div className="map__container w-full relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-4">
        <div className="relative flex gap-4 p-2">
          <div className="relative flex gap-4">
            <Dropdown
              menu={supplyMenu}
              trigger={["click"]}
              overlayClassName="zo-supply-dropdown"
            >
              <button className="flex items-center gap-2 px-4 py-2  bg-zui-dark text-white">
                <Icon name="AngleDown" size={20} />
                Supply
              </button>
            </Dropdown>

            <Dropdown
              menu={demandMenu}
              trigger={["click"]}
              overlayClassName="zo-supply-dropdown"
            >
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zui-dark text-white hover:bg-black/30 transition-colors">
                <Icon name="AngleDown" size={20} />
                Demand
              </button>
            </Dropdown>

            <Dropdown
              menu={operationsMenu}
              trigger={["click"]}
              overlayClassName="zo-supply-dropdown"
            >
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zui-dark text-white hover:bg-black/30 transition-colors">
                <Icon name="AngleDown" size={20} />
                Operations
              </button>
            </Dropdown>

            <Dropdown
              menu={citizensMenu}
              trigger={["click"]}
              overlayClassName="zo-supply-dropdown"
            >
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zui-dark text-white hover:bg-black/30 transition-colors">
                <Icon name="AngleDown" size={20} />
                Citizensx
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[500px]">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Ask Zo World about anything.."
            className="w-full px-4 py-3 rounded-lg bg-black/60 text-white placeholder-gray-400 backdrop-blur-xl border border-gray-700 focus:outline-none focus:border-zui-neon transition-colors"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white">
            <Icon name="Search" size={20} />
          </button>
        </div>
      </div>
      <MapContainer
        center={[20.5937, 78.9629]}
        {...(bounds && { bounds: bounds as LatLngBoundsExpression })}
        zoom={5}
        ref={mapRef}
        style={{
          zIndex: 1,
        }}
        scrollWheelZoom={true}
        className="h-screen"
        zoomControl={true}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxAccessToken}`}
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />
        {(isLoading || isRefetching || isLoadingId || loading) && (
          <CustomControl position="topright">
            <div className="flex h-full w-full bg-black justify-center items-center">
              <Loader className="h-10 w-10" />
            </div>
          </CustomControl>
        )}
        <CustomControl position="topleft">
          <div className="relative w-full p-4">
            <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
            <div className="relative flex flex-col item-start w-full p-4 bg-transparent text-white">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className=" text-sm">Live App users</span>
                  <span className="text-zui-neon">11242</span>
                </div>
                <div className="flex justify-between">
                  <span>In Cart</span>
                  <span className="text-zui-neon">13</span>
                </div>
                <div className="flex justify-between">
                  <span>Booked</span>
                  <span className="text-zui-neon">1329</span>
                </div>
                <div className="flex justify-between">
                  <span>Starting in 48h</span>
                  <span className="text-zui-neon">5343</span>
                </div>
                <div className="flex justify-between">
                  <span>Live in Zo</span>
                  <span className="text-zui-neon">2800</span>
                </div>
                <div className="flex justify-between">
                  <span>On Trip</span>
                  <span className="text-zui-neon">221</span>
                </div>
                <div className="flex justify-between">
                  <span>Questing</span>
                  <span className="text-zui-neon">1108</span>
                </div>
                <div className="flex justify-between">
                  <span>Sending Vibes</span>
                  <span className="text-zui-neon">89</span>
                </div>
                <div className="flex justify-between">
                  <span>Ending Now</span>
                  <span className="text-zui-neon">2442</span>
                </div>
                <div className="flex justify-between">
                  <span>Next destination known</span>
                  <span className="text-zui-neon">350</span>
                </div>
                <div className="flex justify-between">
                  <span>Feedbacks</span>
                  <span className="text-zui-neon">2284</span>
                </div>
              </div>
            </div>
          </div>
        </CustomControl>

        <CustomControl position="topright">
          <div
            className="relative w-full p-4"
            onMouseEnter={() => {
              if (mapRef.current) {
                mapRef.current.scrollWheelZoom.disable();
              }
            }}
            onMouseLeave={() => {
              if (mapRef.current) {
                mapRef.current.scrollWheelZoom.enable();
              }
            }}
          >
            <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
            <div
              ref={chatContainerRef}
              className="relative flex flex-col item-start w-full bg-transparent text-white h-[300px] overflow-y-auto"
            >
              <AnimatePresence initial={false}>
                {[...notifications].reverse().map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-[#CFFF50] text-lg">
                      {notification.metric}
                    </span>
                    <span className="text-white">{notification.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CustomControl>

        <CustomControl position="bottomright">
          <div className="relative w-full p-4 max-h-[300px] overflow-y-auto">
            <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
            <div className="relative flex flex-col gap-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <span className="text-zui-neon">aatmaan</span>
                <span>booked</span>
                <span className="text-red-500">Zostel Panchgani</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Nepal Experience</span>
                <span>starting</span>
                <span className="text-zui-neon">in 24h</span>
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-zui-neon">dvcoolster & 3</span>
                  <span>Trip starting</span>
                  <span className="text-zui-neon">in 2h</span>
                </div>
              ))}
            </div>
          </div>
        </CustomControl>

        {!isLoading && !isLoadingId && !loading && (
          <CustomControl position="bottomleft">
            <div className="relative w-full ">
              <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
              <div className="relative flex flex-col item-start w-full p-4 bg-transparent">
                <p className="text-zui-white font-semibold">
                  General Information
                </p>

                <FormElement
                  name="country"
                  type="select"
                  value={country}
                  setValue={handleCountryChange}
                  options={countryOptions}
                  label="Select Country"
                  required={true}
                />
              </div>
            </div>
          </CustomControl>
        )}

        <GeoJSON
          data={data}
          key={`${dKey}-data`}
          style={(feature: any) => ({
            color: "#fff",
            weight: feature.properties?.selected ? 3 : 1,
            fillOpacity: 0.15,
          })}
          onEachFeature={onEachData}
        />

        {DUMMY_PROPERTIES.filter(
          (property) => selectedProperties[property.type]
        ).map((property) => (
          <Marker
            key={property.id}
            position={property.position}
            icon={getMarkerIcon(property.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{property.name}</h3>
                <p className="capitalize">{property.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ZoMap;
