import { useCallback } from "react";
import {
  useCreateConsultation,
  useUpdateConsultation,
  useFetchConsultationByAttendance,
} from "@/api/query/hooks/useConsultationQueries";
import type {
  CreateConsultationRequest,
  UpdateConsultationRequest,
  CancelledAttendanceItemDto,
} from "@/api/types";
import type { PostConsultationFormData } from "./usePostAttendanceForm";
import { AxiosError } from "axios";

/**
 * Creates or updates a consultation for post-attendance flow.
 * On 409 (consultation already exists for attendance), fetches and PATCHes instead.
 */
export const useConsultationSubmission = () => {
  const createConsultationMutation = useCreateConsultation();
  const updateConsultationMutation = useUpdateConsultation();
  const fetchConsultationByAttendance = useFetchConsultationByAttendance();

  const submitConsultation = useCallback(
    async (
      data: PostConsultationFormData,
      attendanceId: number,
    ): Promise<{
      consultationId: number;
      isUpdate: boolean;
      cancelledAttendances?: CancelledAttendanceItemDto[];
    }> => {
      try {
        const consultationRequest: CreateConsultationRequest = {
          attendanceId: attendanceId,
          mainComplaint: data.mainComplaint,
          patientStatus: data.patientStatus,
          food: data.food,
          water: data.water,
          ointments: data.ointments,
          returnWeeks: data.recommendations.returnWeeks,
          returnWhenTreatmentComplete: data.recommendations.returnWhenTreatmentComplete,
          notes: data.notes,
          physiotherapy:
            data.recommendations.physiotherapy?.treatments &&
            data.recommendations.physiotherapy.treatments.length > 0,
          tens:
            data.recommendations.tens?.treatments &&
            data.recommendations.tens.treatments.length > 0,
        };

        try {
          const response = await createConsultationMutation.mutateAsync(
            consultationRequest,
          );

          if (!response?.consultation?.id) {
            throw new Error("Failed to create consultation: ID not returned");
          }

          return {
            consultationId: response.consultation.id,
            isUpdate: false,
            cancelledAttendances: response.cancelledAttendances,
          };
        } catch (createError) {
          const axiosErr =
            (createError as { axiosError?: AxiosError })?.axiosError ||
            (createError as AxiosError);
          const isConflict = axiosErr?.response?.status === 409;

          if (!isConflict) {
            throw createError;
          }

          console.log(
            `[Retry] 409: consultation exists for attendance ${attendanceId}, updating…`,
          );

          const consultationFetchResult = await fetchConsultationByAttendance(
            attendanceId,
            { staleTime: 0 },
          );

          if (!consultationFetchResult.success || !consultationFetchResult.value) {
            throw new Error("Failed to fetch existing consultation for retry");
          }

          const existingConsultation = consultationFetchResult.value;

          const updateRequest: UpdateConsultationRequest = {
            mainComplaint: data.mainComplaint,
            patientStatus: data.patientStatus,
            food: data.food,
            water: data.water,
            ointments: data.ointments,
            returnWeeks: data.recommendations.returnWeeks,
            returnWhenTreatmentComplete: data.recommendations.returnWhenTreatmentComplete,
            notes: data.notes,
            physiotherapy:
              data.recommendations.physiotherapy?.treatments &&
              data.recommendations.physiotherapy.treatments.length > 0,
            tens:
              data.recommendations.tens?.treatments &&
              data.recommendations.tens.treatments.length > 0,
          };

          const updateResponse = await updateConsultationMutation.mutateAsync({
            id: existingConsultation.id.toString(),
            data: updateRequest,
          });

          return {
            consultationId: existingConsultation.id,
            isUpdate: true,
            cancelledAttendances: updateResponse.cancelledAttendances,
          };
        }
      } catch (error) {
        console.error("Error submitting consultation:", error);
        throw error;
      }
    },
    [
      createConsultationMutation,
      updateConsultationMutation,
      fetchConsultationByAttendance,
    ],
  );

  return {
    submitConsultation,
  };
};
