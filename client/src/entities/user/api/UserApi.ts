import axios from "axios";
import { axiosInstance } from "../../../shared/lib/axiosInstance";
import type { LoginData, RegisterData, UserRole } from "../model/types";

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
      const response = await axiosInstance.post("/auth/refresh");
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

  static async updateProfile(payload: { name: string; role?: UserRole }) {
    try {
      const response = await axiosInstance.put("/profile", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async changePassword(payload: {
    password: string;
    newPassword: string;
  }) {
    try {
      const response = await axiosInstance.put("/profile/password", payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async deleteAccount() {
    try {
      const response = await axiosInstance.delete("/profile");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
}
