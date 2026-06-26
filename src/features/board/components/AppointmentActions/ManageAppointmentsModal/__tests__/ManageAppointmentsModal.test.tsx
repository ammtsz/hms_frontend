import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManageAppointmentsModal } from "../ManageAppointmentsModal";
import * as modalStore from "@/stores/modalStore";
import * as appointmentQueriesHook from "@/api/query/hooks/useAppointmentQueries";
import * as useTreatmentsWithSessionRowsHook from "@/api/query/hooks/useTreatmentsWithSessionRows";
import * as patientQueriesHook from "@/api/query/hooks/usePatientQueries";

// Mock the hooks
jest.mock("@/stores/modalStore");
jest.mock("@/api/query/hooks/useAppointmentQueries");
jest.mock("@/api/query/hooks/useTreatmentsWithSessionRows");
jest.mock("@/api/query/hooks/usePatientQueries");
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

const mockUseCancellationModal = modalStore.useCancellationModal as jest.Mock;
const mockUseCloseModal = modalStore.useCloseModal as jest.Mock;
const mockUseSetCancellationLoading =
  modalStore.useSetCancellationLoading as jest.Mock;
const mockUseBulkCancelAppointments =
  appointmentQueriesHook.useBulkCancelAppointments as jest.Mock;
const mockUseBulkPostponeAppointments =
  appointmentQueriesHook.useBulkPostponeAppointments as jest.Mock;
const mockUseNextAvailableDate =
  appointmentQueriesHook.useNextAvailableDate as jest.Mock;
const mockUseTreatmentsWithSessionRows =
  useTreatmentsWithSessionRowsHook.useTreatmentsWithSessionRows as jest.Mock;
const mockUseUpdatePatient = patientQueriesHook.useUpdatePatient as jest.Mock;
const mockUseFetchAppointmentPatientId =
  appointmentQueriesHook.useFetchAppointmentPatientId as jest.Mock;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const mockSession = {
  sessionRow: {
    id: 1,
    appointmentId: 10,
    patientId: 5,
    patientStatus: "N",
  },
  treatment: {
    treatmentType: "physiotherapy",
    bodyLocation: "Head",
    durationMinutes: 45,
  },
};

describe("ManageAppointmentsModal", () => {
  const mockOnRefresh = jest.fn();
  const mockUpdatePatientMutate = jest.fn();
  const mockCloseModalFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(mockCloseModalFn);
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseBulkCancelAppointments.mockReturnValue({ mutateAsync: jest.fn() });
    mockUseBulkPostponeAppointments.mockReturnValue({ mutateAsync: jest.fn() });
    mockUseNextAvailableDate.mockReturnValue({
      data: {},
      isLoading: false,
    });
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    mockUpdatePatientMutate.mockReset();
    mockUseUpdatePatient.mockReturnValue({
      mutateAsync: mockUpdatePatientMutate,
    });
    mockUseFetchAppointmentPatientId.mockReturnValue(
      jest.fn().mockResolvedValue({ patientId: 42 }),
    );
    (
      appointmentQueriesHook.useRecomputeReturnForEpisode as jest.Mock
    ).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ rescheduled: false }),
    });
  });

  it("should not render when modal is closed", () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: false,
      appointmentIds: [],
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [],
      isLoading: false,
    });

    const { container } = renderWithProvider(
      <ManageAppointmentsModal onRefresh={mockOnRefresh} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should display modal with session list when open", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText(/Manage Appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Physiotherapy: Head/i)).toBeInTheDocument();
    });
  });

  it("should allow selecting and deselecting sessions", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    const checkbox = screen.getByRole("checkbox");

    // Click to select
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click to deselect
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("should disable action buttons when no selection is made", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    const rescheduleBtn = screen.getByRole("button", { name: /Reschedule/i });
    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Appointment/i,
    });

    expect(rescheduleBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
  });

  it("should call onRefresh callback after successful operation", async () => {
    const mockMutateAsync = jest
      .fn()
      .mockResolvedValue({ successCount: 1, failureCount: 0, failures: [] });

    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseBulkCancelAppointments.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
    mockUseNextAvailableDate.mockReturnValue({
      data: {},
      isLoading: false,
    });
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    // Wait for the modal to initialize with appointment IDs from the useEffect
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /Cancel Appointment \(1\)/i,
        }),
      ).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Appointment \(1\)/i,
    });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cancel Appointment/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm Cancellation/i,
    });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it("should require cancellation reason when cancel all is checked", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseBulkCancelAppointments.mockReturnValue({
      mutateAsync: jest.fn(),
    });
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /Cancel Appointment \(1\)/i,
        }),
      ).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Appointment \(1\)/i,
    });
    await userEvent.click(cancelBtn);

    const cancelAllRadio = await screen.findByRole("radio", {
      name: /Cancel all open appointments for this patient/i,
    });
    await userEvent.click(cancelAllRadio);

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm Cancellation/i,
    });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Provide a cancellation reason when cancelling all appointments/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("should cancel all open appointments and update patient status with reason", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    const mockBulkCancelMutate = jest.fn();
    mockUseBulkCancelAppointments.mockReturnValue({
      mutateAsync: mockBulkCancelMutate,
    });

    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    mockUpdatePatientMutate.mockResolvedValue({});
    mockUseFetchAppointmentPatientId.mockReturnValue(
      jest.fn().mockResolvedValue({ patientId: 42 }),
    );

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /Cancel Appointment \(1\)/i,
        }),
      ).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Appointment \(1\)/i,
    });
    await userEvent.click(cancelBtn);

    const cancelAllRadio = await screen.findByRole("radio", {
      name: /Cancel all open appointments for this patient/i,
    });
    await userEvent.click(cancelAllRadio);

    await waitFor(() => {
      expect(screen.getByLabelText(/Change status to:/i)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Cancellation reason/i);
    fireEvent.change(textarea, { target: { value: "Reason test" } });

    const form = screen
      .getByRole("button", { name: /Confirm Cancellation/i })
      .closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockUpdatePatientMutate).toHaveBeenCalledWith({
        patientId: "42",
        data: {
          patientStatus: "C",
          cancellationReason: "Reason test",
        },
      });
    });

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    expect(mockBulkCancelMutate).not.toHaveBeenCalled();
  });

  it("should show loading state when fetching sessions", () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [],
      isLoading: true,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/Loading sessions/i)).toBeInTheDocument();
  });

  it("should display action buttons when no treatment sessions found", () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/Reschedule/i)).toBeInTheDocument();
    expect(screen.getByText(/What would you like to do/i)).toBeInTheDocument();
  });

  it("should display No sessions found when no selection is made", () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument();
  });

  it("should transition to cancel view when cancel button is clicked", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);

    const cancelBtn = screen.getByRole("button", {
      name: /Cancel Appointment \(1\)/i,
    });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cancel Appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancellation reason/i)).toBeInTheDocument();
    });
  });

  it("should transition to postpone view when postpone button is clicked", async () => {
    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [],
      patientName: "John Doe",
      isLoading: false,
    });
    mockUseCloseModal.mockReturnValue(jest.fn());
    mockUseSetCancellationLoading.mockReturnValue(jest.fn());
    mockUseTreatmentsWithSessionRows.mockReturnValue({
      treatmentsWithSessionRows: [mockSession],
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);

    const rescheduleBtn = screen.getByRole("button", {
      name: /Reschedule \(1\)/i,
    });
    await userEvent.click(rescheduleBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Reschedule Appointment for/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Next available date/i)).toBeInTheDocument();
      expect(screen.getByText(/Specific date/i)).toBeInTheDocument();
    });
  });

  it("shows postpone summary and closes only after acknowledgement", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      successes: [
        {
          appointmentId: 10,
          message: "Successfully postponed",
          newDate: "2026-03-24",
        },
      ],
      failures: [],
      autoRescheduledReturns: [
        {
          appointmentId: 99,
          patientId: 5,
          patientName: "John Doe",
          oldDate: "2026-03-17",
          newDate: "2026-03-24",
        },
      ],
      failedReturnReschedules: [],
    });

    mockUseCancellationModal.mockReturnValue({
      isOpen: true,
      appointmentIds: [10],
      patientName: "John Doe",
      appointmentDate: "2025-07-01",
      isLoading: false,
    });
    mockUseBulkPostponeAppointments.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
    mockUseNextAvailableDate.mockReturnValue({
      data: { 10: "2026-03-24" },
      isLoading: false,
    });

    renderWithProvider(<ManageAppointmentsModal onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Reschedule \(1\)/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /Reschedule \(1\)/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Reschedule/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Reschedule Summary/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Assessment returns auto-rescheduled/i),
      ).toBeInTheDocument();
    });

    expect(mockCloseModalFn).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /OK, got it/i }));

    await waitFor(() => {
      expect(mockCloseModalFn).toHaveBeenCalledWith("cancellation");
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
});
