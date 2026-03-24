import Axios from "axios";

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
