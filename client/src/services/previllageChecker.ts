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

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lower = v.toLowerCase();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
  }
  if (typeof v === "number") {
    if (v === 1) return true;
    if (v === 0) return false;
  }
  return Boolean(v);
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
      query: () => "/auth/me",
      transformResponse: (response: unknown): MeResponse | null => {
     
        const resp = isObject(response) ? response : {};

        
        const userRaw = resp.user ?? null;
        const user = isObject(userRaw) ? ({ ...(userRaw as Record<string, unknown>) } as User) : null;

      
        const user_type =
          typeof resp.user_type === "string"
            ? resp.user_type
            : user?.user_type && typeof user.user_type === "string"
              ? user.user_type
              : null;

        let permissions: Permissions = {
          can_view_subscriptions: false,
          can_view_members: false,
          can_view_payments: false,
        };

        if (isObject(resp.permissions)) {
          const p = resp.permissions as Record<string, unknown>;
          permissions = {
            can_view_subscriptions: toBool(p.can_view_subscriptions),
            can_view_members: toBool(p.can_view_members),
            can_view_payments: toBool(p.can_view_payments),
          };
        } else if (user) {
          permissions = {
            can_view_subscriptions: toBool(user.can_view_subscriptions),
            can_view_members: toBool(user.can_view_members),
            can_view_payments: toBool(user.can_view_payments),
          };

       
          delete (user as Record<string, unknown>).can_view_subscriptions;
          delete (user as Record<string, unknown>).can_view_members;
          delete (user as Record<string, unknown>).can_view_payments;
        }

        const isAdmin = user_type === "admin";
        const result: MeResponse = { isAdmin, user_type, permissions, user };
        console.log("[previllageChecker.transformResponse] result:", result);

        return result;
      },
    }),
  }),
});

export const { useGetMeQuery } = previllageChecker;
export type { previllageChecker as previllageCheckerType };
