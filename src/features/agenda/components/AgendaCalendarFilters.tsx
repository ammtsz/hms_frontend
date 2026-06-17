"use client";

import React, { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useCommittedDateInput } from "@/hooks/useCommittedDateInput";
import { getTodayClinic } from "@/utils/timezoneDate";
import { AGENDA_DAY_WINDOW_OPTIONS, type AgendaDayWindowDays } from "@/stores";
import { AttendanceStatus } from "@/api/types";
import {
  AGENDA_STATUS_CHECKBOX_LABELS,
  ALL_AGENDA_FILTER_STATUSES,
} from "../utils/agendaFilterConstants";
import { Button, Checkbox, Input, Select } from "@/components/ui";
import AgendaAttendanceStatusIcon, {
  AGENDA_STATUS_LEGEND_ITEMS,
} from "./AgendaAttendanceStatusIcon";

const WINDOW_LABELS: Record<AgendaDayWindowDays, string> = {
  1: "1 dia",
  7: "7 dias",
  15: "15 dias",
  30: "30 dias",
  60: "60 dias",
  90: "90 dias",
};

export interface AgendaCalendarFiltersProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  agendaDayWindowDays: AgendaDayWindowDays;
  setAgendaDayWindowDays: (days: AgendaDayWindowDays) => void;
  agendaStatusFilters: AttendanceStatus[];
  setAgendaStatusFilters: (filters: AttendanceStatus[]) => void;
  patientFilter: string;
  setPatientFilter: (value: string) => void;
  refreshAgenda: () => void;
  isRefreshing: boolean;
  rangeSummaryText: string;
}

const AgendaCalendarFilters: React.FC<AgendaCalendarFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  agendaDayWindowDays,
  setAgendaDayWindowDays,
  agendaStatusFilters,
  setAgendaStatusFilters,
  patientFilter,
  setPatientFilter,
  refreshAgenda,
  isRefreshing,
  rangeSummaryText,
}) => {
  const toggleAgendaStatus = useCallback(
    (status: AttendanceStatus) => {
      if (agendaStatusFilters.includes(status)) {
        setAgendaStatusFilters(agendaStatusFilters.filter((s) => s !== status));
      } else {
        setAgendaStatusFilters([...agendaStatusFilters, status]);
      }
    },
    [agendaStatusFilters, setAgendaStatusFilters],
  );

  const {
    draftValue,
    inputRef,
    commitImmediately,
    handleKeyDown,
    handleBlur,
    handleMouseDown,
    handleDraftChange,
  } = useCommittedDateInput({
    value: selectedDate,
    onCommit: setSelectedDate,
  });

  return (
    <>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="w-full">
            <label
              htmlFor="agenda-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Selecione uma data para filtrar
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="agenda-date"
                ref={inputRef}
                type="date"
                className="flex-1"
                value={draftValue}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onMouseDown={handleMouseDown}
                lang="pt-BR"
              />
              <Button
                variant="outline"
                onClick={() => commitImmediately(getTodayClinic())}
              >
                Hoje
              </Button>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="agenda-day-window"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Período
            </label>
            <Select
              id="agenda-day-window"
              value={agendaDayWindowDays}
              onChange={(e) =>
                setAgendaDayWindowDays(
                  Number(e.target.value) as AgendaDayWindowDays,
                )
              }
            >
              {AGENDA_DAY_WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {WINDOW_LABELS[days]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <span className="lg:block hidden">|</span>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="w-full">
            <label
              htmlFor="agenda-patient-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filtrar por paciente
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="agenda-patient-filter"
                type="text"
                className="flex-1"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                placeholder="Digite o nome do paciente"
                autoComplete="off"
              />
              <Button
                variant="outline"
                onClick={() => setPatientFilter("")}
                disabled={!patientFilter}
              >
                Limpar
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={refreshAgenda}
            disabled={isRefreshing}
            className={`mt-0 flex items-center gap-1.5 md:mt-7 ${
              isRefreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={
              isRefreshing
                ? "Atualizando..."
                : "Atualizar dados dos agendamentos"
            }
          >
            <RefreshCw
              size={16}
              className={`${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-4 w-full">
        <p className="text-xs text-gray-600 mt-4">{rangeSummaryText}</p>

        <fieldset className="border border-gray-200 rounded-lg p-3">
          <legend className="text-sm font-medium text-gray-800 px-1">
            Status do atendimento
          </legend>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] px-3 py-2 text-xs sm:min-h-[32px] sm:px-2 sm:py-1"
              onClick={() =>
                setAgendaStatusFilters([...ALL_AGENDA_FILTER_STATUSES])
              }
              aria-label="Selecionar todos os status do atendimento"
            >
              Selecionar todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] px-3 py-2 text-xs sm:min-h-[32px] sm:px-2 sm:py-1"
              onClick={() => setAgendaStatusFilters([])}
              aria-label="Limpar seleção de status do atendimento"
            >
              Limpar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ALL_AGENDA_FILTER_STATUSES.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <Checkbox
                  checked={agendaStatusFilters.includes(status)}
                  onChange={() => toggleAgendaStatus(status)}
                />
                <span>{AGENDA_STATUS_CHECKBOX_LABELS[status]}</span>
              </label>
            ))}
          </div>
          {agendaStatusFilters.length === 0 ? (
            <p className="text-xs text-amber-800 mt-3 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
              Nenhum status selecionado: exibindo todos os status no período.
            </p>
          ) : null}
        </fieldset>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3"
          aria-label="Legenda de status"
        >
          <span className="font-medium text-gray-700">Legenda:</span>
          {AGENDA_STATUS_LEGEND_ITEMS.map(({ status, label }) => (
            <span key={status} className="inline-flex items-center gap-1">
              <AgendaAttendanceStatusIcon status={status} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default AgendaCalendarFilters;
