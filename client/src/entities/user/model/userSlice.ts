import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import UserApi from "../api/UserApi";
import type { User } from "./types";

type UserState = {
  data: User | null;
  status: "idle" | "loading" | "authenticated" | "guest";
};

const initialState: UserState = {
  data: null,
  status: "idle",
};

export const bootstrapUser = createAsyncThunk(
  "user/bootstrapUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserApi.refresh();

      if (response?.statusCode === 200) {
        setAccessToken(response.data.accessToken);
        return response.data.user as User;
      }

      setAccessToken("");
      return rejectWithValue(response?.error || response?.message || "Unauthorized");
    } catch {
      setAccessToken("");
      return rejectWithValue("Unauthorized");
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.data = action.payload;
      state.status = action.payload ? "authenticated" : "guest";
    },
    clearUser(state) {
      state.data = null;
      state.status = "guest";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapUser.pending, (state) => {
        if (state.status === "idle") {
          state.status = "loading";
        }
      })
      .addCase(bootstrapUser.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = "authenticated";
      })
      .addCase(bootstrapUser.rejected, (state) => {
        state.data = null;
        state.status = "guest";
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
