import React from "react";
import { render, screen } from "@testing-library/react";
import QuickActions from "../QuickActions";
import { Patient } from "@/types/types";

jest.mock(
  "next/link",
  () =>
    ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
);

describe("QuickActions", () => {
  const mockPatient: Patient = {
    id: "1",
    name: "Test Patient",
    phone: "11999999999",
    priority: "3",
    status: "T",
    birthDate: "1990-01-01",
    mainComplaint: "Test complaint",
    startDate: "2025-01-01",
    dischargeDate: null,
    timezone: "America/Sao_Paulo",
    nextAttendanceDates: [],
    currentRecommendations: {
      date: "2025-01-01",
      food: "",
      water: "",
      ointment: "",
      physiotherapy: false,
      tens: false,
      returnWeeks: 2,
    },
    previousAttendances: [],
    missingAppointmentsStreak: 0,
  };

  it("renders edit patient link", () => {
    render(<QuickActions patient={mockPatient} />);

    const editLink = screen.getByRole("link", { name: /editar/i });
    expect(editLink).toHaveAttribute("href", "/patients/1/edit");
  });
});
