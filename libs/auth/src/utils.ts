import Axios from "axios";

/**
 * Parse a persisted token-expiry value into a millisecond epoch timestamp.
 *
 * Accepts: numeric ms timestamps ("1745000000000"), numeric second
 * timestamps ("1745000000"), and ISO date strings ("2026-04-22T12:00:00Z").
 * Returns NaN for anything that can't be interpreted. The caller must
 * Number.isFinite() check before comparing against Date.now().
 *
 * Lives here (not inline in either AuthProvider) so the same logic powers
 * both `contexts/auth/AuthProvider.tsx` and `contexts/authZostel/AuthProvider.tsx`.
 * Without this, the Zostel provider used `+new Date(rawString)` which returns
 * NaN for pure-digit strings and quietly logged users out on every refresh —
 * the same bug PR #19 fixed on the zo provider but never ported to zostel.
 */
export function parseTokenExpiry(raw: string | null | undefined): number {
  if (!raw) return NaN;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    // Unix epoch in seconds crosses 1e10 around Nov 2286; anything smaller
    // than 1e12 (year ~33688 in ms) must be seconds, not milliseconds.
    return asNumber < 1e12 ? asNumber * 1000 : asNumber;
  }
  const asDate = new Date(raw).getTime();
  return Number.isFinite(asDate) ? asDate : NaN;
}

const zostelServer = Axios.create({
  baseURL: process.env.API_BASE_URL_ZOSTEL || "",
});

const zoServer = Axios.create({
  baseURL: process.env.API_BASE_URL || "",
});

const setZostelServerHeaders = (headers: any) => {
  zostelServer.defaults.headers = {
    ...zostelServer.defaults.headers,
    ...headers,
  };
};

const getZostelServerHeaders = () => {
  return zostelServer.defaults.headers;
};

const setZostelInterceptors = (...interceptors: any[]) => {
  zostelServer.interceptors.response.use(...interceptors);
};

const setZoServerHeaders = (headers: any) => {
  zoServer.defaults.headers = {
    ...zoServer.defaults.headers,
    ...headers,
  };
};

const getZoServerHeaders = () => {
  return zoServer.defaults.headers;
};

zoServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

zostelServer.interceptors.request.use((config) => {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

export {
  getZoServerHeaders,
  getZostelServerHeaders,
  setZoServerHeaders,
  setZostelInterceptors,
  setZostelServerHeaders,
  zoServer,
  zostelServer,
};
