import React, { useState } from "react";
import axios from "axios";
import { useGetMeQuery } from "../../services/previllageChecker";
import { useNavigate } from "react-router-dom";

const AccountSettings: React.FC = () => {
  const { data: me, isLoading } = useGetMeQuery();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!me || !token)
    return (
      <div className="p-6">
        <p>You must be logged in to access your account.</p>
      </div>
    );

  const onSendReset = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE || "http://localhost:3000"}/auth/request-password-reset`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data && res.data.ok) {
        setMessage("Reset email sent. Check your inbox (or spam). Link valid for 1 hour.");
      } else {
        setMessage(res.data?.message || "Reset email sent (if your email is registered).");
      }
    } catch (err: any) {
      console.error("Send reset email error:", err);
      setMessage(err?.response?.data?.message || String(err?.message || "Failed to send email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Account</h2>
      <div className="mb-4">
        <p>
          <strong>Name:</strong> {me.user?.name ?? "—"}
        </p>
        <p>
          <strong>Email:</strong> {me.user?.email ?? "—"}
        </p>
        <p>
          <strong>Username:</strong> {me.user?.username ?? "—"}
        </p>
      </div>

      <div className="border rounded p-4 bg-white/5">
        <h3 className="font-medium mb-2">Reset password</h3>
        <p className="text-sm mb-3">Send a password reset link to your registered email.</p>
        <button
          onClick={onSendReset}
          disabled={loading}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset email"}
        </button>
        {message && <p className="mt-3 text-sm">{message}</p>}
      </div>

      <div className="mt-6">
        <button
          className="text-sm underline"
          onClick={() => navigate("/")}
        >
          Back to home
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
