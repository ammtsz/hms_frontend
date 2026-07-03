import React from "react";
import { Priority } from "@/types/types";
import { formatPhoneNumber } from "@/utils/formUtils";
import { formatDateForInput } from "@/utils/timezoneDate";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";
import { Field, FormDateInput, Input, Select } from "@/components/ui";

interface NewPatientFieldsProps {
  phone: string;
  birthDate: string;
  priority: Priority;
  isSubmitting: boolean;
  onPhoneChange: (value: string) => void;
  onBirthDateChange: (date: string) => void;
  onPriorityChange: (value: Priority) => void;
}

export const NewPatientFields: React.FC<NewPatientFieldsProps> = ({
  phone,
  birthDate,
  priority,
  isSubmitting,
  onPhoneChange,
  onBirthDateChange,
  onPriorityChange,
}) => {
  const { sortedPriorities: activePriorities, isLoading: prioritiesLoading } =
    useSelectablePrioritiesForForm({
      enabled: true,
      currentPriority: priority,
      onInvalidPriority: onPriorityChange,
    });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-sm font-medium text-blue-800 mb-3">
        New Patient Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Phone *" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            disabled={isSubmitting}
            placeholder="(XXX) XXX-XXXX"
            required
          />
        </Field>

        <Field label="Date of Birth *" htmlFor="birthDate">
          <FormDateInput
            id="birthDate"
            name="birthDate"
            value={formatDateForInput(birthDate)}
            onValueChange={onBirthDateChange}
            disabled={isSubmitting}
            required
          />
        </Field>

        <Field label="Priority" htmlFor="priority" className="md:col-span-2">
          <Select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as Priority)}
            disabled={isSubmitting || prioritiesLoading}
          >
            {activePriorities.length === 0 ? (
              <option value={priority}>{priority}</option>
            ) : (
              activePriorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value} - {p.label || p.value}
                </option>
              ))
            )}
          </Select>
        </Field>
      </div>
    </div>
  );
};
