import { GeneralObject } from "@zo/definitions/general";
import axios, { AxiosResponse } from "axios";
import { Feature, FeatureCollection } from "geojson";
import PQueue from "p-queue";
import { useCallback, useRef, useState } from "react";

type LocationData = {
  id: string;
  level: string;
  data: FeatureCollection;
  isLowResolution?: boolean;
};

const createSlug = (name: string, id: string) => {
  return `${name.replace(/\s+/g, "-").toLowerCase()}_${id}`;
};

const useLocationCache = () => {
  const [locationsData, setLocationsData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const queueRef = useRef<PQueue | null>(null);

  const locationFromCache = useCallback(
    (
      id: string,
      data?: GeneralObject,
      level?: string,
      isLowResolution?: boolean,
      onFeatureFetched?: (feature: Feature) => void
    ) => {
      const cachedData = locationsData.find((ld) => ld.id === id);
      if (cachedData) {
        return cachedData;
      } else if (data && level) {
        const fetchAndSetLocationData = async () => {
          setLoading(true);
          try {
            const updatedFeatures: Feature[] = [];

            if (isLowResolution) {
              // Low Resolution: Fetch all features at once
              const features = await Promise.all(
                data.map(async (p: GeneralObject) => {
                  try {
                    return {
                      id: p.id,
                      geometry: p.low_res_geometry,
                      type: "Feature",
                      properties: {
                        ...p.properties,
                        name: p.name,
                        slug: createSlug(p.name, p.id),
                      },
                    };
                  } catch (error) {
                    console.error("Failed to process low-res feature:", error);
                    return {
                      id: p.id,
                      geometry: p.geometry,
                      type: "Feature",
                      properties: {
                        ...p.properties,
                        name: p.name,
                        slug: createSlug(p.name, p.id),
                      },
                    };
                  }
                })
              );

              updatedFeatures.push(...features);

              setLocationsData((prevData) => [
                ...prevData,
                {
                  id: id,
                  level: level,
                  data: {
                    type: "FeatureCollection",
                    features: updatedFeatures,
                  },
                },
              ]);
            } else {
              // High Resolution: Use PQueue to fetch features progressively
              if (!queueRef.current) {
                queueRef.current = new PQueue({ concurrency: 10 });
              }
              const queue = queueRef.current;

              const fetchFeature = async (p: GeneralObject) => {
                try {
                  const response: AxiosResponse = await axios.get(
                    p.geometry_url
                  );
                  const geometryData = response.data;

                  const feature: Feature = {
                    id: p.id,
                    geometry: geometryData,
                    type: "Feature",
                    properties: {
                      ...p.properties,
                      name: p.name,
                      slug: createSlug(p.name, p.id),
                    },
                  };
                  // Update state with the new feature
                  setLocationsData((prevData: LocationData[]) => {
                    const existingIndex = prevData.findIndex(
                      (ld) => ld.id === id
                    );
                    if (existingIndex >= 0) {
                      const newFeatures = [
                        ...prevData[existingIndex].data.features,
                        feature,
                      ];
                      const newData = {
                        ...prevData[existingIndex],
                        data: {
                          type: "FeatureCollection",
                          features: newFeatures,
                        },
                      };
                      const newPrevData: LocationData[] = [...prevData];
                      newPrevData[existingIndex] = newData as LocationData;
                      return newPrevData;
                    } else {
                      return [
                        ...prevData,
                        {
                          id: id,
                          level: level,
                          data: {
                            type: "FeatureCollection",
                            features: [feature],
                          },
                        },
                      ];
                    }
                  });

                  // Call the callback to inform that a new feature is fetched
                  if (onFeatureFetched) {
                    onFeatureFetched(feature);
                  }
                } catch (error) {
                  console.error(
                    "Failed to fetch high-res geometry data:",
                    error
                  );
                }
              };

              data.results.forEach((p: GeneralObject) => {
                queue.add(() => fetchFeature(p));
              });

              await queue.onIdle();
            }
          } catch (error) {
            console.error("Error in fetchAndSetLocationData:", error);
          } finally {
            setLoading(false);
          }
        };

        fetchAndSetLocationData();
        return undefined;
      } else {
        return undefined;
      }
    },
    [locationsData]
  );

  const clearCache = useCallback(() => {
    setLocationsData([]);
    if (queueRef.current) {
      queueRef.current.clear();
      queueRef.current = null;
    }
  }, []);

  return {
    locationFromCache,
    loading,
    clearCache,
  };
};

export default useLocationCache;
