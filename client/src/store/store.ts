import { configureStore } from "@reduxjs/toolkit";
import { api } from "../services/api";

export const store = configureStore({
  reducer: {
    // RTK Query reducer
    [api.reducerPath]: api.reducer,
    // add other reducers here if you have them
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Types for hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
