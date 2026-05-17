import axios from "axios";
import { axiosInstance } from "@/shared/lib/axiosInstance";
import type {
  SessionType,
  MessageType,
  CreateSessionParamsType,
  CreateMessageParamsType,
  CreateMessageResponseType,
} from "../model/types";

type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};

export default class SessionApi {
  static async createSession(
    params: CreateSessionParamsType,
  ):Promise<ApiResponse<SessionType>> {
    try {
      const response = await axiosInstance.post("/sessions", params);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async getUserSessions(): Promise<ApiResponse<SessionType[]>> {
    try {
      const response = await axiosInstance.get("/sessions");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async getSessionById(
    sessionId: string,
  ): Promise<ApiResponse<SessionType>> {
    try {
      const response = await axiosInstance.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async finishSession(
    sessionId: string,
    params: { code: string; programmingLanguage: string },
  ): Promise<ApiResponse<{ session: SessionType; feedback: string }>> {
    try {
      const response = await axiosInstance.patch(`/sessions/${sessionId}/finish`, params);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async createMessage(
    sessionId: string,
    params: CreateMessageParamsType,
  ): Promise<ApiResponse<CreateMessageResponseType>> {
    try {
      const response = await axiosInstance.post(
        `/sessions/${sessionId}/messages`,
        params,
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
}
