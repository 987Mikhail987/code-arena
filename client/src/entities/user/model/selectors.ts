import type { RootState } from "@/app/store/store";

export const selectUser = (state: RootState) => state.user.data;
export const selectUserStatus = (state: RootState) => state.user.status;
