"use client";

import React, { useState } from "react";
import { Patient, Priority } from "@/types/types";
import { AppointmentType } from "@/api/types";
import {
  useCreateAppointment,
  useCheckInAppointment,
} from "@/api/query/hooks/useAppointmentQueries";
import { useUpdatePatient } from "@/api/query/hooks/usePatientQueries";

import { transformPriorityToApi } from "@/utils/apiTransformers";
import { PatientStatus } from "@/api/types";
import { formatPhoneNumber } from "@/utils/formUtils";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { formatDateForInput, getTodayClinic } from "@/utils/timezoneDate";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";
import { Button, Field, FormDateInput, Input, Select } from "@/components/ui";

interface NewPatientCheckInFormProps {
  patient: Patient;
  appointmentId?: number;
  onSuccess: (updatedPatient: Patient) => void;
  onCancel: () => void;
}

type NewPatientCheckInFormData = {
  name: string;
  phone: string;
  birthDate: string;
  priority: Priority;
};

const NewPatientCheckInForm: React.FC<NewPatientCheckInFormProps> = ({
  patient,
  appointmentId,
  onSuccess,
  onCancel,
}) => {
  const createAppointmentMutation = useCreateAppointment();
  const checkInAppointmentMutation = useCheckInAppointment();
  const updatePatientMutation = useUpdatePatient();

  // Form state for patient information
  const [formData, setFormData] = useState<NewPatientCheckInFormData>({
    name: patient.name || "",
    phone: patient.phone || "",
    birthDate: patient.birthDate ? formatDateForInput(patient.birthDate) : "",
    priority: patient.priority || ("1" as Priority),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sortedPriorities: activePriorities, isLoading: prioritiesLoading } =
    useSelectablePrioritiesForForm({
      enabled: true,
      currentPriority: formData.priority,
      onInvalidPriority: (next) =>
        setFormData((prev) => ({ ...prev, priority: next })),
    });

  const handleInputChange = (
    field: keyof NewPatientCheckInFormData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "priority" ? (value as Priority) : value,
    }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required.");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone is required.");
      return false;
    }
    if (!formData.birthDate) {
      setError("Birth date is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First, update the patient information
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone,
        birthDate: formData.birthDate, // Send as ISO date string (YYYY-MM-DD)
        priority: transformPriorityToApi(formData.priority),
        patientStatus: PatientStatus.IN_TREATMENT, // Change status from "N" (new) to "T" (in treatment)
      };

      await updatePatientMutation.mutateAsync({
        patientId: patient.id,
        data: updateData,
      });

      // Check if we have an existing appointment to check in, or need to create a new one
      if (appointmentId) {
        // Check in the existing appointment
        await checkInAppointmentMutation.mutateAsync({
          appointmentId: appointmentId,
          patientName: formData.name.trim(),
        });
      } else {
        // Create a new assessment consultation appointment (default for new patients)
        const newAppointment = await createAppointmentMutation.mutateAsync({
          patientId: parseInt(patient.id),
          appointmentType: AppointmentType.ASSESSMENT,
          scheduledDate: getTodayClinic(), // YYYY-MM-DD
        });

        // Immediately check in the new appointment if created successfully
        if (newAppointment?.id) {
          await checkInAppointmentMutation.mutateAsync({
            appointmentId: newAppointment.id,
            patientName: formData.name.trim(),
          });
        }
      }

      // Create updated patient object for callback
      const updatedPatient: Patient = {
        ...patient,
        name: formData.name.trim(),
        phone: formData.phone,
        birthDate: formData.birthDate, // Already YYYY-MM-DD string from input
        priority: formData.priority,
        status: "T",
      };

      // Call success callback
      onSuccess(updatedPatient);
    } catch (err) {
      console.error("Error during check-in:", err);
      setError("Error processing check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4 mb-6">
        <Field label="Full Name*" htmlFor="new-patient-checkin-name">
          <Input
            id="new-patient-checkin-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter full name"
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Phone *" htmlFor="new-patient-checkin-phone">
          <Input
            id="new-patient-checkin-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(00) 00000-0000"
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Birth Date *" htmlFor="new-patient-checkin-birth-date">
          <FormDateInput
            id="new-patient-checkin-birth-date"
            value={formData.birthDate}
            onValueChange={(isoValue) =>
              handleInputChange("birthDate", isoValue)
            }
            disabled={isSubmitting}
            required
          />
        </Field>

        <Field label="Priority" htmlFor="new-patient-checkin-priority">
          <Select
            id="new-patient-checkin-priority"
            value={formData.priority}
            onChange={(e) => handleInputChange("priority", e.target.value)}
            disabled={isSubmitting || prioritiesLoading}
          >
            {activePriorities.length === 0 ? (
              <option value={formData.priority}>{formData.priority}</option>
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

      {error && (
        <div className="mb-4">
          <ErrorDisplay error={error} />
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || prioritiesLoading}
          isLoading={isSubmitting}
          loadingText="Processing..."
          className="flex-1"
        >
          Check In
        </Button>
      </div>
    </div>
  );
};

export default NewPatientCheckInForm;
