"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRescheduleAttendances } from "@/api/query/hooks/useAttendanceQueries";
import { useToast } from "@/contexts/ToastContext";
import { addCalendarDaysToLocalYmd, getTodayClinic } from "@/utils/timezoneDate";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, Input } from "@/components/ui";

/** Minimal payload for reschedule modal (from GroupedAttendance or GroupedScheduledAttendance). */
export interface RescheduleModalPayload {
  date: string;
  attendanceId: string;
  attendanceIds?: string[];
}

function getDefaultRescheduleDate(originalDate: string): string {
  const today = getTodayClinic();
  let candidate = addCalendarDaysToLocalYmd(originalDate, 7);
  while (candidate < today) {
    candidate = addCalendarDaysToLocalYmd(candidate, 7);
  }
  return candidate;
}

interface RescheduleAttendanceModalProps {
  payload: RescheduleModalPayload;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RescheduleAttendanceModal: React.FC<
  RescheduleAttendanceModalProps
> = ({ payload, onClose, onSuccess }) => {
  const defaultDate = getDefaultRescheduleDate(payload.date);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const rescheduleMutation = useRescheduleAttendances();
  const { showToast } = useToast();
  const today = getTodayClinic();

  const attendanceIds = useMemo(() => {
    if (payload.attendanceIds?.length) {
      return [...new Set(payload.attendanceIds.map((id) => parseInt(id, 10)))];
    }
    return [parseInt(payload.attendanceId, 10)];
  }, [payload.attendanceIds, payload.attendanceId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (scheduledDate < today) return;
      rescheduleMutation.mutate(
        { attendanceIds, newScheduledDate: scheduledDate },
        {
          onSuccess: () => {
            showToast("Atendimento reagendado com sucesso", "success");
            onSuccess?.();
            onClose();
          },
        },
      );
    },
    [
      attendanceIds,
      scheduledDate,
      today,
      rescheduleMutation,
      showToast,
      onSuccess,
      onClose,
    ],
  );

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title="Reagendar atendimento"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
        <Field label="Nova Data:" htmlFor="reschedule-date">
          <Input
            id="reschedule-date"
            type="date"
            min={today}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </Field>
        {rescheduleMutation.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {rescheduleMutation.error?.message}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={rescheduleMutation.isPending}
            loadingText="Reagendando..."
            disabled={scheduledDate < today}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Reagendar
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
