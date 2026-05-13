import axios from "axios";

// Создаём свой экземпляр axios
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let accessToken: string = "";

//для установки  нового accessToken
export function setAccessToken(token: string) {
  accessToken = token;
}

//интерсептор - для перехвата и изменения res и req
axiosInstance.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

//если получили статус 403 в ответе - пробуем обновить наши токены 1 раз и повторить запрос
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
      } catch (error) {
        setAccessToken("");
        window.location.href = "/auth";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
