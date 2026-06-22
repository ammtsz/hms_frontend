import { useState, useCallback, useMemo } from "react";
import { Priority, PatientBasic, Status } from "@/types/types";
import { AttendanceType } from "@/api/types";
import { useAttendanceBoardState } from "@/features/attendance/hooks/useAttendanceBoardState";
import { usePatients, useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import { useCreateAttendance, useEligibleParentOptions } from "@/api/query/hooks/useAttendanceQueries";
import { getTodayClinic } from "@/utils/timezoneDate";
import { getDefaultSchedulingDate } from "@/utils/dateUtils";
import { transformPriorityToApi } from "@/utils/apiTransformers";
import { useScheduleSettings } from "@/api/query/hooks/useScheduleSettingQueries";
import { useInvalidateSchedule } from "@/api/query/hooks/useScheduleQueries";
import { getDateSlotError } from "@/utils/scheduleTreatmentSlots";
import { getNoScheduleReasonForNewPatient } from "@/utils/scheduleErrorMessages";
import {
  validateBasicInputs,
  validateDateSlot,
  validateDayNotFinalized,
  validateHolidayBlocking,
  getAttendancesForTargetDate,
  validateDuplicateSchedule,
  buildSuccessMessage,
  isConflictError,
  buildNewPatientSchedulingFailureMessage,
  buildSchedulingFailureMessage,
} from "@/features/attendance/utils/attendanceRegistrationUtils";

export interface ParentAttendanceOption {
  id: number;
  date: string;
  mainConcern: string;
  label: string;
}

export interface UseAttendanceFormProps {
  onRegisterNewAttendance?: (
    patientName: string,
    types: string[],
    isNew: boolean,
    priority: Priority,
    date?: string
  ) => void;
  defaultNotes?: string;
  validationDate?: string;
  onFormSuccess?: () => void; // New prop for handling success internally
  /** When provided with showDateField, validates that the date has slots for selected types (pre-submit). */
  selectedDate?: string;
  showDateField?: boolean;
}

export interface UseAttendanceFormReturn {
  // Form state
  search: string;
  setSearch: (value: string) => void;
  selectedPatient: string;
  setSelectedPatient: (value: string) => void;
  isNewPatient: boolean;
  setIsNewPatient: (value: boolean) => void;
  selectedTypes: string[];
  setSelectedTypes: (value: string[]) => void;
  priority: Priority;
  setPriority: (value: Priority) => void;
  notes: string;
  setNotes: (value: string) => void;
  selectedParentAttendance: string;
  setSelectedParentAttendance: (value: string) => void;
  
  // State management
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
  
  // Data
  filteredPatients: PatientBasic[];
  parentAttendanceOptions: ParentAttendanceOption[];
  loadingParentOptions: boolean;
  patientStatus?: Status;
  /** Error when selected date has no slots for selected types (only when showDateField and selectedDate provided). */
  dateSlotError: string | null;

  // Actions
  resetForm: () => void;
  fetchParentAttendanceOptions: (patientId: string) => void;
  handleRegisterNewAttendance: (
    e: React.FormEvent, 
    selectedDate?: string
  ) => Promise<boolean>;
}

export const useAttendanceForm = ({
  onRegisterNewAttendance,
  defaultNotes = "",
  validationDate,
  onFormSuccess,
  selectedDate: selectedDateProp,
  showDateField = false,
}: UseAttendanceFormProps = {}): UseAttendanceFormReturn => {
  const invalidateSchedule = useInvalidateSchedule();
  const { data: patients = [] } = usePatients();
  const { refreshCurrentDate, attendancesByDate } = useAttendanceBoardState();
  const { data: scheduleSettings } = useScheduleSettings();
  
  // React Query mutations for better cache management
  const createAttendanceMutation = useCreateAttendance();
  const createPatientMutation = useCreatePatient();
  
  // Form state
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["assessment"]);
  const [priority, setPriority] = useState<Priority>("3");
  const [notes, setNotes] = useState<string>(defaultNotes);
  const [selectedParentAttendance, setSelectedParentAttendance] = useState<string>("");
  
  // Tracks which patient ID to fetch parent options for (set imperatively by the component)
  const [parentOptionsPatientId, setParentOptionsPatientId] = useState<string | null>(null);

  const { data: parentOptionsData, isLoading: loadingParentOptions } =
    useEligibleParentOptions(parentOptionsPatientId);
  const parentAttendanceOptions: ParentAttendanceOption[] =
    parentOptionsData?.options ?? [];

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtered patients for search
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Validate date slot availability when user selects a date (pre-submit feedback)
  const dateSlotError = useMemo(
    () =>
      showDateField && selectedDateProp && scheduleSettings?.length
        ? getDateSlotError(selectedDateProp, selectedTypes, scheduleSettings)
        : null,
    [showDateField, selectedDateProp, selectedTypes, scheduleSettings],
  );

  /**
   * Reset all form fields to default state
   */
  const resetForm = useCallback(() => {
    setSearch("");
    setSelectedPatient("");
    setSelectedTypes(["assessment"]);
    setIsNewPatient(false);
    setNotes(defaultNotes);
    setSelectedParentAttendance("");
    setParentOptionsPatientId(null);
    setError(null);
    setSuccess(null);
  }, [defaultNotes]);

  const fetchParentAttendanceOptions = useCallback((patientId: string) => {
    setParentOptionsPatientId(patientId);
  }, []);

  const selectedPatientData = selectedPatient
    ? patients.find((p) => p.name === selectedPatient)
    : undefined;
  const patientStatus = selectedPatientData?.status;

  /**
   * Resolve patient ID: create new patient or get existing. Returns patientId or null on validation error.
   */
  const resolvePatientId = useCallback(
    async (name: string): Promise<string | null> => {
      if (isNewPatient) {
        const existingPatient = patients.find(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (existingPatient) {
          setError("Patient already registered. Uncheck 'New patient' to select it.");
          return null;
        }

        const newPatient = await createPatientMutation.mutateAsync({
          name,
          priority: transformPriorityToApi(priority),
          mainConcern: notes,
        });

        if (!newPatient) {
          throw new Error("Error creating patient: no data returned");
        }
        return newPatient.id.toString();
      }

      const patient = patients.find((p) => p.name === selectedPatient);
      if (!patient) {
        setError("Selected patient not found.");
        return null;
      }
      return patient.id;
    },
    [isNewPatient, patients, priority, notes, selectedPatient, createPatientMutation]
  );

  /**
   * Create attendances for each selected type.
   */
  const createAttendances = useCallback(
    async (
      patientId: string,
      name: string,
      nextAvailableDate: string
    ): Promise<Array<{ success: boolean; data?: unknown; error?: string }>> => {
      const promises = selectedTypes.map(async (type) => {
        try {
          const createResult = await createAttendanceMutation.mutateAsync({
            patientId: parseInt(patientId),
            attendanceType: type as AttendanceType,
            scheduledDate: nextAvailableDate,
            parentAttendanceId:
              selectedParentAttendance && selectedParentAttendance !== "new"
                ? parseInt(selectedParentAttendance)
                : undefined,
          });

          return { success: true, data: createResult };
        } catch (err) {
          console.error("Error creating attendance:", err);
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      });

      return Promise.all(promises);
    },
    [
      selectedTypes,
      selectedParentAttendance,
      createAttendanceMutation,
    ]
  );

  /**
   * Handle form submission for new attendance registration
   */
  const handleRegisterNewAttendance = useCallback(async (
    e: React.FormEvent,
    selectedDate?: string
  ): Promise<boolean> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const name = isNewPatient ? search.trim() : selectedPatient;
      const targetDate = selectedDate || getTodayClinic();

      // Step 1: Basic form validation
      const basicError = validateBasicInputs(name, selectedTypes);
      if (basicError) {
        setError(basicError);
        return false;
      }

      // Step 2: Date slot validation
      const dateSlotValidationError = validateDateSlot(showDateField, dateSlotError);
      if (dateSlotValidationError) {
        setError(dateSlotValidationError);
        return false;
      }

      // Step 3: Block finalized days
      const finalizationError = await validateDayNotFinalized(targetDate);
      if (finalizationError) {
        setError(finalizationError);
        return false;
      }

      // Step 4: Holiday blocking
      const holidayError = await validateHolidayBlocking(targetDate, selectedTypes);
      if (holidayError) {
        setError(holidayError);
        return false;
      }

      // Step 5: Duplicate schedule check
      const attendancesForTargetDate = await getAttendancesForTargetDate(
        targetDate,
        attendancesByDate
      );
      const duplicateError = validateDuplicateSchedule(
        name,
        selectedTypes,
        attendancesForTargetDate,
        targetDate,
        validationDate
      );
      if (duplicateError) {
        setError(duplicateError);
        return false;
      }

      // Step 6: Resolve patient ID (create new or use existing)
      const patientId = await resolvePatientId(name);
      if (!patientId) return false;

      // Step 7: Create attendances
      const nextAvailableDate = selectedDate || (await getDefaultSchedulingDate());
      const results = await createAttendances(patientId, name, nextAvailableDate);

      const failedCreations = results.filter((r) => !r.success);
      if (failedCreations.length > 0) {
        const firstError = failedCreations[0]?.error;
        const hasConflict = failedCreations.some((r) => isConflictError(r.error));

        if (isNewPatient) {
          const reason =
            (firstError && getNoScheduleReasonForNewPatient(firstError)) ||
            (hasConflict ? "Schedule unavailable for this date." : firstError) ||
            "Error creating appointment(s).";
          setError(buildNewPatientSchedulingFailureMessage(reason));
          setIsNewPatient(false);
          setSelectedPatient(name);
          setSearch(name);
        } else {
          setError(
            buildSchedulingFailureMessage(
              failedCreations.length,
              hasConflict,
              firstError
            )
          );
        }

        await refreshCurrentDate();
        invalidateSchedule();
        return false;
      }

      // Success path
      setSuccess(buildSuccessMessage(selectedTypes.length, nextAvailableDate));
      await refreshCurrentDate();
      invalidateSchedule();

      if (onRegisterNewAttendance) {
        onRegisterNewAttendance(name, selectedTypes, isNewPatient, priority, nextAvailableDate);
      }
      resetForm();
      if (onFormSuccess) onFormSuccess();

      return true;
    } catch (err) {
      console.error("Error in handleRegisterNewAttendance:", err);
      setError("Unexpected error occurred while processing the request. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isNewPatient,
    search,
    selectedPatient,
    selectedTypes,
    priority,
    attendancesByDate,
    validationDate,
    showDateField,
    dateSlotError,
    refreshCurrentDate,
    invalidateSchedule,
    onRegisterNewAttendance,
    onFormSuccess,
    resetForm,
    resolvePatientId,
    createAttendances,
  ]);

  return {
    // Form state
    search,
    setSearch,
    selectedPatient,
    setSelectedPatient,
    isNewPatient,
    setIsNewPatient,
    selectedTypes,
    setSelectedTypes,
    priority,
    setPriority,
    notes,
    setNotes,
    selectedParentAttendance,
    setSelectedParentAttendance,
    
    // State management
    isSubmitting,
    error,
    success,
    
    // Data
    filteredPatients,
    parentAttendanceOptions,
    loadingParentOptions,
    patientStatus,
    dateSlotError,

    // Actions
    resetForm,
    fetchParentAttendanceOptions,
    handleRegisterNewAttendance
  };
};

export default useAttendanceForm;
