import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useManageAttendanceModal } from "../useManageAttendanceModal";
import * as modalStore from "@/stores/modalStore";
import * as treatmentsWithSessionRowsModule from "@/api/query/hooks/useTreatmentsWithSessionRows";
import * as attendanceQueries from "@/api/query/hooks/useAttendanceQueries";
import * as patientQueries from "@/api/query/hooks/usePatientQueries";
import * as toastContext from "@/contexts/ToastContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

jest.mock("@/stores/modalStore");
jest.mock("@/api/query/hooks/useTreatmentsWithSessionRows");
jest.mock("@/api/query/hooks/useAttendanceQueries");
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/contexts/ToastContext", () => ({
  useToast: jest.fn(),
}));

type MutationReturn = { mutateAsync: jest.Mock };

describe("useManageAttendanceModal", () => {
  const mockCloseModal = jest.fn();
  const mockSetCancellationLoading = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockBulkCancelMutate = jest.fn();
  const mockBulkPostponeMutate = jest.fn();

  const mockUseCancellationModal = modalStore.useCancellationModal as jest.Mock;
  const mockUseCloseModal = modalStore.useCloseModal as jest.Mock;
  const mockUseSetCancellationLoading =
    modalStore.useSetCancellationLoading as jest.Mock;
  const mockUseTreatmentsWithSessionRows =
    treatmentsWithSessionRowsModule.useTreatmentsWithSessionRows as jest.Mock;
  const mockUseBulkCancelAttendances =
    attendanceQueries.useBulkCancelAttendances as jest.Mock;
  const mockUseBulkPostponeAttendances =
    attendanceQueries.useBulkPostponeAttendances as jest.Mock;
  const mockUseNextAvailableDate =
    attendanceQueries.useNextAvailableDate as jest.Mock;
  const mockUseUpdatePatient = patientQueries.useUpdatePatient as jest.Mock;
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      attendanceIds: [1, 2],
      patientName: "Paciente Teste",
      attendanceDate: "2025-07-01",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(mockCloseModal);
    mockUseSetCancellationLoading.mockReturnValue(mockSetCancellationLoading);
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [],
      isLoading: false,
    });
    mockUseBulkCancelAttendances.mockReturnValue({
      mutateAsync: mockBulkCancelMutate,
    } satisfies MutationReturn);
    mockUseBulkPostponeAttendances.mockReturnValue({
      mutateAsync: mockBulkPostponeMutate,
    } satisfies MutationReturn);
    mockUseNextAvailableDate.mockReturnValue({
      data: { 1: "2026-03-24", 2: "2026-03-24" },
      isLoading: false,
    });
    mockUseUpdatePatient.mockReturnValue({
      mutateAsync: jest.fn(),
    });
    (attendanceQueries.useFetchAttendancePatientId as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue({ patientId: 42 }),
    );
    (attendanceQueries.useRecomputeReturnForEpisode as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ rescheduled: false }),
    });
    (toastContext.useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it("initializes selection from modal attendance ids", () => {
    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );

    expect(result.current.state.selectedAttendanceIds).toEqual([1, 2]);
    expect(result.current.state.patientName).toBe("Paciente Teste");
  });

  it("toggles selection correctly", () => {
    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );

    act(() => {
      result.current.handlers.toggleSelection(3);
    });

    expect(result.current.state.selectedAttendanceIds).toEqual([1, 2, 3]);

    act(() => {
      result.current.handlers.toggleSelection(2);
    });

    expect(result.current.state.selectedAttendanceIds).toEqual([1, 3]);
  });

  it("clears selected date when switching to by_date mode", () => {
    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );

    act(() => {
      result.current.handlers.setSelectedDate("2024-05-10");
      result.current.handlers.setPostponeMode("by_date");
    });

    expect(result.current.state.postponeMode).toBe("by_date");
    expect(result.current.state.selectedDate).toBe("");
  });

  it("defaults to next_available postpone mode", () => {
    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    expect(result.current.state.postponeMode).toBe("next_available");
  });

  it("sets error when cancelling without selection", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      attendanceIds: [],
      patientName: "Paciente Teste",
      isLoading: false,
    });

    const { result, rerender } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );

    // Ensure the useEffect has run and state is updated
    await act(async () => {
      rerender();
    });

    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmCancellation(event);
    });

    expect(result.current.state.error).toContain(
      "Selecione pelo menos um atendimento para cancelar",
    );
    expect(mockSetCancellationLoading).not.toHaveBeenCalled();
  });

  it("handles successful cancellation and calls onRefresh", async () => {
    mockBulkCancelMutate.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      failures: [],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmCancellation(event);
    });

    expect(mockBulkCancelMutate).toHaveBeenCalledWith({
      attendanceIds: [1, 2],
      cancellationReason: undefined,
    });
    expect(mockCloseModal).toHaveBeenCalledWith("cancellation");
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    expect(mockSetCancellationLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockSetCancellationLoading).toHaveBeenLastCalledWith(false);
  });

  it("reschedules by date when postponeMode is by_date", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      attendanceIds: [1],
      patientName: "Paciente Teste",
      attendanceDate: "2025-07-01",
      isLoading: false,
    });
    mockBulkPostponeMutate.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      failures: [],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      result.current.handlers.setPostponeMode("by_date");
      result.current.handlers.setSelectedDate("2026-04-15");
    });
    await act(async () => {
      await result.current.handlers.handleConfirmPostpone(event);
    });

    expect(mockBulkPostponeMutate).toHaveBeenCalledWith({
      attendanceIds: [1],
      newDate: "2026-04-15",
      rescheduleReturnAssessment: false,
    });
  });

  it("reschedules to next available date when postponeMode is next_available", async () => {
    mockBulkPostponeMutate.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      failures: [],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmPostpone(event);
    });

    expect(mockBulkPostponeMutate).toHaveBeenCalledWith({
      attendanceIds: [1, 2],
      newDate: "2026-03-24",
      rescheduleReturnAssessment: false,
    });
  });

  it("handles postpone partial failures and keeps feedback in modal", async () => {
    mockBulkPostponeMutate.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      failures: [{ attendanceId: 1, error: "erro" }],
      successes: [{ attendanceId: 2, message: "Successfully postponed", newDate: "2026-03-24" }],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmPostpone(event);
    });

    expect(result.current.state.postponeFeedback).not.toBeNull();
    expect(result.current.state.postponeFeedback?.failures).toHaveLength(1);
    expect(mockOnRefresh).not.toHaveBeenCalled();
    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  it("captures failures in postpone feedback", async () => {
    mockBulkPostponeMutate.mockResolvedValue({
      successCount: 0,
      failureCount: 3,
      successes: [],
      failures: [
        { attendanceId: 1, error: "Data indisponível" },
        { attendanceId: 2, error: "Data indisponível" },
        { attendanceId: 3, error: "Data indisponível" },
      ],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmPostpone(event);
    });

    expect(result.current.state.postponeFeedback?.failures).toHaveLength(3);
    expect(result.current.state.error).toBe("");
  });

  it("acknowledges postpone feedback and closes modal", async () => {
    mockBulkPostponeMutate.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      successes: [{ attendanceId: 1, message: "Successfully postponed", newDate: "2026-03-24" }],
      failures: [],
      autoRescheduledReturns: [],
      failedReturnReschedules: [],
    });

    const { result } = renderHook(
      () => useManageAttendanceModal(mockOnRefresh),
      { wrapper },
    );
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmPostpone(event);
    });

    expect(result.current.state.postponeFeedback).not.toBeNull();

    act(() => {
      result.current.handlers.handleAcknowledgePostponeFeedback();
    });

    expect(mockCloseModal).toHaveBeenCalledWith("cancellation");
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("works without onRefresh callback", async () => {
    mockBulkCancelMutate.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      failures: [],
    });

    const { result } = renderHook(() => useManageAttendanceModal(), {
      wrapper,
    });
    const event = { preventDefault: jest.fn() } as unknown as FormEvent;

    await act(async () => {
      await result.current.handlers.handleConfirmCancellation(event);
    });

    expect(mockBulkCancelMutate).toHaveBeenCalled();
    expect(mockCloseModal).toHaveBeenCalledWith("cancellation");
    // Should not throw error if onRefresh is undefined
  });
});
