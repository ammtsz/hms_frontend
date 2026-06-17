import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Patient,
  Recommendations,
  Priority,
  Status,
} from "@/types/types";

import { formatPhoneNumber } from "@/utils/formUtils";
import { transformPriorityToApi, transformStatusToApi } from "@/utils/apiTransformers";
import type { CreatePatientRequest, AttendanceType } from "@/api/types";
import { formatDateClinic } from "@/utils/timezoneDate";
import { useCreatePatient } from "@/api/query/hooks/usePatientQueries";
import { useAddPatientToAgenda } from "@/api/query/hooks/useAgendaQueries";
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
  mainComplaint: "",
  startDate: formatDateClinic(), // YYYY-MM-DD string format
  dischargeDate: null,
  nextAttendanceDates: [],
  previousAttendances: [],
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
  const [scheduledAttendanceDate, setScheduledAttendanceDate] = useState<string | null>(null);
  /** When user requested first consultation but attendance creation failed; message explains why */
  const [attendanceCreationFailed, setAttendanceCreationFailed] = useState<{
    requested: true;
    message: string;
  } | null>(null);
  const router = useRouter();
  const fetchDayFinalizationStatus = useFetchDayFinalizationStatus();
  const createPatientMutation = useCreatePatient();
  const addPatientToAgendaMutation = useAddPatientToAgenda();
  const { data: scheduleSettings } = useScheduleSettings();

  // Comprehensive form validation
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Required field validation
    if (!patient.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!patient.birthDate) {
      errors.birthDate = "Data de nascimento é obrigatória";
    } else if (patient.birthDate > formatDateClinic()) {
      errors.birthDate = "Data de nascimento não pode ser no futuro";
    }

    // Phone format validation (optional field, but must be valid if provided)
    if (patient.phone.trim()) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      if (!phoneRegex.test(patient.phone.trim())) {
        errors.phone = "Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX";
      }
    }

    // First consultation date: must have assessment slots on that day (when schedule settings are available)
    const firstConsultationDate = patient.nextAttendanceDates?.[0]?.date;
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
        nextAttendanceDates: date
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
      alert(`Erro de validação: ${firstError}`);
      return;
    }

    // If user selected a first consultation date, check if that day is finalized (block submit and show feedback)
    if (patient.nextAttendanceDates.length > 0 && patient.nextAttendanceDates[0]?.date) {
      const attendanceDate = patient.nextAttendanceDates[0].date;
      const finalizationResult = await fetchDayFinalizationStatus(attendanceDate);
      if (finalizationResult.success && finalizationResult.value?.isFinalized) {
        setValidationErrors((prev) => ({
          ...prev,
          firstConsultationDate:
            "Dia já finalizado. Não é mais possível agendar atendimentos para este dia.",
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

      // Add main complaint only if it's provided and not empty
      if (patient.mainComplaint && patient.mainComplaint.trim()) {
        patientCreateData.mainComplaint = patient.mainComplaint.trim();
      }
      
      try {
        // Use React Query mutation to create the patient
        const createdPatient = await createPatientMutation.mutateAsync(patientCreateData);
        // Create attendance if next date is provided (finalization already checked before submit)
        if (patient.nextAttendanceDates.length > 0 && patient.nextAttendanceDates[0]?.date) {
          const attendanceDate = patient.nextAttendanceDates[0].date;
          const timeSlots = ["20:00", "21:00"];
          let attendanceCreated = false;
          let lastSlotError: Error | null = null;

          for (const time of timeSlots) {
            if (attendanceCreated) break;

            try {
              await addPatientToAgendaMutation.mutateAsync({
                patientId: createdPatient?.id || 0,
                type: "assessment" as AttendanceType,
                scheduledDate: attendanceDate,
                scheduledTime: time,
                notes: "Agendamento criado durante cadastro do paciente"
              });
              attendanceCreated = true;
              setScheduledAttendanceDate(attendanceDate);
              setAttendanceCreationFailed(null);
            } catch (slotError) {
              lastSlotError = slotError instanceof Error ? slotError : new Error(String(slotError));
              console.log(`Erro no slot ${time}:`, slotError);
            }
          }

          if (!attendanceCreated) {
            const userMessage =
              lastSlotError?.message ||
              "Nenhum horário disponível para a data selecionada.";
            setScheduledAttendanceDate(null);
            setAttendanceCreationFailed({
              requested: true,
              message: userMessage,
            });
          }
        } else {
          setScheduledAttendanceDate(null);
          setAttendanceCreationFailed(null);
        }
        
        // React Query automatically invalidates and refetches patient list
        // No need to manually call refreshPatients()
        
        // TODO: In the future, we could also save the treatment recommendations
        // by creating an initial attendance and consultation if needed
        
        // Reset form
        setPatient(initialPatient);
        
        // Show success modal
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error creating patient:", error);
        alert(`Erro ao cadastrar paciente: ${(error as Error).message}`);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      if (error instanceof Error) {
        alert(`Erro inesperado ao cadastrar paciente: ${error.message}`);
      } else {
        alert("Erro inesperado ao cadastrar paciente. Tente novamente.");
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
    setScheduledAttendanceDate(null);
    setAttendanceCreationFailed(null);
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
    scheduledAttendanceDate,
    attendanceCreationFailed,
    handleSuccessModalConfirm,
  };
}
