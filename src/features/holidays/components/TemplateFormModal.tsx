import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { HolidayTemplate, HolidayTemplateItem } from "@/types/holidayTemplate";
import BaseModal from "@/components/common/BaseModal";
import {
  Button,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    holidays: HolidayTemplateItem[];
  }) => void;
  template?: HolidayTemplate | null;
  isLoading?: boolean;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [holidays, setHolidays] = useState<HolidayTemplateItem[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setHolidays(template.holidays);
    } else {
      setName("");
      setDescription("");
      setHolidays([]);
    }
  }, [template]);

  const handleAddHoliday = () => {
    setHolidays([...holidays, { month: 1, day: 1, name: "", description: "" }]);
  };

  const handleRemoveHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  const handleHolidayChange = (
    index: number,
    field: keyof HolidayTemplateItem,
    value: string | number,
  ) => {
    const updated = [...holidays];
    updated[index] = { ...updated[index], [field]: value };
    setHolidays(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      holidays: holidays.filter((h) => h.name.trim() !== ""),
    });
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? "Edit Template" : "New Template"}
      maxWidth="3xl"
      preventOverflow
      showCloseButton={!isLoading}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 overflow-y-auto p-4 sm:p-6"
      >
        <Field label="Template Name *">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. National Brazilian Holidays"
            required
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional template description"
            rows={2}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Holidays *
            </label>
            <Button type="button" size="sm" onClick={handleAddHoliday}>
              <Plus className="w-4 h-4" />
              Add Holiday
            </Button>
          </div>

          {holidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
              No holidays added. Click in &ldquo;Add holiday&rdquo; to get
              started.
            </div>
          ) : (
            <div className="space-y-3">
              {holidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start p-4 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Month
                      </label>
                      <Select
                        value={holiday.month}
                        onChange={(e) =>
                          handleHolidayChange(
                            index,
                            "month",
                            Number(e.target.value),
                          )
                        }
                        className="min-h-10 px-2 py-1.5 text-sm"
                      >
                        {MONTHS.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Day
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={holiday.day}
                        onChange={(e) =>
                          handleHolidayChange(
                            index,
                            "day",
                            Number(e.target.value),
                          )
                        }
                        className="min-h-10 px-2 py-1.5 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Name *
                      </label>
                      <Input
                        type="text"
                        value={holiday.name}
                        onChange={(e) =>
                          handleHolidayChange(index, "name", e.target.value)
                        }
                        className="min-h-10 px-2 py-1.5 text-sm"
                        placeholder="e.g. Christmas"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={holiday.description || ""}
                        onChange={(e) =>
                          handleHolidayChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="min-h-10 px-2 py-1.5 text-sm"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>

                  <IconButton
                    type="button"
                    tone="danger"
                    onClick={() => handleRemoveHoliday(index)}
                    className="mt-6"
                    title="Remove holiday"
                    aria-label="Remove holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !name.trim() || holidays.length === 0}
            isLoading={isLoading}
            loadingText="Saving..."
          >
            {template ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
