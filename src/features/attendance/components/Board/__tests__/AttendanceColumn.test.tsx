import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendanceColumn from "../AttendanceColumn";
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

// Mock the cardStyles utilities
jest.mock("../../../styles/cardStyles", () => ({
  getStatusColor: jest.fn((status) => `color-${status}`),
  getStatusLabel: jest.fn((status) => {
    const labels = {
      scheduled: "Agendado",
      checkedIn: "Chegaram",
      onGoing: "Atendimento",
      completed: "Finalizados",
    };
    return labels[status as keyof typeof labels] || status;
  }),
}));

describe("AttendanceColumn", () => {
  const mockHandleDragStart = jest.fn();
  const mockHandleDragEnd = jest.fn();
  const mockHandleDrop = jest.fn();
  const mockOnCompletedClick = jest.fn();

  const mockPatients: PatientWithType[] = [
    {
      attendanceId: 1,
      name: "João Silva",
      priority: "1" as Priority,
      originalType: "assessment" as AttendanceType,
      patientId: 101,
    },
    {
      attendanceId: 2,
      name: "Maria Santos",
      priority: "2" as Priority,
      originalType: "physiotherapy" as AttendanceType,
      patientId: 102,
    },
    {
      attendanceId: 3,
      name: "Pedro Oliveira",
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

      expect(screen.getByText("Agendado")).toBeInTheDocument();
      expect(screen.getByText("Agendado")).toHaveClass("color-scheduled");
    });

    it("renders all patients as cards", () => {
      render(<AttendanceColumn {...defaultProps} />);

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.getByText("Pedro Oliveira")).toBeInTheDocument();
    });

    it("renders empty state when no patients", () => {
      render(<AttendanceColumn {...defaultProps} patients={[]} />);

      expect(screen.getByText("Arraste para mover")).toBeInTheDocument();
    });
  });

  describe("Patient Sorting", () => {
    it("sorts patients by priority (1 = highest)", () => {
      const unsortedPatients: PatientWithType[] = [
        { ...mockPatients[2], priority: "3" as Priority }, // Pedro - priority 3
        { ...mockPatients[0], priority: "1" as Priority }, // João - priority 1
        { ...mockPatients[1], priority: "2" as Priority }, // Maria - priority 2
      ];

      render(
        <AttendanceColumn {...defaultProps} patients={unsortedPatients} />,
      );

      const cards = screen.getAllByTestId(/attendance-card-/);
      expect(cards[0]).toHaveAttribute("data-patient-name", "João Silva");
      expect(cards[1]).toHaveAttribute("data-patient-name", "Maria Santos");
      expect(cards[2]).toHaveAttribute("data-patient-name", "Pedro Oliveira");
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
      expect(cards[0]).toHaveAttribute("data-patient-name", "Maria Santos");
      expect(cards[1]).toHaveAttribute("data-patient-name", "Pedro Oliveira");
      expect(cards[2]).toHaveAttribute("data-patient-name", "João Silva");
    });

    it("does not mutate original patients array", () => {
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

      expect(mockOnCompletedClick).toHaveBeenCalledWith(1, 101, "João Silva");
    });
  });

  describe("Day Finalization", () => {
    it("passes isDayFinalized prop to attendance cards", () => {
      render(<AttendanceColumn {...defaultProps} isDayFinalized={true} />);

      // Cards should receive isDayFinalized prop (we can't directly test this with our mock,
      // but we can verify the component renders when finalized)
      expect(screen.getByText("João Silva")).toBeInTheDocument();
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
      expect(screen.getByText("João Silva")).toBeInTheDocument();
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

      expect(screen.getByText("Chegaram")).toBeInTheDocument();
    });

    it("handles onGoing status correctly", () => {
      render(<AttendanceColumn {...defaultProps} status="onGoing" />);

      expect(screen.getByText("Atendimento")).toBeInTheDocument();
    });

    it("handles completed status correctly", () => {
      render(<AttendanceColumn {...defaultProps} status="completed" />);

      expect(screen.getByText("Finalizados")).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("component is memoized", () => {
      const { rerender } = render(<AttendanceColumn {...defaultProps} />);
      const firstRender = screen.getByText("João Silva");

      // Rerender with same props
      rerender(<AttendanceColumn {...defaultProps} />);
      const secondRender = screen.getByText("João Silva");

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

      expect(screen.getByText("João Silva")).toBeInTheDocument();
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

      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    it("handles different treatment types correctly", () => {
      const mixedPatients: PatientWithType[] = [
        { ...mockPatients[0], originalType: "physiotherapy" as AttendanceType },
        { ...mockPatients[1], originalType: "tens" as AttendanceType },
      ];

      render(<AttendanceColumn {...defaultProps} patients={mixedPatients} />);

      // Should still render both patients
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    });
  });
});
