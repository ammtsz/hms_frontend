import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SessionRow } from "../SessionRow";

describe("SessionRow", () => {
  const baseSession = {
    id: 1,
    sessionNumber: 1,
    scheduledDate: "2026-02-10",
    status: "completed",
  };

  it("renders session number, date and status label", () => {
    render(<SessionRow session={baseSession} />);
    expect(screen.getByText(/Sessão 1/)).toBeInTheDocument();
    expect(screen.getByText(/10\/02/)).toBeInTheDocument();
    expect(screen.getByText(/Concluída/)).toBeInTheDocument();
  });

  it("renders planned sessions when provided", () => {
    render(
      <SessionRow
        session={{ ...baseSession, plannedSessions: 5, sessionNumber: 2 }}
      />,
    );
    expect(screen.getByText(/Sessão 2\/5/)).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(
      <SessionRow session={{ ...baseSession, notes: "Paciente tranquilo" }} />,
    );
    expect(screen.getByText("Paciente tranquilo")).toBeInTheDocument();
  });

  it("renders missed reason when status is missed", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "missed",
          missedReason: "Paciente não compareceu",
        }}
      />,
    );
    expect(screen.getByText(/Motivo:/)).toBeInTheDocument();
    expect(screen.getByText("Paciente não compareceu")).toBeInTheDocument();
  });

  it("renders cancellation reason when status is cancelled", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "cancelled",
          cancellationReason: "Tratamento cancelado pelo paciente",
        }}
      />,
    );
    expect(screen.getByText(/Motivo:/)).toBeInTheDocument();
    expect(
      screen.getByText("Tratamento cancelado pelo paciente"),
    ).toBeInTheDocument();
  });

  it("renders end time when status is completed and endTime present", () => {
    render(
      <SessionRow
        session={{ ...baseSession, status: "completed", endTime: "14:30:00" }}
      />,
    );
    expect(screen.getByText(/Concluída às 14:30/)).toBeInTheDocument();
  });

  it("does not render missed reason when status is not missed", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "completed",
          missedReason: "Should not show",
        }}
      />,
    );
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("does not render cancellation reason when status is not cancelled", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "scheduled",
          cancellationReason: "Should not show",
        }}
      />,
    );
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("handles scheduled status label", () => {
    render(<SessionRow session={{ ...baseSession, status: "scheduled" }} />);
    expect(screen.getByText(/Agendada/)).toBeInTheDocument();
  });
});
