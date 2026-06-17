import React from "react";
import { render, screen } from "@testing-library/react";
import {
  formatActiveTreatmentRows,
  RecommendationItem,
} from "../assessmentHelpers";
import type { ActiveTreatmentRow } from "../assessmentHelpers";

describe("assessmentHelpers", () => {
  describe("formatActiveTreatmentRows", () => {
    it("should return empty array for empty rows", () => {
      const result = formatActiveTreatmentRows([]);

      expect(result).toEqual([]);
    });

    it("should format single session with location", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "physiotherapy",
          bodyLocation: "Cabeça",
          plannedSessions: 3,
          completedSessions: 0,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["3 sessões - Cabeça"]);
    });

    it("should format single session (1 session)", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "tens",
          bodyLocation: "Pé direito",
          plannedSessions: 1,
          completedSessions: 0,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["1 sessão - Pé direito"]);
    });

    it("should include color when present", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "physiotherapy",
          bodyLocation: "Peito",
          plannedSessions: 5,
          completedSessions: 0,
          color: "Azul",
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["5 sessões - Peito (cor: Azul)"]);
    });

    it("should format multiple sessions", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "physiotherapy",
          bodyLocation: "Cabeça",
          plannedSessions: 3,
          completedSessions: 0,
          color: "Azul",
          status: "scheduled",
        },
        {
          id: 2,
          treatmentType: "physiotherapy",
          bodyLocation: "Peito",
          plannedSessions: 2,
          completedSessions: 0,
          color: "Verde",
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual([
        "3 sessões - Cabeça (cor: Azul)",
        "2 sessões - Peito (cor: Verde)",
      ]);
    });

    it("should handle missing body location", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "tens",
          bodyLocation: "",
          plannedSessions: 4,
          completedSessions: 0,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["4 sessões - não especificado"]);
    });
  });

  describe("RecommendationItem", () => {
    it("should render icon and label", () => {
      render(
        <RecommendationItem
          icon="🍎"
          label="Alimentação"
          value="Evitar carnes"
        />,
      );

      expect(screen.getByText(/🍎/)).toBeInTheDocument();
      expect(screen.getByText(/Alimentação:/)).toBeInTheDocument();
      expect(screen.getByText("Evitar carnes")).toBeInTheDocument();
    });

    it("should render with string value", () => {
      render(<RecommendationItem icon="💧" label="Água" value="3x ao dia" />);

      expect(screen.getByText("3x ao dia")).toBeInTheDocument();
    });

    it("should render with React element value", () => {
      render(
        <RecommendationItem
          icon="✨"
          label="Fisioterapia"
          value={<span>Custom element</span>}
        />,
      );

      expect(screen.getByText("Custom element")).toBeInTheDocument();
    });

    it("should apply fullWidth class when fullWidth is true", () => {
      const { container } = render(
        <RecommendationItem
          icon="📅"
          label="Retorno"
          value="3 semanas"
          fullWidth={true}
        />,
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass("sm:col-span-2");
    });

    it("should not apply fullWidth class by default", () => {
      const { container } = render(
        <RecommendationItem
          icon="🧴"
          label="Pomada"
          value="Aplicar 2x ao dia"
        />,
      );

      const item = container.firstChild as HTMLElement;
      expect(item).not.toHaveClass("sm:col-span-2");
    });

    it("should have correct styling classes", () => {
      const { container } = render(
        <RecommendationItem icon="🍎" label="Test" value="Value" />,
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass(
        "flex",
        "items-start",
        "justify-between",
        "p-2",
        "bg-gray-50",
        "rounded",
        "border",
        "border-gray-200",
      );
    });

    it("should render label with text-nowrap", () => {
      render(<RecommendationItem icon="💧" label="Água" value="Test" />);

      const label = screen.getByText(/Água:/);
      expect(label).toHaveClass("text-nowrap");
    });

    it("should render complex values with lists", () => {
      render(
        <RecommendationItem
          icon="✨"
          label="Tratamentos"
          value={
            <ul>
              <li>Sessão 1</li>
              <li>Sessão 2</li>
            </ul>
          }
        />,
      );

      expect(screen.getByText("Sessão 1")).toBeInTheDocument();
      expect(screen.getByText("Sessão 2")).toBeInTheDocument();
    });
  });
});
