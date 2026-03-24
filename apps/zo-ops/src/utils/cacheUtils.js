const CACHE_PREFIX = "zo_ops_cache_";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes — short TTL, used only as instant preview while API loads

export const setCacheData = (key, data) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // localStorage full or unavailable — not critical
  }
};

export const getCacheData = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const clearCache = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // not critical
  }
};

export const CACHE_KEYS = {
  REVIEWS_DATA: "reviews_data",
  PROPERTY_INSIGHTS: "property_insights",
  TREND_DATA: "trend_data",
  CHAIN_AVERAGE: "chain_average",
  INVENTORY_RATINGS: "inventory_ratings",
};
