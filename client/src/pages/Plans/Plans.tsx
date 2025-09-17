import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SubscribeModal from "../../components/plans/SubscribeModal";
import PlanModal from "../../components/plans/PlanModal";
import { useGetMeQuery } from "../../services/previllageChecker";
import MySubscriptions from "../../components/plans/MySubscriptions";
import PlanAdminActions from "../../components/plans/PlanAdminActions";
import PlanCard from "../../components/plans/PlanCard";
import type { FormState, Plan as PlanType } from "../../types";

const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;

export default function Plans(): React.ReactElement {
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanType | null>(null);

  const emptyForm: FormState = {
    name: "",
    description: "",
    price: "",
    duration: "",
    imageFile: null,
    removeImage: false,
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [subscribePlan, setSubscribePlan] = useState<PlanType | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const [subsRefresh, setSubsRefresh] = useState(0);

  const { data: me } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
  const isAdmin = useMemo(() => {
    if (me === undefined || me === null) return false;
    if (typeof me === "boolean") return me;
    if (typeof me === "object") return !!(me as { isAdmin?: boolean }).isAdmin;
    return false;
  }, [me]);

  const token = useMemo<string | null>(() => localStorage.getItem("token"), []);

  const fetchPlans = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<PlanType[]>(`${VITE_API_BASE}/plans`);
      setPlans(res.data || []);
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to load plans");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load plans");
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (error) {
          console.log(error);
        }
      }
    };
  }, [previewUrl]);

  function openCreateModal() {
    setIsEditing(false);
    setEditingPlan(null);
    setForm(emptyForm);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.log(error);
      }
    }
    setPreviewUrl(null);
    setIsOpen(true);
  }

  function openEditModal(p: PlanType) {
    setIsEditing(true);
    setEditingPlan(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: (p.price ?? 0).toString(),
      duration: (p.duration ?? 0).toString(),
      imageFile: null,
      removeImage: false,
    });
    setPreviewUrl(`${VITE_API_BASE}/plans/${p.id}/image?cb=${Date.now()}`);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.log(error);
      }
    }
    setPreviewUrl(null);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    setForm((s) => ({ ...s, imageFile: f || null, removeImage: false }));
    if (f) {
      const u = URL.createObjectURL(f);
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          // ignore
        }
      }
      setPreviewUrl(u);
    } else {
      if (editingPlan) {
        setPreviewUrl(
          `${VITE_API_BASE}/plans/${editingPlan.id}/image?cb=${Date.now()}`
        );
      } else {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {
            // ignore
          }
        }
        setPreviewUrl(null);
      }
    }
  }

  function handleFieldChange<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validateForm() {
    if (!form.name || form.name.trim() === "") return "Name is required";
    if (form.price === "" || isNaN(Number(form.price)))
      return "Price must be a valid number";
    if (form.duration === "" || isNaN(Number(form.duration)))
      return "Duration must be an integer";
    return null;
  }

  async function submitCreateOrUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    const v = validateForm();
    if (v) {
      alert(v);
      return;
    }
    try {
      if (isEditing && editingPlan) {
        await updatePlan(editingPlan.id);
      } else {
        await createPlan();
      }
      await fetchPlans();
      closeModal();
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Operation failed");
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Operation failed");
      }
    }
  }

  async function createPlan() {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description || "");
    fd.append("price", form.price);
    fd.append("duration", form.duration);
    if (form.imageFile) fd.append("image", form.imageFile);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await axios.post(`${VITE_API_BASE}/plans`, fd, {
      headers: { ...headers, "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async function updatePlan(id: number) {
    const fd = new FormData();
    if (form.name) fd.append("name", form.name);
    if (form.description) fd.append("description", form.description || "");
    if (form.price !== "") fd.append("price", form.price);
    if (form.duration !== "") fd.append("duration", form.duration);
    if (form.imageFile) fd.append("image", form.imageFile);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${VITE_API_BASE}/plans/${id}${
      form.removeImage ? "?removeImage=true" : ""
    }`;
    const res = await axios.put(url, fd, {
      headers: { ...headers, "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  function openSubscribeModalForPlan(p: PlanType) {
    setSubscribePlan(p);
    setSubscribeOpen(true);
  }
  function closeSubscribeModal() {
    setSubscribeOpen(false);
    setSubscribePlan(null);
  }
  async function handleSubscribeSuccess() {
    setSubsRefresh((s) => s + 1);
    await fetchPlans();
    closeSubscribeModal();
    alert("Purchase recorded. Thank you!");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold"
          id="plans"
        >
          Gym Plans
        </motion.h1>

        <div className="flex items-center space-x-3">
          {isAdmin ? (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:scale-105 transform transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Add Plan
            </button>
          ) : (
            <div className="text-sm text-gray-200 px-3 py-2 rounded-lg bg-white/10">
              Browse plans
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading plans…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No plans yet. {isAdmin ? "Create one!" : "Please check back later."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {plans.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
              >
                <PlanCard plan={p}>
                  {isAdmin ? (
                    <PlanAdminActions
                      plan={p}
                      token={token}
                      onEdit={openEditModal}
                      onDeleted={(id: number) =>
                        setPlans((prev) => prev.filter((x) => x.id !== id))
                      }
                    />
                  ) : (
                    <button
                      onClick={() => openSubscribeModalForPlan(p)}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-rose-500 text-white font-medium hover:scale-102 transform transition"
                    >
                      Subscribe
                    </button>
                  )}
                </PlanCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PlanModal
        open={isOpen}
        isEditing={isEditing}
        form={form}
        previewUrl={previewUrl}
        onClose={closeModal}
        onSubmit={submitCreateOrUpdate}
        onFieldChange={handleFieldChange}
        onFileChange={onFileChange}
        setForm={setForm}
      />

      {!isAdmin && <MySubscriptions token={token} refreshKey={subsRefresh} />}

      <SubscribeModal
        open={subscribeOpen}
        onClose={closeSubscribeModal}
        plan={subscribePlan}
        onSuccess={handleSubscribeSuccess}
        apiBase={VITE_API_BASE}
        token={token}
      />
    </div>
  );
}
