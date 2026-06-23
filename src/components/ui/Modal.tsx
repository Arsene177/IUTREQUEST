"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, widthClassName }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${widthClassName ?? "max-w-lg"} rounded-[var(--radius-card)] bg-[var(--color-cream)] shadow-xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-cream-line)]">
          <h2 id="modal-title" className="text-lg font-bold text-[var(--color-ink)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-[var(--color-ink)] hover:opacity-60 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-cream-line)] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
