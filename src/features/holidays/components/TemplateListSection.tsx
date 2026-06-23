import React, { useState } from "react";
import {
  FileText,
  Edit,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { HolidayTemplate } from "@/types/holidayTemplate";
import { TemplateListCard } from "./TemplateListCard";
import { Button, IconButton } from "@/components/ui";

interface TemplateListSectionProps {
  templates: HolidayTemplate[];
  onEdit: (template: HolidayTemplate) => void;
  onDelete: (id: number) => void;
  onApply: (template: HolidayTemplate) => void;
  isLoading?: boolean;
}

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

export const TemplateListSection: React.FC<TemplateListSectionProps> = ({
  templates,
  onEdit,
  onDelete,
  onApply,
  isLoading = false,
}) => {
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(
    null,
  );

  const toggleExpanded = (templateId: number) => {
    setExpandedTemplateId(
      expandedTemplateId === templateId ? null : templateId,
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Loading templates...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="mb-1 text-gray-500">No templates created</p>
        <p className="text-sm text-gray-400">
          Click &ldquo;New Template&rdquo; to create your first holiday template
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden" data-testid="template-list-cards">
        {templates.map((template) => (
          <TemplateListCard
            key={template.id}
            template={template}
            isExpanded={expandedTemplateId === template.id}
            onToggleExpanded={() => toggleExpanded(template.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onApply={onApply}
          />
        ))}
      </div>

      <div
        className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block"
        data-testid="template-list-table"
      >
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Holidays
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map((template) => (
              <React.Fragment key={template.id}>
                <tr className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(template.id)}
                      className="group h-auto min-h-0 w-full justify-start p-0 text-left hover:bg-transparent"
                    >
                      {expandedTemplateId === template.id ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                        {template.name}
                      </span>
                    </Button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {template.description || (
                        <span className="italic text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {template.holidays.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
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
                  </td>
                </tr>

                {expandedTemplateId === template.id ? (
                  <tr>
                    <td colSpan={4} className="bg-gray-50 px-6 py-4">
                      <div className="pl-6">
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          Holidays in this template:
                        </h4>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {[...template.holidays]
                            .sort((a, b) => {
                              if (a.month !== b.month) return a.month - b.month;
                              return a.day - b.day;
                            })
                            .map((holiday, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3"
                              >
                                <div className="w-16 flex-shrink-0 text-center">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {String(holiday.month).padStart(2, "0")}/
                                    {String(holiday.day).padStart(2, "0")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {MONTHS[holiday.month - 1].substring(0, 3)}
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
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
