import React, { useMemo } from "react";
import { Patient, type Priority } from "@/types/types";
import { formatDateForInput } from "@/utils/timezoneDate";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";
import type { SystemOption } from "@/types/systemOptions";
import {
  filterActivePriorityOptions,
  pickFallbackPriorityValue,
  sortPriorityOptionsBySortOrder,
} from "@/utils/priorityOptions";
import { getTreatmentStatusLabel } from "@/utils/patientUtils";
import {
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

interface PatientFormFieldsProps {
  patient:
    | Patient
    | Omit<Patient, "id">
    | {
        name: string;
        phone: string;
        birthDate: string | null; // YYYY-MM-DD format
        priority: string;
        status: string;
        mainConcern: string;
        dischargeDate?: string | null; // YYYY-MM-DD format
        nextAttendanceDates?: { date: string; type: string }[]; // dates as YYYY-MM-DD strings
      };
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleAssessmentConsultationChange?: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  showAssessmentConsultation?: boolean;
  /** When true, shows discharge date in the basic info section (e.g. on edit page) */
  showDischargeDate?: boolean;
  validationErrors?: Record<string, string>;
  /** When provided (e.g. on edit page), applies status rules: disable N if has completed attendances, disable T (schedule instead), disable D unless current status is T */
  statusConfig?: {
    currentStatus: string;
    hasCompletedAttendances: boolean;
  };
  /** When true, the form is being used for editing (e.g. on edit page) */
  isEdit?: boolean;
}
const PatientFormFields: React.FC<PatientFormFieldsProps> = React.memo(
  ({
    patient,
    handleChange,
    handleAssessmentConsultationChange,
    showAssessmentConsultation = true,
    showDischargeDate = false,
    validationErrors = {},
    statusConfig,
    isEdit = false,
  }) => {
    const { getTodayDate } = useDateHelpers();
    const { data: prioritiesData, isLoading: prioritiesLoading } =
      usePriorities(true);

    const allPriorities = useMemo(() => {
      return (prioritiesData ?? []) as SystemOption[];
    }, [prioritiesData]);

    const activePriorities = React.useMemo(
      () => filterActivePriorityOptions(allPriorities),
      [allPriorities],
    );

    const currentPriority = patient.priority as Priority;
    const currentPriorityOption = allPriorities.find(
      (p) => p.value === currentPriority,
    );
    const shouldIncludeCurrentPriority =
      !!isEdit && !!currentPriorityOption && !currentPriorityOption.isActive;

    const priorityOptions = React.useMemo(() => {
      if (!shouldIncludeCurrentPriority) return activePriorities;
      return sortPriorityOptionsBySortOrder([
        ...activePriorities,
        currentPriorityOption as SystemOption,
      ]);
    }, [activePriorities, shouldIncludeCurrentPriority, currentPriorityOption]);

    // For new patients: if the default selected priority was deactivated,
    // automatically switch to the last active option (same default as other forms).
    React.useEffect(() => {
      if (prioritiesLoading) return;
      if (isEdit) return;

      const isCurrentActive = activePriorities.some(
        (p) => p.value === currentPriority,
      );

      if (!isCurrentActive && activePriorities.length > 0) {
        const next = pickFallbackPriorityValue(activePriorities, "last");
        if (next === undefined) return;
        const syntheticEvent = {
          target: {
            name: "priority",
            value: next,
            type: "select",
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        handleChange(syntheticEvent);
      }
    }, [
      prioritiesLoading,
      isEdit,
      activePriorities,
      currentPriority,
      handleChange,
    ]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleChange(e);
      if (
        e.target.value === "D" &&
        !patient.dischargeDate &&
        showDischargeDate
      ) {
        const syntheticEvent = {
          target: {
            name: "dischargeDate",
            value: getTodayDate(),
            type: "date",
          },
        } as React.ChangeEvent<HTMLInputElement>;
        handleChange(syntheticEvent);
      }
    };

    return (
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *" htmlFor="name" error={validationErrors.name}>
            <Input
              id="name"
              name="name"
              value={patient.name}
              onChange={handleChange}
              invalid={Boolean(validationErrors.name)}
              required
              placeholder="Patient full name"
            />
          </Field>
          <Field label="Phone" htmlFor="phone" error={validationErrors.phone}>
            <Input
              id="phone"
              name="phone"
              value={patient.phone}
              onChange={handleChange}
              invalid={Boolean(validationErrors.phone)}
              placeholder="(11) 99999-9999"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Date of Birth *"
            htmlFor="birthDate"
            error={validationErrors.birthDate}
          >
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              invalid={Boolean(validationErrors.birthDate)}
              value={formatDateForInput(patient.birthDate)}
              onChange={handleChange}
              required
              lang="en-US"
              max={getTodayDate()}
            />
          </Field>
          <Field label="Priority" htmlFor="priority">
            <Select
              id="priority"
              name="priority"
              value={patient.priority}
              onChange={handleChange}
              disabled={prioritiesLoading}
            >
              {priorityOptions.length === 0 ? (
                <option value={patient.priority}>{patient.priority}</option>
              ) : (
                priorityOptions.map((p) => {
                  const label = p.label || p.value;
                  const isDisabledOption = isEdit ? !p.isActive : false;
                  return (
                    <option
                      key={p.value}
                      value={p.value}
                      disabled={isDisabledOption}
                    >
                      {p.value} - {label}
                    </option>
                  );
                })
              )}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              name="status"
              value={patient.status}
              onChange={handleStatusChange}
              disabled={!isEdit}
            >
              <option
                value="N"
                disabled={
                  statusConfig?.hasCompletedAttendances ||
                  statusConfig?.currentStatus !== "N"
                }
                title={
                  statusConfig?.hasCompletedAttendances
                    ? "Can only change to New when no completed attendances exist."
                    : undefined
                }
              >
                {getTreatmentStatusLabel("N")}
              </option>
              <option
                value="T"
                disabled={
                  statusConfig ? statusConfig.currentStatus !== "T" : false
                }
                title={
                  statusConfig && statusConfig.currentStatus !== "T"
                    ? "Schedule a New Attendance to change the status."
                    : undefined
                }
              >
                {getTreatmentStatusLabel("T")}
              </option>
              <option
                value="D"
                disabled={
                  statusConfig
                    ? statusConfig.currentStatus !== "T" &&
                      statusConfig.currentStatus !== "D"
                    : false
                }
                title={
                  statusConfig &&
                  statusConfig.currentStatus !== "T" &&
                  statusConfig.currentStatus !== "D"
                    ? "Only patients in treatment can receive discharge."
                    : undefined
                }
              >
                {getTreatmentStatusLabel("D")}
              </option>
              <option
                value="C"
                disabled={
                  statusConfig
                    ? statusConfig.currentStatus !== "T" &&
                      statusConfig.currentStatus !== "C"
                    : false
                }
                title={
                  statusConfig &&
                  statusConfig.currentStatus !== "T" &&
                  statusConfig.currentStatus !== "C"
                    ? "Only patients in treatment can receive Consecutive no-shows."
                    : undefined
                }
              >
                {getTreatmentStatusLabel("C")}
              </option>
            </Select>
          </Field>
        </div>

        {showDischargeDate && (
          <Field
            label={
              patient.status === "D"
                ? "Discharged on"
                : "Expected Discharge (optional)"
            }
            htmlFor="dischargeDate"
          >
            <Input
              id="dischargeDate"
              name="dischargeDate"
              type="date"
              value={
                patient.dischargeDate
                  ? formatDateForInput(patient.dischargeDate)
                  : ""
              }
              onChange={handleChange}
              lang="en-US"
            />
          </Field>
        )}

        <Field label="Main Concern" htmlFor="mainConcern">
          <Textarea
            id="mainConcern"
            name="mainConcern"
            value={patient.mainConcern}
            onChange={handleChange}
            className="min-h-[100px] resize-y"
            placeholder="Describe the patient's main concern..."
          />
        </Field>

        {/* Treatment Information - Only show if enabled */}
        {showAssessmentConsultation && handleAssessmentConsultationChange && (
          <Card>
            <CardHeader className="p-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Assessment Consultation
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="First Consultation (optional)"
                  htmlFor="firstConsultationDate"
                  error={validationErrors.firstConsultationDate}
                >
                  <Input
                    id="firstConsultationDate"
                    name="firstConsultationDate"
                    type="date"
                    invalid={Boolean(validationErrors.firstConsultationDate)}
                    value={
                      patient.nextAttendanceDates?.[0]?.date
                        ? formatDateForInput(
                            patient.nextAttendanceDates[0].date,
                          )
                        : ""
                    }
                    onChange={handleAssessmentConsultationChange}
                    lang="en-US"
                    min={getTodayDate()}
                  />
                </Field>
                <Field
                  label="Expected Discharge (optional)"
                  htmlFor="dischargeDate"
                >
                  <Input
                    id="dischargeDate"
                    name="dischargeDate"
                    type="date"
                    value={
                      patient.dischargeDate
                        ? formatDateForInput(patient.dischargeDate)
                        : ""
                    }
                    onChange={handleAssessmentConsultationChange}
                    lang="en-US"
                  />
                </Field>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );
  },
);

PatientFormFields.displayName = "PatientFormFields";

export default PatientFormFields;
