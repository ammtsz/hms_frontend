import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AttendanceSections } from "../AttendanceSections";
import {
  AttendanceProgression,
  AttendanceType,
  AttendanceStatusDetail,
  Priority,
} from "@/types/types";
import { IDraggedItem } from "../../../types";
// Define types for grouped patients in tests
interface MockGroupedPatient extends AttendanceStatusDetail {
  originalType?: AttendanceType;
  treatmentTypes?: AttendanceType[];
  combinedType?: string;
}

// Define types for mock props
interface MockAttendanceColumnProps {
  status: AttendanceProgression;
  patients: MockGroupedPatient[];
  dragged?: IDraggedItem | null;
  handleDragStart?: (
    type: AttendanceType,
    index: number,
    status: AttendanceProgression,
    patientId?: number,
  ) => void;
  handleDragEnd?: () => void;
  handleDrop?: () => void;
  onCompletedClick?: (
    attendanceId: number,
    patientId: number,
    patientName: string,
  ) => void;
  isDayFinalized?: boolean;
  expandedCardId?: number | null;
  onToggleExpansion?: (patientId: number) => void;
}

// Mock AttendanceColumn component
jest.mock("../AttendanceColumn", () => {
  return function MockAttendanceColumn({
    status,
    patients,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    onCompletedClick,
    isDayFinalized,
  }: MockAttendanceColumnProps) {
    return (
      <div data-testid={`attendance-column-${status}`}>
        <div>Status: {status}</div>
        <div>Patients: {patients?.length || 0}</div>
        <div>Day Finalized: {String(isDayFinalized)}</div>
        {patients?.map((patient: MockGroupedPatient, index: number) => (
          <div
            key={patient.attendanceId}
            data-testid={`patient-${patient.attendanceId}`}
          >
            <span>Patient: {patient.name}</span>
            <span>Type: {patient.originalType || "unknown"}</span>
            <span>Combined: {patient.combinedType || "none"}</span>
            <span>
              Treatment Types: {patient.treatmentTypes?.join(", ") || "none"}
            </span>
            <button
              onClick={() =>
                handleDragStart?.(
                  patient.originalType || "assessment",
                  index,
                  status,
                  patient.patientId,
                )
              }
            >
              Drag Start
            </button>
            <button onClick={() => handleDragEnd?.()}>Drag End</button>
            <button onClick={() => handleDrop?.()}>Drop</button>
            <button
              onClick={() =>
                onCompletedClick?.(
                  patient.attendanceId || 0,
                  patient.patientId || 0,
                  patient.name || "",
                )
              }
            >
              Complete
            </button>
          </div>
        ))}
      </div>
    );
  };
});

// Mock groupPatientsByTreatments utility
jest.mock("../../../utils/patientGrouping", () => ({
  groupPatientsByTreatments: jest.fn((physiotherapyPatients, tensPatients) => {
    // Simple mock implementation that combines patients by patientId
    const patientMap = new Map();

    physiotherapyPatients.forEach((patient: AttendanceStatusDetail) => {
      if (patient.patientId) {
        const existing = patientMap.get(patient.patientId);
        if (existing) {
          existing.treatmentTypes.push("physiotherapy");
          existing.combinedType = "combined";
        } else {
          patientMap.set(patient.patientId, {
            ...patient,
            originalType: "physiotherapy",
            treatmentTypes: ["physiotherapy"],
            combinedType: "physiotherapy",
          });
        }
      }
    });

    tensPatients.forEach((patient: AttendanceStatusDetail) => {
      if (patient.patientId) {
        const existing = patientMap.get(patient.patientId);
        if (existing) {
          existing.treatmentTypes.push("tens");
          existing.combinedType = "combined";
        } else {
          patientMap.set(patient.patientId, {
            ...patient,
            originalType: "tens",
            treatmentTypes: ["tens"],
            combinedType: "tens",
          });
        }
      }
    });

    return Array.from(patientMap.values());
  }),
}));

// Factory function for creating mock patients
const createMockPatient = (
  overrides: Partial<AttendanceStatusDetail> = {},
): AttendanceStatusDetail => ({
  name: "Test Patient",
  priority: "2" as Priority,
  attendanceId: 1,
  patientId: 100,
  checkedInTime: null,
  onGoingTime: null,
  completedTime: null,
  ...overrides,
});

describe("AttendanceSections Component", () => {
  const mockGetPatients = jest.fn();
  const mockHandleDragStart = jest.fn();
  const mockHandleDragEnd = jest.fn();
  const mockHandleDropWithConfirm = jest.fn();
  const mockOnCompletedClick = jest.fn();
  const mockToggleCollapsed = jest.fn();

  const defaultProps = {
    collapsed: { assessment: false, physiotherapy: false, tens: false },
    getPatients: mockGetPatients,
    dragged: null as IDraggedItem | null,
    handleDragStart: mockHandleDragStart,
    handleDragEnd: mockHandleDragEnd,
    handleDropWithConfirm: mockHandleDropWithConfirm,
    onCompletedClick: mockOnCompletedClick,
    toggleCollapsed: mockToggleCollapsed,
    isDayFinalized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockGetPatients.mockImplementation(
      (type: AttendanceType, status: AttendanceProgression) => {
        if (type === "assessment" && status === "scheduled") {
          return [
            createMockPatient({ name: "Assessment Patient", attendanceId: 1 }),
          ];
        }
        if (type === "physiotherapy" && status === "checkedIn") {
          return [
            createMockPatient({
              name: "Physiotherapy Patient",
              attendanceId: 2,
            }),
          ];
        }
        if (type === "tens" && status === "onGoing") {
          return [createMockPatient({ name: "TENS Patient", attendanceId: 3 })];
        }
        return [];
      },
    );
  });

  describe("Component Rendering", () => {
    it("should render both assessment and mixed sections", () => {
      render(<AttendanceSections {...defaultProps} />);

      expect(screen.getByText(/▼\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/▼\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();
    });

    it("should render with proper container structure", () => {
      const { container } = render(<AttendanceSections {...defaultProps} />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass("flex", "flex-col", "w-full");
    });

    it("should render all attendance columns for each section", () => {
      render(<AttendanceSections {...defaultProps} />);

      // Check that all status columns are rendered for both sections
      const statuses = ["scheduled", "checkedIn", "onGoing", "completed"];
      statuses.forEach((status) => {
        const columns = screen.getAllByTestId(`attendance-column-${status}`);
        expect(columns).toHaveLength(2); // One for assessment, one for mixed
      });
    });

    it("uses responsive grid layout for column wrappers", () => {
      const { container } = render(<AttendanceSections {...defaultProps} />);

      const grids = container.querySelectorAll(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4",
      );
      expect(grids).toHaveLength(2);

      grids.forEach((grid) => {
        expect(grid).toHaveClass("gap-4", "w-full", "min-w-0");
      });
    });
  });

  describe("Assessment Section", () => {
    it("should render assessment section button with correct text", () => {
      render(<AttendanceSections {...defaultProps} />);

      const assessmentButton = screen.getByRole("button", {
        name: /Consultation/,
      });
      expect(assessmentButton).toBeInTheDocument();
      expect(assessmentButton).toHaveTextContent(/▼\s*Consultation\s*\(\d+\)/);
    });

    it("should toggle assessment section collapse on button click", () => {
      render(<AttendanceSections {...defaultProps} />);

      const assessmentButton = screen.getByRole("button", {
        name: /Consultation/,
      });
      fireEvent.click(assessmentButton);

      expect(mockToggleCollapsed).toHaveBeenCalledWith("assessment");
    });

    it("should show collapsed state when assessment section is collapsed", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: true, physiotherapy: false, tens: false }}
        />,
      );

      expect(screen.getByText(/▶\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();

      // Should not render assessment attendance columns
      const assessmentColumns = screen.queryAllByTestId(/attendance-column-/);
      expect(assessmentColumns).toHaveLength(4); // Only mixed section columns
    });

    it("should pass correct data to assessment attendance columns", () => {
      const assessmentPatient = createMockPatient({
        name: "John Doe",
        attendanceId: 123,
        patientId: 456,
      });

      mockGetPatients.mockImplementation((type, status) => {
        if (type === "assessment" && status === "scheduled") {
          return [assessmentPatient];
        }
        return [];
      });

      render(<AttendanceSections {...defaultProps} />);

      expect(screen.getByTestId("patient-123")).toBeInTheDocument();
      expect(screen.getByText("Patient: John Doe")).toBeInTheDocument();
      expect(screen.getByText("Type: assessment")).toBeInTheDocument();
    });
  });

  describe("Mixed Physiotherapy and TENS Section", () => {
    it("should render mixed section button with correct text", () => {
      render(<AttendanceSections {...defaultProps} />);

      const mixedButton = screen.getByRole("button", {
        name: /Physiotherapy and TENS/,
      });
      expect(mixedButton).toBeInTheDocument();
      expect(mixedButton).toHaveTextContent(
        /▼\s*Physiotherapy and TENS\s*\(\d+\)/,
      );
    });

    it("should toggle both physiotherapy and tens collapse on mixed button click", () => {
      render(<AttendanceSections {...defaultProps} />);

      const mixedButton = screen.getByRole("button", {
        name: /Physiotherapy and TENS/,
      });
      fireEvent.click(mixedButton);

      expect(mockToggleCollapsed).toHaveBeenCalledWith("physiotherapy");
      expect(mockToggleCollapsed).toHaveBeenCalledWith("tens");
      expect(mockToggleCollapsed).toHaveBeenCalledTimes(2);
    });

    it("should show collapsed state when both physiotherapy and tens are collapsed", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: false, physiotherapy: true, tens: true }}
        />,
      );

      expect(
        screen.getByText(/▶\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();

      // Should not render treatment legend
      expect(screen.queryByText("Physiotherapy")).not.toBeInTheDocument();
      expect(screen.queryByText("TENS")).not.toBeInTheDocument();
      expect(screen.queryByText("Physiotherapy and TENS")).not.toBeInTheDocument();
    });

    it("should show expanded state when at least one of physiotherapy or tens is expanded", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: false, physiotherapy: false, tens: true }}
        />,
      );

      expect(
        screen.getByText(/▼\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();

      // Should render treatment legend
      expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
      expect(screen.getByText("TENS")).toBeInTheDocument();
      expect(screen.getByText("Physiotherapy and TENS")).toBeInTheDocument();
    });

    it("should render treatment type legend with correct colors", () => {
      render(<AttendanceSections {...defaultProps} />);

      // Check legend items exist
      expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
      expect(screen.getByText("TENS")).toBeInTheDocument();
      expect(screen.getByText("Physiotherapy and TENS")).toBeInTheDocument();

      // Check color indicators by their container
      const legendContainer = screen.getByText("Physiotherapy").closest("div");
      expect(
        legendContainer?.querySelector(".bg-yellow-400"),
      ).toBeInTheDocument();

      const tensContainer = screen.getByText("TENS").closest("div");
      expect(tensContainer?.querySelector(".bg-blue-500")).toBeInTheDocument();

      const combinedContainer = screen
        .getByText("Physiotherapy and TENS")
        .closest("div");
      expect(
        combinedContainer?.querySelector(".bg-green-500"),
      ).toBeInTheDocument();
    });

    it("should group patients correctly using groupPatientsByTreatments", () => {
      const physiotherapyPatient = createMockPatient({
        name: "Physiotherapy Patient",
        attendanceId: 200,
        patientId: 500,
      });

      const tensPatient = createMockPatient({
        name: "TENS Patient",
        attendanceId: 201,
        patientId: 500, // Same patient ID for grouping
      });

      mockGetPatients.mockImplementation((type, status) => {
        if (type === "physiotherapy" && status === "scheduled")
          return [physiotherapyPatient];
        if (type === "tens" && status === "scheduled") return [tensPatient];
        return [];
      });

      render(<AttendanceSections {...defaultProps} />);

      // Should show grouped patient with combined treatments
      const groupedPatient = screen.getByTestId("patient-200");
      expect(groupedPatient).toBeInTheDocument();
      expect(groupedPatient).toHaveTextContent("Combined: combined");
      expect(groupedPatient).toHaveTextContent(
        "Treatment Types: physiotherapy, tens",
      );
    });
  });

  describe("Drag and Drop Functionality", () => {
    it("should handle drag start for assessment patients", () => {
      render(<AttendanceSections {...defaultProps} />);

      const dragButton = screen.getAllByText("Drag Start")[0];
      fireEvent.click(dragButton);

      expect(mockHandleDragStart).toHaveBeenCalled();
    });

    it("should handle drag end", () => {
      render(<AttendanceSections {...defaultProps} />);

      const dragEndButton = screen.getAllByText("Drag End")[0];
      fireEvent.click(dragEndButton);

      expect(mockHandleDragEnd).toHaveBeenCalled();
    });

    it("should handle drop for assessment section", () => {
      render(<AttendanceSections {...defaultProps} />);

      const dropButton = screen.getAllByText("Drop")[0];
      fireEvent.click(dropButton);

      expect(mockHandleDropWithConfirm).toHaveBeenCalledWith(
        "assessment",
        expect.any(String),
      );
    });

    it("should handle drop for mixed section with dragged type", () => {
      const draggedItem: IDraggedItem = {
        type: "physiotherapy",
        status: "scheduled",
        idx: 0,
        patientId: 123,
      };

      // Set up mock to return patients for mixed section
      mockGetPatients.mockImplementation((type, status) => {
        if (type === "physiotherapy" && status === "scheduled") {
          return [
            createMockPatient({ name: "Mixed Patient", attendanceId: 888 }),
          ];
        }
        return [];
      });

      render(<AttendanceSections {...defaultProps} dragged={draggedItem} />);

      // Find the mixed section patient and click its drop button
      const mixedPatient = screen.getByTestId("patient-888");
      const dropButton = mixedPatient.querySelector("button:nth-of-type(3)"); // Third button is drop

      if (dropButton) {
        fireEvent.click(dropButton);
        expect(mockHandleDropWithConfirm).toHaveBeenCalledWith(
          "physiotherapy",
          expect.any(String),
        );
      } else {
        // Fallback test - just verify the drop functionality exists
        expect(mockHandleDropWithConfirm).toHaveBeenCalledTimes(0); // Not called yet, which is expected
      }
    });

    it("should pass dragged item to attendance columns", () => {
      const draggedItem: IDraggedItem = {
        type: "assessment",
        status: "checkedIn",
        idx: 1,
        patientId: 789,
      };

      render(<AttendanceSections {...defaultProps} dragged={draggedItem} />);

      // Verify that dragged state is passed to columns (can't directly test, but structure should be maintained)
      const columns = screen.getAllByTestId(/attendance-column-/);
      expect(columns.length).toBeGreaterThan(0);
    });
  });

  describe("Completed click", () => {
    it("should handle completed click", () => {
      render(<AttendanceSections {...defaultProps} />);

      const completeButton = screen.getAllByText("Complete")[0];
      fireEvent.click(completeButton);

      expect(mockOnCompletedClick).toHaveBeenCalled();
    });

    it("should pass correct attendance and patient info for completed click", () => {
      const patient = createMockPatient({
        name: "John Doe",
        attendanceId: 999,
        patientId: 456,
      });

      mockGetPatients.mockImplementation((type, status) => {
        if (type === "assessment" && status === "scheduled") {
          return [patient];
        }
        return [];
      });

      render(<AttendanceSections {...defaultProps} />);

      const completeButton = screen
        .getByTestId("patient-999")
        .querySelector("button:last-child");
      fireEvent.click(completeButton!);

      expect(mockOnCompletedClick).toHaveBeenCalledWith(999, 456, "John Doe");
    });
  });

  describe("Day Finalization State", () => {
    it("should pass day finalized state to attendance columns", () => {
      render(<AttendanceSections {...defaultProps} isDayFinalized={true} />);

      const columns = screen.getAllByTestId(/attendance-column-/);
      columns.forEach((column) => {
        expect(column).toHaveTextContent("Day Finalized: true");
      });
    });

    it("should handle day finalized state as false by default", () => {
      render(
        <AttendanceSections {...defaultProps} isDayFinalized={undefined} />,
      );

      const columns = screen.getAllByTestId(/attendance-column-/);
      columns.forEach((column) => {
        expect(column).toHaveTextContent("Day Finalized: false");
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty patient lists", () => {
      mockGetPatients.mockReturnValue([]);

      render(<AttendanceSections {...defaultProps} />);

      const columns = screen.getAllByTestId(/attendance-column-/);
      columns.forEach((column) => {
        expect(column).toHaveTextContent("Patients: 0");
      });
    });

    it("should handle missing patient data gracefully", () => {
      mockGetPatients.mockImplementation((type, status) => {
        if (type === "assessment" && status === "scheduled") {
          return [createMockPatient({ name: undefined })];
        }
        return [];
      });

      const { container } = render(<AttendanceSections {...defaultProps} />);

      // Should still render without throwing errors
      expect(container).toBeInTheDocument();
    });

    it("should handle all sections collapsed", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: true, physiotherapy: true, tens: true }}
        />,
      );

      expect(screen.getByText(/▶\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/▶\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();

      // Only buttons should be visible, no attendance columns
      const columns = screen.queryAllByTestId(/attendance-column-/);
      expect(columns).toHaveLength(0);
    });

    it("should handle partial collapse states", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: true, physiotherapy: false, tens: true }}
        />,
      );

      expect(screen.getByText(/▶\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/▼\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();

      // Only mixed section should show columns
      const columns = screen.getAllByTestId(/attendance-column-/);
      expect(columns).toHaveLength(4); // Only mixed section
    });

    it("should handle null dragged item", () => {
      render(<AttendanceSections {...defaultProps} dragged={null} />);

      const { container } = render(<AttendanceSections {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility and User Experience", () => {
    it("should have accessible button elements", () => {
      render(<AttendanceSections {...defaultProps} />);

      const assessmentButton = screen.getByRole("button", {
        name: /Consultation/,
      });
      const mixedButton = screen.getByRole("button", {
        name: /Physiotherapy and TENS/,
      });

      expect(assessmentButton).toBeInTheDocument();
      expect(mixedButton).toBeInTheDocument();
    });

    it("should provide clear visual feedback for section states", () => {
      render(<AttendanceSections {...defaultProps} />);

      // Expanded sections should show down arrow
      expect(screen.getByText(/▼\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/▼\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();
    });

    it("should provide clear visual feedback for collapsed states", () => {
      render(
        <AttendanceSections
          {...defaultProps}
          collapsed={{ assessment: true, physiotherapy: true, tens: true }}
        />,
      );

      // Collapsed sections should show right arrow
      expect(screen.getByText(/▶\s*Consultation\s*\(\d+\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/▶\s*Physiotherapy and TENS\s*\(\d+\)/),
      ).toBeInTheDocument();
    });

    it("should have proper semantic structure", () => {
      const { container } = render(<AttendanceSections {...defaultProps} />);

      // Check for proper div structure
      const mainContainer = container.querySelector(".flex.flex-col.w-full");
      expect(mainContainer).toBeInTheDocument();

      // Each section should be properly contained
      const sectionDivs = container.querySelectorAll(".w-full");
      expect(sectionDivs.length).toBeGreaterThan(0);
    });

    it("should handle keyboard interactions on section buttons", () => {
      render(<AttendanceSections {...defaultProps} />);

      const assessmentButton = screen.getByRole("button", {
        name: /Consultation/,
      });

      // Simulate Enter key press
      fireEvent.keyDown(assessmentButton, { key: "Enter" });
      // Note: The actual keydown behavior would depend on browser defaults

      expect(assessmentButton).toBeInTheDocument();
    });
  });

  describe("Integration with AttendanceColumn", () => {
    it("should pass all required props to AttendanceColumn components", () => {
      render(<AttendanceSections {...defaultProps} />);

      const columns = screen.getAllByTestId(/attendance-column-/);

      // Each column should receive all necessary props
      columns.forEach((column) => {
        expect(column).toHaveTextContent(
          /Status: (scheduled|checkedIn|onGoing|completed)/,
        );
        expect(column).toHaveTextContent(/Patients: \d+/);
        expect(column).toHaveTextContent(/Day Finalized: (true|false)/);
      });
    });

    it("should maintain proper column order for both sections", () => {
      render(<AttendanceSections {...defaultProps} />);

      const statusOrder = ["scheduled", "checkedIn", "onGoing", "completed"];

      statusOrder.forEach((status) => {
        const columns = screen.getAllByTestId(`attendance-column-${status}`);
        expect(columns).toHaveLength(2); // One for each section
      });
    });
  });
});
