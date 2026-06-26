import { renderHook, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  UseMutationResult,
} from "@tanstack/react-query";
import React from "react";
import { useModalManagement } from "../useModalManagement";
import { PatientPriority, PatientStatus } from "../../../../types/types";

// Mock the React Query hooks
jest.mock("@/api/query/hooks/useConsultationQueries", () => ({
  useCreateConsultation: jest.fn(),
}));

jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  useUpdatePatient: jest.fn(),
}));

import { useCreateConsultation } from "@/api/query/hooks/useConsultationQueries";
import { useUpdatePatient } from "@/api/query/hooks/usePatientQueries";
import type {
  CreateConsultationRequest,
  UpdateConsultationResponseDto,
  PatientResponseDto,
  UpdatePatientRequest,
} from "../../../../api/types";
import type { PostConsultationFormData } from "../../components/Consultation";

const mockUseCreateConsultation = useCreateConsultation as jest.MockedFunction<
  typeof useCreateConsultation
>;
const mockUseUpdatePatient = useUpdatePatient as jest.MockedFunction<
  typeof useUpdatePatient
>;

describe("useModalManagement", () => {
  const mockRefreshData = jest.fn();
  let queryClient: QueryClient;

  // Create a wrapper for React Query
  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  };

  // Mock mutations
  const mockCreateMutation = {
    mutateAsync: jest.fn(),
    mutate: jest.fn(),
    isIdle: false,
    isError: false,
    isSuccess: false,
    isPaused: false,
    error: null,
    data: undefined,
    reset: jest.fn(),
    isPending: false,
    status: "idle" as const,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
  } as const;

  const mockUpdateMutation = {
    mutateAsync: jest.fn(),
    mutate: jest.fn(),
    isIdle: false,
    isError: false,
    isSuccess: false,
    isPaused: false,
    error: null,
    data: undefined,
    reset: jest.fn(),
    isPending: false,
    status: "idle" as const,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
  } as const;

  const mockTreatmentData: PostConsultationFormData = {
    mainConcern: "Test complaint",
    patientStatus: "T" as const,
    startDate: "2024-01-15",
    homeExercises: "Test home exercises",
    painManagement: "Test pain management",
    medications: "Test medications",
    returnWeeks: 2,
    notes: "Test notes",
    noGeneralRecommendations: false,
    noTreatmentRecommendations: false,
    recommendations: {
      physiotherapy: {
        startDate: "2024-01-15",
        treatments: [
          {
            locations: ["head"],
            duration: 45,
            quantity: 1,
            startDate: "2024-01-15",
          },
        ],
      },
      tens: {
        startDate: "2024-01-15",
        treatments: [],
      },
      returnWeeks: 2,
      returnWhenTreatmentComplete: false,
    },
  };

  const mockAppointmentDetails = {
    id: 123,
    patientId: 456,
    patientName: "Test Patient",
    appointmentType: "assessment",
    currentTreatmentStatus: "T" as const,
    currentStartDate: new Date("2024-01-01"),
    currentReturnWeeks: 1,
    isFirstAppointment: false,
  };

  const mockCreateTreatmentResponse = {
    consultation: {
      id: 789,
      appointmentId: 123,
      createdDate: "2024-01-15",
      createdTime: "10:00:00",
      updatedDate: "2024-01-15",
      updatedTime: "10:00:00",
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    // Setup mock mutation returns
    mockCreateMutation.mutateAsync.mockResolvedValue(
      mockCreateTreatmentResponse,
    );

    mockUpdateMutation.mutateAsync.mockResolvedValue({
      id: 456,
      name: "Test Patient",
      priority: PatientPriority.LEVEL_3,
      patientStatus: PatientStatus.IN_TREATMENT,
      startDate: "2024-01-01",
      missing_appointments_streak: 0,
      phone: "11999999999",
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    });

    // Mock the hooks to return our mock mutations
    mockUseCreateConsultation.mockReturnValue(
      mockCreateMutation as unknown as UseMutationResult<
        UpdateConsultationResponseDto,
        Error,
        CreateConsultationRequest,
        unknown
      >,
    );
    mockUseUpdatePatient.mockReturnValue(
      mockUpdateMutation as unknown as UseMutationResult<
        PatientResponseDto | undefined,
        Error,
        { patientId: string; data: UpdatePatientRequest },
        unknown
      >,
    );
  });

  describe("Hook Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.editPatientModalOpen).toBe(false);
      expect(result.current.patientToEdit).toBe(null);
      expect(result.current.treatmentFormOpen).toBe(false);
      expect(result.current.selectedAppointmentForTreatment).toBe(null);
    });

    it("should provide all expected handlers", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.handleEditPatientCancel).toBe("function");
      expect(typeof result.current.handleEditPatientSuccess).toBe("function");
      expect(typeof result.current.openEditPatientModal).toBe("function");
      expect(typeof result.current.handleTreatmentFormCancel).toBe("function");
      expect(typeof result.current.handleTreatmentFormSubmit).toBe("function");
      expect(typeof result.current.openTreatmentFormModal).toBe("function");
    });

    it("should accept refreshData prop", () => {
      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      // Should initialize normally with refreshData prop
      expect(result.current.editPatientModalOpen).toBe(false);
      expect(typeof result.current.handleEditPatientSuccess).toBe("function");
    });
  });

  describe("Patient Edit Modal Management", () => {
    it("should open patient edit modal correctly", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      const patient = { id: "123", name: "Test Patient" };

      act(() => {
        result.current.openEditPatientModal(patient);
      });

      expect(result.current.editPatientModalOpen).toBe(true);
      expect(result.current.patientToEdit).toEqual(patient);
    });

    it("should close patient edit modal on cancel", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      // First open the modal
      act(() => {
        result.current.openEditPatientModal({
          id: "123",
          name: "Test Patient",
        });
      });

      // Then cancel
      act(() => {
        result.current.handleEditPatientCancel();
      });

      expect(result.current.editPatientModalOpen).toBe(false);
      expect(result.current.patientToEdit).toBe(null);
    });

    it("should close patient edit modal on success and refresh data", () => {
      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      // First open the modal
      act(() => {
        result.current.openEditPatientModal({
          id: "123",
          name: "Test Patient",
        });
      });

      // Then handle success
      act(() => {
        result.current.handleEditPatientSuccess();
      });

      expect(result.current.editPatientModalOpen).toBe(false);
      expect(result.current.patientToEdit).toBe(null);
      expect(mockRefreshData).toHaveBeenCalled();
    });

    it("should handle success without refreshData prop gracefully", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openEditPatientModal({
          id: "123",
          name: "Test Patient",
        });
      });

      // Should not throw error even without refreshData
      act(() => {
        result.current.handleEditPatientSuccess();
      });

      expect(result.current.editPatientModalOpen).toBe(false);
      expect(result.current.patientToEdit).toBe(null);
    });
  });

  describe("Treatment Form Modal Management", () => {
    it("should open treatment form modal correctly", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      expect(result.current.treatmentFormOpen).toBe(true);
      expect(result.current.selectedAppointmentForTreatment).toEqual(
        mockAppointmentDetails,
      );
    });

    it("should close treatment form modal on cancel", () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      // First open the modal
      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      // Then cancel
      act(() => {
        result.current.handleTreatmentFormCancel();
      });

      expect(result.current.treatmentFormOpen).toBe(false);
      expect(result.current.selectedAppointmentForTreatment).toBe(null);
    });
  });

  describe("Treatment Form Submission", () => {
    it("should handle successful treatment form submission", async () => {
      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      // First open the modal
      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      let submitResult: { consultationId: number } | undefined;

      await act(async () => {
        submitResult =
          await result.current.handleTreatmentFormSubmit(mockTreatmentData);
      });

      // Check API calls
      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
        appointmentId: 123,
        mainConcern: "Test complaint",
        patientStatus: "T",
        homeExercises: "Test home exercises",
        painManagement: "Test pain management",
        medications: "Test medications",
        returnWeeks: 2,
        notes: "Test notes",
        physiotherapy: true,
        tens: false,
      });

      // Should not update patient status for 'T' status
      expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();

      // Check return value
      expect(submitResult).toEqual({ consultationId: 789 });

      // Check modal state
      expect(result.current.treatmentFormOpen).toBe(false);
      expect(result.current.selectedAppointmentForTreatment).toBe(null);
      expect(mockRefreshData).toHaveBeenCalled();
    });

    it('should update patient status when treatment status is "D" (discharged)', async () => {
      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      const altaData = { ...mockTreatmentData, patientStatus: "D" as const };

      await act(async () => {
        await result.current.handleTreatmentFormSubmit(altaData);
      });

      expect(mockCreateMutation.mutateAsync).toHaveBeenCalled();
      expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
        patientId: "456",
        data: {
          patientStatus: PatientStatus.DISCHARGED,
        },
      });
    });

    it("should handle physiotherapy recommendations correctly", async () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      const dataWithoutPhysiotherapy = {
        ...mockTreatmentData,
        recommendations: {
          tens: {
            startDate: "2024-01-15",
            treatments: [],
          },
          returnWeeks: 2,
          returnWhenTreatmentComplete: false,
        },
      };

      await act(async () => {
        await result.current.handleTreatmentFormSubmit(
          dataWithoutPhysiotherapy,
        );
      });

      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: undefined,
          tens: false,
        }),
      );
    });

    it("should throw error when no appointment selected", async () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      // Don't open modal, so no appointment is selected
      await expect(async () => {
        await act(async () => {
          await result.current.handleTreatmentFormSubmit(mockTreatmentData);
        });
      }).rejects.toThrow("No appointment selected for treatment");
    });

    it("should handle consultation creation failure", async () => {
      mockCreateMutation.mutateAsync.mockRejectedValue(
        new Error("Database error"),
      );

      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleTreatmentFormSubmit(mockTreatmentData);
        });
      }).rejects.toThrow("Database error");
    });

    it("should handle consultation creation with no id returned", async () => {
      mockCreateMutation.mutateAsync.mockResolvedValue({
        consultation: {
          ...mockCreateTreatmentResponse.consultation,
          id: undefined as unknown as number,
        },
      });

      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleTreatmentFormSubmit(mockTreatmentData);
        });
      }).rejects.toThrow("Failed to create consultation: ID not returned");
    });

    it("should handle API network error during consultation creation", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockCreateMutation.mutateAsync.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.handleTreatmentFormSubmit(mockTreatmentData);
        });
      }).rejects.toThrow("Network error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating consultation:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle patient update failure gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUpdateMutation.mutateAsync.mockRejectedValue(
        new Error("Patient update failed"),
      );

      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      const altaData = { ...mockTreatmentData, patientStatus: "D" as const };

      // Should not throw error even if patient update fails
      let submitResult: { consultationId: number } | undefined;
      await act(async () => {
        submitResult = await result.current.handleTreatmentFormSubmit(altaData);
      });

      expect(submitResult).toEqual({ consultationId: 789 });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to update patient treatment status:",
        expect.any(Error),
      );

      // Modal should still be closed and data refreshed
      expect(result.current.treatmentFormOpen).toBe(false);
      expect(mockRefreshData).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("should handle multiple modal operations in sequence", async () => {
      const { result } = renderHook(
        () => useModalManagement({ refreshData: mockRefreshData }),
        { wrapper: createWrapper() },
      );

      // Open patient edit modal
      act(() => {
        result.current.openEditPatientModal({ id: "123", name: "Patient 1" });
      });
      expect(result.current.editPatientModalOpen).toBe(true);

      // Close and open treatment modal
      act(() => {
        result.current.handleEditPatientCancel();
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      expect(result.current.editPatientModalOpen).toBe(false);
      expect(result.current.treatmentFormOpen).toBe(true);

      // Complete treatment form
      await act(async () => {
        await result.current.handleTreatmentFormSubmit(mockTreatmentData);
      });

      expect(result.current.treatmentFormOpen).toBe(false);
    });

    it("should handle different treatment status values correctly", async () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      const testCases = [
        { status: "N" as const, shouldUpdatePatient: false },
        { status: "T" as const, shouldUpdatePatient: false },
        { status: "D" as const, shouldUpdatePatient: true },
        { status: "C" as const, shouldUpdatePatient: false },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        act(() => {
          result.current.openTreatmentFormModal(mockAppointmentDetails);
        });

        const data = { ...mockTreatmentData, patientStatus: testCase.status };

        await act(async () => {
          await result.current.handleTreatmentFormSubmit(data);
        });

        if (testCase.shouldUpdatePatient) {
          expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
            patientId: "456",
            data: {
              patientStatus: PatientStatus.DISCHARGED,
            },
          });
        } else {
          expect(mockUpdateMutation.mutateAsync).not.toHaveBeenCalled();
        }
      }
    });

    it("should handle treatment data with complex recommendations", async () => {
      const { result } = renderHook(() => useModalManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.openTreatmentFormModal(mockAppointmentDetails);
      });

      const complexData = {
        ...mockTreatmentData,
        recommendations: {
          physiotherapy: {
            startDate: "2024-01-15",
            treatments: [
              {
                locations: ["head"],
                duration: 45,
                quantity: 1,
                startDate: "2024-01-15",
              },
              {
                locations: ["chest"],
                duration: 45,
                quantity: 1,
                startDate: "2024-01-15",
              },
            ],
          },
          tens: {
            startDate: "2024-01-15",
            treatments: [],
          },
          returnWeeks: 2,
          returnWhenTreatmentComplete: false,
        },
      };

      await act(async () => {
        await result.current.handleTreatmentFormSubmit(complexData);
      });

      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          physiotherapy: true,
          tens: false,
        }),
      );
    });
  });
});
