import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScheduledAppointmentsCard } from "../ScheduledAppointmentsCard";

// Mock all dependencies to focus on testing the component logic
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  usePatientAppointments: jest.fn(),
}));

jest.mock("@/api/query/hooks/useTreatmentsQueries", () => ({
  useTreatmentsByPatient: jest.fn(),
}));

jest.mock("@/features/patients/detail/shared/hooks/usePagination", () => ({
  usePagination: jest.fn(),
}));

jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: jest.fn(() => "12/20/2023"),
  getDaysUntil: jest.fn(() => 3),
}));

jest.mock("@/utils/apiTransformers", () => ({
  transformAppointmentToNext: jest.fn((item) => item),
}));

jest.mock("@/utils/appointmentHistoryUtils", () => ({
  groupScheduledAppointmentsByDate: jest.fn(() => []),
  getScheduledTreatmentTypesLabel: jest.fn(() => "Assessment Consultation"),
}));

jest.mock("@/components/common/LoadingSpinner", () => ({
  LoadingSpinner: ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

jest.mock("@/features/patients/detail/shared/ShowMoreButton", () => ({
  ShowMoreButton: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="show-more-button"
    >
      Show More
    </button>
  ),
}));

jest.mock("@/features/patients/detail/shared/CardStates", () => ({
  ErrorState: ({
    title,
    message,
    onRetry,
  }: {
    title: string;
    message: string;
    onRetry: () => void;
  }) => (
    <div data-testid="error-state">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onRetry} data-testid="retry-button">
        Retry
      </button>
    </div>
  ),
  ScheduledAppointmentsEmpty: () => (
    <div data-testid="empty-state">No scheduled appointments</div>
  ),
}));

jest.mock(
  "@/features/patients/detail/AppointmentDetails/TreatmentDetailsContainer",
  () => ({
    TreatmentDetailsContainer: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div data-testid="treatment-details">{children}</div>,
  }),
);

jest.mock(
  "@/features/patients/detail/AppointmentDetails/AssessmentDetails",
  () => ({
    AssessmentDetails: () => (
      <div data-testid="assessment-consultation">Assessment Consultation</div>
    ),
  }),
);

jest.mock(
  "@/features/patients/detail/AppointmentDetails/PhysiotherapyDetails",
  () => ({
    PhysiotherapyDetails: () => (
      <div data-testid="physiotherapy">Physiotherapy Treatment</div>
    ),
  }),
);

jest.mock("@/features/patients/detail/AppointmentDetails/TensDetails", () => ({
  TensDetails: () => <div data-testid="tens-details">TENS Treatment</div>,
}));

jest.mock("../ScheduledAppointmentItem", () => ({
  ScheduledAppointmentItem: ({
    groupedScheduled,
    isFirstItem,
  }: {
    groupedScheduled: {
      date: string;
      treatments: {
        assessment?: { isScheduled?: boolean };
        physiotherapy?: {
          bodyLocations?: string[];
          durationMinutes?: number;
        };
        tens?: { bodyLocations?: string[] };
      };
      notes?: string;
    };
    isFirstItem: boolean;
  }) => (
    <div data-testid="scheduled-appointment-item">
      <div data-testid={isFirstItem ? "first-item" : "other-item"}>
        {groupedScheduled.date}
      </div>
      {groupedScheduled.treatments.assessment && (
        <div data-testid="assessment-consultation">Assessment Consultation</div>
      )}
      {groupedScheduled.treatments.physiotherapy && (
        <div data-testid="physiotherapy">Physiotherapy Treatment</div>
      )}
      {groupedScheduled.treatments.tens && (
        <div data-testid="tens-details">TENS Treatment</div>
      )}
      {groupedScheduled.notes && (
        <div data-testid="notes-box">{groupedScheduled.notes}</div>
      )}
    </div>
  ),
}));

describe("ScheduledAppointmentsCard", () => {
  // Mock patient for testing - using type assertion since we only need id for this component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPatient: any = {
    id: "1",
    name: "Test Patient",
    nextAppointmentDates: [],
  };

  const mockAppointmentsHook = jest.requireMock(
    "@/api/query/hooks/usePatientQueries",
  ).usePatientAppointments;
  const mockTreatmentsByPatientHook = jest.requireMock(
    "@/api/query/hooks/useTreatmentsQueries",
  ).useTreatmentsByPatient;
  const mockPaginationHook = jest.requireMock(
    "@/features/patients/detail/shared/hooks/usePagination",
  ).usePagination;
  const mockGroupScheduled = jest.requireMock(
    "@/utils/appointmentHistoryUtils",
  ).groupScheduledAppointmentsByDate;

  beforeEach(() => {
    // Default mock implementations
    mockAppointmentsHook.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockTreatmentsByPatientHook.mockReturnValue({
      treatments: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockPaginationHook.mockReturnValue({
      visibleItems: [],
      hasMoreItems: false,
      showMore: jest.fn(),
      totalItems: 0,
      visibleCount: 0,
    });

    mockGroupScheduled.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the card header", () => {
    render(<ScheduledAppointmentsCard patient={mockPatient} />);

    expect(screen.getByText("Upcoming Appointments")).toBeInTheDocument();
    expect(screen.getByText("(0)")).toBeInTheDocument(); // Shows count
    expect(screen.getByTitle("Expand")).toBeInTheDocument(); // Card starts collapsed
  });

  it("should show loading state when data is loading and expanded", async () => {
    mockAppointmentsHook.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(
      screen.getByText("Loading upcoming appointments..."),
    ).toBeInTheDocument();
  });

  it("should show error state when there is an error and expanded", async () => {
    const mockRefetch = jest.fn();
    mockAppointmentsHook.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: "Failed to load" },
      refetch: mockRefetch,
    });

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("should show empty state when no appointments and expanded", async () => {
    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No scheduled appointments")).toBeInTheDocument();
  });

  it("should handle refresh button click when expanded", async () => {
    const mockRefetchAppointments = jest.fn();
    const mockRefetchTreatments = jest.fn();

    mockAppointmentsHook.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetchAppointments,
    });

    mockTreatmentsByPatientHook.mockReturnValue({
      treatments: [],
      loading: false,
      error: null,
      refetch: mockRefetchTreatments,
    });

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockRefetchAppointments).toHaveBeenCalled();
    expect(mockRefetchTreatments).toHaveBeenCalled();
  });

  it("should render scheduled appointments with treatment details when expanded", async () => {
    const mockGroupedAppointments = [
      {
        date: "2023-12-20",
        appointmentId: "1",
        appointmentIds: ["1"],
        treatments: {
          assessment: { isScheduled: true },
          physiotherapy: {
            bodyLocations: ["head"],
            durationMinutes: 45,
            sessionNumber: "3",
          },
        },
        notes: "Test notes",
        createdDate: "2023-12-20",
        updatedDate: "2023-12-20",
      },
    ];

    mockPaginationHook.mockReturnValue({
      visibleItems: mockGroupedAppointments,
      hasMoreItems: false,
      showMore: jest.fn(),
      totalItems: 1,
      visibleCount: 1,
    });

    mockGroupScheduled.mockReturnValue(mockGroupedAppointments);

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("scheduled-appointment-item")).toBeInTheDocument();
    expect(screen.getByTestId("assessment-consultation")).toBeInTheDocument();
    expect(screen.getByTestId("physiotherapy")).toBeInTheDocument();
    expect(screen.getByTestId("notes-box")).toBeInTheDocument();
  });

  it("should render first appointment correctly when expanded", async () => {
    const mockGroupedAppointments = [
      {
        date: "2023-12-20",
        appointmentId: "1",
        appointmentIds: ["1"],
        treatments: { assessment: { isScheduled: true } },
        notes: null,
        createdDate: "2023-12-20",
        updatedDate: "2023-12-20",
      },
    ];

    mockPaginationHook.mockReturnValue({
      visibleItems: mockGroupedAppointments,
      hasMoreItems: false,
      showMore: jest.fn(),
      totalItems: 1,
      visibleCount: 1,
    });

    mockGroupScheduled.mockReturnValue(mockGroupedAppointments);

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("first-item")).toBeInTheDocument();
    expect(screen.getByTestId("scheduled-appointment-item")).toBeInTheDocument();
  });

  it('should show "show more" button when there are more items and expanded', async () => {
    const mockShowMore = jest.fn();
    const mockGroupedAppointments = [
      {
        date: "2023-12-20",
        appointmentId: "1",
        appointmentIds: ["1"],
        treatments: {},
        createdDate: "2023-12-20",
        updatedDate: "2023-12-20",
      },
    ];

    mockPaginationHook.mockReturnValue({
      visibleItems: mockGroupedAppointments,
      hasMoreItems: true,
      showMore: mockShowMore,
      totalItems: 5,
      visibleCount: 3,
    });

    mockGroupScheduled.mockReturnValue(mockGroupedAppointments);

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    const showMoreButton = screen.getByTestId("show-more-button");
    expect(showMoreButton).toBeInTheDocument();

    fireEvent.click(showMoreButton);
    expect(mockShowMore).toHaveBeenCalled();
  });

  it("should handle treatment sessions loading error when expanded", async () => {
    mockTreatmentsByPatientHook.mockReturnValue({
      treatments: [],
      loading: false,
      error: "Treatment error",
      refetch: jest.fn(),
    });

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByText("Treatment error")).toBeInTheDocument();
  });

  it("should hide refresh button when loading", async () => {
    mockAppointmentsHook.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.queryByText("Refresh")).not.toBeInTheDocument();
  });

  it("should toggle collapse/expand state", async () => {
    render(<ScheduledAppointmentsCard patient={mockPatient} />);

    // Card starts collapsed
    expect(screen.getByTitle("Expand")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();

    // Expand the card
    fireEvent.click(screen.getByTitle("Expand"));
    expect(screen.getByTitle("Collapse")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    // Collapse again
    fireEvent.click(screen.getByTitle("Collapse"));
    expect(screen.getByTitle("Expand")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("should render multiple treatment types when expanded", async () => {
    const mockGroupedAppointments = [
      {
        date: "2023-12-20",
        appointmentId: "1",
        appointmentIds: ["1"],
        treatments: {
          assessment: { isScheduled: true },
          physiotherapy: {
            bodyLocations: [],
            durationMinutes: 45,
            sessionNumber: "1",
          },
          tens: { bodyLocations: [], sessionNumber: "1" },
        },
        notes: "Multiple treatments",
        createdDate: "2023-12-20",
        updatedDate: "2023-12-20",
      },
    ];

    mockPaginationHook.mockReturnValue({
      visibleItems: mockGroupedAppointments,
      hasMoreItems: false,
      showMore: jest.fn(),
      totalItems: 1,
      visibleCount: 1,
    });

    mockGroupScheduled.mockReturnValue(mockGroupedAppointments);

    render(<ScheduledAppointmentsCard patient={mockPatient} />);
    fireEvent.click(screen.getByTitle("Expand"));

    expect(screen.getByTestId("assessment-consultation")).toBeInTheDocument();
    expect(screen.getByTestId("physiotherapy")).toBeInTheDocument();
    expect(screen.getByTestId("tens-details")).toBeInTheDocument();
  });
});
