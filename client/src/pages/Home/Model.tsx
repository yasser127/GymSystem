// src/components/Model.tsx
import React, { useEffect, useRef, useState } from "react";

const PROJECT_GRADIENT =
  "linear-gradient(90deg, rgba(91,33,182,1) 0%, rgba(124,58,237,1) 45%, rgba(167,139,250,1) 100%)";

type Props = {
  onClose: () => void;
};

const API_BASE = "http://localhost:3000";

const Model: React.FC<Props> = ({ onClose }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const contactRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg?: string }>(null);

  const safeClose = () => {
    if (typeof onClose === "function") onClose();
    else console.warn("onClose is not a function");
  };

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'input,textarea,button,a[href],[tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") safeClose();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        safeClose();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      previousActive?.focus();
    };
  }, [onClose]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const name = nameRef.current?.value ?? "";
    const contact = contactRef.current?.value ?? "";
    const message = messageRef.current?.value ?? "";

    if (!contact && !message) {
      setStatus({ ok: false, msg: "Please enter contact or a message." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok && body.ok) {
        setStatus({ ok: true, msg: "Message sent — thanks!" });
        // clear inputs
        nameRef.current && (nameRef.current.value = "");
        contactRef.current && (contactRef.current.value = "");
        messageRef.current && (messageRef.current.value = "");
        // optionally close modal after a short delay:
        setTimeout(() => safeClose(), 900);
      } else {
        setStatus({ ok: false, msg: body.error || "Failed to send message" });
      }
    } catch (err) {
      console.error(err);
      setStatus({ ok: false, msg: "Network error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="membership-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 transform transition duration-150"
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Get in touch</h4>
            <p className="text-slate-600 mt-2">
              Call: +961 71 000 000 • Email: hello@forgefit.lb
            </p>
          </div>

          <button
            onClick={safeClose}
            aria-label="Close dialog"
            className="ml-4 rounded-md p-2 text-slate-600 hover:bg-gray-50"
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input
            ref={nameRef}
            className="bg-gray-50 placeholder:text-slate-400 p-3 rounded-lg border border-gray-100 text-slate-900"
            placeholder="Your name"
            name="name"
          />
          <input
            ref={contactRef}
            className="bg-gray-50 placeholder:text-slate-400 p-3 rounded-lg border border-gray-100 text-slate-900"
            placeholder="Email or phone"
            name="contact"
          />
          <textarea
            ref={messageRef}
            className="bg-gray-50 placeholder:text-slate-400 p-3 rounded-lg h-24 border border-gray-100 text-slate-900"
            placeholder="How can we help?"
            name="message"
          />
          <div className="flex gap-2 items-center">
            <button
              disabled={loading}
              type="submit"
              className="px-4 py-2 rounded-xl font-medium disabled:opacity-60"
              style={{ background: PROJECT_GRADIENT, color: "white" }}
            >
              {loading ? "Sending…" : "Send"}
            </button>
           
            {status ? (
              <div
                role="status"
                className={`ml-3 text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}
              >
                {status.msg}
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Model;
