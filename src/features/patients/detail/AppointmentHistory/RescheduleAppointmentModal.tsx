"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRescheduleAppointments } from "@/api/query/hooks/useAppointmentQueries";
import { useToast } from "@/contexts/ToastContext";
import {
  addCalendarDaysToLocalYmd,
  getTodayClinic,
} from "@/utils/timezoneDate";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, Input } from "@/components/ui";

/** Minimal payload for reschedule modal (from GroupedAppointment or GroupedScheduledAppointment). */
export interface RescheduleModalPayload {
  date: string;
  appointmentId: string;
  appointmentIds?: string[];
}

function getDefaultRescheduleDate(originalDate: string): string {
  const today = getTodayClinic();
  let candidate = addCalendarDaysToLocalYmd(originalDate, 7);
  while (candidate < today) {
    candidate = addCalendarDaysToLocalYmd(candidate, 7);
  }
  return candidate;
}

interface RescheduleAppointmentModalProps {
  payload: RescheduleModalPayload;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RescheduleAppointmentModal: React.FC<
  RescheduleAppointmentModalProps
> = ({ payload, onClose, onSuccess }) => {
  const defaultDate = getDefaultRescheduleDate(payload.date);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const rescheduleMutation = useRescheduleAppointments();
  const { showToast } = useToast();
  const today = getTodayClinic();

  const appointmentIds = useMemo(() => {
    if (payload.appointmentIds?.length) {
      return [...new Set(payload.appointmentIds.map((id) => parseInt(id, 10)))];
    }
    return [parseInt(payload.appointmentId, 10)];
  }, [payload.appointmentIds, payload.appointmentId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (scheduledDate < today) return;
      rescheduleMutation.mutate(
        { appointmentIds, newScheduledDate: scheduledDate },
        {
          onSuccess: () => {
            showToast("Appointment rescheduled successfully", "success");
            onSuccess?.();
            onClose();
          },
        },
      );
    },
    [
      appointmentIds,
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
      title="Reschedule appointment"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
        <Field label="New Date:" htmlFor="reschedule-date">
          <Input
            id="reschedule-date"
            type="date"
            lang="en-US"
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
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={rescheduleMutation.isPending}
            loadingText="Rescheduling..."
            disabled={scheduledDate < today}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Reschedule
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
