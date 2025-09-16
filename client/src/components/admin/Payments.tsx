import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminTable from "./AdminTable";
import type { Column } from "./AdminTable";
import { motion } from "framer-motion";
import type { User, Payment, Subscribe, Plan, PaymentType } from "../../types";
import { getCache, setCache } from "../../utils/memoryCache";
import { useGetMeQuery } from "../../services/previllageChecker";
import type { PaymentRow } from "../../types";

const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;
const CACHE_KEY = "payments_admin_data_v1";

export default function PaymentsAdmin(): React.ReactElement {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subs, setSubs] = useState<Subscribe[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => localStorage.getItem("token"), []);


  const { data: meData, isLoading: meLoading } = useGetMeQuery();

 
  useEffect(() => {
    const cached = getCache<{
      payments?: Payment[];
      users?: User[];
      subs?: Subscribe[];
      plans?: Plan[];
      paymentTypes?: PaymentType[];
    }>(CACHE_KEY);

    if (cached) {
      setPayments(cached.payments ?? []);
      setUsers(cached.users ?? []);
      setSubs(cached.subs ?? []);
      setPlans(cached.plans ?? []);
      setPaymentTypes(cached.paymentTypes ?? []);
      setError(null);
      setLoading(false);
    } else {
 
      fetchAll();
    }
  
  }, []);


  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [pRes, uRes, sRes, plRes, ptRes] = await Promise.all([
        axios.get<Payment[]>(`${VITE_API_BASE}/payments/payment`, { headers }),
        axios.get<User[]>(`${VITE_API_BASE}/payments/users`, { headers }),
        axios.get<Subscribe[]>(`${VITE_API_BASE}/payments/subscribe`, {
          headers,
        }),
        axios.get<Plan[]>(`${VITE_API_BASE}/payments/plans`, { headers }),
        axios.get<PaymentType[]>(`${VITE_API_BASE}/payments/payment_type`, {
          headers,
        }),
      ]);

      const paymentsData = pRes.data || [];
      const usersData = uRes.data || [];
      const subsData = sRes.data || [];
      const plansData = plRes.data || [];
      const paymentTypesData = ptRes.data || [];

      setPayments(paymentsData);
      setUsers(usersData);
      setSubs(subsData);
      setPlans(plansData);
      setPaymentTypes(paymentTypesData);

      // cache the whole payload (in-memory)
      setCache(CACHE_KEY, {
        payments: paymentsData,
        users: usersData,
        subs: subsData,
        plans: plansData,
        paymentTypes: paymentTypesData,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load payments data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const usersMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach((u) => m.set(u.id!, u));
    return m;
  }, [users]);

  const subsMap = useMemo(() => {
    const m = new Map<number, Subscribe>();
    subs.forEach((s) => m.set(s.id!, s));
    return m;
  }, [subs]);

  const plansMap = useMemo(() => {
    const m = new Map<number, Plan>();
    plans.forEach((p) => m.set(p.id!, p));
    return m;
  }, [plans]);

  const paymentTypeMap = useMemo(() => {
    const m = new Map<number, string>();
    paymentTypes.forEach((pt) => pt.id != null && m.set(pt.id, pt.name));
    return m;
  }, [paymentTypes]);


  const visiblePayments = useMemo(() => {

    if (meLoading) return payments;
    if (meData?.isAdmin) return payments;
    const myId = meData?.user?.id;
    if (myId == null) return [];
    return payments.filter((p) => p.member_id === myId);
  }, [payments, meData, meLoading]);

  const rows: PaymentRow[] = useMemo(() => {
    return (visiblePayments || []).map((p) => {
      const sub = p.subscribe_id ? subsMap.get(p.subscribe_id) : undefined;
      const plan = sub ? plansMap.get(Number(sub.plan_id)) : undefined;
      const user = usersMap.get(p.member_id);
      return {
        id: p.id,
        memberName: user?.name ?? p.member_name ?? `#${p.member_id}`,
        amount: Number(p.amount),
        planName:
          p.plan_name ?? (plan ? plan.name : sub ? String(sub.plan_id) : null),
        paymentType:
          p.payment_type ??
          (p.payment_type_id
            ? paymentTypeMap.get(p.payment_type_id) ?? null
            : null),
        paidAt: p.paid_at ?? p.paidAt ?? "",
      };
    });
  }, [visiblePayments, subsMap, plansMap, usersMap, paymentTypeMap]);

  const cols: Column<PaymentRow>[] = [
    { key: "id", label: "ID", className: "w-16" },
    { key: "memberName", label: "Member" },
    {
      key: "amount",
      label: "Amount",
      render: (r) => `$${r.amount.toFixed(2)}`,
    },
    { key: "planName", label: "Plan" },
    { key: "paymentType", label: "Type" },
    {
      key: "paidAt",
      label: "Paid At",
      render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleString() : "—"),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-2xl font-semibold text-gray-900"
        >
          Payments (Admin)
        </motion.h1>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
            aria-label="Refresh payments"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <AdminTable
        columns={cols}
        data={rows}
        loading={loading}
        emptyMessage="No payments found."
      />
    </div>
  );
}
