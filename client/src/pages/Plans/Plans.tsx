import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const VITE_API_BASE =  "http://localhost:3000";

type Plan = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  admin_id?: number | null;
  created_at?: string;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  duration: string;
  imageFile: File | null;
  removeImage: boolean;
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state
  const emptyForm: FormState = {
    name: "",
    description: "",
    price: "",
    duration: "",
    imageFile: null,
    removeImage: false,
  };
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // local preview

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    fetchPlans();
    // cleanup previewUrl on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPlans() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<Plan[]>(`${VITE_API_BASE}/plans`);
      setPlans(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setIsEditing(false);
    setEditingPlan(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsOpen(true);
  }

  function openEditModal(p: Plan) {
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
    // show current image from server (cache-busted)
    setPreviewUrl(`${VITE_API_BASE}/plans/${p.id}/image?cb=${Date.now()}`);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
    if (previewUrl) {
      try {
        // only revoke if it was a local object URL
        if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      } catch {}
      setPreviewUrl(null);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    setForm((s) => ({ ...s, imageFile: f || null, removeImage: false }));
    if (f) {
      const u = URL.createObjectURL(f);
      // revoke previous if local
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(u);
    } else {
      // if removing selected file, revert preview to server image if editing
      if (editingPlan) {
        setPreviewUrl(`${VITE_API_BASE}/plans/${editingPlan.id}/image?cb=${Date.now()}`);
      } else {
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }

  function handleFieldChange<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validateForm() {
    if (!form.name || form.name.trim() === "") return "Name is required";
    if (form.price === "" || isNaN(Number(form.price))) return "Price must be a valid number";
    if (form.duration === "" || isNaN(Number(form.duration))) return "Duration must be an integer";
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
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Operation failed");
    }
  }

  async function createPlan() {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description || "");
    fd.append("price", form.price);
    fd.append("duration", form.duration);
    if (form.imageFile) fd.append("image", form.imageFile);

    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await axios.post(`${VITE_API_BASE}/plans`, fd, {
      headers: { ...headers, "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async function updatePlan(id: number) {
    // Use multipart/form-data so we can optionally replace image.
    const fd = new FormData();
    if (form.name) fd.append("name", form.name);
    fd.append("description", form.description || "");
    if (form.price !== "") fd.append("price", form.price);
    if (form.duration !== "") fd.append("duration", form.duration);
    if (form.imageFile) fd.append("image", form.imageFile);
    if (form.removeImage) {
      // server accepts ?removeImage=true
    }

    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = `${VITE_API_BASE}/plans/${id}${form.removeImage ? "?removeImage=true" : ""}`;
    const res = await axios.put(url, fd, {
      headers: { ...headers, "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await axios.delete(`${VITE_API_BASE}/plans/${id}`, { headers });
      setPlans((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete");
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold"
        >
          Gym Plans
        </motion.h1>

        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:scale-105 transform transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading plans…</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No plans yet. Create one!</div>
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
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col"
              >
                <div className="flex-shrink-0 h-40 w-full rounded-lg overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                  {/* Image: we use direct endpoint which should return image bytes */}
                  <img
                    src={`${VITE_API_BASE}/plans/${p.id}/image`}
                    alt={p.name}
                    onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder-image.png")}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold line-clamp-2">{p.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Price</div>
                    <div className="font-medium">${Number(p.price).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Duration</div>
                    <div className="font-medium">{p.duration} days</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.form
              onSubmit={(e) => submitCreateOrUpdate(e)}
              className="relative bg-white rounded-2xl w-full max-w-2xl p-6 z-10 shadow-2xl"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{isEditing ? "Edit Plan" : "Create Plan"}</h2>
                <button type="button" onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="e.g. Monthly Pro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => handleFieldChange("duration", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Image</label>

                  <div className="flex items-start gap-4">
                    <div className="w-36 h-24 rounded-lg overflow-hidden bg-gray-100 border">
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={onFileChange} />
                      <div className="mt-2 flex items-center gap-4">
                        {isEditing && (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={form.removeImage}
                              onChange={(e) => handleFieldChange("removeImage", e.target.checked)}
                            />
                            <span className="text-sm text-gray-600">Remove existing image</span>
                          </label>
                        )}

                        {form.imageFile && (
                          <button
                            type="button"
                            onClick={() => {
                              // clear file
                              const fakeEvent = { target: { files: [] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                              onFileChange(fakeEvent);
                              setForm((s) => ({ ...s, imageFile: null }));
                            }}
                            className="text-sm text-red-600"
                          >
                            Clear selected file
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Tip: upload a square image for best display. Max recommended 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:scale-105 transform transition"
                >
                  {isEditing ? "Save changes" : "Create plan"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
