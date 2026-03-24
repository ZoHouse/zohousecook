import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Notifications as NotificationIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Preview as PreviewIcon,
  PeopleAlt as PeopleIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import MapboxMap from "../components/MapboxMap";
import { environment } from "../environments/environment";

const API_URL = environment.apiUrl;

const AppNotifications = () => {
  // Existing state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: null,
    mobileNumbers: "",
    campaignName: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // New state for audience selection
  const [audienceMethod, setAudienceMethod] = useState("");
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [stayDateRange, setStayDateRange] = useState({
    from: null,
    to: null,
  });
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    address: "",
  });
  const [radius, setRadius] = useState(5);
  const [audienceFetched, setAudienceFetched] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);
  const [fetchingAudience, setFetchingAudience] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);
  const [cities, setCities] = useState([]);

  // Fetch properties when component mounts
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      setPropertiesError(null);
      try {
        const response = await fetch(`${API_URL}/api/properties-and-codes`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch properties");
        }

        if (data.success && data.data) {
          // Sort properties alphabetically by property_name
          const sortedProperties = [...data.data].sort((a, b) =>
            a.property_name.localeCompare(b.property_name)
          );
          setProperties(sortedProperties);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setPropertiesError(
          "Failed to load properties. Please try again later."
        );
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    // Process cities from CSV data
    fetch("/cities_and_locations.csv")
      .then((response) => response.text())
      .then((csvText) => {
        // Skip header row and process data
        const rows = csvText.split("\n").slice(1);

        // Create map to handle duplicates
        const citiesMap = new Map();

        rows.forEach((row) => {
          const [city_name, longitude, latitude, radius] = row.split(",");
          if (city_name && longitude && latitude && radius) {
            citiesMap.set(city_name, {
              name: city_name,
              value: {
                coordinates: parseFloat(latitude) + "," + parseFloat(longitude),
                radius: parseInt(radius, 10),
              },
            });
          }
        });

        // Convert map to array and sort alphabetically
        const uniqueCities = Array.from(citiesMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setCities(uniqueCities);
      })
      .catch((error) => {
        console.error("Error loading cities:", error);
      });
  }, []);

  // Handle audience method change
  const handleAudienceMethodChange = (event) => {
    setAudienceMethod(event.target.value);
    // Reset all filters
    setSelectedProperties([]);
    setSelectedCities([]);
    setStayDateRange({ from: null, to: null });
    setLocation({ lat: null, lng: null, address: "" });
    setRadius(5);
  };

  useEffect(() => {
    // Check if API URL is available when component mounts
    if (!API_URL) {
      setSnackbar({
        open: true,
        message: "API URL is not configured. Please contact the administrator.",
        severity: "error",
      });
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          image: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add this new function to check if audience fields are filled
  const isAudienceValid = () => {
    switch (audienceMethod) {
      case "properties":
        return (
          selectedProperties.length > 0 &&
          stayDateRange.from &&
          stayDateRange.to
        );
      case "home":
        return selectedCities.length > 0;
      case "nearby":
        return location.lat && location.lng && radius > 0;
      case "testing":
        return formData.mobileNumbers.trim() !== "";
      default:
        return false;
    }
  };

  // Update validateForm to include audience validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a title for the notification",
        severity: "error",
      });
      return false;
    }

    if (!formData.campaignName.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a campaign name",
        severity: "error",
      });
      return false;
    }

    if (!audienceMethod) {
      setSnackbar({
        open: true,
        message: "Please select an audience method",
        severity: "error",
      });
      return false;
    }

    if (!isAudienceValid()) {
      let errorMessage = "";
      switch (audienceMethod) {
        case "properties":
          errorMessage = "Please select properties and date range";
          break;
        case "home":
          errorMessage = "Please select at least one city";
          break;
        case "nearby":
          errorMessage = "Please select a location and radius";
          break;
        case "testing":
          errorMessage = "Please enter mobile numbers";
          break;
        default:
          errorMessage = "Please fill in all required audience fields";
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      return false;
    }

    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const finalCampaignName =
        `${formData.campaignName.trim()} [${timestamp}]`.trim();

      // Get auth data from localStorage
      const authDataStr = localStorage.getItem("auth_data");
      console.log(authDataStr);
      if (!authDataStr) {
        throw new Error("Authentication data not found. Please login again.");
      }

      const authData = JSON.parse(authDataStr);
      if (!authData.token || !authData.device_id || !authData.device_secret) {
        throw new Error("Invalid authentication data. Please login again.");
      }

      // Format dates if properties method is selected
      let minDate, maxDate;
      if (
        audienceMethod === "properties" &&
        stayDateRange.from &&
        stayDateRange.to
      ) {
        minDate = new Date(stayDateRange.from).toLocaleDateString("en-GB");
        maxDate = new Date(stayDateRange.to).toLocaleDateString("en-GB");
      }

      // Base request body
      const requestBody = {
        title: formData.title,
        body: formData.subtitle,
        campaign_name: finalCampaignName,
        image: formData.image,
        method:
          audienceMethod === "properties"
            ? "properties_visited"
            : audienceMethod === "home"
            ? "home_location"
            : audienceMethod === "nearby"
            ? "nearby"
            : "test",
        // Add authentication details
        token: authData.token,
        device_id: authData.device_id,
        device_secret: authData.device_secret,
      };

      // Add method-specific fields
      switch (audienceMethod) {
        case "properties":
          requestBody.propertyCodes = selectedProperties.map(
            (prop) => prop.property_code
          );
          requestBody.minDate = minDate;
          requestBody.maxDate = maxDate;
          break;

        case "home":
          requestBody.cities = selectedCities.map((city) => ({
            coordinates: city.value.coordinates,
            radius: city.value.radius,
          }));
          break;

        case "nearby":
          requestBody.nearbyLocation = `${location.lat},${location.lng}`;
          requestBody.nearbyRadius = radius;
          break;

        case "testing":
          requestBody.mobile_numbers = formData.mobileNumbers
            .split(",")
            .map((num) => num.trim())
            .filter((num) => num);
          break;
      }

      const response = await fetch(`${API_URL}/api/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      setSnackbar({
        open: true,
        message: `Notification sent successfully to ${data.data.mobile_numbers_count} users!`,
        severity: "success",
      });

      // Reset form
      setFormData({
        title: "",
        subtitle: "",
        image: null,
        mobileNumbers: "",
        campaignName: "",
      });
      setPreviewOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.message || "Failed to send notification. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const NotificationPreview = () => (
    <Box
      sx={{
        width: "100%",
        maxWidth: 400,
        mx: "auto",
        bgcolor: "#000000",
        borderRadius: 3,
        p: 3,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 40,
          height: 4,
          bgcolor: "#333333",
          borderRadius: 2,
        },
      }}
    >
      {/* Status Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <Box sx={{ display: "flex", gap: 1 }}>
          <span>5G</span>
          <span>100%</span>
        </Box>
      </Box>

      {/* Notification */}
      <Box
        sx={{
          bgcolor: "#1C1C1E",
          borderRadius: 2,
          p: 2,
          border: "1px solid #2C2C2E",
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        {formData.image && (
          <Box
            component="img"
            src={formData.image}
            alt="Notification"
            sx={{
              width: 50,
              height: 50,
              borderRadius: 1,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {" "}
          {/* Add minWidth: 0 to enable text truncation */}
          <Typography
            variant="body2"
            sx={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "16px",
              lineHeight: 1.2,
              mb: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}
          >
            {formData.title || "Notification Title"}
          </Typography>
          {formData.subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: "#8E8E93",
                fontSize: "14px",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
              }}
            >
              {formData.subtitle}
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{
              color: "#8E8E93",
              fontSize: "12px",
              mt: 1,
              display: "block",
            }}
          >
            now
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Add this new function to format coordinates
  const formatCoordinate = (coord) => {
    return Number(coord).toFixed(4);
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 4, color: "#FFFFFF" }}>
        App Notifications
      </Typography>

      {/* Select Audience Section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" gutterBottom color="text.primary">
              Select Audience
            </Typography>
          </Box>

          <Stack spacing={3}>
            {/* Selection Method Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Selection Method</InputLabel>
              <Select
                value={audienceMethod}
                onChange={handleAudienceMethodChange}
                label="Selection Method"
              >
                <MenuItem value="properties">Properties visited</MenuItem>
                <MenuItem value="home">Home location</MenuItem>
                <MenuItem value="nearby">Nearby to a location</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
              </Select>
            </FormControl>

            {/* Properties Visited Filters */}
            {audienceMethod === "properties" && (
              <Stack spacing={3}>
                <Autocomplete
                  multiple
                  options={properties}
                  getOptionLabel={(option) => option.property_name}
                  value={selectedProperties}
                  onChange={(_, newValue) => setSelectedProperties(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Properties"
                      placeholder="Search properties"
                      error={!!propertiesError}
                      helperText={propertiesError}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingProperties && (
                              <CircularProgress color="inherit" size={20} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.property_name}
                        {...getTagProps({ index })}
                        key={option.property_code}
                      />
                    ))
                  }
                  loading={loadingProperties}
                  disabled={loadingProperties}
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Stack direction="row" spacing={2}>
                    <DatePicker
                      label="Stay Date From"
                      value={stayDateRange.from}
                      onChange={(newValue) =>
                        setStayDateRange((prev) => ({
                          ...prev,
                          from: newValue,
                        }))
                      }
                      renderInput={(params) => (
                        <TextField {...params} fullWidth />
                      )}
                    />
                    <DatePicker
                      label="Stay Date To"
                      value={stayDateRange.to}
                      onChange={(newValue) =>
                        setStayDateRange((prev) => ({ ...prev, to: newValue }))
                      }
                      renderInput={(params) => (
                        <TextField {...params} fullWidth />
                      )}
                    />
                  </Stack>
                </LocalizationProvider>
              </Stack>
            )}

            {/* Home Location Filters */}
            {audienceMethod === "home" && (
              <Autocomplete
                multiple
                options={cities}
                getOptionLabel={(option) => option.name}
                value={selectedCities}
                onChange={(_, newValue) => setSelectedCities(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Cities"
                    placeholder="Search cities"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.name}
                    />
                  ))
                }
              />
            )}

            {/* Nearby Location Filters */}
            {audienceMethod === "nearby" && (
              <Stack spacing={3}>
                <MapboxMap onLocationSelect={handleLocationSelect} />
                <TextField
                  label="Radius (KM)"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  inputProps={{ min: 1, max: 100 }}
                />
                {location.address && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Location: {location.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Coordinates: {formatCoordinate(location.lat)}°N,{" "}
                        {formatCoordinate(location.lng)}°E
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Radius: {radius} KM
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}

            {/* Testing option - no additional filters needed */}
            {audienceMethod === "testing" && (
              <Typography variant="body2" color="text.secondary">
                Notifications will be sent to mobiles numbers provided below.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Compose Notification Section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" gutterBottom color="text.primary">
              Compose Notification
            </Typography>
          </Box>

          <Stack spacing={3}>
            {/* Campaign Name Input */}
            <TextField
              label="Campaign Name"
              value={formData.campaignName}
              onChange={(e) =>
                handleInputChange("campaignName", e.target.value)
              }
              placeholder="Enter campaign name"
              required
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />

            {/* Title Input */}
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter notification title"
              required
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />

            {/* Subtitle Input */}
            <TextField
              label="Subtitle"
              value={formData.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
              placeholder="Enter notification subtitle (optional)"
              fullWidth
              multiline
              rows={2}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />

            {/* Mobile Numbers Input - Only show for Testing method */}
            {audienceMethod === "testing" && (
              <TextField
                label="Mobile Numbers"
                value={formData.mobileNumbers}
                onChange={(e) =>
                  handleInputChange("mobileNumbers", e.target.value)
                }
                placeholder="Enter comma-separated mobile numbers (e.g., 1234567890, 9876543210)"
                required
                fullWidth
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.default",
                  },
                }}
              />
            )}

            {/* Image Upload */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Notification Image (Optional)
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload Image
                </Button>
              </label>
              {formData.image && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="primary.main">
                    ✓ Image uploaded successfully
                  </Typography>
                  <Box
                    component="img"
                    src={formData.image}
                    alt="Preview"
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 1,
                      objectFit: "cover",
                      mt: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={
                !formData.title.trim() ||
                !formData.campaignName.trim() ||
                !isAudienceValid()
              }
            >
              Preview
            </Button>
            <LoadingButton
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSend}
              loading={loading}
              loadingPosition="start"
              disabled={
                !formData.title.trim() ||
                !formData.campaignName.trim() ||
                !isAudienceValid()
              }
              sx={{
                py: 1.5,
                backgroundColor: "primary.main",
                color: "rgb(20, 20, 20)",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
            >
              Send Notification
            </LoadingButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Notification Preview</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              This is how your notification will appear to users:
            </Typography>
            <NotificationPreview />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Campaign: {formData.campaignName} [timestamp]
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This notification will be sent to:{" "}
                {formData.mobileNumbers.split(",").length} users
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleSend}
            loading={loading}
            variant="contained"
            startIcon={<SendIcon />}
            sx={{
              backgroundColor: "primary.main",
              color: "rgb(20, 20, 20)",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Send Notification
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AppNotifications;
