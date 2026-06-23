"use client";

import React from "react";
import { Priority } from "@/types/types";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { usePatientWalkInForm } from "./hooks/usePatientWalkInForm";
import { PatientSelector } from "./components/PatientSelector";
import { ParentAttendanceSelector } from "./components/ParentAttendanceSelector";
import { NewPatientFields } from "./components/NewPatientFields";
import { Button, Card } from "@/components/ui";

interface PatientWalkInFormProps {
  onRegisterNewAttendance?: (
    patientName: string,
    types: string[],
    isNew: boolean,
    priority: Priority,
  ) => void;
  isDropdown?: boolean;
}

const PatientWalkInForm: React.FC<PatientWalkInFormProps> = ({
  onRegisterNewAttendance,
  isDropdown = false,
}) => {
  const {
    formData,
    setFormData,
    showDropdown,
    setShowDropdown,
    isSubmitting,
    error,
    setError,
    success,
    parentAttendanceOptions,
    loadingParentOptions,
    patientStatus,
    filteredPatients,
    prioritiesLoading,
    fetchParentAttendanceOptions,
    handleSubmit,
  } = usePatientWalkInForm({ onRegisterNewAttendance });

  const handleNewPatientToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isNewPatient: checked,
      selectedPatient: "",
      phone: "",
      birthDate: "",
      selectedParentAttendance: "",
    }));
    setShowDropdown(false);
    setError(null);
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value, selectedPatient: "" }));
    setShowDropdown(true);
    setError(null);
  };

  const handlePatientSelect = (patientName: string) => {
    const selected = filteredPatients.find((p) => p.name === patientName);
    setFormData((prev) => ({
      ...prev,
      name: patientName,
      selectedPatient: patientName,
      priority: selected?.priority || "3",
      selectedParentAttendance: "",
    }));
    setShowDropdown(false);
    setError(null);

    if (selected?.id) {
      fetchParentAttendanceOptions(selected.id);
    }
  };

  const content = (
    <>
      <ErrorDisplay error={error} />

      {success && (
        <div
          className={`${
            isDropdown ? "mx-0 mt-0" : "mx-4 mt-4"
          } p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm`}
        >
          {success}
        </div>
      )}

      <form className="p-4" onSubmit={handleSubmit} autoComplete="off">
        <PatientSelector
          isNewPatient={formData.isNewPatient}
          name={formData.name}
          showDropdown={showDropdown}
          filteredPatients={filteredPatients}
          isSubmitting={isSubmitting}
          onNewPatientToggle={handleNewPatientToggle}
          onNameChange={handleNameChange}
          onPatientSelect={handlePatientSelect}
          onFocus={() => setShowDropdown(true)}
          setShowDropdown={setShowDropdown}
        />

        {!formData.isNewPatient && formData.selectedPatient && (
          <ParentAttendanceSelector
            selectedParentAttendance={formData.selectedParentAttendance}
            parentAttendanceOptions={parentAttendanceOptions}
            loadingParentOptions={loadingParentOptions}
            isSubmitting={isSubmitting}
            patientStatus={patientStatus}
            onParentAttendanceChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                selectedParentAttendance: value,
              }))
            }
          />
        )}

        {formData.isNewPatient && (
          <NewPatientFields
            phone={formData.phone}
            birthDate={formData.birthDate}
            priority={formData.priority}
            isSubmitting={isSubmitting}
            onPhoneChange={(value) =>
              setFormData((prev) => ({ ...prev, phone: value }))
            }
            onBirthDateChange={(date) =>
              setFormData((prev) => ({ ...prev, birthDate: date }))
            }
            onPriorityChange={(value) =>
              setFormData((prev) => ({ ...prev, priority: value }))
            }
          />
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            Attendance Type
          </h3>
          <p className="text-sm text-gray-700">Assessment Consultation</p>
          <p className="text-xs text-gray-500 mt-1">
            Other appointment types (Physiotherapy, TENS) are created
            automatically after the assessment consultation.
          </p>
        </div>

        <div className="w-full">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Processing..."
            className="mt-6 w-full"
            disabled={
              isSubmitting ||
              (prioritiesLoading && formData.isNewPatient) ||
              !formData.name.trim() ||
              (formData.isNewPatient && !formData.birthDate)
            }
          >
            Check In
          </Button>
        </div>
      </form>
    </>
  );

  return isDropdown ? (
    <div data-testid="patient-walk-in-form">{content}</div>
  ) : (
    <Card data-testid="patient-walk-in-form">{content}</Card>
  );
};

export default PatientWalkInForm;
