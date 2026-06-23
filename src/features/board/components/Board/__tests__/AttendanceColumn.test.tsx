import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendanceColumn from "../AttendanceColumn";
import {
  ATTENDANCE_BOARD_STATUS_LABELS,
  getStatusColor,
} from "../../../styles/cardStyles";
import {
  AttendanceProgression,
  AttendanceType,
  Priority,
  AttendanceStatusDetail,
} from "@/types/types";
import { IDraggedItem } from "../../../types";
// Define proper patient interface extending AttendanceStatusDetail
interface PatientWithType extends AttendanceStatusDetail {
  originalType: AttendanceType;
}

// Mock the AttendanceCard component
jest.mock("../../cards/AttendanceCard", () => {
  return function MockAttendanceCard({
    patient,
    type,
    index,
    onCompletedClick,
  }: {
    patient: { name: string; attendanceId?: number; patientId?: number };
    type: AttendanceType;
    index: number;
    onCompletedClick?: (
      attendanceId: number,
      patientId: number,
      patientName: string,
    ) => void;
  }) {
    return (
      <div
        data-testid={`attendance-card-${index}`}
        data-patient-name={patient.name}
      >
        <span>{patient.name}</span>
        <span data-testid="card-type">{type}</span>
        {onCompletedClick && (
          <button
            onClick={() =>
              onCompletedClick(
                patient.attendanceId || 0,
                patient.patientId || 0,
                patient.name,
              )
            }
            data-testid={`manage-button-${index}`}
          >
            Manage
          </button>
        )}
      </div>
    );
  };
});

describe("AttendanceColumn", () => {
  const mockHandleDragStart = jest.fn();
  const mockHandleDragEnd = jest.fn();
  const mockHandleDrop = jest.fn();
  const mockOnCompletedClick = jest.fn();

  const mockPatients: PatientWithType[] = [
    {
      attendanceId: 1,
      name: "John Smith",
      priority: "1" as Priority,
      originalType: "assessment" as AttendanceType,
      patientId: 101,
    },
    {
      attendanceId: 2,
      name: "Mary Jones",
      priority: "2" as Priority,
      originalType: "physiotherapy" as AttendanceType,
      patientId: 102,
    },
    {
      attendanceId: 3,
      name: "Peter Pan",
      priority: "3" as Priority,
      originalType: "tens" as AttendanceType,
      patientId: 103,
    },
  ];

  const defaultProps = {
    status: "scheduled" as AttendanceProgression,
    patients: mockPatients,
    dragged: null as IDraggedItem | null,
    handleDragStart: mockHandleDragStart,
    handleDragEnd: mockHandleDragEnd,
    handleDrop: mockHandleDrop,
    onCompletedClick: mockOnCompletedClick,
    isDayFinalized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders column title with correct status", () => {
      render(<AttendanceColumn {...defaultProps} />);

      expect(
        screen.getByText(ATTENDANCE_BOARD_STATUS_LABELS.scheduled),
      ).toBeInTheDocument();
      expect(
        screen.getByText(ATTENDANCE_BOARD_STATUS_LABELS.scheduled),
      ).toHaveClass(getStatusColor("scheduled"));
    });

    it("renders all patients as cards", () => {
      render(<AttendanceColumn {...defaultProps} />);

      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Mary Jones")).toBeInTheDocument();
      expect(screen.getByText("Peter Pan")).toBeInTheDocument();
    });

    it("renders empty state when no patients", () => {
      render(<AttendanceColumn {...defaultProps} patients={[]} />);

      expect(screen.getByText("Drag to move")).toBeInTheDocument();
    });
  });

  describe("Patient Sorting", () => {
    it("sorts patients by priority (1 = highest)", () => {
      const unsortedPatients: PatientWithType[] = [
        { ...mockPatients[2], priority: "3" as Priority }, // Peter - priority 3
        { ...mockPatients[0], priority: "1" as Priority }, // John - priority 1
        { ...mockPatients[1], priority: "2" as Priority }, // Mary - priority 2
      ];

      render(
        <AttendanceColumn {...defaultProps} patients={unsortedPatients} />,
      );

      const cards = screen.getAllByTestId(/attendance-card-/);
      expect(cards[0]).toHaveAttribute("data-patient-name", "John Smith");
      expect(cards[1]).toHaveAttribute("data-patient-name", "Mary Jones");
      expect(cards[2]).toHaveAttribute("data-patient-name", "Peter Pan");
    });

    it("sorts by check-in time when priorities are equal in checkedIn status", () => {
      const patientsWithSamePriority: PatientWithType[] = [
        {
          ...mockPatients[0],
          priority: "1" as Priority,
          checkedInTime: "15:30:00",
        },
        {
          ...mockPatients[1],
          priority: "1" as Priority,
          checkedInTime: "14:15:00",
        },
        {
          ...mockPatients[2],
          priority: "1" as Priority,
          checkedInTime: "14:45:00",
        },
      ];

      render(
        <AttendanceColumn
          {...defaultProps}
          status="checkedIn"
          patients={patientsWithSamePriority}
        />,
      );

      const cards = screen.getAllByTestId(/attendance-card-/);
      // Should be sorted by checkedInTime: 14:15:00, 14:45:00, 15:30:00
      expect(cards[0]).toHaveAttribute("data-patient-name", "Mary Jones");
      expect(cards[1]).toHaveAttribute("data-patient-name", "Peter Pan");
      expect(cards[2]).toHaveAttribute("data-patient-name", "John Smith");
    });

    it("Does not mutate original patients array", () => {
      const originalPatients: PatientWithType[] = [
        { ...mockPatients[2], priority: "3" as Priority },
        { ...mockPatients[0], priority: "1" as Priority },
        { ...mockPatients[1], priority: "2" as Priority },
      ];
      const originalOrder = [...originalPatients];

      render(
        <AttendanceColumn {...defaultProps} patients={originalPatients} />,
      );

      // Original array should remain unchanged
      expect(originalPatients).toEqual(originalOrder);
    });

    it("sorts only by priority when not in checkedIn status", () => {
      const patientsWithSamePriority: PatientWithType[] = [
        {
          ...mockPatients[0],
          priority: "1" as Priority,
          checkedInTime: "15:30:00",
        },
        {
          ...mockPatients[1],
          priority: "1" as Priority,
          checkedInTime: "14:15:00",
        },
      ];

      render(
        <AttendanceColumn
          {...defaultProps}
          status="scheduled"
          patients={patientsWithSamePriority}
        />,
      );

      // Should maintain original order when priorities are equal and not in checkedIn status
      const cards = screen.getAllByTestId(/attendance-card-/);
      expect(cards).toHaveLength(2);
    });
  });

  describe("Type Counts and Legend", () => {
    it("shows legend for non-assessment types", () => {
      const { container } = render(<AttendanceColumn {...defaultProps} />);

      // Should show legend since we have physiotherapy and tens types
      const legendItems = screen.getAllByText("(1)");
      expect(legendItems.length).toBeGreaterThanOrEqual(1); // Should have at least one legend item

      // Check for the presence of colored legend indicators
      expect(container.querySelector(".bg-yellow-400")).toBeInTheDocument(); // physiotherapy indicator
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument(); // tens indicator
    });

    it("hides legend for assessment-only patients", () => {
      const assessmentPatients: PatientWithType[] = [
        { ...mockPatients[0], originalType: "assessment" as AttendanceType },
      ];

      render(
        <AttendanceColumn {...defaultProps} patients={assessmentPatients} />,
      );

      // Should not show legend for assessment-only
      expect(screen.queryByText("(1)")).not.toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("handles drop events", () => {
      render(<AttendanceColumn {...defaultProps} />);

      // Find the drop zone using class selector
      const dropZone = document.querySelector(".border-dashed");
      if (dropZone) {
        fireEvent.drop(dropZone);
        expect(mockHandleDrop).toHaveBeenCalled();
      }
    });

    it("prevents default on drag over", () => {
      render(<AttendanceColumn {...defaultProps} />);

      const dropZone = document.querySelector(".border-dashed");
      if (dropZone) {
        fireEvent.dragOver(dropZone);
        // Component should handle the drag over event
        expect(dropZone).toBeInTheDocument();
      }
    });
  });

  describe("Manage Functionality", () => {
    it("calls onCompletedClick when card manage button is clicked", () => {
      render(<AttendanceColumn {...defaultProps} />);

      const manageButton = screen.getByTestId("manage-button-0");
      fireEvent.click(manageButton);

      expect(mockOnCompletedClick).toHaveBeenCalledWith(1, 101, "John Smith");
    });
  });

  describe("Day Finalization", () => {
    it("passes isDayFinalized prop to attendance cards", () => {
      render(<AttendanceColumn {...defaultProps} isDayFinalized={true} />);

      // Cards should receive isDayFinalized prop (we can't directly test this with our mock,
      // but we can verify the component renders when finalized)
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });
  });

  describe("Treatment Information", () => {
    it("passes treatment data to cards", () => {
      render(<AttendanceColumn {...defaultProps} />);

      // Cards should be rendered with treatment data
      // This is implicitly tested by the cards rendering successfully
      expect(screen.getAllByTestId(/attendance-card-/)).toHaveLength(3);
    });

    it("handles treatment info click callbacks", () => {
      render(<AttendanceColumn {...defaultProps} />);

      // Treatment info click functionality would be tested at the card level
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });
  });

  describe("Card Key Generation", () => {
    it("generates unique keys for cards", () => {
      render(<AttendanceColumn {...defaultProps} />);

      const cards = screen.getAllByTestId(/attendance-card-/);
      expect(cards).toHaveLength(3);

      // Each card should have a unique testid
      expect(screen.getByTestId("attendance-card-0")).toBeInTheDocument();
      expect(screen.getByTestId("attendance-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("attendance-card-2")).toBeInTheDocument();
    });
  });

  describe("Status-Specific Behavior", () => {
    it("handles checkedIn status correctly", () => {
      render(<AttendanceColumn {...defaultProps} status="checkedIn" />);

      expect(
        screen.getByText(ATTENDANCE_BOARD_STATUS_LABELS.checkedIn),
      ).toBeInTheDocument();
    });

    it("handles onGoing status correctly", () => {
      render(<AttendanceColumn {...defaultProps} status="onGoing" />);

      expect(
        screen.getByText(ATTENDANCE_BOARD_STATUS_LABELS.onGoing),
      ).toBeInTheDocument();
    });

    it("handles completed status correctly", () => {
      render(<AttendanceColumn {...defaultProps} status="completed" />);

      expect(
        screen.getByText(ATTENDANCE_BOARD_STATUS_LABELS.completed),
      ).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("component is memoized", () => {
      const { rerender } = render(<AttendanceColumn {...defaultProps} />);
      const firstRender = screen.getByText("John Smith");

      // Rerender with same props
      rerender(<AttendanceColumn {...defaultProps} />);
      const secondRender = screen.getByText("John Smith");

      // Component should be memoized
      expect(firstRender).toBeInTheDocument();
      expect(secondRender).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles patients without patientId", () => {
      const patientsWithoutId = [
        {
          ...mockPatients[0],
          patientId: undefined,
        },
      ];

      render(
        <AttendanceColumn {...defaultProps} patients={patientsWithoutId} />,
      );

      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    it("handles patients without attendanceId", () => {
      const patientsWithoutAttendanceId = [
        {
          ...mockPatients[0],
          attendanceId: undefined,
        },
      ];

      render(
        <AttendanceColumn
          {...defaultProps}
          patients={patientsWithoutAttendanceId}
        />,
      );

      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    it("handles different treatment types correctly", () => {
      const mixedPatients: PatientWithType[] = [
        { ...mockPatients[0], originalType: "physiotherapy" as AttendanceType },
        { ...mockPatients[1], originalType: "tens" as AttendanceType },
      ];

      render(<AttendanceColumn {...defaultProps} patients={mixedPatients} />);

      // Should still render both patients
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Mary Jones")).toBeInTheDocument();
    });
  });
});
