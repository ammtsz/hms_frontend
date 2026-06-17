import React from "react";
import { render, screen } from "@testing-library/react";
import { PhysiotherapyDetails } from "../PhysiotherapyDetails";
import { TensDetails } from "../TensDetails";
import { AssessmentDetails } from "../AssessmentDetails";
import { TreatmentDetailsContainer } from "../TreatmentDetailsContainer";
import { NotesBox } from "../helpers/treatmentHelpers";

describe("AttendanceDetails components", () => {
  describe("PhysiotherapyDetails", () => {
    it("renders physiotherapy details correctly", () => {
      render(
        <PhysiotherapyDetails
          bodyLocations={["Cabeça", "Ombro"]}
          color="azul"
          duration={21}
          sessionNumber={"1/3"}
          showSessions={true}
          sessionLabel="Sessão"
        />,
      );

      expect(screen.getByText(/✨ Fisioterapia/)).toBeInTheDocument();
      expect(screen.getByText("azul")).toBeInTheDocument();
      expect(screen.getByText(/Cabeça, Ombro/)).toBeInTheDocument();
      expect(screen.getByText(/21 unidades/)).toBeInTheDocument();
      expect(screen.getByText(/Sessão:/)).toBeInTheDocument();
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    it("renders without optional props", () => {
      render(<PhysiotherapyDetails bodyLocations={["Cabeça"]} />);

      expect(screen.getByText(/✨ Fisioterapia/)).toBeInTheDocument();
      expect(screen.getByText("Cabeça")).toBeInTheDocument();
    });
  });

  describe("TensDetails", () => {
    it("renders tens details correctly", () => {
      render(
        <TensDetails
          bodyLocations={["Ombro direito"]}
          sessionNumber={"2/3"}
          showSessions={true}
          sessionLabel="Sessão"
        />,
      );

      expect(screen.getByText(/🪄 TENS/)).toBeInTheDocument();
      expect(screen.getByText(/Ombro direito/)).toBeInTheDocument();
      expect(screen.getByText(/Sessão/)).toBeInTheDocument();
      expect(screen.getByText(/2\/3/)).toBeInTheDocument();
    });
  });

  describe("NotesBox", () => {
    it("renders treatment notes correctly", () => {
      render(
        <NotesBox
          notes="Test notes content"
          borderColor="yellow"
          noteType="treatment"
        />,
      );

      expect(screen.getByText(/Notas do tratamento/)).toBeInTheDocument();
      expect(screen.getByText(/Test notes content/)).toBeInTheDocument();
    });

    it("renders session notes correctly", () => {
      render(
        <NotesBox
          notes="Session observation"
          borderColor="blue"
          noteType="session"
        />,
      );

      expect(screen.getByText(/Notas da sessão/)).toBeInTheDocument();
      expect(screen.getByText(/Session observation/)).toBeInTheDocument();
    });

    it("renders observation-style notes correctly", () => {
      render(
        <NotesBox
          notes="Patient was absent"
          borderColor="red"
          noteType="observations"
        />,
      );

      expect(screen.getByText(/Observações/)).toBeInTheDocument();
      expect(screen.getByText(/Patient was absent/)).toBeInTheDocument();
    });
  });

  describe("AssessmentDetails", () => {
    it("renders recommendations correctly", () => {
      const recommendations = {
        food: "Evitar carne vermelha",
        water: "Beber água energizada",
        physiotherapy: true,
        returnWeeks: 4,
      };

      render(<AssessmentDetails recommendations={recommendations} />);

      expect(screen.getByText("📋 Consulta de Avaliação")).toBeInTheDocument();
      expect(screen.getByText("Recomendações:")).toBeInTheDocument();
      expect(screen.getByText("Evitar carne vermelha")).toBeInTheDocument();
      expect(screen.getByText("Beber água energizada")).toBeInTheDocument();
      expect(screen.getByText("4 semanas")).toBeInTheDocument();
    });

    it("renders recommendations with treatment session details", () => {
      const recommendations = {
        food: "Evitar carne vermelha",
        water: "Beber água energizada",
        returnWeeks: 4,
      };

      const physiotherapySessions = [
        {
          id: 1,
          treatmentType: "physiotherapy" as const,
          bodyLocation: "cabeça",
          plannedSessions: 3,
          completedSessions: 0,
          color: "azul",
          status: "active",
        },
      ];

      const tensSessions = [
        {
          id: 2,
          treatmentType: "tens" as const,
          bodyLocation: "ombro",
          plannedSessions: 2,
          completedSessions: 0,
          status: "active",
        },
      ];

      render(
        <AssessmentDetails
          recommendations={recommendations}
          physiotherapySessions={physiotherapySessions}
          tensSessions={tensSessions}
        />,
      );

      expect(screen.getByText("📋 Consulta de Avaliação")).toBeInTheDocument();
      expect(screen.getByText("Recomendações:")).toBeInTheDocument();
      expect(screen.getByText("Evitar carne vermelha")).toBeInTheDocument();
      expect(screen.getByText("Beber água energizada")).toBeInTheDocument();
      expect(
        screen.getByText("3 sessões - cabeça (cor: azul)"),
      ).toBeInTheDocument();
      expect(screen.getByText("2 sessões - ombro")).toBeInTheDocument();
      expect(screen.getByText("4 semanas")).toBeInTheDocument();
    });

    it("renders without treatment sessions when not provided", () => {
      const recommendations = {
        food: "Evitar carne vermelha",
        returnWeeks: 2,
      };

      render(<AssessmentDetails recommendations={recommendations} />);

      expect(screen.getByText("📋 Consulta de Avaliação")).toBeInTheDocument();
      expect(screen.getByText("Recomendações:")).toBeInTheDocument();
      expect(screen.getByText("Evitar carne vermelha")).toBeInTheDocument();
      expect(screen.getByText("2 semanas")).toBeInTheDocument();
      // Should not show physiotherapy or tens without sessions
      expect(screen.queryByText(/Fisioterapia/)).not.toBeInTheDocument();
      expect(screen.queryByText(/TENS/)).not.toBeInTheDocument();
    });
  });

  describe("TreatmentDetailsContainer", () => {
    it("renders children correctly", () => {
      render(
        <TreatmentDetailsContainer>
          <div>Test content</div>
        </TreatmentDetailsContainer>,
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });
  });
});
