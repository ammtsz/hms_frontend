import { useState } from "react";
import { Priority } from "@/types/types";
import { usePatients, useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import {
  useAttendancesByDate,
  useCreateAttendance,
  useCheckInAttendance,
  useEligibleParentOptions,
} from "@/api/query/hooks/useAttendanceQueries";
import { useAttendanceHolidayForDate } from "@/features/board/hooks/useAttendanceHolidayForDate";
import { useSelectablePrioritiesForForm } from "@/features/board/hooks/useSelectablePrioritiesForForm";
import { defaultPriorityFromSorted } from "@/utils/priorityOptions";
import {
  transformPriorityToApi,
} from "@/utils/apiTransformers";
import { validatePatientForm } from "@/utils/formUtils";
import { getTodayClinic } from "@/utils/timezoneDate";
import { AttendanceType } from "@/api/types";
export interface WalkInFormData {
  name: string;
  phone: string;
  birthDate: string;
  priority: Priority;
  isNewPatient: boolean;
  selectedPatient: string;
  selectedParentAttendance: string;
}

export interface ParentAttendanceOption {
  id: number;
  date: string;
  mainConcern: string;
  label: string;
}

interface UsePatientWalkInFormProps {
  onRegisterNewAttendance?: (
    patientName: string,
    types: string[],
    isNew: boolean,
    priority: Priority
  ) => void;
}

export const usePatientWalkInForm = ({
  onRegisterNewAttendance,
}: UsePatientWalkInFormProps = {}) => {
  const { data: patients = [], refetch: refreshPatients } = usePatients();
  const today = getTodayClinic();
  const { data: attendancesData, refetch: refreshCurrentDate } =
    useAttendancesByDate(today);

  const createPatientMutation = useCreatePatient();
  const createAttendanceMutation = useCreateAttendance();
  const checkInAttendanceMutation = useCheckInAttendance();

  const [formData, setFormData] = useState<WalkInFormData>({
    name: "",
    phone: "",
    birthDate: "",
    priority: "5",
    isNewPatient: false,
    selectedPatient: "",
    selectedParentAttendance: "",
  });

  // Tracks which patient ID to fetch parent options for (set imperatively by the component)
  const [parentOptionsPatientId, setParentOptionsPatientId] = useState<string | null>(null);

  const { data: parentOptionsData, isLoading: loadingParentOptions } =
    useEligibleParentOptions(parentOptionsPatientId);
  const parentAttendanceOptions: ParentAttendanceOption[] =
    parentOptionsData?.options ?? [];

  const {
    blockedLabels: holidayBlockedLabels,
    isLoading: holidayLoading,
    hasError: holidayError,
  } = useAttendanceHolidayForDate(today);

  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(formData.name.toLowerCase())
  );

  const { sortedPriorities: activePriorities, isLoading: prioritiesLoading } =
    useSelectablePrioritiesForForm({
      enabled: formData.isNewPatient,
      currentPriority: formData.priority,
      onInvalidPriority: (next) =>
        setFormData((prev) => ({ ...prev, priority: next })),
    });

  const fetchParentAttendanceOptions = (patientId: string) => {
    setParentOptionsPatientId(patientId);
  };

  const selectedPatientData = formData.selectedPatient
    ? patients.find((p) => p.name === formData.selectedPatient)
    : undefined;
  const patientStatus = selectedPatientData?.status;

  const checkForDuplicateAttendances = (patientId: string): boolean => {
    if (!attendancesData?.assessment) {
      return false;
    }

    // Check if patient already has a non-cancelled assessment consultation today
    const hasDuplicate = Object.values(attendancesData.assessment)
      .flat()
      .some((att) => {
        const matchesPatient =
          att.patientId &&
          (typeof att.patientId === "number"
            ? att.patientId
            : Number(att.patientId)) === Number(patientId);
        const isNotCancelled = !att.isCancelled;
        return matchesPatient && isNotCancelled;
      });
    return hasDuplicate;
  };

  const validateForm = (): boolean => {
    const name = formData.isNewPatient
      ? formData.name.trim()
      : formData.selectedPatient;

    if (!name) {
      setError("Patient name is required");
      return false;
    }

    if (formData.isNewPatient) {
      const validationError = validatePatientForm(
        {
          name: formData.name,
          phone: formData.phone,
          birthDate: formData.birthDate,
        },
        true,
        true
      );

      if (validationError) {
        setError(validationError);
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    const defaultPriority = defaultPriorityFromSorted(
      activePriorities,
      "last",
      "1",
    );
    setFormData({
      name: "",
      phone: "",
      birthDate: "",
      priority: defaultPriority,
      isNewPatient: false,
      selectedPatient: "",
      selectedParentAttendance: "",
    });
    setShowDropdown(false);
    setParentOptionsPatientId(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    if (holidayLoading) {
      setError("Checking holidays. Please try again.");
      return;
    }

    if (holidayError) {
      setError("Error checking holidays. Please try again.");
      return;
    }

    if (holidayBlockedLabels.includes("Assessment Consultation")) {
      setError("Today is a holiday and check-in for Assessment Consultations is not allowed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const name = formData.isNewPatient
        ? formData.name.trim()
        : formData.selectedPatient;
      let patientId: string;

      if (formData.isNewPatient) {
        const existingPatient = patients.find(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );

        if (existingPatient) {
          setError(
            "Patient already registered. Uncheck 'New patient' to select them."
          );
          return;
        }

        const createdPatient = await createPatientMutation.mutateAsync({
          name: name,
          priority: transformPriorityToApi(formData.priority),
          phone: formData.phone || undefined,
          birthDate: formData.birthDate || undefined,
        });

        if (!createdPatient?.id) {
          setError("Failed to create patient: ID not returned");
          return;
        }

        patientId = String(createdPatient.id);
        await refreshPatients();
      } else {
        const selectedPatientData = patients.find((p) => p.name === name);
        if (!selectedPatientData) {
          setError("Selected patient not found.");
          return;
        }

        patientId = String(selectedPatientData.id);
      }

      await refreshCurrentDate();
      const hasDuplicate = checkForDuplicateAttendances(patientId);

      if (hasDuplicate) {
        const patientName = formData.isNewPatient
          ? formData.name
          : formData.selectedPatient;
        setError(
          `Duplicate appointment! Patient ${patientName} already has an Assessment Consultation scheduled for today.`
        );
        return;
      }

      const todayDate = getTodayClinic();

      let parentAttendanceId: number | undefined;

      if (!formData.isNewPatient && formData.selectedParentAttendance) {
        if (formData.selectedParentAttendance !== "new") {
          parentAttendanceId = Number(formData.selectedParentAttendance);
        }
      }

      const createdAttendance = await createAttendanceMutation.mutateAsync({
        patientId: Number(patientId),
        attendanceType: "assessment" as AttendanceType,
        scheduledDate: todayDate,
        parentAttendanceId,
      });

      if (!createdAttendance?.id) {
        setError("Failed to create attendance: ID not returned");
        await refreshCurrentDate();
        return false;
      }

      await checkInAttendanceMutation.mutateAsync({
        attendanceId: createdAttendance.id,
        patientName: name,
      });

      setSuccess("Check-in completed successfully! Assessment Consultation scheduled for today.");

      await refreshCurrentDate();

      if (onRegisterNewAttendance) {
        onRegisterNewAttendance(
          name,
          ["assessment"],
          formData.isNewPatient,
          formData.priority
        );
      }

      resetForm();
      return true;
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError("Unexpected error processing check-in. Please try again.");
      await refreshCurrentDate();
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    showDropdown,
    setShowDropdown,
    isSubmitting,
    error,
    setError,
    success,
    setSuccess,
    parentAttendanceOptions,
    loadingParentOptions,
    patientStatus,
    filteredPatients,
    fetchParentAttendanceOptions,
    handleSubmit,
    prioritiesLoading,
    resetForm,
  };
};
