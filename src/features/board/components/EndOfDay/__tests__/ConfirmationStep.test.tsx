import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConfirmationStep from "../components/steps/ConfirmationStep";
import { groupAttendancesForDisplayWithBodyLocation } from "../utils/confirmationStepUtils";
import type { AbsenceJustification } from "../types";
import type { IAttendanceStatusDetailWithType } from "../../../utils/attendanceDataUtils";

function expectCompletedAttendanceLines(
  completedAttendances: IAttendanceStatusDetailWithType[],
) {
  const grouped =
    groupAttendancesForDisplayWithBodyLocation(completedAttendances);
  grouped.forEach(({ patientName, label }) => {
    expect(screen.getByText(`• ${patientName} (${label})`)).toBeInTheDocument();
  });
  return grouped.length;
}

// Mock data factories
const createMockAttendance = (
  overrides: Partial<IAttendanceStatusDetailWithType> = {},
): IAttendanceStatusDetailWithType => ({
  name: "John Doe",
  priority: "3",
  patientId: 1,
  attendanceType: "assessment",
  ...overrides,
});

const createMockJustification = (
  overrides: Partial<AbsenceJustification> = {},
): AbsenceJustification => ({
  patientId: 1,
  patientName: "John Doe",
  attendanceType: "assessment",
  justified: true,
  justification: "Medical appointment",
  ...overrides,
});

describe("ConfirmationStep", () => {
  const defaultProps = {
    selectedDate: "2024-01-15",
    completedAttendances: [],
    scheduledAbsences: [],
    absenceJustifications: [],
    isSubmitting: false,
    onSubmit: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays formatted date correctly", () => {
    render(<ConfirmationStep {...defaultProps} />);

    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
  });

  it("shows summary cards with correct counts", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Patient 1",
        patientId: 1,
        attendanceType: "assessment",
      }),
      createMockAttendance({
        name: "Patient 2",
        patientId: 2,
        attendanceType: "assessment",
      }),
    ];
    const absenceJustifications = [
      createMockJustification({ justified: true }),
      createMockJustification({ patientId: 2, justified: true }),
      createMockJustification({ patientId: 3, justified: false }),
    ];

    const { container } = render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
        absenceJustifications={absenceJustifications}
      />,
    );

    // Check the summary cards by their grid container class
    const summaryGrid = container.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-3",
    );
    expect(summaryGrid).toBeInTheDocument();

    // Look for the specific counts in summary cards (grouped count)
    const completedCard = container.querySelector(
      ".bg-green-50 .text-2xl.font-bold.text-green-600",
    );
    expect(completedCard).toHaveTextContent("2");

    const unjustifiedCard = container.querySelector(
      ".bg-red-50 .text-2xl.font-bold.text-red-600",
    );
    expect(unjustifiedCard).toHaveTextContent("1");
  });

  it("displays completed attendances list with labels", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Jane Doe",
        patientId: 1,
        attendanceType: "assessment",
      }),
      createMockAttendance({
        name: "Bob Smith",
        patientId: 2,
        attendanceType: "physiotherapy",
      }),
    ];

    const { container } = render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
      />,
    );

    // Find the completed attendances section heading specifically (h4 element)
    const completedSection = container.querySelector(
      "h4.text-md.font-medium.text-gray-900",
    );
    expect(completedSection).toHaveTextContent("Completed Attendances");

    expectCompletedAttendanceLines(completedAttendances);
  });

  it("displays justified absences with justifications", () => {
    const absenceJustifications = [
      createMockJustification({
        patientName: "John Doe",
        justified: true,
        justification: "Medical emergency",
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        absenceJustifications={absenceJustifications}
      />,
    );

    const sections = screen.getAllByText("Justified Absences");
    expect(sections.length).toBeGreaterThan(0);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(
      screen.getByText("Justification: Medical emergency"),
    ).toBeInTheDocument();
  });

  it("displays unjustified absences", () => {
    const absenceJustifications = [
      createMockJustification({
        patientName: "Jane Doe",
        justified: false,
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        absenceJustifications={absenceJustifications}
      />,
    );

    const sections = screen.getAllByText("Unjustified Absences");
    expect(sections.length).toBeGreaterThan(0);
    expect(screen.getByText("• Jane Doe")).toBeInTheDocument();
  });

  it("shows final confirmation message", () => {
    render(<ConfirmationStep {...defaultProps} />);

    expect(screen.getByText("Finalize the day")).toBeInTheDocument();
    expect(
      screen.getByText(/Click.*Finalize Day.*to confirm/),
    ).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", () => {
    render(<ConfirmationStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Back"));

    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("calls onSubmit when Finalize Day button is clicked", () => {
    render(<ConfirmationStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Finalize Day"));

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it("disables buttons when submitting", () => {
    render(<ConfirmationStep {...defaultProps} isSubmitting={true} />);

    const backButton = screen.getByText("Back");
    const submitButton = screen.getByText("Finalizing...");

    expect(backButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state when submitting", () => {
    render(<ConfirmationStep {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText("Finalizing...")).toBeInTheDocument();
    expect(screen.queryByText("Finalize Day")).not.toBeInTheDocument();
  });

  it("handles attendances without names", () => {
    const completedAttendances = [
      createMockAttendance({
        name: "Unknown",
        patientId: undefined,
        attendanceType: "assessment",
      }),
    ];

    render(
      <ConfirmationStep
        {...defaultProps}
        completedAttendances={completedAttendances}
      />,
    );

    expectCompletedAttendanceLines(completedAttendances);
  });

  describe("Attendance Grouping Logic", () => {
    it("groups patient with assessment and treatments as two entries", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "assessment",
        }),
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(2);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("groups patient with only assessment as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient A",
          patientId: 1,
          attendanceType: "assessment",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(1);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("groups patient with only physiotherapy as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Manual Test 2",
          patientId: 2,
          attendanceType: "physiotherapy",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(1);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("groups patient with only tens as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient C",
          patientId: 3,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(1);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("groups patient with both physiotherapy and tens as one entry", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient D",
          patientId: 4,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Patient D",
          patientId: 4,
          attendanceType: "tens",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(1);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("handles multiple different patients with different attendance types", () => {
      const completedAttendances = [
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "assessment",
        }),
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Patient 10",
          patientId: 10,
          attendanceType: "tens",
        }),
        createMockAttendance({
          name: "Manual Test 2",
          patientId: 2,
          attendanceType: "physiotherapy",
        }),
        createMockAttendance({
          name: "Patient X",
          patientId: 3,
          attendanceType: "assessment",
        }),
      ];

      render(
        <ConfirmationStep
          {...defaultProps}
          completedAttendances={completedAttendances}
        />,
      );

      expect(expectCompletedAttendanceLines(completedAttendances)).toBe(4);
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });
});
