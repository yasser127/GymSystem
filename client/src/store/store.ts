import { configureStore } from "@reduxjs/toolkit";
import { previllageChecker } from "../services/previllageChecker";

export const store = configureStore({
  reducer: {

    [previllageChecker.reducerPath]: previllageChecker.reducer,
   
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(previllageChecker.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
