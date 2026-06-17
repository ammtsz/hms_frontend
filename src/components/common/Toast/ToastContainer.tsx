"use client";

import React from "react";
import { useToast } from "@/contexts/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[9999] flex flex-col items-stretch gap-2 sm:left-auto sm:w-auto sm:items-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
