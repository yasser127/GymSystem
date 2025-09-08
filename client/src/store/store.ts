import { configureStore } from "@reduxjs/toolkit";
import { previllageChecker } from "../services/previllageChecker";

export const store = configureStore({
  reducer: {
    // RTK Query reducer
    [previllageChecker.reducerPath]: previllageChecker.reducer,
    // add other reducers here if you have them
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(previllageChecker.middleware),
});

// Types for hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
