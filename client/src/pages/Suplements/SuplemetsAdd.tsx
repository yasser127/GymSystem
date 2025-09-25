import React, { useEffect, useState } from "react";


type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FormData | Record<string, any>) => void;
  initial?: {
    id?: string;
    name?: string;
    description?: string;
    price?: number | string;
    imageUrl?: string | null;
  } | null;
};

const SuplemetsAdd: React.FC<Props> = ({ isOpen, onClose, onSubmit, initial }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<string | number>(initial?.price ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const base = (import.meta.env.VITE_API_BASE as string) ?? "";

  useEffect(() => {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setPrice(initial?.price ?? "");
    setFile(null);
    setPreview(initial?.imageUrl ?? null);
  }, [initial, isOpen]);

  useEffect(() => {
    // clean up blob preview URLs on unmount
    return () => {
      if (preview && preview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(preview);
        } catch {}
      }
    };
  }, [preview]);

  if (!isOpen) return null;

  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const doLocalSubmit = (formData: FormData) => {
    // Call parent for optimistic UI; parent will handle FormData or response object
    onSubmit(formData);
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setSubmitting(true);

    const form = new FormData();
    form.append("name", name);
    form.append("desc", description);
    form.append("price", String(price ?? ""));
    if (file) form.append("image", file);

    // If editing, use PUT /suplemets/:id
    try {
      if (!base) {
        // no API configured — do local only
        doLocalSubmit(form);
        setSubmitting(false);
        onClose();
        return;
      }

      if (initial?.id) {
        // edit
        const res = await fetch(`${base.replace(/\/+$/, "")}/suplemets/${encodeURIComponent(initial.id)}`, {
          method: "PUT",
          body: form,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to update (${res.status})`);
        }
    
        // after successful update, fetch updated item to return to parent (or build one)
        const itemRes = await fetch(`${base.replace(/\/+$/, "")}/suplemets/${encodeURIComponent(initial.id)}`);
        let itemData;
        if (itemRes.ok) itemData = await itemRes.json();
        else itemData = {
          id: initial.id,
          name,
          description,
          price: price ? Number(price) : undefined,
          imageUrl: preview,
        };

        onSubmit(itemData);
      } else {
        // create
        const res = await fetch(`${base.replace(/\/+$/, "")}/suplemets/add`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to create (${res.status})`);
        }
        const data = await res.json();
        // If server returned insertId, fetch the actual item
        if (data?.insertId) {
          const itemRes = await fetch(`${base.replace(/\/+$/, "")}/suplemets/${encodeURIComponent(data.insertId)}`);
          if (itemRes.ok) {
            const itemData = await itemRes.json();
            onSubmit(itemData);
          } else {
            // fallback to local representation
            onSubmit({
              id: String(data.insertId),
              name,
              description,
              price: price ? Number(price) : undefined,
              imageUrl: preview,
            });
          }
        } else {
          // fallback: return local representation
          onSubmit({
            id: String(Date.now()),
            name,
            description,
            price: price ? Number(price) : undefined,
            imageUrl: preview,
          });
        }
      }
      // close modal
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      alert((err as any)?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="z-10 w-full max-w-xl rounded-lg bg-white p-6 shadow-lg"
      >
        <h3 className="mb-4 text-lg font-semibold">{initial?.id ? "Edit" : "Add"} Supplement</h3>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border px-3 py-2"
            rows={3}
            required
          />
        </div>

        <div className="mb-3 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Price</label>
            <input
              type="number"
              step="0.01"
              value={String(price ?? "")}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-sm font-medium">Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="preview" className="mt-2 h-24 w-full object-cover" />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuplemetsAdd;
