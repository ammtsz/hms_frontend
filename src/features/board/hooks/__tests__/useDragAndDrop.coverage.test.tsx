import { renderHook, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  UseMutationResult,
} from "@tanstack/react-query";
import { ReactNode } from "react";
import { useDragAndDrop } from "../useDragAndDrop";
import { useBoardState } from "@/features/board/hooks/useBoardState";
import { usePatients } from "@/api/query/hooks/usePatientQueries";
import { useDragDropStatusUpdater } from "../useDragDropStatusUpdater";
import * as modalStore from "@/stores/modalStore";
import * as appointmentQueries from "@/api/query/hooks/useAppointmentQueries";
import { AppointmentByDate, AppointmentStatusDetail } from "@/types/types";

jest.mock("@/features/board/hooks/useBoardState");
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("../useDragDropStatusUpdater");
jest.mock("@/stores/modalStore");
jest.mock("@/api/query/hooks/useAppointmentQueries");
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({
    showToast: jest.fn(),
    toasts: [],
    removeToast: jest.fn(),
  }),
}));

const mockUseAppointmentsBoardState =
  useBoardState as jest.MockedFunction<
    typeof useBoardState
  >;
const mockUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockUseDragDropStatusUpdater =
  useDragDropStatusUpdater as jest.MockedFunction<
    typeof useDragDropStatusUpdater
  >;
const mockUpdateAppointmentStatus = jest.fn();

type MockMutationResult<TData = unknown, TVariables = unknown> = Omit<
  UseMutationResult<TData, Error, TVariables, unknown>,
  "mutateAsync" | "mutate" | "reset"
> & {
  mutateAsync: jest.MockedFunction<(variables: TVariables) => Promise<TData>>;
  mutate: jest.MockedFunction<(variables: TVariables) => void>;
  reset: jest.MockedFunction<() => void>;
};

// Mock React Query hooks
const mockCheckInMutation: MockMutationResult = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  reset: jest.fn(),
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  status: "idle",
  variables: undefined,
  isPaused: false,
  submittedAt: 0,
  context: undefined,
};

const mockCompleteMutation: MockMutationResult = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  reset: jest.fn(),
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  status: "idle",
  variables: undefined,
  isPaused: false,
  submittedAt: 0,
  context: undefined,
};

const mockUpdateMutation: MockMutationResult = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  reset: jest.fn(),
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  status: "idle",
  variables: undefined,
  isPaused: false,
  submittedAt: 0,
  context: undefined,
};

const mockMarkMissedMutation: MockMutationResult = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  isError: false,
  isSuccess: false,
  reset: jest.fn(),
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  status: "idle",
  variables: undefined,
  isPaused: false,
  submittedAt: 0,
  context: undefined,
};

(appointmentQueries.useCheckInAppointment as jest.Mock).mockReturnValue(
  mockCheckInMutation,
);
(appointmentQueries.useCompleteAppointment as jest.Mock).mockReturnValue(
  mockCompleteMutation,
);
(appointmentQueries.useUpdateAppointment as jest.Mock).mockReturnValue(
  mockUpdateMutation,
);
(appointmentQueries.useMarkAppointmentAsMissed as jest.Mock).mockReturnValue(
  mockMarkMissedMutation,
);

const mockOpenPostAppointment = jest.fn();
const mockOpenPostTreatment = jest.fn();
const mockOpenNewPatientCheckIn = jest.fn();
const mockOpenMultiSection = jest.fn();
const mockOpenAssessmentBeforeTreatmentConfirm = jest.fn();

(modalStore.useOpenPostAppointment as jest.Mock).mockReturnValue(
  mockOpenPostAppointment,
);
(modalStore.useOpenPostTreatment as jest.Mock).mockReturnValue(
  mockOpenPostTreatment,
);
(modalStore.useOpenNewPatientCheckIn as jest.Mock).mockReturnValue(
  mockOpenNewPatientCheckIn,
);
(modalStore.useOpenMultiSection as jest.Mock).mockReturnValue(
  mockOpenMultiSection,
);
(
  modalStore.useOpenAssessmentBeforeTreatmentConfirm as jest.Mock
).mockReturnValue(mockOpenAssessmentBeforeTreatmentConfirm);

describe("useDragAndDrop - Coverage Enhancement", () => {
  const mockSetAppointmentsByDate = jest.fn();
  const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockPatient = (
    overrides: Partial<AppointmentStatusDetail> = {},
  ): AppointmentStatusDetail => ({
    name: "Test Patient",
    priority: "3",
    patientId: 1,
    appointmentId: 100,
    treatmentAppointmentIds: [100],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mutation mocks
    mockCheckInMutation.mutateAsync.mockResolvedValue({});
    mockCompleteMutation.mutateAsync.mockResolvedValue({});
    mockUpdateMutation.mutateAsync.mockResolvedValue({});
    mockMarkMissedMutation.mutateAsync.mockResolvedValue({});

    mockUsePatients.mockReturnValue({
      data: [{ id: 1, name: "Test Patient", status: "D" }],
      isLoading: false,
      error: null,
    } as never);

    mockUpdateAppointmentStatus.mockResolvedValue({ success: true });
    mockUseDragDropStatusUpdater.mockReturnValue(mockUpdateAppointmentStatus);
  });

  describe("Combined Treatment Logic", () => {
    it("should handle combined physiotherapy+tens treatment moves within physiotherapy/tens sections", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [
            createMockPatient({ patientId: 1, name: "Combined Patient" }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [
            createMockPatient({ patientId: 1, name: "Combined Patient" }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag with combined treatment
      act(() => {
        result.current.handleDragStart("physiotherapy", 0, "scheduled", 1);
      });

      // Drop to tens section (should move both parts together)
      await act(async () => {
        await result.current.handleDropWithConfirm("tens", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });

    it("should handle combined treatment moves from assessment section (move only assessment)", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({ patientId: 1, name: "Assessment Patient" }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment section with combined treatment
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled", 1);
      });

      // Drop to assessment checkedIn (should move only assessment part)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });
  });

  describe("Completion Flow with Modal Handling", () => {
    it("should open PostConsultationModal for assessment completion", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [
            createMockPatient({
              patientId: 1,
              appointmentId: 100,
              name: "Assessment Patient",
            }),
          ],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment checkedIn
      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn");
      });

      // Drop to completed (should open PostConsultationModal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "completed");
      });

      expect(mockOpenPostAppointment).toHaveBeenCalledWith({
        appointmentId: 100,
        patientId: 1,
        patientName: "Assessment Patient",
        appointmentType: "assessment",
        currentTreatmentStatus: "T",
        currentStartDate: undefined,
        currentReturnWeeks: undefined,
        isFirstAppointment: false,
        onComplete: expect.any(Function),
      });
      expect(result.current.dragged).toBeNull();
    });

    it("should open PostTreatmentModal for physiotherapy completion", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [
            createMockPatient({
              patientId: 2,
              appointmentId: 200,
              name: "Physiotherapy Patient",
            }),
          ],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from physiotherapy checkedIn
      act(() => {
        result.current.handleDragStart("physiotherapy", 0, "checkedIn");
      });

      // Drop to completed (should open PostTreatmentModal)
      await act(async () => {
        await result.current.handleDropWithConfirm(
          "physiotherapy",
          "completed",
        );
      });

      expect(mockOpenPostTreatment).toHaveBeenCalledWith({
        appointmentIds: [200],
        patientId: 2,
        patientName: "Physiotherapy Patient",
        appointmentType: "physiotherapy",
        onComplete: expect.any(Function),
      });
      expect(result.current.dragged).toBeNull();
    });

    it("should handle first-time patient detection for assessment completion", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [
            createMockPatient({
              patientId: 3,
              appointmentId: 300,
              name: "New Patient",
            }),
          ],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      // Mock patient with status "N" (new patient)
      mockUsePatients.mockReturnValue({
        data: [{ id: 3, name: "New Patient", status: "N" }],
        isLoading: false,
        error: null,
      } as never);

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment checkedIn
      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn");
      });

      // Drop to completed
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "completed");
      });

      expect(mockOpenPostAppointment).toHaveBeenCalledWith(
        expect.objectContaining({
          isFirstAppointment: true,
        }),
      );
    });
  });

  describe("Multi-Section Modal Handling", () => {
    it("should open multi-section modal for patient in both assessment and physiotherapy", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({
              patientId: 4,
              appointmentId: 401,
              name: "Multi Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [
            createMockPatient({
              patientId: 4,
              appointmentId: 402,
              name: "Multi Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment scheduled
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      // Drop to assessment checkedIn (should trigger multi-section modal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockOpenMultiSection).toHaveBeenCalledWith(
        expect.any(Function), // checkInAll callback
        expect.any(Function), // checkInSingle callback
      );
      expect(result.current.dragged).toBeNull();
    });

    it("should execute checkInAll functionality correctly", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({
              patientId: 5,
              appointmentId: 501,
              treatmentAppointmentIds: [501],
              name: "Multi All Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [
            createMockPatient({
              patientId: 5,
              appointmentId: 502,
              treatmentAppointmentIds: [502],
              name: "Multi All Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          scheduled: [
            createMockPatient({
              patientId: 5,
              appointmentId: 503,
              treatmentAppointmentIds: [503],
              name: "Multi All Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment scheduled
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      // Drop to assessment checkedIn (should trigger multi-section modal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      // Get the checkInAll callback and execute it
      const checkInAllCallback = mockOpenMultiSection.mock.calls[0][0];

      await act(async () => {
        await checkInAllCallback();
      });

      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(501, "checkedIn");
      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(502, "checkedIn");
      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(503, "checkedIn");

      // Should have updated local state
      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
    });

    it("should handle backend sync failures gracefully in checkInAll", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({
              patientId: 6,
              appointmentId: 601,
              treatmentAppointmentIds: [601],
              name: "Error Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [
            createMockPatient({
              patientId: 6,
              appointmentId: 602,
              treatmentAppointmentIds: [602],
              name: "Error Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUpdateAppointmentStatus.mockRejectedValue(new Error("Backend error"));

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag and trigger multi-section modal
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      // Execute checkInAll callback
      const checkInAllCallback = mockOpenMultiSection.mock.calls[0][0];

      await act(async () => {
        await checkInAllCallback();
      });

      // Should still update local state even if backend sync fails (errors are caught)
      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
      expect(mockUpdateAppointmentStatus).toHaveBeenCalled();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle completion move when patient is not found", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag with non-existent patient
      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn");
      });

      // Drop to completed (patient not found, should reset dragged state)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "completed");
      });

      expect(mockOpenPostAppointment).not.toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });

    it("should handle completion move when patient has no appointmentId", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [
            createMockPatient({
              patientId: 7,
              appointmentId: undefined, // No appointmentId
              name: "No ID Patient",
            }) as AppointmentStatusDetail,
          ],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from patient without appointmentId
      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn");
      });

      // Drop to completed (should not open modal due to missing appointmentId)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "completed");
      });

      expect(mockOpenPostAppointment).not.toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });
  });

  describe("New Patient Check-In Modal Routing", () => {
    it("should open NewPatientCheckInModal when moving new patient from scheduled to checkedIn", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({
              patientId: 8,
              appointmentId: 801,
              name: "New Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      // Mock patient with status "N" (new patient)
      mockUsePatients.mockReturnValue({
        data: [{ id: "8", name: "New Patient", status: "N" }],
        isLoading: false,
        error: null,
      } as never);

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Start drag from assessment scheduled
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      // Drop to checkedIn (should trigger NewPatientCheckInModal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockOpenNewPatientCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 801,
          patient: expect.objectContaining({ id: "8", status: "N" }),
        }),
      );
      expect(result.current.dragged).toBeNull();
    });

    it("should NOT open NewPatientCheckInModal when moving new patient from onGoing to checkedIn", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [],
          checkedIn: [],
          onGoing: [
            createMockPatient({
              patientId: 9,
              appointmentId: 901,
              name: "New Patient OnGoing",
            }),
          ],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      // Mock patient with status "N" (new patient) - still new even though in onGoing
      mockUsePatients.mockReturnValue({
        data: [{ id: "9", name: "New Patient OnGoing", status: "N" }],
        isLoading: false,
        error: null,
      } as never);

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Clear any previous calls
      mockOpenNewPatientCheckIn.mockClear();

      // Start drag from assessment onGoing
      act(() => {
        result.current.handleDragStart("assessment", 0, "onGoing");
      });

      // Drop to checkedIn (should NOT trigger NewPatientCheckInModal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      // Verify modal was NOT opened
      expect(mockOpenNewPatientCheckIn).not.toHaveBeenCalled();

      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(901, "checkedIn");
    });

    it("should NOT open NewPatientCheckInModal when moving existing patient from scheduled to checkedIn", async () => {
      const mockAppointmentsByDate: AppointmentByDate = {
        date: "2024-01-15",
        assessment: {
          scheduled: [
            createMockPatient({
              patientId: 10,
              appointmentId: 1001,
              name: "Existing Patient",
            }),
          ],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        physiotherapy: {
          scheduled: [],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
        tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
        combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
      };

      // Mock patient with status "T" (existing/in treatment patient)
      mockUsePatients.mockReturnValue({
        data: [{ id: "10", name: "Existing Patient", status: "T" }],
        isLoading: false,
        error: null,
      } as never);

      mockUseAppointmentsBoardState.mockReturnValue({
        appointmentsByDate: mockAppointmentsByDate,
        setAppointmentsByDate: mockSetAppointmentsByDate,
      } as never);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      // Clear any previous calls
      mockOpenNewPatientCheckIn.mockClear();

      // Start drag from assessment scheduled
      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      // Drop to checkedIn (should NOT trigger NewPatientCheckInModal)
      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      // Verify modal was NOT opened for existing patient
      expect(mockOpenNewPatientCheckIn).not.toHaveBeenCalled();

      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(
        1001,
        "checkedIn",
      );
    });
  });
});
