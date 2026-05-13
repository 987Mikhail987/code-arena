import { AxiosError } from "axios";
import type { UserDataApi } from ".";
import { axiosInstance } from "../../../shared/lib/axiosInstance";

export default class UserApi {
  static async refresh() {
    try {
      const response = await axiosInstance.post("/auth/refresh");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }

  static async register(userData: UserDataApi) {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }

  static async login(userData: UserDataApi) {
    try {
      const response = await axiosInstance.post("/auth/login", userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }

  static async logout() {
    try {
      const response = await axiosInstance.post("/auth/logout");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }
}
