import React from "react";
import { render, screen } from "@testing-library/react";
import { AssessmentDetails } from "../AssessmentDetails";

describe("AssessmentDetails", () => {
  it("should render default title", () => {
    render(<AssessmentDetails />);

    expect(screen.getByText("📋 Consulta de Avaliação")).toBeInTheDocument();
  });

  it("should render custom title", () => {
    render(<AssessmentDetails title="🙏 Tratamento Médico" />);

    expect(screen.getByText(/Tratamento Médico/)).toBeInTheDocument();
  });

  it("should display assessment notes when provided", () => {
    render(
      <AssessmentDetails preConsultationNotes="Paciente relata melhora" />,
    );

    expect(screen.getByText(/Notas pré-consulta:/)).toBeInTheDocument();
    expect(screen.getByText("Paciente relata melhora")).toBeInTheDocument();
  });

  it("should display treatment record notes when provided", () => {
    render(
      <AssessmentDetails consultationNotes="Orientações sobre evolução médica" />,
    );

    expect(screen.getByText(/Notas da consulta:/)).toBeInTheDocument();
    expect(
      screen.getByText("Orientações sobre evolução médica"),
    ).toBeInTheDocument();
  });

  it("should display both assessment and treatment notes", () => {
    render(
      <AssessmentDetails
        preConsultationNotes="Notas antes da consulta"
        consultationNotes="Notas durante a consulta"
      />,
    );

    expect(screen.getByText("Notas antes da consulta")).toBeInTheDocument();
    expect(screen.getByText("Notas durante a consulta")).toBeInTheDocument();
  });

  it("should display food recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          food: "Evitar carnes vermelhas",
        }}
      />,
    );

    expect(screen.getByText(/Alimentação/)).toBeInTheDocument();
    expect(screen.getByText("Evitar carnes vermelhas")).toBeInTheDocument();
  });

  it("should display water recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          water: "Água 3x ao dia",
        }}
      />,
    );

    expect(screen.getAllByText(/Água/)[0]).toBeInTheDocument();
    expect(screen.getByText("Água 3x ao dia")).toBeInTheDocument();
  });

  it("should display ointment recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          ointment: "Aplicar na região afetada",
        }}
      />,
    );

    expect(screen.getByText(/Pomada/)).toBeInTheDocument();
    expect(screen.getByText("Aplicar na região afetada")).toBeInTheDocument();
  });

  it("should display return weeks", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 4,
        }}
      />,
    );

    expect(screen.getByText(/Retorno/)).toBeInTheDocument();
    expect(screen.getByText("4 semanas")).toBeInTheDocument();
  });

  it("should display singular for 1 week", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 1,
        }}
      />,
    );

    expect(screen.getByText("1 semana")).toBeInTheDocument();
  });

  it("should display return when treatment complete", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 0,
          returnWhenTreatmentComplete: true,
        }}
      />,
    );

    expect(
      screen.getByText("retornar no último dia de tratamento"),
    ).toBeInTheDocument();
  });

  it("should display weeks after treatment completion", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 2,
          returnWhenTreatmentComplete: true,
        }}
      />,
    );

    expect(
      screen.getByText(/2 semanas após o término do tratamento/),
    ).toBeInTheDocument();
  });

  it("should display physiotherapy sessions", () => {
    const physiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Cabeça",
        plannedSessions: 3,
        completedSessions: 0,
        color: "Azul",
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails
        physiotherapySessions={physiotherapySessions}
        recommendations={{}}
      />,
    );

    expect(screen.getByText(/Fisioterapia/)).toBeInTheDocument();
    expect(screen.getByText(/3 sessões - Cabeça/)).toBeInTheDocument();
  });

  it("should display tens sessions", () => {
    const tensSessions = [
      {
        id: 2,
        treatmentType: "tens" as const,
        bodyLocation: "Pé direito",
        plannedSessions: 5,
        completedSessions: 0,
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails tensSessions={tensSessions} recommendations={{}} />,
    );

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
    expect(screen.getByText(/5 sessões - Pé direito/)).toBeInTheDocument();
  });

  it("should apply disabled styling when isAbsent is true", () => {
    const { container } = render(<AssessmentDetails isAbsent={true} />);

    const detailBox = container.querySelector(".border-l-gray-400");
    expect(detailBox).toBeInTheDocument();
  });

  it("should apply assessment styling when isAbsent is false", () => {
    const { container } = render(<AssessmentDetails isAbsent={false} />);

    const detailBox = container.querySelector(".border-l-purple-500");
    expect(detailBox).toBeInTheDocument();
  });

  it("should display first attendance message when isFirstAttendance is true", () => {
    render(<AssessmentDetails isFirstAttendance={true} />);

    expect(
      screen.getByText(/Consulta de retorno agendada/),
    ).toBeInTheDocument();
  });

  it("should display return attendance message when isFirstAttendance is false", () => {
    render(<AssessmentDetails isFirstAttendance={false} />);

    expect(screen.getByText(/Primeira consulta agendada/)).toBeInTheDocument();
  });

  it("should not display recommendations section when no recommendations", () => {
    render(<AssessmentDetails />);

    expect(screen.queryByText(/Recomendações:/)).not.toBeInTheDocument();
  });

  it("should render all recommendations together", () => {
    const physiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Cabeça",
        plannedSessions: 2,
        completedSessions: 0,
        color: "Azul",
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails
        preConsultationNotes="Paciente apresenta boa receptividade"
        consultationNotes="Orientado sobre tratamento"
        recommendations={{
          food: "Evitar carnes",
          water: "Água",
          ointment: "Aplicar 2x ao dia",
          returnWeeks: 3,
        }}
        physiotherapySessions={physiotherapySessions}
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/Recomendações:/)).toBeInTheDocument();
    expect(screen.getByText("Evitar carnes")).toBeInTheDocument();
    expect(screen.getByText("Água")).toBeInTheDocument();
    expect(screen.getByText("Aplicar 2x ao dia")).toBeInTheDocument();
    expect(screen.getByText("3 semanas")).toBeInTheDocument();
    expect(screen.getByText(/2 sessões - Cabeça/)).toBeInTheDocument();
  });
});
