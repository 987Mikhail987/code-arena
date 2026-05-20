import io from "socket.io-client";
import { getAccessToken } from "./axiosInstance";

export type LiveSocket = ReturnType<typeof createLiveSocket>;

export function createLiveSocket() {
  return io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", {
    autoConnect: false,
    auth: {
      accessToken: getAccessToken(),
    },
  });
}
