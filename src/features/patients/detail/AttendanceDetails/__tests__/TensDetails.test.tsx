import React from "react";
import { render, screen } from "@testing-library/react";
import { TensDetails } from "../TensDetails";

describe("TensDetails", () => {
  const defaultProps = {
    bodyLocations: ["Right Foot", "Left Knee"],
  };

  it("should render tens title", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
  });

  it("should display body locations correctly", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.getByText(/Locations:/)).toBeInTheDocument();
    expect(screen.getByText(/Right Foot, Left Knee/)).toBeInTheDocument();
  });

  it("should display single body location with singular label", () => {
    render(<TensDetails bodyLocations={["Right Foot"]} />);

    expect(screen.getByText(/Location:/)).toBeInTheDocument();
    expect(screen.getByText("Right Foot")).toBeInTheDocument();
  });

  it("should display sessions when showSessions is true", () => {
    render(
      <TensDetails {...defaultProps} sessionNumber="3/5" showSessions={true} />,
    );

    expect(screen.getByText(/Sessions:/)).toBeInTheDocument();
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
  });

  it("should use custom session label", () => {
    render(
      <TensDetails
        {...defaultProps}
        sessionNumber="2/4"
        showSessions={true}
        sessionLabel="Applications"
      />,
    );

    expect(screen.getByText(/Applications:/)).toBeInTheDocument();
  });

  it("should not display sessions when showSessions is false", () => {
    render(
      <TensDetails
        {...defaultProps}
        sessionNumber="3/5"
        showSessions={false}
      />,
    );

    expect(screen.queryByText(/Sessions:/)).not.toBeInTheDocument();
  });

  it("should display notes when provided", () => {
    render(
      <TensDetails
        {...defaultProps}
        notes="Patient felt improvement in the knee"
      />,
    );

    expect(screen.getByText(/Treatment notes:/)).toBeInTheDocument();
    expect(
      screen.getByText("Patient felt improvement in the knee"),
    ).toBeInTheDocument();
  });

  it("should not display notes when not provided", () => {
    render(<TensDetails {...defaultProps} />);

    expect(screen.queryByText(/Treatment notes:/)).not.toBeInTheDocument();
  });

  it("should apply disabled styling when isAbsent is true", () => {
    const { container } = render(
      <TensDetails {...defaultProps} isAbsent={true} />,
    );

    const detailBox = container.querySelector(".border-l-gray-400");
    expect(detailBox).toBeInTheDocument();
  });

  it("should apply tens styling when isAbsent is false", () => {
    const { container } = render(
      <TensDetails {...defaultProps} isAbsent={false} />,
    );

    const detailBox = container.querySelector(".border-l-blue-500");
    expect(detailBox).toBeInTheDocument();
  });

  it("should render all properties together", () => {
    render(
      <TensDetails
        bodyLocations={["Right Foot", "Knee", "Back"]}
        sessionNumber="4/6"
        showSessions={true}
        sessionLabel="Treatments"
        notes="Patient shows positive progress"
        isAbsent={false}
      />,
    );

    expect(screen.getByText(/TENS/)).toBeInTheDocument();
    expect(screen.getByText(/Right Foot, Knee, Back/)).toBeInTheDocument();
    expect(screen.getByText(/Treatments:/)).toBeInTheDocument();
    expect(screen.getByText(/4\/6/)).toBeInTheDocument();
    expect(
      screen.getByText("Patient shows positive progress"),
    ).toBeInTheDocument();
  });

  it("should handle empty body locations array", () => {
    render(<TensDetails bodyLocations={[]} />);

    // Should still render with empty locations
    expect(screen.getByText(/TENS/)).toBeInTheDocument();
  });
});
