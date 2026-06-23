import { useCallback } from "react";
import {
  useCreateConsultation,
  useUpdateConsultation,
  useFetchConsultationByAppointment,
} from "@/api/query/hooks/useConsultationQueries";
import type {
  CreateConsultationRequest,
  UpdateConsultationRequest,
  CancelledAppointmentItemDto,
} from "@/api/types";
import type { PostConsultationFormData } from "./usePostConsultationForm";
import { AxiosError } from "axios";

/**
 * Creates or updates a consultation for post-appointment flow.
 * On 409 (consultation already exists for appointment), fetches and PATCHes instead.
 */
export const useConsultationSubmission = () => {
  const createConsultationMutation = useCreateConsultation();
  const updateConsultationMutation = useUpdateConsultation();
  const fetchConsultationByAppointment = useFetchConsultationByAppointment();

  const submitConsultation = useCallback(
    async (
      data: PostConsultationFormData,
      appointmentId: number,
    ): Promise<{
      consultationId: number;
      isUpdate: boolean;
      cancelledAppointments?: CancelledAppointmentItemDto[];
    }> => {
      try {
        const consultationRequest: CreateConsultationRequest = {
          appointmentId: appointmentId,
          mainConcern: data.mainConcern,
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
            cancelledAppointments: response.cancelledAppointments,
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
            `[Retry] 409: consultation exists for appointment ${appointmentId}, updating…`,
          );

          const consultationFetchResult = await fetchConsultationByAppointment(
            appointmentId,
            { staleTime: 0 },
          );

          if (!consultationFetchResult.success || !consultationFetchResult.value) {
            throw new Error("Failed to fetch existing consultation for retry");
          }

          const existingConsultation = consultationFetchResult.value;

          const updateRequest: UpdateConsultationRequest = {
            mainConcern: data.mainConcern,
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
            cancelledAppointments: updateResponse.cancelledAppointments,
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
      fetchConsultationByAppointment,
    ],
  );

  return {
    submitConsultation,
  };
};
