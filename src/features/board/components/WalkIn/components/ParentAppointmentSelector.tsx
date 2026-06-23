import React from "react";
import type { Status } from "@/types/types";
import { ParentAppointmentOption } from "../hooks/usePatientWalkInForm";
import { Field, Select } from "@/components/ui";

interface ParentAppointmentSelectorProps {
  selectedParentAppointment: string;
  parentAppointmentOptions: ParentAppointmentOption[];
  loadingParentOptions: boolean;
  isSubmitting: boolean;
  patientStatus?: Status;
  onParentAppointmentChange: (value: string) => void;
}

const LABEL_FIRST_APPOINTMENT = "First assessment consultation";
const LABEL_NEW_COMPLAINT = "New complaint";

export const ParentAppointmentSelector: React.FC<
  ParentAppointmentSelectorProps
> = ({
  selectedParentAppointment,
  parentAppointmentOptions,
  loadingParentOptions,
  isSubmitting,
  patientStatus,
  onParentAppointmentChange,
}) => {
  const showOngoingList =
    patientStatus === "T" && parentAppointmentOptions.length > 0;
  const showNewComplaintOnly =
    patientStatus === "D" ||
    patientStatus === "C" ||
    (patientStatus === "T" && parentAppointmentOptions.length === 0);

  const singleOptionLabel = showNewComplaintOnly
    ? LABEL_NEW_COMPLAINT
    : LABEL_FIRST_APPOINTMENT;
  const singleOptionValue = "new";

  return (
    <div className="my-6">
      <h3 className="font-bold text-gray-700 mb-2">Main Complaint</h3>
      <div className="space-y-3">
        <Field
          label="Which complaint is this consultation related to? *"
          htmlFor="parent-appointment"
        >
          {loadingParentOptions ? (
            <div className="text-sm text-gray-500 py-2">
              Loading previous consultations...
            </div>
          ) : showOngoingList ? (
            <Select
              id="parent-appointment"
              name="selectedParentAppointment"
              value={selectedParentAppointment}
              onChange={(e) => onParentAppointmentChange(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select an option</option>
              {parentAppointmentOptions.map((option) => (
                <option key={option.id} value={option.id.toString()}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              id="parent-appointment"
              name="selectedParentAppointment"
              value={selectedParentAppointment || singleOptionValue}
              onChange={(e) => onParentAppointmentChange(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select an option</option>
              <option value={singleOptionValue}>{singleOptionLabel}</option>
            </Select>
          )}
        </Field>
      </div>
    </div>
  );
};
