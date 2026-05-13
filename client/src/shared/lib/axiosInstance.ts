import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let accessToken = "";

export function setAccessToken(newToken: string) {
  accessToken = newToken;
}

axiosInstance.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const previousRequest = error.config;

    if (error.response?.status === 403 && !previousRequest.sent) {
      previousRequest.sent = true;

      try {
        const { data } = await axiosInstance.get("/auth/refresh");
        const newToken = data.data.accessToken;

        setAccessToken(newToken);
        previousRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(previousRequest);
      } catch (refreshError) {
        setAccessToken("");

        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
