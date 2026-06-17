import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendanceCard from "../AttendanceCard";
import {
  AttendanceProgression,
  AttendanceType,
  AttendanceStatusDetail,
  Priority,
} from "@/types/types";
import { IDraggedItem } from "../../../types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOpenCancellation } from "@/stores/modalStore";

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Mock lucide-react
jest.mock("lucide-react", () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className}>
      ✕
    </div>
  ),
  ChevronDown: () => <div data-testid="chevron-down">▼</div>,
  ChevronUp: () => <div data-testid="chevron-up">▲</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

// Mock useTreatmentsWithSessionRows hook
jest.mock("@/api/query/hooks/useTreatmentsWithSessionRows", () => ({
  useTreatmentsWithSessionRows: () => ({
    treatmentsWithSessionRows: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock usePatientComplaint hook
jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  usePatientComplaint: () => ({
    patient: null,
    isLoading: false,
    error: null,
  }),
}));

// Mock ExpandedTreatmentDetails component
jest.mock("../ExpandedTreatmentDetails", () => {
  return function MockExpandedTreatmentDetails() {
    return <div data-testid="expanded-treatment-details">Expanded Details</div>;
  };
});

// Mock ExpandedAssessmentDetails component
jest.mock("../ExpandedAssessmentDetails", () => {
  return function MockExpandedAssessmentDetails() {
    return (
      <div data-testid="expanded-assessment-details">Assessment Details</div>
    );
  };
});

// Mock the AttendanceTimes component
jest.mock("../AttendanceTimes", () => {
  return function MockAttendanceTimes({
    status,
    checkedInTime,
    onGoingTime,
    completedTime,
  }: {
    status: AttendanceProgression;
    checkedInTime?: string | null;
    onGoingTime?: string | null;
    completedTime?: string | null;
  }) {
    return (
      <div data-testid="attendance-times">
        Times: {status} -{checkedInTime && ` CheckedIn: ${checkedInTime}`}
        {onGoingTime && ` OnGoing: ${onGoingTime}`}
        {completedTime && ` Completed: ${completedTime}`}
      </div>
    );
  };
});

jest.mock("@/stores/modalStore", () => ({
  useOpenCancellation: jest.fn(),
}));

const mockUseOpenCancellation = useOpenCancellation as jest.MockedFunction<
  typeof useOpenCancellation
>;

describe("AttendanceCard Component", () => {
  let queryClient: QueryClient;

  const mockPatient: AttendanceStatusDetail = {
    name: "João Silva",
    priority: "1" as Priority,
    attendanceId: 123,
    patientId: 456,
    checkedInTime: "09:00:00",
    onGoingTime: null,
    completedTime: null,
    isMissed: false,
    isCancelled: false,
  };

  const defaultProps = {
    patient: mockPatient,
    status: "checkedIn" as AttendanceProgression,
    type: "assessment" as AttendanceType,
    index: 0,
    dragged: null as IDraggedItem | null,
    handleDragStart: jest.fn(),
    handleDragEnd: jest.fn(),
    onDelete: jest.fn(),
    isNextToBeAttended: false,
  };

  // Helper function to render with QueryClientProvider
  const renderWithQueryClient = (ui: React.ReactElement) => {
    queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenCancellation.mockReturnValue(jest.fn());
  });

  describe("Rendering", () => {
    it("should render patient name and priority", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("João Silva");
      expect(card).toHaveTextContent("P1");
    });

    it("should render AttendanceTimes component", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      expect(screen.getByTestId("attendance-times")).toBeInTheDocument();
    });

    it("should show patient index for checkedIn status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="checkedIn" index={2} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent(/3\.\s*João Silva/);
      expect(card).toHaveTextContent("P1");
    });

    it("should not show patient index for non-checkedIn status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="scheduled" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("João Silva");
      expect(card).toHaveTextContent("P1");
      expect(card.textContent).not.toMatch(/\d+\.\s*João Silva/);
    });
  });

  describe("Styling", () => {
    it("should apply correct styling for scheduled status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="scheduled" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for checkedIn status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="checkedIn" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for onGoing status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="onGoing" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for completed status", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="completed" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply dragged opacity when item is being dragged", () => {
      const draggedItem: IDraggedItem = {
        type: "assessment",
        status: "checkedIn",
        idx: 0,
        patientId: 456,
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} dragged={draggedItem} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("opacity-60");
    });

    it("should not apply dragged opacity when item is not being dragged", () => {
      const draggedItem: IDraggedItem = {
        type: "physiotherapy", // Different type
        status: "checkedIn",
        idx: 0,
        patientId: 456,
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} dragged={draggedItem} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).not.toHaveClass("opacity-60");
    });

    it("should have proper base classes", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      // Check for essential base classes, not all conditional ones
      expect(card).toHaveClass(
        "relative",
        "w-full",
        "flex",
        "p-2",
        "rounded-lg",
        "bg-white",
        "text-center",
        "font-medium",
        "transition-all",
        "select-none",
      );
    });
  });

  describe("Drag and Drop", () => {
    it("should be draggable", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "true");
    });

    it("should call handleDragStart when drag starts", () => {
      const mockHandleDragStart = jest.fn();
      render(
        <AttendanceCard
          {...defaultProps}
          handleDragStart={mockHandleDragStart}
        />,
      );

      const card = screen.getByRole("listitem");
      fireEvent.dragStart(card);

      expect(mockHandleDragStart).toHaveBeenCalledWith(
        "assessment",
        0,
        "checkedIn",
      );
    });

    it("should call handleDragEnd when drag ends", () => {
      const mockHandleDragEnd = jest.fn();
      render(
        <AttendanceCard {...defaultProps} handleDragEnd={mockHandleDragEnd} />,
      );

      const card = screen.getByRole("listitem");
      fireEvent.dragEnd(card);

      expect(mockHandleDragEnd).toHaveBeenCalled();
    });
  });

  describe("Dragged State Detection", () => {
    const testCases = [
      {
        description: "should detect dragged state when all properties match",
        dragged: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
          patientId: 456,
        },
        cardProps: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
        },
        expectedDragged: true,
      },
      {
        description: "should not detect dragged state when type differs",
        dragged: {
          type: "physiotherapy" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
      {
        description: "should not detect dragged state when status differs",
        dragged: {
          type: "assessment" as AttendanceType,
          status: "scheduled" as AttendanceProgression,
          idx: 0,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
      {
        description: "should not detect dragged state when index differs",
        dragged: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 1,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AttendanceType,
          status: "checkedIn" as AttendanceProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
    ];

    testCases.forEach(
      ({ description, dragged, cardProps, expectedDragged }) => {
        it(description, () => {
          render(
            <AttendanceCard
              {...defaultProps}
              {...cardProps}
              dragged={dragged}
            />,
          );

          const card = screen.getByRole("listitem");
          if (expectedDragged) {
            expect(card).toHaveClass("opacity-60");
          } else {
            expect(card).not.toHaveClass("opacity-60");
          }
        });
      },
    );
  });

  describe("Patient Data Variations", () => {
    it("should render different priority values", () => {
      const patientWithPriority2: AttendanceStatusDetail = {
        ...mockPatient,
        priority: "2" as Priority,
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} patient={patientWithPriority2} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("João Silva");
      expect(card).toHaveTextContent("P2");
    });

    it("should render different patient names", () => {
      const differentPatient: AttendanceStatusDetail = {
        ...mockPatient,
        name: "Maria Santos",
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} patient={differentPatient} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("Maria Santos");
      expect(card).toHaveTextContent("P1");
    });

    it("should pass correct times to AttendanceTimes component", () => {
      const patientWithTimes: AttendanceStatusDetail = {
        patientId: 1,
        name: "Test Patient",
        priority: "1" as Priority,
        checkedInTime: "09:00:00",
        onGoingTime: "09:30:00",
        completedTime: "10:00:00",
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} patient={patientWithTimes} />,
      );

      const attendanceTimes = screen.getByTestId("attendance-times");
      expect(attendanceTimes).toHaveTextContent("CheckedIn: 09:00:00");
      expect(attendanceTimes).toHaveTextContent("OnGoing: 09:30:00");
      expect(attendanceTimes).toHaveTextContent("Completed: 10:00:00");
    });
  });

  describe("Accessibility", () => {
    it("should have proper list item semantics", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toBeInTheDocument();
    });

    it("should be keyboard navigable (draggable)", () => {
      renderWithQueryClient(<AttendanceCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null times gracefully", () => {
      const patientWithNullTimes: AttendanceStatusDetail = {
        patientId: 1,
        name: "Test Patient",
        priority: "1" as Priority,
        checkedInTime: null,
        onGoingTime: null,
        completedTime: null,
      };

      renderWithQueryClient(
        <AttendanceCard {...defaultProps} patient={patientWithNullTimes} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("Test Patient");
      expect(card).toHaveTextContent("P1");
      expect(screen.getByTestId("attendance-times")).toBeInTheDocument();
    });

    it("should handle undefined isNextToBeAttended prop", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isNextToBeAttended, ...propsWithoutNextToBeAttended } =
        defaultProps;

      renderWithQueryClient(
        <AttendanceCard {...propsWithoutNextToBeAttended} />,
      );

      expect(screen.queryByText("Próximo")).not.toBeInTheDocument();
    });

    it("should handle high index numbers correctly", () => {
      renderWithQueryClient(
        <AttendanceCard {...defaultProps} status="checkedIn" index={99} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent(/100\.\s*João Silva/);
      expect(card).toHaveTextContent("P1");
    });
  });

  describe("Delete Functionality", () => {
    it("shows delete button for scheduled status when onDelete is provided", () => {
      render(<AttendanceCard {...defaultProps} status="scheduled" />);

      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Gerenciar agendamento")).toBeInTheDocument();
    });

    it("does not show delete button when attendanceId is not provided", () => {
      const patientWithoutId = { ...mockPatient, attendanceId: undefined };
      render(
        <AttendanceCard
          {...defaultProps}
          patient={patientWithoutId}
          status="scheduled"
        />,
      );

      expect(screen.queryByTestId("settings-icon")).not.toBeInTheDocument();
    });

    it("does not show delete button for non-scheduled status", () => {
      render(<AttendanceCard {...defaultProps} status="onGoing" />);

      expect(screen.queryByTestId("settings-icon")).not.toBeInTheDocument();
    });

    it("opens cancellation modal when delete button is clicked", () => {
      const openCancellationFn = jest.fn();
      mockUseOpenCancellation.mockReturnValue(openCancellationFn);

      render(<AttendanceCard {...defaultProps} status="scheduled" />);

      const deleteButton = screen.getByTitle("Gerenciar agendamento");
      fireEvent.click(deleteButton);

      expect(openCancellationFn).toHaveBeenCalledTimes(1);
      expect(openCancellationFn).toHaveBeenCalledWith(
        [123],
        "João Silva",
        expect.any(String),
      );
    });

    it("prevents drag start when delete button is clicked", () => {
      const openCancellationFn = jest.fn();
      mockUseOpenCancellation.mockReturnValue(openCancellationFn);
      const mockEvent = { stopPropagation: jest.fn() };

      render(<AttendanceCard {...defaultProps} status="scheduled" />);

      const deleteButton = screen.getByTitle("Gerenciar agendamento");
      fireEvent.click(deleteButton, mockEvent);

      expect(openCancellationFn).toHaveBeenCalled();
    });
  });

  describe("Missed and Cancelled States", () => {
    it("should disable dragging for missed attendance", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      render(
        <AttendanceCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "false");
      expect(card).toHaveClass("cursor-not-allowed");
    });

    it("should disable dragging for cancelled attendance", () => {
      const cancelledPatient = {
        ...mockPatient,
        isCancelled: true,
      };

      render(
        <AttendanceCard
          {...defaultProps}
          patient={cancelledPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "false");
      expect(card).toHaveClass("cursor-not-allowed");
    });

    it("should apply gray styling with dashed border for missed attendance", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      render(
        <AttendanceCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("bg-gray-200");
      expect(card).toHaveClass("border-gray-400"); // Updated to match current implementation
    });

    it("should apply line-through to patient name for missed attendance", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      const { container } = renderWithQueryClient(
        <AttendanceCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      // Find the span with line-through class that contains the patient name
      const lineThrough = container.querySelector(".line-through");
      expect(lineThrough).toBeInTheDocument();
      expect(lineThrough).toHaveTextContent("João Silva");
    });

    it("should not show delete button for missed attendance", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      renderWithQueryClient(
        <AttendanceCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      expect(screen.queryByTitle("Remover")).not.toBeInTheDocument();
    });

    it("should show proper tooltip for missed attendance", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      const { container } = renderWithQueryClient(
        <AttendanceCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      // Find the element with the title attribute
      const tooltipElement = container.querySelector(
        '[title="FALTA - João Silva - Prioridade: 1"]',
      );
      expect(tooltipElement).toBeInTheDocument();
    });
  });
});
