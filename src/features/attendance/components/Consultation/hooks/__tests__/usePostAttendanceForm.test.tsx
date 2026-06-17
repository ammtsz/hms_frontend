/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock all dependencies
jest.mock("@/features/attendance/components/Consultation/hooks/useFormHandler");
jest.mock("@/api/patients");
jest.mock("@/api/treatments");
jest.mock("@/stores/modalStore");
jest.mock("../useConsultationSubmission");
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/api/query/hooks/useConsultationQueries");

import {
  addCalendarDaysToLocalYmd,
  getTodayClinic,
} from "@/utils/timezoneDate";
import {
  usePostAttendanceForm,
  PostConsultationFormData,
} from "../usePostAttendanceForm";

// Create a shared QueryClient for all tests
let queryClient: QueryClient;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePostAttendanceForm", () => {
  // Set timeout for all tests
  jest.setTimeout(5000);

  // Access mocked functions
  const mockUseFormHandler = jest.requireMock(
    "@/features/attendance/components/Consultation/hooks/useFormHandler",
  ).useFormHandler;
  const mockGetPatientById = jest.requireMock("@/api/patients").getPatientById;
  const mockCreateTreatment =
    jest.requireMock("@/api/treatments").createTreatment;
  const mockBulkCreateTreatments =
    jest.requireMock("@/api/treatments").bulkCreateTreatments;
  const mockUsePostAttendanceModal = jest.requireMock(
    "@/stores/modalStore",
  ).usePostAttendanceModal;
  const mockUseCloseModal = jest.requireMock(
    "@/stores/modalStore",
  ).useCloseModal;
  const mockUseConsultationSubmission = jest.requireMock(
    "../useConsultationSubmission",
  ).useConsultationSubmission;
  const mockUsePatient = jest.requireMock(
    "@/api/query/hooks/usePatientQueries",
  ).usePatient;
  const mockUseNewlyScheduledAttendances = jest.requireMock(
    "@/api/query/hooks/usePatientQueries",
  ).useNewlyScheduledAttendances;
  const mockUseConsultationByAttendance = jest.requireMock(
    "@/api/query/hooks/useConsultationQueries",
  ).useConsultationByAttendance;
  const mockUseLatestConsultationByPatient = jest.requireMock(
    "@/api/query/hooks/useConsultationQueries",
  ).useLatestConsultationByPatient;
  const mockUseScheduleReturnAttendance = jest.requireMock(
    "@/api/query/hooks/useConsultationQueries",
  ).useScheduleReturnAttendance;

  let mockCloseModal: jest.Mock;
  let mockOnComplete: jest.Mock;
  let mockSubmitTreatmentRecord: jest.Mock;

  beforeEach(() => {
    // Create fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    // Setup mock functions
    mockCloseModal = jest.fn();
    mockOnComplete = jest.fn();
    mockSubmitTreatmentRecord = jest.fn();

    // Mock store hooks with basic return values
    mockUsePostAttendanceModal.mockReturnValue({
      isOpen: true,
      attendanceId: 1,
      patientId: 1,
      currentTreatmentStatus: "T",
      isLoading: false,
      onComplete: mockOnComplete,
    });

    mockUseCloseModal.mockReturnValue(mockCloseModal);

    // Mock assessment treatment submission hook
    mockUseConsultationSubmission.mockReturnValue({
      submitConsultation: mockSubmitTreatmentRecord,
    });

    // Mock usePatient hook
    mockUsePatient.mockReturnValue({
      data: {
        id: 1,
        name: "Test Patient",
        email: "test@example.com",
        phone: "11999999999",
        startDate: new Date("2024-01-15"),
        birthDate: new Date("1990-01-01"),
      },
      isLoading: false,
      error: null,
    });

    // Mock useNewlyScheduledAttendances hook
    mockUseNewlyScheduledAttendances.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Mock useTreatmentRecordByAttendance hook
    mockUseConsultationByAttendance.mockReturnValue({
      data: null, // Default to no existing treatment record
      isLoading: false,
      error: null,
    });

    // Mock useLatestTreatmentRecordByPatient hook
    mockUseScheduleReturnAttendance.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
    });
    mockUseLatestConsultationByPatient.mockReturnValue({
      data: null, // Default to no existing treatment record
      isLoading: false,
      error: null,
    });

    // Mock form handler with complete return type
    mockUseFormHandler.mockReturnValue({
      formData: {
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "Light foods",
        water: "Drink plenty",
        ointments: "None",
        recommendations: {
          returnWeeks: 1,
        },
        notes: "Test notes",
      },
      setFormData: jest.fn(),
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
      setError: jest.fn(),
      resetForm: jest.fn(),
    });

    // Mock API calls
    mockGetPatientById.mockResolvedValue({
      success: true,
      value: {
        id: 1,
        name: "Test Patient",
        email: "test@example.com",
        phone: "11999999999",
        mainComplaint: "Test complaint",
        startDate: "2024-01-15",
        priority: 2,
        patientStatus: "T",
        missingAppointmentsStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    mockCreateTreatment.mockResolvedValue({
      success: true,
      value: {
        id: 1,
        consultationId: 1,
        attendanceId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "Head",
        startDate: "2024-01-15",
        plannedSessions: 5,
        completedSessions: 0,
        status: "scheduled",
        durationMinutes: 2,
        color: "Blue",
        notes: "Test session",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // usePostAttendanceForm uses bulkCreateTreatments (not createTreatment)
    const mockCreatedSession = {
      id: 1,
      consultationId: 123,
      attendanceId: 1,
      patientId: 1,
      treatmentType: "physiotherapy" as const,
      bodyLocation: "Head",
      startDate: "2024-01-15",
      plannedSessions: 5,
      completedSessions: 0,
      status: "scheduled" as const,
      durationMinutes: 2,
      color: "Blue",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBulkCreateTreatments.mockResolvedValue({
      success: true,
      value: {
        createdTreatments: [
          mockCreatedSession,
          { ...mockCreatedSession, id: 2, bodyLocation: "Chest" },
        ],
        failedTreatments: [],
        returnScheduled: false,
      },
    });
  });

  afterEach(async () => {
    // Cleanup rendered components
    cleanup();

    // Clear all queries and stop the query client
    queryClient.clear();
    await queryClient.cancelQueries();

    // Clear all timers and mocks
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Final cleanup - ensure query client is fully disposed
    if (queryClient) {
      queryClient.clear();
      await queryClient.cancelQueries();
    }
  });

  describe("Hook Initialization", () => {
    it("should initialize successfully", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(result.current.formData).toBeDefined();
      expect(result.current.handleCancel).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("should provide form state", async () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.formData.mainComplaint).toBe("Test complaint");
      expect(result.current.formData.patientStatus).toBe("T");

      // Wait for patient data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Patient Data Loading", () => {
    it("should fetch patient data on mount", async () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // The hook uses usePatient React Query hook, not getPatientById directly
      // Verify the hook was called with correct patientId
      expect(mockUsePatient).toHaveBeenCalledWith("1");
    });

    it("should pre-fill mainComplaint from existing treatment record", async () => {
      // Mock existing treatment record with mainComplaint
      // Note: The hook uses useLatestTreatmentRecordByPatient, not useTreatmentRecordByAttendance
      mockUseLatestConsultationByPatient.mockReturnValue({
        data: {
          id: 1,
          patientId: 1,
          mainComplaint: "Existing complaint from database",
          food: "Light foods",
          water: "Drink plenty",
          ointments: "None",
          returnWeeks: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isLoading: false,
        error: null,
      });

      const mockSetFormData = jest.fn();
      mockUseFormHandler.mockReturnValue({
        formData: {
          mainComplaint: "",
          patientStatus: "T",
          startDate: "2024-01-15",
          returnWeeks: 1,
          food: "",
          water: "",
          ointments: "",
          recommendations: {
            returnWeeks: 1,
          },
          notes: "",
        },
        setFormData: mockSetFormData,
        handleChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: null,
        clearError: jest.fn(),
        setError: jest.fn(),
        resetForm: jest.fn(),
      });

      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Wait for the useEffect to call setFormData with the pre-filled data
      await waitFor(() => {
        expect(mockUseLatestConsultationByPatient).toHaveBeenCalledWith("1");
      });

      // The hook should have called useFormHandler with initialState containing the pre-filled data
      // Check that useFormHandler was called with the correct initial state
      const formHandlerCall = mockUseFormHandler.mock.calls[0][0];
      expect(formHandlerCall.initialState).toBeDefined();
    });

    it("should handle patient data fetch failure", async () => {
      // Mock usePatient to return an error
      mockUsePatient.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Patient not found"),
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.fetchError).toBe("Patient not found");
    });

    it("should handle network errors in patient fetch", async () => {
      // Mock usePatient to return a network error
      mockUsePatient.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Network error"),
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(result.current.fetchError).toBe("Network error");
    });
  });

  describe("Form Actions", () => {
    it("should handle cancel action", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(mockCloseModal).toHaveBeenCalledWith("postAttendance");
    });
  });

  describe("State Management", () => {
    it("should manage confirmation state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.showConfirmation).toBe(false);

      act(() => {
        result.current.resetConfirmation();
      });

      expect(result.current.showConfirmation).toBe(false);
      expect(result.current.createdTreatments).toEqual([]);
    });

    it("should manage error state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.showErrors).toBe(false);

      act(() => {
        result.current.resetErrors();
      });

      expect(result.current.showErrors).toBe(false);
      expect(result.current.treatmentCreationErrors).toEqual([]);
    });

    it("should handle retry session creation", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.retryTreatmentCreation();
      });

      expect(result.current.showErrors).toBe(false);
    });
  });

  describe("Utility Functions", () => {
    it("should format date correctly", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const formatted = result.current.formatDateForInput("2024-01-15");
      expect(formatted).toBe("2024-01-15");
    });

    it("should get correct treatment status labels", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.getTreatmentStatusLabel("N")).toBe("Novo paciente");
      expect(result.current.getTreatmentStatusLabel("T")).toBe("Em tratamento");
      expect(result.current.getTreatmentStatusLabel("A")).toBe(
        "Alta do tratamento",
      );
      expect(result.current.getTreatmentStatusLabel("F")).toBe(
        "Faltas consecutivas",
      );
    });
  });

  describe("Loading States", () => {
    it("should handle external loading state", () => {
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        attendanceId: 1,
        patientId: 1,
        currentTreatmentStatus: "T",
        isLoading: true, // External loading
        onComplete: mockOnComplete,
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should combine multiple loading states", () => {
      mockUseFormHandler.mockReturnValue({
        formData: {
          mainComplaint: "Test complaint",
          patientStatus: "T",
          startDate: "2024-01-15",
          returnWeeks: 1,
          food: "Light foods",
          water: "Drink plenty",
          ointments: "None",
          recommendations: {
            returnWeeks: 1,
          },
          notes: "Test notes",
        },
        setFormData: jest.fn(),
        handleChange: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true, // Form loading
        error: null,
        clearError: jest.fn(),
        setError: jest.fn(),
        resetForm: jest.fn(),
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing patientId", () => {
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        attendanceId: 1,
        // No patientId provided
        currentTreatmentStatus: "T",
        isLoading: false,
        onComplete: mockOnComplete,
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Should not crash and should not call getPatientById
      expect(result.current).toBeDefined();
      expect(mockGetPatientById).not.toHaveBeenCalled();
    });

    it("should handle missing attendanceId", () => {
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        // No attendanceId provided
        patientId: 1,
        currentTreatmentStatus: "T",
        isLoading: false,
        onComplete: mockOnComplete,
      });

      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe("Form Handler Integration", () => {
    it("should integrate with form handler correctly", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Verify form handler was called with expected parameters
      expect(mockUseFormHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          initialState: expect.objectContaining({
            mainComplaint: expect.any(String),
            patientStatus: expect.any(String),
            startDate: expect.any(String),
          }),
          onSubmit: expect.any(Function),
          validate: expect.any(Function),
        }),
      );
    });

    it("should provide form change handlers", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.handleRecommendationsChange).toBeDefined();
      expect(result.current.handleDateChange).toBeDefined();
      expect(typeof result.current.handleRecommendationsChange).toBe(
        "function",
      );
      expect(typeof result.current.handleDateChange).toBe("function");
    });
  });

  describe("Data State", () => {
    it("should provide patient data state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.patientData).toBeDefined();
      expect(result.current.fetchingPatient).toBeDefined();
      expect(result.current.setFetchError).toBeDefined();
    });

    it("should provide current treatment status", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.currentTreatmentStatus).toBe("T");
    });
  });

  describe("Error States", () => {
    it("should provide error management functions", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.clearError).toBeDefined();
      expect(result.current.treatmentCreationErrors).toBeDefined();
      expect(result.current.showErrors).toBeDefined();
    });
  });

  describe("Session Management", () => {
    it("should provide session management state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.createdTreatments).toBeDefined();
      expect(result.current.showConfirmation).toBeDefined();
      expect(result.current.resetConfirmation).toBeDefined();
      expect(Array.isArray(result.current.createdTreatments)).toBe(true);
    });
  });

  describe("Form Validation", () => {
    // Helper to get the validate function from the mock
    const getValidateFn = (): ((
      data: PostConsultationFormData,
    ) => string | null) => {
      const calls = mockUseFormHandler.mock.calls;
      if (calls.length === 0) {
        throw new Error("useFormHandler was not called");
      }
      const config = calls[calls.length - 1][0];
      if (!config.validate) {
        throw new Error("validate function not found in config");
      }
      return config.validate;
    };

    it("should validate main complaint is required", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();
      const validationResult = validateFn({
        mainComplaint: "",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });

      expect(validationResult).toBe("Principal queixa é obrigatória");
    });

    it("should validate return weeks range", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      // Test too low (below 0)
      const lowWeeksResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: -1,
        recommendations: {
          returnWeeks: -1,
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });
      expect(lowWeeksResult).toBe(
        "Semanas para retorno deve estar entre 0 e 52",
      );

      // Test too high
      const highWeeksResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 53,
        recommendations: {
          returnWeeks: 53,
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });
      expect(highWeeksResult).toBe(
        "Semanas para retorno deve estar entre 0 e 52",
      );
    });

    it("should validate future start dates are not allowed", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();
      const today = getTodayClinic();
      const futureDateString = addCalendarDaysToLocalYmd(today, 1);

      const result = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: futureDateString,
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });

      expect(result).toBe("Data de cadastro não pode ser futura");
    });

    it("should validate physiotherapy treatments", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      // Test with physiotherapy object but no validation error (empty array is allowed)
      const missingTreatmentsResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [],
            startDate: "",
          },
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });
      // Empty array is allowed - only validates when treatments exist
      expect(missingTreatmentsResult).toBe(null);

      // Test missing locations
      const missingLocationsResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: [],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
            startDate: "",
          },
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
      });
      expect(missingLocationsResult).toBe(
        "Todos os locais da fisioterapia devem ser especificados",
      );

      // Test missing color
      const missingColorResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
            startDate: "",
          },
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
      });
      expect(missingColorResult).toBe(
        "Cor da fisioterapia é obrigatória para todos os locais",
      );
    });

    it("should validate tens treatments", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      // Test with tens object but no validation error (empty array is allowed)
      const missingTreatmentsResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          tens: {
            treatments: [],
            startDate: "",
          },
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: true,
      });
      // Empty array is allowed - only validates when treatments exist
      expect(missingTreatmentsResult).toBe(null);

      // Test invalid quantity
      const invalidQuantityResult = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          tens: {
            treatments: [
              { locations: ["Head"], quantity: 25, startDate: "2024-01-15" },
            ],
            startDate: "",
          },
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
      });
      expect(invalidQuantityResult).toBe(
        "Quantidade de tratamentos com TENS deve estar entre 1 e 20",
      );
    });

    it("should validate general recommendations when noGeneralRecommendations is false", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      const result = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          returnWhenTreatmentComplete: true,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: false,
        noTreatmentRecommendations: true,
      });

      expect(result).toBe(
        "Adicione pelo menos uma recomendação geral (alimentação, água ou pomadas) ou marque que nenhuma se aplica",
      );
    });

    it("should validate treatment recommendations when noTreatmentRecommendations is false and status is not A", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      const result = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "T",
        startDate: "2024-01-15",
        returnWeeks: 1,
        recommendations: {
          returnWeeks: 1,
          returnWhenTreatmentComplete: true,
        },
        food: "Test food",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
      });

      expect(result).toBe(
        "Adicione pelo menos um tratamento de fisioterapia ou TENS ou marque que nenhum se aplica",
      );
    });

    it("should skip treatment recommendations validation when treatmentStatus is A", () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const validateFn = getValidateFn();

      const result = validateFn({
        mainComplaint: "Test complaint",
        patientStatus: "A",
        startDate: "2024-01-15",
        returnWeeks: 0,
        recommendations: {
          returnWeeks: 0,
          returnWhenTreatmentComplete: false,
        },
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
      });

      expect(result).toBe(null);
    });
  });

  describe("Treatment Session Creation", () => {
    beforeEach(() => {
      // Reset mocks and ensure attendanceId and patientId are available
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        attendanceId: 1,
        patientId: 1,
        currentTreatmentStatus: "T",
        isLoading: false,
        onComplete: mockOnComplete,
      });

      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });
    });

    it("should create physiotherapy treatment sessions successfully", async () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head", "Chest"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should have called assessment treatment submission
      expect(mockSubmitTreatmentRecord).toHaveBeenCalledWith(testData, 1);

      // Should have created 2 treatment sessions via bulk API (one per location)
      expect(mockBulkCreateTreatments).toHaveBeenCalledTimes(1);
      const bulkCall = mockBulkCreateTreatments.mock.calls[0][0];
      expect(bulkCall.treatments).toHaveLength(2);
      expect(bulkCall).toMatchObject({
        consultationId: 123,
        treatments: expect.arrayContaining([
          expect.objectContaining({
            consultationId: 123,
            treatmentType: "physiotherapy",
            bodyLocation: "Head",
            color: "Blue",
            durationMinutes: 2,
          }),
          expect.objectContaining({
            consultationId: 123,
            treatmentType: "physiotherapy",
            bodyLocation: "Chest",
            color: "Blue",
            durationMinutes: 2,
          }),
        ]),
      });
    });

    it("should create tens treatment sessions successfully", async () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          tens: {
            treatments: [
              {
                locations: ["Back", "Legs"],
                quantity: 3,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should have created 2 treatment sessions via bulk API (one per location)
      expect(mockBulkCreateTreatments).toHaveBeenCalledTimes(1);
      const bulkCall = mockBulkCreateTreatments.mock.calls[0][0];
      expect(bulkCall.treatments).toHaveLength(2);
      expect(bulkCall).toMatchObject({
        consultationId: 123,
        treatments: expect.arrayContaining([
          expect.objectContaining({
            consultationId: 123,
            treatmentType: "tens",
            bodyLocation: "Back",
          }),
          expect.objectContaining({
            consultationId: 123,
            treatmentType: "tens",
            bodyLocation: "Legs",
          }),
        ]),
      });
    });

    it("should complete without creating sessions when treatmentStatus is Alta (A)", async () => {
      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const altaData = {
        mainComplaint: "Alta final",
        patientStatus: "A" as const,
        startDate: "2024-01-15",
        returnWeeks: 0,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        recommendations: {
          returnWeeks: 0,
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(altaData);
      });

      expect(mockSubmitTreatmentRecord).toHaveBeenCalledWith(altaData, 1);
      expect(mockBulkCreateTreatments).not.toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalledWith([]);
    });

    it("should handle treatment session creation errors", async () => {
      mockBulkCreateTreatments.mockResolvedValue({
        success: false,
        error: "Session creation failed",
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should show errors
      expect(result.current.showErrors).toBe(true);
      expect(result.current.treatmentCreationErrors).toHaveLength(1);
      expect(result.current.treatmentCreationErrors[0].treatmentType).toBe(
        "physiotherapy",
      );
      expect(result.current.treatmentCreationErrors[0].errors[0]).toContain(
        "Session creation failed",
      );
    });

    it("should handle validation errors before creating sessions", async () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 15, // Invalid duration > 10
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should not create any sessions due to validation error
      expect(mockBulkCreateTreatments).not.toHaveBeenCalled();
      expect(result.current.showErrors).toBe(true);
      expect(result.current.treatmentCreationErrors[0].errors[0]).toContain(
        "Tempo deve ser entre 1 e 10",
      );
    });

    it("should handle missing attendanceId or patientId", async () => {
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        // Missing attendanceId and patientId
        currentTreatmentStatus: "T",
        isLoading: false,
        onComplete: mockOnComplete,
      });

      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        try {
          await mockFormHandler.onSubmit(testData);
        } catch (error) {
          expect((error as Error).message).toBe(
            "Attendance ID is required for treatment submission",
          );
        }
      });
    });
  });

  describe("Error Parsing", () => {
    it("should parse structured error details", async () => {
      // Ensure assessment treatment submission succeeds
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      mockBulkCreateTreatments.mockRejectedValue(new Error("Multiple errors"));

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      expect(result.current.treatmentCreationErrors).toHaveLength(1);
      expect(result.current.treatmentCreationErrors[0].treatmentType).toBe(
        "physiotherapy",
      );
      // The error message should contain the original error message
      expect(result.current.treatmentCreationErrors[0].errors[0]).toContain(
        "Multiple errors",
      );
    });

    it("should parse validation error messages", async () => {
      // Ensure assessment treatment submission succeeds
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      mockBulkCreateTreatments.mockRejectedValue(
        new Error("duration_minutes must not be greater than 10"),
      );

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      expect(result.current.treatmentCreationErrors[0].errors[0]).toContain(
        "1 e 10",
      );
    });
  });

  describe("Change Handlers", () => {
    it("should handle recommendations change", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const newRecommendations = {
        returnWeeks: 2,
        physiotherapy: {
          startDate: "2024-01-15",
          treatments: [
            {
              locations: ["Head"],
              color: "Blue",
              duration: 2,
              quantity: 5,
              startDate: "2024-01-15",
            },
          ],
        },
        returnWhenTreatmentComplete: true,
      };

      act(() => {
        result.current.handleRecommendationsChange(newRecommendations);
      });

      expect(mockUseFormHandler().setFormData).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should handle date change", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const mockEvent = {
        target: { value: "2024-02-01" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleDateChange("startDate")(mockEvent);
      });

      expect(mockUseFormHandler().setFormData).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should handle empty date change with today fallback", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const mockEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleDateChange("startDate")(mockEvent);
      });

      expect(mockUseFormHandler().setFormData).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });

  describe("Effect Handlers", () => {
    it("should update form data when patient data is loaded", async () => {
      const mockPatientData = {
        id: "1",
        name: "Test Patient",
        phone: "11999999999",
        birthDate: new Date("1990-01-01"),
        mainComplaint: "Updated complaint",
        startDate: new Date("2024-01-10"),
        priority: "3" as const,
        status: "T" as const,
      };

      // Mock usePatient to return the patient data
      mockUsePatient.mockReturnValue({
        data: mockPatientData,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Wait for patient data to load and form to update
      await waitFor(() => {
        expect(result.current.patientData).toBeDefined();
        expect(result.current.patientData?.id).toBe(
          parseInt(mockPatientData.id),
        );
        expect(result.current.patientData?.name).toBe(mockPatientData.name);
        expect(result.current.patientData?.phone).toBe(mockPatientData.phone);
        expect(result.current.patientData?.mainComplaint).toBe(
          mockPatientData.mainComplaint,
        );
        expect(result.current.patientData?.priority).toBe(
          mockPatientData.priority,
        );
        expect(result.current.patientData?.patientStatus).toBe(
          mockPatientData.status,
        );
        // startDate is a Date object, not a string
        expect(result.current.patientData?.startDate).toEqual(
          mockPatientData.startDate,
        );
      });

      // setFormData is called directly with an object during the useEffect
      expect(mockUseFormHandler().setFormData).toHaveBeenCalled();
    });

    it("should set today's date for new patients", async () => {
      mockUsePostAttendanceModal.mockReturnValue({
        isOpen: true,
        attendanceId: 1,
        patientId: 1,
        currentTreatmentStatus: "N", // New patient
        isLoading: false,
        onComplete: mockOnComplete,
      });

      const mockPatientData = {
        id: "1",
        name: "New Patient",
        email: "new@example.com",
        phone: "11999999999",
        mainComplaint: "New complaint",
        startDate: undefined, // New patient has no start date
        birthDate: new Date("1990-01-01"),
        priority: "2" as const,
        status: "N" as const,
      };

      // Mock usePatient to return the new patient data
      mockUsePatient.mockReturnValue({
        data: mockPatientData,
        isLoading: false,
        error: null,
      });

      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // setFormData is called directly with an object during the useEffect
      await waitFor(() => {
        expect(mockUseFormHandler().setFormData).toHaveBeenCalled();
      });
    });
  });

  describe("Reset Functions", () => {
    it("should reset confirmation state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      // Simulate some confirmation state
      act(() => {
        result.current.resetConfirmation();
      });

      expect(result.current.showConfirmation).toBe(false);
      expect(result.current.createdTreatments).toEqual([]);
    });

    it("should reset error state", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.resetErrors();
      });

      expect(result.current.showErrors).toBe(false);
      expect(result.current.treatmentCreationErrors).toEqual([]);
    });

    it("should retry session creation", () => {
      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.retryTreatmentCreation();
      });

      expect(result.current.showErrors).toBe(false);
      expect(result.current.treatmentCreationErrors).toEqual([]);
    });
  });

  describe("Form Data Formatting", () => {
    it("should format return weeks with bounds", () => {
      // Create stable mock functions to prevent infinite loop
      const stableSetFormData = jest.fn();
      const stableHandleChange = jest.fn();
      const stableHandleSubmit = jest.fn();
      const stableClearError = jest.fn();
      const stableSetError = jest.fn();
      const stableResetForm = jest.fn();

      mockUseFormHandler.mockImplementation(
        (config: {
          formatters?: { returnWeeks?: (value: unknown) => number };
        }) => {
          // Test the formatters
          if (config.formatters?.returnWeeks) {
            const formattedLow = config.formatters.returnWeeks(-5);
            const formattedHigh = config.formatters.returnWeeks(100);
            const formattedNormal = config.formatters.returnWeeks(10);

            expect(formattedLow).toBe(0); // Changed from 1 to 0
            expect(formattedHigh).toBe(52);
            expect(formattedNormal).toBe(10);
          }

          return {
            formData: {
              mainComplaint: "",
              patientStatus: "T",
              startDate: "2024-01-15",
              returnWeeks: 1,
              food: "",
              water: "",
              ointments: "",
              recommendations: {
                returnWeeks: 1,
              },
              notes: "",
            },
            setFormData: stableSetFormData,
            handleChange: stableHandleChange,
            handleSubmit: stableHandleSubmit,
            isLoading: false,
            error: null,
            clearError: stableClearError,
            setError: stableSetError,
            resetForm: stableResetForm,
          };
        },
      );

      renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      expect(mockUseFormHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          formatters: expect.objectContaining({
            returnWeeks: expect.any(Function),
          }),
        }),
      );
    });
  });

  // Additional tests to improve coverage
  describe("Error Parsing Edge Cases", () => {
    it("should handle parseTreatmentCreationErrors with missing recommendations structure", async () => {
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      mockBulkCreateTreatments.mockRejectedValue(new Error("Parsing failed"));

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
          tens: {
            treatments: [
              {
                locations: ["Back"],
                quantity: 3,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should show errors from session creation failure
      expect(result.current.showErrors).toBe(true);
      expect(result.current.treatmentCreationErrors.length).toBeGreaterThan(0);

      const physiotherapyError = result.current.treatmentCreationErrors.find(
        (e) => e.treatmentType === "physiotherapy",
      );
      const tensError = result.current.treatmentCreationErrors.find(
        (e) => e.treatmentType === "tens",
      );

      // At least one treatment type should have errors
      expect(physiotherapyError || tensError).toBeTruthy();
      if (physiotherapyError) {
        expect(physiotherapyError.errors[0]).toContain("Parsing failed");
      }
      if (tensError) {
        expect(tensError.errors[0]).toContain("Parsing failed");
      }
    });

    it("should handle tens session creation exceptions", async () => {
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      mockBulkCreateTreatments.mockRejectedValue(
        new Error("TENS creation exception"),
      );

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
          tens: {
            treatments: [
              {
                locations: ["Back"],
                quantity: 3,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should show errors instead of successful creations due to exception during treatment session creation
      expect(result.current.showErrors).toBe(true);
      expect(result.current.treatmentCreationErrors.length).toBeGreaterThan(0);

      expect(
        result.current.treatmentCreationErrors.some((e) =>
          e.errors.some((err) => err.includes("TENS creation exception")),
        ),
      ).toBe(true);
      expect(result.current.showConfirmation).toBe(false);
    });

    it("should handle successful session creation with confirmation display", async () => {
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      // Default beforeEach mock already returns success; ensure it has Head and Chest sessions
      mockBulkCreateTreatments.mockResolvedValue({
        success: true,
        value: {
          createdTreatments: [
            {
              id: 1,
              consultationId: 123,
              attendanceId: 1,
              patientId: 1,
              treatmentType: "physiotherapy",
              bodyLocation: "Head",
              startDate: "2024-01-15",
              plannedSessions: 5,
              completedSessions: 0,
              status: "scheduled",
              durationMinutes: 2,
              color: "Blue",
              notes: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 2,
              consultationId: 123,
              attendanceId: 1,
              patientId: 1,
              treatmentType: "physiotherapy",
              bodyLocation: "Chest",
              startDate: "2024-01-15",
              plannedSessions: 5,
              completedSessions: 0,
              status: "scheduled",
              durationMinutes: 2,
              color: "Blue",
              notes: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          failedTreatments: [],
          returnScheduled: false,
        },
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head", "Chest"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should show confirmation dialog with created sessions
      expect(result.current.showConfirmation).toBe(true);
      expect(result.current.createdTreatments.length).toBeGreaterThan(0);

      // Verify that onComplete was called (indicating successful completion)
      expect(mockOnComplete).toHaveBeenCalled();

      // Verify no errors were shown
      expect(result.current.showErrors).toBe(false);
    });

    it("should handle mixed successful and failed session creation", async () => {
      mockSubmitTreatmentRecord.mockResolvedValue({
        consultationId: 123,
        success: true,
      });

      // Bulk API returns with some failed sessions
      mockBulkCreateTreatments.mockResolvedValue({
        success: true,
        value: {
          createdTreatments: [
            {
              id: 456,
              consultationId: 123,
              attendanceId: 1,
              patientId: 1,
              treatmentType: "physiotherapy",
              bodyLocation: "Head",
              startDate: "2024-01-15",
              plannedSessions: 5,
              completedSessions: 0,
              status: "scheduled",
              durationMinutes: 2,
              color: "Blue",
              notes: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          failedTreatments: [
            {
              treatment: {
                consultationId: 123,
                attendanceId: 1,
                patientId: 1,
                treatmentType: "physiotherapy",
                bodyLocation: "Chest",
                startDate: "2024-01-15",
                plannedSessions: 5,
                durationMinutes: 2,
                color: "Blue",
                notes: "",
              },
              error: "Second location failed",
            },
          ],
          returnScheduled: false,
        },
      });

      const { result } = renderHook(() => usePostAttendanceForm(), {
        wrapper: TestWrapper,
      });

      const testData = {
        mainComplaint: "Test complaint",
        patientStatus: "T" as const,
        startDate: "2024-01-15",
        returnWeeks: 1,
        food: "",
        water: "",
        ointments: "",
        notes: "",
        noGeneralRecommendations: true,
        noTreatmentRecommendations: false,
        recommendations: {
          returnWeeks: 1,
          physiotherapy: {
            treatments: [
              {
                locations: ["Head", "Chest"],
                color: "Blue",
                duration: 2,
                quantity: 5,
                startDate: "2024-01-15",
              },
            ],
          },
        },
      };

      const mockFormHandler = mockUseFormHandler.mock.calls[0][0];

      await act(async () => {
        await mockFormHandler.onSubmit(testData);
      });

      // Should show errors due to partial failure (when any session creation fails, entire operation shows errors)
      expect(result.current.treatmentCreationErrors).toHaveLength(1);
      expect(result.current.treatmentCreationErrors[0].errors[0]).toContain(
        "Second location failed",
      );
      expect(result.current.showErrors).toBe(true);
      expect(result.current.showConfirmation).toBe(false);
    });
  });
});
