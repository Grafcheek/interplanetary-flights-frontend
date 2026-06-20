import { Api } from "./Api";
import { API_BASE_URL } from "../config/apiEndpoints";

const baseURL = API_BASE_URL;

export const api = new Api({
  baseURL,
});

api.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.instance.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === "object" && "token" in data && data.token) {
      localStorage.setItem("token", String(data.token));
    }
    return response;
  },
  (error) => Promise.reject(error),
);
