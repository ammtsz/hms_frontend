import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PostTreatmentModal from "..";
import * as modalStore from "@/stores/modalStore";
import * as treatmentsQueriesModule from "@/api/query/hooks/useTreatmentsQueries";
import * as sessionsQueriesHooks from "@/api/query/hooks/useSessionsQueries";
import * as attendanceQueries from "@/api/query/hooks/useAttendanceQueries";
import type { TreatmentResponseDto, SessionResponseDto } from "@/api/types";

jest.mock("@/stores/modalStore");
jest.mock("@/api/query/hooks/useTreatmentsQueries");
jest.mock("@/api/query/hooks/useSessionsQueries");
jest.mock("@/api/query/hooks/useAttendanceQueries");

const mockModalStore = modalStore as jest.Mocked<typeof modalStore>;
const mockTreatmentsQueries = treatmentsQueriesModule as jest.Mocked<
  typeof treatmentsQueriesModule
>;
const mockSessionsQueriesHooks = sessionsQueriesHooks as jest.Mocked<
  typeof sessionsQueriesHooks
>;
const mockAttendanceQueries = attendanceQueries as jest.Mocked<
  typeof attendanceQueries
>;

const mockScheduledRecord: SessionResponseDto = {
  id: 101,
  treatmentId: 1,
  attendanceId: 1,
  sessionNumber: 4,
  scheduledDate: "2024-01-15",
  status: "scheduled",
  createdDate: "2024-01-01",
  createdTime: "10:00:00",
  updatedDate: "2024-01-01",
  updatedTime: "10:00:00",
};

const mockTreatmentWithSessions: TreatmentResponseDto = {
  id: 1,
  consultationId: 1,
  attendanceId: 1,
  patientId: 123,
  treatmentType: "physiotherapy",
  bodyLocation: "Head",
  startDate: "2024-01-01",
  plannedSessions: 10,
  completedSessions: 3,
  status: "in_progress",
  durationMinutes: 15,
  color: "Blue",
  notes: undefined,
  sessions: [
    { ...mockScheduledRecord, sessionNumber: 1, status: "completed" as const },
    { ...mockScheduledRecord, sessionNumber: 2, status: "completed" as const },
    { ...mockScheduledRecord, sessionNumber: 3, status: "completed" as const },
    {
      ...mockScheduledRecord,
      id: 101,
      sessionNumber: 4,
      status: "scheduled" as const,
    },
  ],
  createdDate: "2024-01-01",
  createdTime: "10:00:00",
  updatedDate: "2024-01-01",
  updatedTime: "10:00:00",
};

const mockPostTreatmentModal = {
  isOpen: true,
  attendanceIds: [1],
  patientId: 123,
  patientName: "Test Patient",
  attendanceType: "physiotherapy" as const,
  treatmentSummaries: [],
  isLoadingTreatmentSummaries: false,
  onComplete: jest.fn(),
};

const mockCloseModal = jest.fn();

/** Minimal `useSessionsByPatient` mock (hook only reads data, loading, error, refetch). */
const mockUseSessionsByPatientResult = (
  data: SessionResponseDto[] = mockTreatmentWithSessions.sessions ?? [],
  options: {
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
  } = {},
): ReturnType<typeof sessionsQueriesHooks.useSessionsByPatient> =>
  ({
    data,
    isLoading: options.isLoading ?? false,
    isError: options.isError ?? false,
    error: options.error ?? null,
    refetch: jest.fn().mockResolvedValue(undefined),
  }) as unknown as ReturnType<typeof sessionsQueriesHooks.useSessionsByPatient>;

describe("PostTreatmentModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockModalStore.usePostTreatmentModal.mockReturnValue(
      mockPostTreatmentModal,
    );
    mockModalStore.useCloseModal.mockReturnValue(mockCloseModal);

    const dataByAttendance = new Map<number, SessionResponseDto[]>();
    dataByAttendance.set(1, [mockScheduledRecord]);

    mockSessionsQueriesHooks.useSessionsByAttendances.mockReturnValue({
      dataByAttendance,
      isLoading: false,
      isError: false,
      error: null,
      results: [],
      refetch: jest.fn().mockResolvedValue(undefined),
    });

    mockSessionsQueriesHooks.useSessionsByPatient.mockReturnValue(
      mockUseSessionsByPatientResult(),
    );

    mockTreatmentsQueries.useTreatmentsByPatient.mockReturnValue({
      treatments: [mockTreatmentWithSessions],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockSessionsQueriesHooks.useCompleteSession.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof sessionsQueriesHooks.useCompleteSession>);

    mockAttendanceQueries.useCompleteAttendance.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof attendanceQueries.useCompleteAttendance>);

    mockAttendanceQueries.useDeleteAttendance.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof attendanceQueries.useDeleteAttendance>);

    jest.clearAllMocks();
  });

  const renderModal = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <PostTreatmentModal />
      </QueryClientProvider>,
    );

  describe("Modal State", () => {
    it("should render when modal is open", () => {
      renderModal();
      expect(
        screen.getByText("Register Treatment Session"),
      ).toBeInTheDocument();
      expect(screen.getByText("Patient: Test Patient")).toBeInTheDocument();
    });

    it("should not render when modal is closed", () => {
      mockModalStore.usePostTreatmentModal.mockReturnValue({
        ...mockPostTreatmentModal,
        isOpen: false,
      });
      renderModal();
      expect(
        screen.queryByText("Register Treatment Session"),
      ).not.toBeInTheDocument();
    });

    it("should show loading state", () => {
      mockSessionsQueriesHooks.useSessionsByAttendances.mockReturnValue({
        dataByAttendance: new Map(),
        isLoading: true,
        isError: false,
        error: null,
        results: [],
        refetch: jest.fn().mockResolvedValue(undefined),
      });
      mockSessionsQueriesHooks.useSessionsByPatient.mockReturnValue(
        mockUseSessionsByPatientResult([], { isLoading: true }),
      );
      renderModal();
      expect(screen.getAllByText("Loading...")[0]).toBeInTheDocument();
    });

    it("should show error state", () => {
      mockSessionsQueriesHooks.useSessionsByAttendances.mockReturnValue({
        dataByAttendance: new Map(),
        isLoading: false,
        isError: true,
        error: new Error("Failed to load"),
        results: [],
        refetch: jest.fn().mockResolvedValue(undefined),
      });
      renderModal();
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });

    it("should show empty state when no rows", () => {
      mockSessionsQueriesHooks.useSessionsByAttendances.mockReturnValue({
        dataByAttendance: new Map(),
        isLoading: false,
        isError: false,
        error: null,
        results: [],
        refetch: jest.fn().mockResolvedValue(undefined),
      });
      mockSessionsQueriesHooks.useSessionsByPatient.mockReturnValue(
        mockUseSessionsByPatientResult([]),
      );
      renderModal();
      expect(screen.getByText(/no treatments found/i)).toBeInTheDocument();
    });
  });

  describe("Rows and interactions", () => {
    it("should display one row with treatment type and body location", () => {
      renderModal();
      expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
      expect(screen.getByText(/Head/)).toBeInTheDocument();
    });

    it("should show session label and circles", () => {
      renderModal();
      expect(screen.getByText(/Session 4 of 10/)).toBeInTheDocument();
      expect(screen.getByText(/completed sessions|session completed/)).toBeInTheDocument();
    });

    it("should have all checkboxes checked by default", () => {
      renderModal();
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("should close modal when cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(mockCloseModal).toHaveBeenCalledWith("postTreatment");
    });

    it("should close modal when X is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(mockCloseModal).toHaveBeenCalledWith("postTreatment");
    });

    it("should show reason textarea when row is unchecked", async () => {
      renderModal();
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      await waitFor(() => {
        expect(
          screen.getByLabelText(/reason.*non-performance/i),
        ).toBeInTheDocument();
      });
    });

    it("should disable submit when no row is checked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("checkbox"));
      expect(
        screen.getByRole("button", { name: /Register Session/i }),
      ).toBeDisabled();
    });

    it("should call onComplete with completed attendance ids on successful submit", async () => {
      renderModal();
      fireEvent.click(
        screen.getByRole("button", { name: /Register Session/i }),
      );

      await waitFor(() => {
        expect(mockPostTreatmentModal.onComplete).toHaveBeenCalledWith([1]);
      });
      expect(mockCloseModal).toHaveBeenCalledWith("postTreatment");
    });

    it("should show error and not call onComplete when submit fails", async () => {
      mockSessionsQueriesHooks.useCompleteSession.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error("API Error")),
        isPending: false,
      } as unknown as ReturnType<
        typeof sessionsQueriesHooks.useCompleteSession
      >);

      renderModal();
      fireEvent.click(
        screen.getByRole("button", { name: /Register Session/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/error submitting/i)).toBeInTheDocument();
      });
      expect(mockPostTreatmentModal.onComplete).not.toHaveBeenCalled();
    });
  });
});
