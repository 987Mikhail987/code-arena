import { AxiosError } from "axios";
import { axiosInstance } from "../../../shared/lib/axiosInstance";
import type { RequestItem } from "../../request";

type AiRequestData = Pick<RequestItem, "content" | "level" | "type">;

export default class AiApi {
  static async getResponse(requestData: AiRequestData) {
    try {
      const response = await axiosInstance.post("/ai/", requestData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return error.response.data;
      }
      return console.error("Произошла сетевая ошибка:", error);
    }
  }
}
