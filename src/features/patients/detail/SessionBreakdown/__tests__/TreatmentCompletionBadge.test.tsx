import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TreatmentCompletionBadge } from "../TreatmentCompletionBadge";

describe("TreatmentCompletionBadge", () => {
  describe("Status Display", () => {
    it("renders completed status correctly", () => {
      render(
        <TreatmentCompletionBadge
          completionPercentage={100}
          status="completed"
          showCompletionPercentage
        />,
      );

      expect(screen.getByText("Concluído")).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
      expect(screen.getByText("(100%)")).toBeInTheDocument();
    });

    it("renders scheduled status correctly", () => {
      render(
        <TreatmentCompletionBadge
          completionPercentage={30}
          status="scheduled"
          showCompletionPercentage
        />,
      );

      expect(screen.getByText("Agendado")).toBeInTheDocument();
      expect(screen.getByText("📅")).toBeInTheDocument();
      expect(screen.getByText("(30%)")).toBeInTheDocument();
    });
  });

  describe("Milestone Display", () => {
    it("shows milestone for 25%+ completion", () => {
      render(
        <TreatmentCompletionBadge
          completionPercentage={30}
          status="in_progress"
          showMilestone
        />,
      );

      expect(screen.getByText("🔄")).toBeInTheDocument();
      expect(screen.getByText("Progredindo")).toBeInTheDocument();
    });
  });

  describe("Color Schemes", () => {
    it("applies gray colors for scheduled status", () => {
      const { container } = render(
        <TreatmentCompletionBadge
          completionPercentage={30}
          status="scheduled"
        />,
      );

      expect(container.querySelector(".bg-gray-100")).toBeInTheDocument();
      expect(container.querySelector(".text-gray-700")).toBeInTheDocument();
    });
  });
});
