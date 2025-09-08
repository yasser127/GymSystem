import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { Plan } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess?: () => void;
  apiBase: string;
  token?: string | null;
};

export default function SubscribeModal({
  open,
  onClose,
  plan,
  onSuccess,
  apiBase,
  token,
}: Props): React.ReactElement | null {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setCardName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setSubmitting(false);
      setError(null);
    }

    if (open) {
      // typed axios response
      const fetchPaymentTypes = async () => {
        try {
          const res = await axios.get<{ id: number; name: string }[]>(
            `${apiBase}/plans/payment-types`
          );
          const data = res.data;
          setPaymentTypes(data);

          // default to "Bank Transfer" if available (keeps original logic)
          const creditCard = data.find((t) => t.name === "Bank Transfer");
          setSelectedType(creditCard?.id ?? data[0]?.id ?? null);
        } catch (err) {
          console.error("Failed to fetch payment types", err);
          setPaymentTypes([]);
          setSelectedType(null);
        }
      };

      fetchPaymentTypes();
    }
  }, [open, apiBase]);

  if (!plan) return null;

  function validate() {
    if (!cardName.trim()) return "Name on card is required";
    if (!/^\d{12,19}$/.test(cardNumber.replace(/\s+/g, "")))
      return "Card number looks invalid (12-19 digits)";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits";
    if (!/^(0?[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(expiry.trim()))
      return "Expiry must be MM/YY or MM/YYYY";
    return null;
  }

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (!token) {
      setError("You must be logged in to subscribe.");
      return;
    }

    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError(null);

    if (!plan) {
      setError("No plan selected");
      return;
    }

    try {
      const payload = {
        card: {
          name: cardName,
          number: cardNumber.replace(/\s+/g, ""),
          expiry,
          cvv,
        },
        payment_type_id: selectedType,
      };

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // typed axios.post response so we can safely access res.data.message
      const res = await axios.post<{ message?: string }>(
        `${apiBase}/plans/${plan.id}/subscribe`,
        payload,
        { headers }
      );

      if (res.status === 201 || res.status === 200) {
        onSuccess?.();
      } else {
        setError(res.data?.message || "Unexpected response");
      }
    } catch (err: unknown) {
      console.error("Subscribe error:", err);
      if (axios.isAxiosError(err)) {
        // err.response?.data is unknown — coerce to known shape safely
        const data = err.response?.data as { message?: string } | undefined;
        setError(data?.message || "Failed to complete purchase");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to complete purchase");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-md p-6 z-10 shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Subscribe — {plan.name}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Price:{" "}
              <span className="font-medium">
                ${Number(plan.price).toFixed(2)}
              </span>{" "}
              • Duration:{" "}
              <span className="font-medium">{plan.duration} days</span>
            </p>

            {!token ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  You need to be logged in to subscribe.
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name on card
                  </label>
                  <input
                    value={cardName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCardName(e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Card number
                  </label>
                  <input
                    value={cardNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCardNumber(e.target.value)
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      value={expiry}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpiry(e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      CVV
                    </label>
                    <input
                      value={cvv}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCvv(e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="123"
                    />
                  </div>
                  <select
                    value={selectedType ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedType(Number(e.target.value))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    {paymentTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-rose-500 text-white rounded-lg"
                  >
                    {submitting
                      ? "Processing..."
                      : `Pay $${Number(plan.price).toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
