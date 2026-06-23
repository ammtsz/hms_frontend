import React from "react";
import { render, screen } from "@/utils/testUtils";
import { TreatmentRecommendationsDisplay } from "../TreatmentRecommendationsDisplay";
import { CONSULTATION_NOTES_HEADING } from "@/utils/appointmentStatusLabels";
import { Recommendations } from "@/types/types";

const mockRecommendations = {
  date: "2024-12-20",
  food: "Light meals",
  water: "2L/day",
  ointment: "Apply 2x daily",
  returnWeeks: 4,
};

const mockPhysiotherapySessions = [
  {
    id: 1,
    treatmentType: "physiotherapy" as const,
    bodyLocation: "Head",
    plannedSessions: 3,
    completedSessions: 1,
    color: "Blue",
    status: "active",
  },
];

const mockTensSessions = [
  {
    id: 2,
    treatmentType: "tens" as const,
    bodyLocation: "Back",
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

    expect(screen.getByText(/Latest Recommendations/)).toBeInTheDocument();
    expect(screen.getByText("🍎 Food:")).toBeInTheDocument();
    expect(screen.getByText("💧 Water:")).toBeInTheDocument();
    expect(screen.getByText("🧴 Ointment:")).toBeInTheDocument();
    expect(
      screen.getByText(/✨ Physiotherapy \(1 active treatment\):/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/🪄 TENS \(1 active treatment\):/),
    ).toBeInTheDocument();
    expect(screen.getByText("📅 Return:")).toBeInTheDocument();
  });

  it("displays recommendation values correctly", () => {
    render(
      <TreatmentRecommendationsDisplay
        recommendations={mockRecommendations}
        physiotherapySessions={mockPhysiotherapySessions}
        tensSessions={mockTensSessions}
      />,
    );

    expect(screen.getByText("Light meals")).toBeInTheDocument();
    expect(screen.getByText("2L/day")).toBeInTheDocument();
    expect(screen.getByText("Apply 2x daily")).toBeInTheDocument();
    expect(screen.getByText("4 weeks")).toBeInTheDocument();
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
      screen.getByText(/3 sessions: Head \(color: Blue\)/),
    ).toBeInTheDocument();

    // TENS details
    expect(screen.getByText(/5 sessions: Back/)).toBeInTheDocument();
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

    expect(screen.getByText("No recommendations recorded")).toBeInTheDocument();
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

    expect(screen.getByText(/Latest Recommendations/)).toBeInTheDocument();
    expect(
      screen.getByText(/✨ Physiotherapy \(1 active treatment\):/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3 sessions: Head \(color: Blue\)/),
    ).toBeInTheDocument();
    expect(screen.queryByText("🍎 Food:")).not.toBeInTheDocument();
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

    expect(screen.getByText(/Date not available/)).toBeInTheDocument();
  });

  it("formats multiple sessions of the same treatment type", () => {
    const multiplePhysiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Head",
        plannedSessions: 3,
        completedSessions: 1,
        color: "Blue",
        status: "active",
      },
      {
        id: 2,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Right Hand",
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
      screen.getByText(/3 sessions: Head \(color: Blue\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 session: Right Hand/)).toBeInTheDocument();
  });

  it("displays consultation notes when present", () => {
    const recommendationsWithNotes = {
      ...mockRecommendations,
      notes: "Patient showed significant symptom improvement.",
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={recommendationsWithNotes}
      />,
    );

    expect(screen.getByText(CONSULTATION_NOTES_HEADING)).toBeInTheDocument();
    expect(
      screen.getByText("Patient showed significant symptom improvement."),
    ).toBeInTheDocument();
  });

  it("does not display notes section when notes are empty", () => {
    render(
      <TreatmentRecommendationsDisplay recommendations={mockRecommendations} />,
    );

    expect(
      screen.queryByText(CONSULTATION_NOTES_HEADING),
    ).not.toBeInTheDocument();
  });

  it("includes notes in hasRecommendations check", () => {
    const onlyNotesRecommendations = {
      date: "2024-12-20",
      notes: "Important notes about the patient.",
    };

    render(
      <TreatmentRecommendationsDisplay
        recommendations={onlyNotesRecommendations}
        physiotherapySessions={[]}
        tensSessions={[]}
      />,
    );

    expect(screen.getByText(/Latest Recommendations/)).toBeInTheDocument();
    expect(
      screen.getByText("Important notes about the patient."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No recommendations recorded"),
    ).not.toBeInTheDocument();
  });
});
