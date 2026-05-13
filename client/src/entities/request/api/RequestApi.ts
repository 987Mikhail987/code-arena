import { AxiosError } from "axios";
import { axiosInstance } from "../../../shared/lib/axiosInstance";
import type { RequestItem } from "..";

export type CreateRequestData = Omit<RequestItem, "id" | "createdAt" | "answer">

export default class RequestApi {
  static async getAllRequests() {
    try {
      const response = await axiosInstance.get("/requests/");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
  static async getAllRequestsAndResponses() {
    try {
      const response = await axiosInstance.get("/requests/responses");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
  static async getOneRequestAndResponse(id: number) {
    try {
      const response = await axiosInstance.get(`/requests/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
  static async createRequest(data: CreateRequestData)  {
    try {
      const response = await axiosInstance.post("/requests/", data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
  static async updateRequest(id: number, data: CreateRequestData) {
    try {
      const response = await axiosInstance.put(`/requests/${id}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
  static async deleteRequest(id: number) {
    try {
      const response = await axiosInstance.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произшла сетевая ошибка:", error);
    }
  }
}
