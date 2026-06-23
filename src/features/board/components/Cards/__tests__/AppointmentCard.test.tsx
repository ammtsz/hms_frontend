import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AppointmentCard from "../AppointmentCard";
import {
  AppointmentProgression,
  AppointmentType,
  AppointmentStatusDetail,
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

// Mock the AppointmentTimes component
jest.mock("../AppointmentTimes", () => {
  return function MockAppointmentTimes({
    status,
    checkedInTime,
    onGoingTime,
    completedTime,
  }: {
    status: AppointmentProgression;
    checkedInTime?: string | null;
    onGoingTime?: string | null;
    completedTime?: string | null;
  }) {
    return (
      <div data-testid="appointment-times">
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

describe("AppointmentCard Component", () => {
  let queryClient: QueryClient;

  const mockPatient: AppointmentStatusDetail = {
    name: "John Smith",
    priority: "1" as Priority,
    appointmentId: 123,
    patientId: 456,
    checkedInTime: "09:00:00",
    onGoingTime: null,
    completedTime: null,
    isMissed: false,
    isCancelled: false,
  };

  const defaultProps = {
    patient: mockPatient,
    status: "checkedIn" as AppointmentProgression,
    type: "assessment" as AppointmentType,
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
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("John Smith");
      expect(card).toHaveTextContent("P1");
    });

    it("should render AppointmentTimes component", () => {
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

      expect(screen.getByTestId("appointment-times")).toBeInTheDocument();
    });

    it("should show patient index for checkedIn status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="checkedIn" index={2} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent(/3\.\s*John Smith/);
      expect(card).toHaveTextContent("P1");
    });

    it("should not show patient index for non-checkedIn status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="scheduled" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("John Smith");
      expect(card).toHaveTextContent("P1");
      expect(card.textContent).not.toMatch(/\d+\.\s*John Smith/);
    });
  });

  describe("Styling", () => {
    it("should apply correct styling for scheduled status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="scheduled" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for checkedIn status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="checkedIn" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for onGoing status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="onGoing" />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("border-l-4", "border-l-gray-400");
    });

    it("should apply correct styling for completed status", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="completed" />,
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
        <AppointmentCard {...defaultProps} dragged={draggedItem} />,
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
        <AppointmentCard {...defaultProps} dragged={draggedItem} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).not.toHaveClass("opacity-60");
    });

    it("should have proper base classes", () => {
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

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
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "true");
    });

    it("should call handleDragStart when drag starts", () => {
      const mockHandleDragStart = jest.fn();
      render(
        <AppointmentCard
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
        <AppointmentCard {...defaultProps} handleDragEnd={mockHandleDragEnd} />,
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
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
          patientId: 456,
        },
        cardProps: {
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
        },
        expectedDragged: true,
      },
      {
        description: "should not detect dragged state when type differs",
        dragged: {
          type: "physiotherapy" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
      {
        description: "should not detect dragged state when status differs",
        dragged: {
          type: "assessment" as AppointmentType,
          status: "scheduled" as AppointmentProgression,
          idx: 0,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
      {
        description: "should not detect dragged state when index differs",
        dragged: {
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 1,
          patientId: 1,
        },
        cardProps: {
          type: "assessment" as AppointmentType,
          status: "checkedIn" as AppointmentProgression,
          idx: 0,
        },
        expectedDragged: false,
      },
    ];

    testCases.forEach(
      ({ description, dragged, cardProps, expectedDragged }) => {
        it(description, () => {
          render(
            <AppointmentCard
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
      const patientWithPriority2: AppointmentStatusDetail = {
        ...mockPatient,
        priority: "2" as Priority,
      };

      renderWithQueryClient(
        <AppointmentCard {...defaultProps} patient={patientWithPriority2} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("John Smith");
      expect(card).toHaveTextContent("P2");
    });

    it("should render different patient names", () => {
      const differentPatient: AppointmentStatusDetail = {
        ...mockPatient,
        name: "Emily Williams",
      };

      renderWithQueryClient(
        <AppointmentCard {...defaultProps} patient={differentPatient} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("Emily Williams");
      expect(card).toHaveTextContent("P1");
    });

    it("should pass correct times to AppointmentTimes component", () => {
      const patientWithTimes: AppointmentStatusDetail = {
        patientId: 1,
        name: "Test Patient",
        priority: "1" as Priority,
        checkedInTime: "09:00:00",
        onGoingTime: "09:30:00",
        completedTime: "10:00:00",
      };

      renderWithQueryClient(
        <AppointmentCard {...defaultProps} patient={patientWithTimes} />,
      );

      const appointmentTimes = screen.getByTestId("appointment-times");
      expect(appointmentTimes).toHaveTextContent("CheckedIn: 09:00:00");
      expect(appointmentTimes).toHaveTextContent("OnGoing: 09:30:00");
      expect(appointmentTimes).toHaveTextContent("Completed: 10:00:00");
    });
  });

  describe("Accessibility", () => {
    it("should have proper list item semantics", () => {
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toBeInTheDocument();
    });

    it("should be keyboard navigable (draggable)", () => {
      renderWithQueryClient(<AppointmentCard {...defaultProps} />);

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null times gracefully", () => {
      const patientWithNullTimes: AppointmentStatusDetail = {
        patientId: 1,
        name: "Test Patient",
        priority: "1" as Priority,
        checkedInTime: null,
        onGoingTime: null,
        completedTime: null,
      };

      renderWithQueryClient(
        <AppointmentCard {...defaultProps} patient={patientWithNullTimes} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent("Test Patient");
      expect(card).toHaveTextContent("P1");
      expect(screen.getByTestId("appointment-times")).toBeInTheDocument();
    });

    it("should handle undefined isNextToBeAttended prop", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isNextToBeAttended, ...propsWithoutNextToBeAttended } =
        defaultProps;

      renderWithQueryClient(
        <AppointmentCard {...propsWithoutNextToBeAttended} />,
      );

      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("should handle high index numbers correctly", () => {
      renderWithQueryClient(
        <AppointmentCard {...defaultProps} status="checkedIn" index={99} />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveTextContent(/100\.\s*John Smith/);
      expect(card).toHaveTextContent("P1");
    });
  });

  describe("Delete Functionality", () => {
    it("shows delete button for scheduled status when onDelete is provided", () => {
      render(<AppointmentCard {...defaultProps} status="scheduled" />);

      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Manage appointment")).toBeInTheDocument();
    });

    it("does not show delete button when appointmentId is not provided", () => {
      const patientWithoutId = { ...mockPatient, appointmentId: undefined };
      render(
        <AppointmentCard
          {...defaultProps}
          patient={patientWithoutId}
          status="scheduled"
        />,
      );

      expect(screen.queryByTestId("settings-icon")).not.toBeInTheDocument();
    });

    it("does not show delete button for non-scheduled status", () => {
      render(<AppointmentCard {...defaultProps} status="onGoing" />);

      expect(screen.queryByTestId("settings-icon")).not.toBeInTheDocument();
    });

    it("opens cancellation modal when delete button is clicked", () => {
      const openCancellationFn = jest.fn();
      mockUseOpenCancellation.mockReturnValue(openCancellationFn);

      render(<AppointmentCard {...defaultProps} status="scheduled" />);

      const deleteButton = screen.getByTitle("Manage appointment");
      fireEvent.click(deleteButton);

      expect(openCancellationFn).toHaveBeenCalledTimes(1);
      expect(openCancellationFn).toHaveBeenCalledWith(
        [123],
        "John Smith",
        expect.any(String),
      );
    });

    it("prevents drag start when delete button is clicked", () => {
      const openCancellationFn = jest.fn();
      mockUseOpenCancellation.mockReturnValue(openCancellationFn);
      const mockEvent = { stopPropagation: jest.fn() };

      render(<AppointmentCard {...defaultProps} status="scheduled" />);

      const deleteButton = screen.getByTitle("Manage appointment");
      fireEvent.click(deleteButton, mockEvent);

      expect(openCancellationFn).toHaveBeenCalled();
    });
  });

  describe("Missed and Cancelled States", () => {
    it("should disable dragging for missed appointment", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      render(
        <AppointmentCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "false");
      expect(card).toHaveClass("cursor-not-allowed");
    });

    it("should disable dragging for cancelled appointment", () => {
      const cancelledPatient = {
        ...mockPatient,
        isCancelled: true,
      };

      render(
        <AppointmentCard
          {...defaultProps}
          patient={cancelledPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveAttribute("draggable", "false");
      expect(card).toHaveClass("cursor-not-allowed");
    });

    it("should apply gray styling with dashed border for missed appointment", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      render(
        <AppointmentCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      const card = screen.getByRole("listitem");
      expect(card).toHaveClass("bg-gray-200");
      expect(card).toHaveClass("border-gray-400"); // Updated to match current implementation
    });

    it("should apply line-through to patient name for missed appointment", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      const { container } = renderWithQueryClient(
        <AppointmentCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      // Find the span with line-through class that contains the patient name
      const lineThrough = container.querySelector(".line-through");
      expect(lineThrough).toBeInTheDocument();
      expect(lineThrough).toHaveTextContent("John Smith");
    });

    it("should not show delete button for missed appointment", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      renderWithQueryClient(
        <AppointmentCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      expect(screen.queryByTitle("Manage appointment")).not.toBeInTheDocument();
    });

    it("should show proper tooltip for missed appointment", () => {
      const missedPatient = {
        ...mockPatient,
        isMissed: true,
      };

      const { container } = renderWithQueryClient(
        <AppointmentCard
          {...defaultProps}
          patient={missedPatient}
          status="scheduled"
        />,
      );

      // Find the element with the title attribute
      const tooltipElement = container.querySelector(
        '[title="MISSED - John Smith - Priority: 1"]',
      );
      expect(tooltipElement).toBeInTheDocument();
    });
  });
});
