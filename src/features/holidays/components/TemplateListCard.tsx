"use client";

import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import { HolidayTemplate } from "@/types/holidayTemplate";
import { Button, IconButton } from "@/components/ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface TemplateListCardProps {
  template: HolidayTemplate;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: (template: HolidayTemplate) => void;
  onDelete: (id: number) => void;
  onApply: (template: HolidayTemplate) => void;
}

export function TemplateListCard({
  template,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onApply,
}: TemplateListCardProps) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white overflow-hidden"
      data-testid={`template-card-${template.id}`}
    >
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleExpanded}
            className="h-auto min-h-[44px] w-full justify-start gap-2 p-0 text-left hover:bg-transparent sm:min-h-0 sm:flex-1"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className="min-w-0 break-words font-medium text-gray-900">
              {template.name}
            </span>
          </Button>
          <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
            <IconButton
              onClick={() => onApply(template)}
              tone="success"
              title="Apply template"
              aria-label="Apply template"
            >
              <Calendar className="h-4 w-4" />
            </IconButton>
            <IconButton
              onClick={() => onEdit(template)}
              tone="primary"
              title="Edit template"
              aria-label="Edit template"
            >
              <Edit className="h-4 w-4" />
            </IconButton>
            <IconButton
              onClick={() => onDelete(template.id)}
              tone="danger"
              title="Delete template"
              aria-label="Delete template"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        {template.description ? (
          <p className="mt-2 break-words text-sm text-gray-600">
            {template.description}
          </p>
        ) : null}

        <p className="mt-2 text-sm text-gray-600">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {template.holidays.length} holiday
            {template.holidays.length !== 1 ? "s" : ""}
          </span>
        </p>
      </div>

      {isExpanded ? (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">
            Holidays in this template:
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...template.holidays]
              .sort((a, b) => {
                if (a.month !== b.month) return a.month - b.month;
                return a.day - b.day;
              })
              .map((holiday, index) => (
                <div
                  key={`${holiday.month}-${holiday.day}-${index}`}
                  className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3"
                >
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {String(holiday.day).padStart(2, "0")}/
                      {String(holiday.month).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {MONTHS[holiday.month - 1]?.substring(0, 3)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {holiday.name}
                    </div>
                    {holiday.description ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {holiday.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
