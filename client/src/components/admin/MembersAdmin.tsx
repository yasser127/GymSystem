import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminTable from "../../components/admin/AdminTable";
import type { Column } from "../../components/admin/AdminTable";
import { motion } from "framer-motion";
import type { User, Subscribe, Payment, MemberRow } from "../../types";
import EditMemberModal from "../../components/admin/EditMemberModal";
import { getCache, setCache } from "../../utils/memoryCache";

const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;
const CACHE_KEY = "members_admin_data_v1";

function parseAndFormatDate(val?: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    if (val.length === 10) {
      const dd = new Date(val + "T00:00:00");
      if (!isNaN(dd.getTime()))
        return dd.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
    }
    return val;
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Minimal local Plan type (replace with your app's Plan type if present)
type Plan = { id: number; name: string };

export default function MembersAdmin(): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [subs, setSubs] = useState<Subscribe[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Only call /members — the server's membersRoutes should return members only.
      const usersRes = await axios.get<User[]>(`${VITE_API_BASE}/members/members`, {
        headers,
      });

      const [sRes, pRes] = await Promise.all([
        axios.get<Subscribe[]>(`${VITE_API_BASE}/payments/subscribe`, { headers }),
        axios.get<Payment[]>(`${VITE_API_BASE}/payments/payment/raw`, { headers }),
      ]);

      // Try to fetch plans. If the endpoint doesn't exist or fails, warn and continue.
      let plansData: Plan[] = [];
      try {
        const plansRes = await axios.get<Plan[]>(`${VITE_API_BASE}/payments/plans`, {
          headers,
        });
        plansData = plansRes.data || [];
        setPlans(plansData);
      } catch (err) {
    
        console.warn("Could not load plans list (falling back to plan_id):", err);
      }

      const usersData = usersRes.data || [];
      const subsData = sRes.data || [];
      const paymentsData = pRes.data || [];

      setUsers(usersData);
      setSubs(subsData);
      setPayments(paymentsData);

      // cache the payload in-memory for subsequent mounts while app is open
      setCache(CACHE_KEY, {
        users: usersData,
        subs: subsData,
        payments: paymentsData,
        plans: plansData,
      });
    } catch (err: unknown) {
      console.error(err);
      // try to surface server message when available
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message));
      } else {
        setError("Failed to load admin data (members / subs / payments).");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // On mount: read from in-memory cache if present; otherwise fetch once.
  useEffect(() => {
    const cached = getCache<{
      users?: User[];
      subs?: Subscribe[];
      payments?: Payment[];
      plans?: Plan[];
    }>(CACHE_KEY);

    if (cached) {
      setUsers(cached.users ?? []);
      setSubs(cached.subs ?? []);
      setPayments(cached.payments ?? []);
      setPlans(cached.plans ?? []);
      setError(null);
      setLoading(false);
    } else {
      // No cache — fetch data one time when the component is displayed
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const rows: MemberRow[] = useMemo(() => {
    const paymentsByMember = new Map<number, Payment[]>();
    payments.forEach((p) => {
      const arr = paymentsByMember.get(p.member_id) || [];
      arr.push(p);
      paymentsByMember.set(p.member_id, arr);
    });

    const subsByMember = new Map<number, Subscribe[]>();
    subs.forEach((s) => {
      const arr = subsByMember.get(s.member_id) || [];
      arr.push(s);
      subsByMember.set(s.member_id, arr);
    });

    // build planId -> name map from plans state
    const plansById = new Map<number, string>();
    plans.forEach((pl) => {
      if (pl && typeof pl.id === "number") plansById.set(pl.id, pl.name);
    });

    // server returns members only, so use users directly
    return users.map((u) => {
      const mpay = paymentsByMember.get(u.id) || [];
      const total = mpay.reduce((acc, p) => acc + Number(p.amount || 0), 0);

      const msubs = subsByMember.get(u.id) || [];
      const chosen: Subscribe | undefined = msubs
        .slice()
        .sort((a, b) => (a.start_date > b.start_date ? -1 : 1))[0];

      const planName =
        chosen?.plan_name ??
        (chosen && plansById.get(Number(chosen?.plan_id))) ??
        (chosen ? String(chosen?.plan_id ?? "") : null);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? undefined,
        planName,
        startDate: parseAndFormatDate(chosen?.start_date ?? null),
        endDate: parseAndFormatDate(chosen?.end_date ?? null),
        totalPaid: Number(total),
      };
    });
  }, [users, subs, payments, plans]);

  // open modal for editing
  const openEditModal = (id: number) => {
    setEditingMemberId(id);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingMemberId(null);
  };

  // called after EditMemberModal successfully saves
  const onMemberSaved = () => {
    // refresh list to reflect changes
    fetchAll();
    closeEditModal();
  };

  const columns: Column<MemberRow>[] = [
    { key: "id", label: "ID", className: "w-16" },
    { key: "name", label: "Name" },
    { key: "planName", label: "Plan", render: (r) => r.planName ?? "—" },
    {
      key: "startDate",
      label: "Subscribed",
      render: (r) => r.startDate ?? "—",
    },
    { key: "endDate", label: "Ends", render: (r) => r.endDate ?? "—" },
    {
      key: "totalPaid",
      label: "Total Paid",
      render: (r) => `$${r.totalPaid.toFixed(2)}`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(r.id)}
            className="px-3 py-1 rounded border border-gray-200 text-gray-700 text-xs"
          >
            Edit
          </button>
        </div>
      ),
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
          Members (Admin)
        </motion.h1>

        <div>
          <button
            onClick={fetchAll}
            className="px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No members found."
      />

      <EditMemberModal
        open={isModalOpen}
        memberId={editingMemberId}
        onClose={closeEditModal}
        onSaved={onMemberSaved}
      />

    </div>
  );
}
