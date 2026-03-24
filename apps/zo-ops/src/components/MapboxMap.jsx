import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
// import "mapbox-gl/dist/mapbox-gl.css"; // Temporarily disabled due to build issues
import { Box, Alert } from "@mui/material";
import { environment } from "../environments/environment";

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "your_mapbox_token_here";

const MapboxMap = ({ onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (map.current) return;

    try {
      // Initialize map with tracking disabled
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [78.9629, 20.5937],
        zoom: 4,
        trackResize: false,
        collectResourceTiming: false,
        attributionControl: false,
        refreshExpiredTiles: false,
        fadeDuration: 0,
        crossSourceCollisions: false,
        locale: {
          "ScrollZoomBlocker.CtrlMessage": " ",
          "TouchPanBlocker.Message": " ",
        },
      });

      // Add minimal controls
      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      // Add minimal attribution
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true,
          customAttribution: "Maps by Mapbox",
        })
      );

      // Initialize marker
      marker.current = new mapboxgl.Marker({
        color: "#FF385C",
      });

      // Initialize geocoder with minimal tracking
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Search for a location",
        countries: "in",
        bbox: [68.1766, 6.7499, 97.4025, 35.6745],
        enableEventLogging: false,
        showResultsWhileTyping: false,
        minLength: 3,
        limit: 5,
      });

      // Add geocoder to map
      map.current.addControl(geocoder);

      // Handle location selection from search
      geocoder.on("result", (e) => {
        try {
          const coordinates = e.result.center;
          marker.current.setLngLat(coordinates).addTo(map.current);

          onLocationSelect({
            lng: coordinates[0],
            lat: coordinates[1],
            address: e.result.place_name,
          });
        } catch (err) {
          console.error("Error handling search result:", err);
          setError("Error selecting location from search");
        }
      });

      // Handle click on map
      map.current.on("click", async (e) => {
        try {
          const coordinates = e.lngLat;
          marker.current.setLngLat(coordinates).addTo(map.current);

          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${mapboxgl.accessToken}&types=place,locality,neighborhood&limit=1`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch location details");
            }

            const data = await response.json();
            const address = data.features[0]?.place_name || "Selected location";

            onLocationSelect({
              lng: coordinates.lng,
              lat: coordinates.lat,
              address: address,
            });
          } catch (geocodeError) {
            console.error("Reverse geocoding error:", geocodeError);
            onLocationSelect({
              lng: coordinates.lng,
              lat: coordinates.lat,
              address: "Selected location",
            });
          }
        } catch (err) {
          console.error("Error handling map click:", err);
          setError("Error selecting location");
        }
      });

      // Handle map load error
      map.current.on("error", (err) => {
        console.error("Mapbox error:", err);
        setError("Error loading map");
      });
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Error initializing map");
    }

    // Cleanup
    return () => {
      try {
        map.current?.remove();
        map.current = null;
      } catch (err) {
        console.error("Error cleaning up map:", err);
      }
    };
  }, [onLocationSelect]);

  return (
    <Box sx={{ position: "relative" }}>
      {error && (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        >
          {error}
        </Alert>
      )}
      <Box
        ref={mapContainer}
        sx={{
          height: 400,
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      />
    </Box>
  );
};

export default MapboxMap;
