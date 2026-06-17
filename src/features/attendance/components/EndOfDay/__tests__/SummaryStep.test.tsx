import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SummaryStep from "../components/steps/SummaryStep";
import type { ProcessEndOfDayResponse } from "@/api/day-finalization";

describe("SummaryStep", () => {
  const defaultResult: ProcessEndOfDayResponse = {
    rescheduled: [],
    statusChangedToF: [],
    cancelledForF: [],
    couldNotReschedule: [],
  };

  const defaultProps = {
    result: defaultResult,
    selectedDate: "2024-01-15",
    onConclude: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays formatted date correctly", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
  });

  it("shows success message when no actions were taken", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(
      screen.getByText(
        "O dia foi finalizado com sucesso. Nenhuma ação automática foi necessária.",
      ),
    ).toBeInTheDocument();
  });

  it("calls onConclude when Concluir button is clicked", () => {
    render(<SummaryStep {...defaultProps} />);

    fireEvent.click(screen.getByText("Concluir"));

    expect(defaultProps.onConclude).toHaveBeenCalled();
  });

  it("displays rescheduled section when there are rescheduled items", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          attendanceId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText("Reagendados")).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Consulta/)).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it("displays status changed to F section when patients have status change", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      statusChangedToF: [{ patientId: 1, patientName: "Jane Smith" }],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(
      screen.getByText(
        /Pacientes com Status alterado para "Faltas Consecutivas"/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it("displays cancelled for F section when attendances were cancelled", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      cancelledForF: [
        {
          patientId: 2,
          patientName: "Bob Wilson",
          attendances: [
            { id: 10, type: "assessment", scheduledDate: "2024-01-20" },
          ],
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(
      screen.getByText("Atendimentos Cancelados devido a Faltas Consecutivas"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bob Wilson/)).toBeInTheDocument();
  });

  it("displays could not reschedule section when some could not be rescheduled", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      couldNotReschedule: [
        {
          attendanceId: 5,
          patientId: 3,
          patientName: "Alice Brown",
          type: "physiotherapy",
          reason: "Não foi possível encontrar data disponível em 52 semanas",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText("Não foi possível reagendar")).toBeInTheDocument();
    expect(screen.getByText(/Alice Brown/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Não foi possível encontrar data disponível em 52 semanas/,
      ),
    ).toBeInTheDocument();
  });

  it("filters out rescheduled items where oldDate equals newDate", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          attendanceId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "assessment",
          oldDate: "2024-01-15",
          newDate: "2024-01-15",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.queryByText("Reagendados")).not.toBeInTheDocument();
  });

  it("shows treatment type label with locais count for treatment types", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          attendanceId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
  });

  it("shows aggregated locais count when same patient has multiple rescheduled treatments", () => {
    const result: ProcessEndOfDayResponse = {
      ...defaultResult,
      rescheduled: [
        {
          attendanceId: 1,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
        {
          attendanceId: 2,
          patientId: 10,
          patientName: "John Doe",
          type: "physiotherapy",
          oldDate: "2024-01-15",
          newDate: "2024-01-22",
        },
      ],
    };

    render(<SummaryStep {...defaultProps} result={result} />);

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
    expect(screen.getByText(/2 locais/)).toBeInTheDocument();
  });

  it("shows Dia finalizado header with check icon", () => {
    render(<SummaryStep {...defaultProps} />);

    expect(screen.getByText(/Dia finalizado/)).toBeInTheDocument();
  });
});
