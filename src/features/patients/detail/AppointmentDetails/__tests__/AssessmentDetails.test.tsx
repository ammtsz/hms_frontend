import React from "react";
import { render, screen } from "@testing-library/react";
import { AssessmentDetails } from "../AssessmentDetails";
import { ASSESSMENT_DETAILS_TITLE } from "@/utils/appointmentStatusLabels";

describe("AssessmentDetails", () => {
  it("should render default title", () => {
    render(<AssessmentDetails />);

    expect(screen.getByText(ASSESSMENT_DETAILS_TITLE)).toBeInTheDocument();
  });

  it("should render custom title", () => {
    render(<AssessmentDetails title="🙏 Medical Treatment" />);

    expect(screen.getByText(/Medical Treatment/)).toBeInTheDocument();
  });

  it("should display assessment notes when provided", () => {
    render(
      <AssessmentDetails preConsultationNotes="Patient reports improvement" />,
    );

    expect(screen.getByText(/Pre-consultation notes:/)).toBeInTheDocument();
    expect(screen.getByText("Patient reports improvement")).toBeInTheDocument();
  });

  it("should display treatment record notes when provided", () => {
    render(
      <AssessmentDetails consultationNotes="Notes on medical progress" />,
    );

    expect(screen.getByText(/Assessment notes:/)).toBeInTheDocument();
    expect(
      screen.getByText("Notes on medical progress"),
    ).toBeInTheDocument();
  });

  it("should display both assessment and treatment notes", () => {
    render(
      <AssessmentDetails
        preConsultationNotes="Notes before consultation"
        consultationNotes="Notes during the consultation"
      />,
    );

    expect(screen.getByText("Notes before consultation")).toBeInTheDocument();
    expect(screen.getByText("Notes during the consultation")).toBeInTheDocument();
  });

  it("should display food recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          food: "Avoid red meats",
        }}
      />,
    );

    expect(screen.getByText(/Food/)).toBeInTheDocument();
    expect(screen.getByText("Avoid red meats")).toBeInTheDocument();
  });

  it("should display water recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          water: "Water 3x daily",
        }}
      />,
    );

    expect(screen.getAllByText(/Water/)[0]).toBeInTheDocument();
    expect(screen.getByText("Water 3x daily")).toBeInTheDocument();
  });

  it("should display ointment recommendation", () => {
    render(
      <AssessmentDetails
        recommendations={{
          ointment: "Apply to affected area",
        }}
      />,
    );

    expect(screen.getByText(/Ointment/)).toBeInTheDocument();
    expect(screen.getByText("Apply to affected area")).toBeInTheDocument();
  });

  it("should display return weeks", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 4,
        }}
      />,
    );

    expect(screen.getByText(/Return/)).toBeInTheDocument();
    expect(screen.getByText("4 weeks")).toBeInTheDocument();
  });

  it("should display singular for 1 week", () => {
    render(
      <AssessmentDetails
        recommendations={{
          returnWeeks: 1,
        }}
      />,
    );

    expect(screen.getByText("1 week")).toBeInTheDocument();
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
      screen.getByText("return on the last day of treatment"),
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
      screen.getByText(/2 weeks after treatment ends/),
    ).toBeInTheDocument();
  });

  it("should display physiotherapy sessions", () => {
    const physiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Head",
        plannedSessions: 3,
        completedSessions: 0,
        color: "Blue",
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails
        physiotherapySessions={physiotherapySessions}
        recommendations={{}}
      />,
    );

    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    expect(screen.getByText(/3 sessions - Head/)).toBeInTheDocument();
  });

  it("should display tens sessions", () => {
    const tensSessions = [
      {
        id: 2,
        treatmentType: "tens" as const,
        bodyLocation: "Right Foot",
        plannedSessions: 5,
        completedSessions: 0,
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails tensSessions={tensSessions} recommendations={{}} />,
    );

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
    expect(screen.getByText(/5 sessions - Right Foot/)).toBeInTheDocument();
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

  it("should display first appointment message when isFirstAppointment is true", () => {
    render(<AssessmentDetails isFirstAppointment={true} />);

    expect(
      screen.getByText(/Return appointment scheduled/),
    ).toBeInTheDocument();
  });

  it("should display return appointment message when isFirstAppointment is false", () => {
    render(<AssessmentDetails isFirstAppointment={false} />);

    expect(screen.getByText(/First appointment scheduled/)).toBeInTheDocument();
  });

  it("should not display recommendations section when no recommendations", () => {
    render(<AssessmentDetails />);

    expect(screen.queryByText(/Recommendations:/)).not.toBeInTheDocument();
  });

  it("should render all recommendations together", () => {
    const physiotherapySessions = [
      {
        id: 1,
        treatmentType: "physiotherapy" as const,
        bodyLocation: "Head",
        plannedSessions: 2,
        completedSessions: 0,
        color: "Blue",
        status: "scheduled",
      },
    ];

    render(
      <AssessmentDetails
        preConsultationNotes="Patient shows good receptivity"
        consultationNotes="Oriented about treatment"
        recommendations={{
          food: "Avoid red meat",
          water: "Water",
          ointment: "Apply 2x daily",
          returnWeeks: 3,
        }}
        physiotherapySessions={physiotherapySessions}
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/Recommendations:/)).toBeInTheDocument();
    expect(screen.getByText("Avoid red meat")).toBeInTheDocument();
    expect(screen.getAllByText(/Water/)[0]).toBeInTheDocument();
    expect(screen.getByText("Apply 2x daily")).toBeInTheDocument();
    expect(screen.getByText("3 weeks")).toBeInTheDocument();
    expect(screen.getByText(/2 sessions - Head/)).toBeInTheDocument();
  });
});
