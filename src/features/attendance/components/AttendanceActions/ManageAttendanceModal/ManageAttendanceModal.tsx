import React, { useMemo } from "react";
import { useManageAttendanceModal } from "./hooks/useManageAttendanceModal";
import { getMinDate } from "@/utils/dateUtils";
import { formatDateBR } from "@/utils/dateUtils";
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
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const MODAL_FOOTER_CLASS =
  "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end";

function getWeekdayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAYS[d.getDay()] ?? "";
}

interface ManageAttendanceModalProps {
  onRefresh?: () => void;
}

/**
 * Manage Attendance Modal - Allows user to cancel or reschedule attendances
 * Used on both the attendance board page and the agenda page
 */
export const ManageAttendanceModal: React.FC<ManageAttendanceModalProps> = ({
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
      selectedAttendanceIds,
      selectedDate,
      postponeMode,
      reason,
      cancelAllOpenAttendances,
      cancelAllNewStatus,
      nextAvailableDates,
      loadingNextAvailable,
      attendanceDate,
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
      setCancelAllOpenAttendances,
      setCancelAllNewStatus,
      handleConfirmCancellation,
      handleConfirmPostpone,
      handleAcknowledgePostponeFeedback,
    },
  } = useManageAttendanceModal(onRefresh);

  const attendanceIdToLabel = useMemo(() => {
    const map = new Map<number, string>();
    treatmentsWithSessionRows?.forEach((row) => {
      if (!row.sessionRow.attendanceId) return;
      const type =
        row.treatment.treatmentType === "physiotherapy"
          ? "Fisioterapia"
          : "TENS";
      const loc = row.treatment.bodyLocation ?? "";
      const color = row.treatment.color ? `, ${row.treatment.color}` : "";
      map.set(row.sessionRow.attendanceId, `${type} (${loc}${color})`);
    });
    return map;
  }, [treatmentsWithSessionRows]);

  const previewGroupedByDate = useMemo(() => {
    const byDate = new Map<
      string | null,
      Array<{ id: number; label: string }>
    >();
    selectedAttendanceIds.forEach((id) => {
      const date = nextAvailableDates[String(id)] ?? null;
      const list = byDate.get(date) ?? [];
      const label = attendanceIdToLabel.get(id) ?? "Consulta de Avaliação";
      list.push({ id, label });
      byDate.set(date, list);
    });
    return byDate;
  }, [selectedAttendanceIds, nextAvailableDates, attendanceIdToLabel]);

  const weekDayLabel = attendanceDate ? getWeekdayLabel(attendanceDate) : "";
  const selectedCount = selectedAttendanceIds.length;

  const isAssessmentSelection =
    !action &&
    !loadingSessions &&
    treatmentsWithSessionRows.length === 0 &&
    selectedCount > 0;

  const modalTitle = !action
    ? "Gerenciar Agendamento"
    : action === "cancel"
      ? "Cancelar Agendamento"
      : postponeFeedback
        ? "Resumo do Reagendamento"
        : "Reagendar Atendimento";

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
                Paciente: <strong>{patientName || ""}</strong>
              </p>
            ) : (
              <p className="mb-6 text-sm text-gray-600">
                Selecione os atendimentos de{" "}
                <strong>{patientName || ""}</strong> que você deseja gerenciar.
              </p>
            )}

            {loadingSessions ? (
              <div className="text-sm italic text-gray-600">
                Carregando sessões...
              </div>
            ) : treatmentsWithSessionRows &&
              treatmentsWithSessionRows.length > 0 ? (
              <div className="mb-6 max-h-[650px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {treatmentsWithSessionRows.map((row) => {
                  if (!row.sessionRow.attendanceId) return null;
                  const isSelected = selectedAttendanceIds.includes(
                    row.sessionRow.attendanceId,
                  );
                  return (
                    <label
                      key={row.sessionRow.id}
                      className="flex cursor-pointer items-start gap-3 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() =>
                          toggleSelection(row.sessionRow.attendanceId!)
                        }
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {row.treatment.treatmentType === "physiotherapy"
                            ? "Fisioterapia"
                            : "TENS"}
                          : {row.treatment.bodyLocation}
                          {row.treatment.color &&
                            ` (cor: ${row.treatment.color})`}
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
                    Nenhuma sessão encontrada.
                  </p>
                )}
              </div>
            )}

            <p className="mb-6 text-md font-semibold text-gray-600">
              O que você deseja fazer com{" "}
              {selectedCount > 1 ? "estes agendamentos" : "este agendamento"}?
            </p>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction("postpone")}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Reagendar ({selectedCount})
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction("cancel")}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Cancelar Atendimento ({selectedCount})
              </Button>
            </div>
          </div>
        ) : null}

        {action === "cancel" ? (
          <div className="mb-4">
            <p className="mb-4 text-sm text-gray-600">
              Você está prestes a cancelar o agendamento de{" "}
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
                  <legend className="sr-only">
                    Escolha o escopo do cancelamento
                  </legend>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Radio
                      name="cancel-scope"
                      checked={!cancelAllOpenAttendances}
                      onChange={() => setCancelAllOpenAttendances(false)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cancelar apenas este atendimento
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Radio
                      name="cancel-scope"
                      checked={cancelAllOpenAttendances}
                      onChange={() => setCancelAllOpenAttendances(true)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cancelar todos os atendimentos em aberto deste paciente
                      (inclusive em outras datas)
                    </span>
                  </label>
                </fieldset>

                {cancelAllOpenAttendances ? (
                  <>
                    <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      Todos os atendimentos em aberto deste paciente serão
                      cancelados e o status do paciente deixará de ser
                      <strong> &quot;Em tratamento&quot;</strong>.
                    </div>

                    <Field
                      label="Alteração de status para:"
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
                              | PatientStatus.ABSENT,
                          )
                        }
                        disabled={isSubmitting}
                      >
                        <option value={PatientStatus.DISCHARGED}>
                          Alta do tratamento ({PatientStatus.DISCHARGED})
                        </option>
                        <option value={PatientStatus.ABSENT}>
                          Faltas consecutivas ({PatientStatus.ABSENT})
                        </option>
                      </Select>
                    </Field>
                  </>
                ) : null}
              </div>
              <Field
                label="Motivo do cancelamento"
                htmlFor="cancellation-reason"
                helpText={
                  cancelAllOpenAttendances
                    ? "O motivo informado será adicionado às notas do paciente e a todos os atendimentos cancelados."
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
                    cancelAllOpenAttendances
                      ? "Informe o motivo do cancelamento (obrigatório)"
                      : "Informe o motivo do cancelamento (opcional)"
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
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Cancelando..."
                >
                  Confirmar Cancelamento
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
                  <span className="mr-1 font-semibold">Paciente:</span>
                  {patientName}
                </div>
                <div>
                  <span className="mr-1 font-semibold">
                    Modo de reagendamento:
                  </span>
                  {postponeFeedback.mode === "next_available"
                    ? "Próxima data disponível"
                    : "Data específica"}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-900">
                  Atendimentos reagendados ({postponeFeedback.successes.length})
                </h4>
                {postponeFeedback.successes.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                    {postponeFeedback.successes.map((item) => (
                      <li key={`${item.attendanceId}-${item.newDate}`}>
                        {attendanceIdToLabel.get(item.attendanceId) ??
                          `Atendimento #${item.attendanceId}`}{" "}
                        - {formatDateBR(item.newDate)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Nenhum atendimento reagendado.
                  </p>
                )}
              </div>

              {postponeFeedback.mode === "next_available" ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    Retornos de avaliação reagendados automaticamente (
                    {postponeFeedback.autoRescheduledReturns.length})
                  </h4>
                  {postponeFeedback.autoRescheduledReturns.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                      {postponeFeedback.autoRescheduledReturns.map((item) => (
                        <li key={`${item.attendanceId}-${item.newDate}`}>
                          De {formatDateBR(item.oldDate)} para{" "}
                          {formatDateBR(item.newDate)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Nenhum retorno precisou ser reagendado.
                    </p>
                  )}
                </div>
              ) : null}

              {postponeFeedback.failures.length > 0 ? (
                <div className="rounded-md border border-red-300 bg-red-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-red-800">
                    Falhas no reagendamento ({postponeFeedback.failures.length})
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                    {postponeFeedback.failures.map((item) => (
                      <li key={`${item.attendanceId}-${item.error}`}>
                        ID {item.attendanceId}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {postponeFeedback.failedReturnReschedules.length > 0 ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-amber-800">
                    Retornos de avaliação para reagendar manualmente (
                    {postponeFeedback.failedReturnReschedules.length})
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                    {postponeFeedback.failedReturnReschedules.map((item) => (
                      <li key={`${item.attendanceId}-${item.error}`}>
                        ID {item.attendanceId}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={handleAcknowledgePostponeFeedback}>
                OK, entendi
              </Button>
            </div>
          </div>
        ) : null}

        {action === "postpone" && !postponeFeedback ? (
          <div className="mb-4">
            <p className="mb-6 text-sm text-gray-600">
              Reagendar o atendimento de <strong>{patientName || ""}</strong>.
              Escolha a forma de reagendamento.
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
                        ? `Próxima ${weekDayLabel.toLowerCase()} disponível`
                        : "Próxima data disponível (mesmo dia da semana)"}
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-600">
                    A consulta de avaliação de retorno relacionada a este
                    atendimento será reagendada automaticamente.
                  </p>
                  {postponeMode === "next_available" ? (
                    <div className="mb-4 ml-6 mt-2">
                      {loadingNextAvailable ? (
                        <p className="text-xs italic text-gray-600">
                          Calculando próximas datas...
                        </p>
                      ) : (
                        <div className="space-y-3 text-sm">
                          {Array.from(previewGroupedByDate.entries()).map(
                            ([date, items]) => (
                              <div key={date ?? "no-date"}>
                                <p className="mb-1 text-sm font-semibold text-gray-800">
                                  {date != null
                                    ? `${formatDateBR(date)}`
                                    : "Sem data disponível em 52 semanas:"}
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
                      Por data específica
                    </span>
                  </label>
                  <p className="ml-6 text-xs text-gray-600">
                    Consultas de Avaliação de retorno <strong> não</strong> são
                    reagendadas automaticamente nesta opção.
                  </p>
                </div>

                {postponeMode === "by_date" ? (
                  <Field
                    label="Selecionar data"
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
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (postponeMode === "next_available" &&
                      (loadingNextAvailable ||
                        selectedAttendanceIds.some(
                          (id) => nextAvailableDates[String(id)] == null,
                        )))
                  }
                  isLoading={isSubmitting}
                  loadingText="Reagendando..."
                >
                  Confirmar Reagendamento
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
};

export default ManageAttendanceModal;
