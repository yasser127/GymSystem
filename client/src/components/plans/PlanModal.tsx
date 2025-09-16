import React, { useEffect } from "react";
import { motion } from "framer-motion";
import type {PlanModalProps} from "../../types";

export default function PlanModal({
  open,
  isEditing,
  form,
  previewUrl,
  onClose,
  onSubmit,
  onFieldChange,
  onFileChange,
  setForm,
}: PlanModalProps) {
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch(err) {
          console.log(err);
        }
      }
    };
  }, [previewUrl]);

  if (!open) return null;

  return (
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

      <motion.form
        onSubmit={onSubmit}
        className="relative bg-white rounded-2xl w-full max-w-2xl p-6 z-10 shadow-2xl"
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Plan" : "Create Plan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
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
              onChange={(e) => onFieldChange("price", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => onFieldChange("duration", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Image</label>
            <div className="flex items-start gap-4">
              <div className="w-36 h-24 rounded-lg overflow-hidden bg-gray-100 border">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
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
                        onChange={(e) =>
                          onFieldChange("removeImage", e.target.checked)
                        }
                      />
                      <span className="text-sm text-gray-600">
                        Remove existing image
                      </span>
                    </label>
                  )}
                  {form.imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        const fakeEvent = {
                          target: { files: [] },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
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
                  Tip: upload a square image for best display. Max recommended
                  2MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
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
  );
}
