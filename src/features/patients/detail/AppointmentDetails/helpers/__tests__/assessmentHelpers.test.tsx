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
          bodyLocation: "Head",
          plannedSessions: 3,
          completedSessions: 0,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["3 sessions - Head"]);
    });

    it("should format single session (1 session)", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "tens",
          bodyLocation: "Right Foot",
          plannedSessions: 1,
          completedSessions: 0,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["1 session - Right Foot"]);
    });

    it("should include duration when present", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "physiotherapy",
          bodyLocation: "Chest",
          plannedSessions: 5,
          completedSessions: 0,
          durationMinutes: 45,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual(["5 sessions - Chest (45 min)"]);
    });

    it("should format multiple sessions", () => {
      const sessions: ActiveTreatmentRow[] = [
        {
          id: 1,
          treatmentType: "physiotherapy",
          bodyLocation: "Head",
          plannedSessions: 3,
          completedSessions: 0,
          durationMinutes: 45,
          status: "scheduled",
        },
        {
          id: 2,
          treatmentType: "physiotherapy",
          bodyLocation: "Chest",
          plannedSessions: 2,
          completedSessions: 0,
          durationMinutes: 30,
          status: "scheduled",
        },
      ];

      const result = formatActiveTreatmentRows(sessions);

      expect(result).toEqual([
        "3 sessions - Head (45 min)",
        "2 sessions - Chest (30 min)",
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

      expect(result).toEqual(["4 sessions - not specified"]);
    });
  });

  describe("RecommendationItem", () => {
    it("should render icon and label", () => {
      render(
        <RecommendationItem
          icon="🏠"
          label="Home Exercises"
          value="Cat-camel and pelvic tilt, 3x daily"
        />,
      );

      expect(screen.getByText(/🏠/)).toBeInTheDocument();
      expect(screen.getByText(/Home Exercises:/)).toBeInTheDocument();
      expect(screen.getByText("Cat-camel and pelvic tilt, 3x daily")).toBeInTheDocument();
    });

    it("should render with string value", () => {
      render(
        <RecommendationItem
          icon="💆"
          label="Pain Management"
          value="Ice 15 min after activity"
        />,
      );

      expect(screen.getByText("Ice 15 min after activity")).toBeInTheDocument();
    });

    it("should render with React element value", () => {
      render(
        <RecommendationItem
          icon="✨"
          label="Physiotherapy"
          value={<span>Custom element</span>}
        />,
      );

      expect(screen.getByText("Custom element")).toBeInTheDocument();
    });

    it("should apply fullWidth class when fullWidth is true", () => {
      const { container } = render(
        <RecommendationItem
          icon="📅"
          label="Return"
          value="3 weeks"
          fullWidth={true}
        />,
      );

      const item = container.firstChild as HTMLElement;
      expect(item).toHaveClass("sm:col-span-2");
    });

    it("should not apply fullWidth class by default", () => {
      const { container } = render(
        <RecommendationItem
          icon="💊"
          label="Medications"
          value="Diclofenac gel twice daily as directed"
        />,
      );

      const item = container.firstChild as HTMLElement;
      expect(item).not.toHaveClass("sm:col-span-2");
    });

    it("should have correct styling classes", () => {
      const { container } = render(
        <RecommendationItem icon="🏠" label="Home Exercises" value="Cat-camel, 10 reps" />,
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
      render(
        <RecommendationItem
          icon="💆"
          label="Pain Management"
          value="Ice 15 min after activity"
        />,
      );

      const label = screen.getByText(/Pain Management:/);
      expect(label).toHaveClass("text-nowrap");
    });

    it("should render complex values with lists", () => {
      render(
        <RecommendationItem
          icon="✨"
          label="Treatments"
          value={
            <ul>
              <li>Session 1</li>
              <li>Session 2</li>
            </ul>
          }
        />,
      );

      expect(screen.getByText("Session 1")).toBeInTheDocument();
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });
  });
});
