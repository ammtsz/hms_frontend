"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Priority } from "@/types/types";
import { useAppointmentForm } from "./hooks/useAppointmentForm";
import Switch from "@/components/ui/Switch";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { ParentAppointmentSelector } from "@/features/board/components/WalkIn/components/ParentAppointmentSelector";
import { getTodayClinic } from "@/utils/timezoneDate";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

interface NewAppointmentFormProps {
  onRegisterNewAppointment?: (
    name: string,
    selectedTypes: string[],
    isNewPatient: boolean,
    priority: Priority,
    nextAvailableDate?: string,
  ) => void;
  showDateField?: boolean;
  validationDate?: string;
  onFormSuccess?: () => void;
  onCancel?: () => void;
}

const NewAppointmentForm: React.FC<NewAppointmentFormProps> = ({
  onRegisterNewAppointment,
  showDateField = true,
  validationDate,
  onFormSuccess,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    validationDate || getTodayClinic(),
  );
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const {
    // Form state
    search,
    setSearch,
    setSelectedPatient,
    isNewPatient,
    setIsNewPatient,
    selectedTypes,
    priority,
    setPriority,
    notes,
    setNotes,
    selectedParentAppointment,
    setSelectedParentAppointment,

    // Data
    filteredPatients,
    parentAppointmentOptions,
    loadingParentOptions,
    patientStatus,
    dateSlotError,

    // Actions
    handleRegisterNewAppointment,
    fetchParentAppointmentOptions,

    // Status
    isSubmitting,
    error,
    success,
  } = useAppointmentForm({
    onRegisterNewAppointment,
    onFormSuccess,
    defaultNotes: "",
    validationDate,
    selectedDate,
    showDateField,
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { sortedPriorities, isLoading: prioritiesLoading } =
    useSelectablePrioritiesForForm({
      enabled: isNewPatient,
      currentPriority: priority,
      onInvalidPriority: setPriority,
    });

  const handlePatientSelect = (patientName: string) => {
    const patient = filteredPatients.find((p) => p.name === patientName);
    setSelectedPatient(patientName);
    setSearch(patientName); // Update the search field to show the selected patient
    setShowSuggestions(false);
    setSelectedParentAppointment(""); // Reset parent selection when patient changes

    if (patient?.id) {
      setSelectedPatientId(patient.id);
      fetchParentAppointmentOptions(patient.id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedPatient(""); // Clear selected patient when user types
    setShowSuggestions(true);
  };

  const handleNewPatientToggle = (checked: boolean) => {
    setIsNewPatient(checked);
    setShowSuggestions(false);
    setSelectedParentAppointment(""); // Clear parent selection when toggling
    setSelectedPatientId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleRegisterNewAppointment(e, selectedDate);
    if (success) {
      // Form is automatically reset by the hook
      // Reset local state
      setSelectedDate(validationDate || getTodayClinic());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorDisplay error={error} />

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Patient Selection */}
      <div className="space-y-2">
        <Field label="Patient Name">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={handleInputChange}
              className="pr-10"
              placeholder="Enter patient name..."
              disabled={isSubmitting}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            {/* Patient suggestions dropdown */}
            {search &&
              !isNewPatient &&
              showSuggestions &&
              filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <Button
                      key={patient.id}
                      type="button"
                      variant="ghost"
                      onClick={() => handlePatientSelect(patient.name)}
                      className="w-full justify-start rounded-none font-normal"
                      disabled={isSubmitting}
                    >
                      <div className="font-normal mr-auto">{patient.name}</div>
                    </Button>
                  ))}
                </div>
              )}
          </div>
        </Field>

        {/* New patient toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="new-patient"
            checked={isNewPatient}
            onChange={handleNewPatientToggle}
            disabled={isSubmitting}
            label="New patient"
            labelPosition="right"
            size="sm"
          />
        </div>

        {/* Parent Appointment Selector - only for existing patients */}
        {!isNewPatient && selectedPatientId && (
          <ParentAppointmentSelector
            selectedParentAppointment={selectedParentAppointment}
            parentAppointmentOptions={parentAppointmentOptions}
            loadingParentOptions={loadingParentOptions}
            isSubmitting={isSubmitting}
            patientStatus={patientStatus}
            onParentAppointmentChange={(value) =>
              setSelectedParentAppointment(value)
            }
          />
        )}

        {/* Priority Selection - only for new patients */}
        {isNewPatient && (
          <div className="my-6">
            <Field label="Priority">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                disabled={isSubmitting || prioritiesLoading}
              >
                {sortedPriorities.length === 0 ? (
                  <option value={priority}>{priority}</option>
                ) : (
                  sortedPriorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value} - {p.label || p.value}
                    </option>
                  ))
                )}
              </Select>
            </Field>
          </div>
        )}
      </div>

      {/* Date Selection (if enabled) */}
      {showDateField && (
        <div className="my-6">
          <Field label="Appointment Date" error={dateSlotError}>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              invalid={Boolean(dateSlotError)}
              disabled={isSubmitting}
              min={getTodayClinic()}
            />
          </Field>
        </div>
      )}

      {/* Notes */}
      <Field label="Reason for appointment (optional)">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Appointment notes..."
          disabled={isSubmitting}
        />
      </Field>

      {/* Submit Button */}
      <div
        className={onCancel ? "flex flex-col-reverse gap-3 sm:flex-row" : ""}
      >
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Scheduling..."
          className={onCancel ? "flex-1" : "w-full"}
          disabled={
            isSubmitting ||
            !search.trim() ||
            selectedTypes.length === 0 ||
            !!dateSlotError
          }
        >
          Schedule Appointment
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default NewAppointmentForm;
