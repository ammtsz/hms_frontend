import React from "react";
import { render, screen } from "@testing-library/react";
import { ScheduledAppointmentsPreview } from "../ScheduledAppointmentsPreview";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("ScheduledAppointmentsPreview", () => {
  const mockScheduledDates = [
    { date: "2026-01-21T00:00:00.000Z", time: "14:00" },
    { date: "2026-01-28T00:00:00.000Z", time: "14:30" },
    { date: "2026-02-04T00:00:00.000Z", time: "15:00" },
  ];

  const recentCreatedDate = toYmd(new Date(Date.now() - 3 * 86400000));

  it("should render scheduled dates", () => {
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={mockScheduledDates}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.getByText("Próximos agendamentos:")).toBeInTheDocument();
    expect(screen.getByText("21/01/2026")).toBeInTheDocument();
    expect(screen.getByText("28/01/2026")).toBeInTheDocument();
    expect(screen.getByText("04/02/2026")).toBeInTheDocument();
  });

  it("should render dates without times", () => {
    const datesWithoutTime = [{ date: "2026-01-21T00:00:00.000Z" }];
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={datesWithoutTime}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.getByText("21/01/2026")).toBeInTheDocument();
    expect(screen.queryByText(/⏰/)).not.toBeInTheDocument();
  });

  it("should show only first 10 dates", () => {
    const manyDates = [
      ...mockScheduledDates,
      { date: "2026-02-11T00:00:00.000Z" },
      { date: "2026-02-18T00:00:00.000Z" },
      { date: "2026-02-25T00:00:00.000Z" },
      { date: "2026-03-04T00:00:00.000Z" },
      { date: "2026-03-11T00:00:00.000Z" },
      { date: "2026-03-18T00:00:00.000Z" },
      { date: "2026-03-25T00:00:00.000Z" },
      { date: "2026-04-01T00:00:00.000Z" },
    ];

    render(
      <ScheduledAppointmentsPreview
        scheduledDates={manyDates}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.getByText("21/01/2026")).toBeInTheDocument();
    expect(screen.getByText("28/01/2026")).toBeInTheDocument();
    expect(screen.getByText("04/02/2026")).toBeInTheDocument();
    expect(screen.getByText("11/02/2026")).toBeInTheDocument();
    expect(screen.queryByText("01/04/2026")).not.toBeInTheDocument();
  });

  it("should show +N more indicator for more than 10 dates", () => {
    const manyDates = [
      ...mockScheduledDates,
      { date: "2026-02-11T00:00:00.000Z" },
      { date: "2026-02-18T00:00:00.000Z" },
      { date: "2026-02-25T00:00:00.000Z" },
      { date: "2026-03-04T00:00:00.000Z" },
      { date: "2026-03-11T00:00:00.000Z" },
      { date: "2026-03-18T00:00:00.000Z" },
      { date: "2026-03-25T00:00:00.000Z" },
      { date: "2026-04-01T00:00:00.000Z" },
      { date: "2026-04-08T00:00:00.000Z" },
    ];

    render(
      <ScheduledAppointmentsPreview
        scheduledDates={manyDates}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.getByText("+2 mais")).toBeInTheDocument();
  });

  it("should not show +N more indicator for 10 or fewer dates", () => {
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={mockScheduledDates}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.queryByText(/\+\d+ mais/)).not.toBeInTheDocument();
  });

  it("should handle empty scheduled dates", () => {
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={[]}
        createdDate={recentCreatedDate}
      />,
    );

    expect(
      screen.getByText("Todos os agendamentos foram concluídos"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument();
  });

  it("should show (não concluídos) when createdDate is at least 7 days old", () => {
    const oldCreatedDate = toYmd(new Date(Date.now() - 10 * 86400000));
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={mockScheduledDates}
        createdDate={oldCreatedDate}
      />,
    );

    expect(
      screen.getByText("Agendamentos não concluídos:"),
    ).toBeInTheDocument();
  });

  it("should show normal message when createdDate is less than 7 days old", () => {
    render(
      <ScheduledAppointmentsPreview
        scheduledDates={mockScheduledDates}
        createdDate={recentCreatedDate}
      />,
    );

    expect(screen.getByText("Próximos agendamentos:")).toBeInTheDocument();
  });
});
