import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import flightRequestReducer from "./slices/flightRequestSlice";
import planetFilterReducer from "./slices/planetFilterSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    flightRequest: flightRequestReducer,
    planetFilter: planetFilterReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
