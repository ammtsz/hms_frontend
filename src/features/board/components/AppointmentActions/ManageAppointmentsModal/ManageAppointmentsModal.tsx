import React, { useMemo } from "react";
import { useManageAppointmentsModal } from "./hooks/useManageAppointmentsModal";
import { getMinDate } from "@/utils/dateUtils";
import { formatDisplayDate } from "@/utils/dateUtils";
import { PatientStatus } from "@/api/types";
import BaseModal from "@/components/common/BaseModal";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Radio,
  Select,
  Textarea,
} from "@/components/ui";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MODAL_FOOTER_CLASS =
  "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end";

function getWeekdayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAYS[d.getDay()] ?? "";
}

interface ManageAppointmentsModalProps {
  onRefresh?: () => void;
}

/**
 * Manage Appointment Modal - Allows user to cancel or reschedule appointments
 * Used on both the appointment board page and the schedule page
 */
export const ManageAppointmentsModal: React.FC<ManageAppointmentsModalProps> = ({
  onRefresh,
}) => {
  const {
    state: {
      isOpen,
      patientName,
      action,
      error,
      isSubmitting,
      loadingSessions,
      treatmentsWithSessionRows,
      selectedAppointmentIds,
      selectedDate,
      postponeMode,
      reason,
      cancelAllOpenAppointments,
      cancelAllNewStatus,
      nextAvailableDates,
      loadingNextAvailable,
      appointmentDate,
      postponeFeedback,
    },
    handlers: {
      setAction,
      handleBackToSelection,
      handleClose,
      toggleSelection,
      setReason,
      setSelectedDate,
      setPostponeMode,
      setCancelAllOpenAppointments,
      setCancelAllNewStatus,
      handleConfirmCancellation,
      handleConfirmPostpone,
      handleAcknowledgePostponeFeedback,
    },
  } = useManageAppointmentsModal(onRefresh);

  const appointmentIdToLabel = useMemo(() => {
    const map = new Map<number, string>();
    treatmentsWithSessionRows?.forEach((row) => {
      if (!row.sessionRow.appointmentId) return;
      const type =
        row.treatment.treatmentType === "physiotherapy"
          ? "Physiotherapy"
          : "TENS";
      const loc = row.treatment.bodyLocation ?? "";
      const color = row.treatment.color ? `, ${row.treatment.color}` : "";
      map.set(row.sessionRow.appointmentId, `${type} (${loc}${color})`);
    });
    return map;
  }, [treatmentsWithSessionRows]);

  const previewGroupedByDate = useMemo(() => {
    const byDate = new Map<
      string | null,
      Array<{ id: number; label: string }>
    >();
    selectedAppointmentIds.forEach((id) => {
      const date = nextAvailableDates[String(id)] ?? null;
      const list = byDate.get(date) ?? [];
      const label = appointmentIdToLabel.get(id) ?? "Assessment Consultation";
      list.push({ id, label });
      byDate.set(date, list);
    });
    return byDate;
  }, [selectedAppointmentIds, nextAvailableDates, appointmentIdToLabel]);

  const weekDayLabel = appointmentDate ? getWeekdayLabel(appointmentDate) : "";
  const selectedCount = selectedAppointmentIds.length;

  const isAssessmentSelection =
    !action &&
    !loadingSessions &&
    treatmentsWithSessionRows.length === 0 &&
    selectedCount > 0;

  const modalTitle = !action
    ? "Manage Appointment"
    : action === "cancel"
      ? "Cancel Appointment"
      : postponeFeedback
        ? "Reschedule Summary"
        : "Reschedule Appointment";

  const handleModalClose = () => {
    if (isSubmitting) {
      return;
    }
    if (postponeFeedback) {
      handleAcknowledgePostponeFeedback();
      return;
    }
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={modalTitle}
      maxWidth="md"
      preventOverflow
      showCloseButton={!isSubmitting}
    >
      <div className="overflow-y-auto p-4 sm:p-6">
        {!action ? (
          <div className="mb-4">
            {isAssessmentSelection ? (
              <p className="mb-6 text-sm text-gray-600">
                Patient: <strong>{patientName || ""}</strong>
              </p>
            ) : (
              <p className="mb-6 text-sm text-gray-600">
                Select the appointments for <strong>{patientName || ""}</strong>{" "}
                you want to manage.
              </p>
            )}

            {loadingSessions ? (
              <div className="text-sm italic text-gray-600">
                Loading sessions...
              </div>
            ) : treatmentsWithSessionRows &&
              treatmentsWithSessionRows.length > 0 ? (
              <div className="mb-6 max-h-[650px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {treatmentsWithSessionRows.map((row) => {
                  if (!row.sessionRow.appointmentId) return null;
                  const isSelected = selectedAppointmentIds.includes(
                    row.sessionRow.appointmentId,
                  );
                  return (
                    <label
                      key={row.sessionRow.id}
                      className="flex cursor-pointer items-start gap-3 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() =>
                          toggleSelection(row.sessionRow.appointmentId!)
                        }
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {row.treatment.treatmentType === "physiotherapy"
                            ? "Physiotherapy"
                            : "TENS"}
                          : {row.treatment.bodyLocation}
                          {row.treatment.color &&
                            ` (color: ${row.treatment.color})`}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mb-6">
                {!isAssessmentSelection && (
                  <p className="text-sm italic text-gray-600">
                    No sessions found.
                  </p>
                )}
              </div>
            )}

            <p className="mb-6 text-md font-semibold text-gray-600">
              What would you like to do with{" "}
              {selectedCount > 1 ? "these appointments" : "this appointment"}?
            </p>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction("postpone")}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Reschedule ({selectedCount})
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction("cancel")}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Cancel Appointment ({selectedCount})
              </Button>
            </div>
          </div>
        ) : null}

        {action === "cancel" ? (
          <div className="mb-4">
            <p className="mb-4 text-sm text-gray-600">
              You are about to cancel the appointment for{" "}
              <strong>{patientName || ""}</strong>.
            </p>

            {error ? (
              <div className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleConfirmCancellation}>
              <div className="mb-4">
                <fieldset className="space-y-3" disabled={isSubmitting}>
                  <legend className="sr-only">Choose cancellation scope</legend>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Radio
                      name="cancel-scope"
                      checked={!cancelAllOpenAppointments}
                      onChange={() => setCancelAllOpenAppointments(false)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cancel only this appointment
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Radio
                      name="cancel-scope"
                      checked={cancelAllOpenAppointments}
                      onChange={() => setCancelAllOpenAppointments(true)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cancel all open appointments for this patient (including
                      other dates)
                    </span>
                  </label>
                </fieldset>

                {cancelAllOpenAppointments ? (
                  <>
                    <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      All open appointments for this patient will be canceled and
                      the patient status will no longer be{" "}
                      <strong>&quot;In treatment&quot;</strong>.
                    </div>

                    <Field
                      label="Change status to:"
                      htmlFor="cancel-all-status"
                      className="mt-6"
                    >
                      <Select
                        id="cancel-all-status"
                        value={cancelAllNewStatus}
                        onChange={(e) =>
                          setCancelAllNewStatus(
                            e.target.value as
                              | PatientStatus.DISCHARGED
                              | PatientStatus.CONSECUTIVE_NO_SHOWS,
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <option value={PatientStatus.DISCHARGED}>
                          Discharged ({PatientStatus.DISCHARGED})
                        </option>
                        <option value={PatientStatus.CONSECUTIVE_NO_SHOWS}>
                          Consecutive no-shows ({PatientStatus.CONSECUTIVE_NO_SHOWS})
                        </option>
                      </Select>
                    </Field>
                  </>
                ) : null}
              </div>
              <Field
                label="Cancellation reason"
                htmlFor="cancellation-reason"
                helpText={
                  cancelAllOpenAppointments
                    ? "The provided reason will be added to the patient's notes and to all canceled appointments."
                    : undefined
                }
                className="my-6"
              >
                <Textarea
                  id="cancellation-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder={
                    cancelAllOpenAppointments
                      ? "Provide the cancellation reason (required)"
                      : "Provide the cancellation reason (optional)"
                  }
                  disabled={isSubmitting}
                />
              </Field>

              <div className={MODAL_FOOTER_CLASS}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToSelection}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Canceling..."
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {action === "postpone" && postponeFeedback ? (
          <div>
            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <div>
                  <span className="mr-1 font-semibold">Patient:</span>
                  {patientName}
                </div>
                <div>
                  <span className="mr-1 font-semibold">Reschedule mode:</span>
                  {postponeFeedback.mode === "next_available"
                    ? "Next available date"
                    : "Specific date"}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-900">
                  Rescheduled appointments ({postponeFeedback.successes.length})
                </h4>
                {postponeFeedback.successes.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                    {postponeFeedback.successes.map((item) => (
                      <li key={`${item.appointmentId}-${item.newDate}`}>
                        {appointmentIdToLabel.get(item.appointmentId) ??
                          `Appointment #${item.appointmentId}`}{" "}
                        - {formatDisplayDate(item.newDate)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    No appointments were rescheduled.
                  </p>
                )}
              </div>

              {postponeFeedback.mode === "next_available" ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Assessment returns auto-rescheduled (
                    {postponeFeedback.autoRescheduledReturns.length})
                  </h4>
                  {postponeFeedback.autoRescheduledReturns.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                      {postponeFeedback.autoRescheduledReturns.map((item) => (
                        <li key={`${item.appointmentId}-${item.newDate}`}>
                          From {formatDisplayDate(item.oldDate)} to{" "}
                          {formatDisplayDate(item.newDate)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No returns needed rescheduling.
                    </p>
                  )}
                </div>
              ) : null}

              {postponeFeedback.failures.length > 0 ? (
                <div className="rounded-md border border-red-300 bg-red-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-red-800">
                    Reschedule failures ({postponeFeedback.failures.length})
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                    {postponeFeedback.failures.map((item) => (
                      <li key={`${item.appointmentId}-${item.error}`}>
                        ID {item.appointmentId}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {postponeFeedback.failedReturnReschedules.length > 0 ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-amber-800">
                    Returns that need manual rescheduling (
                    {postponeFeedback.failedReturnReschedules.length})
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                    {postponeFeedback.failedReturnReschedules.map((item) => (
                      <li key={`${item.appointmentId}-${item.error}`}>
                        ID {item.appointmentId}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={handleAcknowledgePostponeFeedback}>
                OK, got it
              </Button>
            </div>
          </div>
        ) : null}

        {action === "postpone" && !postponeFeedback ? (
          <div className="mb-4">
            <p className="mb-6 text-sm text-gray-600">
              Reschedule appointment for <strong>{patientName || ""}</strong>.
              Choose the rescheduling mode.
            </p>

            {error ? (
              <div className="mb-4 rounded-md border border-red-400 bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleConfirmPostpone}>
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex flex-col gap-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <Radio
                      checked={postponeMode === "next_available"}
                      onChange={() => setPostponeMode("next_available")}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {weekDayLabel
                        ? `Next available ${weekDayLabel.toLowerCase()}`
                        : "Next available date (same day of week)"}
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-600">
                    The return assessment consultation related to this
                    appointment will be automatically rescheduled.
                  </p>
                  {postponeMode === "next_available" ? (
                    <div className="mb-4 ml-6 mt-2">
                      {loadingNextAvailable ? (
                        <p className="text-xs italic text-gray-600">
                          Calculating next dates...
                        </p>
                      ) : (
                        <div className="space-y-3 text-sm">
                          {Array.from(previewGroupedByDate.entries()).map(
                            ([date, items]) => (
                              <div key={date ?? "no-date"}>
                                <p className="mb-1 text-sm font-semibold text-gray-800">
                                  {date != null
                                    ? `${formatDisplayDate(date)}`
                                    : "No available date in 52 weeks:"}
                                </p>
                                <ul className="list-inside list-disc space-y-0.5 text-gray-600">
                                  {items.map(({ id, label }) => (
                                    <li key={id}>{label}</li>
                                  ))}
                                </ul>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <label className="flex cursor-pointer items-center gap-2">
                    <Radio
                      checked={postponeMode === "by_date"}
                      onChange={() => setPostponeMode("by_date")}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      By specific date
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-600">
                    Return assessment consultations are not automatically
                    rescheduled with this option.
                  </p>
                </div>

                {postponeMode === "by_date" ? (
                  <Field
                    label="Select date"
                    htmlFor="reschedule-date"
                    className="mt-3"
                  >
                    <Input
                      id="reschedule-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      disabled={isSubmitting}
                    />
                  </Field>
                ) : null}
              </div>

              <div className={MODAL_FOOTER_CLASS}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToSelection}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (postponeMode === "next_available" &&
                      (loadingNextAvailable ||
                        selectedAppointmentIds.some(
                          (id) => nextAvailableDates[String(id)] == null,
                        )))
                  }
                  isLoading={isSubmitting}
                  loadingText="Rescheduling..."
                >
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
};

export default ManageAppointmentsModal;
