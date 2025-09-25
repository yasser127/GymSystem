import React, { useEffect, useMemo, useState } from "react";
import type { Supplement } from "../../types";
import { useGetMeQuery } from "../../services/previllageChecker";

type Props = {
  id: string;
  initialItem?: Supplement | null;
  onRemove?: (id: string) => void;
  onEdit?: (item: Supplement) => void;
};

const SuplemetsCard: React.FC<Props> = ({
  id,
  initialItem = null,
  onRemove,
  onEdit,
}) => {
  const [item, setItem] = useState<Supplement | null>(initialItem);
  const [loading, setLoading] = useState<boolean>(!initialItem);
  const [error, setError] = useState<string | null>(null);
  const [idd, setId] = useState<string | null>(initialItem?.id ?? null);

  const { data: me } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
  const isAdmin = useMemo(() => {
    if (me === undefined || me === null) return false;
    if (typeof me === "boolean") return me;
    if (typeof me === "object") return !!(me as { isAdmin?: boolean }).isAdmin;
    return false;
  }, [me]);

 // const token = useMemo<string | null>(() => localStorage.getItem("token"), []);


  useEffect(() => {
    if (initialItem) {
      setItem(initialItem);
      setId(initialItem.id);
      setLoading(false);
      setError(null);
    }
  }, [initialItem]);

  // Fetch from API only if parent hasn't provided an initialItem.
  useEffect(() => {
    
    if (initialItem) {
      return;
    }

    let aborted = false;
    const controller = new AbortController();
    const base = (import.meta.env.VITE_API_BASE as string) ?? "";

    if (!base) {
      setLoading(false);
      return () => {
        aborted = true;
        controller.abort();
      };
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${base.replace(/\/+$/, "")}/suplemets/${encodeURIComponent(id)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to load (${res.status})`);
        }
        const data = await res.json();
        if (aborted) return;

        const mapped: Supplement = {
          id: String(data.id ?? id),
          name: data.name ?? data.title ?? "Untitled",
          description: data.description ?? "",
          price:
            data.price !== undefined && data.price !== null
              ? Number(data.price)
              : undefined,
          duration:
            data.duration !== undefined && data.duration !== null
              ? Number(data.duration)
              : undefined,
          imageUrl: data.image ?? data.imageUrl ?? null,
        };
        setItem(mapped);
        setId(mapped.id);
        setLoading(false);
      } catch (err: any) {
        if (aborted) return;
        console.error("SuplemetsCard fetch error:", err);
        setError(err?.message ?? "Failed to load");
        setLoading(false);
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [id, initialItem]);

  const handleRemove = async () => {
    const toDeleteId = idd ?? id;
    if (!toDeleteId) return;
    const base = (import.meta.env.VITE_API_BASE as string) ?? "";
    if (!base) {
      onRemove?.(toDeleteId);
      return;
    }

    try {
      const res = await fetch(
        `${base.replace(/\/+$/, "")}/suplemets/${encodeURIComponent(
          toDeleteId
        )}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to delete (${res.status})`);
      }
      onRemove?.(toDeleteId);
    } catch (err) {
      console.error("Failed to delete supplement:", err);
      setError((err as any)?.message ?? "Failed to delete");
    }
  };

  const handleEdit = () => {
    if (item) onEdit?.(item);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="h-40 w-full flex-shrink-0 bg-slate-100">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading...
          </div>
        ) : item?.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-8 w-full rounded bg-slate-200" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">Error: {error}</div>
        ) : item ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-md font-semibold leading-tight">
                  {item.name}
                </h3>
                <p className="mt-1 max-w-[28rem] text-sm text-slate-500 line-clamp-3">
                  {item.description || "-"}
                </p>
              </div>

              <div className="flex flex-col items-end text-right">
                <div className="rounded-md px-2 py-1 text-sm font-medium">
                  {typeof item.price === "number"
                    ? `$${item.price.toFixed(2)}`
                    : "-"}
                </div>
                <div className="mt-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {item.duration ? `${item.duration}d` : "-"}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">ID: {item.id}</div>

                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleRemove}
                    className="rounded-md border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            {!isAdmin && (
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">ID: {item.id}</div>

                <div className="flex gap-2">
                  <button className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50 text-green-400 bg-green-50">
                    buy
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-500">No data</div>
        )}
      </div>
    </div>
  );
};

export default SuplemetsCard;
