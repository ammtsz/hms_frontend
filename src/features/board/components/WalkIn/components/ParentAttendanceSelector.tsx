import React from "react";
import type { Status } from "@/types/types";
import { ParentAttendanceOption } from "../hooks/usePatientWalkInForm";
import { Field, Select } from "@/components/ui";

interface ParentAttendanceSelectorProps {
  selectedParentAttendance: string;
  parentAttendanceOptions: ParentAttendanceOption[];
  loadingParentOptions: boolean;
  isSubmitting: boolean;
  patientStatus?: Status;
  onParentAttendanceChange: (value: string) => void;
}

const LABEL_FIRST_ATTENDANCE = "First assessment consultation";
const LABEL_NEW_COMPLAINT = "New complaint";

export const ParentAttendanceSelector: React.FC<
  ParentAttendanceSelectorProps
> = ({
  selectedParentAttendance,
  parentAttendanceOptions,
  loadingParentOptions,
  isSubmitting,
  patientStatus,
  onParentAttendanceChange,
}) => {
  const showOngoingList =
    patientStatus === "T" && parentAttendanceOptions.length > 0;
  const showNewComplaintOnly =
    patientStatus === "D" ||
    patientStatus === "C" ||
    (patientStatus === "T" && parentAttendanceOptions.length === 0);

  const singleOptionLabel = showNewComplaintOnly
    ? LABEL_NEW_COMPLAINT
    : LABEL_FIRST_ATTENDANCE;
  const singleOptionValue = "new";

  return (
    <div className="my-6">
      <h3 className="font-bold text-gray-700 mb-2">Main Complaint</h3>
      <div className="space-y-3">
        <Field
          label="Which complaint is this consultation related to? *"
          htmlFor="parent-attendance"
        >
          {loadingParentOptions ? (
            <div className="text-sm text-gray-500 py-2">
              Loading previous consultations...
            </div>
          ) : showOngoingList ? (
            <Select
              id="parent-attendance"
              name="selectedParentAttendance"
              value={selectedParentAttendance}
              onChange={(e) => onParentAttendanceChange(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select an option</option>
              {parentAttendanceOptions.map((option) => (
                <option key={option.id} value={option.id.toString()}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              id="parent-attendance"
              name="selectedParentAttendance"
              value={selectedParentAttendance || singleOptionValue}
              onChange={(e) => onParentAttendanceChange(e.target.value)}
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
