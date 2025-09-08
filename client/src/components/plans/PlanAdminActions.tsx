import React, { useState } from "react";
import axios from "axios";
import type { Plan } from "../../types";

const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;

type Props = {
  plan: Plan;
  token: string | null;
  onEdit: (p: Plan) => void;
  onDeleted?: (id: number) => void;
};

export default function PlanAdminActions({
  plan,
  token,
  onEdit,
  onDeleted,
}: Props): React.ReactElement {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this plan? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await axios.delete(`${VITE_API_BASE}/plans/${plan.id}`, { headers });
      if (onDeleted) onDeleted(plan.id);
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Failed to delete");
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <button
        onClick={() => onEdit(plan)}
        className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      >
        Edit
      </button>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ${
          deleting ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
