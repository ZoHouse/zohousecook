import * as turf from "@turf/turf";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useAuth, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Breadcrumbs, FormElement } from "@zo/moal";
import { useLocationCache, useVisibilityState } from "@zo/utils/hooks";
import { humanizeNumbers } from "@zo/utils/number";
import { isValidString } from "@zo/utils/string";
import { Feature, FeatureCollection } from "geojson";
import L, { LatLngBoundsExpression, Layer, Map } from "leaflet";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import {
  FeatureGroup,
  GeoJSON,
  MapContainer,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { AddMapLocationSidebar, EditMapLocationSidebar } from "../../sidebars";
import CustomControl from "./CustomControl";
import LabelledText from "./LabelledText";

interface MapProps {}

const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const ZoMap: React.FC<MapProps> = () => {
  const router = useRouter();
  const mapRef = useRef<Map>(null);
  const { isLoggedIn } = useAuth();
  const { locationFromCache, loading, clearCache } = useLocationCache();
  const [country, setCountry] = useState<string>("");

  const editableFGRef = useRef<L.FeatureGroup | null>(null);
  const [isAddingLocation, setAddingLocation] = useState(false);
  const [isEditingRegion, setEditingRegion] = useState(false);
  const [isLowResolution, setIsLowResolution] = useState(true);
  const [isAddLocationVisible, showAddLocation, hideAddLocation] =
    useVisibilityState(false);
  const [isEditLocationVisible, showEditLocation, hideEditLocation] =
    useVisibilityState(false);

  const [locationHierarchy, setLocationHierarchy] =
    useState<GeneralObject | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string>("LL");
  const [locationType, setLocationType] = useState<string>("");
  const [selectedGeoJson, setSelectedGeoJson] = useState<Feature | null>(null);
  const [selectedEditGeoJson, setSelectedEditGeoJson] =
    useState<Feature | null>(null);
  const [editMapRegion, setEditMapRegion] = useState<Feature | null>(null);

  const [data, setData] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  const previousDataRef = useRef<FeatureCollection | null>(null);

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

  const breadcrumbs = useMemo(
    () => [
      ...urlParams.map((fp, index) => ({
        text: `${fp.split("_")[0]}`,
        to: `/${urlParams.slice(0, index + 1).join("/")}`,
      })),
    ],
    [urlParams]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (lastParam === "maps" && lastParam !== undefined) {
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
      if (lastParam !== "maps") {
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

  const handleEdit = useCallback(() => {
    if (!editableFGRef.current) return;
  }, []);

  const handleCreate = useCallback((e: { layer: any }) => {
    const { layer } = e;
    const newGeoJson = layer.toGeoJSON();
    setSelectedGeoJson(newGeoJson);
  }, []);

  const handleDelete = useCallback(() => {
    if (editableFGRef.current) {
      editableFGRef.current.clearLayers();
    }
    setEditingRegion(false);
    setSelectedGeoJson(null);
    setData(data);
  }, [data]);

  const handleFeatureGroupReady = useCallback(
    (reactFGref: any) => {
      if (!reactFGref || !data) return;
      const leafletFG = reactFGref;
      const leafletGeoJSON = new L.GeoJSON(data);

      leafletGeoJSON.eachLayer((layer) => {
        leafletFG.addLayer(layer);
      });

      editableFGRef.current = leafletFG;
    },
    [data]
  );

  const toggleAddLocationMode = useCallback(() => {
    previousDataRef.current = data;
    setAddingLocation((prev) => !prev);
  }, [data]);

  const handleSave = useCallback(() => {
    if (!selectedGeoJson) return;
    setSelectedGeoJson({ ...selectedGeoJson });
    showAddLocation();
    setAddingLocation(false);
  }, [selectedGeoJson, showAddLocation]);

  const handleEditRegion = useCallback(() => {
    if (editMapRegion) {
      previousDataRef.current = data;
      setData({
        type: "FeatureCollection",
        features: [editMapRegion],
      });
      setEditingRegion(true);
    }
  }, [editMapRegion, data]);

  const handleSaveEdit = useCallback(() => {
    if (editableFGRef.current) {
      const geoJson = editableFGRef.current.toGeoJSON() as Feature;
      setSelectedEditGeoJson(geoJson);
      showEditLocation();
      setEditingRegion(false);
    }
  }, [showEditLocation]);

  const handleEditLocation = useCallback(() => {
    if (isEditingRegion) {
      handleSaveEdit();
    } else {
      handleEditRegion();
    }
  }, [isEditingRegion, handleSaveEdit, handleEditRegion]);

  const handleAddLocationClose = useCallback(() => {
    hideAddLocation();
    setSelectedGeoJson(null);
    if (previousDataRef.current) {
      setData(previousDataRef.current);
      previousDataRef.current = null;
    }
  }, [hideAddLocation]);

  const handleEditLocationClose = useCallback(() => {
    hideEditLocation();
    setSelectedEditGeoJson(null);
    if (previousDataRef.current) {
      setData(previousDataRef.current);
      previousDataRef.current = null;
    }
  }, [hideEditLocation]);

  const handleCountryChange = (newCountryId: string) => {
    clearCache();
    setCountry(newCountryId);
    setCurrentLevel("LL");
    setLocationType("");
    router.push(`/maps/`);
  };

  const toggleResolution = (resolutionType: "low" | "high") => {
    setIsLowResolution(resolutionType === "low");
    clearCache();
    setData({
      type: "FeatureCollection",
      features: [],
    });

    if (country) {
      refetch();
    }
  };

  return (
    <div className="map__container w-full relative">
      <MapContainer
        center={[20.5937, 78.9629]}
        {...(bounds && { bounds: bounds as LatLngBoundsExpression })}
        zoom={5}
        ref={mapRef}
        style={{
          zIndex: 1,
        }}
        scrollWheelZoom={false}
        className="h-screen"
        zoomControl={false}
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
        {!isLoading && !isLoadingId && !loading && (
          <CustomControl position="topright">
            <div className="relative w-full p-4">
              <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
              <div className="relative flex flex-col item-start w-full p-4 bg-transparent">
                <p className="text-zui-white text-lg font-semibold">
                  General Information
                </p>
                <LabelledText
                  label="Name"
                  className="my-2"
                  labelClassname="text-zui-silver"
                  textClassname="text-zui-white capitalize"
                >
                  {lastParam === "" ? "Countries" : lastParam.split("_")[0]}
                </LabelledText>
                <LabelledText
                  label="Area"
                  className="my-2"
                  labelClassname="text-zui-silver"
                  textClassname="text-zui-white"
                >
                  {humanizeNumbers(turf?.area(data) / 1000000, false, false, 2)}{" "}
                  sq km
                </LabelledText>

                <FormElement
                  name="country"
                  type="select"
                  value={country}
                  setValue={handleCountryChange}
                  options={countryOptions}
                  label="Select Country"
                  required={true}
                />

                <div className="flex space-x-2 mt-4">
                  <button
                    className="px-4 py-2 bg-zui-white text-zui-dark text-xs font-semibold rounded-xl"
                    onClick={
                      isAddingLocation ? handleSave : toggleAddLocationMode
                    }
                  >
                    {isAddingLocation ? "Save" : "Add Location"}
                  </button>
                  {editMapRegion && !isLowResolution && (
                    <button
                      className="px-4 py-2 bg-zui-white text-zui-dark text-xs font-semibold rounded-xl"
                      onClick={handleEditLocation}
                    >
                      {isEditingRegion ? "Save" : "Edit"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CustomControl>
        )}
        <CustomControl position="topleft">
          <div className="relative w-full p-4">
            <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
            <div className="relative flex flex-col item-start w-full p-4 bg-transparent">
              <Breadcrumbs links={breadcrumbs} />
            </div>
          </div>
        </CustomControl>

        <CustomControl position="bottomleft">
          <div className="relative w-full p-4">
            <div className="absolute inset-0 bg-zui-lighter opacity-70 backdrop-blur-xl"></div>
            <div className="relative flex flex-col item-start w-full  bg-transparent">
              <p className="text-zui-white text-lg font-semibold">Resolution</p>
              <div className="flex flex-col  mt-4 gap-4">
                <div
                  onClick={() => toggleResolution("low")}
                  style={{ cursor: "pointer" }}
                  className="flex flex-wrap gap-4"
                >
                  {isLowResolution ? (
                    <Icon name="RadioChecked" size={24} fill="#CFFF50" />
                  ) : (
                    <Icon name="Radio" size={24} />
                  )}
                  <span>Low Resolution</span>
                </div>

                <div
                  onClick={() => toggleResolution("high")}
                  style={{ cursor: "pointer" }}
                  className="flex flex-wrap gap-4"
                >
                  {!isLowResolution ? (
                    <Icon name="RadioChecked" size={24} fill="#CFFF50" />
                  ) : (
                    <Icon name="Radio" size={24} />
                  )}
                  <span>High Resolution</span>
                </div>
              </div>
            </div>
          </div>
        </CustomControl>

        {!isEditingRegion && (
          <GeoJSON
            data={data}
            key={`${dKey}-data`}
            style={(feature: any) => ({
              color:
                feature.properties?.selected && !isEditingRegion
                  ? "#ffffff"
                  : "#fff",
              weight: feature.properties?.selected ? 3 : 1,
              fillOpacity: 0.15,
            })}
            onEachFeature={onEachData}
          />
        )}

        {(isEditingRegion || isAddingLocation) && (
          <FeatureGroup
            ref={(reactFGref) => {
              if (reactFGref && !editableFGRef.current && !isAddingLocation)
                handleFeatureGroupReady(reactFGref);
            }}
          >
            <EditControl
              position="topleft"
              onEdited={handleEdit}
              onCreated={handleCreate}
              onDeleted={handleDelete}
              draw={{
                rectangle: false,
                polyline: true,
                circle: false,
                polygon: true,
                circlemarker: false,
                marker: true,
              }}
              edit={{
                edit: isEditingRegion,
                remove: true,
              }}
            />
          </FeatureGroup>
        )}

        <ZoomControl />
      </MapContainer>
      <AddMapLocationSidebar
        isOpen={isAddLocationVisible}
        onClose={handleAddLocationClose}
        refetch={refetch}
        data={selectedGeoJson}
      />

      <EditMapLocationSidebar
        isOpen={isEditLocationVisible}
        onClose={handleEditLocationClose}
        refetch={refetch}
        data={selectedEditGeoJson}
      />
    </div>
  );
};

export default ZoMap;
