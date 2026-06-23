import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Patient,
  Recommendations,
  Priority,
  Status,
} from "@/types/types";

import { formatPhoneNumber, validatePhoneFormat, PHONE_FORMAT_MESSAGE } from "@/utils/formUtils";
import { transformPriorityToApi, transformStatusToApi } from "@/utils/apiTransformers";
import type { CreatePatientRequest, AppointmentType } from "@/api/types";
import { formatDateClinic } from "@/utils/timezoneDate";
import { useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import { useAddPatientToSchedule } from "@/api/query/hooks/useScheduleQueries";
import {
  useScheduleSettings,
  hasSlotsForAssessmentOnDate,
  ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { useFetchDayFinalizationStatus } from "@/api/query/hooks/useDayFinalizationQueries";

const initialRecommendations: Recommendations = {
  food: "",
  water: "",
  ointment: "",
  physiotherapy: false,
  tens: false,
  returnWeeks: 0,
};

const initialPatient: Omit<Patient, "id"> = {
  name: "",
  phone: "",
  priority: "3" as Priority,
  status: "N" as Status,
  birthDate: "",
  mainConcern: "",
  startDate: formatDateClinic(), // YYYY-MM-DD string format
  dischargeDate: null,
  nextAppointmentDates: [],
  previousAppointments: [],
  missingAppointmentsStreak: 0,
  currentRecommendations: {
    date: formatDateClinic(), // YYYY-MM-DD string format
    ...initialRecommendations,
  },
};

export function usePatientForm() {
  const [patient, setPatient] = useState(initialPatient);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scheduledAppointmentDate, setScheduledAppointmentDate] = useState<string | null>(null);
  /** When user requested first consultation but appointment creation failed; message explains why */
  const [appointmentCreationFailed, setAppointmentCreationFailed] = useState<{
    requested: true;
    message: string;
  } | null>(null);
  const router = useRouter();
  const fetchDayFinalizationStatus = useFetchDayFinalizationStatus();
  const createPatientMutation = useCreatePatient();
  const addPatientToScheduleMutation = useAddPatientToSchedule();
  const { data: scheduleSettings } = useScheduleSettings();

  // Comprehensive form validation
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Required field validation
    if (!patient.name.trim()) {
      errors.name = "Name is required";
    }

    if (!patient.birthDate) {
      errors.birthDate = "Birth date is required";
    } else if (patient.birthDate > formatDateClinic()) {
      errors.birthDate = "Birth date cannot be in the future";
    }

    // Phone format validation (optional field, but must be valid if provided)
    if (patient.phone.trim() && !validatePhoneFormat(patient.phone.trim())) {
      errors.phone = PHONE_FORMAT_MESSAGE;
    }

    // First consultation date: must have assessment slots on that day (when schedule settings are available)
    const firstConsultationDate = patient.nextAppointmentDates?.[0]?.date;
    if (
      firstConsultationDate &&
      scheduleSettings &&
      scheduleSettings.length > 0 &&
      !hasSlotsForAssessmentOnDate(firstConsultationDate, scheduleSettings)
    ) {
      errors.firstConsultationDate = ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    return validateForm().isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name.startsWith("recommendations.")) {
      const recKey = name.replace("recommendations.", "") as keyof Recommendations;
      setPatient((prev) => ({
        ...prev,
        currentRecommendations: {
          ...prev.currentRecommendations,
          [recKey]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
        },
      }));
    } else if (type === "date") {
      setPatient((prev) => ({
        ...prev,
        [name]:
          name === "birthDate"
            ? value
            : value || formatDateClinic(),
      }));
    } else if (name === "phone") {
      // Format phone number as user types
      const formattedPhone = formatPhoneNumber(value);
      setPatient((prev) => ({ ...prev, [name]: formattedPhone }));
    } else {
      setPatient((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAssessmentConsultationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "dischargeDate") {
      setPatient((prev) => ({
        ...prev,
        dischargeDate: value || null,
      }));
    } else if (name === "firstConsultationDate") {
      const date = value || null;
      setPatient((prev) => ({
        ...prev,
        nextAppointmentDates: date
          ? [{ date, type: "assessment" }]
          : [],
        startDate: date || prev.startDate,
      }));
      // Validate slot availability on date select so user gets immediate feedback
      if (date && scheduleSettings && scheduleSettings.length > 0) {
        if (!hasSlotsForAssessmentOnDate(date, scheduleSettings)) {
          setValidationErrors((prev) => ({
            ...prev,
            firstConsultationDate: ASSESSMENT_SLOTS_UNAVAILABLE_MESSAGE,
          }));
        } else {
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next.firstConsultationDate;
            return next;
          });
        }
      } else {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next.firstConsultationDate;
          return next;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const { isValid, errors } = validateForm();
    setValidationErrors(errors);

    if (!isValid) {
      // Show first validation error
      const firstError = Object.values(errors)[0];
      alert(`Validation error: ${firstError}`);
      return;
    }

    // If user selected a first consultation date, check if that day is finalized (block submit and show feedback)
    if (patient.nextAppointmentDates.length > 0 && patient.nextAppointmentDates[0]?.date) {
      const appointmentDate = patient.nextAppointmentDates[0].date;
      const finalizationResult = await fetchDayFinalizationStatus(appointmentDate);
      if (finalizationResult.success && finalizationResult.value?.isFinalized) {
        setValidationErrors((prev) => ({
          ...prev,
          firstConsultationDate:
            "Day already finalized. It is no longer possible to schedule appointments for this day.",
        }));
        return;
      }
    }

    setIsLoading(true);

    try {
      // Transform patient data to API format
      const patientCreateData: CreatePatientRequest = {
        name: patient.name.trim(),
        priority: transformPriorityToApi(patient.priority),
        patientStatus: transformStatusToApi(patient.status),
      };

      // Add optional phone only if it's provided and not empty
      if (patient.phone && patient.phone.trim()) {
        const formattedPhone = formatPhoneNumber(patient.phone.trim());
        if (formattedPhone) {
          patientCreateData.phone = formattedPhone;
        }
      }

      // Add birth date if it's provided
      if (patient.birthDate) {
        patientCreateData.birthDate = patient.birthDate; // Already in YYYY-MM-DD format
      }

      // Add main concern only if it's provided and not empty
      if (patient.mainConcern && patient.mainConcern.trim()) {
        patientCreateData.mainConcern = patient.mainConcern.trim();
      }
      
      try {
        // Use React Query mutation to create the patient
        const createdPatient = await createPatientMutation.mutateAsync(patientCreateData);
        // Create appointment if next date is provided (finalization already checked before submit)
        if (patient.nextAppointmentDates.length > 0 && patient.nextAppointmentDates[0]?.date) {
          const appointmentDate = patient.nextAppointmentDates[0].date;
          const timeSlots = ["20:00", "21:00"];
          let appointmentCreated = false;
          let lastSlotError: Error | null = null;

          for (const time of timeSlots) {
            if (appointmentCreated) break;

            try {
              await addPatientToScheduleMutation.mutateAsync({
                patientId: createdPatient?.id || 0,
                type: "assessment" as AppointmentType,
                scheduledDate: appointmentDate,
                scheduledTime: time,
                notes: "Appointment created during patient registration"
              });
              appointmentCreated = true;
              setScheduledAppointmentDate(appointmentDate);
              setAppointmentCreationFailed(null);
            } catch (slotError) {
              lastSlotError = slotError instanceof Error ? slotError : new Error(String(slotError));
              console.log(`Error in slot ${time}:`, slotError);
            }
          }

          if (!appointmentCreated) {
            const userMessage =
              lastSlotError?.message ||
              "No time slot available for the selected date.";
            setScheduledAppointmentDate(null);
            setAppointmentCreationFailed({
              requested: true,
              message: userMessage,
            });
          }
        } else {
          setScheduledAppointmentDate(null);
          setAppointmentCreationFailed(null);
        }
        
        // React Query automatically invalidates and refetches patient list
        // No need to manually call refreshPatients()
        
        // TODO: In the future, we could also save the treatment recommendations
        // by creating an initial appointment and consultation if needed
        
        // Reset form
        setPatient(initialPatient);
        
        // Show success modal
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error creating patient:", error);
        alert(`Error creating patient: ${(error as Error).message}`);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      if (error instanceof Error) {
        alert(`Unexpected error creating patient: ${error.message}`);
      } else {
        alert("Unexpected error creating patient. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key down events to prevent Enter submission unless on submit button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      // Allow Enter only if the target is the submit button
      const target = e.target as HTMLElement;
      if (target.tagName !== "BUTTON" || target.getAttribute("type") !== "submit") {
        e.preventDefault();
        return;
      }
      
      // If Enter is pressed on submit button, validate before allowing submission
      const { isValid } = validateForm();
      if (!isValid) {
        e.preventDefault();
        return;
      }
    }
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    setScheduledAppointmentDate(null);
    setAppointmentCreationFailed(null);
    // Redirect to patients list
    router.push("/patients");
  };

  return {
    patient,
    setPatient,
    handleChange,
    handleAssessmentConsultationChange,
    handleSubmit,
    handleKeyDown,
    isLoading,
    validationErrors,
    isFormValid,
    showSuccessModal,
    scheduledAppointmentDate,
    appointmentCreationFailed,
    handleSuccessModalConfirm,
  };
}
