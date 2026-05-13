import { AxiosError } from "axios";
import { axiosInstance } from "../../../shared/lib/axiosInstance";
import type { typeUpdateData, typeUpdateDataPassword } from "../index";

export default class ProfileApi {
  static async getProfile() {
    try {
      const response = await axiosInstance.get("/profile/");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }

  static async updateProfilePassword(
    updateDataPassword: typeUpdateDataPassword,
  ) {
    try {
      const response = await axiosInstance.put(
        "/profile/password",
        updateDataPassword,
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }

  static async updateProfile(updateData: typeUpdateData) {
    try {
      const response = await axiosInstance.put("/profile", updateData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }
  static async deleteProfile() {
    try {
      const response = await axiosInstance.delete("/profile");
      return response.data.message;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }
}
