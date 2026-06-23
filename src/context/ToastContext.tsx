"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; fg: string; bg: string }
> = {
  success: { icon: CheckCircle2, fg: "var(--color-success)", bg: "var(--color-success-soft)" },
  error: { icon: XCircle, fg: "var(--color-danger)", bg: "var(--color-danger-soft)" },
  info: { icon: Info, fg: "var(--color-brand)", bg: "var(--color-brand-soft)" },
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg border"
              style={{
                backgroundColor: style.bg,
                borderColor: style.fg,
                color: "var(--color-ink)",
              }}
            >
              <Icon size={20} style={{ color: style.fg, flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm flex-1">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Fermer la notification"
                className="text-current opacity-60 hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un <ToastProvider>");
  }
  return ctx;
}
