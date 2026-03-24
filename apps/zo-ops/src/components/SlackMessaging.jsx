import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Stack,
  Autocomplete,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Container,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Collapse,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Forum as SlackIcon,
  Upload as UploadIcon,
  Help as HelpIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import {
  sendSlackMessage,
  sendSlackMessageWithFile,
  searchSlackMessages,
  listSlackMessages,
  editSlackMessages,
  deleteSlackMessages,
  generateBroadcastId,
  listSlackMessagesWithBroadcasts,
  editBroadcast,
} from "../services/slackBackendService";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CsvTemplateLink from "../components/CsvTemplateLink";
import { fetchPropertiesData, fetchDefaultRoleData, GOOGLE_SHEET_TEMPLATE_URL } from "../utils/csvUtils";
import { environment } from "../environments/environment";

// Variables that contain Slack user IDs and should be auto-formatted as mentions
const SLACK_USER_ID_VARIABLES = ["POC", "sPOC", "property_manager", "owner"];

/**
 * Format a value for Slack - automatically wraps Slack user IDs as mentions
 * @param {string} value - The value to format
 * @param {string} varName - The variable name (to check if it's a user ID variable)
 * @param {string} originalVariable - The original {{variable}} string in the message
 * @param {string} message - The full message (to check if already wrapped with <@...>)
 * @returns {string} - The formatted value
 */
const formatSlackValue = (value, varName, originalVariable, message) => {
  // If value is empty or the variable wasn't found, return as-is
  if (!value || value === originalVariable) {
    return value;
  }

  // Check if this is a Slack user ID variable
  const isUserIdVariable = SLACK_USER_ID_VARIABLES.includes(varName);

  // Check if the value looks like a Slack user ID (starts with U and is alphanumeric)
  const isSlackUserId = /^U[A-Z0-9]+$/i.test(value);

  // Check if the variable is already wrapped with <@...> in the message
  const isAlreadyMentionFormatted = message.includes(`<@${originalVariable}>`);

  // Auto-format as mention if:
  // 1. It's a known user ID variable OR the value looks like a Slack user ID
  // 2. AND it's not already wrapped with <@...>
  if ((isUserIdVariable || isSlackUserId) && !isAlreadyMentionFormatted) {
    return `<@${value}>`;
  }

  return value;
};

const SlackMessaging = () => {
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [showVariableHelp, setShowVariableHelp] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    missingData: null,
    canProceed: false,
  });
  const [propertiesData, setPropertiesData] = useState([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [pinMessage, setPinMessage] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [propertySelectExpanded, setPropertySelectExpanded] = useState(false);
  const [defaultRoleDataLoaded, setDefaultRoleDataLoaded] = useState(false);
  const [defaultRoleDataCount, setDefaultRoleDataCount] = useState(0);
  const [attachedFile, setAttachedFile] = useState(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackUser, setSlackUser] = useState(null);
  const [checkingSlackStatus, setCheckingSlackStatus] = useState(true);
  const [userId, setUserId] = useState(null);

  // Message History state
  const [messageHistory, setMessageHistory] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectedBroadcasts, setSelectedBroadcasts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editBroadcastDialogOpen, setEditBroadcastDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTemplate, setEditTemplate] = useState("");
  const [currentBroadcast, setCurrentBroadcast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [viewMode, setViewMode] = useState("broadcasts"); // "broadcasts" or "individual"
  const [expandedBroadcasts, setExpandedBroadcasts] = useState(new Set());
  const [historyStartDate, setHistoryStartDate] = useState(null);
  const [historyEndDate, setHistoryEndDate] = useState(null);

  useEffect(() => {
    // Get user ID from auth data
    const authData = localStorage.getItem("auth_data");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Use user ID from auth, or generate a unique identifier
        setUserId(parsed.user?.id || parsed.user_id || parsed.mobile_number || "default");
      } catch (error) {
        console.error("Error parsing auth data:", error);
        setUserId("default");
      }
    }

    const loadProperties = async () => {
      const result = await fetchPropertiesData();
      console.log("Loaded properties data:", result);
      if (!result || !result.properties || result.properties.length === 0) {
        console.error("No properties data loaded");
        return;
      }

      // Add Ops Testing property
      const opsTestingProperty = {
        property_name: "Ops Testing",
        property_code: "OPS_TEST",
        slack_channel_id: "C08SZM2RV32",
        property_type: "Zostel", // Adding it as a Zostel type property
      };

      setPropertiesData([...result.properties, opsTestingProperty]);

      // Set dynamic property types from API
      if (result.propertyTypes && result.propertyTypes.length > 0) {
        setPropertyTypes(result.propertyTypes);
      }
    };
    loadProperties();

    // Auto-load default role data from Google Sheet
    const loadDefaultRoleData = async () => {
      console.log("Loading default role data from Google Sheet...");
      const result = await fetchDefaultRoleData();

      if (result.success && result.propertyCount > 0) {
        console.log(`Loaded default role data for ${result.propertyCount} properties`);
        // Set the role data as initial CSV data
        setCsvData(result.data);
        setDefaultRoleDataLoaded(true);
        setDefaultRoleDataCount(result.propertyCount);
      } else {
        console.warn("Failed to load default role data:", result.error);
      }
    };
    loadDefaultRoleData();
  }, []);

  // Auto-load message history when properties data is available
  useEffect(() => {
    if (propertiesData.length > 0) {
      loadMessageHistory();
    }
  }, [propertiesData]);

  // Check Slack connection status
  useEffect(() => {
    const checkSlackStatus = async () => {
      if (!userId) return;

      setCheckingSlackStatus(true);
      try {
        const response = await fetch(
          `${environment.apiUrl}/api/slack/oauth/status?userId=${encodeURIComponent(userId)}`
        );
        const data = await response.json();

        if (data.success && data.connected) {
          setSlackConnected(true);
          setSlackUser(data.user);
        } else {
          setSlackConnected(false);
          setSlackUser(null);
        }
      } catch (error) {
        console.error("Error checking Slack status:", error);
        setSlackConnected(false);
      } finally {
        setCheckingSlackStatus(false);
      }
    };

    checkSlackStatus();

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const slackConnected = urlParams.get("slack_connected");
    const error = urlParams.get("error");
    const user = urlParams.get("user");

    if (slackConnected === "true") {
      setSnackbar({
        open: true,
        message: `Successfully connected to Slack as ${user || "your account"}!`,
        severity: "success",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh status
      checkSlackStatus();
    } else if (error) {
      setSnackbar({
        open: true,
        message: `Failed to connect Slack: ${error}`,
        severity: "error",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId]);

  const handleConnectSlack = async () => {
    if (!userId) {
      setSnackbar({
        open: true,
        message: "User ID not found. Please log in again.",
        severity: "error",
      });
      return;
    }

    try {
      const response = await fetch(
        `${environment.apiUrl}/api/slack/oauth/connect?userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirect to Slack OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Failed to initiate Slack connection");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to connect Slack: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDisconnectSlack = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${environment.apiUrl}/api/slack/oauth/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setSlackConnected(false);
        setSlackUser(null);
        setSnackbar({
          open: true,
          message: "Slack account disconnected successfully",
          severity: "success",
        });
      } else {
        throw new Error(data.error || "Failed to disconnect Slack");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to disconnect Slack: ${error.message}`,
        severity: "error",
      });
    }
  };

  const zostelProperties = propertiesData.map((p) => p.property_name);

  const handlePropertyTypeSelect = (propertyType) => {
    const isSelected = selectedPropertyTypes.includes(propertyType);
    const allSelected = selectedProperties.length === zostelProperties.length && selectedPropertyTypes.length === 0;
    let newSelectedTypes;
    let newSelectedProperties;

    if (allSelected) {
      // Switching from "All" to a specific type — select only that type
      newSelectedTypes = [propertyType];
      newSelectedProperties = propertiesData
        .filter((p) => p.property_type === propertyType)
        .map((p) => p.property_name);
    } else if (isSelected) {
      newSelectedTypes = selectedPropertyTypes.filter(
        (type) => type !== propertyType
      );
      newSelectedProperties = selectedProperties.filter((prop) => {
        const propData = propertiesData.find((p) => p.property_name === prop);
        return propData && !propData.property_type.includes(propertyType);
      });
    } else {
      newSelectedTypes = [...selectedPropertyTypes, propertyType];
      const propsToAdd = propertiesData
        .filter((p) => p.property_type === propertyType)
        .map((p) => p.property_name);
      newSelectedProperties = [
        ...new Set([...selectedProperties, ...propsToAdd]),
      ];
    }

    setSelectedPropertyTypes(newSelectedTypes);
    setSelectedProperties(newSelectedProperties);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const propertiesToSelect =
        selectedPropertyTypes.length > 0
          ? propertiesData
              .filter((p) => selectedPropertyTypes.includes(p.property_type))
              .map((p) => p.property_name)
          : zostelProperties;
      setSelectedProperties(propertiesToSelect);
    } else {
      setSelectedProperties([]);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Process uploaded CSV and merge with existing default role data
      const parsedData = await parseCSV(file);

      // Merge with existing csvData (which may contain default role data)
      // Uploaded data takes priority, but we keep role data for properties not in the upload
      setCsvData((prevData) => {
        if (!prevData) return parsedData;

        // For each property, merge the uploaded data with existing role data
        const mergedData = { ...prevData };
        Object.keys(parsedData).forEach((propertyName) => {
          mergedData[propertyName] = {
            ...mergedData[propertyName], // Keep existing role data (POC, sPOC, etc.)
            ...parsedData[propertyName], // Override with uploaded data
          };
        });
        return mergedData;
      });
      setCsvUploaded(true);
    } else {
      // If file is cleared, reload default role data
      const roleDataResult = await fetchDefaultRoleData();
      if (roleDataResult.success) {
        setCsvData(roleDataResult.data);
      } else {
        const defaultCsvData = formatPropertiesDataToCSV(propertiesData);
        setCsvData(defaultCsvData);
      }
      setCsvUploaded(false);
    }
  };

  // Handle file attachment for Slack message
  const handleAttachmentUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: "File too large. Maximum size is 10MB.",
          severity: "error",
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    // Reset the file input
    const fileInput = document.getElementById("attachment-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ============================================
  // Message History Handlers
  // ============================================

  // Load message history
  const loadMessageHistory = async (startDate = historyStartDate, endDate = historyEndDate) => {
    setHistoryLoading(true);
    try {
      // Format dates as ISO strings for the API
      const startStr = startDate ? startDate.toISOString().split("T")[0] : null;
      const endStr = endDate ? endDate.toISOString().split("T")[0] : null;
      // Load with broadcast grouping
      const result = await listSlackMessagesWithBroadcasts(null, null, 100, 0, startStr, endStr);
      setMessageHistory(result.messages || []);
      setBroadcasts(result.broadcasts || []);
    } catch (error) {
      console.error("Error loading message history:", error);
      setSnackbar({
        open: true,
        message: `Failed to load message history: ${error.message}`,
        severity: "error",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Search messages
  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) {
      loadMessageHistory();
      return;
    }
    setHistoryLoading(true);
    try {
      const result = await searchSlackMessages(searchQuery.trim(), null, 100, 0);
      setMessageHistory(result.messages || []);
      // When searching, switch to individual view
      setViewMode("individual");
      setSelectedMessages([]);
    } catch (error) {
      console.error("Error searching messages:", error);
      setSnackbar({
        open: true,
        message: `Search failed: ${error.message}`,
        severity: "error",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Toggle message selection
  const handleToggleMessageSelection = (msg) => {
    const key = `${msg.channel}:${msg.ts}`;
    setSelectedMessages((prev) => {
      const isSelected = prev.some((m) => `${m.channel}:${m.ts}` === key);
      if (isSelected) {
        return prev.filter((m) => `${m.channel}:${m.ts}` !== key);
      } else {
        return [...prev, msg];
      }
    });
  };

  // Select all messages
  const handleSelectAllMessages = (event) => {
    if (event.target.checked) {
      setSelectedMessages([...messageHistory]);
    } else {
      setSelectedMessages([]);
    }
  };

  // Normalize Slack user mentions: fix bare IDs like <U123ABC> to <@U123ABC>
  const normalizeSlackMentions = (text) => {
    if (!text) return text;
    // Fix <USERID> (missing @) to <@USERID> for Slack user IDs
    return text.replace(/<(U[A-Z0-9]+)>/gi, (match, userId) => {
      return `<@${userId}>`;
    });
  };

  // Open edit dialog
  const handleOpenEditDialog = () => {
    if (selectedMessages.length === 0) return;
    // Pre-fill with the text of the first selected message,
    // normalizing any bare Slack user IDs to proper <@ID> mention format
    setEditText(normalizeSlackMentions(selectedMessages[0]?.text || ""));
    setEditDialogOpen(true);
  };

  // Edit selected messages
  const handleEditMessages = async () => {
    if (selectedMessages.length === 0 || !editText.trim()) return;

    setActionLoading(true);
    try {
      const messagesToEdit = selectedMessages.map((msg) => ({
        channel: msg.channel,
        ts: msg.ts,
        newText: editText.trim(),
      }));

      const result = await editSlackMessages(messagesToEdit, slackConnected ? userId : null);

      setSnackbar({
        open: true,
        message: `Edited ${result.summary.succeeded} of ${result.summary.total} messages`,
        severity: result.summary.failed > 0 ? "warning" : "success",
      });

      setEditDialogOpen(false);
      setSelectedMessages([]);
      setEditText("");
      loadMessageHistory();
    } catch (error) {
      console.error("Error editing messages:", error);
      setSnackbar({
        open: true,
        message: `Failed to edit messages: ${error.message}`,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open broadcast edit dialog
  const handleOpenBroadcastEditDialog = (broadcast) => {
    setCurrentBroadcast(broadcast);
    setEditTemplate(broadcast.template || "");
    setEditBroadcastDialogOpen(true);
  };

  // Edit a broadcast (re-apply template with variables)
  const handleEditBroadcast = async () => {
    if (!currentBroadcast || !editTemplate.trim()) return;

    setActionLoading(true);
    try {
      const result = await editBroadcast(currentBroadcast.broadcastId, editTemplate.trim(), slackConnected ? userId : null);

      setSnackbar({
        open: true,
        message: `Edited ${result.summary.succeeded} of ${result.summary.total} messages in broadcast`,
        severity: result.summary.failed > 0 ? "warning" : "success",
      });

      setEditBroadcastDialogOpen(false);
      setCurrentBroadcast(null);
      setEditTemplate("");
      loadMessageHistory();
    } catch (error) {
      console.error("Error editing broadcast:", error);
      setSnackbar({
        open: true,
        message: `Failed to edit broadcast: ${error.message}`,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete all messages in a broadcast
  const handleDeleteBroadcast = async (broadcast) => {
    if (!broadcast || !broadcast.messages) return;

    setActionLoading(true);
    try {
      const messagesToDelete = broadcast.messages.map((msg) => ({
        channel: msg.channel,
        ts: msg.ts,
      }));

      const result = await deleteSlackMessages(messagesToDelete, slackConnected ? userId : null);

      setSnackbar({
        open: true,
        message: `Deleted ${result.summary.succeeded} of ${result.summary.total} messages in broadcast`,
        severity: result.summary.failed > 0 ? "warning" : "success",
      });

      loadMessageHistory();
    } catch (error) {
      console.error("Error deleting broadcast:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete broadcast: ${error.message}`,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle broadcast expansion
  const toggleBroadcastExpanded = (broadcastId) => {
    setExpandedBroadcasts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(broadcastId)) {
        newSet.delete(broadcastId);
      } else {
        newSet.add(broadcastId);
      }
      return newSet;
    });
  };

  // Delete selected messages
  const handleDeleteMessages = async () => {
    if (selectedMessages.length === 0) return;

    setActionLoading(true);
    try {
      const messagesToDelete = selectedMessages.map((msg) => ({
        channel: msg.channel,
        ts: msg.ts,
      }));

      const result = await deleteSlackMessages(messagesToDelete, slackConnected ? userId : null);

      setSnackbar({
        open: true,
        message: `Deleted ${result.summary.succeeded} of ${result.summary.total} messages`,
        severity: result.summary.failed > 0 ? "warning" : "success",
      });

      setDeleteDialogOpen(false);
      setSelectedMessages([]);
      loadMessageHistory();
    } catch (error) {
      console.error("Error deleting messages:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete messages: ${error.message}`,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Format date for display
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get property name from channel ID
  const getPropertyNameFromChannel = (channelId) => {
    const property = propertiesData.find((p) => p.slack_channel_id === channelId);
    return property?.property_name || channelId;
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "(No text)";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const updatePreview = (propertyName) => {
    if (!message || !csvData || !propertyName) return message;

    let preview = message;
    const variables = message.match(/{{([^}]+)}}/g) || [];

    variables.forEach((variable) => {
      const varName = variable.slice(2, -2).trim();
      const rawValue = csvData[propertyName]?.[varName] || variable;
      // Auto-format Slack user IDs as mentions
      const value = formatSlackValue(rawValue, varName, variable, message);
      preview = preview.replace(variable, value);
    });

    return preview;
  };

  const handlePreviewClick = () => {
    if (selectedProperties.length > 0) {
      setPreviewMessage(updatePreview(selectedProperties[0]));
    }
  };

  const validateVariables = () => {
    const variables = (message.match(/{{([^}]+)}}/g) || []).map((v) =>
      v.slice(2, -2).trim()
    );

    // If no variables are present, no validation needed
    if (variables.length === 0) {
      return { canProceed: true, missingData: null, requiresCsv: false };
    }

    // Built-in role variables that are auto-loaded from Google Sheet or DB
    const builtInRoleVariables = ["property_manager", "owner", "POC", "sPOC"];
    // Columns that should be skipped entirely (always available)
    const alwaysAvailableColumns = ["operator_name", "slack_channel_id", "property_name"];

    // Check if any variables require CSV upload (i.e., non-built-in variables)
    const customVariables = variables.filter((v) =>
      !alwaysAvailableColumns.includes(v) && !builtInRoleVariables.includes(v)
    );

    // If custom variables are present but no CSV data, user must upload CSV
    if (!csvData && customVariables.length > 0) {
      return {
        canProceed: false,
        requiresCsv: true,
        missingData: {
          "CSV Required": [
            `Please upload a CSV file to use custom variables: ${customVariables.join(", ")}`,
          ],
        },
      };
    }

    // Check ALL variables (both custom and role variables) for missing values
    const variablesToCheck = variables.filter((v) => !alwaysAvailableColumns.includes(v));

    const missingData = selectedProperties.reduce((acc, property) => {
      const propertyData = csvData?.[property];

      const missingVars = variablesToCheck.filter((variable) => {
        if (!propertyData) return true;
        const value = propertyData[variable];
        return value === undefined || value === null || value.trim() === "";
      });

      if (missingVars.length > 0) {
        acc[property] = missingVars;
      }

      return acc;
    }, {});

    const hasMissingData = Object.keys(missingData).length > 0;

    return {
      canProceed: true, // User can always proceed, but with warning
      requiresCsv: false,
      missingData: hasMissingData ? missingData : null,
    };
  };

  const handleSendClick = () => {
    const validation = validateVariables();

    if (!validation.canProceed) {
      // Cannot proceed - must upload CSV first
      setErrorDialog({
        open: true,
        missingData: validation.missingData,
        canProceed: false,
      });
    } else if (validation.missingData) {
      // Can proceed but has warnings about missing data
      setErrorDialog({
        open: true,
        missingData: validation.missingData,
        canProceed: true,
      });
    } else {
      // No issues, go directly to confirm
      setConfirmDialog(true);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // Create channel map from propertiesData
      const channelMap = {};
      propertiesData.forEach((p) => {
        // Ensure we're getting valid channel IDs
        if (!p.slack_channel_id) {
          console.error(`Missing channel ID for property: ${p.property_name}`);
          return;
        }
        channelMap[p.property_name] = p.slack_channel_id;
      });

      // Check if message contains any variables
      const hasVariables = (message.match(/{{([^}]+)}}/g) || []).length > 0;

      // If message has variables but no CSV data, show error
      if (hasVariables && !csvData) {
        setSnackbar({
          open: true,
          message: "Please upload CSV data to use variables in the message",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      // Generate broadcast ID for grouping messages (if sending to multiple channels)
      let broadcastId = null;
      if (selectedProperties.length > 1) {
        try {
          const broadcastResult = await generateBroadcastId();
          broadcastId = broadcastResult.broadcastId;
          console.log(`Generated broadcast ID: ${broadcastId}`);
        } catch (err) {
          console.warn("Failed to generate broadcast ID, continuing without grouping:", err);
        }
      }

      // For messages without variables, we can send directly
      if (!hasVariables) {
        const results = await Promise.all(
          selectedProperties.map(async (prop) => {
            const channelId = channelMap[prop];
            if (!channelId) {
              throw new Error(`No channel ID found for property: ${prop}`);
            }
            console.log(`Sending message with pinMessage=${pinMessage}, hasFile=${!!attachedFile}, broadcastId=${broadcastId}`);
            if (attachedFile) {
              return sendSlackMessageWithFile(channelId, message, attachedFile, pinMessage, slackConnected ? userId : null, broadcastId, message, { property_name: prop });
            }
            return sendSlackMessage(channelId, message, pinMessage, slackConnected ? userId : null, broadcastId, message, { property_name: prop });
          })
        );

        console.log("Messages sent successfully:", results);
        setMessage("");
        setSelectedProperties([]);
        setSelectedPropertyTypes([]);
        setAttachedFile(null);
        setSnackbar({
          open: true,
          message: `Messages sent successfully${attachedFile ? " with file attachment" : ""}${slackConnected ? " from your Slack account" : " from bot account"}!`,
          severity: "success",
        });
        setLoading(false);
        setConfirmDialog(false);
        return;
      }

      // For messages with variables, process with CSV data
      const results = await Promise.all(
        selectedProperties.map(async (prop) => {
          const channelId = channelMap[prop];
          if (!channelId) {
            throw new Error(`No channel ID found for property: ${prop}`);
          }

          // Build variables object for this property
          const variablesObj = csvData[prop] || {};
          variablesObj.property_name = prop;

          let processedMessage = message;
          if (csvData) {
            const variables = message.match(/{{([^}]+)}}/g) || [];
            variables.forEach((variable) => {
              const varName = variable.slice(2, -2).trim();
              const rawValue = csvData[prop]?.[varName] || variable;
              // Auto-format Slack user IDs as mentions
              const value = formatSlackValue(rawValue, varName, variable, message);
              processedMessage = processedMessage.replace(variable, value);
            });
          }

          console.log(`Sending message with pinMessage=${pinMessage}, hasFile=${!!attachedFile}, broadcastId=${broadcastId}`);
          if (attachedFile) {
            return sendSlackMessageWithFile(channelId, processedMessage, attachedFile, pinMessage, slackConnected ? userId : null, broadcastId, message, variablesObj);
          }
          return sendSlackMessage(channelId, processedMessage, pinMessage, slackConnected ? userId : null, broadcastId, message, variablesObj);
        })
      );

      console.log("Messages sent successfully:", results);
      setMessage("");
      setSelectedProperties([]);
      setSelectedPropertyTypes([]);
      setAttachedFile(null);
      setSnackbar({
        open: true,
        message: `Messages sent successfully${attachedFile ? " with file attachment" : ""}!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to send messages:", error);
      setSnackbar({
        open: true,
        message: `Failed to send messages: ${error.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setConfirmDialog(false);
    }
  };

  // Add this function to format the properties data into csvData format
  const formatPropertiesDataToCSV = (data) => {
    const formattedData = {};
    data.forEach((property) => {
      formattedData[property.property_name] = {
        property_name: property.property_name,
        slack_channel_id: property.slack_channel_id,
        property_type: property.property_type,
        property_code: property.property_code,
      };
    });
    return formattedData;
  };

  // Fix the parseCSV function to include property_name in the data
  const parseCSV = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const lines = csvText.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          const data = {};

          lines.slice(1).forEach((line) => {
            if (!line.trim()) return; // Skip empty lines
            const values = line.split(",").map((v) => v.trim());
            const property = values[0];
            if (!property) return; // Skip if no property name

            data[property] = {};
            headers.forEach((header, index) => {
              data[property][header] = values[index] || "";
            });
          });

          resolve(data);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  return (
    <Container>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: "#FFFFFF",
          }}
        >
          Slack Messaging
        </Typography>

        {/* Slack Connection Status */}
        <Paper
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            bgcolor: slackConnected ? "success.dark" : "background.paper",
            border: "1px solid",
            borderColor: slackConnected ? "success.main" : "divider",
          }}
        >
          {checkingSlackStatus ? (
            <Typography variant="body2" color="text.secondary">
              Checking connection...
            </Typography>
          ) : slackConnected ? (
            <>
              <CheckCircleIcon sx={{ color: "success.main" }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.primary" fontWeight="bold">
                  Sending as {slackUser?.name || "you"}{slackUser?.team ? ` (${slackUser.team})` : ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Messages will appear from your account in all channels
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkOffIcon />}
                onClick={handleDisconnectSlack}
                sx={{
                  color: "error.main",
                  borderColor: "error.main",
                  "&:hover": {
                    borderColor: "error.dark",
                    bgcolor: "error.dark",
                    color: "white",
                  },
                }}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <LinkIcon sx={{ color: "text.secondary" }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.primary" fontWeight="bold">
                  Send messages on your behalf
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Connect your Slack to send messages as yourself. Without this, messages will be sent via the bot account.
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={handleConnectSlack}
                sx={{
                  bgcolor: "primary.main",
                  color: "rgb(20, 20, 20)",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                Connect Slack
              </Button>
            </>
          )}
        </Paper>
      </Box>

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
            {/* Variables status — compact by default */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  {defaultRoleDataLoaded
                    ? <>Variables auto-loaded for {defaultRoleDataCount} properties — use <strong>{"{{POC}}"}</strong>, <strong>{"{{sPOC}}"}</strong>, <strong>{"{{property_manager}}"}</strong>, <strong>{"{{owner}}"}</strong> in messages</>
                    : "Loading role data..."}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  href={GOOGLE_SHEET_TEMPLATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: "none", minWidth: "auto", px: 0.5 }}
                >
                  Source Sheet
                </Button>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {csvUploaded && (
                  <Chip size="small" label="Custom CSV loaded" color="primary" />
                )}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Tooltip title="Upload a CSV to add extra variables beyond the defaults (e.g. custom fields per property)">
                    <Button
                      component="span"
                      variant="text"
                      size="small"
                      startIcon={<UploadIcon />}
                    >
                      {csvUploaded ? "Replace CSV" : "Add More Variables via CSV"}
                    </Button>
                  </Tooltip>
                </label>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom color="text.primary">
              1. Select Properties
            </Typography>

            <Stack spacing={2}>
              {/* Property Type Filters */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Quick Select by Property Type:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Chip
                    label={`All (${zostelProperties.length})`}
                    onClick={() => {
                      if (selectedProperties.length === zostelProperties.length) {
                        setSelectedProperties([]);
                        setSelectedPropertyTypes([]);
                      } else {
                        setSelectedProperties([...zostelProperties]);
                        setSelectedPropertyTypes([]);
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      bgcolor: selectedProperties.length === zostelProperties.length
                        ? "primary.main"
                        : "background.paper",
                      color: selectedProperties.length === zostelProperties.length
                        ? "rgb(20, 20, 20)"
                        : "text.primary",
                      "&:hover": {
                        bgcolor: selectedProperties.length === zostelProperties.length
                          ? "primary.dark"
                          : "background.paper",
                      },
                    }}
                  />
                  {propertyTypes.map((type) => (
                    <Chip
                      key={type}
                      label={`${type} (${
                        propertiesData.filter((p) => p.property_type === type)
                          .length
                      })`}
                      onClick={() => handlePropertyTypeSelect(type)}
                      color={
                        selectedPropertyTypes.includes(type)
                          ? "primary"
                          : "default"
                      }
                      sx={{
                        cursor: "pointer",
                        bgcolor: selectedPropertyTypes.includes(type)
                          ? "primary.main"
                          : "background.paper",
                        color: selectedPropertyTypes.includes(type)
                          ? "rgb(20, 20, 20)"
                          : "text.primary",
                        "&:hover": {
                          bgcolor: selectedPropertyTypes.includes(type)
                            ? "primary.dark"
                            : "background.paper",
                        },
                      }}
                    />
                  ))}
                  {selectedPropertyTypes.length > 0 && (
                    <Chip
                      label="Clear"
                      onClick={() => {
                        setSelectedPropertyTypes([]);
                        setSelectedProperties([]);
                      }}
                      sx={{
                        cursor: "pointer",
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* Property Selection */}
              <Box>
                {!propertySelectExpanded ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      cursor: "pointer",
                      "&:hover": { borderColor: "primary.main" },
                      transition: "border-color 0.15s",
                    }}
                    onClick={() => setPropertySelectExpanded(true)}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      {selectedProperties.length > 0
                        ? <><strong>{selectedProperties.length}</strong> properties selected — <span style={{ opacity: 0.7 }}>{selectedProperties.slice(0, 3).join(", ")}{selectedProperties.length > 3 ? `, +${selectedProperties.length - 3} more` : ""}</span></>
                        : "No properties selected — click to choose"}
                    </Typography>
                    <EditIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </Box>
                ) : (
                  <Box>
                    <Autocomplete
                      multiple
                      options={zostelProperties}
                      value={selectedProperties}
                      onChange={(event, newValue) =>
                        setSelectedProperties(newValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Properties"
                          placeholder="Type to search..."
                          autoFocus
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setPropertySelectExpanded(false)}
                      >
                        Done
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="h6"
              gutterBottom
              color="text.primary"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              2. Compose Message
              <Tooltip title="Click to see available variables">
                <IconButton
                  size="small"
                  onClick={() => setShowVariableHelp(true)}
                >
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <TextField
              multiline
              minRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Enter your message... Use {{POC}}, {{sPOC}}, {{property_manager}}, {{owner}} to mention respective users. You can also add more variables with a CSV and mention {{variables}} to include that in your messages."
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />
            <Button
              variant="text"
              onClick={handlePreviewClick}
              sx={{ mt: 1 }}
              disabled={(() => {
                if (!message || !selectedProperties.length) return true;

                // Check if message has variables
                const variables = (message.match(/{{([^}]+)}}/g) || []).map((v) =>
                  v.slice(2, -2).trim()
                );
                if (variables.length === 0) return false;

                // Built-in variables don't require CSV
                const builtInVars = ["property_manager", "owner", "POC", "sPOC", "property_name"];
                const hasOnlyBuiltInVars = variables.every((v) => builtInVars.includes(v));
                if (hasOnlyBuiltInVars && defaultRoleDataLoaded) return false;

                return !csvData;
              })()}
            >
              Preview with variables
            </Button>
            {previewMessage && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "background.default" }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Preview for {selectedProperties[0]}:
                </Typography>
                <Typography>{previewMessage}</Typography>
              </Paper>
            )}
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="text.primary">
              3. Attach File (Optional)
            </Typography>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: attachedFile ? "primary.main" : "divider",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: attachedFile ? "primary.dark" : "background.default",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleAttachmentUpload}
                style={{ display: "none" }}
                id="attachment-upload"
              />
              {!attachedFile ? (
                <>
                  <label htmlFor="attachment-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                    >
                      Attach File
                    </Button>
                  </label>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Supported: Images, PDFs, Word, Excel, PowerPoint, CSV, ZIP (Max 10MB)
                  </Typography>
                </>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <FileIcon sx={{ fontSize: 40, color: "primary.main" }} />
                  <Box sx={{ textAlign: "left" }}>
                    <Typography variant="body1" color="text.primary" fontWeight="bold">
                      {attachedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(attachedFile.size)}
                    </Typography>
                  </Box>
                  <Tooltip title="Remove attachment">
                    <IconButton
                      onClick={handleRemoveAttachment}
                      size="small"
                      sx={{
                        color: "error.main",
                        "&:hover": {
                          bgcolor: "error.dark",
                          color: "white",
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {attachedFile && (
              <Alert severity="info" sx={{ mt: 2 }}>
                The same file will be attached to all {selectedProperties.length || 0} selected channels.
              </Alert>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pinMessage}
                  onChange={(e) => setPinMessage(e.target.checked)}
                />
              }
              label="Pin to channel"
            />
          </Box>

          <LoadingButton
            variant="contained"
            size="large"
            onClick={handleSendClick}
            startIcon={attachedFile ? <AttachFileIcon /> : <SlackIcon />}
            loading={loading}
            loadingPosition="start"
            disabled={(() => {
              if (!selectedProperties.length) return true;
              if (!message && !attachedFile) return true;

              // Check if message has variables
              const variables = (message.match(/{{([^}]+)}}/g) || []).map((v) =>
                v.slice(2, -2).trim()
              );
              if (variables.length === 0) return false;

              // Built-in variables don't require CSV upload
              const builtInVars = ["property_manager", "owner", "POC", "sPOC", "property_name"];
              const hasOnlyBuiltInVars = variables.every((v) => builtInVars.includes(v));

              // Allow if only built-in variables and role data is loaded
              if (hasOnlyBuiltInVars && defaultRoleDataLoaded) return false;

              // Require CSV data for custom variables
              return !csvData;
            })()}
            sx={{
              py: 1.5,
              backgroundColor: "primary.main",
              color: "rgb(20, 20, 20)",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            {attachedFile ? "Send with Attachment" : "Send Message"}
          </LoadingButton>
        </Stack>
      </Paper>

      {/* Message History Section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mt: 4,
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon /> Message History
            </Typography>
            <Tooltip title="Refresh message history">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadMessageHistory}
                disabled={historyLoading}
              >
                Refresh
              </Button>
            </Tooltip>
          </Box>

          {/* Date Filters + Search Bar */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From"
                value={historyStartDate}
                onChange={(date) => {
                  setHistoryStartDate(date);
                  loadMessageHistory(date, historyEndDate);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: 160, "& .MuiOutlinedInput-root": { bgcolor: "background.default" } },
                  },
                  field: { clearable: true },
                }}
                maxDate={historyEndDate || undefined}
              />
              <DatePicker
                label="To"
                value={historyEndDate}
                onChange={(date) => {
                  setHistoryEndDate(date);
                  loadMessageHistory(historyStartDate, date);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: 160, "& .MuiOutlinedInput-root": { bgcolor: "background.default" } },
                  },
                  field: { clearable: true },
                }}
                minDate={historyStartDate || undefined}
              />
            </LocalizationProvider>
            <TextField
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearchMessages();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.default",
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearchMessages}
              disabled={historyLoading}
              sx={{
                bgcolor: "primary.main",
                color: "rgb(20, 20, 20)",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              Search
            </Button>
          </Box>

          {/* View Toggle and Action Buttons */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="broadcasts">
                <ViewModuleIcon sx={{ mr: 0.5 }} /> Broadcasts
              </ToggleButton>
              <ToggleButton value="individual">
                <ViewListIcon sx={{ mr: 0.5 }} /> Individual
              </ToggleButton>
            </ToggleButtonGroup>

            {viewMode === "individual" && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEditDialog}
                  disabled={selectedMessages.length === 0}
                >
                  Edit Selected ({selectedMessages.length})
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={selectedMessages.length === 0}
                >
                  Delete Selected ({selectedMessages.length})
                </Button>
                {selectedMessages.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedMessages.length} message(s) selected
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Messages Display - Broadcasts or Individual */}
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewMode === "broadcasts" ? (
            /* Broadcast View */
            broadcasts.length === 0 ? (
              <Alert severity="info">
                No broadcasts found. Send a message to multiple channels to create a broadcast.
                {messageHistory.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Note: {messageHistory.length} individual messages found. Switch to "Individual" view to see them.
                  </Typography>
                )}
              </Alert>
            ) : (
              <Stack spacing={2}>
                {broadcasts.map((broadcast) => {
                  const isExpanded = expandedBroadcasts.has(broadcast.broadcastId);
                  return (
                    <Card key={broadcast.broadcastId} variant="outlined" sx={{ "&:hover": { borderColor: "primary.main" }, transition: "border-color 0.15s" }}>
                      <CardContent
                        sx={{ pb: 1, cursor: "pointer", "&:last-child": { pb: 1 } }}
                        onClick={() => toggleBroadcastExpanded(broadcast.broadcastId)}
                      >
                        {/* Top row: chips + date + actions */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Chip size="small" label={`${broadcast.channelCount} channels`} color="primary" />
                          <Chip size="small" label={broadcast.source === "user" ? "User" : "Bot"} color={broadcast.source === "user" ? "success" : "default"} />
                          <Typography variant="caption" color="text.secondary">
                            {formatMessageDate(broadcast.sentAt)}
                          </Typography>
                          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Edit Broadcast">
                              <IconButton size="small" onClick={() => handleOpenBroadcastEditDialog(broadcast)}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Broadcast">
                              <IconButton size="small" onClick={() => handleDeleteBroadcast(broadcast)} disabled={actionLoading} sx={{ color: "error.main" }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {isExpanded ? (
                            <ExpandLessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                          )}
                        </Box>

                        {/* Message preview (truncated) or full message (expanded) */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            bgcolor: "background.default",
                            p: 1,
                            borderRadius: 1,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            ...(!isExpanded && {
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }),
                          }}
                        >
                          {broadcast.template || broadcast.messages[0]?.text || "(No text)"}
                        </Typography>

                        {/* Property name chips */}
                        {broadcast.propertyNames && broadcast.propertyNames.length > 0 && (
                          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {broadcast.propertyNames.slice(0, isExpanded ? broadcast.propertyNames.length : 5).map((name) => (
                              <Chip key={name} label={name} size="small" variant="outlined" />
                            ))}
                            {!isExpanded && broadcast.propertyNames.length > 5 && (
                              <Chip label={`+${broadcast.propertyNames.length - 5} more`} size="small" variant="outlined" />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )
          ) : (
            /* Individual Messages View */
            messageHistory.length === 0 ? (
              <Alert severity="info">
                No messages found. Messages you send through this tool will appear here.
              </Alert>
            ) : (
              <TableContainer>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedMessages.length > 0 &&
                            selectedMessages.length < messageHistory.length
                          }
                          checked={
                            messageHistory.length > 0 &&
                            selectedMessages.length === messageHistory.length
                          }
                          onChange={handleSelectAllMessages}
                        />
                      </TableCell>
                      <TableCell>Channel/Property</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Sent At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messageHistory.map((msg) => {
                      const key = `${msg.channel}:${msg.ts}`;
                      const isSelected = selectedMessages.some(
                        (m) => `${m.channel}:${m.ts}` === key
                      );
                      return (
                        <TableRow
                          key={key}
                          hover
                          onClick={() => handleToggleMessageSelection(msg)}
                          selected={isSelected}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={msg.channel}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {getPropertyNameFromChannel(msg.channel)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={msg.text || "(No text)"}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                                {truncateText(msg.text, 40)}
                              </Typography>
                            </Tooltip>
                            {msg.fileName && (
                              <Chip
                                size="small"
                                icon={<FileIcon />}
                                label={msg.fileName}
                                sx={{ ml: 1 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={msg.source === "user" ? "User" : "Bot"}
                              color={msg.source === "user" ? "primary" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {formatMessageDate(msg.sentAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          <Typography variant="body2" color="text.secondary">
            {viewMode === "broadcasts"
              ? `Showing ${broadcasts.length} broadcasts (${messageHistory.length} total messages)`
              : `Showing ${messageHistory.length} messages`}{historyStartDate || historyEndDate ? ` (${historyStartDate ? historyStartDate.toLocaleDateString() : "..."} – ${historyEndDate ? historyEndDate.toLocaleDateString() : "..."})` : " (last 30 days)"}
          </Typography>
        </Stack>
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit {selectedMessages.length} Message(s)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The new text will replace the content of all selected messages.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter new message text..."
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.default",
              },
            }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will edit {selectedMessages.length} message(s) across{" "}
            {new Set(selectedMessages.map((m) => m.channel)).size} channel(s).
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleEditMessages}
            loading={actionLoading}
            variant="contained"
            disabled={!editText.trim()}
            sx={{
              bgcolor: "primary.main",
              color: "rgb(20, 20, 20)",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Edit Messages
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Broadcast Edit Dialog */}
      <Dialog
        open={editBroadcastDialogOpen}
        onClose={() => setEditBroadcastDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Broadcast ({currentBroadcast?.channelCount || 0} channels)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Edit the template below. Variables like {"{{POC}}"}, {"{{sPOC}}"}, {"{{property_name}}"} will be replaced with the original values for each channel.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={editTemplate}
            onChange={(e) => setEditTemplate(e.target.value)}
            placeholder="Enter new template..."
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.default",
                fontFamily: "monospace",
              },
            }}
          />
          {currentBroadcast && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Properties in this broadcast:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {currentBroadcast.propertyNames?.map((name) => (
                  <Chip key={name} label={name} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            This will update all {currentBroadcast?.channelCount || 0} messages in this broadcast.
            Each message will be updated with the new template, keeping the original variable values.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBroadcastDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleEditBroadcast}
            loading={actionLoading}
            variant="contained"
            disabled={!editTemplate.trim()}
            sx={{
              bgcolor: "primary.main",
              color: "rgb(20, 20, 20)",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Update All Messages
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main" }}>
          Delete {selectedMessages.length} Message(s)?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. The messages will be permanently deleted
            from Slack.
          </Alert>
          <Typography variant="body2" gutterBottom>
            You are about to delete {selectedMessages.length} message(s) from{" "}
            {new Set(selectedMessages.map((m) => m.channel)).size} channel(s):
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: "auto", mt: 2 }}>
            {selectedMessages.slice(0, 10).map((msg) => (
              <Box
                key={`${msg.channel}:${msg.ts}`}
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: "background.default",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {getPropertyNameFromChannel(msg.channel)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {truncateText(msg.text, 60)}
                </Typography>
              </Box>
            ))}
            {selectedMessages.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ...and {selectedMessages.length - 10} more
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleDeleteMessages}
            loading={actionLoading}
            variant="contained"
            color="error"
          >
            Delete Messages
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showVariableHelp}
        onClose={() => setShowVariableHelp(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Using Variables in Messages</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Use double curly braces to insert variables in your message. For
            example:
          </Typography>
          <Box
            component="pre"
            sx={{ bgcolor: "background.default", p: 2, borderRadius: 1, whiteSpace: "pre-wrap" }}
          >
            {
              "Hello team at {{property_name}}!\n\nPlease contact {{POC}} for operational queries or {{sPOC}} for escalations."
            }
          </Box>

          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Auto-mention:</strong> User ID variables like {"{{POC}}"}, {"{{sPOC}}"}, {"{{property_manager}}"}, and {"{{owner}}"} are automatically converted to @mentions in Slack.
            </Typography>
          </Alert>

          <Typography variant="subtitle2" color="text.primary" sx={{ mt: 2, mb: 1 }}>
            Built-in Variables (Auto-loaded):
          </Typography>
          <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
            <Typography variant="body2" component="div">
              <strong>{"{{POC}}"}</strong> or <strong>{"{{property_manager}}"}</strong> - Property Manager (auto @mention)
              <br />
              <strong>{"{{sPOC}}"}</strong> or <strong>{"{{owner}}"}</strong> - Owner (auto @mention)
              <br />
              <strong>{"{{property_name}}"}</strong> - Property name (text only)
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            For custom variables, upload a CSV file with column headers matching
            your variable names (excluding property_name and slack_channel_id).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVariableHelp(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Messages</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Selected Properties ({selectedProperties.length}):
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedProperties.map((prop) => (
                  <Chip
                    key={prop}
                    label={prop}
                    size="small"
                    sx={{ bgcolor: "background.default" }}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Message Preview (for {selectedProperties[0]}):
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Typography>{updatePreview(selectedProperties[0]) || "(No message - file only)"}</Typography>
              </Paper>
            </Box>
            {attachedFile && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  File Attachment:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "background.default",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <FileIcon sx={{ color: "primary.main" }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {attachedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(attachedFile.size)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleSend}
            loading={loading}
            variant="contained"
            startIcon={attachedFile ? <AttachFileIcon /> : null}
            sx={{
              backgroundColor: "primary.main",
              color: "rgb(20, 20, 20)",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            {attachedFile ? "Confirm & Send with File" : "Confirm & Send"}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: errorDialog.canProceed ? "warning.main" : "error.main" }}>
          {errorDialog.canProceed ? "⚠️ Missing Variable Values" : "Missing Variable Values"}
        </DialogTitle>
        <DialogContent>
          {errorDialog.canProceed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some properties have missing values. Messages to these properties will be sent with empty values for the missing variables.
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fix the following issues before sending.
            </Alert>
          )}

          <Typography variant="body2" gutterBottom sx={{ fontWeight: "bold" }}>
            Properties with missing values:
          </Typography>

          <Box sx={{ maxHeight: 300, overflow: "auto", mt: 1 }}>
            {errorDialog.missingData &&
              Object.entries(errorDialog.missingData).map(
                ([property, variables]) => (
                  <Box key={property} sx={{ mt: 2, p: 1.5, bgcolor: "background.default", borderRadius: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      gutterBottom
                    >
                      {property}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {variables.map((variable, index) => (
                        <Chip
                          key={index}
                          label={`{{${variable}}}`}
                          size="small"
                          color={errorDialog.canProceed ? "warning" : "error"}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )
              )}
          </Box>

          {errorDialog.canProceed && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Total: {errorDialog.missingData ? Object.keys(errorDialog.missingData).length : 0} of {selectedProperties.length} properties affected
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setErrorDialog({ ...errorDialog, open: false })}
          >
            {errorDialog.canProceed ? "Cancel" : "Close"}
          </Button>
          {errorDialog.canProceed && (
            <Button
              onClick={() => {
                setErrorDialog({ ...errorDialog, open: false });
                setConfirmDialog(true);
              }}
              variant="contained"
              color="warning"
            >
              Send Anyway
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SlackMessaging;
