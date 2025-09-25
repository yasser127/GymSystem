import React, { useEffect, useState } from "react";
import SuplemetsAdd from "./SuplemetsAdd";
import SuplemetsCard from "./SuplemetsCard";
import type { Supplement } from "../../types";

const VITE_API_BASE = (import.meta.env.VITE_API_BASE as string) ?? "";

const Suplements: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Supplement | null>(null);

  const openAdd = () => {
    setEditingItem(null);
    setIsAddOpen(true);
  };
  const closeAdd = () => {
    setEditingItem(null);
    setIsAddOpen(false);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!VITE_API_BASE) {
        console.warn("VITE_API_BASE not set");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${VITE_API_BASE.replace(/\/+$/, "")}/suplemets`
        );
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        if (!mounted) return;
        const mapped: Supplement[] = (data || []).map((d: any) => ({
          id: String(d.id),
          name: d.name ?? "Untitled",
          description: d.description ?? d.desc ?? "",
          price: d.price != null ? Number(d.price) : undefined,
          duration: d.duration != null ? Number(d.duration) : undefined,
          imageUrl: d.image ?? d.imageUrl ?? null,
        }));
        setItems(mapped);
      } catch (err) {
        console.error("Failed to load supplements:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddSubmit = (payload: FormData | Record<string, any>) => {
    // helper to produce a Supplement object
    const makeItemFromObj = (obj: any): Supplement => ({
      id: obj.id ? String(obj.id) : String(Date.now()),
      name: obj.name ?? obj.title ?? "Untitled",
      description: obj.desc ?? obj.description ?? "",
      price:
        obj.price !== undefined && obj.price !== null
          ? Number(obj.price)
          : undefined,
      duration:
        obj.duration !== undefined && obj.duration !== null
          ? Number(obj.duration)
          : undefined,
      imageUrl: obj.imageUrl ?? obj.image ?? null,
    });

    if (payload instanceof FormData) {
      
      const obj: any = {};
      payload.forEach((v, k) => {
        
        if (v instanceof File) return;
        obj[k] = v;
      });

      const file = (payload as FormData).get("image") as File | null;
      const newItem: Supplement = {
        id: editingItem ? editingItem.id : String(Date.now()),
        name: obj.name ?? "Untitled",
        description: obj.description ?? "",
        price: obj.price ? Number(obj.price) : undefined,
        duration: obj.duration ? Number(obj.duration) : undefined,
        imageUrl: null,
      };

      if (file && file instanceof File) {
        
        newItem.imageUrl = URL.createObjectURL(file);
      } else if (editingItem && editingItem.imageUrl) {
        
        newItem.imageUrl = editingItem.imageUrl;
      } else {
        newItem.imageUrl = null;
      }

      if (editingItem) {
       
        setItems((s) =>
          s.map((it) => (it.id === editingItem.id ? newItem : it))
        );
      } else {
       
        setItems((s) => [newItem, ...s]);
      }
      
      setEditingItem(null);
      setIsAddOpen(false);
    } else {
    
      const newItem = makeItemFromObj(payload);

      if (editingItem) {
        setItems((s) =>
          s.map((it) => (it.id === editingItem.id ? newItem : it))
        );
      } else {
        setItems((s) => [newItem, ...s]);
      }
      setEditingItem(null);
      setIsAddOpen(false);
    }
  };


  const handleRemove = (id: string) =>
    setItems((s) => {
      const toRemove = s.find((it) => it.id === id);
      if (
        toRemove &&
        toRemove.imageUrl &&
        toRemove.imageUrl.startsWith("blob:")
      ) {
        try {
          URL.revokeObjectURL(toRemove.imageUrl);
        } catch (e) {
          // ignore
        }
      }
      return s.filter((i) => i.id !== id);
    });

  // open modal in edit mode
  const handleEdit = (item: Supplement) => {
    setEditingItem(item);
    setIsAddOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Supplements</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-md border px-4 py-6 text-center text-slate-600">
            Loading supplements...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border px-4 py-6 text-center text-slate-600">
            No supplements yet
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <SuplemetsCard
                key={it.id}
                id={it.id}
                initialItem={it}
                onRemove={handleRemove}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      <SuplemetsAdd
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleAddSubmit}
        initial={
          editingItem
            ? {
                name: editingItem.name,
                description: editingItem.description,
                price: editingItem.price ?? "",
                imageUrl: editingItem.imageUrl ?? null,
                id: editingItem.id,
              }
            : undefined
        }
      />
    </div>
  );
};

export default Suplements;
