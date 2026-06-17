import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { cn } from "@/utils/cn";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  showCloseButton?: boolean;
  preventOverflow?: boolean;
  height?: string;
  closeOnOverlayClick?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "2xl",
  showCloseButton = true,
  preventOverflow = false,
  height,
  closeOnOverlayClick = false,
  initialFocusRef,
}) => {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Only run open/close setup when visibility changes — not when onClose identity changes.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocusRef?.current ?? modalRef.current)?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocusedElementRef.current?.focus();
    };
  }, [initialFocusRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasHeader = Boolean(title || subtitle || showCloseButton);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? "Modal" : undefined}
        tabIndex={-1}
        className={cn(
          "bg-white rounded-lg shadow-xl w-full outline-none",
          maxWidthClasses[maxWidth],
          height ? height : "max-h-[90dvh]",
          preventOverflow ? "flex flex-col" : "overflow-y-auto",
        )}
      >
        {hasHeader && (
          <div className="shrink-0 border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                {title ? (
                  <h2
                    id={titleId}
                    className="flex text-xl font-semibold text-gray-800"
                  >
                    {title}
                  </h2>
                ) : null}
                {subtitle ? (
                  <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                ) : null}
              </div>
              {showCloseButton ? (
                <IconButton
                  onClick={onClose}
                  tone="neutral"
                  aria-label="Fechar"
                >
                  <X className="w-6 h-6" />
                </IconButton>
              ) : null}
            </div>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
