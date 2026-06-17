"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast, Toast as ToastType } from "@/contexts/ToastContext";
import { IconButton } from "@/components/ui";

interface ToastProps {
  toast: ToastType;
}

export default function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match animation duration
  };

  useEffect(() => {
    // If toast has a duration, start exit animation slightly before removal
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles =
      "flex items-start gap-3 p-4 rounded-lg shadow-lg pointer-events-auto min-w-0 w-[calc(100vw-2rem)] max-w-md sm:min-w-[280px]";
    const animationStyles = isExiting
      ? "animate-slide-out-right"
      : "animate-slide-in-right";

    switch (toast.type) {
      case "success":
        return `${baseStyles} ${animationStyles} bg-green-50 border-l-4 border-green-500 text-green-900`;
      case "error":
        return `${baseStyles} ${animationStyles} bg-red-50 border-l-4 border-red-500 text-red-900`;
      case "warning":
        return `${baseStyles} ${animationStyles} bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900`;
      case "info":
      default:
        return `${baseStyles} ${animationStyles} bg-blue-50 border-l-4 border-blue-500 text-blue-900`;
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className={getStyles()}>
      <div className={`flex-shrink-0 ${getIconColor()}`}>{getIcon()}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <IconButton
        onClick={handleClose}
        className="min-h-0 min-w-0 flex-shrink-0 p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </IconButton>
    </div>
  );
}
