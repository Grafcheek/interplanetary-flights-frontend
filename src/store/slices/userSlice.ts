import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { parseIsModeratorFromToken } from "../utils/jwt";

export interface UserState {
  username: string;
  isAuthenticated: boolean;
  isModerator: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  username: "",
  isAuthenticated: false,
  isModerator: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUserError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAuthenticatedUser: (state, action: PayloadAction<{ username: string }>) => {
      state.loading = false;
      state.error = null;
      state.isAuthenticated = true;
      state.username = action.payload.username;
      const token = localStorage.getItem("token") ?? "";
      state.isModerator = parseIsModeratorFromToken(token);
    },
    clearSession: () => ({ ...initialState }),
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUserLoading,
  setUserError,
  setAuthenticatedUser,
  clearSession,
  clearUserError,
} = userSlice.actions;
export default userSlice.reducer;
