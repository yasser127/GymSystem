import  { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "../../types";

type Props = {
  open: boolean;
  memberId: number | null;
  onClose: () => void;
  onSaved?: () => void;
};

const getApiBase = (): string => {
  const raw = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");
  if (raw) return raw;
  return `${window.location.origin}/api`;
};

const errText = (e: unknown) => {
  if (!e) return String(e);
  if ((e as AxiosError).isAxiosError) {
    const a = e as AxiosError;
    if (a.response)
      return `HTTP ${a.response.status}: ${JSON.stringify(a.response.data)}`;
    if (a.request) return `No response: ${a.message}`;
    return `Axios error: ${a.message}`;
  }
  return String(e);
};

export default function EditMemberModal({
  open,
  memberId,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);
  const apiBase = useMemo(getApiBase, []);

  useEffect(() => {
    if (!open) return;
    if (!memberId) {
      setError("No member selected");
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUser(null);

    const url = `${apiBase}/members/members/${memberId}`;
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    (async () => {
      try {
        const res = await axios.get<User>(url, { headers });
        if (!mounted) return;
        setUser(res.data ?? null);
        setName(res.data?.name ?? "");
        setEmail(res.data?.email ?? "");
        setPhone(res.data?.phone ?? "");
      } catch (e) {
        console.warn("[EditMemberModal] GET failed", url, e);
        if (mounted)
          setError(`Could not fetch member. Tried:\n• ${url}\n\n${errText(e)}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, memberId, apiBase, token]);

  const hasChanged =
    Boolean(user) &&
    (user?.name !== name ||
      user?.email !== email ||
      user?.phone !== phone);

  const handleSave = async () => {
    if (!memberId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const url = `${apiBase}/members/members/${memberId}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      };
      const res = await axios.patch(url, payload, { headers });
      setSuccess("Saved successfully.");
      setUser(res.data ?? user);
      if (onSaved) onSaved();
    } catch (e) {
      console.warn("[EditMemberModal] PATCH failed", url, e);
      setError(`Failed to save. Tried:\n• ${url}\n\n${errText(e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className="absolute inset-0 bg-black"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-lg mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Member
                  </h3>
                  <p className="text-sm text-gray-600">
                    Edit basic info and click Save.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => !saving && onClose()}
                    className="px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {loading ? (
                  <div className="py-8 text-center text-gray-600">
                    Loading member…
                  </div>
                ) : error ? (
                  <pre className="p-3 bg-red-50 text-red-700 rounded whitespace-pre-wrap text-sm">
                    {error}
                  </pre>
                ) : !user ? (
                  <div className="py-8 text-center text-gray-600">
                    Member not found.
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <label className="block">
                        <div className="text-xs text-gray-600 mb-1">Name</div>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded border px-3 py-2 text-sm"
                          required
                        />
                      </label>

                      <label className="block">
                        <div className="text-xs text-gray-600 mb-1">Email</div>
                        <input
                          type="email"
                          value={email ?? ""}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded border px-3 py-2 text-sm"
                        />
                      </label>

                      <label className="block">
                        <div className="text-xs text-gray-600 mb-1">Phone</div>
                        <input
                          value={phone ?? ""}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded border px-3 py-2 text-sm"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        {saving
                          ? "Saving…"
                          : hasChanged
                          ? "Unsaved changes"
                          : "No changes"}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setName(user.name ?? "");
                            setEmail(user.email ?? "");
                            setPhone(user.phone ?? "");
                            setError(null);
                            setSuccess(null);
                          }}
                          className="px-3 py-2 rounded-md text-sm border bg-white"
                          disabled={saving}
                        >
                          Reset
                        </button>

                        <button
                          type="submit"
                          disabled={saving || !hasChanged}
                          className={`px-4 py-2 rounded-md text-sm text-white ${
                            saving || !hasChanged
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>

                    {success && (
                      <div className="mt-3 text-sm text-green-700">
                        {success}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
