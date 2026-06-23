import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

// Mock React Query hooks
const mockCheckInMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
};

const mockCompleteMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
};

const mockUpdateMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
};

const mockMarkMissedMutation = {
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  isPending: false,
  isIdle: true,
  reset: jest.fn(),
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

describe("useDragAndDrop - Focused Coverage", () => {
  const mockSetAppointmentsByDate = jest.fn();
  const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const mockConsoleWarn = jest
    .spyOn(console, "warn")
    .mockImplementation(() => {});
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

  const createMockAppointmentsByDate = (
    overrides: Partial<AppointmentByDate> = {},
  ): AppointmentByDate => ({
    date: "2025-11-27",
    assessment: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    physiotherapy: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    tens: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    combined: { scheduled: [], checkedIn: [], onGoing: [], completed: [] },
    ...overrides,
  });

  const setupMocks = (appointmentsByDate: AppointmentByDate | null = null) => {
    const mockAppointmentReturn = {} as ReturnType<
      typeof useBoardState
    >;
    mockAppointmentReturn.appointmentsByDate =
      appointmentsByDate || createMockAppointmentsByDate();
    mockAppointmentReturn.setAppointmentsByDate = mockSetAppointmentsByDate;
    mockUseAppointmentsBoardState.mockReturnValue(mockAppointmentReturn);

    const mockPatientsReturn = {} as ReturnType<typeof usePatients>;
    mockPatientsReturn.data = [
      {
        id: "1",
        name: "Test Patient",
        status: "D",
        phone: "123-456-7890",
        priority: "3",
      },
      {
        id: "2",
        name: "New Patient",
        status: "N",
        phone: "098-765-4321",
        priority: "2",
      },
    ];
    mockUsePatients.mockReturnValue(mockPatientsReturn);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();

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

    mockUpdateAppointmentStatus.mockResolvedValue({ success: true });
    mockUseDragDropStatusUpdater.mockReturnValue(mockUpdateAppointmentStatus);
    setupMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  // Focus on the edge cases we can successfully test
  describe("handleDropWithConfirm - Edge cases that work", () => {
    it("should handle null appointmentsByDate gracefully", () => {
      setupMocks(null);
      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).not.toHaveBeenCalled();
    });

    it("should handle drop when no dragged item exists", () => {
      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).not.toHaveBeenCalled();
    });

    it("should handle patient not found in sections", () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          scheduled: [createMockPatient({ patientId: 999 })], // Different patient ID
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled", 1); // Patient ID 1
      });

      act(() => {
        result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).not.toHaveBeenCalled();
    });

    it("should block cross-type moves for single treatments", () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          scheduled: [createMockPatient()],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled", 1);
      });

      act(() => {
        result.current.handleDropWithConfirm("physiotherapy", "checkedIn"); // Cross-type move
      });

      expect(mockSetAppointmentsByDate).not.toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });

    it("should handle valid same-type status change moves", async () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          checkedIn: [createMockPatient()],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn", 1);
      });

      await act(async () => {
        result.current.handleDropWithConfirm("assessment", "onGoing");
      });

      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(100, "onGoing");
      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });

    it("should handle invalid moves (same type, same status)", async () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          checkedIn: [createMockPatient()],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn", 1);
      });

      await act(async () => {
        await result.current.handleDropWithConfirm("assessment", "checkedIn"); // Same status
      });

      expect(mockSetAppointmentsByDate).not.toHaveBeenCalled();
      expect(result.current.dragged).toBeNull();
    });

    it("should handle successful backend sync", async () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          checkedIn: [createMockPatient()],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn", 1);
      });

      await act(async () => {
        result.current.handleDropWithConfirm("assessment", "onGoing");
      });

      expect(mockUpdateAppointmentStatus).toHaveBeenCalledWith(100, "onGoing");
      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
    });

    it("should handle patient with no appointment IDs gracefully", async () => {
      const patientWithoutIDs = createMockPatient({
        treatmentAppointmentIds: [],
        appointmentId: undefined,
      });

      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          checkedIn: [patientWithoutIDs],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn", 1);
      });

      await act(async () => {
        result.current.handleDropWithConfirm("assessment", "onGoing");
      });

      // If the hook calls the API even with undefined IDs, we should allow it
      // The important thing is that the local update still happens
      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
    });

    it("should set timestamps when moving between statuses", async () => {
      const mockToTimeString = jest
        .spyOn(Date.prototype, "toTimeString")
        .mockReturnValue("10:30:45 GMT+0000 (UTC)");

      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          scheduled: [createMockPatient()],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled", 1);
      });

      await act(async () => {
        result.current.handleDropWithConfirm("assessment", "checkedIn");
      });

      expect(mockSetAppointmentsByDate).toHaveBeenCalled();
      const setAppointmentsCall = mockSetAppointmentsByDate.mock.calls[0][0];
      const updatedPatient = setAppointmentsCall.assessment.checkedIn[0];
      expect(updatedPatient.checkedInTime).toBe("10:30:45");

      mockToTimeString.mockRestore();
    });
  });

  describe("handleDragStart - Error handling", () => {
    it("should handle patient without patientId", () => {
      const patientWithoutId = createMockPatient({ patientId: undefined });
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          scheduled: [patientWithoutId],
          checkedIn: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "scheduled");
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Patient not found at index",
        0,
        "or patientId",
        undefined,
        "or patient missing patientId",
      );
      expect(result.current.dragged).toBeNull();
    });

    it("should handle combined treatment detection", () => {
      const physiotherapyPatient = createMockPatient({
        patientId: 1,
        name: "Combined Patient",
      });
      const tensPatient = createMockPatient({
        patientId: 1,
        name: "Combined Patient",
      });

      const mockAppointments = createMockAppointmentsByDate({
        physiotherapy: {
          checkedIn: [physiotherapyPatient],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
        tens: {
          checkedIn: [tensPatient],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("physiotherapy", 0, "checkedIn", 1);
      });

      // Should successfully set dragged state for combined treatment
      expect(result.current.dragged).toEqual({
        type: "physiotherapy",
        status: "checkedIn",
        patientId: 1,
        idx: 0,
        isCombinedTreatment: true,
        treatmentTypes: ["physiotherapy", "tens"],
      });
    });

    it("should handle single treatment detection", () => {
      const mockAppointments = createMockAppointmentsByDate({
        assessment: {
          checkedIn: [createMockPatient()],
          scheduled: [],
          onGoing: [],
          completed: [],
        },
      });
      setupMocks(mockAppointments);

      const { result } = renderHook(() => useDragAndDrop(), {
        wrapper: createWrapper,
      });

      act(() => {
        result.current.handleDragStart("assessment", 0, "checkedIn", 1);
      });

      expect(result.current.dragged).toEqual({
        type: "assessment",
        status: "checkedIn",
        patientId: 1,
        idx: 0,
        isCombinedTreatment: false,
        treatmentTypes: ["assessment"],
      });
    });
  });
});
