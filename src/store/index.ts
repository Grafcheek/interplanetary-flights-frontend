import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import flightRequestReducer from "./slices/flightRequestSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    flightRequest: flightRequestReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
