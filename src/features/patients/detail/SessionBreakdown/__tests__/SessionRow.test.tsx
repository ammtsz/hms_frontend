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
    expect(screen.getByText(/Session 1/)).toBeInTheDocument();
    expect(screen.getByText(/02\/10/)).toBeInTheDocument();
    expect(screen.getAllByText(/Completed/)[0]).toBeInTheDocument();
  });

  it("renders planned sessions when provided", () => {
    render(
      <SessionRow
        session={{ ...baseSession, plannedSessions: 5, sessionNumber: 2 }}
      />,
    );
    expect(screen.getByText(/Session 2\/5/)).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    render(
      <SessionRow session={{ ...baseSession, notes: "Patient calm" }} />,
    );
    expect(screen.getByText("Patient calm")).toBeInTheDocument();
  });

  it("renders missed reason when status is missed", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "missed",
          missedReason: "Patient did not show up",
        }}
      />,
    );
    expect(screen.getByText(/Reason:/)).toBeInTheDocument();
    expect(screen.getByText("Patient did not show up")).toBeInTheDocument();
  });

  it("renders cancellation reason when status is cancelled", () => {
    render(
      <SessionRow
        session={{
          ...baseSession,
          status: "cancelled",
          cancellationReason: "Treatment cancelled by patient",
        }}
      />,
    );
    expect(screen.getByText(/Reason:/)).toBeInTheDocument();
    expect(
      screen.getByText("Treatment cancelled by patient"),
    ).toBeInTheDocument();
  });

  it("renders end time when status is completed and endTime present", () => {
    render(
      <SessionRow
        session={{ ...baseSession, status: "completed", endTime: "14:30:00" }}
      />,
    );
    expect(screen.getByText(/Completed at 14:30/)).toBeInTheDocument();
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
    expect(screen.getAllByText(/Scheduled/)[0]).toBeInTheDocument();
  });
});
