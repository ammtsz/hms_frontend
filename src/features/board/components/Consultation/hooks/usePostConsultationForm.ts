import { useCallback, useMemo, useState, useEffect } from "react";
import { useFormHandler } from "@/features/board/components/Consultation/hooks/useFormHandler";
import type {
  CreateTreatmentRequest,
  PatientResponseDto,
  PatientPriority,
  PatientStatus,
  CancelledAppointmentItemDto,
} from "@/api/types";
import type {
  TreatmentRecommendation,
  LocationTreatment,
} from "../types";
import {
  isValidTreatmentDuration,
} from "@/constants/treatment";
import type { CreatedTreatment } from "../components/CreatedTreatmentsConfirmation";
import type { TreatmentCreationError } from "../components/TreatmentCreationErrors";
import { useCloseModal, usePostConsultationModal } from "@/stores/modalStore";
import { useConsultationSubmission } from "./useConsultationSubmission";
import {
  usePatient,
  useNewlyScheduledAppointments,
} from "@/api/query/hooks/usePatientQueries";
import { useBulkCreateTreatments } from "@/api/query/hooks/useTreatmentTrackingQueries";
import {
  useLatestConsultationByPatient,
  useScheduleReturnAppointment,
} from "@/api/query/hooks/useConsultationQueries";
import {
  useScheduleSettings,
  hasInvalidTreatmentStartDates,
  TREATMENT_SLOTS_UNAVAILABLE_MESSAGE,
} from "@/api/query/hooks/useScheduleSettingQueries";
import { getTodayClinic } from "@/utils/timezoneDate";
import { getTreatmentStatusLabel } from "@/utils/patientUtils";
import { ERROR_MESSAGE } from "@/api/utils/messages";

// Patient lifecycle status (N/T/D/C) for consultation form
export type PatientStatusValue = "N" | "T" | "D" | "C";

export interface PostConsultationFormData {
  // Main form fields from requirements
  mainConcern: string;
  patientStatus: PatientStatusValue;
  startDate: string;
  returnWeeks: number;

  // Recommendations section (reusing existing structure)
  homeExercises: string;
  painManagement: string;
  medications: string;
  recommendations: TreatmentRecommendation;
  notes: string;

  // Tab acknowledgment checkboxes - prevent accidental submit without reviewing tabs
  noGeneralRecommendations: boolean;
  noTreatmentRecommendations: boolean;
}

export function usePostConsultationForm() {
  // Get store state and actions
  const {
    appointmentId,
    patientId,
    currentTreatmentStatus,
    isLoading: externalLoading = false,
    onComplete,
  } = usePostConsultationModal();
  const closeModal = useCloseModal();

  const { mutateAsync: scheduleReturn } = useScheduleReturnAppointment();

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

  // Fetch latest consultation for this PATIENT (not appointment) to pre-fill form
  // Uses the most recent consultation for defaults such as return weeks.
  const { data: latestConsultation, isLoading: fetchingConsultation } =
    useLatestConsultationByPatient(patientId?.toString() || "");

  // Convert React Query error to string for compatibility
  const fetchError = patientQueryError
    ? (patientQueryError as Error).message
    : null;

  // State for confirmation (created treatment plans + scheduling summary)
  const [createdTreatments, setCreatedTreatments] = useState<
    CreatedTreatment[]
  >([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shouldFetchAppointments, setShouldFetchAppointments] = useState(false);
  const [cancelledAppointments, setCancelledAppointments] = useState<
    CancelledAppointmentItemDto[]
  >([]);

  // State for bulk treatment creation error handling
  const [treatmentCreationErrors, setTreatmentCreationErrors] = useState<
    TreatmentCreationError[]
  >([]);
  const [showErrors, setShowErrors] = useState(false);

  // Fetch newly scheduled appointments after treatment creation
  const {
    data: newlyScheduledAppointments,
    isLoading: fetchingAppointments,
    error: appointmentsError,
  } = useNewlyScheduledAppointments(
    patientId?.toString(),
    shouldFetchAppointments, // Only fetch when explicitly enabled
  );

  // Get current date as string for default values (memoized to prevent dependency changes)
  const today = useMemo(() => getTodayClinic(), []);

  const handleCancel = useCallback(() => {
    closeModal("postConsultation");
  }, [closeModal]);

  // Helper function to validate treatment data before sending to backend
  const validateTreatmentData = useCallback(
    (treatment: LocationTreatment): string[] => {
      const errors: string[] = [];

      if (!isValidTreatmentDuration(treatment.duration)) {
        errors.push(
          `Duration must be 30, 45, or 60 minutes. Current value: ${treatment.duration}`,
        );
      }

      if (
        !treatment.quantity ||
        treatment.quantity < 1 ||
        treatment.quantity > 50
      ) {
        errors.push(
          `Number of sessions must be between 1 and 50. Current value: ${treatment.quantity}`,
        );
      }

      if (!treatment.startDate || treatment.startDate.trim() === "") {
        errors.push("Registration date is required.");
      }

      if (!treatment.locations || treatment.locations.length === 0) {
        errors.push("At least one body location must be selected.");
      }

      return errors;
    },
    [],
  );

  // Helper function to parse bulk treatment creation errors into the format expected by TreatmentCreationErrors
  const parseTreatmentCreationErrors = useCallback(
    (
      error: unknown,
      recommendations: TreatmentRecommendation,
    ): TreatmentCreationError[] => {
      const errors: TreatmentCreationError[] = [];

      try {
        // Check if the error has structured error details from our collection
        const errorDetails = (
          error as {
            errorDetails?: {
              physiotherapyErrors: string[];
              tensErrors: string[];
              allErrors: string[];
            };
          }
        )?.errorDetails;

        if (errorDetails) {
          // Use the structured errors we collected
          if (
            errorDetails.physiotherapyErrors &&
            errorDetails.physiotherapyErrors.length > 0
          ) {
            errors.push({
              treatmentType: "physiotherapy",
              errors: errorDetails.physiotherapyErrors,
            });
          }

          if (errorDetails.tensErrors && errorDetails.tensErrors.length > 0) {
            errors.push({
              treatmentType: "tens",
              errors: errorDetails.tensErrors,
            });
          }
        } else {
          // Fallback to parsing the error message/response
          const rawMessage =
            error instanceof Error ? error.message : String(error);
          // Map generic API 400 message to user-friendly slot message in session creation context
          const errorMessage =
            rawMessage === ERROR_MESSAGE.BAD_REQUEST
              ? TREATMENT_SLOTS_UNAVAILABLE_MESSAGE
              : rawMessage;

          // Try to extract validation details from API error response
          const apiError = error as {
            response?: {
              data?: {
                message?: string | string[];
                details?: Array<{
                  field: string;
                  value: unknown;
                  constraints: Record<string, string>;
                }>;
              };
            };
          };

          let detailedMessages: string[] = [];

          // Parse backend validation error details if available (422 responses)
          if (apiError.response?.data?.details) {
            detailedMessages = apiError.response.data.details.map((detail) => {
              const fieldName = detail.field;
              const constraints = Object.values(detail.constraints || {});
              return `${fieldName}: ${constraints.join(", ")}`;
            });
          } else if (apiError.response?.data?.message) {
            // Handle message array from backend
            const messages = Array.isArray(apiError.response.data.message)
              ? apiError.response.data.message
              : [apiError.response.data.message];
            detailedMessages = messages;
          }

          // Check if we have physiotherapy treatments that might have failed
          if (
            recommendations.physiotherapy?.treatments &&
            recommendations.physiotherapy.treatments.length > 0
          ) {
            const physiotherapyErrors: string[] = [];

            // Use detailed validation messages if available
            if (detailedMessages.length > 0) {
              physiotherapyErrors.push(
                ...detailedMessages.map((msg) => `Physiotherapy: ${msg}`),
              );
            } else {
              // Check for specific validation errors in error message
              if (
                errorMessage.includes(
                  "duration_minutes must not be greater than 60",
                ) ||
                errorMessage.includes(
                  "duration_minutes must not be less than 30",
                )
              ) {
                physiotherapyErrors.push(
                  "Duration must be 30, 45, or 60 minutes. Check the values provided.",
                );
              } else if (
                errorMessage.includes("Appointment with ID") &&
                errorMessage.includes("not found")
              ) {
                physiotherapyErrors.push(
                  "Data error: appointment not found. Please try again.",
                );
              } else if (errorMessage.toLowerCase().includes("physiotherapy")) {
                physiotherapyErrors.push(errorMessage);
              } else if (
                errorMessage.includes("422") ||
                errorMessage.includes("Validation failed")
              ) {
                physiotherapyErrors.push(
                  "Validation error when creating physiotherapy sessions. Please check the provided data (duration: 30, 45, or 60 minutes).",
                );
              } else if (
                errorMessage.includes("400") ||
                errorMessage.includes("Bad Request")
              ) {
                physiotherapyErrors.push(
                  "Invalid data for physiotherapy. Check duration (30, 45, or 60 minutes) and other fields.",
                );
              }
            }

            if (physiotherapyErrors.length > 0) {
              errors.push({
                treatmentType: "physiotherapy",
                errors: physiotherapyErrors,
              });
            }
          }

          // Check if we have tens treatments that might have failed
          if (
            recommendations.tens?.treatments &&
            recommendations.tens.treatments.length > 0
          ) {
            const tensErrors: string[] = [];

            // Use detailed validation messages if available
            if (detailedMessages.length > 0) {
              tensErrors.push(
                ...detailedMessages.map((msg) => `TENS Treatment: ${msg}`),
              );
            } else {
              // Check for specific validation errors in error message
              if (
                errorMessage.includes("Appointment with ID") &&
                errorMessage.includes("not found")
              ) {
                tensErrors.push(
                  "Data error: appointment not found. Please try again.",
                );
              } else if (
                errorMessage.toLowerCase().includes("TENS") ||
                errorMessage.toLowerCase().includes("tens")
              ) {
                tensErrors.push(errorMessage);
              } else if (
                errorMessage.includes("422") ||
                errorMessage.includes("Validation failed")
              ) {
                tensErrors.push(
                  "Validation error when creating TENS sessions. Please check the provided data.",
                );
              } else if (
                errorMessage.includes("400") ||
                errorMessage.includes("Bad Request")
              ) {
                tensErrors.push(
                  "Invalid data for TENS treatment. Check required fields.",
                );
              }
            }

            if (tensErrors.length > 0) {
              errors.push({
                treatmentType: "tens",
                errors: tensErrors,
              });
            }
          }

          // If no specific treatment errors were found but we have recommendations,
          // create a generic error for the first treatment type
          if (errors.length === 0) {
            if (
              recommendations.physiotherapy?.treatments &&
              recommendations.physiotherapy.treatments.length > 0
            ) {
              errors.push({
                treatmentType: "physiotherapy",
                errors: [
                  errorMessage ||
                    "Unexpected error occurred while creating physiotherapy sessions.",
                ],
              });
            } else if (
              recommendations.tens?.treatments &&
              recommendations.tens.treatments.length > 0
            ) {
              errors.push({
                treatmentType: "tens",
                errors: [
                  errorMessage ||
                    "Unexpected error occurred while creating TENS sessions.",
                ],
              });
            }
          }
        }
      } catch {
        // Fallback: create generic errors for any treatment types that were requested
        if (
          recommendations.physiotherapy?.treatments &&
          recommendations.physiotherapy.treatments.length > 0
        ) {
          errors.push({
            treatmentType: "physiotherapy",
            errors: [
              "Unexpected error occurred while creating physiotherapy sessions.",
            ],
          });
        }
        if (
          recommendations.tens?.treatments &&
          recommendations.tens.treatments.length > 0
        ) {
          errors.push({
            treatmentType: "tens",
            errors: ["Unexpected error occurred while creating TENS sessions."],
          });
        }
      }

      return errors;
    },
    [],
  );

  // Helper function to create treatment plan rows from recommendations (bulk `POST /treatments/bulk`)
  // Now builds session array for bulk creation (eliminates race conditions)
  const createTreatmentsFromRecommendations = useCallback(
    async (
      recommendations: TreatmentRecommendation,
      consultationId: number,
      autoScheduleReturn: boolean,
    ): Promise<{
      createdTreatmentIds: number[];
      createdTreatments: CreatedTreatment[];
    }> => {
      // Guard against undefined required values
      if (!appointmentId || !patientId) {
        throw new Error(
          "Appointment ID and Patient ID are required for creating treatment plans",
        );
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
          const validationErrors = validateTreatmentData(treatment);
          if (validationErrors.length > 0) {
            physiotherapyErrors.push(...validationErrors);
            continue;
          }

          for (const location of treatment.locations) {
            treatmentRowsToCreate.push({
              consultationId: consultationId,
              appointmentId: appointmentId,
              patientId: patientId,
              treatmentType: "physiotherapy" as const,
              bodyLocation: location,
              startDate: treatment.startDate,
              plannedSessions: treatment.quantity,
              durationMinutes: treatment.duration,
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
          const validationErrors = validateTreatmentData(treatment);
          if (validationErrors.length > 0) {
            tensErrors.push(...validationErrors);
            continue;
          }

          for (const location of treatment.locations) {
            treatmentRowsToCreate.push({
              consultationId: consultationId,
              appointmentId: appointmentId,
              patientId: patientId,
              treatmentType: "tens" as const,
              bodyLocation: location,
              startDate: treatment.startDate,
              plannedSessions: treatment.quantity,
              durationMinutes: treatment.duration,
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
          allErrors,
        };
        const error = new Error(allErrors.join("\n\n"));
        (error as Error & { errorDetails: typeof errorDetails }).errorDetails =
          errorDetails;
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
            (failed) => `Error: ${failed.error}`,
          );
          throw new Error(failedErrors.join("\n\n"));
        }

        // Check for return scheduling errors (non-fatal)
        if (bulkResult.returnSchedulingError) {
          // Silently handle - return scheduling is non-critical
        }

        // Transform created treatments to our format for confirmation display
        const mappedCreatedTreatments: CreatedTreatment[] =
          bulkResult.createdTreatments.map((treatmentRow) => ({
            id: treatmentRow.id,
            consultationId: treatmentRow.consultationId,
            appointmentId: treatmentRow.appointmentId,
            patientId: treatmentRow.patientId,
            treatmentType: treatmentRow.treatmentType,
            bodyLocation: treatmentRow.bodyLocation,
            startDate: treatmentRow.startDate,
            plannedSessions: treatmentRow.plannedSessions,
            completedSessions: treatmentRow.completedSessions,
            status: treatmentRow.status,
            durationMinutes: treatmentRow.durationMinutes,
            notes: treatmentRow.notes,
            sessions: treatmentRow.sessions,
            createdDate: treatmentRow.createdDate,
            createdTime: treatmentRow.createdTime,
            updatedDate: treatmentRow.updatedDate,
            updatedTime: treatmentRow.updatedTime,
          }));

        const createdTreatmentIds = bulkResult.createdTreatments.map(
          (t) => t.id,
        );

        return {
          createdTreatmentIds,
          createdTreatments: mappedCreatedTreatments,
        };
      } catch (error) {
        // Re-throw the error to be handled by the calling function
        throw error;
      }
    },
    [patientId, appointmentId, validateTreatmentData, bulkCreateTreatments],
  );

  // Validation for post-consultation form (assessment appointment completion)
  const validateTreatment = useCallback(
    (data: PostConsultationFormData): string | null => {
      // Main concern is required
      if (!data.mainConcern.trim()) {
        return "Main complaint is required";
      }

      // General recommendations tab: if not acknowledged as "none apply", must have at least one
      if (!data.noGeneralRecommendations) {
        const hasGeneralRecommendation =
          (data.homeExercises?.trim() ?? "").length > 0 ||
          (data.painManagement?.trim() ?? "").length > 0 ||
          (data.medications?.trim() ?? "").length > 0;
        if (!hasGeneralRecommendation) {
          return "Add at least one general recommendation (home exercises, pain management, or medications) or mark none apply";
        }
      }

      // Treatment recommendations tab: if not acknowledged as "none apply", must have at least one (skip when Discharged (D))
      if (data.patientStatus !== "D" && !data.noTreatmentRecommendations) {
        const hasTreatmentRecommendation =
          (data.recommendations.physiotherapy?.treatments.length ?? 0) > 0 ||
          (data.recommendations.tens?.treatments.length ?? 0) > 0;
        if (!hasTreatmentRecommendation) {
          return "Add at least one physiotherapy or TENS treatment or mark none apply";
        }
      }

      // Return weeks validation
      if (data.returnWeeks < 0 || data.returnWeeks > 52) {
        return "Return weeks must be between 0 and 52";
      }

      // Start date validation
      if (data.startDate > today) {
        return "Registration date cannot be future";
      }

      // If physiotherapy is recommended, validate required fields
      if (
        data.recommendations.physiotherapy &&
        data.recommendations.physiotherapy.treatments.length > 0
      ) {
        const { treatments } = data.recommendations.physiotherapy;

        // Validate each treatment
        for (const treatment of treatments) {
          if (!treatment.locations || treatment.locations.length === 0) {
            return "All physiotherapy locations must be specified";
          }
          if (!isValidTreatmentDuration(treatment.duration)) {
            return "Physiotherapy duration must be 30, 45, or 60 minutes";
          }
          if (treatment.quantity < 1 || treatment.quantity > 20) {
            return "Physiotherapy quantity must be between 1 and 20";
          }
        }
      }

      // If tens is recommended, validate required fields
      if (
        data.recommendations.tens &&
        data.recommendations.tens.treatments.length > 0
      ) {
        const { treatments } = data.recommendations.tens;

        // Validate each treatment
        for (const treatment of treatments) {
          if (!treatment.locations || treatment.locations.length === 0) {
            return "All TENS treatment locations must be specified";
          }
          if (!isValidTreatmentDuration(treatment.duration)) {
            return "TENS duration must be 30, 45, or 60 minutes";
          }
          if (treatment.quantity < 1 || treatment.quantity > 20) {
            return "TENS treatment quantity must be between 1 and 20";
          }
        }
      }

      // Treatment start dates must fall on days with available slots (Physiotherapy / TENS)
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
    [today, scheduleSettings],
  );

  // Submit: save consultation, then bulk-create physiotherapy / tens treatment plans when applicable
  const handleFormSubmit = useCallback(
    async (data: PostConsultationFormData) => {
      try {
        if (!appointmentId) {
          throw new Error("Appointment ID is required for treatment submission");
        }
        const result = await submitConsultation(data, appointmentId);

        if (!result) {
          throw new Error("Failed to register the consultation");
        }

        // Log if this was a retry scenario (existing consultation was updated)
        if (result.isUpdate) {
          console.log(
            `[Retry Success] Updated existing consultation ${result.consultationId}; retrying treatment plan creation`,
          );
        }

        // MedicalDischarge: do not create physiotherapy/tens sessions or schedule return
        if (data.patientStatus === "D") {
          setCreatedTreatments([]);
          setCancelledAppointments(result.cancelledAppointments ?? []);
          if (onComplete) onComplete([]);
          setShowConfirmation(true);
          setShouldFetchAppointments(true);
          return;
        }

        // Then, bulk-create physiotherapy / tens treatment plans from recommendations
        try {
          // Determine if we should auto-schedule return
          const autoScheduleReturn =
            data.recommendations.returnWhenTreatmentComplete;

          // Use bulk creation to eliminate race conditions
          const { createdTreatmentIds, createdTreatments: newTreatments } =
            await createTreatmentsFromRecommendations(
              data.recommendations,
              result.consultationId,
              autoScheduleReturn,
            );

          // Store created treatment plans for confirmation display
          setCreatedTreatments(newTreatments);

          // Handle legacy mode return scheduling (if not using auto-schedule)
          // (Status "D" already returned above, so we only reach here when not discharged)
          if (!autoScheduleReturn && data.recommendations.returnWeeks > 0) {
            await scheduleReturn({
              consultationId: result.consultationId,
              mode: "legacy",
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

          // Trigger fetching of newly scheduled appointments
          setShouldFetchAppointments(true);
        } catch (sessionError) {
          // Handle bulk treatment creation errors specifically
          // Note: We DON'T close the modal here - let the user see the error and decide

          // Parse the error and convert it to TreatmentCreationError format
          const parsedErrors = parseTreatmentCreationErrors(
            sessionError,
            data.recommendations,
          );

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
      appointmentId,
      submitConsultation,
      scheduleReturn,
    ],
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
      mainConcern: "",
      patientStatus: "T", // Default to "T - In Treatment""
      startDate: today,
      returnWeeks: 1, // Default to 1 week, will be updated from database
      homeExercises: "",
      painManagement: "",
      medications: "",
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

  const isLoading =
    externalLoading || formLoading || fetchingPatient || fetchingConsultation;

  // Function to reset error state
  const resetErrors = useCallback(() => {
    setShowErrors(false);
    setTreatmentCreationErrors([]);
  }, []);

  // Function to reset confirmation state
  const resetConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setCreatedTreatments([]);
    setShouldFetchAppointments(false);
    setCancelledAppointments([]);
  }, []);

  // Initialize/update form data when modal opens or when data loads
  // This consolidated effect prevents race conditions between multiple data sources
  useEffect(() => {
    if (!appointmentId || !patientId) return;

    // Determine the main concern: patient value, then latest consultation, then empty
    const mainConcern =
      patient?.mainConcern || latestConsultation?.mainConcern || "";

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
      mainConcern,
      patientStatus: currentTreatmentStatus as PatientStatusValue,
      startDate,
      returnWeeks,
      homeExercises: "",
      painManagement: "",
      medications: "",
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
    appointmentId,
    patientId,
    latestConsultation,
    patient,
    currentTreatmentStatus,
    today,
    setFormData,
    resetConfirmation,
    resetErrors,
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
    [setFormData, error, clearError],
  );

  const handleDateChange = useCallback(
    (field: "startDate") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || today;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (error) clearError();
    },
    [setFormData, error, clearError, today],
  );

  // Format date for input field (already in YYYY-MM-DD format)
  const formatDateForInput = (date: string) => {
    return date;
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
    patientData: patient
      ? ((): PatientResponseDto => {
          // Transform priority from "1"|"2"|"3" to PatientPriority enum
          // PatientPriority enum values are '1', '2', '3'
          const priority = patient.priority as PatientPriority;

          // Transform status from "N"|"T"|"D"|"C" to PatientStatus enum
          const patient_status_enum =
            patient.status as unknown as PatientStatus;

          return {
            id: parseInt(patient.id),
            name: patient.name,
            phone: patient.phone || undefined,
            priority,
            patientStatus: patient_status_enum,
            birthDate: patient.birthDate || undefined,
            mainConcern: patient.mainConcern || undefined,
            dischargeDate: patient.dischargeDate || undefined,
            startDate: patient.startDate || getTodayClinic(),
            missingAppointmentsStreak: 0, // Default value, not available in Patient type
            createdAt: new Date().toISOString(), // Default value, not available in Patient type
            updatedAt: new Date().toISOString(), // Default value, not available in Patient type
          };
        })()
      : null,
    fetchingPatient,
    fetchError,
    setFetchError: () => {}, // No-op since React Query handles errors

    // Loading states
    isLoading,

    // Error handling
    error,
    clearError,

    // Confirmation states
    showConfirmation,
    createdTreatments,
    resetConfirmation,
    cancelledAppointments,
    newlyScheduledAppointments,
    fetchingAppointments,
    appointmentsError,

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
