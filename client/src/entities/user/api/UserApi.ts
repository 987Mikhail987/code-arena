import { axiosInstance } from "../../../shared/lib/axiosInstance";
import type { LoginData, RegisterData } from "../model/types";
import axios from "axios";

export default class UserApi {
  static async register(userData: RegisterData) {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async login(userData: LoginData) {
    try {
      const response = await axiosInstance.post("/auth/login", userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async refresh() {
    try {
      const response = await axiosInstance.get("/auth/refresh");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async logout() {
    try {
      const response = await axiosInstance.post("/auth/logout");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async updateProfile(payload: { name: string }) {
    try {
      const response = await axiosInstance.put("/users/profile", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }) {
    try {
      const response = await axiosInstance.put("/users/password", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async deleteAccount(payload: { password: string }) {
    try {
      const response = await axiosInstance.delete("/users/me", { data: payload });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
}
