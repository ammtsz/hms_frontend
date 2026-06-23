import React from "react";
import { render, screen } from "@/utils/testUtils";
import { TreatmentStatusOverview } from "../TreatmentStatusOverview";
import { Patient } from "@/types/types";

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the dateHelpers utility
jest.mock("@/utils/dateUtils", () => ({
  formatDisplayDate: (date: string) => {
    const d = new Date(date.includes("T") ? date : `${date}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  },
  getDaysOverdue: jest.fn(() => 0),
}));

import { getDaysOverdue } from "@/utils/dateUtils";

const mockPatient: Patient = {
  id: "1",
  name: "John Smith",
  phone: "(11) 99999-9999",
  birthDate: "1980-05-15",
  mainConcern: "Frequent headaches",
  status: "D",
  priority: "2",
  startDate: "2024-01-15",
  dischargeDate: "2024-06-15",
  timezone: "America/Sao_Paulo",
  nextAttendanceDates: [
    {
      date: "2024-12-28",
      type: "assessment",
    },
  ],
  currentRecommendations: {
    date: "2024-12-20",
    food: "Light meals",
    water: "2L/day",
    ointment: "Apply 2x daily",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
  },
  previousAttendances: [],
  missingAppointmentsStreak: 0,
};

describe("TreatmentStatusOverview", () => {
  beforeEach(() => {
    (getDaysOverdue as jest.Mock).mockReturnValue(0);
  });

  it("renders treatment timeline information correctly", () => {
    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(screen.getByText("Registration Date")).toBeInTheDocument();
    expect(screen.getByText("Next Appointment")).toBeInTheDocument();
    expect(screen.getByText("Discharged on")).toBeInTheDocument();
  });

  it("shows next attendance date when available", () => {
    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(screen.getByText(/12\/\d{2}\/2024/)).toBeInTheDocument();
  });

  it("shows 'Not scheduled' when no next attendance", () => {
    const patientWithoutNextAttendance = {
      ...mockPatient,
      nextAttendanceDates: [],
    };

    render(<TreatmentStatusOverview patient={patientWithoutNextAttendance} />);

    expect(screen.getByText("Not scheduled")).toBeInTheDocument();
  });

  it("shows 'Not set' when no discharge date", () => {
    const patientWithoutDischarge = {
      ...mockPatient,
      dischargeDate: null,
    };

    render(<TreatmentStatusOverview patient={patientWithoutDischarge} />);

    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("shows overdue alert in red when expected discharge date has passed", () => {
    const patientWithOverdueDischarge: Patient = {
      ...mockPatient,
      status: "T",
      dischargeDate: "2024-06-15",
    };
    (getDaysOverdue as jest.Mock).mockReturnValue(5);

    render(<TreatmentStatusOverview patient={patientWithOverdueDischarge} />);

    expect(screen.getByText("(5 days overdue)")).toBeInTheDocument();
    const dateElement = screen.getByText("06/15/2024");
    expect(dateElement).toHaveClass("text-red-600");
  });

  it("shows singular '(1 day overdue)' when one day overdue", () => {
    const patientWithOverdueDischarge: Patient = {
      ...mockPatient,
      status: "T",
      dischargeDate: "2024-06-15",
    };
    (getDaysOverdue as jest.Mock).mockReturnValue(1);

    render(<TreatmentStatusOverview patient={patientWithOverdueDischarge} />);

    expect(screen.getByText("(1 day overdue)")).toBeInTheDocument();
  });

  it("does not show overdue alert when status is D (discharge received)", () => {
    (getDaysOverdue as jest.Mock).mockReturnValue(100);

    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(screen.queryByText(/days? overdue/)).not.toBeInTheDocument();
  });

  it("links to patient edit page with focus param when discharge card is clicked", () => {
    const patientWithExpectedDischarge: Patient = {
      ...mockPatient,
      status: "T",
    };

    render(<TreatmentStatusOverview patient={patientWithExpectedDischarge} />);

    const editLink = screen.getByRole("link", { name: /Update date/i });
    expect(editLink).toHaveAttribute(
      "href",
      "/patients/1/edit?focus=dischargeDate",
    );
  });

  it("does not render link when status is D (discharge received)", () => {
    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(
      screen.queryByRole("link", { name: /Update date/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Discharged on")).toBeInTheDocument();
  });

  it("renders link when status is C (consecutive no-shows)", () => {
    const patientWithStatusC: Patient = { ...mockPatient, status: "C" };

    render(<TreatmentStatusOverview patient={patientWithStatusC} />);

    const editLink = screen.getByRole("link", { name: /Update date/i });
    expect(editLink).toHaveAttribute(
      "href",
      "/patients/1/edit?focus=dischargeDate",
    );
    expect(screen.getByText("Expected Discharge")).toBeInTheDocument();
  });
});
