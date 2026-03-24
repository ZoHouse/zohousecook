import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  OutlinedInput,
  Stack,
  Divider,
  Alert,
  Snackbar,
  Autocomplete,
  Container,
  Dialog,
  LinearProgress,
  IconButton,
  DialogTitle,
  DialogContent,
  FormHelperText,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  WhatsApp as WhatsAppIcon,
  List as ListIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { whatsappService } from "../services/whatsappService";
import { LoadingButton } from "@mui/lab";
import { fetchPropertiesData } from "../utils/csvUtils";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { environment } from "../environments/environment";

const API_URL = environment.apiUrl;
console.log("API_URL:", environment.apiUrl);

const WhatsAppNotices = () => {
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [notice, setNotice] = useState("");
  const [testNumber, setTestNumber] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState({
    test: false,
    bulk: false,
  });
  const [guestCount, setGuestCount] = useState(null);
  const [fetchingCount, setFetchingCount] = useState(false);
  const [propertiesData, setPropertiesData] = useState([]);
  const [messageType, setMessageType] = useState("template"); // 'template' or 'custom'
  const [templateName, setTemplateName] = useState("");
  const [progress, setProgress] = useState({
    open: false,
    sent: 0,
    total: 0,
  });
  const [phoneListDialog, setPhoneListDialog] = useState({
    open: false,
    guests: [],
  });
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
  const [templateParams, setTemplateParams] = useState({});
  const [dateRangeLogic, setDateRangeLogic] = useState(["CHECKIN"]);
  const theme = useTheme();

  useEffect(() => {
    const loadProperties = async () => {
      const data = await fetchPropertiesData();
      setPropertiesData(data.properties || []);
    };
    loadProperties();
  }, []);

  useEffect(() => {
    const fetchGuestCount = async () => {
      if (selectedProperties.length && startDate && endDate) {
        setFetchingCount(true);
        try {
          const minDateObj = new Date(startDate);
          minDateObj.setDate(minDateObj.getDate());
          const maxDateObj = new Date(endDate);
          maxDateObj.setDate(maxDateObj.getDate() + 2);

          const minDate = minDateObj.toISOString().split("T")[0];
          const maxDate = maxDateObj.toISOString().split("T")[0];

          const propertyCodes = selectedProperties
            .map((prop) => prop.value)
            .join(",");

          const params = new URLSearchParams({
            minDate,
            maxDate,
            propertyCodes,
            dateRangeLogic: dateRangeLogic.join(","),
          });

          const response = await fetch(`${API_URL}/api/guest-count?${params}`);

          if (!response.ok) {
            throw new Error("Failed to fetch guest count");
          }

          const data = await response.json();
          setGuestCount(data.count);

          if (data.success && Array.isArray(data.guests)) {
            localStorage.setItem("guestDetails", JSON.stringify(data.guests));
          }
        } catch (error) {
          console.error("Failed to fetch guest count:", error);
          setGuestCount(null);
          localStorage.removeItem("guestDetails");
        } finally {
          setFetchingCount(false);
        }
      } else {
        setGuestCount(null);
        localStorage.removeItem("guestDetails");
      }
    };

    fetchGuestCount();
  }, [selectedProperties, startDate, endDate, dateRangeLogic]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (messageType === "template") {
        setTemplatesLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/wati/get-templates`);
          if (!response.ok) {
            throw new Error("Failed to fetch templates");
          }
          const data = await response.json();
          if (data.success && Array.isArray(data.templates)) {
            setTemplates(data.templates);
          }
        } catch (error) {
          console.error("Error fetching templates:", error);
          setSnackbar({
            open: true,
            message: "Failed to load templates",
            severity: "error",
          });
        } finally {
          setTemplatesLoading(false);
        }
      }
    };

    fetchTemplates();
  }, [messageType]);

  const handlePropertyChange = (event) => {
    setSelectedProperties(event.target.value);
  };

  const handleSendTest = async () => {
    if (!testNumber) {
      setSnackbar({
        open: true,
        message: "Please enter a phone number",
        severity: "error",
      });
      return;
    }

    if (
      (messageType === "template" && !templateName) ||
      (messageType === "custom" && !notice)
    ) {
      setSnackbar({
        open: true,
        message: `Please enter a ${
          messageType === "template" ? "template name" : "message"
        }`,
        severity: "error",
      });
      return;
    }

    setLoading({ ...loading, test: true });
    try {
      const requestBody =
        messageType === "template"
          ? {
              phoneNumber: testNumber,
              templateName,
              parameters: Object.entries(templateParams).map(
                ([name, value]) => ({
                  name,
                  value:
                    value === "{{guest_name}}"
                      ? "Test Guest"
                      : value === "{{property_name}}"
                      ? "Test Property"
                      : value.startsWith("{{")
                      ? value.slice(2, -2) // Remove curly braces for manual params
                      : value,
                })
              ),
            }
          : {
              phoneNumber: testNumber,
              templateName: "zostel_operational_update",
              parameters: [
                { name: "Property", value: "Test Property" },
                { name: "variable", value: notice }
              ],
            };

      const response = await fetch(`${API_URL}/api/wati/send-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to send test message");
      }

      setSnackbar({
        open: true,
        message: "Test message sent successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to send test message",
        severity: "error",
      });
    } finally {
      setLoading({ ...loading, test: false });
    }
  };

  const handleSendToAll = async () => {
    if (!selectedProperties.length || !startDate || !endDate) {
      setSnackbar({
        open: true,
        message: "Please select properties and date range",
        severity: "error",
      });
      return;
    }

    if (messageType === "template" && !templateName) {
      setSnackbar({
        open: true,
        message: "Please enter a template name",
        severity: "error",
      });
      return;
    }

    if (messageType === "custom" && !notice) {
      setSnackbar({
        open: true,
        message: "Please enter a custom message",
        severity: "error",
      });
      return;
    }

    setLoading({ ...loading, bulk: true });
    try {
      const guests = JSON.parse(localStorage.getItem("guestDetails") || "[]");

      if (!guests.length) {
        throw new Error("No recipients found");
      }

      let successCount = 0;
      let failureCount = 0;

      // Show progress dialog
      setProgress({
        open: true,
        sent: 0,
        total: guests.length,
      });

      // Send messages in sequence
      for (const guest of guests) {
        try {
          const requestBody =
            messageType === "template"
              ? {
                  phoneNumber: guest.mobile,
                  templateName,
                  parameters: Object.entries(templateParams).map(
                    ([name, value]) => ({
                      name,
                      value:
                        value === "{{guest_name}}"
                          ? guest.guest_name
                          : value === "{{property_name}}"
                          ? guest.property_name
                          : value.startsWith("{{")
                          ? value.slice(2, -2) // Remove curly braces for manual params
                          : value,
                    })
                  ),
                }
              : {
                  phoneNumber: guest.mobile,
                  templateName: "zostel_operational_update",
                  parameters: [
                    { name: "Property", value: guest.property_name },
                    { name: "variable", value: notice }
                  ],
                };

          const response = await fetch(`${API_URL}/api/wati/send-template`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`Failed to send message to ${guest.mobile}`);
          }

          successCount++;
          // Update progress
          setProgress((prev) => ({
            ...prev,
            sent: successCount + failureCount,
          }));
        } catch (error) {
          console.error(`Error sending to ${guest.mobile}:`, error);
          failureCount++;
          // Update progress for failures too
          setProgress((prev) => ({
            ...prev,
            sent: successCount + failureCount,
          }));
        }
      }

      // Show results
      setSnackbar({
        open: true,
        message: `Messages sent: ${successCount} successful, ${failureCount} failed`,
        severity: failureCount > 0 ? "warning" : "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to send messages",
        severity: "error",
      });
    } finally {
      setLoading({ ...loading, bulk: false });
      // Close progress dialog
      setProgress((prev) => ({ ...prev, open: false }));
    }
  };

  const propertyOptions = propertiesData.map((p) => ({
    label: p.property_name,
    value: p.property_code,
  }));

  const handleTemplateChange = (e) => {
    setTemplateName(e.target.value);
    const selectedTemplate = templates.find(
      (t) => t.templateName === e.target.value
    );
    setSelectedTemplateDetails(selectedTemplate);

    // Initialize template params
    if (selectedTemplate?.customParams) {
      const params = {};
      selectedTemplate.customParams.forEach((param) => {
        const isMediaFile = /\.(pdf|jpe?g|png)$/i.test(param.paramValue || "");
        if (!isMediaFile) {
          params[param.paramName] = "";
        }
      });
      setTemplateParams(params);
    }
  };

  // Update the helper function to format the template body
  const formatTemplateBody = (body, customParams) => {
    if (!body || !customParams || !Array.isArray(customParams)) return body;

    let formattedBody = body;
    let paramMap = {};
    let nextParamNumber = 1;

    // First pass: map non-media params sequentially starting from 1
    customParams.forEach((param) => {
      const isMediaFile = /\.(pdf|jpe?g|png)$/i.test(param.paramValue || "");
      if (!isMediaFile) {
        paramMap[nextParamNumber] = param.paramName;
        nextParamNumber++;
      }
    });

    // Then replace all occurrences of each number with its corresponding param name
    Object.entries(paramMap).forEach(([num, paramName]) => {
      const regex = new RegExp(`\\{\\{${num}\\}\\}`, "g");
      formattedBody = formattedBody.replace(regex, `{{${paramName}}}`);
    });

    return formattedBody;
  };

  // Add this function to update both params and preview
  const handleParamValueChange = (paramName, value, type = "select") => {
    let finalValue = value;

    // If it's a manual input, wrap the value in curly braces
    if (type === "manual" && value !== "") {
      finalValue = `{{${value}}}`;
    }

    setTemplateParams((prev) => ({
      ...prev,
      [paramName]: finalValue,
    }));
  };

  // Update the template preview section
  const getPreviewText = (body, params) => {
    let previewText = formatTemplateBody(
      body,
      selectedTemplateDetails.customParams
    );

    // Replace parameter placeholders with their values
    Object.entries(params).forEach(([paramName, value]) => {
      if (value && value !== "manual") {
        const regex = new RegExp(`\\{\\{${paramName}\\}\\}`, "g");
        // If it's a manual value, remove the curly braces for display
        const displayValue = value.startsWith("{{")
          ? value.slice(2, -2)
          : value;
        previewText = previewText.replace(regex, displayValue);
      }
    });

    return previewText;
  };

  // Add this function to sort templates
  const sortTemplates = (templates) => {
    return templates.sort((a, b) => {
      // Push guest_notice_3 to the top
      if (a.templateName === "guest_notice_3") return -1;
      if (b.templateName === "guest_notice_3") return 1;
      return a.templateName.localeCompare(b.templateName);
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container>
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: "#FFFFFF",
          }}
        >
          WhatsApp Notices
        </Typography>

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
            <Autocomplete
              multiple
              options={propertyOptions}
              value={selectedProperties}
              onChange={(event, newValue) => setSelectedProperties(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Properties"
                  placeholder="Type to search..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.value}
                  />
                ))
              }
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
            />

            <FormControl required sx={{ width: "100%" }}>
              <InputLabel>Date Range Logic</InputLabel>
              <Select
                multiple
                value={dateRangeLogic}
                onChange={(e) => {
                  const value = e.target.value;
                  // Ensure not more than 2 options are selected
                  if (Array.isArray(value) && value.length <= 2) {
                    setDateRangeLogic(value);
                  }
                }}
                label="Date Range Logic"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={
                          value === "CHECKIN"
                            ? "Check-in"
                            : value === "CHECKOUT"
                            ? "Check-out"
                            : "Stayover"
                        }
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="CHECKIN">Check-in</MenuItem>
                <MenuItem value="CHECKOUT">Check-out</MenuItem>
                <MenuItem value="STAYOVER">Stayover</MenuItem>
              </Select>
              <FormHelperText>Select up to 2 options</FormHelperText>
            </FormControl>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ width: "100%" }}
            >
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: false,
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => {
                  // Only set end date if it's not before start date
                  if (!startDate || newValue >= startDate) {
                    setEndDate(newValue);
                  }
                }}
                format="dd/MM/yyyy"
                minDate={startDate} // This prevents selecting dates before start date
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: endDate && startDate && endDate < startDate,
                    helperText:
                      endDate && startDate && endDate < startDate
                        ? "End date cannot be before start date"
                        : "",
                  },
                }}
                disabled={!startDate} // Disable end date picker until start date is selected
              />
            </Stack>

            {selectedProperties.length > 0 && startDate && endDate && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 2,
                  px: 3,
                  borderRadius: 2,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Recipients:
                </Typography>
                {fetchingCount ? (
                  <Typography variant="body1" color="primary.light">
                    Calculating...
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body1"
                      color="primary.light"
                      fontWeight="600"
                    >
                      {guestCount !== null
                        ? `${guestCount} guest${guestCount !== 1 ? "s" : ""}`
                        : "No guests found"}
                    </Typography>
                    {guestCount > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const guests = JSON.parse(
                            localStorage.getItem("guestDetails") || "[]"
                          );
                          setPhoneListDialog({
                            open: true,
                            guests,
                          });
                        }}
                        sx={{ color: "primary.light" }}
                      >
                        <ListIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel id="message-type-label">Message Type</InputLabel>
              <Select
                labelId="message-type-label"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                label="Message Type"
              >
                <MenuItem value="template">WATI Template Name</MenuItem>
                <MenuItem value="custom">Custom Message</MenuItem>
              </Select>
            </FormControl>

            {messageType === "template" ? (
              <>
                <FormControl fullWidth>
                  <InputLabel id="template-select-label">
                    Template Name
                  </InputLabel>
                  <Select
                    labelId="template-select-label"
                    value={templateName}
                    onChange={handleTemplateChange}
                    label="Template Name"
                    disabled={templatesLoading}
                  >
                    {templatesLoading ? (
                      <MenuItem disabled>Loading templates...</MenuItem>
                    ) : templates.length === 0 ? (
                      <MenuItem disabled>No templates found</MenuItem>
                    ) : (
                      sortTemplates(templates).map((template) => (
                        <MenuItem
                          key={template.id}
                          value={template.templateName}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {template.templateName === "guest_notice_3" && (
                            <StarIcon
                              fontSize="small"
                              sx={{
                                color: "primary.main",
                                mr: 0.5,
                              }}
                            />
                          )}
                          {template.templateName}{" "}
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({template.category})
                          </Typography>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {templatesLoading && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <LinearProgress />
                    </Box>
                  )}
                </FormControl>

                {/* WhatsApp Preview */}
                {selectedTemplateDetails && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      bgcolor: "background.default",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* WhatsApp Header */}
                    <Box
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        p: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "success.main",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <WhatsAppIcon fontSize="small" />
                        Template Preview
                      </Typography>
                    </Box>

                    {/* Message Content */}
                    <Box
                      sx={{
                        p: 2,
                        "& pre": {
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          m: 0,
                        },
                      }}
                    >
                      <Stack
                        spacing={1}
                        sx={{
                          maxWidth: "80%",
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          p: 2,
                          borderRadius: 2,
                          borderTopLeftRadius: 0,
                        }}
                      >
                        <pre>
                          {getPreviewText(
                            selectedTemplateDetails.body,
                            templateParams
                          )}
                        </pre>
                      </Stack>
                    </Box>
                  </Paper>
                )}

                {selectedTemplateDetails && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Template Parameters
                    </Typography>
                    <Stack spacing={2}>
                      {Object.keys(templateParams).map((paramName) => (
                        <Paper
                          key={paramName}
                          sx={{
                            p: 2,
                            bgcolor: "background.default",
                          }}
                        >
                          <Stack spacing={2}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              {paramName}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="flex-start"
                            >
                              <FormControl fullWidth size="small">
                                <InputLabel>Parameter Value</InputLabel>
                                <Select
                                  value={
                                    templateParams[paramName] === "" ||
                                    templateParams[paramName] === "manual"
                                      ? "manual"
                                      : templateParams[paramName]
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Set empty string when manual is selected
                                    setTemplateParams((prev) => ({
                                      ...prev,
                                      [paramName]:
                                        value === "manual" ? "" : value,
                                    }));
                                  }}
                                  label="Parameter Value"
                                >
                                  <MenuItem value="manual">
                                    Enter Manually
                                  </MenuItem>
                                  <MenuItem value="{{guest_name}}">
                                    Guest Name
                                  </MenuItem>
                                  <MenuItem value="{{property_name}}">
                                    Property Name
                                  </MenuItem>
                                </Select>
                              </FormControl>
                              {(templateParams[paramName] === "" ||
                                (templateParams[paramName].startsWith("{{") &&
                                  ![
                                    "{{guest_name}}",
                                    "{{property_name}}",
                                  ].includes(templateParams[paramName]))) && (
                                <TextField
                                  size="small"
                                  fullWidth
                                  placeholder="Enter value..."
                                  value={
                                    templateParams[paramName].startsWith("{{")
                                      ? templateParams[paramName].slice(2, -2)
                                      : templateParams[paramName]
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 200) {
                                      handleParamValueChange(
                                        paramName,
                                        value,
                                        "manual"
                                      );
                                    }
                                  }}
                                  helperText={`${
                                    templateParams[paramName].startsWith("{{")
                                      ? templateParams[paramName].slice(2, -2)
                                          .length
                                      : templateParams[paramName].length
                                  }/200 characters`}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      bgcolor: "background.paper",
                                    },
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </>
            ) : (
              <TextField
                label="Custom Message"
                multiline
                rows={4}
                value={notice}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setNotice(e.target.value);
                  }
                }}
                required
                placeholder="Enter your custom message (max 200 characters)..."
                helperText={`${notice.length}/200 characters`}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.default",
                  },
                }}
              />
            )}

            <LoadingButton
              variant="contained"
              size="large"
              onClick={handleSendToAll}
              startIcon={<WhatsAppIcon />}
              loading={loading.bulk}
              loadingPosition="start"
              disabled={
                !selectedProperties.length ||
                !startDate ||
                !endDate ||
                (messageType === "template" && !templateName) ||
                (messageType === "custom" && !notice)
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
              Send to All Guests
            </LoadingButton>
          </Stack>
        </Paper>

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: "text.primary", mb: 3 }}
          >
            Test Your Notice
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Stack spacing={3}>
            <TextField
              label="Test Phone Number"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="Enter phone number with country code..."
              helperText="Example: 911234567890"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />
            <LoadingButton
              variant="outlined"
              onClick={handleSendTest}
              startIcon={<WhatsAppIcon />}
              loading={loading.test}
              loadingPosition="start"
              disabled={
                !testNumber ||
                (messageType === "template" && !templateName) ||
                (messageType === "custom" && !notice)
              }
              sx={{
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                },
              }}
            >
              Send Test Message
            </LoadingButton>
          </Stack>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={progress.open}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              p: 3,
              textAlign: "center",
            },
          }}
        >
          <Typography variant="h6" gutterBottom>
            Sending Messages
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Progress: {progress.sent} of {progress.total} messages
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(progress.sent / progress.total) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Dialog>

        <Dialog
          open={phoneListDialog.open}
          onClose={() =>
            setPhoneListDialog({ ...phoneListDialog, open: false })
          }
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Guest List</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Convert guests data to CSV
                    const headers = [
                      "Guest Name",
                      "Gender",
                      "Mobile",
                      "Email",
                      "Property",
                    ];
                    const csvData = phoneListDialog.guests.map((guest) => [
                      guest.guest_name || "N/A",
                      guest.guest_gender || "N/A",
                      guest.mobile || "N/A",
                      guest.guest_email || "N/A",
                      guest.property_name || "N/A",
                    ]);

                    // Create CSV content
                    const csvContent = [
                      headers.join(","),
                      ...csvData.map((row) => row.join(",")),
                    ].join("\n");

                    // Create and trigger download
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "guest_list.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  Download Data
                </Button>
                <IconButton
                  onClick={() =>
                    setPhoneListDialog({ ...phoneListDialog, open: false })
                  }
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {phoneListDialog.guests.map((guest, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    bgcolor: "background.default",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {guest.guest_name || "Guest Name Not Available"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {guest.guest_gender} | {guest.mobile} |{" "}
                      {guest.guest_email}
                    </Typography>
                  </Stack>
                  <Chip
                    label={guest.property_name}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      fontWeight: 500,
                    }}
                  />
                </Paper>
              ))}
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default WhatsAppNotices;
