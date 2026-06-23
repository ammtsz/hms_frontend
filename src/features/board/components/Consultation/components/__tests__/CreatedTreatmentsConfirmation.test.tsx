import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreatedTreatmentsConfirmation, {
  type CreatedTreatment,
} from "../CreatedTreatmentsConfirmation";
import type {
  AppointmentResponseDto,
  AppointmentStatus,
  AppointmentType,
} from "@/api/types";

// Mock date helpers (formatDisplayDate used by confirmation; getWeeksUntil by NextConsultationCard)
jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: jest.fn((dateStr: string) => {
    if (!dateStr) return "";

    // Handle both ISO date strings and date objects - match real function
    let d: Date;
    if (dateStr.includes("T")) {
      // Full ISO string
      d = new Date(dateStr);
    } else {
      // Date-only string (YYYY-MM-DD) - parse as local time to avoid timezone issues
      d = new Date(dateStr + "T00:00:00");
    }

    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }),
  getWeeksUntil: jest.fn((scheduledDate: string, fromDate?: string) => {
    const from = fromDate
      ? new Date(fromDate + "T00:00:00")
      : new Date("2025-09-16T00:00:00");
    const scheduled = new Date(scheduledDate.replace(/T.*/, "") + "T00:00:00");
    if (isNaN(scheduled.getTime())) return 0;
    const diffWeeks =
      (scheduled.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return Math.round(diffWeeks);
  }),
}));

describe("CreatedTreatmentsConfirmation", () => {
  const mockOnAcknowledge = jest.fn();
  const patientName = ""; // Not used in component anymore but kept for backward compatibility in tests

  const mockPhysiotherapySession: CreatedTreatment = {
    id: 1,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "physiotherapy",
    bodyLocation: "Head",
    startDate: "2025-09-16",
    plannedSessions: 5,
    completedSessions: 0,
    status: "scheduled",
    durationMinutes: 3, // 3 units = 21 minutes
    color: "Blue",
    notes: "Physiotherapy - Blue - 21 minutes",
    createdDate: "2025-09-16",
    createdTime: "10:00:00",
    updatedDate: "2025-09-16",
    updatedTime: "10:00:00",
  };

  const mockTensSession: CreatedTreatment = {
    id: 2,
    consultationId: 1,
    appointmentId: 1,
    patientId: 1,
    treatmentType: "tens",
    bodyLocation: "Back",
    startDate: "2025-09-16",
    plannedSessions: 3,
    completedSessions: 0,
    status: "scheduled",
    notes: "Treatment with TENS",
    createdDate: "2025-09-16",
    createdTime: "10:00:00",
    updatedDate: "2025-09-16",
    updatedTime: "10:00:00",
  };

  const mockScheduledAppointments: AppointmentResponseDto[] = [
    {
      id: 101,
      patientId: 1,
      type: "assessment" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2025-10-14",
      scheduledTime: "09:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
    {
      id: 102,
      patientId: 1,
      type: "physiotherapy" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2025-09-23",
      scheduledTime: "10:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
    {
      id: 103,
      patientId: 1,
      type: "physiotherapy" as AppointmentType,
      status: "scheduled" as AppointmentStatus,
      scheduledDate: "2025-09-30",
      scheduledTime: "10:00:00",
      createdAt: "2025-09-16T10:00:00Z",
      updatedAt: "2025-09-16T10:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success confirmation", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName=""
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(
      screen.getByText("Treatment registered successfully!"),
    ).toBeInTheDocument();
  });

  it("should display treatment session details correctly", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check treatment type group title
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();

    // Check body location (grouped card shows location label)
    expect(screen.getByText("Head")).toBeInTheDocument();

    // Check color and duration
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("21 min")).toBeInTheDocument();

    // Check session count
    expect(screen.getByText("5 sessions")).toBeInTheDocument();
  });

  it("should display tens treatment sessions correctly", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check treatment type group title (TENS, no emoji in group header)
    expect(screen.getByText("TENS")).toBeInTheDocument();

    // Check body location
    expect(screen.getByText("Back")).toBeInTheDocument();

    // Check session count
    expect(screen.getByText("3 sessions")).toBeInTheDocument();
  });

  it("should show both treatment groups with session counts", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession, mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("TENS")).toBeInTheDocument();
    expect(screen.getByText("5 sessions")).toBeInTheDocument();
    expect(screen.getByText("3 sessions")).toBeInTheDocument();
  });

  it("should group sessions by treatment type", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession, mockTensSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Check group headers
    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("TENS")).toBeInTheDocument();

    // Check location count per group (sessions that differ only by body location are grouped)
    const locationTexts = screen.getAllByText("(1 location)");
    expect(locationTexts).toHaveLength(2); // One for each treatment type
  });

  it("should show automatic scheduling information", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
        newlyScheduledAppointments={mockScheduledAppointments}
      />,
    );

    expect(
      screen.getByText("The appointments below were created automatically:"),
    ).toBeInTheDocument();
  });

  it("should call onAcknowledge when acknowledge button is clicked", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    const acknowledgeButton = screen.getByText("Close");
    fireEvent.click(acknowledgeButton);

    expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);
  });

  it("should display custom message when provided", () => {
    const customMessage = "Custom test message";

    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[mockPhysiotherapySession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
        customMessage={customMessage}
      />,
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("should handle empty sessions array gracefully", () => {
    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    // Should still show success header
    expect(
      screen.getByText("Treatment registered successfully!"),
    ).toBeInTheDocument();

    // When there are no sessions, no treatment groups or stats block
    expect(screen.queryByText("Physiotherapy")).not.toBeInTheDocument();
    expect(screen.queryByText("TENS")).not.toBeInTheDocument();
  });

  it("should handle single session correctly", () => {
    const singleSession = { ...mockPhysiotherapySession, plannedSessions: 1 };

    render(
      <CreatedTreatmentsConfirmation
        createdTreatments={[singleSession]}
        patientName={patientName}
        onAcknowledge={mockOnAcknowledge}
      />,
    );

    expect(screen.getByText("Physiotherapy")).toBeInTheDocument();
    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  describe("Next Assessment Consultation", () => {
    it("should display next consultation date when scheduled appointments are provided", () => {
      const returnWeeks = 4;

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={returnWeeks}
          newlyScheduledAppointments={mockScheduledAppointments}
        />,
      );

      // Should show the next consultation section (NextConsultationCard)
      expect(
        screen.getByText("Assessment Consultation Return"),
      ).toBeInTheDocument();

      // Should show the date from the scheduled appointment (10/14/2025)
      expect(screen.getByText("10/14/2025")).toBeInTheDocument();
    });

    it("should not display next consultation section when newlyScheduledAppointments is empty", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAppointments={[]}
        />,
      );

      expect(
        screen.queryByText("Assessment Consultation Return"),
      ).not.toBeInTheDocument();
    });

    it("should not display next consultation section when newlyScheduledAppointments is not provided", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
        />,
      );

      expect(
        screen.queryByText("Assessment Consultation Return"),
      ).not.toBeInTheDocument();
    });

    it("should filter out non-scheduled assessment appointments (completed/in_progress)", () => {
      const appointmentsWithCompleted: AppointmentResponseDto[] = [
        {
          id: 100,
          patientId: 1,
          type: "assessment" as AppointmentType,
          status: "completed" as AppointmentStatus,
          scheduledDate: "2025-09-16",
          scheduledTime: "09:00:00",
          createdAt: "2025-09-16T10:00:00Z",
          updatedAt: "2025-09-16T10:00:00Z",
        },
        ...mockScheduledAppointments,
      ];

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAppointments={appointmentsWithCompleted}
        />,
      );

      // Should show the next scheduled (not completed) consultation
      expect(screen.getByText("10/14/2025")).toBeInTheDocument();
      expect(screen.queryByText("09/16/2025")).not.toBeInTheDocument();
    });

    it("should display singular form for 1 week return", () => {
      const oneWeekLaterAppointments: AppointmentResponseDto[] = [
        {
          id: 99,
          patientId: 1,
          type: "assessment" as AppointmentType,
          status: "scheduled" as AppointmentStatus,
          scheduledDate: "2025-09-23",
          scheduledTime: "09:00:00",
          createdAt: "2025-09-16T10:00:00Z",
          updatedAt: "2025-09-16T10:00:00Z",
        },
      ];
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={1}
          newlyScheduledAppointments={oneWeekLaterAppointments}
        />,
      );

      // getWeeksUntil mock: 2025-09-23 - 2025-09-16 = 1 week
      expect(screen.getByText("1 week")).toBeInTheDocument();
    });

    it("should display plural form for multiple weeks return", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={8}
          newlyScheduledAppointments={mockScheduledAppointments}
        />,
      );

      // getWeeksUntil mock: 2025-10-14 - 2025-09-16 ≈ 4 weeks
      expect(screen.getByText("4 weeks")).toBeInTheDocument();
    });

    it("should show next consultation date when next consultation is shown", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={4}
          newlyScheduledAppointments={mockScheduledAppointments}
        />,
      );

      expect(
        screen.getByText("Assessment Consultation Return"),
      ).toBeInTheDocument();
      expect(screen.getByText("10/14/2025")).toBeInTheDocument();
    });

    it("should show next consultation even when no treatment sessions are created", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          returnWeeks={2}
          newlyScheduledAppointments={mockScheduledAppointments}
        />,
      );

      // Should still show next consultation section
      expect(
        screen.getByText("Assessment Consultation Return"),
      ).toBeInTheDocument();
      expect(screen.getByText("10/14/2025")).toBeInTheDocument();
    });

    it("should show loading state when fetchingAppointments is true", () => {
      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          fetchingAppointments={true}
        />,
      );

      expect(
        screen.getByText("Searching for created appointments..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Verifying the next scheduled appointments automatically",
        ),
      ).toBeInTheDocument();
    });

    it("should show error state when appointmentsError is provided", () => {
      const errorMessage = "Error fetching appointments";

      render(
        <CreatedTreatmentsConfirmation
          createdTreatments={[mockPhysiotherapySession]}
          patientName={patientName}
          onAcknowledge={mockOnAcknowledge}
          appointmentsError={errorMessage}
        />,
      );

      expect(
        screen.getAllByText("Error fetching appointments").length,
      ).toBeGreaterThan(0);
    });
  });
});
