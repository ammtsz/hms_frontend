import React, { useState } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { HolidayTemplate } from "@/types/holidayTemplate";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, Input } from "@/components/ui";

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (year: number) => void;
  template: HolidayTemplate | null;
  isLoading?: boolean;
}

const MODAL_FOOTER_CLASS =
  "flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end";

export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  isOpen,
  onClose,
  onApply,
  template,
  isLoading = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(year);
  };

  if (!template) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Template"
      maxWidth="lg"
      showCloseButton={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            {template.description ? (
              <p className="mt-1 text-sm text-gray-600">
                {template.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            This template contains <strong>{template.holidays.length}</strong>{" "}
            holiday
            {template.holidays.length !== 1 ? "s" : ""}. They will be created
            for the year selected below.
          </p>
        </div>

        <Field
          label="Select Year *"
          helpText={`Allowed years: ${currentYear - 2} to ${currentYear + 5}`}
        >
          <Input
            type="number"
            min={currentYear - 2}
            max={currentYear + 5}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            required
          />
        </Field>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            <strong>Warning:</strong> Invalid dates (like February 31) will be
            ignored automatically. Holidays on dates that already exist will not
            be duplicated.
          </p>
        </div>

        <div className={MODAL_FOOTER_CLASS}>
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
            isLoading={isLoading}
            loadingText="Applying..."
            disabled={isLoading}
          >
            Apply Template
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};
