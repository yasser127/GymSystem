import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type User = {
  id?: number;
  email?: string;
  username?: string;
  name?: string;
  user_type?: string;
  membership_expiry?: string | null;
  [k: string]: unknown;
};

export type Permissions = {
  can_view_subscriptions?: boolean;
  can_view_members?: boolean;
  can_view_payments?: boolean;
  [k: string]: unknown;
};

export type MeResponse = {
  isAdmin: boolean;
  user_type?: string | null;
  permissions: Permissions;
  user?: User | null;
};

export const previllageChecker = createApi({
  reducerPath: "previllageChecker",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({

    getMe: builder.query<MeResponse | null, void>({
      query: () => "/auth/register",
    transformResponse: (response: any) => {

  const userRaw = response?.user ?? null;
  const user = userRaw ? { ...userRaw } : null;
  const user_type = user?.user_type ?? null;

  const toBool = (v: any) => {
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
    return Boolean(v);
  };

  let permissions = {
    can_view_subscriptions: false,
    can_view_members: false,
    can_view_payments: false,
  };

  if (response?.permissions) {
    permissions = {
      can_view_subscriptions: !!response.permissions.can_view_subscriptions,
      can_view_members: !!response.permissions.can_view_members,
      can_view_payments: !!response.permissions.can_view_payments,
    };
  } else if (user) {
    
    permissions = {
      can_view_subscriptions: toBool(user.can_view_subscriptions),
      can_view_members: toBool(user.can_view_members),
      can_view_payments: toBool(user.can_view_payments),
    };

    
    delete user.can_view_subscriptions;
    delete user.can_view_members;
    delete user.can_view_payments;
  }

  const isAdmin = user_type === "admin";
  const result = { isAdmin, user_type, permissions, user };
  console.log("[previllageChecker.transformResponse] result:", result);


  return result;
},

    }),
  }),
});

export const { useGetMeQuery } = previllageChecker;
export type { previllageChecker as previllageCheckerType };
