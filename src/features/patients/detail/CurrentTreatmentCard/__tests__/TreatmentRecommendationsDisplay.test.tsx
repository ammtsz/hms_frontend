import React from "react";
import { render, screen } from "@/utils/testUtils";
import { TreatmentRecommendationsDisplay } from "../TreatmentRecommendationsDisplay";
import { Recommendations } from "@/types/types";

const mockRecommendations = {
  date: "2024-12-20",
  food: "Dieta leve",
  water: "2L/dia",
  ointment: "Aplicar 2x/dia",
  returnWeeks: 4,
};

const mockPhysiotherapySessions = [
  {
    id: 1,
    treatmentType: "physiotherapy" as const,
    bodyLocation: "Cabeça",
    plannedSessions: 3,
    completedSessions: 1,
    color: "Azul",
    status: "active",
  },
];

const mockTensSessions = [
  {
    id: 2,
    treatmentType: "tens" as const,
    bodyLocation: "Coluna",
    plannedSessions: 5,
    completedSessions: 2,
    status: "active",
  },
];

describe("TreatmentRecommendationsDisplay", () => {
  it("renders all recommendation fields correctly", () => {
    render(
      <TreatmentRecommendationsDisplay
        recommendations={mockRecommendations}
        physiotherapySessions={mockPhysiotherapySessions}
        tensSessions={mockTensSessions}
      />,
    );

    expect(screen.getByText(/Últimas Recomendações/)).toBeInTheDocument();
    expect(screen.getByText("🍎 Alimentação:")).toBeInTheDocument();
    expect(screen.getByText("💧 Água:")).toBeInTheDocument();
    expect(screen.getByText("🧴 Pomada:")).toBeInTheDocument();
    expect(
      screen.getByText(/✨ Fisioterapia \(1 tratamento ativo\):/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/🪄 TENS \(1 tratamento ativo\):/),
    ).toBeInTheDocument();
    expect(screen.getByText("📅 Retorno:")).toBeInTheDocument();
  });

  it("displays recommendation values correctly", () => {
    render(
      <TreatmentRecommendationsDisplay
        recommendations={mockRecommendations}
        physiotherapySessions={mockPhysiotherapySessions}
        tensSessions={mockTensSessions}
      />,
    );

    expect(screen.getByText("Dieta leve")).toBeInTheDocument();
    expect(screen.getByText("2L/dia")).toBeInTheDocument();
    expect(screen.getByText("Aplicar 2x/dia")).toBeInTheDocument();
    expect(screen.getByText("4 semanas")).toBeInTheDocument();
  });

  it("displays treatment session details correctly", () => {
    render(
      <TreatmentRecommendationsDisplay
        recommendations={mockRecommendations}
        physiotherapySessions={mockPhysiotherapySessions}
        tensSessions={mockTensSessions}
      />,
    );

    // Physiotherapy details
    expect(
      screen.getByText(/3 sessões: Cabeça \(cor: Azul\)/),
    ).toBeInTheDocument();

    // TENS details
    expect(screen.getByText(/5 sessões: Coluna/)).toBeInTheDocument();
  });

  it("shows 'no recommendations' message when all fields are empty", () => {
    const emptyRecommendations = {
      date: "2024-12-20",
      returnWeeks: 0,
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={emptyRecommendations}
        physiotherapySessions={[]}
        tensSessions={[]}
      />,
    );

    expect(
      screen.getByText("Nenhuma recomendação registrada"),
    ).toBeInTheDocument();
  });

  it("renders only treatment sessions without other recommendations", () => {
    const minimalRecommendations = {
      date: "2024-12-20",
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={minimalRecommendations}
        physiotherapySessions={mockPhysiotherapySessions}
      />,
    );

    expect(screen.getByText(/Últimas Recomendações/)).toBeInTheDocument();
    expect(
      screen.getByText(/✨ Fisioterapia \(1 tratamento ativo\):/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3 sessões: Cabeça \(cor: Azul\)/),
    ).toBeInTheDocument();
    expect(screen.queryByText("🍎 Alimentação:")).not.toBeInTheDocument();
  });

  it("handles undefined date gracefully", () => {
    const recommendationsWithoutDate: { date: string } & Recommendations = {
      date: "",
      food: mockRecommendations.food,
      water: mockRecommendations.water,
      ointment: mockRecommendations.ointment,
      physiotherapy: false,
      tens: false,
      returnWeeks: mockRecommendations.returnWeeks,
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={recommendationsWithoutDate}
      />,
    );

    expect(screen.getByText(/Data não disponível/)).toBeInTheDocument();
  });

  it("formats multiple sessions of the same treatment type", () => {
    const multiplePhysiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Cabeça",
        plannedSessions: 3,
        completedSessions: 1,
        color: "Azul",
        status: "active",
      },
      {
        id: 2,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Mão direita",
        plannedSessions: 1,
        completedSessions: 0,
        status: "active",
      },
    ];

    render(
      <TreatmentRecommendationsDisplay
        recommendations={mockRecommendations}
        physiotherapySessions={multiplePhysiotherapySessions}
      />,
    );

    expect(
      screen.getByText(/3 sessões: Cabeça \(cor: Azul\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 sessão: Mão direita/)).toBeInTheDocument();
  });

  it("displays consultation notes when present", () => {
    const recommendationsWithNotes = {
      ...mockRecommendations,
      notes: "Paciente apresentou melhora significativa nos sintomas.",
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={recommendationsWithNotes}
      />,
    );

    expect(screen.getByText("📝 Observações da Consulta:")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Paciente apresentou melhora significativa nos sintomas.",
      ),
    ).toBeInTheDocument();
  });

  it("does not display notes section when notes are empty", () => {
    render(
      <TreatmentRecommendationsDisplay recommendations={mockRecommendations} />,
    );

    expect(
      screen.queryByText("📝 Observações da Consulta:"),
    ).not.toBeInTheDocument();
  });

  it("includes notes in hasRecommendations check", () => {
    const onlyNotesRecommendations = {
      date: "2024-12-20",
      notes: "Observações importantes sobre o paciente.",
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={onlyNotesRecommendations}
        physiotherapySessions={[]}
        tensSessions={[]}
      />,
    );

    expect(screen.getByText(/Últimas Recomendações/)).toBeInTheDocument();
    expect(
      screen.getByText("Observações importantes sobre o paciente."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma recomendação registrada"),
    ).not.toBeInTheDocument();
  });
});
