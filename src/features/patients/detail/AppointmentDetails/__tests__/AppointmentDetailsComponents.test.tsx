import React from "react";
import { render, screen } from "@testing-library/react";
import { PhysiotherapyDetails } from "../PhysiotherapyDetails";
import { TensDetails } from "../TensDetails";
import { AssessmentDetails } from "../AssessmentDetails";
import { ASSESSMENT_DETAILS_TITLE } from "@/utils/appointmentStatusLabels";
import { TreatmentDetailsContainer } from "../TreatmentDetailsContainer";
import { NotesBox } from "../helpers/treatmentHelpers";

describe("AppointmentDetails components", () => {
  describe("PhysiotherapyDetails", () => {
    it("renders physiotherapy details correctly", () => {
      render(
        <PhysiotherapyDetails
          bodyLocations={["Head", "Shoulder"]}
          color="blue"
          duration={21}
          sessionNumber={"1/3"}
          showSessions={true}
          sessionLabel="Sessions"
        />,
      );

      expect(screen.getByText(/✨ Physiotherapy/)).toBeInTheDocument();
      expect(screen.getByText("blue")).toBeInTheDocument();
      expect(screen.getByText(/Head, Shoulder/)).toBeInTheDocument();
      expect(screen.getByText(/21 units/)).toBeInTheDocument();
      expect(screen.getByText(/Sessions:/)).toBeInTheDocument();
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    it("renders without optional props", () => {
      render(<PhysiotherapyDetails bodyLocations={["Head"]} />);

      expect(screen.getByText(/✨ Physiotherapy/)).toBeInTheDocument();
      expect(screen.getByText("Head")).toBeInTheDocument();
    });
  });

  describe("TensDetails", () => {
    it("renders tens details correctly", () => {
      render(
        <TensDetails
          bodyLocations={["Right Ankle"]}
          sessionNumber={"2/3"}
          showSessions={true}
          sessionLabel="Sessions"
        />,
      );

      expect(screen.getByText(/🪄 TENS/)).toBeInTheDocument();
      expect(screen.getByText(/Right Ankle/)).toBeInTheDocument();
      expect(screen.getByText(/Session/)).toBeInTheDocument();
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

      expect(screen.getByText(/Treatment notes/)).toBeInTheDocument();
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

      expect(screen.getByText(/Session notes/)).toBeInTheDocument();
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

      expect(screen.getByText(/Observations/)).toBeInTheDocument();
      expect(screen.getByText(/Patient was absent/)).toBeInTheDocument();
    });
  });

  describe("AssessmentDetails", () => {
    it("renders recommendations correctly", () => {
      const recommendations = {
        food: "Avoid red meat",
        water: "Drink water",
        physiotherapy: true,
        returnWeeks: 4,
      };

      render(<AssessmentDetails recommendations={recommendations} />);

      expect(screen.getByText(ASSESSMENT_DETAILS_TITLE)).toBeInTheDocument();
      expect(screen.getByText("Recommendations:")).toBeInTheDocument();
      expect(screen.getByText("Avoid red meat")).toBeInTheDocument();
      expect(screen.getByText("Drink water")).toBeInTheDocument();
      expect(screen.getByText("4 weeks")).toBeInTheDocument();
    });

    it("renders recommendations with treatment session details", () => {
      const recommendations = {
        food: "Avoid red meat",
        water: "Drink water",
        returnWeeks: 4,
      };

      const physiotherapySessions = [
        {
          id: 1,
          treatmentType: "physiotherapy" as const,
          bodyLocation: "Head",
          plannedSessions: 3,
          completedSessions: 0,
          color: "blue",
          status: "active",
        },
      ];

      const tensSessions = [
        {
          id: 2,
          treatmentType: "tens" as const,
          bodyLocation: "shoulder",
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

      expect(screen.getByText(ASSESSMENT_DETAILS_TITLE)).toBeInTheDocument();
      expect(screen.getByText("Recommendations:")).toBeInTheDocument();
      expect(screen.getByText("Avoid red meat")).toBeInTheDocument();
      expect(screen.getByText("Drink water")).toBeInTheDocument();
      expect(
        screen.getByText("3 sessions - Head (color: blue)"),
      ).toBeInTheDocument();
      expect(screen.getByText("2 sessions - shoulder")).toBeInTheDocument();
      expect(screen.getByText("4 weeks")).toBeInTheDocument();
    });

    it("renders without treatment sessions when not provided", () => {
      const recommendations = {
        food: "Avoid red meat",
        returnWeeks: 2,
      };

      render(<AssessmentDetails recommendations={recommendations} />);

      expect(screen.getByText(ASSESSMENT_DETAILS_TITLE)).toBeInTheDocument();
      expect(screen.getByText("Recommendations:")).toBeInTheDocument();
      expect(screen.getByText("Avoid red meat")).toBeInTheDocument();
      expect(screen.getByText("2 weeks")).toBeInTheDocument();
      // Should not show physiotherapy or tens without sessions
      expect(screen.queryByText(/Physiotherapy/)).not.toBeInTheDocument();
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
