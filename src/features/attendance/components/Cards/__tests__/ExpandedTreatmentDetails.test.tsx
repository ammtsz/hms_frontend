import React from "react";
import { render, screen } from "@testing-library/react";
import ExpandedTreatmentDetails from "../ExpandedTreatmentDetails";
import type { TreatmentResponseDto, SessionResponseDto } from "@/api/types";
import type { TreatmentPlanWithSessionRow } from "@/api/query/hooks/useTreatmentsWithSessionRows";

describe("ExpandedTreatmentDetails", () => {
  const mockSessionsWithRecords: TreatmentPlanWithSessionRow[] = [
    {
      sessionRow: {
        id: 1,
        treatmentId: 1,
        attendanceId: 101,
        scheduledDate: "2026-01-15",
        sessionNumber: 1,
        status: "scheduled",
        createdDate: "2026-01-15",
        createdTime: "10:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "10:00:00",
      } as SessionResponseDto,
      treatment: {
        id: 1,
        consultationId: 1,
        attendanceId: 1,
        patientId: 1,
        treatmentType: "physiotherapy",
        bodyLocation: "Cabeça",
        startDate: "2026-01-15",
        plannedSessions: 10,
        completedSessions: 3,
        status: "in_progress",
        durationMinutes: 14,
        color: "azul",
        notes: "Treatment progressing well",
        createdDate: "2026-01-15",
        createdTime: "10:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "10:00:00",
      } as TreatmentResponseDto,
    },
    {
      sessionRow: {
        id: 2,
        treatmentId: 2,
        attendanceId: 102,
        scheduledDate: "2026-01-15",
        sessionNumber: 1,
        status: "scheduled",
        createdDate: "2026-01-15",
        createdTime: "10:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "10:00:00",
      } as SessionResponseDto,
      treatment: {
        id: 2,
        consultationId: 1,
        attendanceId: 1,
        patientId: 1,
        treatmentType: "tens",
        bodyLocation: "Coluna",
        startDate: "2026-01-15",
        plannedSessions: 5,
        completedSessions: 2,
        status: "in_progress",
        createdDate: "2026-01-15",
        createdTime: "10:00:00",
        updatedDate: "2026-01-15",
        updatedTime: "10:00:00",
      } as TreatmentResponseDto,
    },
  ];

  it("should render physiotherapy session details", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={[mockSessionsWithRecords[0]]}
        patientName="John Doe"
      />,
    );

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
    expect(screen.getByText("azul")).toBeInTheDocument();
    expect(screen.getByText(/Sessão 1\/10/)).toBeInTheDocument();
    expect(screen.getByText("Cabeça")).toBeInTheDocument();
    expect(screen.getByText(/14 unidades/)).toBeInTheDocument();
  });

  it("should render tens session details", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={[mockSessionsWithRecords[1]]}
        patientName="Jane Doe"
      />,
    );

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
    expect(screen.getByText(/Sessão 1\/5/)).toBeInTheDocument();
    expect(screen.getByText("Coluna")).toBeInTheDocument();
    expect(screen.queryByText(/unidades/)).not.toBeInTheDocument();
  });

  it("should render multiple sessions", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={mockSessionsWithRecords}
        patientName="Test Patient"
      />,
    );

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
    expect(screen.getByText(/TENS/)).toBeInTheDocument();
  });

  it("should render empty state when no sessions", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={[]}
        patientName="Empty Patient"
      />,
    );

    expect(
      screen.getByText("Nenhuma sessão de tratamento encontrada"),
    ).toBeInTheDocument();
  });

  it("should render treatment notes when available", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={[mockSessionsWithRecords[0]]}
        patientName="Test"
      />,
    );

    expect(screen.getByText("Treatment progressing well")).toBeInTheDocument();
  });

  it("should not render duration for tens treatments", () => {
    render(
      <ExpandedTreatmentDetails
        treatmentsWithSessionRows={[mockSessionsWithRecords[1]]}
        patientName="Test"
      />,
    );

    expect(screen.queryByText(/Tempo:/)).not.toBeInTheDocument();
  });
});
