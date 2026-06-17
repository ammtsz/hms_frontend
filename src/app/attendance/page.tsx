"use client";

import React, { useState, useCallback, Suspense, lazy } from "react";
import { PatientWalkInPanel } from "@/features/attendance/components/WalkIn";
import { Priority } from "@/types/types";
import LoadingFallback from "@/components/common/LoadingFallback";
import { SettingsIcon } from "lucide-react";
import { Card } from "@/components/ui";

// Lazy load the heavy attendance board
const AttendanceBoard = lazy(
  () => import("@/features/attendance/AttendanceBoard"),
);

export default function AttendancePage() {
  const [unscheduledCheckIn, setUnscheduledCheckIn] = useState<{
    name: string;
    types: string[];
    isNew: boolean;
    priority: Priority;
  } | null>(null);

  // Memoize callback to prevent infinite re-renders in useExternalCheckIn
  const handleCheckInProcessed = useCallback(() => {
    setUnscheduledCheckIn(null);
  }, []);

  // Memoize registration callback to prevent infinite loops
  const handleRegisterNewAttendance = useCallback(
    (name: string, types: string[], isNew: boolean, priority: Priority) => {
      setUnscheduledCheckIn({ name, types, isNew, priority });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-8 my-6 sm:my-16">
      {/* Walk-in Patients Panel */}
      <PatientWalkInPanel
        onRegisterNewAttendance={handleRegisterNewAttendance}
      />

      {/* Attendance Management Board */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            Quadro de Atendimentos
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie o fluxo de atendimentos arrastando e soltando o nome dos
            pacientes. Use o botão{" "}
            <SettingsIcon
              className="inline h-4 w-4 shrink-0 align-text-bottom"
              aria-hidden
            />{" "}
            de configurações para gerenciar os agendamentos.
          </p>
        </div>
        <div className="p-4">
          <Suspense
            fallback={
              <LoadingFallback
                message="Carregando quadro de atendimentos..."
                size="large"
              />
            }
          >
            <AttendanceBoard
              unscheduledCheckIn={unscheduledCheckIn}
              onCheckInProcessed={handleCheckInProcessed}
            />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
