export const buildingLayer = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 15,
  paint: {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "height"],
    ],
    "fill-extrusion-base": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "min_height"],
    ],
    "fill-extrusion-opacity": 0.6,
  },
};

export const lineLayers = {
  id: "route",
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
    "line-z-offset": 10,
  },
  paint: {
    "line-color": "#ffffff",
    "line-width": 3,
    "line-emissive-strength": 3,
  },
};
