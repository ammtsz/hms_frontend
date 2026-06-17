"use client";

import React from "react";
import { Calendar, Plus, Edit2, Trash2, CalendarDays } from "lucide-react";
import { Holiday } from "@/types/holiday";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { groupHolidaysByPeriod, HolidayGroup } from "@/utils/holidayGrouping";
import { HolidayListCard } from "./HolidayListCard";
import { Button, IconButton } from "@/components/ui";

interface HolidayListProps {
  holidays: Holiday[] | undefined;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
  onCreateClick: () => void;
}

const HolidayList: React.FC<HolidayListProps> = ({
  holidays,
  onEdit,
  onDelete,
  onCreateClick,
}) => {
  const { formatDateToDDMMYYYY } = useDateHelpers();

  // Group holidays by periods
  const holidayGroups = holidays ? groupHolidaysByPeriod(holidays) : [];

  if (!holidays || holidays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum feriado cadastrado
        </h3>
        <p className="text-gray-600 mb-6">
          Adicione feriados para bloquear datas no calendário
        </p>
        <Button
          type="button"
          onClick={onCreateClick}
          className="bg-blue-800 hover:bg-blue-900"
        >
          <Plus className="w-5 h-5" />
          Adicionar Primeiro Feriado
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden" data-testid="holiday-list-cards">
        {holidayGroups.map((group) => (
          <HolidayListCard
            key={group.groupId || `individual_${group.holidays[0].id}`}
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div
        className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block"
        data-testid="holiday-list-table"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data(s)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folga
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holidayGroups.map((group) => (
              <HolidayGroupRow
                key={group.groupId || `individual_${group.holidays[0].id}`}
                group={group}
                onEdit={onEdit}
                onDelete={onDelete}
                formatDate={formatDateToDDMMYYYY}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/**
 * Component to render a single holiday group (individual holiday or period)
 */
interface HolidayGroupRowProps {
  group: HolidayGroup;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
  formatDate: (date: string) => string;
}

// Treatment types mapping
const TREATMENT_TYPE_LABELS = {
  assessment: "Consulta de Avaliação",
  physiotherapy: "Fisioterapia",
  tens: "TENS",
} as const;

const HolidayGroupRow: React.FC<HolidayGroupRowProps> = ({
  group,
  onEdit,
  onDelete,
}) => {
  // Get blocked treatment types for display
  const getBlockedTreatmentTypes = () => {
    const blockedTypes = group.holidays[0].blockedTreatmentTypes;

    if (!blockedTypes || blockedTypes.length === 0) {
      return "Consulta de Avaliação, Fisioterapia, TENS";
    }

    return blockedTypes
      .map(
        (type) =>
          TREATMENT_TYPE_LABELS[type as keyof typeof TREATMENT_TYPE_LABELS] ||
          type,
      )
      .join(", ");
  };
  // For period holidays, we'll edit the first holiday (could be improved to edit all)
  const handleEdit = () => {
    onEdit(group.holidays[0]);
  };

  // For period holidays, show confirmation to delete all related holidays
  const handleDelete = () => {
    if (group.isPeriod) {
      // For now, delete the first holiday - in a real app you'd want to delete all related holidays
      // This could be improved by adding a bulk delete API
      onDelete(group.holidays[0]);
    } else {
      onDelete(group.holidays[0]);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {group.dateRange}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-44">
          {group.displayName}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600 max-w-56">
          {group.description || "-"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {group.isPeriod ? (
            <>
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">
                {group.holidays.length} dias
              </span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">1 dia</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-44">
          {getBlockedTreatmentTypes()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <IconButton
          onClick={handleEdit}
          tone="primary"
          className="mr-4"
          title={group.isPeriod ? "Editar período" : "Editar"}
          aria-label={group.isPeriod ? "Editar período" : "Editar"}
        >
          <Edit2 className="w-4 h-4" />
        </IconButton>
        <IconButton
          onClick={handleDelete}
          tone="danger"
          title={group.isPeriod ? "Excluir período" : "Excluir"}
          aria-label={group.isPeriod ? "Excluir período" : "Excluir"}
        >
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </td>
    </tr>
  );
};

export default HolidayList;
