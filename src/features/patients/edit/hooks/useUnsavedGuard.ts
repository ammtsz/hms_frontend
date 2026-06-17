"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseUnsavedGuardProps {
  isDirty: boolean;
  onConfirmLeave?: () => void;
}

export const useUnsavedGuard = ({
  isDirty,
  onConfirmLeave,
}: UseUnsavedGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");

  // beforeunload for refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isDirty]);

  // Block back button
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      // Show modal instead of using confirm
      setShowModal(true);
      // Push current state back to stay on page
      window.history.pushState(null, "", pathname);
    };

    window.addEventListener("popstate", handlePopState);
    // Initial push for detection
    window.history.pushState(null, "", pathname);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty, pathname]);

  // Intercept Link clicks
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isDirty) return;

      const link = (e.target as HTMLElement).closest("a");
      if (!link?.href) return;

      // Allow links that open in new tab/window - they don't navigate away from current page
      if (link.target === "_blank" || link.target === "_new") return;

      // Check if it's an internal link
      const isInternal =
        link.href.startsWith(window.location.origin) ||
        link.href.startsWith("/");

      if (!isInternal) return;

      e.preventDefault();
      e.stopPropagation();

      const url = link.href.startsWith("/")
        ? link.href
        : link.href.replace(window.location.origin, "");

      setPendingUrl(url);
      setShowModal(true);
    },
    [isDirty]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [handleClick]);

  const confirmLeave = () => {
    if (onConfirmLeave) {
      onConfirmLeave();
    }
    setShowModal(false);
    if (pendingUrl) {
      router.push(pendingUrl);
      setPendingUrl("");
    } else {
      // Handle back button case
      window.history.back();
    }
  };

  const cancelLeave = () => {
    setShowModal(false);
    setPendingUrl("");
  };

  return { showModal, confirmLeave, cancelLeave };
};
