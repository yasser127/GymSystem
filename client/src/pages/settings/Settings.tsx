import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence, type Transition } from "framer-motion";

const VITE_API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

type PaymentType = { id: number; name: string; description?: string | null };
type UserType = {
  id: number;
  name: string;
  can_view_subscriptions: 0 | 1;
  can_view_members: 0 | 1;
  can_view_payments: 0 | 1;
};

const authHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Row: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 260, damping: 26 }}
    className={`group flex items-center justify-between gap-4 px-4 py-3 rounded-xl ${
      className ?? ""
    }`}
  >
    {children}
  </motion.div>
);

export default function Settings(): React.ReactElement {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ptForm, setPtForm] = useState({ id: 0, name: "", description: "" });
  const [utForm, setUtForm] = useState({
    id: 0,
    name: "",
    can_view_subscriptions: false,
    can_view_members: false,
    can_view_payments: false,
  });

  const [isPtOpen, setIsPtOpen] = useState(false);
  const [isUtOpen, setIsUtOpen] = useState(false);

  const base = useMemo(() => `${VITE_API_BASE}/settings`, []);

  useEffect(() => {
    fetchAll(); /* eslint-disable-next-line */
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([
        axios.get(`${base}/payment-types`, { headers: authHeaders() }),
        axios.get(`${base}/user-types`, { headers: authHeaders() }),
      ]);
      setPaymentTypes(p.data || []);
      setUserTypes(u.data || []);
      setError(null);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message as string) ?? e.message
        : e instanceof Error
        ? e.message
        : String(e);
      setError(msg || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const savePaymentType = async () => {
    if (!ptForm.name.trim()) return alert("Name required");
    try {
      const payload = {
        name: ptForm.name.trim(),
        description: ptForm.description || null,
      };
      const res = ptForm.id
        ? await axios.patch(`${base}/payment-types/${ptForm.id}`, payload, {
            headers: authHeaders(),
          })
        : await axios.post(`${base}/payment-types`, payload, {
            headers: authHeaders(),
          });
      setPaymentTypes((s) =>
        ptForm.id
          ? s.map((p) => (p.id === res.data.id ? res.data : p))
          : [res.data, ...s]
      );
      setIsPtOpen(false);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message as string) ?? e.message
        : e instanceof Error
        ? e.message
        : String(e);
      alert(msg || "Failed");
    }
  };

  const saveUserType = async () => {
    if (!utForm.name.trim()) return alert("Name required");
    try {
      const payload = {
        name: utForm.name.trim(),
        can_view_subscriptions: utForm.can_view_subscriptions,
        can_view_members: utForm.can_view_members,
        can_view_payments: utForm.can_view_payments,
      };
      const res = utForm.id
        ? await axios.patch(`${base}/user-types/${utForm.id}`, payload, {
            headers: authHeaders(),
          })
        : await axios.post(`${base}/user-types`, payload, {
            headers: authHeaders(),
          });
      setUserTypes((s) =>
        utForm.id
          ? s.map((u) => (u.id === res.data.id ? res.data : u))
          : [...s, res.data]
      );
      setIsUtOpen(false);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message as string) ?? e.message
        : e instanceof Error
        ? e.message
        : String(e);
      alert(msg || "Failed");
    }
  };

  const del = async (url: string, onSuccess: () => void) => {
    if (!confirm("Confirm delete?")) return;
    try {
      await axios.delete(url, { headers: authHeaders() });
      onSuccess();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message as string) ?? "Failed"
        : e instanceof Error
        ? e.message
        : String(e);
      alert(msg || "Failed");
    }
  };

  const gradientStyle = {
    background:
      "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)",
  };

  const formMotion = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { height: 0, opacity: 0, marginTop: 0, marginBottom: 0, scale: 0.98 },
    transition: { type: "spring", stiffness: 300, damping: 28 },
  };

  // typed as framer-motion Transition
  const containerLayout: Transition = {
    layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }, // cubic-bezier for easeInOut
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <div>
          <button
            onClick={fetchAll}
            className="px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl overflow-hidden" style={gradientStyle}>
          <div className="px-6 py-4 bg-white/6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Payment Types
                </h2>
                <p className="text-sm text-white/85">
                  {paymentTypes.length} total
                </p>
              </div>
              <div>
                <button
                  onClick={() => {
                    setPtForm({ id: 0, name: "", description: "" });
                    setIsPtOpen(true);
                  }}
                  className="px-3 py-1 rounded-md bg-white/10 text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <motion.div
              layout
              transition={containerLayout}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-2 space-y-3">
                <AnimatePresence initial={false}>
                  {loading ? (
                    <motion.div
                      key="l"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center text-white/80"
                    >
                      Loading…
                    </motion.div>
                  ) : paymentTypes.length === 0 ? (
                    <motion.div
                      key="e"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center text-white/80"
                    >
                      No payment types
                    </motion.div>
                  ) : (
                    paymentTypes.map((p, i) => (
                      <Row
                        key={p.id}
                        className={i % 2 === 0 ? "bg-white/6" : "bg-white/8"}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {p.name}
                          </div>
                          <div className="text-sm text-white/80 truncate hidden md:block">
                            {p.description || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPtForm({
                                id: p.id,
                                name: p.name || "",
                                description: p.description || "",
                              });
                              setIsPtOpen(true);
                            }}
                            className="px-3 py-1 rounded-full border border-white/10 bg-white/6 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              del(`${base}/payment-types/${p.id}`, () =>
                                setPaymentTypes((s) =>
                                  s.filter((x) => x.id !== p.id)
                                )
                              )
                            }
                            className="px-3 py-1 rounded-full border border-red-400 text-red-200 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </Row>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {isPtOpen && (
                  <motion.div
                    layout
                    initial={formMotion.initial}
                    animate={formMotion.animate}
                    exit={formMotion.exit}
                    transition={formMotion.transition}
                    style={{ overflow: "hidden" }}
                    className="mt-4 p-4 rounded-xl bg-white/6 shadow-xl"
                  >
                    <h3 className="font-semibold mb-2 text-white">
                      {ptForm.id ? "Edit" : "Add"} Payment Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={ptForm.name}
                        onChange={(e) =>
                          setPtForm((s) => ({ ...s, name: e.target.value }))
                        }
                        placeholder="Name"
                        className="p-2 border rounded bg-white/5 text-white"
                      />
                      <input
                        value={ptForm.description}
                        onChange={(e) =>
                          setPtForm((s) => ({
                            ...s,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Description (optional)"
                        className="p-2 border rounded bg-white/5 text-white"
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={savePaymentType}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsPtOpen(false)}
                        className="px-4 py-2 rounded-md border border-white/10 text-white/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <section className="rounded-2xl overflow-hidden" style={gradientStyle}>
          <div className="px-6 py-4 bg-white/6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  User Roles & Permissions
                </h2>
                <p className="text-sm text-white/85">
                  {userTypes.length} roles
                </p>
              </div>
              <div>
                <button
                  onClick={() => {
                    setUtForm({
                      id: 0,
                      name: "",
                      can_view_subscriptions: false,
                      can_view_members: false,
                      can_view_payments: false,
                    });
                    setIsUtOpen(true);
                  }}
                  className="px-3 py-1 rounded-md bg-white/10 text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <motion.div
              layout
              transition={containerLayout}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-2 space-y-3">
                <AnimatePresence initial={false}>
                  {loading ? (
                    <motion.div
                      key="lu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center text-white/80"
                    >
                      Loading…
                    </motion.div>
                  ) : userTypes.length === 0 ? (
                    <motion.div
                      key="eu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 text-center text-white/80"
                    >
                      No roles
                    </motion.div>
                  ) : (
                    userTypes.map((u, i) => (
                      <Row
                        key={u.id}
                        className={i % 2 === 0 ? "bg-white/6" : "bg-white/8"}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {u.name}
                          </div>
                          <div className="text-sm text-white/80 hidden sm:block">
                            {u.can_view_subscriptions ? "Subscriptions • " : ""}
                            {u.can_view_members ? "Members • " : ""}
                            {u.can_view_payments ? "Payments" : ""}
                            {!u.can_view_subscriptions &&
                            !u.can_view_members &&
                            !u.can_view_payments
                              ? "No permissions"
                              : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setUtForm({
                                id: u.id,
                                name: u.name,
                                can_view_subscriptions:
                                  !!u.can_view_subscriptions,
                                can_view_members: !!u.can_view_members,
                                can_view_payments: !!u.can_view_payments,
                              });
                              setIsUtOpen(true);
                            }}
                            className="px-3 py-1 rounded-full border border-white/10 bg-white/6 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              del(`${base}/user-types/${u.id}`, () =>
                                setUserTypes((s) =>
                                  s.filter((x) => x.id !== u.id)
                                )
                              )
                            }
                            className="px-3 py-1 rounded-full border border-red-400 text-red-200 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </Row>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {isUtOpen && (
                  <motion.div
                    layout
                    initial={formMotion.initial}
                    animate={formMotion.animate}
                    exit={formMotion.exit}
                    transition={formMotion.transition}
                    style={{ overflow: "hidden" }}
                    className="mt-4 p-4 rounded-xl bg-white/6 shadow-xl"
                  >
                    <h3 className="font-semibold mb-2 text-white">
                      {utForm.id ? "Edit" : "Add"} User Role
                    </h3>
                    <input
                      value={utForm.name}
                      onChange={(e) =>
                        setUtForm((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Role name"
                      className="p-2 border rounded bg-white/5 text-white w-full mb-3"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={utForm.can_view_subscriptions}
                          onChange={(e) =>
                            setUtForm((s) => ({
                              ...s,
                              can_view_subscriptions: e.target.checked,
                            }))
                          }
                        />{" "}
                        Subscriptions
                      </label>
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={utForm.can_view_members}
                          onChange={(e) =>
                            setUtForm((s) => ({
                              ...s,
                              can_view_members: e.target.checked,
                            }))
                          }
                        />{" "}
                        Members
                      </label>
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={utForm.can_view_payments}
                          onChange={(e) =>
                            setUtForm((s) => ({
                              ...s,
                              can_view_payments: e.target.checked,
                            }))
                          }
                        />{" "}
                        Payments
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveUserType}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsUtOpen(false)}
                        className="px-4 py-2 rounded-md border border-white/10 text-white/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      </div>

      {error && <div className="mt-6 text-red-400">{error}</div>}
    </div>
  );
}
