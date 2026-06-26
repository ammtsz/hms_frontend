import React from "react";
import { render, screen } from "@testing-library/react";
import { PhysiotherapyDetails } from "../PhysiotherapyDetails";

describe("PhysiotherapyDetails", () => {
  const defaultProps = {
    bodyLocations: ["Head", "Chest"],
  };

  it("should render physiotherapy title", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
  });

  it("should display body locations correctly", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.getByText(/Locations:/)).toBeInTheDocument();
    expect(screen.getByText(/Head, Chest/)).toBeInTheDocument();
  });

  it("should display single body location without plural", () => {
    render(<PhysiotherapyDetails bodyLocations={["Head"]} />);

    expect(screen.getByText(/Location:/)).toBeInTheDocument();
    expect(screen.getByText("Head")).toBeInTheDocument();
  });

  it("should display duration when durationMinutes is provided", () => {
    render(<PhysiotherapyDetails {...defaultProps} durationMinutes={45} />);

    expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
  });

  it("should not display duration when durationMinutes is not provided", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
  });

  it("should display sessions when showSessions is true", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="2/5"
        showSessions={true}
      />,
    );

    expect(screen.getByText(/Session:/)).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });

  it("should use custom session label", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="3/10"
        showSessions={true}
        sessionLabel="Scheduled sessions"
      />,
    );

    expect(screen.getByText(/Scheduled sessions:/)).toBeInTheDocument();
  });

  it("should not display sessions when showSessions is false", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        sessionNumber="2/5"
        showSessions={false}
      />,
    );

    expect(screen.queryByText(/Session:/)).not.toBeInTheDocument();
  });

  it("should display notes when provided", () => {
    render(
      <PhysiotherapyDetails
        {...defaultProps}
        notes="Patient responded well to treatment"
      />,
    );

    expect(screen.getByText(/Treatment notes:/)).toBeInTheDocument();
    expect(
      screen.getByText("Patient responded well to treatment"),
    ).toBeInTheDocument();
  });

  it("should not display notes when not provided", () => {
    render(<PhysiotherapyDetails {...defaultProps} />);

    expect(screen.queryByText(/Treatment notes:/)).not.toBeInTheDocument();
  });

  it("should apply disabled styling when isAbsent is true", () => {
    const { container } = render(
      <PhysiotherapyDetails {...defaultProps} isAbsent={true} />,
    );

    const detailBox = container.querySelector(".border-l-gray-400");
    expect(detailBox).toBeInTheDocument();
  });

  it("should apply physiotherapy styling when isAbsent is false", () => {
    const { container } = render(
      <PhysiotherapyDetails {...defaultProps} isAbsent={false} />,
    );

    const detailBox = container.querySelector(".border-l-yellow-500");
    expect(detailBox).toBeInTheDocument();
  });

  it("should render all properties together", () => {
    render(
      <PhysiotherapyDetails
        bodyLocations={["Head", "Chest", "Legs"]}
        durationMinutes={60}
        sessionNumber="3/5"
        showSessions={true}
        notes="Treatment progressing well"
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    expect(screen.getByText(/Head, Chest, Legs/)).toBeInTheDocument();
    expect(screen.getByText(/60 min/)).toBeInTheDocument();
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
    expect(screen.getByText("Treatment progressing well")).toBeInTheDocument();
  });
});
