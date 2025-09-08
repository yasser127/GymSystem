import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import type { SubscriptionView } from "../../types";

const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;

type Props = {
  token: string | null;
  refreshKey?: number;
};

export default function MySubscriptions({ token, refreshKey }: Props) {
  const [mySubscriptions, setMySubscriptions] = useState<SubscriptionView[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMySubscriptions = useCallback(async (): Promise<void> => {
    if (!token) {
      setMySubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      headers.Authorization = `Bearer ${token}`;
      const res = await axios.get<SubscriptionView[]>(
        `${VITE_API_BASE}/plans/subscriptions`,
        { headers }
      );
      setMySubscriptions(res.data || []);
    } catch (err: unknown) {
      console.error("Failed to fetch subscriptions:", err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to load subscriptions");
      } else {
        setError("An unexpected error occurred");
      }

      setMySubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMySubscriptions();
  }, [fetchMySubscriptions, refreshKey]);

  if (!token) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-white/5 text-sm text-gray-200">
        Sign in to view your subscriptions.
      </div>
    );
  }

  return (
    <div className="mb-6 pt-20">
      <h2 className="text-lg font-medium mb-2">My Subscriptions</h2>

      {loading ? (
        <div className="text-sm text-gray-400 py-4">Loading subscriptions…</div>
      ) : error ? (
        <div className="text-sm text-red-500 py-2">{error}</div>
      ) : mySubscriptions.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">
          You have no subscriptions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {mySubscriptions.map((s) => (
            <div
              key={s.subscription_id}
              className="border rounded-lg p-3 bg-white dark:bg-slate-800 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Plan</div>
                  <div className="font-medium">{s.plan_name}</div>
                  {s.plan_description ? (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {s.plan_description}
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-400">Status</div>
                  <div className="font-medium">{s.status}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-500">
                <div>
                  <div className="text-gray-400">Start</div>
                  <div>{new Date(s.start_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">End</div>
                  <div>{new Date(s.end_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
