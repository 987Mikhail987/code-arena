import axios from "axios";
import { axiosInstance } from "@/shared/lib/axiosInstance";
import type {
  AuthResponseData,
  LoginData,
  RegisterData,
  User,
  UserRole,
} from "../model/types";

type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};

export default class UserApi {
  static async register(userData: RegisterData): Promise<ApiResponse<AuthResponseData>> {
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

  static async login(userData: LoginData): Promise<ApiResponse<AuthResponseData>> {
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

  static async refresh(): Promise<ApiResponse<AuthResponseData>> {
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

  static async logout(): Promise<ApiResponse<null>> {
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

  static async updateProfile(payload: {
    name: string;
    role?: UserRole;
  }): Promise<ApiResponse<User>> {
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
  }): Promise<ApiResponse<null>> {
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

  static async deleteAccount(): Promise<ApiResponse<null>> {
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
