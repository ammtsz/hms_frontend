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
  formatDateBR: (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  },
  getDaysOverdue: jest.fn(() => 0),
}));

import { getDaysOverdue } from "@/utils/dateUtils";

const mockPatient: Patient = {
  id: "1",
  name: "João Silva",
  phone: "(11) 99999-9999",
  birthDate: "1980-05-15",
  mainComplaint: "Dores de cabeça frequentes",
  status: "A",
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
    food: "Leve",
    water: "2L/dia",
    ointment: "Aplicar 2x/dia",
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

    expect(screen.getByText("Data de Cadastro")).toBeInTheDocument();
    expect(screen.getByText("Próximo Atendimento")).toBeInTheDocument();
    expect(screen.getByText("Alta recebida em")).toBeInTheDocument();
  });

  it("shows next attendance date when available", () => {
    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(screen.getByText(/\d{2}\/12\/2024/)).toBeInTheDocument();
  });

  it("shows 'Não agendado' when no next attendance", () => {
    const patientWithoutNextAttendance = {
      ...mockPatient,
      nextAttendanceDates: [],
    };

    render(<TreatmentStatusOverview patient={patientWithoutNextAttendance} />);

    expect(screen.getByText("Não agendado")).toBeInTheDocument();
  });

  it("shows 'Não definida' when no discharge date", () => {
    const patientWithoutDischarge = {
      ...mockPatient,
      dischargeDate: null,
    };

    render(<TreatmentStatusOverview patient={patientWithoutDischarge} />);

    expect(screen.getByText("Não definida")).toBeInTheDocument();
  });

  it("shows overdue alert in red when expected discharge date has passed", () => {
    const patientWithOverdueDischarge: Patient = {
      ...mockPatient,
      status: "T",
      dischargeDate: "2024-06-15",
    };
    (getDaysOverdue as jest.Mock).mockReturnValue(5);

    render(<TreatmentStatusOverview patient={patientWithOverdueDischarge} />);

    expect(screen.getByText("(5 dias em atraso)")).toBeInTheDocument();
    const dateElement = screen.getByText("14/06/2024");
    expect(dateElement).toHaveClass("text-red-600");
  });

  it("shows singular '(1 dia em atraso)' when one day overdue", () => {
    const patientWithOverdueDischarge: Patient = {
      ...mockPatient,
      status: "T",
      dischargeDate: "2024-06-15",
    };
    (getDaysOverdue as jest.Mock).mockReturnValue(1);

    render(<TreatmentStatusOverview patient={patientWithOverdueDischarge} />);

    expect(screen.getByText("(1 dia em atraso)")).toBeInTheDocument();
  });

  it("does not show overdue alert when status is A (discharge received)", () => {
    (getDaysOverdue as jest.Mock).mockReturnValue(100);

    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(screen.queryByText(/dias? em atraso/)).not.toBeInTheDocument();
  });

  it("links to patient edit page with focus param when discharge card is clicked", () => {
    const patientWithExpectedDischarge: Patient = {
      ...mockPatient,
      status: "T",
    };

    render(<TreatmentStatusOverview patient={patientWithExpectedDischarge} />);

    const editLink = screen.getByRole("link", { name: /atualizar data/i });
    expect(editLink).toHaveAttribute(
      "href",
      "/patients/1/edit?focus=dischargeDate",
    );
  });

  it("does not render link when status is A (discharge received)", () => {
    render(<TreatmentStatusOverview patient={mockPatient} />);

    expect(
      screen.queryByRole("link", { name: /atualizar data/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Alta recebida em")).toBeInTheDocument();
  });

  it("renders link when status is F (consecutive absences)", () => {
    const patientWithStatusF: Patient = { ...mockPatient, status: "F" };

    render(<TreatmentStatusOverview patient={patientWithStatusF} />);

    const editLink = screen.getByRole("link", { name: /atualizar data/i });
    expect(editLink).toHaveAttribute(
      "href",
      "/patients/1/edit?focus=dischargeDate",
    );
    expect(screen.getByText("Alta Prevista")).toBeInTheDocument();
  });
});
