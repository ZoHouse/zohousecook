import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Autocomplete,
  TextField,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Skeleton,
  Checkbox,
  Snackbar,
  Alert,
  Modal,
  InputBase,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  Box as MuiBox,
  LinearProgress,
} from "@mui/material";
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Star,
  WhatsApp,
  Phone,
  Visibility,
  ExitToApp,
  Group,
  RateReview,
  Search as SearchIcon,
  Close,
  Warning,
  ExpandMore,
  Phone as PhoneIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  WhatsApp as WhatsAppIcon,
  Download as DownloadIcon,
  Smartphone as SmartphoneIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Hotel as HotelIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
  ListAlt as ListAltIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { alpha, useTheme } from "@mui/material/styles";
import { useRouter } from "next/router";
import Link from "next/link";
import { usePDF } from "react-to-pdf";
import { environment } from "../environments/environment";
import {
  setCacheData,
  clearCache,
  CACHE_KEYS,
} from "../utils/cacheUtils";
// Report generator is imported dynamically to avoid SSR issues (jsPDF uses browser APIs)

// Module-level cache — survives component unmount/remount (page navigation)
// Only cleared on full page refresh or explicit clear
const sessionDataCache = new Map();

// Add this date format helper function at the top of the component
const formatDate = (date) => {
  return date.toLocaleDateString("en-GB"); // This will format as DD/MM/YYYY
};

// Update the formatDateRange function to handle undefined or null dates
const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "No previous period data";

  const formatDate = (dateStr) => {
    // Parse the date string in YYYY-MM-DD format
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-based in JS Date
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Update SummaryCard component to handle undefined dateRange
const SummaryCard = ({ title, value, icon, subtitle, trend, dateRange }) => {
  const calculateTrend = () => {
    if (!trend) return null;
    const { current, previous } = trend;
    if (previous === 0)
      return { value: 100, direction: "up", difference: current };
    const percentage = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(percentage).toFixed(1),
      direction: percentage >= 0 ? "up" : "down",
      difference: current - previous,
    };
  };

  const trendData = calculateTrend();

  return (
    <Card sx={{ height: "100%", minHeight: 120 }}>
      <CardContent sx={{ height: "100%", p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ color: "primary.main" }}>{icon}</Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Stack>
          {typeof value === "string" ? (
            <Stack spacing={0.5}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
              {trendData && dateRange && (
                <Tooltip
                  title={`Previous period: ${formatDateRange(
                    dateRange.start_date,
                    dateRange.end_date
                  )}`}
                  arrow
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          trendData.direction === "up"
                            ? "success.main"
                            : "error.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {trendData.direction === "up" ? "↑" : "↓"}{" "}
                      {trendData.value}% ({trendData.difference > 0 ? "+" : ""}
                      {trendData.difference.toLocaleString()})
                    </Typography>
                  </Stack>
                </Tooltip>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Stack>
          ) : (
            value
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Add calculateAverageRating helper function
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;

  const totalRating = reviews.reduce(
    (sum, review) => sum + parseInt(review.review_rating),
    0
  );
  return (totalRating / reviews.length).toFixed(2);
};

const BreadcrumbNavigation = ({ selectedProperty, onPropertyClick, rank, totalProperties }) => {
  const router = useRouter();
  const isSharedView = router.query.view === "shared";

  const getRankDisplay = () => {
    if (!rank || rank <= 0 || selectedProperty === "All Properties") return null;
    const isTop3 = rank <= 3;
    const isBottom3 = totalProperties && rank > totalProperties - 3;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
    const rankText = totalProperties ? `#${rank}/${totalProperties}` : `#${rank}`;

    if (isTop3) {
      return (
        <Chip
          label={`${medal} ${rankText}`}
          size="small"
          sx={{
            ml: 1.5,
            fontWeight: 700,
            fontSize: 14,
            height: 30,
            bgcolor: rank === 1 ? "rgba(255,215,0,0.15)" : rank === 2 ? "rgba(192,192,192,0.15)" : "rgba(205,127,50,0.15)",
            color: rank === 1 ? "#B8860B" : rank === 2 ? "#71706E" : "#8B4513",
            border: `1px solid ${rank === 1 ? "rgba(255,215,0,0.4)" : rank === 2 ? "rgba(192,192,192,0.4)" : "rgba(205,127,50,0.4)"}`,
          }}
        />
      );
    }
    if (isBottom3) {
      return (
        <Chip
          icon={<Warning sx={{ fontSize: 14 }} />}
          label={rankText}
          size="small"
          sx={{
            ml: 1.5,
            fontWeight: 600,
            fontSize: 13,
            height: 30,
            bgcolor: "rgba(235,87,87,0.1)",
            color: "error.main",
            border: "1px solid rgba(235,87,87,0.3)",
          }}
        />
      );
    }
    return (
      <Chip
        label={rankText}
        size="small"
        variant="outlined"
        sx={{
          ml: 1.5,
          fontWeight: 600,
          fontSize: 13,
          height: 30,
          color: "text.secondary",
          borderColor: "divider",
        }}
      />
    );
  };

  if (isSharedView) {
    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="h6" color="text.primary">
          {selectedProperty}
        </Typography>
        {getRankDisplay()}
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <MuiLink
          component="button"
          variant="body1"
          onClick={() => {
            router.push("/reviews");
            onPropertyClick("All Properties");
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            color: "text.primary",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <RateReview sx={{ mr: 0.5 }} fontSize="inherit" />
          All Properties
        </MuiLink>
        {selectedProperty !== "All Properties" && (
          <Stack direction="row" alignItems="center">
            <Typography
              variant="body1"
              color="primary"
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {selectedProperty}
            </Typography>
            {getRankDisplay()}
          </Stack>
        )}
      </Breadcrumbs>
    </Paper>
  );
};

const PDFContent = ({
  selectedProperty,
  dateRange,
  displayData,
  theme,
  isDateRangeOver90Days,
}) => {
  return (
    <div style={{ padding: "0mm", backgroundColor: "#ffffff" }}>
      {/* PDF Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        style={{ marginBottom: "10mm" }}
      >
        <Typography variant="h5" style={{ color: "#000000" }}>
          {selectedProperty}
        </Typography>
        <Typography variant="body1" style={{ color: "#000000" }}>
          {formatDate(dateRange[0])} - {formatDate(dateRange[1])}
        </Typography>
      </Stack>

      {/* Summary KPIs */}
      <Grid
        container
        spacing={3}
        sx={{
          mb: 3,
        }}
      >
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <SummaryCard
            title="Guests"
            value={displayData.reviews.total_guests.toLocaleString()}
            icon={<Group />}
            trend={{
              current: displayData.reviews.total_guests,
              previous: displayData.reviews.previous_period?.total_guests || 0,
            }}
            dateRange={displayData.reviews.previous_period}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <SummaryCard
            title="Checkouts"
            value={displayData.reviews.checkouts.toLocaleString()}
            icon={<ExitToApp />}
            trend={{
              current: displayData.reviews.checkouts,
              previous: displayData.reviews.previous_period?.checkouts || 0,
            }}
            dateRange={displayData.reviews.previous_period}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <SummaryCard
            title="Total Reviews"
            value={(displayData.reviews.count || 0).toLocaleString()}
            icon={<RateReview />}
            trend={{
              current: displayData.reviews.count || 0,
              previous: displayData.reviews.previous_period?.count || 0,
            }}
            dateRange={displayData.reviews.previous_period}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3}>
          <SummaryCard
            title="Review Rate"
            subtitle="reviews / guests"
            value={`${(
              ((displayData.reviews.count || 0) /
                (displayData.reviews.total_guests || 1)) *
              100
            ).toFixed(1)}%`}
            icon={<Timeline />}
            trend={{
              current:
                ((displayData.reviews.count || 0) /
                  (displayData.reviews.total_guests || 1)) *
                100,
              previous:
                ((displayData.reviews.previous_period?.count || 0) /
                  (displayData.reviews.previous_period?.total_guests || 1)) *
                100,
            }}
            dateRange={displayData.reviews.previous_period}
          />
        </Grid>
      </Grid>

    </div>
  );
};

// ─── Shared Review Tag Configuration ─────────────────────────────────────────
// Comprehensive keyword maps built from 90-day review analysis across all properties.
// Used by both the summary section (top) and individual review cards.
//
// IMPORTANT: Uses word-boundary matching to prevent substring false positives.
// e.g. "ac" won't match inside "reach", "activities", "attached"
// "tea" won't match inside "team", "rat" won't match inside "rather"

/**
 * Word-boundary-aware keyword matching.
 * - Multi-word phrases: uses includes() (specific enough to avoid false positives)
 * - Short keywords (≤4 chars): strict word boundary on both sides (\bword\b)
 * - Longer keywords (5+ chars): word boundary at start only (\bword) to allow inflections
 *   e.g. "clean" matches "cleaning", "cleanliness" but not "unclean" (add separately)
 */
const kwMatch = (text, keyword) => {
  if (keyword.includes(" ")) return text.includes(keyword);
  try {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Short words: exact match only. Longer words: allow suffixes (inflections)
    const pattern = keyword.length <= 4 ? `\\b${escaped}\\b` : `\\b${escaped}`;
    return new RegExp(pattern, "i").test(text);
  } catch {
    return text.includes(keyword);
  }
};

const NEGATIVE_TAG_KEYWORDS = {
  "Cleanliness": ["dirty", "unclean", "dusty", "stain", "stains", "stained", "hygiene", "filthy", "smelly", "smell", "smells", "messy", "gross", "mold", "mould", "not clean", "cleaning", "cleanly", "garbage", "trash", "litter", "swept", "cobweb", "fungus", "unhygienic", "grimy"],
  "Bathroom": ["bathroom", "toilet", "shower", "washroom", "wash room", "plumbing", "drainage", "basin", "commode", "flush", "drain", "clogged", "leaking tap"],
  "Hot Water": ["hot water", "geyser", "no water", "water pressure", "warm water", "cold water", "water supply", "running water"],
  "Bedding": ["mattress", "pillow", "blanket", "bedsheet", "bedding", "duvet", "comforter", "thin blanket", "hard mattress", "lumpy", "bed was", "beds were", "uncomfortable bed", "bed bug", "linen"],
  "Room Quality": ["cupboard", "locker", "curtain", "cramped", "small room", "dark room", "stuffy", "wardrobe", "storage", "plug point", "charging point", "socket", "switch board"],
  "Food & Dining": ["food", "breakfast", "kitchen", "taste", "tasted", "stale", "canteen", "dinner", "lunch", "snack", "cafe", "menu", "cook", "cooked", "chai", "coffee", "oily", "bland", "cold food", "limited menu", "overcooked", "undercooked", "portion", "dal", "rice"],
  "Staff & Service": ["rude", "unhelpful", "unprofessional", "attitude", "behaviour", "behavior", "arrogant", "ignored", "careless", "disrespectful", "impolite", "manager", "staff", "reception", "caretaker", "yelled", "shouted"],
  "Check-in/out": ["check in", "checkin", "check-in", "checkout", "check out", "check-out", "late check", "early check", "id verification", "otp", "verification"],
  "WiFi": ["wifi", "wi-fi", "internet", "connectivity", "signal", "slow wifi", "no wifi", "wifi not working"],
  "Noise": ["noise", "noisy", "loud", "disturb", "disturbed", "disturbing", "party", "construction", "traffic", "barking", "snoring", "thin walls"],
  "AC & Heating": ["air condition", "air conditioning", "heater", "heating system", "cooler", "too hot", "too cold", "freezing room"],
  "Maintenance": ["broken", "repair", "leak", "leaking", "damage", "damaged", "maintenance", "not working", "malfunction", "rust", "rusted", "cracked", "peeling", "worn out"],
  "Safety & Security": ["safety", "security", "theft", "steal", "stolen", "cctv", "guard", "unsafe", "suspicious", "locked out"],
  "Value for Money": ["expensive", "overpriced", "not worth", "price", "charge", "charged", "refund", "hidden charge", "extra charge", "overcharged", "ripoff", "rip off"],
  "Location & Transport": ["location", "transport", "remote", "distance", "shuttle", "rickshaw", "difficult to reach", "isolated", "uphill", "steep", "stairs", "luggage", "far from", "far away"],
  "Amenities": ["towel", "charger", "parking", "washing machine", "laundry", "mirror", "dustbin", "hanger", "slippers", "bucket"],
  "Misleading Listing": ["pictures", "photos", "misleading", "different from", "not as shown", "not matching", "doesn't match", "false advertising", "photoshopped", "generic ones"],
  "Vibe & Activities": ["atmosphere", "boring", "dead", "dull", "lifeless", "no activities", "no vibe", "no atmosphere", "nothing to do", "no events", "no entertainment", "monotonous"],
  "Uncomfortable": ["uncomfortable", "inconvenient", "discomfort", "not comfortable", "hard to sleep", "couldn't sleep", "sleepless"],
  "Pest Issues": ["cockroach", "cockroaches", "mouse", "lizard", "spider", "mosquito", "mosquitoes", "flies", "bedbug", "bed bug", "termite", "rats", "ants", "insects"],
};

const POSITIVE_TAG_KEYWORDS = {
  "Great Staff": ["friendly", "helpful", "welcoming", "hospitality", "polite", "courteous", "kind staff", "great staff", "amazing staff", "supportive", "warm welcome", "sweet", "caring", "attentive", "responsive", "cooperative", "gentle"],
  "Delicious Food": ["delicious", "tasty", "great food", "good food", "amazing food", "best food", "yummy", "loved the food", "fresh food", "home cooked", "homemade", "scrumptious"],
  "Beautiful Location": ["location", "scenic", "beautiful", "surroundings", "mountain", "river", "nature", "valley", "lake", "sunset", "sunrise", "landscape", "breathtaking", "stunning", "gorgeous", "panoramic"],
  "Great Vibe": ["vibe", "vibes", "ambiance", "ambience", "cozy", "chill", "peaceful", "calm", "relaxing", "atmosphere", "homely", "soulful", "aesthetic", "serene", "tranquil"],
  "Good Value": ["value", "worth", "affordable", "reasonable", "budget", "bang for", "pocket friendly", "value for money", "economical", "best price"],
  "Clean & Tidy": ["clean", "spotless", "tidy", "neat", "hygienic", "well maintained", "well-maintained", "sparkling", "pristine", "immaculate"],
  "Comfortable Stay": ["comfortable", "spacious", "cozy room", "nice room", "good room", "comfy", "soft bed", "good mattress", "warm blanket", "slept well", "restful"],
  "Fun Activities": ["trek", "hike", "bonfire", "trip", "tour", "activities", "games", "events", "campfire", "cycling", "kayak", "rafting", "sightseeing", "adventure", "explore"],
  "Great Common Area": ["common area", "lounge", "terrace", "rooftop", "garden", "sitting area", "hangout", "balcony", "courtyard"],
  "Good WiFi": ["fast internet", "good wifi", "good internet", "strong wifi", "great wifi"],
  "Great Rooms": ["nice room", "great room", "loved the room", "beautiful room", "amazing room", "room was great", "dorm was good", "dorm was great"],
  "Social Scene": ["met people", "friends", "community", "travelers", "backpackers", "social", "interaction", "fellow travelers", "like-minded", "conversations"],
  "Great Views": ["view", "views", "scenic view", "mountain view", "river view", "valley view", "sunrise", "sunset"],
};

// Dynamic tag detection for reviews that don't match any predefined tag.
// Looks for common complaint/praise patterns and extracts a tag from them.
const DYNAMIC_NEGATIVE_PATTERNS = [
  /(?:no|lack of|missing|without|didn'?t have|don'?t have|wasn'?t any|weren'?t any)\s+(\w{4,}(?:\s+\w+)?)/gi,
  /(\w{4,}(?:\s+\w+)?)\s+(?:was|were|is|are)\s+(?:bad|poor|terrible|horrible|awful|worst|pathetic|disappointing|disgusting)/gi,
  /(?:bad|poor|terrible|horrible|worst|pathetic)\s+(\w{4,}(?:\s+\w+)?)/gi,
  /(?:problem|issue|complaint)\s+(?:with|about|regarding)\s+(\w{4,}(?:\s+\w+)?)/gi,
];

const DYNAMIC_POSITIVE_PATTERNS = [
  /(?:loved|love|amazing|excellent|fantastic|wonderful|brilliant|superb|outstanding|perfect)\s+(\w{4,}(?:\s+\w+)?)/gi,
  /(\w{4,}(?:\s+\w+)?)\s+(?:was|were|is|are)\s+(?:amazing|excellent|fantastic|wonderful|brilliant|superb|outstanding|perfect|great|awesome|incredible)/gi,
  /(?:best|great|awesome|incredible)\s+(\w{4,}(?:\s+\w+)?)/gi,
];

// Words to exclude from dynamic tag creation (too generic)
const DYNAMIC_TAG_STOPWORDS = new Set([
  "it", "this", "that", "they", "them", "there", "here", "the", "a", "an", "i", "we", "you", "my",
  "very", "really", "so", "too", "much", "just", "even", "also", "only", "thing", "things", "one",
  "place", "time", "way", "lot", "bit", "something", "everything", "nothing", "anything", "all",
  "been", "was", "were", "have", "had", "has", "would", "could", "should", "will", "can", "not",
  "overall", "experience", "stay", "hostel", "zostel", "hotel", "property", "good", "nice", "okay",
  "really", "quite", "pretty", "more", "some", "other", "like", "about", "with", "from", "than",
]);

/**
 * Detects tags for a single review based on its comment and rating.
 * Returns { issueTags: string[], positiveTags: string[] }
 */
const detectReviewTags = (comment, rating) => {
  const issueTags = [];
  const positiveTags = [];
  if (!comment || comment.trim() === "") return { issueTags, positiveTags };

  const commentLower = comment.toLowerCase();

  if (rating <= 3) {
    // Check predefined negative keywords with word-boundary matching
    Object.entries(NEGATIVE_TAG_KEYWORDS).forEach(([label, keywords]) => {
      if (keywords.some((kw) => kwMatch(commentLower, kw))) {
        issueTags.push(label);
      }
    });

    // Dynamic fallback: if no tags matched, try pattern extraction
    if (issueTags.length === 0) {
      const dynamicTags = new Set();
      DYNAMIC_NEGATIVE_PATTERNS.forEach((pattern) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(commentLower)) !== null) {
          const phrase = match[1]?.trim();
          if (phrase && phrase.length > 3 && phrase.length < 25 && !DYNAMIC_TAG_STOPWORDS.has(phrase.toLowerCase())) {
            const tag = phrase.replace(/\b\w/g, (c) => c.toUpperCase());
            dynamicTags.add(tag);
          }
        }
      });
      // Limit dynamic tags to 2
      [...dynamicTags].slice(0, 2).forEach((t) => issueTags.push(t));
    }
  }

  if (rating >= 4) {
    // Check predefined positive keywords with word-boundary matching
    Object.entries(POSITIVE_TAG_KEYWORDS).forEach(([label, keywords]) => {
      if (keywords.some((kw) => kwMatch(commentLower, kw))) {
        positiveTags.push(label);
      }
    });

    // Dynamic fallback for positives
    if (positiveTags.length === 0) {
      const dynamicTags = new Set();
      DYNAMIC_POSITIVE_PATTERNS.forEach((pattern) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(commentLower)) !== null) {
          const phrase = match[1]?.trim();
          if (phrase && phrase.length > 3 && phrase.length < 25 && !DYNAMIC_TAG_STOPWORDS.has(phrase.toLowerCase())) {
            const tag = phrase.replace(/\b\w/g, (c) => c.toUpperCase());
            dynamicTags.add(tag);
          }
        }
      });
      [...dynamicTags].slice(0, 2).forEach((t) => positiveTags.push(t));
    }
  }

  return { issueTags: issueTags.slice(0, 3), positiveTags: positiveTags.slice(0, 3) };
};

/**
 * Detects aggregate tags across a set of reviews.
 * Returns { issues: string[], positives: string[] }
 */
const detectAggregateReviewTags = (reviews) => {
  const negativeReviews = (reviews || []).filter((r) => Math.round(r.review_rating) <= 3 && r.review_comment && r.review_comment.trim() !== "");
  const positiveReviews = (reviews || []).filter((r) => Math.round(r.review_rating) >= 4 && r.review_comment && r.review_comment.trim() !== "");

  // Aggregate negative tags (use word-boundary matching)
  const allNegText = negativeReviews.map((r) => r.review_comment.toLowerCase()).join(" . ");
  const issues = Object.entries(NEGATIVE_TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => kwMatch(allNegText, kw)))
    .map(([label]) => label);

  // Aggregate positive tags (use word-boundary matching)
  const allPosText = positiveReviews.map((r) => r.review_comment.toLowerCase()).join(" . ");
  const positives = Object.entries(POSITIVE_TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => kwMatch(allPosText, kw)))
    .map(([label]) => label);

  return { issues, positives };
};

const ReviewsDashboard = () => {
  const theme = useTheme();
  const router = useRouter();
  const { propertyName } = router.query;
  const isSharedView = router.query.view === "shared";

  // Dashboard loading + error state (one code path for init and refresh)
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [slowLoadingMsg, setSlowLoadingMsg] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const abortRef = useRef(null); // AbortController for cancelling in-flight fetches
  const slowLoadTimerRef = useRef(null);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Set to 7 days ago
    return [start, end];
  });

  const [selectedProperty, setSelectedProperty] = useState("All Properties");
  const [selectedSource, setSelectedSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [selectedPropertyForModal, setSelectedPropertyForModal] =
    useState(null);
  const [propertyPage, setPropertyPage] = useState(0);
  const [propertyRowsPerPage] = useState(10);
  const [visiblePropertyRows, setVisiblePropertyRows] = useState(10);
  const [orderBy, setOrderBy] = useState("rank"); // default sort by rank (best first)
  const [order, setOrder] = useState("asc"); // default ascending order (rank 1 at top)
  const [loading, setLoading] = useState(false);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    count: 0,
    checkouts: 0,
    total_guests: 0,
  });
  const [propertyInsightsData, setPropertyInsightsData] = useState({
    properties: [],
    count: 0,
    loading: false,
  });
  const [selectedPeriod, setSelectedPeriod] = useState("7"); // default to 7 days
  const [selectedRating, setSelectedRating] = useState("all");
  const [avgRatingFilter, setAvgRatingFilter] = useState("all");
  const [showOnlyTextual, setShowOnlyTextual] = useState(false);
  const [copyNotification, setCopyNotification] = useState({
    open: false,
    message: "",
  });
  const [sortBy, setSortBy] = useState(null); // 'rating' or 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [reviewFilterTab, setReviewFilterTab] = useState("all"); // 'all' | 'actionable' | 'positive' | 'negative'
  const [activeTagFilters, setActiveTagFilters] = useState([]); // [{ type: 'issue'|'positive', label: string }, ...]
  const [emojiFilter, setEmojiFilter] = useState("none"); // 'none' | 'all' | specific emoji
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({
    properties: [],
    reviews: [],
  });
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [ratingType, setRatingType] = useState("weighted");
  // Chain average data for PM benchmarking
  const [chainAverageData, setChainAverageData] = useState(null);
  // Inventory-wise rating data
  const [inventoryRatings, setInventoryRatings] = useState([]);
  const [inventoryRatingsLoading, setInventoryRatingsLoading] = useState(false);
  // Action items (backend-persisted per property)
  const [actionItems, setActionItems] = useState([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [newActionText, setNewActionText] = useState("");
  const [newActionCategory, setNewActionCategory] = useState("General");
  const [actionItemDialogOpen, setActionItemDialogOpen] = useState(false);
  const [actionItemDialogReview, setActionItemDialogReview] = useState(null);
  const [actionItemDialogData, setActionItemDialogData] = useState({ priority: "medium", assignee: "", assigneeId: null, dueDate: "", category: "General" });
  const [propertyStaff, setPropertyStaff] = useState([]);
  const [propertyStaffLoading, setPropertyStaffLoading] = useState(false);
  const [reviewReactions, setReviewReactions] = useState({}); // { review_id: [{ emoji, user_name, created_at }] }
  const [reactionPickerOpen, setReactionPickerOpen] = useState(null); // review_id whose picker is open
  const [attentionProperties, setAttentionProperties] = useState([]);
  const [attentionPropertiesLoading, setAttentionPropertiesLoading] = useState(false);
  const [commentDialogItem, setCommentDialogItem] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  // Property action items popup (from review cards in All Properties view)
  const [actionItemsPopupProperty, setActionItemsPopupProperty] = useState(null); // property name string
  const [actionItemsPopupItems, setActionItemsPopupItems] = useState([]);
  const [actionItemsPopupLoading, setActionItemsPopupLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(() => {
    try {
      // Auto-detect from login credentials first (like Slack/Linear)
      const authData = localStorage.getItem("auth_data");
      if (authData) {
        const parsed = JSON.parse(authData);
        const firstName = parsed.user?.first_name || parsed.first_name || "";
        const lastName = parsed.user?.last_name || parsed.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
        // Fallback to mobile number if no name
        if (parsed.user?.mobile_number || parsed.mobile_number) return parsed.user?.mobile_number || parsed.mobile_number;
      }
      return localStorage.getItem("zo_action_user_name") || "";
    } catch { return ""; }
  });
  const pdfRef = useRef(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const { toPDF, targetRef } = usePDF({
    filename: selectedProperty
      ? `${selectedProperty.replace(/\s+/g, "_")}_Reviews_Report.pdf`
      : "Reviews_Report.pdf",
    page: {
      margin: 20,
      format: "A4",
    },
    overrides: {
      pdf: {
        compress: true,
      },
      canvas: {
        useCORS: true,
      },
    },
  });
  const [trendData, setTrendData] = useState([]);
  // Per-property trend overlay: "top5" | "top10" | "bottom5" | "bottom10" | null
  const [propertyTrendMode, setPropertyTrendMode] = useState(null);
  // Fetched per-property trend data: [{ name, color, dataKey, data: [{date, avgRating, ...}] }]
  const [propertyTrendLines, setPropertyTrendLines] = useState([]);
  const [propertyTrendsLoading, setPropertyTrendsLoading] = useState(false);

  // Add this near other state declarations
  const [showSidebar, setShowSidebar] = useState(!isSharedView);

  // Natural Language Query state
  const [nlQuery, setNlQuery] = useState("");
  const [nlResult, setNlResult] = useState(null);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState(null);
  const [nlShowSql, setNlShowSql] = useState(false);
  const [nlExpanded, setNlExpanded] = useState(false);
  const [nlPage, setNlPage] = useState(0);
  const [nlRowsPerPage, setNlRowsPerPage] = useState(25);

  // Refresh button spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Snackbar notification for refresh/errors
  const [refreshNotification, setRefreshNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Helper to compute start date from end - days (end date is the anchor)
  const getDateRangeFromEnd = (endDate, days) => {
    const start = new Date(endDate);
    start.setDate(endDate.getDate() - parseInt(days));
    return [start, endDate];
  };

  // Human-readable label for a period
  const periodLabel = (p) => {
    const labels = { "1": "1 day", "7": "7 days", "30": "30 days", "90": "90 days", "180": "6 months", "365": "1 year" };
    return labels[p] || `${p} days`;
  };

  // Detect which period chip matches the current date range (bidirectional sync)
  const getActivePeriod = () => {
    if (!dateRange[0] || !dateRange[1]) return null;
    const diffMs = dateRange[1].getTime() - dateRange[0].getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const periods = [1, 7, 30, 90, 180, 365];
    return periods.find(p => p === diffDays)?.toString() || "custom";
  };

  // Natural Language Query handler
  const handleNlQuery = async (queryOverride) => {
    const q = (queryOverride || nlQuery).trim();
    if (!q) return;

    setNlLoading(true);
    setNlError(null);
    setNlResult(null);
    setNlPage(0);

    try {
      // Get auth info for property filtering
      let userProperties = [];
      let userIsAdmin = false;
      try {
        const authData = localStorage.getItem("auth_data");
        if (authData) {
          const parsed = JSON.parse(authData);
          userIsAdmin = !!parsed.isAdmin;
        }
      } catch {}

      // Determine current property context
      const currentProperty = selectedProperty !== "All Properties" ? selectedProperty : null;

      const response = await fetch(`${environment.apiUrl}/api/analytics/nl-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          properties: userProperties,
          isAdmin: userIsAdmin,
          currentProperty,
          dateRange: {
            startDate: dateRange[0]?.toISOString().split("T")[0],
            endDate: dateRange[1]?.toISOString().split("T")[0],
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNlResult(data.data);
      } else {
        setNlError(data.error || "Query failed. Try rephrasing your question.");
      }
    } catch (err) {
      setNlError("Could not connect to the server. Please check your connection and try again.");
    } finally {
      setNlLoading(false);
    }
  };

  const nlExampleQuestions = [
    "How many checkouts this month?",
    "Average review rating by property",
    "Top 10 properties by checkout count",
    "Reviews with rating below 3 in last 7 days",
  ];

  // Period chip clicked — keep end date fixed, move start date back
  const handlePeriodChange = (days) => {
    setSelectedPeriod(days);
    const [start, end] = getDateRangeFromEnd(dateRange[1], parseInt(days));
    setDateRange([start, end]);
  };

  const handleStartDateChange = (newStart) => {
    setDateRange([newStart, dateRange[1]]);
    const diffMs = dateRange[1].getTime() - newStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const match = [1, 7, 30, 90, 180, 365].find(p => p === diffDays);
    setSelectedPeriod(match ? match.toString() : "custom");
  };

  const handleEndDateChange = (newEnd) => {
    setDateRange([dateRange[0], newEnd]);
    const diffMs = newEnd.getTime() - dateRange[0].getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const match = [1, 7, 30, 90, 180, 365].find(p => p === diffDays);
    setSelectedPeriod(match ? match.toString() : "custom");
  };

  // Add this helper function after the formatDate function
  const isDateRangeOver90Days = () => {
    if (!dateRange[0] || !dateRange[1]) return false;
    const diffTime = Math.abs(dateRange[1] - dateRange[0]);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 90;
  };

  // Filter properties based on average rating from rankings table
  const filteredProperties =
    propertyInsightsData?.properties?.filter((property) => {
      if (avgRatingFilter === "all") return true;
      return property.avgRating < parseFloat(avgRatingFilter);
    }) || [];

  // Get list of properties that pass the rating filter
  const allowedProperties =
    avgRatingFilter === "all"
      ? null
      : new Set(filteredProperties.map((p) => p.property));

  // Filter all reviews based on allowed properties (memoized to stabilize downstream useMemo chains)
  const filteredReviews = useMemo(() =>
    reviewsData?.reviews?.filter(
      (review) =>
        (selectedRating === "all" ||
          Math.floor(review.review_rating) === parseInt(selectedRating)) &&
        (!showOnlyTextual ||
          (review.review_comment && review.review_comment.trim() !== "")) &&
        (searchQuery === "" ||
          review.guest_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          review.cb_booking_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          review.review_comment
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())) &&
        (selectedProperty === "All Properties" ||
          review.property_name === selectedProperty) &&
        // Add average rating filter check
        (avgRatingFilter === "all" ||
          (allowedProperties && allowedProperties.has(review.property_name))) &&
        // Emoji reaction filter
        (emojiFilter === "all" ||
          (emojiFilter === "none"
            ? !(reviewReactions[review.unique_review_id]?.length > 0)
            : (reviewReactions[review.unique_review_id] || []).some((r) => r.emoji === emojiFilter)))
    ) || [],
  [reviewsData?.reviews, selectedRating, showOnlyTextual, searchQuery, selectedProperty, avgRatingFilter, allowedProperties, emojiFilter, reviewReactions]);

  // Filter KPI data based on allowed properties
  // Use backend's true count for KPI cards (review rows are capped at 15k for payload size)
  const filteredReviewsData = {
    ...reviewsData,
    reviews: filteredReviews,
    count: (avgRatingFilter !== "all" || selectedRating !== "all" || showOnlyTextual || searchQuery !== "")
      ? filteredReviews.length
      : (reviewsData?.count || filteredReviews.length),
    checkouts:
      avgRatingFilter === "all"
        ? reviewsData?.checkouts || 0
        : filteredProperties.reduce(
            (acc, property) => acc + (property.total_checkouts || 0),
            0
          ),
    total_guests:
      avgRatingFilter === "all"
        ? reviewsData?.total_guests || 0
        : filteredReviews.reduce(
            (acc, review) => acc + (review.total_guests || 0),
            0
          ),
  };

  // Filter property insights data
  const filteredPropertyInsights = {
    ...propertyInsightsData,
    properties: filteredProperties,
    count: filteredProperties.length,
  };

  // Use filtered data for all components
  const displayData = {
    reviews: filteredReviewsData,
    properties: filteredPropertyInsights,
  };

  // ─── Memoized tag map: compute tags ONCE for all reviews, keyed by unique_review_id ───
  // This eliminates redundant detectReviewTags() calls (was called per-review on every render + filter)
  const reviewTagMap = useMemo(() => {
    const map = new Map();
    (filteredReviews || []).forEach((r) => {
      const tags = detectReviewTags(r.review_comment, Math.round(r.review_rating));
      map.set(r.unique_review_id, tags);
    });
    return map;
  }, [filteredReviews]);

  // ─── Map reviews → linked action items (by quoted_review_id) ───
  const reviewActionItemMap = useMemo(() => {
    const map = new Map();
    for (const item of actionItems) {
      if (!item.quoted_review_id) continue;
      const existing = map.get(item.quoted_review_id);
      if (!existing) map.set(item.quoted_review_id, [item]);
      else existing.push(item);
    }
    return map;
  }, [actionItems]);

  // ─── Tag progress: per-tag addressed/total for subtle dot indicator ───
  const tagProgressMap = useMemo(() => {
    // map key = "issue:TagName" or "positive:TagName", value = { total, addressed }
    const map = new Map();
    for (const r of filteredReviews) {
      const rid = r.unique_review_id;
      const tags = reviewTagMap.get(rid);
      if (!tags) continue;
      const hasActionItem = reviewActionItemMap.has(rid);
      const reactions = reviewReactions[rid] || [];
      const hasHandledReaction = reactions.some((rx) => rx.emoji === "✅" || rx.emoji === "🔧");
      const isAddressed = hasActionItem || hasHandledReaction;
      for (const tag of tags.issueTags) {
        const key = `issue:${tag}`;
        const entry = map.get(key) || { total: 0, addressed: 0 };
        entry.total++;
        if (isAddressed) entry.addressed++;
        map.set(key, entry);
      }
      for (const tag of tags.positiveTags) {
        const key = `positive:${tag}`;
        const entry = map.get(key) || { total: 0, addressed: 0 };
        entry.total++;
        if (isAddressed) entry.addressed++;
        map.set(key, entry);
      }
    }
    return map;
  }, [filteredReviews, reviewTagMap, reviewActionItemMap, reviewReactions]);

  // ─── Single-pass counting + tab filtering (replaces 3 separate .filter() passes) ───
  const { tabFilteredReviews, actionableCount, negativeCount, positiveCount, untrackedCount } = useMemo(() => {
    let actionable = 0, negative = 0, positive = 0, untracked = 0;
    const tabFiltered = [];

    for (const r of filteredReviews) {
      const rating = Math.round(r.review_rating);
      const hasComment = r.review_comment && r.review_comment.trim() !== "";
      const isLowRating = rating <= 3;
      const isHighRating = rating >= 4;
      const rid = r.unique_review_id;
      const hasReactions = (reviewReactions[rid] || []).length > 0;
      const hasActionItem = reviewActionItemMap.has(rid);
      const isUntracked = !hasReactions && !hasActionItem;

      // Count in single pass
      if (isLowRating && hasComment) actionable++;
      if (isLowRating) negative++;
      if (isHighRating) positive++;
      if (isUntracked) untracked++;

      // Tab filter
      let passesTab = true;
      if (reviewFilterTab === "actionable") passesTab = isLowRating && hasComment;
      else if (reviewFilterTab === "negative") passesTab = isLowRating;
      else if (reviewFilterTab === "positive") passesTab = isHighRating;
      else if (reviewFilterTab === "untracked") passesTab = isUntracked;

      if (!passesTab) continue;

      // Tag filter (using pre-computed tag map — O(1) lookup instead of recomputing)
      if (activeTagFilters.length > 0) {
        const tags = reviewTagMap.get(r.unique_review_id);
        if (!tags) continue;
        const matchesTag = activeTagFilters.some((f) =>
          f.type === "issue" ? tags.issueTags.includes(f.label) : tags.positiveTags.includes(f.label)
        );
        if (!matchesTag) continue;
      }

      tabFiltered.push(r);
    }

    return { tabFilteredReviews: tabFiltered, actionableCount: actionable, negativeCount: negative, positiveCount: positive, untrackedCount: untracked };
  }, [filteredReviews, reviewFilterTab, activeTagFilters, reviewTagMap, reviewReactions, reviewActionItemMap]);

  // Add sort function for reviews
  const sortedReviews = [...tabFilteredReviews].sort((a, b) => {
    if (sortBy === "rating") {
      return sortOrder === "asc"
        ? a.review_rating - b.review_rating
        : b.review_rating - a.review_rating;
    }
    if (sortBy === "date") {
      return sortOrder === "asc"
        ? new Date(a.review_created_at) - new Date(b.review_created_at)
        : new Date(b.review_created_at) - new Date(a.review_created_at);
    }
    // Default: lowest rating first for "actionable" tab
    if (reviewFilterTab === "actionable" || reviewFilterTab === "negative") {
      return a.review_rating - b.review_rating;
    }
    return 0;
  });

  // Keep only this pagination using sorted reviews
  const paginatedReviews = sortedReviews.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );

  // ─── Bayesian average ranking (memoized) ───
  // score = (C × M + reviews × avgRating) / (C + reviews)
  // C = median review count, M = chain-wide weighted avg rating
  // Properties with few reviews get pulled toward the chain average;
  // high-volume, high-rating properties rise to the top.
  //
  // Wrapped in useMemo — only recomputes when property insights data changes.
  const propertyRankMap = useMemo(() => {
    const props = displayData.properties?.properties;
    if (!props?.length) return {};
    const totalReviews = props.reduce((s, p) => s + (p.reviews || 0), 0);
    const M = totalReviews > 0
      ? props.reduce((s, p) => s + (p.avgRating || 0) * (p.reviews || 0), 0) / totalReviews
      : 0;
    const counts = props.map((p) => p.reviews || 0).sort((a, b) => a - b);
    const C = counts[Math.floor(counts.length / 2)] || 1;

    const scored = props.map((p) => ({
      property: p.property,
      score: (p.reviews || 0) > 0
        ? (C * M + p.reviews * p.avgRating) / (C + p.reviews)
        : 0,
    }));
    scored.sort((a, b) => b.score - a.score);

    const rankMap = {};
    scored.forEach((s, i) => { rankMap[s.property] = i + 1; });
    return rankMap;
  }, [displayData.properties?.properties]);

  const calculatePropertyRank = (property) => {
    return propertyRankMap[property.property] || 0;
  };

  // Merge per-property trend data (fetched async) into trendData for Recharts (memoized)
  const enrichedTrendData = useMemo(() => {
    if (!propertyTrendLines.length) return trendData;
    return trendData.map((td, idx) => {
      const enriched = { ...td };
      propertyTrendLines.forEach((line) => {
        const val = line.data[idx];
        // Only set numeric, non-NaN values — Recharts treats undefined as "no data"
        if (val != null && !isNaN(val)) {
          enriched[line.dataKey] = val;
        }
      });
      return enriched;
    });
  }, [trendData, propertyTrendLines]);

  // Update the ClickablePropertyName Component
  const ClickablePropertyName = ({ propertyName, onClick, sx = {} }) => (
    <Link href={`/reviews/${encodeURIComponent(propertyName)}`}>
      <Typography
        component="span"
        onClick={(e) => {
        // Only handle click for left clicks without modifier keys
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button !== 1) {
          e.preventDefault();
          onClick(propertyName);
        }
      }}
      sx={{
        cursor: "pointer",
        color: "primary.main",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "underline",
        },
        ...sx,
      }}
    >
      {propertyName}
    </Typography>
    </Link>
  );

  // Property Review Modal
  const PropertyReviewModal = ({ property, onClose }) => (
    <Dialog open={Boolean(property)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">{property?.property} Reviews</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {!property?.review_details || property.review_details.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No reviews in selected date range
            </Typography>
          ) : (
            property.review_details.map((review) => (
              <Paper
                key={review.booking_code}
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">
                        {review.guest_name}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {review.booking_code}
                        </Typography>
                        <Chip
                          size="small"
                          icon={
                            review.source === "app" ? (
                              <PhoneIcon fontSize="small" />
                            ) : (
                              <WhatsAppIcon fontSize="small" />
                            )
                          }
                          label={review.source === "wa" ? "whatsapp" : "app"}
                        />
                      </Stack>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Star sx={{ color: "primary.main" }} />
                      <Typography variant="subtitle2">
                        {review.rating.toFixed(1)}/5
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {review.comment || "No comment provided"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reviewed on {formatDate(new Date(review.date))}
                  </Typography>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );


  // Update the filter function
  const getFilteredData = () => {
    return {
      reviews: filteredReviews,
    };
  };

  // Add this sorting function
  const handleSort = (column) => {
    if (column === "rating" || column === "date") {
      // For reviews table
      if (sortBy === column) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(column);
        setSortOrder("asc");
      }
    } else {
      // For property insights table
      if (orderBy === column) {
        setOrder(order === "asc" ? "desc" : "asc");
      } else {
        setOrderBy(column);
        setOrder("asc");
      }
    }
  };

  // Update the compareValues function to handle weightedDelta
  const compareValues = (a, b) => {
    if (orderBy === "weightedDelta") {
      return order === "asc"
        ? parseFloat(a.weightedDelta) - parseFloat(b.weightedDelta)
        : parseFloat(b.weightedDelta) - parseFloat(a.weightedDelta);
    }
    if (orderBy === "rank") {
      const rankA = a.bayesianRank || calculatePropertyRank(a);
      const rankB = b.bayesianRank || calculatePropertyRank(b);
      if (rankA === rankB) {
        return order === "asc"
          ? parseFloat(a.weightedDelta) - parseFloat(b.weightedDelta)
          : parseFloat(b.weightedDelta) - parseFloat(a.weightedDelta);
      }
      return order === "asc" ? rankA - rankB : rankB - rankA;
    }
    if (orderBy === "avgRating") {
      if (a.avgRating === b.avgRating) {
        // If avg ratings are equal, sort by weighted delta
        return order === "asc"
          ? parseFloat(a.weightedDelta) - parseFloat(b.weightedDelta)
          : parseFloat(b.weightedDelta) - parseFloat(a.weightedDelta);
      }
      return order === "asc"
        ? a.avgRating - b.avgRating
        : b.avgRating - a.avgRating;
    }
    return order === "asc"
      ? a[orderBy] > b[orderBy]
        ? 1
        : -1
      : b[orderBy] > a[orderBy]
      ? 1
      : -1;
  };

  // Update the calculateWeightedDeltas function
  const calculateWeightedDeltas = () => {
    const properties = displayData.properties.properties;

    // Calculate overall average rating
    const totalRevs = properties.reduce((acc, curr) => acc + curr.reviews, 0);
    const overallAvgRating = totalRevs > 0
      ? properties.reduce((acc, curr) => acc + curr.avgRating * curr.reviews, 0) / totalRevs
      : 0;

    // Calculate weighted deltas + attach Bayesian rank from pre-computed map
    const propertyDeltas = properties.map((property) => {
      const weightedDelta =
        (property.avgRating - overallAvgRating) * property.reviews;
      return {
        ...property,
        weightedDelta,
        bayesianRank: propertyRankMap[property.property] || 0,
        effect:
          weightedDelta > 100
            ? "Uplifting"
            : weightedDelta > 0
            ? "Slight uplift"
            : weightedDelta < -100
            ? "Pulling down"
            : "Slight drag",
      };
    });

    // Sort and get top 5 lifting and dragging properties
    const sortedDeltas = [...propertyDeltas].sort(
      (a, b) => b.weightedDelta - a.weightedDelta
    );

    return {
      lifting: sortedDeltas.slice(0, 5),
      dragging: sortedDeltas.slice(-5).reverse(),
      allLifting: [...sortedDeltas],
      allDragging: [...sortedDeltas].reverse(),
    };
  };

  // ─── Fetch reviews from API (always fetches fresh, caches result) ───
  const fetchReviews = async (signal) => {
    const startDateStr = dateRange[0].toISOString().split("T")[0];
    const endDateStr = dateRange[1].toISOString().split("T")[0];

    const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
    if (selectedProperty !== "All Properties") {
      params.append("propertyName", selectedProperty);
    }

    const response = await fetch(
      `${environment.apiUrl}/api/analytics/all-reviews?${params}`,
      { signal }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error("API returned success=false");

    const reviews = data.current_period.data.map((review) => ({
      unique_review_id: `${review.booking_id}_${review.name}_${review.mobile}`,
      cb_booking_id: review.booking_id,
      cb_booking_code: review.booking_code,
      guest_name: review.name,
      property_name: review.property_name,
      review_created_at: review.checkout_date,
      review_rating: review.rating,
      review_comment: review.comment,
      review_source: review.review_source === "wa" ? "whatsapp" : "app",
      guest_email: review.email,
      guest_mobile: review.mobile,
      room_name: review.room_name || null,
    }));

    const previous_reviews = data.previous_period.data.map((review) => ({
      review_rating: review.rating,
    }));

    const result = {
      reviews,
      count: data.current_period.count,
      checkouts: data.current_period.checkouts,
      total_guests: data.current_period.total_guests,
      previous_period: {
        reviews: previous_reviews,
        count: data.previous_period.count,
        checkouts: data.previous_period.checkouts,
        total_guests: data.previous_period.total_guests,
        start_date: data.previous_period.start_date,
        end_date: data.previous_period.end_date,
      },
      trend_data: data.trend_data
        .map((interval) => ({
          date: interval.start_date,
          endDate: interval.end_date,
          avgRating: Number(interval.avg_rating),
          reviewRate: Number(interval.review_rate),
          reviewCount: interval.reviews_count,
          checkouts: interval.total_checkouts,
          dateRange: `${new Date(interval.start_date).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short", year: "2-digit" }
          )} - ${new Date(interval.end_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })}`,
        }))
        .reverse(),
    };

    // Cache for quick display on revisit (5 min TTL)
    const cacheKey = `${CACHE_KEYS.REVIEWS_DATA}_${startDateStr}_${endDateStr}_${selectedProperty}`;
    setCacheData(cacheKey, result);

    return result;
  };

  // ─── Fetch per-property trend data (same API as individual property pages) ───
  // Called when user clicks Top 5 / Bottom 5 / etc. chips on Rating Trends chart.
  // Fetches trend_data for each selected property from the same endpoint that
  // powers individual property pages, so the data is identical.
  const fetchPropertyTrends = async (mode) => {
    if (!mode || selectedProperty !== "All Properties") {
      setPropertyTrendLines([]);
      return;
    }
    if (!Object.keys(propertyRankMap).length) return;

    setPropertyTrendsLoading(true);
    try {
      // 1. Pick properties from Bayesian ranking (same as rankings table)
      const rankedNames = Object.entries(propertyRankMap)
        .sort(([, rankA], [, rankB]) => rankA - rankB)
        .map(([name]) => name);

      let selectedNames;
      if (mode === "top5") selectedNames = rankedNames.slice(0, 5);
      else if (mode === "top10") selectedNames = rankedNames.slice(0, 10);
      else if (mode === "bottom5") selectedNames = rankedNames.slice(-5);
      else if (mode === "bottom10") selectedNames = rankedNames.slice(-10);
      else selectedNames = [];

      if (!selectedNames.length) {
        setPropertyTrendLines([]);
        setPropertyTrendsLoading(false);
        return;
      }

      const startDateStr = dateRange[0].toISOString().split("T")[0];
      const endDateStr = dateRange[1].toISOString().split("T")[0];

      // 2. Fetch trend data for each property in parallel
      const results = await Promise.all(
        selectedNames.map(async (propName) => {
          const params = new URLSearchParams({
            startDate: startDateStr,
            endDate: endDateStr,
            propertyName: propName,
          });
          const response = await fetch(
            `${environment.apiUrl}/api/analytics/all-reviews?${params}`
          );
          if (!response.ok) return { name: propName, trendData: [] };
          const data = await response.json();
          if (!data.success || !data.trend_data) return { name: propName, trendData: [] };

          const trend = data.trend_data
            .map((interval) => ({
              date: interval.start_date,
              endDate: interval.end_date,
              avgRating: Number(interval.avg_rating),
              reviewCount: interval.reviews_count,
              dateRange: `${new Date(interval.start_date).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short", year: "2-digit" }
              )} - ${new Date(interval.end_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })}`,
            }))
            .reverse();

          return { name: propName, trendData: trend };
        })
      );

      // 3. Map fetched trend data onto chart intervals using trendData's dateRange labels
      const PROPERTY_COLORS = [
        "#e6194b", "#f58231", "#ffe119", "#911eb4", "#42d4f4",
        "#f032e6", "#fabed4", "#dcbeff", "#9A6324", "#800000",
      ];

      const lines = results.map((result, i) => {
        // Match each trendData interval to this property's fetched intervals by dateRange label
        const dataPoints = trendData.map((td) => {
          const match = result.trendData.find((pt) => pt.dateRange === td.dateRange);
          if (!match || isNaN(match.avgRating)) return null;
          return Number(match.avgRating.toFixed(2));
        });

        return {
          name: result.name,
          color: PROPERTY_COLORS[i % PROPERTY_COLORS.length],
          dataKey: `prop_${i}`,
          data: dataPoints,
        };
      });

      setPropertyTrendLines(lines);
    } catch (error) {
      console.error("Failed to fetch property trends:", error);
      setPropertyTrendLines([]);
    } finally {
      setPropertyTrendsLoading(false);
    }
  };

  // ─── Fetch property insights from API ───
  const fetchPropertyInsights = async (signal) => {
    const startDateStr = dateRange[0].toISOString().split("T")[0];
    const endDateStr = dateRange[1].toISOString().split("T")[0];
    const isAllProperties = selectedProperty === "All Properties";

    const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
    if (isAllProperties) params.append("lite", "true");

    const response = await fetch(
      `${environment.apiUrl}/api/analytics/property-insights?${params}`,
      { signal }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error("API returned success=false");

    const result = {
      properties: data.data.map((property) => ({
        property: property.property_name,
        property_id: property.property_id,
        reviews: parseInt(property.reviews),
        avgRating: parseFloat(property.avg_rating),
        review_details: property.review_details || [],
        low_reviews: parseInt(property.low_reviews || 0),
        critical_reviews: parseInt(property.critical_reviews || 0),
        total_checkouts: parseInt(property.total_checkouts),
        total_guests: parseInt(property.total_guests || property.total_checkouts),
        reviewRate:
          (property.total_guests || property.total_checkouts) > 0
            ? (parseInt(property.reviews) /
                parseInt(property.total_guests || property.total_checkouts)) *
              100
            : 0,
        ratingDrop: 0,
      })),
      count: data.count,
    };

    const cacheKey = `${CACHE_KEYS.PROPERTY_INSIGHTS}_${startDateStr}_${endDateStr}${isAllProperties ? "_lite" : ""}`;
    setCacheData(cacheKey, result);

    return result;
  };

  // ─── Fetch chain average (shared view only) ───
  const fetchChainAverage = async (signal) => {
    const startDateStr = dateRange[0].toISOString().split("T")[0];
    const endDateStr = dateRange[1].toISOString().split("T")[0];
    const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
    if (selectedProperty !== "All Properties") params.append("propertyName", selectedProperty);

    const response = await fetch(
      `${environment.apiUrl}/api/analytics/chain-average?${params}`,
      { signal }
    );
    const data = await response.json();
    if (data.success) return data.data;
    return null;
  };

  // ─── Fetch inventory-wise ratings ───
  const fetchInventoryRatings = async (signal) => {
    const startDateStr = dateRange[0].toISOString().split("T")[0];
    const endDateStr = dateRange[1].toISOString().split("T")[0];
    const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
    if (selectedProperty !== "All Properties") params.append("propertyName", selectedProperty);

    const response = await fetch(
      `${environment.apiUrl}/api/analytics/inventory-ratings?${params}`,
      { signal }
    );
    const data = await response.json();
    if (data.success && data.data) return data.data;
    return null;
  };

  // ============ Action Items — backend-persisted CRUD (Linear-style) ============
  const ACTION_STATUSES = [
    { value: "to_acknowledge", label: "To Acknowledge", color: "default", icon: "⬜" },
    { value: "pending", label: "Pending", color: "warning", icon: "🟡" },
    { value: "in_progress", label: "In Progress", color: "info", icon: "🔵" },
    { value: "done", label: "Done", color: "success", icon: "✅" },
  ];

  const PRIORITIES = [
    { value: "urgent", label: "Urgent", color: "#eb5757", icon: "🔴" },
    { value: "high", label: "High", color: "#f2994a", icon: "🟠" },
    { value: "medium", label: "Medium", color: "#f2c94c", icon: "🟡" },
    { value: "low", label: "Low", color: "#6fcf97", icon: "🟢" },
    { value: "none", label: "No priority", color: "#bdbdbd", icon: "⚪" },
  ];

  const fetchActionItems = async () => {
    setActionItemsLoading(true);
    try {
      const url = selectedProperty === "All Properties"
        ? `${environment.apiUrl}/api/analytics/action-items-all`
        : `${environment.apiUrl}/api/analytics/action-items?propertyName=${encodeURIComponent(selectedProperty)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setActionItems(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch action items:", error);
    } finally {
      setActionItemsLoading(false);
    }
  };

  // Fetch action items for a specific property (popup)
  const fetchActionItemsForProperty = async (propertyName) => {
    setActionItemsPopupLoading(true);
    try {
      const response = await fetch(
        `${environment.apiUrl}/api/analytics/action-items?propertyName=${encodeURIComponent(propertyName)}`
      );
      const data = await response.json();
      if (data.success) {
        setActionItemsPopupItems(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch action items for property:", error);
    } finally {
      setActionItemsPopupLoading(false);
    }
  };

  const openActionItemsPopup = (propertyName) => {
    setActionItemsPopupProperty(propertyName);
    fetchActionItemsForProperty(propertyName);
  };

  // ─── Review Reactions (emoji-based lightweight follow-up tracking) ───
  const REACTION_EMOJIS = [
    { emoji: "👀", label: "Seen" },
    { emoji: "💬", label: "Discussed" },
    { emoji: "🔧", label: "Fixing" },
    { emoji: "✅", label: "Handled" },
    { emoji: "🚩", label: "Flagged" },
  ];

  const fetchReviewReactions = async () => {
    try {
      const params = selectedProperty !== "All Properties"
        ? `?propertyName=${encodeURIComponent(selectedProperty)}`
        : "";
      const response = await fetch(`${environment.apiUrl}/api/analytics/review-reactions${params}`);
      const data = await response.json();
      if (data.success) {
        setReviewReactions(data.data || {});
      }
    } catch (error) {
      console.warn("Failed to fetch review reactions:", error.message);
    }
  };

  const toggleReaction = async (reviewId, propertyName, emoji) => {
    const userName = currentUserName || "Unknown";
    const existing = (reviewReactions[reviewId] || []);
    const alreadyReacted = existing.some((r) => r.emoji === emoji && r.user_name === userName);

    // Optimistic update
    setReviewReactions((prev) => {
      const updated = { ...prev };
      if (alreadyReacted) {
        updated[reviewId] = (updated[reviewId] || []).filter(
          (r) => !(r.emoji === emoji && r.user_name === userName)
        );
        if (updated[reviewId].length === 0) delete updated[reviewId];
      } else {
        updated[reviewId] = [...(updated[reviewId] || []), { emoji, user_name: userName, created_at: new Date().toISOString() }];
      }
      return updated;
    });

    // API call
    try {
      if (alreadyReacted) {
        await fetch(`${environment.apiUrl}/api/analytics/review-reactions`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId, emoji, userName }),
        });
      } else {
        await fetch(`${environment.apiUrl}/api/analytics/review-reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId, propertyName, emoji, userName }),
        });
      }
    } catch (error) {
      console.warn("Failed to toggle reaction:", error.message);
      // Revert on failure
      fetchReviewReactions();
    }
  };

  const fetchPropertyStaff = async (propName) => {
    if (!propName || propName === "All Properties") {
      setPropertyStaff([]);
      return;
    }
    setPropertyStaffLoading(true);
    try {
      const response = await fetch(
        `${environment.apiUrl}/api/analytics/property-staff?propertyName=${encodeURIComponent(propName)}`
      );
      const data = await response.json();
      if (data.success) {
        setPropertyStaff(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch property staff:", error);
    } finally {
      setPropertyStaffLoading(false);
    }
  };

  // Compute properties needing attention from already-loaded property insights data
  const computeAttentionProperties = () => {
    if (selectedProperty !== "All Properties") return;
    const properties = propertyInsightsData?.properties;
    if (!properties?.length) return;

    setAttentionPropertiesLoading(true);

    try {
      const overallAvg = properties.reduce((sum, p) => sum + p.avgRating * p.reviews, 0) /
        Math.max(properties.reduce((sum, p) => sum + p.reviews, 0), 1);

      const flagged = properties
        .filter((p) => p.reviews >= 3) // need minimum reviews to be meaningful
        .map((prop) => {
          const reviews = prop.review_details || [];
          const totalReviews = reviews.length > 0 ? reviews.length : prop.reviews;
          const lowReviews = reviews.length > 0
            ? reviews.filter((r) => parseFloat(r.rating) <= 3).length
            : (prop.low_reviews || 0);
          const criticalReviews = reviews.length > 0
            ? reviews.filter((r) => parseFloat(r.rating) <= 2).length
            : (prop.critical_reviews || 0);
          const lowReviewPct = totalReviews > 0 ? (lowReviews / totalReviews) * 100 : 0;

          // Derive high-level issues from review patterns
          const issues = [];

          // Rating-based issues
          if (prop.avgRating < 3.0) {
            issues.push("Very low avg rating");
          } else if (prop.avgRating < 3.5) {
            issues.push("Below average rating");
          }

          // Volume of bad reviews
          if (lowReviewPct > 40) {
            issues.push(`${Math.round(lowReviewPct)}% negative reviews`);
          } else if (lowReviewPct > 25) {
            issues.push(`${Math.round(lowReviewPct)}% low-rated reviews`);
          }

          if (criticalReviews > 3) {
            issues.push(`${criticalReviews} critical reviews (<=2)`);
          }

          // Below chain average
          if (prop.avgRating < overallAvg - 0.3) {
            issues.push(`${(overallAvg - prop.avgRating).toFixed(1)} below chain avg`);
          }

          // Low review rate = potential review avoidance
          if (prop.reviewRate < 15 && prop.total_checkouts > 10) {
            issues.push(`Low review rate (${prop.reviewRate.toFixed(0)}%)`);
          }

          // Analyze negative review comments for common keywords
          const negativeComments = reviews
            .filter((r) => parseFloat(r.rating) <= 3 && r.comment)
            .map((r) => (r.comment || "").toLowerCase());

          if (negativeComments.length > 0) {
            const allNegText = negativeComments.join(" . ");
            Object.entries(NEGATIVE_TAG_KEYWORDS).forEach(([label, keywords]) => {
              const matchCount = keywords.filter((kw) => kwMatch(allNegText, kw)).length;
              if (matchCount >= 2 || (negativeComments.length <= 3 && matchCount >= 1)) {
                issues.push(label);
              }
            });
          }

          // Determine severity
          let severity = "attention";
          if (prop.avgRating < 3.0 || lowReviewPct > 50) severity = "critical";
          else if (prop.avgRating < 3.5 || lowReviewPct > 35) severity = "warning";

          return {
            property_name: prop.property,
            property_id: prop.property_id,
            avg_rating: prop.avgRating,
            total_reviews: totalReviews,
            low_reviews: lowReviews,
            critical_reviews: criticalReviews,
            low_review_pct: parseFloat(lowReviewPct.toFixed(1)),
            issues: issues.slice(0, 5),
            severity,
            review_rate: prop.reviewRate,
          };
        })
        .filter((p) => p.avg_rating < 4.0 || p.low_review_pct > 25)
        .sort((a, b) => a.avg_rating - b.avg_rating || b.low_review_pct - a.low_review_pct)
        .slice(0, 10);

      setAttentionProperties(flagged);
    } catch (error) {
      console.error("Failed to compute attention properties:", error);
    } finally {
      setAttentionPropertiesLoading(false);
    }
  };

  const createActionItem = async (itemData) => {
    try {
      const targetProperty = itemData.propertyName || selectedProperty;
      const response = await fetch(`${environment.apiUrl}/api/analytics/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...itemData,
          propertyName: targetProperty,
          assignee: itemData.assignee || currentUserName || null,
          createdBy: currentUserName || "Unknown",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setActionItems((prev) => [data.data, ...prev]);
      } else {
        console.error("Backend error creating action item:", data.error);
        setRefreshNotification({ open: true, message: `Failed to create action item: ${data.error || "Unknown error"}. Please restart the ops-backend server.`, severity: "error" });
      }
      return data;
    } catch (error) {
      console.error("Failed to create action item:", error);
      setRefreshNotification({ open: true, message: "Failed to create action item. Check that the ops-backend server is running.", severity: "error" });
    }
  };

  const updateActionItem = async (itemId, updates) => {
    try {
      const response = await fetch(`${environment.apiUrl}/api/analytics/action-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, updatedBy: currentUserName || "Unknown" }),
      });
      const data = await response.json();
      if (data.success) {
        // Refetch to get fresh comments (audit trail)
        await fetchActionItems();
      } else {
        console.error("Backend error updating action item:", data.error);
        setRefreshNotification({ open: true, message: `Failed to update: ${data.error || "Unknown error"}`, severity: "error" });
      }
    } catch (error) {
      console.error("Failed to update action item:", error);
      setRefreshNotification({ open: true, message: "Failed to update action item.", severity: "error" });
    }
  };

  // Convenience wrapper for status-only update (used in JSX)
  const updateActionItemStatus = async (itemId, newStatus) => updateActionItem(itemId, { status: newStatus });

  const deleteActionItem = async (itemId) => {
    try {
      const response = await fetch(`${environment.apiUrl}/api/analytics/action-items/${itemId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setActionItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete action item:", error);
    }
  };

  const addComment = async (itemId, comment) => {
    try {
      const response = await fetch(`${environment.apiUrl}/api/analytics/action-items/${itemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, author: currentUserName || "Unknown" }),
      });
      const data = await response.json();
      if (data.success) {
        setActionItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, comments: [...(item.comments || []), data.data] }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Open "Create Action Item" dialog from a specific review
  const handleCreateActionFromReview = (review) => {
    setActionItemDialogReview(review);
    setActionItemDialogData({ priority: "medium", assignee: "", assigneeId: null, dueDate: "", category: "General" });
    setActionItemDialogOpen(true);
    setNewActionText("");
    setNewActionCategory("General");
    // Fetch staff for the current property
    fetchPropertyStaff(selectedProperty);
  };

  // Open "Create Action Item" dialog for manual creation (no review context)
  const handleOpenCreateDialog = () => {
    setActionItemDialogReview(null);
    setActionItemDialogData({ priority: "medium", assignee: "", assigneeId: null, dueDate: "", category: "General" });
    setActionItemDialogOpen(true);
    setNewActionText("");
    setNewActionCategory("General");
    fetchPropertyStaff(selectedProperty);
  };

  // CSV export helper
  const handleExportCSV = () => {
    const headers = ["Property", "Guest", "Booking Code", "Rating", "Review", "Date", "Source"];
    const rows = filteredReviews.map((r) => [
      r.property_name,
      r.guest_name,
      r.cb_booking_code,
      Math.round(r.review_rating),
      (r.review_comment || "").replace(/"/g, '""'),
      formatDate(new Date(r.review_created_at)),
      r.review_source === "whatsapp" ? "WhatsApp" : "App",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedProperty.replace(/\s+/g, "_")}_Reviews_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sync selectedProperty once router is ready (router.query is empty on first render with ssr:false)
  const [routerReady, setRouterReady] = useState(false);
  useEffect(() => {
    if (router.isReady) {
      const prop = router.query.propertyName;
      if (prop) {
        setSelectedProperty(decodeURIComponent(prop));
      }
      setRouterReady(true);
    }
  }, [router.isReady, router.query.propertyName]);

  // ─── SINGLE data-loading function used by BOTH init and refresh ───
  // Always fetches fresh from API. No retry loops, no fallback cascades.
  // Primary data (reviews + insights) blocks the dashboard.
  // Secondary data (inventory, actions) loads after without blocking.
  const loadDashboard = useCallback(async (signal) => {
    setFetchError(null);
    setAttentionProperties([]);
    setInventoryRatingsLoading(true);

    // ── In-memory cache: instant preview if previously loaded ──
    const startDateStr = dateRange[0].toISOString().split("T")[0];
    const endDateStr = dateRange[1].toISOString().split("T")[0];
    const memCacheKey = `${startDateStr}_${endDateStr}_${selectedProperty}`;
    const cached = sessionDataCache.get(memCacheKey);

    // Clear slow-loading timer
    if (slowLoadTimerRef.current) { clearTimeout(slowLoadTimerRef.current); slowLoadTimerRef.current = null; }
    setSlowLoadingMsg(false);

    if (cached) {
      // Cache hit — show data instantly, no spinner
      setReviewsData(cached.reviews);
      setTrendData(cached.reviews.trend_data || []);
      setPropertyInsightsData({ ...cached.insights, loading: false });
      setLoading(false);
      setIsDashboardLoading(false);
    } else {
      // Cache miss — show loading spinner
      setIsDashboardLoading(true);
      setLoading(true);
      // Show encouraging message after 2s
      slowLoadTimerRef.current = setTimeout(() => setSlowLoadingMsg(true), 2000);
    }

    try {
      // ── Phase 1: Primary data (always fetch fresh) ──
      const reviewsResult = await fetchReviews(signal);
      if (signal?.aborted) return;
      setReviewsData(reviewsResult);
      setTrendData(reviewsResult.trend_data || []);

      const insightsResult = await fetchPropertyInsights(signal);
      if (signal?.aborted) return;
      setPropertyInsightsData({ ...insightsResult, loading: false });

      // Store in memory cache for instant switching
      sessionDataCache.set(memCacheKey, { reviews: reviewsResult, insights: insightsResult });

      // Primary data loaded — ensure dashboard is showing
      if (slowLoadTimerRef.current) { clearTimeout(slowLoadTimerRef.current); slowLoadTimerRef.current = null; }
      setSlowLoadingMsg(false);
      setLoading(false);
      setIsDashboardLoading(false);
      setFetchError(null);

      // ── Phase 2: Secondary data (non-blocking — failures don't hide the dashboard) ──
      // Chain average (shared view only)
      if (isSharedView) {
        fetchChainAverage(signal)
          .then((result) => { if (result && !signal?.aborted) setChainAverageData(result); })
          .catch((err) => console.warn("Chain average failed:", err.message));
      }

      // Inventory ratings
      fetchInventoryRatings(signal)
        .then((result) => {
          if (signal?.aborted) return;
          if (result) setInventoryRatings(result);
        })
        .catch((err) => console.warn("Inventory ratings failed:", err.message))
        .finally(() => { if (!signal?.aborted) setInventoryRatingsLoading(false); });

      // Action items + reactions + staff (no signal needed — lightweight)
      fetchActionItems().catch((err) => console.warn("Action items failed:", err.message));
      fetchReviewReactions().catch((err) => console.warn("Review reactions failed:", err.message));
      fetchPropertyStaff(selectedProperty).catch((err) => console.warn("Staff fetch failed:", err.message));

    } catch (error) {
      if (signal?.aborted) return; // user navigated away or triggered new load — ignore
      // If we had cached data showing, don't replace it with an error
      if (!cached) {
        console.error("Dashboard load failed:", error);
        setFetchError("Couldn't load data. Tap refresh to try again, or select a different date range.");
        setIsDashboardLoading(false);
        setLoading(false);
      } else {
        console.warn("Background refresh failed, cached data still showing:", error.message);
      }
    }
  }, [dateRange, selectedProperty, isSharedView]);

  // ─── Trigger load on init + date/property change ───
  useEffect(() => {
    if (!routerReady) return;

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [routerReady, selectedProperty, dateRange, loadDashboard]);

  // ─── Refresh button — same code path, just clears cache first ───
  const handleRefresh = async () => {
    // Cancel any in-flight load
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);
    sessionDataCache.clear();
    clearCache();
    try {
      await loadDashboard(controller.signal);
      if (!controller.signal.aborted) {
        setRefreshNotification({ open: true, message: "Data refreshed successfully", severity: "success" });
      }
    } catch {
      // loadDashboard already sets fetchError
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compute attention properties when property insights data loads
  useEffect(() => {
    if (selectedProperty === "All Properties" && propertyInsightsData?.properties?.length > 0) {
      computeAttentionProperties();
    }
  }, [selectedProperty, propertyInsightsData]);

  // Fetch per-property trend data when user selects Top 5 / Bottom 5 / etc.
  useEffect(() => {
    fetchPropertyTrends(propertyTrendMode);
  }, [propertyTrendMode]);

  // Clear property trends when switching properties or date range
  const dateRangeKey = `${dateRange[0]?.toISOString()}_${dateRange[1]?.toISOString()}`;
  useEffect(() => {
    setPropertyTrendMode(null);
    setPropertyTrendLines([]);
  }, [selectedProperty, dateRangeKey]);

  // Add function to handle copying to clipboard
  const handleCopyMobile = (mobile) => {
    navigator.clipboard.writeText(mobile);
    setCopyNotification({
      open: true,
      message: "Phone number copied to clipboard",
    });
  };

  // Update the property click handler
  const handlePropertyClick = (property) => {
    if (isSharedView) return; // Disable property switching in shared view

    // Reset all filters and search
    setSelectedRating("all");
    setShowOnlyTextual(false);
    setSearchQuery("");
    setPage(0);
    setModalSearchQuery("");

    // Close search UI
    setSearchModalOpen(false);
    setSelectedPropertyForModal(null);

    // Set the selected property
    const propertyValue =
      typeof property === "string" ? property : property.property;
    setSelectedProperty(propertyValue);

    // Update URL without triggering a new fetch (since useEffect will handle it)
    if (propertyValue === "All Properties") {
      router.push("/reviews");
    } else {
      router.push(`/reviews/${encodeURIComponent(propertyValue)}`);
    }
  };

  // Add this keyboard shortcut handler
  const handleKeyPress = useCallback((event) => {
    // Check for Cmd+K (Mac) or Ctrl+K (Windows)
    if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      event.preventDefault();
      setSearchModalOpen(true);
    }
    // Close on Escape
    if (event.key === "Escape") {
      setSearchModalOpen(false);
    }
  }, []);

  // Add useEffect to handle keyboard events
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  // Update both search handlers to include phone
  const handleSearch = (query) => {
    setSearchQuery(query);

    // Search in properties
    const matchedProperties = displayData.reviews.reviews
      .map((review) => review.property_name)
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((property) =>
        property.toLowerCase().includes(query.toLowerCase())
      );

    // Search in reviews with phone number
    const matchedReviews = displayData.reviews.reviews.filter(
      (review) =>
        review.guest_name?.toLowerCase().includes(query.toLowerCase()) ||
        review.cb_booking_code?.toLowerCase().includes(query.toLowerCase()) ||
        review.guest_phone?.toLowerCase().includes(query.toLowerCase()) ||
        review.mobile?.toLowerCase().includes(query.toLowerCase()) ||
        review.phone?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults({
      properties: matchedProperties,
      reviews: matchedReviews,
    });
  };

  // Update the handleModalSearch function
  const handleModalSearch = (query) => {
    setModalSearchQuery(query);
    const searchTerm = query.toLowerCase();

    // Search in properties
    const matchedProperties = displayData.reviews.reviews
      .map((review) => review.property_name)
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter((property) => property.toLowerCase().includes(searchTerm));

    // Search in reviews
    const matchedReviews = displayData.reviews.reviews.filter(
      (review) =>
        review.guest_name?.toLowerCase().includes(searchTerm) ||
        review.cb_booking_code?.toLowerCase().includes(searchTerm) ||
        (review.guest_phone && review.guest_phone.includes(searchTerm)) // Updated phone search
    );

    setSearchResults({
      properties: matchedProperties,
      reviews: matchedReviews,
    });
  };

  // Add this function to handle Load More
  const handleLoadMore = () => {
    setVisiblePropertyRows((prev) => prev + 10);
  };

  // Generate and download PDF report — adapts to chain-wide or property-specific view
  const handleDownloadReport = async () => {
    try {
      setIsPdfLoading(true);
      // Dynamic import to avoid SSR issues — jsPDF uses browser-only APIs
      const { loadJsPDF, generateChainReport, generatePropertyReport } = await import("../utils/reportGenerator");
      await loadJsPDF();

      if (selectedProperty === "All Properties") {
        // ─── Chain-wide report (Operations Head) ───

        // Aggregate tags per property across ALL reviews for chain tag summary
        const allReviews = reviewsData?.reviews || [];
        const issueTagPropertyMap = {};   // { tagName: { propertyName: count } }
        const positiveTagPropertyMap = {};

        allReviews.forEach((r) => {
          const tags = reviewTagMap.get(r.unique_review_id) || { issueTags: [], positiveTags: [] };
          tags.issueTags.forEach((tag) => {
            if (!issueTagPropertyMap[tag]) issueTagPropertyMap[tag] = {};
            issueTagPropertyMap[tag][r.property_name] = (issueTagPropertyMap[tag][r.property_name] || 0) + 1;
          });
          tags.positiveTags.forEach((tag) => {
            if (!positiveTagPropertyMap[tag]) positiveTagPropertyMap[tag] = {};
            positiveTagPropertyMap[tag][r.property_name] = (positiveTagPropertyMap[tag][r.property_name] || 0) + 1;
          });
        });

        const chainTagSummary = {
          issues: Object.entries(issueTagPropertyMap)
            .map(([tag, properties]) => ({
              tag,
              totalCount: Object.values(properties).reduce((a, b) => a + b, 0),
              topProperties: Object.entries(properties)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count })),
            }))
            .sort((a, b) => b.totalCount - a.totalCount)
            .slice(0, 10),
          positives: Object.entries(positiveTagPropertyMap)
            .map(([tag, properties]) => ({
              tag,
              totalCount: Object.values(properties).reduce((a, b) => a + b, 0),
              topProperties: Object.entries(properties)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count })),
            }))
            .sort((a, b) => b.totalCount - a.totalCount)
            .slice(0, 10),
        };

        const doc = generateChainReport({
          dateRange,
          reviewsData,
          trendData,
          propertyInsightsData,
          attentionProperties,
          actionItems,
          weightedDeltas: calculateWeightedDeltas(),
          propertyRankMap,
          chainAverageData: chainAverageData,
          chainTagSummary,
        });
        const startStr = dateRange[0].toISOString().split("T")[0];
        const endStr = dateRange[1].toISOString().split("T")[0];
        doc.save(`Chain_Reviews_Report_${startStr}_to_${endStr}.pdf`);
      } else {
        // ─── Property-specific report (Property Manager) ───
        // Compute tag counts using pre-computed tag map (avoids re-running detectReviewTags)
        const propReviews = reviewsData?.reviews || [];
        const positiveCounts = new Map();
        const negativeCounts = new Map();
        const taggedReviews = {};  // { tagName: [{ comment, rating, guest_name, date }] }
        propReviews.forEach((r) => {
          const tags = reviewTagMap.get(r.unique_review_id) || { issueTags: [], positiveTags: [] };
          tags.issueTags.forEach((t) => {
            negativeCounts.set(t, (negativeCounts.get(t) || 0) + 1);
            if (r.review_comment && r.review_comment.trim()) {
              if (!taggedReviews[t]) taggedReviews[t] = [];
              taggedReviews[t].push({
                comment: r.review_comment,
                rating: r.review_rating,
                guest_name: r.guest_name,
                date: r.review_created_at,
              });
            }
          });
          tags.positiveTags.forEach((t) => positiveCounts.set(t, (positiveCounts.get(t) || 0) + 1));
        });

        const doc = generatePropertyReport({
          selectedProperty,
          dateRange,
          reviewsData,
          trendData,
          propertyInsightsData,
          actionItems,
          propertyRankMap,
          chainAverageData: chainAverageData,
          tags: { positiveCounts, negativeCounts, taggedReviews },
        });
        const safeName = selectedProperty.replace(/\s+/g, "_");
        const startStr = dateRange[0].toISOString().split("T")[0];
        const endStr = dateRange[1].toISOString().split("T")[0];
        doc.save(`${safeName}_Review_Report_${startStr}_to_${endStr}.pdf`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setRefreshNotification({
        open: true,
        message: `Report generation failed: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Update the return statement's PDF section
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth={false}
        sx={{
          p: 0,
          width: "100% !important",
          maxWidth: "none !important",
          paddingLeft: "16px !important",
          paddingRight: "16px !important",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <BreadcrumbNavigation
            selectedProperty={selectedProperty}
            onPropertyClick={handlePropertyClick}
            rank={(() => {
              if (selectedProperty === "All Properties") return 0;
              // In shared view, use chainAverageData rank
              if (isSharedView && chainAverageData?.property_rank?.rank) return chainAverageData.property_rank.rank;
              // In normal view, calculate from properties list
              if (!displayData.properties?.properties?.length) return 0;
              const prop = displayData.properties.properties.find(p => p.property === selectedProperty);
              return prop ? calculatePropertyRank(prop) : 0;
            })()}
            totalProperties={(() => {
              if (isSharedView && chainAverageData?.total_properties) return chainAverageData.total_properties;
              return displayData.properties?.properties?.length || 0;
            })()}
          />
          <Button
            variant="contained"
            startIcon={
              isPdfLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            onClick={handleDownloadReport}
            disabled={isPdfLoading || isDashboardLoading}
            sx={{
              bgcolor: "primary.main",
              color: "black",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              ml: isSharedView ? "auto" : 0,
            }}
          >
            {isPdfLoading ? "Generating..." : "Download Report"}
          </Button>
        </Stack>

        {/* PDF Content */}
        <div style={{ overflow: "hidden", height: 0, width: 0 }}>
          <div
            ref={targetRef}
            style={{ width: "210mm", backgroundColor: "#ffffff" }}
          >
            <PDFContent
              selectedProperty={selectedProperty}
              dateRange={dateRange}
              displayData={displayData}
              theme={theme}
              isDateRangeOver90Days={isDateRangeOver90Days()}
            />
          </div>
        </div>

        {/* PM Benchmarking Banner (shared view only) */}
        {isSharedView && chainAverageData && (
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              background: "linear-gradient(135deg, rgba(25,118,210,0.08) 0%, rgba(76,175,80,0.08) 100%)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
                {/* Property rating */}
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Your Property</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Star sx={{ color: "primary.main", fontSize: 22 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {chainAverageData.property_rank?.avg_rating?.toFixed(2) || "—"}
                    </Typography>
                  </Stack>
                </Stack>
                {/* Divider */}
                <Box sx={{ width: 1, height: 40, bgcolor: "divider" }} />
                {/* Chain average */}
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Chain Average</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {chainAverageData.avg_rating?.toFixed(2) || "—"}★
                  </Typography>
                </Stack>
                {/* Divider */}
                <Box sx={{ width: 1, height: 40, bgcolor: "divider" }} />
                {/* Rank */}
                <Stack alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Rank</Typography>
                  <Typography variant="h5" sx={{
                    fontWeight: 700,
                    color: chainAverageData.property_rank?.rank <= 3 ? "success.main" : "text.primary",
                  }}>
                    #{chainAverageData.property_rank?.rank || "—"}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {" "}of {chainAverageData.total_properties}
                    </Typography>
                  </Typography>
                </Stack>
              </Stack>
              {/* Top 3 properties */}
              {chainAverageData.top_3 && chainAverageData.top_3.length > 0 && (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Top 3 Properties</Typography>
                  {chainAverageData.top_3.map((p, i) => (
                    <Stack key={p.property_name} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" sx={{
                        fontWeight: 700,
                        color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32",
                        fontSize: i === 0 ? 16 : 14,
                      }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: i === 0 ? 700 : 500,
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {p.property_name}
                      </Typography>
                      <Chip size="small" label={`${p.avg_rating}★`} sx={{
                        bgcolor: i === 0 ? "rgba(255,215,0,0.15)" : i === 1 ? "rgba(192,192,192,0.15)" : "rgba(205,127,50,0.15)",
                        fontWeight: 600,
                        fontSize: 12,
                      }} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        {/* Regular dashboard content */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            color: "#FFFFFF",
          }}
        >
          {selectedProperty === "All Properties"
            ? "All Properties"
            : selectedProperty}
        </Typography>

        {/* Natural Language Query Section */}
        <Accordion
          expanded={nlExpanded}
          onChange={(e, expanded) => setNlExpanded(expanded)}
          sx={{
            mb: 3,
            bgcolor: "background.paper",
            "&:before": { display: "none" },
            borderRadius: "16px !important",
            overflow: "hidden",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              px: 2.5,
              "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 },
            }}
          >
            <AutoAwesomeIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
              Ask Your Data
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Stack spacing={2}>
              {/* Input row */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.5,
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <SearchIcon sx={{ color: "text.disabled", fontSize: 20, mr: 1 }} />
                  <InputBase
                    placeholder="Ask a question about your data..."
                    value={nlQuery}
                    onChange={(e) => setNlQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !nlLoading) handleNlQuery();
                    }}
                    sx={{ flex: 1, fontSize: 14 }}
                    fullWidth
                  />
                  {nlQuery && (
                    <IconButton size="small" onClick={() => { setNlQuery(""); setNlResult(null); setNlError(null); }}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Paper>
                <Button
                  variant="contained"
                  onClick={() => handleNlQuery()}
                  disabled={nlLoading || !nlQuery.trim()}
                  startIcon={nlLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  sx={{ minWidth: 100, height: 42, fontWeight: 600 }}
                >
                  {nlLoading ? "Asking..." : "Ask"}
                </Button>
              </Stack>

              {/* Example question chips — show when no result and no loading */}
              {!nlResult && !nlLoading && !nlError && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, alignSelf: "center" }}>
                    Try:
                  </Typography>
                  {nlExampleQuestions.map((q) => (
                    <Chip
                      key={q}
                      label={q}
                      size="small"
                      variant="outlined"
                      onClick={() => { setNlQuery(q); handleNlQuery(q); }}
                      sx={{
                        cursor: "pointer",
                        fontSize: 12,
                        borderColor: "divider",
                        "&:hover": { borderColor: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Loading bar */}
              {nlLoading && (
                <LinearProgress
                  sx={{
                    borderRadius: 1,
                    "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  }}
                />
              )}

              {/* Error */}
              {nlError && (
                <Alert
                  severity="info"
                  onClose={() => setNlError(null)}
                  sx={{ borderRadius: 2 }}
                >
                  {nlError}
                </Alert>
              )}

              {/* Results */}
              {nlResult && (
                <Stack spacing={1.5}>
                  {/* Summary row */}
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                    <Typography variant="body2" color="text.secondary">
                      {nlResult.rowCount} {nlResult.rowCount === 1 ? "row" : "rows"} &middot; {nlResult.executionTimeMs}ms
                    </Typography>
                    {nlResult.propertyContext && (
                      <Chip
                        label={nlResult.propertyContext}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 24,
                          bgcolor: "rgba(207,255,80,0.15)",
                          color: "rgb(207,255,80)",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Chip
                      icon={<CodeIcon sx={{ fontSize: 14 }} />}
                      label={nlShowSql ? "Hide SQL" : "Show SQL"}
                      size="small"
                      variant={nlShowSql ? "filled" : "outlined"}
                      onClick={() => setNlShowSql(!nlShowSql)}
                      sx={{ fontSize: 11, height: 26, cursor: "pointer" }}
                    />
                    {nlResult.sql && (
                      <Tooltip title="Copy SQL">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(nlResult.sql);
                            setRefreshNotification({ open: true, message: "SQL copied to clipboard", severity: "success" });
                          }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  {/* SQL display */}
                  {nlShowSql && nlResult.sql && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "rgba(0,0,0,0.3)",
                        borderColor: "divider",
                        overflow: "auto",
                        maxHeight: 200,
                      }}
                    >
                      <Typography
                        component="pre"
                        sx={{
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: 12,
                          color: "primary.main",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          m: 0,
                        }}
                      >
                        {nlResult.sql}
                      </Typography>
                    </Paper>
                  )}

                  {/* Hint for null/empty results */}
                  {nlResult.hint && (
                    <Alert severity="info" sx={{ borderRadius: 2, fontSize: 13 }}>
                      {nlResult.hint}
                    </Alert>
                  )}

                  {/* Dynamic results table */}
                  {nlResult.rows && nlResult.rows.length > 0 ? (
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 2, borderColor: "divider", maxHeight: 500 }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {nlResult.columns.map((col) => (
                              <TableCell
                                key={col}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 12,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                  bgcolor: "background.paper",
                                  borderBottom: "2px solid",
                                  borderBottomColor: "divider",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {col.replace(/_/g, " ")}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {nlResult.rows
                            .slice(nlPage * nlRowsPerPage, nlPage * nlRowsPerPage + nlRowsPerPage)
                            .map((row, rowIdx) => (
                              <TableRow
                                key={rowIdx}
                                sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                              >
                                {nlResult.columns.map((col) => (
                                  <TableCell key={col} sx={{ fontSize: 13, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {row[col] === null || row[col] === undefined
                                      ? <Typography variant="caption" color="text.disabled">null</Typography>
                                      : typeof row[col] === "object"
                                      ? JSON.stringify(row[col])
                                      : String(row[col])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {nlResult.rowCount > nlRowsPerPage && (
                        <TablePagination
                          component="div"
                          count={nlResult.rowCount}
                          page={nlPage}
                          onPageChange={(e, p) => setNlPage(p)}
                          rowsPerPage={nlRowsPerPage}
                          onRowsPerPageChange={(e) => { setNlRowsPerPage(parseInt(e.target.value, 10)); setNlPage(0); }}
                          rowsPerPageOptions={[10, 25, 50, 100]}
                          sx={{ borderTop: "1px solid", borderTopColor: "divider" }}
                        />
                      )}
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      No results found for this query.
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Filters Section — Redesigned for clarity */}
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Stack spacing={2}>
            {/* Row 1: Date pickers + period chips + property + refresh */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              {/* Date range */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <DatePicker
                  value={dateRange[0]}
                  onChange={handleStartDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 155, "& .MuiInputBase-root": { fontSize: 13 } },
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, flexShrink: 0 }}>to</Typography>
                <DatePicker
                  value={dateRange[1]}
                  onChange={handleEndDateChange}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 155, "& .MuiInputBase-root": { fontSize: 13 } },
                    },
                  }}
                />
              </Stack>

              {/* Period quick-select chips */}
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {[
                  { days: "1", label: "1d" },
                  { days: "7", label: "7d" },
                  { days: "30", label: "30d" },
                  { days: "90", label: "90d" },
                  { days: "180", label: "6mo" },
                  { days: "365", label: "1yr" },
                ].map((period) => {
                  const isActive = getActivePeriod() === period.days;
                  return (
                    <Chip
                      key={period.days}
                      label={period.label}
                      size="small"
                      onClick={() => handlePeriodChange(period.days)}
                      sx={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 12,
                        height: 28,
                        bgcolor: isActive ? "primary.main" : "transparent",
                        color: isActive ? "primary.contrastText" : "text.secondary",
                        border: isActive ? "none" : "1px solid",
                        borderColor: isActive ? "transparent" : "divider",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isActive ? "primary.dark" : alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    />
                  );
                })}
                {getActivePeriod() === "custom" && (
                  <Chip
                    label="Custom"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 12,
                      height: 28,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  />
                )}
              </Stack>

              {/* Spacer */}
              <Box sx={{ flex: 1 }} />

              {/* Property selector (non-shared view) */}
              {!isSharedView && (
                <Autocomplete
                  value={selectedProperty}
                  onChange={(event, newValue) =>
                    handlePropertyClick(newValue || "All Properties")
                  }
                  options={[
                    "All Properties",
                    ...displayData.properties.properties
                      .map((p) => p.property)
                      .sort((a, b) => a.localeCompare(b)),
                  ]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search property..."
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <SearchIcon sx={{ color: "text.disabled", fontSize: 18, ml: 0.5 }} />
                        ),
                        sx: {
                          fontSize: 13,
                          paddingRight: "14px !important",
                          "& .MuiAutocomplete-endAdornment": { right: "8px" },
                        },
                      }}
                    />
                  )}
                  sx={{ minWidth: 220, maxWidth: 300 }}
                  disableClearable
                  popupIcon={null}
                />
              )}

              {/* Refresh button */}
              <Tooltip title="Refresh data (bypass cache)">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="small"
                  sx={{
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Error Banner — shown when primary data couldn't load */}
        {fetchError && (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ mb: 3 }}
            action={
              <Button
                color="warning"
                size="small"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            }
          >
            {fetchError}
          </Alert>
        )}

        {/* Slow loading message — appears after 2s of loading */}
        {isDashboardLoading && slowLoadingMsg && (
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "text.secondary", mb: 2, fontStyle: "italic" }}
          >
            Good things take time...
          </Typography>
        )}

        {/* KPI Cards */}
        <Grid
          container
          spacing={3}
          sx={{
            mb: 3,
          }}
        >
          {/* Rank Card */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (() => {
              const currentRank = (() => {
                if (selectedProperty === "All Properties") return null;
                if (isSharedView && chainAverageData?.property_rank?.rank) {
                  return { rank: chainAverageData.property_rank.rank, total: chainAverageData.total_properties || 0 };
                }
                if (!displayData.properties?.properties?.length) return null;
                const prop = displayData.properties.properties.find(p => p.property === selectedProperty);
                if (!prop) return null;
                return { rank: calculatePropertyRank(prop), total: displayData.properties.properties.length };
              })();
              const isTop3 = currentRank && currentRank.rank <= 3;
              const percentile = currentRank ? Math.round((currentRank.rank / currentRank.total) * 100) : 100;
              const isBottom = percentile > 80;
              const medal = currentRank?.rank === 1 ? "🥇" : currentRank?.rank === 2 ? "🥈" : currentRank?.rank === 3 ? "🥉" : null;
              return (
                <SummaryCard
                  title="Rank"
                  icon={<TrophyIcon />}
                  value={
                    currentRank ? (
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="baseline" spacing={0.75}>
                          {medal && <Typography sx={{ fontSize: 22, lineHeight: 1 }}>{medal}</Typography>}
                          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, color: isTop3 ? "success.main" : isBottom ? "error.main" : "text.primary" }}>
                            #{currentRank.rank}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: isBottom ? "error.main" : "text.secondary" }}>
                            /{currentRank.total}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: isTop3 ? "success.main" : isBottom ? "error.main" : currentRank.rank <= 10 ? "primary.main" : "text.secondary", fontWeight: 500 }}>
                          {isTop3 ? "Top 3" : currentRank.rank <= 10 ? "Top 10" : isBottom ? `Bottom ${100 - percentile}%` : `Top ${percentile}%`}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>—</Typography>
                    )
                  }
                />
              );
            })()}
          </Grid>

          {/* Average Rating Card */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <SummaryCard
                title="Average Rating"
                value={`${calculateAverageRating(
                  displayData.reviews.reviews
                )}★`}
                icon={<Star />}
                trend={{
                  current: parseFloat(
                    calculateAverageRating(displayData.reviews.reviews)
                  ),
                  previous:
                    parseFloat(
                      calculateAverageRating(
                        displayData.reviews.previous_period?.reviews || []
                      )
                    ) || 0,
                }}
                dateRange={displayData.reviews.previous_period}
              />
            )}
          </Grid>

          {/* Total Guests Card */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <SummaryCard
                title="Total Guests"
                value={(displayData.reviews.total_guests || 0).toLocaleString()}
                icon={<Group />}
                trend={{
                  current: displayData.reviews.total_guests || 0,
                  previous: displayData.reviews.previous_period?.total_guests || 0,
                }}
                dateRange={displayData.reviews.previous_period}
              />
            )}
          </Grid>

          {/* Checkouts Card */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <SummaryCard
                title="Total Checkouts"
                value={displayData.reviews.checkouts.toLocaleString()}
                icon={<ExitToApp />}
                trend={{
                  current: displayData.reviews.checkouts,
                  previous: displayData.reviews.previous_period?.checkouts || 0,
                }}
                dateRange={displayData.reviews.previous_period}
              />
            )}
          </Grid>

          {/* Total Reviews */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <SummaryCard
                title="Total Reviews"
                value={(displayData.reviews.count || 0).toLocaleString()}
                icon={<RateReview />}
                trend={{
                  current: displayData.reviews.count || 0,
                  previous: displayData.reviews.previous_period?.count || 0,
                }}
                dateRange={displayData.reviews.previous_period}
              />
            )}
          </Grid>

          {/* Review Rate Card */}
          <Grid item xs={12} sm={6} md={4}>
            {isDashboardLoading ? (
              <Card sx={{ height: "100%", minHeight: 120 }}>
                <CardContent sx={{ height: "100%", p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={120} />
                    </Stack>
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width={80} height={40} />
                      <Skeleton variant="text" width={100} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <SummaryCard
                title="Review Rate"
                value={`${(
                  ((displayData.reviews.count || 0) /
                    (displayData.reviews.total_guests || 1)) *
                  100
                ).toFixed(1)}%`}
                icon={<Timeline />}
                trend={{
                  current:
                    ((displayData.reviews.count || 0) /
                      (displayData.reviews.total_guests || 1)) *
                    100,
                  previous:
                    ((displayData.reviews.previous_period?.count || 0) /
                      (displayData.reviews.previous_period?.total_guests || 1)) *
                    100,
                }}
                dateRange={displayData.reviews.previous_period}
              />
            )}
          </Grid>

        </Grid>

        {/* ============ Audit Action Items — Linear-style task tracker (TOP of page) ============ */}
          <Paper sx={{ p: 0, mb: 3, overflow: "hidden" }}>
            {/* Section Header */}
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <AssignmentIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 700 }}>Action Items</Typography>
                  {selectedProperty === "All Properties" && (
                    <Chip size="small" label="All Properties" sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.12), color: "info.dark" }} />
                  )}
                  <Chip size="small" label={actionItems.filter(i => i.status !== "done").length + " open"} sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: alpha(theme.palette.warning.main, 0.12), color: "warning.dark" }} />
                  <Chip size="small" label={actionItems.filter(i => i.status === "done").length + " done"} sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.dark" }} />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Button
                      variant="text" size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                      onClick={handleOpenCreateDialog}
                      sx={{ fontSize: 12, textTransform: "none", fontWeight: 600 }}
                    >
                      New Action Item
                    </Button>
                  <Chip size="small" icon={<PersonIcon sx={{ fontSize: 14 }} />} label={currentUserName || "Unknown"} variant="outlined" sx={{ fontSize: 12, height: 26 }} />
                </Stack>
              </Stack>
            </Box>

            {actionItemsLoading ? (
              <Stack spacing={0} sx={{ p: 0 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} sx={{ px: 3, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <>
                {/* Table Header */}
                <Box sx={{ px: 3, py: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={0.75}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Pri.</Typography>
                    </Grid>
                    <Grid item xs={0.5}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>ID</Typography>
                    </Grid>
                    {selectedProperty === "All Properties" && (
                      <Grid item xs={1.5}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Property</Typography>
                      </Grid>
                    )}
                    <Grid item xs={selectedProperty === "All Properties" ? 3.25 : 4.5}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Action Item</Typography>
                    </Grid>
                    <Grid item xs={1.25}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Status</Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Assignee</Typography>
                    </Grid>
                    <Grid item xs={1.25}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Due Date</Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Created</Typography>
                    </Grid>
                    <Grid item xs={selectedProperty === "All Properties" ? 0.25 : 0.75}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, fontSize: 10, textTransform: "uppercase", textAlign: "right" }}></Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Action Items List */}
                {actionItems.length === 0 && (
                  <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
                    <AssignmentIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedProperty === "All Properties"
                        ? "No action items across any properties yet."
                        : "No action items yet. Click 'New' to add one."}
                    </Typography>
                  </Box>
                )}

                {actionItems.map((item) => {
                  const statusConfig = ACTION_STATUSES.find((s) => s.value === item.status) || ACTION_STATUSES[0];
                  const priorityConfig = PRIORITIES.find((p) => p.value === (item.priority || "medium")) || PRIORITIES[2];
                  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "done";
                  return (
                    <Box key={item.id}>
                      <Box
                        sx={{
                          px: 3, py: 1.5,
                          borderBottom: "1px solid", borderColor: "divider",
                          bgcolor: item.status === "done" ? alpha(theme.palette.success.main, 0.02) : isOverdue ? alpha(theme.palette.error.main, 0.03) : "background.paper",
                          opacity: item.status === "done" ? 0.65 : 1,
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                          transition: "background-color 0.15s",
                        }}
                      >
                        <Grid container alignItems="center" spacing={1}>
                          {/* Priority indicator */}
                          <Grid item xs={0.75}>
                            <Tooltip title={priorityConfig.label}>
                              <Box>
                                <FormControl size="small" variant="standard" sx={{ minWidth: 28 }}>
                                  <Select
                                    value={item.priority || "medium"}
                                    onChange={(e) => updateActionItem(item.id, { priority: e.target.value })}
                                    disableUnderline
                                    sx={{ fontSize: 14, "& .MuiSelect-select": { p: 0, pr: "0 !important" } }}
                                    renderValue={(val) => {
                                      const p = PRIORITIES.find(pp => pp.value === val);
                                      return <FlagIcon sx={{ fontSize: 16, color: p?.color || "#bdbdbd" }} />;
                                    }}
                                  >
                                    {PRIORITIES.map((p) => (
                                      <MenuItem key={p.value} value={p.value} sx={{ fontSize: 12 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <FlagIcon sx={{ fontSize: 14, color: p.color }} />
                                          <span>{p.label}</span>
                                        </Stack>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            </Tooltip>
                          </Grid>

                          {/* ID */}
                          <Grid item xs={0.5}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: 11 }}>
                              #{item.id}
                            </Typography>
                          </Grid>

                          {/* Property name (only in All Properties view) */}
                          {selectedProperty === "All Properties" && (
                            <Grid item xs={1.5}>
                              <Tooltip title={item.property_name}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: 11, fontWeight: 500, color: "primary.main", cursor: "pointer",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                  onClick={() => handlePropertyClick(item.property_name)}
                                >
                                  {item.property_name}
                                </Typography>
                              </Tooltip>
                            </Grid>
                          )}

                          {/* Action item title + metadata */}
                          <Grid item xs={selectedProperty === "All Properties" ? 3.25 : 4.5}>
                            <Stack spacing={0.25}>
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Chip size="small" label={item.category} sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main" }} />
                                {item.source === "ai" && <Chip size="small" label="AI" sx={{ fontSize: 9, height: 16, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: "secondary.main" }} />}
                                {item.source === "review" && <Chip size="small" label="Review" sx={{ fontSize: 9, height: 16, bgcolor: alpha(theme.palette.info.main, 0.1), color: "info.main" }} />}
                              </Stack>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13, textDecoration: item.status === "done" ? "line-through" : "none", lineHeight: 1.4 }}>
                                {item.action}
                              </Typography>
                              {item.quoted_review_comment && (
                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic", fontSize: 11 }}>
                                  &ldquo;{item.quoted_review_comment.length > 80 ? item.quoted_review_comment.slice(0, 80) + "..." : item.quoted_review_comment}&rdquo;
                                  {item.quoted_review_guest && ` — ${item.quoted_review_guest}`}
                                  {item.quoted_review_rating && ` (${item.quoted_review_rating}★)`}
                                </Typography>
                              )}
                            </Stack>
                          </Grid>

                          {/* Status */}
                          <Grid item xs={1.25}>
                            <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                              <Select
                                value={item.status}
                                onChange={(e) => updateActionItemStatus(item.id, e.target.value)}
                                disableUnderline
                                sx={{ fontSize: 12, "& .MuiSelect-select": { py: 0.25 } }}
                              >
                                {ACTION_STATUSES.map((s) => (
                                  <MenuItem key={s.value} value={s.value} sx={{ fontSize: 12 }}>
                                    <Chip size="small" label={s.label} color={s.color} variant={item.status === s.value ? "filled" : "outlined"} sx={{ fontSize: 11, height: 22 }} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Assignee */}
                          <Grid item xs={1.5}>
                            <Autocomplete
                              size="small"
                              options={propertyStaff}
                              getOptionLabel={(option) => typeof option === "string" ? option : option.name || ""}
                              freeSolo
                              value={item.assignee || ""}
                              onInputChange={(e, newValue, reason) => {
                                if (reason === "input") {
                                  setActionItems(prev => prev.map(ai => ai.id === item.id ? { ...ai, assignee: newValue } : ai));
                                }
                              }}
                              onChange={(e, newValue) => {
                                const val = typeof newValue === "string" ? newValue : newValue?.name || "";
                                const id = typeof newValue === "string" ? null : newValue?.id || null;
                                updateActionItem(item.id, { assignee: val || null, assigneeId: id });
                              }}
                              onBlur={(e) => {
                                const currentVal = e.target?.value || "";
                                if (currentVal !== (item.assignee || "")) {
                                  updateActionItem(item.id, { assignee: currentVal || null, assigneeId: null });
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="standard"
                                  placeholder="Unassigned"
                                  InputProps={{ ...params.InputProps, disableUnderline: true, sx: { fontSize: 12, px: 0.5, color: item.assignee ? "text.primary" : "text.disabled" } }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id || option.name}>
                                  <Typography variant="body2" sx={{ fontSize: 12 }}>{option.name}{option.role ? ` (${option.role})` : ""}</Typography>
                                </li>
                              )}
                              sx={{ "& .MuiAutocomplete-input": { py: "0 !important" }, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) }, borderRadius: 0.5 }}
                            />
                          </Grid>

                          {/* Due Date */}
                          <Grid item xs={1.25}>
                            <InputBase
                              type="date"
                              value={item.due_date ? new Date(item.due_date).toISOString().split("T")[0] : ""}
                              onChange={(e) => {
                                const newDate = e.target.value || null;
                                updateActionItem(item.id, { dueDate: newDate ? new Date(newDate).toISOString() : null });
                              }}
                              sx={{
                                fontSize: 12, px: 0.75, py: 0.25, borderRadius: 0.5, width: "100%",
                                color: isOverdue ? "error.main" : item.due_date ? "text.primary" : "text.disabled",
                                fontWeight: isOverdue ? 600 : 400,
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                              }}
                            />
                          </Grid>

                          {/* Created date */}
                          <Grid item xs={1}>
                            <Tooltip title={`Created by ${item.created_by || "Unknown"} on ${item.created_at ? new Date(item.created_at).toLocaleString("en-GB") : ""}`}>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                                {item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}
                              </Typography>
                            </Tooltip>
                          </Grid>

                          {/* Actions */}
                          <Grid item xs={selectedProperty === "All Properties" ? 0.25 : 0.75}>
                            <Stack direction="row" justifyContent="flex-end" spacing={0.25}>
                              <Tooltip title={`${(item.comments || []).length} comments`}>
                                <Button
                                  size="small" variant="text"
                                  onClick={() => { setCommentDialogItem(item); setNewCommentText(""); }}
                                  sx={{ fontSize: 11, textTransform: "none", color: "text.secondary", minWidth: 32, p: 0.5 }}
                                >
                                  {(item.comments || []).length > 0 ? `${(item.comments || []).length}` : ""}
                                  <ScheduleIcon sx={{ fontSize: 14, ml: (item.comments || []).length > 0 ? 0.25 : 0 }} />
                                </Button>
                              </Tooltip>
                              <IconButton size="small" onClick={() => deleteActionItem(item.id)} sx={{ p: 0.5 }}>
                                <DeleteIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                              </IconButton>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  );
                })}

              </>
            )}
          </Paper>

        {/* Rating Trends and Distribution Section */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 3 }}>
          {/* Rating Trends */}
          <Box sx={{ flex: { xs: "100%", md: "60%" }, minWidth: 0 }}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rating Trends
              </Typography>
              <Box sx={{ width: "100%", height: propertyTrendLines.length > 0 ? 360 : 300 }}>
                {isDashboardLoading ? (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer>
                    <LineChart
                      data={enrichedTrendData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dateRange"
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        yAxisId="rating"
                        domain={[
                          (dataMin) => Math.floor(Math.min(dataMin, 4)),
                          5,
                        ]}
                        orientation="left"
                        tickFormatter={(value) =>
                          `${Number(value).toFixed(2)}★`
                        }
                      />
                      <YAxis
                        yAxisId="rate"
                        domain={[0, 100]}
                        orientation="right"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip
                        formatter={(value, name) => {
                          if (value == null || (typeof value === "number" && isNaN(value))) return null;
                          if (name === "Average Rating") {
                            const point = trendData.find(
                              (d) => d.avgRating === value
                            );
                            return [
                              `: ${Number(value).toFixed(2)}★ (${
                                point?.reviewCount || 0
                              } reviews)`,
                              name,
                            ];
                          }
                          if (name === "Review Rate") {
                            return [[`: ${value.toFixed(1)}%`], name];
                          }
                          // Per-property lines
                          if (typeof value === "number" && !isNaN(value)) {
                            return [`: ${value.toFixed(2)}★`, name];
                          }
                          return null;
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(33, 33, 33, 0.95)",
                          border: "none",
                          borderRadius: "4px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
                        }}
                        itemStyle={{ color: "#fff" }}
                        labelStyle={{ color: "#fff" }}
                        separator=""
                      />
                      <Legend
                        payload={[
                          { value: "Average Rating", type: "line", color: theme.palette.primary.main },
                          { value: "Review Rate", type: "line", color: theme.palette.success.main },
                        ]}
                      />
                      <Line
                        yAxisId="rating"
                        type="monotone"
                        dataKey="avgRating"
                        name="Average Rating"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        label={({ value, x, y }) => {
                          if (!value) return null;
                          return (
                            <text
                              x={x}
                              y={y - 10}
                              fill={theme.palette.primary.main}
                              fontSize={12}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {Number(value).toFixed(2)}★
                            </text>
                          );
                        }}
                      />
                      <Line
                        yAxisId="rate"
                        type="monotone"
                        dataKey="reviewRate"
                        name="Review Rate"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        label={({ value, x, y }) => {
                          if (!value) return null;
                          return (
                            <text
                              x={x}
                              y={y + 15}
                              fill={theme.palette.success.main}
                              fontSize={12}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {value}%
                            </text>
                          );
                        }}
                      />
                      {/* Per-property trend lines */}
                      {propertyTrendLines.map((line) => (
                        <Line
                          key={line.dataKey}
                          yAxisId="rating"
                          type="monotone"
                          dataKey={line.dataKey}
                          name={line.name}
                          stroke={line.color}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          dot={{ r: 3, fill: line.color, strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 1 }}
                          connectNulls
                          legendType="none"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
              {/* Property Trend Selector Chips — only shown in All Properties view */}
              {selectedProperty === "All Properties" && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
                  {[
                    { key: "top5", label: "Top 5" },
                    { key: "bottom5", label: "Bottom 5" },
                  ].map(({ key, label }) => (
                    <Chip
                      key={key}
                      label={label}
                      size="small"
                      variant={propertyTrendMode === key ? "filled" : "outlined"}
                      color={key.startsWith("top") ? "success" : "error"}
                      onClick={() => setPropertyTrendMode(propertyTrendMode === key ? null : key)}
                      sx={{ fontSize: 12, fontWeight: propertyTrendMode === key ? 600 : 400 }}
                    />
                  ))}
                  {propertyTrendsLoading && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  )}
                  {propertyTrendMode && !propertyTrendsLoading && propertyTrendLines.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, ml: 1, alignItems: "center" }}>
                      {propertyTrendLines.map((line) => (
                        <Typography key={line.dataKey} variant="caption" sx={{ color: line.color, fontSize: 11 }}>
                          {line.name}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Stack>
              )}
            </Paper>
          </Box>

          {/* Rating Distribution */}
          <Box sx={{ flex: { xs: "100%", md: "40%" }, minWidth: 0 }}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rating Distribution
              </Typography>
              <Box sx={{ width: "100%", height: 300 }}>
                {isDashboardLoading ? (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer>
                    <PieChart margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                      <Pie
                        data={[5, 4, 3, 2, 1].map((rating) => ({
                          rating,
                          value: displayData.reviews.reviews.filter(
                            (r) => Math.floor(r.review_rating) === rating
                          ).length,
                          color:
                            rating === 5
                              ? theme.palette.success.dark
                              : rating === 4
                              ? theme.palette.success.light
                              : rating === 3
                              ? theme.palette.warning.main
                              : rating === 2
                              ? theme.palette.error.light
                              : theme.palette.error.dark,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="rating"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          value,
                          rating,
                        }) => {
                          if (!value) return null;
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 1.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill={theme.palette.text.primary}
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                              fontSize={13}
                            >
                              {`${rating}★ (${value})`}
                            </text>
                          );
                        }}
                      >
                        {[5, 4, 3, 2, 1].map((rating, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              rating === 5
                                ? theme.palette.success.dark
                                : rating === 4
                                ? theme.palette.success.light
                                : rating === 3
                                ? theme.palette.warning.main
                                : rating === 2
                                ? theme.palette.error.light
                                : theme.palette.error.dark
                            }
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value, name) => [
                          `${value} reviews`,
                          `${name} stars`,
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(33, 33, 33, 0.95)",
                          border: "none",
                          borderRadius: "4px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
                        }}
                        itemStyle={{ color: "#fff" }}
                        labelStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Properties Needing Attention Section */}
        {selectedProperty === "All Properties" && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Warning sx={{ color: "warning.main", fontSize: 22 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Properties Needing Attention
                  </Typography>
                  {attentionProperties.length > 0 && (
                    <Chip
                      label={`${attentionProperties.length} ${attentionProperties.length === 1 ? "property" : "properties"}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ ml: 1, fontWeight: 500 }}
                    />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Avg rating &lt; 4.0 or &gt;25% low reviews
                </Typography>
              </Stack>

              {attentionPropertiesLoading ? (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" width={320} height={140} />
                  ))}
                </Box>
              ) : attentionProperties.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                  <Typography color="text.secondary">
                    All properties are performing well in the selected time period
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {attentionProperties.map((prop) => {
                    const severityColor = prop.severity === "critical" ? "error" : prop.severity === "warning" ? "warning" : "info";
                    const borderColor = prop.severity === "critical" ? theme.palette.error.main : prop.severity === "warning" ? theme.palette.warning.main : theme.palette.info.main;
                    const bgColor = prop.severity === "critical" ? alpha(theme.palette.error.main, 0.04) : prop.severity === "warning" ? alpha(theme.palette.warning.main, 0.04) : alpha(theme.palette.info.main, 0.04);

                    return (
                      <Box
                        key={prop.property_id}
                        sx={{
                          flex: "1 1 300px",
                          maxWidth: { xs: "100%", sm: "calc(50% - 8px)", lg: "calc(33.33% - 11px)" },
                          border: `1px solid ${alpha(borderColor, 0.3)}`,
                          borderLeft: `4px solid ${borderColor}`,
                          borderRadius: 2,
                          bgcolor: bgColor,
                          p: 2,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": { boxShadow: `0 2px 8px ${alpha(borderColor, 0.15)}`, transform: "translateY(-1px)" },
                        }}
                        onClick={() => handlePropertyClick(prop.property_name)}
                      >
                        {/* Header: Property name + Rating badge */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 13, maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {prop.property_name}
                          </Typography>
                          <Chip
                            label={`${prop.avg_rating.toFixed(1)} ★`}
                            size="small"
                            color={severityColor}
                            sx={{ fontWeight: 700, fontSize: 12 }}
                          />
                        </Stack>

                        {/* Metrics row */}
                        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Reviews</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{prop.total_reviews}</Typography>
                          </Box>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Low Rated</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, color: "error.main" }}>{prop.low_reviews} ({prop.low_review_pct}%)</Typography>
                          </Box>
                          {prop.critical_reviews > 0 && (
                            <Box sx={{ textAlign: "center" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Critical</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, color: "error.dark" }}>{prop.critical_reviews}</Typography>
                            </Box>
                          )}
                        </Stack>

                        {/* Issue chips */}
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                          {(prop.issues || []).map((issue, idx) => (
                            <Chip
                              key={idx}
                              label={issue}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: 10,
                                height: 22,
                                borderColor: alpha(borderColor, 0.4),
                                color: "text.secondary",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* Property Ranking Section */}
        {selectedProperty === "All Properties" && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Property Ranking</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{ width: "8%", cursor: "pointer" }}
                        onClick={() => handleSort("rank")}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Rank
                          {orderBy === "rank" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("property")}
                        sx={{
                          cursor: "pointer",
                          userSelect: "none",
                          width: "25%",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          Property
                          {orderBy === "property" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: "12%", cursor: "pointer" }}
                        onClick={() => handleSort("total_checkouts")}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Bookings
                          {orderBy === "total_checkouts" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: "12%", cursor: "pointer" }}
                        onClick={() => handleSort("reviews")}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Reviews
                          {orderBy === "reviews" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: "12%", cursor: "pointer" }}
                        onClick={() => handleSort("reviewRate")}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Review Rate
                          {orderBy === "reviewRate" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: "15%" }}
                        onClick={() => handleSort("avgRating")}
                        style={{ cursor: "pointer" }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Avg. Rating
                          {orderBy === "avgRating" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ width: "16%" }}
                        onClick={() => handleSort("weightedDelta")}
                        style={{ cursor: "pointer" }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          Weighted Delta
                          {orderBy === "weightedDelta" && (
                            <Typography variant="caption" color="primary">
                              {order === "asc" ? "↑" : "↓"}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isDashboardLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell>
                            <Skeleton />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : displayData.properties.properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No properties found
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayData.properties.properties
                        .map((property) => {
                          // Calculate weighted delta for each property
                          const overallAvgRating =
                            displayData.properties.properties.reduce(
                              (acc, curr) =>
                                acc + curr.avgRating * curr.reviews,
                              0
                            ) /
                            displayData.properties.properties.reduce(
                              (acc, curr) => acc + curr.reviews,
                              0
                            );

                          return {
                            ...property,
                            weightedDelta: (
                              (property.avgRating - overallAvgRating) *
                              property.reviews
                            ).toFixed(1),
                          };
                        })
                        .sort(compareValues)
                        .slice(0, visiblePropertyRows)
                        .map((property) => (
                          <TableRow
                            key={property.property_id}
                            onClick={() => handlePropertyClick(property)}
                            sx={{
                              cursor: "pointer",
                              ...((() => {
                                const rank = calculatePropertyRank(property);
                                if (rank === 1) return { bgcolor: "rgba(255,215,0,0.06)", borderLeft: "3px solid #FFD700" };
                                if (rank === 2) return { bgcolor: "rgba(192,192,192,0.06)", borderLeft: "3px solid #C0C0C0" };
                                if (rank === 3) return { bgcolor: "rgba(205,127,50,0.06)", borderLeft: "3px solid #CD7F32" };
                                return {};
                              })()),
                            }}
                            hover
                          >
                            <TableCell align="center">
                              {(() => {
                                const rank = calculatePropertyRank(property);
                                if (rank === 1) return <Typography sx={{ fontWeight: 700, fontSize: 16 }}>🥇</Typography>;
                                if (rank === 2) return <Typography sx={{ fontWeight: 700, fontSize: 16 }}>🥈</Typography>;
                                if (rank === 3) return <Typography sx={{ fontWeight: 700, fontSize: 16 }}>🥉</Typography>;
                                return rank;
                              })()}
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <ClickablePropertyName
                                  propertyName={property.property}
                                  onClick={(name) => {
                                    handlePropertyClick(name);
                                    const reviewsSection =
                                      document.querySelector(
                                        "#reviews-section"
                                      );
                                    if (reviewsSection) {
                                      reviewsSection.scrollIntoView({
                                        behavior: "smooth",
                                      });
                                    }
                                  }}
                                />
                                {property.avgRating < 3 && (
                                  <Tooltip title="Rating below 3.0 — needs immediate attention">
                                    <Warning color="error" fontSize="small" />
                                  </Tooltip>
                                )}
                                {property.avgRating >= 3 && property.avgRating < 4 && (
                                  <Tooltip title={`Rating ${property.avgRating.toFixed(1)} — below 4.0`}>
                                    <Warning sx={{ color: "warning.main" }} fontSize="small" />
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              {property.total_checkouts.toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              {property.reviews.toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <Typography>
                                {property.reviewRate.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="center"
                                spacing={1}
                              >
                                <Star
                                  sx={{ color: "primary.main", fontSize: 20 }}
                                />
                                {+property.avgRating.toFixed(1)}
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={property.weightedDelta}
                                sx={{
                                  bgcolor:
                                    parseFloat(property.weightedDelta) >= 0
                                      ? alpha(theme.palette.success.main, 0.1)
                                      : alpha(theme.palette.error.main, 0.1),
                                  color:
                                    parseFloat(property.weightedDelta) >= 0
                                      ? "success.main"
                                      : "error.main",
                                  fontWeight: 500,
                                  fontSize: 13,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {!displayData.properties.loading &&
                visiblePropertyRows <
                  displayData.properties.properties.length && (
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    sx={{ alignSelf: "center", mt: 2 }}
                  >
                    Load More
                  </Button>
                )}
            </Stack>
          </Paper>
        )}

        {/* Inventory-wise Rating Breakdown */}
        {!inventoryRatingsLoading && inventoryRatings.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HotelIcon color="primary" />
                <Typography variant="h6">Rating by Room Type</Typography>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Room Type</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Reviews</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Avg Rating</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Positive (4-5★)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Negative (1-2★)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Sentiment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryRatings.map((inv) => {
                      const sentimentScore = inv.review_count > 0
                        ? ((inv.positive_count - inv.negative_count) / inv.review_count * 100).toFixed(0)
                        : 0;
                      const sentimentColor = sentimentScore >= 50 ? "success" : sentimentScore >= 0 ? "warning" : "error";
                      return (
                        <TableRow key={inv.inventory_name} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <HotelIcon fontSize="small" sx={{ color: "text.secondary" }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {inv.inventory_name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">{inv.review_count}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={`${inv.avg_rating}★`}
                              sx={{
                                fontWeight: 600,
                                bgcolor: alpha(
                                  inv.avg_rating >= 4 ? theme.palette.success.main
                                    : inv.avg_rating >= 3 ? theme.palette.warning.main
                                    : theme.palette.error.main,
                                  0.1
                                ),
                                color: inv.avg_rating >= 4 ? "success.main"
                                  : inv.avg_rating >= 3 ? "warning.main"
                                  : "error.main",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                              {inv.positive_count}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                              {inv.negative_count}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={`${sentimentScore > 0 ? "+" : ""}${sentimentScore}%`}
                              color={sentimentColor}
                              variant="outlined"
                              sx={{ fontWeight: 500, fontSize: 12 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Paper>
        )}
        {inventoryRatingsLoading && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={200} />
              </Stack>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Audit Action Items moved to top of property view — see above */}

        {/* Comment Dialog — Activity & History (Linear-style) */}
        <Dialog open={!!commentDialogItem} onClose={() => setCommentDialogItem(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <ScheduleIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="h6" sx={{ fontSize: 16 }}>Activity & History</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setCommentDialogItem(null)}><Close fontSize="small" /></IconButton>
            </Stack>
            {commentDialogItem && (
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: "background.default" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled" }}>#{commentDialogItem.id}</Typography>
                  <Chip size="small" label={commentDialogItem.category} sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main" }} />
                  {(() => { const pc = PRIORITIES.find(p => p.value === (commentDialogItem.priority || "medium")); return pc ? <FlagIcon sx={{ fontSize: 14, color: pc.color }} /> : null; })()}
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{commentDialogItem.action}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.disabled">
                    <PersonIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: "middle" }} />
                    {commentDialogItem.created_by || "Unknown"}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    <CalendarIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: "middle" }} />
                    Created {commentDialogItem.created_at ? new Date(commentDialogItem.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                  </Typography>
                  {commentDialogItem.due_date && (
                    <Typography variant="caption" color={new Date(commentDialogItem.due_date) < new Date() && commentDialogItem.status !== "done" ? "error.main" : "text.disabled"}>
                      <FlagIcon sx={{ fontSize: 12, mr: 0.25, verticalAlign: "middle" }} />
                      Due {new Date(commentDialogItem.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  )}
                  {commentDialogItem.assignee && (
                    <Typography variant="caption" color="text.disabled">
                      Assigned to {commentDialogItem.assignee}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </DialogTitle>
          <DialogContent>
            {commentDialogItem && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {(commentDialogItem.comments || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>No activity yet</Typography>
                )}
                {(commentDialogItem.comments || []).map((c) => {
                  const isSystemComment = c.comment?.startsWith("Status changed") || c.comment?.startsWith("Priority set") || c.comment?.startsWith("Assigned to") || c.comment?.startsWith("Due date") || c.comment?.startsWith("Assignee removed");
                  return (
                    <Box key={c.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: isSystemComment ? alpha(theme.palette.info.main, 0.04) : "background.default", borderLeft: isSystemComment ? "3px solid" : "none", borderLeftColor: "info.light" }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isSystemComment ? "info.main" : "text.primary" }}>
                          {isSystemComment ? "System" : c.author}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(c.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: isSystemComment ? "italic" : "normal", color: isSystemComment ? "text.secondary" : "text.primary" }}>
                        {isSystemComment && c.author && c.author !== "System" ? `${c.author}: ` : ""}{c.comment}
                      </Typography>
                    </Box>
                  );
                })}
                <Stack direction="row" spacing={1} sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                  <InputBase
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && newCommentText.trim()) {
                        e.preventDefault();
                        addComment(commentDialogItem.id, newCommentText.trim());
                        setCommentDialogItem((prev) => ({ ...prev, comments: [...(prev.comments || []), { id: Date.now(), comment: newCommentText.trim(), author: currentUserName || "Unknown", created_at: new Date().toISOString() }] }));
                        setNewCommentText("");
                      }
                    }}
                    multiline maxRows={3}
                    sx={{ flex: 1, px: 1.5, py: 0.5, border: "1px solid", borderColor: "divider", borderRadius: 1, fontSize: 14 }}
                  />
                  <Button
                    variant="contained" size="small"
                    onClick={() => {
                      if (newCommentText.trim()) {
                        addComment(commentDialogItem.id, newCommentText.trim());
                        setCommentDialogItem((prev) => ({ ...prev, comments: [...(prev.comments || []), { id: Date.now(), comment: newCommentText.trim(), author: currentUserName || "Unknown", created_at: new Date().toISOString() }] }));
                        setNewCommentText("");
                      }
                    }}
                    disabled={!newCommentText.trim()}
                  >
                    Post
                  </Button>
                </Stack>
              </Stack>
            )}
          </DialogContent>
        </Dialog>

        {/* Unified Create Action Item Dialog — works for both manual and from-review */}
        <Dialog open={actionItemDialogOpen} onClose={() => { setActionItemDialogOpen(false); setActionItemDialogReview(null); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontSize: 16 }}>
                {actionItemDialogReview ? "Create Action Item from Review" : "Create Action Item"}
              </Typography>
              <IconButton size="small" onClick={() => { setActionItemDialogOpen(false); setActionItemDialogReview(null); }}>
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Quoted review context (only when creating from a review) */}
              {actionItemDialogReview && (
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.04), borderLeft: "3px solid", borderLeftColor: "info.main" }}>
                  <Typography variant="caption" color="text.secondary">
                    {actionItemDialogReview.guest_name} — {actionItemDialogReview.property_name} — {Math.round(actionItemDialogReview.review_rating)}★
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>
                    &ldquo;{actionItemDialogReview.review_comment || "No comment"}&rdquo;
                  </Typography>
                </Box>
              )}

              {/* Property selector — always visible, disabled at property level */}
              <Autocomplete
                size="small"
                options={displayData.properties?.properties?.map(p => p.property).sort((a, b) => a.localeCompare(b)) || []}
                value={selectedProperty !== "All Properties" ? selectedProperty : (actionItemDialogData.targetProperty || null)}
                disabled={selectedProperty !== "All Properties"}
                onChange={(e, newValue) => {
                  setActionItemDialogData(prev => ({ ...prev, targetProperty: newValue || "" }));
                  if (newValue) fetchPropertyStaff(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Property" placeholder="Select property..." />
                )}
              />

              {/* Row 1: Category + Priority */}
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={actionItemDialogData.category || "General"}
                    onChange={(e) => setActionItemDialogData(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    {["General", "Rooms", "Bathroom", "Food", "Cleanliness", "Service", "Amenities"].map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={actionItemDialogData.priority || "medium"}
                    onChange={(e) => setActionItemDialogData(prev => ({ ...prev, priority: e.target.value }))}
                    label="Priority"
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value} sx={{ fontSize: 13 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <FlagIcon sx={{ fontSize: 14, color: p.color }} />
                          <span>{p.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Row 2: Action item text */}
              <TextField
                fullWidth size="small" label="Action Item" placeholder="What needs to be done?"
                value={newActionText} onChange={(e) => setNewActionText(e.target.value)} multiline maxRows={3}
                autoFocus
              />

              {/* Row 3: Assignee (staff dropdown with search) + Due Date (calendar picker) */}
              <Stack direction="row" spacing={2}>
                <Autocomplete
                  size="small"
                  sx={{ flex: 1 }}
                  options={propertyStaff}
                  getOptionLabel={(option) => typeof option === "string" ? option : option.name || ""}
                  loading={propertyStaffLoading}
                  value={propertyStaff.find(s => s.name === actionItemDialogData.assignee) || null}
                  onChange={(e, newValue) => {
                    const val = newValue?.name || "";
                    const id = newValue?.id || null;
                    setActionItemDialogData(prev => ({ ...prev, assignee: val, assigneeId: id }));
                  }}
                  noOptionsText={propertyStaffLoading ? "Loading staff..." : "No staff found"}
                  renderInput={(params) => (
                    <TextField {...params} label="Assignee" placeholder="Select staff..." />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id || option.name}>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                        {option.role && <Typography variant="caption" color="text.secondary">{option.role}</Typography>}
                      </Stack>
                    </li>
                  )}
                />
                <DatePicker
                  label="Due Date"
                  value={actionItemDialogData.dueDate ? new Date(actionItemDialogData.dueDate) : null}
                  onChange={(newDate) => {
                    setActionItemDialogData(prev => ({
                      ...prev,
                      dueDate: newDate ? newDate.toISOString().split("T")[0] : "",
                    }));
                  }}
                  slotProps={{
                    textField: { size: "small", sx: { flex: 1 } },
                  }}
                  minDate={new Date()}
                />
              </Stack>

              {/* Action buttons */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" size="small" onClick={() => { setActionItemDialogOpen(false); setActionItemDialogReview(null); }}>Cancel</Button>
                <Button
                  variant="contained" size="small" startIcon={<AddIcon />}
                  disabled={!newActionText.trim() || (selectedProperty === "All Properties" && !actionItemDialogReview && !actionItemDialogData.targetProperty)}
                  onClick={async () => {
                    const itemPayload = {
                      category: actionItemDialogData.category || "General",
                      action: newActionText.trim(),
                      source: actionItemDialogReview ? "review" : "manual",
                      priority: actionItemDialogData.priority || "medium",
                      assignee: actionItemDialogData.assignee || null,
                      assigneeId: actionItemDialogData.assigneeId || null,
                      dueDate: actionItemDialogData.dueDate ? new Date(actionItemDialogData.dueDate).toISOString() : null,
                    };
                    // Set property name for All Properties view
                    if (selectedProperty === "All Properties" && actionItemDialogData.targetProperty) {
                      itemPayload.propertyName = actionItemDialogData.targetProperty;
                    }
                    // Add quoted review data if creating from a review
                    if (actionItemDialogReview) {
                      itemPayload.quotedReviewId = actionItemDialogReview.unique_review_id;
                      itemPayload.quotedReviewComment = actionItemDialogReview.review_comment;
                      itemPayload.quotedReviewRating = actionItemDialogReview.review_rating;
                      itemPayload.quotedReviewGuest = actionItemDialogReview.guest_name;
                      itemPayload.quotedReviewDate = actionItemDialogReview.review_created_at;
                      itemPayload.quotedInventoryName = actionItemDialogReview.inventory_name || null;
                    }
                    await createActionItem(itemPayload);
                    setActionItemDialogOpen(false);
                    setActionItemDialogReview(null);
                    setNewActionText("");
                    setActionItemDialogData({ priority: "medium", assignee: "", assigneeId: null, dueDate: "", category: "General" });
                  }}
                >
                  Create
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* ============ Property Action Items Popup ============ */}
        <Dialog
          open={!!actionItemsPopupProperty}
          onClose={() => { setActionItemsPopupProperty(null); setActionItemsPopupItems([]); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <ListAltIcon sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontSize: 16 }}>
                  Action Items — {actionItemsPopupProperty}
                </Typography>
                {!actionItemsPopupLoading && (
                  <Chip size="small" label={`${actionItemsPopupItems.filter(i => i.status !== "done").length} open`} sx={{ fontSize: 10, height: 20, bgcolor: alpha(theme.palette.warning.main, 0.12), color: "warning.dark" }} />
                )}
              </Stack>
              <IconButton size="small" onClick={() => { setActionItemsPopupProperty(null); setActionItemsPopupItems([]); }}>
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {actionItemsPopupLoading ? (
              <Stack spacing={1.5} sx={{ py: 2 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={48} />
                ))}
              </Stack>
            ) : actionItemsPopupItems.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>No action items for this property yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1} sx={{ py: 1 }}>
                {actionItemsPopupItems.map((item) => {
                  const statusObj = ACTION_STATUSES.find(s => s.value === item.status) || ACTION_STATUSES[0];
                  const priorityObj = PRIORITIES.find(p => p.value === item.priority) || PRIORITIES[2];
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.5, borderRadius: 1, border: "1px solid", borderColor: "divider",
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                        <FlagIcon sx={{ fontSize: 14, color: priorityObj.color, mt: 0.25, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                            {item.action}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip size="small" label={statusObj.label} sx={{ fontSize: 10, height: 18, bgcolor: alpha(theme.palette[statusObj.color === "default" ? "grey" : statusObj.color].main, 0.12), color: statusObj.color === "default" ? "text.secondary" : `${statusObj.color}.dark` }} />
                            {item.category && <Typography variant="caption" color="text.disabled">{item.category}</Typography>}
                            {item.assignee && (
                              <Stack direction="row" alignItems="center" spacing={0.25}>
                                <PersonIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                                <Typography variant="caption" color="text.secondary">{item.assignee}</Typography>
                              </Stack>
                            )}
                            {item.due_date && (
                              <Stack direction="row" alignItems="center" spacing={0.25}>
                                <CalendarIcon sx={{ fontSize: 11, color: "text.disabled" }} />
                                <Typography variant="caption" color="text.secondary">{formatDate(new Date(item.due_date))}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                onClick={() => {
                  const propName = actionItemsPopupProperty;
                  setActionItemsPopupProperty(null);
                  setActionItemsPopupItems([]);
                  setActionItemDialogData({ priority: "medium", assignee: "", assigneeId: null, dueDate: "", category: "General", targetProperty: propName });
                  setNewActionText("");
                  if (propName) fetchPropertyStaff(propName);
                  setActionItemDialogOpen(true);
                }}
                sx={{ fontSize: 12, textTransform: "none" }}
              >
                New Action Item
              </Button>
              <Button
                size="small" variant="text"
                onClick={() => {
                  handlePropertyClick(actionItemsPopupProperty);
                  setActionItemsPopupProperty(null);
                  setActionItemsPopupItems([]);
                  document.querySelector("#reviews-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                sx={{ fontSize: 12, textTransform: "none" }}
              >
                Go to Property →
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* ============ Reviews Section — Redesigned for actionability ============ */}
        <Paper id="reviews-section" sx={{ p: 0, mb: 3, overflow: "hidden" }}>
          {/* Header + Quick Tabs */}
          <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <RateReview sx={{ color: "primary.main", fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 700 }}>Reviews</Typography>
                <Typography variant="body2" color="text.secondary">{filteredReviews.length} total</Typography>
              </Stack>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={handleExportCSV} disabled={filteredReviews.length === 0} sx={{ fontSize: 12, textTransform: "none" }}>
                Export CSV
              </Button>
            </Stack>

            {/* Quick-filter tabs */}
            <Stack direction="row" spacing={0.5} sx={{ borderBottom: "2px solid", borderColor: "divider" }}>
              {[
                { key: "all", label: "All", count: filteredReviews.length, color: "primary" },
                { key: "actionable", label: "Actionable", count: actionableCount, color: "error" },
                { key: "negative", label: "Low Rating", count: negativeCount, color: "warning" },
                { key: "positive", label: "Positive", count: positiveCount, color: "success" },
                { key: "untracked", label: "Untracked", count: untrackedCount, color: "warning" },
              ].map((tab) => (
                <Box
                  key={tab.key}
                  onClick={() => { setReviewFilterTab(tab.key); setPage(0); }}
                  sx={{
                    px: 2, py: 1.25, cursor: "pointer",
                    borderBottom: reviewFilterTab === tab.key ? "2px solid" : "2px solid transparent",
                    borderBottomColor: reviewFilterTab === tab.key ? `${tab.color}.main` : "transparent",
                    mb: "-2px",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    borderRadius: "8px 8px 0 0",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: reviewFilterTab === tab.key ? 700 : 500, color: reviewFilterTab === tab.key ? `${tab.color}.main` : "text.secondary", fontSize: 13 }}>
                      {tab.label}
                    </Typography>
                    <Chip size="small" label={tab.count} sx={{
                      height: 20, fontSize: 11, fontWeight: 600,
                      bgcolor: reviewFilterTab === tab.key ? alpha(theme.palette[tab.color].main, 0.12) : alpha(theme.palette.divider, 0.5),
                      color: reviewFilterTab === tab.key ? `${tab.color}.main` : "text.secondary",
                    }} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* AI Summary & Theme Tags — inside Reviews section */}
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
            {/* Issue + Positive category chips — keyword-detected using shared tag system */}
            {(() => {
              const allPropertyReviews = (reviewsData?.reviews || []).filter((r) => selectedProperty === "All Properties" || r.property_name === selectedProperty);
              const { issues: detectedIssues, positives: detectedPositives } = detectAggregateReviewTags(allPropertyReviews);

              if (detectedIssues.length === 0 && detectedPositives.length === 0) return null;

              return (
                <Box sx={{ mb: 1.5 }}>
                  <Stack direction="row" alignItems="flex-start" sx={{ gap: 4, flexWrap: "wrap" }}>
                    {/* Issues — left side */}
                    {detectedIssues.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" sx={{ fontSize: 11, color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mr: 0.5 }}>Issues</Typography>
                        {detectedIssues.map((issue) => {
                          const isActive = activeTagFilters.some((f) => f.type === "issue" && f.label === issue);
                          const progress = tagProgressMap.get(`issue:${issue}`);
                          const dotColor = progress && progress.total > 0
                            ? progress.addressed >= progress.total ? theme.palette.success.main
                              : progress.addressed > 0 ? theme.palette.warning.main
                              : null
                            : null;
                          return (
                            <Chip
                              key={issue}
                              label={<Stack direction="row" alignItems="center" spacing={0.5} component="span">{dotColor && <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: isActive ? "#fff" : dotColor, flexShrink: 0 }} />}<span>{issue}</span></Stack>}
                              size="small"
                              variant={isActive ? "filled" : "outlined"}
                              onClick={() => {
                                setActiveTagFilters((prev) =>
                                  isActive
                                    ? prev.filter((f) => !(f.type === "issue" && f.label === issue))
                                    : [...prev, { type: "issue", label: issue }]
                                );
                                setPage(0);
                              }}
                              sx={{
                                fontSize: 11,
                                height: 24,
                                fontWeight: isActive ? 700 : 500,
                                cursor: "pointer",
                                borderColor: isActive ? theme.palette.error.main : alpha(theme.palette.error.main, 0.5),
                                color: isActive ? "#fff" : "error.main",
                                bgcolor: isActive ? theme.palette.error.main : alpha(theme.palette.error.main, 0.06),
                                "&:hover": { bgcolor: isActive ? theme.palette.error.dark : alpha(theme.palette.error.main, 0.14), borderColor: theme.palette.error.main },
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}

                    {/* Positives — right side */}
                    {detectedPositives.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, flex: 1, minWidth: 200 }}>
                        <Typography variant="caption" sx={{ fontSize: 11, color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, mr: 0.5 }}>Positives</Typography>
                        {detectedPositives.map((pos) => {
                          const isActive = activeTagFilters.some((f) => f.type === "positive" && f.label === pos);
                          const progress = tagProgressMap.get(`positive:${pos}`);
                          const dotColor = progress && progress.total > 0
                            ? progress.addressed >= progress.total ? theme.palette.success.main
                              : progress.addressed > 0 ? theme.palette.warning.main
                              : null
                            : null;
                          return (
                            <Chip
                              key={pos}
                              label={<Stack direction="row" alignItems="center" spacing={0.5} component="span">{dotColor && <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: isActive ? "#fff" : dotColor, flexShrink: 0 }} />}<span>{pos}</span></Stack>}
                              size="small"
                              variant={isActive ? "filled" : "outlined"}
                              onClick={() => {
                                setActiveTagFilters((prev) =>
                                  isActive
                                    ? prev.filter((f) => !(f.type === "positive" && f.label === pos))
                                    : [...prev, { type: "positive", label: pos }]
                                );
                                setPage(0);
                              }}
                              sx={{
                                fontSize: 11,
                                height: 24,
                                fontWeight: isActive ? 700 : 500,
                                cursor: "pointer",
                                borderColor: isActive ? theme.palette.success.main : alpha(theme.palette.success.main, 0.5),
                                color: isActive ? "#fff" : "success.main",
                                bgcolor: isActive ? theme.palette.success.main : alpha(theme.palette.success.main, 0.06),
                                "&:hover": { bgcolor: isActive ? theme.palette.success.dark : alpha(theme.palette.success.main, 0.14), borderColor: theme.palette.success.main },
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>

                  {/* Clear filters — bottom right, only when filters are active */}
                  {activeTagFilters.length > 0 && (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Chip
                        label={`Clear ${activeTagFilters.length} filter${activeTagFilters.length > 1 ? "s" : ""}`}
                        size="small"
                        onClick={() => { setActiveTagFilters([]); setPage(0); }}
                        sx={{
                          fontSize: 11,
                          height: 24,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "primary.main",
                          borderColor: "primary.main",
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                          "& .MuiChip-label": { px: 1.5 },
                        }}
                        variant="outlined"
                      />
                    </Stack>
                  )}
                </Box>
              );
            })()}

          </Box>

          {/* Compact filter bar */}
          <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                <Select value={selectedRating} onChange={(e) => { setSelectedRating(e.target.value); setPage(0); }} disableUnderline sx={{ fontSize: 12 }}>
                  <MenuItem value="all" sx={{ fontSize: 12 }}>All Ratings</MenuItem>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <MenuItem key={r} value={r} sx={{ fontSize: 12 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Star sx={{ fontSize: 14, color: r > 3 ? "success.main" : r === 3 ? "warning.main" : "error.main" }} />
                        <span>{r} star</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip
                size="small"
                label="Has text"
                variant={showOnlyTextual ? "filled" : "outlined"}
                onClick={() => { setShowOnlyTextual(!showOnlyTextual); setPage(0); }}
                sx={{ fontSize: 11, height: 24, cursor: "pointer", fontWeight: showOnlyTextual ? 600 : 400 }}
                color={showOnlyTextual ? "primary" : "default"}
              />
              <Box sx={{ height: 16, borderLeft: "1px solid", borderColor: "divider" }} />
              {/* Emoji reaction filter chips */}
              <Chip
                size="small"
                label="No reaction"
                variant={emojiFilter === "none" ? "filled" : "outlined"}
                onClick={() => { setEmojiFilter(emojiFilter === "none" ? "all" : "none"); setPage(0); }}
                sx={{ fontSize: 11, height: 24, cursor: "pointer", fontWeight: emojiFilter === "none" ? 600 : 400 }}
                color={emojiFilter === "none" ? "primary" : "default"}
              />
              <Chip
                size="small"
                label="All"
                variant={emojiFilter === "all" ? "filled" : "outlined"}
                onClick={() => { setEmojiFilter("all"); setPage(0); }}
                sx={{ fontSize: 11, height: 24, cursor: "pointer", fontWeight: emojiFilter === "all" ? 600 : 400 }}
                color={emojiFilter === "all" ? "primary" : "default"}
              />
              {REACTION_EMOJIS.map(({ emoji, label }) => (
                <Tooltip key={emoji} title={label} arrow>
                  <Chip
                    size="small"
                    label={emoji}
                    variant={emojiFilter === emoji ? "filled" : "outlined"}
                    onClick={() => { setEmojiFilter(emojiFilter === emoji ? "all" : emoji); setPage(0); }}
                    sx={{ fontSize: 13, height: 24, cursor: "pointer", fontWeight: emojiFilter === emoji ? 600 : 400, minWidth: 32 }}
                    color={emojiFilter === emoji ? "primary" : "default"}
                  />
                </Tooltip>
              ))}
              <Box sx={{ flex: 1 }}>
                <InputBase
                  placeholder="Search guest, booking, or review text..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  startAdornment={<SearchIcon sx={{ color: "text.disabled", fontSize: 18, mr: 0.75 }} />}
                  sx={{ fontSize: 13, width: "100%", px: 1, py: 0.25, borderRadius: 1, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Actionable alert banner (only on actionable tab) */}
          {reviewFilterTab === "actionable" && actionableCount > 0 && !isDashboardLoading && (
            <Box sx={{ px: 3, py: 1.25, bgcolor: alpha(theme.palette.error.main, 0.06), borderBottom: "1px solid", borderColor: alpha(theme.palette.error.main, 0.15) }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Warning sx={{ fontSize: 16, color: "error.main" }} />
                <Typography variant="body2" sx={{ fontSize: 12, color: "error.main", fontWeight: 600 }}>
                  {actionableCount} review{actionableCount !== 1 ? "s" : ""} rated 1-3★ with feedback — these need attention
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Review cards */}
          <Stack spacing={0}>
            {isDashboardLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Box key={i} sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" height={20} />
                      <Skeleton variant="text" width="90%" height={16} />
                      <Skeleton variant="text" width="60%" height={16} />
                    </Box>
                  </Stack>
                </Box>
              ))
            ) : paginatedReviews.length === 0 ? (
              <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
                <RateReview sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {reviewFilterTab === "actionable" ? "No actionable reviews — all feedback is positive!" : "No reviews match the current filters"}
                </Typography>
              </Box>
            ) : (
              paginatedReviews.map((review) => {
                const rating = Math.round(review.review_rating);
                const ratingColor = rating >= 4 ? "success" : rating === 3 ? "warning" : "error";
                const hasComment = review.review_comment && review.review_comment.trim() !== "";

                // Use pre-computed tag map (O(1) lookup instead of recomputing per render)
                const _cachedTags = reviewTagMap.get(review.unique_review_id) || { issueTags: [], positiveTags: [] };
                const { issueTags: reviewIssueTags, positiveTags: reviewPositiveTags } = _cachedTags;

                return (
                  <Box
                    key={review.unique_review_id}
                    sx={{
                      px: 3, py: 2,
                      borderBottom: "1px solid", borderColor: "divider",
                      bgcolor: rating <= 2 && hasComment ? alpha(theme.palette.error.main, 0.02) : "background.paper",
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                      transition: "background-color 0.15s",
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      {/* Rating badge */}
                      <Box sx={{
                        width: 40, height: 40, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: alpha(theme.palette[ratingColor].main, 0.12),
                        color: `${ratingColor}.main`, fontWeight: 800, fontSize: 16,
                        flexShrink: 0, mt: 0.25,
                      }}>
                        {rating}
                      </Box>

                      {/* Review content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Top line: guest, property, room, date, source */}
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                            {review.guest_name}
                          </Typography>
                          {selectedProperty === "All Properties" && (
                            <>
                              <Typography
                                variant="caption" color="primary.main"
                                sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}
                                onClick={() => { handlePropertyClick(review.property_name); document.querySelector("#reviews-section")?.scrollIntoView({ behavior: "smooth" }); }}
                              >
                                {review.property_name}
                              </Typography>
                              <Tooltip title="View action items" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); openActionItemsPopup(review.property_name); }}
                                  sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "primary.main" } }}
                                >
                                  <ListAltIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {review.room_name && (
                            <Chip size="small" icon={<HotelIcon sx={{ fontSize: 12 }} />} label={review.room_name} variant="outlined" sx={{ fontSize: 11, height: 20, fontWeight: 500, borderColor: alpha(theme.palette.primary.main, 0.2), color: "text.secondary" }} />
                          )}
                          <Typography variant="caption" color="text.disabled">
                            {formatDate(new Date(review.review_created_at))}
                          </Typography>
                          {review.review_source === "whatsapp" && <WhatsAppIcon sx={{ fontSize: 13, color: "text.disabled" }} />}
                          {review.review_source === "app" && <SmartphoneIcon sx={{ fontSize: 13, color: "text.disabled" }} />}
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: 10 }}>
                            {review.cb_booking_code}
                          </Typography>
                        </Stack>

                        {/* Review text */}
                        {hasComment ? (
                          <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.5, color: "text.primary" }}>
                            {review.review_comment}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: 12, color: "text.disabled", fontStyle: "italic" }}>
                            No written feedback
                          </Typography>
                        )}

                        {/* Review tags (issues for low ratings, positives for high ratings) */}
                        {(reviewIssueTags.length > 0 || reviewPositiveTags.length > 0) && (
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                            {reviewIssueTags.map((tag, idx) => (
                              <Chip
                                key={`issue-${idx}`}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: 10,
                                  height: 22,
                                  borderColor: alpha(theme.palette.error.main, 0.4),
                                  color: "error.main",
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            ))}
                            {reviewPositiveTags.map((tag, idx) => (
                              <Chip
                                key={`pos-${idx}`}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: 10,
                                  height: 22,
                                  borderColor: alpha(theme.palette.success.main, 0.4),
                                  color: "success.main",
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            ))}
                          </Stack>
                        )}

                        {/* ─── Reaction bar + Action item status ─── */}
                        {(() => {
                          const rid = review.unique_review_id;
                          const reactions = reviewReactions[rid] || [];
                          const linkedItems = reviewActionItemMap.get(rid) || [];
                          // Derive action item status chip
                          let aiStatus = null;
                          if (linkedItems.length > 0) {
                            const allDone = linkedItems.every((i) => i.status === "done");
                            const anyInProgress = linkedItems.some((i) => i.status === "pending" || i.status === "in_progress");
                            if (allDone) aiStatus = { label: "Resolved", color: "success" };
                            else if (anyInProgress) aiStatus = { label: "In Progress", color: "info" };
                            else aiStatus = { label: "Flagged", color: "warning" };
                            const assignee = linkedItems[0]?.assignee;
                            if (assignee) aiStatus.assignee = assignee;
                          }
                          // Group reactions by emoji for counts
                          const emojiCounts = {};
                          const emojiUsers = {};
                          for (const r of reactions) {
                            emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
                            if (!emojiUsers[r.emoji]) emojiUsers[r.emoji] = [];
                            emojiUsers[r.emoji].push(r.user_name);
                          }
                          const hasAny = reactions.length > 0 || aiStatus;
                          return (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: hasAny ? 1 : 0.5, flexWrap: "wrap", gap: 0.5 }}>
                              {/* Action item status chip */}
                              {aiStatus && (
                                <Chip
                                  size="small"
                                  label={aiStatus.assignee ? `${aiStatus.label} → ${aiStatus.assignee}` : aiStatus.label}
                                  sx={{
                                    fontSize: 10, height: 20, fontWeight: 600,
                                    bgcolor: alpha(theme.palette[aiStatus.color].main, 0.1),
                                    color: `${aiStatus.color}.main`,
                                    "& .MuiChip-label": { px: 0.75 },
                                  }}
                                />
                              )}
                              {/* Existing reactions with counts */}
                              {REACTION_EMOJIS.map(({ emoji, label }) => {
                                const count = emojiCounts[emoji] || 0;
                                const users = emojiUsers[emoji] || [];
                                const isMine = users.includes(currentUserName || "Unknown");
                                if (count === 0) return null;
                                return (
                                  <Tooltip key={emoji} title={`${label}: ${users.join(", ")}`} arrow>
                                    <Box
                                      onClick={(e) => { e.stopPropagation(); toggleReaction(rid, review.property_name, emoji); }}
                                      sx={{
                                        display: "inline-flex", alignItems: "center", gap: 0.25,
                                        px: 0.75, py: 0.25, borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: isMine ? alpha(theme.palette.primary.main, 0.4) : "divider",
                                        bgcolor: isMine ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                                        cursor: "pointer", fontSize: 13, lineHeight: 1,
                                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), borderColor: alpha(theme.palette.primary.main, 0.4) },
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      <span>{emoji}</span>
                                      <Typography component="span" sx={{ fontSize: 10, fontWeight: 600, color: isMine ? "primary.main" : "text.secondary" }}>{count}</Typography>
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Stack>
                          );
                        })()}
                      </Box>

                      {/* Right side actions: + → action item → WhatsApp (escalation flow) */}
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                        {/* Add reaction */}
                        <Box sx={{ position: "relative" }}>
                          <Tooltip title="Add reaction" arrow>
                            <Box
                              onClick={(e) => { e.stopPropagation(); setReactionPickerOpen((prev) => prev === review.unique_review_id ? null : review.unique_review_id); }}
                              sx={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 26, height: 26, borderRadius: "50%",
                                border: "1px dashed",
                                borderColor: reactionPickerOpen === review.unique_review_id ? alpha(theme.palette.primary.main, 0.4) : "divider",
                                cursor: "pointer", fontSize: 13,
                                color: reactionPickerOpen === review.unique_review_id ? "primary.main" : "text.disabled",
                                bgcolor: reactionPickerOpen === review.unique_review_id ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06), borderColor: alpha(theme.palette.primary.main, 0.3), color: "text.secondary" },
                                transition: "all 0.15s",
                              }}
                            >
                              +
                            </Box>
                          </Tooltip>
                          {reactionPickerOpen === review.unique_review_id && (
                            <>
                              <Box onClick={(e) => { e.stopPropagation(); setReactionPickerOpen(null); }} sx={{ position: "fixed", inset: 0, zIndex: 9 }} />
                              <Stack
                                direction="row" spacing={0.25}
                                sx={{
                                  position: "absolute", bottom: "100%", right: 0,
                                  mb: 0.5, px: 0.75, py: 0.5, borderRadius: 1.5,
                                  bgcolor: "background.paper", boxShadow: 3, border: "1px solid", borderColor: "divider",
                                  zIndex: 10,
                                }}
                              >
                                {REACTION_EMOJIS.map(({ emoji: re, label: rl }) => (
                                  <Tooltip key={re} title={rl} arrow>
                                    <Box
                                      onClick={(e) => { e.stopPropagation(); toggleReaction(review.unique_review_id, review.property_name, re); setReactionPickerOpen(null); }}
                                      sx={{
                                        px: 0.5, py: 0.25, borderRadius: 0.75, cursor: "pointer", fontSize: 14,
                                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1), transform: "scale(1.2)" },
                                        transition: "all 0.1s",
                                      }}
                                    >
                                      {re}
                                    </Box>
                                  </Tooltip>
                                ))}
                              </Stack>
                            </>
                          )}
                        </Box>
                        {/* Create / view action item */}
                        {hasComment && (() => {
                          const linked = reviewActionItemMap.get(review.unique_review_id);
                          const aiColor = linked
                            ? linked.every((i) => i.status === "done") ? "success.main"
                              : linked.some((i) => i.status === "pending" || i.status === "in_progress") ? "info.main"
                              : "warning.main"
                            : rating <= 3 ? "error.main" : "primary.main";
                          const aiTooltip = linked ? `${linked.length} action item${linked.length > 1 ? "s" : ""} linked` : "Create action item";
                          return (
                            <Tooltip title={aiTooltip}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCreateActionFromReview(review); }} sx={{ p: 0.5, color: aiColor }}>
                                <AssignmentIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          );
                        })()}
                        {/* WhatsApp guest */}
                        {review.guest_mobile && (
                          <Tooltip title={`WhatsApp ${review.guest_name}`}>
                            <IconButton
                              size="small"
                              component="a"
                              href={`https://wa.me/${review.guest_mobile.replace(/[^0-9]/g, "").replace(/^0+/, "91")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0.5, color: "#25D366", "&:hover": { bgcolor: alpha("#25D366", 0.1) } }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })
            )}
          </Stack>

          {/* Pagination */}
          <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Showing {paginatedReviews.length} of {tabFilteredReviews.length} {reviewFilterTab !== "all" ? reviewFilterTab : ""} reviews
              </Typography>
              <TablePagination
                component="div"
                count={tabFilteredReviews.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                sx={{ ".MuiTablePagination-toolbar": { minHeight: 36 } }}
              />
            </Stack>
          </Box>
        </Paper>
      </Container>

      {/* Property Review Modal */}
      {selectedPropertyForModal && (
        <PropertyReviewModal
          property={selectedPropertyForModal}
          onClose={() => setSelectedPropertyForModal(null)}
        />
      )}

      {/* Copy Notification Snackbar */}
      <Snackbar
        open={copyNotification.open}
        autoHideDuration={3000}
        onClose={() =>
          setCopyNotification({ ...copyNotification, open: false })
        }
      >
        <Alert severity="success" variant="filled">
          {copyNotification.message}
        </Alert>
      </Snackbar>

      {/* Search Modal */}
      <Modal
        open={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setModalSearchQuery(""); // Clear search when closing
        }}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          pt: 10,
        }}
        onRendered={() => {
          // Force focus on input when modal opens
          const searchInput = document.querySelector("#modal-search-input");
          if (searchInput) {
            searchInput.focus();
          }
        }}
      >
        <Paper
          elevation={5}
          sx={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 2,
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <SearchIcon
              sx={{
                color: "text.secondary",
                mr: 2,
              }}
            />
            <InputBase
              id="modal-search-input"
              autoFocus
              placeholder="Search properties or reviews..."
              value={modalSearchQuery}
              onChange={(e) => handleModalSearch(e.target.value)}
              sx={{
                flex: 1,
                fontSize: "1.1rem",
                "& input": {
                  p: 0,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.5,
                bgcolor: "background.default",
                borderRadius: 1,
                color: "text.secondary",
              }}
            >
              {navigator.platform.includes("Mac") ? "⌘K" : "Ctrl+K"}
            </Typography>
          </Box>

          {/* Search Results */}
          {modalSearchQuery && (
            <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
              {/* Properties Section */}
              {searchResults.properties.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Properties
                  </Typography>
                  <Stack spacing={1}>
                    {searchResults.properties.map((property) => (
                      <Paper
                        key={property}
                        onClick={() => {
                          handlePropertyClick(property);
                          setSearchModalOpen(false);
                        }}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "background.default",
                          },
                        }}
                      >
                        <ClickablePropertyName
                          propertyName={property}
                          onClick={(name) => {
                            handlePropertyClick(name);
                            setSearchModalOpen(false);
                          }}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Reviews Section */}
              {searchResults.reviews.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Reviews
                  </Typography>
                  <Stack spacing={1}>
                    {searchResults.reviews.map((review) => (
                      <Paper
                        key={review.cb_booking_id}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "background.default",
                          },
                        }}
                        onClick={() => {
                          setSelectedReview(review);
                          setSearchModalOpen(false);
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {review.guest_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.cb_booking_code} • {review.property_name}
                            {review.guest_phone && (
                              <>
                                {" • "}
                                <span style={{ fontFamily: "monospace" }}>
                                  {review.guest_phone}
                                </span>
                              </>
                            )}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* No Results */}
              {searchResults.properties.length === 0 &&
                searchResults.reviews.length === 0 && (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      No matching results found
                    </Typography>
                  </Box>
                )}
            </Box>
          )}
        </Paper>
      </Modal>

      {/* Review Modal */}
      <Dialog
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedReview && (
          <>
            <DialogTitle>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6">Review Details</Typography>
                <IconButton onClick={() => setSelectedReview(null)}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Guest Information</Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography>{selectedReview.guest_name}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Copy Phone Number">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleCopyMobile(selectedReview.guest_mobile)
                          }
                        >
                          <Phone fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {selectedReview.guest_mobile && (
                        <Tooltip title="Open in WhatsApp">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://wa.me/${selectedReview.guest_mobile.replace(
                              /\D/g,
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <WhatsApp fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {selectedReview.cb_booking_code}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Property</Typography>
                  <ClickablePropertyName
                    propertyName={selectedReview.property_name}
                    onClick={(name) => {
                      handlePropertyClick(name);
                      setSelectedReview(null);
                    }}
                  />
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Rating</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Star
                      sx={{
                        color:
                          Math.round(selectedReview.review_rating) > 3
                            ? "success.main"
                            : Math.round(selectedReview.review_rating) === 3
                            ? "warning.main"
                            : "error.main",
                      }}
                    />
                    <Typography>
                      {Math.round(selectedReview.review_rating)}/5
                    </Typography>
                  </Stack>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Review</Typography>
                  {selectedReview.review_comment ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: "italic",
                        bgcolor: "background.default",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      "{selectedReview.review_comment}"
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No comment provided
                    </Typography>
                  )}
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">
                    Additional Details
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Date:{" "}
                      {formatDate(new Date(selectedReview.review_created_at))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Source:{" "}
                      {selectedReview.review_source === "wa"
                        ? "WhatsApp"
                        : "Mobile App"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Add refresh notification */}
      <Snackbar
        open={refreshNotification.open}
        autoHideDuration={refreshNotification.severity === "success" ? 3000 : 6000}
        onClose={() =>
          setRefreshNotification((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={refreshNotification.severity} variant="filled">
          {refreshNotification.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default ReviewsDashboard;
