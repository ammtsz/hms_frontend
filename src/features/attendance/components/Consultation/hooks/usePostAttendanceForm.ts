import { useCallback, useMemo, useState, useEffect } from "react";
import { useFormHandler } from "@/features/attendance/components/Consultation/hooks/useFormHandler";
import type {
  CreateTreatmentRequest,
  PatientResponseDto,
  PatientPriority,
  PatientStatus,
  CancelledAttendanceItemDto,
} from "@/api/types";
import type { TreatmentRecommendation, PhysiotherapyLocationTreatment, TensLocationTreatment } from "../types";
import type { CreatedTreatment } from "../components/CreatedTreatmentsConfirmation";
import type { TreatmentCreationError } from "../components/TreatmentCreationErrors";
import { useCloseModal, usePostAttendanceModal } from "@/stores/modalStore";
import { useConsultationSubmission } from "./useConsultationSubmission";
import { usePatient, useNewlyScheduledAttendances } from "@/api/query/hooks/usePatientQueries";
import { useBulkCreateTreatments } from "@/api/query/hooks/useTreatmentTrackingQueries";
import {
  useLatestConsultationByPatient,
  useScheduleReturnAttendance,
} from "@/api/query/hooks/useConsultationQueries";
import {
  useScheduleSettings,
  hasInvalidTreatmentStartDates,
  TREATMENT_SLOTS_UNAVAILABLE_MESSAGE,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { getTodayClinic } from "@/utils/timezoneDate";
import { ERROR_MESSAGE } from "@/api/utils/messages";

// Patient lifecycle status (N/T/A/F) for consultation form
export type PatientStatusValue = "N" | "T" | "A" | "F";

export interface PostConsultationFormData {
  // Main form fields from requirements
  mainComplaint: string;
  patientStatus: PatientStatusValue;
  startDate: string;
  returnWeeks: number;

  // Recommendations section (reusing existing structure)
  food: string;
  water: string;
  ointments: string;
  recommendations: TreatmentRecommendation;
  notes: string;

  // Tab acknowledgment checkboxes - prevent accidental submit without reviewing tabs
  noGeneralRecommendations: boolean;
  noTreatmentRecommendations: boolean;
}

export function usePostAttendanceForm() {
  // Get store state and actions
  const {
    attendanceId,
    patientId,
    currentTreatmentStatus,
    isLoading: externalLoading = false,
    onComplete,
  } = usePostAttendanceModal();
  const closeModal = useCloseModal();

  const { mutateAsync: scheduleReturn } = useScheduleReturnAttendance();

  // Use specialized treatment submission hook
  const { submitConsultation } = useConsultationSubmission();

  // Use React Query hook for bulk treatment plan creation (eliminates race conditions)
  const { mutateAsync: bulkCreateTreatments } = useBulkCreateTreatments();

  // Use React Query hook for patient data (replaces manual fetching)
  const {
    data: patient,
    isLoading: fetchingPatient,
    error: patientQueryError,
  } = usePatient(patientId?.toString() || "");

  const { data: scheduleSettings } = useScheduleSettings();

  // Fetch latest consultation for this PATIENT (not attendance) to pre-fill form
  // Uses the most recent consultation for defaults such as return weeks.
  const {
    data: latestConsultation,
    isLoading: fetchingConsultation,
  } = useLatestConsultationByPatient(patientId?.toString() || "");

  // Convert React Query error to string for compatibility
  const fetchError = patientQueryError
    ? (patientQueryError as Error).message
    : null;

  // State for confirmation (created treatment plans + scheduling summary)
  const [createdTreatments, setCreatedTreatments] = useState<CreatedTreatment[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shouldFetchAttendances, setShouldFetchAttendances] = useState(false);
  const [cancelledAttendances, setCancelledAttendances] = useState<
    CancelledAttendanceItemDto[]
  >([]);

  // State for bulk treatment creation error handling
  const [treatmentCreationErrors, setTreatmentCreationErrors] = useState<TreatmentCreationError[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // Fetch newly scheduled attendances after treatment creation
  const {
    data: newlyScheduledAttendances,
    isLoading: fetchingAttendances,
    error: attendancesError,
  } = useNewlyScheduledAttendances(
    patientId?.toString(),
    shouldFetchAttendances // Only fetch when explicitly enabled
  );

  // Get current date as string for default values (memoized to prevent dependency changes)
  const today = useMemo(() => getTodayClinic(), []);

  const handleCancel = useCallback(() => {
    closeModal("postAttendance");
  }, [closeModal]);

  // Helper function to validate treatment data before sending to backend
  const validateTreatmentData = useCallback((
    treatment: PhysiotherapyLocationTreatment | TensLocationTreatment,
    treatmentType: 'physiotherapy' | 'tens'
  ): string[] => {
    const errors: string[] = [];

    if (treatmentType === 'physiotherapy') {
      const physiotherapyTreatment = treatment as PhysiotherapyLocationTreatment;

      // Validate duration (1-10 units)
      if (!physiotherapyTreatment.duration || physiotherapyTreatment.duration < 1 || physiotherapyTreatment.duration > 10) {
        errors.push(`Tempo deve ser entre 1 e 10 unidades (7 a 70 minutos). Valor atual: ${physiotherapyTreatment.duration}`);
      }

      // Validate color
      if (!physiotherapyTreatment.color || physiotherapyTreatment.color.trim() === '') {
        errors.push('Cor é obrigatória para tratamentos de fisioterapia.');
      }
    }

    // Validate common fields
    if (!treatment.quantity || treatment.quantity < 1 || treatment.quantity > 50) {
      errors.push(`Quantidade de sessões deve ser entre 1 e 50. Valor atual: ${treatment.quantity}`);
    }

    if (!treatment.startDate || treatment.startDate.trim() === '') {
      errors.push('Data de cadastro é obrigatória.');
    }

    if (!treatment.locations || treatment.locations.length === 0) {
      errors.push('Pelo menos um local do corpo deve ser selecionado.');
    }

    return errors;
  }, []);

  // Helper function to parse bulk treatment creation errors into the format expected by TreatmentCreationErrors
  const parseTreatmentCreationErrors = useCallback((
    error: unknown,
    recommendations: TreatmentRecommendation
  ): TreatmentCreationError[] => {
    const errors: TreatmentCreationError[] = [];

    try {
      // Check if the error has structured error details from our collection
      const errorDetails = (error as { errorDetails?: { physiotherapyErrors: string[], tensErrors: string[], allErrors: string[] } })?.errorDetails;

      if (errorDetails) {
        // Use the structured errors we collected
        if (errorDetails.physiotherapyErrors && errorDetails.physiotherapyErrors.length > 0) {
          errors.push({
            treatmentType: 'physiotherapy',
            errors: errorDetails.physiotherapyErrors
          });
        }

        if (errorDetails.tensErrors && errorDetails.tensErrors.length > 0) {
          errors.push({
            treatmentType: 'tens',
            errors: errorDetails.tensErrors
          });
        }
      } else {
        // Fallback to parsing the error message/response
        const rawMessage = error instanceof Error ? error.message : String(error);
        // Map generic API 400 message to user-friendly slot message in session creation context
        const errorMessage =
          rawMessage === ERROR_MESSAGE.BAD_REQUEST
            ? TREATMENT_SLOTS_UNAVAILABLE_MESSAGE
            : rawMessage;

        // Try to extract validation details from API error response
        const apiError = error as { 
          response?: { 
            data?: { 
              message?: string | string[], 
              details?: Array<{ field: string, value: unknown, constraints: Record<string, string> }> 
            } 
          } 
        };
        
        let detailedMessages: string[] = [];
        
        // Parse backend validation error details if available (422 responses)
        if (apiError.response?.data?.details) {
          detailedMessages = apiError.response.data.details.map(detail => {
            const fieldName = detail.field;
            const constraints = Object.values(detail.constraints || {});
            return `${fieldName}: ${constraints.join(', ')}`;
          });
        } else if (apiError.response?.data?.message) {
          // Handle message array from backend
          const messages = Array.isArray(apiError.response.data.message) 
            ? apiError.response.data.message 
            : [apiError.response.data.message];
          detailedMessages = messages;
        }

        // Check if we have physiotherapy treatments that might have failed
        if (recommendations.physiotherapy?.treatments && recommendations.physiotherapy.treatments.length > 0) {
          const physiotherapyErrors: string[] = [];

          // Use detailed validation messages if available
          if (detailedMessages.length > 0) {
            physiotherapyErrors.push(...detailedMessages.map(msg => 
              `Fisioterapia: ${msg}`
            ));
          } else {
            // Check for specific validation errors in error message
            if (errorMessage.includes('duration_minutes must not be greater than 10')) {
              physiotherapyErrors.push('Tempo deve ser entre 1 e 10 unidades (7 a 70 minutos). Verifique os valores informados.');
            } else if (errorMessage.includes('duration_minutes must not be less than 1')) {
              physiotherapyErrors.push('Tempo deve ser no mínimo 1 unidade (7 minutos). Verifique os valores informados.');
            } else if (errorMessage.includes('color should not be empty') || errorMessage.includes('color must be a string')) {
              physiotherapyErrors.push('Cor é obrigatória para tratamentos de fisioterapia.');
            } else if (errorMessage.includes('Attendance with ID') && errorMessage.includes('not found')) {
              physiotherapyErrors.push('Erro de dados: atendimento não encontrado. Tente novamente.');
            } else if (errorMessage.toLowerCase().includes('fisioterapia') ||
              errorMessage.toLowerCase().includes('physiotherapy')) {
              physiotherapyErrors.push(errorMessage);
            } else if (errorMessage.includes('422') || errorMessage.includes('Validation failed')) {
              physiotherapyErrors.push('Erro de validação ao criar sessões de fisioterapia. Verifique os dados informados (tempo: 1-10 unidades, cor obrigatória).');
            } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
              physiotherapyErrors.push('Dados inválidos para fisioterapia. Verifique tempo (1-10 unidades), cor e demais campos.');
            }
          }

          if (physiotherapyErrors.length > 0) {
            errors.push({
              treatmentType: 'physiotherapy',
              errors: physiotherapyErrors
            });
          }
        }

        // Check if we have tens treatments that might have failed
        if (recommendations.tens?.treatments && recommendations.tens.treatments.length > 0) {
          const tensErrors: string[] = [];

          // Use detailed validation messages if available
          if (detailedMessages.length > 0) {
            tensErrors.push(...detailedMessages.map(msg => 
              `Tratamento com TENS: ${msg}`
            ));
          } else {
            // Check for specific validation errors in error message
            if (errorMessage.includes('Attendance with ID') && errorMessage.includes('not found')) {
              tensErrors.push('Erro de dados: atendimento não encontrado. Tente novamente.');
            } else if (errorMessage.toLowerCase().includes('TENS') ||
              errorMessage.toLowerCase().includes('tens')) {
              tensErrors.push(errorMessage);
            } else if (errorMessage.includes('422') || errorMessage.includes('Validation failed')) {
              tensErrors.push('Erro de validação ao criar sessões de tratamento com TENS. Verifique os dados informados.');
            } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
              tensErrors.push('Dados inválidos para tratamento com TENS. Verifique os campos obrigatórios.');
            }
          }

          if (tensErrors.length > 0) {
            errors.push({
              treatmentType: 'tens',
              errors: tensErrors
            });
          }
        }

        // If no specific treatment errors were found but we have recommendations, 
        // create a generic error for the first treatment type
        if (errors.length === 0) {
          if (recommendations.physiotherapy?.treatments && recommendations.physiotherapy.treatments.length > 0) {
            errors.push({
              treatmentType: 'physiotherapy',
              errors: [errorMessage || 'Erro inesperado ao criar sessões de fisioterapia.']
            });
          } else if (recommendations.tens?.treatments && recommendations.tens.treatments.length > 0) {
            errors.push({
              treatmentType: 'tens',
              errors: [errorMessage || 'Erro inesperado ao criar sessões de tratamento com TENS.']
            });
          }
        }
      }
    } catch {
      // Fallback: create generic errors for any treatment types that were requested
      if (recommendations.physiotherapy?.treatments && recommendations.physiotherapy.treatments.length > 0) {
        errors.push({
          treatmentType: 'physiotherapy',
          errors: ['Erro inesperado ao criar sessões de fisioterapia.']
        });
      }
      if (recommendations.tens?.treatments && recommendations.tens.treatments.length > 0) {
        errors.push({
          treatmentType: 'tens',
          errors: ['Erro inesperado ao criar sessões de tratamento com TENS.']
        });
      }
    }

    return errors;
  }, []);

  // Helper function to create treatment plan rows from recommendations (bulk `POST /treatments/bulk`)
  // Now builds session array for bulk creation (eliminates race conditions)
  const createTreatmentsFromRecommendations = useCallback(
    async (
      recommendations: TreatmentRecommendation,
      consultationId: number,
      autoScheduleReturn: boolean
    ): Promise<{ createdTreatmentIds: number[]; createdTreatments: CreatedTreatment[] }> => {
      // Guard against undefined required values
      if (!attendanceId || !patientId) {
        throw new Error("Attendance ID and Patient ID are required for creating treatment plans");
      }

      const treatmentRowsToCreate: CreateTreatmentRequest[] = [];
      const physiotherapyErrors: string[] = [];
      const tensErrors: string[] = [];

      // Validate and build session array for Physiotherapy treatments
      if (
        recommendations.physiotherapy?.treatments &&
        recommendations.physiotherapy.treatments.length > 0
      ) {
        for (const treatment of recommendations.physiotherapy.treatments) {
          // Validate treatment data before processing
          const validationErrors = validateTreatmentData(treatment, 'physiotherapy');
          if (validationErrors.length > 0) {
            physiotherapyErrors.push(...validationErrors);
            continue; // Skip this treatment if validation fails
          }

          // Create a session request for each location in the treatment
          for (const location of treatment.locations) {
            treatmentRowsToCreate.push({
              consultationId: consultationId,
              attendanceId: attendanceId,
              patientId: patientId,
              treatmentType: "physiotherapy" as const,
              bodyLocation: location,
              startDate: treatment.startDate,
              plannedSessions: treatment.quantity,
              durationMinutes: treatment.duration, // Duration is already in 7-minute units
              color: treatment.color,
              notes: "",
            });
          }
        }
      }

      // Validate and build session array for TENS treatments
      if (
        recommendations.tens?.treatments &&
        recommendations.tens.treatments.length > 0
      ) {
        for (const treatment of recommendations.tens.treatments) {
          // Validate treatment data before processing
          const validationErrors = validateTreatmentData(treatment, 'tens');
          if (validationErrors.length > 0) {
            tensErrors.push(...validationErrors);
            continue; // Skip this treatment if validation fails
          }

          // Create a session request for each location in the treatment
          for (const location of treatment.locations) {
            treatmentRowsToCreate.push({
              consultationId: consultationId,
              attendanceId: attendanceId,
              patientId: patientId,
              treatmentType: "tens" as const,
              bodyLocation: location,
              startDate: treatment.startDate,
              plannedSessions: treatment.quantity,
              notes: "",
            });
          }
        }
      }

      // If there are any validation errors, throw them before making API call
      const allErrors = [...physiotherapyErrors, ...tensErrors];
      if (allErrors.length > 0) {
        const errorDetails = {
          physiotherapyErrors,
          tensErrors,
          allErrors
        };
        const error = new Error(allErrors.join("\n\n"));
        (error as Error & { errorDetails: typeof errorDetails }).errorDetails = errorDetails;
        throw error;
      }

      // If no treatment rows to create, return empty result
      if (treatmentRowsToCreate.length === 0) {
        return { createdTreatmentIds: [], createdTreatments: [] };
      }

      try {
        // Use bulk creation endpoint - this is atomic and eliminates race conditions
        const bulkResult = await bulkCreateTreatments({
          treatments: treatmentRowsToCreate,
          consultationId: consultationId,
          autoScheduleReturn: autoScheduleReturn,
          physiotherapyNotes: recommendations.physiotherapy?.notes,
          tensNotes: recommendations.tens?.notes,
        });

        // Check for any failed treatment creations
        if (bulkResult.failedTreatments.length > 0) {
          const failedErrors = bulkResult.failedTreatments.map(
            (failed) => `Erro: ${failed.error}`
          );
          throw new Error(failedErrors.join("\n\n"));
        }

        // Check for return scheduling errors (non-fatal)
        if (bulkResult.returnSchedulingError) {
          // Silently handle - return scheduling is non-critical
        }

        // Transform created treatments to our format for confirmation display
        const mappedCreatedTreatments: CreatedTreatment[] = bulkResult.createdTreatments.map((treatmentRow) => ({
          id: treatmentRow.id,
          consultationId: treatmentRow.consultationId,
          attendanceId: treatmentRow.attendanceId,
          patientId: treatmentRow.patientId,
          treatmentType: treatmentRow.treatmentType,
          bodyLocation: treatmentRow.bodyLocation,
          startDate: treatmentRow.startDate,
          plannedSessions: treatmentRow.plannedSessions,
          completedSessions: treatmentRow.completedSessions,
          status: treatmentRow.status,
          durationMinutes: treatmentRow.durationMinutes,
          color: treatmentRow.color,
          notes: treatmentRow.notes,
          sessions: treatmentRow.sessions,
          createdDate: treatmentRow.createdDate,
          createdTime: treatmentRow.createdTime,
          updatedDate: treatmentRow.updatedDate,
          updatedTime: treatmentRow.updatedTime,
        }));

        const createdTreatmentIds = bulkResult.createdTreatments.map((t) => t.id);

        return { createdTreatmentIds, createdTreatments: mappedCreatedTreatments };
      } catch (error) {
        // Re-throw the error to be handled by the calling function
        throw error;
      }
    },
    [patientId, attendanceId, validateTreatmentData, bulkCreateTreatments]
  );

  // Validation for post-consultation form (assessment attendance completion)
  const validateTreatment = useCallback(
    (data: PostConsultationFormData): string | null => {
      // Main complaint is required
      if (!data.mainComplaint.trim()) {
        return "Principal queixa é obrigatória";
      }

      // General recommendations tab: if not acknowledged as "none apply", must have at least one
      if (!data.noGeneralRecommendations) {
        const hasGeneralRecommendation =
          (data.food?.trim() ?? "").length > 0 ||
          (data.water?.trim() ?? "").length > 0 ||
          (data.ointments?.trim() ?? "").length > 0;
        if (!hasGeneralRecommendation) {
          return "Adicione pelo menos uma recomendação geral (alimentação, água ou pomadas) ou marque que nenhuma se aplica";
        }
      }

      // Treatment recommendations tab: if not acknowledged as "none apply", must have at least one (skip when Alta)
      if (
        data.patientStatus !== "A" &&
        !data.noTreatmentRecommendations
      ) {
        const hasTreatmentRecommendation =
          (data.recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
          (data.recommendations.tens?.treatments.length ?? 0) > 0;
        if (!hasTreatmentRecommendation) {
          return "Adicione pelo menos um tratamento de fisioterapia ou TENS ou marque que nenhum se aplica";
        }
      }

      // Return weeks validation
      if (data.returnWeeks < 0 || data.returnWeeks > 52) {
        return "Semanas para retorno deve estar entre 0 e 52";
      }

      // Start date validation
      if (data.startDate > today) {
        return "Data de cadastro não pode ser futura";
      }

      // If physiotherapy is recommended, validate required fields
      if (data.recommendations.physiotherapy && data.recommendations.physiotherapy.treatments.length > 0) {
        const { treatments } = data.recommendations.physiotherapy;

        // Validate each treatment
        for (const treatment of treatments) {
          if (!treatment.locations || treatment.locations.length === 0) {
            return "Todos os locais da fisioterapia devem ser especificados";
          }
          if (!treatment.color) {
            return "Cor da fisioterapia é obrigatória para todos os locais";
          }
          if (treatment.duration < 1 || treatment.duration > 10) {
            return "Tempo da fisioterapia deve estar entre 1 e 10 unidades (7-70 minutos)";
          }
          if (treatment.quantity < 1 || treatment.quantity > 20) {
            return "Quantidade de fisioterapia deve estar entre 1 e 20";
          }
        }
      }

      // If tens is recommended, validate required fields
      if (data.recommendations.tens && data.recommendations.tens.treatments.length > 0) {
        const { treatments } = data.recommendations.tens;

        // Validate each treatment
        for (const treatment of treatments) {
          if (!treatment.locations || treatment.locations.length === 0) {
            return "Todos os locais do tratamento com TENS devem ser especificados";
          }
          if (treatment.quantity < 1 || treatment.quantity > 20) {
            return "Quantidade de tratamentos com TENS deve estar entre 1 e 20";
          }
        }
      }

      // Treatment start dates must fall on days with available slots (Fisioterapia / TENS)
      const hasTreatments =
        (data.recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
        (data.recommendations.tens?.treatments.length ?? 0) > 0;
      if (
        hasTreatments &&
        hasInvalidTreatmentStartDates(
          scheduleSettings ?? undefined,
          data.recommendations.physiotherapy?.treatments,
          data.recommendations.tens?.treatments,
        )
      ) {
        return TREATMENT_SLOTS_UNAVAILABLE_MESSAGE;
      }

      return null;
    },
    [today, scheduleSettings]
  );

  // Submit: save consultation, then bulk-create physiotherapy / tens treatment plans when applicable
  const handleFormSubmit = useCallback(
    async (data: PostConsultationFormData) => {
      try {
        if (!attendanceId) {
          throw new Error("Attendance ID is required for treatment submission");
        }
        const result = await submitConsultation(data, attendanceId);

        if (!result) {
          throw new Error("Falha ao registrar a consulta");
        }

        // Log if this was a retry scenario (existing consultation was updated)
        if (result.isUpdate) {
          console.log(`[Retry Success] Updated existing consultation ${result.consultationId}; retrying treatment plan creation`);
        }

        // MedicalDischarge: do not create physiotherapy/tens sessions or schedule return
        if (data.patientStatus === "A") {
          setCreatedTreatments([]);
          setCancelledAttendances(result.cancelledAttendances ?? []);
          if (onComplete) onComplete([]);
          setShowConfirmation(true);
          setShouldFetchAttendances(true);
          return;
        }

        // Then, bulk-create physiotherapy / tens treatment plans from recommendations
        try {
          // Determine if we should auto-schedule return
          const autoScheduleReturn = data.recommendations.returnWhenTreatmentComplete;

          // Use bulk creation to eliminate race conditions
          const { createdTreatmentIds, createdTreatments: newTreatments } = await createTreatmentsFromRecommendations(
            data.recommendations,
            result.consultationId,
            autoScheduleReturn
          );

          // Store created treatment plans for confirmation display
          setCreatedTreatments(newTreatments);

          // Handle legacy mode return scheduling (if not using auto-schedule)
          // (Status "A" already returned above, so we only reach here when not discharged)
          if (!autoScheduleReturn && data.recommendations.returnWeeks > 0) {
            await scheduleReturn({
              consultationId: result.consultationId,
              mode: 'legacy',
            });
          }

          // Always notify parent component about completion (for card movement)
          // Even if no additional treatment plans were created
          if (onComplete) {
            onComplete(createdTreatmentIds);
          }

          // Always show confirmation view after a successful consultation save
          // Even if no additional treatment plans were created
          setShowConfirmation(true);

          // Trigger fetching of newly scheduled attendances
          setShouldFetchAttendances(true);
        } catch (sessionError) {
          // Handle bulk treatment creation errors specifically
          // Note: We DON'T close the modal here - let the user see the error and decide

          // Parse the error and convert it to TreatmentCreationError format
          const parsedErrors = parseTreatmentCreationErrors(sessionError, data.recommendations);

          if (parsedErrors.length > 0) {
            setTreatmentCreationErrors(parsedErrors);
            setShowErrors(true);
            // Modal stays open to show the error view
          } else {
            // If we can't parse the error, show it as a general error
            throw sessionError;
          }

          // ❌ REMOVED: handleCancel() was closing modal before user could see error
          // The error view (TreatmentCreationErrors component) will provide:
          // - "Retry" button (retryTreatmentCreation callback)
          // - "Continue" button (handleErrorContinue in modal)
        }
      } catch (error) {
        // If consultation submission fails, do not create treatment plans
        // The error will be handled by the form handler
        throw error;
      }
    },
    [
      createTreatmentsFromRecommendations,
      onComplete,
      parseTreatmentCreationErrors,
      attendanceId,
      submitConsultation,
      scheduleReturn,
    ]
  );

  const {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isLoading: formLoading,
    error,
    clearError,
  } = useFormHandler<PostConsultationFormData>({
    initialState: {
      mainComplaint: "",
      patientStatus: "T", // Default to "T - Em tratamento"
      startDate: today,
      returnWeeks: 1, // Default to 1 week, will be updated from database
      food: "",
      water: "",
      ointments: "",
      recommendations: {
        returnWeeks: 1,
        returnWhenTreatmentComplete: false,
      },
      notes: "",
      noGeneralRecommendations: false,
      noTreatmentRecommendations: false,
    },
    onSubmit: handleFormSubmit,
    validate: validateTreatment,
    formatters: {
      returnWeeks: (value: unknown) =>
        Math.max(0, Math.min(52, parseInt(String(value)) || 0)),
    },
  });

  const isLoading = externalLoading || formLoading || fetchingPatient || fetchingConsultation;

  // Function to reset error state
  const resetErrors = useCallback(() => {
    setShowErrors(false);
    setTreatmentCreationErrors([]);
  }, []);

  // Function to reset confirmation state
  const resetConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setCreatedTreatments([]);
    setShouldFetchAttendances(false);
    setCancelledAttendances([]);
  }, []);

  // Initialize/update form data when modal opens or when data loads
  // This consolidated effect prevents race conditions between multiple data sources
  useEffect(() => {
    if (!attendanceId || !patientId) return;

    // Determine the main complaint: patient value, then latest consultation, then empty
    const mainComplaint = patient?.mainComplaint || latestConsultation?.mainComplaint || "";

    // Determine return weeks: latest consultation if present, otherwise default to 1
    const returnWeeks = latestConsultation?.returnWeeks || 1;
    const returnWhenTreatmentComplete = false;

    // Determine the start date: use patient's start date if available, otherwise today for new patients
    const startDate = patient?.startDate
      ? patient.startDate // Already YYYY-MM-DD string
      : currentTreatmentStatus === "N"
        ? today
        : today;

    setFormData({
      mainComplaint,
      patientStatus: currentTreatmentStatus as PatientStatusValue,
      startDate,
      returnWeeks,
      food: "",
      water: "",
      ointments: "",
      recommendations: {
        returnWeeks,
        returnWhenTreatmentComplete,
      },
      notes: "",
      noGeneralRecommendations: false,
      noTreatmentRecommendations: false,
    });

    // Reset confirmation and error states when modal opens with new data
    resetConfirmation();
    resetErrors();
  }, [
    attendanceId,
    patientId,
    latestConsultation,
    patient,
    currentTreatmentStatus,
    today,
    setFormData,
    resetConfirmation,
    resetErrors
  ]); // resetConfirmation and resetErrors are stable (useCallback with []) so no need to include

  const handleRecommendationsChange = useCallback(
    (recommendations: TreatmentRecommendation) => {
      setFormData((prev) => ({
        ...prev,
        // Keep top-level returnWeeks in sync with recommendations.returnWeeks
        returnWeeks: recommendations.returnWeeks,
        recommendations,
      }));
      if (error) clearError();
    },
    [setFormData, error, clearError]
  );

  const handleDateChange = useCallback(
    (field: "startDate") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value || today;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) clearError();
      },
    [setFormData, error, clearError, today]
  );

  // Format date for input field (already in YYYY-MM-DD format)
  const formatDateForInput = (date: string) => {
    return date;
  };

  // Get treatment status label
  const getTreatmentStatusLabel = (status: PatientStatusValue) => {
    const labels: Record<PatientStatusValue, string> = {
      N: "Novo paciente",
      T: "Em tratamento",
      A: "Alta do tratamento",
      F: "Faltas consecutivas",
    };
    return labels[status];
  };

  // Function to retry bulk treatment plan creation after validation/API errors
  const retryTreatmentCreation = useCallback(() => {
    resetErrors();
    // Note: This would typically trigger a new submission attempt
    // The actual retry logic would depend on how the form is structured
  }, [resetErrors]);

  return {
    // Form state and handlers
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    handleRecommendationsChange,
    handleDateChange,
    handleCancel,

    // Patient data (from React Query, transformed back to DTO format for compatibility)
    patientData: patient ? ((): PatientResponseDto => {
      // Transform priority from "1"|"2"|"3" to PatientPriority enum
      // PatientPriority enum values are '1', '2', '3'
      const priority = patient.priority as PatientPriority;

      // Transform status from "N"|"T"|"A"|"F" to PatientStatus enum
      const patient_status_enum = patient.status as unknown as PatientStatus;

      return {
        id: parseInt(patient.id),
        name: patient.name,
        phone: patient.phone || undefined,
        priority,
        patientStatus: patient_status_enum,
        birthDate: patient.birthDate || undefined,
        mainComplaint: patient.mainComplaint || undefined,
        dischargeDate: patient.dischargeDate || undefined,
        startDate: patient.startDate || getTodayClinic(),
        missingAppointmentsStreak: 0, // Default value, not available in Patient type
        createdAt: new Date().toISOString(), // Default value, not available in Patient type
        updatedAt: new Date().toISOString(), // Default value, not available in Patient type
      };
    })() : null,
    fetchingPatient,
    fetchError,
    setFetchError: () => { }, // No-op since React Query handles errors

    // Loading states
    isLoading,

    // Error handling
    error,
    clearError,

    // Confirmation states
    showConfirmation,
    createdTreatments,
    resetConfirmation,
    cancelledAttendances,
    newlyScheduledAttendances,
    fetchingAttendances,
    attendancesError,

    // Error states
    showErrors,
    treatmentCreationErrors,
    resetErrors,
    retryTreatmentCreation,

    // Utility functions
    formatDateForInput,
    getTreatmentStatusLabel,

    // Current treatment status
    currentTreatmentStatus,
  };
}
