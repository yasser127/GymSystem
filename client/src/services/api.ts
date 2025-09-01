import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type User = {
    id?: number;
    email?: string;
    isAdmin?: number; // backend uses 1 for admin in your example
    [k: string]: unknown;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:3000",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // Fetch the current user (adapt endpoint path to your backend; you used /auth/register)
        getMe: builder.query<boolean, void>({
            query: () => "/auth/register",
            transformResponse: (response: { user?: { isAdmin?: number } }) => {
                return response?.user?.isAdmin === 1;
            },
        }),

    }),
});

export const { useGetMeQuery } = api;
